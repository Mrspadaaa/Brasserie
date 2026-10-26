// Voie f6 (D108, point 4) : le chemin `useCalculApres` éprouvé avec le serveur de calcul de la maquette : `?calcul=differe` (fil principal, chaque réponse dans une tâche suivante, sans repli synchrone),
// `worker` (le worker persistant) et `immediat`. Suggérer est le MÊME code que dans l'app (src/ui/hopIndex/suggerer). Visée « plus floral » (la liste arrive, le groupe Remplacer suit au repos)
// puis « moins résineux » (calcul complet d'emblée). Imprime, par mode : qui sert les calculs, la liste à l'arrivée, après le repos, les erreurs de la console.
// Usage (racine) : node scripts/with_server.mjs --server "npx vite --config prototypes/houblons-v4/parcours/vite.config.ts --port 5292 --strictPort" --port 5292 -- node <ce fichier> [--sortie=<dossier>]
// Aucune donnée réelle : la maquette n'a que ses fixtures ; toute requête hors de cette machine est coupée.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const RACINE = path.resolve(import.meta.dirname, '..', '..', '..', '..', '..');
const { ouvrir } = await import(pathToFileURL(path.join(RACINE, '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);
const arg = (n) => process.argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const sortie = path.resolve(arg('sortie') ?? path.join(import.meta.dirname, 'img'));
fs.mkdirSync(sortie, { recursive: true });
const port = (process.env.WITH_SERVER_PORTS ?? '5292').split(',')[0];
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
const echecs = [];
const { browser, page, journal } = await ouvrir({ largeur: 390, hauteur: 844 });
const lire = () => page.evaluate(() => ({
  groupes: [...document.querySelectorAll('[data-ecran="suggerer"] [data-groupe]')].map((g) => g.getAttribute('data-groupe')),
  lignes: document.querySelectorAll('[data-ecran="suggerer"] [data-groupe] [data-id]').length,
  remplacer: document.querySelectorAll('[data-groupe="remplacer"] [data-id]').length,
  direction: document.querySelector('[data-libre="houblon"]')?.getAttribute('data-direction') ?? null,
  visee: JSON.stringify(window.__parcours?.etat?.visee ?? null),
}));
try {
  for (const mode of ['differe', 'worker', 'immediat']) {
    for (const [nom, visee] of [['plus-de-tout', { floral: 2.5, citrus: 2.5, resin: 2.5 }], ['moins-resineux', { resin: 0 }]]) {
      journal.erreurs.length = 0;
      await page.goto(`http://127.0.0.1:${port}/?calcul=${mode}#/ma-biere`, { waitUntil: 'networkidle0' });
      await page.waitForFunction(() => window.__parcours, { timeout: 60000 });
      await attendre(1500);
      await page.evaluate(() => window.__parcours.envoyer({ type: 'recommencer' })); // l'état de la maquette survit au rechargement : repartir de zéro
      await attendre(300);
      for (const [famille, valeur] of Object.entries(visee)) await page.evaluate((f, v) => window.__parcours.envoyer({ type: 'visee/fixer', famille: f, valeur: v }), famille, valeur);
      await page.evaluate(() => { location.hash = '#/suggerer'; });
      await page.waitForSelector('[data-ecran="suggerer"] [aria-label="Objectifs"]', { timeout: 60000 });
      const t0 = Date.now();
      await page.waitForFunction(() => document.querySelectorAll('[data-ecran="suggerer"] [data-groupe] [data-id]').length > 0 || document.querySelector('[data-groupe="levure"], [data-groupe="remplacer"]'), { timeout: 20000 }).catch(() => {});
      const liste = Date.now() - t0;
      const premier = await lire();
      await attendre(3000);
      const apres = await lire();
      const serveur = await page.evaluate(() => document.documentElement.getAttribute('data-serveur-calcul') ?? null);
      await page.screenshot({ path: path.join(sortie, `maquette-${mode}-${nom}.png`) });
      console.log(`  direction ${premier.direction} · visée ${premier.visee}`);
      console.log(`${mode} / ${nom} : liste visible après ${liste} ms (${premier.lignes} lignes, groupes ${premier.groupes.join(',')}) ; après le repos : ${apres.lignes} lignes, Remplacer ${apres.remplacer} lignes, groupes ${apres.groupes.join(',')} ; serveur ${serveur} ; erreurs console ${journal.erreurs.length}`);
      if (apres.lignes === 0) echecs.push(`${mode} / ${nom} : aucune ligne après le repos`);
      if (journal.erreurs.length) echecs.push(`${mode} / ${nom} : ${journal.erreurs.join(' | ')}`);
    }
  }
} catch (e) {
  echecs.push(`exception : ${e.message}`);
} finally {
  await browser.close();
}
if (echecs.length) { console.log('MAQUETTE ECHEC'); for (const e of echecs) console.log(' -', e); process.exit(1); }
console.log('MAQUETTE OK');
