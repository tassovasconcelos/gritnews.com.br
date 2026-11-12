// Bounded, on-demand public-source collector. No credentials or recurring job.
import fs from 'node:fs';
import {fetchPublications,getJson,awardedRecord,PNCP} from './b2g-radar.mjs';
const end=process.argv[2]??'20261018',start=process.argv[3]??'20260918';
const purchases=[],sources=[],warnings=[];let scanned=0,total=0;
for(let page=1;page<=3;page++){
 try{const d=await fetchPublications({start,end,page});purchases.push(...d.purchases);sources.push(d.source);scanned+=d.scanned;total=d.total;if(d.scanned<50)break;}
 catch{warnings.push(`Página ${page} indisponível na coleta`);break;}
}
const awards=[];let inspected=0;
for(const p of [...purchases].sort((a,b)=>(Number(b.total_awarded)>0?1:0)-(Number(a.total_awarded)>0?1:0))){
 if(inspected>=8||awards.length>=16)break;inspected++;
 try{
  const items=await getJson(`${PNCP}/api/pncp/v1/orgaos/${p.cnpj}/compras/${p.year}/${p.sequence}/itens`);
  for(const item of (Array.isArray(items)?items:[]).filter(i=>i.temResultado).slice(0,4)){
   if(awards.length>=16)break;try{const rows=await getJson(`${PNCP}/api/pncp/v1/orgaos/${p.cnpj}/compras/${p.year}/${p.sequence}/itens/${item.numeroItem}/resultados`);const r=awardedRecord(p,item,rows);if(r)awards.push(r);}catch{warnings.push('Um resultado de item não pôde ser consultado');}
  }
 }catch{warnings.push('Itens de uma contratação não puderam ser consultados');}
}
const out={schema:1,collected_at:new Date().toISOString(),period:{start,end},scope:'Amostra de pregões eletrônicos publicados no Ceará; não cobre todos os portais, modalidades ou resultados.',scanned,total,pages:sources.length,purchases,awards,sources,warnings};
if(!scanned)throw Error('Sem consulta confirmada: pacote não atualizado');
fs.writeFileSync(new URL('./b2g-snapshot.json',import.meta.url),JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({scanned,total,purchases:purchases.length,awards:awards.length,warnings:warnings.length}));
