import {STATES,textKey} from './b2g-research.mjs';
export const STATE_SOURCES=[
 ['AC','Acre','transparencia.ac.gov.br'],['AL','Alagoas','transparencia.al.gov.br'],['AP','Amapá','transparencia.ap.gov.br'],['AM','Amazonas','transparencia.am.gov.br'],['BA','Bahia','www.transparencia.ba.gov.br'],['CE','Ceará','cearatransparente.ce.gov.br'],['DF','Distrito Federal','www.transparencia.df.gov.br'],['ES','Espírito Santo','transparencia.es.gov.br'],['GO','Goiás','transparencia.go.gov.br'],['MA','Maranhão','transparencia.ma.gov.br'],['MT','Mato Grosso','transparencia.mt.gov.br'],['MS','Mato Grosso do Sul','www.transparencia.ms.gov.br'],['MG','Minas Gerais','transparencia.mg.gov.br'],['PA','Pará','transparencia.pa.gov.br'],['PB','Paraíba','transparencia.pb.gov.br'],['PR','Paraná','transparencia.pr.gov.br'],['PE','Pernambuco','transparencia.pe.gov.br'],['PI','Piauí','transparencia.pi.gov.br'],['RJ','Rio de Janeiro','transparencia.rj.gov.br'],['RN','Rio Grande do Norte','www.transparencia.rn.gov.br'],['RS','Rio Grande do Sul','transparencia.rs.gov.br'],['RO','Rondônia','transparencia.ro.gov.br'],['RR','Roraima','transparencia.rr.gov.br'],['SC','Santa Catarina','transparencia.sc.gov.br'],['SP','São Paulo','www.transparencia.sp.gov.br'],['SE','Sergipe','transparencia.se.gov.br'],['TO','Tocantins','transparencia.to.gov.br']
].map(([uf,name,portal])=>({uf,name,domain:uf.toLowerCase()+'.gov.br',portal:'https://'+portal}));
export const NATIONAL_DOMAINS=['pncp.gov.br','portaldatransparencia.gov.br','compras.gov.br','comprasnet.gov.br','in.gov.br'];
export function validateWebQuery(q){
 const clean=(v,max)=>typeof v==='string'?v.trim().slice(0,max):'';
 const product=clean(q?.product,150),brand=clean(q?.brand,80),supplier=clean(q?.supplier,14),state=clean(q?.state,2),sphere=clean(q?.sphere,1),start=clean(q?.start,10),end=clean(q?.end,10);
 const day=s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
 if(q?.action!=='discover_web'||(!product&&!brand&&!supplier)||product.length+brand.length<2&&!supplier||supplier&&!/^\d{14}$/.test(supplier))throw Error('invalid_query');
 if(state&&!STATES.includes(state))throw Error('invalid_state');if(sphere&&!['F','E','M'].includes(sphere))throw Error('invalid_sphere');
 if(!day(start)||!day(end)||start>end||end>new Date().toISOString().slice(0,10)||Date.parse(end)-Date.parse(start)>4383*86400000)throw Error('invalid_period');
 return {action:'discover_web',product,brand,supplier,state,sphere,start,end};
}
export function researchPlan(input){const q=validateWebQuery(input),states=q.sphere==='F'?[]:STATE_SOURCES.filter(s=>!q.state||s.uf===q.state);
 return {scope:q.state||'BR',state_names:states.map(s=>s.name),allowed_domains:[...NATIONAL_DOMAINS,...states.map(s=>s.domain)],portals:states,query_terms:[q.product,q.brand,q.supplier].filter(Boolean),period:{start:q.start,end:q.end},method:'Pesquisa web em domínios oficiais; APIs estruturadas podem complementar a conferência. Não equivale a varrer integralmente todos os portais.'};
}
export function officialSource(url,plan){try{const u=new URL(url);return u.protocol==='https:'&&!u.username&&!u.password&&(!u.port||u.port==='443')&&plan.allowed_domains.some(d=>u.hostname===d||u.hostname.endsWith('.'+d))?u.href:null;}catch{return null;}}
export const feedbackTerms=q=>({product:textKey(q.product),brand:textKey(q.brand),state:q.state||''});
