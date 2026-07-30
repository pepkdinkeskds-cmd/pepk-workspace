/**
 * MOBILE ACCESS HOTFIX 01
 *
 * Menyalakan navigasi seluler tanpa menunggu modul data halaman yang besar.
 * File ini sengaja mandiri dan tidak memiliki import.
 */
(() => {
  const MOBILE_QUERY = "(max-width: 52rem)";

  function menuIcon(open) {
    const path = open
      ? '<path d="m6 6 12 12M18 6 6 18"/>'
      : '<path d="M4 7h16M4 12h16M4 17h16"/>';
    return `<span class="icon" aria-hidden="true"><svg viewBox="0 0 24 24">${path}</svg></span>`;
  }

  function initMobileNavigation() {
    const menuButton = document.querySelector("[data-menu-button]");
    const menu = document.querySelector("[data-mobile-nav]");
    if (!menuButton || !menu || menuButton.dataset.mobileMenuReady === "true") return;

    menuButton.dataset.mobileMenuReady = "true";
    const mobileViewport = typeof window.matchMedia === "function"
      ? window.matchMedia(MOBILE_QUERY)
      : null;

    const setOpen = (open) => {
      menuButton.setAttribute("aria-expanded", String(open));
      menuButton.setAttribute("aria-label", open ? "Tutup menu navigasi" : "Buka menu navigasi");
      menu.hidden = !open;
      menuButton.innerHTML = menuIcon(open);
    };

    setOpen(false);
    menuButton.addEventListener("click", (event) => {
      event.preventDefault();
      setOpen(menuButton.getAttribute("aria-expanded") !== "true");
    });

    menu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setOpen(false));
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        menuButton.focus();
      }
    });

    document.addEventListener("click", (event) => {
      if (menuButton.getAttribute("aria-expanded") !== "true") return;
      if (!menu.contains(event.target) && !menuButton.contains(event.target)) setOpen(false);
    });

    const handleViewportChange = (event) => {
      if (!event.matches) setOpen(false);
    };
    if (mobileViewport?.addEventListener) mobileViewport.addEventListener("change", handleViewportChange);
    else if (mobileViewport?.addListener) mobileViewport.addListener(handleViewportChange);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMobileNavigation, { once: true });
  } else {
    initMobileNavigation();
  }
})();
