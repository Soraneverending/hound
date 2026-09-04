export function kickLayout() {
  window.scrollTo(0, 0);
  document.documentElement.classList.remove("hound-kb");
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;

  const html = document.documentElement;
  const body = document.body;
  const shell = document.querySelector(".app-shell");
  const stack = document.querySelector(".bottom-stack");

  html.style.height = `${window.innerHeight}px`;
  body.style.height = `${window.innerHeight}px`;
  if (shell instanceof HTMLElement) {
    shell.style.top = "0px";
    shell.style.bottom = "0px";
    shell.style.height = "100%";
  }
  if (stack instanceof HTMLElement) {
    stack.style.bottom = "0px";
    stack.style.transform = "none";
  }
  void html.offsetHeight;
  requestAnimationFrame(() => {
    html.style.height = "";
    body.style.height = "";
    window.scrollTo(0, 0);
  });
}

export function watchShellHeight() {
  const vv = window.visualViewport;
  let last = Math.round(vv?.height ?? window.innerHeight);
  const onResize = () => {
    const now = Math.round(vv?.height ?? window.innerHeight);
    if (now > last + 60) kickLayout();
    last = now;
  };
  vv?.addEventListener("resize", onResize);
  window.addEventListener("resize", onResize);
  return () => {
    vv?.removeEventListener("resize", onResize);
    window.removeEventListener("resize", onResize);
  };
}
