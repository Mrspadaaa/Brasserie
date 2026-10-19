// Lot 18 · l10 (En moins) et l11 (En plus) : ce que les deux langages partagent.
// Les données de q2b (fils15-s5-complexe/donnees/c1.json), les pictos et icônes v3 duo
// (fils17-standard/v3/planche.html), les tons des familles (fils17-standard/jetons-familles.json),
// les pistes s5 de q2b (generateur-q2b.mjs) et la fiche g1 du houblon (base/generateur/fiche.js),
// rendue ici en HTML statique depuis pack-fiches.json. Aucun chiffre recopié à la main.
import fs from 'node:fs';
import path from 'node:path';

export const REPO = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie';
export const E1 = REPO + '/work/refonte-frontend/v4/ecran-1';
export const D18 = E1 + '/fils18-baseline';
const lire = (f) => fs.readFileSync(f, 'utf8');
export const C = JSON.parse(lire(E1 + '/fils15-s5-complexe/donnees/c1.json'));
export const PACK = JSON.parse(lire(REPO + '/prototypes/houblons-v4/data/pack-mini-protos.json'));
const PF = JSON.parse(lire(REPO + '/prototypes/houblons-v4/data/pack-fiches.json')).fichesHoublons;
const VARIETES = JSON.parse(lire(REPO + '/prototypes/houblons-v4/data/proto-data.json')).varieties;
export const J = JSON.parse(lire(E1 + '/fils17-standard/jetons-familles.json'));
export const GESTE_JS = lire(D18 + '/l10/fiche-geste.js');
const V3 = lire(E1 + '/fils17-standard/v3/planche.html');

// ---------- icônes : le jeu v3 duo, plus deux icônes lucide 1.39.0 (heart, ban) pour le goût ----------
const SYMB = V3.match(/<symbol [\s\S]*?<\/symbol>/g);
const LUC = (id, corps) => `<symbol id="${id}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">${corps}</symbol>`;
export const SYMBOLES = `<svg width="0" height="0" style="position:absolute" aria-hidden="true">${SYMB.join('')}
${LUC('i-coeur', '<path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/>')}
${LUC('i-ban', '<circle cx="12" cy="12" r="10"/><path d="M4.929 4.929 19.07 19.071"/>')}
${LUC('i-chev-b', '<path d="m6 9 6 6 6-6"/>')}
<symbol id="j-egal" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.571" stroke-linecap="round"><path d="M5 9h14M5 15h14"/></symbol>
<symbol id="j-fleche" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h16M13 6l6 6-6 6"/></symbol>
<symbol id="j-approx" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.571" stroke-linecap="round"><path d="M4 9.5c2.5-2.5 5.5-2.5 8 0s5.5 2.5 8 0M4 15.5c2.5-2.5 5.5-2.5 8 0s5.5 2.5 8 0"/></symbol>
</svg>`;
// i-* : 16 px (2,25 sur 24 = 1,5 px rendu) ; j-* et pictos p-* : 14 px (2,571 sur 24 = 1,5 px rendu).
export const ic = (id, w = 16, cls = '') => `<svg class="ic${cls ? ' ' + cls : ''}" width="${w}" height="${w}" aria-hidden="true"><use href="#${id}"/></svg>`;
export const jc = (id, cls = '') => ic(id, 14, cls);

// ---------- familles ----------
export const ORDRE = ['floral', 'herbal', 'earthy', 'citrus', 'tropical', 'stoneFruit', 'pomeFruit', 'berries', 'melon', 'resin', 'spice', 'green'];
export const ROUE = PACK.roueAromes.map((r) => r.id);
export const NOM = { citrus: 'Agrumes', tropical: 'Fruits tropicaux', melon: 'Melon', stoneFruit: 'Fruits à noyau', pomeFruit: 'Fruits à pépins', berries: 'Petits fruits', floral: 'Floral', herbal: 'Herbacé', resin: 'Boisé et résineux', spice: 'Épicé', green: 'Végétal', earthy: 'Terreux' };
export const COURT = { floral: 'Floral', herbal: 'Herbacé', earthy: 'Terreux', citrus: 'Agrumes', tropical: 'Tropicaux', stoneFruit: 'Noyau', pomeFruit: 'Pépins', berries: 'Baies', melon: 'Melon', resin: 'Résineux', spice: 'Épicé', green: 'Végétal' };
export const BASE = Object.fromEntries(Object.entries(J).map(([f, t]) => [f, t.base]));
export const TEXTE = Object.fromEntries(Object.entries(J).map(([f, t]) => [f, t.texte]));
export const FOND = Object.fromEntries(Object.entries(J).map(([f, t]) => [f, t.fond]));
export const OBJ = ['floral', 'citrus', 'resin'];
export const OB = Object.fromEntries(C.objectifs.map((o) => [o.famille, o]));
export const SENS = Object.fromEntries(C.objectifs.map((o) => [o.famille, Math.sign(o.crans)]));
const BANDE = {}, AVANT = {}, STATUT = {};
for (const v of C.voies) for (const t of v.tout) { BANDE[t.famille] = t.bande; if (t.avant != null) AVANT[t.famille] = t.avant; STATUT[t.famille] = t.statut; }
for (const o of C.objectifs) STATUT[o.famille] = o.statut;
export const ATTENDUES = ORDRE.filter((f) => STATUT[f] === 'attendue');
export const bande = (f) => BANDE[f] || [0, 30];
export const cran = (f) => (OB[f] ? OB[f].cran : bande(f)[1] === 55 ? 18.3 : 10);
export const DEG = PACK.scenarios.S1.tasting.axes.find((x) => x.family === 'resin').perceivedRange;
export const r1 = (x) => Math.round(x * 10) / 10;
export const p = (x) => r1(x) + '%';
export const fr = (x) => String(r1(x)).replace('.', ',').replace('-', '−');
export const sg = (x) => (x > 0 ? '+' : '') + fr(x);
export const cl = (x) => Math.max(0, Math.min(100, x));
export const crTxt = (c) => (c > 0 ? '+' : '') + fr(c) + ' cran' + (Math.abs(c) >= 2 ? 's' : '');
export const picto = (f, w = 14, attrs = '') => `<svg class="pi" width="${w}" height="${w}" ${attrs} aria-label="${NOM[f]}"><use href="#p-${f}"/></svg>`;

// ---------- les voies ----------
export const V = C.voies.map((v, i) => {
  const extras = v.tout.filter((t) => !t.visee && Math.abs(t.effet) >= 0.5).sort((a, b) => ORDRE.indexOf(a.famille) - ORDRE.indexOf(b.famille));
  return { n: i + 1, v, extras, hs: new Set((v.horsStyle || []).map((x) => x.family)) };
});
export const nomVoie = (v) => {
  if (v.levureVers) return { nom: v.levureVers, q: '' };
  if (v.type === 'assemblage') return { nom: v.actions.map((a) => a.houblon).join(' + '), q: '' };
  if (v.type.startsWith('remplacer') || v.type === 'levure') return { nom: v.actions[0].houblon, q: v.actions[0].grammes + ' g' };
  return { nom: v.actions[0].houblon, q: '' };
};
export const MOMENT = {
  b60: ['60′', 'j-ebu', 'à 60′'], b10: ['10′', 'j-ebu', 'à 10′'], wp: ['whirlpool', 'j-whirl', 'au whirlpool'],
  dryActive: ['actif', 'j-cuve-a', 'dry hop en fermentation active'], dryPost: ['après', 'j-cuve-p', 'dry hop après fermentation'], levure: ['levure', 'j-levure', 'levure : toute la fermentation'],
};
export const momentDe = (v) => (v.levureVers ? 'levure' : v.actions[0].momentId);
export const pill = (id, cls = '') => { const [t, ic0, lg] = MOMENT[id]; return `<span class="mo${cls ? ' ' + cls : ''}" data-role="moment" data-moment="${id}" aria-label="Moment : ${lg}">${jc(ic0)}<span>${t}</span></span>`; };
// Groupes de q2b : même effet sur les objectifs, puis les gestes seuls.
const grEffet = [];
for (const X of V) { const k = JSON.stringify(X.v.effet); const g = grEffet.find((x) => x.k === k); if (g) g.voies.push(X); else grEffet.push({ k, voies: [X] }); }
export const MEMES = grEffet.filter((g) => g.voies.length > 1);
const seuls = new Set(grEffet.filter((g) => g.voies.length === 1).map((g) => g.voies[0].n));
export const GESTES = [
  { t: 'Assembler 5 + 5 g', ic: 'j-arome', mo: 'b10', est: true, voies: [6, 8] },
  { t: 'Remplacer Nugget', ic: 'j-goutte', mo: 'b60', voies: [12, 13, 14] },
  { t: 'Dry hop', ic: 'j-arome', mo: 'dryActive', est: true, voies: [15] },
  { t: 'Changer de levure', ic: '', mo: 'levure', est: true, voies: [16, 17] },
].map((g) => ({ ...g, voies: g.voies.filter((n) => seuls.has(n)).map((n) => V[n - 1]) })).filter((g) => g.voies.length);
export const slotsDe = (xs) => ORDRE.filter((f) => !OBJ.includes(f) && xs.some((X) => X.extras.some((t) => t.famille === f)));

// ---------- usage, stock ----------
const USAGE_IC = { amérisant: jc('j-goutte'), aromatique: jc('j-arome'), double: jc('j-goutte') + jc('j-arome') };
export const USAGE_MOT = { amérisant: 'amérisant', aromatique: 'aromatique', double: 'double usage' };
export function usage(h, cls = '') {
  const u = h.role || 'inconnu', src = /^fournisseur/.test(h.roleSource || '') ? 'fournisseur' : 'règle';
  const dit = src === 'fournisseur' ? 'attesté par le fournisseur' : 'déduit de l\'α, à valider';
  return `<span class="us${src === 'règle' ? ' deduit' : ''}${cls ? ' ' + cls : ''}" role="img" data-role="usage" data-usage="${u}" data-source="${src}" data-houblon="${h.houblon}" aria-label="${h.houblon} : ${u}, ${dit}">${USAGE_IC[u] || '<b class="inc">?</b>'}${src === 'règle' ? '<i class="al">α</i>' : ''}</span>`;
}
export const STOCK = { suffisant: ['en stock', 'j-stock'], 'à acheter': ['à acheter', 'j-achat'], manque: ['manque', 'j-manque'] };

// ---------- pistes s5 (q2b), sans fonds ----------
export function zone(f) {
  if (f === 'resin') return null;
  const a = AVANT[f]; if (a == null) return undefined;
  const [b0, b1] = bande(f), c = cran(f);
  const rS0 = (b1 - a) / c / 3 * 100, lS0 = (a - b0) / c / 3 * 100, rA0 = (b1 - a) / 50 * 100, lA0 = (a - b0) / 50 * 100;
  return { rS: cl(rS0), lS: cl(lS0), rA: cl(rA0), lA: cl(lA0), rS0, lS0, rA0, lA0 };
}
const ztEl = (f, s0, a0) => `<i class="zt${s0 > 100 ? ' cs' : ''}${a0 > 100 ? ' ca' : ''}" data-role="zone" style="--c:${BASE[f]};--s:${p(cl(s0))};--a:${p(cl(a0))}"></i>`;
export const viseeS = (f) => (OB[f].visee - OB[f].maBiere.central) / OB[f].cran / 3 * 100;
export const viseeA = (f) => (OB[f].visee - OB[f].maBiere.central) / 50 * 100;
export function niv(v, f, e) {
  if (e < 0) return 'sf';
  let best = null;
  for (const h of v.fiches || []) for (const x of h.familles) if (x.famille === f) best = x.niveau === 'marqué' ? 'mq' : best || 'ci';
  return best || 'sf';
}
export const NIVMOT = { mq: 'marqué dans ses fiches', ci: 'cité par une fiche', sf: 'sans fiche (modèle seul)' };
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
export const crOf = (X, f) => { const t = X.v.tout.find((x) => x.famille === f); return t && t.crans != null ? t.crans : null; };
export const arr = (c) => (Math.abs(c) < 0.5 ? (c < 0 ? '≈ −' : '≈ +') : (c > 0 ? '+' : '−') + Math.round(Math.abs(c)) + (Math.round(Math.abs(c)) >= 2 ? ' crans' : ' cran'));
// o.crans : la barre porte aussi data-crans (l10 : les cases d'objectifs quittent la ligne) ;
// o.lab : l'écart écrit au bout de la barre ; o.labFn : son texte.
function bar(X, f, e, side, o) {
  const b = pctBar(f, e), n = niv(X.v, f, e), c = crOf(X, f);
  const dc = o.crans && c != null ? ` data-crans="${c}"` : '';
  let h = `<i class="bar ${n}${b.ds ? ' ds' : ''}${b.da ? ' da' : ''}" data-role="effet" data-famille="${f}"${dc} aria-label="${NOM[f]} ${sg(e)} · ${NIVMOT[n]}" style="--c:${BASE[f]};--f:${FOND[f]};--s:${p(b.s)};--a:${p(b.a)}"></i>`;
  if (X.hs.has(f)) h += hsSeg(f, b, side);
  if (o.lab && c != null) h += `<span class="lab-i${side === 'l' ? ' g' : ''}" style="--s:${p(b.s)};--a:${p(b.a)}">${(o.labFn || arr)(c, X, f)}</span>`;
  return h;
}
const inconnu = (f) => `<i class="bar inconnu" data-role="effet" data-famille="${f}" aria-label="${NOM[f]} : effet non établi"></i>`;
function zt(f, side) { const z = zone(f); if (!z) return ''; return ztEl(f, side === 'r' ? z.rS0 : z.lS0, side === 'r' ? z.rA0 : z.lA0); }
// Deux couloirs : en haut le floral, en bas le résineux (à gauche) et les agrumes (à droite).
export function couloirs(X, o = {}) {
  const e = X.v.effet; let la = '', lb = '', ra = '', rb = '';
  if (!e.floral.etabli) ra = zt('floral', 'r') + inconnu('floral');
  else if (e.floral.central >= 0) ra = zt('floral', 'r') + bar(X, 'floral', e.floral.central, 'r', o);
  else { ra = zt('floral', 'r'); la = zt('floral', 'l') + bar(X, 'floral', e.floral.central, 'l', o); }
  rb = zt('citrus', 'r') + (e.citrus.etabli ? bar(X, 'citrus', e.citrus.central, 'r', o) : inconnu('citrus'));
  lb = e.resin.etabli ? bar(X, 'resin', e.resin.central, 'l', { ...o, lab: o.labResin ?? o.lab }) : inconnu('resin');
  return `<div class="bars"><div class="m re"><div class="ln a">${la}</div><div class="ln b">${lb}</div></div><div class="g"></div><div class="m fl"><div class="ln a">${ra}</div><div class="ln b">${rb}</div></div></div>`;
}
// Les demi-pistes sans fond (data-role="piste") ; le sens par une flèche fine en tête, ma bière par le rail.
export function fonds(o = {}) {
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
        ${o.crans ? [1, 2].map((k) => `<i class="cr-t sty-only" style="--s:${p(k / 3 * 100)}"></i>`).join('') : ''}
      </div>
    </div>`;
}
export const VIS = { flS: viseeS('floral'), flA: viseeA('floral'), ciS: viseeS('citrus'), ciA: viseeA('citrus') };

// ---------- intensité : une case par famille, picto + jauge (1 trait par cran du style) ----------
export function jauge(c, hors) {
  const n = Math.abs(c) < 0.5 ? 0 : Math.min(4, Math.round(Math.abs(c)));
  const seg = n ? Array.from({ length: n }, () => '<i></i>').join('') : '<i class="pt"></i>';
  return `<span class="jg${c < 0 ? ' bas' : ''}${hors ? ' xs' : ''}">${seg}</span>`;
}
export function caseFam(X, f, obj, o = {}) {
  const t = X.v.tout.find((x) => x.famille === f);
  const corps = o.corps || ((c, hs) => jauge(c, hs));
  if (obj) {
    const e = X.v.effet[f];
    if (!e.etabli) return `<span class="cf o ne" data-famille="${f}" aria-label="${NOM[f]} : effet non établi">${picto(f)}<span class="jg ne"><i></i></span></span>`;
    const c = t ? t.crans : 0, n = niv(X.v, f, e.central);
    return `<span class="cf o ${n}${e.central < 0 ? ' moins' : ''}" data-famille="${f}" data-crans="${c}" aria-label="${NOM[f]} ${sg(e.central)} (${crTxt(c)}) · ${NIVMOT[n]}${X.hs.has(f) ? ' · hors du style' : ''}">${picto(f)}${corps(c, X.hs.has(f), t, f)}</span>`;
  }
  if (!t || Math.abs(t.effet) < 0.5) return o.vide === false ? '' : '<span class="cf vide"></span>';
  const n = niv(X.v, f, t.effet);
  return `<span class="cf ${n}${t.effet < 0 ? ' moins' : ''}" data-role="extra" data-famille="${f}" data-crans="${t.crans}" aria-label="${NOM[f]} ${sg(t.effet)} (${crTxt(t.crans)}) · ${NIVMOT[n]}${X.hs.has(f) ? ' · hors du style' : ''}">${picto(f)}${corps(t.crans, X.hs.has(f), t, f)}</span>`;
}

// ---------- les réponses ----------
function meilleure(f, sens) {
  const c = V.filter((X) => X.v.effet[f].etabli && !X.hs.size);
  return c.length ? c.reduce((b, X) => ((sens > 0 ? X.v.effet[f].central > b.v.effet[f].central : X.v.effet[f].central < b.v.effet[f].central) ? X : b)) : null;
}
export function reponses() {
  const fl = meilleure('floral', 1), ci = meilleure('citrus', 1), re = meilleure('resin', -1);
  const vFl = OB.floral.maBiere.central + fl.v.effet.floral.central, vCi = OB.citrus.maBiere.central + ci.v.effet.citrus.central;
  const verd = (f, v) => (v >= OB[f].visee ? 'atteint' : Math.abs(v - OB[f].visee) <= Math.abs(OB[f].maBiere.central - OB[f].visee) / 2 ? 'approche' : 'aucune');
  return {
    floral: { verdict: verd('floral', vFl), X: fl, avant: OB.floral.maBiere.central, apres: vFl, visee: OB.floral.visee, plage: OB.floral.maBiere.range, bande: OB.floral.bande, frac: fl.v.effet.floral.central / OB.floral.cran },
    citrus: { verdict: verd('citrus', vCi), X: ci, avant: OB.citrus.maBiere.central, apres: vCi, visee: OB.citrus.visee, plage: OB.citrus.maBiere.range, bande: OB.citrus.bande, frac: ci.v.effet.citrus.central / OB.citrus.cran },
    resin: { verdict: DEG.min + re.v.effet.resin.central <= OB.resin.visee ? 'atteint' : 'aucune', X: re, deg: DEG, apres: [DEG.min + re.v.effet.resin.central, DEG.max + re.v.effet.resin.central], visee: OB.resin.visee, bande: OB.resin.bande },
  };
}
export const MOT = { atteint: 'Atteint', approche: 'Approche', aucune: 'Aucune' };

// ---------- biotransformation (voie 15) ----------
export const BIO = (V[14].v.bio || []).flatMap((h) => h.signaux.map((s) => ({ ...s, houblon: h.houblon, moment: h.moment })));
export function bioPictos(o = {}) {
  const has = (id) => BIO.find((s) => s.id === id);
  const pf = (f) => picto(f, 14, `data-famille="${f}"`);
  let h = '';
  if (has('geraniol-citronellol')) h += `<span class="bt">${pf('floral')}${ic('j-fleche', 12, 'fl')}${pf('citrus')}</span>`;
  if (has('thiols')) h += `<span class="bt">${pf('tropical')}${pf('berries')}</span>`;
  if (has('hop-creep')) h += `<span class="bt mot">${jc('j-cuve-a')}<span>creep</span></span>`;
  return h;
}

// ---------- IBU, hors houblon ----------
export const IBU = { biere: C.ibu, bande: C.bandeIbu };
export const HORS = C.horsModele.flatMap((h) => h.pistes.map((x) => ({ ...x, famille: h.famille })));

// ======================= la fiche du houblon (g1) =======================
const ROLE_C1 = {};
for (const v of C.voies) for (const h of v.fiches || []) if (!ROLE_C1[h.houblon]) ROLE_C1[h.houblon] = { v: h.role, src: h.roleSource || '' };
const FICHES_C1 = {};
for (const v of C.voies) for (const h of v.fiches || []) if (!FICHES_C1[h.houblon]) FICHES_C1[h.houblon] = h;
const plageSrc = (s) => ({ src: s.source, an: s.annee ?? null, min: s.min, max: s.max });
const NOMS_H = { myrcene: 'myrcène', humulene: 'humulène', caryophyllene: 'caryophyllène', farnesene: 'farnésène', linalool: 'linalol' };
export function ficheDe(nom) {
  const f = PF.find((x) => x.name === nom);
  if (f) {
    const de = f.alpha && f.alpha.retenu ? f.alpha.retenu.from : null;
    const comp = (f.huiles && f.huiles.composants) || {};
    return {
      nom, cle: f.key, origine: f.origin || null, role: ROLE_C1[nom] || null, cryo: /:cryo$/.test(f.key),
      alpha: ((f.alpha && f.alpha.sources) || []).map(plageSrc),
      lot: /fiche de stock|lu sur l.article/.test(de || '') ? f.alpha.retenu.value : null,
      beta: ((f.beta && f.beta.sources) || []).map(plageSrc),
      huiles: ((f.huiles && f.huiles.totale && f.huiles.totale.sources) || []).map(plageSrc),
      composants: Object.entries(NOMS_H).map(([k, n]) => (comp[k] ? { nom: n, min: comp[k].min, max: comp[k].max, src: comp[k].source } : { nom: n, raison: comp[k + 'Raison'] || null })),
      aromes: (f.aromes || []).map((a) => ({ f: a.family, n: a.sources, of: a.of, auteurs: a.authors || [], mots: a.mots || [], premier: a.premier || [] })),
      sansFamille: f.motsSansFamille || [], desc: (f.descripteurs && f.descripteurs.beerMaverick) || [],
      styles: (f.usage || []).flatMap((u) => u.styles || []), stylesSrc: (f.usage || []).map((u) => u.source).filter(Boolean), stylesRaison: f.usageRaison || null,
      subs: Array.isArray(f.substituts) ? f.substituts.map((x) => (typeof x === 'string' ? x : x.name || x.nom || '')).filter(Boolean) : [], subsRaison: f.substitutsRaison || null,
    };
  }
  // Celeia n'a pas de fiche dans pack-fiches : le catalogue du moteur (proto-data, Beer Maverick et
  // Hopsteiner) et la lecture de ses fiches par le moteur (c1, fiches[].familles : n sur M).
  const v = VARIETES.find((x) => x.name === nom), h = FICHES_C1[nom];
  if (!v || !h) return null;
  const sur = (h.familles[0] || {}).sur || 0;
  const bm = (a) => (Array.isArray(a) ? [{ src: 'Beer Maverick', an: v.bmYear || null, min: a[0], max: a[1] }] : []);
  const hs = (a) => (v.hs && Array.isArray(a) ? [{ src: 'Hopsteiner', an: v.hs.year || null, min: a[0], max: a[1] }] : []);
  return {
    nom, cle: v.id, origine: v.origin || null, role: ROLE_C1[nom] || null, cryo: false, catalogue: true,
    alpha: [...bm(v.alpha), ...hs(v.hs && v.hs.alpha)], lot: null, beta: [...bm(v.beta), ...hs(v.hs && v.hs.beta)], huiles: [...bm(v.oil), ...hs(v.hs && v.hs.totalOil)],
    composants: Object.entries(NOMS_H).map(([k, n]) => { const r = k === 'linalool' ? v.hsLinalool && v.hsLinalool.range : v.oils && v.oils[k]; return Array.isArray(r) ? { nom: n, min: r[0], max: r[1], src: k === 'linalool' ? 'Hopsteiner' : 'Beer Maverick' } : { nom: n, raison: 'non publié dans le catalogue' }; }),
    aromes: ROUE.map((f) => { const x = h.familles.find((y) => y.famille === f); return { f, n: x ? x.n : 0, of: sur, auteurs: [], mots: [], premier: x && x.premier ? ['fiche'] : [] }; }),
    sansFamille: [], desc: v.tagsFr || [], styles: [], stylesSrc: [], stylesRaison: 'styles d’emploi non publiés dans le dépôt', subs: [], subsRaison: null,
  };
}
export const HOUBLONS = [...new Set(C.voies.flatMap((v) => (v.fiches || []).map((h) => h.houblon)))];
export const FICHES = Object.fromEntries(HOUBLONS.map((n) => [n, ficheDe(n)]).filter(([, f]) => f));
// La première voie qui ajoute ce houblon seul : le geste « Ajouter » et le « + » de Comparer.
export const voieDe = (nom) => V.find((X) => X.v.type === 'ajouter' && X.v.actions[0].houblon === nom) || V.find((X) => X.v.actions.some((a) => a.houblon === nom));
export const stockDe = (nom) => { const X = voieDe(nom); return X ? X.v.stock : null; };

export const nbF = (v) => String(v).replace('.', ',');
export const plageF = (s) => (s.min === s.max ? nbF(s.min) : nbF(s.min) + '–' + nbF(s.max));
export const recente = (arr) => (arr || []).reduce((a, s) => (!a || (s.an || 0) > (a.an || 0) ? s : a), null);
// g1 (#131) : un cryo porte les plages de la variété en pellets ; mon lot hors des plages de ses fiches se dit.
export const noteAlpha = (F) => (F.cryo ? `α de ${esc(F.nom.replace(/\s*cryo$/i, ''))} en pellets`
  : F.lot != null && F.alpha.length && F.alpha.every((s) => F.lot < s.min || F.lot > s.max) ? `Mon lot ${nbF(F.lot)} % : hors des plages de ses fiches` : '');
export const ROLE_MOT ={ amérisant: 'amérisant', aromatique: 'aromatique', double: 'double usage' };
export const mots = (a) => [...new Set((a.mots || []).flatMap((m) => m.mots).map((w) => w.toLowerCase()))];
export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

// La roue « N/M » : chaque famille au nombre de fiches qui la citent (1 au milieu, 2 au bord),
// une famille non décrite au centre, hachurée, son nom suivi de « ? » ; les axes des familles
// décrites à leur couleur ; ma demande fléchée au bord (plus vers l'extérieur, moins vers le centre).
export function roue(F, o = {}) {
  const W = o.W || 340, H = o.H || 236, cx = W / 2, cy = H / 2 + 2, R = o.R || 74;
  const ENC = o.encre || '#16161a', GRIS = o.gris || '#6e6e78', FOND0 = o.fond || '#f1f1f4';
  const lv = Object.fromEntries(F.aromes.map((a) => [a.f, a]));
  const vals = ROUE.map((f) => (lv[f] && lv[f].n ? lv[f].n : null));
  const max = Math.max(2, ...vals.filter((v) => v != null));
  const rr = (v) => (v == null ? 0 : R * (v + 0.5) / (max + 0.5));
  const ang = (k) => (k * Math.PI * 2) / ROUE.length;
  const P = (k, r) => [cx + Math.sin(ang(k)) * r, cy - Math.cos(ang(k)) * r];
  const f1 = (x) => Math.round(x * 10) / 10;
  let s = `<svg class="f-roue" data-radar data-objet="fiche" data-axes="${ROUE.join(',')}" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Silhouette de ${esc(F.nom)} selon ses fiches : ${ROUE.filter((f, k) => vals[k]).map((f) => COURT[f].toLowerCase() + ' ' + (lv[f].of === 1 ? 'une seule fiche' : lv[f].n + ' sur ' + lv[f].of)).join(', ') || 'aucun arôme décrit'} ; les autres familles sont inconnues, pas à zéro">`;
  s += `<defs><pattern id="hach-${F.cle.replace(/[^a-z0-9]/gi, '')}" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="${FOND0}"/><line x1="0" y1="0" x2="0" y2="5" stroke="${o.hach || '#c9cbd3'}" stroke-width="1.6"/></pattern></defs>`;
  // secteurs inconnus
  const hid = 'hach-' + F.cle.replace(/[^a-z0-9]/gi, '');
  ROUE.forEach((f, k) => {
    if (vals[k] != null) return;
    const a0 = ang(k) - Math.PI / ROUE.length, a1 = ang(k) + Math.PI / ROUE.length;
    const q = (a) => [cx + Math.sin(a) * R, cy - Math.cos(a) * R];
    const [x0, y0] = q(a0), [x1, y1] = q(a1);
    s += `<path data-inconnu="${f}" d="M${cx},${cy}L${f1(x0)},${f1(y0)}A${R},${R} 0 0 1 ${f1(x1)},${f1(y1)}Z" fill="url(#${hid})"/>`;
  });
  // anneaux 1 et 2 fiches (et max)
  for (let v = 1; v <= max; v++) {
    const pts = ROUE.map((f, k) => P(k, rr(v)).map(f1).join(',')).join(' ');
    s += `<polygon points="${pts}" fill="none" stroke="${o.anneau || '#d6d7de'}" stroke-width="1"/>`;
  }
  ROUE.forEach((f, k) => { const [x, y] = P(k, R); s += `<line x1="${cx}" y1="${cy}" x2="${f1(x)}" y2="${f1(y)}" stroke="${vals[k] != null ? BASE[f] : (o.anneau || '#d6d7de')}" stroke-width="${vals[k] != null ? 1.6 : 1}"/>`; });
  const pts = ROUE.map((f, k) => P(k, rr(vals[k])).map(f1).join(',')).join(' ');
  s += `<polygon data-serie="${esc(F.nom)}" data-valeurs="${vals.map((v) => (v == null ? 0 : v)).join(',')}" data-inconnues="${ROUE.filter((f, k) => vals[k] == null).join(',')}" points="${pts}" fill="${o.plein || 'rgba(22,22,26,.12)'}" stroke="${ENC}" stroke-width="2" stroke-linejoin="round"/>`;
  ROUE.forEach((f, k) => { if (vals[k] == null) return; const [x, y] = P(k, rr(vals[k])); s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${vals[k] >= 2 ? 4 : 3.2}" fill="${vals[k] >= 2 ? ENC : (o.surface || '#fff')}" stroke="${ENC}" stroke-width="1.8"/>`; });
  // demande
  ROUE.forEach((f, k) => {
    const sens = SENS[f]; if (!sens) return;
    const deg = f1((k * 360) / ROUE.length);
    s += `<g transform="translate(${cx},${cy}) rotate(${deg})" data-demande="${f}" data-sens="${sens > 0 ? 'plus' : 'moins'}">`;
    s += sens > 0 ? `<line x1="0" y1="${-(R + 4)}" x2="0" y2="${-(R + 11)}" stroke="${ENC}" stroke-width="2.2"/><path d="M0,${-(R + 18)}L-4.5,${-(R + 10)}L4.5,${-(R + 10)}Z" fill="${ENC}"/>`
      : `<line x1="0" y1="${-(R + 18)}" x2="0" y2="${-(R + 11)}" stroke="${ENC}" stroke-width="2.2"/><path d="M0,${-(R + 4)}L-4.5,${-(R + 12)}L4.5,${-(R + 12)}Z" fill="${ENC}"/>`;
    s += '</g>';
  });
  // libellés
  ROUE.forEach((f, k) => {
    const a = ang(k), d = R + (SENS[f] ? 30 : 16);
    const x = cx + Math.sin(a) * d, y = cy - Math.cos(a) * d;
    const anc = Math.abs(Math.sin(a)) < 0.2 ? 'middle' : Math.sin(a) > 0 ? 'start' : 'end';
    const v = vals[k], a0 = lv[f];
    const cpt = v != null && a0.of > 1 ? a0.n + '/' + a0.of : '';
    const dy = Math.cos(a) < -0.5 ? 10 : Math.cos(a) > 0.5 ? -4 : 4;
    if (v == null) s += `<text x="${f1(x)}" y="${f1(y + dy)}" text-anchor="${anc}" font-size="12" fill="${GRIS}">${COURT[f]}?</text>`;
    else s += `<text x="${f1(x)}" y="${f1(y + dy)}" text-anchor="${anc}" font-size="12" fill="${ENC}"${SENS[f] ? ' font-weight="700"' : ''}>${COURT[f]}${cpt ? `<tspan font-weight="400"> ${cpt}</tspan>` : ''}</text>`;
  });
  return s + '</svg>';
}
// La réglette de l'α : toutes les sources (0 à 25 %), la plus récente foncée, mon lot en trait.
export function reglette(F, o = {}) {
  const W = o.W || 64, s0 = recente(F.alpha), x = (v) => 2 + Math.max(0, Math.min(1, v / 25)) * (W - 4);
  let s = `<svg class="f-reglette" width="${W}" height="12" viewBox="0 0 ${W} 12" aria-hidden="true"><rect x="2" y="4" width="${W - 4}" height="4" rx="2" fill="${o.piste || '#e4e4ea'}"/>`;
  for (const src of F.alpha) s += `<rect x="${Math.round(x(src.min) - 1)}" y="2" width="${Math.max(3, Math.round(x(src.max) - x(src.min) + 2))}" height="8" rx="2" fill="${src === s0 ? (o.fonce || '#3d3d44') : (o.clair || '#b9bac4')}"/>`;
  if (F.lot != null) s += `<rect x="${Math.round(x(F.lot) - 1.5)}" y="0" width="3" height="12" rx="1" fill="${o.lot || '#111'}" stroke="${o.surface || '#fff'}" stroke-width="1"/>`;
  return s + '</svg>';
}
// Les replis de la fiche : Styles, Huiles, Sources, Substituts (base, SECTIONS).
const NR = 'non renseigné';
const srcTxt = (s) => s.src + (s.an ? ' ' + s.an : '');
const rg = (n, v) => `<div class="f-rg"><span>${esc(n)}</span><b>${esc(v)}</b></div>`;
export function replis(F) {
  const tags = (xs) => `<div class="f-tags">${xs.map((t) => `<span>${esc(t)}</span>`).join('')}</div>`;
  const S = [
    ['styles', 'Styles', F.styles.length ? tags(F.styles) + (F.stylesSrc.length ? `<p class="f-gris">${esc(F.stylesSrc.join(' ; '))}</p>` : '') : `<p class="f-gris">${esc(F.stylesRaison || NR)}</p>`],
    ['huiles', 'Huiles', (F.huiles.length ? F.huiles.map((s) => rg('totale, ' + srcTxt(s), plageF(s) + ' mL/100 g')).join('') : rg('totale', NR)) + F.composants.map((c) => rg(c.nom, c.min != null ? plageF(c) + ' %' + (c.src ? ', ' + c.src : '') : c.raison || NR)).join('')],
    ['sources', 'Sources', F.alpha.map((s) => rg('α ' + srcTxt(s), plageF(s) + ' %')).join('') + (F.lot != null ? rg('α mon lot', nbF(F.lot) + ' %') : '') + (F.beta.length ? F.beta.map((s) => rg('β ' + srcTxt(s), plageF(s) + ' %')).join('') : rg('β', NR))
      + `<p>Origine : ${esc(F.origine || NR)}</p>` + F.aromes.filter((a) => a.n > 0).map((a) => `<p><b>${COURT[a.f]}${a.of === 1 ? '' : ' ' + a.n + '/' + a.of}</b> ${esc(a.auteurs.join(', ') || (F.catalogue ? 'lu par le moteur' : NR))}</p>`).join('')
      + (F.sansFamille.length ? `<p class="f-gris">sans famille : ${esc(F.sansFamille.map((s) => s.mot + ' (' + s.source + ')').join(', '))}</p>` : '') + (F.desc.length ? tags(F.desc) : '')],
    ['subs', 'Substituts', F.subs.length ? tags(F.subs) : `<p class="f-gris">${esc(F.subsRaison || 'aucun substitut calculé dans le pack')}</p>`],
  ];
  return `<div class="f-replis" role="group" aria-label="Détail de la fiche">${S.map(([id, t]) => `<button class="f-repli" data-sec="${id}" aria-expanded="false" aria-label="Déplier ${t.toLowerCase()}">${t}</button>`).join('')}</div>`
    + S.map(([id, t, c]) => `<section class="f-sec" data-sec="${id}" aria-label="${t}" hidden>${c}</section>`).join('');
}
export function actions(F) {
  const X = voieDe(F.nom), a = X.v.actions.find((y) => y.houblon === F.nom) || X.v.actions[0];
  const faire = 'Ajouter ' + a.grammes + ' g à ' + MOMENT[a.momentId][0];
  return `<div class="f-actions">
      <span class="f-gout" role="group" data-role="gout" aria-label="Mon goût pour ${esc(F.nom)} : neutre"><button class="f-g" aria-pressed="false" aria-label="Aimer ${esc(F.nom)}">${ic('i-coeur')}</button><button class="f-g" aria-pressed="false" aria-label="Exclure ${esc(F.nom)}">${ic('i-ban')}</button></span>
      <button class="f-act f-ajouter" aria-pressed="false" data-faire="${faire}" data-fait="Ajouté" aria-label="${faire}">${ic('i-plus')}<span class="f-lib">${faire}</span></button>
      <button class="f-act f-comparer" data-voie="${X.n}" aria-label="Comparer ${esc(F.nom)} à d'autres houblons">Comparer</button>
    </div>`;
}
// Compte des mots comme controle-fiche (innerText, mots avec une lettre ou un chiffre), approché sur le HTML.
export function motsHTML(html) {
  const sansCache = html.replace(/<section class="f-sec"[\s\S]*?<\/section>/g, '').replace(/<(p|ul)[^>]* hidden>[\s\S]*?<\/\1>/g, '').replace(/<details[^>]*>\s*<summary[^>]*>([\s\S]*?)<\/summary>[\s\S]*?<\/details>/g, '$1');
  const txt = sansCache.replace(/<tspan[^>]*>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ');
  return txt.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

export const page = ({ titre, commentaire, css, corps, js, cas = 'c1' }) => `<!doctype html>
<html lang="fr" data-cas="${cas}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titre}</title>
<!-- ${commentaire} -->
<style>${css}</style>
</head>
<body>
${SYMBOLES}
${corps}
<script>${js || ''}</script>
<script>${GESTE_JS}</script>
</body>
</html>
`;
export const ecrire = (f, s) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, s); console.log('écrit ' + path.relative(D18, f) + ' (' + s.length + ' o)'); };
export const LENTILLE_JS = `
  document.querySelectorAll('.lentille [data-e]').forEach(function (b) { b.addEventListener('click', function () {
    document.querySelectorAll('.lentille [data-e]').forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); });
    document.body.classList.toggle('abs', b.dataset.e === 'absolu');
  }); });
  if (/[?&]abs(&|$)/.test(location.search)) document.querySelector('.lentille [data-e="absolu"]').click();
  // Les replis : un bouton (aria-expanded) et son contenu caché (hidden), jamais enfermés.
  document.querySelectorAll('[data-repli]').forEach(function (b) { b.addEventListener('click', function () {
    var c = document.getElementById(b.getAttribute('aria-controls')), o = b.getAttribute('aria-expanded') !== 'true';
    b.setAttribute('aria-expanded', String(o)); if (c) c.hidden = !o;
  }); });
  document.querySelectorAll('[data-role="ajouter-comparer"]').forEach(function (b) { b.addEventListener('click', function () {
    var on = b.getAttribute('aria-pressed') !== 'true';
    b.setAttribute('aria-pressed', String(on));
    var u = b.querySelector('use'); if (u) u.setAttribute('href', on ? '#i-check' : '#i-plus');
    b.setAttribute('aria-label', b.getAttribute('aria-label').replace(on ? /^Ajouter (.*) à la comparaison$/ : /^Retirer (.*) de la comparaison$/, on ? 'Retirer $1 de la comparaison' : 'Ajouter $1 à la comparaison'));
    var n = document.querySelectorAll('[data-role="ajouter-comparer"][aria-pressed="true"]').length;
    document.querySelectorAll('.cmp .nb').forEach(function (x) { x.textContent = '(' + n + ')'; });
  }); });`;
