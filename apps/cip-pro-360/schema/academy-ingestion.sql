begin;
alter table public.cip_academy_materials add column ingestion_status text not null default 'not_required' check(ingestion_status in ('not_required','queued','processing','ready','failed','manual_required')),
 add column approved_extraction_id uuid,add column last_checked_at timestamptz;
create table public.cip_academy_extractions (
 id uuid primary key default gen_random_uuid(),company_id text not null,material_id uuid not null,
 text_content text not null check(char_length(text_content)<=1200000),chunks jsonb not null,
 content_hash text not null check(content_hash ~ '^[a-f0-9]{64}$'),method text not null,units integer not null,
 complete boolean not null,warnings jsonb not null default '[]',created_at timestamptz not null default now(),
 unique(company_id,material_id,id),foreign key(company_id,material_id) references public.cip_academy_materials(company_id,id)
);
alter table public.cip_academy_materials add constraint academy_approved_extraction_fk foreign key(company_id,id,approved_extraction_id) references public.cip_academy_extractions(company_id,material_id,id);
create index academy_extractions_source on public.cip_academy_extractions(company_id,material_id,created_at desc);
alter table public.cip_academy_extractions enable row level security;
revoke all on public.cip_academy_extractions from anon,authenticated;
grant select on public.cip_academy_extractions to authenticated;
create policy academy_extraction_read on public.cip_academy_extractions for select to authenticated using(public.cip_can_access(company_id));
create table public.cip_academy_ingestion_jobs (
 id uuid primary key default gen_random_uuid(),company_id text not null,material_id uuid not null unique,
 status text not null default 'queued' check(status in ('queued','processing','succeeded','failed','manual_required')),
 attempts integer not null default 0,last_error text,locked_at timestamptz,lease_token uuid,
 next_attempt_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 foreign key(company_id,material_id) references public.cip_academy_materials(company_id,id)
);
create index academy_jobs_queue on public.cip_academy_ingestion_jobs(status,next_attempt_at);
alter table public.cip_academy_ingestion_jobs enable row level security;
revoke all on public.cip_academy_ingestion_jobs from anon,authenticated;
grant select on public.cip_academy_ingestion_jobs to authenticated;
create policy academy_jobs_read on public.cip_academy_ingestion_jobs for select to authenticated using(public.cip_can_access(company_id));
create schema if not exists private;
create function private.cip_academy_enqueue() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.file_path is not null or new.source_url is not null then
 insert into public.cip_academy_ingestion_jobs(company_id,material_id) values(new.company_id,new.id);
 end if;return new;
end;$$;
revoke all on function private.cip_academy_enqueue() from public,anon,authenticated;
create trigger academy_enqueue after insert on public.cip_academy_materials for each row execute function private.cip_academy_enqueue();
-- The invoker guard initializes system-owned fields and binds approval to a concrete extraction.
create or replace function public.cip_academy_guard() returns trigger language plpgsql set search_path='' as $$
declare passed boolean;v_extraction uuid;
begin
 if TG_OP='INSERT' then
  if new.status<>'draft' then raise exception 'New versions must be drafts';end if;
  new.reviewed_by:=null;new.reviewed_at:=null;new.created_at:=clock_timestamp();
  if TG_TABLE_NAME='cip_academy_materials' then
   new.approved_extraction_id:=null;new.last_checked_at:=null;
   new.ingestion_status:=case when new.file_path is not null or new.source_url is not null then 'queued' else 'not_required' end;
  end if;
 else
  if current_user='service_role' and (TG_TABLE_NAME='cip_academy_materials' or new.status='draft') then return new;end if;
  if not public.cip_academy_reviewer(new.company_id) then raise exception 'Reviewer required';end if;
  if old.status='retired' then raise exception 'Create a new revision';end if;
  if new.status='approved' then
   if new.review_due<current_date then raise exception 'Review date expired';end if;
   if TG_TABLE_NAME='cip_academy_materials' then
   if new.file_path is not null or new.source_url is not null then
    if new.ingestion_status<>'ready' then raise exception 'Complete extraction required';end if;
    select e.id into v_extraction from public.cip_academy_extractions e where e.material_id=new.id and e.company_id=new.company_id and e.complete order by e.created_at desc,e.id desc limit 1;
    if v_extraction is null then raise exception 'Complete extraction required';end if;
    new.approved_extraction_id:=v_extraction;
   end if;end if;
   if TG_TABLE_NAME='cip_academy_skills' then
    if exists(select 1 from unnest(new.source_ids) ids(id) where not exists(select 1 from public.cip_academy_materials m where m.id=ids.id and m.company_id=new.company_id and m.status='approved' and m.review_due>=current_date and m.ingestion_status in ('not_required','ready') and (m.ingestion_status='not_required' or m.approved_extraction_id is not null) and not exists(select 1 from public.cip_academy_materials r where r.supersedes_id=m.id and r.status='approved' and r.review_due>=current_date))) then raise exception 'Current approved sources required';end if;
    select e.source_valid and e.scenario_passed and e.limits_passed and e.created_at >= coalesce((select max(m.reviewed_at) from public.cip_academy_materials m where m.id=any(new.source_ids) and m.company_id=new.company_id),'-infinity'::timestamptz) into passed from public.cip_academy_evaluations e where e.skill_id=new.id and e.company_id=new.company_id order by e.created_at desc,e.id desc limit 1;
    if passed is distinct from true then raise exception 'Passing evaluation required';end if;
   end if;
  elsif TG_TABLE_NAME='cip_academy_materials' then new.approved_extraction_id:=null;
  end if;
  new.reviewed_by:=auth.uid();new.reviewed_at:=clock_timestamp();
 end if;return new;
end;$$;
create function public.cip_academy_claim_job(p_material uuid default null) returns setof public.cip_academy_ingestion_jobs language plpgsql set search_path='' as $$
begin
 update public.cip_academy_ingestion_jobs set status='failed',lease_token=null,last_error='Tempo de processamento excedido após três tentativas.',updated_at=now() where status='processing' and locked_at<now()-interval '5 minutes' and attempts>=3;
 return query update public.cip_academy_ingestion_jobs j set status='processing',attempts=case when j.status='succeeded' then 1 else j.attempts+1 end,locked_at=now(),lease_token=gen_random_uuid(),updated_at=now()
 where j.id=(select q.id from public.cip_academy_ingestion_jobs q join public.cip_academy_materials m on m.id=q.material_id where m.status<>'retired' and (p_material is null or q.material_id=p_material) and (
  (q.status in ('queued','failed') and q.attempts<3 and q.next_attempt_at<=now()) or
  (q.status='processing' and q.locked_at<now()-interval '5 minutes' and q.attempts<3) or
  (q.status='succeeded' and m.source_url is not null and q.next_attempt_at<=now()))
 order by q.next_attempt_at for update of q skip locked limit 1) returning j.*;
end;$$;
revoke all on function public.cip_academy_claim_job(uuid) from public,anon,authenticated;
grant execute on function public.cip_academy_claim_job(uuid) to service_role;
create function public.cip_academy_finish_job(p_job uuid,p_lease uuid,p_result jsonb) returns boolean language plpgsql set search_path='' as $$
declare j public.cip_academy_ingestion_jobs;oldhash text;newid uuid;v_status text;
begin
 select * into j from public.cip_academy_ingestion_jobs where id=p_job and lease_token=p_lease and status='processing' for update;
 if not found then return false;end if;
 v_status:=p_result->>'status';
 if v_status not in ('succeeded','failed','manual_required') then raise exception 'Invalid processing state';end if;
 if v_status='succeeded' or p_result ? 'text_content' then
  select content_hash into oldhash from public.cip_academy_extractions where material_id=j.material_id order by created_at desc,id desc limit 1;
  if oldhash is distinct from p_result->>'content_hash' then
   insert into public.cip_academy_extractions(company_id,material_id,text_content,chunks,content_hash,method,units,complete,warnings) values(j.company_id,j.material_id,p_result->>'text_content',p_result->'chunks',p_result->>'content_hash',p_result->>'method',(p_result->>'units')::int,v_status='succeeded',coalesce(p_result->'warnings','[]')) returning id into newid;
   update public.cip_academy_skills set status='draft',reviewed_at=null,reviewed_by=null where company_id=j.company_id and j.material_id=any(source_ids) and status='approved';
   update public.cip_academy_materials set status=case when status='retired' then status else 'draft' end,approved_extraction_id=null,reviewed_at=null,reviewed_by=null where id=j.material_id;
  end if;
 end if;
 update public.cip_academy_ingestion_jobs set status=v_status,last_error=left(p_result->>'error',500),next_attempt_at=now()+case when v_status='succeeded' then interval '24 hours' else interval '5 minutes' end,updated_at=now(),lease_token=null where id=j.id;
 update public.cip_academy_materials set ingestion_status=case v_status when 'succeeded' then 'ready' when 'failed' then 'failed' else 'manual_required' end,last_checked_at=now() where id=j.material_id;
 return true;
end;$$;
revoke all on function public.cip_academy_finish_job(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.cip_academy_finish_job(uuid,uuid,jsonb) to service_role;
create table public.cip_academy_worker_config(id boolean primary key default true check(id),token_hash text not null);
alter table public.cip_academy_worker_config enable row level security;
revoke all on public.cip_academy_worker_config from public,anon,authenticated;
do $$ declare token text;begin
 token:=encode(extensions.gen_random_bytes(32),'hex');
 perform vault.create_secret(token,'cip_academy_worker_token');
 insert into public.cip_academy_worker_config(id,token_hash) values(true,encode(extensions.digest(token,'sha256'),'hex'));
end;$$;
-- Existing external materials are automatically queued without changing their content.
insert into public.cip_academy_ingestion_jobs(company_id,material_id) select company_id,id from public.cip_academy_materials where file_path is not null or source_url is not null;
grant all on public.cip_academy_extractions,public.cip_academy_ingestion_jobs,public.cip_academy_worker_config to service_role;
commit;
-- Evaluation timestamps are server-owned and must follow source review.
alter table public.cip_academy_evaluations alter column created_at set default clock_timestamp();
revoke insert on public.cip_academy_evaluations from authenticated;
grant insert(company_id,skill_id,source_valid,scenario_passed,limits_passed,observed_result,created_by) on public.cip_academy_evaluations to authenticated;
