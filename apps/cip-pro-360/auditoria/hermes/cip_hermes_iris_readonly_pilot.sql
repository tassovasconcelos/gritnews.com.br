-- Pilot: credentials are provisioned separately. This migration grants no reader a credential.
begin;
create schema cip_hermes_reader_private;
revoke all on schema cip_hermes_reader_private from public;
create table cip_hermes_reader_private.pilot_keys (
  token_hash bytea primary key check (octet_length(token_hash) = 32),
  expires_at timestamptz not null,
  revoked_at timestamptz
);
alter table cip_hermes_reader_private.pilot_keys enable row level security;
revoke all on cip_hermes_reader_private.pilot_keys from public, anon, authenticated;
create function cip_hermes_reader_private.read_iris_context()
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
declare
  headers jsonb := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::jsonb;
  token text := headers ->> 'x-cip-hermes-token';
  context jsonb;
begin
  if token is null or token !~ '^[0-9a-f]{64}$' or not exists (
    select 1 from cip_hermes_reader_private.pilot_keys k
    where k.token_hash = extensions.digest(token, 'sha256')
      and k.expires_at > now() and k.revoked_at is null
  ) then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'company', c.company_id, 'agent', c.agent_id, 'cycle_id', c.cycle_id,
    'updated_at', c.updated_at, 'source_stale', c.evidence -> 'stale',
    'orientations', coalesce((
      select jsonb_agg(to_jsonb(m) order by m.reviewed_at desc, m.id)
      from (
        select a.id, a.title, left(a.content, 1200) as excerpt, a.reviewed_at, a.review_due
        from public.cip_academy_materials a
        where a.company_id = c.company_id and a.agent_id = c.agent_id
          and a.kind = 'orientation' and a.ingestion_status = 'not_required'
          and a.status = 'approved' and a.review_due >= (now() at time zone 'America/Sao_Paulo')::date
          and not exists (
            select 1 from public.cip_academy_materials replacement
            where replacement.company_id = a.company_id and replacement.supersedes_id = a.id
              and replacement.status = 'approved'
          )
        order by a.reviewed_at desc, a.id limit 3
      ) m
    ), '[]'::jsonb)
  ) into context
  from public.cip_agent_learning_context c
  join public.cip_agent_controls ctl on ctl.company_id = c.company_id and ctl.enabled is true
  where c.company_id = 'distribuidora_prohospital' and c.agent_id = 'b2g'
    and c.updated_at between now() - interval '25 minutes' and now() + interval '1 minute';
  return context;
end;
$$;
revoke all on function cip_hermes_reader_private.read_iris_context() from public, anon, authenticated;
grant usage on schema cip_hermes_reader_private to anon;
grant execute on function cip_hermes_reader_private.read_iris_context() to anon;
create function public.cip_hermes_read_iris_pilot()
returns jsonb language sql stable security invoker set search_path = ''
as $$ select cip_hermes_reader_private.read_iris_context(); $$;
revoke all on function public.cip_hermes_read_iris_pilot() from public, anon, authenticated;
grant execute on function public.cip_hermes_read_iris_pilot() to anon;
commit;
