(() => {
  const VERSION = "1.2.7";

  function semver(text){
    const m = String(text || "").match(/v?(\d+)\.(\d+)\.(\d+)/i);
    return m ? [Number(m[1]),Number(m[2]),Number(m[3])] : null;
  }
  function cmp(a,b){
    for(let i=0;i<3;i++){ if(a[i]!==b[i]) return a[i]-b[i]; }
    return 0;
  }

  function normalizeChangelog(){
    const list = document.getElementById("changelogList");
    if(!list) return;

    // Remove stale "الحالي" badges from all rows.
    list.querySelectorAll(".changelogItem h4 .sourceBadge, .changelogItem h4 .adminTag")
      .forEach(b=>{
        const t=(b.textContent||"").trim();
        if(t==="الحالي" || t.toLowerCase()==="current") b.remove();
      });

    // Ensure v1.2.7 exists locally.
    let current = document.getElementById("changelogV127Local");
    if(!current){
      current=document.createElement("div");
      current.className="changelogItem";
      current.id="changelogV127Local";
      current.innerHTML=`<h4><span>v${VERSION}</span></h4>
      <p>تصحيح سجل التحديثات بحيث تظهر شارة «الحالي» على أحدث إصدار فقط، مع تحديث بطاقة الإصدار الحالي.</p>`;
      list.prepend(current);
    }

    // Detect highest version.
    let newest=null, newestV=null;
    [...list.querySelectorAll(".changelogItem")].forEach(item=>{
      const v=semver(item.querySelector("h4")?.textContent || item.textContent);
      if(v && (!newestV || cmp(v,newestV)>0)){ newest=item; newestV=v; }
    });

    if(newest){
      const h=newest.querySelector("h4");
      const badge=document.createElement("span");
      badge.className="sourceBadge confirmed";
      badge.textContent="الحالي";
      h?.appendChild(badge);
    }

    // Fix stale highlighted current-version card.
    const heroes=[...document.querySelectorAll(".currentVersionHero")];
    heroes.forEach((hero,i)=>{
      if(i>0){ hero.remove(); return; }
      const b=hero.querySelector("b"); if(b) b.textContent=`v${VERSION}`;
      const s=hero.querySelector("small"); if(s) s.textContent="أحدث إصدار مثبت على هذا الجهاز";
    });

    // v1.2.6 visual fix carried forward.
    document.querySelectorAll(".leaveLegendChip").forEach(chip=>{
      const t=(chip.textContent||"").trim();
      if(t.includes("مهمة") || t.includes("دورة")){
        chip.style.color="var(--muted)";
        chip.style.fontWeight="400";
        const dot=chip.querySelector("i");
        if(dot) dot.style.background="#9BE15D";
      }
    });

    document.querySelectorAll(".version").forEach(el=>{
      el.innerHTML=`إجازاتي · <strong>v${VERSION}</strong> · Cloud Sync`;
    });
  }

  const oldRender = typeof render==="function" ? render : null;
  if(oldRender){
    render=function(){
      oldRender();
      setTimeout(normalizeChangelog,0);
    };
  }

  const boot=()=>{
    normalizeChangelog();
    const settings=document.getElementById("settingsPage");
    if(settings){
      const obs=new MutationObserver(()=>normalizeChangelog());
      obs.observe(settings,{childList:true,subtree:true});
    }
  };

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();

  setTimeout(normalizeChangelog,300);
  setTimeout(normalizeChangelog,900);
})();