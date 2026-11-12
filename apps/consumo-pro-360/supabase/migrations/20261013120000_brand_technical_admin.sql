alter policy cp_brand_upload on storage.objects with check(bucket_id='consumo-pro-brand' and case when split_part(name,'/',1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then private.cp_has_org_role(split_part(name,'/',1)::uuid,array['group_admin','grit_superadmin']) else false end);
create or replace function public.cp_set_brand_logo(p_org uuid,p_path text)
returns text language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not private.cp_has_org_role(p_org,array['group_admin','grit_superadmin']) then
  raise exception 'Somente administrador do Grupo pode alterar a marca'; end if;
 if length(p_path)>300 or p_path not like p_org::text||'/%' or
  p_path !~* '\.(png|jpg|jpeg|webp)$' then
  raise exception 'Caminho da marca inválido'; end if;
 if not exists(select 1 from storage.objects where bucket_id='consumo-pro-brand' and name=p_path) then
  raise exception 'Arquivo de marca não localizado'; end if;
 insert into public.cp_branding(organization_id,logo_path,updated_by,updated_at)
 values(p_org,p_path,auth.uid(),now())
 on conflict(organization_id) do update set logo_path=excluded.logo_path,
  updated_by=excluded.updated_by,updated_at=excluded.updated_at;
 insert into public.cp_audit_events(organization_id,actor_id,entity,entity_id,action,detail)
 values(p_org,auth.uid(),'branding',p_org,'logo_updated',jsonb_build_object('path',p_path));
 return p_path;
end $$;
revoke execute on function public.cp_set_brand_logo(uuid,text) from public,anon;
grant execute on function public.cp_set_brand_logo(uuid,text) to authenticated;

