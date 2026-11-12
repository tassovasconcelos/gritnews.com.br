-- B2B2C discovery is an on-demand, bounded research operation. No channel/ERP writes.
begin;
create schema cip_market_private;
revoke all on schema cip_market_private from public,anon;
grant usage on schema cip_market_private to authenticated,service_role;
create table public.cip_market_runs(
 id uuid primary key default gen_random_uuid(),company_id text not null references public.cip_companies(id),actor uuid not null references auth.users(id),
 sku text not null,store_code text not null,our jsonb not null,criteria jsonb not null,domains jsonb not null,mode text not null check(mode in ('identity','alternatives')),
 state text not null default 'running' check(state in ('running','completed','failed')),meta jsonb not null default '{}',created_at timestamptz not null default now(),finished_at timestamptz,
 unique(id,company_id),check(length(sku) between 1 and 80),check(length(store_code) between 1 and 80)
);
create index cip_market_runs_scope on public.cip_market_runs(company_id,sku,created_at desc);
create index cip_market_runs_actor on public.cip_market_runs(actor,created_at desc);
create table public.cip_market_offers(
 id uuid primary key default gen_random_uuid(),run_id uuid not null,company_id text not null,sku text not null,url text not null,seller text not null,offer jsonb not null,
 state text not null default 'candidate' check(state in ('candidate','linked','alternative','rejected')),review jsonb,version integer not null default 1,
 reference_id uuid,reviewed_by uuid references auth.users(id),reviewed_at timestamptz,created_at timestamptz not null default now(),
 foreign key(run_id,company_id) references public.cip_market_runs(id,company_id),foreign key(reference_id,company_id) references public.cip_mp_market_refs(id,company_id),
 unique(run_id,url,seller),check(length(url)<=1000 and url~'^https://[^/@[:space:]]+([/?#][^[:space:]]*)?$'),check(length(seller) between 1 and 120),check(jsonb_typeof(offer)='object')
);
create index cip_market_offers_scope on public.cip_market_offers(company_id,sku,created_at desc);
create index cip_market_offers_run on public.cip_market_offers(run_id,company_id);
create index cip_market_offers_ref on public.cip_market_offers(reference_id,company_id);
create index cip_market_offers_reviewer on public.cip_market_offers(reviewed_by);
do $$declare t text;begin foreach t in array array['cip_market_runs','cip_market_offers'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from public,anon,authenticated',t);
 execute format('grant select on public.%I to authenticated',t);
 execute format('grant all on public.%I to service_role',t);
 execute format('create policy company_read on public.%I for select to authenticated using(public.cip_can_access(company_id))',t);
end loop;end;$$;
create function public.cip_market_can_write(p_company text) returns boolean language sql stable security invoker set search_path='' as $$select cip_pricing_private.writer(p_company);$$;
revoke all on function public.cip_market_can_write(text) from public,anon;
grant execute on function public.cip_market_can_write(text) to authenticated;
create function cip_market_private.start(c text,k text,store text,criteria jsonb,domains jsonb,mode text) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_actor uuid:=auth.uid();desk jsonb;item jsonb;r public.cip_market_runs;d text;
begin
 if v_actor is null or not cip_pricing_private.writer(c) then raise exception 'writer_required';end if;
 if length(k) not between 1 and 80 or length(store) not between 1 and 80 or mode not in ('identity','alternatives') or jsonb_typeof(criteria) is distinct from 'object' or octet_length(criteria::text)>3000 or jsonb_typeof(domains) is distinct from 'array' or jsonb_array_length(domains) not between 1 and 8 then raise exception 'invalid_query';end if;
 for d in select jsonb_array_elements_text(domains) loop if length(d)>180 or d !~ '^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$' or d~'(^|\.)(localhost|local|internal|test|invalid|example|onion)$' then raise exception 'invalid_domains';end if;end loop;
 perform pg_advisory_xact_lock(hashtextextended('cip-market-budget',0));
 if exists(select 1 from public.cip_market_runs budget where budget.actor=v_actor and state='running' and created_at>now()-interval '2 minutes') then raise exception 'search_in_progress';end if;
 if (select count(*) from public.cip_market_runs budget where budget.actor=v_actor and created_at>=(now() at time zone 'America/Sao_Paulo')::date::timestamp at time zone 'America/Sao_Paulo')>=10 or (select count(*) from public.cip_market_runs where company_id=c and created_at>=(now() at time zone 'America/Sao_Paulo')::date::timestamp at time zone 'America/Sao_Paulo')>=30 then raise exception 'daily_limit';end if;
 desk:=public.cip_mp_desk_get(c,k,store,'marketplace',0);
 select x into item from jsonb_array_elements(desk->'items')x where x->>'sku'=k and x->>'store_code'=store limit 1;
 if item is null then raise exception 'source_product_required';end if;
 insert into public.cip_market_runs(company_id,actor,sku,store_code,our,criteria,domains,mode) values(c,v_actor,k,store,jsonb_build_object('sku',k,'store_code',store,'description',item->>'description','unit',item->>'unit','price',item->'price','source_at',desk->'source_at'),criteria,domains,mode) returning * into r;
 return to_jsonb(r);
end;$$;
revoke all on function cip_market_private.start(text,text,text,jsonb,jsonb,text) from public,anon;
grant execute on function cip_market_private.start(text,text,text,jsonb,jsonb,text) to authenticated;
create function public.cip_market_start(p_company text,p_sku text,p_store text,p_criteria jsonb,p_domains jsonb,p_mode text) returns jsonb language sql security invoker set search_path='' as $$select cip_market_private.start(p_company,p_sku,p_store,p_criteria,p_domains,p_mode);$$;
revoke all on function public.cip_market_start(text,text,text,jsonb,jsonb,text) from public,anon;
grant execute on function public.cip_market_start(text,text,text,jsonb,jsonb,text) to authenticated;

create function cip_market_private.finish(rid uuid,offers jsonb,p_meta jsonb,failed boolean) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.cip_market_runs;o jsonb;total integer:=0;
begin
 select * into r from public.cip_market_runs where id=rid for update;
 if r.id is null or r.state<>'running' then raise exception 'search_state_changed';end if;
 if not exists(select 1 from public.cip_profiles p where p.user_id=r.actor and p.active and (p.role='superadm' or exists(select 1 from public.cip_memberships m where m.user_id=p.user_id and m.company_id=r.company_id and m.active and (p.role='diretoria' or m.role in ('gestor','precificacao','compras'))))) then raise exception 'writer_required';end if;
 if jsonb_typeof(offers) is distinct from 'array' or jsonb_array_length(offers)>24 or octet_length(offers::text)>100000 or octet_length(p_meta::text)>10000 then raise exception 'result_limit';end if;
 if not failed then for o in select jsonb_array_elements(offers) loop
 if not exists(select 1 from jsonb_array_elements_text(r.domains)d where split_part(split_part(o->>'url','/',3),':',1)=d or split_part(split_part(o->>'url','/',3),':',1) like '%.'||d) or o->'match'->>'kind' not in ('exact_gtin','exact_brand_model','similar','alternative','incompatible') then raise exception 'invalid_source';end if;
 insert into public.cip_market_offers(run_id,company_id,sku,url,seller,offer) values(r.id,r.company_id,r.sku,o->>'url',coalesce(nullif(o->>'seller',''),'Vendedor não identificado'),o) on conflict(run_id,url,seller) do nothing;
 get diagnostics total=row_count;
 end loop;end if;
 update public.cip_market_runs set state=case when failed then 'failed' else 'completed' end,meta=p_meta,finished_at=now() where id=rid;
 insert into public.cip_mp_desk_events(company_id,actor,kind,detail) values(r.company_id,r.actor,'market_research',jsonb_build_object('run_id',rid,'failed',failed,'offers',(select count(*) from public.cip_market_offers where run_id=rid),'coverage','sample'));
 return jsonb_build_object('id',rid,'state',case when failed then 'failed' else 'completed' end,'offers',(select count(*) from public.cip_market_offers where run_id=rid));
end;$$;
revoke all on function cip_market_private.finish(uuid,jsonb,jsonb,boolean) from public,anon,authenticated;
grant execute on function cip_market_private.finish(uuid,jsonb,jsonb,boolean) to service_role;
create function public.cip_market_finish(p_run uuid,p_offers jsonb,p_meta jsonb,p_failed boolean default false) returns jsonb language sql security invoker set search_path='' as $$select cip_market_private.finish(p_run,p_offers,p_meta,p_failed);$$;
revoke all on function public.cip_market_finish(uuid,jsonb,jsonb,boolean) from public,anon,authenticated;
grant execute on function public.cip_market_finish(uuid,jsonb,jsonb,boolean) to service_role;

create function cip_market_private.read(c text,k text) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare runs jsonb;offers jsonb;
begin
 if auth.uid() is null or not public.cip_can_access(c) then raise exception 'authorized_company_required';end if;
 if k is null or length(k)>80 then raise exception 'invalid_query';end if;
 select coalesce(jsonb_agg(to_jsonb(x)),'[]') into runs from(select * from public.cip_market_runs where company_id=c and (k='' or sku=k) order by created_at desc,id limit 10)x;
 select coalesce(jsonb_agg(to_jsonb(x)||jsonb_build_object('criteria',r.criteria,'our',r.our,'mode',r.mode)),'[]') into offers from(select * from public.cip_market_offers where company_id=c and (k='' or sku=k) order by created_at desc,id limit 100)x join public.cip_market_runs r on r.id=x.run_id and r.company_id=x.company_id;
 return jsonb_build_object('runs',runs,'offers',offers,'can_write',cip_pricing_private.writer(c),'limit',100,'coverage','sample');
end;$$;
revoke all on function cip_market_private.read(text,text) from public,anon;
grant execute on function cip_market_private.read(text,text) to authenticated;
create function public.cip_market_get(p_company text,p_sku text default '') returns jsonb language sql stable security invoker set search_path='' as $$select cip_market_private.read(p_company,p_sku);$$;
revoke all on function public.cip_market_get(text,text) from public,anon;
grant execute on function public.cip_market_get(text,text) to authenticated;

create function cip_market_private.review(c text,oid uuid,v integer,action text,d jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare o public.cip_market_offers;r public.cip_market_runs;ref jsonb;required text;refdata jsonb;retired uuid[];unit text;kind text;note text;
begin
 if auth.uid() is null or not cip_pricing_private.writer(c) then raise exception 'writer_required';end if;
 if d is null or jsonb_typeof(d)<>'object' or octet_length(d::text)>8000 then raise exception 'invalid_review';end if;
 select * into o from public.cip_market_offers where company_id=c and id=oid for update;
 if o.id is null or o.version<>v or o.state<>'candidate' then raise exception 'offer_changed';end if;
 select * into r from public.cip_market_runs where id=o.run_id and company_id=c;
 note:=btrim(d->>'note');if note is null or length(note) not between 10 and 1000 then raise exception 'review_note_required';end if;
 if action not in ('link','alternative','reject') or action is null then raise exception 'invalid_action';end if;
 if action='link' then
 kind:=o.offer->'match'->>'kind';unit:=r.our->>'unit';
 if kind is null or kind in ('incompatible','alternative') or coalesce(jsonb_array_length(o.offer->'match'->'conflicts'),0)>0 or o.offer->>'currency' is distinct from 'BRL' then raise exception 'comparison_blocked';end if;
 if o.created_at<now()-interval '7 days' then raise exception 'stale_offer';end if;
 foreach required in array array['product','packaging','price','shipping','stock','terms','replace_previous'] loop if d->'checks'->required is distinct from 'true'::jsonb then raise exception 'checks_required';end if;end loop;
 if o.seller='Vendedor não identificado' or unit is null or length(unit) not between 1 and 80 then raise exception 'identity_required';end if;
 perform pg_advisory_xact_lock(hashtextextended('cip-market-ref:'||c||':'||o.sku,0));
 if exists(select 1 from public.cip_market_offers newer where newer.company_id=c and newer.sku=o.sku and newer.url=o.url and newer.seller=o.seller and newer.state='linked' and newer.created_at>o.created_at) then raise exception 'newer_offer_reviewed';end if;
 refdata:=jsonb_build_object('sku',o.sku,'our_unit',unit,'competitor',left(o.seller||' · '||(o.offer->>'platform'),120),'pack_price',d->'price','shipping',d->'shipping','equivalent_units',d->'equivalent_units','channel',d->>'channel','conditions',left(note||' | Radar '||r.id::text||' | '||coalesce(o.offer->>'conditions',''),600),'source_url',o.url,'observed_on',(now() at time zone 'America/Sao_Paulo')::date,'equivalent',true,'availability','available');
 -- The existing checked command validates numbers, date, channel, actor and company.
 ref:=cip_pricing_private.command(c,'reference',refdata);
 with old as(select distinct x.reference_id from public.cip_market_offers x join public.cip_mp_market_refs f on f.id=x.reference_id and f.company_id=x.company_id where x.company_id=c and x.sku=o.sku and x.url=o.url and x.seller=o.seller and f.active and f.channel=d->>'channel' and f.our_unit=unit)
 update public.cip_mp_market_refs set active=false where id in(select reference_id from old);
 update public.cip_market_offers set state='linked',reference_id=(ref->>'id')::uuid,review=d,reviewed_by=auth.uid(),reviewed_at=now(),version=version+1 where id=o.id;
 else update public.cip_market_offers set state=case when action='reject' then 'rejected' else 'alternative' end,review=d,reviewed_by=auth.uid(),reviewed_at=now(),version=version+1 where id=o.id;
 end if;
 insert into public.cip_mp_desk_events(company_id,actor,kind,detail) values(c,auth.uid(),'market_review',jsonb_build_object('offer_id',o.id,'run_id',r.id,'action',action,'review',d,'reference_id',ref->>'id','erp_executed',false));
 return jsonb_build_object('id',o.id,'reference_id',ref->>'id','erp_executed',false);
end;$$;
revoke all on function cip_market_private.review(text,uuid,integer,text,jsonb) from public,anon;
grant execute on function cip_market_private.review(text,uuid,integer,text,jsonb) to authenticated;
create function public.cip_market_review(p_company text,p_offer uuid,p_version integer,p_action text,p_data jsonb) returns jsonb language sql security invoker set search_path='' as $$select cip_market_private.review(p_company,p_offer,p_version,p_action,p_data);$$;
revoke all on function public.cip_market_review(text,uuid,integer,text,jsonb) from public,anon;
grant execute on function public.cip_market_review(text,uuid,integer,text,jsonb) to authenticated;
commit;
