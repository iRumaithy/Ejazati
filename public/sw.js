const VERSION='1.2.12';
const CACHE='ejazati-v'+VERSION;
const SHELL=[
 './index.html','./manifest.webmanifest','./ejazati-core.js','./auth-hotfix.js',
 './ui-v1.2.0.js','./ui-v1.2.1.js','./ui-v1.2.2.js','./ui-v1.2.3.js',
 './ui-v1.2.4.js','./ui-v1.2.5.js','./ui-v1.2.9.js','./ui-v1.2.10.js',
 './ui-v1.2.11.js','./ui-v1.2.12.js','./assets/icons/icon-192.png',
 './assets/icons/icon-512.png','./assets/icons/apple-touch-icon.png','./assets/icons/icon-32.png'
];
const assetPaths=new Set(SHELL.map(path=>new URL(path,self.location.href).pathname));
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL))));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 const keys=await caches.keys();
 await Promise.all(keys.filter(key=>key.startsWith('ejazati-v')&&key!==CACHE).map(key=>caches.delete(key)));
 await self.clients.claim();
})()));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
function notificationUrl(value){
 try{const url=new URL(value||'./',self.location.href);if(url.origin===self.location.origin)return url.href;}catch(_){}
 return new URL('./',self.location.href).href;
}
self.addEventListener('push',event=>{
 let data={};try{data=event.data?.json()||{};}catch(_){data={body:event.data?.text()||''};}
 event.waitUntil(self.registration.showNotification(data.title||'تحديث جديد لإجازاتي',{
  body:data.body||'افتح إجازاتي للاطلاع على التحديث.',icon:'./assets/icons/icon-192.png',badge:'./assets/icons/icon-192.png',
  tag:data.tag||'ejazati-update',renotify:true,data:{url:notificationUrl(data.url),version:data.version||null}
 }));
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();const target=notificationUrl(event.notification.data?.url);
 event.waitUntil((async()=>{
  const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  for(const client of windows){if(new URL(client.url).origin===self.location.origin&&'focus'in client){await client.focus();client.postMessage({type:'EJAZATI_CHECK_UPDATE',version:event.notification.data?.version||null});return;}}
  if(self.clients.openWindow)await self.clients.openWindow(target);
 })());
});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);if(url.origin!==self.location.origin)return;
 if(event.request.mode==='navigate'){
  event.respondWith((async()=>{
   try{
    const response=await fetch(event.request);
    if(response.ok&&response.headers.get('Content-Type')?.includes('text/html')){
     const copy=response.clone(),html=await response.clone().text();
     // Do not mix a waiting release's HTML with the previous offline scripts.
     if(html.includes('name="ejazati-version" content="'+VERSION+'"'))event.waitUntil(caches.open(CACHE).then(c=>c.put('./index.html',copy)));
    }
    return response;
   }catch(_){return (await caches.open(CACHE)).match('./index.html').then(hit=>hit||Response.error());}
  })());return;
 }
 if(!assetPaths.has(url.pathname)||(url.searchParams.has('v')&&url.searchParams.get('v')!==VERSION))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE),key=new Request(url.origin+url.pathname),hit=await cache.match(key);
  if(hit)return hit;
  try{const response=await fetch(event.request);if(response.ok&&response.type!=='opaque')event.waitUntil(cache.put(key,response.clone()));return response;}
  catch(_){return Response.error();}
 })());
});
