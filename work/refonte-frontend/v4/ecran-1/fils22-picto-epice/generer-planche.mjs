// Planche des pictos « épicé » (mission 2026-10-22-reprise-lot21, voie r4-picto-epice).
// Usage : node generer-planche.mjs   → planche/etat.html (non versionné ; ce générateur l'est).
// Les pictos des autres familles viennent tels quels de fils17-standard/v3/planche.html (symboles p-…).
// Chaque variante : viewBox 24, trait #7a4e3a de 2.571, extrémités rondes, aucun remplissage.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const V3 = fs.readFileSync(path.join(ICI, '../fils17-standard/v3/planche.html'), 'utf8');
const TON = '#7a4e3a';
const r2 = (x) => Math.round(x * 100) / 100;

// Les symboles réels des autres familles (planche v3).
const FAMILLES = ['citrus', 'tropical', 'melon', 'stoneFruit', 'pomeFruit', 'berries', 'floral', 'herbal', 'resin', 'green', 'earthy'];
const NOM_FAM = { herbal: 'Herbacé', green: 'Végétal', earthy: 'Terreux', resin: 'Résineux', citrus: 'Agrumes', floral: 'Floral' };
const symFamille = (f) => {
  const m = new RegExp(`<symbol id="p-${f}"[\\s\\S]*?</symbol>`).exec(V3);
  if (!m) throw new Error('symbole p-' + f + ' introuvable dans la planche v3');
  return m[0];
};
// Le picto actuel (rejeté) : tel quel dans la planche v3.
const ACTUEL = symFamille('spice').replace('id="p-spice"', 'id="s-actuel"');

// Badiane : étoile à 8 branches, contour seul + un point au centre.
const badiane = () => {
  const pts = [];
  for (let k = 0; k < 16; k++) {
    const r = k % 2 === 0 ? 10.6 : 5.6;
    const a = (k * Math.PI) / 8 - Math.PI / 2;
    pts.push(`${r2(12 + r * Math.cos(a))} ${r2(12 + r * Math.sin(a))}`);
  }
  return `<path d="M${pts.join('L')}Z"/><path d="M12 12h.01"/>`;
};

// Les variantes. Choix des idées : les deux lectures de « plutôt vanille, canelle ? »
// (cannelle, vanille = « dessine plutôt ça ») et cinq autres idées de ce que sent un houblon épicé.
const VARIANTES = [
  { id: 'cannelle', nom: 'Bâton de cannelle', dessin:
    '<g transform="rotate(42 12 12)"><ellipse cx="12" cy="6.2" rx="4.6" ry="3.2"/><path d="M7.4 6.2v11.6a4.6 3.2 0 0 0 9.2 0V6.2"/><path d="M9.8 6.6c1.4 1 2.6 1 4.4 0"/></g>' },
  { id: 'vanille', nom: 'Gousse de vanille', dessin:
    '<path d="M5 19.6C3.4 17.4 4 12.6 8.6 8.4 12.6 4.8 17 3.8 20 4.4c.9 2.6-.6 7-5 10.8-3.6 3.1-8 6.6-10 4.4Z"/><path d="M10.4 12.6h.01M14 9.2h.01"/><path d="M19.6 4.8l1.9-2.1"/>' },
  { id: 'badiane', nom: 'Badiane', dessin: badiane() },
  { id: 'girofle', nom: 'Clou de girofle', dessin:
    '<g transform="rotate(32 12 12)"><circle cx="12" cy="6.4" r="3"/><path d="M7.6 6.6 5.8 4.6M16.4 6.6l1.8-2"/><path d="M9.9 9.8 12 22.4l2.1-12.6"/></g>' },
  { id: 'mortier', nom: 'Mortier et pilon', dessin:
    '<path d="M3.5 11.5h17l-1.5 5.3a4.6 4.6 0 0 1-4.4 3.2H9.4A4.6 4.6 0 0 1 5 16.8Z"/><path d="M12.5 10.5 19.5 3.5"/><path d="M18 2.8l3.2 3.2"/>' },
  { id: 'coriandre', nom: 'Graine de coriandre', dessin:
    '<circle cx="12" cy="12" r="9"/><path d="M12 3c-4.6 4.4-4.6 13.6 0 18"/><path d="M12 3c4.6 4.4 4.6 13.6 0 18"/>' },
  { id: 'saupoudreur', nom: 'Saupoudreur à épices', dessin:
    '<path d="M7.4 10.5h9.2l1 9.6a1.8 1.8 0 0 1-1.8 2H8.2a1.8 1.8 0 0 1-1.8-2Z"/><path d="M7.4 10.5a4.6 5 0 0 1 9.2 0"/><path d="M12 7.2h.01"/>' },
];

const symboleVar = (v) => `<symbol id="s-${v.id}" viewBox="0 0 24 24" fill="none" stroke="${TON}" stroke-width="2.571" stroke-linecap="round" stroke-linejoin="round">${v.dessin}</symbol>`;
const sp = (id, w) => `<svg width="${w}" height="${w}" data-famille="spice" role="img" aria-label="Épicé"><use href="#${id}"/></svg>`;
const autre = (f, w = 16) => `<svg width="${w}" height="${w}" data-famille="${f}" aria-hidden="true"><use href="#p-${f}"/></svg>`;

// En contexte : une ligne de houblon (nom en trait gris, comme un gabarit), le picto épicé à 16 px
// parmi des pictos d'autres familles, dans l'ordre des familles de l'app.
const CONTEXTE = ['citrus', 'floral', 'SPICE', 'herbal', 'resin'];
const ligne = (id) => `<div class="ctx"><span class="nom-gab"></span>${CONTEXTE.map((f) => (f === 'SPICE' ? sp(id, 16) : autre(f))).join('')}</div>`;

const blocs = VARIANTES.map((v) => `<section class="v" data-variante="${v.id}">
  <h2>${v.nom}</h2>
  <div class="tailles">${sp('s-' + v.id, 12)}${sp('s-' + v.id, 16)}${sp('s-' + v.id, 24)}</div>
  ${ligne('s-' + v.id)}
</section>`).join('\n');

const voisins = ['herbal', 'green', 'earthy', 'resin'].map((f) => `<span class="vo">${autre(f, 24)}<small>${NOM_FAM[f]}</small></span>`).join('');

const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pictos « épicé » — planche</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; padding: 12px; font: 14px/1.3 system-ui, sans-serif; color: #1c1f26; background: #fff; max-width: 390px; }
  h1 { font-size: 16px; margin: 0 0 10px; }
  h2 { font-size: 14px; font-weight: 700; margin: 0 0 8px; }
  .v { border: 1px solid #e3e5ea; border-radius: 10px; padding: 10px 12px; margin: 0 0 8px; }
  .tailles { display: flex; align-items: flex-end; gap: 14px; margin-bottom: 8px; }
  .ctx { display: flex; align-items: center; gap: 8px; height: 24px; }
  .nom-gab { width: 56px; height: 8px; border-radius: 4px; background: #e3e5ea; margin-right: 6px; }
  .ref { display: flex; gap: 16px; align-items: flex-end; margin: 0 0 12px; padding-bottom: 10px; border-bottom: 1px solid #e3e5ea; }
  .ref small, .vo small { display: block; font-size: 11px; color: #6b7280; margin-top: 3px; }
  .vo { display: inline-block; text-align: center; }
  .vo svg { display: block; margin: 0 auto; }
  svg { flex: none; }
</style></head>
<body>
<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
${FAMILLES.map(symFamille).join('\n')}
${ACTUEL}
${VARIANTES.map(symboleVar).join('\n')}
</svg>
<h1>Épicé : quel picto ?</h1>
<div class="ref">
  <span class="vo">${sp('s-actuel', 24)}<small>actuel, rejeté</small></span>
  ${voisins}
</div>
${blocs}
</body></html>
`;
fs.mkdirSync(path.join(ICI, 'planche'), { recursive: true });
fs.writeFileSync(path.join(ICI, 'planche/etat.html'), html);
console.log('PLANCHE écrite : ' + VARIANTES.length + ' variantes');
