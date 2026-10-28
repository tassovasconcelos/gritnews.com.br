-- Read-only operational readiness. Global diagnostics remain exclusive to an active superadmin.
begin;
create function cip_agent_private.operation_readiness() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare companies jsonb;access_info jsonb;bot jsonb;catalog jsonb;monitor jsonb;school jsonb;cycles jsonb;jobs jsonb;
begin
 if auth.uid() is null or not exists(select 1 from public.cip_profiles where user_id=(select auth.uid()) and active and role='superadm') then raise exception 'superadmin_required';end if;
 select jsonb_agg(jsonb_build_object(
 'id',c.id,'stock_as_of',(select b.as_of from public.cip_stock_intelligence_batches b where b.company_id=c.id and b.status='active' order by b.as_of desc,b.created_at desc,b.id limit 1),
 'erp_approved',(select count(*) from public.cip_erp_snapshots s where s.company_id=c.id and s.status='approved'),
 'erp_captured_at',(select max(s.captured_at) from public.cip_erp_snapshots s where s.company_id=c.id and s.status='approved'),
 'stock_proposals',(select count(*) from public.cip_stock_actions a where a.company_id=c.id and a.state='sugerida'),
 'stock_results',(select count(*) from public.cip_stock_actions a where a.company_id=c.id and a.state='concluida'),
 'price_policy_version',(select max(p.version) from public.cip_mp_campaign_policies p where p.company_id=c.id),
 'campaign_proposals',(select count(*) from public.cip_mp_campaign_proposals p where p.company_id=c.id),
 'cycle_total',(select count(*) from public.cip_agent_cycles a where a.company_id=c.id),
 'cycle_at',(select max(a.created_at) from public.cip_agent_cycles a where a.company_id=c.id),
 'cycle_failures_24h',(select count(*) from public.cip_agent_events e where e.company_id=c.id and e.event_type='cycle_failed' and e.created_at>=now()-interval '1 day'),
 'agents_enabled',(select a.enabled from public.cip_agent_controls a where a.company_id=c.id),
 'cycle_interval_minutes',(select a.interval_minutes from public.cip_agent_controls a where a.company_id=c.id),
 'missions_open',(select count(*) from public.cip_agent_missions m where m.company_id=c.id and m.state in ('suggested','accepted','in_progress')),
 'missions_measured',(select count(*) from public.cip_agent_missions m where m.company_id=c.id and m.state='measured'),
 'cases_approved',(select count(*) from public.cip_agent_missions m where m.company_id=c.id and m.state='measured' and m.review_state='approved'),
 'councils',(select count(*) from public.cip_agent_councils x where x.company_id=c.id),
 'materials_current',(select count(*) from public.cip_academy_materials m where m.company_id=c.id and m.status='approved' and m.review_due>=current_date and not exists(select 1 from public.cip_academy_materials r where r.company_id=m.company_id and r.supersedes_id=m.id and r.status='approved' and r.review_due>=current_date)),
 'skills_draft',(select count(*) from public.cip_academy_skills s where s.company_id=c.id and s.status='draft'),
 'skills_valid',(select jsonb_array_length(public.cip_agent_skills(c.id))),
 'processes',(select count(*) from public.cip_processes p where p.company_id=c.id)
 ) order by c.id) into companies from public.cip_companies c where c.id in ('shopping_prohospital','distribuidora_prohospital');
 select jsonb_build_object('directors_active',(select count(*) from public.cip_profiles p where p.role='diretoria' and p.active),
 'director_invites_expired',(select count(*) from public.cip_user_invites i where i.role='diretoria' and i.state in ('pending','ready') and i.expires_at<now()),
 'director_invites_valid',(select count(*) from public.cip_user_invites i where i.role='diretoria' and i.state='ready' and i.expires_at>=now()),
 'directors_bound',(select count(*) from public.cip_bot_bindings b join public.cip_profiles p on p.user_id=b.user_id where p.role='diretoria' and p.active and b.active)) into access_info;
 select jsonb_build_object('configured',exists(select 1 from public.cip_bot_config c where c.token_secret_id is not null and c.webhook_secret_id is not null),
 'ai_configured',exists(select 1 from public.cip_bot_config c where c.ai_enabled and c.ai_secret_id is not null),
 'bindings_active',(select count(*) from public.cip_bot_bindings b join public.cip_profiles p on p.user_id=b.user_id where b.active and p.active),
 'updates_done',(select count(*) from public.cip_bot_updates where state='done'),
 'ai_updates_done',(select count(*) from public.cip_bot_updates where state='done' and ai_used),
 'last_update',(select max(updated_at) from public.cip_bot_updates where state='done'),
 'daily_optins',(select count(*) from public.cip_bot_bindings b join public.cip_profiles p on p.user_id=b.user_id where b.active and p.active and b.daily_stock),
 'daily_failures',(select count(*) from public.cip_bot_bindings b where b.active and b.daily_stock and b.daily_stock_status='failed')) into bot;
 select jsonb_build_object('captured_at',captured_at,'products',expected_products,'eans',expected_eans) into catalog from public.cip_procfit_catalog_batches where status='published' and active order by received_at desc,id limit 1;
 select jsonb_build_object('status',status,'received_at',received_at,'captured_at',captured_at) into monitor from public.cip_procfit_source_checks order by received_at desc limit 1;
 select coalesce(jsonb_agg(to_jsonb(x)),'[]') into jobs from(
 select j.jobname,j.active,j.schedule,max(r.end_time) last_end,count(*) filter(where r.status='failed') failures_24h
 from cron.job j left join cron.job_run_details r on r.jobid=j.jobid and r.start_time>=now()-interval '1 day'
 where j.jobname in ('cip-agent-operations','cip-academy-ingestion','cip-telegram-stock-daily') group by j.jobname,j.active,j.schedule order by j.jobname)x;
 return jsonb_build_object('schema',1,'checked_at',now(),'business_date',(now() at time zone 'America/Sao_Paulo')::date,'companies',companies,'access',access_info,'telegram',bot,'catalog',catalog,'source_monitor',monitor,'jobs',jobs,'basis','Contagens e estados do CIP; não certifica homologação, desempenho, backup ou resultado financeiro.');
end;$$;
revoke all on function cip_agent_private.operation_readiness() from public,anon,authenticated,service_role;
grant execute on function cip_agent_private.operation_readiness() to authenticated;
create function public.cip_operation_readiness() returns jsonb language sql stable security invoker set search_path='' as $$select cip_agent_private.operation_readiness();$$;
revoke all on function public.cip_operation_readiness() from public,anon,authenticated,service_role;
grant execute on function public.cip_operation_readiness() to authenticated;
comment on function public.cip_operation_readiness() is 'Active superadmin-only, read-only readiness aggregates. No credentials, invitation codes, identities, prompts or business values returned. Does not approve a deployment or business operation.';
commit;
