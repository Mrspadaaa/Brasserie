// flc3 · tiède · la table « qui dit quoi » : une ligne par mot, une colonne par fiche (auteur et année), une case
// pleine si la fiche dit le mot, creuse si elle ne fait que ranger le houblon sous ce nom, vide sinon. Le compte
// « 2/2 » au bout. Ce que le radar ne sait pas dessiner (les mots hors des 12 familles) a ses lignes comme les autres.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as C from '../flc1/commun-c.mjs';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const P = 'flc3', { esc, ic, pic, COURT, JET } = C;
const DEF = 'Nelson Sauvin';

function table(h) {
  const X = C.H[h], N = X.N;
  const cell = (m, s) => {
    const p = m.par.find((x) => x.src === s.src), f = m.fam;
    if (!p) return `<td class="${P}-c vide"><i aria-hidden="true"></i><span class="sr">non cité</span></td>`;
    const st = f ? ` data-famille="${f}" style="--b:${JET[f].base}"` : '';
    return `<td class="${P}-c${p.nature === 'mot' ? ' plein' : ' creux'}${f ? '' : ' hors'}"${st}><i aria-hidden="true"></i><span class="sr">${p.nature === 'mot' ? 'cité' : p.nature}</span>${p.rang === 1 ? `<b class="${P}-r1" aria-label="nommé en premier">1<sup>er</sup></b>` : ''}</td>`;
  };
  const ordS = (a, b) => (C.STYLE16D.includes(b.fam) - C.STYLE16D.includes(a.fam)) || b.n - a.n || (b.gout - a.gout);
  const ordA = (a, b) => b.n - a.n || (b.gout - a.gout);
  const sty = [...X.mots].sort(ordS), abs = [...X.mots].sort(ordA);
  const n16 = X.mots.filter((m) => C.STYLE16D.includes(m.fam)).length;
  const rows = X.mots.map((m) => {
    const f = m.fam, tr = m.par.find((p) => p.en && p.orig.toLowerCase() !== m.fr);
    return `<tr class="${P}-tr${C.STYLE16D.includes(f) ? ' s16' : ''}${m.gout ? '' : ' cat'}" style="--os:${sty.indexOf(m) + (C.STYLE16D.includes(f) ? 1 : 2)};--oa:${abs.indexOf(m) + 1}">
      <th class="${P}-mot">${f ? `<span data-famille="${f}">${pic(f, 16)}</span>` : `<i class="${P}-ho" aria-hidden="true"></i>`}<span><b${f ? ` style="color:${JET[f].texte}"` : ''}>${esc(m.gout ? m.fr : m.par[0].orig)}</b>${tr ? `<small>« ${esc(tr.orig)} »</small>` : m.gout ? '' : '<small>rangement, pas un mot</small>'}</span></th>
      ${X.fiches.map((s) => cell(m, s)).join('')}<td class="${P}-n mono"><b>${m.n}</b>/${N}</td></tr>`;
  }).join('');
  const tous = X.mots.filter((m) => m.n === N && m.gout), tousH = tous.filter((m) => !m.fam);
  const nd = C.ORDRE.filter((f) => !X.fam[f].n);
  return `<p class="${P}-dit"><b class="mono">${tous.length}</b><span>mot${tous.length > 1 ? 's' : ''} dit${tous.length > 1 ? 's' : ''} par ${N === 1 ? 'sa seule fiche' : N === 2 ? 'ses 2 fiches' : 'ses ' + N + ' fiches'}${tousH.length ? `<em>dont ${tousH.length} hors des 12 familles : le radar ne les dessine pas</em>` : '<em>tous rangés dans les 12 familles</em>'}</span></p>
  <table class="${P}-t"><thead><tr><th class="${P}-mot">${C.lentille(P)}</th>${X.fiches.map((s) => `<th class="${P}-fh"><span>${esc(C.COURTSRC[s.src] || s.src)}</span><small>${s.an || '?'}</small></th>`).join('')}<th class="${P}-fh tot"><span>fiches</span></th></tr></thead>
  <tbody><tr class="${P}-zo" data-role="zone" style="--os:0"><td colspan="${N + 2}"><span>ta 16D accueille floral, herbacé, terreux</span>${n16 ? '' : `<em> : aucune fiche ne les cite</em>`}</td></tr>${rows}</tbody></table>
  <p class="${P}-pers"><b>Personne ne dit</b>${nd.map((f) => `<span><i class="${P}-hc" aria-hidden="true"></i>${COURT[f]}</span>`).join('')}</p>
  <p class="${P}-qui">${X.fiches.map((s) => `<span><b>${esc(C.COURTSRC[s.src] || s.src)}</b> ${esc(s.src)} ${s.an || ', année absente du dépôt'}</span>`).join('')}</p>`;
}

function fiche(h) {
  const X = C.H[h];
  return `<header class="${P}-tete"><div class="${P}-g">${C.nomH(h, P + '-nom')}
      <div class="${P}-l2">${C.alpha(h, P)}</div><div class="${P}-l3">${C.role(h, P + '-us')}${C.stock(h, P + '-stk')}<span class="${P}-or">${esc(X.origine)}</span></div></div>
    ${C.radar(h, { P, r: 44, lab: 40, labv: 16, nn: false, ecart: 0.22 })}</header>
  ${table(h)}`;
}

const corps = `
<div class="${P}-haut"><i class="${P}-poi" aria-hidden="true"></i>${C.choix(P, DEF)}${C.legB(P)}${C.croix(P)}</div>
<div class="${P}-corps" role="dialog" aria-label="Fiche du houblon">${C.sections(P, DEF, fiche)}</div>`;

const css = `
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
  .${P}-haut { position: sticky; top: 0; z-index: 3; background: #fff; display: flex; align-items: center; gap: 6px; padding: 14px 10px 6px 12px; box-shadow: 0 1px 0 #e4e5e9; }
  .${P}-poi { position: absolute; left: 50%; top: 5px; width: 36px; height: 4px; margin-left: -18px; border-radius: 2px; background: #c9cad0; }
  .${P}-hs { display: flex; gap: 2px; overflow-x: auto; flex: 1; scrollbar-width: none; }
  .${P}-hb { height: 30px; padding: 0 8px; border-radius: 4px; font-size: 13px; color: #4a4d55; white-space: nowrap; }
  .${P}-hb[aria-pressed="true"] { background: #16161a; color: #fff; }
  .${P}-hb .hn { display: inline-flex; align-items: center; gap: 4px; font-weight: 600; }
  .${P}-hp { width: 8px; height: 8px; border-radius: 50%; display: inline-block; box-shadow: 0 0 0 1.5px #fff; }
  .${P}-x { width: 34px; height: 34px; border-radius: 50%; background: #eceef1; display: inline-flex; align-items: center; justify-content: center; flex: none; }
  .${P}-corps { padding: 6px 12px 20px; }
  .${P}-tete { display: flex; align-items: center; justify-content: space-between; }
  .${P}-g { display: flex; flex-direction: column; gap: 3px; }
  .${P}-nom { font-size: 26px; font-weight: 700; }
  .${P}-al { display: inline-flex; align-items: baseline; gap: 6px; flex-wrap: wrap; }
  .${P}-alg { font-size: 14px; color: #4a4d55; } .${P}-alg b { font-size: 20px; color: #16161a; font-weight: 600; }
  .${P}-all { font-size: 12px; color: #5d6069; }
  .${P}-l3 { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .${P}-us { font-size: 13px; padding: 1px 9px; border-radius: 999px; box-shadow: inset 0 0 0 1px #9a9ca4; }
  .${P}-stk { display: inline-flex; align-items: center; gap: 3px; font-size: 12px; color: #5d6069; }
  .${P}-or { font-size: 12px; color: #5d6069; }
  .${P}-radar { flex: none; margin-right: -14px; }
  .${P}-rl { font: 600 10.5px var(--sans); fill: #2b2d33; } .${P}-rl.inc { fill: #6b6f78; font-weight: 400; }
  .${P}-dit { display: flex; align-items: center; gap: 10px; margin: 8px 0 6px; padding: 8px 10px; border-radius: 8px; background: #16161a; color: #fff; }
  .${P}-dit > b { font-size: 34px; line-height: 1; }
  .${P}-dit span { font-size: 15px; font-weight: 600; line-height: 1.2; }
  .${P}-dit em { display: block; font-style: normal; font-weight: 400; font-size: 13px; color: #e4e5e9; }
  .${P}-t { width: 100%; border-collapse: separate; border-spacing: 0; }
  .${P}-t tbody { display: flex; flex-direction: column; }
  .${P}-t thead tr, .${P}-t tbody tr { display: grid; grid-template-columns: 1fr repeat(var(--nf), 46px) 46px; align-items: center; }
  .${P}-t tbody tr { order: var(--os); border-top: 1px solid #e4e5e9; min-height: 40px; }
  body.abs .${P}-t tbody tr { order: var(--oa); }
  .${P}-t thead th { padding-bottom: 4px; }
  .${P}-t thead .${P}-mot { text-align: left; }
  .${P}-fh { display: flex; flex-direction: column; align-items: center; font: 600 12px/1.1 var(--mono); color: #16161a; }
  .${P}-fh.tot { font: 600 12px var(--sans); color: #4a4d55; }
  .${P}-fh small { font: 400 12px var(--mono); color: #5d6069; }
  .${P}-mot { display: flex; align-items: center; gap: 6px; text-align: left; font-weight: 400; padding: 3px 0; }
  .${P}-mot > span:last-child:not(.seg) { display: flex; flex-direction: column; line-height: 1.15; }
  .${P}-mot b { font-size: 16px; font-weight: 700; }
  .${P}-mot small { font-size: 12px; color: #5d6069; }
  .${P}-tr.cat .${P}-mot b { font-weight: 400; color: #4a4d55 !important; }
  .${P}-ho { width: 16px; height: 16px; border-radius: 50%; box-shadow: inset 0 0 0 1.5px #3b3d45; flex: none; }
  .${P}-c { position: relative; display: flex; justify-content: center; align-items: center; height: 100%; }
  .${P}-c i { width: 30px; height: 22px; border-radius: 4px; display: block; }
  .${P}-c.plein i { background: var(--b, #3b3d45); }
  .${P}-c.plein.hors i { background: #3b3d45; }
  .${P}-c.creux i { box-shadow: inset 0 0 0 2px var(--b, #3b3d45); background: #fff; }
  .${P}-c.vide i { background: #f1f2f4; }
  .${P}-r1 { position: absolute; top: 2px; right: 0; font: 700 11px/1 var(--sans); color: #16161a; background: #fff; border-radius: 2px; padding: 1px 2px; box-shadow: 0 0 0 1px #16161a; }
  
  .${P}-n { text-align: center; font-size: 13px; color: #4a4d55; } .${P}-n b { font-size: 17px; color: #16161a; }
  .${P}-tr.s16 { box-shadow: inset 3px 0 0 #16161a; padding-left: 6px; }
  body.abs .${P}-tr.s16 { box-shadow: none; padding-left: 0; }
  .${P}-zo { display: block !important; border-top: 0 !important; min-height: 0 !important; }
  .${P}-zo td { display: block; font-size: 12px; font-weight: 600; color: #3b3d45; padding: 3px 0 3px 8px; box-shadow: inset 3px 0 0 #16161a; }
  .${P}-zo em { font-style: normal; font-weight: 400; color: #5d6069; }
  body.abs .${P}-zo { display: none !important; }
  .${P}-lent { transform-origin: left center; }
  .${P}-lent button { height: 24px !important; padding: 0 7px !important; }
  .${P}-pers { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 9px; font-size: 13px; color: #4a4d55; margin-top: 8px; padding-top: 6px; border-top: 1px solid #e4e5e9; }
  .${P}-pers b { color: #16161a; font-size: 13px; }
  .${P}-pers span { display: inline-flex; align-items: center; gap: 3px; }
  .${P}-hc { width: 12px; height: 12px; border-radius: 2px; background: repeating-linear-gradient(135deg, #fff 0 2px, #9aa0ab 2px 3.5px); box-shadow: inset 0 0 0 1px #8a909b; }
  .${P}-qui { display: flex; flex-direction: column; gap: 1px; margin-top: 6px; font-size: 12px; color: #4a4d55; }
  .${P}-qui b { font-family: var(--mono); color: #16161a; display: inline-block; min-width: 40px; }`;

const corpsN = corps.split('<div class="' + P + '-corps"').join('<div class="' + P + '-corps"');
const js = `(function () {
  const nf = () => { const s = document.querySelector('.${P}-sec:not([hidden])'); if (s) s.querySelectorAll('.${P}-t').forEach((t) => t.style.setProperty('--nf', t.querySelectorAll('thead .${P}-fh').length - 1)); };
  document.querySelectorAll('.${P}-t').forEach((t) => t.style.setProperty('--nf', t.querySelectorAll('thead .${P}-fh').length - 1));
  document.addEventListener('houblon', nf);
})();`;
C.ecrire(path.join(ICI, 'etat.html'), C.page({ id: P, chaleur: 'tiède', titre: 'qui dit quoi', resume: 'table mots × fiches, année en tête de colonne', corps: corpsN, css, js }));
