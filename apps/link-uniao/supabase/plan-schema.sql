-- Additive: existing survey rows, grants and RLS are untouched.
create table public.lu_plan_state (
 campaign_id text primary key references public.lu_survey_campaigns(id),
 version integer not null default 1 check(version>0),
 document jsonb not null check(jsonb_typeof(document)='object'),
 updated_at timestamptz not null default now()
);
create table public.lu_plan_audit (
 id bigint generated always as identity primary key,
 campaign_id text not null references public.lu_survey_campaigns(id),
 version integer not null,
 actor text not null,
 operation text not null,
 reason text not null,
 document jsonb not null,
 created_at timestamptz not null default now(),
 unique(campaign_id,version)
);
alter table public.lu_plan_state enable row level security;
alter table public.lu_plan_audit enable row level security;
create policy lu_plan_state_deny_direct on public.lu_plan_state as restrictive for all to anon,authenticated using(false) with check(false);
create policy lu_plan_audit_deny_direct on public.lu_plan_audit as restrictive for all to anon,authenticated using(false) with check(false);
revoke all on public.lu_plan_state,public.lu_plan_audit from anon,authenticated;
grant select,insert,update on public.lu_plan_state to service_role;
grant select,insert on public.lu_plan_audit to service_role;
grant usage,select on sequence public.lu_plan_audit_id_seq to service_role;
create function public.lu_plan_commit(p_campaign text,p_expected integer,p_document jsonb,p_actor text,p_operation text,p_reason text)
returns integer language plpgsql security invoker set search_path='' as $$
declare v integer;
begin
 perform pg_advisory_xact_lock(hashtext('lu_plan:'||p_campaign));
 select version into v from public.lu_plan_state where campaign_id=p_campaign for update;
 if coalesce(v,0)<>p_expected then raise exception 'VERSION_CONFLICT' using errcode='40001'; end if;
 v:=coalesce(v,0)+1;
 insert into public.lu_plan_state(campaign_id,version,document) values(p_campaign,v,p_document)
 on conflict(campaign_id) do update set version=excluded.version,document=excluded.document,updated_at=now();
 insert into public.lu_plan_audit(campaign_id,version,actor,operation,reason,document) values(p_campaign,v,p_actor,p_operation,p_reason,p_document);
 return v;
end $$;
revoke all on function public.lu_plan_commit(text,integer,jsonb,text,text,text) from public,anon,authenticated;
grant execute on function public.lu_plan_commit(text,integer,jsonb,text,text,text) to service_role;
