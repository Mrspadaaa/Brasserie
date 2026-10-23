// Passe 2 de b4 (série B, lot 23 Dryhopper) : le podium des moments, avec ses greffes et retouches (tri/SYNTHESE.md).
// La partie « données » est reprise telle quelle du générateur v0 (../generer.mjs), la vue est réécrite. Usage : node generer.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const racine = path.resolve(ici, '../../../../../../..');
const lire = (p) => fs.readFileSync(path.join(racine, p), 'utf8');
const P = JSON.parse(lire('work/refonte-frontend/v4/ecran-1/fils21-choisir/donnees/profils-simules.json'));
const C = JSON.parse(lire('work/refonte-frontend/v4/ecran-1/fils21-choisir/donnees/comparatifs-dryhop.json'));
const PACK = JSON.parse(lire('prototypes/houblons-v4/data/pack-fiches.json'));
const CARTE = lire('work/refonte-frontend/v4/ecran-1/fils22-carte/dryhopper/etat.html');
const JET = JSON.parse(lire('work/refonte-frontend/v4/ecran-1/fils17-standard/jetons-familles.json'));

// ---------- données ----------
const NOM = 'Idaho 7', DOSE = 4, VOL = P.biere.recette.volumeL;
const H = PACK.fichesHoublons.find((h) => h.name === NOM);
const FAM = P.style.ordre; // floral, herbal, earthy, citrus, tropical, stoneFruit, pomeFruit, berries, melon, resin, spice, green
const NOMF = { floral: 'Floral', herbal: 'Herbacé', earthy: 'Terreux', citrus: 'Agrumes', tropical: 'Tropicaux', stoneFruit: 'Noyau', pomeFruit: 'Pépins', berries: 'Baies', melon: 'Melon', resin: 'Résineux', spice: 'Épicé', green: 'Végétal' };
const T = Object.fromEntries(FAM.map((f) => [f, JET[f].texte]));
const BA = Object.fromEntries(FAM.map((f) => [f, JET[f].base]));
const FOND = Object.fromEntries(FAM.map((f) => [f, JET[f].fond]));
const BANDE = Object.fromEntries(FAM.map((f) => [f, P.style.zone[f].bande[1]]));
const AV = Object.fromEntries(FAM.map((f) => [f, P.biere.avant[f].centre]));
const grille = (moment, jours, lev = 'fermentis-us05') => P.grille.find((e) => e.nom === NOM && e.dose_gL === DOSE && e.moment === moment && (e.jours ?? null) === jours && e.levure === lev);
const ipg = (code) => { const m = H.ibuParGramme.moments.find((x) => x.code === code); return m && m.ibuPerGram ? m.ibuPerGram.value : null; };
const r1 = (x) => Math.round(x * 100) / 100;
const lot = (e) => ({ v: Object.fromEntries(FAM.map((f) => [f, r1(e.apres[f][1])])), lo: Object.fromEntries(FAM.map((f) => [f, r1(e.apres[f][0])])), hi: Object.fromEntries(FAM.map((f) => [f, r1(e.apres[f][2])])), conf: e.confiance });
const INC = FAM.filter((f) => !(H.aromes.find((a) => a.family === f) || {}).level && grille('dryPost', 3).apres[f][1] === 0);

// Les moments de la frise : ébullition par 5′, whirlpool, dry hop actif et après par jours de contact.
const D = [];
for (let m = 60; m >= 0; m -= 5) D.push({ id: 'b' + m, lib: m + '′', dit: 'à ' + m + '′', court: m + '′', seg: 0, min: m });
D.push({ id: 'wp', lib: 'whirlpool', dit: 'au whirlpool', court: 'WP', seg: 1 });
for (const j of [1, 2, 3, 5, 7]) D.push({ id: 'dryActive|' + j, lib: 'actif · ' + j + ' j', dit: 'en actif, ' + j + ' j', court: 'J' + j, seg: 2, j });
for (const j of [1, 2, 3, 5, 7]) D.push({ id: 'dryPost|' + j, lib: 'après · ' + j + ' j', dit: 'après, ' + j + ' j', court: 'J' + j, seg: 3, j });
const calc = { b60: grille('b60', null), b10: grille('b10', null), wp: grille('wp', null) };
for (const p of D) {
  const [mo, j] = p.id.split('|');
  const e = calc[mo] || (j ? grille(mo, +j) : null);
  if (e) Object.assign(p, lot(e), { nat: 'simule' });
}
// Entre deux moments calculés : « ≈ interpolé » (comme y1b), jamais présenté comme un calcul du moteur.
const interp = (a, b, t) => { const o = {}; for (const k of ['v', 'lo', 'hi']) { o[k] = {}; for (const f of FAM) o[k][f] = r1(a[k][f] + (b[k][f] - a[k][f]) * t); } return o; };
const iB60 = D.findIndex((p) => p.id === 'b60'), iB10 = D.findIndex((p) => p.id === 'b10'), iWP = D.findIndex((p) => p.id === 'wp');
for (let i = iB60 + 1; i < iB10; i++) Object.assign(D[i], interp(D[iB60], D[iB10], (60 - D[i].min) / 50), { nat: 'interpole', conf: 'faible' });
for (let i = iB10 + 1; i < iWP; i++) Object.assign(D[i], interp(D[iB10], D[iWP], (10 - D[i].min) / 10), { nat: 'interpole', conf: 'faible' });
// IBU ajoutés par Idaho 7 (IBU par gramme × 4 g/L × 20 L) ; à cru : non modélisé.
const IBUK = {};
for (const p of D) { if (p.seg === 0 || p.seg === 1) { const g = ipg(p.seg === 1 ? 'wp' : p.id); if (g != null) IBUK[p.id] = Math.round(g * DOSE * VOL); } }
const connus = D.filter((p) => IBUK[p.id] != null && p.seg === 0);
for (const p of D) {
  if (p.seg >= 2) { p.ibu = null; continue; }
  if (IBUK[p.id] != null) { p.ibu = IBUK[p.id]; p.ibuNat = 'calcul'; continue; }
  const a = connus.filter((q) => q.min > p.min).pop(), b = connus.find((q) => q.min < p.min);
  p.ibu = Math.round(a.ibu ?? IBUK[a.id]) + Math.round((IBUK[b.id] - IBUK[a.id]) * (a.min - p.min) / (a.min - b.min)); p.ibuNat = 'interpole';
}
for (const p of D) { p.d = Object.fromEntries(FAM.map((f) => [f, r1(p.v[f] - AV[f])])); }
// La réponse : face à ta dégustation (« ma stout est trop résineuses, je la veux plus floral », 18.10), le plus
// de floral pour le moins de résineux, l'amertume dans la 16D (50–70 IBU ; la stout est à ~60 avec Nugget 60′).
// Convention de la maquette : solde = Δfloral − Δrésineux − dépassement d'IBU au-dessus de 70. Le plus court
// à 0,05 point près du meilleur (deux jours valent trois quand rien ne bouge).
const IBU0 = 60, IBUMAX = 70;
for (const p of D) p.solde = r1(p.d.floral - p.d.resin - Math.max(0, (p.ibu == null ? 0 : IBU0 + p.ibu) - IBUMAX));
const calcules = D.map((p, i) => i).filter((i) => D[i].nat === 'simule');
const meilleur = Math.max(...calcules.map((i) => D[i].solde));
const BEST = calcules.find((i) => D[i].solde >= meilleur - 0.05);
const APRES2 = D.findIndex((p) => p.id === 'dryPost|2');
const PO = lot(grille('dryActive', D[BEST].j, 'lalbrew-pomona'));
// Vraies valeurs (lire la ligne de la bonne variété, L14).
const etude = (id) => C.etudes.find((e) => e.id === id);
const E03 = etude('E03').mesures.find((m) => m.variete === 'Idaho-7' && m.compose === 'linalol');
const SEUIL_LI = 8; // µg/L, cité par E01
const E08 = etude('E08').mesures.find((m) => m.compose === 'linalol');
const E10 = etude('E10').mesures[0];
const E07 = etude('E07').mesures.find((m) => /cooked/.test(m.descripteur));
if (!E03 || !E08 || !E10 || !E07) throw new Error('vraie valeur introuvable');
const liUg = Math.round(E03.valeur * 1000), liEc = Math.round(E03.ecart * 1000);
const REEL = {
  E03: { court: 'Idaho 7 à la levure : linalol ' + liUg + ' ± ' + liEc + ' µg/L, ×' + (liUg / SEUIL_LI).toFixed(1).replace('.', ',') + ' le seuil', src: 'E03 McCabe 2023, à vérifier' },
  E08: { court: 'Eureka! : l’essentiel en 2 j', src: 'E08 Schmidt 2019' },
  E10: { court: 'Cascade : 1 h = 96 h au nez', src: 'E10 Titus 2021' },
  E07: { court: 'ébullition : cuit, végétal', src: 'E07 Sharp 2014, Simcoe' },
};

const fr = (x, d = 0) => (x < 0 ? '−' : '') + Math.abs(x).toFixed(d).replace('.', ',');
const sg = (x) => (x >= 0 ? '+' : '−') + fr(Math.abs(x));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const B = D[BEST], A2 = D[APRES2];
const alpha = H.alpha.retenu.value, aMin = H.alpha.sources[0].min, aMax = H.alpha.sources[0].max;
const COUL = '#5b3fa0'; // couleur d'Idaho 7 dans toute la base (carte, Comparer)


// =====================================================================================================
// Passe 2 de b4 : le podium des moments, enrichi de ses greffes (tri du 23.10, SYNTHESE.md).
// =====================================================================================================
const fr1 = (x) => fr(x, 1);
// Pictos : ceux de la carte, sauf « épicé », repris tel quel de la planche standard (cannelle et clou croisés, 23.10).
const PLANCHE = lire('work/refonte-frontend/v4/ecran-1/fils17-standard/v3/planche.html');
const sym = (src, id) => { const a = src.indexOf('<symbol id="' + id + '"'); if (a < 0) throw new Error('symbole ' + id + ' introuvable'); return src.slice(a, src.indexOf('</symbol>', a) + 9); };
const BASE_SYM = CARTE.slice(CARTE.indexOf('<svg width="0" height="0"'), CARTE.indexOf('</svg>', CARTE.indexOf('<symbol id="p-green"')) + 6);
const SPICE = sym(PLANCHE, 'p-spice');
if (!SPICE.includes('rotate(40 12 14)')) throw new Error('le p-spice de la planche n’est pas cannelle et clou croisés');
const SYMBOLES = BASE_SYM.split(sym(CARTE, 'p-spice')).join(SPICE);
const pic = (f, s = 16) => `<svg class="pi" width="${s}" height="${s}" data-famille="${f}" aria-label="${NOMF[f]}"><use href="#p-${f}"/></svg>`;
const ico = {
  stock: `<svg class="ico" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#55555f" stroke-width="1.5" aria-hidden="true"><path d="M2 4.5 7 2l5 2.5v5L7 12 2 9.5z"/><path d="M2 4.5 7 7l5-2.5M7 7v5"/></svg>`,
  coeur: `<svg class="ico" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#16161a" stroke-width="1.5" aria-hidden="true"><path d="M8 13.5S2 10 2 6a3 3 0 0 1 6-1 3 3 0 0 1 6 1c0 4-6 7.5-6 7.5z"/></svg>`,
  ban: `<svg class="ico" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#16161a" stroke-width="1.5" aria-hidden="true"><circle cx="8" cy="8" r="5.5"/><path d="M4.2 11.8l7.6-7.6"/></svg>`,
  x: `<svg class="ico" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#16161a" stroke-width="1.5" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg>`,
};

// Pomona, moment par moment (M07 : calculer l'écart avant de dessiner l'aperçu du pont).
for (const p of D) {
  const [mo, j] = p.id.split('|');
  if (!j) { p.po = null; continue; }
  const e = grille(mo, +j, 'lalbrew-pomona');
  p.po = { citrus: r1(e.apres.citrus[1] - p.v.citrus), floral: r1(e.apres.floral[1] - p.v.floral) };
}
const poMax = Math.max(...D.filter((p) => p.po && p.seg === 3).map((p) => Math.max(Math.abs(p.po.citrus), Math.abs(p.po.floral))));
if (poMax > 0.05) throw new Error('Pomona change l’après : le texte du pont est à revoir (' + poMax + ')');

// Teneur du lot publié (CoA), pour la fiche (greffe d5).
const CMP = JSON.parse(lire('prototypes/houblons-v4/data/composes-houblon.json'));
const trouverLot = (o) => { if (!o || typeof o !== 'object') return null; if (o.id === 'ID7-2573' && o.composes) return o; for (const v of Object.values(o)) { const r = trouverLot(v); if (r) return r; } return null; };
const COA = trouverLot(CMP);
if (!COA) throw new Error('CoA ID7-2573 introuvable');

// Vraies valeurs par moment (greffe c7) ; « ? jamais mesuré à ce moment » hachuré (greffe c5).
const E04 = etude('E04').mesures.filter((m) => /OHAI/.test(m.descripteur || ''));
const ohai0 = E04.find((m) => m.dose_gL === 0).valeur, ohai386 = E04.find((m) => m.dose_gL === 3.86).valeur;
const MES = {
  b60: { txt: 'cuit', src: 'E07', aria: 'Mesuré à 60′ : cuit, végétal, herbacé (Sharp 2014, Simcoe et Hallertau, 1,5 g/L)' },
  b10: null, wp: null,
  dryActive: { txt: `${liUg} µg/L`, src: 'E03', aria: `Mesuré : Idaho 7 mis à la levure, linalol ${liUg} ± ${liEc} µg/L, ×${fr1(liUg / SEUIL_LI)} le seuil (McCabe 2023, à vérifier)` },
  dryPost: { txt: `${fr1(ohai386)}/15`, src: 'E04', aria: `Mesuré : Cascade à 3,86 g/L, 24 h après fermentation, intensité houblonnée ${fr1(ohai0)} → ${fr1(ohai386)} sur 15 (Lafontaine 2018)` },
};
const mesDe = (p) => (p.seg === 0 ? (p.id === 'b60' ? MES.b60 : null) : p.seg === 1 ? null : p.seg === 2 ? MES.dryActive : MES.dryPost);
// Le classement : les cinq étapes calculées de la grille.
const RANG = ['dryActive|' + B.j, 'dryPost|' + B.j, 'wp', 'b10', 'b60'].map((id) => D.findIndex((p) => p.id === id)).sort((a, b) => D[b].solde - D[a].solde);
// Le rail : 13 positions d'ébullition par 5′, le whirlpool, l'actif, l'après ; les jours de contact au bout (x3b réduit).
const R = [...D.filter((p) => p.seg === 0).map((p) => p.id), 'wp', 'dryActive', 'dryPost'];
const JOURS = [1, 2, 3, 5, 7];
// « sans gain » : le jour n'ajoute rien au floral, ni en actif ni après (la grille sature, E08 et E10).
const sansGain = JOURS.filter((j, k) => k > 0 && ['dryActive', 'dryPost'].every((mo) => Math.abs(D.find((p) => p.id === mo + '|' + j).v.floral - D.find((p) => p.id === mo + '|' + JOURS[k - 1]).v.floral) < 0.05));

const LEVURE_LIEN = '../../../../fils22-carte/levure-outil/etat.html';
if (!fs.existsSync(path.join(racine, 'work/refonte-frontend/v4/ecran-1/fils22-carte/levure-outil/etat.html'))) throw new Error('outil Levure absent');

// ---------- fiche (appui long) : g1 courte, + la teneur du lot publié ----------
const lv = Object.fromEntries(H.aromes.map((a) => [a.family, a.level]));
const ang = (i) => -Math.PI / 2 + i * 2 * Math.PI / FAM.length;
function radarFiche() {
  const r = 50, c = 64, pf = (i, k) => [c + k * r * Math.cos(ang(i)), c + k * r * Math.sin(ang(i))];
  let s = `<svg class="fi-r" data-radar data-objet="fiche" data-axes="${FAM.join(',')}" viewBox="0 0 128 128" width="118" height="118" role="img" aria-label="Silhouette d'Idaho 7 selon sa fiche ; hachuré : non décrit"><defs><pattern id="fi-h" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0v4" stroke="#c9cdd6" stroke-width="1.5"/></pattern></defs>`;
  for (const k of [0.5, 1]) s += `<polygon fill="none" stroke="#e3e5eb" stroke-width="1" points="${FAM.map((f, i) => pf(i, k).map((x) => x.toFixed(1)).join(',')).join(' ')}"/>`;
  FAM.forEach((f, i) => { if (!lv[f]) { const a = pf(i - 0.5, 1), b = pf(i + 0.5, 1); s += `<path fill="url(#fi-h)" d="M${c},${c}L${a[0].toFixed(1)},${a[1].toFixed(1)}L${b[0].toFixed(1)},${b[1].toFixed(1)}Z"/>`; } });
  s += `<polygon fill="${COUL}" fill-opacity=".18" stroke="${COUL}" stroke-width="1.5" points="${FAM.map((f, i) => pf(i, Math.max(0.08, (lv[f] || 0) / 2)).map((x) => x.toFixed(1)).join(',')).join(' ')}"/>`;
  FAM.forEach((f, i) => { const [x, y] = pf(i, 1.17); s += `<use href="#p-${f}" x="${(x - 6).toFixed(1)}" y="${(y - 6).toFixed(1)}" width="12" height="12"/>`; });
  return s + '</svg>';
}
const decrits = H.aromes.filter((a) => a.level > 0).sort((a, b) => b.level - a.level);
const nMots = H.aromes.reduce((s, a) => s + a.mots.reduce((t, m) => t + m.mots.length, 0), 0);
const FICHE = `<section class="fiche" role="dialog" aria-label="Fiche d'Idaho 7" data-role="fiche" data-pour="${NOM}" hidden>
<header class="fi-h"><i class="pt" style="background:${COUL}" aria-hidden="true"></i><h3>${NOM}</h3><span class="us" data-role="usage">mixte</span><button class="fi-x" type="button" data-role="fermer-fiche" aria-label="Fermer la fiche">${ico.x}</button></header>
<p class="fi-a" data-role="fiche-alpha"><span class="num">α ${fr(alpha, 1)} %</span> lot · fiches <span class="num">${fr(aMin, 1)}–${fr(aMax, 1)} %</span> <small class="gris">Beer Maverick 2023</small></p>
<p class="fi-a" data-nature="mesure" data-source="coa-id7-2573">huile <span class="num">${fr(COA.huile, 1)}</span> mL/100 g · linalol <span class="num">${fr(COA.composes.linalol, 1)} %</span> · myrcène <span class="num">${fr(COA.composes.myrcene, 1)} %</span> <small class="gris">lot publié ID7-2573, YCH ${COA.recolte}</small></p>
<div class="fi-c">${radarFiche()}<ul class="fi-l">${decrits.map((a) => `<li data-role="fiche-arome">${pic(a.family, 14)}<b style="color:${T[a.family]}">${NOMF[a.family]}</b> <small class="gris">${a.sources}/${a.of}</small> <span>${esc([...new Set(a.mots.flatMap((m) => m.mots))].slice(0, 2).join(', '))}</span></li>`).join('')}</ul></div>
<p class="fi-o"><i class="fi-aut" aria-hidden="true"></i>autres : 0 mot sur ${nMots} · ${FAM.length - decrits.length} familles non décrites (inconnu)</p>
<div class="fi-g" role="group" data-role="gout" aria-label="Mon goût pour ${NOM}"><button type="button" aria-pressed="false" aria-label="Aimer ${NOM}">${ico.coeur}</button><button type="button" aria-pressed="false" aria-label="Exclure ${NOM}">${ico.ban}</button></div>
</section>`;

// ---------- légende (derrière « ? ») : les conventions y vivent, pas au premier plan ----------
const LEGENDE = `<div class="leg" id="leg" data-role="legende" role="dialog" aria-label="Légende" hidden><ul>
<li><b>★ le meilleur pour ta stout</b>, convention de la maquette : floral gagné − résineux gagné − IBU au-dessus de 70 (16D : 50–70). Le classement suit ce solde (lignes de dry hop aux jours choisis au bout de la frise) ; ton moment (rond noir, cadre pointillé) s'y range.</li>
<li><b>~</b> simulé, points sur 100 (panel, Lafontaine 2018) ; <b>≈</b> interpolé de 55′ à 15′ ; hachuré : inconnu ou jamais mesuré.</li>
<li>Barre pâle au bout : ce que la chaleur ou le CO₂ emporte, contre l'après-fermentation (~).</li>
<li>Ruban : les familles gagnées, à leur couleur. IBU : Nugget 60 en gris, Idaho 7 en violet, orangé au-dessus de 70 ; à cru, non modélisé (?).</li>
<li>Mesuré : 60′ E07 (Simcoe, cuit, végétal) ; actif E03 (Idaho 7 au pitch, linalol, à vérifier) ; après E04 (Cascade 3,86 g/L, 24 h).</li>
<li>Jours en pointillé : sans gain (le simulé sature à 2 j ; E08 Eureka! : l’essentiel en 2 j ; E10 Cascade : 1 h = 96 h au nez).</li>
<li>Autres mots (hors des 12 familles) : 0 sur ${nMots} pour Idaho 7.</li>
</ul></div>`;

// ---------- page ----------
const IBUSC = 170;
const ibuJauge = (p) => {
  const tot = p.ibu == null ? null : IBU0 + p.ibu;
  const z = `<i class="b4-iz" style="left:${50 / IBUSC * 100}%;width:${20 / IBUSC * 100}%"></i><i class="b4-in" style="width:${60 / IBUSC * 100}%"></i>`;
  if (tot == null) return `<span class="b4-ib" aria-label="IBU : 60 plus un apport à cru non modélisé">${z}<i class="b4-iq" style="left:${60 / IBUSC * 100}%;width:${18 / IBUSC * 100}%"></i></span><em class="b4-iv num">60+?</em>`;
  return `<span class="b4-ib" aria-label="IBU ${tot}${tot > IBUMAX ? ', trop amer' : ''}">${z}<i class="b4-ia${tot > IBUMAX ? ' trop' : ''}" style="left:${60 / IBUSC * 100}%;width:${Math.min(100 - 60 / IBUSC * 100, p.ibu / IBUSC * 100)}%"></i></span><em class="b4-iv num${tot > IBUMAX ? ' alerte' : ''}">${p.ibuNat === 'interpole' ? '≈' : ''}${tot}</em>`;
};
const CORPS = `<section class="reponse" data-role="reponse" data-nature="simule"><p class="k">Face à ta stout</p><p class="q">${'Dry hop actif, ' + B.j + ' j'}</p><p class="e" id="ecart"></p></section>
<div class="lent"><button type="button" class="aide" data-role="legende-bouton" aria-expanded="false" aria-controls="leg" aria-label="Lire la légende">?</button>${LEGENDE}<span class="seg" data-lecture role="radiogroup" aria-label="lecture au style ou absolu"><button type="button" role="radio" aria-checked="true" data-e="style">Au style</button><button type="button" role="radio" aria-checked="false" data-e="absolu">Absolu</button></span></div>
<section class="bloc b4-l" id="b4-l" data-acquis="valeurs"><div class="b4-t" aria-hidden="true"><span></span><span></span><span class="b4-h">${pic('floral', 14)}</span><span class="b4-h">${pic('resin', 14)}</span><span class="b4-h">IBU</span><span class="b4-h">mesuré</span></div><div id="b4-rows"></div></section>
<nav class="pont" aria-label="Pont vers l’outil Levure" data-acquis="levure" data-forme="pont"><a class="second" href="${LEVURE_LIEN}"><span>Levure ›</span><small id="b4-po"></small></a></nav>
<div class="frise" data-libre="moment" data-acquis="frise">
  <div class="loupe" aria-hidden="true"></div>
  <div class="b4-dk">
    <div class="b4-rz" data-acquis="geste" data-pas="5">
      <div class="rail" role="slider" tabindex="0" aria-label="Moment de l'ajout" aria-valuemin="0" aria-valuemax="${R.length - 1}" aria-valuenow="0" aria-valuetext="">
        <span class="b4-prof" aria-hidden="true"></span>
        <span class="pouce"><span class="pouce-l"></span></span></div>
      <div class="rep"><span data-etape="ebullition" style="left:23%">ébullition</span><span data-etape="whirlpool" style="left:53.5%">WP</span><span data-etape="actif" style="left:70.5%">actif</span><span data-etape="apres" style="left:90%">après</span></div>
    </div>
    <div class="b4-j" data-jours role="radiogroup" aria-label="Jours de contact du dry hop">${JOURS.map((j) => `<button type="button" role="radio" aria-checked="${j === B.j}" data-jour="${j}" class="${sansGain.includes(j) ? 'sg' : ''}" aria-label="${j} j de contact${sansGain.includes(j) ? ', sans gain' : ''}">${j}j</button>`).join('')}</div>
  </div>
</div>`;

const CSS = `
:root { --encre:#16161a; --gris:#55555f; --trait:#e3e5eb; --mur:#eef0f4; --acc:#c2410c; --sans:"Source Sans 3",system-ui,-apple-system,"Segoe UI",sans-serif; --mono:"IBM Plex Mono",ui-monospace,Consolas,monospace; }
[hidden] { display:none !important; }
* { box-sizing:border-box; margin:0; padding:0; }
html, body { background:var(--mur); }
body { color:var(--encre); font:400 14px/1.25 var(--sans); -webkit-tap-highlight-color:transparent; }
button { font:inherit; color:inherit; background:none; border:0; cursor:pointer; }
a { color:inherit; text-decoration:none; }
svg { display:block; flex:none; }
.ecran { max-width:390px; margin:0 auto; padding:4px 10px 0; display:flex; flex-direction:column; gap:8px; }
.barre { display:flex; align-items:center; gap:8px; min-height:40px; }
.retour { width:28px; height:28px; border-radius:50%; background:#fff; border:1px solid var(--trait); display:inline-flex; align-items:center; justify-content:center; flex:none; font:600 20px/1 var(--sans); padding-bottom:2px; }
h1.titre { font:600 17px/1.2 var(--sans); }
.ctx { display:flex; flex-wrap:wrap; align-items:center; gap:4px; font-size:13px; color:var(--gris); }
.ctx .fixe { font-size:12px; color:var(--gris); margin-right:2px; }
.ctx [data-contexte] { display:inline-flex; align-items:center; gap:4px; height:22px; padding:0 8px; border-radius:11px; background:#e2e5eb; color:var(--encre); }
.ctx .hb { font-weight:600; user-select:none; -webkit-user-select:none; -webkit-touch-callout:none; }
.ctx .pl { color:var(--gris); }
.us { font-size:12px; color:var(--encre); border:1px solid #9a9aa3; border-radius:8px; padding:0 5px; line-height:15px; }
.stk { display:inline-flex; }
.pt { width:10px; height:10px; border-radius:50%; display:inline-block; flex:none; }
.lent { display:flex; justify-content:flex-end; align-items:center; gap:6px; position:relative; }
.seg { display:inline-flex; background:#e2e5eb; border-radius:15px; padding:2px; }
.seg button { height:26px; padding:0 10px; border-radius:13px; font-size:13px; color:var(--gris); }
.seg button[aria-checked="true"] { background:#fff; color:var(--encre); font-weight:600; }
.aide { width:26px; height:26px; border-radius:50%; border:1px solid #c9cad2; background:#fff; font-weight:700; color:var(--gris); margin-right:auto; }
.leg { position:absolute; top:32px; left:0; right:0; z-index:20; background:#fff; border:1px solid #c9cad2; border-radius:8px; padding:8px 10px; font-size:13px; }
.leg ul { list-style:none; display:flex; flex-direction:column; gap:5px; }
.bloc { background:#fff; border-radius:8px; padding:8px; display:flex; flex-direction:column; gap:4px; }
.pi { width:16px; height:16px; }
.num { font-family:var(--mono); font-variant-numeric:tabular-nums; }
.gris { color:var(--gris); }
.alerte { color:var(--acc); font-weight:600; }
.reponse { background:#fff; border-radius:8px; padding:8px 10px; display:flex; flex-direction:column; gap:2px; border-left:4px solid var(--encre); }
.reponse .k { font-size:12px; color:var(--gris); }
.reponse .q { font:700 22px/1.15 var(--sans); }
.reponse .e { font-size:13px; }
.reponse .e:empty { display:none; }
nav.pont { display:flex; }
nav.pont a { display:flex; align-items:center; gap:8px; width:100%; min-height:34px; padding:4px 12px; border-radius:8px; background:#fff; border:1px solid #c9cad2; font-weight:600; font-size:14px; }
nav.pont a small { font-weight:400; font-size:13px; color:var(--gris); }
/* podium */
.b4-t, .b4-r { display:grid; grid-template-columns:94px 30px 1fr 1fr 50px 58px; gap:4px; align-items:center; font-size:13px; }
.b4-t { font-size:12px; color:var(--gris); padding:0 4px; }
.b4-h { display:flex; align-items:center; justify-content:center; }
.b4-r { min-height:60px; padding:2px 4px; border-radius:8px; border:2px solid transparent; }
.b4-r.best { background:#f6f0fa; }
.b4-r.doigt { border-color:var(--encre); }
.b4-r.ajout { background:#fff; border-style:dashed; border-color:var(--encre); }
.b4-m { display:flex; align-items:center; gap:5px; font-weight:600; line-height:1.1; }
.b4-k { width:20px; height:20px; border-radius:50%; background:#e2e5eb; display:inline-flex; align-items:center; justify-content:center; font-size:12px; flex:none; }
.b4-r.best .b4-k { background:var(--encre); color:#fff; }
.b4-k0 { width:20px; flex:none; }
.b4-dg { width:12px; height:12px; border-radius:50%; background:var(--encre); display:block; }
.b4-rb { position:relative; height:26px; border-radius:2px; background:#f1f2f5; overflow:hidden; display:flex; }
.b4-rb i { display:block; height:100%; }
.b4-b { position:relative; height:34px; }
.b4-b .z, .b4-b .x, .b4-b .em { position:absolute; left:0; top:4px; height:12px; border-radius:2px; display:block; }
.b4-b .z { background:#e2e5eb; }
.b4-b .em { opacity:.32; }
.b4-b em { position:absolute; left:0; bottom:0; font-style:normal; font-size:12px; font-weight:700; line-height:13px; }
.b4-ib { position:relative; display:block; height:9px; background:#f1f2f5; border-radius:2px; margin-top:4px; }
.b4-ib i { position:absolute; top:0; bottom:0; display:block; }
.b4-iz { background:#d9dce3; }
.b4-in { left:0; background:#7d7d87; height:5px; top:2px !important; }
.b4-ia { background:${COUL}; height:5px; top:2px !important; }
.b4-ia.trop { background:var(--acc); }
.b4-iq { background:repeating-linear-gradient(135deg,#9a9aa3 0 2px,transparent 2px 5px); }
.b4-iv { display:block; font-style:normal; font-size:12px; line-height:15px; }
.b4-mz { font-size:12px; line-height:1.15; }
.b4-mz b { font-weight:700; color:#1d6b8a; }
.b4-mz small { display:block; color:var(--gris); font-size:12px; }
.b4-mz.jamais { display:flex; align-items:center; justify-content:center; height:26px; border-radius:4px; background:repeating-linear-gradient(135deg,#c9cdd6 0 2px,#fff 2px 6px); color:var(--encre); font-weight:700; }
/* dock : la frise sous le pouce, profil du floral, jours au bout */
.frise { position:sticky; bottom:0; margin:0 -10px; background:#fff; border-radius:8px 8px 0 0; box-shadow:0 -1px 0 var(--trait); padding:30px 10px 8px; touch-action:none; z-index:4; }
.b4-dk { display:flex; align-items:flex-end; gap:8px; }
.b4-rz { flex:1; min-width:0; }
.rail { position:relative; height:50px; cursor:pointer; }
.b4-prof { position:absolute; left:0; right:0; top:0; height:40px; }
.b4-prof i { position:absolute; bottom:0; width:8px; margin-left:-4px; border-radius:2px 2px 0 0; background:#bf86d6; }
.b4-prof i.trop { box-shadow:0 3px 0 var(--acc); }
.b4-prof i.ip { opacity:.55; }
.b4-prof .seg-l { position:absolute; bottom:-6px; height:3px; border-radius:2px; background:#c9cdd6; }
.cran { position:absolute; top:38px; width:1px; height:12px; background:var(--encre); }
.pouce { position:absolute; top:32px; width:18px; height:18px; margin-left:-9px; border-radius:50%; background:var(--encre); border:2px solid #fff; z-index:2; }
.pouce-l { position:absolute; bottom:22px; left:50%; transform:translateX(-50%); white-space:nowrap; background:var(--encre); color:#fff; font:600 13px var(--sans); padding:2px 8px; border-radius:11px; }
.epingle { position:absolute; top:-2px; transform:translateX(-50%); font:700 12px var(--sans); color:#7a4fb5; display:none; }
body.hors-reponse .epingle { display:block; }
.frise.touche .epingle { display:none; }
.frise .rep { position:relative; height:16px; margin-top:4px; font-size:12px; color:var(--gris); }
.frise .rep span { position:absolute; transform:translateX(-50%); white-space:nowrap; }
.b4-j { display:flex; gap:2px; padding-bottom:18px; flex:none; }
.b4-j button { width:26px; height:32px; padding:0; border-radius:4px; border:1px solid #c9cad2; font-size:12px; background:#fff; }
.b4-j button.sg { border-style:dotted; color:var(--gris); }
.b4-j button[aria-checked="true"] { background:var(--encre); color:#fff; border-color:var(--encre); border-style:solid; }
.b4-j.chaud button { opacity:.45; }
.loupe { position:absolute; left:8px; right:8px; top:-40px; height:36px; display:none; background:#fff; border:1px solid #c9cad2; border-radius:8px; overflow:hidden; z-index:5; }
.frise.touche .loupe { display:block; }
.frise.touche .pouce-l { visibility:hidden; }
.loupe span { position:absolute; top:4px; transform:translateX(-50%); font:600 13px var(--mono); color:var(--gris); text-align:center; }
.loupe span::after { content:""; display:block; width:1px; height:8px; background:var(--gris); margin:2px auto 0; }
.loupe span.ici { color:#fff; background:var(--encre); padding:0 6px; border-radius:4px; }
.loupe span.ici::after { background:#fff; }
/* fiche */
.fiche { position:fixed; left:0; right:0; bottom:0; max-width:390px; margin:0 auto; background:#fff; border-radius:8px 8px 0 0; box-shadow:0 -8px 28px rgba(0,0,0,.22); padding:10px 12px 14px; z-index:30; display:flex; flex-direction:column; gap:6px; }
.fi-h { display:flex; align-items:center; gap:6px; }
.fi-h h3 { font-size:18px; font-weight:700; color:${COUL}; }
.fi-x { margin-left:auto; width:28px; height:28px; display:inline-flex; align-items:center; justify-content:center; border-radius:50%; background:#eef0f4; }
.fi-a { font-size:13px; }
.fi-a small { font-size:12px; }
.fi-c { display:flex; gap:8px; align-items:flex-start; }
.fi-l { list-style:none; display:flex; flex-direction:column; gap:3px; font-size:13px; }
.fi-l li { display:flex; align-items:center; gap:4px; flex-wrap:wrap; }
.fi-l small { font-size:12px; }
.fi-o { font-size:12px; color:var(--gris); display:flex; align-items:center; gap:5px; }
.fi-aut { width:24px; height:8px; border-radius:2px; border:1px solid #9a968f; display:inline-block; }
.fi-g { display:flex; gap:8px; }
.fi-g button { width:32px; height:32px; border-radius:50%; border:1px solid #c9cad2; display:inline-flex; align-items:center; justify-content:center; }
.fi-g button[aria-pressed="true"] { background:#e2e5eb; }
`;

const DONNEES = {
  D: D.map((p) => ({ id: p.id, lib: p.lib, dit: p.dit, court: p.court, seg: p.seg, j: p.j || null, v: p.v, d: p.d, nat: p.nat, ibu: p.ibu, ibuNat: p.ibuNat || null, solde: p.solde, po: p.po, mes: mesDe(p) })),
  FAM, NOMF, T, BA, BANDE, AV, INC, BEST, RANG, R, JOURS, IBU0, IBUMAX, IBUSC, A2: APRES2,
  SEG: [[0, 46], [46, 61], [61, 80], [80, 100]],
};

const CLIENT = String.raw`
var $=function(s,r){return (r||document).querySelector(s)}, $$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};
var D=DATA.D, FAM=DATA.FAM, T=DATA.T, BA=DATA.BA, BANDE=DATA.BANDE, AV=DATA.AV, INC=DATA.INC, BEST=DATA.BEST, R=DATA.R, SEG=DATA.SEG, NR=R.length-1, ABS=false, JOUR=D[BEST].j;
function fr(x,d){ d=d==null?0:d; return (x<0?'−':'')+Math.abs(x).toFixed(d).replace('.',','); }
function sg(x){ return (x>=0?'+':'−')+fr(Math.abs(x)); }
function ti(p){ return p.nat==='simule'?'~':'≈'; }
function idx(r,j){ var id=R[r]; if(id==='dryActive'||id==='dryPost') id+='|'+j; for(var k=0;k<D.length;k++) if(D[k].id===id) return k; return -1; }
function rDe(i){ var id=D[i].id.split('|')[0]; return R.indexOf(id); }
function x(r){ var s=r<13?0:r===13?1:r===14?2:3, a=SEG[s][0], b=SEG[s][1]; if(s>0) return (a+b)/2; return a+(b-a)*(0.04+0.92*r/12); }
var frise=$('.frise'), rail=$('.rail'), loupe=$('.loupe'), cur=rDe(BEST);
/* le pouce et la loupe */
function graduations(){ $$('.cran',rail).forEach(function(c){c.remove();});
  if(!frise.classList.contains('touche')) return;
  for(var k=0;k<=NR;k++){ var c=document.createElement('i'); c.className='cran'; c.style.left=x(k)+'%'; rail.appendChild(c); }
  loupe.innerHTML=''; var w=loupe.clientWidth, pas=64;
  for(var k2=cur-2;k2<=cur+2;k2++){ if(k2<0||k2>NR) continue; var p=D[idx(k2,JOUR)], s=document.createElement('span'); s.textContent=k2<13?p.court:k2===13?'WP':k2===14?'actif':'après'; if(k2===cur) s.className='ici'; s.style.left=(w/2+(k2-cur)*pas)+'px'; loupe.appendChild(s); } }
function profil(){ var h=''; for(var k=0;k<=NR;k++){ var p=D[idx(k,JOUR)], ht=Math.max(2,Math.min(38,p.v.floral/26*38)), tr=p.ibu!=null&&DATA.IBU0+p.ibu>DATA.IBUMAX; h+='<i class="'+(tr?'trop ':'')+(p.nat!=='simule'?'ip':'')+'" style="left:'+x(k)+'%;height:'+ht+'px"></i>'; }
  SEG.forEach(function(s){ h+='<span class="seg-l" style="left:'+(s[0]+0.5)+'%;width:'+(s[1]-s[0]-1)+'%"></span>'; });
  h+='<span class="epingle" style="left:'+x(rDe(BEST))+'%">★</span>'; $('.b4-prof').innerHTML=h; }
function ligne(i, rang, cls){ var p=D[i], t=ti(p), a2=D[DATA.A2], nom=p.seg===2?'actif':p.seg===3?'après':p.lib, h='<div class="b4-r '+cls+'" data-i="'+i+'"><span class="b4-m">'+(rang?'<b class="b4-k num">'+rang+'</b>':'<i class="b4-k0"></i>')+nom+'</span>';
  var tot=0; FAM.forEach(function(f){ if(INC.indexOf(f)<0 && p.d[f]>0) tot+=p.d[f]; });
  h+='<span class="b4-rb" role="img" aria-label="familles gagnées">'+FAM.filter(function(f){ return INC.indexOf(f)<0 && p.d[f]>0.5; }).map(function(f){ return '<i style="width:'+(p.d[f]/Math.max(tot,1)*Math.min(1,tot/110)*100)+'%;background:'+BA[f]+'"></i>'; }).join('')+'</span>';
  ['floral','resin'].forEach(function(f){ var sc=ABS?110:BANDE[f]*1.2, ref=Math.max(p.d[f],a2.d[f]);
    var z=ABS?0:Math.min(100,(BANDE[f]-AV[f])/sc*100);
    h+='<span class="b4-b" data-f="'+f+'"><i class="z" data-role="zone" style="width:'+Math.max(0,z)+'%"></i><i class="em" style="width:'+Math.min(100,ref/sc*100)+'%;background:'+BA[f]+'"></i><i class="x" style="width:'+Math.min(100,p.d[f]/sc*100)+'%;background:'+BA[f]+'"></i><em class="num" style="color:'+(p.v[f]>BANDE[f]?'#c2410c':T[f])+'">'+t+sg(p.d[f])+'</em></span>'; });
  h+='<span>'+IBUH[i]+'</span>';
  var m=p.mes; h+= m? '<span class="b4-mz" data-nature="mesure" data-source="'+m.src+'" aria-label="'+m.aria+'"><b>'+m.txt+'</b><small>'+m.src+'</small></span>' : '<span class="b4-mz jamais" aria-label="jamais mesuré à ce moment">?</span>';
  return h+'</div>'; }
function podium(i){ var rows=['dryActive|'+JOUR,'dryPost|'+JOUR,'wp','b10','b60'].map(function(id){ return D.findIndex(function(p){ return p.id===id; }); }), ici=rows.indexOf(i), h='';
  var liste=rows.map(function(k){ return {i:k, s:D[k].solde}; });
  if(ici<0) liste.push({i:i, s:D[i].solde, ajout:true});
  liste.sort(function(a,b){ return b.s-a.s; });
  var n=0; liste.forEach(function(o){ var cls=(o.i===BEST?'best ':'')+(o.i===i?'doigt ':'')+(o.ajout?'ajout':''); h+=ligne(o.i, o.ajout?'<i class="b4-dg" aria-label="ton moment"></i>':(o.i===BEST?'★':''), cls); if(o.ajout) n=n; });
  $('#b4-rows').innerHTML=h; }
function ecart(i){ var p=D[i], b=D[BEST], t=ti(p); if(i===BEST) return '';
  if(Math.abs(p.d.floral-b.d.floral)<0.5 && Math.abs(p.d.resin-b.d.resin)<0.5) return '<b>'+p.dit+'</b> contre ★ : sans gain '+t;
  var s='<b>'+p.dit+'</b> contre ★ : <span style="color:'+T.floral+'">floral '+t+sg(p.d.floral-b.d.floral)+'</span> · <span style="color:'+T.resin+'">résineux '+t+sg(p.d.resin-b.d.resin)+'</span>';
  if(p.ibu!=null && DATA.IBU0+p.ibu>DATA.IBUMAX) s+=' · <span class="alerte">trop amer</span>';
  return s; }
function pont(i){ var p=D[i]; return p.po? (p.seg===2? 'Pomona : agrumes ~'+sg(p.po.citrus) : 'après fermentation, la levure ne change rien') : 'à chaud, la levure ne change rien'; }
function poser(r){ cur=r; var i=idx(r,JOUR), p=D[i];
  rail.setAttribute('aria-valuenow',r); rail.setAttribute('aria-valuetext',p.lib);
  $('.pouce').style.left=x(r)+'%'; $('.pouce-l').textContent=p.lib.split(' · ').join(' ');
  $('.b4-j').classList.toggle('chaud', p.seg<2);
  $$('.b4-j [data-jour]').forEach(function(b){ b.setAttribute('aria-checked', String(+b.dataset.jour===JOUR)); });
  document.body.classList.toggle('hors-reponse', i!==BEST);
  $('#ecart').innerHTML=ecart(i); $('#b4-po').textContent=pont(i); podium(i); graduations(); }
function depuisX(cx){ var rr=rail.getBoundingClientRect(), pct=(cx-rr.left)/rr.width*100, best=0, bd=1e9;
  for(var k=0;k<=NR;k++){ var d=Math.abs(x(k)-pct); if(d<bd){bd=d;best=k;} } if(best!==cur) poser(best); }
rail.addEventListener('pointerdown',function(e){ rail.setPointerCapture(e.pointerId); frise.classList.add('touche'); depuisX(e.clientX); graduations(); });
rail.addEventListener('pointermove',function(e){ if(e.buttons) depuisX(e.clientX); });
rail.addEventListener('pointerup',function(){ frise.classList.remove('touche'); graduations(); });
rail.addEventListener('pointercancel',function(){ frise.classList.remove('touche'); graduations(); });
rail.addEventListener('keydown',function(e){ if(e.key==='ArrowRight'){ e.preventDefault(); poser(Math.min(NR,cur+1)); } if(e.key==='ArrowLeft'){ e.preventDefault(); poser(Math.max(0,cur-1)); } });
$$('.b4-j [data-jour]').forEach(function(b){ b.addEventListener('click',function(){ JOUR=+b.dataset.jour; if(cur<14) cur=14; profil(); poser(cur); }); });
$$('[data-e]').forEach(function(b){ b.addEventListener('click',function(){ $$('[data-e]').forEach(function(z){ z.setAttribute('aria-checked', String(z===b)); }); ABS=b.dataset.e==='absolu'; poser(cur); }); });
var lb=$('[data-role="legende-bouton"]'), lg=$('[data-role="legende"]');
function legende(o){ lg.hidden=!o; lb.setAttribute('aria-expanded', String(o)); }
lb.addEventListener('click',function(e){ e.stopPropagation(); legende(lg.hidden); });
function fiche(n){ fermer(); var f=$('[data-role="fiche"][data-pour="'+n+'"]'); if(f) f.hidden=false; }
function fermer(){ $$('[data-role="fiche"]').forEach(function(f){ f.hidden=true; }); }
$$('[data-role="fermer-fiche"]').forEach(function(b){ b.addEventListener('click',function(e){ e.stopPropagation(); fermer(); }); });
$$('[data-role="gout"] button').forEach(function(b){ b.addEventListener('click',function(e){ e.stopPropagation(); var on=b.getAttribute('aria-pressed')!=='true'; $$('button',b.parentNode).forEach(function(z){ z.setAttribute('aria-pressed','false'); }); b.setAttribute('aria-pressed', String(on)); }); });
document.addEventListener('keydown',function(e){ if(e.key==='Escape'){ legende(false); fermer(); } });
$$('[data-houblon]').forEach(function(c){ var n=c.getAttribute('data-houblon'), t=null, x0=0, y0=0, hv=null;
  c.addEventListener('contextmenu',function(e){ e.preventDefault(); });
  c.addEventListener('pointerdown',function(e){ if(e.pointerType==='mouse') return; x0=e.clientX; y0=e.clientY; clearTimeout(t); t=setTimeout(function(){ fiche(n); },550); });
  c.addEventListener('pointermove',function(e){ if(t && Math.hypot(e.clientX-x0,e.clientY-y0)>12){ clearTimeout(t); t=null; } });
  ['pointerup','pointercancel'].forEach(function(k){ c.addEventListener(k,function(){ clearTimeout(t); t=null; }); });
  c.addEventListener('pointerenter',function(e){ if(e.pointerType!=='mouse') return; clearTimeout(hv); hv=setTimeout(function(){ fiche(n); },800); });
  c.addEventListener('pointerleave',function(e){ if(e.pointerType==='mouse') clearTimeout(hv); }); });
profil();
var q=location.search.match(/moment=([^&]+)/), i0=q?D.findIndex(function(p){return p.id===decodeURIComponent(q[1]);}):BEST; if(i0<0) i0=BEST; if(D[i0].j) JOUR=D[i0].j; profil(); poser(rDe(i0));
if(/fiche/.test(location.search)) fiche('Idaho 7');
if(/legende/.test(location.search)) legende(true);
if(/absolu/.test(location.search)) $('[data-e="absolu"]').click();
`;
const IBUH = D.map(ibuJauge);

const CTX = `<p class="ctx" data-role="contexte"><span class="fixe">fixé</span><span data-contexte="houblon"><i class="pt" style="background:${COUL}" aria-hidden="true"></i><span class="hb" data-houblon="${NOM}">${NOM}</span> <span class="num" data-role="alpha" data-source="lot">α ${fr(alpha, 1)}%</span><span class="num pl">${fr(aMin, 1)}–${fr(aMax, 1)}</span> <span class="us" data-role="usage">mixte</span><span class="stk" role="img" aria-label="en stock : 20 g, il en faut 80">${ico.stock}</span></span><span data-contexte="dose">4 g/L</span><span data-contexte="levure">US-05</span><span data-contexte="base">Stout 16D</span></p>`;

const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Dryhopper b4 · passe 2 · le podium des moments</title>
<style>${CSS}</style></head>
<body data-concept="b4" data-passe="2">
${SYMBOLES}
<main class="ecran">
<header class="barre"><a class="retour" aria-label="Retour" href="${LEVURE_LIEN.split('levure-outil').join('dryhopper')}"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#16161a" stroke-width="1.5" aria-hidden="true"><path d="M9 2.5 4.5 7 9 11.5"/></svg></a><h1 class="titre">Quand ajouter Idaho 7 ?</h1></header>
${CTX}
${CORPS}
</main>
${FICHE}
<script>var DATA=${JSON.stringify(DONNEES)};
var IBUH=${JSON.stringify(IBUH)};
${CLIENT}</script>
</body></html>
`;
fs.mkdirSync(path.join(ici, 'b4'), { recursive: true });
fs.writeFileSync(path.join(ici, 'b4', 'etat.html'), html);
console.log('b4 passe 2 écrite · réponse', D[BEST].lib, '· podium', RANG.map((i) => D[i].id + ' ' + D[i].solde).join(' / '), '· sans gain', sansGain.join(','), '· Pomona actif 2 j', JSON.stringify(D[BEST].po));
