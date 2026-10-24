// flc8 · chaude · les mots tamponnés : chaque mot est une tuile, d'autant plus large que plus de fiches le disent ; les
// fiches qui le disent y laissent leur tampon (auteur, année). Ce que personne ne dit a sa tuile aussi, hachurée. Un mot
// hors des 12 familles a sa tuile au même titre, en noir et blanc.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as C from '../flc1/commun-c.mjs';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const P = 'flc8', { esc, ic, pic, COURT, JET } = C;
const DEF = 'Cascade';
const ROT = [-7, 5, -3, 8];

function grille(h) {
  const X = C.H[h];
  const span = (m) => (m.n === X.N && X.N > 1 ? 6 : m.n / X.N >= 0.5 && X.N > 2 ? 3 : X.N === 1 ? 3 : 2);
  const sty = [...X.mots].sort((a, b) => (C.STYLE16D.includes(b.fam) - C.STYLE16D.includes(a.fam)) || b.n - a.n || (b.gout - a.gout));
  const abs = [...X.mots].sort((a, b) => b.n - a.n || (b.gout - a.gout));
  const tuile = (m) => {
    const f = m.fam, s16 = C.STYLE16D.includes(f);
    const st = f ? ` data-famille="${f}" style="--b:${JET[f].base};--t:${JET[f].texte};--f:${JET[f].fond};` : ' style="';
    return `<div class="${P}-t${f ? '' : ' ' + P + '-hors'}${m.gout ? '' : ' ' + P + '-cat'}${s16 ? ' ' + P + '-s16' : ''}"${st}grid-column:span ${span(m)};--os:${sty.indexOf(m) + 1};--oa:${abs.indexOf(m) + 1}">
      <span class="${P}-tn">${f ? pic(f, 16) : `<i class="${P}-ho" aria-hidden="true"></i>`}<b class="mono">${m.n}/${X.N}</b></span>
      <span class="${P}-tw${(m.gout ? m.fr : m.par[0].orig).length > (span(m) === 2 ? 9 : 16) ? ' ' + P + '-long' : ''}">${esc(m.gout ? m.fr : m.par[0].orig)}</span>${m.gout ? '' : `<span class="${P}-tr">rangé par le fournisseur</span>`}
      <span class="${P}-tps">${m.par.map((p, i) => `<span class="${P}-tp${p.nature === 'mot' ? '' : ' ' + P + '-tpc'}${p.an ? '' : ' ' + P + '-tpi'}" style="--r:${ROT[(i + m.fr.length) % 4]}deg">${esc(C.COURTSRC[p.src] || p.src)} ${p.an || '?'}</span>`).join('')}</span></div>`;
  };
  const nd = C.ORDRE.filter((f) => !X.fam[f].n);
  return `<div class="${P}-g">
    <div class="${P}-zo" data-role="zone" style="--os:0"><i aria-hidden="true"></i>ta 16D accueille d’abord floral, herbacé, terreux${X.mots.some((m) => C.STYLE16D.includes(m.fam)) ? '' : ' : rien ici'}</div>
    ${X.mots.map(tuile).join('')}
    ${nd.map((f) => `<div class="${P}-t ${P}-nd" style="grid-column:span 2;--os:90;--oa:90"><span>${COURT[f]}</span><small>personne</small></div>`).join('')}</div>`;
}

function fiche(h) {
  const X = C.H[h];
  return `<div class="${P}-tete">${C.radar(h, { P, r: 44, lab: 34, labv: 15, nn: false, ecart: 0.24 })}<div class="${P}-id">${C.nomH(h, P + '-nom')}<div>${C.alpha(h, P)}</div><div class="${P}-l3">${C.role(h, P + '-us')}${C.stock(h, P + '-stk')}</div></div></div>
  <div class="${P}-bar"><span class="${P}-enc">${X.fiches.map((s) => `<span><b>${esc(C.COURTSRC[s.src] || s.src)}</b> ${esc(s.src.replace(' (boutique US)', ' US'))} ${s.an || '?'}</span>`).join('')}</span>${C.lentille(P)}${C.legB(P)}</div>
  ${grille(h)}`;
}

const corps = `<div class="${P}-feuille" role="dialog" aria-label="Fiche du houblon">${C.croix(P)}${C.sections(P, DEF, fiche)}${C.choix(P, DEF)}</div>`;

const css = `
  .${P}-feuille { position: relative; padding: 10px 12px 20px; }
  .${P}-x { position: absolute; right: 10px; top: 10px; width: 36px; height: 36px; border-radius: 50%; background: #eceef1; display: inline-flex; align-items: center; justify-content: center; z-index: 5; }
  .${P}-tete { display: flex; align-items: center; gap: 4px; }
  .${P}-radar { flex: none; margin: 4px 14px 0 8px; }
  .${P}-rl { font: 600 10.5px var(--sans); fill: #2b2d33; } .${P}-rl.inc { fill: #6b6f78; font-weight: 400; }
  .${P}-id { display: flex; flex-direction: column; gap: 3px; padding-top: 20px; min-width: 0; }
  .${P}-nom { font-size: 26px; font-weight: 700; line-height: 1.05; }
  .${P}-al { display: flex; flex-direction: column; }
  .${P}-alg { font-size: 14px; color: #4a4d55; } .${P}-alg b { font-size: 21px; color: #16161a; font-weight: 600; }
  .${P}-all { font-size: 12px; color: #5d6069; max-width: 190px; }
  .${P}-l3 { display: flex; gap: 8px; align-items: center; }
  .${P}-us { font-size: 13px; padding: 1px 9px; border-radius: 999px; box-shadow: inset 0 0 0 1px #9a9ca4; }
  .${P}-stk { display: inline-flex; align-items: center; gap: 3px; font-size: 12px; color: #5d6069; }
  .${P}-bar { display: flex; align-items: center; gap: 6px; margin: 6px 0 8px; }
  .${P}-enc { flex: 1; display: flex; flex-direction: column; font-size: 12px; color: #3b3d45; line-height: 1.25; }
  .${P}-enc b { font-family: var(--mono); color: #16161a; }
  .${P}-g { display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; }
  .${P}-g > * { order: var(--os); }
  body.abs .${P}-g > * { order: var(--oa); }
  .${P}-zo { grid-column: span 6; display: flex; align-items: center; gap: 6px; font-size: 12px; color: #3b3d45; }
  .${P}-zo i { width: 18px; height: 12px; border-radius: 2px; background: #16161a; }
  body.abs .${P}-zo { display: none; }
  .${P}-t { position: relative; min-height: 64px; border-radius: 8px; background: var(--f); box-shadow: inset 0 0 0 1.5px var(--b); padding: 6px 8px 24px; display: flex; flex-direction: column; overflow: hidden; }
  .${P}-t.${P}-s16::after { content: '16D'; position: absolute; top: 0; right: 0; font: 700 10px/1 var(--sans); color: #fff; background: #16161a; padding: 3px 5px; border-radius: 0 8px 0 4px; }
  body.abs .${P}-t.${P}-s16::after { display: none; }
  .${P}-tn { display: flex; align-items: center; gap: 4px; }
  .${P}-tn b { font-size: 12px; color: #16161a; }
  .${P}-tw { font-size: 19px; font-weight: 700; color: var(--t); line-height: 1.05; margin-top: 2px; }
  .${P}-t[style*="span 6"] .${P}-tw { font-size: 30px; }
  .${P}-t[style*="span 3"] .${P}-tw { font-size: 23px; }
  .${P}-t .${P}-tw.${P}-long { font-size: 16px; }
  .${P}-t.${P}-hors { background: #fff; box-shadow: inset 0 0 0 2.5px #16161a; }
  .${P}-t.${P}-hors .${P}-tw { color: #16161a; }
  .${P}-t.${P}-cat { background: #fff; box-shadow: inset 0 0 0 1px var(--b, #8b8e97); }
  .${P}-t.${P}-cat .${P}-tw { font-weight: 400; font-style: italic; font-size: 17px; }
  .${P}-tr { font-size: 12px; color: #4a4d55; }
  .${P}-ho { width: 16px; height: 16px; border-radius: 50%; box-shadow: inset 0 0 0 1.5px #3b3d45; flex: none; }
  .${P}-tps { position: absolute; right: 6px; bottom: 5px; display: flex; gap: 4px; }
  .${P}-tp { font: 700 11px/1 var(--mono); color: #16161a; padding: 3px 4px; border-radius: 2px; box-shadow: inset 0 0 0 1.5px #16161a; background: #fff; transform: rotate(var(--r)); white-space: nowrap; }
  .${P}-tp.${P}-tpc { box-shadow: inset 0 0 0 1px #6b6f78; color: #3b3d45; font-weight: 500; }
  .${P}-tp.${P}-tpi { text-decoration: underline dotted; }
  .${P}-nd { min-height: 44px; padding: 5px 8px; background: repeating-linear-gradient(135deg, #fff 0 4px, #e4e5e9 4px 6px); box-shadow: inset 0 0 0 1px #b4b6bd; }
  .${P}-nd span { font-size: 13px; font-weight: 600; color: #3b3d45; background: #fff; align-self: flex-start; padding: 0 3px; border-radius: 2px; }
  .${P}-nd small { font-size: 12px; color: #3b3d45; background: #fff; align-self: flex-start; padding: 0 3px; border-radius: 2px; }
  .${P}-hs { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 12px; }
  .${P}-hb { height: 28px; padding: 0 10px; border-radius: 999px; box-shadow: inset 0 0 0 1px #c9cad0; font-size: 13px; }
  .${P}-hb[aria-pressed="true"] { box-shadow: inset 0 0 0 1.5px #16161a; }
  .${P}-hb .hn { display: inline-flex; align-items: center; gap: 5px; font-weight: 600; }
  .${P}-hp { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }`;

C.ecrire(path.join(ICI, 'etat.html'), C.page({ id: P, chaleur: 'chaude', titre: 'les mots tamponnés', resume: 'une tuile par mot, large selon le nombre de fiches, tamponnée par ses sources', corps, css }));
