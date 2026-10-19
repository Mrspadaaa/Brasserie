// Lot 18 · l8b · la disposition de l8, dans le style de q2b : surfaces blanches et grises de q2b, jeu v3 duo,
// tons des familles (jetons), rayons de l'échelle (2, 4, 8 px, pilule), typographie de l'app (DESIGN.md :
// Source Sans 3 pour ce qui se dit, IBM Plex Mono pour ce qui se mesure ; 12, 14 et 16 px).
// Usage : node generateur-l8b.mjs  →  l8b/etat-b.html, l8b/planche.html
import { symboles } from './noyau.mjs';
import { construire } from './matrice.mjs';

const ICI = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/refonte-frontend/v4/ecran-1/fils18-baseline/l8b';
const CSS = `
  :root { --page: #fff; --encre: #16161a; --gris: #5b5b66; --trait: #dcdce3; --trait2: #c4c4cc; --rail: #16161a; --vise: #16161a; --moment: #16161a; --acc: #c2410c;
    --sans: 'Source Sans 3', -apple-system, system-ui, 'Segoe UI', Roboto, sans-serif; --mono: 'IBM Plex Mono', ui-monospace, Consolas, monospace;
    --fi-bg: #fff; --fi-tx: #16161a; --fi-tx2: #2a2a30; --fi-gris: #5b5b66; --fi-trait: #dcdce3; --fi-voile: rgba(22,22,26,.3); --fi-rad: 8px;
    --r-anneau: #c9c9d2; --r-encre: #16161a; --r-plein: rgba(22,22,26,.1); }
  .retour { color: var(--encre); }
  .seg { background: #ececf1; border-radius: 16px; padding: 2px; }
  .seg button { border-radius: 14px; color: var(--gris); }
  .seg button[aria-checked="true"] { background: #fff; color: var(--encre); font-weight: 600; box-shadow: 0 1px 2px rgba(0,0,0,.12); }
  .lentille button[aria-checked="true"] { background: var(--encre); color: #fff; }

  /* Les verdicts : une tuile pâle par objectif, au ton fond de sa famille (comme les tuiles de q2b). */
  .tabl { gap: 6px; }
  .ob { background: var(--f); border-radius: 8px; padding: 5px 10px 6px; }
  .ob .nom { color: var(--t); }
  .sens { display: inline-flex; color: var(--encre); }
  .alerte { box-shadow: 0 0 0 1.5px #fff; }
  .rep { color: var(--encre); } .signe { display: inline-flex; color: var(--encre); } .v-aucune .signe { color: var(--gris); }
  .hh-b { border-radius: 14px; background: #fff; color: var(--t); box-shadow: inset 0 0 0 1.5px var(--b); }
  .cible .tr { fill: #fff; } .cible .pl { fill: var(--b); } .cible .vi { stroke: var(--encre); }

  .flou { background: linear-gradient(270deg, rgba(47,107,95,.2), rgba(47,107,95,.03)); }
  .puce { background: var(--encre); color: #fff; border-radius: 10px; }
  .groupe > * { background: var(--page); border-radius: 4px; }
  .bar { border-radius: 4px; }
  .bar.ci { background: var(--f); box-shadow: inset 0 0 0 1.5px var(--b); }
  .bar.sf { background: #fff; box-shadow: inset 0 0 0 1.5px var(--b); }
  .bar.inconnu { background: repeating-linear-gradient(135deg, #fff 0 3px, #b8bec8 3px 5px); box-shadow: inset 0 0 0 1.2px #8a909b; }
  .zt { background: color-mix(in srgb, var(--b) 60%, #fff); }
  .lab-i { background: #fff; border-radius: 4px; }

  /* La matrice, carte blanche à ombre légère (le tableau de q2b) ; la tête de colonnes en pictos duo. */
  .tete-m { background: rgba(255,255,255,.96); box-shadow: 0 1px 0 var(--trait); }
  .th .pi { width: 20px; height: 20px; padding: 2px; border-radius: 50%; background: var(--f); }
  .tab.meme { background: #fff; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,.12), inset 3px 0 0 var(--encre); padding: 0 0 0 9px; }
  .tab.seul { border-top: 1px solid var(--trait); }
  .tab.seul .vr { background: #fff; }
  .vr + .vr { border-top: 1px solid var(--trait); } .vr.coupe-l { border-top-color: var(--trait2); }
  .vr.appui, .vr.survol { background: #f6f6f9; }
  .us { color: var(--encre); background: #ececf1; border-radius: 10px; } .us.deduit { background: none; color: var(--gris); }
  .ajc { border-radius: 50%; color: var(--encre); box-shadow: inset 0 0 0 2px var(--encre); background: #fff; }
  .ajc[aria-pressed="true"] { background: var(--encre); color: #fff; }
  .cf.ci .jg i { background: var(--f); box-shadow: inset 0 0 0 1.5px var(--b); }
  .cf.sf .jg i { background: #fff; box-shadow: inset 0 0 0 1px var(--b); }
  .jg.bas i { background: #fff !important; box-shadow: inset 0 0 0 1.5px var(--encre) !important; }
  .jg.xs i { background: var(--acc) !important; box-shadow: none !important; }
  .jg.ne i { background: repeating-linear-gradient(135deg, #fff 0 2px, #9aa0ab 2px 3.5px); box-shadow: inset 0 0 0 1px #8a909b; }
  details.bio summary { border-radius: 11px; background: repeating-linear-gradient(135deg, #fff 0 3px, #d5d7de 3px 5.5px); box-shadow: inset 0 0 0 1.2px #8a909b; }
  .bt { background: #fff; border-radius: 8px; }
  details.bio[open] ul { background: #fff; border-radius: 8px; box-shadow: 0 6px 18px rgba(0,0,0,.18); }
  details.pli { background: #f6f6f9; border-radius: 8px; }
  .cmp { border-radius: 20px; background: var(--encre); color: #fff; box-shadow: 0 8px 22px rgba(0,0,0,.28); }
  .f-source { background: #fff; }

  .f-fiche { box-shadow: 0 -8px 28px rgba(0,0,0,.2); }
  .f-bulle { box-shadow: 0 10px 30px rgba(0,0,0,.22), 0 0 0 1px var(--trait); }
  .f-fermer { border-radius: 50%; background: #ececf1; }
  .f-role { border-radius: 12px; background: #ececf1; } .f-role.regle { background: none; box-shadow: inset 0 0 0 1.5px #9a9aa6; }
  .c { border-radius: 2px; background: #ececf1; } .c.m { background: var(--b); } .c.ci { background: var(--f); box-shadow: inset 0 0 0 1.5px var(--b); }
  .f-lab-n { color: var(--t); }
  .f-gout { border-radius: 16px; background: #ececf1; }
  .f-g { border-radius: 50%; } .f-g[aria-pressed="true"] { background: var(--encre); color: #fff; }
  .f-act { border-radius: 16px; box-shadow: inset 0 0 0 1.5px var(--encre); } .f-ajouter { background: var(--encre); color: #fff; }
  .f-repli { border-radius: 14px; background: #f6f6f9; } .f-tag { border-radius: 4px; background: #f6f6f9; }
  @keyframes appui { from { background-size: 0 100%; } to { background-size: 100% 100%; } }
  .appui .hn { background: linear-gradient(#e4e4ea, #e4e4ea) no-repeat; animation: appui 500ms linear forwards; border-radius: 2px; }`;
const PLANCHE = `
  .mini { box-shadow: 0 0 0 1px var(--trait), 0 4px 12px rgba(0,0,0,.1); border-radius: 8px; }
  .sw { border-radius: 4px; box-shadow: inset 0 0 0 1px var(--trait); } .sw.s1 { background: #fff; } .sw.s2 { background: #ececf1; } .sw.s3 { background: #f3e8f7; }
  .mini-cmp { border-radius: 16px; background: var(--encre); color: #fff; }`;
construire({ ICI, nom: 'l8b · style q2b', css: CSS, cssPlanche: PLANCHE, symb: symboles({ trait: 1.5 }), mots: ['surfaces'],
  commentaire: 'Lot 18 · l8b : la disposition de l8 (verdicts en tête, moment en titre de groupe, matrice une colonne par famille, picto en tête de colonne fixe, tri au toucher), habillée en q2b : surfaces blanches et grises, tuiles pâles au ton fond, carte blanche à ombre légère, pictos duo v3, rayons 2, 4, 8 px et pilule, Source Sans 3 et IBM Plex Mono. Appui long (500 ms) ou survol (750 ms) : la fiche g1.' });
