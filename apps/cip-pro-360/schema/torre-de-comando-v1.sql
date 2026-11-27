-- CIP360 | Torre de Comando - ações de coordenação com trilha auditável
-- Não escreve preços, compras, estoque, CRM ou ERP; encaminha ações humanas supervisionadas.
create table if not exists public.cip_tower_tasks (
 id uuid primary key default gen_random_uuid(),
 company_id text not null references public.cip_companies(id)
   check(company_id in ('shopping_prohospital','distribuidora_prohospital')),
 agent_code text not null check(agent_code in
   ('doquita','marca_passo','radar_digital','radar_fisico','estoque','compras',
    'transferencias','produtos','campanhas','caderninho','vendas_b2b','gamificacao')),
 title text not null check(length(trim(title)) between 6 and 160),
 description text not null default '' check(length(description)<=2500),
 status text not null default 'aberta' check(status in
   ('aberta','em_analise','proposta','em_execucao','concluida','descartada')),
 priority text not null default 'normal' check(priority in ('baixa','normal','alta','critica')),
 source_module text,
 source_reference text,
 owner_name text check(owner_name is null or length(owner_name)<=120),
 evidence_note text not null default '' check(length(evidence_note)<=2000),
 created_by uuid not null default auth.uid() references auth.users(id),
 updated_by uuid references auth.users(id),
 version integer not null default 1 check(version>0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists cip_tower_tasks_scope_idx on public.cip_tower_tasks(company_id,updated_at desc);
create index if not exists cip_tower_tasks_agent_idx on public.cip_tower_tasks(company_id,agent_code,status);
alter table public.cip_tower_tasks enable row level security;
revoke all on public.cip_tower_tasks from public,anon,authenticated;
grant select,insert on public.cip_tower_tasks to authenticated;
grant update(status,priority,description,owner_name,evidence_note,updated_by,updated_at,version)
 on public.cip_tower_tasks to authenticated;
create policy "cip_tower_read_company" on public.cip_tower_tasks for select to authenticated
 using(public.cip_can_access(company_id,false));
create policy "cip_tower_insert_company" on public.cip_tower_tasks for insert to authenticated
 with check(created_by=(select auth.uid()) and public.cip_can_access(company_id,true));
create policy "cip_tower_update_company" on public.cip_tower_tasks for update to authenticated
 using(public.cip_can_access(company_id,true))
 with check(public.cip_can_access(company_id,true));
create or replace function public.cip_tower_before_update()
returns trigger language plpgsql set search_path=''
as $$
begin
 if new.status='concluida' and length(trim(coalesce(new.evidence_note,'')))<10 then
  raise exception 'evidence_required_for_completion';
 end if;
 new.updated_by:=auth.uid();
 new.updated_at:=now();
 new.version:=old.version+1;
 return new;
end;
$$;
revoke all on function public.cip_tower_before_update() from public,anon,authenticated;
drop trigger if exists cip_tower_task_touch on public.cip_tower_tasks;
create trigger cip_tower_task_touch before update on public.cip_tower_tasks
 for each row execute function public.cip_tower_before_update();
drop trigger if exists cip_tower_task_audit on public.cip_tower_tasks;
create trigger cip_tower_task_audit after insert or update on public.cip_tower_tasks
 for each row execute function public.cip_track_change();
comment on table public.cip_tower_tasks is
 'Tarefas operacionais da Torre CIP360; status manual, sem comprovação automática de economia ou execução ERP.';
