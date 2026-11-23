#!/usr/bin/env node
// D133 (24.10, soir), sur le radar de la fiche de Nelson Sauvin (deux traits entourés) : « Jsp si c'est la version actuelle
// mais le spidergraph doit être en pic pas juste des traits... Enfin comme sur les mini maquettes ». g1, sa fiche choisie,
// pose une famille inconnue dans le disque du centre, « à mi-chemin entre le centre et l'anneau du zéro » (échelle de -0,5 à
// max) : chaque famille décrite garde une base et fait un pic, même seule entre deux inconnues. La maquette posait
// l'inconnue au centre exact : un pic isolé devenait un trait sans aire.
//
// Ce contrôle lit le radar de la fiche (`svg[data-radar][data-objet="fiche"]`) à 390 × 844 et refuse :
//   R1 un sommet de la silhouette au centre (à moins de 5 % du rayon) : l'inconnue doit rester dans le disque du centre ;
//   R2 un pic isolé (une famille décrite entre deux inconnues) dont la base fait moins de 5 % du rayon : un trait, pas un pic.
// Usage : node controle-radar-pics.mjs <page.html> [<page.html>…]  →  « PICS OK (…) » ou « PICS ECHEC (…) ».
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..');
const puppeteer = createRequire(path.join(RACINE, 'package.json'))('puppeteer-core');
const pages = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!pages.length || pages.some((p) => !fs.existsSync(path.resolve(RACINE, p)))) { console.log('Usage : node controle-radar-pics.mjs <page.html> [<page.html>…]'); process.exit(2); }

const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const ecarts = [], vus = [];
for (const page of pages) {
  const p = await nav.newPage();
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await p.goto(pathToFileURL(path.resolve(RACINE, page)).href, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 500));
  const lu = await p.evaluate(() => {
    const svg = document.querySelector('svg[data-radar][data-objet="fiche"]');
    if (!svg) return null;
    const pts = (el) => el.tagName === 'polygon'
      ? el.getAttribute('points').trim().split(/\s+/).map((c) => c.split(',').map(Number))
      : [...(el.getAttribute('d') || '').matchAll(/[ML]\s*(-?[\d.]+)[ ,](-?[\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
    const formes = [...svg.querySelectorAll('polygon, path')].filter((e) => !e.closest('defs, marker, pattern'));
    const anneaux = formes.filter((e) => e.getAttribute('fill') === 'none' && pts(e).length >= 12);
    const pleines = formes.filter((e) => { const f = e.getAttribute('fill') || ''; return f && f !== 'none' && !f.startsWith('url') && pts(e).length >= 12; });
    if (!anneaux.length || !pleines.length) return { manque: !anneaux.length ? 'anneau' : 'silhouette' };
    const tous = anneaux.map(pts);
    const ext = tous.reduce((a, b) => (Math.max(...b.map((q) => Math.abs(q[0]))) > Math.max(...a.map((q) => Math.abs(q[0]))) ? b : a));
    const c = [ext.reduce((s, q) => s + q[0], 0) / ext.length, ext.reduce((s, q) => s + q[1], 0) / ext.length];
    const R = ext.reduce((s, q) => s + Math.hypot(q[0] - c[0], q[1] - c[1]), 0) / ext.length;
    return { c, R, sommets: pts(pleines[0]), nom: document.querySelector('[data-houblon-ouvert]')?.getAttribute('data-houblon-ouvert') ?? '' };
  });
  await p.close();
  const id = path.basename(path.dirname(page)) + '/' + path.basename(page);
  if (!lu) { ecarts.push(`${id} : aucun radar de fiche`); continue; }
  if (lu.manque) { ecarts.push(`${id} : radar sans ${lu.manque} lisible`); continue; }
  const d = lu.sommets.map((q) => Math.hypot(q[0] - lu.c[0], q[1] - lu.c[1]) / lu.R);
  const n = d.length;
  const bas = Math.min(...d);
  if (bas < 0.05) ecarts.push(`${id} R1 un sommet au centre (${Math.round(bas * 100)} % du rayon) : l'inconnue au centre exact, le pic devient un trait`);
  const decrit = d.map((x) => x >= 0.18);
  for (let k = 0; k < n; k++) {
    const a = (k + n - 1) % n, b = (k + 1) % n;
    if (!decrit[k] || decrit[a] || decrit[b]) continue;
    const base = Math.hypot(lu.sommets[a][0] - lu.sommets[b][0], lu.sommets[a][1] - lu.sommets[b][1]) / lu.R;
    if (base < 0.05) ecarts.push(`${id} R2 pic isolé n° ${k + 1} sans base (${Math.round(base * 100)} % du rayon)`);
  }
  vus.push(`${id}${lu.nom ? ' ' + lu.nom : ''} : sommet le plus bas à ${Math.round(bas * 100)} % du rayon`);
}
await nav.close();
console.log(ecarts.length ? `PICS ECHEC (${ecarts.join(' ; ')})` : `PICS OK (${vus.join(' ; ')})`);
process.exit(ecarts.length ? 1 : 0);
