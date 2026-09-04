import { PRODUCTS, categoryLabel, formatMoney, rankOffers, storeCount } from "@/lib/engine";
import { STORES, storesByKind } from "@/lib/stores";
import { runHunt } from "@/lib/run-hunt";
import { ProductCover } from "@/components/product-cover";
import type { Category, StoreKind } from "@/lib/types";

const ORDER: Category[] = [
  "games",
  "groceries",
  "beauty",
  "clothes",
  "books",
  "collectibles",
  "cars",
  "electronics",
  "pharmacy",
  "home",
];

const KIND_LABEL: Partial<Record<StoreKind, string>> = {
  mall: "Mall tenants",
  grocery: "Food",
  beauty: "Makeup",
  shop: "Shop + independents",
  marketplace: "Marketplaces",
  bigbox: "Big box",
  luxury: "Luxury",
  thrift: "Thrift",
  digital: "Digital",
  auto: "Cars",
  pharmacy: "Pharmacy",
  club: "Clubs",
};

const FLOOR = Object.fromEntries(PRODUCTS.map((p) => [p.id, rankOffers(p)[0]?.total ?? null]));

export function AislesScreen() {
  const groups = storesByKind().filter(([kind]) => KIND_LABEL[kind]);
  return (
    <div className="flex flex-col gap-8 pb-10">
      <header className="pl-12">
        <p className="text-[11px] font-medium tracking-[0.18em] text-muted uppercase">
          {storeCount()} storefronts · mall · food · makeup · Shop
        </p>
        <h1 className="font-display mt-1 text-[2.2rem] leading-[1.05] tracking-[-0.03em]">
          If it sells, it should show up.
        </h1>
        <p className="mt-2 text-sm text-muted">
          Named tenants, grocers, beauty counters, and Shop independents. We cannot live-index every Shopify merchant — Shop is the door for those.
        </p>
      </header>

      {groups.map(([kind, list]) => (
        <details key={kind} className="rounded-2xl bg-paper px-4 py-3 shadow-[var(--shadow-card)]">
          <summary className="cursor-pointer font-display text-lg tracking-[-0.03em]">
            {KIND_LABEL[kind]} · {list.length}
          </summary>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {list.map((s) => (
              <span key={s.id} className="rounded-full bg-bg px-2.5 py-1 text-xs text-ink">
                {s.name}
              </span>
            ))}
          </div>
        </details>
      ))}

      {ORDER.map((cat) => {
        const items = PRODUCTS.filter((p) => p.category === cat);
        if (items.length === 0) return null;
        return (
          <section key={cat}>
            <h2 className="font-display text-xl tracking-[-0.03em]">{categoryLabel(cat)}</h2>
            <div className="mt-3 flex flex-col gap-2">
              {items.map((p) => {
                const floor = FLOOR[p.id];
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => void runHunt(p.name)}
                    className="flex min-h-14 items-center justify-between gap-3 rounded-2xl bg-paper px-3 text-left shadow-[var(--shadow-card)]"
                  >
                    <ProductCover
                      name={p.name}
                      brand={p.brand}
                      category={p.category}
                      src={p.image}
                      className="size-11 shrink-0"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{p.name}</span>
                      <span className="mt-0.5 block text-xs text-muted">{p.brand}</span>
                    </span>
                    <span className="font-mono text-sm tabular-nums">{floor != null ? formatMoney(floor) : "—"}</span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
      <p className="text-xs text-muted">{STORES.length} named storefronts in this hunt map.</p>
    </div>
  );
}
