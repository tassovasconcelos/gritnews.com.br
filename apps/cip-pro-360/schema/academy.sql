-- Academy: immutable content revisions, scoped review, append-only human evaluations.
begin;
create function public.cip_academy_reviewer(company text) returns boolean language sql stable set search_path='' as $$
 select exists(select 1 from public.cip_profiles p where p.user_id=(select auth.uid()) and p.active and
 (p.role='superadm' or exists(select 1 from public.cip_memberships m where m.user_id=p.user_id and m.company_id=company and m.active and m.role='gestor')));
$$;
revoke all on function public.cip_academy_reviewer(text) from public,anon;
grant execute on function public.cip_academy_reviewer(text) to authenticated;
create table public.cip_academy_materials (
 id uuid primary key default gen_random_uuid(), company_id text not null references public.cip_companies(id),
 agent_id text not null, kind text not null check(kind in ('orientation','link','document')),
 title text not null check(char_length(btrim(title)) between 4 and 160),
 content text not null check(char_length(btrim(content)) between 20 and 20000),
 source_url text check(source_url is null or source_url ~ '^https://[^/@[:space:]]+([/:?#].*)?$'),
 file_path text, file_name text, supersedes_id uuid,
 status text not null default 'draft' check(status in ('draft','approved','retired')),
 review_due date not null, created_by uuid not null default auth.uid() references auth.users(id),
 created_at timestamptz not null default now(),reviewed_by uuid references auth.users(id),reviewed_at timestamptz,
 unique(company_id,id), foreign key(company_id,supersedes_id) references public.cip_academy_materials(company_id,id),
 check(kind<>'link' or source_url is not null), check(kind<>'document' or file_path is not null),
 check(file_path is null or file_path like company_id||'/%'),
 check(agent_id in ('doquita','analista','estoque','compras','precos','comercial','financeiro','estrategico','marketing','radar','escola','logistica','experiencia_cliente','b2g')),
 check(agent_id<>'b2g' or company_id='distribuidora_prohospital')
);
create table public.cip_academy_skills (
 id uuid primary key default gen_random_uuid(),company_id text not null references public.cip_companies(id),agent_id text not null,
 title text not null check(char_length(btrim(title)) between 4 and 160),
 instructions text not null check(char_length(btrim(instructions)) between 20 and 12000),
 limits text not null check(char_length(btrim(limits)) between 10 and 3000),
 test_case text not null check(char_length(btrim(test_case)) between 10 and 3000),
 expected_result text not null check(char_length(btrim(expected_result)) between 10 and 3000),
 source_ids uuid[] not null check(cardinality(source_ids) between 1 and 20),supersedes_id uuid,
 status text not null default 'draft' check(status in ('draft','approved','retired')),
 review_due date not null,created_by uuid not null default auth.uid() references auth.users(id),created_at timestamptz not null default now(),
 reviewed_by uuid references auth.users(id),reviewed_at timestamptz,
 unique(company_id,id),foreign key(company_id,supersedes_id) references public.cip_academy_skills(company_id,id),
 check(agent_id in ('doquita','analista','estoque','compras','precos','comercial','financeiro','estrategico','marketing','radar','escola','logistica','experiencia_cliente','b2g')),
 check(agent_id<>'b2g' or company_id='distribuidora_prohospital')
);
create table public.cip_academy_evaluations (
 id uuid primary key default gen_random_uuid(),company_id text not null,skill_id uuid not null,
 source_valid boolean not null,scenario_passed boolean not null,limits_passed boolean not null,
 observed_result text not null check(char_length(btrim(observed_result)) between 20 and 5000),
 created_by uuid not null default auth.uid() references auth.users(id),created_at timestamptz not null default now(),
 foreign key(company_id,skill_id) references public.cip_academy_skills(company_id,id)
);
create index on public.cip_academy_materials(company_id,created_at desc);
create index on public.cip_academy_skills(company_id,created_at desc);
create index on public.cip_academy_evaluations(company_id,skill_id,created_at desc);
create function public.cip_academy_guard() returns trigger language plpgsql set search_path='' as $$
 declare passed boolean;
 begin
 if TG_OP='INSERT' then
   if new.status<>'draft' then raise exception 'New versions must be drafts';end if;
   new.reviewed_by:=null;new.reviewed_at:=null;
 else
   if not public.cip_academy_reviewer(new.company_id) then raise exception 'Reviewer required';end if;
   if old.status='retired' then raise exception 'Create a new revision';end if;
   if new.status='approved' then
     if new.review_due<current_date then raise exception 'Review date expired';end if;
     if TG_TABLE_NAME='cip_academy_skills' then
       if exists(select 1 from unnest(new.source_ids) as ids(id) where not exists
         (select 1 from public.cip_academy_materials m where m.id=ids.id and m.company_id=new.company_id and m.status='approved' and m.review_due>=current_date
          and not exists(select 1 from public.cip_academy_materials replacement where replacement.supersedes_id=m.id and replacement.status='approved' and replacement.review_due>=current_date)))
       then raise exception 'Sources require current approval';end if;
       select e.source_valid and e.scenario_passed and e.limits_passed into passed from public.cip_academy_evaluations e
         where e.skill_id=new.id and e.company_id=new.company_id order by e.created_at desc,e.id desc limit 1;
       if passed is distinct from true then raise exception 'Passing evaluation required';end if;
     end if;
   end if;
   new.reviewed_by:=auth.uid();new.reviewed_at:=now();
 end if;
 return new;
 end;
$$;
revoke all on function public.cip_academy_guard() from public,anon,authenticated;
create trigger academy_material_guard before insert or update on public.cip_academy_materials for each row execute function public.cip_academy_guard();
create trigger academy_skill_guard before insert or update on public.cip_academy_skills for each row execute function public.cip_academy_guard();
do $$ declare t text;begin
 foreach t in array array['cip_academy_materials','cip_academy_skills','cip_academy_evaluations'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon,authenticated',t);
 execute format('grant select,insert on public.%I to authenticated',t);
 execute format('create policy academy_read on public.%I for select to authenticated using(public.cip_can_access(company_id))',t);
 execute format('create policy academy_insert on public.%I for insert to authenticated with check(created_by=(select auth.uid()) and public.%I(company_id%s))',t,case when t='cip_academy_evaluations' then 'cip_academy_reviewer' else 'cip_can_access' end,case when t='cip_academy_evaluations' then '' else ',true' end);
 if t<>'cip_academy_evaluations' then
 execute format('grant update(status) on public.%I to authenticated',t);
 execute format('create policy academy_update on public.%I for update to authenticated using(public.cip_academy_reviewer(company_id)) with check(public.cip_academy_reviewer(company_id))',t);
 end if;
 execute format('create trigger academy_audit after insert or update on public.%I for each row execute function public.cip_track_change()',t);
 end loop;end $$;
create function public.cip_academy_evaluation_result() returns trigger language plpgsql set search_path='' as $$
begin
 if not (new.source_valid and new.scenario_passed and new.limits_passed) then
   update public.cip_academy_skills set status='draft' where id=new.skill_id and company_id=new.company_id and status='approved';
 end if;
 return new;
end;
$$;
revoke all on function public.cip_academy_evaluation_result() from public,anon,authenticated;
create trigger academy_evaluation_result after insert on public.cip_academy_evaluations for each row execute function public.cip_academy_evaluation_result();
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('cip-academy','cip-academy',false,10485760,array['application/pdf','text/plain','text/markdown','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']);
create policy academy_file_read on storage.objects for select to authenticated using(bucket_id='cip-academy' and public.cip_can_access((storage.foldername(name))[1]));
create policy academy_file_insert on storage.objects for insert to authenticated with check(bucket_id='cip-academy' and public.cip_can_access((storage.foldername(name))[1],true) and (storage.foldername(name))[2]=(select auth.uid())::text);
-- Only unreferenced uploads may be cleaned up by their uploader.
create policy academy_file_cleanup on storage.objects for delete to authenticated using(bucket_id='cip-academy' and public.cip_can_access((storage.foldername(name))[1],true) and (storage.foldername(name))[2]=(select auth.uid())::text and not exists(select 1 from public.cip_academy_materials m where m.file_path=name));
commit;
