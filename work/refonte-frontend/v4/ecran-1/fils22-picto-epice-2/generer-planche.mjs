// Planche « épicé », deuxième tour (mission 2026-10-22-reprise-lot21, voie r4c-picto-epice-2).
// Usage : node generer-planche.mjs   → planche/etat.html (non versionnée ; ce générateur l'est).
// Après le troisième refus (« Aucun me convient... », 22.10) puis le rejet du critique Fable (même jour) :
// trois dessins de piment et le mot « épicé » en repli, chacun à côté d'Herbacé, Végétal et Résineux, à 16
// et 12 px, et sur trois vraies lignes de houblon (Saaz, Columbus, Cascade). Les pictos des autres familles
// viennent tels quels de fils17-standard/v3/planche.html (symboles p-…). Dessins : viewBox 24, trait
// #7a4e3a de 2.571, extrémités rondes, sans remplissage ni halo (D88). Rien sous 12 px (D60).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const V3 = fs.readFileSync(path.join(ICI, '../fils17-standard/v3/planche.html'), 'utf8');
const TON = '#7a4e3a';

const FAMILLES = ['citrus', 'tropical', 'melon', 'stoneFruit', 'pomeFruit', 'berries', 'floral', 'herbal', 'resin', 'green', 'earthy'];
const NOM_FAM = { citrus: 'Agrumes', floral: 'Floral', herbal: 'Herbacé', resin: 'Résineux', earthy: 'Terreux', green: 'Végétal' };
const symFamille = (f) => {
  const m = new RegExp(`<symbol id="p-${f}"[^]*?</symbol>`).exec(V3);
  if (!m) throw new Error('symbole p-' + f + ' introuvable dans la planche v3');
  return m[0];
};
// Le picto actuel de l'app (5 cercles), rejeté au lot 21 : seulement dans la ligne « avant ».
const ACTUEL = symFamille('spice').replace('id="p-spice"', 'id="s-actuel"');

// Relance 1 (critique Fable du 22.10) : planche resserrée. Le piment, seule piste parlante, en trois
// dessins (calice en dôme et queue en T, crochet de la pointe marqué ; un à chair plus large ; un couché
// comme l'émoji), et le mot « épicé » en repli. Volutes, zigzag, couronne et É retirés.
const VARIANTES = [
  { id: 'p1-crochet', genre: 'universel', nom: 'Piment', sous: 'calice et crochet', dessin: '<path d="M13.6 10C13.4 14.6 10.4 17.6 5.6 18 4.6 18.1 3.8 17.8 3.2 17 3.8 19.6 6.8 21.2 10.4 20.4 15.2 19.2 18.8 14.8 18.6 10"/><path d="M12.2 10.4c.2-2.2 2-3.4 3.9-3.4s3.7 1.2 3.9 3.4"/><path d="M16.1 7V4.8c0-1 .6-1.8 1.8-2.2"/>' },
  { id: 'p2-chair', genre: 'universel', nom: 'Piment charnu', sous: 'chair plus large', dessin: '<path d="M12.6 10.2C12.4 14.8 9.6 17.8 5.2 18.2 4.2 18.3 3.4 18 2.8 17.2 3.4 20 6.6 21.6 10.4 20.8 15.8 19.6 20 15 19.8 10.2"/><path d="M11.2 10.6c.2-2.4 2.4-3.8 5-3.8s4.8 1.4 5 3.8"/><path d="M16.2 6.8V4.6c0-1 .6-1.8 1.8-2.2"/>' },
  { id: 'p3-couche', genre: 'universel', nom: 'Piment couché', sous: 'la pose de l’émoji', dessin: '<g transform="rotate(32 12 12)"><path d="M13.6 10C13.4 14.6 10.4 17.6 5.6 18 4.6 18.1 3.8 17.8 3.2 17 3.8 19.6 6.8 21.2 10.4 20.4 15.2 19.2 18.8 14.8 18.6 10"/><path d="M12.2 10.4c.2-2.2 2-3.4 3.9-3.4s3.7 1.2 3.9 3.4"/><path d="M16.1 7V4.8c0-1 .6-1.8 1.8-2.2"/></g>' },
  { id: 'm1-mot', genre: 'mot', nom: 'Le mot seul', sous: 'le repli, sans picto', mot: true },
];

// Trois houblons réels. α : Beer Maverick (prototypes/houblons-v4/data/proto-data.json). Usage : Crosby Hops
// (Columbus, Cascade) ; Saaz n'a pas d'usage attesté, son rôle vient de la règle rôle-α du prototype.
// Familles : descripteurs Beer Maverick ; pour Saaz, profil du prototype (épicé « marqué » chez Hopsteiner,
// herbacé et végétal cités), pack-mini-protos.json.
const HOUBLONS = [
  { nom: 'Saaz', alpha: 'α 2–5 %', role: 'arôme ≈', familles: ['floral', 'herbal', 'SPICE', 'green', 'earthy'] },
  { nom: 'Columbus', alpha: 'α 14–18 %', role: 'amertume · à cru', familles: ['citrus', 'floral', 'SPICE', 'earthy'] },
  { nom: 'Cascade', alpha: 'α 4,5–9 %', role: 'tardif · à cru', familles: ['citrus', 'floral', 'resin', 'SPICE'] },
];

const symboleVar = (v) => `<symbol id="s-${v.id}" viewBox="0 0 24 24" fill="none" stroke="${TON}" stroke-width="2.571" stroke-linecap="round" stroke-linejoin="round">${v.dessin}</symbol>`;
const sp = (id, w) => `<svg width="${w}" height="${w}" data-famille="spice" role="img" aria-label="Épicé"><use href="#${id}"/></svg>`;
const autre = (f, w = 16) => `<svg width="${w}" height="${w}" data-famille="${f}" role="img" aria-label="${NOM_FAM[f] || f}"><use href="#p-${f}"/></svg>`;
const mot = (taille = 12) => `<span class="mot" style="font-size:${taille}px">épicé</span>`;
const epice = (v, w) => (v.mot ? mot(12) : sp('s-' + v.id, w));
// L'épreuve du critique : à côté d'Herbacé (feuille), de Végétal (brins) et de Résineux, à 16 puis 12 px.
const epreuve = (m16, m12) => `<div class="ep"><span class="tg">16 px</span>${autre('herbal')}${autre('green')}${m16}${autre('resin')}<span class="tg">12 px</span>${autre('herbal', 12)}${autre('green', 12)}${m12}${autre('resin', 12)}</div>`;

// Une ligne de houblon comme dans la base : nom, α, usage ; puis ses familles au trait à 16 px.
const carte = (marque) => `<div class="hb">${HOUBLONS.map((h) => `<div class="hl">
    <div class="l1"><b>${h.nom}</b><span class="al">${h.alpha}</span><span class="ro">${h.role}</span></div>
    <div class="pi">${h.familles.map((f) => (f === 'SPICE' ? marque : autre(f))).join('')}</div>
  </div>`).join('')}</div>`;

// La barre d'arôme de Ma bière (libellé à 12 px), où le picto se lit aussi à côté du mot.
const barre = (marque, v) => `<div class="ba"><span class="bl">${marque}${v && v.mot ? '' : '<span>Épicé</span>'}</span><span class="tr"><i style="width:34%"></i></span></div>`;

const blocs = VARIANTES.map((v) => `<section class="v" data-variante="${v.id}" data-genre="${v.genre}"${v.mot ? ' data-nature="mot"' : ''}>
  <div class="t"><h2>${v.nom}</h2><span class="ge">${v.sous}</span></div>
  <div class="tailles">${v.mot ? `${mot(12)}${mot(13)}${mot(15)}` : `${sp('s-' + v.id, 12)}${sp('s-' + v.id, 16)}${sp('s-' + v.id, 24)}`}<span class="tx">${v.mot ? '12 · 13 · 15 px' : '12 · 16 · 24 px'}</span></div>
  ${epreuve(epice(v, 16), epice(v, 12))}
  ${carte(epice(v, 16))}
  ${barre(v.mot ? mot(12) : sp('s-' + v.id, 12), v)}
</section>`).join('\n');

const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Épicé : quel picto ? (deuxième tour)</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; padding: 12px; font: 14px/1.3 system-ui, sans-serif; color: #1c1f26; background: #f6f6f4; max-width: 390px; }
  h1 { font-size: 16px; margin: 0 0 8px; }
  h2 { font-size: 15px; font-weight: 700; margin: 0; }
  .v, .av { background: #fff; border: 1px solid #e3e5ea; border-radius: 12px; padding: 10px 12px; margin: 0 0 8px; }
  .av { border-style: dashed; }
  .t { display: flex; align-items: baseline; gap: 8px; margin-bottom: 6px; }
  .ge { font-size: 12px; color: #6b7280; }
  .tailles { display: flex; align-items: flex-end; gap: 14px; margin-bottom: 8px; }
  .tx { font-size: 12px; color: #9aa0aa; margin-left: auto; }
  .hb { border-top: 1px solid #eef0f3; }
  .hl { padding: 6px 0; border-bottom: 1px solid #eef0f3; }
  .l1 { display: flex; align-items: baseline; gap: 8px; }
  .l1 b { font-size: 15px; }
  .al { font: 600 13px ui-monospace, monospace; }
  .ro { font-size: 12px; color: #4b5563; border: 1px solid #c9ccd3; border-radius: 999px; padding: 0 6px; }
  .pi { display: flex; align-items: center; gap: 10px; margin-top: 4px; height: 18px; }
  .mot { color: ${TON}; font-weight: 650; letter-spacing: .01em; line-height: 1; }
  .ba { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
  .bl { display: flex; align-items: center; gap: 5px; width: 76px; font-size: 13px; color: ${TON}; }
  .tr { flex: 1; height: 10px; border-radius: 5px; background: #f5eeea; overflow: hidden; }
  .tr i { display: block; height: 100%; background: ${TON}; border-radius: 5px; }
  .ep { display: flex; align-items: center; gap: 9px; margin: 0 0 6px; }
  .tg { font-size: 12px; color: #9aa0aa; }
  .tg + svg { margin-left: -3px; }
  .ep .tg:nth-of-type(2) { margin-left: 10px; }
  .lab { font-size: 12px; font-weight: 700; color: #6b7280; margin: 0 0 4px; }
  .src { font-size: 12px; color: #6b7280; margin: 4px 0 0; }
  svg { flex: none; }
</style></head>
<body>
<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
${FAMILLES.map(symFamille).join('\n')}
${ACTUEL}
${VARIANTES.filter((v) => !v.mot).map(symboleVar).join('\n')}
</svg>
<h1>Épicé : quel picto ?</h1>
<section class="av" data-role="avant">
  <p class="lab">Avant : le picto actuel, rejeté</p>
  ${epreuve(sp('s-actuel', 16), sp('s-actuel', 12))}
  ${carte(sp('s-actuel', 16))}
  ${barre(sp('s-actuel', 12))}
</section>
${blocs}
<p class="src">α : Beer Maverick. Usage : Crosby Hops ; Saaz : rôle déduit de l’α (≈). Familles : descripteurs Beer Maverick ; Saaz : Hopsteiner. Barre d’arôme : maquette, valeur non calculée.</p>
</body></html>
`;
fs.mkdirSync(path.join(ICI, 'planche'), { recursive: true });
fs.writeFileSync(path.join(ICI, 'planche/etat.html'), html);
console.log('PLANCHE écrite : ' + VARIANTES.length + ' variantes, genres : ' + [...new Set(VARIANTES.map((v) => v.genre))].join(', '));
