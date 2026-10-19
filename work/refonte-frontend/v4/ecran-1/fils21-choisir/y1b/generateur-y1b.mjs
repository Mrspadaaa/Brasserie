// Lot 21 · y1b « Le brassin au doigt », seconde passe (critique/SYNTHESE.md §3 et §4, critique/y.md).
// Ce qui change par rapport à y1 (laissée intacte pour comparer) :
//   - la frise sous le pouce, en dock au bas de l'écran, dès le premier écran ; un jeton nommé par houblon ;
//     la case « puis » (z1) pour enchaîner un second dry hop ; la loupe ×3 au-dessus du dock ;
//   - l'état de départ : Citra 4 g/L en dry hop actif avec US-05 (chaque réglage visible bouge au premier toucher) ;
//   - la réponse en une ligne (≤ 25 mots), le « pourquoi » à un toucher ; le plan d'avant en pointillé (a3) ;
//   - l'échelle par critère de x1 en trois lignes, ses réglages en pastilles (houblon, dose, jours, levure) ;
//   - la plage en pâle, une seule marque de borne partielle ; le résineux une fois, hors de la figure ;
//   - la jauge d'amertume de toute la stout (u3) ; le défi de ta dégustation (x5), « Tire 20 bières » (y5,
//     tirage fixe tant que les réglages ne changent pas, plages ouvertes à part) et la feuille « preuve » (u5).
// Usage : node generateur-y1b.mjs  →  y1b/etat.html
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as Y from '../y1/socle/socle.mjs';
const { M, C, INC, ico, fr, esc, HOP, COUL, FAIT, ETUDE, srcEtude } = Y;
const ici = path.dirname(fileURLToPath(import.meta.url));

const HS = ['Citra', 'Cascade', 'Galaxy', 'Idaho 7'];
const LEVG = Y.DIMS.levures; // US-05, Pomona : ce que la grille simule
const MOMS = ['b60', 'b10', 'wp', 'dryActive', 'dryPost'];
const paires = {};
for (let i = 0; i < HS.length; i++) for (let k = i + 1; k < HS.length; k++) for (const m of ['dryActive', 'dryPost']) for (const lv of LEVG) {
  const p = Y.paire(HS[i], HS[k], m, lv);
  if (p) paires[[HS[i], HS[k]].sort().join('+') + '|' + m + '|' + lv] = { p: p.profil, parts: p.parts, ordre: [HS[i], HS[k]], sat: p.saturation };
}
// « puis » : les suites que le moteur simule (K3 avec US-05 après ; K4 avec US-05 ou Pomona, actif ou après).
const suites = {
  'Citra>Galaxy|dryPost|US-05': Y.casApres('K3-citra3-galaxy7'),
  'Citra>Idaho 7|dryPost|US-05': Y.casApres('K3-citra3-idaho7-5'),
  ...Object.fromEntries(LEVG.flatMap((lv) => [['dryActive', 'actif'], ['dryPost', 'apres']].map(([m, s]) => ['Citra>Idaho 7|' + m + '|' + lv, Y.casApres('K4-' + lv.toLowerCase().replace('-', '') + '-' + s)]))),
};
const bioCas = Object.fromEntries(LEVG.map((lv) => { const b = Y.casBio('K4-' + lv.toLowerCase().replace('-', '') + '-actif'); const a = b && b.parAjout[0]; return [lv, a ? { cit: a.citronellol_ugL, thi: a.thiolsLiberes_ngL } : null]; }));
const data = {
  g: Y.tranche(HS, MOMS, Y.DIMS.doses, Y.DIMS.jours, LEVG),
  doses: Y.DIMS.doses, jours: Y.DIMS.jours, paires, suites, couleurs: COUL, bio: Y.BIO, bioCas,
  // α pour l'IBU : le lot quand il existe, sinon la plage des fiches (Citra en pellets)
  alphaIbu: Object.fromEntries(HS.map((h) => [h, HOP[h].alpha.lot != null ? [HOP[h].alpha.lot, HOP[h].alpha.lot] : HOP[h].alpha.fiches])),
  ibuMin: Object.fromEntries([60, 55, 50, 45, 40, 35, 30, 25, 20, 15, 10, 5, 0].map((m) => [m, Y.ibuParGL(1, m)])),
  ibuWp: Y.ibuParGL(1, 0, { whirlpool: true, minutes: 20, T: 85 }),
  ibuBiere: Y.ibuParGL(HOP.Nugget.alpha.lot, 60) * 2.3,
  ibuStyle: FAIT.styles['16D'].ibu,
  nomA: Object.fromEntries(HS.map((h) => [h, Y.nomH(h, { couleur: false })])),
  // l'α est une vraie valeur (le lot, sinon les fiches) : data-nature="mesure", sa source reste « lot » ou « fiches »
  voie: Object.fromEntries(HS.map((h) => [h, '<span class="pv-h">' + Y.nomH(h) + Y.usage(h) + Y.alpha(h).split('data-role="alpha"').join('data-role="alpha" data-nature="mesure"') + '<span class="stk" role="img" aria-label="' + (HOP[h].alpha.lot != null ? 'en stock' : 'à acheter') + '">' + ico(HOP[h].alpha.lot != null ? 'j-stock' : 'j-achat', 14) + '</span></span>'])),
  huile: Object.fromEntries(HS.map((h) => [h, Y.huilePlage(h)])),
  r4mmp: { Citra: Y.rapport('Citra', '4MMP', { baseCommune: true }), Cascade: Y.rapport('Cascade', '4MMP', { baseCommune: true }), Galaxy: Y.rapport('Galaxy', '4MMP', { baseCommune: true }), 'Idaho 7': Y.rapport('Idaho 7', '4MMP', { baseCommune: true }) },
};

// ---------- le « pourquoi » de chaque moment : à un toucher, vrai et sourcé ----------
const pq = {
  b60: `À 60′, presque tout s’évapore : ${C('4MMP', ['tropical'])} ${M('−91 %', 'H13 · Kishimoto 2008 (revue) : 60 min à 100 °C')} ; l’amertume reste.`,
  bmid: `Entre 60′ et 10′ : ${Y.S('≈ interpolé')}, la grille du moteur n’a que 60′ et 10′.`,
  b10: `À 10′, une part reste : ${C('linalol', ['floral'])} ${M('60–63 %', 'H30 · Gahr 2019 (revue) : ajout tardif')} retrouvé en bière.`,
  bfin: `Fin d’ébullition : ${Y.S('≈ interpolé')} entre 10′ et whirlpool.`,
  wp: `Whirlpool : ${C('linalol', ['floral'])} ${M('60–63 %', 'H30 · Gahr 2019 (revue)')} retrouvé ; peu d’amertume.`,
  dryActive: `Dry hop actif : le CO₂ emporte du ${C('myrcène', ['resin'])} (H33) ; la levure peut changer le ${C('géraniol', ['floral'])}. Pas d’IBU.`,
  dryPost: `Dry hop après : ${C('linalol', ['floral'])} ${M('80–82 %', 'H30 · Gahr 2019 (revue)')} retrouvé ; l’essentiel en ${M('24 h', 'H73, H20 : protocoles OSU')}.`,
  puis: `À la suite : la saturation est partagée ; l’ordre, la synergie et le masquage restent ${INC('inconnus', 'composes-houblon.json, ajoutsSuccessifs')}.`,
};

const voie = (h, n) => `<div class="vh" data-voie="${n}" data-h="${esc(h)}">${Y.nomH(h)}${Y.usage(h)}${Y.alpha(h)}<span class="stk" role="img" aria-label="${HOP[h].alpha.lot != null ? 'en stock' : 'à acheter'}">${ico(HOP[h].alpha.lot != null ? 'j-stock' : 'j-achat', 14)}</span><span class="q">${Y.huile(h)}</span></div>`;
// ---------- la feuille « preuve » (u5) : le mesuré, la simulation face au mesuré, les trous ----------
const m06 = (v, c) => ETUDE.E06.mesures.find((m) => m.variete === v && m.compose === c);
const e04 = ETUDE.E04.mesures, agr = e04.filter((m) => /^citrus/.test(m.descripteur || '')).map((m) => m.valeur);
const lin04 = e04.filter((m) => /linalol, part extraite/.test(m.compose || ''));
const linC = Y.mesureCas('K2-citra', (m) => m.type === 'compose' && m.compose === 'linalol');
const e03 = ETUDE.E03.mesures.find((m) => m.variete === 'Idaho-7' && m.compose === 'linalol');
const rL = Y.rapport('Citra', 'linalol'), rK = Y.rapport('Cascade', 'linalol');
const preuve = `
  <div class="pf-voile" data-k="pf-fermer" hidden></div>
  <section class="pf" id="preuve" role="dialog" aria-label="La preuve : ce qui est mesuré" hidden>
    <header class="pf-t"><h2>La preuve</h2><button class="fi-x" data-k="pf-fermer" aria-label="Fermer la preuve">${ico('i-x', 16)}</button></header>
    <div class="w pf-s"><h3>Mesuré en bière</h3>
      <div class="fi-eb">${C('linalol', ['floral', 'citrus'])} Citra ${M(fr(m06('Citra', 'linalol').valeur) + ' µg/L', srcEtude('E06') + ' · diapositive 17')} <span class="src-l">témoin ${fr(m06('témoin (sans houblon)', 'linalol').valeur)} · dose non indiquée · E06</span></div>
      <div class="fi-eb">${C('linalol', ['floral'])} Idaho 7 ${M(fr(e03.valeur * 1000) + ' µg/L', srcEtude('E03') + ' · ' + e03.lecture, { verifier: true })} <span class="src-l">au pitch · E03</span></div>
      <div class="fi-eb">${C('agrumes', ['citrus'])} Cascade, panel OSU : ${M(agr.map((v) => fr(v)).join(' → ') + ' sur 15', srcEtude('E04') + ' · tableau 3, lecture H')} <span class="ok-k">vérifié (K)</span> <span class="src-l">de 0 à 16 g/L : plafond dès 8 g/L</span></div>
      <div class="fi-eb">${C('linalol', ['floral'])} extrait chez Cascade : ${M(lin04.map((m) => m.valeur + ' % à ' + m.dose_gL + ' g/L').join(', '), srcEtude('E04') + ' · texte')} <span class="src-l">la saturation, mesurée</span></div>
      <div class="fi-eb">${M('1 h = 96 h', srcEtude('E10') + ' · texte')} <span class="src-l">au panel, Cascade 1,43 g/L · E10</span> ${M('2 j', srcEtude('E08') + ' · texte')} <span class="src-l">pour l’essentiel, Eureka! · E08</span></div>
    </div>
    <div class="w pf-s"><h3>La simulation tombe-t-elle juste ?</h3>
      <div class="fi-eb">${C('linalol', ['floral'])} Citra 4 g/L, moteur ${M(fr(linC.concentration.plage.min, 0) + '–' + fr(linC.concentration.plage.max, 0) + ' µg/L', 'moteur du pilote, cas K2-citra (mesures[]) : ' + Y.srcCles(linC.source))} <span class="src-l">encadre les 144 mesurés ; centre ~${fr(linC.concentration.plage.central, 0)}, 2 à 5 fois trop haut</span></div>
      <div class="fi-eb">${C('linalol', ['floral'])} Cascade 2 g/L : moteur ${M('~57 µg/L', 'donnees/PROFIL-SIMULE.md, confrontation 7')}, mesuré ${M('56,9 µg/L', 'H §7.4 · Kishimoto')} <span class="src-l">juste</span></div>
    </div>
    <div class="w pf-s"><h3>Face au seuil, l’écart énorme</h3>
      <div class="plg-h">${Y.nomH('Citra', { couleur: false })}</div>${Y.plageLog({ ...rL, compose: 'linalol', fams: ['floral', 'citrus'], aria: 'Citra, linalol' })}
      <div class="plg-h">${Y.nomH('Cascade', { couleur: false })}</div>${Y.plageLog({ ...rK, compose: 'linalol', fams: ['floral', 'citrus'], aria: 'Cascade, linalol' })}
    </div>
    <div class="w pf-s"><h3>Les houblons, en vrai</h3>
      <div class="voies">${HS.map((h, i) => voie(h, i + 2)).join('')}</div>
    </div>
    <div class="w pf-s"><h3>Les trous</h3>
      <div class="fi-eb">${INC('Verdant, Diamond : pas encore simulées par le moteur', 'profils-simules.json : grille US-05 et Pomona')}</div>
      <div class="fi-eb">${INC('Citra contre Cascade à dose égale, en bière : aucune étude', 'comparatifs-dryhop.json')}</div>
      <div class="fi-eb">${INC('Galaxy : aucune comparaison chiffrée', 'comparatifs-dryhop.json')}</div>
      <div class="fi-eb">${INC('variété × levure × dry hop : aucune mesure croisée', 'comparatifs-dryhop.json')}</div>
      <div class="fi-eb">${INC('perception en bière noire : non documentée', 'H §8.3')}</div>
    </div>
  </section>`;


const corps = `
  ${Y.tete('Quand ?')}
  <p class="plan" id="plan" data-voie="1"></p>
  <section class="bloc sim" data-role="simulation" aria-label="Profil simulé de ton plan">
    <p class="rp" id="rep"></p>
    <button class="pq-b" id="pq-b" aria-expanded="false" aria-controls="pq">pourquoi ?</button>
    <p class="pq" id="pq" hidden></p>
    <div class="ech" aria-label="Échelle : rester dans la 16D">
      <div class="ech-t"><span>dans la 16D, par</span><button class="crit-b" id="crit" aria-expanded="false" aria-controls="crit-l" aria-label="Critère de classement : ouvrir la liste"></button></div>
      <div class="crit-l" id="crit-l" role="group" aria-label="Choisir le critère" hidden></div>
      <div class="ech-l" id="ech-l"></div>
    </div>
    <div class="ser" id="ser"></div>
    <div id="spec"></div>
    <p class="res" id="res"></p>
  </section>
  <section class="bloc regl" aria-label="Réglages du plan">
    <div class="rg">
      <button class="pa" id="pa-h1" data-pa="h1" aria-expanded="false"></button>
      <span id="h2-zone"></span>
      <span class="seg dose" role="radiogroup" aria-label="Dose par houblon">${Y.DIMS.doses.map((d) => `<button role="radio" data-dose="${d}" data-role="reglage" aria-checked="${d === 4}">${d}</button>`).join('')}</span><span class="u">g/L</span>
    </div>
    <div class="ouvre" id="ouvre" hidden></div>
    <div class="rg">
      <button class="pa" id="pa-j" data-pa="j" aria-expanded="false"></button>
      <span class="seg lev" role="radiogroup" aria-label="Levure">${LEVG.map((l, i) => `<button role="radio" data-lev="${l}" data-reglage="levure" data-role="reglage" aria-checked="${i === 0}">${l}</button>`).join('')}</span>
      <span class="bio" data-role="biotransformation" id="bio"></span>
    </div>
  </section>
  <section class="bloc ibu-b" aria-label="L’amertume de ta stout">
    <div class="ibu-h"><span>amertume de ta stout</span><b id="ibu-v" data-nature="simule"></b><span class="ibu-x" id="ibu-x"></span></div>
    <div class="ibu-e"><i class="ibu-z"></i><i class="ibu-n" id="ibu-n"></i><i class="ibu-c" id="ibu-c"></i><i class="ibu-k" id="ibu-k"></i></div>
    <div class="ibu-l" id="ibu-l"></div>
  </section>
  <div class="blocs" role="group" aria-label="À un toucher">
    <button class="bl" id="b-defi" aria-expanded="false"></button>
    <button class="bl" id="b-tire" aria-expanded="false" data-role="reglage">${ico('i-plus', 14)}Tire 20 bières</button>
    <button class="bl" id="b-preuve" aria-haspopup="dialog">Preuve</button>
  </div>
  <section class="bloc defi" id="defi" aria-label="Le défi de ta dégustation" hidden></section>
  <section class="bloc tire" id="tire" aria-label="Vingt bières possibles" hidden></section>
  <nav class="quai" aria-label="La frise du brassin : glisse un houblon">
    <div class="loupe" id="loupe" hidden><b id="loupe-t"></b><span class="loupe-r" id="loupe-r"></span></div>
    <div class="fr" id="fr"><i class="fr-rail"></i><span id="ticks"></span><span id="jetons"></span></div>
    <div class="arrets" id="arrets"></div>
  </nav>
  ${preuve}
  ${Y.legende([Y.legendeSection('Frise et plan', [['<i class="lx-j"></i>', 'glisse un houblon : son moment'], ['<span class="ms">≈</span>', 'entre deux points : interpolé ou calculé'], ['<i class="lx lx-g"></i>', 'pointillé : ton plan d’avant'], ['<i class="lx-pl"></i>', 'bande pâle : la plage possible']])])}`;

const css = `
  .ecran { padding-bottom: 150px; gap: 6px; }
  .plan { font-size: 13px; font-weight: 600; display: flex; flex-wrap: wrap; align-items: center; gap: 2px 6px; min-height: 20px; }
  .plan .src-l { font-weight: 400; } .pv-h { display: inline-flex; align-items: center; gap: 5px; } .pv-h .stk { color: var(--gris); }
  .rp { font-size: 14px !important; font-size: 15px; font-weight: 600; line-height: 1.3; min-height: 40px; }
  .rp b { font-family: var(--mono); font-weight: 600; } .rp .qui { margin-right: 6px; }
  .sp1::before { content: "·"; margin: 0 6px; color: var(--gris); } .sp2::after { content: "·"; margin: 0 5px; color: var(--gris); } .rp .ho { color: var(--acc); }
  .rp .it { display: inline-flex; align-items: center; gap: 3px; white-space: nowrap; }
  .pq-b { position: absolute; right: 10px; top: 8px; font-size: 12px; color: var(--gris); text-decoration: underline dotted; }
  .rp { font-size: 14px !important; padding-right: 64px; }
  .pq { font-size: 13px; line-height: 1.35; } .pq[hidden] { display: none; }
  .ech { display: flex; flex-direction: column; gap: 2px; }
  .ech-t { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--gris); }
  .crit-l { display: flex; gap: 4px; flex-wrap: wrap; padding: 4px; border-radius: 8px; background: #f6f6f9; } .crit-l[hidden] { display: none; }
  .crit-l button { height: 28px; padding: 0 10px; border-radius: 14px; background: #fff; box-shadow: inset 0 0 0 1px #c9cad2; font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; }
  .crit-l button[aria-pressed="true"] { background: var(--encre); color: #fff; box-shadow: none; }
  .crit-b[aria-expanded="true"] { box-shadow: inset 0 0 0 2px var(--encre); }
  .rp .l1, .rp .l2 { display: block; } .rp .l2 { font-size: 13px; font-weight: 400; margin-top: 3px; } .rp .l2 .kl { margin-right: 5px; vertical-align: middle; }
  .crit-b { height: 24px; padding: 0 8px; border-radius: 12px; box-shadow: inset 0 0 0 1px #c9cad2; background: #fff; font-size: 12px; font-weight: 600; color: var(--encre); display: inline-flex; align-items: center; gap: 4px; }
  .ech-l { display: flex; flex-direction: column; gap: 2px; min-height: 70px; }
  .ech-r { display: flex; align-items: center; gap: 6px; height: 22px; padding: 0 6px; border-radius: 4px; font-size: 13px; text-align: left; box-shadow: inset 0 0 0 1px #e3e5eb; }
  .ech-r[aria-current="true"] { box-shadow: inset 0 0 0 1.5px var(--encre); }
  .ech-r .g { margin-left: auto; font: 600 12px var(--mono); }
  .ser { display: flex; flex-wrap: wrap; gap: 2px 12px; font-size: 12px; color: var(--gris); }
  .ser span { display: inline-flex; align-items: center; gap: 4px; }
  .kl { display: inline-block; width: 14px; height: 9px; }
  .kl-b { background: linear-gradient(90deg, ${Y.J.floral.base} 0 33%, ${Y.J.citrus.base} 33% 66%, ${Y.J.tropical.base} 66%); border-radius: 0 2px 2px 0; }
  .kl-g { border: 1.5px dashed var(--encre); border-left: 0; height: 11px; }
  .kl-m { background: repeating-linear-gradient(135deg, ${Y.J.tropical.base} 0 2px, #fff 2px 4px); box-shadow: inset 0 0 0 1px ${Y.J.tropical.base}; }
  .res { font-size: 12px; color: var(--gris); display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
  .res b { color: var(--encre); font-weight: 600; }
  .regl { gap: 5px; padding-top: 6px; padding-bottom: 6px; }
  .spec.pale .sp-l { height: 16px; } .sim { gap: 4px; }
  .rg { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .pa { height: 28px; padding: 0 10px; border-radius: 14px; background: #fff; box-shadow: inset 0 0 0 1px #c9cad2; font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; gap: 5px; white-space: nowrap; }
  .pa[aria-expanded="true"] { box-shadow: inset 0 0 0 2px var(--encre); }
  .pa .hpt { width: 9px; height: 9px; }
  .pa svg { color: var(--gris); }
  .pa.ajt { color: var(--encre); }
  .pa.h2 { padding-right: 4px; }
  .pa.h2 .x { width: 20px; height: 20px; border-radius: 50%; background: #ececf1; display: inline-flex; align-items: center; justify-content: center; }
  .seg.dose button, .seg.lev button { height: 24px; padding: 0 9px; font-size: 13px; }
  .u { font-size: 12px; color: var(--gris); }
  .ouvre { display: flex; gap: 4px; flex-wrap: wrap; padding: 4px; border-radius: 8px; background: #f6f6f9; } .ouvre[hidden] { display: none; }
  .ouvre button { height: 28px; padding: 0 10px; border-radius: 14px; background: #fff; box-shadow: inset 0 0 0 1px #c9cad2; font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; gap: 5px; }
  .ouvre button[aria-pressed="true"] { background: var(--encre); color: #fff; box-shadow: none; }
  .ouvre .src-l { flex-basis: 100%; }
  .bio { font-size: 12px; display: inline-flex; align-items: center; gap: 6px; flex-wrap: wrap; } .bio > span { display: inline-flex; align-items: center; gap: 3px; flex-wrap: wrap; }
  .ibu-b { gap: 3px; padding: 6px 10px; }
  .ibu-h { display: flex; align-items: baseline; gap: 8px; font-size: 12px; color: var(--gris); }
  .ibu-h b { margin-left: auto; font: 600 14px var(--mono); color: var(--encre); }
  .ibu-h .ibu-x { font-weight: 600; min-width: 64px; text-align: right; color: var(--encre); } .ibu-h .ibu-x.ho { color: var(--acc); }
  .ibu-e { position: relative; height: 14px; border-radius: 2px; background: #f1f2f5; }
  .ibu-z { position: absolute; top: 0; bottom: 0; left: calc(50 / 200 * 100%); width: calc(20 / 200 * 100%); background: rgba(22,22,26,.12); border-left: 1.5px solid var(--encre); border-right: 1.5px solid var(--encre); }
  .ibu-n { position: absolute; top: 3px; height: 8px; left: 0; background: #6b6f7a; border-radius: 0 2px 2px 0; }
  .ibu-c { position: absolute; top: 3px; height: 8px; background: var(--encre); transition: left .09s linear, width .09s linear; } .ibu-c.ho { background: var(--acc); }
  .ibu-k { position: absolute; top: 1px; height: 12px; background: repeating-linear-gradient(90deg, rgba(22,22,26,.5) 0 2px, transparent 2px 4px); }
  .ibu-l { position: relative; height: 14px; font-size: 12px; color: var(--gris); }
  .ibu-l span { position: absolute; top: 0; white-space: nowrap; }
  .blocs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; }
  .bl { height: 32px; border-radius: 16px; background: #fff; box-shadow: inset 0 0 0 1px #c9cad2; font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; gap: 4px; white-space: nowrap; padding: 0 6px; }
  .bl[aria-expanded="true"] { background: var(--encre); color: #fff; box-shadow: none; }
  .defi[hidden], .tire[hidden] { display: none; }
  .df { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .dfo { border-radius: 8px; padding: 6px 8px; box-shadow: inset 0 0 0 1px #e3e5eb; display: flex; flex-direction: column; gap: 2px; font-size: 13px; }
  .dfo b { display: inline-flex; align-items: center; gap: 4px; } .dfo .st { font-weight: 700; } .dfo.ok .st { color: #24584d; } .dfo.x .st { color: var(--acc); } .dfo.imp .st { color: var(--gris); }
  .tire { gap: 4px; font-size: 13px; } .tire .it { display: inline-flex; align-items: center; gap: 3px; white-space: nowrap; margin-right: 6px; } .tire b { font-family: var(--mono); }
  .quai { position: fixed; left: 0; right: 0; bottom: 0; z-index: 9; background: #fff; box-shadow: 0 -6px 18px -10px rgba(22,22,26,.45); padding: 6px 12px 10px; max-width: 390px; margin: 0 auto; touch-action: none; -webkit-user-select: none; user-select: none; }
  .fr { position: relative; height: 64px; touch-action: none; }
  .fr-rail { position: absolute; left: 0; right: 0; top: 50px; height: 4px; border-radius: 2px; background: #c9cad2; }
  #ticks i { position: absolute; top: 46px; width: 2px; height: 12px; margin-left: -1px; background: #8a909b; border-radius: 1px; }
  #ticks i.cle { height: 16px; top: 44px; background: var(--encre); }
  .jt { position: absolute; transform: translateX(-50%); height: 26px; padding: 0 10px; border-radius: 13px; background: var(--h); color: #fff; font-size: 13px; font-weight: 700; display: inline-flex; align-items: center; white-space: nowrap; box-shadow: 0 0 0 2px #fff, 0 3px 8px -3px rgba(22,22,26,.6); cursor: grab; touch-action: none; }
  .jt.actif { box-shadow: 0 0 0 2px #fff, 0 0 0 4px var(--encre); }
  .jt.tire { box-shadow: 0 0 0 2px #fff, 0 0 0 8px rgba(22,22,26,.18); }
  .arrets { display: flex; justify-content: space-between; gap: 2px; }
  .arrets button { height: 28px; padding: 0 8px; border-radius: 14px; font-size: 12px; font-weight: 600; color: var(--encre); box-shadow: inset 0 0 0 1px #d4d6dd; background: #fff; white-space: nowrap; }
  .arrets button[aria-current="true"] { background: var(--encre); color: #fff; box-shadow: none; }
  .loupe { position: absolute; bottom: calc(100% + 8px); width: 150px; margin-left: -75px; height: 64px; border-radius: 8px; background: #fff; box-shadow: 0 2px 4px rgba(22,22,26,.1), 0 10px 26px -10px rgba(22,22,26,.6); display: flex; flex-direction: column; align-items: center; overflow: hidden; pointer-events: none; }
  .loupe[hidden] { display: none; }
  .loupe b { font: 700 22px/1.1 var(--mono); padding-top: 4px; }
  .loupe-r { position: relative; width: 150px; height: 30px; }
  .loupe-r i { position: absolute; top: 2px; width: 2px; height: 12px; margin-left: -1px; background: #8a909b; }
  .loupe-r i.ici { top: 0; height: 16px; width: 3px; background: var(--acc); }
  .loupe-r span { position: absolute; top: 16px; transform: translateX(-50%); font: 500 12px/1 var(--mono); color: var(--gris); white-space: nowrap; }
  .pf-voile { position: fixed; inset: 0; z-index: 25; background: rgba(22,22,26,.32); } .pf-voile[hidden], .pf[hidden] { display: none; }
  .pf { position: fixed; left: 0; right: 0; bottom: 0; z-index: 26; max-height: 88vh; overflow-y: auto; background: var(--mur); border-radius: 8px 8px 0 0; padding: 6px 10px 14px; display: flex; flex-direction: column; gap: 6px; max-width: 390px; margin: 0 auto; }
  .pf-t { display: flex; align-items: center; min-height: 32px; } .pf-t h2 { font-size: 16px; font-weight: 700; }
  .pf-s { display: flex; flex-direction: column; gap: 5px; } .pf-s h3 { font-size: 13px; font-weight: 700; }
  .ok-k { font-size: 12px; font-weight: 700; color: #24584d; }
  .plg-h { font-size: 13px; } .plg-t small { font: 400 12px var(--sans); color: var(--gris); }
  .lx-j { display: inline-block; width: 30px; height: 14px; border-radius: 7px; background: ${COUL.Citra}; }
  .lx-pl { display: inline-block; width: 26px; height: 7px; border-radius: 2px; background: rgba(22,22,26,.09); }`;

const script = `
const D = DONNEES;
// ---------- les lieux de la frise : 60′ à 0′ par 5′, whirlpool, dry hop actif, dry hop après, puis ----------
const ARRETS = [];
for (let m = 60; m >= 0; m -= 5) ARRETS.push({ id: 'b' + m, min: m, x: (60 - m) / 60 * 0.44, t: m + '′', court: m === 60 || m === 10 ? m + '′' : '' });
ARRETS.push({ id: 'wp', x: 0.555, t: 'whirlpool', court: 'whirlpool' }, { id: 'dryActive', x: 0.69, t: 'dry hop actif', court: 'actif' }, { id: 'dryPost', x: 0.83, t: 'dry hop après', court: 'après' }, { id: 'puis', x: 0.965, t: 'puis', court: 'puis' });
const K = (id) => ARRETS.findIndex((a) => a.id === id);
const sec = (a) => a.id === 'dryActive' || a.id === 'dryPost';
// L'état : un ou deux houblons, chacun à son lieu ; état de départ : Citra 4 g/L en dry hop actif, US-05.
const CRITS = ['floral', 'citrus', 'tropical'];
const ETAT = { h1: { h: 'Citra', k: K('dryActive') }, h2: null, d: 4, j: 3, lev: 'US-05', actif: 'h1', crit: 'floral', critOuvert: false, ouvert: null, defi: false, tire: false };
let AVANT_PLAN = null; // le plan d'avant (a3) : l'état d'avant le dernier réglage
const copie = (e) => JSON.parse(JSON.stringify(e));
const clePlan = (e) => [e.h1.h, e.h1.k, e.h2 ? e.h2.h + ':' + e.h2.k : '-', e.d, e.j, e.lev].join('|');
// ---------- le profil d'un houblon à un lieu (grille, ≈ interpolé entre 60′, 10′, whirlpool) ----------
const gr = (h, m, d, j, lv) => D.g[[h, m, d, m.startsWith('dry') ? j : '', lv].join('|')];
function prof(h, a, d, j, lv) {
  if (a.min === undefined) return { p: gr(h, a.id, d, j, lv) };
  if (a.min === 60 || a.min === 10) return { p: gr(h, a.id === 'b60' ? 'b60' : 'b10', d, j, lv) };
  const [m0, m1, t] = a.min > 10 ? ['b60', 'b10', (60 - a.min) / 50] : ['b10', 'wp', (10 - a.min) / 10];
  return { p: lerpP(gr(h, m0, d, j, lv), gr(h, m1, d, j, lv), t), approx: 'interpolé' };
}
// Le plan entier : un houblon ; deux au même dry hop (paires du moteur, 2 + 2 g/L) ; « puis » (suites K3, K4) ;
// sinon la saturation partagée calculée avec la courbe du moteur, et dite.
function plan(e) {
  const a1 = ARRETS[e.h1.k], p1 = prof(e.h1.h, a1, e.d, e.j, e.lev);
  if (!e.h2) return { p: p1.p, approx: p1.approx || '', parts: null };
  const a2 = ARRETS[e.h2.k];
  const lieu2 = a2.id === 'puis' ? (sec(a1) ? a1 : ARRETS[K('dryPost')]) : a2;
  const p2 = prof(e.h2.h, lieu2, e.d, e.j, e.lev);
  const parts = FAM.map((f, i) => [Math.max(0, p1.p[i][1] - AVANT[i][1]), Math.max(0, p2.p[i][1] - AVANT[i][1])]);
  if (a2.id === 'puis') {
    const s = D.suites[e.h1.h + '>' + e.h2.h + '|' + lieu2.id + '|' + e.lev];
    if (s && e.d === 2) return { p: s, approx: '', parts, suite: true };
    return { p: cumule([p1.p, p2.p]), approx: 'calculé', parts, suite: true };
  }
  if (a2.id === a1.id && sec(a1) && e.d === 2 && e.j === 3) {
    const k = [e.h1.h, e.h2.h].sort().join('+'), pr = D.paires[k + '|' + a1.id + '|' + e.lev];
    if (pr) return { p: pr.p, approx: '', parts: pr.ordre[0] === e.h1.h ? pr.parts : pr.parts.map(([x, y]) => [y, x]), sat: pr.sat };
  }
  return { p: cumule([p1.p, p2.p]), approx: 'calculé', parts };
}
// ---------- l'amertume de toute la stout (u3) : le Nugget à 60′, puis chaque houblon à son lieu ----------
const ibuA = (h, a, d) => { const [lo, hi] = D.alphaIbu[h], u = a.min !== undefined ? D.ibuMin[a.min] : a.id === 'wp' ? D.ibuWp : 0; return [lo * u * d, hi * u * d]; };
function ibu(e) {
  const x = ibuA(e.h1.h, ARRETS[e.h1.k], e.d), y = e.h2 && ARRETS[e.h2.k].id !== 'puis' ? ibuA(e.h2.h, ARRETS[e.h2.k], e.d) : [0, 0];
  return { base: D.ibuBiere, lo: x[0] + y[0], hi: x[1] + y[1] };
}
// ---------- l'échelle (x1) : un houblon, 3 j, la levure choisie ; rien qui sorte de la 16D ; classé par un critère ----------
function echelle() {
  const L = [], MO = { b10: '10′', wp: 'whirlpool', dryActive: 'actif', dryPost: 'après' };
  for (const h of ['Citra', 'Cascade', 'Galaxy', 'Idaho 7']) for (const m of ['b10', 'wp', 'dryActive', 'dryPost']) for (const d of D.doses) {
    const p = gr(h, m, d, 3, ETAT.lev); if (!p) continue;
    const sort = FAM.some((f, i) => f !== 'resin' && !inconnuP(p[i]) && AVANT[i][1] <= ZONE[f][1] && p[i][1] > ZONE[f][1]);
    const ib = ibuA(h, ARRETS[K(m)], d);
    if (sort || D.ibuBiere + ib[1] > D.ibuStyle[1]) continue;
    const i = FAM.indexOf(ETAT.crit);
    L.push({ h, m, d, g: crans(i, p[i][1]) - crans(i, AVANT[i][1]), mo: MO[m] });
  }
  L.sort((a, b) => b.g - a.g || a.d - b.d);
  const cur = !ETAT.h2 && ETAT.j === 3;
  document.getElementById('ech-l').innerHTML = L.slice(0, 3).map((x) => '<button class="ech-r" data-role="reglage" data-eh="' + x.h + '" data-em="' + x.m + '" data-ed="' + x.d + '" aria-current="' + (cur && x.h === ETAT.h1.h && ARRETS[ETAT.h1.k].id === x.m && x.d === ETAT.d) + '"><i class="hpt" style="--h:' + D.couleurs[x.h] + '"></i><span class="sp2">' + x.h + '</span><span class="sp2">' + x.mo + '</span><span>' + x.d + ' g/L</span><span class="g" data-nature="simule">~+' + frn(x.g, 1) + (x.g >= 1.5 ? ' crans' : ' cran') + '</span></button>').join('') || '<span class="cq-0">aucun réglage ne reste dans la 16D</span>';
  document.querySelectorAll('[data-eh]').forEach((b) => b.addEventListener('click', () => { retenir(); ETAT.h1 = { h: b.dataset.eh, k: K(b.dataset.em) }; ETAT.h2 = null; ETAT.d = +b.dataset.ed; ETAT.j = 3; rendre(); }));
  // La pastille de famille ouvre la liste des critères ; un choix la referme.
  const cb = document.getElementById('crit');
  cb.innerHTML = pictoH(ETAT.crit) + NOMF[ETAT.crit] + PICTO_OUVRE; cb.setAttribute('aria-expanded', String(!!ETAT.critOuvert));
  const cl = document.getElementById('crit-l'); cl.hidden = !ETAT.critOuvert;
  cl.innerHTML = ETAT.critOuvert ? CRITS.map((f) => '<button data-critv="' + f + '" aria-pressed="' + (f === ETAT.crit) + '">' + pictoH(f) + NOMF[f] + '</button>').join('') : '';
}
// ---------- un tirage fixe tant que les réglages ne changent pas (graine = le plan) ----------
function graine(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return () => { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const tri = (u, a, c, b) => { if (b <= a) return c; const f = (c - a) / (b - a); return u < f ? a + Math.sqrt(u * (b - a) * (c - a)) : b - Math.sqrt((1 - u) * (b - a) * (b - c)); };
function tirages(P) { const r = graine(clePlan(ETAT)); return Array.from({ length: 20 }, () => P.map((x) => (inconnuP(x) ? null : tri(r(), x[0], x[1], x[2])))); }
// ---------- le dessin ----------
const sp = new Spectre(document.getElementById('spec'), { crans: 7, pale: true, sans: ['resin'] });
const nomJ = (e) => e.h1.h + (e.h2 ? (ARRETS[e.h2.k].id === 'puis' ? ' puis ' : ' + ') + e.h2.h : '');
const lieu = (e) => { const a = ARRETS[e.h1.k]; return (a.min !== undefined && a.min !== 60 && a.min !== 10 ? '≈ ' : '') + a.t; };
const ibuTxt = (x) => '≈ ' + Math.round(x.base + x.lo) + (x.hi - x.lo >= 1 ? '–' + Math.round(x.base + x.hi) : '') + ' IBU';
function rendre() {
  const P = plan(ETAT), av = AVANT_PLAN ? plan(AVANT_PLAN) : null, ib = ibu(ETAT), a1 = ARRETS[ETAT.h1.k];
  const T = ETAT.tire ? tirages(P.p) : null;
  sp.set({ p: P.p, ghost: av ? av.p : null, parts: P.parts, ref: av ? av.p : AVANT, dots: T ? FAM.map((f, i) => T.map((t) => t[i]).filter((v) => v != null)) : null });
  // la ligne du plan : ce que tu fais, en données ; les houblons tiennent la fiche à l'appui long
  // la ligne du plan est la voie : chaque houblon, son usage en mot, son α (le lot, sinon les fiches), le stock en icône
  document.getElementById('plan').innerHTML = D.voie[ETAT.h1.h] + (ETAT.h2 ? (ARRETS[ETAT.h2.k].id === 'puis' ? ' puis ' : ' + ') + D.voie[ETAT.h2.h] : '') + '<span class="sp2">' + (ETAT.h2 ? ETAT.d + ' + ' + ETAT.d : ETAT.d) + ' g/L</span><span' + (sec(a1) ? ' class="sp2"' : '') + '>' + lieu(ETAT) + '</span>' + (sec(a1) ? '<span class="sp2">' + ETAT.j + ' j</span><span>' + ETAT.lev + '</span>' : '') + (P.approx ? '<span class="src-l">≈ ' + P.approx + '</span>' : '');
  // la réponse en une ligne : face au plan d'avant, ou à ta stout ; l'amertume
  // les deux familles qui bougent le plus, au dixième de cran sous 1,5 (un petit effet ne s'arrondit pas à rien)
  // Deux lignes courtes : face à ta stout d'abord (toujours), puis contre ton plan d'avant (en pointillé,
  // seulement après un geste). Les deux familles qui bougent le plus, au dixième de cran sous 1,5.
  const ecartsDe = (ref) => FAM.map((f, i) => ({ f, d: f === 'resin' || inconnuP(P.p[i]) || inconnuP(ref[i]) ? 0 : crans(i, P.p[i][1]) - crans(i, ref[i][1]), hors: f !== 'resin' && !inconnuP(P.p[i]) && P.p[i][1] > ZONE[f][1] })).filter((x) => Math.abs(x.d) >= 0.25).sort((a, b) => Math.abs(b.d) - Math.abs(a.d)).slice(0, 2);
  const items = (e) => (e.length ? e.map((x) => '<span class="it' + (x.hors ? ' ho' : '') + '">' + pictoH(x.f) + NOMF[x.f] + ' <b data-nature="simule">~' + (x.d > 0 ? '+' : '−') + frn(Math.abs(x.d), Math.abs(x.d) < 1.5 ? 1 : 0) + '</b>' + (Math.abs(x.d) >= 1.5 ? ' crans' : ' cran') + '</span>').join(' ') : '<span data-nature="simule">~ presque rien</span>');
  const hs = sp.hors(), ibH = ib.base + ib.lo > D.ibuStyle[1];
  document.getElementById('rep').innerHTML = '<span class="l1"><span class="qui">Face à ta stout</span>' + items(ecartsDe(AVANT)) + '<span class="sp1">' + (hs.length ? '<span class="ho">' + hs.length + ' hors du style</span>' : 'dans la 16D') + '</span><span class="sp1">' + (ibH ? '<span class="ho">trop amer</span>' : 'amertume tenue') + '</span></span>'
    + (av ? '<span class="l2"><i class="kl kl-g"></i><span class="qui">contre ton plan d’avant</span>' + items(ecartsDe(av.p)) + '</span>' : '');
  const id = a1.min === undefined ? a1.id : a1.min === 60 ? 'b60' : a1.min === 10 ? 'b10' : a1.min > 10 ? 'bmid' : 'bfin';
  document.getElementById('pq').innerHTML = (ETAT.h2 && ARRETS[ETAT.h2.k].id === 'puis' ? PQ.puis + ' ' : '') + PQ[id];
  // ce que montrent les deux dessins, en mots
  document.getElementById('ser').innerHTML = '<span><i class="kl kl-b"></i>' + nomJ(ETAT) + '</span>' + (av ? '<span><i class="kl kl-g"></i>plan d’avant, ' + nomJ(AVANT_PLAN) + ' ' + lieu(AVANT_PLAN) + '</span>' : '') + (P.parts ? '<span><i class="kl kl-m"></i>part de ' + ETAT.h2.h + '</span>' : '');
  // le résineux de ta dégustation : une fois, hors de la figure
  const ir = FAM.indexOf('resin');
  document.getElementById('res').innerHTML = pictoH('resin') + '<b>résineux</b> déjà hors style (ta dégustation), <span data-nature="simule">~+' + frn(P.p[ir][1] - AVANT[ir][1]) + (Math.round(P.p[ir][1] - AVANT[ir][1]) >= 2 ? ' points' : ' point') + '</span>';
  // l'amertume de toute la stout
  const W = 200, pc = (v) => Math.min(100, v / W * 100) + '%';
  document.getElementById('ibu-v').textContent = ibuTxt(ib);
  const x = document.getElementById('ibu-x'); x.textContent = ibH ? 'trop amer' : 'tenue'; x.className = 'ibu-x' + (ibH ? ' ho' : '');
  document.getElementById('ibu-n').style.width = pc(ib.base);
  const c = document.getElementById('ibu-c'); c.style.left = pc(ib.base); c.style.width = pc(ib.lo); c.classList.toggle('ho', ibH);
  const k = document.getElementById('ibu-k'); k.style.left = pc(ib.base + ib.lo); k.style.width = pc(ib.hi - ib.lo);
  document.getElementById('ibu-l').innerHTML = '<span style="left:0">Nugget 60′ ≈ ' + Math.round(ib.base) + '</span><span style="left:' + pc(50) + '" data-nature="mesure" data-source="BJCP 2021, 16D : 50–70 IBU (composes-houblon.json, styles)">16D 50–70</span>' + (ib.lo + ib.hi > 0.5 ? '<span style="right:0">+ ' + nomJ(ETAT) + ' ≈ ' + Math.round(ib.lo) + (ib.hi - ib.lo >= 1 ? '–' + Math.round(ib.hi) : '') + '</span>' : '');
  // la levure et la biotransformation (règle du moteur : dry hop actif seulement)
  const Bi = D.bio[ETAT.lev], bc = D.bioCas[ETAT.lev];
  const bioEl = document.getElementById('bio');
  bioEl.setAttribute('aria-label', 'Biotransformation, ' + ETAT.lev + ' : ' + Bi.statut + (bc && bc.cit ? ', citronellol simulé ' + frn(bc.cit.centre) + ' µg/L, de ' + frn(bc.cit.bas) + ' à ' + frn(bc.cit.haut) + ' (cas K4)' : ''));
  bioEl.innerHTML = a1.id === 'dryActive' ? '<span>' + pictoH('citrus') + 'citronellol <b data-nature="simule">~' + frn(bc && bc.cit ? bc.cit.centre : 0) + '</b> µg/L</span><span class="src-l">' + Bi.statut + '</span>' : '<span class="src-l">' + (a1.id === 'dryPost' ? 'levure au repos' : 'rien à chaud') + '</span>';
  // les réglages
  document.getElementById('pa-h1').innerHTML = '<i class="hpt" style="--h:' + D.couleurs[ETAT.h1.h] + '"></i>' + ETAT.h1.h + PICTO_OUVRE;
  document.getElementById('pa-h1').setAttribute('aria-expanded', String(ETAT.ouvert === 'h1'));
  document.getElementById('h2-zone').innerHTML = ETAT.h2 ? '<button class="pa h2" data-pa="h2" aria-expanded="' + (ETAT.ouvert === 'h2') + '"><i class="hpt" style="--h:' + D.couleurs[ETAT.h2.h] + '"></i>' + ETAT.h2.h + PICTO_OUVRE + '<span class="x" data-k="sans-h2" role="button" aria-label="Retirer ' + ETAT.h2.h + '">×</span></button>' : '<button class="pa ajt" data-pa="plus" data-reglage="ajout-cumule" data-role="reglage">' + ICO_PLUS + 'second houblon</button>';
  const pj = document.getElementById('pa-j'); pj.hidden = !sec(a1); pj.innerHTML = ETAT.j + ' j' + PICTO_OUVRE; pj.setAttribute('aria-expanded', String(ETAT.ouvert === 'j'));
  document.querySelectorAll('[data-dose]').forEach((b) => b.setAttribute('aria-checked', String(+b.dataset.dose === ETAT.d)));
  document.querySelectorAll('[data-lev]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.lev === ETAT.lev)));
  ouvre();
  echelle();
  frise();
  defi(P, ib);
  tire(P, T);
}
window.rendre = rendre;
const PICTO_CYCLE = ${JSON.stringify(ico('i-chev-r', 12))}, PICTO_OUVRE = ${JSON.stringify(ico('i-chev-d', 14))}, ICO_PLUS = ${JSON.stringify(ico('i-plus', 14))};
const PQ = ${JSON.stringify(pq)};
// ---------- les pastilles qui s'ouvrent (x1) ----------
function ouvre() {
  const o = document.getElementById('ouvre');
  if (!ETAT.ouvert) { o.hidden = true; o.innerHTML = ''; return; }
  o.hidden = false;
  if (ETAT.ouvert === 'h1' || ETAT.ouvert === 'h2' || ETAT.ouvert === 'plus') {
    const autre = ETAT.ouvert === 'h1' ? (ETAT.h2 && ETAT.h2.h) : ETAT.h1.h, cur = ETAT.ouvert === 'h1' ? ETAT.h1.h : ETAT.h2 && ETAT.h2.h;
    o.innerHTML = ['Citra', 'Cascade', 'Galaxy', 'Idaho 7'].filter((h) => h !== autre).map((h) => '<button data-choix="' + h + '" data-role="reglage" aria-pressed="' + (h === cur) + '"><i class="hpt" style="--h:' + D.couleurs[h] + '"></i>' + h + '</button>').join('') + (ETAT.ouvert === 'plus' ? '<span class="src-l">il se pose au même dry hop : glisse-le sur la frise, jusqu’à « puis » pour l’enchaîner</span>' : '');
  } else if (ETAT.ouvert === 'j') {
    o.innerHTML = D.jours.map((j) => '<button data-jour="' + j + '" aria-pressed="' + (j === ETAT.j) + '">' + j + ' j</button>').join('') + '<span class="src-l">au-delà de 3 j, plus rien de mesuré (H73)</span>';
  }
}
// ---------- le défi de ta dégustation (x5) ----------
function defi(P, ib) {
  const iF = FAM.indexOf('floral'), iR = FAM.indexOf('resin');
  const dF = crans(iF, P.p[iF][1]) - crans(iF, AVANT[iF][1]), dR = P.p[iR][1] - AVANT[iR][1], tot = ib.base + ib.lo;
  const deb = sp.hors();
  const ok = [dF >= 0.5, false, tot <= D.ibuStyle[1], !deb.length];
  document.getElementById('b-defi').innerHTML = 'Défi ' + ok.filter(Boolean).length + ' sur 4';
  document.getElementById('b-defi').setAttribute('aria-expanded', String(ETAT.defi));
  const el = document.getElementById('defi'); el.hidden = !ETAT.defi; if (!ETAT.defi) return;
  const ob = (cls, t, st, sous) => '<div class="dfo ' + cls + '"><b>' + t + '</b><span class="st">' + st + '</span><span class="src-l">' + sous + '</span></div>';
  el.innerHTML = '<p class="src-l">ta dégustation, 18.10 : « trop résineuse, je la veux plus florale »</p><div class="df">'
    + ob(ok[0] ? 'ok' : 'x', pictoH('floral') + 'plus floral', ok[0] ? 'atteint' : 'pas encore', '<span data-nature="simule">~' + (dF >= 0 ? '+' : '−') + frn(Math.abs(dF), 1) + ' cran</span>')
    + ob('imp', pictoH('resin') + 'moins résineux', 'hors houblon', 'le houblon en ajoute <span data-nature="simule">~+' + frn(dR) + (Math.round(dR) >= 2 ? ' points' : ' point') + '</span>')
    + ob(ok[2] ? 'ok' : 'x', 'amertume 50–70', ok[2] ? 'tenue' : 'trop amer', '<span data-nature="simule">' + ibuTxt(ib) + '</span>')
    + ob(ok[3] ? 'ok' : 'x', 'dans la 16D', ok[3] ? 'tenue' : deb.length + ' débordent', deb.length ? deb.map((f) => NOMF[f]).join(', ') : 'aucune famille ne déborde') + '</div>';
}
// ---------- vingt bières possibles (y5) : plages ouvertes comptées à part ----------
function tire(P, T) {
  document.getElementById('b-tire').setAttribute('aria-expanded', String(ETAT.tire));
  const el = document.getElementById('tire'); el.hidden = !ETAT.tire; if (!T) return;
  // Une plage ouverte (borne haute non publiée) se compte à part : son compte est un minimum (« au moins »).
  const cpt = FAM.map((f, i) => ({ f, i, k: T.filter((t) => t[i] != null && t[i] > ZONE[f][1]).length, ouv: !!P.p[i][3] })).filter((x) => x.f !== 'resin' && x.k > 0).sort((a, b) => b.k - a.k);
  const ferme = cpt.filter((x) => !x.ouv).slice(0, 3), ouv = cpt.filter((x) => x.ouv).slice(0, 3);
  const it = (x) => '<span class="it">' + pictoH(x.f) + NOMF[x.f] + ' <b data-nature="simule">' + x.k + ' sur 20</b></span>';
  const r1 = D.r4mmp[ETAT.h1.h];
  el.innerHTML = '<p><b data-nature="simule">20</b> bières tirées dans la plage du moteur, hors du style : ' + (ferme.length ? ferme.map(it).join('') : 'aucune famille à plage fermée') + '</p>'
    + (ouv.length ? '<p>plage ouverte, au moins : ' + ouv.map(it).join('') + ' <span class="src-l">(borne haute non publiée)</span></p>' : '')
    + (r1 ? '<p>' + pictoH('tropical') + 'ce qui tranche en vrai : 4MMP de ' + ETAT.h1.h + ' <span class="ms" data-nature="mesure" data-source="' + r1.source.replace(/"/g, '&quot;') + '">' + (r1.max == null ? '≥ ×' + frn(r1.min, 1) : '×' + frn(r1.min, r1.min < 1 ? 2 : 0) + '–' + frn(r1.max, 1)) + '</span> le seuil, même base</p>' : '')
    + '<p class="src-l">l’étendue du possible, pas une probabilité mesurée ; même tirage tant que rien ne change</p>';
}
// ---------- la frise : un jeton nommé par houblon, la loupe ×3 au-dessus du dock ----------
const fr0 = document.getElementById('fr');
document.getElementById('ticks').innerHTML = ARRETS.map((a) => '<i class="' + (a.court ? 'cle' : '') + '" style="left:' + (a.x * 100) + '%"></i>').join('');
function frise() {
  const J = [['h1', ETAT.h1]].concat(ETAT.h2 ? [['h2', ETAT.h2]] : []);
  const meme = ETAT.h2 && ETAT.h2.k === ETAT.h1.k;
  document.getElementById('jetons').innerHTML = J.map(([n, x]) => '<span class="jt' + (ETAT.actif === n ? ' actif' : '') + (TIRE && TIRE.n === n ? ' tire' : '') + '" data-jt="' + n + '" style="--h:' + D.couleurs[x.h] + ';left:' + ((TIRE && TIRE.n === n ? TIRE.u : ARRETS[x.k].x) * 100) + '%;transform:translateX(' + (-50 - 40 * Math.max(0, (TIRE && TIRE.n === n ? TIRE.u : ARRETS[x.k].x) - 0.85) / 0.15 + 40 * Math.max(0, 0.12 - (TIRE && TIRE.n === n ? TIRE.u : ARRETS[x.k].x)) / 0.12) + '%);top:' + (n === 'h2' ? (meme ? 0 : 2) : (meme ? 27 : 16)) + 'px" role="slider" tabindex="0" aria-label="Moment de ' + x.h + '" aria-valuetext="' + ARRETS[x.k].t + '">' + x.h + '</span>').join('');
  const arrets = ARRETS.map((a, k) => [a, k]).filter(([a]) => a.court && (a.id !== 'puis' || ETAT.h2));
  const cur = ETAT[ETAT.actif].k;
  document.getElementById('arrets').innerHTML = arrets.map(([a, k]) => '<button data-role="reglage" data-k="' + k + '" aria-current="' + (k === cur) + '">' + a.court + '</button>').join('');
}
let TIRE = null;
const pp = (u, n) => ARRETS.reduce((b, a, k) => ((a.id === 'puis' && n !== 'h2') ? b : Math.abs(a.x - u) < Math.abs(ARRETS[b].x - u) ? k : b), 0);
function loupe(u) {
  const L = document.getElementById('loupe'), a = ARRETS[ETAT[TIRE.n].k], Wp = fr0.clientWidth;
  L.hidden = false; L.style.left = (12 + Math.max(75, Math.min(Wp - 75, u * Wp))) + 'px';
  document.getElementById('loupe-t').textContent = (a.min !== undefined && a.min !== 60 && a.min !== 10 ? '≈ ' : '') + a.t;
  // la règle grossie trois fois ; le lieu courant n'est écrit qu'en grand, les voisins en petit
  const Z = 3, r = document.getElementById('loupe-r');
  r.innerHTML = ARRETS.map((b) => { const x = 75 + (b.x - u) * Wp * Z; if (x < -10 || x > 160) return ''; const bord = x < 14 || x > 136; const lab = b === a ? '' : b.min !== undefined ? (b.min % 10 === 0 ? b.min + '′' : '') : b.court; return '<i class="' + (b === a ? 'ici' : '') + '" style="left:' + x.toFixed(1) + 'px"></i>' + (lab && !bord ? '<span style="left:' + x.toFixed(1) + 'px">' + lab + '</span>' : ''); }).join('');
}
function retenir() { AVANT_PLAN = copie(ETAT); }
function suivre(e) {
  const r = fr0.getBoundingClientRect(), u = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
  TIRE.u = u;
  const k = pp(u, TIRE.n);
  if (k !== ETAT[TIRE.n].k) { ETAT[TIRE.n].k = k; try { navigator.vibrate && navigator.vibrate(4); } catch (x) {} rendre(); } else frise();
  loupe(u);
}
fr0.addEventListener('pointerdown', (e) => {
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  const t = e.target.closest('[data-jt]'), r = fr0.getBoundingClientRect(), u = (e.clientX - r.left) / r.width;
  // le jeton touché ; sinon le plus proche du doigt
  let n = t ? t.dataset.jt : 'h1';
  if (!t && ETAT.h2 && Math.abs(ARRETS[ETAT.h2.k].x - u) < Math.abs(ARRETS[ETAT.h1.k].x - u)) n = 'h2';
  retenir(); ETAT.actif = n; TIRE = { id: e.pointerId, n, u };
  fr0.setPointerCapture(e.pointerId); suivre(e); e.preventDefault();
});
fr0.addEventListener('pointermove', (e) => { if (TIRE && TIRE.id === e.pointerId) suivre(e); });
const lacher = (e) => { if (!TIRE || TIRE.id !== e.pointerId) return; TIRE = null; document.getElementById('loupe').hidden = true; rendre(); };
fr0.addEventListener('pointerup', lacher); fr0.addEventListener('pointercancel', lacher);
document.getElementById('arrets').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; const k = +b.dataset.k; const n = ARRETS[k].id === 'puis' ? 'h2' : ETAT.actif; retenir(); ETAT[n].k = k; ETAT.actif = n; rendre(); });
// ---------- les réglages ----------
document.querySelectorAll('[data-dose]').forEach((b) => b.addEventListener('click', () => { retenir(); ETAT.d = +b.dataset.dose; rendre(); }));
document.querySelectorAll('[data-lev]').forEach((b) => b.addEventListener('click', () => { retenir(); ETAT.lev = b.dataset.lev; rendre(); }));
document.getElementById('crit').addEventListener('click', () => { ETAT.critOuvert = !ETAT.critOuvert; echelle(); });
document.getElementById('crit-l').addEventListener('click', (e) => { const b = e.target.closest('[data-critv]'); if (!b) return; ETAT.crit = b.dataset.critv; ETAT.critOuvert = false; echelle(); });
document.querySelector('.regl').addEventListener('click', (e) => {
  if (e.target.closest('[data-k="sans-h2"]')) { retenir(); ETAT.h2 = null; ETAT.actif = 'h1'; ETAT.ouvert = null; if (ETAT.d === 2) ETAT.d = 4; rendre(); return; }
  const pa = e.target.closest('[data-pa]');
  if (pa) {
    const v = pa.dataset.pa;
    if (v === 'plus') { retenir(); const h = ['Galaxy', 'Idaho 7', 'Cascade', 'Citra'].find((x) => x !== ETAT.h1.h); ETAT.h2 = { h, k: ETAT.h1.k }; ETAT.d = 2; ETAT.actif = 'h2'; ETAT.ouvert = 'plus'; rendre(); return; }
    ETAT.ouvert = ETAT.ouvert === v ? null : v; rendre(); return;
  }
  const ch = e.target.closest('[data-choix]');
  if (ch) { retenir(); if (ETAT.ouvert === 'h1') ETAT.h1.h = ch.dataset.choix; else if (ETAT.h2) ETAT.h2.h = ch.dataset.choix; ETAT.ouvert = null; rendre(); return; }
  const jo = e.target.closest('[data-jour]');
  if (jo) { retenir(); ETAT.j = +jo.dataset.jour; ETAT.ouvert = null; rendre(); }
});
// ---------- les blocs à un toucher ----------
document.getElementById('pq-b').addEventListener('click', (e) => { const p = document.getElementById('pq'); p.hidden = !p.hidden; e.currentTarget.setAttribute('aria-expanded', String(!p.hidden)); });
document.getElementById('b-defi').addEventListener('click', () => { ETAT.defi = !ETAT.defi; rendre(); });
document.getElementById('b-tire').addEventListener('click', () => { ETAT.tire = !ETAT.tire; rendre(); });
const PV = document.getElementById('preuve'), PVV = document.querySelector('.pf-voile');
const preuve = (on) => { PV.hidden = !on; PVV.hidden = !on; };
document.getElementById('b-preuve').addEventListener('click', () => preuve(true));
document.querySelectorAll('[data-k="pf-fermer"]').forEach((b) => b.addEventListener('click', () => preuve(false)));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !PV.hidden) preuve(false); });
{ const q = new URLSearchParams(location.search); if (q.get('k')) ETAT.h1.k = +q.get('k'); if (q.has('preuve')) preuve(true); if (q.has('defi')) ETAT.defi = true; if (q.has('tire')) ETAT.tire = true; if (q.get('h2')) { ETAT.h2 = { h: q.get('h2'), k: q.get('k2') ? +q.get('k2') : ETAT.h1.k }; ETAT.d = 2; } }
rendre();
// Pour la preuve du geste (jouer-y1b.mjs) : les valeurs lues à l'écran.
window.__releve = () => ({ plan: document.getElementById('plan').innerText.replace(/\\s+/g, ' ').trim(), reponse: document.getElementById('rep').innerText.replace(/\\s+/g, ' ').trim(), ibu: document.getElementById('ibu-v').textContent + ' ' + document.getElementById('ibu-x').textContent, crans: Object.fromEntries(sp.rows.filter((c) => !c.hidden).map((c) => [c.dataset.famille, c.dataset.crans])), largeurs: Object.fromEntries(sp.rows.filter((c) => !c.hidden).map((c) => [c.dataset.famille, Math.round(c.querySelector('.sp-b').getBoundingClientRect().width)])), defi: document.getElementById('b-defi').textContent, echelle: document.getElementById('ech-l').innerText.replace(/\\s+/g, ' ').trim() });
`;

Y.ecrire(path.join(ici, 'etat.html'), Y.page({
  titre: 'Le brassin au doigt, seconde passe',
  commentaire: 'Lot 21 · y1b : y1 retouchée (critique/SYNTHESE.md) : frise en dock sous le pouce, jetons nommés et case « puis », état de départ dry hop actif US-05, réponse en une ligne, plan d’avant en pointillé, échelle par critère et pastilles de x1, jauge d’amertume de la stout (u3), défi (x5), vingt bières (y5), preuve (u5). Généré par generateur-y1b.mjs (../y1/socle/socle.mjs).',
  css, corps, script, hs: HS, data,
}));
