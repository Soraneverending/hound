import { honestUrl, listingUrl } from "@/lib/engine";

export type NetworkId = "amazon" | "ebay" | "impact" | "cj" | "rakuten" | "aliexpress";

export type PartnerTags = Partial<Record<NetworkId, string>>;

export const NETWORKS: {
  id: NetworkId;
  label: string;
  apply: string;
  placeholder: string;
}[] = [
  { id: "amazon", label: "Amazon Associates", apply: "tag", placeholder: "yourtag-20" },
  { id: "ebay", label: "eBay Partner Network", apply: "campid", placeholder: "5338xxxxxx" },
  { id: "impact", label: "Impact — Walmart, Target, Wayfair", apply: "irclickid", placeholder: "Impact click ID" },
  { id: "cj", label: "CJ — Best Buy, Newegg", apply: "sid", placeholder: "CJ SID" },
  { id: "rakuten", label: "Rakuten — Macy's, Nordstrom, Ulta", apply: "ranMID", placeholder: "Merchant ID" },
  { id: "aliexpress", label: "AliExpress", apply: "aff_fcid", placeholder: "Affiliate ID" },
];

const STORE_NETWORK: Record<string, NetworkId> = {
  amazon: "amazon",
  woot: "amazon",
  ebay: "ebay",
  walmart: "impact",
  target: "impact",
  wayfair: "impact",
  overstock: "impact",
  chewy: "impact",
  homedepot: "impact",
  lowes: "impact",
  sephora: "impact",
  etsy: "impact",
  nike: "impact",
  farfetch: "impact",
  shein: "impact",
  temu: "impact",
  shop: "impact",
  bestbuy: "cj",
  newegg: "cj",
  macys: "rakuten",
  nordstrom: "rakuten",
  nordrack: "rakuten",
  ulta: "rakuten",
  kohls: "rakuten",
  jcpenney: "rakuten",
  aliexpress: "aliexpress",
};

export function networkFor(storeId: string): NetworkId | null {
  return STORE_NETWORK[storeId] ?? null;
}

export function storePays(storeId: string) {
  return networkFor(storeId) != null;
}

function applyTag(raw: string, network: NetworkId, tag: string) {
  try {
    const url = new URL(raw);
    if (network === "amazon") {
      url.searchParams.set("tag", tag);
      url.searchParams.set("linkCode", "ll2");
    } else if (network === "ebay") {
      url.searchParams.set("mkcid", "1");
      url.searchParams.set("mkrid", "711-53200-19255-0");
      url.searchParams.set("siteid", "0");
      url.searchParams.set("campid", tag);
      url.searchParams.set("customid", "hound");
      url.searchParams.set("toolid", "10001");
    } else if (network === "impact") {
      url.searchParams.set("irgwc", "1");
      url.searchParams.set("irclickid", tag);
      url.searchParams.set("utm_source", "hound");
    } else if (network === "cj") {
      url.searchParams.set("sid", tag);
      url.searchParams.set("utm_source", "hound");
    } else if (network === "rakuten") {
      url.searchParams.set("ranMID", tag);
      url.searchParams.set("ranEAID", "hound");
      url.searchParams.set("utm_source", "hound");
    } else if (network === "aliexpress") {
      url.searchParams.set("aff_fcid", tag);
      url.searchParams.set("aff_fsk", "hound");
    }
    return url.toString();
  } catch {
    return raw;
  }
}

export function wrapAffiliate(raw: string, storeId: string, tags: PartnerTags) {
  const network = networkFor(storeId);
  if (!network) return raw;
  const tag = tags[network]?.trim();
  if (!tag) return raw;
  return applyTag(raw, network, tag);
}

export function partnerHref(storeId: string, name: string, tags: PartnerTags, liveUrl?: string) {
  const base = honestUrl(storeId, name, liveUrl) || listingUrl(storeId, name);
  return wrapAffiliate(base, storeId, tags);
}

export function taggedFor(storeId: string, tags: PartnerTags) {
  const network = networkFor(storeId);
  if (!network) return false;
  return Boolean(tags[network]?.trim());
}

export const NO_PAY_NOTE =
  "Grocery, clubs, Steam, thrift, cars, and most mall tenants do not run public affiliate programs. Those taps do not pay.";


export type PartnerClick = {
  id: string;
  storeId: string;
  storeName: string;
  item: string;
  network: NetworkId | null;
  tagged: boolean;
  at: number;
};
