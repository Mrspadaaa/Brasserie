// flc4 · tiède · la fermeture éclair : à gauche Beer Maverick 2023, ses mots dans l'ordre de sa fiche ; à droite les
// autres fiches (Hopsteiner 2025…), leurs mots tels qu'écrits ; au milieu, ce que le brasseur lit, un mot par idée, relié
// à qui le dit. Deux fils sur un mot : les deux fiches s'accordent. Le radar trône entre les deux fiches, au-dessus.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as C from '../flc1/commun-c.mjs';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const P = 'flc4', { esc, ic, pic, COURT, JET } = C;
const DEF = 'Motueka';
const RH = 34, XL = 112, XC0 = 138, XC1 = 252, XR = 278, W = 390 - 20;

function zip(h) {
  const X = C.H[h], bm = X.fiches[0], autres = X.fiches.slice(1);
  const gauche = X.mots.flatMap((m) => m.par.filter((p) => p.src === bm.src).map((p) => ({ m, p }))).sort((a, b) => (a.p.rang || 50) - (b.p.rang || 50));
  const droite = X.mots.flatMap((m) => m.par.filter((p) => p.src !== bm.src).map((p) => ({ m, p }))).sort((a, b) => (a.p.nature !== 'mot') - (b.p.nature !== 'mot') || autres.findIndex((s) => s.src === a.p.src) - autres.findIndex((s) => s.src === b.p.src) || (a.p.rang || 50) - (b.p.rang || 50));
  const centre = [...X.mots];
  const n = Math.max(gauche.length, droite.length, centre.length, 3), Hh = n * RH;
  const y = (i) => i * RH + RH / 2;
  const coul = (m) => (m.fam ? JET[m.fam].base : '#3b3d45');
  const fil = (x0, y0, x1, y1, m, faible) => `<path d="M${x0},${y0} C${(x0 + x1) / 2},${y0} ${(x0 + x1) / 2},${y1} ${x1},${y1}" fill="none" stroke="${faible ? '#b4b6bd' : coul(m)}" stroke-width="${faible ? 1.5 : 2.5}"${m.fam ? ` data-famille="${m.fam}"` : ''}/>`;
  const fils = [
    ...gauche.map((g, i) => fil(XL, y(i), XC0, y(centre.indexOf(g.m)), g.m, g.p.nature !== 'mot')),
    ...droite.map((d, i) => fil(XC1, y(centre.indexOf(d.m)), XR, y(i), d.m, d.p.nature !== 'mot')),
  ].join('');
  const item = (x, cote) => `<span class="${P}-it ${P}-i${cote}${x.p.nature === 'mot' ? '' : ' cat'}">${cote === 'd' && x.p.src !== (autres[0] || {}).src ? C.marque(P, x.p) : ''}<span class="${P}-iw">${esc(x.p.nature === 'mot' ? x.m.fr : x.p.orig)}${x.p.en && x.p.orig.toLowerCase() !== x.m.fr ? `<em>« ${esc(x.p.orig)} »</em>` : ''}</span>${x.p.nature === 'mot' ? `<small>${x.p.rang}</small>` : `<small class="${P}-rg">rangé</small>`}</span>`;
  const puce = (m) => {
    const f = m.fam, s16 = C.STYLE16D.includes(f);
    return `<span class="${P}-p${f ? '' : ' hors'}${s16 ? ' s16' : ''}${m.n === X.N && X.N > 1 ? ' tous' : ''}${m.gout ? '' : ' cat'}"${f ? ` data-famille="${f}" style="--b:${JET[f].base};--t:${JET[f].texte};--f:${JET[f].fond}"` : ''}>${f ? pic(f, 14) : `<i class="${P}-ho" aria-hidden="true"></i>`}<span>${esc(m.gout ? m.fr : m.par[0].orig.toLowerCase())}</span></span>`;
  };
  const vide = !autres.length ? `<span class="${P}-vd" style="top:0;height:${Hh}px"><span>aucune autre fiche lue</span></span>` : '';
  return `<div class="${P}-zip" style="height:${Hh}px">
    <svg class="${P}-fils" width="${W}" height="${Hh}" viewBox="0 0 ${W} ${Hh}" aria-hidden="true">${fils}</svg>
    <div class="${P}-col ${P}-cg">${gauche.map((x) => item(x, 'g')).join('')}</div>
    <div class="${P}-col ${P}-cc">${centre.map(puce).join('')}</div>
    <div class="${P}-col ${P}-cd">${droite.map((x) => item(x, 'd')).join('')}</div>${vide}
  </div>`;
}

function fiche(h) {
  const X = C.H[h], bm = X.fiches[0], autres = X.fiches.slice(1);
  const accord = X.mots.filter((m) => m.n === X.N && X.N > 1);
  const nd = C.ORDRE.filter((f) => !X.fam[f].n);
  const tete = (s, cote) => `<div class="${P}-fi ${P}-f${cote}"><b>${esc(s.src.replace(' (boutique US)', ' US'))}</b><span class="mono">${s.an || 'année ?'}</span><small>${s.n} mots</small></div>`;
  return `<div class="${P}-id"><div>${C.nomH(h, P + '-nom')}<div class="${P}-l2">${C.alpha(h, P)}</div><div class="${P}-l3">${C.role(h, P + '-us')}${C.stock(h, P + '-stk')}</div></div>${C.croix(P)}</div>
  <div class="${P}-duo">${tete(bm, 'g')}${C.radar(h, { P, r: 44, lab: 42, labv: 16, nn: false, ecart: 0.2 })}${autres.length ? `<div class="${P}-fi ${P}-fd">${autres.map((s) => `<b>${esc(s.src.replace(' (boutique US)', ' US').replace('Yakima Chief Hops', 'Yakima Chief'))}</b><span>${s.an || 'année ?'}</span><small>${s.n} mots</small>`).join('')}</div>` : `<div class="${P}-fi ${P}-fd ${P}-fnone"><b>Aucune autre</b><span>une seule voix</span></div>`}</div>
  <div class="${P}-bar">${C.lentille(P)}<span class="${P}-zo" data-role="zone"><i aria-hidden="true"></i>ta 16D accueille floral, herbacé, terreux</span>${C.legB(P)}</div>
  <p class="${P}-som">${accord.length ? `<b>${accord.length}</b> idée${accord.length > 1 ? 's' : ''} sur ${X.mots.length} dite${accord.length > 1 ? 's' : ''} par ${X.N === 2 ? 'les deux' : 'toutes'} : deux fils` : `<b>${X.mots.length}</b> idées, ${X.N > 1 ? 'aucune dite par toutes ses fiches' : 'une seule fiche pour les dire'}`}</p>
  ${zip(h)}
  <p class="${P}-nd"><b>Aucune fiche</b>${nd.map((f) => `<span><i class="${P}-hc" aria-hidden="true"></i>${COURT[f]}</span>`).join('')}</p>`;
}

const corps = `<div class="${P}-feuille" role="dialog" aria-label="Fiche du houblon"><i class="${P}-poi" aria-hidden="true"></i>
  ${C.sections(P, DEF, fiche)}
  ${C.choix(P, DEF)}</div>`;

const css = `
  html, body { background: #e4e5e9; }
  .${P}-feuille { background: #fff; margin-top: 26px; border-radius: 24px 24px 0 0; padding: 10px 10px 18px; min-height: 818px; }
  .${P}-poi { display: block; width: 36px; height: 4px; border-radius: 2px; background: #c9cad0; margin: 0 auto 4px; }
  .${P}-id { display: flex; justify-content: space-between; align-items: flex-start; padding: 0 2px; }
  .${P}-nom { font-size: 24px; font-weight: 700; }
  .${P}-l2 { margin-top: 1px; } .${P}-l3 { display: flex; align-items: center; gap: 8px; margin-top: 3px; }
  .${P}-al { display: inline-flex; align-items: baseline; gap: 6px; flex-wrap: wrap; }
  .${P}-alg { font-size: 14px; color: #4a4d55; } .${P}-alg b { font-size: 20px; color: #16161a; font-weight: 600; }
  .${P}-all { font-size: 12px; color: #5d6069; }
  .${P}-us { font-size: 13px; padding: 1px 9px; border-radius: 999px; box-shadow: inset 0 0 0 1px #9a9ca4; }
  .${P}-stk { display: inline-flex; align-items: center; gap: 3px; font-size: 12px; color: #5d6069; }
  .${P}-x { width: 36px; height: 36px; border-radius: 50%; background: #eceef1; display: inline-flex; align-items: center; justify-content: center; flex: none; }
  .${P}-duo { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; margin-top: 2px; }
  .${P}-fi { display: flex; flex-direction: column; gap: 1px; font-size: 13px; }
  .${P}-fi.${P}-fd { align-items: flex-end; text-align: right; }
  .${P}-fi b { font-size: 15px; } .${P}-fi span { font-size: 13px; color: #3b3d45; } .${P}-fi small { font-size: 12px; color: #5d6069; }
  .${P}-fi.${P}-fnone b { color: #5d6069; }
  .${P}-rl { font: 600 10.5px var(--sans); fill: #2b2d33; } .${P}-rl.inc { fill: #6b6f78; font-weight: 400; }
  .${P}-bar { display: flex; align-items: center; gap: 8px; margin: 4px 0; }
  .${P}-zo { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: #3b3d45; flex: 1; line-height: 1.1; }
  .${P}-zo i { width: 18px; height: 12px; border-radius: 999px; outline: 2px solid #16161a; outline-offset: -1px; flex: none; }
  body.abs .${P}-zo { visibility: hidden; }
  .${P}-som { font-size: 14px; color: #3b3d45; text-align: center; margin: 2px 0 6px; }
  .${P}-som b { font: 600 18px var(--mono); color: #16161a; }
  .${P}-zip { position: relative; }
  .${P}-fils { position: absolute; left: 0; top: 0; }
  .${P}-col { position: absolute; top: 0; display: flex; flex-direction: column; }
  .${P}-col.${P}-cg { left: 0; width: ${XL}px; align-items: flex-end; }
  .${P}-col.${P}-cc { left: ${XC0}px; width: ${XC1 - XC0}px; align-items: center; }
  .${P}-col.${P}-cd { left: ${XR}px; width: ${W - XR}px; align-items: flex-start; }
  .${P}-it { height: ${RH}px; display: inline-flex; align-items: center; gap: 3px; font-size: 13px; color: #16161a; white-space: nowrap; }
  .${P}-it.${P}-ig { flex-direction: row-reverse; padding-right: 4px; }
  .${P}-it.${P}-id { padding-left: 4px; }
  .${P}-iw { display: inline-flex; flex-direction: column; line-height: 1.05; }
  .${P}-ig .${P}-iw { align-items: flex-end; }
  .${P}-iw em { font-style: normal; font-size: 11px; color: #5d6069; }
  .${P}-it small { font: 500 11px var(--mono); color: #5d6069; min-width: 12px; text-align: center; }
  .${P}-it .${P}-rg { font: 400 11px var(--sans); }
  .${P}-it.cat .${P}-iw { color: #4a4d55; font-style: italic; }
  .${P}-sm { display: inline-flex; align-items: baseline; font: 600 10px/1 var(--mono); color: #16161a; padding: 2px 3px; border-radius: 2px; background: #e2e4e8; }
  .${P}-sm sup { font-size: 8px; }
  .${P}-p { height: ${RH - 6}px; margin: 3px 0; display: inline-flex; align-items: center; gap: 3px; padding: 0 8px 0 5px; border-radius: 999px; background: var(--f); color: var(--t); box-shadow: inset 0 0 0 1px var(--b); font-size: 13px; font-weight: 600; white-space: nowrap; max-width: ${XC1 - XC0}px; overflow: hidden; }
  .${P}-p.tous { box-shadow: inset 0 0 0 2px var(--b); font-weight: 700; }
  .${P}-p.hors { background: #fff; color: #16161a; box-shadow: inset 0 0 0 1.5px #3b3d45; }
  .${P}-p.cat { background: #fff; font-weight: 400; }
  .${P}-p.s16 { outline: 2px solid #16161a; outline-offset: 1px; }
  body.abs .${P}-p.s16 { outline: 0; }
  .${P}-ho { width: 12px; height: 12px; border-radius: 50%; box-shadow: inset 0 0 0 1.5px #3b3d45; flex: none; }
  .${P}-vd { position: absolute; left: ${XR}px; right: 0; display: flex; align-items: center; justify-content: center; border-radius: 8px; background: repeating-linear-gradient(135deg, #fff 0 4px, #e4e5e9 4px 6px); }
  .${P}-vd span { background: #fff; padding: 2px 6px; font-size: 13px; color: #3b3d45; border-radius: 4px; }
  .${P}-nd { display: flex; flex-wrap: wrap; align-items: center; gap: 3px 9px; font-size: 13px; color: #4a4d55; margin-top: 8px; padding-top: 6px; border-top: 1px solid #e4e5e9; }
  .${P}-nd b { color: #16161a; }
  .${P}-nd span { display: inline-flex; align-items: center; gap: 3px; }
  .${P}-hc { width: 12px; height: 12px; border-radius: 2px; background: repeating-linear-gradient(135deg, #fff 0 2px, #9aa0ab 2px 3.5px); box-shadow: inset 0 0 0 1px #8a909b; }
  .${P}-hs { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 10px; }
  .${P}-hb { height: 28px; padding: 0 10px; border-radius: 999px; box-shadow: inset 0 0 0 1px #c9cad0; font-size: 13px; }
  .${P}-hb[aria-pressed="true"] { box-shadow: inset 0 0 0 1.5px #16161a; }
  .${P}-hb .hn { display: inline-flex; align-items: center; gap: 5px; font-weight: 600; }
  .${P}-hp { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }`;

C.ecrire(path.join(ICI, 'etat.html'), C.page({ id: P, chaleur: 'tiède', titre: 'la fermeture éclair', resume: 'les mots de chaque fiche, reliés à l’idée qu’ils disent', corps, css, fond: '#e4e5e9' }));
