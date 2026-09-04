import { useState } from "react";
import { MapPin } from "lucide-react";
import { useHound } from "@/lib/hound-store";

async function cityForZip(zip: string) {
  try {
    const res = await fetch(`https://api.zippopotam.us/us/${zip}`);
    if (!res.ok) return "";
    const json = (await res.json()) as { places?: { "place name"?: string }[] };
    return json.places?.[0]?.["place name"] || "";
  } catch {
    return "";
  }
}

export function PlaceChip() {
  const zip = useHound((s) => s.zip);
  const city = useHound((s) => s.city);
  const setPlace = useHound((s) => s.setPlace);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(zip);
  const [busy, setBusy] = useState(false);

  async function apply(nextZip: string, nextCity?: string) {
    const z = nextZip.replace(/\D/g, "").slice(0, 5);
    if (z.length !== 5) return;
    const cityName = nextCity || (await cityForZip(z));
    setPlace(z, cityName);
    setOpen(false);
  }

  function locate() {
    if (!navigator.geolocation) return;
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&localityLanguage=en`;
          const json = (await (await fetch(url)).json()) as { postcode?: string; city?: string; locality?: string };
          const z = (json.postcode || "").replace(/\D/g, "").slice(0, 5);
          if (z.length === 5) await apply(z, json.city || json.locality);
        } finally {
          setBusy(false);
        }
      },
      () => setBusy(false),
      { timeout: 8000 },
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          setDraft(zip);
          setOpen((v) => !v);
        }}
        className="inline-flex items-center gap-1 text-xs font-medium tracking-[0.16em] text-muted uppercase"
      >
        <MapPin className="size-3.5" />
        {city} · {zip}
      </button>
      {open ? (
        <form
          className="mt-2 flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void apply(draft);
          }}
        >
          <input
            inputMode="numeric"
            autoComplete="postal-code"
            value={draft}
            onChange={(e) => setDraft(e.target.value.replace(/\D/g, "").slice(0, 5))}
            placeholder="ZIP"
            className="h-10 w-24 rounded-full bg-paper px-3 text-sm shadow-[var(--shadow-card)] outline-none"
            aria-label="ZIP code"
          />
          <button type="submit" className="h-10 rounded-full bg-ink px-3 text-sm text-accent-fg">
            Use ZIP
          </button>
          <button type="button" onClick={locate} disabled={busy} className="h-10 rounded-full bg-paper px-3 text-sm shadow-[var(--shadow-card)]">
            {busy ? "Locating…" : "Use location"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
