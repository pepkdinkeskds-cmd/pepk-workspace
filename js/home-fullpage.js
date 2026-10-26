/* Homepage screen navigation. Deliberately independent of catalog modules. */
(() => {
  "use strict";
  function initialize() {
    const viewport = document.querySelector("[data-home-viewport]");
    if (!viewport || viewport.dataset.fullpageInitialized === "true") return;
    const scenes = [...viewport.querySelectorAll("[data-home-scene]")];
    const navigation = document.querySelector("[data-scene-nav]");
    if (!scenes.length || !navigation) return;
    viewport.dataset.fullpageInitialized = "true";
    const desktop = window.matchMedia("(min-width: 52.01rem)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const previous = navigation.querySelector("[data-scene-previous]");
    const next = navigation.querySelector("[data-scene-next]");
    const counter = navigation.querySelector("[data-scene-count]");
    const sectionSelect = navigation.querySelector("[data-scene-select]");
    const announcement = document.querySelector("[data-scene-announcement]");
    let current = 0;
    let enabled = false;
    let busy = false;
    let animationTimer;
    let wheelTimer;
    let wheelLatched = false;
    let wheelTotal = 0;
    let resizeFrame;
    const duration = 650;
    const inputSelector = "input,textarea,select,[contenteditable]:not([contenteditable='false']),[role='textbox'],[role='combobox'],[role='slider'],[role='listbox'],[role='menu'],[role='tablist']";
    const isEmbedded = () => {
      if (document.body.classList.contains("is-embedded") || new URLSearchParams(window.location.search).get("embed") === "1") return true;
      try { return window.self !== window.top; } catch { return true; }
    };
    const modalOpen = () => [...document.querySelectorAll("dialog[open],[role='dialog']:not([hidden])")]
      .some((node) => !node.classList.contains("hidden") && window.getComputedStyle(node).display !== "none")
      || document.querySelector("[data-menu-button][aria-expanded='true']");
    const hasModifier = (event) => event.ctrlKey || event.metaKey || event.altKey || event.shiftKey;
    function indexFromHash() {
      let hash;
      try { hash = decodeURIComponent(window.location.hash.slice(1)); } catch { return -1; }
      return scenes.findIndex((scene) => scene.id === hash);
    }
    function offset(index) {
      return scenes[index].getBoundingClientRect().top - viewport.getBoundingClientRect().top + viewport.scrollTop;
    }
    function place(top, smooth) {
      if (smooth && typeof viewport.scrollTo === "function") viewport.scrollTo({top, behavior: "smooth"});
      else viewport.scrollTop = top;
    }
    function updateControls() {
      previous.disabled = current === 0;
      next.disabled = current === scenes.length - 1;
      counter.textContent = `${String(current + 1).padStart(2,"0")}/${String(scenes.length).padStart(2,"0")}`;
      sectionSelect.value = String(current);
      scenes.forEach((scene, index) => {
        scene.toggleAttribute("data-current-scene", current === index);
        if (enabled) {
          scene.inert = index !== current;
          scene.setAttribute("aria-hidden", String(index !== current));
        } else {
          scene.inert = false;
          scene.removeAttribute("aria-hidden");
        }
      });
      viewport.dataset.activeScene = scenes[current].id;
      viewport.dataset.fullpageState = enabled ? "active" : "native";
      navigation.hidden = !enabled;
    }
    function setHash() {
      const url = new URL(window.location.href);
      url.hash = scenes[current].id;
      // Do not fill browser history with every wheel movement.
      history.replaceState(history.state, "", url);
    }
    function settle() {
      clearTimeout(animationTimer);
      if (enabled) place(offset(current), false);
      busy = false;
      viewport.dataset.transitioning = "false";
    }
    function go(index, {instant = false, focus = false, writeHash = true} = {}) {
      if (index < 0 || index >= scenes.length || (busy && !instant)) return false;
      clearTimeout(animationTimer);
      const oldScene = scenes[current];
      const moveFocus = focus || oldScene.contains(document.activeElement);
      current = index;
      busy = enabled && !instant && !reducedMotion.matches;
      viewport.dataset.transitioning = String(busy);
      // Keep the new panel available to assistive technology before moving focus.
      scenes[current].inert = false;
      scenes[current].removeAttribute("aria-hidden");
      if (moveFocus && enabled) scenes[current].focus({preventScroll: true});
      updateControls();
      if (enabled) place(offset(current), busy);
      else scenes[current].scrollIntoView({behavior: reducedMotion.matches ? "instant" : "smooth", block: "start"});
      if (writeHash) setHash();
      if (announcement) announcement.textContent = `Bagian ${current + 1} dari ${scenes.length}: ${scenes[current].dataset.sceneTitle}.`;
      if (busy) animationTimer = setTimeout(settle, duration);
      else settle();
      return true;
    }
    function refreshMode() {
      const wasEnabled = enabled;
      const shouldEnable = desktop.matches && !isEmbedded();
      clearTimeout(animationTimer);
      busy = false;
      const hashIndex = indexFromHash();
      if (hashIndex >= 0) current = hashIndex;
      enabled = shouldEnable;
      document.documentElement.classList.toggle("home-fullpage-root", enabled);
      document.body.classList.toggle("home-fullpage-enabled", enabled);
      updateControls();
      if (enabled) {
        // Browser document scrolling is never the fullpage transport.
        window.scrollTo({top: 0, behavior: "instant"});
        place(offset(current), false);
      } else {
        viewport.scrollTop = 0;
        if (wasEnabled) scenes[current].scrollIntoView({behavior: "instant", block: "start"});
      }
      viewport.dataset.transitioning = "false";
      document.body.dataset.fullpageReady = "true";
    }
    sectionSelect.replaceChildren(...scenes.map((scene, index) => {
      const option = document.createElement("option");
      option.value = String(index);
      option.textContent = scene.dataset.sceneTitle;
      return option;
    }));
    sectionSelect.addEventListener("change", () => {
      if (!go(Number(sectionSelect.value))) sectionSelect.value = String(current);
    });
    previous.addEventListener("click", () => go(current - 1));
    next.addEventListener("click", () => go(current + 1));
    document.addEventListener("keydown", (event) => {
      if (!enabled || event.defaultPrevented || hasModifier(event) || modalOpen() || event.target.closest?.(inputSelector)) return;
      const delta = ["ArrowDown","PageDown"].includes(event.key) ? 1 : ["ArrowUp","PageUp"].includes(event.key) ? -1 : 0;
      if (!delta && !["Home","End"].includes(event.key)) return;
      event.preventDefault();
      // A held key must not produce tiny native scrolls or run through all panels.
      if (event.repeat || busy) return;
      go(delta ? current + delta : event.key === "Home" ? 0 : scenes.length - 1, {focus: true});
    });
    window.addEventListener("wheel", (event) => {
      if (!enabled || event.defaultPrevented || hasModifier(event) || modalOpen() || !event.deltaY
        || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      // Only an explicit scrolling widget gets native wheel input. Cards/links do not disable fullpage.
      if (event.target.closest?.("textarea,select,[contenteditable]:not([contenteditable='false']),[data-native-scroll],.feedback-panel")) return;
      event.preventDefault();
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => { wheelLatched = false; wheelTotal = 0; }, 240);
      if (busy || wheelLatched) return;
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewport.clientHeight : 1);
      wheelTotal = Math.sign(delta) === Math.sign(wheelTotal) ? wheelTotal + delta : delta;
      if (Math.abs(wheelTotal) < 12) return;
      wheelLatched = true;
      go(current + Math.sign(wheelTotal));
      wheelTotal = 0;
    }, {passive: false});
    document.addEventListener("click", (event) => {
      const link = event.target.closest?.("a[href]");
      if (!link || !enabled || event.defaultPrevented || hasModifier(event) || event.button !== 0) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname !== window.location.pathname || url.search !== window.location.search) return;
      let hash;
      try { hash = decodeURIComponent(url.hash.slice(1)); } catch { return; }
      if (hash === "main-content") {
        event.preventDefault(); go(0, {instant: true, focus: true}); return;
      }
      const index = scenes.findIndex((scene) => scene.id === hash);
      if (index >= 0) {event.preventDefault(); go(index, {focus: true});}
    });
    window.addEventListener("hashchange", () => {
      const index = indexFromHash();
      if (index >= 0) go(index, {instant: true, writeHash: false});
    });
    window.addEventListener("pageshow", () => {if (enabled) settle();});
    viewport.addEventListener("scrollend", () => {if (busy) settle();});
    window.addEventListener("resize", () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(refreshMode);
    });
    if (desktop.addEventListener) desktop.addEventListener("change", refreshMode);
    else desktop.addListener?.(refreshMode);
    if (typeof ResizeObserver === "function") new ResizeObserver(() => {
      if (enabled && !busy) place(offset(current), false);
    }).observe(viewport);
    refreshMode();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, {once: true});
  else initialize();
})();
