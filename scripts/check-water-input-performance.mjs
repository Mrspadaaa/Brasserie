// Real input-to-paint measurements. Run before/after with WATER_PERF_LABEL and CPU_RATE=4.
// Fixtures and CPU profiles stay in the ignored attachments directory; no saved recipe is changed.
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const origin = process.env.WATER_PREVIEW_URL ?? 'http://127.0.0.1:3008';
const rate = Number(process.env.CPU_RATE ?? 4);
const label = process.env.WATER_PERF_LABEL ?? 'current';
const output = resolve('.codex-remote-attachments/water-input-performance', label);
const fixture = resolve('.codex-remote-attachments/water-input-performance-fixture');
await Promise.all([mkdir(output, { recursive: true }), mkdir(fixture, { recursive: true })]);
await writeFile(resolve(fixture, 'index.html'), '<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body><div id="root"></div><script type="module" src="./fixture.tsx"></script></body></html>');
await writeFile(resolve(fixture, 'fixture.tsx'), `import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { SaltSolver, type WaterState } from '/src/ui/SaltSolver.tsx';
import { BrewWizard } from '/src/pages/BrewWizard.tsx';
import { DEFAULT_WATER_SOURCE } from '/src/domain/water/index.ts';
import { defaultConfig } from '/src/services/storage.ts';
import { monSuperStout } from '/tests/fixtures/monSuperStout.ts';
import '/src/index.css';
const params = new URLSearchParams(location.search);
const autoTreatment = params.get('auto') === 'true';
const grains = [{ name: 'Pilsner Malz', kind: 'grain', use: 'empatage', weightKg: 2.2, colorEbc: 3.5 }];
const initial: WaterState = { styleCode: '20C', autoTreatment, diRatioPct: 20, spargeDiRatioPct: 20,
  mashWaterL: 10.8, spargeWaterL: 21.5, allSaltsInMash: true,
  doses: { gypse: 2.6, cacl2: 2.1, nacl: .5, kcl: 3 }, disabled: [], acidId: 'lactique', acidOverride: { mash: 0, sparge: 6.2 } };
const recipe = { ...structuredClone(monSuperStout), name: 'Ttt', volumeL: 24, boilMin: 95,
  fermentables: grains, totalGristKg: 2.2, hops: [],
  mash: { ...monSuperStout.mash, ratioLPerKg: 10.8 / 2.2 },
  waterPlan: { ...monSuperStout.waterPlan, sourceSnapshot: DEFAULT_WATER_SOURCE, autoTreatment, targetProfileId: '20C',
    mashWaterL: 10.8, spargeWaterL: 21.5, diRatioPct: 20, spargeDiRatioPct: 20,
    mash: initial.doses, sparge: {}, acid: { id: 'lactique', mash: 0, sparge: 6.2 }, acidOverride: initial.acidOverride,
    startIons: undefined, wortIons: undefined } };
function Preview() {
  const [state, setState] = useState(initial);
  if (params.get('view') === 'wizard') return <BrewWizard seed={{ recipe }} config={defaultConfig} stockItems={[]}
    knownStyles={['Imperial stout']} onSave={()=>{}} onClose={()=>{}} onCreateStockItem={()=>{}} onSaveWaterSource={()=>{}} />;
  return <main className="mx-auto max-w-3xl px-3 py-4 bg-cave-950 text-cave-50"><SaltSolver state={state}
    onChange={setState} source={DEFAULT_WATER_SOURCE} onSourceChange={()=>{}} beerEbc={3.6} beerVolumeL={24}
    noSparge={false} onNoSpargeChange={()=>{}} brew={{ style: 'Imperial stout', totalGristKg: 2.2, grist: grains, targetPh: 5.4 }} /></main>;
}
createRoot(document.getElementById('root')!).render(<Preview />);`);

const inputSelector = 'input[aria-label^="Dose d’"][aria-label*="au rinçage"]';
const paint = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const report = { label, commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), cpuRate: rate, createdAt: new Date().toISOString(), cases: [] };
function summary(values) {
  const sorted = values.toSorted((a,b) => a-b);
  return { count: sorted.length, medianMs: Math.round(sorted[Math.floor(sorted.length / 2)] ?? 0), maxMs: Math.round(sorted.at(-1) ?? 0) };
}
async function checkReadings(page, amount) {
  const actual = await page.evaluate(selector => {
    const ppm = label => Number(document.querySelector(`[aria-label="${label}"]`).textContent.match(/([\d,]+) ppm/)[1].replace(',', '.'));
    return {
      dose: Number(document.querySelector(selector).value.replace(',', '.')),
      mashDose: Number(document.querySelector('input[aria-label^="Dose d’"][aria-label*="à l’empâtage"]').value.replace(',', '.')),
      mash: ppm('HCO₃ après acide — empâtage'), sparge: ppm('HCO₃ après acide — rinçage'),
      total: ppm('HCO₃ après acide — moyenne du graphique'),
      saltCount: document.querySelector('.water-salt-grid').children.length,
    };
  }, inputSelector);
  assert.equal(actual.dose, amount, 'The exact manual sparge dose is retained');
  assert.equal(actual.mashDose, 0, 'The retained manual mash zero stays zero');
  const expectedSparge = Math.max(0, 200 - amount * 600 / 21.5);
  assert.ok(Math.abs(actual.sparge - expectedSparge) <= .06, `Immediate sparge HCO3: ${actual.sparge} vs ${expectedSparge}`);
  const expectedTotal = (actual.mash * 10.8 + expectedSparge * 21.5) / 32.3;
  assert.ok(Math.abs(actual.total - expectedTotal) <= .11, `Immediate weighted HCO3: ${actual.total} vs ${expectedTotal}`);
  assert.equal(actual.saltCount, 9, 'All nine salt controls remain present');
  return actual;
}
function summarizeProfile(profile) {
  const nodes = new Map(profile.nodes.map(node => [node.id, node]));
  const parents = new Map(profile.nodes.flatMap(node => (node.children ?? []).map(id => [id, node.id])));
  const self = new Map(), inclusive = new Map();
  const key = node => `${node.callFrame.functionName || '(anonymous)'} — ${node.callFrame.url.replace(origin, '').split('?')[0]}:${node.callFrame.lineNumber + 1}`;
  for (let i = 0; i < profile.samples.length; i++) {
    let id = profile.samples[i]; const ms = (profile.timeDeltas[i] ?? 0) / 1000;
    const own = key(nodes.get(id)); self.set(own, (self.get(own) ?? 0) + ms);
    const seen = new Set();
    while (id) { const name = key(nodes.get(id)); if (!seen.has(name)) inclusive.set(name, (inclusive.get(name) ?? 0) + ms); seen.add(name); id = parents.get(id); }
  }
  const top = map => [...map].filter(([name]) => name.includes('/src/')).toSorted((a,b) => b[1]-a[1]).slice(0, 18).map(([name, ms]) => ({ name, ms: Math.round(ms) }));
  return { self: top(self), inclusive: top(inclusive) };
}
try {
  for (const view of ['standalone', 'wizard']) for (const auto of [false, true]) {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.evaluateOnNewDocument(() => {
      const NativeWorker = window.Worker;
      const serialize = value => JSON.stringify(value, (_key, item) => typeof item === 'number' && !Number.isFinite(item) ? { $number: String(item) } : item);
      window.__waterWorkerTraffic = { requests: [], responses: [] };
      window.Worker = class extends NativeWorker {
        constructor(url, options) {
          super(url, options);
          this.isWaterAnalysis = String(url).includes('waterAnalysis.worker');
          if (this.isWaterAnalysis) this.addEventListener('message', event => window.__waterWorkerTraffic.responses.push(serialize(event.data)));
        }
        postMessage(message, options) {
          if (this.isWaterAnalysis) window.__waterWorkerTraffic.requests.push(serialize(message));
          super.postMessage(message, options);
        }
      };
    });
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    const client = await page.createCDPSession();
    await client.send('Network.enable');
    // Fetch interception can leave module-worker imports paused in Puppeteer.
    // Block external HTTPS directly, without pausing the local worker request.
    await client.send('Network.setBlockedURLs', { urls: ['https://*'] });
    await page.goto(`${origin}/.codex-remote-attachments/water-input-performance-fixture/index.html?view=${view}&auto=${auto}`, { waitUntil: 'networkidle0' });
    assert.deepEqual(errors, [], `${view}: initial runtime errors`);
    if (view === 'wizard') await page.evaluate(() => [...document.querySelectorAll('nav[aria-label="Étapes"] button')].find(button => button.textContent.includes('Eau')).click());
    await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent.includes('2. Sels')).click());
    await page.waitForSelector(inputSelector, { visible: true });
    if (await page.evaluate(() => window.__waterWorkerTraffic.requests.length > 0)) {
      await page.waitForFunction(() => window.__waterWorkerTraffic.responses.some(value => JSON.parse(value).kind === 'result'), { timeout: 10000 });
    }
    await client.send('Emulation.setCPUThrottlingRate', { rate });
    await page.evaluate(selector => {
      window.__waterInputPerf = { events: [], longTasks: [] };
      new PerformanceObserver(list => { for (const entry of list.getEntries()) window.__waterInputPerf.longTasks.push({ start: entry.startTime, duration: entry.duration }); }).observe({ type: 'longtask', buffered: false });
      for (const type of ['input', 'click']) document.addEventListener(type, event => {
        const target = event.target instanceof Element ? event.target : null;
        const input = target?.matches(selector);
        const button = target?.closest('button[aria-label$="— rinçage"]');
        if ((type === 'input' && input) || (type === 'click' && button)) {
          const entry = { type, value: input ? target.value : button.getAttribute('aria-label'), start: performance.now(), completed: false };
          window.__waterInputPerf.events.push(entry);
          requestAnimationFrame(() => requestAnimationFrame(() => {
            entry.paintMs = performance.now() - entry.start; entry.completed = true;
            entry.reading = document.querySelector('[aria-label="HCO₃ après acide — rinçage"]')?.textContent;
          }));
        }
      }, true);
    }, inputSelector);
    await client.send('Profiler.enable'); await client.send('Profiler.setSamplingInterval', { interval: 1000 }); await client.send('Profiler.start');
    const readings = [];
    for (const value of ['5,2', '6,2', '5,7']) {
      await page.click(inputSelector); await page.keyboard.down('Control'); await page.keyboard.press('A'); await page.keyboard.up('Control');
      for (const character of value) { await page.keyboard.type(character); await paint(page); }
      await page.keyboard.press('Tab'); await paint(page);
      readings.push(await checkReadings(page, Number(value.replace(',', '.'))));
    }
    for (const action of ['Ajouter', 'Retirer', 'Ajouter', 'Retirer']) {
      await page.click(`button[aria-label="${action} 0.5 mL — rinçage"]`); await paint(page);
      readings.push(await checkReadings(page, action === 'Ajouter' ? 6.2 : 5.7));
    }
    const { profile } = await client.send('Profiler.stop');
    const measured = await page.evaluate(() => window.__waterInputPerf);
    const workerTraffic = await page.evaluate(() => window.__waterWorkerTraffic);
    assert.ok(measured.events.every(event => event.completed), 'All input events painted');
    assert.deepEqual(errors, [], `${view}: runtime errors`);
    const key = `${view}-${auto ? 'auto' : 'manual'}`;
    await writeFile(resolve(output, `${key}.cpuprofile`), JSON.stringify(profile));
    if (workerTraffic.requests.length) {
      await writeFile(resolve(output, `${key}-worker-traffic.json`), JSON.stringify({
        note: 'Non-finite numbers use {$number:"Infinity"|"-Infinity"|"NaN"}; revive before worker.postMessage.',
        requests: workerTraffic.requests.map(JSON.parse), responses: workerTraffic.responses.map(JSON.parse),
      }, null, 2));
    }
    const result = { view, autoTreatment: auto, input: summary(measured.events.filter(e => e.type === 'input').map(e => e.paintMs)), stepper: summary(measured.events.filter(e => e.type === 'click').map(e => e.paintMs)), longTaskStats: summary(measured.longTasks.map(task => task.duration)), profile: summarizeProfile(profile), ...measured, readings, errors };
    report.cases.push(result);
    await writeFile(resolve(output, 'report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ view, auto, input: result.input, stepper: result.stepper, longTasks: result.longTaskStats, dominant: result.profile.inclusive.slice(0, 5) }));
    await page.close();
  }
} finally { await browser.close(); }
console.log(`Report: ${resolve(output, 'report.json')}`);
