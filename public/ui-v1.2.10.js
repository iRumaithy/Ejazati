(() => {
  const VERSION = "1.2.10";
  const VAPID_PUBLIC_KEY = "BLBRgI1Jrj_QYLgFgNQ14fF6cKhNM3AXz1Q9qsUvKKHWqJMdPTZg2uOTqCfyiXbd4ZORkV-WrynQZgdEy0v0hlM";
  const DISMISS_HOURS = 6;
  let pollTimer = null;
  let lastRemoteVersion = null;

  window.EJAZATI_APP_VERSION = VERSION;

  function parseVersion(v){
    const m=String(v||"").match(/(\d+)\.(\d+)\.(\d+)/);
    return m?[+m[1],+m[2],+m[3]]:[0,0,0];
  }
  function newerThan(a,b){
    const A=parseVersion(a),B=parseVersion(b);
    for(let i=0;i<3;i++){if(A[i]!==B[i])return A[i]>B[i];}
    return false;
  }

  function injectStyles(){
    if(document.getElementById("ejazatiV1210Styles"))return;
    const s=document.createElement("style");
    s.id="ejazatiV1210Styles";
    s.textContent=`
      .top{position:relative!important}
      .refreshBtnTop{width:38px;height:38px;padding:0;display:grid;place-items:center;border-radius:13px;border:1px solid rgba(217,182,95,.28);background:rgba(217,182,95,.07);color:#f2d77d;font-size:22px;line-height:1}
      .liveUpdateNoticeV1210{position:fixed;z-index:88;left:50%;transform:translateX(-50%);bottom:calc(88px + env(safe-area-inset-bottom));width:min(570px,calc(100% - 22px));padding:13px;border-radius:18px;color:#061426;background:linear-gradient(135deg,#fff6d5,#f3d36c);box-shadow:0 16px 50px rgba(0,0,0,.38)}
      .liveUpdateNoticeV1210 b{display:block;font-size:13px}.liveUpdateNoticeV1210 p{font-size:10px;line-height:1.6;margin:5px 0 9px;color:#4d4324}.liveUpdateNoticeV1210 .updateActions{display:flex;gap:7px;flex-wrap:wrap}
      .liveUpdateNoticeV1210 button{border:1px solid rgba(6,20,38,.15);border-radius:11px;padding:8px 10px;color:#061426;background:rgba(255,255,255,.5);font-size:10px;font-weight:800}
      .liveUpdateNoticeV1210 button.primaryUpdate{background:#061426;color:#fff}.liveUpdateNoticeV1210 button:disabled{opacity:.58}
      .pushSettingsV1210{border:1px solid rgba(217,182,95,.18);background:linear-gradient(135deg,rgba(217,182,95,.09),rgba(82,199,255,.035))}
      .pushSettingsV1210 .pushStatus{color:var(--muted);font-size:10px;line-height:1.65;margin:7px 0 11px}
      .leaveLegendChip[data-leave-type="mission"]{color:var(--muted)!important;font-weight:400!important}.leaveLegendChip[data-leave-type="mission"] i{background:#9BE15D!important}
    `;
    document.head.appendChild(s);
  }

  function clearLegacyNotices(){
    document.getElementById("liveUpdateNoticeV128")?.remove();
    document.getElementById("liveUpdateNoticeV1210")?.remove();
    const legacy=document.getElementById("updateBar");
    if(legacy&&!legacy.classList.contains("hidden"))legacy.classList.add("hidden");
  }

  function injectRefresh(){
    const top=document.querySelector(".top");
    if(!top||document.getElementById("manualRefreshBtn"))return;
    const b=document.createElement("button");
    b.id="manualRefreshBtn"; b.className="refreshBtnTop"; b.type="button";
    b.title="تحديث الصفحة"; b.setAttribute("aria-label","تحديث الصفحة"); b.textContent="↻";
    b.onclick=()=>location.reload();
    top.insertBefore(b,top.querySelector(".avatar")||null);
  }

  function tickClock(){
    const t=document.getElementById("liveTime"),d=document.getElementById("liveDate"),now=new Date();
    if(t)t.textContent=new Intl.DateTimeFormat("ar-AE",{timeZone:"Asia/Dubai",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:true}).format(now);
    if(d){
      const p={};
      new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Dubai",day:"2-digit",month:"2-digit",year:"numeric"}).formatToParts(now).forEach(x=>{if(x.type!=="literal")p[x.type]=x.value});
      d.textContent=`${p.day}/${p.month}/${p.year}`;
    }
  }
  function startClock(){
    tickClock();
    if(!window.__ejazatiClockV1210)window.__ejazatiClockV1210=setInterval(tickClock,1000);
  }

  const dismissKey=v=>`ejazati:update-dismissed:${v}`;
  const isDismissed=v=>Number(localStorage.getItem(dismissKey(v))||0)>Date.now();
  function dismiss(v){
    localStorage.setItem(dismissKey(v),String(Date.now()+DISMISS_HOURS*3600000));
    document.getElementById("liveUpdateNoticeV1210")?.remove();
  }

  async function prepareWorker(){
    if(!("serviceWorker" in navigator))return;
    try{
      const reg=await navigator.serviceWorker.getRegistration();
      if(!reg)return;
      const enable=()=>{
        const b=document.getElementById("installLiveUpdateV1210");
        if(!b||!reg.waiting)return false;
        b.disabled=false;b.textContent="تحديث الآن";
        b.onclick=()=>{b.disabled=true;b.textContent="جاري التحديث…";reg.waiting.postMessage({type:"SKIP_WAITING"})};
        return true;
      };
      if(enable())return;
      reg.addEventListener("updatefound",()=>{
        const w=reg.installing;if(!w)return;
        w.addEventListener("statechange",()=>{if(w.state==="installed")enable()});
      },{once:true});
      await reg.update();
      if(!enable()){
        const b=document.getElementById("installLiveUpdateV1210");
        if(b)setTimeout(()=>{if(!enable()&&document.body.contains(b)){b.disabled=true;b.textContent="سيجهز تلقائيًا بعد اكتمال النشر"}},2500);
      }
    }catch(e){console.warn("Ejazati update",e)}
  }

  function showUpdate(version,notes=""){
    if(!newerThan(version,VERSION)||isDismissed(version)){document.getElementById("liveUpdateNoticeV1210")?.remove();return}
    let box=document.getElementById("liveUpdateNoticeV1210");
    if(!box){box=document.createElement("div");box.id="liveUpdateNoticeV1210";box.className="liveUpdateNoticeV1210";document.body.appendChild(box)}
    const safe=typeof esc==="function"?esc(notes||"تحديث جديد جاهز."):(notes||"تحديث جديد جاهز.");
    box.innerHTML=`<b>✨ تحديث جديد لإجازاتي v${version}</b><p>${safe}</p><div class="updateActions"><button id="installLiveUpdateV1210" class="primaryUpdate" disabled>جاري تجهيز التحديث…</button><button id="dismissLiveUpdateV1210">لاحقًا</button></div>`;
    document.getElementById("dismissLiveUpdateV1210").onclick=()=>dismiss(version);
    prepareWorker();
  }

  async function checkVersion(){
    if(typeof session==="undefined"||!session?.user?.id||!navigator.onLine)return;
    try{
      const {data,error}=await client.from("ejazati_app_versions").select("version,release_notes,published_at").eq("channel","production").eq("status","published").order("published_at",{ascending:false,nullsFirst:false}).limit(1).maybeSingle();
      if(error||!data?.version)return;
      if(!newerThan(data.version,VERSION)){
        lastRemoteVersion=null;
        clearLegacyNotices();
        return;
      }
      if(!isDismissed(data.version)&&lastRemoteVersion!==data.version){
        lastRemoteVersion=data.version;showUpdate(data.version,data.release_notes||"");
      }
      if(!isDismissed(data.version))await prepareWorker();
    }catch(e){console.warn("Ejazati version check",e)}
  }

  function startChecks(){
    clearInterval(pollTimer);checkVersion();pollTimer=setInterval(checkVersion,60000);
    window.addEventListener("online",checkVersion);window.addEventListener("focus",checkVersion);
    document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")checkVersion()});
    if("serviceWorker" in navigator){
      navigator.serviceWorker.addEventListener("controllerchange",()=>location.reload());
      navigator.serviceWorker.addEventListener("message",e=>{if(e.data?.type==="EJAZATI_CHECK_UPDATE")checkVersion()});
    }
  }

  function b64(s){
    const p="=".repeat((4-s.length%4)%4),x=(s+p).replace(/-/g,"+").replace(/_/g,"/");
    return Uint8Array.from([...atob(x)].map(c=>c.charCodeAt(0)));
  }
  const standalone=()=>matchMedia("(display-mode: standalone)").matches||navigator.standalone===true;

  async function pushState(){
    if(!("serviceWorker" in navigator)||!("PushManager" in window)||!("Notification" in window))return"unsupported";
    if(Notification.permission==="denied")return"denied";
    try{const r=await navigator.serviceWorker.ready;return await r.pushManager.getSubscription()?"enabled":"available"}catch(_){return"available"}
  }

  async function refreshPushUI(){
    const s=document.getElementById("pushStatusV1210"),b=document.getElementById("enablePushV1210");if(!s||!b)return;
    const st=await pushState();
    if(st==="enabled"){s.textContent="✅ إشعارات التحديثات مفعلة على هذا الجهاز.";b.textContent="الإشعارات مفعلة";b.disabled=true}
    else if(st==="denied"){s.textContent="الإشعارات محظورة من إعدادات الجهاز.";b.textContent="الإشعارات محظورة";b.disabled=true}
    else if(st==="unsupported"){s.textContent="هذا المتصفح لا يدعم Web Push.";b.textContent="غير مدعوم";b.disabled=true}
    else{s.textContent=standalone()?"فعّلها مرة واحدة ليصلك إشعار بالتحديث حتى لو كان إجازاتي مغلقًا.":"على iPhone أضف إجازاتي إلى الشاشة الرئيسية أولًا.";b.textContent="🔔 تفعيل إشعارات التحديثات";b.disabled=false}
  }

  async function enablePush(){
    if(!standalone()&&/iPad|iPhone|iPod/.test(navigator.userAgent)){toast?.("أضف إجازاتي للشاشة الرئيسية أولًا");return}
    try{
      if(await Notification.requestPermission()!=="granted")return refreshPushUI();
      const reg=await navigator.serviceWorker.ready;
      let sub=await reg.pushManager.getSubscription();
      if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64(VAPID_PUBLIC_KEY)});
      const j=sub.toJSON();
      const {error}=await client.from("ejazati_push_subscriptions").upsert({user_id:session.user.id,endpoint:j.endpoint,p256dh:j.keys?.p256dh,auth_key:j.keys?.auth,user_agent:navigator.userAgent,updated_at:new Date().toISOString()},{onConflict:"user_id,endpoint"});
      if(error)throw error;toast?.("تم تفعيل إشعارات التحديثات");refreshPushUI();
    }catch(e){console.error(e);toast?.("تعذر تفعيل الإشعارات")}
  }

  function injectPushSettings(){
    const page=document.getElementById("settingsPage");
    if(!page||document.getElementById("pushSettingsV1210")||document.getElementById("pushSettingsV128"))return;
    const logout=[...page.querySelectorAll("button")].find(b=>(b.textContent||"").includes("تسجيل الخروج"));
    const sec=document.createElement("div");sec.className="section";sec.id="pushSettingsV1210";
    sec.innerHTML=`<div class="sectionHead"><h3>إشعارات التحديثات</h3><span>Push</span></div><div class="card pushSettingsV1210"><b style="font-size:12px">🔔 تنبيه تلقائي عند توفر إصدار جديد</b><div class="pushStatus" id="pushStatusV1210">جاري التحقق…</div><button class="ghost full" id="enablePushV1210">تفعيل الإشعارات</button></div>`;
    const target=logout?.closest(".section");target?page.insertBefore(sec,target):page.appendChild(sec);
    document.getElementById("enablePushV1210").onclick=enablePush;refreshPushUI();
  }

  function changelog(){
    const list=document.getElementById("changelogList");if(!list)return;
    list.querySelectorAll(".changelogItem h4 .sourceBadge,.changelogItem h4 .adminTag").forEach(b=>{const t=(b.textContent||"").trim();if(t==="الحالي"||t.toLowerCase()==="current")b.remove()});
    let item=document.getElementById("changelogV1210Local");
    if(!item){item=document.createElement("div");item.className="changelogItem";item.id="changelogV1210Local";item.innerHTML=`<h4><span>v${VERSION}</span></h4><p>إصلاح إشعار التحديث العالق وربط فاحص التحديثات برقم النسخة الفعلي.</p>`;list.prepend(item)}
    let newest=null,nv="0.0.0";
    [...list.querySelectorAll(".changelogItem")].forEach(r=>{const m=String(r.querySelector("h4")?.textContent||r.textContent).match(/(\d+\.\d+\.\d+)/);if(m&&newerThan(m[1],nv)){newest=r;nv=m[1]}});
    if(newest){const b=document.createElement("span");b.className="sourceBadge confirmed";b.textContent="الحالي";newest.querySelector("h4")?.appendChild(b)}
    document.querySelectorAll(".version").forEach(e=>e.innerHTML=`إجازاتي · <strong>v${VERSION}</strong> · Cloud Sync`);
  }

  function afterRender(){clearLegacyNotices();injectRefresh();startClock();injectPushSettings();changelog();refreshPushUI()}
  const old=typeof render==="function"?render:null;
  if(old)render=function(){old();setTimeout(afterRender,0)};

  function boot(){injectStyles();clearLegacyNotices();afterRender();startChecks()}
  document.readyState==="loading"?document.addEventListener("DOMContentLoaded",boot,{once:true}):boot();
  setTimeout(afterRender,300);setTimeout(afterRender,1000);
})();