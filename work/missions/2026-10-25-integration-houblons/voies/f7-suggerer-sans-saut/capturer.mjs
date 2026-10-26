// Voie f7-suggerer-sans-saut (D111) : Suggérer en 390 × 844 dans l'app (`?dev-local&etape=houblons`), les 5 cas de f6, dans deux modes :
//   --mode=chauffe : la préchauffe de l'étape a eu lieu avant l'ouverture (cas normal) : l'appel complet est lu d'emblée, aucune arrivée, aucune place réservée ;
//   --mode=froid   : la préchauffe est empêchée (ouverture directe à froid) : premier affichage rapide, appel complet au repos, place réservée (PLACE_REMPLACER_PX).
// Mesure, avant et après l'arrivée de l'appel complet : position (px dans la page) des groupes dry hop et levure, présence de la place réservée, espace entre le groupe qui précède le dry hop et lui
// (le « vide »), verdicts des cartes. Le « repos » du navigateur (requestIdleCallback) est tenu par le script pour que « avant » soit le premier affichage, sans course.
// Usage (racine) : node scripts/with_server.mjs --server "npm run dev -- --port 5293 --strictPort" --port 5293 --env VITE_HOP_V4=on -- node <ce fichier> --mode=chauffe --etiquette=chauffe
// Aucune donnée réelle : le stockage est celui du banc local (9 articles de fixtures simulés, comme f6), aucune requête hors de cette machine.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const RACINE = path.resolve(import.meta.dirname, '..', '..', '..', '..', '..');
const { ouvrir } = await import(pathToFileURL(path.join(RACINE, '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);
const arg = (n) => process.argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const mode = arg('mode') ?? 'chauffe';
const etiquette = arg('etiquette') ?? mode;
const filtre = arg('cas') ?? 'tous';
const sortie = path.resolve(arg('sortie') ?? path.join(import.meta.dirname, 'img'));
fs.mkdirSync(sortie, { recursive: true });
const port = (process.env.WITH_SERVER_PORTS ?? '5293').split(',')[0];
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
    if (/\/apercuDev\.ts(\?|$)/.test(u) && style === '21C') {
      let texte = await (await fetch(u)).text();
      for (const [de, vers] of R21C) if (texte.includes(de)) { texte = texte.split(de).join(vers); patches++; }
      return r.respond({ status: 200, contentType: 'text/javascript; charset=utf-8', body: texte });
    }
    return r.continue();
  });
  // Le repos du navigateur : libre (natif) tant que `__tenir` est faux ; tenu dans une file sinon, libérée par `__relacher()`.
  // En mode froid, la tâche de préchauffe (son code appelle `.prechauffer(`) est écartée : l'étape n'a pas chauffé les apports.
  await page.evaluateOnNewDocument((froid) => {
    const natif = window.requestIdleCallback?.bind(window);
    window.__tenir = false; window.__file = []; window.__ecartees = 0;
    window.requestIdleCallback = (f, o) => {
      if (froid && /\.prechauffer\(/.test(String(f))) { window.__ecartees++; return 0; }
      if (window.__tenir) { window.__file.push(f); return window.__file.length; }
      return natif ? natif(f, o) : window.setTimeout(f, 1);
    };
    window.__relacher = () => { window.__tenir = false; const q = window.__file.splice(0); q.forEach((f) => f()); return q.length; };
  }, mode === 'froid');
  const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
  const mesurer = () => page.evaluate(() => {
    const top = (sel) => { const e = document.querySelector(sel); return e ? Math.round((e.getBoundingClientRect().top + window.scrollY) * 10) / 10 : null; };
    const dry = document.querySelector('[data-groupe="dryhop"]');
    const prev = dry?.previousElementSibling ?? null;
    return {
      groupes: [...document.querySelectorAll('[data-groupe]')].map((g) => g.getAttribute('data-groupe')),
      dryhop: top('[data-groupe="dryhop"]'), levure: top('[data-groupe="levure"]'), remplacer: top('[data-groupe="remplacer"]'),
      place: document.querySelectorAll('[data-groupe="remplacer-place"]').length,
      placeHauteur: Math.round(document.querySelector('[data-groupe="remplacer-place"]')?.getBoundingClientRect().height ?? 0),
      videAvantDryhop: dry && prev ? Math.round((dry.getBoundingClientRect().top - prev.getBoundingClientRect().bottom) * 10) / 10 : null,
      hauteurPage: Math.round(document.documentElement.scrollHeight),
      verdicts: Object.fromEntries([...document.querySelectorAll('[data-role="objectif"]')].map((c) => [c.getAttribute('data-objectif'), c.querySelector('[data-role="reponse"]')?.getAttribute('data-verdict') ?? null])),
      lignes: document.querySelectorAll('[data-groupe]:not([data-groupe="remplacer"]):not([data-groupe="remplacer-place"]):not([data-groupe="levure"]) [data-id]').length,
      lignesRemplacer: document.querySelectorAll('[data-groupe="remplacer"] [data-id]').length,
    };
  });
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
    const ARTICLES = [['Houblon Cryo Hops Citra 24.8%', 65], ['Houblon Galaxy 17.2%', 60], ['Houblon Nelson Sauvin 9.6%', 100], ['Cascade', 60], ['Houblon Motueka 8.1%', 20], ['Houblon Idaho 7 12.7%', 20],
      ['Houblon Sabro 13.4%', 30], ['Houblon Hallertauer Blanc 9.5% CH', 30], ['Houblon Target 11.3%', 5]];
    const ecrit = await page.evaluate(async (articles) => {
      const { StorageService } = await import('/src/services/storage.ts');
      const s = StorageService.getStocks();
      const neufs = articles.map(([name, g], i) => ({ id: `f7-${i}`, ref: `f7-${i}`, name, category: 'Houblon', currentStock: g, unit: 'g', minStock: 0, cost: 0, supplier: 'banc f7' }));
      StorageService.saveStocks({ ...s, rawMaterials: [...s.rawMaterials.filter((x) => !String(x.id).startsWith('f7-') && !String(x.id).startsWith('f6-')), ...neufs] });
      return StorageService.getStocks().rawMaterials.filter((x) => String(x.id).startsWith('f7-')).length;
    }, ARTICLES).catch((e) => `erreur : ${e.message}`);
    if (ecrit !== ARTICLES.length) echecs.push(`${cas.id} : le stock du banc n'a pas été posé (${ecrit})`);
    await attendre(3000); // l'étape est affichée, le repos s'est écoulé : en mode chauffe, la préchauffe a eu lieu
    await page.evaluate(async (v) => { const m = await import('/src/ui/hopIndex/parcours/visee.ts'); m.poserVisee(v); }, cas.visee);
    const chauffe = await page.evaluate(async () => { const m = await import('/src/ui/hopIndex/parcours/mesure.ts'); return m.mesures().filter((x) => x.nom === 'prechauffage:proposerRapide').map((x) => ({ ms: Math.round(x.ms), cache: x.cache })); });
    const ecartees = await page.evaluate(() => window.__ecartees);
    if (mode === 'chauffe' && chauffe.length === 0) echecs.push(`${cas.id} : mode chauffe, mais aucune préchauffe dans le journal du moteur`);
    if (mode === 'froid' && (chauffe.length > 0 || ecartees === 0)) echecs.push(`${cas.id} : mode froid, mais la préchauffe a eu lieu (${chauffe.length}) ou n'a pas été écartée (${ecartees})`);
    await page.evaluate(() => { window.__tenir = true; });
    const t0 = Date.now();
    await page.evaluate(() => window.__hopPile.open({ view: 'hopSuggest' }));
    await page.waitForSelector('[data-ecran="suggerer"] [data-role="pont-comparer"]', { timeout: 60000 });
    await page.waitForSelector('[data-ecran="suggerer"] [aria-label="Objectifs"]', { timeout: 60000 });
    await page.waitForSelector('[data-ecran="suggerer"] [data-role="ligne-levure"], [data-ecran="suggerer"] [data-role="ligne-houblon"]', { timeout: 60000 });
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    const ouverture = Date.now() - t0;
    await haut();
    const avant = await mesurer();
    await vers();
    await page.screenshot({ path: path.join(sortie, `${etiquette}-${cas.id}-avant.png`) });
    const libres = await page.evaluate(() => window.__relacher());
    const t1 = Date.now();
    await page.waitForFunction(() => document.querySelector('[data-groupe="remplacer"]'), { timeout: 4000 }).catch(() => {});
    await attendre(900);
    const arrivee = Date.now() - t1;
    await page.screenshot({ path: path.join(sortie, `${etiquette}-${cas.id}-apres.png`) });
    await haut();
    const apres = await mesurer();
    const ecart = (k) => (avant[k] == null || apres[k] == null ? null : Math.round((apres[k] - avant[k]) * 10) / 10);
    const verdictsChanges = Object.keys(avant.verdicts).filter((f) => avant.verdicts[f] !== apres.verdicts[f]).map((f) => `${f} : ${avant.verdicts[f]} → ${apres.verdicts[f]}`);
    const ligne = { cas: cas.id, mode, preChauffeAvantOuverture: chauffe, ouvertureMs: ouverture, tachesLiberees: libres, arriveeMs: arrivee, avant, apres, ecartDryhop: ecart('dryhop'), ecartLevure: ecart('levure'), verdictsChanges };
    rapport.push(ligne);
    if (ligne.ecartDryhop !== 0 && ligne.ecartDryhop != null) echecs.push(`${cas.id} : le dry hop bouge de ${ligne.ecartDryhop} px`);
    if (ligne.ecartLevure !== 0 && ligne.ecartLevure != null) echecs.push(`${cas.id} : la levure bouge de ${ligne.ecartLevure} px`);
    if (mode === 'chauffe' && (avant.place > 0 || apres.place > 0)) echecs.push(`${cas.id} : une place réservée après préchauffe`);
    if (mode === 'chauffe' && avant.lignesRemplacer !== apres.lignesRemplacer) echecs.push(`${cas.id} : « Remplacer » arrive (${avant.lignesRemplacer} → ${apres.lignesRemplacer} lignes)`);
    console.log(`${cas.id} [${mode}] : préchauffe ${JSON.stringify(chauffe)} · ouverture ${ouverture} ms · Remplacer ${avant.lignesRemplacer} → ${apres.lignesRemplacer} lignes · place ${avant.place}/${apres.place} (${avant.placeHauteur}/${apres.placeHauteur} px) · vide avant dry hop ${avant.videAvantDryhop} → ${apres.videAvantDryhop} px · dry hop ${avant.dryhop} → ${apres.dryhop} (écart ${ecart('dryhop')} px) · levure ${avant.levure} → ${apres.levure} (écart ${ecart('levure')} px) · verdicts changés : ${verdictsChanges.length ? verdictsChanges.join(' ; ') : 'aucun'} · lignes principales ${avant.lignes} → ${apres.lignes}`);
  }
  fs.writeFileSync(path.join(sortie, `${etiquette}.json`), JSON.stringify(rapport, null, 1));
} catch (e) {
  echecs.push(`exception : ${e.message}`);
} finally {
  await browser.close();
}
if (echecs.length) { console.log('CAPTURE ECHEC'); for (const e of echecs) console.log(' -', e); process.exit(1); }
console.log('CAPTURE OK');
