const EDITABLE = "input, textarea, select, button, a, [contenteditable]:not([contenteditable='false']), [role='dialog'], dialog, [data-native-scroll]";

export function initHomeScenes() {
  const scenes = [...document.querySelectorAll("[data-home-scene]")];
  const nav = document.querySelector("[data-scene-nav]");
  if (!scenes.length || !nav || document.body.classList.contains("is-embedded")) return;
  const desktop = window.matchMedia("(min-width: 52.01rem) and (pointer: fine)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const header = document.querySelector(".site-header");
  const previous = nav.querySelector("[data-scene-previous]");
  const next = nav.querySelector("[data-scene-next]");
  const label = nav.querySelector("[data-scene-label]");
  const counter = nav.querySelector("[data-scene-count]");
  let current = 0;
  let wheelTotal = 0;
  let lockedUntil = 0;
  let quietTimer;
  let ticking = false;
  const headerHeight = () => header?.getBoundingClientRect().height || 0;
  function update() {
    const threshold = headerHeight() + window.innerHeight * 0.3;
    current = scenes.reduce((last, scene, index) => scene.getBoundingClientRect().top <= threshold ? index : last, 0);
    counter.textContent = `${String(current + 1).padStart(2, "0")} / ${String(scenes.length).padStart(2, "0")}`;
    label.textContent = scenes[current].dataset.sceneTitle;
    previous.disabled = current === 0;
    next.disabled = current === scenes.length - 1;
    nav.querySelectorAll("[data-scene-jump]").forEach((button, i) => {
      if (i === current) button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
    });
    const footer = document.querySelector(".site-footer");
    nav.hidden = footer ? footer.getBoundingClientRect().top < window.innerHeight * 0.65 : false;
    ticking = false;
  }
  function go(index, { focus = false } = {}) {
    if (index < 0 || index >= scenes.length) return false;
    current = index;
    lockedUntil = Date.now() + (reducedMotion.matches ? 150 : 700);
    const top = scenes[index].getBoundingClientRect().top + window.scrollY - headerHeight();
    window.scrollTo({ top, behavior: reducedMotion.matches ? "instant" : "smooth" });
    if (focus) scenes[index].focus({ preventScroll: true });
    update();
    return true;
  }
  function nestedCanScroll(target, direction) {
    let node = target instanceof Element ? target : null;
    while (node && node !== document.body && node !== document.documentElement) {
      const style = window.getComputedStyle(node);
      if (/(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight + 2) {
        if (direction > 0 && node.scrollTop + node.clientHeight < node.scrollHeight - 2) return true;
        if (direction < 0 && node.scrollTop > 2) return true;
      }
      node = node.parentElement;
    }
    return false;
  }
  function canStep(direction) {
    const rect = scenes[current].getBoundingClientRect();
    if (direction > 0 && rect.bottom > window.innerHeight + 3) return false;
    if (direction < 0 && rect.top < headerHeight() - 3) return false;
    return current + direction >= 0 && current + direction < scenes.length;
  }
  function blocked(event) {
    return !desktop.matches || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey
      || document.querySelector("dialog[open], [role='dialog']:not([hidden])")
      || document.querySelector("[data-menu-button][aria-expanded='true']")
      || event.target?.closest?.(EDITABLE);
  }
  window.addEventListener("wheel", (event) => {
    if (blocked(event) || Math.abs(event.deltaX) > Math.abs(event.deltaY) || !event.deltaY) return;
    update();
    const direction = Math.sign(event.deltaY);
    if (nestedCanScroll(event.target, direction)) return;
    const locked = Date.now() < lockedUntil;
    if (!locked && !canStep(direction)) return;
    event.preventDefault();
    clearTimeout(quietTimer);
    quietTimer = setTimeout(() => { wheelTotal = 0; }, 220);
    if (locked) { lockedUntil = Math.max(lockedUntil, Date.now() + 220); return; }
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1);
    wheelTotal = Math.sign(wheelTotal) === direction ? wheelTotal + delta : delta;
    if (Math.abs(wheelTotal) >= 40) { wheelTotal = 0; go(current + direction); }
  }, { passive: false });
  document.addEventListener("keydown", (event) => {
    if (blocked(event) || event.repeat || Date.now() < lockedUntil) return;
    update();
    const direction = ["ArrowDown", "PageDown"].includes(event.key) ? 1 : ["ArrowUp", "PageUp"].includes(event.key) ? -1 : 0;
    if (direction && !nestedCanScroll(event.target, direction) && canStep(direction)) {
      event.preventDefault(); go(current + direction, { focus: true });
    } else if (["Home", "End"].includes(event.key)) {
      event.preventDefault(); go(event.key === "Home" ? 0 : scenes.length - 1, { focus: true });
    }
  });
  previous.addEventListener("click", () => go(current - 1));
  next.addEventListener("click", () => go(current + 1));
  nav.querySelectorAll("[data-scene-jump]").forEach((button) => button.addEventListener("click", () => go(Number(button.dataset.sceneJump))));
  window.addEventListener("scroll", () => { if (!ticking) { ticking = true; window.requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener("resize", update);
  update();
}
