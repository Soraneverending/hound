import { PRODUCTS, PRODUCT_MAP, UPC_MAP } from "@/lib/catalog";
import { STORE_MAP, STORES, isTradingCard, isToyQuery, storesFor } from "@/lib/stores";
import type {
  Category,
  Condition,
  HuntResult,
  Offer,
  Product,
  RankedOffer,
  Stock,
} from "@/lib/types";

function hash(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) h = Math.imul(h ^ input.charCodeAt(i), 16777619);
  return h >>> 0;
}

function unit(seed: string) {
  return (hash(seed) % 10000) / 10000;
}

export function money(n: number) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

export const KEY_HEAD = ["steam", "humble", "gmg", "gog", "fanatical", "epic"] as const;

function conditionFor(storeId: string, category: Category, seed: string): Condition {
  const u = unit(`c:${storeId}:${seed}`);
  const kind = STORE_MAP[storeId]?.kind;
  if (kind === "thrift") return "used";
  if (storeId === "offerup" || storeId === "depop" || storeId === "poshmark" || storeId === "grailed" || storeId === "craigslist" || storeId === "fbmarket") {
    return u > 0.55 ? "used" : "like-new";
  }
  if (storeId === "ebay" || storeId === "mercari" || storeId === "realreal") {
    if (u < 0.35) return "used";
    if (u < 0.55) return "like-new";
    if (u < 0.65) return "open-box";
    return "new";
  }
  if ((storeId === "carmax" || storeId === "autotrader" || storeId === "carscom") && category === "cars") {
    return "used";
  }
  if (storeId === "woot" && u < 0.4) return "open-box";
  if (category === "games" && storeId === "gamestop" && u < 0.45) return "used";
  if (category === "books" && (storeId === "thriftbooks" || storeId === "abebooks")) {
    return u > 0.4 ? "used" : "like-new";
  }
  return "new";
}

function stockFor(storeId: string, seed: string): Stock {
  const u = unit(`s:${storeId}:${seed}`);
  if (storeId === "target" && u < 0.18) return "out";
  if (storeId === "steam" && u < 0.02) return "out";
  if (u < 0.08) return "out";
  if (u < 0.2) return "low";
  return "in";
}

function shippingFor(storeId: string, price: number, cond: Condition): number {
  const store = STORE_MAP[storeId];
  if (!store) return 0;
  if (store.kind === "digital" || store.kind === "auto") return 0;
  if (store.kind === "thrift") return 0;
  if (store.pickup && (store.kind === "grocery" || store.kind === "pharmacy" || store.kind === "club" || store.kind === "beauty" || store.kind === "mall")) {
    return 0;
  }
  if (storeId === "amazon" && price > 25) return 0;
  if (storeId === "walmart" && price > 35) return 0;
  if (storeId === "offerup" || storeId === "craigslist" || storeId === "fbmarket") return 0;
  if (storeId === "aliexpress") return money(3.2 + price * 0.04);
  if (cond !== "new" && storeId === "ebay") return money(price > 200 ? 12.99 : 4.49);
  if (store.kind === "luxury" && price < 200) return 12.95;
  if (store.pickup) return 0;
  if (price > 50) return 0;
  return money(5.99);
}

export function generateOffers(product: Product): Offer[] {
  if (isTradingCard(`${product.brand} ${product.name}`)) return [];
  const blob = `${product.brand} ${product.name}`;
  const list = storesFor(product.category, blob);
  const honestSearch =
    product.ephemeral ||
    product.category === "games" ||
    product.category === "groceries" ||
    product.category === "collectibles" ||
    product.category === "books" ||
    isToyQuery(blob);
  if (honestSearch) {
    return list.map((store) => {
      const person = store.kind === "marketplace" || store.kind === "shop";
      return {
        id: `${product.id}:${store.id}:search`,
        storeId: store.id,
        price: 0,
        shipping: 0,
        condition: person ? "used" : "new",
        stock: "in" as const,
        searchOnly: true,
        authentic: true,
        url: listingUrl(store.id, product.name),
        image: product.image,
        note: person
          ? "Person-to-person — open to see their price"
          : store.kind === "grocery" || store.kind === "club" || store.kind === "pharmacy"
            ? "Search this grocer"
            : store.kind === "digital"
              ? "Search this storefront"
              : store.kind === "thrift"
                ? "Thrift is one-of-one — look, don't trust a made-up tag"
                : "Search this shelf",
      };
    });
  }
  return list.map((store) => {
    const storeId = store.id;
    const bias = store.bias ?? 1;
    const jitter = 0.92 + unit(`p:${product.id}:${storeId}`) * 0.16;
    const cond = conditionFor(storeId, product.category, product.id);
    let price = product.typical * bias * jitter;
    if (cond === "used") price *= 0.78;
    if (cond === "like-new") price *= 0.88;
    if (cond === "open-box") price *= 0.84;
    if (product.category === "groceries" && (storeId === "costco" || storeId === "sams" || storeId === "aldi" || storeId === "winco")) {
      price *= 0.85;
    }
    price = money(Math.max(0.25, price));
    const knockoff = (storeId === "aliexpress" || storeId === "temu" || storeId === "shein") && product.category !== "groceries" && unit(`a:${product.id}:${storeId}`) > 0.35;
    const authentic = !knockoff;
    const stock = authentic ? stockFor(storeId, product.id) : "in";
    const shipping = shippingFor(storeId, price, cond);
    const note =
      !authentic
        ? "Third-party listing — confirm authenticity"
        : storeId === "costco" || storeId === "sams"
          ? "Club price, membership required"
          : store.kind === "thrift"
            ? "One-of-one thrift — go look"
            : storeId === "shop"
              ? "Independent merchant on Shop"
              : storeId === "tiktokshop"
                ? "Creator storefront"
                : store.kind === "mall"
                  ? "Mall tenant · Santa Anita / West Covina"
                  : storeId === "offerup" || storeId === "craigslist" || storeId === "fbmarket"
                    ? "Local pickup in Glendora"
                    : storeId === "realreal"
                      ? "Authenticated consignment"
                      : undefined;
    return {
      id: `${product.id}:${storeId}`,
      storeId,
      price,
      shipping,
      condition: cond,
      stock,
      note,
      authentic,
      url: listingUrl(storeId, product.name),
      image: product.image,
    };
  });
}

export function rankOffers(
  product: Product,
  extra: Offer[] = [],
  opts?: { paypalOnly?: boolean; inStock?: boolean; pickupOnly?: boolean; newOnly?: boolean },
): RankedOffer[] {
  const allowed = new Set(storesFor(product.category, `${product.brand} ${product.name}`).map((s) => s.id));
  const merged = new Map<string, Offer>();
  for (const offer of generateOffers(product)) {
    merged.set(`${offer.storeId}:${offer.condition}`, offer);
  }
  for (const offer of extra) {
    if (!allowed.has(offer.storeId)) continue;
    const key = `${offer.storeId}:${offer.condition}`;
    const prev = merged.get(key);
    if (!prev || offer.live || offer.price + offer.shipping < prev.price + prev.shipping) {
      merged.set(key, {
        ...offer,
        image: offer.image || prev?.image,
        url: offer.url || prev?.url,
      });
    }
  }
  let rows: RankedOffer[] = [...merged.values()]
    .map((offer) => {
      const store = STORE_MAP[offer.storeId] ?? {
        id: offer.storeId,
        name: offer.storeId,
        kind: "bigbox" as const,
        paypal: false,
        pickup: false,
        sells: [],
      };
      return {
        ...offer,
        store,
        total: offer.searchOnly ? 0 : money(offer.price + offer.shipping),
        isFloor: false,
        nearFloor: false,
      };
    })
    .filter((row) => row.authentic !== false || row.storeId !== "aliexpress" || product.category === "groceries");

  if (opts?.paypalOnly) rows = rows.filter((r) => r.store.paypal);
  if (opts?.inStock !== false) rows = rows.filter((r) => r.stock !== "out");
  if (opts?.pickupOnly) rows = rows.filter((r) => r.store.pickup);
  if (opts?.newOnly) rows = rows.filter((r) => r.condition === "new");

  rows.sort((a, b) => {
    const aSearch = a.searchOnly ? 1 : 0;
    const bSearch = b.searchOnly ? 1 : 0;
    if (aSearch !== bSearch) return aSearch - bSearch;
    if (!a.searchOnly) {
      if (!!a.live !== !!b.live) return a.live ? -1 : 1;
      return a.total - b.total || a.store.name.localeCompare(b.store.name);
    }
    if (product.category === "groceries") {
      const kindRank = (kind: string) =>
        kind === "grocery" ? 0 : kind === "club" ? 1 : kind === "bigbox" ? 2 : kind === "pharmacy" ? 3 : 4;
      const ka = kindRank(a.store.kind);
      const kb = kindRank(b.store.kind);
      if (ka !== kb) return ka - kb;
    }
    if (isToyQuery(`${product.brand} ${product.name}`)) {
      const idRank = (id: string) => {
        if (id === "lego") return 0;
        if (id === "target" || id === "walmart" || id === "amazon") return 1;
        if (id === "costco" || id === "bestbuy" || id === "barnes" || id === "kohls") return 2;
        return 3;
      };
      const ir = idRank(a.storeId) - idRank(b.storeId);
      if (ir) return ir;
    }
    if (product.category === "games") {
      const kindRank = (kind: string) =>
        kind === "digital" ? 0 : kind === "mall" ? 1 : kind === "bigbox" ? 2 : kind === "marketplace" ? 3 : 4;
      const ka = kindRank(a.store.kind);
      const kb = kindRank(b.store.kind);
      if (ka !== kb) return ka - kb;
      const keyRank = (id: string) => {
        const i = (KEY_HEAD as readonly string[]).indexOf(id);
        return i < 0 ? 20 : i;
      };
      const kr = keyRank(a.storeId) - keyRank(b.storeId);
      if (kr) return kr;
    }
    const aMiles = a.store.miles ?? 99;
    const bMiles = b.store.miles ?? 99;
    if (aMiles !== bMiles) return aMiles - bMiles;
    return a.store.name.localeCompare(b.store.name);
  });
  const floor = rows.find((row) => !row.searchOnly);
  if (!floor) return rows;
  const band = Math.max(floor.total * 1.08, floor.total + 4);
  return rows.map((row) => ({
    ...row,
    isFloor: !row.searchOnly && row.id === floor.id,
    nearFloor: !row.searchOnly && row.total <= band,
  }));
}

export function highlightOffers(offers: RankedOffer[]) {
  const out: RankedOffer[] = [];
  const take = (pred: (o: RankedOffer) => boolean) => {
    const hit = offers.find(pred);
    if (hit && !out.some((o) => o.id === hit.id)) out.push(hit);
  };
  take((o) => o.isFloor);
  take((o) => o.condition === "new" && isTrustedStore(o.storeId) && !o.searchOnly);
  take((o) => o.store.paypal && o.condition === "new" && !o.searchOnly);
  take((o) => Boolean(o.store.pickup) && o.condition === "new" && !o.searchOnly);
  take((o) => o.live === true);
  for (const offer of offers) {
    if (offer.nearFloor && !out.some((o) => o.id === offer.id)) out.push(offer);
    if (out.length >= 6) break;
  }
  return out;
}

export function bestNew(offers: RankedOffer[]) {
  return offers.find((o) => o.condition === "new") ?? null;
}

export function bestTrusted(offers: RankedOffer[]) {
  return offers.find((o) => o.condition === "new" && isTrustedStore(o.storeId)) ?? null;
}

export function normalizeQuery(q: string) {
  return q
    .toLowerCase()
    .replace(/[^a-z0-9+]+/g, " ")
    .trim();
}

function edits(a: string, b: string) {
  if (a === b) return 0;
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > 2) return 9;
  const row = new Array(lb + 1);
  for (let j = 0; j <= lb; j++) row[j] = j;
  for (let i = 1; i <= la; i++) {
    let prev = i - 1;
    row[0] = i;
    for (let j = 1; j <= lb; j++) {
      const cur = row[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + cost);
      prev = cur;
    }
  }
  return row[lb];
}

const GROCERY_WORDS =
  "food grocery groceries yogurt yoghurt milk egg eggs cereal chicken avocado banana coke cheerios snack snacks produce dairy bread cheese chobani fage yoplait flakes kellogg bran raisin oatmeal granola coffee oreo doritos cheetos lays pasta rice soda water juice apple orange tomato potato onion bacon beef pork salmon tuna cereal breakfast frosted lucky charms cinnamon toast crunch froot loops wheaties oreos";

const GROCERY_LIST = GROCERY_WORDS.split(" ");

function closeWord(token: string, word: string) {
  if (token === word) return true;
  if (token.length < 4 || word.length < 4) return false;
  return edits(token, word) <= 1;
}

function looksGrocery(q: string) {
  const tokens = normalizeQuery(q).split(" ").filter(Boolean);
  return tokens.some((t) => GROCERY_LIST.some((w) => closeWord(t, w)));
}

export function resolveQuery(raw: string) {
  const q = normalizeQuery(raw);
  if (!q) return raw.trim();
  const tokens = q.split(" ").map((t) => {
    const hit = GROCERY_LIST.find((w) => closeWord(t, w));
    return hit || t;
  });
  const corrected = tokens.join(" ");
  let best: { name: string; d: number } | undefined;
  for (const p of PRODUCTS) {
    for (const alias of [p.name, p.brand, ...p.aliases]) {
      const n = normalizeQuery(alias);
      if (!n) continue;
      const d = edits(n, corrected);
      if (d <= 2 && (!best || d < best.d)) best = { name: p.name, d };
    }
  }
  if (best && best.d <= 2) return best.name;
  return tokens.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export function findProduct(query: string): Product | undefined {
  const raw = query.trim();
  if (/^\d{8,14}$/.test(raw)) return UPC_MAP[raw];
  const q = normalizeQuery(raw);
  if (!q) return undefined;
  const exact = PRODUCTS.find((p) => {
    if (normalizeQuery(p.name) === q) return true;
    if (normalizeQuery(p.brand + " " + p.name).includes(q)) return true;
    return p.aliases.some((a) => normalizeQuery(a) === q || q.includes(normalizeQuery(a)) || normalizeQuery(a).includes(q));
  });
  if (exact) return exact;
  const resolved = normalizeQuery(resolveQuery(raw));
  if (resolved && resolved !== q) {
    return PRODUCTS.find((p) => {
      if (normalizeQuery(p.name) === resolved) return true;
      return p.aliases.some((a) => normalizeQuery(a) === resolved);
    });
  }
  let best: { p: Product; d: number } | undefined;
  for (const p of PRODUCTS) {
    for (const alias of [p.name, ...p.aliases]) {
      const d = edits(normalizeQuery(alias), q);
      if (d <= 2 && (!best || d < best.d)) best = { p, d };
    }
  }
  return best?.p;
}

export function productById(id: string) {
  return PRODUCT_MAP[id];
}

export function alternativesOf(product: Product, budget?: number) {
  const ids = product.alternatives
    .map((id) => PRODUCT_MAP[id])
    .filter(Boolean) as Product[];
  const sameAisle = PRODUCTS.filter(
    (p) => p.category === product.category && p.id !== product.id && !ids.some((x) => x.id === p.id),
  );
  const pool = [...ids, ...sameAisle].slice(0, 6);
  if (budget && budget > 0) {
    return pool.filter((p) => {
      const floor = rankOffers(p)[0];
      return floor && floor.total <= budget;
    }).slice(0, 4);
  }
  return pool.slice(0, 3);
}

export function huntLocal(
  query: string,
  extra: Offer[] = [],
  opts?: { paypalOnly?: boolean; pickupOnly?: boolean; newOnly?: boolean; budget?: number },
  source: HuntResult["source"] = "search",
  hint?: { category?: Category; brand?: string; image?: string },
): HuntResult {
  const resolved = resolveQuery(query);
  const found = findProduct(resolved) || findProduct(query);
  const blob = `${hint?.brand ?? ""} ${resolved}`;
  const guessed = guessCategory(blob);
  const image = hint?.image || found?.image;
  const product: Product = found
    ? { ...found, image: image || found.image }
    : {
        id: `q-${hash(normalizeQuery(resolved) || "item")}`,
        name: resolved || titleCase(query.trim() || "Scanned item"),
        brand: hint?.brand && hint.brand !== "Unknown" ? hint.brand : brandFrom(resolved),
        category: isTradingCard(blob) ? "collectibles" : hint?.category && isCategory(hint.category) ? hint.category : guessed,
        upc: /^\d{8,14}$/.test(query.trim()) ? query.trim() : "",
        aliases: [query, resolved],
        typical: typicalFor(resolved),
        alternatives: [],
        ephemeral: true,
        image,
      };

  const offers = rankOffers(product, extra, {
    paypalOnly: opts?.paypalOnly,
    pickupOnly: opts?.pickupOnly,
    newOnly: opts?.newOnly,
    inStock: true,
  });
  const floor = offers.find((o) => !o.searchOnly && o.total > 0) ?? null;
  const near = offers.filter((o) => o.nearFloor);
  const overBudget = Boolean(opts?.budget && floor && floor.total > opts.budget);
  const alts =
    product.ephemeral || isTradingCard(`${product.brand} ${product.name}`) || isTradingCard(query)
      ? []
      : overBudget || offers.length === 0
        ? alternativesOf(product, opts?.budget)
        : alternativesOf(product);
  return {
    product,
    offers,
    floor,
    near,
    alts,
    source,
    scanned: /^\d{8,14}$/.test(query.trim()) ? query.trim() : undefined,
  };
}

function titleCase(s: string) {
  return s
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function brandFrom(q: string) {
  if (isTradingCard(q) || /wizards of the coast|magic:? the gathering|\bmtg\b/i.test(q)) return "Wizards of the Coast";
  if (/pokemon|pokémon/i.test(q)) return "Pokémon";
  if (/metal gear|\bmgs\b|snake eater|konami/i.test(q)) return "Konami";
  if (/yakuza|like a dragon|sega/i.test(q)) return "SEGA";
  if (/zelda|mario|nintendo/i.test(q)) return "Nintendo";
  if (/cheerios|general mills/i.test(q)) return "General Mills";
  if (/frosted flakes|kellogg|raisin bran|\bbran\b/i.test(q)) return "Kellogg's";
  if (/berserk|kentaro miura|dark horse/i.test(q)) return "Dark Horse";
  if (/viz media|shonen jump|one piece|naruto|bleach|jujutsu kaisen|chainsaw man|demon slayer/i.test(q)) return "VIZ Media";
  if (/atomic habits|james clear/i.test(q)) return "James Clear";
  if (/\bdune\b|frank herbert/i.test(q)) return "Frank Herbert";
  return "Unknown";
}

const CATEGORIES: Category[] = [
  "games",
  "groceries",
  "clothes",
  "electronics",
  "pharmacy",
  "home",
  "books",
  "collectibles",
  "cars",
  "beauty",
];

export function isCategory(value: string): value is Category {
  return (CATEGORIES as string[]).includes(value);
}

export { isToyQuery };

const GAME_HINT =
  /game|videogame|video game|steam|xbox|playstation|\bps[1-5]\b|\bnsw\b|nintendo|switch|sega|konami|capcom|square enix|fromsoftware|yakuza|like a dragon|zelda|mario|gta|grand theft|elden|souls|sekiro|bloodborne|metal gear|\bmgs\b|snake eater|phantom pain|rising revengeance|silent hill|resident evil|final fantasy|\bff\d|god of war|last of us|uncharted|halo|gears of war|call of duty|\bcod\b|red dead|assassin|witcher|skyrim|fallout|cyberpunk|persona|smash|splatoon|stardew|tekken|street fighter|mortal kombat|diablo|overwatch|mass effect|dragon age|kingdom hearts|sonic|metroid|pokemon scarlet|pokemon violet|pokemon legends|palworld|pal world|pocketpair|helldivers|baldur|starfield|minecraft|fortnite|roblox|valorant|warframe/;

export function isGameQuery(q: string) {
  return GAME_HINT.test(q.toLowerCase());
}

const BOOK_HINT =
  /book|novel|isbn|hardcover|paperback|manga|manhwa|manhua|graphic novel|omnibus|tankobon|light novel|kodansha|viz media|dark horse|yen press|seven seas|shonen|shounen|comic book|berserk|one piece|naruto|bleach|attack on titan|demon slayer|kimetsu|jujutsu kaisen|chainsaw man|spy x family|my hero academia|death note|tokyo ghoul|vagabond|vinland saga|fullmetal|hunter x hunter|dragon ball|akira|sandman|watchmen|walking dead|harry potter|lord of the rings|hobbit|atomic habits/;

export function isBookQuery(q: string) {
  const s = q.toLowerCase();
  if (isGameQuery(s)) return false;
  if (BOOK_HINT.test(s)) return true;
  if (/\b(vol\.?|volume)\s*\d+\b/.test(s) && /deluxe|edition|hardcover|omnibus|manga|comic/.test(s)) return true;
  return false;
}

export function guessCategory(q: string): Category {
  const s = q.toLowerCase();
  if (isTradingCard(s)) return "collectibles";
  if (/civic|camry|tesla|vin|sedan|suv|honda|toyota|ford f-/.test(s)) return "cars";
  if (isBookQuery(s)) return "books";
  if (isToyQuery(s)) return "home";
  if (/funko|vinyl|collect|mtg|magic card|booster|cgc|slab/.test(s)) return "collectibles";
  if (/lipstick|foundation|mascara|sephora|fenty|concealer|blush|skincare|serum/.test(s)) return "beauty";
  if (isGameQuery(s)) return "games";
  if (/shirt|jean|nike|dunk|jacket|hoodie|armani|gucci|blazer|goodwill/.test(s)) return "clothes";
  if (/airpod|headphone|switch|phone|laptop/.test(s)) return "electronics";
  if (/advil|nyquil|toothpaste|vitamin/.test(s)) return "pharmacy";
  if (looksGrocery(s) || /food|grocery|groceries|yogurt|yoghurt|milk|egg|cereal|chicken|avocado|banana|coke|cheerios|snack|produce|dairy|bread|cheese|chobani|fage|yoplait|frosted flakes|kellogg|lucky charms|froot loops|fruit loops|raisin bran|special k|cinnamon toast crunch|corn flakes|apple jacks|captain crunch|cap'n crunch|wheaties|granola|oatmeal|coffee|oreos?|doritos|cheetos|lays/.test(s)) {
    return "groceries";
  }
  return "home";
}

function typicalFor(q: string) {
  if (isTradingCard(q)) return 2.49;
  const cat = guessCategory(q);
  if (cat === "books" && /deluxe|hardcover|omnibus/.test(q.toLowerCase())) return 49.99;
  const base: Record<Category, number> = {
    games: 29.99,
    groceries: 5.49,
    clothes: 48,
    electronics: 149,
    pharmacy: 8.99,
    home: 24.99,
    books: 16,
    collectibles: 64,
    cars: 16500,
    beauty: 28,
  };
  return base[cat];
}

export function formatMoney(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function categoryLabel(c: Category) {
  if (c === "collectibles") return "Collectibles";
  return c[0].toUpperCase() + c.slice(1);
}

export function storeCount() {
  return STORES.length;
}

export function isTrustedStore(storeId: string) {
  const kind = STORE_MAP[storeId]?.kind;
  return (
    kind === "digital" ||
    kind === "bigbox" ||
    kind === "club" ||
    kind === "grocery" ||
    kind === "pharmacy" ||
    kind === "luxury" ||
    kind === "auto" ||
    kind === "beauty" ||
    kind === "mall"
  );
}

function gameSlug(name: string, sep: "-" | "_") {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, sep)
    .replace(new RegExp(`${sep}+`, "g"), sep)
    .replace(new RegExp(`^${sep}|${sep}$`, "g"), "");
}

export function listingUrl(storeId: string, name: string, extra?: { steamAppID?: string }) {
  const query = (name ?? "").trim();
  const store = STORE_MAP[storeId];
  const label = store?.name ?? storeId;
  if (!query) return `https://www.google.com/search?q=${encodeURIComponent(label)}`;
  if (storeId === "steam" && extra?.steamAppID) {
    return `https://store.steampowered.com/app/${extra.steamAppID}`;
  }
  const dash = gameSlug(query, "-");
  const under = gameSlug(query, "_");
  if (storeId === "gog" && under) return `https://www.gog.com/en/game/${under}`;
  if (storeId === "humble" && dash) return `https://www.humblebundle.com/store/${dash}`;
  if (storeId === "fanatical" && dash) return `https://www.fanatical.com/en/game/${dash}`;
  if (storeId === "gmg" && dash) return `https://www.greenmangaming.com/games/${dash}-pc/`;
  const q = encodeURIComponent(query);
  const href = store?.href;
  if (href?.includes("%s") && !href.includes("shopgoodwill") && !href.includes("cheapshark")) {
    return href.replaceAll("%s", q);
  }
  return `https://www.google.com/search?q=${q}+${encodeURIComponent(label)}`;
}

export function honestUrl(storeId: string, name: string, liveUrl?: string, extra?: { steamAppID?: string }) {
  if (liveUrl && /^https:\/\//i.test(liveUrl) && !/cheapshark\.com/i.test(liveUrl)) {
    try {
      new URL(liveUrl);
      return liveUrl;
    } catch {
      /* fall through */
    }
  }
  return listingUrl(storeId, name, extra);
}

export { PRODUCTS, STORES, PRODUCT_MAP };
