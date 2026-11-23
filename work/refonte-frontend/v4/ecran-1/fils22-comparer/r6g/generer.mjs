// Lot 22 · r6g · « Trois verres à même amertume ».
// Question du brasseur : « Lequel pour ma stout : Cascade, Idaho 7 ou Galaxy ? » (lot 21 : « pas de comparaison de
// houbon 1:1 donc ça nous aide pas à choisir »). Base de comparaison : IBU égal. Chaque houblon entre à la dose qui
// donne 10 IBU à 10′ dans la même stout (20 L) : trois verres de même amertume, trois poignées de houblon différentes
// (Cascade 41,6 g, Idaho 7 21,8 g, Galaxy 16,2 g), et ce que chacune y met, en radar r3 sous chaque verre.
// Un seul facteur libre : la variété (mettre un houblon en avant). Tout le reste est fixé sur la ligne de contexte.
// Données : fils22-comparer/donnees/comparer-stout.json, seules. La page fait trois opérations, et les dit :
//   1. une interpolation linéaire du gain simulé entre les doses de la grille (0, 1, 2 g/L au moment b10, US-05) ;
//   2. une mise à l'échelle : gain / cran du style (au style) ou en points de l'échelle 0–100 (absolu) ;
//   3. un produit : dose × huile totale (fiches) = huile apportée dans le verre, en mL/hL (plage).
// Langage visuel : socle de la baseline l8g par fils21-choisir/v1/socle.mjs (pictos au trait, fiche g1 à l'appui
// long, légende derrière « ? », lentille au style / absolu, α du lot puis des fiches, usage en mot, stock en icône).
// Usage : node work/refonte-frontend/v4/ecran-1/fils22-comparer/r6g/generer.mjs  →  r6g/etat.html
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as S from '../../fils21-choisir/v1/socle.mjs';

const { HOPS, COURT, JET, fr, esc, ic, pic, hn, alpha, usage, stock, conf, M, INC, page, ecrire, legende, li, LEG_FAMILLES, LEG_CONF, LEG_HOUBLON, lentille, srcNom } = S;
const ICI = path.dirname(fileURLToPath(import.meta.url));
const D = JSON.parse(fs.readFileSync(path.join(ICI, '../donnees/comparer-stout.json'), 'utf8'));

// ---------- la base : IBU égal, 10 IBU à 10′ ----------
const IBU = D.egalites.ibuEgal.find((e) => e.moment === 'b10');
const VOL = D.biere.recette.volumeL;
const NOMS = ['Cascade', 'Idaho 7', 'Galaxy'];
const ROUE = D.style.ordre;
const AV = D.biere.avant;
const ECH = D.echelle.parFamille;
const H = Object.fromEntries(D.houblons.map((h) => [h.nom, h]));
for (const n of NOMS) if (!H[n] || IBU.doses[n] == null) throw new Error('donnée absente : ' + n);

// ---------- 1. interpolation du gain simulé (b10, US-05) ----------
// Le gain d'une famille = valeur après − valeur de ma stout avant, au centre (convention du moteur) et au bas.
// Points : (0 g/L, gain 0), puis la grille à 1, 2, 4, 8 g/L ; entre deux points, une droite.
const interp = (pts, x) => { for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) { const [a, ga] = pts[i - 1], [b, gb] = pts[i]; return ga + ((x - a) / (b - a)) * (gb - ga); } throw new Error('dose hors grille : ' + x); };
function gains(nom) {
  const g = H[nom].grille.filter((x) => x.moment === 'b10' && x.levure === 'fermentis-us05').sort((a, b) => a.dose_gL - b.dose_gL);
  const dose = IBU.doses[nom];
  const out = {};
  for (const f of ROUE) {
    const c = [[0, 0], ...g.map((x) => [x.dose_gL, x.apres[f][1] - AV[f].centre])];
    const b = [[0, 0], ...g.map((x) => [x.dose_gL, x.apres[f][0] - AV[f].bas])];
    out[f] = { c: interp(c, dose), b: Math.max(0, interp(b, dose)), jamais: g.every((x) => x.apres[f][1] - AV[f].centre === 0) };
  }
  return { dose, g: out, conf: [...new Set(g.map((x) => x.confiance))], drapeaux: [...new Set(g.flatMap((x) => x.drapeaux))] };
}
const G = Object.fromEntries(NOMS.map((n) => [n, gains(n)]));
// Une famille qu'aucun des trois ne touche, et que ma stout ne situe pas : inconnue (hachurée), jamais 0.
const INCONNUES = ROUE.filter((f) => AV[f].inconnu && NOMS.every((n) => G[n].g[f].jamais));
const CONNUES = ROUE.filter((f) => !INCONNUES.includes(f));
const HORS = ROUE.filter((f) => AV[f].crans === 4); // déjà au-delà du style dans ma stout (dégustation)
const ATTENDUES = ROUE.filter((f) => D.style.zone[f].statut === 'attendue');

// ---------- 2. mise à l'échelle : crans du style (au style) ou points 0–100 (absolu) ----------
const cr = (f, x) => x / ECH[f].cran;
const VAL = (nom, lens, cle = 'c') => CONNUES.map((f) => { const x = G[nom].g[f][cle]; return Math.round((lens === 'style' ? cr(f, x) : x) * 1000) / 1000; });
const MAX = { style: 1, absolu: 10 }; // le cercle extérieur : 1 cran du style, ou 10 points
for (const n of NOMS) for (const lens of ['style', 'absolu']) if (Math.max(...VAL(n, lens)) > MAX[lens]) throw new Error('gain au-delà du cercle : ' + n);
// Ce que la 16D laisse de place (au style) : (haut de la bande − ma stout) en crans.
const PLACE = Object.fromEntries(ROUE.map((f) => [f, (D.style.zone[f].bande[1] - AV[f].centre) / ECH[f].cran]));

// ---------- la règle du classement (écrite dans la légende) ----------
// Ta stout : « trop résineuses, je la veux plus floral » ; la 16D attend floral, herbacé, terreux.
// Score = gain des familles attendues − gain des familles déjà hors du style, en crans, au centre (~).
const SCORE = Object.fromEntries(NOMS.map((n) => [n, ATTENDUES.reduce((s, f) => s + cr(f, G[n].g[f].c), 0) - HORS.reduce((s, f) => s + cr(f, G[n].g[f].c), 0)]));
const RANG = [...NOMS].sort((a, b) => SCORE[b] - SCORE[a]);
const EGAL = 0.1; // sous 0,1 cran d'écart, deux houblons sont « ≈ » (bien sous le seuil d'écart du style, ¾ de cran)
const reponse = RANG.map((n, i) => (i === 0 ? '' : SCORE[RANG[i - 1]] - SCORE[n] < EGAL ? ' ≈ ' : ', puis ') + n).join('');
const floralC = NOMS.map((n) => cr('floral', G[n].g.floral.c));
const memeFloral = Math.max(...floralC) - Math.min(...floralC) < EGAL;
const plusResine = [...NOMS].sort((a, b) => G[b].g.resin.c - G[a].g.resin.c)[0];
const maxPart = Math.max(...NOMS.flatMap((n) => CONNUES.map((f) => cr(f, G[n].g[f].c))));

// ---------- le radar r3 : un petit radar par verre ----------
const W = 122, C = W / 2, R = 43, PAS = (2 * Math.PI) / ROUE.length;
const P = (k, r) => [C + Math.sin(k * PAS) * r, C - Math.cos(k * PAS) * r];
const r2 = (x) => Math.round(x * 10) / 10;
const pointsDe = (vals, max) => vals.map((v, i) => P(ROUE.indexOf(CONNUES[i]), R * Math.min(v, max) / max).map(r2).join(',')).join(' ');
const secteur = (k, r) => { const a = P(k - 0.5, r), b = P(k + 0.5, r); return `M${C},${C}L${a.map(r2).join(',')}A${r},${r} 0 0 1 ${b.map(r2).join(',')}Z`; };
function radar(nom, i) {
  const c = HOPS[nom].couleur;
  let s = `<svg class="radar" viewBox="0 0 ${W} ${W}" width="${W}" height="${W}" data-radar data-objet="houblon" data-axes="${CONNUES.join(',')}" role="img" aria-label="Ce que ${esc(nom)} met dans ta stout à 10 IBU, simulé : ${CONNUES.map((f) => COURT[f].toLowerCase() + ' ~' + fr(cr(f, G[nom].g[f].c), 2) + ' cran').join(', ')} ; ${INCONNUES.map((f) => COURT[f].toLowerCase()).join(' et ')} inconnus">`;
  // La place que la 16D laisse dans ma stout (au style) ; le résineux, déjà au-delà, en orangé hachuré.
  s += `<g class="zone" data-role="zone" data-serie="zone">` + ROUE.map((f, k) => (INCONNUES.includes(f) ? '' : HORS.includes(f)
    ? `<path d="${secteur(k, R)}" fill="url(#r6g-hors)" stroke="none" data-hors="${f}"/>`
    : `<path d="${secteur(k, R * Math.min(1, Math.max(0, PLACE[f])))}" fill="#f1efe9" stroke="none"/>`)).join('') + `</g>`;
  s += ROUE.map((f, k) => (INCONNUES.includes(f) ? `<path class="inc-s" d="${secteur(k, R)}" fill="url(#r6g-inc)" stroke="none" data-inconnu="${f}"/>` : '')).join('');
  s += `<circle cx="${C}" cy="${C}" r="${R / 2}" fill="none" stroke="#d6d6dd" stroke-width="1"/><circle cx="${C}" cy="${C}" r="${R}" fill="none" stroke="#b9b9c3" stroke-width="1"/>`;
  s += ROUE.map((f, k) => { const [x, y] = P(k, R).map(r2); return `<line x1="${C}" y1="${C}" x2="${x}" y2="${y}" stroke="${ATTENDUES.includes(f) ? '#9a9aa6' : '#dcdce3'}" stroke-width="1"/>`; }).join('');
  s += `<g data-serie="${esc(nom)}" data-valeurs="${VAL(nom, 'style').join(',')}" data-nature="simule"><polygon class="bord" points="${pointsDe(VAL(nom, 'style'), 1)}" fill="${c}" fill-opacity=".22" stroke="${c}" stroke-width="2" stroke-linejoin="round"/>`
    + `<polygon class="noyau" data-noyau="${esc(nom)}" data-valeurs="${VAL(nom, 'style', 'b').join(',')}" points="${pointsDe(VAL(nom, 'style', 'b'), 1)}" fill="${c}" fill-opacity=".55" stroke="none"/></g>`;
  s += ROUE.map((f, k) => { const [x, y] = P(k, R + 9.5); return `<svg x="${r2(x - 6)}" y="${r2(y - 6)}" width="12" height="12" class="pi${INCONNUES.includes(f) ? ' pi-inc' : ''}" data-famille="${f}" role="img" aria-label="${COURT[f]}${INCONNUES.includes(f) ? ', inconnu' : ''}"><use href="#p-${f}"/></svg>`; }).join('');
  return s + `</svg>`;
}

// ---------- le verre : même amertume ; à côté, la poignée de houblon (en grammes) ----------
const MASSE = Object.fromEntries(NOMS.map((n) => [n, IBU.doses[n] * VOL]));
const MMAX = Math.max(...Object.values(MASSE));
function verre(nom, i) {
  const top = CONNUES.filter((f) => !HORS.includes(f)).sort((a, b) => cr(b, G[nom].g[b].c) - cr(a, G[nom].g[a].c)).slice(0, 3);
  const h = Math.round((MASSE[nom] / MMAX) * 58);
  return `<div class="bouquet" aria-label="Ce qu'il met le plus, au style : ${top.map((f) => COURT[f].toLowerCase()).join(', ')}">${top.map((f) => pic(f, 16)).join('')}</div>
    <div class="verre"><svg width="40" height="62" viewBox="0 0 40 62" aria-hidden="true"><defs><clipPath id="r6g-v${i}"><path d="M6,3H34L32,20Q35,24 33,28L30,57Q30,59 28,59H12Q10,59 10,57L7,28Q5,24 8,20Z"/></clipPath></defs>
      <g clip-path="url(#r6g-v${i})"><rect x="0" y="0" width="40" height="62" fill="#2b1b12"/><rect x="0" y="0" width="40" height="11" fill="#e6d6b8"/></g>
      <path d="M6,3H34L32,20Q35,24 33,28L30,57Q30,59 28,59H12Q10,59 10,57L7,28Q5,24 8,20Z" fill="none" stroke="#16161a" stroke-width="1.5" stroke-linejoin="round"/></svg>
      <i class="poignee" style="--hc:${HOPS[nom].couleur};height:${h}px" aria-hidden="true"></i></div>
    <span class="masse" data-nature="calcule" aria-label="${fr(MASSE[nom], 1)} g de ${esc(nom)} pour 20 L, calculé">${fr(MASSE[nom], 1)} g</span>`;
}
const f1 = (x) => (Math.abs(x) < 0.05 ? '≈0' : (x > 0 ? '+' : '−') + String(Math.round(Math.abs(x) * 10) / 10).replace('.', ','));
const vd = (nom, f) => `<span class="vd${HORS.includes(f) ? ' hst' : ''}" data-f="${f}">${pic(f, 14)}<span class="vs" data-nature="simule" data-vd="${esc(nom)}|${f}">~${f1(cr(f, G[nom].g[f].c))}</span></span>`;

function colonne(nom, i) {
  const enAvant = nom === RANG[0];
  return `<article class="col${enAvant ? ' avant' : ''}" style="--hc:${HOPS[nom].couleur}" data-col="${esc(nom)}">
    <button type="button" class="hd" aria-pressed="${enAvant}" aria-label="Mettre ${esc(nom)} en avant">
      <span class="hd-n"><i class="hpt plein" style="--hc:${HOPS[nom].couleur}" aria-hidden="true"></i>${hn(nom)}${stock(nom)}</span>
      <span class="hd-a">${alpha(nom, { plage: false })}${usage(nom)}</span>
    </button>
    ${verre(nom, i)}
    ${radar(nom, i)}
    <div class="vds">${vd(nom, 'floral')}${vd(nom, 'resin')}</div>
  </article>`;
}

// ---------- les acquis à un toucher : vraies valeurs, chimie, panel OSU ----------
const plage = (a, b, u = '') => (fr(a) === fr(b) ? fr(a) : fr(a) + '–' + fr(b)) + u;
const union = (vs) => { const v = vs.filter((x) => x.plage && x.plage.some((y) => y != null)); if (!v.length) return null; const lo = v.map((x) => x.plage[0]).filter((y) => y != null), hi = v.map((x) => x.plage[1]).filter((y) => y != null); return { lo: lo.length ? Math.min(...lo) : null, hi: hi.length ? Math.max(...hi) : null, src: [...new Set(v.flatMap((x) => x.sources))] }; };
const SRC_HUILE = (n) => H[n].huiles.totale.sources;
const huileU = (n) => ({ lo: Math.min(...SRC_HUILE(n).map((s) => s.min)), hi: Math.max(...SRC_HUILE(n).map((s) => s.max)) });
const ibuG = (n) => H[n].ibuParGramme.moments.find((m) => m.code === 'b10').ibuPerGram.value;
const U = (u) => `<span class="u"> ${u}</span>`;
const cel = (n, contenu) => `<span class="r6c" style="--hc:${HOPS[n].couleur}">${contenu}</span>`;
const ligne = (titre, cellules, cls = '') => `<div class="ro ${cls}"><span class="ro-t">${titre}</span><div class="ro-v">${cellules}</div></div>`;
const valeurs = `<section class="tiroir" id="r6g-valeurs" data-acquis="valeurs" hidden aria-label="Vraies valeurs">
  ${ligne('α du lot', NOMS.map((n) => cel(n, M(fr(H[n].alpha.retenu.value, 1) + ' %', H[n].alpha.retenu.from) + `<small>${esc(H[n].alpha.retenu.from)}</small>`)).join(''))}
  ${ligne('α des fiches', NOMS.map((n) => cel(n, H[n].alpha.sources.map((s) => M(plage(s.min, s.max, ' %'), s.source + ' ' + s.annee) + `<small>${esc(s.source)} ${s.annee}</small>`).join(''))).join(''))}
  ${ligne('huile totale, mL/100 g', NOMS.map((n) => cel(n, SRC_HUILE(n).map((s) => M(plage(s.min, s.max, U('mL/100 g')), s.source + ' ' + s.annee) + `<small>${esc(s.source)} ${s.annee}</small>`).join(''))).join(''))}
  ${ligne('IBU par gramme à 10′, 20 L', NOMS.map((n) => cel(n, `<span class="vc" data-nature="calcule">${fr(ibuG(n), 2)}${U('IBU/g')}</span><small>moteur v4</small>`)).join(''), 'calc')}
  ${ligne('dose pour 10 IBU', NOMS.map((n) => cel(n, `<span class="vc" data-nature="calcule">${fr(IBU.doses[n], 2)}${U('g/L')}</span><small>${fr(MASSE[n], 1)} g pour 20 L</small>`)).join(''), 'calc')}
  ${ligne('huile dans ton verre, mL/hL', NOMS.map((n) => { const u = huileU(n), d = IBU.doses[n]; return cel(n, `<span class="vc" data-nature="calcule">${plage(d * u.lo, d * u.hi)}${U('mL/hL')}</span><small>dose × huile</small>`); }).join(''), 'calc')}
  <p class="src-l">Mesuré : fiche de stock, Beer Maverick 2023, Hopsteiner 2025. Calculé : moteur v4 (IBU à 10′, DI 1,066) et dose × huile des fiches.</p>
</section>`;

const LIENS = { linalol: ['floral', 'citrus'], geraniol: ['floral'], myrcene: ['resin', 'green'], humulene: ['resin', 'spice'], caryophyllene: ['spice', 'resin'], farnesene: ['green', 'herbal'], '4MMP': ['tropical', 'berries'] };
const NOM_C = { linalol: 'linalol', geraniol: 'géraniol', myrcene: 'myrcène', humulene: 'humulène', caryophyllene: 'caryophyllène', farnesene: 'farnésène', '4MMP': '4MMP' };
const UNITE_C = (k) => (k === '4MMP' ? 'µg/kg de houblon' : '% de l’huile');
// Le nom court d'une source : l'éditeur et l'année, sans l'abréviation coupée (« John I. Haas » → « Haas »).
const COURTS = [[/^Yakima Chief/, 'YCH'], [/Haas/, 'Haas'], [/^Hop Products Australia/, 'HPA'], [/^Beer Maverick/, 'Beer Maverick'], [/^Hopsteiner/, 'Hopsteiner'], [/^Castle Malting/, 'Castle Malting'], [/^Schmidt/, 'Schmidt'], [/^H §(\d+(\.\d+)?)/, 'H §$1']];
const court = (k) => { const s = S.SRC[k]; if (!s) return k; const t = s.titre || k; for (const [re, nom] of COURTS) if (re.test(t)) return t.replace(/^.*$/, (x) => x.match(re)[0].replace(re, nom)) + (s.annee ? ' ' + s.annee : ''); return srcNom(k); };
const valC = (n, k) => {
  const c = H[n].composes.composes[k];
  const u = c ? union((c.valeurs || []).filter((v) => v.portee !== 'littérature')) : null;
  if (!u) return INC('aucune plage chiffrée dans les sources lues', 'H');
  const txt = u.lo == null ? '≤' + fr(u.hi) : u.hi == null ? '≥' + fr(u.lo) : plage(u.lo, u.hi);
  const noms = [...new Set(u.src.map(court))];
  return M(txt + (k === '4MMP' ? U('µg/kg') : ' %'), u.src, '', ` title="${esc(u.src.map(srcNom).join(' ; '))}"`) + `<small>${esc(noms.slice(0, 2).join(', ') + (noms.length > 2 ? ' +' + (noms.length - 2) : ''))}</small>`;
};
const chimie = `<section class="tiroir" id="r6g-chimie" data-acquis="chimie" hidden aria-label="Chimie">
  ${Object.keys(LIENS).map((k) => `<div class="ro" data-compose="${k}"><span class="ro-t">${LIENS[k].map((f) => pic(f, 14)).join('')}<b>${NOM_C[k]}</b><small>${UNITE_C(k)}</small></span><div class="ro-v">${NOMS.map((n) => cel(n, valC(n, k))).join('')}</div></div>`).join('')}
  <p class="src-l">Teneurs du cône (fiches et analyses), pas dans ta bière. Le picto : la famille où le composé pèse (liens de composes-houblon.json, sens seulement).</p>
</section>`;

// Le panel OSU : Cascade en dry hop, 24 h (mesuré). Ta dose de 10 IBU, posée sur son axe : à cru, pas à 10′.
const O = D.panelOSU;
const PW = 340, PH = 132, px = (g) => 30 + (g / 16) * (PW - 62), py = (v) => 10 + (1 - v / 15) * (PH - 34);
const courbe = (k, coul, nom) => `<polyline points="${O.doses.map((g, j) => r2(px(g)) + ',' + r2(py(O[k][j]))).join(' ')}" fill="none" stroke="${coul}" stroke-width="2" stroke-linejoin="round"/>` + O.doses.map((g, j) => `<circle cx="${r2(px(g))}" cy="${r2(py(O[k][j]))}" r="2.8" fill="#fff" stroke="${coul}" stroke-width="1.6"><title>${nom} ${fr(O[k][j])} sur 15 à ${fr(g)} g/L</title></circle>`).join('') + `<text x="${PW - 2}" y="${r2(py(O[k][O.doses.length - 1]) + 4)}" text-anchor="end" font-size="12" fill="${coul}">${fr(O[k][O.doses.length - 1])}</text>`;
const dC = IBU.doses.Cascade;
const osu = `<section class="tiroir" id="r6g-osu" data-acquis="osu" data-nature="mesure" data-source="${O.sources.join(' ')}" hidden aria-label="Panel OSU">
  <p class="osu-t"><span><b>Panel OSU</b>, Cascade à cru (24 h), note sur 15</span><span class="leg-c"><i style="background:${JET.citrus.texte}"></i>agrumes</span><span class="leg-c"><i style="background:${JET.herbal.texte}"></i>herbacé, thé</span><span class="leg-c"><i style="background:#16161a"></i>intensité</span></p>
  <svg class="osu" viewBox="0 0 ${PW} ${PH}" width="100%" role="img" aria-label="Panel OSU, Cascade à cru : agrumes ${O.agrumes.map((v) => fr(v)).join(', ')} sur 15 aux doses ${O.doses.map((g) => fr(g)).join(', ')} g/L">
    <rect x="${r2(px(O.zone[0]))}" y="6" width="${r2(px(O.zone[1]) - px(O.zone[0]))}" height="${PH - 30}" fill="#eef3ea"/>
    ${[0, 5, 10, 15].map((v) => `<line x1="30" x2="${PW - 14}" y1="${r2(py(v))}" y2="${r2(py(v))}" stroke="#e3e3e9"/><text x="24" y="${r2(py(v) + 4)}" text-anchor="end" font-size="12" fill="#5b5b66">${v}</text>`).join('')}
    ${O.doses.map((g) => `<text x="${r2(px(g))}" y="${PH - 4}" text-anchor="middle" font-size="12" fill="#5b5b66">${fr(g)}</text>`).join('')}
    <line x1="${r2(px(dC))}" x2="${r2(px(dC))}" y1="6" y2="${PH - 24}" stroke="${HOPS.Cascade.couleur}" stroke-width="2"/>
    ${courbe('intensite', '#16161a', 'intensité')}${courbe('agrumes', JET.citrus.texte, 'agrumes')}${courbe('herbaceThe', JET.herbal.texte, 'herbacé, thé')}
  </svg>
  <p class="src-l"><span class="trait-c" style="--hc:${HOPS.Cascade.couleur}"></span>${fr(dC, 2)} g/L : tes ${fr(MASSE.Cascade, 1)} g de 10 IBU, s'ils allaient à cru. Vert pâle : 4–8 g/L, retenu par les auteurs. Idaho 7 et Galaxy : pas de panel OSU. Source : Lafontaine et Shellhammer 2018 (${O.sources.join(', ')}).</p>
</section>`;

// ---------- la page ----------
const titre = 'Lequel pour ma stout ?';
const corps = `
<header class="tete"><a class="retour" href="#" aria-label="Retour">${ic('chev-l', 20)}</a><h1>${titre}</h1>${lentille()}<button class="leg-b" data-role="legende-bouton" aria-expanded="false" aria-controls="legende" aria-label="Légende">${ic('aide', 18)}<i class="doigt" aria-hidden="true"></i></button></header>
<p class="ctx" data-role="contexte"><span data-contexte="base">même amertume, ${IBU.ibu} IBU</span><span data-contexte="moment">à 10′</span><span data-contexte="biere">stout 16D, ${VOL} L</span><span data-contexte="levure">US-05</span></p>
<div class="r6-rep"><p><b data-role="reponse">${esc(reponse)}</b>${conf('simule')}</p><p class="r6-pq">${maxPart < 1 ? 'tous sous 1 cran ; ' : ''}${memeFloral ? 'même floral' : 'floral inégal'} ; ${esc(plusResine)}, le plus de résineux</p></div>
<div class="verres" data-libre="houblon" data-acquis="radar" role="group" aria-label="Houblon à mettre en avant">${NOMS.map(colonne).join('')}</div>
<div class="onglets" role="group" aria-label="Détail">
  <button type="button" class="ong" aria-expanded="false" aria-controls="r6g-valeurs">${ic('flacon', 14)}Vraies valeurs</button>
  <button type="button" class="ong" aria-expanded="false" aria-controls="r6g-chimie">${ic('fiole', 14)}Chimie</button>
  <button type="button" class="ong" aria-expanded="false" aria-controls="r6g-osu">${ic('panel', 14)}Panel OSU</button>
</div>
${valeurs}${chimie}${osu}
<nav class="pont" aria-label="Suite"><a href="#" data-pont>${ic('vent', 16)}<span>Plus de floral : <b data-pont-nom>${esc(RANG[0])}</b> à cru, dans Dryhopper</span>${ic('chev-r', 16)}</a></nav>
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <pattern id="r6g-inc" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="#fff"/><line x1="0" y1="0" x2="0" y2="5" stroke="#b8bec8" stroke-width="1.6"/></pattern>
  <pattern id="r6g-hors" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="#fff"/><line x1="0" y1="0" x2="0" y2="5" stroke="#f3b99a" stroke-width="2"/></pattern>
</defs></svg>
${legende([
  ['Trois verres', [li('<i class="r6-lv"></i>', 'même stout, même amertume : chaque houblon à la dose de 10 IBU à 10′'), li('<i class="poignee r6-lp"></i>', 'la poignée : ses grammes pour 20 L (moins d’α, plus de houblon)'), li(pic('floral', 14) + pic('resin', 14), 'sous le verre : ce qu’il ajoute en floral (ton envie) et en résineux (déjà trop)')]],
  ['Le radar', [li('<i class="r6-lr b"></i>', 'bord : le gain simulé ~ (centre du moteur), interpolé entre 0, 1 et 2 g/L'), li('<i class="r6-lr n"></i>', 'noyau : le bas du moteur ; entre les deux, l’incertitude'), li('<i class="r6-lr z"></i>', 'pâle : la place que la 16D laisse ; cercle : 1 cran du style (10 points en absolu)'), li('<i class="r6-lr h"></i>', 'orangé : résineux, déjà hors du style dans ta stout'), li('<i class="r6-lr i"></i>', 'hachuré : inconnu, pas zéro')], true],
  ['Le classement', [li(conf('simule'), 'floral, herbacé, terreux gagnés (la 16D les attend) moins le résineux gagné, en crans ; écart sous 0,1 cran : ≈')]],
  LEG_CONF, LEG_HOUBLON, LEG_FAMILLES,
])}`;

const css = `
  .ecran { padding: 4px 8px 40px; gap: 8px; }
  .tete { display: flex; align-items: center; gap: 6px; min-height: 40px; }
  .tete h1 { flex: 1; font: 700 17px/1.15 var(--sans); }
  .tete .lentille button { height: 28px; padding: 0 9px; font-size: 13px; }
  .ctx { display: flex; flex-wrap: wrap; gap: 4px; }
  .ctx [data-contexte] { display: inline-flex; align-items: center; height: 22px; padding: 0 8px; border-radius: 11px; background: #fff; box-shadow: inset 0 0 0 1px var(--trait); font: 500 12px var(--sans); color: var(--encre); }
  .r6-rep { display: flex; flex-direction: column; gap: 2px; padding: 0 2px; }
  .r6-rep p:first-child { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 15px; line-height: 1.25; }
  .r6-rep b { font-weight: 700; }
  .r6-pq { font-size: 13px; line-height: 1.3; color: var(--gris); }
  .verres { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; }
  .col { display: flex; flex-direction: column; align-items: center; gap: 4px; min-width: 0; padding: 6px 0 8px; border-radius: 8px; background: #fff; box-shadow: inset 0 0 0 1px var(--trait); }
  .col.avant { box-shadow: inset 0 0 0 2px var(--encre); }
  .verres.choix .col:not(.avant) .radar g[data-serie]:not([data-serie="zone"]) { opacity: .45; }
  .hd { display: flex; flex-direction: column; align-items: center; gap: 2px; width: 100%; padding: 0 4px; min-height: 40px; border-radius: 8px; }
  .hd-n { display: inline-flex; align-items: center; gap: 4px; font-size: 15px; white-space: nowrap; }
  .hd-a { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; }
  .hd-a .al { font: 600 13px var(--mono); }
  .hd-a .us-m { font-size: 12px; }
  .bouquet { display: flex; gap: 3px; height: 16px; }
  .verre { display: flex; align-items: flex-end; gap: 6px; height: 62px; }
  .poignee { display: block; width: 9px; border-radius: 2px; background: var(--hc); }
  .masse { font: 600 14px var(--mono); }
  .radar { display: block; width: 100%; height: auto; overflow: visible; }
  .radar .echelle { fill: #5b5b66; font-family: var(--sans); }
  body.abs .radar .zone { display: none; }
  .pi-inc { opacity: .55; }
  .vds { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; }
  .vd { display: inline-flex; align-items: center; gap: 3px; font: 500 13px var(--mono); color: var(--encre); }
  .vd.hst .vs { color: var(--acc); font-weight: 600; }
  .onglets { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; }
  .ong { display: inline-flex; align-items: center; justify-content: center; gap: 4px; height: 32px; border-radius: 16px; background: #ececf1; font-size: 13px; font-weight: 600; color: var(--encre); }
  .ong[aria-expanded="true"] { background: var(--encre); color: #fff; }
  .ong[aria-expanded="true"] .ic { color: #fff; }
  .tiroir[hidden] { display: none; }
  .tiroir { display: flex; flex-direction: column; gap: 0; background: #fff; border-radius: 8px; box-shadow: inset 0 0 0 1px var(--trait); padding: 4px 8px 8px; }
  .tiroir .ro { display: flex; flex-direction: column; gap: 2px; padding: 5px 0; border-top: 1px solid var(--trait); }
  .tiroir .ro:first-child { border-top: 0; }
  .ro-t { display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--gris); }
  .ro-t b { color: var(--encre); font-weight: 600; font-size: 13px; }
  .ro-v { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; }
  .ro-v .r6c { display: flex; flex-direction: column; gap: 1px; padding-left: 6px; box-shadow: inset 2px 0 0 var(--hc); font-size: 13px; background: none; }
  .ro-v .r6c small { font-size: 12px; color: var(--gris); }
  .ro-v .vm, .ro-v .vc { font: 600 13px var(--mono); }
  .ro.calc .vc::before { content: "≈ "; color: var(--gris); font-weight: 400; }
  .ro-v .inc { align-self: flex-start; }
  .src-l { font-size: 12px; color: var(--gris); line-height: 1.3; padding-top: 6px; }
  .osu-t { font-size: 13px; display: flex; flex-wrap: wrap; align-items: center; gap: 2px 8px; padding: 4px 0; }
  .leg-c { display: inline-flex; align-items: center; gap: 3px; font-size: 12px; }
  .leg-c i { width: 10px; height: 3px; border-radius: 2px; display: inline-block; }
  .osu { display: block; font-family: var(--sans); }
  .trait-c { display: inline-block; width: 3px; height: 12px; margin-right: 4px; vertical-align: -1px; background: var(--hc); border-radius: 2px; }
  .pont a { display: flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 12px; border-radius: 8px; background: #fff; box-shadow: inset 0 0 0 1px var(--trait); color: var(--encre); text-decoration: none; font-size: 14px; }
  .pont a span { flex: 1; }
  .legende .leg-s:nth-child(-n+4) .leg-g { grid-template-columns: 1fr; }
  .u { font: 400 12px var(--sans); color: var(--gris); }
  .r6-lv { display: inline-block; flex: none; width: 14px; height: 20px; border-radius: 2px; background: linear-gradient(#e6d6b8 0 5px, #2b1b12 5px); box-shadow: inset 0 0 0 1px #16161a; display: inline-block; flex: none; }
  .r6-lp { height: 18px; --hc: #781838; flex: none; }
  .r6-lr { width: 20px; height: 14px; display: inline-block; flex: none; border-radius: 2px; }
  .r6-lr.b { background: rgba(120,24,56,.22); box-shadow: inset 0 0 0 2px #781838; }
  .r6-lr.n { background: rgba(120,24,56,.55); }
  .r6-lr.z { background: #f1efe9; box-shadow: inset 0 0 0 1px #b9b9c3; }
  .r6-lr.h { background: repeating-linear-gradient(135deg, #fff 0 3px, #f3b99a 3px 5px); }
  .r6-lr.i { background: repeating-linear-gradient(135deg, #fff 0 3px, #b8bec8 3px 5px); }`;

// Le script : lentille (crans ou points), mise en avant (le facteur libre), tiroirs à un toucher.
const DONNEES = { connues: CONNUES, roue: ROUE, W, C, R, max: MAX, noms: NOMS,
  val: Object.fromEntries(NOMS.map((n) => [n, { style: VAL(n, 'style'), absolu: VAL(n, 'absolu'), bstyle: VAL(n, 'style', 'b'), babsolu: VAL(n, 'absolu', 'b') }])),
  vd: Object.fromEntries(NOMS.map((n) => [n, Object.fromEntries(['floral', 'resin'].map((f) => [f, { style: cr(f, G[n].g[f].c), absolu: G[n].g[f].c }]))])) };
const js = `
const RD = ${JSON.stringify(DONNEES)};
const r2 = (x) => Math.round(x * 10) / 10;
const PT = (k, r) => [RD.C + Math.sin(k * 2 * Math.PI / RD.roue.length) * r, RD.C - Math.cos(k * 2 * Math.PI / RD.roue.length) * r];
const pts = (vals, max) => vals.map((v, i) => PT(RD.roue.indexOf(RD.connues[i]), RD.R * Math.min(v, max) / max).map(r2).join(',')).join(' ');
const f1 = ${f1.toString()};
function lecture() {
  const lens = document.body.classList.contains('abs') ? 'absolu' : 'style';
  for (const n of RD.noms) {
    const col = document.querySelector('[data-col="' + n + '"]');
    const g = col.querySelector('g[data-serie]:not([data-serie="zone"])');
    g.setAttribute('data-valeurs', RD.val[n][lens].join(','));
    g.querySelector('.bord').setAttribute('points', pts(RD.val[n][lens], RD.max[lens]));
    const no = g.querySelector('.noyau'); no.setAttribute('points', pts(RD.val[n]['b' + lens], RD.max[lens])); no.setAttribute('data-valeurs', RD.val[n]['b' + lens].join(','));
    col.querySelectorAll('[data-vd]').forEach((s) => { const f = s.dataset.vd.split('|')[1]; s.textContent = '~' + f1(RD.vd[n][f][lens]); });
  }
}
document.querySelectorAll('.lentille [data-e]').forEach((b) => b.addEventListener('click', () => setTimeout(lecture, 0)));
lecture();
const VR = document.querySelector('.verres');
VR.addEventListener('click', (e) => {
  const b = e.target.closest('.hd'); if (!b) return;
  const col = b.closest('.col'), on = b.getAttribute('aria-pressed') !== 'true';
  VR.querySelectorAll('.col').forEach((c) => { const x = c === col && on; c.classList.toggle('avant', x); c.querySelector('.hd').setAttribute('aria-pressed', String(x)); });
  VR.classList.toggle('choix', on);
  if (on) document.querySelector('[data-pont-nom]').textContent = col.dataset.col;
});
document.querySelectorAll('.ong').forEach((b) => b.addEventListener('click', () => {
  const on = b.getAttribute('aria-expanded') !== 'true';
  document.querySelectorAll('.ong').forEach((x) => { const y = x === b && on; x.setAttribute('aria-expanded', String(y)); document.getElementById(x.getAttribute('aria-controls')).hidden = !y; });
}));
const q = location.search;
if (/[?&]ouvre=(\\w+)/.test(q)) { const k = q.match(/[?&]ouvre=(\\w+)/)[1]; const b = document.querySelector('.ong[aria-controls="r6g-' + k + '"]'); if (b) b.click(); }
`;

const html = page({ titre: 'Lequel pour ma stout : Cascade, Idaho 7 ou Galaxy ? · r6g trois verres', desc: 'Lot 22 · r6g · trois verres à même amertume (10 IBU à 10′) ; radar r3 sous chaque verre. Généré par r6g/generer.mjs depuis donnees/comparer-stout.json.', css, corps, js });
ecrire(path.join(ICI, 'etat.html'), html);
console.log('classement ~ :', RANG.map((n) => n + ' ' + fr(SCORE[n], 2)).join(' · '), '| inconnues :', INCONNUES.join(','), '| hors :', HORS.join(','), '| part max', fr(maxPart, 2), 'cran');
for (const n of NOMS) console.log(n, fr(IBU.doses[n], 2) + ' g/L', fr(MASSE[n], 1) + ' g', CONNUES.map((f) => f + ' ' + fr(cr(f, G[n].g[f].c), 2) + '/' + fr(G[n].g[f].c, 1)).join(' '));
