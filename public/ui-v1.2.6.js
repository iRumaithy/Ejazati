(() => {
  const VERSION = "1.2.6";

  if (!document.getElementById("ejazatiV126")) {
    const style = document.createElement("style");
    style.id = "ejazatiV126";
    style.textContent = `
      .leaveLegendChip[data-leave-type="mission"]{
        color:var(--muted)!important;
        font-weight:400!important;
      }
      .leaveLegendChip[data-leave-type="mission"] i{
        background:#9BE15D!important;
      }
    `;
    document.head.appendChild(style);
  }

  document.querySelectorAll(".version").forEach(el => {
    el.innerHTML = `إجازاتي · <strong>v${VERSION}</strong> · Cloud Sync`;
  });
})();