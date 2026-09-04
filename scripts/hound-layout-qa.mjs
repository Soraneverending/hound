import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const url = process.argv[2] || "http://127.0.0.1:8080/";
const outDir = "/workspace/screenshots";
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const page = await context.newPage();
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(400);

async function snap(name) {
  const m = await page.evaluate(() => {
    const shell = document.querySelector(".app-shell");
    const search = document.querySelector("[data-hound-search]");
    const tabs = document.querySelector(".tab-bar");
    const brand = document.querySelector(".brand-row");
    const box = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const style = el instanceof HTMLElement ? getComputedStyle(el) : null;
      return {
        top: Math.round(r.top),
        bottom: Math.round(r.bottom),
        left: Math.round(r.left),
        display: style?.display,
      };
    };
    return {
      h: window.innerHeight,
      typing: document.documentElement.classList.contains("hound-typing"),
      searchFocus: document.documentElement.classList.contains("hound-search-focus"),
      transform: shell instanceof HTMLElement ? shell.style.transform : "",
      shellTop: shell ? Math.round(shell.getBoundingClientRect().top) : null,
      search: box(search),
      tabs: box(tabs),
      brand: box(brand),
      text: document.body.innerText.replace(/\s+/g, " ").slice(0, 220),
    };
  });
  await page.screenshot({ path: `${outDir}/${name}.png` });
  return m;
}

const issues = [];
const rest = await snap("qa-rest");
if (rest.typing) issues.push("rest: typing class leftover");
if (rest.search.top < 40) issues.push(`rest: search too high ${rest.search.top}`);
if (rest.tabs.display === "none") issues.push("rest: tabs hidden");
if (rest.h - rest.tabs.bottom > 8) issues.push(`rest: gap under tabs ${rest.h - rest.tabs.bottom}`);
if (rest.brand.display === "none") issues.push("rest: brand hidden");

await page.locator("[data-hound-search]").click();
await page.waitForTimeout(150);
const focused = await snap("qa-focused");
// Chrome must stay visible — hiding brand/tabs caused the iOS jump (see GROK_HANDOFF.md).
if (focused.brand.display === "none") issues.push("focused: brand hidden");
if (focused.tabs.display === "none") issues.push("focused: tabs hidden");
if (focused.search.top < 40) issues.push(`focused: search jumped too high ${focused.search.top}`);
if (focused.shellTop !== 0 && Math.abs(focused.shellTop) > 2) issues.push(`focused: shell top ${focused.shellTop}`);

await page.fill("[data-hound-search]", "rasin bran");
await page.waitForTimeout(250);
const typed = await snap("qa-typed");
if (!/Raisin Bran/i.test(typed.text)) issues.push("typed: no Raisin Bran suggestion");

await page.setViewportSize({ width: 390, height: 520 });
await page.waitForTimeout(150);
const kb = await snap("qa-keyboard");
if (kb.search.top > 24) issues.push(`keyboard: search drifted ${kb.search.top}`);
if (kb.shellTop !== 0 && Math.abs(kb.shellTop) > 2) issues.push(`keyboard: shell top ${kb.shellTop}`);

await page.setViewportSize({ width: 390, height: 844 });
await page.locator("[data-hound-search]").evaluate((el) => el.blur());
await page.waitForTimeout(250);
const after = await snap("qa-after-blur");
if (after.typing) issues.push("blur: typing class stuck");
 if (after.searchFocus) issues.push("blur: search-focus class stuck");
if (after.tabs.display === "none") issues.push("blur: tabs still hidden");
if (after.h - after.tabs.bottom > 8) issues.push(`blur: gap under tabs ${after.h - after.tabs.bottom}`);
if (after.search.top < 40) issues.push(`blur: search too high ${after.search.top}`);

await page.fill("[data-hound-search]", "rasin bran");
await page.keyboard.press("Enter");
await page.waitForTimeout(1000);
const hunted = await snap("qa-hunted");
if (!/Raisin Bran/i.test(hunted.text)) issues.push("hunt: not Raisin Bran");
if (!/Grocer|Vons|Stater/i.test(hunted.text)) issues.push("hunt: not grocery stores");
if (hunted.typing) issues.push("hunt: still typing");
if (hunted.h - hunted.tabs.bottom > 8) issues.push(`hunt: gap under tabs ${hunted.h - hunted.tabs.bottom}`);

console.log(JSON.stringify({ rest, focused, typed, kb, after, hunted, issues }, null, 2));
await browser.close();
if (issues.length) process.exitCode = 1;
