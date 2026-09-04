import { useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Search, X } from "lucide-react";
import { LiveSearchPanel } from "@/components/screens/hunt";
import { useHound } from "@/lib/hound-store";
import { runHunt } from "@/lib/run-hunt";

export function SearchLaunch() {
  const setSearchOpen = useHound((s) => s.setSearchOpen);
  const setQuery = useHound((s) => s.setQuery);
  return (
    <div className="bg-bg pt-2 pr-16 pb-2 pl-16">
      <button
        type="button"
        data-hound-search-launch="1"
        onClick={() => {
          setQuery("");
          setSearchOpen(true);
        }}
        className="flex h-12 w-full items-center gap-3 rounded-full bg-paper px-4 text-left shadow-[var(--shadow-card)]"
      >
        <Search className="size-4 shrink-0 text-faint" />
        <span className="text-base text-faint">Name or title</span>
      </button>
    </div>
  );
}

export function SearchLayer() {
  const open = useHound((s) => s.searchOpen);
  const query = useHound((s) => s.query);
  const setQuery = useHound((s) => s.setQuery);
  const setSearchOpen = useHound((s) => s.setSearchOpen);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const vk = (navigator as Navigator & { virtualKeyboard?: { overlaysContent: boolean } }).virtualKeyboard;
    if (vk) vk.overlaysContent = true;
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    const el = inputRef.current;
    if (!el) return;
    try {
      el.focus({ preventScroll: true });
    } catch {
      el.focus();
    }
  }, [open]);

  function close() {
    inputRef.current?.blur();
    window.setTimeout(() => setSearchOpen(false), 50);
  }

  function huntNow(q = query) {
    const next = q.trim();
    if (!next) return;
    setQuery(next);
    inputRef.current?.blur();
    setSearchOpen(false);
    void runHunt(next);
  }

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="search-layer" role="dialog" aria-label="Search">
      <form
        role="search"
        className="bg-bg pt-2 pr-16 pb-2 pl-16"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          huntNow();
        }}
      >
        <div className="relative">
          <button
            type="button"
            aria-label="Close search"
            onPointerDown={(e) => e.preventDefault()}
            onClick={close}
            className="absolute top-1.5 left-1.5 z-10 grid size-9 place-items-center rounded-full text-muted"
          >
            <ArrowLeft className="size-4" />
          </button>
          <input
            ref={inputRef}
            type="text"
            data-hound-search="1"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                huntNow();
              }
              if (e.key === "Escape") close();
            }}
            placeholder="Name or title"
            enterKeyHint="search"
            inputMode="search"
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            className="h-12 w-full rounded-full bg-paper pr-[4.6rem] pl-11 text-base shadow-[var(--shadow-card)] outline-none ring-ink/15 focus:ring-2"
          />
          {query.trim() ? (
            <button
              type="button"
              aria-label="Clear"
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => {
                setQuery("");
                inputRef.current?.focus({ preventScroll: true });
              }}
              className="absolute top-1/2 right-16 z-10 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted"
            >
              <X className="size-4" />
            </button>
          ) : null}
          <button
            type="submit"
            disabled={!query.trim()}
            className="absolute top-1.5 right-1.5 z-10 h-9 rounded-full bg-ink px-3.5 text-sm font-medium text-accent-fg disabled:opacity-40"
          >
            Hunt
          </button>
        </div>
      </form>
      <div className="search-layer-scroll">
        <LiveSearchPanel />
      </div>
    </div>,
    document.body,
  );
}
