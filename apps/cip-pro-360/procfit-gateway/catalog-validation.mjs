export const PRODUCT_FIELDS=['COD_PRODUTO','NOME_PRODUTO','SECAO_PRODUTO','GRUPO_PRODUTO','SUBGRUPO_PRODUTO','MARCA','FAMILIA_PRODUTO','GRUPO_MARCA','NCM','UNIDADE_MEDIDA','DATA_INCLUSAO'];
export const EAN_FIELDS=['REGISTRO','COD_PRODUTO','EAN','EAN_FORMATADO','EAN_INTERNO','IMPRESSO','VALIDO'];
export function validateCatalog(p,now=Date.now()){
 if(!p||p.schema!=='cip-procfit-catalog-v1'||!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(p.batch_id??'')||!Number.isFinite(Date.parse(p.sent_at))||Math.abs(now-Date.parse(p.sent_at))>300000)throw Error('invalid_packet');
 if(!['begin','products','eans','finish'].includes(p.action))throw Error('invalid_action');
 if(p.action==='begin'){
  if(!Number.isFinite(Date.parse(p.captured_at))||Date.parse(p.captured_at)>now+300000||Date.parse(p.captured_at)<now-86400000||!Number.isInteger(p.products)||p.products<1||p.products>300000||!Number.isInteger(p.eans)||p.eans<0||p.eans>600000)throw Error('invalid_counts');
 }else if(p.action==='products'||p.action==='eans'){
  const fields=p.action==='products'?PRODUCT_FIELDS:EAN_FIELDS,seen=new Set();
  if(!Array.isArray(p.rows)||p.rows.length<1||p.rows.length>500)throw Error('invalid_rows');
  for(const r of p.rows){
   if(!r||Object.keys(r).length!==fields.length||fields.some(k=>!Object.hasOwn(r,k))||Object.values(r).some(v=>v!==null&&(typeof v!=='string'||v.length>1000)))throw Error('invalid_fields');
   if(!/^[0-9]{1,30}$/.test(r.COD_PRODUTO??''))throw Error('invalid_code');
   const key=p.action==='products'?r.COD_PRODUTO:r.REGISTRO;
   if(!/^[0-9]{1,30}$/.test(key??'')||seen.has(key))throw Error('duplicate_key');seen.add(key);
   if(p.action==='products'&&!r.NOME_PRODUTO?.trim())throw Error('missing_name');
  }
 }
 return p;
}
