(() => {
  const VERSION = "1.2.1";
  const UAE_TZ = "Asia/Dubai";
  let officialHolidays = [];
  let holidayOverrides = [];
  let customHolidays = [];
  let loading = false;
  let loadedOnce = false;

  const yearNow = () => Number(new Intl.DateTimeFormat("en", { year: "numeric", timeZone: UAE_TZ }).format(new Date()));
  const normalizeUsername = (value) => String(value || "").trim().toLowerCase();

  function lockMobileZoom() {
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement("meta");
      viewport.name = "viewport";
      document.head.appendChild(viewport);
    }
    viewport.setAttribute("content", "width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover");

    const stopGesture = (event) => event.preventDefault();
    ["gesturestart", "gesturechange", "gestureend"].forEach((name) => {
      document.addEventListener(name, stopGesture, { passive: false });
    });
    document.addEventListener("touchmove", (event) => {
      if (event.touches && event.touches.length > 1) event.preventDefault();
    }, { passive: false });
    document.addEventListener("dblclick", stopGesture, { passive: false });
  }

  function injectFixStyles() {
    if (document.getElementById("ejazatiV121Fixes")) return;
    const style = document.createElement("style");
    style.id = "ejazatiV121Fixes";
    style.textContent = `
      html,body{max-width:100%;overflow-x:hidden;-webkit-text-size-adjust:100%;}
      body{touch-action:pan-y;}
      *,*::before,*::after{box-sizing:border-box;}
      .app{width:100%;max-width:600px;overflow-x:clip;padding-bottom:calc(132px + env(safe-area-inset-bottom))!important;}
      .card,.goldPanel,.section,.field,.row2,.row2>*,.holidayRow,.holidayMeta,.holidayActions{min-width:0;max-width:100%;}
      .row2{grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;}
      .field input,.field select,.field textarea{display:block;width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important;}
      .field input[type="date"]{
        direction:ltr!important;text-align:right!important;-webkit-appearance:none!important;appearance:none!important;
        min-height:52px!important;padding-inline:14px!important;color-scheme:dark;
      }
      .field input[type="date"]::-webkit-date-and-time-value{display:block;width:100%;text-align:right;margin:0;}
      .field input[type="date"]::-webkit-calendar-picker-indicator{opacity:0;width:0;height:0;padding:0;margin:0;}
      .field select{padding-inline:14px 34px!important;}
      .top,.topBrand,.liveClock{max-width:100%;min-width:0;}
      .topBrand{overflow:hidden;}.topBrand>div{min-width:0;}.topBrand h1{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
      .holidayTop{min-width:0;}.holidayMeta{flex:1 1 auto;}.holidayMeta b,.holidayMeta small{overflow-wrap:anywhere;}
      .holidayActions{flex:0 0 auto;}
      .balanceCurrentField{margin-top:2px;padding:12px;border-radius:17px;border:1px solid rgba(217,182,95,.18);background:linear-gradient(145deg,rgba(217,182,95,.07),rgba(255,255,255,.02));}
      .balanceCurrentField label{display:flex!important;align-items:center;justify-content:space-between;gap:8px;}
      .balanceCurrentField label span{font-size:9px;color:var(--gold2);border:1px solid rgba(217,182,95,.18);border-radius:999px;padding:3px 7px;white-space:nowrap;}
      .balanceCurrentHelp{display:flex;align-items:flex-start;justify-content:space-between;gap:9px;margin-top:8px;}
      .balanceCurrentHelp small{color:var(--muted);font-size:9.5px;line-height:1.65;flex:1;}
      .baseBalanceHelp{display:block;color:var(--muted);font-size:9.5px;line-height:1.6;margin-top:6px;}
      .calendarLegend{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:12px;padding-top:11px;border-top:1px solid var(--line);color:var(--muted);font-size:9px;}
      .calendarLegend span{display:inline-flex;align-items:center;gap:5px;}
      .calendarLegend i{width:8px;height:8px;border-radius:50%;display:inline-block;}
      .calDay{position:relative;overflow:hidden;}
      .calDay.uaeConfirmed{background:linear-gradient(145deg,rgba(242,217,139,.22),rgba(217,182,95,.08))!important;outline:1px solid rgba(242,217,139,.78)!important;color:#fff7dc!important;font-weight:900;}
      .calDay.uaeExpected{background:linear-gradient(145deg,rgba(82,199,255,.15),rgba(82,199,255,.045))!important;outline:1px dashed rgba(82,199,255,.58)!important;color:#dff5ff!important;font-weight:800;}
      .calDay.customHoliday{background:linear-gradient(145deg,rgba(185,156,255,.14),rgba(185,156,255,.04))!important;outline:1px solid rgba(185,156,255,.48)!important;}
      .calDay .holidayDot{position:absolute;width:5px;height:5px;border-radius:50%;left:5px;bottom:4px;background:var(--gold2);box-shadow:0 0 8px rgba(242,217,139,.65);}
      .calDay.uaeExpected .holidayDot{background:var(--cyan);box-shadow:0 0 8px rgba(82,199,255,.65);}
      .holidayCountSummary{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:10px 0 2px;padding:9px 11px;border-radius:13px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.055);font-size:10px;color:var(--muted);}
      .holidayCountSummary b{color:var(--gold2);font-size:11px;}
      .holidayLoadError{padding:14px;text-align:center;color:#ffd3da;font-size:10px;line-height:1.7;}
      .version strong{color:var(--gold2);}
      @media(max-width:480px){
        .row2{grid-template-columns:minmax(0,1fr)!important;gap:10px!important;}
        .row2 .field{margin-bottom:0!important;}
        .holidayTop{align-items:center!important;}
        .holidayActions .mini{padding:7px 8px!important;}
        .top{margin-inline:0!important;}
      }
      @media(max-width:360px){
        .topBrand img{width:42px!important;height:42px!important;}
        .topBrand h1{font-size:18px!important;}
        .liveClock{min-width:0!important;}
      }
    `;
    document.head.appendChild(style);
  }

  function restructureBalanceFields() {
    const oldPanel = document.querySelector(".balanceAdjustPanel");
    if (oldPanel) oldPanel.remove();

    const baseInput = document.getElementById("baseBalance");
    const baseField = baseInput?.closest(".field");
    if (!baseField) return;

    const baseLabel = baseField.querySelector("label");
    if (baseLabel) baseLabel.textContent = "الرصيد الأساسي السنوي";
    if (!baseField.querySelector(".baseBalanceHelp")) {
      const help = document.createElement("small");
      help.className = "baseBalanceHelp";
      help.textContent = "رصيد الاستحقاق الثابت الذي يبدأ به كل عام جديد قبل إضافة الرصيد المرحّل.";
      baseField.appendChild(help);
    }

    if (!document.getElementById("currentBalanceInput")) {
      const field = document.createElement("div");
      field.className = "field balanceCurrentField";
      field.id = "currentBalanceFieldV121";
      field.innerHTML = `
        <label>الرصيد الحالي <span id="balanceYearText">سنة —</span></label>
        <input id="currentBalanceInput" type="number" min="0" step="1" inputmode="numeric">
        <div class="balanceCurrentHelp">
          <small>يمكن تعديله يدويًا. بعد إضافة أو حذف إجازة من رصيدك يتحدث تلقائيًا، بينما يبقى الرصيد الأساسي أعلاه ثابتًا.</small>
          <button type="button" class="ghost mini" onclick="resetCurrentYearBalance()">إعادة احتساب</button>
        </div>`;
      baseField.after(field);
    }
  }

  function injectCalendarLegend() {
    const grid = document.getElementById("calGrid");
    if (!grid || document.getElementById("uaeHolidayLegend")) return;
    const legend = document.createElement("div");
    legend.id = "uaeHolidayLegend";
    legend.className = "calendarLegend";
    legend.innerHTML = `
      <span><i style="background:var(--gold2)"></i> عطلة رسمية مؤكدة</span>
      <span><i style="background:var(--cyan)"></i> عطلة رسمية متوقعة</span>
      <span><i style="background:var(--purple)"></i> عطلة خاصة</span>`;
    grid.after(legend);
  }

  function effectiveOfficialHolidays() {
    const overrideById = new Map(holidayOverrides.map((item) => [item.official_holiday_id, item]));
    const byDate = new Map();

    [...officialHolidays]
      .sort((a, b) => {
        const ar = a.status === "confirmed" ? 0 : 1;
        const br = b.status === "confirmed" ? 0 : 1;
        return a.holiday_date.localeCompare(b.holiday_date) || ar - br;
      })
      .forEach((holiday) => {
        const override = overrideById.get(holiday.id);
        if (override?.is_disabled) return;

        const item = {
          id: `official:${holiday.id}`,
          official_id: holiday.id,
          holiday_date: override?.override_date || holiday.holiday_date,
          name: override?.override_name || holiday.name_ar,
          official: true,
          status: holiday.status,
          source_name: holiday.source_name,
          source_url: holiday.source_url,
          source_kind: holiday.source_kind,
          source_note: holiday.source_note,
          original_date: holiday.holiday_date,
          overridden: Boolean(override)
        };

        const existing = byDate.get(item.holiday_date);
        if (!existing || (existing.status !== "confirmed" && item.status === "confirmed")) {
          byDate.set(item.holiday_date, item);
        }
      });

    return [...byDate.values()];
  }

  function allEffectiveHolidays() {
    return [
      ...effectiveOfficialHolidays(),
      ...customHolidays.map((h) => ({ ...h, official: false, status: "custom" }))
    ];
  }

  function consumptionForCurrentYear() {
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

  totals = function totalsV121() {
    const consumption = consumptionForCurrentYear();
    const opening = Number(settings?.year_opening_balance ?? (Number(settings?.base_balance || 0) + Number(settings?.carried_balance || 0)));
    const adjustment = Number(settings?.balance_adjustment || 0);
    const effectiveEntitlement = opening + adjustment;
    const available = effectiveEntitlement - consumption.used - consumption.reserved;
    return {
      total: effectiveEntitlement,
      used: consumption.used,
      reserved: consumption.reserved,
      available: Math.max(0, available),
      rawAvailable: available,
      opening,
      adjustment
    };
  };

  async function freshLoad() {
    if (loading || !session?.user?.id || !profile?.id) return;
    loading = true;
    const uid = session.user.id;
    try {
      try { await client.rpc("ejazati_ensure_current_year"); } catch (_) {}
      const year = yearNow();
      const [s, l, c, v, o, ov] = await Promise.all([
        client.from("ejazati_leave_settings").select("*").eq("user_id", uid).single(),
        client.from("ejazati_leaves").select("*").eq("user_id", uid).order("start_date", { ascending: false }),
        client.from("ejazati_holidays").select("*").eq("user_id", uid).order("holiday_date"),
        client.from("ejazati_app_versions").select("*").order("created_at", { ascending: false }),
        client.from("ejazati_official_holidays").select("*").gte("holiday_year", year - 1).lte("holiday_year", year + 2).order("holiday_date"),
        client.from("ejazati_holiday_overrides").select("*").eq("user_id", uid)
      ]);

      settings = s.data || { user_id: uid, base_balance: 30, carried_balance: 0, weekend_days: [6, 0], balance_year: year, year_opening_balance: 30, balance_adjustment: 0 };
      leaves = l.data || [];
      customHolidays = c.data || [];
      releases = v.data || [];
      officialHolidays = o.data || [];
      holidayOverrides = ov.data || [];

      // Fallback: if a new year was opened before the daily sync ran, request an immediate sync once.
      if (!o.error && officialHolidays.length === 0) {
        try {
          await fetch(`${SUPABASE_URL}/functions/v1/ejazati-holidays-sync?year=${year}`, {
            method: "POST",
            headers: { "apikey": SUPABASE_KEY, "Content-Type": "application/json" },
            body: JSON.stringify({ year })
          });
          const retry = await client.from("ejazati_official_holidays").select("*").gte("holiday_year", year - 1).lte("holiday_year", year + 2).order("holiday_date");
          if (!retry.error) officialHolidays = retry.data || [];
        } catch (_) {}
      }

      holidays = allEffectiveHolidays();

      if (o.error) console.error("Ejazati official holidays", o.error);
      if (ov.error) console.error("Ejazati holiday overrides", ov.error);
      if (profile.role === "owner") await loadAdmin();
      loadedOnce = true;
      render();
    } finally {
      loading = false;
    }
  }

  loadData = freshLoad;

  const previousRenderSettings = renderSettings;
  renderSettings = function renderSettingsV121() {
    if (typeof previousRenderSettings === "function") previousRenderSettings();
    restructureBalanceFields();

    const baseInput = document.getElementById("baseBalance");
    if (baseInput) baseInput.value = settings?.base_balance ?? 30;

    const currentInput = document.getElementById("currentBalanceInput");
    if (currentInput) currentInput.value = Math.max(0, totals().rawAvailable);

    const yearText = document.getElementById("balanceYearText");
    if (yearText) yearText.textContent = `سنة ${settings?.balance_year || yearNow()}`;

    renderHolidayList();
  };

  window.saveSettings = async function saveSettingsV121() {
    const usernameInput = document.getElementById("accountUsername");
    const username = normalizeUsername(usernameInput?.value || profile?.username || "");
    if (!/^[a-z0-9._-]{3,30}$/.test(username)) return toast("تحقق من اسم المستخدم");

    const profileRes = await client.from("ejazati_profiles").update({
      display_name: document.getElementById("displayName")?.value?.trim() || null,
      username,
      updated_at: new Date().toISOString()
    }).eq("id", session.user.id);
    if (profileRes.error) return toast(profileRes.error.code === "23505" ? "اسم المستخدم مستخدم بالفعل" : "تعذر حفظ الحساب");

    const consumption = consumptionForCurrentYear();
    const opening = Number(settings?.year_opening_balance ?? (Number(settings?.base_balance || 0) + Number(settings?.carried_balance || 0)));
    const currentRaw = document.getElementById("currentBalanceInput")?.value;
    const targetCurrent = currentRaw === "" || currentRaw == null ? null : Number(currentRaw);
    const naturalCurrent = opening - consumption.used - consumption.reserved;
    const adjustment = Number.isFinite(targetCurrent) ? Math.round(targetCurrent - naturalCurrent) : Number(settings?.balance_adjustment || 0);

    const settingRes = await client.from("ejazati_leave_settings").upsert({
      user_id: session.user.id,
      base_balance: Number(document.getElementById("baseBalance")?.value || 0),
      carried_balance: Number(document.getElementById("carryBalance")?.value || 0),
      carry_expiry: document.getElementById("carryExpiry")?.value || null,
      weekend_days: (document.getElementById("weekendDays")?.value || "6,0").split(",").map(Number),
      balance_year: settings?.balance_year || yearNow(),
      year_opening_balance: opening,
      balance_adjustment: adjustment,
      updated_at: new Date().toISOString()
    });
    if (settingRes.error) return toast("تعذر حفظ إعدادات الإجازة");

    profile.display_name = document.getElementById("displayName")?.value?.trim() || null;
    profile.username = username;
    await freshLoad();
    toast("تم حفظ الإعدادات");
  };

  window.resetCurrentYearBalance = async function resetCurrentYearBalanceV121() {
    if (!confirm("إعادة الرصيد الحالي إلى احتساب الرصيد الأساسي + المرحّل، مع احتساب الإجازات المسجلة؟")) return;
    const base = Number(document.getElementById("baseBalance")?.value || 0);
    const carried = Number(document.getElementById("carryBalance")?.value || 0);
    const expiry = document.getElementById("carryExpiry")?.value || null;
    const validCarry = carried > 0 && (!expiry || expiry >= `${yearNow()}-01-01`) ? carried : 0;

    const { error } = await client.from("ejazati_leave_settings").update({
      base_balance: base,
      carried_balance: carried,
      carry_expiry: expiry,
      weekend_days: (document.getElementById("weekendDays")?.value || "6,0").split(",").map(Number),
      balance_year: yearNow(),
      year_opening_balance: base + validCarry,
      balance_adjustment: 0,
      updated_at: new Date().toISOString()
    }).eq("user_id", session.user.id);
    if (error) return toast("تعذر إعادة احتساب الرصيد");
    await freshLoad();
    toast("تمت إعادة احتساب الرصيد الحالي");
  };

  renderCalendar = function renderCalendarV121() {
    const title = document.getElementById("monthTitle");
    const grid = document.getElementById("calGrid");
    if (!title || !grid) return;

    title.textContent = `${MONTHS[calDate.getMonth()]} ${calDate.getFullYear()}`;
    let out = "";
    ["ح", "ن", "ث", "ر", "خ", "ج", "س"].forEach((label) => { out += `<div class="calLabel">${label}</div>`; });

    const first = new Date(calDate.getFullYear(), calDate.getMonth(), 1);
    const last = new Date(calDate.getFullYear(), calDate.getMonth() + 1, 0);
    for (let i = 0; i < first.getDay(); i += 1) out += '<div class="calDay empty"></div>';

    const holidayMap = new Map();
    allEffectiveHolidays().forEach((h) => {
      if (!holidayMap.has(h.holiday_date) || h.status === "confirmed") holidayMap.set(h.holiday_date, h);
    });

    for (let dayNum = 1; dayNum <= last.getDate(); dayNum += 1) {
      const date = new Date(calDate.getFullYear(), calDate.getMonth(), dayNum);
      const key = ymd(date);
      const holiday = holidayMap.get(key);
      const leave = (leaves || []).find((item) => pd(item.start_date) <= date && pd(item.end_date) >= date);
      let classes = isWeekend(date) ? " weekend" : "";

      if (holiday) {
        if (holiday.official && holiday.status === "confirmed") classes += " uaeConfirmed";
        else if (holiday.official) classes += " uaeExpected";
        else classes += " customHoliday";
      }
      if (leave) classes += ` ${TYPES[leave.leave_type]?.cls || ""}`;

      const titleText = holiday ? ` title="${esc(holiday.name)}"` : "";
      out += `<div class="calDay${classes}"${titleText}>${dayNum}${holiday ? '<span class="holidayDot"></span>' : ""}</div>`;
    }

    grid.innerHTML = out;
    injectCalendarLegend();
  };

  function renderHolidayList() {
    const list = document.getElementById("holidayList");
    if (!list) return;
    const year = yearNow();
    const all = allEffectiveHolidays()
      .filter((h) => pd(h.holiday_date).getFullYear() === year)
      .sort((a, b) => a.holiday_date.localeCompare(b.holiday_date));

    const syncInfo = document.getElementById("holidaySyncInfo");
    if (syncInfo) {
      const badge = syncInfo.querySelector(".syncBadge");
      if (badge) badge.textContent = `${all.filter((h) => h.official).length} يوم عطلة في ${year}`;
    }

    if (!loadedOnce && !all.length) {
      list.innerHTML = '<div class="holidayLoadError">جاري تحميل تقويم العطلات الرسمية…</div>';
      return;
    }

    const summary = `<div class="holidayCountSummary"><span>تقويم دولة الإمارات لسنة ${year}</span><b>${all.filter((h) => h.official).length} يوم رسمي</b></div>`;
    const rows = all.map((h) => {
      if (h.official) {
        const badge = h.status === "confirmed" ? "مؤكدة رسميًا" : "متوقعة";
        const badgeClass = h.status === "confirmed" ? "confirmed" : "expected";
        const sourceLink = h.source_url ? `<a href="${esc(h.source_url)}" target="_blank" rel="noopener">المصدر ↗</a>` : "";
        return `<div class="holidayRow"><div class="holidayTop"><div class="holidayMeta"><b>${esc(h.name)}</b><small>${fmt(h.holiday_date)}${h.overridden ? " · معدل لحسابك" : ""}</small></div><div class="holidayActions"><button class="mini ghost" onclick="openHolidayOverride('${h.official_id}')">تحرير</button></div></div><div class="holidaySource"><span class="sourceBadge ${badgeClass}">${badge}</span><span class="sourceBadge">${esc(h.source_name || "مصدر موثوق")}</span>${sourceLink}</div></div>`;
      }
      return `<div class="holidayRow"><div class="holidayTop"><div class="holidayMeta"><b>${esc(h.name)}</b><small>${fmt(h.holiday_date)}</small></div><div class="holidayActions"><button class="mini danger" onclick="removeHoliday('${h.id}')">حذف</button></div></div><div class="holidaySource"><span class="sourceBadge custom">عطلة خاصة</span></div></div>`;
    }).join("");

    list.innerHTML = summary + (rows || '<div class="holidayLoadError">تعذر العثور على عطل لهذه السنة. حاول تحديث الصفحة.</div>');
  }

  window.openHolidayOverride = function openHolidayOverrideV121(id) {
    const holiday = officialHolidays.find((item) => item.id === id);
    if (!holiday) return;
    const override = holidayOverrides.find((item) => item.official_holiday_id === id);
    const idInput = document.getElementById("holidayOfficialId");
    const nameInput = document.getElementById("holidayOverrideName");
    const dateInput = document.getElementById("holidayOverrideDate");
    const disabledInput = document.getElementById("holidayOverrideDisabled");
    if (!idInput || !nameInput || !dateInput || !disabledInput) return;

    idInput.value = id;
    nameInput.value = override?.override_name || holiday.name_ar;
    dateInput.value = override?.override_date || holiday.holiday_date;
    disabledInput.checked = Boolean(override?.is_disabled);

    const src = document.getElementById("holidayOverrideSource");
    if (src) {
      src.innerHTML = `<div class="panelTitle"><span>${holiday.status === "confirmed" ? "✅ مصدر رسمي" : "🕓 تاريخ متوقع"}</span><span class="sourceBadge ${holiday.status}">${esc(holiday.source_name || "")}</span></div><small>${esc(holiday.source_note || "")}</small>${holiday.source_url ? `<div style="margin-top:8px"><a style="color:var(--gold2);font-size:10px;text-decoration:none" href="${esc(holiday.source_url)}" target="_blank" rel="noopener">فتح المصدر ↗</a></div>` : ""}`;
    }
    document.getElementById("holidayOverrideModal")?.classList.add("open");
  };

  window.saveHolidayOverride = async function saveHolidayOverrideV121() {
    const id = document.getElementById("holidayOfficialId")?.value;
    const holiday = officialHolidays.find((item) => item.id === id);
    if (!holiday) return;
    const name = document.getElementById("holidayOverrideName")?.value?.trim();
    const date = document.getElementById("holidayOverrideDate")?.value;
    if (!name || !date) return toast("تحقق من الاسم والتاريخ");

    const { error } = await client.from("ejazati_holiday_overrides").upsert({
      user_id: session.user.id,
      official_holiday_id: id,
      override_name: name === holiday.name_ar ? null : name,
      override_date: date === holiday.holiday_date ? null : date,
      is_disabled: Boolean(document.getElementById("holidayOverrideDisabled")?.checked),
      updated_at: new Date().toISOString()
    }, { onConflict: "user_id,official_holiday_id" });
    if (error) return toast("تعذر حفظ تعديل العطلة");
    document.getElementById("holidayOverrideModal")?.classList.remove("open");
    await freshLoad();
    toast("تم حفظ تعديل العطلة");
  };

  window.resetHolidayOverride = async function resetHolidayOverrideV121() {
    const id = document.getElementById("holidayOfficialId")?.value;
    if (!id) return;
    const { error } = await client.from("ejazati_holiday_overrides").delete().eq("user_id", session.user.id).eq("official_holiday_id", id);
    if (error) return toast("تعذر استعادة العطلة");
    document.getElementById("holidayOverrideModal")?.classList.remove("open");
    await freshLoad();
    toast("تمت استعادة العطلة الرسمية");
  };

  function renderChangelogV121() {
    const list = document.getElementById("changelogList");
    if (!list) return;
    const notes = [
      "قفل التكبير بالإصبع Pinch to Zoom لثبات الاستخدام على الجوال.",
      "إصلاح الحقول المتداخلة وخروج عناصر التاريخ من الصناديق على iPhone.",
      "إظهار عطلات الإمارات الرسمية داخل التقويم بألوان واضحة وفي صفحة الإعدادات.",
      "فصل الرصيد الأساسي السنوي عن الرصيد الحالي القابل للتعديل والمتزامن مع الإجازات."
    ];

    const rows = [{ version: VERSION, status: "current", release_notes: `• ${notes.join("\n• ")}` }];
    const seen = new Set([VERSION]);
    for (const release of (releases || [])) {
      if (seen.has(release.version)) continue;
      seen.add(release.version);
      rows.push(release);
      if (rows.length >= 7) break;
    }

    list.innerHTML = `<div class="currentVersionHero"><small>الإصدار الحالي</small><b>v${VERSION}</b><small>Mobile stability • UAE holidays • Balance sync</small></div>` + rows.map((r) => `<div class="changelogItem"><h4><span>v${esc(r.version)}</span><span class="sourceBadge ${r.version === VERSION ? "confirmed" : ""}">${r.version === VERSION ? "الحالي" : esc(r.status || "")}</span></h4><p>${esc(r.release_notes || "بدون ملاحظات")}</p></div>`).join("");
  }

  const previousRender = render;
  render = function renderV121() {
    previousRender();
    restructureBalanceFields();
    renderHolidayList();
    renderCalendar();
    renderChangelogV121();
    document.querySelectorAll(".version").forEach((el) => {
      el.innerHTML = `إجازاتي · <strong>v${VERSION}</strong> · Cloud Sync`;
    });
  };

  function boot() {
    lockMobileZoom();
    injectFixStyles();
    restructureBalanceFields();
    injectCalendarLegend();

    let attempts = 0;
    const waitForAccount = () => {
      if (session?.user?.id && profile?.id) {
        freshLoad();
        return;
      }
      attempts += 1;
      if (attempts < 50) setTimeout(waitForAccount, 200);
    };
    setTimeout(waitForAccount, 100);

    try {
      client.auth.onAuthStateChange((_event, newSession) => {
        if (newSession) setTimeout(() => freshLoad(), 250);
      });
    } catch (_) {}
  }

  boot();
})();
