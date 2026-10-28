begin;
create table public.cip_process_ai_usage(actor_id uuid not null references auth.users(id),day date not null,attempts integer not null check(attempts between 1 and 20),primary key(actor_id,day));
alter table public.cip_process_ai_usage enable row level security;
revoke all on public.cip_process_ai_usage from public,anon,authenticated;
grant select,insert,update on public.cip_process_ai_usage to service_role;
create function public.cip_process_ai_claim(p_actor uuid) returns boolean language plpgsql set search_path='' as $$
declare used integer;
begin
 if not exists(select 1 from public.cip_profiles where user_id=p_actor and active and role<>'leitura') then return false; end if;
 insert into public.cip_process_ai_usage(actor_id,day,attempts) values(p_actor,(now() at time zone 'America/Sao_Paulo')::date,1)
 on conflict(actor_id,day) do update set attempts=public.cip_process_ai_usage.attempts+1 where public.cip_process_ai_usage.attempts<20 returning attempts into used;
 return used is not null;
end;$$;
revoke all on function public.cip_process_ai_claim(uuid) from public,anon,authenticated;
grant execute on function public.cip_process_ai_claim(uuid) to service_role;
comment on table public.cip_process_ai_usage is 'Private bounded assistant usage counters only. No prompt, graph or provider credentials.';
commit;
