#!/usr/bin/env node
// Voie r2-sousfamilles (D306, 02.11) : comment la sous-famille d'une ligne se montre dans une bande de famille (vue « Catégorie »).
// Écrit les mini maquettes en HTML statique avec le balisage de l'écran servi (Liste.tsx, Ligne.tsx, Entete.tsx, Pied.tsx : mêmes classes
// Tailwind et dp-p3c-*), compile la feuille avec la configuration Tailwind de l'app (outils/tw.config.mjs), puis capture à 390 px (×2).
// Seul l'affichage de la sous-famille varie. Fournisseurs, articles, quantités, prix : tous fictifs.
// Usage (depuis la racine du dépôt) : node work/missions/2026-10-31-ecran-depense/choix-sousfamilles/outils/gen.mjs [--sans-captures]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const DOSSIER = path.resolve(ICI, '..');
const RACINE = path.resolve(DOSSIER, '..', '..', '..', '..');
const MAQ = path.join(DOSSIER, 'maquettes');
const IMG = path.join(DOSSIER, 'img');
fs.mkdirSync(MAQ, { recursive: true });
fs.mkdirSync(IMG, { recursive: true });

// ---- Icônes (lucide, comme l'app ; cube de Pictos.tsx) ----
const svg = (d, s, sw = 2) => `<svg aria-hidden="true" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const X = svg('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>', 20);
const FILE = (s) => svg('<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>', s);
const CHECK = svg('<path d="M20 6 9 17l-5-5"/>', 14);
const CHEV_D = svg('<path d="m9 18 6-6-6-6"/>', 14, 2.2);
const CHEV_B = svg('<path d="m6 9 6 6 6-6"/>', 14, 2.2);
const CHEV_FORM = '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';
const CUBE = { relie: 'text-cave-50', aucun: 'text-cave-400' };
function picto(lien) {
  const cube = '<path d="M10 2.5 17 6v8l-7 3.5L3 14V6z"/><path d="M3 6l7 3.5L17 6M10 9.5v8"/>';
  const coche = lien === 'relie' ? '<circle cx="15" cy="15" r="4.6" fill="currentColor" stroke="none"/><path d="M12.8 15.1l1.6 1.6 2.9-3" stroke="#fff"/>' : '';
  return `<svg role="img" aria-label="${lien === 'relie' ? 'relié' : 'aucun mouvement de stock'}" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="${30 / 18}" class="shrink-0 ${CUBE[lien]}"><g>${cube}</g>${coche}</svg>`;
}

// ---- Données fictives ----
// Une ligne : [nom, sous-famille, quantité, unité, prix unitaire (centimes), lien, alpha?]
const SF = {
  renovation: ['Peinture et sols', 'Outillage', 'Quincaillerie', 'Électricité', 'Plomberie', 'Protection', 'Divers travaux'],
  nettoyage: ['CIP alcalin', 'CIP acide', 'Désinfectant', 'Détergent'],
  consommable: ['EPI', 'Consommable'],
  houblon: [],
};
const FAM = {
  houblon: { nom: 'Houblons', t: 'dp-p3c-t-houblon', pt: 'bg-hop', fi: 'border-l-4 border-l-hop' },
  nettoyage: { nom: 'Nettoyage', t: 'dp-p3c-t-nettoyage', pt: 'dp-p3c-pt-nettoyage', fi: 'border-l-4 dp-p3c-fi-nettoyage' },
  consommable: { nom: 'Consommables', t: 'dp-p3c-t-consommable', pt: 'dp-p3c-pt-consommable', fi: 'border-l-4 dp-p3c-fi-consommable' },
  renovation: { nom: 'Rénovation', t: 'sf-t-renovation', pt: 'sf-pt-renovation', fi: 'border-l-4 sf-fi-renovation' },
};
const L = (nom, sf, q, u, pu, lien = 'aucun', alpha, repris = false) => ({ nom, sf, q, u, pu, lien, alpha, repris, cents: Math.round(q * pu) });
// Brico Fictif SA : 16 lignes de rénovation (7 sous-familles ; Protection = l'EPI, D306), un détergent, deux consommables. Ordre du papier.
const BRICO = [
  { cle: 'nettoyage', lignes: [L('Dégraissant sol 5 L', 'Détergent', 1, 'Stk', 1890, 'relie')] },
  { cle: 'consommable', lignes: [L('Sacs poubelle 110 L (10)', 'Consommable', 1, 'Stk', 890, 'relie'), L('Essuie-tout industriel', 'Consommable', 1, 'Stk', 1250)] },
  { cle: 'renovation', lignes: [
    L('Peinture sol époxy 2,5 L', 'Peinture et sols', 2, 'Stk', 6490),
    L('Rouleau 18 cm + bac', 'Peinture et sols', 2, 'Stk', 895),
    L('Visseuse sans fil 18 V', 'Outillage', 1, 'Stk', 8900),
    L('Vis inox 4×40 (200)', 'Quincaillerie', 1, 'Stk', 1450),
    L('Chevilles 8 mm (100)', 'Quincaillerie', 1, 'Stk', 790),
    L('Câble 3G1,5 10 m', 'Électricité', 1, 'Stk', 2490),
    L('Prise étanche IP55', 'Électricité', 2, 'Stk', 1240),
    L('Raccord laiton 1/2"', 'Plomberie', 4, 'Stk', 320),
    L('Siphon de sol inox', 'Plomberie', 1, 'Stk', 4600),
    L('Bâche de protection 4×5 m', 'Peinture et sols', 1, 'Stk', 990),
    L('Ruban de masquage 50 mm', 'Peinture et sols', 3, 'Stk', 460),
    L('Lunettes de protection', 'Protection', 1, 'Stk', 850),
    L('Gants nitrile M (100)', 'Protection', 1, 'Stk', 1290),
    L('Spatule à joint 10 cm', 'Outillage', 1, 'Stk', 650),
    L('Silicone sanitaire blanc', 'Divers travaux', 2, 'Stk', 780),
    L('Sous-couche d’accroche 1 L', 'Peinture et sols', 1, 'Stk', 1990),
  ] },
];
// Brauland Fictif : houblons (aucune sous-famille), nettoyage (4 lignes, 3 sous-familles), consommables (2 lignes, une seule sous-famille).
const BRAU = [
  { cle: 'houblon', lignes: [L('Saaz', null, 100, 'g', 5.8, 'relie', '3,5'), L('Cascade', null, 100, 'g', 6.5, 'relie', '6,8')] },
  { cle: 'nettoyage', lignes: [
    L('Soude caustique 1 kg', 'CIP alcalin', 1, 'Kg', 980, 'relie'),
    L('Acide peracétique 5 % 1 L', 'Désinfectant', 1, 'Stk', 1640, 'relie'),
    L('Détartrant acide 1 L', 'CIP acide', 1, 'Stk', 1420, 'relie'),
    L('Spray désinfectant 500 ml', 'Désinfectant', 2, 'Stk', 690, 'aucun', undefined, true),
  ] },
  { cle: 'consommable', lignes: [L('Gants nitrile L (100)', 'EPI', 1, 'Stk', 1290, 'relie'), L('Tablier imperméable', 'EPI', 1, 'Stk', 1800)] },
];

const fr2 = (c) => (c / 100).toFixed(2).replace('.', ',');
const prixTxt = (pu) => (pu < 100 ? (pu / 100).toFixed(3).replace('.', ',') : fr2(pu));
const somme = (ls) => ls.reduce((s, l) => s + l.cents, 0);
// Le sous-total de quantité, par unité, comme groupes.ts : une unité qui porte une ligne « repris » est marquée comme Liste.tsx la marque.
const REPRIS = 'not-italic text-attention underline decoration-dotted decoration-attention underline-offset-2';
const qteBande = (ls) => {
  const par = new Map();
  for (const l of ls) { const e = par.get(l.u) ?? { n: 0, repris: false }; e.n += l.q; e.repris ||= l.repris; par.set(l.u, e); }
  return [...par].map(([u, e]) => { const t = `${String(e.n).replace('.', ',')} ${u}`; return e.repris ? `<i data-dp-niveau="repris" class="${REPRIS}">${t}</i>` : t; }).join(' + ');
};
const aVerifier = (ls) => ls.some((l) => l.repris);
const sousFamilles = (cle, ls) => SF[cle].map((nom) => ({ nom, lignes: ls.filter((l) => l.sf === nom) })).filter((g) => g.lignes.length);

// ---- Balisage de l'écran servi ----
const enteteBande = (b, extra = '') => `<div data-dp-bande-entete class="dp-p3c-bande-entete flex items-center gap-1.5 px-2.5 text-sm ${FAM[b.cle].t}">
  <i aria-hidden class="size-2.5 shrink-0 rounded-full ${FAM[b.cle].pt}"></i><strong class="font-semibold text-cave-50">${FAM[b.cle].nom}</strong>
  <span class="rounded-control border border-cave-600 bg-cave-950 px-1.5 font-mono text-xs leading-[18px] text-cave-200">${b.lignes.length}</span>${extra}
  <span data-dp-sous-qte class="ml-auto mr-[57px] whitespace-nowrap text-right font-mono text-xs font-semibold text-cave-200">${qteBande(b.lignes)}</span>
  <span data-dp-sous-montant class="min-w-[54px] shrink-0 whitespace-nowrap text-right font-mono text-sm font-semibold text-cave-50">${fr2(somme(b.lignes))}</span></div>`;

// La rangée de Ligne.tsx ; `mot` : la pastille de sous-famille (option C), posée après le nom comme α.
function rangee(l, cle, { mot = false, cache = false } = {}) {
  const pastille = mot && l.sf ? `<span data-sf-mot class="sf-mot shrink-0 whitespace-nowrap rounded-control px-1.5 text-xs leading-[18px] text-cave-200">${l.sf}</span>` : '';
  return `<article data-purchase-line data-dp-groupe="${cle}" ${cache ? 'hidden' : ''} class="dp-p3c-li ${mot ? `sf-c-${cle} ` : ""}scroll-mt-9 border-b border-cave-800 ${FAM[cle].fi}">
  <details data-dp-plateau><summary class="dp-p3c-r relative list-none cursor-pointer flex items-center gap-1.5 px-2.5 min-h-7">
    <i aria-hidden class="dp-no-chevron hidden"></i><span data-dp-lien class="inline-flex shrink-0">${picto(l.lien)}</span>
    <span class="min-w-0 flex-1 flex flex-wrap items-center gap-x-1.5 py-0.5"><span class="flex min-w-0 items-center gap-x-1.5"><b data-dp-nom class="dp-p3c-nom min-w-0 text-sm font-normal leading-tight text-cave-50">${l.nom}</b></span>${l.alpha ? `<span data-dp-alpha class="font-mono text-xs text-cave-400">α ${l.alpha}</span>` : ''}${pastille}</span>
    <span class="dp-p3c-dq"><span data-dp-qte ${l.repris ? 'data-dp-niveau="repris" ' : ''}class="font-semibold${l.repris ? ' text-attention underline decoration-dotted decoration-attention underline-offset-2' : ''}">${String(l.q).replace('.', ',')} ${l.u}</span><i>×</i><span data-dp-prix>${prixTxt(l.pu)}</span></span>
    <span data-dp-montant class="w-[54px] shrink-0 text-right font-mono text-sm text-cave-50">${fr2(l.cents)}</span>
  </summary></details></article>`;
}

// B : le sous-titre d'un groupe (nom, nombre, sous-total), dans la colonne des montants.
const sousTitre = (cle, g) => `<div data-sf-sous-titre class="sf-st sf-c-${cle} ${FAM[cle].fi} flex h-[22px] items-center gap-1.5 border-b border-cave-800 pl-[34px] pr-2.5 text-xs">
  <span class="font-semibold text-cave-200">${g.nom}</span><span class="font-mono text-cave-400">${g.lignes.length}</span>
  <span data-sf-sous-qte class="ml-auto mr-[57px] whitespace-nowrap text-right font-mono font-semibold text-cave-200">${qteBande(g.lignes)}</span>
  <span class="w-[54px] shrink-0 text-right font-mono font-semibold text-cave-200">${fr2(somme(g.lignes))}</span></div>`;

// D : la ligne d'un sous-groupe replié (un toucher l'ouvre), à la hauteur d'une rangée.
const sousGroupe = (cle, g, ouvert) => `<button type="button" data-sf-sous-groupe aria-expanded="${ouvert}" class="sf-sg sf-c-${cle} ${FAM[cle].fi} flex min-h-7 w-full items-center gap-1.5 border-b border-cave-800 px-2.5 text-left text-sm">
  <span class="inline-flex w-[18px] shrink-0 justify-center text-cave-400">${ouvert ? CHEV_B : CHEV_D}</span><span class="${ouvert ? 'font-semibold text-cave-50' : 'text-cave-50'}">${g.nom}</span>
  <span class="rounded-control border border-cave-600 bg-cave-950 px-1.5 font-mono text-xs leading-[18px] text-cave-200">${g.lignes.length}</span>
  <span data-sf-sous-qte class="ml-auto mr-[57px] whitespace-nowrap text-right font-mono text-xs font-semibold text-cave-200">${qteBande(g.lignes)}</span>
  <span class="w-[54px] shrink-0 text-right font-mono text-sm text-cave-50">${fr2(somme(g.lignes))}</span></button>`;

// E : la rangée de pastilles sous l'en-tête ; un toucher garde les lignes de la sous-famille, l'ordre du papier ne bouge pas.
const pastilles = (cle, gs, actif) => `<div data-sf-pastilles class="${FAM[cle].fi} flex flex-wrap gap-1 border-b border-cave-800 px-2.5 py-1.5">${gs.map((g) => `<button type="button" aria-pressed="${g.nom === actif}" class="sf-ch inline-flex min-h-6 items-center gap-1 rounded-control border border-cave-600 bg-cave-950 px-1.5 text-xs text-cave-200">${g.nom}${g.nom === actif ? `<span data-sf-sous-qte class="sf-ch-n font-mono font-semibold">${qteBande(g.lignes)}</span>` : ''}<span class="sf-ch-n font-mono text-cave-400">${fr2(somme(g.lignes))}</span>${g.nom === actif ? '<span aria-label="toutes" class="ml-0.5 font-semibold">✕</span>' : ''}</button>`).join('')}</div>`;

// Une bande, selon l'option. `etat` : D → sous-famille ouverte ; E → pastille active.
function bande(b, opt, etat = {}) {
  const gs = sousFamilles(b.cle, b.lignes);
  const plusieurs = gs.length > 1; // une seule sous-famille, ou aucune : la bande reste celle d'aujourd'hui (D306)
  let corps;
  if (!plusieurs || opt === 'a') corps = b.lignes.map((l) => rangee(l, b.cle)).join('');
  else if (opt === 'b') corps = gs.map((g) => sousTitre(b.cle, g) + g.lignes.map((l) => rangee(l, b.cle)).join('')).join('');
  else if (opt === 'c') corps = b.lignes.map((l) => rangee(l, b.cle, { mot: true })).join('');
  else if (opt === 'd') corps = gs.map((g) => {
    if (g.lignes.length === 1) return rangee(g.lignes[0], b.cle);
    const ouvert = etat.ouvert === g.nom || aVerifier(g.lignes);
    return sousGroupe(b.cle, g, ouvert) + (ouvert ? g.lignes.map((l) => rangee(l, b.cle)).join('') : '');
  }).join('');
  else if (opt === 'e') corps = pastilles(b.cle, gs, etat.actif) + b.lignes.map((l) => rangee(l, b.cle, { cache: etat.actif && l.sf !== etat.actif })).join('');
  return `<div data-dp-bande="${b.cle}">${enteteBande(b)}<div>${corps}</div></div>`;
}

const finListe = (bandes) => { const t = fr2(bandes.reduce((s, b) => s + somme(b.lignes), 0)); return `<div data-dp="fin" class="flex flex-wrap items-center gap-1.5 px-2.5 py-2">
  <button type="button" class="min-h-7 rounded-control border border-dashed border-cave-600 px-2.5 text-sm text-cave-200">+ Ajouter une ligne</button>
  <span class="ml-auto text-xs text-cave-400">Détail <b class="font-mono font-medium">${t} / ${t}</b></span></div>`; };
const formulaire = (fournisseur, date) => `<div class="mx-2 mt-2">${[['Pour quoi ?', `${fournisseur} · BF-4471 · nettoyage, consommables · proposé`], ['Date de l’achat', date], ['Fournisseur et catégorie', `${fournisseur} · Local`], ['Lier à une dépense prévue', 'facultatif'], ['Référence et TVA du document', 'BF-4471']]
  .map(([a, b]) => `<div class="flex min-h-[37px] items-center gap-2 border-b border-cave-800 px-1 text-sm text-cave-200"><span class="shrink-0">${a}</span><span class="ml-auto min-w-0 truncate text-xs text-cave-400">${b}</span><span class="text-cave-400">${CHEV_FORM}</span></div>`).join('')}<p class="px-1 py-3 text-xs text-cave-400">Le justificatif sera rangé dans ton Drive privé à l’enregistrement.</p></div>`;
const liste = (bandes, opt, etat) => `<section aria-label="Lignes de la facture" class="pb-2"><div data-dp="liste">${bandes.map((b) => bande(b, opt, b.cle === etat.cle ? etat : {})).join('')}</div>${finListe(bandes)}</section>`;
const entete = `<header class="flex h-10 shrink-0 items-center gap-1 border-b border-cave-800 bg-cave-950 pl-1 pr-1">
  <button type="button" aria-label="Fermer" class="flex size-8 items-center justify-center rounded-control text-cave-200">${X}</button>
  <h2 class="min-w-0 flex-1 truncate text-base font-semibold text-cave-50">Nouvelle dépense</h2>
  <button type="button" aria-label="Justificatif" class="flex size-8 items-center justify-center rounded-control text-cave-200">${FILE(20)}</button></header>`;
const pied = `<footer class="flex h-[52px] shrink-0 items-center gap-2 border-t border-cave-800 bg-cave-950 px-2">
  <div role="group" aria-label="Ordre des lignes" class="inline-flex shrink-0 overflow-hidden rounded-control border border-cave-600"><button type="button" aria-pressed="true" class="min-h-8 px-2.5 text-sm bg-ebc-straw text-cave-950">Catégorie</button><button type="button" aria-pressed="false" class="min-h-8 px-2.5 text-sm text-cave-200">Papier</button></div>
  <span class="min-w-0 flex-1"></span>
  <button type="button" data-primary class="ml-auto inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-control border border-ebc-straw bg-ebc-straw px-3.5 text-sm font-semibold text-cave-950">${CHECK} Confirmer</button></footer>`;

// Le haut du récap au-dessus des bandes (vue 3, défilée : seule sa dernière ligne de contrôle dépasse encore).
const page = (titre, theme, corps, { ecran = false } = {}) => `<!doctype html><html lang="fr" data-theme="${theme}"><head><meta charset="utf-8"><title>${titre}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Sans+3:ital,wght@0,400;0,600;0,700;1,400&family=IBM+Plex+Mono:wght@400;500;600&display=swap">
<link rel="stylesheet" href="../outils/app.css"><style>body{width:390px;margin:0}${ecran ? '.ecran{height:844px;display:flex;flex-direction:column;overflow:hidden}.corps{flex:1;overflow:hidden}' : ''}</style></head>
<body class="font-sans bg-cave-950 text-cave-200">${corps}</body></html>`;

// ---- Les options et leurs vues ----
const OPTIONS = ['a', 'b', 'c', 'd', 'e'];
const ETAT1 = { d: { cle: 'renovation', ouvert: 'Peinture et sols' }, e: {} };
const ETAT2 = { d: {}, e: { cle: 'nettoyage', actif: 'Désinfectant' } };
const VUES = {
  // 1. La bande Rénovation ouverte (Brico Fictif SA), et ce qui la suit à l'écran.
  renovation: (o, th) => page(`${o} · Rénovation`, th, `<div id="cadre">${liste([BRICO[2]], o, ETAT1[o] ?? {})}</div>`),
  // 2. Une autre facture : Houblons (aucune sous-famille), Nettoyage (4 lignes, 3 sous-familles), Consommables (une seule).
  nettoyage: (o, th) => page(`${o} · Nettoyage`, th, `<div id="cadre">${liste(BRAU, o, ETAT2[o] ?? {})}</div>`),
  // 3. La dépense au repos, défilée jusqu'aux bandes, à 390 × 844.
  repos: (o, th) => page(`${o} · au repos`, th, `<div class="ecran" id="cadre">${entete}<div class="corps">${liste(BRICO, o, {})}${formulaire('Brico Fictif SA', '18.10.2026')}</div>${pied}</div>`, { ecran: true }),
};
const RENDUS = [];
for (const o of OPTIONS) {
  for (const [v, f] of Object.entries(VUES)) {
    for (const th of v === 'renovation' ? ['clair', 'cave'] : ['clair']) {
      const nom = `${o}-${v}${th === 'cave' ? '-sombre' : ''}`;
      fs.writeFileSync(path.join(MAQ, `${nom}.html`), f(o, th));
      RENDUS.push(nom);
    }
  }
}
console.log(`${RENDUS.length} maquettes écrites`);

// Feuille : la configuration Tailwind de l'app sur ces maquettes.
execFileSync(process.execPath, [path.join(RACINE, 'node_modules', 'tailwindcss', 'lib', 'cli.js'), '-c', path.join(ICI, 'tw.config.mjs'), '-i', path.join(ICI, 'entree.css'), '-o', path.join(ICI, 'app.css')], { cwd: RACINE, stdio: 'inherit' });

export { BRICO, BRAU, fr2, somme };
if (!process.argv.includes('--sans-captures')) {
  const puppeteer = createRequire(path.join(RACINE, 'package.json'))('puppeteer-core');
  const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const p = await nav.newPage();
  const tailles = {};
  for (const nom of RENDUS) {
    await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await p.goto(pathToFileURL(path.join(MAQ, `${nom}.html`)).href, { waitUntil: 'networkidle0', timeout: 30000 }).catch(() => {});
    await p.evaluate(() => document.fonts.ready);
    await new Promise((r) => setTimeout(r, 250));
    const h = await p.evaluate(() => Math.ceil(document.getElementById('cadre').getBoundingClientRect().height));
    await p.screenshot({ path: path.join(IMG, `${nom}.png`), clip: { x: 0, y: 0, width: 390, height: h } });
    tailles[nom] = h;
  }
  fs.writeFileSync(path.join(ICI, 'tailles.json'), JSON.stringify(tailles, null, 1));
  await nav.close();
  console.log(`${RENDUS.length} captures dans ${IMG}`);
}
