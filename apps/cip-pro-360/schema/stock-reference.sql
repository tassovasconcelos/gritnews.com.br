begin;
create table public.cip_stock_reference_batches(
 source_hash text primary key check(source_hash ~ '^[a-f0-9]{64}$'),
 company_id text not null default 'shopping_prohospital' references public.cip_companies(id) check(company_id='shopping_prohospital'),
 source_file text not null,source_sheet text not null,
 scope text not null check(scope='stores_only_partial'),
 reference_date date not null,reference_basis text not null,
 summary jsonb not null check(jsonb_typeof(summary)='object'),
 status text not null default 'loading' check(status in ('loading','reference_unreconciled','retired')),
 loaded_at timestamptz not null default now()
);
create table public.cip_stock_reference_rows(
 source_hash text not null references public.cip_stock_reference_batches(source_hash),
 company_id text not null default 'shopping_prohospital' references public.cip_companies(id) check(company_id='shopping_prohospital'),
 source_row integer not null check(source_row>1),store_code text not null,sku text not null,
 description text not null,brand text,product_group text,subgroup text,
 quantity numeric(20,6) not null check(quantity>=0),unit_cost numeric(20,6) not null check(unit_cost>=0),
 declared_cost numeric(20,2) not null check(declared_cost>=0),sale_price numeric(20,6) not null check(sale_price>=0),
 declared_potential numeric(20,2) not null check(declared_potential>=0),
 source_days integer not null check(source_days>180),last_sale date not null,last_entry date not null,
 cost_delta numeric(20,2) not null,cost_review boolean not null,
 primary key(source_hash,store_code,sku),unique(source_hash,source_row)
);
alter table public.cip_stock_reference_batches enable row level security;
alter table public.cip_stock_reference_rows enable row level security;
revoke all on public.cip_stock_reference_batches,public.cip_stock_reference_rows from public,anon,authenticated;
grant select on public.cip_stock_reference_batches,public.cip_stock_reference_rows to authenticated;
grant all on public.cip_stock_reference_batches,public.cip_stock_reference_rows to service_role;
create policy stock_reference_batch_read on public.cip_stock_reference_batches for select to authenticated using(public.cip_can_access(company_id) and status='reference_unreconciled');
create policy stock_reference_row_read on public.cip_stock_reference_rows for select to authenticated using(public.cip_can_access(company_id) and exists(select 1 from public.cip_stock_reference_batches b where b.source_hash=cip_stock_reference_rows.source_hash and b.status='reference_unreconciled'));
comment on table public.cip_stock_reference_rows is 'Private provisional workbook stock at Shopping stores only. No CD, units or remaining lot aging. Not reconciled ERP, sales, revenue, margin or profit. Source days follow latest sale OR entry, as observed from source.';
commit;
