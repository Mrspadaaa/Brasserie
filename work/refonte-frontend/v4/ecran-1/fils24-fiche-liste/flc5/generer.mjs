// flc5 · tiède · les fiches citées telles qu'écrites, surlignées : chaque fiche lue est un extrait (auteur, année,
// site), ses mots dans son ordre, surlignés à la couleur de leur famille ; un mot hors des 12 familles est souligné en
// gris ; un rangement du fournisseur (« Familles déclarées ») est encadré. L'anglais est traduit, l'original au-dessus.
// En tête, sous le nom : le radar et la bande des 12 familles de g1, au style 16D (Floral, Herbacé, Terreux d'abord).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as C from '../flc1/commun-c.mjs';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const P = 'flc5', { esc, ic, pic, COURT, JET } = C;
const DEF = 'Nugget';
const DOM = (u) => (u || '').replace(/^https?:\/\/(www\.)?/, '').split('/')[0];

function extrait(h, s) {
  const X = C.H[h];
  const mots = X.mots.flatMap((m) => m.par.filter((p) => p.src === s.src).map((p) => ({ m, p })));
  const sur = ({ m, p }) => {
    const f = m.fam, tr = p.orig.toLowerCase() !== m.fr;
    const st = f ? ` data-famille="${f}" style="--b:${JET[f].base};--t:${JET[f].texte};--f:${JET[f].fond}"` : '';
    const mot = esc(p.nature === 'mot' ? m.fr : p.orig);
    return `<span class="${P}-w${f ? '' : ' ' + P + '-hors'}${p.nature === 'mot' ? '' : ' ' + P + '-cat'}${C.STYLE16D.includes(f) ? ' ' + P + '-s16' : ''}"${st}>${tr && p.nature === 'mot' ? `<ruby>${mot}<rt>${esc(p.orig)}</rt></ruby>` : mot}</span>`;
  };
  const des = mots.filter((x) => x.p.nature === 'mot').sort((a, b) => a.p.rang - b.p.rang), cat = mots.filter((x) => x.p.nature !== 'mot');
  const url = (C.H[h].fiches.find((x) => x.src === s.src) || {}).url;
  const pack = { 'Beer Maverick': 'beermaverick.com', Hopsteiner: 'hopsteiner.de', 'Hopsteiner (boutique US)': 'shop.hopsteiner.com', 'Yakima Chief Hops': 'yakimachief.com' };
  return `<article class="${P}-ex"><header><b>${esc(s.src)}</b><span class="${P}-an${s.an ? '' : ' ' + P + '-inc'}">${s.an || 'année ?'}</span><small>${esc(DOM(url) || pack[s.src] || '')}</small></header>
    <p class="${P}-q">« ${des.map(sur).join(', ')}${des.length ? '' : '—'} »</p>
    ${cat.length ? `<p class="${P}-q ${P}-qc"><span class="${P}-ql">${s.src === 'Hopsteiner' ? 'Familles déclarées' : 'Étiquette'}</span>${cat.map(sur).join(' ')}</p>` : ''}</article>`;
}

function bande(h) {
  const X = C.H[h];
  const sty = [...C.STYLE16D, ...C.ORDRE.filter((f) => !C.STYLE16D.includes(f))];
  const abs = [...C.ORDRE].sort((a, b) => X.fam[b].n - X.fam[a].n);
  return `<div class="${P}-bd"><span class="${P}-zo" data-role="zone" aria-label="Familles que ta 16D accueille">ta 16D</span>${C.ORDRE.map((f) => {
    const n = X.fam[f].n;
    return `<span class="${P}-cs${n ? '' : ' ' + P + '-nd'}${C.STYLE16D.includes(f) ? ' ' + P + '-s16' : ''}" data-famille="${f}" style="--os:${sty.indexOf(f) + (C.STYLE16D.includes(f) ? 1 : 5)};--oa:${abs.indexOf(f) + 1};--b:${JET[f].base};--t:${JET[f].texte};--f:${JET[f].fond}">${pic(f, 16)}<span>${COURT[f]}</span><b class="mono">${n ? n + '/' + X.N : '?'}</b></span>`;
  }).join('')}<i class="${P}-sep" style="--os:4" aria-hidden="true"></i></div>`;
}

function fiche(h) {
  const X = C.H[h];
  return `<div class="${P}-l1">${C.nomH(h, P + '-nom')}${C.role(h, P + '-us')}${C.croix(P)}</div>
  <div class="${P}-l2">${C.alpha(h, P)}${C.stock(h, P + '-stk')}</div>
  <div class="${P}-haut">${C.radar(h, { P, r: 52, lab: 30, labv: 15, nn: false, nolab: true })}${bande(h)}</div>
  <div class="${P}-bar"><b>${X.N} fiche${X.N > 1 ? 's' : ''}, telles qu’écrites</b>${C.lentille(P)}${C.legB(P)}</div>
  <div class="${P}-exs">${X.fiches.map((s) => extrait(h, s)).join('')}</div>
  <p class="${P}-pied"><span class="${P}-w ${P}-hors">souligné gris</span> hors des 12 familles · <span class="${P}-w ${P}-cat">encadré</span> rangement, pas un mot goûté</p>`;
}

const corps = `<div class="${P}-feuille" role="dialog" aria-label="Fiche du houblon">${C.sections(P, DEF, fiche)}${C.choix(P, DEF)}</div>`;

const css = `
  .${P}-feuille { padding: 12px 12px 18px; }
  .${P}-l1 { display: flex; align-items: center; gap: 8px; }
  .${P}-nom { font-size: 25px; font-weight: 700; }
  .${P}-us { font-size: 13px; padding: 1px 9px; border-radius: 999px; box-shadow: inset 0 0 0 1px #9a9ca4; }
  .${P}-x { margin-left: auto; width: 36px; height: 36px; border-radius: 50%; background: #eceef1; display: inline-flex; align-items: center; justify-content: center; flex: none; }
  .${P}-l2 { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
  .${P}-al { display: inline-flex; align-items: baseline; gap: 6px; }
  .${P}-alg { font-size: 14px; color: #4a4d55; } .${P}-alg b { font-size: 20px; color: #16161a; font-weight: 600; }
  .${P}-all { font-size: 12px; color: #5d6069; }
  .${P}-stk { display: inline-flex; align-items: center; gap: 3px; font-size: 12px; color: #5d6069; }
  .${P}-haut { display: flex; align-items: center; gap: 6px; margin-top: 4px; }
  .${P}-radar { flex: none; margin-left: -6px; }
  .${P}-bd { flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 3px 6px; align-content: center; }
  .${P}-bd > * { order: var(--os); }
  body.abs .${P}-bd > * { order: var(--oa); }
  .${P}-zo { grid-column: span 2; order: 0 !important; font-size: 12px; font-weight: 700; color: #16161a; border-bottom: 2px solid #16161a; padding-bottom: 1px; }
  body.abs .${P}-zo, body.abs .${P}-sep { display: none; }
  .${P}-sep { grid-column: span 2; height: 4px; }
  .${P}-cs { display: inline-flex; align-items: center; gap: 3px; font-size: 13px; font-weight: 600; color: var(--t); min-width: 0; white-space: nowrap; }
  .${P}-cs b { margin-left: auto; font-size: 12px; color: #16161a; }
  .${P}-cs.${P}-nd { color: #6b6f78; font-weight: 400; } .${P}-cs.${P}-nd b { color: #6b6f78; }
  .${P}-cs.${P}-nd .pi { opacity: .45; }
  .${P}-bar { display: flex; align-items: center; gap: 8px; margin: 8px 0 6px; padding-top: 8px; border-top: 1px solid #e4e5e9; }
  .${P}-bar > b { font-size: 15px; flex: 1; }
  .${P}-exs { display: flex; flex-direction: column; gap: 8px; }
  .${P}-ex { border-radius: 8px; background: #f6f6f8; padding: 7px 10px 9px; box-shadow: inset 3px 0 0 #16161a; }
  .${P}-ex header { display: flex; align-items: baseline; gap: 6px; }
  .${P}-ex header b { font-size: 14px; }
  .${P}-an { font: 600 13px var(--mono); padding: 0 5px; border-radius: 2px; background: #16161a; color: #fff; }
  .${P}-an.${P}-inc { background: #fff; color: #3b3d45; box-shadow: inset 0 0 0 1px #8b8e97; }
  .${P}-ex header small { margin-left: auto; font-size: 12px; color: #5d6069; }
  .${P}-q { font-size: 17px; line-height: 1.9; margin-top: 2px; color: #3b3d45; }
  .${P}-qc { font-size: 14px; line-height: 1.6; }
  .${P}-ql { font-size: 12px; color: #4a4d55; margin-right: 6px; }
  .${P}-w { color: var(--t); background: var(--f); box-shadow: inset 0 -2px 0 var(--b); padding: 0 3px; border-radius: 2px; font-weight: 600; white-space: nowrap; }
  .${P}-w ruby { ruby-position: over; } .${P}-w rt { font-size: 11px; font-weight: 400; color: #4a4d55; }
  .${P}-w.${P}-hors { color: #16161a; background: #fff; box-shadow: inset 0 -2px 0 #6b6f78; font-weight: 700; }
  .${P}-w.${P}-cat { background: #fff; box-shadow: inset 0 0 0 1.5px var(--b, #8b8e97); font-weight: 400; }
  .${P}-pied { font-size: 12px; color: #4a4d55; margin-top: 8px; }
  .${P}-pied .${P}-w { font-size: 12px; }
  .${P}-hs { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 10px; }
  .${P}-hb { height: 28px; padding: 0 10px; border-radius: 999px; box-shadow: inset 0 0 0 1px #c9cad0; font-size: 13px; }
  .${P}-hb[aria-pressed="true"] { box-shadow: inset 0 0 0 1.5px #16161a; }
  .${P}-hb .hn { display: inline-flex; align-items: center; gap: 5px; font-weight: 600; }
  .${P}-hp { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }`;

C.ecrire(path.join(ICI, 'etat.html'), C.page({ id: P, chaleur: 'tiède', titre: 'les fiches telles qu’écrites', resume: 'chaque fiche citée, ses mots surlignés à la couleur de leur famille', corps, css }));
