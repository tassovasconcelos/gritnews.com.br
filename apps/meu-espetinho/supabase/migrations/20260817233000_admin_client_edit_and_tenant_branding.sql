create or replace function public.admin_update_tenant_profile(p_tenant_id uuid,p_name text,p_phone text default null,p_address text default null,p_primary_color text default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_admin uuid:=auth.uid();
begin
 if not exists(select 1 from public.admin_users where user_id=v_admin and active=true) then raise exception 'forbidden'; end if;
 if nullif(trim(p_name),'') is null then raise exception 'invalid_name'; end if;
 update public.tenants set
  name=trim(p_name),
  phone=nullif(trim(coalesce(p_phone,'')),''),
  address=nullif(trim(coalesce(p_address,'')),''),
  primary_color=case when coalesce(p_primary_color,'')~'^#[0-9A-Fa-f]{6}$' then p_primary_color else primary_color end
 where id=p_tenant_id;
 if not found then raise exception 'tenant_not_found'; end if;
 insert into public.audit_logs(tenant_id,user_id,action,entity,entity_id,metadata)
 values(p_tenant_id,v_admin,'tenant_profile_updated','tenant',p_tenant_id::text,jsonb_build_object('source','super_admin'));
 return jsonb_build_object('ok',true);
end;$$;
revoke all on function public.admin_update_tenant_profile(uuid,text,text,text,text) from public,anon;
grant execute on function public.admin_update_tenant_profile(uuid,text,text,text,text) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('tenant-branding','tenant-branding',true,5242880,array['image/png','image/jpeg'])
on conflict(id) do update set public=true,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists tenant_branding_insert on storage.objects;
create policy tenant_branding_insert on storage.objects for insert to authenticated with check(
 bucket_id='tenant-branding' and exists(
  select 1 from public.tenants t
  left join public.tenant_users tu on tu.tenant_id=t.id and tu.user_id=auth.uid()
  where t.id::text=split_part(name,'/',1)
    and (t.owner_user_id=auth.uid() or (tu.active=true and tu.role='manager'))
 )
);
drop policy if exists tenant_branding_update on storage.objects;
create policy tenant_branding_update on storage.objects for update to authenticated using(
 bucket_id='tenant-branding' and exists(
  select 1 from public.tenants t
  left join public.tenant_users tu on tu.tenant_id=t.id and tu.user_id=auth.uid()
  where t.id::text=split_part(name,'/',1)
    and (t.owner_user_id=auth.uid() or (tu.active=true and tu.role='manager'))
 )
) with check(bucket_id='tenant-branding');
drop policy if exists tenant_branding_delete on storage.objects;
create policy tenant_branding_delete on storage.objects for delete to authenticated using(
 bucket_id='tenant-branding' and exists(
  select 1 from public.tenants t
  left join public.tenant_users tu on tu.tenant_id=t.id and tu.user_id=auth.uid()
  where t.id::text=split_part(name,'/',1)
    and (t.owner_user_id=auth.uid() or (tu.active=true and tu.role='manager'))
 )
);