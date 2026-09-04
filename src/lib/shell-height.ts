let rest = 0;
const timers: number[] = [];

function visibleHeight() {
  const vv = window.visualViewport;
  return Math.round(Math.max(window.innerHeight, vv?.height ?? 0, vv ? vv.height + vv.offsetTop : 0));
}

function searching() {
  return document.activeElement?.getAttribute("data-hound-search") === "1";
}

export function captureRest() {
  const h = visibleHeight();
  if (h > rest) rest = h;
}

export function restoreShell() {
  captureRest();
  const h = rest || visibleHeight();
  document.documentElement.style.setProperty("--app-h", `${h}px`);
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

export function restoreShellSoon() {
  restoreShell();
  for (const t of timers) window.clearTimeout(t);
  timers.length = 0;
  timers.push(window.setTimeout(restoreShell, 50));
  timers.push(window.setTimeout(restoreShell, 350));
}

export function watchShellHeight() {
  captureRest();
  restoreShell();
  const vv = window.visualViewport;
  const onResize = () => {
    if (searching()) return;
    captureRest();
    restoreShell();
  };
  vv?.addEventListener("resize", onResize);
  window.addEventListener("resize", onResize);
  const onFocusOut = () => restoreShellSoon();
  document.addEventListener("focusout", onFocusOut);
  return () => {
    vv?.removeEventListener("resize", onResize);
    window.removeEventListener("resize", onResize);
    document.removeEventListener("focusout", onFocusOut);
    for (const t of timers) window.clearTimeout(t);
  };
}
