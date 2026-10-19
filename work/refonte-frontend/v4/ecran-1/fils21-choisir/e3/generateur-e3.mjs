// Lot 21 · e3 · « Les plans, du sage à l'osé » : le ladder des SCÉNARIOS de dry hop, pas des variétés.
// Sur une même échelle, pour une famille : les dry hops seuls (K2, et Cascade en témoin), les deux dry
// hops successifs (K3, K4) et les deux houblons ENSEMBLE (K5), à dose totale égale (4 g/L). Chaque plan
// porte sa chronologie (les jours de contact, et la courbe simulée jour par jour), l'estimé ~ de la
// bière après (profils-simules.json : cas[] et grille[]), le calculé du moteur avec sa bande en log
// (e1/donnees/moteur-e.json), la saturation partagée, la biotransformation et ce qui reste inconnu.
// Les plans se rangent en trois paliers nommés par leur audace face à la 16D (sage, franc, osé), jamais
// par une note. Les réglages (moment, levure) changent les plans et les reclassent ; une seconde vue
// montre les moments (K1 : « Pourquoi à 10′ pas à 60′ ? »).
// Usage : node generateur-e3.mjs → e3/etat.html (socle et runtime commun : ../e1/).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as S from '../e1/socle-e.mjs';

const ici = path.dirname(fileURLToPath(import.meta.url));
const { ico, J, ORDRE, COURT, picto } = S;
const RT = fs.readFileSync(path.join(ici, '../e1/runtime-commun.js'), 'utf8') + '\n' + fs.readFileSync(path.join(ici, 'runtime-e3.js'), 'utf8');
const P = S.PROFILS;
const FG = P.formatGrille;
const arr = (x) => (Array.isArray(x) ? x : FG.map((k) => (k === 'hautPartiel' ? (x.hautPartiel && x.hautPartiel.length ? 1 : 0) : x[k] ?? null)));
const r2 = (v) => (typeof v === 'number' ? Math.round(v * 100) / 100 : v);
const fam12 = (o) => Object.fromEntries(ORDRE.map((f) => [f, arr(o[f]).map(r2)]));
const LEV = { 'fermentis-us05': 'us-05', 'lalbrew-pomona': 'pomona', 'lalbrew-verdant-ipa': 'verdant', 'lalbrew-diamond': 'diamond' };
const slug = (s) => s.toLowerCase().replace(/\s+/g, '');
const ids = (dr) => [...new Set(dr.map((d) => (typeof d === 'string' ? d : d.id)))];

// ---------- les plans ----------
const PLANS = [];
const typeDe = (c) => (c.groupe === 'K1' ? 'moment' : c.ajouts.length === 1 ? 'seul' : c.ajouts[0].jourDebut === c.ajouts[1].jourDebut ? 'ensemble' : 'successifs');
for (const c of P.cas) {
  if (c.groupe === 'K2') continue; // les dry hops seuls viennent de grille[], pour tous les réglages simulés
  const m = c.ajouts[0].moment, y = c.levure;
  const t = typeDe(c);
  let scen = null;
  if (c.groupe === 'K3') scen = c.id === 'K3-citra3-galaxy7' ? 'k3-citra-galaxy-apres-us-05' : 'k3-citra-idaho7-apres-us-05';
  if (c.groupe === 'K4') scen = 'k3-citra-idaho7-' + (m === 'dryPost' ? 'apres' : 'actif') + '-' + LEV[y];
  if (c.groupe === 'K5') scen = 'k5-citra-' + slug(c.ajouts[1].nom) + '-' + (m === 'dryPost' ? 'apres' : 'actif') + '-' + LEV[y];
  PLANS.push({
    id: c.id, groupe: c.groupe, type: t, titre: c.titre, m, y, ajouts: c.ajouts.map((a) => ({ nom: a.nom, dose: a.dose_gL, moment: a.moment, j0: a.jourDebut, jours: a.jours })),
    a: fam12(c.apres), d: Object.fromEntries(ORDRE.map((f) => [f, r2(c.delta[f].centre)])),
    jour: Object.fromEntries(ORDRE.map((f) => [f, (c.parJour || []).map((x) => [x.jourRecette, r2(x.familles[f][1])])])),
    sat: c.saturation && c.saturation.facteur ? c.saturation.facteur : null, dr: ids(c.drapeaux), c: c.confiance ? c.confiance.niveau : null, scen,
    ibu: (c.mesures || []).find((x) => x.type === 'ibu') ? (c.mesures || []).find((x) => x.type === 'ibu').plage : null,
  });
}
// Les dry hops seuls (K2, et Cascade en témoin), 4 g/L, 3 j, de grille[] : la courbe des premiers jours
// se lit dans les entrées à 1, 2 et 3 j.
const G = S.indexGrille();
const AV = S.AVANT;
for (const nom of ['Citra', 'Galaxy', 'Idaho 7', 'Cascade']) for (const m of ['dryPost', 'dryActive']) for (const y of ['fermentis-us05', 'lalbrew-pomona']) {
  const g = (j) => G[[nom, m, 4, j, y].join('|')];
  const g3 = g(3); if (!g3) continue;
  const j0 = m === 'dryPost' ? 7 : 2;
  PLANS.push({
    id: 'seul-' + slug(nom) + '-' + m + '-' + LEV[y], groupe: nom === 'Cascade' ? 'témoin' : 'K2', type: 'seul', titre: nom + ' 4 g/L, 3 j', m, y,
    ajouts: [{ nom, dose: 4, moment: m, j0, jours: 3 }], a: g3.a, d: g3.d,
    jour: Object.fromEntries(ORDRE.map((f) => [f, [[j0, AV[f][1]], [j0 + 1, g(1).a[f][1]], [j0 + 2, g(2).a[f][1]], [j0 + 3, g3.a[f][1]]]])),
    sat: null, dr: g3.dr, c: g3.c, scen: 'k2-' + slug(nom) + '-' + (m === 'dryPost' ? 'apres' : 'actif') + '-' + LEV[y],
  });
}
// Le calculé du moteur pour chaque plan (la bière entière) : par famille, [signal, marqueur, base commune].
const SCEN = Object.fromEntries(S.MOTEUR.scenarios.map((s) => [s.id, Object.fromEntries(ORDRE.map((f) => [f, s.f[f].s ? [s.f[f].s, s.f[f].m, s.f[f].bc] : [null, null, null, s.f[f].inc]]))]));
const besoin = new Set(PLANS.map((p) => p.scen).filter(Boolean));
for (const k of Object.keys(SCEN)) if (!besoin.has(k)) delete SCEN[k];

// ---------- la page ----------
const fam = (f) => `<button type="button" class="fa" role="radio" data-role="famille" data-f="${f}" aria-checked="false" style="--f:${J[f].fond};--b:${J[f].base};--t:${J[f].texte}">${picto(f, 18)}<span>${COURT[f]}</span></button>`;
const ORDRE_E3 = ['tropical', 'citrus', 'floral', 'berries', 'stoneFruit', 'resin', 'herbal', 'green', 'spice', 'melon', 'pomeFruit', 'earthy'];
const hopsDuLot = ['Citra', 'Galaxy', 'Idaho 7', 'Cascade'];
const corps = `
  <header class="barre">
    <a class="retour" href="#" aria-label="Retour">${ico('i-chev-l', 16)}</a>
    <h1 class="ti">Plans de dry hop</h1>
    <span class="sty" data-nature="mesure" data-source="BJCP 2021, 16D (H39)" aria-label="Style 16D : arôme de houblon faible et facultatif, terreux, herbacé ou floral (BJCP 2021)">16D</span>
    <button class="leg-b" data-role="legende-bouton" aria-expanded="false" aria-controls="legende" aria-label="Légende des plans">${ico('i-aide', 18)}</button>
  </header>
  <div class="outils">
    <div class="seg lentille" role="radiogroup" aria-label="Lecture des familles"><button role="radio" data-e="style" aria-checked="true">Au style</button><button role="radio" data-e="absolu" aria-checked="false">Absolu</button></div>
    <div class="seg vue" role="radiogroup" aria-label="Les plans"><button role="radio" data-vue="dry" aria-checked="true">dry hop</button><button role="radio" data-vue="K1" aria-checked="false">moments</button></div>
  </div>
  <div class="fams" role="radiogroup" aria-label="Famille">${ORDRE_E3.map(fam).join('')}</div>
  <div class="hl" aria-label="Les houblons des plans">${hopsDuLot.map((n) => { const h = S.HOPS[n]; return `<span class="hl-h" data-voie="${n}" data-role="ligne-houblon">${S.nomHTML(h)}${S.stockHTML(h)}${S.alphaHTML(h)}</span>`; }).join('')}</div>
  <div class="regs" id="regs" aria-label="Réglages des plans"></div>
  <div id="pq"></div>
  <section class="sim" data-role="simulation" aria-label="Les plans classés, estimé">
    <div class="lad-h" id="lad-t"></div>
    <div class="plans" id="plans"></div>
    <div id="absents"></div>
  </section>
  ${S.legende(`
    <div class="leg-s"><h3>Les plans</h3><div class="leg-g l1">
      <span class="leg-i"><span class="leg-c"><span class="ty seul">seul</span></span><span>un houblon, 4 g/L</span></span>
      <span class="leg-i"><span class="leg-c"><span class="ty successifs">puis</span></span><span>deux dry hops l’un après l’autre, 2 + 2 g/L</span></span>
      <span class="leg-i"><span class="leg-c"><span class="ty ensemble">ensemble</span></span><span>deux houblons dans le même dry hop, 2 + 2 g/L</span></span>
      <span class="leg-i"><span class="leg-c"><span class="tl-ex"><i></i></span></span><span>chronologie : jours de contact (J+n de fermentation) et courbe ~ simulée</span></span>
      <span class="leg-i"><span class="leg-c"><b>sage · franc · osé</b></span><span>l’audace face à la 16D : dedans, en haut, au-dessus ; jamais une note</span></span>
    </div></div>`)}`;

const CSS = `
  .ti { font-size: 16px; font-weight: 700; flex: 1; min-width: 0; white-space: nowrap; }
  .sty { height: 22px; padding: 0 8px; border-radius: 11px; background: #fff; box-shadow: inset 0 0 0 1px rgba(22,22,26,.12); font: 600 12px var(--sans); display: inline-flex; align-items: center; color: var(--encre); }
  .hl { display: flex; gap: 4px 10px; flex-wrap: wrap; padding: 0 2px; font-size: 13px; }
  .hl-h { display: inline-flex; align-items: center; gap: 4px; }
  .rg.on { background: var(--encre); color: #fff; }
  #pq { display: flex; flex-direction: column; gap: 3px; padding: 0 2px; }
  .sim { display: flex; flex-direction: column; gap: 4px; }
  .lad-h { display: flex; align-items: center; gap: 6px; min-height: 24px; font-size: 12px; padding: 0 2px; flex-wrap: wrap; }
  .lad-tt { display: inline-flex; align-items: center; gap: 4px; font-weight: 600; }
  .trou { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--encre); }
  .trou .hach { width: 26px; height: 12px; }
  .plans { display: flex; flex-direction: column; gap: 4px; }
  .pal { display: flex; align-items: baseline; gap: 6px; padding: 6px 2px 0; }
  .pal b { font-size: 15px; font-weight: 700; }
  .pal span { font-size: 12px; color: var(--gris); }
  .pal.ose b { color: var(--acc); }
  .pl-c { position: relative; display: grid; grid-template-columns: 26px minmax(0, 1fr) 16px; gap: 3px 6px; padding: 5px 2px 6px 4px; background: #fff; border-radius: 8px; box-shadow: var(--ombre); cursor: pointer; }
  .pl-c.ose::before { content: ''; position: absolute; left: 0; top: 8px; bottom: 8px; width: 3px; border-radius: 0 2px 2px 0; background: var(--acc); }
  body.abs .pl-c.ose::before { display: none; }
  .pl-r { grid-row: 1 / 6; display: inline-flex; align-items: baseline; justify-content: center; font-size: 14px; padding-top: 2px; }
  .pl-r i { font-style: normal; font-weight: 700; font-size: 12px; color: var(--gris); margin-left: 1px; }
  .pl-t { grid-column: 2; display: flex; align-items: center; gap: 4px 6px; flex-wrap: wrap; font-size: 14px; }
  .pl-t .ve { margin-left: auto; }
  .pl-p { grid-column: 3; grid-row: 1 / 6; width: 16px; display: inline-flex; align-items: center; justify-content: center; color: var(--gris); }
  .ty { display: inline-flex; align-items: center; height: 18px; padding: 0 7px; border-radius: 9px; font-size: 12px; font-weight: 700; white-space: nowrap; }
  .ty.seul { background: #ececf1; color: var(--encre); }
  .ty.successifs { background: #fff; color: var(--encre); box-shadow: inset 0 0 0 1.5px var(--encre); }
  .ty.ensemble { background: var(--encre); color: #fff; }
  .ty.moment { background: #fff; color: var(--encre); box-shadow: inset 0 0 0 1px #9a9aa6; }
  .ajn { display: inline-flex; align-items: center; gap: 3px; flex-wrap: wrap; }
  .ajn .pl { color: var(--gris); font-weight: 600; }
  .ajn .q { font: 500 12px var(--mono); color: var(--gris); }
  .ajn .mo-t { font-size: 13px; font-weight: 700; }
  .tl { grid-column: 2; position: relative; height: 30px; }
  .tl::before { content: ''; position: absolute; left: 0; right: 0; bottom: 4px; height: 1px; background: #c4c6ce; }
  .tl-b { font-style: normal; position: absolute; bottom: 0; height: 12px; border-radius: 2px; background: #3d3d47; color: #fff; font-size: 12px; font-weight: 600; line-height: 12px; padding: 0 3px; white-space: nowrap; overflow: hidden; text-overflow: clip; }
  .tl-b.b2 { background: #fff; color: var(--encre); box-shadow: inset 0 0 0 1.5px #3d3d47; }
  .tl-b.ens { bottom: 13px; }
  .tl svg { position: absolute; left: 0; top: 0; width: 100%; height: 16px; overflow: visible; }
  .tl-j { position: absolute; bottom: -1px; font: 500 12px var(--mono); color: var(--gris); transform: translateX(-50%); display: none; }
  .tl-m { position: absolute; top: 0; bottom: 0; width: 0; border-left: 1px dashed #9a9aa6; }
  .pl-e { grid-column: 2; display: flex; align-items: center; gap: 6px; }
  .pl-e .pe { flex: 1; width: auto; }
  .pl-e .k { font-size: 12px; color: var(--gris); white-space: nowrap; width: 52px; flex: none; }
  .pl-k { grid-column: 2; display: grid; grid-template-columns: 58px minmax(0, 1fr); align-items: end; gap: 6px; }
  .pl-k .k { display: flex; flex-direction: column; align-items: flex-start; gap: 1px; font-size: 12px; color: var(--gris); padding-bottom: 2px; }
  .pl-k .km { display: inline-flex; align-items: center; gap: 2px; color: var(--encre); white-space: nowrap; }
  .pl-k .ll { height: 30px; }
  .pl-k .ll::before { top: 18px; } .pl-k .ll-t { top: 15px; } .pl-k .ll-b { top: 16px; } .pl-k .ll-c { top: 12px; } .pl-k .ll-inc { top: 12px; }
  .pl-e .k { width: 58px; }
  .pl-k .ll-inc { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; line-height: 14px; padding-top: 1px; }
  .pl-k .ll-inc .hach { vertical-align: middle; margin-right: 4px; }
  .mm { grid-column: 2; position: relative; display: flex; justify-content: space-between; padding: 2px 0; }
  .mm::before { content: ''; position: absolute; left: 6px; right: 6px; top: 8px; height: 2px; background: #c4c6ce; }
  .mm-i { position: relative; display: inline-flex; flex-direction: column; align-items: center; gap: 1px; font-size: 12px; color: var(--gris); min-width: 0; }
  .mm-i i { width: 10px; height: 10px; border-radius: 50%; background: #fff; box-shadow: inset 0 0 0 2px #9a9aa6; }
  .mm-i.on { color: var(--encre); font-weight: 700; }
  .mm-i.on i { background: var(--encre); box-shadow: none; }
  .tl-ax { position: absolute; bottom: -12px; font: 500 12px var(--mono); color: var(--gris); transform: translateX(-50%); line-height: 12px; }
  .tl { margin-bottom: 10px; }
  .pl-d { grid-column: 2; display: flex; flex-wrap: wrap; gap: 3px; }
  .drp { font-size: 12px; padding: 1px 7px; border-radius: 9px; background: #ececf1; }
  .drp.inc { background: #fff; box-shadow: inset 0 0 0 1px #aeb3be; color: var(--gris); }
  .drp.xs { background: #fdf0ea; color: #9a3412; font-weight: 600; }
  .drp.sat { background: #fff; box-shadow: inset 0 0 0 1.5px var(--encre); font-weight: 600; }
  .bio > span { font-size: 12px; font-weight: 600; margin-left: 2px; }
  .pe-z { background: var(--zf, #f3e8f7) !important; }
  .pe.large { width: 100%; height: 18px; }
  .pe.large::before { top: 7px; }
  .pe.large .pe-b, .pe.large .pe-x { top: 5px; height: 8px; }
  #absents { font-size: 12px; color: var(--gris); display: flex; flex-direction: column; gap: 3px; padding: 4px 2px; }
  #absents p { display: flex; gap: 6px; align-items: center; }
  .tl-ex { position: relative; display: inline-block; width: 34px; height: 12px; }
  .tl-ex i { position: absolute; left: 4px; bottom: 0; width: 14px; height: 6px; background: #3d3d47; border-radius: 2px; }
  .pr-dr { display: flex; flex-wrap: wrap; gap: 4px; }
  .jr { display: grid; grid-template-columns: repeat(var(--n), 1fr); gap: 2px; align-items: end; height: 60px; }
  .jr i { background: var(--b); border-radius: 2px 2px 0 0; min-height: 2px; }
  .jr-l { display: grid; grid-template-columns: repeat(var(--n), 1fr); gap: 2px; font: 500 12px var(--mono); color: var(--gris); text-align: center; }
`;
const donnees = { ...S.donneesCommunes(), PLANS, SCEN, defaut: { fam: 'tropical' } };
const page = S.page({
  titre: 'Plans de dry hop',
  commentaire: 'Lot 21 · e3 : le ladder des scénarios K2, K3, K4, K5 (et K1 en seconde vue), en paliers sage / franc / osé face à la 16D. Généré par e3/generateur-e3.mjs (../e1/socle-e.mjs, ../e1/runtime-commun.js, runtime-e3.js).',
  css: CSS, corps, donnees, script: RT,
});
S.ecrire(path.join(ici, 'etat.html'), page);
console.log(PLANS.length, 'plans ;', Object.keys(SCEN).length, 'scénarios du moteur');
