import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/engine";
import { partnerHref } from "@/lib/affiliates";
import { ProductCover } from "@/components/product-cover";
import { useHound } from "@/lib/hound-store";
import type { Category, RankedOffer } from "@/lib/types";

export function OfferRow({
  offer,
  floor,
  name,
  image,
  category,
}: {
  offer: RankedOffer;
  floor: number;
  name: string;
  image?: string;
  category: Category;
}) {
  const delta = offer.total - floor;
  const zip = useHound((s) => s.zip);
  const nearHome = zip === "91741";
  const tags = useHound((s) => s.partnerTags);
  const href = partnerHref(offer.storeId, name, tags, offer.url);
  const recordClick = useHound((s) => s.recordClick);
  const noteStore = useHound((s) => s.noteStore);
  const thumb = offer.image || image;
  const liveListing = Boolean(offer.live && href && !/cheapshark\.com/i.test(href));
  const searchOnly = Boolean(offer.searchOnly);

  function markClick() {
    recordClick({ storeId: offer.storeId, storeName: offer.store.name, name });
  }

  return (
    <div
      className={cn(
        "rounded-2xl bg-paper shadow-[var(--shadow-card)]",
        offer.isFloor && "ring-1 ring-ink",
      )}
    >
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={markClick}
        className="flex w-full items-center gap-3 px-3 py-3 text-left text-inherit no-underline select-none"
      >
        <ProductCover
          name={name}
          brand={offer.store.name}
          category={category}
          src={thumb}
          fit="cover"
          className="size-14 shrink-0"
        />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">{offer.store.name}</span>
            {offer.isFloor ? (
              <span className="text-xs font-medium tracking-[0.12em] text-muted uppercase">Floor</span>
            ) : null}
            {offer.live ? (
              <span className="text-xs font-medium tracking-[0.12em] text-good uppercase">Live</span>
            ) : searchOnly ? (
              <span className="text-xs font-medium tracking-[0.12em] text-muted uppercase">About</span>
            ) : null}
          </span>
          <span className="mt-1 block text-xs text-muted">
            {offer.condition.replace("-", " ")}
            {offer.store.paypal ? " · PayPal" : ""}
            {nearHome && offer.store.miles != null && offer.store.pickup ? ` · ${offer.store.miles} mi` : ""}
          </span>
        </span>
        <span className="shrink-0 text-right">
          <span className="font-mono block text-base font-medium tabular-nums">{formatMoney(offer.total)}</span>
          {!offer.isFloor && delta > 0 ? (
            <span className="mt-0.5 block text-xs text-muted tabular-nums">+{formatMoney(delta)}</span>
          ) : searchOnly && !offer.live ? (
            <span className="mt-0.5 block text-xs text-muted">confirm there</span>
          ) : null}
        </span>
      </a>
      <div className="flex border-t border-line px-2">
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={markClick}
          className="flex h-11 flex-1 items-center justify-center text-xs font-medium text-ink no-underline"
        >
          {liveListing ? "Open listing" : searchOnly ? "Search listings" : "Search store"}
        </a>
        <button
          type="button"
          onClick={() => noteStore(offer.storeId)}
          className="h-11 flex-1 text-xs font-medium text-muted"
        >
          Note store
        </button>
      </div>
    </div>
  );
}
