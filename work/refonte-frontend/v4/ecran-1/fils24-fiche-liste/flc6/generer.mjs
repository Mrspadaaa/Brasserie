// flc6 · chaude · où vont les mots : un flux de gauche à droite, des fiches (auteur, année) vers les mots qu'elles disent,
// puis des mots vers la famille qui les range, ou vers « hors des 12 », ce que le radar ne sait pas dessiner. L'épaisseur
// d'un flux = une citation. On voit d'un coup pourquoi le radar de Nelson Sauvin paraît maigre.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as C from '../flc1/commun-c.mjs';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const P = 'flc6', { esc, ic, pic, COURT, JET } = C;
const DEF = 'Nelson Sauvin';
const W = 366, U = 9, G = 6, XL = 62, XW0 = 96, XW1 = 264, XD = 290;

function flux(h, mode) {
  const X = C.H[h];
  // Destinations : au style, les trois familles que la 16D accueille d'abord (même vides), puis les autres citées, puis « hors des 12 ».
  const cites = C.ORDRE.filter((f) => X.fam[f].mots.length);
  let dest = mode === 'style' ? [...C.STYLE16D, ...cites.filter((f) => !C.STYLE16D.includes(f))] : [...cites].sort((a, b) => X.fam[b].mots.reduce((s, m) => s + m.n, 0) - X.fam[a].mots.reduce((s, m) => s + m.n, 0));
  dest = [...dest.map((f) => ({ f, mots: X.fam[f].mots })), ...(X.hors.length ? [{ f: null, mots: X.hors }] : [])];
  const mots = dest.flatMap((d) => d.mots);
  const mentions = (m) => m.par.length;
  // Colonne des mots.
  let y = 0; const wy = new Map();
  for (const m of mots) { const hgt = Math.max(24, mentions(m) * U + 6); wy.set(m, { y, h: hgt }); y += hgt + G; }
  const Hm = y;
  // Colonne des fiches : chaque fiche, ses citations dans l'ordre des mots.
  y = 0; const fy = new Map();
  for (const s of X.fiches) { const k = mots.filter((m) => m.par.some((p) => p.src === s.src)).length; const hgt = Math.max(40, k * U + 8); fy.set(s.src, { y, h: hgt, k }); y += hgt + G * 2; }
  const Hf = y;
  // Destinations.
  y = 0; const dy = new Map();
  for (const d of dest) { const k = d.mots.reduce((s, m) => s + mentions(m), 0); const hgt = Math.max(d.f ? 26 : 44, k * U + 6); dy.set(d, { y, h: hgt, k }); y += hgt + G + (d.f && C.STYLE16D.includes(d.f) && mode === 'style' && d === dest[2] ? 10 : 0); }
  const Hd = y, H = Math.max(Hm, Hf, Hd) + 4;
  const off = (box, total) => (box.h - total) / 2;
  const coul = (m) => (m.fam ? JET[m.fam].base : '#8b8e97');
  const courbe = (x0, y0, x1, y1, m, faible) => `<path d="M${x0},${y0.toFixed(1)} C${(x0 + x1) / 2},${y0.toFixed(1)} ${(x0 + x1) / 2},${y1.toFixed(1)} ${x1},${y1.toFixed(1)}" fill="none" stroke="${coul(m)}" stroke-opacity="${faible ? 0.35 : 0.8}" stroke-width="${U - 1.5}"${m.fam ? ` data-famille="${m.fam}"` : ''}/>`;
  const out = [];
  // fiches → mots
  const fIdx = new Map(X.fiches.map((s) => [s.src, 0])), wInL = new Map(mots.map((m) => [m, 0]));
  for (const m of mots) for (const s of X.fiches) {
    const p = m.par.find((q) => q.src === s.src); if (!p) continue;
    const fb = fy.get(s.src), i = fIdx.get(s.src); fIdx.set(s.src, i + 1);
    const y0 = fb.y + off(fb, fb.k * U) + i * U + U / 2;
    const wb = wy.get(m), j = wInL.get(m); wInL.set(m, j + 1);
    const y1 = wb.y + off(wb, mentions(m) * U) + j * U + U / 2;
    out.push(courbe(XL, y0, XW0, y1, m, p.nature !== 'mot'));
  }
  // mots → destinations
  const dIdx = new Map(dest.map((d) => [d, 0]));
  for (const d of dest) for (const m of d.mots) {
    const wb = wy.get(m), db = dy.get(d);
    for (let j = 0; j < mentions(m); j++) {
      const i = dIdx.get(d); dIdx.set(d, i + 1);
      const y0 = wb.y + off(wb, mentions(m) * U) + j * U + U / 2, y1 = db.y + off(db, db.k * U) + i * U + U / 2;
      out.push(courbe(XW1, y0, XD, y1, m, m.par[j].nature !== 'mot'));
    }
  }
  const fiches = X.fiches.map((s) => { const b = fy.get(s.src); return `<div class="${P}-fn" style="top:${b.y}px;height:${b.h}px"><b>${esc(C.COURTSRC[s.src] || s.src)}</b><span class="${s.an ? '' : P + '-inc'}">${s.an || 'année ?'}</span></div>`; }).join('');
  const wl = mots.map((m) => { const b = wy.get(m), f = m.fam; return `<div class="${P}-wn${m.fr.length > 17 ? ' ' + P + '-long' : ''}${f ? '' : ' ' + P + '-hors'}${m.gout ? '' : ' ' + P + '-cat'}" style="top:${b.y}px;height:${b.h}px${f ? `;--b:${JET[f].base};--t:${JET[f].texte};--f:${JET[f].fond}` : ''}"${f ? ` data-famille="${f}"` : ''}><span>${esc(m.gout ? m.fr : m.par[0].orig.toLowerCase())}</span><b class="mono">${m.n}/${X.N}</b></div>`; }).join('');
  const dl = dest.map((d) => { const b = dy.get(d), f = d.f;
    if (!f) return `<div class="${P}-dn ${P}-hors" style="top:${b.y}px;height:${b.h}px"><i></i><span><b>Hors des 12</b><small>${d.mots.length} mot${d.mots.length > 1 ? 's' : ''}, hors du radar</small></span></div>`;
    const vide = !d.mots.length;
    return `<div class="${P}-dn${vide ? ' ' + P + '-vide' : ''}${C.STYLE16D.includes(f) && mode === 'style' ? ' ' + P + '-s16' : ''}" style="top:${b.y}px;height:${b.h}px;--b:${JET[f].base};--t:${JET[f].texte}" data-famille="${f}"><i></i><span>${pic(f, 14)}<b>${COURT[f]}</b>${vide ? '<small>personne</small>' : `<small class="mono">${X.fam[f].n}/${X.N}</small>`}</span></div>`; }).join('');
  const zone = mode === 'style' ? `<div class="${P}-zo" data-role="zone" aria-label="Familles que ta 16D accueille" style="top:${dy.get(dest[0]).y - 2}px;height:${dy.get(dest[2]).y + dy.get(dest[2]).h - dy.get(dest[0]).y + 4}px"></div>` : '';
  return `<div class="${P}-fx ${P}-m-${mode}" style="height:${H}px"><svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true">${out.join('')}</svg>${zone}${fiches}${wl}${dl}</div>`;
}

function fiche(h) {
  const X = C.H[h], k = X.mots.filter((m) => m.fam).length, M = X.mots.length, tous = X.hors.filter((m) => m.n === X.N && X.N > 1).length;
  return `<div class="${P}-tete"><div class="${P}-g"><div class="${P}-l1">${C.nomH(h, P + '-nom')}</div>
      <div>${C.alpha(h, P)}</div><div class="${P}-l3">${C.role(h, P + '-us')}${C.stock(h, P + '-stk')}</div></div>
    ${C.radar(h, { P, r: 38, lab: 34, labv: 14, nn: false, ecart: 0.26 })}</div>
  <p class="${P}-une"><b class="mono">${k}</b><span>mot${k > 1 ? 's' : ''} sur ${M} dans le radar</span>${M - k ? `<em>${M - k} restent dehors${tous ? `, dont ${tous} que ses ${X.N} fiches disent` : ''}</em>` : ''}</p>
  <div class="${P}-bar">${C.lentille(P)}${C.legB(P)}</div><div class="${P}-co"><b>fiches</b><b>mots</b><b>famille<span class="${P}-z16"> · 16D</span></b></div>
  ${flux(h, 'style')}${flux(h, 'absolu')}
  <p class="${P}-pers"><b>Personne ne dit</b>${C.ORDRE.filter((f) => !X.fam[f].n).map((f) => `<span><i class="${P}-hc" aria-hidden="true"></i>${COURT[f]}</span>`).join('')}</p>
  <p class="${P}-qui">${X.fiches.map((s) => `<span><b>${esc(C.COURTSRC[s.src] || s.src)}</b> ${esc(s.src)}, ${s.an || 'année absente du dépôt'}</span>`).join('')}</p>`;
}

const corps = `<div class="${P}-feuille" role="dialog" aria-label="Fiche du houblon">${C.croix(P)}${C.sections(P, DEF, fiche)}<div class="${P}-pied">${C.choix(P, DEF)}</div></div>`;

const css = `
  .${P}-feuille { position: relative; padding: 12px 12px 20px; }
  .${P}-x { position: absolute; right: 10px; top: 10px; width: 36px; height: 36px; border-radius: 50%; background: #eceef1; display: inline-flex; align-items: center; justify-content: center; z-index: 2; }
  .${P}-tete { display: flex; justify-content: space-between; align-items: flex-end; }
  .${P}-g { display: flex; flex-direction: column; gap: 3px; padding-top: 2px; }
  .${P}-nom { font-size: 26px; font-weight: 700; line-height: 1.05; }
  .${P}-al { display: flex; flex-direction: column; }
  .${P}-alg { font-size: 14px; color: #4a4d55; } .${P}-alg b { font-size: 21px; color: #16161a; font-weight: 600; }
  .${P}-all { font-size: 12px; color: #5d6069; max-width: 210px; }
  .${P}-l3 { display: flex; gap: 8px; align-items: center; }
  .${P}-us { font-size: 13px; padding: 1px 9px; border-radius: 999px; box-shadow: inset 0 0 0 1px #9a9ca4; }
  .${P}-stk { display: inline-flex; align-items: center; gap: 3px; font-size: 12px; color: #5d6069; }
  .${P}-radar { flex: none; margin: 30px 0 0 0; }
  .${P}-rl { font: 600 10.5px var(--sans); fill: #2b2d33; } .${P}-rl.inc { fill: #6b6f78; font-weight: 400; }
  .${P}-une { display: flex; align-items: baseline; flex-wrap: wrap; gap: 0 8px; margin: 8px 0 4px; }
  .${P}-une b { font-size: 40px; line-height: .9; }
  .${P}-une span { font-size: 18px; font-weight: 700; }
  .${P}-une em { flex-basis: 100%; font-style: normal; font-size: 14px; color: #3b3d45; }
  .${P}-bar { display: flex; align-items: center; justify-content: flex-end; gap: 8px; margin: 4px 0 6px; }
  .${P}-co { display: grid; margin-bottom: 4px; grid-template-columns: ${XL}px ${XW1 - XL}px 1fr; font-size: 12px; color: #4a4d55; }
  .${P}-co b { font-weight: 600; white-space: nowrap; } .${P}-z16 { font-weight: 400; } body.abs .${P}-z16 { display: none; } .${P}-co b:nth-child(2) { padding-left: ${XW0 - XL}px; } .${P}-co b:nth-child(3) { padding-left: ${XD - XW1}px; }
  .${P}-bar .lentille { margin-left: auto; }
  .${P}-fx { position: relative; width: ${W}px; }
  .${P}-fx svg { position: absolute; left: 0; top: 0; }
  body.abs .${P}-m-style, body:not(.abs) .${P}-m-absolu { display: none; }
  .${P}-fn { position: absolute; left: 0; width: ${XL}px; border-radius: 4px; background: #16161a; color: #fff; display: flex; flex-direction: column; justify-content: center; padding: 0 7px; }
  .${P}-fn b { font: 600 14px var(--mono); } .${P}-fn span { font: 400 12px var(--mono); } .${P}-fn span.${P}-inc { color: #fff; text-decoration: underline dotted; }
  .${P}-wn { position: absolute; left: ${XW0}px; width: ${XW1 - XW0}px; border-radius: 4px; background: var(--f); box-shadow: inset 0 0 0 1px var(--b); color: var(--t); display: flex; align-items: center; justify-content: space-between; gap: 2px; padding: 0 6px; font-size: 13px; font-weight: 600; }
  .${P}-wn span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .${P}-wn.${P}-long { font-size: 11.5px; }
  .${P}-wn b { font-size: 11px; color: #16161a; flex: none; }
  .${P}-wn.${P}-hors { background: #fff; color: #16161a; box-shadow: inset 0 0 0 1.5px #3b3d45; font-weight: 700; }
  .${P}-wn.${P}-cat { background: #fff; font-weight: 400; font-style: italic; }
  .${P}-dn { position: absolute; left: ${XD}px; right: 0; display: flex; align-items: center; gap: 4px; }
  .${P}-dn > i { width: 6px; align-self: stretch; border-radius: 2px; background: var(--b); flex: none; }
  .${P}-dn > span { padding-left: 5px; display: flex; flex-wrap: wrap; align-items: center; gap: 0 3px; font-size: 13px; color: var(--t); line-height: 1.1; }
  .${P}-dn small { font-size: 12px; color: #4a4d55; }
  .${P}-dn.${P}-vide > i { background: repeating-linear-gradient(135deg, #fff 0 2px, #9aa0ab 2px 3.5px); box-shadow: inset 0 0 0 1px #8a909b; }
  .${P}-dn.${P}-hors > i { background: #3b3d45; }
  .${P}-dn.${P}-hors > span { color: #16161a; flex-direction: column; align-items: flex-start; }
  .${P}-dn.${P}-hors b { font-size: 14px; } .${P}-dn.${P}-hors small { color: #3b3d45; font-size: 12px; }
  .${P}-zo { position: absolute; left: ${XD - 4}px; right: 0; background: #f1f2f4; box-shadow: inset 3px 0 0 #16161a; border-radius: 0 4px 4px 0; }
  .${P}-zo span { position: absolute; right: 4px; bottom: 3px; font-size: 11px; font-weight: 700; color: #16161a; white-space: nowrap; }
  .${P}-pers { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 9px; font-size: 13px; color: #4a4d55; margin-top: 10px; padding-top: 6px; border-top: 1px solid #e4e5e9; }
  .${P}-pers b { color: #16161a; } .${P}-pers span { display: inline-flex; align-items: center; gap: 3px; }
  .${P}-hc { width: 12px; height: 12px; border-radius: 2px; background: repeating-linear-gradient(135deg, #fff 0 2px, #9aa0ab 2px 3.5px); box-shadow: inset 0 0 0 1px #8a909b; }
  .${P}-qui { display: flex; flex-direction: column; margin-top: 6px; font-size: 12px; color: #4a4d55; } .${P}-qui b { font-family: var(--mono); color: #16161a; display: inline-block; min-width: 46px; }
  .${P}-pied { margin-top: 12px; }
  .${P}-hs { display: flex; flex-wrap: wrap; gap: 4px; }
  .${P}-hb { height: 28px; padding: 0 10px; border-radius: 999px; box-shadow: inset 0 0 0 1px #c9cad0; font-size: 13px; }
  .${P}-hb[aria-pressed="true"] { box-shadow: inset 0 0 0 1.5px #16161a; }
  .${P}-hb .hn { display: inline-flex; align-items: center; gap: 5px; font-weight: 600; }
  .${P}-hp { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }`;

C.ecrire(path.join(ICI, 'etat.html'), C.page({ id: P, chaleur: 'chaude', titre: 'où vont les mots', resume: 'flux fiches → mots → familles ou hors des 12', corps, css }));
