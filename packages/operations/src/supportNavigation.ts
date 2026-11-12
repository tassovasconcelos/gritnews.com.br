import {withOperationDeadline} from './request.ts';
import type {OperationApp} from './SettingsPanel';

export const operationPlatforms = {
  'meu-espetinho': {name:'Meu Espetinho',origin:'https://meuespetinho.gritnews.com.br',table:'tenants'},
  'sr-padeiro': {name:'Sr. Padeiro',origin:'https://srpadeiro.gritnews.com.br',table:'srp_organizations'},
} as const;
export const operationAreas = [
  ['home','Visão geral'],['products','Produtos e importação'],['stock','Estoque'],
  ['purchases','Compras'],['settings','Logo, recibo e impressora'],['team','Usuários e permissões'],['sales','Atendimento e vendas'],
] as const;
export type OperationArea = typeof operationAreas[number][0];
export type OperationClient = {app:OperationApp;id:string;name:string;status:string};
const sections:Record<OperationApp,Record<OperationArea,string>> = {
  'meu-espetinho':{home:'dashboard',products:'products',stock:'products',purchases:'shopping',settings:'settings',team:'users',sales:'sale'},
  'sr-padeiro':{home:'home',products:'products',stock:'stock',purchases:'purchases',settings:'more',team:'more',sales:'sell'},
};
export function operationSection(app:OperationApp,section:string|null):string|null {
  // Only existing screens can be selected; a URL never grants a role.
  if(app==='sr-padeiro'&&['pos','cash','sales','customers','results','supply','expenses','consolidated'].includes(section||''))return section;
  if(section==='settings')return sections[app].settings;
  return Object.values(sections[app]).includes(section||'')?section:null;
}
export function supportOperationUrl(app:OperationApp,id:string,area:OperationArea='home',origin:string=operationPlatforms[app]?.origin):string {
  if(!operationPlatforms[app]||!sections[app][area]||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))throw new Error('invalid_operation');
  const url=new URL('/app',origin);
  url.searchParams.set(app==='meu-espetinho'?'support_tenant':'support_org',id);
  url.searchParams.set('section',sections[app][area]);
  return url.href;
}
export async function startOperationSupport(client:any,app:OperationApp,id:string,area:OperationArea,reason:string,origin?:string) {
  const target=supportOperationUrl(app,id,area,origin);
  if(reason.trim().length<3||reason.trim().length>240)throw new Error('invalid_reason');
  const r:any=await withOperationDeadline(client.rpc('ops_start_support',{a:app,s:id,reason:`${operationAreas.find(a=>a[0]===area)?.[1]}: ${reason.trim()}`}));
  if(r.error||!r.data?.expires_at||Date.parse(r.data.expires_at)<=Date.now()||!Number.isFinite(Date.parse(r.data.expires_at)))throw new Error('support_unavailable');
  return target;
}
export async function loadOperationClients(client:any,product:'all'|OperationApp,search:string,page:number) {
  const auth=await client.auth.getUser();
  if(auth.error||!auth.data?.user)throw new Error('forbidden');
  const admin=await client.from('admin_users').select('active,role').eq('user_id',auth.data.user.id).maybeSingle();
  if(admin.error||!admin.data?.active||admin.data.role!=='superadmin')throw new Error('forbidden');
  const apps=(Object.keys(operationPlatforms) as OperationApp[]).filter(a=>product==='all'||product===a);
  const results=await Promise.all(apps.map(async app=>{
    const config=operationPlatforms[app];
    let q=client.from(config.table).select(app==='meu-espetinho'?'id,name,setup_status':'id,name,environment').order('name').order('id');
    if(search.trim())q=q.ilike('name',`%${search.trim().replace(/[\\%_]/g,'\\$&')}%`);
    const r=await q.range(page*30,page*30+29);
    if(r.error)throw r.error;
    return {more:r.data.length===30,rows:r.data.map((c:any)=>({app,id:c.id,name:c.name,status:app==='meu-espetinho'?c.setup_status:c.environment}))};
  }));
  return {rows:results.flatMap(r=>r.rows) as OperationClient[],more:results.some(r=>r.more)};
}

