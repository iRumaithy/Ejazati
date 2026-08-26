const CACHE="ejazati-v1.2.6";
const SHELL=[
  "./index.html","./manifest.webmanifest","./auth-hotfix.js",
  "./ui-v1.2.0.js","./ui-v1.2.1.js","./ui-v1.2.2.js",
  "./ui-v1.2.3.js","./ui-v1.2.4.js","./ui-v1.2.5.js","./ui-v1.2.6.js",
  "./assets/icons/icon-192.png","./assets/icons/icon-512.png","./assets/icons/apple-touch-icon.png"
];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL))));
self.addEventListener("activate",e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("message",e=>{if(e.data?.type==="SKIP_WAITING")self.skipWaiting();});
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  const u=new URL(e.request.url); if(u.origin!==self.location.origin)return;
  e.respondWith((async()=>{
    const c=await caches.match(e.request); if(c)return c;
    try{
      const r=await fetch(e.request);
      const cp=r.clone();
      e.waitUntil(caches.open(CACHE).then(x=>x.put(e.request,cp)));
      return r;
    }catch(_){
      return e.request.mode==="navigate" ? (await caches.match("./index.html")) : Response.error();
    }
  })());
});