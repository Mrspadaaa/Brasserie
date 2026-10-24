// Socle de la série sbu (lot D125, Substituer, « Lequel à la place de Nugget ? ») : données, vocabulaire de la
// baseline (pictos au trait, couleurs des familles, l5b au style, α et rôle, usage en mot, stock en petit badge, croix,
// légende derrière un « ? », fiche à l'appui long) et assemblage d'une page. Ce n'est pas un gabarit : chaque concept
// compose son écran ; le socle ne pose que les briques. Classes du socle préfixées « su- », celles des concepts
// « sbuN- » (L26). Assemblage par concaténation, jamais par String.replace.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const ECRAN = path.resolve(ici, '../../..');
export const D = JSON.parse(fs.readFileSync(path.join(ici, 'donnees.json'), 'utf8'));

// Les pictos de famille de la baseline (planche fils17-standard/v3 : épicé = cannelle et clou croisés, p-spice).
const planche = fs.readFileSync(path.join(ECRAN, 'fils17-standard/v3/planche.html'), 'utf8');
const s0 = planche.lastIndexOf('<svg', planche.indexOf('<symbol id="p-citrus"'));
export const SYMBOLES = planche.slice(s0, planche.indexOf('</svg>', planche.lastIndexOf('</symbol>')) + 6);
if (!SYMBOLES.includes('id="p-spice"')) throw new Error('p-spice absent de la planche');

export const FAM = ['floral', 'herbal', 'earthy', 'citrus', 'tropical', 'stoneFruit', 'pomeFruit', 'berries', 'melon', 'resin', 'spice', 'green'];
export const NOM = { floral: 'Floral', herbal: 'Herbacé', earthy: 'Terreux', citrus: 'Agrumes', tropical: 'Tropicaux', stoneFruit: 'Noyau', pomeFruit: 'Pépins', berries: 'Baies', melon: 'Melon', resin: 'Résineux', spice: 'Épicé', green: 'Végétal' };
export const JET = JSON.parse(fs.readFileSync(path.join(ECRAN, 'fils17-standard/jetons-familles.json'), 'utf8'));
// Les familles qui comptent pour ce style (16D) : les attendues, et le résineux, hors du style dans sa stout.
export const CLES = ['floral', 'herbal', 'earthy', 'resin'];

// Une couleur par houblon, la même sur toutes les pages de la série (D83, S1).
export const COUL = {
  'beermaverick-nugget': '#0072b2', 'beermaverick-nelson-sauvin': '#009e73', 'beermaverick-galaxy': '#6a3fd0',
  'beermaverick-idaho-7': '#e80030', 'beermaverick-sabro': '#e69f00', 'beermaverick-altus': '#8a5a00',
  'beermaverick-magnat': '#3d9be0', 'beermaverick-trident': '#d45087', 'beermaverick-yeoman': '#3b3b8f',
  'beermaverick-zenia': '#7a8b00', 'beermaverick-helios': '#a05195',
};

const M60 = D.moments['60'];
export const NUG = D.nugget;
export const AVANT = M60.biere; // ma bière avec Nugget à 60′ (dégustation du 18.10 + simulé)
export const IBU0 = Math.round(M60.ibuNugget.ibu.valeur);
export const LISTE = M60.remplacants; // classés par le moteur, « en stock d'abord »

export const fr = (x, n = 1) => { const p = 10 ** n; return String(Math.round(x * p) / p).replace('.', ','); };
export const g = (x) => fr(x, 1) + ' g';
const esc = (s) => String(s).split('&').join('&amp;').split('<').join('&lt;');

/** Plage du score quand une composante manque : elle est laissée ouverte de 0 à 100, poids du moteur à 60′
 * (arôme 0,2, huiles 0,2, amertume 0,6). Calcul de cette page, pas du moteur (comme u4). */
export function plage(r) {
  const w = { arome: 0.2, huiles: 0.2, amertume: 0.6 }, c = r.composantes;
  const k = Object.keys(w).filter((x) => c[x] == null);
  if (!k.length) return null;
  const s = (v) => Object.keys(w).reduce((t, x) => t + w[x] * (c[x] == null ? v : c[x]), 0);
  return [Math.round(s(0)), Math.round(s(100))];
}
export const alphaTxt = (h) => '<span data-role="alpha" data-source="' + (lot(h) ? 'lot' : 'fiches') + '" data-houblon-alpha="' + h.nom + '">' + (h.alpha ? 'α ' + fr(h.alpha.valeur) + ' %' : 'α ?') + '</span>';
export const plageTxt = (h) => (h.alpha && h.alpha.plage ? (h.alpha.horsFiches ? '≠ ' : '') + fr(h.alpha.plage[0]) + '–' + fr(h.alpha.plage[1]) : '');
export const lot = (h) => !!h.alpha && /article|stock/.test(h.alpha.source);
export const doseTxt = (r) => (r.dose.min !== r.dose.max ? g(r.doseExacte) + ' (' + r.dose.min + '–' + r.dose.max + ')' : g(r.doseExacte));

// ---------- Briques ----------
/** Icônes au trait : épaisseur rendue unique de 1,75 px, quelle que soit la taille (D83, S4). */
const IC = {
  croix: '<path d="M18 6 6 18M6 6l12 12"/>',
  boite: '<path d="M21 8 12 3 3 8v8l9 5 9-5Z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
  panier: '<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2.5 3.5h3l2.6 11.5h10.4l2-8H7"/>',
  coeur: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"/>',
  exclure: '<circle cx="12" cy="12" r="9"/><path d="m5.7 5.7 12.6 12.6"/>',
  fleche: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  epingle: '<path d="M12 17v5M9 10.8V4h6v6.8l3 3.2H6Z"/>',
};
export function ic(nom, t = 14, label) {
  const sw = (1.75 * 24 / t).toFixed(3);
  return '<svg class="su-ic" width="' + t + '" height="' + t + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + sw + '" stroke-linecap="round" stroke-linejoin="round" '
    + (label ? 'role="img" aria-label="' + label + '"' : 'aria-hidden="true"') + '>' + IC[nom] + '</svg>';
}
export const pi = (f, t = 16) => '<svg class="su-pi" width="' + t + '" height="' + t + '" style="width:' + t + 'px;height:' + t + 'px" data-famille="' + f + '" aria-label="' + NOM[f] + '"><use href="#p-' + f + '"/></svg>';
export const point = (cle, nom, t = 10) => '<i class="su-pt" data-couleur="' + COUL[cle] + '" data-serie="' + nom + '" style="width:' + t + 'px;height:' + t + 'px;background:' + COUL[cle] + '"></i>';
/** Le nom du houblon (appui long : sa fiche) ; s'il a plus de la moitié de ses mots hors des 12 familles (L14, D100), une part « autres » dessinée et, sauf en court, son premier mot. */
export function nomH(h, cls = '', court = false) {
  const p = h.partSansFamille, mots = ((D.mots[h.cle] || {}).sansFamille || []).filter((m) => /[éèàçûô]|^[a-z ]+$/.test(m) && !/^(fruity|white wine|resiny|dank|fruité)$/i.test(m));
  const aut = p > 0.5 ? '<span class="su-aut"><i data-role="autres" data-houblon="' + esc(h.nom) + '" data-part="' + p + '" aria-label="autres : ' + Math.round(p * 100) + ' % de ses mots hors des 12 familles" style="width:' + Math.round(40 * p) + 'px"></i>' + (court || !mots.length ? '' : mots[0] + '…') + '</span>' : '';
  return '<span class="su-nom ' + cls + '" data-houblon="' + esc(h.nom) + '">' + esc(h.nom) + '</span>' + aut;
}
export const usage = (mot, cls = '') => '<span class="su-us ' + cls + '" data-role="usage" data-usage="' + (mot === 'mixte' ? 'double' : mot) + '">' + mot + '</span>';
/** Le stock, en petit badge : une boîte (au stock, assez pour la dose), une boîte et les grammes (pas assez), un panier (à acheter). */
export function stock(r) {
  if (!r || !r.stock) return '';
  if (r.stock.etat === 'à acheter') return '<span class="su-stk">' + ic('panier', 12, 'à acheter') + '</span>';
  if (r.stock.suffisant === false) return '<span class="su-stk su-stk-peu">' + ic('boite', 12, 'en stock, pas assez') + '<span class="num">' + Math.round(r.stock.libre) + ' g</span></span>';
  return '<span class="su-stk">' + ic('boite', 12, 'en stock') + '</span>';
}
export const stockNugget = () => '<span class="su-stk su-stk-peu">' + ic('boite', 12, 'stock épuisé') + '<span class="num">0 g</span></span>';
export const croix = (titre = 'Fermer, retour à l’étape Houblons') => '<a class="su-croix" href="../../fils22-carte/ma-biere/etat.html" aria-label="' + titre + '">' + ic('croix', 22) + '</a>';
export const lentille = (cls = '') => '<span class="su-seg ' + cls + '" role="radiogroup" aria-label="lecture au style ou absolu"><button type="button" role="radio" aria-checked="true" data-e="style">Au style</button><button type="button" role="radio" aria-checked="false" data-e="absolu">Absolu</button></span>';
export const legende = (id, lignes, cls = '') => '<span class="su-legw ' + cls + '"><button type="button" class="su-aide" data-role="legende-bouton" aria-expanded="false" aria-controls="leg-' + id + '" aria-label="Lire la légende">?</button>'
  + '<span class="su-leg" id="leg-' + id + '" data-role="legende" hidden>' + lignes.map((l) => '<span>' + l + '</span>').join('') + '</span></span>';

// Les barres l5b de ma bière, au style (la zone du style occupe la moitié gauche) ou en absolu (0–110).
const val = (b, f) => (b.profil[f].valeur ? b.profil[f].valeur.centre : null);
const ws = (v, f) => (Math.min(100, (v / AVANT.profil[f].bande[1]) * 50)).toFixed(1) + '%';
const wa = (v) => (Math.min(100, (v / 110) * 100)).toFixed(1) + '%';
export function delta(apres, f) {
  const a = val(apres, f), b = val(AVANT, f);
  if (a == null || b == null) return '?';
  const d = Math.round(a - b);
  return d === 0 ? '~=' : '~' + (d > 0 ? '+' : '−') + Math.abs(d);
}
export const hors = (b, f) => b.profil[f].horsStyle === 'au-dessus';
/** Une barre l5b : la zone du style, le remplissage de la bière après, le rond de la bière avant. */
export function barre(f, apres, cls = '') {
  const a = val(apres, f), b = val(AVANT, f), bande = AVANT.profil[f].bande;
  if (a == null) return '<span class="su-piste su-inc ' + cls + '" data-f="' + f + '"><i class="su-zone" data-role="zone" style="--ws:50%;--wa:' + wa(bande[1]) + '"></i><i class="su-hach"></i></span>';
  return '<span class="su-piste ' + cls + '" data-f="' + f + '"><i class="su-zone" data-role="zone" style="--ws:50%;--wa:' + wa(bande[1]) + '"></i>'
    + '<i class="su-rem" style="--ws:' + ws(a, f) + ';--wa:' + wa(a) + ';background:' + (hors(apres, f) ? '#c2410c' : JET[f].base) + '"></i>'
    + (b != null ? '<i class="su-av" style="--ws:' + ws(b, f) + ';--wa:' + wa(b) + '"></i>' : '') + '</span>';
}
/** Données client d'une barre (pour les concepts qui changent de remplaçant sans recharger). */
export const barreData = (apres) => Object.fromEntries(FAM.map((f) => { const a = val(apres, f); return [f, a == null ? null : { ws: ws(a, f), wa: wa(a), c: hors(apres, f) ? '#c2410c' : JET[f].base, d: delta(apres, f), h: hors(apres, f) }]; }));

// ---------- La fiche (appui long), un radar au trait par houblon ----------
function radar(h, t = 210) {
  const c = t / 2, R = t / 2 - 26, n = FAM.length;
  const ang = (i) => (-90 + (360 / n) * i) * Math.PI / 180;
  const pt = (i, r) => [c + Math.cos(ang(i)) * r, c + Math.sin(ang(i)) * r];
  const v = FAM.map((f) => { const x = h.familles[f]; return x.niveau === 'non décrit' ? null : x.niveau === 'marqué' ? 1 : 0.55; });
  let s = '<svg class="su-radar" data-radar data-objet="fiche" width="' + t + '" height="' + t + '" viewBox="0 0 ' + t + ' ' + t + '" role="img" aria-label="Silhouette de ' + esc(h.nom) + ' selon ses fiches">'
    + '<defs><pattern id="su-h-' + h.cle + '" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0v5" stroke="#c9cad2" stroke-width="1.6"/></pattern></defs>';
  for (const k of [0.33, 0.66, 1]) s += '<polygon points="' + FAM.map((_, i) => pt(i, R * k).map((x) => x.toFixed(1)).join(',')).join(' ') + '" fill="none" stroke="#e3e5eb"/>';
  FAM.forEach((f, i) => {
    if (v[i] == null) { const a = pt(i - 0.5, R), b = pt(i + 0.5, R); s += '<path d="M' + c + ' ' + c + 'L' + a.map((x) => x.toFixed(1)).join(' ') + 'L' + b.map((x) => x.toFixed(1)).join(' ') + 'Z" fill="url(#su-h-' + h.cle + ')"/>'; }
    const e = pt(i, R); s += '<line x1="' + c + '" y1="' + c + '" x2="' + e[0].toFixed(1) + '" y2="' + e[1].toFixed(1) + '" stroke="#e3e5eb"/>';
  });
  s += '<polygon points="' + FAM.map((_, i) => pt(i, R * (0.1 + 0.9 * (v[i] || 0))).map((x) => x.toFixed(1)).join(',')).join(' ') + '" fill="' + COUL[h.cle] + '22" stroke="' + COUL[h.cle] + '" stroke-width="2" stroke-linejoin="round"/>';
  FAM.forEach((f, i) => { const [x, y] = pt(i, R + 14); s += '<svg x="' + (x - 8).toFixed(1) + '" y="' + (y - 8).toFixed(1) + '" width="16" height="16" data-famille="' + f + '" aria-label="' + NOM[f] + '"><use href="#p-' + f + '"/></svg>'; });
  return s + '</svg>';
}
export function fiche(r) {
  const h = r.houblon || r, mots = D.mots[h.cle] || { parFamille: {}, sansFamille: [] };
  const cites = FAM.filter((f) => h.familles[f].niveau !== 'non décrit').sort((a, b) => (h.familles[b].niveau === 'marqué') - (h.familles[a].niveau === 'marqué'));
  const sur = Math.max(...FAM.map((f) => h.familles[f].sur));
  const autres = [...new Set(mots.sansFamille.map((m) => m.toLowerCase()))].filter((m) => /[éèàçûô]|^[a-z ]+$/.test(m)).slice(0, 4);
  return '<div class="su-voile" data-k="voile" aria-hidden="true"></div>'
    + '<section class="su-fi" data-role="fiche" role="dialog" tabindex="-1" aria-label="Fiche de ' + esc(h.nom) + '">'
    + '<header class="su-fi-t"><h2>' + esc(h.nom) + '</h2>' + usage(h.role.mot) + (r.stock ? stock(r) : stockNugget())
    + '<button class="su-fi-x" data-role="fermer-fiche" data-k="fermer" aria-label="Fermer la fiche">' + ic('croix', 18) + '</button></header>'
    + '<p class="su-fi-w" data-role="fiche-alpha"><b class="num">' + alphaTxt(h) + '</b> ' + (lot(h) ? 'ton lot' : 'milieu des fiches') + (h.alpha && h.alpha.plage ? ' · <span class="num">' + plageTxt(h) + ' %</span> ses fiches' : '') + '</p>'
    + '<div class="su-fi-w su-fi-ar" data-role="fiche-arome">'
    + cites.map((f) => '<span class="su-fi-l">' + pi(f, 14) + '<b style="color:' + JET[f].texte + '">' + NOM[f] + '</b> <span class="num">' + h.familles[f].fiches + '/' + h.familles[f].sur + '</span></span>').join('')
    + (autres.length ? '<span class="su-fi-src">hors des familles : ' + esc(autres.join(', ')) + '</span>' : '')
    + '<span class="su-fi-src">' + sur + ' fiches lues · hachuré : non décrit, pas zéro</span>'
    + '<div class="su-fi-r">' + radar(h) + '</div></div>'
    + '<div class="su-fi-act"><span class="su-fi-g" role="group" data-role="gout" aria-label="Mon goût"><button data-k="aimer" aria-pressed="false" aria-label="Aimer">' + ic('coeur', 16) + '</button><button data-k="exclure" aria-pressed="false" aria-label="Exclure">' + ic('exclure', 16) + '</button></span></div>'
    + '</section>';
}

export const CSS = `
:root { --encre:#16161a; --gris:#5b5b66; --trait:#e3e3e8; --surf:#f3f3f6; --surf2:#ececf1; --acc:#c2410c; --sans:"Source Sans 3",system-ui,-apple-system,"Segoe UI",sans-serif; --mono:"IBM Plex Mono",ui-monospace,Consolas,monospace; }
[hidden] { display:none !important; }
* { box-sizing:border-box; margin:0; padding:0; }
html, body { background:#fff; }
body { color:var(--encre); font:400 14px/1.25 var(--sans); -webkit-tap-highlight-color:transparent; overflow-x:hidden; }
button { font:inherit; color:inherit; background:none; border:0; cursor:pointer; }
button:focus-visible, a:focus-visible, [tabindex]:focus-visible { outline:2px solid var(--encre); outline-offset:2px; }
a { color:inherit; text-decoration:none; }
svg { display:block; flex:none; }
.num { font-family:var(--mono); font-variant-numeric:tabular-nums; letter-spacing:-.02em; }
.su-ic { color:currentColor; }
.su-pi { display:block; }
.su-pt { display:inline-block; border-radius:50%; flex:none; }
.su-nom { font-weight:600; text-decoration:underline dotted #9a9aa6 1.5px; text-underline-offset:3px; -webkit-touch-callout:none; user-select:none; }
.su-aut { display:inline-flex; align-items:center; gap:3px; font-size:11px; color:var(--gris); white-space:nowrap; }
.su-aut i { display:block; height:7px; border-radius:2px; background:#b4b4bd; flex:none; }
.su-us { display:inline-flex; align-items:center; height:20px; padding:0 8px; border-radius:999px; background:var(--surf2); color:var(--encre); font-size:12px; font-weight:600; white-space:nowrap; }
.su-stk { display:inline-flex; align-items:center; gap:2px; color:var(--gris); font-size:11px; }
.su-croix { width:44px; height:44px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; color:var(--encre); border:1px solid var(--trait); background:#fff; flex:none; }
.su-seg { display:inline-flex; background:var(--surf2); border-radius:15px; padding:2px; flex:none; }
.su-seg button { height:26px; padding:0 10px; border-radius:13px; font-size:13px; color:var(--gris); }
.su-seg button[aria-checked="true"] { background:var(--encre); color:#fff; font-weight:600; }
.su-legw { position:relative; display:inline-flex; flex:none; }
.su-aide { width:28px; height:28px; border-radius:50%; border:1px solid #c9cad2; background:#fff; font-weight:700; color:var(--gris); }
.su-leg { position:absolute; top:34px; left:0; z-index:30; background:#fff; border:1px solid #c9cad2; border-radius:8px; padding:8px 10px; font-size:13px; display:flex; flex-direction:column; gap:5px; width:236px; box-shadow:0 8px 24px -12px rgba(22,22,26,.4); }
.su-leg span { display:flex; align-items:center; gap:6px; }
.su-legw.su-droite .su-leg { left:auto; right:0; }
.su-piste { position:relative; display:block; height:10px; background:#f0f0f3; border-radius:2px; overflow:hidden; }
.su-piste i { position:absolute; top:0; bottom:0; left:0; display:block; }
.su-piste .su-zone { width:var(--ws); background:#dcdce2; }
.su-piste .su-rem { width:var(--ws); height:6px; top:2px; border-radius:2px; transition:width .2s cubic-bezier(.2,.8,.2,1); }
.su-piste .su-av { left:clamp(5px, var(--ws), calc(100% - 5px)); width:10px; height:10px; top:0; border-radius:50%; border:2px solid var(--encre); background:#fff; margin-left:-5px; transition:left .2s; }
.su-piste .su-hach { right:0; background:repeating-linear-gradient(135deg,#c9cdd6 0 2px,transparent 2px 6px); }
body.abs .su-piste .su-zone, body.abs .su-piste .su-rem { width:var(--wa); }
body.abs .su-piste .su-av { left:clamp(5px, var(--wa), calc(100% - 5px)); }
.su-hachure { background:repeating-linear-gradient(135deg,#c9cdd6 0 2px,transparent 2px 6px); }
.su-pied { display:flex; gap:8px; align-items:center; }
.su-annuler { height:44px; padding:0 16px; border-radius:22px; border:1px solid #c9cad2; background:#fff; font-weight:600; font-size:15px; flex:none; }
.su-remplacer { height:44px; flex:1; border-radius:22px; background:var(--encre); color:#fff; font-weight:700; font-size:16px; display:inline-flex; align-items:center; justify-content:center; }
/* La fiche */
#su-fiche { position:relative; z-index:60; }
.su-voile { position:fixed; inset:0; background:rgba(22,22,26,.32); }
.su-fi { position:fixed; left:0; right:0; bottom:0; max-height:90vh; overflow-y:auto; background:#fff; border-radius:24px 24px 0 0; box-shadow:0 -12px 40px -16px rgba(22,22,26,.6); padding:10px 12px 14px; display:flex; flex-direction:column; gap:6px; max-width:390px; margin:0 auto; }
.mode-bulle .su-fi { left:calc(50% + 211px); right:auto; bottom:auto; top:16px; width:360px; margin:0; }
@media (max-width:1000px) { .mode-bulle .su-fi { left:auto; right:16px; } }
.su-fi-t { display:flex; align-items:center; gap:8px; min-height:44px; }
.su-fi-t h2 { font-size:18px; font-weight:700; }
.su-fi-x { margin-left:auto; width:44px; height:44px; border-radius:50%; border:1px solid var(--trait); display:inline-flex; align-items:center; justify-content:center; }
.su-fi-w { background:var(--surf); border-radius:8px; padding:8px 10px; font-size:13px; }
.su-fi-ar { display:flex; flex-wrap:wrap; gap:4px 12px; }
.su-fi-l { display:inline-flex; align-items:center; gap:4px; }
.su-fi-src { flex-basis:100%; font-size:12px; color:var(--gris); }
.su-fi-r { flex-basis:100%; display:flex; justify-content:center; }
.su-fi-act { display:flex; justify-content:flex-end; }
.su-fi-g { display:inline-flex; gap:2px; border-radius:22px; padding:2px; border:1px solid var(--trait); }
.su-fi-g button { width:40px; height:40px; border-radius:20px; display:inline-flex; align-items:center; justify-content:center; color:var(--gris); }
.su-fi-g button[aria-pressed="true"] { background:var(--encre); color:#fff; }
`;

// Le code client commun : lentille, légende, fiche à l'appui long (500 ms) ou au survol long (750 ms).
function client() {
  var FICHES = window.SU_FICHES, R = document.getElementById('su-fiche'), ouverte = false, appui = null, avale = 0, survol = null, tFerme = null, lect = [];
  document.querySelectorAll('[data-e]').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('[data-e]').forEach(function (x) { x.setAttribute('aria-checked', String(x.dataset.e === b.dataset.e)); });
      document.body.classList.toggle('abs', b.dataset.e === 'absolu'); lect.forEach(function (f) { f(b.dataset.e); });
    });
  });
  function fermerLeg() { document.querySelectorAll('[data-role=legende]').forEach(function (l) { l.hidden = true; }); document.querySelectorAll('[data-role=legende-bouton]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); }); }
  document.querySelectorAll('[data-role=legende-bouton]').forEach(function (b) {
    b.addEventListener('click', function (e) { e.stopPropagation(); var l = document.getElementById(b.getAttribute('aria-controls')); l.hidden = !l.hidden; b.setAttribute('aria-expanded', String(!l.hidden)); });
  });
  function ouvrir(nom, mode) { var h = FICHES[nom]; if (!h) return; R.className = 'mode-' + mode; R.innerHTML = mode === 'bulle' ? h.split('<div class="su-voile" data-k="voile" aria-hidden="true"></div>').join('') : h; ouverte = true; }
  function fermer() { R.innerHTML = ''; ouverte = false; }
  R.addEventListener('click', function (e) {
    var b = e.target.closest('[data-k]'); if (!b) return;
    if (b.dataset.k === 'fermer' || b.dataset.k === 'voile') { e.stopPropagation(); fermer(); return; }
    if (b.dataset.k === 'aimer' || b.dataset.k === 'exclure') b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'));
  });
  document.addEventListener('click', function (e) { if (performance.now() < avale) { e.stopPropagation(); e.preventDefault(); } }, true);
  function cible(e) { var h = e.target.closest && e.target.closest('[data-houblon],[data-fiche]'); if (!h) return null; return h.getAttribute('data-houblon') || h.getAttribute('data-fiche'); }
  document.addEventListener('pointerdown', function (e) {
    if (R.contains(e.target)) return;
    var nom = cible(e); if (!nom) return;
    var a = { x: e.clientX, y: e.clientY, id: e.pointerId };
    appui = a; a.t = setTimeout(function () { if (appui !== a) return; appui = null; avale = performance.now() + 600; ouvrir(nom, e.pointerType === 'mouse' || innerWidth >= 700 ? 'bulle' : 'feuille'); }, 500);
  }, true);
  document.addEventListener('pointermove', function (e) { if (appui && e.pointerId === appui.id && Math.hypot(e.clientX - appui.x, e.clientY - appui.y) > 10) { clearTimeout(appui.t); appui = null; } }, true);
  document.addEventListener('pointerup', function () { if (appui) { clearTimeout(appui.t); appui = null; } }, true);
  document.addEventListener('pointercancel', function () { if (appui) { clearTimeout(appui.t); appui = null; } }, true);
  document.addEventListener('contextmenu', function (e) { if (e.target.closest && e.target.closest('[data-houblon],[data-fiche]')) e.preventDefault(); });
  document.addEventListener('pointerover', function (e) {
    if (e.pointerType !== 'mouse') return;
    if (R.contains(e.target)) { clearTimeout(tFerme); return; }
    var nom = cible(e); if (!nom || survol) return;
    survol = setTimeout(function () { survol = null; if (!ouverte) ouvrir(nom, 'bulle'); }, 750);
  });
  document.addEventListener('pointerout', function (e) {
    if (e.pointerType !== 'mouse') return;
    var vers = e.relatedTarget, h = e.target.closest && e.target.closest('[data-houblon],[data-fiche]');
    if (h && !(vers && h.contains(vers))) { clearTimeout(survol); survol = null; }
    if (ouverte && R.className === 'mode-bulle' && !(vers && (R.contains(vers) || (vers.closest && vers.closest('[data-houblon],[data-fiche]'))))) { clearTimeout(tFerme); tFerme = setTimeout(fermer, 650); }
  });
  addEventListener('keydown', function (e) { if (e.key !== 'Escape') return; fermerLeg(); if (ouverte) fermer(); });
  document.addEventListener('click', function (e) { if (!e.target.closest('.su-legw')) fermerLeg(); });
  var q = location.search.match(/fiche=([^&]+)/); if (q) ouvrir(decodeURIComponent(q[1]), 'feuille');
  if (/legende=1/.test(location.search)) { var lb = document.querySelector('[data-role=legende-bouton]'); if (lb) lb.click(); }
  window.SU = { surLecture: function (f) { lect.push(f); }, choix: (location.search.match(/choix=([^&]+)/) || [])[1] };
}

/** Une page de concept : { id, nom, chaleur, css, corps, script (fonction), donnees (objet client), houblons (lignes du moteur pour les fiches) }. */
export function page(c) {
  const fiches = { [NUG.nom]: fiche(NUG) };
  for (const r of c.houblons || LISTE) fiches[r.houblon.nom] = fiche(r);
  return '<!doctype html>\n<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">\n'
    + '<title>' + esc(c.id + ' · ' + c.nom) + '</title>\n<style>' + CSS + c.css + '</style></head>\n<body class="' + c.id + '">\n'
    + SYMBOLES + '\n' + c.corps + '\n<div id="su-fiche"></div>\n'
    + '<script>window.SU_FICHES = ' + JSON.stringify(fiches).split('</').join('<\\/') + ';\nwindow.SU_DATA = ' + JSON.stringify(c.donnees || {}).split('</').join('<\\/') + ';\n(' + client.toString() + ')();\n'
    + (c.script ? '(' + c.script.toString() + ')();\n' : '') + '</script>\n</body></html>\n';
}
