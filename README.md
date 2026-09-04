# Hound

Private price-hunting app. Scan or name an item, rank real storefronts, pin a drop, snag when it hits.

If you are a Grok taking this over, start with **[GROK_HANDOFF.md](./GROK_HANDOFF.md)**. That is the unsolved iOS keyboard bug, what already failed, and the files to touch.

## Stack

TanStack Start + Vite + React. Preview is a PWA in Grok’s iOS webview.

```
src/components/app-shell.tsx    layout + keyboard reset
src/components/screens/hunt.tsx search bar (keep it on home)
src/styles.css                  shell / chrome / tabs
src/lib/engine.ts               search + ranking
src/lib/stores.ts               storefronts
src/lib/catalog.ts              known products
src/lib/handoff.ts              copy-paste prompt (also on Notes tab)
```

## Run

```bash
npm install
npm run dev
```

Owner: [Soraneverending](https://github.com/Soraneverending). **Private.** Do not make it public.
