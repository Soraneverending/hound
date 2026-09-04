import { create } from "zustand";
import { persist } from "zustand/middleware";
import { persistStorage } from "@/lib/storage";
import { formatMoney, isTrustedStore, money } from "@/lib/engine";
import { haptic } from "@/lib/haptics";
import { networkFor, partnerHref, type PartnerClick, type PartnerTags } from "@/lib/affiliates";
import { normalizeTheme, type ThemeId } from "@/lib/themes";
import type { HuntResult, Pin, Ping, SnagEvent, TabId } from "@/lib/types";

type DraftPin = {
  productId: string;
  name: string;
  brand: string;
  category: Pin["category"];
  target: number;
  lastFloor: number;
  storeId: string;
  storeName: string;
  snag: boolean;
  image?: string;
};

type LastHunt = {
  q: string;
  category?: HuntResult["product"]["category"];
  image?: string;
};

type HoundState = {
  tab: TabId;
  query: string;
  result: HuntResult | null;
  lastHunt: LastHunt | null;
  stayHome: boolean;
  hunting: boolean;
  status: string;
  scanning: boolean;
  budget: number;
  paypalOnly: boolean;
  pickupOnly: boolean;
  newOnly: boolean;
  pins: Pin[];
  pings: Ping[];
  snag: SnagEvent | null;
  recent: { q: string; at: number; image?: string }[];
  notice: string | null;
  notifyOn: boolean;
  theme: ThemeId;
  boardStoreId: string | null;
  partnerTags: PartnerTags;
  clicks: PartnerClick[];
  pro: boolean;
  setTab: (tab: TabId) => void;
  setQuery: (q: string) => void;
  setResult: (result: HuntResult | null) => void;
  goHome: () => void;
  setHunting: (v: boolean, status?: string) => void;
  setScanning: (v: boolean) => void;
  setBudget: (n: number) => void;
  setPaypalOnly: (v: boolean) => void;
  setPickupOnly: (v: boolean) => void;
  setNewOnly: (v: boolean) => void;
  pinItem: (item: DraftPin) => void;
  unpin: (id: string) => void;
  toggleSnag: (id: string) => void;
  setTarget: (id: string, target: number) => void;
  pulsePins: () => void;
  applyFloor: (id: string, floor: number, storeId: string, storeName: string) => void;
  undoSnag: () => void;
  completeSnag: () => void;
  markPingsRead: () => void;
  remember: (q: string, image?: string) => void;
  rememberHunt: (hunt: LastHunt) => void;
  setNotice: (n: string | null) => void;
  enableNotify: () => void;
  setTheme: (theme: ThemeId) => void;
  setBoardStore: (id: string | null) => void;
  noteStore: (storeId: string) => void;
  setPartnerTag: (network: keyof PartnerTags, value: string) => void;
  recordClick: (item: { storeId: string; storeName: string; name: string }) => void;
  setPro: (pro: boolean) => void;
};

export const FREE_PIN_LIMIT = 5;

function pingId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function emitBrowserPing(title: string, body: string) {
  haptic("success");
  if (typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, silent: false });
  } catch {
    // Preview / missing service worker — in-app ping still fires.
  }
}

export const useHound = create<HoundState>()(
  persist(
    (set, get) => ({
      tab: "hunt",
      query: "",
      result: null,
      lastHunt: null,
      stayHome: false,
      hunting: false,
      status: "",
      scanning: false,
      budget: 0,
      paypalOnly: false,
      pickupOnly: false,
      newOnly: false,
      pins: [],
      pings: [],
      snag: null,
      recent: [],
      notice: null,
      notifyOn: false,
      theme: "paper",
      boardStoreId: null,
      partnerTags: {},
      clicks: [],
      pro: false,
      setTab: (tab) => set({ tab }),
      setQuery: (query) => set({ query }),
      setResult: (result) =>
        set(
          result
            ? { result, tab: "hunt", stayHome: false }
            : { result: null },
        ),
      goHome: () => set({ result: null, lastHunt: null, stayHome: true, query: "", hunting: false, status: "", scanning: false }),
      setHunting: (hunting, status = "") => set({ hunting, status }),
      setScanning: (scanning) => set({ scanning }),
      setBudget: (budget) => set({ budget: Math.max(0, budget) }),
      setPaypalOnly: (paypalOnly) => set({ paypalOnly }),
      setPickupOnly: (pickupOnly) => set({ pickupOnly }),
      setNewOnly: (newOnly) => set({ newOnly }),
      pinItem: (item) => {
        const existing = get().pins.find((p) => p.productId === item.productId);
        const pro = get().pro;
        if (!existing && !pro && get().pins.length >= FREE_PIN_LIMIT) {
          set({
            notice: `Free is ${FREE_PIN_LIMIT} pins. Hound Pro lifts the cap.`,
            tab: "pins",
          });
          return;
        }
        const snag = pro ? item.snag : false;
        if (existing) {
          set({
            pins: get().pins.map((p) =>
              p.id === existing.id
                ? {
                    ...p,
                    target: item.target,
                    snag,
                    lastFloor: item.lastFloor,
                    storeId: item.storeId,
                    storeName: item.storeName,
                    image: item.image || p.image,
                    hitAt: null,
                    snaggedAt: null,
                  }
                : p,
            ),
            notice: !item.snag || pro ? "Pin updated" : "Pinned. Snag is Pro.",
            tab: "pins",
          });
          return;
        }
        const row: Pin = {
          ...item,
          snag,
          id: pingId(),
          createdAt: Date.now(),
          hitAt: item.lastFloor < item.target - 0.01 ? Date.now() : null,
          snaggedAt: null,
        };
        set({
          pins: [row, ...get().pins].slice(0, pro ? 80 : FREE_PIN_LIMIT),
          notice: snag ? "Pinned with Snag on" : item.snag && !pro ? "Pinned. Snag is Pro — turn it on in Pins." : "Pinned — Hound will ping on a drop",
          tab: "pins",
        });
      },
      unpin: (id) =>
        set({
          pins: get().pins.filter((p) => p.id !== id),
          snag: get().snag?.pinId === id ? null : get().snag,
        }),
      toggleSnag: (id) => {
        if (!get().pro) {
          set({ notice: "Snag is Pro — turn it on below.", tab: "pins" });
          return;
        }
        set({
          pins: get().pins.map((p) => (p.id === id ? { ...p, snag: !p.snag } : p)),
        });
      },
      setTarget: (id, target) =>
        set({
          pins: get().pins.map((p) => (p.id === id ? { ...p, target: money(target), hitAt: null } : p)),
        }),
      applyFloor: (id, floor, storeId, storeName) => {
        const pin = get().pins.find((p) => p.id === id);
        if (!pin || pin.snaggedAt) return;
        const nextFloor = money(floor);
        const crossed = pin.lastFloor > pin.target + 0.01 && nextFloor <= pin.target;
        const notable = nextFloor <= pin.lastFloor - 0.4;
        const hit = nextFloor <= pin.target;
        const dropped = nextFloor < pin.lastFloor - 0.05;
        const snagArmed = pin.snag && !get().snag && !pin.snaggedAt && isTrustedStore(storeId);
        if (!notable && !crossed && !(snagArmed && hit && dropped)) {
          if (nextFloor < pin.lastFloor) {
            set({
              pins: get().pins.map((p) =>
                p.id === id ? { ...p, lastFloor: nextFloor, storeId, storeName } : p,
              ),
            });
          }
          return;
        }
        const pings = [...get().pings];
        const shouldPing = crossed || (notable && !pin.hitAt) || (hit && dropped && !pin.hitAt);
        if (shouldPing) {
          const row: Ping = {
            id: pingId(),
            pinId: id,
            kind: hit ? "hit" : "drop",
            title: hit ? `${pin.name} hit ${formatMoney(nextFloor)}` : `${pin.name} dropped`,
            body: `${storeName} · ${formatMoney(nextFloor)}  (was ${formatMoney(pin.lastFloor)})`,
            at: Date.now(),
            read: false,
          };
          pings.unshift(row);
          emitBrowserPing(row.title, row.body);
        }
        let snag = get().snag;
        const snagNow =
          pin.snag &&
          !snag &&
          !pin.snaggedAt &&
          hit &&
          dropped &&
          isTrustedStore(storeId);
        if (snagNow) {
          snag = {
            pinId: id,
            name: pin.name,
            storeName,
            storeId,
            total: nextFloor,
            url: partnerHref(storeId, pin.name, get().partnerTags),
            endsAt: Date.now() + 7000,
          };
          pings.unshift({
            id: pingId(),
            pinId: id,
            kind: "snag",
            title: `Snagging ${pin.name}`,
            body: `Opening ${storeName} at ${formatMoney(nextFloor)} — undo for 7 seconds`,
            at: Date.now(),
            read: false,
          });
          emitBrowserPing(`Snagging ${pin.name}`, `Opening ${storeName}`);
        } else if (crossed && pin.snag && !isTrustedStore(storeId)) {
          pings.unshift({
            id: pingId(),
            pinId: id,
            kind: "hit",
            title: `${pin.name} hit on ${storeName}`,
            body: "Marketplace listing — confirm yourself. Snag never auto-buys used/third-party.",
            at: Date.now(),
            read: false,
          });
        }
        set({
          pins: get().pins.map((p) =>
            p.id === id
              ? {
                  ...p,
                  lastFloor: nextFloor,
                  storeId,
                  storeName,
                  hitAt: hit ? p.hitAt ?? Date.now() : p.hitAt,
                }
              : p,
          ),
          pings: pings.slice(0, 40),
          snag,
        });
      },
      pulsePins: () => {
        const { pins, applyFloor } = get();
        pins.forEach((pin) => {
          if (pin.snaggedAt) return;
          if (pin.hitAt && !(pin.snag && isTrustedStore(pin.storeId) && !get().snag)) return;
          const age = Date.now() - pin.createdAt;
          const hurry = age < 14_000;
          if (!hurry && Math.random() > 0.45) return;
          const step = hurry ? 0.055 : 0.02;
          const next = money(Math.max(0.5, pin.lastFloor * (1 - step)));
          applyFloor(pin.id, next, pin.storeId, pin.storeName);
        });
      },
      undoSnag: () => set({ snag: null, notice: "Snag cancelled" }),
      completeSnag: () => {
        const snag = get().snag;
        if (!snag) return;
        set({
          snag: null,
          pins: get().pins.map((p) => (p.id === snag.pinId ? { ...p, snaggedAt: Date.now() } : p)),
          notice: `Listing ready at ${snag.storeName}`,
        });
      },
      markPingsRead: () =>
        set({
          pings: get().pings.map((p) => ({ ...p, read: true })),
        }),
      remember: (q, image) => {
        const trimmed = q.trim();
        if (!trimmed) return;
        const src = image && (/^https?:\/\//i.test(image) || image.startsWith("/")) ? image : undefined;
        const prev = get().recent.find((r) => r.q === trimmed);
        set({
          recent: [
            { q: trimmed, at: Date.now(), image: src || prev?.image },
            ...get().recent.filter((r) => r.q !== trimmed),
          ].slice(0, 8),
        });
      },
      rememberHunt: (hunt: LastHunt) => {
        const q = hunt.q.trim();
        if (!q) return;
        const src = hunt.image;
        const image = src && (/^https?:\/\//i.test(src) || src.startsWith("/")) ? src : undefined;
        set({ lastHunt: { q, category: hunt.category, image } });
      },
      setNotice: (notice) => set({ notice }),
      enableNotify: () => {
        if (typeof Notification === "undefined") return;
        void Notification.requestPermission().then((perm) => {
          set({ notifyOn: perm === "granted" });
        });
      },
      setTheme: (theme) => set({ theme: normalizeTheme(theme) }),
      setBoardStore: (boardStoreId) => set({ boardStoreId }),
      noteStore: (storeId) => set({ boardStoreId: storeId, tab: "board" }),
      setPartnerTag: (network, value) =>
        set({ partnerTags: { ...get().partnerTags, [network]: value.trim() } }),
      recordClick: (item) => {
        const network = networkFor(item.storeId);
        const tagged = Boolean(network && get().partnerTags[network]?.trim());
        const row: PartnerClick = {
          id: pingId(),
          storeId: item.storeId,
          storeName: item.storeName,
          item: item.name,
          network,
          tagged,
          at: Date.now(),
        };
        set({ clicks: [row, ...get().clicks].slice(0, 24) });
      },
      setPro: (pro) =>
        set({
          pro,
          notice: pro ? "Hound Pro is on for this device. Billing comes later." : "Back to free — 5 pins, no Snag.",
          pins: pro
            ? get().pins
            : get().pins.map((p) => ({ ...p, snag: false })).slice(0, FREE_PIN_LIMIT),
        }),
    }),
    {
      name: "hound-v4",
      skipHydration: true,
      storage: persistStorage,
      partialize: (s) => ({
        budget: s.budget,
        paypalOnly: s.paypalOnly,
        pickupOnly: s.pickupOnly,
        newOnly: s.newOnly,
        pins: s.pins,
        pings: s.pings,
        recent: s.recent,
        notifyOn: s.notifyOn,
        theme: normalizeTheme(s.theme as string),
        partnerTags: s.partnerTags,
        clicks: s.clicks,
        pro: s.pro,
        lastHunt: s.lastHunt,
        stayHome: s.stayHome,
      }),
      merge: (persisted, current) => {
        const raw = (persisted ?? {}) as Partial<HoundState>;
        return {
          ...current,
          budget: typeof raw.budget === "number" ? raw.budget : current.budget,
          paypalOnly: Boolean(raw.paypalOnly),
          pickupOnly: Boolean(raw.pickupOnly),
          newOnly: Boolean(raw.newOnly),
          pins: Array.isArray(raw.pins) ? raw.pins : current.pins,
          pings: Array.isArray(raw.pings) ? raw.pings : current.pings,
          recent: Array.isArray(raw.recent) ? raw.recent : current.recent,
          notifyOn: Boolean(raw.notifyOn),
          theme: normalizeTheme(String(raw.theme ?? current.theme)),
          partnerTags: raw.partnerTags ?? current.partnerTags,
          clicks: Array.isArray(raw.clicks) ? raw.clicks : current.clicks,
          pro: Boolean(raw.pro),
          lastHunt: raw.lastHunt?.q ? raw.lastHunt : current.lastHunt,
          stayHome: typeof raw.stayHome === "boolean" ? raw.stayHome : current.stayHome,
          result: current.result,
          query: current.query,
          hunting: current.hunting,
          scanning: current.scanning,
          tab: current.tab,
        };
      },
    },
  ),
);
