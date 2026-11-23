// Capture chaque mini-prototype d'une étape du tournoi, pour le jury à l'aveugle.
// Usage : node work/refonte-frontend/v4/tournoi/outils/capture.mjs <dossier-etape>
// Le dossier contient des sous-dossiers p01, p02… avec un index.html chacun.
// Sortie : <dossier-etape>/captures/<id>-390.png (premier écran),
//          <id>-390-page.png (page entière), <id>-1280.png, et <id>.json (erreurs,
//          débordement horizontal, nombre de défilements pour tout voir).
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const dir = path.resolve(process.argv[2] || '.');
const out = path.join(dir, 'captures');
fs.mkdirSync(out, { recursive: true });
// Ids optionnels après le dossier (ex. p01 p02) : seuls ceux-là sont capturés.
// Sans ids : les dossiers pNN et consolide. Avec ids : n'importe quel sous-dossier nommé.
const only = process.argv.slice(3);
const withIndex = fs.readdirSync(dir).filter((d) => fs.existsSync(path.join(dir, d, 'index.html')));
const protos = only.length ? withIndex.filter((d) => only.includes(d)) : withIndex.filter((d) => /^p\d+/.test(d) || d === 'consolide');
if (protos.length === 0) { console.log('CAPTURE ECHEC : aucun p*/index.html dans ' + dir); process.exit(1); }

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
let ok = 0;
for (const id of protos) {
  const url = pathToFileURL(path.join(dir, id, 'index.html')).href;
  const info = { id, errors: [] };
  // CAPTURE_EXTRA=412 ajoute des largeurs téléphone (ex. celle du brasseur).
  const extra = (process.env.CAPTURE_EXTRA || '').split(',').map(Number).filter(Boolean).map((w) => [w, 915, true]);
  for (const [w, h, mobile] of [[390, 844, true], ...extra, [1280, 800, false]]) {
    const page = await browser.newPage();
    page.on('pageerror', (e) => info.errors.push(String(e.message || e)));
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 2, isMobile: mobile, hasTouch: mobile });
    try {
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
      await new Promise((r) => setTimeout(r, 400));
      const m = await page.evaluate(() => { const fill = () => { const H = innerHeight, W = innerWidth; const rows = new Uint8Array(H); for (const el of document.querySelectorAll('body *')) { const r = el.getBoundingClientRect(); if (!r.height || r.top >= H || r.bottom <= 0) continue; const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) continue; const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()); const media = /^(svg|img|canvas|input|button)$/i.test(el.tagName); const mark = (cs.backgroundImage !== 'none' || !/rgba\(0, 0, 0, 0\)|transparent/.test(cs.backgroundColor)) && r.width * r.height < 0.15 * W * H; if (!own && !media && !mark) continue; for (let y = Math.max(0, Math.floor(r.top)); y < Math.min(H, Math.ceil(r.bottom)); y++) rows[y] = 1; } let c = 0; for (const v of rows) c += v; return +(c / H).toFixed(2); }; return {
        fill: fill(), typo: (() => { const typo = () => { const H = innerHeight; const sizes = new Set(); let para = 0; for (const el of document.querySelectorAll('body *')) { const own = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim()); if (!own.length) continue; const r = el.getBoundingClientRect(); if (!r.height || r.top >= H || r.bottom <= 0) continue; const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) continue; sizes.add(Math.round(parseFloat(cs.fontSize))); const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2; const words = own.map((n) => n.textContent).join(' ').trim().split(/\s+/).length; if (words >= 8) para = Math.max(para, Math.round(r.height / lh)); } return { tailles: sizes.size, paragraphe: para }; }; return typo(); })(),
        scrollW: document.documentElement.scrollWidth,
        scrollH: document.documentElement.scrollHeight,
        innerW: innerWidth, innerH: innerHeight,
      }; });
      const fuite = await page.evaluate(() => (document.body.innerText.match(/\b(null|undefined|NaN)\b|\[object [A-Za-z]+\]/g) || []).slice(0, 3));
      if (fuite.length) info.errors.push('texte technique visible à ' + w + ' : ' + fuite.join(', '));
      info['w' + w] = { horizontalOverflow: m.scrollW > m.innerW, screens: +(m.scrollH / m.innerH).toFixed(1), fill: m.fill, tailles: m.typo.tailles, paragraphe: m.typo.paragraphe };
      await page.screenshot({ path: path.join(out, id + '-' + w + '.png') });
      if (w === 390) {
        await page.screenshot({ path: path.join(out, id + '-390-page.png'), fullPage: true });
        // Coup d'œil : le premier écran réduit à 40 %, où le texte courant ne se lit plus.
        // Le jury juge d'abord cette image : ce qui reste lisible est la hiérarchie visuelle.
        await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 0.4, isMobile: true, hasTouch: true });
        await new Promise((r) => setTimeout(r, 200));
        await page.screenshot({ path: path.join(out, id + '-oeil.png') });
      }
    } catch (e) {
      info.errors.push('chargement ' + w + ' : ' + e.message);
    }
    await page.close();
  }
  // États supplémentaires (fils de fer) : chaque autre page .html du dossier, à 390.
  // etat-b.html → <id>-b-390.png ; radar.html → <id>-radar-390.png ; etc.
  const extras = fs.readdirSync(path.join(dir, id)).filter((f) => f.endsWith('.html') && f !== 'index.html');
  for (const extra of extras) {
    const label = extra === 'etat-b.html' ? 'b' : extra.slice(0, -5);
    const bFile = path.join(dir, id, extra);
    const page = await browser.newPage();
    page.on('pageerror', (e) => info.errors.push(extra + ' : ' + String(e.message || e)));
    try {
      await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
      await page.goto(pathToFileURL(bFile).href, { waitUntil: 'networkidle0', timeout: 30000 });
      await new Promise((r) => setTimeout(r, 400));
      const m = await page.evaluate(() => { const fill = () => { const H = innerHeight, W = innerWidth; const rows = new Uint8Array(H); for (const el of document.querySelectorAll('body *')) { const r = el.getBoundingClientRect(); if (!r.height || r.top >= H || r.bottom <= 0) continue; const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) continue; const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()); const media = /^(svg|img|canvas|input|button)$/i.test(el.tagName); const mark = (cs.backgroundImage !== 'none' || !/rgba\(0, 0, 0, 0\)|transparent/.test(cs.backgroundColor)) && r.width * r.height < 0.15 * W * H; if (!own && !media && !mark) continue; for (let y = Math.max(0, Math.floor(r.top)); y < Math.min(H, Math.ceil(r.bottom)); y++) rows[y] = 1; } let c = 0; for (const v of rows) c += v; return +(c / H).toFixed(2); }; return { fill: fill(), typo: (() => { const typo = () => { const H = innerHeight; const sizes = new Set(); let para = 0; for (const el of document.querySelectorAll('body *')) { const own = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim()); if (!own.length) continue; const r = el.getBoundingClientRect(); if (!r.height || r.top >= H || r.bottom <= 0) continue; const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) continue; sizes.add(Math.round(parseFloat(cs.fontSize))); const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2; const words = own.map((n) => n.textContent).join(' ').trim().split(/\s+/).length; if (words >= 8) para = Math.max(para, Math.round(r.height / lh)); } return { tailles: sizes.size, paragraphe: para }; }; return typo(); })(), scrollW: document.documentElement.scrollWidth, scrollH: document.documentElement.scrollHeight, innerW: innerWidth, innerH: innerHeight }; });
      info[label + '390'] = { horizontalOverflow: m.scrollW > m.innerW, screens: +(m.scrollH / m.innerH).toFixed(1), fill: m.fill, tailles: m.typo.tailles, paragraphe: m.typo.paragraphe };
      await page.screenshot({ path: path.join(out, id + '-' + label + '-390.png') });
      await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 0.4, isMobile: true, hasTouch: true });
      await new Promise((r) => setTimeout(r, 200));
      await page.screenshot({ path: path.join(out, id + '-' + label + '-oeil.png') });
    } catch (e) {
      info.errors.push('chargement ' + extra + ' : ' + e.message);
    }
    await page.close();
  }
  fs.writeFileSync(path.join(out, id + '.json'), JSON.stringify(info, null, 2));
  if (info.errors.length === 0) ok++;
  console.log(id + (info.errors.length ? ' ERREURS ' + info.errors.length : ' ok'));
}
await browser.close();
console.log((ok === protos.length ? 'CAPTURE OK ' : 'CAPTURE PARTIELLE ') + ok + '/' + protos.length);
if (ok !== protos.length) process.exitCode = 1;
