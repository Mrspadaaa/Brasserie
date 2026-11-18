#!/usr/bin/env node
// Voie c-captures (02.11) : écrit les 18 mini maquettes (6 options × entrée, pendant l'ajout, dépense lue) en HTML statique, puis les capture à 390 px.
// Aspect repris de l'écran Dépense actuel : état vide et état « lecture » d'ExpenseSheet, Entete.tsx, Recap.tsx (Bandeau, Preuve), Ligne.tsx, Liste.tsx, Pied.
// Thème clair, jetons de themes.css. Fournisseur, articles, quantités, prix, montants et noms de fichiers : tous fictifs. Usage : node gen.mjs [--sans-captures]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const DOSSIER = path.resolve(ICI, '..');
const RACINE = path.resolve(DOSSIER, '..', '..', '..', '..');
const MAQ = path.join(DOSSIER, 'maquettes');
const IMG = path.join(DOSSIER, 'img');
fs.mkdirSync(MAQ, { recursive: true });
fs.mkdirSync(IMG, { recursive: true });

const CSS = `
:root{--c950:#fff;--c900:#f5f5f5;--c850:#ebebeb;--c800:#ddd;--c700:#bfbfbf;--c600:#9e9e9e;--c400:#666;--c200:#333;--c50:#111;
--att:rgb(156 112 32);--attT:rgb(127 91 16);--gold:#E0A02E;--hop:rgb(63 107 46);--lev:rgb(47 98 150);--vise:#2d5f8a}
*{box-sizing:border-box}
body{margin:0;width:390px;background:#fff;color:var(--c50);font:14px/1.25 "Source Sans 3",system-ui,"Segoe UI",sans-serif;overflow:hidden;position:relative}
body.gris{background:var(--c900)}
.m{font-family:"IBM Plex Mono",ui-monospace,Consolas,monospace;font-variant-numeric:tabular-nums}
.cp-h{display:flex;align-items:center;gap:4px;height:40px;border-bottom:1px solid var(--c800);padding:0 4px;background:#fff}
.cp-h h2{flex:1;margin:0;font-size:16px;font-weight:600}
.cp-ic{width:32px;height:32px;display:flex;align-items:center;justify-content:center;color:var(--c200);border-radius:10px}
.cp-ic.on{background:var(--c850)}
.cp-vise{outline:2.5px solid var(--vise);outline-offset:2px}
/* entrée (état vide d'ExpenseSheet) */
.cp-depot{margin:8px;padding:8px;border:1px dashed var(--c700);border-radius:14px;display:grid;gap:8px}
.cp-pri{min-height:32px;border-radius:10px;background:#111;color:#fff;font-weight:600;font-size:13px;display:flex;align-items:center;justify-content:center;gap:8px}
.cp-sec{min-height:28px;border-radius:10px;border:1px solid var(--c600);background:#fff;color:var(--c50);font-size:13px;display:flex;align-items:center;justify-content:center;gap:8px}
.cp-note{margin:0;text-align:center;font-size:12px;color:var(--c400)}
.cp-lien{margin:0 auto;font-size:14px;color:var(--c200);text-decoration:underline;text-underline-offset:4px}
/* pages */
.cp-pg{position:relative;flex:none;background:#fff;border:1px solid var(--c700);border-radius:6px;overflow:hidden;display:flex;flex-direction:column;gap:3px;padding:0 0 4px}
.cp-pg .bar{height:9px;background:#2c3a2a}
.cp-pg .t{height:4px;margin:3px 5px 1px;width:55%;background:#888;border-radius:2px}
.cp-pg .l{display:flex;gap:3px;margin:0 5px;align-items:center}
.cp-pg .l i{height:3px;background:#c9c9c9;border-radius:2px;flex:1}
.cp-pg .l b{height:3px;width:9px;background:#9a9a9a;border-radius:2px}
.cp-pg .tot{height:4px;margin:2px 5px 0 auto;width:30%;background:#333;border-radius:2px}
.cp-pg.papier{background:#fbf9f3;border-color:#d8d2c2;border-radius:2px}
.cp-pg.papier .bar{height:5px;background:none;border-bottom:2px solid #555;margin:4px 5px 0;width:40%}
.cp-num{position:absolute;left:3px;bottom:3px;min-width:16px;height:16px;border-radius:8px;background:#111;color:#fff;font-size:11px;line-height:16px;text-align:center;font-weight:600}
.cp-ret{position:absolute;right:2px;top:12px;width:18px;height:18px;border-radius:9px;background:rgb(255 255 255/.92);border:1px solid var(--c600);display:flex;align-items:center;justify-content:center;color:var(--c200)}
.cp-cam{position:absolute;right:3px;bottom:3px;width:18px;height:18px;border-radius:9px;background:#fff;border:1px solid var(--c600);display:flex;align-items:center;justify-content:center}
.cp-rang{display:flex;gap:8px;align-items:flex-end}
.cp-plus{flex:none;width:62px;height:116px;border:1.5px dashed var(--c600);border-radius:8px;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;color:var(--c200);font-size:13px;font-weight:600}
.cp-plus span{width:28px;height:28px;border-radius:14px;border:1px solid var(--c600);display:flex;align-items:center;justify-content:center}
/* lecture (état « lecture » d'ExpenseSheet) */
.cp-lect{margin:8px;border:1px solid var(--c800);border-radius:14px;background:rgb(245 245 245/.6);padding:5px 10px 7px;display:grid;gap:4px}
.cp-lect .nom{display:flex;align-items:baseline;justify-content:space-between;gap:8px}
.cp-lect .nom b{font-size:16px;font-weight:600}
.cp-lect .nom span{font-size:12px;color:var(--c400)}
.cp-frise{display:flex;gap:6px;font-size:12px;color:var(--c400)}
.cp-frise span{flex:1;display:flex;flex-direction:column;gap:3px}
.cp-frise i{display:block;height:6px;border-radius:10px;background:var(--c800)}
.cp-frise .f1{color:var(--c200)} .cp-frise .f1 i{background:var(--c200)}
.cp-frise .f2{color:var(--c50);font-weight:600} .cp-frise .f2 i{background:repeating-linear-gradient(90deg,#333 0 6px,#ddd 6px 12px)}
.cp-arrivent{margin:0 8px;height:118px;border:1px dashed var(--c600);border-radius:14px;display:flex;align-items:center;justify-content:center;color:var(--c400);font-size:14px}
.cp-ligne{margin:0 12px;display:flex;min-height:36px;align-items:center;border-bottom:1px solid var(--c800);font-size:14px;color:var(--c200)}
.cp-ligne em{margin-left:auto;font-style:normal;font-size:12px;color:var(--c400)}
.cp-souleve{transform:translateY(-10px) rotate(-4deg);box-shadow:0 8px 18px rgb(0 0 0/.25);outline:2.5px solid var(--vise);outline-offset:1px}
.cp-trou{flex:none;width:4px;height:100px;border-radius:2px;background:var(--vise);align-self:center}
.cp-dim{opacity:.5}
/* hors de l'app (A) */
.cp-ailleurs{margin:8px;border:1.5px dashed var(--att);border-radius:14px;padding:6px 10px 8px;background:rgb(156 112 32/.05)}
.cp-ailleurs p{margin:0 0 6px;font-size:12px;font-weight:600;color:var(--attT)}
.cp-ailleurs .flux{display:flex;align-items:center;gap:6px}
.cp-fleche{font-size:20px;color:var(--attT);padding:0 2px}
.cp-pdf{width:46px;height:62px;border:1.5px solid var(--attT);border-radius:4px;background:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:var(--attT)}
/* appareil photo (D) */
.cp-noir{background:#141414;color:#f2f2f2}
.cp-noir .cp-h{background:#141414;border-color:#2a2a2a}
.cp-noir .cp-ic{color:#eee}
.cp-vue{margin:10px 24px 0;height:306px;border-radius:6px;background:#3a3a36;display:flex;align-items:center;justify-content:center}
.cp-tir{display:flex;gap:8px;padding:10px 12px 0;align-items:flex-end}
.cp-tir .cp-pg{border-color:#555}
.cp-actif{outline:2px solid #fff;outline-offset:1px}
.cp-boutons{position:absolute;left:0;right:0;bottom:0;display:flex;gap:8px;padding:10px 12px 12px}
.cp-boutons span{flex:1;min-height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;gap:8px;font-size:15px;font-weight:600}
.cp-boutons .plus{border:1.5px solid #ddd;color:#fff}
.cp-boutons .fin{background:#fff;color:#111}
/* dépense lue */
.cp-justif{margin:8px 8px 0;border:1px solid var(--c800);border-radius:14px;background:rgb(245 245 245/.6);padding:8px;display:grid;gap:8px}
.cp-justif .act{display:flex;align-items:center;gap:6px}
.cp-bt{min-height:28px;border:1px solid var(--c600);border-radius:10px;padding:0 10px;display:inline-flex;align-items:center;gap:4px;font-size:14px;color:var(--c50);background:#fff}
.cp-trace{display:inline-flex;align-items:center;gap:3px;height:32px;padding:0 6px;border-radius:10px;color:var(--c200)}
.cp-trace .pile{position:relative;width:18px;height:20px}
.cp-trace .pile i{position:absolute;width:11px;height:15px;border:1.5px solid currentColor;border-radius:2px;background:#fff}
.cp-trace b{font-size:13px;font-weight:600}
.cp-band{margin:8px 8px 0;border:1px solid var(--c800);border-radius:14px;background:rgb(245 245 245/.4);padding:5px 10px 7px;display:grid;gap:4px}
.cp-band .r1{display:flex;align-items:baseline;justify-content:space-between}
.cp-band .r1 b{font-size:16px;font-weight:600}
.cp-band .r1 span{font-size:14px;color:var(--c200);border-bottom:1px dashed var(--c600)}
.cp-band .r2{display:flex;align-items:center;gap:8px}
.cp-band .tot{font-size:28px;font-weight:600;line-height:1.1}
.cp-chip{margin-left:auto;min-height:28px;border:1px solid var(--c700);border-radius:10px;padding:0 8px;display:inline-flex;align-items:center;gap:4px;font-size:14px;color:var(--c200);background:#fff}
.cp-barre{display:flex;height:10px;border:1px solid var(--c800);border-radius:999px;overflow:hidden}
.cp-barre i{display:block;height:100%;border-right:1.5px solid #fff}
.cp-preuve{margin:6px 8px 0;border:1px solid var(--c800);border-radius:14px;padding:2px 8px 4px;display:grid;grid-template-columns:1.12fr 1fr;column-gap:8px}
.cp-preuve div{display:flex;align-items:center;gap:4px;min-height:26px;border-bottom:1px solid var(--c800);font-size:14px;color:var(--c200)}
.cp-preuve div b{margin-left:auto;font-weight:500;color:var(--c50)}
.cp-bande{display:flex;align-items:center;gap:6px;height:28px;padding:0 10px;margin-top:8px}
.cp-bande strong{font-weight:600}
.cp-pt{width:10px;height:10px;border-radius:50%}
.cp-nb{border:1px solid var(--c600);background:#fff;border-radius:10px;padding:0 6px;font-size:12px;line-height:18px;color:var(--c200)}
.cp-bande .q{margin-left:auto;margin-right:57px;font-size:12px;font-weight:600;color:var(--c200)}
.cp-bande .t{min-width:54px;text-align:right;font-weight:600}
.cp-li{display:flex;align-items:center;gap:6px;min-height:28px;padding:0 10px;border-bottom:1px solid var(--c800);border-left:4px solid var(--gold)}
.cp-li .n{flex:1;min-width:0;font-size:14px}
.cp-li .n small{font-size:12px;color:var(--c400)}
.cp-dq{flex:none;min-width:94px;display:inline-grid;grid-template-columns:minmax(37px,max-content) 7px 44px;column-gap:3px;font-size:12px;color:var(--c400);white-space:nowrap}
.cp-dq b{text-align:right;font-weight:600} .cp-dq i{font-style:normal;text-align:center}
.cp-mt{width:54px;flex:none;text-align:right;font-size:14px}
.cp-pied{position:absolute;left:0;right:0;bottom:0;display:flex;align-items:center;gap:8px;padding:8px;border-top:1px solid var(--c800);background:#fff}
.cp-seg{display:inline-flex;border:1px solid var(--c600);border-radius:10px;overflow:hidden}
.cp-seg span{min-height:28px;display:flex;align-items:center;padding:0 10px;font-size:14px;color:var(--c200)}
.cp-seg span.on{background:#111;color:#fff;font-weight:600}
.cp-pied .conf{margin-left:auto;height:36px;border-radius:10px;background:#111;color:#fff;font-weight:600;font-size:15px;display:flex;align-items:center;padding:0 22px}
`;

const svg = (d, s = 20, sw = 2, c = 'currentColor') => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const X = svg('<path d="M18 6 6 18M6 6l12 12"/>');
const DOC = (s = 20) => svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8"/>', s);
const FILES = (s = 16) => svg('<path d="M15 2H8a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z"/><path d="M15 2v5h5"/><path d="M3 7v13a2 2 0 0 0 2 2h10"/>', s);
const CAM = (s = 16) => svg('<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/>', s);
const PLUS = (s = 16) => svg('<path d="M12 5v14M5 12h14"/>', s);
const CHECK = (s = 14, c = 'rgb(63 107 46)') => svg('<path d="M20 6 9 17l-5-5"/>', s, 2.2, c);
const XPETIT = svg('<path d="M18 6 6 18M6 6l12 12"/>', 12, 2.4);

// Une page miniature : capture d'écran d'une boutique en ligne (étroite et haute) ou feuille de papier photographiée.
function pg({ w = 62, h = 116, n = null, lignes = 5, tot = false, papier = false, cls = '', ret = false, cam = false, style = '' }) {
  const l = Array.from({ length: lignes }, (_, i) => `<div class="l"><i style="flex:${[1, 0.7, 0.9, 0.6, 0.8, 0.75, 0.95][i % 7]}"></i><b></b></div>`).join('');
  return `<div class="cp-pg${papier ? ' papier' : ''} ${cls}" style="width:${w}px;height:${h}px;${style}"><div class="bar"></div><div class="t"></div>${l}${tot ? '<div class="tot"></div>' : ''}`
    + `${n ? `<span class="cp-num m">${n}</span>` : ''}${ret ? `<span class="cp-ret">${XPETIT}</span>` : ''}${cam ? `<span class="cp-cam">${CAM(11)}</span>` : ''}</div>`;
}
// Les trois pages de la même commande fictive.
const P = [{ lignes: 4 }, { lignes: 6 }, { lignes: 2, tot: true }];

const tete = (droite = '') => `<header class="cp-h"><span class="cp-ic">${X}</span><h2>Nouvelle dépense</h2>${droite}</header>`;

// 1. L'entrée : l'état vide d'ExpenseSheet au téléphone. `vise` encadre ce qui change.
function entree({ multi = false, pages = false }) {
  const choisir = `<div class="cp-pri">${multi ? FILES(16) : DOC(16)}Choisir le document</div>`;
  const photo = `<div class="cp-sec">${CAM(16)}${pages ? 'Photographier les pages' : 'Photographier le ticket'}</div>`;
  const note = multi ? 'PDF ou images, plusieurs d’un coup · 4 Mo max.' : 'PDF ou image · lecture automatique · 4 Mo max.';
  return `${tete()}<section class="cp-depot">${multi ? `<div class="cp-vise" style="display:grid;gap:8px;border-radius:10px">${choisir}</div>` : choisir}`
    + `${pages ? `<div class="cp-vise" style="border-radius:10px">${photo}</div>` : photo}`
    + `<p class="cp-note">${note}</p><span class="cp-lien">Saisir sans justificatif</span></section>`;
}

// 2. Pendant l'ajout.
// B et E : les pages choisies partent déjà (envoi ✓) ; la lecture attend « Lire » (en gris).
const friseAttente = `<div class="cp-frise"><span class="f1"><i></i>envoi ✓</span><span><i></i>lecture</span><span><i></i>vérification</span></div>`;
const frise = `<div class="cp-frise"><span class="f1"><i></i>envoi ✓</span><span class="f2"><i></i>lecture</span><span><i></i>vérification</span></div>`;
const apresLecture = `<div class="cp-arrivent">Les lignes arrivent ici</div><div style="padding:4px 0 0"><div class="cp-ligne">Pour quoi ?<em>après la lecture</em></div><div class="cp-ligne">Règlement<em>Déjà payé · À payer</em></div></div>`;

function pendantA() {
  const minis = P.map((p, i) => pg({ w: 30, h: 56, ...p, lignes: Math.min(p.lignes, 4) })).join('');
  return `${tete()}<div class="cp-ailleurs"><p>Avant, dans une autre app : 3 captures → 1 PDF</p><div class="flux">${minis}<span class="cp-fleche">→</span><span class="cp-pdf">PDF</span></div></div>`
    + `<div class="cp-lect"><div class="nom"><b>commande-malzhaus.pdf</b><span class="m">1,4 Mo</span></div>${frise}</div>${apresLecture}`;
}

// B et E : la rangée de pages, « + page », puis « Lire n pages ». `photo` : la dernière page est une photo (E).
function rangeePages({ pages, photo = false, vise = true }) {
  const tuiles = pages.map((p, i) => pg({ ...P[i], n: i + 1, ret: true, papier: photo && i === pages.length - 1, cam: photo && i === pages.length - 1 })).join('');
  return `${tete()}<section class="cp-depot"><div class="cp-rang">${tuiles}<div class="cp-plus${vise ? ' cp-vise' : ''}"><span>${PLUS(18)}</span>+ page</div></div>`
    + `<div class="cp-pri" style="min-height:36px;font-size:15px">Lire ${pages.length} page${pages.length > 1 ? 's' : ''}</div>${photo ? '' : '<p class="cp-note">ajoute la suivante, puis Lire</p>'}</section>`
    + `<div class="cp-lect" style="padding-top:7px">${friseAttente}</div>${apresLecture}`;
}

function pendantC() {
  const t = [pg({ ...P[0], n: 1 }), '<span class="cp-trou"></span>', pg({ ...P[2], n: 3, cls: 'cp-souleve' }), pg({ ...P[1], n: 2, cls: 'cp-dim' })].join('');
  return `${tete()}<div class="cp-lect"><div class="nom"><b>3 pages</b><span class="m">2,1 Mo</span></div><div class="cp-rang" style="padding:12px 0 4px;gap:10px">${t}</div>`
    + `<p class="cp-note" style="text-align:left">glisse une page pour changer l’ordre</p>${frise}</div>${apresLecture}`;
}

function pendantD() {
  const grand = pg({ w: 206, h: 286, lignes: 13, papier: true, style: 'transform:rotate(-1.5deg);box-shadow:0 4px 18px rgb(0 0 0/.5);padding-bottom:10px;gap:9px' });
  const tirs = [pg({ w: 44, h: 60, lignes: 5, papier: true, n: 1 }), pg({ w: 44, h: 60, lignes: 5, papier: true, n: 2, cls: 'cp-actif' })].join('');
  return `<header class="cp-h"><span class="cp-ic">${X}</span><h2>Page 2</h2><span class="cp-ic" style="font-size:14px;width:auto;padding:0 8px">Reprendre</span></header>`
    + `<div class="cp-vue">${grand}</div><div class="cp-tir">${tirs}</div>`
    + `<div class="cp-boutons"><span class="plus cp-vise">${CAM(18)}+ page</span><span class="fin">Terminer · 2 pages</span></div>`;
}

// 3. La dépense lue : en-tête (trace des pages), justificatif ouvert au toucher, bandeau, preuve, premières bandes. Valeurs fictives : 6 lignes, 48,70.
const LIGNES = [
  { g: 'Malts', c: 'var(--gold)', q: '17 Kg', t: '26,40', r: [['Malt de Vienne', '6 Kg', '1,60', '9,60'], ['Malt pâle', '10 Kg', '1,45', '14,50'], ['Malt caramel belge', '1 Kg', '2,30', '2,30']] },
  { g: 'Houblons', c: 'var(--hop)', q: '200 g', t: '12,30', r: [['Saaz <small class="m">α 3,5</small>', '100 g', '0,058', '5,80'], ['Cascade <small class="m">α 6,8</small>', '100 g', '0,065', '6,50']] },
  { g: 'Levures', c: 'var(--lev)', q: '1 sachet', t: '10,00', r: [['Levure Ale sèche', '1 sachet', '10,00', '10,00']] },
];
const TEINTE = { Malts: 'rgb(224 160 46/.22)', Houblons: 'rgb(63 107 46/.2)', Levures: 'rgb(47 98 150/.2)' };
const CUBE = `<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="#111" stroke-width="1.67" style="flex:none"><path d="M10 2.5 17 6v8l-7 3.5L3 14V6z"/><path d="M3 6l7 3.5L17 6M10 9.5v8"/><circle cx="15" cy="15" r="4.6" fill="#111" stroke="none"/><path d="M12.8 15.1l1.6 1.6 2.9-3" stroke="#fff"/></svg>`;

function lue({ pdf, ouvert = true, compact = false, vise = true }) {
  const trace = pdf
    ? `<span class="cp-ic on">${DOC(20)}</span>`
    : `<span class="cp-trace${vise ? ' cp-vise' : ''}" style="background:${ouvert ? 'var(--c850)' : 'transparent'}"><span class="pile"><i style="left:0;top:0"></i><i style="left:3px;top:2.5px"></i><i style="left:6px;top:5px"></i></span><b class="m">3</b></span>`;
  const justif = pdf
    ? `<div class="cp-justif"><div class="act"><span class="cp-bt" style="color:rgb(127 91 16)">Ouvrir le PDF original</span><span class="cp-bt" style="margin-left:auto">${DOC(14)}Changer</span></div></div>`
    : !ouvert ? '' : compact ? `<div class="cp-justif" style="padding:6px 8px"><div class="act" style="gap:6px">${P.map((p, i) => pg({ w: 30, h: 56, ...p, lignes: Math.min(p.lignes, 4), n: i + 1 })).join('')}<span class="cp-bt" style="margin-left:auto">${DOC(14)}Changer</span></div></div>`
    : `<div class="cp-justif"><div class="act" style="align-items:flex-end">${P.map((p, i) => pg({ w: 46, h: 86, ...p, lignes: Math.min(p.lignes, 5), n: i + 1 })).join('')}<span class="cp-bt" style="margin-left:auto">${DOC(14)}Changer</span></div></div>`;
  const barre = LIGNES.flatMap((b) => b.r.map((r) => `<i style="flex-grow:${parseFloat(r[3].replace(',', '.'))};background:${b.c}"></i>`)).join('');
  const bandes = LIGNES.map((b) => `<div class="cp-bande" style="background:linear-gradient(${TEINTE[b.g]},${TEINTE[b.g]}),#fff;margin-top:0"><i class="cp-pt" style="background:${b.c}"></i><strong>${b.g}</strong><span class="cp-nb m">${b.r.length}</span><span class="q m">${b.q}</span><span class="t m">${b.t}</span></div>`
    + b.r.map((r) => `<div class="cp-li" style="border-left-color:${b.c}">${CUBE}<span class="n">${r[0]}</span><span class="cp-dq m"><b>${r[1]}</b><i>×</i><span>${r[2]}</span></span><span class="cp-mt m">${r[3]}</span></div>`).join('')).join('');
  return `${tete(trace)}${justif}<section class="cp-band"><div class="r1"><b>Malzhaus Nord</b><span class="m">14.10.2026</span></div>`
    + `<div class="r2"><span class="tot m">48,70</span><span style="font-size:12px;color:var(--c400)">CHF</span><span class="cp-chip">${CHECK()}<span class="m">6</span>&nbsp;lignes</span></div><div class="cp-barre">${barre}</div></section>`
    + `<section class="cp-preuve"><div>${CHECK()}Somme = imprimé<b class="m">48,70</b></div><div>${CHECK()}Qté × prix<b class="m">6/6</b></div><div style="border:0">${CHECK()}<span class="m">3</span>&nbsp;pages lues</div></section>`
    + `<div style="height:8px"></div>${bandes}<div class="cp-pied"><span class="cp-seg"><span class="on">Catégorie</span><span>Papier</span></span><span class="conf">✓ Confirmer</span></div>`;
}

const OPTIONS = {
  a: { entree: () => entree({}), pendant: pendantA, lue: () => lue({ pdf: true }) },
  b: { entree: () => entree({}), pendant: () => rangeePages({ pages: [0, 1] }), lue: () => lue({}) },
  c: { entree: () => entree({ multi: true }), pendant: pendantC, lue: () => lue({}) },
  d: { entree: () => entree({ pages: true }), pendant: pendantD, lue: () => lue({}) },
  e: { entree: () => entree({ multi: true }), pendant: () => rangeePages({ pages: [0, 1, 2], photo: true }), lue: () => lue({}) },
  f: { entree: () => entree({ multi: true, pages: true }), pendant: pendantD, lue: () => lue({}) },
};
const HAUT = { entree: 300, pendant: 520, lue: 700 };
const GRIS = { entree: true, pendant: true, lue: false };
const page = (titre, corps, haut, classe) => `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${titre}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap">
<style>${CSS}body{height:${haut}px}</style></head><body class="${classe}">${corps}</body></html>`;

export { CSS, X, DOC, FILES, CAM, PLUS, CHECK, pg, P, tete, frise, friseAttente, apresLecture, rangeePages, lue, page };
const PRINCIPAL = Boolean(process.argv[1]) && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (PRINCIPAL) {
const fichiers = [];
for (const [id, o] of Object.entries(OPTIONS)) {
  for (const genre of ['entree', 'pendant', 'lue']) {
    const nom = `${id}-${genre}`;
    const noir = genre === 'pendant' && (id === 'd' || id === 'f');
    fs.writeFileSync(path.join(MAQ, `${nom}.html`), page(`Option ${id.toUpperCase()} · ${genre}`, o[genre](), HAUT[genre], noir ? 'cp-noir' : GRIS[genre] ? 'gris' : ''));
    fichiers.push([nom, HAUT[genre]]);
  }
}
console.log(`${fichiers.length} maquettes écrites dans ${MAQ}`);

if (!process.argv.includes('--sans-captures')) {
  const puppeteer = createRequire(path.join(RACINE, 'package.json'))('puppeteer-core');
  const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const p = await nav.newPage();
  for (const [nom, haut] of fichiers) {
    await p.setViewport({ width: 390, height: haut, deviceScaleFactor: 2 });
    await p.goto(pathToFileURL(path.join(MAQ, `${nom}.html`)).href, { waitUntil: 'networkidle0', timeout: 30000 }).catch(() => {});
    await p.evaluate(() => document.fonts.ready);
    await new Promise((r) => setTimeout(r, 250)); // rendu stable : les vignettes « = X » se comparent au md5
    const d = await p.evaluate(() => [document.documentElement.scrollWidth, document.body.scrollHeight]);
    await p.screenshot({ path: path.join(IMG, `${nom}.png`) });
    console.log(`${nom}.png · contenu ${d[0]}×${d[1]}`);
  }
  await nav.close();
}
}
