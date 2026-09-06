(() => {
  const VERSION = "1.2.11";
  window.EJAZATI_APP_VERSION = VERSION;

  function injectStyles() {
    if (document.getElementById("ejazatiV1211Styles")) return;

    const style = document.createElement("style");
    style.id = "ejazatiV1211Styles";
    style.textContent = `
      /* The old combined container becomes a clean layout host. */
      #allLeaves.classifiedListsV1211{
        padding:0!important;
        background:transparent!important;
        border:0!important;
        box-shadow:none!important;
        display:flex;
        flex-direction:column;
        gap:14px;
      }

      .leaveGroupV1211{
        position:relative;
        overflow:hidden;
        padding:15px;
        border-radius:22px;
        background:linear-gradient(180deg,rgba(17,33,62,.98),rgba(12,26,50,.98));
        border:1px solid var(--line);
        box-shadow:0 12px 28px rgba(0,0,0,.13);
      }

      .leaveGroupV1211::before{
        content:"";
        position:absolute;
        inset-inline-start:0;
        top:17px;
        bottom:17px;
        width:3px;
        border-radius:99px;
        opacity:.9;
      }

      .leaveGroupV1211.leavesGroup::before{
        background:linear-gradient(180deg,var(--gold2,#f1d06b),var(--cyan));
      }

      .leaveGroupV1211.missionsGroup::before{
        background:linear-gradient(180deg,#9BE15D,#58d0a7);
      }

      .leaveGroupHeadV1211{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
        padding:0 4px 11px;
        margin-bottom:1px;
        border-bottom:1px solid rgba(255,255,255,.065);
      }

      .leaveGroupTitleV1211{
        display:flex;
        align-items:center;
        gap:8px;
        min-width:0;
      }

      .leaveGroupIconV1211{
        width:31px;
        height:31px;
        flex:0 0 31px;
        display:grid;
        place-items:center;
        border-radius:11px;
        background:rgba(255,255,255,.05);
        border:1px solid rgba(255,255,255,.075);
        font-size:15px;
      }

      .leavesGroup .leaveGroupIconV1211{
        color:#f1d06b;
        border-color:rgba(217,182,95,.19);
        background:rgba(217,182,95,.065);
      }

      .missionsGroup .leaveGroupIconV1211{
        color:#9BE15D;
        border-color:rgba(155,225,93,.18);
        background:rgba(155,225,93,.055);
      }

      .leaveGroupTitleV1211 h4{
        margin:0;
        color:#f7f9fd;
        font-size:14px;
        font-weight:850;
      }

      .leaveGroupTitleV1211 small{
        display:block;
        margin-top:2px;
        color:var(--muted);
        font-size:9px;
        font-weight:500;
      }

      .leaveGroupCountV1211{
        min-width:29px;
        height:27px;
        padding:0 8px;
        display:grid;
        place-items:center;
        border-radius:999px;
        color:#dfe9f7;
        font-size:10px;
        font-weight:850;
        background:rgba(255,255,255,.045);
        border:1px solid rgba(255,255,255,.075);
      }

      .missionsGroup .leaveGroupCountV1211{
        color:#dfffca;
        border-color:rgba(155,225,93,.15);
        background:rgba(155,225,93,.045);
      }

      .leaveGroupBodyV1211 .leaveItem:first-child{
        padding-top:13px;
      }

      .leaveGroupBodyV1211 .leaveItem:last-child{
        padding-bottom:2px;
        border-bottom:0;
      }

      .groupEmptyV1211{
        padding:21px 8px 8px;
        text-align:center;
        color:var(--muted);
        font-size:11px;
        line-height:1.7;
      }

      .missionsGroup .dateBox{
        border-color:rgba(155,225,93,.14)!important;
        background:linear-gradient(145deg,rgba(155,225,93,.08),rgba(255,255,255,.025))!important;
      }

      @media(max-width:390px){
        .leaveGroupV1211{padding:13px}
        .leaveGroupTitleV1211 h4{font-size:13px}
        .leaveGroupIconV1211{width:29px;height:29px;flex-basis:29px}
      }
    `;
    document.head.appendChild(style);
  }

  function filteredItems() {
    let list = [...(leaves || [])];

    if (filter === "future") {
      list = list.filter(item => pd(item.end_date) >= TODAY);
    } else if (filter === "past") {
      list = list.filter(item => pd(item.end_date) < TODAY);
    }

    return list;
  }

  function groupHTML({type, title, subtitle, icon, items, emptyText}) {
    const body = items.length
      ? items.map(leaveHTML).join("")
      : `<div class="groupEmptyV1211">${emptyText}</div>`;

    return `
      <section class="leaveGroupV1211 ${type}">
        <div class="leaveGroupHeadV1211">
          <div class="leaveGroupTitleV1211">
            <span class="leaveGroupIconV1211">${icon}</span>
            <div>
              <h4>${title}</h4>
              <small>${subtitle}</small>
            </div>
          </div>
          <span class="leaveGroupCountV1211">${items.length}</span>
        </div>
        <div class="leaveGroupBodyV1211">${body}</div>
      </section>`;
  }

  function renderSeparatedLists() {
    const host = document.getElementById("allLeaves");
    if (!host) return;

    const list = filteredItems();

    // "مهمة / دورة" has its own category. All remaining leave types stay under vacations.
    const missions = list.filter(item => item.leave_type === "mission");
    const vacationItems = list.filter(item => item.leave_type !== "mission");

    host.classList.add("classifiedListsV1211");
    host.innerHTML =
      groupHTML({
        type: "leavesGroup",
        title: "الإجازات",
        subtitle: "السنوية والمرضية والاضطرارية وبقية أنواع الإجازات",
        icon: "🌴",
        items: vacationItems,
        emptyText: filter === "all"
          ? "لا توجد إجازات مسجلة حتى الآن."
          : "لا توجد إجازات ضمن هذا الفلتر."
      }) +
      groupHTML({
        type: "missionsGroup",
        title: "المهام والدورات",
        subtitle: "المهمات والاجتماعات والدورات المسجلة",
        icon: "🧭",
        items: missions,
        emptyText: filter === "all"
          ? "لا توجد مهام أو دورات مسجلة حتى الآن."
          : "لا توجد مهام أو دورات ضمن هذا الفلتر."
      });

    const pageTitle = document.querySelector("#leavesPage .sectionHead h3");
    if (pageTitle) pageTitle.textContent = "الإجازات والمهام";
  }

  function parseVersion(value) {
    const match = String(value || "").match(/(\d+)\.(\d+)\.(\d+)/);
    return match ? [+match[1], +match[2], +match[3]] : [0,0,0];
  }

  function newerThan(a, b) {
    const A = parseVersion(a), B = parseVersion(b);
    for (let i = 0; i < 3; i++) {
      if (A[i] !== B[i]) return A[i] > B[i];
    }
    return false;
  }

  function preventLegacySelfUpdateNotice() {
    // ui-v1.2.10 has its own local VERSION constant. Mark v1.2.11 as already
    // installed so that legacy polling cannot advertise the current build as an update.
    try {
      localStorage.setItem(
        `ejazati:update-dismissed:${VERSION}`,
        String(new Date("2999-01-01T00:00:00Z").getTime())
      );
    } catch (_) {}

    const notice = document.getElementById("liveUpdateNoticeV1210");
    if (notice) {
      const match = (notice.textContent || "").match(/v(\d+\.\d+\.\d+)/i);
      if (!match || !newerThan(match[1], VERSION)) notice.remove();
    }
  }

  function normalizeVersionUI() {
    document.querySelectorAll(".version").forEach(el => {
      el.innerHTML = `إجازاتي · <strong>v${VERSION}</strong> · Cloud Sync`;
    });

    const list = document.getElementById("changelogList");
    if (!list) return;

    // Remove old "current" markers, then add it only to the latest local entry.
    list.querySelectorAll(".changelogItem h4 .sourceBadge, .changelogItem h4 .adminTag")
      .forEach(badge => {
        const text = (badge.textContent || "").trim();
        if (text === "الحالي" || text.toLowerCase() === "current") badge.remove();
      });

    let entry = document.getElementById("changelogV1211Local");
    if (!entry) {
      entry = document.createElement("div");
      entry.className = "changelogItem";
      entry.id = "changelogV1211Local";
      entry.innerHTML = `
        <h4><span>v${VERSION}</span></h4>
        <p>فصل قائمة الإجازات عن المهام والدورات في قسمين مستقلين وأكثر ترتيبًا، مع استمرار فلاتر الكل والقادمة والسابقة على القسمين.</p>`;
      list.prepend(entry);
    }

    const badge = document.createElement("span");
    badge.className = "sourceBadge confirmed";
    badge.textContent = "الحالي";
    entry.querySelector("h4")?.appendChild(badge);
  }

  // Replace only the list renderer. Existing add/edit/delete behavior remains untouched.
  renderLeaves = renderSeparatedLists;

  // Re-apply after the main render because allLeaves is rebuilt after sync.
  if (typeof render === "function") {
    const previousRender = render;
    render = function renderV1211() {
      previousRender();
      setTimeout(() => {
        renderSeparatedLists();
        preventLegacySelfUpdateNotice();
        normalizeVersionUI();
      }, 0);
    };
  }

  function boot() {
    injectStyles();
    preventLegacySelfUpdateNotice();
    renderSeparatedLists();
    normalizeVersionUI();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, {once:true});
  } else {
    boot();
  }

  // In case the old update checker inserts a self-notice after its async DB request.
  const noticeGuard = new MutationObserver(() => preventLegacySelfUpdateNotice());
  if (document.body) {
    noticeGuard.observe(document.body, {childList:true});
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      noticeGuard.observe(document.body, {childList:true});
    }, {once:true});
  }

  setTimeout(boot, 300);
  setTimeout(boot, 1000);
})();