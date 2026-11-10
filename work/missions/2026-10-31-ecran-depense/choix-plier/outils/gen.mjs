#!/usr/bin/env node
// Voie r3-plier (D307, 02.11) : « J'aime beaucoup D mais il faudrait pouvoir facilement tout plier, déplier ».
// Sur D (choix-sousfamilles, retouche e-t12 comprise), seul varie le geste qui plie ou déplie tous les sous-groupes d'un coup, et ce qu'il montre.
// Balisage de D repris tel quel de choix-sousfamilles/outils/gen.mjs (lui-même celui de Liste.tsx, Ligne.tsx, Entete.tsx, Pied.tsx), feuille
// compilée avec la configuration Tailwind de l'app, captures à 390 px (×2). Règles neuves : pl- (outils/pl.css). Tout est fictif.
// Usage (depuis la racine du dépôt) : node work/missions/2026-10-31-ecran-depense/choix-plier/outils/gen.mjs [--sans-captures]
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

// ---- Icônes (lucide, comme l'app ; cube de Pictos.tsx) : reprises de choix-sousfamilles ----
const svg = (d, s, sw = 2) => `<svg aria-hidden="true" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const X = svg('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>', 20);
const FILE = (s) => svg('<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>', s);
const CHECK = svg('<path d="M20 6 9 17l-5-5"/>', 14);
const CHEV_D = svg('<path d="m9 18 6-6-6-6"/>', 14, 2.2);
const CHEV_B = svg('<path d="m6 9 6 6 6-6"/>', 14, 2.2);
const CHEV_FORM = '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';
// Neuf : le chevron double (lucide chevrons-right / chevrons-down), « tous les chevrons » ; même trait que le chevron des sous-groupes.
const CHEVS = (ouvert, s = 16) => svg(ouvert ? '<path d="m7 6 5 5 5-5"/><path d="m7 13 5 5 5-5"/>' : '<path d="m6 17 5-5-5-5"/><path d="m13 17 5-5-5-5"/>', s, 2.2);
const CUBE = { relie: 'text-cave-50', aucun: 'text-cave-400' };
function picto(lien) {
  const cube = '<path d="M10 2.5 17 6v8l-7 3.5L3 14V6z"/><path d="M3 6l7 3.5L17 6M10 9.5v8"/>';
  const coche = lien === 'relie' ? '<circle cx="15" cy="15" r="4.6" fill="currentColor" stroke="none"/><path d="M12.8 15.1l1.6 1.6 2.9-3" stroke="#fff"/>' : '';
  return `<svg role="img" aria-label="${lien === 'relie' ? 'relié' : 'aucun mouvement de stock'}" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="${30 / 18}" class="shrink-0 ${CUBE[lien]}"><g>${cube}</g>${coche}</svg>`;
}

// ---- Données fictives ----
const SF = {
  renovation: ['Peinture et sols', 'Outillage', 'Quincaillerie', 'Électricité', 'Plomberie', 'Protection', 'Divers travaux'],
  nettoyage: ['CIP alcalin', 'CIP acide', 'Désinfectant', 'Détergent'],
  consommable: ['EPI', 'Consommable'],
};
const FAM = {
  nettoyage: { nom: 'Nettoyage', t: 'dp-p3c-t-nettoyage', pt: 'dp-p3c-pt-nettoyage', fi: 'border-l-4 dp-p3c-fi-nettoyage' },
  consommable: { nom: 'Consommables', t: 'dp-p3c-t-consommable', pt: 'dp-p3c-pt-consommable', fi: 'border-l-4 dp-p3c-fi-consommable' },
  renovation: { nom: 'Rénovation', t: 'sf-t-renovation', pt: 'sf-pt-renovation', fi: 'border-l-4 sf-fi-renovation' },
};
const L = (nom, sf, q, u, pu, lien = 'aucun', alpha, repris = false) => ({ nom, sf, q, u, pu, lien, alpha, repris, cents: Math.round(q * pu) });
// Brico Fictif SA de D : Consommables et Rénovation tels quels (16 lignes, 7 sous-familles). La bande Nettoyage grandit (D307 : « plus une
// bande Nettoyage ») : six lignes en trois sous-groupes, dont une unité déduite (« repris ») qui ouvre Désinfectant d'office, règle de D.
const BRICO = [
  { cle: 'nettoyage', lignes: [
    L('Soude caustique 1 kg', 'CIP alcalin', 1, 'Kg', 980, 'relie'),
    L('Additif CIP alcalin 1 L', 'CIP alcalin', 1, 'Stk', 1260, 'relie'),
    L('Acide peracétique 5 % 1 L', 'Désinfectant', 1, 'Stk', 1640, 'relie'),
    L('Spray désinfectant 500 ml', 'Désinfectant', 2, 'Stk', 690, 'aucun', undefined, true),
    L('Dégraissant sol 5 L', 'Détergent', 1, 'Stk', 1890, 'relie'),
    L('Nettoyant sol neutre 5 L', 'Détergent', 1, 'Stk', 1450),
  ] },
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

const fr2 = (c) => (c / 100).toFixed(2).replace('.', ',');
const prixTxt = (pu) => (pu < 100 ? (pu / 100).toFixed(3).replace('.', ',') : fr2(pu));
const somme = (ls) => ls.reduce((s, l) => s + l.cents, 0);
const REPRIS = 'not-italic text-attention underline decoration-dotted decoration-attention underline-offset-2';
const qteBande = (ls) => {
  const par = new Map();
  for (const l of ls) { const e = par.get(l.u) ?? { n: 0, repris: false }; e.n += l.q; e.repris ||= l.repris; par.set(l.u, e); }
  return [...par].map(([u, e]) => { const t = `${String(e.n).replace('.', ',')} ${u}`; return e.repris ? `<i data-dp-niveau="repris" class="${REPRIS}">${t}</i>` : t; }).join(' + ');
};
const aVerifier = (ls) => ls.some((l) => l.repris);
const sousFamilles = (cle, ls) => SF[cle].map((nom) => ({ nom, lignes: ls.filter((l) => l.sf === nom) })).filter((g) => g.lignes.length);
// Un sous-groupe se plie s'il a deux lignes au moins et aucune ligne à vérifier (règle de D : celle-là reste ouverte, « tout plier » compris).
const pliable = (g) => g.lignes.length > 1 && !aVerifier(g.lignes);
// État d'affichage : { tous: true } tout déplié, { ouverts: [...] } groupes ouverts à la main, {} tout plié.
const ouvertG = (g, etat) => g.lignes.length > 1 && (aVerifier(g.lignes) || etat.tous || (etat.ouverts ?? []).includes(g.nom));
const bandeOuverte = (b, etat) => { const gs = sousFamilles(b.cle, b.lignes).filter(pliable); return gs.length > 0 && gs.every((g) => ouvertG(g, etat)); };
const bandePliable = (b) => { const gs = sousFamilles(b.cle, b.lignes); return gs.length > 1 && gs.some(pliable); }; // une seule sous-famille : la bande de D, sans geste
const toutOuvert = (bandes, etat) => bandes.filter(bandePliable).every((b) => bandeOuverte(b, etat));

// ---- Balisage de D (choix-sousfamilles/outils/gen.mjs), inchangé ; `geste` : ce que l'option B pose dans l'en-tête de bande ----
const enteteBande = (b, gauche) => `<div data-dp-bande-entete class="dp-p3c-bande-entete flex items-center gap-1.5 px-2.5 text-sm ${FAM[b.cle].t}">
  ${gauche ?? `<i aria-hidden class="size-2.5 shrink-0 rounded-full ${FAM[b.cle].pt}"></i><strong class="font-semibold text-cave-50">${FAM[b.cle].nom}</strong>
  <span class="rounded-control border border-cave-600 bg-cave-950 px-1.5 font-mono text-xs leading-[18px] text-cave-200">${b.lignes.length}</span>`}
  <span data-dp-sous-qte class="ml-auto mr-[57px] whitespace-nowrap text-right font-mono text-xs font-semibold text-cave-200">${qteBande(b.lignes)}</span>
  <span data-dp-sous-montant class="min-w-[54px] shrink-0 whitespace-nowrap text-right font-mono text-sm font-semibold text-cave-50">${fr2(somme(b.lignes))}</span></div>`;

function rangee(l, cle) {
  return `<article data-purchase-line data-dp-groupe="${cle}" class="dp-p3c-li scroll-mt-9 border-b border-cave-800 ${FAM[cle].fi}">
  <details data-dp-plateau><summary class="dp-p3c-r relative list-none cursor-pointer flex items-center gap-1.5 px-2.5 min-h-7">
    <i aria-hidden class="dp-no-chevron hidden"></i><span data-dp-lien class="inline-flex shrink-0">${picto(l.lien)}</span>
    <span class="min-w-0 flex-1 flex flex-wrap items-center gap-x-1.5 py-0.5"><span class="flex min-w-0 items-center gap-x-1.5"><b data-dp-nom class="dp-p3c-nom min-w-0 text-sm font-normal leading-tight text-cave-50">${l.nom}</b></span>${l.alpha ? `<span data-dp-alpha class="font-mono text-xs text-cave-400">α ${l.alpha}</span>` : ''}</span>
    <span class="dp-p3c-dq"><span data-dp-qte ${l.repris ? 'data-dp-niveau="repris" ' : ''}class="font-semibold${l.repris ? ' text-attention underline decoration-dotted decoration-attention underline-offset-2' : ''}">${String(l.q).replace('.', ',')} ${l.u}</span><i>×</i><span data-dp-prix>${prixTxt(l.pu)}</span></span>
    <span data-dp-montant class="w-[54px] shrink-0 text-right font-mono text-sm text-cave-50">${fr2(l.cents)}</span>
  </summary></details></article>`;
}

const sousGroupe = (cle, g, ouvert) => `<button type="button" data-sf-sous-groupe aria-expanded="${ouvert}" class="sf-sg sf-c-${cle} ${FAM[cle].fi} flex min-h-7 w-full items-center gap-1.5 border-b border-cave-800 px-2.5 text-left text-sm">
  <span class="inline-flex w-[18px] shrink-0 justify-center text-cave-400">${ouvert ? CHEV_B : CHEV_D}</span><span class="${ouvert ? 'font-semibold text-cave-50' : 'text-cave-50'}">${g.nom}</span>
  <span class="rounded-control border border-cave-600 bg-cave-950 px-1.5 font-mono text-xs leading-[18px] text-cave-200">${g.lignes.length}</span>
  <span data-sf-sous-qte class="ml-auto mr-[57px] whitespace-nowrap text-right font-mono text-xs font-semibold text-cave-200">${qteBande(g.lignes)}</span>
  <span class="w-[54px] shrink-0 text-right font-mono text-sm text-cave-50">${fr2(somme(g.lignes))}</span></button>`;

// B : l'en-tête de bande se touche (point, nom, compte, double chevron) ; seule cette bande plie ou déplie. L'en-tête colle déjà en haut (p3c.css).
const gaucheB = (b, etat) => { const o = bandeOuverte(b, etat); return `<button type="button" data-booster="plier-bande" aria-expanded="${o}" aria-label="${FAM[b.cle].nom} : ${o ? 'tout plier' : 'tout déplier'}" class="pl-bande-geste pl-vise">
  <i aria-hidden class="size-2.5 shrink-0 rounded-full ${FAM[b.cle].pt}"></i><strong class="font-semibold text-cave-50">${FAM[b.cle].nom}</strong>
  <span class="rounded-control border border-cave-600 bg-cave-950 px-1.5 font-mono text-xs leading-[18px] text-cave-200">${b.lignes.length}</span><span class="inline-flex text-cave-200">${CHEVS(o, 16)}</span></button>`; };

function bande(b, opt, etat) {
  const gs = sousFamilles(b.cle, b.lignes);
  const corps = gs.length <= 1 ? b.lignes.map((l) => rangee(l, b.cle)).join('') : gs.map((g) => {
    if (g.lignes.length === 1) return rangee(g.lignes[0], b.cle);
    const ouvert = ouvertG(g, etat);
    return sousGroupe(b.cle, g, ouvert) + (ouvert ? g.lignes.map((l) => rangee(l, b.cle)).join('') : '');
  }).join('');
  const gauche = opt === 'b' && bandePliable(b) ? gaucheB(b, etat) : undefined;
  return `<div data-dp-bande="${b.cle}">${enteteBande(b, gauche)}<div>${corps}</div></div>`;
}

const finListe = (bandes) => { const t = fr2(bandes.reduce((s, b) => s + somme(b.lignes), 0)); return `<div data-dp="fin" class="flex flex-wrap items-center gap-1.5 px-2.5 py-2">
  <button type="button" class="min-h-7 rounded-control border border-dashed border-cave-600 px-2.5 text-sm text-cave-200">+ Ajouter une ligne</button>
  <span class="ml-auto text-xs text-cave-400">Détail <b class="font-mono font-medium">${t} / ${t}</b></span></div>`; };
const formulaire = (fournisseur, date) => `<div class="mx-2 mt-2">${[['Pour quoi ?', `${fournisseur} · BF-4471 · nettoyage, consommables · proposé`], ['Date de l’achat', date], ['Fournisseur et catégorie', `${fournisseur} · Local`], ['Lier à une dépense prévue', 'facultatif'], ['Référence et TVA du document', 'BF-4471']]
  .map(([a, b]) => `<div class="flex min-h-[37px] items-center gap-2 border-b border-cave-800 px-1 text-sm text-cave-200"><span class="shrink-0">${a}</span><span class="ml-auto min-w-0 truncate text-xs text-cave-400">${b}</span><span class="text-cave-400">${CHEV_FORM}</span></div>`).join('')}<p class="px-1 py-3 text-xs text-cave-400">Le justificatif sera rangé dans ton Drive privé à l’enregistrement.</p></div>`;
const liste = (bandes, opt, etat) => `<section aria-label="Lignes de la facture" class="pb-2"><div data-dp="liste">${bandes.map((b) => bande(b, opt, etat)).join('')}</div>${finListe(bandes)}</section>`;

// En-tête de la feuille (Entete.tsx). E : le segment « Plié | Déplié » entre le titre et le justificatif ; état mêlé, aucun des deux allumé.
const entete = (opt, bandes, etat) => {
  const tout = toutOuvert(bandes, etat), rien = bandes.filter(bandePliable).every((b) => sousFamilles(b.cle, b.lignes).filter(pliable).every((g) => !ouvertG(g, etat)));
  const segE = opt === 'e' ? `<div role="group" aria-label="Sous-groupes" data-booster="plier-segment" class="pl-vise inline-flex shrink-0 overflow-hidden rounded-control border border-cave-600">${[['Plié', rien], ['Déplié', tout]].map(([m, on]) => `<button type="button" aria-pressed="${on}" class="min-h-7 px-2 text-sm ${on ? 'bg-ebc-straw text-cave-950' : 'text-cave-200'}">${m}</button>`).join('')}</div>` : '';
  return `<header class="flex h-10 shrink-0 items-center gap-1 border-b border-cave-800 bg-cave-950 pl-1 pr-1">
  <button type="button" aria-label="Fermer" class="flex size-8 items-center justify-center rounded-control text-cave-200">${X}</button>
  <h2 class="min-w-0 flex-1 truncate text-base font-semibold text-cave-50">Nouvelle dépense</h2>${segE}
  <button type="button" aria-label="Justificatif" class="flex size-8 items-center justify-center rounded-control text-cave-200">${FILE(20)}</button></header>`;
};
// Pied (Pied.tsx) : la bascule Catégorie | Papier, ✓ Confirmer. Une unité déduite n'est pas un point du pied (ExpenseSheet.tsx l. 640) : rien au milieu,
// comme dans D. `point` : le point courant que l'app y pose quand le récap est sorti (« ① Date » de f3), pour la seule mesure de chevauchement.
// C : un bouton « Tout » à double chevron juste après la bascule. D : « Catégorie » allumé porte le double chevron ; le toucher encore plie ou déplie.
const pied = (opt, bandes, etat, point) => {
  const tout = toutOuvert(bandes, etat);
  const cat = opt === 'd'
    ? `<button type="button" aria-pressed="true" data-booster="plier-categorie" aria-label="Catégorie, ${tout ? 'tout plier' : 'tout déplier'}" class="inline-flex min-h-8 items-center px-2.5 text-sm bg-ebc-straw text-cave-950">Catégorie<span class="pl-seg-ico">${CHEVS(tout, 16)}</span></button>`
    : '<button type="button" aria-pressed="true" class="min-h-8 px-2.5 text-sm bg-ebc-straw text-cave-950">Catégorie</button>';
  const boutonC = opt === 'c' ? `<button type="button" data-booster="plier-pied" aria-expanded="${tout}" aria-label="${tout ? 'Tout plier' : 'Tout déplier'}" class="pl-vise inline-flex min-h-8 shrink-0 items-center gap-0.5 rounded-control border border-cave-600 pl-1.5 pr-2 text-sm text-cave-200">${CHEVS(tout, 16)}Tout</button>` : '';
  const courant = point ? `<button type="button" data-dp="pied-courant" data-dp-niveau="repris" class="inline-flex min-h-8 min-w-0 max-w-[60%] flex-none items-center gap-1 truncate rounded-control border border-dashed px-2 text-sm text-cave-50 border-attention bg-attention/5"><span class="inline-flex size-[18px] shrink-0 items-center justify-center rounded-full border border-dashed font-mono text-xs border-attention text-attention">1</span><span class="truncate">${point}</span></button>` : '';
  return `<footer class="flex h-[52px] shrink-0 items-center gap-2 border-t border-cave-800 bg-cave-950 px-2">
  <div role="group" aria-label="Ordre des lignes" class="${opt === 'd' ? 'pl-vise ' : ''}inline-flex shrink-0 overflow-hidden rounded-control border border-cave-600">${cat}<button type="button" aria-pressed="false" class="min-h-8 px-2.5 text-sm text-cave-200">Papier</button></div>
  ${boutonC}${courant}<span class="min-w-0 flex-1"></span>
  <button type="button" data-primary class="ml-auto inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-control border border-ebc-straw bg-ebc-straw px-3.5 text-sm font-semibold text-cave-950">${CHECK} Confirmer</button></footer>`;
};

const page = (titre, theme, corps, { ecran = false } = {}) => `<!doctype html><html lang="fr" data-theme="${theme}"><head><meta charset="utf-8"><title>${titre}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Sans+3:ital,wght@0,400;0,600;0,700;1,400&family=IBM+Plex+Mono:wght@400;500;600&display=swap">
<link rel="stylesheet" href="../outils/app.css"><style>body{width:390px;margin:0}${ecran ? '.ecran{height:844px;display:flex;flex-direction:column;overflow:hidden}.corps{flex:1;overflow:hidden}' : ''}</style></head>
<body class="font-sans bg-cave-950 text-cave-200">${corps}</body></html>`;

// ---- Les options et leurs vues : la dépense à 390 × 844, défilée jusqu'aux bandes ----
const OPTIONS = ['a', 'b', 'c', 'd', 'e'];
const ETATS = { plie: {}, deplie: { tous: true }, mele: { ouverts: ['Peinture et sols'] } };
const ecranDepense = (o, th, etat, point) => page(`${o} · ${JSON.stringify(etat)}`, th, `<div class="ecran" id="cadre">${entete(o, BRICO, etat)}<div class="corps">${liste(BRICO, o, etat)}${formulaire('Brico Fictif SA', '18.10.2026')}</div>${pied(o, BRICO, etat, point)}</div>`, { ecran: true });
const RENDUS = [];
for (const o of OPTIONS) {
  for (const [v, etat] of Object.entries(ETATS)) {
    for (const th of v === 'plie' ? ['clair', 'cave'] : ['clair']) {
      const nom = `${o}-${v}${th === 'cave' ? '-sombre' : ''}`;
      fs.writeFileSync(path.join(MAQ, `${nom}.html`), ecranDepense(o, th, etat));
      RENDUS.push(nom);
    }
  }
}
// Critère 3 : la bande Rénovation seule de A, tout pliée, au cadrage de choix-sousfamilles/img/d-renovation.png (comparée par mesure-a.mjs).
const RENO = BRICO[2];
fs.writeFileSync(path.join(MAQ, 'mesure-a-renovation.html'), page('A · Rénovation tout pliée', 'clair', `<div id="cadre">${liste([RENO], 'a', {})}</div>`));
RENDUS.push('mesure-a-renovation');
// Chevauchement : le pied de chaque option avec un point courant posé (« ① Date », le plus court servi ; « ① Spray unité », un point d'unité).
for (const o of OPTIONS) for (const [k, point] of [['date', 'Date'], ['unite', 'Spray unité']]) { fs.writeFileSync(path.join(MAQ, `mesure-pied-${o}-${k}.html`), ecranDepense(o, 'clair', {}, point)); RENDUS.push(`mesure-pied-${o}-${k}`); }
console.log(`${RENDUS.length} maquettes écrites`);

execFileSync(process.execPath, [path.join(RACINE, 'node_modules', 'tailwindcss', 'lib', 'cli.js'), '-c', path.join(ICI, 'tw.config.mjs'), '-i', path.join(ICI, 'entree.css'), '-o', path.join(ICI, 'app.css')], { cwd: RACINE, stdio: 'inherit' });

// Ce que la page affiche : nombres tirés des données, jamais tapés à la main.
const groupesPliables = BRICO.filter(bandePliable).flatMap((b) => sousFamilles(b.cle, b.lignes).filter(pliable));
const donnees = {
  lignes: BRICO.reduce((s, b) => s + b.lignes.length, 0), total: fr2(BRICO.reduce((s, b) => s + somme(b.lignes), 0)),
  pliables: groupesPliables.length, bandesPliables: BRICO.filter(bandePliable).length,
  bandes: BRICO.map((b) => ({ nom: FAM[b.cle].nom, n: b.lignes.length, montant: fr2(somme(b.lignes)), qte: qteBande(b.lignes).replace(/<[^>]+>/g, ''), groupes: sousFamilles(b.cle, b.lignes).map((g) => `${g.nom} ${g.lignes.length} · ${fr2(somme(g.lignes))}`) })),
};
fs.writeFileSync(path.join(ICI, 'donnees.json'), JSON.stringify(donnees, null, 1));

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
    const sortie = nom.startsWith('mesure') ? path.join(DOSSIER, 'controle', `${nom}.png`) : path.join(IMG, `${nom}.png`);
    await p.screenshot({ path: sortie, clip: { x: 0, y: 0, width: 390, height: h } });
    tailles[nom] = h;
    // Le pied ne déborde pas : chaque commande tient dans 390 px et aucune ne chevauche sa voisine.
    const pied = await p.evaluate(() => { const f = document.querySelector('footer'); if (!f) return null; const bs = [...f.querySelectorAll('button')].map((b) => b.getBoundingClientRect()); let chev = 0; for (let i = 1; i < bs.length; i++) if (bs[i].left < bs[i - 1].right - 0.5) chev++; return { droite: Math.round(Math.max(...bs.map((b) => b.right))), chev, courant: Math.round((f.querySelector('[data-dp="pied-courant"]')?.getBoundingClientRect().width ?? 0)) }; });
    if (pied) tailles[`${nom}:pied`] = pied;
  }
  fs.writeFileSync(path.join(ICI, 'tailles.json'), JSON.stringify(tailles, null, 1));
  await nav.close();
  console.log(`${RENDUS.length} captures`);
}
