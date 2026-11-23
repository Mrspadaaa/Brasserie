// Lot 22 · r6j · « Les vraies valeurs d'abord » : Comparer, « Lequel pour ma stout : Cascade, Idaho 7 ou
// Galaxy ? ». Un seul facteur libre, la variété (D98). Choix portés : radar r2, base effet égal
// (agrumes), pas de porte, descripteurs B.
// Le parti : trois colonnes (la manière de w2), une par houblon. Sous chaque carte, les vraies valeurs
// du cône (huile, linalol, géraniol, myrcène, 4MMP) en barres de plage sourcées, chaque ligne rattachée
// à ses familles ; une lecture « à ta dose » les multiplie par la dose d'effet égal (calcul écrit).
// Puis le simulé (~), mêmes colonnes, en barres de l5b face à la 16D ; puis le radar r2, le panel OSU,
// et ce qui est mesuré en bière, à un toucher.
// Données : fils22-comparer/donnees/comparer-stout.json seulement (vérifié par r6e). Deux lectures
// annexes, citées par ce fichier lui-même (sources.composes) : les titres des sources et le lien
// composé → famille de prototypes/houblons-v4/data/composes-houblon.json (aucune valeur chiffrée).
// Opérations : enveloppes de plages publiées, produits de plages (dose × huile × part), interpolation
// linéaire de la grille simulée entre deux doses, mises à l'échelle. Rien d'autre.
// Usage : node generer.mjs → r6j/etat.html
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SYMB, ic, pic, JET, COURT, fr, esc, REPO } from '../../fils21-choisir/v1/socle.mjs';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const D = JSON.parse(fs.readFileSync(path.join(ICI, '../donnees/comparer-stout.json'), 'utf8'));
const CH = JSON.parse(fs.readFileSync(REPO + '/' + D.sources.composes, 'utf8'));

// ---------- les houblons, les couleurs, la base ----------
const NOMS = ['Cascade', 'Idaho 7', 'Galaxy'];
// Une couleur par houblon (D51), teintes franches et lointaines (D77) : Cascade et Galaxy gardent celles
// du lot 21 ; Idaho 7 passe du rouge (trop proche du bordeaux de Cascade) au bleu pétrole.
const COUL = { Cascade: '#781838', 'Idaho 7': '#17659a', Galaxy: '#681878' };
const H = Object.fromEntries(NOMS.map((n) => [n, D.houblons.find((h) => h.nom === n)]));
const EG = D.egalites.effetEgal.find((e) => e.famille === 'citrus');
const VOL = D.biere.recette.volumeL;
const DOSE = Object.fromEntries(NOMS.map((n) => [n, EG.doses[n]]));
const REF = EG.reference.nom;
const BANDE = Object.fromEntries(Object.entries(D.echelle.parFamille).map(([f, x]) => [f, x.bande]));
const DOM = Object.fromEntries(Object.entries(D.echelle.parFamille).map(([f, x]) => [f, x.domaine[1]]));
const AVANT = Object.fromEntries(Object.entries(D.biere.avant).map(([f, x]) => [f, x.centre]));
const FAMS = D.familles.map((f) => f.id);

// ---------- le simulé à la dose d'effet égal : interpolation linéaire de la grille ----------
const grilleK = (h) => h.grille.filter((g) => g.moment === EG.moment && g.jours === EG.jours && g.levure === EG.levure).sort((a, b) => a.dose_gL - b.dose_gL);
function profil(nom) {
  const g = grilleK(H[nom]), x = DOSE[nom];
  let i = g.findIndex((e) => e.dose_gL >= x); if (i < 0) i = g.length - 1;
  const b = g[i], a = g[Math.max(0, i - 1)];
  const t = b.dose_gL === a.dose_gL ? 0 : (x - a.dose_gL) / (b.dose_gL - a.dose_gL);
  const out = { entre: [a.dose_gL, b.dose_gL], confiance: b.confiance, drapeaux: b.drapeaux };
  for (const f of FAMS) {
    const A = a.apres[f], B = b.apres[f];
    const L = (k) => A[k] + (B[k] - A[k]) * t;
    const inconnu = A[4] === 'inconnu' && B[4] === 'inconnu' && L(1) === 0 && L(2) === 0;
    out[f] = { bas: L(0), c: L(1), haut: L(2), d: a.delta[f] + (b.delta[f] - a.delta[f]) * t, inconnu };
  }
  return out;
}
const P = Object.fromEntries(NOMS.map((n) => [n, profil(n)]));

// ---------- les vraies valeurs du cône : enveloppe des plages « variété » publiées ----------
const NSRC = { 'bm-cascade': 'Beer Maverick 2023', 'bm-galaxy': 'Beer Maverick 2023', 'bm-idaho-7': 'Beer Maverick 2023', 'hs-cas': 'Hopsteiner 2025' };
const srcCourt = (k) => NSRC[k] || k;
const srcTitre = (k) => (CH.sources[k] ? CH.sources[k].titre.split(/,/)[0] + (CH.sources[k].annee ? ' ' + CH.sources[k].annee : '') : k);
function enveloppe(bloc, { base } = {}) {
  if (!bloc || !bloc.valeurs) return { inconnu: true, raison: (bloc && bloc.raison) || 'non publié' };
  let vs = bloc.valeurs.filter((v) => v.portee === 'variété');
  if (base) vs = vs.filter((v) => v.base === base);
  if (!vs.length) return { inconnu: true, raison: 'non publié' };
  const lo = vs.map((v) => v.plage[0]), hi = vs.map((v) => v.plage[1]);
  return {
    min: lo.some((x) => x == null) ? null : Math.min(...lo),
    max: hi.some((x) => x == null) ? null : Math.max(...hi),
    src: [...new Set(vs.flatMap((v) => v.sources))],
    aConfirmer: vs.some((v) => v.aConfirmer),
  };
}
const LIENS = (c) => [...new Set(CH.familles.liens.filter((l) => l.compose === c).flatMap((l) => l.familles))];
const LIGNES = [
  { id: 'huile', nom: 'Huile', unite: ['mL/100 g', 'mL/hL'], fams: [], get: (h) => enveloppe(h.composes.huile) },
  { id: 'linalol', nom: 'Linalol', unite: ['', 'µL/L'], pctH: true, fams: ['floral', 'citrus'], get: (h) => enveloppe(h.composes.composes.linalol) },
  { id: 'geraniol', nom: 'Géraniol', unite: ['', 'µL/L'], pctH: true, fams: ['floral'], get: (h) => enveloppe(h.composes.composes.geraniol) },
  { id: 'myrcene', nom: 'Myrcène', unite: ['', 'µL/L'], pctH: true, fams: ['resin', 'green'], get: (h) => enveloppe(h.composes.composes.myrcene) },
  { id: '4MMP', nom: '4MMP', unite: ['µg/kg', 'ng/L'], fams: ['berries', 'tropical'], get: (h) => enveloppe(h.composes.composes['4MMP'], { base: 'hopsteiner-2024' }) },
];
for (const L of LIGNES) if (L.id !== 'huile') { const lf = LIENS(L.id); if (lf.length) L.fams = lf; }
const V = {};
for (const L of LIGNES) for (const n of NOMS) V[L.id + '|' + n] = L.get(H[n]);
// À ta dose (calculé) : charge = dose × huile × part. g/L × mL/100 g = mL/hL ; × % huile / 100 × 10 = µL/L ;
// thiols : µg/kg × g/L = ng/L. Produit de plages : bornes basses ensemble, bornes hautes ensemble.
function charge(L, n) {
  const v = V[L.id + '|' + n], d = DOSE[n];
  if (v.inconnu) return v;
  if (L.id === '4MMP') return { min: v.min == null ? null : v.min * d, max: v.max == null ? null : v.max * d, src: v.src, aConfirmer: v.aConfirmer };
  if (L.id === 'huile') return { min: v.min * d, max: v.max * d, src: v.src };
  const hu = V['huile|' + n];
  return { min: v.min == null ? null : (d * hu.min * v.min) / 10, max: v.max == null ? null : (d * hu.max * v.max) / 10, src: [...new Set([...v.src, ...hu.src])], aConfirmer: v.aConfirmer };
}
const C = {};
for (const L of LIGNES) for (const n of NOMS) C[L.id + '|' + n] = charge(L, n);

// ---------- formats ----------
const f1 = (x) => fr(x);
const plage = (v) => (v.inconnu ? 'inconnu' : v.min == null ? '<' + f1(v.max) : v.max == null ? '>' + f1(v.min) : f1(v.min) === f1(v.max) ? f1(v.min) : f1(v.min) + '–' + f1(v.max));
const pct = (x) => Math.max(0, Math.min(100, x));
const ALPHA = (n) => H[n].alpha;
const alphaFiches = (n) => { const s = ALPHA(n).sources; return [Math.min(...s.map((x) => x.min)), Math.max(...s.map((x) => x.max))]; };
const ROLE = { aromatique: 'aromatique', amerisant: 'amérisant', amérisant: 'amérisant', double: 'mixte' };

// ---------- les arômes du houblon : une bande, une part par famille, plus la part « autres » (option B) ----------
const B = D.descripteurs.B;
function parts(n) {
  const h = H[n];
  const fam = h.aromes.filter((a) => a.level > 0).map((a) => ({ f: a.family, n: a.mots.reduce((s, m) => s + m.mots.length, 0) || 1, level: a.level }));
  const tot = fam.reduce((s, x) => s + x.n, 0);
  const b = B.parts[n];
  const autres = b && b.visible ? b.partDessinee : 0;
  return { fam: fam.map((x) => ({ ...x, part: (x.n / tot) * (1 - autres) })), autres, mots: b ? b.concepts : [] };
}
function bandeAromes(n, { grand = false } = {}) {
  const p = parts(n);
  let s = `<span class="ba${grand ? ' grand' : ''}" role="img" aria-label="Arômes de ${esc(n)} dans ses fiches : ${p.fam.map((x) => COURT[x.f]).join(', ')}${p.autres ? ' ; autres mots : ' + p.mots.join(', ') : ''}">`;
  for (const x of p.fam) s += `<i class="ba-s${x.level > 1 ? ' marque' : ''}" style="flex:${x.part.toFixed(3)};background:${JET[x.f].base}"></i>`;
  if (p.autres) s += `<i class="ba-s autres" data-role="autres" data-houblon="${esc(n)}" data-part="${fr(p.autres, 2)}" aria-label="autres : ${esc(p.mots.join(', '))}" style="flex:${p.autres.toFixed(3)}"></i>`;
  return s + '</span>';
}
const pictosMarques = (n, z = 14) => H[n].aromes.filter((a) => a.level > 0).sort((a, b) => b.level - a.level || b.sources - a.sources).slice(0, 3).map((a) => pic(a.family, z)).join('');

// ---------- la carte du houblon (en tête de colonne) ----------
function carte(n, sel) {
  const A = ALPHA(n), [fmin, fmax] = alphaFiches(n);
  const lot = A.retenu.value, hors = lot < fmin || lot > fmax;
  const role = H[n].role.value, regle = /^règle/.test(H[n].role.source);
  const stockConnu = A.retenu.from === 'fiche de stock';
  const dose = DOSE[n], ref = n === REF;
  return `<div class="hc" data-houblon="${esc(n)}" data-couleur="${COUL[n]}" style="--hc:${COUL[n]}" aria-current="${sel}">
  <div class="hc-t"><button class="hc-b" type="button" aria-pressed="${sel}" aria-label="Houblon ${esc(n)} : mettre en avant"><i class="pt" aria-hidden="true"></i>${esc(n)}</button>${stockConnu ? `<span class="stk" role="img" aria-label="en stock (α de la fiche de stock)">${ic('stock', 14)}</span>` : ''}</div>
  <div class="hc-l"><span class="al" data-role="alpha" data-source="lot" data-houblon="${esc(n)}" data-nature="mesure" aria-label="α du lot : ${fr(lot, 1)} % (${A.retenu.from})${hors ? ', hors des plages de ses fiches ' + fr(fmin) + '–' + fr(fmax) + ' %' : ''}">α ${fr(lot, 1)}%${hors ? ic('diff', 12) : ''}</span><span class="us${regle ? ' deduit' : ''}" data-role="usage" data-usage="${role}" aria-label="${ROLE[role]}${regle ? ', déduit de l’α, à valider' : ', d’après le fournisseur'}">${ROLE[role]}</span></div>
  ${bandeAromes(n)}
  <div class="hc-d"><span class="pis">${pictosMarques(n)}</span><span class="dz" aria-label="dose ${ref ? 'de référence' : 'qui donne les mêmes agrumes'} : ${fr(dose, 1)} g/L, ${Math.round(dose * VOL)} g pour ${VOL} L"><b class="mono">${ref ? '' : '~'}${fr(dose, 1)}</b><small>g/L</small></span></div>
</div>`;
}

// ---------- une ligne de vraies valeurs : une cellule par houblon, même échelle ----------
function echelle(vals) {
  const xs = vals.flatMap((v) => (v.inconnu ? [] : [v.max != null ? v.max : v.min * 1.6]));
  return Math.max(...xs) * 1.04;
}
function cellule(v, n, mx, nature, suf = '') {
  if (v.inconnu) return `<div class="vc inc-c" data-serie="${esc(n)}"><i class="tr hach" aria-hidden="true"></i><span class="vt inc" data-inconnu="${esc(v.raison)}">inconnu</span></div>`;
  const lo = v.min == null ? 0 : (v.min / mx) * 100, hi = v.max == null ? 100 : (v.max / mx) * 100;
  const cls = (v.min == null ? ' ouv-g' : '') + (v.max == null ? ' ouv-d' : '') + (v.aConfirmer ? ' douteux' : '');
  const src = v.src.join(' ');
  const attrs = nature === 'mesure' ? `data-nature="mesure" data-source="${esc(src)}"` : `data-nature="calcule" data-source="${esc(src)}"`;
  const txt = (nature === 'mesure' || v.min == null || v.max == null ? '' : '≈') + plage(v) + suf + (v.aConfirmer ? '?' : '');
  return `<div class="vc" data-serie="${esc(n)}" style="--hc:${COUL[n]}"><i class="tr" aria-hidden="true"><i class="pl${cls}" style="left:${pct(lo).toFixed(1)}%;width:${Math.max(2.5, pct(hi) - pct(lo)).toFixed(1)}%"></i></i><span class="vt mono" ${attrs} aria-label="${esc(n)} : ${esc(txt)}, sources ${esc(v.src.map(srcCourt).join(', '))}${v.aConfirmer ? ', à confirmer' : ''}">${esc(txt)}</span></div>`;
}
function ligneValeurs(L) {
  const vc = NOMS.map((n) => V[L.id + '|' + n]), cc = NOMS.map((n) => C[L.id + '|' + n]);
  const mv = echelle(vc), mc = echelle(cc);
  const pics = L.fams.map((f) => pic(f, 16)).join('');
  return `<div class="vl" data-compose="${L.id}">
  <div class="vl-t">${pics ? `<span class="pis">${pics}</span>` : ''}<b>${L.nom}</b>${L.unite[0] ? `<small class="m-cone">${L.unite[0]}</small>` : ''}<small class="m-dose">${L.unite[1]}</small></div>
  <div class="cols m-cone">${NOMS.map((n, i) => cellule(vc[i], n, mv, 'mesure', L.pctH ? '%' : '')).join('')}</div>
  <div class="cols m-dose">${NOMS.map((n, i) => cellule(cc[i], n, mc, 'calcule')).join('')}</div>
</div>`;
}

// ---------- une ligne du simulé (barres de l5b) : ma stout avant, après, plage, zone de la 16D ----------
const SIMF = ['floral', 'herbal', 'earthy', 'tropical', 'berries', 'resin'];
function barreSim(f, n, mode) {
  const p = P[n][f], dom = mode === 'style' ? DOM[f] : 100, bd = BANDE[f];
  if (p.inconnu) return `<i class="tr hach" aria-hidden="true"></i>`;
  const X = (v) => pct((v / dom) * 100);
  const av = AVANT[f];
  const hors = p.c > bd[1];
  const deb = Math.min(X(av), X(p.c)), fin = Math.max(X(av), X(p.c));
  return `<i class="tr"><i class="zn" data-role="zone" style="left:${X(bd[0]).toFixed(1)}%;width:${(X(bd[1]) - X(bd[0])).toFixed(1)}%"></i><i class="wk" style="left:${X(p.bas).toFixed(1)}%;width:${Math.max(0.5, X(p.haut) - X(p.bas)).toFixed(1)}%"></i><i class="sb${hors ? ' hors' : ''}" style="left:${deb.toFixed(1)}%;width:${Math.max(1.5, fin - deb).toFixed(1)}%"></i><i class="av" style="left:${X(av).toFixed(1)}%"></i>${p.c > dom ? '<i class="dep" aria-hidden="true">›</i>' : ''}</i>`;
}
function ligneSim(f) {
  const dejaHors = AVANT[f] > BANDE[f][1];
  const cells = NOMS.map((n) => {
    const p = P[n][f];
    const lab = p.inconnu ? 'inconnu' : `~${fr(p.c, 0)} (plage ${fr(p.bas, 0)}–${fr(p.haut, 0)}), avant ${fr(AVANT[f], 0)}`;
    if (dejaHors) { const mxd = Math.max(...NOMS.map((k) => P[k][f].d)) * 1.15; return `<div class="sc" data-serie="${esc(n)}" style="--hc:${COUL[n]}" data-nature="simule" aria-label="${esc(n)}, ${COURT[f]} : ajoute ~${fr(p.d, 0)} à une stout déjà au-dessus de la 16D (avant ${fr(AVANT[f], 0)})"><i class="tr deja-t"><i class="sb hors" style="left:0;width:${((p.d / mxd) * 100).toFixed(1)}%"></i></i></div>`; }
    return `<div class="sc" data-serie="${esc(n)}" style="--hc:${COUL[n]}" data-nature="simule" aria-label="${esc(n)}, ${COURT[f]} : ${esc(lab)}"><span class="m-style">${barreSim(f, n, 'style')}</span><span class="m-abs">${barreSim(f, n, 'abs')}</span></div>`;
  }).join('');
  const att = D.style.zone[f].statut === 'attendue';
  return `<div class="sl${dejaHors ? ' deja' : ''}" data-famille-ligne="${f}"><span class="sl-t">${pic(f, 16)}<span class="sl-n"><span class="${att ? 'att' : ''}">${COURT[f]}</span>${dejaHors ? '<small class="hors-l">déjà hors</small>' : ''}</span></span><div class="cols">${cells}</div></div>`;
}

// ---------- le radar r2 : un seul houblon plein (celui qu'on met en avant), les autres en contour ----------
const AXES = ['citrus', 'tropical', 'melon', 'stoneFruit', 'pomeFruit', 'berries', 'floral', 'green', 'herbal', 'spice', 'earthy', 'resin'];
const RW = 360, RH = 318, CX = 180, CY = 158, R = 112;
const ang = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / AXES.length;
const pt = (i, r) => [CX + r * Math.cos(ang(i)), CY + r * Math.sin(ang(i))];
const pts = (rs) => rs.map((r, i) => pt(i, r).map((x) => x.toFixed(1)).join(',')).join(' ');
const norm = (f, v, mode) => Math.min(1.08, Math.max(0, v / (mode === 'style' ? DOM[f] : 100)));
function radar() {
  let s = `<svg class="radar" data-radar data-objet="comparer" data-axes="${AXES.join(',')}" viewBox="0 0 ${RW} ${RH}" width="100%" role="img" aria-label="Radar du simulé : ta stout après chaque houblon, à agrumes égaux ; le houblon mis en avant plein, avec sa plage ; les autres en contour ; zone pâle : la 16D">`;
  s += '<defs><pattern id="hach" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="#fff"/><line x1="0" y1="0" x2="0" y2="5" stroke="#d3cec4" stroke-width="2"/></pattern></defs>';
  // anneaux et rayons
  for (const k of [1 / 3, 2 / 3, 1]) s += `<polygon class="ann" points="${pts(AXES.map(() => R * k))}"/>`;
  AXES.forEach((f, i) => { const [x, y] = pt(i, R); s += `<line class="ray" x1="${CX}" y1="${CY}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>`; });
  // zone du style, par lecture
  for (const m of ['style', 'abs']) s += `<polygon class="zone m-${m}" data-role="zone" points="${pts(AXES.map((f) => R * norm(f, BANDE[f][1], m)))}"/>`;
  // ma stout avant
  for (const m of ['style', 'abs']) s += `<polygon class="avant m-${m}" points="${pts(AXES.map((f) => R * norm(f, AVANT[f], m)))}"/>`;
  // un houblon : plage (bande pâle entre bas et haut), surface, contour ; inconnu hachuré
  for (const n of NOMS) {
    const p = P[n];
    const inc = AXES.filter((f) => p[f].inconnu);
    const vals = AXES.map((f) => Math.round(norm(f, p[f].c, 'style') * 100));
    s += `<g class="serie" data-serie="${esc(n)}" data-valeurs="${vals.join(',')}" data-inconnu="${inc.join(',')}" style="--hc:${COUL[n]}">`;
    for (const m of ['style', 'abs']) {
      const c = AXES.map((f) => R * norm(f, p[f].c, m));
      s += `<polygon class="ct m-${m}" points="${pts(c)}"/>`;
      const hi = AXES.map((f) => R * norm(f, p[f].haut, m)), lo = AXES.map((f) => R * norm(f, p[f].bas, m));
      const path = (rs) => 'M' + rs.map((r, i) => pt(i, r).map((x) => x.toFixed(1)).join(',')).join('L') + 'Z';
      s += `<path class="pg m-${m}" fill-rule="evenodd" d="${path(hi)} ${path(lo)}"/>`;
      AXES.forEach((f, i) => { if (p[f].c > (m === 'style' ? DOM[f] : 100)) { const [x, y] = pt(i, R * 1.08); s += `<circle class="dep m-${m}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4"/>`; } });
    }
    for (const f of inc) { const i = AXES.indexOf(f); const a = pt(i - 0.5, R), b = pt(i + 0.5, R); s += `<path class="hz" d="M${CX},${CY}L${a[0].toFixed(1)},${a[1].toFixed(1)}L${b[0].toFixed(1)},${b[1].toFixed(1)}Z"/>`; }
    s += '</g>';
  }
  // étiquettes : nom court, « ? » si inconnu pour le houblon en avant (géré en CSS par série)
  AXES.forEach((f, i) => {
    const [x, y] = pt(i, R + 20);
    const anc = Math.abs(x - CX) < 8 ? 'middle' : x > CX ? 'start' : 'end';
    const att = D.style.zone[f].statut === 'attendue';
    s += `<text class="lab${att ? ' att' : ''}" x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="${anc}">${COURT[f]}${NOMS.map((n) => (P[n][f].inconnu ? `<tspan class="q q-${n.replace(/\W/g, '')}">?</tspan>` : '')).join('')}</text>`;
  });
  return s + '</svg>';
}

// ---------- le panel OSU (Cascade, mesuré) : agrumes et herbacé/thé selon la dose ----------
function osu() {
  const O = D.panelOSU, W = 230, Hh = 118, x0 = 26, y0 = 98, xw = 196, yh = 86;
  const X = (d) => x0 + (d / 16) * xw, Y = (v) => y0 - (v / 15) * yh;
  const ligne = (vals) => O.doses.map((d, i) => X(d).toFixed(1) + ',' + Y(vals[i]).toFixed(1)).join(' ');
  let s = `<svg class="osu-g" viewBox="0 0 ${W} ${Hh}" width="${W}" height="${Hh}" role="img" aria-label="Panel OSU, Cascade : agrumes et herbacé/thé de 0 à 16 g/L, échelle 0–15">`;
  s += `<rect class="oz" x="${X(O.zone[0])}" y="${y0 - yh}" width="${X(O.zone[1]) - X(O.zone[0])}" height="${yh}"/>`;
  s += `<line class="ax" x1="${x0}" y1="${y0}" x2="${x0 + xw}" y2="${y0}"/>`;
  for (const n of NOMS) s += `<line class="od" x1="${X(DOSE[n]).toFixed(1)}" y1="${y0 - yh}" x2="${X(DOSE[n]).toFixed(1)}" y2="${y0}" style="stroke:${COUL[n]}"/>`;
  s += `<polyline class="o-c" points="${ligne(O.agrumes)}"/><polyline class="o-h" points="${ligne(O.herbaceThe)}"/>`;
  O.doses.forEach((d, i) => { s += `<circle class="o-c" cx="${X(d).toFixed(1)}" cy="${Y(O.agrumes[i]).toFixed(1)}" r="2.6"/><circle class="o-h" cx="${X(d).toFixed(1)}" cy="${Y(O.herbaceThe[i]).toFixed(1)}" r="2.6"/>`; });
  for (const d of [0, 4, 8, 16]) s += `<text class="ot" x="${X(d)}" y="${y0 + 13}" text-anchor="middle">${d}</text>`;
  return s + '</svg>';
}

// ---------- ce qui est mesuré en bière (un toucher) ----------
function enBiere() {
  const c = H.Cascade.composes.mesuresEnBiere;
  const kl = c.find((m) => m.id === 'kishimoto-linalol'), kg = c.find((m) => m.id === 'kishimoto-geraniol'), l3 = c.find((m) => m.id === 'lafontaine-3mh'), l4 = c.find((m) => m.id === 'lafontaine-4mmp');
  const e03 = H['Idaho 7'].panels.find((p) => p.id === 'E03'), li7 = e03.mesures.find((m) => m.compose === 'linalol' && /idaho/i.test(m.variete));
  const gp = H.Galaxy.composes.panel[0];
  const M = (txt, src) => `<span class="vm mono" data-nature="mesure" data-source="${esc(src)}">${txt}</span>`;
  const ex = (x) => String(+x.toFixed(3)).replace('.', ',');
  const rg = (m) => (m.plage[0] === m.plage[1] ? ex(m.plage[0]) : ex(m.plage[0]) + '–' + ex(m.plage[1]));
  const pt_ = (n) => `<i class="pt" style="--hc:${COUL[n]}" aria-hidden="true"></i>`;
  return `<ul class="eb">
  <li>${pt_('Cascade')}<b>Cascade</b> ${pic('floral', 14)} linalol ${M(rg(kl) + ' µg/L', kl.sources.join(' '))} · géraniol ${M(rg(kg) + ' µg/L', kg.sources.join(' '))} <small>à ${ex(kl.doseGL)} g/L, moût refroidi · ${kl.sources.join(', ')} (Kishimoto 2008)</small></li>
  <li>${pt_('Cascade')}<b>Cascade</b> ${pic('tropical', 14)} 3MH ${M(rg(l3) + ' ng/L', l3.sources.join(' '))} · 4MMP ${M(rg(l4) + ' ng/L', l4.sources.join(' '))} <small>à ${ex(l3.doseGL)} g/L, 24 h · ${l3.sources.join(', ')} (Lafontaine 2019)</small></li>
  <li>${pt_('Idaho 7')}<b>Idaho 7</b> ${pic('floral', 14)} linalol ${M(ex(li7.valeur * 1000) + ' ± ' + ex(li7.ecart * 1000) + ' µg/L', 'E03')} <small>au pitch, dose non publiée · E03 (McCabe 2023) · <span class="averif">à vérifier</span></small></li>
  <li>${pt_('Galaxy')}<b>Galaxy</b> aucune mesure chiffrée en bière <small>· panel OSU à 4 g/L : près de « catty/sweaty » (${gp.sources.join(', ')})</small></li>
</ul>
<p class="petit gris">Doses et bières différentes : ces points ne se classent pas entre eux.</p>`;
}

// ---------- les fiches (appui long) : la fiche g1, courte ----------
const NIV = ['non décrit', 'cité', 'marqué'];
function radarFiche(n) {
  const r = 64, c = 80;
  const pf = (i, k) => [c + k * r * Math.cos(ang(i)), c + k * r * Math.sin(ang(i))];
  const lv = Object.fromEntries(H[n].aromes.map((a) => [a.family, a.level]));
  let s = `<svg class="rf" data-radar data-objet="fiche" data-axes="${AXES.join(',')}" viewBox="0 0 160 160" width="150" height="150" role="img" aria-label="Silhouette de ${esc(n)} selon ses fiches ; hachuré : non décrit">`;
  for (const k of [0.5, 1]) s += `<polygon class="ann" points="${AXES.map((f, i) => pf(i, k).map((x) => x.toFixed(1)).join(',')).join(' ')}"/>`;
  AXES.forEach((f, i) => { if (!lv[f]) { const a = pf(i - 0.5, 1), b = pf(i + 0.5, 1); s += `<path class="hz" d="M${c},${c}L${a[0].toFixed(1)},${a[1].toFixed(1)}L${b[0].toFixed(1)},${b[1].toFixed(1)}Z"/>`; } });
  s += `<polygon class="rf-p" style="--hc:${COUL[n]}" points="${AXES.map((f, i) => pf(i, (lv[f] || 0) / 2).map((x) => x.toFixed(1)).join(',')).join(' ')}"/>`;
  AXES.forEach((f, i) => { const [x, y] = pf(i, 1.18); s += `<use href="#p-${f}" x="${(x - 7).toFixed(1)}" y="${(y - 7).toFixed(1)}" width="14" height="14"/>`; });
  return s + '</svg>';
}
function fiche(n) {
  const h = H[n], A = ALPHA(n), [fmin, fmax] = alphaFiches(n);
  const decrits = h.aromes.filter((a) => a.level > 0).sort((a, b) => b.level - a.level);
  const nd = h.aromes.length - decrits.length;
  const p = parts(n);
  const role = h.role.value, regle = /^règle/.test(h.role.source);
  return `<section class="fiche" role="dialog" aria-modal="false" aria-label="Fiche de ${esc(n)}" data-role="fiche" data-pour="${esc(n)}" style="--hc:${COUL[n]}" hidden>
  <header class="f-h"><i class="pt" aria-hidden="true"></i><h3>${esc(n)}</h3><span class="us${regle ? ' deduit' : ''}">${ROLE[role]}</span><button class="f-x" type="button" data-role="fermer-fiche" aria-label="Fermer la fiche">${ic('x', 18)}</button></header>
  <p class="f-a" data-role="fiche-alpha"><span class="mono">α ${fr(A.retenu.value, 1)} %</span> <small>lot</small> · ${ic('livre', 14)}<span class="mono">${fr(fmin)}–${fr(fmax)} %</span> <small>${A.sources.map((s) => s.source + ' ' + (s.annee || '')).join(', ')}</small></p>
  <div class="f-ar">${bandeAromes(n, { grand: true })}${p.autres ? `<span class="f-aut"><i class="sw" aria-hidden="true"></i>autres : ${esc(p.mots.join(', '))} <small>${Math.round(p.autres * 100)} %</small></span>` : ''}</div>
  <div class="f-c">${radarFiche(n)}<ul class="f-l">${decrits.map((a) => `<li data-role="fiche-arome">${pic(a.family, 14)}<b style="color:${JET[a.family].texte}">${COURT[a.family]}</b> <small>${a.sources}/${a.of} fiche${a.of > 1 ? 's' : ''}</small><span class="f-m">${esc([...new Set(a.mots.flatMap((m) => m.mots.map((w) => w.toLowerCase())))].slice(0, 2).join(', '))}</span></li>`).join('')}<li class="f-nd">${nd} non décrites <small>(inconnu, pas zéro)</small></li></ul></div>
  <div class="f-g" role="group" data-role="gout" aria-label="Mon goût pour ${esc(n)}"><button type="button" aria-pressed="false" aria-label="Aimer ${esc(n)}">${ic('coeur', 16)}</button><button type="button" aria-pressed="false" aria-label="Exclure ${esc(n)}">${ic('ban', 16)}</button></div>
</section>`;
}

// ---------- la réponse en une phrase, calculée ----------
const argmax = (f, sens = 1) => NOMS.slice().sort((a, b) => sens * (P[b][f].d - P[a][f].d))[0];
const plusFloral = argmax('floral'), plusResine = argmax('resin'), moinsResine = argmax('resin', -1);
const reponse = `<p class="rep" data-nature="simule">${pic('floral', 16)}<span>Plus floral, <b style="color:${COUL[plusFloral]}">${plusFloral}</b>${plusFloral === plusResine ? ', mais plus résineux' : ', moins résineux : ' + moinsResine} <span class="tilde">~</span></span></p>`;

// ---------- la légende (derrière « ? ») ----------
const legende = `<div class="leg" id="legende" data-role="legende" role="dialog" aria-label="Légende" hidden>
  <header><b>Lire la page</b><button type="button" class="leg-x" data-role="legende-fermer" aria-label="Fermer la légende">${ic('x', 16)}</button></header>
  <ul>
    <li><b>Agrumes égaux</b> : chaque houblon à la dose qui donne le même gain d’agrumes que ${REF} ${fr(EG.reference.dose_gL)} g/L, après fermentation, ${EG.jours} j, US‑05. La dose est un résultat (~, simulé), pas un réglage ; elle est interpolée entre deux doses de la grille.</li>
    <li><b>Vraies valeurs</b> : plage publiée par les fiches (de la plus petite à la plus grande valeur) ; thiols sur une seule base (Schmidt 2024, H11). % huile = aire GC, pas un volume exact.</li>
    <li><b>À ta dose</b>, calculé (≈) : dose × huile × part. g/L × mL/100 g = mL/hL ; µg/kg × g/L = ng/L. Ce qui entre dans la cuve, pas ce qui reste en bière.</li>
    <li><b>~ Simulé</b> : moteur profil-simulé ; trait fin = plage, barre = avant → après, trait noir = ta stout avant, pâle = la 16D, orangé = au-dessus de la 16D, hachuré = inconnu (jamais zéro).</li>
    <li><b>Part « autres »</b> (gris) : mots des fiches sans famille. Génériques écartés (${B.generiques.slice(0, 4).join(', ')}…), seuil ${Math.round(B.seuil * 100)} %, plafond ${Math.round(B.plafond * 100)} % : <em>${B.aCorriger}</em>.</li>
    <li><b>mixte</b> en gris : déduit de l’α (règle v1, à valider).</li>
  </ul>
</div>`;

// ---------- la page ----------
const sel0 = REF;
const corps = `
<header class="barre"><a class="retour" href="#" aria-label="Retour">${ic('chev-l', 20)}</a><h1>Lequel pour ma stout ?</h1><button class="leg-b" type="button" data-role="legende-bouton" aria-expanded="false" aria-controls="legende" aria-label="Légende">${ic('aide', 18)}</button></header>
<p class="ctx" data-role="contexte"><span data-contexte="biere" aria-label="Stout export 16D">16D</span><span data-contexte="base">${pic('citrus', 14)}agrumes égaux</span><span data-contexte="moment">après fermentation, ${EG.jours} j</span><span data-contexte="levure">US-05</span></p>
<div class="hcs cols" data-libre="houblon" role="group" aria-label="Houblons comparés">${NOMS.map((n) => carte(n, n === sel0)).join('')}</div>
${reponse}
<section class="bloc" data-acquis="chimie" aria-label="Vraies valeurs du cône">
  <div class="b-t">${ic('flacon', 14)}<b class="m-cone">Mesuré</b><b class="m-dose">Calculé</b><span class="seg" role="radiogroup" aria-label="Lecture des valeurs" data-lecture><button type="button" role="radio" data-v="cone" aria-checked="true" aria-label="Lecture : par 100 g de cône">cône</button><button type="button" role="radio" data-v="dose" aria-checked="false" aria-label="Lecture : à ta dose">dose</button></span></div>
  ${LIGNES.map(ligneValeurs).join('')}
</section>
<section class="bloc" aria-label="Ta stout après, simulé">
  <div class="b-t">${ic('simul', 14)}<b>Simulé</b><span class="seg lentille" role="radiogroup" aria-label="Lecture" data-lecture><button type="button" role="radio" data-e="style" aria-checked="true">Au style</button><button type="button" role="radio" data-e="absolu" aria-checked="false">Absolu</button></span></div>
  ${SIMF.map(ligneSim).join('')}
</section>
<section class="bloc" data-acquis="radar" data-sel="${sel0}" aria-label="Radar">
  ${radar()}
</section>
<section class="bloc osu" data-acquis="osu" data-nature="mesure" data-source="${D.panelOSU.sources.join(' ')}">
  <div class="b-t">${ic('panel', 14)}<b>Goûté : panel OSU</b><small>Cascade seulement</small></div>
  <div class="osu-c">${osu()}<p class="osu-x"><span class="lg-c">agrumes</span> plafonnent à 8 g/L ; <span class="lg-h">herbacé/thé</span> monte jusqu’à 16. Échelle 0–15 · ${D.panelOSU.sources.join(', ')} (Lafontaine 2018).<br><small>Traits : la dose de chaque houblon. Idaho 7, Galaxy : courbe non mesurée.</small></p></div>
</section>
<button class="tch" type="button" aria-expanded="false" aria-controls="vb">${ic('flacon', 14)}En bière, mesuré${ic('chev-r', 14)}</button>
<section class="bloc" id="vb" data-acquis="valeurs" hidden>
  ${enBiere()}
  <p class="srcs petit gris">Sources du cône : ${[...new Set([...new Set(Object.values(V).flatMap((v) => v.src || []))].map((k) => `${srcCourt(k)}${/^H\d/.test(k) ? ' (' + esc(srcTitre(k)) + ')' : ''}`))].join(' ; ')}.</p>
</section>
<nav class="pont" aria-label="Suite"><a href="#" data-role="pont">Doser <b class="pont-n">${sel0}</b> dans Dryhopper ${ic('chev-r', 14)}</a></nav>
${legende}
${NOMS.map(fiche).join('')}
`;

const CSS = `
:root { --encre:#1f1c19; --gris:#5c5852; --trait:#e4e0d9; --pale:#f4f2ee; --acc:#c2410c; --sans:'Source Sans 3', system-ui, sans-serif; --mono:'IBM Plex Mono', ui-monospace, monospace; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font: 400 14px/1.3 var(--sans); color: var(--encre); background: #fff; }
.ecran { max-width: 430px; margin: 0 auto; padding: 4px 10px 32px; display: flex; flex-direction: column; gap: 8px; }
.mono { font-family: var(--mono); font-variant-numeric: tabular-nums; }
.ic { flex: none; vertical-align: middle; }
.pi { flex: none; }
.pis { display: inline-flex; gap: 1px; align-items: center; }
small { font-size: 12px; color: var(--gris); font-weight: 400; }
.petit { font-size: 12px; } .gris { color: var(--gris); }
button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; }
.barre { display: flex; align-items: center; gap: 6px; height: 40px; }
.barre h1 { flex: 1; font-size: 17px; font-weight: 700; }
.retour { color: var(--encre); display: inline-flex; width: 24px; height: 24px; align-items: center; }
.leg-b { width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; color: var(--gris); border-radius: 50%; }
.ctx { display: flex; flex-wrap: wrap; gap: 4px; }
.ctx span { display: inline-flex; align-items: center; gap: 3px; height: 22px; padding: 0 8px; border-radius: 11px; background: var(--pale); font-size: 12px; font-weight: 600; color: var(--encre); }
.cols { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
/* carte du houblon */
.hc { border-radius: 8px; box-shadow: inset 0 0 0 1px var(--trait); padding: 6px 7px 7px; display: flex; flex-direction: column; gap: 5px; -webkit-touch-callout: none; user-select: none; -webkit-user-select: none; touch-action: manipulation; cursor: pointer; }
.hc[aria-current="true"] { box-shadow: inset 0 0 0 2px var(--hc); }
.hc-t { display: flex; align-items: center; gap: 4px; }
.hc-b { flex: 1; display: inline-flex; align-items: center; gap: 5px; min-height: 24px; font-weight: 700; font-size: 15px; text-align: left; color: var(--hc); }
.pt { display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: var(--hc); flex: none; }
.stk { color: var(--gris); display: inline-flex; }
.hc-l { display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap; }
.al { font: 600 13px var(--mono); display: inline-flex; align-items: center; gap: 1px; }
.us { font-size: 13px; font-weight: 600; }
.us.deduit { color: var(--gris); font-weight: 400; text-decoration: underline dotted; text-underline-offset: 3px; }
.ba { display: flex; height: 8px; gap: 1px; width: 100%; }
.ba.grand { height: 10px; }
.ba-s { display: block; height: 100%; border-radius: 2px; opacity: .72; }
.ba-s.marque { opacity: 1; }
.ba-s.autres { background: #9a968f; opacity: 1; }
.hc-d { display: flex; align-items: center; justify-content: space-between; gap: 4px; }
.dz { display: inline-flex; align-items: baseline; gap: 2px; }
.dz b { font-size: 16px; font-weight: 600; }
.rep { display: flex; align-items: center; gap: 6px; font-size: 14px; padding: 2px 2px; }
.tilde { font: 600 13px var(--mono); color: var(--gris); }
/* blocs */
.bloc { display: flex; flex-direction: column; gap: 6px; padding-top: 8px; margin-top: 4px; border-top: 1px solid var(--trait); }
.b-t { display: flex; align-items: center; gap: 5px; font-size: 14px; min-height: 28px; }
.b-t .seg { margin-left: auto; }
.seg { display: inline-flex; background: var(--pale); border-radius: 999px; padding: 2px; }
.seg button { height: 24px; padding: 0 9px; border-radius: 999px; font-size: 12px; font-weight: 600; color: var(--gris); }
.seg button[aria-checked="true"] { background: var(--encre); color: #fff; }
/* lecture des valeurs */
body.v-dose .m-cone, body:not(.v-dose) .m-dose { display: none !important; }
body.e-abs .m-style, body:not(.e-abs) .m-abs { display: none !important; }
.vl { display: flex; flex-direction: column; gap: 3px; padding-bottom: 5px; }
.vl-t { display: flex; align-items: center; gap: 5px; font-size: 13px; }
.vl-t b { font-weight: 600; }
.vc, .sc { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.tr { position: relative; display: block; height: 8px; border-radius: 2px; background: var(--pale); overflow: visible; }
.tr.hach { background: repeating-linear-gradient(135deg, #fff 0 3px, #dcd8d0 3px 5px); }
.pl { position: absolute; top: 0; bottom: 0; background: var(--hc); border-radius: 2px; }
.pl.ouv-d { border-radius: 2px 0 0 2px; }
.pl.douteux { opacity: .38; }
.vt { font-size: 12px; font-weight: 600; color: var(--hc); white-space: nowrap; }
.vt.inc { font: 400 12px var(--sans); color: var(--gris); }
.hcs .hc:not([aria-current="true"]) { }
/* simulé, barres de l5b */
.sl { display: grid; grid-template-columns: 74px 1fr; align-items: center; gap: 6px; min-height: 28px; }
.sl-t { display: inline-flex; align-items: center; gap: 3px; font-size: 12px; white-space: nowrap; }
.sl-t .att { font-weight: 700; }
.sl .cols { gap: 6px; }
.sc .tr { height: 10px; }
.zn { position: absolute; top: 0; bottom: 0; background: #e9e4d6; border-radius: 2px; }
.wk { position: absolute; top: 4px; height: 2px; background: var(--hc); opacity: .35; }
.sb { position: absolute; top: 1px; bottom: 1px; background: var(--hc); border-radius: 2px; }
.sb.hors { box-shadow: inset -3px 0 0 var(--acc); }
.av { position: absolute; top: -2px; bottom: -2px; width: 2px; margin-left: -1px; background: var(--encre); }
.dep { position: absolute; right: -7px; top: -5px; font: 700 13px var(--sans); color: var(--acc); font-style: normal; }
.hors-t { font-size: 12px; font-weight: 600; color: var(--hc); }
.sl-t small.hors-l { display: block; color: var(--acc); font-size: 12px; line-height: 1; }
.sl-t .sl-n { display: inline-flex; flex-direction: column; }
/* radar r2 */
.radar { display: block; max-width: 370px; margin: 0 auto; }
.radar .ann { fill: none; stroke: #e2ded6; stroke-width: 1; }
.radar .ray { stroke: #ebe7e0; stroke-width: 1; }
.radar .zone { fill: #efe9da; stroke: none; }
.radar .avant { fill: none; stroke: var(--encre); stroke-width: 1.5; }
.radar .serie .ct { fill: none; stroke: var(--hc); stroke-width: 3; stroke-linejoin: round; }
.radar .serie .pg, .radar .serie .hz { display: none; }
.radar .serie .pg { fill: var(--hc); fill-opacity: .10; }
.radar .serie .hz { fill: url(#hach); stroke: none; }
.radar .dep { fill: var(--acc); }
.radar .lab { font: 400 12px var(--sans); fill: var(--gris); }
.radar .lab.att { font-weight: 700; fill: var(--encre); }
.radar .q { display: none; }
${NOMS.map((n) => `[data-sel="${n}"] .serie[data-serie="${n}"] .ct { fill: var(--hc); fill-opacity: .28; }
[data-sel="${n}"] .serie[data-serie="${n}"] .pg:not(.m-x), [data-sel="${n}"] .serie[data-serie="${n}"] .hz { display: inline; }
body.e-abs [data-sel="${n}"] .serie[data-serie="${n}"] .pg.m-style, body:not(.e-abs) [data-sel="${n}"] .serie[data-serie="${n}"] .pg.m-abs { display: none; }
[data-sel="${n}"] .q-${n.replace(/\W/g, '')} { display: inline; }`).join('\n')}
/* OSU */
.osu-c { display: flex; gap: 8px; align-items: flex-start; }
.osu-g { flex: none; width: 180px; height: auto; }
.osu-g .oz { fill: #efe9da; } .osu-g .ax { stroke: #bdb8ae; }
.osu-g .od { stroke-width: 2; opacity: .8; }
.osu-g polyline { fill: none; stroke-width: 2; }
.osu-g .o-c { stroke: ${JET.citrus.texte}; fill: ${JET.citrus.texte}; } .osu-g polyline.o-c { fill: none; }
.osu-g .o-h { stroke: ${JET.herbal.texte}; fill: #fff; stroke-width: 1.6; } .osu-g polyline.o-h { fill: none; stroke-width: 2; }
.osu-g .ot { font: 400 11px var(--mono); fill: var(--gris); }
.osu-x { font-size: 12px; line-height: 1.3; }
.lg-c { color: ${JET.citrus.texte}; font-weight: 700; } .lg-h { color: ${JET.herbal.texte}; font-weight: 700; }
/* un toucher */
.tch { display: inline-flex; align-items: center; gap: 5px; align-self: flex-start; height: 28px; padding: 0 10px; border-radius: 14px; box-shadow: inset 0 0 0 1px var(--trait); font-size: 13px; font-weight: 600; }
.eb { list-style: none; display: flex; flex-direction: column; gap: 6px; font-size: 13px; }
.eb li { line-height: 1.35; }
.eb .pt { margin-right: 4px; vertical-align: 0; }
.vm { font-weight: 600; }
.averif { color: #8a5a00; font-weight: 600; }
.srcs { line-height: 1.35; }
/* pont */
.pont a { display: inline-flex; align-items: center; gap: 4px; height: 32px; padding: 0 12px; border-radius: 16px; background: var(--encre); color: #fff; text-decoration: none; font-size: 13px; font-weight: 600; }
/* légende */
.leg { position: fixed; left: 8px; right: 8px; top: 48px; max-width: 414px; margin: 0 auto; background: #fff; border-radius: 8px; box-shadow: 0 0 0 1px var(--trait), 0 8px 24px rgba(0,0,0,.18); padding: 10px 12px; z-index: 20; font-size: 13px; }
.leg header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.leg ul { list-style: none; display: flex; flex-direction: column; gap: 6px; }
/* fiche */
.fiche { position: fixed; left: 0; right: 0; bottom: 0; max-width: 430px; margin: 0 auto; background: #fff; border-radius: 8px 8px 0 0; box-shadow: 0 -8px 28px rgba(0,0,0,.22); padding: 10px 14px 16px; z-index: 30; display: flex; flex-direction: column; gap: 8px; }
.fiche[hidden], .leg[hidden], #vb[hidden] { display: none; }
.f-h { display: flex; align-items: center; gap: 6px; }
.f-h h3 { font-size: 18px; font-weight: 700; color: var(--hc); }
.f-x { margin-left: auto; width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; background: var(--pale); }
.f-a { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; font-size: 13px; }
.f-ar { display: flex; flex-direction: column; gap: 4px; }
.f-aut { display: inline-flex; align-items: center; gap: 5px; font-size: 13px; }
.f-aut .sw { width: 12px; height: 10px; border-radius: 2px; background: #9a968f; }
.f-c { display: flex; gap: 8px; align-items: flex-start; }
.rf { flex: none; }
.rf .ann { fill: none; stroke: #e2ded6; }
.rf .hz { fill: #fff; stroke: #d6d1c7; }
.rf-p { fill: var(--hc); fill-opacity: .22; stroke: var(--hc); stroke-width: 2; }
.f-l { list-style: none; display: flex; flex-direction: column; gap: 3px; font-size: 13px; }
.f-l li { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
.f-m { width: 100%; padding-left: 18px; color: var(--gris); font-size: 12px; }
.f-g { display: flex; gap: 6px; }
.f-g button { width: 32px; height: 28px; border-radius: 14px; box-shadow: inset 0 0 0 1px var(--trait); display: inline-flex; align-items: center; justify-content: center; color: var(--gris); }
.f-g button[aria-pressed="true"] { background: var(--encre); color: #fff; }
`;

const JS = `
(function(){
  var $=function(s,r){return (r||document).querySelector(s)}, $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
  // le houblon mis en avant : carte, radar r2 (plein), pont vers Dryhopper
  function choisir(n){
    $$('.hc').forEach(function(c){ var on=c.getAttribute('data-houblon')===n; c.setAttribute('aria-current', on); $('.hc-b',c).setAttribute('aria-pressed', on); });
    $('[data-acquis="radar"]').setAttribute('data-sel', n);
    $('.pont-n').textContent=n;
  }
  // lectures : 100 g / ta dose ; au style / absolu
  $$('[data-v]').forEach(function(b){ b.addEventListener('click', function(){ $$('[data-v]').forEach(function(x){x.setAttribute('aria-checked', x===b)}); document.body.classList.toggle('v-dose', b.getAttribute('data-v')==='dose'); }); });
  $$('[data-e]').forEach(function(b){ b.addEventListener('click', function(){ $$('[data-e]').forEach(function(x){x.setAttribute('aria-checked', x===b)}); document.body.classList.toggle('e-abs', b.getAttribute('data-e')==='absolu'); }); });
  // un toucher : ce qui est mesuré en bière
  $$('.tch').forEach(function(b){ b.addEventListener('click', function(){ var el=document.getElementById(b.getAttribute('aria-controls')); var o=el.hidden; el.hidden=!o; b.setAttribute('aria-expanded', o); }); });
  // la légende
  var lb=$('[data-role="legende-bouton"]'), lg=$('[data-role="legende"]');
  function legende(o){ lg.hidden=!o; lb.setAttribute('aria-expanded', o); }
  lb.addEventListener('click', function(e){ e.stopPropagation(); legende(lg.hidden); });
  $('[data-role="legende-fermer"]').addEventListener('click', function(){ legende(false); });
  // la fiche : appui long (touch) ou survol long (souris)
  var ouverte=null;
  function fiche(n){ fermer(); var f=$('[data-role="fiche"][data-pour="'+n+'"]'); if(!f) return; f.hidden=false; ouverte=f; }
  function fermer(){ $$('[data-role="fiche"]').forEach(function(f){f.hidden=true}); ouverte=null; }
  $$('[data-role="fermer-fiche"]').forEach(function(b){ b.addEventListener('click', function(e){ e.stopPropagation(); fermer(); }); });
  $$('[data-role="gout"] button').forEach(function(b){ b.addEventListener('click', function(e){ e.stopPropagation(); var on=b.getAttribute('aria-pressed')!=='true'; $$('button', b.parentNode).forEach(function(x){x.setAttribute('aria-pressed','false')}); b.setAttribute('aria-pressed', on); }); });
  document.addEventListener('keydown', function(e){ if(e.key==='Escape'){ legende(false); fermer(); } });
  $$('.hc').forEach(function(c){
    var n=c.getAttribute('data-houblon'), t=null, x0=0, y0=0, long=false, hv=null;
    c.addEventListener('contextmenu', function(e){ e.preventDefault(); });
    c.addEventListener('pointerdown', function(e){ if(e.pointerType==='mouse') return; long=false; x0=e.clientX; y0=e.clientY; clearTimeout(t); t=setTimeout(function(){ long=true; fiche(n); }, 550); });
    c.addEventListener('pointermove', function(e){ if(t && Math.hypot(e.clientX-x0, e.clientY-y0)>12){ clearTimeout(t); t=null; } });
    ['pointerup','pointercancel'].forEach(function(k){ c.addEventListener(k, function(){ clearTimeout(t); t=null; }); });
    c.addEventListener('pointerenter', function(e){ if(e.pointerType!=='mouse') return; clearTimeout(hv); hv=setTimeout(function(){ fiche(n); }, 800); });
    c.addEventListener('pointerleave', function(e){ if(e.pointerType==='mouse') clearTimeout(hv); });
    c.addEventListener('click', function(e){ if(long){ long=false; e.preventDefault(); e.stopPropagation(); return; } choisir(n); });
  });
})();
`;

const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>r6j · Lequel pour ma stout ? · Les vraies valeurs d’abord</title>
<!-- Lot 22, Comparer, r6j. Données : fils22-comparer/donnees/comparer-stout.json (${D.version}). Généré par r6j/generer.mjs. -->
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600&family=Source+Sans+3:wght@400;600;700&display=swap">
<style>${CSS}</style>
</head>
<body>
${SYMB}
<main class="ecran">${corps}</main>
<script>${JS}</script>
</body>
</html>
`;
fs.writeFileSync(path.join(ICI, 'etat.html'), html);
console.log('écrit r6j/etat.html (' + html.length + ' o)');
// Trace des calculs, pour la NOTE.
for (const n of NOMS) console.log(n, 'dose', DOSE[n], 'entre', P[n].entre.join('–'), 'floral ~', fr(P[n].floral.d, 1), 'résineux ~', fr(P[n].resin.d, 1), 'tropical ~', fr(P[n].tropical.c, 1), LIGNES.map((L) => L.id + ' ' + plage(V[L.id + '|' + n]) + ' → ' + plage(C[L.id + '|' + n])).join(' · '));
