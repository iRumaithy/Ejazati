(() => {
  const VERSION = "1.2.9";
  const UAE_TZ = "Asia/Dubai";

  function injectStyles() {
    if (document.getElementById("ejazatiV129Today")) return;
    const style = document.createElement("style");
    style.id = "ejazatiV129Today";
    style.textContent = `
      .calDay.todayV129{
        position:relative!important;
        box-shadow:
          inset 0 0 0 2px rgba(255,255,255,.96),
          0 0 0 1px rgba(255,255,255,.16),
          0 0 13px rgba(255,255,255,.12)!important;
        font-weight:950!important;
        color:#fff!important;
      }
      .calDay.todayV129::after{
        content:"";
        position:absolute;
        inset:3px;
        border-radius:8px;
        border:1px solid rgba(255,255,255,.22);
        pointer-events:none;
      }
    `;
    document.head.appendChild(style);
  }

  function dubaiToday() {
    const parts = {};
    new Intl.DateTimeFormat("en-GB", {
      timeZone: UAE_TZ,
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }).formatToParts(new Date()).forEach(part => {
      if (part.type !== "literal") parts[part.type] = part.value;
    });
    return {day:Number(parts.day),month:Number(parts.month)-1,year:Number(parts.year)};
  }

  function markToday() {
    document.querySelectorAll("#calGrid .calDay.todayV129").forEach(cell => cell.classList.remove("todayV129"));
    if (typeof calDate === "undefined" || !calDate) return;
    const today = dubaiToday();
    if (calDate.getFullYear() !== today.year || calDate.getMonth() !== today.month) return;
    const target = [...document.querySelectorAll("#calGrid .calDay:not(.empty)")].find(cell => Number((cell.textContent || "").trim()) === today.day);
    if (target) target.classList.add("todayV129");
  }

  function updateVersionUI() {
    document.querySelectorAll(".version").forEach(el => {
      el.innerHTML = `إجازاتي · <strong>v${VERSION}</strong> · Cloud Sync`;
    });
    const list = document.getElementById("changelogList");
    if (list && !document.getElementById("changelogV129Local")) {
      const item = document.createElement("div");
      item.className = "changelogItem";
      item.id = "changelogV129Local";
      item.innerHTML = `<h4><span>v${VERSION}</span></h4><p>إضافة إطار أبيض/فضي حول تاريخ اليوم في التقويم لتمييزه بوضوح، دون استخدام نقطة أو تغيير لون الإجازة أو العطلة المسجلة في نفس اليوم.</p>`;
      list.prepend(item);
    }
  }

  function apply(){injectStyles();markToday();updateVersionUI();}

  if (typeof renderCalendar === "function") {
    const previousRenderCalendar = renderCalendar;
    renderCalendar = function renderCalendarV129(){previousRenderCalendar();requestAnimationFrame(markToday);};
  }
  if (typeof render === "function") {
    const previousRender = render;
    render = function renderV129(){previousRender();requestAnimationFrame(apply);};
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", apply, {once:true});
  else apply();
  setTimeout(markToday,300);
  setTimeout(markToday,1000);
  setInterval(markToday,60000);
})();