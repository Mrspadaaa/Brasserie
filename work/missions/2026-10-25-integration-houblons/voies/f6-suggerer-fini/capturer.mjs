// Voie f6-suggerer-fini (D108) : Suggérer en 390 × 844 dans l'app (`?dev-local&etape=houblons`), avant et après l'arrivée du groupe « Remplacer … » : position du groupe dry hop et du groupe levure
// (px dans la page), verdicts des cartes, captures. Le « repos du navigateur » (requestIdleCallback) est tenu par le script pour que « avant » soit le premier affichage, sans course.
// Usage (racine) : node scripts/with_server.mjs --server "npm run dev -- --port 5291 --strictPort" --port 5291 --env VITE_HOP_V4=on -- node <ce fichier> --etiquette=reserve --place=0 [--cas=tous]
// --place=N : remplace PLACE_REMPLACER_PX (suggerer/differe.ts) à la volée (aucun fichier écrit). Recettes : la fixture du banc (Stout 16D, Nugget 46 g à 60′) ; « 21C » = la même, patchée en mémoire (20 g, OG 1,058).
// Aucune donnée réelle : le stockage est celui du banc local, aucune requête hors de cette machine.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const RACINE = path.resolve(import.meta.dirname, '..', '..', '..', '..', '..');
const { ouvrir } = await import(pathToFileURL(path.join(RACINE, '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);
const arg = (n) => process.argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const etiquette = arg('etiquette') ?? 'essai';
const place = arg('place') ?? '0';
const filtre = arg('cas') ?? 'tous';
const sortie = path.resolve(arg('sortie') ?? path.join(import.meta.dirname, 'img'));
fs.mkdirSync(sortie, { recursive: true });
const port = (process.env.WITH_SERVER_PORTS ?? '5291').split(',')[0];
const LOCAL = /^(https?|ws)s?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?(\/|$)/i;
const R21C = [['style: "16D"', 'style: "21C"'], ['ogTarget: 1.066', 'ogTarget: 1.058'], ['weightG: 46', 'weightG: 20'], ['name: "Stout export"', 'name: "Pale 21C"'], ['colorEbc: 70', 'colorEbc: 8']];
const CAS = [
  { id: '21C-agrumes', style: '21C', visee: { citrus: 2.5 } },
  { id: '21C-floral-agrumes-moins-resineux', style: '21C', visee: { floral: 1.5, citrus: 2.5, resin: 0 } },
  { id: '16D-floral', style: '16D', visee: { floral: 2.5 } },
  { id: '16D-moins-resineux', style: '16D', visee: { resin: 0 } },
  { id: '16D-floral-tropical', style: '16D', visee: { floral: 1.5, tropical: 1.5 } },
].filter((c) => filtre === 'tous' || c.id === filtre);

const { browser, page } = await ouvrir({ largeur: 390, hauteur: 844, externe: 'laisser' });
const echecs = [], rapport = [];
let style = '16D', patches = 0;
try {
  await page.setRequestInterception(true);
  page.on('request', async (r) => {
    const u = r.url();
    if (/^(data|blob|about|file):/i.test(u)) return r.continue();
    if (!LOCAL.test(u)) return r.abort('blockedbyclient');
    if (/\/suggerer\/differe\.ts(\?|$)/.test(u)) {
      const texte = (await (await fetch(u)).text()).split('export const PLACE_REMPLACER_PX = 0;').join(`export const PLACE_REMPLACER_PX = ${place};`);
      if (!texte.includes(`PLACE_REMPLACER_PX = ${place};`)) echecs.push('PLACE_REMPLACER_PX non remplacée');
      return r.respond({ status: 200, contentType: 'text/javascript; charset=utf-8', body: texte });
    }
    if (/\/apercuDev\.ts(\?|$)/.test(u) && style === '21C') {
      let texte = await (await fetch(u)).text();
      for (const [de, vers] of R21C) if (texte.includes(de)) { texte = texte.split(de).join(vers); patches++; }
      return r.respond({ status: 200, contentType: 'text/javascript; charset=utf-8', body: texte });
    }
    return r.continue();
  });
  // Le repos du navigateur : libre (natif) tant que `__tenir` est faux ; tenu dans une file sinon, libérée par `__relacher()`.
  await page.evaluateOnNewDocument(() => {
    const natif = window.requestIdleCallback?.bind(window);
    window.__tenir = false; window.__file = [];
    window.requestIdleCallback = (f, o) => { if (window.__tenir) { window.__file.push(f); return window.__file.length; } return natif ? natif(f, o) : window.setTimeout(f, 1); };
    window.__relacher = () => { window.__tenir = false; const q = window.__file.splice(0); q.forEach((f) => f()); return q.length; };
  });
  const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
  const mesurer = () => page.evaluate(() => {
    const top = (sel) => { const e = document.querySelector(sel); return e ? Math.round((e.getBoundingClientRect().top + window.scrollY) * 10) / 10 : null; };
    return {
      groupes: [...document.querySelectorAll('[data-groupe]')].map((g) => g.getAttribute('data-groupe')),
      dryhop: top('[data-groupe="dryhop"]'), levure: top('[data-groupe="levure"]'), remplacer: top('[data-groupe="remplacer"]'), place: top('[data-groupe="remplacer-place"]'),
      hauteurPage: Math.round(document.documentElement.scrollHeight),
      verdicts: Object.fromEntries([...document.querySelectorAll('[data-role="objectif"]')].map((c) => [c.getAttribute('data-objectif'), c.querySelector('[data-role="reponse"]')?.getAttribute('data-verdict') ?? null])),
      lignes: document.querySelectorAll('[data-groupe]:not([data-groupe="remplacer"]):not([data-groupe="remplacer-place"]):not([data-groupe="levure"]) [data-id]').length,
      lignesRemplacer: document.querySelectorAll('[data-groupe="remplacer"] [data-id]').length,
    };
  });
  // Défile jusqu'au repère : le dry hop, sinon la levure, placé aux deux tiers de l'écran (même position avant et après pour juger l'écart à l'œil).
  // L'écran défile dans un conteneur de la pile, pas dans la fenêtre : on remonte et on défile le premier ancêtre défilable.
  const haut = async () => {
    await page.evaluate(() => { window.scrollTo(0, 0); for (let e = document.querySelector('[data-ecran="suggerer"]'); e; e = e.parentElement) if (e.scrollTop) e.scrollTop = 0; });
    await attendre(150);
  };
  const vers = async () => {
    await page.evaluate(() => {
      const e = document.querySelector('[data-groupe="dryhop"]') ?? document.querySelector('[data-groupe="levure"]');
      if (!e) return;
      let s = e.parentElement; while (s && !(s.scrollHeight > s.clientHeight + 2 && /(auto|scroll)/.test(getComputedStyle(s).overflowY))) s = s.parentElement;
      const dy = e.getBoundingClientRect().top - 560;
      if (s) s.scrollTop += dy; else window.scrollBy(0, dy);
    });
    await attendre(250);
  };
  for (const cas of CAS) {
    style = cas.style;
    await page.goto(`http://localhost:${port}/?dev-local&etape=houblons`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('[data-hop-v4-etape="houblons"]', { timeout: 120000 });
    if (cas.style === '21C' && patches < R21C.length) echecs.push(`${cas.id} : la recette n'est pas la 21C (${patches}/${R21C.length})`);
    // Le stock des fixtures (articles de f3, comme f5) : le dry hop actif du stock a ses propositions. Écrit dans le cache local du banc, aucune donnée réelle.
    const ARTICLES = [['Houblon Cryo Hops Citra 24.8%', 65], ['Houblon Galaxy 17.2%', 60], ['Houblon Nelson Sauvin 9.6%', 100], ['Cascade', 60], ['Houblon Motueka 8.1%', 20], ['Houblon Idaho 7 12.7%', 20],
      ['Houblon Sabro 13.4%', 30], ['Houblon Hallertauer Blanc 9.5% CH', 30], ['Houblon Target 11.3%', 5]];
    const ecrit = await page.evaluate(async (articles) => {
      const { StorageService } = await import('/src/services/storage.ts');
      const s = StorageService.getStocks();
      const neufs = articles.map(([name, g], i) => ({ id: `f6-${i}`, ref: `f6-${i}`, name, category: 'Houblon', currentStock: g, unit: 'g', minStock: 0, cost: 0, supplier: 'banc f6' }));
      StorageService.saveStocks({ ...s, rawMaterials: [...s.rawMaterials.filter((x) => !String(x.id).startsWith('f6-')), ...neufs] });
      return StorageService.getStocks().rawMaterials.filter((x) => String(x.id).startsWith('f6-')).length;
    }, ARTICLES).catch((e) => `erreur : ${e.message}`);
    if (ecrit !== ARTICLES.length) echecs.push(`${cas.id} : le stock du banc n'a pas été posé (${ecrit})`);
    await attendre(3000); // l'étape est affichée, le repos s'est écoulé : la préchauffe a eu lieu
    await page.evaluate(async (v) => { const m = await import('/src/ui/hopIndex/parcours/visee.ts'); m.poserVisee(v); }, cas.visee);
    // La préchauffe de l'étape Houblons a-t-elle eu lieu avant l'ouverture ? (le journal du moteur nomme ses appels « prechauffage:<nom> »)
    const chauffe = await page.evaluate(async () => { const m = await import('/src/ui/hopIndex/parcours/mesure.ts'); return m.mesures().filter((x) => x.nom === 'prechauffage:proposerRapide').map((x) => ({ ms: Math.round(x.ms), cache: x.cache })); });
    await page.evaluate(() => { window.__tenir = true; });
    const t0 = Date.now();
    await page.evaluate(() => window.__hopPile.open({ view: 'hopSuggest' }));
    await page.waitForSelector('[data-ecran="suggerer"] [data-role="pont-comparer"]', { timeout: 60000 });
    await page.waitForSelector('[data-ecran="suggerer"] [aria-label="Objectifs"]', { timeout: 60000 });
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    const ouverture = Date.now() - t0;
    await haut();
    const avant = await mesurer();
    await vers(); // la zone du groupe « Remplacer » (juste avant le dry hop ou la levure) aux deux tiers de l'écran, pour la voir
    await page.screenshot({ path: path.join(sortie, `${etiquette}-${cas.id}-avant.png`) });
    const libres = await page.evaluate(() => window.__relacher());
    const t1 = Date.now();
    await page.waitForFunction(() => document.querySelector('[data-groupe="remplacer"]'), { timeout: 4000 }).catch(() => {});
    await attendre(900);
    const arrivee = Date.now() - t1;
    // Même défilement qu'avant l'arrivée : l'image montre ce que le brasseur voyait bouger.
    await page.screenshot({ path: path.join(sortie, `${etiquette}-${cas.id}-apres.png`) });
    await haut();
    const apres = await mesurer();
    const ecart = (k) => (avant[k] == null || apres[k] == null ? null : Math.round((apres[k] - avant[k]) * 10) / 10);
    const verdictsChanges = Object.keys(avant.verdicts).filter((f) => avant.verdicts[f] !== apres.verdicts[f]).map((f) => `${f} : ${avant.verdicts[f]} → ${apres.verdicts[f]}`);
    const ligne = { cas: cas.id, place: Number(place), chauffeAvantOuverture: chauffe, ouvertureMs: ouverture, tachesLiberees: libres, arriveeMs: arrivee, avant, apres, ecartDryhop: ecart('dryhop'), ecartLevure: ecart('levure'), verdictsChanges };
    rapport.push(ligne);
    console.log(`${cas.id} : préchauffe avant l'ouverture ${JSON.stringify(chauffe)} · ouverture ${ouverture} ms · groupe Remplacer ${apres.lignesRemplacer ? apres.lignesRemplacer + ' lignes' : 'absent'} · dry hop ${avant.dryhop} → ${apres.dryhop} (écart ${ecart('dryhop')} px) · levure ${avant.levure} → ${apres.levure} (écart ${ecart('levure')} px) · verdicts changés : ${verdictsChanges.length ? verdictsChanges.join(' ; ') : 'aucun'} · lignes principales ${avant.lignes} → ${apres.lignes}`);
  }
  fs.writeFileSync(path.join(sortie, `${etiquette}.json`), JSON.stringify(rapport, null, 1));
} catch (e) {
  echecs.push(`exception : ${e.message}`);
} finally {
  await browser.close();
}
if (echecs.length) { console.log('CAPTURE ECHEC'); for (const e of echecs) console.log(' -', e); process.exit(1); }
console.log('CAPTURE OK');
