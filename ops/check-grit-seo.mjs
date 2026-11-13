import { readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
const root = process.cwd();
const origin = 'https://gritnews.com.br';
const fail = [];
function read(path){return readFileSync(resolve(root,path),'utf8')}
function assert(ok,msg){if(!ok)fail.push(msg)}
const required = ['public','apps/gritnews/public'];
for(const dir of required){
 const index=read(join(dir,'sitemap.xml'));
 const robots=read(join(dir,'robots.txt'));
 const seo=read(join(dir,'sitemap-grit-pme.xml'));
 assert(index.includes('sitemap-grit-pme.xml'),dir+': sitemap index sem sitemap comercial GRIT');
 assert(robots.includes('Sitemap: '+origin+'/sitemap.xml'),dir+': robots.txt sem sitemap canonico');
 assert(!robots.includes('Disallow: /solucoes/'),dir+': robots bloqueia solucoes');
 const urls=[...seo.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x=>x[1]);
 assert(urls.length===7,dir+': esperado sete urls no sitemap GRIT');
 assert(new Set(urls).size===urls.length,dir+': urls duplicadas');
 for(const url of urls){
  const parsed=new URL(url);
  assert(parsed.origin===origin,dir+': host canonico incorreto: '+url);
  assert(!parsed.search && !parsed.hash,dir+': sitemap com query/hash: '+url);
  const path=join(dir,parsed.pathname,'index.html');
  assert(existsSync(resolve(root,path)),dir+': rota nao existe '+path);
  if(!existsSync(resolve(root,path)))continue;
  const html=read(path);
  assert(html.includes('rel="canonical" href="'+url+'"'),path+': canonical divergente');
  assert((html.match(/<h1\b/g)||[]).length===1,path+': h1 ausente ou duplicado');
  assert(/<meta name="description"\s+content="/.test(html),path+': meta description ausente');
  assert(/name="consent_lgpd"/.test(html),path+': consentimento comercial ausente');
  assert(/functions\/v1\/commercial-lead/.test(html),path+': captura de lead ausente');
  const ld=html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert(Boolean(ld),path+': dados estruturados ausentes');
  if(ld){try{JSON.parse(ld[1])}catch{fail.push(path+': dados estruturados invalidos')}}
 }
}
assert(read('public/sitemap.xml').includes('sitemap-editorial.xml'),'Sitemap editorial nao preservado');
assert((read('index.html').match(/rel="canonical"/g)||[]).length===1,'Homepage root com canonical duplicado');
assert((read('apps/gritnews/index.html').match(/rel="canonical"/g)||[]).length===1,'Homepage app com canonical duplicado');
if(fail.length){for(const line of fail) console.error('ERRO SEO: '+line);process.exit(1)}
console.log('GRIT SEO: 7 URLs e 2 caminhos de build verificados; canonical, formulários, robots, XML e dados estruturados OK.');
