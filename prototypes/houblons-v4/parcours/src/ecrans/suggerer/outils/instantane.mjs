// Instantané du moteur pour Suggérer, au format des cas du lot 15 (donnees/c1.json : voies[].tout, voies[].fiches),
// pour que controle-autres-ajouts (D76) et controle-usage-intensite (D80) se jouent sur l'écran calculé en direct.
// Reprise D105 : les voies dans l'ordre de l'écran (data-voie, data-id), leurs effets lus du moteur (proposer, suggerer).
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
await p.waitForFunction(() => !!window.__parcours && document.querySelectorAll('[data-ecran="suggerer"] [data-voie]').length > 0);
const cas = await p.evaluate(() => {
  const P = window.__parcours, m = P.moteur, r = P.etat.recette, sc = m.style(r.styleCode);
  // Les voies dans l'ordre de l'écran (data-voie, data-id) ; leurs effets lus du moteur, comme jeu.mjs.
  const dir = Object.fromEntries(Object.entries(P.etat.visee).filter(([, v]) => typeof v === 'number' && v !== 0));
  const vs = m.proposer(r, dir).voies, cs = m.suggerer(r, Object.keys(dir).find((f) => dir[f] > 0) ?? 'floral');
  const lignes = [...document.querySelectorAll('[data-ecran="suggerer"] [data-voie]')].sort((x, y) => +x.dataset.voie - +y.dataset.voie);
  return {
    cas: 'cas-direct', titre: 'Suggérer en direct (D105) : stout 16D, plus florale, moins résineuse (moteur v4, état de départ)',
    genere: 'outils/instantane.mjs', objectifs: Object.keys(dir),
    voies: lignes.map((l) => {
      const id = l.dataset.id;
      const c = id.startsWith('dryhop-') ? cs.find((x) => 'dryhop-' + x.cle === id) : null;
      const v = c ? null : vs.find((x) => x.id === id);
      const effets = c ? Object.fromEntries(Object.entries(c.lu.ecart).map(([f, e]) => [f, e ? e.centre : null]))
        : Object.fromEntries(Object.entries(v.effect).map(([f, e]) => [f, e.established && e.central != null ? e.central : null]));
      const cles = c ? [c.cle] : [...new Set(v.actions.map((x) => x.hopKey))];
      return {
        rang: +l.dataset.voie, libelle: c ? 'Dry hop : ' + c.houblon.nom : v.label,
        tout: Object.entries(effets).filter(([, e]) => e != null).map(([f, e]) => ({ famille: f, nom: f, visee: f in dir, effet: e, crans: Math.round((e / sc.families[f].cran) * 100) / 100 })),
        fiches: cles.map((k) => ({ houblon: m.houblon(k).nom, cle: k, role: P.regles.hopRole(k).value, roleSource: P.regles.hopRole(k).source })),
      };
    }),
  };
});
await nav.close();
const sortie = path.resolve(ici, '..', 'cas-direct.json');
fs.writeFileSync(sortie, JSON.stringify(cas, null, 1) + '\n');
console.log(`INSTANTANE OK : ${cas.voies.length} voies → ${path.relative(depot, sortie).split(path.sep).join('/')}`);
