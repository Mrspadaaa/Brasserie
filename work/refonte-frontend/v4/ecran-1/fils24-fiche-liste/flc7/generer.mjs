// flc7 · chaude · la pile de fiches : chaque fiche lue est une carte posée sur la table, avec son tampon (auteur, année)
// et ses mots écrits sur les lignes, à la couleur de leur famille, dans son ordre. Un mot qu'une autre carte dit aussi
// porte un trombone. Une seule carte, c'est une seule voix : la place vide de la deuxième se voit (hachurée).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as C from '../flc1/commun-c.mjs';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const P = 'flc7', { esc, ic, pic, COURT, JET } = C;
const DEF = 'Citra cryo';
const ROT = [-1.6, 1.2, -0.8, 1.6];

function carte(h, s, i) {
  const X = C.H[h];
  const mots = X.mots.flatMap((m) => m.par.filter((p) => p.src === s.src).map((p) => ({ m, p }))).sort((a, b) => (a.p.nature !== 'mot') - (b.p.nature !== 'mot') || (a.p.rang || 50) - (b.p.rang || 50));
  const ligne = ({ m, p }) => {
    const f = m.fam, autres = m.par.filter((q) => q.src !== s.src);
    return `<li class="${P}-l${p.nature === 'mot' ? '' : ' ' + P + '-cat'}">${f ? `<span data-famille="${f}" style="color:${JET[f].texte}" class="${P}-lw">${pic(f, 16)}${esc(p.nature === 'mot' ? m.fr : p.orig)}</span>` : `<span class="${P}-lw ${P}-hors"><i class="${P}-ho" aria-hidden="true"></i>${esc(p.nature === 'mot' ? m.fr : p.orig)}</span>`}${p.en && p.orig.toLowerCase() !== m.fr ? `<small>« ${esc(p.orig)} »</small>` : ''}${p.nature === 'mot' ? '' : '<small>rangement</small>'}${autres.length ? `<span class="${P}-tr" aria-label="aussi dit par ${esc(autres.map((q) => q.src).join(', '))}">${autres.map((q) => esc(C.COURTSRC[q.src] || q.src)).join(' ')}</span>` : ''}</li>`;
  };
  return `<article class="${P}-c" style="--r:${ROT[i % 4]}deg;z-index:${10 - i}"><header><b>${esc(s.src)}</b><span class="${P}-tp${s.an ? '' : ' ' + P + '-inc'}">${s.an || 'année ?'}</span></header><ol>${mots.map(ligne).join('')}</ol></article>`;
}

function fiche(h) {
  const X = C.H[h];
  const z = C.STYLE16D.map((f) => `<span class="${P}-zf${X.fam[f].n ? '' : ' ' + P + '-zn'}">${X.fam[f].n ? pic(f, 14) : `<i class="${P}-hc" aria-hidden="true"></i>`}${COURT[f]}<b class="mono">${X.fam[f].n ? X.fam[f].n + '/' + X.N : '?'}</b></span>`).join('');
  const vide = X.N === 1 ? `<div class="${P}-c ${P}-vide" style="--r:1.4deg"><span>pas d’autre fiche lue</span><small>une seule voix : à confirmer</small></div>` : '';
  return `<div class="${P}-tete"><div class="${P}-g">${C.nomH(h, P + '-nom')}<div>${C.alpha(h, P)}</div><div class="${P}-l3">${C.role(h, P + '-us')}${C.stock(h, P + '-stk')}</div></div>
    ${C.radar(h, { P, r: 42, lab: 34, labv: 14, nn: false, ecart: 0.24 })}</div>
  <div class="${P}-bar">${C.lentille(P)}<span class="${P}-nb"><b class="mono">${X.N}</b> fiche${X.N > 1 ? 's' : ''} sur la table</span>${C.legB(P)}</div>
  <div class="${P}-zo" data-role="zone"><span>ta 16D accueille</span>${z}</div>
  <div class="${P}-pile">${X.fiches.map((s, i) => carte(h, s, i)).join('')}${vide}</div>
  <p class="${P}-pers"><b>Aucune carte ne dit</b>${C.ORDRE.filter((f) => !X.fam[f].n).map((f) => `<span><i class="${P}-hc" aria-hidden="true"></i>${COURT[f]}</span>`).join('')}</p>`;
}

const corps = `<div class="${P}-feuille" role="dialog" aria-label="Fiche du houblon">${C.croix(P)}${C.sections(P, DEF, fiche)}${C.choix(P, DEF)}</div>`;

const css = `
  .${P}-feuille { position: relative; padding: 12px 14px 20px; }
  .${P}-x { position: absolute; right: 10px; top: 10px; width: 36px; height: 36px; border-radius: 50%; background: #eceef1; display: inline-flex; align-items: center; justify-content: center; z-index: 20; }
  .${P}-tete { display: flex; justify-content: space-between; align-items: flex-end; }
  .${P}-g { display: flex; flex-direction: column; gap: 3px; }
  .${P}-nom { font-size: 28px; font-weight: 700; line-height: 1.05; }
  .${P}-al { display: flex; flex-direction: column; }
  .${P}-alg { font-size: 14px; color: #4a4d55; } .${P}-alg b { font-size: 22px; color: #16161a; font-weight: 600; }
  .${P}-all { font-size: 12px; color: #5d6069; max-width: 190px; }
  .${P}-l3 { display: flex; gap: 8px; align-items: center; }
  .${P}-us { font-size: 13px; padding: 1px 9px; border-radius: 999px; box-shadow: inset 0 0 0 1px #9a9ca4; }
  .${P}-stk { display: inline-flex; align-items: center; gap: 3px; font-size: 12px; color: #5d6069; }
  .${P}-radar { flex: none; margin: 34px 8px 0 0; }
  .${P}-rl { font: 600 10.5px var(--sans); fill: #2b2d33; } .${P}-rl.inc { fill: #6b6f78; font-weight: 400; }
  .${P}-bar { display: flex; align-items: center; gap: 8px; margin: 8px 0 4px; }
  .${P}-nb { flex: 1; text-align: right; font-size: 13px; color: #3b3d45; } .${P}-nb b { font-size: 16px; color: #16161a; }
  .${P}-zo { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 10px; font-size: 13px; padding: 5px 8px; border-radius: 4px; box-shadow: inset 3px 0 0 #16161a; background: #f4f5f7; }
  .${P}-zo > span:first-child { font-size: 12px; font-weight: 700; color: #16161a; }
  .${P}-zf { display: inline-flex; align-items: center; gap: 3px; font-weight: 600; color: #16161a; }
  .${P}-zf b { font-size: 12px; font-weight: 500; color: #3b3d45; }
  .${P}-zf.${P}-zn { color: #5d6069; font-weight: 400; }
  body.abs .${P}-zo { display: none; }
  .${P}-pile { display: flex; flex-direction: column; margin-top: 12px; padding: 0 4px; }
  .${P}-c { position: relative; background: #fff; border-radius: 4px; box-shadow: 0 1px 2px rgba(22,22,26,.18), 0 6px 14px rgba(22,22,26,.10), inset 0 0 0 1px #d4d6dc; transform: rotate(var(--r)); padding: 0 0 6px; }
  .${P}-c + .${P}-c { margin-top: -6px; }
  .${P}-c header { display: flex; align-items: center; justify-content: space-between; padding: 7px 12px 5px; border-bottom: 2px solid #16161a; }
  .${P}-c header b { font-size: 15px; }
  .${P}-tp { font: 700 15px var(--mono); padding: 1px 6px; border-radius: 4px; box-shadow: inset 0 0 0 2px #16161a; transform: rotate(-6deg); color: #16161a; }
  .${P}-tp.${P}-inc { box-shadow: inset 0 0 0 2px #6b6f78; color: #3b3d45; }
  .${P}-c ol { list-style: none; columns: 2; column-gap: 10px; padding: 2px 12px 0; }
  .${P}-l { break-inside: avoid; display: flex; flex-wrap: wrap; align-items: center; gap: 0 6px; min-height: 30px; border-bottom: 1px solid #e4e5e9; padding: 3px 0; }
  .${P}-lw { display: inline-flex; align-items: center; gap: 4px; font-size: 16px; font-weight: 600; }
  .${P}-lw.${P}-hors { color: #16161a; font-weight: 700; }
  .${P}-l.${P}-cat .${P}-lw { font-weight: 400; font-style: italic; }
  .${P}-l small { font-size: 12px; color: #5d6069; flex-basis: 100%; padding-left: 20px; margin-top: -2px; }
  .${P}-ho { width: 14px; height: 14px; border-radius: 50%; box-shadow: inset 0 0 0 1.5px #3b3d45; flex: none; }
  .${P}-tr { font: 600 11px var(--mono); padding: 1px 4px; border-radius: 2px; background: #16161a; color: #fff; margin-left: auto; }
  .${P}-vide { margin-top: 10px !important; min-height: 92px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: repeating-linear-gradient(135deg, #fff 0 5px, #eceef1 5px 7px); box-shadow: inset 0 0 0 1px #b4b6bd; }
  .${P}-vide span { background: #fff; padding: 2px 8px; font-size: 15px; font-weight: 600; color: #16161a; border-radius: 4px; }
  .${P}-vide small { background: #fff; padding: 1px 8px; margin-top: 4px; font-size: 13px; color: #3b3d45; border-radius: 4px; }
  .${P}-pers { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 9px; font-size: 13px; color: #4a4d55; margin-top: 14px; }
  .${P}-pers b { color: #16161a; } .${P}-pers span { display: inline-flex; align-items: center; gap: 3px; }
  .${P}-hc { width: 12px; height: 12px; border-radius: 2px; background: repeating-linear-gradient(135deg, #fff 0 2px, #9aa0ab 2px 3.5px); box-shadow: inset 0 0 0 1px #8a909b; }
  .${P}-hs { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 12px; }
  .${P}-hb { height: 28px; padding: 0 10px; border-radius: 999px; box-shadow: inset 0 0 0 1px #c9cad0; font-size: 13px; }
  .${P}-hb[aria-pressed="true"] { box-shadow: inset 0 0 0 1.5px #16161a; }
  .${P}-hb .hn { display: inline-flex; align-items: center; gap: 5px; font-weight: 600; }
  .${P}-hp { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }`;

C.ecrire(path.join(ICI, 'etat.html'), C.page({ id: P, chaleur: 'chaude', titre: 'la pile de fiches', resume: 'chaque fiche une carte tamponnée, ses mots sur les lignes', corps, css }));
