// sbc1 · froide · u4 affiné : la liste classée à plages (un « 99 » partiel peut valoir 79), avec en ligne les vraies
// valeurs qui décident à 60′ (α du lot ou des fiches, dose au même IBU, stock), puis le face-à-face Nugget / le choisi.
// Corrige ce que la porte faisait mal : pas d'« arôme 100 » ; à 60′, ce qui reste dans ma bière (simulé), pas les
// arômes que l'ébullition emporte ; tout tient à 390 px.
import * as B from '../sbc1/commun/socle-sbc.mjs';
const { esc, fr, g, ic, pic, COURT } = B;
const P = 'sbc1';
const SC0 = 60, SC1 = 100; const x = (s) => ((Math.max(SC0, s) - SC0) / (SC1 - SC0)) * 100;

function ligne(nom) {
  const s = B.sub(nom), d = B.dose(nom), pl = B.plageScore(nom);
  const barre = pl.inc.length
    ? `<i class="${P}-pl" style="left:${x(pl.bas)}%;width:${x(pl.haut) - x(pl.bas)}%"></i>`
    : `<i class="${P}-pt" style="left:${x(s.score)}%;background:${B.COUL[nom]}"></i>`;
  const num = pl.inc.length ? `<span class="${P}-num inc">${pl.bas}–${pl.haut}</span>` : `<span class="${P}-num">${s.score}</span>`;
  return `<div class="${P}-l" data-role="ligne-houblon" data-choix="${esc(nom)}" aria-pressed="false">
    <span class="${P}-nm">${B.nomH(nom)}${B.stock(nom, d.g)}</span>
    <span class="${P}-al">${B.alpha(nom)}</span>
    <span class="${P}-do">${d.txt}</span>
    <span class="${P}-sc" aria-label="score ${pl.inc.length ? pl.bas + ' à ' + pl.haut + ', ' + pl.inc.map((k) => B.MOTS_COMP[k]).join(', ') + ' inconnu' : s.score}">${barre}</span>${num}</div>`;
}
function alphaRangs(nom) {
  const h = B.D.hops[nom], A = B.HOP[nom].alpha, lo = 8, hi = 19, X = (v) => ((v - lo) / (hi - lo)) * 100;
  const src = ((h.alpha && h.alpha.sources) || []).map((s) => `<i class="${P}-as" style="left:${X(s.min)}%;width:${X(s.max) - X(s.min)}%;background:${B.COUL[nom]}" title=""></i>`).join('');
  const lot = A.lot != null ? `<i class="${P}-alot" style="left:${X(A.lot)}%"></i><b class="${P}-alt mono" style="left:${X(A.lot)}%">${fr(A.lot)}${A.horsFiches ? ' ≠' : ''}</b>` : '';
  return `<div class="${P}-ar"><span class="${P}-arn">${esc(nom)}</span><span class="${P}-ax">${src}${lot}</span><span class="${P}-arv mono">${A.fiches ? fr(A.fiches[0]) + '–' + fr(A.fiches[1]) : '?'}</span></div>`;
}
function face(nom) {
  const d = B.dose(nom), s = B.sub(nom), h = B.D.hops[nom];
  const perd = (s.perd || []).filter((m) => m.a === 0).map((m) => m.family), gagne = (s.gagne || []).filter((m) => m.de === 0).map((m) => m.family);
  const sources = ((h.alpha && h.alpha.sources) || []).map((x) => B.srcCourt(x.source) + ' ' + String(x.annee).slice(2)).join(' · ');
  return `<div class="${P}-face" data-face="${esc(nom)}" hidden>
    <div class="${P}-duo">
      <div class="${P}-c orig">${B.nomH('Nugget')}<span class="${P}-cg">46 g</span><span class="${P}-cs">${B.usage('Nugget')} · 0 g en stock</span></div>
      <div class="${P}-c" style="--h:${B.COUL[nom]}">${B.nomH(nom)}<span class="${P}-cg">${d.txt}</span><span class="${P}-cs">${B.usage(nom)} · ${d.plage ? d.plage + ' selon les fiches' : 'à l’α du lot'}</span></div>
    </div>
    <div class="${P}-alpha"><span class="${P}-k">α</span><div>${alphaRangs('Nugget')}${alphaRangs(nom)}<span class="${P}-src">trait : une fiche (${esc(sources)}) ; repère : le lot en stock</span></div></div>
    <div class="${P}-fam"><span class="${P}-k2">ses fiches, face à Nugget</span><span class="${P}-pf">perd ${perd.length ? perd.map((f) => pic(f, 16)).join('') : '<b>rien</b>'}</span><span class="${P}-pf">gagne ${gagne.length ? gagne.map((f) => pic(f, 16)).join('') : '<b>rien</b>'}</span></div>
  </div>`;
}
export function rendre() {
  const top = ['Magnat', 'Yeoman', 'Altus', 'Trident', 'Zenia'], st = ['Nelson Sauvin', 'Galaxy', 'Sabro'];
  const corps = `
  <header class="${P}-tete">${B.croix()}<h1>Lequel à la place de Nugget ?</h1>${B.legB()}</header>
  <div class="${P}-orig" data-role="contexte">${B.nomH('Nugget')}${B.alpha('Nugget', { plage: true })}${B.usage('Nugget')}<span class="${P}-ctx mono">46 g · 60′ · ~${B.IBU} IBU</span>${B.stock('Nugget', 46)}</div>
  <p class="${P}-rep"><b>Magnat et Yeoman, 99 sans inconnue.</b> Dans ton stock : Nelson Sauvin, 86.</p>
  <div class="${P}-liste" data-libre="houblon">
    <div class="${P}-axe" aria-hidden="true"><span>classés pour 60′</span><span>α</span><span>dose</span><span class="${P}-pal"><i style="left:${(x(65)+x(80))/2}%">proche</i><i style="left:${(x(80)+100)/2}%">très</i></span><span>score</span></div>
    ${top.map(ligne).join('')}
    <div class="${P}-sep">${ic('stock', 14)}dans ton stock</div>
    ${st.map(ligne).join('')}
    <div class="${P}-leg"><span><i class="${P}-pt0"></i>tout connu</span><span><i class="${P}-pl0"></i>plage : les huiles inconnues, de 0 à 100</span></div>
  </div>
  <p class="${P}-wp">${ic('whirl', 14)}<span>Nugget au whirlpool, la réponse change : ${B.MWP.top.slice(0, 2).map((n) => esc(n) + ' ' + B.sub(n, B.MWP).score).join(', ')} ; Nelson Sauvin ${B.sub('Nelson Sauvin', B.MWP).score}, Magnat ${B.sub('Magnat', B.MWP).score}.</span></p>
  <section class="${P}-ff">
    <h2>Face à face, même IBU</h2>
    ${B.CANDS.map(face).join('')}
    <div class="${P}-mb"><div class="${P}-mbt"><span class="${P}-k2">ma stout après, ~ simulé à 60′</span>${B.lentille()}</div>${B.barres(P, 'Magnat', { familles: ['floral', 'herbal', 'earthy', 'citrus', 'tropical', 'resin', 'spice', 'stoneFruit'] })}</div>
  </section>
  <footer class="${P}-pied"><span class="${P}-recap">46 g de Nugget → <b data-recap>~44 g de Magnat</b></span><a class="sbc-act" href="#" data-role="remplacer">Remplacer ›</a></footer>`;
  const css = `
  .${P}-tete { display: flex; align-items: center; gap: 4px; }
  .${P}-tete h1 { flex: 1; font-size: 17px; font-weight: 700; }
  .${P}-orig { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; padding: 7px 10px; border-radius: 8px; box-shadow: inset 0 0 0 1.5px #3a3a40; font-size: 13px; }
  .${P}-ctx { margin-left: auto; font-size: 12px; }
  .${P}-rep { font-size: 15px; line-height: 1.3; border-left: 3px solid #16161a; padding-left: 9px; }
  .${P}-rep b { font-weight: 700; }
  .${P}-liste { display: flex; flex-direction: column; }
  .${P}-axe, .${P}-l { display: grid; grid-template-columns: 118px 68px 40px 1fr 44px; align-items: center; gap: 4px; }
  .${P}-num { font: 600 14px var(--mono); text-align: right; } .${P}-num.inc { font-size: 12px; color: #5b5b66; }
  .${P}-mbt { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
  .${P}-axe { font-size: 12px; color: #5b5b66; height: 18px; white-space: nowrap; } .${P}-axe > span:last-child { text-align: right; }
  .${P}-pal { position: relative; height: 16px; } .${P}-pal i { position: absolute; transform: translateX(-50%); font-style: normal; white-space: nowrap; font-size: 12px; top: 0; }
  .${P}-l { min-height: 38px; border-radius: 4px; padding: 0 2px; cursor: pointer; }
  .${P}-l[aria-pressed="true"] { background: #ececf1; box-shadow: inset 3px 0 0 var(--hl, #16161a); }
  .${P}-nm { display: flex; align-items: center; gap: 4px; font-size: 14px; min-width: 0; }
  .${P}-nm .hn { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .${P}-al .al.fi { font-size: 12px; } .${P}-al .w-al { flex-wrap: wrap; }
  .${P}-do { font-size: 13px; text-align: right; white-space: nowrap; }
  .${P}-sc { position: relative; height: 34px; background: linear-gradient(90deg, #f3f3f6 0 ${x(65)}%, #e9e9ee ${x(65)}% ${x(80)}%, #dfdfe7 ${x(80)}% 100%); border-radius: 2px; }
  .${P}-pt { position: absolute; top: 8px; width: 10px; height: 10px; margin-left: -5px; border-radius: 50%; }
  .${P}-pl { position: absolute; top: 9px; height: 8px; background: repeating-linear-gradient(135deg, #8a8a96 0 2px, transparent 2px 5px); border-radius: 2px; }
  .${P}-n { position: absolute; top: 5px; font-size: 13px; transform: translateX(calc(-100% - 6px)); }
  .${P}-n.r { transform: translateX(8px); }
  .${P}-n.r { right: auto; }
  .${P}-sep { display: flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; color: #5b5b66; border-top: 1px solid #e3e3ea; padding-top: 4px; margin-top: 2px; }
  .${P}-leg { display: flex; align-items: center; gap: 10px; font-size: 12px; color: #5b5b66; margin-top: 4px; }
  .${P}-leg span { display: inline-flex; align-items: center; gap: 4px; } .${P}-leg span:last-child { margin-left: auto; }
  .${P}-pt0 { width: 9px; height: 9px; border-radius: 50%; background: #5b5b66; display: inline-block; }
  .${P}-pl0 { width: 18px; height: 8px; background: repeating-linear-gradient(135deg, #8a8a96 0 2px, transparent 2px 5px); display: inline-block; }
  .${P}-wp { display: flex; align-items: center; gap: 5px; font-size: 12px; color: #3a3a40; background: #f5f5f5; border-radius: 4px; padding: 4px 8px; }
  .${P}-ff { display: flex; flex-direction: column; gap: 8px; border-top: 1px solid #e3e3ea; padding-top: 8px; }
  .${P}-ff h2 { font-size: 15px; font-weight: 700; }
  .${P}-face { display: flex; flex-direction: column; gap: 8px; }
  .${P}-duo { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .${P}-c { display: flex; flex-direction: column; gap: 2px; padding: 7px 9px; border-radius: 8px; background: #f5f5f5; box-shadow: inset 3px 0 0 var(--h, #3a3a40); font-size: 13px; }
  .${P}-c.orig { background: #fff; box-shadow: inset 0 0 0 1.5px #3a3a40; }
  .${P}-cg { font-size: 20px; font-weight: 600; }
  .${P}-cs { font-size: 12px; color: #5b5b66; }
  .${P}-alpha { display: grid; grid-template-columns: 16px 1fr; gap: 6px; }
  .${P}-k { font: 700 16px var(--sans); }
  .${P}-ar { display: grid; grid-template-columns: 92px 1fr 54px; align-items: center; gap: 6px; height: 26px; font-size: 13px; }
  .${P}-ax { position: relative; height: 22px; background: linear-gradient(#ececf1, #ececf1) center / 100% 6px no-repeat; }
  .${P}-as { position: absolute; height: 4px; top: 9px; border-radius: 2px; opacity: .85; }
  .${P}-as + .${P}-as { top: 14px; }
  .${P}-alot { position: absolute; top: 3px; width: 2px; height: 16px; margin-left: -1px; background: #16161a; }
  .${P}-alt { position: absolute; top: -6px; transform: translateX(4px); font-size: 12px; }
  .${P}-arv { font-size: 12px; text-align: right; color: #5b5b66; }
  .${P}-src { display: block; font-size: 12px; color: #5b5b66; }
  .${P}-fam { display: flex; align-items: center; flex-wrap: wrap; gap: 4px 12px; font-size: 13px; }
  .${P}-pf { display: inline-flex; align-items: center; gap: 2px; }
  .${P}-k2 { font-size: 12px; font-weight: 600; color: #5b5b66; display: block; margin-bottom: 3px; }
  .${P}-pied { position: sticky; bottom: 0; background: #fff; display: flex; align-items: center; gap: 8px; padding: 8px 0 4px; border-top: 1px solid #e3e3ea; }
  .${P}-recap { flex: 1; font-size: 13px; }`;
  const js = `
window.choisir = function (nom) {
  document.querySelectorAll('.${P}-l').forEach(function (l) { const on = l.dataset.choix === nom; l.setAttribute("aria-pressed", String(on)); if (on) l.style.setProperty('--hl', SBC1.coul[nom]); });
  document.querySelectorAll('[data-face]').forEach(function (f) { f.hidden = f.dataset.face !== nom; });
  SBC.majBiere(document.querySelector('.${P}-mb [data-biere]'), nom);
  document.querySelector('[data-recap]').textContent = SBC1.dose[nom] + ' de ' + nom;
};
${B.JS_CHOIX('Magnat')}`;
  const SBC1 = { coul: B.COUL, dose: Object.fromEntries(B.CANDS.map((n) => [n, B.dose(n).txt])) };
  return B.page({ id: P, chaleur: 'froide', idee: 'u4 affiné : liste à plages et vraies valeurs en ligne, puis le face-à-face', corps, css, js: 'const SBC1 = ' + JSON.stringify(SBC1) + ';' + js });
}
