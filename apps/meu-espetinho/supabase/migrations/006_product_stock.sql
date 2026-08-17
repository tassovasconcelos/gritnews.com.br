-- Meu Espetinho — estoque simples por produto para lista inteligente de compras
alter table public.products
  add column if not exists stock_qty numeric(14,3) not null default 0;

alter table public.products
  add constraint products_stock_qty_nonnegative check (stock_qty >= 0) not valid;

alter table public.products validate constraint products_stock_qty_nonnegative;

comment on column public.products.stock_qty is 'Saldo operacional informado pelo estabelecimento para sugestão semanal de compras.';
