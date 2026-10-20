const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {JSDOM,VirtualConsole}=require('jsdom');
const vm=require('node:vm');
const html=readFileSync('public/index.html','utf8');
const uid='11111111-1111-4111-8111-111111111111';
const clone=x=>JSON.parse(JSON.stringify(x));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function app(t,{loggedIn=true,serviceWorkerError=false,recovery=false,failInitialTable=null}={}){
 const errors=[],calls=[],blobs=[];let authCallback,insideAuth=false;
 const db={ejazati_profiles:[{id:uid,role:'user',status:'active',display_name:'اختبار',username:'tester',email:'test@example.invalid'}],ejazati_leave_settings:[{user_id:uid,base_balance:30,carried_balance:5,carry_expiry:null,weekend_days:[6,0],balance_year:2026,year_opening_balance:35,balance_adjustment:0}],ejazati_leaves:[],ejazati_holidays:[{id:'22222222-2222-4222-8222-222222222222',user_id:uid,holiday_date:'2026-11-01',name:'عطلة خاصة'}],ejazati_holiday_overrides:[{id:'33333333-3333-4333-8333-333333333333',user_id:uid,official_holiday_id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',override_date:'2026-12-03',override_name:'موعد معدل',is_disabled:false}],ejazati_official_holidays:[{id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',holiday_year:2026,holiday_date:'2026-12-02',name_ar:'عطلة رسمية',status:'confirmed',source_name:'مصدر الاختبار'}],ejazati_app_versions:[],ejazati_backup_history:[]};
 const state={session:loggedIn?{user:{id:uid}}:null,failTable:failInitialTable,delayWrites:0,rpcError:null,now:'2026-10-19T23:00:00Z'};
 function from(table){
  if(insideAuth)throw new Error('Database API called while auth lock is held');
  let op='select',body,filters=[],single=false;
  const q={select(){return q},order(){return q},limit(){return q},gte(){return q},lte(){return q},eq(k,v){filters.push([k,v]);return q},single(){single=true;return q},maybeSingle(){single=true;return q},insert(b){op='insert';body=b;return q},upsert(b){op='upsert';body=b;return q},update(b){op='update';body=b;return q},delete(){op='delete';return q},then(resolve,reject){return (async()=>{
   calls.push({table,op,body:clone(body||null)});
   if(state.failTable===table)return {data:null,error:{message:'offline'}};
   if(op!=='select'&&state.delayWrites)await sleep(state.delayWrites);
   const rows=db[table]||[],matched=rows.filter(r=>filters.every(([k,v])=>r[k]===v));let data=matched;
   if(op==='insert'){data=(Array.isArray(body)?body:[body]).map((r,i)=>({...r,id:r.id||'44444444-4444-4444-8444-'+String(rows.length+i).padStart(12,'0')}));rows.push(...data);db[table]=rows;}
   if(op==='upsert'){const i=rows.findIndex(r=>r.user_id===body.user_id);if(i<0)rows.push(clone(body));else Object.assign(rows[i],clone(body));data=[body];}
   if(op==='update'){for(const r of matched)Object.assign(r,clone(body));data=matched;}
   if(op==='delete'){db[table]=rows.filter(r=>!matched.includes(r));data=matched;}
   return {data:clone(single?(data[0]||null):data),error:null};
  })().then(resolve,reject)}};
  return q;
 }
 const client={from,async rpc(name,args){if(insideAuth)throw new Error('RPC while auth lock is held');calls.push({rpc:name,args:clone(args||null)});if(name==='ejazati_claim_owner')return {data:false,error:null};return {data:{ok:true},error:state.rpcError};},auth:{onAuthStateChange(cb){authCallback=cb;return {data:{subscription:{unsubscribe(){}}}}},async getSession(){return {data:{session:state.session},error:null}},async signOut(){state.session=null;authCallback('SIGNED_OUT',null);return{}},async updateUser(){return {error:null}}}};
 const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(html,{url:'https://ejazati.test/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});const w=dom.window;
 const NativeDate=w.Date;
 w.Date=class extends NativeDate{constructor(...args){super(...(args.length?args:[state.now]));}static now(){return new NativeDate(state.now).getTime();}};
 w.supabase={createClient(){return client}};w.matchMedia=()=>({matches:false});w.scrollTo=()=>{};w.confirm=()=>true;w.alert=()=>{};w.setInterval=()=>1;w.clearInterval=()=>{};
 w.fetch=async()=>new Response('{}',{status:200});w.Blob=Blob;w.Response=Response;w.URL.createObjectURL=b=>{blobs.push(b);return'blob:backup'};w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=function(){};
 if(serviceWorkerError)Object.defineProperty(w.navigator,'serviceWorker',{value:{register:async()=>{throw new Error('registration failed')},addEventListener(){},getRegistration:async()=>null}});
 for(const script of [...w.document.scripts]){
  if(script.src.startsWith('https://cdn.'))continue;
  if(script.src){const path=new URL(script.src).pathname;vm.runInContext(readFileSync('public'+path,'utf8'),dom.getInternalVMContext(),{filename:path});}
  else if(script.textContent.trim()){vm.runInContext(script.textContent,dom.getInternalVMContext(),{filename:'inline-app.js'});if(recovery&&script.textContent.includes('const APP_VERSION'))authCallback('PASSWORD_RECOVERY',state.session);}
 }
 t.after(()=>w.close());await sleep(35);
 return {w,db,state,calls,errors,blobs,run:code=>vm.runInContext(code,dom.getInternalVMContext()),async emit(event,s=state.session){insideAuth=true;let returned;try{returned=authCallback(event,s);}finally{insideAuth=false;}await sleep(35);return returned;}};
}
test('the complete script chain loads, signs in and displays one current version',async t=>{
 const h=await app(t);assert.deepEqual(h.errors,[]);assert.equal(h.w.document.getElementById('appView').classList.contains('hidden'),false);assert.equal(h.w.EJAZATI_APP_VERSION,'1.2.12');assert.equal(h.w.document.querySelector('#changelogV1212Local .sourceBadge').textContent,'الحالي');assert.match(h.w.document.querySelector('.version').textContent,/1\.2\.12/);
});
test('auth callback releases its lock before loading data and refresh does not overwrite an active form',async t=>{
 const h=await app(t,{loggedIn:false});h.state.session={user:{id:uid}};
 assert.equal(await h.emit('SIGNED_IN'),undefined);assert.equal(h.w.document.getElementById('appView').classList.contains('hidden'),false);
 h.w.document.getElementById('displayName').value='تعديل غير محفوظ';const before=h.calls.length;
 await h.emit('TOKEN_REFRESHED');assert.equal(h.calls.length,before);assert.equal(h.w.document.getElementById('displayName').value,'تعديل غير محفوظ');
});
test('service worker failure does not prevent account loading',async t=>{
 const h=await app(t,{serviceWorkerError:true});assert.equal(h.w.document.getElementById('appView').classList.contains('hidden'),false);assert.deepEqual(h.errors,[]);
});
test('failed cloud reads preserve previously loaded leaves and settings',async t=>{
 const h=await app(t);h.run("leaves=[{id:'preserved'}];settings.base_balance=41");h.state.failTable='ejazati_holidays';assert.equal(await h.run('loadData()'),false);assert.equal(h.run('leaves[0].id'),'preserved');assert.equal(h.run('settings.base_balance'),41);assert.match(h.w.document.getElementById('toast').textContent,/آخر بيانات/);
});
test('export includes actual custom holidays, overrides and current build',async t=>{
 const h=await app(t);await h.run('exportBackup()');const value=JSON.parse(await h.blobs[0].text());assert.equal(value.app_version,'1.2.12');assert.equal(value.holidays[0].name,'عطلة خاصة');assert.equal(value.holiday_overrides[0].override_name,'موعد معدل');assert.equal(value.holidays.some(x=>x.official),false);
});
test('invalid backups never invoke restore or delete; failed restore reports unchanged data',async t=>{
 const h=await app(t);const before=h.calls.length;const event={target:{files:[{size:100,text:async()=>'{"format":"ejazati-backup-v1"}'}],value:'file'}};
 await h.w.importBackup(event);assert.equal(h.calls.length,before);assert.equal(event.target.value,'');
 const payload={format:'ejazati-backup-v1',settings:h.db.ejazati_leave_settings[0],leaves:[],holidays:[]};h.state.rpcError={message:'failed'};event.target.files[0].text=async()=>JSON.stringify(payload);await h.w.importBackup(event);assert.equal(h.calls.at(-1).rpc,'ejazati_restore_backup');assert.equal(h.calls.some(x=>x.op==='delete'),false);assert.match(h.w.document.getElementById('toast').textContent,/لم تُستبدل/);
});
test('a double tap submits one leave and stale edits are rejected',async t=>{
 const h=await app(t);h.state.delayWrites=15;const d=h.w.document;
 d.getElementById('leaveType').value='annual';d.getElementById('leaveFrom').value='2026-10-20';d.getElementById('leaveTo').value='2026-10-21';d.getElementById('leaveDeduct').checked=true;
 await Promise.all([h.w.saveLeave(),h.w.saveLeave()]);assert.equal(h.calls.filter(x=>x.table==='ejazati_leaves'&&x.op==='insert').length,1);
 const row=h.db.ejazati_leaves[0];d.getElementById('leaveId').value=row.id;row.updated_at='2026-10-21T00:00:00Z';await h.w.saveLeave();assert.match(d.getElementById('toast').textContent,/جهاز آخر/);
});
test('successive carry changes use the freshly saved baseline',async t=>{
 const h=await app(t),d=h.w.document,carry=d.getElementById('carryBalance'),current=d.getElementById('currentBalanceInput');
 assert.equal(current.value,'35');carry.value='10';carry.dispatchEvent(new h.w.Event('input',{bubbles:true}));assert.equal(current.value,'40');await h.w.saveSettings();carry.value='15';carry.dispatchEvent(new h.w.Event('input',{bubbles:true}));assert.equal(current.value,'45');
});
test('day rollover refreshes the date used by balances and calendars',async t=>{
 const h=await app(t);assert.equal(h.run('ymd(TODAY)'),'2026-10-20');h.state.now='2026-10-20T20:00:00Z';h.w.checkDayRollover();await sleep(20);assert.equal(h.run('ymd(TODAY)'),'2026-10-21');
});
test('an email containing quotes remains data in the owner reset action',async t=>{
 const h=await app(t);h.run('profile.role="owner";users=[{id:"another",role:"user",status:"active",email:"a\'b@example.invalid"}];renderAdmin()');
 let received;h.w.sendReset=value=>{received=value};h.w.eval(h.w.document.querySelector('#usersList button:last-child').getAttribute('onclick'));assert.equal(received,"a'b@example.invalid");assert.deepEqual(h.errors,[]);
});

test('a failed initial read can recover through sign-in without a full reload',async t=>{
 const h=await app(t,{failInitialTable:'ejazati_holidays'});assert.equal(h.w.document.getElementById('appView').classList.contains('hidden'),true);h.state.failTable=null;await h.emit('SIGNED_IN');assert.equal(h.w.document.getElementById('appView').classList.contains('hidden'),false);
});
test('password recovery is not replaced by the startup screen; successful reset loads the account',async t=>{
 const h=await app(t,{recovery:true});const d=h.w.document;assert.equal(d.getElementById('recoveryForm').classList.contains('hidden'),false);assert.equal(d.getElementById('appView').classList.contains('hidden'),true);d.getElementById('newPassword').value='Example-only-test-value';await h.w.setNewPassword({preventDefault(){}});assert.equal(d.getElementById('appView').classList.contains('hidden'),false);
});
