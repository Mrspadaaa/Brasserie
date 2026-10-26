// Fidélité de son choix D (voie p5) : l'app (composant FroidDryhopper) contre sa page m5, sur la même recette (21C, Cascade 4 g/L,
// dry hop après, 3 j), 390 × 844 (×2). Deux mesures dans la même page de l'app, au même état :
//  1. « m5 » : le dessin de m5/capturer.mjs, variante D (fonction `injecter` lue telle quelle dans ce fichier), la couche de l'app masquée ;
//  2. « app » : le composant de l'app (couche de m5 retirée).
// La boîte de chaque élément (cellules, plage, jauge, colonnes, pictos, étiquettes, nombres, feuille) est lue depuis le haut du dessin ;
// l'écart toléré est de 4 px. Elle écrit mesures.json, les captures de l'app (app-*.png) et les côte à côte avec les quatre captures de
// m5 (cote-a-cote-*.png : m5 à gauche, l'app à droite ; zone-*.png : la zone recadrée, plein format).
// Usage (racine) :
//   node scripts/with_server.mjs --server "npm run dev -- --port 5263 --strictPort" --port 5263 --env VITE_HOP_V4=on -- node work/missions/2026-10-25-integration-houblons/voies/p5-dryhopper-froid/fidelite/comparer.mjs
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const ICI = import.meta.dirname;
const RACINE = path.resolve(ICI, '..', '..', '..', '..', '..', '..');
const M5 = path.join(RACINE, 'work/missions/2026-10-25-integration-houblons/voies/m5-dryhopper-froid');
const { ouvrir } = await import(pathToFileURL(path.join(RACINE, '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const base = `http://localhost:${process.env.WITH_SERVER_PORTS}`;
const CLE = 'laffinee_recipe_draft_v1:dev-local:apercu-etape-houblons';
const TOLERANCE = 4;

// Le dessin de m5, lu tel quel dans son capturer.mjs (la fonction injecter et les valeurs X1 de x1 pour cette recette).
const src = fs.readFileSync(path.join(M5, 'capturer.mjs'), 'utf8');
const debut = src.indexOf('function injecter(nom, X) {'), fin = src.indexOf('\nconst VARIANTES');
const injecter = src.slice(debut, fin).trim();
const x1d = src.indexOf('const X1 = {'), x1f = src.indexOf('\n};', x1d) + 3;
const X1 = src.slice(x1d, x1f).replace('const X1 =', '(').replace(/;\s*$/, ')');
if (debut < 0 || fin < 0 || x1d < 0) throw new Error('capturer.mjs de m5 : injecter ou X1 introuvables');

const { browser, page, journal } = await ouvrir({ largeur: 390, hauteur: 844 });
await page.goto(`${base}/?dev-local&etape=houblons`, { waitUntil: 'networkidle0' });
await page.waitForSelector('[data-ecran="ma-biere"]', { timeout: 120000 });
await page.click('[data-role="dose-plus"]');
await dormir(1500);
await page.evaluate((cle) => {
  const e = JSON.parse(localStorage.getItem(cle));
  const hops = [{ name: 'Nugget', alpha: 13, weightG: 20, stage: 'boil', timeMin: 60 }, { name: 'Cascade', alpha: 6, weightG: 80, stage: 'dryHop', aromaTiming: 'fermentation', aromaContactHours: 72 }];
  for (const r of [e.draft.recipe, e.draft.details]) Object.assign(r, { name: 'Hazy du jeudi', style: '21C', hops, ogTarget: 1.058, colorEbc: 8 });
  e.draft.step = 'houblons'; e.draft.recipe.id = e.draft.details.id = 'REC-A2';
  localStorage.setItem(cle.replace('apercu-etape-houblons', 'new'), JSON.stringify(e));
}, CLE);
await page.goto(`${base}/?dev-local&etape=houblons&recette=vide`, { waitUntil: 'networkidle0' });
await page.waitForSelector('[data-role="ligne-houblon"]', { timeout: 120000 });
await dormir(1500);
await page.evaluate(() => window.__hopPile.open({ view: 'hopTiming', additionId: 'a2' }));
await page.waitForSelector('[data-ecran="dryhopper"] [data-bandeau]', { timeout: 120000 });
await dormir(1800);

// Les boîtes, depuis le haut du dessin. `mode` : 'm5' (classes m5d-) ou 'app' (data-froid).
const MESURER = (mode) => {
  const oy = document.querySelector('.pq-dry-svg').getBoundingClientRect().y;
  const b = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return { x: +r.x.toFixed(1), y: +(r.y - oy).toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) }; };
  const tous = (s) => [...document.querySelectorAll(s)];
  const m5 = mode === 'm5';
  const cels = m5 ? tous('.m5d-cel') : ['amer', 'creep', 'limite'].map((k) => document.querySelector(`[data-froid="${k}"]`));
  const plage = cels[0].querySelector('svg'), jauge = cels[1].querySelector('svg'), colonnes = cels[2].querySelector('svg');
  const pictos = m5 ? tous('.m5d-cel .m5d-pic') : tous('[data-froid="limite"] svg[data-famille]');
  const etiquettes = cels.map((c) => c.querySelector('span'));
  const moyen = cels[1].querySelector('b');
  const nombres = [...plage.querySelectorAll('text')];
  const sheet = document.querySelector(m5 ? '.m5d-det' : '[data-froid-feuille]');
  const out = { cel_amer: b(cels[0]), cel_creep: b(cels[1]), cel_limite: b(cels[2]), plage: b(plage), jauge: b(jauge), colonnes: b(colonnes), etiq_amer: b(etiquettes[0]), etiq_creep: b(etiquettes[1]), etiq_limite: b(etiquettes[2]), moyen: b(moyen) };
  pictos.forEach((p, i) => { out[`picto_${i}`] = b(p); });
  nombres.forEach((t, i) => { out[`nombre_${i}`] = b(t); });
  out.rail = b(document.querySelector('.pq-dry-rail'));
  if (sheet) {
    out.feuille = b(sheet);
    const pl = sheet.querySelector('svg:not([data-froid-colonnes]):not([data-froid-jauge])');
    if (pl && pl.getAttribute('width') === '330') out.feuille_plage = b(pl);
    sheet.querySelectorAll(m5 ? '.m5d-lim' : '.pq-dry-froid-lim').forEach((l, i) => { out[`feuille_ligne_${i}`] = b(l); });
    sheet.querySelectorAll('h4').forEach((h, i) => { out[`feuille_titre_${i}`] = b(h); });
    out.feuille_mots = sheet.textContent.replace(/\s+/g, ' ').trim().split(' ').length;
  }
  return out;
};

const ETATS = [{ nom: 'repos', toucher: null, ref: 'd-mini-graphes.png' }, { nom: 'amer', toucher: 'amer', ref: 'd-ouvert-amer.png' }, { nom: 'creep', toucher: 'creep', ref: 'd-ouvert-creep.png' }, { nom: 'limite', toucher: 'limite', ref: 'd-ouvert-limite.png' }];
const mesures = { m5: {}, app: {} };
const zoneApp = {};

// 1. Le dessin de m5 (la couche de l'app masquée).
await page.addStyleTag({ content: '[data-role="froid"], [data-froid-feuille] { display: none !important; }' });
await page.evaluate(`(${injecter})('d', ${X1})`);
for (const e of ETATS) {
  if (e.toucher) { await page.click(`.m5d-z [data-m5d-ouvre="${e.toucher}"]`); await dormir(250); }
  mesures.m5[e.nom] = await page.evaluate(MESURER, 'm5');
  if (e.toucher) { await page.click(`.m5d-z [data-m5d-ouvre="${e.toucher}"]`); await dormir(250); }
}
await page.evaluate(() => document.querySelectorAll('.m5d-ajout').forEach((n) => n.remove()));
await page.evaluate(() => { for (const s of document.querySelectorAll('style')) if (/display: none !important/.test(s.textContent) && /data-froid/.test(s.textContent)) s.remove(); });
await dormir(300);

// 2. L'app.
for (const e of ETATS) {
  if (e.toucher) { await page.click(`[data-froid="${e.toucher}"]`); await dormir(300); }
  mesures.app[e.nom] = await page.evaluate(MESURER, 'app');
  await page.screenshot({ path: path.join(ICI, `app-${e.nom}.png`) });
  zoneApp[e.nom] = path.join(ICI, `zone-app-${e.nom}.png`);
  await page.screenshot({ path: zoneApp[e.nom], clip: { x: 0, y: 370, width: 390, height: 260 } });
  if (e.toucher) { await page.click(`[data-froid="${e.toucher}"]`); await dormir(250); }
}

// 3. Les écarts.
const ecarts = [];
for (const e of ETATS) {
  const a = mesures.app[e.nom], m = mesures.m5[e.nom];
  for (const k of Object.keys(m)) {
    if (k === 'feuille_mots') continue;
    if (!a[k]) { ecarts.push({ etat: e.nom, element: k, ecart: 'absent dans l\'app' }); continue; }
    const d = Math.max(...['x', 'y', 'w', 'h'].map((c) => Math.abs(a[k][c] - m[k][c])));
    ecarts.push({ etat: e.nom, element: k, ecart: +d.toFixed(1), m5: m[k], app: a[k] });
  }
}
// Le seul écart de contenu voulu : la feuille Hop creep dit que le niveau est une convention (sa demande : « la feuille le dit »), une
// ligne de plus que celle de m5 ; la feuille et le rail dessous descendent d'autant. Mesuré, jamais masqué : il est écrit à part.
const DE_CONTENU = (x) => x.etat === 'creep' && (x.element === 'rail' || x.element === 'feuille');
const voulus = ecarts.filter((x) => DE_CONTENU(x) && typeof x.ecart === 'number' && x.ecart > TOLERANCE);
const hors = ecarts.filter((x) => (x.ecart === 'absent dans l\'app' || x.ecart > TOLERANCE) && !(DE_CONTENU(x) && x.ecart <= 24));
for (const x of voulus) console.log(`  CONTENU VOULU : ${x.etat} / ${x.element} : +${x.ecart} px (m5 ${x.m5.h} de haut ; app ${x.app.h})`);
fs.writeFileSync(path.join(ICI, 'mesures.json'), JSON.stringify({ tolerance: TOLERANCE, mesures, ecarts, mots: { amer: mesures.app.amer.feuille_mots, creep: mesures.app.creep.feuille_mots, limite: mesures.app.limite.feuille_mots } }, null, 1) + '\n');
const maxParEtat = Object.fromEntries(ETATS.map((e) => [e.nom, Math.max(0, ...ecarts.filter((x) => x.etat === e.nom && typeof x.ecart === 'number').map((x) => x.ecart))]));
console.log('écart maximal par état (px) :', JSON.stringify(maxParEtat), '; mots des feuilles :', JSON.stringify({ amer: mesures.app.amer.feuille_mots, creep: mesures.app.creep.feuille_mots }));
for (const x of hors) console.log(`  HORS ${TOLERANCE} px : ${x.etat} / ${x.element} : ${typeof x.ecart === 'number' ? x.ecart + ' px (m5 ' + JSON.stringify(x.m5) + ' ; app ' + JSON.stringify(x.app) + ')' : x.ecart}`);

// 4. Les côte à côte : m5 (ses captures d'origine) à gauche, l'app à droite ; puis la zone recadrée, plein format.
const b64 = (f) => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
const { browser: nav, page: p2 } = await ouvrir({ largeur: 800, hauteur: 900, mobile: false, echelle: 1, externe: 'laisser' });
for (const e of ETATS) {
  const gauche = path.join(M5, 'img', e.ref), droite = path.join(ICI, `app-${e.nom}.png`);
  const html = (g, d, w) => `<body style="margin:0;background:#888;display:flex;gap:12px;padding:6px"><div style="color:#fff;font:14px system-ui"><div>m5 : sa page</div><img src="${b64(g)}" style="width:${w}px;display:block"></div><div style="color:#fff;font:14px system-ui"><div>l'app (composant)</div><img src="${b64(d)}" style="width:${w}px;display:block"></div></body>`;
  await p2.setViewport({ width: 2 * 390 + 40, height: 870, deviceScaleFactor: 1 });
  await p2.setContent(html(gauche, droite, 390), { waitUntil: 'load' });
  await p2.screenshot({ path: path.join(ICI, `cote-a-cote-${e.nom}.png`), fullPage: true });
  // La zone, recadrée en plein format (×2 d'origine) : y de 370 à 630 en px CSS.
  const crop = (f) => `<div style="width:780px;height:${e.toucher ? 520 : 240}px;overflow:hidden;position:relative"><img src="${b64(f)}" style="position:absolute;left:0;top:-740px;width:780px"></div>`;
  await p2.setViewport({ width: 2 * 780 + 40, height: 600, deviceScaleFactor: 1 });
  await p2.setContent(`<body style="margin:0;background:#888;display:flex;gap:12px;padding:6px">${crop(gauche)}${crop(droite)}</body>`, { waitUntil: 'load' });
  await p2.screenshot({ path: path.join(ICI, `cote-a-cote-zone-${e.nom}.png`) });
}
await nav.close();
const erreurs = journal.erreurs.filter((x) => !/Firestore|firebase|net::ERR/i.test(x));
console.log(erreurs.length ? 'erreurs de page : ' + erreurs.slice(0, 3).join(' | ') : 'aucune erreur de page');
await browser.close();
console.log(hors.length ? `FIDELITE ECHEC ${hors.length}` : 'FIDELITE OK');
process.exit(hors.length ? 1 : 0);
