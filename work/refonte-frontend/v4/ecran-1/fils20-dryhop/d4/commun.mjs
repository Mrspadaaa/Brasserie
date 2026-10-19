// Lot 20 · socle commun de d4, d5 et d6 : données (donnees-h.json, seule source des chiffres), mise en
// forme française, pictos v3 duo (lus dans fils17-standard/v3/planche.html), jetons des familles,
// lentille au style / absolu, valeurs sourcées, et la vraie fiche g1 (d4/fiches-lot20.json, gestes de
// d4/fiche-gestes.js repris de b5b). Rien d'autre que ces fichiers.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie';
const ici = path.dirname(fileURLToPath(import.meta.url));
export const LOT = path.join(ici, '..');
const lire = (f) => fs.readFileSync(f, 'utf8');
export const H = JSON.parse(lire(path.join(LOT, 'donnees-h.json')));
export const SRC = { ...H.sources, ...(H.sources_d4d6 || {}) };
export const JET = JSON.parse(lire(REPO + '/work/refonte-frontend/v4/ecran-1/fils17-standard/jetons-familles.json'));
const FICHES = JSON.parse(lire(path.join(ici, 'fiches-lot20.json')));
const GESTES = lire(path.join(ici, 'fiche-gestes.js'));
const V3 = lire(REPO + '/work/refonte-frontend/v4/ecran-1/fils17-standard/v3/planche.html');
export const ACC = '#c2410c';

export const NOM = { citrus: 'Agrumes', tropical: 'Fruits tropicaux', melon: 'Melon', stoneFruit: 'Fruits à noyau', pomeFruit: 'Fruits à pépins', berries: 'Petits fruits', floral: 'Floral', herbal: 'Herbacé', resin: 'Boisé et résineux', spice: 'Épicé', green: 'Végétal', earthy: 'Terreux' };

// ---------- nombres ----------
export const fr = (x, d) => {
  if (x == null) return '';
  const r = d == null ? (Math.abs(x) >= 100 ? Math.round(x) : Math.abs(x) >= 10 ? Math.round(x * 10) / 10 : Math.round(x * 100) / 100) : Math.round(x * 10 ** d) / 10 ** d;
  return String(r).replace('.', ',').replace('-', '−');
};
// Une plage [min, max] de donnees-h.json, avec ses bornes ouvertes (inf, sup).
export const plage = (o, d) => {
  const [a, b] = o.v;
  if (a != null && b != null && a === b) return (o.inf || o.sup || '') + (o.inf || o.sup ? ' ' : '') + fr(a, d);
  if (a == null) return (o.sup || '<') + ' ' + fr(b, d);
  if (b == null) return (o.inf || '>') + ' ' + fr(a, d);
  return (o.inf ? o.inf + ' ' : '') + fr(a, d) + '–' + fr(b, d);
};
export const srcTxt = (s) => (Array.isArray(s) ? s : [s]).filter((x) => x != null && x !== '').map((x) => (typeof x === 'number' || /^\d+$/.test(x) ? '[' + x + ']' : x)).join(' ') || 'H';
export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Chaque chiffre affiché porte sa source et son niveau, dans son élément.
export const N = (texte, src, niv, cls = '') => '<span class="n ' + (/\d/.test(String(texte).replace(/3SH|4MMP|3MH|IRC7|16D|US-05|CO₂|H\d+/g, '')) ? 'mono ' : '') + cls + '" data-source="' + esc(srcTxt(src)) + '" data-niveau="' + esc(niv) + '">' + texte + '</span>';
export const ENTREE = (texte, cls = '') => '<span class="n mono ' + cls + '" data-source="saisie" data-niveau="entrée">' + texte + '</span>';
export const INC = (raison, src, niv = 'H', cls = '') => '<span class="inc ' + cls + '" data-inconnu="' + esc(raison) + '" data-source="' + esc(srcTxt(src)) + '" data-niveau="' + esc(niv) + '" aria-label="inconnu : ' + esc(raison) + '"><i class="hach" aria-hidden="true"></i>inconnu</span>';

// ---------- pictos et icônes ----------
// LES PICTOS D'ARÔME, À UN SEUL ENDROIT (19.10, soir : « le glowing des icône de arôme c'est non,
// plutôt type Baseline 2 type fil »). JEU = 'v2' : le trait net de fils17-standard/v2/planche.html,
// une seule épaisseur (2,25 sur 24 à 16 px = 1,5 px), sans disque pâle ni halo ; les familles claires
// (ton base sous 3:1 sur blanc) prennent le ton texte de jetons-familles.json. Pour essayer le trait
// dessiné de l2, changer JEU et la fonction symbolesFamilles, rien d'autre.
const JEU = 'v2';
function symbolesFamilles() {
  const src = lire(REPO + '/work/refonte-frontend/v4/ecran-1/fils17-standard/' + JEU + '/planche.html');
  return [...src.matchAll(/<symbol id="p-([a-zA-Z]+)"[\s\S]*?<\/symbol>/g)].map((m) => {
    const J = JET[m[1]]; if (!J) return m[0];
    const ton = J.baseSurBlanc < 3 ? J.texte : J.base;
    return m[0].replaceAll(J.base, ton);
  });
}
export const PICTO_TAILLE = 16;
// Le reste du jeu commun (actions, moments, états) : lucide de la planche v3, à 1,5 px.
const symboles = [...V3.matchAll(/<symbol id="([^"]+)"[\s\S]*?<\/symbol>/g)].map((m) => m[0]).filter((s) => !/id="p-/.test(s)).concat(symbolesFamilles());
// Icônes lucide-react 1.39.0 ajoutées, sur la même grille (14 px, trait 2,571 = 1,5 px rendu).
const L = (id, d) => '<symbol id="' + id + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.571" stroke-linecap="round" stroke-linejoin="round">' + d + '</symbol>';
const EXTRA = [
  L('j-drapeau', '<path d="M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528"/>'),
  L('j-lien', '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>'),
  L('j-sens', '<path d="M16 7h6v6"/><path d="m22 7-8.5 8.5-5-5L2 17"/>'),
  L('j-jauge', '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>'),
  L('j-cert', '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="m9 15 2 2 4-4"/>'),
  L('j-plage', '<path d="M3 8v8"/><path d="M21 8v8"/><path d="M3 12h18"/>'),
  L('j-loupe', '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>'),
  // Les signes des verdicts (comme l8b) : cercle coché, cercle en tirets, cercle barré.
  L('v-jeu', '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>'),
  L('v-si', '<path d="M10.1 2.182a10 10 0 0 1 3.8 0"/><path d="M13.9 21.818a10 10 0 0 1-3.8 0"/><path d="M17.609 3.721a10 10 0 0 1 2.69 2.7"/><path d="M2.182 13.9a10 10 0 0 1 0-3.8"/><path d="M20.279 17.609a10 10 0 0 1-2.7 2.69"/><path d="M21.818 10.1a10 10 0 0 1 0 3.8"/><path d="M3.721 6.391a10 10 0 0 1 2.7-2.69"/><path d="M6.391 20.279a10 10 0 0 1-2.69-2.7"/>'),
  L('v-off', '<circle cx="12" cy="12" r="10"/><path d="M4.929 4.929 19.07 19.071"/>'),
  L('v-non', '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>'),
];
export const SPRITE = '<svg width="0" height="0" style="position:absolute" aria-hidden="true">' + symboles.join('') + EXTRA.join('') + '</svg>';
// Picto de famille au trait, posé en ligne (pas de <use>) : son ton se lit au rendu ; data-famille pour
// le contrôle standard.
const PICTOS = Object.fromEntries(symbolesFamilles().map((s) => { const m = s.match(/<symbol id="p-([a-zA-Z]+)"([^>]*)>([\s\S]*?)<\/symbol>/); return [m[1], { attrs: m[2], inner: m[3] }]; }));
export const pic = (f, cls = '') => '<svg class="pi ' + cls + '" data-famille="' + f + '" width="' + PICTO_TAILLE + '" height="' + PICTO_TAILLE + '"' + PICTOS[f].attrs + ' role="img" aria-label="' + NOM[f] + '">' + PICTOS[f].inner + '</svg>';
// Ton d'une famille pour un texte ou une jauge (jetons-familles.json).
export const ton = (f, k = 'texte') => JET[f][k];
export const ico = (id, w = 14, lab = '') => '<svg class="ic" width="' + w + '" height="' + w + '" ' + (lab ? 'role="img" aria-label="' + esc(lab) + '"' : 'aria-hidden="true"') + '><use href="#' + id + '"/></svg>';

// ---------- houblons : nom, couleur, fiche ----------
export const HOP = H.houblons;
export const hop = (id, attrs = '') => { const h = HOP[id]; return '<span class="hb" data-houblon="' + h.cle + '" data-couleur="' + h.couleur + '" tabindex="0" ' + attrs + '><i class="pt" style="background:' + h.couleur + '"></i>' + h.nom + '</span>'; };

// L'α : celui du lot en stock, puis la plage des fiches en plus petit (« Pas d'info sur les AA, j'en
// vrai valeur », sur l8b). data-role="alpha", data-source="lot" ou "fiches".
export const ALPHA = H.d5 ? H.d5.alpha : {};
export const alpha = (id, opts = {}) => {
  const A = ALPHA[id]; if (!A) return '';
  const autre = A.lot.inconnu && A.stockAutreForme;
  const lot = autre
    ? '<span class="a-lot n mono" data-role="alpha" data-source="lot" data-niveau="F" aria-label="α du lot en stock : Citra cryo, ' + esc(A.stockAutreForme.de) + '">' + fr(A.stockAutreForme.v) + ' %<span class="a-f"> cryo</span></span>'
    : A.lot.inconnu
      ? '<span class="a-lot inc" data-role="alpha" data-source="lot" data-niveau="F" data-inconnu="' + esc(A.lot.raison) + '"><i class="hach" aria-hidden="true"></i>pas en stock</span>'
      : '<span class="a-lot n mono" data-role="alpha" data-source="lot" data-niveau="F" aria-label="α du lot en stock, ' + esc(A.lot.de) + '">' + fr(A.lot.v) + ' %</span>';
  const pel = autre || opts.pellets || A.note;
  const fi = A.fiches.inconnu ? '' : '<span class="a-fi n mono" data-role="alpha" data-source="fiches" data-niveau="S" aria-label="plage des fiches' + (pel ? ', celle du Citra en pellets' : '') + '">' + fr(A.fiches.v[0]) + '–' + fr(A.fiches.v[1]) + ' %' + (pel ? '<span class="a-f"> pellets</span>' : '') + '</span>';
  // Forme courte (d6) : une seule valeur, celle du lot s'il est en stock sous cette forme, sinon les fiches ;
  // le « α » est dessiné par la feuille de style.
  if (opts.court) return '<span class="alpha a-court">' + (A.lot.inconnu ? fi : lot) + '</span>';
  return '<span class="alpha"><span class="a-g">α</span>' + lot + fi + '</span>';
};

// ---------- commandes ----------
export const seg = (role, label, items, actif) => '<span class="seg" role="radiogroup" aria-label="' + esc(label) + '" data-seg="' + role + '">' + items.map((x) => '<button role="radio" type="button" data-v="' + x.v + '" aria-checked="' + (x.v === actif) + '"' + (x.attrs || '') + '>' + (x.ico || '') + x.t + '</button>').join('') + '</span>';
// La légende, derrière un petit « ? » discret (19.10 : « un bouton légende un peu caché pour pas que ça
// gêne ») : fermée par défaut, jamais au premier écran tant qu'on ne la demande pas.
export const legendeBouton = () => '<button type="button" class="leg-b" data-role="legende-bouton" aria-expanded="false" aria-controls="legende" aria-label="Légende">?</button>';
export const legende = (items) => '<div class="leg" id="legende" data-role="legende" hidden><div class="leg-t">Légende<button type="button" class="leg-x" data-role="legende-fermer" aria-label="Fermer la légende">' + ico('i-x', 16) + '</button></div><ul>' + items.map(([g, t]) => '<li><span class="leg-g">' + g + '</span><span>' + t + '</span></li>').join('') + '</ul></div>';
export const lentille = () => '<span class="seg lentille" role="radiogroup" aria-label="Lecture"><button role="radio" type="button" data-e="style" aria-checked="true">Au style</button><button role="radio" type="button" data-e="absolu" aria-checked="false">Absolu</button></span>';

// ---------- styles ----------
// L'habillage de la baseline l8b (fils18-baseline/l8b, choisie le 19.10) : surfaces blanches et grises
// (#ececf1), cartes blanches à ombre légère, tuiles pâles au ton fond de la famille, lentille au style
// en pilule noire, Source Sans 3 pour ce qui se dit et IBM Plex Mono pour ce qui se mesure, en 12, 14 et
// 16 px seulement ; rayons 2, 4, 8 px ou pilule.
export const POLICES = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600&family=Source+Sans+3:wght@400;600;700&display=swap">';
export const CSS = `
  :root { --encre: #16161a; --gris: #5b5b66; --trait: #dcdce3; --trait2: #c4c4cc; --piste: #ececf1; --acc: #c2410c; --acc-f: #fdf0ea;
    --sans: 'Source Sans 3', -apple-system, system-ui, 'Segoe UI', Roboto, sans-serif; --mono: 'IBM Plex Mono', ui-monospace, Consolas, monospace; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #fff; color: var(--encre); }
  body { font: 400 14px/1.25 var(--sans); -webkit-tap-highlight-color: transparent; }
  .mono { font-family: var(--mono); font-weight: 500; letter-spacing: -.02em; }
  .carte { background: #fff; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,.12); }
  .tuile { background: var(--f); border-radius: 8px; }
  .lentille button[aria-checked="true"] { background: var(--encre) !important; color: #fff !important; }
  button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; }
  svg { display: block; flex: none; }
  :focus-visible { outline: 2px solid var(--encre); outline-offset: 2px; }
  .ecran { width: 100%; max-width: 390px; margin: 0 auto; padding: 6px 16px 24px; display: flex; flex-direction: column; gap: 8px; overflow-x: hidden; }
  .barre { display: flex; align-items: center; gap: 6px; min-height: 32px; }
  .retour { width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; }
  h1 { font-size: 16px; font-weight: 700; white-space: nowrap; }

  .n { font-variant-numeric: tabular-nums; white-space: nowrap; }
  .gris { color: var(--gris); }
  .p { font-size: 12px; }
  .seg { display: inline-flex; background: var(--piste); border-radius: 16px; padding: 2px; flex: none; }
  .seg button { height: 28px; padding: 0 10px; border-radius: 14px; font-size: 14px; color: var(--gris); white-space: nowrap; display: inline-flex; align-items: center; gap: 4px; }
  .seg button[aria-checked="true"] { background: #fff; color: var(--encre); font-weight: 650; box-shadow: 0 1px 2px rgba(0,0,0,.12); }
  .lentille button { height: 24px; padding: 0 8px; border-radius: 12px; font-size: 12px; }
  .lentille { border-radius: 14px; }
  .hb { display: inline-flex; align-items: center; gap: 5px; font-size: 14px; font-weight: 700; white-space: nowrap; text-decoration: underline dotted #9a9aa6; text-underline-offset: 3px; cursor: default; border-radius: 4px; }
  .pt { width: 8px; height: 8px; border-radius: 50%; flex: none; display: inline-block; }
  .alpha { display: inline-flex; align-items: baseline; gap: 4px; white-space: nowrap; }
  .a-g { font-size: 12px; color: var(--gris); font-weight: 600; }
  .a-lot { font-size: 14px; font-weight: 600; }
  .a-lot.inc { font-size: 12px; font-weight: 400; }
  .a-fi { font-size: 12px; color: var(--gris); }
  .a-court::before { content: 'α'; font-size: 12px; color: var(--gris); font-weight: 600; margin-right: 1px; }
  .a-court .a-lot, .a-court .a-fi { font-size: 12px; font-weight: 500; color: var(--gris); }
  .hbx { display: inline-flex; align-items: baseline; gap: 4px; }
  .a-f { margin-left: 3px; font-family: var(--sans); font-size: 12px; font-weight: 400; color: var(--gris); }
  .inc { display: inline-flex; align-items: center; gap: 4px; color: var(--gris); font-size: 12px; white-space: nowrap; }
  .hach { width: 14px; height: 8px; border-radius: 2px; flex: none; background: repeating-linear-gradient(135deg, #fff 0 2px, #8a909b 2px 3.5px); box-shadow: inset 0 0 0 1px #8a909b; display: inline-block; }
  .pi { width: 16px; height: 16px; }
  [data-famille="citrus"] { --f: #fcf8e3; } [data-famille="tropical"] { --f: #fdf1e3; } [data-famille="melon"] { --f: #eaf6f0; }
  [data-famille="stoneFruit"] { --f: #fbebe4; } [data-famille="pomeFruit"] { --f: #f5f8e7; } [data-famille="berries"] { --f: #f6e9f1; }
  [data-famille="floral"] { --f: #f3e8f7; } [data-famille="herbal"] { --f: #eaf5ef; } [data-famille="resin"] { --f: #eaf6f3; }
  [data-famille="spice"] { --f: #f5eeea; } [data-famille="green"] { --f: #eff7e8; } [data-famille="earthy"] { --f: #f3f1ed; }
  .ic { color: currentColor; }
  .sec-t { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--gris); font-weight: 600; min-height: 20px; }
  .sep { border-top: 1px solid var(--trait); }
  .xs { color: var(--acc); }
  body.abs .seul-style { display: none !important; }
  body:not(.abs) .seul-absolu { display: none !important; }
  /* indice de la fiche : le nom se remplit pendant l'appui (comme b5b) */
  [data-houblon].appui, [data-houblon].survol { background: linear-gradient(#dcdcdc, #dcdcdc) no-repeat left center / 0% 100%; animation: remplit 500ms linear forwards; }
  @media (prefers-reduced-motion: reduce) { [data-houblon].appui, [data-houblon].survol { animation: none; } }
  .f-source { box-shadow: inset 0 0 0 1.5px var(--encre); border-radius: 8px; }
  /* la feuille de détail (plan 2) */
  .feuille { position: fixed; left: 50%; bottom: 0; transform: translateX(-50%); width: min(390px, 100%); max-height: 70vh; overflow: auto; background: #fff; border-radius: 8px 8px 0 0; box-shadow: 0 -12px 40px -16px rgba(0,0,0,.35); padding: 10px 16px 16px; z-index: 40; display: none; }
  .feuille.ouverte { display: block; }
  .feuille .ft { display: flex; align-items: center; gap: 6px; min-height: 28px; font-weight: 700; font-size: 14px; }
  .feuille .ft button { margin-left: auto; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; background: var(--piste); }
  .feuille dl { display: grid; grid-template-columns: auto 1fr; gap: 4px 10px; font-size: 13px; margin-top: 6px; }
  .feuille dl { grid-template-columns: minmax(64px, 32%) minmax(0, 1fr); }
  .feuille dd { min-width: 0; overflow-wrap: anywhere; }
  .feuille .n { white-space: normal; }
  .feuille dt { color: var(--gris); font-size: 12px; }
  .feuille .src { color: var(--gris); font-size: 12px; }
  .leg-b { width: 24px; height: 24px; border-radius: 50%; font-size: 12px; font-weight: 700; color: var(--gris); box-shadow: inset 0 0 0 1px var(--trait2); flex: none; }
  .leg-b[aria-expanded="true"] { background: var(--encre); color: #fff; box-shadow: none; }
  .leg { position: fixed; left: 50%; top: 44px; transform: translateX(-50%); width: min(358px, calc(100% - 32px)); background: #fff; border-radius: 8px; box-shadow: 0 8px 24px -12px rgba(0,0,0,.45), 0 0 0 1px var(--trait); padding: 6px 10px 10px; z-index: 45; font-size: 12px; }
  .leg[hidden] { display: none; }
  .leg-t { display: flex; align-items: center; font-weight: 700; font-size: 14px; min-height: 28px; }
  .leg-x { margin-left: auto; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; background: var(--piste); }
  .leg ul { list-style: none; display: grid; gap: 4px; }
  .leg li { display: flex; align-items: center; gap: 8px; min-height: 20px; }
  .leg-g { width: 56px; flex: none; display: inline-flex; align-items: center; gap: 2px; }
  #fiche-racine { --encre: #111; --gris: #555; --gris2: #6e6e6e; --trait: #d4d4d4; --fond: #f5f5f5; --fond2: #ebebeb; }
`;

const ficheTpl = (cles) => cles.filter((k) => FICHES.fiches[k]).map((k) => {
  const f = FICHES.fiches[k];
  return '<template data-fiche="' + k + '">' + f.html + '</template>' + Object.entries(f.sections).filter(([, v]) => v).map(([s, v]) => '<template data-fiche-sec="' + k + '|' + s + '">' + v + '</template>').join('');
}).join('\n');

export const SCRIPT_LENTILLE = `
  document.querySelectorAll('.lentille [data-e]').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('.lentille [data-e]').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
    document.body.classList.toggle('abs', b.dataset.e === 'absolu');
  }));
  if (/[?&]abs\\b/.test(location.search)) document.querySelector('.lentille [data-e="absolu"]').click();
  const LB = document.querySelector('[data-role="legende-bouton"]'), LG = document.querySelector('[data-role="legende"]');
  const legende = (o) => { if (!LB || !LG) return; LG.hidden = !o; LB.setAttribute('aria-expanded', String(o)); };
  if (LB) LB.addEventListener('click', () => legende(LB.getAttribute('aria-expanded') !== 'true'));
  document.querySelectorAll('[data-role="legende-fermer"]').forEach((b) => b.addEventListener('click', () => legende(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') legende(false); });
  if (/[?&]legende\\b/.test(location.search)) legende(true);
  // La feuille de détail : un toucher sur un élément [data-detail] l'ouvre ; Fermer ou Échap la ferme.
  const FEUILLE = document.querySelector('.feuille');
  function ouvrirDetail(id, source) {
    const t = document.querySelector('template[data-d="' + id + '"]'); if (!t || !FEUILLE) return;
    FEUILLE.replaceChildren(t.content.cloneNode(true)); FEUILLE.classList.add('ouverte');
    const b = FEUILLE.querySelector('[data-role="fermer-detail"]'); if (b) { b.addEventListener('click', fermerDetail); b.focus({ preventScroll: true }); }
    FEUILLE.dataset.source = id;
  }
  function fermerDetail() { if (!FEUILLE) return; FEUILLE.classList.remove('ouverte'); FEUILLE.replaceChildren(); }
  document.addEventListener('click', (e) => { const d = e.target.closest('[data-detail]'); if (d && !e.defaultPrevented) ouvrirDetail(d.dataset.detail, d); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && FEUILLE && FEUILLE.classList.contains('ouverte')) fermerDetail(); });
  const qd = new URLSearchParams(location.search).get('detail'); if (qd) ouvrirDetail(qd);
`;

// Une feuille de détail (plan 2) : <template data-d="id">.
export const detail = (id, titre, lignes, pied = '') => '<template data-d="' + id + '"><div class="ft">' + titre + '<button type="button" data-role="fermer-detail" aria-label="Fermer le détail">' + ico('i-x', 16) + '</button></div><dl>' + lignes.map(([dt, dd]) => '<dt>' + dt + '</dt><dd>' + dd + '</dd>').join('') + '</dl>' + pied + '</template>';

// Les valeurs brutes en anglais des catalogues (« low », « high », « medium », « unknown ») s'écrivent en
// français partout où elles s'affichent : texte visible et étiquettes (aria-label), jamais le script.
const MOTS_EN = { low: 'faible', high: 'élevée', medium: 'moyenne', unknown: 'inconnu' };
export const frTexte = (t) => String(t).replace(/\b(low|high|medium|unknown)\b/gi, (m) => MOTS_EN[m.toLowerCase()]);
const frHtml = (h) => h.replace(/>([^<]+)</g, (m, t) => '>' + frTexte(t) + '<').replace(/aria-label="([^"]*)"/g, (m, t) => 'aria-label="' + frTexte(t) + '"');
export function page({ titre, css = '', corps: corps0, script = '', fiches = [] }) {
  const corps = frHtml(corps0);
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${POLICES}
<title>${titre}</title>
<style>${CSS}
  /* la vraie fiche g1 : règles CSS de la base (base/consolide/etat-b.html), extraites par d4/extraire-fiches.mjs */
  ${FICHES.css.join('\n  ')}
${css}</style>
</head>
<body>
${SPRITE}
${corps}
<div class="feuille" role="dialog" aria-label="Détail"></div>
<div id="fiche-racine"></div>
${ficheTpl(fiches)}
<script>${SCRIPT_LENTILLE}
${script}</script>
<script>${GESTES}</script>
</body>
</html>
`;
}
