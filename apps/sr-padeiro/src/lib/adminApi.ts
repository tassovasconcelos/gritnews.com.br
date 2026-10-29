import { supabase } from './supabase';
export async function adminAction<T>(action:string,orgId:string|null=null,payload:Record<string,unknown>={}):Promise<T>{
  const {data,error}=await supabase.rpc('srp_admin_console',{p_action:action,p_org_id:orgId,p_payload:payload});
  if(error)throw new Error(error.code==='PGRST202'?'A atualização do banco administrativo ainda não foi aplicada.':error.message);
  return data as T;
}
export const money=(v:number)=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
export const dateTime=(v:string|null|undefined)=>v?new Date(v).toLocaleString('pt-BR'):'—';
export const roleNames:Record<string,string>={owner:'Proprietário',manager:'Gestão e atendimento',cashier:'Caixa e atendimento',stockist:'Estoque e produtos',viewer:'Somente consulta'};
export const modeNames:Record<string,string>={trial:'Teste',active:'Liberação administrativa',barter:'Permuta',suspended:'Suspenso',cancelled:'Encerrado'};
export type Organization={id:string;name:string;phone:string|null;contact_email:string|null;slug:string|null;logo_url:string|null;primary_color:string|null;environment:'homologation'|'production';active:boolean;created_at:string;products_count:number;members_count:number;revenue_30d:number;access_mode:string|null;trial_ends_at:string|null};
export type Product={id:string;name:string;category_id:string|null;variant:string;unit:string;sale_price:number;cost_price:number|null;barcode:string|null;external_key:string|null;fulfillment:string;catalog_notes:string;active:boolean};
export type Detail={organization:Organization;access:{access_mode:string;trial_ends_at:string|null;barter_until:string|null;notes:string|null}|null;stores:{id:string;name:string}[];members:{user_id:string;email:string;role:string;active:boolean;operator_names:string[];confirmed:boolean}[];products:Product[];categories:{id:string;name:string}[];inventory:{store_id:string;product_id:string;quantity:number;minimum_quantity:number}[];cash:{id:string;status:string;opened_at:string;opening_amount:number;counted_amount:number|null;expected_amount:number|null}[];sales:{id:string;total:number;status:string;created_at:string}[];events:{event_name:string;metadata:Record<string,unknown>;created_at:string}[]};
