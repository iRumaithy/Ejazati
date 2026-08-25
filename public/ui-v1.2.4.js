(() => {
  const VERSION = "1.2.4";
  const UAE_TZ = "Asia/Dubai";

  const LEAVE_COLORS = {
    annual:    { name: "سنوية",       color: "#52c7ff", soft: "rgba(82,199,255,.16)" },
    sick:      { name: "مرضية",       color: "#b99cff", soft: "rgba(185,156,255,.16)" },
    emergency: { name: "اضطرارية",    color: "#ff776b", soft: "rgba(255,119,107,.16)" },
    unpaid:    { name: "بدون راتب",   color: "#93a4bd", soft: "rgba(147,164,189,.16)" },
    mission:   { name: "مهمة / دورة", color: "#51d5a7", soft: "rgba(81,213,167,.16)" },
    other:     { name: "أخرى",        color: "#ff86be", soft: "rgba(255,134,190,.16)" }
  };

  const yearNow = () => Number(new Intl.DateTimeFormat("en", {
    year: "numeric",
    timeZone: UAE_TZ
  }).format(new Date()));

  function monthName(index) {
    return (typeof MONTHS !== "undefined" && MONTHS[index])
      ? MONTHS[index]
      : ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"][index];
  }

  function injectStyles() {
    if (document.getElementById("ejazatiV124")) return;
    const style = document.createElement("style");
    style.id = "ejazatiV124";
    style.textContent = `
      .calDay.leave-annual{background:linear-gradient(145deg,rgba(82,199,255,.22),rgba(82,199,255,.055))!important;outline:1px solid rgba(82,199,255,.74)!important;color:#eaf9ff!important;font-weight:900!important}
      .calDay.leave-sick{background:linear-gradient(145deg,rgba(185,156,255,.22),rgba(185,156,255,.055))!important;outline:1px solid rgba(185,156,255,.72)!important;color:#f0eaff!important;font-weight:900!important}
      .calDay.leave-emergency{background:linear-gradient(145deg,rgba(255,119,107,.22),rgba(255,119,107,.055))!important;outline:1px solid rgba(255,119,107,.72)!important;color:#ffe9e6!important;font-weight:900!important}
      .calDay.leave-unpaid{background:linear-gradient(145deg,rgba(147,164,189,.20),rgba(147,164,189,.05))!important;outline:1px solid rgba(147,164,189,.62)!important;color:#eef2f8!important;font-weight:900!important}
      .calDay.leave-mission{background:linear-gradient(145deg,rgba(81,213,167,.20),rgba(81,213,167,.05))!important;outline:1px solid rgba(81,213,167,.68)!important;color:#e8fff7!important;font-weight:900!important}
      .calDay.leave-other{background:linear-gradient(145deg,rgba(255,134,190,.20),rgba(255,134,190,.05))!important;outline:1px solid rgba(255,134,190,.68)!important;color:#fff0f7!important;font-weight:900!important}

      .calDay .leaveTypeDot{
        position:absolute;
        right:5px;
        bottom:4px;
        width:6px;
        height:6px;
        border-radius:50%;
        box-shadow:0 0 9px currentColor;
      }

      .leaveLegendWrap{
        display:flex;
        flex-direction:column;
        gap:8px;
        width:100%;
      }
      .leaveLegendGroup{
        display:flex;
        align-items:center;
        gap:7px;
        flex-wrap:wrap;
      }
      .leaveLegendLabel{
        color:#f4e2b1;
        font-size:9px;
        font-weight:800;
        margin-left:2px;
      }
      .leaveLegendChip{
        display:inline-flex;
        align-items:center;
        gap:5px;
        font-size:8.8px;
        color:var(--muted);
        white-space:nowrap;
      }
      .leaveLegendChip i{
        width:8px;
        height:8px;
        border-radius:50%;
        display:inline-block;
      }

      .carryAutoHelp{
        display:block;
        margin-top:6px;
        color:var(--muted);
        font-size:9.5px;
        line-height:1.65;
      }
      .carryLiveNote{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:8px;
        margin-top:7px;
        padding:7px 9px;
        border:1px solid rgba(217,182,95,.14);
        background:rgba(217,182,95,.05);
        border-radius:12px;
        color:#e9d595;
        font-size:9px;
      }

      .monthEventDot.leave-annual{background:#52c7ff!important}
      .monthEventDot.leave-sick{background:#b99cff!important}
      .monthEventDot.leave-emergency{background:#ff776b!important}
      .monthEventDot.leave-unpaid{background:#93a4bd!important}
      .monthEventDot.leave-mission{background:#51d5a7!important}
      .monthEventDot.leave-other{background:#ff86be!important}
    `;
    document.head.appendChild(style);
  }

  function getConsumptionForYear() {
    const year = yearNow();
    const startYear = new Date(year, 0, 1);
    const endYear = new Date(year, 11, 31);
    let used = 0;
    let reserved = 0;

    for (const leave of (leaves || [])) {
      if (!leave.deduct_from_balance) continue;
      let start = pd(leave.start_date);
      let end = pd(leave.end_date);

      if (end < startYear || start > endYear) continue;
      if (start < startYear) start = new Date(startYear);
      if (end > endYear) end = new Date(endYear);

      for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
        if (!isWorkday(day)) continue;
        if (day < TODAY) used += 1;
        else reserved += 1;
      }
    }
    return { used, reserved };
  }

  function setupCarryUI() {
    const carry = document.getElementById("carryBalance");
    const current = document.getElementById("currentBalanceInput");
    const expiry = document.getElementById("carryExpiry");
    if (!carry || !current) return;

    const carryField = carry.closest(".field");
    const expiryField = expiry?.closest(".field");

    if (carryField) {
      const label = carryField.querySelector("label");
      if (label) label.textContent = "الرصيد المرحّل";

      if (!carryField.querySelector(".carryAutoHelp")) {
        const help = document.createElement("small");
        help.className = "carryAutoHelp";
        help.textContent = "أي رصيد مرحّل تضيفه هنا يُضاف تلقائيًا إلى رصيدك الحالي فور الحفظ.";
        carryField.appendChild(help);
      }

      if (!carryField.querySelector(".carryLiveNote")) {
        const note = document.createElement("div");
        note.className = "carryLiveNote";
        note.innerHTML = '<span>↪️ ينعكس مباشرة على الرصيد الحالي</span><b id="carryDeltaPreview">+0 يوم</b>';
        carryField.appendChild(note);
      }
    }

    if (expiryField) {
      const label = expiryField.querySelector("label");
      if (label) label.textContent = "انتهاء الرصيد المرحّل (اختياري)";

      if (!expiryField.querySelector(".carryAutoHelp")) {
        const help = document.createElement("small");
        help.className = "carryAutoHelp";
        help.textContent = "اترك هذا الحقل فارغًا إذا كان الرصيد المرحّل لا يملك تاريخ انتهاء.";
        expiryField.appendChild(help);
      }
    }

    // If there was no carried balance before, do not inherit an old/stale expiry date.
    if (expiry && Number(settings?.carried_balance || 0) === 0 && carry.dataset.v124ExpiryInit !== "1") {
      carry.dataset.v124ExpiryInit = "1";
      expiry.value = "";
    }

    if (carry.dataset.v124Bound === "1") return;
    carry.dataset.v124Bound = "1";

    let originalCarry = Number(settings?.carried_balance || 0);
    let baseCurrent = Number(current.value || 0);

    carry.dataset.v124OriginalCarry = String(originalCarry);
    current.dataset.v124ManualBase = String(baseCurrent);

    const recalc = () => {
      const newCarry = Number(carry.value || 0);
      const manualBase = Number(current.dataset.v124ManualBase || baseCurrent);
      const delta = newCarry - originalCarry;
      current.value = String(Math.max(0, Math.round(manualBase + delta)));

      const preview = document.getElementById("carryDeltaPreview");
      if (preview) preview.textContent = `${delta >= 0 ? "+" : ""}${delta} يوم`;
    };

    carry.addEventListener("input", recalc);

    current.addEventListener("input", () => {
      const newCarry = Number(carry.value || 0);
      const delta = newCarry - originalCarry;
      const currentTyped = Number(current.value || 0);
      current.dataset.v124ManualBase = String(currentTyped - delta);
    });
  }

  function effectiveHolidayMap() {
    const map = new Map();
    (Array.isArray(holidays) ? holidays : []).forEach((h) => {
      const old = map.get(h.holiday_date);
      if (!old || (old.status !== "confirmed" && h.status === "confirmed")) {
        map.set(h.holiday_date, h);
      }
    });
    return map;
  }

  function leaveForDate(date) {
    return (leaves || []).find((item) => pd(item.start_date) <= date && pd(item.end_date) >= date);
  }

  function renderLegend() {
    let legend = document.getElementById("uaeHolidayLegend");
    if (!legend) {
      const grid = document.getElementById("calGrid");
      if (!grid) return;
      legend = document.createElement("div");
      legend.id = "uaeHolidayLegend";
      legend.className = "calendarLegend";
      grid.after(legend);
    }

    const leaveChips = Object.entries(LEAVE_COLORS).map(([key, meta]) =>
      `<span class="leaveLegendChip"><i style="background:${meta.color}"></i>${meta.name}</span>`
    ).join("");

    legend.innerHTML = `
      <div class="leaveLegendWrap">
        <div class="leaveLegendGroup">
          <span class="leaveLegendLabel">أنواع الإجازات:</span>
          ${leaveChips}
        </div>
        <div class="leaveLegendGroup">
          <span class="leaveLegendLabel">العطل:</span>
          <span class="leaveLegendChip"><i style="background:var(--gold2)"></i>رسمية مؤكدة</span>
          <span class="leaveLegendChip"><i style="background:#f3ad63"></i>رسمية متوقعة</span>
          <span class="leaveLegendChip"><i style="background:var(--purple)"></i>خاصة</span>
        </div>
      </div>`;
  }

  function renderMonthEventsColored() {
    const box = document.getElementById("monthEventsV122");
    if (!box) return;

    const year = calDate.getFullYear();
    const month = calDate.getMonth();
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    const events = [];

    (Array.isArray(holidays) ? holidays : []).forEach((h) => {
      const d = pd(h.holiday_date);
      if (d.getFullYear() !== year || d.getMonth() !== month) return;
      const color = h.official
        ? (h.status === "confirmed" ? "var(--gold2)" : "#f3ad63")
        : "var(--purple)";
      events.push({
        sort: h.holiday_date,
        color,
        title: `${d.getDate()} ${monthName(d.getMonth())} : ${h.name}`,
        note: h.official ? (h.status === "confirmed" ? "عطلة رسمية مؤكدة" : "عطلة رسمية متوقعة") : "عطلة خاصة"
      });
    });

    (leaves || []).forEach((l) => {
      let s = pd(l.start_date);
      let e = pd(l.end_date);
      if (e < monthStart || s > monthEnd) return;

      const visibleStart = s < monthStart ? monthStart : s;
      const visibleEnd = e > monthEnd ? monthEnd : e;
      const meta = LEAVE_COLORS[l.leave_type] || LEAVE_COLORS.other;
      const range = visibleStart.getTime() === visibleEnd.getTime()
        ? `${visibleStart.getDate()} ${monthName(visibleStart.getMonth())}`
        : `${visibleStart.getDate()} ${monthName(visibleStart.getMonth())} – ${visibleEnd.getDate()} ${monthName(visibleEnd.getMonth())}`;

      events.push({
        sort: ymd(visibleStart),
        color: meta.color,
        title: `${range} : ${l.title || meta.name}`,
        note: meta.name
      });
    });

    events.sort((a, b) => a.sort.localeCompare(b.sort));

    box.innerHTML = `
      <div class="monthEventsTitle">
        <b>أحداث ${monthName(month)}</b>
        <span>${events.length ? `${events.length} أحداث` : "لا توجد أحداث"}</span>
      </div>
      ${events.length
        ? events.map((e) => `
          <div class="monthEvent">
            <i class="monthEventDot" style="background:${e.color}"></i>
            <div class="monthEventText"><b>${esc(e.title)}</b><small>${esc(e.note)}</small></div>
          </div>`).join("")
        : '<div class="monthEventsEmpty">لا توجد إجازات أو عطل مسجلة في هذا الشهر.</div>'}
    `;
  }

  renderCalendar = function renderCalendarV124() {
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
    for (let i = 0; i < first.getDay(); i++) out += '<div class="calDay empty"></div>';

    const hMap = effectiveHolidayMap();

    for (let dayNum = 1; dayNum <= last.getDate(); dayNum++) {
      const date = new Date(calDate.getFullYear(), calDate.getMonth(), dayNum);
      const key = ymd(date);
      const holiday = hMap.get(key);
      const leave = leaveForDate(date);

      let classes = isWeekend(date) ? " weekend" : "";
      const titles = [];
      let holidayDot = "";
      let leaveDot = "";

      if (holiday) {
        if (holiday.official && holiday.status === "confirmed") classes += " uaeConfirmed";
        else if (holiday.official) classes += " uaeExpectedV122";
        else classes += " customHoliday";
        holidayDot = '<span class="holidayDot"></span>';
        titles.push(holiday.name);
      }

      if (leave) {
        const type = LEAVE_COLORS[leave.leave_type] ? leave.leave_type : "other";
        const meta = LEAVE_COLORS[type];

        if (!holiday) classes += ` leave-${type}`;
        leaveDot = `<span class="leaveTypeDot" style="background:${meta.color};color:${meta.color}"></span>`;
        titles.push(leave.title || meta.name);
      }

      const titleAttr = titles.length ? ` title="${esc(titles.join(" • "))}"` : "";
      out += `<div class="calDay${classes}"${titleAttr}>${dayNum}${holidayDot}${leaveDot}</div>`;
    }

    grid.innerHTML = out;
    renderLegend();

    // Let v1.2.2 create the month-event container if it has not been created yet.
    if (!document.getElementById("monthEventsV122")) {
      const legend = document.getElementById("uaeHolidayLegend");
      if (legend) {
        const box = document.createElement("div");
        box.id = "monthEventsV122";
        box.className = "monthEvents";
        legend.after(box);
      }
    }
    renderMonthEventsColored();
  };

  const previousRenderSettings = typeof renderSettings === "function" ? renderSettings : null;
  if (previousRenderSettings) {
    renderSettings = function renderSettingsV124() {
      previousRenderSettings();
      setupCarryUI();
    };
  }

  window.saveSettings = async function saveSettingsV124() {
    const username = String(document.getElementById("accountUsername")?.value || profile?.username || "").trim().toLowerCase();
    if (!/^[a-z0-9._-]{3,30}$/.test(username)) return toast("تحقق من اسم المستخدم");

    const profileRes = await client.from("ejazati_profiles").update({
      display_name: document.getElementById("displayName")?.value?.trim() || null,
      username,
      updated_at: new Date().toISOString()
    }).eq("id", session.user.id);

    if (profileRes.error) {
      return toast(profileRes.error.code === "23505" ? "اسم المستخدم مستخدم بالفعل" : "تعذر حفظ الحساب");
    }

    const oldCarry = Number(settings?.carried_balance || 0);
    const newCarry = Math.max(0, Number(document.getElementById("carryBalance")?.value || 0));
    const carryDelta = newCarry - oldCarry;

    const consumption = getConsumptionForYear();
    const oldOpening = Number(
      settings?.year_opening_balance ??
      (Number(settings?.base_balance || 0) + oldCarry)
    );

    // Carried balance is part of the current year's entitlement immediately.
    const newOpening = oldOpening + carryDelta;

    const currentRaw = document.getElementById("currentBalanceInput")?.value;
    const targetCurrent = currentRaw === "" || currentRaw == null
      ? null
      : Math.max(0, Number(currentRaw));

    const naturalCurrentAfterCarry = newOpening - consumption.used - consumption.reserved;
    const newAdjustment = Number.isFinite(targetCurrent)
      ? Math.round(targetCurrent - naturalCurrentAfterCarry)
      : Number(settings?.balance_adjustment || 0);

    const expiryValue = document.getElementById("carryExpiry")?.value || null;

    const settingRes = await client.from("ejazati_leave_settings").upsert({
      user_id: session.user.id,
      base_balance: Math.max(0, Number(document.getElementById("baseBalance")?.value || 0)),
      carried_balance: newCarry,
      carry_expiry: expiryValue,
      weekend_days: (document.getElementById("weekendDays")?.value || "6,0").split(",").map(Number),
      balance_year: settings?.balance_year || yearNow(),
      year_opening_balance: newOpening,
      balance_adjustment: newAdjustment,
      updated_at: new Date().toISOString()
    });

    if (settingRes.error) return toast("تعذر حفظ إعدادات الإجازة");

    profile.display_name = document.getElementById("displayName")?.value?.trim() || null;
    profile.username = username;

    await loadData();
    toast(carryDelta !== 0 ? "تم الحفظ وإضافة الرصيد المرحّل إلى رصيدك الحالي" : "تم حفظ الإعدادات");
  };

  function updateVersionUI() {
    document.querySelectorAll(".version").forEach((el) => {
      el.innerHTML = `إجازاتي · <strong>v${VERSION}</strong> · Cloud Sync`;
    });

    const changelog = document.getElementById("changelogList");
    if (changelog && !document.getElementById("changelogV124Local")) {
      const item = document.createElement("div");
      item.className = "changelogItem";
      item.id = "changelogV124Local";
      item.innerHTML = `
        <h4><span>v${VERSION}</span><span class="sourceBadge confirmed">الحالي</span></h4>
        <p>إضافة لون مستقل لكل نوع من أنواع الإجازات في التقويم.
الرصيد المرحّل يُضاف تلقائيًا إلى الرصيد الحالي عند حفظه.
تاريخ انتهاء الرصيد المرحّل أصبح اختياريًا بالكامل.</p>`;
      changelog.prepend(item);
    }
  }

  if (typeof render === "function") {
    const previousRender = render;
    render = function renderV124() {
      previousRender();
      setupCarryUI();
      renderCalendar();
      updateVersionUI();
    };
  }

  injectStyles();
  setTimeout(() => {
    try {
      setupCarryUI();
      renderCalendar();
      updateVersionUI();
    } catch (_) {}
  }, 250);
})();
