SET LOCAL lock_timeout = '3s';
CREATE OR REPLACE FUNCTION public.cip_mp_campaign_review(p_id uuid, p_decision text, p_note text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare actor uuid=auth.uid(); proposal public.cip_mp_campaign_proposals;
begin
 if actor is null or not exists(select 1 from public.cip_profiles where user_id=actor and active and role in ('superadm','diretoria')) then raise exception 'director_required'; end if;
 if p_decision is null or p_decision not in ('aprovada','rejeitada') or length(btrim(coalesce(p_note,''))) not between 10 and 3000 then raise exception 'invalid_review'; end if;
 select * into proposal from public.cip_mp_campaign_proposals where id=p_id for update;
 if not found or not public.cip_can_access(proposal.company_id) then raise exception 'authorized_campaign_required'; end if;
 if proposal.status<>'aguardando_validacao' then raise exception 'campaign_already_reviewed'; end if;
 update public.cip_mp_campaign_proposals set status=p_decision,reviewed_by=actor,reviewed_at=now(),review_note=btrim(p_note) where id=p_id;
 return jsonb_build_object('id',p_id,'status',p_decision,'reviewed_at',now(),'erp_updated',false);
end;$function$
;
CREATE OR REPLACE FUNCTION public.cip_mp_campaign_submit(p_company text, p_policy_version integer, p_sku text, p_store text, p_source_snapshot_at timestamp with time zone, p_inputs jsonb, p_calculation jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare actor uuid=auth.uid(); proposal uuid; active_policy integer; rules jsonb; tier jsonb; bonus numeric=0; cofund numeric; net_bonus numeric; cost numeric; current_price numeric; expense_pct numeric; fixed_cost numeric; min_margin numeric; target_margin numeric; max_change numeric; available numeric; goal numeric; days integer; price_floor numeric; target_price numeric; candidate numeric; max_price numeric; ref numeric; expected_margin numeric; expected_contribution numeric;
begin
 if actor is null or p_company is null or not public.cip_can_access(p_company) then raise exception 'authorized_company_required'; end if;
 if length(btrim(coalesce(p_sku,''))) not between 1 and 80 or length(btrim(coalesce(p_store,''))) not between 1 and 80 or jsonb_typeof(p_inputs) is distinct from 'object' or jsonb_typeof(p_calculation) is distinct from 'object' then raise exception 'invalid_campaign'; end if;
 select p.version,p.rules into active_policy,rules from public.cip_mp_campaign_policies p where p.company_id=p_company order by p.version desc limit 1;
 if active_policy is null or active_policy<>p_policy_version then raise exception 'campaign_policy_changed'; end if;
 if p_calculation->>'rule_version' is distinct from 'mp-sellout-2026-10-20.1' or p_calculation->>'status' is distinct from 'revisao_humana' then raise exception 'invalid_campaign'; end if;
 if exists (select 1 from unnest(array['cost','current_price','expense_pct','fixed_cost','available_units','target_units','campaign_days']) as required(key) where jsonb_typeof(p_inputs->required.key) is distinct from 'number') or exists (select 1 from unnest(array['break_even_floor','margin_target_price','suggested_price','candidate_margin_pct','scenario_contribution','company_bonus_cost_total']) as required(key) where jsonb_typeof(p_calculation->required.key) is distinct from 'number') then raise exception 'campaign_required_numeric_fields'; end if;
 cost=(p_inputs->>'cost')::numeric;current_price=(p_inputs->>'current_price')::numeric;expense_pct=(p_inputs->>'expense_pct')::numeric;fixed_cost=(p_inputs->>'fixed_cost')::numeric;available=(p_inputs->>'available_units')::numeric;goal=(p_inputs->>'target_units')::numeric;days=(p_inputs->>'campaign_days')::integer;
 min_margin=(rules->>'minimum_margin_pct')::numeric;target_margin=(rules->>'target_margin_pct')::numeric;max_change=(rules->>'max_change_pct')::numeric;cofund=(rules->>'supplier_funding_per_unit')::numeric;
 if cost is null or cost<=0 or current_price is null or current_price<=0 or expense_pct is null or expense_pct<0 or expense_pct>=100 or expense_pct+target_margin>=100 or fixed_cost is null or fixed_cost<0 or available is null or available<0 or goal is null or goal<=0 or goal>available or days is null or days<1 or days>(rules->>'campaign_days_max')::integer then raise exception 'invalid_campaign'; end if;
 for tier in select jsonb_array_elements(rules->'bonus_tiers') loop if goal>=(tier->>'minimum_units')::numeric then bonus=(tier->>'bonus_per_unit')::numeric; end if; end loop;
 net_bonus=greatest(0,bonus-cofund);
 price_floor=ceil((cost+fixed_cost+net_bonus)/(1-(expense_pct+min_margin)/100)*100)/100;
 target_price=ceil((cost+fixed_cost+net_bonus)/(1-(expense_pct+target_margin)/100)*100)/100;
 candidate=least(target_price,greatest(price_floor,target_price));max_price=ceil(current_price*(1+max_change/100)*100)/100;
 if nullif(btrim(p_inputs->>'reference_price'),'') is not null then
  ref=(p_inputs->>'reference_price')::numeric;
  if ref<=0 or (p_inputs->>'equivalent') is distinct from 'true' or nullif(btrim(p_inputs->>'reference_source'),'') is null or nullif(btrim(p_inputs->>'reference_date'),'') is null or (p_inputs->>'reference_date')::date<(now() at time zone 'America/Fortaleza')::date-7 or (p_inputs->>'reference_date')::date>(now() at time zone 'America/Fortaleza')::date then raise exception 'invalid_campaign_reference'; end if;
  candidate=least(target_price,greatest(price_floor,ref));
 end if;
 candidate=least(candidate,max_price);
 if candidate<price_floor then raise exception 'campaign_below_floor'; end if;
 expected_margin=(candidate*(1-expense_pct/100)-cost-fixed_cost-net_bonus)/candidate*100;
 expected_contribution=(candidate*(1-expense_pct/100)-cost-fixed_cost-net_bonus)*goal;
 if abs((p_calculation->>'break_even_floor')::numeric-price_floor)>0.011 or abs((p_calculation->>'margin_target_price')::numeric-target_price)>0.011 or abs((p_calculation->>'suggested_price')::numeric-candidate)>0.011 or abs((p_calculation->>'candidate_margin_pct')::numeric-expected_margin)>0.02 or abs((p_calculation->>'scenario_contribution')::numeric-expected_contribution)>0.02 or abs((p_calculation->>'company_bonus_cost_total')::numeric-net_bonus*goal)>0.02 then raise exception 'campaign_calculation_mismatch'; end if;
 insert into public.cip_mp_campaign_proposals(company_id,policy_version,sku,store_code,source_snapshot_at,inputs,calculation,created_by)
 values(p_company,p_policy_version,btrim(p_sku),btrim(p_store),p_source_snapshot_at,p_inputs,p_calculation,actor) returning id into proposal;
 return jsonb_build_object('id',proposal,'status','aguardando_validacao');
end;$function$
;
