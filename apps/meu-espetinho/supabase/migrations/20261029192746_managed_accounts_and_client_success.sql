-- Password material is never persisted. Only a digest of the random temporary credential is kept.
create table public.operation_password_requirements (
 user_id uuid primary key references auth.users(id), app text not null check(app in ('meu-espetinho','sr-padeiro')),
 scope_id uuid not null,reset_id uuid not null,required boolean not null default true,temporary_hash text,
 issued_at timestamptz not null default now(),expires_at timestamptz not null,completed_at timestamptz,
 created_by uuid not null references auth.users(id),check(temporary_hash is null or temporary_hash ~ '^[0-9a-f]{64}$')
);
create table public.operation_account_leases(email text primary key,token uuid not null,expires_at timestamptz not null);
create table public.operation_success_plans (
 app text not null check(app in ('meu-espetinho','sr-padeiro')),scope_id uuid not null,
 revenue_goal numeric(14,2) check(revenue_goal>=0),next_action text not null default '' check(length(next_action)<=500),
 responsible text not null default '' check(length(responsible)<=120),due_date date,updated_by uuid references auth.users(id),
 updated_at timestamptz not null default now(),primary key(app,scope_id)
);
alter table public.operation_password_requirements enable row level security;
alter table public.operation_account_leases enable row level security;
alter table public.operation_success_plans enable row level security;
revoke all on public.operation_password_requirements,public.operation_account_leases,public.operation_success_plans from public,anon,authenticated;
grant all on public.operation_password_requirements,public.operation_account_leases,public.operation_success_plans to service_role;

create function private.ops_account_requires_change() returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and (
 exists(select 1 from public.operation_password_requirements where user_id=auth.uid() and required)
 or exists(select 1 from auth.users where id=auth.uid() and raw_app_meta_data->>'ops_password_required'='true'))
$$;
revoke all on function private.ops_account_requires_change() from public,anon;
grant execute on function private.ops_account_requires_change() to authenticated,service_role;
create function public.ops_account_request_guard() returns void language plpgsql security invoker set search_path='' as $$
begin
 if auth.uid() is null then return;end if;
 if private.ops_account_requires_change() then
  raise exception 'password_change_required' using errcode='42501';
 end if;
end $$;
revoke all on function public.ops_account_request_guard() from public;
grant execute on function public.ops_account_request_guard() to anon,authenticated,service_role;

-- Also cover Realtime and Storage, which do not run the PostgREST pre-request hook.
do $policies$ declare t record;begin
 for t in select schemaname,tablename from pg_tables where schemaname='public' and
 (tablename like 'srp\_%' escape '\' or tablename like 'operation\_%' escape '\' or tablename in
 ('tenants','tenant_users','products','categories','orders','order_items','customers','payments_received','inventory_movements','customer_credit_accounts','customer_credit_entries','cash_registers','cash_movements','fiscal_settings','fiscal_documents','fiscal_events')) loop
  execute format('create policy ops_password_gate on %I.%I as restrictive for all to authenticated using ((select not private.ops_account_requires_change())) with check ((select not private.ops_account_requires_change()))',t.schemaname,t.tablename);
 end loop;
 create policy ops_password_gate on storage.objects as restrictive for all to authenticated using((select not private.ops_account_requires_change())) with check((select not private.ops_account_requires_change()));
end $policies$;

create function private.ops_account_context(actor uuid,a text,s uuid,e text,uid uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare target auth.users;owner_id uuid;member_active boolean;links integer;
begin
 if not exists(select 1 from public.admin_users where user_id=actor and active and role='superadmin') then raise exception 'forbidden' using errcode='42501';end if;
 if a='meu-espetinho' then select owner_user_id into owner_id from public.tenants where id=s;
 elsif a='sr-padeiro' then select owner_user_id into owner_id from public.srp_organizations where id=s;
 else raise exception 'invalid_app';end if;
 if not found then raise exception 'scope_not_found';end if;
 select * into target from auth.users where (uid is not null and id=uid) or (uid is null and lower(email)=lower(e)) limit 1;
 member_active:=target.id=owner_id or
 (a='meu-espetinho' and exists(select 1 from public.tenant_users where tenant_id=s and user_id=target.id and active)) or
 (a='sr-padeiro' and exists(select 1 from public.srp_members where organization_id=s and user_id=target.id and active));
 select count(*) into links from (
 select 'meu-espetinho' app,id scope from public.tenants where owner_user_id=target.id
 union select 'meu-espetinho',tenant_id from public.tenant_users where user_id=target.id
 union select 'sr-padeiro',id from public.srp_organizations where owner_user_id=target.id
 union select 'sr-padeiro',organization_id from public.srp_members where user_id=target.id)x;
 return jsonb_build_object('user_id',target.id,'email',target.email,'email_confirmed',target.email_confirmed_at is not null,
 'protected',exists(select 1 from public.admin_users where user_id=target.id),'member_active',coalesce(member_active,false),'linked_companies',links);
end $$;
create function public.ops_account_context(actor uuid,a text,s uuid,e text default null,uid uuid default null) returns jsonb language sql security invoker set search_path='' as $$select private.ops_account_context(actor,a,s,e,uid)$$;

create function private.ops_account_lease(e text,k uuid,done boolean) returns boolean language plpgsql security definer set search_path='' as $$
declare acquired uuid;
begin
 if e is null or k is null then return false;end if;
 if done then update public.operation_account_leases set expires_at=now() where email=lower(e) and token=k;return found;end if;
 insert into public.operation_account_leases(email,token,expires_at) values(lower(e),k,now()+interval '2 minutes')
 on conflict(email) do update set token=excluded.token,expires_at=excluded.expires_at where public.operation_account_leases.expires_at<=now()
 returning token into acquired;
 return acquired=k;
end $$;
create function public.ops_account_lease(e text,k uuid,done boolean default false) returns boolean language sql security invoker set search_path='' as $$select private.ops_account_lease(e,k,done)$$;
create function private.ops_account_session(u uuid,sid uuid,since timestamptz) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from auth.sessions where id=sid and user_id=u and created_at>=since)
$$;
create function public.ops_account_session(u uuid,sid uuid,since timestamptz) returns boolean language sql security invoker set search_path='' as $$select private.ops_account_session(u,sid,since)$$;

create function private.ops_account_bind_audit(actor uuid,a text,s uuid,u uuid,member_role text,full_name text,reason text,reset boolean,reset_ref uuid) returns void language plpgsql security definer set search_path='' as $$
declare c jsonb;
begin
 c:=private.ops_account_context(actor,a,s,null,u);
 if (c->>'protected')::boolean or u=actor then raise exception 'protected_account';end if;
 if length(trim(coalesce(reason,''))) not between 5 and 500 then raise exception 'reason_required';end if;
 if reset then
  if not coalesce((c->>'member_active')::boolean,false) then raise exception 'active_member_required';end if;
 else
  if not ((a='meu-espetinho' and member_role in ('owner','manager','cashier','attendant')) or (a='sr-padeiro' and member_role in ('owner','manager','cashier','stockist','viewer'))) then raise exception 'invalid_role';end if;
  insert into public.profiles(id,full_name) values(u,full_name) on conflict(id) do nothing;
  if a='meu-espetinho' then insert into public.tenant_users(tenant_id,user_id,role,active) values(s,u,member_role,true) on conflict(tenant_id,user_id) do nothing;
  else insert into public.srp_members(organization_id,user_id,role,active) values(s,u,member_role,true) on conflict(organization_id,user_id) do nothing;end if;
 end if;
 insert into public.operation_audit(app,scope_id,actor_id,action,details) values(a,s,actor,case when reset then 'temporary_password_reset' else 'account_created_with_temporary_password' end,jsonb_build_object('user_id',u,'role',member_role,'reason',reason,'reset_id',reset_ref,'identity_verified_by_admin',true));
end $$;
create function public.ops_account_bind_audit(actor uuid,a text,s uuid,u uuid,member_role text,full_name text,reason text,reset boolean,reset_ref uuid) returns void language sql security invoker set search_path='' as $$select private.ops_account_bind_audit(actor,a,s,u,member_role,full_name,reason,reset,reset_ref)$$;
revoke all on function private.ops_account_context(uuid,text,uuid,text,uuid),public.ops_account_context(uuid,text,uuid,text,uuid),private.ops_account_lease(text,uuid,boolean),public.ops_account_lease(text,uuid,boolean),private.ops_account_session(uuid,uuid,timestamptz),public.ops_account_session(uuid,uuid,timestamptz),private.ops_account_bind_audit(uuid,text,uuid,uuid,text,text,text,boolean,uuid),public.ops_account_bind_audit(uuid,text,uuid,uuid,text,text,text,boolean,uuid) from public,anon,authenticated;
grant execute on function private.ops_account_context(uuid,text,uuid,text,uuid),public.ops_account_context(uuid,text,uuid,text,uuid),private.ops_account_lease(text,uuid,boolean),public.ops_account_lease(text,uuid,boolean),private.ops_account_session(uuid,uuid,timestamptz),public.ops_account_session(uuid,uuid,timestamptz),private.ops_account_bind_audit(uuid,text,uuid,uuid,text,text,text,boolean,uuid),public.ops_account_bind_audit(uuid,text,uuid,uuid,text,text,text,boolean,uuid) to service_role;
grant usage on schema private to service_role,authenticated;

create function private.ops_admin_accounts(a text,s uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if not private.ops_super() then raise exception 'forbidden' using errcode='42501';end if;
 select coalesce(jsonb_agg(jsonb_build_object('user_id',u.id,'email',u.email,'full_name',coalesce(p.full_name,''),'role',m.role,'active',m.active,
 'email_confirmed',u.email_confirmed_at is not null,'last_sign_in_at',u.last_sign_in_at,'password_required',coalesce(r.required,false),
 'temporary_expires_at',r.expires_at,'protected',exists(select 1 from public.admin_users where user_id=u.id))), '[]') into result
 from (select user_id,role,active from public.tenant_users where a='meu-espetinho' and tenant_id=s
 union all select user_id,role,active from public.srp_members where a='sr-padeiro' and organization_id=s) m
 join auth.users u on u.id=m.user_id left join public.profiles p on p.id=u.id left join public.operation_password_requirements r on r.user_id=u.id;
 return result;
end $$;
create function public.ops_admin_accounts(a text,s uuid) returns jsonb language sql security invoker set search_path='' as $$select private.ops_admin_accounts(a,s)$$;

create function private.ops_client_success(a text,s uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare revenue numeric;previous numeric;sales integer;open_sales integer;products integer;enabled_products integer;pending integer;stocks integer;low_stock integer;last_sale timestamptz;accounts jsonb;plan jsonb;
begin
 if not private.ops_super() then raise exception 'forbidden' using errcode='42501';end if;
 if a='meu-espetinho' then
  if not exists(select 1 from public.tenants where id=s) then raise exception 'scope_not_found';end if;
  select coalesce(sum(total) filter(where status='closed' and closed_at>=now()-interval '30 days'),0),coalesce(sum(total) filter(where status='closed' and closed_at>=now()-interval '60 days' and closed_at<now()-interval '30 days'),0),count(*) filter(where status='closed' and closed_at>=now()-interval '30 days'),count(*) filter(where status='open'),max(closed_at) filter(where status='closed') into revenue,previous,sales,open_sales,last_sale from public.orders where tenant_id=s;
  select count(*),count(*) filter(where active),0,count(*) filter(where stock_qty is not null),count(*) filter(where active and coalesce(stock_qty,0)<=0) into products,enabled_products,pending,stocks,low_stock from public.products where tenant_id=s;
 elsif a='sr-padeiro' then
  if not exists(select 1 from public.srp_organizations where id=s) then raise exception 'scope_not_found';end if;
  select coalesce(sum(total) filter(where status='completed' and created_at>=now()-interval '30 days'),0),coalesce(sum(total) filter(where status='completed' and created_at>=now()-interval '60 days' and created_at<now()-interval '30 days'),0),count(*) filter(where status='completed' and created_at>=now()-interval '30 days'),0,max(created_at) filter(where status='completed') into revenue,previous,sales,open_sales,last_sale from public.srp_sales where organization_id=s;
  select count(*),count(*) filter(where active),count(*) filter(where fulfillment='confirmar') into products,enabled_products,pending from public.srp_products where organization_id=s;
  select count(*),count(*) filter(where quantity<=minimum_quantity) into stocks,low_stock from public.srp_inventory where organization_id=s;
 else raise exception 'invalid_app';end if;
 accounts:=private.ops_admin_accounts(a,s);
 select to_jsonb(p) into plan from public.operation_success_plans p where app=a and scope_id=s;
 return jsonb_build_object('revenue_30d',revenue,'previous_revenue_30d',previous,'sales_30d',sales,'ticket_30d',case when sales>0 then round(revenue/sales,2) else null end,'open_orders',open_sales,'products',products,'active_products',enabled_products,'pending_fulfillment',pending,'stock_records',stocks,'low_stock',low_stock,'last_sale_at',last_sale,'accounts',accounts,'plan',plan);
end $$;
create function public.ops_client_success(a text,s uuid) returns jsonb language sql security invoker set search_path='' as $$select private.ops_client_success(a,s)$$;
create function private.ops_success_plan_save(a text,s uuid,goal numeric,next_action text,responsible text,due_date date) returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.ops_super() then raise exception 'forbidden' using errcode='42501';end if;
 if not ((a='meu-espetinho' and exists(select 1 from public.tenants where id=s)) or (a='sr-padeiro' and exists(select 1 from public.srp_organizations where id=s))) then raise exception 'scope_not_found';end if;
 if goal<0 or goal>999999999999 or length(coalesce(next_action,''))>500 or length(coalesce(responsible,''))>120 then raise exception 'invalid_plan';end if;
 insert into public.operation_success_plans(app,scope_id,revenue_goal,next_action,responsible,due_date,updated_by) values(a,s,goal,coalesce(next_action,''),coalesce(responsible,''),due_date,auth.uid()) on conflict(app,scope_id) do update set revenue_goal=excluded.revenue_goal,next_action=excluded.next_action,responsible=excluded.responsible,due_date=excluded.due_date,updated_by=excluded.updated_by,updated_at=now();
 insert into public.operation_audit(app,scope_id,actor_id,action) values(a,s,auth.uid(),'client_success_plan_saved');
end $$;
create function public.ops_success_plan_save(a text,s uuid,goal numeric,next_action text,responsible text,due_date date) returns void language sql security invoker set search_path='' as $$select private.ops_success_plan_save(a,s,goal,next_action,responsible,due_date)$$;
revoke all on function private.ops_admin_accounts(text,uuid),public.ops_admin_accounts(text,uuid),private.ops_client_success(text,uuid),public.ops_client_success(text,uuid),private.ops_success_plan_save(text,uuid,numeric,text,text,date),public.ops_success_plan_save(text,uuid,numeric,text,text,date) from public,anon;
grant execute on function private.ops_admin_accounts(text,uuid),public.ops_admin_accounts(text,uuid),private.ops_client_success(text,uuid),public.ops_client_success(text,uuid),private.ops_success_plan_save(text,uuid,numeric,text,text,date),public.ops_success_plan_save(text,uuid,numeric,text,text,date) to authenticated;

-- This project had no pre-request hook at inspection. Preserve any future hook instead of silently replacing it.
do $hook$ declare existing text;begin
 select split_part(v,'=',2) into existing from pg_db_role_setting s join pg_roles r on r.oid=s.setrole cross join unnest(s.setconfig) v where r.rolname='authenticator' and v like 'pgrst.db_pre_request=%' limit 1;
 if existing is not null and existing<>'' and existing<>'public.ops_account_request_guard' then raise exception 'existing_pre_request_hook_requires_integration';end if;
 alter role authenticator set pgrst.db_pre_request='public.ops_account_request_guard';
end $hook$;
notify pgrst,'reload config';
notify pgrst,'reload schema';
