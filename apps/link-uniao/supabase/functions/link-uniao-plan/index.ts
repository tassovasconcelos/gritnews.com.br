import {createClient} from 'npm:@supabase/supabase-js@2.111.0';
import {initialPlan,cleanSave,economics} from './domain.ts';
const url=Deno.env.get('SUPABASE_URL')!;
const secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Object.values(JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}'))[0] as string;
const db=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
const campaign='link-uniao-2026';
const allowed=['https://uniao.gritnews.com.br','http://localhost:3000','http://localhost:5173'];
const headers=(origin:string|null)=>({'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin','Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'POST,OPTIONS',...(allowed.includes(origin||'')?{'Access-Control-Allow-Origin':origin!}:{})});
const reply=(body:unknown,status:number,origin:string|null)=>new Response(JSON.stringify(body),{status,headers:headers(origin)});
async function authorized(req:Request) {
  const authorization=req.headers.get('Authorization')||'';
  if(!authorization.startsWith('Bearer '))return null;
  const token=authorization.slice(7);
  const local=await db.auth.getUser(token);
  let actor=local.data.user?.id;
  if(local.error||!actor){
    const rota=createClient('https://pvldaqxblirmgoixselx.supabase.co','sb_publishable_FWtxwRlLvr3NiPmimRq9gw_3VIJ3lxh',{auth:{persistSession:false,autoRefreshToken:false}});
    const r=await rota.auth.getUser(token);
    if(r.error||r.data.user?.id!=='5fdd73cd-5e23-4773-9fad-940c3dcf545e'||r.data.user.email!=='gritsolucoes@gmail.com'||!r.data.user.email_confirmed_at)return null;
    actor='cb24c172-6faf-4dcf-9a44-98864b4aba34';
  }
  const {data,error}=await db.from('lu_survey_admins').select('user_id').eq('user_id',actor).maybeSingle();
  return !error&&data?actor:null;
}
async function state(){const {data,error}=await db.from('lu_plan_state').select('*').eq('campaign_id',campaign).maybeSingle();if(error)throw error;return data||{version:0,document:initialPlan()};}
const requireText=(v:any)=>typeof v==='string'&&v.trim().length>=5&&v.length<=2000;
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get('Origin');
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:headers(origin)});
 if(req.method!=='POST')return reply({ok:false,error:'Método não permitido'},405,origin);
 try{
  const actor=await authorized(req);
  if(!actor)return reply({ok:false,error:'Acesso GRIT não autorizado'},403,origin);
  const raw=await req.text();if(raw.length>180000)return reply({ok:false,error:'Plano muito extenso'},413,origin);
  const p=JSON.parse(raw),s=await state();
  if(p.action==='load'){
    const {data:audit,error}=await db.from('lu_plan_audit').select('version,actor,operation,reason,created_at').eq('campaign_id',campaign).order('version',{ascending:false}).limit(100);
    if(error)throw error;
    const r=await fetch(url+'/functions/v1/link-uniao-surveys',{method:'POST',headers:{'Content-Type':'application/json','Authorization':req.headers.get('Authorization')!},body:JSON.stringify({action:'admin_summary'})});
    const summary=await r.json();if(!r.ok||!summary.ok)throw Error('Diagnóstico indisponível');
    // Only group indicators, never staff free text, identities or area slices.
    const diagnostic={staff:summary.staff,staffCount:summary.staffCount,owners:(summary.ownerResults||[]).map((o:any)=>({person:o.person,completed_at:o.completed_at,answers:Object.fromEntries(['active','mrr','churn','installs','priority','weakness','checklist','success','loss','topthree','training','cooperation'].map(k=>[k,o.answers?.[k]??'Não informado']))})),asOf:new Date().toISOString()};
    return reply({ok:true,...s,audit,diagnostic,simulation:economics(s.document.finance)},200,origin);
  }
  if(p.action==='version'){
    const {data,error}=await db.from('lu_plan_audit').select('*').eq('campaign_id',campaign).eq('version',p.version).single();
    if(error)return reply({ok:false,error:'Versão não encontrada'},404,origin);
    return reply({ok:true,version:data},200,origin);
  }
  if(!Number.isInteger(p.version)||p.version!==s.version)return reply({ok:false,error:'Outra edição foi salva. Recarregue para conciliar as alterações.'},409,origin);
  if(!requireText(p.reason))return reply({ok:false,error:'Descreva o motivo da alteração (5 a 2000 caracteres)'},400,origin);
  let d=structuredClone(s.document);
  try{
    if(p.action==='save')d=cleanSave(p.document,d);
    else if(p.action==='verify_event'){
      const e=d.events.find((e:any)=>e.id===p.eventId),rule=d.rules.find((r:any)=>r.id===e?.ruleId);
      if(!e||!rule||!requireText(e.evidence)||!requireText(e.beneficiary)||!p.confirm)throw Error('Informe beneficiário, evidência e confirme a verificação');
      const elapsed=(Date.now()-Date.parse(e.date+'T00:00:00Z'))/86400000;
      if(elapsed<rule.windowDays)throw Error('Janela de qualidade/retenção ainda não cumprida');
      if(e.verification)throw Error('Evento já verificado');
      e.verification={actor,at:new Date().toISOString(),reward:rule.reward,reason:p.reason};
    }else if(p.action==='approve_terms'){
      const f=d.finance;
      if(!p.confirm||![f.clientSigner,f.gritSigner,f.agreementEvidence,f.method].every(requireText))throw Error('Registre os dois signatários e a evidência do acordo formal assinado');
      d.approvals.terms={actor,at:new Date().toISOString(),percent:f.percent,evidence:f.agreementEvidence,clientSigner:f.clientSigner,gritSigner:f.gritSigner};
    }else if(p.action==='audit_finance'){
      const f=d.finance;
      if(!p.confirm||![f.baselinePeriod,f.currentPeriod,f.evidence,f.auditor,f.method].every(requireText))throw Error('Registre períodos comparáveis, método, auditor e evidência da conciliação');
      d.approvals.audit={actor,at:new Date().toISOString(),evidence:f.evidence,auditor:f.auditor,...economics(f)};
    }else throw Error('Operação inválida');
  }catch(e){return reply({ok:false,error:(e as Error).message},400,origin);}
  const {data:version,error}=await db.rpc('lu_plan_commit',{p_campaign:campaign,p_expected:p.version,p_document:d,p_actor:actor,p_operation:p.action,p_reason:p.reason});
  if(error){if(error.code==='40001')return reply({ok:false,error:'Conflito de versão. Recarregue o plano.'},409,origin);throw error;}
  return reply({ok:true,version,simulation:economics(d.finance)},200,origin);
 }catch(e){console.error('plan_error',e instanceof Error?e.message:'unknown');return reply({ok:false,error:'Não foi possível processar o plano. Tente novamente.'},503,origin);}
});
