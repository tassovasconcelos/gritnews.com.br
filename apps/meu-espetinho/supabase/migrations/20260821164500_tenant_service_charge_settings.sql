alter table public.tenants add column if not exists service_charge_enabled boolean not null default false;
alter table public.tenants add column if not exists service_charge_percent numeric(5,2) not null default 10 check (service_charge_percent >= 0 and service_charge_percent <= 30);
alter table public.orders add column if not exists service_fee numeric(12,2) not null default 0;
alter table public.orders add column if not exists service_percent numeric(5,2) not null default 0;
comment on column public.tenants.service_charge_enabled is 'Define se a operação adiciona taxa de serviço às contas.';
comment on column public.tenants.service_charge_percent is 'Percentual configurável da taxa de serviço; padrão 10%.';
