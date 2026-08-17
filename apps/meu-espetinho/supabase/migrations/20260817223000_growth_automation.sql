-- Growth Automation: métricas, recomendações e regras internas de otimização.
alter table public.marketing_campaigns add column if not exists auto_optimize boolean not null default false;
alter table public.marketing_campaigns add column if not exists max_daily_budget numeric(12,2);
alter table public.marketing_campaigns add column if not exists external_campaign_id text;
alter table public.marketing_campaigns add column if not exists last_optimized_at timestamptz;

create table if not exists public.marketing_campaign_metrics (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.marketing_campaigns(id) on delete cascade,
  metric_date date not null default current_date,
  spend numeric(12,2) not null default 0,
  impressions bigint not null default 0,
  clicks bigint not null default 0,
  trial_starts bigint not null default 0,
  checkouts bigint not null default 0,
  subscriptions bigint not null default 0,
  revenue numeric(12,2) not null default 0,
  source text not null default 'manual',
  created_at timestamptz not null default now(),
  unique(campaign_id,metric_date,source)
);

create table if not exists public.marketing_automation_recommendations (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.marketing_campaigns(id) on delete cascade,
  recommendation_type text not null,
  severity text not null default 'info',
  title text not null,
  reason text not null,
  suggested_daily_budget numeric(12,2),
  status text not null default 'open',
  applied_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.marketing_campaign_metrics enable row level security;
alter table public.marketing_automation_recommendations enable row level security;

drop policy if exists marketing_metrics_admin_all on public.marketing_campaign_metrics;
create policy marketing_metrics_admin_all on public.marketing_campaign_metrics for all to authenticated
using (exists(select 1 from public.admin_users a where a.user_id=auth.uid() and a.active=true))
with check (exists(select 1 from public.admin_users a where a.user_id=auth.uid() and a.active=true));

drop policy if exists marketing_recommendations_admin_all on public.marketing_automation_recommendations;
create policy marketing_recommendations_admin_all on public.marketing_automation_recommendations for all to authenticated
using (exists(select 1 from public.admin_users a where a.user_id=auth.uid() and a.active=true))
with check (exists(select 1 from public.admin_users a where a.user_id=auth.uid() and a.active=true));

create or replace function public.evaluate_growth_campaigns(p_apply boolean default false)
returns jsonb language plpgsql security definer set search_path=public as $$
declare c record; m record; v_cpa numeric; v_ctr numeric; v_roas numeric; v_new_budget numeric; v_count int:=0; v_applied int:=0;
begin
  if not exists(select 1 from public.admin_users where user_id=auth.uid() and active=true) then raise exception 'forbidden'; end if;
  for c in select * from public.marketing_campaigns where status='active' loop
    select coalesce(sum(spend),0) spend,coalesce(sum(impressions),0) impressions,coalesce(sum(clicks),0) clicks,
      coalesce(sum(trial_starts),0) trial_starts,coalesce(sum(subscriptions),0) subscriptions,coalesce(sum(revenue),0) revenue
    into m from public.marketing_campaign_metrics where campaign_id=c.id and metric_date>=current_date-6;
    if m.spend<=0 then continue; end if;
    v_cpa:=case when m.subscriptions>0 then m.spend/m.subscriptions else null end;
    v_ctr:=case when m.impressions>0 then (m.clicks::numeric/m.impressions)*100 else 0 end;
    v_roas:=case when m.spend>0 then m.revenue/m.spend else 0 end;

    delete from public.marketing_automation_recommendations where campaign_id=c.id and status='open';

    if m.subscriptions=0 and m.spend>=greatest(coalesce(c.target_cpa,35)*2,70) then
      insert into public.marketing_automation_recommendations(campaign_id,recommendation_type,severity,title,reason)
      values(c.id,'pause','critical','Revisar ou pausar campanha','Investimento acumulado sem assinatura nos últimos 7 dias.'); v_count:=v_count+1;
      if p_apply and c.auto_optimize then update public.marketing_campaigns set status='paused',last_optimized_at=now() where id=c.id; v_applied:=v_applied+1; end if;
    elsif c.target_cpa is not null and v_cpa is not null and v_cpa<=c.target_cpa*0.8 and m.subscriptions>=2 then
      v_new_budget:=least(coalesce(c.max_daily_budget,c.daily_budget*1.5),round(c.daily_budget*1.15,2));
      insert into public.marketing_automation_recommendations(campaign_id,recommendation_type,severity,title,reason,suggested_daily_budget)
      values(c.id,'scale','success','Escalar com cautela','CPA está pelo menos 20% abaixo da meta e há conversões suficientes.',v_new_budget); v_count:=v_count+1;
      if p_apply and c.auto_optimize and v_new_budget>c.daily_budget then update public.marketing_campaigns set daily_budget=v_new_budget,last_optimized_at=now() where id=c.id; v_applied:=v_applied+1; end if;
    elsif c.target_cpa is not null and v_cpa is not null and v_cpa>c.target_cpa*1.35 then
      v_new_budget:=greatest(10,round(c.daily_budget*0.8,2));
      insert into public.marketing_automation_recommendations(campaign_id,recommendation_type,severity,title,reason,suggested_daily_budget)
      values(c.id,'reduce','warning','Reduzir verba e testar criativo','CPA está mais de 35% acima da meta.',v_new_budget); v_count:=v_count+1;
      if p_apply and c.auto_optimize then update public.marketing_campaigns set daily_budget=v_new_budget,last_optimized_at=now() where id=c.id; v_applied:=v_applied+1; end if;
    elsif v_ctr<0.7 and m.impressions>=1500 then
      insert into public.marketing_automation_recommendations(campaign_id,recommendation_type,severity,title,reason)
      values(c.id,'creative','warning','Trocar criativo ou mensagem','CTR abaixo de 0,7% com volume suficiente de impressões.'); v_count:=v_count+1;
    elsif v_roas>=3 and m.subscriptions>=2 then
      insert into public.marketing_automation_recommendations(campaign_id,recommendation_type,severity,title,reason)
      values(c.id,'scale','success','Campanha saudável','ROAS acima de 3x. Manter e testar aumento gradual de verba.'); v_count:=v_count+1;
    end if;
  end loop;
  return jsonb_build_object('ok',true,'recommendations',v_count,'actions_applied',v_applied,'mode',case when p_apply then 'apply' else 'recommend' end);
end;$$;
revoke all on function public.evaluate_growth_campaigns(boolean) from public,anon;
grant execute on function public.evaluate_growth_campaigns(boolean) to authenticated,service_role;
