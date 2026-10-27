const CACHE_PREFIX='cip-app-shell-';
const RELEASE_ID='__CIP_RELEASE_ID__';
const CACHE_NAME=CACHE_PREFIX+RELEASE_ID;
const SHELL=[
 './index.html','./navigation.css','./navigation-ui.mjs','./navigation-data.mjs','./readiness.mjs','./manifest.webmanifest','./icon-192.png','./icon-512.png','./logo-cip-512.jpg',
 './agents.css','./campaign-planner.css','./cip-auth.js','./supabase-js-2.57.0.mjs',
 './doquita-insights.mjs','./erp-ui.mjs','./stock-reference.mjs','./procfit-status-ui.mjs','./procfit-catalog-ui.mjs','./erp-engine.mjs',
 './pricing-ui.mjs','./pricing-engine.mjs','./pricing-campaign-engine.mjs','./campaign-planner-engine.mjs','./pricing-intelligence.mjs','./shopping-position.mjs','./stock-action-engine.mjs','./stock-actions-ui.mjs',
 './agent-capabilities.mjs','./process-engine.mjs','./process-consultant.mjs','./process-ui.mjs','./bot-ui.mjs','./agents-data.mjs','./agents-ui.mjs','./agent-operations-ui.mjs','./agent-operations-engine.mjs','./academy-ui.mjs','./admin-ui.mjs','./academy-engine.mjs',
 './b2g-radar.mjs','./b2g-research.mjs','./b2g-research-ui.mjs','./b2g-discovery.mjs','./b2g-discovery-ui.mjs','./b2g-sources.mjs','./b2g-vocabulary.mjs'
];
const OPTIONAL=['./presentation.mjs','./presentation.css','./pricing-desk-ui.mjs','./pricing-desk-engine.mjs','./pricing-desk.css'];
const shellPaths=new Set([...SHELL,...OPTIONAL].map(path=>new URL(path,self.location).pathname));
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE_NAME).then(async cache=>{
  const results=await Promise.allSettled(SHELL.map(path=>cache.add(new Request(new URL(path,self.location),{cache:'reload'}))));
  const failures=results.map((result,index)=>result.status==='rejected'?SHELL[index]:null).filter(Boolean);
  if(failures.length)throw new Error('App shell incomplete: '+failures.join(', '));
 }));
});
self.addEventListener('message',event=>{if(event.data?.type==='ACTIVATE_UPDATE')event.waitUntil(self.skipWaiting());});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(CACHE_PREFIX)&&key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin)return;
 if(request.mode==='navigate'){
  const root=new URL('./',self.location).pathname;
  if(url.pathname!==root&&url.pathname!==root+'index.html')return;
  event.respondWith(fetch(request).catch(async()=>{
   const cache=await caches.open(CACHE_NAME);
   return (await cache.match(new URL('./index.html',self.location)))||Response.error();
  }));
  return;
 }
 if(!shellPaths.has(url.pathname))return;
 event.respondWith(caches.open(CACHE_NAME).then(async cache=>{
  try{const response=await fetch(request);if(response.ok)await cache.put(new Request(new URL(url.pathname,self.location)),response.clone());return response;}
  catch(error){const cached=await cache.match(request,{ignoreSearch:true});if(cached)return cached;throw error;}
 }));
});
