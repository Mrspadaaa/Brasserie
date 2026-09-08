// Local browser regression for the bicarbonate balance and retained acid doses.
import puppeteer from "puppeteer-core";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const origin = "http://127.0.0.1:3008";
const output = resolve(".codex-remote-attachments/water-bicarbonate");
const fixture = resolve(".codex-remote-attachments/bicarbonate-fixture");
await Promise.all([mkdir(output, { recursive: true }), mkdir(fixture, { recursive: true })]);
await writeFile(resolve(fixture, "index.html"), `<!doctype html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Bilan du bicarbonate — cas de la photo</title></head>
<body><div id="root"></div><script type="module" src="./fixture.tsx"></script></body></html>`);
await writeFile(resolve(fixture, "fixture.tsx"), `import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { SaltSolver, type WaterState } from "/src/ui/SaltSolver.tsx";
import { DEFAULT_WATER_SOURCE } from "/src/domain/water/index.ts";
import "/src/index.css";
function Preview() {
  const [state, setState] = useState<WaterState>({
    styleCode: "20C", diRatioPct: 20, spargeDiRatioPct: 20,
    mashWaterL: 10.8, spargeWaterL: 21.5, allSaltsInMash: true,
    doses: { gypse: 2.6, cacl2: 2.1, nacl: 0.5, kcl: 3 },
    disabled: [], acidId: "lactique", acidOverride: { mash: 0, sparge: 6.2 }
  });
  return <main className="mx-auto max-w-3xl px-3 py-4 bg-cave-950 text-cave-50">
    <h1 className="text-xl font-bold mb-4">Ttt · bilan des deux eaux</h1>
    <SaltSolver state={state} onChange={setState} source={DEFAULT_WATER_SOURCE} onSourceChange={() => {}}
      beerEbc={3.6} beerVolumeL={24} noSparge={false} onNoSpargeChange={() => {}}
      brew={{ style: "Imperial stout", targetPh: 5.4, totalGristKg: 2.2,
        grist: [{ name: "Pilsner Malz", kind: "grain", use: "empatage", weightKg: 2.2, colorEbc: 3.5 }],
        hops: [{ weightG: 14, stage: "boil", timeMin: 95 }], og: 1.021, ibu: 12 }} />
  </main>;
}
createRoot(document.getElementById("root")!).render(<Preview />);
`);

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: ["--mute-audio"],
});
const balanceSelector = 'section[aria-label="Bilan du bicarbonate des eaux"]';
const acidMeanSelector = '[aria-label="HCO₃ après acide — moyenne du graphique"]';
const spargeAcidSelector = 'input[aria-label^="Dose d’"][aria-label*="au rinçage"]';
const mashAcidSelector = 'input[aria-label^="Dose d’"][aria-label*="à l’empâtage"]';
const report = [];
const painted = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));

async function clickButton(page, name) {
  const element = await page.evaluateHandle(name => [...document.querySelectorAll('button')]
    .find(button => button.getAttribute('aria-label') === name || button.textContent.trim() === name), name);
  assert.ok(element.asElement(), `Bouton absent : ${name}`);
  await element.asElement().evaluate(button => button.scrollIntoView({ block: 'center' }));
  await element.asElement().click();
  await element.dispose();
  await painted(page);
}

async function checkDosedProfile(page, width, manual) {
  await page.goto(`${origin}/.codex-remote-attachments/bicarbonate-fixture/index.html`, { waitUntil: 'networkidle0' });
  await step(page, width, '2. Sels');
  const statusSelector = '[aria-label="Bilan des objectifs de l’eau"]';
  assert.match(await page.$eval(statusSelector, element => element.textContent), /Profil non atteint : 5\/6/);
  if (!manual) await clickButton(page, 'Revenir aux doses d’acide calculées');
  const before = performance.now();
  await clickButton(page, 'Proposer les doses');
  const doseMs = Math.round(performance.now() - before);
  await page.waitForFunction(selector => document.querySelector(selector).textContent.includes('Profil atteint : 6/6'), {}, statusSelector);
  const result = await page.evaluate(({ statusSelector, mashAcidSelector, spargeAcidSelector }) => ({
    status: document.querySelector(`${statusSelector} p`).textContent.trim(),
    radar: document.querySelector('svg[role="img"][aria-label^="Profil ionique"]').getAttribute('aria-label'),
    mashAcid: document.querySelector(mashAcidSelector).value,
    spargeAcid: document.querySelector(spargeAcidSelector).value,
    grams: [...document.querySelectorAll('input[aria-label^="Dose de "]')].map(input => ({ product: input.getAttribute('aria-label'), value: input.value })),
  }), { statusSelector, mashAcidSelector, spargeAcidSelector });
  const numbers = [...result.radar.matchAll(/\) (\d+(?:,\d+)?) ppm pour (\d+(?:,\d+)?) à (\d+(?:,\d+)?)/g)];
  assert.equal(numbers.length, 6, 'Le radar doit exposer les six ions et leurs bornes');
  for (const [reading, value, min, max] of numbers) {
    const number = value => Number(value.replace(',', '.'));
    assert.ok(number(value) >= number(min) && number(value) <= number(max), `Hors profil après Doser : ${reading}`);
  }
  const bicarbonate = Number(result.radar.match(/Alcalinité \([^)]+\) ([\d,]+) ppm/)[1].replace(',', '.'));
  assert.ok(bicarbonate >= 120 && bicarbonate <= 125,
    `La maische Pilsner ne justifie pas de dépasser le minimum 120 du profil Stout : ${bicarbonate}`);
  if (manual) {
    assert.equal(result.mashAcid, '0');
    assert.equal(result.spargeAcid, '6,2');
  }
  await checkLayout(page, width);
  await (await page.$(statusSelector)).screenshot({ path: resolve(output, `profile-${manual ? 'manual' : 'auto'}-${width}.png`) });
  await clickButton(page, 'Proposer les doses');
  assert.equal(await page.$eval('svg[role="img"][aria-label^="Profil ionique"]', element => element.getAttribute('aria-label')), result.radar, 'Doser doit être idempotent');
  return { manual, doseMs, ...result };
}

async function step(page, width, text) {
  if (width >= 768) return;
  const button = await page.evaluateHandle(text => [...document.querySelectorAll("button")]
    .find(button => button.textContent.includes(text)), text);
  assert.ok(button.asElement(), `Onglet mobile absent : ${text}`);
  await button.asElement().click();
  await button.dispose();
  await painted(page);
}

async function typeValue(page, selector, value) {
  const input = await page.waitForSelector(selector, { visible: true });
  await input.evaluate(element => element.scrollIntoView({ block: "center" }));
  await input.click();
  await page.keyboard.down("Control");
  await page.keyboard.press("A");
  await page.keyboard.up("Control");
  await page.keyboard.type(value);
  await page.keyboard.press("Tab");
  await painted(page);
}

async function balance(page, expected) {
  await page.waitForFunction(({ selector, expected }) => {
    const readings = [...document.querySelectorAll(`${selector} dl dd`)].map(node => node.textContent.trim());
    return JSON.stringify(readings) === JSON.stringify(expected);
  }, {}, { selector: balanceSelector, expected });
  return page.$eval(balanceSelector, section => ({
    readings: [...section.querySelectorAll("dl > div")].map(row => ({
      label: row.querySelector("dt").textContent.trim(),
      value: row.querySelector("dd").textContent.trim(),
    })),
    detailRows: [...section.querySelectorAll("tbody tr")].map(row => [...row.children].map(cell => cell.textContent.trim())),
    summaryHeight: section.querySelector("summary").getBoundingClientRect().height,
  }));
}

async function checkLayout(page, width) {
  const layout = await page.evaluate(({ balanceSelector, spargeAcidSelector, mashAcidSelector }) => ({
    documentWidth: document.documentElement.scrollWidth,
    overflows: [...document.querySelectorAll(`${balanceSelector} *`)]
      .filter(element => {
        const rect = element.getBoundingClientRect();
        return rect.width > 1 && (rect.left < -1 || rect.right > innerWidth + 1);
      })
      .map(element => element.tagName),
    acidInputs: [mashAcidSelector, spargeAcidSelector].map(selector => {
      const rect = document.querySelector(selector).getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    }),
  }), { balanceSelector, spargeAcidSelector, mashAcidSelector });
  assert.ok(layout.documentWidth <= width + 1, `Débordement horizontal à ${width}px`);
  assert.deepEqual(layout.overflows, [], `Bilan HCO₃ débordant à ${width}px`);
  assert.ok(layout.acidInputs.every(rect => rect.height >= 44 && rect.width >= 44), `Champ acide trop petit à ${width}px`);
  return layout;
}

async function acidScreenshot(page, filename) {
  const card = await page.evaluateHandle(selector => document.querySelector(selector).closest('[data-water-acids]'), acidMeanSelector);
  await card.asElement().screenshot({ path: resolve(output, filename) });
  await card.dispose();
}

try {
  for (const width of [320, 390, 768]) {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.setViewport({ width, height: 844, isMobile: width < 768, hasTouch: true });
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await page.setRequestInterception(true);
    page.on("request", request => new URL(request.url()).origin === origin ? request.continue() : request.abort());
    await page.goto(`${origin}/.codex-remote-attachments/bicarbonate-fixture/index.html`, { waitUntil: "networkidle0" });
    await page.waitForSelector(balanceSelector);
    await step(page, width, "2. Sels");
    const photo = await balance(page, ["200 ppm", "27 ppm", "84,8 ppm"]);
    const radar = await page.$eval('svg[role="img"][aria-label^="Profil ionique"]', element => ({
      accessible: element.getAttribute("aria-label"),
      text: element.textContent,
    }));
    assert.match(radar.accessible, /84,8 ppm/, "Le radar et le bilan annoncent le même bicarbonate au dixième");
    assert.match(radar.text, /84,8/, "La valeur visible du radar correspond au bilan");
    assert.deepEqual(photo.detailRows, [
      ["Après dilution", "200", "200"],
      ["Après sels", "200", "200"],
      ["Dose d’acide", "0 mL", "6,2 mL"],
      ["Après acide", "200", "27"],
    ]);
    assert.ok(photo.summaryHeight >= 44, `Résumé tactile < 44px à ${width}px`);
    await (await page.$(balanceSelector)).screenshot({ path: resolve(output, `balance-${width}.png`) });
    await page.click(`${balanceSelector} summary`);
    await painted(page);
    await (await page.$(balanceSelector)).screenshot({ path: resolve(output, `details-${width}.png`) });
    const layout = await checkLayout(page, width);
    await acidScreenshot(page, `acid-${width}.png`);

    // Real keyboard edits exercise the same retained manual dose as a user.
    await typeValue(page, spargeAcidSelector, "0");
    const zero = await balance(page, ["200 ppm", "200 ppm", "200 ppm"]);
    assert.match(await page.$eval(acidMeanSelector, node => node.textContent), /200 ppm/);
    await acidScreenshot(page, `acid-zero-${width}.png`);
    await typeValue(page, spargeAcidSelector, "6,2");
    await balance(page, ["200 ppm", "27 ppm", "84,8 ppm"]);

    // Set 17.2 L RO in 21.5 L sparge (80%), keeping mash at 20% RO.
    await step(page, width, "1. Eau");
    await typeValue(page, 'input[aria-label="Litres d’osmosée (Osmosée — rinçage)"]', "17,2");
    await step(page, width, "2. Sels");
    await typeValue(page, mashAcidSelector, "1");
    await typeValue(page, spargeAcidSelector, "0,5");
    const mixed = await balance(page, ["144,4 ppm", "36 ppm", "72,3 ppm"]);
    assert.deepEqual(mixed.detailRows[0], ["Après dilution", "200", "50"]);
    assert.deepEqual(mixed.detailRows[2], ["Dose d’acide", "1 mL", "0,5 mL"]);
    await (await page.$(balanceSelector)).screenshot({ path: resolve(output, `mixed-${width}.png`) });
    await checkLayout(page, width);
    const dosedProfiles = [];
    for (const manual of [true, false]) dosedProfiles.push(await checkDosedProfile(page, width, manual));
    assert.deepEqual(errors, [], `Erreur JavaScript à ${width}px`);
    report.push({ width, photo, radar, zero, mixed, dosedProfiles, layout, errors });
    await page.close();
  }
  await writeFile(resolve(output, "report.json"), JSON.stringify(report, null, 2));
  console.log("✓ HCO₃ : photo 200/27/84,8 ppm, deux dilutions et deux acides ; Doser atteint les six plages en manuel et automatique. 320/390/768px sans débordement, contrôles ≥44px.");
} finally {
  await browser.close();
}
