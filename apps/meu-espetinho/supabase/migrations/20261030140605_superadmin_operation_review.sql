-- Operational acceptance records; intentionally separate from fiscal and commercial release.
create table private.operation_reviews (
 app text not null check(app in ('meu-espetinho','sr-padeiro')), scope_id uuid not null,
 checks jsonb not null default '{}', notes text not null default '',
 status text not null check(status in ('pending','needs_attention','approved')),
 updated_by uuid not null references auth.users(id), updated_at timestamptz not null default now(),
 primary key(app,scope_id)
);
alter table private.operation_reviews enable row level security;
revoke all on private.operation_reviews from public,anon,authenticated;

create function private.ops_operation_review(a text,s uuid,payload jsonb default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare result jsonb; checked jsonb; state text; memo text;
begin
 perform public.ops_account_request_guard();
 if not private.ops_super() then raise exception 'superadmin_required' using errcode='42501';end if;
 if not ((a='meu-espetinho' and exists(select 1 from public.tenants where id=s)) or
 (a='sr-padeiro' and exists(select 1 from public.srp_organizations where id=s))) then raise exception 'scope_not_found';end if;
 if payload is not null then
  if jsonb_typeof(payload)<>'object' or octet_length(payload::text)>12000 then raise exception 'invalid_review';end if;
  checked=payload->'checks';state=payload->>'status';memo=trim(coalesce(payload->>'notes',''));
  if jsonb_typeof(checked) is distinct from 'object' or jsonb_typeof(payload->'notes') is distinct from 'string' or state is null or state not in ('pending','needs_attention','approved') or length(memo)>2000 then raise exception 'invalid_review';end if;
  if exists(select 1 from jsonb_each(checked) where key not in ('identity','team','catalog','stock','sale','cash','receipt') or jsonb_typeof(value)<>'boolean') then raise exception 'invalid_checks';end if;
  if state='approved' and (length(memo)<3 or exists(select 1 from unnest(array['identity','team','catalog','stock','sale','cash','receipt']) k where checked->k is distinct from 'true'::jsonb)) then raise exception 'incomplete_review';end if;
  insert into private.operation_reviews values(a,s,checked,memo,state,auth.uid(),now())
   on conflict(app,scope_id) do update set checks=excluded.checks,notes=excluded.notes,status=excluded.status,updated_by=excluded.updated_by,updated_at=excluded.updated_at;
  insert into public.operation_audit(app,scope_id,actor_id,action,details)
   values(a,s,auth.uid(),'operation_review_saved',jsonb_build_object('status',state,'checks',checked,'notes',memo));
 end if;
 select to_jsonb(r) into result from private.operation_reviews r where r.app=a and r.scope_id=s;
 return coalesce(result,jsonb_build_object('status','pending','checks','{}'::jsonb,'notes',''));
end $$;
create function public.ops_operation_review(a text,s uuid,payload jsonb default null) returns jsonb
language sql security invoker set search_path='' as $$select private.ops_operation_review(a,s,payload)$$;
revoke all on function private.ops_operation_review(text,uuid,jsonb),public.ops_operation_review(text,uuid,jsonb) from public,anon;
grant execute on function private.ops_operation_review(text,uuid,jsonb),public.ops_operation_review(text,uuid,jsonb) to authenticated;
