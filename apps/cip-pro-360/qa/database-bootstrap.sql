-- Isolated CI contract harness. Not a production schema or deployment migration.
create role anon;
create role authenticated;
create schema auth;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as
 $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
grant usage on schema auth to authenticated,anon;
grant execute on function auth.uid() to authenticated,anon;
create table public.cip_companies(id text primary key);
insert into public.cip_companies values('shopping_prohospital'),('distribuidora_prohospital');
create table public.cip_profiles(user_id uuid primary key references auth.users(id),role text not null,active boolean not null default false);
create table public.cip_memberships(user_id uuid references public.cip_profiles(user_id),company_id text references public.cip_companies(id),role text not null,active boolean not null default true,primary key(user_id,company_id));
alter table public.cip_profiles enable row level security;
alter table public.cip_memberships enable row level security;
create policy self on public.cip_profiles for select to authenticated using(user_id=auth.uid());
create policy self on public.cip_memberships for select to authenticated using(user_id=auth.uid());
grant select on public.cip_profiles,public.cip_memberships,public.cip_companies to authenticated;
create function public.cip_can_access(p_company text,p_write boolean default false) returns boolean
language sql stable set search_path='' as $$
 select exists(select 1 from public.cip_profiles p where p.user_id=(select auth.uid()) and p.active
 and (p.role='superadm' or exists(select 1 from public.cip_memberships m where m.user_id=p.user_id
 and m.company_id=p_company and m.active and (not p_write or m.role in ('gestor','compras','precificacao','comercial','vendedor')))));
$$;
create table public.cip_audit(id uuid default gen_random_uuid(),actor_id uuid,company_id text,entity text,record_id text,action text);
create function public.cip_track_change() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.cip_audit(actor_id,company_id,entity,record_id,action)
 values(auth.uid(),new.company_id,TG_TABLE_NAME,new.id::text,TG_OP);
 return new;
end $$;
