export const SOURCE_VIEW='st.TASS_PRODUTOS_TOMBAMENTOS_LOCACAO';
export function validateProbe(value,now=Date.now()){
 if(!value||value.schema!=='cip-procfit-probe-v1'||value.source_view!==SOURCE_VIEW||value.interval_seconds!==600)throw Error('invalid_probe');
 const at=Date.parse(value.captured_at);if(!Number.isFinite(at)||Math.abs(now-at)>300000)throw Error('expired_probe');
 if(!['contract_pending','mapping_required','source_error'].includes(value.status))throw Error('invalid_status');
 if(!Array.isArray(value.columns)||value.columns.length>400||new Set(value.columns).size!==value.columns.length||value.columns.some(c=>typeof c!=='string'||!/^[A-Za-z_][A-Za-z0-9_ ]{0,127}$/.test(c)))throw Error('invalid_columns');
 if(value.status==='source_error'&&value.columns.length)throw Error('invalid_error_probe');
 return {schema:value.schema,source_view:SOURCE_VIEW,captured_at:new Date(at).toISOString(),interval_seconds:600,status:value.status,columns:value.columns,transport:'direct_cip',business_data_received:false};
}
export async function verifyProbe(raw,signature,publicKey){
 if(typeof signature!=='string'||!/^[A-Za-z0-9+/]{86}==$/.test(signature))return false;
 try{const decode=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));const key=await crypto.subtle.importKey('spki',decode(publicKey),{name:'Ed25519'},false,['verify']);return await crypto.subtle.verify('Ed25519',key,decode(signature),new TextEncoder().encode(raw));}catch{return false;}
}
