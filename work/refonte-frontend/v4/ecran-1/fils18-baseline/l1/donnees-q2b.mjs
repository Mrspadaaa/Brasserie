// Lot 18 · le socle commun de l1 (Cave) et l2 (Carnet) : les données de q2b (donnees/c1.json du lot 15),
// les fiches g1 des houblons (pack-fiches.json, comme base/generateur/build.mjs : ficheH), la roue « N/M »
// (comme RADAR.roue de la base), le jeu d'icônes v3 duo (fils17-standard/v3) et le geste de la fiche
// (appui long 500 ms, survol 750 ms, Échap ; comme base/generateur/fiche.js). Aucun chiffre recopié à la
// main : tout vient des JSON ; la page ne fait que des mises à l'échelle (crans, points) comme q2b.
import fs from 'node:fs';
import path from 'node:path';

export const REPO = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie';
export const V4 = REPO + '/work/refonte-frontend/v4';
const lire = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
export const C = lire(V4 + '/ecran-1/fils15-s5-complexe/donnees/c1.json');
export const PACK = lire(REPO + '/prototypes/houblons-v4/data/pack-mini-protos.json');
const FICHES = lire(REPO + '/prototypes/houblons-v4/data/pack-fiches.json').fichesHoublons;
const VARIETES = lire(REPO + '/prototypes/houblons-v4/data/proto-data.json').varieties;
export const JET = lire(V4 + '/ecran-1/fils17-standard/jetons-familles.json');
export const ecrire = (f, s) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, s); console.log('écrit ' + f.replace(V4, 'v4') + ' (' + s.length + ' o)'); };

// ---------- familles ----------
export const ORDRE = ['floral', 'herbal', 'earthy', 'citrus', 'tropical', 'stoneFruit', 'pomeFruit', 'berries', 'melon', 'resin', 'spice', 'green'];
export const ORDRE_STYLE = PACK.styles['16D'].order;
export const ATTENDUES = ORDRE_STYLE.filter((f) => PACK.styles['16D'].families[f].status === 'attendue');
export const ROUE = PACK.roueAromes.map((r) => r.id);
export const NOM = { citrus: 'Agrumes', tropical: 'Fruits tropicaux', melon: 'Melon', stoneFruit: 'Fruits à noyau', pomeFruit: 'Fruits à pépins', berries: 'Petits fruits', floral: 'Floral', herbal: 'Herbacé', resin: 'Boisé et résineux', spice: 'Épicé', green: 'Végétal', earthy: 'Terreux' };
export const COURT = { floral: 'Floral', herbal: 'Herbacé', earthy: 'Terreux', citrus: 'Agrumes', tropical: 'Tropicaux', stoneFruit: 'Noyau', pomeFruit: 'Pépins', berries: 'Baies', melon: 'Melon', resin: 'Résineux', spice: 'Épicé', green: 'Végétal' };
export const BASE = Object.fromEntries(Object.entries(JET).map(([f, j]) => [f, j.base]));
export const OBJ = ['floral', 'citrus', 'resin'];
export const OB = Object.fromEntries(C.objectifs.map((o) => [o.famille, o]));
export const ALERTE = '#c2410c';

// ---------- contrastes (WCAG 2) ----------
const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
export const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export const hex = (a) => '#' + a.map((x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0')).join('');
export const lum = (h) => { const [r, g, b] = rgb(h).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
export const contraste = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((u, v) => v - u); return (x + 0.05) / (y + 0.05); };
export const melange = (a, b, t) => hex(rgb(a).map((x, i) => x + (rgb(b)[i] - x) * t));
export const sur = (fg, alpha, bg) => melange(bg, fg, alpha);
export const rgba = (h, a) => 'rgba(' + rgb(h).join(',') + ',' + a + ')';

// ---------- c1 : bandes, repères, mises à l'échelle (comme q2b) ----------
const BANDE = {}, AVANT = {};
for (const v of C.voies) for (const t of v.tout) { BANDE[t.famille] = t.bande; if (t.avant != null) AVANT[t.famille] = t.avant; }
export const bande = (f) => BANDE[f] || [0, 30];
export const cran = (f) => (OB[f] ? OB[f].cran : bande(f)[1] === 55 ? 18.3 : 10);
export const DEG = PACK.scenarios.S1.tasting.axes.find((x) => x.family === 'resin').perceivedRange;
export const r1 = (x) => Math.round(x * 10) / 10;
export const p = (x) => r1(x) + '%';
export const fr = (x) => String(r1(x)).replace('.', ',').replace('-', '−');
export const sg = (x) => (x > 0 ? '+' : '') + fr(x);
export const cl = (x) => Math.max(0, Math.min(100, x));
export const crTxt = (c) => (c > 0 ? '+' : '') + fr(c) + ' cran' + (Math.abs(c) >= 2 ? 's' : '');
export function zone(f) {
  if (f === 'resin') return null;
  const a = AVANT[f]; if (a == null) return undefined;
  const [b0, b1] = bande(f), c = cran(f);
  const rS0 = (b1 - a) / c / 3 * 100, lS0 = (a - b0) / c / 3 * 100, rA0 = (b1 - a) / 50 * 100, lA0 = (a - b0) / 50 * 100;
  return { rS: cl(rS0), lS: cl(lS0), rA: cl(rA0), lA: cl(lA0), rS0, lS0, rA0, lA0 };
}
export const viseeS = (f) => (OB[f].visee - OB[f].maBiere.central) / OB[f].cran / 3 * 100;
export const viseeA = (f) => (OB[f].visee - OB[f].maBiere.central) / 50 * 100;
export function niv(v, f, e) {
  if (e < 0) return 'sf';
  let best = null;
  for (const h of v.fiches || []) for (const x of h.familles) if (x.famille === f) best = x.niveau === 'marqué' ? 'mq' : best || 'ci';
  return best || 'sf';
}
export const NIVMOT = { mq: 'marqué dans ses fiches', ci: 'cité par une fiche', sf: 'sans fiche (modèle seul)' };
export const V = C.voies.map((v, i) => ({ n: i + 1, v, extras: v.tout.filter((t) => !t.visee && Math.abs(t.effet) >= 0.5).sort((a, b) => ORDRE.indexOf(a.famille) - ORDRE.indexOf(b.famille)), hs: new Set((v.horsStyle || []).map((x) => x.family)) }));
export const nomVoie = (v) => {
  if (v.levureVers) return { nom: v.levureVers, q: '' };
  if (v.type === 'assemblage') return { nom: v.actions.map((a) => a.houblon).join(' + '), q: '' };
  if (v.type.startsWith('remplacer') || v.type === 'levure') return { nom: v.actions[0].houblon, q: v.actions[0].grammes + ' g' };
  return { nom: v.actions[0].houblon, q: '' };
};
export const momentDe = (v) => (v.levureVers ? 'levure' : v.actions[0].momentId);
export function pctBar(f, e) {
  const s = Math.abs(e) / cran(f) / 3 * 100, a = Math.abs(e) / 50 * 100;
  return { s: Math.min(s, 100), a: Math.min(a, 100), ds: s > 100, da: a > 100 };
}
export const crOf = (X, f) => { const t = X.v.tout.find((x) => x.famille === f); return t && t.crans != null ? t.crans : null; };
export const arr = (c) => (Math.abs(c) < 0.5 ? (c < 0 ? '≈ −' : '≈ +') : (c > 0 ? '+' : '−') + Math.round(Math.abs(c)) + (Math.round(Math.abs(c)) >= 2 ? ' crans' : ' cran'));
export const crans = (c) => (Math.abs(c) < 0.5 ? 0 : Math.min(4, Math.round(Math.abs(c))));
function meilleure(f, sens) {
  const c = V.filter((X) => X.v.effet[f].etabli && !X.hs.size);
  return c.length ? c.reduce((b, X) => ((sens > 0 ? X.v.effet[f].central > b.v.effet[f].central : X.v.effet[f].central < b.v.effet[f].central) ? X : b)) : null;
}
// Les réponses aux trois objectifs, comme q2b : la meilleure voie sans débord de style, son verdict.
export function reponses() {
  const fl = meilleure('floral', 1), ci = meilleure('citrus', 1), re = meilleure('resin', -1);
  const vFl = OB.floral.maBiere.central + fl.v.effet.floral.central, vCi = OB.citrus.maBiere.central + ci.v.effet.citrus.central;
  const verd = (f, v) => (v >= OB[f].visee ? 'atteint' : Math.abs(v - OB[f].visee) <= Math.abs(OB[f].maBiere.central - OB[f].visee) / 2 ? 'approche' : 'aucune');
  return {
    resin: { verdict: DEG.min + re.v.effet.resin.central <= OB.resin.visee ? 'atteint' : 'aucune' },
    floral: { verdict: verd('floral', vFl), voie: nomVoie(fl.v).nom, avant: OB.floral.maBiere.central, apres: vFl, visee: OB.floral.visee, frac: fl.v.effet.floral.central / OB.floral.cran },
    citrus: { verdict: verd('citrus', vCi), voie: nomVoie(ci.v).nom, avant: OB.citrus.maBiere.central, apres: vCi, visee: OB.citrus.visee, frac: ci.v.effet.citrus.central / OB.citrus.cran },
  };
}
export const MOT_VERDICT = { atteint: 'Atteint', approche: 'Approche', aucune: 'Aucune' };
// Les groupes de q2b : les voies au même effet sur les objectifs, puis les autres gestes.
export function groupes() {
  const ge = [];
  for (const X of V) { const k = JSON.stringify(X.v.effet); const g = ge.find((x) => x.k === k); if (g) g.voies.push(X); else ge.push({ k, voies: [X] }); }
  const seuls = new Set(ge.filter((g) => g.voies.length === 1).map((g) => g.voies[0].n));
  const slotsDe = (xs) => ORDRE.filter((f) => !OBJ.includes(f) && xs.some((X) => X.extras.some((t) => t.famille === f)));
  const sig = (X) => X.extras.map((t) => t.famille).join();
  const memes = ge.filter((g) => g.voies.length > 1).map((g) => {
    const ord = []; for (const X of g.voies) if (!ord.includes(X)) ord.push(...g.voies.filter((Y) => sig(Y) === sig(X) && !ord.includes(Y)));
    return { voies: ord, coupe: ord.map((X, i) => i > 0 && sig(ord[i - 1]) !== sig(X)), slots: slotsDe(g.voies), dose: g.voies[0].v.actions[0].grammes + ' g', moment: momentDe(g.voies[0].v), tete: g.voies[0] };
  });
  const gestes = [
    { t: 'Assembler 5 + 5 g', ic: 'arome', mo: 'b10', est: true, voies: [6, 8] },
    { t: 'Remplacer Nugget', ic: 'goutte', mo: 'b60', voies: [12, 13, 14] },
    { t: 'Dry hop', ic: 'arome', mo: 'dryActive', est: true, voies: [15] },
    { t: 'Changer de levure', ic: '', mo: 'levure', est: true, voies: [16, 17] },
  ].map((g) => ({ ...g, voies: g.voies.filter((n) => seuls.has(n)).map((n) => V[n - 1]) })).filter((g) => g.voies.length).map((g) => ({ ...g, slots: slotsDe(g.voies) }));
  return { memes, gestes };
}
export const AJOUTEES = [1, 15];

// ---------- icônes : le jeu v3 duo (fils17-standard/v3/planche.html) ----------
// Pictos des familles : le dessin v3, sans couleur dans le symbole ; la page pose le trait (stroke) sur le
// svg, selon son langage. 2,571 sur 24 = 1,5 px rendu à 14 px. Actions : lucide-react 1.39.0, 1,5 px rendu.
export const PICTOS = {
  citrus: '<circle cx="12" cy="12" r="9.5"/><path d="M12 5.5v13M6.4 8.75l11.2 6.5M6.4 15.25l11.2-6.5"/>',
  tropical: '<path d="M12 8.5 9.5 3.5M12 8.5V2.5M12 8.5l2.5-5"/><ellipse cx="12" cy="15.5" rx="5.5" ry="6.5"/><path d="M9 13l6 5M15 13l-6 5"/>',
  melon: '<path d="M2.5 9h19a9.5 9.5 0 0 1-19 0Z"/><path d="M6.5 9a5.5 5.5 0 0 0 11 0"/><path d="M10 11.5h.01M14 11.5h.01"/>',
  stoneFruit: '<circle cx="12" cy="14" r="8"/><path d="M12 6c-2.5 3.5-2.5 12 0 16"/><path d="M12 6c1-2.5 4-3.2 6-2.2-1.5 2-3.5 2.6-6 2.2Z"/>',
  pomeFruit: '<path d="M12 6.528V3a1 1 0 0 1 1-1h0"/><path d="M18.237 21A15 15 0 0 0 22 11a6 6 0 0 0-10-4.472A6 6 0 0 0 2 11a15.1 15.1 0 0 0 3.763 10 3 3 0 0 0 3.648.648 5.5 5.5 0 0 1 5.178 0A3 3 0 0 0 18.237 21"/>',
  berries: '<circle cx="7.6" cy="11" r="4"/><circle cx="16.4" cy="11" r="4"/><circle cx="12" cy="18.6" r="4"/><path d="M12 7V4c0-1 .8-1.6 2-1.6"/>',
  floral: '<circle cx="12" cy="12" r="3"/><path d="M12 16.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 1 1 4.5 4.5 4.5 4.5 0 1 1-4.5 4.5"/><path d="M12 7.5V9"/><path d="M7.5 12H9"/><path d="M16.5 12H15"/><path d="M12 16.5V15"/><path d="m8 8 1.88 1.88"/><path d="M14.12 9.88 16 8"/><path d="m8 16 1.88-1.88"/><path d="M14.12 14.12 16 16"/>',
  herbal: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
  resin: '<path d="m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2A1 1 0 0 1 8 7.3L12 3l4 4.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.7 1.7H17Z"/><path d="M12 22v-3"/>',
  spice: '<circle cx="7" cy="6.5" r="2.6"/><circle cx="16.5" cy="6" r="2.6"/><circle cx="11.6" cy="13" r="2.6"/><circle cx="5.4" cy="18" r="2.6"/><circle cx="18" cy="18" r="2.6"/>',
  green: '<path d="M6.5 21c-.5-5.5-2-10-4-14"/><path d="M12 21V3"/><path d="M17.5 21c.5-5.5 2-10 4-14"/>',
  earthy: '<path d="M2 20c2-7 5.5-9.5 8.5-7 2.5-5 8.5-5.5 11.5 7Z"/><path d="M8.5 17.5h.01M14 16h.01"/>',
};
// i-* : 16 px (2,25 sur 24) ; j-* : 14 px (2,571 sur 24) ; même trait rendu, 1,5 px.
const I16 = {
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  'chev-r': '<path d="m9 18 6-6-6-6"/>',
  'chev-l': '<path d="m15 18-6-6 6-6"/>',
  'chev-b': '<path d="m6 9 6 6 6-6"/>',
  coeur: '<path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/>',
  ban: '<circle cx="12" cy="12" r="10"/><path d="M4.929 4.929 19.07 19.071"/>',
  case: '<rect width="18" height="18" x="3" y="3" rx="2"/>',
  'case-ok': '<path d="M21 10.656V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12.344"/><path d="m9 11 3 3L22 4"/>',
};
const J14 = {
  barres: '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><rect x="7" y="13" width="9" height="4" rx="1"/><rect x="7" y="5" width="12" height="4" rx="1"/>',
  radar: '<path d="M19.07 4.93A10 10 0 0 0 6.99 3.34"/><path d="M4 6h.01"/><path d="M2.29 9.62A10 10 0 1 0 21.31 8.35"/><path d="M16.24 7.76A6 6 0 1 0 8.23 16.67"/><path d="M12 18h.01"/><path d="M17.99 11.66A6 6 0 0 1 15.77 16.67"/><circle cx="12" cy="12" r="2"/><path d="m13.41 10.59 5.66-5.66"/>',
  goutte: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
  arome: '<path d="M12.8 19.6A2 2 0 1 0 14 16H2"/><path d="M17.5 8a2.5 2.5 0 1 1 2 4H2"/><path d="M9.8 4.4A2 2 0 1 1 11 8H2"/>',
  stock: '<path d="M12 22V12"/><path d="m16 17 2 2 4-4"/><path d="M21 11.127V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.729l7 4a2 2 0 0 0 2 .001l1.32-.753"/><path d="M3.29 7 12 12l8.71-5"/><path d="m7.5 4.27 8.997 5.148"/>',
  manque: '<path d="M12 22V12"/><path d="M16 17h6"/><path d="M21 13V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.729l7 4a2 2 0 0 0 2 .001l1.675-.955"/><path d="M3.29 7 12 12l8.71-5"/><path d="m7.5 4.27 8.997 5.148"/>',
  achat: '<path d="m2.05 2.05 1.099-.028a1 1 0 0 1 1.008.815l2.69 14.347A1 1 0 0 0 7.83 18H18"/><path d="M4.563 5h16.435a1 1 0 0 1 .981 1.204l-1.026 6.226A2 2 0 0 1 18.962 14H6.25"/><circle cx="18" cy="20" r="2"/><circle cx="8" cy="20" r="2"/>',
  ebu: '<path d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4"/>',
  whirl: '<path d="M21 4H3"/><path d="M18 8H6"/><path d="M19 12H9"/><path d="M16 16h-6"/><path d="M11 20H9"/>',
  'cuve-a': '<path d="M5 2h14v10l-7 8-7-8Z"/><path d="M12 20v2"/><circle cx="9.5" cy="7" r="1.5"/><circle cx="14.5" cy="10" r="1.2"/>',
  'cuve-p': '<path d="M5 2h14v10l-7 8-7-8Z"/><path d="M12 20v2"/><path d="M8.5 8h7"/>',
  levure: '<circle cx="10" cy="14" r="7"/><circle cx="17.6" cy="6.4" r="3.6"/><circle cx="9" cy="15" r="1.6"/>',
  egal: '<path d="M5 9h14"/><path d="M5 15h14"/>',
  fleche: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
  bulles: '<circle cx="8" cy="16" r="4"/><circle cx="16" cy="11" r="3"/><circle cx="10" cy="6" r="2"/><path d="M19 7V2m-2.5 2.5L19 2l2.5 2.5"/>',
};
export function sprite(extra = '') {
  const sym = (id, vb, sw, d) => `<symbol id="${id}" viewBox="0 0 24 24" fill="none" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${d}</symbol>`;
  return `<svg width="0" height="0" style="position:absolute" aria-hidden="true">${extra}
  ${Object.entries(PICTOS).map(([f, d]) => sym('p-' + f, 0, 2.571, d)).join('\n  ')}
  ${Object.entries(I16).map(([k, d]) => sym('i-' + k, 0, 2.25, d).replace('<symbol', '<symbol stroke="currentColor"')).join('\n  ')}
  ${Object.entries(J14).map(([k, d]) => sym('j-' + k, 0, 2.571, d).replace('<symbol', '<symbol stroke="currentColor"')).join('\n  ')}
</svg>`;
}
export const ic = (k, label) => `<svg class="ic" width="16" height="16"${label ? ` role="img" aria-label="${label}"` : ' aria-hidden="true"'}><use href="#i-${k}"/></svg>`;
export const jc = (k, label) => `<svg class="jc" width="14" height="14"${label ? ` role="img" aria-label="${label}"` : ' aria-hidden="true"'}><use href="#j-${k}"/></svg>`;
export const MOMENT = { b60: ['60′', 'ebu', 'à 60′'], b10: ['10′', 'ebu', 'à 10′'], wp: ['whirlpool', 'whirl', 'au whirlpool'], dryActive: ['dry hop actif', 'cuve-a', 'dry hop en fermentation active'], dryPost: ['dry hop après', 'cuve-p', 'dry hop après fermentation'], levure: ['levure', 'levure', 'levure : toute la fermentation'] };
export const STOCK = { suffisant: ['en stock', 'stock'], 'à acheter': ['à acheter', 'achat'], manque: ['stock insuffisant', 'manque'] };
export const usageDe = (h) => ({ u: h.role || 'inconnu', src: /^fournisseur/.test(h.roleSource || '') ? 'fournisseur' : 'règle' });

// ---------- les fiches g1 (pack-fiches.json ; Celeia : catalogue du moteur et fiches de c1) ----------
const ROLE_MOT = { 'amérisant': 'amérisant', aromatique: 'aromatique', double: 'double usage' };
const NOMS_H = { myrcene: 'myrcène', humulene: 'humulène', caryophyllene: 'caryophyllène', farnesene: 'farnésène', linalool: 'linalol' };
const plageSrc = (s) => ({ src: s.source, an: s.annee ?? null, min: s.min, max: s.max });
const roleC1 = (nom) => { for (const v of C.voies) for (const h of v.fiches || []) if (h.houblon === nom) return { v: h.role, src: h.roleSource }; return null; };
const stockC1 = (nom) => { const v = C.voies.find((x) => !x.levureVers && x.actions.some((a) => a.houblon === nom) && x.type !== 'assemblage'); return v ? v.stock : null; };
const momentC1 = (nom) => { const v = C.voies.find((x) => !x.levureVers && x.actions.some((a) => a.houblon === nom)); return v ? v.actions.find((a) => a.houblon === nom).momentId : null; };
function ficheDe(nom) {
  const f = FICHES.find((x) => x.name === nom);
  if (f) {
    const comp = (f.huiles && f.huiles.composants) || {};
    const de = f.alpha && f.alpha.retenu ? f.alpha.retenu.from : null;
    return {
      nom, cle: f.key, origine: f.origin || null, role: roleC1(nom), stock: stockC1(nom), moment: momentC1(nom),
      alpha: ((f.alpha && f.alpha.sources) || []).map(plageSrc),
      lot: de === 'fiche de stock' || de === 'lu sur l’article' ? f.alpha.retenu.value : null,
      beta: ((f.beta && f.beta.sources) || []).map(plageSrc),
      huiles: ((f.huiles && f.huiles.totale && f.huiles.totale.sources) || []).map(plageSrc),
      composants: Object.entries(NOMS_H).map(([k, n]) => (comp[k] ? { nom: n, min: comp[k].min, max: comp[k].max, src: comp[k].source } : { nom: n, raison: comp[k + 'Raison'] || null })),
      aromes: (f.aromes || []).map((a) => ({ f: a.family, n: a.sources, of: a.of, auteurs: a.authors || [], mots: a.mots || [], premier: a.premier || [] })),
      sansFamille: f.motsSansFamille || [],
      desc: (f.descripteurs && f.descripteurs.beerMaverick) || [],
      subs: Array.isArray(f.substituts) ? f.substituts.map((x) => (typeof x === 'string' ? x : x.name || x.nom || '')).filter(Boolean) : ((f.substitutsCalcules && f.substitutsCalcules.remplacants) || []).map((x) => x.name).filter(Boolean),
      subsNote: Array.isArray(f.substituts) ? null : 'remplaçants calculés depuis les fiches du dépôt', subsRaison: 'aucune donnée de substitution dans le dépôt',
      styles: (f.usage || []).flatMap((u) => u.styles || []), stylesSrc: (f.usage || []).map((u) => u.source).filter(Boolean),
    };
  }
  // Celeia n'a pas de fiche dans le pack : la fiche réduite du catalogue du moteur (proto-data.json :
  // α, β, huiles de Beer Maverick) et les familles que ses fiches citent selon c1 (n/sur), sans mots.
  const v = VARIETES.find((x) => x.name === nom), c1 = C.voies.flatMap((x) => x.fiches || []).find((h) => h.houblon === nom);
  if (!v || !c1) return null;
  const src = (a) => (Array.isArray(a) ? [{ src: 'Beer Maverick', an: 2023, min: a[0], max: a[1] }] : []);
  const sur = c1.familles[0] ? c1.familles[0].sur : 0;
  return {
    nom, cle: v.id, origine: v.origin || null, role: roleC1(nom), stock: stockC1(nom), moment: momentC1(nom), catalogue: true,
    alpha: src(v.alpha), lot: null, beta: src(v.beta), huiles: src(v.oil), composants: [],
    aromes: ORDRE_STYLE.map((fa) => { const x = c1.familles.find((y) => y.famille === fa); return { f: fa, n: x ? x.n : 0, of: sur, auteurs: [], mots: [], premier: x && x.premier ? ['première citée'] : [] }; }),
    sansFamille: [], desc: v.tagsFr || [], subs: [], subsRaison: 'aucune donnée de substitution dans le dépôt',
    styles: [], stylesSrc: [],
  };
}
export const HOUBLONS = [...new Set(C.voies.flatMap((v) => (v.fiches || []).map((h) => h.houblon)))];
export const FICHES_H = Object.fromEntries(HOUBLONS.map((n) => [n, ficheDe(n)]).filter(([, f]) => f));

const nbF = (v) => String(v).replace('.', ',');
const plageF = (s) => (s.min === s.max ? nbF(s.min) : nbF(s.min) + '–' + nbF(s.max));
const recente = (arr) => (arr || []).reduce((a, s) => (!a || (s.an || 0) > (a.an || 0) ? s : a), null);
const fichesTxt = (a) => (a.of === 1 ? '' : a.n + '/' + a.of);

// La roue « N/M » (RADAR.roue de la base) : chaque famille au nombre de fiches qui la citent (1 au milieu,
// 2 au bord), « N/M » sous son nom ; non décrite : « ? », secteur hachuré (D65) ; la demande de c1 fléchée.
// t : { texte, gris, grille, serie, serieFond, marque, hach, police, gras }
export function roueSVG(F, t) {
  const W = 358, H = 250, cx = W / 2, cy = H / 2 + 4, R = 74, n = ROUE.length, pas = (2 * Math.PI) / n;
  const lv = Object.fromEntries(F.aromes.map((a) => [a.f, a]));
  const vals = ROUE.map((f) => (lv[f] && lv[f].n ? lv[f].n : null));
  const max = Math.max(2, ...vals.filter((v) => v != null));
  const rr = (v) => R * (v + 0.5) / (max + 0.5);
  const P = (k, r) => [cx + Math.sin(k * pas) * r, cy - Math.cos(k * pas) * r];
  const f1 = (x) => x.toFixed(1);
  const dem = { floral: 1, citrus: 1, resin: -1 };
  const id = 'h' + F.cle.replace(/[^a-z0-9]/gi, '');
  let s = `<svg class="roue" data-radar data-objet="fiche" data-axes="${ROUE.join(',')}" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Silhouette de ${F.nom} selon ses fiches : ${ROUE.filter((f, k) => vals[k]).map((f) => COURT[f].toLowerCase() + ' ' + (lv[f].of === 1 ? 'une seule fiche' : lv[f].n + ' sur ' + lv[f].of)).join(', ') || 'aucun arôme décrit'} ; les autres familles sont inconnues, pas à zéro">`;
  s += `<defs><pattern id="hc-${id}" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="${t.hach}" stroke-width="1.2"/></pattern></defs>`;
  // Secteurs inconnus (hachurés), anneaux, rayons.
  ROUE.forEach((f, k) => { if (vals[k] != null) return; const a = P(k - 0.5, R), b = P(k + 0.5, R); s += `<path data-inconnu="${f}" d="M${f1(cx)},${f1(cy)}L${f1(a[0])},${f1(a[1])}A${R},${R} 0 0 1 ${f1(b[0])},${f1(b[1])}Z" fill="url(#hc-${id})"/>`; });
  for (const v of [1, 2, ...(max > 2 ? [max] : [])]) s += `<circle cx="${cx}" cy="${cy}" r="${f1(rr(v))}" fill="none" stroke="${t.grille}" stroke-width="1"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="${f1(rr(0))}" fill="none" stroke="${t.grille}" stroke-width="1"/>`;
  ROUE.forEach((f, k) => { const e = P(k, R); s += `<line x1="${cx}" y1="${cy}" x2="${f1(e[0])}" y2="${f1(e[1])}" stroke="${vals[k] != null ? t.axe(f) : t.grille}" stroke-width="${vals[k] != null ? 1.5 : 1}"/>`; });
  // La série : un polygone fermé sur les 12 axes ; une famille inconnue posée au centre (valeur 0, marquée inconnue).
  const pts = ROUE.map((f, k) => P(k, rr(vals[k] || 0)));
  s += `<polygon data-serie="${F.nom}" data-valeurs="${vals.map((v) => v || 0).join(',')}" data-inconnues="${ROUE.filter((f, k) => vals[k] == null).join(',')}" points="${pts.map((q) => f1(q[0]) + ',' + f1(q[1])).join(' ')}" fill="${t.serieFond}" stroke="${t.serie}" stroke-width="2" stroke-linejoin="round"/>`;
  ROUE.forEach((f, k) => { if (vals[k] == null) return; const q = pts[k]; s += vals[k] >= 2 ? `<circle cx="${f1(q[0])}" cy="${f1(q[1])}" r="3.6" fill="${t.marque}" stroke="${t.marqueBord}" stroke-width="1.5"/>` : `<circle cx="${f1(q[0])}" cy="${f1(q[1])}" r="3.4" fill="${t.marqueBord}" stroke="${t.marque}" stroke-width="1.6"/>`; });
  // La demande de c1 (plus floral, plus d'agrumes, moins de résineux) fléchée au bord.
  ROUE.forEach((f, k) => {
    const sens = dem[f]; if (!sens) return;
    const deg = f1((k * 360) / n);
    s += `<g transform="translate(${cx},${cy}) rotate(${deg})" data-demande="${f}" data-sens="${sens > 0 ? 'plus' : 'moins'}">` + (sens > 0
      ? `<line x1="0" y1="${-(R + 4)}" x2="0" y2="${-(R + 11)}" stroke="${t.serie}" stroke-width="2"/><path d="M0,${-(R + 18)}L-4.5,${-(R + 10)}L4.5,${-(R + 10)}Z" fill="${t.serie}"/>`
      : `<line x1="0" y1="${-(R + 18)}" x2="0" y2="${-(R + 11)}" stroke="${t.serie}" stroke-width="2"/><path d="M0,${-(R + 4)}L-4.5,${-(R + 12)}L4.5,${-(R + 12)}Z" fill="${t.serie}"/>`) + '</g>';
  });
  // Libellés : nom (gras si demandé), « N/M » ; inconnu : gris et « ? ».
  ROUE.forEach((f, k) => {
    const a = k * pas, d = dem[f] ? 30 : 12, [x, y] = P(k, R + d);
    const sx = Math.sin(a), anc = Math.abs(sx) < 0.2 ? 'middle' : sx > 0 ? 'start' : 'end';
    const inc = vals[k] == null, cpt = !inc && lv[f].of > 1 ? lv[f].n + '/' + lv[f].of : '';
    const y0 = y + (Math.cos(a) < -0.5 ? 10 : Math.cos(a) > 0.5 ? -2 : 4);
    s += `<text x="${f1(x)}" y="${f1(y0)}" text-anchor="${anc}" font-size="12" font-family="${t.police}" fill="${inc ? t.gris : t.texte}"${dem[f] ? ` font-weight="${t.gras}"` : ''}>${COURT[f]}${inc ? '?' : ''}${cpt ? `<tspan font-weight="400" fill="${t.gris}"> ${cpt}</tspan>` : ''}</text>`;
  });
  return s + '</svg>';
}

// La fiche g1 en HTML (base/generateur/fiche.js : tete, blocAlpha, noteAlpha, blocLabels, blocArome,
// blocActions, blocReplis). o : { caseF(f, n), reglette(F, a), stockMarque(F), roue: thème de la roue }.
export function ficheHTML(F, o) {
  const a = recente(F.alpha);
  const role = F.role ? ROLE_MOT[F.role.v] || F.role.v : null;
  const txt = a ? plageF(a) + ' %' : F.lot != null ? nbF(F.lot) + ' %' : 'non renseigné';
  const par = Object.fromEntries(F.aromes.map((x) => [x.f, x]));
  const of = (F.aromes[0] || {}).of || 0;
  const seule = of === 1 ? (F.aromes.find((x) => x.n) || { auteurs: [] }).auteurs[0] : null;
  const decrites = ORDRE_STYLE.filter((f) => par[f] && par[f].n > 0), nd = ORDRE_STYLE.filter((f) => !par[f] || !par[f].n);
  const note = /cryo$/i.test(F.nom) ? `<p class="f-note">α : plages de ${F.nom.replace(/\s*cryo$/i, '')} en pellets ; la fiche du cryo manque.</p>`
    : F.lot != null && F.alpha.length && F.alpha.every((s) => F.lot < s.min || F.lot > s.max) ? `<p class="f-note">Mon lot ${nbF(F.lot)} % : hors des plages de ses fiches.</p>`
    : F.catalogue ? '<p class="f-note">Fiche du catalogue : pas de fiche détaillée dans le dépôt.</p>' : '';
  const lignes = decrites.map((f) => {
    const x = par[f], cpt = fichesTxt(x), prem = x.n === 1 && (x.premier || []).length ? 'nommé en premier' : '';
    const mots = [...new Set((x.mots || []).flatMap((m) => m.mots).map((w) => w.toLowerCase()))];
    const ti = (x.mots || []).map((m) => m.source + ' : ' + m.mots.join(', ')).join(' ; ');
    return `<div class="f-lab" data-explique="${f}"${ti ? ` title="${ti}"` : ''}>${o.caseF(f, x.n)}<span><span class="f-lab-n f-t-${f}">${COURT[f]}</span>${[cpt, prem].filter(Boolean).length ? ' ' + [cpt, prem].filter(Boolean).join(' · ') : ''}</span>${mots.length ? `<span class="f-lab-mots">${mots.join(', ')}</span>` : ''}</div>`;
  }).join('');
  const sans = F.sansFamille || [];
  const lvd = (f) => { const x = par[f]; return x && x.n ? (x.of === 1 ? '1 seule fiche' : x.n + '/' + x.of) : 'inconnu'; };
  const moment = F.moment ? MOMENT[F.moment][0] : null;
  const rg = (n, v) => `<div class="f-rg"><span class="f-rg-n">${n}</span><span class="f-rg-v">${v}</span></div>`;
  const srcT = (s) => s.src + (s.an ? ' ' + s.an : '');
  const tags = (xs) => `<div class="f-tags">${xs.map((t) => `<span class="f-tag">${t}</span>`).join('')}</div>`;
  const secs = {
    styles: F.styles.length ? tags(F.styles) + (F.stylesSrc.length ? `<p class="f-txt">${F.stylesSrc.join(' ; ')}</p>` : '') : '<p class="f-txt">styles d’emploi non publiés dans le dépôt</p>',
    huiles: (F.huiles.length ? F.huiles.map((s) => rg('totale, ' + srcT(s), plageF(s) + ' mL/100 g')).join('') : rg('totale', 'non renseigné')) + F.composants.map((c) => rg(c.nom, c.min != null ? plageF(c) + ' %' + (c.src ? ', ' + c.src : '') : c.raison || 'non renseigné')).join(''),
    sources: F.alpha.map((s) => rg('α ' + srcT(s), plageF(s) + ' %')).join('') + (F.lot != null ? rg('α mon lot', nbF(F.lot) + ' %') : '') + (F.beta.length ? F.beta.map((s) => rg('β ' + srcT(s), plageF(s) + ' %')).join('') : rg('β', 'non renseigné'))
      + `<p class="f-txt">Origine : ${F.origine || 'non renseignée'}</p>` + F.aromes.filter((x) => x.n > 0 && x.auteurs.length).map((x) => `<p class="f-txt"><b>${COURT[x.f]}${x.of === 1 ? '' : ' ' + x.n + '/' + x.of}</b> ${x.auteurs.join(', ')}</p>`).join('') + (F.desc.length ? tags(F.desc) : ''),
    subs: F.subs.length ? tags(F.subs) + (F.subsNote ? `<p class="f-txt">${F.subsNote}</p>` : '') : `<p class="f-txt">${F.subsRaison || 'non renseigné'}</p>`,
  };
  const TITRES = { styles: 'Styles', huiles: 'Huiles', sources: 'Sources', subs: 'Substituts' };
  return `<template data-fiche="${F.nom}"><section class="f-fiche" data-role="fiche" role="dialog" tabindex="-1" aria-label="Fiche de ${F.nom}">
  <div class="f-poignee" aria-hidden="true"></div>
  <header class="f-tete"><h2 class="f-nom">${F.nom}</h2>${o.stockMarque(F)}<button class="f-fermer" data-role="fermer-fiche" aria-label="Fermer la fiche de ${F.nom}">${ic('x')}</button></header>
  <div class="f-ab"><span class="f-alpha" data-role="fiche-alpha" aria-label="Acides alpha ${txt}${a ? ' (' + srcT(a) + ')' : ''}${F.lot != null && a ? ', mon lot ' + nbF(F.lot) + ' %' : ''}"><span class="f-grec">α</span><b class="f-aa">${txt}</b>${a && F.lot != null ? `<span class="f-lot">lot ${nbF(F.lot)} %</span>` : ''}</span>${a ? o.reglette(F, a) : ''}${role ? `<span class="f-role${/^règle/.test(F.role.src || '') ? ' regle' : ''}" aria-label="Rôle : ${role}${F.role.src ? ', ' + F.role.src : ''}">${role}</span>` : ''}</div>
  ${note}
  <div class="f-labels" data-role="fiche-labels">
    <div class="f-bande" role="img" aria-label="Les familles citées par les fiches de ${F.nom}"><span class="f-bande-c">${ORDRE_STYLE.map((f, i) => o.caseF(f, par[f] ? par[f].n : 0, i === ATTENDUES.length)).join('')}</span>${seule ? `<span class="f-seule">1 seule fiche : ${seule}</span>` : ''}</div>
    ${lignes}
    ${sans.length ? `<p class="f-lab-sans" title="${sans.map((x) => x.mot + ' : ' + x.source).join(' ; ')}">sans famille : ${sans.map((x) => x.mot).join(', ')}</p>` : ''}
    ${nd.length ? `<p class="f-lab-nd">${nd.length} non décrite${nd.length > 1 ? 's' : ''} : ${nd.map((f) => COURT[f]).join(', ')}</p>` : ''}
  </div>
  <div class="f-arome" data-role="fiche-arome">${roueSVG(F, o.roue)}<p class="f-dem" data-role="demande">${OBJ.map((f) => `<span class="f-dem-i"><b>${OB[f].crans > 0 ? '+' : '−'} ${COURT[f]}</b> ${lvd(f)}</span>`).join('')}</p></div>
  <div class="f-actions"><span class="f-gout" role="group" data-role="gout" aria-label="Mon goût pour ${F.nom} : neutre"><button class="f-g" aria-pressed="false" aria-label="Aimer ${F.nom}">${ic('coeur')}</button><button class="f-g" aria-pressed="false" aria-label="Exclure ${F.nom}">${ic('ban')}</button></span>${moment ? `<button class="f-act f-ajouter" aria-label="Ajouter ${F.nom} à ${moment}">${ic('plus')}Ajouter à ${moment}</button>` : ''}<button class="f-act f-comparer" aria-label="Comparer ${F.nom} à d'autres houblons">Comparer</button></div>
  <div class="f-replis" role="group" aria-label="Détail de la fiche">${Object.entries(TITRES).map(([k, t]) => `<button class="f-repli" data-sec="${k}" aria-expanded="false">${t}${ic('chev-b')}</button>`).join('')}</div>
  ${Object.keys(TITRES).map((k) => `<section class="f-sec" data-sec="${k}" aria-label="${TITRES[k]}" hidden>${secs[k]}</section>`).join('')}
</section></template>`;
}

// Le geste de la fiche (base/generateur/fiche.js, D25, D49) : appui long de 500 ms au doigt, survol de
// 750 ms à la souris, sur un nom de houblon (data-houblon) ou sur toute la ligne de sa voie hors de ses
// commandes ; un toucher court garde son action ; Échap, « fermer » ou le voile referment.
// ?fiche=<nom> ouvre une fiche au chargement (planche).
export const FICHE_JS = `
(() => {
  const APPUI_MS = 500, SURVOL_MS = 750;
  const racine = document.getElementById('fiche-racine');
  const tpl = (nom) => [...document.querySelectorAll('template[data-fiche]')].find((t) => t.dataset.fiche === nom);
  const CARTE = '[data-role="ajout-rapide"]', CMD = 'button, input, select, textarea, a, summary, details, [role="button"], [data-role="gout"]';
  let ouverte = null, mode = null;
  function zone(t) {
    if (!t || !t.closest || racine.contains(t)) return null;
    const e = t.closest('[data-houblon]');
    if (e && tpl(e.dataset.houblon)) return { el: e, zone: e.closest(CARTE) || e };
    const c = t.closest(CARTE); if (!c) return null;
    const cmd = t.closest(CMD); if (cmd && c.contains(cmd)) return null;
    const n = c.querySelector('[data-houblon]');
    return n && tpl(n.dataset.houblon) ? { el: n, zone: c } : null;
  }
  function fermer() {
    if (ouverte == null) return;
    ouverte = null; racine.replaceChildren(); document.body.classList.remove('fiche-ouverte');
    for (const e of document.querySelectorAll('.f-source')) e.classList.remove('f-source');
  }
  function placer(fe, src) {
    const col = document.querySelector('main').getBoundingClientRect(), r = src ? src.getBoundingClientRect() : { top: 80 };
    let x = col.right + 16; if (x + fe.offsetWidth > innerWidth - 8) x = Math.max(8, col.left - fe.offsetWidth - 16);
    fe.style.left = x + 'px'; fe.style.top = Math.max(8, Math.min(innerHeight - fe.offsetHeight - 8, r.top - 60)) + 'px';
  }
  function ouvrir(nom, m, src) {
    const t = tpl(nom); if (!t) return;
    fermer(); ouverte = nom; mode = m;
    racine.replaceChildren();
    if (m === 'feuille') { const v = document.createElement('div'); v.className = 'f-voile'; v.addEventListener('click', fermer); racine.append(v); }
    racine.append(t.content.cloneNode(true));
    const fe = racine.querySelector('[data-role="fiche"]');
    fe.classList.add('f-' + m);
    if (m === 'bulle') placer(fe, src);
    const ligne = src && src.closest('[data-voie]'); if (ligne) ligne.classList.add('f-source');
    document.body.classList.add('fiche-ouverte');
    fe.querySelector('[data-role="fermer-fiche"]').addEventListener('click', (e) => { e.stopPropagation(); fermer(); });
    fe.querySelectorAll('.f-repli').forEach((b) => b.addEventListener('click', (e) => {
      e.stopPropagation(); const on = b.getAttribute('aria-expanded') !== 'true';
      fe.querySelectorAll('.f-repli').forEach((x) => x.setAttribute('aria-expanded', String(x === b && on)));
      fe.querySelectorAll('.f-sec').forEach((s) => { s.hidden = !(on && s.dataset.sec === b.dataset.sec); });
    }));
    fe.querySelectorAll('.f-g').forEach((b) => b.addEventListener('click', (e) => {
      e.stopPropagation(); const on = b.getAttribute('aria-pressed') !== 'true';
      fe.querySelectorAll('.f-g').forEach((x) => x.setAttribute('aria-pressed', String(x === b && on)));
    }));
    const cmp = fe.querySelector('.f-comparer');
    if (cmp) cmp.addEventListener('click', (e) => { e.stopPropagation(); const b = ligne && ligne.querySelector('[data-role="ajouter-comparer"]'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); fermer(); });
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) fe.animate(m === 'feuille' ? [{ transform: 'translateY(30%)' }, { transform: 'none' }] : [{ opacity: 0, transform: 'scale(.97)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: 'cubic-bezier(.2,.8,.2,1)' });
  }
  let A = null, avale = 0;
  document.addEventListener('click', (e) => { if (performance.now() < avale) { e.stopPropagation(); e.preventDefault(); } }, true);
  document.addEventListener('contextmenu', (e) => { if ((A && A.type !== 'mouse') || performance.now() < avale) e.preventDefault(); });
  const annuler = () => { if (A) { clearTimeout(A.t); A.zone.classList.remove('appui'); } A = null; };
  document.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    avale = 0;
    if (racine.contains(e.target)) return;
    if (ouverte != null && mode === 'bulle') fermer();
    annuler();
    const z = zone(e.target); if (!z) return;
    const a = A = { ...z, x: e.clientX, y: e.clientY, id: e.pointerId, type: e.pointerType, actif: false };
    z.zone.classList.add('appui');
    a.t = setTimeout(() => {
      if (A !== a) return;
      a.actif = true; avale = performance.now() + 15000; a.zone.classList.remove('appui');
      try { if (navigator.vibrate) navigator.vibrate(8); } catch (x) { /* rien */ }
      ouvrir(a.el.dataset.houblon, a.type === 'mouse' || innerWidth >= 700 ? 'bulle' : 'feuille', a.el);
    }, APPUI_MS);
  }, true);
  document.addEventListener('pointermove', (e) => { if (A && e.pointerId === A.id && !A.actif && Math.hypot(e.clientX - A.x, e.clientY - A.y) > 10) annuler(); }, true);
  const relacher = () => { if (!A) return; if (!A.actif) { annuler(); return; } A = null; avale = performance.now() + 350; };
  document.addEventListener('pointerup', (e) => { if (A && e.pointerId === A.id) relacher(); }, true);
  document.addEventListener('pointercancel', (e) => { if (A && e.pointerId === A.id && !A.actif) annuler(); }, true);
  document.addEventListener('touchend', () => { if (A && A.actif) relacher(); }, true);
  document.addEventListener('touchmove', (e) => { if (A && A.actif) e.preventDefault(); }, { passive: false });
  let S = null;
  const finS = () => { if (S) { clearTimeout(S.t); S.zone.classList.remove('survol'); } S = null; };
  document.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse' || racine.contains(e.target)) return;
    const z = zone(e.target);
    if (!z) { if (S && S.zone.contains(e.target)) finS(); return; }
    if (S && S.el === z.el && S.zone === z.zone) return;
    finS();
    if (ouverte === z.el.dataset.houblon) return;
    z.zone.classList.add('survol');
    S = { ...z, t: setTimeout(() => { z.zone.classList.remove('survol'); ouvrir(z.el.dataset.houblon, 'bulle', z.el); }, SURVOL_MS) };
  });
  document.addEventListener('pointerout', (e) => { if (e.pointerType !== 'mouse') return; const vers = e.relatedTarget; if (S && S.zone.contains(e.target) && !(vers && S.zone.contains(vers))) finS(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && ouverte != null) { e.preventDefault(); fermer(); } });
  const q = new URLSearchParams(location.search).get('fiche');
  if (q) { const src = [...document.querySelectorAll('[data-houblon]')].find((e) => e.dataset.houblon === q); ouvrir(q, innerWidth >= 700 ? 'bulle' : 'feuille', src); const fe = racine.querySelector('.f-fiche'); if (fe) fe.getAnimations().forEach((x) => x.finish()); }
})();`;

// La lentille au style / absolu et les « + » vers Comparer (q2b).
export const PAGE_JS = `
  document.querySelectorAll('.lentille [data-e]').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('.lentille [data-e]').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
    document.body.classList.toggle('abs', b.dataset.e === 'absolu');
  }));
  if (/[?&]abs\\b/.test(location.search)) document.querySelector('.lentille [data-e="absolu"]').click();
  { const y = new URLSearchParams(location.search).get('y'); if (y) addEventListener('load', () => scrollTo(0, +y)); }
  document.querySelectorAll('[data-role="ajouter-comparer"]').forEach((b) => b.addEventListener('click', () => {
    const on = b.getAttribute('aria-pressed') !== 'true';
    b.setAttribute('aria-pressed', String(on));
    const nom = b.dataset.nom; b.setAttribute('aria-label', on ? 'Retirer ' + nom + ' de la comparaison' : 'Ajouter ' + nom + ' à la comparaison');
    document.querySelector('[data-role="comparer"] .nb').textContent = '(' + document.querySelectorAll('[data-role="ajouter-comparer"][aria-pressed="true"]').length + ')';
  }));`;
