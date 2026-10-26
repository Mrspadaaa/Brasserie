// Contrôle Chrome (p7-radar-trou-du-0, D186, 26.10), sur le radar commun (src/ui/hopIndex/commun/RadarBase.tsx).
// Ses mots sur la capture G, les axes agrumes et tropical entourés : « Mais autre problème, sur certains points, on ne voit pas le
// bleu ». Quand plusieurs séries ont la même valeur sur un axe, leurs points se superposent : le vert de Calypso cache le bleu de
// Solero, l'anneau de l'original les recouvre.
// Règle : aucun point de série n'est caché à plus de 50 % par un autre point. Mesure : pour chaque point (plein : son disque ; creux :
// son anneau), des points d'échantillon sur ce qu'il peint ; à chacun, `elementsFromPoint` rend ce qui est dessus : un autre point
// (cercle `data-point` ou fond blanc d'un rond creux) au-dessus du sien le cache. Les traits, les aires et les cibles ne comptent pas.
// Cas : Lotus contre Solero et Calypso (les deux premiers de la liste), Substituer, en 390 × 844 et en 1280 × 800. Comparer (Absolu,
// Au style) sur les mêmes houblons : même règle.
// Ce n'est pas un test vitest (nom sans .test) : il lance Chrome. Usage (racine) :
//   node scripts/with_server.mjs --server "npm run dev -- --port 5274 --strictPort" --port 5274 --env VITE_HOP_V4=on -- node tests/integration/controle-points-confondus.mjs [--etat=avant|apres] [--rendre=<dossier>]
// Pour l'état « avant » : le même contrôle contre une copie de HEAD (serveur lancé dans cette copie, port à part).
// Sortie : « CONFONDUS OK » ou « CONFONDUS ECHEC n » (code 1). Les captures sont écrites pour être ouvertes (L12).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const RACINE = path.resolve(import.meta.dirname, '..', '..');
const { ouvrir } = await import(pathToFileURL(path.join(RACINE, '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);
const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1] ?? d;
const ETAT = arg('etat', 'controle');
const SORTIE = arg('rendre', path.join(os.tmpdir(), 'controle-points-confondus'));
const SEUIL = 0.5;
fs.mkdirSync(SORTIE, { recursive: true });
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const base = `http://localhost:${process.env.WITH_SERVER_PORTS}`;
const echecs = [];
const bilan = {};

/** Lit dans la page la part cachée de chaque point d'un radar. */
function lire(selecteur) {
  const svg = document.querySelector(selecteur);
  const M = svg.getScreenCTM();
  const k = Math.sqrt(M.a * M.a + M.b * M.b);
  const tous = [...svg.querySelectorAll('circle[data-point]')];
  const fonds = [...svg.querySelectorAll('circle[data-role="creux-fond"]')];
  const estPoint = (e) => e.tagName === 'circle' && (e.hasAttribute('data-point') || e.getAttribute('data-role') === 'creux-fond');
  const centre = (c) => { const p = svg.createSVGPoint(); p.x = Number(c.getAttribute('cx')); p.y = Number(c.getAttribute('cy')); const q = p.matrixTransform(M); return [q.x, q.y]; };
  const rows = [];
  for (const c of tous) {
    const r = Number(c.getAttribute('r')), plein = getComputedStyle(c).fill !== 'none', sw = parseFloat(getComputedStyle(c).strokeWidth) || 0;
    const [cx, cy] = centre(c);
    const sup = c.previousElementSibling?.getAttribute('data-role') === 'creux-fond' ? c.previousElementSibling : null;
    const echant = [];
    if (plein) { echant.push([0, 0]); for (const f of [0.35, 0.7, 1]) for (let a = 0; a < 12; a++) echant.push([Math.cos((a * Math.PI) / 6) * f * (r + sw / 2 - 0.6), Math.sin((a * Math.PI) / 6) * f * (r + sw / 2 - 0.6)]); }
    else for (let a = 0; a < 24; a++) echant.push([Math.cos((a * Math.PI) / 12) * r, Math.sin((a * Math.PI) / 12) * r]);
    let caches = 0, dessus = new Set();
    for (const [dx, dy] of echant) {
      const top = document.elementsFromPoint(cx + dx * k, cy + dy * k).find(estPoint);
      if (top && top !== c && top !== sup) { caches++; dessus.add(top.closest('[data-serie]')?.getAttribute('data-serie') ?? '?'); }
    }
    rows.push({ serie: c.closest('[data-serie]')?.getAttribute('data-serie'), famille: c.getAttribute('data-point'), part: caches / echant.length, par: [...dessus], decale: c.getAttribute('data-decale'), x: Math.round(cx), y: Math.round(cy) });
  }
  return { k: Math.round(k * 1000) / 1000, rows, fonds: fonds.length };
}

async function parcours(nomVue, largeur, hauteur, mobile) {
  const { browser, page } = await ouvrir({ largeur, hauteur, mobile, echelle: 2 });
  await page.goto(`${base}/?dev-local&etape=houblons`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('[data-ecran="ma-biere"]', { timeout: 120000 });
  await dormir(800);
  const champ = '[aria-label="Ajouter un houblon : stock ou catalogue"]';
  await page.click(champ, { clickCount: 3 });
  await page.type(champ, 'Lotus', { delay: 15 });
  await page.waitForSelector('[data-role="ajout-rapide"] [data-role="ajout-rapide-plus"]', { timeout: 30000 });
  const lotus = await page.$eval('[data-role="ajout-rapide"]', (e) => e.getAttribute('data-houblon-ajout'));
  await page.click('[data-role="ajout-rapide"] [data-role="ajout-rapide-plus"]');
  await dormir(900);
  const juger = async (nom, sel) => {
    const svg = await page.waitForSelector(sel, { timeout: 60000 });
    await svg.evaluate((e) => e.scrollIntoView({ block: 'center' }));
    await dormir(500);
    await page.mouse.move(1, 1);
    await svg.screenshot({ path: path.join(SORTIE, `${nom}-${largeur}-${ETAT}.png`) });
    const m = await page.evaluate(lire, sel);
    const pires = m.rows.filter((r) => r.part > SEUIL);
    bilan[`${nom}-${largeur}`] = { points: m.rows.length, decales: m.rows.filter((r) => r.decale).length, pirePart: Math.round(100 * Math.max(0, ...m.rows.map((r) => r.part))), caches: pires.map((r) => `${r.famille} ${r.serie} ${Math.round(100 * r.part)} % sous ${r.par.join(', ')}`) };
    if (!m.rows.length) echecs.push(`${nom} ${largeur} : aucun point à mesurer`);
    for (const r of pires) echecs.push(`${nom} ${largeur} : le point ${r.famille} de « ${r.serie} » est caché à ${Math.round(100 * r.part)} % (sous ${r.par.join(', ')})`);
    return m;
  };
  await page.evaluate((k) => window.__hopPile.open({ view: 'hopSubstitute', hopKey: k }), lotus);
  await page.waitForSelector('[data-ecran="substituer"] [data-remplacant]', { timeout: 90000 });
  await dormir(800);
  const liste = await page.evaluate(() => [...document.querySelectorAll('[data-ecran="substituer"] [data-remplacant]')].map((x) => ({ cle: x.getAttribute('data-remplacant'), nom: x.getAttribute('data-houblon-rang') })));
  const choisis = liste.slice(0, 2);
  bilan.compares = choisis.map((x) => x.nom);
  for (const x of choisis) { await page.evaluate((c) => document.querySelector(`[data-ecran="substituer"] [data-remplacant="${c}"]`)?.click(), x.cle); await dormir(600); }
  await page.waitForSelector('svg[data-radar="base"][data-objet="houblons"]', { timeout: 30000 });
  await juger('substituer', '[data-ecran="substituer"] svg[data-radar="base"][data-objet="houblons"]');
  if (nomVue === 'complet') {
    await page.evaluate(() => window.__hopPile.close());
    await dormir(800);
    await page.evaluate((h) => window.__hopPile.open({ view: 'hopCompare', hops: h }), [lotus, ...choisis.map((x) => x.cle)]);
    await page.waitForSelector('[data-ecran="comparer"] [data-e="absolu"]', { timeout: 90000 });
    await dormir(1500);
    await page.click('[data-ecran="comparer"] [data-e="absolu"]');
    await dormir(800);
    await juger('comparer-absolu', '[data-ecran="comparer"] svg[data-radar="base"][data-objet="houblons"]');
    await page.evaluate(() => { [...document.querySelectorAll('[data-ecran="comparer"] [data-e]')].find((b) => b.getAttribute('data-e') !== 'absolu' && /style/i.test(b.getAttribute('data-e')))?.click(); });
    await dormir(800);
    if (await page.$('[data-ecran="comparer"] svg[data-radar="base"][data-objet="houblons"]')) await juger('comparer-style', '[data-ecran="comparer"] svg[data-radar="base"][data-objet="houblons"]');
  }
  await browser.close();
}

await parcours('complet', 390, 844, true);
await parcours('substituer', 1280, 800, false);
fs.writeFileSync(path.join(SORTIE, `bilan-${ETAT}.json`), JSON.stringify(bilan, null, 1) + '\n');
console.log(JSON.stringify(bilan));
if (echecs.length) { console.log(`CONFONDUS ECHEC ${echecs.length}`); for (const e of echecs) console.log(' - ' + e); process.exit(1); }
console.log('CONFONDUS OK');
