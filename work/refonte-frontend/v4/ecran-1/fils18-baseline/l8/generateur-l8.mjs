// Lot 18 · l8 · Typographique : q2b (c1) en grandes lettres, sur une grille noire franche, sans arrondis.
// La couleur ne sert qu'aux familles. Les réponses sont un tableau d'affichage (le verdict en capitales
// noires, un carré plein, à moitié ou vide) ; le moment de chaque groupe est son titre (« 10′ » en grand) ;
// les voies forment une matrice : une colonne par famille, le picto une seule fois en tête (en moins : les
// pictos répétés sur chaque ligne), la jauge en traits de la couleur de la famille. En plus : toucher une
// tête de colonne trie les voies de chaque groupe par cette famille.
// Usage : node generateur-l8.mjs  →  l8/etat-b.html, l8/planche.html
import {
  V, OBJ, ORDRE, NOM, REP, repLabel, HH_JS, MEMES, GESTES, AJOUTEES, ACC, CSS_FAMILLES, CSS_FICHE,
  symboles, ic, picto, MOMENT, usages, nomEl, stockMarque, ajc, bioPill, caseFam, couloirs, fonds, details,
  viseeS, viseeA, p, nomVoie, runtime, page, planche, ecrire,
} from './noyau.mjs';

const ICI = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/refonte-frontend/v4/ecran-1/fils18-baseline/l8';
// Les colonnes : les trois objectifs, puis toutes les familles qu'une voie au moins fait bouger, dans l'ordre du style.
const EXTRAS = ORDRE.filter((f) => !OBJ.includes(f) && V.some((X) => X.extras.some((t) => t.famille === f)));
const NCOL = OBJ.length + EXTRAS.length;

const CSS = `
  :root { --encre: #000; --gris: #4d4d4d; --papier: #fff; --acc: ${ACC}; --gut: 22px; --col: 16px;
    --fi-bg: #fff; --fi-tx: #000; --fi-tx2: #1f1f1f; --fi-gris: #4d4d4d; --fi-trait: #000; --fi-voile: rgba(0,0,0,.35); --fi-rad: 0;
    --r-anneau: #b3b3b3; --r-encre: #000; --r-plein: rgba(0,0,0,.08); }
  ${CSS_FAMILLES}
  * { box-sizing: border-box; margin: 0; padding: 0; border-radius: 0; }
  html, body { background: var(--papier); color: var(--encre); }
  body { font: 400 14px/1.2 "Helvetica Neue", Helvetica, Arial, sans-serif; -webkit-tap-highlight-color: transparent; font-variant-numeric: tabular-nums; }
  button, a { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; text-decoration: none; }
  svg { display: block; flex: none; }
  .ecran { max-width: 390px; margin: 0 auto; padding: 6px 12px 84px; display: flex; flex-direction: column; gap: 10px; overflow-x: hidden; }
  .cap { text-transform: uppercase; letter-spacing: .08em; font-size: 12px; font-weight: 700; }

  /* Le chrome : des cases noires, le choix courant en négatif. */
  .barre { display: flex; align-items: stretch; gap: 6px; height: 32px; }
  .retour { width: 32px; display: inline-flex; align-items: center; justify-content: center; box-shadow: inset 0 0 0 2px var(--encre); }
  .seg { display: flex; box-shadow: inset 0 0 0 2px var(--encre); }
  .barre .seg { flex: 1; } .barre .seg button { flex: 1; }
  .seg button { height: 32px; padding: 0 10px; font-size: 13px; font-weight: 700; color: var(--encre); white-space: nowrap; display: inline-flex; align-items: center; justify-content: center; gap: 4px; }
  .seg button + button { box-shadow: inset 2px 0 0 var(--encre); }
  .seg button[aria-checked="true"] { background: var(--encre); color: #fff; }
  .outils { display: flex; justify-content: space-between; gap: 8px; }

  /* Le tableau d'affichage : une ligne par objectif, le verdict en capitales. */
  .tabl { border-top: 3px solid var(--encre); border-bottom: 3px solid var(--encre); }
  .ob { display: grid; grid-template-columns: 1fr auto; align-items: end; gap: 2px 10px; padding: 6px 0 7px; }
  .ob + .ob { border-top: 1px solid var(--encre); }
  .ob .nom { grid-column: 1 / -1; display: flex; align-items: center; gap: 6px; }
  .ob .nom .pi { width: 16px; height: 16px; }
  .sens { font-weight: 900; font-size: 14px; width: 12px; text-align: center; }
  .rep { display: flex; align-items: center; gap: 8px; font: 900 27px/1 "Arial Black", "Helvetica Neue", Arial, sans-serif; letter-spacing: -.02em; text-transform: uppercase; }
  .rep small { font: 700 12px/1 "Helvetica Neue", Arial, sans-serif; letter-spacing: .08em; color: var(--gris); align-self: flex-end; margin-bottom: 3px; }
  .carre { width: 16px; height: 16px; box-shadow: inset 0 0 0 3px var(--encre); flex: none; }
  .v-atteint .carre { background: var(--encre); }
  .v-approche .carre { background: linear-gradient(90deg, var(--encre) 50%, transparent 50%); }
  .pa { position: relative; display: inline-flex; }
  .alerte { position: absolute; right: -3px; bottom: -3px; width: 8px; height: 8px; border-radius: 50%; background: var(--acc); box-shadow: 0 0 0 1.5px #fff; }
  .hh-b { height: 28px; padding: 0 6px 0 10px; font-size: 13px; font-weight: 700; display: inline-flex; align-items: center; gap: 2px; box-shadow: inset 0 0 0 2px var(--encre); white-space: nowrap; }
  .cible .tr { fill: #fff; stroke: var(--encre); stroke-width: 2; } .cible .pl { fill: var(--b); } .cible .vi { stroke: var(--encre); }

  /* Les demi-pistes de q2b, transparentes : le rail de ma bière est un filet noir épais. */
  .graph { position: relative; }
  .fonds { position: absolute; inset: 0; display: flex; pointer-events: none; }
  .moitie { position: relative; flex: 1; } .moitie .ov { position: absolute; inset: 0; }
  .gut { width: var(--gut); flex: none; position: relative; }
  .gut::before { content: ''; position: absolute; top: 0; bottom: 0; left: 9px; width: 4px; background: var(--encre); }
  .vl { position: absolute; top: 0; bottom: 0; width: 0; border-left: 1.5px dashed var(--encre); left: var(--s); z-index: 1; }
  body.abs .vl { left: var(--a); }
  .flou { position: absolute; top: 0; bottom: 0; right: var(--s0); width: var(--s1); background: repeating-linear-gradient(90deg, rgba(0,0,0,.09) 0 1px, transparent 1px 4px); }
  body.abs .flou { right: var(--a0); width: var(--a1); }
  .tetes { position: relative; display: flex; height: 30px; }
  .tetes .m { flex: 1; position: relative; } .tetes .g { width: var(--gut); flex: none; }
  .axe { position: absolute; top: 4px; height: 2px; background: var(--encre); }
  .g-ax { left: 2px; right: 0; } .d-ax { left: 0; right: 2px; }
  .g-ax::before, .d-ax::after { content: ''; position: absolute; top: -4px; border: 5px solid transparent; }
  .g-ax::before { left: -5px; border-right: 7px solid var(--encre); border-left: 0; } .d-ax::after { right: -5px; border-left: 7px solid var(--encre); border-right: 0; }
  .puce { position: absolute; top: 11px; font-size: 12px; font-weight: 700; padding: 2px 6px; white-space: nowrap; background: var(--encre); color: #fff; display: inline-flex; align-items: center; gap: 2px; text-transform: uppercase; letter-spacing: .06em; }
  .puce.gauche-v { left: 4px; } .fl .puce.v { left: calc(var(--s) - 24px); } body.abs .fl .puce.v { left: calc(var(--a) - 24px); }

  /* Le titre d'un groupe : son moment en grand. */
  .groupe { position: relative; z-index: 3; display: flex; align-items: flex-end; gap: 8px; padding-top: 6px; }
  .groupe > * { background: var(--papier); }
  .mo { display: inline-flex; align-items: flex-end; gap: 4px; font: 900 34px/0.9 "Arial Black", Arial, sans-serif; letter-spacing: -.03em; padding-right: 4px; }
  .mo .ic { margin-bottom: 4px; }
  .mo.mot { font-size: 24px; text-transform: uppercase; letter-spacing: -.01em; }
  .gt { display: flex; flex-direction: column; gap: 2px; padding-bottom: 1px; }
  .gt .cap { display: inline-flex; align-items: center; gap: 4px; }
  .dose, .est { font-size: 13px; font-weight: 700; color: var(--gris); }
  .bars { position: relative; display: flex; height: 34px; }
  .bars .m { position: relative; flex: 1; } .bars .g { width: var(--gut); flex: none; }
  .ln { position: absolute; left: 0; right: 0; height: 10px; } .ln.a { top: 0; } .ln.b { top: 17px; }
  .zt { position: absolute; bottom: -4px; height: 2px; width: var(--s); background: var(--b); }
  .zt::after { content: ''; position: absolute; top: -5px; width: 3px; height: 10px; background: var(--encre); }
  .fl .zt { left: 0; } .fl .zt::after { right: -1px; } .re .zt { right: 0; } .re .zt::after { left: -1px; }
  .zt.cs::after { display: none; } body.abs .zt.cs::after { display: block; } body.abs .zt.ca::after { display: none; } body.abs .zt { width: var(--a); }
  .bar { position: absolute; top: 0; height: 10px; min-width: 3px; width: var(--s); background: var(--b); z-index: 1; }
  body.abs .bar:not(.inconnu) { width: var(--a); }
  .fl .bar { left: 0; } .re .bar { right: 0; }
  .bar.ci { background: var(--f); box-shadow: inset 0 0 0 2px var(--b); }
  .bar.sf { background: #fff; box-shadow: inset 0 0 0 1px var(--b); }
  .bar.inconnu { width: 24px; background: repeating-linear-gradient(135deg, #fff 0 3px, #000 3px 4px); box-shadow: inset 0 0 0 1px #000; }
  .bar.ds::after, body.abs .bar.da::after { content: ''; position: absolute; top: 2px; right: 2px; border: 3px solid transparent; border-left: 5px solid #fff; }
  body.abs .bar.ds:not(.da)::after { display: none; }
  .hs { position: absolute; top: 0; height: 10px; left: var(--s0); width: var(--s1); background: var(--acc); z-index: 2; }
  .re .hs { left: auto; right: var(--s0); } body.abs .hs { left: var(--a0); width: var(--a1); } body.abs .re .hs { left: auto; right: var(--a0); }
  .lab-i { position: absolute; top: -3px; left: calc(var(--s) + 5px); font-size: 12px; font-weight: 700; white-space: nowrap; background: #fff; padding: 0 3px; z-index: 3; line-height: 16px; }
  body.abs .lab-i { left: calc(var(--a) + 5px); }
  .rangee { position: relative; padding: 4px 0 10px; }

  /* La matrice : une tête de colonnes, puis une ligne par voie, alignées sur la même grille. */
  .grille { display: grid; grid-template-columns: 1fr repeat(${OBJ.length}, var(--col)) 7px repeat(${EXTRAS.length}, var(--col)) 30px; column-gap: 1px; align-items: end; }
  .tete-m { position: sticky; top: 0; z-index: 6; background: #fff; border-bottom: 2px solid var(--encre); padding: 4px 0 3px; }
  .th { width: var(--col); height: 30px; display: inline-flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 2px; position: relative; }
  .th .pi { width: 14px; height: 14px; }
  .th.o::after { content: ''; width: 12px; height: 3px; background: var(--encre); }
  .th[aria-pressed="true"] { box-shadow: inset 0 -4px 0 var(--b); }
  .sep { width: 7px; align-self: stretch; box-shadow: inset 3px 0 0 #fff, inset 5px 0 0 var(--encre); }
  .tete-m .sep { box-shadow: none; }
  .tab { position: relative; z-index: 3; background: #fff; border-top: 2px solid var(--encre); margin: 0 0 12px; }
  .tab.seul { border-top: 1px solid var(--encre); margin: 0; background: none; z-index: auto; }
  .tab.seul .vr { background: #fff; position: relative; z-index: 3; }
  .tab.seul .rangee.in { padding: 6px 0 10px; }
  .vr { padding: 5px 0 6px; min-height: 44px; }
  .vr + .vr { border-top: 1px solid var(--encre); } .vr.coupe-l { border-top-width: 2px; }
  .id { display: flex; flex-direction: column; gap: 3px; min-width: 0; align-self: center; }
  .nm { font: 700 15px/1.1 "Arial Narrow", "Helvetica Neue", Arial, sans-serif; letter-spacing: .005em; }
  .f-source { background: #fff; }
  .hn { -webkit-touch-callout: none; -webkit-user-select: none; user-select: none; }
  .meta { display: flex; align-items: center; flex-wrap: wrap; gap: 3px 5px; color: var(--gris); }
  .q { font-size: 13px; font-weight: 700; color: var(--gris); white-space: nowrap; }
  .stk { display: inline-flex; color: var(--gris); }
  .us { display: inline-flex; align-items: center; color: var(--encre); height: 18px; padding: 0 3px; box-shadow: inset 0 0 0 1.5px var(--encre); }
  .us.deduit { box-shadow: none; padding: 0 1px; color: var(--gris); }
  .us .inc { font-size: 12px; }
  .ajc { width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; box-shadow: inset 0 0 0 2px var(--encre); align-self: center; }
  .ajc .i-check { display: none; }
  .ajc[aria-pressed="true"] { background: var(--encre); color: #fff; }
  .ajc[aria-pressed="true"] .i-check { display: block; } .ajc[aria-pressed="true"] .i-plus { display: none; }
  /* Une case : la jauge debout, un trait par cran du style, à la couleur de la famille. */
  .cf { width: var(--col); height: 24px; display: inline-flex; flex-direction: column; align-items: center; justify-content: flex-end; position: relative; }
  .cf.o { box-shadow: inset 0 0 0 0 transparent; }
  .jg { display: flex; flex-direction: column-reverse; gap: 2px; align-items: center; }
  .jg i { width: 12px; height: 4px; background: var(--b); }
  .cf.ci .jg i { background: var(--f); box-shadow: inset 0 0 0 1.5px var(--b); }
  .cf.sf .jg i { background: #fff; box-shadow: inset 0 0 0 1px var(--b); }
  .jg i.pt { width: 4px; height: 4px; }
  .jg.bas i { background: #fff !important; box-shadow: inset 0 0 0 1.5px var(--encre) !important; }
  .jg.xs i { background: var(--acc) !important; box-shadow: none !important; }
  .jg.ne i { width: 12px; height: 12px; background: repeating-linear-gradient(135deg, #fff 0 2px, #000 2px 3px); box-shadow: inset 0 0 0 1px #000; }
  .cf.vide::after { content: ''; width: 2px; height: 2px; background: #000; margin-bottom: 1px; }
  .cf.moins::before { content: ''; position: absolute; bottom: 7px; left: 3px; width: 10px; height: 2px; background: var(--encre); }
  .cf.tri { box-shadow: inset 0 -2px 0 var(--b); }

  details.bio { display: inline-block; }
  details.bio summary { list-style: none; display: inline-flex; align-items: center; gap: 2px; height: 22px; padding: 0 3px; background: repeating-linear-gradient(135deg, #fff 0 3px, #d6d6d6 3px 5px); box-shadow: inset 0 0 0 1.5px var(--encre); cursor: pointer; }
  details.bio summary::-webkit-details-marker { display: none; }
  .bt { display: inline-flex; align-items: center; gap: 1px; background: #fff; padding: 0 2px; height: 16px; }
  .bt .pi { width: 13px; height: 13px; }
  .bt.mot span { font-size: 12px; font-weight: 700; margin-left: 2px; }
  details.bio[open] ul { position: absolute; left: 0; right: 0; z-index: 7; background: #fff; box-shadow: inset 0 0 0 2px var(--encre); padding: 10px 12px 10px 26px; font-size: 13px; display: flex; flex-direction: column; gap: 6px; }
  .src { color: var(--gris); font-size: 12px; }
  details.pli { border-top: 2px solid var(--encre); padding: 8px 0; }
  details.pli summary { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; cursor: pointer; }
  details.pli ul { margin: 8px 0 0 16px; display: flex; flex-direction: column; gap: 6px; font-size: 13px; }

  .cmp { position: fixed; z-index: 8; left: 50%; transform: translateX(-50%); bottom: 12px; width: 366px; max-width: calc(100% - 24px); height: 44px; background: var(--encre); color: #fff;
    display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 15px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; box-shadow: 0 0 0 3px #fff; }

  ${CSS_FICHE}
  .f-feuille { border-top: 4px solid var(--encre); }
  .f-bulle { box-shadow: inset 0 0 0 3px var(--encre); }
  .f-nom { font: 900 28px/1 "Arial Black", Arial, sans-serif; letter-spacing: -.03em; }
  .f-tete { border-bottom: 2px solid var(--encre); padding-bottom: 6px; }
  .f-fermer { box-shadow: inset 0 0 0 2px var(--encre); }
  .f-aa { font: 900 24px/1 "Arial Black", Arial, sans-serif; letter-spacing: -.02em; }
  .f-role { box-shadow: inset 0 0 0 2px var(--encre); font-weight: 700; text-transform: uppercase; font-size: 12px; letter-spacing: .06em; }
  .f-role.regle { box-shadow: none; outline: 2px dashed var(--encre); outline-offset: -2px; }
  .c { background: #fff; box-shadow: inset 0 0 0 1px #b3b3b3; }
  .c.m { background: var(--b); box-shadow: none; }
  .c.ci { background: var(--f); box-shadow: inset 0 0 0 2px var(--b); }
  .f-bande { gap: 1px; } .f-bande .c { width: 20px; height: 20px; }
  .f-lab-n { text-transform: uppercase; font-size: 13px; letter-spacing: .04em; }
  .r-lab { font-family: "Arial Narrow", Arial, sans-serif; font-size: 13px; } .r-lab.dem { font-weight: 700; text-transform: uppercase; }
  .r-serie { stroke-width: 2.5; }
  .f-dem-i b { text-transform: uppercase; letter-spacing: .04em; }
  .f-gout { box-shadow: inset 0 0 0 2px var(--encre); }
  .f-g[aria-pressed="true"] { background: var(--encre); color: #fff; }
  .f-act { box-shadow: inset 0 0 0 2px var(--encre); text-transform: uppercase; font-size: 13px; letter-spacing: .06em; }
  .f-ajouter { background: var(--encre); color: #fff; }
  .f-repli { box-shadow: inset 0 -2px 0 var(--encre); padding: 0 4px; font-weight: 700; text-transform: uppercase; font-size: 12px; letter-spacing: .06em; }
  .f-tag { box-shadow: inset 0 0 0 1px var(--encre); }
  .f-rg { border-bottom: 1px solid #b3b3b3; padding-bottom: 3px; }
  @keyframes appui { from { box-shadow: inset 0 -2px 0 #000; } to { box-shadow: inset 0 -16px 0 #000; color: #fff; } }
  .appui .hn { animation: appui 500ms linear forwards; }
`;

const tete = () => `
  <div class="barre">
    <a class="retour" href="#" aria-label="Retour">${ic('chev-l', 18)}</a>
    <div class="seg" role="radiogroup" aria-label="Partie">${['Ma bière', 'Suggestions', 'Comparer'].map((x) => `<button role="radio" aria-checked="${x === 'Suggestions'}">${x}</button>`).join('')}</div>
  </div>
  <div class="outils">
    <div class="seg lentille" role="radiogroup" aria-label="Lecture des familles"><button role="radio" data-e="style" aria-checked="true">Au style</button><button role="radio" data-e="absolu" aria-checked="false">Absolu</button></div>
    <div class="seg" role="radiogroup" aria-label="Vue"><button role="radio" aria-checked="true">${ic('barres', 14)}Barres</button><button role="radio" aria-checked="false">${ic('radar', 14)}Radar</button></div>
  </div>`;
function cible(frac, visee, f) {
  const w = 120, x = Math.round(visee * w), b = Math.round(Math.min(1, frac) * w);
  return `<svg class="cible" width="${w}" height="24" viewBox="0 0 ${w} 24" aria-hidden="true" data-famille="${f}"><rect class="tr" x="1" y="8" width="${w - 2}" height="8"/><rect class="pl" x="1" y="8" width="${b}" height="8"/><line class="vi" x1="${x}" y1="0" x2="${x}" y2="24" stroke-width="3"/></svg>`;
}
const ligneOb = (f, sens, label, droite, extra = '') => `
    <section class="ob" data-role="objectif" data-famille="${f}" aria-label="${repLabel[f]}">
      <span class="nom cap"><span class="sens" aria-hidden="true">${sens > 0 ? '↑' : '↓'}</span><span class="pa">${picto(f, 16)}${extra}</span>${label}</span>
      <div class="rep v-${REP[f].verdict}" data-role="reponse" data-famille="${f}" data-verdict="${REP[f].verdict}"><i class="carre" aria-hidden="true"></i>${REP.MOT[REP[f].verdict]}${f === 'resin' ? '<small>voie houblon</small>' : ''}</div>
      ${droite}
    </section>`;
const reponses = () => `
  <div class="tabl">
    ${ligneOb('resin', -1, 'Moins résineux', `<button class="hh-b" onclick="${HH_JS}">Hors houblon${ic('chev-r', 14)}</button>`, '<i class="alerte"></i>')}
    ${ligneOb('floral', 1, 'Plus floral', cible(REP.floral.frac / 1.15, 1 / 1.15, 'floral'))}
    ${ligneOb('citrus', 1, 'Plus agrumes', cible(REP.citrus.frac / 1.7, 1 / 1.7, 'citrus'))}
  </div>`;
const tetes = () => `
    <div class="tetes" aria-hidden="true">
      <div class="m re"><i class="axe g-ax"></i><span class="puce gauche-v">${ic('chev-l', 12)}visée</span></div>
      <div class="g"></div>
      <div class="m fl"><i class="axe d-ax"></i><span class="puce v" style="--s:${p(viseeS('floral'))};--a:${p(viseeA('floral'))}">visée</span></div>
    </div>`;
const teteMatrice = () => `
    <div class="grille tete-m" role="group" aria-label="Trier les voies par famille">
      <span></span>${OBJ.map((f) => `<button class="th o" data-tri="${f}" data-famille="${f}" aria-pressed="false" aria-label="Trier par ${NOM[f].toLowerCase()}">${picto(f, 14)}</button>`).join('')}<i class="sep"></i>${EXTRAS.map((f) => `<button class="th" data-tri="${f}" data-famille="${f}" aria-pressed="false" aria-label="Trier par ${NOM[f].toLowerCase()}">${picto(f, 14)}</button>`).join('')}<span></span>
    </div>`;
const ligne = (X, cls = '', i = 0) => {
  const { q } = nomVoie(X.v), hop = !X.v.levureVers;
  const dose = X.v.type === 'assemblage' ? '<span class="q">5+5 g ≈</span>' : q ? `<span class="q">${q}</span>` : '';
  const o = { sansPicto: true };
  return `<div class="vr grille${cls}" data-voie="${X.n}" data-ordre="${i}"${hop ? ' data-role="ligne-houblon"' : ''}>
        <div class="id">${nomEl(X)}<span class="meta">${usages(X.v, 14)}${dose}${stockMarque(X.v, 14)}${bioPill(X, 13)}</span></div>
        ${OBJ.map((f) => caseFam(X, f, true, o)).join('')}<i class="sep"></i>${EXTRAS.map((f) => caseFam(X, f, false, o)).join('')}
        ${ajc(X)}
      </div>`;
};
const moTitre = (id) => { const [t, k, lg] = MOMENT[id]; const mot = !/′$/.test(t); return `<span class="mo${mot ? ' mot' : ''}" data-role="moment" data-moment="${id}" aria-label="Moment : ${lg}">${mot ? ic(k, 16) : ''}${t}</span>`; };
const blocMeme = (g) => `
    <div class="groupe">${moTitre(g.moment)}<span class="gt"><span class="cap">${ic('egal', 12)}${g.gi ? 'même effet' : 'même effet sur tes objectifs'}</span><span class="dose">${g.dose}</span></span></div>
    <div class="rangee">${couloirs(g.voies[0], true)}</div>
    <div class="tab">${g.voies.map((X, i) => ligne(X, g.coupe(i) ? ' coupe-l' : '', i)).join('')}</div>`;
const blocGeste = (g) => `
    <div class="groupe">${moTitre(g.mo)}<span class="gt"><span class="cap">${g.ic ? ic(g.ic, 12) : ''}${g.t}</span>${g.est ? '<span class="est">estimé</span>' : ''}</span></div>
    ${g.voies.map((X) => `<div class="tab seul">${ligne(X)}<div class="rangee in">${couloirs(X, false)}</div></div>`).join('')}`;
const corps = `${tete()}${reponses()}
  <div class="graph">${fonds()}${tetes()}${teteMatrice()}
    ${MEMES.map(blocMeme).join('')}
    ${GESTES.map(blocGeste).join('')}
  </div>
  ${details()}
  <a class="cmp" data-role="comparer" href="../../fils15-s5-complexe/q2b/comparer.html">Comparer <b class="nb">(${AJOUTEES.length})</b></a>`;
// Trier : la colonne touchée range les voies de chaque groupe, de la plus forte à la plus faible ; retoucher rend l'ordre de q2b.
const TRI = `
document.querySelectorAll('.th[data-tri]').forEach((b) => b.addEventListener('click', () => {
  const on = b.getAttribute('aria-pressed') !== 'true', f = b.dataset.tri;
  document.querySelectorAll('.th[data-tri]').forEach((x) => x.setAttribute('aria-pressed', String(on && x === b)));
  document.querySelectorAll('.cf.tri').forEach((x) => x.classList.remove('tri'));
  document.querySelectorAll('.tab:not(.seul)').forEach((t) => {
    const rs = [...t.querySelectorAll(':scope > .vr')];
    const val = (r) => { const c = r.querySelector('.cf[data-famille="' + f + '"][data-crans]'); return c ? parseFloat(c.dataset.crans) : -99; };
    rs.sort((a, z) => (on ? val(z) - val(a) : 0) || a.dataset.ordre - z.dataset.ordre).forEach((r) => t.append(r));
    rs.forEach((r, i) => r.classList.toggle('coupe-l', false));
  });
  if (on) document.querySelectorAll('.cf[data-famille="' + f + '"][data-crans]').forEach((c) => c.classList.add('tri'));
}));`;
const SYMB = symboles({ trait: 2 });
ecrire(ICI + '/etat-b.html', page({
  titre: 'Typographique · Suggestions', css: CSS, symb: SYMB, corps, js: runtime({ extra: TRI }),
  commentaire: 'Lot 18 · l8 · Typographique, sur q2b (c1). Même contenu que q2b. En moins : le picto de famille répété sur chaque ligne (il est en tête de colonne, une fois). En plus : toucher une tête de colonne trie les voies de chaque groupe par cette famille ; l\'appui long (500 ms) ou le survol (750 ms) sur un houblon, ou sur sa ligne, ouvre sa fiche g1.',
}));

// ---------- la planche ----------
const X1 = V[0];
const fig = (c, mot) => `<figure><div class="ech">${c}</div><figcaption>${mot}</figcaption></figure>`;
const ABC = [
  fig('<span class="sw" style="background:#fff"></span><span class="sw" style="background:#000"></span><span class="sw filet"></span>', 'papier'),
  fig('<span class="aa">Aa</span><span class="aa n">Aa</span>', 'lettres'),
  fig(`<button class="ajc" aria-pressed="false" aria-label="Ajouter">${ic('plus', 16, 'ic i-plus')}${ic('check', 16, 'ic i-check')}</button><button class="ajc" aria-pressed="true" aria-label="Ajouté">${ic('plus', 16, 'ic i-plus')}${ic('check', 16, 'ic i-check')}</button>`, 'ajouter'),
  fig(`<span class="th o">${picto('floral', 14)}</span>${caseFam(X1, 'citrus', true, { sansPicto: true })}${caseFam(X1, 'tropical', false, { sansPicto: true })}${caseFam(V[14], 'citrus', true, { sansPicto: true })}`, 'colonne'),
  fig(`<div class="mbar">${couloirs(X1, false)}</div>`, 'piste'),
  fig('<span class="mini-cmp">Comparer</span>', 'action'),
  fig('<span class="rep v-atteint"><i class="carre"></i></span><span class="rep v-approche"><i class="carre"></i></span><span class="rep v-aucune"><i class="carre"></i></span>', 'verdict'),
  fig('<span class="mo">10′</span>', 'moment'),
  fig('<span class="rep mini-r">Atteint</span>', 'réponse'),
].join('');
const CSS_PL = CSS + `
  .mini { box-shadow: 0 0 0 2px #000; }
  .abc { border-top: 3px solid #000; padding-top: 10px; }
  .abc figcaption { text-transform: uppercase; letter-spacing: .08em; font-weight: 700; font-size: 12px; }
  .sw { width: 26px; height: 34px; box-shadow: inset 0 0 0 2px #000; margin: 0 2px; } .sw.filet { width: 4px; background: #000; }
  .aa { font: 900 30px/1 "Arial Black", Arial, sans-serif; margin: 0 4px; } .aa.n { font: 700 24px/1 "Arial Narrow", Arial, sans-serif; }
  .abc .ajc { margin: 0 3px; }
  .abc .cf, .abc .th { margin: 0 3px; }
  .mbar { width: 110px; }
  .mini-cmp { height: 32px; padding: 0 12px; background: #000; color: #fff; display: inline-flex; align-items: center; font-weight: 700; font-size: 12px; letter-spacing: .14em; text-transform: uppercase; }
  .abc .rep { margin: 0 3px; } .mini-r { font-size: 22px; }`;
ecrire(ICI + '/planche.html', planche({ titre: 'Typographique · planche', css: CSS_PL, symb: SYMB, abc: ABC }));
