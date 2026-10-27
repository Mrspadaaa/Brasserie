// c8 : temps entre le toucher et l'outil rendu (Dryhopper), et longues tâches, à froid (outil ouvert tout de suite après le chargement de la page,
// avant le préchargement au repos) et à chaud (après lui). Rejoue N fois dans un contexte neuf (cache vide) à chaque fois.
// Dev local : le build de l'app (composés à part) se simule par VITE_COMPOSES_A_PART=on dans l'environnement du serveur ; sans lui, les composés
// sont en synchrone (l'état d'avant). Chaque variante se lance par :
//   node scripts/with_server.mjs --server "npm run dev -- --port P --strictPort" --port P --env VITE_HOP_V4=on [--env VITE_COMPOSES_A_PART=on] -- node <ce fichier> [étiquette]
// Sortie : une ligne JSON par scénario (ms au dixième) et « OUVERTURE <étiquette> OK » ; le tableau est copié dans RESULTAT.md.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const RACINE = path.resolve(import.meta.dirname, '..', '..', '..', '..', '..');
const { ouvrir } = await import(pathToFileURL(path.join(RACINE, '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);
const port = process.env.WITH_SERVER_PORTS;
if (!port) { console.log('OUVERTURE ECHEC : lance-le par scripts/with_server.mjs'); process.exit(1); }
const etiquette = process.argv[2] ?? 'sans-etiquette';
const N = Number(process.env.OUVERTURE_N ?? 5);
const base = `http://localhost:${port}`;
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const CLE = 'laffinee_recipe_draft_v1:dev-local:apercu-etape-houblons';
const mediane = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const un = (x) => Math.round(x * 10) / 10;

async function essai(froid) {
  const { browser, page } = await ouvrir({ largeur: 390, hauteur: 844 });
  try {
    await page.evaluateOnNewDocument(() => {
      window.__longues = [];
      try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__longues.push(e.duration); }).observe({ entryTypes: ['longtask'] }); } catch { /* absent */ }
    });
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
    const t0 = Date.now();
    await page.goto(`${base}/?dev-local&etape=houblons&recette=vide`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-role="ligne-houblon"]', { timeout: 120000 });
    // À froid : on touche tout de suite (le préchargement au repos n'a pas eu lieu). À chaud : on laisse passer le repos (10 s au plus).
    if (!froid) await dormir(12000);
    await page.waitForFunction(() => !!window.__hopPile, { timeout: 60000 });
    const avant = await page.evaluate(() => window.__longues.length);
    const ms = await page.evaluate(async () => {
      const t = performance.now();
      window.__hopPile.open({ view: 'hopTiming', additionId: 'a2' });
      await new Promise((ok) => { const f = () => (document.querySelector('[data-ecran="dryhopper"] [data-bandeau]') ? ok() : requestAnimationFrame(f)); f(); });
      return performance.now() - t;
    });
    await dormir(600);
    const longues = await page.evaluate((a) => window.__longues.slice(a), avant);
    return { ms, longues: longues.length, pire: longues.length ? Math.max(...longues) : 0, delaiPage: Date.now() - t0 };
  } finally { await browser.close(); }
}

const sortie = {};
for (const [nom, froid] of [['froid', true], ['chaud', false]]) {
  const rs = [];
  for (let i = 0; i < N; i++) rs.push(await essai(froid));
  sortie[nom] = { n: N, medianeMs: un(mediane(rs.map((r) => r.ms))), maxMs: un(Math.max(...rs.map((r) => r.ms))), longuesTaches: rs.reduce((s, r) => s + r.longues, 0), pireLongueMs: un(Math.max(...rs.map((r) => r.pire))), brut: rs.map((r) => un(r.ms)) };
  console.log(JSON.stringify({ etiquette, scenario: nom, ...sortie[nom] }));
}
fs.writeFileSync(path.join(os.tmpdir(), `c8-ouverture-${etiquette}.json`), JSON.stringify(sortie, null, 1));
console.log(`OUVERTURE ${etiquette} OK`);
