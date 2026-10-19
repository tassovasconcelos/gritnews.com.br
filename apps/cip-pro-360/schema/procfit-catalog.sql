begin;
create table public.cip_procfit_catalog_batches (
 id uuid primary key, captured_at timestamptz not null, received_at timestamptz not null default now(),
 status text not null default 'loading' check(status in ('loading','published')),
 active boolean not null default false, expected_products integer not null check(expected_products between 1 and 300000),
 expected_eans integer not null check(expected_eans between 0 and 600000), summary jsonb,
 check(not active or status='published')
);
create unique index cip_catalog_one_active on public.cip_procfit_catalog_batches(active) where active;
create table public.cip_procfit_catalog_products (
 batch_id uuid not null references public.cip_procfit_catalog_batches(id), code text not null,
 data jsonb not null check(jsonb_typeof(data)='object'),
 name text generated always as (data->>'NOME_PRODUTO') stored,
 brand text generated always as (data->>'MARCA') stored,
 brand_group text generated always as (data->>'GRUPO_MARCA') stored,
 primary key(batch_id,code), check(code ~ '^[0-9]+$' and data->>'COD_PRODUTO'=code)
);
create index cip_catalog_brand on public.cip_procfit_catalog_products(batch_id,brand);
create table public.cip_procfit_catalog_eans (
 batch_id uuid not null references public.cip_procfit_catalog_batches(id), record_id text not null,
 code text not null, data jsonb not null check(jsonb_typeof(data)='object'),
 primary key(batch_id,record_id), check(record_id ~ '^[0-9]+$' and code ~ '^[0-9]+$'),
 check(data->>'REGISTRO'=record_id and data->>'COD_PRODUTO'=code)
);
create index cip_catalog_ean_product on public.cip_procfit_catalog_eans(batch_id,code);
create index cip_catalog_ean_lookup on public.cip_procfit_catalog_eans(batch_id,(data->>'EAN'));
alter table public.cip_procfit_catalog_batches enable row level security;
alter table public.cip_procfit_catalog_products enable row level security;
alter table public.cip_procfit_catalog_eans enable row level security;
revoke all on public.cip_procfit_catalog_batches,public.cip_procfit_catalog_products,public.cip_procfit_catalog_eans from public,anon,authenticated;
grant all on public.cip_procfit_catalog_batches,public.cip_procfit_catalog_products,public.cip_procfit_catalog_eans to service_role;
grant select on public.cip_procfit_catalog_batches,public.cip_procfit_catalog_products,public.cip_procfit_catalog_eans to authenticated;
create policy cip_catalog_admin_batches on public.cip_procfit_catalog_batches for select to authenticated using(exists(select 1 from public.cip_profiles where user_id=(select auth.uid()) and active and role='superadm'));
create policy cip_catalog_admin_products on public.cip_procfit_catalog_products for select to authenticated using(exists(select 1 from public.cip_profiles where user_id=(select auth.uid()) and active and role='superadm'));
create policy cip_catalog_admin_eans on public.cip_procfit_catalog_eans for select to authenticated using(exists(select 1 from public.cip_profiles where user_id=(select auth.uid()) and active and role='superadm'));

create function public.cip_procfit_catalog_receive(p jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
declare b public.cip_procfit_catalog_batches; n integer; ne integer; result jsonb;
begin
 perform pg_advisory_xact_lock(78136019);
 if p->>'action'='begin' then
  insert into public.cip_procfit_catalog_batches(id,captured_at,expected_products,expected_eans)
   values((p->>'batch_id')::uuid,(p->>'captured_at')::timestamptz,(p->>'products')::integer,(p->>'eans')::integer)
   on conflict(id) do nothing;
 end if;
 select * into b from public.cip_procfit_catalog_batches where id=(p->>'batch_id')::uuid for update;
 if not found then raise exception 'batch_missing'; end if;
 if b.status='published' then return jsonb_build_object('published',true,'summary',b.summary); end if;
 if b.received_at < now()-interval '1 day' then raise exception 'batch_expired'; end if;
 if p->>'action'='products' then
  insert into public.cip_procfit_catalog_products(batch_id,code,data)
   select b.id,x->>'COD_PRODUTO',x from jsonb_array_elements(p->'rows') x
   on conflict(batch_id,code) do update set data=excluded.data;
 elsif p->>'action'='eans' then
  insert into public.cip_procfit_catalog_eans(batch_id,record_id,code,data)
   select b.id,x->>'REGISTRO',x->>'COD_PRODUTO',x from jsonb_array_elements(p->'rows') x
   on conflict(batch_id,record_id) do update set code=excluded.code,data=excluded.data;
 elsif p->>'action'='finish' then
  select count(*) into n from public.cip_procfit_catalog_products where batch_id=b.id;
  select count(*) into ne from public.cip_procfit_catalog_eans where batch_id=b.id;
  if n<>b.expected_products or ne<>b.expected_eans then raise exception 'count_mismatch'; end if;
  if exists(select 1 from public.cip_procfit_catalog_eans e where e.batch_id=b.id and not exists(select 1 from public.cip_procfit_catalog_products x where x.batch_id=b.id and x.code=e.code)) then raise exception 'orphan_ean'; end if;
  if exists(select 1 from public.cip_procfit_catalog_products where batch_id=b.id and nullif(btrim(name),'') is null) then raise exception 'missing_name'; end if;
  if exists(select 1 from public.cip_procfit_catalog_batches where active and captured_at>=b.captured_at) then raise exception 'older_snapshot'; end if;
  select jsonb_build_object('products',n,'eans',ne,'brands',count(distinct nullif(btrim(brand),'')),
   'brand_groups',count(distinct nullif(btrim(brand_group),'')),
   'missing_brand',count(*) filter(where nullif(btrim(brand),'') is null),
   'missing_ncm',count(*) filter(where nullif(btrim(data->>'NCM'),'') is null),
   'missing_unit',count(*) filter(where nullif(btrim(data->>'UNIDADE_MEDIDA'),'') is null)) into result
   from public.cip_procfit_catalog_products where batch_id=b.id;
  update public.cip_procfit_catalog_batches set active=false where active;
  update public.cip_procfit_catalog_batches set status='published',active=true,summary=result where id=b.id;
  return jsonb_build_object('published',true,'summary',result);
 end if;
 return jsonb_build_object('accepted',true,'published',false);
end;$$;
revoke all on function public.cip_procfit_catalog_receive(jsonb) from public,anon,authenticated;
grant execute on function public.cip_procfit_catalog_receive(jsonb) to service_role;

create function public.cip_procfit_catalog_search(p_query text default '',p_brand text default '',p_offset integer default 0) returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare b public.cip_procfit_catalog_batches; result jsonb; total integer; q text:=lower(btrim(coalesce(p_query,''))); off integer:=greatest(0,least(coalesce(p_offset,0),300000));
begin
 if not exists(select 1 from public.cip_profiles where user_id=(select auth.uid()) and active and role='superadm') then raise exception 'superadmin_required'; end if;
 if length(q)>150 or length(p_brand)>100 then raise exception 'invalid_filter'; end if;
 select * into b from public.cip_procfit_catalog_batches where active;
 if not found then return jsonb_build_object('available',false); end if;
 with matches as (
  select x.* from public.cip_procfit_catalog_products x where x.batch_id=b.id
  and (coalesce(p_brand,'')='' or x.brand=p_brand)
  and (q='' or x.code=q or strpos(lower(coalesce(x.name,'')||' '||coalesce(x.brand,'')||' '||coalesce(x.brand_group,'')),q)>0
   or exists(select 1 from public.cip_procfit_catalog_eans e where e.batch_id=b.id and e.code=x.code and (e.data->>'EAN'=q or e.data->>'EAN_FORMATADO'=q)))
 ), page as (select * from matches order by code limit 25 offset off)
 select jsonb_build_object('total',(select count(*) from matches),'rows',coalesce((select jsonb_agg(jsonb_build_object('product',x.data,'eans',coalesce((select jsonb_agg(e.data order by e.record_id) from public.cip_procfit_catalog_eans e where e.batch_id=b.id and e.code=x.code),'[]'::jsonb)) order by x.code) from page x),'[]'::jsonb)) into result;
 return result||jsonb_build_object('available',true,'captured_at',b.captured_at,'summary',b.summary,'offset',off,'limit',25,
 'brands',(select coalesce(jsonb_agg(brand order by brand),'[]'::jsonb) from (select distinct brand from public.cip_procfit_catalog_products where batch_id=b.id and nullif(btrim(brand),'') is not null) s));
end;$$;
revoke all on function public.cip_procfit_catalog_search(text,text,integer) from public,anon;
grant execute on function public.cip_procfit_catalog_search(text,text,integer) to authenticated;
commit;
