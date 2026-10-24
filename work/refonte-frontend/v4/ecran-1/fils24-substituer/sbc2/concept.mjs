// sbc2 · froide · u4 affiné, le face-à-face promu au premier écran : sept vraies valeurs, la plage de Nugget en contour
// (D39), celle du remplaçant en plein, à la même échelle ; le remplaçant se choisit dans un rail de puces classées.
// Ce n'est pas Comparer : Nugget reste le gabarit fixe, et chaque ligne dit « recouvre », « plus bas », « plus haut ».
import * as B from '../sbc1/commun/socle-sbc.mjs';
const { esc, fr, ic, pic } = B;
const P = 'sbc2';
const VALS = [['alpha', null], ['beta', null], ['huile', null], ['myrcene', 'resin'], ['humulene', 'herbal'], ['caryophyllene', 'spice'], ['linalool', 'floral']];
const AX = { alpha: [6, 20], beta: [2, 10], huile: [0, 5.5], myrcene: [15, 75], humulene: [0, 40], caryophyllene: [0, 16], linalool: [0, 1.4] };

function puce(nom) {
  const s = B.sub(nom), pl = B.plageScore(nom);
  return `<div class="${P}-pu" data-role="ligne-houblon" data-choix="${esc(nom)}" aria-pressed="false" style="--h:${B.COUL[nom]}">${B.nomH(nom)}<span class="${P}-ps"><b class="mono">${pl.inc.length ? pl.bas + '–' + pl.haut : s.score}</b>${B.stock(nom, B.dose(nom).g)}</span></div>`;
}
function rang(nom, q, f) {
  const a = B.plage('Nugget', q), b = B.plage(nom, q), [lo, hi] = AX[q], X = (v) => Math.max(0, Math.min(100, ((v - lo) / (hi - lo)) * 100));
  const fc = B.face(nom, q);
  const lab = `<span class="${P}-lb">${f ? pic(f, 14) : ''}${B.MOTS_VAL[q]}</span>`;
  const piste = `<span class="${P}-tr${b ? '' : ' inc'}">${a ? `<i class="${P}-o" style="left:${X(a.min)}%;width:${Math.max(1.5, X(a.max) - X(a.min))}%"></i>` : ''}${b ? `<i class="${P}-r" style="left:${X(b.min)}%;width:${Math.max(1.5, X(b.max) - X(b.min))}%"></i>` : ''}</span>`;
  const val = b ? `<span class="${P}-v mono">${B.plageTxt(b.min, b.max)}</span>` : `<span class="${P}-v">${B.S.inconnu('aucune fiche ne le publie', '?')}</span>`;
  return `<div class="${P}-row ${fc.k}" data-val="${q}">${lab}${piste}${val}<span class="${P}-m">${fc.mot}</span></div>`;
}
function bloc(nom) {
  const d = B.dose(nom), h = B.HOP[nom], stockOk = h.stock >= d.g;
  const srcs = [...new Set(VALS.map(([q]) => (B.plage(nom, q) || {}).src).filter(Boolean).join(' · ').split(' · '))].join(' · ');
  return `<section class="${P}-bloc" data-bloc="${esc(nom)}" hidden style="--h:${B.COUL[nom]}">
    <div class="${P}-duel">
      <div class="${P}-dn"><span class="${P}-k">à la place de</span>${B.nomH('Nugget')}<b class="${P}-g">46 g</b>${B.alpha('Nugget')}</div>
      <span class="${P}-fl" aria-hidden="true">→</span>
      <div class="${P}-dn on"><span class="${P}-k">${B.usage(nom)}</span>${B.nomH(nom)}<b class="${P}-g">${d.txt}</b>${B.alpha(nom, { plage: true })}</div>
    </div>
    <p class="${P}-st">${ic(stockOk ? 'stock' : h.stock > 0 ? 'manque' : 'achat', 14)}${stockOk ? h.stock + ' g en stock, il en reste ~' + Math.round(h.stock - d.g) + ' g' : h.stock > 0 ? 'seulement ' + h.stock + ' g en stock' : 'à acheter'} · même IBU, ~${B.IBU}${d.plage ? ' · ' + d.plage + ' selon l’α des fiches' : ''}</p>
    <div class="${P}-tab">${VALS.map(([q, f]) => rang(nom, q, f)).join('')}</div>
    <p class="${P}-mots">${B.familles(nom).slice(0, 4).map((f) => pic(f, 16) + '<span>' + esc(B.motsFiche(nom, f).slice(0, 2).join(', ')) + '</span>').join('')}${B.sansFamille(nom).length ? '<i>sans famille : ' + esc(B.sansFamille(nom).slice(0, 4).join(', ')) + '</i>' : ''}</p>
    <p class="${P}-src">contour : Nugget · plein : ${esc(nom)} · ${esc(srcs)}</p>
  </section>`;
}
export function rendre() {
  const ordre = ['Nelson Sauvin', 'Galaxy', 'Sabro', 'Magnat', 'Yeoman', 'Altus', 'Trident', 'Zenia'];
  const corps = `
  <header class="${P}-tete">${B.croix()}<h1>Lequel à la place de Nugget ?</h1>${B.legB()}</header>
  <div class="${P}-rail" data-libre="houblon" aria-label="Le remplaçant, classés à 60′">${ordre.map(puce).join('')}</div>
  ${ordre.map(bloc).join('')}
  <div class="${P}-mb"><div class="${P}-mbt"><b>Ma stout après</b><span class="${P}-k">~ simulé, 60′</span>${B.lentille()}</div>${B.barres(P, 'Nelson Sauvin', { familles: ['floral', 'herbal', 'earthy', 'citrus', 'resin', 'spice'] })}</div>
  <footer class="${P}-pied"><a class="sbc-act" href="#" data-role="remplacer">Remplacer par <span data-nm>Nelson Sauvin</span> ›</a></footer>`;
  const css = `
  .${P}-tete { display: flex; align-items: center; gap: 4px; } .${P}-tete h1 { flex: 1; font-size: 17px; font-weight: 700; }
  .${P}-rail { display: flex; gap: 6px; overflow-x: auto; padding: 2px 2px 6px; scrollbar-width: none; }
  .${P}-pu { flex: none; display: flex; flex-direction: column; gap: 2px; padding: 6px 10px; border-radius: 8px; background: #e8e8ed; font-size: 13px; cursor: pointer; min-width: 92px; }
  .${P}-pu[aria-pressed="true"] { background: #fff; box-shadow: inset 0 0 0 2px var(--h); }
  .${P}-ps { display: flex; align-items: center; justify-content: space-between; gap: 6px; font-size: 14px; }
  .${P}-bloc { display: flex; flex-direction: column; gap: 6px; }
  .${P}-duel { display: grid; grid-template-columns: 1fr 18px 1fr; align-items: stretch; gap: 4px; }
  .${P}-dn { display: flex; flex-direction: column; gap: 2px; padding: 8px 10px; border-radius: 8px; box-shadow: inset 0 0 0 1.5px #3a3a40; font-size: 13px; }
  .${P}-dn.on { box-shadow: none; background: #e8e8ed; border-left: 4px solid var(--h); }
  .${P}-fl { align-self: center; text-align: center; font-size: 18px; color: #5b5b66; }
  .${P}-g { font-size: 26px; font-weight: 700; line-height: 1.1; }
  .${P}-k { font-size: 12px; color: #5b5b66; }
  .${P}-st { display: flex; align-items: center; gap: 5px; font-size: 13px; }
  .${P}-tab { display: flex; flex-direction: column; gap: 2px; }
  .${P}-row { display: grid; grid-template-columns: 104px 1fr 62px 62px; align-items: center; gap: 6px; height: 30px; font-size: 13px; }
  .${P}-lb { display: flex; align-items: center; gap: 4px; font-weight: 600; }
  .${P}-tr { position: relative; height: 26px; background: #e4e4ea; border-radius: 2px; }
  .${P}-tr.inc { background: repeating-linear-gradient(135deg, #d4d4dc 0 2px, #f3f3f6 2px 6px); }
  .${P}-o { position: absolute; top: 2px; bottom: 2px; border: 2px solid #3a3a40; border-radius: 4px; background: #fff; }
  .${P}-r { position: absolute; top: 10px; height: 6px; background: var(--h); border-radius: 2px; }
  .${P}-v { text-align: right; font-size: 13px; }
  .${P}-m { font-size: 12px; color: #5b5b66; }
  .${P}-row.rec .${P}-m { color: #1f6b3a; font-weight: 600; }
  .${P}-row.eca .${P}-m { color: #16161a; font-weight: 600; }
  .${P}-src { font-size: 12px; color: #5b5b66; }
  .${P}-mots { display: flex; align-items: center; flex-wrap: wrap; gap: 3px 6px; font-size: 13px; padding: 5px 8px; border-radius: 4px; background: #e8e8ed; } .${P}-mots i { flex-basis: 100%; color: #3a3a40; }
  .${P}-mb { border-top: 1px solid #e3e3ea; padding-top: 6px; }
  .${P}-mbt { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; font-size: 14px; } .${P}-mbt .sbc-lent { margin-left: auto; }
  .${P}-pied { position: sticky; bottom: 0; background: #fff; padding: 8px 0 2px; } .${P}-pied .sbc-act { width: 100%; }`;
  const js = `
window.choisir = function (nom) {
  document.querySelectorAll('.${P}-pu').forEach(function (p) { p.setAttribute('aria-pressed', String(p.dataset.choix === nom)); });
  document.querySelectorAll('[data-bloc]').forEach(function (b) { b.hidden = b.dataset.bloc !== nom; });
  SBC.majBiere(document.querySelector('.${P}-mb [data-biere]'), nom);
  document.querySelector('[data-nm]').textContent = nom;
};
${B.JS_CHOIX('Nelson Sauvin')}`;
  return B.page({ id: P, chaleur: 'froide', idee: 'u4 affiné : le face-à-face des vraies valeurs, Nugget en contour', corps, css, js });
}
