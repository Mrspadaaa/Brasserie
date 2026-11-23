// Lot 22 · r6a · « Trois colonnes côte à côte ». Comparer : « Lequel pour ma stout : Cascade, Idaho 7 ou Galaxy ? »
// Le parti : un tableau à trois colonnes, une par houblon, que l'œil lit en travers. En tête de colonne, le
// houblon comme un brasseur le lit (nom, α, rôle en mot, ses familles en couleur, le style, l'IBU) ; au-dessus,
// le radar r2 (le houblon touché plein, avec sa bande d'incertitude ; les autres en contour) ; dessous, une
// rangée par famille, trois barres de l5b côte à côte, chacune face à la zone de ta 16D, avec son intervalle
// et le trait de ta stout. Les vraies valeurs (v1) et la chimie, rangée par famille, sont à un toucher, dans
// les mêmes trois colonnes. Le panel OSU (Cascade, mesuré) suit, sans molette.
// Choix portés : Radar r2 ; Base dose égale ; Porte non ; Descripteurs A.
// Données : ../donnees/comparer-stout.json seul ; les titres des références citées (H2, H22…) sont lus dans
// le fichier que ce JSON cite comme source des composés (prototypes/houblons-v4/data/composes-houblon.json).
// Calculs faits ici : mises à l'échelle (au style : valeur / domaine de la famille ; absolu : valeur / 125),
// différences en crans ((centre − ta stout) / cran du style), enveloppe des plages des sources (plus petit
// minimum, plus grand maximum), mg/L × 1000 → µg/L. Rien d'autre.
// Usage : node work/refonte-frontend/v4/ecran-1/fils22-comparer/r6a/generer.mjs → r6a/etat.html
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as S from '../../fils21-choisir/w1/socle-w.mjs';
import { runtime } from '../../fils18-baseline/l8g/noyau.mjs';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(ICI, '../../../../../..');
const lire = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const D = lire(path.join(ICI, '../donnees/comparer-stout.json'));
const REFS = lire(path.join(REPO, D.sources.composes)).sources;
const { esc, fr, ic, JET, NOM, COURT } = S;
const ORDRE = D.style.ordre;
const ACC = '#c2410c';

// ---------- les trois houblons, à dose égale ----------
const NOMS = ['Cascade', 'Idaho 7', 'Galaxy'];
// Une couleur par houblon, la même que dans les lots 20 et 21 (fils20-dryhop/donnees-h.json).
const COUL = { Cascade: '#781838', 'Idaho 7': '#e80030', Galaxy: '#681878' };
const EG = D.egalites.doseEgale;
const HB = Object.fromEntries(NOMS.map((n) => [n, D.houblons.find((h) => h.nom === n)]));
const PT = Object.fromEntries(NOMS.map((n) => [n, HB[n].grille.find((g) => g.moment === EG.moment && g.dose_gL === EG.dose_gL && g.jours === EG.jours && g.levure === EG.levure)]));
const AV = D.biere.avant;
const BANDE = Object.fromEntries(ORDRE.map((f) => [f, D.style.zone[f].bande[1]]));
const DOM = Object.fromEntries(ORDRE.map((f) => [f, D.echelle.parFamille[f].domaine[1]]));
const CRAN = Object.fromEntries(ORDRE.map((f) => [f, D.echelle.parFamille[f].cran]));
const ABS = 125; // absolu : 0–125, pour voir le résineux au-dessus de 100 (aucun rognage, D.echelle.rognage)
const val = (n, f) => { const [bas, centre, haut] = PT[n].apres[f]; return { bas, centre, haut }; };
const decrit = (n, f) => (HB[n].aromes.find((a) => a.family === f) || {}).sources > 0;
// Inconnu : rien de connu (0, 0, 0), ou une famille que ses fiches ne décrivent pas et que le moteur ne bouge pas.
const inconnu = (n, f) => { const v = val(n, f); return (v.bas === 0 && v.centre === 0 && v.haut === 0) || (PT[n].delta[f] === 0 && !decrit(n, f)); };
const TOUS_INC = ORDRE.filter((f) => NOMS.every((n) => inconnu(n, f)));
const LIGNES = ORDRE.filter((f) => !TOUS_INC.includes(f));
const dCran = (n, f) => (val(n, f).centre - AV[f].centre) / CRAN[f];
const hors = (n) => ORDRE.filter((f) => !inconnu(n, f) && val(n, f).centre > BANDE[f] && AV[f].centre <= BANDE[f]);
// Ta demande (dégustation du 18.10) : « ma stout est trop résineuses, je la veux plus floral ».
const VEUT = 'floral', TROP = D.biere.degustation.familles[0].famille;
// Mis en avant au départ, par une règle écrite (légende) : le plus de floral sans sortir de ta 16D.
const DEPART = NOMS.filter((n) => !hors(n).length).sort((a, b) => val(b, VEUT).centre - val(a, VEUT).centre)[0];

// ---------- α, rôle, stock : des fiches du JSON ----------
const env = (srcs) => [Math.min(...srcs.map((s) => s.min)), Math.max(...srcs.map((s) => s.max))];
const ALPHA = Object.fromEntries(NOMS.map((n) => {
  const a = HB[n].alpha, fiches = env(a.sources), r = a.retenu;
  const lot = r && r.from === 'fiche de stock' ? r.value : null;
  return [n, { lot, fiches, hors: lot != null && (lot < fiches[0] || lot > fiches[1]), srcs: a.sources.map((s) => s.source + (s.annee ? ' ' + s.annee : '')).join(', '), article: r && r.from !== 'fiche de stock' ? r.value : null }];
}));
const ROLE = Object.fromEntries(NOMS.map((n) => { const r = HB[n].role; return [n, { v: r.value, regle: /^règle/.test(r.source), txt: r.source }]; }));
const MOT_ROLE = { amérisant: 'amérisant', aromatique: 'aromatique', double: 'mixte' };

const pic = (f, w = 16, attrs = '') => `<svg class="pi" width="${w}" height="${w}" data-famille="${f}" ${attrs} role="img" aria-label="${NOM[f]}"><use href="#p-${f}"/></svg>`;
const pct = (x) => fr(x, 1) + '%';
function alphaHtml(n) {
  const A = ALPHA[n], pl = fr(A.fiches[0]) + '–' + pct(A.fiches[1]);
  if (A.lot != null) return `<span class="al lot" data-role="alpha" data-source="lot" data-nature="mesure" aria-label="α du lot en stock : ${fr(A.lot)} %${A.hors ? ' ; hors des plages de ses fiches (' + pl + ', ' + esc(A.srcs) + ')' : ''}">${pct(A.lot)}${A.hors ? ic('diff', 12) : ''}</span>`;
  return `<span class="al fi" data-role="alpha" data-source="fiches" data-nature="mesure" aria-label="α des fiches : ${pl} (${esc(A.srcs)})${A.article ? ' ; ' + fr(A.article) + ' % lu sur un article' : ''}">${ic('livre', 12)}${pl}</span>`;
}
const roleHtml = (n) => { const R = ROLE[n]; return `<span class="us us-mot${R.regle ? ' deduit' : ''}" data-role="usage" data-usage="${R.v}" data-source="${R.regle ? 'règle' : 'fournisseur'}" aria-label="Usage : ${MOT_ROLE[R.v]}${R.regle ? ', déduit de l’α, à valider' : ', attesté par le fournisseur'}"><span class="us-m">${MOT_ROLE[R.v]}</span></span>`; };
const stockHtml = (n) => (ALPHA[n].lot != null ? `<span class="w-stk" role="img" aria-label="lot en stock (α de sa fiche de stock)">${ic('stock', 14)}</span>` : '');
// Ses familles d'après ses fiches : marquée (picto plein format), citée (petit).
const famillesHtml = (n) => HB[n].aromes.filter((a) => a.sources > 0).sort((a, b) => b.level - a.level || ORDRE.indexOf(a.family) - ORDRE.indexOf(b.family)).slice(0, 5)
  .map((a) => pic(a.family, a.level >= 2 ? 16 : 13, `data-niveau="${a.level >= 2 ? 'marqué' : 'cité'}"`)).join('');
function verdictHtml(n) {
  const h = hors(n);
  return h.length ? `<span class="vd hors" data-nature="simule" aria-label="~ sort de ta 16D : ${h.map((f) => NOM[f].toLowerCase()).join(', ')}">${ic('risque', 12)}<span>~ hors</span>${h.map((f) => pic(f, 12)).join('')}</span>`
    : `<span class="vd dans" data-nature="simule" aria-label="~ reste dans ta 16D, hors le résineux déjà au-dessus">${ic('ok', 12)}<span>~ dans</span></span>`;
}
const ibuHtml = () => '<span class="ibu" aria-label="IBU : à cru, non modélisé, inconnu (pas zéro)">IBU <b>?</b></span>';

// ---------- une cellule : la barre de l5b, face à ta 16D ----------
const P = (x) => Math.round(Math.max(0, x) * 1000) / 10 + '%';
const cl = (x) => Math.min(1, Math.max(0, x));
function geo(f, v, k) {
  const s = (x) => x / k;
  return { z: cl(s(BANDE[f])), gb: cl(Math.min(v.centre, BANDE[f]) / k), xo: v.centre > BANDE[f] ? cl(s(v.centre)) - cl(s(BANDE[f])) : 0, w0: cl(s(v.bas)), w1: cl(s(v.haut)), dep: s(v.centre) > 1, av: cl(s(AV[f].centre)), avDep: s(AV[f].centre) > 1 };
}
function cellule(n, f) {
  const sel = n === DEPART ? ' sel' : '';
  if (inconnu(n, f)) return `<span class="cel inc${sel}" data-col="${esc(n)}" role="img" aria-label="${NOM[f]}, ${esc(n)} : apport inconnu, pas zéro (famille absente de ses fiches)"><i class="hach"></i></span>`;
  const v = val(n, f), g = geo(f, v, DOM[f]), a = geo(f, v, ABS), hs = v.centre > BANDE[f];
  const st = ['z', 'gb', 'xo', 'w0', 'w1', 'av'].map((k) => `--${k}:${P(g[k])};--${k}a:${P(a[k])}`).join(';') + `;--xb:${P(g.gb)};--xba:${P(a.gb)}`;
  const d = dCran(n, f), dt = (d >= 0 ? '+' : '−') + fr(Math.abs(d), 1);
  const montre = f === VEUT || f === TROP;
  return `<span class="cel${hs ? ' hs' : ''}${g.dep ? ' dep' : ''}${a.dep ? ' depa' : ''}${sel}" data-col="${esc(n)}" style="${st}" role="img" aria-label="${NOM[f]}, ${esc(n)} 4 g/L : ~ ${fr(v.centre, 0)} sur 100 (bande ${fr(v.bas, 0)}–${fr(v.haut, 0)}), ${dt} cran${Math.abs(d) >= 2 ? 's' : ''} ; ta 16D jusqu’à ${BANDE[f]}${hs ? ' : au-dessus' : ''}">
    <span class="pis"><i class="zo" data-role="zone" data-famille="${f}"></i><i class="ba" data-famille="${f}"></i><i class="xo"></i><i class="wh"></i><i class="av"></i></span>${montre ? `<span class="dl${hs ? ' hors' : ''}" data-nature="simule">~${dt}</span>` : ''}</span>`;
}
function rangee(f) {
  const dem = f === VEUT ? `<span class="dem" aria-label="ta demande : plus de ${COURT[f].toLowerCase()}">${ic('haut', 12)}</span>` : f === TROP ? `<span class="dem trop" aria-label="ta dégustation : trop de ${COURT[f].toLowerCase()}">${ic('bas', 12)}</span>` : '';
  return `<div class="rg${f === VEUT || f === TROP ? ' demande' : ''}" data-famille-ligne="${f}"><span class="rn" style="color:${JET[f].texte}">${pic(f, 16)}<span>${COURT[f]}</span>${dem}</span>${NOMS.map((n) => cellule(n, f)).join('')}</div>`;
}

// ---------- les têtes de colonne : le seul facteur libre (la variété) ----------
const tete = (n) => `<button type="button" role="radio" class="tc${n === DEPART ? ' sel' : ''}" data-col="${esc(n)}" aria-checked="${n === DEPART}" aria-label="Mettre en avant ${esc(n)}" style="--h:${COUL[n]}">
  <span class="tc-n"><i class="pt" style="background:${COUL[n]}" aria-hidden="true"></i><span class="hn" data-houblon="${esc(n)}" data-couleur="${COUL[n]}">${esc(n)}</span>${stockHtml(n)}</span>
  <span class="tc-a">${alphaHtml(n)}</span>
  <span class="tc-r">${roleHtml(n)}</span>
  <span class="tc-f" aria-label="ses familles, d’après ses fiches">${famillesHtml(n)}</span>
  <span class="tc-v">${verdictHtml(n)}</span></button>`;
const taStout = `<div class="tc ta" aria-label="Ta stout : trop résineuse, tu la veux plus florale (dégustation du 18.10)">
  <span class="tc-n"><i class="trait" aria-hidden="true"></i><b>Ta stout</b></span>
  <span class="ta-l">${pic(TROP, 14)}<span>trop</span></span>
  <span class="ta-l">${pic(VEUT, 14)}<span>plus</span></span></div>`;

// ---------- le radar r2 : le même dessin au générateur et à la page ----------
const RD = {
  axes: ORDRE, dom: ORDRE.map((f) => DOM[f]), bande: ORDRE.map((f) => BANDE[f]), abs: ABS,
  av: ORDRE.map((f) => AV[f].centre), incTous: ORDRE.map((f) => TOUS_INC.includes(f)),
  h: NOMS.map((n) => ({ n, c: COUL[n], ce: ORDRE.map((f) => val(n, f).centre), ba: ORDRE.map((f) => val(n, f).bas), ha: ORDRE.map((f) => val(n, f).haut), inc: ORDRE.map((f) => inconnu(n, f)) })),
};
function radarSvg(R, sel, abs) {
  const W = 358, H = 262, cx = W / 2, cy = 132, RR = 100, n = R.axes.length, pas = 2 * Math.PI / n, MAX = 1.1;
  const k = (i, v) => Math.min(MAX, Math.max(0, v / (abs ? R.abs : R.dom[i])));
  const pt = (i, r) => [cx + Math.sin(i * pas) * RR * r, cy - Math.cos(i * pas) * RR * r];
  const pts = (rs) => rs.map((r, i) => pt(i, r).map((x) => Math.round(x * 10) / 10).join(',')).join(' ');
  const ring = (rs) => { const p = rs.map((r, i) => pt(i, r)); return 'M' + p.map((x) => x.join(',')).join('L') + 'Z'; };
  const rd = (x) => Math.round(x * 10) / 10;
  let s = `<svg data-radar="" data-objet="comparer" data-axes="${R.axes.join(',')}" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Radar ${abs ? 'absolu' : 'au style'} : ${R.h[sel].n} plein, les deux autres en contour ; zone pâle : ta 16D ; trait noir : ta stout">`;
  s += '<defs><pattern id="rh" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="#9aa0ab" stroke-width="1.2"/></pattern></defs>';
  R.axes.forEach((f, i) => { if (!R.incTous[i]) return; const a = pt(i - 0.5, 1), b = pt(i + 0.5, 1); s += `<path d="M${cx},${cy}L${a.join(',')}L${b.join(',')}Z" fill="url(#rh)" opacity=".7"/>`; });
  s += `<path class="rz" data-role="zone" d="${ring(R.bande.map((b, i) => Math.min(MAX, b / (abs ? R.abs : R.dom[i]))))}" fill="rgba(47,107,79,.10)" stroke="#2f6b4f" stroke-width="1" />`;
  for (const r of [0.5, 1]) s += `<path d="${ring(R.axes.map(() => r))}" fill="none" stroke="#dcdce3" stroke-width="1"/>`;
  R.axes.forEach((f, i) => { const e = pt(i, 1); s += `<line x1="${cx}" y1="${cy}" x2="${rd(e[0])}" y2="${rd(e[1])}" stroke="#dcdce3" stroke-width="1"/>`; });
  const ordre = R.h.map((x, j) => j).filter((j) => j !== sel).concat([sel]);
  for (const j of ordre) {
    const h = R.h[j], plein = j === sel, ce = h.ce.map((v, i) => k(i, v));
    s += `<g data-serie="${h.n}" data-couleur="${h.c}" data-valeurs="${h.ce.map((v) => rd(v)).join(',')}" data-inconnues="${R.axes.filter((f, i) => h.inc[i]).join(',')}" class="${plein ? 'plein' : 'contour'}">`;
    s += `<polygon points="${pts(ce)}" fill="${plein ? h.c : 'none'}" fill-opacity="${plein ? 0.22 : 0}" stroke="${h.c}" stroke-width="3" stroke-linejoin="round"/>`;
    if (plein) {
      s += `<path d="${ring(h.ha.map((v, i) => k(i, v)))}${ring(h.ba.map((v, i) => k(i, v)))}" fill="${h.c}" fill-opacity=".07" fill-rule="evenodd" stroke="none"/><path d="${ring(h.ha.map((v, i) => k(i, v)))}" fill="none" stroke="${h.c}" stroke-opacity=".35" stroke-width="1"/>`;
      ce.forEach((r, i) => { const q = pt(i, r); s += h.inc[i] ? `<circle cx="${rd(q[0])}" cy="${rd(q[1])}" r="4" fill="#fff" stroke="#8a909b" stroke-width="1.5"/>` : `<circle cx="${rd(q[0])}" cy="${rd(q[1])}" r="3.4" fill="${r >= MAX ? '${ACC}' : h.c}"/>`; });
    }
    s += '</g>';
  }
  s += `<polygon points="${pts(R.av.map((v, i) => k(i, v)))}" fill="none" stroke="#16161a" stroke-width="1.5" stroke-linejoin="round"/>`;
  R.axes.forEach((f, i) => { const q = pt(i, 1.2); s += `<use href="#p-${f}" x="${rd(q[0] - 8)}" y="${rd(q[1] - 8)}" width="16" height="16"${R.incTous[i] ? ' opacity=".45"' : ''}/>`; if (R.incTous[i]) s += `<text x="${rd(q[0] + (q[0] >= cx ? 10 : -10))}" y="${rd(q[1] + 4)}" text-anchor="${q[0] >= cx ? 'start' : 'end'}" class="rq">?</text>`; });
  return s + '</svg>';
}
const radarSrc = radarSvg.toString().replace("'${ACC}'", "'" + ACC + "'");
const radar0 = new Function('return ' + radarSrc)()(RD, NOMS.indexOf(DEPART), false);

// ---------- les vraies valeurs et la chimie, dans les mêmes trois colonnes (un toucher) ----------
const court = (id) => {
  if (/^bm-/.test(id)) return 'Beer Maverick 2023';
  if (/^hs-/.test(id)) return 'Hopsteiner 2025';
  const r = REFS[id]; if (!r) return id;
  const t = r.titre.split(/[,:]/)[0].replace(/\s+et al\.?$/, '');
  return t + (r.annee ? ' ' + r.annee : '');
};
const refId = (id) => (/^bm-/.test(id) ? 'BM' : /^hs-/.test(id) ? 'HS' : id);
const CITES = new Map();
const citer = (ids) => { for (const id of ids) CITES.set(refId(id), court(id)); return [...new Set(ids.map(refId))]; };
function plageDe(vals) {
  const vs = (vals || []).filter((v) => !v.portee || v.portee === 'variété');
  if (!vs.length) return null;
  const mins = vs.map((v) => v.plage[0]).filter((x) => x != null), maxs = vs.map((v) => v.plage[1]).filter((x) => x != null);
  const ouvertH = vs.some((v) => v.plage[1] == null), ouvertB = vs.some((v) => v.plage[0] == null);
  const lo = mins.length ? Math.min(...mins) : null, hi = maxs.length && !ouvertH ? Math.max(...maxs) : null;
  const txt = lo != null && hi != null ? (lo === hi ? fr(lo, 2) : fr(lo, 2) + '–' + fr(hi, 2)) : lo != null ? '> ' + fr(lo, 2) : '< ' + fr(hi ?? Math.max(...maxs), 2);
  return { lo: ouvertB ? 0 : lo, hi: hi ?? (ouvertH ? null : Math.max(...maxs)), ouvert: ouvertH, txt, ids: citer(vs.flatMap((v) => v.sources)), verif: vs.some((v) => v.aConfirmer) };
}
const deSources = (srcs) => ({ lo: Math.min(...srcs.map((s) => s.min)), hi: Math.max(...srcs.map((s) => s.max)), txt: fr(Math.min(...srcs.map((s) => s.min)), 1) + '–' + fr(Math.max(...srcs.map((s) => s.max)), 1), ids: [...new Set(srcs.map((s) => { const k = s.source === 'Beer Maverick' ? 'BM' : s.source === 'Hopsteiner' ? 'HS' : s.source; CITES.set(k, s.source + (s.annee ? ' ' + s.annee : '')); return k; }))] });
// Une rangée : trois cellules (une par houblon) sur une échelle commune à la rangée.
function vrangee({ cle, f, nom, unite, cells, compose = true, note = '', icone = 'huile' }) {
  const mil = cells.map((c) => (c ? (c.lo + (c.hi ?? c.lo * 1.6)) / 2 : null)), top = !note && mil.filter((x) => x != null).length >= 2 ? mil.indexOf(Math.max(...mil.filter((x) => x != null))) : -1;
  const hauts = cells.filter(Boolean).map((c) => c.hi ?? c.lo * 1.6);
  const mx = Math.max(...hauts) * 1.08 || 1;
  const cel = (n, c, i) => {
    if (!c) return `<span class="vc inc" data-col="${esc(n)}"><i class="hach"></i><span class="vi">inconnu</span></span>`;
    const l = (c.lo / mx) * 100, r = ((c.hi ?? mx) / mx) * 100;
    return `<span class="vc${c.verif ? ' verif' : ''}${i === top ? ' max' : ''}" data-col="${esc(n)}" style="--c:${COUL[n]}"><span class="vt"><span class="vv mono" data-nature="mesure" data-source="${esc(c.ids.map((i) => CITES.get(i) || i).join(' ; '))}">${c.txt}</span>${c.lot != null ? `<i class="lotm" aria-label="ton lot ${fr(c.lot, 1)} %"></i>` : ''}</span><span class="vb"><i class="vbr${c.ouvert ? ' ouvert' : ''}" style="left:${l.toFixed(1)}%;width:${Math.max(3, r - l).toFixed(1)}%"></i>${c.lot != null ? `<i class="vlot" style="left:${((c.lot / mx) * 100).toFixed(1)}%"></i>` : ''}</span><span class="vr">${c.ids.join(' ')}${c.verif ? ' · à confirmer' : ''}${c.note ? ' · ' + c.note : ''}</span></span>`;
  };
  return `<div class="vg"${compose ? ` data-compose="${cle}"` : ''}><span class="vn">${f ? pic(f, 16) : ic(icone, 16)}<span><b>${nom}</b><span class="vu">${unite}</span></span></span>${NOMS.map((n, i) => cel(n, cells[i], i)).join('')}${note ? `<p class="vnote">${note}</p>` : ''}</div>`;
}
const CPD = (n, k) => plageDe((HB[n].composes.composes[k] || {}).valeurs);
const alphaRow = vrangee({ cle: 'alpha', nom: 'α', unite: '% masse', compose: false, icone: 'livre', cells: NOMS.map((n) => ({ ...deSources(HB[n].alpha.sources), lot: ALPHA[n].lot })) });
const betaRow = vrangee({ cle: 'beta', nom: 'β', unite: '% masse', compose: false, icone: 'livre', cells: NOMS.map((n) => deSources(HB[n].beta.sources)) });
const huileRow = vrangee({ cle: 'huile', nom: 'huile', unite: 'mL/100 g', cells: NOMS.map((n) => plageDe(HB[n].composes.huile.valeurs)) });
const CHIMIE = [
  ['myrcene', 'resin', 'myrcène', '% huile'], ['linalol', 'floral', 'linalol', '% huile'], ['geraniol', 'floral', 'géraniol', '% huile'],
  ['humulene', 'herbal', 'humulène', '% huile'], ['caryophyllene', 'spice', 'caryo­phyllène', '% huile'], ['4MMP', 'tropical', '4MMP', 'µg/kg'],
].map(([k, f, nom, u]) => vrangee({ cle: k, f, nom, unite: u, cells: NOMS.map((n) => CPD(n, k)) }));
// En bière, mesuré : linalol. Cascade (Kishimoto 2008, H12) ; Idaho 7 (McCabe 2023, E03, mg/L × 1000) ; Galaxy : aucune mesure.
const linCas = HB.Cascade.composes.mesuresEnBiere.find((m) => m.id === 'kishimoto-linalol');
const e03 = HB['Idaho 7'].panels.find((p) => p.id === 'E03'), linI7 = e03.mesures.find((m) => m.variete === 'Idaho-7' && m.compose === 'linalol');
CITES.set('E03', 'McCabe 2023');
const enBiere = vrangee({ cle: 'linalol-biere', f: 'floral', nom: 'linalol en bière', unite: 'µg/L', cells: [
  { lo: linCas.plage[0], hi: linCas.plage[1], txt: fr(linCas.plage[0], 1), ids: citer(linCas.sources), note: fr(linCas.doseGL, 0) + ' g/L, moût' },
  { lo: (linI7.valeur - linI7.ecart) * 1000, hi: (linI7.valeur + linI7.ecart) * 1000, txt: fr(linI7.valeur * 1000, 0) + '±' + fr(linI7.ecart * 1000, 0), ids: ['E03'], verif: true, note: 'au pitch' },
  null], note: 'Pas comparables entre eux : doses, moments et bières diffèrent.' });
const sourcesTxt = () => [...CITES.entries()].sort((a, b) => a[0].localeCompare(b[0], 'fr', { numeric: true })).map(([k, t]) => `<span><b>${esc(k)}</b> ${esc(t)}</span>`).join('');

// ---------- le panel OSU (Cascade, mesuré), sans molette ----------
const O = D.panelOSU;
function osuSvg() {
  const W = 358, H = 128, x0 = 30, x1 = W - 96, y0 = 10, y1 = H - 22, xs = O.doses.map((d, i) => x0 + (x1 - x0) * i / (O.doses.length - 1));
  const y = (v) => y1 - (y1 - y0) * v / 15, rd = (v) => Math.round(v * 10) / 10;
  const xz0 = xs[2], xz1 = xs[3];
  let s = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Panel OSU, Cascade : agrumes, herbacé/thé et intensité selon la dose, sur 15">`;
  s += `<rect x="${xz0}" y="${y0}" width="${xz1 - xz0}" height="${y1 - y0}" fill="#ececf1"/>`;
  for (const v of [0, 5, 10, 15]) s += `<line x1="${x0}" x2="${x1}" y1="${rd(y(v))}" y2="${rd(y(v))}" stroke="#dcdce3"/><text x="${x0 - 6}" y="${rd(y(v) + 4)}" text-anchor="end" class="ot">${v}</text>`;
  O.doses.forEach((d, i) => { s += `<text x="${rd(xs[i])}" y="${H - 6}" text-anchor="middle" class="ot">${fr(d, 2)}</text>`; });
  s += `<line x1="${rd(xs[2])}" x2="${rd(xs[2])}" y1="${y0 - 4}" y2="${y1}" stroke="#16161a" stroke-width="2"/>`;
  const serie = (vals, c, nom) => `<polyline points="${vals.map((v, i) => rd(xs[i]) + ',' + rd(y(v))).join(' ')}" fill="none" stroke="${c}" stroke-width="2.5" stroke-linejoin="round"/>${vals.map((v, i) => `<circle cx="${rd(xs[i])}" cy="${rd(y(v))}" r="3" fill="#fff" stroke="${c}" stroke-width="2"/>`).join('')}<text x="${x1 + 8}" y="${rd(y(vals[vals.length - 1]) + 4)}" class="ol" fill="${c}">${nom} ${fr(vals[vals.length - 1], 1)}</text>`;
  s += serie(O.intensite, '#16161a', 'intensité') + serie(O.herbaceThe, JET.herbal.texte, 'herbacé') + serie(O.agrumes, JET.citrus.texte, 'agrumes');
  return s + '</svg>';
}
const h22 = court(O.sources[0]), h77 = court(O.complement.sources[0]);
CITES.set(O.sources[0], h22); CITES.set(O.complement.sources[0], h77);

// ---------- la fiche g1 à l'appui long, avec nos houblons (descripteurs : option A) ----------
const uniq = (xs) => { const vu = new Set(); return xs.filter((w) => { const k = w.toLowerCase(); if (vu.has(k)) return false; vu.add(k); return true; }).map((w) => w.toLowerCase()); };
const NOMS_H = { myrcene: 'myrcène', humulene: 'humulène', caryophyllene: 'caryophyllène', farnesene: 'farnésène', linalool: 'linalol' };
const A = D.descripteurs.A;
function ficheDe(n) {
  const h = HB[n], comp = h.huiles.composants || {}, depl = (A.effets[n] || { deplaces: [] }).deplaces.map((w) => w.toLowerCase());
  const ps = (s) => ({ src: s.source, an: s.annee ?? null, min: s.min, max: s.max });
  const aromes = h.aromes.map((a) => ({ f: a.family, n: a.sources, of: a.of, auteurs: a.authors || [], mots: uniq((a.mots || []).flatMap((m) => m.mots)), premier: a.sources === 1 && (a.premier || []).length > 0 }));
  if (depl.length) { const b = aromes.find((a) => a.f === A.famille); b.mots = uniq([...b.mots, ...depl]); b.n = Math.max(b.n, 1); }
  return {
    nom: n, role: { v: h.role.value, src: /^règle/.test(h.role.source) ? 'règle' : 'fournisseur', txt: h.role.source }, voie: null, stock: ALPHA[n].lot != null ? 'suffisant' : null, ajout: null,
    alphaC1: { lot: ALPHA[n].lot, lotSource: 'fiche de stock', fiches: ALPHA[n].fiches, horsFiches: ALPHA[n].hors },
    origine: (h.composes.origine || '').split(' (')[0].split(' ;')[0] || 'non renseigné', alpha: h.alpha.sources.map(ps), lot: ALPHA[n].lot,
    beta: h.beta.sources.map(ps), huiles: h.huiles.totale.sources.map(ps),
    composants: Object.entries(NOMS_H).map(([k, nm]) => (comp[k] ? { nom: nm, min: comp[k].min, max: comp[k].max, src: comp[k].source } : { nom: nm, raison: comp[k + 'Raison'] || 'non renseigné' })),
    aromes: aromes.filter((a) => a.n > 0), of: (h.aromes[0] || {}).of || 0,
    sans: uniq(h.motsSansFamille.map((s) => s.mot)).filter((w) => !depl.includes(w)),
    styles: h.usage.flatMap((u) => u.styles || []), stylesSrc: h.usage.map((u) => u.source).filter(Boolean), stylesRaison: 'non renseigné',
    desc: [], subs: [], subsRaison: 'hors des entrées du lot 22',
  };
}
const FICHES = Object.fromEntries(NOMS.map((n) => [n, ficheDe(n)]));
const DEMANDE = [{ f: VEUT, s: 1 }, { f: TROP, s: -1 }];
const rt = runtime({ extra: '' })
  .replace(/const FD = [^\n]*;\nconst ROUE/, () => 'const FD = ' + JSON.stringify(FICHES) + ';\nconst ROUE')
  .replace(/DEMANDE = \[[^\]]*\]/, () => 'DEMANDE = ' + JSON.stringify(DEMANDE));
if (!rt.includes('"Idaho 7"')) throw new Error('fiche : FD non remplacé');

// ---------- l'écran ----------
const ctx = `<p class="ctx" data-role="contexte" aria-label="Fixé pour les trois">
  <span class="cx" data-contexte="biere">${ic('biere', 14)}Stout 16D</span>
  <span class="cx fort" data-contexte="base">${ic('egal', 14)}dose égale ${fr(EG.dose_gL)} g/L</span>
  <span class="cx" data-contexte="moment">${ic('cuveP', 14)}après fermentation, ${EG.jours} j</span>
  <span class="cx" data-contexte="levure">${ic('levure', 14)}US-05</span></p>`;
const corps = `
  <header class="tete"><button class="w-ret" type="button" aria-label="Retour">${ic('chev-l', 20)}</button><h1>Cascade, Idaho 7 ou Galaxy pour ma stout ?</h1><button type="button" class="leg-b" data-role="legende-bouton" aria-expanded="false" aria-label="Légende">?</button></header>
  ${ctx}
  <section class="rad" data-acquis="radar" aria-label="Radar r2">
    <span class="rad-h">${S.conf('simule')}</span>
    <span class="seg lentille rad-l" role="radiogroup" aria-label="Lecture"><button role="radio" type="button" data-e="style" aria-checked="true">Au style</button><button role="radio" type="button" data-e="absolu" aria-checked="false">Absolu</button></span>
    <div id="radar">${radar0}</div>
  </section>
  <section class="tab" aria-label="Les trois houblons, côte à côte">
    <div class="tetes" role="radiogroup" aria-label="Houblon mis en avant" data-libre="houblon">${taStout}${NOMS.map(tete).join('')}</div>
    <div class="rgs">${LIGNES.map(rangee).join('')}
      <div class="rg inc-t"><span class="rn">${TOUS_INC.map((f) => pic(f, 16)).join('')}</span><span class="inc-l"><i class="hach"></i>inconnus, pas zéro</span></div>
    </div>
  </section>
  <button type="button" class="tch" aria-expanded="false" aria-controls="vraies" data-ouvre-acquis="valeurs chimie">${ic('labo', 16)}<span>Chimie et vraies valeurs</span>${ic('chevb', 14)}</button>
  <section id="vraies" class="vraies" data-acquis="valeurs" hidden aria-label="Vraies valeurs et chimie">
    <div class="vh"><span></span>${NOMS.map((n) => `<span class="vhn" data-col="${esc(n)}" style="color:${COUL[n]}">${esc(n)}</span>`).join('')}</div>
    ${alphaRow}${betaRow}
    <div class="chim" data-acquis="chimie" aria-label="Composés de l’huile, rangés par famille">${huileRow}${CHIMIE.join('')}</div>
    ${enBiere}
    <div class="vg" aria-label="IBU à cru : non modélisé"><span class="vn">${ic('goutte', 16)}<span><b>IBU</b><span class="vu">à cru</span></span></span>${NOMS.map((n) => `<span class="vc inc" data-col="${esc(n)}"><i class="hach"></i><span class="vi">non modélisé</span></span>`).join('')}</div>
    <p class="vsrc">${S.conf('mesure')}<span>fiches et études ; plage = du plus bas au plus haut des sources.</span></p>
    <p class="vrefs">${sourcesTxt()}</p>
  </section>
  <section class="osu" data-acquis="osu" data-nature="mesure" data-source="${esc(O.sources[0] + ' : ' + h22)}" aria-label="Panel OSU">
    <div class="osu-t">${ic('panel', 16)}<b>Panel OSU, Cascade</b>${S.conf('panel')}<span class="osu-u">sur 15, g/L</span></div>
    ${osuSvg()}
    <p class="osu-n"><span class="osu-d"><i class="ld"></i>${fr(O.doses[2], 2)} g/L ≈ ta dose égale</span><span><i class="lz"></i>4–8 g/L : retenu par les auteurs</span></p>
    <p class="osu-n">Agrumes : plafond dès 8 g/L ; l’herbacé monte encore. <b>Idaho 7, Galaxy : pas de panel publié.</b></p>
    <p class="osu-s">${O.sources[0]} ${esc(h22)} · ${O.complement.sources[0]} ${esc(h77)} : 10 contre 15 g/L non distingués.</p>
  </section>
  <nav class="pont" aria-label="Suite"><a href="#" data-role="pont">${ic('cuveP', 16)}<span>Doser <b id="pont-n">${esc(DEPART)}</b> dans Dryhopper</span>${ic('fleche', 16)}</a></nav>
  <p class="pied">${S.conf('simule')}<span>moteur profil-simulé (${D.version}, ${D.date.split('-').reverse().slice(0, 2).join('.')}) : centre conventionnel, bande = incertitude.</span></p>`;

const legende = `<div class="w-voile" data-role="legende-voile" hidden></div><section class="w-leg" id="legende" data-role="legende" role="dialog" aria-label="Légende" hidden>
  <div class="w-f-t"><b>Légende</b><button type="button" data-role="legende-fermer" aria-label="Fermer la légende">${ic('x', 18)}</button></div>
  <div class="w-leg-s"><h3>Les familles</h3><div class="w-leg-g">${ORDRE.map((f) => `<span class="w-leg-i">${pic(f, 18)}${COURT[f]}</span>`).join('')}</div></div>
  <div class="w-leg-s"><h3>Une barre, par houblon</h3><div class="w-leg-g l2">
    <span class="w-leg-i"><i class="lg-z"></i>zone pâle : ce que ta 16D permet</span>
    <span class="w-leg-i"><i class="lg-b"></i>barre : ~ simulé à 4 g/L</span>
    <span class="w-leg-i"><i class="lg-w"></i>trait fin : sa bande d’incertitude</span>
    <span class="w-leg-i"><i class="lg-av"></i>trait noir : ta stout aujourd’hui</span>
    <span class="w-leg-i"><i class="lg-x"></i>orangé : au-dessus de ta 16D</span>
    <span class="w-leg-i"><i class="hach"></i>hachuré : inconnu, jamais zéro</span>
    <span class="w-leg-i"><b class="mono">~+1,3</b>crans du style gagnés</span>
    <span class="w-leg-i">${ic('haut', 12)}${ic('bas', 12)}ta demande du 18.10</span></div></div>
  <div class="w-leg-s"><h3>Le radar</h3><p>Le houblon touché est plein, avec sa bande ; les deux autres en contour. Rond creux : apport inconnu. Au départ, le plus floral qui reste dans ta 16D.</p></div>
  <div class="w-leg-s"><h3>Un houblon</h3><div class="w-leg-g l2">
    <span class="w-leg-i"><span class="al lot">17,2%${ic('diff', 12)}</span>α du lot ; ≠ hors des fiches</span><span class="w-leg-i"><span class="al fi">${ic('livre', 12)}9,5–14,9%</span>α des fiches</span>
    <span class="w-leg-i"><span class="us us-mot deduit"><span class="us-m">mixte</span></span>pâle : déduit de l’α</span><span class="w-leg-i">${ic('main', 16)}appui long sur un nom : sa fiche</span></div></div>
  <div class="w-leg-s"><h3>Base : dose égale</h3><p>Les trois à ${fr(EG.dose_gL)} g/L, après fermentation, ${EG.jours} j, US-05. Fiche : « groseille à maquereau » rangée dans Petits fruits (option A) ; aucun de ces trois houblons n’a ce mot.</p></div>
</section>`;

const css = `
  .ecran { gap: 8px; padding-top: 2px; }
  .tete { display: flex; align-items: center; gap: 6px; min-height: 44px; }
  .tete h1 { flex: 1; font-size: 17px; line-height: 1.15; font-weight: 700; }
  .ctx { display: flex; flex-wrap: wrap; gap: 4px 12px; font-size: 12px; color: var(--gris); }
  .cx { display: inline-flex; align-items: center; gap: 3px; white-space: nowrap; }
  .cx.fort { color: var(--encre); font-weight: 700; }
  .rad { position: relative; margin: 0 -16px 0; padding: 0 16px; }
  .rad-h { position: absolute; left: 16px; top: 2px; z-index: 1; }
  .rad-l { position: absolute; right: 16px; top: 0; z-index: 1; }
  #radar svg { margin: 0 auto; }
  .rq { font: 700 12px var(--sans); fill: #5b5b66; }
  /* le tableau : 70 px de libellé, trois colonnes de houblon */
  .tab { display: flex; flex-direction: column; gap: 0; }
  .tetes, .rg, .vg, .vh { display: grid; grid-template-columns: 76px repeat(3, minmax(0, 1fr)); column-gap: 4px; }
  .tc { display: flex; flex-direction: column; align-items: flex-start; gap: 3px; text-align: left; padding: 6px 5px 6px; border-radius: 8px 8px 0 0; min-width: 0; box-shadow: inset 0 3px 0 var(--h, transparent); }
  .tc.sel { background: #f3f3f6; box-shadow: inset 0 3px 0 var(--h), inset 2px 0 0 var(--h), inset -2px 0 0 var(--h); }
  .tc.ta { padding: 6px 0; box-shadow: none; gap: 4px; }
  .tc-n { display: flex; align-items: center; gap: 4px; font-size: 14px; max-width: 100%; }
  .tc-n .hn { font-weight: 700; white-space: nowrap; text-decoration: underline dotted #9a9aa6; text-underline-offset: 3px; -webkit-touch-callout: none; -webkit-user-select: none; user-select: none; }
  .pt { width: 8px; height: 8px; border-radius: 50%; flex: none; }
  .trait { width: 10px; height: 2px; background: var(--encre); flex: none; border-radius: 2px; }
  .tc.ta b { font-size: 14px; }
  .ta-l { display: inline-flex; align-items: center; gap: 3px; font-size: 12px; font-weight: 600; }
  .tc-a { display: inline-flex; align-items: center; gap: 2px; }
  .ag { font: 400 12px var(--sans); color: var(--gris); }
  .tc .al { font-size: 12px; }
  .tc-f { display: flex; align-items: flex-end; gap: 2px; min-height: 16px; }
  .vd { display: inline-flex; align-items: center; gap: 2px; font-size: 12px; font-weight: 700; white-space: nowrap; }
  .vd.dans { color: #2f6b4f; } .vd.hors { color: var(--acc); }
  .ibu { font-size: 12px; color: var(--gris); } .ibu b { font-family: var(--mono); }
  .rgs { display: flex; flex-direction: column; }
  .rg { align-items: center; min-height: 22px; }
  .rg.demande { min-height: 34px; }
  .rn { display: flex; align-items: center; gap: 2px; letter-spacing: -.01em; font-size: 12px; font-weight: 600; white-space: nowrap; overflow: hidden; }
  .dem { display: inline-flex; color: var(--encre); } .dem.trop { color: var(--acc); }
  .cel { position: relative; display: flex; flex-direction: column; justify-content: center; gap: 1px; height: 100%; min-height: 22px; padding: 0 5px; }
  .cel.sel { background: #f3f3f6; box-shadow: inset 2px 0 0 var(--hs, transparent), inset -2px 0 0 var(--hs, transparent); }
  .rgs > .rg:nth-last-child(2) .cel.sel { border-radius: 0 0 8px 8px; box-shadow: inset 2px 0 0 var(--hs, transparent), inset -2px 0 0 var(--hs, transparent), inset 0 -2px 0 var(--hs, transparent); }
  .pis { position: relative; display: block; height: 12px; background: #f6f6f9; border-radius: 2px; }
  .pis > i { position: absolute; top: 0; bottom: 0; display: block; }
  .zo { left: 0; width: var(--z); background: var(--f); box-shadow: inset -1.5px 0 0 var(--t); }
  .ba { left: 0; top: 2px !important; bottom: 2px !important; width: var(--gb); background: var(--b); border-radius: 2px; }
  .ba { background: var(--b); }
  .xo { left: var(--xb); width: var(--xo); top: 2px !important; bottom: 2px !important; background: ${ACC}; border-radius: 0 2px 2px 0; }
  .wh { left: var(--w0); width: calc(var(--w1) - var(--w0)); top: 5.25px !important; bottom: 5.25px !important; background: rgba(22,22,26,.42); }
  .av { left: calc(var(--av) - 1px); width: 2px; top: -2px !important; bottom: -2px !important; background: var(--encre); border-radius: 2px; }
  .cel.dep .pis::after { content: ''; position: absolute; right: -5px; top: 2px; border: 4px solid transparent; border-left: 5px solid ${ACC}; border-right: 0; }
  body.abs .zo { width: var(--za); } body.abs .ba { width: var(--gba); } body.abs .xo { left: var(--xba); width: var(--xoa); }
  body.abs .wh { left: var(--w0a); width: calc(var(--w1a) - var(--w0a)); } body.abs .av { left: calc(var(--ava) - 1px); }
  body.abs .cel.dep .pis::after { display: none; } body.abs .cel.depa .pis::after { display: block; }
  .dl { font: 600 12px/14px var(--mono); color: var(--encre); }
  .dl.hors { color: var(--acc); }
  .hach { display: inline-block; width: 22px; height: 10px; border-radius: 2px; flex: none; background: repeating-linear-gradient(135deg, #fff 0 2px, #8a909b 2px 3.5px); box-shadow: inset 0 0 0 1px #8a909b; }
  .cel.inc { flex-direction: row; align-items: center; justify-content: flex-start; gap: 4px; font: 700 12px var(--mono); color: var(--gris); }
  .inc-t { min-height: 26px; }
  .inc-l { grid-column: 2 / -1; display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--gris); }
  /* le toucher */
  .tch { display: flex; align-items: center; gap: 6px; min-height: 36px; padding: 0 12px; border-radius: 8px; box-shadow: inset 0 0 0 1.5px var(--encre); font-size: 14px; font-weight: 700; align-self: flex-start; }
  .tch[aria-expanded="true"] { background: var(--encre); color: #fff; }
  .vraies { display: flex; flex-direction: column; gap: 6px; padding: 6px 0 4px; border-top: 1px solid var(--trait); }
  .vh { font-size: 12px; font-weight: 700; }
  .vg { align-items: start; padding: 3px 0; border-top: 1px solid var(--trait); }
  .chim { display: flex; flex-direction: column; gap: 6px; }
  .vn { display: flex; align-items: flex-start; gap: 4px; font-size: 12px; }
  .vn b { display: block; font-weight: 700; } .vu { display: block; color: var(--gris); }
  .vc { display: flex; flex-direction: column; gap: 2px; min-width: 0; padding: 0 2px; }
  .vt { display: flex; align-items: center; gap: 3px; }
  .vv { font-size: 12px; font-weight: 600; white-space: nowrap; }
  .vb { position: relative; height: 6px; background: #f1f1f4; border-radius: 2px; }
  .vbr { position: absolute; top: 0; bottom: 0; background: var(--c); border-radius: 2px; opacity: .8; }
  .vbr.ouvert { background: linear-gradient(90deg, var(--c) 55%, rgba(255,255,255,0)); }
  .vlot { position: absolute; top: -3px; bottom: -3px; width: 2px; margin-left: -1px; background: var(--encre); }
  .lotm { width: 2px; height: 10px; background: var(--encre); display: inline-block; }
  .vr { font-size: 12px; color: var(--gris); line-height: 1.15; }
  .vc.verif .vr { color: var(--acc); }
  .vc.max .vv { color: var(--c); font-weight: 700; } .vc.max .vbr { opacity: 1; }
  .vn b { hyphens: manual; overflow-wrap: anywhere; }
  .vc.inc { flex-direction: row; align-items: center; gap: 4px; } .vi { font-size: 12px; color: var(--gris); }
  .vnote { grid-column: 2 / -1; font-size: 12px; color: var(--gris); }
  .vsrc { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--gris); }
  .vrefs { display: flex; flex-wrap: wrap; gap: 2px 10px; font-size: 12px; color: var(--gris); }
  .vrefs b { color: var(--encre); }
  /* le panel OSU */
  .osu { display: flex; flex-direction: column; gap: 4px; padding-top: 6px; border-top: 1px solid var(--trait); }
  .osu-t { display: flex; align-items: center; gap: 6px; font-size: 14px; }
  .osu-u { margin-left: auto; font-size: 12px; color: var(--gris); }
  .ot { font: 400 12px var(--mono); fill: #5b5b66; } .ol { font: 600 12px var(--sans); }
  .osu-n { display: flex; flex-wrap: wrap; gap: 2px 12px; font-size: 12px; color: var(--gris); }
  .osu-n b { color: var(--encre); font-weight: 600; }
  .osu-n > span { display: inline-flex; align-items: center; gap: 4px; }
  .ld { width: 2px; height: 12px; background: var(--encre); display: inline-block; } .lz { width: 14px; height: 10px; background: #ececf1; display: inline-block; border-radius: 2px; }
  .osu-s { font-size: 12px; color: var(--gris); }
  .pont a { display: flex; align-items: center; gap: 8px; min-height: 40px; padding: 0 14px; border-radius: 999px; background: var(--encre); color: #fff; font-size: 14px; }
  .pont a span { flex: 1; }
  .pied { display: flex; align-items: flex-start; gap: 6px; font-size: 12px; color: var(--gris); }
  .w-leg p { font-size: 12px; line-height: 1.3; }
  .lg-z, .lg-b, .lg-w, .lg-av, .lg-x { display: inline-block; flex: none; width: 22px; height: 10px; border-radius: 2px; }
  .lg-z { background: ${JET.floral.fond}; box-shadow: inset -1.5px 0 0 ${JET.floral.texte}; } .lg-b { background: ${JET.floral.base}; } .lg-w { height: 2px; background: rgba(22,22,26,.55); border-radius: 0; }
  .lg-av { width: 2px; height: 14px; background: var(--encre); } .lg-x { background: ${ACC}; }`;

const js = `
const RD = ${JSON.stringify(RD)};
const radarSvg = ${radarSrc};
const NOMS = ${JSON.stringify(NOMS)}, COUL = ${JSON.stringify(COUL)};
let SEL = NOMS.indexOf(${JSON.stringify(DEPART)});
const dessiner = () => { document.getElementById('radar').innerHTML = radarSvg(RD, SEL, document.body.classList.contains('abs')); };
function choisir(i) {
  SEL = i; const n = NOMS[i];
  document.querySelectorAll('.tetes [role="radio"]').forEach((b) => { const on = b.dataset.col === n; b.setAttribute('aria-checked', String(on)); b.classList.toggle('sel', on); });
  document.querySelectorAll('.cel').forEach((c) => { const on = c.dataset.col === n; c.classList.toggle('sel', on); c.style.setProperty('--hs', on ? COUL[n] : 'transparent'); });
  document.getElementById('pont-n').textContent = n; dessiner();
}
document.querySelectorAll('.tetes [role="radio"]').forEach((b) => b.addEventListener('click', () => choisir(NOMS.indexOf(b.dataset.col))));
choisir(SEL);
document.querySelectorAll('.lentille [data-e]').forEach((b) => b.addEventListener('click', () => setTimeout(dessiner, 0)));
const T = document.querySelector('.tch'), V = document.getElementById('vraies');
T.addEventListener('click', () => { const on = T.getAttribute('aria-expanded') !== 'true'; T.setAttribute('aria-expanded', String(on)); V.hidden = !on; });
if (/[?&]vraies\\b/.test(location.search)) T.click();
const LB = document.querySelector('[data-role="legende-bouton"]'), LG = document.querySelector('[data-role="legende"]'), LV = document.querySelector('[data-role="legende-voile"]');
const legende = (on) => { LG.hidden = !on; LV.hidden = !on; LB.setAttribute('aria-expanded', String(on)); };
LB.addEventListener('click', () => legende(LB.getAttribute('aria-expanded') !== 'true'));
document.querySelector('[data-role="legende-fermer"]').addEventListener('click', () => legende(false));
LV.addEventListener('click', () => legende(false));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') legende(false); });
if (/[?&]legende\\b/.test(location.search)) legende(true);
const qs = new URLSearchParams(location.search).get('sel'); if (qs && NOMS.includes(qs)) choisir(NOMS.indexOf(qs));`;

const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>r6a · Trois colonnes côte à côte · Comparer</title>
<!-- Lot 22 · r6a · généré par generer.mjs depuis ../donnees/comparer-stout.json. Choix portés : Radar r2 ; Base dose égale ; Porte non ; Descripteurs A. -->
${S.POLICES}
<style>${S.CSS}
${css}</style>
</head>
<body>
${S.SYMB}
<main class="ecran">${corps}
</main>
${legende}
<script>${js}</script>
<script>${rt}</script>
</body>
</html>
`;
fs.writeFileSync(path.join(ICI, 'etat.html'), html);
console.log('écrit r6a/etat.html (' + Math.round(html.length / 1024) + ' Ko) · départ : ' + DEPART + ' · inconnus pour les trois : ' + TOUS_INC.join(', '));
for (const n of NOMS) console.log(n, 'hors :', hors(n).join(',') || '—', '· floral ~+' + dCran(n, VEUT).toFixed(2), '· résineux ~+' + dCran(n, TROP).toFixed(2), '· inconnus :', ORDRE.filter((f) => inconnu(n, f)).join(','));
