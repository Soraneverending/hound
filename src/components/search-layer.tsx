import { useLayoutEffect, useRef } from "react";
import { ArrowLeft, Search, X } from "lucide-react";
import { LiveSearchPanel } from "@/components/screens/hunt";
import { useHound } from "@/lib/hound-store";
import { goBack, runHunt } from "@/lib/run-hunt";

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
          onClick={() => goBack()}
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

export function SearchPage() {
  const query = useHound((s) => s.query);
  const setQuery = useHound((s) => s.setQuery);
  const setSearchOpen = useHound((s) => s.setSearchOpen);
  const inputRef = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    try {
      el.focus({ preventScroll: true });
    } catch {
      el.focus();
    }
  }, []);

  function huntNow(q = query) {
    const next = q.trim();
    if (!next) return;
    setQuery(next);
    setSearchOpen(false);
    elBlur();
    void runHunt(next);
  }

  function elBlur() {
    inputRef.current?.blur();
  }

  return (
    <>
      <div className="app-chrome">
        <form
          role="search"
          className="flex items-center gap-2 bg-bg pt-2 pr-16 pb-2 pl-16"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            huntNow();
          }}
        >
          <button
            type="button"
            aria-label="Back"
            onClick={() => {
              elBlur();
              goBack();
            }}
            className="flex h-11 shrink-0 items-center gap-1 rounded-full px-1 text-sm font-medium"
          >
            <ArrowLeft className="size-5" />
            Back
          </button>
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-faint" />
            <input
              ref={inputRef}
              type="text"
              inputMode="search"
              enterKeyHint="search"
              data-hound-search="1"
              value={query}
              placeholder="Name or title"
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => setQuery(e.target.value)}
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
          </div>
        </form>
      </div>
      <main className="app-scroll min-h-0 flex-1 overflow-y-auto px-5 pt-4">
        <LiveSearchPanel />
      </main>
    </>
  );
}
