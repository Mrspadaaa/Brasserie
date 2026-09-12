import puppeteer from "puppeteer-core";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const origin = process.env.WATER_PREVIEW_URL ?? "http://127.0.0.1:3008";
const out = resolve(".codex-remote-attachments/water-ui-review");
await mkdir(out, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: ["--mute-audio"],
});
const report = [];
try {
  for (const width of [320, 390, 768]) {
    const page = await browser.newPage();
    await page.setViewport({
      width,
      height: 844,
      isMobile: width < 768,
      hasTouch: true,
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      const url = new URL(request.url());
      return url.origin === origin ||
        ["fonts.googleapis.com", "fonts.gstatic.com"].includes(url.hostname)
        ? request.continue()
        : request.abort();
    });
    await page.goto(`${origin}/?preview=brew&view=eau`, {
      waitUntil: "networkidle0",
    });
    if (width < 768) {
      const button = await page.evaluateHandle(() =>
        [...document.querySelectorAll("button")].find((e) =>
          e.textContent.includes("2. Sels"),
        ),
      );
      if (button.asElement()) await button.asElement().click();
      await button.dispose();
    }
    await page.screenshot({
      path: resolve(out, `water-${width}.png`),
      fullPage: true,
    });
    const summary = await page.evaluateHandle(() =>
      [...document.querySelectorAll("table")].find((table) =>
        table.caption?.textContent?.includes("Doses à préparer"),
      ),
    );
    await summary.evaluate((table) =>
      table.scrollIntoView({ block: "center" }),
    );
    const summarySize = await summary.evaluate((table) => ({
      width: table.getBoundingClientRect().width,
      available: table.parentElement.getBoundingClientRect().width,
    }));
    assert.ok(
      summarySize.width <= summarySize.available + 1,
      `Tableau débordant à ${width}px`,
    );
    await page.screenshot({ path: resolve(out, `summary-${width}.png`) });
    const detailsButton = await page.$(
      'button[aria-label="Détail des minéraux de Gypse"]',
    );
    if (detailsButton) {
      await detailsButton.click();
      const section = await page.$(
        'section[aria-label="Détail des minéraux de Gypse"]',
      );
      await section.evaluate((e) => e.scrollIntoView({ block: "center" }));
      await page.screenshot({ path: resolve(out, `minerals-${width}.png`) });
    }
    const result = await page.evaluate(
      ({ width, errors }) => ({
        width,
        errors,
        documentWidth: document.documentElement.scrollWidth,
        overflows: [...document.querySelectorAll("main *")]
          .filter(
            (e) =>
              e.getBoundingClientRect().width &&
              (e.getBoundingClientRect().right > innerWidth + 1 ||
                e.getBoundingClientRect().left < -1),
          )
          .map((e) => ({
            tag: e.tagName,
            text: e.textContent.slice(0, 75),
            bounds: [
              Math.round(e.getBoundingClientRect().left),
              Math.round(e.getBoundingClientRect().right),
            ],
          }))
          .slice(0, 15),
        doses: [
          ...document.querySelectorAll('input[aria-label^="Dose de "]'),
        ].map((e) => ({
          name: e.getAttribute("aria-label"),
          width: Math.round(e.getBoundingClientRect().width),
          height: e.getBoundingClientRect().height,
        })),
        ratio: document
          .querySelector('input[name="ratio_slider_range"]')
          ?.getAttribute("aria-valuetext"),
      }),
      { width, errors },
    );
    assert.deepEqual(errors, [], `Erreur JavaScript à ${width}px`);
    assert.ok(
      result.documentWidth <= width + 1,
      `Débordement horizontal à ${width}px`,
    );
    assert.ok(
      result.doses.every((dose) => dose.height >= 44 && dose.width >= 44),
      `Champ trop petit à ${width}px`,
    );
    report.push(result);
    await page.close();
  }
  await writeFile(resolve(out, "report.json"), JSON.stringify(report, null, 2));
  console.log(
    "✓ Eau, sels, minéraux et fiche de pesée : 320/390/768 px, champs ≥44 px, aucun débordement ni erreur JavaScript.",
  );
} finally {
  await browser.close();
}
