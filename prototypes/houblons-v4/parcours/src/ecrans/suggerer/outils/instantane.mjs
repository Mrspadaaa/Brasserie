// Instantané du moteur pour Suggérer, au format des cas du lot 15 (donnees/c1.json : voies[].tout, voies[].fiches),
// pour que controle-autres-ajouts (D76) et controle-usage-intensite (D80) se jouent sur l'écran calculé en direct.
// La page porte <body data-cas="…/cas-direct"> ; les contrôles lisent ce fichier depuis leur dossier de cas.
// Ce n'est PAS une donnée de l'écran : l'écran calcule en direct ; ce fichier fige ce que le moteur dit à l'état de
// départ de suggerer/etat.html, et jeu.mjs vérifie en direct le même accord (D80, D76) après chaque geste.
// Usage (depuis la racine) : node prototypes/houblons-v4/parcours/src/ecrans/suggerer/outils/instantane.mjs
//   [--dossier=prototypes/houblons-v4/maquettes/parcours-p2] → écrit cas-direct.json à côté de index.tsx.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const depot = path.resolve(ici, '../../../../../../..');
const puppeteer = createRequire(path.join(depot, 'package.json'))('puppeteer-core');
const opt = (k) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const dossier = path.resolve(depot, opt('dossier') ?? 'prototypes/houblons-v4/maquettes/parcours-p2');
const page = path.join(dossier, 'suggerer', 'etat.html');
if (!fs.existsSync(page)) { console.log(`INSTANTANE ECHEC : ${page} absente (construire d'abord)`); process.exit(1); }

const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const p = await nav.newPage();
await p.goto(pathToFileURL(page).href, { waitUntil: 'networkidle0' });
await p.waitForFunction(() => !!window.__parcours);
const cas = await p.evaluate(() => {
  const P = window.__parcours, m = P.moteur, r = P.etat.recette;
  const sc = m.style(r.styleCode), b = m.lireBiere(r);
  // Mêmes objectifs que l'écran : la visée (floral), puis les familles au-dessus du style.
  const visees = new Set(['floral', ...Object.keys(b.profil).filter((f) => b.profil[f].horsStyle === 'au-dessus')]);
  return {
    cas: 'cas-direct', titre: 'Suggérer en direct : stout 16D, plus florale (moteur v4, état de départ)',
    genere: 'outils/instantane.mjs', objectifs: [...visees],
    voies: m.suggerer(r, 'floral').map((c, i) => ({
      rang: i + 1, libelle: `Ajouter ${c.houblon.nom} · après 3 j · ${c.besoin} g`,
      tout: Object.entries(c.lu.ecart).filter(([, e]) => e).map(([f, e]) => ({
        famille: f, nom: f, visee: visees.has(f), effet: e.centre, crans: Math.round((e.centre / sc.families[f].cran) * 100) / 100,
      })),
      fiches: [{ houblon: c.houblon.nom, cle: c.cle, role: P.regles.hopRole(c.cle).value, roleSource: P.regles.hopRole(c.cle).source }],
    })),
  };
});
await nav.close();
const sortie = path.resolve(ici, '..', 'cas-direct.json');
fs.writeFileSync(sortie, JSON.stringify(cas, null, 1) + '\n');
console.log(`INSTANTANE OK : ${cas.voies.length} voies → ${path.relative(depot, sortie).split(path.sep).join('/')}`);
