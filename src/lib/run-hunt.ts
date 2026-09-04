import { huntLocal, isCategory, resolveQuery } from "@/lib/engine";
import { isAisleQuery, franchiseMatches, isAddonTitle } from "@/lib/suggest";
import { useHound } from "@/lib/hound-store";
import { enrichHunt, identifyPhoto } from "@/lib/lookup.functions";
import { readFrame } from "@/lib/image";
import { isTradingCard } from "@/lib/stores";
import type { Category, HuntMatch, HuntResult, Product } from "@/lib/types";

const SHOTS = new Map<string, string>();
let huntSeq = 0;

function isSearchFocused() {
  if (typeof document === "undefined") return false;
  const el = document.activeElement;
  return el instanceof HTMLInputElement && el.dataset.houndSearch === "1";
}

export function cancelHunt() {
  huntSeq += 1;
  const s = useHound.getState();
  s.setHunting(false, "");
}

export function goHome() {
  huntSeq += 1;
  useHound.getState().goHome();
}

export function huntIsCurrent(seq: number) {
  return seq === huntSeq;
}

function rememberShot(q: string, shot?: string) {
  if (!shot || shot.startsWith("blob:")) return;
  const key = q.trim().toLowerCase();
  if (!key) return;
  SHOTS.set(key, shot);
  if (SHOTS.size > 12) {
    const first = SHOTS.keys().next().value;
    if (first) SHOTS.delete(first);
  }
}

export function shotFor(q: string) {
  return SHOTS.get(q.trim().toLowerCase());
}

function isUserShot(src?: string) {
  return Boolean(src && (src.startsWith("data:") || src.startsWith("blob:")));
}

function blurActive() {
  if (typeof document === "undefined") return;
  const el = document.activeElement;
  if (el instanceof HTMLElement) el.blur();
}

function nameClose(query: string, identified: string) {
  const q = query.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const n = identified.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  if (!q || !n) return false;
  const tokens = q.split(" ").filter((w) => w.length > 2);
  if (tokens.length === 0) return n.includes(q);
  const hits = tokens.filter((t) => n.includes(t)).length;
  if (hits < Math.ceil(tokens.length * 0.7)) return false;
  const must = tokens.filter((t) => t.length >= 7);
  return must.length === 0 || must.every((t) => n.includes(t));
}

export function unlockUi() {
  blurActive();
}

export async function refreshPins() {
  const { pins, paypalOnly, pickupOnly, newOnly, budget, applyFloor, setHunting, setNotice } = useHound.getState();
  if (pins.length === 0) return;
  setHunting(true, "Refreshing live floors…");
  try {
    for (const pin of pins.slice(0, 8)) {
      const live = await enrichHunt({ data: { query: pin.name, category: pin.category } });
      const ranked = huntLocal(pin.name, live.extra, { paypalOnly, pickupOnly, newOnly, budget }, "search", {
        category: pin.category,
        image: pin.image || shotFor(pin.name),
      });
      if (ranked.floor) applyFloor(pin.id, ranked.floor.total, ranked.floor.storeId, ranked.floor.store.name);
    }
    setNotice("Live floors updated on your pins.");
  } catch {
    setNotice("Could not refresh live floors just then.");
  } finally {
    setHunting(false, "");
  }
}

function attachMatches(result: HuntResult, extra: HuntMatch[] = []): HuntResult {
  const query = result.product.name;
  const live = extra.filter((row) => !isAddonTitle(row.name, query));
  const images = new Map(live.map((row) => [row.name.trim().toLowerCase(), row.image]));
  const seed: HuntMatch[] = franchiseMatches(query).map((row) => ({
    name: row.q,
    image: row.image || images.get(row.q.trim().toLowerCase()),
    hint: row.hint,
    category: row.category,
  }));
  const seen = new Set([query.trim().toLowerCase()]);
  const matches: HuntMatch[] = [];
  for (const row of [...seed, ...live]) {
    const key = row.name.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    if (isAddonTitle(row.name, query)) continue;
    seen.add(key);
    matches.push({
      name: row.name,
      image: row.image,
      hint: row.hint,
      category: row.category ?? result.product.category,
    });
    if (matches.length >= 6) break;
  }
  return { ...result, matches };
}

function frameStub(image: string): HuntResult {
  return {
    product: {
      id: "shot",
      name: "This frame",
      brand: "Looking…",
      category: "collectibles",
      upc: "",
      aliases: [],
      typical: 0,
      alternatives: [],
      ephemeral: true,
      image,
    },
    offers: [],
    floor: null,
    near: [],
    alts: [],
    source: "vision",
  };
}

export async function runHunt(
  query: string,
  source: HuntResult["source"] = "search",
  hint?: { category?: string; brand?: string; image?: string; restore?: boolean },
) {
  const q = resolveQuery(query.trim()) || query.trim();
  if (!q) return;
  const store = useHound.getState();
  if (hint?.restore && (store.stayHome || isSearchFocused())) return;
  const seq = ++huntSeq;

  const { paypalOnly, pickupOnly, newOnly, budget, setHunting, setResult, remember, rememberHunt, setQuery, setScanning } =
    useHound.getState();
  useHound.setState({ stayHome: false, searchOpen: false });
  if (!hint?.restore) blurActive();
  setScanning(false);
  if (!hint?.restore) setQuery(q);
  const image = hint?.image || shotFor(q);
  remember(q, image);
  if (!hint?.restore) setHunting(true, "Sniffing live prices…");
  const meta = {
    category: isTradingCard(q)
      ? "collectibles"
      : hint?.category && isCategory(hint.category)
        ? (hint.category as Category)
        : undefined,
    brand: hint?.brand,
    image,
  };
  const local = attachMatches(huntLocal(q, [], { paypalOnly, pickupOnly, newOnly, budget }, source, meta));
  if (seq !== huntSeq) return;
  setResult(local);
  rememberHunt({
    q,
    category: local.product.category,
    image: image && (image.startsWith("http") || image.startsWith("/")) ? image : undefined,
  });
  if (isAisleQuery(q)) {
    if (seq === huntSeq) setHunting(false, "");
    return;
  }
  try {
    const live = await enrichHunt({
      data: {
        query: q,
        category: meta.category,
        place: `${useHound.getState().city} ${useHound.getState().zip}`.trim() || "Glendora CA 91741",
      },
    });
    if (seq !== huntSeq) return;
    if (useHound.getState().stayHome) return;
    const identified = live.identified?.name;
    const nextQuery =
      identified && !isAisleQuery(q) && nameClose(q, identified) ? identified : q;
    const keepShot = isUserShot(local.product.image) || isUserShot(image);
    const nextImage = keepShot
      ? local.product.image || image
      : local.product.image || image || (identified && nameClose(q, identified) ? live.image : undefined);
    if (nextImage) rememberShot(q, nextImage);
    if (nextImage && nextQuery !== q) rememberShot(nextQuery, nextImage);
    if (nextImage) remember(nextQuery, nextImage);
    const liveCat =
      live.category && isCategory(live.category) ? (live.category as Category) : local.product.category;
    const liveMatches = (live.candidates ?? []).map((c) => ({
      name: c.name,
      image: c.image,
      hint: c.hint,
      category: liveCat,
    }));
    if (live.extra.length || live.identified?.name || live.image || liveMatches.length || liveCat !== local.product.category) {
      if (useHound.getState().stayHome) return;
      setResult(
        attachMatches(
          huntLocal(nextQuery, live.extra, { paypalOnly, pickupOnly, newOnly, budget }, source, {
            category: liveCat,
            brand: local.product.brand,
            image: nextImage,
          }),
          liveMatches,
        ),
      );
      rememberHunt({
        q: nextQuery,
        category: liveCat,
        image: nextImage && (nextImage.startsWith("http") || nextImage.startsWith("/")) ? nextImage : undefined,
      });
    }
  } catch {
    // Keep the first paint if live feeds fail.
  } finally {
    if (seq === huntSeq) {
      setHunting(false, "");
      if (!isSearchFocused()) blurActive();
    }
  }
}

export async function runFromImage(file: File) {
  const { setHunting, setNotice, setResult } = useHound.getState();
  const preview = URL.createObjectURL(file);
  setHunting(true, "Opening the frame…");
  setResult(frameStub(preview));
  try {
    const { shot, vision } = await readFrame(file);
    const cover = shot || preview;
    const current = useHound.getState().result;
    if (shot && current?.product.id === "shot") {
      setResult({ ...current, product: { ...current.product, image: shot } satisfies Product });
      URL.revokeObjectURL(preview);
    }
    setHunting(true, "Reading the frame…");
    const payload = vision || shot;
    const visionP = payload ? identifyPhoto({ data: { image: payload } }) : Promise.resolve({ ok: false as const, error: "Could not read that photo." });
    const barcode = await withTimeout(readBarcode(file, payload), 80);
    if (barcode) {
      rememberShot(barcode, cover);
      await runHunt(barcode, "barcode", { image: cover });
      return;
    }
    setHunting(true, "Naming the item…");
    const id = await visionP;
    if (id.ok && (id.upc || id.name)) {
      const q = id.upc || id.name;
      rememberShot(q, cover);
      await runHunt(q, "vision", { category: id.category, brand: id.brand, image: cover });
      return;
    }
    useHound.getState().setResult(null);
    useHound.getState().setQuery("");
    setHunting(false, "");
    setNotice(id.ok ? "Could not read the title. Type what you see." : id.error);
  } catch {
    useHound.getState().setHunting(false, "");
    useHound.getState().setNotice("Could not read that photo.");
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | ""> {
  return new Promise((resolve) => {
    const t = window.setTimeout(() => resolve(""), ms);
    void promise.then(
      (value) => {
        window.clearTimeout(t);
        resolve(value);
      },
      () => {
        window.clearTimeout(t);
        resolve("");
      },
    );
  });
}

async function readBarcode(file: File, dataUrl: string) {
  const Detector = (
    window as unknown as {
      BarcodeDetector?: new (opts: { formats: string[] }) => {
        detect: (src: ImageBitmap | HTMLImageElement) => Promise<{ rawValue: string }[]>;
      };
    }
  ).BarcodeDetector;
  if (!Detector) return "";
  try {
    const detector = new Detector({
      formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "qr_code"],
    });
    let src: ImageBitmap | HTMLImageElement;
    try {
      src = await createImageBitmap(file, { resizeWidth: 512, resizeQuality: "low" } as ImageBitmapOptions);
    } catch {
      src = await imageFromDataUrl(dataUrl);
    }
    const codes = await detector.detect(src);
    if ("close" in src && typeof src.close === "function") src.close();
    return codes[0]?.rawValue ?? "";
  } catch {
    return "";
  }
}

function imageFromDataUrl(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image"));
    img.src = dataUrl;
  });
}
