// Planche « épicé », série E : l'épice entière, au trait (mission 2026-10-22-reprise-lot21, voie r4d-e-metaphore).
// Usage : node generer.mjs   → etat.html (non versionnée ; ce générateur, dessins.mjs et capturer.mjs le sont).
// Huit épices réelles (dessins.mjs), chacune : seule à 12, 16 et 24 px ; à côté de la feuille d'Herbacé et des
// brins de Végétal, à 16 puis 12 px ; sur trois vraies cartes de houblon (Saaz, Cascade, Perle) avec les pictos
// des autres familles. Les symboles des familles viennent tels quels de fils17-standard/v3/planche.html (p-…).
// Classes préfixées re- (L26) ; aucun remplacement de chaîne sur du code client (il n'y en a pas). Rien sous 12 px.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { VARIANTES, TON } from './dessins.mjs';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const V3 = fs.readFileSync(path.join(ICI, '../../../fils17-standard/v3/planche.html'), 'utf8');
const FAMILLES = ['citrus', 'floral', 'herbal', 'resin', 'green', 'earthy', 'stoneFruit'];
const NOM_FAM = { citrus: 'Agrumes', floral: 'Floral', herbal: 'Herbacé', resin: 'Résineux', earthy: 'Terreux', green: 'Végétal', stoneFruit: 'Fruits à noyau' };
const symFamille = (f) => {
  const m = new RegExp(`<symbol id="p-${f}"[^]*?</symbol>`).exec(V3);
  if (!m) throw new Error('symbole p-' + f + ' introuvable dans la planche v3');
  return m[0];
};

// Trois houblons réels (prototypes/houblons-v4/data). α : Beer Maverick (proto-data.json). Familles :
// Saaz (CZ), profil des fiches (pack-fiches.json : épicé et végétal « marqués » chez Hopsteiner ; floral,
// herbacé, terreux chez Beer Maverick) ; Cascade, tags Beer Maverick dans leur ordre (grapefruit, floral,
// spicy, citrus, pine) ; Perle (Allemagne), tags Beer Maverick (floral, stone fruit, mint et herbal,
// earthy, slightly spicy). Rôle : Cascade tardif et à cru (Crosby Hops) ; Saaz et Perle déduits de l'α (« ≈ »).
const HOUBLONS = [
  { nom: 'Saaz', alpha: 'α 2–5 %', role: 'aromatique ≈', familles: ['floral', 'herbal', 'SPICE', 'green', 'earthy'] },
  { nom: 'Cascade', alpha: 'α 4,5–9 %', role: 'tardif · à cru', familles: ['citrus', 'floral', 'SPICE', 'resin'] },
  { nom: 'Perle', alpha: 'α 4–9 %', role: 'mixte ≈', familles: ['floral', 'stoneFruit', 'herbal', 'earthy', 'SPICE'] },
];

const symboleVar = (v) => `<symbol id="s-${v.id}" viewBox="0 0 24 24" fill="none" stroke="${TON}" stroke-width="2.571" stroke-linecap="round" stroke-linejoin="round">${v.dessin}</symbol>`;
const sp = (v, w) => `<svg class="re-p" width="${w}" height="${w}" data-famille="spice" role="img" aria-label="Épicé (${v.epice})"><use href="#s-${v.id}"/></svg>`;
const autre = (f, w = 16) => `<svg class="re-p" width="${w}" height="${w}" data-famille="${f}" role="img" aria-label="${NOM_FAM[f]}"><use href="#p-${f}"/></svg>`;
const court = (v) => v.id.split('-')[0];

const tailles = (v) => `<div class="re-tl">
    <span class="re-tz">${[12, 16, 24].map((w) => `<span class="re-tc">${sp(v, w)}<i>${w}</i></span>`).join('')}</span>
    <span class="re-ep" title="à côté de la feuille et des brins"><span class="re-eg">${autre('herbal')}${sp(v, 16)}${autre('green')}</span><span class="re-eg">${autre('herbal', 12)}${sp(v, 12)}${autre('green', 12)}</span></span>
  </div>`;

const cartes = (v) => `<div class="re-cs">${HOUBLONS.map((h) => `<div class="re-c" data-carte="${h.nom}">
    <div class="re-c1"><b>${h.nom}</b><span class="re-a">${h.alpha}</span><span class="re-r">${h.role}</span></div>
    <div class="re-c2">${h.familles.map((f) => (f === 'SPICE' ? sp(v, 16) : autre(f))).join('')}</div>
  </div>`).join('')}</div>`;

const blocs = VARIANTES.map((v) => `<section class="re-v" id="${v.id}" data-variante="${v.id}" data-genre="${v.genre}" data-epice="${v.epice}">
  <div class="re-t"><span class="re-id">${court(v)}</span><h2>${v.nom}</h2><span class="re-ge">${v.genre}</span></div>
  <p class="re-dit">${v.dit}</p>
  ${tailles(v)}
  ${cartes(v)}
</section>`).join('\n');

// Le rayon : les huit côte à côte à 24 px, chacun avec le nom de son épice, pour comparer d'un regard.
const rayon = `<nav class="re-ray" aria-label="Les huit épices">${VARIANTES.map((v) => `<a class="re-ri" href="#${v.id}">${sp(v, 24)}<i>${v.epice.replace(' vert', '')}</i></a>`).join('')}</nav>`;

const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Épicé, série E : l’épice entière, au trait</title>
<style>
  * { box-sizing: border-box; }
  body.re { margin: 0; padding: 12px; font: 14px/1.3 system-ui, sans-serif; color: #1c1f26; background: #fbfaf8; max-width: 390px; }
  .re h1 { font-size: 16px; margin: 0 0 2px; }
  .re-sous { font-size: 12px; color: #6b7280; margin: 0 0 10px; }
  .re-ray { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px 2px; margin: 0 0 12px; padding: 10px 4px 8px; background: #fff; border: 1px solid #e7e5e0; border-radius: 12px; }
  .re-ri { display: flex; flex-direction: column; align-items: center; gap: 4px; text-decoration: none; }
  .re-ri i { font: 600 12px system-ui; color: #4b5563; font-style: normal; }
  .re-v { background: #fff; border: 1px solid #e7e5e0; border-radius: 12px; padding: 10px 12px 12px; margin: 0 0 10px; scroll-margin-top: 8px; }
  .re-t { display: flex; align-items: baseline; gap: 8px; }
  .re-id { font: 700 12px ui-monospace, monospace; color: ${TON}; }
  .re h2 { font-size: 15px; font-weight: 700; margin: 0; }
  .re-ge { margin-left: auto; flex: none; font-size: 12px; color: #6b7280; border: 1px solid #d6d3cc; border-radius: 999px; padding: 0 7px; }
  .re-dit { font-size: 12px; color: #4b5563; margin: 3px 0 8px; }
  .re-tl { display: flex; align-items: flex-end; justify-content: space-between; padding: 0 0 10px; border-bottom: 1px solid #efede8; }
  .re-tz { display: flex; align-items: flex-end; gap: 14px; }
  .re-tc { display: flex; flex-direction: column; align-items: center; gap: 3px; }
  .re-tc i { font-size: 12px; color: #9aa0aa; font-style: normal; line-height: 1; }
  .re-ep { display: flex; align-items: center; gap: 14px; padding: 6px 8px; border-radius: 8px; background: #f6f5f2; }
  .re-eg { display: flex; align-items: center; gap: 6px; }
  .re-cs { display: flex; flex-direction: column; gap: 6px; margin-top: 10px; }
  .re-c { background: #f3f2ef; border-radius: 12px; padding: 7px 10px 8px; }
  .re-c1 { display: flex; align-items: baseline; gap: 8px; }
  .re-c1 b { font-size: 15px; }
  .re-a { font: 700 13px ui-monospace, monospace; }
  .re-r { font-size: 12px; color: #4b5563; }
  .re-c2 { display: flex; align-items: center; gap: 10px; margin-top: 5px; height: 18px; }
  .re-src { font-size: 12px; color: #6b7280; margin: 4px 0 0; }
  .re-p { flex: none; display: block; }
</style></head>
<body class="re">
<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
${FAMILLES.map(symFamille).join('\n')}
${VARIANTES.map(symboleVar).join('\n')}
</svg>
<h1>Épicé, série E : l’épice entière, au trait</h1>
<p class="re-sous">Huit épices réelles, vues entières ; chacune seule, entre la feuille et les brins, puis sur trois cartes.</p>
${rayon}
${blocs}
<p class="re-src">α : Beer Maverick. Rôle : Cascade, Crosby Hops ; Saaz et Perle, déduit de l’α (≈). Familles : Beer Maverick ; Saaz, fiches du prototype (épicé marqué chez Hopsteiner).</p>
</body></html>
`;
fs.writeFileSync(path.join(ICI, 'etat.html'), html);
console.log('PLANCHE écrite : ' + VARIANTES.length + ' propositions, genres : ' + [...new Set(VARIANTES.map((v) => v.genre))].join(', '));
