export type Category =
  | "games"
  | "groceries"
  | "clothes"
  | "electronics"
  | "pharmacy"
  | "home"
  | "books"
  | "collectibles"
  | "cars"
  | "beauty";

export type StoreKind =
  | "bigbox"
  | "grocery"
  | "marketplace"
  | "digital"
  | "pharmacy"
  | "club"
  | "handmade"
  | "thrift"
  | "luxury"
  | "auto"
  | "auction"
  | "beauty"
  | "mall"
  | "shop";

export type Condition = "new" | "like-new" | "used" | "open-box";
export type Stock = "in" | "low" | "out";
export type TabId = "hunt" | "pins" | "aisles" | "board";

export type Store = {
  id: string;
  name: string;
  kind: StoreKind;
  paypal: boolean;
  pickup: boolean;
  miles?: number;
  sells: Category[];
  href?: string;
  bias?: number;
};

export type Offer = {
  id: string;
  storeId: string;
  price: number;
  shipping: number;
  condition: Condition;
  stock: Stock;
  note?: string;
  authentic?: boolean;
  live?: boolean;
  searchOnly?: boolean;
  url?: string;
  image?: string;
};

export type Product = {
  id: string;
  name: string;
  brand: string;
  category: Category;
  upc: string;
  aliases: string[];
  typical: number;
  cheapShark?: string;
  alternatives: string[];
  ephemeral?: boolean;
  image?: string;
};

export type RankedOffer = Offer & {
  store: Store;
  total: number;
  isFloor: boolean;
  nearFloor: boolean;
};

export type HuntMatch = {
  name: string;
  image?: string;
  hint: string;
  category?: Category;
};

export type HuntResult = {
  product: Product;
  offers: RankedOffer[];
  floor: RankedOffer | null;
  near: RankedOffer[];
  alts: Product[];
  matches?: HuntMatch[];
  source: "catalog" | "live" | "vision" | "barcode" | "search";
  scanned?: string;
};

export type Pin = {
  id: string;
  productId: string;
  name: string;
  brand: string;
  category: Category;
  target: number;
  lastFloor: number;
  storeId: string;
  storeName: string;
  snag: boolean;
  createdAt: number;
  hitAt: number | null;
  snaggedAt: number | null;
  image?: string;
};

export type Ping = {
  id: string;
  pinId: string;
  kind: "drop" | "hit" | "snag";
  title: string;
  body: string;
  at: number;
  read: boolean;
};

export type SnagEvent = {
  pinId: string;
  name: string;
  storeName: string;
  storeId: string;
  total: number;
  url: string;
  endsAt: number;
};
