begin;
create table public.cip_b2g_web_usage(
 actor_id uuid not null references auth.users(id), day date not null,
 attempts integer not null check(attempts between 1 and 20), primary key(actor_id,day)
);
alter table public.cip_b2g_web_usage enable row level security;
revoke all on public.cip_b2g_web_usage from public,anon,authenticated;
grant select,insert,update on public.cip_b2g_web_usage to service_role;
create function public.cip_b2g_web_claim(p_actor uuid) returns boolean language plpgsql set search_path='' as $$
declare used integer;
begin
 if not exists(select 1 from public.cip_profiles p where p.user_id=p_actor and p.active and
 (p.role='superadm' or exists(select 1 from public.cip_memberships m where m.user_id=p_actor and m.active and m.company_id='distribuidora_prohospital'))) then return false;end if;
 insert into public.cip_b2g_web_usage(actor_id,day,attempts) values(p_actor,(now() at time zone 'America/Sao_Paulo')::date,1)
 on conflict(actor_id,day) do update set attempts=public.cip_b2g_web_usage.attempts+1 where public.cip_b2g_web_usage.attempts<20 returning attempts into used;
 return used is not null;
end;$$;
revoke all on function public.cip_b2g_web_claim(uuid) from public,anon,authenticated;
grant execute on function public.cip_b2g_web_claim(uuid) to service_role;
create table public.cip_b2g_search_feedback(
 actor_id uuid not null references auth.users(id), query_key text not null, source_hash text not null,
 terms jsonb not null check(jsonb_typeof(terms)='object' and octet_length(terms::text)<=800),
 source_url text not null check(length(source_url)<=1500 and source_url ~ '^https://([a-zA-Z0-9-]+\.)*gov\.br/'),
 verdict text not null check(verdict in ('relevant','irrelevant')), updated_at timestamptz not null default now(),
 primary key(actor_id,query_key,source_hash)
);
alter table public.cip_b2g_search_feedback enable row level security;
revoke all on public.cip_b2g_search_feedback from public,anon,authenticated;
grant select,insert,update on public.cip_b2g_search_feedback to authenticated;
grant all on public.cip_b2g_search_feedback to service_role;
create policy b2g_feedback_read on public.cip_b2g_search_feedback for select to authenticated
 using(actor_id=(select auth.uid()) and public.cip_can_access('distribuidora_prohospital'));
create policy b2g_feedback_insert on public.cip_b2g_search_feedback for insert to authenticated
 with check(actor_id=(select auth.uid()) and public.cip_can_access('distribuidora_prohospital'));
create policy b2g_feedback_update on public.cip_b2g_search_feedback for update to authenticated
 using(actor_id=(select auth.uid()) and public.cip_can_access('distribuidora_prohospital'))
 with check(actor_id=(select auth.uid()) and public.cip_can_access('distribuidora_prohospital'));
create function public.cip_b2g_feedback_save(p_terms jsonb,p_url text,p_verdict text) returns void language sql set search_path='' as $$
 insert into public.cip_b2g_search_feedback(actor_id,query_key,source_hash,terms,source_url,verdict)
 values((select auth.uid()),md5(p_terms::text),md5(p_url),p_terms,p_url,p_verdict)
 on conflict(actor_id,query_key,source_hash) do update set verdict=excluded.verdict,updated_at=now();
$$;
create function public.cip_b2g_feedback_list(p_terms jsonb) returns table(source_url text,verdict text) language sql stable set search_path='' as $$
 select f.source_url,f.verdict from public.cip_b2g_search_feedback f
 where f.actor_id=(select auth.uid()) and f.query_key=md5(p_terms::text) order by f.updated_at desc limit 50;
$$;
revoke all on function public.cip_b2g_feedback_save(jsonb,text,text),public.cip_b2g_feedback_list(jsonb) from public,anon;
grant execute on function public.cip_b2g_feedback_save(jsonb,text,text),public.cip_b2g_feedback_list(jsonb) to authenticated;
comment on table public.cip_b2g_search_feedback is 'Private per-user relevance preferences for public procurement sources. Not model training or proof of an award.';
commit;
