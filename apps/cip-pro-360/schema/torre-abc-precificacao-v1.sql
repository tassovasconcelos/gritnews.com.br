-- CIP360: ABC versionado + simulações financeiras supervisionadas.
-- Só Shopping/Distribuidora; nenhuma escrita em ERP/PDV ou publicação de preços.

create table if not exists public.cip_abc_import_batches (
 id uuid primary key default gen_random_uuid(),
 company_id text not null references public.cip_companies(id)
 check(company_id in ('shopping_prohospital','distribuidora_prohospital')),
 source_file_name text not null check(length(source_file_name) between 3 and 180),
 source_sha256 text not null check(source_sha256 ~ '^[a-f0-9]{64}$'),
 status text not null default 'importing' check(status in ('importing','ready','cancelled')),
 expected_rows integer not null check(expected_rows between 1 and 30000),
 imported_by uuid not null default auth.uid() references auth.users(id),
 created_at timestamptz not null default now(),
 completed_at timestamptz,
 unique(id,company_id)
);
create index if not exists cip_abc_batches_company_idx on public.cip_abc_import_batches(company_id,status,created_at desc);

create table if not exists public.cip_abc_products (
 id uuid primary key default gen_random_uuid(),
 import_id uuid not null,
 company_id text not null check(company_id in ('shopping_prohospital','distribuidora_prohospital')),
 sku text not null check(length(sku) between 1 and 50),
 product_name text not null check(length(trim(product_name)) between 2 and 350),
 curve text not null check(curve in ('A','B','C')),
 raw_lucro numeric(8,3) not null,
 raw_despesa numeric(8,3) not null,
 raw_comissao numeric(8,3) not null,
 source_line integer not null check(source_line>=2),
 recorded_by uuid not null default auth.uid() references auth.users(id),
 recorded_at timestamptz not null default now(),
 unique(import_id,sku),
 foreign key(import_id,company_id) references public.cip_abc_import_batches(id,company_id) on delete restrict
);
create index if not exists cip_abc_products_lookup_idx on public.cip_abc_products(company_id,sku,import_id);
create index if not exists cip_abc_products_curve_idx on public.cip_abc_products(company_id,import_id,curve);

create table if not exists public.cip_tower_price_scenarios (
 id uuid primary key default gen_random_uuid(),
 company_id text not null references public.cip_companies(id)
 check(company_id in ('shopping_prohospital','distribuidora_prohospital')),
 sku text not null check(length(sku) between 1 and 50),
 store_code text,
 source_stock_as_of date,
 source_abc_import_id uuid references public.cip_abc_import_batches(id),
 inputs jsonb not null check(jsonb_typeof(inputs)='object'),
 result jsonb not null check(jsonb_typeof(result)='object'),
 scenario_kind text not null check(scenario_kind in ('protecao','competitivo','promocao','campanha')),
 source_kind text not null default 'manual_with_historical_stock' check(source_kind in ('manual','manual_with_historical_stock')),
 status text not null default 'simulacao' check(status='simulacao'),
 disclaimer text not null default 'Simulação. Nenhuma alteração no ERP ou reconhecimento de resultado financeiro.',
 created_by uuid not null default auth.uid() references auth.users(id),
 created_at timestamptz not null default now()
);
create index if not exists cip_tower_scenarios_idx on public.cip_tower_price_scenarios(company_id,created_at desc,sku);

alter table public.cip_abc_import_batches enable row level security;
alter table public.cip_abc_products enable row level security;
alter table public.cip_tower_price_scenarios enable row level security;

revoke all on public.cip_abc_import_batches,public.cip_abc_products,
 public.cip_tower_price_scenarios from public,anon,authenticated;
grant select,insert on public.cip_abc_import_batches,public.cip_abc_products,
 public.cip_tower_price_scenarios to authenticated;
grant update(status,completed_at) on public.cip_abc_import_batches to authenticated;

create policy "abc_batches_read_authorized" on public.cip_abc_import_batches
 for select to authenticated using(public.cip_can_access(company_id,false));
create policy "abc_batches_import_authorized" on public.cip_abc_import_batches
 for insert to authenticated with check(imported_by=(select auth.uid()) and public.cip_can_access(company_id,true));
create policy "abc_batches_finalize_own" on public.cip_abc_import_batches
 for update to authenticated using(imported_by=(select auth.uid()) and public.cip_can_access(company_id,true) and status='importing')
 with check(imported_by=(select auth.uid()) and public.cip_can_access(company_id,true) and status in ('importing','ready','cancelled'));
create policy "abc_items_read_authorized" on public.cip_abc_products
 for select to authenticated using(public.cip_can_access(company_id,false));
create policy "abc_items_import_authorized" on public.cip_abc_products
 for insert to authenticated with check(recorded_by=(select auth.uid()) and public.cip_can_access(company_id,true)
 and exists(select 1 from public.cip_abc_import_batches b where b.id=import_id and b.company_id=cip_abc_products.company_id and b.status='importing' and b.imported_by=(select auth.uid())));
create policy "tower_scenario_read_authorized" on public.cip_tower_price_scenarios
 for select to authenticated using(public.cip_can_access(company_id,false));
create policy "tower_scenario_insert_authorized" on public.cip_tower_price_scenarios
 for insert to authenticated with check(created_by=(select auth.uid()) and public.cip_can_access(company_id,true));

create or replace function public.cip_abc_finish_import(p_import_id uuid)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare b record; n integer; a integer; bb integer; c integer;
begin
 select * into b from public.cip_abc_import_batches where id=p_import_id for update;
 if b.id is null then raise exception 'batch_not_found';end if;
 if b.status<>'importing' or b.imported_by<>auth.uid() or not public.cip_can_access(b.company_id,true) then raise exception 'unauthorized_batch';end if;
 select count(*), count(*) filter(where curve='A'),count(*) filter(where curve='B'),count(*) filter(where curve='C')
 into n,a,bb,c from public.cip_abc_products where import_id=p_import_id and company_id=b.company_id;
 if n<>b.expected_rows then raise exception 'incomplete_batch: expected %, got %',b.expected_rows,n;end if;
 if b.expected_rows=6514 and (a<>3545 or bb<>1803 or c<>1166) then
  raise exception 'abc_curve_counts_mismatch';
 end if;
 update public.cip_abc_import_batches set status='ready',completed_at=now() where id=b.id;
 return jsonb_build_object('status','ready','rows',n,'A',a,'B',bb,'C',c,'company',b.company_id);
end;$$;
revoke all on function public.cip_abc_finish_import(uuid) from public,anon;
grant execute on function public.cip_abc_finish_import(uuid) to authenticated;

-- Uma importação 'ready' é uma referência recebida, NÃO uma política aprovada.
create trigger cip_abc_batches_audit after insert or update on public.cip_abc_import_batches
 for each row execute function public.cip_track_change();
create trigger cip_abc_items_audit after insert on public.cip_abc_products
 for each row execute function public.cip_track_change();
create trigger cip_tower_price_scenario_audit after insert on public.cip_tower_price_scenarios
 for each row execute function public.cip_track_change();
