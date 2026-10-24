// Série D (voie r7d-dryhopper, lot 23) : le socle commun des huit concepts « Quand ajouter Idaho 7 ? ».
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
export const J = lire('../../fils22-comparer/donnees/comparer-stout.json');
export const E = lire('../../fils21-choisir/donnees/comparatifs-dryhop.json');
export const CORR = lire('../../../../../../prototypes/houblons-v4/data/correspondance-familles.json');
export const JET = lire('../../fils17-standard/jetons-familles.json');
const TEMOIN = fs.readFileSync(path.join(ici, '../../../tournoi/outils/temoins/une-question-ok/etat.html'), 'utf8');
export const SYMBOLES = TEMOIN.match(/<svg width="0" height="0"[^]*?<\/svg>/)[0];

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
export const contexte = () => `<p class="dx-ctx" data-role="contexte"><span class="dx-fixe">fixé</span><span data-contexte="houblon"><span class="dx-hop" data-houblon="Idaho 7" data-couleur="${COUL}"><i class="dx-pt" style="background:${COUL}" aria-hidden="true"></i>Idaho 7</span> ${alpha()} <span class="dx-us" data-role="usage">${ROLE[HOP.role.value]}</span></span><span data-contexte="dose">4 g/L</span><span data-contexte="levure">US-05</span><span data-contexte="base">Stout 16D</span></p>`;
export const tete = (etape) => `<header class="dx-barre"><a class="dx-retour" aria-label="Retour" href="../../../fils22-carte/comparer/etat.html">‹</a><h1 class="dx-titre">Quand ajouter Idaho 7 ?</h1>${etape ? '<span class="dx-etapes" aria-label="Étape 1 sur 2"><b>1 Quand</b><span>2 Levure</span></span>' : ''}</header>`;
export const lentille = (id, legende) => `<div class="dx-lent"><button type="button" class="dx-aide" data-role="legende-bouton" aria-expanded="false" aria-controls="${id}" aria-label="Lire la légende">?</button><div class="dx-leg" id="${id}" data-role="legende" hidden>${legende.map((l) => `<span>${l}</span>`).join('')}</div><span class="dx-seg" data-lecture role="radiogroup" aria-label="lecture au style ou absolu"><button type="button" role="radio" aria-checked="true" data-e="style">Au style</button><button type="button" role="radio" aria-checked="false" data-e="absolu">Absolu</button></span></div>`;
export const preuve = () => `<p class="dx-preuve" data-role="preuve"><span class="dx-vr" data-nature="mesure" data-source="E03" id="dx-pv"></span> <span class="dx-src" id="dx-ps"></span></p>`;
export const pont = (levure) => levure === 'etape'
  ? `<nav class="dx-pont" aria-label="Étape suivante"><a href="../../../fils22-carte/levure-etape/etat.html">Puis la levure ›</a></nav>`
  : `<nav class="dx-pont" aria-label="Autre outil"><a class="dx-sec" href="../../../fils22-carte/levure-outil/etat.html" id="dx-lev">Levure ›</a></nav>`;
export const dock = () => `<div class="dx-dock" data-libre="moment"><div class="dx-loupe" aria-hidden="true"></div>
<div class="dx-rail" role="slider" tabindex="0" aria-label="Moment de l'ajout" aria-valuemin="0" aria-valuemax="${M.length - 1}" aria-valuenow="${DEPART}" aria-valuetext="${M[DEPART].lib}">
<span class="dx-z dx-z0"></span><span class="dx-z dx-z1"></span><span class="dx-z dx-z2"></span><span class="dx-z dx-z3"></span><i class="dx-best" aria-hidden="true"></i><span class="dx-pouce"><span class="dx-pouce-l"></span></span></div>
<div class="dx-rep"><span style="left:2%">60′</span><span style="left:43%">10′</span><span style="left:50%">WP</span><span style="left:65.5%">actif</span><span style="left:88.5%">après</span></div></div>`;

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
<div class="dx-fc">${radarFiche()}<ul class="dx-fl">${dec.map((a) => `<li data-role="fiche-arome">${pic(a.family, 14)}<b style="color:${JET[a.family].texte}">${COURT[a.family]}</b> <small>${a.sources}/${a.of} fiche</small> <span class="dx-fm">${esc(a.mots.flatMap((m) => m.mots).slice(0, 2).join(', '))}</span></li>`).join('')}<li class="dx-fnd">${nd} non décrites <small>(inconnu, pas zéro)</small></li><li class="dx-fnd">autres mots : aucun <small>(0 %)</small></li></ul></div>
<div class="dx-fg" role="group" data-role="gout" aria-label="Mon goût pour Idaho 7"><button type="button" aria-pressed="false" aria-label="Aimer Idaho 7"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M8 13.5S2 10 2 6a3 3 0 0 1 6-1 3 3 0 0 1 6 1c0 4-6 7.5-6 7.5Z"/></svg></button><button type="button" aria-pressed="false" aria-label="Exclure Idaho 7"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="8" cy="8" r="6"/><path d="M3.8 12.2l8.4-8.4"/></svg></button></div>
</section>`;
};

export const CSS = `
:root { --encre:#16161a; --gris:#55555f; --trait:#e3e5eb; --mur:#eef0f4; --acc:#c2410c; --hop:${COUL}; --stout:#3B1F14; --sans:"Source Sans 3",system-ui,-apple-system,"Segoe UI",sans-serif; --mono:"IBM Plex Mono",ui-monospace,Consolas,monospace; }
[hidden] { display:none !important; }
* { box-sizing:border-box; margin:0; padding:0; }
html, body { background:var(--mur); }
body { color:var(--encre); font:400 14px/1.25 var(--sans); -webkit-tap-highlight-color:transparent; }
::selection { background:#d9d0ef; }
button { font:inherit; color:inherit; background:none; border:0; cursor:pointer; }
a { color:inherit; text-decoration:none; }
svg { display:block; flex:none; }
:focus-visible { outline:2px solid var(--hop); outline-offset:2px; }
.dx-ecran { max-width:390px; margin:0 auto; padding:4px 10px 96px; display:flex; flex-direction:column; gap:7px; }
.dx-ecran.dx-sans-dock { padding-bottom:16px; }
.dx-barre { display:flex; align-items:center; gap:8px; min-height:38px; }
.dx-retour { width:28px; height:28px; border-radius:50%; background:#fff; border:1px solid var(--trait); display:inline-flex; align-items:center; justify-content:center; flex:none; font:600 20px/1 var(--sans); padding-bottom:2px; }
.dx-titre { font:600 17px/1.2 var(--sans); }
.dx-etapes { margin-left:auto; display:inline-flex; gap:4px; font-size:12px; }
.dx-etapes > * { height:22px; padding:0 8px; border-radius:11px; display:inline-flex; align-items:center; white-space:nowrap; }
.dx-etapes b { background:var(--encre); color:#fff; font-weight:600; }
.dx-etapes span { background:#fff; color:var(--gris); border:1px solid #c9cad2; }
.dx-ctx { display:flex; flex-wrap:wrap; align-items:center; gap:4px; font-size:13px; color:var(--gris); }
.dx-fixe { font-size:12px; margin-right:2px; }
.dx-ctx [data-contexte] { display:inline-flex; align-items:center; gap:4px; height:22px; padding:0 8px; border-radius:11px; background:#e2e5eb; color:var(--encre); }
.dx-hop { display:inline-flex; align-items:center; gap:4px; font-weight:600; -webkit-user-select:none; user-select:none; -webkit-touch-callout:none; cursor:default; }
.dx-pt { width:10px; height:10px; border-radius:50%; display:inline-block; flex:none; }
.dx-al { font-size:13px; }
.dx-pl { color:var(--gris); }
.dx-us { font-size:12px; font-weight:600; padding:0 5px; border-radius:9px; border:1px solid #9a9aa6; color:var(--gris); }
.num { font-family:var(--mono); font-variant-numeric:tabular-nums; }
.dx-lent { display:flex; justify-content:flex-end; align-items:center; gap:6px; position:relative; }
.dx-aide { width:26px; height:26px; border-radius:50%; border:1px solid #c9cad2; background:#fff; font-weight:700; color:var(--gris); margin-right:auto; }
.dx-leg { position:absolute; top:32px; left:0; z-index:5; background:#fff; border:1px solid #c9cad2; border-radius:8px; padding:8px 10px; font-size:13px; display:flex; flex-direction:column; gap:4px; width:290px; box-shadow:0 6px 18px rgba(22,22,26,.14); }
.dx-seg { display:inline-flex; background:#e2e5eb; border-radius:15px; padding:2px; }
.dx-seg button { height:26px; padding:0 10px; border-radius:13px; font-size:13px; color:var(--gris); }
.dx-seg button[aria-checked="true"] { background:#fff; color:var(--encre); font-weight:600; }
.dx-bloc { background:#fff; border-radius:8px; padding:8px 10px; }
.dx-preuve { font-size:13px; color:var(--encre); display:flex; flex-wrap:wrap; gap:4px; align-items:baseline; }
.dx-src { font-size:12px; color:var(--gris); }
.dx-sim { color:var(--gris); }
.dx-hors { color:var(--acc); font-weight:600; }
.dx-pont { display:flex; justify-content:flex-end; gap:6px; }
.dx-pont a { display:inline-flex; align-items:center; gap:6px; height:34px; padding:0 14px; border-radius:17px; background:var(--encre); color:#fff; font-weight:600; font-size:14px; }
.dx-pont a.dx-sec { background:#fff; color:var(--encre); border:1px solid #c9cad2; }
.dx-pont small { font-weight:400; font-size:12px; color:var(--gris); }
/* le dock sous le pouce (y1b) */
.dx-dock { position:fixed; left:0; right:0; bottom:0; max-width:390px; margin:0 auto; background:#fff; border-top:1px solid var(--trait); padding:28px 18px 6px; touch-action:none; z-index:10; }
.dx-rail { position:relative; height:22px; cursor:pointer; }
.dx-z { position:absolute; top:8px; height:6px; border-radius:2px; }
.dx-z0 { left:0; width:46%; background:#d9b8a0; } .dx-z1 { left:46%; width:8%; background:#c9cdd6; } .dx-z2 { left:54%; width:23%; background:#b9a9dc; } .dx-z3 { left:77%; width:23%; background:#9f8cc9; }
.dx-best { position:absolute; top:3px; width:2px; height:16px; margin-left:-1px; background:var(--hop); }
.dx-cran { position:absolute; top:4px; width:1px; height:14px; background:var(--encre); }
.dx-pouce { position:absolute; top:2px; width:18px; height:18px; margin-left:-9px; border-radius:50%; background:var(--encre); border:2px solid #fff; box-shadow:0 1px 3px rgba(22,22,26,.35); }
.dx-pouce-l { position:absolute; bottom:22px; left:50%; transform:translateX(-50%); white-space:nowrap; background:var(--encre); color:#fff; font:600 13px var(--sans); padding:2px 8px; border-radius:11px; }
.dx-rep { position:relative; height:16px; margin-top:2px; font-size:12px; color:var(--gris); }
.dx-rep span { position:absolute; transform:translateX(-50%); white-space:nowrap; }
.dx-loupe { position:absolute; left:8px; right:8px; top:-44px; height:40px; display:none; background:#fff; border:1px solid #c9cad2; border-radius:8px; overflow:hidden; box-shadow:0 4px 12px rgba(22,22,26,.12); }
.dx-dock.dx-touche .dx-loupe { display:block; }
.dx-dock.dx-touche .dx-pouce-l { visibility:hidden; }
.dx-loupe span { position:absolute; top:5px; transform:translateX(-50%); font:600 14px var(--mono); color:var(--gris); }
.dx-loupe span.ici { color:#fff; background:var(--encre); padding:0 6px; border-radius:4px; }
/* fiche */
.dx-fiche { position:fixed; left:0; right:0; bottom:0; max-width:390px; margin:0 auto; background:#fff; border-radius:8px 8px 0 0; box-shadow:0 -8px 28px rgba(0,0,0,.22); padding:10px 14px 14px; z-index:30; display:flex; flex-direction:column; gap:8px; }
.dx-fh { display:flex; align-items:center; gap:6px; }
.dx-fh h3 { font-size:18px; color:var(--hop); }
.dx-fx { margin-left:auto; width:28px; height:28px; display:inline-flex; align-items:center; justify-content:center; border-radius:50%; background:#eef0f4; }
.dx-fa { font-size:13px; } .dx-fa small, .dx-fl small { color:var(--gris); font-size:12px; }
.dx-fc { display:flex; gap:8px; align-items:flex-start; }
.dx-fl { list-style:none; display:flex; flex-direction:column; gap:3px; font-size:13px; }
.dx-fl li { display:flex; align-items:center; gap:4px; flex-wrap:wrap; }
.dx-fm { color:var(--gris); font-size:12px; }
.dx-fnd { color:var(--gris); }
.dx-fg { display:flex; gap:6px; } .dx-fg button { width:34px; height:30px; border-radius:15px; border:1px solid #c9cad2; display:inline-flex; align-items:center; justify-content:center; }
.dx-fg button[aria-pressed="true"] { background:var(--encre); color:#fff; }
.pi { width:16px; height:16px; }
`;

// Script commun : lentille, légende, fiche (appui long, survol long), moment au doigt (dock + loupe),
// et l'API DH pour les concepts (DH.surChange(fn), DH.poser(i), DH.S(f, v), DH.Z(f), DH.abs()).
export const JS = `
var DH = (function () {
  var M = ${JSON.stringify(M)}, AV = ${JSON.stringify(AVANT)}, AVI = ${JSON.stringify(AVANT_INC)}, B = ${JSON.stringify(BANDE)};
  var T = ${JSON.stringify(Object.fromEntries(ROUE.map((f) => [f, JET[f].texte])))}, BA = ${JSON.stringify(Object.fromEntries(ROUE.map((f) => [f, JET[f].base])))};
  var COURT = ${JSON.stringify(COURT)}, ROUE = ${JSON.stringify(ROUE)}, ORDRE = ${JSON.stringify(ORDRE)};
  var fns = [], cur = ${DEPART}, best = ${MEILLEUR};
  function $(s, r) { return (r || document).querySelector(s); } function $$(s, r) { return [].slice.call((r || document).querySelectorAll(s)); }
  function abs() { return document.body.classList.contains('abs'); }
  function S(f, v) { return abs() ? v / 110 : v / (2 * B[f]); }   // part de la piste
  function Z(f) { return abs() ? B[f] / 110 : 0.5; }               // fin de la zone du style
  function fr(x, d) { d = d || 0; var k = Math.pow(10, d); return (Math.round(x * k) / k).toFixed(d).replace('.', ','); }
  function sg(x) { return (x >= 0 ? '+' : '−') + fr(Math.abs(x)); }
  function pic(f, t, cls) { t = t || 16; return '<svg class="' + (cls || 'pi') + '" width="' + t + '" height="' + t + '" data-famille="' + f + '" aria-label="' + COURT[f] + '"><use href="#p-' + f + '"/></svg>'; }
  function hors(f, v) { return v > B[f]; }
  function poser(i) {
    cur = i; var p = M[i], r = $('.dx-rail');
    if (r) { r.setAttribute('aria-valuenow', i); r.setAttribute('aria-valuetext', p.lib); $('.dx-pouce').style.left = x(i) + '%'; $('.dx-pouce-l').textContent = p.lib + (p.interp ? ' ≈' : ''); graduations(i); }
    var pv = $('#dx-pv'), ps = $('#dx-ps');
    if (pv) { pv.textContent = p.preuve.t; pv.setAttribute('data-source', p.preuve.s); ps.textContent = p.preuve.s + ' · mesuré'; }
    var lv = $('#dx-lev'); if (lv) lv.innerHTML = 'Levure › <small>' + (p.levure ? 'Pomona ~' + sg(p.levure.citrus) + ' agrumes' : 'Pomona en dry hop actif') + '</small>';
    fns.forEach(function (fn) { fn(p, i); });
  }
  var SEG = [[0, 46], [46, 54], [54, 77], [77, 100]];
  function x(i) { var s = M[i].seg, idx = []; M.forEach(function (p, k) { if (p.seg === s) idx.push(k); }); var n = idx.length, a = SEG[s][0], b = SEG[s][1];
    return n === 1 ? (a + b) / 2 : a + (b - a) * (0.06 + 0.88 * idx.indexOf(i) / (n - 1)); }
  function graduations(i) { var r = $('.dx-rail'), d = $('.dx-dock'), l = $('.dx-loupe'); if (!r) return;
    $$('.dx-cran', r).forEach(function (c) { c.remove(); });
    if (!d.classList.contains('dx-touche')) return;
    M.forEach(function (p, k) { if (p.seg !== M[i].seg) return; var c = document.createElement('i'); c.className = 'dx-cran'; c.style.left = x(k) + '%'; r.insertBefore(c, r.firstChild); });
    l.innerHTML = ''; var w = l.clientWidth, pas = 66;
    for (var k = i - 2; k <= i + 2; k++) { if (k < 0 || k >= M.length) continue; var s = document.createElement('span'); s.textContent = M[k].court; if (k === i) s.className = 'ici'; s.style.left = (w / 2 + (k - i) * pas) + 'px'; l.appendChild(s); } }
  function brancherDock() {
    var r = $('.dx-rail'); if (!r) return; var d = $('.dx-dock');
    $('.dx-best').style.left = x(best) + '%';
    function depuis(e) { var b = r.getBoundingClientRect(), pc = (e.clientX - b.left) / b.width * 100, k0 = 0, bd = 1e9;
      for (var k = 0; k < M.length; k++) { var dd = Math.abs(x(k) - pc); if (dd < bd) { bd = dd; k0 = k; } } if (k0 !== cur) poser(k0); }
    r.addEventListener('pointerdown', function (e) { r.setPointerCapture(e.pointerId); d.classList.add('dx-touche'); depuis(e); graduations(cur); });
    r.addEventListener('pointermove', function (e) { if (e.buttons || e.pointerType === 'touch') depuis(e); });
    r.addEventListener('pointerup', function () { d.classList.remove('dx-touche'); graduations(cur); });
    r.addEventListener('pointercancel', function () { d.classList.remove('dx-touche'); graduations(cur); });
    r.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') poser(Math.min(M.length - 1, cur + 1)); if (e.key === 'ArrowLeft') poser(Math.max(0, cur - 1)); });
  }
  // lentille au style / absolu
  $$('[data-e]').forEach(function (b) { b.addEventListener('click', function () {
    $$('[data-e]').forEach(function (z) { z.setAttribute('aria-checked', String(z === b)); });
    document.body.classList.toggle('abs', b.dataset.e === 'absolu'); poser(cur); }); });
  // légende derrière « ? »
  $$('[data-role=legende-bouton]').forEach(function (b) { b.addEventListener('click', function () {
    var l = document.getElementById(b.getAttribute('aria-controls')); l.hidden = !l.hidden; b.setAttribute('aria-expanded', String(!l.hidden)); }); });
  // fiche : appui long (doigt), survol long (souris) ; le toucher court ne l'ouvre pas
  function fiche(o) { var f = $('[data-role="fiche"]'); f.hidden = !o; }
  $$('[data-role="fermer-fiche"]').forEach(function (b) { b.addEventListener('click', function (e) { e.stopPropagation(); fiche(false); }); });
  $$('[data-role="gout"] button').forEach(function (b) { b.addEventListener('click', function () { var on = b.getAttribute('aria-pressed') !== 'true'; $$('[data-role="gout"] button').forEach(function (z) { z.setAttribute('aria-pressed', 'false'); }); b.setAttribute('aria-pressed', String(on)); }); });
  addEventListener('keydown', function (e) { if (e.key !== 'Escape') return; fiche(false);
    $$('[data-role=legende]').forEach(function (l) { l.hidden = true; }); $$('[data-role=legende-bouton]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); }); });
  $$('[data-houblon]').forEach(function (c) { var t = null, hv = null, x0 = 0, y0 = 0;
    c.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    c.addEventListener('pointerdown', function (e) { if (e.pointerType === 'mouse') return; x0 = e.clientX; y0 = e.clientY; clearTimeout(t); t = setTimeout(function () { fiche(true); }, 520); });
    c.addEventListener('pointermove', function (e) { if (t && Math.hypot(e.clientX - x0, e.clientY - y0) > 12) { clearTimeout(t); t = null; } });
    ['pointerup', 'pointercancel'].forEach(function (k) { c.addEventListener(k, function () { clearTimeout(t); t = null; }); });
    c.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'mouse') return; clearTimeout(hv); hv = setTimeout(function () { fiche(true); }, 700); });
    c.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') clearTimeout(hv); }); });
  // une transition douce entre deux états (le profil « respire »)
  function tween(dur, fn) { var t0 = performance.now(); function pas(t) { var k = Math.min(1, (t - t0) / dur); fn(1 - Math.pow(1 - k, 3)); if (k < 1) requestAnimationFrame(pas); } requestAnimationFrame(pas); }
  function demarrer() { brancherDock(); var q = location.search.match(/moment=([^&]+)/); var i = q ? M.findIndex(function (p) { return p.id === decodeURIComponent(q[1]); }) : cur; poser(i < 0 ? cur : i); }
  return { M: M, AV: AV, AVI: AVI, B: B, T: T, BA: BA, COURT: COURT, ROUE: ROUE, ORDRE: ORDRE, best: best, $: $, $$: $$, S: S, Z: Z, abs: abs, fr: fr, sg: sg, pic: pic, hors: hors, poser: poser, tween: tween, demarrer: demarrer,
    cur: function () { return cur; }, surChange: function (fn) { fns.push(fn); } };
})();
`;

export function page({ id, titre, corps, css = '', js = '', legende, levure, avecDock = true, etape = levure === 'etape' }) {
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titre)} · Quand ajouter Idaho 7 ?</title>
<style>${CSS}
${css}</style></head>
<body>
${SYMBOLES}
<main class="dx-ecran ${id}${avecDock ? '' : ' dx-sans-dock'}">
${tete(etape)}
${contexte()}
${lentille('leg-' + id, legende)}
${corps}
${preuve()}
${pont(levure)}
</main>
${avecDock ? dock() : ''}
${fiche()}
<script>${JS}</script>
<script>${js}
DH.demarrer();</script>
</body></html>`;
}
