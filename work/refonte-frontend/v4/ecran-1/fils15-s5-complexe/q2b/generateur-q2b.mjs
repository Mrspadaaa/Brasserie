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
const OUT = BASE + '/q2b';
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
  if (lab) h += `<span class="lab-i" style="--s:${p(b.s)};--a:${p(b.a)}">${lab}</span>`;
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
function cible(frac, visee) {
  const w = 64, x = Math.round(visee * w), b = Math.round(Math.min(1, frac) * w);
  return `<svg class="cible" width="${w}" height="26" viewBox="0 0 ${w} 26" aria-hidden="true"><rect x="0" y="9" width="${w}" height="8" rx="4" fill="#fff"/><rect x="0" y="9" width="${b}" height="8" rx="4" fill="var(--k)"/><line x1="${x}" y1="1" x2="${x}" y2="25" stroke="#16161a" stroke-width="2.5" stroke-dasharray="4 3"/></svg>`;
}
function meilleure(f, sens) {
  const c = V.filter((X) => X.v.effet[f].etabli && !X.hs.size);
  return c.length ? c.reduce((b, X) => ((sens > 0 ? X.v.effet[f].central > b.v.effet[f].central : X.v.effet[f].central < b.v.effet[f].central) ? X : b)) : null;
}
function reponses() {
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
      <span class="nom"><span class="pa">${picto('resin', 18)}<i class="alerte"></i></span>Moins résineux</span>
      <div class="rep v-${dRe}" data-role="reponse" data-famille="resin" data-verdict="${dRe}">${MOT[dRe]}<small>voie houblon</small></div>
      <button class="hh-b" onclick="var d=document.getElementById('hh');d.open=true;d.scrollIntoView({behavior:'smooth'})">Hors houblon<svg width="8" height="10" viewBox="0 0 8 10" aria-hidden="true"><path d="M2 1 L6 5 L2 9" fill="none" stroke="#1f5247" stroke-width="2"/></svg></button>
    </section>
    <section class="tuile floral" data-role="objectif" data-famille="floral" aria-label="Plus floral : la meilleure voie, ${nomVoie(fl.v).nom}, ${MOT[dFl].toLowerCase()} la visée (${fr(OB.floral.maBiere.central)} → ${fr(vFl)}, visée ${fr(OB.floral.visee)})" style="--k:#9f5cc0">
      <span class="nom">${picto('floral', 18)}Plus floral</span>
      <div class="rep v-${dFl}" data-role="reponse" data-famille="floral" data-verdict="${dFl}">${MOT[dFl]}</div>
      ${cible(frFl / 1.15, 1 / 1.15)}
    </section>
    <section class="tuile citrus" data-role="objectif" data-famille="citrus" aria-label="Plus agrumes : la meilleure voie, ${nomVoie(ci.v).nom}, ${MOT[dCi].toLowerCase()} la visée (${fr(OB.citrus.maBiere.central)} → ${fr(vCi)}, visée ${fr(OB.citrus.visee)})" style="--k:#c9a300">
      <span class="nom">${picto('citrus', 18)}Plus agrumes</span>
      <div class="rep v-${dCi}" data-role="reponse" data-famille="citrus" data-verdict="${dCi}">${MOT[dCi]}</div>
      ${cible(frCi / 1.7, 1 / 1.7)}
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

// ======================= q2b · etat-b.html =======================
const AJOUTEES = [1, 15];
const ENS = C.ensemble.find((e) => e.voies.join() === '1,15');
{
  const groupesEffet = [];
  for (const X of V) { const k = JSON.stringify(X.v.effet); const g = groupesEffet.find((x) => x.k === k); if (g) g.voies.push(X); else groupesEffet.push({ k, voies: [X] }); }
  const memes = groupesEffet.filter((g) => g.voies.length > 1);
  const seuls = new Set(groupesEffet.filter((g) => g.voies.length === 1).map((g) => g.voies[0].n));
  const slotsDe = (xs) => ORDRE.filter((f) => !OBJ.includes(f) && xs.some((X) => X.extras.some((t) => t.famille === f)));
  const ajc = (X) => { const { nom } = nomVoie(X.v), on = AJOUTEES.includes(X.n); return `<button class="ajc" data-role="ajouter-comparer" aria-pressed="${on}" aria-label="${on ? 'Retirer ' + nom + ' de la comparaison' : 'Ajouter ' + nom + ' à la comparaison'}"></button>`; };
  const ligne = (X, slots, cls = '') => {
    const { nom, q } = nomVoie(X.v);
    const dose = X.v.type === 'assemblage' ? '<span class="q">5+5 g ≈</span>' : q ? `<span class="q">${q}</span>` : '';
    return `<div class="vr${cls}" data-voie="${X.n}">
        <div class="l1">${usages(X.v)}<b>${nom}</b><span class="gr">${dose}${stockMarque(X.v)}</span>${bioPill(X)}${ajc(X)}</div>
        ${casesVoie(X, slots)}
      </div>`;
  };
  const blocMeme = (g, gi) => {
    const slots = slotsDe(g.voies);
    const sig = (X) => X.extras.map((t) => t.famille).join();
    const ord = []; for (const X of g.voies) if (!ord.includes(X)) ord.push(...g.voies.filter((Y) => sig(Y) === sig(X) && !ord.includes(Y)));
    const dose = g.voies[0].v.actions[0].grammes + ' g';
    return `<div class="groupe meme"><span class="t">${I.egal}${gi ? 'même effet' : 'même effet sur tes objectifs'}</span><span class="dose">${dose}</span>${pill(momentDe(g.voies[0].v))}</div>
    <div class="rangee">${couloirs(g.voies[0], true)}</div>
    <div class="tab">${ord.map((X, i) => ligne(X, slots, i && sig(ord[i - 1]) !== sig(X) ? ' coupe-l' : '')).join('')}</div>`;
  };
  const GESTES = [
    { t: 'Assembler 5 + 5 g', ic: I.arome, mo: 'b10', est: true, voies: [6, 8] },
    { t: 'Remplacer Nugget', ic: I.amer, mo: 'b60', voies: [12, 13, 14] },
    { t: 'Dry hop', ic: I.arome, mo: 'dryActive', est: true, voies: [15] },
    { t: 'Changer de levure', ic: '', mo: 'levure', est: true, voies: [16, 17] },
  ].map((g) => ({ ...g, voies: g.voies.filter((n) => seuls.has(n)) })).filter((g) => g.voies.length);
  const blocGeste = (g) => {
    const xs = g.voies.map((n) => V[n - 1]), slots = slotsDe(xs);
    return `<div class="groupe"><span class="t">${g.ic}${g.t}</span>${pill(g.mo)}${g.est ? '<span class="est">estimé</span>' : ''}</div>
    ${xs.map((X) => `<div class="tab seul">${ligne(X, slots)}<div class="rangee in">${couloirs(X, false)}</div></div>`).join('')}`;
  };
  const corps = `${tete('Suggestions')}${reponses()}
  <div class="graph">${fonds()}
    ${memes.map(blocMeme).join('')}
    ${GESTES.map(blocGeste).join('')}
  </div>
  ${details()}
  <a class="cmp" data-role="comparer" href="comparer.html">Comparer <b class="nb">(${AJOUTEES.length})</b></a>`;
  const css = `
  .tab.seul { background: none; box-shadow: none; padding: 0; margin: 0 0 4px; border-top: 1px solid var(--trait); border-radius: 0; z-index: auto; }
  .tab.seul .vr { padding: 6px 6px 2px; }
  .tab.seul .l1 b, .tab.seul .gr, .tab.seul .us { background: #fff; border-radius: 7px; padding: 1px 4px; }
  .tab.seul .cases { background: #fff; border-radius: 9px; padding: 2px 4px 0; width: max-content; position: relative; z-index: 2; }
  .tab.seul .ajc { position: relative; z-index: 2; }
  .tab.seul .rangee.in { padding: 4px 0 8px; }`;
  const js = `
  document.querySelectorAll('[data-role="ajouter-comparer"]').forEach((b) => b.addEventListener('click', () => {
    b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'));
    document.querySelector('.cmp .nb').textContent = '(' + document.querySelectorAll('[data-role="ajouter-comparer"][aria-pressed="true"]').length + ')';
  }));`;
  ecrire(OUT + '/etat-b.html', page('Même effet, autre extra', 'Lot 15 · q2b (c1), à partir de q2, que le brasseur retient. Les voies au même effet sur les objectifs (1 à 7, 9 à 11) : la barre s5 une fois, puis le tableau : une ligne par voie, l\'usage du houblon (goutte, arôme, les deux ; pâle si déduit de l\'α), le stock en petite marque, une case par famille : picto (plein marqué, pâle cité) et jauge d\'un trait par cran du style (tout[].crans), orangée hors du style. Les autres voies : la même ligne, puis leur barre s5. « + » ajoute la voie à Comparer.', css, corps, js));
}

// ======================= q2b · comparer.html : 1, 15 et ensemble [1, 15] =======================
{
  const ensHs = new Set(ENS.tout.filter((t) => t.apres != null && t.apres > t.bande[1]).map((t) => t.famille));
  const fichesE = [...V[0].v.fiches, ...V[14].v.fiches];
  const XE = { n: 'ensemble', v: { tout: ENS.tout.map((t) => ({ ...t, crans: r1(t.effet / cran(t.famille)) })), fiches: fichesE, effet: Object.fromEntries(OBJ.map((f) => { const t = ENS.tout.find((x) => x.famille === f); return [f, { central: t ? t.effet : null, etabli: !!t }]; })), bio: V[14].v.bio, ibu: { after: ENS.ibu } }, hs: ensHs, extras: ENS.tout.filter((t) => !t.visee && Math.abs(t.effet) >= 0.5) };
  const cols = [V[0], V[14], XE];
  const bouge = new Set(cols.flatMap((X) => X.extras.map((t) => t.famille)));
  const lignes = [...OBJ, ...ORDRE.filter((f) => !OBJ.includes(f) && bouge.has(f))];
  const rien = ORDRE.filter((f) => !OBJ.includes(f) && !bouge.has(f));
  const RS = 3, LS = 1, RA = 50, LA = 50 / 3;
  const bioSig = (X) => new Set((X.v.bio || []).flatMap((h) => h.signaux.map((s) => s.id)));
  const cell = (X, f) => {
    const obj = OBJ.includes(f);
    const t = X.v.tout.find((x) => x.famille === f);
    const ex = !obj && t && Math.abs(t.effet) >= 0.5 ? t : null;
    const e = obj ? X.v.effet[f] : ex ? { central: ex.effet, etabli: true } : null;
    const a0 = AVANT[f], [b0, b1] = bande(f), c = cran(f);
    const z = f === 'resin' ? null : a0 == null ? undefined : { rS: (b1 - a0) / c / RS * 100, lS: (a0 - b0) / c / LS * 100, rA: (b1 - a0) / RA * 100, lA: (a0 - b0) / LA * 100 };
    let L = z ? ztEl(f, z.lS, z.lA) : '', R = z ? ztEl(f, z.rS, z.rA) : '', num = '';
    if (obj && f !== 'resin') R += `<i class="vt" style="--s:${p((OB[f].visee - OB[f].maBiere.central) / OB[f].cran / RS * 100)};--a:${p((OB[f].visee - OB[f].maBiere.central) / RA * 100)}"></i>`;
    if (e && !e.etabli) { if (f === 'resin') L += '<i class="nb-i"></i>'; else R += '<i class="nb-i"></i>'; num = '<span class="cn ne">non établi</span>'; }
    else if (e && e.central != null) {
      const n = niv(X.v, f, e.central), cr = r1(e.central / c);
      const sR = Math.abs(e.central) / c / (e.central < 0 ? LS : RS) * 100, aR = Math.abs(e.central) / (e.central < 0 ? LA : RA) * 100;
      const b = { s: Math.min(100, sR), a: Math.min(100, aR) };
      let h = `<i class="cb ${n}" style="--c:${COUL[f]};--s:${p(b.s)};--a:${p(b.a)}"></i>`;
      if (X.hs.has(f)) { const zs = z ? z.rS : b.s - 6, za = z ? z.rA : b.a - 6; h += `<i class="cb-hs" style="--s0:${p(Math.min(cl(zs), b.s))};--s1:${p(Math.max(0, b.s - cl(zs)))};--a0:${p(Math.min(cl(za), b.a))};--a1:${p(Math.max(0, b.a - cl(za)))}"></i>`; }
      const bs = bioSig(X);
      if (bs.has('geraniol-citronellol') && f === 'floral') h += `<i class="td moins" style="--s:${p(b.s)};--a:${p(b.a)}"></i>`;
      if ((bs.has('geraniol-citronellol') && f === 'citrus') || (bs.has('thiols') && f === 'tropical')) h += `<i class="td plus" style="--s:${p(b.s)};--a:${p(b.a)}"></i>`;
      if (e.central < 0) L += h; else R += h;
      num = `<span class="cn${X.hs.has(f) ? ' xs' : ''}">${(cr > 0 ? '+' : '') + fr(cr)}</span>`;
    }
    const attr = ex ? ` data-role="extra" data-famille="${f}" data-crans="${r1(ex.effet / c)}"` : e && e.etabli ? ` data-famille="${f}" data-crans="${r1(e.central / c)}"` : '';
    return `<div class="cel${obj ? ' o' : ''}${z === undefined ? ' ns' : ''}"${attr}>${num}<div class="cl">${L}</div><div class="cr">${R}</div></div>`;
  };
  const tete2 = (X) => {
    if (X.n === 'ensemble') return `<div class="hd"><b>ensemble</b><span class="mos">${pill('b10')}${pill('dryActive')}</span><span class="ib">IBU ${fr(ENS.ibu)}</span></div>`;
    const { nom, q } = nomVoie(X.v);
    const dose = q || X.v.actions[0].grammes + ' g';
    return `<div class="hd"><span class="l1">${usages(X.v)}<b>${nom}</b></span><span class="mos">${pill(momentDe(X.v))}<span class="q">${dose}</span>${stockMarque(X.v)}</span><span class="ib">IBU ${fr(X.v.ibu.after)}</span></div>`;
  };
  const colonne = (X) => `<div class="col${X.n === 'ensemble' ? ' ens' : ''}" ${X.n === 'ensemble' ? 'data-ensemble="1,15"' : `data-voie="${X.n}"`} aria-label="${X.n === 'ensemble' ? 'Ensemble : ' + ENS.libelles.join(' et ') : X.v.libelle}">
      ${tete2(X)}
      <div class="corps">${lignes.map((f, i) => (i === OBJ.length ? '<div class="sep"></div>' : '') + cell(X, f)).join('')}</div>
      <div class="cbio">${bioPill(X)}</div>
    </div>`;
  const lab = `<div class="lab"><div class="hd"></div>
      ${lignes.map((f, i) => (i === OBJ.length ? '<div class="sep"></div>' : '') + `<div class="lf${OBJ.includes(f) ? ' o' : ''}"><span class="pa">${picto(f, OBJ.includes(f) ? 20 : 18)}${f === 'resin' ? '<i class="alerte"></i>' : ''}</span>${OBJ.includes(f) ? (OB[f].crans > 0 ? I.haut : I.bas) : ''}</div>`).join('')}
      <div class="cbio lb">bio</div>
    </div>`;
  const corps = `${tete('Comparer')}
  <div class="liste">${lab}<div class="mat">${cols.map(colonne).join('')}</div></div>
  <div class="rien" role="img" aria-label="Ne bougent avec aucune de ces voies : ${rien.map((f) => NOM[f]).join(', ')}">${rien.map((f) => picto(f, 16)).join('')}</div>
  <details>
    <summary>Ensemble : Motueka 10′ + Motueka en dry hop actif</summary>
    <ul><li>${ENS.libelles.join(' ; ')}.</li><li>Les apports des deux voies s'additionnent (convention du moteur), valable parce qu'elles touchent des moments différents. IBU de la recette : ${fr(ENS.ibu)} (style ${C.bandeIbu.join('–')}). Agrumes et tropical sortent du style (${ENS.tout.filter((t) => ensHs.has(t.famille)).map((t) => t.nom + ' ' + fr(t.apres)).join(', ')}, bande ${bande('citrus').join('–')}).</li></ul>
  </details>`;
  const css = `
  .liste { display: flex; gap: 4px; }
  .lab { width: 30px; flex: none; display: flex; flex-direction: column; }
  .mat { flex: 1; min-width: 0; display: flex; gap: 5px; }
  .col { flex: 1; min-width: 0; display: flex; flex-direction: column; border-radius: 12px; background: var(--fond); }
  .col.ens { background: #fff; box-shadow: inset 0 0 0 2px var(--encre); }
  .hd { position: relative; height: 94px; display: flex; flex-direction: column; justify-content: flex-start; align-items: flex-start; gap: 4px; padding: 8px 6px 6px; }
  .lab .hd { padding: 0; }
  .cbio { min-height: 52px; padding: 6px 4px 8px; border-top: 1.5px solid var(--trait); }
  .cbio.lb { font-size: 12px; font-weight: 700; color: var(--gris); padding: 10px 0 0; }
  .cbio details.bio summary { height: auto; flex-wrap: wrap; padding: 3px 4px; gap: 3px; border-radius: 10px; }
  .cbio details.bio[open] ul { width: 300px; left: 34px; }
  .hd .l1 { display: flex; align-items: center; gap: 4px; min-height: 0; }
  .hd b { font-size: 14px; font-weight: 750; line-height: 1.1; }
  .hd .q { font-size: 12px; color: var(--gris); white-space: nowrap; }
  .hd .ib { font-size: 12px; color: var(--gris); font-variant-numeric: tabular-nums; }
  .mos { display: inline-flex; gap: 3px; align-items: center; flex-wrap: wrap; }
  .mos .mo { padding: 0 5px; }
    .corps { position: relative; padding-bottom: 6px; }
  .corps::before { content: ''; position: absolute; top: 0; bottom: 6px; left: calc(20% - 1.5px); width: 3px; background: var(--encre); border-radius: 2px; z-index: 2; }
  .sep, .lab .sep { height: 10px; border-top: 1.5px solid var(--trait); margin-top: 4px; }
  .cel, .lf { height: 36px; position: relative; }
  .lf { display: flex; align-items: center; gap: 1px; }
  .lf .pa { position: relative; display: inline-flex; }
  .cn { position: absolute; top: 1px; right: 4px; font-size: 12px; font-weight: 750; font-variant-numeric: tabular-nums; }
  .cn.ne { font-weight: 600; color: var(--gris); }
  .cn.xs { color: var(--acc); }
  .cel .cl, .cel .cr { position: absolute; top: 17px; height: 11px; }
  .cel .cl { left: 0; width: calc(20% - 1.5px); }
  .cel .cr { left: calc(20% + 1.5px); right: 4px; }
  .cel.ns .cl { background: repeating-linear-gradient(135deg, transparent 0 3px, #d9dae0 3px 4.5px); border-radius: 3px; }
  .cb { position: absolute; top: 0; height: 11px; min-width: 3px; width: var(--s); background: var(--c); z-index: 1; }
  body.abs .cb { width: var(--a); }
  .cr .cb { left: 0; border-radius: 0 4px 4px 0; } .cl .cb { right: 0; border-radius: 4px 0 0 4px; }
  .cb.ci { background: color-mix(in srgb, var(--c) 40%, #fff); box-shadow: inset 0 0 0 1.5px var(--c); }
  .cb.sf { background: #fff; box-shadow: inset 0 0 0 1.5px var(--c); }
  .cb-hs { position: absolute; top: 0; height: 11px; left: var(--s0); width: var(--s1); background: var(--acc); z-index: 2; border-radius: 0 4px 4px 0; }
  body.abs .cb-hs { left: var(--a0); width: var(--a1); }
  .vt { position: absolute; top: -5px; bottom: -5px; left: var(--s); width: 0; border-left: 2px dashed var(--encre); z-index: 2; }
  body.abs .vt { left: var(--a); }
  .nb-i { position: absolute; top: 0; height: 11px; width: 16px; background: repeating-linear-gradient(135deg, #fff 0 3px, #b8bec8 3px 5px); box-shadow: inset 0 0 0 1.2px #8a909b; }
  .cr .nb-i { left: 0; border-radius: 0 4px 4px 0; } .cl .nb-i { right: 0; border-radius: 4px 0 0 4px; }
  .td { position: absolute; top: -2px; height: 15px; width: 12px; z-index: 3; border-radius: 3px; background: repeating-linear-gradient(135deg, rgba(255,255,255,.9) 0 3px, #6e6e78 3px 5px); box-shadow: inset 0 0 0 1.2px #3a3a42; left: min(calc(var(--s) + 2px), calc(100% - 12px)); }
  body.abs .td { left: min(calc(var(--a) + 2px), calc(100% - 12px)); }
  .td.moins { margin-left: -14px; }
  .rien { display: flex; gap: 6px; padding: 0 0 0 34px; opacity: .3; }`;
  ecrire(OUT + '/comparer.html', page('Comparer les voies', 'Lot 15 · q2b · Comparer : les voies ajoutées par « + » (1 : Motueka 10′ ; 15 : Motueka en dry hop actif) côte à côte, et « ensemble » [1, 15] (c1.ensemble). Une ligne par famille qui bouge, objectifs en tête ; dans chaque case : ma bière au centre, le rail du style, la barre (pleine : marqué ; pâle : cité), l\'intensité en crans du style écrite, l\'orangé au-delà du style ; la biotransformation en tendances hachurées, sans chiffre. Au style : 3 crans à droite, 1 à gauche ; absolu : 50 et 16,7 points.', css, corps));
}
