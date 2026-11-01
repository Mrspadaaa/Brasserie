#!/usr/bin/env node
// Compare pixel à pixel captures/avant/<nom>.png et captures/apres/<nom>.png (dans un Chrome, via canvas) : nombre de pixels
// différents, boîte englobante (en px CSS, captures à l'échelle 2), écart maximal de canal. Écrit un PNG « diff » à côté si différent.
// Usage : node diff-captures.mjs [motif]   (par défaut toutes les app-*.png)
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const RACINE = path.resolve(import.meta.dirname, '..', '..', '..', '..', '..');
const { ouvrir } = await import(pathToFileURL(path.join(RACINE, '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);
const dossier = path.join(import.meta.dirname, 'captures');
const motif = process.argv[2] ? new RegExp(process.argv[2]) : /^app-.*\.png$/;
const noms = fs.readdirSync(path.join(dossier, 'avant')).filter((n) => motif.test(n));
const b64 = (d, n) => fs.readFileSync(path.join(dossier, d, n)).toString('base64');
fs.mkdirSync(path.join(dossier, 'diff'), { recursive: true });

const { browser, page } = await ouvrir({ largeur: 800, hauteur: 600, mobile: false, echelle: 1 });
await page.setContent('<body></body>');
let diffs = 0;
for (const n of noms) {
  const r = await page.evaluate(async (a, b) => {
    const charger = (s) => new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = 'data:image/png;base64,' + s; });
    const [ia, ib] = await Promise.all([charger(a), charger(b)]);
    if (ia.width !== ib.width || ia.height !== ib.height) return { taille: [ia.width, ia.height, ib.width, ib.height] };
    const lire = (i) => { const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const x = c.getContext('2d'); x.drawImage(i, 0, 0); return x.getImageData(0, 0, i.width, i.height); };
    const da = lire(ia); const db = lire(ib);
    const sortie = document.createElement('canvas'); sortie.width = ia.width; sortie.height = ia.height;
    const sx = sortie.getContext('2d'); const out = sx.createImageData(ia.width, ia.height);
    let n = 0, max = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
    for (let p = 0; p < da.data.length; p += 4) {
      const d = Math.max(Math.abs(da.data[p] - db.data[p]), Math.abs(da.data[p + 1] - db.data[p + 1]), Math.abs(da.data[p + 2] - db.data[p + 2]));
      const gris = (da.data[p] + da.data[p + 1] + da.data[p + 2]) / 3;
      out.data[p] = out.data[p + 1] = out.data[p + 2] = 255 - (255 - gris) * 0.25; out.data[p + 3] = 255;
      if (d > 0) {
        n++; max = Math.max(max, d);
        const i = p / 4; const x = i % ia.width; const y = Math.floor(i / ia.width);
        x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
        out.data[p] = 255; out.data[p + 1] = 0; out.data[p + 2] = 0;
      }
    }
    sx.putImageData(out, 0, 0);
    return { n, max, boite: n ? [x0 / 2, y0 / 2, (x1 + 1) / 2, (y1 + 1) / 2] : null, png: n ? sortie.toDataURL('image/png').split(',')[1] : null };
  }, b64('avant', n), b64('apres', n));
  if (r.taille) { console.log(`DIFF ${n} : tailles différentes ${r.taille.join(' ')}`); diffs++; continue; }
  if (r.n) { diffs++; fs.writeFileSync(path.join(dossier, 'diff', n), Buffer.from(r.png, 'base64')); }
  console.log(`${r.n ? 'DIFF' : '=   '} ${n}${r.n ? ` : ${r.n} px, écart max ${r.max}/255, boîte (px CSS) ${r.boite.join(',')}` : ''}`);
}
await browser.close();
console.log(`${diffs} capture(s) différente(s) sur ${noms.length}`);
