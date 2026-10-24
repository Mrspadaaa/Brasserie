// Lit en direct, dans la page rendue (base), l'effet d'un changement de levure : moteur.effetLevure (lireBiere de la recette
// avec une autre souche). Écrit donnees/levures.json : par levure, pour chaque famille, avant, après, écart, crans, hors style,
// « non établi » quand le moteur ne simule rien (valeur nulle : jamais 0). Usage : node outils/moteur.mjs
import path from 'node:path'; import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';
const ici = path.dirname(fileURLToPath(import.meta.url)); const lot = path.resolve(ici, '..');
const LEV = ['fermentis-us05', 'lalbrew-verdant-ipa', 'lalbrew-pomona', 'lalbrew-lona', 'lalbrew-london', 'lalbrew-diamond', 'lalbrew-nottingham', 'lalbrew-bry97', 'fermentis-w68', 'wyeast-1728', 'wyeast-3068', 'wyeast-3724', 'white-labs-wlp618'];
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
await p.goto(pathToFileURL(path.join(lot, 'base', 'etat.html')).href, { waitUntil: 'networkidle0' }); await new Promise((r) => setTimeout(r, 800));
const r = await p.evaluate((LEV) => {
  const P = window.__parcours, m = P.moteur, rec = P.etat.recette;
  const res = m.effetLevure(rec, rec.additions[0], LEV);
  const ref = res.find((x) => x.levure === rec.yeastId).lu;
  return { levure: rec.yeastId, ibu: ref.ibu, style: rec.styleCode, out: res.map((x) => ({ levure: x.levure, ibu: x.lu.ibu, ecart: x.ecart, familles: Object.fromEntries(Object.entries(x.lu.profil).map(([f, v]) => { const a = ref.profil[f]; const c = (o) => o?.valeur?.centre ?? null; return [f, { avant: c(a), apres: c(v), d: c(v) != null && c(a) != null ? +(c(v) - c(a)).toFixed(1) : null, crans: v.crans, cransAvant: a.crans, hors: v.horsStyle, source: v.source }]; })) })) };
}, LEV);
fs.writeFileSync(path.join(lot, 'donnees', 'levures.json'), JSON.stringify(r, null, 1));
for (const o of r.out) console.log(o.levure.padEnd(22), 'ibu', o.ibu?.toFixed?.(1), Object.entries(o.familles).filter(([, v]) => v.d || v.apres != null && v.avant == null).map(([f, v]) => f + ' ' + (v.avant ?? '?') + '→' + v.apres + ' (' + v.cransAvant + '→' + v.crans + (v.hors ? ' HS' : '') + ')').join(' ; '));
console.log('réf', r.levure, r.style);
await b.close();
