create table public.cip_agent_work (
 id uuid primary key default gen_random_uuid(),
 company_id text not null references public.cip_companies(id),
 created_by uuid not null default auth.uid() references auth.users(id),
 agent_id text not null check (agent_id in ('doquita','analista','estoque','compras','precos','comercial','financeiro','estrategico','marketing','radar','escola','logistica','experiencia_cliente','b2g')),
 kind text not null check (kind in ('task','lesson')),
 title text not null check (char_length(btrim(title)) between 4 and 160),
 notes text not null default '' check (char_length(notes)<=3000),
 status text not null default 'review' check (status in ('queued','in_progress','review','done','cancelled')),
 created_at timestamptz not null default now(),
 constraint b2g_company check (agent_id<>'b2g' or company_id='distribuidora_prohospital')
);
create index cip_agent_work_company_created_idx on public.cip_agent_work(company_id,created_at desc);
create index cip_agent_work_created_by_idx on public.cip_agent_work(created_by);
alter table public.cip_agent_work enable row level security;
revoke all on public.cip_agent_work from anon, authenticated;
grant select,insert on public.cip_agent_work to authenticated;
grant update(title,notes,status) on public.cip_agent_work to authenticated;
create policy cip_agent_work_read on public.cip_agent_work for select to authenticated using (public.cip_can_access(company_id));
create policy cip_agent_work_insert on public.cip_agent_work for insert to authenticated with check (created_by=(select auth.uid()) and public.cip_can_access(company_id,true));
create policy cip_agent_work_update on public.cip_agent_work for update to authenticated using (public.cip_can_access(company_id,true)) with check (public.cip_can_access(company_id,true));
create trigger cip_agent_work_audit after insert or update on public.cip_agent_work for each row execute function public.cip_track_change();
comment on table public.cip_agent_work is 'Human-managed team tasks and learning proposals; statuses do not represent autonomous AI executions. No business execution approval is conferred.';
