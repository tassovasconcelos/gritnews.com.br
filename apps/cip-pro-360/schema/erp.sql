begin;
create table public.cip_erp_snapshots(
 id uuid primary key default gen_random_uuid(),company_id text not null references public.cip_companies(id),
 source_name text not null check(char_length(source_name) between 1 and 180),source_hash text not null check(source_hash ~ '^[a-f0-9]{64}$'),
 captured_at timestamptz not null,payload jsonb not null check(octet_length(payload::text)<=8000000),metadata jsonb not null,summary jsonb not null,
 status text not null default 'draft' check(status in ('draft','approved','retired')),created_by uuid not null references auth.users(id),created_at timestamptz not null default now(),
 reviewed_by uuid references auth.users(id),reviewed_at timestamptz,review_note text,declared_inventory numeric(20,2),declared_sales numeric(20,2),
 unique(company_id,source_hash)
);
create index cip_erp_latest_company_idx on public.cip_erp_snapshots(company_id,captured_at desc,created_at desc) where status='approved';
alter table public.cip_erp_snapshots enable row level security;
revoke all on public.cip_erp_snapshots from public,anon,authenticated;
grant all on public.cip_erp_snapshots to service_role;
grant select(id,company_id,source_name,source_hash,captured_at,metadata,summary,status,created_at,reviewed_at,review_note) on public.cip_erp_snapshots to authenticated;
create policy erp_scope_read on public.cip_erp_snapshots for select to authenticated using(public.cip_can_access(company_id) and exists(select 1 from public.cip_profiles where user_id=(select auth.uid()) and active and role='superadm'));
create function public.cip_erp_import(p_actor uuid,p_source text,p_hash text,p_rows jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare item jsonb;rec public.cip_erp_snapshots;result jsonb='[]';inv numeric;rev numeric;
begin
 if not exists(select 1 from public.cip_profiles where user_id=p_actor and active and role='superadm') then raise exception 'superadmin_required';end if;
 if jsonb_typeof(p_rows)<>'array' or jsonb_array_length(p_rows) not between 1 and 2 then raise exception 'invalid_import';end if;
 for item in select value from jsonb_array_elements(p_rows) loop
  if item->>'company_id' not in ('shopping_prohospital','distribuidora_prohospital') or jsonb_typeof(item->'data'->'inventory')<>'array' or jsonb_typeof(item->'data'->'sales')<>'array' or (item->>'captured_at')::timestamptz>now()+interval '5 minutes' then raise exception 'invalid_import';end if;
  select coalesce(sum((r->>'stock_value')::numeric),0) into inv from jsonb_array_elements(item->'data'->'inventory') r;
  select coalesce(sum((r->>'net_revenue')::numeric),0) into rev from jsonb_array_elements(item->'data'->'sales') r;
  if inv<>(item->'summary'->>'inventory_total')::numeric or rev<>(item->'summary'->>'sales_total')::numeric then raise exception 'summary_mismatch';end if;
  insert into public.cip_erp_snapshots(company_id,source_name,source_hash,captured_at,payload,metadata,summary,created_by)
  values(item->>'company_id',p_source,p_hash,(item->>'captured_at')::timestamptz,item,item->'metadata',item->'summary',p_actor)
  on conflict(company_id,source_hash) do nothing returning * into rec;
  if rec.id is null then select * into rec from public.cip_erp_snapshots where company_id=item->>'company_id' and source_hash=p_hash;end if;
  result=result||jsonb_build_array(jsonb_build_object('id',rec.id,'company_id',rec.company_id,'status',rec.status));
 end loop;return result;
end;$$;
create function public.cip_erp_approve(p_actor uuid,p_id uuid,p_inventory numeric,p_sales numeric,p_note text) returns boolean language plpgsql security definer set search_path='' as $$
declare rec public.cip_erp_snapshots;
begin
 if not exists(select 1 from public.cip_profiles where user_id=p_actor and active and role='superadm') then raise exception 'superadmin_required';end if;
 select * into rec from public.cip_erp_snapshots where id=p_id and status='draft' for update;if not found then raise exception 'draft_required';end if;
 if p_inventory is null or p_sales is null or p_note is null or char_length(btrim(p_note)) not between 20 and 2000 then raise exception 'reconciliation_required';end if;
 if abs(p_inventory-(rec.summary->>'inventory_total')::numeric)>0.01 or abs(p_sales-(rec.summary->>'sales_total')::numeric)>0.01 then raise exception 'reconciliation_mismatch';end if;
 update public.cip_erp_snapshots set status='approved',reviewed_by=p_actor,reviewed_at=now(),review_note=p_note,declared_inventory=p_inventory,declared_sales=p_sales where id=p_id;return true;
end;$$;
create function public.cip_erp_get(p_actor uuid,p_company text,p_id uuid default null) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare rec public.cip_erp_snapshots;is_admin boolean;
begin
 select role='superadm' into is_admin from public.cip_profiles where user_id=p_actor and active;
 if is_admin is not true then raise exception 'financial_pilot_superadmin_required';end if;
 select * into rec from public.cip_erp_snapshots where company_id=p_company and (p_id is not null and id=p_id or p_id is null and status='approved') order by captured_at desc,created_at desc limit 1;
 if not found then return null;end if;
 return jsonb_build_object('id',rec.id,'company_id',rec.company_id,'source_name',rec.source_name,'source_hash',rec.source_hash,'captured_at',rec.captured_at,'status',rec.status,'reviewed_at',rec.reviewed_at,'payload',rec.payload);
end;$$;
create function public.cip_bot_erp_get(p_telegram text,p_chat text,p_company text) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare b public.cip_bot_bindings;
begin
 select * into b from public.cip_bot_bindings where telegram_id=p_telegram and chat_id=p_chat and active;
 if not found or not exists(select 1 from public.cip_profiles where user_id=b.user_id and active and role='superadm') then raise exception 'authorized_binding_required';end if;
 return public.cip_erp_get(b.user_id,p_company,null);
end;$$;
revoke all on function public.cip_erp_import(uuid,text,text,jsonb),public.cip_erp_approve(uuid,uuid,numeric,numeric,text),public.cip_erp_get(uuid,text,uuid),public.cip_bot_erp_get(text,text,text) from public,anon,authenticated;
grant execute on function public.cip_erp_import(uuid,text,text,jsonb),public.cip_erp_approve(uuid,uuid,numeric,numeric,text),public.cip_erp_get(uuid,text,uuid),public.cip_bot_erp_get(text,text,text) to service_role;
comment on table public.cip_erp_snapshots is 'Immutable manually imported reference data. Drafts unavailable to bot; human reconciliation required. Not a live Procfit integration.';
create or replace function public.cip_bot_interaction_ready(p_bot_id text) returns void language sql security definer set search_path='' as $$
 update public.cip_bot_config set interaction_version=3 where id=1 and bot_id=p_bot_id;
$$;
create or replace function public.cip_bot_remember(p_telegram text,p_chat text,p_kind text,p_query text) returns void language sql security definer set search_path='' as $$
 update public.cip_bot_bindings b set last_kind=p_kind,last_query=left(p_query,200),last_at=now() where telegram_id=p_telegram and chat_id=p_chat and active and p_kind in ('summary','missions','processes','knowledge','sales_mtd','inventory','aged_stock','no_sales_stock','growth_actions') and exists(select 1 from public.cip_profiles p where p.user_id=b.user_id and p.active and p.role='superadm');
$$;

commit;
