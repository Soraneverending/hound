import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Camera, Pin, ScanLine, Search } from "lucide-react";
import { OfferRow } from "@/components/offer-row";
import { ProductCover } from "@/components/product-cover";
import { Button } from "@/components/ui/button";
import { PRODUCT_MAP, KEY_HEAD, bestNew, bestTrusted, categoryLabel, findProduct, formatMoney, highlightOffers, isToyQuery, listingUrl, storeCount } from "@/lib/engine";
import { suggest, isAisleQuery, isFranchiseQuery } from "@/lib/suggest";
import { haptic } from "@/lib/haptics";
import { useHound } from "@/lib/hound-store";
import { runFromImage, runHunt, shotFor, unlockUi, goHome } from "@/lib/run-hunt";
import { STORE_MAP, isTradingCard } from "@/lib/stores";
import type { HuntResult, RankedOffer } from "@/lib/types";

const SAMPLES = [
  { id: "yakuza-lad", label: "Yakuza", hint: "Keys vs OfferUp" },
  { id: "cheerios", label: "Cheerios", hint: "Vons vs Costco" },
  { id: "fenty-soft-matte", label: "Fenty", hint: "Sephora vs Shop" },
  { id: "armani-blazer", label: "Armani", hint: "Goodwill to the mall" },
]
  .map((row) => {
    const product = PRODUCT_MAP[row.id];
    return product ? { ...row, product } : null;
  })
  .filter(Boolean) as { id: string; label: string; hint: string; product: (typeof PRODUCT_MAP)[string] }[];

function startHunt(name: string, image?: string, category?: string) {
  unlockUi();
  haptic("light");
  void runHunt(name, "search", { image, category });
}

function pressProps(run: () => void) {
  return {
    onClick: (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      run();
    },
  };
}

export function HuntScreen() {
  const result = useHound((s) => s.result);
  const hunting = useHound((s) => s.hunting);
  const status = useHound((s) => s.status);

  useEffect(() => {
    if (!result) return;
    const el = document.querySelector(".app-scroll");
    if (el) el.scrollTop = 0;
  }, [result?.product.id]);

  return (
    <div className="flex flex-col gap-4 pb-4">
      {result ? (
        <ResultsPanel result={result} hunting={hunting} status={status} onBack={() => goHome()} />
      ) : (
        <HomePanel hunting={hunting} status={status} />
      )}
    </div>
  );
}

function HomePanel({ hunting, status }: { hunting: boolean; status: string }) {
  const photoRef = useRef<HTMLInputElement>(null);
  const [camKey, setCamKey] = useState(0);

  return (
    <>
      <header>
        <p className="text-xs font-medium tracking-[0.16em] text-muted uppercase">
          Glendora · {storeCount()} storefronts
        </p>
        <h1 className="font-display mt-1 text-3xl leading-[1.08] tracking-[-0.04em]">Point at it. Pay less.</h1>
        <p className="mt-2 max-w-[32ch] text-sm leading-relaxed text-muted">
          Scan, pin, snag. Mall to Shop. Your look, your floor.
        </p>
      </header>

      <button
        type="button"
        onClick={() => photoRef.current?.click()}
        className="flex min-h-14 items-center gap-3 rounded-2xl bg-ink px-4 text-left text-accent-fg"
      >
        <ScanLine className="size-5 shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">Photo or barcode</span>
          <span className="block text-xs text-accent-fg/65">Library photos work here</span>
        </span>
        <Camera className="size-4 opacity-70" />
      </button>
      <input
        key={camKey}
        ref={photoRef}
        type="file"
        accept="image/*"
        className="hidden"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          setCamKey((n) => n + 1);
          unlockUi();
          if (file) void runFromImage(file);
        }}
      />

      <section>
        <p className="text-xs font-medium tracking-[0.16em] text-muted uppercase">Try a hunt</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {SAMPLES.map((s) => (
            <button
              key={s.id}
              type="button"
              {...pressProps(() => startHunt(s.product.name, s.product.image, s.product.category))}
              className="overflow-hidden rounded-2xl bg-paper text-left shadow-[var(--shadow-card)] select-none touch-manipulation active:scale-[0.99]"
            >
              <ProductCover
                name={s.product.name}
                brand={s.product.brand}
                category={s.product.category}
                src={s.product.image}
                eager
                className="aspect-[3/4] w-full rounded-none"
              />
              <span className="block px-3 py-2.5">
                <span className="block font-display text-xl tracking-[-0.03em]">{s.label}</span>
                <span className="mt-0.5 block text-xs text-muted">{s.hint}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <RecentHunts />
      {hunting ? <p className="text-sm text-muted">{status || "Hunting…"}</p> : null}
    </>
  );
}

export function SearchChrome() {
  const query = useHound((s) => s.query);
  const setQuery = useHound((s) => s.setQuery);
  const recent = useHound((s) => s.recent ?? []);
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const hints = open && query.trim().length >= 2 ? suggest(query, recent) : [];

  function huntNow(q = query) {
    const next = q.trim();
    if (!next) return;
    setQuery(next);
    setOpen(false);
    inputRef.current?.blur();
    void runHunt(next);
  }

  return (
    <div ref={boxRef} className="relative z-30 bg-bg px-4 pt-2 pb-2">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-faint" />
        <input
          ref={inputRef}
          data-hound-search="1"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={(e) => {
            setOpen(true);
            try {
              e.target.focus({ preventScroll: true });
            } catch {
              /* older webkit */
            }
            window.scrollTo(0, 0);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            huntNow();
          }}
          onBlur={(e) => {
            const next = e.relatedTarget;
            if (next instanceof Node && boxRef.current?.contains(next)) return;
            window.setTimeout(() => setOpen(false), 120);
            window.scrollTo(0, 0);
            const sc = document.querySelector(".app-scroll");
            if (sc instanceof HTMLElement) sc.scrollTop = 0;
          }}
          placeholder="Name or title"
          enterKeyHint="search"
          inputMode="search"
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          name="q"
          className="h-12 w-full rounded-full bg-paper pr-[4.6rem] pl-11 text-base shadow-[var(--shadow-card)] outline-none ring-ink/15 focus:ring-2"
        />
        <button
          type="button"
          disabled={!query.trim()}
          onClick={() => huntNow()}
          className="absolute top-1.5 right-1.5 z-10 h-9 rounded-full bg-ink px-3.5 text-sm font-medium text-accent-fg disabled:opacity-40"
        >
          Hunt
        </button>
      </div>
      {hints.length > 0 ? (
        <ul className="absolute inset-x-5 top-[calc(100%-4px)] z-40 max-h-[min(40vh,18rem)] overflow-y-auto rounded-2xl bg-paper shadow-[var(--shadow-card)]">
          {hints.map((h) => (
            <li key={h.q}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => huntNow(h.q)}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left active:bg-desk"
              >
                {h.image ? (
                  <img src={h.image} alt="" className="size-9 rounded-lg object-cover" />
                ) : (
                  <span className="grid size-9 place-items-center rounded-lg bg-desk text-xs font-medium text-muted">
                    {h.label.slice(0, 1)}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{h.label}</span>
                  <span className="block truncate text-xs text-muted">{h.hint}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function RecentHunts() {
  const recent = useHound((s) => s.recent ?? []);
  if (recent.length === 0) return null;
  return (
    <section>
      <p className="text-xs font-medium tracking-[0.16em] text-muted uppercase">Recent hunts</p>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
        {recent.map((r) => {
          const cover = r.image || coverForQuery(r.q);
          return (
            <button
              key={r.q}
              type="button"
              {...pressProps(() => startHunt(r.q, cover))}
              className="flex h-11 max-w-[14rem] shrink-0 items-center gap-2 rounded-full bg-paper pr-3.5 pl-1.5 text-xs font-medium shadow-[var(--shadow-card)] select-none touch-manipulation"
            >
              {cover ? (
                <img src={cover} alt="" className="size-8 rounded-full object-cover" />
              ) : (
                <span className="grid size-8 place-items-center rounded-full bg-desk text-[11px] text-muted">
                  {r.q.slice(0, 1).toUpperCase()}
                </span>
              )}
              <span className="truncate">{r.q}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function filterOffers(offers: RankedOffer[], paypalOnly: boolean, pickupOnly: boolean, newOnly: boolean) {
  return offers.filter((o) => {
    if (paypalOnly && !o.store.paypal) return false;
    if (pickupOnly && !o.store.pickup) return false;
    if (newOnly && o.condition !== "new") return false;
    return o.stock !== "out";
  });
}

function ResultsPanel({
  result,
  hunting,
  status,
  onBack,
}: {
  result: HuntResult;
  hunting: boolean;
  status: string;
  onBack: () => void;
}) {
  const paypalOnly = useHound((s) => s.paypalOnly);
  const pickupOnly = useHound((s) => s.pickupOnly);
  const newOnly = useHound((s) => s.newOnly);
  const budget = useHound((s) => s.budget);
  const setPaypalOnly = useHound((s) => s.setPaypalOnly);
  const setPickupOnly = useHound((s) => s.setPickupOnly);
  const setNewOnly = useHound((s) => s.setNewOnly);
  const [pinOpen, setPinOpen] = useState<"pin" | "snag" | null>(null);
  const pro = useHound((s) => s.pro);
  const setTab = useHound((s) => s.setTab);

  const filtered = filterOffers(result.offers, paypalOnly, pickupOnly, newOnly);
  const floor = filtered.find((o) => !o.searchOnly) ?? null;
  const offers = filtered.map((o) => ({
    ...o,
    isFloor: floor ? o.id === floor.id : false,
    nearFloor: Boolean(floor && !o.searchOnly && o.total <= Math.max(floor.total * 1.08, floor.total + 4)),
  }));
  const isGame = result.product.category === "games";
  const keyRank = (id: string) => {
    const i = (KEY_HEAD as readonly string[]).indexOf(id);
    return i < 0 ? 20 : i;
  };
  const keys = offers
    .filter((o) => o.store.kind === "digital")
    .sort((a, b) => {
      if (!!a.searchOnly !== !!b.searchOnly) return a.searchOnly ? 1 : -1;
      if (!!a.live !== !!b.live) return a.live ? -1 : 1;
      if (!a.searchOnly && !b.searchOnly) return a.total - b.total;
      return keyRank(a.storeId) - keyRank(b.storeId) || a.store.name.localeCompare(b.store.name);
    });
  const picks = highlightOffers(offers.filter((o) => !o.searchOnly && !(isGame && o.store.kind === "digital")));
  const people = offers.filter(
    (o) => o.searchOnly && (o.store.kind === "marketplace" || o.store.kind === "shop" || o.store.kind === "handmade"),
  );
  const shelves = offers.filter(
    (o) => o.searchOnly && o.store.kind !== "marketplace" && o.store.kind !== "shop" && o.store.kind !== "handmade" && o.store.kind !== "digital",
  );
  const moreKeys = isGame ? [] : offers.filter((o) => o.searchOnly && o.store.kind === "digital");
  const rest = offers.filter((o) => !o.searchOnly && !picks.some((p) => p.id === o.id) && !(isGame && o.store.kind === "digital"));
  const fresh = bestNew(offers.filter((o) => !o.searchOnly));
  const over = Boolean(budget && floor && floor.total > budget);
  const liveCount = offers.filter((o) => o.live).length;

  return (
    <div className="flex flex-col gap-5">
      <button type="button" {...pressProps(onBack)} className="flex h-11 w-max items-center gap-1 text-sm text-muted select-none">
        <ArrowLeft className="size-4" />
        New hunt
      </button>

      <div className="flex items-start gap-3">
        <ProductCover
          name={result.product.name}
          brand={result.product.brand}
          category={result.product.category}
          src={result.product.image}
          fit="contain"
          className="h-36 w-28 shrink-0 shadow-[var(--shadow-card)]"
        />
        <div className="min-w-0 pt-0.5">
          <p className="text-xs font-medium tracking-[0.14em] text-muted uppercase">
            {categoryLabel(result.product.category)}
            {liveCount ? ` · ${liveCount} live` : ""}
          </p>
          <h2 className="font-display mt-1 text-2xl leading-tight tracking-[-0.03em]">{result.product.name}</h2>
          <p className="mt-1 text-sm text-muted">{result.product.brand}</p>
          {result.product.ephemeral && !result.product.image && !hunting ? (
            <p className="mt-2 text-xs text-muted">No exact cover yet — pick a specific version below.</p>
          ) : null}
        </div>
      </div>

      {(result.matches ?? []).length > 0 ? (
        <section>
          <p className="text-xs font-medium tracking-[0.16em] text-muted uppercase">
            {isFranchiseQuery(result.product.name) && !result.offers.some((o) => o.live)
              ? "Which one did you mean?"
              : result.product.category === "games"
                ? "In the series"
                : isToyQuery(result.product.name)
                  ? "Popular sets"
                  : "Other versions"}
          </p>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {(result.matches ?? []).map((m) => (
              <button
                key={m.name}
                type="button"
                {...pressProps(() => startHunt(m.name, m.image, m.category))}
                className="w-28 shrink-0 overflow-hidden rounded-2xl bg-paper text-left shadow-[var(--shadow-card)] select-none"
              >
                <ProductCover
                  name={m.name}
                  brand=""
                  category={m.category ?? result.product.category}
                  src={m.image}
                  className="aspect-[3/4] w-full rounded-none"
                />
                <span className="block px-2 py-2">
                  <span className="block line-clamp-2 text-xs font-medium leading-snug">{m.name}</span>
                  <span className="mt-0.5 block truncate text-[10px] text-muted">{m.hint}</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <div className="rounded-3xl bg-ink px-5 py-5 text-accent-fg">
        <p className="text-xs font-medium tracking-[0.16em] uppercase opacity-70">
          {floor
            ? `${floor.live ? "Live" : "Search"} · ${floor.store.name}`
            : hunting
              ? "Sniffing live prices"
              : people.length + shelves.length + moreKeys.length > 0
                ? "Open a listing to see their price"
                : "No in-stock offers"}
        </p>
        <p className="font-mono mt-1 text-4xl tracking-[-0.04em] tabular-nums">
          {floor ? formatMoney(floor.total) : hunting ? "…" : "—"}
        </p>
        {fresh && floor && fresh.id !== floor.id ? (
          <p className="mt-3 border-t border-accent-fg/15 pt-3 text-sm text-accent-fg/75">
            Lowest new · {fresh.store.name} · {formatMoney(fresh.total)}
          </p>
        ) : null}
        {over ? <p className="mt-2 text-sm text-accent-fg/65">Over your ceiling — alternatives below.</p> : null}
      </div>

      {pinOpen && floor ? (
        <PinComposer result={{ ...result, offers, floor }} snagDefault={pinOpen === "snag"} onClose={() => setPinOpen(null)} />
      ) : (
        <div className="flex gap-2">
          <Button className="flex-1" type="button" disabled={!floor} onClick={() => setPinOpen("pin")}>
            <Pin className="size-4" />
            Pin this
          </Button>
          <Button
            variant="soft"
            className="flex-1"
            type="button"
            disabled={!floor && pro}
            onClick={() => {
              if (!pro) {
                setTab("pins");
                return;
              }
              setPinOpen("snag");
            }}
          >
            {pro ? "Pin + Snag" : "Snag is Pro"}
          </Button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <FilterChip on={paypalOnly} onClick={() => setPaypalOnly(!paypalOnly)} label="PayPal" />
        <FilterChip on={pickupOnly} onClick={() => setPickupOnly(!pickupOnly)} label="Pickup" />
        <FilterChip on={newOnly} onClick={() => setNewOnly(!newOnly)} label="New only" />
      </div>

      {hunting ? <p className="text-sm text-muted">{status}</p> : null}

      {isAisleQuery(result.product.name) && suggest(result.product.name).length > 0 && (
        <section>
          <p className="text-xs font-medium tracking-[0.16em] text-muted uppercase">
            {isAisleQuery(result.product.name) ? "Pick a specific item" : "Also try"}
          </p>
          <div className="mt-2 flex flex-col gap-1">
            {suggest(result.product.name).slice(0, 4).map((h) => (
              <button
                key={h.q}
                type="button"
                {...pressProps(() => startHunt(h.q, h.image, h.category))}
                className="flex items-center gap-3 rounded-2xl bg-paper px-3 py-2.5 text-left shadow-[var(--shadow-card)] select-none"
              >
                {h.image ? (
                  <img src={h.image} alt="" className="size-10 rounded-lg object-cover" />
                ) : (
                  <span className="grid size-10 place-items-center rounded-lg bg-desk text-sm font-medium text-muted">
                    {h.label.slice(0, 1)}
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{h.label}</span>
                  <span className="block truncate text-xs text-muted">{h.hint}</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {isTradingCard(`${result.product.brand} ${result.product.name}`) ? <TcgShops name={result.product.name} /> : null}

      {isGame ? (
        <OfferLane
          title="Steam, Humble, GMG"
          offers={keys}
          floor={floor}
          name={result.product.name}
          image={result.product.image}
          category={result.product.category}
          empty={hunting ? "Checking Steam, Humble, Green Man Gaming…" : "No digital shops for this title."}
        />
      ) : null}

      <OfferLane
        title="Best picks"
        offers={picks.slice(0, 4)}
        floor={floor}
        name={result.product.name}
        image={result.product.image}
        category={result.product.category}
        empty={
          isGame
            ? undefined
            : hunting
              ? "Waiting on live shops…"
              : pickupOnly
                ? "Pickup hides digital shops like GOG and Steam. Turn it off to see live keys."
                : "No live listings yet — search the shops below."
        }
      />

      <OfferLane
        title="People selling this"
        offers={people}
        floor={floor}
        name={result.product.name}
        image={result.product.image}
        category={result.product.category}
      />

      <OfferLane
        title="On shelves"
        offers={shelves}
        floor={floor}
        name={result.product.name}
        image={result.product.image}
        category={result.product.category}
      />

      <OfferLane
        title="The rest"
        offers={rest.concat(picks.slice(4))}
        floor={floor}
        name={result.product.name}
        image={result.product.image}
        category={result.product.category}
      />

      <OfferLane
        title="More keys"
        offers={moreKeys}
        floor={floor}
        name={result.product.name}
        image={result.product.image}
        category={result.product.category}
      />

      {result.alts.length > 0 && (
        <section>
          <p className="text-xs font-medium tracking-[0.16em] text-muted uppercase">
            {over ? "Under your ceiling" : "Close alternatives"}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {result.alts.map((p) => (
              <button
                key={p.id}
                type="button"
                {...pressProps(() => startHunt(p.name, p.image, p.category))}
                className="flex items-center gap-3 rounded-2xl bg-paper p-3 text-left shadow-[var(--shadow-card)] select-none touch-manipulation"
              >
                <ProductCover
                  name={p.name}
                  brand={p.brand}
                  category={p.category}
                  src={p.image}
                  className="size-11 shrink-0"
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{p.name}</span>
                  <span className="mt-1 block text-xs text-muted">{p.brand}</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      <RecentHunts />
    </div>
  );
}

function persistableImage(src?: string) {
  if (!src || src.startsWith("blob:")) return undefined;
  if (src.startsWith("data:") && src.length > 140_000) return undefined;
  return src;
}

function coverForQuery(q: string) {
  return shotFor(q) || findProduct(q)?.image;
}

const TCG_SHOPS = ["tcgplayer", "cardkingdom", "ebay"] as const;

function TcgShops({ name }: { name: string }) {
  return <ShopChips ids={TCG_SHOPS} name={name} label="Search" />;
}

function OfferLane({
  title,
  offers,
  floor,
  name,
  image,
  category,
  empty,
}: {
  title: string;
  offers: RankedOffer[];
  floor: RankedOffer | null;
  name: string;
  image?: string;
  category: HuntResult["product"]["category"];
  empty?: string;
}) {
  if (offers.length === 0 && !empty) return null;
  return (
    <section className="flex flex-col gap-2">
      <p className="text-xs font-medium tracking-[0.16em] text-muted uppercase">{title}</p>
      {offers.length === 0 ? (
        <p className="text-sm text-muted">{empty}</p>
      ) : (
        offers.map((offer) => (
          <OfferRow
            key={offer.id}
            offer={offer}
            floor={floor?.total ?? offer.total}
            name={name}
            image={image}
            category={category}
          />
        ))
      )}
    </section>
  );
}

function ShopChips({ ids, name, label }: { ids: readonly string[]; name: string; label: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {ids.map((id) => {
        const store = STORE_MAP[id];
        if (!store) return null;
        const href = listingUrl(id, name);
        return (
          <a
            key={id}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 shrink-0 items-center whitespace-nowrap rounded-full bg-paper px-4 text-xs font-medium text-ink no-underline shadow-[var(--shadow-card)]"
          >
            {label} {store.name}
          </a>
        );
      })}
    </div>
  );
}

function moneyTarget(raw: string, fallback: number) {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : fallback;
}

function FilterChip({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        on
          ? "h-10 rounded-full bg-ink px-4 text-xs font-medium text-accent-fg"
          : "h-10 rounded-full bg-paper px-4 text-xs font-medium text-muted shadow-[var(--shadow-card)]"
      }
    >
      {label}
    </button>
  );
}

function PinComposer({
  result,
  snagDefault,
  onClose,
}: {
  result: HuntResult;
  snagDefault: boolean;
  onClose: () => void;
}) {
  const floor = result.floor;
  const pinItem = useHound((s) => s.pinItem);
  const snagOffer = snagDefault ? bestTrusted(result.offers) ?? floor : floor;
  const [target, setTarget] = useState(snagOffer ? snagOffer.total.toFixed(2) : "0");
  const [snag, setSnag] = useState(snagDefault);

  if (!floor || !snagOffer) return null;

  return (
    <div className="rounded-3xl bg-paper p-5 shadow-[var(--shadow-card)]">
      <p className="text-xs font-medium tracking-[0.16em] text-muted uppercase">Pin</p>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Pings when the floor drops. Snag only opens trusted stores.
      </p>
      <label className="mt-4 block text-xs font-medium tracking-wide text-muted uppercase">
        Ping at or under
        <input
          type="text"
          inputMode="decimal"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="font-mono mt-2 h-12 w-full rounded-2xl bg-bg px-4 text-base text-ink tabular-nums outline-none ring-ink/15 focus:ring-2"
        />
      </label>
      <button
        type="button"
        onClick={() => setSnag((v) => !v)}
        className="mt-3 flex min-h-12 w-full items-center justify-between rounded-2xl bg-bg px-4 text-sm"
      >
        <span>Snag when it hits</span>
        <span className={snag ? "font-medium" : "text-muted"}>{snag ? "On" : "Off"}</span>
      </button>
      <div className="mt-4 flex gap-2">
        <Button variant="soft" className="flex-1" type="button" onClick={onClose}>
          Cancel
        </Button>
        <Button
          className="flex-1"
          type="button"
          onClick={() => {
            pinItem({
              productId: result.product.id,
              name: result.product.name,
              brand: result.product.brand,
              category: result.product.category,
              target: moneyTarget(target, snagOffer.total),
              lastFloor: snagOffer.total,
              storeId: snagOffer.storeId,
              storeName: snagOffer.store.name,
              snag,
              image: persistableImage(result.product.image),
            });
            onClose();
          }}
        >
          Pin it
        </Button>
      </div>
    </div>
  );
}
