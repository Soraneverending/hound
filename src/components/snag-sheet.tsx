import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/engine";
import { useHound } from "@/lib/hound-store";

export function SnagSheet() {
  const snag = useHound((s) => s.snag);
  const undo = useHound((s) => s.undoSnag);
  const complete = useHound((s) => s.completeSnag);
  const [left, setLeft] = useState(7);

  useEffect(() => {
    if (!snag) return;
    const tick = () => {
      const ms = snag.endsAt - Date.now();
      if (ms <= 0) {
        complete();
        return;
      }
      setLeft(Math.ceil(ms / 1000));
    };
    tick();
    const t = window.setInterval(tick, 200);
    return () => window.clearInterval(t);
  }, [snag, complete]);

  if (!snag) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center p-4 pb-24">
      <div className="pointer-events-auto w-full max-w-md rounded-[28px] bg-paper p-5 shadow-[var(--shadow-card)] ring-1 ring-ink/10">
        <p className="text-[10px] font-medium tracking-[0.18em] text-muted uppercase">Snag</p>
        <h2 className="font-display mt-1 text-2xl leading-tight tracking-[-0.03em]">
          {snag.storeName} is ready
        </h2>
        <p className="mt-2 text-sm text-muted">
          {snag.name} is {formatMoney(snag.total)}. Hound does not charge your card. Undo if this is not the copy you want.
        </p>
        <p className="font-mono mt-4 text-3xl tabular-nums">{left}s</p>
        <div className="mt-5 flex gap-2">
          <Button variant="soft" className="flex-1" onClick={undo}>
            Undo
          </Button>
          <Button className="flex-1" onClick={complete}>
            Keep it
          </Button>
        </div>
      </div>
    </div>
  );
}
