// Voie m9 : ouvre l'écran Suggérer de l'APP (copie propre, `?dev-local&etape=houblons&calcul=immediat`, VITE_HOP_V4=on) sur sa recette
// « neipa v3 » (fixture d'après son export, comme u3 : 22A, 24 L, OG 1,081, Lotus 84 g à 40′, Verdant IPA), avec une combinaison de f9.
// Rien du dépôt n'est modifié :
// - la recette : la requête du module de banc `apercuDev.ts` est interceptée (méthode de u2 et u3) ;
// - la combinaison : le moteur de l'app est appelé avec les options de f9 (`intensite`, `typicite`, déjà dans le moteur, défaut false),
//   par une enveloppe posée dans la page sur `moteur().proposeVoies` ; la table de typicité est chargée par `chargerTypicite()` du moteur.
//   Les calculs restent ceux de l'app, sur le fil principal (`calcul=immediat`, prévu par l'app pour comparer des captures).
// - la visée : « plus d'<famille> » d'un cran, posée par la porte de l'app (`poserVisee`), comme m6.
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const COPIE = 'C:/Users/mrspa/AppData/Local/Temp/deploy-63130965';
const { ouvrir } = await import(pathToFileURL(path.join(COPIE, '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

export const COMBOS = {
  actuel: { intensite: false, typicite: false },
  A3: { intensite: true, typicite: false },
  'typicité': { intensite: false, typicite: true },
  'A3 + typicité': { intensite: true, typicite: true },
};

const recette = {
  id: 'neipa-v3-m9', name: 'neipa v3', style: '22A', volumeL: 24, boilMin: 60, ogTarget: 1.081, colorEbc: 10,
  fermentables: [
    { name: 'Pilsner', weightKg: 6.6, kind: 'grain', use: 'empatage', colorEbc: 3.5, potentialPpg: 37 },
    { name: "Flocons d'avoine", weightKg: 2, kind: 'grain', use: 'empatage', colorEbc: 2, potentialPpg: 33 },
  ],
  hops: [{ name: 'Lotus', alpha: 15, weightG: 84, stage: 'boil', timeMin: 40, hopVarietyId: 'beermaverick-lotus' }],
  yeast: { name: 'Verdant IPA', hopIndexId: 'lalbrew-verdant-ipa' },
};
const MODULE = `export function recetteApercuEtapeHoublons() { return ${JSON.stringify(recette)}; }\n`;

/** Ouvre Suggérer avec la combinaison et la visée « plus d'<famille> » d'un cran. Rend { browser, page, journal, visee }. */
export async function ouvrirEcran({ combo, famille, moment = 'dryActive', largeur = 390, hauteur = 844 }) {
  const opts = COMBOS[combo] && { ...COMBOS[combo], moments: [moment] };
  if (!opts) throw new Error(`combinaison inconnue : ${combo}`);
  const port = process.env.WITH_SERVER_PORTS;
  const { browser, page, journal } = await ouvrir({ largeur, hauteur, externe: 'laisser' });
  await page.setRequestInterception(true);
  page.on('request', (r) => {
    const u = r.url();
    if (/\/maBiere\/apercuDev\.ts/.test(u)) r.respond({ status: 200, contentType: 'text/javascript', body: MODULE });
    else if (/^(https?|ws)s?:\/\/(localhost|127\.0\.0\.1)/i.test(u) || /^(data|blob|about|file):/i.test(u)) r.continue();
    else r.abort('blockedbyclient');
  });
  await page.goto(`http://localhost:${port}/?dev-local&etape=houblons&calcul=immediat`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('[data-ecran="ma-biere"]', { timeout: 150000 });
  await dormir(1500);
  // La combinaison : l'enveloppe sur le moteur courant, reposée à chaque changement de données (le catalogue plein recrée le moteur).
  await page.evaluate(async (o) => {
    const T = await import('/src/domain/hopIndex/v4/typicite-acces.ts');
    if (o.typicite) await T.chargerTypicite();
    const D = await import('/src/ui/hopIndex/parcours/donnees.ts');
    const M = await import('/src/ui/hopIndex/parcours/mesure.ts');
    const C = await import('/src/ui/hopIndex/parcours/calcul.ts');
    const envelopper = () => {
      const m = D.moteur();
      if (m.__m9) return;
      const origine = m.proposeVoies;
      // Le moment de la page : le dry hop (l'app, sans dry hop dans la recette, rangerait ici le whirlpool d'abord) ; seul ce moment est
      // calculé, comme la question « dry hop actif » de f9 (listes.json). Le reste de l'appel de l'app est gardé tel quel.
      m.proposeVoies = (r, d, x = {}) => origine(r, d, { ...x, moments: o.moments, intensite: o.intensite, typicite: o.typicite });
      m.__m9 = true;
    };
    envelopper();
    D.siDonneesChangent(envelopper);
    M.viderCaches();
    C.calcul().vider?.();
    window.__m9Combo = o;
  }, opts);
  // La visée, d'un cran : d'abord au plus haut (100 points), on lit le nombre de crans k de l'objectif, puis la visée est posée
  // à 100 − (k − 1) crans : l'écart à ma bière tombe entre 0,5 et 1,5 cran, soit un cran (objectifsDe arrondit au cran).
  const poser = (f, points) => page.evaluate(async (f, p) => { const V = await import('/src/ui/hopIndex/parcours/visee.ts'); V.poserVisee({ [f]: V.enNiveau(p) }); }, f, points);
  await poser(famille, 100);
  await dormir(400);
  await page.evaluate(() => window.__hopPile.open({ view: 'hopSuggest' }));
  await page.waitForSelector('[data-ecran="suggerer"] [data-direction]', { timeout: 150000 });
  await dormir(1500);
  const lire = () => page.evaluate((f) => JSON.parse(document.querySelector('[data-ecran="suggerer"] [data-direction]').getAttribute('data-direction'))[f], famille);
  const cran = await page.evaluate(async (f) => { const A = await import('/src/ui/hopIndex/parcours/adaptateur.ts'); return A.style('22A').families[f].cran; }, famille);
  const k = await lire();
  let points = 100;
  if (k > 1) { points = 100 - (k - 1) * cran; await poser(famille, points); await dormir(1500); }
  const k1 = await lire();
  if (k1 !== 1) throw new Error(`visée : ${k1} crans au lieu de 1 (k=${k}, cran=${cran})`);
  await page.waitForSelector('[data-ecran="suggerer"] section[data-groupe]:not([data-groupe="levure"]) li', { timeout: 150000 });
  await dormir(2500);
  const verifie = await page.evaluate(async () => { const D = await import('/src/ui/hopIndex/parcours/donnees.ts'); return !!D.moteur().__m9; });
  if (!verifie) throw new Error('enveloppe perdue');
  return { browser, page, journal, visee: { famille, points, cran, kInitial: k } };
}
