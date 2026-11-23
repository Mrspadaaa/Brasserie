// Lot 22 · r6d « Le même tropical » (mission 2026-10-22-reprise-lot21, voie r6d-meme-tropical).
// Question : « Lequel pour ma stout : Cascade, Idaho 7 ou Galaxy ? », vue à effet égal sur le
// tropical (référence Galaxy 4 g/L, dry hop après fermentation, 3 j, US-05). Seul facteur libre :
// la variété. Choix portés : radar r3 ; base effet égal (tropical) ; porte non ; descripteurs B.
// Seule source de données : ../donnees/comparer-stout.json (vérifié par r6e). La page ne fait que
// lire, mettre à l'échelle (g/L × 20 L), diviser (part de la cible atteinte, rapports de plages) et
// placer ; rien n'est extrapolé au-delà de 8 g/L (le bout de la grille) : la dose y est « inconnue ».
// Pictos et icônes : symboles de la baseline (fils18-baseline/l8g/noyau.mjs, pictos au trait).
// Usage : node work/refonte-frontend/v4/ecran-1/fils22-comparer/r6d/generer.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { symboles, ic, picto, JET, COURT, NOM } from '../../fils18-baseline/l8g/noyau.mjs';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const D = JSON.parse(fs.readFileSync(path.join(ICI, '../donnees/comparer-stout.json'), 'utf8'));

// ---------- outils ----------
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fr = (x, d = 1) => { const k = 10 ** d; return String(Math.round(x * k) / k).replace('.', ','); };
const pc = (x) => Math.round(x * 1000) / 10; // part → % (une décimale)
const plg = (a, b, u = '') => (a == null && b == null ? 'inconnu' : a == null ? '< ' + fr(b, 2) + u : b == null ? '> ' + fr(a, 2) + u : a === b ? fr(a, 2) + u : fr(a, 2) + '–' + fr(b, 2) + u);
const ACC = '#c2410c';
const AXES = ['citrus', 'tropical', 'melon', 'stoneFruit', 'pomeFruit', 'berries', 'floral', 'green', 'herbal', 'spice', 'earthy', 'resin']; // roue du pack, agrumes en haut

// ---------- les candidats ----------
// Couleurs des houblons : celles du lot 21 (v1, y3), une couleur par houblon (D51) ; forme en plus de la
// couleur (cercle, carré, triangle) pour ne jamais lire un repère à sa seule teinte.
const STYLE_H = {
  Galaxy: { c: '#681878', forme: 'rond' },
  Cascade: { c: '#781838', forme: 'carre' },
  'Idaho 7': { c: '#e80030', forme: 'triangle' },
};
const E = D.egalites.effetEgal.find((e) => e.famille === 'tropical');
const VOL = D.biere.recette.volumeL;
const grilleDe = (h, dose) => h.grille.find((c) => c.moment === E.moment && c.jours === E.jours && c.levure === E.levure && c.dose_gL === dose);
const HOPS = ['Galaxy', 'Cascade', 'Idaho 7'].map((nom) => {
  const h = D.houblons.find((x) => x.nom === nom);
  const doses = h.grille.filter((c) => c.moment === E.moment && c.jours === E.jours && c.levure === E.levure).map((c) => c.dose_gL);
  const doseMax = Math.max(...doses);
  const dose = E.doses[nom]; // null = hors grille : inconnue
  const cas = grilleDe(h, dose != null ? dose : doseMax);
  const atteint = cas.delta.tropical / E.cible; // part de la cible atteinte à cette dose
  const B = D.descripteurs.B.parts[nom];
  const al = h.alpha;
  const fiches = al.sources.length ? [Math.min(...al.sources.map((s) => s.min)), Math.max(...al.sources.map((s) => s.max))] : null;
  const lot = al.retenu && /stock|article/.test(al.retenu.from) ? al.retenu.value : null;
  return { nom, h, ...STYLE_H[nom], dose, doseMax, cas, atteint, B, fiches, lot, horsFiches: lot != null && fiches && (lot < fiches[0] || lot > fiches[1]),
    alphaDe: al.retenu.from, role: h.role.value, roleRegle: /^règle/.test(h.role.source), roleSrc: h.role.source };
});
const REF = HOPS.find((x) => x.nom === E.reference.nom);
const cascade = HOPS.find((x) => x.nom === 'Cascade');
const idaho = HOPS.find((x) => x.nom === 'Idaho 7');

// ---------- petites formes ----------
const forme = (x, z = 10, extra = '') => {
  const s = `<svg class="fo" width="${z}" height="${z}" viewBox="0 0 10 10" aria-hidden="true" ${extra}>`;
  if (x.forme === 'rond') return s + `<circle cx="5" cy="5" r="4.6" fill="${x.c}"/></svg>`;
  if (x.forme === 'carre') return s + `<rect x="0.8" y="0.8" width="8.4" height="8.4" fill="${x.c}"/></svg>`;
  return s + `<path d="M5 0.4 9.8 9.4H0.2Z" fill="${x.c}"/></svg>`;
};
const MOT_ROLE = { 'amérisant': 'amérisant', aromatique: 'aromatique', double: 'mixte' };
const usageEl = (x) => `<span class="us${x.roleRegle ? ' deduit' : ''}" data-role="usage" data-usage="${x.role}" aria-label="Usage : ${MOT_ROLE[x.role]}${x.roleRegle ? ', déduit de l’α par une règle à valider' : ', dit par le fournisseur'}">${MOT_ROLE[x.role]}</span>`;
const alphaEl = (x, long = false) => {
  const v = x.lot != null ? x.lot : null;
  const t = v != null ? fr(v) + '%' : x.fiches ? fr(x.fiches[0]) + '–' + fr(x.fiches[1]) + '%' : 'inconnu';
  const src = v != null ? 'lot' : 'fiches';
  const lab = 'Acides alpha' + (v != null ? ' du lot : ' + fr(v) + ' %' : '') + (x.fiches ? ' ; fiches ' + fr(x.fiches[0]) + '–' + fr(x.fiches[1]) + ' %' : '') + (x.horsFiches ? ' ; hors des plages des fiches' : '');
  return `<span class="al" data-role="alpha" data-source="${src}" aria-label="${esc(lab)}"><span class="al-a">α</span> <b class="num">${t}</b>${x.horsFiches ? ic('diff', 12) : ''}${long && x.fiches ? ` <span class="src">${ic('livre', 12)} ${fr(x.fiches[0])}–${fr(x.fiches[1])} %</span>` : ''}</span>`;
};
const stockEl = (x) => `<span class="stk" role="img" aria-label="${esc(x.alphaDe === 'fiche de stock' ? 'au stock : α lu sur la fiche de stock du lot' : 'au stock : α lu sur l’article ; quantité non lue ici')}">${ic('stock', 12)}</span>`;

// ---------- 1. les grammes pour le même tropical ----------
const PISTE_MAX = 8; // le bout de la grille, en g/L
function carte(x) {
  const connu = x.dose != null;
  const larg = (connu ? x.dose : x.doseMax) / PISTE_MAX * 100;
  const pctA = Math.round(x.atteint * 100);
  const droite = connu
    ? `<span class="dz"><b class="num">${fr(x.dose)} g/L</b><span class="src num">${fr(x.dose * VOL, 0)} g</span></span>`
    : `<span class="dz inc" aria-label="dose inconnue, au-delà de ${x.doseMax} g/L"><b class="num">&gt;${x.doseMax} g/L</b></span>`;
  const sous = connu
    ? `<span class="at" aria-label="référence : 100 % du tropical visé"><span class="at-p"><i style="width:100%;background:${JET.tropical.base}"></i></span></span>`
    : `<span class="at" data-nature="simule" aria-label="Simulé : à ${x.doseMax} g/L, ${pctA} % du tropical de ${REF.nom} ${fr(REF.dose)} g/L"><span class="at-p"><i style="width:${Math.min(100, pctA)}%;background:${JET.tropical.base}"></i></span><span class="num">~${pctA}%</span></span>`;
  return `<article class="carte" data-role="ligne-houblon" data-cle="${esc(x.nom)}" style="--h:${x.c}">
  <div class="c-l1">${forme(x)}<b class="nm" data-houblon="${esc(x.nom)}">${esc(x.nom)}</b>${alphaEl(x)}${usageEl(x)}${stockEl(x)}${droite}</div>
  <div class="c-l2"><div class="g-piste${connu ? '' : ' ouverte'}" role="img" aria-label="${esc(connu ? fr(x.dose) + ' g/L suffisent' : 'au-delà de ' + x.doseMax + ' g/L, dose inconnue ; à ' + x.doseMax + ' g/L, ~' + pctA + ' % du tropical visé')}"><i class="g-plein" style="width:${larg}%"></i>${connu ? '' : '<i class="g-hach"></i>'}</div>${sous}</div>
</article>`;
}
const echelleG = `<div class="g-ech" aria-hidden="true"><span style="left:0">0</span><span style="left:25%">2</span><span style="left:50%">4</span><span style="left:100%">8</span></div>`;

// ---------- 2. ce qui vient avec : une piste par famille (manière de w2, barres de l5b) ----------
const Z = D.style.zone, PF = D.echelle.parFamille, AV = D.biere.avant;
const RANGS = [
  ['tropical', 'cible'],
  ['citrus'], ['stoneFruit'], ['berries'],
  ['floral', 'voulu'], ['resin', 'trop'],
  ['green'], ['spice'], ['herbal'], ['earthy'], ['pomeFruit'], ['melon'],
];
const valeursMax = Math.max(100, ...HOPS.flatMap((x) => RANGS.map(([f]) => x.cas.apres[f][1])), AV.resin.centre);
const ABS_MAX = Math.ceil(valeursMax / 10) * 10;
const posS = (f, v) => v / PF[f].domaine[1] * 100;
const posA = (v) => v / ABS_MAX * 100;
const clip = (p) => Math.max(0, Math.min(100, p));
function rang([f, note]) {
  if (HOPS.every((x) => x.cas.apres[f][4] === 'inconnu' && x.cas.apres[f][2] === 0)) return `<div class="rg">${picto(f, 14)}<span class="rg-n">${COURT[f]}</span><span class="piste inc" role="img" aria-label="${esc(NOM[f] + ' : non décrit par les fiches, le moteur ne le situe pas ; inconnu, pas zéro')}"></span><span class="nt"></span></div>`;
  const bande = Z[f].bande, hors = (v) => v > bande[1];
  const zone = `<i class="zone" data-role="zone" style="--s:${clip(posS(f, bande[1]))}%;--a:${clip(posA(bande[1]))}%" aria-hidden="true"></i>`;
  const av = AV[f];
  const moi = `<i class="moi" style="--s:${clip(posS(f, av.centre))}%;--a:${clip(posA(av.centre))}%" aria-hidden="true"></i>`;
  const lanes = HOPS.map((x, k) => {
    const [bas, c, haut] = x.cas.apres[f];
    const d = x.cas.delta[f];
    const ps = posS(f, c), pa = posA(c);
    const deb = posS(f, c) > 100 || posA(c) > 100;
    const lab = `${x.nom} ${x.dose != null ? fr(x.dose) : x.doseMax} g/L : ~${fr(c)} (plage ${fr(bas)}–${fr(haut)}), effet ~${d >= 0 ? '+' : ''}${fr(d)}${hors(c) ? ', hors de la 16D' : ''}`;
    return `<span class="lane" data-serie="${esc(x.nom)}" data-h="${esc(x.nom)}" style="--k:${k};--h:${x.c}" aria-label="${esc(lab)}" role="img"><i class="int" style="--s0:${clip(posS(f, bas))}%;--s1:${clip(posS(f, haut))}%;--a0:${clip(posA(bas))}%;--a1:${clip(posA(haut))}%"></i><span class="mk${hors(c) ? ' hs' : ''}${deb ? ' deb' : ''}" style="--s:${clip(ps)}%;--a:${clip(pa)}%">${forme(x, 9)}</span></span>`;
  }).join('');
  const NOTE = {
    cible: `<span class="nt"></span>`,
    voulu: `<span class="nt" aria-label="Ta dégustation du 18.10 : tu la veux plus florale">↑voulu</span>`,
    trop: `<span class="nt al-t" aria-label="Ta dégustation du 18.10 : déjà trop résineuse, au-dessus de la 16D">trop</span>`,
  };
  return `<div class="rg${f === 'tropical' ? ' cible' : ''}">${picto(f, 14)}<span class="rg-n">${COURT[f]}</span><span class="piste">${zone}${moi}${lanes}</span>${note ? NOTE[note] : '<span class="nt"></span>'}</div>`;
}
const inconnues = ['pomeFruit', 'melon'].filter((f) => HOPS.every((x) => x.cas.apres[f][4] === 'inconnu' && x.cas.apres[f][2] === 0));

// ---------- 3. radars r3 : ce que disent les fiches, avec l'intervalle des fiches ----------
// Noyau plein : la famille que toutes ses fiches citent (deux fiches au moins) ; bande pâle jusqu'au
// niveau réuni des fiches (0 non décrit, 1 cité, 2 marqué). Une famille non décrite : secteur hachuré,
// inconnue, pas zéro (D65).
function radar(x, W = 156, objet = 'houblon', id = '') {
  const cx = W / 2, cy = W / 2, R = W / 2 - 22, n = AXES.length, pas = 2 * Math.PI / n;
  const P = (k, r) => [cx + Math.sin(k * pas) * r, cy - Math.cos(k * pas) * r];
  const ar = Object.fromEntries(x.h.aromes.map((a) => [a.family, a]));
  const niv = AXES.map((f) => (ar[f] && ar[f].sources > 0 ? ar[f].level : null));
  const noy = AXES.map((f) => (ar[f] && ar[f].of >= 2 && ar[f].sources === ar[f].of ? ar[f].level : 0));
  const rr = (v) => R * (v / 2);
  const pts = (vals) => vals.map((v, k) => P(k, rr(v || 0)).map((q) => q.toFixed(1)).join(',')).join(' ');
  let s = `<svg width="${W}" height="${W}" viewBox="0 0 ${W} ${W}" data-radar data-objet="${objet}" data-axes="${AXES.join(',')}" role="img" aria-label="${esc('Fiches de ' + x.nom + ' : ' + AXES.filter((f, k) => niv[k]).map((f, k2) => COURT[f].toLowerCase()).join(', ') + ' ; familles non décrites inconnues, pas à zéro')}">`;
  s += `<defs><pattern id="hc${id}" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="4" stroke="#cfc7bf" stroke-width="1"/></pattern></defs>`;
  AXES.forEach((f, k) => { if (niv[k] != null) return; const a = P(k - 0.5, R), b = P(k + 0.5, R); s += `<path d="M${cx},${cy}L${a.map((q) => q.toFixed(1)).join(',')}A${R},${R} 0 0 1 ${b.map((q) => q.toFixed(1)).join(',')}Z" fill="url(#hc${id})"/>`; });
  for (const v of [1, 2]) s += `<polygon points="${pts(AXES.map(() => v))}" fill="none" stroke="${v === 2 ? '#cfc7bf' : '#e4ded8'}" stroke-width="1"/>`;
  AXES.forEach((f, k) => { const e = P(k, R); s += `<line x1="${cx}" y1="${cy}" x2="${e[0].toFixed(1)}" y2="${e[1].toFixed(1)}" stroke="#e4ded8" stroke-width="1"/>`; });
  s += `<g data-serie="${esc(x.nom)}" data-valeurs="${niv.map((v) => v || 0).join(',')}" data-inconnues="${AXES.filter((f, k) => niv[k] == null).join(',')}" data-couleur="${x.c}">`;
  s += `<polygon points="${pts(niv)}" fill="${x.c}" fill-opacity="0.14" stroke="${x.c}" stroke-width="2" stroke-linejoin="round"/>`;
  if (noy.some((v) => v)) s += `<polygon points="${pts(noy)}" fill="${x.c}" fill-opacity="0.6" stroke="none"/>`;
  s += `</g>`;
  AXES.forEach((f, k) => { const q = P(k, R + 11); s += `<use href="#p-${f}" x="${(q[0] - 6.5).toFixed(1)}" y="${(q[1] - 6.5).toFixed(1)}" width="13" height="13"/>`; });
  return s + '</svg>';
}
// La part des mots de ses fiches, par famille, et la part « autres » de l'option B (seuil et plafond du pilote).
function compo(x, cls = '') {
  const par = {};
  for (const a of x.h.aromes) { const n = a.mots.reduce((t, m) => t + m.mots.length, 0); if (n) par[a.family] = n; }
  const tot = Object.values(par).reduce((a, b) => a + b, 0);
  const pA = x.B.visible ? x.B.partDessinee : 0;
  const segs = AXES.filter((f) => par[f]).map((f) => `<i data-famille="${f}" style="flex:${((1 - pA) * par[f] / tot).toFixed(3)};background:${JET[f].base}" aria-hidden="true"></i>`).join('');
  const autres = pA > 0 ? `<i class="autres" data-role="autres" data-houblon="${esc(x.nom)}" data-part="${fr(pA, 2)}" style="flex:${pA.toFixed(3)}" role="img" aria-label="${esc('autres, sans famille : ' + x.B.concepts.join(', ') + ' (' + Math.round(pA * 100) + ' %)')}"></i>` : '';
  const mots = pA > 0 ? `<span class="cp-m"><i class="cp-k" aria-hidden="true"></i>autres ${Math.round(pA * 100)} % : ${esc(x.B.concepts.join(', '))}</span>` : `<span class="cp-m src">tous ses mots ont une famille</span>`;
  return `<div class="cp ${cls}"><div class="cp-b" role="img" aria-label="${esc('Les mots de ses fiches, par famille')}">${segs}${autres}</div>${mots}</div>`;
}
const nbFiches = (x) => (x.h.aromes[0] || {}).of || 0;
const sourcesFiches = (x) => [...new Set(x.h.aromes.flatMap((a) => a.authors || []))];

// Ce que la 16D attend (BJCP) face à ce que citent les fiches : la case libre de la grille r3.
function attend() {
  const fam = Object.keys(Z).filter((f) => Z[f].statut === 'attendue');
  const lignes = fam.map((f) => `<div class="at-l">${picto(f, 14)}<span>${COURT[f]}</span>${HOPS.map((x) => { const a = x.h.aromes.find((y) => y.family === f); const n = a && a.sources > 0; return `<span class="at-m" data-h="${esc(x.nom)}" role="img" aria-label="${esc(x.nom + (n ? ' : cité par ' + a.sources + ' fiche' + (a.sources > 1 ? 's' : '') + ' sur ' + a.of : ' : non décrit, inconnu'))}">${n ? forme(x) : '<i class="q">?</i>'}</span>`; }).join('')}</div>`).join('');
  return `<div class="attend"><b class="at-h">Ta 16D attend</b>${lignes}<p class="src">« ${esc(Z[fam[0]].citations[0].quote)} » BJCP 2021 ; ? : non décrit, inconnu.</p></div>`;
}

// ---------- 4. chimie rattachée aux familles : ce qui fait le tropical ----------
const LIENS = { '4MMP': ['tropical', 'berries'], '3MH': ['citrus', 'tropical'], '3M4MP': ['citrus'], linalol: ['floral', 'citrus'], myrcene: ['green', 'resin'] };
const NOMC = { '4MMP': '4MMP', '3MH': '3MH', '3M4MP': '3M4MP', linalol: 'Linalol', myrcene: 'Myrcène', huile: 'Huile totale' };
const UNIT = { '4MMP': 'µg/kg', '3MH': 'µg/kg', '3M4MP': 'µg/kg', linalol: '% de l’huile', myrcene: '% de l’huile', huile: 'mL/100 g' };
const SRC = {
  H11: 'H11 · Schmidt 2024', H26: 'Hop Products Australia', H2: 'Yakima Chief Hops', H3: 'Yakima Chief Hops', H27: 'Haas 2020', H7k: 'H7k', H9: 'H9', H10: 'H10', H21: 'H21 · Sharp 2018', 'hs-cas': 'Hopsteiner 2025',
  'bm-galaxy': 'Beer Maverick 2023', 'bm-cascade': 'Beer Maverick 2023', 'bm-idaho-7': 'Beer Maverick 2023', 'H3-71': 'Yakima Chief Hops',
};
const srcTxt = (ks) => [...new Set(ks.map((k) => SRC[k] || k))].join(', ');
// Valeur d'un composé : la plage « variété » d'origine retenue (thiols : base hopsteiner-2024, États-Unis
// pour Cascade) ; sinon l'enveloppe des plages publiées (convention du dépôt).
function valeur(x, k) {
  const C = x.h.composes;
  const bloc = k === 'huile' ? C.huile : C.composes[k];
  if (!bloc || !bloc.valeurs) {
    const somme = (C.sommes || []).find((s) => s.composes.includes(k));
    if (somme) return { txt: '?', note: 'avec ' + somme.composes.filter((c) => c !== k).join(', ') + ' : ' + plg(somme.plage[0], somme.plage[1]), src: srcTxt(somme.sources), inconnu: true };
    const nd = bloc && bloc.nonDetecte ? bloc.nonDetecte[0] : null;
    return { txt: '?', note: nd ? 'non détecté' : 'non publié', src: nd ? srcTxt(nd.sources) : '', inconnu: true };
  }
  const vs = bloc.valeurs.filter((v) => v.portee === 'variété');
  const thiol = ['4MMP', '3MH', '3M4MP'].includes(k);
  const ret = thiol ? vs.filter((v) => v.base === 'hopsteiner-2024') : vs;
  const lo = ret.some((v) => v.plage[0] == null) ? null : Math.min(...ret.map((v) => v.plage[0]));
  const hi = ret.some((v) => v.plage[1] == null) ? null : Math.max(...ret.map((v) => v.plage[1]));
  return { txt: plg(lo, hi), lo, hi, src: srcTxt(ret.flatMap((v) => v.sources)), conf: ret.some((v) => v.aConfirmer), n: ret.length };
}
const CHIM = ['4MMP', '3MH', '3M4MP', 'linalol', 'myrcene', 'huile'];
function ligneChimie(k) {
  const pics = (LIENS[k] || []).map((f) => picto(f, 14)).join('');
  const cells = HOPS.map((x) => {
    const v = valeur(x, k);
    return `<span class="ch-v" data-h="${esc(x.nom)}" style="--h:${x.c}">${v.inconnu ? `<b class="num inc" aria-label="${esc(v.note)}">?</b><small>${esc(v.note)}</small>` : `<b class="num" data-nature="mesure" data-source="${esc(v.src)}">${esc(v.txt)}${v.conf ? ' ?' : ''}</b>${v.conf ? '<small>à confirmer</small>' : ''}`}</span>`;
  }).join('');
  const thiol = ['4MMP', '3MH', '3M4MP'].includes(k);
  return `<div class="ch" data-compose="${k}"><span class="ch-t">${pics}<span>${NOMC[k]}</span><small>${UNIT[k]}</small></span>${cells}</div>`;
}
// Le rapport, à la manière de v1 : Galaxy contre Cascade en 4MMP, sur les plages publiées.
const g4 = valeur(REF, '4MMP'), c4 = valeur(HOPS.find((x) => x.nom === 'Cascade'), '4MMP');
const rapport4 = g4.lo != null && c4.hi != null ? g4.lo / c4.hi : null;

// ---------- 5. panel OSU (mesuré, Cascade) ----------
const OSU = D.panelOSU;
function osuSvg() {
  const W = 200, H = 92, x0 = 8, x1 = 150, y0 = 80, y1 = 6, dmax = 16, vmax = 15;
  const X = (d) => x0 + d / dmax * (x1 - x0), Y = (v) => y0 - v / vmax * (y0 - y1);
  const serie = (vals, c, plein) => `<polyline points="${OSU.doses.map((d, i) => X(d).toFixed(1) + ',' + Y(vals[i]).toFixed(1)).join(' ')}" fill="none" stroke="${c}" stroke-width="1.6"/>` + OSU.doses.map((d, i) => `<circle cx="${X(d).toFixed(1)}" cy="${Y(vals[i]).toFixed(1)}" r="2.6" fill="${plein ? c : '#fff'}" stroke="${c}" stroke-width="1.5"/>`).join('');
  const zone = `<rect x="${X(OSU.zone[0]).toFixed(1)}" y="${y1}" width="${(X(OSU.zone[1]) - X(OSU.zone[0])).toFixed(1)}" height="${y0 - y1}" fill="#f1ece6"/>`;
  const huit = `<line x1="${X(8).toFixed(1)}" y1="${y1}" x2="${X(8).toFixed(1)}" y2="${y0}" stroke="${ACC}" stroke-width="1.5"/>`;
  const ax = `<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y0}" stroke="#bdb4ab" stroke-width="1"/>` + [0, 4, 8, 16].map((d) => `<text x="${X(d).toFixed(1)}" y="${y0 + 11}" font-size="12" text-anchor="middle" fill="#574a42">${d}</text>`).join('');
  const lab = (v, c, t) => `<text x="${x1 + 5}" y="${(Y(v) + 4).toFixed(1)}" font-size="12" fill="${c}">${t}</text>`;
  return `<svg class="osu" width="${W}" height="${H + 4}" viewBox="0 0 ${W} ${H + 4}" role="img" aria-label="${esc('Panel OSU, Cascade, notes sur 15 : agrumes ' + OSU.agrumes.map((v) => fr(v)).join(', ') + ' ; herbacé et thé ' + OSU.herbaceThe.map((v) => fr(v)).join(', ') + ' ; doses ' + OSU.doses.map((d) => fr(d, 2)).join(', ') + ' g/L')}">${zone}${ax}${huit}${serie(OSU.agrumes, JET.citrus.texte, true)}${serie(OSU.herbaceThe, JET.herbal.texte, false)}${lab(OSU.agrumes[4], JET.citrus.texte, 'agrumes')}${lab(OSU.herbaceThe[4] + 1, JET.herbal.texte, 'herbacé')}</svg>`;
}

// ---------- 6. vraies valeurs, par source (v1, moins austère) ----------
function lotsDe(x) { return (x.h.composes.lots || []).filter((l) => l.huile != null); }
const HU_MAX = 5;
function valeursPanneau() {
  const lignes = [];
  for (const x of HOPS) {
    const C = x.h.composes;
    const hu = C.huile.valeurs.map((v) => `<li><b class="num" data-nature="mesure" data-source="${esc(srcTxt(v.sources))}">${plg(v.plage[0], v.plage[1])} mL/100 g</b> <span class="src">${esc(srcTxt(v.sources))}${v.texte ? ' · ' + esc(v.texte) : ''}</span></li>`).join('');
    const lots = lotsDe(x);
    const lt = lots.length ? `<li><b class="num" data-nature="mesure" data-source="${esc('certificats de lot : ' + lots.map((l) => l.id).join(', '))}">${plg(Math.min(...lots.map((l) => l.huile)), Math.max(...lots.map((l) => l.huile)))} mL/100 g</b> <span class="src">${lots.length} certificat${lots.length > 1 ? 's' : ''} de lot (COA ${lots.map((l) => l.recolte).filter(Boolean).join(', ')})</span></li>` : `<li><span class="src">aucun certificat de lot au dépôt : inconnu, pas 0</span></li>`;
    // Barres-plages (base v4.6) : une ligne fine par source, un point par certificat de lot, échelle commune 0–5.
    const W = 330, X = (v) => 4 + v / HU_MAX * (W - 8), rangs = C.huile.valeurs.length;
    let g = `<svg class="vv-s" width="${W}" height="${rangs * 5 + 12}" viewBox="0 0 ${W} ${rangs * 5 + 12}" role="img" aria-label="${esc('Huile totale de ' + x.nom + ' : une ligne par source, un point par lot')}">`;
    for (let v = 0; v <= HU_MAX; v++) g += `<line x1="${X(v)}" y1="0" x2="${X(v)}" y2="${rangs * 5 + 12}" stroke="#efe9e3" stroke-width="1"/>`;
    C.huile.valeurs.forEach((v, i) => { g += `<line x1="${X(v.plage[0]).toFixed(1)}" y1="${3 + i * 5}" x2="${X(v.plage[1]).toFixed(1)}" y2="${3 + i * 5}" stroke="${x.c}" stroke-opacity="0.55" stroke-width="3" stroke-linecap="round"/>`; });
    for (const l of lots) g += `<circle cx="${X(l.huile).toFixed(1)}" cy="${rangs * 5 + 6}" r="3.2" fill="${x.c}"/>`;
    g += '</svg>';
    lignes.push(`<div class="vv" data-h="${esc(x.nom)}" style="--h:${x.c}"><div class="vv-t">${forme(x)}<b>${esc(x.nom)}</b><span class="src">huile totale</span></div>${g}<ul>${hu}${lt}</ul></div>`);
  }
  return lignes.join('');
}

// ---------- page ----------
const SYMB = symboles({ trait: 1.5, tailles: [12, 16] });
const motsFiche = (x) => x.h.aromes.filter((a) => a.sources > 0);
function ficheHtml(x) {
  const ar = motsFiche(x);
  const of = nbFiches(x);
  const lignes = ar.map((a) => {
    const mots = [...new Set(a.mots.flatMap((m) => m.mots.map((w) => w.toLowerCase())))];
    const cpt = of > 1 ? a.sources + '/' + of : '1 fiche';
    return `<div class="f-lab">${picto(a.family, 14)}<b>${COURT[a.family]}</b><span class="src num">${cpt}</span><span class="f-mots">${esc(mots.slice(0, 3).join(', '))}</span></div>`;
  }).join('');
  const nd = AXES.filter((f) => !ar.some((a) => a.family === f)).length;
  return `<template id="fiche-${esc(x.nom.replace(/\s/g, '-'))}"><div class="f-tete">${forme(x, 12)}<b class="f-nom">${esc(x.nom)}</b><button type="button" class="f-x" data-role="fermer-fiche" aria-label="Fermer la fiche">${ic('x', 16)}</button></div>
<div class="f-ab"><span data-role="fiche-alpha">${alphaEl(x, true)}</span>${usageEl(x)}${stockEl(x)}</div>
<div class="f-ar" data-role="fiche-arome"><div class="f-rad">${radar(x, 132, 'fiche', 'f' + x.nom.replace(/\s/g, ''))}</div><div class="f-lst">${lignes}<p class="src">${of === 1 ? '1 seule fiche : ' + esc(sourcesFiches(x).join(', ')) : of + ' fiches : ' + esc(sourcesFiches(x).join(', '))} · ${nd} non décrites</p></div></div>
${compo(x, 'f-cp')}
<p class="src f-b">Option B : seuil ${pc(D.descripteurs.B.seuil)} %, plafond ${pc(D.descripteurs.B.plafond)} %, mots génériques écartés : à corriger par le brasseur.</p>
<div class="f-gout"><button type="button" data-role="gout" aria-pressed="false">${ic('coeur', 16)}<span>J’aime</span></button><button type="button" data-role="gout" aria-pressed="false">${ic('ban', 16)}<span>J’exclus</span></button></div></template>`;
}

const CSS = `
:root { --encre:#1a1613; --gris:#574a42; --pale:#8a7d73; --trait:#e4ded8; --mur:#f5f0ea; --acc:${ACC}; --sans:"Source Sans 3", system-ui, -apple-system, "Segoe UI", sans-serif; --mono:"IBM Plex Mono", ui-monospace, Consolas, monospace; }
[hidden] { display:none !important; }
* { box-sizing:border-box; margin:0; padding:0; }
html, body { background:var(--mur); }
body { color:var(--encre); font:400 14px/1.3 var(--sans); -webkit-tap-highlight-color:transparent; }
button { font:inherit; color:inherit; background:none; border:0; cursor:pointer; }
svg { display:block; flex:none; }
.ic { color:currentColor; }
.num { font-family:var(--mono); font-variant-numeric:tabular-nums; font-weight:600; }
.src { font-size:12px; color:var(--gris); font-weight:400; }
.ecran { max-width:390px; margin:0 auto; padding:2px 10px 32px; display:flex; flex-direction:column; gap:8px; }
.barre { display:flex; align-items:flex-start; gap:6px; padding-top:6px; }
.retour { width:28px; height:28px; display:inline-flex; align-items:center; justify-content:center; flex:none; color:var(--encre); }
h1 { font:600 17px/1.2 var(--sans); flex:1; }
.lgb { width:28px; height:28px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; color:var(--gris); flex:none; font:600 14px var(--sans); border:1px solid #cfc7bf; }
.outils { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
.lentille { display:inline-flex; background:#e9e2da; border-radius:999px; padding:2px; }
.lentille button { height:24px; padding:0 9px; border-radius:999px; font-size:12px; color:var(--gris); }
.lentille button[aria-checked="true"] { background:var(--encre); color:#fff; font-weight:600; }
.ctx { display:flex; flex-wrap:wrap; gap:4px; align-items:center; font-size:12px; color:var(--gris); }
.ctx [data-contexte] { display:inline-flex; align-items:center; gap:3px; height:22px; padding:0 7px; border-radius:999px; background:#fff; color:var(--encre); border:1px solid var(--trait); }
.ctx [data-contexte="base"] { border-color:${JET.tropical.base}; color:${JET.tropical.texte}; font-weight:600; }
.libre { display:flex; gap:6px; }
.libre button { height:30px; padding:0 11px; border-radius:999px; background:#fff; border:1px solid #cfc7bf; font-weight:600; display:inline-flex; align-items:center; gap:6px; }
.libre button[aria-pressed="false"] { color:var(--pale); text-decoration:line-through; background:transparent; }
.libre button[aria-pressed="false"] .fo { opacity:.35; }
.bloc { background:#fff; border-radius:8px; padding:9px 10px; display:flex; flex-direction:column; gap:7px; }
.bloc > h2 .lentille { margin-left:auto; }
.bloc > h2, .h2 { font:600 14px/1.2 var(--sans); display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
.sim { font:600 12px var(--sans); color:var(--gris); border:1px solid #cfc7bf; border-radius:999px; padding:0 6px; height:18px; display:inline-flex; align-items:center; }
.carte { padding:5px 0 6px; border-top:1px solid var(--trait); touch-action:manipulation; user-select:none; -webkit-user-select:none; -webkit-touch-callout:none; }
.carte:first-of-type { border-top:0; }
.c-l1 { display:flex; align-items:center; gap:6px; min-height:22px; }
.c-l1 .nm { font-weight:600; font-size:14px; }
.al { display:inline-flex; align-items:center; gap:2px; font-size:12px; color:var(--gris); white-space:nowrap; }
.al b { color:var(--encre); font-size:12px; }
.al-a { font-weight:600; }
.us { font-size:12px; color:var(--gris); }
.us.deduit { text-decoration:underline dotted; text-underline-offset:2px; }
.stk { color:var(--gris); display:inline-flex; }
.dz { margin-left:auto; display:flex; flex-direction:column; align-items:flex-end; line-height:1.1; }
.dz b { font-size:14px; }
.dz.inc b { color:var(--gris); }
.c-l2 { display:flex; align-items:center; gap:8px; margin-top:4px; }
.g-piste { position:relative; flex:1; height:10px; background:#f1ece6; border-radius:2px; overflow:hidden; }
.g-plein { position:absolute; left:0; top:0; bottom:0; background:var(--h); border-radius:2px; }
.g-piste.ouverte .g-plein { opacity:.55; }
.g-hach { position:absolute; left:100%; top:0; bottom:0; }
.g-piste { margin-right:26px; overflow:visible; }
.g-piste.ouverte .g-hach { width:26px; background:repeating-linear-gradient(135deg, #bdb4ab 0 1.5px, transparent 1.5px 5px); border-radius:0 2px 2px 0; }
.at { display:inline-flex; align-items:center; gap:4px; font-size:12px; color:${JET.tropical.texte}; min-width:84px; }
.at-p { width:40px; height:6px; background:#f1ece6; border-radius:2px; overflow:hidden; display:inline-block; }
.at-p i { display:block; height:100%; }
.c-l2 > .src { min-width:84px; }
.g-ech { position:relative; height:13px; margin:0 118px 0 18px; font-size:12px; color:var(--gris); }
.g-ech span { position:absolute; transform:translateX(-50%); top:-1px; line-height:1; }
.rgs { display:flex; flex-direction:column; }
.rg { display:grid; grid-template-columns:16px 58px 1fr 54px; align-items:center; gap:4px; min-height:25px; border-top:1px solid #f1ece6; }
.rg:first-child { border-top:0; }
.rg.cible { border-bottom:1px solid var(--trait); padding-bottom:3px; margin-bottom:2px; }
.rg.cible .rg-n { font-weight:600; color:${JET.tropical.texte}; }
.rg-n { font-size:12px; }
.piste { position:relative; height:21px; background:#f7f3ef; border-radius:2px; }
.piste.inc { background:repeating-linear-gradient(135deg, #cfc7bf 0 1.5px, transparent 1.5px 6px); }
.zone { position:absolute; left:0; top:0; bottom:0; width:var(--s); background:#ece4da; border-right:1px solid #bdb4ab; border-radius:2px 0 0 2px; }
.moi { position:absolute; top:1px; bottom:1px; left:var(--s); width:2px; margin-left:-1px; background:var(--encre); }
.lane { position:absolute; left:0; right:0; top:calc(2px + var(--k) * 6px); height:5px; }
.int { position:absolute; top:2px; height:1.5px; left:var(--s0); width:calc(var(--s1) - var(--s0)); background:var(--h); opacity:.35; }
.mk { position:absolute; top:-2px; left:var(--s); margin-left:-4.5px; }
.mk.hs .fo { outline:1.5px solid ${ACC}; outline-offset:1px; border-radius:2px; }
.mk.deb::after { content:"›"; position:absolute; left:9px; top:-5px; font:600 12px var(--sans); color:${ACC}; }
body.abs .zone { width:var(--a); }
body.abs .moi { left:var(--a); }
body.abs .int { left:var(--a0); width:calc(var(--a1) - var(--a0)); }
body.abs .mk { left:var(--a); }
.nt { font-size:12px; color:var(--gris); text-align:right; }
.al-t { color:${ACC}; font-weight:600; }
.inc-l { display:flex; align-items:center; gap:6px; font-size:12px; color:var(--gris); padding-top:4px; }
.hach { display:inline-block; width:18px; height:8px; background:repeating-linear-gradient(135deg, #bdb4ab 0 1.5px, transparent 1.5px 5px); border-radius:2px; }
.attend { display:flex; flex-direction:column; gap:5px; padding:4px 2px; align-self:center; }
.at-h { font-size:14px; }
.at-l { display:grid; grid-template-columns:16px 1fr 18px 18px 18px; align-items:center; gap:4px; font-size:12px; }
.at-m { display:inline-flex; justify-content:center; }
.at-m .q { font:600 12px var(--sans); font-style:normal; color:var(--gris); }
.multi { display:grid; grid-template-columns:1fr 1fr; gap:8px 6px; }
.un-radar { display:flex; flex-direction:column; align-items:center; gap:3px; user-select:none; -webkit-user-select:none; -webkit-touch-callout:none; }
.un-radar .cap { display:flex; align-items:center; gap:5px; font-size:12px; flex-wrap:wrap; justify-content:center; }
.cp { width:100%; display:flex; flex-direction:column; gap:2px; }
.cp-b { display:flex; height:8px; gap:1px; border-radius:2px; overflow:hidden; }
.cp-b i { display:block; height:100%; }
.cp-b .autres { background:#9a9590; }
.cp-m { font-size:12px; display:flex; align-items:center; gap:4px; }
.cp-k { width:10px; height:8px; background:#9a9590; border-radius:2px; display:inline-block; }
.ch { display:grid; grid-template-columns:1fr 70px 70px 70px; gap:4px; align-items:start; padding:4px 0; border-top:1px solid #f1ece6; }
.ch-t { display:flex; align-items:center; gap:3px; flex-wrap:wrap; font-size:12px; font-weight:600; }
.ch-t small { width:100%; font-weight:400; color:var(--gris); font-size:12px; }
.ch-v { display:flex; flex-direction:column; font-size:12px; border-top:3px solid var(--h); padding-top:2px; }
.ch-v b { font-size:12px; }
.ch-v b.inc { color:var(--gris); }
.ch-v small { color:var(--gris); font-size:12px; line-height:1.15; }
.ch-h { display:grid; grid-template-columns:1fr 70px 70px 70px; gap:4px; font-size:12px; font-weight:600; }
.ch-h span { display:flex; align-items:center; gap:4px; }
.phr { font-size:12px; color:var(--encre); display:flex; gap:6px; align-items:flex-start; }
.osu-l { display:flex; gap:8px; align-items:flex-start; }
.osu-l .src { flex:1; }
.ouvre { display:flex; align-items:center; justify-content:space-between; width:100%; min-height:38px; padding:0 12px; border-radius:8px; background:#fff; font:600 14px var(--sans); text-align:left; }
.ouvre::after { content:"+"; font:600 16px var(--mono); color:var(--gris); }
.ouvre[aria-expanded="true"]::after { content:"–"; }
.vv { border-top:3px solid var(--h); padding-top:4px; }
.vv-s { margin:3px 0 0 16px; max-width:calc(100% - 16px); }
.vv-ax { position:relative; height:14px; margin-left:16px; font-size:12px; color:var(--gris); }
.vv-ax span { position:absolute; transform:translateX(-50%); }
.vv-ax .u { right:0; transform:none; left:auto; top:-15px; }
.vv-t { display:flex; align-items:center; gap:6px; font-size:14px; }
.vv ul { list-style:none; display:flex; flex-direction:column; gap:2px; padding:3px 0 2px 16px; font-size:12px; }
nav a { display:flex; align-items:center; justify-content:space-between; gap:8px; min-height:38px; padding:0 12px; border-radius:8px; background:var(--encre); color:#fff; font:600 14px var(--sans); text-decoration:none; }
.legende { background:#fff; border-radius:8px; padding:9px 10px; font-size:12px; display:flex; flex-direction:column; gap:4px; border:1px solid var(--trait); }
.legende p { display:flex; align-items:center; gap:6px; }
#fiche { position:fixed; left:0; right:0; bottom:0; max-height:62vh; overflow:auto; background:#fff; border-radius:8px 8px 0 0; border-top:1px solid #cfc7bf; padding:8px 12px 14px; z-index:20; display:flex; flex-direction:column; gap:6px; }
@media (min-width:700px) { #fiche { left:auto; right:24px; bottom:auto; top:80px; width:360px; border-radius:8px; border:1px solid #cfc7bf; } }
.f-tete { display:flex; align-items:center; gap:6px; }
.f-nom { font-size:17px; font-weight:600; flex:1; }
.f-x { width:28px; height:28px; display:inline-flex; align-items:center; justify-content:center; color:var(--gris); }
.f-ab { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.f-ar { display:flex; gap:8px; align-items:flex-start; }
.f-lst { display:flex; flex-direction:column; gap:2px; flex:1; min-width:0; }
.f-lab { display:flex; align-items:center; gap:4px; font-size:12px; flex-wrap:wrap; }
.f-mots { color:var(--gris); width:100%; padding-left:18px; }
.f-gout { display:flex; gap:6px; }
.f-gout button { display:inline-flex; align-items:center; gap:4px; height:28px; padding:0 10px; border-radius:999px; border:1px solid #cfc7bf; font-size:12px; }
.f-gout button[aria-pressed="true"] { background:var(--encre); color:#fff; }
`;

const ctx = `<p class="ctx" data-role="contexte"><span data-contexte="base">${picto('tropical', 12)}tropical = ${esc(REF.nom)} ${fr(REF.dose)} g/L</span><span data-contexte="moment">après fermentation, ${E.jours} j</span><span data-contexte="levure">US-05</span><span data-contexte="biere">16D</span></p>`;
const chips = `<div class="libre" role="group" aria-label="Houblons à comparer" data-libre="houblon">${HOPS.map((x) => `<button type="button" aria-pressed="true" data-cmp="${esc(x.nom)}">${forme(x)}${esc(x.nom)}</button>`).join('')}</div>`;

const legende = `<div class="legende" data-role="legende" id="legende" hidden>
<p>${HOPS.map((x) => forme(x) + esc(x.nom)).join(' ')} : un repère par houblon, une forme et une couleur.</p>
<p><span class="sim">~</span> simulé par le moteur (profil simulé, ${esc(D.date)}) : une lecture, pas une mesure. Trait fin : sa plage possible.</p>
<p><i class="hach"></i> hachuré : inconnu, jamais zéro ; au-delà de ${PISTE_MAX} g/L, la grille s’arrête.</p>
<p><i style="display:inline-block;width:18px;height:8px;background:#ece4da;border-right:1px solid #bdb4ab"></i> la zone de ta 16D ; <i style="display:inline-block;width:2px;height:10px;background:#1a1613"></i> ta bière ; contour orangé : hors de la 16D.</p>
<p>Radars : ce que disent les fiches (0, cité, marqué). Plein : toutes ses fiches d’accord ; pâle : au moins une fiche.</p>
<p>Part « autres » (option B) : mots sans famille, génériques écartés (${esc(D.descripteurs.B.generiques.join(', '))}) ; seuil ${pc(D.descripteurs.B.seuil)} %, plafond ${pc(D.descripteurs.B.plafond)} % : proposés par le pilote, à corriger par le brasseur.</p>
<p>Dans « Ce qui vient avec », ${esc(cascade.nom)} et ${esc(idaho.nom)} sont à ${cascade.doseMax} g/L, le plus haut connu de la grille. Bière noire : masquage non mesuré, pars de ta dégustation.</p>
<p>Ta dégustation du ${esc(D.biere.degustation.date.split('-').reverse().slice(0, 2).join('.'))} : « ${esc(D.biere.degustation.citation)} ».</p>
</div>`;

const body = `<main class="ecran">
<header class="barre"><button class="retour" type="button" aria-label="Retour">${ic('chev-l', 16)}</button><h1>Lequel pour ma stout : Cascade, Idaho 7 ou Galaxy ?</h1><button type="button" class="lgb" data-role="legende-bouton" aria-expanded="false" aria-controls="legende" aria-label="Légende">?</button></header>
${legende}
${ctx}
${chips}

<section class="bloc" aria-label="Grammes pour le même tropical" data-nature="simule">
<h2>${picto('tropical', 14)}Combien pour ce tropical ? <span class="sim">~simulé</span></h2>
${HOPS.map(carte).join('\n')}
</section>

<section class="bloc" aria-label="Ce qui vient avec, dans ta 16D" data-nature="simule">
<h2>Ce qui vient avec <span class="sim">~simulé</span><span class="lentille" role="radiogroup" aria-label="Lecture de l’échelle" data-lecture><button type="button" role="radio" data-e="style" aria-checked="true">au style</button><button type="button" role="radio" data-e="absolu" aria-checked="false">absolu</button></span></h2>
<div class="rgs">${RANGS.map(rang).join('')}</div>
</section>

<section class="bloc" data-acquis="radar" aria-label="Ce que disent leurs fiches, un radar par houblon">
<h2>Leurs fiches</h2>
<div class="multi">${HOPS.map((x) => `<div class="un-radar" data-role="ligne-houblon" data-cle="${esc(x.nom)}">${radar(x, 156, 'houblon', 'r' + x.nom.replace(/\s/g, ''))}<span class="cap">${forme(x)}<b data-houblon="${esc(x.nom)}">${esc(x.nom)}</b>${alphaEl(x)}<span class="src">${nbFiches(x) === 1 ? '1 seule fiche' : nbFiches(x) + ' fiches'}</span></span>${compo(x)}</div>`).join('')}${attend()}</div>
</section>

<section class="bloc" data-acquis="chimie" aria-label="Ce qui fait le tropical">
<h2>Ce qui fait le tropical</h2>
<div class="ch-h"><span></span>${HOPS.map((x) => `<span data-h="${esc(x.nom)}">${forme(x)}${esc(x.nom)}</span>`).join('')}</div>
${CHIM.map(ligneChimie).join('')}
<p class="src">Thiols : H11 · Schmidt 2024, une méthode (Cascade des États-Unis). Le reste : plages des fiches.</p>
${rapport4 ? `<p class="phr">${picto('tropical', 14)}<span><b>${esc(REF.nom)} : au moins ×${fr(rapport4)} le 4MMP de ${esc(cascade.nom)}.</b> ${esc(idaho.nom)}, classé « thiols forts » (H11), reste loin dans le moteur : à goûter.</span></p>` : ''}
</section>

<section class="bloc" data-acquis="osu" data-nature="mesure" data-source="H22 · Lafontaine 2018" aria-label="Panel OSU, Cascade">
<h2>Plus de 8 g/L de Cascade ? <span class="src">panel OSU, mesuré</span></h2>
<div class="osu-l">${osuSvg()}<p class="src">Agrumes <b class="num" data-nature="mesure" data-source="H22 · Lafontaine 2018">${fr(OSU.agrumes[3])} → ${fr(OSU.agrumes[4])}/15</b> de 8 à 16 g/L : plafond. L’herbacé monte encore (H22 · Lafontaine 2018).</p></div>
<p class="src">${esc(REF.nom)} à 4 g/L, panel OSU : près de « catty/sweaty » (H21 · Sharp 2018), le « dank » de sa part « autres ».</p>
</section>

<button type="button" class="ouvre" aria-controls="p-valeurs" aria-expanded="false" data-ouvre-acquis="valeurs">Vraies valeurs, par source</button>
<section id="p-valeurs" class="bloc" data-acquis="valeurs" hidden aria-label="Vraies valeurs">
<h2>Huile totale, par source et par lot</h2>
<div class="vv-ax" aria-hidden="true">${[0, 1, 2, 3, 4, 5].map((v) => `<span style="left:${(4 + v / 5 * 322) / 330 * 100}%">${v}</span>`).join('')}<span class="u">mL/100 g</span></div>
${valeursPanneau()}
<p class="src">Plages publiées telles quelles ; une source sans lot ne dit rien de ton lot.</p>
</section>

<nav aria-label="Suite"><a href="#" data-role="pont">${esc(REF.nom)} ${fr(REF.dose)} g/L dans Dryhopper ${ic('fleche', 16)}</a></nav>
</main>
<div id="fiche" data-role="fiche" role="dialog" aria-label="Fiche du houblon" hidden></div>
${HOPS.map(ficheHtml).join('\n')}`;

const JS = `
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  // Lecture au style / absolu (ne change que l'affichage).
  $$('.lentille [data-e]').forEach(function (b) { b.addEventListener('click', function () {
    $$('.lentille [data-e]').forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); });
    document.body.classList.toggle('abs', b.dataset.e === 'absolu');
  }); });
  if (/[?&]abs\\b/.test(location.search)) $('.lentille [data-e="absolu"]').click();
  // Le seul facteur libre : la variété. Retirer un houblon le retire partout ; deux au moins restent.
  $$('[data-cmp]').forEach(function (b) { b.addEventListener('click', function () {
    var on = b.getAttribute('aria-pressed') === 'true';
    if (on && $$('[data-cmp][aria-pressed="true"]').length <= 2) return;
    b.setAttribute('aria-pressed', String(!on));
    var n = b.dataset.cmp;
    $$('[data-cle="' + n + '"], [data-h="' + n + '"]').forEach(function (e) { e.hidden = on; });
  }); });
  // Légende derrière « ? ».
  var lb = $('[data-role="legende-bouton"]'), lg = $('#legende');
  lb.addEventListener('click', function () { var o = lb.getAttribute('aria-expanded') === 'true'; lg.hidden = o; lb.setAttribute('aria-expanded', String(!o)); });
  // Un toucher ouvre un acquis.
  $$('button.ouvre[aria-controls]').forEach(function (b) { b.addEventListener('click', function () { var c = document.getElementById(b.getAttribute('aria-controls')); var o = b.getAttribute('aria-expanded') === 'true'; c.hidden = o; b.setAttribute('aria-expanded', String(!o)); }); });
  // La fiche : appui long (500 ms) sur un houblon ou sa carte, survol long (750 ms) à l'ordinateur.
  var F = $('#fiche'), tAppui = null, tSurvol = null, ouvertPar = false;
  function ouvrir(nom) {
    var t = document.getElementById('fiche-' + nom.replace(/\\s/g, '-')); if (!t) return;
    F.innerHTML = ''; F.appendChild(t.content.cloneNode(true)); F.hidden = false; F.dataset.houblon = nom;
    $('[data-role="fermer-fiche"]', F).addEventListener('click', fermer);
    $$('[data-role="gout"]', F).forEach(function (g) { g.addEventListener('click', function () { var p = g.getAttribute('aria-pressed') === 'true'; $$('[data-role="gout"]', F).forEach(function (x) { x.setAttribute('aria-pressed', 'false'); }); g.setAttribute('aria-pressed', String(!p)); }); });
    try { if (navigator.vibrate) navigator.vibrate(8); } catch (e) {}
  }
  function fermer() { F.hidden = true; F.innerHTML = ''; }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { if (!F.hidden) fermer(); if (!lg.hidden) { lg.hidden = true; lb.setAttribute('aria-expanded', 'false'); } } });
  function cible(t) {
    if (!t || !t.closest) return null;
    if (t.closest('button, a, [role="radio"], #fiche, [data-role="legende"]')) return null;
    var h = t.closest('[data-houblon]'); if (h && !h.closest('#fiche')) return h.dataset.houblon;
    var c = t.closest('[data-role="ligne-houblon"]'); return c ? c.dataset.cle : null;
  }
  var x0 = 0, y0 = 0;
  document.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    var n = cible(e.target); if (!n) return;
    x0 = e.clientX; y0 = e.clientY; clearTimeout(tAppui);
    tAppui = setTimeout(function () { ouvertPar = true; ouvrir(n); }, 500);
  });
  document.addEventListener('pointermove', function (e) { if (tAppui && Math.hypot(e.clientX - x0, e.clientY - y0) > 10) { clearTimeout(tAppui); tAppui = null; } });
  ['pointerup', 'pointercancel'].forEach(function (k) { document.addEventListener(k, function () { clearTimeout(tAppui); tAppui = null; }); });
  document.addEventListener('click', function (e) { if (ouvertPar) { ouvertPar = false; e.preventDefault(); e.stopPropagation(); } }, true);
  document.addEventListener('contextmenu', function (e) { if (cible(e.target)) e.preventDefault(); });
  $$('[data-houblon], [data-role="ligne-houblon"]').forEach(function (el) {
    el.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'mouse') return; var n = cible(e.target); if (!n) return; clearTimeout(tSurvol); tSurvol = setTimeout(function () { ouvrir(n); }, 750); });
    el.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') clearTimeout(tSurvol); });
  });
  var q = /[?&]fiche=([^&]+)/.exec(location.search); if (q) ouvrir(decodeURIComponent(q[1]));
  if (/[?&]valeurs\\b/.test(location.search)) $('button.ouvre').click();
  if (/[?&]legende\\b/.test(location.search)) lb.click();
})();
`;

const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Lequel pour ma stout : Cascade, Idaho 7 ou Galaxy ? · r6d, le même tropical</title>
<!-- Généré par r6d/generer.mjs depuis ../donnees/comparer-stout.json (${esc(D.version)}, ${esc(D.date)}). Ne pas éditer à la main. -->
<style>${CSS}</style></head>
<body>
${SYMB}
${body}
<script>${JS}</script>
</body></html>`;
fs.writeFileSync(path.join(ICI, 'etat.html'), html);
console.log('écrit r6d/etat.html (' + html.length + ' o) · ' + HOPS.map((x) => x.nom + ' ' + (x.dose != null ? x.dose + ' g/L' : '> ' + x.doseMax + ' g/L (~' + Math.round(x.atteint * 100) + ' % à ' + x.doseMax + ')')).join(' · ') + ' · 4MMP ×' + (rapport4 ? fr(rapport4) : '?'));
