import { createClient } from 'npm:@supabase/supabase-js@2.111.0';
const url=Deno.env.get('SUPABASE_URL')!;
const secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Object.values(JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}'))[0] as string;
if(!url||!secret) throw new Error('Supabase credentials not configured');
const db=createClient(url,secret,{auth:{autoRefreshToken:false,persistSession:false}});
const campaignId='link-uniao-2026';
const domains=['https://uniao.gritnews.com.br','https://gritnews.com.br','https://www.gritnews.com.br','http://localhost:5173','http://localhost:3000'];
const keys=['A1','A2','A3','B1','B2','B3','C1','C2','C3','D1','D2','D3','E1','E2','E3','F1','F2','F3'];
const areas=['tecnico','atendimento','financeiro','comercial','misto','nao_informado'];
const cors=(origin:string|null)=>({...((origin&&domains.includes(origin))?{'Access-Control-Allow-Origin':origin}:{}),'Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'authorization,apikey,content-type','Vary':'Origin','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});
const resp=(obj:unknown,status=200,origin:string|null=null)=>new Response(JSON.stringify(obj),{status,headers:{'Content-Type':'application/json; charset=utf-8',...cors(origin)}});
const fail=(reason:string,status=400,origin:string|null=null)=>resp({ok:false,error:reason},status,origin);
const isObj=(v:unknown)=>Boolean(v&&typeof v==='object'&&!Array.isArray(v));
const text=(v:unknown,max=120)=>typeof v==='string'?v.trim().slice(0,max):'';
const score=(v:unknown,max=10)=>Number.isInteger(v)&&Number(v)>=0&&Number(v)<=max?Number(v):null;
const hash=async(raw:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw)))).map(v=>v.toString(16).padStart(2,'0')).join('');
const makeToken=()=>{const b=crypto.getRandomValues(new Uint8Array(32));return Array.from(b).map(x=>x.toString(16).padStart(2,'0')).join('')};
const campaign=async()=>{const {data,error}=await db.from('lu_survey_campaigns').select('*').eq('id',campaignId).single();if(error)throw error;return data};
const active=(c:any)=>Boolean(c.is_open&&c.privacy_reviewed&&c.privacy_contact&&new Date(c.expires_at).getTime()>Date.now());
async function admin(req:Request){
const h=req.headers.get('Authorization')||'';
if(!h.startsWith('Bearer '))return false;
const jwt=h.slice(7);
// Validate the existing RotaPro superadmin with its issuing Auth service.
const rota=createClient('https://pvldaqxblirmgoixselx.supabase.co','sb_publishable_FWtxwRlLvr3NiPmimRq9gw_3VIJ3lxh',{auth:{autoRefreshToken:false,persistSession:false}});
const {data,error}=await rota.auth.getUser(jwt);
let adminId:string|undefined;
if(!error&&data.user?.id==='5fdd73cd-5e23-4773-9fad-940c3dcf545e'&&data.user.email?.toLowerCase()==='gritsolucoes@gmail.com'&&data.user.email_confirmed_at){
  adminId='cb24c172-6faf-4dcf-9a44-98864b4aba34';
}else{
  const local=await db.auth.getUser(jwt);
  if(local.error||!local.data.user?.id)return false;
  adminId=local.data.user.id;
}
const {data:adminRow}=await db.from('lu_survey_admins').select('user_id').eq('user_id',adminId).maybeSingle();
return Boolean(adminRow);
}
async function invite(token:unknown) {
const t=text(token,128);
if(!/^[a-f0-9]{64}$/.test(t))return null;
const {data}=await db.from('lu_survey_owner_invites').select('*').eq('campaign_id',campaignId).eq('token_hash',await hash(t)).maybeSingle();
if(!data||data.status==='revogado'||new Date(data.expires_at).getTime()<Date.now())return null;
return data;
}
function cleanRatings(a:unknown){const r:Record<string,number>={};if(isObj(a))for(const k of keys){const n=score((a as any)[k],5);if(n!==null&&n>=1)r[k]=n;}return r;}
function aggregate(items:any[]){
const n=items.length;const groups:Record<string,any>={};
for(const letter of 'ABCDEF'){const ks=keys.filter(k=>k.startsWith(letter));const vals=items.flatMap(a=>ks.map(k=>a.ratings?.[k]).filter((v:any)=>Number.isInteger(v)&&v>=1&&v<=5));groups[letter]={answers:vals.length,value:vals.length?Math.round((vals.reduce((s:number,x:number)=>s+x,0)/vals.length-1)*25):null};}
const enps=items.map(a=>a.enps).filter(v=>v!==null&&v!==undefined);
const meanMot=items.map(a=>a.motivation).filter(v=>v!==null&&v!==undefined);
return {n,radar:groups,enps:enps.length?Math.round(100*(enps.filter(x=>x>=9).length-enps.filter(x=>x<=6).length)/enps.length):null,enpsN:enps.length,motivation:meanMot.length?Math.round(meanMot.reduce((s,x)=>s+x,0)/meanMot.length*10)/10:null,motivationN:meanMot.length};
}
Deno.serve(async(req:Request)=>{
const origin=req.headers.get('Origin');
if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors(origin)});
if(req.method==='GET'){
try {const c=await campaign();return resp({ok:true,version:'1.0',open:active(c),privacyContact:c.privacy_contact,expiresAt:c.expires_at},200,origin)}
catch{return fail('Campanha não encontrada',503,origin)}
}
if(req.method!=='POST')return fail('Método não permitido',405,origin);
let payload:any;
try{const raw=await req.text();if(raw.length>40000)return fail('Resposta muito extensa',413,origin);payload=JSON.parse(raw);if(!isObj(payload))throw Error('invalid')}
catch{return fail('Envie JSON válido',400,origin)}
try{
const action=text(payload.action,48);
if(action.startsWith('admin_')){
if(!await admin(req))return fail('Acesso não autorizado',403,origin);
if(action==='admin_status'){
const c=await campaign();
const {data:invites}=await db.from('lu_survey_owner_invites').select('person,status,created_at,completed_at').eq('campaign_id',campaignId).order('created_at',{ascending:false});
const {count}=await db.from('lu_survey_staff_answers').select('id',{head:true,count:'exact'}).eq('campaign_id',campaignId);
return resp({ok:true,campaign:c,invites,count},200,origin);
}
if(action==='admin_config'){
const change:Record<string,unknown>={updated_at:new Date().toISOString()};
if(typeof payload.privacy_contact==='string')change.privacy_contact=text(payload.privacy_contact,180);
if(typeof payload.is_open==='boolean')change.is_open=payload.is_open;
if(typeof payload.privacy_reviewed==='boolean')change.privacy_reviewed=payload.privacy_reviewed;
if(Number.isInteger(payload.staff_count)&&payload.staff_count>=0&&payload.staff_count<=10000)change.staff_count=payload.staff_count;
if(typeof payload.expires_at==='string'&&/^\\d{4}-\\d{2}-\\d{2}/.test(payload.expires_at))change.expires_at=payload.expires_at;
const c=await campaign();
if(change.is_open===true&&!((change.privacy_reviewed??c.privacy_reviewed)&&(change.privacy_contact??c.privacy_contact)))return fail('Informe contato de privacidade e revise o aviso antes de abrir',400,origin);
const {data,error}=await db.from('lu_survey_campaigns').update(change).eq('id',campaignId).select().single();
if(error)throw error;return resp({ok:true,campaign:data},200,origin);
}
if(action==='admin_generate_invite'){
const person=text(payload.person,20);
if(!['Naldo','Carla'].includes(person))return fail('Proprietário inválido',400,origin);
const {error:revokeErr}=await db.from('lu_survey_owner_invites').update({status:'revogado'}).eq('campaign_id',campaignId).eq('person',person).in('status',['pendente','rascunho','concluido']);
if(revokeErr)throw revokeErr;
const token=makeToken();const c=await campaign();
const {error}=await db.from('lu_survey_owner_invites').insert({campaign_id:campaignId,person,token_hash:await hash(token),expires_at:c.expires_at});
if(error)throw error;
return resp({ok:true,person,token,notice:'Copie agora: o token não poderá ser recuperado; gere outro se necessário'},200,origin);
}
if(action==='admin_summary'){
const {data:staff,error}=await db.from('lu_survey_staff_answers').select('area,ratings,enps,motivation').eq('campaign_id',campaignId).limit(10000);
if(error)throw error;
const all=staff||[];
const {data:invites}=await db.from('lu_survey_owner_invites').select('person,status,answers,completed_at').eq('campaign_id',campaignId).eq('status','concluido');
const c=await campaign();
const total=all.length;
const safe=total>=5;
const safeGroups:Record<string,any>={};
if(total>=10){
for(const ar of areas){const set=all.filter(x=>x.area===ar);if(set.length>=5&&total-set.length>=5)safeGroups[ar]=aggregate(set)}
}
return resp({ok:true,staffCount:total,staff:safe?aggregate(all):null,staffPrivacy:safe?'': 'Aguardando ao menos cinco respostas para exibir indicadores.',groups:safeGroups,ownerResults:invites||[],expectedStaff:c.staff_count,respondedOwners:(invites||[]).length},200,origin);
}
return fail('Operação inválida',400,origin);
}
if(action==='owner_load'||action==='owner_save'||action==='owner_submit'){
const c=await campaign();if(!active(c))return fail('Pesquisa ainda não está aberta',403,origin);
const i=await invite(payload.token);if(!i)return fail('Convite inválido ou vencido',403,origin);
if(action==='owner_load')return resp({ok:true,person:i.person,status:i.status,draft:i.draft},200,origin);
if(i.status==='concluido')return fail('Pesquisa já concluída; obrigado',409,origin);
if(!isObj(payload.answers)||JSON.stringify(payload.answers).length>28000)return fail('Respostas inválidas',400,origin);
const answers=payload.answers;
if(action==='owner_save'){
const {error}=await db.from('lu_survey_owner_invites').update({draft:answers,status:'rascunho'}).eq('id',i.id).neq('status','concluido');
if(error)throw error;return resp({ok:true,saved:true},200,origin);
}
if(payload.consent!==true)return fail('Confirme a ciência do aviso de privacidade antes de concluir',400,origin);
if(!text((answers as any).priority,200))return fail('Informe a principal prioridade nos próximos 90 dias',400,origin);
const {error}=await db.from('lu_survey_owner_invites').update({answers,draft:{},status:'concluido',completed_at:new Date().toISOString()}).eq('id',i.id).neq('status','concluido');
if(error)throw error;return resp({ok:true,completed:true,person:i.person},200,origin);
}
if(action==='staff_submit'){
if(payload.consent!==true)return fail('A participação deve ser voluntária e confirmada antes do envio',400,origin);
const c=await campaign();if(!active(c))return fail('Pesquisa ainda não está aberta',403,origin);
const ratings=cleanRatings(payload.ratings);
if(Object.keys(ratings).length<6)return fail('Responda pelo menos seis afirmações, para permitir análise estatística',400,origin);
const area=areas.includes(payload.area)?payload.area:'nao_informado';
const special=isObj(payload.special)?payload.special:{};
const cleanSpecial:any={};for(const [k,v] of Object.entries(special)){if(k.length<=40&&(typeof v==='string'||Number.isInteger(v)))cleanSpecial[k]=String(v).slice(0,300);}
const {error}=await db.from('lu_survey_staff_answers').insert({campaign_id:campaignId,area,ratings,special:cleanSpecial,enps:score(payload.enps),motivation:score(payload.motivation),comment_good:text(payload.comment_good,700),comment_change:text(payload.comment_change,700)});
if(error)throw error;return resp({ok:true,submitted:true},200,origin);
}
return fail('Operação inválida',400,origin);
}catch(e){console.error('link_uniao_surveys_error',e instanceof Error?(e.name+': '+e.message+' '+(e.stack||'').slice(0,300)):'unknown');return fail('Falha temporária. Tente novamente.',503,origin)}
});
