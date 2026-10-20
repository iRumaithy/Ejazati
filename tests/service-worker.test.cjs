const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
function worker({network=async()=>new Response('network')}={}){
 const handlers={},stores=new Map(),deleted=[],pending=[];let skips=0,claims=0;
 const key=x=>new URL(typeof x==='string'?x:x.url,'https://ejazati.test/sw.js').href;
 const caches={async open(name){if(!stores.has(name))stores.set(name,new Map());const map=stores.get(name);return {async addAll(paths){for(const p of paths){assert.equal(fs.existsSync('public/'+p.replace('./','')),true,p);map.set(key(p),new Response('cached:'+p));}},async match(k){return map.get(key(k))?.clone()},async put(k,r){map.set(key(k),r.clone())}}},async keys(){return [...stores.keys()]},async delete(k){deleted.push(k);return stores.delete(k)}};
 const self={location:new URL('https://ejazati.test/sw.js'),clients:{async claim(){claims++},async matchAll(){return[]}},registration:{async showNotification(){}},skipWaiting(){skips++},addEventListener(name,fn){handlers[name]=fn}};
 const context=vm.createContext({self,caches,URL,Request,Response,fetch:network,Set,Promise});vm.runInContext(fs.readFileSync('public/sw.js','utf8'),context);
 const event={waitUntil(p){pending.push(p)}};
 return {context,handlers,stores,deleted,pending,event,get skips(){return skips},get claims(){return claims},async install(){handlers.install(event);await Promise.all(pending.splice(0));},async request(path,{mode='cors'}={}){let response;handlers.fetch({request:{method:'GET',url:'https://ejazati.test'+path,mode},waitUntil:event.waitUntil,respondWith(p){response=p}});const result=response?await response:null;await Promise.all(pending.splice(0));return result;}};
}
test('the service worker precaches all actual files and offline versioned script requests use their canonical key',async()=>{
 const w=worker({network:async()=>{throw new Error('offline')}});await w.install();const r=await w.request('/ui-v1.2.12.js?v=1.2.13');assert.equal(await r.text(),'cached:./ui-v1.2.12.js');assert.equal(w.skips,0);
});
test('API requests, unknown assets and scripts from another release are never cached',async()=>{
 const w=worker();await w.install();for(const path of ['/api/private','/unknown.json','/ui-v1.2.11.js?v=1.2.11'])assert.equal(await w.request(path),null);
});
test('newer navigation HTML cannot corrupt the installed offline shell',async()=>{
 const w=worker({network:async()=>new Response('<meta name="ejazati-version" content="9.0.0">',{headers:{'Content-Type':'text/html'}})});await w.install();await w.request('/',{mode:'navigate'});assert.equal(await w.stores.get('ejazati-v1.2.13').get('https://ejazati.test/index.html').text(),'cached:./index.html');
});
test('activation removes only this app old caches and waits for claim; activation remains user initiated',async()=>{
 const w=worker();await w.install();w.stores.set('unrelated-app',new Map());w.stores.set('ejazati-v1.2.11',new Map());w.handlers.activate(w.event);await Promise.all(w.pending.splice(0));assert.deepEqual(w.deleted,['ejazati-v1.2.11']);assert.equal(w.claims,1);assert.equal(w.skips,0);w.handlers.message({data:{type:'SKIP_WAITING'}});assert.equal(w.skips,1);
});
test('notification navigation is restricted to the app origin',()=>{
 const w=worker();for(const x of ['https://evil.example/','javascript:alert(1)','//evil.example/'])assert.equal(vm.runInContext('notificationUrl('+JSON.stringify(x)+')',w.context),'https://ejazati.test/');assert.equal(vm.runInContext('notificationUrl("./?tab=calendar")',w.context),'https://ejazati.test/?tab=calendar');
});
