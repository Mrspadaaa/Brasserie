// sbc6 · chaude · les huiles en flacons. Chaque houblon est un flacon : sa hauteur, l'huile totale (mL/100 g ; la frange
// pâle va du bas au haut des fiches) ; ses couches, la part de chaque composé au milieu de sa plage publiée, à la couleur
// de la famille qu'il porte (myrcène résineux, humulène herbacé, caryophyllène épicé, linalol floral) ; le reste, non
// publié, en gris. Nugget à gauche, le choisi à droite, l'étagère des autres dessous. À 60′, l'huile pèse 0,2 du score.
import * as B from '../sbc1/commun/socle-sbc.mjs';
const { esc, fr, ic, pic } = B;
const P = 'sbc6';
const HMAX = 3.6; // mL/100 g en haut du grand flacon
const TON = (f) => B.S.JET[f].base;

function couches(nom) {
  const c = B.D.hops[nom].composants;
  const ls = B.OILS.map(([k, mot, f]) => { const x = c[k]; return x ? { k, mot, f, v: (x.min + x.max) / 2, txt: B.plageTxt(x.min, x.max) } : { k, mot, f, v: null }; });
  return ls;
}
function flacon(nom, grand) {
  const hu = B.plage(nom, 'huile'), L = couches(nom), H = grand ? 230 : 70, W = grand ? 62 : 30;
  const mid = hu ? (hu.min + hu.max) / 2 : null, hTot = hu ? Math.min(1, mid / HMAX) * H : H * 0.5;
  const fr0 = hu ? Math.min(1, hu.min / HMAX) * H : 0, fr1 = hu ? Math.min(1, hu.max / HMAX) * H : 0;
  const connus = L.filter((x) => x.v != null), tot = connus.reduce((t, x) => t + x.v, 0);
  let y = 0;
  const parts = connus.length >= 2 ? connus.map((x) => { const h = (x.v / 100) * hTot, s = `<i class="${P}-cu" data-famille="${x.f}" style="bottom:${y}px;height:${h}px;background:${TON(x.f)}"></i>`; y += h; return s; }).join('') + `<i class="${P}-cu reste" style="bottom:${y}px;height:${Math.max(0, hTot - y)}px"></i>`
    : `<i class="${P}-cu inc" style="bottom:0;height:${hTot}px"></i>`;
  const lab = grand ? L.map((x) => `<span class="${P}-et">${pic(x.f, 14)}<b>${x.mot}</b><span class="mono">${x.v != null ? x.txt + ' %' : '?'}</span></span>`).join('') : '';
  return `<div class="${P}-fl${grand ? ' g' : ''}" style="--H:${H}px;--W:${W}px">
    <span class="${P}-verre">${hu ? `<i class="${P}-fr" style="bottom:${fr0}px;height:${Math.max(2, fr1 - fr0)}px"></i>` : ''}${parts}</span>
    ${grand ? `<span class="${P}-lab">${lab}<span class="${P}-et tot"><b>huile</b><span class="mono">${hu ? B.plageTxt(hu.min, hu.max) + ' mL' : '?'}</span><small>par 100 g</small></span></span>` : ''}
  </div>`;
}
function scene(nom) {
  const d = B.dose(nom), s = B.sub(nom), c = s.couverture.huiles || [];
  return `<div class="${P}-sc" data-scene="${esc(nom)}" hidden style="--h:${B.COUL[nom]}">
    <div class="${P}-duo">
      <div class="${P}-col orig"><p class="${P}-t">${B.nomH('Nugget')}<span class="${P}-g">46 g</span></p>${flacon('Nugget', true)}</div>
      <div class="${P}-col"><p class="${P}-t">${B.nomH(nom)}<span class="${P}-g">${d.txt}</span></p>${flacon(nom, true)}</div>
    </div>
    <p class="${P}-v"><b class="mono">${s.composantes.huiles != null ? s.composantes.huiles : '?'}</b> huiles${c.length ? ', ' + c.length + ' composés comparés sur 4' : ' : moins de deux composés publiés, inconnu'} · ${B.alpha(nom, { plage: true })} · score ${s.score}</p>
  </div>`;
}
export function rendre() {
  const ordre = ['Galaxy', 'Nelson Sauvin', 'Sabro', 'Idaho 7', 'Magnat', 'Yeoman', 'Altus', 'Zenia'];
  const corps = `
  <header class="${P}-tete">${B.croix()}<h1>Lequel à la place de Nugget ?</h1>${B.legB()}</header>
  <p class="${P}-q">Les huiles, flacon contre flacon. <span>À 60′ elles partent en vapeur : 0,2 du score, l'α 0,6.</span></p>
  ${ordre.map(scene).join('')}
  <div class="${P}-etag" data-libre="houblon">${ordre.map((n) => `<div class="${P}-pe" data-role="ligne-houblon" data-choix="${esc(n)}" aria-pressed="false" style="--h:${B.COUL[n]}">${flacon(n, false)}<span class="${P}-pn">${B.nomH(n)}</span><span class="${P}-ps mono">${B.sub(n).score}${B.stock(n, B.dose(n).g)}</span></div>`).join('')}</div>
  <div class="${P}-mb"><div class="${P}-mbt"><b>Ma stout après</b><span class="${P}-k">~ simulé</span>${B.lentille()}</div>${B.barres(P, 'Galaxy', { familles: ['floral', 'herbal', 'citrus', 'tropical', 'resin', 'spice', 'stoneFruit', 'berries'] })}</div>
  <footer class="${P}-pied"><a class="sbc-act" href="#" data-role="remplacer">Remplacer ›</a></footer>`;
  const css = `
  .${P}-tete { display: flex; align-items: center; gap: 4px; } .${P}-tete h1 { flex: 1; font-size: 17px; font-weight: 700; }
  .${P}-q { font-size: 15px; font-weight: 700; } .${P}-q span { display: block; font-size: 13px; font-weight: 400; color: #5b5b66; }
  .${P}-duo { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 6px; }
  .${P}-col { min-width: 0; display: flex; flex-direction: column; gap: 4px; padding: 6px 8px 8px; border-radius: 8px; background: #f5f5f5; border-top: 4px solid var(--h); }
  .${P}-col.orig { background: #fff; border-top: 0; box-shadow: inset 0 0 0 1.5px #3a3a40; }
  .${P}-t { display: flex; align-items: baseline; justify-content: space-between; font-size: 14px; } .${P}-g { font-size: 18px; font-weight: 700; }
  .${P}-fl { display: flex; align-items: flex-end; gap: 6px; }
  .${P}-verre { position: relative; flex: none; width: var(--W); height: var(--H); border: 2px solid #3a3a40; border-top: 0; border-radius: 0 0 8px 8px; overflow: hidden; background: #fff; }
  .${P}-fl:not(.g) .${P}-verre { border-width: 1.5px; border-radius: 0 0 4px 4px; }
  .${P}-verre i { position: absolute; left: 0; right: 0; display: block; }
  .${P}-fr { background: repeating-linear-gradient(0deg, #e3e3ea 0 2px, transparent 2px 4px); z-index: 2; }
  .${P}-cu.reste { background: #c9c9d2; }
  .${P}-cu.inc { background: repeating-linear-gradient(135deg, #a4a4b0 0 2px, #f3f3f6 2px 6px); }
  .${P}-lab { display: flex; flex-direction: column-reverse; gap: 5px; font-size: 12px; min-width: 0; flex: 1; }
  .${P}-lab .mono { font-family: var(--sans); font-weight: 600; font-size: 13px; }
  .${P}-et { display: flex; flex-direction: column; line-height: 1.1; } .${P}-et b { display: flex; align-items: center; gap: 2px; font-weight: 600; font-size: 12px; }
  .${P}-et .pi { display: inline-block; vertical-align: -3px; margin-right: 2px; }
  .${P}-et { flex-direction: row; flex-wrap: wrap; align-items: center; gap: 0 3px; }
  .${P}-et.tot { border-top: 1px solid #d4d4dc; padding-top: 2px; }
  .${P}-v { display: flex; align-items: center; flex-wrap: wrap; gap: 4px 6px; font-size: 13px; margin-top: 4px; }
  .${P}-etag { display: flex; justify-content: space-between; gap: 2px; padding: 6px 2px 4px; border-bottom: 3px solid #3a3a40; overflow-x: auto; scrollbar-width: none; }
  .${P}-pe { flex: none; display: flex; flex-direction: column; align-items: center; gap: 2px; width: 44px; cursor: pointer; border-radius: 8px; padding: 2px 0; }
  .${P}-pe[aria-pressed="true"] { background: #ececf1; box-shadow: inset 0 -3px 0 var(--h); }
  .${P}-pn { font-size: 12px; text-align: center; line-height: 1.1; } .${P}-pn .hn { flex-direction: column; font-size: 12px; white-space: normal; }
  .${P}-ps { display: flex; align-items: center; gap: 1px; font-size: 12px; }
  .${P}-mb { padding-top: 4px; }
  .${P}-mbt { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; font-size: 14px; } .${P}-mbt .sbc-lent { margin-left: auto; } .${P}-k { font-size: 12px; color: #5b5b66; }
  .${P}-pied { position: sticky; bottom: 0; background: #fff; padding: 8px 0 2px; } .${P}-pied .sbc-act { width: 100%; }`;
  const js = `
window.choisir = function (nom) {
  document.querySelectorAll('.${P}-pe').forEach(function (p) { p.setAttribute('aria-pressed', String(p.dataset.choix === nom)); });
  document.querySelectorAll('[data-scene]').forEach(function (s) { s.hidden = s.dataset.scene !== nom; });
  SBC.majBiere(document.querySelector('.${P}-mb [data-biere]'), nom);
};
${B.JS_CHOIX('Galaxy')}`;
  return B.page({ id: P, chaleur: 'chaude', idee: 'les huiles en flacons : huile totale en hauteur, composés en couches aux couleurs de leur famille', corps, css, js });
}
