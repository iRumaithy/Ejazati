(() => {
  const EJAZATI_VERSION = "1.2.0";
  const UAE_TZ = "Asia/Dubai";
  let officialHolidaysV12 = [];
  let holidayOverridesV12 = [];
  let customHolidaysV12 = [];

  const normalizeUsernameV12 = (value) => String(value || "").trim().toLowerCase();
  const currentYearV12 = () => Number(new Intl.DateTimeFormat("en", { year: "numeric", timeZone: UAE_TZ }).format(new Date()));

  function injectTheme() {
    if (document.getElementById("ejazatiV12Theme")) return;
    const style = document.createElement("style");
    style.id = "ejazatiV12Theme";
    style.textContent = `
      :root{
        --gold:#d9b65f;--gold2:#f2d98b;--gold3:#8f6a22;
        --navy0:#050b16;--navy1:#081426;--navy2:#0c1d36;
        --glass:rgba(15,31,55,.78);--glass2:rgba(20,42,73,.82);
      }
      body{
        background:
          radial-gradient(circle at 92% -5%,rgba(217,182,95,.18),transparent 30%),
          radial-gradient(circle at 6% 22%,rgba(82,199,255,.12),transparent 28%),
          linear-gradient(180deg,var(--navy0),var(--navy1) 54%,#07101f)!important;
      }
      body:before{content:"";position:fixed;inset:0;pointer-events:none;z-index:-1;background:linear-gradient(115deg,transparent 0 44%,rgba(255,255,255,.012) 44% 45%,transparent 45% 100%)}
      .app{padding-top:calc(12px + env(safe-area-inset-top))!important}
      .top{
        position:sticky;top:0;z-index:24;margin:0 -5px 16px;padding:9px 10px;
        background:linear-gradient(135deg,rgba(7,17,34,.91),rgba(13,31,56,.82));
        border:1px solid rgba(217,182,95,.16);border-radius:20px;
        backdrop-filter:blur(18px) saturate(135%);-webkit-backdrop-filter:blur(18px) saturate(135%);
        box-shadow:0 14px 34px rgba(0,0,0,.22),inset 0 1px 0 rgba(255,255,255,.035);
      }
      .topBrand img{width:48px!important;height:48px!important;border-radius:15px!important;border:1px solid rgba(242,217,139,.55);box-shadow:0 8px 24px rgba(217,182,95,.14)}
      .topBrand h1{font-size:21px!important;letter-spacing:-.2px}
      .topBrand h1:after{content:"";display:inline-block;width:5px;height:5px;border-radius:50%;background:var(--gold);margin-right:7px;vertical-align:middle;box-shadow:0 0 12px rgba(217,182,95,.8)}
      .topBrand p{max-width:125px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .avatar{border-color:rgba(217,182,95,.28)!important;background:linear-gradient(145deg,rgba(217,182,95,.12),rgba(255,255,255,.04))!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.04)}
      .liveClock{direction:ltr;text-align:center;min-width:126px;padding:7px 10px;border-radius:14px;border:1px solid rgba(217,182,95,.16);background:rgba(5,13,27,.48);box-shadow:inset 0 1px 0 rgba(255,255,255,.03)}
      .liveClock .time{font-variant-numeric:tabular-nums;font-size:14px;font-weight:900;color:#fff;letter-spacing:.35px}
      .liveClock .date{font-variant-numeric:tabular-nums;font-size:9px;color:var(--gold2);margin-top:2px;white-space:nowrap}
      .hero{position:relative;overflow:hidden;background:linear-gradient(145deg,#173157 0%,#0c1d38 55%,#0a172d 100%)!important;border-color:rgba(217,182,95,.24)!important;box-shadow:0 20px 52px rgba(0,0,0,.28),0 0 0 1px rgba(255,255,255,.018) inset!important}
      .hero:after{content:"";position:absolute;width:190px;height:190px;border-radius:50%;left:-74px;top:-92px;background:radial-gradient(circle,rgba(217,182,95,.15),transparent 68%);pointer-events:none}
      .balance{color:#fff;text-shadow:0 4px 22px rgba(0,0,0,.18)}
      .ring{box-shadow:0 0 0 1px rgba(217,182,95,.12),0 12px 28px rgba(0,0,0,.16)}
      .ring:before{background:linear-gradient(145deg,#152b4b,#10213c)!important;box-shadow:inset 0 0 0 1px rgba(217,182,95,.07)}
      .stat,.card,.kpi{background:linear-gradient(180deg,rgba(18,37,66,.86),rgba(11,25,48,.9))!important;border-color:rgba(255,255,255,.075)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.022)}
      .kpi{transition:transform .18s ease,border-color .18s ease}.kpi:active{transform:scale(.985)}
      .kpi .ico{filter:drop-shadow(0 4px 8px rgba(0,0,0,.18))}
      .sectionHead h3{letter-spacing:-.15px}.sectionHead h3:before{content:"";display:inline-block;width:3px;height:14px;border-radius:4px;background:linear-gradient(var(--gold2),var(--gold3));margin-left:7px;vertical-align:-2px}
      .primary{background:linear-gradient(135deg,var(--gold2),var(--gold))!important;color:#10203a!important;box-shadow:0 8px 22px rgba(217,182,95,.12);font-weight:950!important}
      .ghost{background:rgba(255,255,255,.042)!important}.ghost:hover{border-color:rgba(217,182,95,.26)!important}
      .field input,.field select,.field textarea{background:rgba(5,17,35,.72)!important;border-color:rgba(255,255,255,.08)!important}
      .field input:focus,.field select:focus,.field textarea:focus{border-color:rgba(217,182,95,.55)!important;box-shadow:0 0 0 3px rgba(217,182,95,.06)}
      .nav{background:rgba(4,12,25,.92)!important;border-top-color:rgba(217,182,95,.13)!important;backdrop-filter:blur(22px)!important;-webkit-backdrop-filter:blur(22px)!important}
      .nav button.active{color:var(--gold2)!important}.nav .plus{background:linear-gradient(145deg,var(--gold2),var(--gold))!important;color:#10203a!important;box-shadow:0 10px 28px rgba(217,182,95,.24)!important}
      .dateBox{background:linear-gradient(145deg,rgba(217,182,95,.13),rgba(82,199,255,.055))!important;border:1px solid rgba(217,182,95,.11)}
      .notice{border-color:rgba(217,182,95,.2)!important;background:rgba(217,182,95,.07)!important;color:#f4e3b3!important}
      .goldPanel{margin:4px 0 14px;padding:13px;border-radius:17px;border:1px solid rgba(217,182,95,.18);background:linear-gradient(145deg,rgba(217,182,95,.08),rgba(255,255,255,.025));box-shadow:inset 0 1px 0 rgba(255,255,255,.025)}
      .goldPanel .panelTitle{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;font-size:12px;font-weight:900;color:#f5e5ba}
      .goldPanel small{display:block;color:var(--muted);font-size:10px;line-height:1.7}
      .yearBadge,.sourceBadge,.syncBadge{display:inline-flex;align-items:center;gap:4px;padding:4px 7px;border-radius:999px;font-size:9px;border:1px solid rgba(217,182,95,.18);background:rgba(217,182,95,.08);color:#f4d991}
      .sourceBadge.confirmed{border-color:rgba(111,225,194,.22);background:rgba(111,225,194,.08);color:#c9ffed}
      .sourceBadge.expected{border-color:rgba(217,182,95,.22);background:rgba(217,182,95,.08);color:#f4d991}
      .sourceBadge.custom{border-color:rgba(82,199,255,.22);background:rgba(82,199,255,.07);color:#d5efff}
      .holidayRow{padding:12px 0;border-bottom:1px solid var(--line)}.holidayRow:last-child{border-bottom:0}
      .holidayTop{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.holidayMeta{min-width:0}.holidayMeta b{font-size:12px}.holidayMeta small{display:block;color:var(--muted);font-size:9.5px;line-height:1.55;margin-top:4px}.holidayActions{display:flex;gap:5px;flex-shrink:0}.holidaySource{margin-top:7px;display:flex;align-items:center;gap:6px;flex-wrap:wrap}.holidaySource a{color:#e8cd82;text-decoration:none;font-size:9px}
      .balanceAdjustPanel{margin:2px 0 12px}.balanceAdjustPanel .field{margin-bottom:8px}.balanceAdjustPanel .miniHelp{color:var(--muted);font-size:9.5px;line-height:1.65}
      .balanceAdjustPanel .balanceTools{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:9px;flex-wrap:wrap}
      .changelogItem{padding:12px 0;border-bottom:1px solid var(--line)}.changelogItem:last-child{border-bottom:0}.changelogItem h4{margin:0 0 6px;font-size:12px;display:flex;align-items:center;justify-content:space-between;gap:8px}.changelogItem p{margin:0;color:var(--muted);font-size:10px;line-height:1.75;white-space:pre-line}.currentVersionHero{padding:13px;border-radius:17px;border:1px solid rgba(217,182,95,.2);background:linear-gradient(135deg,rgba(217,182,95,.11),rgba(82,199,255,.045));margin-bottom:10px}.currentVersionHero b{font-size:18px;color:#f4d991}.currentVersionHero small{display:block;color:var(--muted);font-size:9px;margin-top:4px}
      .version{color:#8191aa!important}.version b{color:var(--gold2)}
      .modal .sheet{background:linear-gradient(180deg,#0d1d36,#081426)!important;border-color:rgba(217,182,95,.18)!important}
      @media(max-width:430px){
        .top{display:grid!important;grid-template-columns:1fr auto!important;gap:8px!important}.liveClock{grid-column:1/-1;grid-row:2;width:100%;display:flex;align-items:center;justify-content:space-between;direction:rtl}.liveClock .date{margin-top:0}.topBrand p{max-width:170px}.avatar{grid-column:2;grid-row:1}
      }
      @media(min-width:431px){.top{display:grid!important;grid-template-columns:1fr auto auto!important}.liveClock{grid-column:2}.avatar{grid-column:3}}
    `;
    document.head.appendChild(style);

    const theme = document.querySelector('meta[name="theme-color"]');
    if (theme) theme.setAttribute("content", "#081426");
  }

  function injectClock() {
    const top = document.querySelector(".top");
    if (!top || document.getElementById("liveDateTime")) return;
    const clock = document.createElement("div");
    clock.className = "liveClock";
    clock.id = "liveDateTime";
    clock.innerHTML = '<div class="time" id="liveTime">--:--:--</div><div class="date" id="liveDate">--/--/----</div>';
    const avatar = top.querySelector(".avatar");
    top.insertBefore(clock, avatar || null);

    const tick = () => {
      const now = new Date();
      const time = new Intl.DateTimeFormat("ar-AE", { timeZone: UAE_TZ, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }).format(now);
      const date = new Intl.DateTimeFormat("ar-AE", { timeZone: UAE_TZ, day: "2-digit", month: "2-digit", year: "numeric" }).format(now);
      const t = document.getElementById("liveTime");
      const d = document.getElementById("liveDate");
      if (t) t.textContent = time;
      if (d) d.textContent = date;
    };
    tick();
    setInterval(tick, 1000);
  }

  function injectBalanceControls() {
    if (document.getElementById("currentBalanceInput")) return;
    const expiry = document.getElementById("carryExpiry")?.closest(".field");
    if (!expiry) return;
    const panel = document.createElement("div");
    panel.className = "goldPanel balanceAdjustPanel";
    panel.innerHTML = `
      <div class="panelTitle"><span>⚖️ ضبط رصيد السنة الحالية</span><span class="yearBadge">سنة <b id="balanceYearText">—</b></span></div>
      <div class="field"><label>الرصيد المتاح حاليًا</label><input id="currentBalanceInput" type="number" min="0" step="1" inputmode="numeric"></div>
      <div class="miniHelp">إذا بدأت استخدام «إجازاتي» في منتصف السنة، اكتب الرصيد المتاح لديك الآن. سيُحفظ كتصحيح لهذه السنة فقط، وفي 1 يناير يُعاد الرصيد تلقائيًا إلى الرصيد السنوي + الرصيد المرحّل المسجل.</div>
      <div class="balanceTools"><span class="syncBadge" id="balanceAdjustmentBadge">بدون تصحيح يدوي</span><button type="button" class="ghost mini" onclick="resetCurrentYearBalance()">إعادة احتساب هذه السنة</button></div>
    `;
    expiry.after(panel);
  }

  function injectHolidayUI() {
    const holidayList = document.getElementById("holidayList");
    if (!holidayList) return;
    const section = holidayList.closest(".section");
    const headSpan = section?.querySelector(".sectionHead span");
    if (headSpan) headSpan.textContent = "الإمارات • مزامنة تلقائية";
    const card = holidayList.closest(".card");
    if (card && !document.getElementById("holidaySyncInfo")) {
      const info = document.createElement("div");
      info.id = "holidaySyncInfo";
      info.className = "goldPanel";
      info.innerHTML = `
        <div class="panelTitle"><span>🇦🇪 تقويم العطلات الرسمية</span><span class="syncBadge">تحديث تلقائي يومي</span></div>
        <small>تُضاف العطلات تلقائيًا كل سنة. المواعيد الهجرية قد تتغير حسب الرؤية الشرعية والإعلان الرسمي؛ لذلك تظهر حالة كل عطلة ومصدرها، ويمكنك تعديلها أو إخفاءها لحسابك فقط.</small>
      `;
      card.insertBefore(info, holidayList);
    }
    const addButton = card?.querySelector('button[onclick="addHoliday()"]');
    if (addButton) addButton.textContent = "+ إضافة عطلة خاصة";
  }

  function injectHolidayModal() {
    if (document.getElementById("holidayOverrideModal")) return;
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.id = "holidayOverrideModal";
    modal.setAttribute("onclick", "if(event.target===this)closeHolidayOverride()")
    modal.innerHTML = `
      <div class="sheet">
        <div class="sheetHead"><h3>تعديل عطلة رسمية</h3><button class="ghost mini" onclick="closeHolidayOverride()">✕</button></div>
        <input type="hidden" id="holidayOfficialId">
        <div class="field"><label>الاسم في حسابك</label><input id="holidayOverrideName"></div>
        <div class="field"><label>التاريخ في حسابك</label><input id="holidayOverrideDate" type="date"></div>
        <label style="display:flex;align-items:center;gap:8px;font-size:12px;color:#cad7e9;margin:4px 0 12px"><input id="holidayOverrideDisabled" type="checkbox"> تجاهل هذه العطلة في حسابي</label>
        <div class="goldPanel" id="holidayOverrideSource"></div>
        <div class="actions"><button class="primary" onclick="saveHolidayOverride()">حفظ التعديل</button><button class="ghost" onclick="resetHolidayOverride()">الافتراضي</button></div>
      </div>`;
    document.body.appendChild(modal);
  }

  function injectChangelog() {
    const settingsPage = document.getElementById("settingsPage");
    const version = settingsPage?.querySelector(".version");
    if (!settingsPage || !version) return;
    if (!document.getElementById("changelogSection")) {
      const section = document.createElement("div");
      section.className = "section";
      section.id = "changelogSection";
      section.innerHTML = '<div class="sectionHead"><h3>سجل التحديثات</h3><span>Changelog</span></div><div class="card" id="changelogList"></div>';
      version.before(section);
    }
    version.innerHTML = `إجازاتي · <b>v${EJAZATI_VERSION}</b> · Cloud Sync`;
  }

  function effectiveOfficialHolidays() {
    const overrideById = new Map(holidayOverridesV12.map((x) => [x.official_holiday_id, x]));
    const byDate = new Map();

    [...officialHolidaysV12]
      .sort((a, b) => {
        const aRank = a.status === "confirmed" ? 0 : 1;
        const bRank = b.status === "confirmed" ? 0 : 1;
        return a.holiday_date.localeCompare(b.holiday_date) || aRank - bRank;
      })
      .forEach((h) => {
        const ov = overrideById.get(h.id);
        if (ov?.is_disabled) return;
        const effective = {
          id: `official:${h.id}`,
          official_id: h.id,
          holiday_date: ov?.override_date || h.holiday_date,
          name: ov?.override_name || h.name_ar,
          official: true,
          status: h.status,
          source_name: h.source_name,
          source_url: h.source_url,
          source_kind: h.source_kind,
          source_note: h.source_note,
          original_date: h.holiday_date,
          overridden: Boolean(ov)
        };
        const previous = byDate.get(effective.holiday_date);
        if (!previous || (previous.status !== "confirmed" && effective.status === "confirmed")) byDate.set(effective.holiday_date, effective);
      });

    return [...byDate.values()];
  }

  function yearConsumptionV12() {
    const year = currentYearV12();
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);
    let used = 0;
    let reserved = 0;

    for (const l of leaves) {
      if (!l.deduct_from_balance) continue;
      let start = pd(l.start_date);
      let end = pd(l.end_date);
      if (end < yearStart || start > yearEnd) continue;
      if (start < yearStart) start = new Date(yearStart);
      if (end > yearEnd) end = new Date(yearEnd);

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if (!isWorkday(d)) continue;
        if (d < TODAY) used++;
        else reserved++;
      }
    }
    return { used, reserved };
  }

  // Year-aware totals. Old years no longer reduce the current year's entitlement.
  totals = function totalsV12() {
    const consumption = yearConsumptionV12();
    const opening = Number(settings?.year_opening_balance ?? (Number(settings?.base_balance || 0) + Number(settings?.carried_balance || 0)));
    const adjustment = Number(settings?.balance_adjustment || 0);
    const total = opening + adjustment;
    const available = total - consumption.used - consumption.reserved;
    return {
      total,
      used: consumption.used,
      reserved: consumption.reserved,
      available: Math.max(0, available),
      rawAvailable: available,
      opening,
      adjustment
    };
  };

  loadData = async function loadDataV12() {
    const uid = session.user.id;
    try { await client.rpc("ejazati_ensure_current_year"); } catch (_) {}
    const year = currentYearV12();
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
    customHolidaysV12 = c.data || [];
    releases = v.data || [];
    officialHolidaysV12 = o.data || [];
    holidayOverridesV12 = ov.data || [];
    holidays = [...effectiveOfficialHolidays(), ...customHolidaysV12.map((h) => ({ ...h, official: false }))];

    if (profile.role === "owner") await loadAdmin();
    render();
  };

  const renderBaseV12 = render;
  render = function renderV12() {
    renderBaseV12();
    const t = totals();
    const pct = t.total ? Math.min(100, Math.max(0, Math.round((t.used + t.reserved) / t.total * 100))) : 0;
    const ring = document.getElementById("ring");
    if (ring) ring.style.background = `conic-gradient(var(--gold) ${pct * 3.6}deg,rgba(255,255,255,.08) 0deg)`;
    const hint = document.getElementById("balanceHint");
    if (hint) hint.textContent = `من أصل ${t.total} يوم لهذه السنة بعد الحجوزات`;
    renderChangelogV12();
  };

  renderSettings = function renderSettingsV12() {
    const displayName = document.getElementById("displayName");
    if (displayName) displayName.value = profile?.display_name || "";
    const username = document.getElementById("accountUsername");
    if (username) username.value = profile?.username || "";
    document.getElementById("baseBalance").value = settings?.base_balance ?? 30;
    document.getElementById("carryBalance").value = settings?.carried_balance ?? 0;
    document.getElementById("carryExpiry").value = settings?.carry_expiry || "";
    document.getElementById("weekendDays").value = (settings?.weekend_days || [6, 0]).join(",");
    document.getElementById("accountRole").textContent = profile?.role === "owner" ? "👑 مالك" : "مستخدم";

    const t = totals();
    const currentBalance = document.getElementById("currentBalanceInput");
    if (currentBalance) currentBalance.value = Math.max(0, t.rawAvailable);
    const yearText = document.getElementById("balanceYearText");
    if (yearText) yearText.textContent = settings?.balance_year || currentYearV12();
    const adjustmentBadge = document.getElementById("balanceAdjustmentBadge");
    if (adjustmentBadge) {
      const a = Number(settings?.balance_adjustment || 0);
      adjustmentBadge.textContent = a === 0 ? "بدون تصحيح يدوي" : `تصحيح الرصيد ${a > 0 ? "+" : ""}${a} يوم`;
    }

    renderHolidayListV12();
  };

  window.saveSettings = async function saveSettingsV12() {
    const username = normalizeUsernameV12(document.getElementById("accountUsername")?.value);
    if (!/^[a-z0-9._-]{3,30}$/.test(username)) return toast("تحقق من اسم المستخدم");

    const profileRes = await client.from("ejazati_profiles").update({
      display_name: document.getElementById("displayName")?.value?.trim() || null,
      username,
      updated_at: new Date().toISOString()
    }).eq("id", session.user.id);
    if (profileRes.error) return toast(profileRes.error.code === "23505" ? "اسم المستخدم مستخدم بالفعل" : "تعذر حفظ الحساب");

    const consumption = yearConsumptionV12();
    const opening = Number(settings?.year_opening_balance ?? (Number(settings?.base_balance || 0) + Number(settings?.carried_balance || 0)));
    const rawTarget = document.getElementById("currentBalanceInput")?.value;
    const target = rawTarget === "" || rawTarget == null ? null : Number(rawTarget);
    const adjustment = Number.isFinite(target) ? Math.round(target - (opening - consumption.used - consumption.reserved)) : Number(settings?.balance_adjustment || 0);

    const settingRes = await client.from("ejazati_leave_settings").upsert({
      user_id: session.user.id,
      base_balance: Number(document.getElementById("baseBalance")?.value || 0),
      carried_balance: Number(document.getElementById("carryBalance")?.value || 0),
      carry_expiry: document.getElementById("carryExpiry")?.value || null,
      weekend_days: (document.getElementById("weekendDays")?.value || "6,0").split(",").map(Number),
      balance_year: settings?.balance_year || currentYearV12(),
      year_opening_balance: opening,
      balance_adjustment: adjustment,
      updated_at: new Date().toISOString()
    });
    if (settingRes.error) return toast("تعذر حفظ إعدادات الإجازة");

    profile.display_name = document.getElementById("displayName")?.value?.trim() || null;
    profile.username = username;
    await loadData();
    toast("تم حفظ الإعدادات");
  };

  window.resetCurrentYearBalance = async function resetCurrentYearBalanceV12() {
    if (!confirm("إعادة رصيد هذه السنة إلى الرصيد السنوي + المرحّل وإلغاء أي تصحيح يدوي؟")) return;
    const base = Number(document.getElementById("baseBalance")?.value || 0);
    const carried = Number(document.getElementById("carryBalance")?.value || 0);
    const { error } = await client.from("ejazati_leave_settings").update({
      base_balance: base,
      carried_balance: carried,
      carry_expiry: document.getElementById("carryExpiry")?.value || null,
      weekend_days: (document.getElementById("weekendDays")?.value || "6,0").split(",").map(Number),
      balance_year: currentYearV12(),
      year_opening_balance: base + carried,
      balance_adjustment: 0,
      updated_at: new Date().toISOString()
    }).eq("user_id", session.user.id);
    if (error) return toast("تعذر إعادة ضبط الرصيد");
    await loadData();
    toast("تمت إعادة احتساب رصيد السنة");
  };

  function renderHolidayListV12() {
    const list = document.getElementById("holidayList");
    if (!list) return;
    const all = [...effectiveOfficialHolidays(), ...customHolidaysV12.map((h) => ({ ...h, official: false }))]
      .sort((a, b) => a.holiday_date.localeCompare(b.holiday_date));

    list.innerHTML = all.map((h) => {
      if (h.official) {
        const badge = h.status === "confirmed" ? "مؤكدة رسميًا" : "متوقعة";
        const badgeClass = h.status === "confirmed" ? "confirmed" : "expected";
        const sourceLink = h.source_url ? `<a href="${esc(h.source_url)}" target="_blank" rel="noopener">عرض المصدر ↗</a>` : "";
        return `<div class="holidayRow"><div class="holidayTop"><div class="holidayMeta"><b>${esc(h.name)}</b><small>${fmt(h.holiday_date)}${h.overridden ? " · معدل لحسابك" : ""}</small></div><div class="holidayActions"><button class="mini ghost" onclick="openHolidayOverride('${h.official_id}')">تحرير</button></div></div><div class="holidaySource"><span class="sourceBadge ${badgeClass}">${badge}</span><span class="sourceBadge">${esc(h.source_name || "مصدر موثوق")}</span>${sourceLink}</div></div>`;
      }
      return `<div class="holidayRow"><div class="holidayTop"><div class="holidayMeta"><b>${esc(h.name)}</b><small>${fmt(h.holiday_date)}</small></div><div class="holidayActions"><button class="mini danger" onclick="removeHoliday('${h.id}')">حذف</button></div></div><div class="holidaySource"><span class="sourceBadge custom">عطلة خاصة</span></div></div>`;
    }).join("") || '<div style="padding:16px;text-align:center;color:var(--muted);font-size:11px">لا توجد عطل.</div>';
  }

  window.openHolidayOverride = function openHolidayOverrideV12(id) {
    const h = officialHolidaysV12.find((x) => x.id === id);
    if (!h) return;
    const ov = holidayOverridesV12.find((x) => x.official_holiday_id === id);
    document.getElementById("holidayOfficialId").value = id;
    document.getElementById("holidayOverrideName").value = ov?.override_name || h.name_ar;
    document.getElementById("holidayOverrideDate").value = ov?.override_date || h.holiday_date;
    document.getElementById("holidayOverrideDisabled").checked = Boolean(ov?.is_disabled);
    const src = document.getElementById("holidayOverrideSource");
    if (src) src.innerHTML = `<div class="panelTitle"><span>${h.status === "confirmed" ? "✅ مصدر رسمي" : "🕓 تاريخ متوقع"}</span><span class="sourceBadge ${h.status}">${esc(h.source_name)}</span></div><small>${esc(h.source_note || "")}</small>${h.source_url ? `<div style="margin-top:8px"><a style="color:var(--gold2);font-size:10px;text-decoration:none" href="${esc(h.source_url)}" target="_blank" rel="noopener">فتح المصدر ↗</a></div>` : ""}`;
    document.getElementById("holidayOverrideModal").classList.add("open");
  };

  window.closeHolidayOverride = function closeHolidayOverrideV12() {
    document.getElementById("holidayOverrideModal")?.classList.remove("open");
  };

  window.saveHolidayOverride = async function saveHolidayOverrideV12() {
    const id = document.getElementById("holidayOfficialId").value;
    const h = officialHolidaysV12.find((x) => x.id === id);
    if (!h) return;
    const name = document.getElementById("holidayOverrideName").value.trim();
    const date = document.getElementById("holidayOverrideDate").value;
    if (!name || !date) return toast("تحقق من الاسم والتاريخ");
    const { error } = await client.from("ejazati_holiday_overrides").upsert({
      user_id: session.user.id,
      official_holiday_id: id,
      override_name: name === h.name_ar ? null : name,
      override_date: date === h.holiday_date ? null : date,
      is_disabled: document.getElementById("holidayOverrideDisabled").checked,
      updated_at: new Date().toISOString()
    }, { onConflict: "user_id,official_holiday_id" });
    if (error) return toast("تعذر حفظ تعديل العطلة");
    window.closeHolidayOverride();
    await loadData();
    toast("تم حفظ تعديل العطلة");
  };

  window.resetHolidayOverride = async function resetHolidayOverrideV12() {
    const id = document.getElementById("holidayOfficialId").value;
    if (!id) return;
    const { error } = await client.from("ejazati_holiday_overrides").delete().eq("user_id", session.user.id).eq("official_holiday_id", id);
    if (error) return toast("تعذر استعادة القيمة الرسمية");
    window.closeHolidayOverride();
    await loadData();
    toast("تمت استعادة العطلة الافتراضية");
  };

  function renderChangelogV12() {
    const list = document.getElementById("changelogList");
    if (!list) return;
    const currentNotes = [
      "الدخول باسم المستخدم أو البريد مع حفظ الجلسة تلقائيًا.",
      "إضافة التاريخ والساعة بالثواني بتوقيت الإمارات في الشريط العلوي.",
      "إعادة رصيد الإجازات تلقائيًا في 1 يناير إلى الرصيد السنوي + المرحّل.",
      "إمكانية ضبط الرصيد المتاح الحالي لمن يبدأ استخدام التطبيق أثناء السنة.",
      "تقويم عطلات الإمارات تلقائي مع مصدر وحالة لكل عطلة وإمكانية تعديلها للحساب.",
      "هوية بصرية عصرية كحلية وذهبية وتحسينات للجوال.",
      "إظهار الإصدار الحالي وسجل التحديثات داخل التطبيق."
    ].join("\n• ");

    const rows = [{ version: EJAZATI_VERSION, status: "current", release_notes: `• ${currentNotes}`, created_at: new Date().toISOString() }];
    const seen = new Set([EJAZATI_VERSION]);
    for (const r of (releases || [])) {
      if (seen.has(r.version)) continue;
      seen.add(r.version);
      rows.push(r);
      if (rows.length >= 6) break;
    }

    list.innerHTML = `<div class="currentVersionHero"><small>الإصدار الحالي</small><b>v${EJAZATI_VERSION}</b><small>واجهة محسّنة • مزامنة سحابية • تقويم الإمارات</small></div>` + rows.map((r) => `<div class="changelogItem"><h4><span>v${esc(r.version)}</span><span class="sourceBadge ${r.version === EJAZATI_VERSION ? "confirmed" : ""}">${r.version === EJAZATI_VERSION ? "الحالي" : esc(r.status || "")}</span></h4><p>${esc(r.release_notes || "بدون ملاحظات")}</p></div>`).join("");
  }

  // Keep backups tagged with the visible release rather than the legacy inline constant.
  window.exportBackup = async function exportBackupV12(kind = "manual") {
    const backup = { format: "ejazati-backup-v1", created_at: new Date().toISOString(), app_version: EJAZATI_VERSION, profile: { display_name: profile.display_name, username: profile.username || null }, settings, leaves, holidays: customHolidaysV12, holiday_overrides: holidayOverridesV12 };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ejazati-backup-${ymd(TODAY)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    await client.from("ejazati_backup_history").insert({ user_id: session.user.id, backup_kind: kind, app_version: EJAZATI_VERSION });
    toast("تم إنشاء النسخة الاحتياطية");
  };

  window.applyWaitingUpdate = async function applyWaitingUpdateV12() {
    if (!waitingWorker) return;
    await client.from("ejazati_backup_history").insert({ user_id: session.user.id, backup_kind: "pre_update", app_version: EJAZATI_VERSION });
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
  };

  function bootstrapV12() {
    injectTheme();
    injectClock();
    injectBalanceControls();
    injectHolidayUI();
    injectHolidayModal();
    injectChangelog();
    document.querySelectorAll(".version").forEach((el) => { el.innerHTML = `إجازاتي · <b>v${EJAZATI_VERSION}</b> · Cloud Sync`; });
    if (typeof profile !== "undefined" && profile) {
      try { render(); } catch (_) {}
    }
  }

  bootstrapV12();
})();
