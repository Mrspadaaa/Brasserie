// Lot 23 · série C · « les vraies valeurs d'abord » · huit concepts minimalistes de Dryhopper.
// « Je veux aussi des vrais valeur » ; « Les deux se complément » : les mesures publiées d'abord (E01 à E10),
// le simulé d'Idaho 7 ensuite, sans l'austérité de v1. Une question, un seul facteur libre : le moment.
// Usage : node work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-c/generer.mjs [c1 …]
import path from 'node:path';
import * as C from './commun.mjs';

const { S, esc, fr, ic, pic, COURT, ORDRE, MO, V, SRC, SEUIL, FAM_C, NOM_C, AV, BANDE, DEPART, ACC, COUL_I7 } = C;
const { tete, contexte, lentille, badge, hach, levure, barres, rail, page, ecrire } = C;
const seuilX = (v, [a, b]) => (a === b ? '×' + fr(v / a, 1) : '×' + fr(v / b, 1) + '–' + fr(v / a, 1));
const sx = (m) => seuilX(m.v, SEUIL[m.compose]);
// La valeur mesurée, balisée : nombre, unité, source.
const mv = (m, txt) => `<b class="mono" data-nature="mesure" data-source="${esc(SRC(m.id))}">${txt ?? fr(m.v, m.v < 10 ? 1 : 0) + '<small> ' + m.u + '</small>'}</b>`;
// Position d'un moment sur le rail (même formule que la page).
const xPos = (i) => { const s = MO[i].seg, idx = MO.map((p, k) => k).filter((k) => MO[k].seg === s), n = idx.length, [a, b] = C.SEG[s]; return n === 1 ? (a + b) / 2 : a + (b - a) * (0.06 + 0.88 * idx.indexOf(i) / (n - 1)); };
const iDe = (id) => MO.findIndex((m) => m.id === id);
const [LIN, MYR, HUM, CAR] = V.i7;
const pctW = trois(V.wolfeLin), pctL = trois(V.wolfeLim);
function trois(m) { return C.trois(m); }
// Le groupe d'un moment, côté page.
const JS_CLE = `const cleM = (i) => { const m = MO[i]; return m.seg === 0 ? (m.id === 'b10' ? 'tiede' : 'chaud') : m.seg === 1 ? 'tiede' : m.seg === 2 ? 'actif' : 'apres'; };
const montrerPv = (sel, k) => document.querySelectorAll(sel).forEach((e) => { e.hidden = e.dataset.pv !== k; });`;

const concepts = {};

// =====================================================================================================
// c1 · froide · L'écran de la carte, la preuve du moment en tête.
// =====================================================================================================
concepts.c1 = () => {
  const P = 'c1';
  const carte = (k, corps) => `<div class="${P}-pv" data-pv="${k}"${k === 'actif' ? '' : ' hidden'}>${corps}</div>`;
  const ligne = (f, val, mot, x) => `<span class="${P}-l" data-famille="${f}">${pic(f, 18)}${val}<span class="${P}-m">${mot}</span>${x ? `<em class="mono">${x}</em>` : ''}</span>`;
  const corps = `
  ${tete(P)}
  ${contexte(P)}
  <section class="${P}-preuve" data-acquis="valeurs" aria-label="Ce qu'on a mesuré à ce moment">
    ${carte('chaud', `<div class="${P}-src">${badge('panel')}<span>jury entraîné, 60′, Simcoe et Hallertau · ${SRC('E07')}</span></div>
      ${ligne('herbal', '<b class="' + P + '-gros" data-nature="qualitatif" data-source="' + esc(SRC('E07')) + '">cuit, herbacé</b>', 'à chaud')}
      <div class="${P}-src">${hach('Idaho 7 à chaud : jamais mesuré')}</div>`)}
    ${carte('tiede', `<div class="${P}-src">${badge('figure')}<span>whirlpool contre dry hop, 12 houblons à 4 g/L · ${SRC('E09')}</span></div>
      <div class="${P}-src">${hach('pas de chiffre publié, figure seule')}</div>`)}
    ${carte('actif', `<div class="${P}-src">${badge('mesure')}${badge('verifier')}<span>Idaho 7 en fermentation · ${SRC('E03')}</span></div>
      ${ligne('floral', mv(LIN), 'linalol', sx(LIN))}${ligne('resin', mv(MYR), 'myrcène', sx(MYR))}`)}
    ${carte('apres', `<div class="${P}-src">${badge('panel')}<span>Cascade 3,86 g/L, 24 h · ${SRC('E04')}</span></div>
      ${ligne('citrus', mv(V.agr, fr(V.agr0.v) + ' → ' + fr(V.agr.v)), 'agrumes au jury, sur 15')}
      <div class="${P}-src">${hach('Idaho 7 après fermentation : pas mesuré')}</div>`)}
    <p class="${P}-seuil">× le seuil : seuils de ${SRC('E06')}</p>
  </section>
  <div class="${P}-lent-l"><span class="${P}-sim">${badge('simule')}Idaho 7 dans ta stout</span>${lentille(P)}</div>
  <section class="${P}-bloc">${barres(P)}<p class="${P}-ibu mono" data-nature="simule"></p></section>
  ${rail(P)}
  <div class="${P}-evo" aria-label="Ma bière, +1, +2 dry hops"><span class="${P}-et2">Ma bière</span><span>→</span><span class="${P}-et2">+1</span><span>→</span><span class="${P}-et2">+2</span>
    <span class="${P}-ev" data-famille="floral">${pic('floral', 14)}<span class="mono">~${Math.round(AV.floral)}</span></span><span></span><span class="${P}-ev" data-famille="floral">${pic('floral', 14)}<span class="mono" id="${P}-e1">~</span></span><span></span><span class="${P}-ev">${hach('?')}</span></div>
  ${levure(P, 'etape')}`;
  const css = `${C.CSS_TETE(P)}${C.CSS_BARRES(P, 12)}${C.CSS_RAIL(P)}
  .${P}-preuve { background: #fff; border-radius: 8px; padding: 8px 10px; display: flex; flex-direction: column; gap: 6px; box-shadow: inset 4px 0 0 ${COUL_I7}; }
  .${P}-pv { display: flex; flex-direction: column; gap: 5px; }
  .${P}-src { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; font-size: 12px; color: var(--gris); }
  .${P}-l { display: flex; align-items: center; gap: 6px; color: var(--t); font-size: 14px; }
  .${P}-l b { font-size: 20px; font-weight: 600; color: var(--t); }
  .${P}-gros { font-size: 18px !important; }
  .${P}-m { color: var(--encre); }
  .${P}-l em { font-style: normal; font-size: 13px; margin-left: auto; padding: 1px 6px; border-radius: 4px; background: var(--f); color: var(--t); }
  .${P}-seuil { font-size: 12px; color: var(--gris); }
  .${P}-lent-l { display: flex; align-items: center; gap: 6px; }
  .${P}-sim { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; }
  .${P}-bloc { background: #fff; border-radius: 8px; padding: 8px 10px; display: flex; flex-direction: column; gap: 4px; }
  .${P}-ibu { font-size: 12px; color: var(--gris); text-align: right; }
  .${P}-evo { display: grid; grid-template-columns: 1fr 14px 1fr 14px 1fr; gap: 2px 4px; align-items: center; background: #fff; border-radius: 8px; padding: 6px 10px; font-size: 13px; }
  .${P}-et2 { font-weight: 600; } .${P}-ev { display: flex; align-items: center; gap: 4px; }`;
  const js = `${JS_CLE}
window.maj = (i) => {
  const m = MO[i], k = cleM(i); montrerPv('.${P}-pv', k);
  majBarres(document.querySelector('.${P}-bars'), i);
  document.querySelector('.${P}-ibu').textContent = m.cru ? 'IBU à cru : non modélisé' : m.ibu == null ? 'IBU : ? (pas calculé à ce moment)' : 'IBU 60 → ~' + (60 + m.ibu);
  document.getElementById('${P}-e1').textContent = m.v ? '~' + Math.round(m.v.floral) : '?';
};
${C.JS_RAIL(P)}`;
  return { id: P, chaleur: 'froide', resume: 'l\'écran de la carte, la preuve mesurée du moment en tête', corps, css, js, legende: `<div class="w-leg-s"><h3>Cet écran</h3><p>En haut, ce qu’une étude a mesuré au moment choisi ; dessous, le profil simulé d’Idaho 7 dans ta stout, face à la zone de la 16D ; rond creux : ta stout avant.</p></div>` };
};

// =====================================================================================================
// c2 · froide · y1b, le brassin au doigt : le dock sous le pouce, jalonné de ses preuves.
// =====================================================================================================
concepts.c2 = () => {
  const P = 'c2';
  const jalons = [['b60', 'panel', 'E07'], ['wp', 'labo', 'E09'], ['dryActive|1', 'labo', 'E03'], ['dryPost|1', 'panel', 'E04'], ['dryPost|2', 'panel', 'E08']];
  const haut = `<div class="${P}-bulle" data-acquis="valeurs" aria-live="polite">
      <span data-pv="chaud" hidden>${badge('panel')}<b>cuit, herbacé</b> au jury à 60′ · ${SRC('E07')}</span>
      <span data-pv="tiede" hidden>${badge('figure')}whirlpool contre dry hop : non chiffré · ${SRC('E09')}</span>
      <span data-pv="actif">${badge('mesure')}<span data-famille="floral" class="${P}-v">${pic('floral', 14)}${mv(LIN)}</span>Idaho 7 en fermentation · ${SRC('E03')}</span>
      <span data-pv="apres" hidden>${badge('panel')}<span class="${P}-v">${mv(V.ohai, fr(V.ohai0.v) + '→' + fr(V.ohai.v) + '/15')}</span>Cascade en 24 h · ${SRC('E04')}</span></div>
    <div class="${P}-jal" aria-hidden="true">${jalons.map(([id, k]) => `<span style="left:${xPos(iDe(id))}%">${ic(k, 14)}</span>`).join('')}</div>`;
  const corps = `
  ${tete(P)}
  ${contexte(P)}
  <section class="${P}-face"><div class="${P}-ft"><b>Face à ta stout</b>${lentille(P)}</div><p class="${P}-vd" data-nature="simule"></p>
    ${barres(P)}</section>
  <section class="${P}-amer"><div class="${P}-at"><span>amertume de ta stout</span><b class="mono" data-nature="simule"></b></div><div class="${P}-aj"><i class="${P}-a0"></i><i class="${P}-a1"></i><i class="${P}-az"></i></div><p class="${P}-ap">Nugget 60′ ≈ 60 · 16D : 50–70</p></section>
  ${levure(P, 'pont')}
  ${rail(P, { dock: true, haut })}`;
  const css = `${C.CSS_TETE(P)}${C.CSS_BARRES(P, 10)}${C.CSS_RAIL(P)}
  .${P}-face, .${P}-amer { background: #fff; border-radius: 8px; padding: 8px 10px; display: flex; flex-direction: column; gap: 4px; }
  .${P}-ft { display: flex; align-items: center; gap: 6px; font-size: 15px; }
  .${P}-vd { display: flex; flex-wrap: wrap; gap: 4px 10px; font-size: 14px; font-weight: 600; min-height: 20px; }
  .${P}-vd span { display: inline-flex; align-items: center; gap: 3px; color: var(--t); }
  .${P}-vd span.hors { color: ${ACC}; }
  .${P}-at { display: flex; justify-content: space-between; font-size: 13px; color: var(--gris); }
  .${P}-at b { color: var(--encre); font-size: 14px; }
  .${P}-aj { position: relative; height: 10px; background: #f1f2f5; border-radius: 2px; }
  .${P}-aj i { position: absolute; top: 0; bottom: 0; left: 0; display: block; border-radius: 2px; }
  .${P}-a0 { width: 30%; background: #6b6b75; } .${P}-a1 { left: 30% !important; width: var(--w, 0%); background: ${ACC}; }
  .${P}-az { left: 25% !important; width: 10%; box-shadow: inset 0 0 0 1.5px var(--encre); background: transparent; }
  .${P}-ap { font-size: 12px; color: var(--gris); }
  .${P}-dock { position: fixed; left: 0; right: 0; bottom: 0; max-width: 390px; margin: 0 auto; padding: 50px 16px 22px; border-radius: 8px 8px 0 0; box-shadow: 0 -2px 10px rgba(0,0,0,.08); z-index: 6; }
  body { padding-bottom: 120px; }
  .${P}-bulle { position: absolute; left: 10px; right: 10px; top: 6px; font-size: 12px; color: var(--gris); display: flex; }
  .${P}-bulle > span { display: flex; align-items: center; gap: 5px; flex-wrap: nowrap; white-space: nowrap; overflow: hidden; }
  .${P}-bulle b { color: var(--encre); font-size: 13px; }
  .${P}-v { display: inline-flex; align-items: center; gap: 3px; } .${P}-v b { color: var(--t); }
  .${P}-jal { position: absolute; left: 16px; right: 16px; bottom: 3px; height: 16px; }
  .${P}-jal span { position: absolute; transform: translateX(-50%); color: #2f5f9e; }`;
  const js = `${JS_CLE}
const MOTF = ${JSON.stringify(S.MOTS_F)};
window.maj = (i) => {
  const m = MO[i]; montrerPv('.${P}-bulle > span', cleM(i));
  majBarres(document.querySelector('.${P}-bars'), i);
  const vd = document.querySelector('.${P}-vd');
  if (!m.v) vd.innerHTML = '<span>? pas calculé à ' + m.lib + '</span>';
  else vd.innerHTML = Object.keys(m.v).filter((f) => !m.inc.includes(f)).map((f) => ({ f, d: m.v[f] - AV[f] })).sort((a, b) => b.d - a.d).slice(0, 3)
    .map((x) => '<span data-famille="' + x.f + '" class="' + (m.v[x.f] > BANDE[x.f] ? 'hors' : '') + '"><svg class="pi" width="14" height="14" data-famille="' + x.f + '" role="img" aria-label="' + NOMF[x.f] + '"><use href="#p-' + x.f + '"/></svg>~+' + Math.round(x.d) + ' ' + MOTF[x.f] + (m.v[x.f] > BANDE[x.f] ? ' hors style' : '') + '</span>').join('');
  const a = document.querySelector('.${P}-at b'), w = m.cru ? 0 : (m.ibu || 0);
  a.textContent = m.cru ? '≈ 60 IBU, tenue' : m.ibu == null ? '? IBU' : '~' + (60 + m.ibu) + ' IBU';
  document.querySelector('.${P}-a1').style.setProperty('--w', Math.min(70, w / 200 * 100) + '%');
};
${C.JS_RAIL(P)}`;
  return { id: P, chaleur: 'froide', resume: 'y1b : dock sous le pouce, rail jalonné des études, la preuve dans la bulle', corps, css, js, legende: `<div class="w-leg-s"><h3>Le dock</h3><p>Glisse le pouce sur le brassin ; les petits flacons et jurys marquent les moments où une étude a mesuré ; la bulle dit sa valeur.</p></div>` };
};

// =====================================================================================================
// c3 · tiède · Le brassin à la verticale : du chaud au froid, les mesures épinglées à leur heure.
// =====================================================================================================
concepts.c3 = () => {
  const P = 'c3';
  const SG = [[0, 30], [30, 38], [38, 66], [66, 100]];
  const yPos = (i) => { const s = MO[i].seg, idx = MO.map((p, k) => k).filter((k) => MO[k].seg === s), n = idx.length, [a, b] = SG[s]; return n === 1 ? (a + b) / 2 : a + (b - a) * (0.06 + 0.88 * idx.indexOf(i) / (n - 1)); };
  const pin = (id, k, f, val, txt, src, cls = '') => `<div class="${P}-pin ${cls}" style="top:${yPos(iDe(id))}%" data-pv="${k}"${f ? ` data-famille="${f}"` : ''}>${f ? pic(f, 16) : ic('panel', 16)}<span class="${P}-pt">${val}<span>${txt}</span></span><span class="${P}-ps">${src}</span></div>`;
  const pins = [
    pin('b60', 'chaud', 'herbal', `<b data-nature="qualitatif" data-source="${esc(SRC('E07'))}">cuit, herbacé</b>`, 'au jury', SRC('E07')),
    pin('wp', 'tiede', null, hach('non chiffré'), 'contre dry hop', SRC('E09')),
    pin('dryActive|2', 'actif', 'floral', mv(LIN), 'linalol, Idaho 7', `${SRC('E03')} ${badge('verifier')}`),
    pin('dryActive|5', 'actif', 'resin', mv(MYR), 'myrcène, Idaho 7', SRC('E03')),
    pin('dryPost|1', 'apres', 'citrus', mv(V.agr, fr(V.agr0.v) + '→' + fr(V.agr.v) + '<small>/15</small>'), 'agrumes, jury 24 h', 'Cascade · ' + SRC('E04')),
    pin('dryPost|3', 'apres', 'berries', `<b data-nature="qualitatif" data-source="${esc(SRC('E08'))}">2 j</b>`, 'l’essentiel passe', SRC('E08')),
    pin('dryPost|7', 'apres', null, `<b data-nature="qualitatif" data-source="${esc(SRC('E10'))}">1 h = 4 j</b>`, 'au jury', SRC('E10')),
  ].join('');
  const marques = [['b60', '60′'], ['b10', '10′'], ['wp', 'WP'], ['dryActive|1', 'levure'], ['dryPost|1', 'fin'], ['dryPost|7', 'J7']].map(([id, t]) => `<span class="${P}-mq" style="top:${yPos(iDe(id))}%">${t}</span>`).join('');
  const corps = `
  ${tete(P)}
  ${contexte(P)}
  <div class="${P}-lent-l"><span class="${P}-leg">${badge('mesure')}${badge('simule')}</span>${lentille(P)}</div>
  <section class="${P}-axe">
    <div class="${P}-col" data-libre="moment"><div class="${P}-rail" role="slider" tabindex="0" aria-orientation="vertical" aria-label="Moment de l'ajout" aria-valuemin="0" aria-valuemax="${MO.length - 1}" aria-valuenow="${DEPART}" aria-valuetext="${MO[DEPART].lib}">
      ${SG.map(([a, b], k) => `<span class="${P}-sg s${k}" style="top:${a}%;height:${b - a}%"></span>`).join('')}
      ${MO.map((m, k) => `<i class="${P}-tk${m.v ? '' : ' vide'}" style="top:${yPos(k)}%"></i>`).join('')}
      <span class="${P}-pouce"></span></div>${marques}</div>
    <div class="${P}-sim" aria-live="polite"><b class="${P}-sl"></b>${barres(P, ['floral', 'resin', 'green'], { noms: false, z: 14 })}<span class="${P}-ibu mono"></span></div>
    <div class="${P}-pins" data-acquis="valeurs">${pins}</div>
  </section>
  ${levure(P, 'etape')}`;
  const css = `${C.CSS_TETE(P)}${C.CSS_BARRES(P, 8)}
  .${P}-lent-l { display: flex; align-items: center; gap: 6px; }
  .${P}-leg { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: var(--gris); flex-wrap: wrap; }
  .${P}-axe { position: relative; height: 560px; background: #fff; border-radius: 8px; }
  .${P}-col { position: absolute; left: 0; top: 14px; bottom: 14px; width: 150px; touch-action: none; }
  .${P}-rail { position: absolute; left: 116px; top: 0; bottom: 0; width: 28px; cursor: pointer; touch-action: none; }
  .${P}-sg { position: absolute; left: 11px; width: 6px; border-radius: 2px; }
  .${P}-sg.s0 { background: #e8b4a0; } .${P}-sg.s1 { background: #b9a4d8; } .${P}-sg.s2 { background: #9fc3e6; } .${P}-sg.s3 { background: #8fcfb4; }
  .${P}-tk { position: absolute; left: 7px; width: 14px; height: 1.5px; margin-top: -.75px; background: var(--encre); opacity: .55; }
  .${P}-tk.vide { opacity: .22; }
  .${P}-pouce { position: absolute; left: 4px; width: 20px; height: 20px; margin-top: -10px; border-radius: 50%; background: var(--encre); transition: top .12s; }
  .${P}-mq { position: absolute; left: 82px; transform: translateY(-50%); font-size: 12px; color: var(--gris); }
  .${P}-sim { position: absolute; left: 6px; width: 104px; transform: translateY(-50%); background: #fff; border-radius: 8px; box-shadow: 0 0 0 1.5px var(--encre); padding: 4px 6px; display: flex; flex-direction: column; gap: 2px; transition: top .12s; z-index: 2; }
  .${P}-sl { font-size: 12px; }
  .${P}-sim .${P}-ba { grid-template-columns: 16px 1fr 30px; gap: 3px; min-height: 14px; font-size: 12px; }
  .${P}-ibu { font-size: 12px; color: var(--gris); }
  .${P}-pins { position: absolute; left: 154px; right: 6px; top: 14px; bottom: 14px; }
  .${P}-pin { position: absolute; left: 0; right: 0; transform: translateY(-50%); display: grid; grid-template-columns: 16px 1fr; column-gap: 5px; align-items: center; padding: 3px 6px; border-radius: 8px; color: var(--t, var(--encre)); opacity: .55; }
  .${P}-pin::before { content: ''; position: absolute; left: -12px; top: 50%; width: 10px; height: 1.5px; background: currentColor; }
  .${P}-pin.on { opacity: 1; background: var(--f, #eef0f4); }
  .${P}-pt { display: flex; align-items: baseline; gap: 4px; font-size: 12px; color: var(--encre); white-space: nowrap; }
  .${P}-pt b { font-size: 15px; color: var(--t, var(--encre)); }
  .${P}-ps { grid-column: 2; font-size: 12px; color: var(--gris); white-space: nowrap; display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }`;
  const js = `${JS_CLE}
const SGV = ${JSON.stringify(SG)}, rail = document.querySelector('.${P}-rail'), N = MO.length - 1;
const yPos = (i) => { const s = MO[i].seg, idx = MO.map((p, k) => k).filter((k) => MO[k].seg === s), n = idx.length, [a, b] = SGV[s]; return n === 1 ? (a + b) / 2 : a + (b - a) * (0.06 + 0.88 * idx.indexOf(i) / (n - 1)); };
function poser(i) {
  const m = MO[i]; rail.setAttribute('aria-valuenow', i); rail.setAttribute('aria-valuetext', m.lib);
  rail.querySelector('.${P}-pouce').style.top = yPos(i) + '%';
  const sim = document.querySelector('.${P}-sim'), h = rail.getBoundingClientRect().height || 532; sim.style.top = (14 + yPos(i) / 100 * h) + 'px';
  sim.querySelector('.${P}-sl').textContent = '~ ' + m.lib;
  majBarres(document.querySelector('.${P}-bars'), i);
  sim.querySelector('.${P}-ibu').textContent = m.cru ? 'IBU à cru : ?' : m.ibu == null ? 'IBU : ?' : '~+' + m.ibu + ' IBU';
  const k = cleM(i); document.querySelectorAll('.${P}-pin').forEach((p) => p.classList.toggle('on', p.dataset.pv === k));
}
function depuis(e) { const r = rail.getBoundingClientRect(), pct = (e.clientY - r.top) / r.height * 100; let best = 0, bd = 1e9; for (let k = 0; k <= N; k++) { const d = Math.abs(yPos(k) - pct); if (d < bd) { bd = d; best = k; } } if (best !== +rail.getAttribute('aria-valuenow')) poser(best); }
const col = document.querySelector('.${P}-col');
col.addEventListener('pointerdown', (e) => { col.setPointerCapture(e.pointerId); depuis(e); });
col.addEventListener('pointermove', (e) => { if (e.buttons) depuis(e); });
rail.addEventListener('keydown', (e) => { const i = +rail.getAttribute('aria-valuenow'); if (e.key === 'ArrowDown') poser(Math.min(N, i + 1)); if (e.key === 'ArrowUp') poser(Math.max(0, i - 1)); });
const q = location.search.match(/moment=([^&]+)/); poser(q ? Math.max(0, MO.findIndex((p) => p.id === decodeURIComponent(q[1]))) : ${DEPART});`;
  return { id: P, chaleur: 'tiède', resume: 'le brassin à la verticale, du chaud au froid, mesures épinglées à leur heure, le simulé sous le pouce', corps, css, js, legende: `<div class="w-leg-s"><h3>Le brassin</h3><p>De haut en bas : ébullition, whirlpool, fermentation, après. À droite, chaque étude à l’heure où elle a mesuré ; à gauche, sous ton pouce, Idaho 7 simulé (floral, résineux, végétal).</p></div>` };
};

// =====================================================================================================
// c4 · tiède · La courbe de contact : trois études sur l'axe des heures, le simulé d'Idaho 7 sur le même axe.
// =====================================================================================================
concepts.c4 = () => {
  const P = 'c4';
  const W = 330, X0 = 14, X1 = 318, lh = (h) => X0 + (Math.log10(h) - 0) / (Math.log10(288) - 0) * (X1 - X0); // 1 h → 12 j
  const T = [[1, '1 h'], [6, '6 h'], [24, '24 h'], [48, '2 j'], [96, '4 j'], [288, '12 j']];
  const yE5 = (p) => 62 - p / 50 * 40; // % de l'huile, 0–50
  const [l6, lpic, l12] = pctW, [m6, mpic, m12] = pctL;
  const F = S.JET.floral, Z = S.JET.citrus, Bq = S.JET.berries;
  const svg = `<svg class="${P}-svg" viewBox="0 0 ${W} 236" width="100%" role="img" aria-label="Le contact du houblon, mesuré : extraction, transfert, jury ; puis Idaho 7 simulé">
    ${T.map(([h, t]) => `<line x1="${lh(h)}" x2="${lh(h)}" y1="16" y2="214" stroke="#e3e5eb"/><text x="${lh(h)}" y="230" text-anchor="middle" class="${P}-ax">${t}</text>`).join('')}
    <g data-nature="mesure" data-source="${esc(SRC('E05'))}">
      <text x="2" y="12" class="${P}-lt">huile passée dans la bière · Cascade · ${SRC('E05')}</text>
      <polyline points="${lh(6)},${yE5(l6)} ${lh(288)},${yE5(l12)}" fill="none" stroke="${F.base}" stroke-width="2.5"/>
      <circle cx="${lh(6)}" cy="${yE5(l6)}" r="4" fill="${F.base}"/><circle cx="${lh(288)}" cy="${yE5(l12)}" r="4" fill="${F.base}"/>
      <text x="${lh(6) - 7}" y="${yE5(l6) + 4}" text-anchor="end" class="${P}-v" fill="${F.texte}">linalol ${fr(l6)} %</text><text x="${lh(288) - 4}" y="${yE5(l12) - 7}" text-anchor="end" class="${P}-v" fill="${F.texte}">${fr(l12)} %</text>
      <polyline points="${lh(6)},${yE5(m6)} ${lh(288)},${yE5(m12)}" fill="none" stroke="${Z.base}" stroke-width="2.5"/>
      <circle cx="${lh(6)}" cy="${yE5(m6)}" r="4" fill="${Z.base}"/><circle cx="${lh(288)}" cy="${yE5(m12)}" r="4" fill="${Z.base}"/>
      <text x="${lh(6) - 7}" y="${yE5(m6) + 4}" text-anchor="end" class="${P}-v" fill="${Z.texte}">limonène ${fr(m6)} %</text><text x="${lh(288) - 4}" y="${yE5(m12) + 16}" text-anchor="end" class="${P}-v" fill="${Z.texte}">${fr(m12)} %</text></g>
    <g data-nature="qualitatif" data-source="${esc(SRC('E08'))}"><text x="2" y="90" class="${P}-lt">passage · Eureka! · ${SRC('E08')}</text>
      <rect x="${lh(1)}" y="96" width="${lh(48) - lh(1)}" height="14" rx="2" fill="${Bq.base}"/><rect x="${lh(48)}" y="100" width="${lh(288) - lh(48)}" height="6" rx="2" fill="${Bq.fond}" stroke="${Bq.base}"/>
      <text x="${lh(1) + 6}" y="107.5" class="${P}-v" fill="#fff">l’essentiel en 2 j</text></g>
    <g data-nature="qualitatif" data-source="${esc(SRC('E10'))}"><text x="2" y="128" class="${P}-lt">jury · Cascade · ${SRC('E10')}</text>
      <path d="M${lh(1)},142 v-8 M${lh(1)},138 H${lh(96)} M${lh(96)},142 v-8" stroke="#2f5f9e" stroke-width="2" fill="none"/>
      <text x="${(lh(1) + lh(96)) / 2}" y="156" text-anchor="middle" class="${P}-v" fill="#2f5f9e">1 h = 4 j, même goût</text></g>
    <g data-nature="simule"><text x="2" y="174" class="${P}-lt ${P}-lts">~ Idaho 7 dans ta stout, floral, jour après jour</text>
      <polyline class="${P}-spl" fill="none" stroke="${F.base}" stroke-width="2.5"/><g class="${P}-spd"></g></g>
    <line class="${P}-cur" x1="0" x2="0" y1="16" y2="214" stroke="#16161a" stroke-width="2"/>
    <rect class="${P}-chaud" x="0" y="14" width="${W}" height="202" fill="#fff" opacity=".88" style="display:none"/>
  </svg>`;
  const corps = `
  ${tete(P)}
  ${contexte(P)}
  <section class="${P}-bloc" data-acquis="valeurs"><div class="${P}-t">${badge('mesure')}${badge('panel')}<b>Le contact, mesuré</b></div>${svg}
    <p class="${P}-ch" data-pv="chaud" hidden>${badge('panel')}à chaud, pas de contact : <b>cuit, herbacé</b> au jury · ${SRC('E07')}</p>
    <p class="${P}-ch" data-pv="tiede" hidden>${hach('whirlpool : non chiffré')} · ${SRC('E09')}</p></section>
  <section class="${P}-bloc"><div class="${P}-t">${badge('simule')}<b>Idaho 7 dans ta stout</b>${lentille(P)}</div>
    ${barres(P, ['floral', 'citrus', 'tropical', 'resin'])}<p class="${P}-ibu mono" data-nature="simule"></p></section>
  ${rail(P)}
  ${levure(P, 'pont')}`;
  const css = `${C.CSS_TETE(P)}${C.CSS_BARRES(P, 12)}${C.CSS_RAIL(P)}
  .${P}-bloc { background: #fff; border-radius: 8px; padding: 8px 10px; display: flex; flex-direction: column; gap: 4px; position: relative; }
  .${P}-t { display: flex; align-items: center; gap: 6px; font-size: 14px; }
  .${P}-svg text { font-family: var(--sans); }
  .${P}-ax { font-size: 12px; fill: #55555f; } .${P}-lt { font-size: 12px; fill: #55555f; } .${P}-v { font-size: 13px; font-weight: 700; }
  .${P}-ch { position: absolute; left: 10px; right: 10px; top: 90px; display: flex; flex-wrap: wrap; align-items: center; gap: 4px; font-size: 14px; background: #fff; padding: 6px; border-radius: 8px; box-shadow: 0 0 0 1.5px var(--encre); }
  .${P}-lts { fill: #16161a !important; font-weight: 600; }
  .${P}-ibu { font-size: 12px; color: var(--gris); text-align: right; }`;
  const js = `${JS_CLE}
const lh = (h) => ${X0} + Math.log10(h) / Math.log10(288) * ${X1 - X0};
window.maj = (i) => {
  const m = MO[i], k = cleM(i), cru = m.seg >= 2;
  montrerPv('.${P}-ch', k);
  document.querySelector('.${P}-chaud').style.display = cru ? 'none' : '';
  const c = document.querySelector('.${P}-cur'); c.style.display = cru ? '' : 'none'; if (cru) { c.setAttribute('x1', lh(m.j * 24)); c.setAttribute('x2', lh(m.j * 24)); }
  const jours = MO.filter((p) => p.seg === (cru ? m.seg : 3)), yy = (v) => 208 - v / 30 * 26;
  document.querySelector('.${P}-spl').setAttribute('points', jours.map((p) => lh(p.j * 24).toFixed(1) + ',' + yy(p.v.floral - AV.floral).toFixed(1)).join(' '));
  document.querySelector('.${P}-spd').innerHTML = jours.map((p, n) => '<circle cx="' + lh(p.j * 24).toFixed(1) + '" cy="' + yy(p.v.floral - AV.floral).toFixed(1) + '" r="' + (p === m ? 5 : 3) + '" fill="${S.JET.floral.base}"/>' + (n === 0 || p === m ? '<text x="' + (lh(p.j * 24) + (n === 0 ? -6 : 6)).toFixed(1) + '" y="' + (yy(p.v.floral - AV.floral) + 4).toFixed(1) + '" text-anchor="' + (n === 0 ? 'end' : 'start') + '" class="${P}-v" fill="${S.JET.floral.texte}">~+' + Math.round(p.v.floral - AV.floral) + '</text>' : '')).join('');
  majBarres(document.querySelector('.${P}-bars'), i);
  document.querySelector('.${P}-ibu').textContent = (m.cru ? 'IBU à cru : non modélisé' : m.ibu == null ? 'IBU : ?' : 'IBU 60 → ~' + (60 + m.ibu));
};
${C.JS_RAIL(P)}`;
  return { id: P, chaleur: 'tiède', resume: 'la courbe de contact : extraction (E05), transfert (E08), jury (E10) sur l\'axe des heures ; le floral simulé d\'Idaho 7 sur le même axe', corps, css, js, legende: `<div class="w-leg-s"><h3>Le contact</h3><p>Axe des heures de contact (1 h à 12 j). Violet : linalol, jaune : limonène, en part de l’huile du houblon passée dans la bière. Le trait noir : ton jour de contact.</p></div>` };
};

// =====================================================================================================
// c5 · tiède · Idaho 7, mesuré une fois : ses composés face au seuil ; ailleurs, l'inconnu se voit.
// =====================================================================================================
concepts.c5 = () => {
  const P = 'c5';
  const lx = (r) => (Math.log10(r) + 1) / 3 * 100; // ×0,1 → ×100
  const row = (m) => { const [a, b] = SEUIL[m.compose], lo = m.v / b, hi = m.v / a, f = FAM_C[m.compose];
    return `<div class="${P}-r" data-famille="${f}" data-compose="${NOM_C[m.compose]}"><span class="${P}-n">${pic(f, 16)}${NOM_C[m.compose]}</span><span class="${P}-tr"><i class="${P}-s1"></i><i class="${P}-bd" style="left:${lx(lo)}%;width:${Math.max(1.5, lx(hi) - lx(lo))}%"></i></span>${mv(m)}<em class="mono">${seuilX(m.v, [a, b])}</em></div>`; };
  const AX = [0.1, 1, 10, 100];
  const corps = `
  ${tete(P)}
  ${contexte(P)}
  <section class="${P}-bloc ${P}-mes" data-acquis="chimie">
    <div class="${P}-t">${badge('mesure')}${badge('verifier')}<b>Idaho 7 en fermentation</b></div>
    <p class="${P}-q">au pitch, S-04, 14 j · ${SRC('E03')}</p>
    <div class="${P}-ax">${AX.map((x) => `<span style="left:${lx(x)}%">${x === 1 ? 'seuil' : '×' + fr(x)}</span>`).join('')}</div>
    ${V.i7.map(row).join('')}
    <div class="${P}-voile" hidden>${hach('à ce moment, Idaho 7 n’a jamais été mesuré')}<span class="${P}-qq">ci-dessus : en fermentation</span></div>
  </section>
  <section class="${P}-bloc"><div class="${P}-t">${badge('simule')}<b class="${P}-sl"></b>${lentille(P)}</div>
    <div class="${P}-rad" data-acquis="radar"><svg class="${P}-svg" viewBox="-110 -104 220 208" width="220" height="208" data-radar data-axes="${ORDRE.join(',')}" role="img" aria-label="Ta stout avant et avec Idaho 7, simulé">
      ${[0.33, 0.66, 1].map((r) => `<polygon class="${P}-g" points="${ORDRE.map((f, k) => { const a = -Math.PI / 2 + k * 2 * Math.PI / 12; return (Math.cos(a) * 80 * r).toFixed(1) + ',' + (Math.sin(a) * 80 * r).toFixed(1); }).join(' ')}"/>`).join('')}
      <polygon class="${P}-zone" data-role="zone"/>
      <polygon class="${P}-av"/><polygon class="${P}-ap"/>
      ${ORDRE.map((f, k) => { const a = -Math.PI / 2 + k * 2 * Math.PI / 12; return `<g transform="translate(${(Math.cos(a) * 96 - 8).toFixed(1)},${(Math.sin(a) * 96 - 8).toFixed(1)})"><svg width="16" height="16" class="pi" data-famille="${f}" role="img" aria-label="${S.NOM[f]}"><use href="#p-${f}"/></svg></g>`; }).join('')}
      <g class="${P}-inc"></g></svg>
    <div class="${P}-dl"></div></div></section>
  ${rail(P)}
  ${levure(P, 'etape')}`;
  const css = `${C.CSS_TETE(P)}${C.CSS_RAIL(P)}
  .${P}-bloc { background: #fff; border-radius: 8px; padding: 8px 10px; display: flex; flex-direction: column; gap: 4px; position: relative; }
  .${P}-mes { box-shadow: inset 4px 0 0 ${COUL_I7}; }
  .${P}-t { display: flex; align-items: center; gap: 6px; font-size: 14px; }
  .${P}-q { font-size: 12px; color: var(--gris); }
  .${P}-ax { position: relative; height: 16px; margin: 0 126px 0 104px; font-size: 12px; color: var(--gris); }
  .${P}-ax span { position: absolute; transform: translateX(-50%); }
  .${P}-r { display: grid; grid-template-columns: 100px 1fr 66px 52px; align-items: center; gap: 4px; min-height: 26px; }
  .${P}-n { display: flex; align-items: center; gap: 4px; font-size: 13px; color: var(--t); font-weight: 600; }
  .${P}-tr { position: relative; height: 14px; background: linear-gradient(90deg, #f1f2f5 33.3%, var(--f) 33.3%); border-radius: 2px; }
  .${P}-tr i { position: absolute; top: 0; bottom: 0; display: block; }
  .${P}-s1 { left: 33.3%; width: 2px; margin-left: -1px; background: var(--encre); }
  .${P}-bd { background: var(--b); border-radius: 2px; min-width: 6px; top: 2px !important; bottom: 2px !important; }
  .${P}-r b { font-size: 14px; color: var(--t); text-align: right; white-space: nowrap; } .${P}-r b small { font-size: 12px; }
  .${P}-r em { font-style: normal; font-size: 12px; color: var(--t); text-align: right; white-space: nowrap; letter-spacing: -.04em; }
  .${P}-n { font-size: 12px !important; }
  .${P}-voile { position: absolute; inset: 52px 6px 4px; background: rgba(255,255,255,.88); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; border-radius: 8px; box-shadow: inset 0 0 0 1.5px #8a909b; font-size: 14px; }
  .${P}-voile .w-inc { font-size: 14px; color: var(--encre); font-weight: 600; } .${P}-qq { font-size: 12px; color: var(--gris); }
  .${P}-rad { display: flex; align-items: center; gap: 6px; }
  .${P}-g { fill: none; stroke: #e3e5eb; }
  .${P}-zone { fill: #eef0f4; stroke: #c9cdd6; }
  .${P}-av { fill: none; stroke: var(--encre); stroke-width: 1.5; }
  .${P}-ap { fill: rgba(232,0,48,.16); stroke: ${COUL_I7}; stroke-width: 2; }
  .${P}-dl { display: flex; flex-direction: column; gap: 3px; font-size: 13px; }
  .${P}-dl span { display: flex; align-items: center; gap: 3px; color: var(--t); font-weight: 600; white-space: nowrap; }
  .${P}-dl span.hors { color: ${ACC}; }`;
  const js = `${JS_CLE}
const ORD = ${JSON.stringify(ORDRE)}, MOTF = ${JSON.stringify(S.MOTS_F)};
const pt = (k, r) => { const a = -Math.PI / 2 + k * 2 * Math.PI / 12; return (Math.cos(a) * 80 * r).toFixed(1) + ',' + (Math.sin(a) * 80 * r).toFixed(1); };
const r = (f, v) => Math.min(1.12, document.body.classList.contains('abs') ? v / 110 : v / BANDE[f] / 2);
function dessine(i) {
  const m = MO[i];
  document.querySelector('.${P}-zone').setAttribute('points', ORD.map((f, k) => pt(k, r(f, BANDE[f]))).join(' '));
  document.querySelector('.${P}-av').setAttribute('points', ORD.map((f, k) => pt(k, r(f, AV[f]))).join(' '));
  const ap = document.querySelector('.${P}-ap'), inc = document.querySelector('.${P}-inc');
  inc.innerHTML = '';
  if (!m.v) { ap.setAttribute('points', ''); } else ap.setAttribute('points', ORD.map((f, k) => pt(k, m.inc.includes(f) ? r(f, AV[f]) : r(f, m.v[f]))).join(' '));
  ORD.forEach((f, k) => { if (!m.v || m.inc.includes(f)) { const [x, y] = pt(k, 0.5).split(','); inc.insertAdjacentHTML('beforeend', '<circle cx="' + x + '" cy="' + y + '" r="4" fill="#fff" stroke="#8a909b" stroke-width="1.5"/>'); } });
  document.querySelector('.${P}-dl').innerHTML = !m.v ? '<span>? pas calculé</span>' : ORD.filter((f) => !m.inc.includes(f)).map((f) => ({ f, d: m.v[f] - AV[f] })).sort((a, b) => b.d - a.d).slice(0, 4)
    .map((x) => '<span data-famille="' + x.f + '" class="' + (m.v[x.f] > BANDE[x.f] ? 'hors' : '') + '"><svg class="pi" width="14" height="14" data-famille="' + x.f + '" role="img" aria-label="' + NOMF[x.f] + '"><use href="#p-' + x.f + '"/></svg>~+' + Math.round(x.d) + ' ' + MOTF[x.f] + '</span>').join('');
}
let cour = ${DEPART};
window.maj = (i) => { cour = i; document.querySelector('.${P}-voile').hidden = cleM(i) === 'actif'; document.querySelector('.${P}-sl').textContent = 'Idaho 7 · ' + MO[i].lib; dessine(i); };
document.querySelectorAll('.lentille [data-e]').forEach((b) => b.addEventListener('click', () => setTimeout(() => dessine(cour), 0)));
${C.JS_RAIL(P)}`;
  return { id: P, chaleur: 'tiède', resume: 'Idaho 7 mesuré une fois (E03) : ses composés face au seuil ; ailleurs l\'inconnu se voit ; radar simulé', corps, css, js, legende: `<div class="w-leg-s"><h3>Le seuil</h3><p>Barre : la mesure divisée par le seuil de perception (Feng 2015, E06) ; à droite du trait, on la sent. Radar : ta stout avant (trait noir) et avec Idaho 7 (rouge), zone grise : ta 16D ; rond creux : inconnu.</p></div>` };
};

// =====================================================================================================
// c6 · tiède · Le jury d'abord : ce que des dégustateurs ont noté, sur 15 ; Idaho 7 simulé ensuite.
// =====================================================================================================
concepts.c6 = () => {
  const P = 'c6';
  const x = (v) => v / 15 * 100;
  const ligne = (f, mot, a, b) => `<div class="${P}-r" data-famille="${f}"><span class="${P}-n">${f ? pic(f, 16) : ic('panel', 16)}${mot}</span><span class="${P}-tr">${[0, 5, 10, 15].map((t) => `<i class="${P}-g" style="left:${x(t)}%"></i>`).join('')}<i class="${P}-ar" style="left:${x(a.v)}%;width:${x(b.v) - x(a.v)}%"></i><i class="${P}-d0" style="left:${x(a.v)}%"></i><i class="${P}-d1" style="left:${x(b.v)}%"></i></span><b class="mono" data-nature="mesure" data-source="${esc(SRC('E04'))}">${fr(a.v)}→${fr(b.v)}</b></div>`;
  const puce = (k, h) => `<span class="${P}-pc" data-pv="${k}">${h}</span>`;
  const corps = `
  ${tete(P)}
  ${contexte(P)}
  <section class="${P}-bloc ${P}-jury" data-acquis="valeurs">
    <div class="${P}-t">${badge('panel')}<b>Le jury, sur 15</b><span class="${P}-q">Cascade 3,86 g/L, 24 h après fermentation · ${SRC('E04')}</span></div>
    <div class="${P}-k"><span><i class="${P}-d0 l"></i>sans houblon</span><span><i class="${P}-d1 l"></i>dry hop 24 h</span><span class="${P}-ton" data-pv="apres">${ic('cible', 14)}ton moment</span></div>
    ${ligne(null, 'intensité', V.ohai0, V.ohai)}${ligne('citrus', 'agrumes', V.agr0, V.agr)}${ligne('herbal', 'herbacé', V.herb0, V.herb)}
    <div class="${P}-pcs">${puce('chaud', `${pic('herbal', 14)}60′ : cuit, herbacé · ${SRC('E07')}`)}${puce('jours', `${ic('panel', 14)}1 h = 4 j · ${SRC('E10')}`)}${puce('actif', `${hach('en fermentation : pas de jury')}`)}</div>
  </section>
  <section class="${P}-bloc"><div class="${P}-t">${badge('simule')}<b class="${P}-sl"></b>${lentille(P)}</div>${barres(P)}<p class="${P}-ibu mono" data-nature="simule"></p></section>
  ${rail(P)}
  ${levure(P, 'pont')}`;
  const css = `${C.CSS_TETE(P)}${C.CSS_BARRES(P, 10)}${C.CSS_RAIL(P)}
  .${P}-bloc { background: #fff; border-radius: 8px; padding: 8px 10px; display: flex; flex-direction: column; gap: 5px; }
  .${P}-jury { box-shadow: inset 4px 0 0 #2f5f9e; }
  .${P}-t { display: flex; align-items: center; gap: 6px; font-size: 14px; flex-wrap: wrap; }
  .${P}-q { font-size: 12px; color: var(--gris); flex-basis: 100%; }
  .${P}-k { display: flex; gap: 10px; font-size: 12px; color: var(--gris); align-items: center; }
  .${P}-k span { display: inline-flex; align-items: center; gap: 4px; }
  .${P}-ton { color: #2f5f9e !important; font-weight: 700; }
  .${P}-r { display: grid; grid-template-columns: 92px 1fr 64px; align-items: center; gap: 6px; min-height: 28px; }
  .${P}-n { display: flex; align-items: center; gap: 4px; font-size: 14px; font-weight: 600; color: var(--t, var(--encre)); }
  .${P}-tr { position: relative; height: 18px; }
  .${P}-tr::before { content: ''; position: absolute; left: 0; right: 0; top: 8px; height: 2px; background: #e3e5eb; }
  .${P}-g { position: absolute; top: 4px; width: 1px; height: 10px; background: #c9cdd6; }
  .${P}-ar { position: absolute; top: 7px; height: 4px; background: var(--b, #2f5f9e); border-radius: 2px; }
  .${P}-d0, .${P}-d1 { position: absolute; top: 3px; width: 12px; height: 12px; margin-left: -6px; border-radius: 50%; }
  .${P}-d0 { background: #fff; box-shadow: inset 0 0 0 2px #6b6b75; } .${P}-d1 { background: var(--t, #2f5f9e); }
  .${P}-d0.l, .${P}-d1.l { position: relative; top: 0; margin: 0; display: inline-block; }
  .${P}-r b { font-size: 14px; text-align: right; }
  .${P}-pcs { display: flex; flex-wrap: wrap; gap: 4px; }
  .${P}-pc { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; padding: 2px 8px; border-radius: 999px; box-shadow: inset 0 0 0 1px #c9cad2; color: var(--gris); }
  .${P}-pc.on { color: var(--encre); box-shadow: inset 0 0 0 2px var(--encre); font-weight: 600; }
  .${P}-ibu { font-size: 12px; color: var(--gris); text-align: right; }`;
  const js = `${JS_CLE}
window.maj = (i) => {
  const m = MO[i], k = cleM(i);
  document.querySelectorAll('.${P}-pc').forEach((p) => p.classList.toggle('on', p.dataset.pv === k || (p.dataset.pv === 'jours' && m.seg === 3)));
  document.querySelector('.${P}-ton').style.visibility = m.id === 'dryPost|1' ? 'visible' : 'hidden';
  document.querySelector('.${P}-sl').textContent = 'Idaho 7 · ' + m.lib;
  majBarres(document.querySelector('.${P}-bars'), i);
  document.querySelector('.${P}-ibu').textContent = m.cru ? 'IBU à cru : non modélisé' : m.ibu == null ? 'IBU : ?' : 'IBU 60 → ~' + (60 + m.ibu);
};
${C.JS_RAIL(P)}`;
  return { id: P, chaleur: 'tiède', resume: 'le jury d\'abord : notes sur 15 sans houblon et après 24 h (E04), puces des autres jurys ; Idaho 7 simulé ensuite', corps, css, js, legende: `<div class="w-leg-s"><h3>Le jury</h3><p>Notes d’un jury entraîné de 0 à 15 : rond creux, la bière sans houblon ; plein, après 24 h de dry hop. « Ton moment » s’allume quand ton ajout est celui que le jury a goûté.</p></div>` };
};

// =====================================================================================================
// c7 · tiède · La table des preuves : quatre colonnes de moments, ce qu'on a mesuré et Idaho 7 simulé, alignés sur le rail.
// =====================================================================================================
concepts.c7 = () => {
  const P = 'c7';
  const SG = [[0, 34], [34, 52], [52, 76], [76, 100]];
  const col = (k, haut, bas) => `<div class="${P}-c" data-seg="${k}" style="left:${SG[k][0]}%;width:${SG[k][1] - SG[k][0]}%"><div class="${P}-m">${haut}</div><div class="${P}-s"><i class="${P}-bf" data-famille="floral"></i><i class="${P}-br" data-famille="resin"></i></div><span class="${P}-v mono" data-nature="simule"><span class="${P}-vf"></span><span class="${P}-vr"></span></span></div>`;
  const corps = `
  ${tete(P)}
  ${contexte(P)}
  <section class="${P}-tab" data-acquis="valeurs">
    <div class="${P}-lab"><span>${badge('mesure')}</span><span class="${P}-l2">${badge('simule')}ajout ${pic('floral', 14)}${pic('resin', 14)}</span></div>
    <div class="${P}-cols">
      ${col(0, `<span data-famille="herbal">${pic('herbal', 14)}<b data-nature="qualitatif" data-source="${esc(SRC('E07'))}">cuit</b></span><small>jury · E07</small>`)}
      ${col(1, `${hach('?')}<small>E09</small>`)}
      ${col(2, `<span data-famille="floral">${pic('floral', 14)}${mv(LIN, fr(LIN.v))}</span><small>µg/L · E03</small>`)}
      ${col(3, `<span>${ic('panel', 14)}${mv(V.ohai, fr(V.ohai0.v) + '→' + fr(V.ohai.v))}</span><small>jury · E04</small>`)}
    </div>
    <div class="${P}-foot">${lentille(P)}</div>
  </section>
  ${rail(P, { seg: SG })}
  <section class="${P}-det"><b class="${P}-sl"></b>${barres(P, ['floral', 'resin', 'green', 'tropical'])}<p class="${P}-src"></p></section>
  ${levure(P, 'etape')}`;
  const css = `${C.CSS_TETE(P)}${C.CSS_BARRES(P, 10)}${C.CSS_RAIL(P)}
  .${P}-tab { background: #fff; border-radius: 8px; padding: 8px 16px 6px; display: flex; flex-direction: column; gap: 4px; }
  .${P}-lab { display: flex; justify-content: space-between; font-size: 12px; }
  .${P}-l2 { display: inline-flex; align-items: center; gap: 3px; }
  .${P}-cols { position: relative; height: 172px; }
  .${P}-c { position: absolute; top: 0; bottom: 0; display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 4px 2px; border-radius: 8px; }
  .${P}-c.on { background: #eef0f4; box-shadow: inset 0 0 0 2px var(--encre); }
  .${P}-m { display: flex; flex-direction: column; align-items: center; gap: 1px; min-height: 44px; text-align: center; }
  .${P}-m span { display: inline-flex; align-items: center; gap: 3px; color: var(--t, var(--encre)); }
  .${P}-m b { font-size: 15px; color: var(--t, var(--encre)); } .${P}-m small { font-size: 12px; color: var(--gris); }
  .${P}-s { position: relative; width: 40px; height: 92px; border-bottom: 1px solid #c9cdd6; }
  .${P}-s i { position: absolute; bottom: 0; display: block; border-radius: 2px 2px 0 0; transition: height .2s; }
  .${P}-z { left: 0; right: 0; height: 50%; background: #eef0f4; border-top: 1.5px solid #9aa0ab; border-radius: 0 !important; }
  .${P}-bf { left: 6px; width: 12px; height: var(--hf, 0%); background: var(--b); }
  .${P}-br { right: 6px; width: 12px; height: var(--hr, 0%); background: var(--b); }
  .${P}-s { background: repeating-linear-gradient(0deg, transparent 0 22.5px, #eef0f4 22.5px 23.5px); }
  .${P}-v { display: flex; gap: 6px; font-size: 12px; } .${P}-vf { color: ${S.JET.floral.texte}; } .${P}-vr { color: ${S.JET.resin.texte}; }
  .${P}-foot { display: flex; justify-content: flex-end; }
  .${P}-det { background: #fff; border-radius: 8px; padding: 8px 10px; display: flex; flex-direction: column; gap: 4px; }
  .${P}-sl { font-size: 14px; } .${P}-src { font-size: 12px; color: var(--gris); }`;
  const js = `${JS_CLE}
const DEF = [MO.findIndex((m) => m.id === 'b10'), MO.findIndex((m) => m.id === 'wp'), MO.findIndex((m) => m.id === 'dryActive|3'), MO.findIndex((m) => m.id === 'dryPost|3')];
const AB = () => document.body.classList.contains('abs');
function colonne(c, i) {
  const m = MO[i], s = c.style, hf = (d) => Math.max(0, Math.min(100, d / 30 * 100)), hr = hf;
  if (!m.v) { s.setProperty('--hf', '0%'); s.setProperty('--hr', '0%'); c.querySelector('.${P}-vf').textContent = '?'; c.querySelector('.${P}-vr').textContent = '?'; return; }
  const df = m.v.floral - AV.floral, dr = m.v.resin - AV.resin;
  s.setProperty('--hf', hf(df) + '%'); s.setProperty('--hr', hr(dr) + '%');
  c.querySelector('.${P}-vf').textContent = '~+' + Math.round(df); c.querySelector('.${P}-vr').textContent = '~+' + Math.round(dr);
}
let cour = ${DEPART};
window.maj = (i) => {
  cour = i; const m = MO[i]; DEF[m.seg] = i;
  document.querySelectorAll('.${P}-c').forEach((c) => { const k = +c.dataset.seg; c.classList.toggle('on', k === m.seg); colonne(c, DEF[k]); });
  document.querySelector('.${P}-sl').textContent = '~ Idaho 7 · ' + m.lib;
  majBarres(document.querySelector('.${P}-bars'), i);
  document.querySelector('.${P}-src').textContent = { chaud: 'jury entraîné, Simcoe et Hallertau à 60′ · ${SRC('E07')}', tiede: 'whirlpool contre dry hop : figure seule, pas de chiffre · ${SRC('E09')}', actif: 'linalol d’Idaho 7 au pitch, S-04, à vérifier · ${SRC('E03')}', apres: 'intensité au jury, Cascade 24 h · ${SRC('E04')}' }[cleM(i)];
};
document.querySelectorAll('.lentille [data-e]').forEach((b) => b.addEventListener('click', () => setTimeout(() => window.maj(cour), 0)));
${C.JS_RAIL(P, [[0, 34], [34, 52], [52, 76], [76, 100]])}`;
  return { id: P, chaleur: 'tiède', resume: 'la table des preuves : une colonne par moment, la mesure en haut, Idaho 7 simulé (floral, résineux) en bas, alignée sur le rail', corps, css, js, legende: `<div class="w-leg-s"><h3>La table</h3><p>Une colonne par moment, au-dessus du rail. En haut : ce qu’une étude a mesuré. En bas : Idaho 7 simulé, floral à gauche, résineux à droite, face à la zone de ta 16D ; orangé : hors du style.</p></div>` };
};

// =====================================================================================================
// c8 · tiède · Face au témoin : chaque vraie bière, sans puis avec houblon ; puis ta stout, avant puis avec Idaho 7.
// =====================================================================================================
concepts.c8 = () => {
  const P = 'c8';
  const lx = (v) => (Math.log10(v) - 1) / (Math.log10(400) - 1) * 100; // 10 → 400 µg/L
  const [e2a, e2b] = [Math.min(...V.lin2.map((m) => m.v)), Math.max(...V.lin2.map((m) => m.v))];
  const [e1a, e1b] = String(V.lin1.valeur).split('-').map(Number);
  const halt = (k, f, mot, t0, a, b, txt, src, mom) => `<div class="${P}-r" data-pv="${mom}" data-famille="${f}"><span class="${P}-n">${pic(f, 14)}${mot}</span><span class="${P}-tr">${t0 == null ? `<i class="${P}-q" style="left:0;width:${lx(a)}%"></i>` : `<i class="${P}-ln" style="left:${lx(t0)}%;width:${lx(a) - lx(t0)}%"></i><i class="${P}-t0" style="left:${lx(t0)}%"></i>`}<i class="${P}-b1" style="left:${lx(a)}%;width:${Math.max(0, lx(b) - lx(a))}%"></i></span><b class="mono" data-nature="mesure" data-source="${esc(src)}">${txt}</b><small>${k}</small></div>`;
  const corps = `
  ${tete(P)}
  ${contexte(P)}
  <section class="${P}-bloc" data-acquis="valeurs">
    <div class="${P}-t">${badge('mesure')}<b>Sans houblon → avec</b><span class="${P}-u">µg/L</span></div>
    <div class="${P}-ax">${[10, 30, 100, 300].map((v) => `<span style="left:${lx(v)}%">${v}</span>`).join('')}</div>
    ${halt('5 tchèques, 30 j · E02', 'floral', 'linalol', V.linTem2.v, e2a, e2b, fr(V.linTem2.v, 0) + '→' + e2a + '–' + e2b, SRC('E02'), 'apres')}
    ${halt('Citra, moment non publié · E06', 'floral', 'linalol', V.linTem6.v, V.linCitra.v, V.linCitra.v, fr(V.linTem6.v, 0) + '→' + fr(V.linCitra.v, 0), SRC('E06'), 'dry')}
    ${halt('Citra, moment non publié · E06', 'resin', 'myrcène', V.myrTem6.v, V.myrCitra.v, V.myrCitra.v, fr(V.myrTem6.v, 0) + '→' + fr(V.myrCitra.v, 0), SRC('E06'), 'dry')}
    ${halt('Idaho 7 au pitch · E03', 'floral', 'linalol', null, LIN.v, LIN.v, '?→' + fr(LIN.v, 0), SRC('E03'), 'actif')}
    <p class="${P}-chaud" data-pv="chaud" hidden>${hach('à chaud : aucune bière mesurée')}</p>
  </section>
  <section class="${P}-bloc ${P}-x3">
    <div class="${P}-t">${badge('simule')}<b>Ta stout</b>${lentille(P)}</div>
    <nav class="${P}-ch" aria-label="Ma bière, puis Idaho 7, puis la levure"><span class="${P}-e">Ma bière</span><span class="${P}-fl">→</span><span class="${P}-e ${P}-mo"></span><span class="${P}-fl">→</span><a class="${P}-e ${P}-lev" href="../../../fils22-carte/levure-outil/etat.html">${ic('bio', 14)}levure ›</a></nav>
    ${barres(P, ['floral', 'resin'])}
  </section>
  ${rail(P)}`;
  const css = `${C.CSS_TETE(P)}${C.CSS_BARRES(P, 12)}${C.CSS_RAIL(P)}
  .${P}-bloc { background: #fff; border-radius: 8px; padding: 8px 10px; display: flex; flex-direction: column; gap: 4px; position: relative; }
  .${P}-t { display: flex; align-items: center; gap: 6px; font-size: 14px; } .${P}-u { font-size: 12px; color: var(--gris); margin-left: auto; }
  .${P}-ax { position: relative; height: 14px; margin-left: 82px; margin-right: 76px; font-size: 12px; color: var(--gris); }
  .${P}-ax span { position: absolute; transform: translateX(-50%); }
  .${P}-r { display: grid; grid-template-columns: 78px 1fr 72px; grid-template-rows: auto auto; column-gap: 4px; align-items: center; opacity: .5; }
  .${P}-r.on { opacity: 1; }
  .${P}-n { display: flex; align-items: center; gap: 3px; font-size: 13px; color: var(--t); font-weight: 600; }
  .${P}-tr { position: relative; height: 16px; }
  .${P}-tr i { position: absolute; display: block; }
  .${P}-ln { top: 7px; height: 2px; background: var(--b); }
  .${P}-q { top: 7px; height: 2px; background: repeating-linear-gradient(90deg, #8a909b 0 3px, transparent 3px 6px); }
  .${P}-t0 { top: 2px; width: 12px; height: 12px; margin-left: -6px; border-radius: 50%; background: #fff; box-shadow: inset 0 0 0 2px #6b6b75; }
  .${P}-b1 { top: 2px; height: 12px; min-width: 12px; margin-left: -6px; border-radius: 999px; background: var(--b); }
  .${P}-r b { font-size: 13px; text-align: right; color: var(--t); white-space: nowrap; }
  .${P}-r small { grid-column: 2 / -1; font-size: 12px; color: var(--gris); margin-top: -2px; }
  .${P}-chaud { position: absolute; inset: 50px 10px 8px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,.9); border-radius: 8px; box-shadow: inset 0 0 0 1.5px #8a909b; }
  .${P}-chaud .w-inc { font-size: 14px; color: var(--encre); font-weight: 600; }
  .${P}-ch { display: grid; grid-template-columns: 1fr 14px 1fr 14px 1fr; align-items: center; gap: 4px; font-size: 14px; font-weight: 700; }
  .${P}-e { display: inline-flex; align-items: center; justify-content: center; gap: 4px; min-height: 30px; padding: 0 6px; border-radius: 999px; background: #eef0f4; white-space: nowrap; }
  .${P}-mo { background: ${COUL_I7}; color: #fff; }
  .${P}-lev { background: #fff; box-shadow: inset 0 0 0 1.5px var(--encre); }
  .${P}-fl { color: var(--gris); text-align: center; }`;
  const js = `${JS_CLE}
window.maj = (i) => {
  const m = MO[i], k = cleM(i);
  document.querySelectorAll('.${P}-r').forEach((r) => r.classList.toggle('on', r.dataset.pv === k || (r.dataset.pv === 'dry' && (k === 'actif' || k === 'apres'))));
  document.querySelector('.${P}-chaud').hidden = k !== 'chaud' && k !== 'tiede';
  document.querySelector('.${P}-chaud .w-inc').lastChild.textContent = k === 'tiede' ? 'au whirlpool : aucune bière mesurée' : 'à chaud : aucune bière mesurée';
  document.querySelector('.${P}-mo').textContent = '+ Idaho 7 · ' + m.lib;
  majBarres(document.querySelector('.${P}-bars'), i);
};
${C.JS_RAIL(P)}`;
  return { id: P, chaleur: 'tiède', resume: 'face au témoin : vraies bières sans puis avec houblon (E02, E06, E03) ; ta stout, avant puis avec Idaho 7, puis la levure (x3b réduit)', corps, css, js, legende: `<div class="w-leg-s"><h3>Sans → avec</h3><p>Rond creux : la même bière sans houblon ; plein : avec. Pointillé : pas de bière témoin publiée. Les lignes du moment choisi s’allument.</p></div>` };
};

const ids = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(concepts);
for (const id of ids) {
  if (!concepts[id]) continue;
  const c = concepts[id]();
  ecrire(path.join(C.ICI, id, 'etat.html'), page(c));
}
