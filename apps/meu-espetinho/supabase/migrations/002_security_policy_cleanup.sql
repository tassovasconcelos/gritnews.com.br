-- Meu Espetinho — limpeza pós-hardening
-- Mantém as policies granulares já existentes no banco e remove duplicações criadas na consolidação.

drop policy if exists "tenant members manage customer credit accounts" on public.customer_credit_accounts;
drop policy if exists "tenant members manage customer credit entries" on public.customer_credit_entries;
drop policy if exists "tenant members read order activity" on public.order_activity_logs;

drop index if exists public.customer_credit_entries_customer_idx;

-- A view passa a respeitar permissões/RLS do usuário chamador.
alter view if exists public.tenant_user_seat_summary set (security_invoker = true);

-- Índices de FKs mais relevantes apontados pelos advisors.
create index if not exists audit_logs_user_id_idx on public.audit_logs(user_id);
create index if not exists cash_movements_tenant_id_idx on public.cash_movements(tenant_id);
create index if not exists cash_movements_created_by_idx on public.cash_movements(created_by);
create index if not exists cash_registers_opened_by_idx on public.cash_registers(opened_by);
create index if not exists cash_registers_closed_by_idx on public.cash_registers(closed_by);
create index if not exists customer_credit_accounts_updated_by_idx on public.customer_credit_accounts(updated_by);
create index if not exists customer_credit_entries_created_by_idx on public.customer_credit_entries(created_by);
create index if not exists customer_credit_entries_customer_id_idx on public.customer_credit_entries(customer_id);
create index if not exists devices_user_id_idx on public.devices(user_id);
create index if not exists order_activity_logs_user_id_idx on public.order_activity_logs(user_id);
create index if not exists setup_requests_assigned_admin_idx on public.setup_requests(assigned_admin);
create index if not exists setup_requests_owner_user_id_idx on public.setup_requests(owner_user_id);
create index if not exists tenant_user_invites_invited_by_idx on public.tenant_user_invites(invited_by);
create index if not exists tenants_setup_approved_by_idx on public.tenants(setup_approved_by);
