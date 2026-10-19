// Lot 21 · x3b · « Ma cuve, jour après jour », seconde passe (retenue par le critique ; x3 reste intacte).
// Ce qui change par rapport à x3 :
//   - la frise est en haut, et son geste est au premier écran : les blocs d'ajout se glissent sur les jours et
//     s'étirent par leur bord droit, aimantés aux cas que le moteur simule (et l'aimant se dit) ; glisser le
//     second houblon sur le jour du premier, c'est « ensemble » ; le laisser trois jours plus loin, « à la suite » ;
//     glissé avant J6, l'ajout tombe en fermentation active, et la levure compte ;
//   - on tient « tenir » : les jours passent, et « depuis hier » s'écrit en bulle (y2) ;
//   - un verdict en tête, en une ligne (« Faisable, mais Idaho 7 reste 2 j sans gain mesuré ; … », u2) ;
//   - les repères mesurés sur la barre de contact : 24 h, 2 j, 3 j, puis « sans gain mesuré » hachuré (v3) ;
//   - les rubans en marches, jour par jour : le plateau dès 24 h se voit (r2) ;
//   - « à la suite : plus tard, pas plus » quand la suite a son pendant ensemble (a6) ;
//   - les scénarios en une ligne repliable ; l'état de départ en fermentation active avec US-05 ;
//   - les barres du jour : la plage en pâle, une seule marque de borne haute partielle, le résineux de la
//     dégustation une fois, hors de la figure ;
//   - trois blocs à un toucher : ton défi (x5), « Tire une bière » (y5), la preuve (u5).
// Profil : donnees/profils-simules.json (moteur profil-simule, 4,75 % vol.) ; vraies valeurs : x1/valeurs-reelles.json,
// donnees/comparatifs-dryhop.json (E04 relu, lecture H vérifiée par K).
// Usage : node generateur-x3b.mjs  →  x3b/etat.html
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as S from '../x1/socle-x.mjs';
import { DUREE, TROUS, IBU_BIERE, BIERE } from '../x1/donnees-reelles.mjs';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const { HB, ORDRE, NOM, COURT, JET, picto, ic, hn, alpha, usage, stock, pt, lentille, legende, page, ecrire, esc } = S;
const HOPS = ['citra', 'cascade', 'galaxy', 'idaho7'];
const RUB = ['citrus', 'tropical', 'berries', 'floral', 'green'];
const BARS = ORDRE.filter((f) => f !== 'resin');
const pack = (p) => ORDRE.flatMap((f) => [p[f].bas, p[f].centre, p[f].haut, p[f].hp ? 1 : 0]);
// Les cas du moteur à deux houblons (suite K3, K4 ; ensemble K5), avec leur jour par jour.
const CAS = {};
for (const c of S.CAS.filter((x) => ['K3', 'K4', 'K5'].includes(x.groupe))) {
  const a = c.ajoutsX, autre = a.find((x) => x.h !== 'citra').h, arr = a[0].jourDebut === a[1].jourDebut ? 'ensemble' : 'suite';
  const k = [arr, autre, a[0].moment, c.levureX].join('|');
  if (CAS[k]) continue; // K3-citra3-idaho7-5 = K4-us05-apres
  CAS[k] = { id: c.id, j0: c.parJour[0].jourRecette, ajouts: a.map((x) => ({ h: x.h, dose: x.dose, start: x.jourDebut, jours: x.jours })), jours: c.parJour.map((j) => pack(Object.fromEntries(ORDRE.map((f) => [f, { ...j.profil[f], hp: c.apres[f].hp }])))),
    sat: c.saturation && c.saturation.facteur ? c.saturation.facteur.citrus : null, confiance: c.confiance && c.confiance.niveau,
    bio: c.biotransformation && c.biotransformation.actif ? (c.biotransformation.parAjout || []).map((x) => x.citronellol_ugL).filter(Boolean).reduce((t, x) => [t[0] + x.bas, t[1] + x.centre, t[2] + x.haut], [0, 0, 0]) : null };
}
// Les houblons seuls : la grille du moteur à 4 g/L (jours 1, 2, 3, 5, 7 ; US-05 et Pomona) ; le jour par jour s'en lit
// (le moteur arrête l'extraction à 3 j : la grille est plate au-delà).
const G = S.grilleCompacte({ cumul: false });
const SEUL = {};
for (const h of HOPS) for (const m of ['dryActive', 'dryPost']) for (const lv of ['us05', 'pomona']) for (const j of [1, 2, 3, 5, 7]) { const k = [h, m, 4, j, lv].join('|'); if (G[k]) SEUL[[h, m, lv, j].join('|')] = G[k]; }
const AV = pack(S.AVANT);
// Les vraies valeurs.
const CMP = S.CMP, E = (id) => CMP.etudes.find((e) => e.id === id);
const e04 = E('E04'), L = (desc, d) => e04.mesures.find((m) => (m.descripteur || '').startsWith(desc) && m.dose_gL === d).valeur;
const VERIF = JSON.parse(fs.readFileSync(path.join(S.LOT, '../fils19-choix/donnees/verifications.json'), 'utf8'));
const e06 = E('E06'), cit = e06.mesures.find((m) => m.variete === 'Citra' && m.compose === 'linalol'), tem = e06.mesures.find((m) => /témoin/.test(m.variete) && m.compose === 'linalol');
const REPERES = [
  { j: 1, t: '1', src: S.refCourte(E('E10')) + ' (1 h = 96 h au nez) ; Wolfe 2012 [73] (l’essentiel en 24 h)' },
  { j: 2, t: '2', src: S.refCourte(E('E08')) + ' (transfert majeur en 2 j) ; Schmidt 2019 [92] (4MMP les deux premiers jours)' },
  { j: 3, t: '3', src: 'Wolfe 2012 [73] : au-delà, aucun gain d’arôme mesuré' },
];
const PREUVE = {
  mesures: [
    ['floral', 'Citra en dry hop : linalol ' + S.fr(cit.valeur) + ' µg/L (témoin ' + S.fr(tem.valeur) + ')', S.refCourte(e06) + ', ' + cit.lecture, 'mesuré', 'dose non indiquée ; le moteur place son centre 2 à 5 fois plus haut'],
    ['citrus', 'Cascade 2 → 8 → 16 g/L, 24 h : agrumes ' + S.fr(L('citrus', 2)) + ' → ' + S.fr(L('citrus', 8)) + ' → ' + S.fr(L('citrus', 16)) + ' sur 15 ; herbacé ' + S.fr(L('herbal', 2)) + ' → ' + S.fr(L('herbal', 16)), S.refCourte(e04) + ', tableau 3', 'panel', 'lecture H, vérifié (K) : les agrumes plafonnent, l’herbacé monte'],
    [null, 'contacts de 1 à 8 j : l’essentiel en 2 j', S.refCourte(E('E08')), 'mesuré', 'Eureka!, 2,5 g/L, à −1 °C'],
    [null, '1 h et 96 h : pas de différence perçue', S.refCourte(E('E10')), 'panel', 'Cascade 1,43 g/L, bière jeune'],
    ['floral', 'Idaho 7 au pitch : linalol 38 µg/L', S.refCourte(E('E03')), 'mesuré', 'pas un dry hop ; tableau aplati : à vérifier'],
  ],
  verifs: VERIF.verifications.map((v) => ({ t: v.texte, c: (v.calcul.min == null ? '?' : S.fr(v.calcul.min)) + '–' + S.fr(v.calcul.max) + ' ' + v.unite, ok: /encadre|tombe|sous la borne/.test(v.verdict), verdict: v.verdict, src: v.sources.join(', ') })),
  trous: TROUS,
};
const PLANS = [
  ...HOPS.map((h) => ({ id: h, hops: [h], arr: 'seul', t: HB[h].nom + ' seul' })),
  { id: 'suite-galaxy', hops: ['citra', 'galaxy'], arr: 'suite', t: 'Citra 3 j, puis Galaxy 7 j' },
  { id: 'suite-idaho7', hops: ['citra', 'idaho7'], arr: 'suite', t: 'Citra 3 j, puis Idaho 7 5 j' },
  ...['galaxy', 'idaho7', 'cascade'].map((k) => ({ id: 'ens-' + k, hops: ['citra', k], arr: 'ensemble', t: 'Citra + ' + HB[k].nom + ' ensemble' })),
];
const DEF = { plan: 'suite-idaho7', start: 2, jours: [3, 5], lv: 'us05', jour: 4 };
const cartes = Object.fromEntries(HOPS.map((k) => [k, `${pt(k)}${hn(k)}${alpha(k)}${usage(k)}${stock(k, 2)}`]));
const corps = `
  <header class="tete"><h1>Ma cuve, jour après jour</h1>${lentille()}${legende([
    [picto('citrus', 16) + picto('tropical', 16), 'les familles d’arômes, au trait'],
    ['<span class="lg-blk">3 j</span>', 'un ajout : glisse-le sur les jours, étire son bord'],
    ['<span class="lg-hz"></span>', 'au-delà de 3 j de contact : sans gain mesuré'],
    ['<span class="vs">~</span>', 'simulé par le moteur, jamais mesuré'],
    ['<span class="leg-zone"></span>', 'pâle : la zone de la 16D ; l’orangé au-delà'],
    ['<span class="lg-pl"></span>', 'la plage du simulé ; ▲ : borne haute non publiée'],
    ['<span class="mot-c mot-mesuré">mesuré</span>', 'une vraie valeur, avec sa source'],
    ['appui long', 'sur un houblon : sa fiche'],
  ])}</header>
  <div class="ligne1">
    <button class="scen" data-role="reglage" data-reglage="scenario" aria-expanded="false" aria-controls="plans"><span data-role="scen-t"></span>${ic('chev-r', 12)}</button>
    <span class="seg rg seg-lv" role="radiogroup" aria-label="Levure" data-role="levures">${[['us05', 'US-05'], ['verdant', 'Verdant'], ['pomona', 'Pomona'], ['diamond', 'Diamond']].map(([k, t]) => `<button role="radio" data-role="reglage" data-reglage="levure" data-v="${k}" aria-checked="${k === DEF.lv}">${t}</button>`).join('')}</span><span class="lv-n" data-role="lv-non"></span>
  </div>
  <div class="plans" id="plans" hidden>${PLANS.map((p) => `<button class="pl" data-role="reglage" data-reglage="plan" data-v="${p.id}" ${p.arr === 'ensemble' ? 'data-reglage-cumul="1"' : ''}>${p.t}</button>`).join('')}</div>
  <p class="verdict" data-role="verdict" aria-live="polite"></p>
  <section class="frise" data-role="simulation" aria-label="La frise de la fermentation, simulée">
    <div class="fr-g" data-role="frise"><div data-role="fond"></div><div data-role="blocs"></div><div data-role="rubans"></div><i class="cur" data-role="cur"></i><span class="bulle" data-role="bulle" hidden></span></div>
    <div class="curseur"><button class="tenir" data-role="reglage" data-reglage="tenir" aria-label="Tenir : les jours passent">${ic('sablier', 14)}<span>tenir</span></button><input type="range" min="0" max="17" step="1" value="${DEF.jour}" data-role="reglage" data-reglage="jour" aria-label="Jour de fermentation"></div>
    <p class="aimant" data-role="aimant" aria-live="polite"></p>
  </section>
  <section class="lecture" data-role="simulation" aria-label="Ce que la cuve sent ce jour-là">
    <div class="lec-t" data-role="lec-t"></div>
    <div class="bars" data-role="barres">${BARS.map((f) => `<span class="br" data-col="${f}" data-famille="${f}"><span class="br-z"><i class="br-zone" data-role="zone" data-famille="${f}"></i><i class="br-pl"></i><i class="br-av"></i><i class="br-b" data-nature="simule"></i><i class="br-hp" aria-hidden="true"></i><span class="br-pts"></span></span>${picto(f, 14)}<span class="br-n">${COURT[f]}</span></span>`).join('')}</div>
    <p class="resine" data-role="resine"></p>
    <div class="tire"><button class="tb" data-role="reglage" data-reglage="tirer">${ic('biere', 14)}Tire une bière</button><button class="tb tb2" data-role="reglage" data-reglage="tirer20">20</button><span class="gris" data-role="tirage"></span></div>
  </section>
  <section class="ajouts" data-role="ajouts" aria-label="Les houblons du plan"></section>
  <p class="suite" data-role="suite"></p>
  <section class="vrai" aria-label="Les vraies valeurs de ce jour"><div class="vrai-t">vraies valeurs, ce jour-là</div><div data-role="vraies"></div></section>
  <div class="rp"><button class="rp-s" data-role="repli" aria-expanded="false" aria-controls="defi">${ic('cible', 14)}<span>Ton défi : ta dégustation du 18.10</span><svg class="chev" width="12" height="12" aria-hidden="true"><use href="#i-chev-r-12"/></svg></button><div class="preuve" id="defi" hidden data-role="defi"></div></div>
  <div class="rp"><button class="rp-s" data-role="repli" aria-expanded="false" aria-controls="preuve">${ic('livre', 14)}<span>La preuve : mesures, simulation, trous</span><svg class="chev" width="12" height="12" aria-hidden="true"><use href="#i-chev-r-12"/></svg></button><div class="preuve" id="preuve" hidden data-role="preuve"></div></div>`;

const css = `
  .ligne1 { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .scen { display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 10px 0 12px; border-radius: 16px; background: var(--encre); color: #fff; font-size: 13px; font-weight: 600; }
  .scen .ic { transform: rotate(90deg); color: #fff; }
  .scen[aria-expanded="true"] .ic { transform: rotate(-90deg); }
  .seg-lv button { padding: 0 8px; }
  .lv-n { font-size: 12px; color: var(--gris); }
  .plans { display: flex; flex-wrap: wrap; gap: 4px; }
  .pl { height: 30px; padding: 0 10px; border-radius: 15px; background: var(--piste); font-size: 12px; }
  .pl[aria-pressed="true"] { background: var(--encre); color: #fff; font-weight: 600; }
  .verdict { font-size: 15px; line-height: 1.35; min-height: 20px; }
  .verdict b { font-weight: 700; }
  .verdict .ok { color: #0f5c3a; }
  .frise { display: flex; flex-direction: column; gap: 2px; }
  .fr-g { position: relative; height: var(--fh, 300px); }
  .fr-g > div { position: absolute; inset: 0; }
  .fr-g [data-role="blocs"] { z-index: 3; pointer-events: none; }
  .fr-g [data-role="rubans"] { z-index: 2; pointer-events: none; }
  .lab { position: absolute; left: 0; width: 70px; font-size: 12px; line-height: 1.15; display: flex; align-items: center; gap: 3px; color: var(--t, var(--encre)); }
  .lab small { display: block; color: var(--gris); font-size: 12px; }
  .ax { position: absolute; top: 0; transform: translateX(-50%); font: 500 12px/14px var(--mono); color: var(--gris); }
  .ax-t { position: absolute; top: 0; left: 0; font-size: 12px; color: var(--gris); }
  .lane { position: absolute; height: 20px; border-radius: 4px; display: flex; align-items: center; padding: 0 5px; font-size: 12px; white-space: nowrap; overflow: hidden; }
  .lane.lev-a { background: #efe6f7; color: #4b2a66; } .lane.lev-r { background: var(--doux); color: var(--gris); }
  .blk { position: absolute; height: 22px; border-radius: 4px; color: #fff; font-size: 12px; font-weight: 600; display: flex; align-items: center; padding: 0 4px; white-space: nowrap; pointer-events: auto; touch-action: none; cursor: grab; z-index: 3; }
  .blk.prise { box-shadow: 0 0 0 2px #fff, 0 0 0 4px var(--encre); cursor: grabbing; }
  .blk .hz { position: absolute; top: 0; bottom: 0; right: 0; background: repeating-linear-gradient(135deg, rgba(255,255,255,.8) 0 2px, transparent 2px 5px); border-radius: 0 4px 4px 0; }
  .blk .tk { position: absolute; top: 3px; bottom: 3px; width: 0; border-left: 1.5px solid rgba(255,255,255,.9); }
  .blk .poi { position: absolute; right: -10px; top: -6px; width: 24px; height: 34px; display: flex; align-items: center; justify-content: center; touch-action: none; cursor: ew-resize; }
  .blk .poi i { width: 6px; height: 18px; border-radius: 3px; background: #fff; box-shadow: 0 0 0 1.5px var(--encre); }
  .rep { position: absolute; font: 500 12px/14px var(--mono); color: var(--encre); white-space: nowrap; transform: translateX(-50%); }
  .rep.sg { transform: none; font-family: var(--sans); color: var(--gris); }
  .bio-m { position: absolute; font-size: 12px; white-space: nowrap; display: inline-flex; align-items: center; gap: 2px; background: #fff; padding: 0 3px; border-radius: 4px; box-shadow: 0 0 0 1px #c9b3dd; }
  .rub { position: absolute; overflow: visible; }
  .cur { position: absolute; width: 0; border-left: 2px solid var(--encre); z-index: 5; pointer-events: none; }
  .cur::before { content: attr(data-j); position: absolute; bottom: -16px; left: -18px; width: 36px; text-align: center; font: 600 12px var(--mono); background: var(--encre); color: #fff; border-radius: 4px; }
  .bulle { position: absolute; z-index: 6; max-width: 200px; background: var(--encre); color: #fff; font-size: 12px; line-height: 1.3; padding: 4px 8px; border-radius: 8px; pointer-events: none; }
  .bulle .vs { color: #fff; font-family: var(--sans); font-weight: 600; }
  .curseur { display: flex; align-items: center; gap: 6px; padding-left: 0; }
  .curseur input { flex: 1; height: 32px; accent-color: #16161a; touch-action: none; margin-left: 4px; }
  .tenir { display: inline-flex; align-items: center; gap: 4px; height: 32px; padding: 0 10px; border-radius: 16px; box-shadow: inset 0 0 0 1.5px var(--encre); font-size: 12px; font-weight: 600; touch-action: none; -webkit-user-select: none; user-select: none; }
  .tenir[aria-pressed="true"] { background: var(--encre); color: #fff; }
  .aimant { font-size: 12px; color: var(--gris); min-height: 15px; }
  .lecture { display: flex; flex-direction: column; gap: 6px; border-top: 1px solid var(--trait); padding-top: 6px; }
  .lec-t { display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap; font-size: 13px; }
  .lec-t b { font-size: 15px; }
  .bars { display: flex; justify-content: space-between; align-items: flex-start; gap: 2px; padding-top: 4px; }
  .br { display: inline-flex; flex-direction: column; align-items: center; gap: 3px; flex: 1; min-width: 0; }
  .br-z { position: relative; width: 16px; height: 70px; }
  body.abs .br-z { height: 70px; }
  .br-z::after { content: ''; position: absolute; left: -3px; right: -3px; bottom: 0; height: 1px; background: var(--trait2); }
  .br-zone { position: absolute; left: -2px; right: -2px; bottom: 0; height: var(--zs); border-top: 1.5px solid var(--t); }
  .br-pl { position: absolute; left: 3px; right: 3px; bottom: var(--b0); height: calc(var(--b1) - var(--b0)); background: color-mix(in srgb, var(--b) 22%, transparent); border-radius: 2px; }
  .br-b { position: absolute; left: 4px; right: 4px; bottom: 0; height: var(--s); background: linear-gradient(to top, var(--b) 0, var(--b) var(--zs), var(--acc) var(--zs)); border-radius: 2px 2px 0 0; transition: height .2s; }
  .br:not(.hors) .br-b { background: var(--b); }
  .br-av { position: absolute; left: -2px; right: -2px; bottom: var(--av); height: 0; border-top: 1.5px dashed #5b5b66; z-index: 2; }
  .br-hp { position: absolute; left: 50%; transform: translateX(-50%); top: calc(70px - var(--b1) - 7px); width: 0; height: 0; border: 4px solid transparent; border-bottom: 6px solid #5b5b66; border-top: 0; display: none; }
  .br.hp .br-hp, .br.ouv .br-hp { display: block; }
  .br.nul .br-b, .br.nul .br-pl { display: none; }
  .br.nul .br-z::before { content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 16px; background: repeating-linear-gradient(135deg, #fff 0 2px, #9aa0ab 2px 3.5px); box-shadow: inset 0 0 0 1px #8a909b; border-radius: 2px; }
  .br-pts i { position: absolute; left: 50%; width: 5px; height: 5px; margin-left: -2.5px; border-radius: 50%; background: var(--encre); z-index: 3; }
  .br-pts i.x { background: var(--acc); }
  .br-n { font-size: 12px; line-height: 1; color: var(--t); writing-mode: vertical-rl; transform: rotate(180deg); white-space: nowrap; }
  .resine { font-size: 12px; color: var(--gris); display: flex; align-items: center; gap: 4px; }
  .tire { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 12px; }
  .tb { display: inline-flex; align-items: center; gap: 4px; height: 30px; padding: 0 10px; border-radius: 15px; background: var(--piste); font-size: 12px; font-weight: 600; }
  .ajouts { display: flex; flex-direction: column; gap: 2px; border-top: 1px solid var(--trait); padding-top: 6px; }
  .aj { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; min-height: 24px; }
  .vr-s { font-size: 12px; color: var(--gris); }
  .suite { font-size: 13px; }
  .suite svg { display: inline-block; vertical-align: -2px; }
  .vrai { display: flex; flex-direction: column; gap: 4px; border-top: 1px solid var(--trait); padding-top: 6px; }
  .vrai-t { font-size: 12px; font-weight: 600; color: var(--gris); }
  .vr { display: grid; grid-template-columns: 22px 1fr; align-items: center; column-gap: 6px; min-height: 26px; font-size: 13px; }
  .vr-l { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .defi-l { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .ob { display: flex; flex-direction: column; gap: 2px; padding: 6px; border-radius: 8px; background: #fff; font-size: 12px; }
  .ob b { font-size: 13px; display: inline-flex; align-items: center; gap: 4px; }
  .ob .st { font-weight: 600; } .ob.ok { box-shadow: inset 0 0 0 2px #0f5c3a; } .ob.ok .st { color: #0f5c3a; } .ob.x { box-shadow: inset 0 0 0 2px var(--acc); } .ob.x .st { color: var(--acc); } .ob.imp { box-shadow: inset 0 0 0 1px var(--trait2); }
  .pv-t { font-weight: 600; margin-top: 4px; }
  .pv { display: grid; grid-template-columns: 18px 1fr; gap: 2px 6px; align-items: start; }
  .lg-blk { display: inline-block; background: #184078; color: #fff; font-size: 12px; padding: 0 4px; border-radius: 4px; }
  .lg-hz { display: inline-block; width: 24px; height: 12px; background: #184078 repeating-linear-gradient(135deg, rgba(255,255,255,.8) 0 2px, transparent 2px 5px); border-radius: 2px; }
  .lg-pl { display: inline-block; width: 10px; height: 18px; background: color-mix(in srgb, #d6a700 22%, transparent); border-radius: 2px; }
  .leg-zone { display: inline-block; width: 18px; height: 14px; border-top: 1.5px solid #856e0c; background: color-mix(in srgb, #d6a700 16%, transparent); }`;

const js = `
${S.JS_SIM}
const D = window.DONNEES, HBJ = D.houblons, NOMS = ${JSON.stringify(NOM)}, COURTS = ${JSON.stringify(COURT)}, O = ${JSON.stringify(ORDRE)}, RUB = ${JSON.stringify(RUB)}, BARS = ${JSON.stringify(BARS)};
const Z = SIMX.Z, AVP = (() => { const a = D.avant, p = {}; O.forEach((f, i) => { p[f] = { bas: a[4 * i], centre: a[4 * i + 1], haut: a[4 * i + 2], hp: !!a[4 * i + 3] }; }); return p; })();
const ST = ${JSON.stringify(DEF)}; ST.tir = 0;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const fr = (x) => String(Math.round(x * 10) / 10).replace('.', ',');
const picto = (f, z = 14) => '<svg class="pi" width="' + z + '" height="' + z + '" data-famille="' + f + '" role="img" aria-label="' + NOMS[f] + '"><use href="#p-' + f + '"/></svg>';
const ic = (k, z = 14) => '<svg class="ic" width="' + z + '" height="' + z + '" aria-hidden="true"><use href="#i-' + k + '-' + z + '"/></svg>';
const vrai = (t, src, mot, cls = 'vv') => '<span class="' + cls + '" data-nature="mesure" data-source="' + esc(src) + '">' + t + (mot ? '<span class="mot-c mot-' + mot + '">' + mot + '</span>' : '') + '</span>';
const inc = (t) => '<span class="inc" data-inconnu><i class="hach"></i>' + t + '</span>';
const unp = (a) => { const p = {}; O.forEach((f, i) => { p[f] = { bas: a[4 * i], centre: a[4 * i + 1], haut: a[4 * i + 2], hp: !!a[4 * i + 3] }; }); return p; };
const LVN = { us05: 'US-05', pomona: 'Pomona', verdant: 'Verdant', diamond: 'Diamond' };
const plan = (id = ST.plan) => D.plans.find((p) => p.id === id);
// ---------- l'aimant : du geste au cas simulé le plus proche, et le dire ----------
const JOURS_SEUL = [1, 2, 3, 5, 7];
function resoudre(s) {
  const P = plan(s.plan), msg = [];
  const actif = s.start < 6, m = actif ? 'dryActive' : 'dryPost', st = actif ? 2 : 7;
  if (Math.abs(s.start - st) > 0.01) msg.push('posé à J' + st + (actif ? ', en fermentation active' : ', après fermentation') + ' : le jour simulé');
  if (P.arr === 'seul') {
    const h = P.hops[0], j = JOURS_SEUL.reduce((b, x) => (Math.abs(x - s.jours[0]) < Math.abs(b - s.jours[0]) ? x : b), 3);
    if (j !== s.jours[0]) msg.push('simulé à ' + j + ' j');
    let lv = s.lv; if (!D.seul[[h, m, lv, j].join('|')]) { msg.push(LVN[lv] + ' : simulée seulement à deux houblons ; lu avec US-05'); lv = 'us05'; }
    const jours = []; for (let t = 0; t <= 11; t++) { const jj = t === 0 ? 0 : Math.max(...JOURS_SEUL.filter((x) => x <= Math.min(t, j))); jours.push(t === 0 ? D.avant : D.seul[[h, m, lv, jj].join('|')]); }
    return { cle: [h, m, lv, j].join('|'), ajouts: [{ h, dose: 4, start: st, jours: j }], j0: st, jours, lv, m, msg, conf: ['galaxy', 'idaho7'].includes(h) ? 'faible' : 'moyenne', bio: null, sat: null, src: 'moteur, grille' };
  }
  const autre = P.hops[1];
  const essais = [[P.arr, m, s.lv], [P.arr, m, 'us05'], [P.arr, actif ? 'dryPost' : 'dryActive', s.lv], [P.arr, actif ? 'dryPost' : 'dryActive', 'us05'], [P.arr === 'suite' ? 'ensemble' : 'suite', m, s.lv], [P.arr === 'suite' ? 'ensemble' : 'suite', m, 'us05']];
  for (const [arr, mm, lv] of essais) {
    const C = D.cas[[arr, autre, mm, lv].join('|')]; if (!C) continue;
    if (arr !== P.arr) msg.push((P.arr === 'suite' ? 'à la suite' : 'ensemble') + ' : pas simulé pour ' + HBJ[autre].nom + ' ; lu ' + (arr === 'suite' ? 'à la suite' : 'ensemble'));
    if (mm !== m) msg.push('simulé ' + (mm === 'dryActive' ? 'en fermentation active' : 'après fermentation') + ' seulement');
    if (lv !== s.lv) msg.push(LVN[s.lv] + ' : pas simulée ici ; lu avec ' + LVN[lv]);
    const jf = C.ajouts.map((a) => a.jours); if (s.jours.some((x, i) => i < jf.length && x !== jf[i])) msg.push('simulé à ' + jf.join(' j et ') + ' j seulement');
    return { cle: [arr, autre, mm, lv].join('|'), ajouts: C.ajouts, j0: C.j0, jours: C.jours, lv, m: mm, msg: msg.filter((x, i, xs) => xs.indexOf(x) === i), conf: C.confiance, bio: C.bio, sat: C.sat, src: 'moteur, cas ' + C.id, arr };
  }
  return null;
}
const jourP = (R, j) => { const i = j - R.j0; return unp(i < 0 ? D.avant : R.jours[Math.min(R.jours.length - 1, i)]); };
const finP = (R) => unp(R.jours[R.jours.length - 1]);
const horsF = (p) => O.filter((f) => AVP[f].centre <= Z[f].bande[1] && p[f].centre > Z[f].bande[1]);
// ---------- la frise ----------
const NJ = 17, LW = 70;
let R = null, GEO = null;
function geo() { const W = document.querySelector('.fr-g').clientWidth - LW; return { W, x: (j) => LW + j / NJ * W, px: W / NJ }; }
const ROWS = (n) => { let y = 18; const r = { axe: 0, lev: y }; y += 26; if (R && R.bio) { r.bio = y; y += 24; } r.blocs = []; for (let i = 0; i < n; i++) { r.blocs.push(y); y += 40; } r.rub = y; y += RUB.length * 34; r.fin = y + 18; return r; };
function fond() {
  const g = GEO, Y = ROWS(R.ajouts.length);
  let h = '<span class="ax-t">jour</span>' + [0, 6, 12].map((j) => '<span class="ax" style="left:' + g.x(j) + 'px">' + j + '</span>').join('');
  h += '<span class="lab" style="top:' + Y.lev + 'px;height:20px">' + ic('levure', 14) + 'levure</span><span class="lane lev-a" style="top:' + Y.lev + 'px;left:' + g.x(0) + 'px;width:' + (g.x(6) - g.x(0) - 2) + 'px">active</span><span class="lane lev-r" style="top:' + Y.lev + 'px;left:' + g.x(6) + 'px;width:' + (g.x(NJ) - g.x(6)) + 'px">au repos</span>';
  if (R.bio) h += '<span class="lab" style="top:' + Y.bio + 'px;height:20px">' + ic('etincelle', 14) + 'biotransfo</span><span class="bio-m" data-role="biotransformation" style="top:' + Y.bio + 'px;left:' + g.x(R.j0) + 'px">' + picto('floral', 12) + ic('fleche', 12) + picto('citrus', 12) + (R.lv === 'pomona' ? '<span data-nature="simule">~' + Math.round(R.bio[1]) + ' µg/L citronellol</span>' : '<span>citronellol <span data-nature="simule">~0–' + Math.round(R.bio[2]) + ' µg/L</span> ' + inc('non publié') + '</span>') + '</span>';
  R.ajouts.forEach((a, i) => { const y = Y.blocs[i]; h += '<span class="lab" style="top:' + y + 'px;height:22px" data-houblon="' + HBJ[a.h].nom + '">' + D.points[a.h] + '<span>' + HBJ[a.h].nom + '<small>' + a.dose + ' g/L</small></span></span>';
    // les repères mesurés sous la barre (v3) : 24 h, 2 j, 3 j, puis « sans gain mesuré »
    if (i === 0) h += D.reperes.filter((r) => r.j <= a.jours).map((r) => '<span class="rep" style="top:' + (y + 24) + 'px;left:' + (g.x(a.start + r.j) - 1) + 'px" data-nature="mesure" data-source="' + esc(r.src) + '">' + r.t + '</span>').join('');
    if (a.jours > 3) h += '<span class="rep sg" style="top:' + (y + 24) + 'px;left:' + Math.min(g.x(a.start + 3) + 14, g.x(NJ) - 96) + 'px">+' + (a.jours - 3) + ' j sans gain</span>'; });
  RUB.forEach((f, i) => { const y = Y.rub + i * 34; h += '<span class="lab" style="top:' + y + 'px;height:30px" data-famille="' + f + '">' + picto(f, 14) + COURTS[f] + '</span>'; });
  document.querySelector('.fr-g').style.setProperty('--fh', Y.fin + 'px');
  document.querySelector('[data-role="fond"]').innerHTML = h;
}
function blocs(prev) {
  const g = GEO, Y = ROWS(R.ajouts.length), A = prev || R.ajouts;
  document.querySelector('[data-role="blocs"]').innerHTML = A.map((a, i) => { const w = a.jours * g.px, w3 = a.jours > 3 ? (a.jours - 3) * g.px : 0;
    return '<span class="blk" data-i="' + i + '" data-houblon="' + HBJ[a.h].nom + '" data-couleur="' + HBJ[a.h].couleur + '" style="top:' + Y.blocs[i] + 'px;left:' + g.x(a.start) + 'px;width:' + w + 'px;background:' + HBJ[a.h].couleur + '" aria-label="' + HBJ[a.h].nom + ', ' + a.jours + ' jours de contact dès J' + a.start + ' : glisse ou étire">' + a.jours + ' j'
      + [1, 2, 3].filter((r) => r < a.jours).map((r) => '<i class="tk" style="left:' + (r * g.px) + 'px"></i>').join('') + (w3 ? '<i class="hz" style="width:' + w3 + 'px"></i>' : '') + '<span class="poi" data-poi="' + i + '" aria-hidden="true"><i></i></span></span>'; }).join('');
}
function rubans(Rx) {
  const g = GEO, Y = ROWS(Rx.ajouts.length), abs = document.body.classList.contains('abs'), H = 30, cap = 4.6;
  let h = '';
  RUB.forEach((f, i) => {
    const y0 = Y.rub + i * 34, cr = Z[f].cran, yv = (v) => H - (abs ? Math.min(100, v) / 100 * H : Math.min(cap, v / cr) * (H / cap));
    const pl = abs ? yv(Z[f].bande[1]) : yv(Z[f].bande[1]);
    let d = '', db = '';
    for (let j = 0; j <= NJ; j++) { const v = jourP(Rx, j)[f], x0 = g.x(j) - LW, x1 = g.x(Math.min(NJ, j + 1)) - LW; d += (j ? 'L' : 'M') + x0.toFixed(1) + ',' + yv(v.centre).toFixed(1) + 'L' + x1.toFixed(1) + ',' + yv(v.centre).toFixed(1); db += (j ? 'L' : 'M') + x0.toFixed(1) + ',' + yv(v.bas).toFixed(1) + 'L' + x1.toFixed(1) + ',' + yv(v.bas).toFixed(1); }
    const W = g.W, aire = d + 'L' + W + ',' + H + 'L0,' + H + 'Z', id = 'r' + f;
    h += '<svg class="rub" style="left:' + LW + 'px;top:' + y0 + 'px" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" data-famille="' + f + '" role="img" aria-label="' + NOMS[f] + ', jour par jour, simulé">'
      + '<defs><clipPath id="' + id + 'b"><rect x="0" y="' + pl + '" width="' + W + '" height="' + (H - pl) + '"/></clipPath><clipPath id="' + id + 'h"><rect x="0" y="0" width="' + W + '" height="' + pl + '"/></clipPath></defs>'
      + '<rect x="0" y="' + pl + '" width="' + W + '" height="' + (H - pl) + '" fill="var(--f)" data-role="zone"/>'
      + '<path d="' + aire + '" fill="var(--b)" clip-path="url(#' + id + 'b)" data-nature="simule"/><path d="' + aire + '" fill="#c2410c" clip-path="url(#' + id + 'h)"/>'
      + '<path d="' + db + '" fill="none" stroke="#5b5b66" stroke-width="1" stroke-dasharray="2 2"/>'
      + '<line x1="0" x2="' + W + '" y1="' + pl + '" y2="' + pl + '" stroke="var(--t)" stroke-width="1.5"/></svg>';
  });
  document.querySelector('[data-role="rubans"]').innerHTML = h;
}
function curseur(Rx) {
  const g = GEO, Y = ROWS(Rx.ajouts.length), c = document.querySelector('[data-role="cur"]');
  c.style.left = g.x(ST.jour + 0.5) + 'px'; c.style.top = '16px'; c.style.height = (Y.fin - 16) + 'px'; c.setAttribute('data-j', 'J' + ST.jour);
}
// ---------- la lecture du jour : barres, plage en pâle, une marque de borne partielle ----------
function barres(p) {
  const abs = document.body.classList.contains('abs'), HH = 70, cap = 4.6, PX = HH / cap;
  document.querySelectorAll('[data-col]').forEach((c) => { const f = c.dataset.col, v = p[f], z = Z[f];
    const h = (x) => abs ? Math.min(HH, Math.min(100, x) / 100 * HH) : Math.min(HH, x / z.cran * PX);
    const zs = abs ? z.bande[1] / 100 * HH : 3 * PX, nul = !(v.haut > 0) && !(v.centre > 0);
    const S0 = c.querySelector('.br-z'); for (const [k, x] of Object.entries({ zs, s: h(v.centre), b0: h(v.bas), b1: h(v.haut), av: h(AVP[f].centre) })) S0.style.setProperty('--' + k, x.toFixed(1) + 'px');
    c.classList.toggle('hors', v.centre > z.bande[1]); c.classList.toggle('nul', nul); c.classList.toggle('hp', !nul && v.hp); c.classList.toggle('ouv', !nul && !v.hp && (abs ? v.haut > 100 : v.haut / z.cran > cap));
    c.querySelector('.br-b').setAttribute('aria-label', NOMS[f] + ' ~ ' + (nul ? 'non simulé' : SIMX.cr(f, v.centre) === 4 ? 'au-dessus du style' : SIMX.cr(f, v.centre) + ' cran(s)') + ', simulé'); });
}
// ---------- « Tire une bière » (y5) : un tirage par famille dans la plage, fixe tant que rien ne change ----------
function alea(seed) { let t = seed >>> 0; return () => { t += 0x6D2B79F5; let r = Math.imul(t ^ (t >>> 15), 1 | t); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; }; }
const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
function tirages(p) {
  const abs = document.body.classList.contains('abs'), HH = 70, cap = 4.6, PX = HH / cap, n = ST.tir, cnt = {};
  document.querySelectorAll('[data-col]').forEach((c) => { const f = c.dataset.col, v = p[f], z = Z[f], box = c.querySelector('.br-pts'); let s = '';
    const r = alea(hash(R.cle + '|' + ST.jour + '|' + f));
    for (let k = 0; k < n; k++) { const u = r(), a = v.bas, m = v.centre, b = v.haut; if (!(b > a)) break; const fc = (m - a) / (b - a); const x = u < fc ? a + Math.sqrt(u * (b - a) * (m - a)) : b - Math.sqrt((1 - u) * (b - a) * (b - m));
      const y = abs ? Math.min(HH, x / 100 * HH) : Math.min(HH, x / z.cran * PX), hors = AVP[f].centre <= z.bande[1] && x > z.bande[1];
      if (hors && !v.hp) cnt[f] = (cnt[f] || 0) + 1; s += '<i class="' + (hors ? 'x' : '') + '" style="bottom:' + (y - 2.5).toFixed(1) + 'px"></i>'; }
    box.innerHTML = s; });
  const t = document.querySelector('[data-role="tirage"]');
  const ouv = BARS.filter((f) => p[f].hp && p[f].haut > 0);
  t.innerHTML = !n ? '' : '<span data-nature="simule">~ ' + n + ' bière' + (n > 1 ? 's' : '') + ' possible' + (n > 1 ? 's' : '') + (Object.keys(cnt).length ? ' : hors de la 16D, ' + Object.entries(cnt).map(([f, k]) => COURTS[f].toLowerCase() + ' ' + k + ' fois').join(', ') : ' : aucune hors de la 16D') + '</span>' + (ouv.length ? ' · plage ouverte, non comptée : ' + ouv.map((f) => COURTS[f].toLowerCase()).join(', ') : '') + ' · l’étendue du possible, pas une probabilité';
}
// ---------- le rendu ----------
function lire(Rx, live) {
  const p = jourP(Rx, ST.jour), F = finP(Rx);
  barres(p); tirages(p);
  // le verdict, en une ligne : faisable (le stock ne bloque jamais), les jours sans gain, le hop creep, la 16D
  const parts = [];
  for (const a of Rx.ajouts) if (a.jours > 3) parts.push(HBJ[a.h].nom + ' reste ' + (a.jours - 3) + ' j sans gain mesuré');
  if (Rx.ajouts[0].start < 6) parts.push('hop creep possible');
  const h = horsF(F);
  document.querySelector('[data-role="verdict"]').innerHTML = '<b class="ok">Faisable</b>' + (parts.length ? ', mais ' + parts.join(', ') : '') + ', ' + (h.length ? '<span class="xs">~ ' + h.map((f) => COURTS[f].toLowerCase()).join(', ') + ' hors de la 16D</span>' : '<span data-nature="simule">~ dans la 16D</span>');
  const enc = Rx.ajouts.filter((a) => ST.jour > a.start && ST.jour - a.start < a.jours), ct = enc.length ? enc.map((a) => HBJ[a.h].nom + ' ' + (ST.jour - a.start) + ' j de contact').join(', ') : ST.jour <= Rx.ajouts[0].start ? 'avant le dry hop' : 'houblons retirés';
  document.querySelector('[data-role="lec-t"]').innerHTML = '<b>J' + ST.jour + '</b><span class="estime">~ dans la cuve</span><span class="gris">' + ct + '</span>';
  document.querySelector('[data-role="resine"]').innerHTML = picto('resin', 14) + '<span>Résineux ' + vrai('déjà au-delà, ta dégustation', 'dégustation du brasseur, 18.10 (« trop résineuse »), que le moteur fait primer', '', 'vv txt') + '</span>';
  document.querySelector('[data-role="aimant"]').textContent = Rx.msg && Rx.msg.length ? 'aimanté : ' + Rx.msg.join(' ; ') : '';
  if (live) return;
  // « depuis hier » (y2), en bulle sous le curseur
  bulle(Rx);
}
function depuisHier(Rx) {
  const a = jourP(Rx, ST.jour), b = jourP(Rx, Math.max(0, ST.jour - 1));
  const d = BARS.map((f) => ({ f, d: (a[f].centre - b[f].centre) / Z[f].cran })).filter((x) => Math.abs(x.d) >= 0.2).sort((x, y) => Math.abs(y.d) - Math.abs(x.d));
  return d.length ? 'depuis hier : ' + d.slice(0, 3).map((x) => COURTS[x.f].toLowerCase() + ' <span class="vs">~' + (x.d > 0 ? '+' : '') + fr(x.d) + ' cran</span>').join(', ') : 'depuis hier : <span class="vs">~ presque rien ne bouge</span>';
}
function bulle(Rx, montrer) {
  const g = GEO, Y = ROWS(Rx.ajouts.length), b = document.querySelector('[data-role="bulle"]');
  if (!montrer) { b.hidden = true; return; }
  b.hidden = false; b.innerHTML = depuisHier(Rx); clearTimeout(bulle.t); if (!TT) bulle.t = setTimeout(() => { b.hidden = true; }, 2500);
  const x = Math.min(g.x(NJ) - 200, Math.max(LW, g.x(ST.jour + 0.5) - 100)); b.style.left = x + 'px'; b.style.top = (Y.rub - 30) + 'px';
}
function rendre() {
  R = resoudre(ST); GEO = geo();
  document.querySelector('[data-role="scen-t"]').textContent = plan().t + (R.ajouts[0].start < 6 ? ' (actif)' : ' (après)');
  document.querySelectorAll('[data-reglage="plan"]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === ST.plan)));
  // les levures simulées pour ce plan, et les autres dites une fois
  const P = plan(), dispo = ['us05', 'verdant', 'pomona', 'diamond'].filter((lv) => P.arr === 'seul' ? D.seul[[P.hops[0], R.m, lv, 3].join('|')] : D.cas[[R.arr || P.arr, P.hops[1], R.m, lv].join('|')]);
  const non = ['us05', 'verdant', 'pomona', 'diamond'].filter((x) => !dispo.includes(x));
  const repos = R.m === 'dryPost';
  const LVS = document.querySelector('[data-role="levures"]'); LVS.hidden = repos;
  LVS.querySelectorAll('button').forEach((b) => { b.hidden = !dispo.includes(b.dataset.v); b.setAttribute('aria-checked', String(R.lv === b.dataset.v)); });
  document.querySelector('[data-role="lv-non"]').textContent = repos ? 'levure au repos : glisse l’ajout avant J6 pour qu’elle compte' : non.length ? non.map((x) => LVN[x]).join(', ') + ' : pas encore simulée' + (non.length > 1 ? 's' : '') + ' ici' : '';
  fond(); blocs(); rubans(R); curseur(R); lire(R);
  // les houblons du plan : α, usage, stock (jamais bloquant) ; l'ajout cumulé sur toute la largeur
  const deux = R.ajouts.length >= 2;
  document.querySelector('[data-role="ajouts"]').innerHTML = (deux ? '<div data-role="ajout">' : '') + R.ajouts.map((a, i) => '<div class="aj" data-voie="' + (i + 1) + '">' + D.cartes[a.h] + '<span class="vr-s">' + a.dose + ' g/L · ' + a.jours + ' j · J' + a.start + '</span></div>').join('') + (deux ? '</div>' : '')
    + (R.sat ? '<div class="aj vr-s"><span data-nature="simule">~ saturation partagée : agrumes ' + Math.round(R.sat * 100) + ' % de la somme des deux seuls</span> · ordre, synergie, masquage : ' + inc('inconnus') + '</div>' : '');
  // « à la suite : plus tard, pas plus » (a6)
  const su = document.querySelector('[data-role="suite"]'); su.innerHTML = '';
  if (R.arr === 'suite') { const E = D.cas[['ensemble', P.hops[1], R.m, 'us05'].join('|')];
    if (E) { const tf = (C) => { const fin = unp(C.jours[C.jours.length - 1]).tropical.centre; const i = C.jours.findIndex((a) => unp(a).tropical.centre >= 0.97 * fin); return C.j0 + i; };
      const Ff = finP(R).tropical.centre, Fe = unp(E.jours[E.jours.length - 1]).tropical.centre;
      su.innerHTML = ic('droite', 14) + ' <b>À la suite : plus tard, pas plus.</b> <span data-nature="simule">~ tropicaux ' + Math.round(Ff) + ' à la fin contre ' + Math.round(Fe) + ' ensemble ; atteint J' + tf(R) + ' au lieu de J' + tf(E) + '</span>'; } }
  vraies(); defi(); preuve();
}
function vraies() {
  let v = '';
  const enCours = R.ajouts.filter((a) => ST.jour > a.start && ST.jour - a.start <= a.jours), t = enCours.length ? Math.min(...enCours.map((a) => ST.jour - a.start)) : null;
  if (t != null && t <= 2) for (const x of D.duree) v += '<div class="vr">' + ic('sablier', 16) + '<span class="vr-l">' + vrai(esc(x.txt), x.src, x.mot, 'vv txt') + '<span class="vr-s">' + esc(x.detail) + '</span></span></div>';
  if (R.ajouts.some((a) => a.jours > 3 && ST.jour - a.start > 3)) v += '<div class="vr">' + ic('sablier', 16) + '<span class="vr-l">' + vrai('au-delà de 3 j : pas d’arôme mesuré en plus', 'Wolfe 2012 [73] ; Schmidt 2019 (E08)', 'publié', 'vv txt') + '<span class="vr-s">végétal selon le temps : ' + inc('inconnu') + '</span></span></div>';
  if (R.ajouts[0].start < 6) v += '<div class="vr">' + ic('bulles', 16) + '<span class="vr-l">' + vrai('hop creep : +0,92 % vol.', 'Young, Fox 2025 [68]', 'mesuré') + '<span class="vr-s">à 10 g/L, 7 j, levure ale</span></span></div>';
  for (const a of R.ajouts) { const H = D.huile[a.h]; v += '<div class="vr">' + ic('fiole', 16) + '<span class="vr-l">' + HBJ[a.h].nom + ' : ' + vrai(fr(H.v[0] * a.dose) + '–' + fr(H.v[1] * a.dose) + ' mL/hL', H.src + ' ; huile × dose', 'calcul') + '<span class="vr-s">huile apportée</span></span></div>'; }
  document.querySelector('[data-role="vraies"]').innerHTML = v;
}
function defi() {
  const F = finP(R), dFl = (F.floral.centre - AVP.floral.centre) / Z.floral.cran, dRe = F.resin.centre - AVP.resin.centre, deb = horsF(F);
  const ob = (cls, t, st, sous) => '<div class="ob ' + cls + '"><b>' + t + '</b><span class="st">' + st + '</span><span class="gris">' + sous + '</span></div>';
  document.querySelector('[data-role="defi"]').innerHTML = '<p class="gris">« trop résineuse, je la veux plus florale » · en fin de cuve</p><div class="defi-l">'
    + ob(dFl >= 0.5 ? 'ok' : '', picto('floral', 14) + 'plus floral', dFl >= 0.5 ? 'atteint' : 'pas encore', '<span data-nature="simule">~ ' + (dFl >= 0 ? '+' : '') + fr(dFl) + ' cran</span>')
    + ob('imp', picto('resin', 14) + 'moins résineux', 'hors houblon', '<span data-nature="simule">~ +' + Math.round(dRe) + ' pts</span> : le houblon en ajoute')
    + ob('ok', ic('goutte', 14) + 'amertume 50–70', 'tenue', vrai(Math.round(D.ibu.v) + ' IBU', D.ibu.src, 'calcul') + ' : le dry hop n’en ajoute pas')
    + ob(deb.length ? 'x' : 'ok', ic('parapluie', 14) + 'dans la 16D', deb.length ? deb.length + ' famille' + (deb.length > 1 ? 's' : '') + ' au-delà' : 'tenu', deb.length ? deb.map((f) => COURTS[f]).join(', ') : 'aucune famille ne déborde') + '</div>';
}
function preuve() {
  const P = D.preuve;
  document.querySelector('[data-role="preuve"]').innerHTML = '<p class="pv-t">Mesuré en bière</p>' + P.mesures.map(([f, t, src, mot, note]) => '<div class="pv">' + (f ? picto(f, 14) : ic('biere', 14)) + '<span>' + vrai(esc(t), src, mot, 'vv txt') + (/vérifier/.test(note) ? ' <span class="mot-c mot-verif">à vérifier</span>' : '') + ' <span class="vr-s">' + esc(note) + '</span></span></div>').join('')
    + '<p class="pv-t">La simulation tombe-t-elle juste ?</p>' + P.verifs.map((v) => '<div class="pv">' + (v.ok ? ic('check', 14) : ic('alerte', 14)) + '<span>' + vrai(esc(v.t), v.src, 'mesuré', 'vv txt') + ' <span class="vr-s">calcul ' + esc(v.c) + ' : ' + esc(v.verdict) + '</span></span></div>').join('')
    + '<p class="pv-t">Les trous</p>' + P.trous.map((t) => '<div class="pv">' + inc('') + '<span>' + esc(t) + '</span></div>').join('');
}
// ---------- les gestes ----------
document.addEventListener('click', (e) => { const b = e.target.closest('button[data-reglage]'); if (!b) return; const r = b.dataset.reglage, v = b.dataset.v;
  if (r === 'scenario') { const o = b.getAttribute('aria-expanded') !== 'true'; b.setAttribute('aria-expanded', String(o)); document.getElementById('plans').hidden = !o; return; }
  if (r === 'plan') { const P = D.plans.find((p) => p.id === v); ST.plan = v; ST.jours = P.arr === 'seul' ? [3] : P.arr === 'suite' ? (P.hops[1] === 'galaxy' ? [3, 7] : [3, 5]) : [3, 3]; if (P.hops[1] === 'galaxy' && P.arr === 'suite') ST.start = 7; document.getElementById('plans').hidden = true; document.querySelector('[data-reglage="scenario"]').setAttribute('aria-expanded', 'false'); }
  if (r === 'levure') ST.lv = v;
  if (r === 'tirer') ST.tir = Math.min(40, ST.tir + 1);
  if (r === 'tirer20') ST.tir = 20;
  if (r === 'tirer' || r === 'tirer20') { tirages(jourP(R, ST.jour)); return; }
  if (r === 'tenir') return;
  const avant = ST.plan + ST.lv + ST.start; ST.tir = 0; rendre(); });
document.querySelectorAll('[data-role="repli"]').forEach((b) => b.addEventListener('click', () => { const o = b.getAttribute('aria-expanded') !== 'true'; b.setAttribute('aria-expanded', String(o)); document.getElementById(b.getAttribute('aria-controls')).hidden = !o; }));
const IN = document.querySelector('input[data-reglage="jour"]');
IN.addEventListener('input', () => { ST.jour = Number(IN.value); curseur(R); lire(R); bulle(R, true); });
// tenir : les jours passent tant que le doigt reste posé (y2)
let TT = null;
const TB = document.querySelector('[data-reglage="tenir"]');
const pas = () => { ST.jour = ST.jour >= NJ ? 0 : ST.jour + 1; IN.value = ST.jour; curseur(R); lire(R, true); bulle(R, true); };
TB.addEventListener('pointerdown', (e) => { e.preventDefault(); TB.setAttribute('aria-pressed', 'true'); pas(); TT = setInterval(pas, 350); });
const lacher = () => { if (TT) { clearInterval(TT); TT = null; TB.setAttribute('aria-pressed', 'false'); lire(R); bulle(R, true); } };
TB.addEventListener('pointerup', lacher); TB.addEventListener('pointercancel', lacher); TB.addEventListener('pointerleave', lacher);
// glisser et étirer un bloc, aimanté aux cas simulés ; le profil suit pendant le geste
let DR = null;
document.querySelector('[data-role="blocs"]').addEventListener('pointerdown', (e) => {
  const blk = e.target.closest('.blk'); if (!blk) return; const i = Number(blk.dataset.i), poi = !!e.target.closest('.poi');
  DR = { i, poi, x0: e.clientX, a0: R.ajouts.map((a) => ({ ...a })), el: blk, id: e.pointerId, cand: null, bouge: false };
  blk.classList.add('prise'); document.querySelector('[data-role="bulle"]').hidden = true; try { blk.setPointerCapture(e.pointerId); } catch (x) {}
});
function candidat(dx) {
  const g = GEO, d = dx / g.px, A = DR.a0.map((a) => ({ ...a })), s = { ...ST, jours: A.map((a) => a.jours) };
  if (DR.poi) { A[DR.i].jours = Math.max(1, Math.min(10, Math.round(DR.a0[DR.i].jours + d))); s.jours = A.map((a) => a.jours); }
  else if (DR.i === 0) { const st = Math.max(0, Math.min(12, DR.a0[0].start + d)); const dd = st - DR.a0[0].start; A.forEach((a) => { a.start = a.start + dd; }); s.start = st; }
  else { const st = Math.max(0, Math.min(14, DR.a0[1].start + d)); A[1].start = st; const P = plan(); const ens = Math.abs(st - A[0].start) < 1.5; const cible = D.plans.find((p) => p.arr === (ens ? 'ensemble' : 'suite') && p.hops[1] === P.hops[1]); if (cible) s.plan = cible.id; if (cible && cible.id !== ST.plan) s.jours = cible.arr === 'suite' ? (P.hops[1] === 'galaxy' ? [3, 7] : [3, 5]) : [3, 3]; s.start = A[0].start; }
  return { s, A };
}
document.addEventListener('pointermove', (e) => { if (!DR || e.pointerId !== DR.id) return; const dx = e.clientX - DR.x0; if (Math.abs(dx) > 4) DR.bouge = true; if (!DR.bouge) return;
  const { s, A } = candidat(dx), g = GEO;
  // le bloc suit le doigt ; le profil suit l'aimant
  if (DR.poi) DR.el.style.width = (A[DR.i].jours * g.px) + 'px'; else document.querySelectorAll('.blk').forEach((b, k) => { b.style.left = g.x(A[k].start) + 'px'; });
  const c = resoudre(s); if (c && (!DR.cand || DR.cand.cle !== c.cle || JSON.stringify(c.msg) !== JSON.stringify(DR.cand.msg))) { DR.cand = c; DR.s = s; rubans(c); lire(c, true); }
});
const finDR = (e) => { if (!DR || (e && e.pointerId !== DR.id)) return; const d = DR; DR = null; d.el.classList.remove('prise'); if (d.bouge && d.s) { const s0 = ST.start; Object.assign(ST, { plan: d.s.plan, start: d.s.start, jours: d.s.jours }); const c = resoudre(ST); ST.start = c.ajouts[0].start; ST.jour = Math.max(0, Math.min(NJ, ST.jour + (ST.start - (s0 < 6 ? 2 : 7)))); IN.value = ST.jour; ST.jours = c.ajouts.map((a) => a.jours); ST.tir = 0; rendre(); document.querySelector('[data-role="aimant"]').textContent = c.msg.length ? 'aimanté : ' + c.msg.join(' ; ') : ''; } else rendre(); };
document.addEventListener('pointerup', finDR); document.addEventListener('pointercancel', finDR);
document.querySelectorAll('.lentille [data-e]').forEach((b) => b.addEventListener('click', () => setTimeout(rendre, 0)));
addEventListener('resize', rendre);
// pour la preuve du geste : les valeurs que la page affiche
window.__releve = () => { const p = jourP(R, ST.jour), cr = (f) => p[f].haut > 0 || p[f].centre > 0 ? fr(p[f].centre / Z[f].cran) : 'inconnu';
  return { plan: document.querySelector('[data-role="scen-t"]').textContent, jour: 'J' + ST.jour, verdict: document.querySelector('[data-role="verdict"]').textContent, aimant: document.querySelector('[data-role="aimant"]').textContent, bulle: document.querySelector('[data-role="bulle"]').hidden ? '' : document.querySelector('[data-role="bulle"]').textContent,
    blocs: [...document.querySelectorAll('.blk')].map((b) => ({ houblon: b.dataset.houblon, gauche: Math.round(b.getBoundingClientRect().left), largeur: Math.round(b.getBoundingClientRect().width), texte: b.textContent.trim() })),
    source: R.src, levure: R.lv, crans: Object.fromEntries(BARS.map((f) => [f, cr(f)])), hautBarres: Object.fromEntries(BARS.map((f) => [f, Math.round(document.querySelector('[data-col="' + f + '"] .br-b').getBoundingClientRect().height)])) }; };
const q = new URLSearchParams(location.search); for (const k of ['plan', 'lv']) if (q.get(k)) ST[k] = q.get(k); if (q.get('start')) ST.start = Number(q.get('start')); if (q.get('jour')) { ST.jour = Number(q.get('jour')); IN.value = ST.jour; }
if (q.get('plan')) { const P = plan(); ST.jours = P.arr === 'seul' ? [3] : P.arr === 'suite' ? (P.hops[1] === 'galaxy' ? [3, 7] : [3, 5]) : [3, 3]; }
rendre();
if (q.has('defi')) document.querySelector('[aria-controls="defi"]').click(); if (q.has('preuve')) document.querySelector('[aria-controls="preuve"]').click(); if (q.has('plans')) document.querySelector('[data-reglage="scenario"]').click(); if (q.get('tir')) { ST.tir = Number(q.get('tir')); tirages(jourP(R, ST.jour)); }`;

const donnees = { plans: PLANS, cas: CAS, seul: SEUL, avant: AV, houblons: Object.fromEntries(Object.entries(HB).map(([k, h]) => [k, { nom: h.nom, couleur: h.couleur }])), cartes,
  points: Object.fromEntries(HOPS.map((k) => [k, pt(k)])), duree: DUREE, reperes: REPERES, preuve: PREUVE, ibu: IBU_BIERE,
  huile: Object.fromEntries(Object.entries(HB).map(([k, h]) => [k, { v: h.huile, src: h.huileSrc }])), grille: {} };
ecrire(path.join(ICI, 'etat.html'), page({ titre: 'x3b · Ma cuve, jour après jour', commentaire: 'Lot 21 · x3b, seconde passe de x3 : frise en haut, blocs glissables et étirables aimantés aux cas simulés, tenir pour faire passer les jours, verdict en une ligne, repères mesurés, rubans en marches, défi, Tire une bière, preuve. Profil : moteur profil-simule (4,75 % vol.).', css, corps, js, donnees }));
