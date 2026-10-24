// sbc4 · tiède · la dose d'abord : des colonnes de grammes. Chaque remplaçant est une éprouvette : sa hauteur, les
// grammes qu'il faut pour le même IBU (moustache : la plage par l'α des fiches) ; derrière, ce que tu as en stock ; la
// ligne de 46 g de Nugget traverse tout. On voit d'un coup qui suffit, qui manque et qui est à acheter.
import * as B from '../sbc1/commun/socle-sbc.mjs';
const { esc, fr, ic, pic } = B;
const P = 'sbc4';
const GMAX = 80, H = 230, Y = (gr) => Math.min(H, (gr / GMAX) * H);

function colonne(nom) {
  const d = B.dose(nom), st = B.HOP[nom].stock, s = B.sub(nom), A = B.HOP[nom].alpha;
  const etat = st >= d.g ? 'ok' : st > 0 ? 'manque' : 'achat';
  const court = nom === 'Nelson Sauvin' ? 'Nelson<br>Sauvin' : esc(nom);
  return `<div class="${P}-c ${etat}" data-role="ligne-houblon" data-choix="${esc(nom)}" aria-pressed="false" style="--h:${B.COUL[nom]};--d:${Y(d.g)}px;--s:${Y(st)}px;--dmin:${Y(d.min)}px;--dmax:${Y(d.max)}px">
    <span class="${P}-dg">${d.txt.replace(' g', '')}<small>g</small></span>
    <span class="${P}-tube" aria-label="${esc(nom)} : ${d.txt} pour le même IBU ; ${st ? st + ' g en stock' : 'pas en stock'}"><i class="${P}-st"></i><i class="${P}-do"></i>${d.min !== d.max ? `<i class="${P}-mu"></i>` : ''}${st > GMAX ? '<i class="' + P + '-plus">+</i>' : ''}</span>
    <span class="${P}-nm"><span class="hn" data-houblon="${esc(nom)}" data-couleur="${B.COUL[nom]}" tabindex="0"><i class="w-pt" style="background:${B.COUL[nom]}" aria-hidden="true"></i>${court}</span></span>
    <span class="${P}-a mono">${A.lot != null ? fr(A.lot) : '~' + fr((A.fiches[0] + A.fiches[1]) / 2)}</span>
    <span class="${P}-sc mono">${s.score}</span></div>`;
}
function carte(nom) {
  const d = B.dose(nom), st = B.HOP[nom].stock, s = B.sub(nom);
  const reste = st - d.g;
  const ligne = st >= d.g ? `il t'en reste ~${Math.round(reste)} g` : st > 0 ? `il en manque ~${Math.round(-reste)} g (${st} g en stock)` : 'à acheter';
  return `<div class="${P}-ca" data-carte="${esc(nom)}" hidden style="--h:${B.COUL[nom]}">
    <p class="${P}-re"><span class="${P}-av">Nugget 46 g</span><span class="${P}-fl">→</span>${B.nomH(nom)}<b>${d.txt}</b><span class="${P}-mo">à 60′</span></p>
    <p class="${P}-dt">${B.alpha(nom, { plage: true })}${B.usage(nom)}<span>· ${ligne}</span>${s.deconseille ? '<span class="' + P + '-w">· ' + esc(s.deconseille.replace(/ \(.*\)/, '')) + '</span>' : ''}</p>
  </div>`;
}
export function rendre() {
  const stock = ['Nelson Sauvin', 'Galaxy', 'Sabro', 'Idaho 7', 'Target'], achat = ['Magnat', 'Yeoman'];
  const graduations = [20, 40, 60, 80].map((v) => `<i style="bottom:${Y(v)}px"><span>${v}</span></i>`).join('');
  const corps = `
  <header class="${P}-tete">${B.croix()}<h1>Lequel à la place de Nugget ?</h1>${B.legB()}</header>
  <p class="${P}-q"><b>Assez en stock : Nelson Sauvin et Galaxy.</b> Grammes pour le même IBU (~${B.IBU}, 60′).</p>
  <div class="${P}-graphe" data-libre="houblon" style="--n:${Y(46)}px">
    <div class="${P}-grad" aria-hidden="true">${graduations}<i class="${P}-ng" style="bottom:${Y(46)}px"><span>46</span></i></div>
    <div class="${P}-grp"><span class="${P}-gt">${ic('stock', 14)}ton stock</span><div class="${P}-cols">${stock.map(colonne).join('')}</div></div>
    <div class="${P}-grp a"><span class="${P}-gt">${ic('achat', 14)}à acheter</span><div class="${P}-cols">${achat.map(colonne).join('')}</div></div>
  </div>
  <p class="${P}-leg"><i class="${P}-l1"></i>dose ~ même IBU <i class="${P}-l2"></i>ton stock <i class="${P}-l3"></i>Nugget 46 g <span class="mono">13,4</span> α · <span class="mono">93</span> score</p>
  ${[...stock, ...achat].map(carte).join('')}
  <div class="${P}-mb"><div class="${P}-mbt"><b>Ma stout après</b><span class="${P}-k">~ simulé</span>${B.lentille()}</div>${B.barres(P, 'Nelson Sauvin', { familles: ['floral', 'herbal', 'citrus', 'tropical', 'resin', 'spice'] })}</div>
  <footer class="${P}-pied"><a class="sbc-act" href="#" data-role="remplacer">Remplacer ›</a></footer>`;
  const css = `
  .${P}-tete { display: flex; align-items: center; gap: 4px; } .${P}-tete h1 { flex: 1; font-size: 17px; font-weight: 700; }
  .${P}-q { font-size: 14px; } .${P}-q b { font-weight: 700; }
  .${P}-graphe { position: relative; display: grid; grid-template-columns: 5fr 2fr; gap: 8px; padding-left: 22px; }
  .${P}-grad { position: absolute; left: 0; right: 0; bottom: 74px; height: ${H}px; pointer-events: none; }
  .${P}-grad i { position: absolute; left: 0; right: 0; border-top: 1px dashed #e3e3ea; }
  .${P}-grad i span { position: absolute; left: 0; top: -9px; font: 400 12px var(--mono); color: #5b5b66; background: #fff; }
  .${P}-grad i.${P}-ng { border-top: 2px solid #3a3a40; z-index: 2; }
  .${P}-grad i.${P}-ng span { top: -9px; font: 700 12px var(--mono); color: #16161a; }
  .${P}-grp { display: flex; flex-direction: column; gap: 4px; }
  .${P}-gt { display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; color: #5b5b66; height: 18px; }
  .${P}-grp.a { border-left: 1px solid #e3e3ea; padding-left: 6px; }
  .${P}-cols { display: flex; justify-content: space-around; gap: 2px; }
  .${P}-c { display: flex; flex-direction: column; align-items: center; gap: 2px; width: 46px; cursor: pointer; border-radius: 8px; padding: 2px 0 4px; }
  .${P}-c[aria-pressed="true"] { background: #ececf1; }
  .${P}-dg { font: 700 15px var(--sans); } .${P}-dg small { font-size: 12px; font-weight: 400; margin-left: 1px; }
  .${P}-tube { position: relative; width: 24px; height: ${H}px; }
  .${P}-tube i { position: absolute; left: 0; right: 0; bottom: 0; display: block; }
  .${P}-st { height: var(--s); background: repeating-linear-gradient(0deg, #cfe8d6 0 3px, #e6f3ea 3px 6px); border-radius: 4px 4px 0 0; box-shadow: inset 0 0 0 1px #7fb895; }
  .${P}-do { left: 5px !important; right: 5px !important; height: var(--d); background: var(--h); border-radius: 4px 4px 0 0; }
  .${P}-c.manque .${P}-do { background: linear-gradient(0deg, var(--h) 0 var(--s), #fff var(--s)); box-shadow: inset 0 0 0 2px var(--h); }
  .${P}-c.achat .${P}-do { background: #fff; box-shadow: inset 0 0 0 2px var(--h); }
  .${P}-mu { left: 11px !important; right: 11px !important; bottom: var(--dmin) !important; height: calc(var(--dmax) - var(--dmin)); background: #16161a; }
  .${P}-plus { bottom: auto !important; top: -4px; text-align: center; font: 700 12px var(--sans); color: #1f6b3a; font-style: normal; }
  .${P}-nm { font-size: 12px; text-align: center; line-height: 1.15; min-height: 28px; display: flex; align-items: center; }
  .${P}-nm .hn { flex-direction: column; gap: 1px; font-size: 12px; }
  .${P}-a { font-size: 12px; color: #5b5b66; } .${P}-sc { font-size: 12px; font-weight: 600; }
  .${P}-leg { display: flex; align-items: center; flex-wrap: wrap; gap: 4px 8px; font-size: 12px; color: #5b5b66; }
  .${P}-l1 { width: 10px; height: 14px; background: #5b5b66; display: inline-block; border-radius: 2px 2px 0 0; }
  .${P}-l3 { width: 16px; height: 2px; background: #3a3a40; display: inline-block; }
  .${P}-l2 { width: 16px; height: 14px; background: repeating-linear-gradient(0deg, #cfe8d6 0 3px, #e6f3ea 3px 6px); box-shadow: inset 0 0 0 1px #7fb895; display: inline-block; }
  .${P}-ca { display: flex; flex-direction: column; gap: 3px; padding: 8px 10px; border-radius: 8px; background: #f5f5f5; border-left: 4px solid var(--h); }
  .${P}-re { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; font-size: 14px; } .${P}-re b { font-size: 20px; }
  .${P}-av { color: #5b5b66; text-decoration: line-through; } .${P}-fl { color: #5b5b66; } .${P}-mo { font-size: 12px; color: #5b5b66; }
  .${P}-dt { display: flex; align-items: center; flex-wrap: wrap; gap: 4px 6px; font-size: 13px; } .${P}-w { color: #5b5b66; }
  .${P}-mb { border-top: 1px solid #e3e3ea; padding-top: 6px; }
  .${P}-mbt { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; font-size: 14px; } .${P}-mbt .sbc-lent { margin-left: auto; } .${P}-k { font-size: 12px; color: #5b5b66; }
  .${P}-pied { position: sticky; bottom: 0; background: #fff; padding: 8px 0 2px; } .${P}-pied .sbc-act { width: 100%; }`;
  const js = `
(function () { const g = document.querySelector('.${P}-grad'), c = document.querySelector('.${P}-tube'), R = document.querySelector('.${P}-graphe'); g.style.bottom = (R.getBoundingClientRect().bottom - c.getBoundingClientRect().bottom) + 'px'; })();
window.choisir = function (nom) {
  document.querySelectorAll('.${P}-c').forEach(function (c) { c.setAttribute('aria-pressed', String(c.dataset.choix === nom)); });
  document.querySelectorAll('[data-carte]').forEach(function (c) { c.hidden = c.dataset.carte !== nom; });
  SBC.majBiere(document.querySelector('.${P}-mb [data-biere]'), nom);
};
${B.JS_CHOIX('Nelson Sauvin')}`;
  return B.page({ id: P, chaleur: 'tiède', idee: 'des éprouvettes de grammes : la dose au même IBU devant ton stock', corps, css, js });
}
