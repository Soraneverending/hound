export const HANDOFF_TITLE = "Hound — iOS search keyboard bug (pass to Grok)";

export const HANDOFF_PROMPT = `You are taking over Hound, a camera-first price-hunting PWA (TanStack Start + Vite + React) running inside Grok's iOS preview (WKWebView). The user is on iPhone, no Mac. They only see the in-chat live preview. Native Grok chrome overlays the webview: X top-left, … top-right, "Build with Grok" compose at the bottom.

## THE BUG (unsolved — this is the job)

Tapping the home search input ("Name or title") makes iOS pan/jump the page.

Ground truth video (user clip, ~6s):
- 0–1s REST: GOOD. Hound header below the X, search under Hound, tiles, tab bar flush to the bottom. No cutoff.
- ~2s KEYBOARD OPEN: GOOD. Search STAYS under Hound. Keyboard overlays the tab bar. Do not "improve" this frame.
- ~3s: BAD. Header vanishes. Search flies up into the X / status bar.
- ~4–5s KEYBOARD CLOSED: BAD. Hound + search are gone. Page is scrolled so content starts mid-body ("Scan, pin, snag…"). Tab bar is back. Leftover pan.

Success = 1s look at rest, 2s look while typing, 1s look after dismiss. Search never leaves its rest slot. Header never hides. Tabs may be covered by the keyboard (OK) but must return flush to the bottom with no blank slab under them.

User hates: extra search page/sheet, "locked scroll", header shoved down (96px spacers), page loading cut off, search under the X, blank gap under tabs.

## DO NOT REPEAT (all shipped, all rejected or regressing)

1. Full-screen SearchSheet / portal overlay — user: "don't make me move to a different page."
2. Hiding .brand-row / .tab-bar while typing (html.hound-typing) — THIS caused the 3s jump in the video. Removed.
3. translateY(visualViewport.offsetTop) on .app-shell or .app-chrome — fights iOS, leftover transform = header in the clock or empty top gap.
4. Large top spacers (96px / 56px) — "header all down", "page loading halfway."
5. position:absolute tab bar + padding-bottom hacks.
6. requestAnimationFrame counter-pan (one frame late, looks like a jump).
7. Chromium Playwright as proof the iPhone is fixed. Linux Chromium does not pan like iOS. User videos are the only proof.

## CURRENT LAYOUT (leave this structure)

src/components/app-shell.tsx
- .app-shell > .app-chrome (brand-row + SearchChrome) > main.app-scroll > TabBar
- Search is INLINE on home. Keep it there.
- Header uses pl-16 pr-16 so Hound sits to the right of Grok's X.
- On blur / visualViewport resize: scroll window + .app-scroll to 0 (retry 50/280/500ms). No transforms.

src/styles.css
- html, body: height 100%; overflow hidden
- .app-shell: position:fixed; inset:0; flex column; overflow hidden
- .app-chrome: flex 0 0 auto
- .app-scroll: flex 1; min-height 0; overflow-y auto
- .tab-bar: flex 0 0 auto
- viewport meta: interactive-widget=overlays-content, viewport-fit=cover, maximum-scale=1
- Search input: font-size 16px, focus({ preventScroll: true })

src/components/screens/hunt.tsx — SearchChrome is the <input data-hound-search="1">.

## WHY IT BREAKS

iOS pans the visual viewport (sometimes the whole WKWebView) to keep the focused input on screen. The input sits ~60px down (header is above it), so Safari drags ~60px. Grok's X is a native overlay, not in our DOM. After dismiss, offsetTop / webview pan often does not reset, so chrome stays off-screen.

visualViewport.offsetTop inside this embed is unreliable (often 0 while the picture still jumped). Closed-loop getBoundingClientRect pinning was tried; still jumped on device.

## SEARCH QUALITY (second track, not the jump)

Engine: src/lib/engine.ts (resolveQuery, guessCategory, isToyQuery, GROCERY_WORDS, KEY_HEAD = steam/humble/gmg/gog first for games), catalog.ts, stores.ts (~186 storefronts), suggest.ts, run-hunt.ts.
Must behave like Google: "rasin bran" → Raisin Bran / Kellogg's / groceries / Vons first, not OfferUp. LEGO = toys not games. Palworld / Yakuza = games with Steam/Humble/GMG first. Berserk = book, Barnes & Noble. Frosted Flakes = cereal. Do not list stores that do not sell the item. Honest links only.

## HOW TO WORK

Edit the existing files. Do not scaffold a new app. Do not add a search route. Serve on the existing preview. After a layout change, reason from the user's latest iPhone clip, not from Playwright rest screenshots.

If you find a real fix, it must survive: tap search, type, dismiss keyboard, three times in a row, with Hound + search still in the 1s rest slot.`;
