// D86 (19.10, soir) : le contraste du texte se mesure au rendu, sur chaque écran. Jusqu'ici, chaque
// auteur le mesurait avec son propre script. Le brasseur : « Ça reprend les code de l'app avec la
// Baseline, ça utilise les bonne pratique, contraintes, retour ecttra ? ».
// Règle (WCAG 2.2, 1.4.3) : tout texte visible a un contraste d'au moins 4,5:1 sur son fond réel,
// 3:1 s'il est grand (24 px et plus, ou 18,66 px gras). Le fond réel est la première couleur pleine
// des ancêtres (avec leur opacité). Un fond d'image ou de dégradé est signalé « non mesurable », pas
// compté comme un succès.
// Usage : node controle-contraste.mjs <dossier> [ids…] [--page=etat-b.html] ; imprime CONTRASTE OK,
// ou CONTRASTE ECHEC et la liste (le pire cas par page est toujours imprimé).
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const args = process.argv.slice(2);
const dir = path.resolve(args.find((a) => !a.startsWith('--')) || '.');
const only = args.filter((a) => !a.startsWith('--')).slice(1);
const pg = (args.find((a) => a.startsWith('--page=')) || '--page=etat-b.html').slice(7);
const ids = (only.length ? only : fs.readdirSync(dir).filter((d) => fs.existsSync(path.join(dir, d, pg)))).sort();
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const problems = [];
for (const id of ids) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.goto(pathToFileURL(path.join(dir, id, pg)).href, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 300));
  const r = await page.evaluate(() => {
    const rgba = (c) => { const m = String(c).match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/); return m ? [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]] : null; };
    const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    const L = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    const mix = (top, bot) => { const a = top[3]; return [0, 1, 2].map((i) => top[i] * a + bot[i] * (1 - a)).concat(1); };
    const fond = (e) => {
      const couches = [];
      for (let x = e; x; x = x.parentElement) {
        const cs = getComputedStyle(x);
        if (cs.backgroundImage && cs.backgroundImage !== 'none') return { image: true };
        const c = rgba(cs.backgroundColor);
        if (c && c[3] > 0) { couches.push(c); if (c[3] >= 0.999) break; }
      }
      let b = [255, 255, 255, 1];
      for (let i = couches.length - 1; i >= 0; i--) b = mix(couches[i], b);
      return { c: b };
    };
    const vis = (e) => { const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0.05; };
    const out = [];
    for (const e of document.querySelectorAll('body *')) {
      if (!vis(e) || !([...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()))) continue;
      const cs = getComputedStyle(e), col = rgba(cs.color); if (!col) continue;
      const f = fond(e);
      const t = e.textContent.trim().slice(0, 24);
      if (f.image) { out.push({ t, nm: true }); continue; }
      const fg = col[3] < 1 ? mix(col, f.c) : col;
      const a = L(fg), b = L(f.c), ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      const px = parseFloat(cs.fontSize), gras = parseInt(cs.fontWeight, 10) >= 700;
      const seuil = px >= 24 || (gras && px >= 18.66) ? 3 : 4.5;
      out.push({ t, ratio: Math.round(ratio * 100) / 100, seuil });
    }
    return out;
  });
  await page.close();
  const mes = r.filter((x) => !x.nm), nm = r.filter((x) => x.nm);
  const pire = mes.reduce((m, x) => (!m || x.ratio / x.seuil < m.ratio / m.seuil ? x : m), null);
  const bas = mes.filter((x) => x.ratio < x.seuil);
  for (const x of bas.slice(0, 8)) problems.push(id + ' ' + pg + ' : « ' + x.t + ' » à ' + x.ratio + ':1 (' + x.seuil + ' au moins)');
  if (bas.length > 8) problems.push(id + ' ' + pg + ' : ' + (bas.length - 8) + ' texte(s) de plus sous le seuil');
  console.log(id + ' · ' + mes.length + ' textes mesurés · pire « ' + (pire ? pire.t + ' » ' + pire.ratio + ':1' : '—') + (nm.length ? ' · ' + nm.length + ' sur fond d\'image ou de dégradé, non mesurables' : ''));
}
await browser.close();
if (problems.length) { console.log('CONTRASTE ECHEC ' + problems.length + ' problème(s)'); for (const x of problems) console.log('  ' + x); process.exit(1); }
console.log('CONTRASTE OK');
