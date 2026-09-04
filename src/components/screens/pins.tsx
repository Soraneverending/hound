import { Pin, Trash2 } from "lucide-react";
import { PartnerPanel } from "@/components/screens/partner";
import { ProductCover } from "@/components/product-cover";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/engine";
import { FREE_PIN_LIMIT, useHound } from "@/lib/hound-store";
import { refreshPins, runHunt } from "@/lib/run-hunt";
import type { Pin as PinType } from "@/lib/types";

export function PinsScreen() {
  const pins = useHound((s) => s.pins);
  const pings = useHound((s) => s.pings);
  const budget = useHound((s) => s.budget);
  const setBudget = useHound((s) => s.setBudget);
  const mark = useHound((s) => s.markPingsRead);
  const enableNotify = useHound((s) => s.enableNotify);
  const notifyOn = useHound((s) => s.notifyOn);
  const setTab = useHound((s) => s.setTab);
  const pro = useHound((s) => s.pro);
  const setPro = useHound((s) => s.setPro);
  const hunting = useHound((s) => s.hunting);

  return (
    <div className="flex flex-col gap-6 pb-10">
      <header>
        <p className="text-xs font-medium tracking-[0.16em] text-muted uppercase">Live board</p>
        <h1 className="font-display mt-2 text-4xl leading-[1.05] tracking-[-0.04em]">Pins ping the moment it drops.</h1>
      </header>

      <div className="flex items-center justify-between gap-3 rounded-2xl bg-paper px-4 py-3 shadow-[var(--shadow-card)]">
        <div className="min-w-0">
          <p className="text-sm font-medium">{pro ? "Hound Pro on" : `Free · ${pins.length}/${FREE_PIN_LIMIT} pins`}</p>
          <p className="text-xs text-muted">{pro ? "Unlimited pins and Snag" : "Snag is Pro"}</p>
        </div>
        <Button variant={pro ? "soft" : "primary"} size="sm" type="button" onClick={() => setPro(!pro)}>
          {pro ? "Free" : "Pro"}
        </Button>
      </div>

      <PartnerPanel />

      <label className="block rounded-2xl bg-paper px-4 py-3 shadow-[var(--shadow-card)]">
        <span className="text-xs font-medium tracking-[0.14em] text-muted uppercase">Budget ceiling</span>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-mono text-lg text-muted">$</span>
          <input
            type="number"
            min={0}
            step="1"
            value={budget || ""}
            placeholder="0"
            onChange={(e) => setBudget(Number(e.target.value) || 0)}
            className="font-mono min-w-0 flex-1 bg-transparent text-2xl tabular-nums outline-none"
          />
        </div>
      </label>

      <div className="flex gap-2">
        <Button variant="soft" className="flex-1" onClick={enableNotify}>
          {notifyOn ? "Pings on" : "Allow pings"}
        </Button>
        <Button variant="ghost" disabled={hunting || pins.length === 0} onClick={() => void refreshPins()}>
          {hunting ? "…" : "Refresh"}
        </Button>
      </div>

      {pins.length === 0 ? (
        <div className="rounded-2xl bg-paper px-5 py-8 shadow-[var(--shadow-card)]">
          <Pin className="size-5 text-muted" />
          <p className="font-display mt-3 text-xl tracking-[-0.03em]">Nothing pinned</p>
          <p className="mt-1 text-sm text-muted">Hunt an item, then pin it.</p>
          <Button className="mt-4" onClick={() => setTab("hunt")}>
            Start a hunt
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {pins.map((pin) => (
            <PinCard key={pin.id} pin={pin} />
          ))}
        </div>
      )}

      {pings.length > 0 ? (
        <section>
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium tracking-[0.16em] text-muted uppercase">Pings</p>
            {pings.some((p) => !p.read) ? (
              <button type="button" onClick={mark} className="h-10 text-xs font-medium text-muted">
                Mark read
              </button>
            ) : null}
          </div>
          <ol className="mt-2 flex flex-col gap-2">
            {pings.slice(0, 12).map((p) => (
              <li
                key={p.id}
                className={
                  p.read
                    ? "rounded-2xl bg-paper px-4 py-3 text-sm shadow-[var(--shadow-card)]"
                    : "rounded-2xl bg-ink px-4 py-3 text-sm text-accent-fg"
                }
              >
                <p className="font-medium">{p.title}</p>
                <p className={p.read ? "mt-1 text-xs text-muted" : "mt-1 text-xs text-accent-fg/70"}>{p.body}</p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  );
}

function PinCard({ pin }: { pin: PinType }) {
  const toggleSnag = useHound((s) => s.toggleSnag);
  const setTarget = useHound((s) => s.setTarget);
  const unpin = useHound((s) => s.unpin);
  const under = pin.lastFloor <= pin.target;
  const gap = pin.lastFloor - pin.target;

  return (
    <article className="rounded-2xl bg-paper p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-3">
        <button type="button" className="flex min-w-0 items-start gap-3 text-left" onClick={() => void runHunt(pin.name, "search", { category: pin.category, image: pin.image })}>
          <ProductCover
            name={pin.name}
            brand={pin.brand}
            category={pin.category}
            src={pin.image}
            className="size-12 shrink-0"
            fit="contain"
          />
          <span className="min-w-0">
            <p className="text-xs font-medium tracking-[0.14em] text-muted uppercase">{pin.brand}</p>
            <h3 className="mt-0.5 text-base leading-snug font-medium">{pin.name}</h3>
          </span>
        </button>
        <button type="button" aria-label="Remove pin" onClick={() => unpin(pin.id)} className="grid size-11 place-items-center text-faint">
          <Trash2 className="size-4" />
        </button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs tracking-[0.12em] text-muted uppercase">Floor</p>
          <p className="font-mono text-xl tabular-nums">{formatMoney(pin.lastFloor)}</p>
        </div>
        <label>
          <p className="text-xs tracking-[0.12em] text-muted uppercase">Target</p>
          <input
            type="text"
            inputMode="decimal"
            value={pin.target.toFixed(2)}
            onChange={(e) => setTarget(pin.id, Number(e.target.value) || 0)}
            className="font-mono w-full bg-transparent text-xl tabular-nums outline-none"
          />
        </label>
      </div>
      <p className="mt-2 text-xs text-muted">
        {pin.snaggedAt ? "Snagged" : under ? "At or under target" : `${formatMoney(gap)} above`}
      </p>
      <button
        type="button"
        onClick={() => toggleSnag(pin.id)}
        className="mt-3 flex min-h-11 w-full items-center justify-between rounded-xl bg-bg px-3 text-sm"
      >
        <span>Snag</span>
        <span className={pin.snag ? "font-medium" : "text-muted"}>{pin.snag ? "On" : "Off"}</span>
      </button>
    </article>
  );
}
