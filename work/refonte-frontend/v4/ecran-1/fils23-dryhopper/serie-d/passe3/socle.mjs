// Série D, passe 2 (voie r7d2-passe2, lot 23) : données et briques de d8b, reprises du socle v0 (../socle.mjs,
// non modifié). Changements : pictos de la planche standard (« épicé » = cannelle et clou croisés, choisi le
// 23.10), stock en icône dans le contexte, teneur du lot (CoA) dans la fiche ; le dock est dans generer.mjs.
// Approche : le simulateur. Le profil de la stout se déforme en direct quand on glisse le moment.
// Ce socle porte la baseline (y1b, carte Dryhopper) : ligne de contexte sans contrôle, α du lot puis plage
// des fiches, rôle en mot, au style / absolu, légende derrière « ? », appui long → fiche courte g1,
// le moment au doigt par 5′ (dock sous le pouce, loupe ×3), honnêteté (« ~ » simulé, « ≈ » interpolé,
// « ? » hachuré, jamais 0), vraies valeurs sourcées.
//
// Données (lues, jamais modifiées) :
//   - ../../fils22-comparer/donnees/comparer-stout.json (vérifié D102) : stout 16D, avant, grille Idaho 7
//     (4 g/L, US-05 et Pomona), α et fiches, IBU par gramme ;
//   - ../../fils21-choisir/donnees/comparatifs-dryhop.json : E03 (Idaho 7, ligne Idaho-7), E10 ;
//   - prototypes/houblons-v4/data/correspondance-familles.json : parts retrouvées par moment (H13, H30, H31).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ici = path.dirname(fileURLToPath(import.meta.url));
const lire = (p) => JSON.parse(fs.readFileSync(path.join(ici, p), 'utf8'));
export const J = lire('../../../fils22-comparer/donnees/comparer-stout.json');
export const E = lire('../../../fils21-choisir/donnees/comparatifs-dryhop.json');
export const CORR = lire('../../../../../../../prototypes/houblons-v4/data/correspondance-familles.json');
export const JET = lire('../../../fils17-standard/jetons-familles.json');
const PLANCHE = fs.readFileSync(path.join(ici, '../../../fils17-standard/v3/planche.html'), 'utf8');
const SYMB = [...PLANCHE.matchAll(/<symbol id="p-[a-zA-Z]+"[^]*?<\/symbol>/g)].map((m) => m[0]);
if (SYMB.length !== 12 || !SYMB.some((x) => x.startsWith('<symbol id="p-spice"') && x.includes('rotate(40 12 14)'))) throw new Error('planche standard : 12 symboles et p-spice croisé attendus');
export const SYMBOLES = '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>' + SYMB.join('') + '</defs></svg>';

export const COURT = { citrus: 'Agrumes', tropical: 'Tropicaux', stoneFruit: 'Noyau', pomeFruit: 'Pépins', berries: 'Baies', melon: 'Melon', floral: 'Floral', herbal: 'Herbacé', resin: 'Résineux', spice: 'Épicé', green: 'Végétal', earthy: 'Terreux' };
export const ORDRE = J.style.ordre; // floral, herbacé, terreux d'abord (attendues du 16D)
export const ROUE = ['citrus', 'tropical', 'melon', 'stoneFruit', 'pomeFruit', 'berries', 'floral', 'green', 'herbal', 'spice', 'earthy', 'resin'];
export const BANDE = Object.fromEntries(Object.entries(J.style.zone).map(([k, v]) => [k, v.bande[1]]));
export const ATTENDUES = Object.entries(J.style.zone).filter(([, v]) => v.statut === 'attendue').map(([k]) => k);
export const AVANT = Object.fromEntries(Object.entries(J.biere.avant).map(([k, v]) => [k, v.centre]));
export const AVANT_INC = Object.entries(J.biere.avant).filter(([, v]) => v.inconnu).map(([k]) => k);
export const HOP = J.houblons.find((h) => h.nom === 'Idaho 7');
export const COUL = '#5b3fa0'; // Idaho 7, même couleur que la carte et Comparer (D83 S1)
const VOLUME = J.biere.recette.volumeL; // 20 L
const DOSE = 4; // g/L, fixé
const IBU_BASE = 60; // Nugget 46 g à 60′ (base/consolide/biere.html, comme la carte)
export const IBU_STYLE = [50, 70]; // 16D, BJCP 2021 (repris de y1b)

export const fr = (x, d = 0) => (Math.round(x * 10 ** d) / 10 ** d).toFixed(d).replace('.', ',');
export const fr1 = (x) => (Number.isInteger(x) ? String(x) : fr(x, 1));
export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---------- les moments (le seul facteur libre) ----------
const pt = (moment, jours, levure = 'fermentis-us05') => HOP.grille.find((x) => x.moment === moment && x.dose_gL === DOSE && x.jours === (jours ?? null) && x.levure === levure);
const tri = (p) => Object.fromEntries(Object.entries(p.apres).map(([k, v]) => [k, { b: v[0], c: v[1], h: v[2] }]));
const ipg = Object.fromEntries(HOP.ibuParGramme.moments.filter((m) => m.ibuPerGram).map((m) => [m.code, m.ibuPerGram.value]));
const lin = (a, b, t) => a + (b - a) * t;
function ipgA(min) { // IBU par gramme à une minute d'ébullition : publié (moteur) ou interpolé
  const pts = [[60, ipg.b60], [30, ipg.b30], [15, ipg.b15], [10, ipg.b10]];
  for (const [m, v] of pts) if (m === min) return { v, interp: false };
  for (let k = 0; k < pts.length - 1; k++) { const [m0, v0] = pts[k], [m1, v1] = pts[k + 1]; if (min < m0 && min > m1) return { v: lin(v0, v1, (m0 - min) / (m0 - m1)), interp: true }; }
  return null;
}
const PREUVE = {
  0: { t: '4MMP : −91 % en 60′ à 100 °C', s: 'H13', n: 'mesure' },
  1: { t: '4MMP : −23 % à 90 °C', s: 'H13', n: 'mesure' },
  2: { t: 'Idaho 7 au pitch : linalol 38 ± 13 µg/L', s: 'E03', n: 'mesure' },
  3: { t: 'Cascade : 1 h ≈ 96 h au panel', s: 'E10', n: 'mesure' },
};
// Vérification de la bonne ligne (L14) : E03, variété « Idaho-7 », linalol 0,038 mg/L ± 0,013.
{
  const e3 = E.etudes.find((e) => e.id === 'E03').mesures.find((m) => m.variete === 'Idaho-7' && m.compose === 'linalol');
  if (!e3 || e3.valeur !== 0.038 || e3.ecart !== 0.013) throw new Error('E03 : ligne Idaho-7 du linalol introuvable ou changée');
}

const M = [];
const b60 = tri(pt('b60')), b10 = tri(pt('b10'));
for (let m = 60; m >= 10; m -= 5) {
  const t = (60 - m) / 50, interp = m !== 60 && m !== 10;
  const v = {};
  for (const f of ROUE) v[f] = { b: lin(b60[f].b, b10[f].b, t), c: lin(b60[f].c, b10[f].c, t), h: lin(b60[f].h, b10[f].h, t) };
  const ib = ipgA(m);
  M.push({ id: 'b' + m, lib: m + '′', court: m + '′', seg: 0, min: m, v, interp, ibuAdd: ib.v * DOSE * VOLUME, ibuInterp: ib.interp, ref: tri(pt('dryPost', 3)), perte: 'chaleur' });
}
M.push({ id: 'wp', lib: 'whirlpool', court: 'WP', seg: 1, v: tri(pt('wp')), interp: false, ibuAdd: ipg.wp * DOSE * VOLUME, ibuInterp: false, ref: tri(pt('dryPost', 3)), perte: 'chaleur' });
for (const j of [1, 2, 3, 5, 7]) M.push({ id: 'dryActive|' + j, lib: 'actif · ' + j + ' j', court: 'J' + j, seg: 2, jours: j, v: tri(pt('dryActive', j)), interp: false, ibuAdd: null, ref: tri(pt('dryPost', j)), perte: 'co2', pom: tri(pt('dryActive', j, 'lalbrew-pomona')) });
for (const j of [1, 2, 3, 5, 7]) M.push({ id: 'dryPost|' + j, lib: 'après · ' + j + ' j', court: 'J' + j, seg: 3, jours: j, v: tri(pt('dryPost', j)), interp: false, ibuAdd: null, ref: tri(pt('dryPost', j)), perte: null });
for (const p of M) {
  p.inc = ROUE.filter((f) => p.v[f].c === 0 && p.v[f].h === 0);
  p.c = Object.fromEntries(ROUE.map((f) => [f, +p.v[f].c.toFixed(2)]));
  p.lo = Object.fromEntries(ROUE.map((f) => [f, +p.v[f].b.toFixed(2)]));
  p.hi = Object.fromEntries(ROUE.map((f) => [f, +p.v[f].h.toFixed(2)]));
  p.emporte = Object.fromEntries(ROUE.map((f) => [f, p.perte ? +Math.max(0, p.ref[f].c - p.v[f].c).toFixed(2) : 0]));
  p.levure = p.pom ? Object.fromEntries(ROUE.map((f) => [f, +(p.pom[f].c - p.v[f].c).toFixed(2)])) : null;
  p.ibu = p.ibuAdd == null ? null : Math.round(IBU_BASE + p.ibuAdd);
  p.preuve = PREUVE[p.seg];
  delete p.v; delete p.ref; delete p.pom; delete p.ibuAdd;
}
export const MOMENTS = M;
export const DEPART = M.findIndex((p) => p.id === 'dryActive|3');
// « Ta demande » (dégustation du 18.10 : « ma stout est trop résineuses, je la veux plus floral ») :
// parmi les moments où l'amertume reste dans la 16D (ou à cru), le plus grand écart floral − résineux.
const score = (p) => (p.c.floral - AVANT.floral) - (p.c.resin - AVANT.resin);
export const MEILLEUR = M.reduce((best, p, i) => ((p.ibu == null || p.ibu <= IBU_STYLE[1]) && (best < 0 || score(p) > score(M[best])) ? i : best), -1);

// Parts retrouvées en bière par moment (moteur, bornes sourcées, centres en convention) : d5.
export const PARTS = (() => {
  const P = CORR.partsRetrouvees;
  const g = (k) => ({ b60: P[k].b60, b10: P[k].b10, wp: P[k].wp, dryActive: P[k].dryActive, dryPost: P[k].dryPost });
  return { linalol: g('linalol'), geraniol: g('geraniol'), myrcene: g('hydrocarbures'), '4MMP': g('4MMP') };
})();
export const LOT = HOP.composes.lots[0]; // CoA ID7-2573 (récolte 2025)

// ---------- briques HTML ----------
export const pic = (f, t = 16, cls = 'pi') => `<svg class="${cls}" width="${t}" height="${t}" data-famille="${f}" aria-label="${COURT[f]}"><use href="#p-${f}"/></svg>`;
const A = HOP.alpha, AMIN = Math.min(...A.sources.map((s) => s.min)), AMAX = Math.max(...A.sources.map((s) => s.max));
export const alpha = () => `<span class="num dx-al" data-role="alpha" data-source="lot">α ${fr1(A.retenu.value)}% <span class="dx-pl">${fr1(AMIN)}–${fr1(AMAX)}</span></span>`;
const ROLE = { aromatique: 'aromatique', double: 'mixte', amérisant: 'amérisant' };
export const contexte = () => `<p class="dx-ctx" data-role="contexte"><span class="dx-fixe">fixé</span><span data-contexte="houblon"><span class="dx-hop" data-houblon="Idaho 7" data-couleur="${COUL}"><i class="dx-pt" style="background:${COUL}" aria-hidden="true"></i>Idaho 7</span> ${alpha()} <span class="dx-us" data-role="usage">${ROLE[HOP.role.value]}</span><span class="dx-stk" data-stock role="img" aria-label="en stock"></span></span><span data-contexte="dose">4 g/L</span><span data-contexte="levure">US-05</span><span data-contexte="base">Stout 16D</span></p>`;

// Fiche courte g1 (appui long, D25) : α du lot puis fiches, arômes sourcés, silhouette, goût.
function radarFiche() {
  const r = 52, c = 66, n = ROUE.length, ang = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const p = (i, k) => [c + k * r * Math.cos(ang(i)), c + k * r * Math.sin(ang(i))].map((x) => x.toFixed(1)).join(',');
  const lv = Object.fromEntries(HOP.aromes.map((a) => [a.family, a.level]));
  let s = `<svg class="dx-rf" data-radar data-objet="fiche" data-axes="${ROUE.join(',')}" viewBox="0 0 132 132" width="124" height="124" role="img" aria-label="Silhouette d'Idaho 7 selon ses fiches ; hachuré : non décrit"><defs><pattern id="dx-hf" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="#c9cad2" stroke-width="1.4"/></pattern></defs>`;
  for (const k of [0.5, 1]) s += `<polygon points="${ROUE.map((f, i) => p(i, k)).join(' ')}" fill="none" stroke="#e1e3e9"/>`;
  ROUE.forEach((f, i) => { if (!lv[f]) s += `<path d="M${c},${c}L${p(i - 0.5, 1)}L${p(i + 0.5, 1)}Z" fill="url(#dx-hf)"/>`; });
  s += `<polygon points="${ROUE.map((f, i) => p(i, Math.max(0.06, (lv[f] || 0) / 2))).join(' ')}" fill="none" stroke="${COUL}" stroke-width="2" stroke-linejoin="round"/>`;
  ROUE.forEach((f, i) => { const [x, y] = p(i, 1.16).split(',').map(Number); s += `<use href="#p-${f}" x="${(x - 6).toFixed(1)}" y="${(y - 6).toFixed(1)}" width="12" height="12"/>`; });
  return s + '</svg>';
}
export const fiche = () => {
  const dec = HOP.aromes.filter((a) => a.level > 0).sort((a, b) => b.level - a.level);
  const nd = HOP.aromes.length - dec.length;
  return `<section class="dx-fiche" role="dialog" aria-label="Fiche d'Idaho 7" data-role="fiche" data-pour="Idaho 7" hidden>
<header class="dx-fh"><i class="dx-pt" style="background:${COUL}" aria-hidden="true"></i><h3>Idaho 7</h3><span class="dx-us">${ROLE[HOP.role.value]}</span><button class="dx-fx" type="button" data-role="fermer-fiche" aria-label="Fermer la fiche"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 3l10 10M13 3L3 13"/></svg></button></header>
<p class="dx-fa" data-role="fiche-alpha"><span class="num">α ${fr1(A.retenu.value)} %</span> <small>lot</small> · <span class="num">${fr1(AMIN)}–${fr1(AMAX)} %</span> <small>${A.sources.map((s) => s.source + ' ' + s.annee).join(', ')}</small></p>
<div class="dx-fc">${radarFiche()}<ul class="dx-fl"><li class="dx-fnd" data-role="fiche-arome">d'après 1 fiche <small>(${esc(HOP.aromes[0].authors.join(', '))})</small></li>${dec.map((a) => `<li data-role="fiche-arome">${pic(a.family, 14)}<b style="color:${JET[a.family].texte}">${COURT[a.family]}</b> <span class="dx-fm">${esc(a.mots.flatMap((m) => m.mots).slice(0, 2).join(', '))}</span></li>`).join('')}<li class="dx-fnd">${nd} non décrites <small>(inconnu, pas zéro)</small></li><li class="dx-fnd">autres mots : aucun <small>(0 %)</small></li></ul></div>
<p class="dx-fa dx-lot" data-nature="mesure" data-source="coa-id7-2573">lot ${LOT.id.replace('ID7-', '')} : huile <span class="num">${fr1(LOT.huile).replace('.', ',')}</span> mL/100 g · linalol <span class="num">${fr1(LOT.composes.linalol).replace('.', ',')}</span> % · myrcène <span class="num">${fr1(LOT.composes.myrcene).replace('.', ',')}</span> %</p>
<div class="dx-fg" role="group" data-role="gout" aria-label="Mon goût pour Idaho 7"><button type="button" aria-pressed="false" aria-label="Aimer Idaho 7"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M8 13.5S2 10 2 6a3 3 0 0 1 6-1 3 3 0 0 1 6 1c0 4-6 7.5-6 7.5Z"/></svg></button><button type="button" aria-pressed="false" aria-label="Exclure Idaho 7"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="8" cy="8" r="6"/><path d="M3.8 12.2l8.4-8.4"/></svg></button></div>
</section>`;
};

