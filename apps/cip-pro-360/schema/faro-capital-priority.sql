CREATE OR REPLACE FUNCTION cip_market_private.capacity_slot(c text, h timestamp with time zone)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare cfg public.cip_faro_config;day_start timestamptz:=(h at time zone 'America/Sao_Paulo')::date::timestamp at time zone 'America/Sao_Paulo';day_end timestamptz:=day_start+interval '1 day';n integer;remaining integer;visited uuid[];chosen uuid[];hot uuid[];special uuid[];core uuid[];fresh integer;inserted integer;
begin
 select * into cfg from public.cip_faro_config where company_id=c for update;
 if cfg.company_id is null or not cfg.enabled or not cip_market_private.sponsor(c) or cfg.circuit_until>now() or cfg.last_slot is not distinct from h then return 0;end if;
 select least(greatest(0,cfg.daily_limit-count(*)),greatest(0,cfg.web_daily_limit-coalesce(sum(reserved_calls) filter(where claimed_at>=day_start and claimed_at<day_end),0)-count(*) filter(where state='queued'))) into remaining from public.cip_faro_jobs where company_id=c and slot>=day_start and slot<day_end;
 n:=least(cfg.products_per_hour,remaining);
 select coalesce(array_agg(distinct portfolio_id),'{}') into visited from public.cip_faro_jobs where company_id=c and slot>=day_start and slot<day_end;
 select coalesce(array_agg(id),'{}') into hot from(select id from public.cip_faro_portfolio where company_id=c and active order by (our->>'curve'='A') desc nulls last,pinned desc,stock_value desc,sku limit least(cfg.hot_count,n))x;
 select coalesce(array_agg(id),'{}') into special from(select id from public.cip_faro_portfolio where company_id=c and active and special_enabled and not(id=any(hot)) and (last_queued_at is null or last_queued_at<=h-interval '4 hours') order by last_queued_at nulls first,special_updated_at,id limit greatest(0,n-cardinality(hot)))x;
 chosen:=hot||special;
 select count(*) into fresh from unnest(chosen)x where not(x=any(visited));
 select coalesce(array_agg(id),'{}') into core from(select id from public.cip_faro_portfolio where company_id=c and active and not(id=any(visited||chosen)) order by date_trunc('day',last_queued_at at time zone 'America/Sao_Paulo') asc nulls first,stock_value desc nulls last,(our->>'curve'='A') desc nulls last,sku limit least(greatest(0,n-cardinality(chosen)),greatest(0,cfg.daily_unique_target-cardinality(visited)-fresh)))x;
 chosen:=chosen||core;
 insert into public.cip_faro_jobs(company_id,portfolio_id,slot,priority,discovery)
 select c,p.id,h,case when p.special_enabled then 110 when p.id=any(hot) then 100 else 50 end,
 case when p.special_enabled then p.special_mode='expanded' and mod(floor(extract(epoch from h)/3600)::bigint,3)=1 else p.id=core[cardinality(core)] and not(p.id=any(hot)) end
 from public.cip_faro_portfolio p where p.id=any(chosen) on conflict(portfolio_id,slot) do nothing;
 get diagnostics inserted=row_count;
 update public.cip_faro_portfolio set last_queued_at=h where id=any(chosen);
 update public.cip_faro_config set last_slot=h where company_id=c;
 insert into public.cip_mp_desk_events(company_id,actor,kind,detail) values(c,cfg.owner_id,'faro_hourly_queue',jsonb_build_object('slot',h,'queued',inserted,'daily_unique_target',cfg.daily_unique_target,'hot_limit',cfg.hot_count,'special_revisit_hours',4,'web_calls_per_task',1,'source','declared_mix','erp_executed',false));
 return inserted;
end;$function$;
