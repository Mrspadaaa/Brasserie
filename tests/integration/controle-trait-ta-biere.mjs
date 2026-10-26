// Contrôle Chrome (a2-demande-reelle, D156 étendu) : le trait de référence « ta bière » se voit sur les radars de Comparer (Absolu) et de
// Suggérer, même quand une série décrit la même valeur que lui. Même défaut que le contour de Galaxy sur Substituer : le trait
// était dessiné SOUS les séries (commun/RadarBase.tsx) ; un houblon qui n'ajoute rien sur une famille a la valeur de ta bière
// et le recouvrait. Ce n'est pas un test vitest (nom sans .test) : il lance Chrome et lit la capture au pixel.
// Usage (racine) :
//   node scripts/with_server.mjs --server "npm run dev -- --port 5251 --strictPort" --port 5251 --env VITE_HOP_V4=on -- node tests/integration/controle-trait-ta-biere.mjs [--etat=avant|apres] [--rendre=<dossier>]
// Par radar : le long de chaque côté du polygone « ta bière », la part des pixels à la couleur du trait (70 % au moins, trait
// plein) ; autour de chaque sommet (anneau de 5,6 unités), la part à sa couleur (30 % au moins) ; trait de 2 px au moins.
// Sortie : « TRAIT OK » ou « TRAIT ECHEC n » (code 1).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const RACINE = path.resolve(import.meta.dirname, '..', '..');
const { ouvrir } = await import(pathToFileURL(path.join(RACINE, '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);
const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1] ?? d;
const ETAT = arg('etat', 'controle');
const SORTIE = arg('rendre', path.join(os.tmpdir(), 'controle-trait-ta-biere'));
fs.mkdirSync(SORTIE, { recursive: true });
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const base = `http://localhost:${process.env.WITH_SERVER_PORTS}`;
const CLE = 'laffinee_recipe_draft_v1:dev-local:apercu-etape-houblons';
const echecs = [];
const bilan = {};

const { browser, page } = await ouvrir({ largeur: 390, hauteur: 844, mobile: true, echelle: 2 });
await page.goto(`${base}/?dev-local&etape=houblons`, { waitUntil: 'networkidle0' });
await page.waitForSelector('[data-ecran="ma-biere"]', { timeout: 120000 });
await page.click('[data-role="dose-plus"]');
await dormir(1500);
// Une recette 21C avec un Nugget à 60′ et un Cascade en dry hop (fixture du banc, jamais écrite ailleurs que dans le brouillon local).
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

async function mesurer(nom, selecteurSvg) {
  await page.waitForSelector(`${selecteurSvg} [data-role="reference"]`, { timeout: 60000 });
  const svg = await page.$(selecteurSvg);
  await svg.evaluate((e) => e.scrollIntoView({ block: 'center' }));
  await dormir(500);
  const png = await svg.screenshot({ path: path.join(SORTIE, `${nom}-${ETAT}.png`) });
  const m = await page.evaluate(async (b64, sel) => {
    const svgE = document.querySelector(sel);
    const ref = svgE.querySelector('polygon[data-role="reference"]');
    const cs = getComputedStyle(ref);
    const col = /rgba?\(([^)]+)\)/.exec(cs.stroke)[1].split(/[ ,/]+/).map(Number).slice(0, 3);
    const vb = svgE.viewBox.baseVal;
    const k = svgE.getBoundingClientRect().width / vb.width;
    const img = new Image(); img.src = `data:image/png;base64,${b64}`; await img.decode();
    const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
    const cx = cv.getContext('2d', { willReadFrequently: true }); cx.drawImage(img, 0, 0);
    const dpr = img.width / svgE.getBoundingClientRect().width;
    const proche = (x, y) => { const d = cx.getImageData(Math.round(x * k * dpr), Math.round(y * k * dpr), 1, 1).data; return Math.hypot(d[0] - col[0], d[1] - col[1], d[2] - col[2]) < 60; };
    const P = ref.getAttribute('points').trim().split(/\s+/).map((s) => s.split(',').map(Number));
    // Une référence coupée là où elle est inconnue : le polygone relie les points connus, chaque côté est mesuré.
    const cotes = P.map((p, i) => {
      const q = P[(i + 1) % P.length]; const L = Math.hypot(q[0] - p[0], q[1] - p[1]) * k; let n = 0, tot = 0;
      for (let s = 7; s < L - 7; s += 1) { const t = s / L; tot++; if (proche(p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t)) n++; }
      return tot ? n / tot : 1;
    });
    const anneaux = P.map(([x, y]) => { let n = 0, tot = 0; for (let a = 0; a < 360; a += 15) { tot++; if (proche(x + (5.6 * Math.cos((a * Math.PI) / 180)), y + (5.6 * Math.sin((a * Math.PI) / 180)))) n++; } return n / tot; });
    const nSeries = svgE.querySelectorAll('g[data-serie]').length;
    return { sommets: P.length, largeur: parseFloat(cs.strokeWidth), couleur: col, cotes, anneaux, nSeries };
  }, png.toString('base64'), selecteurSvg);
  bilan[nom] = m;
  if (m.sommets < 3) echecs.push(`${nom} : ${m.sommets} sommets de ta bière (3 au moins)`);
  if (m.largeur < 2) echecs.push(`${nom} : trait de ${m.largeur} px (2 px au moins)`);
  m.cotes.forEach((c, i) => { if (c < 0.7) echecs.push(`${nom} : côté ${i + 1} de ta bière visible sur ${Math.round(c * 100)} % de sa longueur (70 % au moins) : recouvert par une série`); });
  m.anneaux.forEach((a, i) => { if (a < 0.3) echecs.push(`${nom} : sommet ${i + 1} de ta bière sans anneau (${Math.round(a * 100)} % des points autour)`); });
}

// Comparer, en Absolu : chaque houblon est tracé avec ta bière dessous ; un houblon qui n'ajoute rien a ta valeur.
await page.evaluate(() => window.__hopPile.open({ view: 'hopCompare', hops: ['beermaverick-cascade', 'beermaverick-idaho-7', 'beermaverick-galaxy'] }));
await page.waitForSelector('[data-ecran="comparer"] [data-e="absolu"]', { timeout: 90000 });
await dormir(1500);
await page.click('[data-ecran="comparer"] [data-e="absolu"]');
await dormir(800);
await mesurer('comparer-absolu', 'svg[data-radar="base"][data-objet="houblons"]');
await page.evaluate(() => window.__hopPile.close());
await dormir(800);

// Suggérer : « ma bière » est la référence quand une visée est posée.
await page.evaluate(async () => { const m = await import('/src/ui/hopIndex/parcours/visee.ts'); m.poserVisee({ citrus: 2.5, tropical: 2.5 }); });
await page.evaluate(() => window.__hopPile.open({ view: 'hopSuggest' }));
await page.waitForSelector('[data-ecran="suggerer"] [role="radio"]', { timeout: 90000 }).catch(() => {});
await dormir(1500);
// La vue « Radar » (q2b : Barres / Radar) montre ma bière et la voie retenue.
await page.evaluate(() => { [...document.querySelectorAll('[data-ecran="suggerer"] [role="radio"]')].find((b) => /^Radar$/.test(b.textContent.trim()))?.click(); });
await page.waitForSelector('svg[data-radar="base"][data-objet="suggerer"]', { timeout: 60000 }).catch(() => {});
await dormir(1500);
if (await page.$('svg[data-radar="base"][data-objet="suggerer"] [data-role="reference"]')) await mesurer('suggerer', 'svg[data-radar="base"][data-objet="suggerer"]');
else { bilan.suggerer = 'pas de radar avec référence ouvert'; echecs.push('suggerer : aucun radar avec le trait « ma bière » (à ouvrir à la main)'); }

await browser.close();
fs.writeFileSync(path.join(SORTIE, `bilan-${ETAT}.json`), JSON.stringify(bilan, null, 1) + '\n');
console.log(JSON.stringify(bilan));
if (echecs.length) { console.log(`TRAIT ECHEC ${echecs.length}`); for (const e of echecs) console.log(' - ' + e); process.exit(1); }
console.log('TRAIT OK');
