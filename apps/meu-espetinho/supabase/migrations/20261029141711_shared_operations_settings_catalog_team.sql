-- Shared by Meu Espetinho and Sr. Padeiro in the gritnews database.
create table public.operation_support_sessions (
 id uuid primary key default gen_random_uuid(), app text not null check(app in ('meu-espetinho','sr-padeiro')),
 scope_id uuid not null, admin_id uuid not null references auth.users(id), reason text not null check(length(reason) between 3 and 300),
 expires_at timestamptz not null default now()+interval '1 hour', revoked_at timestamptz, created_at timestamptz not null default now()
);
create index operation_support_lookup on public.operation_support_sessions(app,scope_id,admin_id,expires_at) where revoked_at is null;
create table public.operation_preferences (
 app text not null check(app in ('meu-espetinho','sr-padeiro')),scope_id uuid not null,
 preferences jsonb not null default '{}' check(jsonb_typeof(preferences)='object' and octet_length(preferences::text)<12000),
 updated_at timestamptz not null default now(), primary key(app,scope_id)
);
create table public.operation_audit (
 id uuid primary key default gen_random_uuid(),app text not null,scope_id uuid not null,
 actor_id uuid references auth.users(id),action text not null,details jsonb not null default '{}',created_at timestamptz not null default now()
);
create index operation_audit_scope on public.operation_audit(app,scope_id,created_at desc);
create table public.operation_imports (
 app text not null,scope_id uuid not null,request_id uuid not null,result jsonb not null,
 created_at timestamptz not null default now(),primary key(app,scope_id,request_id)
);
create table public.operation_invites (
 id uuid primary key default gen_random_uuid(),app text not null,scope_id uuid not null,email text not null,
 full_name text not null,role text not null,token_hash text not null unique,invited_by uuid references auth.users(id),
 expires_at timestamptz not null default now()+interval '7 days',accepted_at timestamptz,revoked_at timestamptz,created_at timestamptz not null default now()
);
create index operation_invites_scope on public.operation_invites(app,scope_id,created_at desc);

create function private.ops_super() returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.admin_users where user_id=auth.uid() and active and role='superadmin')
$$;
create function private.ops_support(a text,s uuid) returns boolean language sql stable security definer set search_path='' as $$
 select private.ops_super() and exists(select 1 from public.operation_support_sessions where app=a and scope_id=s and admin_id=auth.uid() and revoked_at is null and expires_at>now())
$$;
create function private.ops_access(a text,s uuid,manage boolean default false) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and (private.ops_support(a,s) or
 (a='meu-espetinho' and exists(select 1 from public.tenants t where t.id=s and (t.owner_user_id=auth.uid() or exists(
  select 1 from public.tenant_users m where m.tenant_id=s and m.user_id=auth.uid() and m.active and (not manage or m.role in ('owner','manager')))))) or
 (a='sr-padeiro' and exists(select 1 from public.srp_organizations o where o.id=s and (o.owner_user_id=auth.uid() or exists(
  select 1 from public.srp_members m where m.organization_id=s and m.user_id=auth.uid() and m.active and (not manage or m.role in ('owner','manager')))))))
$$;
create function private.ops_catalog_access(a text,s uuid) returns boolean language sql stable security definer set search_path='' as $$
 select private.ops_access(a,s,true) or (a='sr-padeiro' and exists(select 1 from public.srp_members where organization_id=s and user_id=auth.uid() and active and role='stockist'))
$$;

alter table public.operation_support_sessions enable row level security;
alter table public.operation_preferences enable row level security;
alter table public.operation_audit enable row level security;
alter table public.operation_imports enable row level security;
alter table public.operation_invites enable row level security;
revoke all on public.operation_support_sessions,public.operation_preferences,public.operation_audit,public.operation_imports,public.operation_invites from public,anon,authenticated;
grant select on public.operation_support_sessions,public.operation_preferences,public.operation_audit to authenticated;
grant insert,update on public.operation_preferences to authenticated;
create policy ops_support_read on public.operation_support_sessions for select to authenticated using(admin_id=auth.uid() and private.ops_super());
create policy ops_preferences_read on public.operation_preferences for select to authenticated using(private.ops_access(app,scope_id));
create policy ops_preferences_insert on public.operation_preferences for insert to authenticated with check(private.ops_access(app,scope_id,true));
create policy ops_preferences_update on public.operation_preferences for update to authenticated using(private.ops_access(app,scope_id,true)) with check(private.ops_access(app,scope_id,true));
create policy ops_audit_read on public.operation_audit for select to authenticated using(private.ops_access(app,scope_id,true));

create function private.ops_preferences_audit() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if exists(select 1 from jsonb_each(new.preferences) e where
  (e.key in ('businessName','address','phone','taxId','logoUrl','footer','printerHint') and jsonb_typeof(e.value)<>'string') or
  (e.key in ('showLogo','showAddress','showPhone','showTaxId','showOperator') and jsonb_typeof(e.value)<>'boolean') or
  (e.key in ('paperWidth','fontSize','copies') and jsonb_typeof(e.value)<>'number')) then raise exception 'invalid_preference_types';end if;
 if coalesce(new.preferences->>'businessName','')='' or length(new.preferences->>'businessName')>120
 or coalesce(new.preferences->>'paperWidth','80') not in ('58','80')
 or coalesce(new.preferences->>'fontSize','12') not in ('10','12','14','16','18')
 or coalesce(new.preferences->>'copies','1') not in ('1','2','3')
 or length(coalesce(new.preferences->>'footer',''))>300
 or length(coalesce(new.preferences->>'address',''))>240
 or length(coalesce(new.preferences->>'phone',''))>40
 or length(coalesce(new.preferences->>'taxId',''))>30
 or length(coalesce(new.preferences->>'printerHint',''))>100
 or (coalesce(new.preferences->>'logoUrl','')<>'' and new.preferences->>'logoUrl' !~ '^https://')
 then raise exception 'invalid_preferences'; end if;
 new.updated_at=now();
 insert into public.operation_audit(app,scope_id,actor_id,action) values(new.app,new.scope_id,auth.uid(),'preferences_saved');return new;
end $$;
create trigger ops_preferences_audit before insert or update on public.operation_preferences for each row execute function private.ops_preferences_audit();

create function private.ops_start_support(a text,s uuid,reason text) returns jsonb language plpgsql security definer set search_path='' as $$
declare exp timestamptz:=now()+interval '1 hour';
begin
 if not private.ops_super() then raise exception 'forbidden' using errcode='42501';end if;
 if length(trim(reason)) not between 3 and 300 then raise exception 'invalid_reason';end if;
 if not ((a='meu-espetinho' and exists(select 1 from public.tenants where id=s)) or (a='sr-padeiro' and exists(select 1 from public.srp_organizations where id=s))) then raise exception 'scope_not_found';end if;
 update public.operation_support_sessions set revoked_at=now() where app=a and scope_id=s and admin_id=auth.uid() and revoked_at is null;
 insert into public.operation_support_sessions(app,scope_id,admin_id,reason,expires_at) values(a,s,auth.uid(),trim(reason),exp);
 -- Preserve compatibility with the legacy tenant RLS and current_user_tenants RPC.
 if a='meu-espetinho' then perform private.start_support_access(s,reason);end if;
 insert into public.operation_audit(app,scope_id,actor_id,action,details) values(a,s,auth.uid(),'support_started',jsonb_build_object('reason',reason,'expires_at',exp));
 return jsonb_build_object('expires_at',exp);
end $$;
create function public.ops_start_support(a text,s uuid,reason text) returns jsonb language sql security invoker set search_path='' as $$select private.ops_start_support(a,s,reason)$$;
create function public.ops_support_context(a text,s uuid) returns boolean language sql security invoker set search_path='' as $$select private.ops_support(a,s)$$;
create function private.ops_end_support(a text,s uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.ops_super() then raise exception 'forbidden';end if;
 update public.operation_support_sessions set revoked_at=now() where app=a and scope_id=s and admin_id=auth.uid() and revoked_at is null;
 if a='meu-espetinho' then update public.support_access_grants set revoked_at=now() where tenant_id=s and admin_user_id=auth.uid() and revoked_at is null;end if;
 insert into public.operation_audit(app,scope_id,actor_id,action) values(a,s,auth.uid(),'support_ended');
end $$;
create function public.ops_end_support(a text,s uuid) returns void language sql security invoker set search_path='' as $$select private.ops_end_support(a,s)$$;

-- Restore role-based management: broad ALL membership policies permit escalation.
drop policy if exists "tenant memberships" on public.tenant_users;
drop policy if exists "tenant owner manages memberships" on public.tenant_users;
create policy ops_members_read on public.tenant_users for select to authenticated using(private.ops_access('meu-espetinho',tenant_id));
-- Writes go through the audited RPCs below; no client can promote itself.
revoke insert,update,delete on public.tenant_users from authenticated;

create function private.ops_team(a text,s uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare members jsonb;invites jsonb;
begin
 if not private.ops_access(a,s,true) then raise exception 'forbidden' using errcode='42501';end if;
 if a='meu-espetinho' then
  select coalesce(jsonb_agg(x),'[]') into members from (
   select u.id as user_id,u.email,coalesce(p.full_name,u.email) as name,'owner' as role,true as active from public.tenants t join auth.users u on u.id=t.owner_user_id left join public.profiles p on p.id=u.id where t.id=s
   union all select m.user_id,u.email,coalesce(p.full_name,u.email),m.role,m.active from public.tenant_users m join auth.users u on u.id=m.user_id left join public.profiles p on p.id=m.user_id where m.tenant_id=s and m.user_id<>(select owner_user_id from public.tenants where id=s)
  )x;
 else
  select coalesce(jsonb_agg(x),'[]') into members from (
   select u.id as user_id,u.email,coalesce(p.full_name,u.email) as name,'owner' as role,true as active from public.srp_organizations o join auth.users u on u.id=o.owner_user_id left join public.profiles p on p.id=u.id where o.id=s
   union all select m.user_id,u.email,coalesce(p.full_name,u.email),m.role,m.active from public.srp_members m join auth.users u on u.id=m.user_id left join public.profiles p on p.id=m.user_id where m.organization_id=s and m.user_id<>(select owner_user_id from public.srp_organizations where id=s)
  )x;
 end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'email',email,'role',role,'expires_at',expires_at,'accepted',accepted_at is not null,'revoked',revoked_at is not null)),'[]') into invites from public.operation_invites where app=a and scope_id=s;
 return jsonb_build_object('members',members,'invites',invites);
end $$;
create function public.ops_team(a text,s uuid) returns jsonb language sql security invoker set search_path='' as $$select private.ops_team(a,s)$$;

create function private.ops_invite(a text,s uuid,email text,full_name text,member_role text) returns text language plpgsql security definer set search_path='' as $$
declare token text:=replace(gen_random_uuid()::text||gen_random_uuid()::text,'-','');
begin
 if not private.ops_access(a,s,true) then raise exception 'forbidden' using errcode='42501';end if;
 if email is null or email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or length(email)>254 or length(trim(full_name)) not between 1 and 120 then raise exception 'invalid_invite';end if;
 if member_role is null or not ((a='meu-espetinho' and member_role in ('manager','cashier','attendant')) or (a='sr-padeiro' and member_role in ('manager','cashier','stockist','viewer'))) then raise exception 'invalid_role';end if;
 perform pg_advisory_xact_lock(hashtextextended(a||s::text||lower(trim(email)),0));
 update public.operation_invites i set revoked_at=now() where i.app=a and i.scope_id=s and i.email=lower(trim(ops_invite.email)) and i.accepted_at is null and i.revoked_at is null;
 insert into public.operation_invites(app,scope_id,email,full_name,role,token_hash,invited_by) values(a,s,lower(trim(email)),trim(full_name),member_role,encode(sha256(convert_to(token,'UTF8')),'hex'),auth.uid());
 insert into public.operation_audit(app,scope_id,actor_id,action,details) values(a,s,auth.uid(),'user_invited',jsonb_build_object('role',member_role));
 return token;
end $$;
create function public.ops_invite(a text,s uuid,email text,full_name text,member_role text) returns text language sql security invoker set search_path='' as $$select private.ops_invite(a,s,email,full_name,member_role)$$;

create function private.ops_accept_invite(token text) returns jsonb language plpgsql security definer set search_path='' as $$
declare i public.operation_invites;mail text;
begin
 if auth.uid() is null then raise exception 'authentication_required';end if;
 select lower(email) into mail from auth.users where id=auth.uid() and email_confirmed_at is not null;
 select * into i from public.operation_invites where token_hash=encode(sha256(convert_to(token,'UTF8')),'hex') for update;
 if i.id is null or i.revoked_at is not null or i.expires_at<=now() or mail is distinct from i.email then raise exception 'invalid_or_expired_invite';end if;
 -- Issuer must still hold management permission when the invitation is accepted.
 if not (
  (i.app='meu-espetinho' and (exists(select 1 from public.tenants where id=i.scope_id and owner_user_id=i.invited_by) or exists(select 1 from public.tenant_users where tenant_id=i.scope_id and user_id=i.invited_by and active and role in ('owner','manager')))) or
  (i.app='sr-padeiro' and (exists(select 1 from public.srp_organizations where id=i.scope_id and owner_user_id=i.invited_by) or exists(select 1 from public.srp_members where organization_id=i.scope_id and user_id=i.invited_by and active and role in ('owner','manager')))) or
  exists(select 1 from public.admin_users a where a.user_id=i.invited_by and a.active and a.role='superadmin')
 ) then raise exception 'issuer_unavailable';end if;
 if i.accepted_at is not null then return jsonb_build_object('app',i.app,'scope_id',i.scope_id);end if;
 insert into public.profiles(id,full_name) values(auth.uid(),i.full_name)
 on conflict(id) do update set full_name=case when nullif(trim(public.profiles.full_name),'') is null then excluded.full_name else public.profiles.full_name end;
 if i.app='meu-espetinho' then insert into public.tenant_users(tenant_id,user_id,role,active) values(i.scope_id,auth.uid(),i.role,true) on conflict(tenant_id,user_id) do nothing;
 else insert into public.srp_members(organization_id,user_id,role,active) values(i.scope_id,auth.uid(),i.role,true) on conflict(organization_id,user_id) do nothing;end if;
 update public.operation_invites set accepted_at=now() where id=i.id;
 insert into public.operation_audit(app,scope_id,actor_id,action) values(i.app,i.scope_id,auth.uid(),'invite_accepted');
 return jsonb_build_object('app',i.app,'scope_id',i.scope_id);
end $$;
create function public.ops_accept_invite(token text) returns jsonb language sql security invoker set search_path='' as $$select private.ops_accept_invite(token)$$;

create function private.ops_revoke_invite(a text,s uuid,i uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.ops_access(a,s,true) then raise exception 'forbidden' using errcode='42501';end if;
 update public.operation_invites set revoked_at=now() where app=a and scope_id=s and id=i and accepted_at is null;
 if not found then raise exception 'pending_invite_not_found';end if;
 insert into public.operation_audit(app,scope_id,actor_id,action) values(a,s,auth.uid(),'invite_revoked');
end $$;
create function public.ops_revoke_invite(a text,s uuid,i uuid) returns void language sql security invoker set search_path='' as $$select private.ops_revoke_invite(a,s,i)$$;

create function private.ops_set_member(a text,s uuid,u uuid,enabled boolean) returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.ops_access(a,s,true) then raise exception 'forbidden' using errcode='42501';end if;
 if u=auth.uid() or exists(select 1 from public.tenants where a='meu-espetinho' and id=s and owner_user_id=u) or exists(select 1 from public.srp_organizations where a='sr-padeiro' and id=s and owner_user_id=u) then raise exception 'owner_or_self_locked';end if;
 if a='meu-espetinho' then update public.tenant_users set active=enabled where tenant_id=s and user_id=u;
 else update public.srp_members set active=enabled where organization_id=s and user_id=u;end if;
 if not found then raise exception 'member_not_found';end if;
 insert into public.operation_audit(app,scope_id,actor_id,action,details) values(a,s,auth.uid(),'member_status_changed',jsonb_build_object('user_id',u,'active',enabled));
end $$;
create function public.ops_set_member(a text,s uuid,u uuid,enabled boolean) returns void language sql security invoker set search_path='' as $$select private.ops_set_member(a,s,u,enabled)$$;

create function private.ops_import_catalog(a text,s uuid,r uuid,rows jsonb,mode text default 'skip') returns jsonb language plpgsql security definer set search_path='' as $$
declare item jsonb;n text;p numeric;c numeric;q numeric;cat text;unit text;pid uuid;cid uuid;store uuid;matches integer;created integer:=0;updated integer:=0;skipped integer:=0;result jsonb;
begin
 if not private.ops_catalog_access(a,s) then raise exception 'forbidden' using errcode='42501';end if;
 if r is null or rows is null or jsonb_typeof(rows)<>'array' or jsonb_array_length(rows) not between 1 and 500 or mode is null or mode not in ('skip','update') then raise exception 'invalid_import';end if;
 perform pg_advisory_xact_lock(hashtextextended(a||s::text,0));
 select i.result into result from public.operation_imports i where app=a and scope_id=s and request_id=r;
 if result is not null then return result;end if;
 if (select count(*) from jsonb_array_elements(rows))<>(select count(distinct lower(trim(x->>'name'))) from jsonb_array_elements(rows)x) then raise exception 'duplicate_names';end if;
 if a='sr-padeiro' then select id into store from public.srp_stores where organization_id=s and active order by created_at,id limit 1;if store is null then raise exception 'store_required';end if;end if;
 for item in select value from jsonb_array_elements(rows) loop
  n:=trim(item->>'name');p:=(item->>'price')::numeric;c:=(item->>'cost')::numeric;q:=coalesce((item->>'stock')::numeric,0);cat:=coalesce(nullif(trim(item->>'category'),''),'Outros');unit:=coalesce(item->>'unit','UN');
  if n is null or length(n) not between 1 and 120 or length(cat)>80 or p is null or p<=0 or p>999999 or p<>round(p,2) or (c is not null and (c<0 or c>999999 or c<>round(c,2))) or q<0 or q>999999 or q<>round(q,3) or unit not in ('UN','KG','G','L','ML','PACOTE','CAIXA') then raise exception 'invalid_product';end if;
  if a='meu-espetinho' and unit<>'UN' then raise exception 'espetinho_unit_must_be_UN';end if;
  if a='meu-espetinho' then
   select count(*),(array_agg(id))[1] into matches,pid from public.products where tenant_id=s and lower(trim(name))=lower(n);
  else select count(*),(array_agg(id))[1] into matches,pid from public.srp_products where organization_id=s and lower(trim(name))=lower(n);end if;
  if matches>1 then raise exception 'ambiguous_product_name';end if;
  if matches=1 and mode='skip' then skipped:=skipped+1;continue;end if;
  if a='meu-espetinho' then
   select id into cid from public.categories where tenant_id=s and lower(trim(name))=lower(cat) limit 1;
   if cid is null then insert into public.categories(tenant_id,name) values(s,cat) returning id into cid;end if;
   if matches=1 then update public.products set price=p,cost=c,category_id=cid where id=pid and tenant_id=s;
   else insert into public.products(tenant_id,name,price,cost,category_id,stock_qty,active) values(s,n,p,c,cid,q,true);end if;
  else
   select id into cid from public.srp_categories where organization_id=s and lower(trim(name))=lower(cat) limit 1;
   if cid is null then insert into public.srp_categories(organization_id,name) values(s,cat) returning id into cid;end if;
   if matches=1 then update public.srp_products set sale_price=p,cost_price=c,category_id=cid where id=pid and organization_id=s;
   else
    insert into public.srp_products(organization_id,name,sale_price,cost_price,category_id,unit,active) values(s,n,p,c,cid,unit,true) returning id into pid;
    insert into public.srp_inventory(organization_id,store_id,product_id,quantity,minimum_quantity) values(s,store,pid,q,0);
   end if;
  end if;
  if matches=1 then updated:=updated+1;else created:=created+1;end if;
 end loop;
 result:=jsonb_build_object('created',created,'updated',updated,'skipped',skipped);
 insert into public.operation_imports(app,scope_id,request_id,result) values(a,s,r,result);
 insert into public.operation_audit(app,scope_id,actor_id,action,details) values(a,s,auth.uid(),'catalog_imported',result);
 return result;
end $$;
create function public.ops_import_catalog(a text,s uuid,r uuid,rows jsonb,mode text default 'skip') returns jsonb language sql security invoker set search_path='' as $$select private.ops_import_catalog(a,s,r,rows,mode)$$;

-- Existing role helper is the common entrypoint of Sr. Padeiro RLS.
create or replace function private.srp_role_allowed(org_id uuid,allowed_roles text[]) returns boolean language sql stable security definer set search_path='' as $$
 select private.ops_support('sr-padeiro',org_id) or exists(select 1 from public.srp_members where organization_id=org_id and user_id=auth.uid() and active and role=any(allowed_roles))
$$;
drop policy if exists srp_org_select on public.srp_organizations;
create policy srp_org_select on public.srp_organizations for select to authenticated using(private.ops_access('sr-padeiro',id) or private.ops_super());
-- A scoped support session can also configure/test the existing fiscal module.
create or replace function private.fiscal_access(t uuid,management boolean default false) returns boolean language sql stable security definer set search_path='' as $$
 select private.ops_support('meu-espetinho',t) or (auth.uid() is not null and (
 exists(select 1 from public.tenants where id=t and owner_user_id=auth.uid()) or
 exists(select 1 from public.tenant_users where tenant_id=t and user_id=auth.uid() and active and (not management or role in ('owner','manager','cashier')))))
$$;
create policy fiscal_settings_support on public.fiscal_settings for all to authenticated using(private.ops_support('meu-espetinho',tenant_id)) with check(private.ops_support('meu-espetinho',tenant_id));
revoke all on function private.fiscal_access(uuid,boolean) from public,anon;
grant execute on function private.fiscal_access(uuid,boolean) to authenticated;
-- Storage uses a dedicated bucket and validates BOTH old and new scope paths.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('operation-logos','operation-logos',true,2097152,array['image/png','image/jpeg','image/webp']) on conflict(id) do nothing;
create policy ops_logos_read on storage.objects for select using(bucket_id='operation-logos');
create policy ops_logos_insert on storage.objects for insert to authenticated with check(bucket_id='operation-logos' and private.ops_access(split_part(name,'/',1),split_part(name,'/',2)::uuid,true));
create policy ops_logos_update on storage.objects for update to authenticated using(bucket_id='operation-logos' and private.ops_access(split_part(name,'/',1),split_part(name,'/',2)::uuid,true)) with check(bucket_id='operation-logos' and private.ops_access(split_part(name,'/',1),split_part(name,'/',2)::uuid,true));

-- Every exposed endpoint is invoker. Privileged helpers validate session and scope.
revoke all on function private.ops_super(),private.ops_support(text,uuid),private.ops_access(text,uuid,boolean),private.ops_catalog_access(text,uuid),private.ops_preferences_audit(),private.ops_start_support(text,uuid,text),private.ops_end_support(text,uuid),private.ops_team(text,uuid),private.ops_invite(text,uuid,text,text,text),private.ops_accept_invite(text),private.ops_set_member(text,uuid,uuid,boolean),private.ops_import_catalog(text,uuid,uuid,jsonb,text) from public,anon;
grant execute on function private.ops_super(),private.ops_support(text,uuid),private.ops_access(text,uuid,boolean),private.ops_catalog_access(text,uuid),private.ops_start_support(text,uuid,text),private.ops_end_support(text,uuid),private.ops_team(text,uuid),private.ops_invite(text,uuid,text,text,text),private.ops_accept_invite(text),private.ops_set_member(text,uuid,uuid,boolean),private.ops_import_catalog(text,uuid,uuid,jsonb,text) to authenticated;
revoke all on function public.ops_start_support(text,uuid,text),public.ops_support_context(text,uuid),public.ops_end_support(text,uuid),public.ops_team(text,uuid),public.ops_invite(text,uuid,text,text,text),public.ops_accept_invite(text),public.ops_set_member(text,uuid,uuid,boolean),public.ops_import_catalog(text,uuid,uuid,jsonb,text) from public,anon;
grant execute on function public.ops_start_support(text,uuid,text),public.ops_support_context(text,uuid),public.ops_end_support(text,uuid),public.ops_team(text,uuid),public.ops_invite(text,uuid,text,text,text),public.ops_accept_invite(text),public.ops_set_member(text,uuid,uuid,boolean),public.ops_import_catalog(text,uuid,uuid,jsonb,text) to authenticated;
revoke all on function private.ops_revoke_invite(text,uuid,uuid),public.ops_revoke_invite(text,uuid,uuid) from public,anon;
grant execute on function private.ops_revoke_invite(text,uuid,uuid),public.ops_revoke_invite(text,uuid,uuid) to authenticated;
