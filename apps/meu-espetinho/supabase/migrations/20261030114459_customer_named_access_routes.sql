-- Stable customer addresses shared by both products. Names select a scope, never authorize it.
create table private.operation_routes (
 app text not null check(app in ('meu-espetinho','sr-padeiro')),
 slug text not null check(length(slug) between 2 and 80 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 scope_id uuid not null, primary_route boolean not null default false,
 primary key(app,slug)
);
create unique index operation_routes_primary on private.operation_routes(app,scope_id) where primary_route;
alter table private.operation_routes enable row level security;
revoke all on private.operation_routes from public,anon,authenticated;

create function private.ops_register_route(a text,s uuid,n text,preferred text default null) returns void
language plpgsql security definer set search_path='' as $$
declare candidate text; inserted integer;
begin
 if exists(select 1 from private.operation_routes where app=a and scope_id=s and primary_route) then return;end if;
 candidate=coalesce(nullif(preferred,''),trim(both '-' from regexp_replace(lower(translate(n,'áàâãäéèêëíìîïóòôõöúùûüç','aaaaaeeeeiiiiooooouuuuc')),'[^a-z0-9]+','-','g')));
 if length(candidate) not between 2 and 80 or candidate !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then candidate='cliente';end if;
 insert into private.operation_routes values(a,candidate,s,true) on conflict do nothing;
 get diagnostics inserted=row_count;
 if inserted=0 then
  candidate=rtrim(left(candidate,40),'-')||'-'||replace(s::text,'-','');
  insert into private.operation_routes values(a,candidate,s,true);
 end if;
end $$;
revoke all on function private.ops_register_route(text,uuid,text,text) from public,anon,authenticated;

-- Explicit customer aliases, tied to verified IDs, not fuzzy name matching.
select private.ops_register_route('meu-espetinho',id,name,'orlandinhobar') from public.tenants where id='ad825690-65b5-4a60-8c2a-6d4376132afc';
select private.ops_register_route('sr-padeiro',id,name,'deliciadepao') from public.srp_organizations where id='10378360-6534-4bf7-b6ae-85bfaaed0e01';
select private.ops_register_route('meu-espetinho',id,name) from public.tenants order by id;
select private.ops_register_route('sr-padeiro',id,name,slug) from public.srp_organizations order by id;
-- Preserve the bakery's existing address as an alias.
insert into private.operation_routes(app,slug,scope_id)
 select 'sr-padeiro',slug,id from public.srp_organizations
 where length(slug) between 2 and 80 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
 on conflict do nothing;

create function private.ops_new_customer_route() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if tg_table_name='tenants' then perform private.ops_register_route('meu-espetinho',new.id,new.name);
 else perform private.ops_register_route('sr-padeiro',new.id,new.name,new.slug);end if;
 return new;
end $$;
revoke all on function private.ops_new_customer_route() from public,anon,authenticated;
create trigger ops_tenant_route after insert on public.tenants for each row execute function private.ops_new_customer_route();
create trigger ops_bakery_route after insert on public.srp_organizations for each row execute function private.ops_new_customer_route();

create function private.ops_customer_route(a text,slug text default null,s uuid default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare found_route private.operation_routes;
begin
 perform public.ops_account_request_guard();
 if auth.uid() is null or a not in ('meu-espetinho','sr-padeiro') or (slug is null)=(s is null) then
  raise exception 'scope_unavailable' using errcode='42501';end if;
 select r.* into found_route from private.operation_routes r
 where r.app=a and ((ops_customer_route.slug is not null and r.slug=ops_customer_route.slug) or (s is not null and r.scope_id=s and r.primary_route));
 if found_route.scope_id is null or not (private.ops_super() or private.ops_access(a,found_route.scope_id)) then
  raise exception 'scope_unavailable' using errcode='42501';end if;
 if not ((a='meu-espetinho' and exists(select 1 from public.tenants where id=found_route.scope_id)) or
 (a='sr-padeiro' and exists(select 1 from public.srp_organizations where id=found_route.scope_id))) then
  raise exception 'scope_unavailable' using errcode='42501';end if;
 return jsonb_build_object('scope_id',found_route.scope_id,'slug',found_route.slug);
end $$;
create function public.ops_customer_route(a text,slug text default null,s uuid default null) returns jsonb
language sql security invoker set search_path='' as $$select private.ops_customer_route(a,slug,s)$$;
revoke all on function private.ops_customer_route(text,text,uuid),public.ops_customer_route(text,text,uuid) from public,anon;
grant execute on function private.ops_customer_route(text,text,uuid),public.ops_customer_route(text,text,uuid) to authenticated;
