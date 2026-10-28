begin;
-- Service-only authorization; never rely on model output or user-editable metadata.
create or replace function public.cip_report_companies(p_actor uuid) returns text[] language sql stable security definer set search_path='' as $$
 select coalesce(array_agg(c.id order by c.id),array[]::text[]) from public.cip_companies c
 where c.id in ('shopping_prohospital','distribuidora_prohospital') and exists(
 select 1 from public.cip_profiles p where p.user_id=p_actor and p.active and
 (p.role='superadm' or p.role='diretoria' and exists(select 1 from public.cip_memberships m where m.user_id=p.user_id and m.company_id=c.id and m.active)));
$$;
revoke all on function public.cip_report_companies(uuid) from public,anon,authenticated;
grant execute on function public.cip_report_companies(uuid) to service_role;


create or replace function public.cip_bot_pair_code(p_user uuid,p_company text) returns jsonb language plpgsql security definer set search_path='' as $$
declare code text;expiry timestamptz=now()+interval '10 minutes';
begin
 if not coalesce(p_company=any(public.cip_report_companies(p_user)),false) then raise exception 'pilot_superadmin_required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,782));
 if (select count(*) from public.cip_bot_pair_codes where user_id=p_user and created_at>now()-interval '1 hour')>=10 then raise exception 'pair_rate_limit'; end if;
 update public.cip_bot_pair_codes set consumed=true where user_id=p_user and not consumed;
 code=encode(extensions.gen_random_bytes(32),'hex');
 insert into public.cip_bot_pair_codes(token_hash,user_id,company_id,expires_at) values(encode(extensions.digest(code,'sha256'),'hex'),p_user,p_company,expiry);
 return jsonb_build_object('code',code,'expires_at',expiry);
end;$$;

create or replace function public.cip_bot_bind(p_hash text,p_telegram text,p_chat text) returns boolean language plpgsql security definer set search_path='' as $$
declare code public.cip_bot_pair_codes;
begin
 if p_telegram !~ '^[1-9][0-9]{0,19}$' or p_chat<>p_telegram then return false; end if;
 select * into code from public.cip_bot_pair_codes where token_hash=p_hash and not consumed and expires_at>now() for update;
 if not found or not coalesce(code.company_id=any(public.cip_report_companies(code.user_id)),false) then return false; end if;
 if exists(select 1 from public.cip_bot_bindings where telegram_id=p_telegram and user_id<>code.user_id) then return false; end if;
 insert into public.cip_bot_bindings(user_id,telegram_id,chat_id,company_id) values(code.user_id,p_telegram,p_chat,code.company_id)
 on conflict(user_id) do update set telegram_id=excluded.telegram_id,chat_id=excluded.chat_id,company_id=excluded.company_id,active=true,created_at=now(),all_companies=false,last_kind=null,last_query=null,last_at=null;
 update public.cip_bot_pair_codes set consumed=true where token_hash=p_hash;return true;
end;$$;

create or replace function public.cip_bot_context(p_telegram text,p_chat text) returns jsonb language plpgsql security definer set search_path='' as $$
declare b public.cip_bot_bindings;
begin
 select * into b from public.cip_bot_bindings where telegram_id=p_telegram and chat_id=p_chat and active;
 if not found or cardinality(public.cip_report_companies(b.user_id))=0 then return jsonb_build_object('authorized',false);end if;
 if not b.company_id=any(public.cip_report_companies(b.user_id)) then b.company_id=(public.cip_report_companies(b.user_id))[1];end if;
 return jsonb_build_object('authorized',true,'company',b.company_id,'all',b.all_companies,'companies',public.cip_report_companies(b.user_id),'last_kind',case when b.last_at>now()-interval '20 minutes' then b.last_kind end,'last_query',case when b.last_at>now()-interval '20 minutes' then b.last_query end);
end;$$;

create or replace function public.cip_bot_choose_company(p_telegram text,p_chat text,p_company text) returns boolean language plpgsql security definer set search_path='' as $$
begin
 if coalesce(p_company,'') not in ('shopping_prohospital','distribuidora_prohospital','all') or not exists(select 1 from public.cip_bot_bindings b join public.cip_profiles p on p.user_id=b.user_id where b.telegram_id=p_telegram and b.chat_id=p_chat and b.active and p.active and cardinality(public.cip_report_companies(b.user_id))>0 and (p_company='all' or p_company=any(public.cip_report_companies(b.user_id)))) then return false;end if;
 update public.cip_bot_bindings set company_id=case when p_company='all' then company_id else p_company end,all_companies=(p_company='all'),last_kind=null,last_query=null,last_at=null where telegram_id=p_telegram and chat_id=p_chat and active;return true;
end;$$;

create or replace function public.cip_bot_remember(p_telegram text,p_chat text,p_kind text,p_query text) returns void language sql security definer set search_path='' as $$
 update public.cip_bot_bindings b set last_kind=p_kind,last_query=left(p_query,200),last_at=now() where telegram_id=p_telegram and chat_id=p_chat and active and p_kind in ('summary','missions','processes','knowledge','sales_mtd','inventory','aged_stock','no_sales_stock','growth_actions') and cardinality(public.cip_report_companies(b.user_id))>0;
$$;

create or replace function public.cip_bot_ai_claim(p_update bigint,p_telegram text,p_chat text) returns boolean language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.cip_bot_bindings b join public.cip_profiles p on p.user_id=b.user_id where b.telegram_id=p_telegram and b.chat_id=p_chat and b.active and p.active and cardinality(public.cip_report_companies(b.user_id))>0) then return false;end if;
 perform pg_advisory_xact_lock(hashtextextended(p_telegram,783));
 if exists(select 1 from public.cip_bot_updates where update_id=p_update and telegram_id=p_telegram and ai_used) then return true;end if;
 if (select count(*) from public.cip_bot_updates where telegram_id=p_telegram and ai_used and created_at>=date_trunc('day',now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo')>=100 then return false;end if;
 update public.cip_bot_updates set ai_used=true where update_id=p_update and telegram_id=p_telegram and state='processing';return found;
end;$$;

create or replace function public.cip_bot_report(p_telegram text,p_chat text,p_kind text,p_query text,p_company text) returns jsonb language plpgsql security definer set search_path='' as $$
declare b public.cip_bot_bindings;counts jsonb; knowledge jsonb;
begin
 select * into b from public.cip_bot_bindings where telegram_id=p_telegram and chat_id=p_chat and active;
 if not found or cardinality(public.cip_report_companies(b.user_id))=0 then return jsonb_build_object('authorized',false); end if;
 if coalesce(p_company,'') not in ('shopping_prohospital','distribuidora_prohospital') then return jsonb_build_object('authorized',false);end if;
 b.company_id=p_company;
 if not coalesce(p_company=any(public.cip_report_companies(b.user_id)),false) then return jsonb_build_object('authorized',false);end if;
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

create or replace function public.cip_bot_read(p_telegram text,p_chat text,p_kind text,p_query text default '') returns jsonb language plpgsql security definer set search_path='' as $$
declare b public.cip_bot_bindings;counts jsonb; knowledge jsonb;
begin
 select * into b from public.cip_bot_bindings where telegram_id=p_telegram and chat_id=p_chat and active;
 if not found or cardinality(public.cip_report_companies(b.user_id))=0 then return jsonb_build_object('authorized',false); end if;
 if p_kind='revoke' then update public.cip_bot_bindings set active=false where user_id=b.user_id;return jsonb_build_object('authorized',true,'revoked',true); end if;
 if not coalesce(b.company_id=any(public.cip_report_companies(b.user_id)),false) then return jsonb_build_object('authorized',false);end if;
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

create or replace function public.cip_bot_erp_get(p_telegram text,p_chat text,p_company text) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare b public.cip_bot_bindings;
begin
 select * into b from public.cip_bot_bindings where telegram_id=p_telegram and chat_id=p_chat and active;
 if not found or cardinality(public.cip_report_companies(b.user_id))=0 then raise exception 'authorized_binding_required';end if;
 return public.cip_erp_get(b.user_id,p_company,null);
end;$$;

create or replace function public.cip_erp_get(p_actor uuid,p_company text,p_id uuid default null) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare rec public.cip_erp_snapshots;is_admin boolean;
begin
 select role='superadm' into is_admin from public.cip_profiles where user_id=p_actor and active;
 if not coalesce(p_company=any(public.cip_report_companies(p_actor)),false) then raise exception 'financial_access_required';end if;
 select * into rec from public.cip_erp_snapshots where company_id=p_company and (is_admin or status='approved') and (p_id is not null and id=p_id or p_id is null and status='approved') order by captured_at desc,created_at desc limit 1;
 if not found then return null;end if;
 return jsonb_build_object('id',rec.id,'company_id',rec.company_id,'source_name',rec.source_name,'source_hash',rec.source_hash,'captured_at',rec.captured_at,'status',rec.status,'reviewed_at',rec.reviewed_at,'payload',rec.payload);
end;$$;

-- Direct browser snapshot metadata remains superadmin-only; directors receive approved summaries through the authenticated Edge Function.
comment on table public.cip_bot_bindings is 'Permanent private-chat bindings for active superadmin/directors; company memberships rechecked per request. Codes expire in 10 minutes.';
commit;
