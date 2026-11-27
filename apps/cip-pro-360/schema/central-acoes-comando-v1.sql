-- CIP360 atomic decision → human task; never executes ERP, advertising or pricing.
create unique index if not exists cip_tower_unique_command_source
 on public.cip_tower_tasks(company_id,source_reference)
 where source_module='command_center';

create or replace function public.cip_command_decide(
 p_company text,p_kind text,p_ref text,p_action text,
 p_note text default '',p_owner text default null,p_evidence text default '',
 p_expected_version integer default null
)
returns jsonb
language plpgsql security invoker set search_path=''
as $$
declare v_source record;v_decision public.cip_command_decisions%rowtype; v_target text;
begin
 if auth.uid() is null or not public.cip_agent_can_manage(p_company) then raise exception 'manager_required';end if;
 if p_company not in ('shopping_prohospital','distribuidora_prohospital') then raise exception 'invalid_company';end if;
 if p_kind not in ('estoque','radar','missao','campanha') then raise exception 'invalid_kind';end if;
 if p_action not in ('em_analise','apuracao_autorizada','plano_aprovado','rejeitada','em_acompanhamento','resultado_declarado')
  then raise exception 'invalid_action';end if;
 if length(coalesce(p_note,''))>2000 or length(coalesce(p_evidence,''))>3000 or length(coalesce(p_owner,''))>120 then
  raise exception 'field_too_long';end if;
 select * into v_source from public.cip_command_feed
 where company_id=p_company and source_kind=p_kind and source_ref=p_ref limit 1;
 if not found then raise exception 'source_missing_or_not_authorized';end if;
 insert into public.cip_command_decisions(company_id,source_kind,source_ref,state,review_note,owner_name,created_by)
 values(p_company,p_kind,p_ref,'em_analise',coalesce(p_note,''),nullif(trim(p_owner),''),auth.uid())
 on conflict(company_id,source_kind,source_ref) do nothing;
 select * into v_decision from public.cip_command_decisions
 where company_id=p_company and source_kind=p_kind and source_ref=p_ref for update;
 if not found then raise exception 'decision_not_available';end if;
 if p_expected_version is not null and v_decision.version<>p_expected_version then
  raise exception 'version_changed';end if;
 v_target:=p_action;
 if v_target<>v_decision.state then
  update public.cip_command_decisions
  set state=v_target,review_note=coalesce(p_note,''),owner_name=nullif(trim(p_owner),''),
      result_evidence=coalesce(p_evidence,'')
  where id=v_decision.id;
 elsif p_note is distinct from v_decision.review_note
   or coalesce(p_owner,'') is distinct from coalesce(v_decision.owner_name,'')
   or p_evidence is distinct from v_decision.result_evidence then
  update public.cip_command_decisions
  set review_note=coalesce(p_note,''),owner_name=nullif(trim(p_owner),''),
      result_evidence=coalesce(p_evidence,'')
  where id=v_decision.id;
 end if;
 select * into v_decision from public.cip_command_decisions where id=v_decision.id;
 if v_decision.state in ('apuracao_autorizada','plano_aprovado') then
  insert into public.cip_tower_tasks(company_id,agent_code,title,description,status,priority,
      source_module,source_reference,owner_name,evidence_note,created_by)
  values(p_company,
   case p_kind when 'radar' then 'radar_digital' when 'estoque' then
     case v_source.action_type when 'campanha' then 'campanhas'
       when 'redistribuicao' then 'transferencias' when 'preco' then 'marca_passo'
       else 'estoque' end
     when 'campanha' then 'campanhas' else 'doquita' end,
   left('Analisar: '||coalesce(v_source.title,'oportunidade'),160),
   left(coalesce(v_source.recommendation,'Investigar registro com fonte'),2500),
   'aberta',case when v_source.priority>=85 then 'alta' else 'normal' end,
   'command_center',p_kind||':'||p_ref,
   v_decision.owner_name,coalesce(p_note,''),auth.uid())
  on conflict do nothing;
 end if;
 return jsonb_build_object('id',v_decision.id,'company',p_company,'source',p_kind||':'||p_ref,
  'state',v_decision.state,'version',v_decision.version,'human_approval_only',true,
  'does_not_execute_erp',true);
end;
$$;
revoke all on function public.cip_command_decide(text,text,text,text,text,text,text,integer) from public,anon;
grant execute on function public.cip_command_decide(text,text,text,text,text,text,text,integer) to authenticated;
comment on function public.cip_command_decide(text,text,text,text,text,text,text,integer)
is 'Atomic approval of investigation/planning, with a deduplicated human task; never changes prices or stocks.';
