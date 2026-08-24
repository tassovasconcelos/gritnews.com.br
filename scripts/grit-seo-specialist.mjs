import fs from 'node:fs/promises';

const registry=JSON.parse(await fs.readFile(new URL('../ops/seo/targets.json', import.meta.url),'utf8'));
const timeoutMs=Number(process.env.SEO_AUDIT_TIMEOUT_MS||12000);

async function fetchCheck(url){
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),timeoutMs);
 try{
  const res=await fetch(url,{redirect:'follow',signal:controller.signal,headers:{'user-agent':'GRIT-SEO-Specialist/1.0'}});
  const type=res.headers.get('content-type')||'';
  const body=(type.includes('text')||type.includes('xml')||type.includes('json'))?await res.text():'';
  return {ok:res.ok,status:res.status,final_url:res.url,content_type:type,body:body.slice(0,250000)};
 }catch(error){return {ok:false,status:0,error:String(error?.message||error),body:''}}
 finally{clearTimeout(timer)}
}

function pageSignals(body=''){
 const lower=body.toLowerCase();
 return {
  canonical:/<link[^>]+rel=["']canonical["']/i.test(body),
  noindex:/<meta[^>]+name=["']robots["'][^>]+noindex/i.test(body)||/noindex/.test(lower.slice(0,6000)),
  title:/<title>[^<]{3,}<\/title>/i.test(body),
  description:/<meta[^>]+name=["']description["']/i.test(body),
  schema:/application\/ld\+json/i.test(body)
 };
}

function classify(item){
 if(item.status==='planned')return {state:'PLANNED',score:100,actions:['Criar landing publica antes de indexar.']};
 const failed=item.checks.filter(c=>!c.ok);
 let score=100-failed.length*25;
 const home=item.checks.find(c=>c.path==='/');
 const actions=[];
 if(failed.length)actions.push(`Corrigir ${failed.length} URL(s) sem HTTP 2xx.`);
 if(home?.signals && !home.signals.canonical){score-=10;actions.push('Adicionar canonical na home publica.');}
 if(home?.signals && !home.signals.title){score-=10;actions.push('Adicionar title descritivo.');}
 if(home?.signals && !home.signals.description){score-=5;actions.push('Adicionar meta description.');}
 if(home?.signals?.noindex){score-=30;actions.push('Remover noindex da home publica se a pagina deve ranquear.');}
 const hasRobots=item.checks.some(c=>c.path==='/robots.txt'&&c.ok);
 const hasSitemap=item.checks.some(c=>c.path.includes('sitemap')&&c.ok);
 if(!hasRobots){score-=10;actions.push('Publicar robots.txt.');}
 if(!hasSitemap && item.key!=='sac-4'){score-=15;actions.push('Publicar sitemap valido.');}
 score=Math.max(0,score);
 return {state:score>=90?'GREEN':score>=70?'YELLOW':'RED',score,actions};
}

const results=[];
for(const target of registry.targets.sort((a,b)=>b.priority-a.priority)){
 if(!target.base_url){results.push({...target,checks:[],...classify({...target,checks:[]})});continue;}
 const checks=[];
 for(const path of target.required_paths){
  const url=new URL(path,target.base_url).toString();
  const result=await fetchCheck(url);
  const signals=path==='/'&&result.body?pageSignals(result.body):undefined;
  checks.push({path,url,ok:result.ok,status:result.status,final_url:result.final_url,error:result.error,signals});
 }
 const health=classify({...target,checks});
 results.push({...target,checks,...health});
}

const summary={
 generated_at:new Date().toISOString(),
 engine:'GRIT SEO Specialist v1',
 green:results.filter(r=>r.state==='GREEN').length,
 yellow:results.filter(r=>r.state==='YELLOW').length,
 red:results.filter(r=>r.state==='RED').length,
 planned:results.filter(r=>r.state==='PLANNED').length,
 results
};

await fs.mkdir('artifacts/seo',{recursive:true});
await fs.writeFile('artifacts/seo/seo-health.json',JSON.stringify(summary,null,2));
const md=[
 '# GRIT SEO Specialist — Health Report',
 '',
 `Gerado: ${summary.generated_at}`,
 `GREEN ${summary.green} | YELLOW ${summary.yellow} | RED ${summary.red} | PLANNED ${summary.planned}`,
 '',
 '| Produto | Estado | Score | Ação prioritária |',
 '|---|---:|---:|---|',
 ...results.map(r=>`| ${r.name} | ${r.state} | ${r.score} | ${(r.actions[0]||'Sem ação crítica').replace(/\|/g,'/')} |`),
 '',
 '## Detalhes',
 ...results.flatMap(r=>['',`### ${r.name} — ${r.state} (${r.score})`,...(r.actions.length?r.actions.map(a=>`- ${a}`):['- Sem ação crítica detectada.']),...r.checks.map(c=>`- ${c.path}: HTTP ${c.status}${c.ok?' OK':' FALHA'}`)])
].join('\n');
await fs.writeFile('artifacts/seo/seo-health.md',md);
console.log(md);

if(results.some(r=>r.state==='RED'))process.exitCode=2;
