import { lazy, Suspense, useEffect, useLayoutEffect } from "react";
import { AislesScreen } from "@/components/screens/aisles";
import { HuntScreen, SearchChrome } from "@/components/screens/hunt";
import { PinsScreen } from "@/components/screens/pins";
import { HoundMark } from "@/components/hound-mark";
import { PinPulse } from "@/components/pin-pulse";
import { PingBar } from "@/components/ping-bar";
import { SnagSheet } from "@/components/snag-sheet";
import { TabBar } from "@/components/tab-bar";
import { ThemeToggle } from "@/components/theme-toggle";
import { THEMES, normalizeTheme } from "@/lib/themes";
import { useHound } from "@/lib/hound-store";

const BoardScreen = lazy(async () => {
  const mod = await import("@/components/screens/board");
  return { default: mod.BoardScreen };
});

function bootFromStorage() {
  try {
    void useHound.persist.rehydrate();
  } catch {
    /* blocked storage */
  }
}

export function AppShell() {
  const tab = useHound((s) => s.tab);
  const theme = useHound((s) => s.theme);
  const setTheme = useHound((s) => s.setTheme);

  useLayoutEffect(() => {
    bootFromStorage();
    const w = window as Window & { __houndReady?: boolean; __houndTaps?: { x: number; y: number }[] };
    w.__houndReady = true;
    const tap = w.__houndTaps?.splice(0).at(-1);
    if (tap) {
      queueMicrotask(() => {
        const hit = document.elementFromPoint(tap.x, tap.y);
        const btn = hit?.closest("button, a, [role='button']");
        if (btn instanceof HTMLElement) btn.click();
      });
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const getScroll = () => document.querySelector(".app-scroll");
    const reset = () => {
      window.scrollTo(0, 0);
      root.scrollTop = 0;
      document.body.scrollTop = 0;
      const scroll = getScroll();
      if (scroll instanceof HTMLElement) scroll.scrollTop = 0;
    };
    // Only unwind AFTER the keyboard is gone. Resetting on visualViewport
    // resize WHILE focused fights iOS mid-open and matches the ~3s jump.
    const afterKeyboardClosed = () => {
      if (root.classList.contains("hound-search-focus")) return;
      reset();
      window.setTimeout(reset, 50);
      window.setTimeout(reset, 280);
      window.setTimeout(reset, 500);
    };
    const isSearch = (t: EventTarget | null) =>
      t instanceof HTMLElement && t.matches('[data-hound-search="1"]');

    const onFocusIn = (e: FocusEvent) => {
      if (!isSearch(e.target)) return;
      root.classList.add("hound-search-focus");
      // Do not scroll-reset here — iOS is still opening the keyboard.
    };
    const onFocusOut = (e: FocusEvent) => {
      if (!isSearch(e.target)) return;
      const next = e.relatedTarget;
      if (next instanceof HTMLElement && next.closest('[data-hound-search="1"], .app-chrome')) {
        return;
      }
      root.classList.remove("hound-search-focus");
      afterKeyboardClosed();
    };
    const onViewportResize = () => {
      // Keyboard open/close both fire resize. Only clean up when search blur already cleared the class.
      afterKeyboardClosed();
    };
    const onScroll = () => {
      if (!root.classList.contains("hound-search-focus")) return;
      const scroll = getScroll();
      if (scroll instanceof HTMLElement && scroll.scrollTop !== 0) scroll.scrollTop = 0;
    };

    window.addEventListener("focusin", onFocusIn);
    window.addEventListener("focusout", onFocusOut);
    window.addEventListener("pageshow", afterKeyboardClosed);
    window.visualViewport?.addEventListener("resize", onViewportResize);
    const scrollEl = getScroll();
    scrollEl?.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      root.classList.remove("hound-search-focus");
      window.removeEventListener("focusin", onFocusIn);
      window.removeEventListener("focusout", onFocusOut);
      window.removeEventListener("pageshow", afterKeyboardClosed);
      window.visualViewport?.removeEventListener("resize", onViewportResize);
      scrollEl?.removeEventListener("scroll", onScroll);
    };
  }, []);

  useLayoutEffect(() => {
    const shell = document.querySelector(".app-shell");
    const chrome = document.querySelector(".app-chrome");
    const tabs = document.querySelector(".tab-bar");
    if (!(shell instanceof HTMLElement)) return;
    const apply = () => {
      if (chrome instanceof HTMLElement) shell.style.setProperty("--chrome-h", `${chrome.offsetHeight}px`);
      if (tabs instanceof HTMLElement) shell.style.setProperty("--tabs-h", `${tabs.offsetHeight}px`);
    };
    apply();
    const ro = new ResizeObserver(apply);
    if (chrome) ro.observe(chrome);
    if (tabs) ro.observe(tabs);
    return () => ro.disconnect();
  }, [tab]);

  useEffect(() => {
    const next = normalizeTheme(theme);
    if (next !== theme) setTheme(next);
    const root = document.documentElement;
    root.classList.toggle("dark", next === "night");
    root.setAttribute("data-theme", next);
    const look = THEMES.find((t) => t.id === next);
    root.style.colorScheme = look?.scheme ?? "light";
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta && look) meta.setAttribute("content", look.color);
  }, [theme, setTheme]);

  return (
    <div className="app-shell text-ink">
      <PinPulse />
      <div className="app-chrome">
        <div className="brand-row flex items-center justify-between gap-3 pt-3 pr-16 pb-1 pl-16">
          <div className="flex min-w-0 items-center gap-2">
            <HoundMark className="size-7 shrink-0 text-ink" />
            <p className="font-display text-xl leading-none tracking-[-0.03em]">Hound</p>
          </div>
          <ThemeToggle />
        </div>
        {tab === "hunt" ? <SearchChrome /> : null}
        <PingBar />
      </div>
      <main className="app-scroll min-h-0 flex-1 overflow-y-auto px-5 pt-4">
        {tab === "hunt" ? <HuntScreen /> : null}
        {tab === "pins" ? <PinsScreen /> : null}
        {tab === "aisles" ? <AislesScreen /> : null}
        {tab === "board" ? (
          <Suspense fallback={<p className="text-sm text-muted">Opening the board…</p>}>
            <BoardScreen />
          </Suspense>
        ) : null}
      </main>
      <TabBar />
      <SnagSheet />
    </div>
  );
}