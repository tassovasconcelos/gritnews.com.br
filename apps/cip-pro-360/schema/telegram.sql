begin;
create table public.cip_bot_pair_codes(
 token_hash text primary key,user_id uuid not null references auth.users(id),company_id text not null references public.cip_companies(id),
 expires_at timestamptz not null,consumed boolean not null default false,created_at timestamptz not null default now()
);
create index cip_bot_pair_user_idx on public.cip_bot_pair_codes(user_id,created_at desc);
create table public.cip_bot_bindings(
 user_id uuid primary key references auth.users(id),telegram_id text unique not null,chat_id text not null,company_id text not null references public.cip_companies(id),active boolean not null default true,created_at timestamptz not null default now()
);
create table public.cip_bot_updates(
 update_id bigint primary key,telegram_id text not null,state text not null check(state in ('processing','done','failed')),attempts integer not null default 1,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create index cip_bot_updates_sender_idx on public.cip_bot_updates(telegram_id,created_at desc);
alter table public.cip_bot_pair_codes enable row level security;
alter table public.cip_bot_bindings enable row level security;
alter table public.cip_bot_updates enable row level security;
revoke all on public.cip_bot_pair_codes,public.cip_bot_bindings,public.cip_bot_updates from public,anon,authenticated;
grant select(user_id,company_id,active,created_at) on public.cip_bot_bindings to authenticated;
grant all on public.cip_bot_pair_codes,public.cip_bot_bindings,public.cip_bot_updates to service_role;
create policy bot_own_binding on public.cip_bot_bindings for select to authenticated using(user_id=(select auth.uid()) and public.cip_can_access(company_id));
create function public.cip_bot_pair_code(p_user uuid,p_company text) returns jsonb language plpgsql security definer set search_path='' as $$
declare code text;expiry timestamptz=now()+interval '10 minutes';
begin
 if not exists(select 1 from public.cip_profiles where user_id=p_user and active and role='superadm') or not exists(select 1 from public.cip_companies where id=p_company) then raise exception 'pilot_superadmin_required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,782));
 if (select count(*) from public.cip_bot_pair_codes where user_id=p_user and created_at>now()-interval '1 hour')>=10 then raise exception 'pair_rate_limit'; end if;
 update public.cip_bot_pair_codes set consumed=true where user_id=p_user and not consumed;
 code=encode(extensions.gen_random_bytes(32),'hex');
 insert into public.cip_bot_pair_codes(token_hash,user_id,company_id,expires_at) values(encode(extensions.digest(code,'sha256'),'hex'),p_user,p_company,expiry);
 return jsonb_build_object('code',code,'expires_at',expiry);
end;$$;
revoke all on function public.cip_bot_pair_code(uuid,text) from public,anon,authenticated;
grant execute on function public.cip_bot_pair_code(uuid,text) to service_role;
create function public.cip_bot_revoke(p_user uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 if p_user is null then raise exception 'authentication_required'; end if;
 update public.cip_bot_bindings set active=false where user_id=p_user;
 update public.cip_bot_pair_codes set consumed=true where user_id=p_user;
end;$$;
revoke all on function public.cip_bot_revoke(uuid) from public,anon,authenticated;
grant execute on function public.cip_bot_revoke(uuid) to service_role;
create function public.cip_bot_bind(p_hash text,p_telegram text,p_chat text) returns boolean language plpgsql security definer set search_path='' as $$
declare code public.cip_bot_pair_codes;
begin
 if p_telegram !~ '^[1-9][0-9]{0,19}$' or p_chat<>p_telegram then return false; end if;
 select * into code from public.cip_bot_pair_codes where token_hash=p_hash and not consumed and expires_at>now() for update;
 if not found or not exists(select 1 from public.cip_profiles where user_id=code.user_id and active and role='superadm') then return false; end if;
 if exists(select 1 from public.cip_bot_bindings where telegram_id=p_telegram and user_id<>code.user_id) then return false; end if;
 insert into public.cip_bot_bindings(user_id,telegram_id,chat_id,company_id) values(code.user_id,p_telegram,p_chat,code.company_id)
 on conflict(user_id) do update set telegram_id=excluded.telegram_id,chat_id=excluded.chat_id,company_id=excluded.company_id,active=true,created_at=now();
 update public.cip_bot_pair_codes set consumed=true where token_hash=p_hash;return true;
end;$$;
revoke all on function public.cip_bot_bind(text,text,text) from public,anon,authenticated;
grant execute on function public.cip_bot_bind(text,text,text) to service_role;
create function public.cip_bot_claim(p_update bigint,p_telegram text) returns text language plpgsql security definer set search_path='' as $$
declare item public.cip_bot_updates;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_telegram,781));
 select * into item from public.cip_bot_updates where update_id=p_update for update;
 if found then
  if item.state='done' then return 'done'; end if;
  if item.attempts>=3 then return 'exhausted'; end if;
  if item.state='processing' and item.updated_at>now()-interval '90 seconds' then return 'busy'; end if;
  update public.cip_bot_updates set state='processing',attempts=attempts+1,updated_at=now() where update_id=p_update;return 'claimed';
 end if;
 if (select count(*) from public.cip_bot_updates where telegram_id=p_telegram and created_at>now()-interval '1 minute')>=12 then return 'limited'; end if;
 insert into public.cip_bot_updates(update_id,telegram_id,state) values(p_update,p_telegram,'processing');return 'claimed';
end;$$;
revoke all on function public.cip_bot_claim(bigint,text) from public,anon,authenticated;
grant execute on function public.cip_bot_claim(bigint,text) to service_role;
create function public.cip_bot_read(p_telegram text,p_chat text,p_kind text,p_query text default '') returns jsonb language plpgsql security definer set search_path='' as $$
declare b public.cip_bot_bindings;counts jsonb; knowledge jsonb;
begin
 select * into b from public.cip_bot_bindings where telegram_id=p_telegram and chat_id=p_chat and active;
 if not found or not exists(select 1 from public.cip_profiles where user_id=b.user_id and active and role='superadm') then return jsonb_build_object('authorized',false); end if;
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
revoke all on function public.cip_bot_read(text,text,text,text) from public,anon,authenticated;
grant execute on function public.cip_bot_read(text,text,text,text) to service_role;
comment on table public.cip_bot_bindings is 'Pilot: active superadmin only. Private chat, explicit company, read-only reports. Rechecked on every request.';
commit;
