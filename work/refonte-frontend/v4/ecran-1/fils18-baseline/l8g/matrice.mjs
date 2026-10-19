// Lot 18 · la disposition de l8 pour l8g et l8h (reprise de l8e, que l8g et l8h prolongent ; l8e et l8f restent tels quels) (l8b retenu, « C'est la meilleure version »), avec trois
// demandes du brasseur sur l8b :
//   « Pas d'info sur les AA, j'en vrai valeur » : sur chaque voie, chaque houblon montre l'α de son lot en
//     stock (qui fait la dose), puis la plage de ses fiches en plus petit ; à acheter, sans lot, la plage
//     seule ; un lot hors des plages de ses fiches porte un signe discret (≠, sans orangé) ; Citra cryo
//     porte les plages du Citra en pellets (c1 : voies[].fiches[].alpha) ;
//   « Tu peux même mettre un peu plus d'icone et autre, mais il faut un bouton légende un peu caché » :
//     usage, marque de moment, stock et biotransformation en pictos sur chaque voie ; un petit « ? » dans
//     l'en-tête ouvre la légende ;
//   « Meilleures bar » (l5b) : les barres de l5b à la place des jauges, une par case, assez longues pour se
//     lire au doigt (8 px par cran au lieu de 6, 13 px de large au lieu de 7), devant la zone du style.
// Sur l8e, trois retours du brasseur (19.10, ~21 h) :
//   « Les icône sont pas parlant du tout » (goutte, souffle, les deux) : l'usage se dit par un mot (l8g :
//     « amérisant », « aromatique », « mixte » ; l8h : une pastille « amer », « arôme », « mixte ») ;
//   « Ça c'est inutile » (la bande « ‹ visée | visée » et ses flèches) : retirée ; sur les barres de groupe,
//     la visée n'est plus qu'un tiret sans mot, sur la ligne de sa famille, qui ne passe sous aucun texte ;
//   « La barre là, c'est mieux mais il y avait mieux » : sous chaque objectif, la piste de l5b, sur toute la
//     largeur : le rail de ma bière, la zone du style en pâle, la barre de la meilleure voie, la visée écrite.
// Le reste est la disposition de l8 : verdicts en tête, moment en titre de groupe, matrice une colonne par
// famille, picto une fois en tête de colonne fixe, tri au toucher.
import {
  V, OB, DEG, cl, OBJ, ORDRE, NOM, COURT, JET, REP, repLabel, HH_JS, MEMES, GESTES, AJOUTEES, CSS_FAMILLES, CSS_FICHE, STOCK,
  ic, picto, MOMENT, momentDe, usage, nomVoie, stockMarque, ajc, bioPill, couloirs, fonds, details, zone, cran, niv, NIVMOT,
  sg, crTxt, fr, viseeS, viseeA, p, runtime, page, planche, ecrire,
} from './noyau.mjs';

export let USAGE = 'mot';
export const reglerUsage = (u) => { USAGE = u; };
const MOT_US = { amérisant: 'amérisant', aromatique: 'aromatique', double: 'mixte', inconnu: 'inconnu' };
const COURT_US = { amérisant: 'amer', aromatique: 'arôme', double: 'mixte', inconnu: 'inconnu' };
function usageMot(h) {
  const u = h.role || 'inconnu', src = /^fournisseur/.test(h.roleSource || '') ? 'fournisseur' : 'règle';
  const dit = src === 'fournisseur' ? 'attesté par le fournisseur' : 'déduit de l\'α, à valider';
  const pic = USAGE === 'pastille' ? ({ amérisant: ic('goutte', 12), aromatique: ic('arome', 12), double: ic('goutte', 12) + ic('arome', 12) }[u] || '') : '';
  return `<span class="us us-${USAGE}${src === 'règle' ? ' deduit' : ''}" data-role="usage" data-usage="${u}" data-source="${src}" data-houblon="${h.houblon}" aria-label="${h.houblon} : ${u}, ${dit}">${pic}<span class="us-m">${(USAGE === 'pastille' ? COURT_US : MOT_US)[u]}</span></span>`;
}
export const EXTRAS = ORDRE.filter((f) => !OBJ.includes(f) && V.some((X) => X.extras.some((t) => t.famille === f)));
const HC = 24, PXC = 8; // une barre : 8 px par cran du style, 3 crans au plus dans la case (au-delà : la flèche « dépasse »)
const rgba = (h, a) => 'rgba(' + [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)).join(',') + ',' + a + ')';

export const CSS_STRUCTURE = `
  ${CSS_FAMILLES}
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background-color: var(--page); color: var(--encre); }
  body { font: 400 14px/1.2 var(--sans); -webkit-tap-highlight-color: transparent; font-variant-numeric: tabular-nums; }
  button, a { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; text-decoration: none; }
  svg { display: block; flex: none; }
  .ecran { max-width: 390px; margin: 0 auto; padding: 6px 12px 84px; display: flex; flex-direction: column; gap: 8px; overflow-x: hidden; --col: 20px; }
  .barre { display: flex; align-items: center; gap: 6px; height: 34px; }
  .retour { width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; flex: none; }
  .seg { display: flex; }
  .barre .seg { flex: 1; } .barre .seg button { flex: 1; }
  .seg button { height: 28px; padding: 0 10px; font-size: 12px; white-space: nowrap; display: inline-flex; align-items: center; justify-content: center; gap: 4px; }
  .outils { display: flex; justify-content: space-between; gap: 8px; }
  .leg-b { width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; flex: none; color: var(--gris); }
  .leg-b[aria-expanded="true"] { color: var(--encre); }

  .tabl { display: flex; flex-direction: column; }
  .ob { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 1px 10px; padding: 5px 0 6px; }
  .ob .nom { grid-column: 1 / -1; display: flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; }
  .ob .pa { position: relative; display: inline-flex; }
  .alerte { position: absolute; right: -3px; bottom: -3px; width: 8px; height: 8px; border-radius: 50%; background: var(--acc); }
  .rep { display: flex; align-items: center; gap: 6px; font: 700 16px/1.15 var(--sans); }
  .rep small { font: 600 12px/1 var(--sans); letter-spacing: 0; color: var(--gris); align-self: flex-end; margin-bottom: 3px; }
  .hh-b { height: 28px; padding: 0 6px 0 10px; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 2px; white-space: nowrap; }

  .graph { position: relative; }
  .fonds { position: absolute; inset: 0; display: flex; pointer-events: none; }
  .moitie { position: relative; flex: 1; } .moitie .ov { position: absolute; inset: 0; }
  .gut { width: 22px; flex: none; position: relative; }
  .gut::before { content: ''; position: absolute; top: 0; bottom: 0; left: 9.5px; width: 3px; background: var(--rail); }
  .vl { position: absolute; top: 0; bottom: 0; width: 0; border-left: 1.5px dashed var(--vise); left: var(--s); z-index: 1; }
  body.abs .vl { left: var(--a); }
  .flou { position: absolute; top: 0; bottom: 0; right: var(--s0); width: var(--s1); }
  body.abs .flou { right: var(--a0); width: var(--a1); }
  .tetes { position: relative; display: flex; height: 30px; }
  .tetes .m { flex: 1; position: relative; } .tetes .g { width: 22px; flex: none; }
  .axe { position: absolute; top: 4px; height: 1.5px; background: var(--rail); }
  .g-ax { left: 2px; right: 0; } .d-ax { left: 0; right: 2px; }
  .g-ax::before, .d-ax::after { content: ''; position: absolute; top: -3.5px; border: 4.25px solid transparent; }
  .g-ax::before { left: -4px; border-right: 6px solid var(--rail); border-left: 0; } .d-ax::after { right: -4px; border-left: 6px solid var(--rail); border-right: 0; }
  .puce { position: absolute; top: 10px; font-size: 12px; font-weight: 600; padding: 2px 7px; white-space: nowrap; display: inline-flex; align-items: center; gap: 2px; }
  .puce.gauche-v { left: 4px; } .fl .puce.v { left: calc(var(--s) - 22px); } body.abs .fl .puce.v { left: calc(var(--a) - 22px); }

  .groupe { position: relative; z-index: 3; display: flex; align-items: center; gap: 8px; min-height: 28px; padding-top: 2px; }
  .mo { display: inline-flex; align-items: center; gap: 4px; font: 600 14px/1.2 var(--mono); padding: 0 2px 0 0; color: var(--moment); white-space: nowrap; }
  .mo.mot { font: 700 14px/1.2 var(--sans); }
  .gt { display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap; }
  .gt .t { display: inline-flex; align-items: center; gap: 4px; font-size: 14px; font-weight: 600; }
  .dose { font: 500 12px var(--mono); color: var(--gris); } .est { font-size: 12px; color: var(--gris); }
  .bars { position: relative; display: flex; height: 32px; }
  .bars .m { position: relative; flex: 1; } .bars .g { width: 22px; flex: none; }
  .ln { position: absolute; left: 0; right: 0; height: 10px; } .ln.a { top: 0; } .ln.b { top: 16px; }
  .zt { position: absolute; bottom: -4px; height: 2.5px; width: var(--s); background: var(--b); }
  .zt::after { content: ''; position: absolute; top: -4px; width: 2.5px; height: 8px; background: var(--encre); }
  .fl .zt { left: 0; } .fl .zt::after { right: -1px; } .re .zt { right: 0; } .re .zt::after { left: -1px; }
  .zt.cs::after { display: none; } body.abs .zt.cs::after { display: block; } body.abs .zt.ca::after { display: none; } body.abs .zt { width: var(--a); }
  .bar { position: absolute; top: 0; height: 10px; min-width: 3px; width: var(--s); background: var(--b); z-index: 1; }
  body.abs .bar:not(.inconnu) { width: var(--a); }
  .fl .bar { left: 0; } .re .bar { right: 0; }
  .bar.inconnu { width: 24px; }
  .bar.ds::after, body.abs .bar.da::after { content: ''; position: absolute; top: 2px; right: 2px; border: 3px solid transparent; border-left: 5px solid #fff; }
  body.abs .bar.ds:not(.da)::after { display: none; }
  .hs { position: absolute; top: 0; height: 10px; left: var(--s0); width: var(--s1); background: var(--acc); z-index: 2; }
  .re .hs { left: auto; right: var(--s0); } body.abs .hs { left: var(--a0); width: var(--a1); } body.abs .re .hs { left: auto; right: var(--a0); }
  .lab-i { position: absolute; top: -3px; left: calc(var(--s) + 5px); font: 600 12px var(--mono); white-space: nowrap; padding: 0 4px; z-index: 3; line-height: 16px; }
  body.abs .lab-i { left: calc(var(--a) + 5px); }
  .rangee { position: relative; padding: 2px 0 10px; }

  /* La matrice : la tête de colonnes, puis une voie sur deux lignes : ses houblons et leur α, puis ses
     pictos (usage, moment, dose, stock) et une barre par famille. */
  .grille { display: grid; grid-template-columns: 1fr repeat(${OBJ.length}, var(--col)) 8px repeat(${EXTRAS.length}, var(--col)) 30px; column-gap: 1px; align-items: end; }
  .tete-m { position: sticky; top: 0; z-index: 6; padding: 4px 0; }
  .th { width: var(--col); height: 30px; display: inline-flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 2px; position: relative; }
  .th .pi { width: 18px; height: 18px; }
  .th.o::after { content: ''; width: 12px; height: 3px; border-radius: 2px; background: var(--encre); }
  .th[aria-pressed="true"]::before { content: ''; position: absolute; left: 1px; right: 1px; bottom: -4px; height: 3px; border-radius: 2px; background: var(--b); }
  .sep { width: 8px; align-self: stretch; }
  .tab { position: relative; z-index: 3; margin: 0 0 10px; }
  .tab.seul { margin: 0; z-index: auto; }
  .tab.seul .vr { position: relative; z-index: 3; }
  .tab.seul .rangee.in { padding: 4px 0 10px; }
  .vr { padding: 5px 0 5px; row-gap: 3px; position: relative; }
  .vr .l1 { grid-column: 1 / -2; grid-row: 1; display: flex; align-items: baseline; flex-wrap: wrap; gap: 2px 6px; min-width: 0; min-height: 20px; }
  .vr .id { grid-column: 1; grid-row: 2; display: flex; align-items: center; flex-wrap: wrap; gap: 3px; min-width: 0; align-self: center; }
  .vr > .cf, .vr > .sep { grid-row: 2; }
  .vr > .ajc { grid-column: -2; grid-row: 1 / span 2; align-self: center; }
  .nm { display: contents; }
  .hb { display: inline-flex; align-items: baseline; gap: 5px; white-space: nowrap; }
  .hn { font-size: 14px; font-weight: 600; line-height: 1.2; -webkit-touch-callout: none; -webkit-user-select: none; user-select: none; }
  .plus, .env { display: inline-flex; align-self: center; color: var(--gris); } .env { margin-left: 2px; }
  /* L'α : le lot en stock (mono, encre), puis la plage des fiches, plus discrète, après un petit livre. */
  .al { display: inline-flex; align-items: center; gap: 2px; font: 600 12px/1 var(--mono); color: var(--encre); }
  .al.lot::before { content: 'α'; font: 400 12px var(--sans); color: var(--gris); margin-right: 1px; }
  .al.fi { font-weight: 400; color: var(--gris); }
  .al .ic { color: var(--gris); }
  .al .pel { font: 400 12px var(--sans); margin-left: 3px; }
  .q { font: 500 12px var(--mono); color: var(--gris); white-space: nowrap; }
  .stk, .mo-m { display: inline-flex; color: var(--gris); }
  .us { display: inline-flex; align-items: center; height: 18px; color: var(--encre); }
  .us.deduit { opacity: .45; }
  .us .inc { font-size: 12px; }
  .ajc { width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; }
  .ajc .i-check { display: none; }
  .ajc[aria-pressed="true"] .i-check { display: block; } .ajc[aria-pressed="true"] .i-plus { display: none; }
  /* Une case : la barre de l5b, debout, à la hauteur de ses crans (8 px par cran), devant la zone du
     style (pâle, son plafond en filet du ton texte) ; l'orangé au-delà du style ; un trait noir pour une baisse. */
  .cf { width: var(--col); display: inline-flex; flex-direction: column; align-items: center; justify-content: flex-end; position: relative; }
  .mb-z { position: relative; width: 17px; height: ${HC + 3}px; }
  .mb-z::after { content: ''; position: absolute; left: 0; right: 0; bottom: 2px; height: 1px; background: var(--trait2); }
  .mb-b { position: absolute; left: 2px; right: 2px; bottom: 3px; height: var(--s); background: var(--b); border-radius: 2px 2px 0 0; z-index: 1; }
  body.abs .mb-b { height: var(--a); }
  .cf.ci .mb-b { background: var(--b40); box-shadow: inset 0 0 0 1.5px var(--b); }
  .cf.sf .mb-b { background: #fff; box-shadow: inset 0 0 0 1px var(--b); }
  .cf.bas .mb-b { height: 3px !important; border-radius: 0; background: var(--encre); box-shadow: none; bottom: 1px; }
  .mb-x { position: absolute; left: 0; right: 0; top: 0; height: var(--s); background: var(--acc); border-radius: 2px 2px 0 0; }
  body.abs .mb-x { height: var(--a); }
  .mb-p { position: absolute; left: 0; right: 0; bottom: 3px; height: var(--s); background: var(--z); border-top: 1.5px solid var(--t); z-index: 0; }
  body.abs .mb-p { height: var(--a); }
  .mb-p.cs { display: none; } body.abs .mb-p.cs { display: block; } body.abs .mb-p.ca { display: none; }
  .cf.ds .mb-b::after, body.abs .cf.da .mb-b::after { content: ''; position: absolute; left: 50%; top: 2px; margin-left: -3px; border: 3px solid transparent; border-bottom: 4px solid #fff; border-top: 0; }
  body.abs .cf.ds:not(.da) .mb-b::after { display: none; }
  .cf.ne .mb-z::before { content: ''; position: absolute; left: 2px; right: 2px; bottom: 3px; height: 10px; border-radius: 2px; }
  .cf.vide::after { content: ''; width: 3px; height: 3px; border-radius: 50%; background: var(--trait2); margin-bottom: 2px; }
  .cf.tri::after { content: ''; position: absolute; left: 2px; right: 2px; bottom: -3px; height: 2px; border-radius: 2px; background: var(--b); }

  details.bio { display: inline-block; }
  details.bio summary { list-style: none; display: inline-flex; align-items: center; gap: 2px; height: 22px; padding: 0 4px; cursor: pointer; }
  details.bio summary::-webkit-details-marker { display: none; }
  .bt { display: inline-flex; align-items: center; gap: 1px; padding: 0 2px; height: 16px; }
  .bt .pi { width: 13px; height: 13px; }
  .bt.mot span { font-size: 12px; font-weight: 600; margin-left: 2px; }
  details.bio[open] ul { position: absolute; left: 0; right: 0; z-index: 7; padding: 10px 12px 10px 26px; font-size: 14px; display: flex; flex-direction: column; gap: 6px; }
  .src { color: var(--gris); font-size: 12px; }
  details.pli { padding: 9px 12px; }
  details.pli summary { font-size: 14px; font-weight: 600; cursor: pointer; }
  details.pli ul { margin: 8px 0 0 16px; display: flex; flex-direction: column; gap: 6px; font-size: 14px; }
  .cmp { position: fixed; z-index: 8; left: 50%; transform: translateX(-50%); bottom: 12px; width: 358px; max-width: calc(100% - 32px); height: 40px; display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 14px; font-weight: 700; }

  /* La légende : fermée par défaut ; un toucher sur « ? » l'ouvre en feuille. */
  .leg-v { position: fixed; inset: 0; z-index: 30; background: var(--fi-voile); }
  .legende { position: fixed; z-index: 31; left: 0; right: 0; bottom: 0; max-width: 390px; margin: 0 auto; max-height: 82vh; overflow-y: auto; padding: 4px 16px 16px; border-radius: 8px 8px 0 0; background: var(--fi-bg); color: var(--fi-tx); display: flex; flex-direction: column; gap: 10px; font-size: 12px; }
  .legende[hidden], .leg-v[hidden] { display: none; }
  .leg-t { display: flex; align-items: center; justify-content: space-between; min-height: 36px; font-size: 14px; font-weight: 700; }
  .leg-x { width: 30px; height: 30px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; }
  .leg-s { display: flex; flex-direction: column; gap: 6px; }
  .leg-s h3 { font-size: 12px; font-weight: 700; color: var(--fi-gris); }
  .leg-g { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px 8px; }
  .leg-g.l2 { grid-template-columns: repeat(2, 1fr); }
  .leg-i { display: flex; align-items: center; gap: 6px; min-height: 24px; }
  .leg-i .pi { width: 18px; height: 18px; }
  .leg-i .cf { flex: none; }
  .ob { grid-template-columns: auto 1fr auto; gap: 3px 8px; }
  .ob .nom { grid-column: auto; }
  .ob .rep { justify-self: start; }
  .ob .piste { grid-column: 1 / -1; }
  .piste { position: relative; height: 22px; margin: 0 2px; }
  .piste::before { content: ''; position: absolute; left: 0; right: 0; top: 13px; height: 7px; border-radius: 2px; background: rgba(255,255,255,.9); }
  .pz { position: absolute; top: 13px; height: 7px; left: 0; width: var(--s); background: var(--z); border-radius: 0 2px 2px 0; }
  .pz::after { content: ''; position: absolute; right: -1px; top: -2px; width: 2px; height: 10px; border-radius: 1px; background: var(--t); }
  body.abs .pz { width: var(--a); }
  .pb { position: absolute; top: 13px; height: 7px; left: 0; width: var(--s); background: var(--b); border-radius: 0 2px 2px 0; z-index: 1; }
  body.abs .pb { width: var(--a); }
  .pv { position: absolute; top: 0; bottom: 0; left: var(--s); border-left: 1.5px dashed var(--encre); z-index: 2; }
  body.abs .pv { left: var(--a); }
  .pv span { position: absolute; top: -1px; left: 4px; font-size: 12px; font-weight: 600; font-style: normal; line-height: 12px; color: var(--encre); white-space: nowrap; display: inline-flex; align-items: center; }
  .prail { position: absolute; left: 0; top: 8px; bottom: 0; width: 2px; border-radius: 1px; background: var(--encre); z-index: 3; }
  .piste.moins .pz { left: auto; right: var(--s0); width: calc(100% - var(--s0)); border-radius: 2px 0 0 2px; }
  .piste.moins .pz.cs { display: none; }
  body.abs .piste.moins .pz { right: var(--a0); width: calc(100% - var(--a0)); display: block; }
  .piste.moins .pz::after { display: none; }
  .piste.moins .pb { left: auto; right: 0; border-radius: 2px 0 0 2px; }
  .piste.moins .pv { left: auto; right: var(--s); border-left: 0; border-right: 1.5px dashed var(--encre); }
  body.abs .piste.moins .pv { right: var(--a); }
  .piste.moins .pv span { left: auto; right: 4px; }
  .piste.moins .pv.loin { border-right-color: transparent; }
  .piste.moins .pv.loin span { right: auto; left: 0; }
  body.abs .piste.moins .pv.loin { border-right-color: var(--encre); }
  body.abs .piste.moins .pv.loin span { left: auto; right: 4px; }
  body.abs .piste.moins .pv.loin span .ic { display: none; }
  .piste.moins .prail { left: auto; right: 0; }
  /* Plus de trait de visée sur toute la hauteur : un tiret sur la ligne de sa famille, sous les étiquettes. */
  .fonds .vl { display: none; }
  /* Les marques orphelines près de « +2 crans » étaient les bouts de la zone du style (.zt::after), noirs et
     seuls : la ligne de zone, sans couleur, ne se voyait pas. La zone se lit maintenant par sa ligne pâle au
     ton de la famille, sous la barre, sans bout. */
  .zt { background: color-mix(in srgb, var(--c) 55%, #fff) !important; }
  .zt::after { display: none !important; }
  /* Le rail de ma bière reste dans le bloc de ses barres : plus de trait sur toute la hauteur de la liste. */
  .gut::before { display: none; }
  .bars .g { position: relative; }
  .bars .g::before { content: ''; position: absolute; top: -4px; bottom: -6px; left: 9.5px; width: 3px; background: var(--rail); }
  .vt { position: absolute; top: -3px; bottom: -3px; left: var(--s); width: 0; border-left: 1.5px dashed var(--vise); z-index: 0; }
  body.abs .vt { left: var(--a); }
  .lab-i { z-index: 4; }
  /* L'usage : un mot (l8g), une pastille (l8h) ; déduit de l'α, il reste pâle, lisible. */
  .us { height: auto; opacity: 1; }
  .us-mot { font-size: 12px; font-weight: 600; color: var(--encre); }
  .us-mot.deduit { font-weight: 400; color: var(--gris); opacity: 1; }
  .us-pastille { display: inline-flex; align-items: center; gap: 2px; height: 18px; padding: 0 6px 0 4px; border-radius: 9px; font-size: 12px; font-weight: 600; color: var(--encre); background: #ececf1; }
  .us-pastille.deduit { background: none; box-shadow: inset 0 0 0 1px #b4b4be; color: var(--gris); font-weight: 400; opacity: 1; }
  .lg-p { position: relative; width: 44px; height: 14px; display: inline-block; flex: none; }
  .lg-p::before { content: ''; position: absolute; left: 0; right: 0; top: 5px; height: 6px; border-radius: 2px; background: #ececf1; }
  .lg-rail { position: absolute; left: 0; top: 0; bottom: 0; width: 2px; background: var(--encre); }
  .lg-z { position: absolute; left: 0; top: 5px; height: 6px; width: 34px; background: rgba(191,134,214,.3); }
  .lg-b { position: absolute; left: 0; top: 5px; height: 6px; width: 24px; background: #bf86d6; border-radius: 0 2px 2px 0; }
  .lg-v { position: absolute; left: 30px; top: 0; bottom: 0; border-left: 1.5px dashed var(--encre); }
  ${CSS_FICHE}
  .f-fiche { font-family: var(--sans); }
  .f-nom { font-size: 16px; font-weight: 700; } .f-aa { font: 600 16px var(--mono); } .f-grec { font-size: 14px; } .f-lot, .f-cpt, .f-lab-mots, .f-lab-sans, .f-lab-nd, .f-seule, .f-dem, .f-repli, .f-sec, .f-tag { font-size: 12px; }
  .f-lot, .f-rg-v { font-family: var(--mono); } .f-role { font-size: 12px; } .f-act { font-size: 14px; } .r-lab { font-size: 12px; font-family: var(--sans); }
  .f-note { flex-basis: 100%; order: 9; font-size: 12px; color: var(--fi-gris); }
  /* La fiche dans le langage de la page : l'α des voies (plus grand), l'usage en mot, les pictos et les barres. */
  .f-alpha { display: inline-flex; align-items: baseline; gap: 8px; }
  .f-alpha .al { font-size: 16px; } .f-alpha .al.fi { font-size: 14px; } .f-alpha .al.lot::before { font-size: 14px; }
  .f-bande { gap: 2px; align-items: flex-end; }
  .f-col { width: 20px; display: inline-flex; flex-direction: column; align-items: center; gap: 2px; }
  .f-colz { position: relative; width: 13px; height: 22px; }
  .f-colz::after { content: ''; position: absolute; left: -2px; right: -2px; bottom: 0; height: 1px; background: var(--trait2); }
  .f-colb { position: absolute; left: 0; right: 0; bottom: 1px; height: var(--h); background: var(--b); border-radius: 2px 2px 0 0; }
  .f-col.ci .f-colb { background: var(--f); box-shadow: inset 0 0 0 1.5px var(--b); }
  .f-col .pi { width: 14px; height: 14px; }
  .f-lab { grid-template-columns: 16px 1fr; }
  .f-lab .pi { grid-row: span 2; align-self: start; margin-top: 1px; }
  .r-pi.inc { opacity: .5; }
  /* La légende : le « ? » touché reste visible au-dessus de la feuille, avec la trace du doigt (b1). */
  .leg-b { position: relative; }
  .leg-b[aria-expanded="true"] { z-index: 32; background: #fff; color: var(--encre); box-shadow: 0 0 0 2px var(--encre); }
  .doigt { display: none; position: absolute; left: 50%; top: 50%; width: 38px; height: 38px; margin: -19px 0 0 -19px; border-radius: 50%; background: rgba(22,22,26,.13); box-shadow: 0 0 0 2px rgba(22,22,26,.28); pointer-events: none; }
  .leg-b[aria-expanded="true"] .doigt { display: block; }
`;

// ---------- l'α d'un houblon (c1 : voies[].fiches[].alpha) ----------
const pct = (x) => fr(x) + '%';
const plage = (a) => (a[0] === a[1] ? pct(a[0]) : fr(a[0]) + '–' + pct(a[1]));
function alpha(h) {
  const A = h.alpha; if (!A) return '';
  const cryo = /cryo$/i.test(h.houblon), base = h.houblon.replace(/\s*cryo$/i, '');
  const hors = A.horsFiches && !cryo && A.lot != null;
  const lot = A.lot != null ? `<span class="al lot${hors ? ' hors' : ''}" data-role="alpha" data-source="lot" aria-label="α du lot en stock : ${fr(A.lot)} %${A.lotSource ? ', ' + A.lotSource : ''}${hors ? ' ; hors des plages de ses fiches (' + plage(A.fiches) + ')' : ''}">${pct(A.lot)}${hors ? ic('diff', 12) : ''}</span>` : '';
  const fi = A.fiches ? `<span class="al fi" data-role="alpha" data-source="fiches" aria-label="${cryo ? 'α des fiches du ' + base + ' en pellets (' + plage(A.fiches) + ') ; celle du cryo manque' : 'α des fiches : ' + plage(A.fiches)}">${ic('livre', 12)}${plage(A.fiches)}${cryo ? '<span class="pel">pellets</span>' : ''}</span>` : '';
  return lot + fi;
}
const hopsDe = (X) => (X.v.fiches || []);
const nomAlpha = (X) => {
  const hs = hopsDe(X);
  if (!hs.length) return `<b class="nm"><span class="hb"><span class="hn">${nomVoie(X.v).nom}</span></span></b>`;
  return `<b class="nm">${hs.map((h, i) => `${i ? '<span class="plus" role="img" aria-label="et">' + ic('plus2', 12) + '</span>' : ''}<span class="hb"><span class="hn" data-houblon="${h.houblon}">${h.houblon}</span>${alpha(h)}${usageMot(h)}</span>`).join('')}</b>`;
};
// La marque de moment de la voie, en picto (le titre du groupe dit les minutes).
const marqueMoment = (X) => { const id = momentDe(X.v), [, k, lg] = MOMENT[id]; return `<span class="mo-m" role="img" aria-label="Moment : ${lg}">${ic(k, 14)}</span>`; };

// ---------- une case : la barre de l5b ----------
function cellule(X, f, obj) {
  const t = X.v.tout.find((x) => x.famille === f);
  let e, c;
  if (obj) {
    const ef = X.v.effet[f];
    if (!ef.etabli) return `<span class="cf o ne" data-famille="${f}" role="img" aria-label="${NOM[f]} : effet non établi"><span class="mb-z"></span></span>`;
    e = ef.central; c = t ? t.crans : 0;
  } else {
    if (!t || Math.abs(t.effet) < 0.5) return '<span class="cf vide"></span>';
    e = t.effet; c = t.crans;
  }
  const n = niv(X.v, f, e), bas = e < 0, z = zone(f);
  const hS = Math.min(HC, Math.max(2, Math.abs(c) * PXC)), hA = Math.min(HC, Math.max(2, Math.abs(e) / 50 * HC));
  let plaf = '', xs = '';
  if (z && !bas) {
    const cS = z.rS0 * 3 / 100, pS = cS * PXC, pA = z.rA0 / 100 * HC;
    plaf = `<i class="mb-p${pS > HC ? ' cs' : ''}${pA > HC ? ' ca' : ''}" data-role="zone" style="--t:${JET[f].texte};--z:${rgba(JET[f].base, 0.14)};--s:${Math.min(HC, pS).toFixed(1)}px;--a:${Math.min(HC, pA).toFixed(1)}px"></i>`;
    if (X.hs.has(f)) {
      const xS = Math.max(0, Math.abs(c) - cS) * PXC, xA = Math.max(0, Math.abs(e) - z.rA0 / 100 * 50) / 50 * HC;
      xs = `<i class="mb-x" style="--s:${Math.min(hS, xS).toFixed(1)}px;--a:${Math.min(hA, xA).toFixed(1)}px"></i>`;
    }
  }
  const lib = `${NOM[f]} ${sg(e)} (${crTxt(c)}) · ${NIVMOT[n]}${X.hs.has(f) ? ' · hors du style' : ''}`;
  const ds = Math.abs(c) * PXC > HC ? ' ds' : '', da = Math.abs(e) / 50 * HC > HC ? ' da' : '';
  return `<span class="cf ${n}${obj ? ' o' : ''}${bas ? ' bas' : ''}${X.hs.has(f) ? ' hors' : ''}${ds}${da}" data-famille="${f}" data-crans="${c}"${obj ? '' : ' data-role="extra"'} role="img" aria-label="${lib}" style="--b40:${rgba(JET[f].base, 0.4)}"><span class="mb-z">${plaf}<i class="mb-b" style="--s:${hS.toFixed(1)}px;--a:${hA.toFixed(1)}px">${xs}</i></span></span>`;
}

// ---------- le balisage ----------
const tete = () => `
  <div class="barre">
    <a class="retour" href="#" aria-label="Retour">${ic('chev-l', 18)}</a>
    <div class="seg" role="radiogroup" aria-label="Partie">${['Ma bière', 'Suggestions', 'Comparer'].map((x) => `<button role="radio" aria-checked="${x === 'Suggestions'}">${x}</button>`).join('')}</div>
    <button class="leg-b" data-role="legende-bouton" aria-expanded="false" aria-controls="legende" aria-label="Légende des pictos">${ic('aide', 18)}<i class="doigt" aria-hidden="true"></i></button>
  </div>
  <div class="outils">
    <div class="seg lentille" role="radiogroup" aria-label="Lecture des familles"><button role="radio" data-e="style" aria-checked="true">Au style</button><button role="radio" data-e="absolu" aria-checked="false">Absolu</button></div>
    <div class="seg" role="radiogroup" aria-label="Vue"><button role="radio" aria-checked="true">${ic('barres', 14)}Barres</button><button role="radio" aria-checked="false">${ic('radar', 14)}Radar</button></div>
  </div>`;
function cible(frac, visee, f) {
  const w = 112, x = Math.round(visee * w), b = Math.round(Math.min(1, frac) * w);
  return `<svg class="cible" width="${w}" height="22" viewBox="0 0 ${w} 22" aria-hidden="true" data-famille="${f}"><rect class="tr" x="1" y="7" width="${w - 2}" height="8" rx="4"/><rect class="pl" x="1" y="7" width="${b}" height="8" rx="4"/><line class="vi" x1="${x}" y1="0" x2="${x}" y2="22" stroke-width="2.5" stroke-dasharray="4 2.5"/></svg>`;
}
const ligneOb = (f, sens, label, droite, extra = '', petit = '') => `
    <section class="ob" data-role="objectif" data-famille="${f}" aria-label="${repLabel[f]}">
      <span class="nom"><span class="sens">${ic(sens > 0 ? 'haut' : 'bas', 14)}</span><span class="pa">${picto(f, 16)}${extra}</span>${label}</span>
      <div class="rep v-${REP[f].verdict}" data-role="reponse" data-famille="${f}" data-verdict="${REP[f].verdict}"><span class="signe">${ic(REP[f].verdict, 20)}</span>${REP.MOT[REP[f].verdict]}${petit}</div>
      ${droite}
    </section>`;
const rg = (f, a) => rgba(JET[f].base, a);
function piste(f) {
  if (f === 'resin') {
    const e = REP.resin.meilleure.v.effet.resin.central, s = Math.abs(e) / cran(f) / 3 * 100, a = Math.abs(e) / 50 * 100;
    const gap = DEG.min - OB.resin.visee, vS = gap / cran(f) / 3 * 100, vA = gap / 50 * 100;
    return `<div class="piste moins" data-role="piste" data-famille="resin">
        <i class="pz${vS >= 100 ? ' cs' : ''}" data-role="zone" style="--z:${rg('resin', 0.3)};--s0:${p(cl(vS))};--a0:${p(cl(vA))}"></i>
        <i class="pb" style="--s:${p(cl(s))};--a:${p(cl(a))}"></i>
        <i class="pv${vS > 100 ? ' loin' : ''}" style="--s:${p(cl(vS))};--a:${p(cl(vA))}"><span>${vS > 100 ? ic('chev-l', 12) : ''}visée</span></i>
        <i class="prail"></i>
      </div>`;
  }
  const e = REP[f].voie.v.effet[f].central, z = zone(f), s = e / cran(f) / 3 * 100, a = e / 50 * 100;
  return `<div class="piste" data-role="piste" data-famille="${f}">
        <i class="pz" data-role="zone" style="--z:${rg(f, 0.3)};--s:${p(cl(z.rS0))};--a:${p(cl(z.rA0))}"></i>
        <i class="pb" style="--s:${p(cl(s))};--a:${p(cl(a))}"></i>
        <i class="pv" style="--s:${p(viseeS(f))};--a:${p(viseeA(f))}">${f === 'floral' ? '<span>visée</span>' : ''}</i>
        <i class="prail"></i>
      </div>`;
}
export const reponses = () => `
  <div class="tabl">
    ${ligneOb('resin', -1, 'Moins résineux', `<button class="hh-b" onclick="${HH_JS}">Hors houblon${ic('chev-r', 14)}</button>` + piste('resin'), '<i class="alerte"></i>')}
    ${ligneOb('floral', 1, 'Plus floral', piste('floral'))}
    ${ligneOb('citrus', 1, 'Plus agrumes', piste('citrus'))}
  </div>`;
const tetes = () => `
    <div class="tetes" aria-hidden="true">
      <div class="m re"><i class="axe g-ax"></i><span class="puce gauche-v">${ic('chev-l', 12)}visée</span></div>
      <div class="g"></div>
      <div class="m fl"><i class="axe d-ax"></i><span class="puce v" style="--s:${p(viseeS('floral'))};--a:${p(viseeA('floral'))}">visée</span></div>
    </div>`;
const th = (f, o) => `<button class="th${o ? ' o' : ''}" data-tri="${f}" data-famille="${f}" aria-pressed="false" aria-label="Trier par ${NOM[f].toLowerCase()}">${picto(f, 18)}</button>`;
const teteMatrice = () => `
    <div class="grille tete-m" role="group" aria-label="Trier les voies par famille">
      <span></span>${OBJ.map((f) => th(f, true)).join('')}<i class="sep"></i>${EXTRAS.map((f) => th(f, false)).join('')}<span></span>
    </div>`;
const ligne = (X, cls = '', i = 0) => {
  const { q } = nomVoie(X.v), hop = !X.v.levureVers;
  const dose = X.v.type === 'assemblage' ? '<span class="q">5+5 g<span class="env" role="img" aria-label="environ, estimé">' + ic('environ', 12) + '</span></span>' : q ? `<span class="q">${q}</span>` : '';
  return `<div class="vr grille${cls}" data-voie="${X.n}" data-ordre="${i}"${hop ? ' data-role="ligne-houblon"' : ''}>
        <div class="l1">${nomAlpha(X)}${bioPill(X, 13)}</div>
        <div class="id">${marqueMoment(X)}${dose}${stockMarque(X.v, 14)}</div>
        ${OBJ.map((f) => cellule(X, f, true)).join('')}<i class="sep"></i>${EXTRAS.map((f) => cellule(X, f, false)).join('')}
        ${ajc(X)}
      </div>`;
};
const moTitre = (id) => { const [t, k, lg] = MOMENT[id]; const mot = !/′$/.test(t); return `<span class="mo${mot ? ' mot' : ''}" data-role="moment" data-moment="${id}" aria-label="Moment : ${lg}">${mot ? ic(k, 16) : ''}${t}</span>`; };
const blocMeme = (g) => `
    <div class="groupe">${moTitre(g.moment)}<span class="gt"><span class="t">${ic('egal', 14)}même effet</span><span class="dose">${g.dose}</span></span></div>
    <div class="rangee">${couloirs(g.voies[0], true)}</div>
    <div class="tab meme">${g.voies.map((X, i) => ligne(X, g.coupe(i) ? ' coupe-l' : '', i)).join('')}</div>`;
const blocGeste = (g) => `
    <div class="groupe">${moTitre(g.mo)}<span class="gt"><span class="t">${g.ic ? ic(g.ic, 14) : ''}${g.t}</span>${g.est ? '<span class="est">estimé</span>' : ''}</span></div>
    ${g.voies.map((X) => `<div class="tab seul">${ligne(X)}<div class="rangee in">${couloirs(X, false)}</div></div>`).join('')}`;

// ---------- la légende : ce que dit chaque picto, un mot ou deux chacun ----------
const X1 = V[0], X15 = V[14];
const li = (c, m) => `<span class="leg-i">${c}<span>${m}</span></span>`;
const exemple = (cls, h, x = '') => `<span class="cf ${cls}" data-famille="tropical" style="--b40:${rgba(JET.tropical.base, 0.4)}"><span class="mb-z"><i class="mb-p" style="--t:${JET.tropical.texte};--z:${rgba(JET.tropical.base, 0.14)};--s:19px;--a:12px"></i><i class="mb-b" style="--s:${h}px;--a:${h}px">${x}</i></span></span>`;
export const legende = () => `
  <div class="leg-v" data-role="legende-voile" hidden></div>
  <section class="legende" id="legende" data-role="legende" role="dialog" aria-label="Légende" hidden>
    <div class="leg-t"><span>Légende</span><button class="leg-x" data-role="legende-fermer" aria-label="Fermer la légende">${ic('x', 18)}</button></div>
    <div class="leg-s"><h3>Familles</h3><div class="leg-g">${ORDRE.map((f) => li(picto(f, 18), COURT[f])).join('')}</div></div>
    <div class="leg-s"><h3>Réponses</h3><div class="leg-g">${li(ic('atteint', 18), 'atteint')}${li(ic('approche', 18), 'approche')}${li(ic('aucune', 18), 'aucune voie')}</div></div>
    <div class="leg-s"><h3>Houblon</h3><div class="leg-g l2">
      ${li(usageMot({ houblon: '', role: 'double', roleSource: 'fournisseur' }), 'usage, dit par le fournisseur')}${li(usageMot({ houblon: '', role: 'double', roleSource: 'règle' }), 'pâle : déduit de l’α, à valider')}
      ${li('<span class="al lot">8,1%</span>', 'α du lot en stock')}${li('<span class="al fi">' + ic('livre', 12) + '5–8,5%</span>', 'α de ses fiches')}
      ${li('<span class="al lot">9,6%' + ic('diff', 12) + '</span>', 'lot hors de ses fiches')}${li('<span class="al fi">' + ic('livre', 12) + '<span class="pel">pellets</span></span>', 'fiches de la variété en pellets')}
    </div></div>
    <div class="leg-s"><h3>Sous chaque objectif</h3><div class="leg-g l2">
      ${li('<span class="lg-p"><i class="lg-rail"></i></span>', 'le trait noir : ma bière')}${li('<span class="lg-p"><i class="lg-z"></i></span>', 'pâle : la zone du style')}
      ${li('<span class="lg-p"><i class="lg-b"></i></span>', 'la meilleure voie')}${li('<span class="lg-p"><i class="lg-v"></i></span>', 'tirets : la visée')}
    </div></div>
    <div class="leg-s"><h3>Stock et moments</h3><div class="leg-g l2">
      ${li('<span class="stk">' + ic('stock', 14) + '</span>', 'en stock')}${li('<span class="stk">' + ic('achat', 14) + '</span>', 'à acheter')}
      ${li('<span class="stk">' + ic('manque', 14) + '</span>', 'stock insuffisant')}${li('<span class="mo-m">' + ic('ebu', 14) + '</span>', 'ébullition')}
      ${li('<span class="mo-m">' + ic('cuveA', 14) + '</span>', 'dry hop actif')}${li('<span class="mo-m">' + ic('levure', 14) + '</span>', 'levure')}
    </div></div>
    <div class="leg-s"><h3>Barres, un cran du style par 8 px</h3><div class="leg-g l2">
      ${li(exemple('mq', 13), 'marqué dans ses fiches')}${li(exemple('ci', 13), 'cité par une fiche')}
      ${li(exemple('sf', 13), 'sans fiche')}${li(exemple('mq', 22, '<i class="mb-x" style="--s:4px;--a:4px"></i>'), 'orangé : hors du style')}
      ${li(exemple('bas', 3), 'baisse')}${li('<span class="cf o ne"><span class="mb-z"></span></span>', 'non établi')}
    </div></div>
  </section>`;
const JS_LEGENDE = `
const LB = document.querySelector('[data-role="legende-bouton"]'), LG = document.querySelector('[data-role="legende"]'), LV = document.querySelector('[data-role="legende-voile"]');
const legende = (on) => { LG.hidden = !on; LV.hidden = !on; LB.setAttribute('aria-expanded', String(on)); if (on) LG.querySelector('[data-role="legende-fermer"]').focus({ preventScroll: true }); else LB.focus({ preventScroll: true }); };
LB.addEventListener('click', () => legende(LG.hidden));
LV.addEventListener('click', () => legende(false));
LG.querySelector('[data-role="legende-fermer"]').addEventListener('click', () => legende(false));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !LG.hidden) legende(false); });
if (/[?&]legende\\b/.test(location.search)) legende(true);`;

export const corps = () => `${tete()}${reponses()}
  <div class="graph">${fonds()}${teteMatrice()}
    ${MEMES.map(blocMeme).join('')}
    ${GESTES.map(blocGeste).join('')}
  </div>
  ${details()}
  <a class="cmp" data-role="comparer" href="../../fils15-s5-complexe/q2b/comparer.html">Comparer <b class="nb">(${AJOUTEES.length})</b></a>
  ${legende()}`;
export const TRI = `
const coupes = new Map([...document.querySelectorAll('.vr')].map((r) => [r, r.classList.contains('coupe-l')]));
document.querySelectorAll('.th[data-tri]').forEach((b) => b.addEventListener('click', () => {
  const on = b.getAttribute('aria-pressed') !== 'true', f = b.dataset.tri;
  document.querySelectorAll('.th[data-tri]').forEach((x) => x.setAttribute('aria-pressed', String(on && x === b)));
  document.querySelectorAll('.cf.tri').forEach((x) => x.classList.remove('tri'));
  document.querySelectorAll('.tab.meme').forEach((t) => {
    const rs = [...t.querySelectorAll(':scope > .vr')];
    const val = (r) => { const c = r.querySelector('.cf[data-famille="' + f + '"][data-crans]'); return c ? parseFloat(c.dataset.crans) : -99; };
    rs.sort((a, z) => (on ? val(z) - val(a) : 0) || a.dataset.ordre - z.dataset.ordre).forEach((r) => t.append(r));
    rs.forEach((r) => r.classList.toggle('coupe-l', !on && coupes.get(r)));
  });
  if (on) document.querySelectorAll('.vr .cf[data-famille="' + f + '"][data-crans]').forEach((c) => c.classList.add('tri'));
}));` + JS_LEGENDE;

export const abc = (mots) => {
  const fig = (c, m) => `<figure><div class="ech">${c}</div><figcaption>${m}</figcaption></figure>`;
  return [
    fig('<span class="sw s1"></span><span class="sw s2"></span><span class="sw s3"></span>', mots[0]),
    fig('<span class="aa">Aa</span><span class="aa n">Aa</span>', 'texte'),
    fig(`<button class="ajc" aria-pressed="false" aria-label="Ajouter">${ic('plus', 16, 'ic i-plus')}${ic('check', 16, 'ic i-check')}</button><button class="ajc" aria-pressed="true" aria-label="Ajouté">${ic('plus', 16, 'ic i-plus')}${ic('check', 16, 'ic i-check')}</button>`, 'ajouter'),
    fig(`${th('floral', true)}${cellule(X1, 'citrus', true)}${cellule(X1, 'tropical', false)}${cellule(X15, 'citrus', true)}`, 'colonne'),
    fig(`<span class="hb"><span class="al lot">8,1%</span><span class="al fi">${ic('livre', 12)}5–8,5%</span></span>`, 'α'),
    fig('<span class="mini-cmp">Comparer</span>', 'action'),
    fig(`<span class="rep"><span class="signe">${ic('atteint', 20)}</span></span><span class="rep"><span class="signe">${ic('approche', 20)}</span></span><span class="rep v-aucune"><span class="signe">${ic('aucune', 20)}</span></span>`, 'verdict'),
    fig(`${ORDRE.slice(0, 4).map((f) => picto(f, 18)).join('')}`, 'pictos'),
    fig(`<button class="leg-b" aria-label="Légende">${ic('aide', 18)}</button>`, 'légende'),
  ].join('');
};
export const CSS_PLANCHE = `
  .abc figcaption { font-size: 12px; font-weight: 600; color: var(--gris); }
  .sw { width: 26px; height: 34px; margin: 0 2px; }
  .aa { font: 700 16px/1 var(--sans); margin: 0 4px; } .aa.n { font: 600 16px/1 var(--mono); }
  .abc .ajc, .abc .rep { margin: 0 3px; } .abc .cf, .abc .th { margin: 0 3px; } .abc .pi { margin: 0 2px; }
  .mini-cmp { height: 32px; padding: 0 14px; display: inline-flex; align-items: center; font-weight: 700; font-size: 14px; }`;
export const POLICES = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600&family=Source+Sans+3:wght@400;600;700&display=swap">';
export function construire({ ICI, nom, css, symb, commentaire, cssPlanche, mots }) {
  ecrire(ICI + '/etat-b.html', page({ titre: nom + ' · Suggestions', css: CSS_STRUCTURE + css, symb, corps: corps(), js: runtime({ extra: TRI }), commentaire, entete: POLICES }));
  ecrire(ICI + '/planche.html', planche({ titre: nom + ' · planche', css: CSS_STRUCTURE + css + CSS_PLANCHE + cssPlanche, symb, abc: abc(mots), entete: POLICES,
    vues: [['etat-b.html', 1688, 'Suggestions'], ['etat-b.html?fiche=Motueka', 844, 'Fiche de Motueka'], ['etat-b.html?legende', 844, 'Légende']] }));
}
