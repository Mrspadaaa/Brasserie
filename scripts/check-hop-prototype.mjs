// Joue les gestes du prototype houblons (mission #119, phase 8) à 390 × 844 et 1280 × 800 :
// choisir, comparer 2 puis les 4 premiers, simuler (délai), remplacer, questions de la banque,
// changement de style. Compte les touchers, chronomètre, capture chaque état.
// Usage (racine du dépôt) : node scripts/check-hop-prototype.mjs [--out dossier]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import * as proto from './hop-one-tap/prototype.mjs';

const repo = process.cwd();
const puppeteer = createRequire(path.join(repo, 'package.json'))('puppeteer-core');
const i = process.argv.indexOf('--out');
const out = path.resolve(i > 0 ? process.argv[i + 1] : path.join(process.env.TEMP || '/tmp', 'hop-prototype'));
fs.mkdirSync(out, { recursive: true });
const ctx = proto.setup({ repo });
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const fails = [], report = {};
const check = (ok, msg) => { if (!ok) fails.push(msg); };

const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
await proto.open(page, { ctx });
let taps = 0;
const tap = async (sel) => { await page.click(sel); taps++; };
const shot = (n) => page.screenshot({ path: path.join(out, n + '.png') });
const overflow = () => page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
await shot('1-etape-390');

// Choisir : un toucher sur le premier houblon classé.
const first = await page.$eval('#app [role="list"] .row .nm', (e) => e.textContent.trim());
let t0 = Date.now();
await tap('#app [role="list"] .row .main');
await page.waitForFunction(() => document.querySelector('#app .strip .ibu')?.textContent !== '0');
report.choose = { first, taps, ms: Date.now() - t0, strip: await page.$eval('#app .strip', (e) => e.innerText.replace(/\s+/g, ' ')), line: await page.$eval('#app .add .line', (e) => e.innerText.replace(/\s+/g, ' ')) };
check(taps === 1, 'choisir : plus d’un toucher');
await shot('2-ajout-390');

// Simuler : moment 15′ puis + 1 g ; délai jusqu'à l'IBU mis à jour.
const before = await page.$eval('#app .add .line .ibu', (e) => e.textContent);
t0 = Date.now();
await page.click('#app .edit .mom[data-m="15"]');
await page.waitForFunction((b) => document.querySelector('#app .add .line .ibu')?.textContent !== b, {}, before);
const simMs = Date.now() - t0;
await page.click('#app .edit [data-act="plus"]');
report.simulate = { ms: simMs, after: await page.$eval('#app .add .line', (e) => e.innerText.replace(/\s+/g, ' ')) };
check(simMs < 1000, `simuler : ${simMs} ms`);
await page.click('#app .edit .mom[data-m="60"]');

// Comparer 2 houblons au choix : 2 cases.
taps = 0;
// Le rendu recrée les éléments : chaque toucher recherche sa cible.
const tapRow = async (n) => { const h = (await page.$$('#app [role="list"] .row .chk'))[n]; await h.click(); taps++; };
await tapRow(1);
await tapRow(2);
await page.waitForSelector('#app .cmp');
report.compare2 = { taps, cols: await page.$$eval('#app .cmp thead th', (t) => t.length - 1), text: await page.$eval('#app .cmp', (e) => e.innerText.replace(/\s+/g, ' ').slice(0, 300)), overflow: await page.$eval('#app .cmp .tb', (e) => e.scrollWidth > e.clientWidth + 1) };
check(report.compare2.taps <= 3 && report.compare2.cols === 2, 'comparer 2 : touchers ou colonnes');
check(!report.compare2.overflow, 'comparer 2 : défilement horizontal');
await shot('3-comparer-2-390');
await page.click('#app .cmp [data-act="clearsel"]');

// Comparer les 4 premiers : 1 toucher.
taps = 0;
await tap('#app [data-act="top4"]');
await page.waitForSelector('#app .cmp');
report.compare4 = { taps, cols: await page.$$eval('#app .cmp thead th', (t) => t.length - 1), overflow: await page.$eval('#app .cmp .tb', (e) => e.scrollWidth > e.clientWidth + 1) };
check(report.compare4.cols === 4 && !report.compare4.overflow, 'comparer 4 : colonnes ou défilement horizontal');
await shot('4-comparer-4-390');
await page.click('#app .cmp [data-act="all"]');
await shot('4b-comparer-4-tout-390');
await page.click('#app .cmp [data-act="clearsel"]');

// Remplacer : « Remplacer » puis le premier remplaçant (ligne ouverte après l'ajout).
taps = 0;
const repBtn = await page.$('#app .edit [data-act="rep"]');
if (!repBtn) await page.click('#app .add .line');
await tap('#app .edit [data-act="rep"]');
await page.waitForSelector('#app .sheet .cand');
report.replaceFirst = await page.$$eval('#app .sheet .cand', (c) => c.slice(0, 5).map((x) => x.innerText.replace(/\s+/g, ' ')));
await shot('5-remplacer-390');
await tap('#app .sheet .cand');
report.replace = { taps, line: await page.$eval('#app .add .line', (e) => e.innerText.replace(/\s+/g, ' ')), snack: await page.$eval('#app .snack', (e) => e.innerText).catch(() => null) };
check(taps === 2, 'remplacer : plus de 2 touchers');
await shot('6-remplace-390');

// Questions de la banque : 30, chacune avec une réponse ou « Non documenté ».
await page.click('#app [data-act="questions"]');
await page.waitForSelector('#app .sheet .q');
report.questions = await page.$$eval('#app .sheet .q', (qs) => ({ n: qs.length, nd: qs.filter((q) => /Non documenté/.test(q.innerText)).length, empty: qs.filter((q) => !q.querySelector('.qa')?.textContent.trim()).length }));
check(report.questions.n === 30 && report.questions.empty === 0, 'questions : 30 réponses ou non documenté attendues');
await shot('7-questions-390');
await page.click('#app .sheet [data-act="close"]');

// Changement de style : NEIPA ; le classement change.
await page.click('#app [data-act="style"]');
await page.waitForSelector('#app .sheet .styl');
await shot('8-style-390');
await page.click('#app .sheet [data-s="neipa"]');
await page.click('#app .sheet [data-act="close"]');
report.neipaFirst = await page.$$eval('#app [role="list"] .row .nm', (r) => r.slice(0, 3).map((x) => x.textContent.trim()));
await shot('9-neipa-390');
report.numberInputs = await page.$$eval('input[type=number]', (x) => x.length);
report.overflow390 = await overflow();
check(!report.numberInputs, 'type=number présent');
check(!report.overflow390, 'défilement horizontal à 390');

// Bureau 1280 × 800.
// Le passage au bureau recharge la page (mode mobile désactivé) : on rejoue un ajout et une comparaison.
await page.setViewport({ width: 1280, height: 800 });
await page.waitForSelector('#app [role="list"] .row');
await page.click('#app [role="list"] .row .main');
await page.click('#app [data-act="top4"]');
await shot('10-bureau-1280');
report.overflow1280 = await overflow();
check(!report.overflow1280, 'défilement horizontal à 1280');
report.errors = errors;
check(!errors.length, 'erreurs : ' + errors.join(' | '));
await browser.close();
proto.teardown(ctx);
fs.writeFileSync(path.join(out, 'rapport.json'), JSON.stringify({ report, fails }, null, 2));
console.log(JSON.stringify(report, null, 1));
console.log(fails.length ? 'PROTOTYPE FAIL ' + fails.join(' ; ') : `PROTOTYPE OK choisir 1 toucher, simuler ${report.simulate.ms} ms, comparer 2 en ${report.compare2.taps} touchers, 4 premiers en 1, remplacer en 2, ${report.questions.n} questions (${report.questions.nd} non documentées) ; captures ${out}`);
process.exitCode = fails.length ? 1 : 0;
