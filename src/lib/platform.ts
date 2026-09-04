export type PhoneOS = "ios" | "android" | "other";

export function detectPhoneOS(): PhoneOS {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent || "";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "other";
}

export function isStandalone() {
  if (typeof window === "undefined") return false;
  const media = window.matchMedia("(display-mode: standalone)").matches;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return media || nav.standalone === true;
}
