begin;
create table public.cip_b2g_mix(
 source_hash text not null check(source_hash ~ '^[a-f0-9]{64}$'),
 sku text not null check(char_length(sku) between 1 and 120),
 company_id text not null default 'distribuidora_prohospital' references public.cip_companies(id) check(company_id='distribuidora_prohospital'),
 source_file text not null,source_reference_date date not null,source_sheet text not null,source_row integer not null check(source_row>1),
 description text not null check(char_length(description) between 1 and 1000),
 brand_source text,brand_search text,reference_tokens jsonb not null default '[]' check(jsonb_typeof(reference_tokens)='array'),
 category text not null,search_seed text not null,
 active boolean not null default true,loaded_at timestamptz not null default now(),
 primary key(source_hash,sku)
);
alter table public.cip_b2g_mix enable row level security;
revoke all on public.cip_b2g_mix from public,anon,authenticated;
grant all on public.cip_b2g_mix to service_role;
grant select on public.cip_b2g_mix to authenticated;
create policy b2g_mix_company_read on public.cip_b2g_mix for select to authenticated using(public.cip_can_access(company_id));
comment on table public.cip_b2g_mix is 'Private reference product mix from user workbook. Catalog only; no prices, costs, stock, incentives or financial formulas. Not an ERP inventory or validated CATMAT equivalence.';
commit;
