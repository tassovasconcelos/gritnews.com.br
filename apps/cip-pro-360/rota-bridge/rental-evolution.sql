begin;
create table cip_rota_bridge_private.rental_observations(job_id uuid primary key references public.cip_faro_jobs(id),company_id text not null,domain text not null,observed_at timestamptz not null default now(),evidence jsonb not null,foreign key(company_id,domain) references cip_rota_bridge_private.rental_checks(company_id,domain));
alter table cip_rota_bridge_private.rental_observations enable row level security;
revoke all on cip_rota_bridge_private.rental_observations from public,anon,authenticated,service_role;
create index cip_rental_observations_scope on cip_rota_bridge_private.rental_observations(company_id,domain,observed_at desc);
create or replace function cip_rota_bridge_private.rental_finish(jid uuid,token uuid,result jsonb) returns boolean language plpgsql security definer set search_path='' as $$
declare r cip_rota_bridge_private.rental_checks;st text;u text;quote text;
begin
 select * into r from cip_rota_bridge_private.rental_checks where job_id=jid and lease=token and status='checking' for update;
 if not found or r.last_attempt_at<now()-interval '3 minutes' then raise exception 'scan_lease_invalid';end if;
 if result->>'domain' is distinct from r.domain or length(result::text)>12000 then raise exception 'scan_result_invalid';end if;
 st:=result->>'state';if st is null or st!~'^(rental_advertised|rental_link_pending|no_evidence_in_sample|source_invalid|social_source_pending|dns_pending|robots_blocked|access_blocked|http_[0-9]+|body_limit|empty_body|unsupported_content|collection_pending)$' then raise exception 'scan_result_invalid';end if;
 u:=result->>'evidence_url';quote:=left(result->>'quote',500);
 if st='rental_advertised' and (length(coalesce(quote,''))<10 or regexp_replace(split_part(u,'/',3),'^www[.]','') is distinct from regexp_replace(r.domain,'^www[.]','') or u not like 'https://%') then raise exception 'rental_evidence_required';end if;
 update cip_rota_bridge_private.rental_checks set status=st,lease=null,checked_at=now(),next_attempt_at=now()+case when st in('rental_advertised','no_evidence_in_sample') then interval '7 days' else interval '1 day' end,evidence=result where company_id=r.company_id and domain=r.domain;
 insert into cip_rota_bridge_private.rental_observations(job_id,company_id,domain,evidence) values(jid,r.company_id,r.domain,result);
 if st='rental_advertised' then
 perform cip_rota_bridge_private.enqueue(jsonb_build_object('mode','rental','company',r.name,'url','https://'||r.domain||'/','evidence_url',u,'evidence',quote,'origin','CIP_FARO_DIRECTORY_SCAN','locations_declared',r.locations,'observed_at',result->>'collected_at','rule_version',result->>'rule_version'));
 perform cip_rota_bridge_private.drain();end if;
 return true;
end;$$;
commit;
