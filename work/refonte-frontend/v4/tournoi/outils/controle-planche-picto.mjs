// D101 (22.10) : la planche du picto « épicé ». Critère de la voie r4-picto-epice (mission 2026-10-22-reprise-lot21),
// écrit par le pilote ; la voie ne le modifie pas. Témoin négatif : temoins/planche-poivre.html.
// Le brasseur, deux fois : « pico épice très étrange, plutôt vanille, canelle ? » (lot 15), puis, après
// le passage aux grains de poivre, « épicé l'icone est toujours pas bon.. » (lot 21).
// Règle, sur la planche rendue à 390 px :
//   - 6 à 8 blocs [data-variante], chacun avec un nom visible ;
//   - aucun nom de variante ne dit poivre / pepper ; aucun dessin n'est fait seulement de cercles
//     (les grains de poivre rejetés : 5 cercles dans fils17-standard/v3/planche.html) ;
//   - chaque variante montre son picto svg[data-famille="spice"] à deux tailles au moins, dont une de
//     16 px au plus (la taille d'usage), et en contexte : 3 pictos d'autres familles au moins dans le bloc ;
//   - le trait du picto est le ton de la famille Épicé (#7a4e3a, jetons-familles.json) ;
//   - pas de défilement horizontal à 390 px.
// Usage : node controle-planche-picto.mjs <fichier.html> ; imprime PLANCHE OK (n variantes), ou PLANCHE ECHEC.
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const fichier = process.argv[2];
if (!fichier) { console.log('Usage : node controle-planche-picto.mjs <fichier.html>'); process.exit(2); }
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
await page.goto(pathToFileURL(path.resolve(fichier)).href, { waitUntil: 'networkidle0', timeout: 30000 });
await new Promise((r) => setTimeout(r, 300));
const r = await page.evaluate(() => {
  const TON = ['#7a4e3a', 'rgb(122, 78, 58)'];
  const formes = (svg) => {
    const use = svg.querySelector('use');
    const ref = use && (use.getAttribute('href') || use.getAttribute('xlink:href'));
    const src = ref ? document.querySelector(ref) : svg;
    if (!src) return { cercles: 0, autres: 0, tons: [] };
    const tout = [...src.querySelectorAll('circle, ellipse, path, line, polyline, polygon, rect')];
    const cercles = tout.filter((e) => /^(circle|ellipse)$/i.test(e.tagName)).length;
    const tons = [src.getAttribute('stroke'), svg.getAttribute('stroke'), getComputedStyle(svg).stroke, ...tout.map((e) => e.getAttribute('stroke'))]
      .filter(Boolean).map((t) => t.trim().toLowerCase());
    return { cercles, autres: tout.length - cercles, tons };
  };
  const blocs = [...document.querySelectorAll('[data-variante]')];
  return {
    large: document.documentElement.scrollWidth,
    variantes: blocs.map((b) => {
      const nom = (b.getAttribute('data-variante') + ' ' + (b.innerText || '')).replace(/\s+/g, ' ').trim();
      const epices = [...b.querySelectorAll('svg[data-famille="spice"]')];
      const tailles = [...new Set(epices.map((s) => Math.round(s.getBoundingClientRect().width)).filter((w) => w > 0))].sort((a, b) => a - b);
      const f = epices.length ? formes(epices[0]) : { cercles: 0, autres: 0, tons: [] };
      return {
        id: b.getAttribute('data-variante'), nom: nom.slice(0, 80), texte: (b.innerText || '').trim().length,
        tailles, cercles: f.cercles, autres: f.autres, ton: f.tons.some((t) => TON.includes(t)),
        voisins: b.querySelectorAll('svg[data-famille]:not([data-famille="spice"])').length,
      };
    }),
  };
});
await browser.close();
const fautes = [];
if (r.variantes.length < 6 || r.variantes.length > 8) fautes.push(`${r.variantes.length} variantes (6 à 8 attendues)`);
if (r.large > 390) fautes.push(`défilement horizontal : ${r.large} px de large`);
for (const v of r.variantes) {
  const f = [];
  if (!v.texte) f.push('sans nom visible');
  if (/poivre|pepper/i.test(v.nom)) f.push('poivre (rejeté)');
  if (v.cercles >= 3 && v.autres === 0) f.push(`dessin de ${v.cercles} cercles seulement : les grains de poivre rejetés`);
  if (!v.tailles.length) f.push('pas de svg[data-famille="spice"]');
  else {
    if (v.tailles.length < 2) f.push(`une seule taille (${v.tailles[0]} px)`);
    if (v.tailles[0] > 16) f.push(`plus petite taille ${v.tailles[0]} px (16 au plus attendue)`);
  }
  if (!v.ton) f.push('trait hors du ton Épicé #7a4e3a');
  if (v.voisins < 3) f.push(`${v.voisins} picto(s) d'autres familles (3 au moins, en contexte)`);
  console.log(`${v.id} · ${v.tailles.join('/')} px · ${v.cercles} cercle(s), ${v.autres} autre(s) forme(s) · ${v.voisins} voisins${f.length ? ' · ' + f.join(' ; ') : ''}`);
  for (const x of f) fautes.push(`${v.id} : ${x}`);
}
if (fautes.length) { console.log(`PLANCHE ECHEC ${fautes.length} problème(s)`); for (const x of fautes) console.log('  ' + x); process.exit(1); }
console.log(`PLANCHE OK (${r.variantes.length} variantes)`);
