// Aide d'auteur : le contraste au rendu (même règle que controle-contraste.mjs, D86), mais tout ouvert : chaque
// repli, la légende, l'autre scénario, puis chaque fiche g1 (ouvrirFiche) avec le nombre de mots de la fiche.
// Usage : node contraste-ouvert.mjs <page.html> [page2.html…] ; imprime le pire cas par page et chaque texte sous 4,5:1.
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json');
const puppeteer = require('puppeteer-core');
const mesure = () => {
  const rgba = (c) => { const m = String(c).match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/); return m ? [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]] : null; };
  const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const L = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const mix = (t, b) => { const a = t[3]; return [0, 1, 2].map((i) => t[i] * a + b[i] * (1 - a)).concat(1); };
  const fond = (e) => { const cs = []; for (let x = e; x; x = x.parentElement) { const s = getComputedStyle(x); if (s.backgroundImage && s.backgroundImage !== 'none') return null; const c = rgba(s.backgroundColor); if (c && c[3] > 0) { cs.push(c); if (c[3] >= 0.999) break; } } let b = [255, 255, 255, 1]; for (let i = cs.length - 1; i >= 0; i--) b = mix(cs[i], b); return b; };
  const out = [];
  for (const e of document.querySelectorAll('body *')) {
    const b = e.getBoundingClientRect(), cs = getComputedStyle(e);
    if (!b.width || !b.height || cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity <= 0.05) continue;
    if (![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
    const col = rgba(cs.color), f = fond(e); if (!col || !f) continue;
    const fg = col[3] < 1 ? mix(col, f) : col, a = L(fg), c = L(f), r = (Math.max(a, c) + 0.05) / (Math.min(a, c) + 0.05);
    const px = parseFloat(cs.fontSize), seuil = px >= 24 || (parseInt(cs.fontWeight, 10) >= 700 && px >= 18.66) ? 3 : 4.5;
    out.push({ t: e.textContent.trim().slice(0, 30), r: Math.round(r * 100) / 100, seuil, px });
  }
  return out;
};
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
for (const f of process.argv.slice(2)) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.goto(pathToFileURL(path.resolve(f)).href + '?ouvert&legende', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 300));
  await page.evaluate(() => document.querySelectorAll('[data-scenario][hidden]').forEach((s) => { s.hidden = false; s.querySelectorAll('[data-role="repli"][aria-expanded="false"]').forEach((b) => b.click()); }));
  let tout = await page.evaluate(mesure);
  const cles = await page.evaluate(() => [...new Set([...document.querySelectorAll('[data-houblon].hn')].map((e) => e.dataset.houblon))]);
  const mots = [];
  for (const k of cles) {
    await page.evaluate((k) => { window.ouvrirFiche(k); }, k);
    await new Promise((r) => setTimeout(r, 250));
    tout = tout.concat(await page.evaluate(mesure));
    mots.push(k.replace('beermaverick-', '') + ' ' + await page.evaluate(() => { const fi = document.querySelector('[data-role="fiche"]'); return fi ? fi.innerText.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length : 0; }) + ' mots');
    await page.keyboard.press('Escape');
  }
  await page.close();
  const pire = tout.reduce((m, x) => (!m || x.r / x.seuil < m.r / m.seuil ? x : m), null), bas = tout.filter((x) => x.r < x.seuil);
  console.log(path.basename(path.dirname(f)) + ' · ' + tout.length + ' textes (tout ouvert, fiches comprises) · pire « ' + pire.t + ' » ' + pire.r + ':1 (' + pire.px + ' px) · sous le seuil : ' + bas.length + ' · fiches : ' + mots.join(', '));
  for (const x of bas.slice(0, 10)) console.log('   « ' + x.t + ' » ' + x.r + ':1');
}
await browser.close();
