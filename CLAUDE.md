# Hound → Claude

Private repo: https://github.com/Soraneverending/hound  
Latest commit: `e9d5fb9` on `main` (2026-09-04).

You are taking over **Hound**, a camera-first price-hunting PWA (TanStack Start + Vite + React) that the user tests **only** in Grok’s iOS in-chat preview (WKWebView). No Mac. Native Grok chrome overlays the webview: **X** top-left, **…** top-right, compose bar at the bottom. User keyboard: **SwiftKey** on iPhone (Kingdom Hearts theme), not stock iOS.

Do not scaffold a new app. Edit the existing files. Serve the existing preview.

---

## THE OPEN BUG (this is the job)

After the SwiftKey keyboard **closes**, search + Hunt/Pins/Aisles/Notes stay **raised**, with a beige gap under the tab bar. They should snap flush to the bottom of the preview.

Secondary: search used to be instant; later keyboard hacks made tap-to-focus slow. Current `e9d5fb9` tries to make tap cheap again (home stays mounted). User has **not** confirmed the gap is gone on device.

User videos are the only proof. **Linux Chromium Playwright does not pan like iOS WKWebView + SwiftKey.** Do not ship a “fix” because Playwright gap=0.

Success, three times in a row on the user’s iPhone:

1. Rest: search dock + tabs flush to the bottom. Header not under the X.
2. Tap search: keyboard opens **immediately**. Field stays usable.
3. Dismiss SwiftKey: tabs and search **come back down**. No beige slab. No header jump.

---

## CURRENT LAYOUT (`e9d5fb9`) — leave this structure

Search is a **bottom dock**, not under the Hound title.

```
.app-shell
  .app-chrome          (tiny HuntTop spacer on hunt tab)
  main.app-scroll      HuntScreen (hidden while searchOpen) + LiveSearchPanel
  SearchDock           <input data-hound-search="1"> + Hunt + Back
  TabBar
```

Key files:

| File | Role |
|---|---|
| `src/components/app-shell.tsx` | Shell, tabs, hunt stays mounted (`hidden={searchOpen}`) |
| `src/components/search-layer.tsx` | SearchDock + Back. Focus = `setSearchOpen(true)` only. Blur = `restoreRest()`. Empty query blur closes search. |
| `src/lib/shell-height.ts` | Capture first-paint height; restore on blur / viewport grow |
| `src/styles.css` | `html/body` 100% overflow hidden; `.app-shell` absolute inset 0 flex column; dock + tabs in flow |
| `src/routes/__root.tsx` | viewport: `interactive-widget=overlays-content` |
| `src/components/screens/hunt.tsx` | Home, results, LiveSearchPanel. Photo input is created on tap (not left in the DOM). |
| `src/lib/engine.ts` / `catalog.ts` / `stores.ts` / `suggest.ts` / `run-hunt.ts` | Search + prices |

Header uses extra left padding (`pl-12` / `pl-16`) so copy clears Grok’s X.

---

## DO NOT REPEAT (all shipped, all rejected)

1. Full-screen SearchSheet / extra search page.
2. Hiding brand row or tab bar while typing (`html.hound-typing` / `html.hound-kb`) — caused jumps.
3. `translateY(visualViewport.offsetTop)` — leftover transform, header in the clock.
4. Large top spacers (96px / 56px) — “header all down.”
5. Absolute/fixed tab bar + padding-bottom hacks.
6. `rAF` counter-pan.
7. `--kb` padding that **lifts** the dock with the keyboard — user: “it just goes up higher than it ever did.”
8. `100lvh` min-height — taller than the Grok iframe, **search and tabs vanished**.
9. 50ms / 350ms restore timers — “takes longer to open.”
10. Tearing down HuntScreen on every focus — slow open.
11. Hidden `<input type="file">` left in the DOM — iOS/SwiftKey showed prev/next/done accessory, leftover gap. Photo picker is `document.createElement("input")` on tap now.
12. Playwright as proof the iPhone is fixed.

---

## WHY IT BREAKS

SwiftKey is taller than stock iOS (suggestion bar lands late). Focusing a **bottom** input makes WKWebView pan/resize to keep the field above the keys. After dismiss, `visualViewport` / iframe height often **does not reset**, so our 100%-height shell stays short and you see app beige under the tabs.

`visualViewport.offsetTop` in this embed is unreliable (often 0 while the picture still jumped).

---

## SEARCH QUALITY (second track)

Must behave like Google.

- Cereal / yogurt / Frosted Flakes → grocery (Vons, etc.), not Goodwill.
- LEGO → toys, not games.
- Yakuza / Palworld / MGS → games, **Steam / Humble / GMG / GOG first**, then marketplaces.
- Berserk → book, Barnes & Noble.
- Series requests → other games in the series, not DLC.
- Honest links only. No stores that don’t sell the item. No invented prices.

---

## HOW TO WORK

1. Clone `github.com/Soraneverending/hound` (private, user `Soraneverending`).
2. Edit in place. Do not hide the dock or tabs to “solve” pan.
3. After a layout change, reason from the user’s latest iPhone clip.
4. A real fix must survive: tap search, type, dismiss SwiftKey, **three times**.
