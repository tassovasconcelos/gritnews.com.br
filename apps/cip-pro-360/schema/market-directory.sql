-- Regional store references from authorized source files. No contacts, extra cron or paid dispatch.
begin;
create table public.cip_market_directory_batches(
 company_id text not null references public.cip_companies(id),source_hash text not null,source_name text not null,summary jsonb not null,imported_at timestamptz not null default now(),primary key(company_id,source_hash)
);
create table public.cip_market_directory(
 id uuid primary key default gen_random_uuid(),company_id text not null references public.cip_companies(id),source_hash text not null,source_row integer not null,source_key text not null,
 name text not null,address text not null,state text,city text,region text,geo_status text not null,site_url text,domain text,is_owned boolean not null default false,monitor_enabled boolean not null default false,
 segment text not null,source_updated_text text not null,dedup_key text not null,source_location jsonb not null default '{}',review jsonb,version integer not null default 1,
 last_targeted_at timestamptz,last_checked_at timestamptz,last_evidence_at timestamptz,
 foreign key(company_id,source_hash) references public.cip_market_directory_batches(company_id,source_hash),unique(company_id,source_hash,source_row),unique(id,company_id),
 check(length(name) between 1 and 200),check(state is null or state in('AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO')),
 check(geo_status in('parsed','state_only','missing','reviewed')),check(not monitor_enabled or (domain is not null and not is_owned)),
 check(domain is null or (length(domain)<=180 and domain~'^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$' and domain!~'(^|\.)(localhost|local|internal|test|invalid|example|onion)$'))
);
create index cip_market_directory_scope on public.cip_market_directory(company_id,state,city);
create index cip_market_directory_rotation on public.cip_market_directory(company_id,last_targeted_at nulls first,id) where monitor_enabled and not is_owned;
create index cip_market_directory_batch on public.cip_market_directory(company_id,source_hash);
create table public.cip_market_directory_targets(
 job_id uuid primary key references public.cip_faro_jobs(id),company_id text not null,directory_id uuid not null,run_id uuid not null references public.cip_market_runs(id),domain text not null,region_context jsonb not null,
 assigned_at timestamptz not null default now(),state text not null default 'assigned',checked_at timestamptz,offers integer not null default 0,
 foreign key(directory_id,company_id) references public.cip_market_directory(id,company_id),check(state in('assigned','completed','failed'))
);
create index cip_market_directory_targets_scope on public.cip_market_directory_targets(company_id,directory_id,assigned_at desc);
create index cip_market_directory_targets_domain on public.cip_market_directory_targets(company_id,domain,assigned_at desc);
create index cip_market_directory_targets_run on public.cip_market_directory_targets(run_id);
do $$declare t text;begin foreach t in array array['cip_market_directory_batches','cip_market_directory','cip_market_directory_targets'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from public,anon,authenticated',t);
 execute format('grant select on public.%I to authenticated',t);
 execute format('grant all on public.%I to service_role',t);
 execute format('create policy company_read on public.%I for select to authenticated using(public.cip_can_access(company_id))',t);
end loop;end;$$;
create function cip_market_private.directory_target(jid uuid,token uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare j public.cip_faro_jobs;d public.cip_market_directory;saved_target public.cip_market_directory_targets;
begin
 select * into j from public.cip_faro_jobs where id=jid for update;
 if j.id is null or j.state<>'claimed' or j.lease is distinct from token or j.claimed_at<now()-interval '3 minutes' then raise exception 'worker_lease_invalid';end if;
 if j.priority>=100 then return null;end if; -- preserve recurrent priority monitoring
 if not exists(select 1 from public.cip_faro_config where company_id=j.company_id and enabled and (circuit_until is null or circuit_until<=now())) or not cip_market_private.sponsor(j.company_id) then raise exception 'automation_paused';end if;
 perform pg_advisory_xact_lock(hashtextextended('cip-directory-'||j.company_id,0));
 select * into saved_target from public.cip_market_directory_targets where job_id=jid;
 if found then return jsonb_build_object('id',saved_target.directory_id,'domain',saved_target.domain,'region',saved_target.region_context);end if;
 select x.* into d from public.cip_market_directory x where x.company_id=j.company_id and x.monitor_enabled and not x.is_owned
 and not exists(select 1 from public.cip_market_directory_targets t join public.cip_faro_jobs other_job on other_job.id=t.job_id where t.company_id=j.company_id and t.domain=x.domain and other_job.slot=j.slot)
 order by (select max(t.assigned_at) from public.cip_market_directory_targets t where t.company_id=j.company_id and t.domain=x.domain) asc nulls first,x.last_targeted_at asc nulls first,x.domain,x.state,x.city,x.id limit 1 for update of x skip locked;
 if d.id is null then return null;end if;
 insert into public.cip_market_directory_targets(job_id,company_id,directory_id,run_id,domain,region_context)
 values(j.id,j.company_id,d.id,j.run_id,d.domain,jsonb_build_object('store_name',d.name,'region',d.region,'state',d.state,'city',d.city,'location_status',d.geo_status,'source','supplier_directory','source_row',d.source_row,'notice','Localização da referência; não comprova preço de filial, entrega ou frete nesta praça.')) returning * into saved_target;
 -- The run allowlist and worker context change atomically. No additional job/call reservation.
 update public.cip_market_runs set domains=jsonb_build_array(d.domain) where id=j.run_id and state='running';
 update public.cip_market_directory set last_targeted_at=now() where id=d.id;
 return jsonb_build_object('id',d.id,'domain',d.domain,'region',saved_target.region_context);
end;$$;
revoke all on function cip_market_private.directory_target(uuid,uuid) from public,anon,authenticated;
grant execute on function cip_market_private.directory_target(uuid,uuid) to service_role;
create function public.cip_faro_directory_target(p_job uuid,p_lease uuid) returns jsonb language sql security invoker set search_path='' as $$select cip_market_private.directory_target(p_job,p_lease);$$;
revoke all on function public.cip_faro_directory_target(uuid,uuid) from public,anon,authenticated;
grant execute on function public.cip_faro_directory_target(uuid,uuid) to service_role;
create function cip_market_private.directory_finished() returns trigger language plpgsql security definer set search_path='' as $$
declare t public.cip_market_directory_targets;n integer;
begin
 if new.state not in('completed','failed') or old.state=new.state then return new;end if;
 select * into t from public.cip_market_directory_targets where run_id=new.id;
 if t.job_id is null then return new;end if;
 select count(*) into n from public.cip_market_offers o where o.run_id=new.id and (split_part(o.url,'/',3)=t.domain or split_part(o.url,'/',3) like '%.'||t.domain) and o.offer->'match'->>'kind' not in('alternative','incompatible') and o.offer->>'currency'='BRL' and (o.offer->>'price')::numeric>0;
 update public.cip_market_directory_targets set state=new.state,checked_at=new.finished_at,offers=n where job_id=t.job_id;
 update public.cip_market_directory set last_checked_at=case when new.state='completed' then new.finished_at else last_checked_at end,last_evidence_at=case when n>0 and new.state='completed' then new.finished_at else last_evidence_at end where id=t.directory_id;
 return new;
end;$$;
revoke all on function cip_market_private.directory_finished() from public,anon,authenticated,service_role;
create trigger cip_market_directory_run_finished after update of state on public.cip_market_runs for each row execute function cip_market_private.directory_finished();
create function cip_market_private.directory_get(c text,q text,uf text,city_filter text,region_filter text,skip integer) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare rows jsonb;total integer;
begin
 if auth.uid() is null or not public.cip_can_access(c) then raise exception 'authorized_company_required';end if;
 if q is null or length(q)>180 or uf is null or length(uf)>2 or city_filter is null or length(city_filter)>100 or region_filter is null or length(region_filter)>30 or skip is null or skip<0 or skip>100000 then raise exception 'invalid_filter';end if;
 select count(*) into total from public.cip_market_directory d where company_id=c and (q='' or concat_ws(' ',name,domain,segment) ilike '%'||q||'%') and (uf='' or coalesce(state,'?')=uf) and (city_filter='' or city ilike '%'||city_filter||'%') and (region_filter='' or region=region_filter);
 select coalesce(jsonb_agg(to_jsonb(x)),'[]') into rows from(select d.*,
 (select jsonb_build_object('state',t.state,'assigned_at',t.assigned_at,'checked_at',t.checked_at,'offers',t.offers,'sku',m.sku,'run_id',t.run_id) from public.cip_market_directory_targets t join public.cip_market_runs m on m.id=t.run_id where t.directory_id=d.id order by t.assigned_at desc limit 1) latest,
 (select coalesce(jsonb_agg(e),'[]') from(select o.sku,o.url,o.seller,o.offer,o.created_at from public.cip_market_offers o join public.cip_market_directory_targets t on t.run_id=o.run_id where t.directory_id=d.id order by o.created_at desc limit 3)e) evidence
 from public.cip_market_directory d where company_id=c and (q='' or concat_ws(' ',name,domain,segment) ilike '%'||q||'%') and (uf='' or coalesce(state,'?')=uf) and (city_filter='' or city ilike '%'||city_filter||'%') and (region_filter='' or region=region_filter) order by state nulls last,city nulls last,name,id limit 20 offset skip)x;
 return jsonb_build_object('rows',rows,'total',total,'offset',skip,'can_review',cip_pricing_private.director(c),
 'summary',(select jsonb_build_object('records',count(*),'states',count(distinct state),'city_pairs',count(distinct (state,city)) filter(where city is not null),'monitor_rows',count(*) filter(where monitor_enabled),'domains',count(distinct domain) filter(where monitor_enabled),'owned',count(*) filter(where is_owned),'missing_city',count(*) filter(where city is null),'checked24',count(*) filter(where last_checked_at>=now()-interval '24 hours'),'evidence24',count(*) filter(where last_evidence_at>=now()-interval '24 hours')) from public.cip_market_directory where company_id=c),
 'states',(select coalesce(jsonb_agg(x),'[]') from(select state,count(*) records,count(*) filter(where city is null) city_pending from public.cip_market_directory where company_id=c group by state order by state)x),
 'source',(select jsonb_build_object('name',source_name,'summary',summary,'imported_at',imported_at) from public.cip_market_directory_batches where company_id=c order by imported_at desc limit 1),
 'routine',(select jsonb_build_object('enabled',enabled,'hourly',products_per_hour,'hot',hot_count,'daily',daily_limit,'circuit_until',circuit_until) from public.cip_faro_config where company_id=c));
end;$$;
revoke all on function cip_market_private.directory_get(text,text,text,text,text,integer) from public,anon;
grant execute on function cip_market_private.directory_get(text,text,text,text,text,integer) to authenticated;
create function public.cip_market_directory_get(p_company text,p_query text default '',p_state text default '',p_city text default '',p_region text default '',p_offset integer default 0) returns jsonb language sql stable security invoker set search_path='' as $$select cip_market_private.directory_get(p_company,p_query,p_state,p_city,p_region,p_offset);$$;
revoke all on function public.cip_market_directory_get(text,text,text,text,text,integer) from public,anon;
grant execute on function public.cip_market_directory_get(text,text,text,text,text,integer) to authenticated;
create function cip_market_private.directory_review(c text,did uuid,v integer,d jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.cip_market_directory;u text:=d->>'state';city_name text:=btrim(d->>'city');proof text:=d->>'source_url';region_name text;proof_host text:=lower(split_part(split_part(d->>'source_url','/',3),':',1));
begin
 if auth.uid() is null or not public.cip_can_access(c) or not cip_pricing_private.director(c) then raise exception 'director_required';end if;
 select * into r from public.cip_market_directory where company_id=c and id=did for update;
 if r.id is null or r.version is distinct from v then raise exception 'directory_changed';end if;
 if u is null or u not in('AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO') or city_name is null or length(city_name) not between 2 and 100 or coalesce(length(d->>'note'),0) not between 10 and 1000 or proof is null or length(proof)>1000 or proof!~'^https://[^/@[:space:]]+([/?#][^[:space:]]*)?$' or jsonb_typeof(d->'monitor_enabled') is distinct from 'boolean' then raise exception 'invalid_review';end if;
 if proof_host is null or proof_host!~'^([a-z0-9-]+\.)+[a-z]{2,24}$' or proof_host~'(^|\.)(localhost|local|internal|invalid|test|example|onion)$' then raise exception 'invalid_review';end if;
 if (d->>'monitor_enabled')::boolean and (r.is_owned or r.domain is null or r.domain in('instagram.com','facebook.com','linktr.ee','sites.google.com') or r.domain like '%.wixsite.com') then raise exception 'source_not_eligible';end if;
 region_name:=case when u in('AC','AP','AM','PA','RO','RR','TO') then 'Norte' when u in('AL','BA','CE','MA','PB','PE','PI','RN','SE') then 'Nordeste' when u in('DF','GO','MT','MS') then 'Centro-Oeste' when u in('ES','MG','RJ','SP') then 'Sudeste' else 'Sul' end;
 update public.cip_market_directory set state=u,city=city_name,region=region_name,geo_status='reviewed',monitor_enabled=(d->>'monitor_enabled')::boolean,version=version+1,review=jsonb_build_object('by',auth.uid(),'at',now(),'before',jsonb_build_object('state',r.state,'city',r.city,'monitor_enabled',r.monitor_enabled),'source_url',proof,'note',d->>'note') where id=r.id;
 insert into public.cip_mp_desk_events(company_id,actor,kind,detail) values(c,auth.uid(),'directory_review',jsonb_build_object('directory_id',did,'before',jsonb_build_object('state',r.state,'city',r.city,'monitor_enabled',r.monitor_enabled),'after',d,'version',v+1));
 return jsonb_build_object('saved',true,'erp_executed',false);
end;$$;
revoke all on function cip_market_private.directory_review(text,uuid,integer,jsonb) from public,anon;
grant execute on function cip_market_private.directory_review(text,uuid,integer,jsonb) to authenticated;
create function public.cip_market_directory_review(p_company text,p_id uuid,p_version integer,p_data jsonb) returns jsonb language sql security invoker set search_path='' as $$select cip_market_private.directory_review(p_company,p_id,p_version,p_data);$$;
revoke all on function public.cip_market_directory_review(text,uuid,integer,jsonb) from public,anon;
grant execute on function public.cip_market_directory_review(text,uuid,integer,jsonb) to authenticated;
commit;
