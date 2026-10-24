// Joue les boosters d'une maquette et capture l'avant et l'après, pour prouver qu'ils marchent.
// Usage : node work/refonte-frontend/v4/tournoi/outils/jouer-boosters.mjs <dossier> [ids…]
// Convention auteur : l'élément qui déclenche un booster porte data-booster="nom court"
// (ex. data-booster="lentille radar"). Il doit réagir à un simple toucher : un booster à
// glisser a aussi une alternative au toucher (WCAG 2.5.7), c'est elle qu'on joue.
// Pour chaque page (index.html, etat-b.html…) et chaque booster : capture avant, toucher,
// capture après, et « change » = la page rendue a changé (pixels de l'écran comparés).
// Sortie : <dossier>/captures/boosters/<id>-<page>-<n>-avant.png / -apres.png et
// <dossier>/captures/boosters/<id>.json ; impression d'une ligne par maquette.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const dir = path.resolve(process.argv[2] || '.');
const only = process.argv.slice(3);
const out = path.join(dir, 'captures', 'boosters');
fs.mkdirSync(out, { recursive: true });
const ids = fs.readdirSync(dir)
  .filter((d) => /^p\d+$|^consolide$|^version-/.test(d) && fs.existsSync(path.join(dir, d, 'index.html')))
  .filter((d) => !only.length || only.includes(d))
  .sort();

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
for (const id of ids) {
  const pages = fs.readdirSync(path.join(dir, id)).filter((f) => f.endsWith('.html')).sort();
  const result = [];
  for (const file of pages) {
    const label = file.slice(0, -5);
    const probe = await browser.newPage();
    await probe.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    await probe.goto(pathToFileURL(path.join(dir, id, file)).href, { waitUntil: 'networkidle0', timeout: 30000 });
    const names = await probe.$$eval('[data-booster]', (els) => els.map((e) => e.getAttribute('data-booster')));
    await probe.close();
    for (let i = 0; i < names.length; i++) {
      // Page neuve pour chaque booster : chacun est joué depuis l'état de chargement.
      const page = await browser.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(String(e.message || e)));
      await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
      await page.goto(pathToFileURL(path.join(dir, id, file)).href, { waitUntil: 'networkidle0', timeout: 30000 });
      await new Promise((r) => setTimeout(r, 300));
      const el = (await page.$$('[data-booster]'))[i];
      await el.evaluate((e) => e.scrollIntoView({ block: 'center' }));
      await new Promise((r) => setTimeout(r, 150));
      const n = String(i + 1).padStart(2, '0');
      const before = await page.screenshot({ path: path.join(out, id + '-' + label + '-' + n + '-avant.png') });
      let tapped = true;
      try { await el.tap(); } catch { try { await el.click(); } catch { tapped = false; } }
      await new Promise((r) => setTimeout(r, 600));
      const after = await page.screenshot({ path: path.join(out, id + '-' + label + '-' + n + '-apres.png') });
      const change = Buffer.compare(before, after) !== 0;
      const fuite = await page.evaluate(() => (document.body.innerText.match(/\b(null|undefined|NaN)\b|\[object [A-Za-z]+\]/g) || []).slice(0, 3));
      if (fuite.length) errors.push('texte technique visible après toucher : ' + fuite.join(', '));
      result.push({ page: file, nom: names[i], tapped, change, errors });
      await page.close();
    }
  }
  fs.writeFileSync(path.join(out, id + '.json'), JSON.stringify(result, null, 2));
  const ok = result.filter((r) => r.change && r.tapped && r.errors.length === 0);
  const distinct = [...new Set(ok.map((r) => r.nom))];
  console.log(id + ' boosters marqués ' + result.length + ', qui changent l\'écran ' + ok.length + ', distincts ' + distinct.length + ' : ' + distinct.join(' | '));
}
await browser.close();
