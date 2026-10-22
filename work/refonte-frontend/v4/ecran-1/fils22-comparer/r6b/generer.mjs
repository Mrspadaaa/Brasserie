// Lot 22 · r6b · « Un radar par houblon » : « Lequel pour ma stout : Cascade, Idaho 7 ou Galaxy ? »
// Choix portés : Radar r3 ; base dose égale ; porte « Je n'ai pas X » : non ; descripteurs B.
// Le parti : quatre petits radars aux mêmes axes, deux par rangée. En tête, ta 16D aujourd'hui (la
// référence) ; puis chaque houblon dans ta 16D à 4 g/L après fermentation, 3 j, US-05, avec ta 16D en
// trait gris dessous. La zone du style est un anneau clair : ce qui en sort se voit (orangé). La plage
// possible (bas → haut du moteur) est un trait pâle sur chaque axe : court = sûr, jusqu'au bord = on
// ne sait pas. Puis la chimie du cône, une ligne par composé rattachée à sa famille, une colonne par
// houblon. Le panel OSU et les vraies valeurs en bière sont à un toucher. Le gagnant ouvre Dryhopper.
// Données : ../donnees/comparer-stout.json seul (profils, fiches, composés, panels, descripteurs B).
// Le socle de v1 (lot 21) fournit l'habillage l8g, les pictos au trait, la légende et la fiche g1.
// Usage : node generer.mjs  →  r6b/etat.html
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HOPS, COURT, JET, SRC, fr, plg, esc, M, ic, pic, hn, alpha, usage, stock, barre, lentille, legende, li,
  LEG_FAMILLES, LEG_CONF, LEG_HOUBLON, conf, page, ecrire } from '../../fils21-choisir/v1/socle.mjs';

const ici = path.dirname(fileURLToPath(import.meta.url));
const D = JSON.parse(fs.readFileSync(path.join(ici, '../donnees/comparer-stout.json'), 'utf8'));
const NOMS = ['Cascade', 'Idaho 7', 'Galaxy'];
const HD = Object.fromEntries(D.houblons.map((h) => [h.nom, h]));
const EG = D.egalites.doseEgale;
const EP = D.echelle.parFamille;
const AV = D.biere.avant;
// L'ordre des axes : la roue de la base v4.9 (agrumes en haut), la même que la fiche g1 (D48).
const ROUE = ['citrus', 'tropical', 'melon', 'stoneFruit', 'pomeFruit', 'berries', 'floral', 'green', 'herbal', 'spice', 'earthy', 'resin'];
const ORANGE = '#c2410c';

// ---------- contrôles d'entrée : rien d'inventé, rien de divergent ----------
for (const n of NOMS) {
  const a = HD[n].alpha.retenu.value;
  if (HOPS[n].alpha.lot !== a) throw new Error('α de ' + n + ' : ' + a + ' (données) contre ' + HOPS[n].alpha.lot + ' (socle)');
}
const profil = (n) => {
  const g = HD[n].grille.find((x) => x.moment === EG.moment && x.dose_gL === EG.dose_gL && x.jours === EG.jours && x.levure === EG.levure);
  if (!g) throw new Error('profil absent : ' + n);
  return g;
};
const P = Object.fromEntries(NOMS.map((n) => [n, profil(n)]));

// ---------- le profil : [bas, centre, haut] par famille, ou null si inconnu (jamais 0) ----------
const apres = (n) => Object.fromEntries(ROUE.map((f) => {
  const a = P[n].apres[f];
  return [f, a[0] === 0 && a[1] === 0 && a[2] === 0 && a[4] === 'inconnu' ? null : [a[0], a[1], a[2]]];
}));
const avant = Object.fromEntries(ROUE.map((f) => [f, AV[f].inconnu ? null : [AV[f].bas, AV[f].centre, AV[f].haut]]));
const PROF = Object.fromEntries(NOMS.map((n) => [n, apres(n)]));
const horsStyle = (f, v) => v != null && v[1] > EP[f].bande[1];
// L'écart en crans du style (cran = bande ÷ 3), centre après moins centre avant.
const gainCrans = (n, f) => (PROF[n][f] && avant[f] ? (PROF[n][f][1] - avant[f][1]) / EP[f].cran : null);

// ---------- le radar : petits multiples r3, mêmes axes, deux lectures (au style, absolu) ----------
const W = 168, C = W / 2, R = 61;
const pas = (2 * Math.PI) / ROUE.length;
const pt = (k, r) => [C + Math.sin(k * pas) * r, C - Math.cos(k * pas) * r].map((x) => Math.round(x * 10) / 10);
// Au style : le bord du radar = le domaine de la famille (1,5 × le haut de sa bande) ; la zone du style
// tombe aux deux tiers pour toutes. Absolu : l'échelle 0–100 ; la zone suit la bande de chaque famille.
const LECT = {
  style: { r: (f, v) => v / EP[f].domaine[1], zone: (f) => EP[f].bande[1] / EP[f].domaine[1] },
  abs: { r: (f, v) => v / 100, zone: (f) => EP[f].bande[1] / 100 },
};
function radar({ id, label, series, inconnues }) {
  const s = [];
  s.push(`<svg class="rd" width="${W}" height="${W}" viewBox="0 0 ${W} ${W}" data-radar data-objet="comparer" data-axes="${ROUE.join(',')}" data-inconnues="${inconnues.join(',')}" role="img" aria-label="${esc(label)}">`);
  s.push(`<defs><pattern id="h-${id}" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="#b4b4be" stroke-width="1.2"/></pattern></defs>`);
  const poly = (fn) => ROUE.map((f, k) => pt(k, R * fn(f)).join(',')).join(' ');
  // 1. La zone du style, dans chaque lecture.
  for (const [m, L] of Object.entries(LECT)) s.push(`<polygon points="${poly(L.zone)}" class="rd-zone v-${m}" data-role="zone"/>`);
  // 2. Les familles inconnues : un secteur hachuré et « ? », jamais un zéro au centre.
  for (const f of inconnues) {
    const k = ROUE.indexOf(f), a = pt(k - 0.5, R), b = pt(k + 0.5, R);
    s.push(`<path d="M${C},${C}L${a}A${R},${R} 0 0 1 ${b}Z" fill="url(#h-${id})" data-inconnu="${f}"><title>${COURT[f]} : inconnu, pas zéro</title></path>`);
  }
  // 3. Les séries : la plage possible de la série principale seulement, puis les centres.
  for (const [m, L] of Object.entries(LECT)) {
    s.push(`<g class="v-${m}" data-lecture-radar="${m}">`);
    for (const se of series.filter((x) => x.plage)) {
      // La plage possible, sur l'axe : du bas au haut du moteur, coupée au bord (le bord dit « peut dépasser »).
      for (const [k, f] of ROUE.entries()) {
        const v = se.vals[f]; if (!v) continue;
        const a = pt(k, R * Math.min(1, L.r(f, v[0]))), b = pt(k, R * Math.min(1, L.r(f, v[2])));
        s.push(`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" class="rd-plage" stroke="${se.couleur}"/>`);
      }
    }
    for (const se of series) {
      const conn = ROUE.map((f, k) => [f, k]).filter(([f]) => se.vals[f]);
      const pts = conn.map(([f, k]) => pt(k, R * Math.min(1, L.r(f, se.vals[f][1]))));
      const vals = ROUE.map((f) => (se.vals[f] ? Math.round(se.vals[f][1] * 100) / 100 : -1));
      s.push(`<g data-serie="${esc(se.nom)}" data-valeurs="${vals.join(',')}" class="rd-s ${se.kind}"><polygon points="${pts.map((p) => p.join(',')).join(' ')}" fill="${se.couleur}" stroke="${se.couleur}"/>`);
      for (const [f, k] of conn) {
        const v = se.vals[f], hs = horsStyle(f, v), dep = L.r(f, v[1]) > 1;
        const p = pt(k, R * Math.min(1, L.r(f, v[1])));
        if (dep) { const e = pt(k, R + 5); s.push(`<line x1="${p[0]}" y1="${p[1]}" x2="${e[0]}" y2="${e[1]}" stroke="${hs ? ORANGE : se.couleur}" stroke-width="2.5" stroke-linecap="round"/>`); }
        if (se.kind !== 'avant' || hs) s.push(`<circle cx="${p[0]}" cy="${p[1]}" r="${hs ? 3.4 : 2.4}" fill="${hs ? ORANGE : se.couleur}"${hs ? ' data-hors-style="' + f + '"' : ''}/>`);
      }
      s.push('</g>');
    }
    s.push('</g>');
  }
  s.push(`<polygon points="${poly(() => 1)}" class="rd-bord"/>`);
  ROUE.forEach((f, k) => { const p = pt(k, R + 13); s.push(`<use href="#p-${f}" x="${p[0] - 6.5}" y="${p[1] - 6.5}" width="13" height="13"/>`); });
  s.push('</svg>');
  return s.join('');
}

// ---------- les arômes de ses fiches, en couleur, et la part « autres » (descripteurs B) ----------
const B = D.descripteurs.B;
function aromesBarre(n) {
  const mots = HD[n].aromes.filter((a) => a.mots.length).map((a) => [a.family, [...new Set(a.mots.flatMap((m) => m.mots).map((w) => w.toLowerCase()))]]);
  const tot = mots.reduce((s, [, w]) => s + w.length, 0);
  const b = B.parts[n], autres = b.visible ? b.partDessinee : 0;
  const segs = ROUE.flatMap((f) => mots.filter(([g]) => g === f)).map(([f, w]) => `<i class="ab-s" data-famille="${f}" style="flex:${(w.length / tot) * (1 - autres)};background:${JET[f].base}" aria-label="${COURT[f]} : ${esc(w.join(', '))}"></i>`);
  if (autres) segs.push(`<i class="ab-s ab-autres" data-role="autres" data-houblon="${esc(n)}" data-part="${fr(autres, 2)}" style="flex:${autres}" aria-label="autres, ${Math.round(b.part * 100)} % de ses mots, hors des 12 familles : ${esc(b.concepts.join(', '))}"></i>`);
  return `<span class="ab" role="img" aria-label="Arômes de ses fiches">${segs.join('')}</span>${autres ? '<span class="ab-m">autres</span>' : ''}`;
}

// ---------- les cartes : nom, α, rôle en mot, stock en icône, arômes en couleur, radar, verdict ----------
const floral = Object.fromEntries(NOMS.map((n) => [n, gainCrans(n, 'floral')]));
const meilleur = NOMS.reduce((a, b) => (floral[b] > floral[a] ? b : a));
const signe = (x) => (x >= 0 ? '+' : '−') + fr(Math.abs(x), 1);
function carte(n) {
  const nouveauxHors = ROUE.filter((f) => horsStyle(f, PROF[n][f]) && !horsStyle(f, avant[f]));
  const inc = ROUE.filter((f) => !PROF[n][f]);
  const conf_ = P[n].confiance;
  const verdict = `<span class="vd" data-nature="simule">${pic('floral', 14)}<b class="vs">~${signe(floral[n])}</b><span class="vd-u">cran</span>${n === meilleur ? '<span class="vd-top">le plus</span>' : ''}</span>`
    + nouveauxHors.map((f) => `<span class="vd vd-hors" data-nature="simule">${pic(f, 14)}<b>hors 16D</b></span>`).join('');
  return `<article class="rc" data-role="ligne-houblon" data-col="${esc(n)}" style="--hc:${HOPS[n].couleur}">
    <header class="rc-t"><i class="hpt plein" style="--hc:${HOPS[n].couleur}" aria-hidden="true"></i><span class="nm">${hn(n)}</span>${alpha(n, { plage: false })}${stock(n)}
      <button type="button" class="rc-x" data-action="retirer" aria-label="Retirer ${esc(n)}">${ic('x', 14)}</button></header>
    <div class="rc-u">${usage(n)}${aromesBarre(n)}</div>
    ${radar({ id: n.replace(/\W/g, ''), label: n + ' dans ta 16D, ~ simulé à 4 g/L après fermentation, 3 j, US-05 (confiance ' + conf_ + ') ; trait gris : ta 16D aujourd’hui ; trait pâle sur chaque axe : la plage possible ; zone claire : la 16D' + (inc.length ? ' ; inconnu, pas zéro : ' + inc.map((f) => COURT[f].toLowerCase()).join(', ') : ''),
      inconnues: inc, series: [{ nom: 'ta 16D', couleur: '#5b5b66', kind: 'avant', vals: avant }, { nom: n, couleur: HOPS[n].couleur, kind: 'hop', vals: PROF[n], plage: true }] })}
    <div class="rc-v">${verdict}</div>
  </article>`;
}
const resineGain = Math.max(...NOMS.map((n) => gainCrans(n, 'resin')));
const carteRef = `<article class="rc rc-ref" aria-label="Ta 16D aujourd’hui">
    <header class="rc-t"><i class="hpt contour" style="--hc:#5b5b66" aria-hidden="true"></i><b class="rc-ref-n">Ta 16D</b></header>
    <div class="rc-u"><span class="ref-l" aria-label="résineux : trop, à ta dégustation du 18.10">${pic('resin', 14)}<b class="hst">trop</b></span><span class="ref-l" aria-label="floral : tu en veux plus">${pic('floral', 14)}<b>plus</b>${ic('chev-r', 12, 'ic up')}</span></div>
    ${radar({ id: 'ref', label: 'Ta 16D aujourd’hui : résineux marqué à la dégustation du 18.10, hors du style ; le reste simulé depuis la recette (Nugget à 60′) ; inconnu, pas zéro : noyau, pépins, baies, melon', inconnues: ROUE.filter((f) => !avant[f]), series: [{ nom: 'ta 16D', couleur: '#5b5b66', kind: 'ref', vals: avant, plage: true }] })}
    <div class="rc-v"><span class="vd" data-nature="simule">${pic('resin', 14)}<b class="vs">~${signe(resineGain)}</b><span class="vd-u">crans chacun</span></span></div>
  </article>`;

// ---------- la chimie du cône : une ligne par composé, rattachée à sa famille, une colonne par houblon ----------
const NOM_C = { huile: 'huile totale', linalol: 'linalol', geraniol: 'géraniol', myrcene: 'myrcène', humulene: 'humulène', caryophyllene: 'caryophyllène', farnesene: 'farnésène', '4MMP': '4MMP', '3MH': '3MH' };
// Rangées par unité ; le floral (ta demande) d'abord, le résineux (ton « trop ») ensuite.
const GROUPES = [
  ['% de l’huile', [['linalol', 'floral'], ['geraniol', 'floral'], ['myrcene', 'resin'], ['caryophyllene', 'spice'], ['humulene', 'herbal'], ['farnesene', 'green']]],
  ['thiols, µg/kg de cône', [['4MMP', 'berries'], ['3MH', 'citrus']]],
  ['huile, mL/100 g', [['huile', null]]],
];
function teneur(n, k) {
  const c = HD[n].composes;
  const e = k === 'huile' ? c.huile : c.composes[k];
  const vs = e && Array.isArray(e.valeurs) ? e.valeurs.filter((v) => v.portee === 'variété') : [];
  if (!vs.length) {
    const nd = e && (e.nonDetecte || /non détecté/.test(e.raison || ''));
    return { inc: true, raison: (e && e.raison) || 'non publié', nd: !!nd, src: e && e.nonDetecte ? e.nonDetecte.flatMap((x) => x.sources) : ['H'] };
  }
  const los = vs.map((v) => v.plage[0]), his = vs.map((v) => v.plage[1]);
  return { min: los.some((x) => x == null) ? null : Math.min(...los), max: his.some((x) => x == null) ? null : Math.max(...his), src: [...new Set(vs.flatMap((v) => v.sources))], verif: vs.some((v) => v.aConfirmer) };
}
function ligneChimie([k, f]) {
  const ts = NOMS.map((n) => [n, teneur(n, k)]);
  const ech = Math.max(...ts.flatMap(([, t]) => (t.inc ? [] : [t.min, t.max].filter((x) => x != null)))) * 1.15 || 1;
  const cell = ([n, t]) => {
    if (t.inc) return `<span class="ch-c" data-col="${esc(n)}"><span class="inc${t.nd ? ' nd' : ''}" data-inconnu="${esc(t.raison)}" data-source="${esc(t.src.join(' '))}">${t.nd ? 'non détecté' : 'inconnu'}</span></span>`;
    const lo = t.min == null ? 0 : t.min / ech, hi = t.max == null ? 1 : t.max / ech;
    const ouvert = (t.min == null ? ' ouv-g' : '') + (t.max == null ? ' ouv-d' : '');
    return `<span class="ch-c" data-col="${esc(n)}"><span class="ch-p"><i class="ch-b${ouvert}" style="left:${(lo * 100).toFixed(1)}%;width:${Math.max(4, (hi - lo) * 100).toFixed(1)}%;--hc:${HOPS[n].couleur}"></i></span>${M(plg(t.min, t.max), t.src, 'ch-v')}${t.verif ? '<span class="verif">à confirmer</span>' : ''}</span>`;
  };
  return `<div class="ch-l" data-compose="${NOM_C[k]}">${f ? pic(f, 16) : '<i class="ch-pi0" aria-hidden="true"></i>'}<span class="ch-n"><b>${NOM_C[k]}</b></span>${ts.map(cell).join('')}</div>`;
}

// ---------- le panel OSU (mesuré) : la courbe de dose de Cascade, sans molette ----------
const O = D.panelOSU;
function panelOSU() {
  const w = 330, h = 128, x0 = 26, x1 = 236, y0 = 112, y1 = 8;
  const X = (d) => x0 + (d / 16) * (x1 - x0), Y = (v) => y0 - (v / 15) * (y0 - y1);
  const series = [['agrumes', 'citrus', O.agrumes], ['herbacé, thé', 'herbal', O.herbaceThe], ['intensité', null, O.intensite]];
  let s = `<svg class="osu" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="Panel OSU, Cascade : agrumes, herbacé et intensité selon la dose, de 0 à 16 g/L, sur 15">`;
  s += `<rect x="${X(O.zone[0])}" y="${y1}" width="${X(O.zone[1]) - X(O.zone[0])}" height="${y0 - y1}" class="osu-z"/>`;
  for (const v of [0, 5, 10, 15]) s += `<line x1="${x0}" x2="${x1}" y1="${Y(v)}" y2="${Y(v)}" class="osu-g"/><text x="${x0 - 5}" y="${Y(v) + 4}" text-anchor="end" class="osu-t">${v}</text>`;
  for (const d of [0, 4, 8, 16]) s += `<text x="${X(d)}" y="${h - 1}" text-anchor="middle" class="osu-t">${d}</text>`;
  s += `<line x1="${X(EG.dose_gL)}" x2="${X(EG.dose_gL)}" y1="${y1 - 4}" y2="${y0}" class="osu-m"/>`;
  for (const [nom, f, ys] of series) {
    const c = f ? JET[f].texte : '#3a3a44';
    s += `<polyline points="${O.doses.map((d, i) => X(d) + ',' + Y(ys[i])).join(' ')}" fill="none" stroke="${c}" stroke-width="2"/>`;
    O.doses.forEach((d, i) => { s += `<circle cx="${X(d)}" cy="${Y(ys[i])}" r="2.8" fill="${c}"/>`; });
    const yl = Y(ys[ys.length - 1]);
    s += `<text x="${X(16) + 6}" y="${yl + 4}" class="osu-l" fill="${c}">${nom}</text>`;
  }
  return s + '</svg>';
}
const NOTES_PANEL = NOMS.map((n) => {
  const p = (HD[n].composes.panel || [])[0];
  return p ? `<p class="pn">${'<i class="hpt plein" style="--hc:' + HOPS[n].couleur + '" aria-hidden="true"></i>'}<b>${n}</b> ${esc(p.texte.replace(/,? ?avec Nugget et Chinook/, '').replace(/, séparé de Citra/, ''))} <span class="src">${p.sources.map((k) => (k === 'H' ? 'synthèse H' : k)).join(' ')}</span></p>` : '';
}).join('');

// ---------- les vraies valeurs, mesurées en bière ----------
const CAS = HD.Cascade.composes.mesuresEnBiere;
const E03 = HD['Idaho 7'].panels.find((p) => p.id === 'E03');
const e03 = (c) => { const m = E03.mesures.find((x) => x.compose === c && x.variete === 'Idaho-7'); if (!m) throw new Error('E03 : ' + c + ' absent pour Idaho-7'); return m; };
const auteur = (k) => (SRC[k] ? SRC[k].titre.split(/[,.]/)[0].split(' ')[0] + (SRC[k].annee ? ' ' + SRC[k].annee : '') : k);
const VV = [
  ...['kishimoto-linalol', 'kishimoto-geraniol', 'lafontaine-3mh'].map((id) => { const m = CAS.find((x) => x.id === id); return { n: 'Cascade', f: { linalol: 'floral', geraniol: 'floral', '3MH': 'citrus' }[m.compose], c: NOM_C[m.compose] || m.compose, v: (m.plage[0] === m.plage[1] ? fr(m.plage[0], 1) : fr(m.plage[0], 0) + '–' + fr(m.plage[1], 0)) + ' ' + m.unite, cond: fr(m.doseGL, 2) + ' g/L' + (m.dureeJours ? ', 24 h' : ', moût refroidi'), src: m.sources, cite: auteur(m.sources[0]) + ' (' + m.sources[0] + ')' }; }),
  ...[['linalol', 'floral'], ['myrcène', 'resin']].map(([c, f]) => { const m = e03(c); return { n: 'Idaho 7', f, c, v: fr(m.valeur * 1000) + ' ± ' + fr(m.ecart * 1000) + ' µg/L', cond: 'au pitch, S-04', src: ['E03'], cite: 'McCabe 2023 (E03)', verif: true }; }),
];
const vraies = VV.map((x) => `<div class="vv"><i class="hpt plein" style="--hc:${HOPS[x.n].couleur}" aria-hidden="true"></i>${pic(x.f, 14)}<span class="vv-n">${x.n}, ${x.c}</span>${M(x.v, x.src, 'vv-v')}<span class="vv-c">${x.cond} · ${x.cite}${x.verif ? ' · <span class="verif">à vérifier</span>' : ''}</span></div>`).join('')
  + `<div class="vv"><i class="hpt plein" style="--hc:${HOPS.Galaxy.couleur}" aria-hidden="true"></i><i aria-hidden="true"></i><span class="vv-n">Galaxy</span><span class="inc" data-inconnu="aucune mesure en bière chiffrée dans les données" data-source="H">inconnu</span><span class="vv-c">aucune mesure chiffrée lue</span></div>`;

// ---------- la page ----------
const ctx = `<p class="ctx" data-role="contexte"><span data-contexte="biere">16D</span><span data-contexte="base">dose égale 4 g/L</span><br><span data-contexte="moment">après fermentation, 3 j</span><span data-contexte="levure">US-05</span></p>`;
const corps = `
${barre('Lequel pour ma stout : Cascade, Idaho 7 ou Galaxy ?')}
<div class="tete2">${ctx}<span data-lecture>${lentille()}</span></div>
<section class="radars" data-acquis="radar" aria-label="Un radar par houblon, dans ta 16D">
  <div class="rgr" data-libre="houblon" role="group" aria-label="Houblons comparés">
    ${carteRef}
    ${NOMS.map(carte).join('\n')}
    <div class="remettre" hidden></div>
  </div>
</section>
<div class="ouvrir">
  <button type="button" class="chip" aria-expanded="false" aria-controls="osu" data-ouvre-acquis="osu">${ic('panel', 14)}Panel OSU</button>
  <button type="button" class="chip" aria-expanded="false" aria-controls="valeurs" data-ouvre-acquis="valeurs">${ic('flacon', 14)}En bière</button>
</div>
<section class="carte" id="osu" data-acquis="osu" data-nature="mesure" data-source="${O.sources.join(' ')}" hidden aria-label="Panel OSU">
  <h2 class="sec-t">Panel OSU, la dose ${conf('panel')}</h2>
  ${panelOSU()}
  <p class="pn">${M('agrumes ' + fr(O.agrumes[3]) + ' à 8 g/L, ' + fr(O.agrumes[4]) + ' à 16', O.sources, 'txt')} : ils plafonnent ; l’herbacé monte encore (${M(fr(O.herbaceThe[4]) + ' sur 15', O.sources, 'txt')}). Trait : ta dose. <span class="src">Lafontaine 2018 (H22), Cascade, 24 h</span></p>
  ${NOTES_PANEL}
  <p class="pn gris">Idaho 7, Galaxy : pas de courbe de dose publiée.</p>
</section>
<section class="carte" id="valeurs" data-acquis="valeurs" hidden aria-label="En bière, mesuré">
  <h2 class="sec-t">En bière, mesuré ${conf('mesure')}</h2>
  ${vraies}
  <p class="src-l">Doses, bières et levures diffèrent : ces chiffres ne se classent pas entre eux.</p>
</section>
<section class="carte chimie" data-acquis="chimie" aria-label="Dans le cône, la chimie de chacun">
  <h2 class="sec-t">Dans le cône ${conf('mesure')}</h2>
  <div class="ch-tete"><span></span>${NOMS.map((n) => `<span class="ch-c ch-h" data-col="${esc(n)}"><i class="hpt plein" style="--hc:${HOPS[n].couleur}" aria-hidden="true"></i>${n}</span>`).join('')}</div>
  ${GROUPES.map(([t, ls]) => `<p class="ch-g">${t}</p>` + ls.map(ligneChimie).join('')).join('\n  ')}
  <p class="src-l">Plages des fiches YCH, HPA, Haas, Hopsteiner, Beer Maverick ; thiols : Schmidt 2024 (H11). IBU à cru : non modélisé.</p>
</section>
<nav class="pont" aria-label="Suite"><a href="#" data-role="pont">${ic('chev-r', 14)}Le gagnant dans Dryhopper : sa dose, son jour</a></nav>
${legende([
  ['Lire un radar', [
    li('<span class="lg-r"><i class="hop"></i></span>', '~ simulé dans ta 16D, 4 g/L après fermentation, 3 j, US-05 (moteur profil-simulé, conventions à valider)'),
    li('<span class="lg-r"><i class="av"></i></span>', 'ta 16D aujourd’hui'),
    li('<span class="lg-r"><i class="pl"></i></span>', 'trait pâle : la plage possible ; jusqu’au bord, elle peut dépasser'),
    li('<span class="lg-r"><i class="zo"></i></span>', 'zone claire : la 16D (BJCP 2021) ; au style, elle tombe aux deux tiers'),
    li('<span class="lg-r"><i class="or"></i></span>', 'orangé : hors du style'),
    li('<span class="lg-r"><i class="hc"></i></span>', 'hachuré « ? » : inconnu, pas zéro'),
  ], true],
  ['Arômes de ses fiches', [
    li('<span class="ab lg-ab"><i class="ab-s" style="flex:2;background:' + JET.tropical.base + '"></i><i class="ab-s ab-autres" style="flex:1"></i></span>', 'couleur : ses mots, par famille ; gris « autres » : ses mots hors des 12 familles'),
    li('<span class="lg-acor">à corriger</span>', 'réglages proposés par le pilote, à corriger par le brasseur : mots génériques écartés (' + B.generiques.slice(0, 4).join(', ') + '…), « autres » montré au-delà de ' + Math.round(B.seuil * 100) + ' %, dessiné à ' + Math.round(B.plafond * 100) + ' % au plus'),
  ], true],
  LEG_FAMILLES, LEG_HOUBLON, LEG_CONF,
])}`;

const css = `
  .tete2 { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .tete2 .ctx { flex: 1; display: flex; flex-wrap: wrap; gap: 0 10px; white-space: normal; font: 500 12px/16px var(--sans); color: var(--encre); }
  .tete2 .ctx span { white-space: nowrap; }
  .tete2 .ctx br { flex-basis: 100%; content: ''; }
  .tete2 .sep { color: var(--gris); }
  .rgr { display: grid; align-items: stretch; grid-template-columns: 1fr 1fr; gap: 6px; }
  .rc { background: #fff; border-radius: 8px; box-shadow: 0 0 0 1px var(--trait); padding: 5px 4px 4px; display: flex; flex-direction: column; gap: 3px; min-width: 0; -webkit-user-select: none; user-select: none; }
  [hidden] { display: none !important; }
  .ref-l .up { transform: rotate(-90deg); }
  .rc-ref { background: #f6f5f2; }
  .rc-t { display: flex; align-items: center; gap: 4px; min-height: 22px; }
  .rc-t .nm { font-size: 14px; white-space: nowrap; }
  .rc-t .stk { color: var(--gris); display: inline-flex; }
  .rc-ref-n { font-size: 13px; font-weight: 700; }
  .rc-x { margin-left: auto; width: 24px; height: 24px; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center; color: var(--gris); }
  .rc-x[aria-disabled="true"] { opacity: .35; }
  .rc-u { display: flex; align-items: center; gap: 5px; min-height: 18px; flex-wrap: wrap; }
  .rc-u .us { font-size: 12px; }
  .ab { display: inline-flex; flex: 1; min-width: 40px; height: 8px; border-radius: 2px; overflow: hidden; gap: 1px; background: #fff; }
  .ab-s { display: block; height: 8px; min-width: 3px; }
  .ab-autres { background: #8e8e96; }
  .ab-m { font-size: 12px; color: var(--gris); }
  .ref-l { display: inline-flex; align-items: center; gap: 3px; font-size: 12px; }
  .rd { display: block; margin: 0 auto; overflow: visible; }
  .rd-bord { fill: none; stroke: #c9c9d1; stroke-width: 1; }
  .rd-zone { fill: #eceae4; stroke: #a8a49a; stroke-width: 1; }
  .rd-plage { stroke-width: 4; stroke-linecap: round; opacity: .22; }
  .rc-ref .rd-plage { opacity: .16; }
  .rd-s polygon { fill-opacity: .16; stroke-width: 2; stroke-linejoin: round; }
  .rd-s.avant polygon { fill: none; stroke-width: 1.3; }
  .rd-s.ref polygon { fill-opacity: .14; stroke-width: 2; }
  .rd-q { font: 600 12px var(--sans); fill: #55555f; }
  body:not(.abs) .v-abs, body.abs .v-style { display: none; }
  .rc-v { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; min-height: 20px; }
  .vd { display: inline-flex; align-items: center; gap: 3px; font-size: 12px; }
  .vd .vs { font-weight: 700; font-size: 13px; }
  .vd-u { color: var(--gris); }
  .vd-top { font-size: 12px; font-weight: 700; padding: 0 5px; height: 18px; display: inline-flex; align-items: center; border-radius: 9px; background: var(--encre); color: #fff; }
  .vd-hors b { color: var(--acc); }
  .remettre { grid-column: 1 / -1; display: flex; gap: 6px; flex-wrap: wrap; }
  .remettre[hidden] { display: none; }
  .chimie { gap: 4px; }
  .ch-tete, .ch-l { display: grid; grid-template-columns: 92px 1fr 1fr 1fr; gap: 6px; align-items: center; }
  .ch-tete { font-size: 12px; font-weight: 700; }
  .ch-h { display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; }
  .ch-l { min-height: 30px; border-top: 1px solid var(--trait); padding-top: 3px; grid-template-columns: 16px 82px 1fr 1fr 1fr; }
  .ch-tete { grid-template-columns: 104px 1fr 1fr 1fr; }
  .ch-pi0 { width: 16px; }
  .ch-g { font-size: 12px; color: var(--gris); padding-top: 4px; }
  .ch-l .verif { font-size: 12px; align-self: flex-start; }
  .ch-n { display: flex; flex-direction: column; line-height: 1.1; font-size: 12px; }
  .ch-n b { font-weight: 600; }
  .ch-u { color: var(--gris); font-size: 12px; }
  .ch-c { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
  .ch-c[hidden] { display: none; }
  .ch-p { position: relative; height: 6px; background: #f0f0f4; border-radius: 2px; }
  .ch-b { position: absolute; top: 0; bottom: 0; border-radius: 2px; background: var(--hc); }
  .ch-b.ouv-d { -webkit-mask: linear-gradient(90deg, #000 70%, transparent); mask: linear-gradient(90deg, #000 70%, transparent); }
  .ch-b.ouv-g { -webkit-mask: linear-gradient(270deg, #000 70%, transparent); mask: linear-gradient(270deg, #000 70%, transparent); }
  .ch-v { font-size: 12px; white-space: nowrap; }
  .ch-q { font-size: 12px; color: var(--gris); }
  .ch-c .inc { align-self: flex-start; }
  .inc.nd { background: #f0f0f4; }
  .ouvrir { display: flex; gap: 6px; flex-wrap: wrap; }
  .ouvrir .chip[aria-expanded="true"] { background: var(--encre); color: #fff; }
  .osu { display: block; }
  .osu-z { fill: #f1ecf7; }
  .osu-g { stroke: #e3e3ea; stroke-width: 1; }
  .osu-t { font: 12px var(--sans); fill: #55555f; }
  .osu-l { font: 600 12px var(--sans); }
  .osu-m { stroke: var(--encre); stroke-width: 1.5; }
  .pn { font-size: 12px; line-height: 1.4; }
  .pn .hpt { margin-right: 4px; vertical-align: -1px; }
  .pn b { font-weight: 700; }
  .src { color: var(--gris); }
  .vv { display: grid; grid-template-columns: 10px 14px 1fr auto; gap: 2px 6px; align-items: center; font-size: 12px; border-top: 1px solid var(--trait); padding-top: 4px; }
  .vv .vv-c { grid-column: 3 / -1; color: var(--gris); }
  .vv-v { font-size: 12px; }
  .verif { background: #fff4d6; color: var(--encre); padding: 0 3px; border-radius: 2px; }
  .pont a { display: flex; align-items: center; gap: 4px; min-height: 36px; padding: 0 10px; border-radius: 8px; background: #fff; box-shadow: 0 0 0 1px var(--trait); font-size: 13px; font-weight: 600; color: var(--encre); text-decoration: none; }
  .lg-r { position: relative; width: 26px; height: 16px; display: inline-block; flex: none; }
  .lg-r i { position: absolute; left: 2px; right: 2px; top: 6px; height: 4px; border-radius: 2px; }
  .lg-r .hop { background: ${HOPS.Cascade.couleur}; } .lg-r .av { background: #5b5b66; height: 2px; top: 7px; }
  .lg-r .pl { background: ${HOPS.Cascade.couleur}; opacity: .3; height: 5px; }
  .lg-r .zo { background: #eceae4; height: 12px; top: 2px; box-shadow: inset 0 0 0 1px #a8a49a; }
  .lg-r .or { background: ${ORANGE}; width: 8px; height: 8px; left: 9px; top: 4px; border-radius: 50%; }
  .lg-r .hc { height: 12px; top: 2px; background: repeating-linear-gradient(135deg, #fff 0 3px, #c4c4cc 3px 5px); }
  .lg-ab { width: 30px; flex: none; }
  .lg-acor { font-size: 12px; font-weight: 600; padding: 0 4px; border-radius: 2px; background: #fff4d6; }`;

// Gestes de la page (s'ajoutent au script de la fiche g1) : retirer / remettre un houblon, ouvrir un acquis
// d'un toucher, et la part « autres » dessinée dans la fiche (descripteurs B).
const js = `
const B_PARTS = ${JSON.stringify(Object.fromEntries(NOMS.map((n) => [n, B.parts[n]])))};
const GEN = ${JSON.stringify(B.generiques)};
const COUL_H = ${JSON.stringify(Object.fromEntries(NOMS.map((n) => [n, HOPS[n].couleur])))};
const grille = document.querySelector('[data-libre="houblon"]'), rem = grille.querySelector('.remettre');
function majRetrait() {
  const vis = [...grille.querySelectorAll('.rc[data-col]')].filter((c) => !c.hidden);
  for (const c of vis) c.querySelector('.rc-x').setAttribute('aria-disabled', String(vis.length <= 2));
  const caches = [...grille.querySelectorAll('.rc[data-col]')].filter((c) => c.hidden).map((c) => c.dataset.col);
  rem.replaceChildren(...caches.map((n) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.setAttribute('aria-label', 'Remettre ' + n); b.innerHTML = '<i class="hpt plein" style="--hc:' + COUL_H[n] + '"></i>+ ' + n; b.onclick = () => montrer(n, true); return b; }));
  rem.hidden = !caches.length;
}
function montrer(n, on) {
  document.querySelectorAll('[data-col="' + n + '"]').forEach((e) => { e.hidden = !on; });
  majRetrait();
}
grille.addEventListener('click', (e) => {
  const x = e.target.closest('[data-action="retirer"]'); if (!x) return;
  if (x.getAttribute('aria-disabled') === 'true') return;
  montrer(x.closest('.rc').dataset.col, false);
});
majRetrait();
document.querySelectorAll('.ouvrir [aria-controls]').forEach((b) => b.addEventListener('click', () => {
  const s = document.getElementById(b.getAttribute('aria-controls')), on = s.hidden;
  s.hidden = !on; b.setAttribute('aria-expanded', String(on));
  if (on) s.scrollIntoView({ block: 'nearest' });
}));
// La fiche (appui long) : la ligne « sans famille » devient la part « autres » dessinée (B).
new MutationObserver(() => {
  const f = document.querySelector('#fiche-racine [data-role="fiche"]'); if (!f || f.querySelector('.f-autres')) return;
  const n = FICHE.cle, b = B_PARTS[n]; if (!b) return;
  const vieux = f.querySelector('.f-lab-sans');
  const z = document.createElement('div'); z.className = 'f-autres';
  if (b.visible) z.innerHTML = '<span class="f-aut-p"><i data-role="autres" data-houblon="' + n + '" data-part="' + String(b.partDessinee).replace('.', ',') + '" style="width:' + Math.round(b.partDessinee * 100) + '%" aria-label="autres : ' + b.concepts.join(', ') + '"></i></span><span><b>autres ' + Math.round(b.part * 100) + ' %</b> ' + b.concepts.join(', ') + '</span><span class="lg-acor">à corriger</span>';
  else if (vieux) z.innerHTML = '<span class="gris">' + vieux.textContent.replace(/^sans famille : /, '') + ' : mot générique, écarté</span>';
  else return;
  if (vieux) vieux.replaceWith(z); else (f.querySelector('[data-role="fiche-labels"]') || f).append(z);
}).observe(document.getElementById('fiche-racine'), { childList: true, subtree: true });`;

const cssFiche = `
  .f-autres { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 13px; }
  .f-aut-p { position: relative; width: 120px; height: 8px; border-radius: 2px; background: #f0f0f4; }
  .f-aut-p i { position: absolute; left: 0; top: 0; bottom: 0; background: #8e8e96; border-radius: 2px; }`;

ecrire(path.join(ici, 'etat.html'), page({
  titre: 'Lequel pour ma stout : Cascade, Idaho 7 ou Galaxy ? (r6b, un radar par houblon)',
  desc: 'Lot 22, r6b : Radar r3 ; base dose égale ; porte non ; descripteurs B. Données : fils22-comparer/donnees/comparer-stout.json.',
  css: css + cssFiche, corps, js,
}));
