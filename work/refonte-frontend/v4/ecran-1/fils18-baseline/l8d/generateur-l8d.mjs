// Lot 18 · l8d · la disposition de l8 dans des tuiles douces (le croisement de l5 Tuiles et de l8) : fond
// pastel, tuiles blanches à ombre douce, chaque objectif une tuile au ton fond de sa famille. Mais compact
// (« Un poil gros et épais, prend trop de place », sur l5) : une voie reste une ligne de la matrice, pas une
// tuile ; une tuile porte un groupe entier, rayon 8 px, ombre courte. Source Sans 3 et IBM Plex Mono ; 12, 14
// et 16 px. Usage : node generateur-l8d.mjs  →  l8d/etat-b.html, l8d/planche.html
import { symboles } from './noyau.mjs';
import { construire } from './matrice.mjs';

const ICI = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/refonte-frontend/v4/ecran-1/fils18-baseline/l8d';
const OMBRE = '0 1px 2px rgba(22,22,26,.07), 0 6px 14px -10px rgba(22,22,26,.4)';
const CSS = `
  :root { --page: #e6e9f1; --encre: #16161a; --gris: #55555f; --trait: #e7e9f0; --trait2: #cfd3de; --rail: #16161a; --vise: #16161a; --moment: #16161a; --acc: #c2410c;
    --sans: 'Source Sans 3', -apple-system, system-ui, 'Segoe UI', Roboto, sans-serif; --mono: 'IBM Plex Mono', ui-monospace, Consolas, monospace; --ombre: ${OMBRE};
    --fi-bg: #f1f2f7; --fi-tx: #16161a; --fi-tx2: #2a2a30; --fi-gris: #55555f; --fi-trait: #cfd3de; --fi-voile: rgba(22,22,26,.28); --fi-rad: 8px;
    --r-anneau: #cfd3de; --r-encre: #16161a; --r-plein: rgba(22,22,26,.1); }
  body { background-image: radial-gradient(60% 40% at 0% 8%, #d9d3f1 0%, rgba(217,211,241,0) 100%), radial-gradient(55% 35% at 100% 42%, #cfe7dd 0%, rgba(207,231,221,0) 100%), radial-gradient(70% 40% at 10% 85%, #d3e0f1 0%, rgba(211,224,241,0) 100%), linear-gradient(180deg, #e4e7f0, #e9e7ef); min-height: 100vh; }
  .retour { border-radius: 50%; background: #fff; box-shadow: var(--ombre); color: var(--encre); }
  .seg { background: rgba(255,255,255,.55); border-radius: 16px; padding: 2px; box-shadow: inset 0 0 0 1px rgba(22,22,26,.06); }
  .seg button { border-radius: 14px; color: var(--gris); }
  .seg button[aria-checked="true"] { background: #fff; color: var(--encre); font-weight: 600; box-shadow: 0 1px 3px rgba(22,22,26,.16); }
  .lentille button[aria-checked="true"] { background: var(--encre); color: #fff; }

  /* Les verdicts : trois tuiles au ton fond de leur famille, ombre douce. */
  .tabl { gap: 6px; }
  .ob { background: var(--f); border-radius: 8px; padding: 5px 10px 6px; box-shadow: var(--ombre); }
  .ob .nom { color: var(--t); }
  .sens { display: inline-flex; color: var(--encre); }
  .alerte { box-shadow: 0 0 0 1.5px #fff; }
  .rep { color: var(--encre); } .signe { display: inline-flex; color: var(--encre); } .v-aucune .signe { color: var(--gris); }
  .hh-b { border-radius: 14px; background: #fff; color: var(--t); box-shadow: var(--ombre); }
  .cible .tr { fill: #fff; } .cible .pl { fill: var(--b); } .cible .vi { stroke: var(--encre); }

  .flou { background: linear-gradient(270deg, rgba(47,107,95,.18), rgba(47,107,95,0)); }
  .puce { background: var(--encre); color: #fff; border-radius: 10px; }
  /* Le titre d'un groupe : une petite tuile blanche, le moment en gras. */
  .groupe { width: max-content; max-width: 100%; background: #fff; border-radius: 8px; box-shadow: var(--ombre); padding: 2px 10px 2px 8px; min-height: 28px; }
  .bar { border-radius: 4px; }
  .bar.ci { background: var(--f); box-shadow: inset 0 0 0 1.5px var(--b); }
  .bar.sf { background: #fff; box-shadow: inset 0 0 0 1.5px var(--b); }
  .bar.inconnu { background: repeating-linear-gradient(135deg, #fff 0 3px, #b8bec8 3px 5px); box-shadow: inset 0 0 0 1.2px #8a909b; }
  .zt { background: color-mix(in srgb, var(--b) 60%, #fff); }
  .lab-i { background: #fff; border-radius: 4px; box-shadow: 0 1px 2px rgba(22,22,26,.1); }

  /* La matrice : la tête de colonnes, tuile collante ; chaque groupe, une tuile blanche ; une voie, une ligne. */
  .tete-m { top: 4px; background: rgba(255,255,255,.9); -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); border-radius: 8px; box-shadow: var(--ombre); padding: 4px 0 6px; }
  .th .pi { width: 20px; height: 20px; padding: 2px; border-radius: 50%; background: var(--f); }
  .tab.meme { background: #fff; border-radius: 8px; box-shadow: var(--ombre); padding: 0 0 0 9px; }
  .tab.seul { margin: 0 0 2px; }
  .tab.seul .vr { background: #fff; border-radius: 8px; box-shadow: var(--ombre); padding-left: 9px; }
  .tab.seul .rangee.in { padding: 6px 0 8px; }
  .vr + .vr { border-top: 1px solid var(--trait); } .vr.coupe-l { border-top-color: var(--trait2); }
  .vr.appui, .vr.survol { background: #f6f7fb; }
  .us { color: var(--encre); background: #eef0f5; border-radius: 10px; } .us.deduit { background: none; color: var(--gris); }
  .ajc { border-radius: 50%; color: var(--encre); background: #fff; box-shadow: var(--ombre), inset 0 0 0 1px rgba(22,22,26,.12); }
  .ajc[aria-pressed="true"] { background: var(--encre); color: #fff; }
  .cf.ci .jg i { background: var(--f); box-shadow: inset 0 0 0 1.5px var(--b); }
  .cf.sf .jg i { background: #fff; box-shadow: inset 0 0 0 1px var(--b); }
  .jg.bas i { background: #fff !important; box-shadow: inset 0 0 0 1.5px var(--encre) !important; }
  .jg.xs i { background: var(--acc) !important; box-shadow: none !important; }
  .jg.ne i { background: repeating-linear-gradient(135deg, #fff 0 2px, #9aa0ab 2px 3.5px); box-shadow: inset 0 0 0 1px #8a909b; }
  details.bio summary { border-radius: 11px; background: repeating-linear-gradient(135deg, #fff 0 3px, #dfe2ea 3px 5.5px); box-shadow: inset 0 0 0 1px #9aa0ab; }
  .bt { background: #fff; border-radius: 8px; }
  details.bio[open] ul { background: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(22,22,26,.08), 0 16px 30px -16px rgba(22,22,26,.5); }
  details.pli { background: #fff; border-radius: 8px; box-shadow: var(--ombre); }
  .cmp { border-radius: 20px; background: var(--encre); color: #fff; box-shadow: 0 2px 4px rgba(22,22,26,.08), 0 16px 30px -16px rgba(22,22,26,.6); }
  .f-source { background: #fff; }

  /* La fiche : une feuille pastel, ses blocs en tuiles blanches. */
  .f-fiche { box-shadow: 0 -10px 30px rgba(22,22,26,.22); }
  .f-bulle { box-shadow: 0 2px 4px rgba(22,22,26,.08), 0 16px 30px -16px rgba(22,22,26,.5); }
  .f-labels, .f-arome { background: #fff; border-radius: 8px; box-shadow: var(--ombre); padding: 8px 10px; }
  .f-fermer { border-radius: 50%; background: #fff; box-shadow: var(--ombre); }
  .f-role { border-radius: 12px; background: #fff; box-shadow: var(--ombre); } .f-role.regle { background: none; box-shadow: inset 0 0 0 1.5px #9aa0ab; }
  .c { border-radius: 2px; background: #eef0f5; } .c.m { background: var(--b); } .c.ci { background: var(--f); box-shadow: inset 0 0 0 1.5px var(--b); }
  .f-lab-n { color: var(--t); }
  .f-gout { border-radius: 16px; background: #fff; box-shadow: var(--ombre); }
  .f-g { border-radius: 50%; } .f-g[aria-pressed="true"] { background: var(--encre); color: #fff; }
  .f-act { border-radius: 16px; background: #fff; box-shadow: var(--ombre); } .f-ajouter { background: var(--encre); color: #fff; }
  .f-repli { border-radius: 14px; background: #fff; box-shadow: var(--ombre); } .f-tag { border-radius: 4px; background: #fff; }
  @keyframes appui { from { background-size: 0 100%; } to { background-size: 100% 100%; } }
  .appui .hn { background: linear-gradient(#e4e6ee, #e4e6ee) no-repeat; animation: appui 500ms linear forwards; border-radius: 2px; }`;
const PLANCHE = `
  body { background-color: #e6e9f1; }
  .mini { box-shadow: 0 2px 4px rgba(22,22,26,.08), 0 16px 30px -16px rgba(22,22,26,.5); border-radius: 8px; }
  .sw { border-radius: 8px; box-shadow: var(--ombre); } .sw.s1 { background: #e6e9f1; } .sw.s2 { background: #fff; } .sw.s3 { background: #f3e8f7; }
  .mini-cmp { border-radius: 16px; background: var(--encre); color: #fff; box-shadow: var(--ombre); }`;
construire({ ICI, nom: 'l8d · Tuiles douces', css: CSS, cssPlanche: PLANCHE, symb: symboles({ trait: 1.5 }), mots: ['tuiles'],
  commentaire: 'Lot 18 · l8d : la disposition de l8 dans des tuiles douces (l5 × l8) : fond pastel, tuiles blanches à ombre courte, objectifs en tuiles au ton fond ; compact : une tuile par groupe, une voie reste une ligne de la matrice. Source Sans 3 et IBM Plex Mono. Appui long (500 ms) ou survol (750 ms) : la fiche g1, ses blocs en tuiles.' });
