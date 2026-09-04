import { PRODUCTS } from "@/lib/catalog";
import { guessCategory, normalizeQuery, resolveQuery } from "@/lib/engine";
import type { Category } from "@/lib/types";

export type Suggestion = {
  q: string;
  label: string;
  hint: string;
  image?: string;
  category: Category;
};

const AISLES: { keys: string[]; items: Suggestion[] }[] = [
  {
    keys: ["food", "foods", "grocery", "groceries", "produce", "snack", "snacks"],
    items: [
      { q: "Honey Nut Cheerios", label: "Honey Nut Cheerios", hint: "Vons vs Costco", image: "/covers/cheerios.jpg", category: "groceries" },
      { q: "Chobani Greek Yogurt", label: "Chobani Greek Yogurt", hint: "Ralphs · Target", category: "groceries" },
      { q: "dozen eggs", label: "Dozen eggs", hint: "Stater Bros · Vons", category: "groceries" },
      { q: "whole milk gallon", label: "Whole milk", hint: "Grocery pickup", category: "groceries" },
      { q: "bananas", label: "Bananas", hint: "Produce aisle", category: "groceries" },
      { q: "Coca-Cola 12 pack", label: "Coke 12-pack", hint: "Walmart vs Costco", category: "groceries" },
    ],
  },
  {
    keys: ["cereal", "cheerios", "frosted", "flakes", "kellogg", "breakfast", "bran", "raisin"],
    items: [
      { q: "Honey Nut Cheerios", label: "Honey Nut Cheerios", hint: "Vons vs Costco", image: "/covers/cheerios.jpg", category: "groceries" },
      { q: "Kellogg's Frosted Flakes", label: "Frosted Flakes", hint: "Vons · Walmart · Costco", image: "https://world.openfoodfacts.org/images/products/003/800/084/5217/front_en.4.400.jpg", category: "groceries" },
      { q: "Cinnamon Toast Crunch", label: "Cinnamon Toast Crunch", hint: "Target · Vons", category: "groceries" },
      { q: "Lucky Charms", label: "Lucky Charms", hint: "Walmart · Costco", category: "groceries" },
    ],
  },
  {
    keys: ["yogurt", "yoghurt", "chobani", "fage", "yoplait", "greek yogurt", "dairy"],
    items: [
      { q: "Chobani Greek Yogurt", label: "Chobani Greek Yogurt", hint: "Vons · Ralphs · Target", category: "groceries" },
      { q: "Fage Total 5% yogurt", label: "Fage Total 5%", hint: "Whole Foods · Vons", category: "groceries" },
      { q: "Yoplait Original yogurt", label: "Yoplait Original", hint: "Stater Bros · Walmart", category: "groceries" },
      { q: "Siggi's Icelandic yogurt", label: "Siggi's", hint: "Trader Joe's · Target", category: "groceries" },
    ],
  },
  {
    keys: ["milk", "dairy", "eggs"],
    items: [
      { q: "whole milk gallon", label: "Whole milk, gallon", hint: "Vons vs Costco", category: "groceries" },
      { q: "dozen eggs", label: "Dozen eggs", hint: "Ralphs · Aldi", category: "groceries" },
    ],
  },
  {
    keys: ["magic", "mtg", "card", "cards", "tcg", "foil", "commander", "booster"],
    items: [
      { q: "Tragic Arrogance", label: "Tragic Arrogance", hint: "TCGplayer live", category: "collectibles" },
      { q: "Commander Masters collector booster", label: "Commander Masters booster", hint: "Sealed pack", category: "collectibles" },
      { q: "Charizard VMAX Rainbow Rare", label: "Charizard VMAX", hint: "Pokémon TCG", category: "collectibles" },
      { q: "Ragavan Nimble Pilferer", label: "Ragavan, Nimble Pilferer", hint: "Modern staple", category: "collectibles" },
    ],
  },
  {
    keys: ["pokemon", "pokémon", "charizard", "pikachu"],
    items: [
      { q: "Charizard VMAX Rainbow Rare", label: "Charizard VMAX", hint: "TCGplayer", category: "collectibles" },
      { q: "Pikachu VMAX", label: "Pikachu VMAX", hint: "Pokémon TCG", category: "collectibles" },
      { q: "Pokemon 151 booster bundle", label: "151 booster bundle", hint: "Sealed", category: "collectibles" },
    ],
  },
  {
    keys: ["game", "games", "yakuza", "steam", "metal gear", "mgs", "zelda", "mario", "gta", "palworld", "pal world"],
    items: [
      { q: "Palworld", label: "Palworld", hint: "Steam live", image: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1623730/header.jpg", category: "games" },
      { q: "Yakuza: Like a Dragon", label: "Yakuza: Like a Dragon", hint: "GOG vs Humble", image: "/covers/yakuza.jpg", category: "games" },
      { q: "Metal Gear Solid", label: "Metal Gear Solid", hint: "Which one?", category: "games" },
      { q: "Elden Ring", label: "Elden Ring", hint: "Steam live", category: "games" },
      { q: "Grand Theft Auto V", label: "GTA V", hint: "Keys vs discs", category: "games" },
    ],
  },
  {
    keys: ["book", "books", "manga", "comic", "comics", "graphic novel", "berserk"],
    items: [
      { q: "Berserk Deluxe Volume 1", label: "Berserk Deluxe Vol. 1", hint: "Dark Horse · B&N", image: "https://covers.openlibrary.org/b/isbn/9781506711980-L.jpg", category: "books" },
      { q: "Atomic Habits", label: "Atomic Habits", hint: "James Clear", image: "https://covers.openlibrary.org/b/isbn/9780735211292-M.jpg", category: "books" },
      { q: "One Piece Vol. 1", label: "One Piece Vol. 1", hint: "VIZ · manga", category: "books" },
      { q: "Dune", label: "Dune", hint: "Frank Herbert", image: "https://covers.openlibrary.org/b/isbn/9780441172719-M.jpg", category: "books" },
    ],
  },
  {
    keys: ["lego", "legos", "duplo", "toys", "toy"],
    items: [
      { q: "LEGO Classic Bricks", label: "LEGO Classic Bricks", hint: "LEGO.com · Target", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Lego_Color_Bricks.jpg/440px-Lego_Color_Bricks.jpg", category: "home" },
      { q: "LEGO Star Wars Millennium Falcon", label: "Millennium Falcon", hint: "Star Wars set", category: "home" },
      { q: "LEGO Botanicals Orchid", label: "Botanicals Orchid", hint: "10311", category: "home" },
      { q: "LEGO Technic", label: "LEGO Technic", hint: "Cars & machines", category: "home" },
      { q: "LEGO Harry Potter Hogwarts Castle", label: "Hogwarts Castle", hint: "Harry Potter set", category: "home" },
      { q: "LEGO DUPLO", label: "LEGO DUPLO", hint: "For little builders", category: "home" },
    ],
  },
];

function steamArt(id: string) {
  return `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${id}/header.jpg`;
}

const FRANCHISES: { keys: string[]; items: Suggestion[] }[] = [
  {
    keys: ["metal gear", "mgs", "snake eater", "phantom pain", "solid snake"],
    items: [
      { q: "Metal Gear Solid", label: "Metal Gear Solid", hint: "1998 · PS1 / Master Collection", image: steamArt("2131630"), category: "games" },
      { q: "Metal Gear Solid 2: Sons of Liberty", label: "Metal Gear Solid 2", hint: "Sons of Liberty", image: steamArt("2131630"), category: "games" },
      { q: "Metal Gear Solid 3: Snake Eater", label: "Metal Gear Solid 3", hint: "Snake Eater · Delta", image: steamArt("2131640"), category: "games" },
      { q: "Metal Gear Solid V: The Phantom Pain", label: "Metal Gear Solid V", hint: "The Phantom Pain", image: steamArt("287700"), category: "games" },
      { q: "Metal Gear Rising: Revengeance", label: "Metal Gear Rising", hint: "Revengeance", image: steamArt("235460"), category: "games" },
      { q: "Metal Gear Solid: Master Collection Vol. 1", label: "MGS Master Collection", hint: "Steam / consoles", image: steamArt("2131630"), category: "games" },
    ],
  },
  {
    keys: ["yakuza", "like a dragon"],
    items: [
      { q: "Yakuza: Like a Dragon", label: "Yakuza: Like a Dragon", hint: "Ichiban · 7", image: "/covers/yakuza.jpg", category: "games" },
      { q: "Yakuza 0", label: "Yakuza 0", hint: "Kiryu origin", image: steamArt("638970"), category: "games" },
      { q: "Yakuza Kiwami", label: "Yakuza Kiwami", hint: "Kiwami remake", image: steamArt("834530"), category: "games" },
      { q: "Yakuza Kiwami 2", label: "Yakuza Kiwami 2", hint: "Majima saga", image: steamArt("837030"), category: "games" },
      { q: "Like a Dragon Gaiden", label: "Like a Dragon Gaiden", hint: "The Man Who Erased His Name", image: steamArt("2375550"), category: "games" },
      { q: "Like a Dragon: Infinite Wealth", label: "Infinite Wealth", hint: "Yakuza 8", image: steamArt("2072450"), category: "games" },
    ],
  },
  {
    keys: ["zelda"],
    items: [
      { q: "The Legend of Zelda: Tears of the Kingdom", label: "Tears of the Kingdom", hint: "Nintendo", category: "games" },
      { q: "The Legend of Zelda: Breath of the Wild", label: "Breath of the Wild", hint: "Nintendo", category: "games" },
    ],
  },
  {
    keys: ["gta", "grand theft"],
    items: [
      { q: "Grand Theft Auto V", label: "GTA V", hint: "Steam live", image: steamArt("271590"), category: "games" },
      { q: "Grand Theft Auto IV", label: "GTA IV", hint: "Keys vs discs", image: steamArt("12210"), category: "games" },
    ],
  },
  {
    keys: ["nike"],
    items: [
      { q: "Nike Dunk Low", label: "Nike Dunk Low", hint: "Sneakers", category: "clothes" },
      { q: "Nike Air Force 1", label: "Nike Air Force 1", hint: "Sneakers", category: "clothes" },
      { q: "Nike Air Max 90", label: "Nike Air Max 90", hint: "Sneakers", category: "clothes" },
    ],
  },
  {
    keys: ["berserk"],
    items: [
      { q: "Berserk Deluxe Volume 1", label: "Berserk Deluxe Vol. 1", hint: "Dark Horse · hardcover", image: "https://covers.openlibrary.org/b/isbn/9781506711980-L.jpg", category: "books" },
      { q: "Berserk Deluxe Volume 2", label: "Berserk Deluxe Vol. 2", hint: "Kentaro Miura", image: "https://covers.openlibrary.org/b/isbn/9781506711997-L.jpg", category: "books" },
      { q: "Berserk Deluxe Volume 3", label: "Berserk Deluxe Vol. 3", hint: "Kentaro Miura", image: "https://covers.openlibrary.org/b/isbn/9781506712000-L.jpg", category: "books" },
      { q: "Berserk Deluxe Volume 4", label: "Berserk Deluxe Vol. 4", hint: "Kentaro Miura", image: "https://covers.openlibrary.org/b/isbn/9781506712017-L.jpg", category: "books" },
      { q: "Berserk Deluxe Volume 5", label: "Berserk Deluxe Vol. 5", hint: "Kentaro Miura", image: "https://covers.openlibrary.org/b/isbn/9781506712024-L.jpg", category: "books" },
      { q: "Berserk Deluxe Volume 6", label: "Berserk Deluxe Vol. 6", hint: "Kentaro Miura", image: "https://covers.openlibrary.org/b/isbn/9781506713984-L.jpg", category: "books" },
    ],
  },
  {
    keys: ["lego", "legos", "duplo"],
    items: [
      { q: "LEGO Classic Bricks", label: "LEGO Classic Bricks", hint: "The brick", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Lego_Color_Bricks.jpg/440px-Lego_Color_Bricks.jpg", category: "home" },
      { q: "LEGO Star Wars Millennium Falcon", label: "Millennium Falcon", hint: "UCS / 75192", category: "home" },
      { q: "LEGO Botanicals Orchid", label: "Botanicals Orchid", hint: "Set 10311", category: "home" },
      { q: "LEGO Technic", label: "LEGO Technic", hint: "Machines", category: "home" },
      { q: "LEGO Harry Potter Hogwarts Castle", label: "Hogwarts Castle", hint: "Harry Potter", category: "home" },
      { q: "LEGO DUPLO", label: "LEGO DUPLO", hint: "Little builders", category: "home" },
    ],
  },
];

export function isAisleQuery(q: string) {
  const s = q.trim().toLowerCase();
  if (!s) return false;
  if (s.split(/\s+/).length > 2) return false;
  return /^(foods?|grocer(y|ies)|produce|snacks?|dairy|yogurt|yoghurt|drinks?|beverages?|meat|frozen|pantry|clothes?|shoes?|makeup|beauty|skincare|games?|cards?|books?|toys?)$/i.test(s);
}

export function suggest(query: string, recent: { q: string }[] = []): Suggestion[] {
  const raw = query.trim();
  const q = normalizeQuery(raw);
  if (q.length < 2) return [];
  const seen = new Set<string>();
  const out: Suggestion[] = [];

  const push = (row: Suggestion) => {
    const key = normalizeQuery(row.q);
    if (!key || seen.has(key) || key === q) return;
    seen.add(key);
    out.push(row);
  };

  const resolved = resolveQuery(raw);
  const rq = normalizeQuery(resolved);
  if (rq && rq !== q) {
    push({ q: resolved, label: resolved, hint: "Did you mean", category: guessCategory(resolved) });
  }

  for (const aisle of AISLES) {
    if (aisle.keys.some((k) => q === k || rq === k || q.startsWith(k) || rq.startsWith(k) || k.startsWith(q) || k.startsWith(rq) || q.includes(k) || rq.includes(k))) {
      aisle.items.forEach(push);
    }
  }

  for (const row of franchiseMatches(raw)) push(row);

  for (const p of PRODUCTS) {
    const hay = normalizeQuery(`${p.name} ${p.brand} ${p.aliases.join(" ")}`);
    if (hay.includes(q) || q.split(" ").every((w) => hay.includes(w))) {
      push({
        q: p.name,
        label: p.name,
        hint: p.brand,
        image: p.image,
        category: p.category,
      });
    }
  }

  for (const r of recent) {
    if (normalizeQuery(r.q).includes(q)) {
      push({ q: r.q, label: r.q, hint: "Recent", category: guessCategory(r.q) });
    }
  }

  return out.slice(0, 6);
}

export function isFranchiseQuery(q: string) {
  const n = normalizeQuery(q);
  if (!n) return false;
  return FRANCHISES.some((pack) => pack.keys.some((k) => n === normalizeQuery(k)));
}

export function franchiseMatches(query: string): Suggestion[] {
  const q = normalizeQuery(query);
  if (q.length < 3) return [];
  for (const pack of FRANCHISES) {
    if (pack.keys.some((k) => q.includes(normalizeQuery(k)) || normalizeQuery(k).includes(q))) {
      return pack.items.filter((item) => normalizeQuery(item.q) !== q);
    }
  }
  return [];
}

const ADDON_RE =
  /\b(dlc|down?loadable content|soundtrack|ost|karaoke|job set|management mode|season pass|cosmetic|costume|weapon pack|bonus content|pre-?order)\b/i;
const EDITION_STRIP =
  /\b(legendary|hero|deluxe|complete|gold|ultimate|standard|definitive|goty|game of the year|hd|remastered|windows|pc|steam|edition|collection|bundle|vol|volume)\b/gi;

function isEditionWord(w: string) {
  return /^(legendary|hero|deluxe|complete|gold|ultimate|standard|definitive|goty|hd|remastered|windows|pc|steam|edition|collection|bundle|vol|volume|\d+)$/i.test(
    w,
  );
}

export function isAddonTitle(name: string, query = "") {
  if (ADDON_RE.test(query)) return false;
  if (ADDON_RE.test(name)) return true;
  return isEditionOf(name, query);
}

function volumeNum(s: string) {
  const m = s.match(/\b(?:vol\.?|volume)\s*(\d+)\b/i);
  return m ? m[1] : null;
}

export function isEditionOf(candidate: string, query: string) {
  const cv = volumeNum(candidate);
  const qv = volumeNum(query);
  if (cv && qv && cv !== qv) return false;
  const n = normalizeQuery(candidate);
  const q = normalizeQuery(query);
  if (!n || !q) return false;
  if (n === q) return true;
  const nCore = n.replace(EDITION_STRIP, " ").replace(/\s+/g, " ").trim();
  const qCore = q.replace(EDITION_STRIP, " ").replace(/\s+/g, " ").trim();
  if (nCore && qCore && nCore === qCore && n !== q) return true;
  if (n.startsWith(q)) {
    const extra = n.slice(q.length).trim();
    if (!extra) return true;
    return extra.split(" ").every(isEditionWord);
  }
  return false;
}
