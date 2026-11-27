-- CIP360 | Central de ações baseada em fontes reais.
-- Fontes existentes: Estoque, Radar, missões dos agentes e propostas de campanha.
-- Sem execução de preço, ERP, compra, mensagem, campanha ou benefício financeiro.
create or replace view public.cip_command_feed
with (security_invoker=true,security_barrier=true)
as
select
  a.company_id,'estoque'::text source_kind,a.action_id::text source_ref,
  a.sku::text sku,a.source_store::text store_code,
  left(a.description,240)::text title,
  (case a.kind
    when 'preco' then 'Conferir custo, margem e política vigente antes de revisar preço'
    when 'campanha' then 'Avaliar giro e contribuição; confirmar saldo e custos antes de campanha'
    when 'redistribuicao' then 'Conferir saldo, demanda e transporte antes de redistribuir'
    else 'Conferir a posição de estoque e corrigir dados antes da decisão' end)::text recommendation,
  a.kind::text action_type,least(100,greatest(0,coalesce(a.priority,50)))::integer priority,
  a.updated_at source_at,'posição histórica, requer revalidação'::text quality,
  null::text source_url,null::numeric market_price,null::numeric market_shipping,
  null::text availability,
  jsonb_build_object('origin','cip_stock_actions','state',a.state,
   'source_batch',a.batch_id,'source_store',a.source_store,'target_store',a.target_store,
   'quantity_limit',a.quantity_limit,'source_action',a.action_id) evidence
from public.cip_stock_actions a
where a.company_id in ('shopping_prohospital','distribuidora_prohospital')
  and a.state in ('sugerida','em_analise','aprovada','em_execucao')
union all
select
 o.company_id,'radar'::text,o.id::text,o.sku::text,null::text,
 left(coalesce(o.offer->>'title',o.seller,'Oferta sem título'),240)::text title,
 'Verificar marca, EAN, embalagem, equivalência, frete, disponibilidade e praça antes de comparar preços'::text recommendation,
 'pesquisa_concorrencia'::text action_type,55::integer priority,
 o.created_at source_at,'candidata — similaridade não homologada'::text quality,
 o.url::text source_url,
 case when jsonb_typeof(o.offer->'price')='number' then (o.offer->>'price')::numeric else null end market_price,
 case when jsonb_typeof(o.offer->'shipping')='number' then (o.offer->>'shipping')::numeric else null end market_shipping,
 o.offer->>'availability'::text availability,
 jsonb_build_object('origin','cip_market_offers','state',o.state,'seller',o.seller,
  'platform',o.offer->>'platform','brand',o.offer->>'brand','package_units',o.offer->>'pack_units',
  'match',o.offer->'match','quality',o.offer->'quality','price_is_candidate',true) evidence
from public.cip_market_offers o
where o.company_id in ('shopping_prohospital','distribuidora_prohospital')
  and o.state in ('candidate','reviewed')
union all
select
 m.company_id,'missao'::text,m.id::text,null::text,null::text,
 left(m.title,240)::text title,
 left(m.diagnosis,500)::text recommendation,
 coalesce(m.source_action,'coordenacao')::text action_type,65::integer priority,
 m.updated_at source_at,'missão interna — verificação de resultados separada'::text quality,
 null::text source_url,null::numeric market_price,null::numeric market_shipping,null::text availability,
 jsonb_build_object('origin','cip_agent_missions','lead_agent',m.lead_agent,
  'state',m.state,'review_state',m.review_state,'owner',m.owner_name,
  'evidence',m.evidence,'metric',m.metric) evidence
from public.cip_agent_missions m
where m.company_id in ('shopping_prohospital','distribuidora_prohospital')
  and m.state not in ('dismissed')
union all
select
 p.company_id,'campanha'::text,p.id::text,p.sku::text,p.store_code::text,
 concat('Revisar campanha de SKU ',p.sku)::text title,
 'Revalidar política, estoque, custo e margem de contribuição da proposta antes de divulgar'::text recommendation,
 'campanha'::text action_type,60::integer priority,
 p.created_at source_at,'proposta interna — não publicada'::text quality,
 null::text source_url,null::numeric market_price,null::numeric market_shipping,null::text availability,
 jsonb_build_object('origin','cip_mp_campaign_proposals','state',p.status,
  'source_snapshot_at',p.source_snapshot_at,'policy_version',p.policy_version,
  'calculation',p.calculation) evidence
from public.cip_mp_campaign_proposals p
where p.company_id in ('shopping_prohospital','distribuidora_prohospital')
  and p.status not in ('rejected','cancelled');

revoke all on public.cip_command_feed from public,anon;
grant select on public.cip_command_feed to authenticated;
comment on view public.cip_command_feed is
 'Feed invoker-RLS; gerado de fontes reais, sem prometer dados atuais ou ações executadas.';

create table if not exists public.cip_command_decisions(
 id uuid primary key default gen_random_uuid(),
 company_id text not null references public.cip_companies(id)
 check(company_id in ('shopping_prohospital','distribuidora_prohospital')),
 source_kind text not null check(source_kind in ('estoque','radar','missao','campanha')),
 source_ref text not null check(length(source_ref) between 3 and 128),
 state text not null default 'em_analise' check(state in
 ('em_analise','apuracao_autorizada','plano_aprovado','rejeitada','em_acompanhamento','resultado_declarado')),
 owner_name text check(owner_name is null or length(owner_name)<=120),
 review_note text not null default '' check(length(review_note)<=2000),
 result_evidence text not null default '' check(length(result_evidence)<=3000),
 created_by uuid not null default auth.uid() references auth.users(id),
 reviewed_by uuid references auth.users(id),
 version integer not null default 1 check(version>0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(company_id,source_kind,source_ref)
);
create index if not exists cip_command_decisions_scope_idx
 on public.cip_command_decisions(company_id,state,updated_at desc);
alter table public.cip_command_decisions enable row level security;
revoke all on public.cip_command_decisions from public,anon,authenticated;
grant select,insert on public.cip_command_decisions to authenticated;
grant update(state,owner_name,review_note,result_evidence,updated_at,reviewed_by,version)
 on public.cip_command_decisions to authenticated;
create policy "cip_command_read_scope" on public.cip_command_decisions
 for select to authenticated using(public.cip_can_access(company_id,false));
create policy "cip_command_new_by_manager" on public.cip_command_decisions
 for insert to authenticated with check(created_by=(select auth.uid()) and public.cip_agent_can_manage(company_id));
create policy "cip_command_update_by_manager" on public.cip_command_decisions
 for update to authenticated using(public.cip_agent_can_manage(company_id))
 with check(public.cip_agent_can_manage(company_id));

create table if not exists public.cip_command_decision_events(
 id uuid primary key default gen_random_uuid(),
 decision_id uuid not null references public.cip_command_decisions(id),
 company_id text not null references public.cip_companies(id),
 from_state text,
 to_state text not null,
 note text,
 actor uuid references auth.users(id),
 happened_at timestamptz not null default now()
);
create index if not exists cip_command_events_decision_idx on public.cip_command_decision_events(decision_id,happened_at);
alter table public.cip_command_decision_events enable row level security;
revoke all on public.cip_command_decision_events from public,anon,authenticated;
grant select on public.cip_command_decision_events to authenticated;
create policy "cip_command_events_read" on public.cip_command_decision_events
 for select to authenticated using(public.cip_can_access(company_id,false));

create or replace function public.cip_command_guard()
returns trigger language plpgsql set search_path='' as $$
declare v_src record; v_age interval;
begin
 if not public.cip_agent_can_manage(new.company_id) then raise exception 'manager_required'; end if;
 if tg_op='INSERT' then
  if new.state<>'em_analise' or new.reviewed_by is not null or new.created_by<>auth.uid() then
    raise exception 'invalid_initial_state';
  end if;
 else
  if new.company_id<>old.company_id or new.source_kind<>old.source_kind or new.source_ref<>old.source_ref
    or new.created_by<>old.created_by or new.created_at<>old.created_at
    then raise exception 'immutable_reference'; end if;
  if new.version<>old.version then raise exception 'version_is_server_managed';end if;
  if new.state<>old.state then
   if not (
      (old.state='em_analise' and new.state in ('apuracao_autorizada','plano_aprovado','rejeitada'))
      or (old.state='apuracao_autorizada' and new.state in ('plano_aprovado','rejeitada'))
      or (old.state='plano_aprovado' and new.state in ('em_acompanhamento','rejeitada'))
      or (old.state='em_acompanhamento' and new.state in ('resultado_declarado','rejeitada'))
   ) then raise exception 'invalid_transition';end if;
  end if;
 end if;
 select source_at,quality into v_src from public.cip_command_feed
   where company_id=new.company_id and source_kind=new.source_kind and source_ref=new.source_ref limit 1;
 if not found then raise exception 'source_not_found_or_inaccessible';end if;
 v_age:=now()-v_src.source_at;
 if new.state='plano_aprovado' and (v_src.source_at is null or v_age > interval '48 hours' or v_age<interval '-5 minutes')
 then raise exception 'stale_source_requires_refresh';end if;
 if new.state='resultado_declarado' and length(trim(new.result_evidence))<20 then
  raise exception 'result_evidence_required';end if;
 if new.state in ('apuracao_autorizada','plano_aprovado','rejeitada','resultado_declarado')
  and length(trim(new.review_note))<12 then raise exception 'decision_reason_required';end if;
 new.reviewed_by:=auth.uid();
 if tg_op='UPDATE' then new.version:=old.version+1;end if;
 new.updated_at:=now();
 return new;
end;$$;
revoke all on function public.cip_command_guard() from public,anon;
drop trigger if exists cip_command_guard_trigger on public.cip_command_decisions;
create trigger cip_command_guard_trigger before insert or update
on public.cip_command_decisions for each row execute function public.cip_command_guard();

create or replace function public.cip_command_event_track()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.cip_command_decision_events(decision_id,company_id,from_state,to_state,note,actor)
 values(new.id,new.company_id,case when tg_op='UPDATE' then old.state else null end,
  new.state,new.review_note,auth.uid());
 return new;
end;$$;
revoke all on function public.cip_command_event_track() from public,anon,authenticated;
drop trigger if exists cip_command_event_trigger on public.cip_command_decisions;
create trigger cip_command_event_trigger after insert or update
on public.cip_command_decisions for each row execute function public.cip_command_event_track();
drop trigger if exists cip_command_audit_trigger on public.cip_command_decisions;
create trigger cip_command_audit_trigger after insert or update
on public.cip_command_decisions for each row execute function public.cip_track_change();

comment on table public.cip_command_decisions is
 'Autorização apenas de análise/planejamento. Nenhum estado executa ERP ou confirma benefício financeiro.';
