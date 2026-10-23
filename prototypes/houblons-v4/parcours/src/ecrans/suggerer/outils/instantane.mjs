// Instantané du moteur pour Suggérer, au format des cas du lot 15 (donnees/c1.json : voies[].tout, voies[].fiches),
// pour que controle-autres-ajouts (D76) et controle-usage-intensite (D80) se jouent sur l'écran calculé en direct.
// Reprise D105 : les voies sont celles que l'écran range (voies.ts : proposer + dry hop), lues de window.__suggerer.
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
await p.waitForFunction(() => !!window.__parcours && !!window.__suggerer);
const cas = await p.evaluate(() => {
  const P = window.__parcours, m = P.moteur, r = P.etat.recette, sc = m.style(r.styleCode);
  // Les voies telles que l'écran les range (window.__suggerer, calculé par voies.ts depuis le moteur), dans l'ordre data-voie.
  const { groupes, objectifs } = window.__suggerer;
  const cibles = new Set(objectifs.map((o) => o.f));
  return {
    cas: 'cas-direct', titre: 'Suggérer en direct (D105) : stout 16D, plus florale, moins résineuse (moteur v4, état de départ)',
    genere: 'outils/instantane.mjs', objectifs: [...cibles],
    voies: groupes.flatMap((g) => g.lignes).map((l) => ({
      rang: l.n, libelle: `${g0(groupes, l)} : ${l.houblons.map((h) => h.nom).join(' + ')}`,
      tout: Object.entries(l.effets).filter(([, e]) => e != null).map(([f, e]) => ({ famille: f, nom: f, visee: cibles.has(f), effet: e, crans: Math.round((e / sc.families[f].cran) * 100) / 100 })),
      fiches: l.houblons.map((h) => ({ houblon: h.nom, cle: h.cle, role: P.regles.hopRole(h.cle).value, roleSource: P.regles.hopRole(h.cle).source })),
    })),
  };
  function g0(gs, l) { return gs.find((g) => g.lignes.includes(l)).titre; }
});
await nav.close();
const sortie = path.resolve(ici, '..', 'cas-direct.json');
fs.writeFileSync(sortie, JSON.stringify(cas, null, 1) + '\n');
console.log(`INSTANTANE OK : ${cas.voies.length} voies → ${path.relative(depot, sortie).split(path.sep).join('/')}`);
