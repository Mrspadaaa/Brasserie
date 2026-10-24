// Lot 18 (#142, #133) · le noyau commun de l7, l8 et l9 : les données de q2b (c1 du lot 15), la fiche g1
// (pack-fiches) et les gestes (appui long 500 ms, survol 750 ms, Échap). Chaque langage ne change que la
// forme. Aucun chiffre recopié à la main : tout vient de c1.json, pack-fiches.json, pack-mini-protos.json,
// proto-data.json (Celeia, sans fiche du pack), jetons-familles.json, les pictos duo de fils17-standard/v3
// et lucide-react pour les actions. Repris de fils15-s5-complexe/q2b/generateur-q2b.mjs.
import fs from 'node:fs';
import path from 'node:path';

export const REPO = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie';
const B15 = REPO + '/work/refonte-frontend/v4/ecran-1/fils15-s5-complexe';
const lire = (f) => fs.readFileSync(f, 'utf8');
export const C = JSON.parse(lire(B15 + '/donnees/c1.json'));
const PACK = JSON.parse(lire(REPO + '/prototypes/houblons-v4/data/pack-mini-protos.json'));
const PF = JSON.parse(lire(REPO + '/prototypes/houblons-v4/data/pack-fiches.json')).fichesHoublons;
const VARS = JSON.parse(lire(REPO + '/prototypes/houblons-v4/data/proto-data.json')).varieties;
export const JET = JSON.parse(lire(REPO + '/work/refonte-frontend/v4/ecran-1/fils17-standard/jetons-familles.json'));
const V3 = lire(REPO + '/work/refonte-frontend/v4/ecran-1/fils17-standard/v3/planche.html');

export const ORDRE = ['floral', 'herbal', 'earthy', 'citrus', 'tropical', 'stoneFruit', 'pomeFruit', 'berries', 'melon', 'resin', 'spice', 'green'];
export const NOM = { citrus: 'Agrumes', tropical: 'Fruits tropicaux', melon: 'Melon', stoneFruit: 'Fruits à noyau', pomeFruit: 'Fruits à pépins', berries: 'Petits fruits', floral: 'Floral', herbal: 'Herbacé', resin: 'Boisé et résineux', spice: 'Épicé', green: 'Végétal', earthy: 'Terreux' };
export const COURT = { floral: 'Floral', herbal: 'Herbacé', earthy: 'Terreux', citrus: 'Agrumes', tropical: 'Tropicaux', stoneFruit: 'Noyau', pomeFruit: 'Pépins', berries: 'Baies', melon: 'Melon', resin: 'Résineux', spice: 'Épicé', green: 'Végétal' };
export const OBJ = ['floral', 'citrus', 'resin'];
export const OB = Object.fromEntries(C.objectifs.map((o) => [o.famille, o]));
export const ACC = '#c2410c';
const BANDE = {}, AVANT = {};
for (const v of C.voies) for (const t of v.tout) { BANDE[t.famille] = t.bande; if (t.avant != null) AVANT[t.famille] = t.avant; }
export const bande = (f) => BANDE[f] || [0, 30];
export const cran = (f) => (OB[f] ? OB[f].cran : bande(f)[1] === 55 ? 18.3 : 10);
export const DEG = PACK.scenarios.S1.tasting.axes.find((x) => x.family === 'resin').perceivedRange; // résineux dégusté
export const r1 = (x) => Math.round(x * 10) / 10;
export const p = (x) => r1(x) + '%';
export const fr = (x) => String(r1(x)).replace('.', ',').replace('-', '−');
export const sg = (x) => (x > 0 ? '+' : '') + fr(x);
export const cl = (x) => Math.max(0, Math.min(100, x));
export const crTxt = (c) => (c > 0 ? '+' : '') + fr(c) + ' cran' + (Math.abs(c) >= 2 ? 's' : '');

// ---------- les voies ----------
export const V = C.voies.map((v, i) => {
  const extras = v.tout.filter((t) => !t.visee && Math.abs(t.effet) >= 0.5).sort((a, b) => ORDRE.indexOf(a.famille) - ORDRE.indexOf(b.famille));
  return { n: i + 1, v, extras, hs: new Set((v.horsStyle || []).map((x) => x.family)) };
});
export const nomVoie = (v) => {
  if (v.levureVers) return { nom: v.levureVers, q: '', hops: [] };
  if (v.type === 'assemblage') return { nom: v.actions.map((a) => a.houblon).join(' + '), q: '', hops: v.actions.map((a) => a.houblon) };
  if (v.type.startsWith('remplacer') || v.type === 'levure') return { nom: v.actions[0].houblon, q: v.actions[0].grammes + ' g', hops: [v.actions[0].houblon] };
  return { nom: v.actions[0].houblon, q: '', hops: [v.actions[0].houblon] };
};
export function niv(v, f, e) {
  if (e < 0) return 'sf';
  let best = null;
  for (const h of v.fiches || []) for (const x of h.familles) if (x.famille === f) best = x.niveau === 'marqué' ? 'mq' : best || 'ci';
  return best || 'sf';
}
export const NIVMOT = { mq: 'marqué dans ses fiches', ci: 'cité par une fiche', sf: 'sans fiche (modèle seul)' };
export const momentDe = (v) => (v.levureVers ? 'levure' : v.actions[0].momentId);
export const crOf = (X, f) => { const t = X.v.tout.find((x) => x.famille === f); return t && t.crans != null ? t.crans : null; };

// Les groupes de q2b : les voies au même effet sur les objectifs, puis les gestes seuls.
const groupesEffet = [];
for (const X of V) { const k = JSON.stringify(X.v.effet); const g = groupesEffet.find((x) => x.k === k); if (g) g.voies.push(X); else groupesEffet.push({ k, voies: [X] }); }
const seuls = new Set(groupesEffet.filter((g) => g.voies.length === 1).map((g) => g.voies[0].n));
const sigX = (X) => X.extras.map((t) => t.famille).join();
export const MEMES = groupesEffet.filter((g) => g.voies.length > 1).map((g, gi) => {
  const ord = []; for (const X of g.voies) if (!ord.includes(X)) ord.push(...g.voies.filter((Y) => sigX(Y) === sigX(X) && !ord.includes(Y)));
  return { gi, voies: ord, dose: g.voies[0].v.actions[0].grammes + ' g', moment: momentDe(g.voies[0].v), coupe: (i) => i > 0 && sigX(ord[i - 1]) !== sigX(ord[i]) };
});
export const GESTES = [
  { t: 'Assembler 5 + 5 g', ic: 'arome', mo: 'b10', est: true, voies: [6, 8] },
  { t: 'Remplacer Nugget', ic: 'goutte', mo: 'b60', voies: [12, 13, 14] },
  { t: 'Dry hop', ic: 'arome', mo: 'dryActive', est: true, voies: [15] },
  { t: 'Changer de levure', ic: '', mo: 'levure', est: true, voies: [16, 17] },
].map((g) => ({ ...g, voies: g.voies.filter((n) => seuls.has(n)).map((n) => V[n - 1]) })).filter((g) => g.voies.length);
export const slotsDe = (xs) => ORDRE.filter((f) => !OBJ.includes(f) && xs.some((X) => X.extras.some((t) => t.famille === f)));
export const AJOUTEES = [1, 15];

// ---------- icônes : pictos duo (v3) et actions lucide, une seule épaisseur rendue ----------
const SYM = {};
for (const m of V3.matchAll(/<symbol id="([^"]+)" viewBox="([^"]+)"[^>]*>([\s\S]*?)<\/symbol>/g)) SYM[m[1]] = { vb: m[2], inner: m[3] };
function lucide(nom) {
  const t = lire(REPO + '/node_modules/lucide-react/dist/esm/icons/' + nom + '.mjs').match(/const __iconNode = (\[[\s\S]*?\]);\nconst/)[1];
  const nodes = new Function('return ' + t)();
  return nodes.map(([tag, a]) => '<' + tag + ' ' + Object.entries(a).filter(([k]) => k !== 'key').map(([k, v]) => k + '="' + v + '"').join(' ') + '/>').join('');
}
const ACTIONS = {
  plus: lucide('plus'), check: lucide('check'), x: lucide('x'), 'chev-l': lucide('chevron-left'), 'chev-r': lucide('chevron-right'),
  fleche: lucide('arrow-right'), egal: lucide('equal'), coeur: lucide('heart'), ban: lucide('ban'), bulles: lucide('bubbles'),
  drapeau: lucide('flag'), montagne: lucide('mountain'), route: lucide('route'),
  // l8b, l8c, l8d : les signes des verdicts et le sens de la demande.
  atteint: lucide('circle-check'), approche: lucide('arrow-right-to-line'), aucune: lucide('circle-slash-2'), haut: lucide('arrow-up'), bas: lucide('arrow-down'),
  // l8e, l8f : l'α des fiches, le lot hors de ses fiches, la légende.
  livre: lucide('book-open'), diff: lucide('equal-not'), aide: lucide('circle-question-mark'),
};
const ICONES = { barres: 'j-barres', radar: 'j-radar', goutte: 'j-goutte', arome: 'j-arome', stock: 'j-stock', manque: 'j-manque', achat: 'j-achat', ebu: 'j-ebu', whirl: 'j-whirl', cuveA: 'j-cuve-a', cuveP: 'j-cuve-p', levure: 'j-levure' };
/* Les symboles de la page : chaque icône d'action existe à chaque taille employée, avec le trait qui
   donne la même épaisseur rendue (contrôle-standard S4) ; les pictos des familles prennent le ton
   donné par le langage (ton(f), par défaut le ton base des jetons). */
export function symboles({ trait = 1.5, tailles = [12, 14, 16, 18, 20], ton = (f) => JET[f].base } = {}) {
  let s = '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">';
  for (const f of ORDRE) s += `<symbol id="p-${f}" viewBox="0 0 24 24" fill="none" stroke="${ton(f)}" stroke-width="2.571" stroke-linecap="round" stroke-linejoin="round">${SYM['p-' + f].inner}</symbol>`;
  for (const z of tailles) {
    const w = r3(trait * 24 / z);
    for (const [k, inner] of Object.entries(ACTIONS)) s += `<symbol id="i-${k}-${z}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${inner}</symbol>`;
    for (const [k, id] of Object.entries(ICONES)) s += `<symbol id="i-${k}-${z}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${SYM[id].inner}</symbol>`;
  }
  return s + '</svg>';
}
const r3 = (x) => Math.round(x * 1000) / 1000;
export const ic = (k, z = 16, cls = 'ic') => `<svg class="${cls}" width="${z}" height="${z}" aria-hidden="true"><use href="#i-${k}-${z}"/></svg>`;
// Un picto de famille porte toujours sa famille (data-famille) : il reste hors du contrôle des traits d'action.
export const picto = (f, w = 16, attrs = '') => `<svg class="pi" width="${w}" height="${w}" data-famille="${f}" ${attrs} role="img" aria-label="${NOM[f]}"><use href="#p-${f}"/></svg>`;
// Les tons des familles en variables CSS : --b (base), --t (texte), --f (fond).
export const CSS_FAMILLES = ORDRE.map((f) => `[data-famille="${f}"]{--b:${JET[f].base};--t:${JET[f].texte};--f:${JET[f].fond}}`).join('\n');

// ---------- marques de la ligne ----------
export const STOCK = { suffisant: ['en stock', 'stock'], 'à acheter': ['à acheter', 'achat'], manque: ['stock insuffisant', 'manque'] };
export const stockMarque = (v, z = 14) => (v.levureVers ? '' : `<span class="stk" role="img" aria-label="${STOCK[v.stock][0]}">${ic(STOCK[v.stock][1], z)}</span>`);
export const MOMENT = {
  b60: ['60′', 'ebu', 'à 60′'], b10: ['10′', 'ebu', 'à 10′'], wp: ['whirlpool', 'whirl', 'au whirlpool'],
  dryActive: ['actif', 'cuveA', 'dry hop en fermentation active'], dryPost: ['après', 'cuveP', 'dry hop après fermentation'], levure: ['levure', 'levure', 'levure : toute la fermentation'],
};
export const pill = (id, z = 14) => { const [t, k, lg] = MOMENT[id]; return `<span class="mo" data-role="moment" data-moment="${id}" aria-label="Moment : ${lg}">${ic(k, z)}<span>${t}</span></span>`; };
// L'usage selon le moteur : amérisant (goutte), aromatique (arôme), double (les deux) ; déduit de l'α : au trait pâle.
const USAGE_IC = (z) => ({ amérisant: ic('goutte', z), aromatique: ic('arome', z), double: ic('goutte', z) + ic('arome', z), inconnu: '<b class="inc">?</b>' });
export function usage(h, z = 14) {
  const u = h.role || 'inconnu', src = /^fournisseur/.test(h.roleSource || '') ? 'fournisseur' : 'règle';
  const dit = src === 'fournisseur' ? 'attesté par le fournisseur' : 'déduit de l\'α, à valider';
  return `<span class="us${src === 'règle' ? ' deduit' : ''}" data-role="usage" data-usage="${u}" data-source="${src}" data-houblon="${h.houblon}" aria-label="${h.houblon} : ${u}, ${dit}">${USAGE_IC(z)[u] || USAGE_IC(z).inconnu}</span>`;
}
export const usages = (v, z) => (v.fiches || []).map((h) => usage(h, z)).join('');
// Le nom : chaque houblon porte data-houblon (l'appui long ouvre sa fiche) ; une levure n'a pas de fiche.
export const nomEl = (X, cls = 'nm') => {
  const { hops, nom } = nomVoie(X.v);
  if (!hops.length) return `<b class="${cls}">${nom}</b>`;
  return `<b class="${cls}">${hops.map((h) => `<span class="hn" data-houblon="${h}">${h}</span>`).join(' + ')}</b>`;
};
export const ajc = (X, z = 16) => { const { nom } = nomVoie(X.v), on = AJOUTEES.includes(X.n); return `<button class="ajc" data-role="ajouter-comparer" aria-pressed="${on}" aria-label="${on ? 'Retirer ' + nom + ' de la comparaison' : 'Ajouter ' + nom + ' à la comparaison'}">${ic('plus', z, 'ic i-plus')}${ic('check', z, 'ic i-check')}</button>`; };

// ---------- barres divergentes (s5) et zone du style ----------
export function zone(f) {
  if (f === 'resin') return null;
  const a = AVANT[f]; if (a == null) return undefined;
  const [b0, b1] = bande(f), c = cran(f);
  const rS0 = (b1 - a) / c / 3 * 100, lS0 = (a - b0) / c / 3 * 100, rA0 = (b1 - a) / 50 * 100, lA0 = (a - b0) / 50 * 100;
  return { rS: cl(rS0), lS: cl(lS0), rA: cl(rA0), lA: cl(lA0), rS0, lS0, rA0, lA0 };
}
const ztEl = (f, s0, a0) => `<i class="zt${s0 > 100 ? ' cs' : ''}${a0 > 100 ? ' ca' : ''}" data-role="zone" style="--c:${JET[f].base};--s:${p(cl(s0))};--a:${p(cl(a0))}"></i>`;
export const viseeS = (f) => (OB[f].visee - OB[f].maBiere.central) / OB[f].cran / 3 * 100;
export const viseeA = (f) => (OB[f].visee - OB[f].maBiere.central) / 50 * 100;
export function pctBar(f, e) {
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
  let h = `<i class="bar ${n}${b.ds ? ' ds' : ''}${b.da ? ' da' : ''}" data-role="effet" data-famille="${f}" style="--c:${JET[f].base};--s:${p(b.s)};--a:${p(b.a)}"></i>`;
  if (X.hs.has(f)) h += hsSeg(f, b, side);
  if (lab) h += `<span class="lab-i" style="--s:${p(b.s)};--a:${p(b.a)}">${lab}</span>`;
  return h;
}
const inconnu = (f) => `<i class="bar inconnu" data-role="effet" data-famille="${f}" aria-label="${NOM[f]} : effet non établi"></i>`;
function zt(f, side) { const z = zone(f); if (!z) return ''; return ztEl(f, side === 'r' ? z.rS0 : z.lS0, side === 'r' ? z.rA0 : z.lA0); }
export const arr = (c) => (Math.abs(c) < 0.5 ? (c < 0 ? '≈ −' : '≈ +') : (c > 0 ? '+' : '−') + Math.round(Math.abs(c)) + (Math.round(Math.abs(c)) >= 2 ? ' crans' : ' cran'));
// Deux couloirs : en haut le floral, en bas le résineux (à gauche) et les agrumes (à droite).
export function couloirs(X, avecLab = false) {
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
export function jauge(c, hors) {
  const n = Math.abs(c) < 0.5 ? 0 : Math.min(4, Math.round(Math.abs(c)));
  const seg = n ? Array.from({ length: n }, () => '<i></i>').join('') : '<i class="pt"></i>';
  return `<span class="jg${c < 0 ? ' bas' : ''}${hors ? ' xs' : ''}">${seg}</span>`;
}
/* Une case : data-famille et data-crans ; obj = objectif (cerclé). sansPicto : la colonne porte le picto
   (l8). */
export function caseFam(X, f, obj, { sansPicto = false, z = 16 } = {}) {
  const t = X.v.tout.find((x) => x.famille === f), pi = sansPicto ? '' : picto(f, z);
  if (obj) {
    const e = X.v.effet[f];
    if (!e.etabli) return `<span class="cf o ne" data-famille="${f}" aria-label="${NOM[f]} : effet non établi">${pi}<span class="jg ne"><i></i></span></span>`;
    const c = t ? t.crans : 0, n = niv(X.v, f, e.central);
    return `<span class="cf o ${n}${e.central < 0 ? ' moins' : ''}${X.hs.has(f) ? ' hors' : ''}" data-famille="${f}" data-crans="${c}" aria-label="${NOM[f]} ${sg(e.central)} (${crTxt(c)}) · ${NIVMOT[n]}${X.hs.has(f) ? ' · hors du style' : ''}">${pi}${jauge(c, X.hs.has(f))}</span>`;
  }
  if (!t || Math.abs(t.effet) < 0.5) return '<span class="cf vide"></span>';
  const n = niv(X.v, f, t.effet);
  return `<span class="cf ${n}${t.effet < 0 ? ' moins' : ''}${X.hs.has(f) ? ' hors' : ''}" data-role="extra" data-famille="${f}" data-crans="${t.crans}" aria-label="${NOM[f]} ${sg(t.effet)} (${crTxt(t.crans)}) · ${NIVMOT[n]}${X.hs.has(f) ? ' · hors du style' : ''}">${pi}${jauge(t.crans, X.hs.has(f))}</span>`;
}
export const casesVoie = (X, slots, o = {}) => `<span class="cases"><span class="objs">${OBJ.map((f) => caseFam(X, f, true, o)).join('')}</span><span class="exs">${slots.map((f) => caseFam(X, f, false, o)).join('')}</span></span>`;

// ---------- biotransformation (voie 15) ----------
export function bioPill(X, z = 14) {
  const sig = (X.v.bio || []).flatMap((h) => h.signaux); if (!sig.length) return '';
  const has = (id) => sig.find((s) => s.id === id);
  let pic = '';
  if (has('geraniol-citronellol')) pic += `<span class="bt">${picto('floral', z)}${ic('fleche', 12)}${picto('citrus', z)}</span>`;
  if (has('thiols')) pic += `<span class="bt">${picto('tropical', z)}${picto('berries', z)}</span>`;
  if (has('hop-creep')) pic += `<span class="bt mot">${ic('bulles', z)}<span>creep</span></span>`;
  const liste = sig.map((s) => `<li><b>${s.titre}</b> · ${s.statut}. <span class="src">${s.pourquoi}</span></li>`).join('');
  return `<details class="bio" data-role="bio"><summary aria-label="Biotransformation possible, ampleur non quantifiée">${pic}</summary><ul>${liste}</ul></details>`;
}

// ---------- les réponses (tuiles des objectifs) ----------
function meilleure(f, sens) {
  const c = V.filter((X) => X.v.effet[f].etabli && !X.hs.size);
  return c.length ? c.reduce((b, X) => ((sens > 0 ? X.v.effet[f].central > b.v.effet[f].central : X.v.effet[f].central < b.v.effet[f].central) ? X : b)) : null;
}
export const REP = (() => {
  const fl = meilleure('floral', 1), ci = meilleure('citrus', 1);
  const vFl = OB.floral.maBiere.central + fl.v.effet.floral.central, vCi = OB.citrus.maBiere.central + ci.v.effet.citrus.central;
  const verd = (f, v) => (v >= OB[f].visee ? 'atteint' : Math.abs(v - OB[f].visee) <= Math.abs(OB[f].maBiere.central - OB[f].visee) / 2 ? 'approche' : 'aucune');
  const re = meilleure('resin', -1);
  return {
    MOT: { atteint: 'Atteint', approche: 'Approche', aucune: 'Aucune' },
    resin: { verdict: DEG.min + re.v.effet.resin.central <= OB.resin.visee ? 'atteint' : 'aucune', deg: DEG, meilleure: re },
    floral: { verdict: verd('floral', vFl), voie: fl, avant: OB.floral.maBiere.central, apres: vFl, visee: OB.floral.visee, frac: fl.v.effet.floral.central / OB.floral.cran },
    citrus: { verdict: verd('citrus', vCi), voie: ci, avant: OB.citrus.maBiere.central, apres: vCi, visee: OB.citrus.visee, frac: ci.v.effet.citrus.central / OB.citrus.cran },
  };
})();
export const repLabel = {
  resin: 'Moins résineux : ma bière est au-dessus du style d\'après la dégustation ; aucune voie houblon ne l\'y ramène',
  floral: `Plus floral : la meilleure voie, ${nomVoie(REP.floral.voie.v).nom}, ${REP.MOT[REP.floral.verdict].toLowerCase()} la visée (${fr(REP.floral.avant)} → ${fr(REP.floral.apres)}, visée ${fr(REP.floral.visee)})`,
  citrus: `Plus agrumes : la meilleure voie, ${nomVoie(REP.citrus.voie.v).nom}, ${REP.MOT[REP.citrus.verdict].toLowerCase()} la visée (${fr(REP.citrus.avant)} → ${fr(REP.citrus.apres)}, visée ${fr(REP.citrus.visee)})`,
};
export const HH_JS = "var d=document.getElementById('hh');d.open=true;d.scrollIntoView({behavior:'smooth'})";

// Les demi-pistes de q2b (transparentes) : data-role="piste" par objectif, visées en tirets fins.
export function fonds() {
  const flS = viseeS('floral'), flA = viseeA('floral'), ciA = viseeA('citrus');
  const fo0 = cl((DEG.min - OB.resin.visee) / 50 * 100);
  return `
    <div class="fonds">
      <div class="moitie re" data-role="piste" data-famille="resin"><i class="flou" style="--s0:100%;--s1:0%;--a0:${p(fo0)};--a1:${p(100 - fo0)}"></i></div>
      <div class="gut"></div>
      <div class="moitie fl" data-role="piste" data-famille="floral">
        <i class="ov" data-role="piste" data-famille="citrus"></i>
        <i class="vl" style="--s:${p(flS)};--a:${p(flA)}"></i>
        <i class="vl" style="--s:${p(viseeS('citrus'))};--a:${p(ciA)}"></i>
      </div>
    </div>`;
}

export function details() {
  const ib = V.map((X) => nomVoie(X.v).nom + ' ' + MOMENT[momentDe(X.v)][0] + ' ' + fr(X.v.ibu.after)).join(' · ');
  const hh = C.horsModele.map((h) => h.pistes.map((x) => `<li><b>${x.titre}</b> : ${x.action.charAt(0).toLowerCase() + x.action.slice(1)} <span class="src">${x.preuve}</span></li>`).join('')).join('');
  return `
  <details class="pli"><summary>IBU après chaque voie (ma bière ${fr(C.ibu)} ; style ${C.bandeIbu.join('–')})</summary><ul><li>${ib}</li></ul></details>
  <details class="pli" id="hh"><summary>Hors houblon · résineux (${C.horsModele[0].pistes.length} pistes)</summary><ul>${hh}</ul></details>`;
}

// ---------- la fiche g1 : données du pack, rôle et stock de c1 ----------
const plageSrc = (s) => ({ src: s.source, an: s.annee ?? null, min: s.min, max: s.max });
const uniq = (xs) => { const vu = new Set(); return xs.filter((w) => { const k = w.toLowerCase(); if (vu.has(k)) return false; vu.add(k); return true; }).map((w) => w.toLowerCase()); };
const HOPS = [...new Set(C.voies.flatMap((v) => (v.fiches || []).map((h) => h.houblon)))];
function ficheDe(nom) {
  const c1f = C.voies.flatMap((v) => v.fiches || []).find((h) => h.houblon === nom);
  const role = c1f && c1f.role ? { v: c1f.role, src: /^fournisseur/.test(c1f.roleSource || '') ? 'fournisseur' : 'règle', txt: c1f.roleSource } : null;
  const X = V.find((Y) => Y.v.type === 'ajouter' && Y.v.actions.length === 1 && Y.v.actions[0].houblon === nom) || V.find((Y) => (Y.v.fiches || []).some((h) => h.houblon === nom));
  const ajout = X && X.v.type === 'ajouter' ? { g: X.v.actions[0].grammes, moment: X.v.actions[0].moment } : null;
  const commun = { nom, role, voie: X ? X.n : null, stock: X ? X.v.stock : null, ajout, alphaC1: (c1f && c1f.alpha) || null };
  const f = PF.find((x) => x.name === nom);
  if (f) {
    const de = f.alpha && f.alpha.retenu ? f.alpha.retenu.from : null;
    const comp = (f.huiles && f.huiles.composants) || {};
    const NOMS_H = { myrcene: 'myrcène', humulene: 'humulène', caryophyllene: 'caryophyllène', farnesene: 'farnésène', linalool: 'linalol' };
    return { ...commun, origine: f.origin || null,
      alpha: ((f.alpha && f.alpha.sources) || []).map(plageSrc),
      lot: de === 'fiche de stock' || de === 'lu sur l’article' ? f.alpha.retenu.value : null,
      beta: ((f.beta && f.beta.sources) || []).map(plageSrc),
      huiles: ((f.huiles && f.huiles.totale && f.huiles.totale.sources) || []).map(plageSrc),
      composants: Object.entries(NOMS_H).map(([k, n]) => (comp[k] ? { nom: n, min: comp[k].min, max: comp[k].max, src: comp[k].source } : { nom: n, raison: comp[k + 'Raison'] || null })),
      aromes: (f.aromes || []).filter((a) => a.sources > 0).map((a) => ({ f: a.family, n: a.sources, of: a.of, auteurs: a.authors || [], mots: uniq((a.mots || []).flatMap((m) => m.mots)), premier: a.sources === 1 && (a.premier || []).length > 0 })),
      of: ((f.aromes || [])[0] || {}).of || 0,
      sans: uniq((f.motsSansFamille || []).map((s) => s.mot)),
      styles: (f.usage || []).flatMap((u) => u.styles || []), stylesSrc: (f.usage || []).map((u) => u.source).filter(Boolean), stylesRaison: f.usageRaison || null,
      desc: (f.descripteurs && f.descripteurs.beerMaverick) || [],
      subs: Array.isArray(f.substituts) ? f.substituts.map((x) => (typeof x === 'string' ? x : x.name || x.nom || '')).filter(Boolean) : [], subsRaison: f.substitutsRaison || null };
  }
  // Celeia : pas de fiche du pack ; le catalogue du moteur (Beer Maverick) et les familles de c1.
  const v = VARS.find((x) => x.name === nom);
  const an = ((v.descriptions || []).find((d) => d.source && d.source.author === 'Beer Maverick') || { source: {} }).source.year || null;
  const src = (a) => (Array.isArray(a) ? [{ src: 'Beer Maverick', an, min: a[0], max: a[1] }] : []);
  const fam = (c1f && c1f.familles) || [];
  return { ...commun, catalogue: true, origine: v.origin || null, alpha: src(v.alpha), lot: null, beta: src(v.beta), huiles: src(v.oil), composants: [],
    aromes: fam.map((x) => ({ f: x.famille, n: x.n, of: x.sur, auteurs: [], mots: [], premier: x.n === 1 && !!x.premier })), of: fam.length ? fam[0].sur : 0,
    sans: [], styles: [], stylesSrc: [], stylesRaison: 'styles d’emploi non publiés dans le dépôt', desc: v.tagsFr || [], subs: [], subsRaison: null };
}
export const FICHES = Object.fromEntries(HOPS.map((n) => [n, ficheDe(n)]));
const ROUE = PACK.roueAromes.map((r) => r.id);
const DEMANDE = C.objectifs.map((o) => ({ f: o.famille, s: o.crans > 0 ? 1 : -1 }));
const TONS = Object.fromEntries(ORDRE.map((f) => [f, JET[f]]));

/* ---------- le script de la page : lentille, « + », fiche et gestes ----------
   Une seule source pour les trois langages ; l'habillage vient des variables CSS (--fi-*, --r-*). */
export function runtime({ extra = '' } = {}) {
  return `
const FD = ${JSON.stringify(FICHES)};
const ROUE = ${JSON.stringify(ROUE)}, ORDRE = ${JSON.stringify(ORDRE)}, COURT = ${JSON.stringify(COURT)}, DEMANDE = ${JSON.stringify(DEMANDE)}, TONS = ${JSON.stringify(TONS)};
const REDUIT = matchMedia('(prefers-reduced-motion: reduce)').matches;
const NS = 'http://www.w3.org/2000/svg';
function h(t, a, ...k) { const e = document.createElement(t); for (const [x, y] of Object.entries(a || {})) { if (y == null || y === false) continue; if (x.startsWith('on')) e.addEventListener(x.slice(2), y); else e.setAttribute(x, y); } for (const c of k.flat()) if (c != null) e.append(c); return e; }
function sv(t, a, p) { const e = document.createElementNS(NS, t); for (const [x, y] of Object.entries(a || {})) if (y != null) e.setAttribute(x, y); if (p) p.append(e); return e; }
const icone = (k, z) => { const s = sv('svg', { width: z, height: z, 'aria-hidden': 'true', class: 'ic' }); sv('use', { href: '#i-' + k + '-' + z }, s); return s; };
const nbF = (v) => String(v).replace('.', ',');
const plageF = (s) => (s.min === s.max ? nbF(s.min) : nbF(s.min) + '–' + nbF(s.max));
const recente = (arr) => (arr || []).reduce((a, s) => (!a || (s.an || 0) > (a.an || 0) ? s : a), null);
const ROLE_MOT = { 'amérisant': 'amérisant', aromatique: 'aromatique', double: 'double usage' };
const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const MAXM = 3;

/* La lentille au style / absolu ; Barres / Radar reste un choix d'affichage. */
document.querySelectorAll('.lentille [data-e]').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('.lentille [data-e]').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
  document.body.classList.toggle('abs', b.dataset.e === 'absolu');
}));
if (/[?&]abs\\b/.test(location.search)) document.querySelector('.lentille [data-e="absolu"]').click();
const nbCmp = () => document.querySelectorAll('[data-role="ajouter-comparer"][aria-pressed="true"]').length;
function majCmp() { const nb = document.querySelector('[data-role="comparer"] .nb'); if (nb) nb.textContent = '(' + nbCmp() + ')'; }
document.querySelectorAll('[data-role="ajouter-comparer"]').forEach((b) => b.addEventListener('click', () => {
  b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'));
  const nom = b.closest('[data-voie]').querySelector('.nm').innerText;
  b.setAttribute('aria-label', (b.getAttribute('aria-pressed') === 'true' ? 'Retirer ' + nom + ' de la comparaison' : 'Ajouter ' + nom + ' à la comparaison'));
  majCmp();
}));

/* ---------- la fiche ---------- */
const FICHE = { cle: null, mode: null, source: null, sec: null, epingle: false, racine: null, tFerme: null, ajoute: {}, gout: {} };
FICHE.racine = h('div', { id: 'fiche-racine' }); document.body.append(FICHE.racine);
const caseF = (f, n) => h('i', { class: 'c' + (n >= 2 ? ' m' : n === 1 ? ' ci' : ''), 'data-famille': f, 'aria-hidden': 'true' });
const fichesTxt = (a) => (a.of === 1 ? '' : a.n + '/' + a.of);
const coupe = (xs, n) => (xs.length > n ? xs.slice(0, n).join(', ') + ' +' + (xs.length - n) : xs.join(', '));
function blocAlpha(F) {
  const a = recente(F.alpha), role = F.role ? ROLE_MOT[F.role.v] || F.role.v : null;
  const txt = a ? plageF(a) + ' %' : F.lot != null ? nbF(F.lot) + ' %' : 'non renseigné';
  const W = 60, s = sv('svg', { width: W, height: 12, 'aria-hidden': 'true', class: 'f-reglette' });
  const x = (v) => 2 + Math.max(0, Math.min(1, v / 25)) * (W - 4);
  sv('rect', { x: 2, y: 4, width: W - 4, height: 4, rx: 2, class: 'rg-p' }, s);
  for (const src of F.alpha) sv('rect', { x: x(src.min) - 1, y: 2, width: Math.max(3, x(src.max) - x(src.min) + 2), height: 8, rx: 2, class: src === a ? 'rg-a' : 'rg-b' }, s);
  if (F.lot != null) sv('rect', { x: x(F.lot) - 1.5, y: 0, width: 3, height: 12, rx: 1, class: 'rg-l' }, s);
  // l8e, l8f : la note de la fiche de la base (noteAlpha) : un cryo porte les plages de la variété en pellets ; mon lot hors des plages de ses fiches se dit.
  const A = F.alphaC1, note = /cryo$/i.test(F.nom) ? 'α : fiches du ' + F.nom.replace(/\\s*cryo$/i, '') + ' en pellets ; celle du cryo manque.' : A && A.horsFiches && A.lot != null ? 'Mon lot ' + nbF(A.lot) + ' % : hors des plages de ses fiches.' : null;
  return h('div', { class: 'f-ab' + (note ? ' avec-note' : '') },
    h('span', { class: 'f-alpha', 'data-role': 'fiche-alpha', 'aria-label': 'Acides alpha ' + txt + (a ? ' (' + a.src + (a.an ? ' ' + a.an : '') + ')' : '') + (F.lot != null ? ', mon lot ' + nbF(F.lot) + ' %' : '') },
      h('span', { class: 'f-grec' }, 'α'), h('b', { class: 'f-aa' }, txt), F.lot != null && a ? h('span', { class: 'f-lot' }, 'lot ' + nbF(F.lot) + ' %') : null),
    a ? s : null,
    note ? h('p', { class: 'f-note', 'data-role': 'alpha-note' }, note) : null,
    role ? h('span', { class: 'f-role' + (F.role.src === 'règle' ? ' regle' : ''), title: F.role.txt || null, 'aria-label': 'Rôle : ' + role + (F.role.src === 'règle' ? ', déduit de l\\'α, à valider' : ', attesté par le fournisseur') }, role) : null);
}
function blocLabels(F) {
  const par = Object.fromEntries(F.aromes.map((a) => [a.f, a]));
  const decrites = ORDRE.filter((f) => par[f]), nd = ORDRE.filter((f) => !par[f]);
  const lignes = decrites.map((f) => {
    const a = par[f], cpt = [fichesTxt(a), a.premier ? 'nommé en premier' : ''].filter(Boolean).join(' · ');
    return h('div', { class: 'f-lab', 'data-famille': f }, caseF(f, a.n),
      h('span', { class: 'f-lab-t' }, h('span', { class: 'f-lab-n' }, COURT[f]), cpt ? h('span', { class: 'f-cpt' }, ' ' + cpt) : null),
      a.mots.length ? h('span', { class: 'f-lab-mots', title: a.mots.join(', ') }, coupe(a.mots, MAXM)) : null);
  });
  return h('div', { class: 'f-labels', 'data-role': 'fiche-labels' },
    h('div', { class: 'f-bande', role: 'img', 'aria-label': 'Les familles citées par les fiches de ' + F.nom }, ORDRE.map((f) => caseF(f, par[f] ? par[f].n : 0)),
      F.of === 1 ? h('span', { class: 'f-seule' }, '1 seule fiche') : null),
    ...lignes,
    F.sans.length ? h('p', { class: 'f-lab-sans', title: F.sans.join(', ') }, 'sans famille : ' + coupe(F.sans, MAXM)) : null,
    nd.length ? h('p', { class: 'f-lab-nd' }, nd.length + ' non décrite' + (nd.length > 1 ? 's' : '')) : null);
}
/* La roue chiffrée : le nombre de fiches qui citent chaque famille, « N/M » sous la famille ; une famille
   non décrite est inconnue (« ? », secteur hachuré), jamais à zéro ; axes aux couleurs des familles. */
function roue(F, W, H) {
  const lv = Object.fromEntries(F.aromes.map((a) => [a.f, a]));
  const vals = ROUE.map((f) => (lv[f] ? lv[f].n : null));
  const max = Math.max(2, ...vals.filter((v) => v != null));
  const R = Math.min(W / 2 - 74, H / 2 - 34), cx = W / 2, cy = H / 2, n = ROUE.length, pas = 2 * Math.PI / n;
  const rr = (v) => R * (v + 0.5) / (max + 0.5);
  const P = (k, r) => [cx + Math.sin(k * pas) * r, cy - Math.cos(k * pas) * r];
  const s = sv('svg', { width: W, height: H, viewBox: '0 0 ' + W + ' ' + H, 'data-radar': '', 'data-objet': 'fiche', 'data-axes': ROUE.join(','), role: 'img',
    'aria-label': 'Silhouette de ' + F.nom + ' selon ses fiches : ' + (ROUE.filter((f, k) => vals[k]).map((f) => COURT[f].toLowerCase() + ' ' + (lv[f].of === 1 ? 'une seule fiche' : lv[f].n + ' sur ' + lv[f].of)).join(', ') || 'aucun arôme décrit') + ' ; les autres familles sont inconnues, pas à zéro' });
  const defs = sv('defs', {}, s), pat = sv('pattern', { id: 'hach-' + F.voie, width: 5, height: 5, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs);
  sv('line', { x1: 0, y1: 0, x2: 0, y2: 5, class: 'r-hach' }, pat);
  ROUE.forEach((f, k) => { if (vals[k] != null) return; const a = P(k - 0.5, R), b = P(k + 0.5, R);
    sv('path', { d: 'M' + cx + ',' + cy + 'L' + a.join(',') + 'A' + R + ',' + R + ' 0 0 1 ' + b.join(',') + 'Z', fill: 'url(#hach-' + F.voie + ')', class: 'r-inc' }, s); });
  for (const v of [1, 2].filter((x) => x <= max)) sv('polygon', { points: ROUE.map((f, k) => P(k, rr(v)).join(',')).join(' '), class: 'r-anneau' }, s);
  sv('polygon', { points: ROUE.map((f, k) => P(k, R).join(',')).join(' '), class: 'r-bord' }, s);
  ROUE.forEach((f, k) => { const e = P(k, R); sv('line', { x1: cx, y1: cy, x2: e[0], y2: e[1], class: vals[k] != null ? 'r-axe on' : 'r-axe', stroke: vals[k] != null ? TONS[f].base : null }, s); });
  const pts = ROUE.map((f, k) => P(k, vals[k] != null ? rr(vals[k]) : 0));
  sv('polygon', { points: pts.map((x) => x.join(',')).join(' '), class: 'r-serie', 'data-serie': F.nom, 'data-valeurs': vals.map((v) => (v == null ? 0 : v)).join(','), 'data-inconnues': ROUE.filter((f, k) => vals[k] == null).join(',') }, s);
  ROUE.forEach((f, k) => { if (vals[k] == null) return; const q = pts[k]; sv('circle', { cx: q[0], cy: q[1], r: 3.6, class: vals[k] >= 2 ? 'r-pt plein' : 'r-pt' }, s); });
  const dem = Object.fromEntries(DEMANDE.map((d) => [d.f, d.s]));
  ROUE.forEach((f, k) => {
    const q = P(k, R + 14), t = sv('text', { x: q[0], y: q[1], 'text-anchor': Math.abs(q[0] - cx) < 8 ? 'middle' : q[0] > cx ? 'start' : 'end', 'dominant-baseline': 'middle', class: 'r-lab' + (vals[k] == null ? ' inc' : '') + (dem[f] ? ' dem' : '') }, s);
    t.textContent = COURT[f] + (vals[k] == null ? '?' : '');
    if (vals[k] != null && lv[f].of > 1) { const u = sv('tspan', { class: 'r-cpt' }, t); u.textContent = ' ' + lv[f].n + '/' + lv[f].of; }
  });
  return s;
}
function blocArome(F, W) {
  const z = h('div', { class: 'f-arome', 'data-role': 'fiche-arome' });
  z.append(roue(F, W, 228));
  const lv = Object.fromEntries(F.aromes.map((a) => [a.f, a]));
  z.append(h('p', { class: 'f-dem', 'data-role': 'demande' }, DEMANDE.map((d) => { const a = lv[d.f];
    return h('span', { class: 'f-dem-i', 'data-famille': d.f }, h('b', {}, (d.s > 0 ? '+ ' : '− ') + COURT[d.f]), ' ' + (a ? (a.of === 1 ? '1 fiche' : a.n + '/' + a.of) : 'inconnu')); })));
  return z;
}
function blocActions(F) {
  const g = FICHE.gout[F.nom] || 'neutre';
  const gout = (c, t, k) => h('button', { class: 'f-g', 'aria-pressed': String(g === c), 'aria-label': (g === c ? 'Remettre neutre : ' : '') + t + ' ' + F.nom, onclick: (e) => { e.stopPropagation(); FICHE.gout[F.nom] = g === c ? 'neutre' : c; construire(); } }, icone(k, 16));
  const voie = F.voie && document.querySelector('[data-voie="' + F.voie + '"] [data-role="ajouter-comparer"]');
  const dans = voie && voie.getAttribute('aria-pressed') === 'true';
  const aj = FICHE.ajoute[F.nom];
  return h('div', { class: 'f-actions' },
    h('span', { class: 'f-gout', role: 'group', 'data-role': 'gout', 'aria-label': 'Mon goût pour ' + F.nom + ' : ' + g }, gout('aimer', 'Aimer', 'coeur'), gout('exclure', 'Exclure', 'ban')),
    F.ajout ? h('button', { class: 'f-act f-ajouter', 'aria-pressed': String(!!aj), 'aria-label': (aj ? 'Ajouté : ' : 'Ajouter ') + F.nom + ', ' + F.ajout.g + ' g à ' + F.ajout.moment, onclick: (e) => { e.stopPropagation(); FICHE.ajoute[F.nom] = !aj; construire(); } },
      icone(aj ? 'check' : 'plus', 16), (aj ? 'Ajouté à ' : 'Ajouter à ') + F.ajout.moment) : null,
    voie ? h('button', { class: 'f-act f-cmp', 'aria-pressed': String(dans), 'aria-label': (dans ? 'Retirer ' : 'Comparer ') + F.nom, onclick: (e) => { e.stopPropagation(); voie.click(); construire(); } }, icone(dans ? 'check' : 'plus', 16), 'Comparer') : null);
}
const srcTxt = (s) => s.src + (s.an ? ' ' + s.an : '');
const rangee = (n, v) => h('div', { class: 'f-rg' }, h('span', { class: 'f-rg-n' }, n), h('span', { class: 'f-rg-v' }, v));
const tags = (xs) => h('div', { class: 'f-tags' }, xs.map((t) => h('span', { class: 'f-tag' }, t)));
const SECTIONS = [
  ['styles', 'Styles', (F) => [F.styles.length ? tags(F.styles) : h('p', { class: 'f-txt' }, F.stylesRaison || 'non renseigné'), F.stylesSrc.length ? h('p', { class: 'f-txt gris' }, F.stylesSrc.join(' ; ')) : null]],
  ['huiles', 'Huiles', (F) => [...(F.huiles.length ? F.huiles.map((s) => rangee('totale, ' + srcTxt(s), plageF(s) + ' mL/100 g')) : [rangee('totale', 'non renseigné')]),
    ...F.composants.map((c) => rangee(c.nom, c.min != null ? plageF(c) + ' %' + (c.src ? ', ' + c.src : '') : c.raison || 'non renseigné'))]],
  ['sources', 'Sources', (F) => [...F.alpha.map((s) => rangee('α ' + srcTxt(s), plageF(s) + ' %')), ...(F.lot != null ? [rangee('α mon lot', nbF(F.lot) + ' %')] : []),
    ...(F.beta.length ? F.beta.map((s) => rangee('β ' + srcTxt(s), plageF(s) + ' %')) : [rangee('β', 'non renseigné')]),
    h('p', { class: 'f-txt' }, 'Origine : ' + (F.origine || 'non renseigné') + (F.role && F.role.txt ? ' ; rôle : ' + F.role.txt : '')),
    ...F.aromes.map((a) => h('p', { class: 'f-txt' }, h('b', {}, COURT[a.f] + (a.of === 1 ? '' : ' ' + a.n + '/' + a.of)), ' ' + (a.auteurs.join(', ') || (F.catalogue ? 'fiches du moteur (c1)' : 'non renseigné')))),
    F.desc.length ? tags(F.desc) : null]],
  ['subs', 'Substituts', (F) => [F.subs.length ? tags(F.subs) : h('p', { class: 'f-txt' }, F.subsRaison || 'non renseigné dans le pack')]],
];
function blocReplis(F) {
  const sec = SECTIONS.find((x) => x[0] === FICHE.sec);
  return [h('div', { class: 'f-replis', role: 'group', 'aria-label': 'Détail de la fiche' }, SECTIONS.map(([id, t]) => h('button', { class: 'f-repli', 'aria-expanded': String(FICHE.sec === id),
    onclick: (e) => { e.stopPropagation(); FICHE.sec = FICHE.sec === id ? null : id; construire(true); } }, t, icone('chev-r', 12)))),
    sec ? h('section', { class: 'f-sec', 'aria-label': sec[1] }, ...sec[2](F).filter(Boolean)) : null];
}
function construire(versSection) {
  const F = FD[FICHE.cle]; if (!F) return;
  const ancien = FICHE.racine.querySelector('.f-fiche'), defil = ancien ? ancien.scrollTop : 0;
  const W = FICHE.mode === 'bulle' ? 328 : Math.min(innerWidth, 390) - 32;
  const st = { suffisant: ['en stock', 'stock'], 'à acheter': ['à acheter', 'achat'], manque: ['stock insuffisant', 'manque'] }[F.stock];
  const fe = h('section', { class: 'f-fiche f-' + FICHE.mode, 'data-role': 'fiche', role: 'dialog', tabindex: '-1', 'aria-modal': FICHE.mode === 'feuille' ? 'true' : null, 'aria-label': 'Fiche de ' + F.nom },
    FICHE.mode === 'feuille' ? h('div', { class: 'f-poignee', 'aria-hidden': 'true' }) : null,
    h('div', { class: 'f-corps' },
      h('header', { class: 'f-tete' }, h('h2', { class: 'f-nom' }, F.nom), st ? h('span', { class: 'f-stk', role: 'img', 'aria-label': st[0] }, icone(st[1], 16)) : null,
        h('button', { class: 'f-fermer', 'data-role': 'fermer-fiche', 'aria-label': 'Fermer la fiche de ' + F.nom, onclick: (e) => { e.stopPropagation(); fermer(); } }, icone('x', 18))),
      blocAlpha(F), blocLabels(F), blocArome(F, W), blocActions(F), ...blocReplis(F)));
  const voile = FICHE.mode === 'feuille' ? h('div', { class: 'f-voile', 'aria-hidden': 'true', onclick: () => fermer() }) : null;
  FICHE.racine.replaceChildren(...[voile, fe].filter(Boolean));
  if (FICHE.mode === 'bulle') placerBulle(fe);
  fe.scrollTop = defil;
  if (versSection) { const x = fe.querySelector('.f-sec'); if (x) x.scrollIntoView({ block: 'nearest' }); }
  for (const e of document.querySelectorAll('.f-source')) e.classList.remove('f-source');
  const src = FICHE.source && FICHE.source.closest('[data-voie]'); if (src) src.classList.add('f-source');
}
function placerBulle(fe) {
  const col = document.querySelector('main').getBoundingClientRect();
  const r = FICHE.source && FICHE.source.isConnected ? FICHE.source.getBoundingClientRect() : { top: 80 };
  let x = col.right + 16; if (x + fe.offsetWidth > innerWidth - 8) x = Math.max(8, col.left - fe.offsetWidth - 16);
  fe.style.left = x + 'px'; fe.style.top = Math.max(8, Math.min(innerHeight - fe.offsetHeight - 8, r.top - 60)) + 'px';
}
function ouvrir(cle, o) {
  if (!FD[cle]) return;
  const deja = FICHE.cle != null;
  if (FICHE.cle !== cle) FICHE.sec = null;
  FICHE.cle = cle; FICHE.source = o.source || null; FICHE.mode = o.mode; if (!deja) FICHE.epingle = !!o.epingle;
  clearTimeout(FICHE.tFerme); construire();
  const fe = FICHE.racine.querySelector('.f-fiche');
  if (!deja && !REDUIT) fe.animate(FICHE.mode === 'feuille' ? [{ transform: 'translateY(30%)' }, { transform: 'none' }] : [{ transform: 'scale(.97)' }, { transform: 'none' }], { duration: 200, easing: 'cubic-bezier(.2,.8,.2,1)' });
  if (o.clavier) { const b = fe.querySelector('[data-role="fermer-fiche"]'); if (b) b.focus({ preventScroll: true }); }
}
function fermer() {
  if (FICHE.cle == null) return;
  const src = FICHE.source; FICHE.cle = null; FICHE.epingle = false; FICHE.sec = null; clearTimeout(FICHE.tFerme);
  FICHE.racine.replaceChildren();
  for (const e of document.querySelectorAll('.f-source')) e.classList.remove('f-source');
  if (src && src.isConnected && document.activeElement === document.body) { const f = src.closest('button, [tabindex]'); if (f) f.focus({ preventScroll: true }); }
}
window.ouvrirFiche = (cle) => ouvrir(cle, { mode: innerWidth >= 700 ? 'bulle' : 'feuille', epingle: true });

/* ---------- gestes : appui long (doigt), survol long (souris), clavier ----------
   Tout nom de houblon (data-houblon) et toute la ligne de sa voie (data-role="ligne-houblon"), hors de
   ses commandes (« + », biotransformation), qui gardent leur toucher court. */
const APPUI_MS = 500, SURVOL_MS = 750;
const CARTE = '[data-role="ligne-houblon"]', COMMANDE = 'button, a, input, select, textarea, summary, [role="button"], [data-role="gout"]';
function zoneH(t) {
  if (!t || !t.closest || FICHE.racine.contains(t)) return null;
  const e = t.closest('[data-houblon]');
  if (e && FD[e.getAttribute('data-houblon')]) { const c = e.closest(CARTE); return { el: e, zone: c || e }; }
  const c = t.closest(CARTE); if (!c) return null;
  const cmd = t.closest(COMMANDE); if (cmd && c.contains(cmd)) return null;
  const n = c.querySelector('.nm [data-houblon]') || c.querySelector('[data-houblon]');
  return n && FD[n.getAttribute('data-houblon')] ? { el: n, zone: c } : null;
}
let APPUI = null, AVALE = 0;
document.addEventListener('click', (e) => { if (performance.now() < AVALE) { e.stopPropagation(); e.preventDefault(); } }, true);
document.addEventListener('contextmenu', (e) => { if ((APPUI && APPUI.type !== 'mouse') || performance.now() < AVALE) e.preventDefault(); });
function annuler() { const a = APPUI; APPUI = null; if (a) { clearTimeout(a.timer); a.zone.classList.remove('appui'); } }
document.addEventListener('pointerdown', (e) => {
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  AVALE = 0;
  if (FICHE.racine.contains(e.target)) { if (FICHE.mode === 'bulle') FICHE.epingle = true; return; }
  if (FICHE.cle != null && FICHE.mode === 'bulle') fermer();
  if (APPUI) annuler();
  const z = zoneH(e.target); if (!z) return;
  const a = { el: z.el, zone: z.zone, cle: z.el.getAttribute('data-houblon'), x: e.clientX, y: e.clientY, id: e.pointerId, type: e.pointerType, actif: false };
  APPUI = a; z.zone.classList.add('appui');
  a.timer = setTimeout(() => {
    if (APPUI !== a) return;
    a.actif = true; AVALE = performance.now() + 15000; try { navigator.vibrate && navigator.vibrate(8); } catch (x) { /* rien */ }
    a.zone.classList.remove('appui');
    ouvrir(a.cle, { source: a.el, mode: a.type === 'mouse' || innerWidth >= 700 ? 'bulle' : 'feuille' });
  }, APPUI_MS);
}, true);
document.addEventListener('pointermove', (e) => { if (APPUI && e.pointerId === APPUI.id && !APPUI.actif && Math.hypot(e.clientX - APPUI.x, e.clientY - APPUI.y) > 10) annuler(); }, true);
function relacher() { const a = APPUI; if (!a) return; if (!a.actif) { annuler(); return; } APPUI = null; AVALE = performance.now() + 400; }
document.addEventListener('pointerup', (e) => { if (APPUI && e.pointerId === APPUI.id) relacher(); }, true);
document.addEventListener('pointercancel', (e) => { if (APPUI && e.pointerId === APPUI.id && !APPUI.actif) annuler(); }, true);
document.addEventListener('touchend', () => { if (APPUI && APPUI.actif) relacher(); }, true);
document.addEventListener('touchmove', (e) => { if (APPUI && APPUI.actif) e.preventDefault(); }, { passive: false });
let SURVOL = null;
function finSurvol() { if (SURVOL) { clearTimeout(SURVOL.timer); SURVOL.zone.classList.remove('survol'); SURVOL = null; } }
document.addEventListener('pointerover', (e) => {
  if (e.pointerType !== 'mouse') return;
  if (FICHE.racine.contains(e.target)) { clearTimeout(FICHE.tFerme); return; }
  const z = zoneH(e.target);
  if (!z) { if (SURVOL && SURVOL.zone.contains(e.target)) finSurvol(); return; }
  if (SURVOL && SURVOL.el === z.el && SURVOL.zone === z.zone) return;
  finSurvol();
  const cle = z.el.getAttribute('data-houblon');
  if (FICHE.cle === cle) { clearTimeout(FICHE.tFerme); SURVOL = { el: z.el, zone: z.zone }; return; }
  z.zone.classList.add('survol');
  SURVOL = { el: z.el, zone: z.zone, timer: setTimeout(() => { z.zone.classList.remove('survol'); if (FICHE.mode === 'feuille' && FICHE.cle != null) return; ouvrir(cle, { source: z.el, mode: 'bulle' }); }, SURVOL_MS) };
});
document.addEventListener('pointerout', (e) => {
  if (e.pointerType !== 'mouse') return;
  const vers = e.relatedTarget;
  if (SURVOL && SURVOL.zone.contains(e.target) && !(vers && SURVOL.zone.contains(vers))) finSurvol();
  if (FICHE.cle != null && FICHE.mode === 'bulle' && !FICHE.epingle) {
    const z = vers && zoneH(vers);
    if (!(vers && FICHE.racine.contains(vers)) && !(z && z.el.getAttribute('data-houblon') === FICHE.cle)) { clearTimeout(FICHE.tFerme); FICHE.tFerme = setTimeout(() => { if (!FICHE.epingle) fermer(); }, 650); }
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && FICHE.cle != null) { e.preventDefault(); fermer(); return; }
  if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) {
    const a = document.activeElement, z = a && (zoneH(a) || (a.querySelector && a.querySelector('[data-houblon]') && { el: a.querySelector('[data-houblon]') }));
    if (z && FD[z.el.getAttribute('data-houblon')]) { e.preventDefault(); ouvrir(z.el.getAttribute('data-houblon'), { source: z.el, mode: innerWidth >= 700 ? 'bulle' : 'feuille', epingle: true, clavier: true }); }
  }
});
addEventListener('resize', () => { if (FICHE.cle != null) construire(); });
if (/[?&]fiche=/.test(location.search)) { const k = decodeURIComponent(location.search.match(/[?&]fiche=([^&]+)/)[1]); ouvrir(k, { source: document.querySelector('[data-houblon="' + k + '"]'), mode: innerWidth >= 700 ? 'bulle' : 'feuille', epingle: true }); }
${extra}`;
}

/* La feuille et la bulle : la mise en page ; chaque langage pose ses couleurs par variables. */
export const CSS_FICHE = `
  #fiche-racine { position: relative; }
  .f-voile { position: fixed; inset: 0; background: var(--fi-voile); z-index: 40; }
  .f-fiche { position: fixed; z-index: 42; background: var(--fi-bg); color: var(--fi-tx); overflow-y: auto; overscroll-behavior: contain; -webkit-user-select: none; user-select: none; }
  .f-feuille { left: 0; right: 0; bottom: 0; max-height: 80vh; max-width: 390px; margin: 0 auto; padding: 0 16px 16px; border-radius: var(--fi-rad) var(--fi-rad) 0 0; }
  .f-bulle { width: 360px; max-height: calc(100vh - 16px); padding: 4px 16px 14px; border-radius: var(--fi-rad); }
  .f-poignee { width: 36px; height: 4px; border-radius: 2px; background: var(--fi-trait); margin: 8px auto 4px; }
  .f-corps { display: flex; flex-direction: column; gap: 10px; }
  .f-tete { display: flex; align-items: center; gap: 8px; min-height: 40px; }
  .f-nom { font-size: 20px; line-height: 1.1; }
  .f-stk { display: inline-flex; color: var(--fi-gris); }
  .f-fermer { margin-left: auto; width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center; color: var(--fi-tx); }
  .f-ab { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .f-alpha { display: inline-flex; align-items: baseline; gap: 5px; }
  .f-grec { font-size: 16px; color: var(--fi-gris); }
  .f-aa { font-size: 20px; font-variant-numeric: tabular-nums; }
  .f-lot { font-size: 13px; color: var(--fi-gris); }
  .f-reglette .rg-p { fill: var(--fi-trait); } .f-reglette .rg-b { fill: var(--fi-gris); opacity: .55; } .f-reglette .rg-a { fill: var(--fi-tx); } .f-reglette .rg-l { fill: var(--fi-tx); stroke: var(--fi-bg); stroke-width: 1; }
  .f-role { margin-left: auto; font-size: 13px; padding: 2px 8px; min-height: 24px; display: inline-flex; align-items: center; }
  .f-labels { display: flex; flex-direction: column; gap: 6px; }
  .f-bande { display: flex; align-items: center; gap: 2px; flex-wrap: wrap; }
  .f-bande .c { width: 18px; height: 18px; }
  .f-seule { font-size: 12px; color: var(--fi-gris); margin-left: 6px; }
  .f-lab { display: grid; grid-template-columns: 18px 1fr; column-gap: 8px; align-items: center; font-size: 14px; }
  .f-lab .c { width: 16px; height: 16px; grid-row: span 2; align-self: start; margin-top: 2px; }
  .f-lab-n { font-weight: 700; }
  .f-cpt { color: var(--fi-gris); font-size: 13px; }
  .f-lab-mots { grid-column: 2; font-size: 13px; color: var(--fi-tx2); }
  .f-lab-sans, .f-lab-nd { font-size: 13px; color: var(--fi-gris); }
  .c { display: inline-block; flex: none; }
  .f-arome { display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .r-anneau, .r-bord { fill: none; stroke: var(--r-anneau); stroke-width: 1; }
  .r-axe:not(.on) { stroke: var(--r-anneau); stroke-width: 1; } .r-axe.on { stroke-width: 2; }
  .r-hach { stroke: var(--r-anneau); stroke-width: 1.5; }
  .r-serie { fill: var(--r-plein); stroke: var(--r-encre); stroke-width: 2; stroke-linejoin: round; }
  .r-pt { fill: var(--fi-bg); stroke: var(--r-encre); stroke-width: 2; } .r-pt.plein { fill: var(--r-encre); }
  .r-lab { font-size: 12px; fill: var(--fi-tx); } .r-lab.inc { fill: var(--fi-gris); } .r-lab.dem { font-weight: 700; }
  .r-cpt { fill: var(--fi-gris); font-weight: 400; }
  .f-dem { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; font-size: 13px; }
  .f-dem-i { color: var(--fi-tx); }
  .f-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .f-gout { display: inline-flex; gap: 2px; padding: 2px; }
  .f-g { width: 32px; height: 28px; display: inline-flex; align-items: center; justify-content: center; color: var(--fi-gris); }
  .f-g[aria-pressed="true"] { color: var(--fi-tx); }
  .f-act { height: 32px; padding: 0 12px; display: inline-flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 700; }
  .f-replis { display: flex; gap: 6px; flex-wrap: wrap; }
  .f-repli { height: 28px; padding: 0 8px 0 10px; display: inline-flex; align-items: center; gap: 4px; font-size: 13px; color: var(--fi-tx); }
  .f-repli[aria-expanded="true"] .ic { transform: rotate(90deg); }
  .f-sec { display: flex; flex-direction: column; gap: 6px; font-size: 13px; }
  .f-rg { display: flex; justify-content: space-between; gap: 10px; } .f-rg-n { color: var(--fi-gris); } .f-rg-v { font-variant-numeric: tabular-nums; text-align: right; }
  .f-txt.gris { color: var(--fi-gris); }
  .f-tags { display: flex; flex-wrap: wrap; gap: 4px; } .f-tag { font-size: 12px; padding: 2px 8px; }
  .appui .hn, .appui.hn { animation: appui 500ms linear; }
  .f-source { position: relative; z-index: 41; }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } }`;

export const page = ({ titre, commentaire, css, corps, js, symb, lang = 'fr', entete = '' }) => `<!doctype html>
<html lang="${lang}" data-cas="c1">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titre}</title>
<!-- ${commentaire} -->${entete}
<style>${css}</style>
</head>
<body>
${symb}
<main class="ecran">${corps}
</main>
<script>${js}</script>
</body>
</html>
`;
/* La planche : l'écran en mini (en entier, la fiche ouverte, la lecture absolue), puis l'abécédaire du
   langage (surfaces, texte, une icône d'action, un picto de famille, une piste au style, un bouton) ;
   un mot sous chaque élément, aucun paragraphe. */
export const planche = ({ titre, css, symb, abc, entete = '', vues = [['etat-b.html', 1688, 'Suggestions'], ['etat-b.html?fiche=Motueka', 844, 'Fiche de Motueka'], ['etat-b.html?abs', 844, 'Absolu']] }) => `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titre}</title>${entete}
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  ${CSS_FAMILLES}
  .pl { max-width: 390px; margin: 0 auto; padding: 10px 12px 16px; display: flex; flex-direction: column; gap: 12px; }
  .minis { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; align-items: start; }
  .mini { width: 179px; overflow: hidden; position: relative; }
  .mini iframe { border: 0; width: 390px; transform: scale(.459); transform-origin: 0 0; display: block; pointer-events: none; }
  .col { display: flex; flex-direction: column; gap: 8px; }
  .abc { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px 8px; }
  .abc figure { display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .abc figcaption { font-size: 12px; }
  .ech { height: 44px; width: 100%; display: flex; align-items: center; justify-content: center; }
  ${css}
</style>
</head>
<body>
${symb}
<main class="pl">
  <div class="minis">
    ${(() => { const [a, ...b] = vues; const m = ([src, hgt, t]) => `<div class="mini" style="height:${Math.round(hgt * 0.459)}px"><iframe src="${src}" height="${hgt}" title="${t}" tabindex="-1"></iframe></div>`; return m(a) + `<div class="col">${b.map(m).join('')}</div>`; })()}
  </div>
  <section class="abc" aria-label="Abécédaire">${abc}</section>
</main>
</body>
</html>
`;
export const ecrire = (f, s) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, s); console.log('écrit ' + f.replace(REPO + '/', '') + ' (' + s.length + ' o)'); };
// Mots d'une fiche (comme controle-fiche : un mot porte une lettre ou un chiffre), pour tenir 100 mots.
export function motsFiche(F) {
  const m = [F.nom, 'α', '%', 'lot', ROLE(F)];
  const par = Object.fromEntries(F.aromes.map((a) => [a.f, a]));
  for (const a of F.aromes) m.push(COURT[a.f], a.of > 1 ? '1/2' : '', a.premier ? 'nommé en premier' : '', a.mots.slice(0, 3).join(' '), a.mots.length > 3 ? '+1' : '');
  if (F.sans.length) m.push('sans famille', F.sans.slice(0, 3).join(' '), F.sans.length > 3 ? '+1' : '');
  m.push('9 non décrites', ...ORDRE.map((f) => COURT[f] + (par[f] && par[f].of > 1 ? ' 1/2' : '')), 'Agrumes 1/2 Floral 1/2 Résineux inconnu', 'Ajouter à 10′ Comparer Styles Huiles Sources Substituts');
  return m.join(' ').split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}
const ROLE = (F) => (F.role ? (F.role.v === 'double' ? 'double usage' : F.role.v) : '');
