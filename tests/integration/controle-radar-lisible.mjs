// Contrôle Chrome (r2-radar-lisible, D180 et D181, 26.10), sur le radar commun (src/ui/hopIndex/commun/RadarBase.tsx).
// Ses mots sur le radar de Substituer (Lotus contre Caliente et Citra cryo) : « si les traits haché traversent le graph, ça enlève de la
// visibilité » (D180) ; « Les points bleu sont difficile à voir » (D181). Ce n'est pas un test vitest (nom sans .test) : il lance Chrome.
// Usage (racine) :
//   node scripts/with_server.mjs --server "npm run dev -- --port 5251 --strictPort" --port 5251 --env VITE_HOP_V4=on -- node tests/integration/controle-radar-lisible.mjs [--etat=avant|apres] [--rendre=<dossier>]
// Pour l'état « avant » : le même contrôle contre une copie de HEAD (serveur lancé dans cette copie, port à part).
// Écrans (390 × 844, fixtures ?dev-local) : Substituer, Comparer, Ma bière (vue Radar, notes posées), la fiche. Pour chaque radar :
//  D180 : chaque tireté (ligne ou chemin) reste, sur toute sa longueur, à une distance du centre d'au moins 30 % du rayon, ou, si
//         une de ses extrémités est un point bas (moins de 30 % de rayon), d'au moins 85 % du rayon de cette extrémité : un point
//         bas reste un point bas, c'est la corde qui le relie à l'autre côté qui doit s'écarter du centre ;
//  D181 : chaque point de série plein (cercle `data-point` rempli) a 8 px de diamètre au moins à l'écran, un liseré clair (≥ 1 px,
//         luminance ≥ 0,8), et sa couleur de série tient 3:1 sur le fond de la page et sur l'aire (voile) des autres séries qui le
//         recouvre. Les couleurs de série sont lues, jamais changées ; les anneaux creux de l'original sont hors de cette règle.
// Sortie : « LISIBLE OK » ou « LISIBLE ECHEC n » (code 1). Les captures des radars sont écrites pour être ouvertes (L12).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const RACINE = path.resolve(import.meta.dirname, '..', '..');
const { ouvrir } = await import(pathToFileURL(path.join(RACINE, '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);
const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1] ?? d;
const ETAT = arg('etat', 'controle');
const SORTIE = arg('rendre', path.join(os.tmpdir(), 'controle-radar-lisible'));
fs.mkdirSync(SORTIE, { recursive: true });
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const base = `http://localhost:${process.env.WITH_SERVER_PORTS}`;
const echecs = [];
const bilan = {};

const { browser, page } = await ouvrir({ largeur: 390, hauteur: 844, mobile: true, echelle: 2 });
await page.goto(`${base}/?dev-local&etape=houblons`, { waitUntil: 'networkidle0' });
await page.waitForSelector('[data-ecran="ma-biere"]', { timeout: 120000 });
await dormir(800);

/** Mesure un radar : le sélecteur de son svg ; rend les chiffres et les échecs. Tout se lit dans la page. */
async function mesurer(nom, selecteur) {
  const svg = await page.waitForSelector(selecteur, { timeout: 60000 });
  await svg.evaluate((e) => e.scrollIntoView({ block: 'center' }));
  await dormir(500);
  await svg.screenshot({ path: path.join(SORTIE, `${nom}-${ETAT}.png`) });
  const m = await page.evaluate((sel) => {
    const svgE = document.querySelector(sel);
    const lum = (c) => { const v = c.map((x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
    const ctr = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
    const rgb = (s) => { const r = /rgba?\(([^)]+)\)/.exec(s ?? ''); if (!r) return null; const p = r[1].split(/[ ,/]+/).map(Number); return { c: p.slice(0, 3), a: p.length > 3 ? p[3] : 1 }; };
    let f = svgE, fond = null;
    while (f && !fond) { const b = rgb(getComputedStyle(f).backgroundColor); if (b && b.a > 0.9) fond = b.c; f = f.parentElement; }
    fond = fond ?? [255, 255, 255];
    const k = svgE.getBoundingClientRect().width / svgE.viewBox.baseVal.width;
    const [cx, cy] = svgE.getAttribute('data-centre').split(',').map(Number);
    const RR = 124; // le rayon du radar commun, en unités du viewBox
    const dist = (p) => Math.hypot(p.x - cx, p.y - cy);
    const echecs = [], tires = [], points = [];
    // D180 : les tiretés.
    for (const t of svgE.querySelectorAll('[data-role="tirete"]')) {
      const L = t.getTotalLength(), a = t.getPointAtLength(0), b = t.getPointAtLength(L);
      let mini = Infinity;
      for (let s = 0; s <= 120; s++) mini = Math.min(mini, dist(t.getPointAtLength((L * s) / 120)));
      const seuil = Math.min(0.3 * RR, 0.85 * Math.min(dist(a), dist(b)));
      const ok = mini >= seuil - 0.01;
      tires.push({ serie: t.closest('[data-serie]')?.getAttribute('data-serie'), balise: t.tagName, auCentre: Math.round((100 * mini) / RR), seuil: Math.round((100 * seuil) / RR), ok });
      if (!ok) echecs.push(`tireté de « ${t.closest('[data-serie]')?.getAttribute('data-serie')} » à ${Math.round((100 * mini) / RR)} % du rayon du centre (seuil ${Math.round((100 * seuil) / RR)} %) : il coupe le radar`);
      // Critique r2 (Comparer, Absolu) : un tireté ne monte pas au bord en rayon. Au-delà du plus haut de ses deux points (+ 2),
      // il n'a le droit d'être que le long d'un secteur hachuré (sans donnée, ou « pas goûté » de Ma bière), à 4 px près.
      const haut = Math.max(dist(a), dist(b)) + 2, hach = [...svgE.querySelectorAll('[data-role="secteur-sans-donnee"], [data-role="secteur-inconnu"]')];
      let hors = 0;
      for (let s = 0; s <= 120; s++) {
        const p = t.getPointAtLength((L * s) / 120);
        if (dist(p) <= haut) continue;
        const pres = hach.some((h) => [[0, 0], [4, 0], [-4, 0], [0, 4], [0, -4]].some(([dx, dy]) => h.isPointInFill(new DOMPoint(p.x + dx, p.y + dy))));
        if (!pres) hors++;
      }
      if (hors > 2) echecs.push(`tireté de « ${t.closest('[data-serie]')?.getAttribute('data-serie')} » : monte au bord hors de tout secteur hachuré (${hors} points sur 121 plus loin que ses extrémités) : un rayon qui traverse la vue`);
    }
    // D181 : les points pleins.
    const voiles = [...svgE.querySelectorAll('g[data-serie] [data-role="voile"]')];
    for (const c of svgE.querySelectorAll('circle[data-point]')) {
      const cs = getComputedStyle(c), fill = rgb(cs.fill);
      if (!fill || cs.fill === 'none') continue;
      const nom = c.closest('[data-serie]')?.getAttribute('data-serie');
      const diam = 2 * parseFloat(c.getAttribute('r')) * k;
      const lis = rgb(cs.stroke), lisL = parseFloat(cs.strokeWidth);
      const pt = new DOMPoint(parseFloat(c.getAttribute('cx')), parseFloat(c.getAttribute('cy')));
      let bg = fond.slice(), minAire = ctr(fill.c, fond);
      for (const v of voiles) {
        if (v.closest('[data-serie]') === c.closest('[data-serie]')) continue;
        if (!v.isPointInFill(pt)) continue;
        const cv = rgb(getComputedStyle(v).fill), op = parseFloat(getComputedStyle(v).fillOpacity);
        bg = bg.map((x, i) => x * (1 - op) + cv.c[i] * op);
        minAire = Math.min(minAire, ctr(fill.c, bg));
      }
      const e = [];
      if (diam < 8) e.push(`diamètre ${diam.toFixed(1)} px (8 au moins)`);
      if (!lis || !(lisL >= 1) || lum(lis.c) < 0.8) e.push(`pas de liseré clair (trait ${cs.stroke} de ${lisL} px)`);
      if (ctr(fill.c, fond) < 3) e.push(`contraste ${ctr(fill.c, fond).toFixed(2)}:1 sur le fond (3 au moins)`);
      if (minAire < 3) e.push(`contraste ${minAire.toFixed(2)}:1 sur l'aire d'une autre série (3 au moins)`);
      points.push({ serie: nom, famille: c.getAttribute('data-point'), diametre: Math.round(diam * 10) / 10, fond: Math.round(ctr(fill.c, fond) * 100) / 100, aire: Math.round(minAire * 100) / 100, ok: !e.length });
      if (e.length) echecs.push(`point ${c.getAttribute('data-point')} de « ${nom} » : ${e.join(' ; ')}`);
    }
    return { echecs, tires, points, echelle: Math.round(k * 1000) / 1000, groupe: !!svgE.querySelector('[data-role="secteur-sans-donnee"]') };
  }, selecteur);
  bilan[nom] = { echelle: m.echelle, secteurSansDonnee: m.groupe, tiretes: m.tires, pointsMin: Math.min(...m.points.map((p) => p.diametre), 99), points: m.points.length, aireMin: Math.min(...m.points.map((p) => p.aire), 99), fondMin: Math.min(...m.points.map((p) => p.fond), 99) };
  // Un radar sans aucun point ni tireté ne prouve rien : on le dit (un écran qui n'a rien à mesurer n'est pas un vert).
  if (!m.points.length && !m.tires.length) echecs.push(`${nom} : rien à mesurer (ni point ni tireté)`);
  const vus = new Set();
  for (const e of m.echecs) { if (vus.has(e)) continue; vus.add(e); echecs.push(`${nom} : ${e}`); }
  return m;
}

// ---- La fiche de Lotus (radar absolu, une série) : ouverte par l'appui long sur la carte.
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
  if (fiche) { await dormir(800); await mesurer('fiche', '[data-ecran="fiche"] svg[data-radar="base"][data-objet="fiche"]'); await page.keyboard.press('Escape'); await dormir(900); }
  else echecs.push('fiche : le radar de la fiche de Lotus ne s\'ouvre pas dans ce parcours');
  if (await page.$('[data-ecran="fiche"]')) { await page.click('[aria-label="Fermer"]').catch(() => {}); await dormir(800); }
}

// ---- Substituer : Lotus contre Caliente et Citra cryo (le cas de sa capture), sinon les deux premiers de la liste.
await page.evaluate((k) => window.__hopPile.open({ view: 'hopSubstitute', hopKey: k }), lotus);
await page.waitForSelector('[data-ecran="substituer"] [data-remplacant]', { timeout: 90000 });
await dormir(800);
const liste = await page.evaluate(() => [...document.querySelectorAll('[data-ecran="substituer"] [data-remplacant]')].map((x) => ({ cle: x.getAttribute('data-remplacant'), nom: x.getAttribute('data-houblon-rang') })));
const voulus = ['Caliente', 'Citra cryo'];
const choisis = voulus.map((n) => liste.find((x) => x.nom === n)).filter(Boolean);
for (const x of liste) if (choisis.length < 2 && !choisis.includes(x)) choisis.push(x);
bilan.substituerCompares = choisis.map((x) => x.nom);
for (const x of choisis) {
  await page.evaluate((c) => document.querySelector(`[data-ecran="substituer"] [data-remplacant="${c}"]`)?.click(), x.cle);
  await dormir(600);
}
await page.waitForSelector('svg[data-radar="base"][data-objet="houblons"]', { timeout: 30000 });
await mesurer('substituer', '[data-ecran="substituer"] svg[data-radar="base"][data-objet="houblons"]');
await page.evaluate(() => window.__hopPile.close());
await dormir(800);

// ---- Comparer (Absolu, puis la vue d'ouverture) : les mêmes trois houblons.
await page.evaluate((h) => window.__hopPile.open({ view: 'hopCompare', hops: h }), [lotus, ...choisis.map((x) => x.cle)]);
await page.waitForSelector('[data-ecran="comparer"] [data-e="absolu"]', { timeout: 90000 });
await dormir(1500);
await page.click('[data-ecran="comparer"] [data-e="absolu"]');
await dormir(800);
await mesurer('comparer-absolu', '[data-ecran="comparer"] svg[data-radar="base"][data-objet="houblons"]');
await page.evaluate(() => { [...document.querySelectorAll('[data-ecran="comparer"] [data-e]')].find((b) => b.getAttribute('data-e') !== 'absolu' && /style/i.test(b.getAttribute('data-e')))?.click(); });
await dormir(800);
if (await page.$('[data-ecran="comparer"] svg[data-radar="base"][data-objet="houblons"]')) await mesurer('comparer-style', '[data-ecran="comparer"] svg[data-radar="base"][data-objet="houblons"]');
await page.evaluate(() => window.__hopPile.close());
await dormir(800);

// ---- Ma bière, vue Radar : des notes posées (citrus, tropical, résine ; les autres restent « pas goûté » : tiretés en place).
await page.evaluate(() => window.__hopPile.open({ view: 'hopBeer' }));
await page.waitForSelector('[data-ecran="biere"]', { timeout: 60000 });
await dormir(800);
await page.evaluate(() => document.querySelector('[data-ecran="biere"] [data-vue="radar"]')?.click());
await page.waitForSelector('[data-role="degustation"]', { timeout: 30000 }).catch(() => {});
await dormir(500);
for (const [f, n] of [['citrus', 2], ['tropical', 3], ['stoneFruit', 1], ['resin', 2], ['floral', 1]]) {
  await page.evaluate((fam, i) => document.querySelectorAll(`[data-role="degustation"] [data-famille="${fam}"] [role="radio"]`)[i]?.click(), f, n);
  await dormir(150);
}
await dormir(500);
if (await page.$('[data-ecran="biere"] svg[data-radar="base"][data-objet="biere"]')) await mesurer('ma-biere', '[data-ecran="biere"] svg[data-radar="base"][data-objet="biere"]');
else echecs.push('ma-biere : le radar de Ma bière ne s\'ouvre pas dans ce parcours');

await browser.close();
fs.writeFileSync(path.join(SORTIE, `bilan-${ETAT}.json`), JSON.stringify(bilan, null, 1) + '\n');
console.log(JSON.stringify(bilan));
if (echecs.length) { console.log(`LISIBLE ECHEC ${echecs.length}`); for (const e of echecs) console.log(' - ' + e); process.exit(1); }
console.log('LISIBLE OK');
