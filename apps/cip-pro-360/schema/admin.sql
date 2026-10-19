begin;
alter table public.cip_profiles drop constraint cip_profiles_role_check;
alter table public.cip_profiles add constraint cip_profiles_role_check check(role in ('superadm','diretoria','supervisor','gestor','analista','vendedor','leitura'));
alter table public.cip_memberships drop constraint cip_memberships_role_check;
alter table public.cip_memberships add constraint cip_memberships_role_check check(role in ('diretoria','supervisor','gestor','compras','precificacao','comercial','analista','vendedor','leitura'));
create table public.cip_directory(user_id uuid primary key references auth.users(id),email text not null,updated_at timestamptz not null default now());
alter table public.cip_directory enable row level security;
revoke all on public.cip_directory from anon,authenticated;
grant select on public.cip_directory to authenticated;
create policy directory_self on public.cip_directory for select to authenticated using(user_id=(select auth.uid()));
insert into public.cip_directory(user_id,email) select p.user_id,lower(u.email) from public.cip_profiles p join auth.users u on u.id=p.user_id;
create table public.cip_user_invites(
 id uuid primary key default gen_random_uuid(),email text not null check(email=lower(btrim(email))),
 role text not null check(role in ('diretoria','supervisor','gestor','analista','vendedor','leitura')),
 companies text[] not null check(cardinality(companies) between 1 and 2),token_hash text not null unique,
 state text not null default 'pending' check(state in ('pending','ready','accepted','revoked')),
 created_by uuid not null references auth.users(id),created_at timestamptz not null default now(),
 expires_at timestamptz not null default now()+interval '1 hour',accepted_by uuid references auth.users(id),accepted_at timestamptz
);
create index cip_invites_created on public.cip_user_invites(created_at desc);
alter table public.cip_user_invites enable row level security;
revoke all on public.cip_user_invites from public,anon,authenticated;
create table public.cip_access_events(
 id uuid primary key default gen_random_uuid(),actor_id uuid not null references auth.users(id),target_id uuid references auth.users(id),
 action text not null,details jsonb not null default '{}',created_at timestamptz not null default clock_timestamp()
);
alter table public.cip_access_events enable row level security;
revoke all on public.cip_access_events from public,anon,authenticated;
create index cip_access_events_created on public.cip_access_events(created_at desc);
grant all on public.cip_user_invites,public.cip_access_events,public.cip_directory to service_role;
create function public.cip_admin_apply_access(p_actor uuid,p_target uuid,p_role text,p_companies text[],p_active boolean) returns void language plpgsql set search_path='' as $$
declare before_value jsonb;
begin
 if not exists(select 1 from public.cip_profiles where user_id=p_actor and active and role='superadm') then raise exception 'Superadmin required';end if;
 if exists(select 1 from public.cip_profiles where user_id=p_target and role='superadm') then raise exception 'Protected superadmin';end if;
 if p_role not in ('diretoria','supervisor','gestor','analista','vendedor','leitura') or p_active is null or p_companies is null or cardinality(p_companies) not between 1 and 2 then raise exception 'Invalid access scope';end if;
 if exists(select 1 from unnest(p_companies) c(id) where not exists(select 1 from public.cip_companies x where x.id=c.id)) then raise exception 'Unknown company';end if;
 select to_jsonb(p) into before_value from public.cip_profiles p where user_id=p_target for update;
 insert into public.cip_profiles(user_id,role,active) values(p_target,p_role,p_active) on conflict(user_id) do update set role=excluded.role,active=excluded.active;
 update public.cip_memberships set active=false where user_id=p_target and not(company_id=any(p_companies));
 insert into public.cip_memberships(user_id,company_id,role,active) select p_target,c,p_role,true from (select distinct unnest(p_companies) c) scope
 on conflict(user_id,company_id) do update set role=excluded.role,active=true;
 insert into public.cip_access_events(actor_id,target_id,action,details) values(p_actor,p_target,'access_changed',jsonb_build_object('before',before_value,'role',p_role,'companies',p_companies,'active',p_active));
end;$$;
revoke all on function public.cip_admin_apply_access(uuid,uuid,text,text[],boolean) from public,anon,authenticated;
grant execute on function public.cip_admin_apply_access(uuid,uuid,text,text[],boolean) to service_role;
create function public.cip_admin_accept_invite(p_invite uuid,p_token_hash text,p_user uuid,p_email text) returns jsonb language plpgsql set search_path='' as $$
declare i public.cip_user_invites;
begin
 select * into i from public.cip_user_invites where id=p_invite and token_hash=p_token_hash and email=lower(p_email) for update;
 if not found or i.state<>'ready' or i.expires_at<now() then raise exception 'Invalid or expired invitation';end if;
 if private.cip_identity_id(p_email) is distinct from p_user then raise exception 'Invited identity mismatch';end if;
 perform public.cip_admin_apply_access(i.created_by,p_user,i.role,i.companies,true);
 insert into public.cip_directory(user_id,email) values(p_user,lower(p_email)) on conflict(user_id) do update set email=excluded.email,updated_at=now();
 update public.cip_user_invites set state='accepted',accepted_by=p_user,accepted_at=clock_timestamp() where id=i.id;
 insert into public.cip_access_events(actor_id,target_id,action,details) values(p_user,p_user,'invite_accepted',jsonb_build_object('invitation',i.id));
 return jsonb_build_object('role',i.role,'companies',i.companies);
end;$$;
revoke all on function public.cip_admin_accept_invite(uuid,text,uuid,text) from public,anon,authenticated;
grant execute on function public.cip_admin_accept_invite(uuid,text,uuid,text) to service_role;
create function private.cip_identity_id(p_email text) returns uuid language sql stable security definer set search_path='' as $$
 select id from auth.users where lower(email)=lower(btrim(p_email)) limit 1;
$$;
revoke all on function private.cip_identity_id(text) from public,anon,authenticated;
grant usage on schema private to service_role;
grant execute on function private.cip_identity_id(text) to service_role;
create function public.cip_admin_identity(p_actor uuid,p_email text) returns uuid language plpgsql set search_path='' as $$
begin
 if not exists(select 1 from public.cip_profiles where user_id=p_actor and active and role='superadm') then raise exception 'Superadmin required';end if;
 return private.cip_identity_id(p_email);
end;$$;
revoke all on function public.cip_admin_identity(uuid,text) from public,anon,authenticated;
grant execute on function public.cip_admin_identity(uuid,text) to service_role;
commit;
