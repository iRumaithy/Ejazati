(() => {
  const VERSION=EjazatiCore.VERSION;
  window.EJAZATI_APP_VERSION=VERSION;
  const notes='إصلاح تعليق الدخول واستعادة كلمة المرور، وحماية الاستعادة من فقدان البيانات، وتضمين العطل الخاصة وتعديلاتها في النسخ، ومنع الخصم المكرر للإجازات المتداخلة، وتحديث اليوم تلقائيًا، وحماية التعديل بين الأجهزة وتحسين ثبات التحديثات.';
  function normalize(){
    document.querySelectorAll('.version').forEach(el=>{el.textContent=`إجازاتي · v${VERSION} · Cloud Sync`;});
    const hero=document.querySelector('.currentVersionHero b');if(hero)hero.textContent='v'+VERSION;
    const list=document.getElementById('changelogList');if(!list)return;
    list.querySelectorAll('.sourceBadge,.adminTag').forEach(b=>{if(b.textContent.trim()==='الحالي')b.remove();});
    let entry=document.getElementById('changelogV1212Local');
    if(!entry){entry=document.createElement('div');entry.id='changelogV1212Local';entry.className='changelogItem';list.prepend(entry);}
    entry.innerHTML=`<h4><span>v${VERSION}</span><span class="sourceBadge confirmed">الحالي</span></h4><p>${notes}</p>`;
  }
  const previous=render;
  render=function(){refreshToday();previous();setTimeout(normalize,0);};
  const style=document.createElement('style');
  style.textContent='@media(max-width:700px){.field input,.field select,.field textarea{font-size:16px!important}}';
  document.head.appendChild(style);
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',normalize,{once:true}):normalize();
  setTimeout(normalize,300);setTimeout(normalize,1000);
})();
