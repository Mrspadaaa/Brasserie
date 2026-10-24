// sbc1b · passe 2 de sbc1 (froide, le classement de u4), d'après le verdict du conseil rapide (conseil-sb/verdict.md).
// Repris de sbc1 : la liste classée à plages, les vraies valeurs en ligne, le face-à-face, ma stout simulée.
// Retouches : 80 mots au plus ; légende de u4 (« une composante inconnue ») ; « ~ » sur le score et sur la dose, plages
// hachurées (Altus ~79–99) et dose en plage quand l'α vient des fiches (Magnat ~37–54 g) ; stock et manque sur chaque
// ligne ; « Si tu achètes : … » ; « autres 83 % » de Nelson Sauvin dans les deux états ; au whirlpool, Nelson Sauvin en
// plage ~29–89 (arôme ouvert : 83 % de ses mots sans famille), jamais « 42 » sec ; « Annuler » à côté de « Remplacer »
// (D120) ; l'état whirlpool par la puce de contexte (un toucher, ?moment=wp pour les captures). La v0 (sbc1) n'est pas
// touchée : ce fichier importe son vocabulaire (sbc1/commun/socle-sbc.mjs) sans le modifier.
import * as B from '../sbc1/commun/socle-sbc.mjs';
const { esc, fr, g, ic, pic } = B;
const P = 'sbc1b';
const SC0 = 20, SC1 = 100; const x = (s) => ((Math.max(SC0, s) - SC0) / (SC1 - SC0)) * 100;
const ETATS = { b60: { m: B.M, lib: 'à 60′', top: ['Magnat', 'Yeoman', 'Altus', 'Trident', 'Zenia'], stock: ['Nelson Sauvin', 'Galaxy', 'Sabro'], achat: 'Magnat', defaut: 'Magnat' },
  wp: { m: B.MWP, lib: 'au whirlpool', top: ['Target', "Falconer's Flight", 'Idaho 7', 'Magnat'], stock: ['Sabro', 'Cascade', 'Galaxy', 'Nelson Sauvin'], achat: "Falconer's Flight", defaut: 'Target' } };
const NELSON_SANS = 0.83; // part des mots sans famille de Nelson Sauvin (10 sur 12, pack-fiches)

// Plage de score : une composante inconnue ouverte de 0 à 100 avec les poids du moment (u4). Au whirlpool, l'arôme de
// Nelson Sauvin (poids 0,6) se calcule sur 2 mots de fiche sur 12 : la page l'ouvre aussi, au lieu d'un « 42 » sec.
function plage(nom, k) {
  const m = ETATS[k].m, s = B.sub(nom, m), w = m.poids, c = { ...s.composantes };
  const ouvre = Object.keys(w).filter((q) => c[q] == null || (k === 'wp' && nom === 'Nelson Sauvin' && q === 'arome'));
  if (!ouvre.length) return { bas: s.score, haut: s.score, ouvre };
  const somme = (v) => Object.keys(w).reduce((t, q) => t + w[q] * (ouvre.includes(q) ? v : c[q]), 0);
  return { bas: Math.round(somme(0)), haut: Math.round(somme(100)), ouvre };
}
const alphaDe = (nom) => { const A = B.HOP[nom].alpha; return A.lot != null ? [A.lot, A.lot] : A.fiches; };
// IBU de 46 g du remplaçant, au même moment : linéaire en α (BrewingMath.hopIbu), IBU de Nugget × α / 13 (lot de Nugget).
const ibu46 = (nom, k) => { const [a, b] = alphaDe(nom), r = ETATS[k].m.reference.ibu, f = (v) => Math.round((r * v) / 13); return [f(a), f(b)]; };
const tx = (a, b) => (a === b ? String(a) : a + '–' + b);

function ligne(nom, k) {
  const m = ETATS[k].m, d = B.dose(nom, m), pl = plage(nom, k), st = B.HOP[nom].stock, [a0, a1] = alphaDe(nom), [i0, i1] = ibu46(nom, k);
  const dMin = Math.round(d.min), dMax = Math.round(d.max), dTxt = '~' + tx(dMin, dMax) + ' g';
  const manque = st >= d.max ? '' : st > 0 ? ' · −' + Math.round(d.max - st) : ' · −' + tx(dMin, dMax);
  const plageV = pl.bas !== pl.haut;
  const barre = plageV ? `<i class="${P}-pl" style="left:${x(pl.bas)}%;width:${x(pl.haut) - x(pl.bas)}%"></i>` : `<i class="${P}-pt" style="left:${x(pl.bas)}%;background:${B.COUL[nom]}"></i>`;
  const autres = nom === 'Nelson Sauvin' ? `<span class="${P}-au"><i data-role="autres" data-houblon="Nelson Sauvin" data-part="0.83" aria-label="autres ${Math.round(NELSON_SANS * 100)} %, mots sans famille"></i>autres ${Math.round(NELSON_SANS * 100)} %</span>` : '';
  const A = B.HOP[nom].alpha;
  return `<div class="${P}-l" data-role="ligne-houblon" data-choix="${esc(nom)}" data-etat="${k}" data-ibu46="${tx(i0, i1)}" data-dose="${tx(d.min, d.max)}" data-alpha="${tx(a0, a1)}" style="--h:${B.COUL[nom]}"><div class="${P}-in">
    <span class="${P}-nm" role="radio" aria-checked="false" tabindex="-1" aria-label="Houblon : ${esc(nom)}">${B.nomH(nom)}${B.stock(nom, d.max)}</span>
    <span class="${P}-sw"><span class="${P}-sc">${barre}</span><span class="${P}-num${plageV ? ' inc' : ''}">~${tx(pl.bas, pl.haut)}</span></span>
    <span class="${P}-al mono">${A.lot != null ? fr(A.lot) + (A.horsFiches ? '≠' : '') : fr(a0) + '–' + fr(a1)}</span><span class="${P}-ib mono">~${tx(i0, i1)}</span><span class="${P}-do">${dTxt}</span><span class="${P}-st">${autres}${st} g${manque}</span>
  </div></div>`;
}
function alphaRangs(nom) {
  const h = B.D.hops[nom], A = B.HOP[nom].alpha, lo = 4, hi = 19, X = (v) => ((v - lo) / (hi - lo)) * 100;
  const src = ((h.alpha && h.alpha.sources) || []).map((s) => `<i class="${P}-as" style="left:${X(s.min)}%;width:${X(s.max) - X(s.min)}%;background:${B.COUL[nom]}"></i>`).join('');
  const lot = A.lot != null ? `<i class="${P}-alot" style="left:${X(A.lot)}%"></i><b class="${P}-alt mono" style="left:${X(A.lot)}%">${fr(A.lot)}${A.horsFiches ? ' ≠' : ''}</b>` : '';
  return `<div class="${P}-ar"><span>${esc(nom)}</span><span class="${P}-ax">${src}${lot}</span><span class="mono">${A.fiches ? fr(A.fiches[0]) + '–' + fr(A.fiches[1]) : '?'}</span></div>`;
}
function face(nom, k) {
  const m = ETATS[k].m, d = B.dose(nom, m), s = B.sub(nom, m), pl = plage(nom, k);
  const perd = (s.perd || []).filter((v) => v.a === 0).map((v) => v.family), gagne = (s.gagne || []).filter((v) => v.de === 0).map((v) => v.family);
  const srcs = [...new Set(((B.D.hops[nom].alpha || {}).sources || []).concat((B.D.hops.Nugget.alpha || {}).sources || []).map((v) => B.srcCourt(v.source) + ' ' + String(v.annee).slice(2)))].join(' · ');
  const note = k === 'wp' && nom === 'Nelson Sauvin' ? `<p class="${P}-nt">arôme ? : 83 % de ses mots sans famille (vin blanc, groseille à maquereau, raisin) ; le moteur dit 21, la page l'ouvre de 0 à 100</p>` : pl.ouvre.length ? `<p class="${P}-nt">${pl.ouvre.map((q) => B.MOTS_COMP[q]).join(', ')} : aucune fiche, de 0 à 100</p>` : '';
  return `<div class="${P}-face" data-face="${esc(nom)}" data-etat="${k}" hidden>
    <div class="${P}-duo">
      <div class="${P}-c orig">${B.nomH('Nugget')}<span class="${P}-cg">46 g</span><span class="${P}-cs">${B.usage('Nugget')} · 0 g</span></div>
      <div class="${P}-c" style="--h:${B.COUL[nom]}">${B.nomH(nom)}<span class="${P}-cg">~${tx(Math.round(d.min), Math.round(d.max))} g</span><span class="${P}-cs">${B.usage(nom)} · ${d.min === d.max ? 'α du lot' : 'α des fiches'}</span></div>
    </div>
    ${note}
    <div class="${P}-alpha"><span class="${P}-k">α</span><div>${alphaRangs('Nugget')}${alphaRangs(nom)}<span class="${P}-src">${esc(srcs)}</span></div></div>
    <div class="${P}-fam"><span>ses fiches face à Nugget</span><span class="${P}-pf">perd ${perd.length ? perd.map((f) => pic(f, 16)).join('') : '<b>rien</b>'}</span><span class="${P}-pf">gagne ${gagne.length ? gagne.map((f) => pic(f, 16)).join('') : '<b>rien</b>'}</span></div>
  </div>`;
}
function liste(k) {
  const E = ETATS[k], m = E.m, best = E.stock.slice().sort((a, b) => plage(b, k).bas - plage(a, k).bas)[0];
  const rep = k === 'b60'
    ? `Si tu achètes : <b>${esc(E.achat)} ~${B.sub(E.achat, m).score}</b>. Ton stock : <b>Nelson Sauvin ~${B.sub('Nelson Sauvin', m).score}</b>.`
    : `<b>Target ~${B.sub('Target', m).score}</b>, mais ${B.HOP.Target.stock} g. Si tu achètes : <b>${esc(E.achat)} ~${B.sub(E.achat, m).score}</b>.`;
  return `<div class="${P}-etat" data-vue="${k}"${k === 'b60' ? '' : ' hidden'}>
    <p class="${P}-rep">${rep}</p>
    <div class="${P}-liste" role="radiogroup" aria-label="Remplaçant" data-libre="houblon">
      <div class="${P}-hd" aria-hidden="true"><span>α</span><span>IBU si 46 g</span><span>dose</span><span>stock</span></div>
      ${E.top.map((n) => ligne(n, k)).join('')}
      <div class="${P}-sep">${ic('stock', 14)}ton stock</div>
      ${E.stock.map((n) => ligne(n, k)).join('')}
    </div>
  </div>`;
}
export function rendre() {
  const tous = (k) => [...ETATS[k].top, ...ETATS[k].stock];
  const corps = `
  <header class="${P}-tete">${B.croix()}<h1>Lequel à la place de Nugget ?</h1>${B.legB()}</header>
  <p class="${P}-ctx" data-role="contexte"><span class="${P}-cx" data-contexte="dose">${B.nomH('Nugget')}<span>α 13 % · dose 46 g</span></span><span class="${P}-cx ${P}-mo" data-contexte="moment" tabindex="0" aria-label="Moment de Nugget : à 60′ ; un toucher montre le whirlpool" data-bascule><span data-moment-txt>à 60′</span>${ic('chevb', 12)}</span><span class="${P}-cx" data-contexte="base">Stout 16D</span></p>
  ${liste('b60')}${liste('wp')}
  <p class="${P}-leg"><span><i class="${P}-pt0"></i>tout connu</span><span><i class="${P}-pl0"></i>plage, une composante inconnue</span></p>
  <section class="${P}-ff">
    ${tous('b60').map((n) => face(n, 'b60')).join('')}${tous('wp').map((n) => face(n, 'wp')).join('')}
    <div class="${P}-mb"><div class="${P}-mbt"><b>Ma stout après</b><span class="${P}-k">~ simulé</span>${B.lentille()}</div>${B.barres(P, 'Magnat', { familles: ['floral', 'herbal', 'earthy', 'citrus', 'tropical', 'resin', 'spice', 'stoneFruit'] })}<p class="${P}-k" data-sansbiere hidden>~ non simulé ici pour ce houblon : hachuré, pas zéro</p></div>
  </section>
  <footer class="${P}-pied"><span class="${P}-recap">Nugget 46 g → <b data-recap></b></span><span class="${P}-bt"><a class="${P}-an" href="#" data-role="annuler">Annuler</a><a class="sbc-act" href="#" data-role="remplacer">Remplacer ›</a></span></footer>`;
  const css = `
  .${P}-tete { display: flex; align-items: center; gap: 4px; } .${P}-tete h1 { flex: 1; font-size: 17px; font-weight: 700; }
  .${P}-ctx { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; font-size: 13px; }
  .${P}-cx { display: inline-flex; align-items: center; gap: 4px; min-height: 28px; padding: 0 8px; border-radius: 999px; background: #e3e3ea; white-space: nowrap; }
  .${P}-mo { background: #16161a; color: #fff; font-weight: 600; cursor: pointer; min-height: 32px; }
  .${P}-rep { font-size: 14px; line-height: 1.3; border-left: 3px solid #16161a; padding-left: 9px; } .${P}-rep b { font-weight: 700; }
  .${P}-liste { display: flex; flex-direction: column; }
  .${P}-in, .${P}-hd { display: grid; grid-template-columns: 50px 52px 74px 1fr; column-gap: 6px; align-items: center; }
  .${P}-hd { font-size: 12px; color: #5b5b66; padding: 0 4px 2px; } .${P}-hd span:nth-child(n+2) { text-align: right; } .${P}-hd span:first-child { grid-column: 1; }
  .${P}-in { grid-template-rows: 24px 18px; } .${P}-l { min-height: 46px; padding: 2px 4px; border-radius: 4px; cursor: pointer; border-bottom: 1px solid #ececf1; }
  .${P}-l.on { background: #ececf1; box-shadow: inset 3px 0 0 var(--h); }
  .${P}-nm { grid-column: 1 / 4; display: flex; align-items: center; gap: 4px; font-size: 14px; min-width: 0; white-space: nowrap; }
  .${P}-sw { grid-column: 4; display: flex; align-items: center; gap: 4px; } .${P}-sc { flex: 1; position: relative; height: 18px; background: linear-gradient(90deg, #f3f3f6 0 ${x(65)}%, #e9e9ee ${x(65)}% ${x(80)}%, #dcdce4 ${x(80)}% 100%); border-radius: 2px; }
  .${P}-num { flex: none; min-width: 30px; text-align: right; font: 600 14px var(--mono); white-space: nowrap; } .${P}-num.inc { color: #3a3a40; font-size: 13px; }
  .${P}-pt { position: absolute; top: 4px; width: 10px; height: 10px; margin-left: -5px; border-radius: 50%; }
  .${P}-pl { position: absolute; top: 5px; height: 8px; background: repeating-linear-gradient(135deg, #6b6b78 0 2px, transparent 2px 5px); border-radius: 2px; }
  .${P}-al, .${P}-ib, .${P}-do, .${P}-st { grid-row: 2; font-size: 12px; text-align: right; white-space: nowrap; color: #3a3a40; }
  .${P}-al { grid-column: 1; text-align: left; } .${P}-ib { grid-column: 2; } .${P}-do { grid-column: 3; font-weight: 600; color: #16161a; } .${P}-st { grid-column: 4; }
  .${P}-au { display: inline-flex; align-items: center; gap: 3px; font-size: 12px; color: #3a3a40; margin-right: 8px; }
  .${P}-au i { display: inline-block; width: 26px; height: 7px; border-radius: 2px; background: #8a8a92; }
  .${P}-sep { display: flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; color: #5b5b66; padding: 4px 4px 0; }
  .${P}-leg { display: flex; gap: 12px; font-size: 12px; color: #5b5b66; } .${P}-leg span { display: inline-flex; align-items: center; gap: 4px; }
  .${P}-pt0 { width: 9px; height: 9px; border-radius: 50%; background: #5b5b66; display: inline-block; }
  .${P}-pl0 { width: 18px; height: 8px; background: repeating-linear-gradient(135deg, #6b6b78 0 2px, transparent 2px 5px); display: inline-block; }
  .ecran { padding-bottom: 104px; }
  .${P}-ff { display: flex; flex-direction: column; gap: 8px; border-top: 1px solid #e3e3ea; padding-top: 8px; }
  .${P}-face { display: flex; flex-direction: column; gap: 6px; }
  .${P}-duo { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .${P}-c { display: flex; flex-direction: column; gap: 2px; padding: 7px 9px; border-radius: 8px; background: #e8e8ed; box-shadow: inset 3px 0 0 var(--h, #3a3a40); font-size: 13px; }
  .${P}-c.orig { background: #fff; box-shadow: inset 0 0 0 1.5px #3a3a40; }
  .${P}-cg { font-size: 20px; font-weight: 700; } .${P}-cs { font-size: 12px; color: #5b5b66; }
  .${P}-nt { font-size: 12px; color: #3a3a40; background: #f5f5f5; border-radius: 4px; padding: 4px 8px; }
  .${P}-alpha { display: grid; grid-template-columns: 16px 1fr; gap: 6px; } .${P}-k { font-size: 12px; color: #5b5b66; } .${P}-alpha > .${P}-k { font: 700 16px var(--sans); color: #16161a; }
  .${P}-ar { display: grid; grid-template-columns: 96px 1fr 48px; align-items: center; gap: 6px; height: 26px; font-size: 13px; } .${P}-ar > span:last-child { font-size: 12px; text-align: right; color: #5b5b66; }
  .${P}-ax { position: relative; height: 22px; background: linear-gradient(#ececf1, #ececf1) center / 100% 6px no-repeat; }
  .${P}-as { position: absolute; height: 4px; top: 9px; border-radius: 2px; } .${P}-as + .${P}-as { top: 14px; }
  .${P}-alot { position: absolute; top: 3px; width: 2px; height: 16px; margin-left: -1px; background: #16161a; }
  .${P}-alt { position: absolute; top: -6px; transform: translateX(4px); font-size: 12px; }
  .${P}-src { display: block; font-size: 12px; color: #5b5b66; }
  .${P}-fam { display: flex; align-items: center; flex-wrap: wrap; gap: 4px 12px; font-size: 13px; } .${P}-fam > span:first-child { font-size: 12px; color: #5b5b66; }
  .${P}-pf { display: inline-flex; align-items: center; gap: 2px; }
  .${P}-mbt { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; font-size: 14px; } .${P}-mbt .sbc-lent { margin-left: auto; }
  .${P}-pied { position: fixed; left: 0; right: 0; bottom: 0; z-index: 20; max-width: 390px; margin: 0 auto; padding-left: 12px !important; padding-right: 12px !important; background: #fff; display: flex; flex-direction: column; gap: 4px; padding: 6px 0 4px; border-top: 1px solid #e3e3ea; }
  .${P}-recap { font-size: 13px; } .${P}-bt { display: grid; grid-template-columns: 1fr 2fr; gap: 8px; }
  .${P}-an { display: flex; align-items: center; justify-content: center; height: 44px; border-radius: 999px; box-shadow: inset 0 0 0 1.5px #16161a; font-weight: 600; font-size: 15px; }`;
  const js = `
var ETAT = 'b60';
window.choisir = function (nom) {
  document.querySelectorAll('.${P}-l').forEach(function (l) { var on = l.dataset.choix === nom && l.dataset.etat === ETAT; l.classList.toggle('on', on); l.querySelector('[role="radio"]').setAttribute('aria-checked', String(on)); });
  document.querySelectorAll('[data-face]').forEach(function (f) { f.hidden = !(f.dataset.face === nom && f.dataset.etat === ETAT); });
  var r = document.querySelector('.${P}-mb [data-biere]'); r.dataset.m = ETAT === 'wp' ? 'wp' : 'b60';
  var ok = !!SBC.biere[r.dataset.m].apres[nom];
  document.querySelector('[data-sansbiere]').hidden = ok;
  if (ok) SBC.majBiere(r, nom); else r.querySelectorAll('[data-f]').forEach(function (b) { b.classList.add('inc'); b.querySelector('.sbc-hc').hidden = false; b.querySelector('.sbc-re').hidden = true; b.querySelector('.sbc-bav').textContent = '?'; });
  document.querySelector('[data-recap]').textContent = nom + ' ' + SBC1B.dose[ETAT][nom];
};
function poserMoment(k) {
  ETAT = k;
  document.querySelectorAll('[data-vue]').forEach(function (v) { v.hidden = v.dataset.vue !== k; });
  var c = document.querySelector('[data-bascule]'); c.querySelector('[data-moment-txt]').textContent = k === 'wp' ? 'au whirlpool' : 'à 60′';
  c.setAttribute('aria-label', 'Moment de Nugget : ' + (k === 'wp' ? 'au whirlpool' : 'à 60′') + ' ; un toucher change de moment');
  window.choisir(SBC1B.defaut[k]);
}
document.querySelector('[data-bascule]').addEventListener('click', function () { poserMoment(ETAT === 'wp' ? 'b60' : 'wp'); });
document.querySelectorAll('[data-role="annuler"],[data-role="remplacer"]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); }); });
(function () {
  document.addEventListener('click', function (e) { var c = e.target.closest('[data-choix]'); if (c && !e.defaultPrevented) window.choisir(c.dataset.choix); });
  var q = new URLSearchParams(location.search);
  poserMoment(q.get('moment') === 'wp' ? 'wp' : 'b60');
  if (q.get('choix')) window.choisir(q.get('choix'));
})();`;
  const dose = (k) => Object.fromEntries([...ETATS[k].top, ...ETATS[k].stock].map((n) => { const d = B.dose(n, ETATS[k].m); return [n, '~' + tx(Math.round(d.min), Math.round(d.max)) + ' g']; }));
  const SBC1B = { dose: { b60: dose('b60'), wp: dose('wp') }, defaut: { b60: ETATS.b60.defaut, wp: ETATS.wp.defaut } };
  return B.page({ id: P, chaleur: 'froide', idee: 'passe 2 de sbc1 : le classement de u4 à 60′ et au whirlpool', corps, css, js: 'const SBC1B = ' + JSON.stringify(SBC1B) + ';' + js });
}
// Pour la NOTE : chaque nombre affiché, recompté depuis le moteur.
export function recompte() {
  const out = [];
  for (const k of ['b60', 'wp']) for (const n of [...ETATS[k].top, ...ETATS[k].stock]) {
    const m = ETATS[k].m, s = B.sub(n, m), d = B.dose(n, m), pl = plage(n, k), [i0, i1] = ibu46(n, k), [a0, a1] = alphaDe(n);
    out.push({ etat: k, nom: n, rang: s.rang, score: s.score, plage: tx(pl.bas, pl.haut), composantes: s.composantes, alpha: tx(a0, a1), ibu46: tx(i0, i1), dose: tx(d.min, d.max), stock: B.HOP[n].stock, controle: Math.round((i0 * d.max) / 46 * 10) / 10 + (i1 !== i0 ? ' / ' + Math.round((i1 * d.min) / 46 * 10) / 10 : '') });
  }
  return out;
}
