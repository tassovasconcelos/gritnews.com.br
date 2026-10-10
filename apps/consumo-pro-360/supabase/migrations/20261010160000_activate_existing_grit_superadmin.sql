-- Activate existing, email-verified GRIT superadmin only; no password or Auth account is created.
do $$
declare v_user uuid; v_org uuid; v_dir uuid; v_count int;
begin
 select count(*), min(id) into v_count,v_user from auth.users
 where lower(email)='gritsolucoes@gmail.com' and email_confirmed_at is not null and deleted_at is null;
 if v_count <> 1 then raise exception 'Expected exactly one verified GRIT Auth user, got %',v_count; end if;
 select id into strict v_org from public.cp_organizations where name='Grupo Prohospital';
 select id into strict v_dir from public.cp_user_directory
 where organization_id=v_org and email='gritsolucoes@gmail.com' and requested_role='grit_superadmin'
 and (auth_user_id is null or auth_user_id=v_user);
 if exists(select 1 from public.cp_memberships where organization_id=v_org and user_id=v_user and role<>'grit_superadmin' and active) then
 raise exception 'Account has incompatible active roles'; end if;
 insert into public.cp_memberships(organization_id,user_id,role,active,company_id,department_id)
 values(v_org,v_user,'grit_superadmin',true,null,null)
 on conflict (user_id,organization_id,company_id,department_id,role) do nothing;
 if not exists(select 1 from public.cp_memberships where organization_id=v_org and user_id=v_user and role='grit_superadmin' and active and company_id is null and department_id is null) then
 raise exception 'Could not establish GRIT membership'; end if;
 update public.cp_user_directory set auth_user_id=v_user,status='active',
 activated_at=coalesce(activated_at,now()),updated_at=now()
 where id=v_dir;
 insert into public.cp_audit_events(organization_id,actor_id,entity,entity_id,action,detail)
 values(v_org,v_user,'user_directory',v_dir,'admin_verified_activation',
 jsonb_build_object('email','gritsolucoes@gmail.com','auth_verified',true,'method','admin_migration'));
end $$;