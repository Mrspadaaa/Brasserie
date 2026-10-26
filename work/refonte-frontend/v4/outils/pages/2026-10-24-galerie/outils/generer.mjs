#!/usr/bin/env node
// Galerie de toutes les créations, et page Dryhopper (24.10, soir) : « Rencontre moi toutes les mini maquettes du
// dryhopping. Fait moi un artefacts avec toutes le création depuis de début de toutes les sessions. »
// Écrit, depuis le dépôt : les planches JPEG (une par lot, coupée par 24 cases de 390 × 844), l'inventaire et les deux
// pages statiques. Chaque vignette est une découpe de sa planche (une <img> décalée dans un cadre). Le script de la page
// ne sert qu'à la visionneuse.
// Usage : node generer.mjs [--qualite 62] [--sans-planches]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const R = path.resolve(ICI, '..', '..', '..', '..', '..', '..', '..');
const puppeteer = createRequire(path.join(R, 'package.json'))('puppeteer-core');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const args = process.argv.slice(2);
const QUALITE = Number(args[args.indexOf('--qualite') + 1]) || 62;
const SANS_PLANCHES = args.includes('--sans-planches');
const PAGES = 'work/refonte-frontend/v4/outils/pages/';
const GAL = PAGES + '2026-10-24-galerie/';
const DRY = PAGES + '2026-10-24-dryhopper-tout/';
const E = 'work/refonte-frontend/v4/ecran-1/';
const RF = 'work/refonte-frontend/';
const TMP = path.join(os.tmpdir(), 'affinee-galerie');
fs.mkdirSync(TMP, { recursive: true });
const abs = (p) => path.join(R, p);
const existe = (p) => fs.existsSync(abs(p));
const COL = 6, PAR_PLANCHE = 24, L = 390, H = 844;

// ---------- Les lots, du plus ancien au plus récent (dates : fichiers, git, registre) ----------
// ref : la maquette qu'il a choisie pour le même écran (ouverte à côté dans la visionneuse).
const REF = {
  etape: E + 'base/consolide/etat-b.html',
  suggerer: E + 'fils15-s5-complexe/q2b/etat-b.html',
  comparer: E + 'fils22-comparer/r6a/etat.html',
  fiche: E + 'fils13-carte-fiche/g1/vue.html',
  liste: E + 'fils24-fiche-liste/flb5b/etat.html',
  substituer: E + 'fils11-substitution/u4/vue.html',
  dryhopper: E + 'fils23-dryhopper/passe4/p4b2f/etat.html',
  epice: E + 'fils22-picto-epice-3/serie-f/v0/etat.html',
};
const LOTS = [
  { cle: 'phase2-fdf', nom: 'Les premiers fils de fer : l\'étape, la liste, comparer, remplacer', date: '17.10', dossier: RF + 'phase2/fils-de-fer + planches' },
  { cle: 'phase2-versions', nom: 'Les versions d\'avant : v1, v2 et la v5.5 sur ta stout', date: '17.10', dossier: RF + 'phase2/captures + v55-stout' },
  { cle: 'phase7', nom: 'Le prototype de la nuit : ajouter, remplacer, comparer', date: '18.10, nuit', dossier: RF + 'phase7/captures-fable' },
  { cle: 'phase8', nom: 'Le prototype de la nuit : l\'étape, l\'amertume, l\'arôme', date: '18.10, nuit', dossier: RF + 'phase8/captures' },
  { cle: 'v3-captures', nom: 'La v3, d\'itération en itération', date: '18.10, matin', dossier: RF + 'v3/captures' },
  { cle: 'v3-comparaison', nom: 'La v3 en revue : comparer', date: '18.10, matin', dossier: RF + 'v3/revues/comparaison', ecran: 'comparer' },
  { cle: 'v3-questions', nom: 'La v3 en revue : les questions', date: '18.10, matin', dossier: RF + 'v3/revues/questions' },
  { cle: 'v3-remplacement', nom: 'La v3 en revue : remplacer', date: '18.10, matin', dossier: RF + 'v3/revues/remplacement', ecran: 'substituer' },
  { cle: 'v3-simulation', nom: 'La v3 en revue : la simulation', date: '18.10, matin', dossier: RF + 'v3/revues/simulation' },
  { cle: 'v3-liste', nom: 'La v3 en revue : la liste', date: '18.10, matin', dossier: RF + 'v3/revues/liste' },
  { cle: 'v3-globale', nom: 'La v3 en revue : le parcours entier', date: '18.10, matin', dossier: RF + 'v3/revues/globale' },
  { cle: 'v3-autres', nom: 'La v3 : maquettes, gestes et références', date: '18.10, matin', dossier: RF + 'v3/maquettes, mesures, reference' },
  { cle: 'fils', nom: 'Lot 1 · L\'étape Houblons en fils de fer gris', date: '18.10', dossier: E + 'fils', ecran: 'etape' },
  { cle: 'fils2', nom: 'Lot 2 · L\'étape Houblons, le lot de p3', date: '18.10', dossier: E + 'fils2', ecran: 'etape' },
  { cle: 'fils3', nom: 'Lot 3 · Les variantes de p3', date: '18.10', dossier: E + 'fils3', ecran: 'etape' },
  { cle: 'fils4-fiche', nom: 'Lot 4 · La fiche à l\'appui long', date: '18.10', dossier: E + 'fils4-fiche', ecran: 'fiche' },
  { cle: 'fils4-radar', nom: 'Lot 4 · Les radars', date: '18.10', dossier: E + 'fils4-radar' },
  { cle: 'base', nom: 'La base jouable, jusqu\'à l\'étape Houblons v4.10', date: '18.10 au 20.10', dossier: E + 'base', ecran: 'etape' },
  { cle: 'fils5-comparer', nom: 'Lot 5a · Comparer, barres et radar', date: '18.10, soir', dossier: E + 'fils5-comparer', ecran: 'comparer' },
  { cle: 'fils5-suggestions', nom: 'Lot 5b · Suggestions, barres et radar', date: '18.10, soir', dossier: E + 'fils5-suggestions', ecran: 'suggerer' },
  { cle: 'fils6-comparer', nom: 'Lot 6 · Comparer sur p03', date: '18.10, soir', dossier: E + 'fils6-comparer', ecran: 'comparer' },
  { cle: 'fils6-suggestions', nom: 'Lot 6 · Suggestions sur p06', date: '18.10, soir', dossier: E + 'fils6-suggestions', ecran: 'suggerer' },
  { cle: 'fils7-radar', nom: 'Lot 7 · Une vraie base pour les radars', date: '18.10, soir', dossier: E + 'fils7-radar' },
  { cle: 'fils8-rail', nom: 'Lot 8 · La loupe du rail', date: '18.10, soir', dossier: E + 'fils8-rail', ecran: 'etape' },
  { cle: 'fils9-radars', nom: 'Lot 9 · Des radars qui ont du sens', date: '18.10, soir', dossier: E + 'fils9-radars' },
  { cle: 'fils10-echelles', nom: 'Lot 10 · Échelles et vraies comparaisons', date: '18.10, soir', dossier: E + 'fils10-echelles' },
  { cle: 'fils11-substitution', nom: 'Lot 11 · Substituer', date: '18.10, soir', dossier: E + 'fils11-substitution', ecran: 'substituer' },
  { cle: 'candidats-v44', nom: 'La loupe du rail, les candidats de la v4.4', date: '18.10, nuit', dossier: E + 'candidats-v44', ecran: 'etape' },
  { cle: 'fils12-descriptions', nom: 'Lot 12 · Les carrés d\'arômes au long appui', date: '19.10', dossier: E + 'fils12-descriptions', ecran: 'fiche' },
  { cle: 'fils12b-mi-chemin', nom: 'Lot 12b · À mi-chemin entre la carte et le lot 12', date: '19.10', dossier: E + 'fils12b-mi-chemin', ecran: 'fiche' },
  { cle: 'fils13-carte-fiche', nom: 'Lot 13 · La carte et la fiche ensemble', date: '19.10', dossier: E + 'fils13-carte-fiche', ecran: 'fiche' },
  { cle: 'fils14-suggestions-barres', nom: 'Lot 14 · Suggestions en barres', date: '19.10', dossier: E + 'fils14-suggestions-barres', ecran: 'suggerer' },
  { cle: 'fils16-radar-comparer', nom: 'Lot 16 · Le radar de Comparer', date: '19.10', dossier: E + 'fils16-radar-comparer', ecran: 'comparer' },
  { cle: 'fils15-s5-complexe', nom: 'Lot 15 · s5 à l\'épreuve, et q2b', date: '19.10', dossier: E + 'fils15-s5-complexe', ecran: 'suggerer' },
  { cle: 'fils17-standard', nom: 'Lot 17 · Les boosters sur q2b', date: '19.10', dossier: E + 'fils17-standard', ecran: 'suggerer' },
  { cle: 'fils18-baseline', nom: 'Lot 18 · Une vraie baseline', date: '19.10', dossier: E + 'fils18-baseline', ecran: 'suggerer' },
  { cle: 'fils20-dryhop', nom: 'Lot 20 · Dry hop, levure et biotransformation', date: '19.10', dossier: E + 'fils20-dryhop', ecran: 'dryhopper' },
  { cle: 'fils21-choisir', nom: 'Lot 21 · Mieux comprendre, mieux choisir', date: '20.10', dossier: E + 'fils21-choisir' },
  { cle: 'fils22-picto-epice', nom: 'L\'épicé, une planche de sept idées', date: '22.10', dossier: E + 'fils22-picto-epice', ecran: 'epice' },
  { cle: 'fils22-carte', nom: 'La carte des outils houblons', date: '22.10', dossier: E + 'fils22-carte' },
  { cle: 'fils22-comparer', nom: 'Lot 22 · Comparer', date: '22.10', dossier: E + 'fils22-comparer', ecran: 'comparer' },
  { cle: 'fils22-picto-epice-2', nom: 'L\'épicé, deuxième tour', date: '22.10', dossier: E + 'fils22-picto-epice-2', ecran: 'epice' },
  { cle: 'fils22-picto-epice-3', nom: 'L\'épicé, six séries', date: '23.10', dossier: E + 'fils22-picto-epice-3', ecran: 'epice' },
  { cle: 'fils23-dryhopper', nom: 'Dryhopper, sept séries et leurs passes', date: '23.10 et 24.10', dossier: E + 'fils23-dryhopper', ecran: 'dryhopper' },
  { cle: 'fils24-fiche-liste', nom: 'La liste de la fiche', date: '24.10', dossier: E + 'fils24-fiche-liste', ecran: 'liste' },
  { cle: 'fils24-substituer', nom: 'Substituer, six séries', date: '24.10', dossier: E + 'fils24-substituer', ecran: 'substituer' },
  { cle: 'fils24-graphes', nom: 'Les traits de Suggérer', date: '24.10', dossier: E + 'fils24-graphes', ecran: 'suggerer' },
  { cle: 'fils24-levure-suggerer', nom: 'La levure dans Suggérer', date: '24.10', dossier: E + 'fils24-levure-suggerer', ecran: 'suggerer' },
  { cle: 'fils24-pastille', nom: 'La pastille « ~ simulé »', date: '24.10', dossier: E + 'fils24-pastille' },
  { cle: 'fils24-petits-choix', nom: 'Trois petits choix : la pastille, la levure, l\'entrée de l\'analyse', date: '24.10, soir', dossier: E + 'fils24-petits-choix' },
  { cle: 'fils24-u4-enrichi', nom: 'u4 enrichi, cinq retouches', date: '24.10, soir', dossier: E + 'fils24-u4-enrichi', ecran: 'substituer' },
  { cle: 'fils24-pictos-hors16d', nom: 'Les pictos des types hors 16D', date: '24.10, soir', dossier: E + 'fils24-pictos-hors16d', ecran: 'liste' },
  { cle: 'fils24-recherche', nom: 'La recherche avancée de houblons (en cours)', date: '24.10, soir', dossier: E + 'fils24-recherche' },
];

// ---------- Ses choix et ses verdicts (registre choix/ecrans.json, choix/etats/acquis.json, SPEC § 1 et § 6,
// image-etat-global.mjs). s : choix (ton choix), bien, reserve (bien, avec réserve).
const VERDICTS = {
  [E + 'base/consolide/etat-b.html']: { s: 'choix', m: '« Ça c\'est le bon. »', ecran: 'l\'étape Houblons' },
  [E + 'fils15-s5-complexe/q2b/etat-b.html']: { s: 'choix', m: '« C\'est effectivement qb2 reprise le mieux »', ecran: 'Suggérer' },
  [E + 'fils15-s5-complexe/q2/etat-b.html']: { s: 'bien', m: '« cella là »' },
  [E + 'fils15-s5-complexe/p4b/etat-b.html']: { s: 'bien', m: '« plutôt un + qui ajoute le houblon à la comparaison »' },
  [E + 'fils22-comparer/r6a/etat.html']: { s: 'choix', m: '« r6a reste le meilleur »', ecran: 'Comparer' },
  [E + 'fils22-comparer/r6n2/etat.html']: { s: 'bien', m: '« r6n2 donne vraiment bien »' },
  [E + 'fils21-choisir/y1b/etat.html']: { s: 'bien', m: '« y1b est de mon point de vue semble meilleur »' },
  [E + 'fils21-choisir/x3b/etat.html']: { s: 'bien', m: '« Montrait vraiment l\'état du moment de l\'ajout facile »' },
  [E + 'fils21-choisir/w2/etat.html']: { s: 'bien', m: '« pas trop mal dans la manière de comparé »' },
  [E + 'fils21-choisir/v1/etat.html']: { s: 'reserve', m: '« meilleur vu de comparaison sur des vrai valeur »', r: 'un peu trop austère' },
  [E + 'fils21-choisir/y3/etat.html']: { s: 'reserve', m: '« la panel osu j\'aime assez »', r: 'la molette prend trop de place' },
  [E + 'fils21-choisir/a2b/etat.html']: { s: 'reserve', m: '« voir ce que la levure change »', r: 'peut-être pas en main' },
  [E + 'fils13-carte-fiche/g1/vue.html']: { s: 'choix', m: '« la v1 est la meilleure »', ecran: 'la fiche' },
  [E + 'fils9-radars/m4/vue.html']: { s: 'reserve', m: '« Radar: m4 h4 très bien »', r: 'pas surchargé en texte' },
  [E + 'fils9-radars/h4/vue.html']: { s: 'reserve', m: '« Radar: m4 h4 très bien »', r: 'pas surchargé en texte' },
  [E + 'fils14-suggestions-barres/s5/etat-b.html']: { s: 'reserve', m: '« s5 semble vraiment le mieux »', r: 'compliqué à plusieurs voies' },
  [E + 'fils18-baseline/l5b/etat-b.html']: { s: 'bien', m: '« Meilleures bar »' },
  [E + 'fils18-baseline/l8/etat-b.html']: { s: 'reserve', m: '« la manière dont sont disposés les choses j\'aime beaucoup !! »', r: 'visuellement horrible' },
  [E + 'fils18-baseline/l8b/etat-b.html']: { s: 'reserve', m: '« C\'est la meilleure version »', r: 'pas de halo aux icônes' },
  [E + 'fils18-baseline/l5f/etat-b.html']: { s: 'reserve', m: '« pour l5f très bien »', r: 'Motueka paraît ultra fruité' },
  [E + 'fils5-comparer/p03/etat-b.html']: { s: 'reserve', m: '« J\'aime beaucoup la variante 3 »', r: 'sans intervalle de confiance' },
  [E + 'fils6-comparer/p06/comparer.html']: { s: 'bien', m: '« Comparé: p06 »' },
  [E + 'fils6-comparer/p02/comparer.html']: { s: 'reserve', m: '« radar p2 »', r: 'avec l\'intervalle de confiance' },
  [E + 'fils2/p03/etat-b.html']: { s: 'bien', m: '« P3 serait même le mieux de loin du lot. »' },
  [E + 'fils3/p02/etat-b.html']: { s: 'bien', m: '« P2,3,8 sont vraiment bien »' },
  [E + 'fils3/p03/etat-b.html']: { s: 'bien', m: '« P2,3,8 sont vraiment bien »' },
  [E + 'fils3/p08/etat-b.html']: { s: 'bien', m: '« la 8 seulement pour la manière dont ont voit les étapes »' },
  [E + 'fils22-picto-epice-3/serie-f/v0/etat.html']: { s: 'choix', m: '« Mon Picto préféré est cannelle et clou croisés »', ecran: 'l\'épicé' },
  [E + 'fils11-substitution/u4/vue.html']: { s: 'choix', m: '« Substitution, ça serait plus du u4 »', ecran: 'Substituer' },
  [E + 'fils24-u4-enrichi/u4e5/etat.html']: { s: 'bien', m: '« Très bien »', r: 'avec la matrice de flb5b et les huiles' },
  [E + 'fils24-fiche-liste/flb5b/etat.html']: { s: 'choix', m: '« Partie sur celle ci »', ecran: 'la liste de la fiche' },
  [E + 'fils24-fiche-liste/flb5/etat.html']: { s: 'reserve', m: '« Ça j\'aime beaucoup »', r: 'encore un peu fouillis' },
  [E + 'fils24-fiche-liste/flu2b/etat.html']: { s: 'bien', m: '« Le footer est top »' },
  [E + 'fils24-fiche-liste/flz4/etat.html']: { s: 'bien', m: '« header type 10 »' },
  [E + 'fils24-graphes/gr5/etat.html']: { s: 'bien', m: '« Ça c\'est top à mettre dans la vraie version »' },
  [E + 'fils23-dryhopper/passe4/p4b2f/etat.html']: { s: 'choix', m: '« Partir sur cette version »', ecran: 'Dryhopper' },
  [E + 'fils23-dryhopper/passe4/p4b2/etat.html']: { s: 'reserve', m: '« Ça j\'aime beaucoup »', r: 'encore assez peu lisible' },
  [E + 'fils20-dryhop/d1/etat.html']: { s: 'reserve', m: '« d1, tout ouvert était aussi intéressant »', r: 'trop bordélique' },
  [E + 'fils23-dryhopper/serie-a/passe2/a1/etat.html']: { s: 'bien', m: 'l\'ancien plancher, remplacé par p4b2f' },
};

// ---------- Collecte ----------
const marcher = (d, garder, out = []) => {
  if (!existe(d)) return out;
  for (const e of fs.readdirSync(abs(d), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, 'fr', { numeric: true }))) {
    const p = d + '/' + e.name;
    if (e.isDirectory()) { if (!/^(node_modules|temoins|\.git)$/.test(e.name)) marcher(p, garder, out); }
    else if (garder(e.name, p)) out.push(p);
  }
  return out;
};
const items = [];
const ajouter = (source, lot, id, image) => items.push({ source, lot, id, image });

// Les captures d'un écran : le dossier captures/ le plus proche, en remontant jusqu'au lot.
function capture(source, id, lotDir) {
  const b = /etat-b\.html$/.test(source);
  const noms = id === 'planche' || id === 'v0' ? ['planche-390.png']
    : id === 'consolide' ? ['consolide-b-390.png', 'consolide-390.png']
    : [
      ...(b ? [`${id}-b-390.png`, `${id}-etat-b-390.png`] : []),
      `${id}-premier-ecran.png`, `${id}-390.png`, `${id}-vue-390.png`, `${id}-comparer-390.png`, `${id}-radar-390.png`,
      `${id}-haut-390.png`, `${id}-repos.png`, `${id}-page.png`, `${id}-etat-b-390.png`, `${id}-b-390.png`, `${id}-page-3.png`, `${id}.png`,
    ];
  let d = path.posix.dirname(source);
  const dossiers = [];
  while (d.startsWith(lotDir)) { dossiers.push(path.posix.dirname(d) + '/captures', d + '/captures'); if (d === lotDir) break; d = path.posix.dirname(d); }
  dossiers.unshift(path.posix.dirname(source) + '/captures');
  for (const dos of [...new Set(dossiers)]) for (const n of noms) if (existe(dos + '/' + n)) return dos + '/' + n;
  return null;
}

// a. Les etat*.html de ecran-1.
const etats = marcher(E.slice(0, -1), (n) => /^etat.*\.html$/.test(n));
// b. Les lots sans etat.html : leurs pages de variantes.
const sansEtat = [
  ['fils6-comparer', 'comparer.html'], ['fils7-radar', 'radar.html'], ['fils9-radars', 'vue.html'], ['fils10-echelles', 'vue.html'],
  ['fils11-substitution', 'vue.html'], ['fils12-descriptions', 'vue.html'], ['fils12b-mi-chemin', 'vue.html'], ['fils13-carte-fiche', 'vue.html'],
  ['fils16-radar-comparer', 'comparer-radar.html'],
];
const autres = sansEtat.flatMap(([lot, page]) => fs.readdirSync(abs(E + lot), { withFileTypes: true })
  .filter((e) => e.isDirectory() && existe(`${E}${lot}/${e.name}/${page}`))
  .map((e) => `${E}${lot}/${e.name}/${page}`)
  .sort((a, b) => a.localeCompare(b, 'fr', { numeric: true })));
for (const s of [...etats, ...autres]) {
  const rel = s.slice(E.length);
  const lot = rel.split('/')[0];
  const parties = rel.split('/').slice(1, -1);
  let id = parties[parties.length - 1] ?? lot;
  if (['v0', 'planche', 'consolide'].includes(id) && parties.length > 1) id = parties[parties.length - 2];
  else if (parties.length === 1 && ['planche', 'consolide'].includes(id)) id = id === 'consolide' ? 'v4.10' : 'planche';
  const passe = parties.find((p) => /^passe\d$/.test(p) && parties.indexOf(p) < parties.length - 1);
  if (passe && lot !== 'fils23-dryhopper') id += ` · ${passe.replace('passe', 'passe ')}`;
  if (lot === 'fils23-dryhopper' && /^passe[23]$/.test(parties[1] ?? '')) id += ` · ${parties[1].replace('passe', 'passe ')}`;
  if (lot === 'base' && parties[0]?.startsWith('_')) id = `base ${parties[0].slice(1)}`;
  if (lot === 'fils3' && parties[0] === '_ecartes') id += ' · écartée';
  if (lot === 'fils6-comparer' && id === '_depart') id = 'départ';
  if (lot === 'fils6-suggestions' && id === '_depart') id = 'départ';
  const nomCapture = parties[parties.length - 1] ?? lot;
  const img = capture(s, nomCapture, E + lot);
  ajouter(s, lot, id, img);
}
// c. Toutes les captures de la v3.
const v3 = marcher(RF + 'v3', (n) => /\.png$/.test(n));
for (const s of v3) {
  const rel = s.slice((RF + 'v3/').length);
  const lot = rel.startsWith('captures/') ? 'v3-captures'
    : rel.startsWith('revues/comparaison') ? 'v3-comparaison'
    : rel.startsWith('revues/questions') ? 'v3-questions'
    : rel.startsWith('revues/remplacement') ? 'v3-remplacement'
    : rel.startsWith('revues/simulation') ? 'v3-simulation'
    : rel.startsWith('revues/liste') ? 'v3-liste'
    : rel.startsWith('revues/globale') ? 'v3-globale' : 'v3-autres';
  const sous = rel.split('/').slice(lot === 'v3-captures' || lot === 'v3-autres' ? 0 : 1, -1).filter((x) => x !== 'captures' && x !== 'comparaison' && x !== 'questions' && x !== 'remplacement' && x !== 'simulation' && x !== 'liste' && x !== 'globale' && x !== 'revues');
  const id = (sous.length ? sous.join('/') + ' · ' : '') + path.posix.basename(s, '.png');
  ajouter(s, lot, id, s);
}
// d. Les phases 2, 7 et 8 : leurs fils de fer et les captures de leurs prototypes.
for (const [lot, dossiers] of [
  ['phase2-fdf', ['phase2/fils-de-fer', 'phase2/planches']],
  ['phase2-versions', ['phase2/captures', 'phase2/v55-stout']],
  ['phase7', ['phase7/captures-fable']],
  ['phase8', ['phase8/captures']],
]) for (const d of dossiers) for (const s of marcher(RF + d, (n) => /\.png$/.test(n))) {
  const id = (d.endsWith('planches') ? 'planche ' : d.endsWith('v55-stout') ? 'v5.5 · ' : '') + path.posix.basename(s, '.png');
  ajouter(s, lot, id, s);
}

// ---------- Titres (NOTE.md de la variante) ----------
function titre(source) {
  if (!/\.html$/.test(source)) return '';
  const note = path.posix.dirname(source) + '/NOTE.md';
  if (!existe(note)) return '';
  const l = fs.readFileSync(abs(note), 'utf8').split(/\r?\n/).find((x) => x.trim()) ?? '';
  // « # id · Le nom (…) » ou « id · Le nom : … » : le nom seul ; sinon (une note qui commence par son parti), pas de nom.
  const h = l.replace(/^#\s*/, '').match(/^[\w.-]{2,8}\s*[—·:-]\s*(.+)$/);
  let t = h ? h[1].replace(/[*`]/g, '') : '';
  const q = t.match(/^«\s*([^»]{3,60})\s*»/);
  if (q) t = q[1];
  t = t.split(/\s\(|\s:\s|\.\s|\s;\s|\s—\s/)[0].replace(/[.:]$/, '');
  t = t.replace(/^chaleur\s*:.*$/i, '').replace(/^passe\b.*$/i, '').trim();
  if (t.length > 44) t = t.slice(0, 44).replace(/\s+\S*$/, '') + '…';
  return t;
}

// ---------- Rendu des mini maquettes sans capture ----------
const nav = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--allow-file-access-from-files'] });
const rendus = [];
try {
  const p = await nav.newPage();
  for (const it of items) {
    if (it.image) continue;
    const sortie = path.join(TMP, crypto.createHash('md5').update(it.source).digest('hex').slice(0, 12) + '.png');
    if (!fs.existsSync(sortie)) {
      try {
        await p.setViewport({ width: L, height: H, deviceScaleFactor: 1 });
        await p.goto(pathToFileURL(abs(it.source)).href, { waitUntil: 'networkidle0', timeout: 20000 });
        await new Promise((r) => setTimeout(r, 400));
        await p.screenshot({ path: sortie });
      } catch (e) { console.log('rendu impossible', it.source, e.message.slice(0, 80)); continue; }
    }
    it.rendu = sortie;
    rendus.push(it.source);
  }

  // ---------- Planches ----------
  // Un lot né après l'écriture de ce script (des voies en cours ce soir) : son nom vient du titre de son brief.
  const ordreLots = LOTS.map((l) => l.cle);
  for (const cle of [...new Set(items.map((i) => i.lot))].filter((l) => !ordreLots.includes(l))) {
    const brief = fs.existsSync(abs(E + cle)) ? fs.readdirSync(abs(E + cle)).find((n) => /^(BRIEF|NOTE).*\.md$/.test(n)) : null;
    const h = brief ? (fs.readFileSync(abs(E + cle + '/' + brief), 'utf8').match(/^#\s+(.+)$/m)?.[1] ?? '') : '';
    const nom = h.replace(/^Lot\s+([\w.]+\s*[—·:-]\s*)?/i, '').replace(/\s*\(.*$/, '').replace(/^«\s*(.+?)\s*»$/, '$1').trim() || cle;
    LOTS.push({ cle, nom: nom.charAt(0).toUpperCase() + nom.slice(1) + ' (en cours)', date: '24.10, soir', dossier: E + cle });
    console.log('lot ajouté :', cle, '·', nom);
  }
  const parLot = new Map(LOTS.map((l) => [l.cle, items.filter((i) => i.lot === l.cle)]));

  async function planches(liste, dossierSortie, prefixe) {
    // liste : items dans l'ordre ; découpe par PAR_PLANCHE ; écrit les JPEG ; renvoie pour chaque item {planche, x, y, cols, rows}.
    const out = [];
    for (let k = 0; k * PAR_PLANCHE < liste.length; k++) {
      const morceau = liste.slice(k * PAR_PLANCHE, (k + 1) * PAR_PLANCHE);
      const cols = Math.min(COL, morceau.length), rows = Math.ceil(morceau.length / cols);
      const nom = `${prefixe}-${k + 1}.jpg`;
      const fichier = path.join(abs(dossierSortie), nom);
      if (!SANS_PLANCHES) {
        const cases = morceau.map((it) => {
          const src = it.image ? pathToFileURL(abs(it.image)).href : it.rendu ? pathToFileURL(it.rendu).href : null;
          return `<div class="c">${src ? `<img src="${src}">` : '<p>rendu impossible</p>'}</div>`;
        }).join('');
        const html = `<!doctype html><meta charset="utf-8"><style>*{margin:0}body{width:${cols * L}px;display:grid;grid-template-columns:repeat(${cols},${L}px);background:#fff}.c{width:${L}px;height:${H}px;overflow:hidden;background:#fff;position:relative}.c img{display:block;width:${L}px;height:auto}.c p{font:20px system-ui;padding:40px;color:#888}</style>${cases}`;
        const tmp = path.join(TMP, 'planche.html');
        fs.writeFileSync(tmp, html);
        await p.setViewport({ width: cols * L, height: rows * H, deviceScaleFactor: 1 });
        await p.goto(pathToFileURL(tmp).href, { waitUntil: 'networkidle0', timeout: 60000 });
        await p.screenshot({ path: fichier, type: 'jpeg', quality: QUALITE, clip: { x: 0, y: 0, width: cols * L, height: rows * H } });
      }
      morceau.forEach((it, i) => out.push({ it, planche: nom, x: i % cols, y: Math.floor(i / cols), cols, rows }));
    }
    return out;
  }

  // ---------- Galerie ----------
  fs.mkdirSync(abs(GAL + 'planches'), { recursive: true });
  for (const f of fs.readdirSync(abs(GAL + 'planches'))) fs.unlinkSync(abs(GAL + 'planches/' + f));
  const placesGal = new Map();
  for (const l of LOTS) {
    const liste = parLot.get(l.cle);
    if (!liste.length) continue;
    for (const pl of await planches(liste, GAL + 'planches', l.cle)) placesGal.set(pl.it.source, pl);
  }
  const inventaire = items.map((it) => {
    const pl = placesGal.get(it.source);
    const v = VERDICTS[it.source];
    return {
      source: it.source, lot: it.lot, id: it.id, titre: titre(it.source),
      image: it.image ?? (it.rendu ? 'rendu à 390 × 844 (Chrome)' : null),
      case: { planche: 'planches/' + pl.planche, colonne: pl.x, rangee: pl.y },
      choix: v && v.s === 'choix' ? v.m : null,
      ...(v && v.s !== 'choix' ? { verdict: v.s === 'bien' ? 'bien' : 'bien, avec réserve', mots: v.m } : {}),
    };
  });
  const ordre = new Map(LOTS.map((l, i) => [l.cle, i]));
  inventaire.sort((a, b) => ordre.get(a.lot) - ordre.get(b.lot));
  fs.writeFileSync(abs(GAL + 'inventaire.json'), JSON.stringify(inventaire, null, 1) + '\n');
  const parSource = new Map(inventaire.map((x) => [x.source, x]));

  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const cadre = (pl, alt) => `<span class="cadre"><img src="${pl.dossier ?? ''}planches/${pl.planche}" width="${pl.cols * L}" height="${pl.rows * H}" alt="${esc(alt)}" style="width:${pl.cols * 100}%;left:-${pl.x * 100}%;top:-${pl.y * 100}%"></span>`;
  function vignette(pl, lotNom, refPl, refNom) {
    const it = pl.it, inv = parSource.get(it.source), v = VERDICTS[it.source];
    const pastille = v ? `<span class="pastille p-${v.s}">${v.s === 'choix' ? 'ton choix' : v.s === 'bien' ? '« bien »' : 'avec réserve'}</span>` : '';
    const ref = refPl && refPl.it.source !== it.source ? ` data-ref="${refPl.planche}|${refPl.cols}|${refPl.rows}|${refPl.x}|${refPl.y}" data-ref-nom="${esc(refNom)}"` : '';
    return `<figure class="vue${v?.s === 'choix' ? ' choisie' : ''}" data-vignette data-source="${esc(it.source)}">
<button class="ecran" type="button" data-nom="${esc(it.id + (inv.titre ? ' · ' + inv.titre : '') + ' — ' + lotNom)}" data-case="${pl.planche}|${pl.cols}|${pl.rows}|${pl.x}|${pl.y}"${ref}>${cadre(pl, it.id + ' · ' + lotNom)}</button>
<figcaption>${pastille}<span class="id">${esc(it.id)}</span>${inv.titre ? `<span class="t">${esc(inv.titre)}</span>` : ''}${v ? `<span class="ligne">${esc(v.m)}</span>` : ''}${v?.r ? `<span class="res">réserve : ${esc(v.r)}</span>` : ''}</figcaption>
</figure>`;
  }
  const lotsVus = LOTS.filter((l) => parLot.get(l.cle).length);
  const total = items.length;
  const rangees = lotsVus.map((l, n) => {
    const liste = parLot.get(l.cle);
    const refSource = l.ecran ? REF[l.ecran] : null;
    const refPl = refSource ? placesGal.get(refSource) : null;
    const refNom = refSource ? `ton choix · ${VERDICTS[refSource].ecran} · ${parSource.get(refSource).id}` : '';
    const choisies = liste.filter((it) => VERDICTS[it.source]?.s === 'choix').length;
    return `<section class="rangee" id="lot-${l.cle}" aria-labelledby="t-${l.cle}">
<div class="nom"><h2 id="t-${l.cle}">${esc(l.nom)}</h2><p class="date">${esc(l.date)} · ${liste.length} mini maquette${liste.length > 1 ? 's' : ''}${choisies ? ` · ${choisies} de tes choix` : ''}</p><p class="dossier">${esc(l.dossier.replace('work/refonte-frontend/', ''))}</p></div>
<div class="planche">
${liste.map((it) => vignette(placesGal.get(it.source), l.nom, refPl, refNom)).join('\n')}
</div>
</section>`;
  }).join('\n\n');
  const sommaire = lotsVus.map((l) => `<a href="#lot-${l.cle}"><span class="l">${esc(l.nom)}</span><span class="n">${parLot.get(l.cle).length}</span></a>`).join('\n');
  const nbChoix = items.filter((it) => VERDICTS[it.source]?.s === 'choix').length;
  fs.writeFileSync(abs(GAL + 'index.html'), page({
    titre: 'Toutes tes mini maquettes · 24.10, soir',
    surTitre: 'L\'Affinée · houblons · depuis le 17.10',
    h1: `Toutes tes mini maquettes, ${total}`,
    choisir: [
      `<p><b>Rien à choisir ici :</b> tout ce qu'on a créé pour toi depuis le 17.10, lot par lot, le plus ancien en haut. ${lotsVus.length} lots, ${total} mini maquettes, ${nbChoix} de tes choix.</p>`,
      '<p>Touche une vignette : elle s\'ouvre en grand, à côté de ton choix pour le même écran.</p>',
      '<p class="legende-pastilles"><span class="pastille p-choix">ton choix</span><span class="pastille p-bien">« bien »</span><span class="pastille p-reserve">avec réserve</span> tes mots en italique dessous</p>',
      '<p>Dryhopper seul, toutes ses mini maquettes : la page « Dryhopper, tout ».</p>',
    ].join('\n'),
    sommaire,
    rangees,
    pied: `<p>Le champ : chaque mini maquette des lots de l'écran 1 (v4), chaque capture de la v3, les fils de fer et prototypes des phases 2, 7 et 8. L'inventaire : <span class="id">inventaire.json</span>.</p>`,
  }));

  // ---------- Dryhopper ----------
  const dryItems = items.filter((it) => /dryhop/i.test(it.source));
  const ancetres = [E + 'fils21-choisir/y1/etat.html', E + 'fils21-choisir/y1b/etat.html', E + 'fils21-choisir/a2b/etat.html'].map((s) => items.find((i) => i.source === s)).filter(Boolean);
  const D23 = E + 'fils23-dryhopper/';
  const series = 'abcdefg'.split('');
  const NOM_SERIE = {};
  for (const s of series) {
    const f = abs(D23 + 'tri/serie-' + s + '.md');
    NOM_SERIE[s] = '';
    if (fs.existsSync(f)) { const l = fs.readFileSync(f, 'utf8').split(/\r?\n/).find((x) => /^#/.test(x)) ?? ''; const g = l.match(/«\s*([^»]{3,50})\s*»/) || l.match(/[—:]\s*(.{3,50})$/); NOM_SERIE[s] = g ? g[1].trim() : ''; }
  }
  const rangsDry = [
    { cle: 'choix', nom: 'Ton choix : p4b2f, « L\'aire du floral », et sa lignée', date: '24.10, soir', liste: [REF.dryhopper, D23 + 'passe4/p4b2/etat.html', D23 + 'passe4/p4b2d/etat.html', D23 + 'passe4/p4b2e/etat.html'].map((s) => dryItems.find((i) => i.source === s)).filter(Boolean) },
    { cle: 'v3', nom: 'La v3 : le dry hop dans la simulation', date: '18.10, matin', liste: dryItems.filter((i) => i.source.includes('/v3/')) },
    { cle: 'lot20', nom: 'Lot 20 · Le dry hop, la levure, la biotransformation', date: '19.10', liste: dryItems.filter((i) => i.source.includes('fils20-dryhop/')) },
    { cle: 'ancetres', nom: 'Lot 21 · Le « Quand ? » et la levure, avant Dryhopper', date: '20.10', liste: ancetres },
    { cle: 'carte', nom: 'La carte des outils · Dryhopper', date: '22.10', liste: dryItems.filter((i) => i.source.includes('fils22-carte/')) },
    ...series.map((s) => ({ cle: 'serie-' + s, nom: `Série ${s.toUpperCase()}${NOM_SERIE[s] ? ' · ' + NOM_SERIE[s] : ''}`, date: '23.10', liste: dryItems.filter((i) => i.source.startsWith(D23 + 'serie-' + s + '/') && !/\/passe\d\//.test(i.source)) })),
    { cle: 'passes23', nom: 'Passes 2 et 3 : a1, b4, d8, e5, g1 retouchées', date: '23.10', liste: dryItems.filter((i) => /fils23-dryhopper\/serie-[a-g]\/passe[23]\//.test(i.source)).sort((a, b) => a.source.localeCompare(b.source)) },
    { cle: 'passe4', nom: 'Passes 4 et 5 : p4a, p4b, et les trois retouches de p4b2', date: '24.10', liste: dryItems.filter((i) => i.source.startsWith(D23 + 'passe4/')) },
  ];
  const vusDry = new Set(rangsDry.flatMap((r) => r.liste.map((i) => i.source)));
  const oublies = dryItems.filter((i) => !vusDry.has(i.source));
  if (oublies.length) rangsDry.push({ cle: 'autres', nom: 'Les autres mini maquettes de Dryhopper', date: '', liste: oublies });
  fs.mkdirSync(abs(DRY + 'planches'), { recursive: true });
  for (const f of fs.readdirSync(abs(DRY + 'planches'))) fs.unlinkSync(abs(DRY + 'planches/' + f));
  const placesDry = new Map();
  const blocs = [];
  for (const r of rangsDry) {
    if (!r.liste.length) continue;
    const pls = await planches(r.liste, DRY + 'planches', 'dry-' + r.cle);
    blocs.push({ r, pls });
    for (const pl of pls) if (!placesDry.has(pl.it.source)) placesDry.set(pl.it.source, pl);
  }
  const refDry = placesDry.get(REF.dryhopper);
  const nbDry = new Set(blocs.flatMap((b) => b.pls.map((p) => p.it.source))).size;
  const rangeesDry = blocs.map(({ r, pls }) => `<section class="rangee" id="r-${r.cle}" aria-labelledby="t-${r.cle}">
<div class="nom"><h2 id="t-${r.cle}">${esc(r.nom)}</h2><p class="date">${esc(r.date)}${r.date ? ' · ' : ''}${pls.length} mini maquette${pls.length > 1 ? 's' : ''}</p></div>
<div class="planche">
${pls.map((pl) => vignette(pl, 'Dryhopper', refDry, 'ton choix · Dryhopper · p4b2f')).join('\n')}
</div>
</section>`).join('\n\n');
  fs.writeFileSync(abs(DRY + 'index.html'), page({
    titre: 'Dryhopper, tout · 24.10, soir',
    surTitre: 'L\'Affinée · houblons · Dryhopper depuis le 19.10',
    h1: `Dryhopper, toutes ses mini maquettes (${nbDry})`,
    choisir: [
      '<p><b>Ton choix :</b> p4b2f, « L\'aire du floral », en tête ; tes mots : « Partir sur cette version ».</p>',
      '<p>À côté : p4b2, dont elle est la retouche, et ses deux sœurs. Dessous, toutes les autres, une rangée par série ou passe, de la plus ancienne à la plus récente. Touche une vignette : elle s\'ouvre en grand, à côté de p4b2f.</p>',
      '<p class="legende-pastilles"><span class="pastille p-choix">ton choix</span><span class="pastille p-bien">« bien »</span><span class="pastille p-reserve">avec réserve</span> tes mots en italique dessous</p>',
    ].join('\n'),
    sommaire: blocs.map(({ r, pls }) => `<a href="#r-${r.cle}"><span class="l">${esc(r.nom.replace(/ :.*$/, ''))}</span><span class="n">${pls.length}</span></a>`).join('\n'),
    rangees: rangeesDry,
    pied: '<p>Le champ : chaque mini maquette dont la source contient « dryhop » (lots 20, 22 et 23), et y1, y1b, a2b du lot 21. Toutes les créations : la page « Toutes tes mini maquettes ».</p>',
  }));
  console.log(`${items.length} mini maquettes ; ${rendus.length} rendues faute de capture ; Dryhopper ${nbDry}`);
  fs.writeFileSync(path.join(TMP, 'rendus.txt'), rendus.join('\n'));
} finally {
  await nav.close();
}

function page({ titre, surTitre, h1, choisir, sommaire, rangees, pied }) {
  return `<!doctype html>
<html lang="fr">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titre}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&family=Bricolage+Grotesque:wght@600;800&display=swap">
<style>
/* La disposition qu'il aime (24.10, soir) : une rangée par lot, le nom à gauche (au téléphone : au-dessus), les mini
   maquettes en vignettes serrées, six par rangée à l'ordinateur, trois au téléphone. Rien ne défile en largeur (D126).
   Chaque vignette est une découpe de la planche JPEG de son lot ; elle s'ouvre en grand, à côté de ton choix. */
:root {
  --fond: #f4f6f1; --carte: #ffffff; --encre: #1c2019; --discret: #5a6155; --trait: #dde2d6;
  --houblon: #4a7426; --ambre: #b97a12;
  --ombre: 0 1px 2px rgb(28 32 25 / 8%), 0 4px 14px rgb(28 32 25 / 6%);
  --titre: "Bricolage Grotesque", "Segoe UI", system-ui, sans-serif;
  --texte: "Atkinson Hyperlegible", "Segoe UI", system-ui, sans-serif;
  color-scheme: light;
}
* { box-sizing: border-box; }
[hidden] { display: none !important; }
body { background: var(--fond); color: var(--encre); font: 16px/1.45 var(--texte); margin: 0;
  padding-left: max(14px, env(safe-area-inset-left, 0px)); padding-right: max(14px, env(safe-area-inset-right, 0px)); padding-block: 16px 64px; }
.page { max-width: 1320px; margin: 0 auto; display: grid; gap: 22px; }
h1, h2 { font-family: var(--titre); text-wrap: balance; margin: 0; line-height: 1.12; }
h1 { font-size: clamp(1.7rem, 6vw, 2.4rem); font-weight: 800; letter-spacing: -0.02em; }
h2 { font-size: 1.15rem; font-weight: 800; }
p { margin: 0; max-width: 70ch; }
a { color: var(--houblon); }
a:focus-visible, button:focus-visible { outline: 3px solid var(--houblon); outline-offset: 2px; }
header { display: grid; gap: 6px; }
.sur-titre { font-size: 0.875rem; letter-spacing: 0.06em; text-transform: uppercase; color: var(--discret); }
.encart { border-left: 4px solid var(--ambre); padding: 12px 14px; background: var(--carte); border-radius: 0 10px 10px 0; display: grid; gap: 8px; max-width: 84ch; }
.sommaire { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 4px 18px; font-size: 0.9375rem; }
.sommaire a { text-decoration: none; padding: 3px 0; border-bottom: 1px solid var(--trait); display: flex; justify-content: space-between; gap: 10px; }
.sommaire .l { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
.sommaire .n { color: var(--discret); font-variant-numeric: tabular-nums; }
.pastille { justify-self: start; display: inline-block; font-size: 0.875rem; font-weight: 700; line-height: 1.5; padding: 0 9px; border-radius: 999px; color: #fff; white-space: nowrap; }
.p-choix { background: #1f6f3a; } .p-bien { background: #1d4ed8; } .p-reserve { background: #7c3aed; }
.legende-pastilles { display: flex; flex-wrap: wrap; gap: 6px 10px; font-size: 0.875rem; color: var(--discret); align-items: center; }
.rangee { display: grid; gap: 10px; padding-top: 16px; border-top: 1px solid var(--trait); scroll-margin-top: 10px; }
.nom { display: grid; gap: 3px; align-content: start; }
.date { font-size: 0.875rem; color: var(--houblon); font-weight: 700; }
.dossier { font-size: 0.875rem; color: var(--discret); font-family: ui-monospace, "Cascadia Mono", Consolas, monospace; overflow-wrap: anywhere; }
.planche { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px 8px; align-items: start; }
@media (min-width: 900px) {
  .rangee { grid-template-columns: 200px minmax(0, 1fr); gap: 20px; }
  .planche { grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 18px 12px; }
}
.vue { margin: 0; display: grid; gap: 4px; align-content: start; min-width: 0; }
.ecran { display: block; width: 100%; padding: 0; border: 1px solid var(--trait); border-radius: 9px; overflow: hidden; background: var(--carte); box-shadow: var(--ombre); cursor: zoom-in; }
.cadre { display: block; position: relative; width: 100%; aspect-ratio: 390 / 844; overflow: hidden; }
.cadre img { position: absolute; max-width: none; height: auto; display: block; }
.vue.choisie .ecran { border-color: transparent; box-shadow: 0 0 0 3px #1f6f3a, var(--ombre); }
.vue figcaption { display: grid; gap: 2px; justify-items: start; }
.id { font-size: 0.875rem; color: var(--encre); font-weight: 700; font-family: ui-monospace, "Cascadia Mono", Consolas, monospace; overflow-wrap: anywhere; }
.t { font-size: 0.875rem; color: var(--discret); line-height: 1.3; overflow-wrap: anywhere; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.ligne { font-size: 0.875rem; font-style: italic; line-height: 1.3; }
.res { font-size: 0.875rem; color: #92400e; line-height: 1.3; }
footer { border-top: 1px solid var(--trait); padding-top: 16px; display: grid; gap: 8px; font-size: 0.95rem; color: var(--discret); }
.visionneuse { position: fixed; inset: 0; z-index: 20; background: #0e100c; overflow-y: auto; padding: 0 max(12px, env(safe-area-inset-right, 0px)) calc(28px + env(safe-area-inset-bottom, 0px)) max(12px, env(safe-area-inset-left, 0px)); color: #eef2ea; }
.vis-tete { position: sticky; top: 0; z-index: 2; display: flex; gap: 8px; align-items: center; justify-content: space-between; margin: 0 -12px 12px; padding: calc(10px + env(safe-area-inset-top, 0px)) 12px 10px; background: #0e100c; }
.vis-titre { font: 800 1rem/1.2 var(--titre); min-width: 0; }
.vis-boutons { display: flex; gap: 6px; flex: none; }
.vis-boutons button { font: 700 0.95rem var(--texte); border: 0; border-radius: 999px; padding: 9px 14px; cursor: pointer; background: #2d3328; color: #eef2ea; min-height: 40px; }
.vis-boutons .fermer { background: #eef2ea; color: #1c2019; }
.vis-rangee { display: flex; gap: 12px; overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: 6px; max-width: 1240px; margin: 0 auto; }
.vis-panneau { flex: 0 0 min(390px, 88%); scroll-snap-align: start; margin: 0; display: grid; gap: 8px; align-content: start; }
.vis-panneau .cadre { border-radius: 14px; background: #fff; }
.vis-panneau.ref .cadre { box-shadow: 0 0 0 3px #3fae64; }
.vis-panneau figcaption { font-size: 0.95rem; }
.vis-panneau.ref figcaption { color: #9be3b0; font-weight: 700; }
.vis-glisse { font-size: 0.875rem; color: #c9d0c3; margin: 0 auto 10px; max-width: 1240px; }
@media (min-width: 900px) {
  .vis-rangee { overflow: visible; justify-content: center; flex-wrap: wrap; }
  .vis-panneau { flex: 0 0 390px; }
  .vis-glisse { display: none; }
}
</style>
<body>
<div class="page">
<header>
<p class="sur-titre">${surTitre}</p>
<h1>${h1}</h1>
</header>

<section id="a-choisir" aria-label="À choisir">
<div class="encart">
${choisir}
</div>
</section>

<nav class="sommaire" aria-label="Les lots">
${sommaire}
</nav>

${rangees}

<footer>
${pied}
</footer>
</div>

<div class="visionneuse" id="visionneuse" hidden role="dialog" aria-modal="true" aria-labelledby="vis-titre">
<div class="vis-tete">
<p class="vis-titre" id="vis-titre"></p>
<div class="vis-boutons">
<button type="button" id="vis-prec" aria-label="Mini maquette précédente">◀</button>
<button type="button" id="vis-suiv" aria-label="Mini maquette suivante">▶</button>
<button type="button" class="fermer" id="vis-fermer">Fermer</button>
</div>
</div>
<p class="vis-glisse" id="vis-glisse">Glisse : ton choix pour le même écran →</p>
<div class="vis-rangee" id="vis-rangee"></div>
</div>

<script>
// La visionneuse seule : la case en grand (390 px), à côté de ton choix pour le même écran. Le contenu ne dépend pas de ce script.
(function () {
  var vis = document.getElementById('visionneuse');
  var rangee = document.getElementById('vis-rangee');
  var titre = document.getElementById('vis-titre');
  var glisse = document.getElementById('vis-glisse');
  var boutons = Array.prototype.slice.call(document.querySelectorAll('.planche .ecran'));
  var rang = -1, retour = null;
  function panneau(c, leg, dossier, ref) {
    var p = c.split('|'), cols = +p[1], rows = +p[2], x = +p[3], y = +p[4];
    var f = document.createElement('figure'); f.className = 'vis-panneau' + (ref ? ' ref' : '');
    var cap = document.createElement('figcaption'); cap.textContent = leg;
    var cadre = document.createElement('span'); cadre.className = 'cadre';
    var i = document.createElement('img'); i.src = 'planches/' + p[0]; i.alt = leg;
    i.style.width = (cols * 100) + '%'; i.style.left = (-x * 100) + '%'; i.style.top = (-y * 100) + '%';
    cadre.appendChild(i); f.appendChild(cap); f.appendChild(cadre);
    return f;
  }
  function ouvrir(n, depuis) {
    if (depuis) retour = depuis;
    rang = n;
    var b = boutons[rang];
    titre.textContent = b.getAttribute('data-nom');
    rangee.textContent = '';
    rangee.appendChild(panneau(b.getAttribute('data-case'), b.closest('figure').querySelector('.id').textContent));
    var r = b.getAttribute('data-ref');
    if (r) rangee.appendChild(panneau(r, b.getAttribute('data-ref-nom'), null, true));
    glisse.hidden = !r;
    vis.hidden = false; vis.scrollTop = 0;
    document.getElementById('vis-fermer').focus();
  }
  function fermer() { vis.hidden = true; rangee.textContent = ''; if (retour) retour.focus(); retour = null; }
  function aller(pas) { if (rang >= 0) ouvrir((rang + pas + boutons.length) % boutons.length); }
  document.addEventListener('click', function (e) { var b = e.target.closest('.planche .ecran'); if (b) ouvrir(boutons.indexOf(b), b); });
  document.getElementById('vis-fermer').addEventListener('click', fermer);
  document.getElementById('vis-prec').addEventListener('click', function () { aller(-1); });
  document.getElementById('vis-suiv').addEventListener('click', function () { aller(1); });
  document.addEventListener('keydown', function (e) {
    if (vis.hidden) return;
    if (e.key === 'Escape') fermer();
    if (e.key === 'ArrowRight') aller(1);
    if (e.key === 'ArrowLeft') aller(-1);
  });
})();
</script>
</body>
</html>
`;
}
