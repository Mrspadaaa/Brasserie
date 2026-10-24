// Lot D125 · Substituer · série c (« les vraies valeurs d'abord ») · le vocabulaire commun des huit concepts.
// Question : « Lequel à la place de Nugget ? ». Facteur libre : le remplaçant (L10). En contexte : Nugget 46 g à 60′,
// même IBU (59,7), Stout 16D, US-05. Ce module ne compose aucun écran : il donne les mots (pictos au trait, α, usage,
// stock, barres l5b face au style, la croix, la légende, la vraie fiche à l'appui long) ; chaque concept a sa page.
// Données : donnees-sbc.json (moteur v4 substitutes + hopSheet, parcours lireBiere), jamais recopiées à la main.
// Socle réemployé : fils21-choisir/w1/socle-w.mjs (pictos, icônes, CSS, fiche g1) et fils18-baseline/l8g/noyau.mjs
// (runtime : lentille, appui long). Classes propres préfixées « sbc » (L26) ; code client assemblé par split/join.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as S from '../../../fils21-choisir/w1/socle-w.mjs';
import { runtime } from '../../../fils18-baseline/l8g/noyau.mjs';

export { S };
const ICI = path.dirname(fileURLToPath(import.meta.url));
export const RACINE = path.resolve(ICI, '..', '..');
export const D = JSON.parse(fs.readFileSync(path.join(ICI, 'donnees-sbc.json'), 'utf8'));
export const { esc, ic, pic, COURT, NOM, ORDRE } = S;
export const ACC = '#c2410c';
export const fr = (x, d = 1) => S.fr(x, d);
export const g = (x) => (x == null ? '?' : x >= 10 ? fr(x, 0) : fr(x, 1));

// ---------- les houblons : une couleur chacun, la même sur les huit pages (D83) ----------
export const COUL = {
  Nugget: S.HOP.Nugget.couleur, 'Nelson Sauvin': S.HOP['Nelson Sauvin'].couleur, Galaxy: S.HOP.Galaxy.couleur,
  'Idaho 7': S.HOP['Idaho 7'].couleur, Cascade: S.HOP.Cascade.couleur,
  Magnat: '#0b6e69', Yeoman: '#8a5a00', Altus: '#3d5a99', Trident: '#5c6b00', Zenia: '#7b3f99',
  Sabro: '#1f7a3a', Target: '#2b4c7e', "Falconer's Flight": '#6b3a2a',
};
const BITTER = ['Amertume', 'Début d’ébullition', 'Milieu d’ébullition'], AROMA = ['Ajouts tardifs', 'Houblonnage à cru', 'Arôme', 'Whirlpool', 'Extinction de la chauffe'];
function usageDe(h, alpha) {
  const uses = h.usage || [], roles = uses.flatMap((u) => u.roles || []);
  const b = roles.some((r) => BITTER.includes(r)), a = roles.some((r) => AROMA.includes(r));
  if (b || a) return { v: b && a ? 'double' : b ? 'amérisant' : 'aromatique', src: 'fournisseur', txt: 'fournisseur : ' + (uses.find((u) => (u.roles || []).length) || {}).source };
  if (h.role && h.role.value) return { v: h.role.value, src: /fournisseur/.test(h.role.source) ? 'fournisseur' : 'règle', txt: h.role.source };
  return { v: alpha >= 10 ? 'double' : 'aromatique', src: 'règle', txt: 'règle : règle rôle-α v1 (prototype, à valider)' };
}
const plageA = (a) => { const s = (a && a.sources) || []; return s.length ? [Math.min(...s.map((x) => x.min)), Math.max(...s.map((x) => x.max))] : null; };
// Le stock : celui du moteur (fiches de stock du prototype), pas celui de socle-w (qui lisait proto-data).
for (const [nom, h] of Object.entries(D.hops)) {
  const fiches = plageA(h.alpha), ret = h.alpha && h.alpha.retenu;
  const lot = ret && ret.min === ret.max && !/variétale/.test(ret.from) ? ret.value : null;
  S.HOP[nom] = {
    nom, couleur: COUL[nom], cle: h.key,
    alpha: { lot, lotSource: lot != null ? ret.from : null, fiches, horsFiches: lot != null && fiches && (lot < fiches[0] || lot > fiches[1]), sources: ((h.alpha && h.alpha.sources) || []).map((s) => s.source + ' ' + (s.annee || '')).join(' ; ') },
    usage: usageDe(h, lot ?? (fiches ? (fiches[0] + fiches[1]) / 2 : 0)),
    stock: h.stock || 0, cryo: null,
    pack: { ...h, name: nom, origin: h.origine, huiles: { totale: h.huile, composants: h.composants }, motsSansFamille: h.sans, descripteurs: h.desc },
  };
}
// La fiche g1 (l8g) de chaque houblon nommé, au format du runtime (même construction que socle-w.ficheDe).
const uniq = (xs) => { const vu = new Set(); return xs.filter((w) => { const k = w.toLowerCase(); if (vu.has(k)) return false; vu.add(k); return true; }).map((w) => w.toLowerCase()); };
const NOMS_H = { myrcene: 'myrcène', humulene: 'humulène', caryophyllene: 'caryophyllène', farnesene: 'farnésène', linalool: 'linalol' };
const ps = (s) => ({ src: s.source, an: s.annee ?? null, min: s.min, max: s.max });
for (const nom of Object.keys(D.hops)) {
  const h = S.HOP[nom], f = h.pack, comp = f.composants || {};
  S.FICHES[nom] = {
    nom, role: { v: h.usage.v, src: h.usage.src, txt: h.usage.txt.replace(/^[^:]+ : /, '') }, voie: null, stock: h.stock > 0 ? 'suffisant' : 'à acheter', ajout: null,
    alphaC1: { lot: h.alpha.lot, lotSource: h.alpha.lotSource, fiches: h.alpha.fiches, horsFiches: h.alpha.horsFiches },
    origine: f.origine || null, alpha: ((f.alpha && f.alpha.sources) || []).map(ps), lot: h.alpha.lot,
    beta: ((f.beta && f.beta.sources) || []).map(ps), huiles: ((f.huile && f.huile.sources) || []).map(ps),
    composants: Object.entries(NOMS_H).map(([k, n]) => (comp[k] ? { nom: n, min: comp[k].min, max: comp[k].max, src: comp[k].source } : { nom: n, raison: k === 'farnesene' ? 'Publié par Beer Maverick, non importé dans le dépôt.' : 'non publié dans nos fiches' })),
    aromes: (f.aromes || []).filter((a) => a.sources > 0).map((a) => ({ f: a.family, n: a.sources, of: a.of, auteurs: a.authors || [], mots: uniq((a.mots || []).flatMap((m) => m.mots)), premier: a.sources === 1 && (a.premier || []).length > 0 })),
    of: ((f.aromes || [])[0] || {}).of || 0, sans: uniq((f.sans || []).map((s) => s.mot)),
    styles: (f.usage || []).flatMap((u) => u.styles || []), stylesSrc: (f.usage || []).map((u) => u.source).filter(Boolean), stylesRaison: f.usageRaison || null,
    desc: (f.desc && f.desc.beerMaverick) || [], subs: [], subsRaison: 'remplaçants : cet écran',
  };
}
export const HOP = S.HOP;
export const nomH = (nom, cls = '') => S.nomH(nom, cls);
export const alpha = (nom, o) => S.alpha(nom, o);
export const usage = (nom) => S.usage(nom);
export const stock = (nom, grammes) => S.stock(nom, Math.round(grammes));
export const hop = (nom, o = {}) => S.hop(nom, o);

// ---------- le cas ----------
export const M = D.moments.b60, MWP = D.moments.wp;
export const REF = M.reference; // 46 g à 60′, 59,73 IBU
export const IBU = fr(REF.ibu, 1);
export const sub = (nom, m = M) => m.par[nom];
// Les huit remplaçants que la série montre à 60′ : les cinq premiers du moteur, puis le stock d'abord.
export const CANDS = ['Magnat', 'Yeoman', 'Altus', 'Trident', 'Zenia', 'Nelson Sauvin', 'Galaxy', 'Sabro'];
export const EN_STOCK = ['Nelson Sauvin', 'Galaxy', 'Sabro', 'Idaho 7', 'Target'];
// La dose au même IBU : « ~ » (modèle d'IBU) ; à masse égale à froid.
export const dose = (nom, m = M) => { const d = sub(nom, m).dose; return { g: d.grams, min: d.min, max: d.max, txt: '~' + g(d.grams) + ' g', plage: d.min === d.max ? null : g(d.min) + '–' + g(d.max) + ' g', regle: d.regle }; };
// Plage de score quand une composante est inconnue : la composante ouverte de 0 à 100 avec les poids du moment
// (calcul de la page, repris de u4 ; le moteur renormalise sur les composantes connues).
export function plageScore(nom, m = M) {
  const s = sub(nom, m), w = m.poids, c = s.composantes;
  const inc = Object.keys(w).filter((k) => c[k] == null);
  if (!inc.length) return { bas: s.score, haut: s.score, inc };
  const somme = (x) => Object.keys(w).reduce((t, k) => t + w[k] * (c[k] ?? x), 0);
  return { bas: Math.round(somme(0)), haut: Math.round(somme(100)), inc };
}
export const MOTS_COMP = { arome: 'arôme', huiles: 'huiles', amertume: 'amertume' };
export const OILS = [['myrcene', 'myrcène', 'resin'], ['humulene', 'humulène', 'herbal'], ['caryophyllene', 'caryophyllène', 'spice'], ['linalool', 'linalol', 'floral']];
export const srcCourt = (s) => (s || '').replace('Beer Maverick', 'BM').replace('Hopsteiner', 'HS').replace(/\s*\(boutique US\)/, '');
export const plageTxt = (a, b, u = '') => (a === b ? fr(a) : fr(a) + '–' + fr(b)) + u;

// ---------- ma bière après le remplacement : barres l5b face à la zone de la 16D ----------
export const FAM_BIERE = ['floral', 'herbal', 'earthy', 'citrus', 'tropical', 'resin', 'spice', 'green', 'stoneFruit', 'pomeFruit', 'berries', 'melon'];
export const biere = (nom, m = 'b60') => (nom ? D.biere[m].apres[nom] : D.biere[m].avant);
// Les barres, rendues pour un houblon ; la page les redessine au choix (SBC.majBiere).
export function barres(P, nom, o = {}) {
  const fams = o.familles || FAM_BIERE.slice(0, 8);
  return `<div class="${P}-bars sbc-bars" data-role="profil" data-biere="${esc(nom)}" data-m="${o.m || 'b60'}">${fams.map((f) => `<div class="sbc-ba" data-f="${f}" data-famille="${f}"><span class="sbc-ban">${pic(f, o.z || 16)}${o.noms === false ? '' : `<span>${COURT[f]}</span>`}</span><span class="sbc-pis"><i class="sbc-zo" data-role="zone"></i><i class="sbc-re"></i><i class="sbc-hc" hidden></i><i class="sbc-av"></i></span><span class="sbc-bav mono" data-nature="simule"></span></div>`).join('')}</div>`;
}
export const CSS_BARRES = `
  .sbc-bars { display: flex; flex-direction: column; gap: 3px; }
  .sbc-ba { display: grid; grid-template-columns: 86px 1fr 40px; align-items: center; gap: 6px; font-size: 13px; min-height: 18px; }
  .sbc-ban { display: flex; align-items: center; gap: 4px; font-weight: 600; white-space: nowrap; }
  .sbc-pis { position: relative; height: 12px; background: #f3f3f6; border-radius: 2px; overflow: hidden; }
  .sbc-pis i { position: absolute; top: 0; bottom: 0; left: 0; display: block; }
  .sbc-zo { width: 50%; background: #dcdce4; }
  body.abs .sbc-zo { width: var(--za, 27%); }
  .sbc-re { width: var(--ws, 0%); background: var(--b); height: 6px; top: 3px !important; border-radius: 0 2px 2px 0; transition: width .2s; }
  body.abs .sbc-re { width: var(--wa, 0%); }
  .sbc-ba.hors .sbc-re { background: ${ACC}; }
  .sbc-av { left: clamp(4px, var(--as, 0%), calc(100% - 4px)) !important; width: 8px; height: 8px; top: 2px !important; margin-left: -4px; border-radius: 50%; border: 2px solid var(--encre); background: #fff; }
  body.abs .sbc-av { left: clamp(4px, var(--aa, 0%), calc(100% - 4px)) !important; }
  .sbc-hc { right: 0; background: repeating-linear-gradient(135deg, #c9cdd6 0 2px, transparent 2px 6px); }
  .sbc-ba.inc .sbc-av { display: none; }
  .sbc-bav { text-align: right; font-size: 12px; }
  .sbc-ba.hors .sbc-bav { color: ${ACC}; }`;
const JET = S.JET;
export const JS_BARRES = `
SBC.majBiere = function (root, nom) {
  const m = root.dataset.m || 'b60', B = SBC.biere[m], ap = (nom ? B.apres[nom] : B.avant).profil, av = B.avant.profil;
  root.dataset.biere = nom || '';
  root.querySelectorAll('[data-f]').forEach(function (r) {
    const f = r.dataset.f, x = ap[f], a = av[f], s = r.style, hi = x.bande[1];
    r.style.setProperty('--b', SBC.jet[f]);
    s.setProperty('--za', (hi / 110 * 100) + '%');
    const inc = !x.v; r.classList.toggle('inc', inc);
    r.querySelector('.sbc-hc').hidden = !inc; r.querySelector('.sbc-re').hidden = inc;
    const v = r.querySelector('.sbc-bav');
    if (inc) { v.textContent = '?'; r.classList.remove('hors'); r.setAttribute('aria-label', SBC.nom[f] + ' : inconnu, pas zéro'); return; }
    s.setProperty('--ws', Math.min(100, x.v.centre / hi * 50) + '%'); s.setProperty('--wa', Math.min(100, x.v.centre / 110 * 100) + '%');
    if (a.v) { s.setProperty('--as', Math.min(100, a.v.centre / hi * 50) + '%'); s.setProperty('--aa', Math.min(100, a.v.centre / 110 * 100) + '%'); }
    const d = a.v ? x.v.centre - a.v.centre : 0;
    v.textContent = !nom ? '' : Math.abs(d) < 0.5 ? '=' : '~' + (d > 0 ? '+' : '−') + Math.round(Math.abs(d));
    r.classList.toggle('hors', !!x.hors);
    r.setAttribute('aria-label', SBC.nom[f] + ' : ~' + Math.round(x.v.centre) + (x.hors ? ', hors de ta 16D' : ', dans ta 16D'));
  });
};
document.querySelectorAll('[data-biere]').forEach(function (r) { SBC.majBiere(r, r.dataset.biere); });`;

// ---------- en-tête : la croix (D109), la légende derrière « ? » (D89), la lentille (D75) ----------
export const croix = () => `<a class="sbc-x" href="#" data-role="fermer" aria-label="Fermer, retour à l'étape Houblons">${ic('x', 20)}</a>`;
export const legB = () => `<button type="button" class="leg-b" data-role="legende-bouton" aria-expanded="false" aria-controls="legende" aria-label="Légende">?</button>`;
export const lentille = (cls = '') => `<span class="seg lentille sbc-lent ${cls}" role="radiogroup" aria-label="Lecture au style ou absolue"><button role="radio" type="button" data-e="style" aria-checked="true">Au style</button><button role="radio" type="button" data-e="absolu" aria-checked="false">Absolu</button></span>`;
export const CSS_BASE = `
  html, body { background: #fff; }
  .ecran { gap: 8px; padding: 2px 12px 18px; }
  .sbc-x { width: 44px; height: 44px; margin-left: -10px; display: inline-flex; align-items: center; justify-content: center; color: #111; flex: none; border-radius: 50%; }
  .sbc-lent { box-shadow: inset 0 0 0 1px #d4d4dc; border-radius: 999px; padding: 2px; }
  .sbc-lent button { border-radius: 999px; height: 24px; color: #5b5b66; }
  .sbc-lent button[aria-checked="true"] { background: #16161a; color: #fff; font-weight: 600; }
  .sbc-sim { font-family: var(--mono); }
  .sbc-ital { font-style: italic; color: #5b5b66; }
  .sbc-act { display: flex; align-items: center; justify-content: center; gap: 6px; height: 44px; border-radius: 999px; background: #16161a; color: #fff !important; font-weight: 700; font-size: 15px; padding: 0 18px; }
  ${CSS_BARRES}`;

// ---------- la légende (derrière « ? ») ----------
export function legende(extra = '') {
  return `<div class="w-voile" data-role="legende-voile" hidden></div><section class="w-leg" id="legende" data-role="legende" role="dialog" aria-label="Légende" hidden>
  <div class="w-f-t"><b>Légende</b><button type="button" data-role="legende-fermer" aria-label="Fermer la légende">${ic('x', 18)}</button></div>
  <div class="w-leg-s"><h3>Les familles</h3><div class="w-leg-g">${ORDRE.map((f) => `<span class="w-leg-i">${pic(f, 18)}${COURT[f]}</span>`).join('')}</div></div>
  <div class="w-leg-s"><h3>Les mots</h3><div class="w-leg-g l2">
    <span class="w-leg-i"><b class="mono">~</b>calculé par le moteur (IBU, profil simulé), pas une mesure</span>
    <span class="w-leg-i"><i class="w-hach" aria-hidden="true"></i>inconnu : aucune fiche ne le dit, jamais zéro</span>
    <span class="w-leg-i"><span class="al lot">9,6%${ic('diff', 12)}</span>α du lot ; ≠ hors des plages de ses fiches</span>
    <span class="w-leg-i"><span class="al fi">${ic('livre', 12)}10–14%</span>α des fiches (Beer Maverick, Hopsteiner)</span>
    <span class="w-leg-i">${ic('main', 16)}appui long sur un houblon : sa fiche</span>
    <span class="w-leg-i">barre de ma bière : ~ après le remplacement ; rond : avec Nugget ; zone pâle : ta 16D ; orangé : hors du style</span></div></div>
  ${extra}
</section>`;
}

// ---------- la page ----------
export function page({ id, chaleur, idee, corps, css = '', js = '', legendeExtra = '', feuilles = '' }) {
  const rt = runtime({ extra: '' })
    .split(/const FD = [^\n]*;\nconst ROUE/).join('const FD = ' + JSON.stringify(S.FICHES) + ';\nconst ROUE')
    .split(/DEMANDE = \[[^\]]*\]/).join('DEMANDE = ' + JSON.stringify([{ f: 'floral', s: 1 }, { f: 'resin', s: -1 }]));
  if (!rt.includes('"Magnat"')) throw new Error('fiche : FD non remplacé');
  const SBC = { biere: D.biere, jet: Object.fromEntries(ORDRE.map((f) => [f, JET[f].base])), nom: COURT };
  const SIM = { B: S.BANDE, C: S.CRAN, NOM, AV: S.D.AVANT };
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${id} · Substituer · Lequel à la place de Nugget ?</title>
<!-- Lot D125 · Substituer · série c (les vraies valeurs d'abord) · ${id} · chaleur ${chaleur} · ${idee} -->
${S.POLICES}
<style>${S.CSS}
${CSS_BASE}
${css}</style>
</head>
<body>
${S.SYMB}
<main class="ecran">${corps}
</main>
${legende(legendeExtra)}
<div class="w-voile" data-role="feuille-voile" hidden></div><div class="w-feuille" role="dialog" aria-label="Détail"></div>
${feuilles}
<script>const SIM = ${JSON.stringify(SIM)};
const SBC = ${JSON.stringify(SBC)};
${S.JS_COMMUN}
${JS_BARRES}
document.querySelectorAll('[data-role="fermer"]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); }); });
${js}</script>
<script>${rt}</script>
</body>
</html>
`;
}
export const ecrire = (f, s) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, s); console.log('écrit ' + path.relative(process.cwd(), f) + ' (' + Math.round(s.length / 1024) + ' Ko)'); };
// Choix d'un remplaçant au toucher : [data-choix="<nom>"] ; la page appelle window.choisir(nom). ?choix=<nom> pour les captures.
export const JS_CHOIX = (defaut) => `
(function () {
  document.addEventListener('click', function (e) { const c = e.target.closest('[data-choix]'); if (!c || e.defaultPrevented) return; window.choisir && window.choisir(c.dataset.choix); });
  const q = new URLSearchParams(location.search).get('choix');
  window.choisir && window.choisir(q || ${JSON.stringify(defaut)});
})();`;

// ---------- vraies valeurs : plages des fiches (union des sources), et leurs sources ----------
export function plage(nom, quoi) {
  const h = D.hops[nom];
  if (quoi === 'alpha' || quoi === 'beta' || quoi === 'huile') {
    const o = quoi === 'huile' ? h.huile : h[quoi], s = (o && o.sources) || [];
    if (!s.length) return null;
    return { min: Math.min(...s.map((x) => x.min)), max: Math.max(...s.map((x) => x.max)), src: s.map((x) => srcCourt(x.source) + ' ' + String(x.annee || '').slice(2)).join(' · '), n: s.length, sources: s };
  }
  const c = h.composants[quoi];
  return c ? { min: c.min, max: c.max, src: srcCourt(c.source) + ' ' + String(c.annee || '').slice(2), n: 1, sources: [c] } : null;
}
// Recouvre, proche, plus haut, plus bas, inconnu : face à la plage de Nugget (lecture de la page, sur les plages publiées).
export function face(nom, quoi) {
  const a = plage('Nugget', quoi), b = plage(nom, quoi);
  if (!a || !b) return { k: 'inc', mot: '?' };
  if (b.max >= a.min && b.min <= a.max) return { k: 'rec', mot: 'recouvre' };
  const gap = b.min > a.max ? b.min - a.max : a.min - b.max, mid = (a.min + a.max) / 2;
  const sens = b.min > a.max ? 'plus haut' : 'plus bas';
  return { k: gap / mid < 0.25 ? 'pro' : 'eca', mot: sens, gap };
}
export const MOTS_VAL = { alpha: 'α', beta: 'β', huile: 'huile', myrcene: 'myrcène', humulene: 'humulène', caryophyllene: 'caryophyllène', linalool: 'linalol' };
export const UNITE = { alpha: ' %', beta: ' %', huile: ' mL/100 g', myrcene: ' %', humulene: ' %', caryophyllene: ' %', linalool: ' %' };
export const familles = (nom) => (D.hops[nom].aromes || []).filter((a) => a.level > 0).sort((x, y) => y.level - x.level || y.sources - x.sources).map((a) => a.family);
export const motsFiche = (nom, f) => { const a = (D.hops[nom].aromes || []).find((x) => x.family === f); return a ? [...new Set(a.mots.flatMap((m) => m.mots.map((w) => w.toLowerCase())))] : []; };
export const sansFamille = (nom) => [...new Set((D.hops[nom].sans || []).map((s) => s.mot.toLowerCase()))];
