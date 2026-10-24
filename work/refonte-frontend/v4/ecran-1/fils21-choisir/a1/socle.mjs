// Lot 21 · série a · le socle commun des variantes a1 à a6 : la coquille de page (typographie, pictos au
// trait de l5e, « ? » de légende, lentille au style / absolu, fiche à l'appui long dans le langage de la
// page), les vraies valeurs (reel.mjs) et le vrai profil simulé du moteur (donnees.mjs, lu par vue.js).
// La baseline (fils18-baseline/l5e) est importée, pas recopiée : SPRITE, CSS, LEGENDE_JS, GESTE_JS.
import fs from 'node:fs';
import * as T5 from '../../fils18-baseline/l5e/tuiles-l5e.mjs';
import { reel } from './reel.mjs';
import { tranche, CHEMIN } from './donnees.mjs';
export { tranche };

export const K = T5.K;
export const R = reel();
export const D21 = K.E1 + '/fils21-choisir';
const ICI = D21 + '/a1';
const { ico, esc, J, NOM, COURT, DB, STOCK_MOT, STOCK_ICO, roueSVG, plageF, nbF, recente, ROLE_MOT } = K;
const fr = (x) => String(Math.round(x * 10) / 10).replace('.', ',');
// Les fiches de ces pages ne portent pas « ma demande » de c1 (floral +, résineux −) : autre recette.
K.DB.direction = [];

// Données simulées : le vrai fichier du moteur profil-simule (le stub de la série est retiré).
export const SIMULE = { vrai: true, chemin: CHEMIN };

// ---------- les fiches des quatre houblons, dans le langage de la page (D93, copie adaptée de l5e) ----------
const HOPS = ['citra', 'galaxy', 'idaho7', 'cascade', 'motueka', 'nelson'];
const pct = (x) => fr(x) + '%';
const LIVRE = ico('i-livre', 12), DIFF = ico('i-diff', 12, 'class="dif"');
function usagePill(id) {
  const u = R.houblons[id].usage, mot = { aromatique: 'arôme', 'amérisant': 'amer', double: 'mixte' }[u.u] || 'inconnu';
  return `<span class="us${u.src === 'règle' ? ' deduit' : ''}" data-role="usage" data-usage="${u.u}" data-source="${u.src}" aria-label="${esc(R.houblons[id].nom)} : ${u.u}, ${u.src === 'fournisseur' ? 'attesté par le fournisseur' : 'déduit de l\'α, à valider'}">${mot}</span>`;
}
function barresFiche(F) {
  const par = Object.fromEntries(F.aromes.map((x) => [x.f, x])), of = (F.aromes[0] || {}).of || 0, HCF = 24;
  const col = (f, k) => {
    const x = par[f], n = x ? x.n : 0, sep = k === DB.attendues.length ? ' sep' : '';
    if (!n) return `<span class="mb fi-mb nd${sep}" data-famille="${f}" role="img" aria-label="${NOM[f]} : non décrit par ses fiches"><span class="mb-z"><i class="mb-i"></i></span>${T5.picto(f, 14)}</span>`;
    const h = Math.max(5, n / of * HCF);
    return `<span class="mb fi-mb ${n >= 2 ? 'mq' : 'ci'}${sep}" data-famille="${f}" role="img" aria-label="${NOM[f]} : ${of === 1 ? 'cité par sa seule fiche' : n + ' fiches sur ' + of}" style="--c:${J[f].base};--cf:${T5.rgba(J[f].base, 0.4)};--hc:${HCF}px"><span class="mb-z"><i class="mb-b" style="--s:${h.toFixed(1)}px;--a:${h.toFixed(1)}px"></i></span>${T5.picto(f, 14)}</span>`;
  };
  const seule = of === 1 ? (F.aromes.find((x) => x.n) || { auteurs: [] }).auteurs[0] : null;
  return `<div class="fi-bars"><span class="fi-bars-c" aria-label="Les familles citées par les fiches de ${esc(F.nom)}">${DB.ordre.map(col).join('')}</span>${seule ? `<span class="fi-seule">1 seule fiche : ${esc(seule)}</span>` : ''}</div>`;
}
function lignesFiche(F) {
  const par = Object.fromEntries(F.aromes.map((x) => [x.f, x]));
  return DB.ordre.filter((f) => par[f] && par[f].n > 0).map((f) => {
    const x = par[f], cpt = x.of === 1 ? '' : x.n + '/' + x.of;
    const mots = [...new Set((x.mots || []).flatMap((m) => m.mots).map((w) => w.toLowerCase()))];
    return `<div class="fi-lab" data-explique="${f}">${T5.picto(f, 16)}<span class="fi-lab-t"><span class="fi-lab-n" style="--t:${J[f].texte}">${COURT[f]}</span>${cpt ? ` <span class="fi-cpt nb">${cpt}</span>` : ''}${mots.length ? `${cpt ? ' <span class="fi-sep" aria-hidden="true">·</span>' : ''} <span class="fi-mots">${esc(mots.join(', '))}</span>` : ''}</span></div>`;
  }).join('');
}
function alphaFiche(F, id) {
  const A = R.houblons[id];
  const srcs = [...F.alpha].sort((a, b) => (a.an || 0) - (b.an || 0));
  const lot = A.alpha.lot != null ? `<span class="al lot" data-role="alpha" data-source="lot" role="img" aria-label="α du lot en stock : ${fr(A.alpha.lot)} %${A.alpha.horsFiches ? ' ; hors des plages de ses fiches' : ''}">${pct(A.alpha.lot)}${A.alpha.horsFiches ? DIFF : ''}</span>` : '';
  const fi = srcs.length ? `<span class="al af" data-role="alpha" data-source="fiches" role="img" aria-label="α de ses fiches : ${srcs.map((s) => plageF(s) + ' % (' + s.src + (s.an ? ' ' + s.an : '') + ')').join(', ')}">${LIVRE}${srcs.map((s) => plageF(s) + '%').join(' · ')}</span>` : '';
  return `<span class="fi-alpha" data-role="fiche-alpha">${lot}${fi}</span>`;
}
function partsFiche(F, id) {
  const a = recente(F.alpha), W = 60, r3 = (x) => Math.round(x * 1000) / 1000, x = (v) => 2 + Math.max(0, Math.min(1, v / 25)) * (W - 4);
  const lot = R.houblons[id].alpha.lot;
  const reglette = a ? `<svg class="fi-reg" width="${W}" height="12" viewBox="0 0 ${W} 12" aria-hidden="true"><rect x="2" y="4" width="${W - 4}" height="4" rx="2" fill="#e9ecf2"/>${F.alpha.map((s) => `<rect x="${r3(x(s.min) - 1)}" y="2" width="${r3(Math.max(3, x(s.max) - x(s.min) + 2))}" height="8" rx="2" fill="${s === a ? '#16161a' : '#aeb3be'}"/>`).join('')}${lot != null ? `<rect x="${r3(x(lot) - 1.5)}" y="0" width="3" height="12" rx="1" fill="#16161a" stroke="#fff" stroke-width="1"/>` : ''}</svg>` : '';
  const H0 = R.houblons[id];
  const note = H0.stockAutre ? `<p class="fi-note">En stock : Citra ${H0.stockAutre.forme}, α ${fr(H0.stockAutre.alpha)} %. Ces pages lisent Citra T-90 (pellets), comme les moteurs.</p>`
    : H0.alpha.horsFiches ? `<p class="fi-note">Mon lot ${nbF(lot)} % : hors des plages de ses fiches.</p>` : '';
  const srcTxt = (s) => s.src + (s.an ? ' ' + s.an : '');
  const rg = (n, v) => `<div class="fi-rg"><span>${esc(n)}</span><b>${esc(v)}</b></div>`;
  const tags = (arr) => `<div class="fi-tags">${arr.map((t) => `<span>${esc(t)}</span>`).join('')}</div>`;
  const sections = [
    ['huiles', 'Huiles', (F.huiles.length ? F.huiles.map((s) => rg('totale, ' + srcTxt(s), plageF(s) + ' mL/100 g')).join('') : rg('totale', 'non renseigné')) + F.composants.map((c) => rg(c.nom, c.min != null ? plageF(c) + ' %' + (c.src ? ', ' + c.src : '') : c.raison || 'non renseigné')).join('')],
    ['sources', 'Sources', F.alpha.map((s) => rg('α ' + srcTxt(s), plageF(s) + ' %')).join('') + (lot != null ? rg('α mon lot', nbF(lot) + ' %') : '') + `<p class="fi-txt">Origine : ${esc(F.origine || 'non renseigné')}</p>` + F.aromes.filter((q) => q.n > 0).map((q) => `<p class="fi-txt"><b>${COURT[q.f]}${q.of === 1 ? '' : ' ' + q.n + '/' + q.of}</b> ${esc(q.auteurs.join(', ') || 'non renseigné')}</p>`).join('')],
    ['dryhop', 'En dry hop', (H0.panel || []).map((p) => `<p class="fi-txt">${esc(p.texte)} <span class="fi-gris">${esc(p.sources.join(', '))}</span></p>`).join('') || '<p class="fi-gris">Aucun panel trouvé.</p>'],
  ];
  const nd = DB.ordre.filter((f) => !F.aromes.find((q) => q.f === f && q.n > 0));
  return { reglette, note, sections, nd: nd.length ? `<p class="fi-nd">${nd.length} non décrite${nd.length > 1 ? 's' : ''} : ${nd.map((f) => COURT[f]).join(', ')}</p>` : '', roue: roueSVG(F, { W: 330, id: id, gris: '#55555f', grille: '#e3e5eb' }) };
}
export const FICHES = {};
for (const id of HOPS) {
  const H0 = R.houblons[id], F0 = K.fiche(id === 'citra' ? 'Citra cryo' : H0.nom), F = { ...F0, nom: H0.nom };
  const P = partsFiche(F, id);
  FICHES[H0.nom] = `<div class="fi-voile" data-k="voile" aria-hidden="true"></div>
  <section class="fi" data-role="fiche" role="dialog" tabindex="-1" aria-label="Fiche de ${esc(H0.nom)}">
    <div class="fi-poignee" aria-hidden="true"></div>
    <header class="fi-t"><h2>${esc(H0.nom)}</h2>${usagePill(id)}<span class="stk" role="img" aria-label="${STOCK_MOT[H0.stock]}">${ico(STOCK_ICO[H0.stock], 14)}</span><button class="fi-x" data-role="fermer-fiche" data-k="fermer" aria-label="Fermer la fiche de ${esc(H0.nom)}">${ico('i-x', 16)}</button></header>
    <div class="w fi-duo">${alphaFiche(F, id)}${P.reglette}${P.note}</div>
    <div class="w w-ar" data-role="fiche-arome">${barresFiche(F)}${lignesFiche(F)}${P.nd}<div class="fi-r">${P.roue}</div></div>
    <div class="fi-act"><span class="fi-g" role="group" data-role="gout" aria-label="Mon goût pour ${esc(H0.nom)}"><button data-k="aimer" aria-pressed="false" aria-label="Aimer ${esc(H0.nom)}">${ico('i-heart', 16)}</button><button data-k="exclure" aria-pressed="false" aria-label="Exclure ${esc(H0.nom)}">${ico('i-ban', 16)}</button></span><button class="fi-b" data-k="comparer" aria-label="Comparer ${esc(H0.nom)} à d'autres houblons">Comparer</button></div>
    <div class="fi-replis" role="group" aria-label="Détail de la fiche">${P.sections.map(([s, t]) => `<button data-k="repli" data-sec="${s}" aria-expanded="false">${t}${ico('i-chev-d', 14)}</button>`).join('')}</div>
    ${P.sections.map(([s, t, corps]) => `<div class="w fi-sec" data-sec-corps="${s}" hidden aria-label="${t}">${corps}</div>`).join('')}
  </section>`;
}
const FICHE_JS = `
const FICHES = ${JSON.stringify(FICHES)};
const VOIES = {};
function rendFiche(nom, mode) {
  RACINE.className = 'mode-' + mode;
  RACINE.innerHTML = mode === 'bulle' ? FICHES[nom].replace(/<div class="fi-voile"[^>]*><\\/div>/, '') : FICHES[nom];
}
${K.GESTE_JS}`;

// ---------- la légende derrière le « ? » (D89) ----------
const li = (c, m) => `<span class="leg-i"><span class="leg-c">${c}</span><span>${m}</span></span>`;
export const leg = { li };
export function LEGENDE(sections) {
  return `
  <div class="leg-v" data-role="legende-voile" hidden></div>
  <section class="legende" id="legende" data-role="legende" role="dialog" aria-label="Légende" hidden>
    <i class="leg-bec" aria-hidden="true"></i>
    <div class="leg-in">
    <div class="leg-t"><span>Légende</span><button class="leg-x" data-role="legende-fermer" aria-label="Fermer la légende">${ico('i-x', 16)}</button></div>
    ${sections.map(([t, items, cls]) => `<div class="leg-s"><h3>${t}</h3><div class="leg-g${cls ? ' ' + cls : ''}">${items.join('')}</div></div>`).join('')}
    </div>
  </section>`;
}
// Les sections communes : familles, signes du simulé et du mesuré, confiance, houblon.
export const LEG_FAMILLES = ['Familles', K.ORDRE.map((f) => li(T5.picto(f, 18), COURT[f]))];
export const LEG_NATURE = ['Vrai et simulé', [
  li('<span class="mv">2 g/L</span>', 'vraie valeur, sourcée (toucher : la source)'),
  li('<span class="sv">~2,4</span>', '« ~ » : simulé, jamais mesuré'),
  li('<span class="cf cf-mesure">mesuré</span>', 'mesuré en bière ou au labo'),
  li('<span class="cf cf-fournisseur">fournisseur</span>', 'fiche du fournisseur'),
  li('<span class="cf cf-estime">estimé</span>', 'calcul de l’outil'),
  li('<span class="cf cf-inconnu">inconnu</span>', 'aucune donnée : pas zéro'),
], 'l2'];
export const LEG_HOUBLON = ['Houblon', [
  li('<span class="us">arôme</span>', 'aromatique'), li('<span class="us deduit">mixte</span>', 'contour : déduit de l’α'),
  li('<span class="al lot">12,7%</span>', 'α du lot en stock'), li(`<span class="al af">${LIVRE}10–15%</span>`, 'sans lot : α des fiches'),
  li(`<span class="al lot">17,2%${DIFF}</span>`, 'lot hors de ses fiches'), li('<span class="leg-doigt" aria-hidden="true"></span>', 'appui long : sa fiche'),
], 'l2'];

// ---------- la coquille ----------
export const entete = (titre, sous = '') => `
  <header class="barre a-barre">
    <a class="retour" href="#" aria-label="Retour">${ico('i-chev-l', 16)}</a>
    <h1 class="a-t">${titre}${sous ? `<span class="a-st">${sous}</span>` : ''}</h1>
    <button class="leg-b" data-role="legende-bouton" aria-expanded="false" aria-controls="legende" aria-label="Légende des pictos, des barres et des signes">${ico('i-aide', 18)}</button>
  </header>`;
export const lentille = () => `<div class="seg lentille" role="radiogroup" aria-label="Lecture des familles"><button role="radio" data-e="style" aria-checked="true">Au style</button><button role="radio" data-e="absolu" aria-checked="false">Absolu</button></div>`;
const ICO = Object.fromEntries(['j-ebu', 'j-whirl', 'j-cuve-a', 'j-cuve-p', 'j-levure', 'j-stock', 'j-achat', 'j-manque', 'i-chev-r', 'i-chev-l', 'i-chev-d', 'i-plus', 'i-x', 'i-arrow-r', 'i-equal', 'i-check', 'j-alerte', 'j-nonsitue'].map((k) => [k, ico(k, 16)]));
const TJ = { J, NOM, COURT, ICO, LIVRE, STOCK_MOT, STOCK_ICO_HTML: Object.fromEntries(Object.keys(STOCK_MOT).map((k) => [k, ico(STOCK_ICO[k], 14)])) };
const lireJs = (f) => fs.readFileSync(ICI + '/' + f, 'utf8');
const LENTILLE_JS = `
document.querySelectorAll('.lentille [data-e]').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('.lentille [data-e]').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
  document.body.classList.toggle('abs', b.dataset.e === 'absolu');
  if (window.redessiner) window.redessiner();
}));
if (/[?&]abs\\b/.test(location.search)) document.querySelector('.lentille [data-e="absolu"]').click();`;
export const lentilleCourante = 'document.body.classList.contains("abs") ? "absolu" : "style"';

// La feuille de style commune de la série (en plus de celle de l5e).
export const CSS_A = `
  .ecran { gap: 8px; padding-bottom: 28px; }
  .a-barre { gap: 8px; }
  .a-t { flex: 1; min-width: 0; font-size: 17px; font-weight: 700; line-height: 1.15; display: flex; flex-direction: column; }
  .a-st { font-size: 12px; font-weight: 400; color: var(--gris); }
  .carte { background: #fff; border-radius: 8px; box-shadow: var(--ombre); padding: 8px 10px; display: flex; flex-direction: column; gap: 6px; min-width: 0; }
  .ct { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; min-height: 20px; flex-wrap: wrap; }
  .ct .dr { margin-left: auto; display: inline-flex; gap: 4px; align-items: center; }
  .mono, .mv, .sv { font-family: var(--mono); font-variant-numeric: tabular-nums; }
  .mv { font-size: 12px; font-weight: 500; color: var(--encre); white-space: nowrap; }
  .sv { font-size: 12px; font-weight: 500; color: var(--encre); white-space: nowrap; }
  .gris { color: var(--gris); font-size: 12px; }
  .hors-t { color: #9a3412; font-weight: 600; }
  .mv.mot { font-family: var(--sans); font-weight: 600; white-space: normal; }
  .phr .pi, .src-l .pi, p .pi { display: inline-block; vertical-align: -3px; margin: 0 1px; }
  /* Les quatre mots de confiance : un mot, et une forme (plein, contour, tirets, hachures). */
  .cf { display: inline-flex; align-items: center; height: 18px; padding: 0 6px; border-radius: 9px; font-size: 12px; font-weight: 600; white-space: nowrap; color: var(--encre); }
  .cf-mesure { background: var(--encre); color: #fff; }
  .cf-fournisseur, .cf-etude, .cf-panel { box-shadow: inset 0 0 0 1.5px var(--encre); background: #fff; }
  .cf-estime { background: #fff; box-shadow: none; outline: 1.5px dashed #6b6b75; outline-offset: -1.5px; color: #3d3d44; }
  .cf-inconnu { background: repeating-linear-gradient(135deg, #fff 0 3px, #d5d7de 3px 5px); box-shadow: inset 0 0 0 1px #8a909b; color: var(--encre); }
  /* Réglages : des segments et des pastilles de 28 px au moins. */
  .rg { display: flex; gap: 4px; flex-wrap: wrap; align-items: center; }
  .rg-b { min-height: 28px; padding: 0 10px; border-radius: 14px; background: #fff; box-shadow: inset 0 0 0 1px #c9cad2; font-size: 13px; font-weight: 600; color: var(--encre); display: inline-flex; align-items: center; gap: 5px; white-space: nowrap; }
  .rg-b[aria-pressed="true"], .rg-b[aria-checked="true"] { background: var(--encre); color: #fff; box-shadow: none; }
  .rg-b[aria-pressed="true"] .sw, .rg-b[aria-checked="true"] .sw { --sw: #fff; }
  .rg-b:focus-visible, .seg button:focus-visible { outline: 2px solid #1d4ed8; outline-offset: 2px; }
  .rg-l { font-size: 12px; color: var(--gris); margin-right: 2px; }
  /* Motifs : la forme dit quel houblon (plein, rayé, pointillé), la couleur dit la famille. */
  .sw { --sw: var(--encre); display: inline-block; width: 12px; height: 12px; border-radius: 2px; box-shadow: inset 0 0 0 1.5px var(--sw); flex: none; }
  .sw.m-plein { background: var(--sw); }
  .sw.m-raye { background: repeating-linear-gradient(135deg, var(--sw) 0 2px, transparent 2px 4.5px); }
  .sw.m-point { background: radial-gradient(circle, var(--sw) 1.2px, transparent 1.4px) 0 0 / 4px 4px; }
  .hn { font-size: 14px; font-weight: 600; -webkit-touch-callout: none; -webkit-user-select: none; user-select: none; }
  .hop { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; min-width: 0; }
  .al .dif { font: 600 12px var(--sans); color: var(--gris); margin-left: 2px; }
  .stk svg { display: block; }
  /* La bande log. */
  .bl { display: inline-flex; flex-direction: column; gap: 1px; width: var(--w); flex: none; }
  .bl-p { position: relative; height: 26px; width: var(--w); margin-top: 2px; }
  .bl-ax { position: absolute; left: 0; right: 0; top: 14px; height: 1px; background: #c4c6ce; }
  .bl-t { position: absolute; top: 11px; width: 1px; height: 7px; background: #aeb3be; }
  .bl-t.un { top: 5px; height: 21px; width: 1.5px; background: var(--encre); }
  .bl-b { position: absolute; top: 10px; height: 9px; border-radius: 2px; background: repeating-linear-gradient(90deg, rgba(22,22,26,.55) 0 3px, rgba(22,22,26,.3) 3px 6px); box-shadow: inset 0 0 0 1px var(--encre); }
  .bl-b.ouv-d { -webkit-mask: linear-gradient(90deg, #000 70%, transparent); mask: linear-gradient(90deg, #000 70%, transparent); }
  .bl-b.ouv-g { -webkit-mask: linear-gradient(270deg, #000 70%, transparent); mask: linear-gradient(270deg, #000 70%, transparent); }
  .bl-c { position: absolute; top: 10px; width: 9px; height: 9px; margin-left: -4.5px; border-radius: 50%; background: #fff; box-shadow: inset 0 0 0 2px var(--encre); }
  .bl-s { position: absolute; top: -3px; margin-left: 3px; font-size: 12px; line-height: 12px; color: var(--gris); }
  .bl-n { display: flex; }
  .bl-v { font-size: 12px; }
  /* Colonnes de famille. */
  .vbs { display: flex; align-items: flex-end; justify-content: space-between; gap: 2px; }
  .vb { display: inline-flex; flex-direction: column; align-items: center; gap: 2px; flex: 1; min-width: 0; }
  .vb-p { position: relative; width: 16px; height: var(--hc); }
  .vb-p::after { content: ''; position: absolute; left: -3px; right: -3px; bottom: -1px; height: 1.5px; background: var(--encre); }
  .vb-z { position: absolute; left: -3px; right: -3px; bottom: 0; background: var(--z); border-top: 1.5px solid var(--t); }
  .vb-a { position: absolute; left: 3px; right: 3px; bottom: 0; background: #b8bbc4; border-radius: 2px 2px 0 0; }
  .vb-s { position: absolute; left: 1px; right: 1px; z-index: 1; }
  .vb-s.m-plein, .hl-s.m-plein { background: var(--c); }
  .vb-s.m-raye, .hl-s.m-raye { background: repeating-linear-gradient(135deg, var(--c) 0 2.5px, #fff 2.5px 4.5px); box-shadow: inset 0 0 0 1px var(--c); }
  .vb-s.m-point, .hl-s.m-point { background: radial-gradient(circle, var(--c) 1.4px, #fff 1.6px) 0 0 / 4px 4px; box-shadow: inset 0 0 0 1px var(--c); }
  .vb-s.m-bio, .hl-s.m-bio { background: #fff; box-shadow: inset 0 0 0 1.5px var(--t); background-image: repeating-linear-gradient(0deg, var(--t) 0 1px, transparent 1px 3px); }
  .vb-s.m-perte, .hl-s.m-perte { background: #fff; box-shadow: inset 0 0 0 1.5px var(--t); background-image: none; border: 1.5px dashed var(--t); box-sizing: border-box; }
  .vb-x { position: absolute; left: 1px; right: 1px; z-index: 2; background: var(--acc); }
  .vb-w { position: absolute; left: 50%; width: 1.5px; margin-left: -0.75px; z-index: 3; background: var(--encre); }
  .vb-w::before, .vb-w::after { content: ''; position: absolute; left: -3px; width: 7.5px; height: 1.5px; background: var(--encre); }
  .vb-w::before { top: 0; } .vb-w::after { bottom: 0; }
  .vb-fl { position: absolute; top: -6px; left: 50%; margin-left: -4px; border: 4px solid transparent; border-bottom: 5px solid var(--encre); border-top: 0; z-index: 3; }
  .vb-inc { position: absolute; left: -2px; right: -2px; height: 18px; z-index: 2; display: flex; align-items: center; justify-content: center; font: 700 12px var(--sans); color: var(--encre); background: repeating-linear-gradient(135deg, #fff 0 2px, #c6c9d1 2px 3.5px); box-shadow: inset 0 0 0 1px #8a909b; border-radius: 2px; }
  .vb-g { position: absolute; left: -1px; right: -1px; border: 1.5px dashed var(--gris); border-bottom: 0; z-index: 4; pointer-events: none; }
  .vb .pi { width: 16px; height: 16px; }
  .vb-v { font-size: 12px; line-height: 14px; }
  .vb-v.inc { font: 700 12px var(--sans); }
  /* Lignes de famille. */
  .hls { display: flex; flex-direction: column; gap: 3px; }
  .hl { display: grid; grid-template-columns: 92px var(--w) 1fr; align-items: center; gap: 6px; min-height: 24px; }
  .hl-n { display: inline-flex; align-items: center; gap: 4px; min-width: 0; }
  .hl-m { font-size: 13px; font-weight: 600; color: var(--t); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .hl-p { position: relative; height: 16px; width: var(--w); }
  .hl-p::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 2px; background: var(--encre); z-index: 5; }
  .hl-z { position: absolute; left: 0; top: -2px; bottom: -2px; background: var(--z); border-right: 1.5px solid var(--t); }
  .hl-a { position: absolute; left: 0; top: 4px; height: 8px; background: #b8bbc4; }
  .hl-s { position: absolute; top: 2px; height: 12px; z-index: 1; }
  .hl-x { position: absolute; top: 2px; height: 12px; z-index: 2; background: var(--acc); }
  .hl-som { position: absolute; top: 1px; height: 14px; z-index: 1; border: 1.5px dashed var(--encre); border-left: 0; border-radius: 0 2px 2px 0; box-sizing: border-box; }
  .hl-w { position: absolute; top: 7px; height: 1.5px; z-index: 3; background: var(--encre); }
  .hl-w::before, .hl-w::after { content: ''; position: absolute; top: -3px; width: 1.5px; height: 7.5px; background: var(--encre); }
  .hl-w::before { left: 0; } .hl-w::after { right: 0; }
  .hl-r { position: absolute; top: -3px; width: 0; height: 22px; z-index: 4; border-left: 2px solid var(--encre); }
  .hl-r.b { border-left-style: dotted; }
  .hl-inc { position: absolute; left: 4px; top: 1px; height: 14px; padding: 0 6px; font: 700 12px var(--sans); line-height: 14px; color: var(--encre); background: repeating-linear-gradient(135deg, #fff 0 2px, #c6c9d1 2px 3.5px); box-shadow: inset 0 0 0 1px #8a909b; border-radius: 2px; z-index: 2; }
  .hl-v { font-size: 12px; text-align: right; }
  .hl-v.inc { font: 600 12px var(--sans); color: var(--gris); }
  .hl.hors .hl-m::after { content: ''; }
  .stub { font: 600 12px var(--sans); color: #3d3d44; background: #fff; border-radius: 9px; padding: 1px 6px; box-shadow: inset 0 0 0 1px #c9cad2; }
  details.pl2 > summary { list-style: none; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; min-height: 28px; }
  details.pl2 > summary::-webkit-details-marker { display: none; }
  details.pl2 > summary .chev { margin-left: auto; transition: transform .15s; }
  details.pl2[open] > summary .chev { transform: rotate(180deg); }
  .src-l { font-size: 12px; color: var(--gris); }
  .phr { font-size: 13px; line-height: 1.35; }
  .phr b { font-weight: 600; }
  .a-verif { font: 600 12px var(--sans); color: var(--encre); background: #fff; border-radius: 4px; padding: 0 4px; outline: 1.5px dashed #55555f; outline-offset: -1.5px; white-space: nowrap; }
  .hl-legz, .hl-legx, .hl-legr, .hl-legw { display: inline-block; width: 16px; height: 10px; flex: none; }
  .hl-legz { background: #fdf1e3; border-right: 1.5px solid #9b5d0d; }
  .hl-legx { background: var(--acc); height: 8px; }
  .hl-legr { width: 0; height: 14px; border-left: 2px solid var(--encre); margin: 0 7px; }
  .hl-legw { height: 1.5px; background: var(--encre); box-shadow: -1px 0 0 0 var(--encre); }
  .lg-b { display: inline-block; width: 10px; height: 14px; border-radius: 2px; flex: none; }
  .lg-l { background: repeating-linear-gradient(135deg, #fff 0 2px, #8a909b 2px 3.5px); outline: 1.5px dashed #55555f; outline-offset: -1.5px; }
  .lg-w { display: inline-block; width: 1.5px; height: 14px; background: var(--encre); margin: 0 5px; }
  .k-som { display: inline-block; width: 12px; height: 9px; border: 1.5px dashed var(--encre); border-left: 0; border-radius: 0 2px 2px 0; }
  .k-bio { display: inline-block; width: 10px; height: 10px; box-shadow: inset 0 0 0 1.5px #55555f; background-image: repeating-linear-gradient(0deg, #55555f 0 1px, transparent 1px 3px); border-radius: 2px; }
`;
export function page({ fichier, titre, description, css = '', corps, js = '', legende, donnees }) {
  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titre}</title>
<!-- ${description} Profil simulé : ${SIMULE.chemin} (moteur profil-simule) ; vraies valeurs : a1/reel.mjs et mesures[] du moteur. -->
${T5.POLICES}
<style>${T5.CSS}${CSS_A}${css}</style>
</head>
<body>
${T5.SPRITE}
<main class="ecran">${corps}
</main>
${LEGENDE(legende)}
<div id="fiche-racine"></div>
<script>window.R = ${JSON.stringify(R)}; window.T = ${JSON.stringify(TJ)}; window.P = ${JSON.stringify(donnees)};</script>
<script>${lireJs('vue.js')}</script>
<script>${js}</script>
<script>${LENTILLE_JS}${T5.LEGENDE_JS}${FICHE_JS}</script>
</body>
</html>
`;
  K.ecrire(fichier, html);
}
export { ico, esc, J, NOM, COURT };
export const picto = T5.picto;
