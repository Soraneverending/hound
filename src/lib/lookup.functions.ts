import { createServerFn } from "@tanstack/react-start";
import { listingUrl, isGameQuery, isBookQuery, isToyQuery } from "@/lib/engine";
import { isAisleQuery, isAddonTitle } from "@/lib/suggest";
import { isTradingCard } from "@/lib/stores";
import type { Offer } from "@/lib/types";

const CHEAPSHARK_STORES: Record<string, string> = {
  "1": "steam",
  "2": "gamersgate",
  "3": "gmg",
  "7": "gog",
  "11": "humble",
  "13": "ubisoft",
  "15": "fanatical",
  "21": "wingamestore",
  "23": "gamebillet",
  "25": "epic",
  "27": "gamesplanet",
  "30": "indiegala",
};

const UA = { Accept: "application/json", "User-Agent": "Hound/1.0 (price hunt; hound.app)" };

function httpsUrl(url?: string) {
  if (!url) return undefined;
  return url.replace(/^http:\/\//i, "https://");
}

async function getJson<T>(url: string, ms = 2500): Promise<T | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: UA });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function liveOffer(storeId: string, price: number, note: string, url?: string, image?: string): Offer | null {
  if (!Number.isFinite(price) || price <= 0) return null;
  return {
    id: `live:${storeId}:${price}`,
    storeId,
    price: Math.round(price * 100) / 100,
    shipping: 0,
    condition: "new",
    stock: "in",
    live: true,
    note,
    url,
    image: httpsUrl(image),
  };
}

function nameFits(query: string, name?: string) {
  if (!name) return false;
  const q = query.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const n = name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  if (!q || !n) return false;
  if (isAisleQuery(query)) return false;
  const tokens = q.split(" ").filter((w) => w.length > 2);
  if (tokens.length === 0) return n.includes(q);
  const hits = tokens.filter((t) => n.includes(t)).length;
  return hits >= Math.ceil(tokens.length * 0.7);
}

export const enrichHunt = createServerFn({ method: "POST" })
  .validator((input: { query: string; category?: string }) => input)
  .handler(async ({ data }): Promise<{ extra: Offer[]; identified: { name: string; upc?: string } | null; image?: string; candidates?: { name: string; image?: string; hint: string }[]; category?: string }> => {
    const extra: Offer[] = [];
    let identified: { name: string; upc?: string } | null = null;
    let image: string | undefined;
    let candidates: { name: string; image?: string; hint: string }[] = [];
    let category: string | undefined = data.category || undefined;
    const q = data.query.trim();
    if (!q) return { extra, identified };

    const cat = data.category ?? "";
    const digits = q.replace(/\D/g, "");
    const isIsbn = /^(97[89])\d{10}$/.test(digits);
    const isUpc = /^\d{8,14}$/.test(q) && !isIsbn;
    const tcg = isTradingCard(q);
    const poke = /pokemon|pokémon|charizard|pikachu|vmax/i.test(q);
    const bookish = cat === "books" || isIsbn || isBookQuery(q);
    const locked =
      tcg ||
      bookish ||
      cat === "groceries" ||
      cat === "beauty" ||
      cat === "pharmacy" ||
      cat === "clothes" ||
      cat === "cars" ||
      isAisleQuery(q) ||
      isToyQuery(q);
    const tryGames = !tcg && !isToyQuery(q) && (cat === "games" || isGameQuery(q) || !locked);

    const jobs: Promise<void>[] = [];

    if (tryGames) {
      jobs.push(
        cheapSharkOffers(q).then((row) => {
          extra.push(...row.offers);
          if (row.image) image ??= row.image;
          if (row.identified && nameFits(q, row.identified)) {
            identified ??= { name: row.identified };
            category = "games";
          }
          if (row.candidates.length) candidates = row.candidates;
        }),
        steamOffer(q).then((row) => {
          if (row.offer) extra.push(row.offer);
          if (row.image) image ??= row.image;
          if (row.identified && nameFits(q, row.identified)) {
            identified ??= { name: row.identified };
            category = "games";
          }
        }),
      );
    }
    if (bookish) {
      jobs.push(
        googleBook(q, isIsbn ? digits : undefined).then((row) => {
          if (row?.offer) extra.push(row.offer);
          if (row?.image) image ??= row.image;
          if (row?.identified) identified ??= { name: row.identified };
          if (row?.candidates.length) candidates = row.candidates;
          if (row?.identified && nameFits(q, row.identified)) category = "books";
        }),
        openLibrary(q).then((row) => {
          if (row?.image) image ??= row.image;
          if (row?.identified) identified ??= { name: row.identified };
          if (!candidates.length && row?.candidates.length) candidates = row.candidates;
          if (row?.identified && nameFits(q, row.identified) && category !== "games") category = "books";
        }),
      );
    }
    if (tcg) {
      if (poke) {
        jobs.push(
          pokemonOffer(q).then((row) => {
            if (row?.offer) extra.push(row.offer);
            if (row?.image) image ??= row.image;
          }),
        );
      } else {
        jobs.push(
          scryfallOffer(q).then((row) => {
            if (row?.offer) extra.push(row.offer);
            if (row?.image) image ??= row.image;
            if (row?.name) identified = { name: row.name };
          }),
        );
      }
    }
    if (isUpc) {
      jobs.push(
        productFacts(q).then((hit) => {
          if (hit?.offers) extra.push(...hit.offers);
          if (hit?.identified) identified = hit.identified;
          if (hit?.image) image ??= hit.image;
        }),
      );
    } else if (!tcg && !isAisleQuery(q) && (cat === "groceries" || cat === "beauty" || cat === "pharmacy" || cat === "home")) {
      jobs.push(
        (async () => {
          const hit = await searchFacts(q, cat);
          if (!hit) return;
          if (!nameFits(q, hit.name)) return;
          identified = hit;
          if (hit.image) image ??= hit.image;
          if (hit.upc) {
            const priced = await productFacts(hit.upc);
            if (priced?.offers) extra.push(...priced.offers);
            if (priced?.identified && nameFits(q, priced.identified.name)) identified = priced.identified;
            if (priced?.image) image ??= priced.image;
          }
        })(),
      );
    }

    await Promise.allSettled(jobs);
    if (!image && !isAisleQuery(q)) {
      const cover = await coverFallback(q, category || cat || (isGameQuery(q) ? "games" : isBookQuery(q) ? "books" : isToyQuery(q) ? "home" : ""));
      if (cover) image = cover;
    }
    return { extra, identified, image: httpsUrl(image), candidates, category };
  });

export const identifyPhoto = createServerFn({ method: "POST" })
  .validator((input: { image: string }) => input)
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return { ok: false as const, error: "Vision is unavailable here. Type a name or scan a barcode." };
    }
    const image = data.image.startsWith("data:") ? data.image : data.image.slice(0, 400_000);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 18000);
    try {
      const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "grok-4.5",
          max_tokens: 180,
          temperature: 0,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: 'JSON only: {"name":"","brand":"","upc":"","category":"games|groceries|clothes|electronics|pharmacy|home|books|collectibles|cars|beauty"}. Read the printed title on the object. Manga, comics, and books = books. Video games = games. Cereal and food = groceries. Use the name a shopper would type (e.g. "Shaman King", "Frosted Flakes", "Yakuza Like a Dragon"). Never return placeholders like "this frame", "unknown", "photo", "cover", or "item". If you cannot read a title, name must be "".',
                },
                { type: "image_url", image_url: { url: image } },
              ],
            },
          ],
        }),
        signal: ctrl.signal,
      });
      if (!res.ok) return { ok: false as const, error: `Vision error ${res.status}` };
      const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const text = body.choices?.[0]?.message?.content ?? "";
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) return { ok: false as const, error: "Could not read that frame." };
      const parsed = JSON.parse(match[0]) as {
        name?: string;
        brand?: string;
        upc?: string;
        category?: string;
      };
      const junk = /^(this frame|unknown|photo|image|cover|item|product|untitled|n\/a)$/i;
      const name = [parsed.brand, parsed.name].filter(Boolean).join(" ").trim() || parsed.name || "";
      if (!name || junk.test(name.trim())) {
        return { ok: false as const, error: "Could not read the title. Type what you see." };
      }
      return {
        ok: true as const,
        name,
        brand: parsed.brand || "",
        upc: parsed.upc?.replace(/\D/g, "") || "",
        category: parsed.category || "",
      };
    } catch {
      return { ok: false as const, error: "Could not read that frame." };
    } finally {
      clearTimeout(timer);
    }
  });

async function cheapSharkOffers(title: string): Promise<{
  offers: Offer[];
  image?: string;
  identified?: string;
  candidates: { name: string; image?: string; hint: string }[];
}> {
  const games = await getJson<{ gameID: string; cheapest: string; external: string; steamAppID?: string; thumb?: string }[]>(
    `https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(title)}&limit=8`,
  );
  const list = games ?? [];
  const first = pickCheapSharkGame(list, title);
  const candidates = list
    .filter((g) => g.external && !isAddonTitle(g.external, title))
    .slice(0, 6)
    .map((g) => ({
      name: g.external,
      image: httpsUrl(g.thumb),
      hint: g.cheapest ? `from $${g.cheapest}` : "In the series",
    }));
  if (!first) return { offers: [], candidates };
  const detail = await getJson<{ deals?: { storeID: string; price: string; dealID?: string }[] }>(
    `https://www.cheapshark.com/api/1.0/games?id=${first.gameID}`,
  );
  const image = httpsUrl(first.thumb);
  const name = first.external || title;
  const steamAppID = first.steamAppID || undefined;
  const offers = (detail?.deals ?? []).flatMap((deal) => {
    const storeId = CHEAPSHARK_STORES[deal.storeID];
    if (!storeId) return [];
    const url =
      storeId === "steam" && steamAppID
        ? `https://store.steampowered.com/app/${steamAppID}`
        : listingUrl(storeId, name, { steamAppID });
    const row = liveOffer(storeId, Number(deal.price), "Live digital deal", url, image);
    return row ? [row] : [];
  });
  return { offers, image, identified: first.external, candidates };
}

function pickCheapSharkGame(
  games: { gameID: string; external: string; steamAppID?: string; thumb?: string }[],
  title: string,
) {
  const n = title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  if (!n) return games[0];
  const scored = games.map((g) => {
    const e = (g.external || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    let score = 0;
    if (e === n) score += 12;
    if (e.startsWith(n) || n.startsWith(e)) score += 6;
    if (e.includes(n)) score += 3;
    if (g.steamAppID) score += 2;
    if (/\b(dlc|job set|karaoke|soundtrack|ost|hero edition|management mode)\b/.test(e) && !/\b(dlc|edition)\b/.test(n)) {
      score -= 10;
    }
    return { g, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.score > 0 ? scored[0].g : games[0];
}

async function steamOffer(title: string): Promise<{ offer: Offer | null; image?: string; identified?: string }> {
  const json = await getJson<{
    items?: { id?: number; name?: string; tiny_image?: string; price?: { final?: number; currency?: string } }[];
  }>(`https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(title)}&l=english&cc=US`);
  const item =
    (json?.items ?? []).find((row) => row.name && nameFits(title, row.name) && !isAddonTitle(row.name, title)) ??
    json?.items?.[0];
  const cents = item?.price?.final;
  const image = httpsUrl(item?.tiny_image);
  const url = item?.id ? `https://store.steampowered.com/app/${item.id}` : undefined;
  const identified = item?.name && nameFits(title, item.name) ? item.name : undefined;
  if (!cents || item?.price?.currency !== "USD") return { offer: null, image, identified };
  return { offer: liveOffer("steam", cents / 100, "Live Steam US", url, image), image, identified };
}

async function googleBook(title: string, isbn?: string): Promise<{
  offer: Offer | null;
  image?: string;
  identified?: string;
  candidates: { name: string; image?: string; hint: string }[];
} | null> {
  const q = isbn ? `isbn:${isbn}` : title;
  const json = await getJson<{
    items?: {
      volumeInfo?: {
        title?: string;
        authors?: string[];
        imageLinks?: { thumbnail?: string; smallThumbnail?: string };
      };
      saleInfo?: { saleability?: string; retailPrice?: { amount?: number; currencyCode?: string }; buyLink?: string };
    }[];
  }>(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=8&country=US`);
  const items = json?.items ?? [];
  if (items.length === 0) return null;
  const volume = items[0];
  const sale = volume?.saleInfo;
  const image = httpsUrl(volume?.volumeInfo?.imageLinks?.thumbnail || volume?.volumeInfo?.imageLinks?.smallThumbnail);
  const offer =
    sale?.saleability === "FOR_SALE" && sale.retailPrice?.currencyCode === "USD"
      ? liveOffer("amazon", Number(sale.retailPrice?.amount), "Live Google Books", sale.buyLink, image)
      : null;
  const candidates = items.slice(0, 6).map((item) => ({
    name: item.volumeInfo?.title || title,
    image: httpsUrl(item.volumeInfo?.imageLinks?.thumbnail || item.volumeInfo?.imageLinks?.smallThumbnail),
    hint: item.volumeInfo?.authors?.[0] || "Google Books",
  }));
  return { offer, image, identified: volume?.volumeInfo?.title, candidates };
}

async function openLibrary(title: string): Promise<{
  image?: string;
  identified?: string;
  candidates: { name: string; image?: string; hint: string }[];
} | null> {
  const json = await getJson<{
    docs?: { title?: string; author_name?: string[]; cover_i?: number; isbn?: string[] }[];
  }>(`https://openlibrary.org/search.json?q=${encodeURIComponent(title)}&limit=8`);
  const docs = json?.docs ?? [];
  if (docs.length === 0) return null;
  const coverOf = (doc: (typeof docs)[number]) => {
    if (doc.cover_i) return `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
    const isbn = doc.isbn?.[0];
    return isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg` : undefined;
  };
  const first = docs[0];
  return {
    image: coverOf(first),
    identified: first.title,
    candidates: docs.slice(0, 6).map((doc) => ({
      name: doc.title || title,
      image: coverOf(doc),
      hint: doc.author_name?.[0] || "Open Library",
    })),
  };
}

function cardName(title: string) {
  return title
    .replace(/magic:?\s*the gathering/gi, " ")
    .replace(/wizards of the coast/gi, " ")
    .replace(/\bmtg\b/gi, " ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b(sorcery|instant|creature|enchantment|planeswalker|artifact|land|commander)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const SET_ALIAS: Record<string, string> = {
  ffvi: "fic",
  ff6: "fic",
  ori: "ori",
};

type ScryfallCard = {
  prices?: { usd?: string | null; usd_foil?: string | null };
  scryfall_uri?: string;
  purchase_uris?: { tcgplayer?: string; cardkingdom?: string };
  name?: string;
  image_uris?: { normal?: string; small?: string };
  card_faces?: { image_uris?: { normal?: string; small?: string } }[];
};

async function scryfallOffer(title: string): Promise<{ offer: Offer | null; image?: string; name?: string } | null> {
  const name = cardName(title) || title;
  const setRaw = title.match(/\(([A-Za-z0-9]{2,6})\)/)?.[1]?.toLowerCase();
  const set = setRaw ? SET_ALIAS[setRaw] || setRaw : "";
  const [setHit, cheap, fuzzy] = await Promise.all([
    set
      ? getJson<{ data?: ScryfallCard[] }>(
          `https://api.scryfall.com/cards/search?q=${encodeURIComponent(`!"${name}" e:${set}`)}&order=usd&unique=prints`,
          1600,
        )
      : Promise.resolve(null),
    getJson<{ data?: ScryfallCard[] }>(
      `https://api.scryfall.com/cards/search?q=${encodeURIComponent(`!"${name}"`)}&order=usd&unique=prints`,
      1600,
    ),
    getJson<ScryfallCard>(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`, 1600),
  ]);
  const pool = [setHit?.data?.[0], cheap?.data?.[0], fuzzy].filter(Boolean) as ScryfallCard[];
  if (pool.length === 0) return null;
  const named = pool.reduce((best, card) => {
    const price = Number(card.prices?.usd ?? card.prices?.usd_foil);
    const bestPrice = Number(best.prices?.usd ?? best.prices?.usd_foil);
    if (!Number.isFinite(price)) return best;
    if (!Number.isFinite(bestPrice) || price < bestPrice) return card;
    return best;
  });
  const usd = Number(named.prices?.usd ?? named.prices?.usd_foil);
  const image = named.image_uris?.normal || named.image_uris?.small || named.card_faces?.[0]?.image_uris?.normal;
  const url = named.purchase_uris?.tcgplayer || named.scryfall_uri;
  const offer = Number.isFinite(usd) && usd > 0 ? liveOffer("tcgplayer", usd, "Live market · TCGplayer", url, image) : null;
  return { offer, image, name: named.name };
}

async function coverFallback(query: string, category: string): Promise<string | undefined> {
  if (category === "collectibles" || category === "cars") return undefined;
  if (isToyQuery(query)) {
    const key = /\blego/.test(query.toLowerCase()) ? "Lego" : query.replace(/\s+/g, "_");
    const wiki = await getJson<{ thumbnail?: { source?: string } }>(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(key)}`,
      1400,
    );
    if (wiki?.thumbnail?.source) return wiki.thumbnail.source;
  }
  if (category === "books" || isBookQuery(query)) {
    const ol = await openLibrary(query);
    if (ol?.image) return ol.image;
    const cleaned = query.replace(/\b(deluxe|edition|hardcover|paperback|omnibus|vol\.?|volume)\s*\d*/gi, " ").replace(/\s+/g, " ").trim();
    const wikiKey = cleaned ? `${cleaned.replace(/\s+/g, "_")}_(manga)` : "";
    if (wikiKey.length > 4) {
      const wiki = await getJson<{ thumbnail?: { source?: string } }>(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiKey)}`,
        1400,
      );
      if (wiki?.thumbnail?.source) return wiki.thumbnail.source;
    }
    const itunes = await getJson<{ results?: { artworkUrl100?: string }[] }>(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=ebook&limit=1&country=US`,
      1400,
    );
    const art = itunes?.results?.[0]?.artworkUrl100;
    if (art) return art.replace("100x100bb", "400x400bb");
  }
  const wikiTitle = query.replace(/\s+/g, "_").replace(/[^\w()-]/g, "");
  if (wikiTitle.length > 2) {
    const wiki = await getJson<{ thumbnail?: { source?: string } }>(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`,
      1400,
    );
    if (wiki?.thumbnail?.source) return wiki.thumbnail.source;
  }
  if (category === "games") {
    const itunes = await getJson<{ results?: { artworkUrl100?: string }[] }>(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&limit=1&country=US`,
      1400,
    );
    const art = itunes?.results?.[0]?.artworkUrl100;
    if (art) return art.replace("100x100bb", "400x400bb");
  }
  return undefined;
}

async function pokemonOffer(title: string): Promise<{ offer: Offer | null; image?: string } | null> {
  if (!/pokemon|pokémon|charizard|pikachu|vmax/i.test(title)) return null;
  const name = title.replace(/pokemon|pokémon|tcg/gi, "").trim() || title;
  const json = await getJson<{
    data?: { images?: { small?: string; large?: string }; tcgplayer?: { url?: string; prices?: Record<string, { market?: number }> } }[];
  }>(`https://api.pokemontcg.io/v2/cards?q=name:${encodeURIComponent(name.split(" ")[0] || name)}&pageSize=1`);
  const card = json?.data?.[0];
  const prices = card?.tcgplayer?.prices;
  const market = prices?.holofoil?.market ?? prices?.normal?.market ?? prices?.unlimitedHolofoil?.market;
  const offer = market ? liveOffer("tcgplayer", market, "Live Pokémon TCG · TCGplayer", card?.tcgplayer?.url, card?.images?.large || card?.images?.small) : null;
  return { offer, image: card?.images?.large || card?.images?.small };
}

async function searchFacts(name: string, category: string) {
  const hosts =
    category === "beauty"
      ? ["https://world.openbeautyfacts.org", "https://world.openfoodfacts.org"]
      : category === "home" || category === "pharmacy"
        ? ["https://world.openproductsfacts.org", "https://world.openfoodfacts.org"]
        : ["https://world.openfoodfacts.org", "https://world.openbeautyfacts.org"];
  for (const host of hosts) {
    const json = await getJson<{
      products?: { product_name?: string; brands?: string; code?: string; image_small_url?: string; image_front_small_url?: string }[];
    }>(
      `${host}/cgi/search.pl?search_terms=${encodeURIComponent(name)}&search_simple=1&json=1&page_size=1&fields=product_name,brands,code,image_small_url,image_front_small_url`,
    );
    const product = json?.products?.[0];
    if (!product?.product_name) continue;
    const brand = product.brands?.split(",")[0]?.trim();
    return {
      name: [brand, product.product_name].filter(Boolean).join(" "),
      upc: product.code,
      image: product.image_front_small_url || product.image_small_url,
    };
  }
  return null;
}

async function productFacts(code: string): Promise<{
  identified?: { name: string; upc: string };
  offers: Offer[];
  image?: string;
} | null> {
  if (!code || code.length < 8) return null;
  const hosts = [
    "https://world.openfoodfacts.org",
    "https://world.openbeautyfacts.org",
    "https://world.openproductsfacts.org",
  ];
  let identified: { name: string; upc: string } | undefined;
  let image: string | undefined;
  for (const host of hosts) {
    const json = await getJson<{
      status?: number;
      product?: { product_name?: string; brands?: string; image_small_url?: string; image_front_small_url?: string };
    }>(`${host}/api/v2/product/${code}.json?fields=product_name,brands,image_small_url,image_front_small_url`);
    if (json?.status === 1 && json.product?.product_name) {
      const brand = json.product.brands?.split(",")[0]?.trim();
      const name = [brand, json.product.product_name].filter(Boolean).join(" ");
      identified = { name, upc: code };
      image = json.product.image_front_small_url || json.product.image_small_url;
      break;
    }
  }
  const offers: Offer[] = [];
  const prices = await getJson<{
    items?: { price: number | string; currency: string; location?: { osm_display_name?: string } }[];
  }>(`https://prices.openfoodfacts.org/api/v1/prices?product_code=${code}&size=12`);
  for (const item of prices?.items ?? []) {
    if (String(item.currency).toUpperCase() !== "USD") continue;
    const label = (item.location?.osm_display_name ?? "").toLowerCase();
    const storeId = /costco/.test(label)
      ? "costco"
      : /walmart/.test(label)
        ? "walmart"
        : /target/.test(label)
          ? "target"
          : /vons|safeway|albertsons/.test(label)
            ? "vons"
            : /ralphs|kroger/.test(label)
              ? "ralphs"
              : /cvs/.test(label)
                ? "cvs"
                : /walgreens/.test(label)
                  ? "walgreens"
                  : /trader/.test(label)
                    ? "traderjoes"
                    : null;
    if (!storeId) continue;
    const row = liveOffer(storeId, Number(item.price), "Live Open Prices");
    if (row) offers.push(row);
  }
  if (!identified && offers.length === 0) return null;
  return { identified, offers, image };
}
