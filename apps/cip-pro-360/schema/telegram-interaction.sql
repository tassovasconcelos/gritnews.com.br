begin;
alter table public.cip_bot_bindings add column all_companies boolean not null default false,add column last_kind text,add column last_query text,add column last_at timestamptz;
alter table public.cip_bot_config add column ai_secret_id uuid,add column ai_enabled boolean not null default false,add column interaction_version integer not null default 1;
alter table public.cip_bot_updates add column ai_used boolean not null default false;
grant select(all_companies) on public.cip_bot_bindings to authenticated;
create function public.cip_bot_context(p_telegram text,p_chat text) returns jsonb language plpgsql security definer set search_path='' as $$
declare b public.cip_bot_bindings;
begin
 select * into b from public.cip_bot_bindings where telegram_id=p_telegram and chat_id=p_chat and active;
 if not found or not exists(select 1 from public.cip_profiles where user_id=b.user_id and active and role='superadm') then return jsonb_build_object('authorized',false);end if;
 return jsonb_build_object('authorized',true,'company',b.company_id,'all',b.all_companies,'companies',array['shopping_prohospital','distribuidora_prohospital'],'last_kind',case when b.last_at>now()-interval '20 minutes' then b.last_kind end,'last_query',case when b.last_at>now()-interval '20 minutes' then b.last_query end);
end;$$;
create function public.cip_bot_choose_company(p_telegram text,p_chat text,p_company text) returns boolean language plpgsql security definer set search_path='' as $$
begin
 if coalesce(p_company,'') not in ('shopping_prohospital','distribuidora_prohospital','all') or not exists(select 1 from public.cip_bot_bindings b join public.cip_profiles p on p.user_id=b.user_id where b.telegram_id=p_telegram and b.chat_id=p_chat and b.active and p.active and p.role='superadm') then return false;end if;
 update public.cip_bot_bindings set company_id=case when p_company='all' then company_id else p_company end,all_companies=(p_company='all'),last_kind=null,last_query=null,last_at=null where telegram_id=p_telegram and chat_id=p_chat and active;return true;
end;$$;
create function public.cip_bot_remember(p_telegram text,p_chat text,p_kind text,p_query text) returns void language sql security definer set search_path='' as $$
 update public.cip_bot_bindings b set last_kind=p_kind,last_query=left(p_query,200),last_at=now() where telegram_id=p_telegram and chat_id=p_chat and active and p_kind in ('summary','missions','processes','knowledge') and exists(select 1 from public.cip_profiles p where p.user_id=b.user_id and p.active and p.role='superadm');
$$;
create function public.cip_bot_ai_save(p_actor uuid,p_key text,p_enabled boolean) returns void language plpgsql security definer set search_path='' as $$
declare cfg public.cip_bot_config;secret_id uuid;
begin
 if not exists(select 1 from public.cip_profiles where user_id=p_actor and active and role='superadm') then raise exception 'superadmin_required';end if;
 select * into cfg from public.cip_bot_config where id=1 for update;if not found then raise exception 'configure_bot_first';end if;
 if p_enabled then
  if char_length(coalesce(p_key,'')) not between 20 and 300 or p_key !~ '^sk-[A-Za-z0-9_-]+$' then raise exception 'invalid_key';end if;
  secret_id=cfg.ai_secret_id;
  if secret_id is null then secret_id=vault.create_secret(p_key,'cip_doquita_openai_v1','CIP Doquita: opted-in text and voice AI');else perform vault.update_secret(secret_id,p_key);end if;
  update public.cip_bot_config set ai_secret_id=secret_id,ai_enabled=true where id=1;
 else update public.cip_bot_config set ai_enabled=false where id=1;end if;
end;$$;
create function public.cip_bot_ai_claim(p_update bigint,p_telegram text,p_chat text) returns boolean language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.cip_bot_bindings b join public.cip_profiles p on p.user_id=b.user_id where b.telegram_id=p_telegram and b.chat_id=p_chat and b.active and p.active and p.role='superadm') then return false;end if;
 perform pg_advisory_xact_lock(hashtextextended(p_telegram,783));
 if exists(select 1 from public.cip_bot_updates where update_id=p_update and telegram_id=p_telegram and ai_used) then return true;end if;
 if (select count(*) from public.cip_bot_updates where telegram_id=p_telegram and ai_used and created_at>=date_trunc('day',now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo')>=100 then return false;end if;
 update public.cip_bot_updates set ai_used=true where update_id=p_update and telegram_id=p_telegram and state='processing';return found;
end;$$;
create or replace function public.cip_bot_config_read() returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('token',t.decrypted_secret,'secret',s.decrypted_secret,'bot_id',c.bot_id,'username',c.username,'configured_at',c.configured_at,'ai_enabled',c.ai_enabled,'interaction_version',c.interaction_version,'ai_key',case when c.ai_enabled then a.decrypted_secret end)
 from public.cip_bot_config c join vault.decrypted_secrets t on t.id=c.token_secret_id join vault.decrypted_secrets s on s.id=c.webhook_secret_id left join vault.decrypted_secrets a on a.id=c.ai_secret_id where c.id=1;
$$;
revoke all on function public.cip_bot_context(text,text),public.cip_bot_choose_company(text,text,text),public.cip_bot_remember(text,text,text,text),public.cip_bot_ai_save(uuid,text,boolean),public.cip_bot_ai_claim(bigint,text,text) from public,anon,authenticated;
grant execute on function public.cip_bot_context(text,text),public.cip_bot_choose_company(text,text,text),public.cip_bot_remember(text,text,text,text),public.cip_bot_ai_save(uuid,text,boolean),public.cip_bot_ai_claim(bigint,text,text) to service_role;
comment on table public.cip_bot_bindings is 'Permanent until revocation/suspension. Pairing code alone expires in 10 minutes. Authorized company selection persists. Conversation routing context lasts 20 minutes.';
create function public.cip_bot_report(p_telegram text,p_chat text,p_kind text,p_query text,p_company text) returns jsonb language plpgsql security definer set search_path='' as $$
declare b public.cip_bot_bindings;counts jsonb; knowledge jsonb;
begin
 select * into b from public.cip_bot_bindings where telegram_id=p_telegram and chat_id=p_chat and active;
 if not found or not exists(select 1 from public.cip_profiles where user_id=b.user_id and active and role='superadm') then return jsonb_build_object('authorized',false); end if;
 if coalesce(p_company,'') not in ('shopping_prohospital','distribuidora_prohospital') then return jsonb_build_object('authorized',false);end if;
 b.company_id=p_company;
 if p_kind='revoke' then update public.cip_bot_bindings set active=false where user_id=b.user_id;return jsonb_build_object('authorized',true,'revoked',true); end if;
 if p_kind in ('summary','missions') then
  select coalesce(jsonb_object_agg(status,cnt),'{}') into counts from(select status,count(*) cnt from public.cip_agent_work where company_id=b.company_id and kind='task' group by status) s;
 end if;
 if p_kind='knowledge' then
  select coalesce(jsonb_agg(jsonb_build_object('title',s.title,'locator',s.locator,'content',left(s.content,850),'date',s.created_at)),'[]') into knowledge from(
   select m.title,c.value->>'locator' locator,c.value->>'text' content,e.created_at from public.cip_academy_materials m
   join public.cip_academy_extractions e on e.id=m.approved_extraction_id and e.material_id=m.id and e.company_id=m.company_id
   cross join lateral jsonb_array_elements(e.chunks) c(value)
   where m.company_id=b.company_id and m.status='approved' and m.review_due>=current_date and m.ingestion_status='ready' and e.complete
   and not exists(select 1 from public.cip_academy_materials r where r.supersedes_id=m.id and r.status='approved' and r.review_due>=current_date)
   and char_length(btrim(p_query))>=3
   and to_tsvector('portuguese',m.title||' '||(c.value->>'text')) @@ websearch_to_tsquery('portuguese',left(p_query,200))
   order by e.created_at desc limit 2
  ) s;
 end if;
 return jsonb_build_object('authorized',true,'company',b.company_id,'generated_at',now(),'missions',counts,'knowledge',knowledge,
 'processes',case when p_kind in ('summary','processes') then(select count(*) from public.cip_processes where company_id=b.company_id) end,
 'materials',case when p_kind='summary' then(select count(*) from public.cip_academy_materials where company_id=b.company_id and status='approved' and review_due>=current_date) end);
end;$$;
revoke all on function public.cip_bot_report(text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.cip_bot_report(text,text,text,text,text) to service_role;

create or replace function public.cip_bot_bind(p_hash text,p_telegram text,p_chat text) returns boolean language plpgsql security definer set search_path='' as $$
declare code public.cip_bot_pair_codes;
begin
 if p_telegram !~ '^[1-9][0-9]{0,19}$' or p_chat<>p_telegram then return false; end if;
 select * into code from public.cip_bot_pair_codes where token_hash=p_hash and not consumed and expires_at>now() for update;
 if not found or not exists(select 1 from public.cip_profiles where user_id=code.user_id and active and role='superadm') then return false; end if;
 if exists(select 1 from public.cip_bot_bindings where telegram_id=p_telegram and user_id<>code.user_id) then return false; end if;
 insert into public.cip_bot_bindings(user_id,telegram_id,chat_id,company_id) values(code.user_id,p_telegram,p_chat,code.company_id)
 on conflict(user_id) do update set telegram_id=excluded.telegram_id,chat_id=excluded.chat_id,company_id=excluded.company_id,active=true,created_at=now(),all_companies=false,last_kind=null,last_query=null,last_at=null;
 update public.cip_bot_pair_codes set consumed=true where token_hash=p_hash;return true;
end;$$;
revoke all on function public.cip_bot_bind(text,text,text) from public,anon,authenticated;
grant execute on function public.cip_bot_bind(text,text,text) to service_role;

create function public.cip_bot_interaction_ready(p_bot_id text) returns void language sql security definer set search_path='' as $$
 update public.cip_bot_config set interaction_version=2 where id=1 and bot_id=p_bot_id;
$$;
revoke all on function public.cip_bot_interaction_ready(text) from public,anon,authenticated;
grant execute on function public.cip_bot_interaction_ready(text) to service_role;
create or replace function public.cip_bot_claim(p_update bigint,p_telegram text) returns text language plpgsql security definer set search_path='' as $$
declare item public.cip_bot_updates;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_telegram,781));
 select * into item from public.cip_bot_updates where update_id=p_update for update;
 if found then
  if item.state='done' then return 'done'; end if;
  if item.attempts>=3 then return 'exhausted'; end if;
  if item.state='processing' and item.updated_at>now()-interval '3 minutes' then return 'busy'; end if;
  update public.cip_bot_updates set state='processing',attempts=attempts+1,updated_at=now() where update_id=p_update;return 'claimed';
 end if;
 if (select count(*) from public.cip_bot_updates where telegram_id=p_telegram and created_at>now()-interval '1 minute')>=12 then return 'limited'; end if;
 insert into public.cip_bot_updates(update_id,telegram_id,state) values(p_update,p_telegram,'processing');return 'claimed';
end;$$;
revoke all on function public.cip_bot_claim(bigint,text) from public,anon,authenticated;
grant execute on function public.cip_bot_claim(bigint,text) to service_role;

commit;
