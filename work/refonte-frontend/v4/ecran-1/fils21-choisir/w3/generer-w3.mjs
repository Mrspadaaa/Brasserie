// Lot 21 · w3 · « Dessine ta bière » (la réponse d'abord, à l'envers du simulateur).
// Le brasseur ne choisit pas un houblon : il touche, sur les pistes de sa bière, l'endroit où il veut aller
// (« agrumes jusque-là »). La page répond tout de suite par les gestes qui y mènent — houblon, dose, moment,
// jours, LEVURE, et deux houblons ensemble quand il le faut — rangés par un seul critère écrit : l'écart à ce
// qu'il a dessiné. Le premier geste s'affiche sur ses pistes (~ simulé), avec la biotransformation de la
// levure, les risques et les vraies valeurs. Un toucher sur un autre geste le pose sur les pistes.
// Usage : node generer-w3.mjs  →  w3/etat.html
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as S from '../w1/socle-w.mjs';

const { D, ORDRE, HOP, BANDE, CRAN, JET, fr, esc, ic, pic, alpha, usage, conf, V, bandeLog, feuille, pourquoi, preuve, page, ecrire, MOMENT, MOTS_F, COURT, inconnu, STUB_MOT, compacter, JS_DEPLIER, profilLignes, LPX, rgba } = S;
const ICI = path.dirname(fileURLToPath(import.meta.url));
const AV = D.AVANT;

// ---------- l'espace des gestes : la grille (un houblon), les paires (deux ensemble), K4 (Diamond) ----------
const GESTES = [];
for (const g of D.PROFILS.grille) GESTES.push({ h: g.houblon, h2: '', d: g.dose_gL, m: g.moment, j: g.jours, l: g.levure, p: compacter(g.profil), c: g.confiance });
for (const p of D.PROFILS.paires) GESTES.push({ h: p.noms[0], h2: p.noms[1], d: 2, m: p.moment, j: p.jours, l: p.levure, p: compacter(p.profil), c: p.confiance, ap: Object.fromEntries(p.noms.map((n) => [n, ORDRE.map((f) => p.apports[n][f])])) });
for (const c of D.PROFILS.cas.filter((x) => x.id.startsWith('K4-diamond'))) GESTES.push({ h: 'Citra', h2: 'Idaho 7', d: 2, m: c.ajouts[0].moment, j: 3, l: 'Diamond', p: compacter(c.apres), c: c.confiance.niveau, k4: true });
console.log(GESTES.length + ' gestes');

const corps = `
  ${S.tete('Dessine ta bière')}
  <p class="w3-q"><b>Touche la piste</b> là où tu veux aller.</p>
  <section class="w3-sim" data-role="simulation" aria-label="Ta bière, ta cible, le geste">
    <div class="w3-sim-t">${conf('simule')}<span class="w3-lg"><i class="w3-av"></i>ta bière</span><span class="w3-lg"><i class="w3-cbx"></i>ta cible</span><span class="w3-lg"><i class="w3-ap"></i>~ avec le geste</span><button type="button" class="w3-eff" data-role="reglage" data-reglage="effacer">${ic('retourner', 14)}effacer</button></div>
    <div id="pistes">${profilLignes(AV, AV, { id: 'prof' })}</div>
    <p class="w3-note">${pic('resin', 14)}Résineux déjà marqué (ta dégustation) : aucun houblon ne le baisse.</p>
  </section>
  <section class="w3-rep" aria-label="Les gestes qui y mènent">
    <h2 class="w3-h2">${ic('cible', 16)}<span id="rep-t">Pour y aller</span></h2>
    <div id="geste" data-role="objectif"></div>
    <h3 class="w3-h3">Les plus proches ensuite <span class="w3-h3s">rangés par écart à ta cible</span></h3>
    <div id="autres" class="w3-autres"></div>
    <div class="w3-filt">${S.seg('contrainte', 'Contrainte', [{ v: 'style', t: 'rester dans ta 16D' }, { v: 'libre', t: 'sans limite' }], 'style')}${S.seg('nombre', 'Houblons', [{ v: 'tous', t: '1 ou 2 houblons' }, { v: 'un', t: '1 seul' }], 'tous')}${S.seg('levure', 'Levure', [{ v: 'toutes', t: 'toute levure' }, { v: 'US-05', t: 'US-05' }, { v: 'Pomona', t: 'Pomona' }, { v: 'Verdant', t: 'Verdant' }], 'toutes')}</div>
    <div class="w3-act">${pourquoi('preuve-w3')}</div>
  </section>
  <p class="w3-pied">${conf('simule')}<span>${STUB_MOT}</span><span>· ta 16D, Nugget 60′</span>${alpha('Nugget')}</p>`;

const RC = { Citra: D.rapports('cas-citra.json'), Cascade: D.rapports('cas-cascade.json') };
const feuilles = feuille('preuve-w3', 'Comment la page cherche', `
  <p class="w3-p">Elle essaie tous les gestes simulés : ${D.PROFILS.grille.length} avec un houblon (6 houblons, 5 moments, 4 doses, 5 durées, US-05 ou Pomona), ${D.PROFILS.paires.length} avec deux houblons ensemble (2 + 2 g/L, 3 j, US-05, Pomona ou Verdant), et Diamond pour Citra + Idaho 7.</p>
  <p class="w3-p">Elle les range par <b>l’écart à ta cible</b> : ce qui manque compte plein, ce qui dépasse compte moitié ; « rester dans ta 16D » écarte les gestes qui font sortir une autre famille. Elle ne dit pas « le meilleur » : tu vois l’écart, tu choisis.</p>
  <h3>${ic('labo', 14)}Ce qui est mesuré</h3>
  <ul class="w-pvs">
    ${preuve(D.mesureEtude('E06', (m) => m.variete === 'Citra' && m.compose === 'linalol'), { note: 'dry hop, dose non indiquée ; le centre du moteur est 2 à 5 fois plus haut' })}
    ${preuve(D.mesureEtude('E04', (m) => m.dose_gL === 2 && /linalol, part extraite/.test(m.compose || '')), { quoi: 'part du linalol extraite', qui: 'Cascade 2 g/L', note: '7 % à 16 g/L : la saturation, mesurée' })}
    ${preuve(D.mesureEtude('E01', (m) => /citronellol/.test(m.compose || '')), { quoi: 'β-citronellol', qui: 'Amarillo, Citra, Sorachi', note: 'au-dessus du seuil en dry hop ; c’est le composé que Pomona fabrique depuis le géraniol' })}
    ${preuve(D.mesureEtude('E08', (m) => m.compose === '4-MMP'), { quoi: '4MMP, contact', qui: 'Eureka! 2,5 g/L' })}
  </ul>
  <h3>${ic('calc', 14)}Calculé : Citra et Cascade, 4 g/L, 3 j</h3>
  ${bandeLog({ compose: '4MMP', familles: ['tropical', 'berries'], ...RC.Citra['4MMP (4MSP)'], source: 'moteur pouvoir (fils19 cas-citra)', qui: 'Citra', couleur: HOP.Citra.couleur })}
  ${bandeLog({ compose: '4MMP', familles: ['tropical', 'berries'], ...RC.Cascade['4MMP (4MSP)'], source: 'moteur pouvoir (fils19 cas-cascade)', qui: 'Cascade', couleur: HOP.Cascade.couleur })}
  ${bandeLog({ compose: 'linalol', familles: ['floral', 'citrus'], ...RC.Citra.linalol, source: 'moteur pouvoir (fils19 cas-citra)', qui: 'Citra', couleur: HOP.Citra.couleur })}
  <h3>${ic('info', 14)}Ce qu’on ne sait pas</h3>
  ${['une mesure qui croise variété, levure et dry hop', 'le rendement réel de la biotransformation (Pomona : 50 % au centre, convention)', 'synergie, masquage et ordre de deux houblons', 'la perception en stout'].map((t) => `<p class="w-trou">${inconnu(t, 'inconnu')}<span>${t}</span></p>`).join('')}
  <p class="w3-p">${conf('simule')} ${esc(D.PROFILS.mention)}</p>`);

const css = `
  .w3-q { font-size: 16px; line-height: 1.3; }
  .w3-sim { display: flex; flex-direction: column; gap: 6px; }
  .w3-sim-t { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 12px; color: var(--gris); }
  .w3-lg { display: inline-flex; align-items: center; gap: 4px; }
  .w3-av { width: 2px; height: 12px; background: var(--encre); display: inline-block; }
  .w3-cbx { width: 0; height: 14px; border-left: 2px dashed var(--encre); display: inline-block; }
  .w3-ap { width: 14px; height: 8px; background: #ee9b2f; display: inline-block; border-radius: 0 2px 2px 0; }
  .w3-eff { margin-left: auto; display: inline-flex; align-items: center; gap: 3px; min-height: 28px; padding: 0 8px; border-radius: 999px; box-shadow: inset 0 0 0 1px var(--trait2); font-size: 12px; font-weight: 600; color: var(--encre); }
  #prof .w-row { height: 30px; cursor: pointer; border-radius: 4px; }
  #prof .w-row .w-z { height: 20px; }
  #prof .w-row .w-b, #prof .w-row .w-x { top: 6px; }
  #prof .w-row:not(.vise) .w-b, #prof .w-row:not(.vise) .w-x { opacity: .9; }
  #prof .w-row.vise { background: color-mix(in srgb, var(--z) 70%, #fff); }
  .w3-cb { position: absolute; top: -4px; bottom: -4px; width: 0; border-left: 2.5px dashed var(--encre); z-index: 5; pointer-events: none; transition: left .2s; }
  .w3-cb::after { content: attr(data-t); position: absolute; top: -12px; left: -2px; font: 600 12px/12px var(--sans); white-space: nowrap; color: var(--encre); background: #fff; padding: 0 2px; border-radius: 2px; }
  .w3-cb.ok { border-left-color: var(--t); } .w3-cb.ok::after { color: var(--t); }
  .w3-note { font-size: 12px; color: var(--gris); display: flex; align-items: center; gap: 4px; }
  .w3-rep { display: flex; flex-direction: column; gap: 8px; }
  .w3-h2 { font-size: 16px; display: flex; align-items: center; gap: 6px; }
  .w3-h3 { font-size: 14px; display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap; }
  .w3-h3s { font-size: 12px; font-weight: 400; color: var(--gris); }
  .w3-g { display: flex; flex-direction: column; gap: 6px; padding: 10px 12px; border-radius: 8px; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,.14), inset 4px 0 0 #ee9b2f; text-align: left; }
  .w3-g .w3-rec { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; font-size: 16px; }
  .w3-g .w3-rec .hn { font-size: 16px; } .w3-g .w3-rec .mono { font-weight: 600; }
  .w3-ec { display: flex; flex-wrap: wrap; gap: 4px 10px; font-size: 14px; }
  .w3-ec span { display: inline-flex; align-items: center; gap: 3px; } .w3-ec b { font: 600 14px var(--mono); }
  .w3-ec .pi { color: var(--encre); } .w3-ec .ok { color: #2f6b4f; } .w3-ec .manque { color: var(--acc); }
  .w3-grs { display: flex; flex-direction: column; gap: 2px; font-size: 12px; color: var(--gris); } .w3-gr b { color: var(--encre); font-size: 12px; }
  .w3-ri { display: flex; flex-wrap: wrap; gap: 4px 8px; font-size: 12px; align-items: center; }
  .w3-tag { display: inline-flex; align-items: center; gap: 3px; font-size: 12px; font-weight: 600; padding: 1px 6px 1px 4px; border-radius: 999px; box-shadow: inset 0 0 0 1px var(--trait2); color: var(--gris); white-space: nowrap; }
  .w3-tag.risque { color: var(--acc); box-shadow: inset 0 0 0 1px var(--acc); }
  .w3-bio { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; font-size: 14px; }
  .w3-bio b { font-weight: 700; }
  .w3-k5 { display: flex; flex-direction: column; gap: 3px; font-size: 12px; }
  .w3-kl { display: grid; grid-template-columns: 16px 76px 1fr 60px; gap: 6px; align-items: center; } .w3-kb { display: flex; height: 10px; } .w3-kb i { display: block; height: 10px; }
  .w3-kv { font: 600 12px var(--mono); text-align: right; }
  .w3-autres { display: flex; flex-direction: column; gap: 4px; }
  .w3-a { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 2px 8px; padding: 6px 10px; border-radius: 8px; background: #f6f6f9; text-align: left; font-size: 14px; }
  .w3-a[aria-checked="true"] { background: #fff; box-shadow: inset 0 0 0 2px var(--encre); }
  .w3-a .w3-rec { display: flex; flex-wrap: wrap; gap: 2px 6px; align-items: center; font-size: 14px; }
  .w3-a .w3-sc { font: 600 12px var(--mono); text-align: right; white-space: nowrap; }
  .w3-filt { display: flex; flex-direction: column; gap: 6px; }
  .w3-filt .w-seg button { font-size: 12px; min-height: 28px; }
  .w3-filt .w-seg { flex-wrap: wrap; border-radius: 8px; } .w3-filt .w-seg button { border-radius: 8px; }
  .w3-act { display: flex; gap: 8px; }
  .w3-p { font-size: 14px; }
  .w3-pied { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 12px; color: var(--gris); }
`;

const js = `${JS_DEPLIER}
const GESTES = ${JSON.stringify(GESTES)}.map((g) => ({ ...g, P: deplier(g.p) }));
const AV = SIM.AV, LPX = ${LPX};
const MOMENT = ${JSON.stringify(MOMENT)};
const HOPS = ${JSON.stringify(Object.fromEntries(D.VALEURS.houblons.map((h) => [h, { alpha: S.alpha(h), usage: S.usage(h), nom: S.nomH(h), couleur: HOP[h].couleur, stock: HOP[h].stock, huile: fr(HOP[h].huileH.min) + '–' + fr(HOP[h].huileH.max), huileSrc: HOP[h].huileH.src }])))};
const $ = (s) => document.querySelector(s);
// La cible : { famille: crans du style visés, au moins }. Au départ : agrumes à 2 crans, floral à 2 crans.
const ST = { cible: { citrus: 2, floral: 2 }, contrainte: 'style', nombre: 'tous', levure: 'toutes', choix: 0 };
const q = new URLSearchParams(location.search);
if (q.get('cible')) { ST.cible = {}; for (const x of q.get('cible').split(',')) { const [f, v] = x.split(':'); ST.cible[f] = Number(v); } }
if (q.get('contrainte')) ST.contrainte = q.get('contrainte');
if (q.get('choix')) ST.choix = Number(q.get('choix'));
const sortDe = (P) => Object.keys(SIM.B).filter((f) => !P[f].inconnu && P[f].centre > SIM.B[f][1] && AV[f].centre <= SIM.B[f][1]);
function ecart(g) {
  let e = 0;
  for (const [f, v] of Object.entries(ST.cible)) { const c = g.P[f].inconnu ? 0 : g.P[f].crans; e += c < v ? (v - c) : (c - v) * 0.5; }
  return e + g.d * 0.02;
}
let CLASSE = [];
function chercher() {
  CLASSE = GESTES.filter((g) => (ST.nombre === 'un' ? !g.h2 : true) && (ST.levure === 'toutes' || g.l === ST.levure) && (ST.contrainte === 'libre' || !sortDe(g.P).length)).map((g) => ({ g, e: ecart(g) })).sort((a, b) => a.e - b.e);
  // un seul geste par houblon (ou paire) : le plus proche ; la liste montre des houblons différents
  const vu = new Set(); CLASSE = CLASSE.filter((x) => { const k = [x.g.h, x.g.h2].sort().join('+'); if (vu.has(k)) return false; vu.add(k); return true; }).slice(0, 5);
}
const momHtml = (m) => '<span class="w-mo" data-role="moment" data-moment="' + m + '" aria-label="Moment : ' + MOMENT[m].lg + '">' + ICO(MOMENT[m].ic, 14) + '<span>' + MOMENT[m].t + '</span></span>';
const rec = (g, petit) => '<span class="w3-rec"' + (g.h2 ? ' data-role="ajout"' : '') + '><span class="w-hop">' + HOPS[g.h].nom + HOPS[g.h].alpha + '</span>' + (g.h2 ? '<span>+</span><span class="w-hop">' + HOPS[g.h2].nom + HOPS[g.h2].alpha + '</span>' : '') + '<span class="mono">' + (g.h2 ? '2 + 2' : String(g.d).replace('.', ',')) + ' g/L</span>' + momHtml(g.m) + (g.j ? '<span class="mono">' + g.j + ' j</span>' : '') + '<span>' + g.l + '</span></span>';
function rendre() {
  chercher();
  const sel = CLASSE[Math.min(ST.choix, CLASSE.length - 1)];
  const P = sel ? sel.g.P : AV;
  majProfil($('#prof'), P, AV);
  // la cible dessinée sur chaque piste
  $('#prof').querySelectorAll('.w-row').forEach((r) => {
    const f = r.dataset.famille, v = ST.cible[f]; r.classList.toggle('vise', v != null);
    r.setAttribute('data-role', 'reglage'); r.setAttribute('data-reglage', 'cible'); r.setAttribute('tabindex', '0');
    let m = r.querySelector('.w3-cb'); if (v == null) { if (m) m.remove(); return; }
    if (!m) { m = document.createElement('i'); m.className = 'w3-cb'; r.querySelector('.w-z').append(m); }
    const atteint = P[f] && !P[f].inconnu && P[f].crans >= v - 0.25;
    m.style.left = (Math.min(5, v) * LPX) + 'px'; m.dataset.t = (atteint ? '✓ ' : '') + 'cible ' + String(v).replace('.', ','); m.classList.toggle('ok', atteint);
  });
  if (!sel) { $('#geste').innerHTML = '<p class="w-trou"><span class="w-inc"><i class="w-hach"></i>aucun geste</span><span>Aucun geste simulé n’y mène sans sortir de ta 16D : essaie « sans limite ».</span></p>'; $('#autres').innerHTML = ''; return; }
  const g = sel.g;
  const ec = Object.entries(ST.cible).map(([f, v]) => { const c = g.P[f].inconnu ? null : g.P[f].crans, ok = c != null && c >= v - 0.25;
    return '<span class="' + (ok ? 'ok' : 'manque') + '">' + PIC(f, 14) + MOTS_F[f] + ' <b data-nature="simule">~ ' + (c == null ? '?' : String(Math.round(c * 10) / 10).replace('.', ',')) + '</b> / ' + String(v).replace('.', ',') + ' crans' + (ok ? ' ✓' : '') + '</span>'; }).join('');
  const sort = sortDe(g.P);
  const ri = [];
  if (sort.length) ri.push('<span class="w3-tag risque">' + ICO('risque', 12) + 'sort de ta 16D : ' + sort.map((f) => MOTS_F[f]).join(', ') + '</span>');
  if (g.m === 'dryActive') ri.push('<span class="w3-tag risque">' + ICO('risque', 12) + 'hop creep</span><span class="w-v mono" data-nature="mesure" data-source="H35 · Klimczak 2023">+0,39 % vol. en 2 j</span>');
  if (g.h2 || (g.m.startsWith('dry') && g.d >= 4)) ri.push('<span class="w3-tag">' + ICO('huile', 12) + 'dose à cru ' + (g.h2 ? 4 : g.d) + ' g/L : saturation</span>');
  if (g.h2) ri.push('<span class="w3-tag"><i class="w-hach"></i>synergie, masquage : inconnus</span>');
  ri.push('<span class="w3-tag">~ confiance ' + (g.c || '?') + '</span>');
  const gr = (h, dose) => { const n = dose * 20, st = HOPS[h].stock; return '<span class="w3-gr"><b class="mono" data-nature="mesure" data-source="dose × 20 L">' + n + ' g</b> de ' + h + ' pour 20 L · ' + (st >= n ? 'en stock (' + st + ' g)' : st > 0 ? 'stock insuffisant (' + st + ' g)' : 'à acheter') + '</span>'; };
  const grs = g.h2 ? gr(g.h, 2) + gr(g.h2, 2) : gr(g.h, g.d);
  const bio = g.m !== 'dryActive' ? '<span class="w-inc"><i class="w-hach"></i>biotransformation : ' + (g.m.startsWith('dry') ? 'après fermentation, hors du cas documenté' : 'pas de levure au contact') + '</span>'
    : g.l === 'Pomona' ? '<b>Pomona en actif</b>' + PIC('floral', 16) + ICO('fleche', 12) + PIC('citrus', 16) + '<span>géraniol → citronellol, ~ 50 % au centre (convention, H41)</span>'
    : g.l === 'Verdant' ? '<b>Verdant en actif</b>' + PIC('tropical', 16) + '<span>thiols libérés ~ 0,1 % (<span class="w-v mono" data-nature="mesure" data-source="H42">0,01–0,35 %</span>)</span>'
    : g.l === 'Diamond' ? '<b>Diamond en actif</b>' + PIC('tropical', 16) + '<span>plus de thiols mesurés, fruité perçu le plus faible (Samia)</span>'
    : '<span class="w-inc"><i class="w-hach"></i>US-05 en actif : biotransformation non publiée (pas une preuve d’absence)</span>';
  let k5 = '';
  if (g.ap) { const [a, b] = Object.keys(g.ap); const top = ORD.map((f, i) => ({ f, i, t: g.ap[a][i] + g.ap[b][i] })).filter((x) => x.t > 0.5).sort((x, y) => y.t - x.t).slice(0, 3);
    k5 = '<div class="w3-k5" data-role="ajout">' + top.map((x) => '<div class="w3-kl">' + PIC(x.f, 14) + '<span style="color:' + SIM.T[x.f] + ';font-weight:600">' + MOTS_F[x.f] + '</span><span class="w3-kb"><i data-nature="simule" style="width:' + g.ap[a][x.i] * 2.2 + 'px;background:' + HOPS[a].couleur + '"></i><i data-nature="simule" style="width:' + g.ap[b][x.i] * 2.2 + 'px;background:' + HOPS[b].couleur + '"></i></span><b class="w3-kv" data-nature="simule">~ +' + Math.round(x.t) + ' pts</b></div>').join('')
      + '<span class="w3-note">ce que chacun apporte : ' + a + ' puis ' + b + ', points sur 100, ~ simulés ; ensemble, moins que la somme (saturation partagée)</span></div>'; }
  $('#geste').innerHTML = '<div class="w3-g" data-role="geste">' + rec(g) + '<div class="w3-ec">' + ec + '</div><div class="w3-grs">' + grs + '</div>' + k5 + '<div class="w3-bio" data-role="biotransformation">' + ICO('bio', 16) + bio + '</div><div class="w3-ri">' + ri.join('') + '</div></div>';
  $('#rep-t').textContent = Object.keys(ST.cible).length ? 'Pour y aller : ' + Object.entries(ST.cible).map(([f, v]) => MOTS_F[f] + ' ' + String(v).replace('.', ',') + ' crans').join(', ') : 'Touche une piste pour viser';
  $('#autres').innerHTML = CLASSE.map((x, i) => '<button type="button" class="w3-a" data-role="reglage" data-reglage="geste" data-v="' + i + '" aria-checked="' + (i === ST.choix) + '">' + rec(x.g, true) + '<span class="w3-sc" data-nature="simule">~ écart ' + String(Math.round(x.e * 10) / 10).replace('.', ',') + '</span></button>').join('');
}
// toucher une piste : la cible se pose là ; toucher sa cible : elle s'efface
$('#prof').addEventListener('click', (e) => {
  const r = e.target.closest('.w-row'); if (!r) return;
  const z = r.querySelector('.w-z').getBoundingClientRect(), f = r.dataset.famille;
  let v = Math.round(((e.clientX - z.left) / LPX) * 2) / 2;
  if (e.clientX < z.left) v = 1.5;
  v = Math.max(0.5, Math.min(5, v));
  if (ST.cible[f] != null && Math.abs(ST.cible[f] - v) < 0.6 && e.detail !== 0) delete ST.cible[f]; else ST.cible[f] = v;
  ST.choix = 0; rendre();
});
$('#prof').addEventListener('keydown', (e) => { const r = e.target.closest('.w-row'); if (!r || !['ArrowRight', 'ArrowLeft'].includes(e.key)) return; const f = r.dataset.famille; ST.cible[f] = Math.max(0.5, Math.min(5, (ST.cible[f] || 0) + (e.key === 'ArrowRight' ? 0.5 : -0.5))); ST.choix = 0; rendre(); e.preventDefault(); });
document.addEventListener('click', (e) => {
  const b = e.target.closest('button[data-role="reglage"]'); if (!b) return;
  const k = b.dataset.reglage;
  if (k === 'geste') ST.choix = Number(b.dataset.v);
  else if (k === 'effacer') { ST.cible = {}; ST.choix = 0; }
  else if (k === 'contrainte' || k === 'nombre' || k === 'levure') { ST[k] = b.dataset.v; ST.choix = 0; b.closest('[role="radiogroup"]').querySelectorAll('[role="radio"]').forEach((x) => x.setAttribute('aria-checked', String(x === b))); }
  rendre();
});
rendre();
`;

ecrire(path.join(ICI, 'etat.html'), page({
  titre: 'w3 · Dessine ta bière',
  commentaire: 'Lot 21 · w3 : le brasseur touche la piste où il veut aller ; la page cherche les gestes simulés qui y mènent (un ou deux houblons, moment, jours, levure), rangés par écart ; profil ~ simulé (' + STUB_MOT + ').',
  corps, css, js, feuilles, demande: [{ f: 'citrus', s: 1 }, { f: 'floral', s: 1 }],
  sim: { T: Object.fromEntries(ORDRE.map((f) => [f, JET[f].texte])) },
}));
