import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createCouncilHandler} from './handler.mjs';

const company='shopping_prohospital';
const accessBody={action:'learning',company,agent:'compras',query:'demanda'};
const request=body=>new Request('https://test.invalid',{method:'POST',body:JSON.stringify(body)});

test('Hermes retrieves agent-specific reviewed lessons and traceable sources without using AI',async()=>{
 const calls=[];
 const handler=createCouncilHandler({
  createClient:()=>({
   auth:{getUser:async()=>({data:{user:{id:'manager'}}})},
   from(name){
    assert.equal(name,'cip_academy_materials');
    const chain={
     select:()=>chain,eq:(column,value)=>{
      if(column==='company_id')assert.equal(value,company);
      if(column==='agent_id')assert.equal(value,'compras');
      return chain;
     },
     gte:()=>chain,order:()=>chain,
     limit:async()=>({data:[{id:'o1',title:'Vigente',content:'Orientação revisada'},{id:'o2',title:'Antiga',content:'Substituída'}]}),
     in:async()=>({data:[{supersedes_id:'o2'}]})
    };
    return chain;
   },
   rpc:async(name,args)=>{
    calls.push(name);
    assert.equal(args.p_company,company);
    if(name==='cip_agent_can_manage')return {data:true};
    if(name==='cip_agent_skills')return {data:[
     {id:'s1',agent_id:'compras',title:'Reposição',instructions:'Verifique demanda',limits:'Requer aprovação',source_ids:['m1']},
     {id:'s2',agent_id:'precos',title:'Outro especialista'}
    ]};
    assert.equal(name,'cip_academy_search');
    assert.equal(args.p_agent,'compras');
    return {data:args.p_query?[]:[{material_id:'m1',extraction_id:'e1',title:'Histórico aprovado',locator:'Aba 2',content:'Dados agregados'}]};
   }
  }),
  generate:()=>assert.fail('no model call')
 });
 const response=await handler(request(accessBody));
 assert.equal(response.status,200);
 assert.equal(response.headers.get('Cache-Control'),'no-store');
 const result=await response.json();
 assert.deepEqual(result.orientations.map(x=>x.material_id),['o1']);
 assert.deepEqual(result.skills.map(x=>x.id),['s1']);
 assert.deepEqual(result.references.map(x=>[x.extraction_id,x.locator]),[['e1','Aba 2']]);
 assert.deepEqual(calls,['cip_agent_can_manage','cip_agent_skills','cip_academy_search','cip_academy_search','cip_agent_can_manage']);
});

test('rejects callers without management access and specialists outside the company',async()=>{
 const handler=createCouncilHandler({
  createClient:()=>({
   auth:{getUser:async()=>({data:{user:{id:'member'}}})},
   rpc:async(name)=>{
    assert.equal(name,'cip_agent_can_manage');
    return {data:false};
   }
  })
 });
 assert.equal((await handler(request(accessBody))).status,403);
 assert.equal((await handler(request({...accessBody,agent:'b2g'}))).status,400);
});
