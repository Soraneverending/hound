let rest = 0;

function measure() {
  const vv = window.visualViewport;
  return Math.round(
    Math.max(window.innerHeight, vv ? vv.height + vv.offsetTop : 0, document.documentElement.clientHeight || 0),
  );
}

export function captureRest() {
  const h = measure();
  if (h > rest) rest = h;
}

export function restoreRest() {
  captureRest();
  const h = rest || measure();
  document.documentElement.style.height = `${h}px`;
  document.body.style.height = `${h}px`;
  window.scrollTo(0, 0);
}

export function watchShellHeight() {
  captureRest();
  restoreRest();
  const vv = window.visualViewport;
  const onResize = () => {
    const h = measure();
    if (h >= rest - 8) restoreRest();
  };
  vv?.addEventListener("resize", onResize);
  window.addEventListener("resize", onResize);
  return () => {
    vv?.removeEventListener("resize", onResize);
    window.removeEventListener("resize", onResize);
  };
}
