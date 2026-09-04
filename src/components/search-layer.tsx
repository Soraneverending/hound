import { useRef } from "react";
import { ArrowLeft, Search, X } from "lucide-react";
import { useHound } from "@/lib/hound-store";
import { goBack, runHunt } from "@/lib/run-hunt";
import { restoreRest } from "@/lib/shell-height";

export function HuntTop() {
  return <div className="h-2 bg-bg" />;
}

export function SearchDock() {
  const query = useHound((s) => s.query);
  const setQuery = useHound((s) => s.setQuery);
  const setSearchOpen = useHound((s) => s.setSearchOpen);
  const searchOpen = useHound((s) => s.searchOpen);
  const result = useHound((s) => s.result);
  const inputRef = useRef<HTMLInputElement>(null);
  const showBack = Boolean(searchOpen || result);

  function huntNow(q = query) {
    const next = q.trim();
    if (!next) return;
    setQuery(next);
    setSearchOpen(false);
    inputRef.current?.blur();
    void runHunt(next);
  }

  return (
    <form
      role="search"
      className="search-dock"
      autoComplete="off"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        huntNow();
      }}
    >
      {showBack ? (
        <button
          type="button"
          aria-label="Back"
          onClick={() => {
            inputRef.current?.blur();
            goBack();
          }}
          className="flex h-11 shrink-0 items-center gap-1 rounded-full px-1 text-sm font-medium"
        >
          <ArrowLeft className="size-5" />
          Back
        </button>
      ) : null}
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-faint" />
        <input
          ref={inputRef}
          type="text"
          inputMode="search"
          enterKeyHint="search"
          data-hound-search="1"
          name="q"
          value={query}
          placeholder="Name or title"
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          onFocus={() => setSearchOpen(true)}
          onBlur={() => {
            restoreRest();
            if (!useHound.getState().query.trim()) setSearchOpen(false);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setSearchOpen(true);
          }}
          className="h-12 w-full rounded-full bg-paper pr-[4.6rem] pl-11 text-base shadow-[var(--shadow-card)] outline-none ring-ink/15 focus:ring-2"
        />
        {query.trim() ? (
          <button
            type="button"
            aria-label="Clear"
            onClick={() => {
              setQuery("");
              setSearchOpen(true);
              inputRef.current?.focus();
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
  );
}
