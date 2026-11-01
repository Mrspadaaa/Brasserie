// Voie d60-diagnostic : ouvre Suggérer (ou Substituer) de l'APP, copie propre au commit de production ae7c7a8d, sur une recette de fixture
// avec un amérisant à 60′ ; lit les groupes à l'écran et prend une capture. Rien du dépôt n'est modifié :
// la recette est servie à la place du module de banc `maBiere/apercuDev.ts` (méthode de ecran-bannir.mjs, m9) ; AUCUNE enveloppe sur le moteur :
// l'écran calcule ce que l'app calcule.
// Lancement (depuis la copie propre) :
//   node scripts/with_server.mjs --server "npm run dev -- --port P --strictPort" --port P --env VITE_HOP_V4=on -- node <ce fichier> <cas> <dossier-sortie>
// Cas : stout-agrumes | stout-bannir | hazy-agrumes | stout-substituer
import path from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const COPIE = 'C:/Users/mrspa/AppData/Local/Temp/deploy-63130965';
const { ouvrir } = await import(pathToFileURL(path.join(COPIE, '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const cas = process.argv[2] ?? 'stout-agrumes';
const SORTIE = process.argv[3] ?? '.';
mkdirSync(SORTIE, { recursive: true });

const NUGGET = { name: 'Nugget', alpha: 12, weightG: 46, stage: 'boil', timeMin: 60, hopVarietyId: 'beermaverick-nugget' };
const RECETTES = {
  // stout export S1 (16D) du prototype : 20 L, OG 1,066, US-05, Nugget 46 g à 60′ (buildPack.ts s1Recipe)
  stout: { id: 'stout-d60', name: 'Stout export (S1)', style: '16D', volumeL: 20, boilMin: 60, ogTarget: 1.066, colorEbc: 70,
    fermentables: [{ name: 'Pale ale', weightKg: 4.8, kind: 'grain', use: 'empatage', colorEbc: 6, potentialPpg: 37 }, { name: 'Orge torréfiée', weightKg: 0.6, kind: 'grain', use: 'empatage', colorEbc: 1000, potentialPpg: 25 }],
    hops: [NUGGET], yeast: { name: 'US-05', hopIndexId: 'fermentis-us05' } },
  // 21C hazy du test a2 : Nugget 20 g à 60′ + Cascade 80 g au dry hop actif
  hazy: { id: 'hazy-d60', name: 'Hazy du jeudi (21C)', style: '21C', volumeL: 20, boilMin: 60, ogTarget: 1.058, colorEbc: 8,
    fermentables: [{ name: 'Pilsner', weightKg: 4.2, kind: 'grain', use: 'empatage', colorEbc: 3.5, potentialPpg: 37 }, { name: "Flocons d'avoine", weightKg: 0.8, kind: 'grain', use: 'empatage', colorEbc: 2, potentialPpg: 33 }],
    hops: [{ ...NUGGET, weightG: 20 }, { name: 'Cascade', alpha: 6, weightG: 80, stage: 'dryHop', timeMin: 0, hopVarietyId: 'beermaverick-cascade' }], yeast: { name: 'US-05', hopIndexId: 'fermentis-us05' } },
};
// neipa v3 du brasseur (fixture d'après son export, comme ecran-bannir.mjs de m9) : 22A, 24 L, OG 1,081, Lotus 84 g à 40′, Verdant IPA
RECETTES.neipa = { id: 'neipa-d60', name: 'neipa v3', style: '22A', volumeL: 24, boilMin: 60, ogTarget: 1.081, colorEbc: 10,
  fermentables: [{ name: 'Pilsner', weightKg: 6.6, kind: 'grain', use: 'empatage', colorEbc: 3.5, potentialPpg: 37 }, { name: "Flocons d'avoine", weightKg: 2, kind: 'grain', use: 'empatage', colorEbc: 2, potentialPpg: 33 }],
  hops: [{ name: 'Lotus', alpha: 15, weightG: 84, stage: 'boil', timeMin: 40, hopVarietyId: 'beermaverick-lotus' }], yeast: { name: 'Verdant IPA', hopIndexId: 'lalbrew-verdant-ipa' } };
const CAS = {
  'neipa-bannir': { recette: 'neipa', famille: 'resin', banni: true, ecran: 'suggerer' },
  'stout-agrumes': { recette: 'stout', famille: 'citrus', ecran: 'suggerer' },
  'stout-bannir': { recette: 'stout', famille: 'resin', banni: true, ecran: 'suggerer' },
  'hazy-agrumes': { recette: 'hazy', famille: 'citrus', ecran: 'suggerer' },
  'stout-substituer': { recette: 'stout', ecran: 'substituer' },
};
const c = CAS[cas];
if (!c) throw new Error(`cas inconnu : ${cas}`);
const MODULE = `export function recetteApercuEtapeHoublons() { return ${JSON.stringify(RECETTES[c.recette])}; }\n`;

const port = process.env.WITH_SERVER_PORTS;
const { browser, page, journal } = await ouvrir({ largeur: 390, hauteur: 844, externe: 'laisser' });
await page.setRequestInterception(true);
page.on('request', (r) => {
  const u = r.url();
  if (/\/maBiere\/apercuDev\.ts/.test(u)) r.respond({ status: 200, contentType: 'text/javascript', body: MODULE });
  else if (/^(https?|ws)s?:\/\/(localhost|127\.0\.0\.1)/i.test(u) || /^(data|blob|about|file):/i.test(u)) r.continue();
  else r.abort('blockedbyclient');
});
try {
  await page.goto(`http://localhost:${port}/?dev-local&etape=houblons&calcul=immediat`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('[data-ecran="ma-biere"]', { timeout: 150000 });
  await dormir(2500);
  let visee = null;
  if (c.ecran === 'suggerer') {
    // La visée d'un cran sur la famille (même méthode que ecran-bannir.mjs) ; « bannir » : palier 0.
    const poser = (f, points) => page.evaluate(async (f, p) => { const V = await import('/src/ui/hopIndex/parcours/visee.ts'); V.poserVisee({ [f]: V.enNiveau(p) }); }, f, points);
    if (c.banni) {
      await page.evaluate(async (f) => { const V = await import('/src/ui/hopIndex/parcours/visee.ts'); V.poserVisee({ [f]: 0 }); }, c.famille);
      visee = { [c.famille]: 0 };
    } else {
      await poser(c.famille, 100);
      await dormir(400);
      await page.evaluate(() => window.__hopPile.open({ view: 'hopSuggest' }));
      await page.waitForSelector('[data-ecran="suggerer"] [data-direction]', { timeout: 150000 });
      await dormir(1500);
      const lire = () => page.evaluate((f) => JSON.parse(document.querySelector('[data-ecran="suggerer"] [data-direction]').getAttribute('data-direction'))[f], c.famille);
      const style = RECETTES[c.recette].style;
      const cran = await page.evaluate(async (f, s) => { const A = await import('/src/ui/hopIndex/parcours/adaptateur.ts'); return A.style(s).families[f].cran; }, c.famille, style);
      const k = await lire();
      let points = 100;
      if (k > 1) { points = 100 - (k - 1) * cran; await poser(c.famille, points); await dormir(1500); }
      visee = { [c.famille]: points, cran, kInitial: k, kFinal: await lire() };
      await page.evaluate(() => window.__hopPile.close?.());
      await dormir(300);
    }
    await page.evaluate(() => window.__hopPile.open({ view: 'hopSuggest' }));
    await page.waitForSelector('[data-ecran="suggerer"]', { timeout: 150000 });
    await dormir(9000); // le calcul complet (remplacements) arrive au repos
  } else {
    await page.evaluate(() => window.__hopPile.open({ view: 'hopSubstitute', hopKey: 'beermaverick-nugget' }));
    await page.waitForSelector('[data-ecran="substituer"]', { timeout: 150000 });
    await dormir(5000);
  }
  const lecture = await page.evaluate((ecran) => {
    const racine = document.querySelector(`[data-ecran="${ecran}"]`);
    const txt = (e) => (e?.textContent || '').replace(/\s+/g, ' ').trim();
    const groupes = [...racine.querySelectorAll('section[data-groupe]')].map((g) => ({ id: g.getAttribute('data-groupe'), titre: txt(g.querySelector('h3')).slice(0, 60), nbLignes: g.querySelectorAll('li').length, texte: txt(g).slice(0, 160) }));
    const cartes = [...racine.querySelectorAll('[data-role="objectif"]')].map((o) => txt(o).slice(0, 80));
    const dir = racine.querySelector('[data-direction]')?.getAttribute('data-direction') ?? null;
    return { groupes, cartes, dir, apercu: txt(racine).slice(0, 700) };
  }, c.ecran === 'suggerer' ? 'suggerer' : 'substituer');
  await page.screenshot({ path: path.join(SORTIE, `${cas}.png`), fullPage: true });
  writeFileSync(path.join(SORTIE, `${cas}.json`), `${JSON.stringify({ cas, visee, lecture, erreurs: journal.erreurs.slice(0, 5) }, null, 1)}\n`);
  console.log(JSON.stringify({ cas, visee, groupes: lecture.groupes.map((g) => `${g.id} « ${g.titre} » ${g.nbLignes}`), cartes: lecture.cartes, erreurs: journal.erreurs.slice(0, 3) }, null, 1));
} finally {
  await browser.close();
}
