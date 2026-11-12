begin;
create function public.cip_academy_search(p_company text,p_query text default '',p_agent text default null,p_limit integer default 12)
returns table(material_id uuid,title text,extraction_id uuid,locator text,content text,created_at timestamptz)
language sql stable set search_path='' as $$
 select m.id,m.title,e.id,c.value->>'locator',c.value->>'text',e.created_at
 from public.cip_academy_materials m join public.cip_academy_extractions e on e.id=m.approved_extraction_id and e.company_id=m.company_id and e.material_id=m.id
 cross join lateral jsonb_array_elements(e.chunks) c(value)
 where m.company_id=p_company and public.cip_can_access(m.company_id) and m.status='approved' and m.review_due>=current_date and m.ingestion_status='ready' and e.complete
 and (p_agent is null or m.agent_id=p_agent)
 and not exists(select 1 from public.cip_academy_materials r where r.supersedes_id=m.id and r.status='approved' and r.review_due>=current_date)
 and (coalesce(p_query,'')='' or to_tsvector('portuguese',m.title||' '||(c.value->>'text')) @@ websearch_to_tsquery('portuguese',left(p_query,300)))
 order by case when coalesce(p_query,'')='' then 0 else ts_rank(to_tsvector('portuguese',m.title||' '||(c.value->>'text')),websearch_to_tsquery('portuguese',left(p_query,300))) end desc,e.created_at desc,(c.value->>'index')::int
 limit greatest(1,least(coalesce(p_limit,12),20));
$$;
revoke all on function public.cip_academy_search(text,text,text,integer) from public,anon;
grant execute on function public.cip_academy_search(text,text,text,integer) to authenticated;
commit;
