// sbc7 · chaude · l'étiquette du sac. Le brasseur lit ses houblons sur le sac : le sac vide de Nugget (0 g), et à côté
// l'étiquette du remplaçant, avec ses vraies valeurs comme un fournisseur les imprime (α du lot, β, huile, composés,
// origine) et le tampon de la dose au même IBU. Ses arômes : les mots de ses fiches, ceux sans famille compris
// (Nelson Sauvin : vin blanc, groseille à maquereau, raisin ; L14). On change de sac en touchant l'étagère.
import * as B from '../sbc1/commun/socle-sbc.mjs';
const { esc, fr, ic, pic } = B;
const P = 'sbc7';

function etiquette(nom) {
  const h = B.D.hops[nom], A = B.HOP[nom].alpha, d = B.dose(nom), s = B.sub(nom), st = B.HOP[nom].stock;
  const be = B.plage(nom, 'beta'), hu = B.plage(nom, 'huile');
  const fams = B.familles(nom), sans = B.sansFamille(nom);
  const champ = (k, v, cls = '') => `<span class="${P}-ch ${cls}"><small>${k}</small><b class="mono">${v}</b></span>`;
  const comp = B.OILS.map(([k, mot, f]) => { const x = h.composants[k]; return `<span class="${P}-cp">${pic(f, 14)}<small>${mot}</small><b class="mono">${x ? B.plageTxt(x.min, x.max) : '?'}</b></span>`; }).join('');
  const mots = fams.slice(0, 5).map((f) => `<span class="${P}-mo">${pic(f, 16)}${esc(B.motsFiche(nom, f).slice(0, 2).join(', ') || COURT_(f))}</span>`).join('');
  return `<article class="${P}-et" data-et="${esc(nom)}" hidden style="--h:${B.COUL[nom]}">
    <div class="${P}-bd"><span>${esc((h.origine || '').toUpperCase())}</span><span>${st ? 'EN STOCK ' + st + ' g' : 'À ACHETER'}</span></div>
    <div class="${P}-v"><h2>${B.nomH(nom)}</h2>${B.usage(nom)}<div class="${P}-tampon" aria-label="dose au même IBU"><b>${d.txt}</b><span>~${B.IBU} IBU à 60′</span><span class="${P}-ts">score ${s.score} · ${s.palier}</span></div></div>
    <div class="${P}-gr">
      ${champ('α du lot', A.lot != null ? fr(A.lot) + ' %' : '—', 'big')}
      ${champ('α des fiches', A.fiches ? fr(A.fiches[0]) + '–' + fr(A.fiches[1]) + ' %' : '?', A.horsFiches ? 'ne' : '')}
      ${champ('β', be ? B.plageTxt(be.min, be.max) + ' %' : '?')}
      ${champ('huile', hu ? B.plageTxt(hu.min, hu.max) + ' mL' : '?')}
    </div>
    <div class="${P}-cps">${comp}</div>
    <div class="${P}-ar">${mots}${sans.length ? `<span class="${P}-sans">sans famille : ${esc(sans.slice(0, 4).join(', '))}</span>` : ''}</div>
    <p class="${P}-src">${esc(((h.alpha && h.alpha.sources) || []).map((x) => x.source + ' ' + x.annee).join(' · '))}${A.lot != null ? ' · lot : ' + esc(A.lotSource) : ''}</p>
  </article>`;
}
const COURT_ = (f) => B.COURT[f];
export function rendre() {
  const stock = ['Nelson Sauvin', 'Galaxy', 'Sabro', 'Idaho 7'], achat = ['Magnat', 'Yeoman', 'Altus'];
  const onglet = (n) => `<div class="${P}-on" data-role="ligne-houblon" data-choix="${esc(n)}" aria-pressed="false" style="--h:${B.COUL[n]}"><i class="${P}-sac" aria-hidden="true"></i>${B.nomH(n)}<span class="mono">${B.sub(n).score}</span></div>`;
  const corps = `
  <header class="${P}-tete">${B.croix()}<h1>Lequel à la place de Nugget ?</h1>${B.legB()}</header>
  <div class="${P}-vide" data-role="contexte"><i class="${P}-sac v" aria-hidden="true"></i><span>${B.nomH('Nugget')} ${B.alpha('Nugget')} ${B.usage('Nugget')}</span><span class="${P}-sv">sac vide · 0 g</span><span class="${P}-be mono">46 g · 60′ · ~${B.IBU} IBU</span></div>
  ${[...stock, ...achat].map(etiquette).join('')}
  <div class="${P}-etag" data-libre="houblon"><span class="${P}-eh">${ic('stock', 14)}sur ton étagère</span>${stock.map(onglet).join('')}<span class="${P}-eh">${ic('achat', 14)}à commander</span>${achat.map(onglet).join('')}</div>
  <div class="${P}-mb"><div class="${P}-mbt"><b>Ma stout après</b><span class="${P}-k">~ simulé</span>${B.lentille()}</div>${B.barres(P, 'Nelson Sauvin', { familles: ['floral', 'citrus', 'tropical', 'resin', 'spice', 'berries'] })}</div>
  <footer class="${P}-pied"><a class="sbc-act" href="#" data-role="remplacer">Prendre ce sac ›</a></footer>`;
  const css = `
  .${P}-tete { display: flex; align-items: center; gap: 4px; } .${P}-tete h1 { flex: 1; font-size: 17px; font-weight: 700; }
  .${P}-vide { display: grid; grid-template-columns: 26px 1fr auto; align-items: center; gap: 2px 8px; padding: 6px 10px; border-radius: 8px; border: 1.5px dashed #8a8a96; font-size: 13px; }
  .${P}-vide > span:first-of-type { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; }
  .${P}-sv { font-weight: 700; font-size: 12px; color: #16161a; text-transform: uppercase; letter-spacing: .04em; }
  .${P}-be { grid-column: 2 / 4; font-size: 12px; color: #5b5b66; }
  .${P}-sac { width: 22px; height: 26px; border: 2px solid var(--h, #3a3a40); border-radius: 4px 4px 8px 8px; display: inline-block; position: relative; flex: none; }
  .${P}-sac::before { content: ''; position: absolute; left: 3px; right: 3px; top: 4px; border-top: 2px solid var(--h, #3a3a40); }
  .${P}-sac.v { --h: #8a8a96; grid-row: span 2; }
  .${P}-et { position: relative; display: flex; flex-direction: column; gap: 7px; padding: 0 12px 10px; border-radius: 8px; background: #fff; box-shadow: 0 0 0 2px #16161a, 6px 6px 0 #ececf1; overflow: hidden; }
  .${P}-bd { display: flex; justify-content: space-between; margin: 0 -12px; padding: 5px 12px; background: var(--h); color: #fff; font: 700 12px var(--mono); letter-spacing: .08em; }
  .${P}-v { display: flex; align-items: center; gap: 6px; } .${P}-v h2 { font-size: 22px; font-weight: 700; } .${P}-v .hn { font-size: 22px; } .${P}-v .w-pt { width: 12px; height: 12px; }
  .${P}-gr { display: grid; grid-template-columns: 1.2fr 1fr 1fr 1fr; gap: 6px; border-top: 1px solid #16161a; border-bottom: 1px solid #16161a; padding: 5px 0; }
  .${P}-ch { display: flex; flex-direction: column; } .${P}-ch small { font-size: 12px; color: #5b5b66; } .${P}-ch b { font-size: 14px; font-weight: 600; }
  .${P}-ch.big b { font-size: 22px; } .${P}-ch.ne b::after { content: ' ≠'; color: ${B.ACC}; }
  .${P}-cps { display: grid; grid-template-columns: 1fr 1fr; gap: 3px 10px; }
  .${P}-cp { display: grid; grid-template-columns: 16px 1fr auto; align-items: center; gap: 4px; font-size: 13px; } .${P}-cp small { font-size: 13px; } .${P}-cp b { font-weight: 500; }
  .${P}-ar { display: flex; flex-wrap: wrap; gap: 4px 10px; font-size: 13px; }
  .${P}-mo { display: inline-flex; align-items: center; gap: 3px; }
  .${P}-sans { flex-basis: 100%; font-style: italic; color: #3a3a40; }
  .${P}-tampon { margin-left: auto; margin-top: 4px; transform: rotate(-5deg); display: flex; flex-direction: column; align-items: center; padding: 4px 10px; border: 2.5px solid #16161a; border-radius: 8px; background: #fff; }
  .${P}-tampon b { font-size: 24px; line-height: 1; } .${P}-tampon span { font-size: 12px; } .${P}-ts { font-weight: 600; }
  .${P}-src { font-size: 12px; color: #5b5b66; }
  .${P}-etag { display: flex; flex-wrap: wrap; gap: 5px; align-items: center; }
  .${P}-eh { flex-basis: 100%; display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; color: #5b5b66; }
  .${P}-on { display: inline-flex; align-items: center; gap: 5px; padding: 4px 8px 4px 6px; border-radius: 8px; background: #f5f5f5; font-size: 13px; cursor: pointer; }
  .${P}-on .w-pt { display: none; } .${P}-on .${P}-sac { width: 14px; height: 17px; } .${P}-on .${P}-sac::before { top: 2px; left: 2px; right: 2px; }
  .${P}-on[aria-pressed="true"] { background: #fff; box-shadow: inset 0 0 0 2px var(--h); }
  .${P}-mb { border-top: 1px solid #e3e3ea; padding-top: 6px; }
  .${P}-mbt { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; font-size: 14px; } .${P}-mbt .sbc-lent { margin-left: auto; } .${P}-k { font-size: 12px; color: #5b5b66; }
  .${P}-pied { position: sticky; bottom: 0; background: #fff; padding: 8px 0 2px; } .${P}-pied .sbc-act { width: 100%; }`;
  const js = `
window.choisir = function (nom) {
  document.querySelectorAll('.${P}-on').forEach(function (o) { o.setAttribute('aria-pressed', String(o.dataset.choix === nom)); });
  document.querySelectorAll('[data-et]').forEach(function (e) { e.hidden = e.dataset.et !== nom; });
  SBC.majBiere(document.querySelector('.${P}-mb [data-biere]'), nom);
};
${B.JS_CHOIX('Nelson Sauvin')}`;
  return B.page({ id: P, chaleur: 'chaude', idee: 'l’étiquette du sac : les vraies valeurs imprimées, le tampon de la dose, l’étagère', corps, css, js });
}
