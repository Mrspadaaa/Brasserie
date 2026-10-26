// Contrôle Chrome (p7-radar-trou-du-0, D114, 26.10), sur le radar commun (src/ui/hopIndex/commun/RadarBase.tsx).
// Son choix, sur la page m8 : « G le trou du o, met ça sur tout les radar de comparaison btw ». Sa variante G : le disque du 0 (« non
// décrit ») teinté d'un gris uni très clair, sans hachures ni mot ; un point qui tombe dessus devient un rond creux.
// Portée (lecture étroite) : les radars qui comparent des houblons, Substituer et Comparer (Au style et Absolu). Pas Ma bière, pas la fiche.
// Ce n'est pas un test vitest (nom sans .test) : il lance Chrome. Usage (racine) :
//   node scripts/with_server.mjs --server "npm run dev -- --port 5271 --strictPort" --port 5271 --env VITE_HOP_V4=on -- node tests/integration/controle-trou-du-0.mjs [--etat=avant|apres] [--rendre=<dossier>]
// Pour l'état « avant » : le même contrôle contre une copie de HEAD (serveur lancé dans cette copie, port à part).
// Écrans (390 × 844, fixtures ?dev-local) : Substituer, Comparer (Absolu, Au style), Ma bière (vue Radar), la fiche. Pour chaque radar :
//  Substituer et Comparer : le disque `[data-role="trou-du-zero"]` existe, ses sommets sont ceux du petit anneau du zéro (à 1,5 px),
//    son fond est le gris uni très clair (rgb 230 232 235), sans motif, et il est visible (au moins 4 niveaux de gris de moins que
//    le fond de la page) ; chaque point de série à 0 (non décrit) est un rond creux (`fill: none`, trait de la couleur de la série, 8 px
//    de diamètre au moins à l'écran) sur un fond blanc ; au moins un tel point dans Substituer (le cas de Lotus en a) ;
//  Ma bière et la fiche : ni disque, ni rond creux (`data-creux`) ; un point à 0, s'il y en a, reste plein.
// Sortie : « TROU OK » ou « TROU ECHEC n » (code 1). Les captures sont écrites pour être ouvertes (L12).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const RACINE = path.resolve(import.meta.dirname, '..', '..');
const { ouvrir } = await import(pathToFileURL(path.join(RACINE, '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);
const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1] ?? d;
const ETAT = arg('etat', 'controle');
const SORTIE = arg('rendre', path.join(os.tmpdir(), 'controle-trou-du-0'));
fs.mkdirSync(SORTIE, { recursive: true });
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const base = `http://localhost:${process.env.WITH_SERVER_PORTS}`;
const echecs = [];
const bilan = {};

const { browser, page } = await ouvrir({ largeur: 390, hauteur: 844, mobile: true, echelle: 2 });
await page.goto(`${base}/?dev-local&etape=houblons`, { waitUntil: 'networkidle0' });
await page.waitForSelector('[data-ecran="ma-biere"]', { timeout: 120000 });
await dormir(800);

/** Lit un radar dans la page : le disque, les points à 0, leur dessin. `attendu` : le radar doit porter le trou du 0. */
async function mesurer(nom, selecteur, attendu) {
  const svg = await page.waitForSelector(selecteur, { timeout: 60000 });
  await svg.evaluate((e) => e.scrollIntoView({ block: 'center' }));
  await dormir(500);
  await svg.screenshot({ path: path.join(SORTIE, `${nom}-${ETAT}.png`) });
  const m = await page.evaluate((sel) => {
    const svgE = document.querySelector(sel);
    const k = svgE.getBoundingClientRect().width / svgE.viewBox.baseVal.width;
    const rgb = (s) => { const r = /rgba?\(([^)]+)\)/.exec(s ?? ''); if (!r) return null; return r[1].split(/[ ,/]+/).map(Number).slice(0, 3); };
    const disque = svgE.querySelector('[data-role="trou-du-zero"]');
    let d = null;
    if (disque) {
      const cs = getComputedStyle(disque);
      const pts = disque.getAttribute('points').split(' ').map((p) => p.split(',').map(Number));
      // Le petit anneau du zéro de la grille : data-anneau="0".
      const an = svgE.querySelector('[data-anneau="0"]');
      const ref = an ? an.getAttribute('points').split(' ').map((p) => p.split(',').map(Number)) : [];
      const ecart = ref.length === pts.length ? Math.max(...pts.map((p, i) => Math.hypot(p[0] - ref[i][0], p[1] - ref[i][1]))) : null;
      let f = svgE, fond = null;
      while (f && !fond) { const c = rgb(getComputedStyle(f).backgroundColor); const a = /rgba\(.*,\s*([\d.]+)\)/.exec(getComputedStyle(f).backgroundColor); if (c && (!a || parseFloat(a[1]) > 0.9)) fond = c; f = f.parentElement; }
      d = { fill: cs.fill, fillRgb: rgb(cs.fill), fond: fond ?? [255, 255, 255], ecartAnneau0: ecart, sommets: pts.length, motif: /url\(/.test(cs.fill), zIndexDOM: [...svgE.children].indexOf(disque), grille: [...svgE.children].indexOf(svgE.querySelector('[data-role="anneaux"]')) };
    }
    // Les points à 0 : les non-contours (un anneau d'original est déjà creux, 6,2).
    const points = [...svgE.querySelectorAll('circle[data-point]')].filter((c) => c.getAttribute('data-valeur') === '0').map((c) => {
      const cs = getComputedStyle(c), g = c.closest('[data-serie]');
      const fondBlanc = c.previousElementSibling?.getAttribute('data-role') === 'creux-fond' ? getComputedStyle(c.previousElementSibling).fill : null;
      // L'anneau de l'original (r 6,2, sans remplissage) est creux depuis D156 : il n'est pas un rond du trou du 0.
      return { anneau: parseFloat(c.getAttribute('r')) === 6.2 && cs.fill === 'none', serie: g?.getAttribute('data-serie'), famille: c.getAttribute('data-point'), creux: cs.fill === 'none', creuxMarque: c.getAttribute('data-creux') === '0', diametre: Math.round(2 * (parseFloat(c.getAttribute('r')) + parseFloat(cs.strokeWidth) / 2) * k * 10) / 10, trait: cs.stroke, couleurSerie: g?.getAttribute('data-couleur'), fondBlanc };
    });
    return { disque: d, points, aCreux: svgE.querySelectorAll('[data-creux]').length, k };
  }, selecteur);
  const ok = (cond, msg) => { if (!cond) echecs.push(`${nom} : ${msg}`); };
  bilan[nom] = { attendu, disque: m.disque ? { ...m.disque } : null, pointsAZero: m.points.length, creux: m.points.filter((p) => p.creux).length };
  if (attendu) {
    ok(!!m.disque, 'le disque du 0 (data-role="trou-du-zero") n\'existe pas');
    if (m.disque) {
      const d = m.disque;
      ok(d.ecartAnneau0 != null && d.ecartAnneau0 <= 1.5, `le disque n'est pas le petit anneau du zéro (écart ${d.ecartAnneau0})`);
      ok(!d.motif, 'le disque a un motif (hachures) : il doit être uni');
      ok(d.fillRgb && d.fillRgb.join() === '230,232,235', `le disque n'est pas gris uni très clair (fill ${d.fill})`);
      ok(d.fillRgb && d.fond.reduce((a, b) => a + b, 0) / 3 - d.fillRgb.reduce((a, b) => a + b, 0) / 3 >= 4, 'le disque ne se distingue pas du fond de la page');
      ok(d.zIndexDOM >= 0 && d.zIndexDOM < d.grille, 'le disque doit être sous la grille');
    }
    for (const p of m.points.filter((x) => !x.anneau)) {
      const e = [];
      if (p.serie && !p.creux) e.push('plein');
      if (p.serie && !p.creuxMarque) e.push('sans data-creux');
      if (p.diametre < 8) e.push(`diamètre ${p.diametre} px`);
      if (p.couleurSerie && p.trait !== p.couleurSerie && !/^rgb/.test(p.trait)) e.push(`trait ${p.trait}`);
      if (p.creux && !/^rgb\(255, 255, 255\)$/.test(p.fondBlanc ?? '')) e.push('pas de fond blanc dessous');
      ok(!e.length, `point à 0 ${p.famille} de « ${p.serie} » : ${e.join(' ; ')}`);
    }
  } else {
    ok(!m.disque, 'un disque du 0 est dessiné : ce radar n\'est pas un radar de comparaison');
    ok(m.aCreux === 0, `${m.aCreux} rond(s) creux (data-creux) : ce radar n'est pas un radar de comparaison`);
    for (const p of m.points) ok(!p.creux, `le point à 0 ${p.famille} de « ${p.serie} » est creux`);
  }
  return m;
}

// ---- La fiche de Lotus (radar absolu, une série) : l'appui long sur la carte.
const champ = '[aria-label="Ajouter un houblon : stock ou catalogue"]';
async function ajouter(nom) {
  await page.waitForSelector(champ, { timeout: 30000 });
  await page.click(champ, { clickCount: 3 });
  await page.keyboard.press('Backspace');
  await page.type(champ, nom, { delay: 15 });
  const plus = '[data-role="ajout-rapide"] [data-role="ajout-rapide-plus"]';
  await page.waitForSelector(plus, { timeout: 30000 });
  const cle = await page.$eval('[data-role="ajout-rapide"]', (e) => e.getAttribute('data-houblon-ajout'));
  await page.click(plus);
  await dormir(900);
  return cle;
}
const lotus = await ajouter('Lotus');
bilan.lotus = lotus;
{
  const nomBouton = `[data-element="etape-carte-ajout"][data-houblon-ligne="${lotus}"] [data-role="ouvrir-fiche"]`;
  await page.waitForSelector(nomBouton, { timeout: 30000 });
  await page.$eval(nomBouton, (e) => e.scrollIntoView({ block: 'center' }));
  await dormir(300);
  const b = await (await page.$(nomBouton)).boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down();
  await dormir(750);
  await page.mouse.up();
  const fiche = await page.waitForSelector('[data-ecran="fiche"] svg[data-radar="base"][data-objet="fiche"]', { timeout: 20000 }).catch(() => null);
  if (fiche) { await dormir(800); await mesurer('fiche', '[data-ecran="fiche"] svg[data-radar="base"][data-objet="fiche"]', false); await page.keyboard.press('Escape'); await dormir(900); }
  else echecs.push('fiche : le radar de la fiche de Lotus ne s\'ouvre pas dans ce parcours');
  if (await page.$('[data-ecran="fiche"]')) { await page.click('[aria-label="Fermer"]').catch(() => {}); await dormir(800); }
}

// ---- Substituer : Lotus contre les deux premiers de la liste (Solero et Calypso en fixtures).
await page.evaluate((k) => window.__hopPile.open({ view: 'hopSubstitute', hopKey: k }), lotus);
await page.waitForSelector('[data-ecran="substituer"] [data-remplacant]', { timeout: 90000 });
await dormir(800);
const liste = await page.evaluate(() => [...document.querySelectorAll('[data-ecran="substituer"] [data-remplacant]')].map((x) => ({ cle: x.getAttribute('data-remplacant'), nom: x.getAttribute('data-houblon-rang') })));
const choisis = liste.slice(0, 2);
bilan.substituerCompares = choisis.map((x) => x.nom);
for (const x of choisis) {
  await page.evaluate((c) => document.querySelector(`[data-ecran="substituer"] [data-remplacant="${c}"]`)?.click(), x.cle);
  await dormir(600);
}
await page.waitForSelector('svg[data-radar="base"][data-objet="houblons"]', { timeout: 30000 });
const sub = await mesurer('substituer', '[data-ecran="substituer"] svg[data-radar="base"][data-objet="houblons"]', true);
if (!sub.points.filter((p) => !p.anneau).length) echecs.push('substituer : aucun point de remplaçant à 0 à mesurer (le cas de Lotus en a) : un vert sans rond creux ne prouve rien');
await page.evaluate(() => window.__hopPile.close());
await dormir(800);

// ---- Comparer (Absolu, puis Au style) : les mêmes trois houblons.
await page.evaluate((h) => window.__hopPile.open({ view: 'hopCompare', hops: h }), [lotus, ...choisis.map((x) => x.cle)]);
await page.waitForSelector('[data-ecran="comparer"] [data-e="absolu"]', { timeout: 90000 });
await dormir(1500);
await page.click('[data-ecran="comparer"] [data-e="absolu"]');
await dormir(800);
await mesurer('comparer-absolu', '[data-ecran="comparer"] svg[data-radar="base"][data-objet="houblons"]', true);
await page.evaluate(() => { [...document.querySelectorAll('[data-ecran="comparer"] [data-e]')].find((b) => b.getAttribute('data-e') !== 'absolu' && /style/i.test(b.getAttribute('data-e')))?.click(); });
await dormir(800);
if (await page.$('[data-ecran="comparer"] svg[data-radar="base"][data-objet="houblons"]')) await mesurer('comparer-style', '[data-ecran="comparer"] svg[data-radar="base"][data-objet="houblons"]', true);
else echecs.push('comparer-style : le radar Au style ne s\'ouvre pas dans ce parcours');
await page.evaluate(() => window.__hopPile.close());
await dormir(800);

// ---- Ma bière, vue Radar : des notes posées (dont une à 0 : floral pas senti).
await page.evaluate(() => window.__hopPile.open({ view: 'hopBeer' }));
await page.waitForSelector('[data-ecran="biere"]', { timeout: 60000 });
await dormir(800);
await page.evaluate(() => document.querySelector('[data-ecran="biere"] [data-vue="radar"]')?.click());
await page.waitForSelector('[data-role="degustation"]', { timeout: 30000 }).catch(() => {});
await dormir(500);
for (const [f, n] of [['citrus', 2], ['tropical', 3], ['stoneFruit', 1], ['resin', 2], ['floral', 0]]) {
  await page.evaluate((fam, i) => document.querySelectorAll(`[data-role="degustation"] [data-famille="${fam}"] [role="radio"]`)[i]?.click(), f, n);
  await dormir(150);
}
await dormir(500);
if (await page.$('[data-ecran="biere"] svg[data-radar="base"][data-objet="biere"]')) await mesurer('ma-biere', '[data-ecran="biere"] svg[data-radar="base"][data-objet="biere"]', false);
else echecs.push('ma-biere : le radar de Ma bière ne s\'ouvre pas dans ce parcours');

await browser.close();
fs.writeFileSync(path.join(SORTIE, `bilan-${ETAT}.json`), JSON.stringify(bilan, null, 1) + '\n');
console.log(JSON.stringify(bilan));
if (echecs.length) { console.log(`TROU ECHEC ${echecs.length}`); for (const e of echecs) console.log(' - ' + e); process.exit(1); }
console.log('TROU OK');
