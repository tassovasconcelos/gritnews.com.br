// Public PDM dictionary only. No credentials, supplier/private data or scheduled job.
import fs from 'node:fs';
const base='https://dadosabertos.compras.gov.br/modulo-material/3_consultarPdmMaterial';
async function page(n){const r=await fetch(base+'?pagina='+n+'&tamanhoPagina=500',{signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('catalog_page_unavailable');const d=await r.json();if(!Array.isArray(d.resultado))throw Error('catalog_invalid');return d;}
const first=await page(1),all=[...first.resultado];if(first.totalPaginas>100)throw Error('catalog_limit');let next=2;
await Promise.all(Array.from({length:3},async()=>{while(next<=first.totalPaginas){const d=await page(next++);all.push(...d.resultado);}}));
const records=[...new Map(all.map(x=>[x.codigoPdm,{code:x.codigoPdm,name:x.nomePdm,group:x.codigoGrupo,category:x.nomeClasse,active:x.statusPdm}])).values()];
if(records.length!==first.totalRegistros)throw Error('catalog_coverage_mismatch');
const target=new URL('./b2g-catalog.json',import.meta.url),pending=new URL('./b2g-catalog.pending.json',import.meta.url);
fs.writeFileSync(pending,JSON.stringify({source:base,collected_at:new Date().toISOString(),total:first.totalRegistros,records}));fs.renameSync(pending,target);console.log(JSON.stringify({families:records.length,collected_at:new Date().toISOString()}));
