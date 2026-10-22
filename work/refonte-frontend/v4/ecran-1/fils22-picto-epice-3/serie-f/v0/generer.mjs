// Planche « épicé », série F : l'épice réelle, cadrée librement (mission 2026-10-22-reprise-lot21, voie r4d-f-greffe).
// Usage : node generer.mjs   → etat.html. Puis node capturer.mjs pour les trois captures.
// Huit propositions (dessins.mjs), chacune : seule à 12, 16 et 24 px ; à côté de la feuille d'Herbacé et des brins
// de Végétal, à 16 puis 12 px ; sur trois vraies cartes de houblon (Saaz, Cascade, Hallertau Mittelfrüh) avec les
// pictos des autres familles. Les symboles des familles viennent tels quels de fils17-standard/v3/planche.html
// (p-…). Classes préfixées rf- (L26) ; page assemblée par concaténation, sans remplacement de chaîne. Rien sous
// 12 px (D60).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { VARIANTES, TON, MASQUES } from './dessins.mjs';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const V3 = fs.readFileSync(path.join(ICI, '../../../fils17-standard/v3/planche.html'), 'utf8');
const FAMILLES = ['citrus', 'floral', 'herbal', 'resin', 'green', 'earthy'];
const NOM_FAM = { citrus: 'Agrumes', floral: 'Floral', herbal: 'Herbacé', resin: 'Résineux', earthy: 'Terreux', green: 'Végétal' };
const symFamille = (f) => {
  const m = new RegExp(`<symbol id="p-${f}"[^]*?</symbol>`).exec(V3);
  if (!m) throw new Error('symbole p-' + f + ' introuvable dans la planche v3');
  return m[0];
};

// Trois houblons réels. α : Beer Maverick, prototypes/houblons-v4/data/proto-data.json (Cascade 4,5–9 ;
// Hallertau Mittelfrüh 3–5,5) ; Saaz, même source reprise de la planche r4c (absent du jeu du prototype).
// Familles : tags Beer Maverick dans leur ordre (Cascade : grapefruit, floral, spicy, citrus, pine ; Mittelfrüh :
// spicy, floral, citrus, grassy) ; Saaz : profil du prototype. Rôle : Cascade tardif et à cru (Crosby Hops) ;
// Saaz et Mittelfrüh déduits de l'α, d'où « ≈ ».
const HOUBLONS = [
  { nom: 'Saaz', alpha: 'α 2–5 %', role: 'aromatique ≈', familles: ['floral', 'herbal', 'SPICE', 'green', 'earthy'] },
  { nom: 'Cascade', alpha: 'α 4,5–9 %', role: 'tardif · à cru', familles: ['citrus', 'floral', 'SPICE', 'resin'] },
  { nom: 'Hallertau Mittelfrüh', alpha: 'α 3–5,5 %', role: 'aromatique ≈', familles: ['SPICE', 'floral', 'citrus', 'green'] },
];

const symboleVar = (v) => `<symbol id="s-${v.id}" viewBox="0 0 24 24" fill="none" stroke="${TON}" stroke-width="2.571" stroke-linecap="round" stroke-linejoin="round">${v.dessin}</symbol>`;
const sp = (v, w) => `<svg class="rf-p" width="${w}" height="${w}" data-famille="spice" role="img" aria-label="Épicé"><use href="#s-${v.id}"/></svg>`;
const autre = (f, w = 16) => `<svg class="rf-p" width="${w}" height="${w}" data-famille="${f}" role="img" aria-label="${NOM_FAM[f]}"><use href="#p-${f}"/></svg>`;
const court = (v) => v.id.split('-')[0];

const tailles = (v) => `<div class="rf-tl">
    <span class="rf-tz">${[12, 16, 24].map((w) => `<span class="rf-tc">${sp(v, w)}<i>${w}</i></span>`).join('')}</span>
    <span class="rf-ep" title="à côté de la feuille et des brins"><span class="rf-eg">${autre('herbal')}${autre('green')}${sp(v, 16)}</span><span class="rf-eg">${autre('herbal', 12)}${autre('green', 12)}${sp(v, 12)}</span></span>
  </div>`;

const cartes = (v) => `<div class="rf-cs">${HOUBLONS.map((h) => `<div class="rf-c" data-carte="${h.nom}">
    <div class="rf-c1"><b>${h.nom}</b><span class="rf-a">${h.alpha}</span><span class="rf-r">${h.role}</span></div>
    <div class="rf-c2">${h.familles.map((f) => (f === 'SPICE' ? sp(v, 16) : autre(f))).join('')}</div>
  </div>`).join('')}</div>`;

const blocs = VARIANTES.map((v) => `<section class="rf-v" id="${v.id}" data-variante="${v.id}" data-genre="${v.genre}" data-epice="${v.epice}">
  <div class="rf-t"><span class="rf-id">${court(v)}</span><h2>${v.nom}</h2><span class="rf-ge">${v.genre}</span></div>
  <p class="rf-dit">${v.dit}</p>
  ${tailles(v)}
  ${cartes(v)}
</section>`).join('\n');

const sommaire = `<div class="rf-som">${VARIANTES.map((v) => `<a class="rf-si" href="#${v.id}">${sp(v, 24)}<i>${court(v)}</i></a>`).join('')}</div>`;

const css = `
  * { box-sizing: border-box; }
  body.rf { margin: 0; padding: 12px; font: 14px/1.3 system-ui, sans-serif; color: #1c1f26; background: #fbfaf8; max-width: 390px; }
  .rf h1 { font-size: 16px; margin: 0 0 2px; }
  .rf-sous { font-size: 12px; color: #6b7280; margin: 0 0 10px; }
  .rf-som { display: grid; grid-template-columns: repeat(8, 1fr); gap: 2px; margin: 0 0 12px; padding: 8px 4px; background: #fff; border: 1px solid #e7e5e0; border-radius: 12px; }
  .rf-si { display: flex; flex-direction: column; align-items: center; gap: 3px; text-decoration: none; }
  .rf-si i { font: 600 12px system-ui; color: #6b7280; font-style: normal; }
  .rf-v { background: #fff; border: 1px solid #e7e5e0; border-radius: 12px; padding: 10px 12px 12px; margin: 0 0 10px; scroll-margin-top: 8px; }
  .rf-t { display: flex; align-items: baseline; gap: 8px; }
  .rf-id { font: 700 12px ui-monospace, monospace; color: ${TON}; }
  .rf h2 { font-size: 15px; font-weight: 700; margin: 0; }
  .rf-ge { margin-left: auto; font-size: 12px; color: #6b7280; border: 1px solid #d6d3cc; border-radius: 999px; padding: 0 7px; white-space: nowrap; }
  .rf-dit { font-size: 12px; color: #4b5563; margin: 3px 0 8px; }
  .rf-tl { display: flex; align-items: flex-end; justify-content: space-between; padding: 0 0 10px; border-bottom: 1px solid #efede8; }
  .rf-tz { display: flex; align-items: flex-end; gap: 14px; }
  .rf-tc { display: flex; flex-direction: column; align-items: center; gap: 3px; }
  .rf-tc i { font-size: 12px; color: #9aa0aa; font-style: normal; line-height: 1; }
  .rf-ep { display: flex; align-items: center; gap: 14px; padding: 6px 8px; border-radius: 8px; background: #f6f5f2; }
  .rf-eg { display: flex; align-items: center; gap: 6px; }
  .rf-cs { display: flex; flex-direction: column; gap: 6px; margin-top: 10px; }
  .rf-c { background: #f3f2ef; border-radius: 12px; padding: 7px 10px 8px; }
  .rf-c1 { display: flex; align-items: baseline; gap: 8px; }
  .rf-c1 b { font-size: 15px; }
  .rf-a { font: 700 13px ui-monospace, monospace; }
  .rf-r { font-size: 12px; color: #4b5563; }
  .rf-c2 { display: flex; align-items: center; gap: 10px; margin-top: 5px; height: 18px; }
  .rf-src { font-size: 12px; color: #6b7280; margin: 4px 0 0; }
  .rf-p { flex: none; display: block; }
`;

const html = [
  '<!doctype html>',
  '<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">',
  '<title>Épicé, série F : l’épice réelle, cadrée librement</title>',
  '<style>' + css + '</style></head>',
  '<body class="rf">',
  '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>' + MASQUES + '</defs>',
  FAMILLES.map(symFamille).join('\n'),
  VARIANTES.map(symboleVar).join('\n'),
  '</svg>',
  '<h1>Épicé, série F : l’épice réelle, cadrée librement</h1>',
  '<p class="rf-sous">Clou, cannelle, vanille : huit cadrages. Chacun seul, contre la feuille et les brins, puis sur trois cartes.</p>',
  sommaire,
  blocs,
  '<p class="rf-src">α : Beer Maverick. Rôle : Cascade, Crosby Hops ; Saaz et Mittelfrüh, déduit de l’α (≈). Familles : Beer Maverick ; Saaz, profil du prototype.</p>',
  '</body></html>',
  '',
].join('\n');
fs.writeFileSync(path.join(ICI, 'etat.html'), html);
console.log('PLANCHE écrite : ' + VARIANTES.length + ' propositions, genres : ' + [...new Set(VARIANTES.map((v) => v.genre))].join(', '));
