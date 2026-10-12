const CACHE="cp360-shell-v2";
self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",(event)=>event.waitUntil((async()=>{
 const names=await caches.keys();
 await Promise.all(names.filter(name=>name.startsWith("cp360-shell-")&&name!==CACHE).map(name=>caches.delete(name)));
 await self.clients.claim();
})()));
self.addEventListener("fetch",(event)=>{
 const request=event.request;
 if(request.method!=="GET"||new URL(request.url).origin!==self.location.origin)return;
 const url=new URL(request.url);
 if(!url.pathname.startsWith("/assets/")&&!["/icon.svg","/icon-192.png","/icon-512.png","/icon-maskable-512.png","/manifest.webmanifest"].includes(url.pathname))return;
 event.respondWith(caches.open(CACHE).then(async(cache)=>{
  const cached=await cache.match(request);
  if(cached)return cached;
  const response=await fetch(request);
  if(response.ok)await cache.put(request,response.clone());
  return response;
 }));
});
