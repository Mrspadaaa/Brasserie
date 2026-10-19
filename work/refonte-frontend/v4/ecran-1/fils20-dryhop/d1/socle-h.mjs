// Lot 20 · le socle commun de d1, d2 et d3 : les chiffres de H (donnees-h.json), la fiche g1 (fiches-h.json,
// rendue par le runtime du noyau de la baseline l8b, l8b/noyau.mjs : appui long 500 ms, survol 750 ms,
// Échap), les pictos au trait net (v2), les icônes lucide à 1,5 px, les tons des familles et l'habillage de
// l8b (surfaces blanches et grises, Source Sans 3 et IBM Plex Mono, 12, 14 et 16 px, verdicts à signe).
// Aucun chiffre écrit à la main ici : tout vient de donnees-h.json, du stock du prototype ou d'un calcul nommé.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as N from '../../fils18-baseline/l8b/noyau.mjs';
import { POLICES } from '../../fils18-baseline/l8b/matrice.mjs';

export const ICI = path.dirname(fileURLToPath(import.meta.url));
export const DOSSIER = path.dirname(ICI);
const REPO = path.resolve(DOSSIER, '../../../../..');
export const D = JSON.parse(fs.readFileSync(path.join(DOSSIER, 'donnees-h.json'), 'utf8'));
// Les fiches g1 : Citra, Cascade, Galaxy, Idaho 7 (fiches-h.json, hopSheet) ; Nugget, l'amérisant à 60′ de la
// recette S1 que le moteur compte aussi, vient tel quel de pack-fiches.json.
const PF = JSON.parse(fs.readFileSync(path.join(REPO, 'prototypes/houblons-v4/data/pack-fiches.json'), 'utf8')).fichesHoublons;
const FH = [...JSON.parse(fs.readFileSync(path.join(ICI, 'fiches-h.json'), 'utf8')).fiches, PF.find((f) => f.key === 'beermaverick-nugget')];
export const { JET, NOM, COURT, ORDRE } = N;
export const ACC = '#c2410c';
// Nugget garde sa couleur de la planche v3 (#2b68da) ; les quatre autres, celles de donnees-h.json.
export const HB = { ...D.houblons, nugget: { nom: 'Nugget', cle: 'beermaverick-nugget', couleur: '#2b68da' } };
export const PAR_CLE = Object.fromEntries(Object.entries(HB).map(([k, h]) => [h.cle, k]));

// ---------- l'α : le lot en stock (qui fait la dose), et la plage des fiches en plus petit ----------
const PROTO = JSON.parse(fs.readFileSync(path.join(REPO, 'prototypes/houblons-v4/data/proto-data.json'), 'utf8'));
export const STOCK = Object.fromEntries(PROTO.stock.map((s) => [s.key, s]));
const FICHE_PAR_CLE = Object.fromEntries(FH.map((f) => [f.key, f]));
export function alpha(k, { court = false } = {}) {
  const H = HB[k], f = FICHE_PAR_CLE[H.cle], s = STOCK[H.cle];
  const src = ((f && f.alpha && f.alpha.sources) || []);
  const lo = Math.min(...src.map((x) => x.min)), hi = Math.max(...src.map((x) => x.max));
  const qui = src.map((x) => x.source + (x.annee ? ' ' + x.annee : '')).join(', ');
  const fiches = src.length ? `<span class="al-f" data-role="alpha" data-source="fiches" data-niveau="S" aria-label="α des fiches ${fr(lo)}–${fr(hi)} % (${qui})">${fr(lo)}–${fr(hi)} %</span>` : '';
  if (s) return `<span class="al"><span class="al-l" data-role="alpha" data-source="lot" data-niveau="lot" aria-label="α du lot en stock ${fr(s.alpha)} % (${s.alphaFrom}), qui fait la dose">α ${fr(s.alpha)} %</span>${court ? '' : fiches}</span>`;
  // Pas de lot de cette forme en stock : la plage des fiches, et le lot d'une autre forme s'il existe.
  const autre = Object.values(STOCK).find((x) => x.varietyId === H.cle && x.key !== H.cle);
  return `<span class="al"><span class="al-l nl" data-role="alpha" data-source="fiches" data-niveau="S" aria-label="pas de lot en pellets en stock ; α des fiches ${fr(lo)}–${fr(hi)} % (${qui})">α ${fr(lo)}–${fr(hi)} %</span>${autre && !court ? `<span class="al-f" data-role="alpha" data-source="lot" data-niveau="lot" aria-label="en stock : ${H.nom} ${autre.form}, α ${fr(autre.alpha)} % (${autre.alphaFrom}) ; même huile avec 40 à 50 % de la masse [74]">${autre.form} ${fr(autre.alpha)} %</span>` : ''}</span>`;
}

// ---------- nombres : virgule, deux chiffres significatifs arrondis vers l'extérieur ----------
const sig = (x, sens) => {
  if (x == null) return null;
  if (x === 0) return 0;
  const e = Math.floor(Math.log10(Math.abs(x))) - 1, p = 10 ** e, q = x / p;
  const r = sens === 'bas' ? Math.floor(q + 1e-9) : sens === 'haut' ? Math.ceil(q - 1e-9) : Math.round(q);
  return Number((r * p).toPrecision(6));
};
export const fr = (x) => (x == null ? null : String(x).replace('.', ','));
export const bas = (x) => fr(sig(x, 'bas'));
export const haut = (x) => fr(sig(x, 'haut'));
export const srcTxt = (s) => (s || []).map((n) => (/^\d+$/.test(String(n)) ? '[' + n + ']' : String(n))).join(' ');
export const uniq = (xs) => [...new Set(xs.flat().filter((x) => x != null && x !== ''))];
// Un chiffre affiché : son élément porte sa source et son niveau (contrôle « honnêteté des chiffres »).
export const num = (txt, src, niv, cls = 'v', extra = '') => `<span class="${cls}" data-source="${srcTxt(src)}" data-niveau="${niv}"${extra}>${txt}</span>`;
// Une valeur inconnue : le mot, jamais 0.
export const inc = (raison, src = [], mot = 'inconnu', cls = 'inc') => `<span class="${cls}" data-inconnu data-source="${srcTxt(src)}" data-niveau="inconnu" aria-label="${mot} : ${raison}">${mot}</span>`;
// Une entrée du brasseur (dose, jours, moment) : pas une donnée de H.
export const ent = (txt, cls = 'e') => `<span class="${cls}" data-entree>${txt}</span>`;
// Un nom qui contient un chiffre (4MMP, 3MH, 16D, Idaho 7) : pas une valeur.
export const nom = (txt, cls = 'nmc') => `<span class="${cls}" data-nom>${txt}</span>`;

// ---------- plages : { min, max, inf, sup, inconnu, nd, src } ----------
export const P = (o, extraSrc = []) => (o && o.inconnu ? { inconnu: true, raison: o.raison, src: uniq([o.src || [], extraSrc]) }
  : o && o.nd ? { nd: true, src: uniq([o.src || [], extraSrc]) }
  : { min: o.v[0], max: o.v[1], inf: o.inf || null, sup: o.sup || null, src: uniq([o.src || [], extraSrc]) });
// Union de plages de sources : une borne inconnue dans une source rend la borne de l'union inconnue.
export const union = (xs) => {
  const k = xs.filter((x) => !x.inconnu && !x.nd);
  if (!k.length) return xs[0];
  const min = k.some((x) => x.min == null) ? null : Math.min(...k.map((x) => x.min));
  const max = k.some((x) => x.max == null) ? null : Math.max(...k.map((x) => x.max));
  const a = k.find((x) => x.min === min && x.inf), b = k.find((x) => x.max === max && x.sup);
  return { min, max, inf: a ? a.inf : null, sup: b ? b.sup : min == null ? '≤' : null, src: uniq(xs.map((x) => x.src)) };
};
export const fois = (p, a, b = a) => (p.inconnu || p.nd ? p : { ...p, min: p.min == null ? null : p.min * a, max: p.max == null ? null : p.max * b });
// Somme de charges : la borne basse additionne les bornes basses connues (chaque terme est ≥ 0) ; la borne
// haute n'existe que si toutes sont connues.
export const somme = (ps) => {
  const min = ps.reduce((t, p) => t + (p.inconnu || p.nd || p.min == null ? 0 : p.min), 0);
  const maxInc = ps.some((p) => p.inconnu || (!p.nd && p.max == null));
  const max = maxInc ? null : ps.reduce((t, p) => t + (p.nd ? 0 : p.max), 0);
  return { min: min > 0 ? min : null, max, inf: ps.some((p) => p.inf === '>') ? '>' : null, sup: ps.some((p) => p.sup === '<') && !maxInc ? '<' : ps.some((p) => p.sup) && !maxInc ? '≤' : null, maxInconnu: maxInc && !ps.every((p) => p.nd), src: uniq(ps.map((p) => p.src)) };
};
// Rapport au seuil, en plage : la plus petite concentration sur le plus haut seuil, la plus grande sur le plus bas.
export const rapport = (c, s) => {
  if (c.inconnu) return { inconnu: true, raison: c.raison, src: c.src };
  const rmin = c.min == null ? null : c.min / s.max, rmax = c.max == null ? null : c.max / s.min;
  const lecture = rmin != null && rmin > 1 ? 'dessus' : rmax != null && rmax < 1 ? 'sous' : 'selon';
  return { min: rmin, max: rmax, inf: c.inf, sup: c.sup, maxInconnu: c.maxInconnu, lecture, src: uniq([c.src, s.src]) };
};
export const LECTURE = { dessus: 'au-dessus du seuil quelle que soit la source', sous: 'sous le seuil quelle que soit la source', selon: 'selon la source du seuil' };
// Texte d'une plage : « 620–2170 », « > 56 », « ≤ 48 » ; borne haute inconnue : le mot.
export function plage({ min, max, inf, sup, maxInconnu }, { pre = '', unite = '', src = [], niv = 'H', ch = 2 } = {}) {
  const u = unite ? ' ' + unite : '';
  const b = (x) => (ch === 3 ? fr(sig3(x, 'bas')) : bas(x)), h = (x) => (ch === 3 ? fr(sig3(x, 'haut')) : haut(x));
  if (min == null && max == null) return inc('borne non publiée', src);
  if (max == null || maxInconnu) return num((inf || '≥') + ' ' + pre + b(min) + u, src, niv) + (maxInconnu ? ' ' + inc('borne haute inconnue', src, 'max inconnu', 'inc mi') : '');
  if (min == null) return num((sup && sup !== '≈' ? sup : '≤') + ' ' + pre + h(max) + u, src, niv);
  if (sig(min, 'bas') === sig(max, 'haut')) return num((sup === '≈' ? '≈ ' : '') + pre + b(min) + u, src, niv);
  return num((inf ? inf + ' ' : '') + pre + b(min) + '–' + (sup === '<' ? '< ' : '') + h(max) + u, src, niv);
}
const sig3 = (x, sens) => {
  if (x == null || x === 0) return x;
  const e = Math.floor(Math.log10(Math.abs(x))) - 2, p = 10 ** e, q = x / p;
  return Number(((sens === 'bas' ? Math.floor(q + 1e-9) : Math.ceil(q - 1e-9)) * p).toPrecision(6));
};

// ---------- les lectures par composé (H §7.4, §8.1, §8.2), dry hop après fermentation ----------
const SE = D.seuils;
export const SEUIL = {
  linalol: { ...union(SE.linalol_ugL.map((x) => P(x))), unite: 'µg/L' },
  geraniol: { ...union(SE.geraniol_ugL.map((x) => P(x))), unite: 'µg/L' },
  mmp4: { ...union(SE.mmp4_ngL.map((x) => P(x))), unite: 'ng/L' },
  mh3: { ...union(SE.mh3_ngL.map((x) => P(x))), unite: 'ng/L' },
};
const TGER = union(D.transferts.geraniol.dh.map((x) => P(x)));
const TMH3 = P(D.transferts.mh3.dh);
const THC = union(D.transferts.hydrocarbures.dh.map((x) => P(x)));
// Les familles que chaque composé porte (MOTEUR-POUVOIR §6) ; le 16D admet terreux, herbacé, floral.
export const COMPOSES = {
  linalol: { nom: 'linalol', familles: ['floral', 'citrus'], unite: 'µg/L' },
  geraniol: { nom: 'géraniol', familles: ['floral'], unite: 'µg/L' },
  mmp4: { nom: '4MMP', familles: ['tropical', 'berries'], unite: 'ng/L' },
  mh3: { nom: '3MH', familles: ['citrus', 'tropical'], unite: 'ng/L' },
  myrcene: { nom: 'myrcène', familles: ['green', 'resin'], unite: 'mL/hL' },
};
export const STYLE_FAM = D.style16D.arome.familles;
export const horsStyle = (c) => COMPOSES[c].familles.every((f) => !STYLE_FAM.includes(f));
/* Pour un houblon à la dose de H §7.4 (4 g/L), dry hop après fermentation : la charge introduite, la
   concentration en bière (charge × part retrouvée) et leurs sources. */
export function lecture(hk, c) {
  const X = D.dh4[hk], H = HB[hk], dose = D.dh4.dose_gL;
  if (c === 'linalol') {
    const intro = P(X.linalol_intro_ugL);
    const biere = union([P(X.linalol_biere_44_82), P(X.linalol_biere_7_23)]);
    return { intro, biere, base: 'part retrouvée 7–82 % selon la base de calcul', srcT: [22, 30, 31] };
  }
  if (c === 'geraniol') {
    const intro = P(X.geraniol_intro_ugL);
    return { intro, biere: intro.inconnu ? intro : { ...fois(intro, TGER.min / 100, TGER.max / 100), src: uniq([intro.src, TGER.src]) }, base: 'part retrouvée ' + TGER.min + '–' + TGER.max + ' %', srcT: TGER.src };
  }
  if (c === 'mmp4') return { intro: P(X.mmp4_intro_ngL), biere: P(X.mmp4_biere_ngL), base: 'part retrouvée ≈ 70 %', srcT: [11] };
  if (c === 'mh3') {
    const m = H.mh3_ugkg;
    if (!m || m.inconnu) return { intro: { inconnu: true, raison: (m && m.raison) || 'non publié', src: (m && m.src) || [] }, biere: { inconnu: true, raison: (m && m.raison) || 'non publié', src: (m && m.src) || [] } };
    if (m.nd) return { intro: { nd: true, src: m.src }, biere: { nd: true, src: m.src } };
    const u = union((Array.isArray(m) ? m : [m]).map((x) => P(x)));
    const intro = fois(u, dose);
    return { intro, biere: { ...fois(intro, TMH3.min / 100), src: uniq([intro.src, TMH3.src]) }, base: 'part retrouvée ≈ 70 % (supposé)', srcT: TMH3.src };
  }
  if (c === 'myrcene') {
    const hu = P(X.huile_mLhL), my = union(H.myrcene_pct.map((x) => P(x)));
    const intro = { min: hu.min * my.min / 100, max: hu.max * my.max / 100, src: uniq([hu.src, my.src]) };
    return { intro, biere: { inconnu: true, raison: 'densité du myrcène absente de H : pas de µg/L, pas de rapport au seuil', src: [] }, base: 'part retrouvée ≤ ' + fr(THC.max) + ' %', srcT: THC.src };
  }
}
export const NIV = (p) => 'H';


// ---------- les pictos des familles : UN SEUL ENDROIT pour changer de trait ----------
// Le brasseur choisit encore entre le trait net de v2 (ici) et le trait dessiné de l2 : changer PICTO.planche
// (et PICTO.trait) suffit. Une seule épaisseur rendue (1,5 px) ; le ton « texte » des jetons pour les familles
// claires (ton base sous 3:1 sur blanc), le ton base sinon ; ni disque pâle, ni halo.
export const PICTO = { planche: '../fils17-standard/v2/planche.html', trait: 1.5, ton: (f) => (JET[f].baseSurBlanc < 3 ? JET[f].texte : JET[f].base) };
const SYM = {};
for (const m of fs.readFileSync(path.join(DOSSIER, PICTO.planche), 'utf8').matchAll(/<symbol id="([^"]+)" viewBox="([^"]+)"[^>]*>([\s\S]*?)<\/symbol>/g)) SYM[m[1]] = m[3];
// En ligne (pas de <use>) : le trait se lit au rendu, aussi par le contrôle des couleurs.
export const picto = (f, z = 14) => `<svg class="pi" width="${z}" height="${z}" viewBox="0 0 24 24" data-famille="${f}" role="img" aria-label="${NOM[f]}" fill="none" stroke="${PICTO.ton(f)}" stroke-width="${Math.round(PICTO.trait * 24 / z * 1000) / 1000}" stroke-linecap="round" stroke-linejoin="round">${SYM['p-' + f]}</svg>`;

// ---------- les icônes : celles du noyau l8b, plus quelques lucide (même trait de 1,5 px) ----------
const lucide = (n) => { const t = fs.readFileSync(path.join(REPO, 'node_modules/lucide-react/dist/esm/icons/' + n + '.mjs'), 'utf8').match(/const __iconNode = (\[[\s\S]*?\]);\nconst/)[1];
  return new Function('return ' + t)().map(([tag, a]) => '<' + tag + ' ' + Object.entries(a).filter(([k]) => k !== 'key').map(([k, v]) => k + '="' + v + '"').join(' ') + '/>').join(''); };
const PLUS = { alerte: lucide('triangle-alert'), selon: lucide('arrow-down-up'), aide: lucide('circle-question-mark'), sablier: lucide('hourglass'), fiole: lucide('flask-conical'), thermo: lucide('thermometer'), balance: lucide('scale') };
const TAILLES = [12, 14, 16, 18];
export const symboles = () => N.symboles({ tailles: TAILLES }).replace('</svg>', TAILLES.map((z) => Object.entries(PLUS).map(([k, inner]) => `<symbol id="i-${k}-${z}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${Math.round(1.5 * 24 / z * 1000) / 1000}" stroke-linecap="round" stroke-linejoin="round">${inner}</symbol>`).join('')).join('') + '</svg>');
export const ic = (k, z = 14, cls = 'ic') => `<svg class="${cls}" width="${z}" height="${z}" aria-hidden="true"><use href="#i-${k}-${z}"/></svg>`;
// Le signe d'une lecture ordinale (verdict à signe, comme l8b) : au-dessus, sous, selon la source.
export const SIGNE = { dessus: 'haut', sous: 'bas', selon: 'selon', autour: 'selon' };
LECTURE.autour = 'autour du seuil : selon la source du seuil et la base';
export const signe = (l, z = 14) => `<span class="sg-l sg-${l}" role="img" aria-label="${LECTURE[l]}">${ic(SIGNE[l], z)}</span>`;

// ---------- la piste du rapport au seuil (échelle log), barres de l5b ----------
// Rail de 5 px, zone du style pâle (au ton de la famille, 30 %) bordée de son plafond au ton texte (ici :
// le seuil, au-delà duquel la 16D n'attend qu'un arôme faible et facultatif), barre au ton base, l'orangé
// au-delà du plafond quand c'est hors du style ; au-dessus, un filet par houblon à sa couleur.
const rgba = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
export const LOG = { lo: -2.5, hi: 3.5 };
export const xLog = (v, W) => Math.max(0, Math.min(W, (Math.log10(v) - LOG.lo) / (LOG.hi - LOG.lo) * W));
// zoneMax : le plafond de la zone du style, en × seuil (le moteur : ×10, convention [H] à fixer par le brasseur).
export function piste({ W, f, barres = [], total = null, orange = false, zone = true, zoneMax = 1 }) {
  const x = (v) => xLog(v, W);
  const x1 = x(1), xz = x(zoneMax), J = JET[f];
  const nb = barres.length, top = nb * 4 + 2, h = top + 7;
  let s = `<span class="trk" style="width:${W}px;height:${h}px;--top:${top}px" aria-hidden="true"><i class="rail"></i>`;
  if (zone) s += `<i class="zn" data-role="zone" data-famille="${f}" style="width:${xz.toFixed(1)}px;--z:${rgba(J.base, 0.3)};--t:${J.texte}"></i>`;
  s += `<i class="sl" style="left:${(x1 - 0.75).toFixed(1)}px"></i>`;
  const ctr = (r, y, hh) => (r && !r.inconnu && r.central != null && r.min != null && r.max != null ? `<i class="ct" style="left:${(x(r.central) - 1).toFixed(1)}px;top:${y - 1}px;height:${hh + 2}px"></i>` : '');
  const seg = (r, y, hh, cls, attrs, sty = '') => {
    if (!r || r.inconnu) return `<i class="${cls} hz" ${attrs} style="${sty}left:0;width:${W}px;top:${y}px;height:${hh}px"></i>`;
    if (r.nd) return `<i class="${cls} nd" ${attrs} style="${sty}left:0;top:${y - 1}px;width:${hh + 2}px;height:${hh + 2}px"></i>`;
    const ouvertH = r.max == null || r.maxInconnu;
    const a = r.min == null ? 0 : x(r.min), b = ouvertH ? W : x(r.max);
    let t = '';
    const a2 = r.min == null ? Math.max(0, b - 8) : a, b2 = ouvertH ? Math.min(W, a + 10) : b;
    if (r.min == null) t += `<i class="${cls} hz" ${attrs} style="${sty}left:0;width:${a2.toFixed(1)}px;top:${y}px;height:${hh}px"></i>`;
    t += `<i class="${cls}" ${attrs} style="${sty}left:${a2.toFixed(1)}px;width:${Math.max(3, b2 - a2).toFixed(1)}px;top:${y}px;height:${hh}px"></i>`;
    if (ouvertH) t += `<i class="${cls} hz" ${attrs} style="${sty}left:${b2.toFixed(1)}px;width:${(W - b2).toFixed(1)}px;top:${y}px;height:${hh}px"></i>`;
    return t;
  };
  barres.forEach((b, i) => { const H = HB[b.k] || b.h; s += seg(b.r, i * 4, 2.5, 'bh', `data-houblon="${H.cle}" data-couleur="${H.couleur}"`, `--c:${H.couleur};`); });
  if (total) {
    s += seg(total, top, 5, 'bt', `data-famille="${f}"`, `--c:${J.base};`) + ctr(total, top, 5);
    if (orange && !total.inconnu) {
      const a = Math.max(xz, total.min == null ? 0 : x(total.min)), b = total.max == null || total.maxInconnu ? W : x(total.max);
      if (b > a) s += `<i class="hs" style="left:${a.toFixed(1)}px;width:${(b - a).toFixed(1)}px;top:${top}px"></i>`;
    }
  }
  return s + '</span>';
}
export const CSS_PISTE = `
  .trk { position: relative; display: block; flex: none; }
  .trk i { position: absolute; display: block; }
  .trk .rail { left: 0; right: 0; top: var(--top); height: 5px; border-radius: 2px; background: #ececf1; }
  .trk .zn { left: 0; top: var(--top); height: 5px; background: var(--z); border-radius: 2px 0 0 2px; }
  .trk .zn::after { content: ''; position: absolute; right: -1px; top: -2px; width: 2px; height: 9px; border-radius: 1px; background: var(--t); }
  .trk .sl { top: 0; bottom: 0; width: 1.5px; background: #9a9aa6; }
  .trk .bh { background: var(--c); border-radius: 2px; }
  .trk .bh.hz { background: repeating-linear-gradient(135deg, var(--c) 0 1.5px, transparent 1.5px 4px); border-radius: 0; }
  .trk .bh.nd { background: #fff; box-shadow: inset 0 0 0 1.5px var(--c); border-radius: 50%; }
  .trk .bt { background: var(--c); border-radius: 2px; z-index: 1; }
  .trk .bt.hz { background: repeating-linear-gradient(135deg, var(--c) 0 1.5px, #fff 1.5px 4px); border-radius: 0; }
  .trk .hs { height: 5px; background: var(--acc); border-radius: 0 2px 2px 0; z-index: 2; }
  .trk .ct { width: 2px; background: var(--encre); border-radius: 1px; z-index: 3; }
  body.abs .trk .hs { display: none; }`;

// ---------- la fiche g1 ----------
const NOMS_H = { myrcene: 'myrcène', humulene: 'humulène', caryophyllene: 'caryophyllène', farnesene: 'farnésène', linalool: 'linalol' };
const plageSrc = (s) => ({ src: s.source, an: s.annee ?? null, min: s.min, max: s.max });
const minus = (xs) => { const vu = new Set(); return xs.filter((w) => { const k = w.toLowerCase(); if (vu.has(k)) return false; vu.add(k); return true; }).map((w) => w.toLowerCase()); };
// La même lecture que ficheDe de l8b/noyau.mjs, sur une fiche hopSheet (pack-fiches ou fiches-h.json) ;
// le lot du stock vient de STOCK (fiche de stock ou article).
function ficheDe(f) {
  const role = f.role ? { v: f.role.value, src: /^fournisseur/.test(f.role.source || '') ? 'fournisseur' : 'règle', txt: f.role.source } : null;
  const s = STOCK[f.key];
  const comp = (f.huiles && f.huiles.composants) || {};
  return { nom: f.name, role, voie: null, stock: s ? (s.grams > 0 ? 'suffisant' : 'manque') : null, ajout: null, origine: f.origin || null,
    alpha: ((f.alpha && f.alpha.sources) || []).map(plageSrc),
    lot: s ? s.alpha : null,
    beta: ((f.beta && f.beta.sources) || []).map(plageSrc),
    huiles: ((f.huiles && f.huiles.totale && f.huiles.totale.sources) || []).map(plageSrc),
    composants: Object.entries(NOMS_H).map(([k, n]) => (comp[k] ? { nom: n, min: comp[k].min, max: comp[k].max, src: comp[k].source } : { nom: n, raison: comp[k + 'Raison'] || null })),
    aromes: (f.aromes || []).filter((a) => a.sources > 0).map((a) => ({ f: a.family, n: a.sources, of: a.of, auteurs: a.authors || [], mots: minus((a.mots || []).flatMap((m) => m.mots)), premier: a.sources === 1 && (a.premier || []).length > 0 })),
    of: ((f.aromes || [])[0] || {}).of || 0,
    sans: minus((f.motsSansFamille || []).map((x) => x.mot)),
    styles: (f.usage || []).flatMap((u) => u.styles || []), stylesSrc: (f.usage || []).map((u) => u.source).filter(Boolean), stylesRaison: f.usageRaison || null,
    desc: (f.descripteurs && f.descripteurs.beerMaverick) || [],
    subs: Array.isArray(f.substituts) ? f.substituts.map((x) => (typeof x === 'string' ? x : x.name || x.nom || '')).filter(Boolean) : [], subsRaison: f.substitutsRaison || null };
}
export const FICHES = Object.fromEntries(FH.map((f) => [f.key, ficheDe(f)]));
const LEGENDE_JS = `
document.querySelectorAll('[data-role="legende-bouton"]').forEach((b) => b.addEventListener('click', (e) => {
  e.stopPropagation();
  const l = document.getElementById(b.getAttribute('aria-controls')), o = b.getAttribute('aria-expanded') !== 'true';
  b.setAttribute('aria-expanded', String(o)); l.hidden = !o;
}));
document.addEventListener('click', (e) => { const b = document.querySelector('[data-role="legende-bouton"][aria-expanded="true"]'); if (b && !e.target.closest('[data-role="legende"]')) b.click(); });
document.addEventListener('keydown', (e) => { const b = document.querySelector('[data-role="legende-bouton"][aria-expanded="true"]'); if (e.key === 'Escape' && b) { b.click(); b.focus(); } });
/* Les replis : un bouton qui ouvre son détail (fermé : display none, rien n'est lu ni compté). */
document.querySelectorAll('[data-role="repli"]').forEach((b) => b.addEventListener('click', () => {
  const o = b.getAttribute('aria-expanded') !== 'true', d = document.getElementById(b.getAttribute('aria-controls'));
  b.setAttribute('aria-expanded', String(o)); d.hidden = !o; b.closest('.rp').classList.toggle('ouvert', o);
}));
if (/[?&]ouvert\\b/.test(location.search)) document.querySelectorAll('[data-role="repli"]').forEach((b) => { if (b.offsetParent) b.click(); });
if (/[?&]legende\\b/.test(location.search)) document.querySelector('[data-role="legende-bouton"]').click();`;
// Un repli : son résumé est un bouton (le toucher l'ouvre ; l'appui long sur un houblon garde la fiche).
let NREP = 0;
export const repli = (resume, contenu, cls = '') => { const id = 'rp' + (++NREP); return `<div class="rp ${cls}"><button class="rp-s" data-role="repli" aria-expanded="false" aria-controls="${id}">${resume}<svg class="chev" width="12" height="12" aria-hidden="true"><use href="#i-chev-r-12"/></svg></button><div class="preuve" id="${id}" hidden>${contenu}</div></div>`; };
// Le runtime du noyau l8b (lentille, fiche, gestes), avec nos fiches et sans les objectifs de S1.
export const runtime = (extra = '') => N.runtime({ extra: extra + LEGENDE_JS })
  .replace(/const FD = [\s\S]*?;\nconst ROUE/, () => 'const FD = ' + JSON.stringify(FICHES) + ';\nconst ROUE')
  // Dans la fiche, la ligne « demande » lit ce que la 16D cite (terreux, herbacé, floral), au lieu des objectifs de S1.
  .replace(/DEMANDE = \[[^\]]*\]/, () => 'DEMANDE = ' + JSON.stringify(D.style16D.arome.familles.map((f) => ({ f, s: 1 }))))
  // Une famille du style que les fiches ne citent pas : « inconnu », avec le nombre de fiches lues (jamais 0).
  .replace("' ' + (a ? (a.of === 1 ? '1 fiche' : a.n + '/' + a.of) : 'inconnu')", "' ' + (a ? (a.of === 1 ? '1 fiche' : a.n + '/' + a.of) : 'inconnu' + (F.of ? ' (' + F.of + ' fiche' + (F.of > 1 ? 's' : '') + ' lue' + (F.of > 1 ? 's' : '') + ')' : ''))");
export const hn = (k, txt = HB[k].nom, cls = 'hn') => `<span class="${cls}" data-houblon="${HB[k].cle}" data-nom>${txt}</span>`;

// ---------- la lentille au style / absolu (au style par défaut), la légende cachée ----------
export const lentille = () => `<span class="seg lentille" role="radiogroup" aria-label="Lecture"><button role="radio" data-e="style" aria-checked="true">Au style</button><button role="radio" data-e="absolu" aria-checked="false">Absolu</button></span>`;
export const legende = (items) => `<button class="lg-b" data-role="legende-bouton" aria-expanded="false" aria-controls="legende" aria-label="Légende">?</button>
  <div class="lg" id="legende" data-role="legende" hidden><ul>${items.map(([v, m, src = 'définition', niv = 'légende']) => `<li data-source="${src}" data-niveau="${niv}"><span class="lg-v">${v}</span><span>${m}</span></li>`).join('')}</ul></div>`;

// ---------- l'habillage de l8b ----------
export const CSS = `
  :root { --encre: #16161a; --gris: #5b5b66; --trait: #dcdce3; --trait2: #c4c4cc; --piste: #ececf1; --doux: #f6f6f9; --acc: #c2410c; --acc-f: #fdf0ea;
    --sans: 'Source Sans 3', -apple-system, system-ui, 'Segoe UI', Roboto, sans-serif; --mono: 'IBM Plex Mono', ui-monospace, Consolas, monospace;
    --fi-bg: #fff; --fi-tx: #16161a; --fi-tx2: #2a2a30; --fi-gris: #5b5b66; --fi-trait: #dcdce3; --fi-voile: rgba(22,22,26,.3); --fi-rad: 8px;
    --r-anneau: #c9c9d2; --r-encre: #16161a; --r-plein: rgba(22,22,26,.1); }
  ${N.CSS_FAMILLES}
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #fff; color: var(--encre); }
  body { font: 400 14px/1.25 var(--sans); -webkit-tap-highlight-color: transparent; }
  button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; }
  summary { list-style: none; cursor: pointer; } summary::-webkit-details-marker { display: none; }
  :focus-visible { outline: 2px solid var(--encre); outline-offset: 2px; }
  svg { display: block; flex: none; }
  .ecran { max-width: 390px; margin: 0 auto; padding: 6px 12px 24px; display: flex; flex-direction: column; gap: 8px; overflow-x: hidden; }
  .v, .e { font-family: var(--mono); font-variant-numeric: tabular-nums; white-space: nowrap; font-size: 12px; font-weight: 500; }
  .inc { white-space: nowrap; color: var(--gris); font-size: 12px; }
  .gris { color: var(--gris); }
  .tete { display: flex; align-items: center; gap: 6px; min-height: 32px; position: relative; }
  h1 { font-size: 16px; font-weight: 700; white-space: nowrap; }
  .chip { display: inline-flex; align-items: center; gap: 4px; height: 24px; padding: 0 8px; border-radius: 12px; background: var(--piste); font-size: 12px; font-weight: 600; white-space: nowrap; }
  .seg { display: inline-flex; background: var(--piste); border-radius: 16px; padding: 2px; flex: none; }
  .seg button { height: 28px; padding: 0 10px; border-radius: 14px; font-size: 12px; color: var(--gris); white-space: nowrap; display: inline-flex; align-items: center; justify-content: center; gap: 4px; }
  .seg button[aria-checked="true"] { background: #fff; color: var(--encre); font-weight: 600; box-shadow: 0 1px 2px rgba(0,0,0,.12); }
  .lentille { margin-left: auto; }
  .lentille button[aria-checked="true"] { background: var(--encre); color: #fff; }
  .hn { font-weight: 600; text-decoration: underline dotted #8a8a96; text-underline-offset: 3px; white-space: nowrap; -webkit-touch-callout: none; -webkit-user-select: none; user-select: none; }
  .pt { display: inline-block; width: 8px; height: 8px; border-radius: 50%; flex: none; }
  .pi { flex: none; }
  .pis { display: inline-flex; gap: 2px; align-items: center; }
  .al { display: inline-flex; align-items: baseline; gap: 4px; white-space: nowrap; }
  .al-l { font: 600 12px var(--mono); color: var(--encre); }
  .al-l.nl { font-weight: 500; color: var(--gris); }
  .al-f { font: 500 12px var(--mono); color: var(--gris); }
  .etat { display: inline-flex; align-items: center; gap: 4px; height: 24px; padding: 0 8px 0 6px; border-radius: 12px; background: var(--piste); font-size: 12px; color: var(--gris); white-space: nowrap; }
  .hach { display: inline-block; width: 14px; height: 6px; border-radius: 2px; background: repeating-linear-gradient(135deg, #fff 0 2px, #8a909b 2px 3.5px); box-shadow: inset 0 0 0 1px #8a909b; flex: none; }
  .xs { display: inline-flex; align-items: center; gap: 3px; height: 20px; padding: 0 7px 0 5px; border-radius: 10px; background: var(--acc-f); color: var(--acc); font-weight: 600; font-size: 12px; white-space: nowrap; }
  .sg-l { display: inline-flex; color: var(--encre); } .sg-l.sg-sous { color: var(--gris); }
  body.abs .xs, body.abs [data-role="zone"], body.abs .seulstyle { display: none !important; }
  body:not(.abs) .seulabs { display: none !important; }
  details.pli { background: var(--doux); border-radius: 8px; padding: 0 8px; }
  details.pli > summary { display: flex; align-items: center; gap: 6px; min-height: 28px; }
  .rp { background: var(--doux); border-radius: 8px; }
  .rp-s { width: 100%; display: flex; align-items: center; gap: 6px; min-height: 28px; padding: 2px 8px; text-align: left; font-size: 12px; }
  .rp > .preuve { padding: 0 8px 8px; }
  .rp-s[aria-expanded="true"] .chev { transform: rotate(-90deg); }
  .chev { width: 12px; height: 12px; color: var(--gris); transform: rotate(90deg); transition: transform .15s; margin-left: auto; }
  details[open] > summary .chev { transform: rotate(-90deg); }
  .preuve { font-size: 12px; color: var(--gris); display: flex; flex-direction: column; gap: 4px; padding: 4px 0 8px; line-height: 1.35; }
  .preuve b { color: var(--encre); font-weight: 600; }
  .preuve table { border-collapse: collapse; width: 100%; }
  .preuve td, .preuve th { padding: 2px 4px 2px 0; text-align: left; vertical-align: top; font-weight: 400; }
  .preuve th { color: var(--gris); font-size: 12px; }
  .preuve td { color: var(--encre); }
  .src { color: var(--gris); font-size: 12px; }
  .lg-b { width: 24px; height: 24px; border-radius: 50%; background: var(--doux); color: var(--gris); font-size: 12px; font-weight: 600; flex: none; }
  .lg-b[aria-expanded="true"] { background: var(--encre); color: #fff; }
  .lg { position: absolute; z-index: 30; right: 0; top: 34px; width: 300px; background: #fff; border-radius: 8px; box-shadow: 0 8px 24px -8px rgba(0,0,0,.35), 0 0 0 1px var(--trait); padding: 8px 10px; }
  .lg ul { list-style: none; display: flex; flex-direction: column; gap: 6px; font-size: 12px; }
  .lg li { display: flex; align-items: center; gap: 8px; }
  .lg-v { width: 64px; flex: none; display: inline-flex; align-items: center; justify-content: center; gap: 2px; }
  [hidden] { display: none !important; }
  ${N.CSS_FICHE}
  .f-fiche { font-family: var(--sans); box-shadow: 0 -8px 28px rgba(0,0,0,.2); }
  .f-bulle { box-shadow: 0 10px 30px rgba(0,0,0,.22), 0 0 0 1px var(--trait); }
  .f-fermer { border-radius: 50%; background: var(--piste); }
  .f-role { border-radius: 12px; background: var(--piste); } .f-role.regle { background: none; box-shadow: inset 0 0 0 1.5px #9a9aa6; }
  .c { border-radius: 2px; background: var(--piste); } .c.m { background: var(--b); } .c.ci { background: var(--f); box-shadow: inset 0 0 0 1.5px var(--b); }
  .f-lab-n { color: var(--t); }
  .f-gout { border-radius: 16px; background: var(--piste); }
  .f-g { border-radius: 50%; } .f-g[aria-pressed="true"] { background: var(--encre); color: #fff; }
  .f-act { border-radius: 16px; box-shadow: inset 0 0 0 1.5px var(--encre); }
  .f-repli { border-radius: 14px; background: var(--doux); } .f-tag { border-radius: 4px; background: var(--doux); }
  .f-nom { font-size: 16px; font-weight: 700; } .f-aa { font: 600 16px var(--mono); } .f-grec { font-size: 14px; } .f-lot, .f-cpt, .f-lab-mots, .f-lab-sans, .f-lab-nd, .f-seule, .f-dem, .f-repli, .f-sec, .f-tag { font-size: 12px; }
  .f-lot, .f-cpt, .f-rg-v { font-family: var(--mono); } .f-role { font-size: 12px; } .f-act { font-size: 14px; } .r-lab { font-size: 12px; font-family: var(--sans); }
  .appui { background: var(--doux); border-radius: 4px; }`;

export const page = ({ titre, commentaire, css, corps, js }) => `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titre}</title>
<!-- ${commentaire} -->${POLICES}
<style>${CSS}
${css}</style>
</head>
<body>
${symboles()}
<main class="ecran">${corps}
</main>
<script>${runtime(js)}</script>
</body>
</html>
`;
export const chev = () => '<svg class="chev" width="12" height="12" aria-hidden="true"><use href="#i-chev-r-12"/></svg>';
export const ecrire = (f, s) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, s); console.log('écrit ' + path.relative(DOSSIER, f) + ' (' + s.length + ' o)'); };
