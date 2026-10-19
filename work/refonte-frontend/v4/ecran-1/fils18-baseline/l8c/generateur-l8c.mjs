// Lot 18 · l8c · la disposition de l8, dans la Cave : l'identité sombre de l'app (DESIGN.md, comme l1).
// Charbon chaud (cave-950 la page, cave-900 les tuiles, cave-850 la feuille), trois tons de lecture
// (cave-50, cave-200, cave-400), paille pour la seule action principale (Comparer), cuivre de la production
// pour les moments. Familles lumineuses : le ton base, sauf petits fruits, épicé et résineux, sous 3:1 sur
// le charbon, qui prennent le ton fond (comme l1) ; le nom d'une famille prend la base si elle tient 4,6:1
// sur cave-900, sinon le fond. Source Sans 3 et IBM Plex Mono ; 12, 14 et 16 px.
// Usage : node generateur-l8c.mjs  →  l8c/etat-b.html, l8c/planche.html
import { symboles, JET, ORDRE } from './noyau.mjs';
import { construire } from './matrice.mjs';

const ICI = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/refonte-frontend/v4/ecran-1/fils18-baseline/l8c';
const K = { c950: '#12100E', c900: '#1A1613', c850: '#221D19', c800: '#2C2521', c700: '#3D342E', c600: '#574A42', c400: '#9A8A7E', c200: '#D8CEC5', c50: '#F5F0EA', paille: '#F2C14E', cuivre: '#E7A070' };
const lum = (h) => { const v = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
const cr = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const MARQUE = Object.fromEntries(ORDRE.map((f) => [f, cr(JET[f].base, K.c950) >= 3.1 ? JET[f].base : JET[f].fond]));
const LIBELLE = Object.fromEntries(ORDRE.map((f) => [f, cr(JET[f].base, K.c900) >= 4.6 ? JET[f].base : JET[f].fond]));
const rgba = (h, a) => 'rgba(' + [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)).join(',') + ',' + a + ')';
const TONS = ORDRE.map((f) => `[data-famille="${f}"]{--bm:${MARQUE[f]};--lt:${LIBELLE[f]};--b20:${rgba(JET[f].base, 0.2)};--b35:${rgba(JET[f].base, 0.35)}}`).join('\n');

const CSS = `
  :root { --page: ${K.c950}; --encre: ${K.c50}; --gris: ${K.c400}; --trait: ${K.c800}; --trait2: ${K.c600}; --rail: ${K.c200}; --vise: ${K.c400}; --moment: ${K.cuivre}; --acc: #c2410c;
    --sans: 'Source Sans 3', 'Segoe UI', system-ui, sans-serif; --mono: 'IBM Plex Mono', ui-monospace, Consolas, monospace; color-scheme: dark;
    --fi-bg: ${K.c850}; --fi-tx: ${K.c50}; --fi-tx2: ${K.c200}; --fi-gris: ${K.c400}; --fi-trait: ${K.c700}; --fi-voile: rgba(0,0,0,.55); --fi-rad: 8px;
    --r-anneau: ${K.c700}; --r-encre: ${K.c50}; --r-plein: rgba(245,240,234,.14); }
  ${TONS}
  body { color: ${K.c200}; }
  .retour { color: ${K.c50}; }
  .seg { background: ${K.c900}; border-radius: 8px; padding: 2px; box-shadow: inset 0 0 0 1px ${K.c800}; }
  .seg button { border-radius: 4px; color: ${K.c400}; }
  .seg button[aria-checked="true"] { background: ${K.c700}; color: ${K.c50}; font-weight: 600; }

  /* Les verdicts : une tuile cave-900 par objectif ; le nom de la famille à son ton lisible sur le charbon. */
  .tabl { gap: 4px; }
  .ob { background: ${K.c900}; border-radius: 8px; padding: 5px 10px 6px; box-shadow: inset 0 0 0 1px ${K.c800}; }
  .ob .nom { color: var(--lt); }
  .sens { display: inline-flex; color: ${K.c200}; }
  .alerte { box-shadow: 0 0 0 1.5px ${K.c900}; }
  .rep { color: ${K.c50}; } .signe { display: inline-flex; color: ${K.c50}; } .v-aucune, .v-aucune .signe { color: ${K.c400}; }
  .hh-b { border-radius: 14px; background: ${K.c850}; color: ${K.c50}; box-shadow: inset 0 0 0 1px ${K.c600}; }
  .cible .tr { fill: ${K.c800}; } .cible .pl { fill: var(--b); } .cible .vi { stroke: ${K.c50}; }

  .flou { background: linear-gradient(270deg, rgba(103,145,134,.28), rgba(103,145,134,0)); }
  .puce { background: ${K.c950}; color: ${K.c50}; border-radius: 10px; box-shadow: inset 0 0 0 1px ${K.c400}; }
  .groupe > * { background: var(--page); border-radius: 4px; }
  .gt .t { color: ${K.c50}; }
  .bar { border-radius: 4px; background: var(--bm); }
  .bar.ci { background: var(--b35); box-shadow: inset 0 0 0 1.5px var(--bm); }
  .bar.sf { background: transparent; box-shadow: inset 0 0 0 1px var(--bm); }
  .bar.inconnu { background: repeating-linear-gradient(135deg, transparent 0 3px, ${K.c600} 3px 5px); box-shadow: inset 0 0 0 1px ${K.c600}; }
  .zt { background: var(--b35); } .zt::after { background: ${K.c200}; }
  .lab-i { background: var(--page); color: ${K.c50}; border-radius: 4px; }

  /* La matrice au fond de la page, filet cave-800 ; la tête de colonnes en pastilles au ton base à 20 %. */
  .tete-m { background: var(--page); box-shadow: 0 1px 0 ${K.c700}; }
  .th .pi { width: 20px; height: 20px; padding: 2px; border-radius: 50%; background: var(--b20); }
  .th.o::after { background: ${K.c200}; }
  .th[aria-pressed="true"]::before { background: var(--bm); }
  .tab.meme { background: var(--page); border-radius: 8px; box-shadow: inset 0 0 0 1px ${K.c800}; padding: 0 0 0 9px; }
  .tab.seul { border-top: 1px solid ${K.c800}; }
  .tab.seul .vr { background: var(--page); }
  .vr + .vr { border-top: 1px solid ${K.c800}; } .vr.coupe-l { border-top-color: ${K.c600}; }
  .vr.appui, .vr.survol, .vr.f-source { background: ${K.c850}; }
  .nm { color: ${K.c50}; }
  .us { color: ${K.c200}; background: ${K.c850}; border-radius: 10px; } .us.deduit { background: none; color: ${K.c400}; }
  .ajc { border-radius: 50%; background: ${K.c850}; box-shadow: inset 0 0 0 1px ${K.c600}; color: ${K.c50}; }
  .ajc[aria-pressed="true"] { background: ${K.c50}; color: ${K.c950}; box-shadow: none; }
  .jg i { background: var(--bm); }
  .cf.ci .jg i { background: var(--b35); box-shadow: inset 0 0 0 1.5px var(--bm); }
  .cf.sf .jg i { background: transparent; box-shadow: inset 0 0 0 1px var(--bm); }
  .jg.bas i { background: transparent !important; box-shadow: inset 0 0 0 1.5px ${K.c200} !important; }
  .jg.xs i { background: var(--acc) !important; box-shadow: none !important; }
  .jg.ne i { background: repeating-linear-gradient(135deg, transparent 0 2px, ${K.c600} 2px 3.5px); box-shadow: inset 0 0 0 1px ${K.c600}; }
  .cf.vide::after { background: ${K.c700}; }
  .cf.moins::before { background: ${K.c200}; }
  details.bio summary { border-radius: 11px; background: repeating-linear-gradient(135deg, ${K.c900} 0 3px, ${K.c800} 3px 5.5px); box-shadow: inset 0 0 0 1px ${K.c600}; }
  .bt { background: ${K.c950}; border-radius: 8px; color: ${K.c200}; }
  details.bio[open] ul { background: ${K.c850}; border-radius: 8px; box-shadow: inset 0 0 0 1px ${K.c700}, 0 8px 24px rgba(0,0,0,.6); color: ${K.c200}; }
  details.pli { background: ${K.c900}; border-radius: 8px; color: ${K.c200}; } details.pli summary { color: ${K.c50}; }
  .cmp { border-radius: 20px; background: ${K.paille}; color: ${K.c950}; box-shadow: 0 8px 24px -12px #000; }

  .f-fiche { box-shadow: 0 -10px 30px rgba(0,0,0,.6), inset 0 1px 0 ${K.c700}; }
  .f-bulle { box-shadow: inset 0 0 0 1px ${K.c700}, 0 16px 40px rgba(0,0,0,.6); }
  .f-fermer { border-radius: 50%; background: ${K.c800}; }
  .f-role { border-radius: 12px; background: ${K.c800}; color: ${K.c50}; } .f-role.regle { background: none; box-shadow: inset 0 0 0 1px ${K.c400}; }
  .c { border-radius: 2px; background: ${K.c800}; } .c.m { background: var(--bm); } .c.ci { background: var(--b35); box-shadow: inset 0 0 0 1.5px var(--bm); }
  .f-lab-n { color: var(--lt); }
  .r-pt { fill: ${K.c850}; }
  .f-gout { border-radius: 16px; background: ${K.c800}; }
  .f-g { border-radius: 50%; } .f-g[aria-pressed="true"] { background: ${K.c50}; color: ${K.c950}; }
  .f-act { border-radius: 16px; box-shadow: inset 0 0 0 1px ${K.c600}; color: ${K.c50}; } .f-ajouter { background: ${K.paille}; color: ${K.c950}; box-shadow: none; }
  .f-repli { border-radius: 14px; background: ${K.c800}; } .f-tag { border-radius: 4px; background: ${K.c800}; }
  @keyframes appui { from { background-size: 0 100%; } to { background-size: 100% 100%; } }
  .appui .hn { background: linear-gradient(${K.c700}, ${K.c700}) no-repeat; animation: appui 500ms linear forwards; border-radius: 2px; }`;
const PLANCHE = `
  .mini { box-shadow: 0 0 0 1px ${K.c700}; border-radius: 8px; }
  .sw { border-radius: 4px; box-shadow: inset 0 0 0 1px ${K.c700}; } .sw.s1 { background: ${K.c950}; } .sw.s2 { background: ${K.c900}; } .sw.s3 { background: ${K.c850}; }
  .aa { color: ${K.c50}; } .aa.n { color: ${K.cuivre}; }
  .mini-cmp { border-radius: 16px; background: ${K.paille}; color: ${K.c950}; }`;
construire({ ICI, nom: 'l8c · Cave', css: CSS, cssPlanche: PLANCHE, symb: symboles({ trait: 1.5, ton: (f) => MARQUE[f] }), mots: ['charbon'],
  commentaire: 'Lot 18 · l8c : la disposition de l8, dans la Cave (DESIGN.md, comme l1) : charbon chaud, trois tons de lecture, paille pour Comparer seulement, cuivre pour les moments, familles au ton base (fond pour petits fruits, épicé, résineux), Source Sans 3 et IBM Plex Mono. Appui long (500 ms) ou survol (750 ms) : la fiche g1 dans une feuille cave-850.' });
console.log('marques au ton fond : ' + ORDRE.filter((f) => MARQUE[f] !== JET[f].base).join(', ') + ' ; libellés au ton fond : ' + ORDRE.filter((f) => LIBELLE[f] !== JET[f].base).join(', '));
