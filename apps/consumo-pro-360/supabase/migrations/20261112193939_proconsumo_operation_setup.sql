create or replace function public.cp_configure_operation(p_company uuid,p_approver uuid,p_target numeric) returns void
language plpgsql security definer set search_path='' as $$
declare c public.cp_companies%rowtype;
begin
 select * into c from public.cp_companies where id=p_company for update;
 if not private.cp_has_role(p_company,array['group_admin','grit_superadmin']) then raise exception 'Sem permissão administrativa para vincular o responsável'; end if;
 if not private.cp_has_role(p_company,array['group_admin']) and p_target is distinct from c.savings_target_percent then raise exception 'A meta financeira é exclusiva da administração do Grupo';end if;
 if p_target is not null and (p_target<0 or p_target>100) then raise exception 'Meta deve estar entre 0 e 100'; end if;
 if p_approver is not null and not exists(select 1 from public.cp_memberships m
  where m.organization_id=c.organization_id and m.user_id=p_approver and m.active
   and (m.company_id is null or m.company_id=c.id) and m.department_id is null
   and m.role in ('manager','director','group_admin')) then
  raise exception 'Responsável precisa de uma conta ativa com alçada para todos os destinos desta operação';
 end if;
 update public.cp_companies set requisition_approver_user_id=p_approver,savings_target_percent=p_target where id=p_company;
 insert into public.cp_audit_events(organization_id,company_id,actor_id,entity,entity_id,action,detail)
 values(c.organization_id,c.id,auth.uid(),'operation',c.id,'approver_configured',jsonb_build_object('approver',p_approver,'savings_target_percent',p_target));
end $$;
revoke all on function public.cp_configure_operation(uuid,uuid,numeric) from public,anon;
grant execute on function public.cp_configure_operation(uuid,uuid,numeric) to authenticated;

