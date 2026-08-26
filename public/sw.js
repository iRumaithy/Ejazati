const CACHE="ejazati-v1.2.8";
const SHELL=[
  "./index.html","./manifest.webmanifest","./auth-hotfix.js",
  "./ui-v1.2.0.js","./ui-v1.2.1.js","./ui-v1.2.2.js",
  "./ui-v1.2.3.js","./ui-v1.2.4.js","./ui-v1.2.5.js",
  "./ui-v1.2.8.js",
  "./assets/icons/icon-192.png","./assets/icons/icon-512.png",
  "./assets/icons/apple-touch-icon.png"
];

self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)));
  // Critical recovery hotfix: activate v1.2.8 immediately so frozen v1.2.7
  // cannot keep controlling the app after the new worker is downloaded.
  self.skipWaiting();
});

self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys().then(keys=>
      Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("message",event=>{
  if(event.data?.type==="SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("push",event=>{
  let data={};
  try{ data=event.data ? event.data.json() : {}; }catch(_){
    data={title:"تحديث جديد لإجازاتي",body:event.data?.text()||"تحديث جديد متوفر"};
  }

  event.waitUntil(
    self.registration.showNotification(data.title||"تحديث جديد لإجازاتي",{
      body:data.body||"افتح إجازاتي للاطلاع على التحديث.",
      icon:"./assets/icons/icon-192.png",
      badge:"./assets/icons/icon-192.png",
      tag:data.tag||"ejazati-update",
      renotify:true,
      data:{url:data.url||"./",version:data.version||null}
    })
  );
});

self.addEventListener("notificationclick",event=>{
  event.notification.close();
  const target=event.notification.data?.url||"./";

  event.waitUntil((async()=>{
    const windows=await clients.matchAll({type:"window",includeUncontrolled:true});
    for(const client of windows){
      if("focus" in client){
        await client.focus();
        client.postMessage({type:"EJAZATI_CHECK_UPDATE",version:event.notification.data?.version||null});
        return;
      }
    }
    if(clients.openWindow) await clients.openWindow(target);
  })());
});

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;

  if(event.request.mode==="navigate"){
    event.respondWith((async()=>{
      try{
        const response=await fetch(event.request);
        const copy=response.clone();
        event.waitUntil(caches.open(CACHE).then(cache=>cache.put("./index.html",copy)));
        return response;
      }catch(_){
        return (await caches.match("./index.html"))||Response.error();
      }
    })());
    return;
  }

  event.respondWith((async()=>{
    const cached=await caches.match(event.request);
    if(cached)return cached;

    try{
      const response=await fetch(event.request);
      const copy=response.clone();
      event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)));
      return response;
    }catch(_){
      return Response.error();
    }
  })());
});