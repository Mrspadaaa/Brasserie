// flc1 · froide · g1 affiné : la fiche telle qu'il l'a choisie (feuille sur l'étape, α de la fiche récente et lot,
// usage, radar d'abord, D115), et la liste sous le radar où chaque mot porte sa signature : qui le dit, en quelle
// année. Les mots hors des 12 familles prennent leur rang (au nombre de fiches), pas le pied de la liste.
import path from 'node:path';
import * as C from './commun-c.mjs';

const P = 'flc1', { esc, fr, ic, pic, COURT, JET } = C;
const DEF = 'Nugget';

function liste(h) {
  const X = C.H[h];
  // Une ligne par famille citée, plus une ligne « hors des 12 » si des mots n'ont pas de famille.
  const lignes = C.ORDRE.filter((f) => X.fam[f].n).map((f) => ({ f, n: X.fam[f].n, mots: X.fam[f].mots }));
  if (X.hors.length) lignes.push({ f: null, n: Math.max(...X.hors.map((m) => m.n)), mots: X.hors });
  const abs = [...lignes].sort((a, b) => b.n - a.n || b.mots.length - a.mots.length);
  const sty = [...lignes].sort((a, b) => (C.STYLE16D.includes(b.f) - C.STYLE16D.includes(a.f)) || b.n - a.n);
  const nSty = lignes.filter((l) => C.STYLE16D.includes(l.f)).length;
  const mot = (m, f) => `<span class="${P}-m${m.gout ? '' : ' cat'}${f && m.fr === COURT[f].toLowerCase() ? ' meme' : ''}">${m.gout ? `<b>${esc(m.fr)}</b>` : `<i>rangé sous « ${esc(m.par[0].orig)} »</i>`}${m.par.map((p) => C.marque(P, p)).join('')}</span>`;
  const rows = lignes.map((l) => {
    const os = sty.indexOf(l) + (C.STYLE16D.includes(l.f) ? 1 : 2), oa = abs.indexOf(l) + 1;
    const tete = l.f ? `<span class="${P}-fn" data-famille="${l.f}" style="color:${JET[l.f].texte}">${pic(l.f, 18)}${COURT[l.f]}</span>` : `<span class="${P}-fn hors"><i class="${P}-ho" aria-hidden="true"></i>Hors des 12</span>`;
    return `<li class="${P}-li${l.f ? '' : ' hors'}${C.STYLE16D.includes(l.f) ? ' s16' : ''}" style="--os:${os};--oa:${oa}">${tete}<span class="${P}-nn mono">${l.n}/${X.N}</span><span class="${P}-ms">${l.mots.map((m) => mot(m, l.f)).join('')}</span></li>`;
  }).join('');
  const nd = C.ORDRE.filter((f) => !X.fam[f].n);
  return `<ul class="${P}-ul">
    <li class="${P}-zo" data-role="zone" style="--os:0"><span>ta 16D accueille</span>${nSty ? '' : '<em>aucune de ses fiches ne les cite</em>'}</li>
    <li class="${P}-zf" style="--os:${nSty + 1}" aria-hidden="true"></li>
    ${rows}
    <li class="${P}-nd" style="--os:90;--oa:90"><span class="${P}-ndt">aucune fiche</span>${nd.map((f) => `<span class="${P}-ndi"><i class="${P}-hc" aria-hidden="true"></i>${COURT[f]}</span>`).join('')}</li>
  </ul>`;
}

function fiche(h) {
  const X = C.H[h];
  return `<div class="${P}-l1">${C.nomH(h, P + '-nom')}${C.stock(h, P + '-stk')}<span class="${P}-or">${esc(X.origine)}</span>${C.croix(P)}</div>
  <div class="${P}-l2">${C.alpha(h, P)}${C.role(h, P + '-us')}</div>
  <div class="${P}-haut">${C.radar(h, { P, r: 70, labv: 22, w: 362, ecart: 0.16 })}
    <div class="${P}-src"><b>${X.N} fiche${X.N > 1 ? 's' : ''}<br>lue${X.N > 1 ? 's' : ''}</b>${X.fiches.map((s) => `<span class="${P}-s"><span class="${P}-sm big">${esc(s.court)}<sup>${s.an ? String(s.an).slice(2) : '?'}</sup></span><span>${esc(s.src.replace(' (boutique US)', ' US').replace('Yakima Chief Hops', 'Yakima Chief'))}<br><small>${s.an || 'année ?'} · ${s.n} mot${s.n > 1 ? 's' : ''}</small></span></span>`).join('')}</div></div>
  <div class="${P}-bar">${C.lentille(P)}<span class="${P}-tq">${X.mots.filter((m) => m.gout).length} mots goûtés · ${X.hors.length} hors du radar</span>${C.legB(P)}</div>
  ${liste(h)}
  <div class="${P}-pied"><span class="${P}-gout" data-role="gout"><button type="button" aria-label="J’aime">${ic('coeur', 16)}</button><button type="button" aria-label="Exclure">${ic('ban', 16)}</button></span><button type="button" class="${P}-cmp">Comparer</button></div>
  <div class="${P}-plus"><button type="button">Styles ›</button><button type="button">Huiles ›</button><button type="button">Sources ›</button><button type="button">Substituts ›</button></div>`;
}

const corps = `
<div class="${P}-etape" aria-hidden="true"><div class="${P}-et1"><span>${ic('chev-l', 20)}</span><b>Houblons</b><span class="${P}-et-n">3/7</span><span class="${P}-et-s">16D <i>hypothèse</i></span></div>
  <div class="${P}-et2"><span>IBU <b>60</b></span><span>OG <b>1,066</b></span><span>EBC <b>70</b></span></div></div>
<div class="${P}-feuille" role="dialog" aria-label="Fiche du houblon"><i class="${P}-poi" aria-hidden="true"></i>
  ${C.sections(P, DEF, fiche)}
  <div class="${P}-aut"><span>Même liste pour</span>${C.choix(P, DEF)}</div>
</div>`;

const css = `
  .${P}-etape { background: #e4e5e9; padding: 6px 14px 22px; color: #3b3d45; }
  .${P}-et1 { display: flex; align-items: center; gap: 6px; height: 34px; }
  .${P}-et1 b { font-size: 19px; } .${P}-et-n { font-size: 14px; color: #4a4d55; }
  .${P}-et-s { margin-left: auto; font-size: 13px; padding: 2px 4px 2px 10px; border-radius: 999px; box-shadow: inset 0 0 0 1px #9a9ca4; display: inline-flex; gap: 6px; align-items: center; }
  .${P}-et-s i { font-style: normal; background: #cfd0d5; border-radius: 999px; padding: 1px 8px; }
  .${P}-et2 { display: flex; justify-content: space-between; padding: 6px 14px; border-radius: 999px; box-shadow: inset 0 0 0 1px #9a9ca4; font-size: 13px; }
  .${P}-et2 b { font-size: 16px; font-family: var(--mono); }
  .${P}-feuille { position: relative; margin-top: -14px; background: #fff; border-radius: 24px 24px 0 0; padding: 14px 14px 18px; box-shadow: 0 -1px 0 #d6d7dc; }
  .${P}-poi { display: block; width: 36px; height: 4px; border-radius: 2px; background: #c9cad0; margin: -6px auto 6px; }
  .${P}-l1 { display: flex; align-items: center; gap: 8px; }
  .${P}-nom { font-size: 22px; font-weight: 700; }
  .${P}-or { font-size: 12px; color: #5d6069; }
  .${P}-x { margin-left: auto; width: 36px; height: 36px; border-radius: 50%; background: #eceef1; display: inline-flex; align-items: center; justify-content: center; }
  .${P}-l2 { display: flex; align-items: center; gap: 10px; margin-top: 2px; flex-wrap: wrap; }
  .${P}-al { display: inline-flex; align-items: baseline; gap: 6px; }
  .${P}-alg { font-size: 15px; color: #4a4d55; } .${P}-alg b { font-size: 21px; color: #16161a; font-weight: 600; }
  .${P}-all { font-size: 12px; color: #5d6069; }
  .${P}-us { margin-left: auto; font-size: 13px; padding: 2px 10px; border-radius: 999px; box-shadow: inset 0 0 0 1px #9a9ca4; }
  .${P}-stk { display: inline-flex; align-items: center; gap: 3px; font-size: 12px; color: #5d6069; }
  .${P}-haut { display: flex; flex-direction: column; align-items: stretch; gap: 4px; margin: 0 -2px; }
  .${P}-radar { flex: none; }
  .${P}-rl { font: 600 11px var(--sans); fill: #2b2d33; } .${P}-rl.inc { fill: #6b6f78; font-weight: 400; }
  .${P}-src { display: grid; grid-template-columns: auto 1fr 1fr; gap: 4px 8px; font-size: 12px; align-items: center; }
  .${P}-src > b { font-size: 13px; grid-row: span 2; align-self: center; line-height: 1.1; width: 52px; }
  .${P}-s { display: flex; gap: 6px; align-items: flex-start; line-height: 1.15; }
  .${P}-s small { font-size: 12px; color: #5d6069; }
  .${P}-sm { display: inline-flex; align-items: baseline; font: 600 11px/1 var(--mono); color: #16161a; padding: 2px 4px; margin-left: 3px; border-radius: 2px; background: #e8e9ed; white-space: nowrap; }
  .${P}-sm sup { font-size: 9px; margin-left: 1px; }
  .${P}-sm.cat { background: #fff; box-shadow: inset 0 0 0 1px #8b8e97; color: #4a4d55; }
  .${P}-sm.big { font-size: 12px; min-width: 40px; justify-content: center; margin: 0; padding: 4px 4px; }
  .${P}-bar { display: flex; align-items: center; gap: 8px; margin: 6px 0 4px; }
  .${P}-tq { font-size: 12px; color: #5d6069; flex: 1; text-align: right; }
  .${P}-ul { list-style: none; display: flex; flex-direction: column; background: #f4f5f7; border-radius: 8px; padding: 6px 10px 8px; }
  .${P}-ul > li { order: var(--os); }
  body.abs .${P}-ul > li { order: var(--oa, 50); }
  .${P}-zo { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: #3b3d45; padding: 2px 0 2px 8px; border-left: 3px solid #16161a; }
  .${P}-zo em { font-weight: 400; font-style: normal; color: #5d6069; }
  .${P}-zf { height: 1px; background: #c9cad0; margin: 3px 0; }
  body.abs .${P}-zo, body.abs .${P}-zf { display: none; }
  .${P}-li { display: grid; grid-template-columns: 102px 30px 1fr; align-items: baseline; gap: 4px; padding: 4px 0; border-top: 1px solid #e4e5e9; }
  .${P}-li.s16 { padding-left: 8px; border-left: 3px solid #16161a; }
  body.abs .${P}-li.s16 { padding-left: 0; border-left: 0; }
  .${P}-fn { display: inline-flex; align-items: center; gap: 4px; font-size: 14px; font-weight: 700; align-self: start; }
  .${P}-fn.hors { color: #3b3d45; }
  .${P}-ho { width: 16px; height: 16px; border-radius: 50%; box-shadow: inset 0 0 0 1.5px #3b3d45; flex: none; }
  .${P}-nn { font-size: 13px; color: #16161a; }
  .${P}-ms { display: flex; flex-wrap: wrap; gap: 2px 8px; font-size: 14px; }
  .${P}-m { display: inline-flex; align-items: baseline; white-space: nowrap; }
  .${P}-m b { font-weight: 600; }
  .${P}-m.meme b { font-weight: 400; color: #5d6069; }
  .${P}-m.cat i { font-size: 12px; color: #5d6069; font-style: normal; }
  .${P}-li.hors .${P}-m b { font-weight: 700; }
  .${P}-nd { display: flex; flex-wrap: wrap; align-items: center; gap: 3px 8px; padding: 6px 0 0; border-top: 1px solid #e4e5e9; font-size: 12px; color: #4a4d55; }
  .${P}-ndt { font-weight: 600; margin-right: 2px; }
  .${P}-ndi { display: inline-flex; align-items: center; gap: 3px; }
  .${P}-hc { width: 12px; height: 12px; border-radius: 2px; background: repeating-linear-gradient(135deg, #fff 0 2px, #9aa0ab 2px 3.5px); box-shadow: inset 0 0 0 1px #8a909b; }
  .${P}-pied { display: flex; align-items: center; justify-content: space-between; margin-top: 10px; }
  .${P}-gout { display: inline-flex; gap: 4px; background: #eceef1; border-radius: 999px; padding: 4px 6px; }
  .${P}-gout button { width: 32px; height: 28px; display: inline-flex; align-items: center; justify-content: center; }
  .${P}-cmp { height: 36px; padding: 0 16px; border-radius: 999px; box-shadow: inset 0 0 0 1px #9a9ca4; font-size: 15px; }
  .${P}-plus { display: flex; gap: 6px; margin-top: 10px; }
  .${P}-plus button { flex: 1; height: 32px; border-radius: 999px; background: #eceef1; font-size: 13px; }
  .${P}-aut { margin-top: 12px; display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: #5d6069; }
  .${P}-hs { display: flex; flex-wrap: wrap; gap: 4px; }
  .${P}-hb { height: 28px; padding: 0 10px; border-radius: 999px; box-shadow: inset 0 0 0 1px #c9cad0; font-size: 13px; }
  .${P}-hb[aria-pressed="true"] { box-shadow: inset 0 0 0 1.5px #16161a; }
  .${P}-hb .hn { display: inline-flex; align-items: center; gap: 5px; font-weight: 600; }
  .${P}-hp { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }`;

C.ecrire(path.join(C.ICI, 'etat.html'), C.page({ id: P, chaleur: 'froide', titre: 'chaque mot signé', resume: 'g1 affiné : radar d’abord, chaque mot avec ses fiches et leur année', corps, css }));
