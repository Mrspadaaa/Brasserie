// flc2 · froide · g1 affiné, la liste rangée par accord des fiches : ce que les deux fiches disent ensemble, puis ce
// qu'une seule dit (chacune dans sa colonne), puis ce qui n'est qu'un rangement du fournisseur, puis ce que personne ne
// dit. La fiche reste g1 (feuille, α récent et lot, usage, radar d'abord) ; seule la liste change.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as C from '../flc1/commun-c.mjs';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const P = 'flc2', { esc, fr, ic, pic, COURT, JET } = C;
const DEF = 'Cascade';

const puce = (m) => {
  const f = m.fam, s16 = C.STYLE16D.includes(f);
  const st = f ? ` data-famille="${f}" style="--b:${JET[f].base};--t:${JET[f].texte};--f:${JET[f].fond}"` : '';
  return `<span class="${P}-p${f ? '' : ' hors'}${s16 ? ' s16' : ''}${m.gout ? '' : ' cat'}"${st}>${f ? pic(f, 14) : `<i class="${P}-ho" aria-hidden="true"></i>`}<span>${esc(m.gout ? m.fr : m.par[0].orig)}</span>${m.par.length < 2 || m.par.length < C.H.Nugget.N ? '' : ''}</span>`;
};
function liste(h) {
  const X = C.H[h], N = X.N, gout = X.mots.filter((m) => m.gout), cat = X.mots.filter((m) => !m.gout);
  const ord = (a, b) => (C.STYLE16D.includes(b.fam) - C.STYLE16D.includes(a.fam)) || (C.ORDRE.indexOf(a.fam) - C.ORDRE.indexOf(b.fam));
  const tiers = [];
  for (let n = N; n >= 1; n--) {
    const ms = gout.filter((m) => m.n === n);
    if (!ms.length && n !== N) continue;
    if (n === 1 && N > 1) {
      const par = X.fiches.map((s) => ({ s, ms: ms.filter((m) => m.par[0].src === s.src) })).filter((x) => x.ms.length);
      tiers.push(`<div class="${P}-t un"><div class="${P}-th"><b>1 fiche</b> seule</div><div class="${P}-cols">${par.map(({ s, ms }) => `<div class="${P}-col"><span class="${P}-ch">${C.marque(P, { ...s, nature: 'mot' })}<span>${esc(s.src.replace(' (boutique US)', ' US'))}</span></span><div class="${P}-ps">${ms.sort(ord).map(puce).join('')}</div></div>`).join('')}</div></div>`);
    } else {
      tiers.push(`<div class="${P}-t${n === N ? ' tous' : ''}"><div class="${P}-th"><b>${n === N ? (N === 1 ? 'Sa seule fiche' : N === 2 ? 'Les 2 fiches' : 'Les ' + N + ' fiches') : n + ' fiches sur ' + N}</b>${n === N && N > 1 ? ' le disent' : ''}<span class="${P}-qui">${X.fiches.map((s) => C.marque(P, { ...s, nature: 'mot' })).join('')}</span></div><div class="${P}-ps">${ms.length ? ms.sort(ord).map(puce).join('') : `<span class="${P}-vide">aucun mot commun</span>`}</div></div>`);
    }
  }
  if (cat.length) tiers.push(`<div class="${P}-t cat"><div class="${P}-th"><b>Rangé</b>&nbsp;par le fournisseur, pas goûté<span class="${P}-qui">${[...new Set(cat.map((m) => m.par[0].src))].map((src) => C.marque(P, { ...cat.find((m) => m.par[0].src === src).par[0] })).join('')}</span></div><div class="${P}-ps">${cat.sort(ord).map(puce).join('')}</div></div>`);
  const nd = C.ORDRE.filter((f) => !X.fam[f].n);
  tiers.push(`<div class="${P}-t nd"><div class="${P}-th"><b>Aucune fiche</b></div><div class="${P}-ps">${nd.map((f) => `<span class="${P}-nd"><i class="${P}-hc" aria-hidden="true"></i>${COURT[f]}</span>`).join('')}</div></div>`);
  const s16 = C.STYLE16D.filter((f) => X.fam[f].n);
  return `<div class="${P}-zo" data-role="zone"><i aria-hidden="true"></i><span>ta 16D accueille : ${C.STYLE16D.map((f) => `<span class="${P}-zf${X.fam[f].n ? '' : ' ' + P + '-non'}">${COURT[f].toLowerCase()}</span>`).join(', ')}${s16.length ? '' : ' — aucune citée'}</span></div><div class="${P}-tiers">${tiers.join('')}</div>`;
}

function fiche(h) {
  const X = C.H[h];
  return `<div class="${P}-tete"><div class="${P}-g">
      <div class="${P}-l1">${C.nomH(h, P + '-nom')}</div>
      <div>${C.alpha(h, P)}</div>
      <div class="${P}-l3">${C.role(h, P + '-us')}${C.stock(h, P + '-stk')}</div>
      <div class="${P}-lu"><b>${X.N} fiche${X.N > 1 ? 's' : ''} lue${X.N > 1 ? 's' : ''}</b> · ${X.mots.length} mots · ${X.hors.length} hors des 12</div>
    </div>${C.radar(h, { P, r: 50, lab: 48, labv: 20, nn: false, ecart: 0.18 })}</div>
  <div class="${P}-bar">${C.lentille(P)}${C.legB(P)}</div>
  ${liste(h)}
  <div class="${P}-pied"><span class="${P}-gout" data-role="gout"><button type="button" aria-label="J’aime">${ic('coeur', 16)}</button><button type="button" aria-label="Exclure">${ic('ban', 16)}</button></span><button type="button" class="${P}-cmp">Comparer</button></div>`;
}

const corps = `
<div class="${P}-etape" aria-hidden="true">${ic('chev-l', 20)}<b>Houblons</b><span>3/7</span><span class="${P}-et-s">16D <i>hypothèse</i></span></div>
<div class="${P}-feuille" role="dialog" aria-label="Fiche du houblon"><i class="${P}-poi" aria-hidden="true"></i>${C.croix(P)}
  ${C.sections(P, DEF, fiche)}
  ${C.choix(P, DEF, P + '-bas')}
</div>`;

const css = `
  .${P}-etape { background: #e4e5e9; height: 58px; padding: 6px 14px 18px; display: flex; align-items: center; gap: 6px; color: #3b3d45; }
  .${P}-etape b { font-size: 18px; } .${P}-etape > span { font-size: 13px; }
  .${P}-et-s { margin-left: auto; padding: 2px 4px 2px 10px; border-radius: 999px; box-shadow: inset 0 0 0 1px #9a9ca4; display: inline-flex; gap: 6px; }
  .${P}-et-s i { font-style: normal; background: #cfd0d5; border-radius: 999px; padding: 0 8px; }
  .${P}-feuille { position: relative; margin-top: -16px; background: #fff; border-radius: 24px 24px 0 0; padding: 12px 14px 16px; box-shadow: 0 -1px 0 #d6d7dc; }
  .${P}-poi { display: block; width: 36px; height: 4px; border-radius: 2px; background: #c9cad0; margin: -4px auto 4px; }
  .${P}-x { position: absolute; right: 12px; top: 14px; width: 36px; height: 36px; border-radius: 50%; background: #eceef1; display: inline-flex; align-items: center; justify-content: center; z-index: 2; }
  .${P}-tete { display: flex; align-items: flex-start; justify-content: space-between; gap: 0; }
  .${P}-g { display: flex; flex-direction: column; gap: 4px; padding-top: 2px; min-width: 0; }
  .${P}-nom { font-size: 24px; font-weight: 700; }
  .${P}-al { display: flex; flex-direction: column; gap: 0; }
  .${P}-alg { font-size: 15px; color: #4a4d55; } .${P}-alg b { font-size: 24px; color: #16161a; font-weight: 600; }
  .${P}-all { font-size: 12px; color: #5d6069; max-width: 170px; }
  .${P}-l3 { display: flex; align-items: center; gap: 8px; }
  .${P}-us { font-size: 13px; padding: 2px 10px; border-radius: 999px; box-shadow: inset 0 0 0 1px #9a9ca4; }
  .${P}-stk { display: inline-flex; align-items: center; gap: 3px; font-size: 12px; color: #5d6069; }
  .${P}-lu { font-size: 12px; color: #4a4d55; }
  .${P}-radar { margin: 34px -12px 0 -20px; flex: none; }
  .${P}-rl { font: 600 11px var(--sans); fill: #2b2d33; } .${P}-rl.inc { fill: #6b6f78; font-weight: 400; }
  .${P}-bar { display: flex; align-items: center; justify-content: space-between; margin: 4px 0 6px; }
  .${P}-zo { display: flex; align-items: center; gap: 5px; font-size: 12px; color: #3b3d45; margin-bottom: 6px; flex-wrap: wrap; }
  .${P}-zo i { width: 22px; height: 14px; border-radius: 999px; outline: 2px solid #16161a; outline-offset: -1px; background: #fff; }
  .${P}-zf { font-weight: 600; } .${P}-zf.${P}-non { font-weight: 400; color: #5d6069; }
  body.abs .${P}-zo { display: none; }
  .${P}-tiers { display: flex; flex-direction: column; gap: 6px; }
  .${P}-t { border-radius: 8px; padding: 6px 8px 8px; background: #f4f5f7; }
  .${P}-t.tous { background: #fff; box-shadow: inset 0 0 0 2px #16161a; }
  .${P}-t.cat { background: #fff; box-shadow: inset 0 0 0 1px #b4b6bd; }
  .${P}-t.nd { background: #fff; padding: 4px 0 0; }
  .${P}-th { display: flex; align-items: center; gap: 4px; font-size: 13px; color: #3b3d45; margin-bottom: 4px; }
  .${P}-th b { color: #16161a; font-size: 14px; }
  .${P}-qui { margin-left: auto; display: inline-flex; }
  .${P}-sm { display: inline-flex; align-items: baseline; font: 600 11px/1 var(--mono); color: #16161a; padding: 2px 4px; margin-left: 3px; border-radius: 2px; background: #e2e4e8; white-space: nowrap; }
  .${P}-sm sup { font-size: 9px; margin-left: 1px; }
  .${P}-sm.cat { background: #fff; box-shadow: inset 0 0 0 1px #8b8e97; color: #4a4d55; }
  .${P}-ps { display: flex; flex-wrap: wrap; gap: 5px; }
  .${P}-p { display: inline-flex; align-items: center; gap: 4px; height: 28px; padding: 0 9px 0 6px; border-radius: 999px; background: var(--f); color: var(--t); box-shadow: inset 0 0 0 1px var(--b); font-size: 14px; font-weight: 600; white-space: nowrap; }
  .${P}-t.tous .${P}-p { height: 32px; font-size: 16px; }
  .${P}-p.hors { background: #fff; color: #16161a; box-shadow: inset 0 0 0 1.5px #3b3d45; }
  .${P}-p.cat { background: #fff; font-weight: 400; box-shadow: inset 0 0 0 1px var(--b, #8b8e97); }
  .${P}-p.cat.hors { color: #3b3d45; box-shadow: inset 0 0 0 1px #8b8e97; }
  .${P}-p.s16 { outline: 2px solid #16161a; outline-offset: 1px; }
  body.abs .${P}-p.s16 { outline: 0; }
  .${P}-ho { width: 13px; height: 13px; border-radius: 50%; box-shadow: inset 0 0 0 1.5px #3b3d45; flex: none; }
  .${P}-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .${P}-col { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
  .${P}-ch { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: #3b3d45; }
  .${P}-ch .${P}-sm { margin-left: 0; }
  .${P}-vide { font-size: 13px; color: #5d6069; }
  .${P}-nd { display: inline-flex; align-items: center; gap: 3px; font-size: 13px; color: #4a4d55; margin-right: 4px; }
  .${P}-hc { width: 12px; height: 12px; border-radius: 2px; background: repeating-linear-gradient(135deg, #fff 0 2px, #9aa0ab 2px 3.5px); box-shadow: inset 0 0 0 1px #8a909b; }
  .${P}-pied { display: flex; align-items: center; justify-content: space-between; margin-top: 10px; }
  .${P}-gout { display: inline-flex; gap: 4px; background: #eceef1; border-radius: 999px; padding: 4px 6px; }
  .${P}-gout button { width: 32px; height: 28px; display: inline-flex; align-items: center; justify-content: center; }
  .${P}-cmp { height: 36px; padding: 0 16px; border-radius: 999px; box-shadow: inset 0 0 0 1px #9a9ca4; font-size: 15px; }
  .${P}-hs { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 12px; }
  .${P}-hb { height: 28px; padding: 0 10px; border-radius: 999px; box-shadow: inset 0 0 0 1px #c9cad0; font-size: 13px; }
  .${P}-hb[aria-pressed="true"] { box-shadow: inset 0 0 0 1.5px #16161a; }
  .${P}-hb .hn { display: inline-flex; align-items: center; gap: 5px; font-weight: 600; }
  .${P}-hp { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }`;

C.ecrire(path.join(ICI, 'etat.html'), C.page({ id: P, chaleur: 'froide', titre: 'rangé par accord des fiches', resume: 'g1 affiné : la liste dit d’abord ce que les fiches disent ensemble', corps, css }));
