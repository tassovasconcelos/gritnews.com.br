begin;
create table public.cip_procfit_source_checks(
 source_view text primary key check(source_view='st.TASS_PRODUTOS_TOMBAMENTOS_LOCACAO'),
 captured_at timestamptz not null,
 status text not null check(status in ('contract_pending','mapping_required','source_error')),
 columns jsonb not null check(jsonb_typeof(columns)='array' and jsonb_array_length(columns)<=400),
 received_at timestamptz not null default now(),interval_seconds integer not null default 600 check(interval_seconds=600)
);
alter table public.cip_procfit_source_checks enable row level security;
revoke all on public.cip_procfit_source_checks from public,anon,authenticated;
grant select on public.cip_procfit_source_checks to authenticated;
grant all on public.cip_procfit_source_checks to service_role;
create policy cip_source_superadmin on public.cip_procfit_source_checks for select to authenticated using(exists(select 1 from public.cip_profiles where user_id=(select auth.uid()) and active and role='superadm'));
create function public.cip_procfit_source_receive(p_value jsonb) returns boolean language plpgsql security invoker set search_path='' as $$
begin
 insert into public.cip_procfit_source_checks(source_view,captured_at,status,columns)
 values(p_value->>'source_view',(p_value->>'captured_at')::timestamptz,p_value->>'status',p_value->'columns')
 on conflict(source_view) do update set captured_at=excluded.captured_at,status=excluded.status,columns=excluded.columns,received_at=now()
 where public.cip_procfit_source_checks.captured_at<excluded.captured_at;
 return true;
end;$$;
revoke all on function public.cip_procfit_source_receive(jsonb) from public,anon,authenticated;
grant execute on function public.cip_procfit_source_receive(jsonb) to service_role;
comment on table public.cip_procfit_source_checks is 'CIP-only source contract checks, no rental or financial rows. Does not imply business data synchronized.';
commit;
