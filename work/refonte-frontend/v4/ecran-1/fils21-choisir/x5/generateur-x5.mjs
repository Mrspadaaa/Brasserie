// Lot 21 · x5 · « Le verre et le défi » (froide : jeu, métaphore, rupture).
// Ta stout dans un verre. Son nez en sort : douze volutes, une par famille, hautes de leur intensité simulée ; le
// dôme pointillé, c'est ce que la 16D permet (arôme de houblon « faible et facultatif ») ; une volute qui le perce
// rougit d'orangé ; la moustache pointillée va jusqu'à la borne haute (flèche si elle sort du dessin).
// Le défi est celui de ta dégustation (18.10 : « ma stout est trop résineuses, je la veux plus floral ») :
// plus de floral, moins de résineux, rien qui déborde du dôme. On joue avec des jetons de houblon (un ou deux),
// un endroit (chaudron 60′ ou 10′, whirlpool, cuve active, cuve au repos), une dose et une levure. Le jeu montre ce
// que l'outil sait : le houblon ne retire jamais du résineux (le moteur en ajoute avec le myrcène).
// Usage : node generateur-x5.mjs  →  x5/etat.html
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as S from '../x1/socle-x.mjs';
import { tableReelle, BIERE, IBU_BIERE } from '../x1/donnees-reelles.mjs';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const { HB, ORDRE, NOM, COURT, JET, picto, ic, hn, alpha, usage, stock, pt, lentille, legende, LEGENDE_COMMUNE, page, ecrire } = S;
const T = tableReelle();
const HOPS = ['citra', 'cascade', 'galaxy', 'idaho7'];
const DEF = { h: ['cascade'], m: 'dryPost', dose: 2, lv: 'us05' };
const seg = (nom, reglage, opts, actif, cls = '') => `<span class="seg rg ${cls}" role="radiogroup" aria-label="${nom}">${opts.map(([v, t, extra = '']) => `<button role="radio" data-role="reglage" data-reglage="${reglage}" data-v="${v}" aria-checked="${String(v) === String(actif)}" ${extra}>${t}</button>`).join('')}</span>`;
const jeton = (k) => `<button class="jt" data-voie="${k}" data-role="reglage" data-reglage="jeton" data-v="${k}" data-houblon="${HB[k].nom}" aria-pressed="${DEF.h.includes(k)}" style="--hc:${HB[k].couleur}"><i class="jt-d" data-houblon="${HB[k].nom}" data-couleur="${HB[k].couleur}" style="background:${HB[k].couleur}"></i><span class="jt-n">${HB[k].nom}</span><span class="jt-a">${alpha(k, { fiches: false })}</span><span class="jt-u">${usage(k)}</span></button>`;
const corps = `
  <header class="tete"><h1>Le verre et le défi</h1>${lentille()}${legende([...LEGENDE_COMMUNE, ['<span class="lg-dome"></span>', 'le dôme : ce que la 16D permet'], ['<span class="lg-vol"></span>', 'une volute : une famille, sa hauteur simulée']])}</header>
  <section class="defi" data-role="defi" aria-label="Le défi de ta dégustation">
    <p class="defi-t">${ic('cible', 16)}<span><b>Ton défi</b> · ta dégustation, 18.10 : « trop résineuse, je la veux plus florale »</span></p>
    <div class="defi-l" data-role="defi-l"></div>
  </section>
  <section class="verre" data-role="simulation" aria-label="Le nez de ta stout">
    <p class="vr-t"><span class="estime">~ simulé</span><span data-role="vr-q">le nez de ta 16D</span><span class="conf" data-role="confiance"></span></p>
    <div class="svg" data-role="dessin"></div>
  </section>
  <section class="jeu" aria-label="Tes jetons">
    <div class="jts" data-role="ajout">${HOPS.map(jeton).join('')}</div>
    <p class="aide gris">un jeton : seul · deux jetons : ensemble, 2 + 2 g/L, à sec</p>
    <div class="rang">${seg('Où', 'moment', [['b60', ic('flamme', 14) + '60′'], ['b10', ic('flamme', 14) + '10′'], ['wp', ic('whirl', 14) + 'whirlpool'], ['dryActive', ic('cuveA', 14) + 'cuve active'], ['dryPost', ic('cuveP', 14) + 'cuve au repos']], DEF.m, 'seg-m')}</div>
    <div class="rang">${seg('Dose', 'dose', [1, 2, 4, 8].map((d) => [d, d + ' g/L']), DEF.dose)}${seg('Levure', 'levure', [['us05', 'US-05'], ['pomona', 'Pomona'], ['verdant', 'Verdant']], DEF.lv)}</div>
    <p class="lv-note" data-role="note"></p>
  </section>
  <section class="vrai" aria-label="Les vraies valeurs"><div class="vrai-t">vraies valeurs</div><div data-role="vraies"></div></section>`;

const css = `
  .rang { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .defi { background: var(--doux); border-radius: 8px; padding: 8px 10px; display: flex; flex-direction: column; gap: 6px; }
  .defi-t { display: flex; align-items: center; gap: 6px; font-size: 13px; }
  .defi-l { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .ob { display: flex; flex-direction: column; gap: 2px; padding: 6px; border-radius: 8px; background: #fff; font-size: 12px; min-height: 58px; }
  .ob b { font-size: 13px; display: inline-flex; align-items: center; gap: 4px; }
  .ob .st { display: inline-flex; align-items: center; gap: 3px; font-weight: 600; }
  .ob.ok { box-shadow: inset 0 0 0 2px #0f5c3a; } .ob.ok .st { color: #0f5c3a; }
  .ob.non .st { color: var(--gris); }
  .ob.imp { box-shadow: inset 0 0 0 1px var(--trait2); } .ob.imp .st { color: var(--gris); }
  .ob.x { box-shadow: inset 0 0 0 2px var(--acc); } .ob.x .st { color: var(--acc); }
  .verre { display: flex; flex-direction: column; gap: 2px; }
  .vr-t { display: flex; align-items: baseline; gap: 6px; font-size: 13px; }
  .conf { margin-left: auto; font-size: 12px; color: var(--gris); }
  .svg svg { display: block; width: 100%; height: auto; overflow: visible; }
  .jts { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .jt { display: grid; grid-template-columns: 16px 1fr; grid-template-rows: auto auto; column-gap: 6px; align-items: center; padding: 6px 8px; border-radius: 8px; box-shadow: inset 0 0 0 1.5px var(--trait2); text-align: left; }
  .jt[aria-pressed="true"] { box-shadow: inset 0 0 0 2.5px var(--hc); background: #fff; }
  .jt-d { width: 14px; height: 14px; border-radius: 50%; grid-row: span 2; }
  .jt-n { font-weight: 700; font-size: 14px; -webkit-touch-callout: none; user-select: none; }
  .jt-a, .jt-u { grid-column: 2; display: inline-flex; gap: 6px; align-items: center; }
  .jt-u { display: none; } .jt[aria-pressed="true"] .jt-u { display: inline-flex; }
  .aide { font-size: 12px; }
  .seg-m { flex-wrap: wrap; flex: 1 1 100%; max-width: 100%; border-radius: 8px; }
  .seg-m button .ic { color: var(--gris); }
  .seg button:disabled { cursor: default; text-decoration: line-through; }
  .lv-note { font-size: 12px; color: var(--gris); min-height: 15px; }
  .vrai { display: flex; flex-direction: column; gap: 4px; border-top: 1px solid var(--trait); padding-top: 6px; }
  .vrai-t { font-size: 12px; font-weight: 600; color: var(--gris); }
  .vr { display: grid; grid-template-columns: 22px 1fr; align-items: center; column-gap: 6px; min-height: 26px; font-size: 13px; }
  .vr-l { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .vr-s { font-size: 12px; color: var(--gris); }
  .lg-dome { display: inline-block; width: 30px; height: 14px; border: 1.5px dashed var(--encre); border-bottom: 0; border-radius: 15px 15px 0 0; }
  .lg-vol { display: inline-block; width: 6px; height: 18px; border-radius: 3px; background: #d6a700; }
  .w-n { font: 400 12px var(--sans); }`;

const js = `
${S.JS_SIM}
const D = window.DONNEES, HBJ = D.houblons, NOMS = ${JSON.stringify(NOM)}, COURTS = ${JSON.stringify(COURT)}, J = ${JSON.stringify(ORDRE)}, JET = ${JSON.stringify(Object.fromEntries(ORDRE.map((f) => [f, { b: JET[f].base, t: JET[f].texte, f: JET[f].fond }])))};
const ST = ${JSON.stringify(DEF)};
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const fr = (x) => String(Math.round(x * 100) / 100).replace('.', ',');
const ic = (k, z = 14) => '<svg class="ic" width="' + z + '" height="' + z + '" aria-hidden="true"><use href="#i-' + k + '-' + z + '"/></svg>';
const picto = (f, z = 14) => '<svg class="pi" width="' + z + '" height="' + z + '" data-famille="' + f + '" role="img" aria-label="' + NOMS[f] + '"><use href="#p-' + f + '"/></svg>';
const vrai = (t, src, mot, cls = 'vv') => '<span class="' + cls + '" data-nature="mesure" data-source="' + esc(src) + '">' + t + (mot ? '<span class="mot-c mot-' + mot + '">' + mot + '</span>' : '') + '</span>';
const inc = (t) => '<span class="inc" data-inconnu><i class="hach"></i>' + t + '</span>';
const SEC = (m) => m === 'dryActive' || m === 'dryPost';
const cle = (s) => s.h.length === 2 ? ['citra+' + s.h.find((k) => k !== 'citra'), s.m, 2, 3, s.lv] : [s.h[0], s.m, s.dose, 3, s.lv];
const profil = (s) => { if (!s.h.length) return SIMX.AV; const k = cle(s); return SIMX.profil(...k); };
const existe = (s) => !s.h.length || (s.h.length === 2 && !s.h.includes('citra') ? false : !!profil(s));
// Le dessin : le verre, la mousse, douze volutes en éventail, le dôme de la 16D.
function dessin(p) {
  const W = 366, H = 300, rimY = 166, cx = W / 2, abs = document.body.classList.contains('abs');
  const capC = 4.6, PXC = 30; // au style : 30 px par cran, cap 4,6 crans ; absolu : 0–100 sur 138 px
  const hV = (f, v) => abs ? Math.min(138, v / 100 * 138) : Math.min(capC * PXC, v / SIMX.Z[f].cran * PXC);
  const dome = (f) => abs ? SIMX.Z[f].bande[1] / 100 * 138 : 3 * PXC;
  let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Le verre de ta stout et son nez, simulé">';
  // le verre
  s += '<path d="M' + (cx - 74) + ',' + rimY + ' L' + (cx - 60) + ',' + (H - 6) + ' L' + (cx + 60) + ',' + (H - 6) + ' L' + (cx + 74) + ',' + rimY + ' Z" fill="#2b1a12"/>';
  s += '<path d="M' + (cx - 74) + ',' + rimY + ' L' + (cx - 72) + ',' + (rimY + 16) + ' L' + (cx + 72) + ',' + (rimY + 16) + ' L' + (cx + 74) + ',' + rimY + ' Z" fill="#efe3cf"/>';
  s += '<text x="' + cx + '" y="' + (rimY + 70) + '" text-anchor="middle" font-size="13" fill="#f5efe6" font-family="Source Sans 3, sans-serif">ma stout 16D</text>';
  const ib = !SEC(ST.m) && ST.h.length === 1 ? D.reel.ibu[ST.h[0] + '|' + ST.m + '|' + ST.dose] : null, tot = Math.round(D.ibu.v + (ib ? ib.v : 0));
  s += '<text x="' + cx + '" y="' + (rimY + 90) + '" text-anchor="middle" font-size="13" font-weight="' + (tot > 70 ? 700 : 400) + '" fill="' + (tot > 70 ? '#ffb38a' : '#e8dccb') + '" font-family="Source Sans 3, sans-serif" data-nature="mesure" data-source="' + esc(D.ibu.src + (ib ? ' ; ' + ib.src : '')) + '">' + (ib ? Math.round(D.ibu.v) + ' → ' : '') + tot + ' IBU</text>' + (tot > 70 ? '<text x="' + cx + '" y="' + (rimY + 108) + '" text-anchor="middle" font-size="13" font-weight="700" fill="#ffb38a" font-family="Source Sans 3, sans-serif">trop amer</text>' : '');
  // les volutes : bases sur le bord du verre, sommets en éventail
  const n = J.length, pts = [];
  J.forEach((f, i) => {
    const t = (i + 0.5) / n, bx = cx - 66 + t * 132, ang = (t - 0.5) * 1.5, L = 1;
    const tx = (h) => bx + Math.sin(ang) * h, ty = (h) => rimY - Math.cos(ang) * h;
    const v = p[f], nul = !(v.haut > 0) && !(v.centre > 0), h = hV(f, v.centre), hd = dome(f), hb = hV(f, v.bas), hh = hV(f, v.haut), ouv = abs ? v.haut > 100 : v.haut / SIMX.Z[f].cran > capC;
    pts.push([tx(hd), ty(hd)]);
    const c = JET[f];
    // la zone sous le dôme, pâle
    s += '<line x1="' + bx + '" y1="' + rimY + '" x2="' + tx(hd) + '" y2="' + ty(hd) + '" stroke="' + c.f + '" stroke-width="16" stroke-linecap="round" data-role="zone" data-famille="' + f + '"/>';
    if (nul) s += '<line x1="' + bx + '" y1="' + rimY + '" x2="' + tx(18) + '" y2="' + ty(18) + '" stroke="#9aa0ab" stroke-width="10" stroke-dasharray="2 2" />';
    else {
      // la moustache bas–haut, en pointillé
      s += '<line x1="' + tx(hb) + '" y1="' + ty(hb) + '" x2="' + tx(hh) + '" y2="' + ty(hh) + '" stroke="#5b5b66" stroke-width="1.5" stroke-dasharray="2 3"/>';
      if (ouv) s += '<path d="M' + (tx(hh) - 4) + ',' + (ty(hh) + 5) + ' L' + tx(hh + 6) + ',' + ty(hh + 6) + ' L' + (tx(hh) + 4) + ',' + (ty(hh) + 5) + '" fill="none" stroke="#5b5b66" stroke-width="1.5"/>';
      // la volute : au ton de la famille jusqu'au dôme, l'orangé au-delà
      const h1 = Math.min(h, hd);
      s += '<line x1="' + bx + '" y1="' + rimY + '" x2="' + tx(h1) + '" y2="' + ty(h1) + '" stroke="' + c.b + '" stroke-width="9" stroke-linecap="round" data-nature="simule" data-famille="' + f + '"><title>' + NOMS[f] + ', simulé</title></line>';
      if (h > hd + 0.5 && SIMX.AV[f].centre <= SIMX.Z[f].bande[1] || h > hd + 0.5 && f === 'resin') s += '<line x1="' + tx(hd) + '" y1="' + ty(hd) + '" x2="' + tx(h) + '" y2="' + ty(h) + '" stroke="#c2410c" stroke-width="9" stroke-linecap="round"/>';
    }
    // le picto et le nom, au pied
    const lx = tx(hd + 26), ly = ty(hd + 26);
    s += '<svg class="pi" data-famille="' + f + '" role="img" aria-label="' + NOMS[f] + '" x="' + (tx(Math.max(h, hd) + 14) - 8) + '" y="' + (ty(Math.max(h, hd) + 14) - 8) + '" width="16" height="16"><use href="#p-' + f + '"/></svg>';
  });
  // le dôme de la 16D
  s += '<path d="M' + pts.map((q) => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join(' L') + '" fill="none" stroke="#16161a" stroke-width="1.5" stroke-dasharray="5 4"/>';
  s += '<text x="' + (pts[0][0] - 6) + '" y="' + (pts[0][1] + 34) + '" text-anchor="end" font-size="12" fill="#16161a" font-family="Source Sans 3, sans-serif"><tspan x="' + (pts[0][0] - 6) + '">le dôme</tspan><tspan x="' + (pts[0][0] - 6) + '" dy="14">de la 16D</tspan></text>';
  s += '</svg>';
  // les noms des familles, sous le dessin, dans l'ordre des volutes : chaque couleur porte un mot
  return s + '<p class="w-n gris">' + J.map((f) => '<span data-famille="' + f + '" style="color:' + JET[f].t + '">' + COURTS[f] + '</span>').join(' · ') + '</p>';
}
function rendre() {
  document.querySelectorAll('[data-reglage="jeton"]').forEach((b) => b.setAttribute('aria-pressed', String(ST.h.includes(b.dataset.v))));
  document.querySelectorAll('button[data-reglage]').forEach((b) => { const r = b.dataset.reglage; if (r === 'jeton') return; const cur = { moment: ST.m, dose: ST.dose, levure: ST.lv }[r]; b.setAttribute('aria-checked', String(String(cur) === b.dataset.v)); b.disabled = (r === 'dose' && ST.h.length === 2 && b.dataset.v !== '2') || !existe(Object.assign({}, ST, { [{ moment: 'm', dose: 'dose', levure: 'lv' }[r]]: r === 'dose' ? Number(b.dataset.v) : b.dataset.v })); });
  const p = profil(ST) || SIMX.AV;
  document.querySelector('[data-role="dessin"]').innerHTML = dessin(p);
  const MO = { b60: 'à 60′', b10: 'à 10′', wp: 'au whirlpool', dryActive: 'en cuve active', dryPost: 'en cuve au repos' };
  document.querySelector('[data-role="vr-q"]').textContent = ST.h.length ? 'le nez avec ' + ST.h.map((k) => HBJ[k].nom).join(' + ') + ' ' + (ST.h.length === 2 ? '2 + 2' : ST.dose) + ' g/L ' + MO[ST.m] : 'le nez de ta 16D, sans houblon ajouté';
  document.querySelector('[data-role="confiance"]').innerHTML = 'confiance <b>' + (ST.h.some((k) => k === 'galaxy' || k === 'idaho7') || ST.h.length === 2 || !SEC(ST.m) ? 'faible' : 'moyenne') + '</b>';
  // le défi
  const dFl = (p.floral.centre - SIMX.AV.floral.centre) / SIMX.Z.floral.cran, dRe = p.resin.centre - SIMX.AV.resin.centre;
  const ibK = !SEC(ST.m) && ST.h.length === 1 ? D.reel.ibu[ST.h[0] + '|' + ST.m + '|' + ST.dose] : null, ibuT = Math.round(D.ibu.v + (ibK ? ibK.v : 0));
  const deb = J.filter((f) => SIMX.AV[f].centre <= SIMX.Z[f].bande[1] && p[f].centre > SIMX.Z[f].bande[1]);
  const ob = (cls, t, st, sous) => '<div class="ob ' + cls + '"><b>' + t + '</b><span class="st">' + st + '</span><span class="gris">' + sous + '</span></div>';
  document.querySelector('[data-role="defi-l"]').innerHTML =
    ob(dFl >= 0.5 ? 'ok' : 'non', picto('floral', 14) + 'plus floral', dFl >= 0.5 ? ic('check', 14) + 'atteint' : 'pas encore', '<span data-nature="simule">~ ' + (dFl >= 0 ? '+' : '') + fr(Math.round(dFl * 10) / 10) + ' cran</span>')
    + ob('imp', picto('resin', 14) + 'moins résineux', 'hors houblon', '<span data-nature="simule">~ ' + (dRe >= 0 ? '+' : '') + Math.round(dRe) + ' pts</span> : le houblon en ajoute')
    + ob(ibuT > 70 ? 'x' : 'ok', ic('goutte', 14) + 'amertume 50–70', ibuT > 70 ? 'trop amer' : ic('check', 14) + 'tenue', '<span data-nature="mesure" data-source="' + esc(D.ibu.src) + '">' + ibuT + ' IBU</span> (calcul)') + ob(deb.length ? 'x' : 'ok', ic('parapluie', 14) + 'sous le dôme', deb.length ? deb.length + ' débord' + (deb.length > 1 ? 'ent' : 'e') : ic('check', 14) + 'tenu', deb.length ? deb.map((f) => COURTS[f]).join(', ') : 'aucune famille ne déborde');
  // les vraies valeurs
  let v = '';
  for (const k of ST.h) v += '<div class="vr">' + ic('fiole', 16) + '<span class="vr-l">' + HBJ[k].nom + ' : ' + vrai(fr(HBJ[k].huile[0] * (ST.h.length === 2 ? 2 : ST.dose)) + '–' + fr(HBJ[k].huile[1] * (ST.h.length === 2 ? 2 : ST.dose)) + ' mL/hL', HBJ[k].huileSrc + ' ; huile × dose', 'calcul') + '<span class="vr-s">huile apportée</span></span></div>';
  if (!SEC(ST.m) && ST.h.length === 1) { const ib = D.reel.ibu[ST.h[0] + '|' + ST.m + '|' + ST.dose]; if (ib) v += '<div class="vr">' + ic('goutte', 16) + '<span class="vr-l">' + vrai(Math.round(D.ibu.v) + ' → ' + Math.round(D.ibu.v + ib.v) + ' IBU', ib.src, 'calcul') + '<span class="vr-s">la 16D : 50–70</span>' + (D.ibu.v + ib.v > 70 ? '<span class="xs">trop amer</span>' : '') + '</span></div>'; }
  for (const k of ST.h) for (const x of D.biere[k]) v += '<div class="vr">' + (x.famille ? picto(x.famille, 16) : ic('biere', 16)) + '<span class="vr-l">' + HBJ[k].nom + ' en bière : ' + (x.trou ? inc('aucune mesure') + '<span class="vr-s">' + esc(x.detail) + '</span>' : vrai((x.compose && x.famille ? picto(x.famille, 12) : '') + esc(x.txt), x.src, x.mot, 'vv txt') + (x.verifier ? '<span class="mot-c mot-verif">à vérifier</span>' : '') + '<span class="vr-s">' + esc(x.detail) + '</span>') + '</span></div>';
  if (ST.h.length === 2) v += '<div class="vr">' + ic('melange', 16) + '<span class="vr-l">' + vrai('dose totale 4 g/L : zone de saturation 4–8 g/L', 'Lafontaine, Shellhammer 2018 [22]', 'publié', 'vv txt') + '<span class="vr-s">synergie, masquage : ' + inc('inconnus') + '</span></span></div>';
  if (ST.m === 'dryActive') v += '<div class="vr" data-role="biotransformation">' + ic('etincelle', 16) + '<span class="vr-l">' + (ST.lv === 'pomona' ? picto('floral', 12) + ic('fleche', 12) + picto('citrus', 12) + '<span>Pomona : géraniol → citronellol « medium », Escarpment Labs [51]</span>' : ST.lv === 'verdant' ? picto('tropical', 12) + '<span>Verdant : thiols libérés, ampleur ' + inc('inconnue') + '</span>' : '<span>US-05 : β-lyase non publiée, ' + inc('inconnu') + '</span>') + '</span></div>';
  if (!v) v = '<div class="vr">' + ic('biere', 16) + '<span class="vr-l">' + vrai('résineux « marqué »', 'ta dégustation du 18.10 (le moteur la fait primer)', 'dégusté') + '<span class="vr-s">pose un jeton pour jouer</span></span></div>';
  document.querySelector('[data-role="vraies"]').innerHTML = v;
  const n = document.querySelector('[data-role="note"]'); n.textContent = ST.note || (SEC(ST.m) && ST.m === 'dryPost' && ST.lv !== 'us05' ? 'la levure dort : rien ne change en cuve au repos' : ''); ST.note = '';
}
document.addEventListener('click', (e) => { const b = e.target.closest('button[data-reglage]'); if (!b || b.disabled) return; const r = b.dataset.reglage, v = b.dataset.v;
  if (r === 'jeton') { if (ST.h.includes(v)) ST.h = ST.h.filter((k) => k !== v); else if (ST.h.length === 0) ST.h = [v]; else { const deux = [ST.h[0], v]; if (deux.includes('citra') && SEC(ST.m)) ST.h = deux; else if (deux.includes('citra')) { ST.h = deux; ST.m = 'dryPost'; ST.note = 'deux jetons : à sec, en cuve'; } else { ST.h = [v]; ST.note = 'à deux, le moteur a Citra et un second'; } }
    if (ST.h.length === 2 && ST.lv === 'diamond') ST.lv = 'us05'; if (ST.h.length === 1 && ST.lv === 'verdant') ST.lv = 'us05'; }
  if (r === 'moment') { ST.m = v; if (!SEC(v) && ST.h.length === 2) { ST.h = [ST.h[0]]; ST.note = 'à chaud : un seul jeton'; } }
  if (r === 'dose') ST.dose = Number(v);
  if (r === 'levure') { ST.lv = v; if (ST.m === 'dryPost' && v !== 'us05' && existe(Object.assign({}, ST, { m: 'dryActive' }))) { ST.m = 'dryActive'; ST.note = 'la levure agit en fermentation : passé en cuve active'; } }
  if (!existe(ST)) { if (ST.lv !== 'us05') ST.lv = 'us05'; if (!existe(ST)) ST.dose = 2; }
  rendre(); });
document.querySelectorAll('.lentille [data-e]').forEach((b) => b.addEventListener('click', () => setTimeout(rendre, 0)));
const q = new URLSearchParams(location.search); if (q.get('h')) ST.h = q.get('h').split(','); if (q.get('m')) ST.m = q.get('m'); if (q.get('dose')) ST.dose = Number(q.get('dose')); if (q.get('lv')) ST.lv = q.get('lv');
rendre();`;

const donnees = { grille: S.grilleCompacte(), reel: T, ibu: IBU_BIERE, biere: BIERE, houblons: Object.fromEntries(Object.entries(HB).map(([k, h]) => [k, { nom: h.nom, couleur: h.couleur, huile: h.huile, huileSrc: h.huileSrc }])) };
ecrire(path.join(ICI, 'etat.html'), page({ titre: 'x5 · Le verre et le défi', commentaire: 'Lot 21 · x5, froide : le nez qui sort du verre (12 volutes simulées), le dôme de la 16D, le défi de la dégustation (plus floral, moins résineux, rien qui déborde), des jetons de houblon. Profil simulé : moteur profil-simule.', css, corps, js, donnees }));
