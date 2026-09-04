import { NETWORKS, NO_PAY_NOTE } from "@/lib/affiliates";
import { useHound } from "@/lib/hound-store";

export function PartnerPanel() {
  const tags = useHound((s) => s.partnerTags);
  const setTag = useHound((s) => s.setPartnerTag);
  const clicks = useHound((s) => s.clicks);
  const ready = NETWORKS.filter((n) => tags[n.id]?.trim()).length;

  return (
    <details className="rounded-2xl bg-paper px-4 py-3 shadow-[var(--shadow-card)]">
      <summary className="cursor-pointer text-sm font-medium">
        Partner tags · {ready} set
      </summary>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Paste IDs from Amazon, eBay, Impact, CJ, Rakuten, AliExpress. Rank never changes. {NO_PAY_NOTE}
      </p>
      <div className="mt-4 flex flex-col gap-3">
        {NETWORKS.map((network) => (
          <label key={network.id} className="block">
            <span className="text-xs font-medium text-muted">{network.label}</span>
            <input
              value={tags[network.id] ?? ""}
              onChange={(e) => setTag(network.id, e.target.value)}
              placeholder={network.placeholder}
              autoCapitalize="none"
              autoCorrect="off"
              className="mt-1 h-11 w-full rounded-2xl bg-bg px-3 font-mono text-sm text-ink outline-none"
            />
          </label>
        ))}
      </div>
      {clicks.length > 0 ? (
        <ol className="mt-4 flex flex-col gap-2">
          {clicks.slice(0, 6).map((click) => (
            <li key={click.id} className="text-xs text-muted">
              {click.storeName} · {click.item} · {click.tagged ? "tagged" : "no tag"}
            </li>
          ))}
        </ol>
      ) : null}
    </details>
  );
}
