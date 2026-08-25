(() => {
  const VERSION = "1.2.2";
  const UAE_TZ = "Asia/Dubai";
  const EXPECTED_COLOR = "#f3ad63";

  const monthName = (index) => (typeof MONTHS !== "undefined" && MONTHS[index]) ? MONTHS[index] : [
    "يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"
  ][index];

  function injectStyles() {
    if (document.getElementById("ejazatiV122Fixes")) return;
    const style = document.createElement("style");
    style.id = "ejazatiV122Fixes";
    style.textContent = `
      /* Top date: force stable LTR dd/mm/yyyy rendering */
      #liveDate{
        direction:ltr!important;
        unicode-bidi:isolate!important;
        text-align:left!important;
        display:inline-block;
        font-variant-numeric:tabular-nums;
        letter-spacing:.25px;
      }

      /* Full month names in leave cards */
      .leaveItem{
        grid-template-columns:72px minmax(0,1fr) auto!important;
        gap:11px!important;
      }
      .dateBox{
        width:72px!important;
        min-width:72px!important;
        padding:8px 4px!important;
      }
      .dateBox span{
        display:block!important;
        font-size:10px!important;
        line-height:1.35!important;
        white-space:nowrap!important;
        overflow:visible!important;
        text-overflow:clip!important;
      }
      .leaveItem>div:nth-child(2){
        min-width:0!important;
      }

      /* Calendar semantics */
      .calDay.userAnnual{
        background:linear-gradient(145deg,rgba(82,199,255,.20),rgba(82,199,255,.06))!important;
        outline:1px solid rgba(82,199,255,.72)!important;
        color:#e9f8ff!important;
        font-weight:900!important;
      }
      .calDay.userAnnual .leaveDot{
        background:var(--cyan)!important;
        box-shadow:0 0 9px rgba(82,199,255,.72)!important;
      }
      .calDay.uaeExpectedV122{
        background:linear-gradient(145deg,rgba(243,173,99,.14),rgba(243,173,99,.035))!important;
        outline:1px dashed rgba(243,173,99,.68)!important;
        color:#ffe8cf!important;
        font-weight:800!important;
      }
      .calDay.uaeExpectedV122 .holidayDot{
        background:${EXPECTED_COLOR}!important;
        box-shadow:0 0 8px rgba(243,173,99,.65)!important;
      }
      .calDay .leaveDot{
        position:absolute;
        width:5px;height:5px;border-radius:50%;
        right:5px;bottom:4px;
      }

      /* Month events below calendar */
      .monthEvents{
        margin-top:13px;
        padding-top:12px;
        border-top:1px solid var(--line);
      }
      .monthEventsTitle{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
        margin-bottom:8px;
      }
      .monthEventsTitle b{
        font-size:11px;
        color:#f4e2b1;
      }
      .monthEventsTitle span{
        font-size:9px;
        color:var(--muted);
      }
      .monthEvent{
        display:grid;
        grid-template-columns:12px minmax(0,1fr);
        align-items:start;
        gap:8px;
        padding:8px 0;
        border-bottom:1px solid rgba(255,255,255,.045);
      }
      .monthEvent:last-child{border-bottom:0}
      .monthEventDot{
        width:7px;height:7px;border-radius:50%;
        margin-top:4px;
      }
      .monthEventText{
        min-width:0;
        font-size:10px;
        line-height:1.65;
        color:#e9eef7;
        overflow-wrap:anywhere;
      }
      .monthEventText b{
        color:#fff;
        font-weight:850;
      }
      .monthEventText small{
        display:block;
        color:var(--muted);
        margin-top:1px;
      }
      .monthEventsEmpty{
        padding:9px 0 2px;
        color:var(--muted);
        font-size:10px;
      }

      /* Legend */
      #uaeHolidayLegend{
        gap:10px!important;
      }

      /* Extra small screens */
      @media(max-width:390px){
        .leaveItem{
          grid-template-columns:66px minmax(0,1fr) auto!important;
          gap:8px!important;
        }
        .dateBox{
          width:66px!important;
          min-width:66px!important;
        }
        .dateBox span{font-size:9.5px!important}
      }
    `;
    document.head.appendChild(style);
  }

  function getDubaiParts(date = new Date()) {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: UAE_TZ,
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }).formatToParts(date);
    const out = {};
    parts.forEach((p) => { if (p.type !== "literal") out[p.type] = p.value; });
    return out;
  }

  function stableDubaiDate() {
    const p = getDubaiParts(new Date());
    return `${p.day}/${p.month}/${p.year}`;
  }

  function forceTopDate() {
    const el = document.getElementById("liveDate");
    if (!el) return;
    const wanted = stableDubaiDate();
    if (el.textContent !== wanted) el.textContent = wanted;
  }

  function watchTopDate() {
    forceTopDate();
    const el = document.getElementById("liveDate");
    if (!el || el.dataset.v122Observed === "1") return;
    el.dataset.v122Observed = "1";
    const observer = new MutationObserver(() => forceTopDate());
    observer.observe(el, { childList: true, characterData: true, subtree: true });
    setInterval(forceTopDate, 1000);
  }

  function fullLeaveHTML(leave) {
    const d = pd(leave.start_date);
    const meta = TYPES[leave.leave_type] || TYPES.other;
    const future = pd(leave.end_date) >= TODAY;
    return `<div class="leaveItem" onclick="openLeave('${leave.id}')">
      <div class="dateBox"><b>${d.getDate()}</b><span>${monthName(d.getMonth())}</span></div>
      <div>
        <h4>${meta.emoji} ${esc(leave.title || meta.name)}</h4>
        <p>${fmt(leave.start_date)} — ${fmt(leave.end_date)} · ${daySpan(leave.start_date,leave.end_date)} أيام · خصم ${deduction(leave)}</p>
      </div>
      <span class="badge ${future ? "future" : "done"}">${future ? "قادمة" : "منتهية"}</span>
    </div>`;
  }

  // Replace the original leave-card renderer so Arabic month names are never truncated.
  leaveHTML = fullLeaveHTML;

  function effectiveHolidayList() {
    return Array.isArray(holidays) ? holidays : [];
  }

  function holidayByDateMap() {
    const map = new Map();
    effectiveHolidayList().forEach((h) => {
      const existing = map.get(h.holiday_date);
      if (!existing || (existing.status !== "confirmed" && h.status === "confirmed")) {
        map.set(h.holiday_date, h);
      }
    });
    return map;
  }

  function dateRangeLabel(startYmd, endYmd) {
    const s = pd(startYmd);
    const e = pd(endYmd);
    const sameDay = startYmd === endYmd;
    const sameMonth = s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth();

    if (sameDay) return `${s.getDate()} ${monthName(s.getMonth())}`;
    if (sameMonth) return `${s.getDate()}–${e.getDate()} ${monthName(s.getMonth())}`;
    return `${s.getDate()} ${monthName(s.getMonth())} – ${e.getDate()} ${monthName(e.getMonth())}`;
  }

  function monthEvents() {
    const year = calDate.getFullYear();
    const month = calDate.getMonth();
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    const events = [];

    effectiveHolidayList().forEach((h) => {
      const d = pd(h.holiday_date);
      if (d.getFullYear() !== year || d.getMonth() !== month) return;
      events.push({
        sort: h.holiday_date,
        kind: h.official ? (h.status === "confirmed" ? "confirmed" : "expected") : "custom",
        label: `${d.getDate()} ${monthName(d.getMonth())}`,
        title: h.name,
        note: h.official
          ? (h.status === "confirmed" ? "عطلة رسمية مؤكدة" : "عطلة رسمية متوقعة")
          : "عطلة خاصة"
      });
    });

    (leaves || []).forEach((l) => {
      const s = pd(l.start_date);
      const e = pd(l.end_date);
      if (e < monthStart || s > monthEnd) return;

      const visibleStart = s < monthStart ? monthStart : s;
      const visibleEnd = e > monthEnd ? monthEnd : e;
      const type = TYPES[l.leave_type] || TYPES.other;

      events.push({
        sort: ymd(visibleStart),
        kind: l.leave_type === "annual" ? "annual" : "leave",
        label: dateRangeLabel(ymd(visibleStart), ymd(visibleEnd)),
        title: l.title || type.name,
        note: type.name
      });
    });

    return events.sort((a, b) => a.sort.localeCompare(b.sort) || a.title.localeCompare(b.title, "ar"));
  }

  function eventColor(kind) {
    if (kind === "confirmed") return "var(--gold2)";
    if (kind === "expected") return EXPECTED_COLOR;
    if (kind === "annual") return "var(--cyan)";
    if (kind === "custom") return "var(--purple)";
    return "#8fa3bf";
  }

  function renderMonthEvents() {
    const legend = document.getElementById("uaeHolidayLegend");
    if (!legend) return;

    let box = document.getElementById("monthEventsV122");
    if (!box) {
      box = document.createElement("div");
      box.id = "monthEventsV122";
      box.className = "monthEvents";
      legend.after(box);
    }

    const events = monthEvents();
    box.innerHTML = `
      <div class="monthEventsTitle">
        <b>أحداث ${monthName(calDate.getMonth())}</b>
        <span>${events.length ? `${events.length} ${events.length === 1 ? "حدث" : "أحداث"}` : "لا توجد أحداث"}</span>
      </div>
      ${events.length
        ? events.map((e) => `
          <div class="monthEvent">
            <i class="monthEventDot" style="background:${eventColor(e.kind)}"></i>
            <div class="monthEventText"><b>${esc(e.label)} : ${esc(e.title)}</b><small>${esc(e.note)}</small></div>
          </div>`).join("")
        : '<div class="monthEventsEmpty">لا توجد إجازات أو عطل مسجلة في هذا الشهر.</div>'}
    `;
  }

  function renderLegendV122() {
    const legend = document.getElementById("uaeHolidayLegend");
    if (!legend) return;
    legend.innerHTML = `
      <span><i style="background:var(--gold2)"></i> عطلة رسمية مؤكدة</span>
      <span><i style="background:var(--cyan)"></i> إجازة سنوية</span>
      <span><i style="background:${EXPECTED_COLOR}"></i> عطلة رسمية متوقعة</span>
      <span><i style="background:var(--purple)"></i> عطلة خاصة</span>`;
  }

  renderCalendar = function renderCalendarV122() {
    const title = document.getElementById("monthTitle");
    const grid = document.getElementById("calGrid");
    if (!title || !grid) return;

    title.textContent = `${monthName(calDate.getMonth())} ${calDate.getFullYear()}`;

    let out = "";
    ["ح","ن","ث","ر","خ","ج","س"].forEach((label) => {
      out += `<div class="calLabel">${label}</div>`;
    });

    const first = new Date(calDate.getFullYear(), calDate.getMonth(), 1);
    const last = new Date(calDate.getFullYear(), calDate.getMonth() + 1, 0);
    for (let i = 0; i < first.getDay(); i += 1) {
      out += '<div class="calDay empty"></div>';
    }

    const hMap = holidayByDateMap();

    for (let dayNum = 1; dayNum <= last.getDate(); dayNum += 1) {
      const date = new Date(calDate.getFullYear(), calDate.getMonth(), dayNum);
      const key = ymd(date);
      const holiday = hMap.get(key);
      const leave = (leaves || []).find((item) => pd(item.start_date) <= date && pd(item.end_date) >= date);

      let classes = isWeekend(date) ? " weekend" : "";
      let holidayDot = "";
      let leaveDot = "";
      const titles = [];

      if (holiday) {
        if (holiday.official && holiday.status === "confirmed") classes += " uaeConfirmed";
        else if (holiday.official) classes += " uaeExpectedV122";
        else classes += " customHoliday";
        holidayDot = '<span class="holidayDot"></span>';
        titles.push(holiday.name);
      }

      if (leave) {
        if (leave.leave_type === "annual") {
          // If the same day is an official holiday, keep the official holiday cell color
          // but still show a blue leave dot.
          if (!holiday) classes += " userAnnual";
          leaveDot = '<span class="leaveDot"></span>';
        } else {
          classes += ` ${TYPES[leave.leave_type]?.cls || ""}`;
        }
        titles.push(leave.title || TYPES[leave.leave_type]?.name || "إجازة");
      }

      const titleAttr = titles.length ? ` title="${esc(titles.join(" • "))}"` : "";
      out += `<div class="calDay${classes}"${titleAttr}>${dayNum}${holidayDot}${leaveDot}</div>`;
    }

    grid.innerHTML = out;

    let legend = document.getElementById("uaeHolidayLegend");
    if (!legend) {
      legend = document.createElement("div");
      legend.id = "uaeHolidayLegend";
      legend.className = "calendarLegend";
      grid.after(legend);
    }
    renderLegendV122();
    renderMonthEvents();
  };

  function addOneDay(ymdValue) {
    if (!ymdValue) return "";
    const [y, m, d] = ymdValue.split("-").map(Number);
    const date = new Date(y, m - 1, d, 12, 0, 0);
    date.setDate(date.getDate() + 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function syncLeaveEndFromStart(force = true) {
    const start = document.getElementById("leaveFrom");
    const end = document.getElementById("leaveTo");
    if (!start || !end || !start.value) return;

    const next = addOneDay(start.value);
    end.min = next;
    if (force || !end.value || end.value <= start.value) {
      end.value = next;
    }
    try { updateCalc(); } catch (_) {}
  }

  function bindLeaveDates() {
    const start = document.getElementById("leaveFrom");
    const end = document.getElementById("leaveTo");
    if (!start || !end) return;

    if (start.dataset.v122Bound !== "1") {
      start.dataset.v122Bound = "1";
      start.addEventListener("change", () => syncLeaveEndFromStart(true));
      start.addEventListener("input", () => {
        if (start.value && end.value && end.value <= start.value) syncLeaveEndFromStart(true);
      });
    }
  }

  if (typeof openLeave === "function") {
    const oldOpenLeave = openLeave;
    openLeave = function openLeaveV122(id) {
      oldOpenLeave(id);
      bindLeaveDates();
      if (!id) {
        setTimeout(() => syncLeaveEndFromStart(true), 0);
      } else {
        const start = document.getElementById("leaveFrom");
        const end = document.getElementById("leaveTo");
        if (start && end && start.value) end.min = addOneDay(start.value);
      }
    };
  }

  function updateVersionUI() {
    document.querySelectorAll(".version").forEach((el) => {
      el.innerHTML = `إجازاتي · <strong>v${VERSION}</strong> · Cloud Sync`;
    });

    const changelog = document.getElementById("changelogList");
    if (changelog && !document.getElementById("changelogV122Local")) {
      const item = document.createElement("div");
      item.className = "changelogItem";
      item.id = "changelogV122Local";
      item.innerHTML = `
        <h4><span>v${VERSION}</span><span class="sourceBadge confirmed">الحالي</span></h4>
        <p>ضبط تاريخ الشريط العلوي بصيغة dd/mm/yyyy.
الأزرق في التقويم أصبح مخصصًا للإجازة السنوية.
إضافة قائمة أحداث كل شهر أسفل التقويم.
تاريخ نهاية الإجازة ينتقل تلقائيًا لليوم التالي عند تغيير تاريخ البداية.
عرض أسماء الشهور كاملة في بطاقات الإجازات.</p>`;
      changelog.prepend(item);
    }
  }

  // Wrap the current render so every data refresh also applies v1.2.2.
  if (typeof render === "function") {
    const oldRender = render;
    render = function renderV122() {
      oldRender();
      watchTopDate();
      renderCalendar();
      updateVersionUI();
    };
  }

  injectStyles();
  bindLeaveDates();
  watchTopDate();

  // Refresh existing UI immediately if account/data are already loaded.
  const refresh = () => {
    try {
      if (typeof profile !== "undefined" && profile && typeof render === "function") {
        render();
      } else {
        renderCalendar();
        updateVersionUI();
      }
    } catch (_) {}
  };

  setTimeout(refresh, 150);
  setTimeout(refresh, 700);
})();
