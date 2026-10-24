// Lot 20 · d5 · Le lot avant la variété. Le certificat du lot (huile, linalol, géraniol, HSI) remplace
// la plage de la variété : on choisit le lot, les barres se resserrent sur lui. Les charges, les rapports
// au seuil et la lecture face à la 16D sont ceux du moteur « pouvoir aromatique »
// (d4/moteur-lot20.ts → d4/moteur-lot20.json) ; l'α, les 29 lots de 2015, l'intensité OSU et les points
// HSI de Citra et Galaxy viennent de ../donnees-h.json. Barres longues, style l5b.
// Usage : node generer.mjs → etat.html
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { H, N, ENTREE, INC, pic, ico, hop, alpha, lentille, legende, legendeBouton, page, detail, fr, esc, srcTxt, HOP, ton } from '../d4/commun.mjs';

const ici = path.dirname(fileURLToPath(import.meta.url));
const M = JSON.parse(fs.readFileSync(path.join(ici, '../d4/moteur-lot20.json'), 'utf8'));
const D5 = H.d5;
const srcM = (l) => (l || []).map((k) => { const m = String(k).match(/^H(\d+)/); return m ? Number(m[1]) : k; }).filter((v, i, a) => a.indexOf(v) === i);
const nivM = (l) => { const n = (l || []).map((k) => (M.sources[k] || {}).niveau).filter(Boolean); return ['P', 'F', 'S', 'H'].find((x) => n.includes(x)) || (l || []).some((k) => /^coa/.test(k)) ? (['P', 'F', 'S', 'H'].find((x) => n.includes(x)) || 'F') : 'H'; };
// Deux chiffres significatifs, à la française.
const sig = (x) => { if (x == null) return '?'; const a = Math.abs(x); const d = a >= 100 ? 0 : a >= 10 ? 0 : a >= 1 ? 1 : Math.max(1, -Math.floor(Math.log10(a)) + 1); return fr(Math.round(x * 10 ** d) / 10 ** d, d); };
const LOTS = [
  { id: 'variete', t: 'fiche', g: 'v' },
  { id: 'CAS-2400', t: '2400', g: 'coa' }, { id: 'CAS-2401', t: '2401', g: 'coa' }, { id: 'CAS-2519', t: '2519', g: 'coa' }, { id: 'CAS-2520', t: '2520', g: 'coa' },
  { id: 'samia-2026', t: 'Samia', g: 'th' }, { id: 'kishimoto-2006', t: '2006', g: 'th' },
];
const DEF = 'CAS-2400';
const C = (id) => M.d5['cascade|' + id];
const COA = D5.cascadeCOA;

// ---- les barres (style l5b : longues, fines, au ton de la famille) ----
const W = 236; // largeur de la piste, px
const lin = (a, b) => (x) => Math.max(0, Math.min(W, ((x - a) / (b - a)) * W));
const log = (a, b) => (x) => Math.max(0, Math.min(W, ((Math.log10(Math.max(x, a)) - Math.log10(a)) / (Math.log10(b) - Math.log10(a))) * W));
// Une piste : la plage de la variété (ton fond + trait), les autres lots en tirets, le lot choisi en repère.
const TN = (f, k) => (f ? ton(f, k) : { fond: '#ececf1', base: '#16161a', texte: '#16161a' }[k]);
function piste({ X, bande, lots, choisi, f, label, unite, valeur, ticks = [], bandeAttr = '', extra = '' }) {
  const b = bande && bande.min != null && bande.max != null ? '<i class="pv" style="left:' + X(bande.min).toFixed(1) + 'px;width:' + Math.max(3, X(bande.max) - X(bande.min)).toFixed(1) + 'px;background:' + TN(f, 'fond') + ';box-shadow:inset 0 0 0 1.5px ' + TN(f, 'base') + '"' + (f ? ' data-famille="' + f + '"' : '') + bandeAttr + '></i>' : '';
  const t = ticks.map((k) => '<i class="tk' + (k.cls ? ' ' + k.cls : '') + '" style="left:' + X(k.x).toFixed(1) + 'px"></i>' + (k.lab ? '<span class="tk-l" style="left:' + X(k.x).toFixed(1) + 'px">' + k.lab + '</span>' : '')).join('');
  const l = lots.map((x) => '<i class="lt" style="left:' + X(x).toFixed(1) + 'px"></i>').join('');
  const c = choisi != null ? '<i class="ch" style="left:' + X(choisi).toFixed(1) + 'px;background:' + TN(f, 'texte') + '"></i>' : '';
  return '<div class="br"><span class="br-n">' + label + '</span><span class="br-v">' + valeur + '</span><span class="tr" role="img" aria-label="' + esc(label + ' ' + unite) + '"><i class="ax"></i>' + b + t + l + c + extra + '</span></div>';
}
const vMot = (g, unite) => (g.inconnu ? INC(g.inconnu, srcM(g.sources), g.niveau || 'H') : N((g.plage.min === g.plage.max ? sig(g.plage.min) : sig(g.plage.min) + '–' + sig(g.plage.max)) + ' ' + unite, srcM(g.sources), g.niveau || nivM(g.sources)));
const rMot = (g) => (g.inconnu || !g.plage || g.plage.min == null && g.plage.max == null ? INC('rapport au seuil inconnu', srcM(g.sources), 'H') : N((g.plage.min == null ? '< ' : '×' + sig(g.plage.min) + '–') + '×' + sig(g.plage.max), srcM(g.sources), g.niveau || 'H'));

const XH = lin(0, 12), XL = log(5, 1000), XR = log(0.001, 1000), XA = lin(0, 12);
// L'α : la plage des fiches, l'α du lot en stock (fiche de stock), les certificats ; la perte d'α selon le
// HSI du certificat choisi (classe BarthHaas, drapeau du moteur).
const AL = D5.alpha.cascade;
function alphaRow(E, coa) {
  const hsi = E.drapeaux.find((d) => d.id === 'hsi');
  const perte = hsi ? hsi.statut.split('transformation ')[1] : null;
  const val = (coa && coa.alpha_pct != null ? N(fr(coa.alpha_pct) + ' %', coa.src, coa.niv) : '<span class="a-lot n mono" data-role="alpha" data-source="lot" data-niveau="F">' + fr(AL.lot.v) + ' %</span>')
    + (perte ? '<span class="gris pe">' + N('perdu ' + perte, srcM(hsi.sources), 'F') + '</span>' : '');
  const stock = '<i class="st-a" data-role="alpha" data-source="lot" data-niveau="F" aria-label="α du lot en stock ' + fr(AL.lot.v) + ' %" style="left:' + XA(AL.lot.v).toFixed(1) + 'px"></i>';
  return piste({ X: XA, f: null, label: 'α', unite: '%', valeur: val, bande: { min: AL.fiches.v[0], max: AL.fiches.v[1] }, bandeAttr: ' data-role="alpha" data-source="fiches" data-niveau="S"', lots: COA.map((x) => x.alpha_pct), choisi: coa ? coa.alpha_pct : null, extra: stock });
}
function etat(id) {
  const E = C(id), V = C('variete'), coa = COA.find((x) => x.lot === id);
  const ch = (c) => E.composes[c].charge.plage;
  const lotsCOA = (c) => COA.map((x) => C(x.lot).composes[c].charge.plage.min);
  const huileLots = COA.map((x) => C(x.lot).chargeHuile.plage.min);
  const facteur = (c) => { const v = lotsCOA(c); return Math.max(...v) / Math.min(...v); };
  const ratio = (c, f) => {
    const g = E.composes[c].rapport, p = g.plage;
    const X = XR;
    const band = p && (p.min != null || p.max != null) ? '<i class="pv" data-famille="' + f + '" style="left:' + X(p.min ?? 0.001).toFixed(1) + 'px;width:' + Math.max(3, X(p.max ?? 1000) - X(p.min ?? 0.001)).toFixed(1) + 'px;background:' + ton(f, 'fond') + ';box-shadow:inset 0 0 0 1.5px ' + ton(f, 'base') + (p.min == null ? ';border-left:2px dotted ' + ton(f, 'base') : '') + '"></i>' : '';
    const hors = E.faceAuStyle.statut === 'hors du style' && E.faceAuStyle.composes.includes(c);
    const xs = hors ? '<i class="xs-b seul-style" style="left:' + X(10).toFixed(1) + 'px;width:' + (X(p.max ?? 1000) - X(10)).toFixed(1) + 'px"></i>' : '';
    const cen = p && p.central != null ? '<i class="cen" style="left:' + X(p.central).toFixed(1) + 'px;background:' + ton(f, 'texte') + '"></i>' : '';
    const nd = E.famillesNonDecrites.some((x) => (c === '4MMP' ? ['tropical', 'berries'] : ['citrus']).includes(x));
    return '<div class="br"><span class="br-n">' + pic(f) + '<b>' + E.composes[c].nom.replace(' (4MSP)', '') + '</b></span><span class="br-v">' + rMot(g) + '</span><span class="tr" role="img" aria-label="' + esc(E.composes[c].nom + ' : ' + E.composes[c].lecture.texte) + '"><i class="ax"></i>'
      + '<i class="zn seul-style" data-role="zone" style="width:' + X(10).toFixed(1) + 'px" aria-label="la 16D : arôme de houblon faible et facultatif, jusqu\'au facteur ×10 du moteur (convention à valider)"></i>'
      + band + xs + cen + '<i class="tk" style="left:' + X(1).toFixed(1) + 'px"></i><i class="tk tk-c seul-style" style="left:' + X(10).toFixed(1) + 'px"></i></span>'
      + (nd ? '<span class="nd seul-style" data-detail="nd-' + id + '">' + N('non décrit 16D', ['moteur'], 'H') + '</span>' : '') + '</div>';
  };
  const coaThiols = coa ? '<span class="sous">' + INC('le certificat ne donne pas les thiols', ['dépôt:coa'], 'F') + '</span>' : '';
  const hsiDr = E.drapeaux.find((d) => d.id === 'hsi');
  return '<div class="etat" data-lot="' + id + '"' + (id === DEF ? '' : ' hidden') + '>'
    + '<section class="carte bloc" aria-label="Charges à 4 g/L">'
    + '<div class="bl-t"><span class="sec-t">' + ico('j-cert', 14) + (coa ? N(coa.lot, coa.src, coa.niv) + N(String(coa.annee), coa.src, coa.niv, 'gris')  : id === 'variete' ? '<b>plage des fiches</b>' : N(E.lot, srcM(E.drapeaux.find((d) => d.id === 'lot').sources), 'P')) + '</span>'
    + (hsiDr ? '<span class="hsi-t">' + N('HSI ' + fr(coa.hsi, 3), coa.src, coa.niv) + '</span>' : '') + '</div>'
    + alphaRow(E, coa)
    + piste({ X: XH, f: null, label: 'huile', unite: 'mL/hL', valeur: vMot(E.chargeHuile, 'mL/hL'), bande: V.chargeHuile.plage, lots: huileLots, choisi: coa ? E.chargeHuile.plage.min : null })
    + piste({ X: XL, f: 'floral', label: 'linalol', unite: 'µg/L', valeur: vMot(E.composes.linalol.charge, 'µg/L') + '<span class="fx" data-detail="fx">' + ico('j-cert', 14) + N('×' + sig(facteur('linalol')), ['dépôt:coa', 'moteur'], 'H', 'fx-n') + '</span>', bande: V.composes.linalol.charge.plage, lots: lotsCOA('linalol'), choisi: coa ? ch('linalol').min : null })
    + piste({ X: XL, f: 'floral', label: 'géraniol', unite: 'µg/L', valeur: vMot(E.composes.geraniol.charge, 'µg/L'), bande: V.composes.geraniol.charge.plage, lots: lotsCOA('geraniol'), choisi: coa ? ch('geraniol').min : null })
    + '</section>'
    + '<section class="carte bloc" aria-label="Face à la 16D">'
    + '<div class="bl-t"><span class="sec-t">' + N('16D', srcM(M.style16D.sources), 'S') + '<span class="seul-style gris">' + N('×10', ['moteur'], 'H') + ' à valider</span></span></div>'
    + ratio('linalol', 'floral') + ratio('4MMP', 'tropical') + coaThiols
    + '</section>'
    + '</div>';
}

// ---- variabilité, sans choix de lot : 29 lots de 2015, intensité OSU, classes de HSI ----
function variabilite() {
  const g = D5.cascade2015, XG = lin(0, 4.5);
  const pts = g.geraniol_mg100g.map((x) => '<i class="pd" style="left:' + XG(x).toFixed(1) + 'px"></i>').join('');
  const mn = Math.min(...g.geraniol_mg100g), mx = Math.max(...g.geraniol_mg100g);
  const I = D5.intensite, XI = lin(0, 15);
  const cls = M.hsiClasses.classes, XS = lin(0.2, 0.7);
  const segs = cls.map((k, i) => { const a = k.de ?? 0.2, b = k.a ?? 0.7; return '<i class="hs hs' + i + '" style="left:' + XS(a).toFixed(1) + 'px;width:' + (XS(b) - XS(a)).toFixed(1) + 'px"></i><span class="hs-l" style="left:' + ((XS(a) + XS(b)) / 2).toFixed(1) + 'px" data-source="' + esc(srcTxt(srcM(M.hsiClasses.sources))) + '" data-niveau="F">' + k.transformation.replace(' %', '').replace('≤ ', '≤').replace('> ', '>') + '</span>'; }).join('');
  const hp = (hid) => (D5.hsiPoints[hid].points.map((p) => '<i class="hp" data-houblon="' + HOP[hid].cle + '" data-couleur="' + HOP[hid].couleur + '" style="left:' + XS(p.hsi).toFixed(1) + 'px;background:' + HOP[hid].couleur + '"></i>').join(''));
  const coaPts = COA.map((x) => '<i class="hc" style="left:' + XS(x.hsi).toFixed(1) + 'px" data-lot="' + x.lot + '"></i>').join('');
  return '<section class="carte bloc" aria-label="Le lot pèse autant que la variété">'
    + '<div class="br" data-detail="v-geraniol"><span class="br-n">' + pic('floral') + '<b>' + N('29 lots', g.src, g.niv) + '</b></span><span class="br-v">' + N('×' + Math.round(mx / mn), g.src, g.niv) + '</span><span class="tr" role="img" aria-label="géraniol de 29 lots de Cascade 2015, de ' + fr(mn) + ' à ' + fr(mx) + ' mg/100 g"><i class="ax"></i>' + pts + '</span></div>'
    + '<div class="br" data-detail="v-intensite"><span class="br-n">' + ico('j-plage', 14) + '<b>intensité</b></span><span class="br-v">' + N(fr(I.v[0]) + '–' + fr(I.v[1]) + ' /15', I.src, I.niv) + '</span><span class="tr" role="img" aria-label="intensité globale de 6 à 9,5 sur 15 à 3,8 g/L, 29 lots"><i class="ax"></i><i class="pv" style="left:' + XI(I.v[0]).toFixed(1) + 'px;width:' + (XI(I.v[1]) - XI(I.v[0])).toFixed(1) + 'px;background:#ececf1;box-shadow:inset 0 0 0 1.5px #16161a"></i></span></div>'
    + '<div class="br hsi" data-detail="v-hsi"><span class="br-n"><b>α perdu</b></span><span class="br-v"></span><span class="tr tr-h" role="img" aria-label="classes de HSI et perte d\'α (BarthHaas) ; certificats de Cascade, Citra et Galaxy vieillis">' + segs + coaPts + '</span></div>'
    + '</section>';
}

// ---- plan 2 ----
let details = '';
details += detail('v-geraniol', N('géraniol de 29 lots, Cascade 2015', D5.cascade2015.src, 'P'), [['plage', N(fr(Math.min(...D5.cascade2015.geraniol_mg100g)) + '–' + fr(Math.max(...D5.cascade2015.geraniol_mg100g)) + ' mg/100 g', D5.cascade2015.src, 'P')], ['agrumes', N(esc(D5.etalonnage.v), D5.etalonnage.src, 'P')], ['source', '<span class="src" data-source="[23]" data-niveau="P">' + esc(D5.cascade2015.fichier) + '</span>']]);
details += detail('v-intensite', N('intensité de 29 lots', D5.intensite.src, D5.intensite.niv), [[N('à 3,8 g/L', D5.intensite.src, D5.intensite.niv), N(fr(D5.intensite.v[0]) + ' à ' + fr(D5.intensite.v[1]) + ' sur 15', D5.intensite.src, D5.intensite.niv)], ['huile', N(fr(D5.huileLots.v[0]) + '–' + fr(D5.huileLots.v[1]) + ' mL/100 g', D5.huileLots.src, D5.huileLots.niv)], ['récolte', N(esc(D5.recolte.v), D5.recolte.src, D5.recolte.niv)], ['4MMP', N(esc(D5.simcoe.v), D5.simcoe.src, D5.simcoe.niv)]]);
details += detail('v-hsi', 'HSI et perte d\'α', [...M.hsiClasses.classes.map((k) => [N(esc(k.hsi), [25], 'F'), N(esc(k.transformation), [25], 'F')]),
  ['Citra', N(D5.hsiPoints.citra.points.map((p) => 'HSI ' + fr(p.hsi) + ' : α −' + p.perteAlpha + ' %').join(' ; ') + ' ; huile ' + fr(D5.hsiPoints.citra.huile[0]) + ' → ' + fr(D5.hsiPoints.citra.huile[1]), [25], 'F')],
  ['Galaxy', N(D5.hsiPoints.galaxy.points.map((p) => 'HSI ' + fr(p.hsi) + ' : α −' + p.perteAlpha + ' %').join(' ; ') + ' ; huile ' + fr(D5.hsiPoints.galaxy.huile[0]) + ' → ' + fr(D5.hsiPoints.galaxy.huile[1]), [25], 'F')],
  ['arôme', N(esc(D5.hsiArome.v), D5.hsiArome.src, D5.hsiArome.niv)]]);
{ const v = COA.map((x) => C(x.lot).composes.linalol.charge.plage.min);
  details += detail('fx', 'linalol, d\'un certificat à l\'autre', [[ENTREE('à 4 g/L'), N(sig(Math.min(...v)) + ' → ' + sig(Math.max(...v)) + ' µg/L', ['dépôt:coa', 'moteur'], 'H')], ['certificats', N(COA.map((x) => x.lot + ' : ' + fr(x.linalol_pct) + ' %').join(' ; '), ['dépôt:coa'], 'F')], ['écart', N(esc(D5.contradiction.v), D5.contradiction.src, D5.contradiction.niv)], ['fiches', N(esc(C('variete').composes.linalol.lotsHorsPlage.join(' ; ')), ['moteur'], 'H')]]); }
for (const L of LOTS) {
  const E = C(L.id);
  const lignes = E.drapeaux.filter((d) => /lot|hsi/.test(d.id)).map((d) => [esc(d.titre), '<b data-source="' + esc(srcTxt(srcM(d.sources))) + '" data-niveau="' + nivM(d.sources) + '">' + esc(d.statut) + '</b><br><span class="pq" data-source="' + esc(srcTxt(srcM(d.sources))) + '" data-niveau="' + nivM(d.sources) + '">' + esc(d.pourquoi) + '</span>']);
  lignes.push(['16D', '<span class="pq" data-source="moteur" data-niveau="H">' + esc(E.faceAuStyle.statut + ' : ' + E.faceAuStyle.texte) + '</span>']);
  details += detail('lot-' + L.id, 'Cascade · ' + (L.id === 'variete' ? 'plage des fiches' : L.id), lignes);
  details += detail('nd-' + L.id, 'non décrit par la 16D', [['moteur', '<span class="pq" data-source="moteur" data-niveau="H">' + esc(E.faceAuStyle.texte) + '</span>'], [N('×10', ['moteur'], 'H'), '<span class="pq" data-source="moteur" data-niveau="H">' + esc(M.d4['us05|actif'].facteurEleve.convention) + ' : convention à valider</span>']]);
}

const LEGENDE = legende([
  ['<i class="lg-pv"></i>', 'plage de la variété (fiches)'],
  ['<i class="lg-ch"></i>', 'le lot choisi (certificat)'],
  ['<i class="lg-lt"></i>', 'les autres certificats'],
  ['<i class="st-a" style="position:static;display:inline-block;margin:0"></i>', 'α du lot en stock (fiche de stock, sans certificat)'],
  ['<i class="lg-zn"></i>', 'au style : la 16D, faible et facultatif, jusqu\'à ×10 le seuil (convention du moteur, à valider)'],
  ['<i class="lg-tk"></i>', 'le seuil (×1)'],
  ['<span class="nd" style="height:20px">16D</span>', 'famille au-dessus du seuil que la 16D ne décrit pas'],
  ['<span class="fx" style="margin:0">×18</span>', 'écart du linalol introduit entre les certificats'],
  ['<i class="lg-pd"></i>', 'un lot de Cascade 2015 (géraniol)'],
  ['<i class="lg-hs"></i>', 'classe de HSI ; chiffre : % d\'α perdus'],
  ['<span class="alpha"><span class="a-lot n">6,5 %</span><span class="a-fi n">4,5–9</span></span>', 'α du lot en stock, puis plage des fiches'],
]);

const chipsLots = '<div class="lots" role="radiogroup" aria-label="Lot">' + LOTS.map((L, i) => (i === 1 ? '<span class="lg-g" aria-hidden="true">' + ico('j-cert', 14) + '</span>' : i === 5 ? '<span class="lg-g" aria-hidden="true">' + pic('tropical') + '</span>' : '') + '<button type="button" role="radio" class="lc" data-v="' + L.id + '" aria-checked="' + (L.id === DEF) + '" aria-label="' + esc(L.id === 'variete' ? 'plage des fiches' : 'lot ' + L.id) + '">' + (/^\d/.test(L.t) ? ENTREE(L.t) : L.t) + '</button>').join('') + '</div>';
const V = C('variete');
const corps = '<main class="ecran">'
  + '<div class="barre"><button class="retour" type="button" aria-label="Retour">' + ico('i-chev-l', 16) + '</button><h1>Le lot d\'abord</h1>' + lentille() + legendeBouton() + '</div>'
  + '<div class="hl" data-role="ligne-houblon" data-cle-fiche="' + HOP.cascade.cle + '">' + hop('cascade') + alpha('cascade') + '<span class="aj-j">' + ENTREE('4 g/L', 'dose') + ENTREE('J7') + ENTREE('3 j') + '</span></div>'
  + chipsLots
  + LOTS.map((L) => etat(L.id)).join('')
  + variabilite()
  + '</main>' + LEGENDE + details;

const css = `
  .hl { display: flex; align-items: center; gap: 8px; min-height: 28px; }
  .aj-j { margin-left: auto; display: inline-flex; align-items: baseline; gap: 6px; font-size: 12px; }
  .dose { font-weight: 600; font-size: 14px; }
  .lots { display: flex; align-items: center; gap: 1px; overflow-x: auto; scrollbar-width: none; background: var(--piste); border-radius: 16px; padding: 2px; }
  .lc { height: 28px; padding: 0 5px; border-radius: 14px; font-size: 12px; color: var(--gris); white-space: nowrap; }
  .lc[aria-checked="true"] { background: #fff; color: var(--encre); font-weight: 600; box-shadow: 0 1px 2px rgba(0,0,0,.12); }
  .lg-g { display: inline-flex; margin-left: 4px; color: var(--gris); }
  .bloc { padding: 4px 10px 8px; display: flex; flex-direction: column; gap: 2px; }
  .bl-t { display: flex; align-items: center; gap: 8px; min-height: 30px; }
  .bl-t .sec-t { color: var(--encre); font-size: 14px; gap: 8px; }
  .hsi-t { margin-left: auto; font-size: 12px; }
  .a-coa { font-size: 14px; font-weight: 600; }
  .br { display: grid; grid-template-columns: 76px 1fr; grid-template-rows: auto 16px; column-gap: 8px; align-items: center; min-height: 40px; padding: 2px 0; }
  .br + .br { border-top: 1px solid var(--trait); }
  .br-n { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; grid-row: 1 / 3; }
  .br-n b { font-weight: 600; }
  .br-v { font-size: 12px; justify-self: start; }
  .tr { position: relative; height: 14px; width: ${W}px; }
  .ax { position: absolute; left: 0; right: 0; top: 6px; height: 2px; border-radius: 2px; background: var(--piste); }
  .pv { position: absolute; top: 3px; height: 8px; border-radius: 2px; }
  .lt { position: absolute; top: 1px; width: 2px; height: 12px; margin-left: -1px; border-radius: 2px; background: #9a9aa6; }
  .ch { position: absolute; top: -2px; width: 4px; height: 18px; margin-left: -2px; border-radius: 2px; }
  .cen { position: absolute; top: 1px; width: 3px; height: 12px; margin-left: -1.5px; border-radius: 2px; }
  .tk { position: absolute; top: -1px; width: 2px; height: 16px; margin-left: -1px; border-radius: 2px; background: var(--encre); }
  .tk-c { background: #8a909b; }
  .zn { position: absolute; left: 0; top: 2px; height: 10px; border-radius: 2px; background: #e4e4ea; }
  .xs-b { position: absolute; top: 3px; height: 8px; border-radius: 0 2px 2px 0; background: var(--acc); }
  .nd { grid-column: 2; justify-self: end; font-size: 12px; display: inline-flex; align-items: center; height: 20px; padding: 0 6px; border-radius: 10px; box-shadow: inset 0 0 0 1px var(--trait2); }
  .sous { display: flex; justify-content: flex-end; padding: 2px 0; }
  .fx { display: inline-flex; align-items: center; gap: 3px; margin-left: 10px; padding: 0 6px; height: 20px; border-radius: 10px; background: var(--piste); cursor: pointer; }
  .pe { margin-left: 6px; }
  .fx-n { font-size: 12px; font-weight: 600; }
  .pd { position: absolute; top: 3px; width: 6px; height: 8px; margin-left: -3px; border-radius: 2px; background: ${ton('floral', 'base')}; opacity: .75; }
  .tr-h { height: 30px; }
  .hs { position: absolute; top: 4px; height: 8px; }
  .hs0 { background: #ececf1; border-radius: 2px 0 0 2px; } .hs1 { background: #dcdce3; } .hs2 { background: #c4c4cc; } .hs3 { background: #a7a7b2; } .hs4 { background: #8a8a96; } .hs5 { background: #5b5b66; border-radius: 0 2px 2px 0; }
  .hs-l { position: absolute; top: 14px; transform: translateX(-50%); font-size: 12px; font-family: var(--mono); color: var(--gris); white-space: nowrap; }
  .hc { position: absolute; top: 0; width: 2px; height: 16px; margin-left: -1px; border-radius: 2px; background: var(--encre); }
  .hp { position: absolute; top: 5px; width: 6px; height: 6px; margin-left: -3px; border-radius: 50%; box-shadow: 0 0 0 1.5px #fff; }
  .br.hsi { grid-template-rows: auto 30px; }
  .lg-pv { width: 24px; height: 8px; border-radius: 2px; background: #f3e8f7; box-shadow: inset 0 0 0 1.5px #bf86d6; display: inline-block; }
  .lg-ch { width: 4px; height: 16px; border-radius: 2px; background: #9840bc; display: inline-block; }
  .lg-lt { width: 2px; height: 12px; border-radius: 2px; background: #9a9aa6; display: inline-block; }
  .lg-zn { width: 30px; height: 10px; border-radius: 2px; background: #e4e4ea; display: inline-block; }
  .lg-tk { width: 2px; height: 16px; border-radius: 2px; background: #16161a; display: inline-block; }
  .lg-pd { width: 6px; height: 8px; border-radius: 2px; background: #bf86d6; display: inline-block; }
  .lg-hs { width: 30px; height: 8px; border-radius: 2px; background: linear-gradient(90deg, #ececf1, #5b5b66); display: inline-block; }
  .pq { font-size: 12px; }
  .st-a { position: absolute; top: 2px; width: 10px; height: 10px; margin-left: -5px; border-radius: 50%; background: #fff; box-shadow: inset 0 0 0 2px var(--encre); }
  .lg-g .pi { width: 14px; height: 14px; }
`;
const script = `
  function montrer(id) {
    document.querySelectorAll('.etat').forEach((e) => { e.hidden = e.dataset.lot !== id; });
    document.querySelectorAll('.lc').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.v === id)));
    document.querySelectorAll('.hc').forEach((e) => e.classList.toggle('on', e.dataset.lot === id));
  }
  document.querySelectorAll('.lc').forEach((b) => b.addEventListener('click', () => montrer(b.dataset.v)));
  document.querySelectorAll('.bl-t').forEach((t) => t.setAttribute('data-detail', 'lot-' + t.closest('.etat').dataset.lot));
  const q = new URLSearchParams(location.search).get('lot'); montrer(q || '${DEF}');
`;
fs.writeFileSync(path.join(ici, 'etat.html'), page({ titre: 'Le lot d\'abord', css, corps, script, fiches: [HOP.cascade.cle] }));
console.log('écrit d5/etat.html');
