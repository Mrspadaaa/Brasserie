// Browser-only regression for the water ratio control; no remote API calls.
import puppeteer from "puppeteer-core";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const origin = process.env.WATER_PREVIEW_URL ?? "http://127.0.0.1:3008";
const output = resolve(".codex-remote-attachments/water-ratio-slider");
const fixture = resolve(".codex-remote-attachments/ratio-slider-fixture");
await Promise.all([mkdir(output, { recursive: true }), mkdir(fixture, { recursive: true })]);
await writeFile(resolve(fixture, "index.html"), `<!doctype html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Vérification du rapport sulfate / chlorure</title></head>
<body><div id="root"></div><script type="module" src="./fixture.tsx"></script></body></html>`);
await writeFile(resolve(fixture, "fixture.tsx"), `import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { RatioSlider } from "/src/ui/RatioSlider.tsx";
import "/src/index.css";
const cases = [
  { id: "ttt", title: "Ttt — 75,9 ppm SO₄ / 93,6 ppm Cl", so4: 75.9, cl: 93.6, ratio: 0.7, following: true },
  { id: "manual", title: "Doses manuelles — vérifier 0,91", so4: 93, cl: 100, ratio: 0.7, following: false },
  { id: "empty", title: "Aucun sulfate ni chlorure", so4: 0, cl: 0, ratio: 0.7, following: true },
  { id: "no-chloride", title: "Sulfate sans chlorure", so4: 80, cl: 0, ratio: Infinity, following: true },
  { id: "low", title: "SO₄ / Cl faibles, calcium à 200 ppm", so4: 10, cl: 10, ratio: 1, following: true },
];
function Case({ config }) {
  const [requested, setRequested] = useState(config.ratio);
  const [so4, setSo4] = useState(config.so4);
  const [following, setFollowing] = useState(config.following);
  return <section data-case={config.id} style={{ marginBottom: 24 }}>
    <h2 style={{ margin: "0 0 8px", fontSize: 14, color: "#d5cbbd" }}>{config.title}</h2>
    {config.id === "manual" && <button type="button" data-set-manual onClick={() => { setSo4(91); setFollowing(false); }} style={{ minHeight: 44, marginBottom: 8, padding: "0 12px", border: "1px solid #625644", borderRadius: 8 }}>Doses manuelles : 0,91</button>}
    <RatioSlider value={requested} followingTarget={following}
      ions={{ ca: 200, mg: 14, na: 8, so4, cl: config.cl, hco3: 250 }}
      target={{ min: 0.4, max: 0.9 }}
      onChange={ratio => { setRequested(ratio); setFollowing(true); }} />
  </section>;
}
createRoot(document.getElementById("root")).render(<main style={{ maxWidth: 640, margin: "auto", padding: 12 }}>
  <h1 style={{ fontSize: 19, margin: "0 0 20px" }}>Rapport sulfate / chlorure</h1>
  {cases.map(config => <Case key={config.id} config={config} />)}
</main>);
`);

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: ["--mute-audio"],
});
const report = [];
const share = ratio => 100 * ratio / (1 + ratio);
const rangeSelector = 'input[name="ratio_slider_range"]';
// The app's reduced-motion stylesheet leaves a 0.01 ms transition on all
// elements. Read positions after painting, not during that transient frame.
const painted = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));

async function openPage(width) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 844, isMobile: width < 768, hasTouch: true });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.setRequestInterception(true);
  page.on("request", request => {
    const url = new URL(request.url());
    return url.origin === origin || ["fonts.googleapis.com", "fonts.gstatic.com"].includes(url.hostname)
      ? request.continue()
      : request.abort();
  });
  return { page, errors };
}

async function inspect(page, scope) {
  return page.$eval(scope, element => {
    const range = element.querySelector('input[name="ratio_slider_range"]');
    const marker = element.querySelector("[data-ratio-obtained]");
    const tick = element.querySelector('[data-ratio-tick="1"]');
    const bounds = range.getBoundingClientRect();
    const markerBounds = marker?.getBoundingClientRect();
    const tickBounds = tick?.getBoundingClientRect();
    return {
      text: element.textContent,
      ratio: range.getAttribute("data-ratio"),
      value: Number(range.value),
      max: Number(range.max),
      step: range.step,
      valueText: range.getAttribute("aria-valuetext"),
      range: { left: bounds.left, right: bounds.right, width: bounds.width, height: bounds.height },
      obtained: marker?.getAttribute("data-ratio") ?? null,
      markerCenter: markerBounds ? markerBounds.left + markerBounds.width / 2 : null,
      markerStyle: marker?.getAttribute("style"),
      markerParent: marker ? { left: marker.parentElement.getBoundingClientRect().left, width: marker.parentElement.getBoundingClientRect().width } : null,
      tickCenter: tickBounds ? tickBounds.left + tickBounds.width / 2 : null,
    };
  });
}

async function accessibleSlider(page, selector) {
  const session = await page.createCDPSession();
  try {
    const { root } = await session.send("DOM.getDocument");
    const { nodeId } = await session.send("DOM.querySelector", { nodeId: root.nodeId, selector });
    const { nodes } = await session.send("Accessibility.getPartialAXTree", { nodeId, fetchRelatives: false });
    const slider = nodes.find(node => node.role?.value === "slider");
    assert.ok(slider, "Le navigateur expose un slider accessible");
    return {
      name: slider.name?.value,
      value: slider.value?.value,
      valueText: slider.properties?.find(property => property.name === "valuetext")?.value?.value,
    };
  } finally {
    await session.detach();
  }
}

function checkLayout(result, width, description) {
  assert.ok(result.range.height >= 44, `${description} : cible tactile < 44 px à ${width}px`);
  assert.ok(result.range.left >= 0 && result.range.right <= width + 1, `${description} : piste débordante`);
  assert.equal(result.step, "any", `${description} : le navigateur ne doit pas arrondir les positions`);
  assert.equal(result.max, 9, `${description} : valeur native en rapport SO₄/Cl, pas en pourcentage`);
  assert.match(result.text, /Rapport sulfate \/ chlorure/, `${description} : titre explicite absent`);
  assert.doesNotMatch(result.valueText, /NaN|Infinity/, `${description} : lecture non finie inaccessible`);
  const expectedTick = result.range.left + 14 + (result.range.width - 28) * 50 / share(result.max);
  assert.ok(result.tickCenter !== null && Math.abs(result.tickCenter - expectedTick) <= 2,
    `${description} : le repère 1:1 ne correspond pas à la piste (attendu ${expectedTick}, obtenu ${result.tickCenter})`);
}

try {
  for (const width of [320, 390, 768]) {
    const { page, errors } = await openPage(width);
    await page.goto(`${origin}/.codex-remote-attachments/ratio-slider-fixture/index.html`, { waitUntil: "networkidle0" });
    await page.waitForSelector('[data-case="ttt"] [data-ratio-obtained]');
    await page.click("[data-set-manual]");
    await painted(page);
    const results = {};
    for (const name of ["ttt", "manual", "empty", "no-chloride", "low"]) {
      results[name] = await inspect(page, `[data-case="${name}"]`);
      checkLayout(results[name], width, name);
    }
    const tttActual = 75.9 / 93.6;
    const accessibility = await accessibleSlider(page, `[data-case="ttt"] ${rangeSelector}`);
    assert.equal(accessibility.name, "SO₄ ⇄ Cl");
    assert.ok(Math.abs(Number(accessibility.value) - 0.7) < 1e-6, "Le lecteur d’écran reçoit le rapport 0,7, pas sa position en pourcentage");
    assert.ok(Math.abs(Number(accessibility.valueText) - 0.7) < 1e-6, "Le texte de valeur natif contient lui aussi le rapport, sans pourcentage caché");
    assert.match(results.ttt.valueText, /Réglage 0,7 pour 1 ; Obtenu 0,81 pour 1/);
    assert.ok(Math.abs(Number(results.ttt.obtained) - tttActual) < 1e-10, "Ttt : quotient brut conservé");
    assert.equal(Number(results.ttt.ratio), 0.7, "Ttt : consigne indépendante du résultat");
    assert.equal(Number(results.manual.obtained), 0.91, "Le repère manuel ne doit pas devenir 0,90");
    assert.equal(results.manual.value, 0.91, "La valeur native manuelle ne doit pas être arrondie à 0,90");
    const expectedMarker = results.manual.range.left + 14 + (results.manual.range.width - 28) * share(0.91) / share(results.manual.max);
    assert.ok(Math.abs(results.manual.markerCenter - expectedMarker) <= 2, `Le repère obtenu doit représenter exactement 0,91 à ${width}px : ${JSON.stringify(results.manual)} attendu ${expectedMarker}`);
    assert.match(results.manual.text, /hors plage/i, "0,91 doit être signalé au-delà de 0,90");
    assert.equal(results.empty.obtained, null, "0/0 ne crée pas de repère de rapport obtenu");
    assert.match(results["no-chloride"].text, /sans chlorure/i);
    assert.doesNotMatch(results.low.text, /eau très peu minéralisée/i, "SO₄ / Cl faibles ne décrivent pas la minéralité totale");
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Fixture débordante à ${width}px`);
    assert.deepEqual(errors, [], `Erreurs JavaScript de fixture à ${width}px`);
    await page.screenshot({ path: resolve(output, `cases-${width}.png`), fullPage: true });
    if (width === 390) await (await page.$('[data-case="ttt"]')).screenshot({ path: resolve(output, "ttt-390.png") });

    // Native input changes from assistive technology remain a raw ratio.
    await page.$eval(`[data-case="ttt"] ${rangeSelector}`, (range, value) => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(range, String(value));
      range.dispatchEvent(new Event("input", { bubbles: true }));
    }, 1.2);
    const afterInput = await inspect(page, '[data-case="ttt"]');
    assert.equal(Number(afterInput.ratio), 1.2, "Le déplacement émet une consigne ratio, pas un pourcentage de sulfate");
    assert.ok(Math.abs(Number(afterInput.obtained) - tttActual) < 1e-10, "Déplacer ne fabrique pas un résultat atteint");
    // Mouse and touch gestures use the same nonlinear visual geometry.
    const input = await page.$(`[data-case="ttt"] ${rangeSelector}`);
    await input.evaluate(element => element.scrollIntoView({ block: "center" }));
    const bounds = await input.boundingBox();
    const xForRatio = ratio => bounds.x + 14 + (bounds.width - 28) * share(ratio) / share(9);
    const y = bounds.y + bounds.height / 2;
    await page.mouse.move(xForRatio(1.2), y);
    await page.mouse.down();
    await page.mouse.move(xForRatio(2.4), y, { steps: 4 });
    await page.mouse.up();
    await painted(page);
    const afterMouse = await inspect(page, '[data-case="ttt"]');
    assert.equal(Number(afterMouse.ratio), 2.4, "Le glissement souris suit la géométrie visuelle");
    const touch = await page.createCDPSession();
    await touch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: xForRatio(2.4), y }] });
    await touch.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: xForRatio(0.55), y }] });
    await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await painted(page);
    await touch.detach();
    const afterTouch = await inspect(page, '[data-case="ttt"]');
    assert.equal(Number(afterTouch.ratio), 0.55, "Le glissement tactile suit la même géométrie");
    assert.ok(Math.abs(Number(afterTouch.obtained) - tttActual) < 1e-10, "Le glissement ne remplace pas le calcul obtenu");
    const cancelledTouch = await page.createCDPSession();
    await cancelledTouch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: xForRatio(0.55), y }] });
    await cancelledTouch.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: xForRatio(1.5), y }] });
    await cancelledTouch.send("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
    await cancelledTouch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: xForRatio(0.55), y }] });
    await cancelledTouch.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: xForRatio(1.2), y }] });
    await cancelledTouch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await cancelledTouch.detach();
    await painted(page);
    const afterCancel = await inspect(page, '[data-case="ttt"]');
    assert.equal(Number(afterCancel.ratio), 1.2, "Une annulation tactile libère la capture pour le geste suivant");
    report.push({ width, fixture: results, accessibility, afterInput, afterMouse, afterTouch, afterCancel });
    await page.close();

    const workshop = await openPage(width);
    await workshop.page.goto(`${origin}/?preview=brew&view=eau`, { waitUntil: "networkidle0" });
    if (width < 768) {
      const tab = await workshop.page.evaluateHandle(() => [...document.querySelectorAll("button")].find(button => button.textContent.includes("2. Sels")));
      assert.ok(tab.asElement(), "Onglet Sels présent");
      await tab.asElement().click();
      await tab.dispose();
    }
    await workshop.page.waitForSelector(rangeSelector);
    await workshop.page.$eval(rangeSelector, range => range.scrollIntoView({ block: "center" }));
    assert.ok(await workshop.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Atelier débordant à ${width}px`);
    assert.ok(await workshop.page.$eval(rangeSelector, range => range.getBoundingClientRect().height >= 44), `Piste atelier trop petite à ${width}px`);
    assert.deepEqual(workshop.errors, [], `Erreurs JavaScript de l’atelier à ${width}px`);
    await workshop.page.screenshot({ path: resolve(output, `workshop-${width}.png`) });
    await workshop.page.close();
  }
  await writeFile(resolve(output, "report.json"), JSON.stringify(report, null, 2));
  console.log("✓ Slider sulfate / chlorure : Ttt, 0,91 manuel, absence d’ions, sans chlorure, faible SO₄/Cl ; 320/390/768 px sans débordement, positions exactes, contrôle tactile ≥44 px.");
} finally {
  await browser.close();
}
