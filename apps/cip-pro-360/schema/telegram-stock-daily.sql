begin;
alter table public.cip_bot_bindings add column daily_stock boolean not null default false,add column daily_stock_attempt date,add column daily_stock_status text check(daily_stock_status in ('claimed','sent','failed'));
create function public.cip_bot_stock_subscribe(p_telegram text,p_chat text,p_enabled boolean default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid;enabled boolean;
begin
 select user_id,daily_stock into actor,enabled from public.cip_bot_bindings where telegram_id=p_telegram and chat_id=p_chat and chat_id=telegram_id and active for update;
 if actor is null or not 'shopping_prohospital'=any(public.cip_report_companies(actor)) then raise exception 'shopping_access_required';end if;
 if p_enabled is not null then
  update public.cip_bot_bindings set daily_stock=p_enabled where user_id=actor;
  insert into public.cip_access_events(actor_id,target_id,action,details) values(actor,actor,'telegram_stock_subscription',jsonb_build_object('enabled',p_enabled,'company','shopping_prohospital','from_hour_brasilia',8));enabled=p_enabled;
 end if;return jsonb_build_object('enabled',enabled,'hour',8);
end;$$;
create function public.cip_bot_stock_daily_claim() returns jsonb language plpgsql security definer set search_path='' as $$
declare local_day date=(now() at time zone 'America/Sao_Paulo')::date;result jsonb;
begin
 if extract(hour from now() at time zone 'America/Sao_Paulo') not between 8 and 19 then return '[]'::jsonb;end if;
 with due as (select user_id from public.cip_bot_bindings where active and daily_stock and chat_id=telegram_id and daily_stock_attempt is distinct from local_day and 'shopping_prohospital'=any(public.cip_report_companies(user_id)) order by created_at limit 5 for update skip locked),claimed as (update public.cip_bot_bindings b set daily_stock_attempt=local_day,daily_stock_status='claimed' from due where b.user_id=due.user_id returning b.telegram_id,b.chat_id)
 select coalesce(jsonb_agg(to_jsonb(claimed)),'[]'::jsonb) into result from claimed;return result;
end;$$;
create function public.cip_bot_stock_daily_finish(p_telegram text,p_success boolean) returns void language sql security definer set search_path='' as $$
 update public.cip_bot_bindings set daily_stock_status=case when p_success then 'sent' else 'failed' end where telegram_id=p_telegram and daily_stock_attempt=(now() at time zone 'America/Sao_Paulo')::date;
$$;
create function public.cip_bot_stock_daily_tick() returns void language plpgsql security definer set search_path='' as $$
declare secret text;
begin
 if not exists(select 1 from public.cip_bot_bindings where active and daily_stock and daily_stock_attempt is distinct from (now() at time zone 'America/Sao_Paulo')::date and 'shopping_prohospital'=any(public.cip_report_companies(user_id))) then return;end if;
 if extract(hour from now() at time zone 'America/Sao_Paulo') not between 8 and 19 then return;end if;
 select s.decrypted_secret into secret from public.cip_bot_config c join vault.decrypted_secrets s on s.id=c.webhook_secret_id where c.id=1;
 if secret is null then return;end if;
 perform net.http_post(url:='https://pcrwtoddavpvkaxwtstc.supabase.co/functions/v1/cip-telegram',headers:=jsonb_build_object('Content-Type','application/json','X-CIP-Stock-Daily-Secret',secret),body:='{}'::jsonb,timeout_milliseconds:=60000);
end;$$;
revoke all on function public.cip_bot_stock_subscribe(text,text,boolean),public.cip_bot_stock_daily_claim(),public.cip_bot_stock_daily_finish(text,boolean),public.cip_bot_stock_daily_tick() from public,anon,authenticated;
grant execute on function public.cip_bot_stock_subscribe(text,text,boolean),public.cip_bot_stock_daily_claim(),public.cip_bot_stock_daily_finish(text,boolean),public.cip_bot_stock_daily_tick() to service_role;
select cron.schedule('cip-telegram-stock-daily','*/10 * * * *','select public.cip_bot_stock_daily_tick();');
commit;
