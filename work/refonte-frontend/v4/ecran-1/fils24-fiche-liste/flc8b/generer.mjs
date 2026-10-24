// flc8b · passe 2 de flc8 (chaude, les mots tamponnés), d'après le verdict du conseil rapide (conseil-fl/verdict.md, point 2) :
// - le cadre g1 rétabli : l'étape Houblons derrière la feuille, l'en-tête (nom, ✕, un seul α, celui de g1, avec le lot et
//   sa jauge, en police du thème ; « hors de ses fiches » gardé), le pied (♡ ⊘ Comparer, Styles › Huiles › Sources › Substituts ›) ;
// - le radar avant les tuiles, à sa taille, étiqueté (famille et fiches qui la citent) ;
// - les tuiles « personne » remplacées par une ligne « aucune fiche : Floral ? … » ;
// - tampons de 12 px au moins.
// Une question (« Que sent … ? »), un seul facteur libre : le houblon (changé depuis l'étape, derrière la feuille) ; en
// contexte, ta 16D et le houblon brut (les fiches décrivent le cône, pas un moment de la bière).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as C from '../flc1/commun-c.mjs';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const P = 'flc8b', { esc, ic, pic, fr, COURT, JET } = C;
const DEF = 'Nelson Sauvin';
const ROT = [-5, 4, -3, 6];

// Un seul α, celui de g1 : la plage de la fiche la plus récente (Hopsteiner 2025), le lot à côté, sa jauge.
function alpha(h) {
  const A = C.H[h].alpha, r = A.recente;
  const lo = Math.min(...A.sources.map((x) => x.min)), hi = Math.max(...A.sources.map((x) => x.max));
  const big = A.cryo ? fr(A.lot) + ' %' : C.plage(r) + ' %';
  const hors = !A.cryo && A.lot != null && (A.lot < lo || A.lot > hi);
  const M = Math.max(16, Math.ceil(Math.max(hi, A.lot || 0) + 2)), x = (v) => (100 * v / M).toFixed(1) + '%';
  return `<span class="${P}-al" data-role="alpha"><span class="${P}-alg">α <b>${big}</b></span><span class="${P}-all">${A.cryo ? `lot · fiche ${C.plage(r)} % en pellets` : `lot ${fr(A.lot)} %${hors ? ' · hors de ses fiches' : ''}`}</span>
    <span class="${P}-jg" role="img" aria-label="α : fiches ${C.plage(r)} %, lot ${fr(A.lot)} %"><i class="${P}-jb" style="left:${x(r.min)};width:calc(${x(r.max)} - ${x(r.min)})"></i><i class="${P}-jl${hors ? ' ' + P + '-jh' : ''}" style="left:${x(A.lot)}"></i></span></span>`;
}

function tuiles(h) {
  const X = C.H[h];
  const span = (m) => (m.n === X.N && X.N > 1 ? 6 : m.n / X.N >= 0.5 && X.N > 2 ? 3 : X.N === 1 ? 3 : 2);
  const sty = [...X.mots].sort((a, b) => (C.STYLE16D.includes(b.fam) - C.STYLE16D.includes(a.fam)) || b.n - a.n || (b.gout - a.gout));
  const abs = [...X.mots].sort((a, b) => b.n - a.n || (b.gout - a.gout));
  const tuile = (m) => {
    const f = m.fam, s16 = C.STYLE16D.includes(f), mot = m.gout ? m.fr : m.par[0].orig;
    const st = f ? ` data-famille="${f}" style="--b:${JET[f].base};--t:${JET[f].texte};--f:${JET[f].fond};` : ' style="';
    return `<div class="${P}-t${f ? '' : ' ' + P + '-hors'}${m.gout ? '' : ' ' + P + '-cat'}${s16 ? ' ' + P + '-s16' : ''} ${P}-s${span(m)}"${st}grid-column:span ${span(m)};--os:${sty.indexOf(m) + 1};--oa:${abs.indexOf(m) + 1}">
      <span class="${P}-tn">${f ? pic(f, 16) : `<i class="${P}-ho" aria-hidden="true"></i>`}<b>${m.n}/${X.N}</b>${f ? '' : `<span class="${P}-h12">hors des 12</span>`}</span>
      <span class="${P}-tw${mot.length > (span(m) === 2 ? 9 : 16) ? ' ' + P + '-long' : ''}">${esc(mot)}</span>${m.gout ? '' : `<span class="${P}-tr">rangé par le fournisseur</span>`}
      <span class="${P}-tps">${m.par.map((p, i) => `<span class="${P}-tp${p.nature === 'mot' ? '' : ' ' + P + '-tpc'}${p.an ? '' : ' ' + P + '-tpi'}" style="--r:${ROT[(i + m.fr.length) % 4]}deg">${esc(C.COURTSRC[p.src] || p.src)} ${p.an || '?'}</span>`).join('')}</span></div>`;
  };
  const nd = C.ORDRE.filter((f) => !X.fam[f].n);
  const zoneTxt = X.mots.some((m) => C.STYLE16D.includes(m.fam)) ? 'ta 16D accueille d’abord floral, herbacé, terreux' : 'ta 16D accueille d’abord floral, herbacé, terreux : ses fiches n’en disent rien';
  return `<div class="${P}-g">
    <div class="${P}-zo" data-role="zone" style="--os:0"><i aria-hidden="true"></i>${zoneTxt}</div>
    ${X.mots.map(tuile).join('')}</div>
  <p class="${P}-nd"><b>aucune fiche</b>${nd.map((f) => `<span data-famille="${f}" style="color:${JET[f].texte}">${pic(f, 14)}${COURT[f]}<i>?</i></span>`).join('')}</p>`;
}

function fiche(h) {
  const X = C.H[h];
  return `<div class="${P}-l1">${C.nomH(h, P + '-nom')}${C.stock(h, P + '-stk')}${C.role(h, P + '-us')}${C.croix(P)}</div>
  <div class="${P}-l2">${alpha(h)}</div>
  <h2 class="${P}-q">Que sent ${esc(h)}, d’après ses ${X.N} fiche${X.N > 1 ? 's' : ''} ?</h2>
  <p class="${P}-ctx" data-role="contexte"><span data-contexte="base">${ic('biere', 14)}ta Stout 16D</span><span data-contexte="moment">houblon brut, avant tout moment</span></p>
  ${C.radar(h, { P, r: 84, labv: 24, w: 366, ecart: 0.16 })}
  <div class="${P}-bar"><span class="${P}-enc">${X.fiches.map((s) => `<span><b>${esc(C.COURTSRC[s.src] || s.src)}</b> ${esc(s.src.replace(' (boutique US)', ' US'))} ${s.an || '?'}</span>`).join('')}</span>${C.lentille(P)}${C.legB(P)}</div>
  ${tuiles(h)}
  <div class="${P}-pied"><span class="${P}-gout" data-role="gout"><button type="button" aria-label="J’aime">${ic('coeur', 16)}</button><button type="button" aria-label="Exclure">${ic('ban', 16)}</button></span><button type="button" class="${P}-cmp">Comparer</button></div>
  <div class="${P}-plus"><button type="button">Styles ›</button><button type="button">Huiles ›</button><button type="button">Sources ›</button><button type="button">Substituts ›</button></div>`;
}

const corps = `
<div class="${P}-etape"><div class="${P}-et1"><span aria-hidden="true">${ic('chev-l', 20)}</span><b>Houblons</b><span class="${P}-et-n">3/7</span><span class="${P}-et-s">16D <i>hypothèse</i></span></div>
  <div class="${P}-hs" data-libre="houblon" aria-label="Houblon de la fiche">${C.HOPS.map((h) => `<button type="button" class="${P}-hb" data-hsel="${esc(h)}" aria-pressed="${h === DEF}"><span class="hn" data-houblon="${esc(C.H[h].cle)}" data-couleur="${C.H[h].couleur}"><i class="${P}-hp" style="background:${C.H[h].couleur}" aria-hidden="true"></i>${esc(h)}</span></button>`).join('')}</div></div>
<div class="${P}-feuille" role="dialog" aria-label="Fiche du houblon"><i class="${P}-poi" aria-hidden="true"></i>
  ${C.sections(P, DEF, fiche)}
</div>`;

const css = `
  .${P}-etape { background: #e4e5e9; padding: 6px 12px 22px; color: #3b3d45; }
  .${P}-et1 { display: flex; align-items: center; gap: 6px; height: 32px; }
  .${P}-et1 b { font-size: 18px; } .${P}-et-n { font-size: 13px; color: #4a4d55; }
  .${P}-et-s { margin-left: auto; font-size: 13px; padding: 2px 4px 2px 10px; border-radius: 999px; box-shadow: inset 0 0 0 1px #9a9ca4; display: inline-flex; gap: 6px; align-items: center; }
  .${P}-et-s i { font-style: normal; background: #cfd0d5; border-radius: 999px; padding: 0 8px; }
  .${P}-hs { display: flex; gap: 4px; overflow-x: auto; scrollbar-width: none; margin-top: 4px; }
  .${P}-hb { height: 28px; padding: 0 9px; border-radius: 999px; box-shadow: inset 0 0 0 1px #9a9ca4; font-size: 13px; white-space: nowrap; flex: none; }
  .${P}-hb[aria-pressed="true"] { background: #fff; box-shadow: inset 0 0 0 1.5px #16161a; }
  .${P}-hb .hn { display: inline-flex; align-items: center; gap: 5px; font-weight: 600; color: #16161a; }
  .${P}-hp { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
  .${P}-feuille { position: relative; margin-top: -14px; background: #fff; border-radius: 24px 24px 0 0; padding: 12px 12px 20px; box-shadow: 0 -1px 0 #d6d7dc; }
  .${P}-poi { display: block; width: 36px; height: 4px; border-radius: 2px; background: #c9cad0; margin: -4px auto 4px; }
  .${P}-l1 { display: flex; align-items: center; gap: 8px; }
  .${P}-nom { font-size: 24px; font-weight: 700; }
  .${P}-stk { display: inline-flex; align-items: center; gap: 3px; font-size: 12px; color: #5d6069; }
  .${P}-x { margin-left: auto; width: 36px; height: 36px; border-radius: 50%; background: #eceef1; display: inline-flex; align-items: center; justify-content: center; flex: none; }
  .${P}-l2 { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .${P}-al { display: inline-flex; align-items: baseline; gap: 6px; flex-wrap: wrap; }
  .${P}-alg { font-size: 15px; color: #4a4d55; } .${P}-alg b { font-size: 22px; color: #16161a; font-weight: 700; }
  .${P}-all { font-size: 13px; color: #4a4d55; }
  .${P}-jg { position: relative; display: inline-block; width: 64px; height: 8px; border-radius: 999px; background: #e4e5e9; align-self: center; }
  .${P}-jb { position: absolute; top: 0; bottom: 0; border-radius: 999px; background: #9a9ca4; }
  .${P}-jl { position: absolute; top: -3px; width: 3px; height: 14px; margin-left: -1.5px; border-radius: 2px; background: #16161a; }
  .${P}-jl.${P}-jh { background: #c2410c; }
  .${P}-us { margin-left: 4px; font-size: 13px; padding: 1px 9px; border-radius: 999px; box-shadow: inset 0 0 0 1px #9a9ca4; }
  .${P}-q { font-size: 16px; font-weight: 700; margin-top: 8px; }
  .${P}-ctx { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 3px; font-size: 12px; }
  .${P}-ctx span { display: inline-flex; align-items: center; gap: 4px; height: 22px; padding: 0 8px; border-radius: 999px; background: #eceef1; color: #3b3d45; }
  .${P}-radar { display: block; margin: 2px auto 0; }
  .${P}-rl { font: 600 12px var(--sans); fill: #2b2d33; } .${P}-rl.inc { fill: #6b6f78; font-weight: 400; }
  .${P}-bar { display: flex; align-items: center; gap: 6px; margin: 4px 0 8px; }
  .${P}-enc { flex: 1; display: flex; flex-direction: column; font-size: 12px; color: #3b3d45; line-height: 1.25; }
  .${P}-enc b { color: #16161a; }
  .${P}-g { display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; }
  .${P}-g > * { order: var(--os); }
  body.abs .${P}-g > * { order: var(--oa); }
  .${P}-zo { grid-column: span 6; display: flex; align-items: center; gap: 6px; font-size: 12px; color: #3b3d45; }
  .${P}-zo i { width: 18px; height: 12px; border-radius: 2px; background: #16161a; flex: none; }
  body.abs .${P}-zo { display: none; }
  .${P}-t { position: relative; min-height: 60px; border-radius: 8px; background: var(--f); box-shadow: inset 0 0 0 1.5px var(--b); padding: 6px 8px 26px; display: flex; flex-direction: column; overflow: hidden; }
  .${P}-t.${P}-s16::after { content: '16D'; position: absolute; top: 0; right: 0; font: 700 12px/1 var(--sans); color: #fff; background: #16161a; padding: 3px 5px; border-radius: 0 8px 0 4px; }
  body.abs .${P}-t.${P}-s16::after { display: none; }
  .${P}-tn { display: flex; align-items: center; gap: 4px; }
  .${P}-tn b { font-size: 13px; color: #16161a; }
  .${P}-h12 { font-size: 12px; color: #3b3d45; }
  .${P}-tw { font-size: 19px; font-weight: 700; color: var(--t); line-height: 1.05; margin-top: 2px; }
  .${P}-t.${P}-s6 .${P}-tw { font-size: 28px; }
  .${P}-t.${P}-s3 .${P}-tw { font-size: 22px; }
  .${P}-t .${P}-tw.${P}-long { font-size: 16px; }
  .${P}-t.${P}-hors { background: #fff; box-shadow: inset 0 0 0 2.5px #16161a; }
  .${P}-t.${P}-hors .${P}-tw { color: #16161a; }
  .${P}-t.${P}-cat { background: #fff; box-shadow: inset 0 0 0 1px var(--b, #8b8e97); }
  .${P}-t.${P}-cat .${P}-tw { font-weight: 400; font-style: italic; font-size: 17px; }
  .${P}-tr { font-size: 12px; color: #4a4d55; }
  .${P}-ho { width: 16px; height: 16px; border-radius: 50%; box-shadow: inset 0 0 0 1.5px #3b3d45; flex: none; }
  .${P}-tps { position: absolute; right: 6px; bottom: 5px; display: flex; gap: 4px; }
  .${P}-tp { font: 700 12px/1 var(--mono); color: #16161a; padding: 3px 4px; border-radius: 2px; box-shadow: inset 0 0 0 1.5px #16161a; background: #fff; transform: rotate(var(--r)); white-space: nowrap; }
  .${P}-tp.${P}-tpc { box-shadow: inset 0 0 0 1px #6b6f78; color: #3b3d45; font-weight: 500; }
  .${P}-tp.${P}-tpi { text-decoration: underline dotted; }
  .${P}-nd { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 10px; font-size: 13px; margin-top: 8px; padding-top: 6px; border-top: 1px solid #e4e5e9; }
  .${P}-nd b { color: #16161a; font-weight: 600; }
  .${P}-nd span { display: inline-flex; align-items: center; gap: 3px; }
  .${P}-nd span .pi { opacity: .55; }
  .${P}-nd i { font-style: normal; color: #4a4d55; }
  .${P}-pied { display: flex; align-items: center; justify-content: space-between; margin-top: 10px; }
  .${P}-gout { display: inline-flex; gap: 4px; background: #eceef1; border-radius: 999px; padding: 4px 6px; }
  .${P}-gout button { width: 32px; height: 28px; display: inline-flex; align-items: center; justify-content: center; }
  .${P}-cmp { height: 36px; padding: 0 16px; border-radius: 999px; box-shadow: inset 0 0 0 1px #9a9ca4; font-size: 15px; }
  .${P}-plus { display: flex; gap: 6px; margin-top: 10px; }
  .${P}-plus button { flex: 1; height: 32px; border-radius: 999px; background: #eceef1; font-size: 13px; white-space: nowrap; }`;

C.ecrire(path.join(ICI, 'etat.html'), C.page({ id: P, chaleur: 'chaude', titre: 'les mots tamponnés, passe 2', resume: 'flc8 dans le cadre g1 : radar étiqueté d’abord, une tuile par mot tamponnée par ses fiches', corps, css }));

// Captures : Nelson Sauvin et Nugget (même premier écran), page entière, et les états qui comptent.
if (process.argv.includes('--captures')) {
  const { default: puppeteer } = await import('puppeteer-core');
  const { pathToFileURL } = await import('node:url');
  const OUT = path.join(C.LOT, 'captures'), url = pathToFileURL(path.join(ICI, 'etat.html')).href;
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  for (const [suf, q, full] of [['nelson', '', false], ['nugget', '?h=Nugget', false], ['page', '', true], ['nugget-page', '?h=Nugget', true], ['cascade', '?h=Cascade', false], ['absolu', '?abs', false], ['legende', '?legende', false]]) {
    const p = await b.newPage();
    await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await p.goto(url + q, { waitUntil: 'networkidle0' }); await wait(400);
    await p.screenshot({ path: path.join(OUT, P + '-' + suf + '.png'), fullPage: full });
    await p.close();
  }
  const p = await b.newPage();
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await p.goto(url, { waitUntil: 'networkidle0' }); await wait(400);
  const h = await p.$('[data-houblon="Nelson Sauvin"]');
  const t = await h.touchStart(); await wait(700); await t.end(); await wait(500);
  await p.screenshot({ path: path.join(OUT, P + '-fiche-g1.png') });
  await p.close(); await b.close();
  console.log('captures ' + P);
}
void fs;
