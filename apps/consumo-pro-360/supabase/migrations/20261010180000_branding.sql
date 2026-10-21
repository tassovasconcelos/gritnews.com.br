-- Marca oficial do Grupo: asset original fornecido pelo administrador, sem recriação.
create table if not exists public.cp_branding (
  organization_id uuid primary key references public.cp_organizations(id),
  logo_path text,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);
alter table public.cp_branding enable row level security;
create policy cp_branding_read on public.cp_branding for select to authenticated
 using(private.cp_is_member(organization_id));
grant select on public.cp_branding to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('consumo-pro-brand','consumo-pro-brand',true,2097152,
  array['image/png','image/jpeg','image/webp'])
 on conflict(id) do nothing;
create policy cp_brand_upload on storage.objects for insert to authenticated
 with check(bucket_id='consumo-pro-brand' and
 case when split_part(name,'/',1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
 then private.cp_has_org_role(split_part(name,'/',1)::uuid,array['group_admin']) else false end);
-- Não criar update/delete para manter histórico dos arquivos aprovados por caminho versionado.
create or replace function public.cp_set_brand_logo(p_org uuid,p_path text)
returns text language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not private.cp_has_org_role(p_org,array['group_admin']) then
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
