// Captures de la série d : node capturer.mjs [sbd1 …]
// captures/<id>-premier-ecran.png (390 × 844), <id>-page.png (page entière), <id>-wp.png (le même Nugget en
// whirlpool, ?cas=wp), <id>-dry.png (dry hop, si la page le porte), <id>-choix.png (un autre remplaçant touché),
// <id>-fiche.png (appui long). Erreurs de page relevées.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';
import { LOT } from './socle.mjs';
const ids = process.argv.slice(2).length ? process.argv.slice(2) : ['sbd1', 'sbd2', 'sbd3', 'sbd4', 'sbd5', 'sbd6', 'sbd7', 'sbd8'];
const out = path.join(LOT, 'captures');
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
for (const id of ids) {
  const f = path.join(LOT, id, 'etat.html'); if (!fs.existsSync(f)) continue;
  const url = pathToFileURL(f).href;
  const page = await browser.newPage();
  const err = []; page.on('pageerror', (e) => err.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') err.push(m.text()); });
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const go = async (u) => { await page.goto(u, { waitUntil: 'networkidle0' }); await wait(450); };
  await go(url); await page.screenshot({ path: path.join(out, id + '-premier-ecran.png') });
  await page.screenshot({ path: path.join(out, id + '-page.png'), fullPage: true });
  for (const c of ['wp', 'dry']) { await go(url + '?cas=' + c); if (await page.$('html[data-cas="' + c + '"] main')) await page.screenshot({ path: path.join(out, id + '-' + c + '.png') }); }
  await go(url);
  const autre = await page.$$('[data-libre="houblon"] [data-choix][aria-checked="false"]');
  if (autre.length) { await autre[0].tap(); await wait(400); await page.screenshot({ path: path.join(out, id + '-choix.png') }); }
  await go(url);
  const hs = await page.$$('[data-houblon]'); let h = null;
  for (const x of hs) { if (await x.evaluate((e) => { const r = e.getBoundingClientRect(); return r.height > 0 && r.top > 0 && r.bottom < innerHeight; })) { h = x; break; } }
  if (h) { const t = await h.touchStart(); await wait(700); await t.end(); await wait(400); await page.screenshot({ path: path.join(out, id + '-fiche.png') }); }
  console.log(id + (err.length ? ' · ERREURS : ' + err.join(' | ') : ' · 0 erreur'));
  await page.close();
}
await browser.close();
