// Lot 22 bis · r6n1 · « Tout au premier écran ». Comparer : « Lequel pour ma stout : Cascade, Idaho 7 ou Galaxy ? »
// Reprise de r6a (choisie par le brasseur) avec tout ce qu'il avait noté bon ou intéressant (inventaire D104),
// y1b d'abord. Le parti : chaque élément repris, en contexte ou en pont se voit AU REPOS dans les 844 premiers
// pixels, en 80 mots au plus. d1 « tout ouvert », mais rangé : des formes, des couleurs et des positions à la
// place du texte. L'ordre de l8 : la réponse et les objectifs en tête, puis les houblons en colonnes dont les
// barres tombent dans des rangées de familles communes.
// Choix portés (les mêmes que r6a) : Radar r2 ; Base dose égale ; Porte non ; Descripteurs A.
// Données : ../donnees/comparer-stout.json seul ; les titres des références (H2, H22…) sont lus dans le fichier
// que ce JSON cite comme source des composés (prototypes/houblons-v4/data/composes-houblon.json).
// Calculs faits ici : mises à l'échelle (au style : valeur / domaine de la famille ; absolu : valeur / 125),
// différences en crans ((centre − ta stout) / cran du style), enveloppe des plages des sources, mg/L × 1000,
// IBU par gramme × grammes (20 L) pour l'aperçu « à 10′ ». Rien d'autre. Le tirage de 20 bières est uniforme
// dans la bande du moteur (convention de lecture, écrite dans la légende), avec une graine fixe.
// Classes préfixées r6n1- (L26) ; le code client est assemblé sans String.replace sur une chaîne à « $ ».
// Usage : node work/refonte-frontend/v4/ecran-1/fils22-comparer/r6n1/generer.mjs → r6n1/etat.html
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

// ---------- les houblons, à dose égale ----------
const NOMS = ['Cascade', 'Idaho 7', 'Galaxy'];
const NS4 = 'Nelson Sauvin'; // le « + » l'ajoute en quatrième colonne (il est dans les données du lot)
const TOUS = [...NOMS, NS4];
// Une couleur par houblon, la même que dans les lots 20 à 22 ; Nelson Sauvin prend un bleu libre ici.
const COUL = { Cascade: '#781838', 'Idaho 7': '#e80030', Galaxy: '#681878', 'Nelson Sauvin': '#1a5e8a' };
const EG = D.egalites.doseEgale;
const HB = Object.fromEntries(TOUS.map((n) => [n, D.houblons.find((h) => h.nom === n)]));
const point = (n, o) => HB[n].grille.find((g) => g.moment === o.moment && g.dose_gL === o.dose_gL && g.jours === o.jours && g.levure === o.levure);
const PT = Object.fromEntries(TOUS.map((n) => [n, point(n, EG)]));
const AV = D.biere.avant;
const BANDE = Object.fromEntries(ORDRE.map((f) => [f, D.style.zone[f].bande[1]]));
const DOM = Object.fromEntries(ORDRE.map((f) => [f, D.echelle.parFamille[f].domaine[1]]));
const CRAN = Object.fromEntries(ORDRE.map((f) => [f, D.echelle.parFamille[f].cran]));
const ABS = 125;
const val = (n, f, p = PT[n]) => { const [bas, centre, haut] = p.apres[f]; return { bas, centre, haut }; };
const decrit = (n, f) => (HB[n].aromes.find((a) => a.family === f) || {}).sources > 0;
const inconnu = (n, f) => { const v = val(n, f); return (v.bas === 0 && v.centre === 0 && v.haut === 0) || (PT[n].delta[f] === 0 && !decrit(n, f)); };
const TOUS_INC = ORDRE.filter((f) => TOUS.every((n) => inconnu(n, f)));
const VEUT = 'floral', TROP = D.biere.degustation.familles[0].famille;
const LIGNES = ORDRE.filter((f) => !TOUS_INC.includes(f) && f !== VEUT && f !== TROP);
const dCran = (n, f) => (val(n, f).centre - AV[f].centre) / CRAN[f];
const hors = (n) => ORDRE.filter((f) => !inconnu(n, f) && val(n, f).centre > BANDE[f] && AV[f].centre <= BANDE[f]);
const sg = (d, k = 1) => (d >= 0 ? '+' : '−') + fr(Math.abs(d), k);

// ---------- ta demande, lue comme deux pistes d'objectif (l5b) ----------
// La visée : un cran du style au-dessus de ta stout pour « plus floral », un cran au-dessous pour « moins
// résineux ». Règle de lecture proposée par la variante, écrite dans la légende, à corriger par le brasseur.
const VISEE = { [VEUT]: AV[VEUT].centre + CRAN[VEUT], [TROP]: AV[TROP].centre - CRAN[TROP] };
const SENS = { [VEUT]: 1, [TROP]: -1 };
const verdictObj = (n, f) => { const c = val(n, f).centre, a = AV[f].centre, s = SENS[f]; return s * (c - VISEE[f]) >= 0 ? 'atteint' : s * (c - a) > 0 ? 'approche' : 'aucune'; };
const RANGV = { atteint: 2, approche: 1, aucune: 0 };
const MOTV = { atteint: 'Atteint', approche: 'Approche', aucune: 'Aucune' };

// ---------- le critère de classement (pastille de y1b) ----------
const CRITERES = ['floral', 'citrus', 'tropical'];
// Rang : dans ta 16D d'abord, puis le plus haut centre simulé de la famille choisie.
const classer = (f, noms) => [...noms].sort((a, b) => (hors(a).length > 0) - (hors(b).length > 0) || val(b, f).centre - val(a, f).centre);
const RANGS = Object.fromEntries(CRITERES.map((f) => [f, { 3: classer(f, NOMS), 4: classer(f, TOUS) }]));
const DEPART = RANGS.floral[3][0];

// ---------- α, rôle, stock ----------
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
  return `<span class="al fi" data-role="alpha" data-source="fiches" data-nature="mesure" aria-label="α des fiches : ${pl} (${esc(A.srcs)})${A.article ? ' ; ' + fr(A.article) + ' % lu sur un article' : ''}">${ic('livre', 12)}${pl}</span>`;
}
const roleHtml = (n) => { const R = ROLE[n]; return `<span class="us us-mot${R.regle ? ' deduit' : ''}" data-role="usage" data-usage="${R.v}" data-source="${R.regle ? 'règle' : 'fournisseur'}" aria-label="Usage : ${MOT_ROLE[R.v]}${R.regle ? ', déduit de l’α, à valider' : ', attesté par le fournisseur'}"><span class="us-m">${MOT_ROLE[R.v]}</span></span>`; };
const stockHtml = (n) => (ALPHA[n].lot != null ? `<span class="w-stk" role="img" aria-label="lot en stock (α de sa fiche de stock)">${ic('stock', 14)}</span>` : `<span class="w-stk" role="img" aria-label="à acheter">${ic('achat', 14)}</span>`);
const famillesHtml = (n) => HB[n].aromes.filter((a) => a.sources > 0).sort((a, b) => b.level - a.level || ORDRE.indexOf(a.family) - ORDRE.indexOf(b.family)).slice(0, 4)
  .map((a) => pic(a.family, a.level >= 2 ? 14 : 12, `data-niveau="${a.level >= 2 ? 'marqué' : 'cité'}"`)).join('');
const verdictIc = (n) => { const h = hors(n); return h.length ? `<span class="r6n1-vd hors" data-nature="simule" role="img" aria-label="~ sort de ta 16D : ${h.map((f) => NOM[f].toLowerCase()).join(', ')}">${ic('risque', 14)}</span>` : `<span class="r6n1-vd dans" data-nature="simule" role="img" aria-label="~ reste dans ta 16D, hors le résineux déjà au-dessus">${ic('ok', 14)}</span>`; };

// ---------- une cellule : la barre de l5b face à ta 16D, son filet mesuré, sa dose d'effet égal ----------
const P = (x) => Math.round(Math.max(0, x) * 1000) / 10 + '%';
const cl = (x) => Math.min(1, Math.max(0, x));
function geo(f, v, k) {
  const s = (x) => x / k;
  return { z: cl(s(BANDE[f])), gb: cl(Math.min(v.centre, BANDE[f]) / k), xo: v.centre > BANDE[f] ? cl(s(v.centre)) - cl(s(BANDE[f])) : 0, w0: cl(s(v.bas)), w1: cl(s(v.haut)), dep: s(v.centre) > 1, av: cl(s(AV[f].centre)) };
}
// Chimie rattachée à sa famille, dans la rangée même (d1 rangé, v1 au premier plan) : composé → famille.
const FILET = { herbal: ['humulene', 'humulène', '% huile'], tropical: ['4MMP', '4MMP', 'µg/kg'], spice: ['caryophyllene', 'caryophyllène', '% huile'] };
const court = (id) => {
  if (/^bm-/.test(id)) return 'Beer Maverick 2023';
  if (/^hs-/.test(id)) return 'Hopsteiner 2025';
  const r = REFS[id]; if (!r) return id;
  return r.titre.split(/[,:]/)[0].replace(/\s+et al\.?$/, '') + (r.annee ? ' ' + r.annee : '');
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
const CPD = (n, k) => plageDe((HB[n].composes.composes[k] || {}).valeurs);
const milieu = (c) => (c.lo + (c.hi ?? c.lo * 1.6)) / 2;
const FIL = Object.fromEntries(Object.entries(FILET).map(([f, [k]]) => {
  const cells = Object.fromEntries(TOUS.map((n) => [n, CPD(n, k)]));
  const connus = TOUS.filter((n) => cells[n]);
  const mx = Math.max(...connus.map((n) => cells[n].hi ?? cells[n].lo * 1.6)) * 1.08;
  const haut3 = NOMS.filter((n) => cells[n]).sort((a, b) => milieu(cells[b]) - milieu(cells[a]))[0];
  const haut4 = connus.sort((a, b) => milieu(cells[b]) - milieu(cells[a]))[0];
  return [f, { cells, mx, haut3, haut4 }];
}));
// Effet égal (y3 « pour égaler ») : la dose de chaque houblon qui donne le même gain que la référence.
const EGAL = Object.fromEntries(D.egalites.effetEgal.map((e) => [e.famille, e]));
function cellule(n, f) {
  const sel = n === DEPART ? ' sel' : '';
  const fil = FILET[f] ? filet(n, f) : '';
  const eg = EGAL[f] ? egal(n, f) : '';
  if (inconnu(n, f)) return `<span class="r6n1-cel inc${sel}" data-col="${esc(n)}" role="img" aria-label="${NOM[f]}, ${esc(n)} : apport inconnu, pas zéro (famille absente de ses fiches)"><span class="r6n1-pis"><i class="r6n1-hach"></i></span>${fil}${eg}</span>`;
  const v = val(n, f), g = geo(f, v, DOM[f]), a = geo(f, v, ABS), hs = v.centre > BANDE[f];
  const st = ['z', 'gb', 'xo', 'w0', 'w1', 'av'].map((k) => `--${k}:${P(g[k])};--${k}a:${P(a[k])}`).join(';') + `;--xb:${P(g.gb)};--xba:${P(a.gb)}`;
  const d = dCran(n, f);
  return `<span class="r6n1-cel${hs ? ' hs' : ''}${g.dep ? ' dep' : ''}${a.dep ? ' depa' : ''}${sel}" data-col="${esc(n)}" data-tir="${[g.w0, g.w1, g.z, a.w0, a.w1, a.z].map((x) => Math.round(x * 1000) / 1000).join(',')}" style="${st}" role="img" aria-label="${NOM[f]}, ${esc(n)} 4 g/L : ~ ${fr(v.centre, 0)} sur 100 (bande ${fr(v.bas, 0)}–${fr(v.haut, 0)}), ${sg(d)} cran${Math.abs(d) >= 2 ? 's' : ''} face à ta stout ; ta 16D jusqu’à ${BANDE[f]}${hs ? ' : au-dessus' : ''}">
    <span class="r6n1-pis"><i class="r6n1-zo" data-role="zone" data-famille="${f}"></i><i class="r6n1-ba" data-famille="${f}"></i><i class="r6n1-xo"></i><i class="r6n1-wh"></i><i class="r6n1-av"></i><span class="r6n1-tir" aria-hidden="true"></span></span>${fil}${eg}</span>`;
}
function filet(n, f) {
  const [k, nom, u] = FILET[f], F = FIL[f], c = F.cells[n];
  if (!c) return `<span class="r6n1-fil inc" data-element="d1-tout-ouvert v1-vraies-valeurs v1-en-a-plus" role="img" aria-label="${nom} de ${esc(n)} : inconnu, aucune valeur publiée"><i class="r6n1-fil-h"></i></span>`;
  const l = (c.lo / F.mx) * 100, r = ((c.hi ?? F.mx) / F.mx) * 100;
  const src = c.ids.map((i) => CITES.get(i) || i).join(' ; ');
  return `<span class="r6n1-fil${c.ouvert ? ' ouvert' : ''}${c.ouvertB ? ' ouvertb' : ''}${c.verif ? ' verif' : ''}" data-element="d1-tout-ouvert v1-vraies-valeurs v1-en-a-plus" data-haut3="${F.haut3 === n}" data-haut4="${F.haut4 === n}" data-nature="mesure" data-source="${esc(src)}" style="--c:${COUL[n]}" role="img" aria-label="${nom} de ${esc(n)}, mesuré : ${c.txt} ${u} (${esc(c.ids.join(', '))})${c.verif ? ', à confirmer' : ''}"><i style="left:${l.toFixed(1)}%;width:${Math.max(4, r - l).toFixed(1)}%"></i></span>`;
}
function egal(n, f) {
  const e = EGAL[f], d = e.doses[n], ref = e.reference.nom === n;
  const t = d == null ? '>8g/L' : (ref ? '=' : '~') + fr(d, 1) + 'g/L';
  const al = d == null ? `${esc(n)} n’atteint pas le ${NOM[f].toLowerCase()} de ${e.reference.nom} à ${e.reference.dose_gL} g/L, même à 8 g/L (hors grille : dose inconnue, pas zéro)` : ref ? `référence : ${esc(n)} à ${fr(d, 1)} g/L` : `${esc(n)} : ~ ${fr(d, 1)} g/L pour égaler le ${NOM[f].toLowerCase()} de ${e.reference.nom} à ${e.reference.dose_gL} g/L`;
  return `<span class="r6n1-eg${d == null ? ' jamais' : ''}${ref ? ' ref' : ''}" data-element="y3-pour-egaler" data-nature="${ref ? 'base' : 'simule'}" aria-label="${al}">${t}</span>`;
}
function rangee(f) {
  const lab = `<span class="r6n1-rn" style="color:${JET[f].texte}">${pic(f, 16)}${FILET[f] ? `<span class="r6n1-lab" role="img" aria-label="trait fin : ${FILET[f][1]}, mesuré">${ic('labo', 12)}</span>` : ''}${EGAL[f] ? `<span class="r6n1-lab" role="img" aria-label="dessous : la dose pour égaler">${ic('egal', 12)}</span>` : ''}</span>`;
  return `<div class="r6n1-g r6n1-rg${FILET[f] ? ' fil' : ''}${EGAL[f] ? ' egl' : ''}" data-famille-ligne="${f}">${lab}${TOUS.map((n) => cellule(n, f)).join('')}</div>`;
}

// ---------- les pistes d'objectif : une piste commune par demande (w2), le verdict en mot (l5b, l8b) ----------
function piste(f) {
  const k = f === TROP ? ABS : DOM[f]; // le résineux de ta stout est déjà au-dessus du domaine : lu en absolu
  const x = (v, kk = k) => P(cl(v / kk));
  const xa = (v) => P(cl(v / ABS));
  const whisk = TOUS.map((n, j) => {
    const v = val(n, f), dep = v.haut > k, depA = v.haut > ABS;
    const fin = (kk) => (v.haut > kk ? 0.9 : v.haut / kk);
    return `<span class="r6n1-wk${n === DEPART ? ' sel' : ''}${dep ? ' dep' : ''}${depA ? ' depa' : ''}" data-col="${esc(n)}" style="--c:${COUL[n]};--j:${j};--w0:${x(v.bas)};--w1:${P(fin(k))};--ce:${x(v.centre)};--w0a:${xa(v.bas)};--w1a:${P(fin(ABS))};--cea:${xa(v.centre)}" aria-label="${esc(n)} : ~ ${fr(v.centre, 0)} (bande ${fr(v.bas, 0)}–${fr(v.haut, 0)}), ${MOTV[verdictObj(n, f)].toLowerCase()}"><i class="r6n1-wl"></i><i class="r6n1-wd"></i></span>`;
  }).join('');
  const best3 = [...NOMS].sort((a, b) => RANGV[verdictObj(b, f)] - RANGV[verdictObj(a, f)] || SENS[f] * (val(b, f).centre - val(a, f).centre))[0];
  const vb = verdictObj(best3, f);
  const ic2 = vb === 'atteint' ? 'atteint' : vb === 'approche' ? 'approche' : 'aucune';
  const sugg = f === TROP ? `<nav class="r6n1-sug" aria-label="Autre outil"><a href="#" data-role="pont" data-outil="Suggérer" data-element="s5-deux-objectifs" aria-label="Suggérer : les pistes hors houblon pour moins de résineux (Nugget à 60′, eau, levure)"><span>Suggérer</span>${ic('chev-r', 14)}</a></nav>` : '';
  return `<div class="r6n1-piste" data-famille-ligne="${f}" style="--f:${JET[f].fond};--t:${JET[f].texte};--b:${JET[f].base}" data-element="l5b-pistes-objectif l8b-verdicts-pictos-trait w2-piste-commune${f === VEUT ? ' h4-radar-demande' : ''}">
    <div class="r6n1-pi-h"><span class="r6n1-dem${f === TROP ? ' trop' : ''}" role="img" aria-label="${f === TROP ? 'ta dégustation : trop de résineux' : 'ta demande : plus de floral'}">${ic(f === TROP ? 'bas' : 'haut', 14)}</span>${pic(f, 16)}<b style="color:${JET[f].texte}">${COURT[f]}</b>${f === TROP ? `<span class="r6n1-abs" role="img" aria-label="lu en absolu : ta stout est déjà au-dessus du style">${ic('echelle', 14)}</span>` : ''}
      <span class="r6n1-vb ${vb}" data-nature="simule" aria-label="Meilleur des trois : ${esc(best3)}, ${MOTV[vb].toLowerCase()} (visée : un cran ${f === TROP ? 'sous' : 'au-dessus de'} ta stout)">${ic(ic2, 14)}<span>${MOTV[vb]}</span><i class="w-pt" style="background:${COUL[best3]}" aria-hidden="true"></i></span>${sugg}</div>
    <div class="r6n1-pi-t" style="--z:${x(BANDE[f])};--za:${xa(BANDE[f])};--av:${x(AV[f].centre)};--ava:${xa(AV[f].centre)};--vi:${x(VISEE[f])};--via:${xa(VISEE[f])}" role="img" aria-label="Piste ${COURT[f]} : zone de ta 16D, trait noir ta stout, pointillé la visée ; un trait par houblon, sa bande, son point au centre">
      <i class="r6n1-pz" data-role="zone" data-famille="${f}"></i><i class="r6n1-pv"></i>${whisk}<i class="r6n1-pa"></i></div></div>`;
}

// ---------- les têtes de colonne : le seul facteur libre (la variété) ----------
const tete = (n) => `<div class="r6n1-tc${n === DEPART ? ' sel' : ''}" data-col="${esc(n)}" style="--h:${COUL[n]}">
  <button type="button" role="radio" class="r6n1-tcb" aria-checked="${n === DEPART}" aria-label="Mettre en avant ${esc(n)}">
    <span class="r6n1-tn"><i class="w-pt" style="background:${COUL[n]}" aria-hidden="true"></i><span class="hn" data-houblon="${esc(n)}" data-couleur="${COUL[n]}">${esc(n)}</span>${stockHtml(n)}</span>
    <span class="r6n1-ta">${alphaHtml(n)}</span>
    <span class="r6n1-tr">${roleHtml(n)}</span>
    <span class="r6n1-tf">${verdictIc(n)}<span class="r6n1-tfp" aria-label="ses familles, d’après ses fiches">${famillesHtml(n)}</span></span></button>
  <button type="button" class="r6n1-fi" data-element="g1-fiche fiche-citra-cryo" data-ouvre="${esc(n)}" aria-label="Fiche de ${esc(n)} (ou appui long sur son nom)">${ic('info', 14)}</button>${n === NS4 ? `<button type="button" class="r6n1-ret" aria-label="Retirer ${esc(n)} de la comparaison">${ic('x', 12)}</button>` : ''}
</div>`;

// ---------- le radar r2 : centre plein du houblon touché, son intervalle en trait sur chaque axe ----------
// D103 : la bande ne pousse plus vers le bord. L'intervalle se lit en trait sur chaque axe, du bas au haut ;
// un haut au-delà du domaine s'arrête à 90 % du rayon et un chevron se pose au bout de l'axe.
const RD = {
  axes: ORDRE, dom: ORDRE.map((f) => DOM[f]), bande: ORDRE.map((f) => BANDE[f]), abs: ABS, acc: ACC,
  av: ORDRE.map((f) => AV[f].centre), incTous: ORDRE.map((f) => TOUS_INC.includes(f)), veut: ORDRE.indexOf(VEUT), trop: ORDRE.indexOf(TROP),
  h: TOUS.map((n) => ({ n, c: COUL[n], ce: ORDRE.map((f) => val(n, f).centre), ba: ORDRE.map((f) => val(n, f).bas), ha: ORDRE.map((f) => val(n, f).haut), inc: ORDRE.map((f) => inconnu(n, f)) })),
};
function radarSvg(R, sel, abs, actifs) {
  const W = 190, H = 184, cx = 95, cy = 92, RR = 62, n = R.axes.length, pas = 2 * Math.PI / n, MAX = 1.1;
  const k = (i, v) => Math.min(MAX, Math.max(0, v / (abs ? R.abs : R.dom[i])));
  const kr = (i, v) => Math.max(0, v / (abs ? R.abs : R.dom[i]));
  const pt = (i, r) => [cx + Math.sin(i * pas) * RR * r, cy - Math.cos(i * pas) * RR * r];
  const rd = (x) => Math.round(x * 10) / 10;
  const pts = (rs) => rs.map((r, i) => pt(i, r).map(rd).join(',')).join(' ');
  const ring = (rs) => { const p = rs.map((r, i) => pt(i, r)); return 'M' + p.map((x) => x.map(rd).join(',')).join('L') + 'Z'; };
  let s = `<svg data-radar="" data-objet="comparer" data-axes="${R.axes.join(',')}" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Radar ${abs ? 'absolu' : 'au style'} : ${R.h[sel].n} plein, avec son intervalle sur chaque axe ; les autres en contour ; zone verte : ta 16D ; trait noir : ta stout">`;
  s += '<defs><pattern id="r6n1-rh" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="#9aa0ab" stroke-width="1.2"/></pattern></defs>';
  R.axes.forEach((f, i) => { if (!R.incTous[i]) return; const a = pt(i - 0.5, 1), b = pt(i + 0.5, 1); s += `<path d="M${cx},${cy}L${a.map(rd).join(',')}L${b.map(rd).join(',')}Z" fill="url(#r6n1-rh)" opacity=".7"/>`; });
  s += `<path data-role="zone" d="${ring(R.bande.map((b, i) => Math.min(MAX, b / (abs ? R.abs : R.dom[i]))))}" fill="rgba(47,107,79,.10)" stroke="#2f6b4f" stroke-width="1"/>`;
  for (const r of [0.5, 1]) s += `<path d="${ring(R.axes.map(() => r))}" fill="none" stroke="#dcdce3" stroke-width="1"/>`;
  R.axes.forEach((f, i) => { const e = pt(i, 1); s += `<line x1="${cx}" y1="${cy}" x2="${rd(e[0])}" y2="${rd(e[1])}" stroke="#dcdce3" stroke-width="1"/>`; });
  const ordre = R.h.map((x, j) => j).filter((j) => actifs[j] && j !== sel).concat([sel]);
  for (const j of ordre) {
    const h = R.h[j], plein = j === sel, ce = h.ce.map((v, i) => k(i, v));
    s += `<g data-serie="${h.n}" data-couleur="${h.c}" data-valeurs="${h.ce.map(rd).join(',')}" data-inconnues="${R.axes.filter((f, i) => h.inc[i]).join(',')}">`;
    if (plein) {
      // l'intervalle, en trait sur chaque axe
      h.ba.forEach((b, i) => {
        if (h.inc[i]) return;
        const r0 = kr(i, b), r1 = kr(i, h.ha[i]), fin = r1 > 1 ? 0.9 : r1;
        const a = pt(i, Math.min(r0, fin)), e = pt(i, fin);
        s += `<line x1="${rd(a[0])}" y1="${rd(a[1])}" x2="${rd(e[0])}" y2="${rd(e[1])}" stroke="${h.c}" stroke-opacity=".24" stroke-width="2.5" stroke-linecap="round"/>`;
        if (r1 > 1) { const ang = i * pas, t = pt(i, 1.02), q = (dx, dy) => [t[0] + Math.cos(ang) * dx + Math.sin(ang) * dy, t[1] + Math.sin(ang) * dx - Math.cos(ang) * dy]; const p1 = q(-2.6, -2.6), p2 = q(0, 0.4), p3 = q(2.6, -2.6); s += `<path d="M${rd(p1[0])},${rd(p1[1])}L${rd(p2[0])},${rd(p2[1])}L${rd(p3[0])},${rd(p3[1])}" fill="none" stroke="${h.c}" stroke-opacity=".7" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>`; }
      });
    }
    s += `<polygon points="${pts(ce)}" fill="${plein ? h.c : 'none'}" fill-opacity="${plein ? 0.2 : 0}" stroke="${h.c}" stroke-width="${plein ? 2.5 : 1.5}" stroke-linejoin="round"/>`;
    if (plein) ce.forEach((r, i) => { const q = pt(i, r); s += h.inc[i] ? `<circle cx="${rd(q[0])}" cy="${rd(q[1])}" r="3.2" fill="#fff" stroke="#8a909b" stroke-width="1.5"/>` : `<circle cx="${rd(q[0])}" cy="${rd(q[1])}" r="2.8" fill="${r >= MAX ? R.acc : h.c}"/>`; });
    s += '</g>';
  }
  s += `<polygon points="${pts(R.av.map((v, i) => k(i, v)))}" fill="none" stroke="#16161a" stroke-width="1.5" stroke-linejoin="round"/>`;
  // h4 : ta demande au bout des axes, flèche vers l'extérieur (plus) ou vers le centre (moins)
  const fl = (i, out, c) => { const a = pt(i, out ? 1.02 : 1.14), b = pt(i, out ? 1.14 : 1.02), ang = Math.atan2(b[1] - a[1], b[0] - a[0]), hx = (d) => [b[0] - Math.cos(ang + d) * 4, b[1] - Math.sin(ang + d) * 4]; const h1 = hx(0.6), h2 = hx(-0.6); return `<path d="M${rd(a[0])},${rd(a[1])}L${rd(b[0])},${rd(b[1])}M${rd(h1[0])},${rd(h1[1])}L${rd(b[0])},${rd(b[1])}L${rd(h2[0])},${rd(h2[1])}" stroke="${c}" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`; };
  R.axes.forEach((f, i) => {
    const off = i === R.veut || i === R.trop ? 1.32 : 1.24, q = pt(i, off);
    s += `<use href="#p-${f}" x="${rd(q[0] - 7)}" y="${rd(q[1] - 7)}" width="14" height="14"${R.incTous[i] ? ' opacity=".45"' : ''}/>`;
    if (R.incTous[i]) s += `<text x="${rd(q[0] + (q[0] >= cx ? 9 : -9))}" y="${rd(q[1] + 4)}" text-anchor="${q[0] >= cx ? 'start' : 'end'}" class="r6n1-rq">?</text>`;
  });
  s += fl(R.veut, true, '#16161a') + fl(R.trop, false, R.acc);
  return s + '</svg>';
}
const radarSrc = radarSvg.toString();
const ACTIFS0 = TOUS.map((n) => NOMS.includes(n));
const radar0 = new Function('return ' + radarSrc)()(RD, TOUS.indexOf(DEPART), false, ACTIFS0);

// ---------- le panel OSU (Cascade, mesuré), sans molette, en vignette ----------
const O = D.panelOSU;
function osuSvg() {
  const W = 160, H = 58, x0 = 4, x1 = W - 4, y0 = 4, y1 = H - 4, xs = O.doses.map((d, i) => x0 + (x1 - x0) * i / (O.doses.length - 1));
  const y = (v) => y1 - (y1 - y0) * v / 15, rd = (v) => Math.round(v * 10) / 10;
  let s = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Panel OSU, Cascade, mesuré : agrumes ${O.agrumes.map((v) => fr(v, 1)).join(' → ')}, herbacé ${O.herbaceThe.map((v) => fr(v, 1)).join(' → ')}, intensité ${O.intensite.map((v) => fr(v, 1)).join(' → ')} sur 15, aux doses ${O.doses.map((d) => fr(d, 2)).join(', ')} g/L ; zone 4–8 g/L retenue par les auteurs ; trait : 3,86 g/L ≈ ta dose égale">`;
  s += `<rect x="${rd(xs[2])}" y="${y0}" width="${rd(xs[3] - xs[2])}" height="${y1 - y0}" fill="#ececf1"/>`;
  for (const v of [0, 15]) s += `<line x1="${x0}" x2="${x1}" y1="${rd(y(v))}" y2="${rd(y(v))}" stroke="#dcdce3"/>`;
  s += `<line x1="${rd(xs[2])}" x2="${rd(xs[2])}" y1="${y0 - 2}" y2="${y1}" stroke="#16161a" stroke-width="1.5"/>`;
  const serie = (vals, c) => `<polyline points="${vals.map((v, i) => rd(xs[i]) + ',' + rd(y(v))).join(' ')}" fill="none" stroke="${c}" stroke-width="2" stroke-linejoin="round"/>${vals.map((v, i) => `<circle cx="${rd(xs[i])}" cy="${rd(y(v))}" r="2.2" fill="#fff" stroke="${c}" stroke-width="1.5"/>`).join('')}`;
  s += serie(O.intensite, '#16161a') + serie(O.herbaceThe, JET.herbal.texte) + serie(O.agrumes, JET.citrus.texte);
  return s + '</svg>';
}
const h22 = court(O.sources[0]), h77 = court(O.complement.sources[0]);
CITES.set(O.sources[0], h22); CITES.set(O.complement.sources[0], h77);

// ---------- linalol mesuré en bière (v1), sur une échelle logarithmique 10–1000 µg/L ----------
const linCas = HB.Cascade.composes.mesuresEnBiere.find((m) => m.id === 'kishimoto-linalol');
const e03 = HB['Idaho 7'].panels.find((p) => p.id === 'E03'), linI7 = e03.mesures.find((m) => m.variete === 'Idaho-7' && m.compose === 'linalol');
CITES.set('E03', 'McCabe 2023'); citer(linCas.sources);
const lx = (v) => (Math.log10(v) - 1) / 2; // 10 → 0, 1000 → 1
const LIN = [
  { n: 'Cascade', v: linCas.plage[0], lo: linCas.plage[0], hi: linCas.plage[1], src: court(linCas.sources[0]), al: `Cascade : ${fr(linCas.plage[0], 1)} µg/L (${court(linCas.sources[0])}, ${fr(linCas.doseGL, 0)} g/L au moût refroidi)` },
  { n: 'Idaho 7', v: linI7.valeur * 1000, lo: (linI7.valeur - linI7.ecart) * 1000, hi: (linI7.valeur + linI7.ecart) * 1000, src: 'McCabe 2023, E03', verif: true, al: `Idaho 7 : ${fr(linI7.valeur * 1000, 0)} ± ${fr(linI7.ecart * 1000, 0)} µg/L (McCabe 2023, E03, au pitch), à vérifier` },
  { n: 'Galaxy', v: null, al: 'Galaxy : aucune mesure en bière' },
];
const linHtml = `<div class="r6n1-lin" data-element="v1-linalol-en-biere" aria-label="Linalol mesuré en bière, µg/L, échelle logarithmique 10–1000 ; pas comparables entre eux : doses, moments et bières diffèrent">
  <span class="r6n1-lin-t">${pic('floral', 14)}<span>linalol</span>${ic('biere', 14)}<span class="r6n1-diff" role="img" aria-label="conditions différentes : pas comparables entre eux">${ic('diff', 12)}</span></span>
  <span class="r6n1-lin-e">${LIN.map((m) => m.v == null ? `<i class="r6n1-lin-x" style="--c:${COUL[m.n]}" role="img" aria-label="${m.al}"></i>` : `<i class="r6n1-lin-p${m.verif ? ' verif' : ''}" data-nature="mesure" data-source="${esc(m.src)}" style="--c:${COUL[m.n]};left:${(lx(m.v) * 100).toFixed(1)}%" role="img" aria-label="${esc(m.al)}"></i>${m.hi > m.lo ? `<i class="r6n1-lin-b" style="--c:${COUL[m.n]};left:${(lx(m.lo) * 100).toFixed(1)}%;width:${((lx(m.hi) - lx(m.lo)) * 100).toFixed(1)}%"></i>` : ''}`).join('')}</span></div>`;

// ---------- la jauge d'amertume (y1b), adaptée : à cru, rien de modélisé ; à 10′, ce que l'α ferait ----------
const IBU10 = Object.fromEntries(TOUS.map((n) => { const m = HB[n].ibuParGramme.moments.find((x) => x.code === 'b10'); return [n, m && m.ibuPerGram ? m.ibuPerGram.value * EG.dose_gL * D.biere.recette.volumeL : null]; }));
const IBUMAX = Math.max(...Object.values(IBU10)) * 1.1;
const jauge = `<span class="r6n1-ibu" data-element="y1b-jauge-amertume" role="img" aria-label="Amertume ajoutée : à cru, non modélisée (inconnue, jamais 0) ; si le même houblon passait à 10′, ≈ IBU selon son α">
  ${ic('goutte', 14)}<span>IBU</span><span class="r6n1-ibu-q">?</span><i class="r6n1-ibu-h"></i><span class="r6n1-ibu-d">10′</span>${TOUS.map((n) => `<b class="r6n1-ibu-n" data-col="${esc(n)}" data-nature="calcule">≈${fr(IBU10[n], 0)}</b>`).join('')}<span class="r6n1-ibu-g">${TOUS.map((n) => `<i class="r6n1-ibu-f" data-col="${esc(n)}" style="width:${((IBU10[n] / IBUMAX) * 100).toFixed(1)}%;--c:${COUL[n]}"></i>`).join('')}</span></span>`;

// ---------- la réponse en tête (y1b), recalculée au toucher ----------
function reponse(n) {
  const autres = ORDRE.filter((f) => f !== VEUT && f !== TROP && !inconnu(n, f)).sort((a, b) => dCran(n, b) - dCran(n, a));
  const top = autres[0], h = hors(n);
  return `<span class="r6n1-rep" data-pour="${esc(n)}"${n === DEPART ? '' : ' hidden'}><span class="r6n1-rep-n"><i class="w-pt" style="background:${COUL[n]}" aria-hidden="true"></i><b>${esc(n)}</b></span><span>face à ta stout</span>
    <span class="r6n1-rep-d" data-nature="simule" aria-label="floral ${sg(dCran(n, VEUT))} cran">${pic(VEUT, 14)}<b>~${sg(dCran(n, VEUT))}</b></span>
    <span class="r6n1-rep-d${h.includes(top) ? ' hors' : ''}" data-nature="simule" aria-label="${NOM[top].toLowerCase()} ${sg(dCran(n, top))} crans">${pic(top, 14)}<b>~${sg(dCran(n, top))}</b></span>
    ${h.length ? `<span class="r6n1-rep-v hors" data-nature="simule" aria-label="sort de ta 16D : ${h.map((f) => NOM[f].toLowerCase()).join(', ')}">${ic('risque', 14)}<span>hors 16D</span></span>` : `<span class="r6n1-rep-v dans" data-nature="simule" aria-label="reste dans ta 16D">${ic('ok', 14)}<span>dans 16D</span></span>`}</span>`;
}

// ---------- le défi (y1b), pour le houblon mis en avant ----------
function defi(n) {
  const vf = verdictObj(n, VEUT), vr = verdictObj(n, TROP), h = hors(n);
  const cases = [
    { ok: vf === 'atteint', p: pic(VEUT, 14), t: 'plus floral', v: MOTV[vf].toLowerCase(), d: '~' + sg(dCran(n, VEUT)) + ' cran' },
    { ok: vr === 'atteint', p: pic(TROP, 14), t: 'moins résineux', v: 'hors houblon', d: 'le houblon en ajoute ~' + sg(dCran(n, TROP)) },
    { ok: null, p: ic('goutte', 14), t: 'amertume', v: 'inconnue', d: 'à cru, non modélisée' },
    { ok: !h.length, p: ic('ok', 14), t: 'dans ta 16D', v: h.length ? h.length + ' déborde' + (h.length > 1 ? 'nt' : '') : 'tenu', d: h.map((f) => COURT[f].toLowerCase()).join(', ') || 'hors le résineux de départ' },
  ];
  return { n: cases.filter((c) => c.ok).length, html: cases.map((c) => `<span class="r6n1-df-c ${c.ok === true ? 'ok' : c.ok === false ? 'non' : 'inc'}">${c.p}<b>${c.t}</b><span class="r6n1-df-v">${c.v}</span><span class="r6n1-df-d">${c.d}</span></span>`).join('') };
}
const DEFI = Object.fromEntries(TOUS.map((n) => [n, defi(n)]));

// ---------- les ponts : Dryhopper (frise au doigt, second houblon, jours) et Levure (Pomona) ----------
const LEV = Object.fromEntries(TOUS.map((n) => {
  const o = { moment: 'dryActive', dose_gL: EG.dose_gL, jours: EG.jours };
  const u = point(n, { ...o, levure: 'fermentis-us05' }), p = point(n, { ...o, levure: 'lalbrew-pomona' });
  const fam = ORDRE.reduce((best, f) => (Math.abs(p.apres[f][1] - u.apres[f][1]) > Math.abs(p.apres[best][1] - u.apres[best][1]) ? f : best), 'citrus');
  return [n, { f: fam, u: u.apres[fam][1], p: p.apres[fam][1], d: (p.apres[fam][1] - u.apres[fam][1]) / CRAN[fam] }];
}));
const frise = `<svg class="r6n1-frise" width="86" height="22" viewBox="0 0 86 22" aria-hidden="true">
  <line x1="2" y1="15" x2="84" y2="15" stroke="#c9c9d2" stroke-width="2" stroke-linecap="round"/>
  ${[2, 6, 10, 14, 18, 22, 26, 30].map((x) => `<line x1="${x}" y1="12" x2="${x}" y2="18" stroke="#c9c9d2" stroke-width="1"/>`).join('')}
  ${[40, 52, 64, 78].map((x) => `<line x1="${x}" y1="10" x2="${x}" y2="20" stroke="#8a909b" stroke-width="1.5"/>`).join('')}
  <circle id="r6n1-jeton" cx="64" cy="7" r="5.5" fill="${COUL[DEPART]}" stroke="#fff" stroke-width="1.5"/>
  <circle cx="78" cy="7" r="4.5" fill="#fff" stroke="#8a909b" stroke-width="1.2" stroke-dasharray="2 2"/></svg>`;
const levApercu = `<span class="r6n1-lev" aria-hidden="true"><i class="r6n1-lev-u" id="r6n1-lev-u"></i><i class="r6n1-lev-p" id="r6n1-lev-p"></i></span>`;

// ---------- les vraies valeurs et la chimie, entières, sous « Preuve » (un toucher) ----------
function vrangee({ cle, f, nom, unite, cells, compose = true, note = '', icone = 'huile' }) {
  const mil = cells.map((c) => (c ? milieu(c) : null)), connus = mil.filter((x) => x != null);
  const top = !note && connus.length >= 2 ? mil.indexOf(Math.max(...connus)) : -1;
  const hauts = cells.filter(Boolean).map((c) => c.hi ?? c.lo * 1.6), mx = Math.max(...hauts) * 1.08 || 1;
  const cel = (n, c, i) => {
    if (!c) return `<span class="r6n1-vc inc" data-col="${esc(n)}"><i class="r6n1-hach"></i><span class="r6n1-vi">inconnu</span></span>`;
    const l = (c.lo / mx) * 100, r = ((c.hi ?? mx) / mx) * 100;
    return `<span class="r6n1-vc${c.verif ? ' verif' : ''}${i === top ? ' max' : ''}" data-col="${esc(n)}" style="--c:${COUL[n]}"><span class="r6n1-vv mono" data-nature="mesure" data-source="${esc(c.ids.map((x) => CITES.get(x) || x).join(' ; '))}">${c.txt}</span><span class="r6n1-vbar"><i class="r6n1-vbr${c.ouvert ? ' ouvert' : ''}" style="left:${l.toFixed(1)}%;width:${Math.max(3, r - l).toFixed(1)}%"></i>${c.lot != null ? `<i class="r6n1-vlot" style="left:${((c.lot / mx) * 100).toFixed(1)}%"></i>` : ''}</span><span class="r6n1-vr">${c.ids.join(' ')}${c.verif ? ' · à confirmer' : ''}${c.note ? ' · ' + c.note : ''}</span></span>`;
  };
  return `<div class="r6n1-vg"${compose ? ` data-compose="${cle}"` : ''}><span class="r6n1-vn">${f ? pic(f, 16) : ic(icone, 16)}<span><b>${nom}</b><span class="r6n1-vu">${unite}</span></span></span>${TOUS.map((n, i) => cel(n, cells[i], i)).join('')}${note ? `<p class="r6n1-vnote">${note}</p>` : ''}</div>`;
}
const deSources = (srcs) => ({ lo: Math.min(...srcs.map((s) => s.min)), hi: Math.max(...srcs.map((s) => s.max)), txt: fr(Math.min(...srcs.map((s) => s.min)), 1) + '–' + fr(Math.max(...srcs.map((s) => s.max)), 1), ids: [...new Set(srcs.map((s) => { const k = s.source === 'Beer Maverick' ? 'BM' : s.source === 'Hopsteiner' ? 'HS' : s.source; CITES.set(k, s.source + (s.annee ? ' ' + s.annee : '')); return k; }))] });
const alphaRow = vrangee({ cle: 'alpha', nom: 'α', unite: '% masse', compose: false, icone: 'livre', cells: TOUS.map((n) => ({ ...deSources(HB[n].alpha.sources), lot: ALPHA[n].lot })) });
const betaRow = vrangee({ cle: 'beta', nom: 'β', unite: '% masse', compose: false, icone: 'livre', cells: TOUS.map((n) => deSources(HB[n].beta.sources)) });
const huileRow = vrangee({ cle: 'huile', nom: 'huile', unite: 'mL/100 g', cells: TOUS.map((n) => plageDe(HB[n].composes.huile.valeurs)) });
const CHIMIE = [
  ['myrcene', 'resin', 'myrcène', '% huile'], ['linalol', 'floral', 'linalol', '% huile'], ['geraniol', 'floral', 'géraniol', '% huile'],
  ['humulene', 'herbal', 'humu­lène', '% huile'], ['caryophyllene', 'spice', 'caryo­phyllène', '% huile'], ['4MMP', 'tropical', '4MMP', 'µg/kg'],
].map(([k, f, nom, u]) => vrangee({ cle: k, f, nom, unite: u, cells: TOUS.map((n) => CPD(n, k)) }));
const enBiere = vrangee({ cle: 'linalol-biere', f: 'floral', nom: 'linalol en bière', unite: 'µg/L', cells: [
  { lo: linCas.plage[0], hi: linCas.plage[1], txt: fr(linCas.plage[0], 1), ids: citer(linCas.sources), note: fr(linCas.doseGL, 0) + ' g/L, moût' },
  { lo: (linI7.valeur - linI7.ecart) * 1000, hi: (linI7.valeur + linI7.ecart) * 1000, txt: fr(linI7.valeur * 1000, 0) + '±' + fr(linI7.ecart * 1000, 0), ids: ['E03'], verif: true, note: 'au pitch' },
  null, null], note: 'Pas comparables entre eux : doses, moments et bières diffèrent.' });
const sourcesTxt = () => [...CITES.entries()].sort((a, b) => a[0].localeCompare(b[0], 'fr', { numeric: true })).map(([k, t]) => `<span><b>${esc(k)}</b> ${esc(t)}</span>`).join('');

// ---------- la fiche g1 à l'appui long (descripteurs : option A) ----------
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
const ctx = `<p class="r6n1-ctx" data-role="contexte" data-element="y1b-ligne-contexte" aria-label="Fixé pour tous : ta stout 16D, dose égale ${fr(EG.dose_gL)} g/L, dry hop après fermentation ${EG.jours} jours, levure US-05, ta dégustation du 18.10">
  <span class="r6n1-cx" data-contexte="biere">${ic('biere', 14)}16D</span>
  <span class="r6n1-cx fort" data-contexte="base" aria-label="dose égale ${fr(EG.dose_gL)} g/L">${ic('egal', 14)}${fr(EG.dose_gL)} g/L</span>
  <span class="r6n1-cx" data-contexte="moment">${ic('cuveP', 14)}après ${EG.jours} j</span>
  <span class="r6n1-cx" data-contexte="levure">${ic('levure', 14)}US-05</span>
  <span class="r6n1-cx r6n1-deg" data-contexte="degustation" data-element="m4-radar-degustation" aria-label="ta dégustation du 18.10 : trop résineuse, tu la veux plus florale">${pic(TROP, 14)}<span>trop</span>${pic(VEUT, 14)}<span>plus</span></span></p>`;

const critPop = `<div class="r6n1-pop" id="r6n1-crit" role="radiogroup" aria-label="Critère de classement" hidden>${CRITERES.map((f) => `<button type="button" role="radio" class="r6n1-crit-o" data-crit="${f}" aria-checked="${f === 'floral'}">${pic(f, 16)}<span>${COURT[f]}</span></button>`).join('')}</div>`;
const pqPop = `<div class="r6n1-pop r6n1-pq" id="r6n1-pq" hidden><p>~ simulé à ${fr(EG.dose_gL)} g/L, après fermentation, ${EG.jours} j, US-05. Un cran = l’écart d’une classe du style ; ta stout est le trait noir.</p><p>Classés dans ta 16D d’abord, puis par la famille choisie. Résineux : ta stout est déjà au-dessus, et chaque houblon en ajoute.</p></div>`;
const defiPop = `<div class="r6n1-pop r6n1-df" id="r6n1-defi" hidden><p class="r6n1-df-t">ta dégustation, 18.10 : « ${esc(D.biere.degustation.citation)} »</p>${TOUS.map((n) => `<div class="r6n1-df-g" data-pour="${esc(n)}"${n === DEPART ? '' : ' hidden'}>${DEFI[n].html}</div>`).join('')}</div>`;
const ajoutPop = `<div class="r6n1-pop r6n1-aj" id="r6n1-ajout" hidden><button type="button" class="r6n1-aj-o" data-ajout="${esc(NS4)}" aria-label="Ajouter ${esc(NS4)} à la comparaison"><i class="w-pt" style="background:${COUL[NS4]}" aria-hidden="true"></i><b>${esc(NS4)}</b>${alphaHtml(NS4).replace(/data-role="alpha"/, 'data-role="alpha-apercu"')}${ic('achat', 14)}</button></div>`;

const corps = `
  <header class="r6n1-tete"><button class="w-ret" type="button" aria-label="Retour">${ic('chev-l', 20)}</button><h1>Lequel pour ma stout ?</h1><button type="button" class="leg-b" data-role="legende-bouton" data-element="l8b-legende-cachee" aria-expanded="false" aria-label="Légende">?<i class="doigt" aria-hidden="true"></i></button></header>
  ${ctx}
  <section class="r6n1-rep-b" aria-label="La réponse, face à ta stout">
    <div class="r6n1-rep-l" data-element="y1b-face-a-ta-stout y1b-plan-d-avant" aria-live="polite">${TOUS.map(reponse).join('')}<button type="button" class="r6n1-pq-b" aria-expanded="false" aria-controls="r6n1-pq" aria-label="Pourquoi ?">${ic('aide2', 16)}</button></div>
    <div class="r6n1-rep-2"><span class="r6n1-par">par</span><button type="button" class="r6n1-crit-b" data-element="y1b-pastille-critere" aria-haspopup="true" aria-expanded="false" aria-controls="r6n1-crit" aria-label="Critère de classement : floral">${pic('floral', 16)}${ic('chevb', 14)}</button>${jauge}</div>
    ${critPop}${pqPop}
  </section>
  ${piste(VEUT)}
  ${piste(TROP)}
  <section class="r6n1-mid">
    <div class="r6n1-rad" data-acquis="radar" data-element="p03-radar-superpose p02-radar-intervalle h4-radar-demande" aria-label="Radar r2">
      <span class="r6n1-sim">${S.conf('simule')}</span>
      <div id="r6n1-radar">${radar0}</div>
    </div>
    <div class="r6n1-cote">
      <span class="seg lentille r6n1-lent" role="radiogroup" aria-label="Lecture" data-lecture=""><button role="radio" type="button" data-e="style" aria-checked="true">Au style</button><button role="radio" type="button" data-e="absolu" aria-checked="false">Absolu</button></span>
      <div class="r6n1-osu" data-acquis="osu" data-element="y3-panel-osu" data-nature="mesure" data-source="${esc(O.sources[0] + ' : ' + h22)}" aria-label="Panel OSU, Cascade, mesuré">
        <span class="r6n1-osu-t">${ic('panel', 14)}<b>OSU</b><i class="w-pt" style="background:${COUL.Cascade}" aria-hidden="true"></i><span>Cascade</span></span>
        ${osuSvg()}
        <span class="r6n1-osu-n" role="img" aria-label="Idaho 7 et Galaxy : pas de panel publié"><i class="w-pt" style="background:${COUL['Idaho 7']}" aria-hidden="true"></i><i class="w-pt" style="background:${COUL.Galaxy}" aria-hidden="true"></i><i class="r6n1-hach p"></i><b>?</b></span>
      </div>
      ${linHtml}
    </div>
  </section>
  <section class="r6n1-tab" aria-label="Les houblons, côte à côte">
    <div class="r6n1-g r6n1-tetes" role="radiogroup" aria-label="Houblon mis en avant" data-libre="houblon" data-element="l5f-carte-role-alpha p06-grille-familles w2-cartes-verdict p03-plages-sources">
      <span class="r6n1-plus-c"><button type="button" class="r6n1-plus" data-element="p4-plus-comparaison" aria-expanded="false" aria-controls="r6n1-ajout" aria-label="Ajouter un houblon à la comparaison">${ic('plus', 16)}</button>${ajoutPop}</span>
      ${TOUS.map(tete).join('')}
    </div>
    <div class="r6n1-rgs" data-element="l8-disposition l5b-barres-voie y1b-bandes-style y1b-plan-d-avant">${LIGNES.map(rangee).join('')}
      <div class="r6n1-inc-t"><span class="r6n1-inc-p">${TOUS_INC.map((f) => pic(f, 14)).join('')}</span><i class="r6n1-hach"></i><span>inconnus</span></div>
    </div>
  </section>
  <div class="r6n1-act" data-element="y1b-tirage-preuve">
    <button type="button" class="r6n1-b" data-element="y1b-defi" aria-expanded="false" aria-controls="r6n1-defi">${ic('cible', 14)}<span>Défi</span><b class="mono" id="r6n1-defi-n">${DEFI[DEPART].n}/4</b></button>
    <button type="button" class="r6n1-b" id="r6n1-tire" aria-expanded="false" aria-label="Tire 20 bières dans la bande du moteur">${ic('melange', 14)}<span>Tire</span><b class="mono">20</b></button>
    <button type="button" class="r6n1-b" id="r6n1-preuve" aria-expanded="false" aria-controls="r6n1-vraies" data-ouvre-acquis="valeurs chimie" aria-label="Preuve : chimie et vraies valeurs, sources">${ic('labo', 14)}<span>Preuve</span>${ic('chevb', 14)}</button>
  </div>
  ${defiPop}
  <nav class="r6n1-ponts" aria-label="Autres outils">
    <a href="#" data-role="pont" data-outil="Dryhopper" data-element="y1b-dock-pouce y1b-second-houblon-puis x3b-cuve-jour-apres-jour" id="r6n1-pont-d" aria-label="Doser ${esc(DEPART)} dans Dryhopper : le moment au doigt, un second houblon, jour après jour">${ic('cuveP', 14)}<span>Dryhopper</span>${frise}${ic('chev-r', 14)}</a>
    <a href="#" data-role="pont" data-outil="Levure" data-element="y1b-levure-pastilles a2b-ce-que-la-levure-change" id="r6n1-pont-l" aria-label="Levure : ce que Pomona change pour ${esc(DEPART)} en dry hop actif">${ic('levure', 14)}<span>Levure</span>${levApercu}${ic('chev-r', 14)}</a>
  </nav>
  <section id="r6n1-vraies" class="r6n1-vraies" hidden aria-label="Preuve : vraies valeurs et chimie">
    <div class="r6n1-vals" data-acquis="valeurs">
      <div class="r6n1-vh"><span></span>${TOUS.map((n) => `<span class="r6n1-vhn" data-col="${esc(n)}" style="color:${COUL[n]}">${esc(n)}</span>`).join('')}</div>
      ${alphaRow}${betaRow}
      <div class="r6n1-chim" data-acquis="chimie" aria-label="Composés de l’huile, rangés par famille">${huileRow}${CHIMIE.join('')}</div>
      ${enBiere}
      <div class="r6n1-vg" aria-label="IBU à cru : non modélisé"><span class="r6n1-vn">${ic('goutte', 16)}<span><b>IBU</b><span class="r6n1-vu">à cru</span></span></span>${TOUS.map((n) => `<span class="r6n1-vc inc" data-col="${esc(n)}"><i class="r6n1-hach"></i><span class="r6n1-vi">non modélisé</span></span>`).join('')}</div>
      <div class="r6n1-vg" aria-label="IBU si le même houblon passait à 10 minutes"><span class="r6n1-vn">${ic('goutte', 16)}<span><b>IBU à 10′</b><span class="r6n1-vu">${fr(EG.dose_gL)} g/L</span></span></span>${TOUS.map((n) => `<span class="r6n1-vc" data-col="${esc(n)}" style="--c:${COUL[n]}"><span class="r6n1-vv mono" data-nature="calcule">≈ ${fr(IBU10[n], 0)}</span><span class="r6n1-vr">calculé</span></span>`).join('')}</div>
      <p class="r6n1-vsrc">${S.conf('mesure')}<span>fiches et études ; plage = du plus bas au plus haut des sources.</span></p>
      <p class="r6n1-vrefs">${sourcesTxt()}</p>
      <p class="r6n1-vsrc">${S.conf('panel')}<span>${O.sources[0]} ${esc(h22)} · ${O.complement.sources[0]} ${esc(h77)} : ${esc(O.complement.texte)}</span></p>
    </div>
  </section>
  <p class="r6n1-pied">${S.conf('simule')}<span>moteur profil-simulé (${D.version}, ${D.date.split('-').reverse().slice(0, 2).join('.')}) : centre conventionnel, bande = incertitude.</span></p>`;

const legende = `<div class="w-voile" data-role="legende-voile" hidden></div><section class="w-leg" id="legende" data-role="legende" role="dialog" aria-label="Légende" hidden>
  <div class="w-f-t"><b>Légende</b><button type="button" data-role="legende-fermer" aria-label="Fermer la légende">${ic('x', 18)}</button></div>
  <div class="w-leg-s"><h3>Les familles</h3><div class="w-leg-g">${ORDRE.map((f) => `<span class="w-leg-i">${pic(f, 18)}${COURT[f]}</span>`).join('')}</div></div>
  <div class="w-leg-s"><h3>La réponse</h3><p>Le houblon mis en avant face à ta stout : ~ crans de floral, sa plus forte famille, dans ou hors de ta 16D. La pastille choisit le critère : les colonnes se rangent, le premier passe en avant (dans ta 16D d’abord).</p></div>
  <div class="w-leg-s"><h3>Tes deux objectifs</h3><div class="w-leg-g l2">
    <span class="w-leg-i"><i class="r6n1-lg-z"></i>zone pâle : ta 16D</span><span class="w-leg-i"><i class="r6n1-lg-av"></i>trait noir : ta stout</span>
    <span class="w-leg-i"><i class="r6n1-lg-vi"></i>pointillé : la visée, un cran</span><span class="w-leg-i"><i class="r6n1-lg-wk"></i>un trait par houblon : sa bande, son centre</span>
    <span class="w-leg-i">${ic('atteint', 14)}${ic('approche', 14)}${ic('aucune', 14)}atteint, approche, aucune</span><span class="w-leg-i">${ic('echelle', 14)}résineux lu en absolu</span></div>
    <p>La visée (un cran du style) est proposée par la variante, à corriger par toi.</p></div>
  <div class="w-leg-s"><h3>Une barre, par houblon</h3><div class="w-leg-g l2">
    <span class="w-leg-i"><i class="r6n1-lg-z"></i>zone pâle : ce que ta 16D permet</span><span class="w-leg-i"><i class="r6n1-lg-b"></i>barre : ~ simulé à 4 g/L</span>
    <span class="w-leg-i"><i class="r6n1-lg-w"></i>trait gris : sa bande</span><span class="w-leg-i"><i class="r6n1-lg-x"></i>orangé : au-dessus de ta 16D</span>
    <span class="w-leg-i"><i class="r6n1-lg-f"></i>${ic('labo', 12)}trait fin : le composé mesuré, à la couleur de qui en a le plus</span><span class="w-leg-i"><i class="r6n1-hach"></i>hachuré : inconnu, jamais zéro</span>
    <span class="w-leg-i">${ic('egal', 12)}<b class="mono">~7,5g/L</b>dose pour égaler la référence ; >8 : jamais dans la grille</span><span class="w-leg-i">${ic('melange', 14)}Tire 20 : vingt bières tirées dans la bande (uniforme, convention)</span></div></div>
  <div class="w-leg-s"><h3>Le radar</h3><p>Le houblon touché est plein ; son intervalle est un trait sur chaque axe ; un chevron au bout : la bande dépasse l’axe. Les autres en contour. Flèches : ta demande. Rond creux, hachuré : inconnu.</p></div>
  <div class="w-leg-s"><h3>Un houblon</h3><div class="w-leg-g l2">
    <span class="w-leg-i"><span class="al lot">17,2%${ic('diff', 12)}</span>α du lot ; ≠ hors des fiches</span><span class="w-leg-i"><span class="al fi">${ic('livre', 12)}9,5–14,9%</span>α des fiches</span>
    <span class="w-leg-i"><span class="us us-mot deduit"><span class="us-m">mixte</span></span>pâle : déduit de l’α</span><span class="w-leg-i">${ic('ok', 14)}${ic('risque', 14)}dans ou hors de ta 16D</span>
    <span class="w-leg-i">${ic('info', 14)}sa fiche ; ou appui long sur le nom</span><span class="w-leg-i">${ic('plus', 14)}ajouter un houblon</span></div></div>
  <div class="w-leg-s"><h3>À côté du radar</h3><p>OSU : le panel mesuré de Cascade (agrumes, herbacé, intensité sur 15, de 0 à 16 g/L ; trait : ta dose). Linalol en bière : µg/L, échelle 10–1000 ; ≠ : doses et bières différentes. IBU : à cru, non modélisé ; la barre fine dit ce que ce houblon donnerait à 10′.</p></div>
  <div class="w-leg-s"><h3>Base : dose égale</h3><p>Tous à ${fr(EG.dose_gL)} g/L, après fermentation, ${EG.jours} j, US-05. Fiche : « groseille à maquereau » rangée dans Petits fruits (option A) ; seul Nelson Sauvin a ce mot.</p></div>
</section>`;

const css = `
  .ecran { gap: 6px; padding-top: 2px; }
  .r6n1-tete { display: flex; align-items: center; gap: 6px; min-height: 36px; }
  .r6n1-tete h1 { flex: 1; font-size: 17px; line-height: 1.15; font-weight: 700; }
  .r6n1-ctx { display: flex; flex-wrap: wrap; gap: 2px 10px; font-size: 12px; color: var(--gris); }
  .r6n1-cx { display: inline-flex; align-items: center; gap: 3px; white-space: nowrap; }
  .r6n1-cx.fort { color: var(--encre); font-weight: 700; }
  .r6n1-deg { color: var(--encre); font-weight: 600; }
  /* la réponse */
  .r6n1-rep-b { position: relative; display: flex; flex-direction: column; gap: 4px; padding: 6px 8px; border-radius: 8px; box-shadow: inset 0 0 0 1px var(--trait2); }
  .r6n1-rep-l { display: flex; align-items: flex-start; gap: 4px; }
  .r6n1-rep { flex: 1; display: flex; flex-wrap: wrap; align-items: center; gap: 2px 8px; font-size: 14px; }
  .r6n1-rep[hidden] { display: none; }
  .r6n1-rep-n { display: inline-flex; align-items: center; gap: 4px; }
  .r6n1-rep-d { display: inline-flex; align-items: center; gap: 2px; font: 600 14px var(--mono); }
  .r6n1-rep-d.hors b { color: var(--acc); }
  .r6n1-rep-v { display: inline-flex; align-items: center; gap: 3px; font-weight: 700; font-size: 14px; }
  .r6n1-rep-v.dans { color: #2f6b4f; } .r6n1-rep-v.hors { color: var(--acc); }
  .r6n1-pq-b { width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; flex: none; border-radius: 50%; color: var(--gris); margin: -4px -4px 0 0; }
  .r6n1-pq-b[aria-expanded="true"] { color: var(--encre); box-shadow: inset 0 0 0 1.5px var(--encre); }
  .r6n1-rep-2 { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--gris); }
  .r6n1-crit-b { display: inline-flex; align-items: center; gap: 2px; height: 26px; padding: 0 6px; border-radius: 999px; box-shadow: inset 0 0 0 1.5px var(--encre); color: var(--encre); }
  .r6n1-ibu { margin-left: auto; display: inline-flex; align-items: center; gap: 4px; color: var(--gris); font-size: 12px; }
  .r6n1-ibu-q { font: 700 12px var(--mono); color: var(--encre); }
  .r6n1-ibu-h { display: inline-block; width: 16px; height: 10px; border-radius: 2px; background: repeating-linear-gradient(135deg, #fff 0 2px, #8a909b 2px 3.5px); box-shadow: inset 0 0 0 1px #8a909b; }
  .r6n1-ibu-d { margin-left: 4px; }
  .r6n1-ibu-n { display: none; font: 600 12px var(--mono); color: var(--encre); } .r6n1-ibu-n.on { display: inline; }
  .r6n1-ibu-g { position: relative; display: block; width: 52px; height: 6px; border-radius: 2px; background: #f1f1f4; }
  .r6n1-ibu-f { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 2px; background: var(--c); display: none; }
  .r6n1-ibu-f.on { display: block; }
  .r6n1-pop { position: absolute; z-index: 20; left: 8px; right: 8px; top: 100%; margin-top: 4px; padding: 8px; border-radius: 8px; background: #fff; box-shadow: 0 6px 20px rgba(0,0,0,.16), inset 0 0 0 1px var(--trait2); display: flex; gap: 6px; flex-wrap: wrap; font-size: 12px; }
  .r6n1-pop[hidden] { display: none; }
  .r6n1-pq { flex-direction: column; color: var(--encre); line-height: 1.3; }
  .r6n1-crit-o { display: inline-flex; align-items: center; gap: 4px; height: 32px; padding: 0 10px; border-radius: 999px; box-shadow: inset 0 0 0 1px var(--trait2); font-size: 14px; }
  .r6n1-crit-o[aria-checked="true"] { background: var(--encre); color: #fff; }
  /* les pistes d'objectif */
  .r6n1-piste { display: flex; flex-direction: column; gap: 2px; }
  .r6n1-pi-h { display: flex; align-items: center; gap: 4px; font-size: 14px; min-height: 22px; }
  .r6n1-pi-h b { font-weight: 700; }
  .r6n1-dem { display: inline-flex; color: var(--encre); } .r6n1-dem.trop { color: var(--acc); }
  .r6n1-abs { display: inline-flex; color: var(--gris); }
  .r6n1-vb { margin-left: auto; display: inline-flex; align-items: center; gap: 4px; font-weight: 700; font-size: 14px; }
  .r6n1-vb.atteint { color: #2f6b4f; } .r6n1-vb.aucune { color: var(--gris); }
  .r6n1-sug a { display: inline-flex; align-items: center; gap: 2px; height: 24px; padding: 0 4px 0 9px; border-radius: 999px; box-shadow: inset 0 0 0 1.5px var(--encre); font-size: 12px; font-weight: 700; }
  .r6n1-pi-t { position: relative; height: 22px; border-radius: 2px; background: #f6f6f9; }
  .r6n1-pi-t > i, .r6n1-wk { position: absolute; display: block; }
  .r6n1-pz { left: 0; top: 0; bottom: 0; width: var(--z); background: var(--f); box-shadow: inset -1.5px 0 0 var(--t); }
  .r6n1-pa { left: calc(var(--av) - 1px); top: -3px; bottom: -3px; width: 2px; background: var(--encre); border-radius: 2px; }
  .r6n1-pv { left: var(--vi); top: -3px; bottom: -3px; width: 0; border-left: 2px dotted var(--encre); }
  body.abs .r6n1-pz { width: var(--za); } body.abs .r6n1-pa { left: calc(var(--ava) - 1px); } body.abs .r6n1-pv { left: var(--via); }
  .r6n1-wk { left: 0; right: 0; top: calc(3px + var(--j) * 5px); height: 4px; }
  .r6n1-wl { position: absolute; top: 1px; height: 2px; left: var(--w0); width: calc(var(--w1) - var(--w0)); background: var(--c); opacity: .45; border-radius: 2px; }
  .r6n1-wk.dep .r6n1-wl::after { content: ''; position: absolute; right: -6px; top: -3px; border: 4px solid transparent; border-left: 5px solid var(--c); border-right: 0; }
  .r6n1-wd { position: absolute; top: -1px; left: calc(var(--ce) - 3px); width: 6px; height: 6px; border-radius: 50%; background: var(--c); }
  .r6n1-wk.sel .r6n1-wl { opacity: .8; } .r6n1-wk.sel .r6n1-wd { box-shadow: 0 0 0 1.5px #fff, 0 0 0 3px var(--c); }
  body.abs .r6n1-wl { left: var(--w0a); width: calc(var(--w1a) - var(--w0a)); } body.abs .r6n1-wd { left: calc(var(--cea) - 3px); }
  body.abs .r6n1-wk.dep:not(.depa) .r6n1-wl::after { display: none; }
  body:not(.r6n1-n4) .r6n1-wk[data-col="${NS4}"], body:not(.r6n1-n4) [data-col="${NS4}"] { display: none; }
  /* le radar et son côté */
  .r6n1-mid { display: flex; gap: 6px; align-items: flex-start; }
  .r6n1-rad { position: relative; flex: none; width: 190px; }
  .r6n1-sim { position: absolute; left: 0; top: 0; z-index: 1; }
  .r6n1-rq { font: 700 12px var(--sans); fill: #5b5b66; }
  .r6n1-cote { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
  .r6n1-lent { align-self: flex-end; }
  .r6n1-osu { display: flex; flex-direction: column; gap: 2px; }
  .r6n1-osu-t { display: flex; align-items: center; gap: 4px; font-size: 12px; }
  .r6n1-osu-n { display: flex; align-items: center; gap: 3px; font-size: 12px; color: var(--gris); }
  .r6n1-hach.p { width: 16px; }
  .r6n1-lin { display: flex; flex-direction: column; gap: 3px; }
  .r6n1-lin-t { display: flex; align-items: center; gap: 3px; font-size: 12px; color: var(--gris); }
  .r6n1-diff { display: inline-flex; color: var(--gris); }
  .r6n1-lin-e { position: relative; display: block; height: 14px; border-radius: 2px; background: #f6f6f9; }
  .r6n1-lin-p { position: absolute; top: 3px; width: 8px; height: 8px; margin-left: -4px; border-radius: 50%; background: var(--c); z-index: 1; }
  .r6n1-lin-p.verif { box-shadow: 0 0 0 1.5px #fff, 0 0 0 3px var(--acc); }
  .r6n1-lin-b { position: absolute; top: 6px; height: 2px; background: var(--c); opacity: .5; }
  .r6n1-lin-x { position: absolute; right: 2px; top: 2px; width: 16px; height: 10px; border-radius: 2px; background: repeating-linear-gradient(135deg, #fff 0 2px, var(--c) 2px 3.5px); box-shadow: inset 0 0 0 1px var(--c); }
  /* le tableau : une colonne de pictos, une colonne par houblon */
  .r6n1-g { display: grid; grid-template-columns: 22px repeat(3, minmax(0, 1fr)); column-gap: 4px; }
  body.r6n1-n4 .r6n1-g { grid-template-columns: 22px repeat(4, minmax(0, 1fr)); }
  .r6n1-tab { display: flex; flex-direction: column; }
  .r6n1-plus-c { position: relative; display: flex; justify-content: center; padding-top: 6px; }
  .r6n1-plus { width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; box-shadow: inset 0 0 0 1.5px var(--encre); }
  .r6n1-plus[disabled] { opacity: .35; }
  .r6n1-aj { left: 0; right: auto; width: 250px; }
  .r6n1-aj-o { display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 10px; border-radius: 999px; box-shadow: inset 0 0 0 1px var(--trait2); font-size: 14px; }
  .r6n1-tc { position: relative; min-width: 0; border-radius: 8px 8px 0 0; box-shadow: inset 0 3px 0 var(--h); }
  .r6n1-tc.sel { background: #f3f3f6; box-shadow: inset 0 3px 0 var(--h), inset 2px 0 0 var(--h), inset -2px 0 0 var(--h); }
  .r6n1-tcb { width: 100%; display: flex; flex-direction: column; align-items: flex-start; gap: 2px; text-align: left; padding: 6px 4px 4px 5px; min-width: 0; }
  .r6n1-tn { display: flex; align-items: center; gap: 3px; font-size: 14px; max-width: 100%; padding-right: 18px; }
  .r6n1-tn .hn { display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
  .r6n1-tn { min-width: 0; } .r6n1-tn .w-stk, .r6n1-tn .w-pt { flex: none; }
  body.r6n1-n4 .r6n1-tn { font-size: 12px; padding-right: 16px; } body.r6n1-n4 .r6n1-ta .al { font-size: 12px; letter-spacing: -.04em; }
  body.r6n1-n4 .r6n1-tn .w-stk { display: none; } body.r6n1-n4 .r6n1-fi { right: -2px; }
  .r6n1-ta .al { font-size: 12px; }
  .r6n1-tf { display: flex; align-items: center; gap: 3px; min-height: 16px; }
  .r6n1-tfp { display: inline-flex; align-items: flex-end; gap: 1px; }
  .r6n1-vd { display: inline-flex; } .r6n1-vd.dans { color: #2f6b4f; } .r6n1-vd.hors { color: var(--acc); }
  .r6n1-fi { position: absolute; right: 1px; top: 4px; width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; color: var(--gris); border-radius: 50%; }
  .r6n1-ret { position: absolute; right: -2px; top: 44px; width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; color: var(--gris); border-radius: 50%; }
  .r6n1-rgs { display: flex; flex-direction: column; }
  .r6n1-rg { align-items: center; min-height: 19px; }
  .r6n1-rg.fil { min-height: 23px; } .r6n1-rg.egl { min-height: 30px; } .r6n1-rg.fil.egl { min-height: 34px; }
  .r6n1-rn { display: flex; flex-direction: column; align-items: center; gap: 1px; }
  .r6n1-lab { display: inline-flex; color: var(--gris); }
  .r6n1-cel { position: relative; display: flex; flex-direction: column; justify-content: center; gap: 2px; height: 100%; min-height: 19px; padding: 0 4px; min-width: 0; }
  .r6n1-cel.sel { background: #f3f3f6; box-shadow: inset 2px 0 0 var(--hs, transparent), inset -2px 0 0 var(--hs, transparent); }
  .r6n1-rgs > .r6n1-rg:nth-last-child(2) .r6n1-cel.sel { border-radius: 0 0 8px 8px; box-shadow: inset 2px 0 0 var(--hs, transparent), inset -2px 0 0 var(--hs, transparent), inset 0 -2px 0 var(--hs, transparent); }
  .r6n1-pis { position: relative; display: block; height: 12px; background: #f6f6f9; border-radius: 2px; }
  .r6n1-pis > i { position: absolute; top: 0; bottom: 0; display: block; }
  .r6n1-zo { left: 0; width: var(--z); background: var(--f); box-shadow: inset -1.5px 0 0 var(--t); }
  .r6n1-pis > .r6n1-ba { left: 0; top: 2px; bottom: 2px; width: var(--gb); background: var(--b); border-radius: 2px; }
  .r6n1-pis > .r6n1-xo { left: var(--xb); width: var(--xo); top: 2px; bottom: 2px; background: ${ACC}; border-radius: 0 2px 2px 0; }
  .r6n1-pis > .r6n1-wh { left: var(--w0); width: calc(var(--w1) - var(--w0)); top: 5.25px; bottom: 5.25px; background: rgba(22,22,26,.42); }
  .r6n1-pis > .r6n1-av { left: calc(var(--av) - 1px); width: 2px; top: -2px; bottom: -2px; background: var(--encre); border-radius: 2px; }
  .r6n1-cel.dep .r6n1-pis::after { content: ''; position: absolute; right: -5px; top: 2px; border: 4px solid transparent; border-left: 5px solid ${ACC}; border-right: 0; }
  body.abs .r6n1-zo { width: var(--za); } body.abs .r6n1-pis > .r6n1-ba { width: var(--gba); } body.abs .r6n1-pis > .r6n1-xo { left: var(--xba); width: var(--xoa); }
  body.abs .r6n1-pis > .r6n1-wh { left: var(--w0a); width: calc(var(--w1a) - var(--w0a)); } body.abs .r6n1-pis > .r6n1-av { left: calc(var(--ava) - 1px); }
  body.abs .r6n1-cel.dep .r6n1-pis::after { display: none; } body.abs .r6n1-cel.depa .r6n1-pis::after { display: block; }
  .r6n1-tir { position: absolute; inset: 0; display: block; pointer-events: none; }
  .r6n1-tir i { position: absolute; top: 3px; width: 6px; height: 6px; margin-left: -3px; border-radius: 50%; background: var(--encre); box-shadow: 0 0 0 1px #fff; }
  .r6n1-tir i.hs { background: ${ACC}; }
  .r6n1-hach { display: inline-block; width: 22px; height: 10px; border-radius: 2px; flex: none; background: repeating-linear-gradient(135deg, #fff 0 2px, #8a909b 2px 3.5px); box-shadow: inset 0 0 0 1px #8a909b; }
  .r6n1-cel.inc .r6n1-pis { background: none; }
  .r6n1-cel.inc .r6n1-pis .r6n1-hach { position: absolute; left: 0; top: 1px; }
  .r6n1-fil { position: relative; display: block; height: 4px; border-radius: 2px; background: #f1f1f4; }
  .r6n1-fil > i { position: absolute; top: 0; bottom: 0; border-radius: 2px; background: #9aa0ab; }
  body:not(.r6n1-n4) .r6n1-fil[data-haut3="true"] > i, body.r6n1-n4 .r6n1-fil[data-haut4="true"] > i { background: var(--c); }
  .r6n1-fil.ouvert > i { -webkit-mask: linear-gradient(90deg, #000 55%, transparent); mask: linear-gradient(90deg, #000 55%, transparent); }
  .r6n1-fil.ouvertb > i { -webkit-mask: linear-gradient(270deg, #000 55%, transparent); mask: linear-gradient(270deg, #000 55%, transparent); }
  .r6n1-fil.verif { box-shadow: 0 0 0 1px var(--acc); }
  .r6n1-fil.inc { background: repeating-linear-gradient(135deg, #fff 0 2px, #8a909b 2px 3.5px); }
  .r6n1-eg { font: 600 12px/14px var(--mono); color: var(--encre); white-space: nowrap; letter-spacing: -.03em; }
  .r6n1-eg.ref { color: var(--gris); } .r6n1-eg.jamais { color: var(--gris); }
  .r6n1-inc-t { display: flex; align-items: center; gap: 6px; min-height: 20px; font-size: 12px; color: var(--gris); }
  .r6n1-inc-p { display: inline-flex; gap: 2px; width: 34px; opacity: .6; }
  /* les actions et les ponts */
  .r6n1-act { display: flex; gap: 6px; }
  .r6n1-b { flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 4px; height: 32px; border-radius: 999px; box-shadow: inset 0 0 0 1.5px var(--encre); font-size: 14px; font-weight: 700; }
  .r6n1-b b { font-size: 12px; }
  .r6n1-b[aria-expanded="true"], .r6n1-b[aria-pressed="true"] { background: var(--encre); color: #fff; }
  .r6n1-df { position: relative; left: auto; right: auto; top: auto; margin: 0; display: grid; grid-template-columns: 1fr 1fr; box-shadow: inset 0 0 0 1px var(--trait2); }
  .r6n1-df[hidden] { display: none; }
  .r6n1-df-t { grid-column: 1 / -1; color: var(--gris); }
  .r6n1-df-g { grid-column: 1 / -1; display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .r6n1-df-g[hidden] { display: none; }
  .r6n1-df-c { display: flex; flex-wrap: wrap; align-items: center; gap: 2px 4px; padding: 6px; border-radius: 8px; box-shadow: inset 0 0 0 1px var(--trait2); }
  .r6n1-df-v { width: 100%; font-weight: 700; } .r6n1-df-c.ok .r6n1-df-v { color: #2f6b4f; } .r6n1-df-c.non .r6n1-df-v { color: var(--acc); }
  .r6n1-df-d { width: 100%; color: var(--gris); }
  .r6n1-ponts { display: flex; gap: 6px; }
  .r6n1-ponts a { flex: 1; display: flex; align-items: center; gap: 4px; min-height: 40px; padding: 0 8px 0 10px; border-radius: 999px; background: var(--encre); color: #fff; font-size: 14px; font-weight: 700; }
  .r6n1-ponts a:first-child { flex: 1.35; }
  .r6n1-frise { margin-left: auto; }
  .r6n1-frise line { stroke: rgba(255,255,255,.55); }
  .r6n1-lev { margin-left: auto; display: flex; flex-direction: column; gap: 3px; width: 46px; }
  .r6n1-lev i { display: block; height: 5px; border-radius: 2px; background: ${JET.citrus.base}; }
  .r6n1-lev-u { opacity: .55; }
  /* la preuve */
  .r6n1-vraies { display: flex; flex-direction: column; gap: 6px; padding: 6px 0 4px; border-top: 1px solid var(--trait); }
  .r6n1-vals { display: flex; flex-direction: column; gap: 6px; }
  .r6n1-vh, .r6n1-vg { display: grid; grid-template-columns: 70px repeat(3, minmax(0, 1fr)); column-gap: 4px; }
  body.r6n1-n4 .r6n1-vh, body.r6n1-n4 .r6n1-vg { grid-template-columns: 64px repeat(4, minmax(0, 1fr)); }
  .r6n1-vh { font-size: 12px; font-weight: 700; }
  .r6n1-vg { align-items: start; padding: 3px 0; border-top: 1px solid var(--trait); }
  .r6n1-chim { display: flex; flex-direction: column; gap: 6px; }
  .r6n1-vn { display: flex; align-items: flex-start; gap: 4px; font-size: 12px; }
  .r6n1-vn b { display: block; font-weight: 700; hyphens: manual; overflow-wrap: anywhere; } .r6n1-vu { display: block; color: var(--gris); }
  .r6n1-vc { display: flex; flex-direction: column; gap: 2px; min-width: 0; padding: 0 2px; }
  .r6n1-vv { font-size: 12px; font-weight: 600; white-space: nowrap; }
  .r6n1-vbar { position: relative; display: block; height: 6px; background: #f1f1f4; border-radius: 2px; }
  .r6n1-vbr { position: absolute; top: 0; bottom: 0; background: var(--c); border-radius: 2px; opacity: .8; }
  .r6n1-vbr.ouvert { background: linear-gradient(90deg, var(--c) 55%, rgba(255,255,255,0)); }
  .r6n1-vlot { position: absolute; top: -3px; bottom: -3px; width: 2px; margin-left: -1px; background: var(--encre); }
  .r6n1-vr { font-size: 12px; color: var(--gris); line-height: 1.15; }
  .r6n1-vc.verif .r6n1-vr { color: var(--acc); }
  .r6n1-vc.max .r6n1-vv { color: var(--c); font-weight: 700; } .r6n1-vc.max .r6n1-vbr { opacity: 1; }
  .r6n1-vc.inc { flex-direction: row; align-items: center; gap: 4px; } .r6n1-vi { font-size: 12px; color: var(--gris); }
  .r6n1-vnote { order: 99; grid-column: 2 / -1; font-size: 12px; color: var(--gris); }
  .r6n1-vsrc { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--gris); }
  .r6n1-vrefs { display: flex; flex-wrap: wrap; gap: 2px 10px; font-size: 12px; color: var(--gris); }
  .r6n1-vrefs b { color: var(--encre); }
  .r6n1-pied { display: flex; align-items: flex-start; gap: 6px; font-size: 12px; color: var(--gris); }
  .w-leg p { font-size: 12px; line-height: 1.3; }
  .r6n1-lg-z, .r6n1-lg-b, .r6n1-lg-w, .r6n1-lg-av, .r6n1-lg-x, .r6n1-lg-vi, .r6n1-lg-wk, .r6n1-lg-f { display: inline-block; flex: none; width: 22px; height: 10px; border-radius: 2px; }
  .r6n1-lg-z { background: ${JET.floral.fond}; box-shadow: inset -1.5px 0 0 ${JET.floral.texte}; } .r6n1-lg-b { background: ${JET.floral.base}; } .r6n1-lg-w { height: 2px; background: rgba(22,22,26,.55); border-radius: 0; }
  .r6n1-lg-av { width: 2px; height: 14px; background: var(--encre); } .r6n1-lg-x { background: ${ACC}; } .r6n1-lg-vi { width: 0; height: 14px; border-left: 2px dotted var(--encre); border-radius: 0; }
  .r6n1-lg-wk { height: 2px; background: ${COUL['Idaho 7']}; opacity: .6; } .r6n1-lg-f { height: 4px; background: ${COUL.Galaxy}; }`;

// Le code client, enveloppé (le script de la fiche déclare aussi NS, h, css… au niveau global).
const js = `(() => {
const RD = ${JSON.stringify(RD)};
const radarSvg = ${radarSrc};
const TOUS = ${JSON.stringify(TOUS)}, NOMS = ${JSON.stringify(NOMS)}, N4 = ${JSON.stringify(NS4)}, COUL = ${JSON.stringify(COUL)};
const RANGS = ${JSON.stringify(RANGS)}, LEV = ${JSON.stringify(LEV)}, DEFIN = ${JSON.stringify(Object.fromEntries(TOUS.map((n) => [n, DEFI[n].n])))};
const PIC = ${JSON.stringify(Object.fromEntries(CRITERES.map((f) => [f, pic(f, 16)])))};
const NOMF = ${JSON.stringify(Object.fromEntries(CRITERES.map((f) => [f, NOM[f].toLowerCase()])))};
let SEL = TOUS.indexOf(${JSON.stringify(DEPART)}), CRIT = 'floral', TIRE = false;
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const n4 = () => document.body.classList.contains('r6n1-n4');
const actifs = () => TOUS.map((n) => n !== N4 || n4());
const dessiner = () => { $('#r6n1-radar').innerHTML = radarSvg(RD, SEL, document.body.classList.contains('abs'), actifs()); tirer(); };
// Tire 20 : vingt bières tirées uniformément dans la bande du moteur, graine fixe (convention de lecture).
function tirer() {
  $$('.r6n1-tir').forEach((t) => { t.innerHTML = ''; });
  if (!TIRE) return;
  const abs = document.body.classList.contains('abs');
  let g = 20261022;
  const u = () => { g = (g * 1103515245 + 12345) % 2147483648; return g / 2147483648; };
  $$('.r6n1-cel[data-col="' + TOUS[SEL] + '"][data-tir]').forEach((c) => {
    const [w0, w1, z, w0a, w1a, za] = c.dataset.tir.split(',').map(Number), a = abs ? w0a : w0, b = abs ? w1a : w1, zz = abs ? za : z;
    const t = c.querySelector('.r6n1-tir');
    for (let i = 0; i < 20; i++) { const x = a + (b - a) * u(), d = document.createElement('i'); d.style.left = (Math.min(1, x) * 100).toFixed(1) + '%'; if (x > zz) d.className = 'hs'; t.append(d); }
  });
}
function choisir(i) {
  SEL = i; const n = TOUS[i];
  $$('.r6n1-tc').forEach((t) => { const on = t.dataset.col === n; t.classList.toggle('sel', on); const b = t.querySelector('[role="radio"]'); b.setAttribute('aria-checked', String(on)); });
  $$('.r6n1-cel').forEach((c) => { const on = c.dataset.col === n; c.classList.toggle('sel', on); c.style.setProperty('--hs', on ? COUL[n] : 'transparent'); });
  $$('.r6n1-wk').forEach((w) => w.classList.toggle('sel', w.dataset.col === n));
  $$('.r6n1-rep').forEach((r) => { r.hidden = r.dataset.pour !== n; });
  $$('.r6n1-df-g').forEach((r) => { r.hidden = r.dataset.pour !== n; });
  $$('.r6n1-ibu-f, .r6n1-ibu-n').forEach((f) => f.classList.toggle('on', f.dataset.col === n));
  $('#r6n1-defi-n').textContent = DEFIN[n] + '/4';
  $('#r6n1-jeton').setAttribute('fill', COUL[n]);
  $('#r6n1-pont-d').setAttribute('aria-label', 'Doser ' + n + ' dans Dryhopper : le moment au doigt, un second houblon, jour après jour');
  const L = LEV[n], mx = Math.max(L.u, L.p) * 1.1 || 1;
  $('#r6n1-lev-u').style.width = (L.u / mx * 100).toFixed(1) + '%'; $('#r6n1-lev-p').style.width = (L.p / mx * 100).toFixed(1) + '%';
  $('#r6n1-pont-l').setAttribute('aria-label', 'Levure : ce que Pomona change pour ' + n + ' en dry hop actif (~' + (L.d >= 0 ? '+' : '−') + Math.abs(L.d).toFixed(1).replace('.', ',') + ' cran)');
  dessiner();
}
function ranger() {
  const r = RANGS[CRIT][n4() ? 4 : 3];
  $$('[data-col]').forEach((e) => { if (e.closest('.r6n1-g, .r6n1-vh, .r6n1-vg')) e.style.order = String(r.indexOf(e.dataset.col) + 1); });
  return r[0];
}
$$('.r6n1-tc [role="radio"]').forEach((b) => b.addEventListener('click', () => choisir(TOUS.indexOf(b.closest('.r6n1-tc').dataset.col))));
$$('.r6n1-fi').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); if (window.ouvrirFiche) window.ouvrirFiche(b.dataset.ouvre); }));
$$('.lentille [data-e]').forEach((b) => b.addEventListener('click', () => setTimeout(dessiner, 0)));
// les fenêtres à un toucher : pourquoi, critère, défi, ajout
const bascule = (btn, on) => { const p = document.getElementById(btn.getAttribute('aria-controls')); btn.setAttribute('aria-expanded', String(on)); p.hidden = !on; };
const fermerTout = (sauf) => $$('.r6n1-pq-b, .r6n1-crit-b, .r6n1-plus').forEach((b) => { if (b !== sauf && b.getAttribute('aria-expanded') === 'true') bascule(b, false); });
$$('.r6n1-pq-b, .r6n1-crit-b, .r6n1-plus, [aria-controls="r6n1-defi"]').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); fermerTout(b); bascule(b, b.getAttribute('aria-expanded') !== 'true'); }));
document.addEventListener('click', (e) => { if (!e.target.closest('.r6n1-pop')) fermerTout(null); });
$$('.r6n1-crit-o').forEach((o) => o.addEventListener('click', (e) => {
  e.stopPropagation(); CRIT = o.dataset.crit;
  $$('.r6n1-crit-o').forEach((x) => x.setAttribute('aria-checked', String(x === o)));
  const b = $('.r6n1-crit-b'); b.innerHTML = PIC[CRIT] + b.innerHTML.slice(b.innerHTML.indexOf('</svg>') + 6); b.setAttribute('aria-label', 'Critère de classement : ' + NOMF[CRIT]);
  bascule(b, false); choisir(TOUS.indexOf(ranger()));
}));
const ajouter = (on) => { document.body.classList.toggle('r6n1-n4', on); $('.r6n1-plus').disabled = on; if (!on && TOUS[SEL] === N4) SEL = TOUS.indexOf(ranger()); ranger(); choisir(SEL); };
$('.r6n1-aj-o').addEventListener('click', (e) => { e.stopPropagation(); bascule($('.r6n1-plus'), false); ajouter(true); });
$$('.r6n1-ret').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); ajouter(false); }));
$('#r6n1-tire').addEventListener('click', () => { TIRE = !TIRE; $("#r6n1-tire").setAttribute("aria-expanded", String(TIRE)); tirer(); });
const PR = $('#r6n1-preuve'), V = $('#r6n1-vraies');
PR.addEventListener('click', () => { const on = PR.getAttribute('aria-expanded') !== 'true'; PR.setAttribute('aria-expanded', String(on)); V.hidden = !on; });
$$('a[data-role="pont"]').forEach((a) => a.addEventListener('click', (e) => e.preventDefault()));
const LB = $('[data-role="legende-bouton"]'), LG = $('[data-role="legende"]'), LV = $('[data-role="legende-voile"]');
const legende = (on) => { LG.hidden = !on; LV.hidden = !on; LB.setAttribute('aria-expanded', String(on)); };
LB.addEventListener('click', () => legende(LB.getAttribute('aria-expanded') !== 'true'));
$('[data-role="legende-fermer"]').addEventListener('click', () => legende(false));
LV.addEventListener('click', () => legende(false));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { legende(false); fermerTout(null); } });
ranger(); choisir(SEL);
const q = new URLSearchParams(location.search);
if (q.has('legende')) legende(true);
if (q.has('n4')) ajouter(true);
if (q.get('sel') && TOUS.includes(q.get('sel'))) choisir(TOUS.indexOf(q.get('sel')));
if (q.has('vraies')) PR.click();
if (q.has('tire')) $('#r6n1-tire').click();
if (q.has('defi')) $('[aria-controls="r6n1-defi"]').click();
if (q.get('crit')) { const o = $('.r6n1-crit-o[data-crit="' + q.get('crit') + '"]'); if (o) o.click(); }
})();`;

const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>r6n1 · Tout au premier écran · Comparer</title>
<!-- Lot 22 bis · r6n1 · généré par generer.mjs depuis ../donnees/comparer-stout.json. Choix portés : Radar r2 ; Base dose égale ; Porte non ; Descripteurs A. -->
${S.POLICES}
<style>${S.CSS}
${css}</style>
</head>
<body>
${S.SYMB}
<main class="ecran">${corps}
</main>
${legende}
<script>${rt}</script>
<script>${js}</script>
</body>
</html>
`;
fs.writeFileSync(path.join(ICI, 'etat.html'), html);
console.log('écrit r6n1/etat.html (' + Math.round(html.length / 1024) + ' Ko) · départ : ' + DEPART + ' · inconnus pour tous : ' + TOUS_INC.join(', '));
for (const n of TOUS) console.log(n, '· hors :', hors(n).join(',') || '—', '· floral', verdictObj(n, VEUT), '~' + sg(dCran(n, VEUT), 2), '· résineux', verdictObj(n, TROP), '~' + sg(dCran(n, TROP), 2), '· IBU à 10′ ≈', IBU10[n] && IBU10[n].toFixed(1), '· levure', LEV[n].f, LEV[n].u.toFixed(1), '→', LEV[n].p.toFixed(1));
for (const f of CRITERES) console.log('rang', f, RANGS[f][3].join(' > '));
