// Lot 18 · l5e : l5b TEL QUEL (deux tuiles par rangée, widgets de groupe et de geste), avec tous les
// retours de l5d (D87 à D93) : pictos au trait, α, usage en mot, légende derrière « ? », pas de bande
// d'axe, fiche au langage de la page. Pour tenir en deux colonnes (consigne du pilote, dans l'ordre) :
//   - sur la tuile, l'α du lot seul (« α 8,1% », ≠ s'il sort des fiches) ; la plage des fiches et
//     « pellets » vont dans la fiche ; un houblon sans lot montre la plage seule, avec un % ;
//   - l'usage en pastille courte « amer », « arôme », « mixte », pâle si déduit (comme l8h).
// Copie de ../l5d/tuiles-l5d.mjs (laissé intact), mêmes données : ../l5/donnees-l5-l6.mjs.
import fs from 'node:fs';
import * as K from '../l5/donnees-l5-l6.mjs';
export { K };
const { C, J, V, OB, OBJ, ORDRE, NOM, COURT, DB, SYM, ico, esc, fr, sg, pc, cl, cran, zone, viseeS, viseeA, niv, NIVMOT, crOf, arr, nomVoie, momentDe, MOMENT, usageDe, STOCK_MOT, STOCK_ICO, bioDe, AJOUTEES, COUL_H, DEG, crTxt } = K;
export const rgba = (hex, a) => { const v = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)); return `rgba(${v.join(',')},${a})`; };

// ---------- icônes d'action en plus (lucide-react 1.39.0, comme l8e) ----------
function lucide(nom) {
  const t = fs.readFileSync(K.REPO + '/node_modules/lucide-react/dist/esm/icons/' + nom + '.mjs', 'utf8').match(/const __iconNode = (\[[\s\S]*?\]);\nconst/)[1];
  const nodes = new Function('return ' + t)();
  return nodes.map(([tag, a]) => '<' + tag + ' ' + Object.entries(a).filter(([k]) => k !== 'key').map(([k, v]) => k + '="' + v + '"').join(' ') + '/>').join('');
}
SYM['i-livre'] = lucide('book-open');
SYM['i-diff'] = lucide('equal-not');
SYM['i-aide'] = lucide('circle-question-mark');

// ---------- D88 : les pictos d'arôme au trait de l2 Carnet, un seul <symbol> par famille ----------
// Le dessin v3 de fils17-standard, au ton texte de chaque famille, un trait de 1,6 px rendu à toute taille
// (vector-effect), un crayon léger (déplacement 0,8, sans flou) ; plus de disque pâle ni de halo.
const net = (inner) => inner.replace(/<(path|circle|ellipse|line|rect|polyline|polygon)\b/g, '<$1 vector-effect="non-scaling-stroke"');
const CRAYON = '<filter id="crayon" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="7"/><feDisplacementMap in="SourceGraphic" scale="0.8"/></filter>';
export const SPRITE = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>${CRAYON}</defs>${ORDRE.map((f) => `<symbol id="p-${f}" viewBox="0 0 24 24" fill="none" stroke="${J[f].texte}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><g filter="url(#crayon)">${net(SYM['p-' + f])}</g></symbol>`).join('')}</svg>`;
export const picto = (f, size = 14, o = {}) => `<svg class="pi${o.cls ? ' ' + o.cls : ''}" width="${size}" height="${size}" data-famille="${f}" role="img" aria-label="${NOM[f]}"><use href="#p-${f}"/></svg>`;
const lum = (h) => { const v = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
export const cr = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

// ---------- D90 : l'usage en mot ; D87 : l'α du lot, puis la plage des fiches ----------
export const USAGE_MOT = { amérisant: 'amer', aromatique: 'arôme', double: 'mixte', inconnu: 'inconnu' };
const USAGE_LONG = { amérisant: 'amérisant', aromatique: 'aromatique', double: 'mixte, amérisant et aromatique', inconnu: 'usage inconnu' };
// La pastille courte de l8h : pleine si un fournisseur l'atteste ; déduite de l'α (règle rôle-α encore à
// valider), pâle : un contour seul et le mot en gris (sans opacité, pour garder 4,5:1).
export function usage(h, o = {}) {
  const { u, src } = usageDe(h);
  const dit = src === 'fournisseur' ? 'attesté par le fournisseur' : 'déduit de l\'α, à valider';
  return `<span class="us${src === 'règle' ? ' deduit' : ''}" data-role="usage" data-usage="${u}" data-source="${src}"${o.fiche ? '' : ` data-houblon="${esc(h.houblon)}"`} role="img" aria-label="${esc(h.houblon)} : ${USAGE_LONG[u]}, ${dit}">${USAGE_MOT[u]}</span>`;
}
const pct = (x) => fr(x) + '%';
const plage = (a, b) => (a === b ? pct(a) : fr(a) + '–' + pct(b));
const LIVRE = ico('i-livre', 12), DIFF = ico('i-diff', 12, 'class="dif"');
// Sur la tuile : l'α du lot en stock seul (qui fait la dose), en mono, ≠ s'il sort de ses fiches ; sans lot
// (à acheter), la plage des fiches seule, après un petit livre. La plage, ses sources et « pellets » (Citra
// cryo) sont dans la fiche (c1 : voies[].fiches[].alpha).
export function alpha(h) {
  const A = h.alpha; if (!A) return '';
  const cryo = /cryo$/i.test(h.houblon), base = h.houblon.replace(/\s*cryo$/i, '');
  const hors = A.horsFiches && !cryo && A.lot != null;
  const pl = A.fiches ? plage(A.fiches[0], A.fiches[1]) : '';
  const dit = hors ? ' ; hors des plages de ses fiches (' + pl + ')' : cryo ? ' ; fiches du ' + base + ' en pellets : ' + pl : pl ? ' ; ses fiches : ' + pl : '';
  const lot = A.lot != null ? `<span class="al lot" data-role="alpha" data-source="lot" role="img" aria-label="α du lot en stock : ${fr(A.lot)} %${A.lotSource ? ', ' + A.lotSource : ''}${dit}">${pct(A.lot)}${hors ? DIFF : ''}</span>` : '';
  const fi = A.lot == null && A.fiches ? `<span class="al af" data-role="alpha" data-source="fiches" role="img" aria-label="α de ses fiches : ${pl} ; pas de lot en stock">${LIVRE}${pl}</span>` : '';
  return `<span class="hal" data-houblon="${esc(h.houblon)}">${lot}${fi}</span>`;
}

// ---------- marques ----------
export const chip = (id) => { const m = MOMENT[id]; return `<span class="mo" data-role="moment" data-moment="${id}" aria-label="Moment : ${m.lg}">${ico(m.ic, 14)}<span${/[0-9]/.test(m.t) ? ' class="nb"' : ''}>${m.court || m.t}</span></span>`; };
export const stockMarque = (v) => (v.levureVers ? '' : `<span class="stk" role="img" aria-label="${STOCK_MOT[v.stock]}">${ico(STOCK_ICO[v.stock], 14)}</span>`);
const sel = (nom, X) => (COUL_H[nom] && !X.v.levureVers ? `<i class="sel" data-houblon-compare="${esc(nom)}" data-couleur="${COUL_H[nom]}" style="--h:${COUL_H[nom]}" aria-hidden="true"></i>` : '');
export const plus = (X) => { const { nom } = nomVoie(X.v), on = AJOUTEES.includes(X.n); return `<button class="plus" data-role="ajouter-comparer" aria-pressed="${on}" aria-label="${on ? 'Retirer ' + esc(nom) + ' de la comparaison' : 'Ajouter ' + esc(nom) + ' à la comparaison'}">${ico('i-plus', 16, 'class="i-p"')}${ico('i-check', 16, 'class="i-c"')}</button>`; };
export const dose = (X) => { const { q } = nomVoie(X.v); return X.v.type === 'assemblage' ? '<span class="q">5+5 g ≈</span>' : q ? `<span class="q">${q}</span>` : ''; };
export function bioPill(X) {
  const sig = bioDe(X); if (!sig.length) return '';
  const has = (id) => sig.find((s) => s.id === id);
  let pic = '';
  if (has('geraniol-citronellol')) pic += `<span class="bt">${picto('floral', 14)}${ico('i-arrow-r', 12)}${picto('citrus', 14)}</span>`;
  if (has('thiols')) pic += `<span class="bt">${picto('tropical', 14)}${picto('berries', 14)}</span>`;
  if (has('hop-creep')) pic += '<span class="bt mot">creep</span>';
  const liste = sig.map((s) => `<li><b>${esc(s.titre)}</b> · ${s.statut}. <span class="src">${esc(s.pourquoi)}</span></li>`).join('');
  return `<details class="bio" data-role="bio"><summary aria-label="Biotransformation possible, ampleur non quantifiée : ${sig.map((s) => esc(s.titre)).join(' ; ')}">${pic}</summary><ul>${liste}</ul></details>`;
}
export const ligneHoublon = (X) => (!X.v.levureVers ? ' data-role="ligne-houblon"' : '');
// L'en-tête d'une tuile, comme l5b : les noms, puis la dose, le stock et la biotransformation ; ensuite, pour
// chaque houblon, dans l'ordre des noms, sa pastille d'usage et son α, qui passent à la ligne ensemble.
export function tete(X) {
  const hs = X.v.levureVers ? [] : X.v.fiches || [];
  const noms = hs.length
    ? hs.map((h, i) => `${i ? ' <span class="pl" aria-hidden="true">+</span> ' : ''}${sel(h.houblon, X)}<span data-houblon="${esc(h.houblon)}">${esc(h.houblon)}</span>`).join('')
    : `<span>${esc(X.v.levureVers)}</span>`;
  const hus = hs.map((h) => `<span class="hu">${usage(h)}${alpha(h)}</span>`).join('');
  return `<div class="tl-h"><div class="hbs"><b class="nm">${noms}</b><span class="tl-m">${dose(X)}${stockMarque(X.v)}${bioPill(X)}</span>${hus}</div>${plus(X)}</div>`;
}

// ---------- la barre s5, fine (couloirs de 7 px) ; dans une voie seule, elle porte aussi ses crans ----------
function bar(X, f, e, side, lab = '', crans = false) {
  const s0 = Math.abs(e) / cran(f) / 3 * 100, a0 = Math.abs(e) / 50 * 100, s = Math.min(s0, 100), a = Math.min(a0, 100), n = niv(X.v, f, e);
  const c = crOf(X, f);
  let h = `<i class="cb ${n}${s0 > 100 ? ' ds' : ''}${a0 > 100 ? ' da' : ''}" data-role="effet" data-famille="${f}"${crans && c != null ? ` data-crans="${c}"` : ''} aria-label="${NOM[f]} ${sg(e)}${c != null ? ' (' + crTxt(c) + ')' : ''} · ${NIVMOT[n]}" style="--c:${J[f].base};--cf:${rgba(J[f].base, 0.4)};--s:${pc(s)};--a:${pc(a)}"></i>`;
  if (X.hs.has(f)) {
    const z = zone(f); let q;
    if (z) { const zs = cl(side === 'r' ? z.rS0 : z.lS0), za = cl(side === 'r' ? z.rA0 : z.lA0); q = [Math.min(zs, s), Math.max(0, s - zs), Math.min(za, a), Math.max(0, a - za)]; }
    else q = [Math.max(0, s - 5), Math.min(5, s), Math.max(0, a - 5), Math.min(5, a)];
    h += `<i class="hs" style="--s0:${pc(q[0])};--s1:${pc(q[1])};--a0:${pc(q[2])};--a1:${pc(q[3])}"></i>`;
  }
  if (lab) h += `<span class="cb-l" style="--s:${pc(s)};--a:${pc(a)}">${lab}</span>`;
  return h;
}
const inconnu = (f) => `<i class="cb inconnu" data-role="effet" data-famille="${f}" aria-label="${NOM[f]} : effet non établi"></i>`;
const zt = (f, side) => { const z = zone(f); if (!z) return ''; const s0 = side === 'r' ? z.rS0 : z.lS0, a0 = side === 'r' ? z.rA0 : z.lA0; return `<i class="zt${s0 > 100 ? ' cs' : ''}${a0 > 100 ? ' ca' : ''}" data-role="zone" style="--z:${rgba(J[f].base, 0.55)};--t:${J[f].texte};--s:${pc(cl(s0))};--a:${pc(cl(a0))}"></i>`; };
const arrN = (c) => (Math.abs(c) < 0.5 ? (c < 0 ? '≈ −' : '≈ +') : (c > 0 ? '+' : '−') + Math.round(Math.abs(c)));
export function couloirs(X, o = {}) {
  const e = X.v.effet; let la = '', lb = '', ra = '', rb = '';
  // Coupe 2 (décision du pilote) : « +1 », « +2 », sans le mot « cran » ; la légende dit « un cran du style ».
  const lab = (f) => (o.lab && crOf(X, f) != null ? arrN(crOf(X, f)) : '');
  const B = (f, v, side, l) => bar(X, f, v, side, l, o.crans);
  if (!e.floral.etabli) ra = zt('floral', 'r') + inconnu('floral');
  else if (e.floral.central >= 0) ra = zt('floral', 'r') + B('floral', e.floral.central, 'r', lab('floral'));
  else { ra = zt('floral', 'r'); la = zt('floral', 'l') + B('floral', e.floral.central, 'l'); }
  rb = zt('citrus', 'r') + (e.citrus.etabli ? B('citrus', e.citrus.central, 'r', lab('citrus')) : inconnu('citrus'));
  lb = e.resin.etabli ? B('resin', e.resin.central, 'l') : inconnu('resin');
  const vis = `<i class="cv a" style="--s:${pc(viseeS('floral'))};--a:${pc(viseeA('floral'))}"></i><i class="cv b" style="--s:${pc(viseeS('citrus'))};--a:${pc(viseeA('citrus'))}"></i>`;
  return `<div class="cx${o.lab ? ' lab' : ''}"><div class="cx-m g"><div class="ln a">${la}</div><div class="ln b">${lb}</div></div><i class="cx-rail" aria-hidden="true"></i><div class="cx-m d">${vis}<div class="ln a">${ra}</div><div class="ln b">${rb}</div></div></div>`;
}

// ---------- l'intensité : les barres de l5b (6 px par cran), devant la zone du style ----------
export function colonne(X, f, obj, o = {}) {
  const HC = o.HC || 24, PXC = HC / 4;
  const t = X.v.tout.find((x) => x.famille === f);
  let e, c;
  if (obj) { const ef = X.v.effet[f]; if (!ef.etabli) return ''; e = ef.central; c = t ? t.crans : 0; }
  else { e = t.effet; c = t.crans; }
  const n = niv(X.v, f, e), bas = e < 0, hs = X.hsCr[f] || 0;
  const hS = Math.min(HC, Math.max(2, Math.abs(c) * PXC)), hA = Math.min(HC, Math.max(2, Math.abs(e) / 50 * HC));
  const xs = hs ? `<i class="mb-x" style="--s:${Math.min(hS, hs * PXC).toFixed(1)}px;--a:${Math.min(hA, hs * cran(f) / 50 * HC).toFixed(1)}px"></i>` : '';
  const z = zone(f);
  let plaf = '';
  if (z && !bas) {
    const pS = z.rS0 * 3 / 100 * PXC, pA = z.rA0 / 100 * HC;
    plaf = `<i class="mb-p${pS > HC ? ' cs' : ''}${pA > HC ? ' ca' : ''}" data-role="zone" style="--t:${J[f].texte};--z:${rgba(J[f].base, 0.14)};--s:${Math.min(HC, pS).toFixed(1)}px;--a:${Math.min(HC, pA).toFixed(1)}px"></i>`;
  }
  const lib = `${NOM[f]} ${sg(e)} (${crTxt(c)}) · ${NIVMOT[n]}${X.hs.has(f) ? ' · hors du style' : ''}`;
  const dep = Math.abs(c) * PXC > HC ? ' ds' : '', depA = Math.abs(e) / 50 * HC > HC ? ' da' : '';
  const z1 = `<span class="mb-z"><i class="mb-b" style="--s:${hS.toFixed(1)}px;--a:${hA.toFixed(1)}px">${xs}</i>${plaf}</span>`;
  const pi = obj ? '' : picto(f, 14);
  return `<span class="mb ${n}${obj ? ' tr' : ''}${bas ? ' bas' : ''}${dep}${depA}" data-famille="${f}" data-crans="${c}"${obj ? '' : ' data-role="extra"'} role="img" aria-label="${lib}" style="--c:${J[f].base};--cf:${rgba(J[f].base, 0.4)};--hc:${HC}px">${z1}${pi}</span>`;
}
// objectifs : 'traces' (une trace fine, sans picto, quand la barre s5 du groupe les montre déjà au-dessus),
// ou 'aucun' (la barre s5 de la voie elle-même porte leurs crans).
export const intensite = (X, o = {}) => `<div class="mbs">${o.objectifs === 'traces' ? `<span class="mbs-o">${OBJ.map((f) => colonne(X, f, true, o)).join('')}</span>` : ''}${X.extras.length ? `<span class="mbs-x">${X.extras.map((t) => colonne(X, t.famille, false, o)).join('')}</span>` : ''}</div>`;

// ---------- les objectifs : les trois pistes de l5b, telles quelles (D92) ----------
const R = K.reponses();
export function piste(f, avecMot) {
  const r = R[f], mot = avecMot ? 'visée' : '';
  if (f === 'resin') {
    const s = Math.abs(r.effet) / cran(f) / 3 * 100, a = Math.abs(r.effet) / 50 * 100;
    const gap = DEG.min - OB.resin.visee, vS = gap / cran(f) / 3 * 100, vA = gap / 50 * 100;
    return `<div class="piste moins" data-role="piste" data-famille="resin">
        <i class="pz${vS >= 100 ? ' cs' : ''}" data-role="zone" style="--z:${rgba(J.resin.base, 0.3)};--s0:${pc(cl(vS))};--a0:${pc(cl(vA))}"></i>
        <i class="pb" style="--s:${pc(s)};--a:${pc(a)}"></i>
        <i class="pv${vS > 100 ? ' loin' : ''}" style="--s:${pc(cl(vS))};--a:${pc(cl(vA))}"><span>${vS > 100 ? ico('i-chev-l', 12, 'class="pv-loin"') : ''}${mot}</span></i>
        <i class="prail"></i>
      </div>`;
  }
  const z = zone(f), s = r.effet / cran(f) / 3 * 100, a = r.effet / 50 * 100;
  return `<div class="piste" data-role="piste" data-famille="${f}">
        <i class="pz" data-role="zone" style="--z:${rgba(J[f].base, 0.3)};--s:${pc(cl(z.rS0))};--a:${pc(cl(z.rA0))}"></i>
        <i class="pb" style="--s:${pc(cl(s))};--a:${pc(cl(a))}"></i>
        <i class="pv" style="--s:${pc(viseeS(f))};--a:${pc(viseeA(f))}"><span>${mot}</span></i>
        <i class="prail"></i>
      </div>`;
}
// En moins, pour tenir 70 mots avec l'α et l'usage : « voie houblon » sous « Aucune » (le bouton « Hors
// houblon » le dit, comme dans l8e).
export function objectifs() {
  const aria = (f) => { const x = R[f], { nom } = nomVoie(x.X.v); return f === 'resin' ? 'Moins résineux : ma bière est au-dessus du style d\'après la dégustation ; aucune voie houblon ne l\'y ramène' : `${x.titre} : la meilleure voie, ${nom}, ${K.VERDICT[x.verdict].toLowerCase()} la visée (${fr(OB[f].maBiere.central)} → ${fr(x.apres)}, visée ${fr(OB[f].visee)})`; };
  return `<div class="obs">${['resin', 'floral', 'citrus'].map((f, i) => {
    const x = R[f];
    return `<section class="ob" data-role="objectif" data-famille="${f}" aria-label="${esc(aria(f))}" style="--f:${J[f].fond};--t:${J[f].texte};--b:${J[f].base}">
      <div class="ob-h"><span class="app">${picto(f, 16)}${f === 'resin' ? '<i class="alerte"></i>' : ''}</span><span class="ob-t">${x.titre}</span>${f === 'resin' ? `<button class="hh-b" onclick="var d=document.getElementById('hh');d.open=true;d.scrollIntoView({behavior:'smooth'})">Hors houblon${ico('i-chev-r', 12)}</button>` : ''}<div class="rep v-${x.verdict}" data-role="reponse" data-famille="${f}" data-verdict="${x.verdict}">${K.VERDICT[x.verdict]}</div></div>
      ${piste(f, i === 0 || f !== 'resin' && i === 1)}
    </section>`;
  }).join('')}</div>`;
}

// ---------- le haut (avec le « ? » de la légende), les plis, le dock ----------
export const teteEcran = `
  <header class="barre">
    <a class="retour" href="#" aria-label="Retour">${ico('i-chev-l', 16)}</a>
    <div class="seg onglets" role="radiogroup" aria-label="Partie">${['Ma bière', 'Suggestions', 'Comparer'].map((x) => `<button role="radio" aria-checked="${x === 'Suggestions'}">${x}</button>`).join('')}</div>
    <button class="leg-b" data-role="legende-bouton" aria-expanded="false" aria-controls="legende" aria-label="Légende des pictos et des barres">${ico('i-aide', 18)}</button>
  </header>
  <div class="outils">
    <div class="seg lentille" role="radiogroup" aria-label="Lecture des familles"><button role="radio" data-e="style" aria-checked="true">Au style</button><button role="radio" data-e="absolu" aria-checked="false">Absolu</button></div>
    <div class="seg" role="radiogroup" aria-label="Vue"><button role="radio" aria-checked="true" aria-label="Barres">${ico('j-barres', 16)}</button><button role="radio" aria-checked="false" aria-label="Radar">${ico('j-radar', 16)}</button></div>
  </div>`;
export function plis() {
  const ib = V.map((X) => nomVoie(X.v).nom + ' ' + (MOMENT[momentDe(X.v)].court || MOMENT[momentDe(X.v)].t) + ' ' + fr(X.v.ibu.after)).join(' · ');
  const hh = C.horsModele.map((h) => h.pistes.map((x) => `<li><b>${esc(x.titre)}</b> : ${esc(x.action.charAt(0).toLowerCase() + x.action.slice(1))} <span class="src">${esc(x.preuve)}</span></li>`).join('')).join('');
  return `
  <details class="pli"><summary>IBU après chaque voie<span class="pli-n">ma bière <span class="nb">${fr(C.ibu)}</span> ; style <span class="nb">${C.bandeIbu.join('–')}</span></span>${ico('i-chev-d', 16, 'class="chev"')}</summary><ul><li>${esc(ib)}</li></ul></details>
  <details class="pli" id="hh"><summary>Hors houblon · résineux<span class="pli-n">${C.horsModele[0].pistes.length} pistes</span>${ico('i-chev-d', 16, 'class="chev"')}</summary><ul>${hh}</ul></details>`;
}
export const dock = () => `<nav class="dock" aria-label="Comparer"><span class="dock-p" aria-hidden="true">${AJOUTEES.map((n) => { const a = V[n - 1].v.actions[0]; return `<i style="--h:${COUL_H[a.houblon]}" data-houblon-compare="${esc(a.houblon)}" data-couleur="${COUL_H[a.houblon]}"></i>`; }).join('')}</span><a class="cmp" data-role="comparer" href="#" aria-label="Comparer la sélection">Comparer${ico('i-chev-r', 16)}</a></nav>`;

// ---------- D89 : la légende, derrière le « ? » ----------
// Elle descend du « ? » (un bec le désigne), qui reste visible au-dessus du voile avec la trace du doigt :
// on voit ce qui l'a ouverte (« Quoi ouvre ça ??? »). Fermée, elle ne compte ni ne gêne.
const li = (c, m) => `<span class="leg-i"><span class="leg-c">${c}</span><span>${m}</span></span>`;
const exB = (cls, h, x = '') => `<span class="mb ${cls}" style="--c:${J.tropical.base};--cf:${rgba(J.tropical.base, 0.4)};--hc:24px"><span class="mb-z"><i class="mb-b" style="--s:${h}px;--a:${h}px">${x}</i><i class="mb-p" style="--t:${J.tropical.texte};--z:${rgba(J.tropical.base, 0.14)};--s:18px;--a:12px"></i></span></span>`;
const pisteEx = `<span class="leg-piste" aria-hidden="true" style="--b:${J.floral.base};--z:${rgba(J.floral.base, 0.3)};--t:${J.floral.texte}"><i class="lp-z"></i><i class="lp-b"></i><i class="lp-v"></i><i class="lp-r"></i></span>`;
export const LEGENDE = `
  <div class="leg-v" data-role="legende-voile" hidden></div>
  <section class="legende" id="legende" data-role="legende" role="dialog" aria-label="Légende" hidden>
    <i class="leg-bec" aria-hidden="true"></i>
    <div class="leg-in">
    <div class="leg-t"><span>Légende</span><button class="leg-x" data-role="legende-fermer" aria-label="Fermer la légende">${ico('i-x', 16)}</button></div>
    <div class="leg-s"><h3>Familles</h3><div class="leg-g">${ORDRE.map((f) => li(picto(f, 18), COURT[f])).join('')}</div></div>
    <div class="leg-s"><h3>Objectif</h3><div class="leg-p">${pisteEx}<span class="leg-pl"><span><b class="lk r"></b>ma bière</span><span><b class="lk z"></b>zone du style</span><span><b class="lk b"></b>la meilleure voie</span><span><b class="lk v"></b>visée</span></span></div></div>
    <div class="leg-s"><h3>Houblon</h3><div class="leg-g l2">
      ${li('<span class="us">amer</span>', 'amérisant')}${li('<span class="us">arôme</span>', 'aromatique')}
      ${li('<span class="us">mixte</span>', 'les deux')}${li('<span class="us deduit">mixte</span>', 'contour : déduit de l’α')}
      ${li('<span class="al lot">8,1%</span>', 'α du lot en stock')}${li(`<span class="al af">${LIVRE}3,5–5,7%</span>`, 'sans lot : α de ses fiches')}
      ${li(`<span class="al lot">9,6%${DIFF}</span>`, 'lot hors de ses fiches')}${li(`<span class="al af">${LIVRE}</span>`, 'plages, sources, pellets : la fiche')}
    </div></div>
    <div class="leg-s"><h3>Stock et moments</h3><div class="leg-g l2">
      ${li(`<span class="stk">${ico('j-stock', 14)}</span>`, 'en stock')}${li(`<span class="stk">${ico('j-achat', 14)}</span>`, 'à acheter')}
      ${li(`<span class="stk">${ico('j-manque', 14)}</span>`, 'stock insuffisant')}${li(`<span class="stk">${ico('j-ebu', 14)}</span>`, 'ébullition')}
      ${li(`<span class="stk">${ico('j-cuve-a', 14)}</span>`, 'dry hop actif')}${li(`<span class="stk">${ico('j-levure', 14)}</span>`, 'levure')}
    </div></div>
    <div class="leg-s"><h3>Barres, un cran du style par 6 px</h3><div class="leg-g l2">
      ${li(exB('mq', 13), 'marqué dans ses fiches')}${li(exB('ci', 13), 'cité par une fiche')}
      ${li(exB('sf', 13), 'sans fiche')}${li(exB('mq', 22, '<i class="mb-x" style="--s:4px;--a:4px"></i>'), 'orangé : hors du style')}
      ${li(exB('sf bas', 2), 'baisse')}${li('<i class="cb-ex"></i>', 'non établi')}
      ${li('<span class="cb-lex">+1</span>', 'un cran du style ; +2, deux')}
    </div></div>
    <div class="leg-s"><h3>Vues</h3><div class="leg-g l2">
      ${li(`<span class="stk">${ico('j-barres', 16)}</span>`, 'Barres : les familles en barres')}${li(`<span class="stk">${ico('j-radar', 16)}</span>`, 'Radar : la même chose en radar')}
    </div></div>
    <div class="leg-s"><h3>Gestes</h3><div class="leg-g l2">
      ${li(`<span class="plus" aria-hidden="true">${ico('i-plus', 16)}</span>`, 'ajouter à Comparer')}${li('<span class="leg-doigt" aria-hidden="true"></span>', 'appui long : sa fiche')}
      ${li(`<span class="bt">${picto('floral', 14)}${ico('i-arrow-r', 12)}${picto('citrus', 14)}</span>`, 'biotransformation possible')}
    </div></div>
    </div>
  </section>`;
export const LEGENDE_JS = `
const LB = document.querySelector('[data-role="legende-bouton"]'), LG = document.querySelector('[data-role="legende"]'), LV = document.querySelector('[data-role="legende-voile"]');
const legende = (on, focus = true) => { LG.hidden = !on; LV.hidden = !on; LB.setAttribute('aria-expanded', String(on)); document.body.classList.toggle('leg-ouverte', on); if (!focus) return; if (on) LG.querySelector('[data-role="legende-fermer"]').focus({ preventScroll: true }); else LB.focus({ preventScroll: true }); };
LB.addEventListener('click', () => legende(LG.hidden));
LV.addEventListener('click', () => legende(false));
LG.querySelector('[data-role="legende-fermer"]').addEventListener('click', () => legende(false));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !LG.hidden) { e.preventDefault(); legende(false); } });
if (/[?&]legende\\b/.test(location.search)) legende(true, false);
`;

// ---------- D93 : la fiche dans le langage de la page ----------
// La vraie fiche du pack (D25 : base/consolide, objet D, fichesH), composée avec les briques de la page :
// les mêmes pictos au trait (le même <symbol>), l'α comme sur les voies (le lot d'abord), l'usage en mot,
// l'intensité en barres de la page (une par famille, à la part de ses fiches qui la citent) au lieu des
// 12 cases, la typographie de la page ; le radar reste, aux couleurs de la page.
const C1F = {};
for (const v of C.voies) for (const h of v.fiches || []) if (!C1F[h.houblon]) C1F[h.houblon] = h;
const HCF = 24;
function barresFiche(F) {
  const par = Object.fromEntries(F.aromes.map((x) => [x.f, x]));
  const of = (F.aromes[0] || {}).of || 0;
  const col = (f, k) => {
    const x = par[f], n = x ? x.n : 0, sep = k === DB.attendues.length ? ' sep' : '';
    if (!n) return `<span class="mb fi-mb nd${sep}" data-famille="${f}" role="img" aria-label="${NOM[f]} : non décrit par ses fiches"><span class="mb-z"><i class="mb-i"></i></span>${picto(f, 14)}</span>`;
    const h = Math.max(5, n / of * HCF);
    return `<span class="mb fi-mb ${n >= 2 ? 'mq' : 'ci'}${sep}" data-famille="${f}" role="img" aria-label="${NOM[f]} : ${of === 1 ? 'cité par sa seule fiche' : n + ' fiches sur ' + of}" style="--c:${J[f].base};--cf:${rgba(J[f].base, 0.4)};--hc:${HCF}px"><span class="mb-z"><i class="mb-b" style="--s:${h.toFixed(1)}px;--a:${h.toFixed(1)}px"></i></span>${picto(f, 14)}</span>`;
  };
  const seule = of === 1 ? (F.aromes.find((x) => x.n) || { auteurs: [] }).auteurs[0] : null;
  return `<div class="fi-bars"><span class="fi-bars-c" aria-label="Les familles citées par les fiches de ${esc(F.nom)}">${DB.ordre.map(col).join('')}</span>${seule ? `<span class="fi-seule">1 seule fiche : ${esc(seule)}</span>` : ''}</div>`;
}
function lignesFiche(F) {
  const par = Object.fromEntries(F.aromes.map((x) => [x.f, x]));
  return DB.ordre.filter((f) => par[f] && par[f].n > 0).map((f) => {
    const x = par[f], cpt = x.of === 1 ? '' : x.n + '/' + x.of;
    const prem = x.n === 1 && (x.premier || []).length ? 'nommé en premier' : '';
    const mots = [...new Set((x.mots || []).flatMap((m) => m.mots).map((w) => w.toLowerCase()))];
    return `<div class="fi-lab" data-explique="${f}">${picto(f, 16)}<span class="fi-lab-t"><span class="fi-lab-n" style="--t:${J[f].texte}">${COURT[f]}</span>${cpt ? ` <span class="fi-cpt nb">${cpt}</span>` : ''}${prem ? `${cpt ? ' <span class="fi-sep" aria-hidden="true">·</span>' : ''} <span class="fi-cpt">${prem}</span>` : ''}${mots.length ? `${cpt || prem ? ' <span class="fi-sep" aria-hidden="true">·</span>' : ''} <span class="fi-mots">${esc(mots.join(', '))}</span>` : ''}</span></div>`;
  }).join('');
}
function alphaFiche(F, nom) {
  const cryo = /cryo$/i.test(nom), base = nom.replace(/\s*cryo$/i, '');
  const srcs = [...F.alpha].sort((a, b) => (a.an || 0) - (b.an || 0));
  const hors = !cryo && F.lot != null && srcs.length && srcs.every((s) => F.lot < s.min || F.lot > s.max);
  const lot = F.lot != null ? `<span class="al lot" data-role="alpha" data-source="lot" role="img" aria-label="α du lot en stock : ${fr(F.lot)} %${hors ? ' ; hors des plages de ses fiches' : ''}">${pct(F.lot)}${hors ? DIFF : ''}</span>` : '';
  const fi = srcs.length ? `<span class="al af" data-role="alpha" data-source="fiches" role="img" aria-label="${cryo ? 'α des fiches du ' + base + ' en pellets' : 'α de ses fiches'} : ${srcs.map((s) => plage(s.min, s.max).replace('%', ' %') + ' (' + s.src + (s.an ? ' ' + s.an : '') + ')').join(', ')}">${LIVRE}${srcs.map((s) => plage(s.min, s.max)).join(' · ')}${cryo ? '<span class="pel">pellets</span>' : ''}</span>` : '';
  const txt = !lot && !fi ? '<span class="al af" data-role="alpha" data-source="fiches">non renseigné</span>' : '';
  return `<span class="fi-alpha" data-role="fiche-alpha">${lot}${fi}${txt}</span>`;
}
const FICHES = {};
for (const nom of K.HOUBLONS) {
  const P = K.ficheParts(nom, { roue: { W: 330, id: nom.replace(/\W+/g, ''), gris: '#55555f', grille: '#e3e5eb' }, regFond: '#e9ecf2', regFort: '#16161a', regPale: '#aeb3be', regLot: '#16161a', regLotT: '#fff' });
  const F = P.F;
  const hu = C1F[nom] || (F.role ? { houblon: nom, role: F.role.v, roleSource: F.role.src } : null);
  FICHES[nom] = `<div class="fi-voile" data-k="voile" aria-hidden="true"></div>
  <section class="fi" data-role="fiche" role="dialog" tabindex="-1" aria-label="Fiche de ${esc(nom)}">
    <div class="fi-poignee" aria-hidden="true"></div>
    <header class="fi-t"><h2>${esc(nom)}</h2>${hu ? usage(hu, { fiche: true }) : ''}{{STOCK}}<button class="fi-x" data-role="fermer-fiche" data-k="fermer" aria-label="Fermer la fiche de ${esc(nom)}">${ico('i-x', 16)}</button></header>
    <div class="w fi-duo">${alphaFiche(F, nom)}${P.reglette}${P.note}</div>
    <div class="w w-ar" data-role="fiche-arome">${barresFiche(F)}${lignesFiche(F)}${P.sans}${P.nd}<div class="fi-r">${P.roue}</div>${P.demande}</div>
    <div class="fi-act"><span class="fi-g" role="group" data-role="gout" aria-label="Mon goût pour ${esc(nom)}"><button data-k="aimer" aria-pressed="false" aria-label="Aimer ${esc(nom)}">${ico('i-heart', 16)}</button><button data-k="exclure" aria-pressed="false" aria-label="Exclure ${esc(nom)}">${ico('i-ban', 16)}</button></span>{{ACTION}}<button class="fi-b" data-k="comparer" aria-label="Comparer ${esc(nom)} à d'autres houblons">Comparer</button></div>
    <div class="fi-replis" role="group" aria-label="Détail de la fiche">${P.sections.map(([id, t]) => `<button data-k="repli" data-sec="${id}" aria-expanded="false">${t}${ico('i-chev-d', 14)}</button>`).join('')}</div>
    ${P.sections.map(([id, t, corps]) => `<div class="w fi-sec" data-sec-corps="${id}" hidden aria-label="${t}">${corps}</div>`).join('')}
  </section>`;
}
export { FICHES };
const VOIES = Object.fromEntries(V.map((X) => [X.n, { stock: X.v.levureVers ? null : X.v.stock, action: X.v.levureVers ? null : X.v.type === 'assemblage' || X.v.type === 'ajouter' ? 'Ajouter à ' + MOMENT[momentDe(X.v)].t : X.v.type.startsWith('remplacer') ? 'Remplacer Nugget' : 'Ajouter en ' + MOMENT[momentDe(X.v)].t, hs: X.v.actions.map((a) => a.houblon) }]));
const STOCK_HTML = Object.fromEntries(Object.keys(STOCK_MOT).map((k) => [k, `<span class="stk" role="img" aria-label="${STOCK_MOT[k]}">${ico(STOCK_ICO[k], 14)}</span>`]));
export const FICHE_JS = `
const FICHES = ${JSON.stringify(FICHES)};
const VOIES = ${JSON.stringify(VOIES)};
const STOCK_HTML = ${JSON.stringify(STOCK_HTML)};
function rendFiche(nom, mode, voie) {
  const v = voie && VOIES[voie] && VOIES[voie].hs.includes(nom) ? VOIES[voie] : null;
  const html = FICHES[nom].replace('{{STOCK}}', v && v.stock ? STOCK_HTML[v.stock] : '').replace('{{ACTION}}', v && v.action ? '<button class="fi-b fi-b1" data-k="ajouter">' + v.action + '</button>' : '');
  RACINE.className = 'mode-' + mode;
  RACINE.innerHTML = mode === 'bulle' ? html.replace(/<div class="fi-voile"[^>]*><\\/div>/, '') : html;
}
${K.GESTE_JS}`;

// ---------- la feuille de style ----------
export const POLICES = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Sans+3:ital,wght@0,400;0,600;0,700;1,400&family=IBM+Plex+Mono:wght@400;500;600&display=swap">';
export const CSS = `
  :root { --encre: #16161a; --gris: #55555f; --trait: #e3e5eb; --mur: #e9ecf2; --acc: #c2410c; --gut: 12px;
    --sans: "Source Sans 3", system-ui, -apple-system, "Segoe UI", sans-serif; --mono: "IBM Plex Mono", ui-monospace, SFMono-Regular, Consolas, monospace;
    --ombre: 0 1px 1px rgba(22,22,26,.05), 0 2px 6px -3px rgba(22,22,26,.16); }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { background: var(--mur); }
  body { background-color: var(--mur); background-image: radial-gradient(60% 40% at 0% 6%, #ddd8f1 0%, rgba(221,216,241,0) 100%), radial-gradient(55% 35% at 100% 44%, #d6ebe2 0%, rgba(214,235,226,0) 100%), radial-gradient(70% 40% at 10% 88%, #d9e3f1 0%, rgba(217,227,241,0) 100%);
    min-height: 100vh; color: var(--encre); font: 400 14px/1.25 var(--sans); -webkit-tap-highlight-color: transparent; }
  button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; }
  svg { display: block; flex: none; }
  .q, .nb, .cb-l, .cmp b, .al { font-family: var(--mono); font-variant-numeric: tabular-nums; }
  .ecran { max-width: 390px; margin: 0 auto; padding: 4px 10px 72px; display: flex; flex-direction: column; gap: 6px; overflow-x: hidden; }

  .barre { display: flex; align-items: center; gap: 6px; height: 32px; }
  .retour { width: 28px; height: 28px; border-radius: 50%; background: #fff; box-shadow: var(--ombre); display: inline-flex; align-items: center; justify-content: center; color: var(--encre); flex: none; }
  .seg { display: flex; background: rgba(255,255,255,.6); border-radius: 14px; padding: 2px; box-shadow: inset 0 0 0 1px rgba(22,22,26,.06); }
  .onglets { flex: 1; }
  .seg button { flex: 1; height: 24px; border-radius: 12px; font-size: 13px; color: var(--gris); white-space: nowrap; display: inline-flex; align-items: center; justify-content: center; gap: 4px; padding: 0 10px; }
  .seg button[aria-checked="true"] { background: #fff; color: var(--encre); font-weight: 600; box-shadow: 0 1px 2px rgba(22,22,26,.14); }
  .outils { display: flex; justify-content: space-between; gap: 8px; }
  .lentille button[aria-checked="true"] { background: var(--encre); color: #fff; }
  /* Le « ? » : discret au repos (28 px, sans fond) ; ouvert, il reste au-dessus du voile, blanc, avec la trace du doigt. */
  .leg-b { position: relative; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; flex: none; color: var(--gris); }
  .leg-b[aria-expanded="true"] { z-index: 32; background: #fff; color: var(--encre); box-shadow: 0 0 0 1.5px var(--encre); }
  .leg-b[aria-expanded="true"]::after { content: ''; position: absolute; left: -5px; top: -5px; width: 38px; height: 38px; border-radius: 50%; background: rgba(22,22,26,.13); box-shadow: 0 0 0 2px rgba(22,22,26,.28); pointer-events: none; }

  .obs { display: flex; flex-direction: column; gap: 4px; }
  .ob { background: var(--f); border-radius: 8px; padding: 5px 10px 6px; box-shadow: var(--ombre); display: flex; flex-direction: column; gap: 2px; }
  .ob-h { display: flex; align-items: center; gap: 6px; min-height: 24px; }
  .app { width: 18px; height: 18px; display: inline-flex; align-items: center; justify-content: center; flex: none; position: relative; }
  .alerte { position: absolute; right: -3px; bottom: -2px; width: 8px; height: 8px; border-radius: 50%; background: var(--acc); box-shadow: 0 0 0 1.5px #fff; }
  .ob-t { font-size: 14px; font-weight: 600; color: var(--t); white-space: nowrap; }
  .rep { margin-left: auto; display: flex; align-items: baseline; gap: 4px; font-size: 15px; font-weight: 700; line-height: 1.1; color: var(--encre); white-space: nowrap; }
  .hh-b { height: 22px; padding: 0 4px 0 7px; border-radius: 11px; background: #fff; font-size: 12px; font-weight: 600; color: var(--t); display: inline-flex; align-items: center; gap: 1px; white-space: nowrap; }
  .piste { position: relative; height: 18px; }
  .piste::before { content: ''; position: absolute; left: 0; right: 0; top: 10px; height: 5px; border-radius: 2px; background: rgba(255,255,255,.9); }
  .pz { position: absolute; top: 10px; height: 5px; left: 0; width: var(--s); background: var(--z); border-radius: 0 2px 2px 0; }
  .pz::after { content: ''; position: absolute; right: -1px; top: -2px; width: 2px; height: 9px; border-radius: 1px; background: var(--t); }
  body.abs .pz { width: var(--a); }
  .pb { position: absolute; top: 10px; height: 5px; left: 0; width: var(--s); background: var(--b); border-radius: 0 2px 2px 0; z-index: 1; }
  body.abs .pb { width: var(--a); }
  .pv { position: absolute; top: 0; bottom: 0; left: var(--s); border-left: 1.5px dashed var(--encre); z-index: 2; }
  body.abs .pv { left: var(--a); }
  .pv span { position: absolute; top: -2px; left: 3px; font-size: 12px; font-weight: 600; line-height: 12px; color: var(--encre); white-space: nowrap; display: inline-flex; align-items: center; }
  .prail { position: absolute; left: 0; top: 6px; bottom: 0; width: 2px; border-radius: 1px; background: var(--encre); z-index: 3; }
  .piste.moins .pz { left: auto; right: var(--s0); width: calc(100% - var(--s0)); border-radius: 2px 0 0 2px; }
  .piste.moins .pz.cs { display: none; }
  body.abs .piste.moins .pz { right: var(--a0); width: calc(100% - var(--a0)); display: block; }
  .piste.moins .pz::after { display: none; }
  .piste.moins .pb { left: auto; right: 0; border-radius: 2px 0 0 2px; }
  .piste.moins .pv { left: auto; right: var(--s); border-left: 0; border-right: 1.5px dashed var(--encre); }
  body.abs .piste.moins .pv { right: var(--a); }
  .piste.moins .pv span { left: auto; right: 3px; }
  .piste.moins .pv.loin { border-right-color: transparent; }
  .piste.moins .pv.loin span { right: auto; left: 0; }
  body.abs .piste.moins .pv.loin { border-right-color: var(--encre); }
  body.abs .piste.moins .pv.loin span { left: auto; right: 3px; }
  body.abs .pv-loin { display: none; }
  .piste.moins .prail { left: auto; right: 0; }

  .t-h { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; min-height: 22px; }
  .q { font-size: 12px; font-weight: 500; color: var(--gris); white-space: nowrap; }
  .est { font-size: 12px; font-weight: 600; color: var(--gris); background: rgba(255,255,255,.8); padding: 1px 7px; border-radius: 9px; }
  .mo { display: inline-flex; align-items: center; gap: 3px; height: 20px; padding: 0 7px 0 5px; border-radius: 10px; background: #fff; box-shadow: inset 0 0 0 1px #c9cad2; font-size: 12px; font-weight: 600; white-space: nowrap; flex: none; }

  .cx { position: relative; display: flex; height: 20px; }
  .cx.lab { height: 22px; }
  .cx-m { position: relative; flex: 1; }
  .cx-rail { width: var(--gut); flex: none; position: relative; }
  .cx-rail::before { content: ''; position: absolute; top: -2px; bottom: -2px; left: 5px; width: 2px; border-radius: 1px; background: var(--encre); }
  .ln { position: absolute; left: 0; right: 0; height: 7px; }
  .ln.a { top: 1px; } .ln.b { top: 12px; }
  .zt { position: absolute; bottom: -3px; height: 2px; width: var(--s); background: var(--z); border-radius: 1px; }
  .zt::after { content: ''; position: absolute; top: -3px; width: 2px; height: 7px; border-radius: 1px; background: var(--t); }
  .d .zt { left: 0; } .d .zt::after { right: -1px; }
  .g .zt { right: 0; } .g .zt::after { left: -1px; }
  .zt.cs::after { display: none; } body.abs .zt.cs::after { display: block; } body.abs .zt.ca::after { display: none; }
  body.abs .zt { width: var(--a); }
  .cb { position: absolute; top: 0; height: 7px; min-width: 3px; width: var(--s); background: var(--c); z-index: 1; }
  body.abs .cb:not(.inconnu) { width: var(--a); }
  .d .cb { left: 0; border-radius: 0 2px 2px 0; } .g .cb { right: 0; border-radius: 2px 0 0 2px; }
  .cb.ci { background: var(--cf); box-shadow: inset 0 0 0 1px var(--c); }
  .cb.sf { background: #fff; box-shadow: inset 0 0 0 1px var(--c); }
  .cb.inconnu, .cb-ex { width: 18px; background: repeating-linear-gradient(135deg, #fff 0 2px, #aeb3be 2px 3.5px); box-shadow: inset 0 0 0 1px #8a909b; }
  .cb-ex { display: inline-block; height: 7px; border-radius: 2px; }
  .cb-lex { font: 500 12px var(--mono); padding: 0 3px; border-radius: 2px; background: #fff; box-shadow: inset 0 0 0 1px var(--trait); }
  .outils .seg:not(.lentille) button { padding: 0 9px; }
  .cb.ds::after, body.abs .cb.da::after { content: ''; position: absolute; top: 1px; right: 2px; border: 2.5px solid transparent; border-left: 4px solid #fff; }
  body.abs .cb.ds:not(.da)::after { display: none; }
  .hs { position: absolute; top: 0; height: 7px; left: var(--s0); width: var(--s1); background: var(--acc); z-index: 2; border-radius: 0 2px 2px 0; }
  .g .hs { left: auto; right: var(--s0); border-radius: 2px 0 0 2px; }
  body.abs .hs { left: var(--a0); width: var(--a1); }
  .cb-l { position: absolute; top: -4px; left: calc(var(--s) + 3px); font-size: 12px; font-weight: 500; white-space: nowrap; line-height: 14px; z-index: 3; background: #fff; padding: 0 3px; border-radius: 2px; }
  .ln.b .cb-l { top: -2px; }
  body.abs .cb-l { left: calc(var(--a) + 4px); }
  .cv { position: absolute; left: var(--s); width: 0; border-left: 1.5px dashed var(--encre); z-index: 2; }
  .cv.a { top: -1px; height: 10px; } .cv.b { top: 10px; height: 11px; }
  body.abs .cv { left: var(--a); }

  /* Une voie : une tuile large ; chaque houblon dit son nom, son usage en mot et son α. */
  .liste { display: flex; flex-direction: column; gap: 5px; }
  .grille { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; }
  .gw { background: #fff; border-radius: 8px; box-shadow: var(--ombre); padding: 4px 10px 7px; display: flex; flex-direction: column; gap: 4px; }
  .st { padding: 3px 2px 0; }
  .tl { background: #fff; border-radius: 8px; box-shadow: var(--ombre); padding: 4px 7px 3px 8px; display: flex; flex-direction: column; gap: 3px; position: relative; min-width: 0; transition: transform .16s cubic-bezier(.2,.8,.2,1); }
  .tl.appui { transform: scale(.98); }
  .tl.f-source { box-shadow: 0 0 0 1.5px var(--encre), var(--ombre); }
  .tl-h { display: flex; align-items: flex-start; gap: 4px; min-height: 24px; }
  .hbs { flex: 1; min-width: 0; display: flex; flex-wrap: wrap; align-items: center; gap: 1px 5px; padding-top: 0; }
  .tl-l .hbs { gap: 2px 8px; }
  .hu { display: inline-flex; align-items: center; gap: 5px; white-space: nowrap; }
  .hb { display: inline-flex; flex-wrap: wrap; align-items: center; gap: 2px 7px; min-width: 0; }
  .pl { font-size: 14px; font-weight: 600; color: var(--gris); }
  .nm { font-size: 14px; font-weight: 600; line-height: 17px; -webkit-touch-callout: none; -webkit-user-select: none; user-select: none; }
  .tl-m { display: inline-flex; align-items: center; gap: 5px; color: var(--gris); }
  .tl-m:empty { display: none; }
  .tl-c { display: flex; align-items: flex-end; gap: 10px; }
  .tl-c .cx { flex: 1; margin-bottom: 4px; }
  .us { display: inline-flex; align-items: center; height: 16px; padding: 0 6px; border-radius: 8px; background: #ececf1; font-size: 12px; font-weight: 600; line-height: 1; color: var(--encre); white-space: nowrap; flex: none; }
  .us.deduit { background: none; box-shadow: inset 0 0 0 1px #b4b4be; color: var(--gris); font-weight: 400; }
  .hal { display: inline-flex; align-items: center; gap: 7px; white-space: nowrap; }
  .al { display: inline-flex; align-items: center; gap: 2px; font-size: 12px; font-weight: 600; line-height: 1; color: var(--encre); }
  .al.lot::before { content: 'α'; font: 400 12px var(--sans); color: var(--gris); margin-right: 2px; }
  .al.af { font-weight: 400; color: var(--gris); }
  .al svg { color: var(--gris); }
  .al .pel { font: 400 12px var(--sans); margin-left: 3px; }

  .sel { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: var(--h); margin: 0 4px 1px 0; vertical-align: middle; }
  [data-voie]:has(.plus[aria-pressed="false"]) .sel { display: none; }
  .plus { margin-left: auto; width: 24px; height: 24px; border-radius: 50%; background: #ececf1; display: inline-flex; align-items: center; justify-content: center; flex: none; color: var(--encre); }
  .plus .i-c { display: none; }
  .plus[aria-pressed="true"] { background: var(--encre); color: #fff; }
  .plus[aria-pressed="true"] .i-p { display: none; } .plus[aria-pressed="true"] .i-c { display: block; }
  .stk { display: inline-flex; color: var(--gris); }

  /* L'intensité : les barres de l5b, la zone du style pâle derrière, son plafond en filet. */
  .mbs { position: relative; display: flex; gap: 5px; align-items: flex-end; }
  .mbs-o, .mbs-x { display: inline-flex; gap: 2px; align-items: flex-end; }
  .mbs-o { padding-right: 5px; border-right: 1px dashed #c4c6ce; gap: 2px; }
  .mb { display: inline-flex; flex-direction: column; align-items: center; gap: 1px; }
  .mb-z { position: relative; width: 7px; height: calc(var(--hc, 24px) + 3px); }
  .mb.tr .mb-z { width: 4px; }
  .mb-z::after { content: ''; position: absolute; left: -2px; right: -2px; bottom: 2px; height: 1px; background: var(--encre); }
  .mb-b { position: absolute; left: 0; right: 0; bottom: 3px; height: var(--s); background: var(--c); border-radius: 2px 2px 0 0; z-index: 1; }
  body.abs .mb-b { height: var(--a); }
  .mb.ci .mb-b { background: var(--cf); box-shadow: inset 0 0 0 1px var(--c); }
  .mb.sf .mb-b { background: #fff; box-shadow: inset 0 0 0 1px var(--c); }
  .mb.bas .mb-b { bottom: 0; top: auto; height: 2px; border-radius: 0; background: var(--encre); box-shadow: none; }
  .mb-x { position: absolute; left: 0; right: 0; top: 0; height: var(--s); background: var(--acc); }
  body.abs .mb-x { height: var(--a); }
  .mb-p { position: absolute; left: -1px; right: -1px; bottom: 3px; height: var(--s); background: var(--z); border-top: 1.5px solid var(--t); z-index: 0; }
  body.abs .mb-p { height: var(--a); }
  .mb-p.cs { display: none; } body.abs .mb-p.cs { display: block; } body.abs .mb-p.ca { display: none; }
  .mb.ds .mb-b::after, body.abs .mb.da .mb-b::after { content: ''; position: absolute; left: 1px; top: 1px; border: 2.5px solid transparent; border-bottom: 3px solid #fff; border-top: 0; }
  body.abs .mb.ds:not(.da) .mb-b::after { display: none; }
  .mb .pi { width: 14px; height: 14px; }

  details.bio { display: inline-block; vertical-align: middle; }
  details.bio summary { list-style: none; display: inline-flex; align-items: center; gap: 2px; height: 20px; padding: 0 3px; border-radius: 10px; background: repeating-linear-gradient(135deg, #fff 0 3px, #dadce2 3px 5.5px); box-shadow: inset 0 0 0 1px #8a909b; cursor: pointer; }
  details.bio summary::-webkit-details-marker { display: none; }
  .bt { display: inline-flex; align-items: center; gap: 1px; background: #fff; border-radius: 8px; padding: 0 2px; height: 16px; color: var(--encre); }
  .bt.mot { font-size: 12px; font-weight: 600; padding: 0 4px; }
  details.bio[open] ul { position: absolute; left: 6px; right: 6px; top: 30px; z-index: 6; background: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(22,22,26,.08), 0 12px 28px -14px rgba(22,22,26,.5); padding: 8px 10px 8px 24px; font-size: 13px; display: flex; flex-direction: column; gap: 5px; color: var(--encre); }
  .src { color: var(--gris); font-size: 12px; }

  .pli { background: #fff; border-radius: 8px; box-shadow: var(--ombre); padding: 8px 10px; }
  .pli summary { list-style: none; display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; cursor: pointer; flex-wrap: wrap; }
  .pli summary::-webkit-details-marker { display: none; }
  .pli-n { font-size: 12px; color: var(--gris); }
  .pli .chev { margin-left: auto; transition: transform .15s; }
  .pli[open] .chev { transform: rotate(180deg); }
  .pli ul { margin: 6px 0 0 16px; display: flex; flex-direction: column; gap: 5px; font-size: 13px; }

  .dock { position: fixed; z-index: 8; left: 50%; transform: translateX(-50%); bottom: 10px; width: 370px; max-width: calc(100% - 20px); height: 44px; border-radius: 22px; background: rgba(255,255,255,.78); -webkit-backdrop-filter: blur(12px) saturate(1.4); backdrop-filter: blur(12px) saturate(1.4); box-shadow: 0 6px 18px -10px rgba(22,22,26,.5), inset 0 0 0 1px rgba(255,255,255,.7); display: flex; align-items: center; gap: 8px; padding: 0 5px 0 14px; }
  .dock-p { display: inline-flex; }
  .dock-p i { width: 18px; height: 18px; border-radius: 50%; background: var(--h); box-shadow: 0 0 0 2px #fff; margin-right: -5px; }
  .cmp { margin-left: auto; height: 34px; padding: 0 10px 0 16px; border-radius: 17px; background: var(--encre); color: #fff; display: inline-flex; align-items: center; gap: 5px; font-size: 14px; font-weight: 600; text-decoration: none; }

  /* La légende : elle descend du « ? », un bec le désigne. */
  .leg-v { position: fixed; inset: 0; z-index: 30; background: rgba(22,22,26,.32); }
  .legende { position: fixed; z-index: 31; top: 50px; left: 50%; transform: translateX(-50%); width: calc(min(390px, 100vw) - 16px); }
  .legende[hidden], .leg-v[hidden] { display: none; }
  .leg-bec { position: absolute; top: -7px; right: 9px; width: 14px; height: 14px; background: #fff; transform: rotate(45deg); border-radius: 2px 0 0 0; }
  .leg-in { position: relative; max-height: calc(100vh - 56px); overflow-y: auto; overscroll-behavior: contain; background: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(22,22,26,.08), 0 16px 36px -14px rgba(22,22,26,.55); padding: 2px 12px 12px; display: flex; flex-direction: column; gap: 8px; font-size: 12px; color: var(--encre); }
  .leg-t { display: flex; align-items: center; justify-content: space-between; min-height: 32px; font-size: 14px; font-weight: 700; }
  .leg-x { width: 28px; height: 28px; border-radius: 50%; background: #ececf1; display: inline-flex; align-items: center; justify-content: center; }
  .leg-s { display: flex; flex-direction: column; gap: 5px; }
  .leg-s + .leg-s { border-top: 1px solid var(--trait); padding-top: 7px; }
  .leg-s h3 { font-size: 12px; font-weight: 700; color: var(--gris); }
  .leg-g { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px 8px; }
  .leg-g.l2 { grid-template-columns: repeat(2, 1fr); }
  .leg-i { display: flex; align-items: center; gap: 6px; min-height: 22px; }
  .leg-c { display: inline-flex; align-items: center; flex: none; }
  .leg-i .pi { width: 18px; height: 18px; }
  .leg-i .mb { flex-direction: row; }
  .leg-i .plus { margin: 0; }
  .leg-doigt { width: 22px; height: 22px; border-radius: 50%; background: rgba(22,22,26,.13); box-shadow: 0 0 0 2px rgba(22,22,26,.28); }
  .leg-p { display: flex; flex-direction: column; gap: 4px; }
  .leg-piste { position: relative; display: block; height: 18px; background: var(--f, #f4ecfa); }
  .leg-piste i { position: absolute; }
  .lp-z { left: 0; top: 7px; height: 5px; width: 78%; background: var(--z); }
  .lp-z::after { content: ''; position: absolute; right: -1px; top: -2px; width: 2px; height: 9px; background: var(--t); }
  .lp-b { left: 0; top: 7px; height: 5px; width: 56%; background: var(--b); border-radius: 0 2px 2px 0; }
  .lp-v { left: 66%; top: 0; bottom: 0; border-left: 1.5px dashed var(--encre); }
  .lp-r { left: 0; top: 3px; bottom: 0; width: 2px; background: var(--encre); }
  .leg-pl { display: flex; flex-wrap: wrap; gap: 2px 12px; }
  .leg-pl > span { display: inline-flex; align-items: center; gap: 5px; }
  .lk { display: inline-block; width: 12px; height: 5px; }
  .lk.r { width: 2px; height: 12px; background: var(--encre); }
  .lk.z { background: ${rgba(J.floral.base, 0.3)}; box-shadow: inset -2px 0 0 ${J.floral.texte}; }
  .lk.b { background: ${J.floral.base}; border-radius: 0 2px 2px 0; }
  .lk.v { width: 0; height: 12px; border-left: 1.5px dashed var(--encre); }

  /* La fiche, dans le langage de la page. */
  #fiche-racine { position: relative; z-index: 20; }
  .fi-voile { position: fixed; inset: 0; background: rgba(22,22,26,.32); }
  .fi { position: fixed; left: 0; right: 0; bottom: 0; max-height: 90vh; overflow-y: auto; overscroll-behavior: contain; background: var(--mur); border-radius: 8px 8px 0 0; box-shadow: 0 -10px 30px -16px rgba(22,22,26,.6); padding: 4px 10px 12px; display: flex; flex-direction: column; gap: 6px; max-width: 390px; margin: 0 auto; }
  .mode-bulle .fi { left: calc(50% + 211px); right: auto; bottom: auto; top: 16px; width: 360px; max-height: calc(100vh - 32px); border-radius: 8px; margin: 0; box-shadow: 0 10px 30px -12px rgba(22,22,26,.5); }
  @media (max-width: 1000px) { .mode-bulle .fi { left: auto; right: 16px; } }
  .fi-poignee { width: 32px; height: 4px; border-radius: 2px; background: #b9bcc6; align-self: center; flex: none; margin: 2px 0; }
  .mode-bulle .fi-poignee { display: none; }
  .fi-t { display: flex; align-items: center; gap: 8px; min-height: 30px; }
  .fi-t h2 { font-size: 16px; font-weight: 700; }
  .fi-x { margin-left: auto; width: 28px; height: 28px; border-radius: 50%; background: #fff; box-shadow: var(--ombre); display: inline-flex; align-items: center; justify-content: center; }
  .w { background: #fff; border-radius: 8px; box-shadow: var(--ombre); padding: 8px 10px; }
  .fi-duo { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 12px; }
  .fi-alpha { display: inline-flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .fi-alpha .al { font-size: 14px; }
  .fi-alpha .al.lot::before { font-size: 14px; }
  .fi-note { flex-basis: 100%; font-size: 12px; color: var(--gris); }
  .w-ar { display: flex; flex-direction: column; gap: 6px; }
  .fi-bars { display: flex; align-items: flex-end; gap: 10px; flex-wrap: wrap; }
  .fi-bars-c { display: inline-flex; align-items: flex-end; gap: 6px; }
  .fi-mb.sep { margin-left: 6px; }
  .fi-mb .mb-z { width: 9px; }
  .fi-mb.nd .pi { opacity: .45; }
  .mb-i { position: absolute; left: 0; right: 0; bottom: 3px; height: 6px; border-radius: 2px; background: repeating-linear-gradient(135deg, #fff 0 2px, #aeb3be 2px 3.5px); box-shadow: inset 0 0 0 1px #8a909b; }
  .fi-seule { font-size: 12px; color: var(--gris); padding-bottom: 2px; }
  .fi-lab { display: flex; align-items: flex-start; gap: 7px; }
  .fi-lab .pi { margin-top: 1px; }
  .fi-lab-t { display: block; font-size: 13px; line-height: 1.3; }
  .fi-lab-n { font-weight: 600; color: var(--t); }
  .fi-cpt { font-size: 12px; color: var(--gris); } .fi-sep { color: var(--gris); }
  .fi-mots { font-size: 13px; color: var(--encre); }
  .fi-sans, .fi-nd { font-size: 13px; color: var(--gris); }
  .fi-r { display: flex; justify-content: center; }
  .fi-roue text { font-family: var(--sans); }
  .fi-dem { display: flex; justify-content: center; gap: 14px; font-size: 13px; }
  .fi-dem b { font-weight: 600; }
  .fi-act { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .fi-g { display: inline-flex; gap: 2px; background: #fff; border-radius: 15px; padding: 2px; box-shadow: var(--ombre); }
  .fi-g button { width: 26px; height: 26px; border-radius: 13px; display: inline-flex; align-items: center; justify-content: center; color: var(--gris); }
  .fi-g button[aria-pressed="true"] { background: var(--encre); color: #fff; }
  .fi-b { height: 30px; padding: 0 12px; border-radius: 15px; background: #fff; box-shadow: var(--ombre); font-size: 13px; font-weight: 600; white-space: nowrap; }
  .fi-b1 { background: var(--encre); color: #fff; margin-left: auto; }
  .fi-replis { display: flex; gap: 4px; flex-wrap: wrap; }
  .fi-replis button { height: 26px; padding: 0 7px 0 10px; border-radius: 13px; background: rgba(255,255,255,.7); font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; gap: 3px; color: var(--encre); box-shadow: inset 0 0 0 1px rgba(22,22,26,.08); }
  .fi-replis button[aria-expanded="true"] { background: var(--encre); color: #fff; }
  .fi-sec { display: flex; flex-direction: column; gap: 4px; font-size: 13px; }
  .fi-sec[hidden] { display: none; }
  .fi-rg { display: flex; justify-content: space-between; gap: 8px; } .fi-rg span { color: var(--gris); } .fi-rg b { font-weight: 600; font-family: var(--mono); font-size: 12px; }
  .fi-tags { display: flex; flex-wrap: wrap; gap: 4px; } .fi-tags span { padding: 1px 7px; border-radius: 9px; background: #ececf1; font-size: 12px; }
  .fi-gris { color: var(--gris); font-size: 12px; } .fi-txt { font-size: 13px; } .fi-txt b { font-weight: 600; }
`;

export const page = (titre, commentaire, css, corps) => `<!doctype html>
<html lang="fr" data-cas="c1">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titre}</title>
<!-- ${commentaire} -->
${POLICES}
<style>${CSS}${css}</style>
</head>
<body>
${SPRITE}
<main class="ecran">${corps}
</main>
<div id="fiche-racine"></div>
<script>${K.LENTILLE_JS}${LEGENDE_JS}${FICHE_JS}</script>
</body>
</html>
`;

// Une vue fixe pour la capture (capture-page.mjs n'accepte pas de paramètres d'adresse) : la page réelle,
// dans un cadre de 390 × 844, dans l'état demandé (?legende, ?fiche=Motueka).
export const vue = (titre, src) => `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${titre}</title>
<style>html, body { margin: 0; background: #e9ecf2; } iframe { display: block; border: 0; width: 390px; height: 844px; }</style></head>
<body><iframe src="${src}" title="${titre}"></iframe></body></html>
`;

// La planche : l'écran en entier, la fiche ouverte, la légende ouverte, l'absolu, puis l'abécédaire.
export const planche = (titre, css, abc) => `<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${titre} · planche</title>
${POLICES}
<style>${CSS}${css}
  .pl { max-width: 390px; margin: 0 auto; padding: 8px 10px 12px; display: flex; flex-direction: column; gap: 8px; }
  .pl h1 { font-size: 14px; font-weight: 600; }
  .minis { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; align-items: start; }
  .mini-c { display: flex; flex-direction: column; gap: 8px; }
  .fen { position: relative; overflow: hidden; border-radius: 8px; box-shadow: var(--ombre); background: var(--mur); }
  .fen iframe { border: 0; transform-origin: 0 0; position: absolute; left: 0; top: 0; }
  .fen figcaption { position: absolute; left: 4px; bottom: 4px; z-index: 2; font-size: 12px; font-weight: 600; background: #fff; padding: 1px 6px; border-radius: 8px; box-shadow: var(--ombre); }
  .abc { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px 6px; padding: 10px; background: rgba(255,255,255,.55); border-radius: 8px; }
  .abc .it { display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .abc .it.wide { grid-column: span 2; align-items: stretch; }
  .abc .mt { font-size: 12px; color: var(--gris); text-align: center; }
  .sw { width: 48px; height: 30px; border-radius: 8px; }
  .tx { display: inline-flex; gap: 4px; font-size: 14px; height: 30px; align-items: center; }
  .abc .cmp { margin: 0; height: 30px; font-size: 13px; padding: 0 12px; }
  .abc .pis { display: inline-flex; gap: 4px; height: 30px; align-items: center; }
</style></head>
<body>${SPRITE}<main class="pl">
  <h1>${titre}</h1>
  <div class="minis">
    <figure class="fen" style="width:180px;height:847px"><iframe src="etat-b.html" width="390" height="1835" style="transform:scale(.4615)" title="Suggestions, la page entière"></iframe><figcaption>page</figcaption></figure>
    <div class="mini-c">
      <figure class="fen" style="width:180px;height:390px"><iframe src="etat-b.html?fiche=Motueka" width="390" height="844" style="transform:scale(.4615)" title="La fiche de Motueka"></iframe><figcaption>fiche</figcaption></figure>
      <figure class="fen" style="width:180px;height:390px"><iframe src="etat-b.html?legende" width="390" height="844" style="transform:scale(.4615)" title="La légende ouverte"></iframe><figcaption>légende</figcaption></figure>
      <figure class="fen" style="width:180px;height:390px"><iframe src="etat-b.html?abs" width="390" height="844" style="transform:scale(.4615)" title="Suggestions en absolu"></iframe><figcaption>absolu</figcaption></figure>
    </div>
  </div>
  ${abc}
</main></body></html>
`;
export function abecedaire() {
  const X = V[0], h = X.v.fiches[0];
  return `<div class="abc">
    <div class="it"><span class="sw" style="background:var(--mur);background-image:radial-gradient(80% 80% at 0 0,#ddd8f1,rgba(221,216,241,0)),radial-gradient(80% 80% at 100% 100%,#d6ebe2,rgba(214,235,226,0))"></span><span class="mt">fond</span></div>
    <div class="it"><span class="sw" style="background:#fff;box-shadow:var(--ombre)"></span><span class="mt">tuile</span></div>
    <div class="it"><span class="tx"><span style="font-weight:600">Aa</span><span style="color:var(--gris)">Aa</span><span class="q" style="color:var(--encre);font-size:13px">10 g</span></span><span class="mt">texte</span></div>
    <div class="it"><span class="plus" aria-hidden="true" style="margin:0">${ico('i-plus', 16)}</span><span class="mt">action</span></div>
    <div class="it wide"><span class="pis">${['floral', 'citrus', 'resin', 'tropical', 'spice', 'green'].map((f) => picto(f, 18)).join('')}</span><span class="mt">pictos au trait</span></div>
    <div class="it">${colonne(X, 'tropical', false)}<span class="mt">famille</span></div>
    <div class="it"><span class="leg-b" aria-hidden="true">${ico('i-aide', 18)}</span><span class="mt">légende</span></div>
    <div class="it wide"><span class="tx">${usage(h, { fiche: true })}${alpha(h)}</span><span class="mt">usage en pastille, α du lot</span></div>
    <div class="it wide"><div class="ob" style="--f:${J.floral.fond};--t:${J.floral.texte};--b:${J.floral.base}">${piste('floral', true)}</div><span class="mt">piste au style</span></div>
    <div class="it"><a class="cmp" href="#">Comparer</a><span class="mt">bouton</span></div>
  </div>`;
}
