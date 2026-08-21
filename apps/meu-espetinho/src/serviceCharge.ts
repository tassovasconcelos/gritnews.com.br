import { supabase } from './lib/supabase';

export type ServiceChargeConfig={enabled:boolean;percent:number};

export async function loadServiceCharge(tenantId:string):Promise<ServiceChargeConfig>{
 if(!supabase)return{enabled:false,percent:10};
 const{data,error}=await supabase.from('tenants').select('service_charge_enabled,service_charge_percent').eq('id',tenantId).single();
 if(error||!data)return{enabled:false,percent:10};
 return{enabled:Boolean((data as any).service_charge_enabled),percent:Number((data as any).service_charge_percent||10)};
}

export async function saveServiceCharge(tenantId:string,config:ServiceChargeConfig){
 if(!supabase)return false;
 const percent=Math.min(30,Math.max(0,Number(config.percent)||0));
 const{error}=await supabase.from('tenants').update({service_charge_enabled:config.enabled,service_charge_percent:percent}).eq('id',tenantId);
 return !error;
}

export async function saveOrderServiceSnapshot(tenantId:string,orderId:string,serviceFee:number,servicePercent:number){
 if(!supabase)return false;
 const{error}=await supabase.from('orders').update({service_fee:serviceFee,service_percent:servicePercent}).eq('tenant_id',tenantId).eq('id',orderId);
 return !error;
}
