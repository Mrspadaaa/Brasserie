// sbc5 · tiède · les sources d'abord : le tableau des preuves. Chaque score se lit avec ce qui le porte : sept vraies
// valeurs par remplaçant, chacune face à la plage de Nugget (plein : recouvre ; demi : proche ; creux : écart ; hachuré :
// aucune fiche), le nombre de fiches lues, puis le score et sa fiabilité. Toucher une ligne ouvre ses chiffres sourcés.
import * as B from '../sbc1/commun/socle-sbc.mjs';
const { esc, fr, ic, pic } = B;
const P = 'sbc5';
const COLS = [['alpha', 'α', null], ['beta', 'β', null], ['huile', 'huile', null], ['myrcene', 'myr', 'resin'], ['humulene', 'hum', 'herbal'], ['caryophyllene', 'car', 'spice'], ['linalool', 'lin', 'floral']];
const nbFiches = (nom) => ((B.D.hops[nom].aromes || [])[0] || {}).of || 0;

function cellule(nom, q) {
  const f = B.face(nom, q), p = B.plage(nom, q);
  const t = { rec: 'recouvre', pro: 'proche, ' + f.mot, eca: f.mot, inc: 'aucune fiche' }[f.k];
  return `<span class="${P}-ce ${f.k}" aria-label="${B.MOTS_VAL[q]} : ${p ? B.plageTxt(p.min, p.max) + B.UNITE[q] : 'inconnu'}, ${t}"><i></i>${p && p.n > 1 ? '<sup>' + p.n + '</sup>' : ''}</span>`;
}
function ligne(nom) {
  const s = B.sub(nom), pl = B.plageScore(nom);
  return `<div class="${P}-l" data-role="ligne-houblon" data-choix="${esc(nom)}" aria-pressed="false" style="--h:${B.COUL[nom]}">
    <span class="${P}-nm">${B.nomH(nom)}${B.stock(nom, B.dose(nom).g)}</span>
    ${COLS.map(([q]) => cellule(nom, q)).join('')}
    <span class="${P}-f mono">${nbFiches(nom)}</span>
    <span class="${P}-s"><b class="mono">${pl.inc.length ? pl.bas + '–' + pl.haut : s.score}</b><small>${s.couverture.fiabilite}</small></span></div>`;
}
function preuves(nom) {
  const d = B.dose(nom), s = B.sub(nom);
  const lignes = COLS.map(([q, lab, f]) => {
    const p = B.plage(nom, q), n = B.plage('Nugget', q), fc = B.face(nom, q);
    return `<li class="${fc.k}"><span class="${P}-pk">${f ? pic(f, 14) : ''}${B.MOTS_VAL[q]}</span><span class="mono">${p ? B.plageTxt(p.min, p.max) : '?'}</span><span class="${P}-pn mono">${n ? B.plageTxt(n.min, n.max) : '?'}</span><span class="${P}-ps">${p ? esc(p.src) : 'aucune fiche'}</span></li>`;
  }).join('');
  return `<div class="${P}-pr" data-pr="${esc(nom)}" hidden style="--h:${B.COUL[nom]}">
    <p class="${P}-pt">${B.nomH(nom)}${B.alpha(nom, { plage: true })}${B.usage(nom)}<b class="${P}-pd">${d.txt}</b></p>
    <ul class="${P}-pl"><li class="${P}-ph"><span></span><span>${esc(nom.split(' ')[0])}</span><span>Nugget</span><span>source</span></li>${lignes}</ul>
    <p class="${P}-pf">${(s.couverture.huiles || []).length ? 'huiles comparées : ' + s.couverture.huiles.length + ' sur 4' : 'huiles : aucune comparable'} · farnésène non importé · ${nbFiches(nom)} fiche${nbFiches(nom) > 1 ? 's' : ''} d'arômes</p>
  </div>`;
}
export function rendre() {
  const ordre = ['Magnat', 'Yeoman', 'Altus', 'Trident', 'Zenia', 'Sabro', 'Nelson Sauvin', 'Galaxy', 'Idaho 7'];
  const N = (q) => { const p = B.plage('Nugget', q); return p ? '<b>' + fr(p.min) + '</b><b>' + fr(p.max) + '</b>' : '?'; };
  const corps = `
  <header class="${P}-tete">${B.croix()}<h1>Lequel à la place de Nugget ?</h1>${B.legB()}</header>
  <div class="${P}-tab" data-libre="houblon">
    <div class="${P}-l ${P}-hd" aria-hidden="true"><span>face à</span>${COLS.map(([q, lab, f]) => `<span class="${P}-hc">${f ? pic(f, 14) : ''}<b>${lab}</b></span>`).join('')}<span class="${P}-hc" aria-label="fiches lues">${ic('livre', 14)}</span><span class="${P}-hc"><b>score</b></span></div>
    <div class="${P}-l ${P}-ref"><span class="${P}-nm">${B.nomH('Nugget')}</span>${COLS.map(([q]) => `<span class="${P}-rv mono">${N(q)}</span>`).join('')}<span class="${P}-f mono">${nbFiches('Nugget')}</span><span class="${P}-s"><small>46 g</small><small>60′</small></span></div>
    ${ordre.map(ligne).join('')}
  </div>
  <p class="${P}-leg"><span class="${P}-ce rec"><i></i></span>recouvre <span class="${P}-ce pro"><i></i></span>proche <span class="${P}-ce eca"><i></i></span>écart <span class="${P}-ce inc"><i></i></span>aucune fiche · <sup>2</sup> deux sources</p>
  ${ordre.map(preuves).join('')}
  <div class="${P}-mb"><div class="${P}-mbt"><b>Ma stout après</b><span class="${P}-k">~ simulé, 60′</span>${B.lentille()}</div>${B.barres(P, 'Magnat', { familles: ['floral', 'herbal', 'citrus', 'resin', 'spice', 'stoneFruit'] })}</div>
  <footer class="${P}-pied"><a class="sbc-act" href="#" data-role="remplacer">Remplacer ›</a></footer>`;
  const css = `
  .${P}-tete { display: flex; align-items: center; gap: 4px; } .${P}-tete h1 { flex: 1; font-size: 17px; font-weight: 700; }
  .${P}-tab { display: flex; flex-direction: column; }
  .${P}-l { display: grid; grid-template-columns: 102px repeat(7, 1fr) 16px 48px; align-items: center; gap: 2px; min-height: 36px; border-radius: 4px; cursor: pointer; }
  .${P}-l[aria-pressed="true"] { background: #ececf1; box-shadow: inset 3px 0 0 var(--h); }
  .${P}-hd { min-height: 34px; font-size: 12px; color: #5b5b66; cursor: default; align-items: end; padding-bottom: 2px; }
  .${P}-hc { display: flex; flex-direction: column; align-items: center; gap: 1px; } .${P}-hc b { font-weight: 600; color: #16161a; }
  .${P}-ref { cursor: default; background: #fff; box-shadow: inset 0 0 0 1.5px #3a3a40; border-radius: 8px; min-height: 40px; margin-bottom: 2px; }
  .${P}-rv { display: flex; flex-direction: column; align-items: center; font-size: 12px; line-height: 1.1; letter-spacing: -.04em; } .${P}-rv b { font-weight: 500; } .${P}-rv b + b::before { content: '–'; color: #8a8a96; margin-right: 1px; }
  .${P}-nm { display: flex; align-items: center; gap: 3px; font-size: 13px; padding-left: 4px; min-width: 0; } .${P}-nm .hn { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .${P}-ce { position: relative; display: flex; justify-content: center; }
  .${P}-ce i { width: 16px; height: 16px; border-radius: 50%; display: block; border: 2px solid #3a3a40; }
  .${P}-ce.rec i { background: var(--h, #3a3a40); border-color: var(--h, #3a3a40); }
  .${P}-ce.pro i { background: linear-gradient(90deg, var(--h, #3a3a40) 50%, #fff 50%); border-color: var(--h, #3a3a40); }
  .${P}-ce.eca i { background: #fff; border-color: var(--h, #3a3a40); }
  .${P}-ce.inc i { border: 0; border-radius: 4px; background: repeating-linear-gradient(135deg, #a4a4b0 0 2px, transparent 2px 5px); }
  .${P}-ce sup { position: absolute; right: 0; top: -5px; font: 600 12px var(--mono); color: #5b5b66; }
  .${P}-f { font-size: 13px; text-align: center; }
  .${P}-s { display: flex; flex-direction: column; align-items: flex-end; line-height: 1.05; padding-right: 2px; } .${P}-s b { font-size: 14px; white-space: nowrap; letter-spacing: -.04em; } .${P}-s small { font-size: 12px; color: #5b5b66; }
  .${P}-leg { display: flex; align-items: center; flex-wrap: wrap; gap: 4px 6px; font-size: 12px; color: #5b5b66; --h: #5b5b66; } .${P}-leg .${P}-ce i { width: 13px; height: 13px; }
  .${P}-pr { display: flex; flex-direction: column; gap: 4px; padding: 8px 10px; border-radius: 8px; background: #f5f5f5; border-left: 4px solid var(--h); }
  .${P}-pt { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; font-size: 14px; } .${P}-pd { margin-left: auto; font-size: 20px; }
  .${P}-pl { list-style: none; display: flex; flex-direction: column; gap: 1px; }
  .${P}-pl li { display: grid; grid-template-columns: 104px 64px 64px 1fr; gap: 4px; align-items: center; font-size: 13px; min-height: 20px; }
  .${P}-pl li.eca > .mono:nth-child(2) { font-weight: 700; }
  .${P}-ph { font-size: 12px !important; color: #5b5b66; }
  .${P}-pk { display: flex; align-items: center; gap: 3px; } .${P}-pn { color: #5b5b66; } .${P}-ps { font-size: 12px; color: #5b5b66; }
  .${P}-pf { font-size: 12px; color: #5b5b66; }
  .${P}-mb { border-top: 1px solid #e3e3ea; padding-top: 6px; }
  .${P}-mbt { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; font-size: 14px; } .${P}-mbt .sbc-lent { margin-left: auto; } .${P}-k { font-size: 12px; color: #5b5b66; }
  .${P}-pied { position: sticky; bottom: 0; background: #fff; padding: 8px 0 2px; } .${P}-pied .sbc-act { width: 100%; }`;
  const js = `
window.choisir = function (nom) {
  document.querySelectorAll('.${P}-l[data-choix]').forEach(function (l) { l.setAttribute('aria-pressed', String(l.dataset.choix === nom)); });
  document.querySelectorAll('[data-pr]').forEach(function (d) { d.hidden = d.dataset.pr !== nom; });
  SBC.majBiere(document.querySelector('.${P}-mb [data-biere]'), nom);
};
${B.JS_CHOIX('Magnat')}`;
  return B.page({ id: P, chaleur: 'tiède', idee: 'le tableau des preuves : sept vraies valeurs face à Nugget, les fiches lues, puis le score', corps, css, js });
}
