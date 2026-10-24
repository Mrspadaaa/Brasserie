// Lot 21 · x2 · « L'escalier : sur le papier, puis dans ta stout » (tiède, vers chaud).
// La question du brasseur : « citra aura un effet extrêmement differents en dry hopping que cascade alors que pourtant
// d'après Nos outils ils sont assez similaire », et « Pourquoi à 10' pas à 60 ? ». Un duel à DOSE ÉGALE, marche par
// marche, du papier au verre :
//   1. sur le papier : le panel YCH sur houblon broyé (vraies valeurs, F) : presque pareils ;
//   2. par gramme : huile, linalol, 4MMP libre, farnésène (vraies valeurs, F et P) : c'est là que tout diffère ;
//   3. à 60′, 10′, au whirlpool, en dry hop actif, en dry hop après : le profil simulé de la 16D, en papillon
//      (Citra à gauche, l'autre à droite), au style ; l'écart grandit en descendant ; à chaque marche sa vraie valeur
//      (IBU, ce qui reste, rapport au seuil en bande log) ;
//   4. ensemble, 2 + 2 g/L : l'ajout cumulé, ce que chacun apporte et la saturation partagée.
// Toucher une moitié de marche : c'est ton choix, résumé en bas avec ses vraies valeurs.
// Usage : node generateur-x2.mjs  →  x2/etat.html
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as S from '../x1/socle-x.mjs';
import { tableReelle, BIERE } from '../x1/donnees-reelles.mjs';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const { HB, ORDRE, NOM, COURT, picto, ic, hn, alpha, usage, stock, pt, lentille, legende, LEGENDE_COMMUNE, page, ecrire } = S;
const T = tableReelle();
const FAM = ['citrus', 'tropical', 'berries', 'floral', 'green'];
// Le panel YCH sur houblon broyé, T-90, 0–100 (H §1.1, [1] [2]) : vraies valeurs de fabricant.
const YCH = { citra: { citrus: 92, tropical: 78, berries: 70, floral: 54, green: 17 }, cascade: { citrus: 85, tropical: 73, berries: 67, floral: 54, green: 27 } };
// Le 4MMP et le linalol au seuil, en dry hop après fermentation, 4 g/L (moteur, base commune quand elle existe).
const rap = (cle, comp) => { const c = S.VSIM.cas.find((x) => x.id === cle); const m = c && c.mesures.find((y) => y.type === 'compose' && y.compose === comp && y.ajout !== 'nugget' && y.houblon !== 'Nugget');
  if (!m) return null; const p = (m.rapportBaseCommune && m.rapportBaseCommune.plage) || (m.rapport && m.rapport.plage); return p ? { min: p.min, max: p.max, central: p.central, base: !!(m.rapportBaseCommune && m.rapportBaseCommune.plage), src: 'moteur « pouvoir aromatique », ' + c.titre } : null; };
const SEUIL = { citra: { lin: rap('K1-citra-dryPost', 'linalol'), mmp: rap('K1-citra-dryPost', '4MMP') }, cascade: { lin: rap('K1-cascade-dryPost', 'linalol'), mmp: rap('K1-cascade-dryPost', '4MMP') },
  galaxy: { lin: rap('K2-galaxy', 'linalol'), mmp: rap('K2-galaxy', '4MMP') }, idaho7: { lin: rap('K2-idaho-7', 'linalol'), mmp: rap('K2-idaho-7', '4MMP') } };
// L'ajout cumulé : les cas K5 du moteur (Citra + un second, 2 + 2 g/L, 3 j).
const CUMUL = {};
for (const c of S.CAS.filter((x) => x.groupe === 'K5')) {
  const autre = c.ajoutsX.find((a) => a.h !== 'citra').h, m = c.ajoutsX[0].moment;
  CUMUL[[autre, m, c.levureX].join('|')] = { apres: Object.fromEntries(FAM.map((f) => [f, c.apres[f]])), facteur: c.saturation && c.saturation.facteur, apports: (c.apportsParHoublon || []).map((a) => ({ h: S.cleH(a.houblon), seul: a.seul, apport: a.apport })), titre: c.titre };
}
const ADV = ['cascade', 'galaxy', 'idaho7'];
const DEF = { adv: 'cascade', dose: 4, lv: 'us05', choix: null };
const seg = (nom, reglage, opts, actif, cls = '') => `<span class="seg rg ${cls}" role="radiogroup" aria-label="${nom}">${opts.map(([v, t, extra = '']) => `<button role="radio" data-role="reglage" data-reglage="${reglage}" data-v="${v}" aria-checked="${String(v) === String(actif)}" ${extra}>${t}</button>`).join('')}</span>`;
const cote = (k, i) => `<div class="cote c${i}" data-voie="${i}" data-cote="${i}">${pt(k)}${hn(k)}<span class="cote-a">${alpha(k)}</span><span class="cote-u">${usage(k)}${stock(k, DEF.dose)}</span></div>`;
const MARCHES = [['papier', 'Sur le papier', 'houblon broyé, panel'], ['gramme', 'Par gramme', 'dans le cône'], ['b60', 'À 60′', 'simulé'], ['b10', 'À 10′', 'simulé'], ['wp', 'Au whirlpool', 'simulé'], ['dryActive', 'Dry hop actif', 'simulé'], ['dryPost', 'Dry hop après', 'simulé'], ['ensemble', 'Ensemble', 'simulé']];
const corps = `
  <header class="tete"><h1>Citra ou un autre ?</h1>${lentille()}${legende([...LEGENDE_COMMUNE, ['<span class="lg-pap"></span>', 'à gauche Citra, à droite l’autre, à dose égale']])}</header>
  <div class="rang">${seg('Contre', 'adversaire', ADV.map((k) => [k, 'contre <span data-houblon="' + HB[k].nom + '">' + HB[k].nom + '</span>']), DEF.adv)}</div>
  <div class="rang"><span class="lab">à dose égale</span>${seg('Dose', 'dose', [1, 2, 4, 8].map((d) => [d, d + ' g/L']), DEF.dose)}</div>
  <div class="duo" data-role="duo">${cote('citra', 1)}<div class="cote c2" data-voie="2" data-cote="2"></div></div>
  <div class="ecart" data-role="ecart" aria-label="L’écart entre les deux, marche par marche"></div>
  <div class="marches" data-role="simulation">
    <p class="sim-t"><span class="estime">~ simulé</span> dès 60′ · au style de la 16D · descends : l’écart grandit</p>
    ${MARCHES.map(([id, t, n]) => `<section class="marche m-${id}" data-marche="${id}" aria-label="${t}">
      <div class="mh"><span class="mh-t">${t}</span><span class="mh-n">${n}</span><span class="mh-v" data-role="vrai-${id}">${id === 'dryActive' ? seg('Levure', 'levure', [['us05', 'US-05'], ['pomona', 'Pomona']], DEF.lv) : ''}</span></div>
      <div class="bf" data-role="bf-${id}"></div>
      <div class="mv" data-role="verdict-${id}"></div></section>`).join('')}
  </div>
  <div class="choix" data-role="choix" aria-live="polite"></div>`;

const css = `
  .rang { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .lab { font-size: 12px; color: var(--gris); }
  .duo { display: grid; grid-template-columns: 1fr 1fr; gap: 0; border-top: 1px solid var(--trait); border-bottom: 1px solid var(--trait); }
  .cote { display: flex; flex-wrap: wrap; align-items: center; gap: 3px 5px; padding: 5px 0; min-height: 48px; }
  .cote.c2 { justify-content: flex-end; text-align: right; border-left: 1px solid var(--trait); padding-left: 6px; }
  .cote.c1 { padding-right: 6px; }
  .cote-a, .cote-u { display: inline-flex; align-items: center; gap: 5px; flex-wrap: wrap; }
  .sim-t { font-size: 12px; color: var(--gris); }
  .marches { display: flex; flex-direction: column; gap: 4px; }
  .marche { border-radius: 8px; padding: 6px 0 4px; position: relative; }
  .marche + .marche { border-top: 1px dashed var(--trait2); }
  .m-papier, .m-gramme { background: none; }
  .mh { display: flex; align-items: baseline; gap: 4px 6px; padding: 0 2px 4px; flex-wrap: wrap; }
  .mh-t { font-size: 14px; font-weight: 700; white-space: nowrap; }
  .mh-n { font-size: 12px; color: var(--gris); }
  .mh-v { margin-left: auto; display: inline-flex; gap: 6px; align-items: baseline; flex-wrap: wrap; justify-content: flex-end; }
  .bf { display: flex; flex-direction: column; gap: 3px; }
  .bf-r { display: grid; grid-template-columns: 1fr 74px 1fr; align-items: center; min-height: 18px; }
  .bf-c { display: inline-flex; align-items: center; justify-content: center; gap: 3px; font-size: 12px; color: var(--t); white-space: nowrap; }
  .bf-d { position: relative; height: 14px; display: block; }
  .bf-d.g { transform: scaleX(-1); }
  .bf-z { position: absolute; left: 0; top: 1px; bottom: 1px; width: var(--zs); background: color-mix(in srgb, var(--b) 16%, transparent); border-right: 1.5px solid var(--t); }
  body.abs .bf-z { width: var(--za); }
  .bf-b { position: absolute; left: 0; top: 3px; height: 8px; width: var(--s); background: linear-gradient(to right, var(--b) 0, var(--b) var(--zs), var(--acc) var(--zs)); border-radius: 0 2px 2px 0; transition: width .25s; z-index: 1; }
  .bf-d:not(.hors) .bf-b { background: var(--b); }
  body.abs .bf-b { width: var(--a); background: var(--b); }
  .bf-m { position: absolute; top: 12px; height: 0; left: var(--b0s); width: calc(var(--b1s) - var(--b0s)); border-top: 1.5px dotted #6b6b76; transition: all .25s; }
  body.abs .bf-m { left: var(--b0a); width: calc(var(--b1a) - var(--b0a)); }
  .bf-d.os .bf-m::after, body.abs .bf-d.oa .bf-m::after { content: ''; position: absolute; right: -5px; top: -4px; border: 3.5px solid transparent; border-left: 5px solid #5b5b66; border-right: 0; }
  .bf-d.nul .bf-b, .bf-d.nul .bf-m { display: none; }
  .bf-d.nul::after { content: ''; position: absolute; left: 0; top: 3px; width: 26px; height: 8px; background: repeating-linear-gradient(135deg, #fff 0 2px, #9aa0ab 2px 3.5px); box-shadow: inset 0 0 0 1px #8a909b; border-radius: 2px; }
  .bf-v { position: absolute; top: -1px; font: 600 12px/14px var(--mono); color: var(--encre); white-space: nowrap; }
  .bf-d.g .bf-v { transform: scaleX(-1); }
  .pan .bf-b { background: #6f7e95 !important; }
  .mv { display: grid; grid-template-columns: 1fr 1fr; gap: 0 8px; padding-top: 4px; font-size: 12px; }
  .mv > * { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
  .mv > :nth-child(2) { justify-content: flex-end; text-align: right; }
  .mv > .logs { display: grid; grid-template-columns: 80px 1fr; align-items: center; gap: 0 6px; }
  .mv > .logs > * { display: flex; align-items: center; gap: 3px; }
  .ecart { display: grid; grid-template-columns: 70px repeat(5, 1fr); align-items: end; gap: 4px; padding: 4px 0 2px; }
  .ec-t { font-size: 12px; color: var(--gris); align-self: center; line-height: 1.2; }
  .ec-b { display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 12px; min-height: 30px; justify-content: flex-end; }
  .ec-b i { display: block; width: 22px; height: var(--h); background: var(--encre); border-radius: 2px 2px 0 0; }
  .ec-b .vs { font-size: 12px; }
  .ec-b span { white-space: nowrap; }
  .moitie { position: absolute; top: 0; bottom: 0; width: 50%; border-radius: 8px; z-index: 0; }
  .moitie.c1 { left: 0; } .moitie.c2 { right: 0; }
  .moitie[aria-pressed="true"] { box-shadow: inset 0 0 0 2px var(--encre); }
  .marche > :not(.moitie) { position: relative; z-index: 1; pointer-events: none; }
  .marche .mh-v, .marche .mh-v * { pointer-events: auto; }
  .dans { color: var(--gris); }
  .gr-r { display: grid; grid-template-columns: 1fr 96px 1fr; align-items: center; min-height: 22px; font-size: 12px; }
  .gr-r > :first-child { text-align: right; justify-self: end; }
  .gr-c { display: inline-flex; align-items: center; justify-content: center; gap: 3px; white-space: nowrap; color: var(--encre); }
  .gr-x { font: 600 12px var(--mono); color: var(--encre); }
  .lg-pap { display: inline-block; width: 30px; height: 8px; background: linear-gradient(to right, #6f7e95 45%, #fff 45% 55%, #6f7e95 55%); }
  .logs { display: grid; grid-template-columns: 76px 1fr; align-items: center; gap: 2px 6px; padding: 2px 0; }
  .logs .blog { margin: 2px 0; }
  .logs-n { font-size: 12px; display: inline-flex; align-items: center; gap: 2px; }
  .choix { position: sticky; bottom: 0; z-index: 20; background: #fff; box-shadow: 0 -6px 16px -8px rgba(0,0,0,.25); border-radius: 8px 8px 0 0; padding: 8px 10px; font-size: 13px; display: flex; flex-direction: column; gap: 4px; }
  .choix b { font-weight: 700; }
  .choix-l { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; }`;

const js = `
${S.JS_SIM}
const D = window.DONNEES, HBJ = D.houblons, NOMS = ${JSON.stringify(NOM)}, COURTS = ${JSON.stringify(COURT)}, FAM = ${JSON.stringify(FAM)};
const ST = ${JSON.stringify(DEF)};
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const fr = (x) => String(Math.round(x * 100) / 100).replace('.', ',');
const fx = (x, sens) => { if (x == null) return '?'; const e = Math.floor(Math.log10(Math.abs(x))) - 1, p = 10 ** e, q = x / p; const r = sens === 'bas' ? Math.floor(q + 1e-9) : sens === 'haut' ? Math.ceil(q - 1e-9) : Math.round(q); return fr(Number((r * p).toPrecision(6))); };
const picto = (f, z = 14) => '<svg class="pi" width="' + z + '" height="' + z + '" data-famille="' + f + '" role="img" aria-label="' + NOMS[f] + '"><use href="#p-' + f + '"/></svg>';
const ic = (k, z = 14) => '<svg class="ic" width="' + z + '" height="' + z + '" aria-hidden="true"><use href="#i-' + k + '-' + z + '"/></svg>';
const vrai = (t, src, mot, cls = 'vv') => '<span class="' + cls + '" data-nature="mesure" data-source="' + esc(src) + '">' + t + (mot ? '<span class="mot-c mot-' + mot + '">' + mot + '</span>' : '') + '</span>';
const inc = (t) => '<span class="inc" data-inconnu><i class="hach"></i>' + t + '</span>';
// Une demi-barre du papillon : au style 30 px par cran (cap 4,6 crans), absolu 0–100 sur 138 px.
const PX = 30, CAP = 4.6 * 30, HA = 138;
function demi(f, v, g, extra = '') {
  if (!v) return '<span class="bf-d nul' + (g ? ' g' : '') + '"></span>';
  const z = SIMX.Z[f], hS = (x) => Math.min(CAP, x / z.cran * PX), hA = (x) => Math.min(HA, x / 100 * HA);
  const nul = !(v.haut > 0) && !(v.centre > 0), hors = v.centre > z.bande[1];
  const st = '--zs:' + (3 * PX) + 'px;--za:' + hA(z.bande[1]).toFixed(1) + 'px;--s:' + hS(v.centre).toFixed(1) + 'px;--a:' + hA(v.centre).toFixed(1) + 'px;--b0s:' + hS(v.bas).toFixed(1) + 'px;--b1s:' + hS(v.haut).toFixed(1) + 'px;--b0a:' + hA(v.bas).toFixed(1) + 'px;--b1a:' + hA(v.haut).toFixed(1) + 'px';
  return '<span class="bf-d' + (g ? ' g' : '') + (hors ? ' hors' : '') + (nul ? ' nul' : '') + (v.haut / z.cran > 4.6 ? ' os' : '') + (v.haut > 100 ? ' oa' : '') + '" data-famille="' + f + '" style="' + st + '"><i class="bf-z" data-role="zone"></i><i class="bf-b" data-nature="simule" aria-label="' + NOMS[f] + ' ~ ' + (nul ? 'non simulé' : SIMX.cr(f, v.centre) === 4 ? 'au-dessus du style' : SIMX.cr(f, v.centre) + ' cran(s)') + ', simulé"></i><i class="bf-m"></i>' + extra + '</span>';
}
const centre = (f) => '<span class="bf-c" data-famille="' + f + '">' + picto(f, 14) + COURTS[f] + '</span>';
const hors = (p) => FAM.concat(['herbal', 'earthy', 'stoneFruit', 'melon', 'spice']).filter((f) => p[f] && SIMX.AV[f].centre <= SIMX.Z[f].bande[1] && p[f].centre > SIMX.Z[f].bande[1]);
const verdict = (p, nom) => { if (!p) return '<span>' + inc('non simulé') + '</span>'; const h = hors(p); return h.length ? '<span class="xs">' + h.length + ' famille' + (h.length > 1 ? 's' : '') + ' hors du style</span>' : '<span class="dans">dans la 16D</span>'; };
const lecture = (a, b, n) => { if (!a || !b || a.min == null || b.max == null) return n + ' : une borne inconnue'; if (a.min > b.max) return n + ' : Citra au-dessus, sans recouvrement'; if (a.central != null && a.central > b.max) return n + ' : Citra plus haut, recouvrement de ×' + fx(a.min, 'bas') + ' à ×' + fx(b.max, 'haut'); return n + ' : les plages se recouvrent'; };
const ibu = (k, m) => D.reel.ibu[k + '|' + m + '|' + ST.dose];
function rendre() {
  document.querySelectorAll('[data-reglage]').forEach((b) => { const cur = { adversaire: ST.adv, dose: ST.dose, levure: ST.lv }[b.dataset.reglage]; b.setAttribute('aria-checked', String(String(cur) === b.dataset.v)); });
  document.querySelector('.cote.c2').innerHTML = D.cotes[ST.adv];
  const A = 'citra', B = ST.adv;
  // 1. sur le papier
  const Y = D.ych;
  document.querySelector('[data-role="bf-papier"]').innerHTML = FAM.map((f) => { const a = Y.citra[f], b = Y[B] && Y[B][f];
    const barre = (x, g) => x == null ? '<span class="bf-d nul' + (g ? ' g' : '') + '"></span>' : '<span class="bf-d pan' + (g ? ' g' : '') + '" data-famille="' + f + '" style="--s:' + (x / 100 * 120).toFixed(1) + 'px;--a:' + (x / 100 * 120).toFixed(1) + 'px;--zs:0px;--za:0px"><i class="bf-b"></i><span class="bf-v" style="left:' + (x / 100 * 120 + 4).toFixed(1) + 'px">' + vrai(String(x), D.ychSrc, '') + '</span></span>';
    return '<div class="bf-r">' + barre(a, true) + centre(f) + barre(b, false) + '</div>'; }).join('');
  document.querySelector('[data-role="vrai-papier"]').innerHTML = vrai('sur 100', D.ychSrc, 'panel');
  document.querySelector('[data-role="verdict-papier"]').innerHTML = Y[B] ? '<span>presque pareils</span><span>sur ce support</span>' : '<span></span><span>' + inc('pas de panel publié') + '</span>';
  // 2. par gramme
  const G = D.gramme, gl = [['huile', 'huile', 'mL/100 g', 'fiole'], ['linalol', 'linalol', '% huile', 'floral'], ['mmp4', '4MMP libre', 'µg/kg', 'tropical'], ['farnesene', 'farnésène', '% huile', 'green']];
  const pl = (x) => !x || x.inconnu ? inc('inconnu') : (x.inf && x.min != null && x.max == null ? '> ' + fr(x.min) : x.min == null ? (x.sup || '<') + ' ' + fr(x.max) : fr(x.min) + '–' + fr(x.max));
  const mil = (x) => !x || x.inconnu ? null : x.min != null && x.max != null ? (x.min + x.max) / 2 : x.min != null ? x.min : x.max / 2;
  document.querySelector('[data-role="bf-gramme"]').innerHTML = gl.map(([k, nom, u, pic]) => { const a = G.citra[k], b = G[B][k], ra = mil(a), rb = mil(b);
    const rapport = ra && rb ? (ra >= rb ? 'Citra ≈ ×' + fr(Math.round(ra / rb * 10) / 10) : B === 'cascade' || true ? HBJ[B].nom + ' ≈ ×' + fr(Math.round(rb / ra * 10) / 10) : '') : '';
    return '<div class="gr-r">' + vrai(pl(a), (a && a.src ? 'H [' + a.src.join('] [') + ']' : 'H'), '') + '<span class="gr-c">' + (pic === 'fiole' ? ic('fiole', 14) : picto(pic, 14)) + nom + '</span>' + vrai(pl(b), (b && b.src ? 'H [' + b.src.join('] [') + ']' : 'H'), '') + '</div>'
      + (rapport ? '<div class="gr-r"><span></span><span class="gr-c gris" style="font-size:12px">' + u + '</span><span class="gr-x">' + rapport + '</span></div>' : ''); }).join('');
  document.querySelector('[data-role="vrai-gramme"]').innerHTML = vrai('', 'H §1.1 : YCH, Haas, BarthHaas, Hopsteiner [11]', 'fiche');
  document.querySelector('[data-role="verdict-gramme"]').innerHTML = '<span>c’est là que tout diffère</span><span></span>';
  // 3. les moments
  for (const m of ['b60', 'b10', 'wp', 'dryActive', 'dryPost']) {
    const lv = m === 'dryActive' ? ST.lv : 'us05';
    const pa = SIMX.profil(A, m, ST.dose, 3, lv), pb = SIMX.profil(B, m, ST.dose, 3, lv);
    document.querySelector('[data-role="bf-' + m + '"]').innerHTML = FAM.map((f) => '<div class="bf-r">' + demi(f, pa && pa[f], true) + centre(f) + demi(f, pb && pb[f], false) + '</div>').join('');
    document.querySelector('[data-role="verdict-' + m + '"]').innerHTML = verdict(pa) + verdict(pb);
    let v = '';
    if (m === 'b60' || m === 'b10' || m === 'wp') { const ia = ibu(A, m), ib = ibu(B, m); if (ia && ib) v += vrai('+' + ia.v + ' | +' + ib.v + ' IBU', ia.src, 'calcul') + (D.reel.style.ibuBiere + Math.min(ia.v, ib.v) > 70 ? '<span class="xs">trop amer</span>' : ''); }
    const pe = D.perte[m]; if (pe) v += '<span class="vv txt" data-nature="mesure" data-source="' + esc(pe.source) + '">' + ({ b60: picto('tropical', 12), wp: picto('tropical', 12), b10: picto('floral', 12), dryPost: picto('floral', 12), dryActive: picto('resin', 12) }[m] || '') + esc(pe.texte) + '</span>';
    if (m !== 'dryActive') document.querySelector('[data-role="vrai-' + m + '"]').innerHTML = v;
  }
  // la biotransformation, sous la marche active
  const bio = ST.lv === 'pomona' ? picto('floral', 12) + ic('fleche', 12) + picto('citrus', 12) + ' <span>Pomona : géraniol → citronellol, « medium », <span class="gris">Escarpment Labs [51]</span></span>' : ic('aide2', 12) + ' <span>US-05 : β-lyase non publiée, ' + inc('inconnu') + '</span>';
  document.querySelector('[data-role="verdict-dryActive"]').insertAdjacentHTML('beforeend', '<span data-role="biotransformation" style="grid-column:1 / -1;justify-content:flex-start;text-align:left">' + bio + '</span>');
  // le rapport au seuil, en bande log, sous la dernière marche simulée : la vraie valeur, et son incertitude
  const L = (r, W, c) => { if (!r) return '<span class="blog inc-b" style="width:' + W + 'px" data-role="incertitude"><i class="blog-h"></i></span>';
    const x = (v) => Math.max(0, Math.min(W, (Math.log10(v) + 2.5) / 6 * W)), a = r.min == null ? 0 : x(r.min), b = r.max == null ? W : x(r.max);
    return '<span class="blog" style="width:' + W + 'px;--c:' + c + '"><i class="blog-r"></i><i class="blog-s" style="left:' + x(1) + 'px"></i><i class="blog-band' + (r.max == null ? ' ouv' : '') + '" data-role="incertitude" style="left:' + a + 'px;width:' + Math.max(4, b - a) + 'px"></i><span class="blog-b" style="left:' + a + 'px">' + (r.min == null ? '?' : '×' + fx(r.min, 'bas')) + '</span><span class="blog-b d" style="left:' + b + 'px">' + (r.max == null ? '?' : '×' + fx(r.max, 'haut')) + '</span></span>'; };
  const SA = D.seuil.citra, SB = D.seuil[B];
  document.querySelector('[data-role="verdict-dryPost"]').insertAdjacentHTML('beforeend', '<div class="logs" style="grid-column:1 / -1">'
    + '<span class="logs-n" style="grid-column:1 / -1">' + picto('tropical', 12) + '4MMP au seuil</span><span class="logs-n">' + D.points.citra + 'Citra</span><span>' + L(SA.mmp, 270, HBJ.citra.couleur) + '</span><span class="logs-n">' + D.points[B] + HBJ[B].nom + '</span><span>' + L(SB.mmp, 270, HBJ[B].couleur) + '</span>'
    + '<span class="logs-n" style="grid-column:1 / -1">' + picto('floral', 12) + 'linalol au seuil</span><span class="logs-n">' + D.points.citra + 'Citra</span><span>' + L(SA.lin, 270, HBJ.citra.couleur) + '</span><span class="logs-n">' + D.points[B] + HBJ[B].nom + '</span><span>' + L(SB.lin, 270, HBJ[B].couleur) + '</span>'
    + (D.biere.citra[0] ? '<span class="logs-n" style="grid-column:1 / -1">' + vrai(picto('floral', 12) + 'Citra en bière : ' + esc(D.biere.citra[0].txt) + ', ' + esc(D.biere.citra[0].detail), D.biere.citra[0].src, 'mesuré', 'vv txt') + '</span>' : '') + '<span class="gris" style="grid-column:1 / -1;font-size:12px">' + vrai('4 g/L : ' + lecture(SA.mmp, SB.mmp, '4MMP') + ' ; ' + lecture(SA.lin, SB.lin, 'linalol'), (SA.mmp || {}).src || 'moteur', 'calcul').replace('class="vv"', 'class="vv txt"') + '</span></div>');
  // l'écart, marche par marche : la somme des écarts de centre sur les cinq familles, en points sur 100 (simulé)
  const MO = [['b60', '60′'], ['b10', '10′'], ['wp', 'whirlpool'], ['dryActive', 'actif'], ['dryPost', 'après']];
  const ec = MO.map(([m]) => { const pa = SIMX.profil(A, m, ST.dose, 3, m === 'dryActive' ? ST.lv : 'us05'), pb = SIMX.profil(B, m, ST.dose, 3, m === 'dryActive' ? ST.lv : 'us05'); return pa && pb ? FAM.reduce((t, f) => t + Math.abs(pa[f].centre - pb[f].centre), 0) : null; });
  const mx = Math.max(1, ...ec.filter((x) => x != null));
  document.querySelector('[data-role="ecart"]').innerHTML = '<span class="ec-t">l’écart <span class="estime">~ simulé</span></span>' + MO.map(([m, t], i) => '<button class="ec-b" data-role="aller" data-m="' + m + '"><span class="vs" data-nature="simule">' + (ec[i] == null ? '?' : '~' + Math.round(ec[i])) + '</span><i style="--h:' + (ec[i] == null ? 0 : Math.max(2, ec[i] / mx * 40)).toFixed(1) + 'px"></i><span>' + t + '</span></button>').join('');
  document.querySelectorAll('[data-role="aller"]').forEach((b) => b.addEventListener('click', () => document.querySelector('[data-marche="' + b.dataset.m + '"]').scrollIntoView({ behavior: 'smooth', block: 'start' })));
  // 4. ensemble
  const C = D.cumul[[B, 'dryPost', 'us05'].join('|')];
  const be = document.querySelector('[data-role="bf-ensemble"]');
  if (C) {
    be.innerHTML = '<div class="aj" data-role="ajout">' + D.points.citra + '<span class="hn" data-houblon="Citra">Citra</span> 2 g/L + ' + D.points[B] + '<span class="hn" data-houblon="' + HBJ[B].nom + '">' + HBJ[B].nom + '</span> 2 g/L, 3 j, après</div>'
      + FAM.map((f) => { const sa = (C.apports.find((x) => x.h === 'citra') || {}).apport, sb = (C.apports.find((x) => x.h === B) || {}).apport; return '<div class="bf-r">' + demi(f, C.apres[f], true) + centre(f) + '<span class="gris" style="font-size:12px;padding-left:6px">' + (sa && sb ? '<span data-nature="simule">~ Citra +' + Math.round(sa[f]) + ', ' + HBJ[B].nom + ' +' + Math.round(sb[f]) + ' pts</span>' : '') + '</span></div>'; }).join('');
    const fa = C.facteur && C.facteur.citrus; document.querySelector('[data-role="verdict-ensemble"]').innerHTML = verdict(C.apres) + '<span data-nature="simule">~ agrumes ' + (fa ? Math.round(fa * 100) + ' % de la somme des deux seuls' : '') + '</span><span class="gris" style="grid-column:1 / -1">ordre, synergie, masquage : ' + inc('inconnus') + '</span>';
  } else { be.innerHTML = inc('non simulé'); document.querySelector('[data-role="verdict-ensemble"]').innerHTML = ''; }
  document.querySelector('[data-role="vrai-ensemble"]').innerHTML = vrai('dose totale 4 g/L', 'Lafontaine, Shellhammer 2018 [22] : zone de saturation 4–8 g/L', 'publié');
  // les moitiés à toucher : ton choix
  document.querySelectorAll('.moitie').forEach((x) => x.remove());
  document.querySelectorAll('.marche').forEach((s) => { const id = s.dataset.marche; if (id === 'papier' || id === 'gramme' || id === 'ensemble') return;
    for (const [c, k] of [['c1', A], ['c2', B]]) s.insertAdjacentHTML('afterbegin', '<button class="moitie ' + c + '" data-role="choisir" data-k="' + k + '" data-m="' + id + '" aria-pressed="' + (ST.choix && ST.choix.k === k && ST.choix.m === id) + '" aria-label="Choisir ' + HBJ[k].nom + ', ' + id + '"></button>'); });
  document.querySelectorAll('[data-role="choisir"]').forEach((b) => b.addEventListener('click', () => { ST.choix = { k: b.dataset.k, m: b.dataset.m }; rendre(); }));
  const ch = document.querySelector('[data-role="choix"]');
  if (ST.choix) { const k = ST.choix.k, m = ST.choix.m, p = SIMX.profil(k, m, ST.dose, 3, m === 'dryActive' ? ST.lv : 'us05'), h = hors(p), ib = ibu(k, m);
    const MO = { b60: '60′', b10: '10′', wp: 'whirlpool', dryActive: 'dry hop actif', dryPost: 'dry hop après' };
    ch.innerHTML = '<div class="choix-l"><b>Ton choix</b>' + D.points[k] + '<span class="hn" data-houblon="' + HBJ[k].nom + '">' + HBJ[k].nom + '</span> ' + MO[m] + ' · ' + ST.dose + ' g/L · ' + (ST.dose * 20) + ' g pour 20 L' + D.stocks[k] + '</div><div class="choix-l">' + (h.length ? '<span class="xs">~ hors du style : ' + h.map((f) => COURTS[f]).join(', ') + '</span>' : '<span data-nature="simule">~ dans la 16D</span>') + (ib ? vrai(Math.round(D.reel.style.ibuBiere + ib.v) + ' IBU', ib.src, 'calcul') : '') + '</div>'; }
  else ch.innerHTML = '<div class="choix-l gris">' + '<span>Touche une moitié de marche : c’est ton choix.</span></div>';
}
document.addEventListener('click', (e) => { const b = e.target.closest('[data-reglage]'); if (!b) return; const r = b.dataset.reglage, v = b.dataset.v;
  if (r === 'adversaire') { ST.adv = v; if (ST.choix && ST.choix.k !== 'citra') ST.choix.k = v; }
  if (r === 'dose') ST.dose = Number(v); if (r === 'levure') ST.lv = v; rendre(); });
const q = new URLSearchParams(location.search); if (q.get('adv')) ST.adv = q.get('adv'); if (q.get('dose')) ST.dose = Number(q.get('dose')); if (q.get('choix')) { const [k, m] = q.get('choix').split(','); ST.choix = { k, m }; }
rendre();`;

const donnees = {
  grille: S.grilleCompacte({ cumul: false }), reel: T, biere: BIERE, ych: YCH, ychSrc: 'Yakima Chief Hops, panel sur houblon broyé T-90, fiches Citra et Cascade [1] [2] (H §1.1)',
  gramme: Object.fromEntries(['citra', ...ADV].map((k) => [k, HB[k].parGramme])), seuil: SEUIL, cumul: CUMUL,
  perte: Object.fromEntries(['b60', 'b10', 'wp', 'dryActive', 'dryPost'].map((m) => [m, (S.MES['k1-citra-' + m] || []).find((x) => x.id === 'perte')])),
  houblons: Object.fromEntries(Object.entries(HB).map(([k, h]) => [k, { nom: h.nom, couleur: h.couleur }])),
  cotes: Object.fromEntries(ADV.map((k) => [k, `${pt(k)}${hn(k)}<span class="cote-a">${alpha(k)}</span><span class="cote-u">${usage(k)}${stock(k, DEF.dose)}</span>`])),
  points: Object.fromEntries(['citra', ...ADV].map((k) => [k, pt(k)])), stocks: Object.fromEntries(['citra', ...ADV].map((k) => [k, stock(k, DEF.dose)])),
};
ecrire(path.join(ICI, 'etat.html'), page({ titre: 'x2 · L’escalier', commentaire: 'Lot 21 · x2 : du papier (panel YCH) au verre (profil simulé du moteur, au style de la 16D), à dose égale, marche par marche ; vraies valeurs à chaque marche ; ton choix en bas.', css, corps, js, donnees }));
