import { useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Search, X } from "lucide-react";
import { LiveSearchPanel } from "@/components/screens/hunt";
import { useHound } from "@/lib/hound-store";
import { requestBack, runHunt } from "@/lib/run-hunt";

export function SearchLaunch() {
  const setSearchOpen = useHound((s) => s.setSearchOpen);
  const query = useHound((s) => s.query);
  const result = useHound((s) => s.result);
  const label = query.trim() || result?.product.name || "Name or title";
  const idle = !query.trim() && !result;

  return (
    <div className="flex items-center gap-2 bg-bg pt-2 pr-16 pb-2 pl-16">
      {result ? (
        <button
          type="button"
          aria-label="Back"
          onClick={() => requestBack()}
          className="flex h-11 shrink-0 items-center gap-1 rounded-full px-1 text-sm font-medium"
        >
          <ArrowLeft className="size-5" />
          Back
        </button>
      ) : null}
      <button
        type="button"
        data-hound-search-launch="1"
        onClick={() => setSearchOpen(true)}
        className="flex h-12 min-w-0 flex-1 items-center gap-3 rounded-full bg-paper px-4 text-left shadow-[var(--shadow-card)]"
      >
        <Search className="size-4 shrink-0 text-faint" />
        <span className={`min-w-0 flex-1 truncate text-base ${idle ? "text-faint" : ""}`}>{label}</span>
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

  useEffect(() => {
    document.documentElement.classList.toggle("hound-searching", open);
    return () => document.documentElement.classList.remove("hound-searching");
  }, [open]);

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
    requestBack();
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
      <div className="flex items-center gap-2 bg-bg pt-2 pr-16 pb-2 pl-16">
        <button
          type="button"
          aria-label="Back"
          onClick={close}
          className="flex h-11 shrink-0 items-center gap-1 rounded-full px-2 text-sm font-medium"
        >
          <ArrowLeft className="size-5" />
          Back
        </button>
        <form
          role="search"
          className="relative min-w-0 flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            huntNow();
          }}
        >
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-faint" />
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
            type="button"
            disabled={!query.trim()}
            onClick={() => huntNow()}
            className="absolute top-1.5 right-1.5 z-10 h-9 rounded-full bg-ink px-3.5 text-sm font-medium text-accent-fg disabled:opacity-40"
          >
            Hunt
          </button>
        </form>
      </div>
      <div className="search-layer-scroll">
        <LiveSearchPanel />
      </div>
    </div>,
    document.body,
  );
}
