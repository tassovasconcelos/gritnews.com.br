begin;
create function public.cip_valid_process_graph(g jsonb,c text) returns boolean language plpgsql immutable set search_path='' as $$
declare n jsonb; e jsonb; ids text[]='{}'; edgekeys text[]='{}';
begin
 if coalesce(jsonb_typeof(g),'')<>'object' or coalesce(g->>'schema','')<>'1' or coalesce(jsonb_typeof(g->'nodes'),'')<>'array' or coalesce(jsonb_typeof(g->'edges'),'')<>'array' or octet_length(g::text)>200000 then return false; end if;
 if jsonb_array_length(g->'nodes')>60 or jsonb_array_length(g->'edges')>120 then return false; end if;
 for n in select value from jsonb_array_elements(g->'nodes') loop
  if coalesce(jsonb_typeof(n),'')<>'object' or coalesce(jsonb_typeof(n->'id'),'')<>'string' or not (n->>'id' ~ '^n[A-Za-z0-9_-]{1,47}$') or n->>'id'=any(ids) or coalesce(n->>'type','') not in ('start','task','decision','approval','end') or coalesce(jsonb_typeof(n->'title'),'')<>'string' or char_length(btrim(n->>'title')) not between 1 and 120 then return false; end if;
  if coalesce(jsonb_typeof(n->'x'),'')<>'number' or coalesce(jsonb_typeof(n->'y'),'')<>'number' or (n->>'x')::numeric not between 0 and 3000 or (n->>'y')::numeric not between 0 and 3000 then return false; end if;
  if coalesce(n->>'agent','') not in ('doquita','analista','estoque','compras','precos','comercial','financeiro','estrategico','marketing','radar','escola','logistica','experiencia_cliente','b2g') or (n->>'agent'='b2g' and c<>'distribuidora_prohospital') then return false; end if;
  if exists(select 1 from unnest(array['owner','metric','evidence','notes']) k where n ? k and (jsonb_typeof(n->k)<>'string' or char_length(n->>k)>case when k='notes' then 2000 else 500 end)) then return false; end if;
  ids=array_append(ids,n->>'id');
 end loop;
 for e in select value from jsonb_array_elements(g->'edges') loop
  if coalesce(jsonb_typeof(e),'')<>'object' or coalesce(e->>'from','')<>all(ids) or coalesce(e->>'to','')<>all(ids) or ((e->>'from')||'>'||(e->>'to'))=any(edgekeys) or (e ? 'label' and (jsonb_typeof(e->'label')<>'string' or char_length(e->>'label')>120)) then return false; end if;
  edgekeys=array_append(edgekeys,(e->>'from')||'>'||(e->>'to'));
 end loop;
 return true;
exception when others then return false;
end;$$;
revoke all on function public.cip_valid_process_graph(jsonb,text) from public,anon;
grant execute on function public.cip_valid_process_graph(jsonb,text) to authenticated,service_role;
create table public.cip_processes(
 id uuid primary key default gen_random_uuid(),company_id text not null references public.cip_companies(id),
 title text not null check(char_length(btrim(title)) between 4 and 160),graph jsonb not null,
 version integer not null default 1,created_by uuid not null default auth.uid() references auth.users(id),
 updated_by uuid not null default auth.uid() references auth.users(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 check(public.cip_valid_process_graph(graph,company_id))
);
create index cip_processes_company_idx on public.cip_processes(company_id,updated_at desc);
create table public.cip_process_versions(
 process_id uuid not null references public.cip_processes(id),company_id text not null references public.cip_companies(id),version integer not null,
 title text not null,graph jsonb not null,created_by uuid references auth.users(id),created_at timestamptz not null default now(),primary key(process_id,version)
);
alter table public.cip_processes enable row level security;
alter table public.cip_process_versions enable row level security;
revoke all on public.cip_processes,public.cip_process_versions from anon,authenticated;
grant select on public.cip_processes,public.cip_process_versions to authenticated;
grant insert(company_id,title,graph) on public.cip_processes to authenticated;
grant update(title,graph) on public.cip_processes to authenticated;
create policy process_read on public.cip_processes for select to authenticated using(public.cip_can_access(company_id));
create policy process_insert on public.cip_processes for insert to authenticated with check(created_by=(select auth.uid()) and public.cip_can_access(company_id,true));
create policy process_update on public.cip_processes for update to authenticated using(public.cip_can_access(company_id,true)) with check(public.cip_can_access(company_id,true));
create policy process_version_read on public.cip_process_versions for select to authenticated using(public.cip_can_access(company_id));
create function public.cip_process_stamp() returns trigger language plpgsql set search_path='' as $$
begin
 if tg_op='UPDATE' then new.version=old.version+1; end if;
 new.updated_by=auth.uid();new.updated_at=now();return new;
end;$$;
revoke all on function public.cip_process_stamp() from public,anon,authenticated;
-- Trigger-only definer writes immutable snapshots; callers have no write grants on history.
create function private.cip_process_snapshot() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.cip_process_versions(process_id,company_id,version,title,graph,created_by) values(new.id,new.company_id,new.version,new.title,new.graph,auth.uid());return new;
end;$$;
revoke all on function private.cip_process_snapshot() from public,anon,authenticated;
create trigger process_stamp before insert or update on public.cip_processes for each row execute function public.cip_process_stamp();
create trigger process_snapshot after insert or update on public.cip_processes for each row execute function private.cip_process_snapshot();
create function public.cip_save_process(p_id uuid,p_company text,p_title text,p_graph jsonb,p_version integer) returns jsonb language plpgsql set search_path='' as $$
declare row public.cip_processes;
begin
 if p_id is null then
  insert into public.cip_processes(company_id,title,graph) values(p_company,p_title,p_graph) returning * into row;
 else
  update public.cip_processes set title=p_title,graph=p_graph where id=p_id and company_id=p_company and version=p_version returning * into row;
  if not found then raise exception 'version_conflict_or_access_denied'; end if;
 end if;
 return jsonb_build_object('id',row.id,'version',row.version);
end;$$;
revoke all on function public.cip_save_process(uuid,text,text,jsonb,integer) from public,anon;
grant execute on function public.cip_save_process(uuid,text,text,jsonb,integer) to authenticated;
commit;
