// Lot 21 · x1 · « Le simulateur au style » (tiède : la baseline l5b, enrichie, utilisable demain).
// Une seule ligne de recette à régler (houblon, ensemble, moment, dose, jours, levure) et la 16D qui répond :
// les 12 barres de l5b au style, avec l'avant en pointillé, la moustache bas–haut du simulé, l'orangé au-delà ;
// « ce que ça change » écrit ; la biotransformation de la levure ; puis les vraies valeurs du réglage : huile
// apportée, rapport au seuil du linalol et du 4MMP en bande log (l'incertitude ×1000 se voit), IBU à chaud face
// aux 50–70 de la 16D, ce qui reste à ce moment, et la mesure publiée en bière (ou le trou).
// Usage : node generateur-x1.mjs  →  x1/etat.html
import path from 'node:path';
import * as S from './socle-x.mjs';
import { tableReelle } from './donnees-reelles.mjs';

const { HB, ORDRE, NOM, COURT, AVANT, picto, ic, hn, alpha, usage, stock, pt, colonne, lentille, legende, LEGENDE_COMMUNE, bandeLog, vrai, page, ecrire } = S;
const DEF = { h: 'citra', h2: null, m: 'dryPost', dose: 4, j: 3, lv: 'us05' };
const G0 = S.grilleCompacte(), a0 = G0[[DEF.h, DEF.m, DEF.dose, DEF.j, DEF.lv].join('|')];
const prof0 = Object.fromEntries(ORDRE.map((f, i) => [f, { bas: a0[4 * i], centre: a0[4 * i + 1], haut: a0[4 * i + 2], hp: !!a0[4 * i + 3] }]));
const T = tableReelle();

const seg = (nom, reglage, opts, actif, cls = '') => `<span class="seg rg ${cls}" role="radiogroup" aria-label="${nom}">${opts.map(([v, t, extra = '']) => `<button role="radio" data-role="reglage" data-reglage="${reglage}" data-v="${v}" aria-checked="${String(v) === String(actif)}" ${extra}>${t}</button>`).join('')}</span>`;
const carteH = (k, i) => `<span class="ch" data-carte="${i}">${pt(k)}${hn(k)}${alpha(k)}${usage(k)}${stock(k, DEF.dose)}</span>`;

const corps = `
  <header class="tete"><h1>Ma stout 16D</h1>${lentille()}${legende(LEGENDE_COMMUNE)}</header>
  ${S.bandeauStub()}
  <section class="recette" data-role="ajout" aria-label="Le réglage">
    <div class="rang">${seg('Houblon', 'houblon', ['citra', 'cascade', 'galaxy', 'idaho7'].map((k) => [k, HB[k].nom, `data-houblon="${HB[k].nom}"`]), DEF.h, 'seg-h')}
      <button class="ens" data-role="reglage" data-reglage="ajout-cumule" aria-pressed="false" aria-label="Ajouter un second houblon dans le même dry hop">${ic('plus', 14)}<span>ensemble</span></button></div>
    <div class="rang r2" hidden>${seg('Second houblon', 'second', ['galaxy', 'idaho7', 'cascade'].map((k) => [k, '+ ' + HB[k].nom, `data-houblon="${HB[k].nom}"`]), 'galaxy', 'seg-h2')}</div>
    <div class="voie" data-voie="1">${carteH(DEF.h, 1)}<span class="ch" data-carte="2" hidden></span></div>
    <div class="rang">${seg('Moment', 'moment', [['b60', '60′'], ['b10', '10′'], ['wp', 'whirlpool'], ['dryActive', 'actif'], ['dryPost', 'après']], DEF.m)}</div>
    <div class="rang">${seg('Dose', 'dose', [[1, '1'], [2, '2'], [4, '4'], [8, '8']], DEF.dose, 'seg-d')}<span class="u">g/L</span>${seg('Jours', 'jours', [[1, '1'], [2, '2'], [3, '3'], [5, '5'], [7, '7']], DEF.j, 'seg-j')}<span class="u">j</span></div>
    <div class="rang">${seg('Levure', 'levure', Object.entries(S.LEV).map(([k, n]) => [k, n.replace(/^(SafAle|LalBrew) /, '').replace(' IPA', '')]), DEF.lv)}<span class="lv-note" data-role="note-levure"></span></div>
  </section>
  <section class="sim" data-role="simulation" aria-label="Le profil simulé">
    <div class="sim-t"><span class="estime">~ simulé</span><span class="sim-q">ma 16D après</span><span class="conf" data-role="confiance"></span></div>
    <div class="cols" data-role="barres">${ORDRE.map((f) => colonne(f, prof0[f])).join('')}</div>
    <p class="change" data-role="change"></p>
  </section>
  <section class="bio" data-role="biotransformation" aria-label="Biotransformation"></section>
  <section class="vrai" aria-label="Les vraies valeurs de ce réglage"><div class="vrai-t">vraies valeurs</div><div data-role="vraies"></div></section>
  <section class="drap" data-role="drapeaux" aria-label="Ce qu'on sait, ce qu'on ignore"></section>
  <section class="ech" data-role="echelle" aria-label="Échelle de réglages">
    <div class="ech-t">${ic('balance', 16)}<span>Échelle, 3 j, sans sortir de la 16D</span></div>
    <div class="rang">${seg('Classer par', 'critere', [['floral', 'plus floral'], ['citrus', 'plus agrumes'], ['tropical', 'plus tropical']], 'floral')}</div>
    <div class="ech-l" data-role="echelle-liste"></div>
    <p class="gris" style="font-size:12px">~ simulé : un classement par un critère, pas un conseil. Le choix reste le tien.</p>
  </section>`;

const css = `
  ${S.CSS_STUB}
  .recette { display: flex; flex-direction: column; gap: 6px; }
  .rang { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .rg button { padding: 0 9px; }
  .seg-h button { font-size: 13px; }
  .u { font-size: 12px; color: var(--gris); margin: 0 4px 0 -2px; }
  .ens { height: 30px; display: inline-flex; align-items: center; gap: 3px; padding: 0 9px 0 6px; border-radius: 15px; box-shadow: inset 0 0 0 1.5px var(--encre); font-size: 12px; font-weight: 600; }
  .ens[aria-pressed="true"] { background: var(--encre); color: #fff; }
  .voie { display: flex; flex-direction: column; gap: 2px; padding: 4px 0; border-top: 1px solid var(--trait); border-bottom: 1px solid var(--trait); }
  .ch { display: flex; align-items: center; gap: 6px; min-height: 22px; flex-wrap: wrap; }
  .sim { display: flex; flex-direction: column; gap: 6px; }
  .sim-t { display: flex; align-items: baseline; gap: 8px; }
  .sim-q { font-size: 14px; font-weight: 600; }
  .conf { margin-left: auto; font-size: 12px; color: var(--gris); }
  .conf b { color: var(--encre); font-weight: 600; }
  .cols { padding: 16px 2px 0; }
  .lv-note { font-size: 12px; color: var(--gris); }
  .change { font-size: 14px; line-height: 1.35; min-height: 19px; }
  .change .dl { white-space: nowrap; display: inline-flex; align-items: center; gap: 3px; margin-right: 8px; }
  .change .dl b { font-family: var(--mono); font-size: 12px; }
  .change .dl.x b { color: var(--acc); }
  .bio { display: flex; align-items: center; gap: 8px; min-height: 30px; padding: 4px 8px; border-radius: 8px; background: var(--doux); font-size: 12px; }
  .bio .fl { display: inline-flex; align-items: center; gap: 2px; flex: none; }
  .bio b { font-weight: 600; }
  .vrai { display: flex; flex-direction: column; gap: 4px; border-top: 1px solid var(--trait); padding-top: 6px; }
  .vrai-t { font-size: 12px; font-weight: 600; color: var(--gris); }
  .vr { display: grid; grid-template-columns: 22px 1fr; align-items: center; column-gap: 6px; min-height: 26px; font-size: 13px; }
  .vr .pis { display: inline-flex; gap: 1px; }
  .vr-l { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .vr-t { color: var(--encre); }
  .vr-s { font-size: 12px; color: var(--gris); }
  .vr.log { grid-template-columns: 22px 52px 184px 1fr; min-height: 34px; }
  .vr.log .vv { justify-self: end; }
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
  .axe { display: grid; grid-template-columns: 22px 52px 184px 1fr; column-gap: 6px; height: 14px; }
  .axe span { position: relative; grid-column: 3; }
  .axe i { position: absolute; transform: translateX(-50%); font: 400 12px/1 var(--sans); color: var(--gris); font-style: normal; white-space: nowrap; }
  .vv.txt { font: 400 13px var(--sans); white-space: normal; }
  .seg.off { opacity: .45; }
  .seg button:disabled { cursor: default; text-decoration: line-through; }
  .ech { display: flex; flex-direction: column; gap: 4px; border-top: 1px solid var(--trait); padding-top: 6px; }
  .ech-t { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; flex-wrap: wrap; }
  .ech-l { display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: 2px 10px; }
  .ech-r { display: contents; }
  .ech-r button { grid-column: 1 / -1; display: grid; grid-template-columns: 1fr 86px 64px; align-items: center; gap: 8px; min-height: 34px; padding: 0 8px; border-radius: 8px; background: var(--doux); text-align: left; font-size: 13px; }
  .ech-r button[aria-current="true"] { box-shadow: inset 0 0 0 2px var(--encre); background: #fff; }
  .ech-n { display: inline-flex; align-items: center; gap: 5px; }
  .ech-g { display: inline-flex; align-items: center; gap: 3px; font: 600 12px var(--mono); }
  .ech-h { font-size: 12px; color: var(--gris); text-align: right; }
  .ech-h.x { color: var(--acc); font-weight: 600; }
  .trou { color: var(--gris); }
  .drap { display: flex; flex-wrap: wrap; gap: 4px; }
  .dp { display: inline-flex; align-items: center; gap: 4px; height: 24px; padding: 0 8px; border-radius: 12px; background: var(--doux); font-size: 12px; color: var(--encre); }
  .dp .ic { color: var(--gris); }
  .dp.inc { background: none; box-shadow: inset 0 0 0 1px var(--trait2); }`;

const js = `
${S.JS_SIM}
const R = window.DONNEES.reel, HBJ = window.DONNEES.houblons, NOMS = ${JSON.stringify(NOM)}, COURTS = ${JSON.stringify(COURT)}, LV = window.DONNEES.levures;
const ST = ${JSON.stringify(DEF)};
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const fr = (x) => String(Math.round(x * 100) / 100).replace('.', ',');
const fx = (x, sens) => { if (x == null) return '?'; const e = Math.floor(Math.log10(Math.abs(x))) - 1, p = 10 ** e, q = x / p; const r = sens === 'bas' ? Math.floor(q + 1e-9) : sens === 'haut' ? Math.ceil(q - 1e-9) : Math.round(q); return fr(Number((r * p).toPrecision(6))); };
const picto = (f, z = 14) => '<svg class="pi" width="' + z + '" height="' + z + '" data-famille="' + f + '" role="img" aria-label="' + NOMS[f] + '"><use href="#p-' + f + '"/></svg>';
const ic = (k, z = 14) => '<svg class="ic" width="' + z + '" height="' + z + '" aria-hidden="true"><use href="#i-' + k + '-' + z + '"/></svg>';
const vrai = (t, src, mot, o = {}) => '<span class="vv" data-nature="mesure" data-source="' + esc(src) + '">' + t + (mot ? '<span class="mot-c mot-' + mot + '">' + mot + '</span>' : '') + (o.verifier ? '<span class="mot-c mot-verif">à vérifier</span>' : '') + (o.figure ? '<span class="mot-c">lu sur figure</span>' : '') + '</span>';
const inc = (t) => '<span class="inc" data-inconnu><i class="hach"></i>' + t + '</span>';
const LO = ${S.LOGR.lo}, HI = ${S.LOGR.hi};
function bande(r, W, f) {
  const x = (v) => Math.max(0, Math.min(W, (Math.log10(v) - LO) / (HI - LO) * W));
  if (!r || r.inconnu) return '<span class="blog inc-b" style="width:' + W + 'px" data-role="incertitude"><i class="blog-h"></i></span>';
  const a = r.min == null ? 0 : x(r.min), b = r.max == null ? W : x(r.max);
  return '<span class="blog" style="width:' + W + 'px;--c:var(--b)" data-famille="' + f + '" role="img" aria-label="de ×' + fx(r.min, 'bas') + ' à ' + (r.max == null ? 'borne haute inconnue' : '×' + fx(r.max, 'haut')) + '"><i class="blog-r"></i><i class="blog-s" style="left:' + x(1) + 'px"></i><i class="blog-d" style="left:' + x(10) + 'px"></i>'
    + '<i class="blog-band' + (r.max == null ? ' ouv' : '') + '" data-role="incertitude" style="left:' + a + 'px;width:' + Math.max(4, b - a) + 'px"></i>' + (r.central != null ? '<i class="blog-c" style="left:' + (x(r.central) - 1) + 'px"></i>' : '')
    + '<span class="blog-b" style="left:' + a + 'px">×' + fx(r.min, 'bas') + '</span><span class="blog-b d" style="left:' + b + 'px">' + (r.max == null ? '?' : '×' + fx(r.max, 'haut')) + '</span></span>';
}
const rtxt = (r) => (!r || r.inconnu ? 'inconnu' : r.max == null ? '≥ ×' + fx(r.min, 'bas') : '×' + fx(r.min, 'bas') + '–' + fx(r.max, 'haut'));
const SEC = (m) => m === 'dryActive' || m === 'dryPost';
const cumulOk = () => ST.h2 && SEC(ST.m);
function profilCourant() {
  if (cumulOk()) { const pair = ST.h === 'citra' ? 'citra+' + ST.h2 : 'citra+' + ST.h; return SIMX.profil(pair, ST.m, ST.dose, ST.j, ST.lv); }
  return SIMX.profil(ST.h, ST.m, ST.dose, ST.j, ST.lv);
}
function carte(k, i) {
  const el = document.querySelector('[data-carte="' + i + '"]'); if (!k) { el.hidden = true; el.innerHTML = ''; return; }
  el.hidden = false; el.innerHTML = window.DONNEES.cartes[k];
}
function rendre() {
  // les réglages
  document.querySelectorAll('[data-reglage]').forEach((b) => { const r = b.dataset.reglage, v = b.dataset.v; if (r === 'ajout-cumule') { b.setAttribute('aria-pressed', String(!!ST.h2)); return; }
    const cur = { houblon: ST.h, second: ST.h2, moment: ST.m, dose: ST.dose, jours: ST.j, levure: ST.lv }[r]; b.setAttribute('aria-checked', String(String(cur) === v)); });
  document.querySelector('.r2').hidden = !ST.h2;
  document.querySelectorAll('[data-reglage="jours"]').forEach((b) => { b.disabled = !SEC(ST.m); });
  document.querySelector('.seg-j').classList.toggle('off', !SEC(ST.m));
  document.querySelectorAll('[data-reglage="second"]').forEach((b) => { const ok = ST.h === 'citra' ? b.dataset.v !== 'citra' : true; b.hidden = !ok; });
  carte(ST.h, 1); carte(ST.h2, 2);
  const lvOff = ['verdant', 'diamond'].filter((k) => !existe(appliquer(ST, 'levure', k)));
  document.querySelector('[data-role="note-levure"]').textContent = ST.auto ? 'la levure agit en fermentation : dry hop actif' : lvOff.length ? lvOff.map((k) => LV[k].replace(/^(SafAle|LalBrew) /, '').replace(' IPA', '')).join(', ') + ' : non simulé ici' : '';
  ST.auto = false;
  // le profil simulé
  const p = profilCourant(); if (!p) return;
  document.querySelectorAll('[data-col]').forEach((c) => SIMX.poser(c, c.dataset.col, p[c.dataset.col]));
  const d = SIMX.O.map((f) => ({ f, d: Math.round((p[f].centre - SIMX.AV[f].centre) / SIMX.Z[f].cran), hors: SIMX.AV[f].centre <= SIMX.Z[f].bande[1] && p[f].centre > SIMX.Z[f].bande[1], deja: SIMX.AV[f].centre > SIMX.Z[f].bande[1] })).filter((x) => x.d >= 1).sort((a, b) => b.d - a.d || b.hors - a.hors);
  const hors = d.filter((x) => x.hors);
  document.querySelector('[data-role="change"]').innerHTML = d.length ? '<span class="estime">~</span> ' + d.slice(0, 4).map((x) => '<span class="dl' + (x.hors ? ' x' : '') + '" data-nature="simule">' + picto(x.f, 14) + COURTS[x.f] + ' <b>+' + x.d + '</b> cran' + (x.d > 1 ? 's' : '') + '</span>').join('') + (hors.length ? '<span class="xs">' + (hors.length > 1 ? hors.length + ' familles hors' : '1 famille hors') + ' du style</span>' : '<span class="dl">dans la 16D</span>') + (SIMX.O.some((f) => SIMX.AV[f].centre > SIMX.Z[f].bande[1]) ? '<span class="dl gris">' + SIMX.O.filter((f) => SIMX.AV[f].centre > SIMX.Z[f].bande[1]).map((f) => COURTS[f]).join(', ') + ' : déjà au-delà, ta dégustation</span>' : '')
    : '<span class="dl" data-nature="simule">~ presque rien ne bouge</span>';
  const faible = ['galaxy', 'idaho7'].includes(ST.h) || ST.h2 || !SEC(ST.m);
  document.querySelector('[data-role="confiance"]').innerHTML = 'confiance <b>' + (faible ? 'faible' : 'moyenne') + '</b>';
  // la biotransformation
  const actif = ST.m === 'dryActive', bio = document.querySelector('[data-role="biotransformation"]');
  const B = { pomona: [picto('floral') + ic('fleche', 12) + picto('citrus'), '<b>Pomona</b> : géraniol → citronellol, « medium »', 'Escarpment Labs [51]'], verdant: [picto('tropical') + picto('berries'), '<b>Verdant</b> : thiols libérés, ampleur inconnue', 'Lallemand [49]'],
    diamond: [picto('tropical'), '<b>Diamond</b> : plus de thiols mesurés, fruité perçu le plus faible', 'Lallemand [15]'], us05: [ic('aide2', 14), '<b>US-05</b> : β-lyase non publiée', 'fiche US-05 [50]'] };
  const b = B[ST.lv];
  bio.innerHTML = actif || !SEC(ST.m) ? '<span class="fl">' + b[0] + '</span><span>' + b[1] + (ST.lv === 'us05' ? ' : ' + inc('inconnu') : '') + ' · <span data-nature="mesure" data-source="Christiaens 2025 [42]">thiols libérés 0,01–0,35 % <span class="mot-c">sur précurseur synthétique, publié</span></span></span>'
    : '<span class="fl">' + ic('levure', 14) + '</span><span>Après fermentation : la levure ne transforme presque plus rien. <span class="gris">Passe en « actif » pour la voir.</span></span>';
  // les vraies valeurs
  const hs = [ST.h].concat(cumulOk() ? [ST.h2] : []);
  const dose = ST.dose;
  let v = '';
  const huile = hs.map((k) => HBJ[k].huile).reduce((t, x) => [t[0] + x[0] * dose, t[1] + x[1] * dose], [0, 0]);
  v += '<div class="vr">' + ic('fiole', 16) + '<span class="vr-l"><span class="vr-t">huile apportée</span>' + vrai(fr(huile[0]) + '–' + fr(huile[1]) + ' mL/hL', hs.map((k) => HBJ[k].huileSrc).join(' ; ') + ' ; huile × dose (H §7.4)', 'calcul') + '<span class="vr-s">' + dose + ' g/L' + (hs.length > 1 ? ' chacun' : '') + '</span></span></div>';
  const M = R.moteur[ST.h + '|' + ST.m];
  const xa = (x) => (Math.log10(x) - LO) / (HI - LO) * 176;
  v += '<div class="axe" aria-hidden="true"><span><i style="left:' + xa(1) + 'px">seuil</i><i style="left:' + (xa(10) + 10) + 'px">×10</i><i style="left:' + xa(1000) + 'px">×1000</i></span></div>';
  for (const [r, nom, fs] of [[M.lin, 'linalol', ['floral', 'citrus']], [M.mmp, '4MMP', ['tropical', 'berries']]]) {
    v += '<div class="vr log"><span class="pis">' + picto(fs[0], 11) + picto(fs[1], 11) + '</span><span class="vr-t">' + nom + (cumulOk() ? '<span class="vr-s"> ' + HBJ[ST.h].nom + '</span>' : '') + '</span><span class="vr-b" data-famille="' + fs[0] + '">' + bande(r && !r.inconnu ? r : null, 176, fs[0]) + '</span>'
      + (r && !r.inconnu ? vrai('<span class="sr">' + rtxt(r) + '</span>', r.src, 'calcul') : inc('inconnu')) + '</div>';
  }
  if (!SEC(ST.m)) { const ib = R.ibu[ST.h + '|' + ST.m + '|' + ST.dose]; if (ib) v += '<div class="vr">' + ic('goutte', 16) + '<span class="vr-l"><span class="vr-t">amertume</span>' + vrai(Math.round(R.style.ibuBiere) + ' → ' + Math.round(R.style.ibuBiere + ib.v) + ' IBU', R.style.ibuSrc + ' ; ' + ib.src, 'calcul') + '<span class="vr-s">+' + ib.min + ' à +' + ib.max + ' ; la 16D : ' + R.style.ibu.join('–') + '</span>' + (R.style.ibuBiere + ib.v > R.style.ibu[1] ? '<span class="xs">trop amer</span>' : '') + '</span></div>'; }
  if (M.perte && M.perte.texte) v += '<div class="vr">' + ic(SEC(ST.m) ? 'cuveP' : 'flamme', 16) + '<span class="vr-l"><span class="vr-t">ce qui reste</span>' + vrai(({ linalol: picto('floral', 12), '4MMP': picto('tropical', 12), myrcène: picto('resin', 12) }[(M.perte.texte.match(/linalol|4MMP|myrcène/) || [])[0]] || '') + esc(M.perte.texte), M.perte.source, /publié/.test(M.perte.texte) ? '' : 'publié').replace('class="vv"', 'class="vv txt"') + '</span></div>';
  for (const k of hs) for (const x of R.biere[k]) v += '<div class="vr">' + (x.famille ? picto(x.famille, 16) : ic('biere', 16)) + '<span class="vr-l"><span class="vr-t">' + HBJ[k].nom + ' en bière</span>' + (x.trou ? '<span class="trou">' + inc('aucune mesure') + '</span><span class="vr-s">' + esc(x.detail) + '</span>' : vrai((x.compose && x.famille ? picto(x.famille, 12) : '') + esc(x.txt), x.src, x.mot, x).replace('class="vv"', 'class="vv txt"') + '<span class="vr-s">' + esc(x.detail) + '</span>') + '</span></div>';
  document.querySelector('[data-role="vraies"]').innerHTML = v;
  // les drapeaux
  let dp = '';
  if (SEC(ST.m)) { const tot = dose * hs.length; dp += '<span class="dp">' + ic('balance', 14) + 'dose totale ' + tot + ' g/L' + (tot >= 4 ? ' : saturation' : '') + '</span>'; if (ST.j > 3) dp += '<span class="dp">' + ic('sablier', 14) + 'au-delà de 3 j : rien de plus mesuré</span>'; dp += '<span class="dp">' + ic('bulles', 14) + 'hop creep si levure vivante</span>'; }
  else dp += '<span class="dp">' + ic('flamme', 14) + 'à chaud : l’arôme s’évapore, l’amertume reste</span>';
  if (cumulOk()) dp += '<span class="dp inc">' + ic('melange', 14) + 'synergie, masquage : inconnus</span>';
  dp += '<span class="dp inc">' + ic('biere', 14) + 'en bière noire : non documenté</span>';
  document.querySelector('[data-role="drapeaux"]').innerHTML = dp;
}
// L'échelle : les réglages d'un seul houblon (3 j, levure choisie) classés par le gain simulé sur une famille,
// parmi ceux qui ne sortent d'aucune famille de la 16D (hors celles déjà au-delà avant l'ajout). Un critère, pas un verdict.
let CRIT = 'floral';
function echelle() {
  const lignes = [];
  for (const h of ['citra', 'cascade', 'galaxy', 'idaho7']) for (const m of ['b10', 'wp', 'dryActive', 'dryPost']) for (const dose of [1, 2, 4, 8]) {
    const p = SIMX.profil(h, m, dose, 3, ST.lv); if (!p) continue;
    const ib = R.ibu[h + '|' + m + '|' + dose];
    const hors = SIMX.O.filter((f) => SIMX.AV[f].centre <= SIMX.Z[f].bande[1] && p[f].centre > SIMX.Z[f].bande[1]).length + (ib && R.style.ibuBiere + ib.v > R.style.ibu[1] ? 1 : 0);
    if (hors) continue;
    lignes.push({ h, m, dose, g: (p[CRIT].centre - SIMX.AV[CRIT].centre) / SIMX.Z[CRIT].cran });
  }
  lignes.sort((a, b) => b.g - a.g || a.dose - b.dose);
  const MO = { b10: '10′', wp: 'whirlpool', dryActive: 'dry hop actif', dryPost: 'dry hop après' };
  document.querySelector('[data-role="echelle-liste"]').innerHTML = lignes.slice(0, 5).map((x) => '<span class="ech-r"><button data-role="echelle-ligne" data-h="' + x.h + '" data-m="' + x.m + '" data-dose="' + x.dose + '" aria-current="' + (x.h === ST.h && x.m === ST.m && x.dose === ST.dose && ST.j === 3 && !ST.h2) + '">'
    + '<span class="ech-n">' + window.DONNEES.points[x.h] + '<b>' + HBJ[x.h].nom + '</b> ' + MO[x.m] + ' · ' + x.dose + ' g/L</span><span class="ech-g" data-nature="simule">~ +' + fr(Math.round(x.g * 10) / 10) + ' cran</span><span class="ech-h">0 famille hors</span></button></span>').join('')
    || '<span class="gris">aucun réglage ne reste dans la 16D</span>';
  document.querySelectorAll('[data-role="echelle-ligne"]').forEach((b) => b.addEventListener('click', () => { ST.h = b.dataset.h; ST.m = b.dataset.m; ST.dose = Number(b.dataset.dose); ST.j = 3; ST.h2 = null; rendre(); }));
  document.querySelectorAll('[data-reglage="critere"]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.v === CRIT)));
}
function appliquer(s0, r, v) {
  const s = { ...s0 };
  if (r === 'houblon') { s.h = v; if (s.h2 && (s.h2 === v || (v !== 'citra' && s.h2 !== 'citra'))) s.h2 = v === 'citra' ? 'galaxy' : 'citra'; }
  if (r === 'second') s.h2 = v;
  if (r === 'ajout-cumule') { s.h2 = s.h2 ? null : (s.h === 'citra' ? 'galaxy' : 'citra'); if (s.h2 && !SEC(s.m)) s.m = 'dryPost'; }
  if (r === 'moment') { s.m = v; if (!SEC(v)) s.h2 = null; }
  if (r === 'dose') s.dose = Number(v);
  if (r === 'jours') s.j = Number(v);
  if (r === 'levure') { s.lv = v; if (s.m === 'dryPost' && v !== s0.lv) { s.m = 'dryActive'; s.auto = true; } }
  // Un ajout cumulé n'existe dans la grille qu'à certaines doses et durées : on s'y range.
  if (s.h2) { const pair = s.h === 'citra' ? 'citra+' + s.h2 : 'citra+' + s.h; if (!SIMX.profil(pair, s.m, s.dose, s.j, s.lv)) { const d = [s.dose, 2, 1, 4].find((x) => SIMX.profil(pair, s.m, x, s.j, s.lv)) ?? s.dose; s.dose = d; if (!SIMX.profil(pair, s.m, s.dose, s.j, s.lv)) s.j = 3; } }
  return s;
}
const existe = (s) => { if (s.h2 && SEC(s.m)) { const pair = s.h === 'citra' ? 'citra+' + s.h2 : 'citra+' + s.h; return !!SIMX.profil(pair, s.m, s.dose, s.j, s.lv); } return !!SIMX.profil(s.h, s.m, s.dose, s.j, s.lv); };
document.querySelectorAll('[data-reglage]').forEach((b) => b.addEventListener('click', () => {
  if (b.dataset.reglage === 'critere') { CRIT = b.dataset.v; echelle(); return; }
  Object.assign(ST, appliquer(ST, b.dataset.reglage, b.dataset.v));
  rendre();
}));
const rendre0 = rendre;
rendre = function () { rendre0(); document.querySelectorAll('[data-reglage]').forEach((b) => { const r = b.dataset.reglage; if (r === 'critere' || r === 'ajout-cumule' || (r === 'jours' && !SEC(ST.m))) return; b.disabled = !existe(appliquer(ST, r, b.dataset.v)); }); echelle(); };
const q = new URLSearchParams(location.search);
for (const [k, c] of [['h', 'h'], ['h2', 'h2'], ['m', 'm'], ['lv', 'lv']]) if (q.get(k)) ST[c] = q.get(k);
for (const k of ['dose', 'j']) if (q.get(k)) ST[k] = Number(q.get(k));
rendre();`;

const cartes = Object.fromEntries(['citra', 'cascade', 'galaxy', 'idaho7'].map((k) => [k, `${pt(k)}${hn(k)}${alpha(k)}${usage(k)}${stock(k, DEF.dose)}`]));
const donnees = { grille: G0, reel: T, houblons: Object.fromEntries(Object.entries(HB).map(([k, h]) => [k, { nom: h.nom, huile: h.huile, huileSrc: h.huileSrc }])), levures: S.LEV, cartes, points: Object.fromEntries(['citra', 'cascade', 'galaxy', 'idaho7'].map((k) => [k, pt(k)])) };
ecrire(path.join(S.ICI, 'etat.html'), page({ titre: 'x1 · Le simulateur au style', commentaire: 'Lot 21 · x1, tiède : la baseline l5b enrichie (avant en pointillé, moustache bas–haut, écart écrit), une recette réglable, les vraies valeurs du réglage. Profil simulé : ' + (S.STUB ? 'STUB de l’auteur' : 'moteur profil-simule'), css, corps, js, donnees }));
