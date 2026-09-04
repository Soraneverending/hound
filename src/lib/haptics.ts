export function haptic(kind: "light" | "success" | "warn" = "light") {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") {
    return;
  }
  if (kind === "success") {
    navigator.vibrate([12, 40, 18]);
    return;
  }
  if (kind === "warn") {
    navigator.vibrate([8, 30, 8, 30, 16]);
    return;
  }
  navigator.vibrate(10);
}
