begin;
alter table public.cip_stock_reference_batches drop constraint cip_stock_reference_batches_scope_check;
alter table public.cip_stock_reference_batches add constraint cip_stock_reference_batches_scope_check check(scope in ('stores_only_partial','cd100_partial'));
alter table public.cip_stock_reference_batches alter column reference_date drop not null;
alter table public.cip_stock_reference_rows add column reference_kind text not null default 'stores_no_movement';
alter table public.cip_stock_reference_rows alter column sale_price drop not null;
alter table public.cip_stock_reference_rows alter column declared_potential drop not null;
alter table public.cip_stock_reference_rows alter column source_days drop not null;
alter table public.cip_stock_reference_rows alter column last_sale drop not null;
alter table public.cip_stock_reference_rows alter column last_entry drop not null;
alter table public.cip_stock_reference_rows add constraint cip_stock_reference_kind_fields_check check(
 (reference_kind='stores_no_movement' and sale_price is not null and declared_potential is not null and source_days is not null and last_sale is not null and last_entry is not null)
 or (reference_kind='cd100_stock' and store_code='100' and sale_price is null and declared_potential is null and source_days is null and last_sale is null and last_entry is null)
);
comment on table public.cip_stock_reference_rows is 'Private provisional Shopping reference imports. Stores movement-filtered sample and CD100 stock are distinct scopes; never consolidate as full company stock. CD100 has no sale price, aging or movement dates. Missing is null, not zero. Not reconciled ERP.';
commit;
