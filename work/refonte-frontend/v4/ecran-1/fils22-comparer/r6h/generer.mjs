// Lot 22 · r6h · « Je n'ai pas Nelson Sauvin » : Comparer, porte « Je n'ai pas X ».
// Question : « Lequel pour ma stout : Cascade, Idaho 7 ou Galaxy ? ». Nelson Sauvin, pas en stock, est
// épinglé en colonne 1 : il est la cible, fixe. Les trois candidats, à dose égale (4 g/L, après
// fermentation, 3 j, US-05), se mesurent à lui. Seule la variété est libre : un toucher met un candidat
// en avant (radar r2 : lui plein, Nelson en contour graphite épais, les deux autres en contour fin).
// Choix portés : Radar r2 ; Base dose égale ; Porte oui (Nelson Sauvin) ; Descripteurs B.
//
// Données : uniquement fils22-comparer/donnees/comparer-stout.json (vérifié par r6e-entrees). Les noms
// de sources viennent du dictionnaire des sources de composes-houblon.json (références, pas des valeurs).
// Calculs faits ici, et dits sur la page ou dans la NOTE :
//   - écart au Nelson : moyenne, sur les familles connues des deux, de |apport du candidat − apport de
//     Nelson| / cran du style (apport = delta de la grille, dryPost 4 g/L 3 j US-05) ; simulé « ~ » ;
//   - enveloppe d'un composé : de la plus petite à la plus grande valeur publiée (convention « enveloppe »
//     de composes-houblon.json) ;
//   - mots des fiches : part de chaque famille = mots rattachés / tous les mots ; part « autres » =
//     descripteurs.B.parts[nom].partDessinee (génériques écartés, seuil 25 %, plafond 33 %).
// Le socle (fiche g1 à l'appui long, pictos au trait, légende derrière « ? », lentille) est celui de v1
// (fils21-choisir/v1/socle.mjs), importé sans le modifier ; Nelson Sauvin y est ajouté ici.
// Usage, depuis la racine du dépôt : node work/refonte-frontend/v4/ecran-1/fils22-comparer/r6h/generer.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HOPS, FD, JET, ORDRE, COURT, SRC, esc, ic, pic, hn, usage, page, barre, lentille, legende, li, LEG_FAMILLES, conf } from '../../fils21-choisir/v1/socle.mjs';

const ici = path.dirname(fileURLToPath(import.meta.url));
const D = JSON.parse(fs.readFileSync(path.join(ici, '../donnees/comparer-stout.json'), 'utf8'));
const PACK = JSON.parse(fs.readFileSync(path.join(ici, '../../../../../../prototypes/houblons-v4/data/pack-fiches.json'), 'utf8')).fichesHoublons;

const CIBLE = 'Nelson Sauvin';
const CANDIDATS = ['Cascade', 'Idaho 7', 'Galaxy'];
const TOUS = [CIBLE, ...CANDIDATS];
const ACC = '#c2410c';
const GRAPHITE = '#3f3f4a'; // Nelson : la cible, ni candidat ni série de ma bière (voir NOTE)
const AUTRES_GRIS = '#b9b9c1';
const H = Object.fromEntries(D.houblons.map((h) => [h.nom, h]));
const EG = D.egalites.doseEgale;
const PF = D.echelle.parFamille;
const AXES = ['citrus', 'tropical', 'melon', 'stoneFruit', 'pomeFruit', 'berries', 'floral', 'green', 'herbal', 'spice', 'earthy', 'resin'];

const fr = (x, d = 1) => (x == null || Number.isNaN(x) ? '?' : String(Math.round(x * 10 ** d) / 10 ** d).replace('.', ',').replace('-', '−'));
const srcNom = (k) => {
  const s = SRC[k]; if (!s) return k;
  const t = s.titre.replace(/\s*\(catalogue du prototype\)/, '');
  const court = /^Beer Maverick/.test(t) ? 'Beer Maverick' : /^Hopsteiner/.test(t) ? 'Hopsteiner' : /^Yakima Chief/.test(t) ? 'Yakima Chief' : /^Hop Products Australia/.test(t) ? 'HPA' : /^John I\. Haas/.test(t) ? 'Haas' : /^Schmidt/.test(t) ? 'Schmidt' : t.split(/[,.]/)[0];
  return court + (s.annee ? ' ' + s.annee : '');
};

// ---------- Nelson Sauvin dans le socle : couleur, α (fiches seulement : pas en stock), fiche g1 ----------
{
  const f = PACK.find((x) => x.name === CIBLE);
  const amin = Math.min(...H[CIBLE].alpha.sources.map((s) => s.min)), amax = Math.max(...H[CIBLE].alpha.sources.map((s) => s.max));
  HOPS[CIBLE] = { cle: H[CIBLE].key, couleur: GRAPHITE, pack: CIBLE, alpha: { lot: null, lotSource: null, fiches: [amin, amax], horsFiches: false }, stock: 'à acheter',
    role: { v: f.role.value, src: /^fournisseur/.test(f.role.source) ? 'fournisseur' : 'règle', txt: f.role.source }, niveaux: Object.fromEntries(f.aromes.map((a) => [a.family, a.level])) };
  const plageSrc = (s) => ({ src: s.source, an: s.annee ?? null, min: s.min, max: s.max });
  const uniq = (xs) => { const vu = new Set(); return xs.filter((w) => { const k = w.toLowerCase(); if (vu.has(k)) return false; vu.add(k); return true; }).map((w) => w.toLowerCase()); };
  const comp = (f.huiles && f.huiles.composants) || {};
  const NOMS_H = { myrcene: 'myrcène', humulene: 'humulène', caryophyllene: 'caryophyllène', farnesene: 'farnésène', linalool: 'linalol' };
  FD[CIBLE] = { nom: CIBLE, role: HOPS[CIBLE].role, voie: 'NelsonSauvin', stock: 'à acheter', ajout: null, alphaC1: HOPS[CIBLE].alpha, origine: f.origin || null,
    alpha: f.alpha.sources.map(plageSrc), lot: null, beta: f.beta.sources.map(plageSrc), huiles: f.huiles.totale.sources.map(plageSrc),
    composants: Object.entries(NOMS_H).map(([k, n]) => (comp[k] ? { nom: n, min: comp[k].min, max: comp[k].max, src: comp[k].source } : { nom: n, raison: comp[k + 'Raison'] || null })),
    aromes: f.aromes.filter((a) => a.sources > 0).map((a) => ({ f: a.family, n: a.sources, of: a.of, auteurs: a.authors || [], mots: uniq(a.mots.flatMap((m) => m.mots)), premier: a.sources === 1 && (a.premier || []).length > 0 })),
    of: f.aromes[0].of, sans: uniq(f.motsSansFamille.map((s) => s.mot)), styles: f.usage.flatMap((u) => u.styles || []), stylesSrc: f.usage.map((u) => u.source),
    stylesRaison: null, desc: f.descripteurs.beerMaverick || [], subs: [], subsRaison: f.substitutsRaison };
}

// ---------- le simulé : la grille à dose égale ----------
const grille = (nom) => H[nom].grille.find((g) => g.moment === EG.moment && g.dose_gL === EG.dose_gL && g.jours === EG.jours && g.levure === EG.levure);
const SIM = Object.fromEntries(TOUS.map((nom) => {
  const g = grille(nom);
  const ap = Object.fromEntries(AXES.map((f) => [f, g.apres[f].slice(0, 3)]));
  const inc = AXES.filter((f) => g.apres[f][1] === 0 && g.apres[f][2] === 0);
  return [nom, { ap, delta: g.delta, inc, confiance: g.confiance, drapeaux: g.drapeaux }];
}));
// Inconnue pour tous : secteur hachuré.
const INC_TOUS = AXES.filter((f) => TOUS.every((n) => SIM[n].inc.includes(f)));
// Écart au Nelson, en crans du style, sur les familles connues des deux.
const ECART = Object.fromEntries(CANDIDATS.map((nom) => {
  const fs = AXES.filter((f) => !SIM[nom].inc.includes(f) && !SIM[CIBLE].inc.includes(f));
  const e = fs.reduce((s, f) => s + Math.abs(SIM[nom].delta[f] - SIM[CIBLE].delta[f]) / PF[f].cran, 0) / fs.length;
  // La famille qui l'éloigne le plus.
  const pire = fs.map((f) => [f, (SIM[nom].delta[f] - SIM[CIBLE].delta[f]) / PF[f].cran]).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))[0];
  return [nom, { e, n: fs.length, pire }];
}));
const PROCHE = [...CANDIDATS].sort((a, b) => ECART[a].e - ECART[b].e)[0];

// ---------- les mots des fiches, et la part « autres » (option B) ----------
const B = D.descripteurs.B;
const EQUIV = { 'white wine': 'vin blanc', grape: 'raisin', gooseberry: 'groseille à maquereau' }; // doublons anglais des mêmes concepts
const MOTS = Object.fromEntries(TOUS.map((nom) => {
  const h = H[nom];
  const par = AXES.map((f) => { const a = h.aromes.find((x) => x.family === f); return [f, a ? a.mots.reduce((s, m) => s + m.mots.length, 0) : 0]; }).filter(([, n]) => n > 0);
  const tot = par.reduce((s, [, n]) => s + n, 0);
  const p = B.parts[nom];
  const autres = p.visible ? p.partDessinee : 0;
  const concepts = [...new Set(p.concepts.map((c) => EQUIV[c] || c))];
  return [nom, { segs: par.map(([f, n]) => ({ f, w: (n / tot) * (1 - autres) })), autres, part: p.part, concepts }];
}));

// ---------- le radar r2 : une fonction, servie à Node et à la page ----------
const RD = {
  axes: AXES, court: Object.fromEntries(AXES.map((f) => [f, COURT[f]])), cran: Object.fromEntries(AXES.map((f) => [f, PF[f].cran])), bande: Object.fromEntries(AXES.map((f) => [f, PF[f].bande[1]])),
  incTous: INC_TOUS, cible: CIBLE, candidats: CANDIDATS, acc: ACC, ordre: D.style.ordre, attendues: Object.keys(D.style.zone).filter((f) => D.style.zone[f].statut === 'attendue'),
  tons: Object.fromEntries(AXES.map((f) => [f, JET[f]])),
  series: Object.fromEntries(TOUS.map((n) => [n, { c: HOPS[n].couleur, ap: SIM[n].ap, inc: SIM[n].inc }])),
};
function radarSVG(RD, focus, abs) {
  const W = 358, Hh = 318, cx = 179, cy = 160, R = 108, MAXC = 4.5, n = RD.axes.length, pas = (2 * Math.PI) / n;
  const r = (f, v) => (abs ? Math.min(v, 100) / 100 : Math.min(v / RD.cran[f], MAXC) / MAXC) * R;
  const P = (k, rr) => [cx + Math.sin(k * pas) * rr, cy - Math.cos(k * pas) * rr];
  const pt = (q) => q[0].toFixed(1) + ',' + q[1].toFixed(1);
  let s = '<svg class="rad" width="' + W + '" height="' + Hh + '" viewBox="0 0 ' + W + ' ' + Hh + '" data-radar data-objet="houblons" data-axes="' + RD.axes.join(',') + '" role="img" aria-label="Radar ' + (abs ? 'absolu' : 'au style') + ' : ' + RD.cible + ' en contour graphite, la cible ; ' + focus + ' plein, avec sa plage de bas à haut ; à 4 g/L, simulé">';
  s += '<defs><pattern id="hach-r" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="#c9c9d1" stroke-width="1.2"/></pattern></defs>';
  RD.axes.forEach((f, k) => { if (!RD.incTous.includes(f)) return; const a = P(k - 0.5, R), b = P(k + 0.5, R); s += '<path d="M' + cx + ',' + cy + 'L' + pt(a) + 'A' + R + ',' + R + ' 0 0 1 ' + pt(b) + 'Z" fill="url(#hach-r)" data-role="inconnu"/>'; });
  // La zone du style (au style : 3 crans partout ; absolu : la bande de la 16D sur 0–100).
  s += '<polygon data-role="zone" points="' + RD.axes.map((f, k) => pt(P(k, abs ? (RD.bande[f] / 100) * R : (3 / MAXC) * R))).join(' ') + '" fill="#efeaf6" stroke="#8f86a3" stroke-width="1.2"/>';
  const anneaux = abs ? [25, 50, 75, 100].map((v) => (v / 100) * R) : [1, 2, 3, 4].map((c) => (c / MAXC) * R);
  for (const a of anneaux) s += '<polygon points="' + RD.axes.map((f, k) => pt(P(k, a))).join(' ') + '" fill="none" stroke="#dcdce3" stroke-width="1"/>';
  s += '<polygon points="' + RD.axes.map((f, k) => pt(P(k, R))).join(' ') + '" fill="none" stroke="#c4c4cc" stroke-width="1"/>';
  RD.axes.forEach((f, k) => { const e = P(k, R); s += '<line x1="' + cx + '" y1="' + cy + '" x2="' + e[0].toFixed(1) + '" y2="' + e[1].toFixed(1) + '" stroke="#e2e2e8" stroke-width="1"/>'; });
  const S = RD.series[focus];
  // La plage du houblon mis en avant : de bas à haut, sur les familles connues.
  // La plage du houblon mis en avant, de bas à haut : un trait épais pâle sur chaque axe connu ; une
  // flèche quand le haut dépasse le bord (rien n'est rogné en silence).
  s += '<g data-role="intervalle">';
  RD.axes.forEach((f, k) => {
    if (S.inc.includes(f)) return;
    const a = P(k, r(f, S.ap[f][0])), b = P(k, r(f, S.ap[f][2]));
    s += '<line x1="' + a[0].toFixed(1) + '" y1="' + a[1].toFixed(1) + '" x2="' + b[0].toFixed(1) + '" y2="' + b[1].toFixed(1) + '" stroke="' + S.c + '" stroke-opacity="0.22" stroke-width="4" stroke-linecap="round"/>';
    const deb = abs ? S.ap[f][2] > 100 : S.ap[f][2] / RD.cran[f] > MAXC;
    if (deb) { const e = P(k, R + 3), g1 = P(k - 0.06, R - 6), g2 = P(k + 0.06, R - 6); s += '<polygon points="' + pt(e) + ' ' + pt(g1) + ' ' + pt(g2) + '" fill="' + S.c + '" fill-opacity="0.6"/>'; }
  });
  s += '</g>';
  const poly = (nom) => { const X = RD.series[nom]; return RD.axes.map((f, k) => k).filter((k) => !X.inc.includes(RD.axes[k])).map((k) => pt(P(k, r(RD.axes[k], X.ap[RD.axes[k]][1])))).join(' '); };
  const vals = (nom) => RD.axes.map((f) => (RD.series[nom].inc.includes(f) ? 0 : Math.round(RD.series[nom].ap[f][1] * 10) / 10)).join(',');
  const g = (nom, attrs) => '<g data-serie="' + nom + '" data-couleur="' + RD.series[nom].c + '" data-valeurs="' + vals(nom) + '" data-inconnues="' + RD.series[nom].inc.join(',') + '"><polygon points="' + poly(nom) + '" ' + attrs + ' stroke-linejoin="round"/></g>';
  for (const nom of RD.candidats) if (nom !== focus) s += g(nom, 'fill="none" stroke="' + RD.series[nom].c + '" stroke-width="1.5" stroke-opacity="0.5"');
  s += g(focus, 'fill="' + S.c + '" fill-opacity="0.26" stroke="' + S.c + '" stroke-width="3"');
  s += g(RD.cible, 'fill="none" stroke="' + RD.series[RD.cible].c + '" stroke-width="3"');
  // Familles inconnues pour la cible ou le houblon en avant, connues ailleurs : « ? » sur l'axe, jamais 0.
  RD.axes.forEach((f, k) => {
    if (RD.incTous.includes(f)) return;
    [[RD.cible, 20], [focus, 34]].forEach(([nom, rr]) => { if (!RD.series[nom].inc.includes(f)) return; const q = P(k, rr); s += '<use href="#i-inconnu-12" x="' + (q[0] - 6).toFixed(1) + '" y="' + (q[1] - 6).toFixed(1) + '" width="12" height="12" style="color:' + RD.series[nom].c + '"/>'; });
  });
  // Les sommets du houblon en avant et de la cible.
  for (const [nom, rp, plein] of [[focus, 3.2, true], [RD.cible, 3, false]]) kcOf(nom).forEach((k) => { const q = P(k, r(RD.axes[k], RD.series[nom].ap[RD.axes[k]][1])); s += '<circle cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1) + '" r="' + rp + '" fill="' + (plein ? RD.series[nom].c : '#fff') + '" stroke="' + RD.series[nom].c + '" stroke-width="2"/>'; });
  function kcOf(nom) { return RD.axes.map((f, k) => k).filter((k) => !RD.series[nom].inc.includes(RD.axes[k])); }
  // Étiquettes : picto au trait et nom ; orangé si le houblon en avant sort de la 16D ; « ? » si inconnue.
  RD.axes.forEach((f, k) => {
    const q = P(k, R + 13), dx = q[0] - cx, ta = Math.abs(dx) < 8 ? 'middle' : dx > 0 ? 'start' : 'end';
    const hors = !S.inc.includes(f) && S.ap[f][1] > RD.bande[f];
    const inc = RD.incTous.includes(f);
    const col = hors ? RD.acc : inc ? '#6b6b76' : '#4a4a55';
    let tx = q[0], ux;
    if (ta === 'start') { ux = q[0]; tx = q[0] + 16; } else if (ta === 'end') { ux = q[0] - 14; tx = q[0] - 17; } else ux = q[0] - 7;
    const uy = ta === 'middle' ? (q[1] < cy ? q[1] - 22 : q[1] + 4) : q[1] - 7;
    s += '<use href="#p-' + f + '" x="' + ux.toFixed(1) + '" y="' + uy.toFixed(1) + '" width="14" height="14"/>';
    s += '<text x="' + tx.toFixed(1) + '" y="' + (ta === 'middle' && q[1] > cy ? q[1] + 30 : q[1] + 4).toFixed(1) + '" text-anchor="' + ta + '" font-size="12" fill="' + col + '"' + (hors ? ' font-weight="700"' : '') + '>' + RD.court[f] + (inc ? '?' : '') + '</text>';
  });
  return s + '</svg>';
}

// ---------- les barres de l5b, sous le radar : famille par famille, Nelson (contour) contre le houblon
// en avant (plein), au style (3 crans = la zone de la 16D, orangé au-delà) ou en absolu (0–100).
// Dans l'ordre du style : d'abord ce que la 16D attend (floral, herbacé, terreux). Sans mot : le picto
// de la famille dessous, le nom est sur le radar juste au-dessus. ---------- */
function barresHTML(RD, focus, abs) {
  const HB = 72, PXC = 16, cl = (v, a, b) => Math.max(a, Math.min(b, v));
  const h = (f, v) => (abs ? cl(v * 0.72, 0, HB) : cl((v / RD.cran[f]) * PXC, 0, HB));
  const zone = (f) => (abs ? RD.bande[f] * 0.72 : 3 * PXC);
  const S = RD.series[focus], N = RD.series[RD.cible];
  return '<div class="bx" role="img" aria-label="Barres, famille par famille : ' + RD.cible + ' en contour, ' + focus + ' plein ; simulé à 4 g/L">' + RD.ordre.map((f) => {
    const iN = N.inc.includes(f), iS = S.inc.includes(f);
    const vN = N.ap[f][1], vS = S.ap[f][1], z = zone(f);
    const bar = (inc, v, cls, c) => inc ? '<i class="bx-b ' + cls + ' bx-inc" style="height:' + z + 'px" data-inconnu="inconnu"></i>'
      : '<i class="bx-b ' + cls + '" data-nature="simule" style="height:' + Math.max(2, h(f, v)).toFixed(1) + 'px;--c:' + c + '">' + (h(f, v) > z ? '<i class="bx-x" style="height:' + (Math.min(h(f, v), HB) - z).toFixed(1) + 'px"></i>' : '') + '</i>';
    const deb = (!iS && (abs ? vS > 100 : vS / RD.cran[f] > HB / PXC)) || (!iN && (abs ? vN > 100 : vN / RD.cran[f] > HB / PXC));
    return '<span class="bx-c' + (RD.attendues.includes(f) ? ' att' : '') + '" data-f="' + f + '"><span class="bx-z" style="--t:' + RD.tons[f].texte + ';--fd:' + RD.tons[f].fond + '"><i class="bx-zone" data-role="zone" style="height:' + z.toFixed(1) + 'px"></i>'
      + bar(iN, vN, 'n', RD.series[RD.cible].c) + bar(iS, vS, 's', S.c) + (deb ? '<i class="bx-fl"></i>' : '') + '</span>'
      + '<svg class="pi" width="16" height="16" data-famille="' + f + '" role="img" aria-label="' + RD.court[f] + '"><use href="#p-' + f + '"/></svg></span>';
  }).join('') + '</div>';
}

// ---------- morceaux de page ----------
const alphaDe = (nom) => {
  const A = HOPS[nom].alpha;
  if (A.lot != null) return `<span class="al lot${A.horsFiches ? ' hors' : ''}" data-role="alpha" data-source="lot" data-nature="mesure" aria-label="α du lot en stock : ${fr(A.lot)} %${A.horsFiches ? ', hors des plages de ses fiches (' + fr(A.fiches[0]) + '–' + fr(A.fiches[1]) + ' %)' : ''}">${fr(A.lot)}%${A.horsFiches ? ic('diff', 12) : ''}</span>`;
  return `<span class="al fi" data-role="alpha" data-source="fiches" data-nature="mesure" aria-label="α des fiches : ${fr(A.fiches[0])} à ${fr(A.fiches[1])} %">${ic('livre', 12)}${fr(A.fiches[0])}–${fr(A.fiches[1])}%</span>`;
};
const barreMots = (nom) => {
  const M = MOTS[nom];
  const segs = M.segs.map((s) => `<i class="mb-s" style="flex:${s.w.toFixed(3)};background:${JET[s.f].base}" data-famille="${s.f}" aria-hidden="true"></i>`).join('');
  const aut = M.autres ? `<i class="mb-a" data-role="autres" data-houblon="${esc(nom)}" data-part="${fr(M.autres, 2)}" style="flex:${M.autres.toFixed(3)}" role="img" aria-label="autres : ${Math.round(M.part * 100)} % de ses mots hors des 12 familles, dessinés ${Math.round(M.autres * 100)} %"></i>` : '';
  return `<span class="mb" role="img" aria-label="Mots des fiches de ${esc(nom)}">${aut}${segs}</span>`;
};
const motsAutres = (nom) => (MOTS[nom].autres ? `<span class="mb-t"><b>autres</b> ${Math.round(MOTS[nom].part * 100)}%</span>` : `<span class="mb-t" aria-hidden="true"></span>`);
const echelleEcart = 1.5;
const ecartCell = (nom) => {
  const E = ECART[nom], x = Math.min(E.e / echelleEcart, 1) * 100;
  return `<span class="ec" data-nature="simule" aria-label="${esc(nom)} : ~${fr(E.e)} cran d'écart moyen au Nelson Sauvin, sur ${E.n} familles connues des deux ; simulé"><span class="ec-p"><i class="ec-z"></i><i class="ec-d" style="left:${x.toFixed(1)}%;background:${HOPS[nom].couleur}"></i></span><span class="ec-v mono">~${fr(E.e)}</span></span>`;
};
const colCible = () => `<div class="col cible" data-col="${esc(CIBLE)}">
  <div class="tete"><span class="pas-stock">${ic('achat', 14)}<span>pas en stock</span></span>${hn(CIBLE)}${alphaDe(CIBLE)}${usage(CIBLE)}</div>
  <span class="ec ec-cible"><span class="ec-p"><i class="ec-z"></i><i class="ec-d ec-0"></i></span><span class="ec-v">écart</span></span>
  ${barreMots(CIBLE)}${motsAutres(CIBLE)}</div>`;
const colCand = (nom, on) => `<div class="col" data-col="${esc(nom)}">
  <button type="button" class="tete cand" aria-pressed="${on}" data-houblon-btn="${esc(nom)}" style="--hc:${HOPS[nom].couleur}"><span class="stk-mini" role="img" aria-label="en stock">${ic('stock', 12)}</span>${hn(nom)}${alphaDe(nom)}${usage(nom)}</button>
  ${ecartCell(nom)}
  ${barreMots(nom)}${motsAutres(nom)}</div>`;

// ---------- la chimie : enveloppe des plages publiées, par houblon ----------
const enveloppe = (vals) => {
  const v = (vals || []).filter((x) => x.portee === 'variété');
  if (!v.length) return null;
  const mins = v.map((x) => x.plage[0]), maxs = v.map((x) => x.plage[1]);
  return { min: mins.some((m) => m == null) && mins.every((m) => m == null) ? null : Math.min(...mins.filter((m) => m != null)), max: maxs.some((m) => m == null) ? null : Math.max(...maxs), src: [...new Set(v.flatMap((x) => x.sources))], aConfirmer: v.some((x) => x.aConfirmer) };
};
const LIGNES = [
  { k: 'huile', nom: 'Huile totale', unite: 'mL/100 g', fams: [], max: 5 },
  { k: 'humulene', nom: 'Humulène', unite: '% huile', fams: ['resin', 'spice'], sens: 'boisé, épicé', max: 40 },
  { k: 'myrcene', nom: 'Myrcène', unite: '% huile', fams: ['green', 'resin'], sens: 'vert, résineux', max: 70 },
  { k: 'linalol', nom: 'Linalol', unite: '% huile', fams: ['floral', 'citrus'], sens: 'floral, agrumes', max: 1.2 },
  { k: '4MMP', nom: 'Thiol 4MMP', unite: 'µg/kg', fams: ['tropical', 'berries'], sens: 'cassis, passion', max: 20 },
];
const plageDe = (nom, k) => {
  const h = H[nom];
  if (k === 'huile') { const s = h.huiles.totale.sources; return { min: Math.min(...s.map((x) => x.min)), max: Math.max(...s.map((x) => x.max)), srcNoms: s.map((x) => x.source + ' ' + x.annee) }; }
  const c = h.composes.composes[k];
  const e = c && c.valeurs ? enveloppe(c.valeurs) : null;
  if (!e) return { inconnu: true, raison: c ? c.raison : 'non relevé', classe: k === '4MMP' && h.composes.classeHopsteiner ? h.composes.classeHopsteiner[0] : null };
  return { ...e, srcNoms: e.src.map(srcNom) };
};
const cellule = (nom, L) => {
  const p = plageDe(nom, L.k), n = plageDe(CIBLE, L.k);
  const x = (v) => (Math.min(v, L.max) / L.max) * 100;
  const cible = !n.inconnu && nom !== CIBLE ? `<i class="ch-n" style="left:${x(n.min ?? 0).toFixed(1)}%;width:${Math.max(2, x(n.max ?? L.max) - x(n.min ?? 0)).toFixed(1)}%"></i>` : '';
  if (p.inconnu) {
    const cl = p.classe ? 'classe ' + (/^(forte|high)/.test(p.classe.classe) ? 'forte' : p.classe.classe) : 'inconnu';
    return `<div class="ch-c"><span class="ch-p">${cible}<i class="ch-inc"></i></span><span class="inc" data-inconnu="${esc(p.raison || '')}" data-source="${esc(p.classe ? p.classe.sources.join(' ') : 'H')}">${cl}</span></div>`;
  }
  const lo = p.min == null ? 0 : x(p.min), hi = p.max == null ? 100 : x(p.max);
  const txt = p.min == null ? '< ' + fr(p.max, 2) : p.max == null ? '> ' + fr(p.min, 2) : fr(p.min, 2) === fr(p.max, 2) ? fr(p.min, 2) : fr(p.min, 2) + '–' + fr(p.max, 2);
  return `<div class="ch-c"><span class="ch-p">${cible}<i class="ch-b${p.max == null ? ' ouv' : ''}" style="left:${lo.toFixed(1)}%;width:${Math.max(3, hi - lo).toFixed(1)}%;background:${HOPS[nom].couleur}"></i></span><b class="vm" data-nature="mesure" data-source="${esc(p.srcNoms.join(' ; '))}" aria-label="${esc(nom)}, ${L.nom} : ${txt} ${L.unite} (${esc(p.srcNoms.join(', '))})">${txt}${p.aConfirmer ? ' ?' : ''}</b></div>`;
};
const chimie = () => LIGNES.map((L) => `<div class="ch-l" data-compose="${L.k}">
  <div class="ch-t">${L.fams.map((f) => pic(f, 14)).join('')}<span class="ch-nom">${L.nom}</span><span class="gris">${L.unite}${L.sens ? ' · ' + L.sens : ''}</span></div>
  <div class="ch-g">${TOUS.map((nom) => cellule(nom, L)).join('')}</div></div>`).join('');
const sourcesChimie = () => {
  const s = new Set();
  for (const L of LIGNES) for (const nom of TOUS) { const p = plageDe(nom, L.k); (p.srcNoms || []).forEach((x) => s.add(x)); }
  return [...s].join(' · ');
};

// ---------- le panel OSU (Cascade, mesuré), sans molette ----------
const osu = () => {
  const P = D.panelOSU, W = 200, Hh = 92, X = (d) => 8 + (d / 16) * (W - 70), Y = (v) => Hh - 12 - (v / 15) * (Hh - 22);
  const ligne = (k, c, plein) => `<polyline points="${P.doses.map((d, i) => X(d).toFixed(1) + ',' + Y(P[k][i]).toFixed(1)).join(' ')}" fill="none" stroke="${c}" stroke-width="1.6"/>` + P.doses.map((d, i) => `<circle cx="${X(d).toFixed(1)}" cy="${Y(P[k][i]).toFixed(1)}" r="2.8" fill="${plein ? c : '#fff'}" stroke="${c}" stroke-width="1.5"/>`).join('');
  return `<svg class="osu" width="${W}" height="${Hh}" viewBox="0 0 ${W} ${Hh}" role="img" aria-label="Panel OSU, Cascade, notes sur 15 : agrumes ${P.agrumes.map((v) => fr(v)).join(', ')} ; herbacé et thé ${P.herbaceThe.map((v) => fr(v)).join(', ')}, aux doses ${P.doses.map((v) => fr(v, 2)).join(', ')} g/L">
  <line x1="8" y1="${Hh - 12}" x2="${W - 62}" y2="${Hh - 12}" stroke="#c4c6ce"/>
  <rect x="${X(P.zone[0]).toFixed(1)}" y="6" width="${(X(P.zone[1]) - X(P.zone[0])).toFixed(1)}" height="${Hh - 18}" fill="#f1eff6"/>
  <line x1="${X(EG.dose_gL).toFixed(1)}" y1="4" x2="${X(EG.dose_gL).toFixed(1)}" y2="${Hh - 12}" stroke="#16161a" stroke-width="1.5"/>
  ${ligne('agrumes', JET.citrus.texte, true)}${ligne('herbaceThe', JET.herbal.texte, false)}
  <text x="${W - 58}" y="${(Y(P.agrumes[4]) + 4).toFixed(1)}" font-size="12" fill="${JET.citrus.texte}">agrumes</text>
  <text x="${W - 58}" y="${(Y(P.herbaceThe[4]) + 4).toFixed(1)}" font-size="12" fill="${JET.herbal.texte}">herbacé</text>
  <text x="8" y="${Hh}" font-size="12" fill="#55555f">0</text><text x="${(X(EG.dose_gL) - 4).toFixed(1)}" y="${Hh}" font-size="12" fill="#16161a">4</text><text x="${(X(16) - 10).toFixed(1)}" y="${Hh}" font-size="12" fill="#55555f">16 g/L</text>
</svg>`;
};

// ---------- les vraies valeurs en bière (sous un toucher) ----------
const E = (id) => { for (const h of D.houblons) { const p = h.panels.find((x) => x.id === id); if (p) return p; } return null; };
const E06 = E('E06'), E03 = E('E03'), E09 = E('E09');
const m06 = (v, c) => E06.mesures.find((m) => m.variete === v && m.compose === c);
const PAIRES = ['myrcène', 'linalol', 'géraniol'].map((c) => ({ c, n: m06('Nelson Sauvin', c), t: m06('témoin (sans houblon)', c) })).filter((x) => x.n && x.t);
const FAM_C = { 'myrcène': 'resin', linalol: 'floral', 'géraniol': 'floral' };
const valeursBiere = () => {
  const max = Math.max(...PAIRES.map((x) => x.n.valeur));
  const rows = PAIRES.map((x) => `<div class="ligne vb">${pic(FAM_C[x.c], 14)}<span class="vb-n">${x.c}</span>
    <span class="vb-p"><i class="vb-t" style="width:${((x.t.valeur / max) * 100).toFixed(1)}%"></i><i class="vb-b" style="width:${((x.n.valeur / max) * 100).toFixed(1)}%"></i></span>
    <b class="vm" data-nature="mesure" data-source="E06 · Feng 2015">${fr(x.n.valeur)} µg/L</b><span class="gris">sans houblon ${fr(x.t.valeur)}</span></div>`).join('');
  const i7 = E03.mesures.find((m) => m.variete === 'Idaho-7' && m.compose === 'linalol');
  return `${rows}
  <p class="src">Nelson Sauvin en bière, dose et durée non publiées : E06 · Feng 2015 (diapositives).</p>
  <div class="ligne vb"><span class="vb-n"><b>Idaho 7</b> linalol</span><b class="vm" data-nature="mesure" data-source="E03 · McCabe 2023">${fr(i7.valeur * 1000)} µg/L</b><span class="gris">au pitch, 14 j · E03 · McCabe 2023 · à vérifier</span></div>
  <p class="trou">${ic('inconnu', 14)}<span><b>Les quatre à 4 g/L, 3 j :</b> une seule étude, E09 · Sharp 2018, en figure, sans chiffre repris. Cascade et Galaxy en bière : inconnu, pas 0.</span></p>`;
};

// ---------- légende (derrière « ? ») ----------
const LEG_RADAR = ['Le radar', [
  li(`<span class="lg-l" style="border-color:${GRAPHITE}"></span>`, 'Nelson Sauvin : la cible, en contour'),
  li(`<span class="lg-p"></span>`, 'plein : le houblon touché, ~ simulé à 4 g/L'),
  li(`<span class="lg-i"></span>`, 'pâle autour : de bas à haut, ~'),
  li(`<span class="lg-zn"></span>`, 'mauve : la zone de la 16D (au style : 3 crans)'),
  li(`<span class="lg-hc"></span>`, 'hachuré, « ? » : inconnu, pas zéro'),
  li(`<b style="color:${ACC}">Résineux</b>`, 'orangé : au-delà de la 16D'),
], true];
const LEG_COL = ['Les colonnes', [
  li('<span class="lg-ec"><i></i></span>', 'écart moyen au Nelson, en crans du style, ~ simulé ; à gauche, plus proche'),
  li('<b class="nw">' + Math.round((1 - H[CIBLE].partSansFamille) * 100) + ' %</b>', 'des mots de Nelson Sauvin vus par le moteur (agrumes, épicé) : son radar en dit peu'),
  li(`<span class="mb lg-mb"><i class="mb-a" style="flex:.33"></i><i class="mb-s" style="flex:.67;background:${JET.citrus.base}"></i></span>`, 'mots des fiches par famille ; gris : autres, hors des 12 familles'),
  li(`<span class="lg-stk">${ic('achat', 14)}</span>`, 'pas en stock'),
], true];
const LEG_B = ['Part « autres » (option B)', [
  li('<b class="nw">25 %</b>', 'seuil : dessinée au-delà de 25 % de mots sans famille'),
  li('<b class="nw">33 %</b>', 'plafond du dessin (Nelson Sauvin : 78 % réels)'),
  li('<b>écartés</b>', 'mots génériques : fruité, noble, doux, sucré'),
  li('<span class="a-corr">à corriger</span>', 'réglages proposés par le pilote, à corriger par le brasseur'),
], true];

// ---------- la page ----------
const verdictTxt = () => `<p class="verdict"><b>Aucun</b> ne remplace : <span class="v-autres">${esc(MOTS[CIBLE].concepts.slice(0, 2).join(', '))}</span></p>`;
const corps = `
${barre('Lequel pour ma stout : Cascade, Idaho 7 ou Galaxy ?')}
<p class="ctx" data-role="contexte"><span data-contexte="base">dose égale</span><span data-contexte="dose">${fr(EG.dose_gL)} g/L</span><span data-contexte="moment">après fermentation, ${EG.jours} j</span><span data-contexte="levure">US-05</span></p>
<section class="porte" aria-label="Nelson Sauvin, que tu n'as pas, et les trois candidats">
  <div class="cols" data-libre="houblon" role="group" aria-label="Houblon mis en avant">${colCible()}${CANDIDATS.map((n) => colCand(n, n === PROCHE)).join('')}</div>
  ${verdictTxt()}
</section>
<section class="carte radar-c" data-acquis="radar" aria-label="Radar">
  <div class="rad-t"><span class="sim-tag">~ simulé</span><span class="rad-q"></span><span data-lecture>${lentille()}</span></div>
  <div id="radar">${radarSVG(RD, PROCHE, false)}</div>
  <div id="barres">${barresHTML(RD, PROCHE, false)}</div>
</section>
<section class="carte" data-acquis="chimie" aria-label="Le cône, publié">
  <h2 class="sec-t">Le cône</h2>
  <div class="ch-tete">${TOUS.map((n) => `<span style="color:${HOPS[n].couleur}">${esc(n)}</span>`).join('')}</div>
  ${chimie()}
  <p class="src">Bière noire : perception non mesurée (H39, H40). Plage de la plus petite à la plus grande valeur publiée : ${esc(sourcesChimie())}.</p>
</section>
<section class="carte osu-c" data-acquis="osu" data-nature="mesure" data-source="${esc(D.panelOSU.sources.join(' ') + ' · Lafontaine 2018')}" aria-label="Panel OSU">
  <h2 class="sec-t">Panel OSU, Cascade <small>sur 15, 24 h</small></h2>
  <div class="osu-l">${osu()}<p class="osu-txt"><b class="vm" data-nature="mesure" data-source="H22 · Lafontaine 2018">agrumes ${fr(D.panelOSU.agrumes[2])} à 3,86 g/L</b><br>plafond dès 8 g/L ; l'herbacé monte. H22 · Lafontaine 2018.</p></div>
</section>
<section class="carte">
  <button type="button" class="ouvre" aria-expanded="false" aria-controls="valeurs" data-ouvre-acquis="valeurs">${ic('flacon', 16)}<span>Vraies valeurs en bière</span>${ic('chev-r', 14)}</button>
  <div id="valeurs" data-acquis="valeurs" hidden>${valeursBiere()}</div>
</section>
<nav class="pont" aria-label="Suite"><a href="#" id="pont">${ic('fleche', 16)}<span>Doser <b id="pont-n">${esc(PROCHE)}</b> dans Dryhopper</span></a></nav>
${legende([LEG_COL, LEG_RADAR, LEG_B, LEG_FAMILLES])}`;

const css = `
  .ecran { gap: 8px; }
  .barre h1 { font-size: 16px; }
  .ctx { display: flex; flex-wrap: wrap; gap: 4px; white-space: normal; font: 500 12px var(--sans); }
  .ctx [data-contexte] { display: inline-flex; align-items: center; height: 22px; padding: 0 8px; border-radius: 11px; background: #fff; box-shadow: inset 0 0 0 1px #d6d6de; color: var(--encre); }
  .ctx [data-contexte="base"] { background: var(--encre); color: #fff; box-shadow: none; font-weight: 600; }
  .cols { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; }
  .col { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
  .tete { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; padding: 6px 6px 7px; border-radius: 8px; background: #fff; box-shadow: inset 0 0 0 1px #d6d6de; height: 112px; text-align: left; justify-content: flex-start; position: relative; width: 100%; }
  .cible .tete { background: #f3f3f6; box-shadow: inset 0 0 0 2px ${GRAPHITE}; }
  .tete .hn { font-size: 14px; line-height: 1.1; }
  .cand[aria-pressed="true"] { box-shadow: inset 0 0 0 2.5px var(--hc); background: #fff; }
  .cand[aria-pressed="true"]::after { content: ""; position: absolute; left: 6px; right: 6px; bottom: 0; height: 4px; border-radius: 2px 2px 0 0; background: var(--hc); }
  .cand .hn { color: var(--hc); }
  .stk-mini { position: absolute; top: 6px; right: 6px; color: var(--gris); display: inline-flex; }
  .pas-stock { display: inline-flex; align-items: center; gap: 3px; font-size: 12px; font-weight: 600; color: var(--encre); }
  .tete .al { font: 600 12px var(--mono); display: inline-flex; align-items: center; gap: 2px; }
  .tete .us { font-size: 12px; }
  .ec { display: flex; flex-direction: column; gap: 1px; padding: 0 2px; }
  .ec-p { position: relative; height: 12px; }
  .ec-z { position: absolute; left: 0; right: 0; top: 5px; height: 2px; background: #d6d6de; border-radius: 2px; }
  .ec-d { position: absolute; top: 1px; width: 10px; height: 10px; margin-left: -5px; border-radius: 50%; }
  .ec-0 { left: 5px; background: #fff; box-shadow: inset 0 0 0 2.5px ${GRAPHITE}; }
  .ec-v { font-size: 12px; color: var(--encre); }
  .ec-cible .ec-v { color: var(--gris); }
  .mb { display: flex; height: 10px; border-radius: 2px; overflow: hidden; gap: 1px; background: #fff; }
  .mb-s { display: block; min-width: 2px; }
  .mb-a { display: block; background: ${AUTRES_GRIS}; }
  .mb-t { font-size: 12px; line-height: 1.2; color: var(--encre); }
  .mb-t b { font-weight: 700; color: #4a4a55; }
  .mb-vide { color: var(--gris); }
  .v-autres { font-weight: 600; }
  .bx { display: grid; grid-template-columns: repeat(12, 1fr); gap: 2px; padding: 12px 10px 2px; }
  .bx-c { display: flex; flex-direction: column; align-items: center; gap: 3px; }
  .bx-z { position: relative; width: 24px; height: 72px; border-bottom: 1px solid #c4c4cc; }
  .bx-zone { position: absolute; left: 0; right: 0; bottom: 0; background: var(--fd); border-top: 1.5px solid var(--t); }
  .bx-b { position: absolute; bottom: 0; width: 9px; border-radius: 2px 2px 0 0; overflow: hidden; }
  .bx-b.n { left: 2px; background: #fff; box-shadow: inset 0 0 0 2px var(--c); }
  .bx-b.s { right: 2px; background: var(--c); }
  .bx-x { position: absolute; left: 0; right: 0; top: 0; background: ${ACC}; }
  .bx-b.n .bx-x { left: 2px; right: 2px; top: 2px; }
  .bx-inc { background: repeating-linear-gradient(135deg, #fff 0 2px, #c9c9d1 2px 4px) !important; box-shadow: inset 0 0 0 1px #9a9aa6 !important; }
  .bx-fl { position: absolute; left: 50%; top: -6px; margin-left: -4px; border: 4px solid transparent; border-bottom: 5px solid ${ACC}; border-top: 0; }
  .bx-c.att .pi { outline: none; }
  .verdict { font-size: 14px; line-height: 1.25; padding: 2px 2px 0; }
  .radar-c { padding: 8px 0 16px; }
  .rad-t { display: flex; align-items: center; gap: 6px; padding: 0 10px; flex-wrap: wrap; }
  .rad-q { font-size: 13px; font-weight: 600; flex: 1; }
  .sim-tag { display: inline-flex; align-items: center; height: 20px; padding: 0 6px; border-radius: 10px; font-size: 12px; font-weight: 600; box-shadow: inset 0 0 0 1px #8a8a96; }
  .rad { display: block; margin: 0 auto; }
  .flag { display: flex; gap: 6px; align-items: flex-start; font-size: 12px; line-height: 1.3; color: var(--encre); }
  .flag .ic { margin-top: 1px; color: var(--gris); }
  .ch-tete, .ch-g { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; }
  .ch-tete span { font-size: 12px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ch-l { display: flex; flex-direction: column; gap: 3px; padding: 6px 0 4px; border-top: 1px solid var(--trait); }
  .ch-t { display: flex; align-items: center; gap: 4px; font-size: 12px; flex-wrap: wrap; }
  .ch-nom { font-weight: 700; font-size: 13px; }
  .ch-c { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .ch-p { position: relative; height: 10px; background: #f3f3f6; border-radius: 2px; }
  .ch-n { position: absolute; top: 0; bottom: 0; background: #c6c6ce; border-radius: 2px; }
  .ch-b { position: absolute; top: 2px; height: 6px; border-radius: 2px; }
  .ch-b.ouv { -webkit-mask: linear-gradient(90deg, #000 70%, transparent); mask: linear-gradient(90deg, #000 70%, transparent); }
  .ch-inc { position: absolute; inset: 0; border-radius: 2px; background: repeating-linear-gradient(135deg, #fff 0 3px, #dcdce3 3px 5px); }
  .ch-c .vm { font: 600 12px var(--mono); }
  .ch-c .inc { font-size: 12px; align-self: flex-start; }
  .osu-l { display: flex; gap: 8px; align-items: center; }
  .osu-txt { font-size: 12px; line-height: 1.35; }
  .ouvre { display: flex; align-items: center; gap: 6px; min-height: 32px; font-size: 14px; font-weight: 700; width: 100%; }
  .ouvre > span { flex: 1; text-align: left; }
  .ouvre[aria-expanded="true"] .ic:last-child { transform: rotate(90deg); }
  #valeurs { display: flex; flex-direction: column; gap: 6px; padding-top: 6px; }
  #valeurs[hidden] { display: none; }
  .vb { display: grid; grid-template-columns: 16px 74px 1fr auto; align-items: center; gap: 6px; font-size: 12px; }
  .vb:has(> .vb-n:first-child) { grid-template-columns: 96px auto 1fr; }
  .vb-p { position: relative; height: 12px; }
  .vb-t, .vb-b { position: absolute; left: 0; border-radius: 2px; }
  .vb-b { top: 0; height: 12px; background: ${GRAPHITE}; opacity: .85; }
  .vb-t { top: 3px; height: 6px; background: #fff; box-shadow: inset 0 0 0 1.5px #8a8a96; z-index: 1; }
  .vb .gris { grid-column: 3 / -1; font-size: 12px; }
  .vb .vm { font: 600 12px var(--mono); white-space: nowrap; }
  .pont a { display: flex; align-items: center; gap: 6px; height: 36px; padding: 0 12px; border-radius: 18px; background: var(--encre); color: #fff; font-size: 14px; text-decoration: none; justify-content: center; }
  .pont a b { font-weight: 700; }
  .lg-l { width: 22px; height: 12px; border: 3px solid; border-radius: 2px; display: inline-block; }
  .lg-p { width: 22px; height: 12px; background: rgba(120,24,56,.3); box-shadow: inset 0 0 0 2px #781838; border-radius: 2px; display: inline-block; }
  .lg-i { width: 22px; height: 12px; background: rgba(120,24,56,.13); border-radius: 2px; display: inline-block; }
  .lg-zn { width: 22px; height: 12px; background: #efeaf6; box-shadow: inset 0 0 0 1px #8f86a3; border-radius: 2px; display: inline-block; }
  .lg-hc { width: 22px; height: 12px; background: repeating-linear-gradient(135deg, #fff 0 3px, #c9c9d1 3px 5px); border-radius: 2px; display: inline-block; }
  .lg-ec { position: relative; width: 30px; height: 12px; display: inline-block; } .lg-ec i { position: absolute; left: 8px; top: 1px; width: 10px; height: 10px; border-radius: 50%; background: #781838; }
  .lg-mb { width: 36px; }
  .nw { white-space: nowrap; }
  .lg-stk { display: inline-flex; color: var(--gris); }
  .a-corr { font-size: 12px; font-weight: 700; color: var(--encre); padding: 0 4px; border-radius: 2px; box-shadow: inset 0 0 0 1px #8a8a96; }
  .f-autres { display: flex; flex-direction: column; gap: 3px; margin: 2px 0; }
  .f-autres .mb { height: 12px; }
  .f-autres p { font-size: 12px; line-height: 1.25; }`;

// Le script : radar au toucher, lentille, vraies valeurs, part « autres » dans la fiche.
const js = `
const RD = ${JSON.stringify(RD)};
const MOTSB = ${JSON.stringify(Object.fromEntries(TOUS.map((n) => [n, { ...MOTS[n], tons: Object.fromEntries(MOTS[n].segs.map((s) => [s.f, JET[s.f].base])) }])))};
const radarSVG = ${radarSVG.toString()};
const barresHTML = ${barresHTML.toString()};
const ETAT = { focus: ${JSON.stringify(PROCHE)} };
const dessiner = () => {
  document.getElementById('radar').innerHTML = radarSVG(RD, ETAT.focus, document.body.classList.contains('abs'));
  document.getElementById('barres').innerHTML = barresHTML(RD, ETAT.focus, document.body.classList.contains('abs'));
  document.getElementById('pont-n').textContent = ETAT.focus;
  document.querySelectorAll('[data-houblon-btn]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.houblonBtn === ETAT.focus)));
};
document.querySelectorAll('[data-houblon-btn]').forEach((b) => b.addEventListener('click', () => { ETAT.focus = b.dataset.houblonBtn; dessiner(); }));
document.querySelectorAll('.lentille [data-e]').forEach((b) => b.addEventListener('click', () => setTimeout(dessiner, 0)));
{ const m = location.search.match(/[?&]focus=([^&]+)/); if (m && RD.candidats.includes(decodeURIComponent(m[1]))) { ETAT.focus = decodeURIComponent(m[1]); } }
dessiner();
const OUV = document.querySelector('[aria-controls="valeurs"]'), VAL = document.getElementById('valeurs');
OUV.addEventListener('click', () => { VAL.hidden = !VAL.hidden; OUV.setAttribute('aria-expanded', String(!VAL.hidden)); });
if (/[?&]valeurs\\b/.test(location.search)) OUV.click();
/* La fiche (appui long) : la ligne « sans famille » devient la part « autres » dessinée (option B). */
const autresFiche = () => {
  const fe = document.querySelector('#fiche-racine .f-fiche'); if (!fe || fe.querySelector('.f-autres')) return;
  const nom = (fe.querySelector('.f-nom') || {}).textContent; const M = MOTSB[nom]; if (!M) return;
  const sans = fe.querySelector('.f-lab-sans');
  const z = document.createElement('div'); z.className = 'f-autres';
  if (M.autres) {
    z.setAttribute('data-houblon', nom);
    z.innerHTML = '<span class="mb">' + '<i class="mb-a" data-role="autres" data-houblon="' + nom + '" data-part="' + String(M.autres).replace('.', ',') + '" style="flex:' + M.autres + '" role="img" aria-label="autres : ' + Math.round(M.part * 100) + ' % de ses mots hors familles"></i>'
      + M.segs.map((s) => '<i class="mb-s" style="flex:' + s.w + ';background:' + M.tons[s.f] + '"></i>').join('') + '</span><p><b>autres</b> ' + M.concepts.join(', ') + '</p>';
    if (sans) sans.replaceWith(z); else { const l = fe.querySelector('[data-role="fiche-labels"]'); if (l) l.append(z); }
  } else if (sans) sans.remove();
};
new MutationObserver(autresFiche).observe(document.getElementById('fiche-racine'), { childList: true, subtree: true });
autresFiche();`;

const html = page({ titre: 'Lequel pour ma stout : Cascade, Idaho 7 ou Galaxy ? (r6h, sans Nelson Sauvin)', desc: 'Lot 22 · r6h · Je n\'ai pas Nelson Sauvin · radar r2, dose égale, porte Nelson Sauvin, descripteurs B', css, corps, js });
fs.writeFileSync(path.join(ici, 'etat.html'), html);
console.log('écrit r6h/etat.html (' + html.length + ' o) · plus proche : ' + PROCHE + ' · écarts ' + CANDIDATS.map((n) => n + ' ' + fr(ECART[n].e, 2) + ' (' + ECART[n].n + ' fam., pire ' + ECART[n].pire[0] + ' ' + fr(ECART[n].pire[1], 2) + ')').join(' ; '));
