import { useEffect } from "react";
import { useHound } from "@/lib/hound-store";

export function PingBar() {
  const latest = useHound((s) => s.pings[0] ?? null);
  const notice = useHound((s) => s.notice);
  const setNotice = useHound((s) => s.setNotice);
  const setTab = useHound((s) => s.setTab);
  const mark = useHound((s) => s.markPingsRead);
  const shown = notice || (latest && !latest.read ? `${latest.title} · ${latest.body}` : null);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 3200);
    return () => window.clearTimeout(t);
  }, [notice, setNotice]);

  if (!shown) return null;

  return (
    <button
      type="button"
      onClick={() => {
        setTab("pins");
        mark();
        setNotice(null);
      }}
      className="mx-4 mt-2 rounded-2xl bg-ink px-4 py-3 text-left text-accent-fg shadow-[var(--shadow-card)]"
    >
      <p className="text-[10px] font-medium tracking-[0.16em] uppercase opacity-70">Ping</p>
      <p className="mt-0.5 text-sm leading-snug">{shown}</p>
    </button>
  );
}
