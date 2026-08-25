const CACHE="ejazati-v1.1.1";
const SHELL=[
  "./index.html",
  "./manifest.webmanifest",
  "./auth-hotfix.js",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/apple-touch-icon.png"
];

self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)));
});

self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys().then(keys=>
      Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("message",event=>{
  if(event.data?.type==="SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET") return;

  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin) return;

  if(event.request.mode==="navigate"){
    event.respondWith((async()=>{
      try{
        const response=await fetch(event.request);
        const copy=response.clone();
        event.waitUntil(
          caches.open(CACHE).then(c=>c.put("./index.html",copy))
        );
        return response;
      }catch(e){
        return (await caches.match("./index.html")) || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async()=>{
    const cached=await caches.match(event.request);
    if(cached) return cached;

    try{
      const response=await fetch(event.request);
      const copy=response.clone();
      event.waitUntil(caches.open(CACHE).then(c=>c.put(event.request,copy)));
      return response;
    }catch(e){
      return Response.error();
    }
  })());
});
