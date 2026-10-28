begin;
create table cip_rota_bridge_private.rental_checks(
 company_id text not null references public.cip_faro_config(company_id),domain text not null,name text not null,locations jsonb not null default '[]',status text not null default 'queued',attempts integer not null default 0,job_id uuid references public.cip_faro_jobs(id),lease uuid,last_attempt_at timestamptz,checked_at timestamptz,next_attempt_at timestamptz not null default now(),evidence jsonb,primary key(company_id,domain)
);
alter table cip_rota_bridge_private.rental_checks enable row level security;
revoke all on cip_rota_bridge_private.rental_checks from public,anon,authenticated,service_role;
create index cip_rental_checks_job on cip_rota_bridge_private.rental_checks(job_id);
create function cip_rota_bridge_private.rental_claim(jid uuid,token uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare j public.cip_faro_jobs;r cip_rota_bridge_private.rental_checks;
begin
 select * into j from public.cip_faro_jobs where id=jid;
 if j.state is distinct from 'claimed' or j.lease is distinct from token or j.claimed_at<now()-interval '3 minutes' then raise exception 'worker_lease_invalid';end if;
 if not exists(select 1 from public.cip_faro_config where company_id=j.company_id and enabled and (circuit_until is null or circuit_until<=now())) then return null;end if;
 perform pg_advisory_xact_lock(hashtextextended('cip-rental-scan-'||j.company_id,0));
 insert into cip_rota_bridge_private.rental_checks(company_id,domain,name,locations)
 select company_id,domain,min(name),jsonb_agg(distinct jsonb_build_object('city',city,'state',state)) from public.cip_market_directory where company_id=j.company_id and not is_owned and domain is not null group by company_id,domain on conflict do nothing;
 select * into r from cip_rota_bridge_private.rental_checks where job_id=jid;
 if found then return null;end if;
 select * into r from cip_rota_bridge_private.rental_checks where company_id=j.company_id and next_attempt_at<=now() and (status<>'checking' or last_attempt_at<now()-interval '3 minutes') order by last_attempt_at nulls first,domain limit 1 for update skip locked;
 if not found then return null;end if;
 update cip_rota_bridge_private.rental_checks set status='checking',job_id=jid,lease=gen_random_uuid(),last_attempt_at=now(),attempts=attempts+1 where company_id=r.company_id and domain=r.domain returning * into r;
 return jsonb_build_object('company',r.company_id,'name',r.name,'domain',r.domain,'lease',r.lease,'job',jid);
end;$$;
create function cip_rota_bridge_private.rental_finish(jid uuid,token uuid,result jsonb) returns boolean language plpgsql security definer set search_path='' as $$
declare r cip_rota_bridge_private.rental_checks;st text;u text;quote text;
begin
 select * into r from cip_rota_bridge_private.rental_checks where job_id=jid and lease=token and status='checking' for update;
 if not found or r.last_attempt_at<now()-interval '3 minutes' then raise exception 'scan_lease_invalid';end if;
 if result->>'domain' is distinct from r.domain or length(result::text)>12000 then raise exception 'scan_result_invalid';end if;
 st:=result->>'state';if st is null or st!~'^(rental_advertised|no_evidence_in_sample|source_invalid|social_source_pending|dns_pending|robots_blocked|access_blocked|http_[0-9]+|body_limit|empty_body|unsupported_content|collection_pending)$' then raise exception 'scan_result_invalid';end if;
 u:=result->>'evidence_url';quote:=left(result->>'quote',500);
 if st='rental_advertised' and (length(coalesce(quote,''))<10 or split_part(u,'/',3) is distinct from r.domain or u not like 'https://%') then raise exception 'rental_evidence_required';end if;
 update cip_rota_bridge_private.rental_checks set status=st,lease=null,checked_at=now(),next_attempt_at=now()+case when st in('rental_advertised','no_evidence_in_sample') then interval '7 days' else interval '1 day' end,evidence=result where company_id=r.company_id and domain=r.domain;
 if st='rental_advertised' then
 perform cip_rota_bridge_private.enqueue(jsonb_build_object('mode','rental','company',r.name,'url','https://'||r.domain||'/','evidence_url',u,'evidence',quote,'origin','CIP_FARO_DIRECTORY_SCAN','locations_declared',r.locations));
 perform cip_rota_bridge_private.drain();end if;
 return true;
end;$$;
revoke all on function cip_rota_bridge_private.rental_claim(uuid,uuid),cip_rota_bridge_private.rental_finish(uuid,uuid,jsonb) from public,anon,authenticated;
grant usage on schema cip_rota_bridge_private to service_role;
grant execute on function cip_rota_bridge_private.rental_claim(uuid,uuid),cip_rota_bridge_private.rental_finish(uuid,uuid,jsonb) to service_role;
create function public.cip_faro_rental_claim(p_job uuid,p_lease uuid) returns jsonb language sql security invoker set search_path='' as $$select cip_rota_bridge_private.rental_claim(p_job,p_lease);$$;
create function public.cip_faro_rental_finish(p_job uuid,p_lease uuid,p_result jsonb) returns boolean language sql security invoker set search_path='' as $$select cip_rota_bridge_private.rental_finish(p_job,p_lease,p_result);$$;
revoke all on function public.cip_faro_rental_claim(uuid,uuid),public.cip_faro_rental_finish(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.cip_faro_rental_claim(uuid,uuid),public.cip_faro_rental_finish(uuid,uuid,jsonb) to service_role;
create function cip_rota_bridge_private.rental_status(c text) returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.cip_can_access(c) then raise exception 'authorized_company_required';end if;
 return jsonb_build_object('records',(select count(*) from public.cip_market_directory where company_id=c and not is_owned),'without_site',(select count(*) from public.cip_market_directory where company_id=c and not is_owned and domain is null),'domains',(select count(distinct domain) from public.cip_market_directory where company_id=c and not is_owned),'checked',(select count(*) from cip_rota_bridge_private.rental_checks where company_id=c and checked_at is not null),'rental_advertised',(select count(*) from cip_rota_bridge_private.rental_checks where company_id=c and status='rental_advertised'),'no_evidence_in_sample',(select count(*) from cip_rota_bridge_private.rental_checks where company_id=c and status='no_evidence_in_sample'),'latest',(select coalesce(jsonb_agg(x),'[]') from(select name,domain,status,checked_at,evidence->>'evidence_url' evidence_url,evidence->>'quote' quote from cip_rota_bridge_private.rental_checks where company_id=c and status='rental_advertised' order by checked_at desc limit 10)x));
end;$$;
revoke all on function cip_rota_bridge_private.rental_status(text) from public,anon;
grant usage on schema cip_rota_bridge_private to authenticated;
grant execute on function cip_rota_bridge_private.rental_status(text) to authenticated;
create function public.cip_faro_rental_status(p_company text) returns jsonb language sql stable security invoker set search_path='' as $$select cip_rota_bridge_private.rental_status(p_company);$$;
revoke all on function public.cip_faro_rental_status(text) from public,anon;
grant execute on function public.cip_faro_rental_status(text) to authenticated;
commit;
