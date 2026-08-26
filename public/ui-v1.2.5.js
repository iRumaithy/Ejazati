(() => {
  const VERSION = "1.2.5";
  const MISSION_COLOR = "#9BE15D";

  function injectStyles() {
    if (document.getElementById("ejazatiV125")) return;
    const s = document.createElement("style");
    s.id = "ejazatiV125";
    s.textContent = `
      .calDay.leave-mission{
        background:linear-gradient(145deg,rgba(155,225,93,.24),rgba(155,225,93,.055))!important;
        outline:1px solid rgba(155,225,93,.84)!important;
        color:#f4ffe9!important;
        font-weight:900!important;
      }
      .calDay.leave-mission .leaveTypeDot{
        background:${MISSION_COLOR}!important;
        color:${MISSION_COLOR}!important;
        box-shadow:0 0 10px rgba(155,225,93,.75)!important;
      }
      .leaveLegendChip[data-leave-type="mission"]{
        color:#ddffc4!important;
        font-weight:800!important;
      }
      .leaveLegendChip[data-leave-type="mission"] i,
      .monthEventDot.leave-mission{
        background:${MISSION_COLOR}!important;
      }
    `;
    document.head.appendChild(s);
  }

  function recolor() {
    document.querySelectorAll(".leaveLegendChip").forEach(chip => {
      const t = (chip.textContent || "").trim();
      if (t.includes("مهمة") || t.includes("دورة")) {
        chip.dataset.leaveType = "mission";
        const dot = chip.querySelector("i");
        if (dot) dot.style.background = MISSION_COLOR;
      }
    });

    document.querySelectorAll(".monthEvent").forEach(row => {
      const t = row.textContent || "";
      if (t.includes("مهمة / دورة")) {
        const dot = row.querySelector(".monthEventDot");
        if (dot) {
          dot.classList.add("leave-mission");
          dot.style.background = MISSION_COLOR;
        }
      }
    });

    document.querySelectorAll(".calDay").forEach(cell => {
      const title = cell.getAttribute("title") || "";
      if (title.includes("مهمة") || title.includes("دورة")) {
        if (!cell.classList.contains("uaeConfirmed") &&
            !cell.classList.contains("uaeExpectedV122") &&
            !cell.classList.contains("customHoliday")) {
          cell.classList.add("leave-mission");
        }
        const dot = cell.querySelector(".leaveTypeDot");
        if (dot) {
          dot.style.background = MISSION_COLOR;
          dot.style.color = MISSION_COLOR;
        }
      }
    });
  }

  function versionUI() {
    document.querySelectorAll(".version").forEach(el => {
      el.innerHTML = `إجازاتي · <strong>v${VERSION}</strong> · Cloud Sync`;
    });
    const changelog = document.getElementById("changelogList");
    if (changelog && !document.getElementById("changelogV125Local")) {
      const item = document.createElement("div");
      item.className = "changelogItem";
      item.id = "changelogV125Local";
      item.innerHTML = `
        <h4><span>v${VERSION}</span><span class="sourceBadge confirmed">الحالي</span></h4>
        <p>تغيير لون «مهمة / دورة» إلى أخضر ليموني واضح لفصله بصريًا عن لون الإجازة السنوية السماوي.</p>`;
      changelog.prepend(item);
    }
  }

  function apply() {
    injectStyles();
    recolor();
    versionUI();
  }

  if (typeof render === "function") {
    const oldRender = render;
    render = function renderV125() {
      oldRender();
      setTimeout(apply, 0);
    };
  }

  if (typeof renderCalendar === "function") {
    const oldCalendar = renderCalendar;
    renderCalendar = function renderCalendarV125() {
      oldCalendar();
      setTimeout(recolor, 0);
    };
  }

  apply();
  setTimeout(apply, 300);
  setTimeout(apply, 900);
})();