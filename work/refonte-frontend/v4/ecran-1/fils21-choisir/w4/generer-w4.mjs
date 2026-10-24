// Lot 21 · w4 · « Tes questions, répondues » (la réponse d'abord, question par question).
// Les vraies questions du brasseur, mot pour mot, chacune avec sa réponse en une ligne visible sans toucher
// (« À 60′, l'arôme part : il reste l'amertume ») ; un toucher ouvre son petit simulateur (le moment qui glisse,
// la dose, les jours, la paire, la levure) et la preuve : une étude, une mesure, ce qu'on ne sait pas.
// Usage : node generer-w4.mjs  →  w4/etat.html
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as S from '../w1/socle-w.mjs';

const { D, ORDRE, HOP, BANDE, CRAN, JET, fr, esc, ic, pic, alpha, usage, nomH, conf, V, bandeLog, seg, curseur, feuille, preuve, page, ecrire, MOMENT, MOTS_F, COURT, inconnu, STUB_MOT, compacter, JS_DEPLIER, profilLignes, deltaU } = S;
const ICI = path.dirname(fileURLToPath(import.meta.url));
const AV = D.AVANT;
const MOMS = ['b60', 'b10', 'wp', 'dryActive', 'dryPost'];
const DOSES = D.VALEURS.doses;
const cr = (p, f) => (p[f].inconnu ? null : Math.round((p[f].crans - AV[f].crans) * 10) / 10);

// ---------- les données de chaque question ----------
// Q1 : Citra et Cascade, moment par moment, à chaque dose (US-05, 3 j en dry hop).
const Q1 = {};
for (const h of ['Citra', 'Cascade']) for (const d of DOSES) for (const m of MOMS) { const g = D.point(h, m, d, m.startsWith('dry') ? 3 : null, 'US-05'); Q1[h + '|' + d + '|' + m] = compacter(g.profil); }
const IBU = Object.fromEntries(['Citra', 'Cascade'].map((h) => [h, Object.fromEntries(['b60', 'b10', 'wp'].map((m) => { const c = D.cas('K1-' + h.toLowerCase() + '-' + m); const x = c.mesures.find((y) => y.type === 'ibu'); return [m, x ? { v: x.valeur, min: x.plage.min, max: x.plage.max } : null]; }))]));
// Q2 : à dose égale, dry hop après, 3 j.
const Q2 = {};
for (const h of ['Citra', 'Cascade', 'Galaxy', 'Idaho 7']) for (const d of DOSES) Q2[h + '|' + d] = compacter(D.point(h, 'dryPost', d, 3, 'US-05').profil);
// Q3 : les deux ajouts successifs, jour par jour.
const Q3 = Object.fromEntries(['K3-citra3-galaxy7', 'K3-citra3-idaho7-5'].map((id) => { const c = D.cas(id); return [id, { titre: c.titre, ajouts: c.ajouts.map((a) => ({ h: a.nom, j0: a.jourDebut, j: a.jours, d: a.dose_gL })), jours: c.parJour.map((j) => ({ j: j.jour, jr: j.jourRecette, p: compacter(j.profil) })), c: c.confiance.niveau }]; }));
// Q4 : ensemble, contre chacun seul.
const Q4 = {};
for (const h of ['Galaxy', 'Idaho 7', 'Cascade']) { const p = D.paire('Citra', h, 'dryPost', 'US-05'); Q4[h] = { p: compacter(p.profil), seuls: Object.fromEntries(p.noms.map((n) => [n, ORDRE.map((f) => p.seuls[n][f])])), ap: Object.fromEntries(p.noms.map((n) => [n, ORDRE.map((f) => p.apports[n][f])])), fs: ORDRE.map((f) => p.facteur[f]) }; }
// Q5 : la levure (K4 : Citra 2 g/L 3 j puis Idaho 7 2 g/L 5 j).
const Q5 = {};
for (const l of ['us05', 'verdant', 'pomona', 'diamond']) for (const m of ['actif', 'apres']) { const c = D.cas('K4-' + l + '-' + m); Q5[l + '|' + m] = { p: compacter(c.apres), c: c.confiance.niveau }; }

// Les réponses en une ligne, calculées sur les données (rien d'écrit à la main pour les chiffres).
const c60 = cr(D.point('Citra', 'b60', 4, null).profil, 'citrus'), c10 = cr(D.point('Citra', 'b10', 4, null).profil, 'citrus');
const k2c = D.point('Citra', 'dryPost', 4, 3).profil, k2k = D.point('Cascade', 'dryPost', 4, 3).profil;
const k3 = Q3['K3-citra3-galaxy7'];
const pe = D.paire('Citra', 'Galaxy', 'dryPost', 'US-05');
const p5a = D.cas('K4-pomona-actif').apres, p5u = D.cas('K4-us05-actif').apres;
// Le mot d'une famille, dans son ton, avec son picto : la couleur porte un mot.
const FM = (f) => `<span class="w4-f" style="color:${JET[f].texte}">${pic(f, 14)}${MOTS_F[f]}</span>`;
const QUESTIONS = [
  { id: 'q1', q: 'Pourquoi à 10′ pas à 60′ ?', r: `À 60′, l’arôme part : ${FM('citrus')} <b data-nature="simule">~ ${deltaU(c60)}</b>, contre <b data-nature="simule">~ ${deltaU(c10)}</b> à 10′. Reste l’amertume : ${V('≈ ' + fr(IBU.Citra.b60.v, 0) + ' IBU', 'moteur IBU · α fiches Citra (bm-citra)')}.` },
  { id: 'q2', q: 'Citra et Cascade, pareils en dry hop ?', r: `Non, à dose égale : ${FM('tropical')} <b data-nature="simule">~ ${deltaU(cr(k2c, 'tropical'))}</b> contre <b data-nature="simule">~ ${deltaU(cr(k2k, 'tropical'))}</b>. ${pic('tropical', 14)}4MMP ${V(D.MMP4.Citra.txt, 'H11')} contre ${V(D.MMP4.Cascade.txt + ' µg/kg', 'H11')}.` },
  { id: 'q3', q: '3 j de Citra puis 7 j de Galaxy ?', r: `7 j ne font pas plus que 1 j (~ simulé ; mesuré : ${V('rien après 3 j', 'H73 · Wolfe 2012')}). Ordre : ${inconnu('aucune étude', 'inconnu')}.` },
  { id: 'q4', q: 'Deux houblons ensemble, ça s’additionne ?', r: `Pas tout : <b data-nature="simule">~ ${Math.round(pe.facteur.citrus * 100)} %</b> de la somme. À 16 g/L, chaque gramme rend ${V('3 fois moins', 'E04 · Lafontaine 2018 (23 % → 7 % de linalol extrait)')}.` },
  { id: 'q5', q: 'Et la levure, la biotransformation ?', r: `En dry hop actif seulement : Pomona, ${FM('citrus')} <b data-nature="simule">~ ${'+' + fr(p5a.citrus.crans - p5u.citrus.crans, 1)} cran</b> (simulé, petit). Prix : ${V('hop creep +0,39 % vol.', 'H35 · Klimczak 2023')}.` },
];

// ---------- l'écran ----------
const corps = `
  ${S.tete('Tes questions')}
  <p class="w4-int">La réponse d’abord ; un toucher pour la voir bouger. ${conf('simule')} ${conf('mesure')}</p>
  <div data-role="objectif" class="w4-qs">${QUESTIONS.map((x, i) => `<article class="w4-q${i === 0 ? ' ouvert' : ''}" data-q="${x.id}">
    <button type="button" class="w4-qt" aria-expanded="${i === 0}" data-ouvre="${x.id}"><span class="w4-qq">« ${esc(x.q)} »</span>${ic('chevb', 16)}</button>
    <p class="w4-r">${x.r}</p>
    <div class="w4-b" data-role="simulation" ${i === 0 ? '' : 'hidden'} id="b-${x.id}"></div>
  </article>`).join('')}</div>
  <p class="w4-pied">${conf('simule')}<span>${STUB_MOT}</span><span>· ta 16D, Nugget 60′</span>${alpha('Nugget')}</p>`;

// Corps des simulateurs : construits côté page à partir des données embarquées ; les réglages ici.
const RC = { Citra: D.rapports('cas-citra.json'), Cascade: D.rapports('cas-cascade.json') };
const PREUVES = {
  q1: `<ul class="w-pvs">${preuve(D.mesureEtude('E07', (m) => /cooked/.test(m.descripteur || '')), { quoi: 'cuit, végétal, herbacé', qui: 'Simcoe et Hallertau 1,5 g/L', mot: 'panel', note: 'associés à l’ébullition ; le dry hop 48 h donne le fruité (même étude)' })}</ul>
    <p class="w4-n">${pic('tropical', 14)}4MMP : ${V('−91 % en 60′ à 100 °C', 'H13 · Kishimoto 2008')} (mesuré, en eau bouillante).</p>`,
  q2: `${bandeLog({ compose: '4MMP', familles: ['tropical', 'berries'], ...RC.Citra['4MMP (4MSP)'], source: 'moteur pouvoir (fils19 cas-citra)', qui: 'Citra 4 g/L', couleur: HOP.Citra.couleur })}
    ${bandeLog({ compose: '4MMP', familles: ['tropical', 'berries'], ...RC.Cascade['4MMP (4MSP)'], source: 'moteur pouvoir (fils19 cas-cascade)', qui: 'Cascade 4 g/L', couleur: HOP.Cascade.couleur })}
    ${bandeLog({ compose: 'linalol', familles: ['floral', 'citrus'], ...RC.Citra.linalol, source: 'moteur pouvoir (fils19 cas-citra)', qui: 'Citra 4 g/L', couleur: HOP.Citra.couleur })}
    ${bandeLog({ compose: 'linalol', familles: ['floral', 'citrus'], ...RC.Cascade.linalol, source: 'moteur pouvoir (fils19 cas-cascade)', qui: 'Cascade 4 g/L', couleur: HOP.Cascade.couleur })}
    <ul class="w-pvs">${preuve(D.mesureEtude('E06', (m) => m.variete === 'Citra' && m.compose === 'linalol'), { note: 'dry hop, dose non indiquée' })}<li class="w-pv" data-nature="mesure" data-source="H12 · Kishimoto 2008">${pic('floral', 14)}<span class="w-pv-q">linalol · Cascade 2 g/L</span><b class="mono">56,9 µg/L</b><span class="w-pv-s">${conf('mesure')}<span class="w-ref">Kishimoto 2008 · publié</span></span></li></ul>
    <p class="w-trou">${inconnu('aucune étude lue ne compare Citra et Cascade en bière à dose égale', 'trou')}<span>aucune étude lue ne compare Citra et Cascade en bière à dose égale : les deux mesures ci-dessus n’ont pas la même dose.</span></p>`,
  q3: `<ul class="w-pvs">${preuve(D.mesureEtude('E10', (m) => /différence d'arôme entre les temps/.test(m.descripteur || '')), { quoi: '1 h contre 96 h', qui: 'Cascade 1,43 g/L', mot: 'panel' })}${preuve(D.mesureEtude('E08', (m) => m.compose === '4-MMP'), { quoi: '4MMP, contact', qui: 'Eureka! 2,5 g/L' })}</ul>
    <p class="w4-n">${ic('timer', 14)}Thèse OSU : ${V('aucun gain d’arôme mesuré au-delà de 3 j', 'H73 · Wolfe 2012')} en statique. Végétal et hop creep au-delà de 3 j : ${inconnu('aucune donnée en fonction du temps', 'pas de chiffre')}.</p>`,
  q4: `<ul class="w-pvs">${preuve(D.mesureEtude('E04', (m) => m.dose_gL === 2 && /linalol, part extraite/.test(m.compose || '')), { quoi: 'part du linalol extraite', qui: 'Cascade 2 g/L', note: '7 % à 16 g/L' })}${[2, 8, 16].map((x) => preuve(D.mesureEtude('E04', (m) => m.dose_gL === x && /OHAI/.test(m.descripteur || '')), { quoi: 'intensité houblonnée, sur 15', qui: 'Cascade ' + x + ' g/L', mot: 'panel' })).join('')}</ul>
    <p class="w-trou">${inconnu('synergie, masquage, ordre', 'inconnu')}<span>synergie, masquage et ordre de deux houblons : aucune étude ; le moteur additionne avant la saturation.</span></p>`,
  q5: `<ul class="w-pvs">${preuve(D.mesureEtude('E01', (m) => /citronellol/.test(m.compose || '')), { quoi: 'β-citronellol', qui: 'Amarillo, Citra, Sorachi', note: 'au-dessus du seuil en dry hop : ce que Pomona fabrique depuis le géraniol' })}</ul>
    <p class="w4-n">${ic('bio', 14)}Pomona : terpènes « medium » ${V('géraniol → citronellol', 'H51 · Escarpment Labs')} ; Verdant : thiols ${V('0,01–0,35 %', 'H42')} libérés sur précurseur de synthèse ; Diamond : plus de thiols mesurés, fruité perçu le plus faible (Samia). US-05 : ${inconnu('non publié', 'non publié')}.</p>
    <p class="w-trou">${inconnu('aucune mesure qui croise variété, levure et dry hop', 'trou')}<span>aucune mesure qui croise variété, levure et dry hop.</span></p>`,
};
const tpl = Object.entries(PREUVES).map(([k, v]) => `<template data-preuve="${k}">${v}</template>`).join('');

const css = `
  .w4-int { font-size: 14px; color: var(--gris); display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .w4-qs { display: flex; flex-direction: column; gap: 10px; }
  .w4-q { display: flex; flex-direction: column; gap: 4px; padding: 8px 12px 10px; border-radius: 8px; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,.13); }
  .w4-q.ouvert { box-shadow: inset 0 0 0 2px var(--encre); }
  .w4-qt { display: flex; align-items: center; justify-content: space-between; gap: 8px; text-align: left; min-height: 32px; }
  .w4-qq { font-size: 16px; font-weight: 700; }
  .w4-q.ouvert .w4-qt .ic { transform: rotate(180deg); }
  .w4-r { font-size: 14px; line-height: 1.4; }
  .w4-r b { font: 700 14px var(--sans); white-space: nowrap; }
  .w4-f { display: inline-flex; align-items: center; gap: 2px; font-weight: 700; } .w4-r .pi { display: inline-block; vertical-align: -2px; }
  .w4-r .w-v { font: 700 14px var(--sans); letter-spacing: 0; white-space: normal; }
  .w4-n .w-v { font-family: var(--sans); letter-spacing: 0; }
  .w4-b { display: flex; flex-direction: column; gap: 8px; padding-top: 6px; border-top: 1px solid var(--trait); margin-top: 4px; }
  .w4-regl { display: grid; grid-template-columns: 54px 1fr; gap: 6px; align-items: center; font-size: 12px; color: var(--gris); }
  .w4-regl .w-seg { flex-wrap: wrap; border-radius: 8px; } .w4-regl .w-seg button { border-radius: 8px; min-height: 30px; padding: 0 8px; font-size: 13px; }
  .w4-mo { display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; align-items: end; }
  .w4-mc { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 4px 2px; border-radius: 8px; background: #f6f6f9; }
  .w4-mc[aria-checked="true"] { background: #fff; box-shadow: inset 0 0 0 2px var(--encre); }
  .w4-mz { height: 64px; display: flex; align-items: flex-end; gap: 3px; border-bottom: 1px solid var(--trait2); position: relative; width: 100%; justify-content: center; }
  .w4-mz .zn { position: absolute; left: 0; right: 0; bottom: 0; background: var(--z); border-top: 1.5px solid var(--t); }
  .w4-bar { width: 12px; position: relative; z-index: 1; border-radius: 2px 2px 0 0; transition: height .25s; }
  .w4-ws { position: absolute; left: 50%; width: 1.5px; margin-left: -0.75px; background: repeating-linear-gradient(0deg, rgba(22,22,26,.55) 0 3px, transparent 3px 5px); }
  .w4-bar.k { background: #fff; box-shadow: inset 0 0 0 2px var(--c2); }
  .w4-ml { font-size: 12px; font-weight: 600; } .w4-mv { font: 600 12px var(--mono); }
  .w4-ibu { font: 500 12px var(--mono); color: var(--gris); }
  .w4-lg { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 12px; color: var(--gris); }
  .w4-lg i { width: 10px; height: 10px; border-radius: 2px; display: inline-block; }
  .w4-n { font-size: 13px; display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
  .w4-n .w-v { font-size: 12px; font-weight: 600; white-space: normal; }
  .w4-dd { display: flex; flex-direction: column; gap: 3px; }
  .w4-dr { display: grid; grid-template-columns: 16px 64px 1fr; align-items: center; gap: 6px; height: 24px; }
  .w4-dn { font-size: 12px; font-weight: 600; color: var(--t); }
  .w4-tr { position: relative; height: 20px; width: 220px; }
  .w4-tr::before { content: ''; position: absolute; left: 0; right: 0; top: 9px; height: 2px; background: #ececf1; }
  .w4-tz { position: absolute; left: 0; top: 3px; height: 14px; background: var(--z); border-right: 1.5px solid var(--t); }
  .w4-tm { position: absolute; top: 2px; width: 16px; height: 16px; margin-left: -8px; border-radius: 50%; color: #fff; font: 700 11px/16px var(--sans); text-align: center; transition: left .25s; box-shadow: 0 0 0 1.5px #fff; }
  .w4-tm.hors { box-shadow: 0 0 0 2px var(--acc); }
  .w4-chart { position: relative; height: 120px; margin: 4px 0 18px 28px; border-left: 1px solid var(--trait2); border-bottom: 1px solid var(--trait2); }
  .w4-chart .zn { position: absolute; left: 0; right: 0; bottom: 0; background: rgba(238,155,47,.16); border-top: 1.5px solid #9b5d0d; }
  .w4-chart svg { position: absolute; inset: 0; overflow: visible; }
  .w4-yl { position: absolute; left: -28px; font: 500 12px var(--mono); color: var(--gris); }
  .w4-xl { position: absolute; bottom: -16px; transform: translateX(-50%); font: 500 12px var(--mono); color: var(--gris); }
  .w4-ev { position: absolute; top: -2px; bottom: 0; border-left: 1.5px dashed var(--encre); }
  .w4-ev span { position: absolute; top: -2px; left: 3px; font-size: 12px; font-weight: 600; white-space: nowrap; background: #fff; }
  .w4-jour { position: absolute; top: 0; bottom: 0; width: 2px; background: var(--acc); transition: left .2s; }
  .w4-k { display: flex; flex-direction: column; gap: 4px; font-size: 12px; }
  .w4-kl { display: grid; grid-template-columns: 16px 76px 1fr 62px; align-items: center; gap: 6px; }
  .w4-kb { display: flex; flex-direction: column; gap: 2px; } .w4-kb span { display: flex; height: 8px; } .w4-kb i { display: block; height: 8px; }
  .w4-kv { font: 600 12px var(--mono); text-align: right; }
  .w4-pied { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 12px; color: var(--gris); }
`;

const js = `${JS_DEPLIER}
const Q1 = ${JSON.stringify(Q1)}, IBU = ${JSON.stringify(IBU)}, Q2 = ${JSON.stringify(Q2)}, Q3 = ${JSON.stringify(Q3)}, Q4 = ${JSON.stringify(Q4)}, Q5 = ${JSON.stringify(Q5)};
const AV = SIM.AV, DOSES = ${JSON.stringify(DOSES)};
const MOMENT = ${JSON.stringify(MOMENT)};
const HC = ${JSON.stringify(Object.fromEntries(Object.keys(HOP).map((h) => [h, HOP[h].couleur])))};
const NOMH = ${JSON.stringify(Object.fromEntries(['Citra', 'Cascade', 'Galaxy', 'Idaho 7'].map((h) => [h, '<span class="w-hop">' + S.nomH(h) + S.alpha(h) + '</span>'])))};
const $ = (s) => document.querySelector(s);
const ST = { q1: { d: 4, f: 'citrus', m: 'b10' }, q2: { d: 4, b: 'Cascade' }, q3: { k: 'K3-citra3-galaxy7', j: 10 }, q4: { h: 'Galaxy' }, q5: { l: 'pomona', m: 'actif' } };
const fr1 = (x) => String(Math.round(x * 10) / 10).replace('.', ',');
const dc = (p, f) => (p[f].inconnu ? null : p[f].crans - AV[f].crans);
const reg = (k, lab, items, actif) => '<div class="w4-regl"><span>' + lab + '</span><span class="w-seg" role="radiogroup" data-reglage="' + k + '">' + items.map((x) => '<button type="button" role="radio" data-role="reglage" data-reglage="' + k + '" data-v="' + x.v + '" aria-checked="' + (String(x.v) === String(actif)) + '">' + x.t + '</button>').join('') + '</span></div>';
const preuve = (k) => '<h3 class="w4-h3">' + ICO('labo', 14) + 'La preuve</h3>' + document.querySelector('template[data-preuve="' + k + '"]').innerHTML;
const T = { q1() {
    const s = ST.q1, f = s.f;
    let h = reg('famille', 'famille', ['citrus', 'tropical', 'floral'].map((x) => ({ v: x, t: MOTS_F[x] })), f) + reg('dose', 'dose', DOSES.map((x) => ({ v: x, t: x + ' g/L' })), s.d);
    h += '<div class="w4-lg">' + PIC(f, 14) + '<span>~ crans de ' + MOTS_F[f] + ' gagnés</span><i style="background:' + SIM.Z[f] + '"></i>ta 16D</div><div class="w4-lg"><span>plein :</span>' + NOMH.Citra + '<span>contour :</span>' + NOMH.Cascade + '</div>';
    h += '<div class="w4-mo">' + ['b60', 'b10', 'wp', 'dryActive', 'dryPost'].map((m) => { const a = deplier(Q1['Citra|' + s.d + '|' + m]), b = deplier(Q1['Cascade|' + s.d + '|' + m]);
      const da = dc(a, f), db = dc(b, f), hh = (x) => (x == null ? 0 : Math.max(2, Math.min(5, x + AV[f].crans) * 12)), z = 3 * 12, ibu = IBU.Citra[m];
      return '<button type="button" class="w4-mc" data-role="reglage" data-reglage="moment" data-v="' + m + '" aria-checked="' + (m === s.m) + '"><span class="w4-mz"><i class="zn" data-role="zone" style="height:' + z + 'px;--z:' + SIM.Z[f] + ';--t:' + SIM.T[f] + '"></i><i class="w4-bar" data-nature="simule" style="height:' + hh(da) + 'px;background:' + SIM.CB[f] + '"><i class="w4-ws" style="bottom:' + (Math.min(5, (a[f].bas - SIM.B[f][0]) / SIM.C[f]) * 12 - hh(da)) + 'px;height:' + Math.max(0, Math.min(5.3, (a[f].haut - SIM.B[f][0]) / SIM.C[f]) * 12 - Math.min(5, (a[f].bas - SIM.B[f][0]) / SIM.C[f]) * 12) + 'px"></i></i><i class="w4-bar k" data-nature="simule" style="height:' + hh(db) + 'px;--c2:' + SIM.CB[f] + '"></i></span><span class="w4-ml">' + MOMENT[m].court + '</span><span class="w4-mv" data-nature="simule">' + (da == null ? '?' : '~ ' + (da >= 0 ? '+' : '') + fr1(da)) + '</span>' + (ibu ? '<span class="w4-ibu" data-nature="mesure" data-source="moteur IBU, α fiches">' + Math.round(ibu.v * s.d / 4) + ' IBU</span>' : '<span class="w4-ibu">dry hop</span>') + '</button>'; }).join('') + '</div>';
    h += '<p class="w4-n">' + ICO('info', 14) + 'Les IBU sont ceux de Citra (moteur, α des fiches), à la dose choisie ; l’arôme ~ simulé suit la part des huiles qui reste ; pointillés : la bande de Citra, borne haute non publiée.</p>';
    return h + preuve('q1');
  }, q2() {
    const s = ST.q2;
    let h = reg('dose', 'dose', DOSES.map((x) => ({ v: x, t: x + ' g/L' })), s.d) + reg('autre', 'contre', ['Cascade', 'Galaxy', 'Idaho 7'].map((x) => ({ v: x, t: x })), s.b);
    const a = deplier(Q2['Citra|' + s.d]), b = deplier(Q2[s.b + '|' + s.d]);
    h += '<div class="w4-lg"><span>dry hop après, 3 j, même dose · ~ simulé</span></div><div class="w4-lg">' + NOMH.Citra + ' <span>contre</span> ' + NOMH[s.b] + '</div>';
    const W = 220, px = W / 5;
    h += '<div class="w4-dd">' + ['citrus', 'tropical', 'berries', 'floral', 'stoneFruit', 'green'].map((f) => { const zone = 3 * px;
      const mk = (p, c, t) => { const x = Math.min(5, Math.max(0, p[f].crans)) * px, hors = p[f].centre > SIM.B[f][1]; return '<i class="w4-tm' + (hors ? ' hors' : '') + '" data-nature="simule" style="left:' + x + 'px;background:' + c + '" aria-label="' + t + ' ~ ' + fr1(p[f].crans) + ' crans">' + t[0] + '</i>'; };
      return '<div class="w4-dr">' + PIC(f, 16) + '<span class="w4-dn" style="--t:' + SIM.T[f] + '">' + SIM.COURT[f] + '</span><span class="w4-tr"><i class="w4-tz" data-role="zone" style="width:' + zone + 'px;--z:' + SIM.Z[f] + ';--t:' + SIM.T[f] + '"></i>' + mk(b, HC[s.b], s.b) + mk(a, HC.Citra, 'Citra') + '</span></div>'; }).join('') + '</div>';
    h += '<p class="w4-n">' + ICO('cible', 14) + 'Un rond hors de la zone, cerclé d’orangé : hors de ta 16D.</p>';
    return h + preuve('q2');
  }, q3() {
    const s = ST.q3, K = Q3[s.k], n = K.jours.length - 1;
    let h = reg('suite', 'suite', [{ v: 'K3-citra3-galaxy7', t: 'puis Galaxy 7 j' }, { v: 'K3-citra3-idaho7-5', t: 'puis Idaho 7 5 j' }], s.k);
    h += '<div class="w4-regl"><span>jour</span><input class="w-cur" type="range" data-role="reglage" data-reglage="jour" min="0" max="' + n + '" value="' + Math.min(s.j, n) + '" aria-label="Jour de dry hop"></div>';
    const fams = ['tropical', 'citrus'], W = 300, H = 120, X = (j) => (j / n) * W, Y = (v) => H - Math.min(60, v) / 60 * H;
    const bandes = fams.map((f) => '<polygon fill="' + SIM.CB[f] + '" fill-opacity=".14" points="' + K.jours.map((x) => X(x.j) + ',' + Y(deplier(x.p)[f].haut)).join(' ') + ' ' + K.jours.slice().reverse().map((x) => X(x.j) + ',' + Y(deplier(x.p)[f].bas)).join(' ') + '"/>').join('');
    const lignes = bandes + fams.map((f) => '<polyline fill="none" stroke="' + SIM.CB[f] + '" stroke-width="2.5" points="' + K.jours.map((x) => X(x.j) + ',' + Y(deplier(x.p)[f].centre)).join(' ') + '"/>').join('');
    const ev = K.ajouts.map((a) => '<i class="w4-ev" style="left:' + X(a.j0 - K.jours[0].jr) + 'px"><span>' + a.h + ' ' + a.d + ' g/L</span></i>').join('');
    const pj = deplier(K.jours[Math.min(s.j, n)].p);
    h += '<div class="w4-lg">' + fams.map((f) => '<i style="background:' + SIM.CB[f] + '"></i>' + MOTS_F[f]).join('') + '<span>· points sur 100, ~ simulés ; voile : la bande du simulé (au-delà de 60, non dessinée) · zone : ta 16D</span></div>';
    h += '<div class="w4-chart" style="width:' + W + 'px"><i class="zn" data-role="zone" style="height:' + (30 / 60 * H) + 'px"></i><svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" aria-hidden="true">' + lignes + '</svg>' + ev + '<i class="w4-jour" style="left:' + X(Math.min(s.j, n)) + 'px"></i>'
      + [0, 30, 60].map((v) => '<span class="w4-yl" style="top:' + (Y(v) - 7) + 'px">' + v + '</span>').join('') + K.jours.filter((x, i) => i % 2 === 0).map((x) => '<span class="w4-xl" style="left:' + X(x.j) + 'px">J' + x.jr + '</span>').join('') + '</div>';
    h += '<p class="w4-n" data-nature="simule">' + ICO('timer', 14) + 'J' + K.jours[Math.min(s.j, n)].jr + ' : tropical ~ ' + Math.round(pj.tropical.centre) + ', agrumes ~ ' + Math.round(pj.citrus.centre) + ' sur 100 · ' + (pj.tropical.centre > SIM.B.tropical[1] ? 'hors de ta 16D' : 'dans ta 16D') + '</p>';
    return h + preuve('q3');
  }, q4() {
    const s = ST.q4, K = Q4[s.h], P = deplier(K.p);
    let h = reg('paire', 'Citra +', ['Galaxy', 'Idaho 7', 'Cascade'].map((x) => ({ v: x, t: x })), s.h);
    h += '<div class="w4-lg" data-role="ajout">' + NOMH.Citra + '<span>+</span>' + NOMH[s.h] + '<span>2 + 2 g/L ensemble, 3 j après</span></div>';
    const top = ORD.map((f, i) => ({ f, i, t: K.seuls.Citra[i] + K.seuls[s.h][i] })).filter((x) => x.t > 1).sort((a, b) => b.t - a.t).slice(0, 4);
    h += '<div class="w4-k">' + top.map((x) => { const sc = K.seuls.Citra[x.i], so = K.seuls[s.h][x.i], ac = K.ap.Citra[x.i], ao = K.ap[s.h][x.i], k = 1.6;
      return '<div class="w4-kl">' + PIC(x.f, 16) + '<span class="w4-dn" style="--t:' + SIM.T[x.f] + '">' + MOTS_F[x.f] + '</span><span class="w4-kb"><span title=""><i data-nature="simule" style="width:' + sc * k + 'px;background:' + HC.Citra + ';opacity:.45"></i><i data-nature="simule" style="width:' + so * k + 'px;background:' + HC[s.h] + ';opacity:.45"></i></span><span><i data-nature="simule" style="width:' + ac * k + 'px;background:' + HC.Citra + '"></i><i data-nature="simule" style="width:' + ao * k + 'px;background:' + HC[s.h] + '"></i></span></span><b class="w4-kv" data-nature="simule">~ ' + Math.round((ac + ao) / (sc + so) * 100) + ' %</b></div>'; }).join('')
      + '<p class="w4-n">' + ICO('cumul', 14) + 'En haut, pâle : chacun seul, additionnés. En bas : ensemble. À droite : ce qu’il reste de la somme (~ simulé).</p></div>';
    return h + preuve('q4');
  }, q5() {
    const s = ST.q5, P = deplier(Q5[s.l + '|' + s.m].p), U = deplier(Q5['us05|' + s.m].p);
    let h = reg('levure', 'levure', [{ v: 'us05', t: 'US-05' }, { v: 'verdant', t: 'Verdant' }, { v: 'pomona', t: 'Pomona' }, { v: 'diamond', t: 'Diamond' }], s.l) + reg('quand', 'dry hop', [{ v: 'actif', t: 'actif' }, { v: 'apres', t: 'après' }], s.m);
    h += '<div class="w4-lg" data-role="ajout">' + NOMH.Citra + '<span>2 g/L 3 j, puis</span>' + NOMH['Idaho 7'] + '<span>2 g/L 5 j (cas K4)</span></div>';
    h += '<div class="w4-bio" data-role="biotransformation" style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;font-size:14px">' + ICO('bio', 16) + (s.m === 'apres' ? '<span class="w-inc"><i class="w-hach"></i>après fermentation : hors du cas documenté, la levure ne change rien ici</span>'
      : s.l === 'pomona' ? '<b>Pomona</b>' + PIC('floral', 16) + ICO('fleche', 12) + PIC('citrus', 16) + '<span>géraniol → citronellol, ~ 50 % au centre (convention)</span>'
      : s.l === 'verdant' ? '<b>Verdant</b>' + PIC('tropical', 16) + '<span>thiols ~ 0,1 % libérés (convention)</span>'
      : s.l === 'diamond' ? '<b>Diamond</b>' + PIC('tropical', 16) + '<span>même convention que Verdant ; mesuré : plus de thiols, fruité perçu plus faible</span>'
      : '<span class="w-inc"><i class="w-hach"></i>US-05 : non publié, centre 0 (pas une preuve d’absence)</span>') + '</div>';
    h += '<div class="w4-dd">' + ['citrus', 'floral', 'tropical'].map((f) => '<div class="w4-dr">' + PIC(f, 16) + '<span class="w4-dn" style="--t:' + SIM.T[f] + '">' + SIM.COURT[f] + '</span><span class="w4-mv" data-nature="simule">~ ' + fr1(P[f].crans) + ' crans · ' + (Math.abs(P[f].crans - U[f].crans) < 0.05 ? 'comme US-05' : (P[f].crans > U[f].crans ? '+' : '−') + fr1(Math.abs(P[f].crans - U[f].crans)) + ' contre US-05') + '</span></div>').join('') + '</div>';
    h += (s.m === 'actif' ? '<p class="w4-n" style="color:var(--acc)">' + ICO('risque', 14) + 'hop creep : <span class="w-v mono" data-nature="mesure" data-source="H35 · Klimczak 2023">+0,39 % vol. en 2 j</span> avec une levure vivante</p>' : '');
    return h + preuve('q5');
  } };
function rendre(id) {
  const b = $('#b-' + id); if (!b || b.hidden) return;
  const tmp = document.createElement('div'); tmp.innerHTML = T[id]();
  const vieux = [...b.querySelectorAll(':scope > .w4-regl')];
  if (!vieux.length) { b.replaceChildren(...tmp.childNodes); return; }
  const neufs = [...tmp.querySelectorAll(':scope > .w4-regl')];
  vieux.forEach((v, i) => { const n = neufs[i]; if (!n) return; v.querySelectorAll('[role="radio"]').forEach((x, k) => { const y = n.querySelectorAll('[role="radio"]')[k]; if (y) x.setAttribute('aria-checked', y.getAttribute('aria-checked')); }); });
  [...b.children].forEach((c) => { if (!c.classList.contains('w4-regl')) c.remove(); });
  [...tmp.children].forEach((c) => { if (!c.classList.contains('w4-regl')) b.append(c); });
}
document.addEventListener('click', (e) => {
  const o = e.target.closest('[data-ouvre]');
  if (o) { const id = o.dataset.ouvre, art = o.closest('.w4-q'), ouvert = art.classList.contains('ouvert');
    document.querySelectorAll('.w4-q').forEach((a) => { a.classList.remove('ouvert'); a.querySelector('.w4-b').hidden = true; a.querySelector('.w4-qt').setAttribute('aria-expanded', 'false'); });
    if (!ouvert) { art.classList.add('ouvert'); art.querySelector('.w4-b').hidden = false; o.setAttribute('aria-expanded', 'true'); rendre(id); art.scrollIntoView({ block: 'nearest' }); }
    return; }
  const b = e.target.closest('button[data-role="reglage"]'); if (!b) return;
  const id = b.closest('.w4-q').dataset.q, k = b.dataset.reglage, v = b.dataset.v, s = ST[id];
  const M = { famille: 'f', dose: 'd', moment: 'm', autre: 'b', suite: 'k', paire: 'h', levure: 'l', quand: 'm' };
  s[M[k]] = k === 'dose' ? Number(v) : v; if (k === 'suite') { s.j = 10; const c = b.closest('.w4-b').querySelector('[data-reglage="jour"]'); if (c) c.value = '10'; }
  rendre(id);
});
document.addEventListener('input', (e) => { const c = e.target.closest('[data-reglage="jour"]'); if (!c) return; ST.q3.j = Number(c.value); rendre('q3'); });
const q = new URLSearchParams(location.search);
if (q.get('q')) { const o = document.querySelector('[data-ouvre="' + q.get('q') + '"]'); document.querySelector('.w4-q.ouvert [data-ouvre]').click(); o.click(); }
if (q.get('j')) { ST.q3.j = Number(q.get('j')); rendre('q3'); }
rendre('q1');
`;

ecrire(path.join(ICI, 'etat.html'), page({
  titre: 'w4 · Tes questions',
  commentaire: 'Lot 21 · w4 : les vraies questions du brasseur, la réponse en une ligne au repos, un petit simulateur par question et la preuve à un toucher ; profil ~ simulé (' + STUB_MOT + ').',
  corps: corps + tpl, css, js, demande: [{ f: 'citrus', s: 1 }],
  sim: { Z: Object.fromEntries(ORDRE.map((f) => [f, S.rgba(JET[f].base, 0.2)])), T: Object.fromEntries(ORDRE.map((f) => [f, JET[f].texte])), CB: Object.fromEntries(ORDRE.map((f) => [f, JET[f].base])), COURT },
}));
