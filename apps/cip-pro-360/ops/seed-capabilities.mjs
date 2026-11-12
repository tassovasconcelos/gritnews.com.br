import {AGENTS} from '../agents-data.mjs';
import {CAPABILITIES} from '../agent-capabilities.mjs';
// Prints idempotent draft-only seed SQL. Review it and apply using the database operator.
const rows=AGENTS.flatMap(a=>a.companies.map(company=>({company,agent:a.id,name:a.name,...CAPABILITIES[a.id]})));
console.log(`begin;
do $seed$ declare actor uuid; item jsonb; material uuid; skill_title text;begin
 select d.user_id into actor from public.cip_directory d join public.cip_profiles p on p.user_id=d.user_id where d.email='gritsolucoes@gmail.com' and p.role='superadm' and p.active;
 if actor is null then raise exception 'active_designated_superadmin_required';end if;
 perform set_config('request.jwt.claim.sub',actor::text,true);
 for item in select value from jsonb_array_elements($data$${JSON.stringify(rows)}$data$::jsonb) loop
  select id into material from public.cip_academy_materials where company_id=item->>'company' and agent_id=item->>'agent' and title='Plano avançado v1 · '||(item->>'name') order by created_at desc limit 1;
  if material is null then
   insert into public.cip_academy_materials(company_id,agent_id,kind,title,content,status,review_due,created_by)
   values(item->>'company',item->>'agent','orientation','Plano avançado v1 · '||(item->>'name'),
   'Plano interno CIP de desenvolvimento. Rascunho para revisão humana, não certifica domínio nem treina modelo.'||chr(10)||'Habilidades: '||(select string_agg(value,'; ') from jsonb_array_elements_text(item->'skills'))||chr(10)||'Entradas: '||(select string_agg(value,'; ') from jsonb_array_elements_text(item->'inputs'))||chr(10)||'Entregas: '||(select string_agg(value,'; ') from jsonb_array_elements_text(item->'outputs'))||chr(10)||'Indicador: '||(item->>'metric')||chr(10)||'Caso: '||(item->>'test')||chr(10)||'Limites: '||(item->>'limits'),
   'draft',current_date+90,actor) returning id into material;
  end if;
  skill_title='Habilidade avançada v1 · '||(item->>'name');
  if not exists(select 1 from public.cip_academy_skills where company_id=item->>'company' and agent_id=item->>'agent' and title=skill_title) then
   insert into public.cip_academy_skills(company_id,agent_id,title,instructions,limits,test_case,expected_result,source_ids,status,review_due,created_by)
   values(item->>'company',item->>'agent',skill_title,
   '1. Confirmar empresa, escopo, objetivo e período solicitado. Não ampliar acessos.'||chr(10)||'2. Conferir disponibilidade, origem e atualização das entradas: '||(select string_agg(value,'; ') from jsonb_array_elements_text(item->'inputs'))||chr(10)||'3. Aplicar as competências com hipóteses explícitas: '||(select string_agg(value,'; ') from jsonb_array_elements_text(item->'skills'))||chr(10)||'4. Entregar: '||(select string_agg(value,'; ') from jsonb_array_elements_text(item->'outputs'))||chr(10)||'5. Registrar responsáveis, prazo, evidência e limitações; encaminhar ao especialista responsável e à aprovação humana quando aplicável.'||chr(10)||'6. Medir resultado, receber feedback e propor revisão na Escola. Nenhuma automação ou permissão é concedida por este texto.',
   item->>'limits',item->>'test','O teste deve respeitar os limites e produzir evidência verificável. Medir: '||(item->>'metric')||'. Registrar resultado observado e revisor antes de aprovar.',array[material],'draft',current_date+90,actor);
  end if;
 end loop;
end $seed$;
commit;
select status,count(*) from public.cip_academy_skills where title like 'Habilidade avançada v1 · %' group by status;
`);
