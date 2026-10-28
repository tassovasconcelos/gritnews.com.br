begin;
create schema cip_rota_bridge_private;
revoke all on schema cip_rota_bridge_private from public,anon,authenticated;
create table cip_rota_bridge_private.auth(id boolean primary key default true check(id),secret text not null check(length(secret)=64));
create table cip_rota_bridge_private.receipts(event_id text primary key,source_id uuid not null references public.market_radar_sources(id),payload jsonb not null,received_at timestamptz not null default now());
alter table cip_rota_bridge_private.auth enable row level security;
alter table cip_rota_bridge_private.receipts enable row level security;
revoke all on all tables in schema cip_rota_bridge_private from public,anon,authenticated,service_role;
create function cip_rota_bridge_private.receive(body text,stamp text,sig text) returns jsonb language plpgsql security definer set search_path='' as $$
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
 insert into cip_rota_bridge_private.receipts(event_id,source_id,payload) values(eid,sid,p);
 return jsonb_build_object('accepted',true,'duplicate',false,'event_id',eid,'source_id',sid);
end;$$;
revoke all on function cip_rota_bridge_private.receive(text,text,text) from public,anon,authenticated;
grant usage on schema cip_rota_bridge_private to service_role;
grant execute on function cip_rota_bridge_private.receive(text,text,text) to service_role;
create function public.cip_faro_rental_receive(p_body text,p_stamp text,p_signature text) returns jsonb language sql security invoker set search_path='' as $$select cip_rota_bridge_private.receive(p_body,p_stamp,p_signature);$$;
revoke all on function public.cip_faro_rental_receive(text,text,text) from public,anon,authenticated;
grant execute on function public.cip_faro_rental_receive(text,text,text) to service_role;
commit;
