begin;
alter table public.market_radar_sources add column faro_evidence jsonb not null default '{}';
create or replace function cip_rota_bridge_private.receive(body text,stamp text,sig text) returns jsonb language plpgsql security definer set search_path='' as $$
declare p jsonb;k text;expected text;eid text;sid uuid;u text;v_host text;ws uuid:='2ddfc0f5-ebbc-414a-b49d-bb0727864773';
begin
 if length(body)>30000 or stamp!~'^[0-9]{10}$' or sig!~'^[0-9a-f]{64}$' or abs(extract(epoch from now())-stamp::bigint)>300 then raise exception 'bridge_auth_invalid';end if;
 select secret into k from cip_rota_bridge_private.auth where id;
 expected:=encode(extensions.hmac(stamp||'.'||body,k,'sha256'),'hex');
 if expected is null or expected is distinct from sig then raise exception 'bridge_auth_invalid';end if;
 p:=body::jsonb;eid:=p->>'event_id';
 if p->>'schema' is distinct from 'cip-rental-v1' or p->>'mode' is distinct from 'rental' or eid is null or eid!~'^[0-9a-f]{64}$' or length(coalesce(p->>'company','')) not between 2 and 200 or p->>'company'~*'pronut|prohospital' then raise exception 'bridge_payload_invalid';end if;
 if eid<>encode(extensions.digest((p-'event_id')::text,'sha256'),'hex') then raise exception 'bridge_payload_invalid';end if;
 u:=p->>'url';v_host:=split_part(u,'/',3);
 if u!~'^https://([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}/$' or v_host~'(^|\.)(localhost|local|internal|invalid|test|example|onion)$' or v_host~*'prohospital' then raise exception 'bridge_url_invalid';end if;
 perform pg_advisory_xact_lock(hashtextextended('cip-rota-'||eid,0));
 select source_id into sid from cip_rota_bridge_private.receipts where event_id=eid;
 if found then return jsonb_build_object('accepted',true,'duplicate',true,'event_id',eid,'source_id',sid);end if;
 select id into sid from public.market_radar_sources where workspace_id=ws and kind='OFFICIAL' and regexp_replace(lower(market_radar_sources.host),'^www[.]','')=regexp_replace(lower(v_host),'^www[.]','') order by discovered_at,id limit 1;
 if sid is null then
 insert into public.market_radar_sources(workspace_id,competitor,url,host,kind,regions,cities,products,coverage_note,active,assessment)
 values(ws,p->>'company',u,v_host,'OFFICIAL','{}','{}','{}','Identificada pelo Faro/CIP; locação e região pendentes de conferência. Sem preço validado.',true,jsonb_build_object('state','RENTAL_CANDIDATE','origin','CIP_FARO','evidence_url',p->>'evidence_url','evidence',p->>'evidence','declared_city',p->>'city','declared_state',p->>'state','region_verified',false,'price_validated',false))
 on conflict(workspace_id,url) do nothing returning id into sid;
 if sid is null then select id into sid from public.market_radar_sources where workspace_id=ws and url=u;end if;
 end if;
 update public.market_radar_sources set faro_evidence=jsonb_build_object('origin','CIP_FARO','received_at',now(),'observed_at',p->>'observed_at','rule_version',coalesce(p->>'rule_version','legacy-candidate'),'evidence_url',p->>'evidence_url','quote',left(p->>'evidence',500),'locations_declared',case when jsonb_typeof(p->'locations_declared')='array' then p->'locations_declared' else jsonb_build_array(jsonb_build_object('city',p->>'city','state',p->>'state')) end,'region_verified',false,'price_validated',false) where id=sid and workspace_id=ws;
 insert into cip_rota_bridge_private.receipts(event_id,source_id,payload) values(eid,sid,p);
 return jsonb_build_object('accepted',true,'duplicate',false,'event_id',eid,'source_id',sid);
end;$$;
update public.market_radar_sources s set faro_evidence=jsonb_build_object('origin','CIP_FARO','received_at',r.received_at,'observed_at',r.payload->>'observed_at','rule_version',coalesce(r.payload->>'rule_version','legacy-candidate'),'evidence_url',r.payload->>'evidence_url','quote',left(r.payload->>'evidence',500),'locations_declared',coalesce(r.payload->'locations_declared',jsonb_build_array(jsonb_build_object('city',r.payload->>'city','state',r.payload->>'state'))),'region_verified',false,'price_validated',false) from (select distinct on(source_id) source_id,payload,received_at from cip_rota_bridge_private.receipts order by source_id,received_at desc,event_id) r where s.id=r.source_id;
commit;
