// Planche « épicé », série C : le signe (mission 2026-10-22-reprise-lot21, voie r4d-c-signe, v0).
// Usage : node generer.mjs   → etat.html (même dossier).
// Angle : une lettre, un signe ou une forme qui devient « épicé » par convention, comme la roue à rayons est
// devenue Agrumes. Huit propositions, huit genres (lettre, signe musical, jeu de mots, molécule, signe olfactif, éclat, idéogramme, motif). Chaque proposition se montre à 12, 16 et 24 px, à côté de
// la feuille (Herbacé) et des brins (Végétal), puis sur trois vraies cartes de houblon (Saaz, Hallertau
// Mittelfrüh, Cascade) inspirées de la carte Suggestions de la base v4.9 (base/consolide/etat-b.html), au
// trait (D88). Dessins : viewBox 24, trait #7a4e3a de 2.571, bouts ronds, sans remplissage. Rien sous 12 px.
// Classes préfixées c4d- (L26). Les pictos des autres familles viennent de fils17-standard/v3/planche.html.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const V3 = fs.readFileSync(path.join(ICI, '../../../fils17-standard/v3/planche.html'), 'utf8');
const TON = '#7a4e3a';
const FAMILLES = ['citrus', 'floral', 'herbal', 'resin', 'green', 'earthy'];
const NOM_FAM = { citrus: 'Agrumes', floral: 'Floral', herbal: 'Herbacé', resin: 'Boisé et résineux', green: 'Végétal', earthy: 'Terreux' };
const sym = (id) => {
  const m = new RegExp(`<symbol id="${id}"[^]*?</symbol>`).exec(V3);
  if (!m) throw new Error('symbole ' + id + ' introuvable dans la planche v3');
  return m[0];
};
// Icônes de la carte (usage, stock, ébullition) : celles de la base, à la couleur du texte, trait 1,5 px rendu à 14 px.
const ICONE = (id, nv) => sym(id).replace(`id="${id}"`, `id="${nv}"`).replace(/stroke="[^"]*"/, 'stroke="currentColor"').replace(/stroke-width="[^"]*"/, 'stroke-width="2.571"');
const ACTUEL = sym('p-spice').replace('id="p-spice"', 'id="c4d-actuel"');

// Les huit signes. Chaque dessin est tenu à 12 px : écarts entre traits de 2 unités au moins (1 px rendu).
const VARIANTES = [
  {
    id: 'c1-initiale', genre: 'lettre', nom: 'É', dit: 'L’initiale, accent compris',
    // E court (10 unités) pour laisser à l’accent sa place ; accent long et franc, détaché de la barre du haut.
    dessin: '<path d="M16.5 12H7v10h9.5"/><path d="M7 17h7.5"/><path d="M12.4 7.6 17 2.6"/>',
  },
  {
    id: 'c2-diese', genre: 'signe musical', nom: 'Dièse', dit: '♯ : la note relevée, le plat relevé',
    // Deux hampes droites, deux barres montantes : le dièse de la portée, pas le croisillon « # ».
    dessin: '<path d="M9 3.6v18"/><path d="M15 2.4v18"/><path d="M4.2 12.4 19.8 6"/><path d="M4.2 19.2 19.8 12.8"/>',
  },
  {
    id: 'c3-pique', genre: 'jeu de mots', nom: 'Pique', dit: '♠ : ça pique un peu, en carte à jouer',
    dessin: '<path d="M12 2.6C9.4 6.6 4 9.2 4 13.6c0 2.6 1.9 4.4 4.2 4.4 1.6 0 2.9-.8 3.8-2.1.9 1.3 2.2 2.1 3.8 2.1 2.3 0 4.2-1.8 4.2-4.4 0-4.4-5.4-7-8-11Z"/><path d="M12 16.4 9.6 21.4h4.8Z"/>',
  },
  {
    id: 'c4-cycle', genre: 'molécule', nom: 'Cycle', dit: 'Les huiles épicées du houblon, en formule',
    // Un cycle et deux branches : l’humulène et le caryophyllène, huiles du houblon noble, en écriture de chimiste.
    dessin: '<path d="M10.5 7.6l6.1 3.5v7l-6.1 3.5-6.1-3.5v-7Z"/><path d="M10.5 7.6V2.4"/><path d="M16.6 11.1l4.4-2.5"/>',
  },
  {
    id: 'c5-fumet', genre: 'signe olfactif', nom: 'Fumet vif', dit: 'L’odeur qui monte, mais anguleuse',
    // Deux filets d’odeur en dents, en phase (l’écart reste constant), décalés en hauteur : pas trois brins droits.
    dessin: '<path d="M6.6 21.6 9.8 16 5 10.6 8.2 4.8"/><path d="M15.8 19.4 19 13.8 14.2 8.4 17.4 2.6"/>',
  },
  {
    id: 'c6-eclat', genre: 'éclat', nom: 'Éclat', dit: 'Une pointe vive, à quatre branches',
    // Étoile à quatre branches concaves, plus haute que large : une seule, sans petite sœur (pas le signe de l’IA).
    dessin: '<path d="M12 2.2c.7 6.2 2.6 8.6 7.4 9.8-4.8 1.2-6.7 3.6-7.4 9.8-.7-6.2-2.6-8.6-7.4-9.8 4.8-1.2 6.7-3.6 7.4-9.8Z"/>',
  },
  {
    id: 'c7-xin', genre: 'idéogramme', nom: 'Xīn 辛', dit: '« Épicé » en chinois et en japonais',
    // Le caractère 辛 (xīn, « karai » en japonais), qui veut dire épicé, relevé : réduit à cinq traits pour tenir à 12 px.
    // (Le soufre des alchimistes, triangle sur une croix, essayé d’abord : à 12 px, c’était le sapin de Résineux.)
    dessin: '<path d="M12 2.4v2.4"/><path d="M6.4 7.2h11.2"/><path d="M9.4 9.6l.8 2.4M14.6 9.6l-.8 2.4"/><path d="M4.6 14.6h14.8"/><path d="M7.4 18.4h9.2"/><path d="M12 14.6v7.2"/>',
  },
  {
    id: 'c8-meandre', genre: 'motif', nom: 'Méandre', dit: 'La grecque des routes d’Orient',
    // Une grecque en spirale carrée, trois retours ; pas de 5 unités (1,2 px de jour à 12 px).
    dessin: '<path d="M3.5 20.5h17V3.5h-13v12h8V8.5h-3.5"/>',
  },
];

// Trois houblons de la base. α : Beer Maverick (prototypes/houblons-v4/data/proto-data.json). Familles : tags
// Beer Maverick ; Saaz : profil du prototype (épicé « marqué » chez Hopsteiner). Niveau : ▮▮ nommé en premier
// ou marqué, ▮ cité. Rôle : Saaz et Hallertau déduits de l’α (≈), Cascade attesté (Crosby Hops). Moment et
// dose : une recette d’exemple, pas une donnée du houblon.
const HOUBLONS = [
  { nom: 'Saaz', alpha: '2–5', role: 'arôme', deduit: true, mo: '10′', dose: '40 g', stock: 'j-stock', fam: [['floral', 1], ['herbal', 1], ['SPICE', 2], ['green', 1], ['earthy', 1]] },
  { nom: 'Hallertau Mittelfrüh', alpha: '3–5,5', role: 'arôme', deduit: true, mo: '10′', dose: '30 g', stock: 'j-achat', fam: [['SPICE', 2], ['floral', 1], ['citrus', 1], ['green', 1]] },
  { nom: 'Cascade', alpha: '4,5–9', role: 'double', deduit: false, mo: '0′', dose: '50 g', stock: 'j-stock', fam: [['citrus', 2], ['floral', 1], ['SPICE', 1], ['resin', 1]] },
];

const symVar = (v) => `<symbol id="c4d-s-${v.id}" viewBox="0 0 24 24" fill="none" stroke="${TON}" stroke-width="2.571" stroke-linecap="round" stroke-linejoin="round">${v.dessin}</symbol>`;
const sp = (ref, w) => `<svg class="c4d-pi" width="${w}" height="${w}" data-famille="spice" role="img" aria-label="Épicé"><use href="#${ref}"/></svg>`;
const fam = (f, w = 16) => `<svg class="c4d-pi" width="${w}" height="${w}" data-famille="${f}" role="img" aria-label="${NOM_FAM[f]}"><use href="#p-${f}"/></svg>`;
const ic = (k, z = 14) => `<svg class="c4d-ic" width="${z}" height="${z}" aria-hidden="true"><use href="#c4d-${k}"/></svg>`;
const niveau = (n) => `<span class="c4d-nv" aria-label="${n === 2 ? 'marqué' : 'cité'}">${'<i></i>'.repeat(n)}</span>`;

// La carte Suggestions de la base, au trait : rôle en mot (D90), nom, α, moment et dose ; puis les familles
// en couleur avec leur niveau ; le stock en petite icône (D23 ter) ; « + » pour comparer.
const carte = (h, ref) => `<div class="c4d-carte" data-carte="${h.nom}">
  <div class="c4d-l1">
    <span class="c4d-us${h.deduit ? ' c4d-dd' : ''}">${h.role === 'double' ? ic('goutte') + ic('arome') : ic('arome')}</span>
    <b class="c4d-nom">${h.nom}</b><span class="c4d-al">α ${h.alpha} %</span>
    <span class="c4d-stk" aria-label="${h.stock === 'j-stock' ? 'en stock' : 'à acheter'}">${ic(h.stock === 'j-stock' ? 'stock' : 'achat', 13)}</span>
    <span class="c4d-plus" aria-hidden="true">+</span>
  </div>
  <div class="c4d-l2">
    <span class="c4d-ro">${h.role === 'double' ? 'double usage' : 'arôme' + (h.deduit ? ' ≈' : '')}</span>
    <span class="c4d-fa">${h.fam.map(([f, n]) => `<span class="c4d-f">${f === 'SPICE' ? sp(ref, 16) : fam(f)}${niveau(n)}</span>`).join('')}</span>
    <span class="c4d-mo">${ic('ebu', 13)}${h.mo} · ${h.dose}</span>
  </div>
</div>`;

// L’épreuve : le picto seul à 24, 16, 12 px ; puis à 12 px entre la feuille et les brins, et près d’Agrumes.
const epreuve = (ref) => `<div class="c4d-ep">
  <span class="c4d-t">${sp(ref, 24)}${sp(ref, 16)}${sp(ref, 12)}<span class="c4d-tx">24 · 16 · 12</span></span>
  <span class="c4d-vs">${fam('herbal', 12)}${sp(ref, 12)}${fam('green', 12)}${fam('citrus', 12)}${fam('floral', 12)}</span>
</div>`;

const blocs = VARIANTES.map((v, i) => `<section class="c4d-v" data-variante="${v.id}" data-genre="${v.genre}">
  <div class="c4d-h"><span class="c4d-id">${v.id.split('-')[0]}</span><h2>${v.nom}</h2><span class="c4d-ge">${v.genre}</span></div>
  <p class="c4d-dit">${v.dit}</p>
  ${epreuve('c4d-s-' + v.id)}
  <div class="c4d-cartes">${HOUBLONS.map((h) => carte(h, 'c4d-s-' + v.id)).join('')}</div>
</section>`).join('\n');

const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Épicé, série C : le signe (v0)</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; padding: 10px; font: 14px/1.3 "Source Sans 3", system-ui, sans-serif; color: #1c1f26; background: #f4f2ef; max-width: 390px; }
  h1 { font-size: 16px; margin: 2px 2px 2px; }
  .c4d-intro { font-size: 13px; color: #574a42; margin: 0 2px 8px; }
  .c4d-v, .c4d-av { background: #fff; border: 1px solid #e4e0da; border-radius: 16px; padding: 10px 10px 4px; margin: 0 0 10px; }
  .c4d-av { border-style: dashed; padding-bottom: 6px; }
  .c4d-h { display: flex; align-items: baseline; gap: 8px; }
  .c4d-id { font: 600 12px "IBM Plex Mono", ui-monospace, monospace; color: #fff; background: ${TON}; border-radius: 6px; padding: 1px 5px; }
  .c4d-h h2 { font-size: 17px; margin: 0; }
  .c4d-ge { font-size: 12px; color: #6b6259; margin-left: auto; border: 1px solid #d8cec5; border-radius: 999px; padding: 0 7px; }
  .c4d-dit { font-size: 13px; color: #574a42; margin: 3px 0 6px; }
  .c4d-ep { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 2px 0 8px; border-bottom: 1px solid #efebe6; }
  .c4d-t { display: flex; align-items: flex-end; gap: 12px; }
  .c4d-tx { font: 12px "IBM Plex Mono", ui-monospace, monospace; color: #8a8178; }
  .c4d-vs { display: flex; align-items: center; gap: 7px; padding: 5px 8px; border: 1px solid #efebe6; border-radius: 10px; }
  .c4d-carte { padding: 7px 0 6px; border-bottom: 1px solid #efebe6; }
  .c4d-carte:last-child { border-bottom: 0; }
  .c4d-l1 { display: flex; align-items: center; gap: 6px; }
  .c4d-us { display: inline-flex; gap: 1px; color: #1c1f26; }
  .c4d-us.c4d-dd { color: #9a8a7e; }
  .c4d-nom { font-size: 15px; text-decoration: underline dotted #b9b0a6; text-underline-offset: 3px; }
  .c4d-al { font: 600 13px "IBM Plex Mono", ui-monospace, monospace; }
  .c4d-stk { display: inline-flex; color: #8a8178; }
  .c4d-plus { margin-left: auto; width: 24px; height: 24px; border: 1.5px solid #1c1f26; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 17px; line-height: 1; }
  .c4d-l2 { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
  .c4d-ro { font-size: 12px; color: #4b4239; border: 1px solid #d8cec5; border-radius: 999px; padding: 0 6px; white-space: nowrap; }
  .c4d-fa { display: flex; align-items: flex-start; gap: 9px; }
  .c4d-f { display: inline-flex; flex-direction: column; align-items: center; gap: 2px; }
  .c4d-nv { display: inline-flex; gap: 2px; height: 5px; }
  .c4d-nv i { display: block; width: 4px; height: 5px; background: #1c1f26; border-radius: 1px; }
  .c4d-mo { margin-left: auto; display: inline-flex; align-items: center; gap: 2px; font: 12px "IBM Plex Mono", ui-monospace, monospace; color: #3d342e; white-space: nowrap; }
  .c4d-lab { font-size: 12px; font-weight: 600; color: #6b6259; margin: 0 0 2px; }
  .c4d-src { font-size: 12px; color: #6b6259; margin: 2px 2px 8px; }
  svg { flex: none; display: block; }
</style></head>
<body>
<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
${FAMILLES.map((f) => sym('p-' + f)).join('\n')}
${ACTUEL}
${ICONE('j-goutte', 'c4d-goutte')}${ICONE('j-arome', 'c4d-arome')}${ICONE('j-stock', 'c4d-stock')}${ICONE('j-achat', 'c4d-achat')}${ICONE('j-ebu', 'c4d-ebu')}
${VARIANTES.map(symVar).join('\n')}
</svg>
<h1>Épicé : le signe</h1>
<p class="c4d-intro">Un signe qui devient « épicé » par convention, comme la roue est devenue Agrumes.</p>
<section class="c4d-av" data-role="avant">
  <p class="c4d-lab">Avant : le picto actuel, refusé</p>
  ${carte(HOUBLONS[0], 'c4d-actuel')}
</section>
${blocs}
<p class="c4d-src">α et familles : Beer Maverick ; Saaz : Hopsteiner. ▮▮ marqué, ▮ cité. ≈ rôle déduit de l’α. Moment et dose : recette d’exemple.</p>
</body></html>
`;
fs.writeFileSync(path.join(ICI, 'etat.html'), html);
console.log('PLANCHE écrite : ' + VARIANTES.length + ' propositions, genres : ' + [...new Set(VARIANTES.map((v) => v.genre))].join(', '));
