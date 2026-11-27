import {COMPANIES,agentsFor} from '../agents-data.mjs';

export function validLearningRequest(request) {
  return !!request && Object.hasOwn(COMPANIES,request.company) &&
    agentsFor([request.company]).some(agent => agent.id === request.agent) &&
    (request.query === undefined || typeof request.query === 'string' && request.query.length <= 300);
}

async function approvedOrientations(client,company,agent,limit) {
  const today=new Date().toISOString().slice(0,10);
  const result=await client.from('cip_academy_materials').select('id,title,content')
    .eq('company_id',company).eq('agent_id',agent).eq('kind','orientation')
    .eq('status','approved').eq('ingestion_status','not_required').gte('review_due',today)
    .order('reviewed_at',{ascending:false}).order('id').limit(limit);
  if(result.error || !Array.isArray(result.data)) throw Error('knowledge_unavailable');
  if(!result.data.length) return [];
  const newer=await client.from('cip_academy_materials').select('supersedes_id')
    .eq('company_id',company).eq('status','approved').gte('review_due',today)
    .in('supersedes_id',result.data.map(row=>row.id));
  if(newer.error || !Array.isArray(newer.data)) throw Error('knowledge_unavailable');
  const superseded=new Set(newer.data.map(row=>row.supersedes_id));
  return result.data.filter(row=>!superseded.has(row.id)).map(row=>({
    material_id:row.id,title:row.title,excerpt:row.content.slice(0,1200)
  }));
}

export async function loadLessons(client,company,agentIds,query='',sourceLimit=4,skillLimit=5) {
  const skills=await client.rpc('cip_agent_skills',{p_company:company});
  if(skills.error || !Array.isArray(skills.data)) throw Error('knowledge_unavailable');
  return Promise.all(agentIds.map(async agent => {
    const args={p_company:company,p_agent:agent,p_query:query.slice(0,300),p_limit:sourceLimit};
    let sources=await client.rpc('cip_academy_search',args);
    if(!sources.error && Array.isArray(sources.data) && !sources.data.length && args.p_query.trim()) {
      sources=await client.rpc('cip_academy_search',{...args,p_query:''});
    }
    if(sources.error || !Array.isArray(sources.data)) throw Error('knowledge_unavailable');
    return {
      agent,
      skills:skills.data.filter(skill=>skill.agent_id===agent).slice(0,skillLimit).map(skill=>({
        id:skill.id,title:skill.title,instructions:skill.instructions.slice(0,1200),
        limits:skill.limits.slice(0,600),source_ids:skill.source_ids
      })),
      orientations:await approvedOrientations(client,company,agent,sourceLimit),
      references:sources.data.slice(0,sourceLimit).map(source=>({
        material_id:source.material_id,extraction_id:source.extraction_id,
        title:source.title,locator:source.locator,excerpt:source.content.slice(0,1200)
      }))
    };
  }));
}
