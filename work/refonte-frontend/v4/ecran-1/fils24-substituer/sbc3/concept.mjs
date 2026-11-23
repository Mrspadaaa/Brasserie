// sbc3 · tiède · l'α d'abord : la règle α. À 60′, c'est l'α qui fait la dose et l'amertume. Chaque remplaçant sur une
// même règle de 6 à 20 % : un trait par fiche (Beer Maverick, Hopsteiner), le lot en stock en repère plein ; la colonne
// de Nugget (13 % du lot, fiches 9,5–16) traverse toute la liste ; à droite, les grammes au même IBU qui en découlent.
import * as B from '../sbc1/commun/socle-sbc.mjs';
const { esc, fr, ic, pic } = B;
const P = 'sbc3';
const LO = 6, HI = 20, X = (v) => ((v - LO) / (HI - LO)) * 100;

function regle(nom, ref = false) {
  const h = B.D.hops[nom], A = B.HOP[nom].alpha, src = (h.alpha && h.alpha.sources) || [];
  const traits = src.map((s, i) => `<i class="${P}-t s${i}" style="left:${X(s.min)}%;width:${X(s.max) - X(s.min)}%;background:${B.COUL[nom]}"></i>`).join('');
  const lot = A.lot != null ? `<i class="${P}-lot${A.horsFiches ? ' hors' : ''}" style="left:${X(A.lot)}%;border-color:${B.COUL[nom]}"></i>` : '';
  const d = ref ? { txt: '46 g' } : B.dose(nom), s = ref ? null : B.sub(nom);
  const aTxt = A.lot != null ? `<b>${fr(A.lot)}</b>${A.horsFiches ? '<span class="' + P + '-ne">≠</span>' : ''}` : `<span class="${P}-mi">${fr(A.fiches[0])}–${fr(A.fiches[1])}</span>`;
  return `<div class="${P}-l${ref ? ' ref' : ''}" ${ref ? '' : `data-role="ligne-houblon" data-choix="${esc(nom)}" aria-pressed="false"`} style="--h:${B.COUL[nom]}">
    <span class="${P}-nm">${B.nomH(nom)}${B.stock(nom, ref ? 46 : d.g)}</span>
    <span class="${P}-ax">${traits}${lot}</span>
    <span class="${P}-a mono">${aTxt}</span>
    <span class="${P}-g">${d.txt}</span>
    ${s ? `<span class="${P}-s mono">${s.score}</span>` : '<span class="' + P + '-s"></span>'}</div>`;
}
function detail(nom) {
  const A = B.HOP[nom].alpha, h = B.D.hops[nom], d = B.dose(nom), be = B.plage(nom, 'beta'), s = B.sub(nom);
  const fiches = ((h.alpha && h.alpha.sources) || []).map((x) => fr(x.min) + '–' + fr(x.max) + ' % ' + B.srcCourt(x.source) + ' ' + x.annee).join(' ; ');
  const pos = A.lot == null ? 'pas de lot : le milieu des fiches fait la dose' : A.horsFiches ? (A.lot < A.fiches[0] ? 'sous ses fiches' : 'au-dessus de ses fiches') : 'dans ses fiches';
  return `<div class="${P}-det" data-det="${esc(nom)}" hidden style="--h:${B.COUL[nom]}">
    <p class="${P}-dt">${B.nomH(nom)} ${B.usage(nom)}<span class="${P}-big">${A.lot != null ? 'α ' + fr(A.lot) + ' %' : 'α ~' + fr((A.fiches[0] + A.fiches[1]) / 2) + ' %'}</span><span class="${P}-eq">→</span><span class="${P}-big">${d.txt}</span></p>
    <p class="${P}-dl">${pos} · fiches ${esc(fiches)}${be ? ' · β ' + B.plageTxt(be.min, be.max) + ' %' : ''}${d.plage ? ' · dose ' + d.plage + ' selon les fiches' : ''}${s.deconseille ? ' · ' + esc(s.deconseille.replace(/ \(.*\)/, '')) : ''}</p>
  </div>`;
}
export function rendre() {
  const ordre = ['Magnat', 'Yeoman', 'Altus', 'Trident', 'Zenia', 'Sabro', 'Nelson Sauvin', 'Galaxy', 'Idaho 7'];
  const ticks = [8, 10, 12, 14, 16, 18].map((v) => `<i style="left:${X(v)}%">${v}</i>`).join('');
  const A0 = B.HOP.Nugget.alpha;
  const corps = `
  <header class="${P}-tete">${B.croix()}<div><h1>Lequel à la place de Nugget ?</h1><p class="${P}-sous">à 60′, l'α fait l'amertume et la dose</p></div>${B.legB()}</header>
  <div class="${P}-regle" data-libre="houblon" style="--x0:${X(A0.fiches[0])}%;--x1:${X(A0.fiches[1])}%;--xl:${X(A0.lot)}%">
    <div class="${P}-l ${P}-hd" aria-hidden="true"><span>α en %</span><span class="${P}-ax ${P}-tk">${ticks}</span><span>lot</span><span>même IBU</span><span></span></div>
    ${regle('Nugget', true)}
    ${ordre.map((n) => regle(n)).join('')}
    <div class="${P}-col" aria-hidden="true"></div>
  </div>
  <p class="${P}-leg"><i class="${P}-lt"></i>une fiche <i class="${P}-ll"></i>le lot en stock <i class="${P}-lc"></i>Nugget : fiches 9,5–16, lot 13 %</p>
  ${ordre.map(detail).join('')}
  <div class="${P}-mb"><div class="${P}-mbt"><b>Ma stout avec <span data-nm>Nelson Sauvin</span></b><span class="${P}-k">~ simulé</span>${B.lentille()}</div>${B.barres(P, 'Nelson Sauvin', { familles: ['floral', 'herbal', 'citrus', 'tropical', 'resin', 'spice'] })}</div>
  <footer class="${P}-pied"><a class="sbc-act" href="#" data-role="remplacer">Remplacer ›</a></footer>`;
  const css = `
  .${P}-tete { display: flex; align-items: flex-start; gap: 4px; } .${P}-tete > div { flex: 1; padding-top: 8px; } .${P}-tete h1 { font-size: 17px; font-weight: 700; }
  .${P}-tete .leg-b { margin-top: 8px; }
  .${P}-sous { font-size: 13px; color: #5b5b66; }
  .${P}-regle { position: relative; display: flex; flex-direction: column; }
  .${P}-l { display: grid; grid-template-columns: 112px 1fr 46px 46px 20px; align-items: center; gap: 5px; min-height: 34px; position: relative; z-index: 1; border-radius: 4px; cursor: pointer; }
  .${P}-l[aria-pressed="true"] { background: rgba(236,236,241,.8); box-shadow: inset 3px 0 0 var(--h); }
  .${P}-l.ref { cursor: default; border-bottom: 1px solid #d4d4dc; }
  .${P}-hd { min-height: 22px; font-size: 12px; color: #5b5b66; cursor: default; }
  .${P}-nm { display: flex; align-items: center; gap: 3px; font-size: 13px; min-width: 0; padding-left: 3px; } .${P}-nm .hn { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .${P}-ax { position: relative; height: 22px; }
  .${P}-tk i { position: absolute; transform: translateX(-50%); font-style: normal; font-size: 12px; top: 3px; }
  .${P}-t { position: absolute; height: 4px; top: 6px; border-radius: 2px; }
  .${P}-t.s1 { top: 12px; }
  .${P}-lot { position: absolute; top: 3px; width: 14px; height: 14px; margin-left: -7px; border-radius: 50%; border: 3px solid; background: #fff; }
  .${P}-lot.hors { box-shadow: 0 0 0 2px ${B.ACC}; }
  .${P}-col { position: absolute; z-index: 0; top: 22px; bottom: 0; left: calc(104px + 5px + (100% - 104px - 40px - 46px - 22px - 20px) * var(--x0) / 100%); }
  .${P}-a { font-size: 13px; text-align: right; white-space: nowrap; } .${P}-a b { font-weight: 600; } .${P}-ne { color: ${B.ACC}; margin-left: 1px; } .${P}-mi { font-size: 12px; color: #5b5b66; letter-spacing: -.04em; }
  .${P}-g { font-size: 14px; font-weight: 700; text-align: right; white-space: nowrap; }
  .${P}-s { font-size: 12px; color: #5b5b66; text-align: right; }
  .${P}-leg { display: flex; align-items: center; flex-wrap: wrap; gap: 4px 8px; font-size: 12px; color: #5b5b66; }
  .${P}-lt { width: 16px; height: 4px; background: #5b5b66; border-radius: 2px; display: inline-block; }
  .${P}-ll { width: 11px; height: 11px; border: 3px solid #5b5b66; border-radius: 50%; display: inline-block; }
  .${P}-lc { width: 3px; height: 12px; background: #16161a; display: inline-block; }
  .${P}-det { display: flex; flex-direction: column; gap: 3px; padding: 8px 10px; border-radius: 8px; background: #f5f5f5; border-left: 4px solid var(--h); }
  .${P}-dt { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; font-size: 14px; }
  .${P}-big { font-size: 22px; font-weight: 700; } .${P}-eq { font-size: 18px; color: #5b5b66; }
  .${P}-dl { font-size: 12px; color: #5b5b66; }
  .${P}-mb { border-top: 1px solid #e3e3ea; padding-top: 6px; }
  .${P}-mbt { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; font-size: 14px; } .${P}-mbt .sbc-lent { margin-left: auto; } .${P}-k { font-size: 12px; color: #5b5b66; }
  .${P}-pied { position: sticky; bottom: 0; background: #fff; padding: 8px 0 2px; } .${P}-pied .sbc-act { width: 100%; }`;
  // La colonne de Nugget (fiches 9,5–16 en fond, lot 13 % en trait) se pose sur l'axe réel, mesuré au rendu.
  const js = `
(function () {
  const ax = document.querySelector('.${P}-l.ref .${P}-ax'), R = document.querySelector('.${P}-regle'), col = document.querySelector('.${P}-col');
  const r = ax.getBoundingClientRect(), r0 = R.getBoundingClientRect(), X = function (v) { return r.left - r0.left + r.width * (v - ${LO}) / (${HI - LO}); };
  col.style.left = X(${A0.fiches[0]}) + 'px'; col.style.width = (X(${A0.fiches[1]}) - X(${A0.fiches[0]})) + 'px';
  col.style.background = 'linear-gradient(90deg, transparent calc(' + (X(${A0.lot}) - X(${A0.fiches[0]}) - 1) + 'px), #16161a 0 calc(' + (X(${A0.lot}) - X(${A0.fiches[0]}) + 1) + 'px), transparent 0), rgba(75,90,18,.17)';
})();
window.choisir = function (nom) {
  document.querySelectorAll('.${P}-l[data-choix]').forEach(function (l) { l.setAttribute('aria-pressed', String(l.dataset.choix === nom)); });
  document.querySelectorAll('[data-det]').forEach(function (d) { d.hidden = d.dataset.det !== nom; });
  SBC.majBiere(document.querySelector('.${P}-mb [data-biere]'), nom);
  document.querySelector('[data-nm]').textContent = nom;
};
${B.JS_CHOIX('Nelson Sauvin')}`;
  return B.page({ id: P, chaleur: 'tiède', idee: 'la règle α : un trait par fiche, le lot en repère, les grammes au même IBU', corps, css, js });
}
