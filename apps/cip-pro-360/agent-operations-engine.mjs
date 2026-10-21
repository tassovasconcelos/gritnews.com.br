// Shared, strict contract for the advisory council. Values and execution stay outside the model.
export const COUNCIL_MODEL='gpt-4.1-mini-2025-04-14';
export const MISSION_STATES={suggested:'Proposta do agente',accepted:'Meta definida',in_progress:'Em acompanhamento',measured:'Resultado informado',dismissed:'Encerrada sem adoção'};
export const METRICS={itens_conferidos:'Itens conferidos',unidades_movimentadas:'Unidades movimentadas',unidades_vendidas:'Unidades vendidas',contribuicao_informada:'Contribuição informada (R$)'};
export function validCouncilRequest(b){return !!b&&['shopping_prohospital','distribuidora_prohospital'].includes(b.company)&&b.consent===true&&typeof b.objective==='string'&&b.objective.trim().length>=10&&b.objective.length<=1000;}
export function validateCouncil(p,agents){
 const str=(x,max=1200)=>typeof x==='string'&&x.trim().length>0&&x.length<=max;
 return !!p&&str(p.summary,1800)&&Array.isArray(p.priorities)&&p.priorities.length>=1&&p.priorities.length<=6&&p.priorities.every(x=>agents.includes(x.agent)&&str(x.diagnosis)&&str(x.next_step)&&str(x.measure)&&str(x.lesson)&&Array.isArray(x.dependencies)&&x.dependencies.length<=5&&x.dependencies.every(a=>agents.includes(a)))&&Array.isArray(p.questions)&&p.questions.length<=6&&p.questions.every(x=>str(x,500));
}
export function councilSchema(agents){
 const text={type:'string'},arr=(items,maxItems,minItems=0)=>({type:'array',items,minItems,maxItems}),obj=properties=>({type:'object',properties,required:Object.keys(properties),additionalProperties:false});
 return obj({summary:text,priorities:arr(obj({agent:{type:'string',enum:agents},diagnosis:text,next_step:text,measure:text,lesson:text,dependencies:arr({type:'string',enum:agents},5)}),6,1),questions:arr(text,6)});
}
export function measurement(m){
 if(m?.state!=='measured'||m?.review_state!=='approved'||!Number.isFinite(Number(m.target))||Number(m.target)<=0||m.observed===null||!Number.isFinite(Number(m.observed))||Number(m.observed)<0)return null;
 return {attainment_pct:100*Number(m.observed)/Number(m.target),basis:'Resultado informado e revisado pelo time; sem atribuição causal automática.'};
}
