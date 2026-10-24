// sbc8 · chaude · le ticket du calcul. Le score n'est plus une boîte noire : un ticket imprimé, ligne à ligne, des
// vraies valeurs au verdict. Nugget 46 g fait ~59,7 IBU ; le remplaçant, à son α, en demande tant ; puis les trois
// composantes avec leur poids à 60′ et ce qui les porte (α, β, rôle ; quatre composés de l'huile ; les familles
// « étrangères »). Plus d'« arôme 100 » : à 60′, la porte disait 100 quand rien d'étranger n'arrive, le ticket l'écrit.
import * as B from '../sbc1/commun/socle-sbc.mjs';
const { esc, fr, ic, pic } = B;
const P = 'sbc8';
const mid = (p) => (p ? (p.min + p.max) / 2 : null);

function ticket(nom) {
  const s = B.sub(nom), d = B.dose(nom), A = B.HOP[nom].alpha, w = B.M.poids, c = s.composantes;
  const aN = B.plage('Nugget', 'alpha'), aX = B.plage(nom, 'alpha'), bN = B.plage('Nugget', 'beta'), bX = B.plage(nom, 'beta');
  const r = (k, v, cls = '') => `<li class="${cls}"><span>${k}</span><i></i><b class="mono">${v}</b></li>`;
  const huiles = B.OILS.map(([k, mot, f]) => {
    const fc = B.face(nom, k), x = B.plage(nom, k), n = B.plage('Nugget', k);
    return `<li class="${P}-sub ${fc.k}"><span>${pic(f, 14)}${mot} <span class="mono">${x ? B.plageTxt(x.min, x.max) : '?'}</span> / <span class="mono">${n ? B.plageTxt(n.min, n.max) : '?'}</span></span><i></i><b>${fc.k === 'rec' ? '✓' : fc.k === 'inc' ? '?' : '✗'}</b></li>`;
  }).join('');
  const etr = B.familles(nom).filter((f) => !B.familles('Nugget').includes(f));
  const arTxt = c.arome == null ? '?' : etr.length ? etr.length + ' famille' + (etr.length > 1 ? 's' : '') + ' étrangère' + (etr.length > 1 ? 's' : '') : 'rien d’étranger';
  return `<div class="${P}-tk" data-tk="${esc(nom)}" hidden style="--h:${B.COUL[nom]}">
    <ol class="${P}-ls">
      <li class="${P}-ti"><span>${B.nomH('Nugget')} 46 g · α ${fr(B.HOP.Nugget.alpha.lot)} % lot</span><i></i><b class="mono">~${B.IBU} IBU</b></li>
      <li class="${P}-ti"><span>${B.nomH(nom)} ${A.lot != null ? 'α ' + fr(A.lot) + ' % lot' : 'α ~' + fr((A.fiches[0] + A.fiches[1]) / 2) + ' % fiches'}</span><i></i><b class="mono">${d.txt}</b></li>
      <li class="${P}-cut"></li>
      ${r('amertume × ' + fr(w.amertume), c.amertume ?? '?', 'k')}
      <li class="${P}-sub"><span>α <span class="mono">${aX ? fr(mid(aX)) : '?'}</span> / <span class="mono">${fr(mid(aN))}</span> · β <span class="mono">${bX ? fr(mid(bX)) : '?'}</span> / <span class="mono">${fr(mid(bN))}</span> · ${B.usage(nom)}</span></li>
      ${r('huiles × ' + fr(w.huiles), c.huiles ?? '?', 'k')}
      ${huiles}
      ${r('arôme × ' + fr(w.arome), arTxt, 'k')}
      <li class="${P}-sub"><span>${etr.length ? etr.map((f) => pic(f, 14)).join('') + ' cités par ses fiches, pas par Nugget' : 'ses familles ' + B.familles(nom).map((f) => pic(f, 14)).join('') + ' déjà chez Nugget'} ; à 60′ l'arôme part à l'ébullition</span></li>
      <li class="${P}-sub"><span class="${P}-mots">${B.familles(nom).slice(0, 4).map((f) => pic(f, 16) + '<span>' + esc(B.motsFiche(nom, f).slice(0, 2).join(', ')) + '</span>').join('')}${B.sansFamille(nom).length ? '<i>sans famille : ' + esc(B.sansFamille(nom).slice(0, 4).join(', ')) + '</i>' : ''}</span></li>
      <li class="${P}-cut dbl"></li>
      <li class="${P}-tot"><span>score · ${esc(s.palier)}</span><i></i><b class="mono">${s.score}</b></li>
      <li class="${P}-sub"><span>${B.stock(nom, d.g)} ${B.HOP[nom].stock ? B.HOP[nom].stock + ' g en stock' : 'à acheter'} · fiabilité ${esc(s.couverture.fiabilite)}</span></li>
    </ol>
  </div>`;
}
export function rendre() {
  const ordre = ['Nelson Sauvin', 'Galaxy', 'Sabro', 'Magnat', 'Yeoman', 'Altus'];
  const corps = `
  <header class="${P}-tete">${B.croix()}<h1>Lequel à la place de Nugget ?</h1>${B.legB()}</header>
  <div class="${P}-tabs" data-libre="houblon">${ordre.map((n) => `<div class="${P}-tab" data-role="ligne-houblon" data-choix="${esc(n)}" aria-pressed="false" style="--h:${B.COUL[n]}">${B.nomH(n)}<b class="mono">${B.sub(n).score}</b></div>`).join('')}</div>
  <div class="${P}-papier">
    <p class="${P}-en">CALCUL DU REMPLAÇANT · 60′ · STOUT 16D</p>
    ${ordre.map(ticket).join('')}
    <p class="${P}-pd">poids à 60′ : amertume 0,6 · huiles 0,2 · arôme 0,2 · moteur v4, règle à valider</p>
  </div>
  <div class="${P}-mb"><div class="${P}-mbt"><b>Ma stout après</b><span class="${P}-k">~ simulé</span>${B.lentille()}</div>${B.barres(P, 'Nelson Sauvin', { familles: ['floral', 'herbal', 'citrus', 'tropical', 'resin', 'spice'] })}</div>
  <footer class="${P}-pied"><a class="sbc-act" href="#" data-role="remplacer">Remplacer ›</a></footer>`;
  const css = `
  .${P}-tete { display: flex; align-items: center; gap: 4px; } .${P}-tete h1 { flex: 1; font-size: 17px; font-weight: 700; }
  .${P}-tabs { display: flex; flex-wrap: wrap; gap: 4px; }
  .${P}-tab { flex: 1 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 6px; padding: 6px 8px; border-radius: 8px; background: #e8e8ed; font-size: 13px; cursor: pointer; min-width: 0; }
  .${P}-tab .hn { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
  .${P}-tab[aria-pressed="true"] { background: #fff; box-shadow: inset 0 0 0 2px var(--h); }
  .${P}-papier { position: relative; background: #e9e9ee; padding: 10px 14px 12px; box-shadow: 0 1px 0 #d4d4dc, 0 4px 14px rgba(0,0,0,.10); border-radius: 2px;
    -webkit-mask: linear-gradient(#000 0 0) top / 100% calc(100% - 8px) no-repeat, conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg) bottom / 12px 8px repeat-x; }
  .${P}-en { font: 600 12px var(--mono); letter-spacing: .06em; text-align: center; color: #3a3a40; border-bottom: 1px dashed #8a8a96; padding-bottom: 6px; margin-bottom: 4px; }
  .${P}-ls { list-style: none; display: flex; flex-direction: column; gap: 1px; font-size: 14px; }
  .${P}-ls li { display: flex; align-items: baseline; gap: 6px; }
  .${P}-ls li > span { display: inline-flex; align-items: center; flex-wrap: wrap; gap: 3px; }
  .${P}-ls li > i { flex: 1; border-bottom: 2px dotted #8a8a96; transform: translateY(-4px); min-width: 12px; }
  .${P}-ls li > b { font-weight: 600; white-space: nowrap; }
  .${P}-ti { font-size: 14px; } .${P}-ti b { font-size: 16px; }
  .${P}-ls li.k { margin-top: 6px; font-weight: 700; font-size: 15px; } .${P}-ls li.k b { font-size: 17px; }
  .${P}-sub { font-size: 12px !important; color: #3a3a40; padding-left: 10px; } .${P}-sub b { font-size: 13px; }
  .${P}-sub.eca b { color: #16161a; } .${P}-sub.rec b { color: #1f6b3a; }
  .${P}-cut { border-top: 1px dashed #8a8a96; margin: 5px 0 0; height: 0; } .${P}-cut.dbl { border-top: 3px double #16161a; margin-top: 8px; }
  .${P}-tot { font-size: 18px !important; font-weight: 700; margin-top: 4px; } .${P}-tot b { font-size: 28px !important; color: var(--h); }
  .${P}-mots { display: inline-flex; align-items: center; flex-wrap: wrap; gap: 2px 5px; } .${P}-mots i { flex-basis: 100%; }
  .${P}-pd { font-size: 12px; color: #5b5b66; text-align: center; margin-top: 6px; }
  .${P}-mb { padding-top: 4px; }
  .${P}-mbt { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; font-size: 14px; } .${P}-mbt .sbc-lent { margin-left: auto; } .${P}-k { font-size: 12px; color: #5b5b66; }
  .${P}-pied { position: sticky; bottom: 0; background: #fff; padding: 8px 0 2px; } .${P}-pied .sbc-act { width: 100%; }`;
  const js = `
window.choisir = function (nom) {
  document.querySelectorAll('.${P}-tab').forEach(function (t) { t.setAttribute('aria-pressed', String(t.dataset.choix === nom)); });
  document.querySelectorAll('[data-tk]').forEach(function (t) { t.hidden = t.dataset.tk !== nom; });
  SBC.majBiere(document.querySelector('.${P}-mb [data-biere]'), nom);
};
${B.JS_CHOIX('Nelson Sauvin')}`;
  return B.page({ id: P, chaleur: 'chaude', idee: 'le ticket du calcul : des vraies valeurs au score, ligne à ligne, sans « arôme 100 »', corps, css, js });
}
