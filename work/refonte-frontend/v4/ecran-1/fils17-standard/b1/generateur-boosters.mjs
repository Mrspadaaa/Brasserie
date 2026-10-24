// Lot 15 · q2b (le choix du brasseur : q2, « cella là ») : génère q2b/etat-b.html et q2b/comparer.html depuis
// donnees/c1.json (regénéré : tout[].crans, fiches[].role / roleSource). Aucun chiffre recopié à la main.
// Retours intégrés : plus de gros fonds (D82), le tableau des voies au même effet a la place, un « + » vers
// Comparer à la place du panier (D78), intensité en crans et usage du houblon sur chaque voie (D80), plus
// d'en-tête « ma bière » (D79), aucun sens seulement au survol (D81), picto épicé en grains de poivre.
// Usage : node gen-q2b.mjs
import fs from 'node:fs';
import path from 'node:path';

const REPO = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie';
const BASE = REPO + '/work/refonte-frontend/v4/ecran-1/fils15-s5-complexe';
const OUT = REPO + '/work/refonte-frontend/v4/ecran-1/fils17-standard';
const C = JSON.parse(fs.readFileSync(BASE + '/donnees/c1.json', 'utf8'));
const PACK = JSON.parse(fs.readFileSync(REPO + '/prototypes/houblons-v4/data/pack-mini-protos.json', 'utf8'));
const PICTOS = fs.readFileSync(BASE + '/pictos-familles.html', 'utf8').match(/<svg id="pictos" [^>]*>[\s\S]*?<\/svg>/)[0];

const ORDRE = ['floral', 'herbal', 'earthy', 'citrus', 'tropical', 'stoneFruit', 'pomeFruit', 'berries', 'melon', 'resin', 'spice', 'green'];
const NOM = { citrus: 'Agrumes', tropical: 'Fruits tropicaux', melon: 'Melon', stoneFruit: 'Fruits à noyau', pomeFruit: 'Fruits à pépins', berries: 'Petits fruits', floral: 'Floral', herbal: 'Herbacé', resin: 'Boisé et résineux', spice: 'Épicé', green: 'Végétal', earthy: 'Terreux' };
const COUL = { citrus: '#d9b414', tropical: '#ee9b2f', melon: '#6fc09b', stoneFruit: '#e88d68', pomeFruit: '#a3bd38', berries: '#9b3f74', floral: '#bf86d6', green: '#6aa33a', herbal: '#3f8a5f', spice: '#7a4e3a', earthy: '#9a8a66', resin: '#2f6b5f' };
const OBJ = ['floral', 'citrus', 'resin'];
const OB = Object.fromEntries(C.objectifs.map((o) => [o.famille, o]));
const BANDE = {}, AVANT = {};
for (const v of C.voies) for (const t of v.tout) { BANDE[t.famille] = t.bande; if (t.avant != null) AVANT[t.famille] = t.avant; }
const bande = (f) => BANDE[f] || [0, 30];
const cran = (f) => (OB[f] ? OB[f].cran : bande(f)[1] === 55 ? 18.3 : 10);
const DEG = PACK.scenarios.S1.tasting.axes.find((x) => x.family === 'resin').perceivedRange; // résineux dégusté, 66–100
const r1 = (x) => Math.round(x * 10) / 10;
const p = (x) => r1(x) + '%';
const fr = (x) => String(r1(x)).replace('.', ',').replace('-', '−');
const sg = (x) => (x > 0 ? '+' : '') + fr(x);
const cl = (x) => Math.max(0, Math.min(100, x));
const crTxt = (c) => (c > 0 ? '+' : '') + fr(c) + ' cran' + (Math.abs(c) >= 2 ? 's' : '');

function zone(f) {
  if (f === 'resin') return null;
  const a = AVANT[f]; if (a == null) return undefined;
  const [b0, b1] = bande(f), c = cran(f);
  const rS0 = (b1 - a) / c / 3 * 100, lS0 = (a - b0) / c / 3 * 100, rA0 = (b1 - a) / 50 * 100, lA0 = (a - b0) / 50 * 100;
  return { rS: cl(rS0), lS: cl(lS0), rA: cl(rA0), lA: cl(lA0), rS0, lS0, rA0, lA0 };
}
const ztEl = (f, s0, a0) => `<i class="zt${s0 > 100 ? ' cs' : ''}${a0 > 100 ? ' ca' : ''}" data-role="zone" style="--c:${COUL[f]};--s:${p(cl(s0))};--a:${p(cl(a0))}"></i>`;
const viseeS = (f) => (OB[f].visee - OB[f].maBiere.central) / OB[f].cran / 3 * 100;
const viseeA = (f) => (OB[f].visee - OB[f].maBiere.central) / 50 * 100;

function niv(v, f, e) {
  if (e < 0) return 'sf';
  let best = null;
  for (const h of v.fiches || []) for (const x of h.familles) if (x.famille === f) best = x.niveau === 'marqué' ? 'mq' : best || 'ci';
  return best || 'sf';
}
const NIVMOT = { mq: 'marqué dans ses fiches', ci: 'cité par une fiche', sf: 'sans fiche (modèle seul)' };

const V = C.voies.map((v, i) => {
  const extras = v.tout.filter((t) => !t.visee && Math.abs(t.effet) >= 0.5).sort((a, b) => ORDRE.indexOf(a.famille) - ORDRE.indexOf(b.famille));
  return { n: i + 1, v, extras, hs: new Set((v.horsStyle || []).map((x) => x.family)) };
});
const nomVoie = (v) => {
  if (v.levureVers) return { nom: v.levureVers, q: '' };
  if (v.type === 'assemblage') return { nom: v.actions.map((a) => a.houblon).join(' + '), q: '' };
  if (v.type.startsWith('remplacer') || v.type === 'levure') return { nom: v.actions[0].houblon, q: v.actions[0].grammes + ' g' };
  return { nom: v.actions[0].houblon, q: '' };
};

// ---------- icônes ----------
const I = {
  arome: '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 9 C4 4, 10 4, 12 9" fill="none" stroke="#16161a" stroke-width="2"/><circle cx="7" cy="10.5" r="2" fill="#16161a"/></svg>',
  amer: '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M7 1 C9 5, 12 7, 12 9.5 A5 5 0 0 1 2 9.5 C2 7, 5 5, 7 1 Z" fill="#16161a"/></svg>',
  levure: '<svg width="16" height="14" viewBox="0 0 16 14" aria-hidden="true"><circle cx="6" cy="8" r="5" fill="none" stroke="#16161a" stroke-width="1.8"/><circle cx="12.2" cy="3.8" r="2.8" fill="none" stroke="#16161a" stroke-width="1.6"/><circle cx="5" cy="7" r="1.2" fill="#16161a"/></svg>',
  cuveActif: '<svg width="14" height="16" viewBox="0 0 14 16" aria-hidden="true"><path d="M2 1 H12 V9 L7 15 L2 9 Z" fill="none" stroke="#16161a" stroke-width="1.7" stroke-linejoin="round"/><circle cx="5.5" cy="7" r="1.2" fill="#16161a"/><circle cx="8.5" cy="4.5" r="1.2" fill="#16161a"/><circle cx="7.5" cy="9.5" r="1" fill="#16161a"/></svg>',
  cuve: '<svg width="14" height="16" viewBox="0 0 14 16" aria-hidden="true"><path d="M2 1 H12 V9 L7 15 L2 9 Z" fill="none" stroke="#16161a" stroke-width="1.7" stroke-linejoin="round"/></svg>',
  remous: '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M7 7 m-1 0 a1 1 0 1 1 2 0 a3 3 0 1 1 -6 0 a5 5 0 1 1 10 0" fill="none" stroke="#16161a" stroke-width="1.6"/></svg>',
  egal: '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><rect x="2" y="4" width="10" height="2.2" rx="1" fill="#16161a"/><rect x="2" y="8" width="10" height="2.2" rx="1" fill="#16161a"/></svg>',
  bulles: '<svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true"><circle cx="5" cy="12" r="2.6" fill="none" stroke="#3a3a42" stroke-width="1.6"/><circle cx="10.5" cy="8" r="2" fill="none" stroke="#3a3a42" stroke-width="1.5"/><circle cx="6.5" cy="4" r="1.5" fill="none" stroke="#3a3a42" stroke-width="1.4"/><path d="M13 6 V1.5 M11 3.5 L13 1.5 L15 3.5" stroke="#3a3a42" stroke-width="1.4" fill="none"/></svg>',
  fleche: '<svg width="11" height="10" viewBox="0 0 12 10" aria-hidden="true"><path d="M1 5 H10 M7 2 L10 5 L7 8" stroke="#16161a" stroke-width="1.6" fill="none"/></svg>',
  gauche: '<svg width="9" height="10" viewBox="0 0 9 10" aria-hidden="true"><path d="M7 1 L2 5 L7 9" stroke="#fff" stroke-width="2" fill="none"/></svg>',
  haut: '<svg width="9" height="9" viewBox="0 0 9 9" aria-label="à monter"><path d="M4.5 1 L8 7.5 H1 Z" fill="#16161a"/></svg>',
  bas: '<svg width="9" height="9" viewBox="0 0 9 9" aria-label="à baisser"><path d="M4.5 8 L8 1.5 H1 Z" fill="#16161a"/></svg>',
};
// Le stock : une petite marque passive près des grammes (le panier laisse la place au « + »).
const STOCK = {
  suffisant: ['en stock', '<svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true"><rect x="1" y="3" width="10" height="8" rx="1.5" fill="#6e6e78"/><path d="M3.5 7 L5.3 8.8 L8.6 5.4" stroke="#fff" stroke-width="1.6" fill="none"/></svg>'],
  'à acheter': ['à acheter', '<svg width="12" height="11" viewBox="0 0 13 12" aria-hidden="true"><path d="M1 1.5 H3 L4.4 8 H10.5 L12 3.5 H3.6" fill="none" stroke="#6e6e78" stroke-width="1.5"/><circle cx="5" cy="10.3" r="1.2" fill="#6e6e78"/><circle cx="9.8" cy="10.3" r="1.2" fill="#6e6e78"/></svg>'],
  manque: ['stock insuffisant', '<svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true"><rect x="1.5" y="3" width="9" height="8" rx="1.5" fill="none" stroke="#6e6e78" stroke-width="1.4"/><rect x="1.5" y="8" width="9" height="3" rx="1" fill="#6e6e78"/></svg>'],
};
const stockMarque = (v) => (v.levureVers ? '' : `<span class="stk" role="img" aria-label="${STOCK[v.stock][0]}">${STOCK[v.stock][1]}</span>`);
const MOMENT = {
  b60: ['60′', '', 'à 60′'], b10: ['10′', '', 'à 10′'], wp: ['whirlpool', I.remous, 'au whirlpool'],
  dryActive: ['actif', I.cuveActif, 'dry hop en fermentation active'], dryPost: ['après', I.cuve, 'dry hop après fermentation'], levure: ['levure', I.levure, 'levure : toute la fermentation'],
};
// Chaque pastille écrit son moment (D81) ; le title ne fait que le répéter.
const pill = (id) => { const [t, ic, lg] = MOMENT[id]; return `<span class="mo" data-role="moment" data-moment="${id}" aria-label="Moment : ${lg}">${ic}<span>${t}</span></span>`; };
const momentDe = (v) => (v.levureVers ? 'levure' : v.actions[0].momentId);
const picto = (f, w = 16, attrs = '') => `<svg class="pi" width="${w}" height="${w}" ${attrs} aria-label="${NOM[f]}"><use href="#p-${f}"/></svg>`;

// L'usage selon le moteur : amérisant (goutte), aromatique (arôme), double (les deux) ; déduit de l'α : pâle.
const USAGE_IC = { amérisant: I.amer, aromatique: I.arome, double: '<span class="dbl">' + I.amer + I.arome + '</span>', inconnu: '<b class="inc">?</b>' };
function usage(h) {
  const u = h.role || 'inconnu', src = /^fournisseur/.test(h.roleSource || '') ? 'fournisseur' : 'règle';
  const dit = src === 'fournisseur' ? 'attesté par le fournisseur' : 'déduit de l\'α, à valider';
  return `<span class="us${src === 'règle' ? ' deduit' : ''}" data-role="usage" data-usage="${u}" data-source="${src}" data-houblon="${h.houblon}" aria-label="${h.houblon} : ${u}, ${dit}" title="${h.houblon} : ${u}, ${dit}">${USAGE_IC[u] || USAGE_IC.inconnu}</span>`;
}
const usages = (v) => (v.fiches || []).map(usage).join('');

// ---------- barres divergentes (s5), sans fonds ----------
function pctBar(f, e) {
  const s = Math.abs(e) / cran(f) / 3 * 100, a = Math.abs(e) / 50 * 100;
  return { s: Math.min(s, 100), a: Math.min(a, 100), ds: s > 100, da: a > 100 };
}
function hsSeg(f, b, side) {
  const z = zone(f); let s0, s1, a0, a1;
  if (z) { const zs = side === 'r' ? z.rS : z.lS, za = side === 'r' ? z.rA : z.lA; s0 = Math.min(zs, b.s); s1 = Math.max(0, b.s - zs); a0 = Math.min(za, b.a); a1 = Math.max(0, b.a - za); }
  else { s0 = Math.max(0, b.s - 5); s1 = Math.min(5, b.s); a0 = Math.max(0, b.a - 5); a1 = Math.min(5, b.a); }
  return `<i class="hs" style="--s0:${p(s0)};--s1:${p(s1)};--a0:${p(a0)};--a1:${p(a1)}"></i>`;
}
function bar(X, f, e, side, lab = '') {
  const b = pctBar(f, e), n = niv(X.v, f, e);
  let h = `<i class="bar ${n}${b.ds ? ' ds' : ''}${b.da ? ' da' : ''}" data-role="effet" data-famille="${f}" title="${NOM[f]} ${sg(e)} · ${NIVMOT[n]}" style="--c:${COUL[f]};--s:${p(b.s)};--a:${p(b.a)}"></i>`;
  if (X.hs.has(f)) h += hsSeg(f, b, side);
  if (lab) h += `<span class="lab-i f-${f}" style="--s:${p(b.s)};--a:${p(b.a)}">${lab}</span>`;
  return h;
}
const inconnu = (f) => `<i class="bar inconnu" data-role="effet" data-famille="${f}" title="${NOM[f]} : effet non établi"></i>`;
function zt(f, side) { const z = zone(f); if (!z) return ''; return ztEl(f, side === 'r' ? z.rS0 : z.lS0, side === 'r' ? z.rA0 : z.lA0); }
const crOf = (X, f) => { const t = X.v.tout.find((x) => x.famille === f); return t && t.crans != null ? t.crans : null; };
const arr = (c) => (Math.abs(c) < 0.5 ? (c < 0 ? '≈ −' : '≈ +') : (c > 0 ? '+' : '−') + Math.round(Math.abs(c)) + (Math.round(Math.abs(c)) >= 2 ? ' crans' : ' cran'));
// Deux couloirs : en haut le floral, en bas le résineux (à gauche) et les agrumes (à droite).
function couloirs(X, avecLab = false) {
  const e = X.v.effet; let la = '', lb = '', ra = '', rb = '';
  const lab = (f) => (avecLab && crOf(X, f) != null ? arr(crOf(X, f)) : '');
  if (!e.floral.etabli) ra = zt('floral', 'r') + inconnu('floral');
  else if (e.floral.central >= 0) ra = zt('floral', 'r') + bar(X, 'floral', e.floral.central, 'r', lab('floral'));
  else { ra = zt('floral', 'r'); la = zt('floral', 'l') + bar(X, 'floral', e.floral.central, 'l'); }
  rb = zt('citrus', 'r') + (e.citrus.etabli ? bar(X, 'citrus', e.citrus.central, 'r', lab('citrus')) : inconnu('citrus'));
  lb = e.resin.etabli ? bar(X, 'resin', e.resin.central, 'l') : inconnu('resin');
  return `<div class="bars"><div class="m re"><div class="ln a">${la}</div><div class="ln b">${lb}</div></div><div class="g"></div><div class="m fl"><div class="ln a">${ra}</div><div class="ln b">${rb}</div></div></div>`;
}

// ---------- intensité : une case par famille, picto + jauge (1 trait par cran du style) ----------
function jauge(c, hors) {
  const n = Math.abs(c) < 0.5 ? 0 : Math.min(4, Math.round(Math.abs(c)));
  const seg = n ? Array.from({ length: n }, () => '<i></i>').join('') : '<i class="pt"></i>';
  return `<span class="jg${c < 0 ? ' bas' : ''}${hors ? ' xs' : ''}">${seg}</span>`;
}
function caseFam(X, f, obj) {
  const t = X.v.tout.find((x) => x.famille === f);
  if (obj) {
    const e = X.v.effet[f];
    if (!e.etabli) return `<span class="cf o ne" data-famille="${f}" title="${NOM[f]} : effet non établi">${picto(f, 16)}<span class="jg ne"><i></i></span></span>`;
    const c = t ? t.crans : 0, n = niv(X.v, f, e.central);
    return `<span class="cf o ${n}${e.central < 0 ? ' moins' : ''}" data-famille="${f}" data-crans="${c}" title="${NOM[f]} ${sg(e.central)} (${crTxt(c)}) · ${NIVMOT[n]}${X.hs.has(f) ? ' · hors du style' : ''}">${picto(f, 16)}${jauge(c, X.hs.has(f))}</span>`;
  }
  if (!t || Math.abs(t.effet) < 0.5) return '<span class="cf vide"></span>';
  const n = niv(X.v, f, t.effet);
  return `<span class="cf ${n}${t.effet < 0 ? ' moins' : ''}" data-role="extra" data-famille="${f}" data-crans="${t.crans}" title="${NOM[f]} ${sg(t.effet)} (${crTxt(t.crans)}) · ${NIVMOT[n]}${X.hs.has(f) ? ' · hors du style' : ''}">${picto(f, 16)}${jauge(t.crans, X.hs.has(f))}</span>`;
}
const casesVoie = (X, slots) => `<span class="cases"><span class="objs">${OBJ.map((f) => caseFam(X, f, true)).join('')}</span><span class="exs">${slots.map((f) => caseFam(X, f, false)).join('')}</span></span>`;

// ---------- biotransformation : chaque signal par les pictos de son effet ; le hop creep a son mot ----------
function bioPill(X) {
  const sig = (X.v.bio || []).flatMap((h) => h.signaux); if (!sig.length) return '';
  const has = (id) => sig.find((s) => s.id === id);
  const pf = (f) => picto(f, 14, `data-famille="${f}"`);
  let pic = '';
  if (has('geraniol-citronellol')) pic += `<span class="bt" title="${has('geraniol-citronellol').titre} (${has('geraniol-citronellol').statut})">${pf('floral')}${I.fleche}${pf('citrus')}</span>`;
  if (has('thiols')) pic += `<span class="bt" title="${has('thiols').titre} (${has('thiols').statut})">${pf('tropical')}${pf('berries')}</span>`;
  if (has('hop-creep')) pic += `<span class="bt mot" title="${has('hop-creep').titre} (${has('hop-creep').statut})">${I.bulles}<span>creep</span></span>`;
  const liste = sig.map((s) => `<li><b>${s.titre}</b> · ${s.statut}. <span class="src">${s.pourquoi}</span></li>`).join('');
  return `<details class="bio" data-role="bio"><summary aria-label="Biotransformation possible, ampleur non quantifiée">${pic}</summary><ul>${liste}</ul></details>`;
}

// ---------- haut de page ----------
const tete = (actif) => `
  <div class="barre">
    <a class="retour" href="${actif === 'Comparer' ? 'etat-b.html' : '#'}" aria-label="Retour"></a>
    <div class="seg" role="radiogroup" aria-label="Partie">
      ${['Ma bière', 'Suggestions', 'Comparer'].map((x) => `<button role="radio" aria-checked="${x === actif}">${x}</button>`).join('')}
    </div>
  </div>
  <div class="outils">
    <div class="seg lentille" role="radiogroup" aria-label="Lecture des familles">
      <button role="radio" data-e="style" aria-checked="true">Au style</button>
      <button role="radio" data-e="absolu" aria-checked="false">Absolu</button>
    </div>
    <div class="seg" role="radiogroup" aria-label="Vue">
      <button role="radio" aria-checked="true">Barres</button>
      <button role="radio" aria-checked="false">Radar</button>
    </div>
  </div>`;
function cible(frac, visee, g) {
  const w = 64, x = Math.round(visee * w), b = Math.round(Math.min(1, frac) * w);
  if (!g) return `<svg class="cible" width="${w}" height="26" viewBox="0 0 ${w} 26" aria-hidden="true"><rect x="0" y="9" width="${w}" height="8" rx="4" fill="#fff"/><rect x="0" y="9" width="${b}" height="8" rx="4" fill="var(--k)"/><line x1="${x}" y1="1" x2="${x}" y2="25" stroke="#16161a" stroke-width="2.5" stroke-dasharray="4 3"/></svg>`;
  const gb = g.ne ? 14 : Math.round(Math.min(1, g.frac) * w);
  const fant = g.ne ? `<rect x="1" y="19" width="${gb}" height="10" rx="3" fill="url(#hachure)" stroke="#3a3a42" stroke-width="1.4" stroke-dasharray="3 2"/>` : `<rect x="1" y="19" width="${gb - 2}" height="10" rx="4" fill="var(--k)" fill-opacity=".4" stroke="#16161a" stroke-width="1.6" stroke-dasharray="3 2"/>`;
  return `<svg class="cible fantome" width="${w}" height="32" viewBox="0 0 ${w} 32" aria-hidden="true"><defs><pattern id="hachure" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="4" height="4" fill="#fff"/><rect width="1.6" height="4" fill="#9aa0ab"/></pattern></defs><rect x="0" y="6" width="${w}" height="8" rx="4" fill="#fff"/><rect x="0" y="6" width="${b}" height="8" rx="4" fill="var(--k)"/>${fant}<line x1="${x}" y1="1" x2="${x}" y2="31" stroke="#16161a" stroke-width="2.5" stroke-dasharray="4 3"/></svg>`;
}
function meilleure(f, sens) {
  const c = V.filter((X) => X.v.effet[f].etabli && !X.hs.size);
  return c.length ? c.reduce((b, X) => ((sens > 0 ? X.v.effet[f].central > b.v.effet[f].central : X.v.effet[f].central < b.v.effet[f].central) ? X : b)) : null;
}
function reponses(cfg = {}) {
  const pT = (f) => (cfg.pictoT ? cfg.pictoT(f) : picto(f, 18));
  const gh = (f) => { const X = cfg.fantome; if (!X) return null; const e = X.v.effet[f]; return e.etabli ? { frac: e.central / OB[f].cran / (f === 'floral' ? 1.15 : 1.7) } : { ne: true }; };
  const fl = meilleure('floral', 1), ci = meilleure('citrus', 1);
  const vFl = OB.floral.maBiere.central + fl.v.effet.floral.central, vCi = OB.citrus.maBiere.central + ci.v.effet.citrus.central;
  const verd = (f, v) => (v >= OB[f].visee ? 'atteint' : Math.abs(v - OB[f].visee) <= Math.abs(OB[f].maBiere.central - OB[f].visee) / 2 ? 'approche' : 'aucune');
  const dFl = verd('floral', vFl), dCi = verd('citrus', vCi);
  const MOT = { atteint: 'Atteint', approche: 'Approche', aucune: 'Aucune' };
  const re = meilleure('resin', -1);
  const dRe = DEG.min + re.v.effet.resin.central <= OB.resin.visee ? 'atteint' : 'aucune';
  const frFl = fl.v.effet.floral.central / OB.floral.cran, frCi = ci.v.effet.citrus.central / OB.citrus.cran;
  return `
  <div class="reps">
    <section class="tuile resin" data-role="objectif" data-famille="resin" aria-label="Moins résineux : ma bière est au-dessus du style d'après la dégustation ; aucune voie houblon ne l'y ramène">
      <span class="nom"><span class="pa">${pT('resin')}<i class="alerte"></i></span>Moins résineux</span>${cfg.fantome ? cfg.fantomeResin(cfg.fantome) : ''}
      <div class="rep v-${dRe}" data-role="reponse" data-famille="resin" data-verdict="${dRe}">${MOT[dRe]}<small>voie houblon</small></div>
      <button class="hh-b" onclick="var d=document.getElementById('hh');d.open=true;d.scrollIntoView({behavior:'smooth'})">Hors houblon<svg width="8" height="10" viewBox="0 0 8 10" aria-hidden="true"><path d="M2 1 L6 5 L2 9" fill="none" stroke="#1f5247" stroke-width="2"/></svg></button>
    </section>
    <section class="tuile floral" data-role="objectif" data-famille="floral" aria-label="Plus floral : la meilleure voie, ${nomVoie(fl.v).nom}, ${MOT[dFl].toLowerCase()} la visée (${fr(OB.floral.maBiere.central)} → ${fr(vFl)}, visée ${fr(OB.floral.visee)})" style="--k:#9f5cc0">
      <span class="nom">${pT('floral')}Plus floral</span>
      <div class="rep v-${dFl}" data-role="reponse" data-famille="floral" data-verdict="${dFl}">${MOT[dFl]}</div>
      ${cible(frFl / 1.15, 1 / 1.15, gh('floral'))}
    </section>
    <section class="tuile citrus" data-role="objectif" data-famille="citrus" aria-label="Plus agrumes : la meilleure voie, ${nomVoie(ci.v).nom}, ${MOT[dCi].toLowerCase()} la visée (${fr(OB.citrus.maBiere.central)} → ${fr(vCi)}, visée ${fr(OB.citrus.visee)})" style="--k:#c9a300">
      <span class="nom">${pT('citrus')}Plus agrumes</span>
      <div class="rep v-${dCi}" data-role="reponse" data-famille="citrus" data-verdict="${dCi}">${MOT[dCi]}</div>
      ${cible(frCi / 1.7, 1 / 1.7, gh('citrus'))}
    </section>
  </div>`;
}
// Le graphique : deux demi-pistes sans fond ; le sens se dit par une flèche fine en tête, ma bière par le rail.
function fonds() {
  const flS = viseeS('floral'), flA = viseeA('floral'), ciA = viseeA('citrus');
  const fo0 = cl((DEG.min - OB.resin.visee) / 50 * 100);
  return `
    <div class="fonds">
      <div class="moitie re" data-role="piste" data-famille="resin">
        <i class="flou" style="--s0:100%;--s1:0%;--a0:${p(fo0)};--a1:${p(100 - fo0)}"></i>
      </div>
      <div class="gut"></div>
      <div class="moitie fl" data-role="piste" data-famille="floral">
        <i class="ov" data-role="piste" data-famille="citrus"></i>
        <i class="vl" style="--s:${p(flS)};--a:${p(flA)}"></i>
        <i class="vl" style="--s:${p(viseeS('citrus'))};--a:${p(ciA)}"></i>
      </div>
    </div>
    <div class="tetes" aria-hidden="true">
      <div class="m re"><i class="axe g-ax"></i><span class="puce v gauche-v">${I.gauche}visée</span></div>
      <div class="g"></div>
      <div class="m fl"><i class="axe d-ax"></i><span class="puce v sty-only" style="--s:${p(flS)}">visée</span>
        <span class="puce pv abs-only" style="--a:${p(flA)}">${picto('floral', 14)}</span><span class="puce pv abs-only" style="--a:${p(ciA)}">${picto('citrus', 14)}</span></div>
    </div>`;
}

function details() {
  const ib = V.map((X) => nomVoie(X.v).nom + ' ' + MOMENT[momentDe(X.v)][0] + ' ' + fr(X.v.ibu.after)).join(' · ');
  const hh = C.horsModele.map((h) => h.pistes.map((x) => `<li><b>${x.titre}</b> : ${x.action.charAt(0).toLowerCase() + x.action.slice(1)} <span class="src">${x.preuve}</span></li>`).join('')).join('');
  return `
  <details>
    <summary>IBU après chaque voie (ma bière ${fr(C.ibu)} ; style ${C.bandeIbu.join('–')})</summary>
    <ul><li>${ib}</li></ul>
  </details>
  <details id="hh">
    <summary>Hors houblon · résineux (${C.horsModele[0].pistes.length} pistes)</summary>
    <ul>${hh}</ul>
  </details>`;
}

const CSS = `
  :root {
    --encre: #16161a; --gris: #5b5b66; --gris2: #6e6e78; --trait: #dcdce3; --fond: #f6f6f9;
    --acc: #c2410c;
    --floral-f: #7a3f9b; --resin-f: #1f5247; --citrus-f: #6f5a00;
    --gut: 22px;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #fff; color: var(--encre); }
  body { font: 400 14px/1.25 -apple-system, system-ui, "Segoe UI", Roboto, sans-serif; -webkit-tap-highlight-color: transparent; }
  button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; }
  .ecran { max-width: 390px; margin: 0 auto; padding: 8px 16px 88px; display: flex; flex-direction: column; gap: 12px; overflow-x: hidden; }
  .barre { display: flex; align-items: center; gap: 8px; height: 36px; }
  .retour { width: 28px; height: 28px; position: relative; flex: none; }
  .retour::before { content: ''; position: absolute; left: 10px; top: 9px; width: 9px; height: 9px; border-left: 2px solid var(--encre); border-bottom: 2px solid var(--encre); transform: rotate(45deg); }
  .seg { display: flex; background: #ececf1; border-radius: 16px; padding: 2px; flex: 1; }
  .seg button { flex: 1; height: 28px; border-radius: 14px; font-size: 13px; color: var(--gris); white-space: nowrap; }
  .seg button[aria-checked="true"] { background: #fff; color: var(--encre); font-weight: 650; box-shadow: 0 1px 2px rgba(0,0,0,.12); }
  .outils { display: flex; justify-content: space-between; gap: 8px; }
  .outils .seg { flex: none; }
  .outils .seg button { padding: 0 12px; }
  .lentille button[aria-checked="true"] { color: #fff; background: var(--encre); }

  .reps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .tuile { border-radius: 18px; padding: 9px 9px; display: flex; flex-direction: column; gap: 5px; min-height: 104px; position: relative; overflow: hidden; }
  .tuile.resin { background: linear-gradient(200deg, #f2f8f6, #cfe5de); }
  .tuile.floral { background: linear-gradient(160deg, #faf4fd, #e6d2f2); }
  .tuile.citrus { background: linear-gradient(160deg, #fdfaea, #f1e2a2); }
  .tuile .nom { display: flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 700; line-height: 1.1; }
  .tuile.resin .nom { color: var(--resin-f); } .tuile.floral .nom { color: var(--floral-f); } .tuile.citrus .nom { color: var(--citrus-f); }
  .nom .pa { position: relative; display: inline-flex; flex: none; }
  .alerte { position: absolute; right: -3px; bottom: -2px; width: 9px; height: 9px; border-radius: 50%; background: var(--acc); box-shadow: 0 0 0 1.5px #fff; }
  .rep { font-size: 19px; font-weight: 800; line-height: 1; letter-spacing: -.015em; }
  .rep small { display: block; font-size: 12px; font-weight: 700; margin-top: 3px; letter-spacing: 0; }
  .v-aucune { color: #475569; } .v-approche { color: #4f46e5; } .v-atteint { color: #0e7490; }
  .hh-b { margin-top: auto; height: 26px; padding: 0 8px; border-radius: 13px; background: #fff; font-size: 12px; font-weight: 700; color: var(--resin-f); display: inline-flex; align-items: center; gap: 3px; box-shadow: inset 0 0 0 1.5px #2f6b5f; align-self: flex-start; white-space: nowrap; }
  .cible { margin-top: auto; }

  /* Plus de fonds teintés : les demi-pistes sont transparentes ; le rail de ma bière est un trait fin. */
  .graph { position: relative; }
  .fonds { position: absolute; inset: 0; display: flex; pointer-events: none; }
  .moitie { position: relative; flex: 1; }
  .moitie .ov { position: absolute; inset: 0; }
  .gut { width: var(--gut); flex: none; position: relative; }
  .gut::before { content: ''; position: absolute; top: 0; bottom: 0; left: 9.5px; width: 3px; border-radius: 2px; background: var(--encre); }
  .vl { position: absolute; top: 0; bottom: 0; width: 0; border-left: 1.5px dashed var(--encre); left: var(--s); z-index: 1; }
  body.abs .vl { left: var(--a); }
  .flou { position: absolute; top: 0; bottom: 0; right: var(--s0); width: var(--s1); background: linear-gradient(270deg, rgba(47,107,95,.22), rgba(47,107,95,.03)); }
  body.abs .flou { right: var(--a0); width: var(--a1); }
  .tetes { position: relative; display: flex; height: 34px; margin-top: 2px; }
  .tetes .m { flex: 1; position: relative; }
  .tetes .g { width: var(--gut); flex: none; }
  .axe { position: absolute; top: 4px; height: 1.5px; background: var(--encre); }
  .g-ax { left: 2px; right: 0; } .d-ax { left: 0; right: 2px; }
  .g-ax::before, .d-ax::after { content: ''; position: absolute; top: -3.5px; border: 4.25px solid transparent; }
  .g-ax::before { left: -4px; border-right: 6px solid var(--encre); border-left: 0; }
  .d-ax::after { right: -4px; border-left: 6px solid var(--encre); border-right: 0; }
  .puce { position: absolute; top: 11px; font-size: 12px; font-weight: 700; padding: 2px 7px; border-radius: 9px; white-space: nowrap; background: var(--encre); color: #fff; display: inline-flex; align-items: center; gap: 3px; }
  .puce.gauche-v { left: 4px; }
  .fl .puce.v { left: calc(var(--s) - 21px); }
  .fl .puce.pv { left: calc(var(--a) - 12px); padding: 2px 5px; background: #fff; box-shadow: inset 0 0 0 1.5px var(--encre); }
  .abs-only { display: none !important; }
  body.abs .abs-only { display: inline-flex !important; }
  body.abs .sty-only { display: none !important; }

  .groupe { position: relative; display: flex; align-items: center; gap: 6px; min-height: 30px; padding: 0 4px; font-size: 13px; font-weight: 750; }
  .groupe > span.t { background: #fff; padding: 2px 6px 2px 2px; border-radius: 9px; display: inline-flex; gap: 5px; align-items: center; white-space: nowrap; }
  .dose { font-size: 13px; font-weight: 650; color: var(--gris); background: #fff; padding: 1px 5px; border-radius: 8px; }
  .est { font-size: 12px; font-weight: 600; color: var(--gris); background: #fff; padding: 1px 6px; border-radius: 8px; }
  .mo { display: inline-flex; align-items: center; gap: 3px; height: 22px; padding: 0 7px; border-radius: 11px; border: 1.5px dashed #7d7d86; background: #fff; font-size: 12px; font-weight: 700; white-space: nowrap; font-variant-numeric: tabular-nums; flex: none; }
  .bars { position: relative; display: flex; height: 32px; }
  .bars .m { position: relative; flex: 1; }
  .bars .g { width: var(--gut); flex: none; }
  .ln { position: absolute; left: 0; right: 0; height: 10px; }
  .ln.a { top: 0; } .ln.b { top: 16px; }
  .zt { position: absolute; bottom: -4px; height: 2.5px; width: var(--s); background: color-mix(in srgb, var(--c) 60%, #fff); }
  .zt::after { content: ''; position: absolute; top: -4px; width: 2.5px; height: 8px; border-radius: 1px; background: color-mix(in srgb, var(--c) 75%, #16161a); }
  .fl .zt, .cr .zt { left: 0; } .fl .zt::after, .cr .zt::after { right: -1px; }
  .re .zt, .cl .zt { right: 0; } .re .zt::after, .cl .zt::after { left: -1px; }
  .zt.cs::after { display: none; } body.abs .zt.cs::after { display: block; } body.abs .zt.ca::after { display: none; }
  body.abs .zt { width: var(--a); }
  .bar { position: absolute; top: 0; height: 10px; min-width: 3px; width: var(--s); background: var(--c); z-index: 1; }
  body.abs .bar:not(.inconnu) { width: var(--a); }
  .fl .bar { left: 0; border-radius: 0 4px 4px 0; } .re .bar { right: 0; border-radius: 4px 0 0 4px; }
  .bar.ci { background: color-mix(in srgb, var(--c) 40%, #fff); box-shadow: inset 0 0 0 1.5px var(--c); }
  .bar.sf { background: #fff; box-shadow: inset 0 0 0 1.5px var(--c); }
  .bar.inconnu { width: 24px; background: repeating-linear-gradient(135deg, #fff 0 3px, #b8bec8 3px 5px); box-shadow: inset 0 0 0 1.2px #8a909b; }
  .bar.ds::after, body.abs .bar.da::after { content: ''; position: absolute; top: 2px; right: 2px; border: 3px solid transparent; border-left: 5px solid #fff; }
  body.abs .bar.ds:not(.da)::after { display: none; }
  .hs { position: absolute; top: 0; height: 10px; left: var(--s0); width: var(--s1); background: var(--acc); z-index: 2; border-radius: 0 4px 4px 0; }
  .re .hs { left: auto; right: var(--s0); border-radius: 4px 0 0 4px; }
  body.abs .hs { left: var(--a0); width: var(--a1); }
  body.abs .re .hs { left: auto; right: var(--a0); }
  .lab-i { position: absolute; top: -3px; left: calc(var(--s) + 5px); font-size: 12px; font-weight: 750; white-space: nowrap; background: #fff; padding: 0 4px; border-radius: 6px; z-index: 3; line-height: 16px; }
  body.abs .lab-i { left: calc(var(--a) + 5px); }

  /* Le tableau des voies : la part qui « fait sens ». */
  .tab { position: relative; z-index: 3; margin: 2px 0 12px; border-radius: 14px; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,.12), inset 4px 0 0 var(--encre); padding: 2px 6px 2px 10px; }
  .tab.seul { box-shadow: 0 1px 4px rgba(0,0,0,.12); padding-left: 6px; }
  .vr { padding: 6px 0 6px; }
  .vr + .vr { border-top: 1px solid var(--trait); }
  .vr.coupe-l { border-top: 1.5px solid #b9b9c2; }
  .l1 { display: flex; align-items: center; gap: 5px; min-height: 26px; }
  .l1 b { font-size: 14px; font-weight: 700; line-height: 1.15; }
  .l1 .q { font-size: 13px; color: var(--gris); white-space: nowrap; }
  .gr { display: inline-flex; align-items: center; gap: 3px; }
  .stk { display: inline-flex; flex: none; }
  .us { display: inline-flex; align-items: center; flex: none; }
  .us svg { width: 13px; height: 13px; }
  .us .dbl { display: inline-flex; gap: 0; }
  .us .dbl svg + svg { margin-left: -2px; }
  .us.deduit { opacity: .42; }
  .us .inc { font-size: 12px; color: var(--gris); }
  .ajc { margin-left: auto; width: 30px; height: 30px; border-radius: 15px; background: #fff; box-shadow: inset 0 0 0 2px var(--encre); position: relative; flex: none; }
  .ajc::before, .ajc::after { content: ''; position: absolute; left: 8px; top: 13.8px; width: 14px; height: 2.4px; border-radius: 1px; background: var(--encre); }
  .ajc::after { transform: rotate(90deg); }
  .ajc[aria-pressed="true"] { background: var(--encre); }
  .ajc[aria-pressed="true"]::before { left: 8px; top: 15px; width: 6px; transform: rotate(45deg); background: #fff; }
  .ajc[aria-pressed="true"]::after { left: 10.5px; top: 13px; width: 12px; transform: rotate(-50deg); background: #fff; }
  .cases { display: flex; align-items: flex-start; gap: 8px; margin-top: 4px; }
  .objs, .exs { display: inline-flex; gap: 3px; }
  .objs { padding-right: 8px; border-right: 1.5px dashed #c4c4cc; }
  .cf { width: 22px; height: 30px; display: inline-flex; flex-direction: column; align-items: center; gap: 3px; position: relative; }
  .cf .pi { display: block; }
  .cf.ci .pi { opacity: .38; }
  .cf.o .pi { border-radius: 50%; box-shadow: 0 0 0 1.5px #fff, 0 0 0 2.8px var(--encre); }
  .cf.ne .pi { opacity: .3; }
  .cf.vide::after { content: ''; width: 4px; height: 4px; border-radius: 2px; background: #d6d6dd; margin-top: 7px; }
  .cf.moins::before { content: ''; position: absolute; left: -2px; top: -2px; width: 7px; height: 2.6px; border-radius: 1.3px; background: var(--encre); box-shadow: 0 0 0 1px #fff; z-index: 1; }
  .jg { display: inline-flex; gap: 1.5px; height: 6px; align-items: flex-end; }
  .jg i { width: 4px; height: 6px; border-radius: 1px; background: var(--encre); }
  .jg i.pt { width: 3px; height: 3px; border-radius: 2px; }
  .jg.bas i { background: #fff; box-shadow: inset 0 0 0 1.2px var(--encre); }
  .jg.bas i.pt { background: var(--encre); }
  .jg.xs i { background: var(--acc); }
  .jg.ne i { width: 14px; height: 5px; background: repeating-linear-gradient(135deg, #fff 0 2px, #9aa0ab 2px 3.5px); box-shadow: inset 0 0 0 1px #8a909b; }
  .rangee { position: relative; padding: 2px 0 10px; }

  details.bio { display: inline-block; position: static; }
  details.bio summary { list-style: none; display: inline-flex; align-items: center; gap: 4px; height: 24px; padding: 0 5px; border-radius: 12px; background: repeating-linear-gradient(135deg, #fff 0 3px, #d5d7de 3px 5.5px); box-shadow: inset 0 0 0 1.2px #8a909b; cursor: pointer; }
  details.bio summary::-webkit-details-marker { display: none; }
  .bt { display: inline-flex; align-items: center; gap: 1px; background: #fff; border-radius: 8px; padding: 0 3px; height: 18px; }
  .bt.mot span { font-size: 12px; font-weight: 650; margin-left: 2px; }
  details.bio[open] ul { position: absolute; left: 6px; right: 6px; z-index: 6; background: #fff; border-radius: 12px; box-shadow: 0 6px 18px rgba(0,0,0,.18); padding: 10px 12px 10px 26px; font-size: 13px; display: flex; flex-direction: column; gap: 6px; }
  .src { color: var(--gris2); font-size: 12px; }
  details { border-radius: 14px; background: var(--fond); padding: 10px 12px; }
  details.bio { background: none; padding: 0; border-radius: 0; }
  summary { font-size: 14px; font-weight: 700; cursor: pointer; }
  details:not(.bio) ul { margin: 8px 0 0 16px; display: flex; flex-direction: column; gap: 6px; font-size: 13px; }

  .cmp { position: fixed; z-index: 8; left: 50%; transform: translateX(-50%); bottom: 14px; width: 358px; max-width: calc(100% - 32px); height: 50px; border-radius: 25px; background: var(--encre); color: #fff; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 16px; font-weight: 700; text-decoration: none; box-shadow: 0 8px 22px rgba(0,0,0,.28); }
  .cmp .nb { font-weight: 800; }
`;
const LENTILLE_JS = `
  document.querySelectorAll('.lentille [data-e]').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('.lentille [data-e]').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
    document.body.classList.toggle('abs', b.dataset.e === 'absolu');
  }));
  if (/[?&]abs\\b/.test(location.search)) document.querySelector('.lentille [data-e="absolu"]').click();`;
const page = (titre, commentaire, css, corps, js) => `<!doctype html>
<html lang="fr" data-cas="c1">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titre}</title>
<!-- ${commentaire} -->
<style>${CSS}${css}</style>
</head>
<body>
${PICTOS}
<main class="ecran">${corps}
</main>
<script>${LENTILLE_JS}${js || ''}</script>
</body>
</html>
`;
const ecrire = (f, s) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, s); console.log('écrit ' + path.relative(BASE, f) + ' (' + s.length + ' o)'); };


// ======================= Lot 17 · six boosters sur q2b =======================
// Chaque page est q2b (même générateur, mêmes données) juste après le geste du booster.
const FICHES = JSON.parse(fs.readFileSync(REPO + '/prototypes/houblons-v4/data/pack-fiches.json', 'utf8')).fichesHoublons;
const groupesEffet = [];
for (const X of V) { const k = JSON.stringify(X.v.effet); const g = groupesEffet.find((x) => x.k === k); if (g) g.voies.push(X); else groupesEffet.push({ k, voies: [X] }); }
const MEMES = groupesEffet.filter((g) => g.voies.length > 1);
const SEULS = new Set(groupesEffet.filter((g) => g.voies.length === 1).map((g) => g.voies[0].n));
const slotsDe = (xs) => ORDRE.filter((f) => !OBJ.includes(f) && xs.some((X) => X.extras.some((t) => t.famille === f)));
const GESTES = [
  { t: 'Assembler 5 + 5 g', ic: I.arome, mo: 'b10', est: true, voies: [6, 8] },
  { t: 'Remplacer Nugget', ic: I.amer, mo: 'b60', voies: [12, 13, 14] },
  { t: 'Dry hop', ic: I.arome, mo: 'dryActive', est: true, voies: [15] },
  { t: 'Changer de levure', ic: '', mo: 'levure', est: true, voies: [16, 17] },
].map((g) => ({ ...g, voies: g.voies.filter((n) => SEULS.has(n)) })).filter((g) => g.voies.length);
const CSS_Q2B = `
  .tab.seul { background: none; box-shadow: none; padding: 0; margin: 0 0 4px; border-top: 1px solid var(--trait); border-radius: 0; z-index: auto; }
  .tab.seul .vr { padding: 6px 6px 2px; }
  .tab.seul .l1 b, .tab.seul .gr, .tab.seul .us { background: #fff; border-radius: 7px; padding: 1px 4px; }
  .tab.seul .cases { background: #fff; border-radius: 9px; padding: 2px 4px 0; width: max-content; position: relative; z-index: 2; }
  .tab.seul .ajc { position: relative; z-index: 2; }
  .tab.seul .rangee.in { padding: 4px 0 8px; }
  .vr { position: relative; }
  /* La trace du doigt : un halo qui reste le temps de voir ce qu'on vient de toucher. */
  .doigt { position: absolute; width: 38px; height: 38px; border-radius: 50%; background: rgba(22,22,26,.13); box-shadow: 0 0 0 2px rgba(22,22,26,.28); pointer-events: none; z-index: 9; }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } }`;
const JS_AJC = `
  const nbAj = () => document.querySelectorAll('[data-role="ajouter-comparer"][aria-pressed="true"]').length;
  document.querySelectorAll('[data-role="ajouter-comparer"]').forEach((b) => b.addEventListener('click', () => {
    b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'));
    const nb = document.querySelector('.cmp .nb'); if (nb && !window.roulerCompteur) nb.textContent = '(' + nbAj() + ')';
    if (window.apresAjout) window.apresAjout(b);
  }));`;

function etatB(cfg) {
  const aj = cfg.ajoutees || [1, 15];
  const ajc = (X) => { const { nom } = nomVoie(X.v), on = aj.includes(X.n); return `<button class="ajc${cfg.vient === X.n ? ' vient' : ''}" data-role="ajouter-comparer" aria-pressed="${on}" aria-label="${on ? 'Retirer ' + nom + ' de la comparaison' : 'Ajouter ' + nom + ' à la comparaison'}"></button>`; };
  const ligne = (X, slots, cls = '') => {
    const { nom, q } = nomVoie(X.v);
    const dose = X.v.type === 'assemblage' ? '<span class="q">5+5 g ≈</span>' : q ? `<span class="q">${q}</span>` : '';
    return `<div class="vr${cls}${cfg.vrCls ? cfg.vrCls(X) : ''}" data-voie="${X.n}"${cfg.vrAttr ? cfg.vrAttr(X) : ''}>
        <div class="l1">${usages(X.v)}${cfg.nom ? cfg.nom(X, nom) : `<b>${nom}</b>`}<span class="gr">${dose}${stockMarque(X.v)}</span>${bioPill(X)}${cfg.l1Fin ? cfg.l1Fin(X) : ''}${ajc(X)}</div>
        ${casesVoie(X, slots)}${cfg.dansLigne ? cfg.dansLigne(X) : ''}
      </div>${cfg.apresLigne ? cfg.apresLigne(X) : ''}`;
  };
  const blocMeme = (g, gi) => {
    const slots = slotsDe(g.voies);
    const sig = (X) => X.extras.map((t) => t.famille).join();
    const ord = []; for (const X of g.voies) if (!ord.includes(X)) ord.push(...g.voies.filter((Y) => sig(Y) === sig(X) && !ord.includes(Y)));
    const mo = momentDe(g.voies[0].v);
    return { mo, html: `<div class="groupe meme"><span class="t">${I.egal}${gi ? 'même effet' : 'même effet sur tes objectifs'}</span><span class="dose">${g.voies[0].v.actions[0].grammes} g</span>${pill(mo)}</div>
    <div class="rangee">${couloirs(g.voies[0], true)}</div>
    <div class="tab">${ord.map((X, i) => ligne(X, slots, i && sig(ord[i - 1]) !== sig(X) ? ' coupe-l' : '')).join('')}</div>` };
  };
  const blocGeste = (g) => {
    const xs = g.voies.map((n) => V[n - 1]), slots = slotsDe(xs);
    return { mo: g.mo, html: `<div class="groupe"><span class="t">${g.ic}${g.t}</span>${pill(g.mo)}${g.est ? '<span class="est">estimé</span>' : ''}</div>
    ${xs.map((X) => `<div class="tab seul">${ligne(X, slots)}<div class="rangee in">${couloirs(X, false)}</div></div>`).join('')}` };
  };
  let blocs = [...MEMES.map(blocMeme), ...GESTES.map(blocGeste)];
  if (cfg.filtre) blocs = [...blocs.filter((b) => b.mo === cfg.filtre), ...blocs.filter((b) => b.mo !== cfg.filtre)];
  const blocHtml = (b) => `<section class="bloc${cfg.filtre ? (b.mo === cfg.filtre ? ' pris' : ' replie') : ''}" data-moment-bloc="${b.mo}">${b.html}</section>`;
  const barre = cfg.barre || `<a class="cmp" data-role="comparer" href="../../fils15-s5-complexe/q2b/comparer.html">Comparer <b class="nb">(${aj.length})</b></a>`;
  const corps = `${tete('Suggestions')}${cfg.avantTuiles || ''}${reponses(cfg.tuiles || {})}${cfg.avantGraph || ''}
  <div class="graph">${fonds()}
    ${blocs.map(blocHtml).join('')}
  </div>
  ${details()}
  ${barre}${cfg.horsListe || ''}`;
  ecrire(OUT + '/' + cfg.id + '/etat-b.html', page(cfg.titre, cfg.commentaire, CSS_Q2B + (cfg.css || ''), corps, JS_AJC + (cfg.js || '')));
}
const halo = (x, y) => `<i class="doigt" style="left:${x}px;top:${y}px" aria-hidden="true"></i>`;
const IBU_V = Object.fromEntries(V.map((X) => [X.n, [X.v.ibu.after, X.v.ibu.drift]]));

// ---------- b1 · L5, chiffre qui roule et delta : « + » sur Aurum ----------
{
  const X2 = V[1];
  etatB({
    id: 'b1', titre: 'Chiffre qui roule', ajoutees: [1, 15, 2], vient: 2,
    commentaire: 'Lot 17 · b1 · L5 sur q2b : juste après « + » sur Aurum. Le « + » devient ✓ ; l\'IBU de la recette avec Aurum roule de ' + fr(C.ibu) + ' à ' + fr(X2.v.ibu.after) + ' et un « ' + sg(X2.v.ibu.drift) + ' IBU » éphémère donne l\'écart (c1.json, voies[1].ibu) ; le compteur roule de (2) à (3). 250 ms, tout ensemble ; mouvement réduit : remplacement direct, delta gardé 2 s.',
    l1Fin: (X) => (X.n === 2 ? `<output class="ibu-o" aria-live="polite" aria-label="IBU de la recette avec Aurum : ${fr(X.v.ibu.after)}, ${sg(X.v.ibu.drift)}"><span class="rl"><span class="old">${fr(C.ibu)}</span><span class="new">${fr(X.v.ibu.after)}</span></span><small>IBU</small><span class="delta">${sg(X.v.ibu.drift)}</span></output>` : ''),
    barre: `<a class="cmp" data-role="comparer" href="../../fils15-s5-complexe/q2b/comparer.html">Comparer <b class="nb" aria-live="polite"><span class="rl"><span class="old">(2)</span><span class="new">(3)</span></span></b><span class="delta d-n">+1</span></a>`,
    css: `
  .ibu-o { display: inline-flex; align-items: baseline; gap: 2px; margin-left: 4px; padding: 1px 6px; border-radius: 8px; background: #eef0ff; font-variant-numeric: tabular-nums; position: relative; }
  .ibu-o small { font-size: 12px; color: var(--gris); }
  .rl { display: inline-grid; overflow: hidden; height: 1.25em; line-height: 1.25em; font-weight: 800; font-size: 14px; }
  .rl > span { grid-area: 1 / 1; }
  .rl .old { transform: translateY(-110%); visibility: hidden; }
  .rl .new { transform: none; }
  .delta { position: absolute; left: 50%; top: -15px; transform: translateX(-50%); font-size: 12px; font-weight: 800; color: #3730a3; background: #fff; border-radius: 7px; padding: 0 4px; box-shadow: 0 0 0 1.5px #c7c9f7; white-space: nowrap; }
  .cmp { position: fixed; }
  .cmp .d-n { left: auto; right: 104px; top: -12px; transform: none; color: var(--encre); box-shadow: 0 0 0 1.5px #c4c4cc; }
  .cmp .rl { font-size: 16px; }
  .ajc.vient { box-shadow: inset 0 0 0 2px var(--encre), 0 0 0 5px rgba(79,70,229,.18); }
  @media (prefers-reduced-motion: no-preference) {
    .rl .old { animation: sort 250ms ease-out both; }
    .rl .new { animation: entre 250ms ease-out both; }
    .delta { animation: monte 250ms ease-out both; }
    @keyframes sort { from { transform: none; visibility: visible; } to { transform: translateY(-110%); visibility: hidden; } }
    @keyframes entre { from { transform: translateY(110%); } to { transform: none; } }
    @keyframes monte { from { opacity: 0; translate: 0 6px; } to { opacity: 1; translate: 0 0; } }
  }`,
    js: `
  // Après un « + », l'IBU de la recette avec cette voie roule et son écart s'affiche (2 s), le compteur roule.
  window.roulerCompteur = true;
  const IBU = ${JSON.stringify(IBU_V)}, IBU0 = ${C.ibu};
  const fmt = (x) => String(Math.round(x * 10) / 10).replace('.', ',');
  const rouler = (el, ancien, neuf) => { el.innerHTML = '<span class="old">' + ancien + '</span><span class="new">' + neuf + '</span>'; };
  window.apresAjout = (b) => {
    const nb = document.querySelector('.cmp .nb .rl'), n = nbAj();
    rouler(nb, '(' + (n + (b.getAttribute('aria-pressed') === 'true' ? -1 : 1)) + ')', '(' + n + ')');
    document.querySelectorAll('.ibu-o').forEach((o) => o.remove());
    if (b.getAttribute('aria-pressed') !== 'true') return;
    const v = +b.closest('[data-voie]').dataset.voie, [apres, ecart] = IBU[v];
    const o = document.createElement('output'); o.className = 'ibu-o'; o.setAttribute('aria-live', 'polite');
    o.innerHTML = '<span class="rl"><span class="old">' + fmt(IBU0) + '</span><span class="new">' + fmt(apres) + '</span></span><small>IBU</small><span class="delta">' + (ecart > 0 ? '+' : '') + fmt(ecart) + '</span>';
    b.before(o); setTimeout(() => { const d = o.querySelector('.delta'); if (d) d.remove(); }, 2000);
  };`,
    horsListe: '',
  });
}

// ---------- b2 · A2, annuler en un geste : « + » sur Aurum, puis la barre propose « Annuler » ----------
etatB({
  id: 'b2', titre: 'Annuler en un geste', ajoutees: [1, 15, 2], vient: 2,
  commentaire: 'Lot 17 · b2 · A2 sur q2b : juste après « + » sur Aurum. La barre du bas devient « Aurum ✓ · Annuler | Comparer (3) » : elle ne couvre rien de plus que la barre de q2b, ne bloque rien et reste jusqu\'à l\'action suivante (catalogue A2 : pas d\'auto-fermeture sur le web) ; Ctrl+Z annule aussi.',
  barre: `<div class="bas">
    <div class="ann" role="status" aria-live="polite"><span class="st"><b>Aurum</b><i class="ok" aria-hidden="true"></i></span><button class="annuler" data-role="annuler" aria-label="Annuler l'ajout d'Aurum à la comparaison"><svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M5 2 L2 5 L5 8 M2.5 5 H8.5 A3.5 3.5 0 0 1 8.5 12 H6" fill="none" stroke="#fff" stroke-width="1.8"/></svg>Annuler</button></div>
    <a class="cmp" data-role="comparer" href="../../fils15-s5-complexe/q2b/comparer.html">Comparer <b class="nb">(3)</b></a>
  </div>`,
  css: `
  .bas { position: fixed; z-index: 8; left: 50%; transform: translateX(-50%); bottom: 14px; width: 358px; max-width: calc(100% - 32px); height: 50px; display: flex; gap: 6px; }
  .bas .cmp { position: static; transform: none; width: auto; flex: 1; max-width: none; }
  .ann { display: flex; align-items: center; gap: 6px; height: 50px; padding: 0 6px 0 12px; border-radius: 25px; background: #3a3a42; color: #fff; box-shadow: 0 8px 22px rgba(0,0,0,.28); }
  .ann .st { display: inline-flex; align-items: center; gap: 4px; font-size: 14px; }
  .ann .ok { width: 14px; height: 14px; border-radius: 7px; background: #fff; position: relative; }
  .ann .ok::after { content: ''; position: absolute; left: 4.5px; top: 2px; width: 3.5px; height: 7px; border-right: 2px solid #3a3a42; border-bottom: 2px solid #3a3a42; transform: rotate(45deg); }
  .annuler { display: inline-flex; align-items: center; gap: 4px; height: 38px; padding: 0 10px; border-radius: 19px; background: #16161a; color: #fff; font-size: 14px; font-weight: 700; box-shadow: inset 0 0 0 1.5px #8f8f99; }
  .ajc.vient { box-shadow: inset 0 0 0 2px var(--encre), 0 0 0 5px rgba(22,22,26,.16); }
  @media (prefers-reduced-motion: no-preference) {
    .ann { animation: ann-in 200ms ease-out both; }
    @keyframes ann-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
  }`,
  js: `
  // L'annulation reste offerte jusqu'à l'action suivante ; un nouveau « + » la remplace.
  let dernier = document.querySelector('[data-voie="2"] [data-role="ajouter-comparer"]');
  const ann = document.querySelector('.ann'), nb = document.querySelector('.cmp .nb');
  const maj = () => { nb.textContent = '(' + nbAj() + ')'; };
  window.apresAjout = (b) => { dernier = b; const on = b.getAttribute('aria-pressed') === 'true'; const nom = b.closest('[data-voie]').querySelector('.l1 b').textContent; ann.querySelector('.st b').textContent = nom; ann.querySelector('.ok').style.display = on ? '' : 'none'; ann.hidden = false; maj(); };
  const annuler = () => { if (!dernier || ann.hidden) return; dernier.setAttribute('aria-pressed', String(dernier.getAttribute('aria-pressed') !== 'true')); ann.hidden = true; maj(); dernier.focus(); };
  document.querySelector('[data-role="annuler"]').addEventListener('click', annuler);
  document.addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); annuler(); } });`,
});

// ---------- b3 · C6, focus et contexte : toucher le floral dans sa tuile ----------
etatB({
  id: 'b3', titre: 'Focus sur le floral',
  commentaire: 'Lot 17 · b3 · C6 sur q2b : juste après un toucher sur le picto floral de la tuile « Plus floral ». Le floral reste net dans toutes les voies (cases, barres, libellés des barres), le reste pâlit à 28 % ; retoucher le picto, ou toucher un autre picto de famille, change le focus. Le picto est un bouton (aria-pressed), jamais un survol.',
  tuiles: { pictoT: (f) => `<button class="foc${f === 'floral' ? ' on' : ''}" data-role="focus" data-focus="${f}" aria-pressed="${f === 'floral'}" aria-label="Mettre ${NOM[f].toLowerCase()} en avant dans toutes les voies">${picto(f, 18)}</button>` },
  avantGraph: '',
  css: `
  .foc { display: inline-flex; border-radius: 50%; padding: 2px; margin: -2px; position: relative; }
  .foc.on { box-shadow: 0 0 0 2.5px var(--encre); background: #fff; }
  .foc.on::after { content: ''; position: absolute; left: -9px; top: -9px; width: 40px; height: 40px; border-radius: 50%; background: rgba(22,22,26,.12); box-shadow: 0 0 0 2px rgba(22,22,26,.25); pointer-events: none; }
  body[data-focus] .cf { transition: opacity 150ms; }
  body[data-focus="floral"] .cf:not([data-famille="floral"]), body[data-focus="floral"] .bar:not([data-famille="floral"]), body[data-focus="floral"] .hs,
  body[data-focus="floral"] .zt, body[data-focus="floral"] .lab-i:not(.f-floral), body[data-focus="floral"] .tuile:not(.floral) { opacity: .28; }
  body[data-focus="floral"] .ln.a .zt { opacity: 1; }
  body[data-focus="floral"] .cf[data-famille="floral"] .pi { box-shadow: 0 0 0 1.5px #fff, 0 0 0 3.5px #9f5cc0; opacity: 1; }
  body[data-focus="floral"] .bar[data-famille="floral"] { box-shadow: inset 0 0 0 2px #7a3f9b; }
  body[data-focus="floral"] .tuile.floral { box-shadow: inset 0 0 0 2.5px #7a3f9b; }`,
    js: `
  // Un seul focus à la fois : la famille touchée (tuile ou case) reste nette partout, le reste pâlit.
  document.body.dataset.focus = 'floral';
  const regle = document.createElement('style'); document.head.append(regle);
  const poser = (f) => {
    const deja = document.body.dataset.focus === f;
    document.querySelectorAll('.foc').forEach((b) => { const on = !deja && b.dataset.focus === f; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
    if (deja) { delete document.body.dataset.focus; regle.textContent = ''; return; }
    document.body.dataset.focus = f;
    if (f !== 'floral') regle.textContent = 'body[data-focus="' + f + '"] .cf:not([data-famille="' + f + '"]), body[data-focus="' + f + '"] .bar:not([data-famille="' + f + '"]), body[data-focus="' + f + '"] .zt, body[data-focus="' + f + '"] .lab-i:not(.f-' + f + ') { opacity: .28; } body[data-focus="' + f + '"] .cf[data-famille="' + f + '"] .pi { box-shadow: 0 0 0 1.5px #fff, 0 0 0 3.5px #16161a; opacity: 1; }';
    else regle.textContent = '';
  };
  document.querySelectorAll('.foc').forEach((b) => b.addEventListener('click', () => poser(b.dataset.focus)));
  document.querySelectorAll('.cf[data-famille]').forEach((c) => c.addEventListener('click', () => poser(c.dataset.famille)));`,
});

// ---------- b4 · H4, filtres par moment avec compteur : toucher « 60′ ×3 » ----------
{
  const compte = {}; for (const X of V) compte[momentDe(X.v)] = (compte[momentDe(X.v)] || 0) + 1;
  const ORDM = ['b60', 'b10', 'wp', 'dryActive', 'dryPost', 'levure'].filter((m) => compte[m]);
  const puce = (m, on) => { const [t, ic, lg] = MOMENT[m]; return `<button class="fm${on ? ' on touche' : ''}" data-role="filtre-moment" data-moment="${m}" aria-pressed="${on}" aria-label="Voies ${lg} : ${compte[m]}">${ic}<span>${t}</span><b>×${compte[m]}</b></button>`; };
  const frise = `<div class="frise" role="group" aria-label="Filtrer les voies par moment">
    <button class="fm" data-role="filtre-moment" data-moment="" aria-pressed="false" aria-label="Toutes les voies : ${V.length}"><span>Tout</span><b>×${V.length}</b></button>${ORDM.map((m) => puce(m, m === 'b60')).join('')}</div>`;
  etatB({
    id: 'b4', titre: 'Filtrer par moment', filtre: 'b60',
    commentaire: 'Lot 17 · b4 · H4 sur q2b : juste après un toucher sur « 60′ ×3 » dans la frise des moments (comptes tirés de c1.json). Les trois voies à 60′ passent en tête, en entier ; les autres restent visibles mais repliées (sans leur barre) et pâles, pour qu\'aucun filtre caché n\'explique une liste vide (H4) et que chaque moment garde une voie à l\'écran (D78). « Tout ×17 » remet la liste.',
    avantGraph: frise,
    css: `
  .frise { position: relative; display: flex; gap: 4px; overflow-x: auto; padding: 7px 4px 7px; margin: -5px -4px; }
  .fm { position: relative; display: inline-flex; align-items: center; gap: 3px; height: 30px; padding: 0 7px; border-radius: 15px; background: #fff; box-shadow: inset 0 0 0 1.5px #b9b9c2; font-size: 13px; font-weight: 700; white-space: nowrap; flex: none; }
  .fm b { font-weight: 650; color: var(--gris); font-variant-numeric: tabular-nums; }
  .fm.on { background: var(--encre); color: #fff; box-shadow: none; }
  .fm.on b { color: #d6d6dd; }
  .fm.on svg path, .fm.on svg circle { stroke: #fff; }
  .fm.touche::after { content: ''; position: absolute; inset: -5px; border-radius: 20px; background: rgba(22,22,26,.10); box-shadow: 0 0 0 2px rgba(22,22,26,.26); pointer-events: none; }
  .bloc.replie .l1, .bloc.replie .cases, .bloc.replie .groupe > * { opacity: .45; }
  .bloc.replie .rangee { display: none; }
  .bloc.replie .tab.seul .vr { padding-bottom: 4px; }
  .bloc.pris + .bloc.replie { margin-top: 6px; padding-top: 8px; border-top: 2px dashed #b9b9c2; }
  .graph { display: flex; flex-direction: column; }
  @media (prefers-reduced-motion: no-preference) { .bloc { transition: opacity 200ms; } }`,
    js: `
  // Filtrer par moment : le moment choisi en tête et en entier, les autres repliés et pâles (jamais cachés).
  const graph = document.querySelector('.graph'), blocs = [...graph.querySelectorAll('.bloc')], ordre0 = blocs.slice();
  const filtrer = (m) => {
    document.querySelectorAll('[data-role="filtre-moment"]').forEach((b) => { const on = b.dataset.moment === m && !!m; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
    const pris = m ? ordre0.filter((b) => b.dataset.momentBloc === m) : ordre0, autres = m ? ordre0.filter((b) => b.dataset.momentBloc !== m) : [];
    [...pris, ...autres].forEach((b) => { graph.append(b); b.classList.toggle('pris', !!m && pris.includes(b)); b.classList.toggle('replie', autres.includes(b)); });
    document.querySelectorAll('.fm.touche').forEach((x) => x.classList.remove('touche'));
  };
  document.querySelectorAll('[data-role="filtre-moment"]').forEach((b) => b.addEventListener('click', () => filtrer(b.classList.contains('on') ? '' : b.dataset.moment)));`,
  });
}

// ---------- b5 · X3, appui long : l'aperçu de la fiche (g1) de Nelson Sauvin ----------
{
  const CIBLE = 9; // Ajouter Nelson Sauvin 10 g à 10′ : le houblon de l'exemple du brasseur
  const houblons = [...new Set(V.flatMap((X) => (X.v.fiches || []).map((h) => h.houblon)))];
  const usageDe = (nom) => V.flatMap((X) => X.v.fiches || []).find((h) => h.houblon === nom);
  const apercu = (nom, ouvert) => {
    const f = FICHES.find((x) => x.name === nom); if (!f) return '';
    const srcs = f.alpha.sources, aMin = Math.min(...srcs.map((s) => s.min)), aMax = Math.max(...srcs.map((s) => s.max));
    const ret = f.alpha.retenu, lot = ret && /stock|article/.test(ret.from) ? `<span class="lot">${/stock/.test(ret.from) ? 'lot' : 'article'} ${fr(ret.value)} %</span>` : '';
    const ar = f.aromes, of = (ar[0] || {}).of || 0;
    const bandeF = ORDRE.map((fa, i) => { const a = ar.find((x) => x.family === fa) || { sources: 0 }; return `<i class="c${a.sources >= 2 ? ' m' : a.sources === 1 ? ' ci' : ''}${i === 3 ? ' sep' : ''}" style="--c:${COUL[fa]}"></i>`; }).join('');
    const decrites = ORDRE.map((fa) => ar.find((x) => x.family === fa)).filter((a) => a && a.sources > 0);
    const lignes = decrites.map((a) => `<div class="fl-l"><i class="c ${a.sources >= 2 ? 'm' : 'ci'}" style="--c:${COUL[a.family]}"></i><span><b>${NOM[a.family]}</b> ${of === 1 ? '' : a.sources + '/' + of}${a.premier && a.premier.length ? ' · nommé en premier' : ''}<br><span class="mots">${[...new Set(a.mots.flatMap((m) => m.mots))].join(', ')}</span></span></div>`).join('');
    const sans = [...new Set((f.motsSansFamille || []).filter((m) => m.source === 'Beer Maverick').map((m) => m.mot))];
    const nd = ORDRE.filter((fa) => !decrites.some((a) => a.family === fa));
    const u = usageDe(nom);
    return `<div class="apercu${ouvert ? ' ouvert' : ''}" data-apercu="${nom}" role="dialog" aria-label="Aperçu de la fiche de ${nom}">
      <div class="ap-t"><b>${nom}</b>${u ? usage(u).replace('data-role="usage"', 'data-role="usage-fiche"') : ''}<span class="ap-r">${u ? (u.role || 'inconnu') : ''}</span></div>
      <div class="ap-a"><span class="g">α</span> <b>${fr(aMin)}–${fr(aMax)} %</b>${lot}</div>
      <div class="ap-b">${bandeF}</div>
      ${lignes}
      ${sans.length ? `<div class="sansf">sans famille : <span class="mots">${sans.join(', ')}</span></div>` : ''}
      <div class="nd">${nd.length} non décrites : ${nd.map((fa) => NOM[fa]).join(', ')}</div>
    </div>`;
  };
  etatB({
    id: 'b5', titre: 'Appui long, la fiche',
    commentaire: 'Lot 17 · b5 · X3 sur q2b : pendant l\'appui long sur « Nelson Sauvin » (voie 9, 10 g à 10′). Le nom se remplit (le fond gris de la base), l\'aperçu de sa fiche g1 s\'ouvre sous la ligne : α des sources, usage, bande de 12 cases, une ligne par famille décrite avec ses fiches et leurs mots, les mots sans famille (vin blanc, groseille à maquereau, raisin, sauvignon blanc : ce que Nelson Sauvin ajoute et que le modèle ne range dans aucune famille), les familles non décrites. Relâcher le referme ; un toucher simple sur le nom pointillé ouvre la même fiche.',
    nom: (X, nom) => {
      const hs = (X.v.fiches || []).map((h) => h.houblon);
      if (!hs.length) return `<b>${nom}</b>`;
      if (X.v.type === 'assemblage') return `<b>${hs.map((h) => `<span class="hn" data-houblon="${h}" tabindex="0" role="button" aria-haspopup="dialog">${h}</span>`).join(' + ')}</b>`;
      return `<b><span class="hn${X.n === CIBLE ? ' appui' : ''}" data-houblon="${hs[0]}" tabindex="0" role="button" aria-haspopup="dialog">${hs[0]}</span></b>`;
    },
    dansLigne: (X) => (X.n === CIBLE ? apercu('Nelson Sauvin', true) + halo(52, 0).replace('class="doigt"', 'class="doigt d-ap"') : ''),
    horsListe: `<div class="modeles" hidden>${houblons.map((h) => apercu(h, false)).join('')}</div>`,
    css: `
  .hn { text-decoration: underline dotted #9a9aa3; text-decoration-thickness: 1.5px; text-underline-offset: 3px; -webkit-touch-callout: none; user-select: none; cursor: pointer; border-radius: 4px; }
  .hn.appui { background: #dcdce2; box-shadow: 0 0 0 3px #dcdce2; }
  .tab.seul { position: relative; }
  .d-ap { position: absolute; }
  .apercu { position: absolute; left: 4px; right: 4px; top: 36px; z-index: 12; background: #fff; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,.24), 0 0 0 1px rgba(0,0,0,.06); padding: 10px 12px 12px; display: flex; flex-direction: column; gap: 6px; font-size: 13px; }
  .modeles .apercu { position: static; }
  .ap-t { display: flex; align-items: center; gap: 6px; }
  .ap-t > b { font-size: 18px; font-weight: 650; }
  .ap-r { margin-left: auto; font-size: 12px; padding: 1px 8px; border-radius: 10px; border: 1px solid #b9b9c2; color: var(--gris); }
  .ap-a .g { color: var(--gris); } .ap-a b { font-size: 16px; font-weight: 650; } .lot { margin-left: 6px; font-size: 12px; color: var(--gris2); }
  .ap-b { display: flex; gap: 3px; padding: 6px 8px; border-radius: 10px; background: var(--fond); }
  .apercu .c { display: inline-block; width: 13px; height: 18px; border-radius: 2px; background: #e6e6e6; flex: none; }
  .apercu .c.ci { background: color-mix(in srgb, var(--c) 42%, #fff); } .apercu .c.m { background: var(--c); }
  .apercu .c.sep { margin-left: 6px; }
  .fl-l { display: grid; grid-template-columns: 13px 1fr; gap: 10px; align-items: start; color: var(--gris); font-size: 12px; line-height: 1.35; }
  .fl-l b { font-size: 14px; font-weight: 650; color: var(--encre); }
  .mots { color: var(--encre); }
  .sansf, .nd { font-size: 12px; color: var(--gris); line-height: 1.35; padding-left: 23px; }
  @media (prefers-reduced-motion: no-preference) {
    .apercu.ouvert { animation: ap-in 200ms ease-out both; transform-origin: 30% 0; }
    .hn.appui { transition: background 450ms linear; }
    @keyframes ap-in { from { opacity: 0; transform: scale(.96); } to { opacity: 1; transform: none; } }
  }`,
    js: `
  // Appui long (450 ms, annulé au-delà de 8 px) : l'aperçu de la fiche ; relâcher le referme. Un toucher simple
  // ou Entrée sur le nom pointillé ouvre la même fiche et la laisse ouverte (l'appui long n'est qu'un raccourci).
  const fermer = () => { document.querySelectorAll('.apercu.ouvert').forEach((a) => a.remove()); document.querySelectorAll('.hn.appui').forEach((h) => h.classList.remove('appui')); document.querySelectorAll('.d-ap').forEach((d) => d.remove()); };
  const ouvrir = (hn) => {
    fermer(); const m = document.querySelector('.modeles [data-apercu="' + hn.dataset.houblon + '"]'); if (!m) return;
    const a = m.cloneNode(true); a.classList.add('ouvert'); const vr = hn.closest('.vr');
    vr.style.position = 'relative'; a.style.top = (hn.getBoundingClientRect().bottom - vr.getBoundingClientRect().top + 8) + 'px'; vr.append(a); hn.classList.add('appui');
  };
  let t = null, x0 = 0, y0 = 0, long = false;
  document.querySelectorAll('.hn').forEach((hn) => {
    hn.addEventListener('pointerdown', (e) => { long = false; x0 = e.clientX; y0 = e.clientY; hn.classList.add('appui'); t = setTimeout(() => { long = true; ouvrir(hn); }, 450); });
    hn.addEventListener('pointermove', (e) => { if (t && Math.hypot(e.clientX - x0, e.clientY - y0) > 8) { clearTimeout(t); t = null; hn.classList.remove('appui'); } });
    hn.addEventListener('pointerup', () => { clearTimeout(t); t = null; if (long) fermer(); else ouvrir(hn); });
    hn.addEventListener('pointercancel', () => { clearTimeout(t); t = null; fermer(); });
    hn.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ouvrir(hn); } if (e.key === 'Escape') fermer(); });
    hn.addEventListener('contextmenu', (e) => { e.preventDefault(); ouvrir(hn); });
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fermer(); });`,
  });
}

// ---------- b6 · J6, aperçu fantôme : toucher la voie Nelson Sauvin 10′ projette ses barres sur les tuiles ----------
{
  const CIBLE = 9;
  const XC = V[CIBLE - 1];
  const fantomeResin = (X) => { const e = X.v.effet.resin; return `<svg class="fr" width="64" height="12" viewBox="0 0 64 12" aria-hidden="true"><defs><pattern id="hachure-r" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="4" height="4" fill="#fff"/><rect width="1.6" height="4" fill="#9aa0ab"/></pattern></defs>${e.etabli ? `<rect x="${64 - Math.max(3, Math.round(Math.abs(e.central) / 10 / 3 * 64))}" y="2" width="${Math.max(3, Math.round(Math.abs(e.central) / 10 / 3 * 64))}" height="8" rx="3" fill="#2f6b5f" fill-opacity=".4" stroke="#2f6b5f" stroke-dasharray="3 2"/>` : '<rect x="49" y="2.5" width="14" height="7.5" rx="3" fill="url(#hachure-r)" stroke="#6e6e78" stroke-width="1.3"/>'}</svg>`; };
  etatB({
    id: 'b6', titre: 'Aperçu fantôme',
    commentaire: 'Lot 17 · b6 · J6 sur q2b : juste après un toucher sur la voie « Nelson Sauvin » (10′, voie 9). Ses barres se projettent en fantôme (contour pointillé, 40 %) sur les tuiles d\'objectif, sous la barre de la meilleure voie : agrumes +1,6 cran, au-delà de la visée ; floral et résineux hachurés (effet non établi : rien d\'inventé). La bascule « Avant / Après » montre ou retire le fantôme ; retoucher la voie le retire.',
    tuiles: { fantome: XC, fantomeResin },
    avantGraph: '</div>',
    avantTuiles: `<div class="tete-f"><div class="av-ap"><span class="qui"><b>${nomVoie(XC.v).nom}</b>${pill(momentDe(XC.v))}</span><div class="seg ap" role="group" aria-label="Fantôme de la voie sur les objectifs"><button aria-pressed="false" data-ap="avant">Avant</button><button aria-pressed="true" data-ap="apres">Après</button></div></div>`,
    vrCls: (X) => (X.n === CIBLE ? ' touche' : ''),
    nom: (X, nom) => `<button class="pj${X.n === CIBLE ? ' on' : ''}" data-role="projeter" aria-pressed="${X.n === CIBLE}" aria-label="Projeter ${nom} sur les objectifs"><b>${nom}</b></button>`,
    l1Fin: (X) => (X.n === CIBLE ? halo(26, -6) : ''),
    css: `
  .tete-f { position: sticky; top: 0; z-index: 7; background: #fff; display: flex; flex-direction: column; gap: 8px; padding: 4px 0 6px; margin: -4px 0 -6px; }
  body.avant .tete-f { position: static; }
  .ecran { overflow-x: clip; }
  .av-ap { display: flex; align-items: center; gap: 8px; }
  .av-ap .qui { display: inline-flex; align-items: center; gap: 5px; font-size: 13px; }
  .seg.ap { flex: none; margin-left: auto; }
  .seg.ap button { padding: 0 12px; }
  .seg.ap button[aria-pressed="true"] { background: #fff; color: var(--encre); font-weight: 650; box-shadow: 0 1px 2px rgba(0,0,0,.12); }
  .tuile .fr { margin-top: 2px; align-self: flex-end; }
  .pj { padding: 0; text-align: left; }
  .vr.touche { background: #f3f3ff; box-shadow: inset 0 0 0 2px #4f46e5; border-radius: 10px; margin: 2px -4px; padding-left: 4px; padding-right: 4px; }
  .vr.touche .doigt { left: 20px; top: -4px; }
  body.avant .cible.fantome rect:nth-of-type(n+3), body.avant .tuile .fr { opacity: 0; }
  @media (prefers-reduced-motion: no-preference) {
    .cible.fantome rect:nth-of-type(3), .tuile .fr { animation: fant 200ms ease-out both; }
    @keyframes fant { from { opacity: 0; } to { opacity: 1; } }
  }`,
    js: `
  // Avant / Après : la bascule visible du fantôme ; retoucher la voie retire le fantôme (le maintien n'est qu'un raccourci).
  document.querySelectorAll('.seg.ap [data-ap]').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('.seg.ap [data-ap]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    document.body.classList.toggle('avant', b.dataset.ap === 'avant');
  }));
  document.querySelectorAll('[data-role="projeter"]').forEach((b) => b.addEventListener('click', () => {
    const on = b.getAttribute('aria-pressed') !== 'true';
    document.querySelectorAll('[data-role="projeter"]').forEach((x) => { x.setAttribute('aria-pressed', 'false'); x.classList.remove('on'); x.closest('.vr').classList.remove('touche'); });
    document.querySelectorAll('.doigt').forEach((d) => d.remove());
    if (on && b.closest('[data-voie]').dataset.voie === '${CIBLE}') { b.setAttribute('aria-pressed', 'true'); b.classList.add('on'); b.closest('.vr').classList.add('touche'); document.body.classList.remove('avant'); }
    else document.body.classList.add('avant');
  }));`,
  });
}
