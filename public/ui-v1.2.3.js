(() => {
  const VERSION = "1.2.3";
  const APP_BG = "#050b16";

  function injectOverscrollStyles() {
    if (document.getElementById("ejazatiV123Overscroll")) return;

    const style = document.createElement("style");
    style.id = "ejazatiV123Overscroll";
    style.textContent = `
      html{
        min-height:100%;
        background:${APP_BG}!important;
        background-color:${APP_BG}!important;
        overscroll-behavior:none!important;
        overscroll-behavior-y:none!important;
      }

      body{
        min-height:100vh;
        min-height:100dvh;
        background-color:${APP_BG}!important;
        overscroll-behavior:none!important;
        overscroll-behavior-y:none!important;
      }

      /* A dark safety canvas behind the whole app so iOS never reveals white. */
      body::after{
        content:"";
        position:fixed;
        z-index:-3;
        top:-120vh;
        right:0;
        bottom:-120vh;
        left:0;
        background:${APP_BG};
        pointer-events:none;
      }

      #appView,
      #authView{
        min-height:100vh;
        min-height:100dvh;
      }

      .app{
        min-height:100vh;
        min-height:100dvh;
      }

      /* Prevent browser rubber-band chaining while preserving normal vertical scroll. */
      html,body,.app,.sheet{
        overscroll-behavior-y:none!important;
      }
    `;
    document.head.appendChild(style);

    const theme = document.querySelector('meta[name="theme-color"]');
    if (theme) theme.setAttribute("content", "#081426");
  }

  function getScrollableParent(target) {
    let el = target instanceof Element ? target : null;

    while (el && el !== document.body && el !== document.documentElement) {
      const style = window.getComputedStyle(el);
      const overflowY = style.overflowY;
      const scrollable =
        (overflowY === "auto" || overflowY === "scroll") &&
        el.scrollHeight > el.clientHeight + 1;

      if (scrollable) return el;
      el = el.parentElement;
    }

    return document.scrollingElement || document.documentElement;
  }

  function installIOSBoundaryGuard() {
    if (window.__ejazatiOverscrollGuardV123) return;
    window.__ejazatiOverscrollGuardV123 = true;

    let startX = 0;
    let startY = 0;
    let scrollTarget = null;

    document.addEventListener("touchstart", (event) => {
      if (!event.touches || event.touches.length !== 1) return;

      const touch = event.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      scrollTarget = getScrollableParent(event.target);
    }, { passive: true });

    document.addEventListener("touchmove", (event) => {
      if (!event.touches || event.touches.length !== 1) return;

      const touch = event.touches[0];
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;

      // Do not interfere with predominantly horizontal gestures.
      if (Math.abs(dy) <= Math.abs(dx)) return;

      const target = scrollTarget || document.scrollingElement || document.documentElement;
      const maxScroll = Math.max(0, target.scrollHeight - target.clientHeight);
      const top = target.scrollTop <= 0;
      const bottom = target.scrollTop >= maxScroll - 1;

      // Pulling down while already at the top, or pulling up while already at the bottom:
      // stop Safari's rubber-band before it reveals the page canvas.
      if ((top && dy > 0) || (bottom && dy < 0)) {
        event.preventDefault();
      }
    }, { passive: false });

    document.addEventListener("touchend", () => {
      scrollTarget = null;
    }, { passive: true });

    document.addEventListener("touchcancel", () => {
      scrollTarget = null;
    }, { passive: true });
  }

  function updateVersionUI() {
    document.querySelectorAll(".version").forEach((el) => {
      el.innerHTML = `إجازاتي · <strong>v${VERSION}</strong> · Cloud Sync`;
    });

    const changelog = document.getElementById("changelogList");
    if (changelog && !document.getElementById("changelogV123Local")) {
      const item = document.createElement("div");
      item.className = "changelogItem";
      item.id = "changelogV123Local";
      item.innerHTML = `
        <h4><span>v${VERSION}</span><span class="sourceBadge confirmed">الحالي</span></h4>
        <p>إصلاح ظهور الخلفية البيضاء عند السحب الزائد أعلى أو أسفل التطبيق على iPhone وSafari.
تثبيت الخلفية الكحلية خلف كامل مساحة التطبيق ومنع Rubber-band Overscroll مع الحفاظ على التمرير الطبيعي.</p>`;
      changelog.prepend(item);
    }
  }

  function apply() {
    injectOverscrollStyles();
    installIOSBoundaryGuard();
    updateVersionUI();

    // Explicitly paint the root canvas as a fallback for WebKit.
    document.documentElement.style.backgroundColor = APP_BG;
    document.body.style.backgroundColor = APP_BG;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", apply, { once: true });
  } else {
    apply();
  }

  setTimeout(apply, 250);
  setTimeout(updateVersionUI, 900);
})();
