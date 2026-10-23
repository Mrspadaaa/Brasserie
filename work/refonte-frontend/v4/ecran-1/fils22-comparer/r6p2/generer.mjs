// Lot 22 ter · r6p2 · « La réponse d'abord ». Variante de r6n2 (copie de r6n2/generer.mjs, classes r6p2-…).
// Angle (b4 de Dryhopper, « la réponse direct et le pourquoi ») : la ligne « Idaho 7 devant Cascade ~0,4 cran »
// devient la réponse elle-même, en grand, avec son pourquoi en deux ou trois mots par houblon (« contre ★ :
// Cascade ❀ ≈−0,4 · Galaxy ❀ ≈−0,4 ⚠ ») ; toucher une autre colonne écrit sa perte chiffrée contre ★
// (« Cascade contre ★ : floral ≈−0,4 · résineux = »). Payé : le titre devient « Lequel pour ma stout ? » (les
// noms sont dans la réponse et les colonnes) ; « Face à ta stout » et « pourquoi ? » ne s'écrivent plus (la ligne
// du pourquoi s'ouvre au doigt). Restes du critique corrigés : radar moins rose (moustache et « // » à l'encre),
// pont de la Frise nommé depuis le cas, Pomona sans forme de bouton dans Souche. Le reste est r6n2.
// Le premier écran garde r6a : le radar r2 au-dessus, trois colonnes de houblons lues en travers, une rangée
// par famille avec les barres de l5b face à ta 16D. Ajouts au repos : la réponse de y1b (« Face à ta stout,
// par [floral ⌄] »), qui classe les colonnes ; les flèches de ta demande sur le radar (h4) ; le « + » de p4.
// Tout le reste de l'inventaire (donnees/elements-notes.json) vit à UN toucher : un dock sous le pouce (la
// forme du dock de y1b) range six touchers, chacun ouvre une feuille basse. Rien ne s'ouvre seul.
// D103 : le radar ne remplit plus de bande. L'intervalle du houblon mis en avant est une moustache sur chaque
// axe, coupée au bord ; un haut hors domaine finit par le signe « coupé » (//) au bout de l'axe.
// Choix portés : Radar r2 ; Base dose égale ; Porte non ; Descripteurs A.
// Données : ../donnees/comparer-stout.json seul ; titres des références (H2, H22…) lus dans le fichier que ce
// JSON cite comme source des composés. Calculs faits ici : mises à l'échelle, différences en crans
// ((centre − ta stout) / cran du style), enveloppes de plages, mg/L × 1000 → µg/L, dose × volume (46 g),
// rapports de milieux de plage (duel), tirages uniformes dans la bande du moteur (marqués « ~ »). Rien d'autre.
// Usage : node work/refonte-frontend/v4/ecran-1/fils22-comparer/r6p2/generer.mjs → r6p2/etat.html
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
const VERT = '#2f6b4f';

// ---------- les houblons : les trois de la question, et Nelson Sauvin qu'on peut ajouter (« + ») ----------
const NOMS = ['Cascade', 'Idaho 7', 'Galaxy'];
const AJOUT = 'Nelson Sauvin';
const TOUS = [...NOMS, AJOUT];
// Une couleur par houblon : lots 20 et 21 (fils20-dryhop/donnees-h.json) ; Nelson Sauvin comme r6c.
const COUL = { Cascade: '#781838', 'Idaho 7': '#e80030', Galaxy: '#681878', 'Nelson Sauvin': '#0b6e63' };
const LETTRE = { Cascade: 'C', 'Idaho 7': 'I', Galaxy: 'G', 'Nelson Sauvin': 'N' };
const EG = D.egalites.doseEgale;
const HB = Object.fromEntries(TOUS.map((n) => [n, D.houblons.find((h) => h.nom === n)]));
const point = (n, o = {}) => HB[n].grille.find((g) => g.moment === (o.moment ?? EG.moment) && g.dose_gL === (o.dose ?? EG.dose_gL) && g.jours === (o.jours ?? EG.jours) && g.levure === (o.levure ?? EG.levure));
const PT = Object.fromEntries(TOUS.map((n) => [n, point(n)]));
const AV = D.biere.avant;
const BANDE = Object.fromEntries(ORDRE.map((f) => [f, D.style.zone[f].bande[1]]));
const DOM = Object.fromEntries(ORDRE.map((f) => [f, D.echelle.parFamille[f].domaine[1]]));
const CRAN = Object.fromEntries(ORDRE.map((f) => [f, D.echelle.parFamille[f].cran]));
const ABS = 125; // absolu : 0–125, pour voir le résineux au-dessus de 100
const valP = (p, f) => { const [bas, centre, haut] = p.apres[f]; return { bas, centre, haut }; };
const val = (n, f) => valP(PT[n], f);
const decrit = (n, f) => (HB[n].aromes.find((a) => a.family === f) || {}).sources > 0;
// Inconnu : rien de connu (0, 0, 0), ou une famille que ses fiches ne décrivent pas et que le moteur ne bouge pas.
const inconnu = (n, f) => { const v = val(n, f); return (v.bas === 0 && v.centre === 0 && v.haut === 0) || (PT[n].delta[f] === 0 && !decrit(n, f)); };
const TOUS_INC = ORDRE.filter((f) => TOUS.every((n) => inconnu(n, f)));
const LIGNES = ORDRE.filter((f) => !TOUS_INC.includes(f));
const dCran = (n, f) => (val(n, f).centre - AV[f].centre) / CRAN[f];
const hors = (n) => ORDRE.filter((f) => !inconnu(n, f) && val(n, f).centre > BANDE[f] && AV[f].centre <= BANDE[f]);
const VEUT = 'floral', TROP = D.biere.degustation.familles[0].famille;
const DEPART = NOMS.filter((n) => !hors(n).length).sort((a, b) => val(b, VEUT).centre - val(a, VEUT).centre)[0];
const dt = (d) => (d >= 0 ? '+' : '−') + fr(Math.abs(d), 1);
// Les critères de la pastille (y1b) : ta demande d'abord, puis les familles où les trois diffèrent le plus.
const CRIT = [
  { f: 'floral', s: 1, mot: 'floral' }, { f: 'citrus', s: 1, mot: 'agrumes' },
  { f: 'tropical', s: 1, mot: 'tropicaux' }, { f: 'resin', s: -1, mot: 'moins résineux' },
];

// ---------- α, rôle, stock : des fiches du JSON ----------
const env = (srcs) => [Math.min(...srcs.map((s) => s.min)), Math.max(...srcs.map((s) => s.max))];
const ALPHA = Object.fromEntries(TOUS.map((n) => {
  const a = HB[n].alpha, fiches = env(a.sources), r = a.retenu;
  const lot = r && r.from === 'fiche de stock' ? r.value : null;
  return [n, { lot, fiches, hors: lot != null && (lot < fiches[0] || lot > fiches[1]), srcs: a.sources.map((s) => s.source + (s.annee ? ' ' + s.annee : '')).join(', '), article: r && r.from !== 'fiche de stock' ? r.value : null }];
}));
const ROLE = Object.fromEntries(TOUS.map((n) => { const r = HB[n].role; return [n, { v: r.value, regle: /^règle/.test(r.source) }]; }));
const MOT_ROLE = { amérisant: 'amérisant', aromatique: 'aromatique', double: 'mixte' };
const pic = (f, w = 16, attrs = '') => `<svg class="pi" width="${w}" height="${w}" data-famille="${f}" ${attrs} role="img" aria-label="${NOM[f]}"><use href="#p-${f}"/></svg>`;
const pct = (x) => fr(x, 1) + '%';
function alphaHtml(n) {
  const A = ALPHA[n], pl = fr(A.fiches[0]) + '–' + pct(A.fiches[1]);
  if (A.lot != null) return `<span class="al lot" data-role="alpha" data-source="lot" data-nature="mesure" aria-label="α du lot en stock : ${fr(A.lot)} %${A.hors ? ' ; hors des plages de ses fiches (' + pl + ', ' + esc(A.srcs) + ')' : ''}">${pct(A.lot)}${A.hors ? ic('diff', 12) : ''}</span>`;
  return `<span class="al fi" data-role="alpha" data-source="fiches" data-nature="mesure" aria-label="α des fiches : ${pl} (${esc(A.srcs)})${A.article ? ' ; ' + fr(A.article) + ' % lu sur un article' : ''}">${ic('livre', 12)}<span class="r6p2-a3">${pl}</span><span class="r6p2-a4">${fr(A.fiches[0]) + '–' + fr(A.fiches[1], 0)}%</span></span>`;
}
const roleHtml = (n) => { const R = ROLE[n]; return `<span class="us us-mot${R.regle ? ' deduit' : ''}" data-role="usage" data-usage="${R.v}" data-source="${R.regle ? 'règle' : 'fournisseur'}" aria-label="Usage : ${MOT_ROLE[R.v]}${R.regle ? ', déduit de l’α, à valider' : ', attesté par le fournisseur'}"><span class="us-m">${MOT_ROLE[R.v]}</span></span>`; };
const stockHtml = (n) => (ALPHA[n].lot != null ? `<span class="w-stk" role="img" aria-label="lot en stock (α de sa fiche de stock)">${ic('stock', 14)}</span>` : '');
const famillesHtml = (n) => HB[n].aromes.filter((a) => a.sources > 0).sort((a, b) => b.level - a.level || ORDRE.indexOf(a.family) - ORDRE.indexOf(b.family)).slice(0, 5)
  .map((a) => pic(a.family, a.level >= 2 ? 16 : 13, `data-niveau="${a.level >= 2 ? 'marqué' : 'cité'}"`)).join('');
// Verdict face à la 16D, en signe (w2) : le mot vit dans l'aria-label et la légende, pour tenir les 80 mots.
function verdictHtml(n) {
  const h = hors(n);
  return h.length ? `<span class="r6p2-vd r6p2-vd-h" data-nature="simule" role="img" aria-label="~ sort de ta 16D : ${h.map((f) => NOM[f].toLowerCase()).join(', ')}">${ic('risque', 14)}${h.map((f) => pic(f, 13)).join('')}</span>`
    : `<span class="r6p2-vd r6p2-vd-d" data-nature="simule" role="img" aria-label="~ reste dans ta 16D, hors le résineux déjà au-dessus">${ic('ok', 14)}</span>`;
}

// ---------- une cellule : la barre de l5b, face à ta 16D (r6a) ----------
const P = (x) => Math.round(Math.max(0, x) * 1000) / 10 + '%';
const cl = (x) => Math.min(1, Math.max(0, x));
function geo(f, v, k) {
  const s = (x) => x / k;
  return { z: cl(s(BANDE[f])), gb: cl(Math.min(v.centre, BANDE[f]) / k), xo: v.centre > BANDE[f] ? cl(s(v.centre)) - cl(s(BANDE[f])) : 0, w0: cl(s(v.bas)), w1: cl(s(v.haut)), dep: s(v.centre) > 1, av: cl(s(AV[f].centre)) };
}
function cellule(n, f) {
  if (inconnu(n, f)) return `<span class="r6p2-cel r6p2-inc" data-col="${esc(n)}" role="img" aria-label="${NOM[f]}, ${esc(n)} : apport inconnu, pas zéro (famille absente de ses fiches)"><i class="r6p2-hach"></i></span>`;
  const v = val(n, f), g = geo(f, v, DOM[f]), a = geo(f, v, ABS), hs = v.centre > BANDE[f];
  const st = ['z', 'gb', 'xo', 'w0', 'w1', 'av'].map((k) => `--${k}:${P(g[k])};--${k}a:${P(a[k])}`).join(';') + `;--xb:${P(g.gb)};--xba:${P(a.gb)}`;
  const d = dCran(n, f);
  const montre = f === VEUT || f === TROP;
  return `<span class="r6p2-cel${hs ? ' r6p2-hs' : ''}${g.dep ? ' r6p2-dep' : ''}${a.dep ? ' r6p2-depa' : ''}" data-col="${esc(n)}" style="${st}" role="img" aria-label="${NOM[f]}, ${esc(n)} 4 g/L : ~ ${fr(v.centre, 0)} sur 100 (bande ${fr(v.bas, 0)}–${fr(v.haut, 0)}), ${dt(d)} cran${Math.abs(d) >= 2 ? 's' : ''} ; ta 16D jusqu’à ${BANDE[f]}${hs ? ' : au-dessus' : ''}">
    <span class="r6p2-pis"><i class="r6p2-zo" data-role="zone" data-famille="${f}"></i><i class="r6p2-ba" data-famille="${f}"></i><i class="r6p2-xo"></i><i class="r6p2-wh"></i><i class="r6p2-av"></i></span>${montre ? `<span class="r6p2-dl${hs ? ' r6p2-hors' : ''}" data-nature="simule">~${dt(d)}</span>` : ''}</span>`;
}
function rangee(f) {
  const dem = f === VEUT ? `<span class="r6p2-dem" aria-label="ta demande : plus de ${COURT[f].toLowerCase()}">${ic('haut', 12)}</span>` : f === TROP ? `<span class="r6p2-dem r6p2-trop" aria-label="ta dégustation : trop de ${COURT[f].toLowerCase()}">${ic('bas', 12)}</span>` : '';
  return `<div class="r6p2-rg${f === VEUT || f === TROP ? ' r6p2-demande' : ''}" data-famille-ligne="${f}"><span class="r6p2-rn" style="color:${JET[f].texte}">${pic(f, 16)}<span>${COURT[f]}</span>${dem}</span>${TOUS.map((n) => cellule(n, f)).join('')}</div>`;
}

// ---------- les têtes de colonne : le seul facteur libre (la variété) ----------
const tete = (n) => `<button type="button" role="radio" class="r6p2-tc${n === DEPART ? ' r6p2-sel' : ''}" data-col="${esc(n)}" aria-checked="${n === DEPART}" aria-label="Mettre en avant ${esc(n)} ; appui long : sa fiche" style="--h:${COUL[n]}" data-element="l5f-carte-role-alpha w2-cartes-verdict g1-fiche fiche-citra-cryo">
  <span class="r6p2-tn"><span class="r6p2-tst" role="img" aria-label="premier du classement">${ETOILE(11)}</span><i class="r6p2-pt" style="background:${COUL[n]}" aria-hidden="true"></i><span class="hn" data-houblon="${esc(n)}" data-couleur="${COUL[n]}">${esc(n)}</span>${stockHtml(n)}</span>
  <span class="r6p2-ta">${alphaHtml(n)}</span>
  <span class="r6p2-tr">${roleHtml(n)}${verdictHtml(n)}</span>
  <span class="r6p2-tf" aria-label="ses familles, d’après ses fiches">${famillesHtml(n)}</span></button>`;
const taStout = `<div class="r6p2-tc r6p2-tas">
  <span class="r6p2-tas-c" data-role="contexte" data-element="m4-radar-degustation" aria-label="Ta stout : trop résineuse, tu la veux plus florale (dégustation du 18.10)">
    <span class="r6p2-tn"><i class="r6p2-trait" aria-hidden="true"></i><b>Ta stout</b></span>
    <span class="r6p2-tas-l">${pic(TROP, 14)}<span>trop</span></span>
    <span class="r6p2-tas-l">${pic(VEUT, 14)}<span>plus</span></span></span>
  <button type="button" class="r6p2-plus" aria-label="Ajouter un houblon à la comparaison" aria-expanded="false" aria-controls="r6p2-f-ajout" data-element="p4-plus-comparaison">${ic('plus', 16)}</button></div>`;

// ---------- le radar r2, règle D103 : moustache coupée au bord, signe « coupé » (//) si le haut sort du domaine ----------
const RD = {
  axes: ORDRE, dom: ORDRE.map((f) => DOM[f]), bande: ORDRE.map((f) => BANDE[f]), abs: ABS, acc: ACC, vert: VERT,
  veut: ORDRE.indexOf(VEUT), trop: ORDRE.indexOf(TROP),
  av: ORDRE.map((f) => AV[f].centre), incTous: ORDRE.map((f) => TOUS_INC.includes(f)),
  h: TOUS.map((n) => ({ n, c: COUL[n], ce: ORDRE.map((f) => val(n, f).centre), ba: ORDRE.map((f) => val(n, f).bas), ha: ORDRE.map((f) => val(n, f).haut), inc: ORDRE.map((f) => inconnu(n, f)) })),
};
function radarSvg(R, sel, abs, nb) {
  const W = 358, H = 240, cx = W / 2, cy = 120, RR = 84, n = R.axes.length, pas = 2 * Math.PI / n, MAX = 1.06;
  const kk = (i, v) => Math.max(0, v / (abs ? R.abs : R.dom[i]));
  const k = (i, v) => Math.min(MAX, kk(i, v));
  const pt = (i, r) => [cx + Math.sin(i * pas) * RR * r, cy - Math.cos(i * pas) * RR * r];
  const rd = (x) => Math.round(x * 10) / 10;
  const P2 = (q) => rd(q[0]) + ',' + rd(q[1]);
  const pts = (rs) => rs.map((r, i) => P2(pt(i, r))).join(' ');
  const ring = (rs) => 'M' + rs.map((r, i) => P2(pt(i, r))).join('L') + 'Z';
  const u = (i) => [Math.sin(i * pas), -Math.cos(i * pas)], pp = (i) => [Math.cos(i * pas), Math.sin(i * pas)];
  const dec = (q, v, d) => [q[0] + v[0] * d, q[1] + v[1] * d];
  let s = '<svg data-radar="" data-objet="comparer" data-axes="' + R.axes.join(',') + '" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Radar ' + (abs ? 'absolu' : 'au style') + ' : ' + R.h[sel].n + ' plein, avec sa moustache d’incertitude ; les autres en contour ; zone pâle : ta 16D ; trait noir : ta stout">';
  s += '<defs><pattern id="r6p2-rh" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="#9aa0ab" stroke-width="1.2"/></pattern></defs>';
  R.axes.forEach((f, i) => { if (!R.incTous[i]) return; s += '<path d="M' + cx + ',' + cy + 'L' + P2(pt(i - 0.5, 1)) + 'L' + P2(pt(i + 0.5, 1)) + 'Z" fill="url(#r6p2-rh)" opacity=".7"/>'; });
  s += '<path data-role="zone" d="' + ring(R.bande.map((b, i) => Math.min(MAX, b / (abs ? R.abs : R.dom[i])))) + '" fill="rgba(47,107,79,.10)" stroke="#2f6b4f" stroke-width="1"/>';
  [0.5, 1].forEach((r) => { s += '<path d="' + ring(R.axes.map(() => r)) + '" fill="none" stroke="#dcdce3" stroke-width="1"/>'; });
  R.axes.forEach((f, i) => { s += '<line x1="' + cx + '" y1="' + cy + '" x2="' + rd(pt(i, 1)[0]) + '" y2="' + rd(pt(i, 1)[1]) + '" stroke="#dcdce3" stroke-width="1"/>'; });
  const ordre = [];
  for (let j = 0; j < nb; j++) if (j !== sel) ordre.push(j);
  ordre.push(sel);
  for (const j of ordre) {
    const h = R.h[j], plein = j === sel, ce = h.ce.map((v, i) => k(i, v));
    s += '<g data-serie="' + h.n + '" data-couleur="' + h.c + '" data-valeurs="' + h.ce.map((v) => rd(v)).join(',') + '" data-inconnues="' + R.axes.filter((f, i) => h.inc[i]).join(',') + '" class="' + (plein ? 'plein' : 'contour') + '">';
    s += '<polygon points="' + pts(ce) + '" fill="' + (plein ? h.c : 'none') + '" fill-opacity="' + (plein ? 0.16 : 0) + '" stroke="' + h.c + '" stroke-width="3" stroke-linejoin="round"/>';
    if (plein) {
      // La moustache : de bas à haut sur l'axe, coupée au bord ; le haut hors domaine finit par « // ».
      R.axes.forEach((f, i) => {
        if (h.inc[i]) return;
        const a = Math.min(1, kk(i, h.ba[i])), top = kk(i, h.ha[i]), b = Math.min(1, top);
        if (b - a > 0.01) s += '<line data-role="moustache" x1="' + rd(pt(i, a)[0]) + '" y1="' + rd(pt(i, a)[1]) + '" x2="' + rd(pt(i, b)[0]) + '" y2="' + rd(pt(i, b)[1]) + '" stroke="#16161a" stroke-opacity=".38" stroke-width="1.2"/>';
        const q = pt(i, b);
        // Coupé (//) au bout de l'axe : le haut sort de l'échelle ; sinon, un petit trait de fin.
        if (top > 1) [0.955, 1].forEach((r) => { const c0 = pt(i, r), a1 = dec(dec(c0, pp(i), 3), u(i), 1.5), a2 = dec(dec(c0, pp(i), -3), u(i), -1.5); s += '<line data-role="hors-domaine" x1="' + rd(a1[0]) + '" y1="' + rd(a1[1]) + '" x2="' + rd(a2[0]) + '" y2="' + rd(a2[1]) + '" stroke="#16161a" stroke-opacity=".6" stroke-width="1.5" stroke-linecap="round"/>'; });
        else s += '<line x1="' + rd(dec(q, pp(i), 3)[0]) + '" y1="' + rd(dec(q, pp(i), 3)[1]) + '" x2="' + rd(dec(q, pp(i), -3)[0]) + '" y2="' + rd(dec(q, pp(i), -3)[1]) + '" stroke="#16161a" stroke-opacity=".55" stroke-width="1.5"/>';
      });
      ce.forEach((r, i) => { const q = pt(i, r); s += h.inc[i] ? '<circle cx="' + rd(q[0]) + '" cy="' + rd(q[1]) + '" r="4" fill="#fff" stroke="#8a909b" stroke-width="1.5"/>' : '<circle cx="' + rd(q[0]) + '" cy="' + rd(q[1]) + '" r="3.4" fill="' + (r >= MAX ? R.acc : h.c) + '"/>'; });
    }
    s += '</g>';
  }
  s += '<polygon points="' + pts(R.av.map((v, i) => k(i, v))) + '" fill="none" stroke="#16161a" stroke-width="1.5" stroke-linejoin="round"/>';
  // Ta demande (h4) : vers l'extérieur sur la famille voulue plus, vers le centre sur la famille voulue moins.
  const fleche = (i, de, a, c) => { const t = pt(i, a), o = pt(i, de), dir = a > de ? u(i) : [-u(i)[0], -u(i)[1]], b = dec(t, dir, -5);
    return '<g data-role="demande"><line x1="' + rd(o[0]) + '" y1="' + rd(o[1]) + '" x2="' + rd(b[0]) + '" y2="' + rd(b[1]) + '" stroke="' + c + '" stroke-width="2" stroke-linecap="round"/><path d="M' + P2(t) + 'L' + P2(dec(b, pp(i), 3.5)) + 'L' + P2(dec(b, pp(i), -3.5)) + 'Z" fill="' + c + '"/></g>'; };
  s += fleche(R.veut, 1.08, 1.21, R.vert) + fleche(R.trop, 1.21, 1.08, R.acc);
  R.axes.forEach((f, i) => { const q = pt(i, 1.34); s += '<use href="#p-' + f + '" x="' + rd(q[0] - 8) + '" y="' + rd(q[1] - 8) + '" width="16" height="16"' + (R.incTous[i] ? ' opacity=".45"' : '') + '/>'; if (R.incTous[i]) s += '<text x="' + rd(q[0] + (q[0] >= cx ? 10 : -10)) + '" y="' + rd(q[1] + 4) + '" text-anchor="' + (q[0] >= cx ? 'start' : 'end') + '" class="r6p2-rq">?</text>'; });
  return s + '</svg>';
}
const radar0 = radarSvg(RD, TOUS.indexOf(DEPART), false, NOMS.length);

// ---------- les vraies valeurs et la chimie (r6a), dans les mêmes colonnes ----------
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
  return { lo: ouvertB ? 0 : lo, hi: hi ?? (ouvertH ? null : Math.max(...maxs)), ouvert: ouvertH, ouvertB, txt, ids: citer(vs.flatMap((v) => v.sources)), verif: vs.some((v) => v.aConfirmer) };
}
const cleSrc = (s) => (s.source === 'Beer Maverick' ? 'BM' : s.source === 'Hopsteiner' ? 'HS' : s.source);
// Plage par source (p03) : l'enveloppe, puis une fine barre par fiche, dépliée d'office dans la feuille.
const deSources = (srcs) => ({ lo: Math.min(...srcs.map((s) => s.min)), hi: Math.max(...srcs.map((s) => s.max)), txt: fr(Math.min(...srcs.map((s) => s.min)), 1) + '–' + fr(Math.max(...srcs.map((s) => s.max)), 1), ids: [...new Set(srcs.map((s) => { const k = cleSrc(s); CITES.set(k, s.source + (s.annee ? ' ' + s.annee : '')); return k; }))], parSource: srcs.map((s) => ({ k: cleSrc(s), lo: s.min, hi: s.max })) });
function vrangee({ cle, f, nom, unite, cells, compose = true, note = '', icone = 'huile' }) {
  const mil = cells.slice(0, 3).map((c) => (c ? (c.lo + (c.hi ?? c.lo * 1.6)) / 2 : null)), top = !note && mil.filter((x) => x != null).length >= 2 ? mil.indexOf(Math.max(...mil.filter((x) => x != null))) : -1;
  const hauts = cells.filter(Boolean).map((c) => c.hi ?? c.lo * 1.6);
  const mx = Math.max(...hauts) * 1.08 || 1;
  const x = (v) => ((v / mx) * 100).toFixed(1) + '%';
  const cel = (n, c, i) => {
    if (!c) return `<span class="r6p2-vc r6p2-vc-inc" data-col="${esc(n)}"><i class="r6p2-hach"></i><span class="r6p2-vi">inconnu</span></span>`;
    const l = (c.lo / mx) * 100, r = ((c.hi ?? mx) / mx) * 100;
    const fines = (c.parSource || []).map((p) => `<span class="r6p2-vs"><i style="left:${x(p.lo)};width:${Math.max(2, ((p.hi - p.lo) / mx) * 100).toFixed(1)}%"></i><b>${p.k}</b></span>`).join('');
    return `<span class="r6p2-vc${c.verif ? ' r6p2-verif' : ''}${i === top ? ' r6p2-max' : ''}" data-col="${esc(n)}" style="--c:${COUL[n]}"><span class="r6p2-vt"><span class="r6p2-vv mono" data-nature="mesure" data-source="${esc(c.ids.map((k) => CITES.get(k) || k).join(' ; '))}">${c.txt}</span>${c.lot != null ? `<i class="r6p2-lotm" aria-label="ton lot ${fr(c.lot, 1)} %"></i>` : ''}</span><span class="r6p2-vb"><i class="r6p2-vbr${c.ouvert ? ' r6p2-ouvert' : ''}" style="left:${l.toFixed(1)}%;width:${Math.max(3, r - l).toFixed(1)}%"></i>${c.lot != null ? `<i class="r6p2-vlot" style="left:${x(c.lot)}"></i>` : ''}</span>${fines}<span class="r6p2-vr">${c.parSource ? '' : c.ids.join(' ')}${c.verif ? ' · à confirmer' : ''}${c.note ? ' · ' + c.note : ''}</span></span>`;
  };
  return `<div class="r6p2-vg"${compose ? ` data-compose="${cle}"` : ''}><span class="r6p2-vn">${f ? pic(f, 16) : ic(icone, 16)}<span><b>${nom}</b><span class="r6p2-vu">${unite}</span></span></span>${TOUS.map((n, i) => cel(n, cells[i], i)).join('')}${note ? `<p class="r6p2-vnote">${note}</p>` : ''}</div>`;
}
const CPD = (n, k) => plageDe(((HB[n].composes.composes || {})[k] || {}).valeurs);
const alphaRow = vrangee({ cle: 'alpha', nom: 'α', unite: '% masse', compose: false, icone: 'livre', cells: TOUS.map((n) => ({ ...deSources(HB[n].alpha.sources), lot: ALPHA[n].lot })) });
const betaRow = vrangee({ cle: 'beta', nom: 'β', unite: '% masse', compose: false, icone: 'livre', cells: TOUS.map((n) => deSources(HB[n].beta.sources)) });
const huileRow = vrangee({ cle: 'huile', nom: 'huile', unite: 'mL/100 g', cells: TOUS.map((n) => plageDe(HB[n].composes.huile.valeurs)) });
const CHIM = [['myrcene', 'resin', 'myrcène', '% huile'], ['linalol', 'floral', 'linalol', '% huile'], ['geraniol', 'floral', 'géraniol', '% huile'],
  ['humulene', 'herbal', 'humulène', '% huile'], ['caryophyllene', 'spice', 'caryo­phyllène', '% huile'], ['4MMP', 'tropical', '4MMP', 'µg/kg']];
const CHIMIE = CHIM.map(([k, f, nom, u]) => vrangee({ cle: k, f, nom, unite: u, cells: TOUS.map((n) => CPD(n, k)) }));
const linCas = HB.Cascade.composes.mesuresEnBiere.find((m) => m.id === 'kishimoto-linalol');
const e03 = HB['Idaho 7'].panels.find((p) => p.id === 'E03'), linI7 = e03.mesures.find((m) => m.variete === 'Idaho-7' && m.compose === 'linalol');
CITES.set('E03', 'McCabe 2023');
const enBiere = vrangee({ cle: 'linalol-biere', f: 'floral', nom: 'linalol en bière', unite: 'µg/L', cells: [
  { lo: linCas.plage[0], hi: linCas.plage[1], txt: fr(linCas.plage[0], 1), ids: citer(linCas.sources), note: fr(linCas.doseGL, 0) + ' g/L, moût' },
  { lo: (linI7.valeur - linI7.ecart) * 1000, hi: (linI7.valeur + linI7.ecart) * 1000, txt: fr(linI7.valeur * 1000, 0) + '±' + fr(linI7.ecart * 1000, 0), ids: ['E03'], verif: true, note: 'au pitch' },
  null, null], note: 'Pas comparables entre eux : doses, moments et bières diffèrent.' });

// Le duel de v1 (« X en a plus | Y en a plus », ⇄) : milieux de plage par composé, rapport écrit.
const DUEL = [['4MMP', 'tropical', '4MMP'], ['linalol', 'floral', 'linalol'], ['geraniol', 'floral', 'géraniol'], ['myrcene', 'resin', 'myrcène'], ['humulene', 'herbal', 'humulène'], ['caryophyllene', 'spice', 'caryophyllène']]
  .map(([k, f, nom]) => ({ k, f, nom, v: Object.fromEntries(TOUS.map((n) => { const c = CPD(n, k); return [n, c ? (c.ouvertB ? { borne: true } : { m: c.hi != null ? (c.lo + c.hi) / 2 : c.lo, ouvert: c.hi == null }) : null]; })) }))
  .concat([{ k: 'huile', f: null, nom: 'huile totale', v: Object.fromEntries(TOUS.map((n) => { const c = plageDe(HB[n].composes.huile.valeurs); return [n, c ? (c.ouvertB ? { borne: true } : { m: c.hi != null ? (c.lo + c.hi) / 2 : c.lo, ouvert: c.hi == null }) : null]; })) }]);

// Ce que disent les fiches (p06) : marqué, cité, non décrit, et le nombre de fiches.
const NIV = (n, f) => HB[n].aromes.find((a) => a.family === f) || { level: 0, sources: 0, of: 0 };
const grilleFiches = `<div class="r6p2-fg" data-element="p06-grille-familles" aria-label="Ce que disent les fiches">
  <div class="r6p2-fgh"><b>Ce que disent les fiches</b><span><i class="r6p2-fk r6p2-fk2"></i>marqué</span><span><i class="r6p2-fk r6p2-fk1"></i>cité</span><span><i class="r6p2-fk r6p2-fk0"></i>non décrit</span></div>
  ${ORDRE.map((f) => `<div class="r6p2-fr${D.style.zone[f].statut === 'attendue' ? ' r6p2-f16' : ''}"><span class="r6p2-fn" style="color:${JET[f].texte}">${pic(f, 14)}<span>${COURT[f]}</span></span>${TOUS.map((n) => { const a = NIV(n, f); return `<span class="r6p2-fc" data-col="${esc(n)}"><i class="r6p2-fk r6p2-fk${Math.min(2, a.level)}" data-famille="${f}"></i>${a.sources ? `<span class="mono">${a.sources}/${a.of}</span>` : ''}</span>`; }).join('')}</div>`).join('')}
  <p class="r6p2-fnote">Gras : attendues dans la 16D. Descripteurs A : « groseille à maquereau » rangée dans Petits fruits (seul Nelson Sauvin a ce mot).</p></div>`;
const sourcesTxt = () => [...CITES.entries()].sort((a, b) => a[0].localeCompare(b[0], 'fr', { numeric: true })).map(([k, t]) => `<span><b>${esc(k)}</b> ${esc(t)}</span>`).join('');

// ---------- le panel OSU (Cascade, mesuré), sans molette ----------
const O = D.panelOSU;
function osuSvg() {
  const W = 340, H = 128, x0 = 30, x1 = W - 96, y0 = 10, y1 = H - 22, xs = O.doses.map((d, i) => x0 + (x1 - x0) * i / (O.doses.length - 1));
  const y = (v) => y1 - (y1 - y0) * v / 15, rd = (v) => Math.round(v * 10) / 10;
  let s = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Panel OSU, Cascade : agrumes, herbacé/thé et intensité selon la dose, sur 15">`;
  s += `<rect x="${xs[2]}" y="${y0}" width="${xs[3] - xs[2]}" height="${y1 - y0}" fill="#ececf1"/>`;
  for (const v of [0, 5, 10, 15]) s += `<line x1="${x0}" x2="${x1}" y1="${rd(y(v))}" y2="${rd(y(v))}" stroke="#dcdce3"/><text x="${x0 - 6}" y="${rd(y(v) + 4)}" text-anchor="end" class="r6p2-ot">${v}</text>`;
  O.doses.forEach((d, i) => { s += `<text x="${rd(xs[i])}" y="${H - 6}" text-anchor="middle" class="r6p2-ot">${fr(d, 2)}</text>`; });
  s += `<line x1="${rd(xs[2])}" x2="${rd(xs[2])}" y1="${y0 - 4}" y2="${y1}" stroke="#16161a" stroke-width="2"/>`;
  const serie = (vals, c, nom) => `<polyline points="${vals.map((v, i) => rd(xs[i]) + ',' + rd(y(v))).join(' ')}" fill="none" stroke="${c}" stroke-width="2.5" stroke-linejoin="round"/>${vals.map((v, i) => `<circle cx="${rd(xs[i])}" cy="${rd(y(v))}" r="3" fill="#fff" stroke="${c}" stroke-width="2"/>`).join('')}<text x="${x1 + 8}" y="${rd(y(vals[vals.length - 1]) + 4)}" class="r6p2-ol" fill="${c}">${nom} ${fr(vals[vals.length - 1], 1)}</text>`;
  s += serie(O.intensite, '#16161a', 'intensité') + serie(O.herbaceThe, JET.herbal.texte, 'herbacé') + serie(O.agrumes, JET.citrus.texte, 'agrumes');
  return s + '</svg>';
}
const h22 = court(O.sources[0]), h77 = court(O.complement.sources[0]);
CITES.set(O.sources[0], h22); CITES.set(O.complement.sources[0], h77);

// ---------- le défi (y1b), les pistes d'objectif (l5b, w2), les signes de verdict (l8b) ----------
const VISEE = 1; // un cran du style
const OBJ = [{ f: VEUT, s: 1, titre: 'Plus floral', echelle: 'style' }, { f: TROP, s: -1, titre: 'Moins résineux', echelle: 'absolu' }];
const verdictObj = (n, o) => { if (inconnu(n, o.f)) return 'inconnu'; const d = dCran(n, o.f) * o.s; return d >= VISEE ? 'atteint' : d >= 0.5 ? 'approche' : 'aucune'; };
const MOT_V = { atteint: 'Atteint', approche: 'Approche', aucune: 'Aucune', inconnu: 'inconnu' };
const signe = (v, z = 16) => (v === 'inconnu' ? '<i class="r6p2-hach r6p2-hach-s" aria-hidden="true"></i>' : ic(v, z));
const SCORE = Object.fromEntries(TOUS.map((n) => [n, OBJ.filter((o) => verdictObj(n, o) === 'atteint').length + (hors(n).length ? 0 : 1)]));
function piste(o) {
  const k = o.echelle === 'absolu' ? ABS : DOM[o.f];
  const p = (x) => (Math.min(1.03, Math.max(0, x / k)) * 100).toFixed(1) + '%';
  const av = AV[o.f].centre, vis = av + o.s * VISEE * CRAN[o.f], zone = BANDE[o.f];
  // Les repères de w2 : un rond lettré par houblon sur la même piste ; deux trop proches passent au-dessus.
  const tri = TOUS.map((n) => ({ n, x: val(n, o.f).centre / k })).sort((a, b) => a.x - b.x);
  const fin = [-1, -1, -1];
  for (const r of tri) { const g = fin.map((f) => r.x - f); r.l = g.findIndex((x) => x > 0.06); if (r.l < 0) r.l = g.indexOf(Math.max(...g)); fin[r.l] = r.x; }
  const barres = TOUS.map((n) => { const c = val(n, o.f).centre, zf = Math.min(100, (zone / Math.max(c, 0.01)) * 100); return `<i class="r6p2-pb" data-col="${esc(n)}" style="width:${p(c)};background:linear-gradient(90deg,var(--b) ${zf.toFixed(1)}%,${ACC} ${zf.toFixed(1)}%)" data-famille="${o.f}"></i>`; }).join('');
  return `<div class="r6p2-ps" data-famille="${o.f}">
    <i class="r6p2-pz" data-famille="${o.f}" style="width:${p(zone)}"></i>${barres}
    <i class="r6p2-pav" style="left:${p(av)}" aria-label="ta stout"></i><i class="r6p2-pvi" style="left:${p(vis)}"></i><span class="r6p2-pvl" style="left:${p(vis)}">visée</span>
    ${tri.map((r) => `<span class="r6p2-rp${r.l ? ' r6p2-rp-' + r.l : ''}" data-col="${esc(r.n)}" style="left:${p(val(r.n, o.f).centre)};--h:${COUL[r.n]}" aria-label="${esc(r.n)} : ~${fr(val(r.n, o.f).centre, 0)}">${LETTRE[r.n]}</span>`).join('')}</div>`;
}
const objCarte = (o) => {
  const d = (n) => dCran(n, o.f);
  return `<div class="r6p2-ob" data-role="objectif" data-famille="${o.f}" style="--t:${JET[o.f].texte}">
  <div class="r6p2-obt">${ic(o.s > 0 ? 'haut' : 'bas', 14)}${pic(o.f, 16)}<b>${o.titre}</b><span class="r6p2-obv">visée ${o.s > 0 ? '+' : '−'}1 cran${o.echelle === 'absolu' ? ', absolu' : ''}</span></div>
  ${piste(o)}
  <div class="r6p2-obh">${TOUS.map((n) => { const v = verdictObj(n, o); return `<span class="r6p2-obx r6p2-v-${v}" data-col="${esc(n)}">${signe(v, 14)}<span><i class="r6p2-pt" style="background:${COUL[n]}"></i>${MOT_V[v]}</span><b class="mono">~${dt(d(n))}</b></span>`; }).join('')}</div>
  ${o.s < 0 ? '<p class="r6p2-obn">Les trois en ajoutent : le résineux se règle hors houblon (Nugget, levure, garde).</p>' : ''}</div>`;
};
const AJ = D.biere.recette.ajouts[0];
const nuggetG = Math.round(AJ.dose_gL * D.biere.recette.volumeL);
const IBU10 = D.egalites.ibuEgal.find((x) => x.moment === 'b10'), IBUWP = D.egalites.ibuEgal.find((x) => x.moment === 'wp');
const mxIbu = Math.max(...TOUS.map((n) => IBUWP.doses[n]));
const amertume = `<div class="r6p2-ob" data-role="objectif" data-element="y1b-jauge-amertume">
  <div class="r6p2-obt">${ic('goutte', 14)}<b>Amertume tenue</b><span class="r6p2-obv">${signe('inconnu')} à cru : inconnu</span></div>
  <div class="r6p2-jg" aria-label="Amertume de ta stout"><span class="r6p2-jg-n">${AJ.nom} 60′ · ${nuggetG} g</span><span class="r6p2-jg-h"><i class="r6p2-hach"></i>+ ?</span></div>
  <p class="r6p2-obn">${AJ.nom} à 60′ fait l’amertume. À cru, l’apport des trois n’est pas modélisé : écrit ?, jamais compté 0.</p>
  <div class="r6p2-ibu"><span class="r6p2-ibu-t">Même amertume en ébullition ${S.conf('calcule')}</span>${TOUS.map((n) => `<span class="r6p2-ibu-r" data-col="${esc(n)}"><i class="r6p2-pt" style="background:${COUL[n]}"></i><span class="r6p2-ibu-n">${esc(n)}</span><span class="r6p2-ibu-b"><i style="width:${((IBU10.doses[n] / mxIbu) * 100).toFixed(1)}%;background:${COUL[n]}"></i></span><b class="mono">${fr(IBU10.doses[n], 2)} g/L</b></span>`).join('')}<span class="r6p2-ibu-s">pour ${IBU10.ibu} IBU à 10′, ${IBU10.volumeL} L : plus l’α est haut, moins il en faut.</span></div></div>`;
const style16 = `<div class="r6p2-ob" data-role="objectif"><div class="r6p2-obt">${ic('cible', 14)}<b>Dans ta 16D</b><span class="r6p2-obv">~ simulé</span></div>
  <div class="r6p2-obh">${TOUS.map((n) => { const h = hors(n); return `<span class="r6p2-obx r6p2-v-${h.length ? 'aucune' : 'atteint'}" data-col="${esc(n)}">${h.length ? ic('risque', 14) : ic('atteint', 14)}<span><i class="r6p2-pt" style="background:${COUL[n]}"></i>${h.length ? 'sort' : 'dedans'}</span>${h.map((f) => pic(f, 14)).join('')}</span>`; }).join('')}</div></div>`;
const MEILLEUR = NOMS.slice().sort((a, b) => dCran(b, VEUT) - dCran(a, VEUT))[0];
const defi = `<div class="r6p2-fc-c" data-element="y1b-defi">
  <p class="r6p2-cit">« ${esc(D.biere.degustation.citation)} » <span>ta dégustation du ${D.biere.degustation.date.split('-').reverse().slice(0, 2).join('.')}</span></p>
  <div class="r6p2-score">${TOUS.map((n) => `<span class="r6p2-sc" data-col="${esc(n)}" style="--h:${COUL[n]}"><i class="r6p2-pt" style="background:${COUL[n]}"></i>${esc(n)}<b class="mono">${SCORE[n]} sur 4</b></span>`).join('')}</div>
  <div class="r6p2-obs" data-element="l5b-pistes-objectif w2-piste-commune l8b-verdicts-pictos-trait">${OBJ.map(objCarte).join('')}</div>
  ${amertume}${style16}
  <div class="r6p2-pont" data-element="s5-deux-objectifs">
    <div class="r6p2-s5"><span class="r6p2-s5p" style="--t:${JET[TROP].texte}">${pic(TROP, 14)}<span>Moins résineux</span><b>${ic('aucune', 14)}Aucune <small>voie houblon</small></b></span><span class="r6p2-s5p" style="--t:${JET[VEUT].texte}">${pic(VEUT, 14)}<span>Plus floral</span><b>${ic('atteint', 14)}${esc(MEILLEUR)}</b></span></div>
    <a href="#suggerer" class="r6p2-lien" data-outil="Suggérer">${ic('idee', 16)}<span>Toutes les voies pour tes deux objectifs : <b>Suggérer</b></span>${ic('fleche', 16)}</a></div></div>`;

// ---------- égaler (y3) : la dose d'un autre houblon pour le même effet ----------
const EF = D.egalites.effetEgal;
const egalBloc = (e) => {
  const mx = 8, ref = e.reference.nom;
  return `<div class="r6p2-eg"><div class="r6p2-egt">${pic(e.famille, 16)}<span>les ${COURT[e.famille].toLowerCase()} de <b>${esc(ref)} ${fr(e.reference.dose_gL)} g/L</b></span><span class="r6p2-egc mono">~${fr(e.cible, 0)} sur 100</span></div>
  ${TOUS.map((n) => { const d = e.doses[n]; return `<span class="r6p2-egr" data-col="${esc(n)}"><i class="r6p2-pt" style="background:${COUL[n]}"></i><span class="r6p2-egn">${esc(n)}</span>${d == null ? `<span class="r6p2-egb"><i class="r6p2-hach r6p2-hach-l"></i></span><b class="r6p2-egv r6p2-jamais">~jamais, même à 8 g/L</b>` : `<span class="r6p2-egb"><i style="width:${((d / mx) * 100).toFixed(1)}%;background:${JET[e.famille].base}" data-famille="${e.famille}"></i><i class="r6p2-eg4"></i></span><b class="r6p2-egv mono">${n === ref ? '' : '~'}${fr(d, 1)} g/L${n === ref ? ' · réf.' : ''}</b>`}</span>`; }).join('')}</div>`;
};
const egaler = `<div class="r6p2-fc-c" data-element="y3-pour-egaler">
  <p class="r6p2-sub">Pour égaler… il faudrait, après fermentation, 3 j, US-05 ${S.conf('simule')}</p>
  ${EF.map(egalBloc).join('')}
  <div class="r6p2-eg"><div class="r6p2-egt">${ic('goutte', 16)}<span>la même amertume en ébullition</span>${S.conf('calcule')}</div>
  ${TOUS.map((n) => `<span class="r6p2-egr" data-col="${esc(n)}"><i class="r6p2-pt" style="background:${COUL[n]}"></i><span class="r6p2-egn">${esc(n)}</span><span class="r6p2-egi mono">${fr(IBU10.doses[n], 2)} g/L <small>${IBU10.ibu} IBU à 10′</small></span><span class="r6p2-egi mono">${fr(IBUWP.doses[n], 2)} g/L <small>${IBUWP.ibu} IBU au whirlpool</small></span></span>`).join('')}</div>
  <p class="r6p2-sub">Trait : 4 g/L, ta dose égale. Échelle 0–8 g/L, la grille du moteur ; au-delà, inconnu.</p></div>`;

// ---------- preuve : le mesuré (panel OSU) et vingt bières tirées dans la bande du simulé ----------
const preuve = `<section class="r6p2-osu" data-acquis="osu" data-element="y3-panel-osu" data-nature="mesure" data-source="${esc(O.sources[0] + ' : ' + h22)}" aria-label="Panel OSU">
    <div class="r6p2-osu-t">${ic('panel', 16)}<b>Panel OSU, Cascade</b>${S.conf('panel')}<span class="r6p2-osu-u">sur 15, g/L</span></div>
    ${osuSvg()}
    <p class="r6p2-osu-n"><span><i class="r6p2-ld"></i>${fr(O.doses[2], 2)} g/L ≈ ta dose égale</span><span><i class="r6p2-lz"></i>4–8 g/L : retenu par les auteurs</span></p>
    <p class="r6p2-osu-n">Agrumes : plafond dès 8 g/L ; l’herbacé monte encore. <b>Idaho 7, Galaxy, Nelson Sauvin : pas de panel publié.</b></p>
    <p class="r6p2-osu-s">${O.sources[0]} ${esc(h22)} · ${O.complement.sources[0]} ${esc(h77)} : 10 contre 15 g/L non distingués.</p>
  </section>
  <section class="r6p2-tir" data-element="y1b-tirage-preuve" aria-label="Vingt bières tirées">
    <div class="r6p2-osu-t">${ic('biere', 16)}<b>20 bières tirées</b>${S.conf('simule')}<button type="button" class="r6p2-retire" id="r6p2-retire">${ic('retourner', 14)}<span>20 autres</span></button></div>
    <p class="r6p2-sub">Combien sortent de ta 16D, famille par famille. Tirées au hasard dans la bande du moteur ; une plage ouverte compte comme un minimum.</p>
    <div id="r6p2-tir-g"></div></section>`;

// ---------- frise (pont Dryhopper) : le moment fixé, jour après jour, le second houblon ----------
const JOURS = [1, 2, 3, 5, 7];
function friseSvg() {
  const W = 340, H = 92, y = 58, X = { b60: 12, b10: 72, wp: 140, dryActive: 214, dryPost: 272, puis: 324 };
  const LIB = { b60: '60′', b10: '10′', wp: 'whirlpool', dryActive: 'actif', dryPost: 'après', puis: 'puis' };
  let s = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Frise du brassin : les trois houblons après fermentation, 3 jours ; le moment est fixé ici">`;
  s += `<line x1="8" x2="${W - 8}" y1="${y}" y2="${y}" stroke="#c8c8d0" stroke-width="3" stroke-linecap="round"/>`;
  for (let m = 0; m <= 10; m++) { const xx = 12 + m * 6; s += `<line x1="${xx}" x2="${xx}" y1="${y - 4}" y2="${y + 4}" stroke="#8a909b" stroke-width="1.5"/>`; }
  Object.entries(X).forEach(([k, xx]) => { s += `<line x1="${xx}" x2="${xx}" y1="${y - 7}" y2="${y + 7}" stroke="#16161a" stroke-width="1.5"/><text x="${xx}" y="${y + 24}" text-anchor="middle" class="r6p2-ft${k === 'dryPost' ? ' r6p2-ft-on' : ''}">${LIB[k]}</text>`; });
  TOUS.forEach((n, i) => { s += `<g data-col="${esc(n)}"><circle cx="${X.dryPost}" cy="${y - 14 - i * 15}" r="7" fill="${COUL[n]}"/></g>`; });
  s += `<circle cx="${X.puis}" cy="${y - 14}" r="7" fill="#fff" stroke="#8a909b" stroke-width="1.5" stroke-dasharray="2 2"/><text x="${X.puis}" y="${y - 10}" text-anchor="middle" class="r6p2-ft">+</text>`;
  return s + '</svg>';
}
// ---------- souche (pont Levure) : ce que la cuve apporte, ce que Pomona change (a2b) ----------
// M07 (calculé avant de dessiner) : après fermentation, Pomona − US-05 = 0 exactement sur les douze familles,
// pour les quatre houblons ; en dry hop actif, Idaho 7 agrumes ~+1,3 cran, Cascade ~+0,4, Galaxy et Nelson rien.
const POM = Object.fromEntries(TOUS.map((n) => [n, point(n, { levure: 'lalbrew-pomona' })]));
const ACT = Object.fromEntries(TOUS.map((n) => [n, point(n, { moment: 'dryActive' })]));
const ACTP = Object.fromEntries(TOUS.map((n) => [n, point(n, { moment: 'dryActive', levure: 'lalbrew-pomona' })]));
const POST_POM_NUL = TOUS.every((n) => ORDRE.every((f) => valP(POM[n], f).centre === val(n, f).centre));
const dPom = (n, f) => (valP(ACTP[n], f).centre - valP(ACT[n], f).centre) / CRAN[f];
const puces = (n, d, seuil = 0.1, k = 3) => { const l = LIGNES.filter((f) => !inconnu(n, f)).map((f) => ({ f, d: d(n, f) })).filter((x) => Math.abs(x.d) >= seuil).sort((a, b) => Math.abs(b.d) - Math.abs(a.d)).slice(0, k);
  return l.length ? l.map((x) => `<span class="r6p2-pu${x.d < 0 ? ' r6p2-pu-m' : ''}" style="color:${JET[x.f].texte}">${pic(x.f, 14)}<b class="mono">~${dt(x.d)}</b></span>`).join('') : '<span class="r6p2-pu r6p2-rien">≈ rien</span>'; };
const ligneH = (n, corps) => `<div class="r6p2-lh" data-col="${esc(n)}"><span class="r6p2-lhn"><i class="r6p2-pt" style="background:${COUL[n]}"></i>${esc(n)}</span><span class="r6p2-lhp">${corps}</span></div>`;
const actifLigne = (n) => ligneH(n, puces(n, (m, f) => (valP(ACT[m], f).centre - val(m, f).centre) / CRAN[f]));
const joursLigne = (n) => { const f = VEUT, j1 = valP(point(n, { jours: 1 }), f).centre, j2 = valP(point(n, { jours: 2 }), f).centre, j7 = valP(point(n, { jours: 7 }), f).centre;
  if (Math.abs(j7 - j2) > 0.05) throw new Error('Frise : de 2 à 7 j le floral bouge pour ' + n);
  return ligneH(n, `<span class="r6p2-pu" style="color:${JET[f].texte}">${pic(f, 14)}<span class="mono">1 j ~${fr(j1, 1)}</span>${ic('fleche', 12)}<span class="mono">2 à 7 j ~${fr(j2, 1)}</span></span>`); };
const pomLigne = (n) => ligneH(n, puces(n, dPom));
const pomMax = TOUS.map((n) => ({ n, m: Math.max(...LIGNES.map((f) => Math.abs(dPom(n, f)))) })).sort((a, b) => b.m - a.m)[0].n;
if (pomMax !== 'Idaho 7') throw new Error('Souche : la phrase dit Idaho 7, les données disent ' + pomMax);
const soucheTable = (n) => `<div class="r6p2-so" data-col="${esc(n)}"><div class="r6p2-soh"><span></span><span>la cuve apporte, ici</span><span>Pomona, en actif</span></div>
  ${LIGNES.filter((f) => !inconnu(n, f)).map((f) => { const c = dCran(n, f), pm = dPom(n, f), mx = 3;
    const bar = (d, cls) => `<span class="r6p2-sob"><i class="${cls}" style="width:${(Math.min(1, Math.abs(d) / mx) * 100).toFixed(1)}%" data-famille="${f}"></i><b class="mono">${Math.abs(d) < 0.05 ? '≈ 0' : '~' + dt(d)}</b></span>`;
    return `<div class="r6p2-sor"><span class="r6p2-fn" style="color:${JET[f].texte}">${pic(f, 14)}<span>${COURT[f]}</span></span>${bar(c, 'r6p2-sob-c')}${bar(pm, 'r6p2-sob-p')}</div>`; }).join('')}</div>`;
const souche = `<div class="r6p2-fc-c" data-element="y1b-levure-pastilles a2b-ce-que-la-levure-change">
  <p class="r6p2-sub">Ici, la souche est fixée : <b>US-05</b> ; Pomona en aperçu ${S.conf('simule')}</p>
  <p class="r6p2-dit">${POST_POM_NUL ? 'Après fermentation, la levure est au repos : Pomona ne change rien, pour aucun des houblons.' : 'Après fermentation, Pomona change peu.'} En dry hop actif, elle réveille surtout Idaho 7 :</p>
  <div class="r6p2-jr">${TOUS.map(pomLigne).join('')}<p class="r6p2-sub">Pomona au lieu d’US-05, ajout pendant la fermentation active, 4 g/L, 3 j ; en crans du style.</p></div>
  ${TOUS.map(soucheTable).join('')}
  <a href="#levure" class="r6p2-lien" data-outil="Levure">${ic('levure', 16)}<span>Changer de souche, voir ce qu’elle fait : <b>Levure</b></span>${ic('fleche', 16)}</a></div>`;

const frise = `<div class="r6p2-fc-c" data-element="y1b-dock-pouce y1b-second-houblon-puis x3b-cuve-jour-apres-jour">
  ${friseSvg()}
  <p class="r6p2-sub">Ici, le moment est fixé : les trois après fermentation, 3 j. La frise se glisse au doigt dans Dryhopper ; « + » enchaîne un second houblon (puis).</p>
  <div class="r6p2-jr"><div class="r6p2-osu-t">${ic('cuveA', 16)}<b>Ce qui bouge là-bas : en actif</b>${S.conf('simule')}</div>
    <p class="r6p2-sub">Le même ajout pendant la fermentation active au lieu d’après, en crans du style. Le résineux baisse : ta demande se joue aussi là.</p>
    ${TOUS.map(actifLigne).join('')}</div>
  <div class="r6p2-jr"><div class="r6p2-osu-t">${ic('sablier', 16)}<b>Jour après jour</b>${S.conf('simule')}</div>
    <p class="r6p2-sub">À 4 g/L, le moteur ne distingue que le premier jour : de 2 à 7 j, même profil. Le floral, sur 100 :</p>
    ${TOUS.map(joursLigne).join('')}</div>
  <a href="#dryhopper" class="r6p2-lien" data-outil="Dryhopper">${ic('cuveP', 16)}<span>Glisser le moment, enchaîner ${esc(DEPART)} puis ${esc(NOMS.find((n) => n !== DEPART && hors(n).length) || NOMS.find((n) => n !== DEPART))} : <b>Dryhopper</b></span>${ic('fleche', 16)}</a></div>`;

// ---------- ajouter (p4, carte l5f) : Nelson Sauvin, le seul autre houblon des données ----------
const partA = D.descripteurs.A.effets[AJOUT].partSansFamilleA;
const sansMots = [...new Set(HB[AJOUT].motsSansFamille.map((m) => m.mot.toLowerCase()))].filter((w) => !D.descripteurs.A.effets[AJOUT].deplaces.map((x) => x.toLowerCase()).includes(w));
const ajout = `<div class="r6p2-fc-c">
  <div class="r6p2-carte" style="--h:${COUL[AJOUT]}"><div class="r6p2-tn"><i class="r6p2-pt" style="background:${COUL[AJOUT]}"></i><b>${AJOUT}</b>${ALPHA[AJOUT].lot != null ? stockHtml(AJOUT) : `<span class="r6p2-achat" role="img" aria-label="pas en stock">${ic('achat', 14)}</span>`}</div>
    <div class="r6p2-carte-l">${alphaHtml(AJOUT)}${roleHtml(AJOUT)}${famillesHtml(AJOUT)}</div>
    <div class="r6p2-part" aria-label="Part de ses mots sans famille"><span class="r6p2-part-b"><i style="width:${(partA * 100).toFixed(0)}%"></i></span><span><b class="mono">${fr(partA * 100, 0)} %</b> de ses mots hors des 12 familles : ${sansMots.slice(0, 5).map(esc).join(', ')}</span></div>
    <p class="r6p2-sub">Ses fiches le décrivent surtout hors familles : ses barres paraîtront maigres, son vin blanc n’y est pas.</p></div>
  <button type="button" class="r6p2-ajb" id="r6p2-ajb">${ic('plus', 16)}<span>Ajouter ${AJOUT} à la comparaison</span></button></div>`;

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
const FICHES = Object.fromEntries(TOUS.map((n) => [n, ficheDe(n)]));
const DEMANDE = [{ f: VEUT, s: 1 }, { f: TROP, s: -1 }];
const rt = runtime({ extra: '' })
  .replace(/const FD = [^\n]*;\nconst ROUE/, () => 'const FD = ' + JSON.stringify(FICHES) + ';\nconst ROUE')
  .replace(/DEMANDE = \[[^\]]*\]/, () => 'DEMANDE = ' + JSON.stringify(DEMANDE));
if (!rt.includes('"Idaho 7"')) throw new Error('fiche : FD non remplacé');

// ---------- l'écran ----------
const ctx = `<p class="r6p2-ctx" data-role="contexte" data-element="y1b-ligne-contexte" aria-label="Fixé pour les trois">
  <span class="r6p2-cx" data-contexte="biere">${ic('biere', 14)}Stout 16D</span>
  <span class="r6p2-cx r6p2-fort" data-contexte="base" aria-label="dose égale : ${fr(EG.dose_gL)} g/L chacun">${ic('egal', 14)}${fr(EG.dose_gL)} g/L chacun</span>
  <span class="r6p2-cx" data-contexte="moment" aria-label="dry hop après fermentation, ${EG.jours} jours">${ic('cuveP', 14)}après, ${EG.jours} j</span>
  <span class="r6p2-cx" data-contexte="levure">${ic('levure', 14)}US-05</span></p>`;
// La réponse d'abord (b4) : ★ le premier du classement, en grand, puis la ligne du pourquoi « contre ★ ».
// Au repos, deux ou trois mots par autre houblon (sa perte sur le critère, ⚠ s'il sort de ta 16D) ; toucher une
// colonne y écrit sa perte chiffrée contre ★ (critère, floral, résineux). Un toucher sur la ligne : les chiffres.
const ETOILE = (z) => `<svg class="r6p2-etoile" width="${z}" height="${z}" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.9 6 6.5.8-4.8 4.5 1.2 6.5L12 17.2l-5.8 3.2 1.2-6.5-4.8-4.5 6.5-.8z" fill="currentColor"/></svg>`;
const reponse = `<div class="r6p2-rep" data-element="y1b-face-a-ta-stout" aria-live="polite">
  <div class="r6p2-rep-1"><span class="r6p2-rep-n" id="r6p2-rep-n"></span><span class="r6p2-rep-par">par</span>
    <span class="r6p2-pas-w"><button type="button" class="r6p2-pas" aria-label="Critère de classement : floral" aria-expanded="false" aria-controls="r6p2-crit" data-element="y1b-pastille-critere"><span id="r6p2-pas-i">${pic('floral', 14)}</span><span id="r6p2-pas-t">floral</span>${ic('chevb', 12)}</button>
      <span class="r6p2-crit" id="r6p2-crit" role="radiogroup" aria-label="Critère de classement" hidden>${CRIT.map((c, i) => `<button type="button" role="radio" aria-checked="${i === 0}" data-crit="${i}">${pic(c.f, 14)}<span>${c.mot}</span></button>`).join('')}</span></span><span class="r6p2-rep-g" id="r6p2-rep-g" role="img" data-nature="simule"></span></div>
  <button type="button" class="r6p2-rep-2" id="r6p2-rep-2" aria-expanded="false" aria-controls="r6p2-f-pq"></button></div>`;
const corps = `
  <header class="r6p2-tete"><button class="w-ret" type="button" aria-label="Retour">${ic('chev-l', 20)}</button><h1>Lequel pour ma stout ?</h1><nav class="r6p2-pont-n" aria-label="Suite"><a href="#dryhopper" data-role="pont" data-outil="Dryhopper" id="r6p2-pont" aria-label="Doser ${esc(DEPART)} dans Dryhopper"><span>Dryhopper</span>${ic('fleche', 14)}</a></nav><button type="button" class="leg-b" data-role="legende-bouton" aria-expanded="false" aria-label="Légende" data-element="l8b-legende-cachee">?</button></header>
  ${ctx}
  ${reponse}
  <section class="r6p2-rad" data-acquis="radar" data-element="p03-radar-superpose p02-radar-intervalle h4-radar-demande" aria-label="Radar r2">
    <span class="r6p2-rad-h">${S.conf('simule')}</span>
    <span class="seg lentille r6p2-rad-l" role="radiogroup" aria-label="Lecture"><button role="radio" type="button" data-e="style" aria-checked="true">Au style</button><button role="radio" type="button" data-e="absolu" aria-checked="false">Absolu</button></span>
    <div id="r6p2-radar">${radar0}</div>
  </section>
  <section class="r6p2-tab" data-element="l8-disposition" aria-label="Les houblons, côte à côte">
    <div class="r6p2-tetes" role="radiogroup" aria-label="Houblon mis en avant" data-libre="houblon">${taStout}${TOUS.map(tete).join('')}</div>
    <div class="r6p2-rgs" data-element="y1b-bandes-style l5b-barres-voie y1b-plan-d-avant">${LIGNES.map(rangee).join('')}
      <div class="r6p2-rg r6p2-inc-t"><span class="r6p2-rn">${TOUS_INC.map((f) => pic(f, 16)).join('')}</span><span class="r6p2-inc-l"><i class="r6p2-hach"></i>inconnus</span></div>
    </div>
  </section>
`;

// Le dock sous le pouce (forme du dock de y1b) : six touchers, un geste chacun, une feuille à la fois.
const friseIc = '<svg class="ic" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 16h20M5 13v6M10 13v6M15 13v6M20 13v6"/><circle cx="15" cy="7" r="3"/></svg>';
const DOCK = [
  { id: 'defi', ic: ic('cible', 18), t: 'Défi <b id="r6p2-dk-sc" class="mono">' + SCORE[DEPART] + '/4</b>', titre: 'Ton défi', corps: defi },
  { id: 'egaler', ic: ic('egal', 18), t: 'Égaler', titre: 'Pour égaler', corps: egaler },
  { id: 'valeurs', ic: ic('labo', 18), t: 'Valeurs', titre: 'Vraies valeurs et chimie', corps: null },
  { id: 'preuve', ic: ic('panel', 18), t: 'Preuve', titre: 'La preuve : mesuré et tiré', corps: preuve },
  { id: 'frise', ic: friseIc, t: 'Frise', titre: 'Le moment, dans Dryhopper', corps: frise },
  { id: 'souche', ic: ic('levure', 18), t: 'Souche', titre: 'La souche, dans Levure', corps: souche },
];
const valeurs = `<div class="r6p2-fc-c" data-acquis="valeurs">
  <div class="r6p2-duel" data-element="v1-en-a-plus" id="r6p2-duel"></div>
  <div class="r6p2-vh"><span></span>${TOUS.map((n) => `<span class="r6p2-vhn" data-col="${esc(n)}" style="color:${COUL[n]}">${esc(n)}</span>`).join('')}</div>
  <div data-element="v1-vraies-valeurs p03-plages-sources">${alphaRow}${betaRow}</div>
  <div class="r6p2-chim" data-acquis="chimie" data-element="d1-tout-ouvert" aria-label="Composés de l’huile, rangés par famille">${huileRow}${CHIMIE.join('')}</div>
  <div data-element="v1-linalol-en-biere">${enBiere}</div>
  <div class="r6p2-vg" aria-label="IBU à cru : non modélisé"><span class="r6p2-vn">${ic('goutte', 16)}<span><b>IBU</b><span class="r6p2-vu">à cru</span></span></span>${TOUS.map((n) => `<span class="r6p2-vc r6p2-vc-inc" data-col="${esc(n)}"><i class="r6p2-hach"></i><span class="r6p2-vi">non modélisé</span></span>`).join('')}</div>
  ${grilleFiches}
  <p class="r6p2-vsrc">${S.conf('mesure')}<span>fiches et études ; plage = du plus bas au plus haut des sources, puis une fine barre par source.</span></p>
  <p class="r6p2-vrefs">${sourcesTxt()}</p></div>`;
DOCK[2].corps = valeurs;
const feuille = (id, titre, c, extra = '') => `<section class="r6p2-fe" id="r6p2-f-${id}" role="dialog" aria-label="${esc(titre)}" hidden ${extra}><div class="r6p2-fe-t"><b>${titre}</b><button type="button" class="r6p2-fe-x" data-ferme aria-label="Fermer">${ic('x', 18)}</button></div>${c}</section>`;
const dock = `<nav class="r6p2-dock" aria-label="Sous le pouce : le détail, à un toucher">${DOCK.map((d) => `<button type="button" class="r6p2-dk" aria-expanded="false" aria-controls="r6p2-f-${d.id}">${d.ic}<span>${d.t}</span></button>`).join('')}</nav>`;
const feuilles = `<div class="r6p2-voile" id="r6p2-voile" hidden></div>
  ${DOCK.map((d) => feuille(d.id, d.titre, d.corps)).join('\n')}
  ${feuille('pq', 'Pourquoi ce classement', '<div class="r6p2-fc-c" id="r6p2-pq-c"></div>')}
  ${feuille('ajout', 'Ajouter un houblon', ajout)}`;

const legende = `<div class="w-voile" data-role="legende-voile" hidden></div><section class="w-leg" id="legende" data-role="legende" role="dialog" aria-label="Légende" hidden>
  <div class="w-f-t"><b>Légende</b><button type="button" data-role="legende-fermer" aria-label="Fermer la légende">${ic('x', 18)}</button></div>
  <div class="w-leg-s"><h3>Les familles</h3><div class="w-leg-g">${ORDRE.map((f) => `<span class="w-leg-i">${pic(f, 18)}${COURT[f]}</span>`).join('')}</div></div>
  <div class="w-leg-s"><h3>Une barre, par houblon</h3><div class="w-leg-g l2">
    <span class="w-leg-i"><i class="r6p2-lg-z"></i>zone pâle : ce que ta 16D permet</span>
    <span class="w-leg-i"><i class="r6p2-lg-b"></i>barre : ~ simulé à 4 g/L</span>
    <span class="w-leg-i"><i class="r6p2-lg-w"></i>trait fin : sa bande d’incertitude</span>
    <span class="w-leg-i"><i class="r6p2-lg-av"></i>trait noir : ta stout aujourd’hui</span>
    <span class="w-leg-i"><i class="r6p2-lg-x"></i>orangé : au-dessus de ta 16D</span>
    <span class="w-leg-i"><i class="r6p2-hach"></i>hachuré : inconnu, jamais zéro</span>
    <span class="w-leg-i"><b class="mono">~+1,3</b>crans du style gagnés</span>
    <span class="w-leg-i">${ic('haut', 12)}${ic('bas', 12)}ta demande du 18.10</span></div></div>
  <div class="w-leg-s"><h3>Le radar</h3><p>Le houblon touché est plein, les autres en contour. Sa moustache sur chaque axe : de bas en haut de son incertitude ; coupée (//) au bord : le haut sort de l’échelle. Flèche verte : tu veux plus ; orangée : tu veux moins. Rond creux : inconnu.</p></div>
  <div class="w-leg-s"><h3>Un houblon</h3><div class="w-leg-g l2">
    <span class="w-leg-i"><span class="al lot">17,2%${ic('diff', 12)}</span>α du lot ; ≠ hors des fiches</span><span class="w-leg-i"><span class="al fi">${ic('livre', 12)}9,5–14,9%</span>α des fiches</span>
    <span class="w-leg-i"><span class="us us-mot deduit"><span class="us-m">mixte</span></span>pâle : déduit de l’α</span>
    <span class="w-leg-i">${ic('ok', 14)}reste dans ta 16D</span><span class="w-leg-i">${ic('risque', 14)}sort de ta 16D, par</span>
    <span class="w-leg-i">${ic('main', 16)}appui long sur un nom : sa fiche</span></div></div>
  <div class="w-leg-s"><h3>La réponse</h3><p>★ : le premier face à ta stout, par la pastille (floral, agrumes, tropicaux, moins résineux) ; à droite, ce qu’il gagne, en crans du style. Dessous, « contre ★ » : ce que chaque autre perd ou gagne (= : moins de 0,15 cran, sous l’incertitude ; vert : dans le sens de ta demande). Touche une colonne : sa perte contre ★ sur le critère, le floral et le résineux. Touche la ligne : les chiffres. Les colonnes suivent le classement.</p></div>
  <div class="w-leg-s"><h3>Sous le pouce</h3><div class="w-leg-g l2">
    <span class="w-leg-i">${ic('cible', 16)}Défi : tes objectifs du 18.10</span><span class="w-leg-i">${ic('egal', 16)}Égaler : la dose pour le même effet</span>
    <span class="w-leg-i">${ic('labo', 16)}Valeurs : chimie et vraies valeurs</span><span class="w-leg-i">${ic('panel', 16)}Preuve : panel mesuré, bières tirées</span>
    <span class="w-leg-i">${friseIc}Frise : le moment, dans Dryhopper</span><span class="w-leg-i">${ic('levure', 16)}Souche : la levure, dans Levure</span></div></div>
  <div class="w-leg-s"><h3>Base : dose égale</h3><p>Les trois à ${fr(EG.dose_gL)} g/L, après fermentation, ${EG.jours} j, US-05. Fiche : « groseille à maquereau » rangée dans Petits fruits (option A) ; seul Nelson Sauvin a ce mot. Profil ~ simulé : moteur profil-simulé (${D.version}, ${D.date.split('-').reverse().slice(0, 2).join('.')}), centre conventionnel.</p></div>
</section>`;

const css = `
  body { padding-bottom: 64px; }
  .ecran { gap: 6px; padding-top: 2px; }
  .r6p2-tete { display: flex; align-items: center; gap: 6px; min-height: 40px; }
  .r6p2-tete h1 { flex: 1; font-size: 14px; line-height: 1.15; font-weight: 700; color: var(--gris); }
  .r6p2-ctx { display: flex; flex-wrap: wrap; gap: 2px 10px; font-size: 12px; color: var(--gris); }
  .r6p2-cx { display: inline-flex; align-items: center; gap: 3px; white-space: nowrap; }
  .r6p2-fort { color: var(--encre); font-weight: 700; }
  /* la réponse de y1b */
  .r6p2-rep { display: flex; flex-direction: column; gap: 3px; margin-top: 2px; padding: 4px 0 4px 10px; box-shadow: inset 3px 0 0 var(--encre); }
  .r6p2-rep-1 { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; font-size: 14px; }
  .r6p2-rep-par { flex: none; }
  .r6p2-rep-n { display: inline-flex; flex: none; align-items: center; gap: 4px; }
  .r6p2-rep-n > * { flex: none; }
  .r6p2-rep-n .r6p2-ok, .r6p2-rep-n .r6p2-hz { margin-right: 2px; }
  .r6p2-rep-n b { font-size: 20px; line-height: 1.1; font-weight: 800; letter-spacing: -.01em; white-space: nowrap; }
  .r6p2-rep-st { display: inline-flex; color: var(--encre); }
  .r6p2-rep-n .r6p2-ok { display: inline-flex; color: #2f6b4f; }
  .r6p2-rep-par { color: var(--gris); }
  .r6p2-rep-g[hidden] { display: none; }
  .r6p2-rep-g2 { padding-left: 6px; }
  .r6p2-rep-g { margin-left: auto; display: inline-flex; align-items: center; gap: 3px; font-size: 14px; white-space: nowrap; }
  .r6p2-rep-g b { font-weight: 700; letter-spacing: -.03em; }
  .r6p2-etoile { flex: none; display: block; }
  .r6p2-tst { display: none; color: var(--encre); }
  .r6p2-prem .r6p2-tst { display: inline-flex; }
  .r6p2-prem .r6p2-tn > .r6p2-pt { display: none; }
  .r6p2-prem .r6p2-tn { gap: 2px; }
  .r6p2-pas-w { position: relative; flex: none; }
  .r6p2-pas { white-space: nowrap; }
  .r6p2-pas { display: inline-flex; align-items: center; gap: 3px; min-height: 28px; padding: 0 8px; border-radius: 999px; box-shadow: inset 0 0 0 1.5px var(--encre); font-size: 14px; font-weight: 700; }
  .r6p2-pas[aria-expanded="true"] { background: var(--encre); color: #fff; }
  .r6p2-crit { position: absolute; left: 0; top: 32px; z-index: 6; display: flex; flex-direction: column; gap: 2px; padding: 4px; background: #fff; border-radius: 8px; box-shadow: 0 6px 18px rgba(22,22,26,.18), inset 0 0 0 1px var(--trait); min-width: 168px; }
  .r6p2-crit[hidden] { display: none; }
  .r6p2-crit button { display: flex; align-items: center; gap: 6px; min-height: 32px; padding: 0 8px; border-radius: 4px; font-size: 14px; text-align: left; }
  .r6p2-crit button[aria-checked="true"] { background: #ececf1; font-weight: 700; }
  .r6p2-rep-2 { display: flex; flex-wrap: nowrap; overflow: hidden; align-items: center; gap: 2px 7px; width: 100%; min-height: 28px; padding: 2px 0; font-size: 14px; text-align: left; border-radius: 4px; }
  .r6p2-rep-2.r6p2-duo { background: #f3f3f6; box-shadow: inset 3px 0 0 var(--h); padding-left: 8px; margin-left: -10px; width: calc(100% + 10px); }
  .r6p2-rep-2[aria-expanded="true"] { background: #ececf1; }
  .r6p2-ctr { display: inline-flex; align-items: center; gap: 2px; color: var(--gris); }
  .r6p2-rep-2 .mono { letter-spacing: -.04em; }
  .r6p2-co { display: inline-flex; align-items: center; gap: 2px; white-space: nowrap; }
  .r6p2-rep-2 .r6p2-pt { margin-right: 1px; }
  .r6p2-rep-2 b { font-weight: 700; }
  .r6p2-rep-2 .mono { font-weight: 700; }
  .r6p2-rep-2 .r6p2-hz, .r6p2-rep-n .r6p2-hz { display: inline-flex; align-items: center; gap: 2px; color: var(--acc); }
  .r6p2-rep-2 .r6p2-bon { color: #2f6b4f; }
  .r6p2-lt { width: 18px; height: 18px; border-radius: 50%; color: #fff; font: 700 12px/18px var(--sans); text-align: center; flex: none; }
  .r6p2-chev { margin-left: auto; display: inline-flex; color: var(--gris); }
  .r6p2-rep-g2 + .r6p2-chev { margin-left: 4px; }
  /* le radar */
  .r6p2-rad { position: relative; margin: 0 -16px; padding: 0 16px; }
  .r6p2-rad-h { position: absolute; left: 16px; top: 0; z-index: 1; }
  .r6p2-rad-l { position: absolute; right: 16px; top: 0; z-index: 1; }
  #r6p2-radar svg { display: block; margin: 0 auto; }
  .r6p2-rq { font: 700 12px var(--sans); fill: #5b5b66; }
  /* le tableau : libellé, puis une colonne par houblon */
  .r6p2-tab { display: flex; flex-direction: column; }
  .r6p2-tetes, .r6p2-rg, .r6p2-vg, .r6p2-vh, .r6p2-fr, .r6p2-obh, .r6p2-score { display: grid; grid-template-columns: var(--lc, 76px) repeat(var(--n, 3), minmax(0, 1fr)); column-gap: 4px; }
  .r6p2-obh, .r6p2-score { grid-template-columns: repeat(var(--n, 3), minmax(0, 1fr)); }
  body.r6p2-n4 { --n: 4; --lc: 34px; }
  body.r6p2-n4 .r6p2-fe { --lc: 58px; }
  .r6p2-a4 { display: none; } body.r6p2-n4 .r6p2-a3 { display: none; } body.r6p2-n4 .r6p2-a4 { display: inline; }
  body.r6p2-n4 .r6p2-rgs .r6p2-rn > span:not(.r6p2-dem), body.r6p2-n4 .r6p2-tas b, body.r6p2-n4 .r6p2-tas-l > span { display: none; }
  body.r6p2-n4 .r6p2-tc { padding: 5px 3px; }
  body.r6p2-n4 .r6p2-tn { font-size: 13px; align-items: flex-start; flex-wrap: wrap; gap: 2px 4px; }
  body.r6p2-n4 .r6p2-tc .r6p2-tn > .r6p2-pt { display: none; }
  body.r6p2-n4 .r6p2-tn .hn { white-space: normal; overflow: visible; text-overflow: clip; line-height: 1.1; }
  body:not(.r6p2-n4) [data-col="Nelson Sauvin"] { display: none !important; }
  .r6p2-tc { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; text-align: left; padding: 5px 4px 5px; border-radius: 8px 8px 0 0; min-width: 0; box-shadow: inset 0 3px 0 var(--h, transparent); transition: background .2s; }
  .r6p2-tc.r6p2-sel { background: #f3f3f6; box-shadow: inset 0 3px 0 var(--h), inset 2px 0 0 var(--h), inset -2px 0 0 var(--h); }
  .r6p2-tas { padding: 5px 0; box-shadow: none; gap: 3px; order: 0; }
  .r6p2-tas-c { display: flex; flex-direction: column; gap: 3px; }
  .r6p2-tn { display: flex; align-items: center; gap: 4px; font-size: 14px; max-width: 100%; }
  .r6p2-tn .hn { font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-decoration: underline dotted #9a9aa6; text-underline-offset: 3px; -webkit-touch-callout: none; -webkit-user-select: none; user-select: none; }
  .r6p2-pt { width: 8px; height: 8px; border-radius: 50%; flex: none; display: inline-block; }
  .r6p2-trait { width: 10px; height: 2px; background: var(--encre); flex: none; border-radius: 2px; }
  .r6p2-tas b { font-size: 14px; }
  .r6p2-tas-l { display: inline-flex; align-items: center; gap: 3px; font-size: 12px; font-weight: 600; }
  .r6p2-plus { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 50%; box-shadow: inset 0 0 0 1.5px var(--encre); margin-top: 2px; }
  .r6p2-plus[aria-expanded="true"] { background: var(--encre); color: #fff; }
  .r6p2-ta { display: inline-flex; align-items: center; gap: 2px; }
  .r6p2-tc .al { font-size: 12px; }
  .r6p2-tr { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
  .r6p2-tf { display: flex; align-items: flex-end; gap: 2px; min-height: 16px; flex-wrap: wrap; }
  .r6p2-vd { display: inline-flex; align-items: center; gap: 1px; }
  .r6p2-vd-d { color: #2f6b4f; } .r6p2-vd-h { color: var(--acc); }
  .r6p2-rgs { display: flex; flex-direction: column; }
  .r6p2-rg { align-items: center; min-height: 22px; }
  .r6p2-demande { min-height: 34px; }
  .r6p2-rn, .r6p2-fn { display: flex; align-items: center; gap: 2px; letter-spacing: -.01em; font-size: 12px; font-weight: 600; white-space: nowrap; overflow: hidden; order: 0; }
  .r6p2-dem { display: inline-flex; color: var(--encre); } .r6p2-trop { color: var(--acc); }
  .r6p2-cel { position: relative; display: flex; flex-direction: column; justify-content: center; gap: 1px; height: 100%; min-height: 22px; padding: 0 5px; }
  .r6p2-cel.r6p2-sel { background: #f3f3f6; box-shadow: inset 2px 0 0 var(--hs, transparent), inset -2px 0 0 var(--hs, transparent); }
  .r6p2-pis { position: relative; display: block; height: 12px; background: #f6f6f9; border-radius: 2px; }
  .r6p2-pis > i { position: absolute; top: 0; bottom: 0; display: block; }
  .r6p2-zo { left: 0; width: var(--z); background: var(--f); box-shadow: inset -1.5px 0 0 var(--t); }
  .r6p2-ba { left: 0; top: 2px !important; bottom: 2px !important; width: var(--gb); background: var(--b); border-radius: 2px; }
  .r6p2-xo { left: var(--xb); width: var(--xo); top: 2px !important; bottom: 2px !important; background: ${ACC}; border-radius: 0 2px 2px 0; }
  .r6p2-wh { left: var(--w0); width: calc(var(--w1) - var(--w0)); top: 5.25px !important; bottom: 5.25px !important; background: rgba(22,22,26,.42); }
  .r6p2-av { left: calc(var(--av) - 1px); width: 2px; top: -2px !important; bottom: -2px !important; background: var(--encre); border-radius: 2px; }
  .r6p2-dep .r6p2-pis::after { content: ''; position: absolute; right: -5px; top: 2px; border: 4px solid transparent; border-left: 5px solid ${ACC}; border-right: 0; }
  body.abs .r6p2-zo { width: var(--za); } body.abs .r6p2-ba { width: var(--gba); } body.abs .r6p2-xo { left: var(--xba); width: var(--xoa); }
  body.abs .r6p2-wh { left: var(--w0a); width: calc(var(--w1a) - var(--w0a)); } body.abs .r6p2-av { left: calc(var(--ava) - 1px); }
  body.abs .r6p2-dep .r6p2-pis::after { display: none; } body.abs .r6p2-depa .r6p2-pis::after { display: block; }
  .r6p2-dl { font: 600 12px/14px var(--mono); color: var(--encre); }
  .r6p2-dl.r6p2-hors { color: var(--acc); }
  .r6p2-hach { display: inline-block; width: 22px; height: 10px; border-radius: 2px; flex: none; background: repeating-linear-gradient(135deg, #fff 0 2px, #8a909b 2px 3.5px); box-shadow: inset 0 0 0 1px #8a909b; }
  .r6p2-hach-s { width: 14px; }
  .r6p2-inc { flex-direction: row; align-items: center; justify-content: flex-start; gap: 4px; }
  .r6p2-inc-t { min-height: 24px; }
  .r6p2-inc-l { grid-column: 2 / -1; order: 9; display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--gris); }
  .r6p2-rep-2w { display: flex; align-items: center; gap: 6px; }
  .r6p2-pont-n { margin-left: auto; flex: none; }
  .r6p2-pont-n a { display: inline-flex; align-items: center; gap: 4px; min-height: 28px; padding: 0 8px 0 10px; border-radius: 999px; background: var(--encre); color: #fff; font-size: 12px; font-weight: 700; }
  /* le dock sous le pouce */
  .r6p2-dock { position: fixed; left: 0; right: 0; bottom: 0; z-index: 30; display: grid; grid-template-columns: repeat(6, 1fr); height: 56px; padding: 0 4px env(safe-area-inset-bottom); background: #fff; border-top: 1px solid var(--trait); }
  .r6p2-dk { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; font-size: 12px; color: var(--encre); border-radius: 8px; margin: 4px 1px; }
  .r6p2-dk span { white-space: nowrap; }
  .r6p2-dk[aria-expanded="true"] { background: var(--encre); color: #fff; }
  .r6p2-voile { position: fixed; inset: 0 0 56px 0; z-index: 20; background: rgba(22,22,26,.34); }
  .r6p2-voile[hidden] { display: none; }
  .r6p2-fe { position: fixed; left: 0; right: 0; bottom: 56px; z-index: 25; max-height: calc(100% - 132px); overflow-y: auto; overscroll-behavior: contain; background: #fff; border-radius: 8px 8px 0 0; padding: 0 16px 14px; }
  .r6p2-fe[hidden] { display: none; }
  .r6p2-fe-t { position: sticky; top: 0; z-index: 2; display: flex; align-items: center; gap: 8px; min-height: 44px; background: #fff; border-bottom: 1px solid var(--trait); margin: 0 -16px 8px; padding: 0 12px 0 16px; }
  .r6p2-fe-t b { flex: 1; font-size: 16px; }
  .r6p2-fe-x { display: inline-flex; width: 32px; height: 32px; align-items: center; justify-content: center; border-radius: 50%; background: #ececf1; }
  .r6p2-fc-c { display: flex; flex-direction: column; gap: 10px; }
  .r6p2-sub { font-size: 12px; color: var(--gris); line-height: 1.3; display: flex; flex-wrap: wrap; align-items: center; gap: 4px; }
  .r6p2-lien { display: flex; align-items: center; gap: 8px; min-height: 40px; padding: 0 14px; border-radius: 999px; background: var(--encre); color: #fff; font-size: 14px; }
  .r6p2-lien span { flex: 1; } .r6p2-lien b { font-weight: 700; }
  /* défi */
  .r6p2-cit { font-size: 14px; font-style: italic; } .r6p2-cit span { display: block; font-style: normal; font-size: 12px; color: var(--gris); }
  .r6p2-score { gap: 4px; }
  .r6p2-sc { display: flex; flex-direction: column; gap: 1px; padding: 6px 6px; border-radius: 8px; box-shadow: inset 0 3px 0 var(--h); background: #f6f6f9; font-size: 12px; font-weight: 600; }
  .r6p2-sc b { font-size: 16px; }
  .r6p2-sc .r6p2-pt { display: none; }
  .r6p2-obs { display: flex; flex-direction: column; gap: 10px; }
  .r6p2-ob { display: flex; flex-direction: column; gap: 6px; padding: 8px 10px; border-radius: 8px; background: #f6f6f9; }
  .r6p2-obt { display: flex; align-items: center; gap: 4px; font-size: 14px; color: var(--t, var(--encre)); }
  .r6p2-obt b { color: var(--t, var(--encre)); }
  .r6p2-obv { margin-left: auto; display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: var(--gris); }
  .r6p2-ps { position: relative; height: 46px; margin: 16px 4px 0; }
  .r6p2-ps > i { position: absolute; display: block; }
  .r6p2-pz { left: 0; top: 12px; height: 12px; background: var(--f); box-shadow: inset -1.5px 0 0 var(--t); border-radius: 2px 0 0 2px; }
  .r6p2-ps::before { content: ''; position: absolute; left: 0; right: 0; top: 12px; height: 12px; background: #ececf1; border-radius: 2px; z-index: -1; }
  .r6p2-pb { left: 0; top: 15px; height: 6px; border-radius: 2px; display: none !important; }
  .r6p2-pb.r6p2-sel { display: block !important; }
  .r6p2-pav { top: 8px; height: 20px; width: 2px; margin-left: -1px; background: var(--encre); }
  .r6p2-pvi { top: 6px; height: 24px; width: 0; border-left: 2px dotted var(--encre); }
  .r6p2-pvl { position: absolute; top: -14px; margin-left: 4px; font-size: 12px; font-style: italic; color: var(--gris); }
  .r6p2-rp { position: absolute; top: 9px; width: 18px; height: 18px; margin-left: -9px; border-radius: 50%; background: var(--h); color: #fff; font: 700 12px/18px var(--sans); text-align: center; box-shadow: 0 0 0 1.5px #fff; }
  .r6p2-rp-1 { top: 27px; } .r6p2-rp-2 { top: -9px; }
  .r6p2-rp.r6p2-sel { box-shadow: 0 0 0 1.5px #fff, 0 0 0 3px var(--h); }
  .r6p2-obh { gap: 4px; }
  .r6p2-obx { display: flex; flex-wrap: wrap; align-items: center; gap: 2px 3px; font-size: 12px; font-weight: 700; }
  .r6p2-obx > span { display: inline-flex; align-items: center; gap: 3px; }
  .r6p2-obx b { font-weight: 600; font-size: 12px; width: 100%; }
  .r6p2-v-atteint { color: #2f6b4f; } .r6p2-v-approche { color: var(--encre); } .r6p2-v-aucune { color: var(--acc); } .r6p2-v-inconnu { color: var(--gris); }
  .r6p2-obn { font-size: 12px; color: var(--gris); }
  .r6p2-jg { display: flex; height: 22px; border-radius: 4px; overflow: hidden; font-size: 12px; }
  .r6p2-jg-n { flex: 3; display: flex; align-items: center; padding: 0 8px; background: #5b5b66; color: #fff; font-weight: 600; }
  .r6p2-jg-h { flex: 1; display: flex; align-items: center; gap: 4px; padding: 0 6px; background: #fff; box-shadow: inset 0 0 0 1px #8a909b; color: var(--gris); font-weight: 700; }
  .r6p2-ibu { display: flex; flex-direction: column; gap: 3px; font-size: 12px; }
  .r6p2-ibu-t { display: flex; align-items: center; gap: 6px; font-weight: 700; }
  .r6p2-ibu-r { display: grid; grid-template-columns: 10px 76px 1fr 64px; align-items: center; gap: 4px; }
  .r6p2-ibu-b { height: 8px; background: #fff; border-radius: 2px; position: relative; } .r6p2-ibu-b i { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 2px; }
  .r6p2-ibu-r b { text-align: right; } .r6p2-ibu-s { color: var(--gris); }
  .r6p2-pont { display: flex; flex-direction: column; gap: 6px; padding-top: 4px; }
  .r6p2-s5 { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .r6p2-s5p { display: flex; flex-direction: column; gap: 2px; padding: 8px; border-radius: 8px; background: #f6f6f9; font-size: 12px; color: var(--t); font-weight: 600; }
  .r6p2-s5p b { display: flex; align-items: center; gap: 4px; font-size: 16px; color: var(--encre); } .r6p2-s5p small { font-size: 12px; font-weight: 400; color: var(--gris); }
  /* égaler */
  .r6p2-eg { display: flex; flex-direction: column; gap: 4px; padding: 8px 0; border-top: 1px solid var(--trait); }
  .r6p2-egt { display: flex; align-items: center; gap: 6px; font-size: 14px; }
  .r6p2-egc { margin-left: auto; font-size: 12px; color: var(--gris); }
  .r6p2-egr { display: grid; grid-template-columns: 10px 84px 1fr 118px; align-items: center; gap: 4px; font-size: 12px; min-height: 22px; }
  .r6p2-egn { font-weight: 600; }
  .r6p2-egb { position: relative; height: 10px; background: #f1f1f4; border-radius: 2px; }
  .r6p2-egb > i:first-child { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 2px; }
  .r6p2-hach-l { width: 100%; }
  .r6p2-eg4 { position: absolute; left: 50%; top: -3px; bottom: -3px; width: 2px; margin-left: -1px; background: var(--encre); }
  .r6p2-egv { text-align: right; font-size: 12px; } .r6p2-jamais { color: var(--acc); font-family: var(--sans); }
  .r6p2-egr .r6p2-egi { grid-column: auto; font-size: 12px; } .r6p2-egi small { color: var(--gris); font-family: var(--sans); }
  .r6p2-eg .r6p2-egr:has(.r6p2-egi) { grid-template-columns: 10px 84px 1fr 1fr; }
  /* preuve */
  .r6p2-osu, .r6p2-tir, .r6p2-jr { display: flex; flex-direction: column; gap: 4px; }
  .r6p2-osu-t { display: flex; align-items: center; gap: 6px; font-size: 14px; flex-wrap: wrap; }
  .r6p2-osu-u { margin-left: auto; font-size: 12px; color: var(--gris); }
  .r6p2-ot { font: 400 12px var(--mono); fill: #5b5b66; } .r6p2-ol { font: 600 12px var(--sans); }
  .r6p2-osu-n { display: flex; flex-wrap: wrap; gap: 2px 12px; font-size: 12px; color: var(--gris); }
  .r6p2-osu-n b { color: var(--encre); font-weight: 600; } .r6p2-osu-n > span { display: inline-flex; align-items: center; gap: 4px; }
  .r6p2-ld { width: 2px; height: 12px; background: var(--encre); display: inline-block; } .r6p2-lz { width: 14px; height: 10px; background: #ececf1; display: inline-block; border-radius: 2px; }
  .r6p2-osu-s { font-size: 12px; color: var(--gris); }
  .r6p2-tir { padding-top: 8px; border-top: 1px solid var(--trait); }
  .r6p2-retire { margin-left: auto; display: inline-flex; align-items: center; gap: 4px; min-height: 28px; padding: 0 10px; border-radius: 999px; box-shadow: inset 0 0 0 1.5px var(--encre); font-size: 12px; font-weight: 700; }
  .r6p2-tg { display: grid; grid-template-columns: var(--lc, 76px) repeat(var(--n, 3), minmax(0, 1fr)); column-gap: 4px; align-items: center; min-height: 24px; }
  .r6p2-tc2 { display: flex; flex-direction: column; gap: 1px; font-size: 12px; }
  .r6p2-dots { display: grid; grid-template-columns: repeat(10, 5px); gap: 2px; }
  .r6p2-dots i { width: 5px; height: 5px; border-radius: 50%; background: var(--b); }
  .r6p2-dots i.r6p2-o { background: ${ACC}; }
  .r6p2-tc2 b { font: 600 12px var(--mono); } .r6p2-tc2 b.r6p2-o { color: var(--acc); }
  /* frise */
  .r6p2-ft { font: 400 12px var(--sans); fill: #5b5b66; } .r6p2-ft-on { font-weight: 700; fill: #16161a; }
  .r6p2-jr { padding-top: 8px; border-top: 1px solid var(--trait); }
  .r6p2-lh { display: grid; grid-template-columns: 96px 1fr; align-items: center; gap: 6px; min-height: 24px; font-size: 12px; }
  .r6p2-lhn { display: inline-flex; align-items: center; gap: 4px; font-weight: 700; }
  .r6p2-lhp { display: flex; flex-wrap: wrap; gap: 2px 10px; }
  .r6p2-pu { display: inline-flex; align-items: center; gap: 3px; font-size: 12px; } .r6p2-pu b { font-weight: 700; }
  .r6p2-rien { color: var(--gris); }
  .r6p2-dit { font-size: 14px; font-weight: 600; line-height: 1.3; }
  .r6p2-jr-c { display: inline-flex; align-items: center; gap: 3px; font-size: 12px; color: var(--gris); }
  /* souche */
  .r6p2-pas-r { display: inline-flex; align-items: center; min-height: 22px; padding: 0 8px; border-radius: 999px; box-shadow: inset 0 0 0 1px var(--trait); font-size: 12px; color: var(--encre); }
  .r6p2-pas-r.r6p2-on { background: var(--encre); color: #fff; font-weight: 700; }
  .r6p2-so { display: none; flex-direction: column; gap: 2px; }
  .r6p2-so.r6p2-sel { display: flex; }
  .r6p2-soh, .r6p2-sor { display: grid; grid-template-columns: 86px 1fr 1fr; gap: 6px; align-items: center; font-size: 12px; }
  .r6p2-soh span { color: var(--gris); font-weight: 600; }
  .r6p2-sob { display: grid; grid-template-columns: 1fr 44px; gap: 4px; align-items: center; }
  .r6p2-sob i { display: block; height: 8px; border-radius: 2px; background: var(--b); } .r6p2-sob-p { opacity: .55; }
  .r6p2-sob b { text-align: right; font-size: 12px; font-weight: 600; }
  /* valeurs */
  .r6p2-vh { font-size: 12px; font-weight: 700; }
  .r6p2-vg { align-items: start; padding: 3px 0; border-top: 1px solid var(--trait); }
  .r6p2-chim { display: flex; flex-direction: column; gap: 6px; }
  .r6p2-vn { display: flex; align-items: flex-start; gap: 4px; font-size: 12px; order: 0; }
  .r6p2-vn b { display: block; font-weight: 700; hyphens: manual; overflow-wrap: anywhere; } .r6p2-vu { display: block; color: var(--gris); }
  .r6p2-vc { display: flex; flex-direction: column; gap: 2px; min-width: 0; padding: 0 2px; }
  .r6p2-vt { display: flex; align-items: center; gap: 3px; }
  .r6p2-vv { font-size: 12px; font-weight: 600; white-space: nowrap; }
  .r6p2-vb { position: relative; height: 6px; background: #f1f1f4; border-radius: 2px; }
  .r6p2-vbr { position: absolute; top: 0; bottom: 0; background: var(--c); border-radius: 2px; opacity: .8; }
  .r6p2-ouvert { background: linear-gradient(90deg, var(--c) 55%, rgba(255,255,255,0)); }
  .r6p2-vs { position: relative; display: flex; align-items: center; height: 12px; }
  .r6p2-vs i { position: absolute; top: 5px; height: 2px; background: var(--c); opacity: .6; }
  .r6p2-vs b { position: relative; margin-left: auto; font: 400 12px/12px var(--sans); color: var(--gris); background: #fff; padding-left: 2px; }
  .r6p2-vlot { position: absolute; top: -3px; bottom: -3px; width: 2px; margin-left: -1px; background: var(--encre); }
  .r6p2-lotm { width: 2px; height: 10px; background: var(--encre); display: inline-block; }
  .r6p2-vr { font-size: 12px; color: var(--gris); line-height: 1.15; }
  .r6p2-verif .r6p2-vr { color: var(--acc); }
  .r6p2-max .r6p2-vv { color: var(--c); font-weight: 700; } .r6p2-max .r6p2-vbr { opacity: 1; }
  .r6p2-vc-inc { flex-direction: row; align-items: center; gap: 4px; } .r6p2-vi { font-size: 12px; color: var(--gris); }
  .r6p2-vnote { grid-column: 2 / -1; order: 9; font-size: 12px; color: var(--gris); }
  .r6p2-vsrc { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--gris); }
  .r6p2-vrefs { display: flex; flex-wrap: wrap; gap: 2px 10px; font-size: 12px; color: var(--gris); } .r6p2-vrefs b { color: var(--encre); }
  .r6p2-duel { display: flex; flex-direction: column; gap: 3px; padding: 8px 10px; border-radius: 8px; background: #f6f6f9; }
  .r6p2-duh { display: grid; grid-template-columns: 1fr 34px 1fr; align-items: center; font-size: 12px; }
  .r6p2-duh span:last-child { text-align: right; }
  .r6p2-dusw { width: 32px; height: 32px; border-radius: 50%; background: #fff; display: inline-flex; align-items: center; justify-content: center; box-shadow: inset 0 0 0 1px var(--trait); }
  .r6p2-dur { display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: 0; font-size: 12px; position: relative; min-height: 26px; }
  .r6p2-dur::after { content: ''; position: absolute; left: 50%; top: 0; bottom: 0; width: 1px; background: var(--encre); }
  .r6p2-dul { grid-column: 1 / -1; display: flex; align-items: center; gap: 3px; font-weight: 600; }
  .r6p2-dul .mono { margin-left: auto; font-weight: 700; }
  .r6p2-dub { height: 6px; display: flex; } .r6p2-dub i { display: block; height: 6px; border-radius: 2px; }
  .r6p2-dub.g { justify-content: flex-end; }
  .r6p2-fg { display: flex; flex-direction: column; gap: 2px; padding-top: 6px; border-top: 1px solid var(--trait); }
  .r6p2-fgh { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 10px; font-size: 12px; color: var(--gris); } .r6p2-fgh b { color: var(--encre); font-size: 14px; width: 100%; }
  .r6p2-fgh span { display: inline-flex; align-items: center; gap: 4px; }
  .r6p2-fr { align-items: center; min-height: 20px; }
  .r6p2-f16 .r6p2-fn span { font-weight: 800; }
  .r6p2-fc { display: flex; align-items: center; gap: 4px; font-size: 12px; }
  .r6p2-fk { display: inline-block; width: 18px; height: 10px; border-radius: 2px; flex: none; }
  .r6p2-fk2 { background: var(--b, #5b5b66); } .r6p2-fk1 { background: var(--f, #ececf1); box-shadow: inset 0 0 0 1px var(--t, #8a909b); } .r6p2-fk0 { box-shadow: inset 0 0 0 1px #c8c8d0; }
  .r6p2-fnote { font-size: 12px; color: var(--gris); }
  /* ajouter */
  .r6p2-carte { display: flex; flex-direction: column; gap: 6px; padding: 10px; border-radius: 8px; background: #f6f6f9; box-shadow: inset 0 3px 0 var(--h); }
  .r6p2-carte-l { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
  .r6p2-achat { display: inline-flex; color: var(--gris); }
  .r6p2-part { display: flex; flex-direction: column; gap: 3px; font-size: 12px; }
  .r6p2-part-b { height: 8px; background: #fff; border-radius: 2px; box-shadow: inset 0 0 0 1px var(--trait); } .r6p2-part-b i { display: block; height: 8px; border-radius: 2px; background: #8a8a95; }
  .r6p2-ajb { display: flex; align-items: center; justify-content: center; gap: 6px; min-height: 40px; border-radius: 999px; background: var(--encre); color: #fff; font-size: 14px; font-weight: 700; }
  .r6p2-pqr { display: grid; grid-template-columns: 22px 1fr auto; gap: 6px; align-items: center; font-size: 14px; padding: 4px 0; border-top: 1px solid var(--trait); }
  .r6p2-pqr .r6p2-rk { font: 700 14px var(--mono); }
  .r6p2-pqr small { display: block; font-size: 12px; color: var(--gris); }
  .r6p2-pqr b.mono { font-size: 14px; }
  .w-leg p { font-size: 12px; line-height: 1.3; }
  .r6p2-lg-z, .r6p2-lg-b, .r6p2-lg-w, .r6p2-lg-av, .r6p2-lg-x { display: inline-block; flex: none; width: 22px; height: 10px; border-radius: 2px; }
  .r6p2-lg-z { background: ${JET.floral.fond}; box-shadow: inset -1.5px 0 0 ${JET.floral.texte}; } .r6p2-lg-b { background: ${JET.floral.base}; } .r6p2-lg-w { height: 2px; background: rgba(22,22,26,.55); border-radius: 0; }
  .r6p2-lg-av { width: 2px; height: 14px; background: var(--encre); } .r6p2-lg-x { background: ${ACC}; }
  @media (prefers-reduced-motion: reduce) { .r6p2-tc { transition: none; } }`;

// ---------- le code client (assemblé par JSON.stringify et concaténation, jamais par remplacement de chaîne) ----------
const R2 = (x) => Math.round(x * 100) / 100;
const DATA = {
  NOMS, AJOUT, TOUS, COUL, LETTRE, DEPART, CRIT, NOM_F: NOM, COURT_F: COURT, TXT_F: Object.fromEntries(ORDRE.map((f) => [f, JET[f].texte])), JET_B: Object.fromEntries(ORDRE.map((f) => [f, JET[f].base])),
  DC: Object.fromEntries(TOUS.map((n) => [n, Object.fromEntries(ORDRE.map((f) => [f, R2(dCran(n, f))]))])),
  INC: Object.fromEntries(TOUS.map((n) => [n, Object.fromEntries(ORDRE.map((f) => [f, inconnu(n, f)]))])),
  V: Object.fromEntries(TOUS.map((n) => [n, Object.fromEntries(ORDRE.map((f) => { const v = val(n, f); return [f, [R2(v.bas), R2(v.centre), R2(v.haut)]]; }))])),
  HORS: Object.fromEntries(TOUS.map((n) => [n, hors(n)])),
  SCORE, AV: Object.fromEntries(ORDRE.map((f) => [f, R2(AV[f].centre)])), BANDE, DOM, LIGNES,
  DUEL, ACC,
};
// Dans une fonction : le runtime de la fiche (second script) déclare aussi ouvrir() et fermer() au niveau global.
const js = `(() => {
const RD = ${JSON.stringify(RD)};
const radarSvg = ${radarSvg.toString()};
const X = ${JSON.stringify(DATA)};
const $ = (s) => document.querySelector(s), $$ = (s) => [...document.querySelectorAll(s)];
const frn = (x, d) => { const k = Math.pow(10, d == null ? 1 : d); return String(Math.round(x * k) / k).replace('.', ',').replace('-', '−'); };
const dtn = (d) => (d >= 0 ? '+' : '−') + frn(Math.abs(d), 1);
const PIC = (f, w) => '<svg class="pi" width="' + w + '" height="' + w + '" data-famille="' + f + '" role="img" aria-label="' + X.NOM_F[f] + '"><use href="#p-' + f + '"/></svg>';
const ICO = (k, z) => '<svg class="ic" width="' + z + '" height="' + z + '" aria-hidden="true"><use href="#i-' + k + '-' + z + '"/></svg>';
const PT = (n) => '<i class="r6p2-pt" style="background:' + X.COUL[n] + '"></i>';
let SEL = X.DEPART, CI = 0, N4 = false, AUTRE = null, GRAINE = 7;
const actifs = () => (N4 ? X.TOUS : X.NOMS);
const note = (n, c) => (X.INC[n][c.f] ? -1e9 : c.s * X.DC[n][c.f]);
const rang = () => actifs().slice().sort((a, b) => note(b, X.CRIT[CI]) - note(a, X.CRIT[CI]));
function ordonner() { const r = rang(); $$('[data-col]').forEach((e) => { const i = r.indexOf(e.dataset.col); e.style.order = String(i < 0 ? 9 : i + 1); }); }
function dessiner() { $('#r6p2-radar').innerHTML = radarSvg(RD, X.TOUS.indexOf(SEL), document.body.classList.contains('abs'), actifs().length); }
const STAR = (z) => '<svg class="r6p2-etoile" width="' + z + '" height="' + z + '" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.9 6 6.5.8-4.8 4.5 1.2 6.5L12 17.2l-5.8 3.2 1.2-6.5-4.8-4.5 6.5-.8z" fill="currentColor"/></svg>';
const sortN = (n) => X.HORS[n].map((f) => X.COURT_F[f].toLowerCase()).join(', ');
const S16 = (n) => (X.HORS[n].length ? '<span class="r6p2-hz" role="img" aria-label="~ ' + n + ' sort de ta 16D : ' + sortN(n) + '">' + ICO('risque', 14) + X.HORS[n].map((f) => PIC(f, 13)).join('') + '</span>'
  : '<span class="r6p2-ok" role="img" aria-label="~ ' + n + ' reste dans ta 16D, hors le résineux déjà au-dessus">' + ICO('ok', 14) + '</span>');
// Un écart contre ★, en crans du style : « = » sous 0,15 cran (sous l'incertitude, rien à lire).
const ecart = (n, a, f) => (X.INC[n][f] || X.INC[a][f] ? '?' : Math.abs(X.DC[n][f] - X.DC[a][f]) < 0.15 ? '=' : '≈' + dtn(X.DC[n][f] - X.DC[a][f]));
// Vert quand l'écart va dans le sens de ta demande (moins de résineux, plus du reste) ; encre sinon.
const EC = (n, a, f) => { const d = X.INC[n][f] || X.INC[a][f] ? 0 : (X.DC[n][f] - X.DC[a][f]) * (f === 'resin' ? -1 : 1); return '<span class="mono' + (d >= 0.15 ? ' r6p2-bon' : '') + '">' + ecart(n, a, f) + '</span>'; };
// À quatre colonnes, la ligne « contre ★ » est déjà pleine : le gain reste en haut, la pastille passe sous le nom.
const LONG = (c) => c.mot.length > 8 && actifs().length <= 3;
const gainHtml = (a, c) => (X.INC[a][c.f] ? '' : PIC(c.f, 14) + '<b class="mono">~' + dtn(X.DC[a][c.f]) + '</b>');
const gainLab = (a, c) => a + ' : ~' + dtn(X.DC[a][c.f]) + ' cran de ' + X.COURT_F[c.f].toLowerCase() + ' face à ta stout, simulé';
function ligne() {
  const c = X.CRIT[CI], r = rang(), a = r[0], el = $('#r6p2-rep-2');
  let h, lab;
  if (SEL === a) {
    // À quatre, les noms ne tiennent plus sur la ligne : le rond lettré de w2, à la couleur du houblon.
    const qui = (n) => (r.length > 3 ? '<span class="r6p2-lt" role="img" aria-label="' + n + '" style="background:' + X.COUL[n] + '">' + X.LETTRE[n] + '</span>' : PT(n) + '<b>' + n + '</b>');
    h = '<span class="r6p2-ctr">contre' + STAR(12) + '</span>' + r.slice(1).map((n) => '<span class="r6p2-co">' + qui(n) + PIC(c.f, 13) + EC(n, a, c.f) + (X.HORS[n].length ? '<span class="r6p2-hz" role="img" aria-label="sort de ta 16D : ' + sortN(n) + '">' + ICO('risque', 12) + X.HORS[n].map((f) => PIC(f, 13)).join('') + '</span>' : '') + '</span>').join('');
    lab = 'Pourquoi ce classement : ' + a + ' en tête ; contre lui, ' + r.slice(1).map((n) => n + ' ' + c.mot + ' ' + ecart(n, a, c.f)).join(', ') + '. Toucher : les chiffres';
  } else {
    const fs = [...new Set([c.f, 'floral', 'resin'])];
    h = PT(SEL) + '<b>' + SEL + '</b><span class="r6p2-ctr">contre' + STAR(12) + '</span>' + fs.map((f) => '<span class="r6p2-co">' + PIC(f, 14) + EC(SEL, a, f) + '</span>').join('')
      + (X.HORS[SEL].length ? '<span class="r6p2-co r6p2-hz">' + ICO('risque', 12) + 'sort' + X.HORS[SEL].map((f) => PIC(f, 13)).join('') + '</span>' : '');
    lab = 'Pourquoi ce classement : ' + SEL + ' contre ' + a + ' : ' + fs.map((f) => X.COURT_F[f].toLowerCase() + ' ' + ecart(SEL, a, f)).join(', ') + (X.HORS[SEL].length ? ', sort de ta 16D : ' + sortN(SEL) : '') + '. Toucher : les chiffres';
  }
  // Libellé de pastille long (plus de huit caractères, « moins résineux ») : le gain de ★ passe en bout de cette
  // ligne, sinon il pousse la pastille sur le signe de 16D (D56, vu par le critique sur r6p2-resineux-390.png).
  if (LONG(c)) h += '<span class="r6p2-rep-g r6p2-rep-g2" role="img" aria-label="' + gainLab(a, c) + '" style="color:' + X.TXT_F[c.f] + '">' + gainHtml(a, c) + '</span>';
  el.innerHTML = h + '<span class="r6p2-chev">' + ICO('chev-r', 14) + '</span>';
  el.classList.toggle('r6p2-duo', SEL !== a); el.style.setProperty('--h', X.COUL[SEL]);
  el.setAttribute('aria-label', lab);
}
function reponse() {
  const c = X.CRIT[CI], r = rang(), a = r[0];
  $('#r6p2-rep-n').innerHTML = '<span class="r6p2-rep-st">' + STAR(18) + '</span>' + PT(a) + '<b>' + a + '</b>' + S16(a);
  $$('.r6p2-tetes [data-col]').forEach((b) => b.classList.toggle('r6p2-prem', b.dataset.col === a));
  // Son pourquoi à lui : ce qu'il gagne face à ta stout sur le critère, le même nombre que sous sa barre.
  const g = $('#r6p2-rep-g');
  g.innerHTML = gainHtml(a, c); g.hidden = LONG(c);
  g.style.color = X.TXT_F[c.f];
  g.setAttribute('aria-label', gainLab(a, c));
  $('#r6p2-pas-t').textContent = c.mot; $('#r6p2-pas-i').innerHTML = PIC(c.f, 14);
  $('.r6p2-pas').setAttribute('aria-label', 'Critère de classement : ' + c.mot);
  $$('#r6p2-crit [data-crit]').forEach((x) => x.setAttribute('aria-checked', String(+x.dataset.crit === CI)));
}
function pourquoi() {
  const c = X.CRIT[CI], f = c.f, r = rang();
  let h = '<p class="r6p2-sub">Par ' + c.mot + ' : le centre simulé de chaque houblon à 4 g/L, en crans du style, face à ta stout (' + (f === 'resin' ? 'ta dégustation, ~' + frn(X.AV[f], 0) : '~' + frn(X.AV[f], 1)) + ' sur 100).</p>';
  r.forEach((n, i) => { const v = X.V[n][f]; h += '<div class="r6p2-pqr"><span class="r6p2-rk">' + (i + 1) + '</span><span>' + PT(n) + '<b>' + n + '</b><small>~' + frn(v[1], 0) + ' sur 100, bande ' + frn(v[0], 0) + '–' + frn(v[2], 0) + (X.HORS[n].length ? ' · sort de ta 16D : ' + X.HORS[n].map((g) => X.COURT_F[g].toLowerCase()).join(', ') : ' · dans ta 16D') + '</small></span><b class="mono">' + (X.INC[n][f] ? '?' : '~' + dtn(X.DC[n][f])) + '</b></div>'; });
  h += '<p class="r6p2-sub">Les bandes se recouvrent toutes : un écart de moins d’un cran est un indice, pas une preuve. Le moteur ne connaît pas ta bière noire (seuil non mesuré).</p>';
  $('#r6p2-pq-c').innerHTML = h;
}
function mulberry(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function tirer() {
  const rnd = mulberry(GRAINE);
  let h = '<div class="r6p2-tg"><span></span>' + X.TOUS.map((n) => '<span class="r6p2-tc2" data-col="' + n + '" style="color:' + X.COUL[n] + ';font-weight:700">' + n + '</span>').join('') + '</div>';
  X.LIGNES.forEach((f) => {
    h += '<div class="r6p2-tg"><span class="r6p2-fn" style="color:#16161a">' + PIC(f, 14) + '<span>' + X.COURT_F[f] + '</span></span>';
    X.TOUS.forEach((n) => {
      if (X.INC[n][f]) { h += '<span class="r6p2-tc2" data-col="' + n + '"><i class="r6p2-hach"></i></span>'; return; }
      const v = X.V[n][f], deja = X.AV[f] > X.BANDE[f]; let k = 0, d = '';
      for (let i = 0; i < 20; i++) { const x = v[0] + rnd() * (v[2] - v[0]), o = x > X.BANDE[f]; if (o) k++; d += '<i' + (o ? ' class="r6p2-o"' : '') + '></i>'; }
      h += '<span class="r6p2-tc2" data-col="' + n + '" style="--b:' + X.JET_B[f] + '"><span class="r6p2-dots">' + d + '</span><b' + (k ? ' class="r6p2-o"' : '') + '>' + (deja ? 'déjà hors' : k + ' sur 20') + '</b></span>';
    });
    h += '</div>';
  });
  $('#r6p2-tir-g').innerHTML = h; ordonner();
}
function duel() {
  const autres = actifs().filter((n) => n !== SEL); if (!autres.includes(AUTRE)) AUTRE = autres[0];
  const a = SEL, b = AUTRE;
  let h = '<div class="r6p2-duh"><span>' + PT(a) + '<b>' + a + '</b> en a plus</span><button type="button" class="r6p2-dusw" id="r6p2-dusw" aria-label="Changer le houblon d’en face">' + ICO('melange', 16) + '</button><span><b>' + b + '</b> en a plus ' + PT(b) + '</span></div>';
  X.DUEL.forEach((r) => {
    const va = r.v[a], vb = r.v[b];
    let txt, wa = 0, wb = 0;
    if (!va || !vb) txt = '? inconnu'; else if (va.borne || vb.borne) txt = '? borne haute seule';
    else { const q = va.m / vb.m, big = q >= 1 ? q : 1 / q, l = Math.min(1, Math.log10(big)), g = (q >= 1 ? va.ouvert : vb.ouvert) ? '≥ ' : ''; if (big < 1.15) txt = '≈ pareil'; else { txt = (q >= 1 ? a : b) + ' ' + g + '×' + frn(big, 1); if (q >= 1) wa = l; else wb = l; } }
    const col = r.f ? X.JET_B[r.f] : '#5b5b66';
    h += '<div class="r6p2-dur"><span class="r6p2-dul">' + (r.f ? PIC(r.f, 14) : ICO('huile', 14)) + r.nom + '<span class="mono">' + txt + '</span></span><span class="r6p2-dub g"><i style="width:' + (wa * 100).toFixed(0) + '%;background:' + X.COUL[a] + '"></i></span><span class="r6p2-dub"><i style="width:' + (wb * 100).toFixed(0) + '%;background:' + X.COUL[b] + '"></i></span></div>';
  });
  h += '<p class="r6p2-sub">Milieu des plages publiées, rapport écrit ; barre pleine à ×10. Mêmes mots dans les fiches, pas le même cône.</p>';
  $('#r6p2-duel').innerHTML = h;
  $('#r6p2-dusw').addEventListener('click', () => { const o = actifs().filter((n) => n !== SEL); AUTRE = o[(o.indexOf(AUTRE) + 1) % o.length]; duel(); });
}
function choisir(n) {
  SEL = n;
  $$('.r6p2-tetes [role="radio"]').forEach((b) => { const on = b.dataset.col === n; b.setAttribute('aria-checked', String(on)); });
  $$('[data-col]').forEach((c) => { const on = c.dataset.col === n; c.classList.toggle('r6p2-sel', on); if (c.classList.contains('r6p2-cel')) c.style.setProperty('--hs', on ? X.COUL[n] : 'transparent'); });
  $('#r6p2-pont').setAttribute('aria-label', 'Doser ' + n + ' dans Dryhopper'); $('#r6p2-dk-sc').textContent = X.SCORE[n] + '/4';
  dessiner(); duel(); ligne();
}
function critere(i, suivre) { CI = i; ordonner(); reponse(); pourquoi(); if (suivre) choisir(rang()[0]); }
function quatre(on) {
  N4 = on; document.body.classList.toggle('r6p2-n4', on);
  const b = $('#r6p2-ajb'); b.querySelector('span').textContent = on ? 'Retirer ' + X.AJOUT + ' de la comparaison' : 'Ajouter ' + X.AJOUT + ' à la comparaison';
  if (!on && SEL === X.AJOUT) SEL = rang()[0];
  ordonner(); reponse(); pourquoi(); choisir(SEL); tirer();
}
$$('.r6p2-tetes [role="radio"]').forEach((b) => b.addEventListener('click', () => choisir(b.dataset.col)));
$$('.lentille [data-e]').forEach((b) => b.addEventListener('click', () => setTimeout(dessiner, 0)));
// La pastille de critère (y1b) : un toucher ouvre la liste, un choix la referme et reclasse.
const PAS = $('.r6p2-pas'), LST = $('#r6p2-crit');
const liste = (on) => { LST.hidden = !on; PAS.setAttribute('aria-expanded', String(on)); };
PAS.addEventListener('click', (e) => { e.stopPropagation(); liste(LST.hidden); });
$$('#r6p2-crit [data-crit]').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); critere(+b.dataset.crit, true); liste(false); }));
document.addEventListener('click', (e) => { if (!LST.hidden && !LST.contains(e.target)) liste(false); });
// Les feuilles : un déclencheur, une feuille, une à la fois ; le voile, la croix, Échap ou le même toucher referment.
const VOILE = $('#r6p2-voile'); let OUV = null;
function fermer() { if (!OUV) return; OUV.f.hidden = true; OUV.b.setAttribute('aria-expanded', 'false'); VOILE.hidden = true; OUV = null; }
function ouvrir(id, b) { fermer(); const f = document.getElementById(id); f.hidden = false; f.scrollTop = 0; VOILE.hidden = false; b.setAttribute('aria-expanded', 'true'); OUV = { f, b }; }
$$('[aria-controls^="r6p2-f-"]').forEach((b) => b.addEventListener('click', () => { const id = b.getAttribute('aria-controls'); if (OUV && OUV.f.id === id) fermer(); else ouvrir(id, b); }));
VOILE.addEventListener('click', fermer);
$$('[data-ferme]').forEach((b) => b.addEventListener('click', fermer));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { fermer(); liste(false); } });
$('#r6p2-retire').addEventListener('click', () => { GRAINE += 1; tirer(); });
$('#r6p2-ajb').addEventListener('click', () => quatre(!N4));
const LB = $('[data-role="legende-bouton"]'), LG = $('[data-role="legende"]'), LV = $('[data-role="legende-voile"]');
const legende = (on) => { LG.hidden = !on; LV.hidden = !on; LB.setAttribute('aria-expanded', String(on)); };
LB.addEventListener('click', () => legende(LB.getAttribute('aria-expanded') !== 'true'));
$('[data-role="legende-fermer"]').addEventListener('click', () => legende(false));
LV.addEventListener('click', () => legende(false));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') legende(false); });
critere(0); choisir(SEL); tirer();
// États pour les captures : ?sel=Galaxy, ?crit=2, ?n4, ?ouvre=defi, ?legende, ?liste.
const Q = new URLSearchParams(location.search);
if (Q.has('n4')) quatre(true);
if (Q.get('crit')) critere(+Q.get('crit'), true);
if (Q.get('sel') && actifs().includes(Q.get('sel'))) choisir(Q.get('sel'));
if (Q.has('legende')) legende(true);
if (Q.has('liste')) liste(true);
if (Q.get('ouvre')) { const b = document.querySelector('[aria-controls="r6p2-f-' + Q.get('ouvre') + '"]'); if (b) b.click(); }
})();`;

const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>r6p2 · La réponse d'abord · Comparer</title>
<!-- Lot 22 ter · r6p2 · La réponse d'abord · généré par generer.mjs depuis ../donnees/comparer-stout.json. Choix portés : Radar r2 ; Base dose égale ; Porte non ; Descripteurs A. -->
${S.POLICES}
<style>${S.CSS}
${css}</style>
</head>
<body>
${S.SYMB}
<main class="ecran">${corps}
</main>
${dock}
${feuilles}
${legende}
<script>${js}</script>
<script>${rt}</script>
</body>
</html>
`;
fs.writeFileSync(path.join(ICI, 'etat.html'), html);
console.log('écrit r6p2/etat.html (' + Math.round(html.length / 1024) + ' Ko) · départ : ' + DEPART + ' · inconnus pour tous : ' + TOUS_INC.join(', '));
for (const n of TOUS) console.log(n, 'hors :', hors(n).join(',') || '—', '· floral ~' + dt(dCran(n, VEUT)), '· résineux ~' + dt(dCran(n, TROP)), '· défi', SCORE[n] + '/4');
