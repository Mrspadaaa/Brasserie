// Planche « épicé », troisième tour, série D « créatif à fond » (mission 2026-10-22-reprise-lot21,
// voie r4d-d-libre, concepteur Opus). Usage : node generer.mjs → etat.html (ici), puis node capturer.mjs.
// Quatre refus (lot 15, lot 21, r4, r4c), puis la parole du 22.10 nuit : des épices réelles, reconnaissables,
// dessinées autrement qu'en r4 (cadrage, coupe, détail, mélange).
// Grammaire : viewBox 24, trait #7a4e3a de 2.571, bouts ronds, sans remplissage ni halo (D88) ; chaque
// proposition à 12, 16 et 24 px, à côté de la feuille (Herbacé) et des brins (Végétal), puis sur trois
// vraies cartes de la base v4.9 (Suggestions, classes q-* reprises à l'identique sous le préfixe d-, L26).
// Rien sous 12 px (D60). Les pictos des autres familles viennent tels quels de fils17-standard/v3.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const V3 = fs.readFileSync(path.join(ICI, '../../../fils17-standard/v3/planche.html'), 'utf8');
const TON = '#7a4e3a';
const FAMILLES = ['citrus', 'floral', 'herbal', 'resin', 'green', 'earthy'];
const NOM_FAM = { citrus: 'Agrumes', floral: 'Floral', herbal: 'Herbacé', resin: 'Boisé et résineux', earthy: 'Terreux', green: 'Végétal', spice: 'Épicé' };
const symFamille = (f) => {
  const m = new RegExp(`<symbol id="p-${f}"[^]*?</symbol>`).exec(V3);
  if (!m) throw new Error('symbole p-' + f + ' introuvable dans la planche v3');
  return m[0];
};

// Parole du brasseur (22.10, nuit) : « Je veux un forme qui représente vraiment ce que c'est, genre canellle
// vanille, ou clou de girofle ect... Ce que ça représente vraiment épicier sur un houblon... ». La série garde
// sa liberté de cadrage (entier, coupe, composé, gourmandise) mais chaque proposition est une épice réelle,
// déclarée par data-epice. Essais écartés après la loupe (captures/travail/essais*.png) : cannelle en bâton
// diagonal (« trombone »), deux bâtons croisés (« X »), coupe en double spire (« bretzel »), fagot de trois
// bâtons (« grille ») ; gingembre (« nuage ») ; cardamome et anis vert (« grain de café ») ; coriandre
// (« sucette ») ; muscade et râpe (« téléphone ») ; et, avant la parole du brasseur, fût, tajine, vin chaud,
// fleur de lys, sachet d'infusion, théière, gland, bouquet pendu, fagot, brindille, nouet rond, pincée.
const VARIANTES = [
  { id: 'd1-cannelle', epice: 'cannelle', genre: 'entier', nom: 'Cannelle, le rouleau', sous: 'l’écorce roulée, vue de côté avec sa spire : la douceur boisée des nobles',
    dessin: '<path d="M7 7h10"/><path d="M7 17h10"/><path d="M7 7a5 5 0 0 0 0 10"/><path d="M17 7c2.8 0 4 2.3 4 5s-1.2 5-4 5c-1.5 0-2.3-1-2.3-2.2s.8-1.8 1.6-1.8"/>' },
  { id: 'd2-girofle', epice: 'clou de girofle', genre: 'entier', nom: 'Clou de girofle', sous: 'le clou debout, bouton et calice : la note la plus « épicée » des nobles',
    dessin: '<path d="M12 2.5c1.6 0 2.5 1.1 2.5 2.3S13.6 7 12 7s-2.5-1-2.5-2.2S10.4 2.5 12 2.5Z"/><path d="M9.5 7 7 9M14.5 7l2.5 2"/><path d="M10.8 7.5 12 21.5l1.2-14"/>' },
  { id: 'd3-badiane', epice: 'badiane', genre: 'entier', nom: 'Badiane', sous: 'l’anis étoilé à huit lobes : l’anis et la réglisse qu’on sent dans Saaz',
    dessin: '<path d="M12 12c-1.2-2.5-1.2-5.5 0-9.5 1.2 4 1.2 7 0 9.5Z"/><path d="M12 12c-1.2-2.5-1.2-5.5 0-9.5 1.2 4 1.2 7 0 9.5Z" transform="rotate(45 12 12)"/><path d="M12 12c-1.2-2.5-1.2-5.5 0-9.5 1.2 4 1.2 7 0 9.5Z" transform="rotate(90 12 12)"/><path d="M12 12c-1.2-2.5-1.2-5.5 0-9.5 1.2 4 1.2 7 0 9.5Z" transform="rotate(135 12 12)"/><path d="M12 12c-1.2-2.5-1.2-5.5 0-9.5 1.2 4 1.2 7 0 9.5Z" transform="rotate(180 12 12)"/><path d="M12 12c-1.2-2.5-1.2-5.5 0-9.5 1.2 4 1.2 7 0 9.5Z" transform="rotate(225 12 12)"/><path d="M12 12c-1.2-2.5-1.2-5.5 0-9.5 1.2 4 1.2 7 0 9.5Z" transform="rotate(270 12 12)"/><path d="M12 12c-1.2-2.5-1.2-5.5 0-9.5 1.2 4 1.2 7 0 9.5Z" transform="rotate(315 12 12)"/>' },
  { id: 'd4-vanille', epice: 'vanille', genre: 'entier', nom: 'Gousse de vanille', sous: 'la gousse fendue, ses graines, sa pointe recourbée',
    dessin: '<path d="M4.5 19.5C7 13 11.5 8 18.5 5.5c1.3-.5 2.5.5 2 1.8-.6 1.3-2.5 1.5-3.5.7"/><path d="M7.5 21.5C10 15 14 10 20 7"/><path d="M4.5 19.5l3 2"/><path d="M9.5 15.5h.01M12.5 12h.01M15.5 9.5h.01"/>' },
  { id: 'd5-muscade', epice: 'muscade', genre: 'coupe', nom: 'Muscade coupée', sous: 'la noix ouverte en deux, ses veines : chaleur douce, sans piquant',
    dessin: '<path d="M12 3c4.4 0 7.5 4 7.5 9s-3.1 9-7.5 9-7.5-4-7.5-9S7.6 3 12 3Z"/><path d="M7.5 9c2 .5 2.5 3 1 4.5s-.5 3.5 1.5 4"/><path d="M12.5 6c-1 2 .5 3.5 2.5 4s2 3 .5 4.5"/>' },
  { id: 'd6-reglisse', epice: 'réglisse', genre: 'gourmandise', nom: 'Roue de réglisse', sous: 'la réglisse en roue : l’anis-réglisse des houblons nobles',
    dessin: '<path d="M11.5 12.5c0-.8.7-1.3 1.4-1.1 1.3.4 1.6 2 1 3.3-.9 2.1-3.6 2.7-5.6 1.4-2.8-1.8-3.2-5.8-.8-8.3 3.1-3.2 8.5-2.7 11 .9 2.9 4.3 1.6 10.1-3 12.5"/><path d="M15.5 21.5h6"/><path d="M13 14h.01"/>' },
  { id: 'd7-melange', epice: 'mélange', genre: 'composé', nom: 'Épices de Noël', sous: 'cannelle, badiane et clou ensemble : le mélange qu’on sent dans une bière d’hiver',
    dessin: '<path d="M4.5 16h12"/><path d="M4.5 21h12"/><path d="M4.5 16a2.5 2.5 0 0 0 0 5"/><path d="M16.5 16c1.6 0 2.5 1.1 2.5 2.5S18.1 21 16.5 21c-.9 0-1.4-.6-1.4-1.2s.5-1 1-1"/><path d="M8 2.5 9 5.5l3 .3-2.3 2 .7 3L8 9.2 5.6 10.8l.7-3-2.3-2 3-.3Z"/><path d="M17.5 3c1.1 0 1.8.8 1.8 1.7s-.7 1.6-1.8 1.6-1.8-.7-1.8-1.6.7-1.7 1.8-1.7Z"/><path d="M16.8 6.3 17.5 12l.7-5.7"/>' },
  { id: 'd8-pain-epices', epice: 'mélange', genre: 'gourmandise', nom: 'Pain d’épices', sous: 'le bonhomme pétri de cannelle, de clou et d’anis : les épices devenues gourmandise',
    dessin: '<circle cx="12" cy="4.8" r="2.8"/><path d="M10 8.3c-3.2 0-6.5 1.3-6.5 3.5 0 1.5 1.2 2.6 2.8 2.6h2.4l-1.6 4.5c-.4 1.2.4 2.4 1.7 2.4h1.4L12 18.5l1.8 2.8h1.4c1.3 0 2.1-1.2 1.7-2.4l-1.6-4.5h2.4c1.6 0 2.8-1.1 2.8-2.6 0-2.2-3.3-3.5-6.5-3.5Z"/>' },
];

// Trois houblons réels (α : Beer Maverick, prototypes/houblons-v4/data/proto-data.json). Saaz : l'épicé
// est sa signature (Hopsteiner : « marqué ») ; Hallertau Mittelfrüh : épicé, floral, agrumes, herbe coupée ;
// Cascade : pamplemousse, floral, épicé, agrumes, pin. Les niveaux (mq marqué, ci cité, vide) suivent les tags.
// Colonnes de la carte comme dans la base : objectifs floral et résineux (cerclés), puis les extras.
const EXTRAS = ['herbal', 'earthy', 'citrus', 'spice', 'green'];
const HOUBLONS = [
  { nom: 'Saaz', alpha: '2–5 %', usage: 'arome', deduit: true, stock: 'achat', objs: { floral: ['mq', 1], resin: ['ne'] }, ex: { herbal: ['ci', 1], earthy: ['ci', 1], spice: ['mq', 2], green: ['ci', 1] } },
  { nom: 'Hallertau Mittelfrüh', alpha: '3–5,5 %', usage: 'arome', deduit: true, stock: 'stock', objs: { floral: ['mq', 1], resin: ['ne'] }, ex: { citrus: ['ci', 1], spice: ['mq', 2], green: ['ci', 1] } },
  { nom: 'Cascade', alpha: '4,5–9 %', usage: 'double', deduit: false, stock: 'stock', objs: { floral: ['ci', 1], resin: ['ci', 1] }, ex: { citrus: ['mq', 2], spice: ['ci', 1] } },
];

const symboleVar = (v) => `<symbol id="s-${v.id}" viewBox="0 0 24 24" fill="none" stroke="${TON}" stroke-width="2.571" stroke-linecap="round" stroke-linejoin="round">${v.dessin}</symbol>`;
const sp = (v, w, cls = '') => `<svg class="d-pi${cls}" width="${w}" height="${w}" data-famille="spice" role="img" aria-label="Épicé"><use href="#s-${v.id}"/></svg>`;
const autre = (f, w = 16, cls = '') => `<svg class="d-pi${cls}" width="${w}" height="${w}" data-famille="${f}" role="img" aria-label="${NOM_FAM[f]}"><use href="#p-${f}"/></svg>`;

// Icônes d'action de la base (usage, stock, goût, ajouter), recopiées de l'écran Suggestions v4.9.
const IC = {
  arome: '<svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 9 C4 4, 10 4, 12 9" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="7" cy="10.5" r="2" fill="currentColor"/></svg>',
  goutte: '<svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true"><path d="M7 1.5C4.5 5 3 7.2 3 9.2a4 4 0 0 0 8 0C11 7.2 9.5 5 7 1.5Z" fill="currentColor"/></svg>',
  achat: '<svg width="12" height="11" viewBox="0 0 13 12" aria-hidden="true"><path d="M1 1.5 H3 L4.4 8 H10.5 L12 3.5 H3.6" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="5" cy="10.3" r="1.2" fill="currentColor"/><circle cx="9.8" cy="10.3" r="1.2" fill="currentColor"/></svg>',
  stock: '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><rect x="1" y="1" width="10" height="10" rx="2" fill="currentColor"/><path d="M3.5 6.2 5.3 8 8.6 4.4" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  coeur: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>',
  plus: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14M12 5v14"/></svg>',
};
const usage = (h) => `<span class="d-us${h.deduit ? ' d-deduit' : ''}" data-role="usage" aria-label="${h.nom} : ${h.usage === 'double' ? 'amérisant et aromatique' : 'aromatique'}${h.deduit ? ', déduit de l’α' : ', attesté'}">${h.usage === 'double' ? IC.goutte + IC.arome : IC.arome}</span>`;
const jauge = (n) => `<span class="d-jg">${n ? Array.from({ length: n }, () => '<i></i>').join('') : '<i class="d-pt"></i>'}</span>`;
const caseF = (f, niv, pictoHtml, obj) => {
  if (!niv) return '<span class="d-cf d-vide" aria-hidden="true"></span>';
  const [n, k] = niv;
  if (n === 'ne') return `<span class="d-cf d-o d-ne" data-famille="${f}" aria-label="${NOM_FAM[f]} : effet non établi"><span class="d-ring">${pictoHtml}</span><span class="d-jg d-jg-ne"><i></i></span></span>`;
  return `<span class="d-cf${obj ? ' d-o' : ''} d-${n}" data-famille="${f}" aria-label="${NOM_FAM[f]} · ${n === 'mq' ? 'marqué dans ses fiches' : 'cité par une fiche'}">${obj ? `<span class="d-ring">${pictoHtml}</span>` : pictoHtml}${jauge(k)}</span>`;
};
// Une vraie carte de la base (ligne q-vr de Suggestions v4.9) : usage, nom, stock, goût, ajouter ; puis
// les objectifs cerclés, le séparateur pointillé et les extras, chacun avec sa jauge.
const carte = (h, v) => `<div class="d-vr" data-carte="${h.nom}" role="group" aria-label="${h.nom}">
  <div class="d-l1">${usage(h)}<b class="d-nom"><span data-houblon="${h.nom}">${h.nom}</span></b><span class="d-al">α ${h.alpha}</span><span class="d-gr"><span class="d-stk" role="img" aria-label="${h.stock === 'achat' ? 'Stock : à acheter' : 'En stock'}">${IC[h.stock]}</span></span><span class="d-act"><span class="d-gout" aria-hidden="true">${IC.coeur}</span><span class="d-ajc" aria-hidden="true">${IC.plus}</span></span></div>
  <div class="d-l2"><span class="d-cases"><span class="d-objs">${['floral', 'resin'].map((f) => caseF(f, h.objs[f], autre(f), true)).join('')}</span><span class="d-exs">${EXTRAS.map((f) => caseF(f, h.ex[f], f === 'spice' ? sp(v, 16) : autre(f), false)).join('')}</span></span></div>
</div>`;

const blocs = VARIANTES.map((v, i) => `<section class="d-v" data-variante="${v.id}" data-genre="${v.genre}" data-epice="${v.epice}">
  <header class="d-t"><span class="d-code">d${i + 1}</span><h2>${v.nom}</h2><span class="d-ge">${v.genre}</span></header>
  <p class="d-sous">${v.sous}</p>
  <div class="d-row">
    <span class="d-tailles">${sp(v, 12)}${sp(v, 16)}${sp(v, 24)}<span class="d-tx">12 · 16 · 24</span></span>
    <span class="d-ep" aria-label="À côté de la feuille et des brins">${autre('herbal')}${autre('green')}${sp(v, 16)}${autre('resin')}<i class="d-sep"></i>${autre('herbal', 12)}${autre('green', 12)}${sp(v, 12)}</span>
  </div>
  <div class="d-cartes">${HOUBLONS.map((h) => carte(h, v)).join('')}</div>
</section>`).join('\n');

const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Épicé : série D, créatif à fond</title>
<style>
  * { box-sizing: border-box; }
  :root { --encre: #111; --trait: #e6e6ea; --gris: #6b7280; --gris2: #8a8f9b; }
  body { margin: 0; padding: 10px 12px 16px; font: 14px/1.2 -apple-system, system-ui, "Segoe UI", Roboto, sans-serif; color: var(--encre); background: #f3f3f1; width: 390px; max-width: 100%; }
  h1 { font-size: 16px; margin: 0 0 8px; }
  h1 small { font-weight: 400; color: var(--gris); font-size: 12px; margin-left: 6px; }
  h2 { font-size: 15px; font-weight: 700; margin: 0; }
  .d-v { background: #fff; border-radius: 14px; padding: 8px 10px 4px; margin: 0 0 8px; box-shadow: 0 0 0 1px #e3e5ea; }
  .d-t { display: flex; align-items: baseline; gap: 7px; }
  .d-code { font: 700 12px/1 ui-monospace, Menlo, monospace; color: #fff; background: ${TON}; border-radius: 6px; padding: 3px 5px; align-self: center; }
  .d-ge { font-size: 12px; color: var(--gris); margin-left: auto; white-space: nowrap; }
  .d-sous { font-size: 12px; color: var(--gris); margin: 2px 0 6px; }
  .d-row { display: flex; align-items: center; gap: 10px; padding: 0 0 6px; border-bottom: 1px solid var(--trait); }
  .d-tailles { display: inline-flex; align-items: flex-end; gap: 8px; }
  .d-tx { font-size: 12px; color: var(--gris2); margin-left: 2px; align-self: center; }
  .d-ep { display: inline-flex; align-items: center; gap: 6px; margin-left: auto; }
  .d-sep { width: 1px; height: 14px; background: var(--trait); margin: 0 2px; }
  .d-pi { display: block; flex: none; }
  /* la carte de la base (q-vr), à l'identique */
  .d-vr { position: relative; padding: 3px 0; }
  .d-vr + .d-vr { border-top: 1px solid var(--trait); }
  .d-l1 { display: flex; align-items: center; gap: 5px; min-height: 28px; }
  .d-nom { font-size: 14px; font-weight: 700; line-height: 1.15; min-width: 0; }
  .d-nom [data-houblon] { border-bottom: 1px dotted #9a9fab; }
  .d-al { font: 500 12px/1 ui-monospace, Menlo, monospace; color: var(--gris); margin-left: 2px; }
  .d-gr { display: inline-flex; align-items: center; gap: 4px; flex: 0 0 auto; }
  .d-stk { display: inline-flex; flex: 0 0 auto; color: var(--gris2); }
  .d-us { display: inline-flex; align-items: center; flex: 0 0 auto; color: var(--encre); }
  .d-us svg + svg { margin-left: -2px; }
  .d-us.d-deduit { opacity: .42; }
  .d-act { margin-left: auto; display: inline-flex; align-items: center; gap: 6px; flex: 0 0 auto; color: var(--gris2); }
  .d-ajc { display: inline-flex; width: 26px; height: 26px; border-radius: 50%; border: 1.5px solid var(--encre); color: var(--encre); align-items: center; justify-content: center; }
  .d-l2 { display: flex; align-items: flex-start; gap: 8px; margin-top: 1px; }
  .d-cases { display: flex; align-items: flex-start; gap: 8px; }
  .d-objs, .d-exs { display: inline-flex; gap: 3px; }
  .d-objs { padding-right: 8px; border-right: 1.5px dashed #c4c4cc; }
  .d-cf { width: 22px; height: 24px; display: inline-flex; flex-direction: column; align-items: center; gap: 2px; position: relative; }
  .d-ring { display: inline-flex; padding: 1px; border-radius: 50%; border: 1.5px solid var(--encre); }
  .d-cf.d-o .d-ring .d-pi { width: 14px; height: 14px; }
  .d-cf.d-ci .d-pi { opacity: .38; }
  .d-cf.d-ne .d-pi { opacity: .3; }
  .d-cf.d-vide::after { content: ""; width: 4px; height: 4px; border-radius: 2px; background: #d6d6dd; margin-top: 7px; }
  .d-jg { display: inline-flex; gap: 1.5px; height: 6px; align-items: flex-end; }
  .d-jg i { width: 4px; height: 6px; border-radius: 1px; background: var(--encre); }
  .d-jg i.d-pt { width: 3px; height: 3px; border-radius: 2px; }
  .d-jg.d-jg-ne i { width: 14px; height: 5px; background: repeating-linear-gradient(135deg, #fff 0 2px, #9aa0ab 2px 3.5px); box-shadow: inset 0 0 0 1px #8a909b; }
  .d-src { font-size: 12px; color: var(--gris); margin: 4px 0 0; }
</style></head>
<body>
<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
${FAMILLES.map(symFamille).join('\n')}
${VARIANTES.map(symboleVar).join('\n')}
</svg>
<h1>Épicé : série D<small>huit épices réelles, cadrées autrement</small></h1>
${blocs}
<p class="d-src">α : Beer Maverick. Saaz : épicé « marqué » (Hopsteiner), usage déduit de l’α. Jauges : marqué / cité dans les fiches. Cartes : ligne Suggestions de la base v4.9.</p>
</body></html>
`;
fs.writeFileSync(path.join(ICI, 'etat.html'), html);
console.log('PLANCHE écrite : ' + VARIANTES.length + ' variantes, genres : ' + [...new Set(VARIANTES.map((v) => v.genre))].join(', '));
