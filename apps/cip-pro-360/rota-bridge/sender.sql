begin;
create schema cip_rota_bridge_private;
revoke all on schema cip_rota_bridge_private from public,anon,authenticated;
create table cip_rota_bridge_private.auth(id boolean primary key default true check(id),secret text not null check(length(secret)=64));
create table cip_rota_bridge_private.outbox(event_id text primary key,payload jsonb not null,created_at timestamptz not null default now(),request_id bigint,attempts integer not null default 0,next_attempt_at timestamptz not null default now(),delivered_at timestamptz,last_state text not null default 'queued');
alter table cip_rota_bridge_private.auth enable row level security;
alter table cip_rota_bridge_private.outbox enable row level security;
revoke all on all tables in schema cip_rota_bridge_private from public,anon,authenticated,service_role;
create function cip_rota_bridge_private.enqueue(p jsonb) returns boolean language plpgsql security definer set search_path='' as $$
declare eid text;inserted integer;host text;
begin
 host:=split_part(p->>'url','/',3);
 if p->>'mode' is distinct from 'rental' or p->>'company'~*'pronut|prohospital' or host~*'prohospital' or coalesce(p->>'url','')!~'^https://([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}/$' then return false;end if;
 p:=(p-'event_id')||jsonb_build_object('schema','cip-rental-v1');eid:=encode(extensions.digest(p::text,'sha256'),'hex');
 insert into cip_rota_bridge_private.outbox(event_id,payload) values(eid,p||jsonb_build_object('event_id',eid)) on conflict do nothing;
 get diagnostics inserted=row_count;return inserted>0;
end;$$;
create function cip_rota_bridge_private.drain() returns integer language plpgsql security definer set search_path='' as $$
declare r cip_rota_bridge_private.outbox;response record;stamp text;k text;n integer:=0;signature text;rid bigint;
begin
 if not pg_try_advisory_xact_lock(hashtextextended('cip-rota-bridge-drain',0)) then return 0;end if;
 select secret into k from cip_rota_bridge_private.auth where id;if k is null then return 0;end if;
 for r in select * from cip_rota_bridge_private.outbox where delivered_at is null order by created_at limit 100 for update skip locked loop
 if r.request_id is not null then
 select status_code,content,error_msg into response from net._http_response where id=r.request_id;
 if found and response.status_code=200 and coalesce(response.content,'') like '{%' then
 begin
 if (response.content::jsonb->>'accepted')='true' and response.content::jsonb->>'event_id'=r.event_id then update cip_rota_bridge_private.outbox set delivered_at=now(),last_state='accepted' where event_id=r.event_id;continue;end if;
 exception when invalid_text_representation then null;end;
 end if;
 end if;
 if r.next_attempt_at>now() or r.attempts>=6 or n>=5 then continue;end if;
 stamp:=floor(extract(epoch from now()))::bigint::text;signature:=encode(extensions.hmac(stamp||'.'||r.payload::text,k,'sha256'),'hex');
 -- pg_net serializes JSONB using the same server representation signed above.
 rid:=net.http_post(url:='https://pvldaqxblirmgoixselx.supabase.co/functions/v1/cip-faro-rental-bridge',body:=r.payload,headers:=jsonb_build_object('Content-Type','application/json','x-cip-timestamp',stamp,'x-cip-signature',signature),timeout_milliseconds:=10000);
 update cip_rota_bridge_private.outbox set request_id=rid,attempts=attempts+1,next_attempt_at=now()+interval '5 minutes'*power(2,least(attempts,4)),last_state='sent_awaiting_ack' where event_id=r.event_id;n:=n+1;
 end loop;return n;
end;$$;
create function cip_rota_bridge_private.directory_event() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if not new.is_owned and new.domain is not null and new.segment='Locação' and new.company_id in ('shopping_prohospital','distribuidora_prohospital') then
 perform cip_rota_bridge_private.enqueue(jsonb_build_object('mode','rental','company',new.name,'url','https://'||new.domain||'/','evidence_url',new.site_url,'evidence','Cadastro de referência indica locação; atividade atual e região exigem conferência.','city',new.city,'state',new.state,'origin','CIP_DIRECTORY'));
 perform cip_rota_bridge_private.drain();end if;
 return new;
exception when others then return new;
end;$$;
create function cip_rota_bridge_private.job_event() returns trigger language plpgsql security definer set search_path='' as $$
declare rental jsonb;u text;
begin
 if new.state='completed' and old.state is distinct from new.state and new.company_id in ('shopping_prohospital','distribuidora_prohospital') then
 rental:=new.result->'page_discovery'->'rental_candidate';u:=rental->>'url';
 if u is not null then perform cip_rota_bridge_private.enqueue(jsonb_build_object('mode','rental','company',rental->>'company','url','https://'||split_part(u,'/',3)||'/','evidence_url',u,'evidence','Indício de locação detectado pelo Faro; exige revisão.','origin','CIP_FARO'));end if;
 perform cip_rota_bridge_private.drain();end if;
 return new;
exception when others then return new;
end;$$;
revoke all on all functions in schema cip_rota_bridge_private from public,anon,authenticated,service_role;
create trigger cip_rota_directory_event after insert or update of segment,site_url,domain,city,state,is_owned on public.cip_market_directory for each row execute function cip_rota_bridge_private.directory_event();
create trigger cip_rota_job_event after update of state on public.cip_faro_jobs for each row execute function cip_rota_bridge_private.job_event();
commit;
