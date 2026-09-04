import { lazy, Suspense, useEffect, useLayoutEffect } from "react";
import { AislesScreen } from "@/components/screens/aisles";
import { HuntScreen, LiveSearchPanel } from "@/components/screens/hunt";
import { HuntSearch } from "@/components/search-layer";
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
  const searchOpen = useHound((s) => s.searchOpen);

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
        {tab === "hunt" ? (
          <HuntSearch />
        ) : (
          <div className="brand-row flex items-center justify-between gap-3 pt-3 pr-16 pb-2 pl-16">
            <div className="flex min-w-0 items-center gap-2">
              <HoundMark className="size-7 shrink-0 text-ink" />
              <p className="font-display text-xl leading-none tracking-[-0.03em]">Hound</p>
            </div>
            <ThemeToggle />
          </div>
        )}
        <PingBar />
      </div>
      <main className="app-scroll min-h-0 flex-1 overflow-y-auto px-5 pt-4">
        {tab === "hunt" && searchOpen ? <LiveSearchPanel /> : null}
        {tab === "hunt" && !searchOpen ? <HuntScreen /> : null}
        {tab === "pins" ? <PinsScreen /> : null}
        {tab === "aisles" ? <AislesScreen /> : null}
        {tab === "board" ? (
          <Suspense fallback={<p className="text-sm text-muted">Opening the board…</p>}>
            <BoardScreen />
          </Suspense>
        ) : null}
      </main>
      {searchOpen ? null : <TabBar />}
      <SnagSheet />
    </div>
  );
}
