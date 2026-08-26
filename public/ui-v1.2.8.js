(() => {
  const VERSION = "1.2.8";
  const VAPID_PUBLIC_KEY = "BLBRgI1Jrj_QYLgFgNQ14fF6cKhNM3AXz1Q9qsUvKKHWqJMdPTZg2uOTqCfyiXbd4ZORkV-WrynQZgdEy0v0hlM";
  let updatePollTimer = null;
  let preparedRegistration = null;
  let lastSeenRemoteVersion = null;

  function injectStyles() {
    if (document.getElementById("ejazatiV128Styles")) return;
    const style = document.createElement("style");
    style.id = "ejazatiV128Styles";
    style.textContent = `
      .top{position:relative!important}
      .refreshBtnTop{
        width:38px;height:38px;padding:0;
        display:grid;place-items:center;
        border-radius:13px;
        border:1px solid rgba(217,182,95,.28);
        background:rgba(217,182,95,.07);
        color:#f2d77d;
        font-size:22px;
        line-height:1;
        -webkit-tap-highlight-color:transparent;
      }
      .refreshBtnTop:active{transform:scale(.94)}
      @media(min-width:431px){
        .top{grid-template-columns:1fr auto auto auto!important}
        .topBrand{grid-column:1!important;grid-row:1!important}
        .liveClock{grid-column:2!important;grid-row:1!important}
        .refreshBtnTop{grid-column:3!important;grid-row:1!important}
        .top>.avatar{grid-column:4!important;grid-row:1!important}
      }
      @media(max-width:430px){
        .top{grid-template-columns:1fr auto auto!important}
        .topBrand{grid-column:1!important;grid-row:1!important}
        .refreshBtnTop{grid-column:2!important;grid-row:1!important}
        .top>.avatar{grid-column:3!important;grid-row:1!important}
        .liveClock{grid-column:1/-1!important;grid-row:2!important}
      }

      .liveUpdateNoticeV128{
        position:fixed;z-index:88;
        left:50%;transform:translateX(-50%);
        bottom:calc(88px + env(safe-area-inset-bottom));
        width:min(570px,calc(100% - 22px));
        padding:13px;
        border-radius:18px;
        color:#061426;
        background:linear-gradient(135deg,#fff6d5,#f3d36c);
        box-shadow:0 16px 50px rgba(0,0,0,.38);
      }
      .liveUpdateNoticeV128 b{display:block;font-size:13px}
      .liveUpdateNoticeV128 p{font-size:10px;line-height:1.6;margin:5px 0 9px;color:#4d4324}
      .liveUpdateNoticeV128 .updateActions{display:flex;gap:7px;flex-wrap:wrap}
      .liveUpdateNoticeV128 button{
        border:1px solid rgba(6,20,38,.15);
        border-radius:11px;padding:8px 10px;
        color:#061426;background:rgba(255,255,255,.5);
        font-size:10px;font-weight:800;
      }
      .liveUpdateNoticeV128 button.primaryUpdate{background:#061426;color:#fff;border-color:#061426}
      .liveUpdateNoticeV128 button:disabled{opacity:.5}

      .pushSettingsV128{
        border:1px solid rgba(217,182,95,.18);
        background:linear-gradient(135deg,rgba(217,182,95,.09),rgba(82,199,255,.035));
      }
      .pushSettingsV128 .pushStatus{
        color:var(--muted);font-size:10px;line-height:1.65;margin:7px 0 11px;
      }

      /* Carry forward v1.2.6: only the mission dot is green. */
      .leaveLegendChip[data-leave-type="mission"]{
        color:var(--muted)!important;
        font-weight:400!important;
      }
      .leaveLegendChip[data-leave-type="mission"] i{background:#9BE15D!important}
    `;
    document.head.appendChild(style);
  }

  function injectRefreshButton() {
    const top = document.querySelector(".top");
    if (!top || document.getElementById("manualRefreshBtn")) return;

    const btn = document.createElement("button");
    btn.id = "manualRefreshBtn";
    btn.className = "refreshBtnTop";
    btn.type = "button";
    btn.title = "تحديث الصفحة";
    btn.setAttribute("aria-label", "تحديث الصفحة");
    btn.textContent = "↻";

    // Intentionally does only one thing: reload the current page.
    btn.addEventListener("click", () => window.location.reload());

    const settingsBtn = top.querySelector(".avatar");
    top.insertBefore(btn, settingsBtn || null);
  }

  function tickClock() {
    const timeEl = document.getElementById("liveTime");
    const dateEl = document.getElementById("liveDate");
    if (!timeEl && !dateEl) return;

    const now = new Date();
    if (timeEl) {
      timeEl.textContent = new Intl.DateTimeFormat("ar-AE", {
        timeZone:"Asia/Dubai",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:true
      }).format(now);
    }

    if (dateEl) {
      const p = {};
      new Intl.DateTimeFormat("en-GB", {
        timeZone:"Asia/Dubai",day:"2-digit",month:"2-digit",year:"numeric"
      }).formatToParts(now).forEach(x => { if (x.type !== "literal") p[x.type] = x.value; });
      dateEl.textContent = `${p.day}/${p.month}/${p.year}`;
    }
  }

  function startClockGuard() {
    tickClock();
    if (!window.__ejazatiClockV128) {
      window.__ejazatiClockV128 = setInterval(tickClock, 1000);
    }
  }

  function parseVersion(value) {
    const m = String(value || "").match(/(\d+)\.(\d+)\.(\d+)/);
    return m ? [Number(m[1]),Number(m[2]),Number(m[3])] : [0,0,0];
  }

  function newerThan(a,b) {
    const av=parseVersion(a), bv=parseVersion(b);
    for(let i=0;i<3;i++){
      if(av[i]!==bv[i]) return av[i] > bv[i];
    }
    return false;
  }

  function normalizeChangelogSafe() {
    const list = document.getElementById("changelogList");
    if (!list) return;

    // Remove stale current badges left by older versions.
    list.querySelectorAll(".changelogItem h4 .sourceBadge, .changelogItem h4 .adminTag").forEach(b => {
      const t=(b.textContent||"").trim();
      if(t==="الحالي" || t.toLowerCase()==="current") b.remove();
    });

    let item=document.getElementById("changelogV128Local");
    if(!item){
      item=document.createElement("div");
      item.className="changelogItem";
      item.id="changelogV128Local";
      item.innerHTML=`<h4><span>v${VERSION}</span></h4>
        <p>Hotfix للاستقرار: إزالة حلقة المراقبة التي سببت تجمد الصفحة، إضافة زر Refresh مستقل، وفحص التحديثات تلقائيًا مع دعم إشعارات Push.</p>`;
      list.prepend(item);
    }

    let newest=null, newestVersion="0.0.0";
    [...list.querySelectorAll(".changelogItem")].forEach(row=>{
      const text=row.querySelector("h4")?.textContent || row.textContent;
      const m=String(text).match(/(\d+\.\d+\.\d+)/);
      if(m && newerThan(m[1],newestVersion)){
        newest=row; newestVersion=m[1];
      }
    });

    if(newest){
      const badge=document.createElement("span");
      badge.className="sourceBadge confirmed";
      badge.textContent="الحالي";
      newest.querySelector("h4")?.appendChild(badge);
    }

    const hero=document.querySelector(".currentVersionHero");
    if(hero){
      const b=hero.querySelector("b"); if(b)b.textContent=`v${VERSION}`;
      const s=hero.querySelector("small"); if(s)s.textContent="أحدث إصدار مثبت على هذا الجهاز";
    }

    document.querySelectorAll(".version").forEach(el=>{
      el.innerHTML=`إجازاتي · <strong>v${VERSION}</strong> · Cloud Sync`;
    });
  }

  function showLiveUpdate(version, notes="") {
    if (!newerThan(version, VERSION)) return;

    let box=document.getElementById("liveUpdateNoticeV128");
    if(!box){
      box=document.createElement("div");
      box.id="liveUpdateNoticeV128";
      box.className="liveUpdateNoticeV128";
      document.body.appendChild(box);
    }

    box.innerHTML=`
      <b>✨ تحديث جديد لإجازاتي v${version}</b>
      <p>${esc(notes || "تحديث جديد جاهز. لا تحتاج إلى تحديث الصفحة لاكتشافه.")}</p>
      <div class="updateActions">
        <button id="installLiveUpdateV128" class="primaryUpdate" disabled>جاري تجهيز التحديث…</button>
        <button id="dismissLiveUpdateV128">لاحقًا</button>
      </div>`;

    document.getElementById("dismissLiveUpdateV128")?.addEventListener("click",()=>box.remove());

    prepareServiceWorkerUpdate();
  }

  async function prepareServiceWorkerUpdate() {
    if(!("serviceWorker" in navigator)) return;

    try{
      const reg=await navigator.serviceWorker.getRegistration();
      if(!reg) return;
      preparedRegistration=reg;

      const enableWaiting=()=>{
        const button=document.getElementById("installLiveUpdateV128");
        if(reg.waiting && button){
          button.disabled=false;
          button.textContent="تحديث الآن";
          button.onclick=()=>reg.waiting.postMessage({type:"SKIP_WAITING"});
        }
      };

      enableWaiting();

      reg.addEventListener("updatefound",()=>{
        const worker=reg.installing;
        if(!worker)return;
        worker.addEventListener("statechange",()=>{
          if(worker.state==="installed") enableWaiting();
        });
      },{once:true});

      await reg.update();
      enableWaiting();
    }catch(e){
      console.warn("Ejazati SW update check",e);
    }
  }

  async function checkPublishedVersion() {
    if(!session?.user?.id || !navigator.onLine) return;

    try{
      const {data,error}=await client
        .from("ejazati_app_versions")
        .select("version,release_notes,published_at")
        .eq("channel","production")
        .eq("status","published")
        .order("published_at",{ascending:false,nullsFirst:false})
        .limit(1)
        .maybeSingle();

      if(error || !data?.version) return;

      if(newerThan(data.version,VERSION)){
        if(lastSeenRemoteVersion!==data.version){
          lastSeenRemoteVersion=data.version;
          showLiveUpdate(data.version,data.release_notes||"");
        }
        await prepareServiceWorkerUpdate();
      }
    }catch(e){
      console.warn("Ejazati version poll",e);
    }
  }

  function startAutomaticUpdateChecks() {
    clearInterval(updatePollTimer);
    checkPublishedVersion();
    updatePollTimer=setInterval(checkPublishedVersion,60000);

    window.addEventListener("online",checkPublishedVersion);
    window.addEventListener("focus",checkPublishedVersion);
    document.addEventListener("visibilitychange",()=>{
      if(document.visibilityState==="visible") checkPublishedVersion();
    });

    if("serviceWorker" in navigator){
      navigator.serviceWorker.addEventListener("controllerchange",()=>window.location.reload());
      navigator.serviceWorker.addEventListener("message",e=>{
        if(e.data?.type==="EJAZATI_CHECK_UPDATE") checkPublishedVersion();
      });
    }
  }

  function urlBase64ToUint8Array(base64String) {
    const padding="=".repeat((4-base64String.length%4)%4);
    const base64=(base64String+padding).replace(/-/g,"+").replace(/_/g,"/");
    const raw=atob(base64);
    return Uint8Array.from([...raw].map(c=>c.charCodeAt(0)));
  }

  function isStandalone() {
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone===true;
  }

  async function pushSubscriptionState() {
    if(!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)){
      return "unsupported";
    }
    if(Notification.permission==="denied") return "denied";
    try{
      const reg=await navigator.serviceWorker.ready;
      const sub=await reg.pushManager.getSubscription();
      return sub ? "enabled" : "available";
    }catch(_){
      return "available";
    }
  }

  async function updatePushSettingsUI() {
    const status=document.getElementById("pushStatusV128");
    const button=document.getElementById("enablePushV128");
    if(!status || !button) return;

    const state=await pushSubscriptionState();

    if(state==="enabled"){
      status.textContent="✅ إشعارات التحديثات مفعلة على هذا الجهاز. ستصلك حتى عندما يكون التطبيق مغلقًا.";
      button.textContent="الإشعارات مفعلة";
      button.disabled=true;
    }else if(state==="denied"){
      status.textContent="الإشعارات محظورة من إعدادات الجهاز/المتصفح.";
      button.textContent="الإشعارات محظورة";
      button.disabled=true;
    }else if(state==="unsupported"){
      status.textContent="هذا المتصفح لا يدعم Web Push.";
      button.textContent="غير مدعوم";
      button.disabled=true;
    }else{
      status.textContent=isStandalone()
        ? "فعّلها مرة واحدة ليصلك إشعار بالتحديث حتى لو كان إجازاتي مغلقًا."
        : "على iPhone: أضف إجازاتي إلى الشاشة الرئيسية أولًا، ثم افتحه من الأيقونة لتفعيل الإشعارات.";
      button.textContent="🔔 تفعيل إشعارات التحديثات";
      button.disabled=false;
    }
  }

  function injectPushSettings() {
    const settingsPage=document.getElementById("settingsPage");
    if(!settingsPage || document.getElementById("pushSettingsV128")) return;

    const logoutBtn=[...settingsPage.querySelectorAll("button")].find(b=>(b.textContent||"").includes("تسجيل الخروج"));
    const logoutSection=logoutBtn?.closest(".section");

    const section=document.createElement("div");
    section.className="section";
    section.id="pushSettingsV128";
    section.innerHTML=`
      <div class="sectionHead"><h3>إشعارات التحديثات</h3><span>Push</span></div>
      <div class="card pushSettingsV128">
        <b style="font-size:12px">🔔 تنبيه تلقائي عند توفر إصدار جديد</b>
        <div class="pushStatus" id="pushStatusV128">جاري التحقق…</div>
        <button class="ghost full" id="enablePushV128" type="button">تفعيل الإشعارات</button>
      </div>`;

    if(logoutSection) settingsPage.insertBefore(section,logoutSection);
    else settingsPage.appendChild(section);

    document.getElementById("enablePushV128")?.addEventListener("click",enableUpdatePush);
    updatePushSettingsUI();
  }

  window.enableUpdatePush=async function enableUpdatePush(){
    if(!isStandalone() && /iPad|iPhone|iPod/.test(navigator.userAgent)){
      toast("أضف إجازاتي للشاشة الرئيسية أولًا ثم افتحه من الأيقونة");
      return;
    }

    try{
      const permission=await Notification.requestPermission();
      if(permission!=="granted"){
        await updatePushSettingsUI();
        return;
      }

      const reg=await navigator.serviceWorker.ready;
      let sub=await reg.pushManager.getSubscription();
      if(!sub){
        sub=await reg.pushManager.subscribe({
          userVisibleOnly:true,
          applicationServerKey:urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
      }

      const jsonSub=sub.toJSON();
      const {error}=await client.from("ejazati_push_subscriptions").upsert({
        user_id:session.user.id,
        endpoint:jsonSub.endpoint,
        p256dh:jsonSub.keys?.p256dh,
        auth_key:jsonSub.keys?.auth,
        user_agent:navigator.userAgent,
        updated_at:new Date().toISOString()
      },{onConflict:"user_id,endpoint"});

      if(error) throw error;
      toast("تم تفعيل إشعارات التحديثات");
      await updatePushSettingsUI();
    }catch(e){
      console.error("Ejazati push subscribe",e);
      toast("تعذر تفعيل الإشعارات");
    }
  };

  // When owner publishes a release through Ejazati, also send Web Push to subscribed devices.
  window.publishRelease=async function publishReleaseV128(id){
    const release=(releases||[]).find(r=>String(r.id)===String(id));
    if(!release) return toast("تعذر العثور على الإصدار");
    if(!confirm("سيتم تسجيل الإصدار كمنشور وإرسال إشعار التحديث للمستخدمين المشتركين. متابعة؟")) return;

    const {error}=await client.from("ejazati_app_versions").update({
      status:"published",
      channel:"production",
      published_at:new Date().toISOString()
    }).eq("id",id);

    if(error) return toast("تعذر تسجيل النشر");

    try{
      await client.functions.invoke("ejazati-push-update",{
        body:{version:release.version,notes:release.release_notes||"تحديث جديد جاهز لإجازاتي"}
      });
    }catch(e){
      console.warn("Push notify failed",e);
    }

    if(typeof loadAdmin==="function") await loadAdmin();
    if(typeof renderAdmin==="function") renderAdmin();
    toast("تم النشر وإرسال إشعارات التحديث");
  };

  const previousSignOut=typeof signOut==="function" ? signOut : null;
  if(previousSignOut){
    signOut=async function signOutV128(){
      try{
        if("serviceWorker" in navigator){
          const reg=await navigator.serviceWorker.ready;
          const sub=await reg.pushManager?.getSubscription();
          if(sub){
            const endpoint=sub.endpoint;
            await client.from("ejazati_push_subscriptions").delete()
              .eq("user_id",session.user.id)
              .eq("endpoint",endpoint);
            await sub.unsubscribe();
          }
        }
      }catch(_){}
      return previousSignOut();
    };
  }

  function stableAfterRender() {
    injectRefreshButton();
    startClockGuard();
    injectPushSettings();
    normalizeChangelogSafe();
    updatePushSettingsUI();
  }

  const previousRender=typeof render==="function" ? render : null;
  if(previousRender){
    render=function renderV128(){
      previousRender();
      setTimeout(stableAfterRender,0);
    };
  }

  function boot() {
    injectStyles();
    stableAfterRender();
    startAutomaticUpdateChecks();

    // Wait for restored session/data without blocking the UI.
    let tries=0;
    const wait=()=>{
      if(session?.user?.id){
        checkPublishedVersion();
        injectPushSettings();
        return;
      }
      if(++tries<50) setTimeout(wait,200);
    };
    wait();
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();

  setTimeout(stableAfterRender,300);
  setTimeout(stableAfterRender,1000);
})();