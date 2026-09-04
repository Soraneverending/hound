import { useEffect, useMemo, useState } from "react";
import { Lightbulb, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyRow } from "@/components/copy-row";
import { addBoardPost, listBoard, type BoardPost } from "@/lib/board.functions";
import { cn } from "@/lib/cn";
import { HANDOFF_PROMPT, HANDOFF_TITLE } from "@/lib/handoff";
import { useHound } from "@/lib/hound-store";
import { STORES } from "@/lib/stores";

export function BoardScreen() {
  const boardStoreId = useHound((s) => s.boardStoreId);
  const setBoardStore = useHound((s) => s.setBoardStore);
  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [kind, setKind] = useState<"comment" | "wish">("comment");
  const [body, setBody] = useState("");
  const [handle, setHandle] = useState("");
  const [lookup, setLookup] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const selected = STORES.find((s) => s.id === boardStoreId) ?? null;
  const matches = useMemo(() => {
    const q = lookup.trim().toLowerCase();
    if (!q) return STORES.slice(0, 8);
    return STORES.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 8);
  }, [lookup]);

  useEffect(() => {
    void listBoard()
      .then((rows) => setPosts(rows))
      .catch(() => setError("Board is warming up."))
      .finally(() => setLoaded(true));
  }, []);

  async function submit() {
    if (!selected) {
      setError("Pick a store you shop.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await addBoardPost({ data: { kind, body, handle, storeId: selected.id } });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPosts((prev) => [result.post, ...prev]);
      setBody("");
    } catch {
      setError("Could not post just then.");
    } finally {
      setBusy(false);
    }
  }

  const grouped = useMemo(() => {
    const map = new Map<string, BoardPost[]>();
    for (const post of posts) {
      const list = map.get(post.storeId) ?? [];
      list.push(post);
      map.set(post.storeId, list);
    }
    return [...map.entries()];
  }, [posts]);

  return (
    <div className="flex flex-col gap-6 pb-10">
      <section className="rounded-3xl bg-paper p-4 shadow-[var(--shadow-card)]">
        <p className="text-xs font-medium tracking-[0.16em] text-muted uppercase">Pass to another Grok</p>
        <h2 className="font-display mt-2 text-2xl leading-tight">One tap. Paste into a new bot.</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Copies the unsolved iPhone keyboard bug, what already failed, and the files to touch. Open a new Grok, paste, attach your latest clip.
        </p>
        <div className="mt-3">
          <CopyRow label={HANDOFF_TITLE} command={HANDOFF_PROMPT} />
        </div>
      </section>

      <header>
        <p className="text-xs font-medium tracking-[0.16em] text-muted uppercase">Store notes</p>
        <h1 className="font-display mt-2 text-4xl leading-[1.05] tracking-[-0.04em]">Notes on stores you shop.</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Comment on Vons, Sephora, GameStop — not on people. Sign with a nickname. No emails.
        </p>
      </header>

      <form
        className="rounded-3xl bg-paper p-4 shadow-[var(--shadow-card)]"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <label className="block">
          <span className="text-xs font-medium tracking-[0.14em] text-muted uppercase">Store</span>
          {selected ? (
            <button
              type="button"
              onClick={() => {
                setBoardStore(null);
                setLookup("");
              }}
              className="mt-2 flex h-12 w-full items-center justify-between rounded-full bg-ink px-4 text-sm text-accent-fg"
            >
              <span>{selected.name}</span>
              <span className="text-xs text-accent-fg/70">Change</span>
            </button>
          ) : (
            <input
              value={lookup}
              onChange={(e) => setLookup(e.target.value)}
              placeholder="Vons, Sephora, GameStop…"
              className="mt-2 h-12 w-full rounded-full bg-bg px-4 text-sm text-ink outline-none"
            />
          )}
        </label>
        {!selected ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {matches.map((store) => (
              <button
                key={store.id}
                type="button"
                onClick={() => {
                  setBoardStore(store.id);
                  setLookup("");
                }}
                className="h-9 rounded-full bg-bg px-3 text-xs font-medium"
              >
                {store.name}
              </button>
            ))}
          </div>
        ) : null}

        <div className="mt-4 flex gap-1 rounded-full bg-bg p-1">
          {(
            [
              ["comment", "Comment"],
              ["wish", "Wish"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setKind(id)}
              className={cn(
                "h-10 flex-1 rounded-full text-sm font-medium",
                kind === id ? "bg-ink text-accent-fg" : "text-muted",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="mt-4 block">
          <span className="text-xs font-medium tracking-[0.14em] text-muted uppercase">
            {kind === "wish" ? "What should they carry" : "How is this store"}
          </span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            maxLength={280}
            placeholder={
              kind === "wish"
                ? "They should price-match Costco on cereal…"
                : "Floor is right, pickup is fast, parking is a mess."
            }
            className="mt-2 min-h-24 w-full resize-none rounded-2xl bg-bg px-4 py-3 text-sm leading-relaxed text-ink outline-none"
          />
        </label>
        <label className="mt-3 block">
          <span className="text-xs font-medium tracking-[0.14em] text-muted uppercase">Sign it</span>
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            maxLength={24}
            placeholder="Neighbor"
            className="mt-2 h-12 w-full rounded-full bg-bg px-4 text-sm text-ink outline-none"
          />
        </label>
        {error ? <p className="mt-3 text-sm text-clay">{error}</p> : null}
        <Button className="mt-4 w-full" disabled={busy || !selected || body.trim().length < 4}>
          {busy ? "Posting…" : kind === "wish" ? "Pin a wish" : "Note this store"}
        </Button>
      </form>

      <section className="flex flex-col gap-6">
        {!loaded ? <p className="text-sm text-muted">Loading notes…</p> : null}
        {loaded && grouped.length === 0 ? (
          <div className="rounded-3xl bg-paper px-5 py-8 shadow-[var(--shadow-card)]">
            <MessageCircle className="size-6 text-muted" />
            <p className="font-display mt-3 text-2xl tracking-[-0.03em]">No store notes yet</p>
            <p className="mt-2 text-sm text-muted">Hunt an item, then tap Note on a listing — or pick a store here.</p>
          </div>
        ) : null}
        {grouped.map(([storeId, list]) => (
          <section key={storeId}>
            <h2 className="font-display text-xl tracking-[-0.03em]">{list[0]?.storeName}</h2>
            <div className="mt-3 flex flex-col gap-2">
              {list.map((post) => (
                <article key={post.id} className="rounded-3xl bg-paper px-4 py-4 shadow-[var(--shadow-card)]">
                  <p className="flex items-center gap-2 text-xs font-medium tracking-[0.14em] text-muted uppercase">
                    {post.kind === "wish" ? <Lightbulb className="size-3.5" /> : <MessageCircle className="size-3.5" />}
                    {post.kind === "wish" ? "Wish" : "Comment"} · {post.handle}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed">{post.body}</p>
                </article>
              ))}
            </div>
          </section>
        ))}
      </section>
    </div>
  );
}
