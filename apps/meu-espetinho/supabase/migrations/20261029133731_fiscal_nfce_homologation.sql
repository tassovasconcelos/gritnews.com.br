-- Review/homologation only. No production authorization or fiscal exemption.
create table public.fiscal_settings (
 tenant_id uuid primary key references public.tenants(id),
 cnpj text not null check (cnpj ~ '^[0-9]{14}$'),
 state_registration text not null check (length(state_registration) between 1 and 20),
 legal_name text not null check (length(legal_name) between 1 and 120),
 uf text not null default 'CE' check (uf='CE'),
 environment text not null default 'homologacao' check (environment='homologacao'),
 updated_at timestamptz not null default now()
);
create table public.fiscal_documents (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null references public.tenants(id),
 order_id uuid not null unique references public.orders(id),
 status text not null default 'pending' check (status in ('pending','processing','simulated','rejected','unknown')),
 obligation_pending boolean not null default true check (obligation_pending),
 environment text not null default 'homologacao' check (environment='homologacao'),
 snapshot jsonb not null,
 attempt_id uuid,
 result_code text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index fiscal_documents_tenant_status on public.fiscal_documents(tenant_id,status);
create table public.fiscal_events (
 id bigint generated always as identity primary key,
 tenant_id uuid not null references public.tenants(id),
 document_id uuid references public.fiscal_documents(id),
 actor_id uuid references auth.users(id),
 event text not null,
 created_at timestamptz not null default now()
);
create index fiscal_events_tenant_document on public.fiscal_events(tenant_id,document_id,created_at);

-- Fiscal access excludes temporary support grants and checks actual membership.
create function private.fiscal_access(t uuid, management boolean default false)
returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and (
 exists(select 1 from public.tenants where id=t and owner_user_id=auth.uid()) or
 exists(select 1 from public.tenant_users where tenant_id=t and user_id=auth.uid() and active
 and (not management or role in ('owner','manager','cashier'))))
$$;
revoke all on function private.fiscal_access(uuid,boolean) from public,anon;
grant execute on function private.fiscal_access(uuid,boolean) to authenticated;
alter table public.fiscal_settings enable row level security;
alter table public.fiscal_documents enable row level security;
alter table public.fiscal_events enable row level security;
revoke all on public.fiscal_settings,public.fiscal_documents,public.fiscal_events from anon,authenticated;
grant select on public.fiscal_settings,public.fiscal_documents,public.fiscal_events to authenticated;
grant insert,update on public.fiscal_settings to authenticated;
create policy fiscal_settings_read on public.fiscal_settings for select to authenticated using(private.fiscal_access(tenant_id));
create policy fiscal_settings_insert on public.fiscal_settings for insert to authenticated with check(
 exists(select 1 from public.tenants where id=tenant_id and owner_user_id=auth.uid()));
create policy fiscal_settings_update on public.fiscal_settings for update to authenticated using(
 exists(select 1 from public.tenants where id=tenant_id and owner_user_id=auth.uid())) with check(
 exists(select 1 from public.tenants where id=tenant_id and owner_user_id=auth.uid()));
create policy fiscal_documents_read on public.fiscal_documents for select to authenticated using(private.fiscal_access(tenant_id));
create policy fiscal_events_read on public.fiscal_events for select to authenticated using(private.fiscal_access(tenant_id));

create function private.audit_fiscal_settings() returns trigger language plpgsql security definer set search_path='' as $$
begin
 new.updated_at=now();
 insert into public.fiscal_events(tenant_id,actor_id,event) values(new.tenant_id,auth.uid(),'settings_updated');
 return new;
end $$;
create trigger fiscal_settings_audit before insert or update on public.fiscal_settings
for each row execute function private.audit_fiscal_settings();

-- Lock the parent when changing items, serializing edits with close_order_atomic.
create function private.guard_fiscal_items() returns trigger language plpgsql security definer set search_path='' as $$
declare s text;
begin
 if TG_OP in ('UPDATE','DELETE') then
  select status into s from public.orders where id=old.order_id and tenant_id=old.tenant_id for update;
  if s is distinct from 'open' then raise exception 'sale_items_locked'; end if;
 end if;
 if TG_OP in ('INSERT','UPDATE') then
  select status into s from public.orders where id=new.order_id and tenant_id=new.tenant_id for update;
  if s is distinct from 'open' then raise exception 'sale_items_locked'; end if;
  if new.total <> round(new.unit_price*new.quantity,2) then raise exception 'invalid_item_total'; end if;
 end if;
 if TG_OP='DELETE' then return old; end if;
 return new;
end $$;
create trigger fiscal_items_guard before insert or update or delete on public.order_items
for each row execute function private.guard_fiscal_items();

create function private.guard_fiscal_order() returns trigger language plpgsql security definer set search_path='' as $$
declare item_sum numeric; item_count integer;
begin
 if TG_OP='UPDATE' and old.status='closed' and
  (new.status,new.tenant_id,new.total,new.subtotal,new.discount,new.customer_id,new.closed_at) is distinct from
  (old.status,old.tenant_id,old.total,old.subtotal,old.discount,old.customer_id,old.closed_at)
 then raise exception 'closed_sale_locked'; end if;
 if new.status='closed' and (TG_OP='INSERT' or old.status is distinct from 'closed') then
  select count(*),coalesce(sum(round(unit_price*quantity,2)),0) into item_count,item_sum
  from public.order_items where order_id=new.id and tenant_id=new.tenant_id;
  if item_count=0 or new.total<>greatest(item_sum-coalesce(new.discount,0),0) then raise exception 'sale_total_mismatch'; end if;
 end if;
 return new;
end $$;
create trigger fiscal_order_guard before insert or update on public.orders
for each row execute function private.guard_fiscal_order();

-- Every close path (including direct Data API writes) records a fiscal obligation
-- in the SAME transaction. Receipt actions cannot waive it.
create function private.capture_fiscal_sale() returns trigger language plpgsql security definer set search_path='' as $$
declare d uuid;
begin
 if new.status='closed' and (TG_OP='INSERT' or old.status is distinct from 'closed') then
  insert into public.fiscal_documents(tenant_id,order_id,snapshot)
  values(new.tenant_id,new.id,jsonb_build_object('order_id',new.id,'total',new.total,'closed_at',new.closed_at,
   'items',coalesce((select jsonb_agg(jsonb_build_object('product_id',product_id,'name',product_name,'quantity',quantity,'unit_price',unit_price,'total',total))
    from public.order_items where order_id=new.id and tenant_id=new.tenant_id),'[]'::jsonb)))
  returning id into d;
  insert into public.fiscal_events(tenant_id,document_id,actor_id,event) values(new.tenant_id,d,auth.uid(),'obligation_created');
 end if;
 return new;
end $$;
create trigger fiscal_sale_capture after insert or update on public.orders for each row execute function private.capture_fiscal_sale();

create function private.claim_fiscal_simulation(t uuid,o uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare d public.fiscal_documents;
begin
 if not private.fiscal_access(t,true) then raise exception 'forbidden' using errcode='42501'; end if;
 if not exists(select 1 from public.fiscal_settings where tenant_id=t) then raise exception 'fiscal_settings_required'; end if;
 select * into d from public.fiscal_documents where tenant_id=t and order_id=o for update;
 if d.id is null then raise exception 'closed_sale_required'; end if;
 -- A processing/ambiguous request MUST be reconciled using the same attempt.
 if d.status in ('simulated','processing','unknown') then return to_jsonb(d); end if;
 update public.fiscal_documents set status='processing',attempt_id=gen_random_uuid(),updated_at=now()
 where id=d.id returning * into d;
 insert into public.fiscal_events(tenant_id,document_id,actor_id,event) values(t,d.id,auth.uid(),'simulation_requested');
 return to_jsonb(d);
end $$;
create function public.claim_fiscal_simulation(t uuid,o uuid) returns jsonb
language sql security invoker set search_path='' as $$ select private.claim_fiscal_simulation(t,o) $$;
revoke all on function private.claim_fiscal_simulation(uuid,uuid),public.claim_fiscal_simulation(uuid,uuid) from public,anon;
grant execute on function private.claim_fiscal_simulation(uuid,uuid),public.claim_fiscal_simulation(uuid,uuid) to authenticated;

-- Only the Edge function's server credential may record a provider result.
create function public.finish_fiscal_simulation(d uuid,a uuid,s text,c text) returns void
language plpgsql security invoker set search_path='' as $$
declare t uuid;
begin
 if s not in ('simulated','rejected','unknown') or c not in ('SIMULATED_100','SIMULATED_539','COMMUNICATION_UNKNOWN') then raise exception 'invalid_result'; end if;
 update public.fiscal_documents set status=s,result_code=c,updated_at=now()
 where id=d and attempt_id=a and status in ('processing','unknown') returning tenant_id into t;
 if t is not null then insert into public.fiscal_events(tenant_id,document_id,event) values(t,d,'simulation_'||s); end if;
end $$;
revoke all on function public.finish_fiscal_simulation(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.finish_fiscal_simulation(uuid,uuid,text,text) to service_role;
grant all on public.fiscal_documents,public.fiscal_events to service_role;
grant usage,select on sequence public.fiscal_events_id_seq to service_role;
revoke all on function private.audit_fiscal_settings(),private.capture_fiscal_sale() from public,anon,authenticated;
revoke all on function private.guard_fiscal_items(),private.guard_fiscal_order() from public,anon,authenticated;
