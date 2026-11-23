// Lot 22 · r6f · « Même amertume, quel arôme ? » (Comparer : Cascade, Idaho 7 ou Galaxy pour la stout 16D).
// Angle : chaque houblon à la dose qui donne 10 IBU à 10′ (egalites.ibuEgal). L'amertume est fixée ; la dose est
// un RÉSULTAT (pas un réglage) ; on compare l'arôme qui reste. Seul facteur libre : la variété mise en avant.
// Choix portés : Radar r2 (un houblon plein, les autres en contour, trait de 3) ; Base IBU égal ; Porte non ;
// Descripteurs B (part « autres » dessinée, seuil 25 %, plafond 33 %, à corriger par le brasseur).
// Données : donnees/comparer-stout.json, et rien d'autre. Calculs faits ici, tous écrits dans la légende :
//   - apport ~ simulé à la dose d'IBU égal : interpolation linéaire de la grille b10 / US-05 (0, 1, 2, 4, 8 g/L ;
//     0 g/L = aucun apport) ;
//   - intervalle : la même interpolation aux doses que demanderait un lot au bas et au haut de l'α des fiches
//     (dose × α du lot / α) ;
//   - huile mise en cuve : dose (g/L) × huile totale des fiches (mL/100 g) = mL/hL ;
//   - au style : apport / cran du style (echelle.parFamille) ; absolu : apport en points de l'échelle 0–100.
// Usage : node generer.mjs  →  r6f/etat.html
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runtime, CSS_FICHE } from '../../fils18-baseline/l8g/noyau.mjs';
import { SYMB, CSS as CSS_W, POLICES, JET, NOM, COURT, ORDRE, ic, pic, esc, fr, JS_COMMUN } from '../../fils21-choisir/w1/socle-w.mjs';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const D = JSON.parse(fs.readFileSync(path.join(ICI, '../donnees/comparer-stout.json'), 'utf8'));
const NOMS = ['Cascade', 'Idaho 7', 'Galaxy'];
const COULEUR = { Cascade: '#781838', 'Idaho 7': '#e80030', Galaxy: '#681878' }; // couleurs des lots 20–21 (fils20-dryhop)
const H = Object.fromEntries(D.houblons.map((h) => [h.nom, h]));
const IBU = D.egalites.ibuEgal.find((e) => e.moment === 'b10');
const VOL = IBU.volumeL;
const LEV = 'fermentis-us05';
const ROUE = ['citrus', 'tropical', 'melon', 'stoneFruit', 'pomeFruit', 'berries', 'floral', 'green', 'herbal', 'spice', 'earthy', 'resin'];
const PF = D.echelle.parFamille;
const AV = D.biere.avant;
const ATTENDUES = Object.entries(D.style.zone).filter(([, z]) => z.statut === 'attendue').map(([f]) => f);
const B = D.descripteurs.B;
const frp = (x) => fr(x * 100, 0) + ' %';
const plage = (a, b, d = 1) => (a === b ? fr(a, d) : fr(a, d) + '–' + fr(b, d));
const SRC = (s) => (/^bm-/.test(s) ? 'Beer Maverick' : /^hs-/.test(s) ? 'Hopsteiner' : s);

// ---------- l'apport ~ simulé, à une dose quelconque (interpolation de la grille b10) ----------
const lignes = (nom) => H[nom].grille.filter((g) => g.moment === IBU.moment && g.levure === LEV).sort((a, b) => a.dose_gL - b.dose_gL);
const inconnue = (nom, f) => lignes(nom).every((g) => g.apres[f][1] === 0 && g.apres[f][2] === 0);
function apport(nom, f, dose) {
  const pts = [[0, 0], ...lignes(nom).map((g) => [g.dose_gL, g.delta[f]])];
  let i = pts.findIndex((p) => p[0] >= dose);
  if (i <= 0) i = i === 0 ? 1 : pts.length - 1;
  const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
  return y0 + (y1 - y0) * (dose - x0) / (x1 - x0);
}
const HOPS = NOMS.map((nom) => {
  const h = H[nom];
  const lot = h.alpha.retenu.value;
  const amin = Math.min(...h.alpha.sources.map((s) => s.min)), amax = Math.max(...h.alpha.sources.map((s) => s.max));
  const dose = IBU.doses[nom];
  const dHaut = dose * lot / amin, dBas = dose * lot / amax; // α bas → plus de houblon
  const ap = {}, lo = {}, hi = {};
  for (const f of ROUE) {
    if (inconnue(nom, f)) { ap[f] = null; continue; }
    const a = apport(nom, f, dose), x = apport(nom, f, dBas), y = apport(nom, f, dHaut);
    ap[f] = a; lo[f] = Math.min(a, x, y); hi[f] = Math.max(a, x, y);
  }
  const huile = h.huiles.totale.sources;
  const hmin = Math.min(...huile.map((s) => s.min)), hmax = Math.max(...huile.map((s) => s.max));
  const conf = lignes(nom)[0].confiance;
  return {
    nom, couleur: COULEUR[nom], lot, lotDe: h.alpha.retenu.from, amin, amax, hors: lot < amin || lot > amax,
    alphaSrc: h.alpha.sources.map((s) => s.source + ' ' + s.annee).join(', '),
    role: h.role.value, roleRegle: /^règle/.test(h.role.source), roleSrc: h.role.source,
    dose, grammes: dose * VOL, dBas, dHaut, ap, lo, hi, huile: [dose * hmin, dose * hmax], huileSrc: huile.map((s) => s.source + ' ' + s.annee).join(', '), hmin, hmax, conf,
  };
});

// ---------- verdict ~ simulé : l'écart entre les trois, face au seuil d'écart du style ----------
const ecarts = ROUE.filter((f) => HOPS.every((x) => x.ap[f] != null)).map((f) => {
  const v = HOPS.map((x) => x.ap[f]);
  return { f, e: Math.max(...v) - Math.min(...v), seuil: PF[f].seuilEcart, cran: PF[f].cran, haut: HOPS[v.indexOf(Math.max(...v))].nom };
}).sort((a, b) => b.e / b.cran - a.e / a.cran);
const sousSeuil = ecarts.every((x) => x.e < x.seuil);
const plusGrand = ecarts[0];
console.log('écarts', ecarts.slice(0, 4).map((x) => x.f + ' ' + fr(x.e) + ' pts (' + fr(x.e / x.cran, 2) + ' cran, seuil ' + fr(x.seuil) + ') ' + x.haut).join(' ; '));

// ---------- les mots des fiches, option B : part « autres » ----------
function motsFiches(nom) {
  const h = H[nom];
  const fam = h.aromes.filter((a) => a.level > 0).map((a) => ({ f: a.family, n: a.mots.reduce((s, m) => s + m.mots.length, 0) })).filter((x) => x.n > 0);
  const p = B.parts[nom];
  const tot = fam.reduce((s, x) => s + x.n, 0);
  const reste = 1 - (p.visible ? p.partDessinee : 0);
  return { fam: fam.map((x) => ({ ...x, part: x.n / tot * reste })).sort((a, b) => b.part - a.part), autres: p.visible ? { part: p.partDessinee, vraie: p.part, concepts: p.concepts } : null, generiques: h.motsSansFamille.map((m) => m.mot).filter((m) => B.generiques.includes(m.toLowerCase())) };
}
const barreMots = (nom, cls = '') => {
  const m = motsFiches(nom);
  const lab = 'Les mots de ses fiches : ' + m.fam.map((x) => COURT[x.f].toLowerCase() + ' ' + frp(x.part)).join(', ') + (m.autres ? ', autres (sans famille) ' + frp(m.autres.part) + ' : ' + m.autres.concepts.join(', ') : '');
  return `<span class="mots ${cls}" role="img" aria-label="${esc(lab)}">${m.fam.map((x) => `<i class="seg-f" data-famille="${x.f}" style="flex:${x.part.toFixed(3)}"></i>`).join('')}${m.autres ? `<i class="seg-a" data-role="autres" data-houblon="${esc(nom)}" data-part="${String(m.autres.part).replace('.', ',')}" aria-label="autres, sans famille : ${frp(m.autres.part)}" style="flex:${m.autres.part}"></i>` : ''}</span>`;
};

// ---------- une colonne de houblon : nom, α, rôle, dose (résultat), arômes des fiches, huile en cuve ----------
const ROLE_MOT = { aromatique: 'aromatique', amérisant: 'amérisant', double: 'mixte' };
const colonne = (x, i) => {
  const m = motsFiches(x.nom);
  const pics = m.fam.slice(0, 3).map((y) => pic(y.f, 14)).join('');
  return `<div class="col" data-houblon="${esc(x.nom)}" data-couleur="${x.couleur}" style="--h:${x.couleur}" data-i="${i}">
  <button type="button" class="col-n" aria-pressed="${i === 0}" aria-label="Mettre en avant ${esc(x.nom)} sur le radar"><i class="pt" aria-hidden="true"></i><span class="hn">${esc(x.nom)}</span></button>
  <span class="col-ar"><span class="al lot" data-role="alpha" data-source="lot" data-houblon="${esc(x.nom)}" data-nature="mesure" aria-label="α du lot : ${fr(x.lot)} % (${esc(x.lotDe)})${x.hors ? ' ; hors de ses fiches, ' + plage(x.amin, x.amax) + ' %' : ''}">${fr(x.lot)}%${x.hors ? ic('diff', 12) : ''}</span></span><span class="col-ar"><span class="us us-mot${x.roleRegle ? ' deduit' : ''}" data-role="usage" data-usage="${x.role}" aria-label="Usage : ${ROLE_MOT[x.role]}${x.roleRegle ? ', déduit de l’α, à valider' : ', attesté par le fournisseur'}"><span class="us-m">${ROLE_MOT[x.role]}</span></span></span>
  <span class="col-d" data-nature="calcule" aria-label="Dose pour 10 IBU à 10′ : ${fr(x.grammes, 0)} g pour ${VOL} L, soit ${fr(x.dose, 2)} g/L (calculé)"><b class="mono">${fr(x.grammes, 0)} g</b><span class="mono gL">${fr(x.dose, 1)} g/L</span></span>
  ${barreMots(x.nom)}
  <span class="col-p">${pics}${m.autres ? '<span class="au"><i class="sw-a" aria-hidden="true"></i>autres</span>' : ''}</span>
  <span class="col-h" data-nature="calcule" aria-label="Huile mise en cuve : ${plage(x.huile[0], x.huile[1])} mL/hL, d’après l’huile des fiches ${plage(x.hmin, x.hmax)} mL/100 g (${esc(x.huileSrc)})">${ic('huile', 12)}<span class="mono">${plage(x.huile[0], x.huile[1])}</span><span class="u">mL/hL</span></span>
</div>`;
};

// ---------- la chimie (un toucher) : dans le cône, rattachée aux familles ----------
const COMPOSES = [
  { k: 'huile', nom: 'huile totale', u: 'mL/100 g', f: [] },
  { k: 'linalol', nom: 'linalol', u: '% huile', f: ['floral', 'citrus'] },
  { k: 'geraniol', nom: 'géraniol', u: '% huile', f: ['floral'] },
  { k: 'myrcene', nom: 'myrcène', u: '% huile', f: ['resin', 'green'] },
  { k: '4MMP', nom: '4MMP', u: 'µg/kg', f: ['berries', 'tropical'] },
  { k: '3MH', nom: '3MH', u: 'µg/kg', f: ['citrus', 'tropical'] },
];
function cellule(nom, k) {
  const c = H[nom].composes;
  const e = k === 'huile' ? c.huile : c.composes[k];
  const vals = (e && e.valeurs) || [];
  if (!vals.length) {
    const raison = (e && (e.raison || (e.nonDetecte && e.nonDetecte[0].texte))) || 'non publié';
    const nd = e && e.nonDetecte;
    return `<td><span class="inc" aria-label="${esc(nom)} : inconnu, ${esc(raison)}"><i class="hach" aria-hidden="true"></i>${nd ? 'non détecté' : 'inconnu'}</span></td>`;
  }
  const mins = vals.map((v) => v.plage[0]).filter((v) => v != null), maxs = vals.map((v) => v.plage[1]).filter((v) => v != null);
  const srcs = [...new Set(vals.flatMap((v) => v.sources).map(SRC))];
  const conf = vals.some((v) => v.aConfirmer);
  const t = !mins.length ? '< ' + fr(Math.max(...maxs)) : !maxs.length ? '> ' + fr(Math.min(...mins)) : plage(Math.min(...mins), Math.max(...maxs));
  return `<td><span class="v mono" data-nature="mesure" data-source="${esc(srcs.join(', '))}">${t}${conf ? ' ?' : ''}</span><span class="src">${esc(srcs.slice(0, 2).join(', '))}</span></td>`;
}
const chimie = `<section class="sec" id="sec-chimie" data-acquis="chimie" hidden aria-label="La chimie">
  <p class="sec-t">${ic('labo', 14)}<b>Dans le cône</b><span class="gris">fiches et labos ; pas dans ta bière</span></p>
  <table class="chim"><thead><tr><th></th>${HOPS.map((x) => `<th><i class="pt" style="--h:${x.couleur}"></i>${esc(x.nom)}</th>`).join('')}</tr></thead><tbody>
  ${COMPOSES.map((c) => `<tr data-compose="${c.k}"><th><span class="cn">${c.f.map((f) => pic(f, 14)).join('')}<b>${c.nom}</b></span><span class="u">${c.u}</span></th>${NOMS.map((n) => cellule(n, c.k)).join('')}</tr>`).join('')}
  </tbody></table>
  <p class="note">Linalol, géraniol : floral ; 4MMP : cassis, passion ; 3MH : pamplemousse ; myrcène : vert, résineux (sens des marqueurs, d’après le dépôt des composés).</p>
</section>`;

// ---------- les vraies valeurs (un toucher) : la manière de v1, en barres sur une même échelle ----------
function rangees(titre, u, max, rows) {
  return `<div class="vv"><p class="vv-t"><b>${titre}</b><span class="u">${u}</span></p>${rows.map((r) => `<div class="vv-r" style="--h:${r.c}">
    <span class="vv-n"><i class="pt"></i>${esc(r.nom)}</span>
    <span class="v mono" data-nature="mesure" data-source="${esc(r.src)}">${plage(r.min, r.max)} ${u}</span>
    <span class="vv-b" aria-hidden="true"><i class="vv-p" style="left:${(r.min / max * 100).toFixed(1)}%;width:${Math.max(1.5, (r.max - r.min) / max * 100).toFixed(1)}%"></i>${r.lot != null ? `<i class="vv-l" style="left:${(Math.min(r.lot, max) / max * 100).toFixed(1)}%"></i>` : ''}</span>
    <span class="src">${esc(r.srcCourt)}</span></div>`).join('')}</div>`;
}
const SR = (s) => s.map((x) => x.source + ' ' + x.annee);
const valeurs = `<section class="sec" id="sec-valeurs" data-acquis="valeurs" hidden aria-label="Les vraies valeurs">
  ${rangees('α', '%', 18, HOPS.map((x) => ({ nom: x.nom, c: x.couleur, min: x.amin, max: x.amax, lot: x.lot, src: x.alphaSrc, srcCourt: SR(H[x.nom].alpha.sources).join(' · ') })))}
  ${rangees('β', '%', 18, HOPS.map((x) => { const s = H[x.nom].beta.sources; return { nom: x.nom, c: x.couleur, min: Math.min(...s.map((y) => y.min)), max: Math.max(...s.map((y) => y.max)), src: SR(s).join(', '), srcCourt: SR(s).join(' · ') }; }))}
  ${rangees('Huile totale', 'mL/100 g', 5.5, HOPS.map((x) => { const s = H[x.nom].huiles.totale.sources; return { nom: x.nom, c: x.couleur, min: x.hmin, max: x.hmax, src: SR(s).join(', '), srcCourt: SR(s).join(' · ') }; }))}
  <p class="note">Trait noir : α du lot. Galaxy 17,2 % sort de ses fiches (11–16 %) : à vérifier sur le certificat.</p>
</section>`;

// ---------- le panel OSU (un toucher) : mesuré, Cascade à cru, sans molette ----------
function panelOSU() {
  const P = D.panelOSU, W = 326, Hh = 150, x0 = 14, x1 = W - 96, y0 = 12, y1 = Hh - 26, dmax = 16;
  const X = (d) => x0 + (x1 - x0) * d / dmax, Y = (v) => y1 - (y1 - y0) * v / 15;
  const serie = (k, c, lab) => `<polyline points="${P.doses.map((d, i) => X(d).toFixed(1) + ',' + Y(P[k][i]).toFixed(1)).join(' ')}" fill="none" stroke="${c}" stroke-width="2"/>${P.doses.map((d, i) => `<circle cx="${X(d).toFixed(1)}" cy="${Y(P[k][i]).toFixed(1)}" r="3" fill="#fff" stroke="${c}" stroke-width="2"/>`).join('')}<text x="${X(16) + 6}" y="${Y(P[k][4]) + 4}" class="t" fill="${c === '#16161a' ? '#16161a' : c}">${lab} ${fr(P[k][4])}</text>`;
  const dC = IBU.doses.Cascade;
  return `<section class="sec" id="sec-osu" data-acquis="osu" data-nature="mesure" data-source="${P.sources.join(', ')} ; ${P.complement.sources.join(', ')}" hidden aria-label="Panel OSU">
  <p class="sec-t">${ic('panel', 14)}<b>Panel OSU · Cascade à cru</b><span class="gris">${P.echelle}</span></p>
  <svg width="${W}" height="${Hh}" viewBox="0 0 ${W} ${Hh}" role="img" aria-label="Panel OSU, Cascade à cru 24 h : agrumes, herbacé et thé, intensité, de 0 à 16 g/L ; zone retenue ${P.zone[0]}–${P.zone[1]} g/L">
    <rect x="${X(P.zone[0])}" y="${y0}" width="${X(P.zone[1]) - X(P.zone[0])}" height="${y1 - y0}" fill="#f1f1f5"/>
    <text x="${(X(P.zone[0]) + X(P.zone[1])) / 2}" y="${y0 + 10}" text-anchor="middle" class="t g">retenu</text>
    <line x1="${x0}" y1="${y1}" x2="${x1}" y2="${y1}" stroke="#c4c4cc"/>
    ${[0, 2, 4, 8, 16].map((d) => `<text x="${X(d)}" y="${y1 + 14}" text-anchor="middle" class="t g">${d}</text>`).join('')}<text x="${x1 + 22}" y="${y1 + 14}" class="t g">g/L</text>
    <line x1="${X(dC)}" y1="${y0}" x2="${X(dC)}" y2="${y1}" stroke="${COULEUR.Cascade}" stroke-width="1.5"/>
    ${serie('intensite', '#16161a', 'intensité')}${serie('agrumes', JET.citrus.texte, 'agrumes')}${serie('herbaceThe', JET.herbal.texte, 'herbacé')}
  </svg>
  <p class="note"><b style="color:${COULEUR.Cascade}">|</b> ${fr(dC, 1)} g/L, la dose de Cascade pour 10 IBU : ici à cru 24 h, pas à 10′. ${esc(P.texte.split(' ; ')[0].replace(/^Cascade, cônes broyés, 24 h, 13–15 °C : agrumes/, 'Les agrumes'))}. <span class="src">${P.sources.join(', ')} · Lafontaine 2018 ; ${P.complement.sources.join(', ')}</span></p>
</section>`;
}

// ---------- la fiche (appui long) : g1 de la baseline, nourrie par comparer-stout ----------
const uniq = (xs) => { const vu = new Set(); return xs.filter((w) => { const k = w.toLowerCase(); if (vu.has(k)) return false; vu.add(k); return true; }).map((w) => w.toLowerCase()); };
const NOMS_H = { myrcene: 'myrcène', humulene: 'humulène', caryophyllene: 'caryophyllène', farnesene: 'farnésène', linalool: 'linalol' };
const FD = Object.fromEntries(HOPS.map((x) => {
  const h = H[x.nom], comp = h.huiles.composants || {}, ps = (s) => ({ src: s.source, an: s.annee ?? null, min: s.min, max: s.max });
  const m = motsFiches(x.nom);
  return [x.nom, {
    nom: x.nom, role: { v: h.role.value, src: x.roleRegle ? 'règle' : 'fournisseur', txt: h.role.source.replace(/^[^:]+ : /, '') }, voie: null,
    stock: /stock/.test(x.lotDe) ? 'suffisant' : null, ajout: null,
    alphaC1: { lot: x.lot, lotSource: x.lotDe, fiches: [x.amin, x.amax], horsFiches: x.hors },
    origine: h.composes.origine || null, alpha: h.alpha.sources.map(ps), lot: x.lot, beta: h.beta.sources.map(ps), huiles: h.huiles.totale.sources.map(ps),
    composants: Object.entries(NOMS_H).map(([k, n]) => (comp[k] ? { nom: n, min: comp[k].min, max: comp[k].max, src: comp[k].source } : { nom: n, raison: comp[k + 'Raison'] || null })),
    aromes: h.aromes.filter((a) => a.sources > 0).map((a) => ({ f: a.family, n: a.sources, of: a.of, auteurs: a.authors || [], mots: uniq(a.mots.flatMap((y) => y.mots)), premier: a.sources === 1 && (a.premier || []).length > 0 })),
    of: (h.aromes[0] || {}).of || 0, sans: uniq(h.motsSansFamille.map((s) => s.mot)),
    styles: h.usage.flatMap((u) => u.styles || []), stylesSrc: h.usage.map((u) => u.source).filter(Boolean), stylesRaison: null, desc: [], subs: [], subsRaison: 'non renseigné dans comparer-stout',
    autresB: m.autres, generiques: m.generiques, barre: barreMots(x.nom, 'f-mots'),
  }];
}));
// Option B sur la fiche : la ligne « sans famille : … » devient une forme, la barre des mots et sa part « autres ».
const JS_FICHE_B = `
function blocAutres(F) {
  const z = document.createElement('div'); z.className = 'f-autres'; z.setAttribute('data-houblon', F.nom); z.setAttribute('data-role', 'fiche-autres');
  z.innerHTML = F.barre + (F.autresB ? '<p class="f-au-t"><i class="sw-a" aria-hidden="true"></i><b>autres ' + Math.round(F.autresB.part * 100) + ' %</b> ' + F.autresB.concepts.join(', ') + '</p>'
    : F.generiques.length ? '<p class="f-au-t gris">mot trop vague, écarté : ' + F.generiques.join(', ').toLowerCase() + '</p>' : '');
  return z;
}`;

// ---------- l'écran ----------
const DEM = { floral: 'haut', resin: 'bas' }; // « ma stout est trop résineuses, je la veux plus floral » (18.10)
const DONNEES = {
  ROUE, ATTENDUES, COURT, DEM,
  TON: Object.fromEntries(ORDRE.map((f) => [f, { b: JET[f].base, t: JET[f].texte, f: JET[f].fond }])),
  CRAN: Object.fromEntries(ROUE.map((f) => [f, PF[f].cran])),
  PLACE: Object.fromEntries(ROUE.map((f) => [f, PF[f].bande[1] - AV[f].centre])), // ce que ta 16D laisse encore, en points
  HOPS: HOPS.map((x) => ({ nom: x.nom, c: x.couleur, ap: x.ap, lo: x.lo, hi: x.hi })),
};
const titre = 'Même amertume, quel arôme ?';
const verdict = sousSeuil ? '≈ même nez à 10 IBU' : 'plus grand écart : ' + COURT[plusGrand.f].toLowerCase() + ', ' + plusGrand.haut;
const corps = `
<header class="tete"><button class="ret" type="button" aria-label="Retour">${ic('chev-l', 20)}</button><h1>${titre}</h1>
  <button type="button" class="leg-b" data-role="legende-bouton" aria-expanded="false" aria-label="Légende">?<i class="doigt" aria-hidden="true"></i></button></header>
<p class="ctx" data-role="contexte" aria-label="Fixé pour les trois">${ic('biere', 14)}<span data-contexte="biere">Stout 16D, ${VOL} L</span><span data-contexte="base" class="fort">+${IBU.ibu} IBU</span><span data-contexte="moment">10′</span><span data-contexte="levure">US-05</span></p>
<section class="cols" data-libre="houblon" role="group" aria-label="Houblons comparés : touche pour mettre en avant, appui long pour la fiche">${HOPS.map(colonne).join('')}</section>
<div class="vd"><span class="seg vue" role="radiogroup" aria-label="Lecture : radar ou barres" data-lecture><button role="radio" type="button" data-v="radar" aria-checked="true">${ic('radar', 14)}Radar</button><button role="radio" type="button" data-v="barres" aria-checked="false">${ic('barres', 14)}Barres</button></span>
  <span class="seg lentille" role="radiogroup" aria-label="Lecture" data-lecture><button role="radio" type="button" data-e="style" aria-checked="true">Au style</button><button role="radio" type="button" data-e="absolu" aria-checked="false">Absolu</button></span></div>
<p class="vd-t" data-nature="simule"><span class="sim">~ simulé</span><span>${verdict}</span></p>
<section class="rad" id="vue-radar" data-acquis="radar" aria-label="Ce que chacun ajoute">
  <svg id="radar" width="358" height="300" viewBox="0 0 358 300" data-radar data-objet="comparer" data-axes="${ROUE.join(',')}" role="img"></svg>
</section>
<section class="bars" id="vue-barres" aria-label="Famille par famille" hidden><div id="barres"></div></section>
<div class="tch" role="group" aria-label="Le détail, à un toucher">
  <button type="button" class="tc" aria-expanded="false" aria-controls="sec-chimie">${ic('labo', 14)}Chimie</button>
  <button type="button" class="tc" aria-expanded="false" aria-controls="sec-osu">${ic('panel', 14)}Panel OSU</button>
  <button type="button" class="tc" aria-expanded="false" aria-controls="sec-valeurs">${ic('livre', 14)}Vraies valeurs</button>
</div>
${chimie}
${panelOSU()}
${valeurs}

<nav class="pont" aria-label="Suite"><a href="#" data-role="pont" id="pont" aria-label="Essayer à cru le houblon mis en avant : ouvrir Dryhopper">${ic('fleche', 14)}<b id="pont-n">${esc(HOPS[0].nom)}</b><span>→ Dryhopper</span></a></nav>
`;
function conf() { return '<span class="sim">~ simulé</span>'; }

const legende = `<div class="w-voile" data-role="legende-voile" hidden></div><section class="w-leg" id="legende" data-role="legende" role="dialog" aria-label="Légende" hidden>
  <div class="w-f-t"><b>Légende</b><button type="button" data-role="legende-fermer" aria-label="Fermer la légende">${ic('x', 18)}</button></div>
  <div class="w-leg-s"><h3>Même amertume</h3><p class="lg">Chaque houblon à la dose qui donne ${IBU.ibu} IBU à 10′ dans ${VOL} L. La dose est un résultat : g pour ${VOL} L, puis g/L.
    Huile en cuve : dose × huile des fiches (mL/100 g), en mL/hL.</p></div>
  <div class="w-leg-s"><h3>Le radar</h3><p class="lg">Ce que chacun ajoute à ta stout, ~ simulé. Plein : le houblon touché ; contour : les autres.
    Bande pâle : la même chose pour un lot au bas ou au haut de l’α de ses fiches. Hachuré : inconnu, jamais zéro.
    Au style : en crans de ta 16D (anneau : 1 cran). Absolu : en points, sur 0–100. Gras : les familles de la 16D.</p></div>
  <div class="w-leg-s"><h3>Les barres</h3><p class="lg">Une barre par houblon, de 0 (ta stout) à ce qu’il ajoute. Zone pâle : la place que ta 16D laisse encore. Orangé : déjà au-dessus de la 16D.
    ${ic('haut', 12)} ${ic('bas', 12)} ta dégustation du 18.10 : « trop résineuse, je la veux plus floral ».</p></div>
  <div class="w-leg-s"><h3>Les mots des fiches</h3><p class="lg"><span class="mots ex">${['citrus', 'tropical', 'stoneFruit'].map((f, i) => `<i class="seg-f" data-famille="${f}" style="flex:${[3, 2, 1][i]}"></i>`).join('')}<i class="seg-a ex" style="flex:2"></i></span>
    Une couleur par famille, à la part des mots des fiches. Gris : autres, des mots sans famille (Galaxy : cannabis, dank).
    Mots trop vagues écartés (${B.generiques.slice(0, 4).join(', ')}…), seuil ${fr(B.seuil * 100, 0)} %, plafond ${fr(B.plafond * 100, 0)} % : <b>${esc(B.aCorriger)}</b>.</p></div>
  <div class="w-leg-s"><h3>Les mots</h3><p class="lg">~ simulé : profil estimé, pas une mesure (moteur profil-simule, confiance ${esc(HOPS[0].conf)} ; ${esc(D.style.biereNoire.split(' ; ')[0].toLowerCase())}). α en tête : celui du lot ; ≠ hors de ses fiches. Usage pâle : déduit de l’α, à valider. Appui long sur un nom : sa fiche.</p></div>
</section>`;

const CSS = `
  ${CSS_W}
  .tete { display: flex; align-items: center; gap: 6px; height: 36px; }
  .ret { width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; flex: none; margin-left: -6px; }
  .tete h1 { font-size: 16px; font-weight: 700; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .gris { color: var(--gris); font-weight: 400; }
  .ctx { display: flex; align-items: center; gap: 0; font-size: 12px; color: var(--gris); flex-wrap: wrap; margin-top: -4px; }
  .ctx .ic { margin-right: 5px; }
  .ctx span + span::before { content: '·'; margin: 0 6px; color: var(--trait2); }
  .ctx .fort { color: var(--encre); font-weight: 700; }
  .cols { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
  .col { position: relative; display: flex; flex-direction: column; gap: 4px; padding: 6px 7px 7px; border-radius: 8px; box-shadow: inset 0 0 0 1px var(--trait); background: #fff; min-width: 0; -webkit-touch-callout: none; user-select: none; }
  .col::before { content: ''; position: absolute; left: 0; right: 0; top: 0; height: 3px; border-radius: 8px 8px 0 0; background: var(--h); }
  .col.on { box-shadow: inset 0 0 0 2px var(--h); }
  .col-n { display: inline-flex; align-items: center; gap: 5px; font-size: 14px; font-weight: 700; text-align: left; min-height: 24px; }
  .pt { width: 8px; height: 8px; border-radius: 50%; background: var(--h); flex: none; display: inline-block; }
  .col-ar { display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap; min-height: 15px; }
  .col-ar + .col-ar { margin-top: -3px; }
  .col-d { display: flex; align-items: baseline; gap: 5px; }
  .col-d b { font-size: 18px; font-weight: 600; }
  .gL { font-size: 12px; color: var(--gris); }
  .mots { display: flex; height: 8px; gap: 1px; border-radius: 4px; overflow: hidden; }
  .seg-f { background: var(--b); min-width: 3px; }
  .seg-a { background: #8a8a94; min-width: 3px; }
  .seg-a.ex { background: #8a8a94; }
  .col-p { display: flex; gap: 3px; min-height: 14px; align-items: center; }
  .au { display: inline-flex; align-items: center; gap: 3px; font-size: 12px; color: var(--gris); margin-left: 2px; }
  .col-h { display: inline-flex; align-items: center; gap: 3px; font-size: 12px; color: var(--gris); }
  .col-h .mono { color: var(--encre); }
  .u { font-size: 12px; color: var(--gris); font-weight: 400; }
  .vd { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
  .seg.vue button { gap: 4px; }
  .vd-t { margin-top: -2px; display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; min-width: 0; }
  .sim { display: inline-flex; align-items: center; height: 20px; padding: 0 7px; border-radius: 10px; background: #ececf1; font-size: 12px; font-weight: 600; color: var(--encre); white-space: nowrap; }
  .rad { display: flex; justify-content: center; margin: -4px 0 -6px; }
  #radar text { font: 400 12px var(--sans); fill: #3a3a42; }
  #radar text.att { font-weight: 700; fill: var(--encre); }
  #radar text.inc { fill: #6b6b75; } #radar text.hors { fill: var(--acc); font-weight: 600; }
  #radar text.ann { font-size: 12px; fill: #5b5b66; }
  .tch { display: flex; gap: 6px; flex-wrap: wrap; }
  .tc { display: inline-flex; align-items: center; gap: 5px; height: 28px; padding: 0 10px; border-radius: 14px; box-shadow: inset 0 0 0 1px var(--trait2); font-size: 12px; font-weight: 600; }
  .tc[aria-expanded="true"] { background: var(--encre); color: #fff; box-shadow: none; }
  .sec { display: flex; flex-direction: column; gap: 6px; padding: 8px 10px 10px; border-radius: 8px; box-shadow: inset 0 0 0 1px var(--trait); }
  .sec-t { display: flex; align-items: center; gap: 6px; font-size: 12px; flex-wrap: wrap; }
  .sec-t b { font-size: 14px; }
  .note { font-size: 12px; color: var(--gris); line-height: 1.3; }
  .src { font-size: 12px; color: var(--gris); white-space: nowrap; }
  .chim { border-collapse: collapse; width: 100%; font-size: 12px; }
  .chim th, .chim td { text-align: left; vertical-align: top; padding: 4px 3px; border-top: 1px solid var(--trait); }
  .chim thead th { border-top: 0; font-weight: 700; white-space: nowrap; }
  .chim thead .pt { margin-right: 4px; }
  .chim tbody th { font-weight: 400; width: 96px; }
  .cn { display: flex; align-items: center; gap: 2px; } .cn b { margin-left: 2px; }
  .chim td .v { display: block; font-size: 12px; }
  .chim td .src { display: block; }
  .inc { display: inline-flex; align-items: center; gap: 4px; color: var(--gris); }
  .hach { width: 14px; height: 10px; border-radius: 2px; background: repeating-linear-gradient(135deg, #fff 0 2px, #9aa0ab 2px 3.5px); box-shadow: inset 0 0 0 1px #8a909b; display: inline-block; }
  .vv { display: flex; flex-direction: column; gap: 3px; }
  .vv + .vv { border-top: 1px solid var(--trait); padding-top: 6px; }
  .vv-t { display: flex; gap: 6px; align-items: baseline; font-size: 14px; }
  .vv-r { display: grid; grid-template-columns: 66px 112px 1fr; grid-template-rows: auto auto; column-gap: 6px; align-items: center; font-size: 12px; }
  .vv-n { display: inline-flex; align-items: center; gap: 4px; font-weight: 600; white-space: nowrap; }
  .vv-r .v { white-space: nowrap; }
  .vv-b { position: relative; height: 8px; background: #f1f1f5; border-radius: 4px; }
  .vv-p { position: absolute; top: 0; bottom: 0; background: var(--h); border-radius: 4px; opacity: .75; }
  .vv-l { position: absolute; top: -3px; bottom: -3px; width: 2px; margin-left: -1px; background: var(--encre); }
  .vv-r .src { grid-column: 2 / 4; }
  .bars { display: flex; flex-direction: column; gap: 6px; }
  .br { display: grid; grid-template-columns: 86px 1fr 34px; align-items: center; column-gap: 6px; min-height: 30px; }
  .br-n { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; color: var(--t); white-space: nowrap; }
  .br-n .ic { color: var(--encre); }
  .br-p { position: relative; height: 26px; }
  .br-z { position: absolute; left: 0; top: 0; bottom: 0; background: var(--f); border-right: 1.5px solid var(--t); }
  .br-0 { position: absolute; left: 0; top: -2px; bottom: -2px; width: 2px; background: var(--encre); }
  .br-h { position: absolute; left: 0; height: 6px; border-radius: 0 2px 2px 0; background: var(--hc); transition: width .25s; }
  .br-h.pale { opacity: .45; }
  .br-w { position: absolute; height: 2px; background: var(--hc); opacity: .55; }
  .br-q { position: absolute; left: 3px; width: 16px; height: 8px; border-radius: 2px; background: repeating-linear-gradient(135deg, #fff 0 2px, #9aa0ab 2px 3.5px); box-shadow: inset 0 0 0 1px #8a909b; }
  .br-v { font: 600 12px var(--mono); text-align: right; color: var(--encre); }
  .br.hors .br-p { box-shadow: inset 0 -2px 0 var(--acc); }
  .br-inc { grid-template-columns: auto 1fr; font-size: 12px; } .br-inc .br-n { color: var(--gris); }
  .br-x { font-size: 12px; color: var(--acc); font-weight: 600; grid-column: 2 / 4; }
  .pont a { display: flex; align-items: center; gap: 6px; height: 36px; padding: 0 12px; border-radius: 18px; background: var(--encre); color: #fff; font-size: 14px; }
  .pied { font-size: 12px; color: var(--gris); display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
  .lg { font-size: 12px; line-height: 1.35; }
  .lg .mots { width: 90px; display: inline-flex; vertical-align: middle; margin-right: 4px; }
  .f-autres { display: flex; flex-direction: column; gap: 3px; margin: 2px 0 4px; }
  .f-autres .mots { height: 10px; }
  .f-au-t { font-size: 12px; display: flex; align-items: center; gap: 4px; }
  .sw-a { width: 10px; height: 10px; border-radius: 2px; background: #8a8a94; display: inline-block; }
  ${CSS_FICHE}
`;

const JS = `
(() => {
const q0 = new URLSearchParams(location.search);
const DAT = ${JSON.stringify(DONNEES)};
const NS = 'http://www.w3.org/2000/svg';
const S = { focus: 0, abs: false };
const nb = (x, d) => String(Math.round(x * 10 ** d) / 10 ** d).replace('.', ',');
const el = (t, a, p) => { const e = document.createElementNS(NS, t); for (const k in a) if (a[k] != null) e.setAttribute(k, a[k]); if (p) p.append(e); return e; };
const val = (h, f, k) => { const v = h[k][f]; if (v == null) return null; return S.abs ? v : v / DAT.CRAN[f]; };
// ---------- le radar r2 ----------
function radar() {
  const svg = document.getElementById('radar'); svg.replaceChildren();
  const W = 358, Hh = 300, cx = W / 2, cy = Hh / 2, R = 112, n = DAT.ROUE.length, pas = 2 * Math.PI / n;
  const MAX = S.abs ? 11 : 1.1, ANN = S.abs ? [5, 10] : [0.5, 1];
  const P = (k, r) => [cx + Math.sin(k * pas) * r, cy - Math.cos(k * pas) * r];
  const rr = (v) => R * Math.min(v, MAX) / MAX;
  const tous = (f) => DAT.HOPS.every((h) => h.ap[f] == null);
  const defs = el('defs', {}, svg), pat = el('pattern', { id: 'hach', width: 5, height: 5, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs);
  el('line', { x1: 0, y1: 0, x2: 0, y2: 5, stroke: '#a3a8b2', 'stroke-width': 1.2 }, pat);
  el('polygon', { points: DAT.ROUE.map((f, k) => P(k, Math.max(0, rr(S.abs ? DAT.PLACE[f] : DAT.PLACE[f] / DAT.CRAN[f]))).join(',')).join(' '), fill: '#f4f1ea', stroke: 'none', 'data-role': 'zone', 'aria-label': 'ta 16D : la place qui reste' }, svg);
  DAT.ROUE.forEach((f, k) => { if (!tous(f)) return; const a = P(k - 0.5, R), b = P(k + 0.5, R);
    el('path', { d: 'M' + cx + ',' + cy + 'L' + a.join(',') + 'A' + R + ',' + R + ' 0 0 1 ' + b.join(',') + 'Z', fill: 'url(#hach)', opacity: 0.8, 'data-inconnu': f }, svg); });
  el('polygon', { points: DAT.ROUE.map((f, k) => P(k, R).join(',')).join(' '), fill: 'none', stroke: '#dcdce3' }, svg);
  ANN.forEach((a, i) => el('polygon', { points: DAT.ROUE.map((f, k) => P(k, rr(a)).join(',')).join(' '), fill: 'none', stroke: i === ANN.length - 1 ? '#9a9aa6' : '#dcdce3', 'stroke-width': i === ANN.length - 1 ? 1.2 : 1 }, svg));
  DAT.ROUE.forEach((f, k) => { const e = P(k, R); el('line', { x1: cx, y1: cy, x2: e[0], y2: e[1], stroke: '#e4e4ea' }, svg); });
  { const q = P(6, rr(ANN[1])); const t = el('text', { x: q[0] + 4, y: q[1] - 5, 'text-anchor': 'start', class: 'ann' }, svg); t.textContent = S.abs ? '10 pts' : '1 cran'; }
  // la bande du houblon mis en avant : α bas et haut de ses fiches
  const F = DAT.HOPS[S.focus];
  const anneau = (k2) => DAT.ROUE.map((f, k) => P(k, F[k2][f] == null ? 0 : rr(val(F, f, k2)))).map((p, i) => (i ? 'L' : 'M') + p.join(',')).join('') + 'Z';
  el('path', { d: anneau('hi') + anneau('lo'), fill: F.c, 'fill-opacity': 0.16, 'fill-rule': 'evenodd', stroke: 'none', 'data-intervalle': F.nom }, svg);
  const ordre = DAT.HOPS.map((h, i) => i).sort((a, b) => (a === S.focus) - (b === S.focus));
  for (const i of ordre) {
    const h = DAT.HOPS[i], plein = i === S.focus;
    const vs = DAT.ROUE.map((f) => val(h, f, 'ap'));
    const g = el('g', { 'data-serie': h.nom, 'data-valeurs': vs.map((v) => (v == null ? 0 : +v.toFixed(3))).join(','), 'data-inconnues': DAT.ROUE.filter((f, k) => vs[k] == null).join(','), 'data-couleur': h.c }, svg);
    el('polygon', { points: vs.map((v, k) => P(k, v == null ? 0 : rr(v)).join(',')).join(' '), fill: plein ? h.c : 'none', 'fill-opacity': plein ? 0.22 : null, stroke: h.c, 'stroke-width': 3, 'stroke-linejoin': 'round' }, g);
    if (plein) vs.forEach((v, k) => { if (v == null) return; const q = P(k, rr(v)); el('circle', { cx: q[0], cy: q[1], r: 3, fill: '#fff', stroke: h.c, 'stroke-width': 2 }, g); });
  }
  DAT.ROUE.forEach((f, k) => {
    const q = P(k, R + 12), ta = Math.abs(q[0] - cx) < 8 ? 'middle' : q[0] > cx ? 'start' : 'end';
    const inc = tous(f), att = DAT.ATTENDUES.includes(f);
    const t = el('text', { x: q[0], y: q[1], 'text-anchor': ta, 'dominant-baseline': 'middle', class: (att ? 'att' : '') + (inc ? ' inc' : '') }, svg);
    t.textContent = DAT.COURT[f] + (inc ? '?' : ''); if (DAT.PLACE[f] <= 0) t.setAttribute('class', (t.getAttribute('class') || '') + ' hors');
    const u = el('use', { href: '#p-' + f, width: 13, height: 13 }, svg);
    if (ta === 'start') { u.setAttribute('x', q[0]); u.setAttribute('y', q[1] - 7); t.setAttribute('x', q[0] + 16); }
    else if (ta === 'end') { u.setAttribute('x', q[0] - 13); u.setAttribute('y', q[1] - 7); t.setAttribute('x', q[0] - 16); }
    else { u.setAttribute('x', q[0] - 6.5); u.setAttribute('y', q[1] < cy ? q[1] - 22 : q[1] + 9); }
  });
  svg.setAttribute('aria-label', 'Radar, ce que chacun ajoute à ta stout à ' + '10 IBU, ~ simulé, ' + (S.abs ? 'en points' : 'en crans de ta 16D') + ' ; plein : ' + F.nom + ', bande : α bas et haut de ses fiches ; pépins et melon inconnus, pas à zéro');
}
// ---------- les barres de l5b : famille par famille ----------
function barres() {
  const box = document.getElementById('barres'); box.replaceChildren();
  const MAX = S.abs ? 25 : 2;
  const connues = DAT.ROUE.filter((f) => DAT.HOPS.some((h) => h.ap[f] != null));
  const fort = (f) => Math.max(...DAT.HOPS.map((h) => h.ap[f] || 0) ) / DAT.CRAN[f];
  const ordre = [...Object.keys(DAT.DEM), ...connues.filter((f) => !DAT.DEM[f]).sort((a, b) => fort(b) - fort(a))];
  const pct = (v) => (Math.max(0, Math.min(v, MAX)) / MAX * 100).toFixed(1) + '%';
  for (const f of ordre) {
    const place = S.abs ? DAT.PLACE[f] : DAT.PLACE[f] / DAT.CRAN[f];
    const r = document.createElement('div'); r.className = 'br' + (place <= 0 ? ' hors' : ''); r.style.cssText = '--b:' + DAT.TON[f].b + ';--t:' + DAT.TON[f].t + ';--f:' + DAT.TON[f].f;
    const dem = DAT.DEM[f] ? '<svg class="ic" width="12" height="12" aria-label="ta demande : ' + (DAT.DEM[f] === 'haut' ? 'plus' : 'moins') + '"><use href="#i-' + DAT.DEM[f] + '-12"/></svg>' : '';
    let p = '<span class="br-p">' + (place > 0 ? '<i class="br-z" data-role="zone" style="width:' + pct(place) + '"></i>' : '') + '<i class="br-0"></i>';
    DAT.HOPS.forEach((h, i) => {
      const y = 3 + i * 7.5, v = val(h, f, 'ap');
      if (v == null) { p += '<i class="br-q" style="top:' + (y - 2) + 'px" aria-label="' + h.nom + ' : inconnu"></i>'; return; }
      p += '<i class="br-w" style="--hc:' + h.c + ';top:' + (y + 2) + 'px;left:' + pct(val(h, f, 'lo')) + ';width:calc(' + pct(val(h, f, 'hi')) + ' - ' + pct(val(h, f, 'lo')) + ')"></i>';
      p += '<i class="br-h' + (i === S.focus ? '' : ' pale') + '" style="--hc:' + h.c + ';top:' + y + 'px;width:' + pct(v) + '"></i>';
    });
    p += '</span>';
    const F = DAT.HOPS[S.focus], vf = val(F, f, 'ap');
    r.innerHTML = '<span class="br-n" data-famille="' + f + '"><svg class="pi" width="14" height="14" data-famille="' + f + '" role="img" aria-label="' + DAT.COURT[f] + '"><use href="#p-' + f + '"/></svg>' + DAT.COURT[f] + dem + '</span>' + p
      + '<span class="br-v" data-nature="simule">' + (vf == null ? '?' : '~+' + nb(vf, 1)) + '</span>' + (place <= 0 ? '<span class="br-x">déjà au-dessus de ta 16D</span>' : '');
    r.setAttribute('aria-label', DAT.COURT[f] + ' : ' + DAT.HOPS.map((h) => h.nom + ' ' + (h.ap[f] == null ? 'inconnu' : '~+' + nb(val(h, f, 'ap'), 2))).join(', ') + (S.abs ? ' points' : ' crans'));
    box.append(r);
  }
  const inc = DAT.ROUE.filter((f) => !connues.includes(f));
  if (inc.length) { const r = document.createElement('div'); r.className = 'br br-inc'; r.innerHTML = '<span class="br-n">' + inc.map((f) => '<svg class="pi" width="14" height="14" data-famille="' + f + '" role="img" aria-label="' + DAT.COURT[f] + '"><use href="#p-' + f + '"/></svg>').join('') + inc.map((f) => DAT.COURT[f]).join(', ') + '</span><span class="inc"><i class="hach"></i>inconnu pour les trois, pas zéro</span>'; box.append(r); }
}
function tout() {
  radar(); barres();
  document.querySelectorAll('.col').forEach((c, i) => { c.classList.toggle('on', i === S.focus); c.querySelector('.col-n').setAttribute('aria-pressed', String(i === S.focus)); });
  document.getElementById('pont-n').textContent = DAT.HOPS[S.focus].nom;
}
document.querySelectorAll('.col-n').forEach((b, i) => b.addEventListener('click', () => { S.focus = i; tout(); }));
document.querySelectorAll('.vue [data-v]').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('.vue [data-v]').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
  document.getElementById('vue-radar').hidden = b.dataset.v !== 'radar'; document.getElementById('vue-barres').hidden = b.dataset.v !== 'barres';
}));
if (q0.get('vue') === 'barres') document.querySelector('.vue [data-v="barres"]').click();
document.querySelectorAll('.lentille [data-e]').forEach((b) => b.addEventListener('click', () => { S.abs = b.dataset.e === 'absolu'; tout(); }));
document.querySelectorAll('.tc[aria-controls]').forEach((b) => b.addEventListener('click', () => {
  const on = b.getAttribute('aria-expanded') !== 'true';
  document.querySelectorAll('.tc[aria-controls]').forEach((x) => { x.setAttribute('aria-expanded', String(x === b && on)); document.getElementById(x.getAttribute('aria-controls')).hidden = !(x === b && on); });
}));
document.getElementById('pont').addEventListener('click', (e) => e.preventDefault());
const q = new URLSearchParams(location.search);
if (q.get('focus')) S.focus = Math.max(0, DAT.HOPS.findIndex((h) => h.nom === q.get('focus')));
tout();
if (q.get('ouvre')) document.querySelector('.tc[aria-controls="sec-' + q.get('ouvre') + '"]').click();
})();
${JS_FICHE_B}
`;

const rt = runtime({ extra: '' })
  .replace(/const FD = [^\n]*;\nconst ROUE/, () => 'const FD = ' + JSON.stringify(FD) + ';\nconst ROUE')
  .replace(/DEMANDE = \[[^\]]*\]/, () => 'DEMANDE = ' + JSON.stringify([{ f: 'floral', s: 1 }, { f: 'resin', s: -1 }]))
  .replace("F.sans.length ? h('p', { class: 'f-lab-sans', title: F.sans.join(', ') }, 'sans famille : ' + coupe(F.sans, MAXM)) : null", 'blocAutres(F)');
if (!rt.includes('blocAutres(F)')) throw new Error('runtime : la ligne « sans famille » n’a pas été remplacée');

const SIM = { B: {}, C: {}, NOM, AV: {} };
const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>r6f · ${titre}</title>
<!-- Lot 22, r6f : Comparer à IBU égal (10 IBU à 10′). Généré par r6f/generer.mjs depuis donnees/comparer-stout.json. -->
${POLICES}
<style>${CSS}</style>
</head>
<body>
${SYMB}
<main class="ecran">${corps}
</main>
${legende}
<div class="w-voile" data-role="feuille-voile" hidden></div><div class="w-feuille" role="dialog" aria-label="Preuve"></div>
<script>const SIM = ${JSON.stringify(SIM)};
${JS_COMMUN}
${JS}</script>
<script>${rt}</script>
</body>
</html>
`;
fs.writeFileSync(path.join(ICI, 'etat.html'), html);
console.log('écrit r6f/etat.html (' + Math.round(html.length / 1024) + ' Ko)');
for (const x of HOPS) console.log(x.nom, fr(x.grammes, 0) + ' g', fr(x.dose, 2) + ' g/L', 'huile ' + plage(x.huile[0], x.huile[1]) + ' mL/hL', 'α', x.lot, x.hors ? '≠' : '', Object.entries(x.ap).filter(([, v]) => v != null && v > 1).map(([f, v]) => f + ' ' + fr(v)).join(' '));
