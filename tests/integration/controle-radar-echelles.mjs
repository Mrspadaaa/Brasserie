// Contrôle Chrome (r3-radar-echelles, 27.10), sur le radar de Comparer (src/ui/hopIndex/comparer/Radar.tsx, commun/RadarBase.tsx).
// Ses mots sur Citra cryo contre Nectaron :
//  D189 : « Le radargraph au style ne change pas de taille... Quand je change le timing. Je vois les valeurs changé mais la la taille du radar graph ».
//  D187 : « Le radargraph en absolue à aucun sens, il faudrait montré la plage type du style et normalisé aux extrêmes mais là c'est illisible ».
// Règle de D68 (25.10), conciliée : au style l'échelle est celle du style, la MÊME à tous les moments ; ce qui bouge avec le moment, ce
// sont les valeurs. En Absolu, pas de normalisation au style : une échelle du minimum au maximum des valeurs et de la plage type du style,
// et cette plage est dessinée en bande.
//
// Deux familles de vérifications, lues sur le rendu (390 × 844, fixtures ?dev-local) :
//  D189, Au style, aux cinq moments (60′, 10′, whirlpool, dry hop actif, dry hop après) :
//    - le maximum écrit près de chaque picto (`data-role="max-axe"`) est le même à tous les moments (l'échelle ne bouge pas) ;
//    - pour chaque paire de moments dont la somme des valeurs de la retenue change de 15 % ou plus, la surface du polygone de la
//      retenue change dans le même sens ; et le dry hop après est plus grand que 60′ si ses valeurs le sont.
//  D187, Absolu :
//    - la bande de la plage type du style existe (`data-role="bande-style"`, au moins 3 sommets) ;
//    - aucune série de houblon (retenue, autres) n'est tassée au centre : son point le plus loin dépasse le petit anneau du zéro d'au
//      moins 15 % de la distance de cet anneau au bord (le rayon utile ; le 0 est un petit anneau, jamais le centre, D114). Ta bière
//      (trait noir) n'est pas jugée : sans houblon elle est honnêtement près de 0, et l'étirer inventerait une valeur.
// Ce n'est pas un test vitest (nom sans .test) : il lance Chrome. Usage (racine) :
//   node scripts/with_server.mjs --server "npm run dev -- --port 5281 --strictPort" --port 5281 --env VITE_HOP_V4=on -- node tests/integration/controle-radar-echelles.mjs [--etat=avant|apres] [--rendre=<dossier>]
// Pour l'état « avant » : le même contrôle contre une copie de HEAD (serveur lancé dans cette copie, port à part).
// Sortie : « ECHELLES OK » ou « ECHELLES ECHEC n » (code 1). Les captures sont écrites pour être ouvertes (L12).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const RACINE = path.resolve(import.meta.dirname, '..', '..');
const { ouvrir } = await import(pathToFileURL(path.join(RACINE, '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);
const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1] ?? d;
const ETAT = arg('etat', 'controle');
const SORTIE = arg('rendre', path.join(os.tmpdir(), 'controle-radar-echelles'));
const HOUBLONS = (arg('houblons', 'beermaverick-citra:cryo,beermaverick-nectaron')).split(',');
const SEUIL_TASSE = 0.15;
const SEUIL_VALEURS = 0.15;
fs.mkdirSync(SORTIE, { recursive: true });
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const base = `http://localhost:${process.env.WITH_SERVER_PORTS}`;
const echecs = [];
const bilan = { houblons: HOUBLONS };
const SEL = '[data-ecran="comparer"] svg[data-radar="base"][data-objet="houblons"]';
const MOMENTS = [
  ['60', 'à 60′'], ['10', 'à 10′'], ['whirlpool', 'au whirlpool'], ['dryhop-actif', 'au dry hop actif'], ['dryhop-apres', 'au dry hop après'],
];

const { browser, page } = await ouvrir({ largeur: 390, hauteur: 844, mobile: true, echelle: 2 });
await page.goto(`${base}/?dev-local&etape=houblons`, { waitUntil: 'networkidle0' });
await page.waitForSelector('[data-ecran="ma-biere"]', { timeout: 120000 });
await dormir(800);
await page.evaluate((h) => window.__hopPile.open({ view: 'hopCompare', hops: h }), HOUBLONS);
await page.waitForSelector('[data-ecran="comparer"] [data-e="absolu"]', { timeout: 90000 });
await dormir(1500);
await page.waitForSelector(SEL, { timeout: 60000 });

/** Ce que le rendu dit du radar : rayons utiles, séries, maxima par axe. Tout est lu sur le dessin. */
function lire(sel) {
  const svg = document.querySelector(sel);
  const [cx, cy] = svg.getAttribute('data-centre').split(',').map(Number);
  const anneaux = [...svg.querySelectorAll('[data-anneau]')];
  const rayon = (poly) => { const [x, y] = poly.getAttribute('points').split(' ')[0].split(',').map(Number); return Math.hypot(x - cx, y - cy); };
  const r0 = rayon(anneaux.find((a) => a.getAttribute('data-anneau') === '0'));
  const RR = rayon(anneaux[anneaux.length - 1]);
  const etendue = (x, y) => (Math.hypot(x - cx, y - cy) - r0) / (RR - r0);
  const nombre = (s) => Number(String(s).replace(',', '.'));
  const series = [...svg.querySelectorAll('g[data-serie]')].map((g) => {
    const pts = [...g.querySelectorAll('circle[data-point]')].map((c) => ({ f: c.getAttribute('data-point'), v: nombre(c.getAttribute('data-valeur')), x: Number(c.getAttribute('cx')), y: Number(c.getAttribute('cy')) }));
    let aire = 0;
    for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; aire += a.x * b.y - b.x * a.y; }
    return { nom: g.getAttribute('data-serie'), retenue: g.getAttribute('class') === 'plein', n: pts.length, somme: pts.reduce((s, p) => s + p.v, 0), aire: Math.abs(aire) / 2, etendueMax: pts.length ? Math.max(...pts.map((p) => etendue(p.x, p.y))) : null };
  });
  const ref = svg.querySelector('polygon[data-role="reference"]');
  if (ref) {
    const pts = ref.getAttribute('points').split(' ').map((p) => p.split(',').map(Number));
    series.push({ nom: `ref : ${ref.getAttribute('data-reference')}`, retenue: false, n: pts.length, somme: null, aire: null, etendueMax: Math.max(...pts.map(([x, y]) => etendue(x, y))) });
  }
  const bande = svg.querySelector('[data-role="bande-style"]');
  const maxAxe = Object.fromEntries([...svg.querySelectorAll('[data-axe] [data-role="max-axe"]')].map((t) => [t.parentElement.getAttribute('data-axe'), t.textContent]));
  const sommets = bande ? (bande.getAttribute('points') ?? bande.getAttribute('d') ?? '').split(/[ ML]+/).filter((s) => /\d/.test(s)).length : 0;
  return { mode: svg.getAttribute('data-mode'), moment: svg.getAttribute('data-moment'), echelle: svg.getAttribute('data-echelle'), parAxe: svg.getAttribute('data-echelle-axe'), r0: Math.round(r0 * 10) / 10, RR: Math.round(RR * 10) / 10, series, maxAxe, bande: !!bande, sommetsBande: sommets };
}
const radar = () => page.evaluate(lire, SEL);
async function capturer(nom) {
  const svg = await page.$(SEL);
  await svg.evaluate((e) => e.scrollIntoView({ block: 'center' }));
  await dormir(400);
  await svg.screenshot({ path: path.join(SORTIE, `${nom}-${ETAT}.png`) });
  // Le haut de l'écran en plus : le sélecteur de moment, le radar et les rangées, tel que le brasseur le voit.
  await page.screenshot({ path: path.join(SORTIE, `${nom}-page-${ETAT}.png`) });
}

// ---- D189 : Au style, les cinq moments.
await page.click('[data-ecran="comparer"] [data-e="style"]');
await dormir(600);
const style = {};
for (const [dm, dit] of MOMENTS) {
  await page.evaluate((d) => document.querySelector(`[data-role="quand-comparer"] [data-moment="${d}"]`)?.click(), dm);
  await page.waitForFunction((s, t) => document.querySelector(s)?.getAttribute('data-moment') === t, { timeout: 30000 }, SEL, dit).catch(() => {});
  await dormir(700);
  style[dm] = await radar();
  if (dm === '60' || dm === 'dryhop-apres') await capturer(`style-${dm}`);
}
bilan.style = Object.fromEntries(Object.entries(style).map(([k, v]) => [k, { moment: v.moment, echelle: v.parAxe, maxAxe: v.maxAxe, retenue: v.series.filter((s) => s.retenue).map((s) => ({ nom: s.nom, n: s.n, somme: Math.round(s.somme * 100) / 100, aire: Math.round(s.aire) })) }]));

const ok = (cond, msg) => { if (!cond) echecs.push(msg); };
for (const [dm, dit] of MOMENTS) ok(style[dm].mode === 'style' && style[dm].moment === dit, `D189 : le radar n'est pas au style « ${dit} » (mode ${style[dm].mode}, moment ${style[dm].moment})`);
// L'échelle ne bouge pas : le maximum écrit près de chaque picto, identique à tous les moments.
{
  const ref = style['dryhop-apres'].maxAxe;
  for (const [dm] of MOMENTS) {
    const m = style[dm].maxAxe;
    const communs = Object.keys(ref).filter((f) => f in m);
    ok(communs.length >= 3, `D189 : à ${dm}, moins de 3 axes ont un maximum écrit en commun avec le dry hop (${communs.length})`);
    const diff = communs.filter((f) => m[f] !== ref[f]).map((f) => `${f} ${m[f]} ≠ ${ref[f]}`);
    ok(diff.length === 0, `D189 : l'échelle au style change avec le moment (60′… ${dm} contre dry hop après) : ${diff.join(' ; ')}`);
  }
}
// La surface de la retenue suit les valeurs.
{
  const ret = (dm) => style[dm].series.find((s) => s.retenue);
  const paires = [];
  for (let i = 0; i < MOMENTS.length; i++) for (let j = i + 1; j < MOMENTS.length; j++) paires.push([MOMENTS[i][0], MOMENTS[j][0]]);
  let jugees = 0;
  for (const [a, b] of paires) {
    const A = ret(a), B = ret(b);
    if (!A || !B || A.n < 3 || B.n < 3 || !(A.somme > 0)) continue;
    const dv = (B.somme - A.somme) / A.somme;
    if (Math.abs(dv) < SEUIL_VALEURS) continue;
    jugees++;
    const da = A.aire > 0 ? (B.aire - A.aire) / A.aire : null;
    ok(da != null && Math.sign(da) === Math.sign(dv), `D189 : de ${a} à ${b}, les valeurs de la retenue ${dv > 0 ? 'montent' : 'baissent'} de ${Math.round(dv * 100)} % et la surface du radar change de ${da == null ? '?' : Math.round(da * 100)} %`);
  }
  ok(jugees >= 1, 'D189 : aucune paire de moments dont les valeurs changent de 15 % ou plus : le contrôle ne prouve rien (choisir d\'autres houblons)');
  bilan.pairesJugees = jugees;
}

// ---- D187 : Absolu.
await page.click('[data-ecran="comparer"] [data-e="absolu"]');
await page.evaluate(() => document.querySelector('[data-role="quand-comparer"] [data-moment="dryhop-apres"]')?.click());
await dormir(1000);
const absolu = await radar();
await capturer('absolu');
bilan.absolu = { echelle: absolu.echelle, bande: absolu.bande, sommetsBande: absolu.sommetsBande, r0: absolu.r0, RR: absolu.RR, series: absolu.series.map((s) => ({ nom: s.nom, n: s.n, etendueMax: s.etendueMax == null ? null : Math.round(s.etendueMax * 100) / 100 })) };
ok(absolu.mode === 'absolu', `D187 : le radar n'est pas en Absolu (${absolu.mode})`);
ok(absolu.bande, 'D187 : la bande de la plage type du style n\'est pas dessinée (data-role="bande-style")');
ok(!absolu.bande || absolu.sommetsBande >= 3, `D187 : la bande du style a ${absolu.sommetsBande} sommets`);
ok(absolu.series.length >= 2, `D187 : moins de deux séries lues en Absolu (${absolu.series.length})`);
// Ta bière (le trait noir, `ref : …`) est exclue de la règle : sans houblon, elle est honnêtement près de 0 sur ces familles ; l'étirer serait
// inventer une valeur. Son étendue reste dans le bilan.
for (const s of absolu.series) {
  if (s.etendueMax == null || s.nom.startsWith('ref : ')) continue;
  ok(s.etendueMax >= SEUIL_TASSE, `D187 : « ${s.nom} » est tassée au centre : son point le plus loin n'est qu'à ${Math.round(s.etendueMax * 100)} % du rayon utile (seuil ${SEUIL_TASSE * 100} %)`);
}

await browser.close();
fs.writeFileSync(path.join(SORTIE, `bilan-${ETAT}.json`), JSON.stringify(bilan, null, 1) + '\n');
console.log(JSON.stringify(bilan));
if (echecs.length) { console.log(`ECHELLES ECHEC ${echecs.length}`); for (const e of echecs) console.log(' - ' + e); process.exit(1); }
console.log('ECHELLES OK');
