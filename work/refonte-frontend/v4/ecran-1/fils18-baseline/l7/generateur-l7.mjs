// Lot 18 · l7 · Néon : q2b (c1) au bar, la nuit. Fond noir ; les familles luisent comme des enseignes :
// un cœur pâle (ton fond des jetons) et un halo au ton de la famille. L'enseigne allumée dit la réponse :
// « Atteint » brille, « Approche » brille à moitié, « Aucune » reste éteinte. Toucher une enseigne allume
// sa famille dans toute la liste (focus et contexte, C6).
// Usage : node generateur-l7.mjs  →  l7/etat-b.html, l7/planche.html
import {
  C, V, OB, OBJ, ORDRE, NOM, JET, REP, repLabel, HH_JS, MEMES, GESTES, AJOUTEES, ACC, CSS_FAMILLES, CSS_FICHE,
  symboles, ic, picto, pill, usages, nomEl, stockMarque, ajc, bioPill, casesVoie, couloirs, fonds, details, slotsDe,
  viseeS, viseeA, p, cl, nomVoie, runtime, page, planche, ecrire, FICHES, motsFiche,
} from './noyau.mjs';

const ICI = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/refonte-frontend/v4/ecran-1/fils18-baseline/l7';
// Le ton néon : la teinte de la famille, éclaircie jusqu'à luire sur le noir (pictos et halos seulement ;
// le texte d'une famille garde un ton des jetons, le fond pâle, qui fait le cœur du tube).
function neon(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  let h = 0, s = 0;
  if (d) { s = d / (1 - Math.abs(2 * l - 1)); h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h = (h * 60 + 360) % 360; }
  const L = Math.max(l, 0.64), S = Math.max(s, 0.55);
  const c = (1 - Math.abs(2 * L - 1)) * S, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = L - c / 2;
  const [R, G, B] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return '#' + [R, G, B].map((v) => Math.round((v + m) * 255).toString(16).padStart(2, '0')).join('');
}
export const NEON = Object.fromEntries(ORDRE.map((f) => [f, neon(JET[f].base)]));
const CSS_NEON = ORDRE.map((f) => `[data-famille="${f}"]{--n:${NEON[f]}}`).join('\n');

const CSS = `
  :root {
    --nuit: #07070b; --tx: #f1f1f6; --tx2: #b9b9c6; --gris: #9d9dab; --trait: #2a2a35; --trait2: #3d3d4a;
    --acc: ${ACC}; --paille: #f2c14e; --gut: 22px;
    --fi-bg: #101017; --fi-tx: #f1f1f6; --fi-tx2: #cfcfda; --fi-gris: #a3a3b1; --fi-trait: #33333f; --fi-voile: rgba(0,0,0,.55); --fi-rad: 8px;
    --r-anneau: #3a3a47; --r-encre: #f6f6fa; --r-plein: rgba(246,246,250,.14);
  }
  ${CSS_FAMILLES}
  ${CSS_NEON}
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: var(--nuit); color: var(--tx); }
  body { font: 400 14px/1.25 Bahnschrift, "DIN Alternate", "Segoe UI", system-ui, sans-serif; font-stretch: 92%; -webkit-tap-highlight-color: transparent;
    background: radial-gradient(120% 60% at 50% -10%, #1a1426 0%, rgba(7,7,11,0) 60%) no-repeat, var(--nuit); }
  button, a { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; text-decoration: none; }
  svg { display: block; flex: none; }
  .ecran { max-width: 390px; margin: 0 auto; padding: 6px 12px 88px; display: flex; flex-direction: column; gap: 12px; overflow-x: hidden; }

  /* Le chrome : des tubes fins, éteints au repos ; le choix courant est allumé en blanc. */
  .barre { display: flex; align-items: center; gap: 6px; height: 36px; }
  .retour { width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; color: var(--tx); }
  .seg { display: flex; border-radius: 16px; padding: 2px; box-shadow: inset 0 0 0 1px var(--trait2); }
  .barre .seg { flex: 1; } .barre .seg button { flex: 1; }
  .seg button { height: 28px; padding: 0 11px; border-radius: 14px; font-size: 13px; color: var(--gris); white-space: nowrap; display: inline-flex; align-items: center; justify-content: center; gap: 4px; letter-spacing: .02em; }
  .seg button[aria-checked="true"] { color: #fff; box-shadow: inset 0 0 0 1.5px #f6f6fa, 0 0 6px rgba(255,255,255,.45), inset 0 0 6px rgba(255,255,255,.25); text-shadow: 0 0 6px rgba(255,255,255,.6); font-weight: 600; }
  .outils { display: flex; justify-content: space-between; gap: 8px; }

  /* Les enseignes : une par objectif. Le tube du cadre au ton néon de la famille. */
  .reps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .ens { position: relative; border-radius: 8px; padding: 8px 8px 9px; min-height: 108px; display: flex; flex-direction: column; gap: 6px; text-align: left;
    box-shadow: inset 0 0 0 1.5px var(--n), 0 0 10px color-mix(in srgb, var(--n) 55%, transparent), inset 0 0 12px color-mix(in srgb, var(--n) 30%, transparent); }
  .ens .nom { display: flex; align-items: center; gap: 5px; font-size: 13px; font-weight: 600; line-height: 1.1; color: var(--f); text-shadow: 0 0 6px var(--n); }
  .ens .nom .pi { filter: drop-shadow(0 0 3px var(--n)); }
  .rep { font-size: 24px; font-weight: 300; line-height: 1; letter-spacing: .01em; color: var(--f); }
  .rep small { display: block; font-size: 12px; font-weight: 400; margin-top: 4px; color: var(--gris); text-shadow: none; letter-spacing: .02em; }
  .v-atteint { text-shadow: 0 0 2px #fff, 0 0 7px var(--n), 0 0 16px var(--n), 0 0 28px var(--n); }
  .v-approche { text-shadow: 0 0 6px var(--n), 0 0 12px color-mix(in srgb, var(--n) 60%, transparent); }
  /* Éteinte : aucune voie houblon. Le tube reste gris, sans halo. */
  .ens.eteinte { box-shadow: inset 0 0 0 1.5px var(--trait2); }
  .ens.eteinte .nom { color: var(--tx2); text-shadow: none; }
  .ens.eteinte .nom .pi { filter: none; opacity: .75; }
  .ens.eteinte .rep { color: var(--gris); text-shadow: none; }
  .ens .pa { position: relative; display: inline-flex; }
  .alerte { position: absolute; right: -3px; bottom: -2px; width: 8px; height: 8px; border-radius: 50%; background: var(--acc); box-shadow: 0 0 6px var(--acc); }
  .hh-b { margin-top: auto; height: 26px; padding: 0 6px 0 8px; border-radius: 13px; font-size: 12px; font-weight: 600; color: var(--tx); display: inline-flex; align-items: center; gap: 2px; box-shadow: inset 0 0 0 1px var(--trait2); align-self: flex-start; white-space: nowrap; }
  .cible { margin-top: auto; }
  .cible .tr { fill: #1d1d26; } .cible .pl { fill: var(--b); filter: drop-shadow(0 0 3px var(--n)); } .cible .vi { stroke: #f6f6fa; }
  .ens[aria-pressed="true"] { box-shadow: inset 0 0 0 2px var(--n), 0 0 18px var(--n), inset 0 0 18px color-mix(in srgb, var(--n) 45%, transparent); }
  .ens.eteinte[aria-pressed="true"] { box-shadow: inset 0 0 0 2px #f6f6fa; }
  .ens-b { position: absolute; inset: 0; border-radius: 8px; z-index: 0; }
  .ens > :not(.ens-b) { position: relative; z-index: 1; pointer-events: none; } .ens .hh-b { pointer-events: auto; }

  /* Le graphique : la ligne de ma bière est un tube blanc ; les visées des traits fins. */
  .graph { position: relative; }
  .fonds { position: absolute; inset: 0; display: flex; pointer-events: none; }
  .moitie { position: relative; flex: 1; } .moitie .ov { position: absolute; inset: 0; }
  .gut { width: var(--gut); flex: none; position: relative; }
  .gut::before { content: ''; position: absolute; top: 0; bottom: 0; left: 10px; width: 2px; border-radius: 2px; background: #f6f6fa; box-shadow: 0 0 6px rgba(255,255,255,.7), 0 0 14px rgba(160,140,255,.35); }
  .vl { position: absolute; top: 0; bottom: 0; width: 0; border-left: 1px dashed rgba(246,246,250,.55); left: var(--s); z-index: 1; }
  body.abs .vl { left: var(--a); }
  .flou { position: absolute; top: 0; bottom: 0; right: var(--s0); width: var(--s1); background: linear-gradient(270deg, rgba(110,200,180,.2), rgba(110,200,180,0)); }
  body.abs .flou { right: var(--a0); width: var(--a1); }
  .tetes { position: relative; display: flex; height: 30px; }
  .tetes .m { flex: 1; position: relative; } .tetes .g { width: var(--gut); flex: none; }
  .axe { position: absolute; top: 4px; height: 1px; background: #c9c9d4; }
  .g-ax { left: 2px; right: 0; } .d-ax { left: 0; right: 2px; }
  .g-ax::before, .d-ax::after { content: ''; position: absolute; top: -3.5px; border: 4px solid transparent; }
  .g-ax::before { left: -4px; border-right: 6px solid #c9c9d4; border-left: 0; } .d-ax::after { right: -4px; border-left: 6px solid #c9c9d4; border-right: 0; }
  .puce { position: absolute; top: 10px; font-size: 12px; font-weight: 600; padding: 1px 7px; border-radius: 8px; white-space: nowrap; color: var(--tx); background: var(--nuit); box-shadow: inset 0 0 0 1px #c9c9d4; display: inline-flex; align-items: center; gap: 2px; letter-spacing: .03em; }
  .puce.gauche-v { left: 4px; } .fl .puce.v { left: calc(var(--s) - 21px); } body.abs .fl .puce.v { left: calc(var(--a) - 21px); }

  .groupe { position: relative; z-index: 3; display: flex; align-items: center; gap: 6px; min-height: 30px; font-size: 13px; font-weight: 600; color: var(--tx2); text-transform: uppercase; letter-spacing: .06em; }
  .groupe > span.t { display: inline-flex; gap: 5px; align-items: center; background: var(--nuit); padding: 2px 6px 2px 2px; border-radius: 8px; white-space: nowrap; }
  .dose, .est { font-size: 13px; color: var(--gris); text-transform: none; letter-spacing: 0; background: var(--nuit); padding: 1px 4px; border-radius: 4px; }
  .mo { display: inline-flex; align-items: center; gap: 3px; height: 22px; padding: 0 7px 0 5px; border-radius: 11px; box-shadow: inset 0 0 0 1px #6e6e7c; background: var(--nuit); font-size: 12px; font-weight: 600; color: var(--tx); white-space: nowrap; font-variant-numeric: tabular-nums; text-transform: none; letter-spacing: 0; flex: none; }
  .bars { position: relative; display: flex; height: 32px; }
  .bars .m { position: relative; flex: 1; } .bars .g { width: var(--gut); flex: none; }
  .ln { position: absolute; left: 0; right: 0; height: 8px; } .ln.a { top: 1px; } .ln.b { top: 17px; }
  .zt { position: absolute; bottom: -4px; height: 1.5px; width: var(--s); background: color-mix(in srgb, var(--c) 70%, transparent); }
  .zt::after { content: ''; position: absolute; top: -4px; width: 2px; height: 8px; border-radius: 2px; background: var(--c); }
  .fl .zt { left: 0; } .fl .zt::after { right: -1px; } .re .zt { right: 0; } .re .zt::after { left: -1px; }
  .zt.cs::after { display: none; } body.abs .zt.cs::after { display: block; } body.abs .zt.ca::after { display: none; } body.abs .zt { width: var(--a); }
  /* Les barres sont des tubes : cœur au ton de la famille, halo néon. */
  .bar { position: absolute; top: 0; height: 8px; min-width: 3px; width: var(--s); border-radius: 4px; background: var(--b); box-shadow: 0 0 6px var(--n), 0 0 12px color-mix(in srgb, var(--n) 50%, transparent); z-index: 1; }
  body.abs .bar:not(.inconnu) { width: var(--a); }
  .fl .bar { left: 0; } .re .bar { right: 0; }
  .bar.ci { background: transparent; box-shadow: inset 0 0 0 1.5px var(--n), 0 0 5px color-mix(in srgb, var(--n) 60%, transparent); }
  .bar.sf { background: transparent; box-shadow: inset 0 0 0 1px var(--n); }
  .bar.inconnu { width: 24px; background: repeating-linear-gradient(135deg, transparent 0 3px, #5e5e6c 3px 5px); box-shadow: inset 0 0 0 1px #6e6e7c; }
  .hs { position: absolute; top: 0; height: 8px; left: var(--s0); width: var(--s1); background: var(--acc); box-shadow: 0 0 8px var(--acc); z-index: 2; border-radius: 4px; }
  .re .hs { left: auto; right: var(--s0); } body.abs .hs { left: var(--a0); width: var(--a1); } body.abs .re .hs { left: auto; right: var(--a0); }
  .lab-i { position: absolute; top: -4px; left: calc(var(--s) + 6px); font-size: 12px; font-weight: 600; white-space: nowrap; background: var(--nuit); color: var(--tx); padding: 0 4px; border-radius: 4px; z-index: 3; line-height: 16px; }
  body.abs .lab-i { left: calc(var(--a) + 6px); }
  .rangee { position: relative; padding: 2px 0 10px; }

  /* Le tableau des voies : pas de panneau ; le fond de la nuit masque le rail, un tube blanc à gauche relie le groupe. */
  .tab { position: relative; z-index: 3; margin: 0 0 12px; background: var(--nuit); border-radius: 8px; padding: 0 2px 0 12px; box-shadow: inset 2px 0 0 #f6f6fa, -3px 0 8px -4px rgba(255,255,255,.6); }
  .tab.seul { box-shadow: none; padding: 0 2px; border-top: 1px solid var(--trait); border-radius: 0; margin: 0 0 4px; background: none; z-index: auto; }
  .tab.seul .vr { padding: 7px 2px 2px; }
  .tab.seul .nm, .tab.seul .gr, .tab.seul .us, .tab.seul .ajc, .tab.seul details.bio summary { position: relative; z-index: 3; background-color: var(--nuit); }
  .tab.seul .nm, .tab.seul .gr { border-radius: 4px; padding: 1px 3px; }
  .tab.seul .cases { background: var(--nuit); border-radius: 8px; padding: 2px 4px 0; width: max-content; position: relative; z-index: 3; }
  .tab.seul .rangee.in { padding: 4px 0 8px; }
  .vr { padding: 7px 0; position: relative; }
  .vr + .vr { border-top: 1px solid var(--trait); } .vr.coupe-l { border-top-color: var(--trait2); }
  .l1 { display: flex; align-items: center; gap: 6px; min-height: 28px; }
  .nm { font-size: 15px; font-weight: 600; line-height: 1.15; color: var(--tx); letter-spacing: .01em; }
  .f-source { background: var(--nuit); }
  .hn { -webkit-touch-callout: none; -webkit-user-select: none; user-select: none; }
  .q { font-size: 13px; color: var(--gris); white-space: nowrap; }
  .gr { display: inline-flex; align-items: center; gap: 4px; color: var(--gris); }
  .stk { display: inline-flex; color: var(--gris); }
  .us { display: inline-flex; align-items: center; gap: 0; color: var(--tx2); height: 20px; padding: 0 4px; border-radius: 10px; box-shadow: inset 0 0 0 1px var(--trait2); }
  .us.deduit { box-shadow: none; padding: 0 2px; color: var(--gris); opacity: .8; }
  .us .inc { font-size: 12px; color: var(--gris); }
  .ajc { margin-left: auto; width: 30px; height: 30px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: var(--tx); box-shadow: inset 0 0 0 1.5px #8f8f9e; flex: none; }
  .ajc .i-check { display: none; }
  .ajc[aria-pressed="true"] { box-shadow: inset 0 0 0 1.5px var(--paille), 0 0 8px rgba(242,193,78,.6); color: var(--paille); }
  .ajc[aria-pressed="true"] .i-check { display: block; } .ajc[aria-pressed="true"] .i-plus { display: none; }
  .cases { display: flex; align-items: flex-start; gap: 7px; margin-top: 5px; }
  .objs, .exs { display: inline-flex; gap: 3px; }
  .objs { padding-right: 7px; border-right: 1px solid var(--trait2); }
  .cf { width: 22px; height: 30px; display: inline-flex; flex-direction: column; align-items: center; gap: 4px; position: relative; transition: opacity .2s; }
  .cf .pi { width: 18px; height: 18px; padding: 1px; }
  .cf.mq .pi { filter: drop-shadow(0 0 2.5px var(--n)) drop-shadow(0 0 5px var(--n)); }
  .cf.ci .pi { opacity: .55; }
  .cf.sf .pi, .cf.ne .pi { opacity: .3; }
  .cf.o .pi { border-radius: 50%; box-shadow: 0 0 0 1px #7a7a88; }
  .cf.vide::after { content: ''; width: 3px; height: 3px; border-radius: 50%; background: #3a3a46; margin-top: 8px; }
  .cf.moins::before { content: ''; position: absolute; left: -2px; top: -1px; width: 7px; height: 2px; border-radius: 2px; background: var(--tx); z-index: 1; }
  .jg { display: inline-flex; gap: 2px; height: 5px; align-items: flex-end; }
  .jg i { width: 4px; height: 5px; border-radius: 2px; background: var(--b); box-shadow: 0 0 4px var(--n); }
  .jg i.pt { width: 3px; height: 3px; }
  .jg.bas i { background: transparent; box-shadow: inset 0 0 0 1px var(--n); } .jg.bas i.pt { background: var(--b); }
  .jg.xs i { background: var(--acc); box-shadow: 0 0 5px var(--acc); }
  .jg.ne i { width: 14px; height: 5px; border-radius: 2px; background: repeating-linear-gradient(135deg, transparent 0 2px, #6e6e7c 2px 3.5px); box-shadow: inset 0 0 0 1px #6e6e7c; }
  /* Une enseigne touchée allume sa famille ; les autres s'éteignent. */
  body[data-allume] .cf[data-famille], body[data-allume] .bar[data-famille] { opacity: .2; }
  body[data-allume="floral"] [data-famille="floral"], body[data-allume="citrus"] [data-famille="citrus"], body[data-allume="resin"] [data-famille="resin"] { opacity: 1 !important; }

  details.bio { display: inline-block; }
  details.bio summary { list-style: none; display: inline-flex; align-items: center; gap: 3px; height: 24px; padding: 0 5px; border-radius: 12px; background: repeating-linear-gradient(135deg, transparent 0 3px, #2e2e3a 3px 5.5px); box-shadow: inset 0 0 0 1px #6e6e7c; cursor: pointer; }
  details.bio summary::-webkit-details-marker { display: none; }
  .bt { display: inline-flex; align-items: center; gap: 1px; background: var(--nuit); border-radius: 8px; padding: 0 3px; height: 18px; color: var(--tx2); }
  .bt.mot span { font-size: 12px; font-weight: 600; margin-left: 2px; color: var(--tx); }
  details.bio[open] ul { position: absolute; left: 6px; right: 6px; z-index: 6; background: #12121a; border-radius: 8px; box-shadow: inset 0 0 0 1px var(--trait2), 0 8px 22px rgba(0,0,0,.6); padding: 10px 12px 10px 26px; font-size: 13px; display: flex; flex-direction: column; gap: 6px; color: var(--tx); }
  .src { color: var(--gris); font-size: 12px; }
  details.pli { border-radius: 8px; box-shadow: inset 0 0 0 1px var(--trait2); padding: 10px 12px; }
  details.pli summary { font-size: 14px; font-weight: 600; cursor: pointer; color: var(--tx); }
  details.pli ul { margin: 8px 0 0 16px; display: flex; flex-direction: column; gap: 6px; font-size: 13px; color: var(--tx2); }

  /* L'action principale : l'enseigne paille. */
  .cmp { position: fixed; z-index: 8; left: 50%; transform: translateX(-50%); bottom: 14px; width: 358px; max-width: calc(100% - 32px); height: 46px; border-radius: 23px; background: #0c0b08; color: var(--paille);
    display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 17px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase;
    box-shadow: inset 0 0 0 2px var(--paille), 0 0 14px rgba(242,193,78,.55), inset 0 0 12px rgba(242,193,78,.25), 0 10px 24px rgba(0,0,0,.7); text-shadow: 0 0 8px rgba(242,193,78,.8); }

  /* La fiche, de nuit : la feuille a un tube blanc en tête. */
  ${CSS_FICHE}
  .f-fiche { box-shadow: 0 -1px 0 #f6f6fa, 0 -6px 18px rgba(255,255,255,.18), 0 -12px 40px rgba(0,0,0,.8); font-family: inherit; }
  .f-bulle { box-shadow: inset 0 0 0 1px #f6f6fa, 0 0 18px rgba(255,255,255,.2), 0 18px 40px rgba(0,0,0,.8); }
  .f-nom { font-weight: 300; font-size: 24px; letter-spacing: .02em; text-shadow: 0 0 8px rgba(255,255,255,.5); }
  .f-fermer { border-radius: 50%; box-shadow: inset 0 0 0 1px var(--trait2); }
  .f-aa { font-weight: 600; }
  .f-role { border-radius: 12px; box-shadow: inset 0 0 0 1px #8f8f9e; color: var(--fi-tx); }
  .f-role.regle { box-shadow: none; outline: 1px dashed #8f8f9e; outline-offset: -1px; border-radius: 0; }
  .c { border-radius: 4px; background: #1c1c25; }
  .c.m { background: var(--b); box-shadow: 0 0 6px var(--n); }
  .c.ci { background: transparent; box-shadow: inset 0 0 0 1.5px var(--n); }
  .f-lab-n { color: var(--f); }
  .f-dem-i b { color: var(--fi-tx); }
  .f-g { border-radius: 4px; } .f-g[aria-pressed="true"] { color: var(--paille); }
  .f-gout { border-radius: 8px; box-shadow: inset 0 0 0 1px var(--trait2); }
  .f-act { border-radius: 16px; box-shadow: inset 0 0 0 1.5px #c9c9d4; color: var(--fi-tx); }
  .f-ajouter { box-shadow: inset 0 0 0 1.5px var(--paille), 0 0 8px rgba(242,193,78,.45); color: var(--paille); }
  .f-act[aria-pressed="true"] { color: var(--paille); }
  .f-repli { border-radius: 14px; box-shadow: inset 0 0 0 1px var(--trait2); }
  .f-tag { border-radius: 4px; box-shadow: inset 0 0 0 1px var(--trait2); }
  @keyframes appui { from { text-shadow: 0 0 0 transparent; } to { text-shadow: 0 0 10px #fff, 0 0 20px #b9a7ff; } }
  .appui .hn, .survol .hn { color: #fff; }
`;

// ---------- l'écran ----------
const tete = () => `
  <div class="barre">
    <a class="retour" href="#" aria-label="Retour">${ic('chev-l', 20)}</a>
    <div class="seg" role="radiogroup" aria-label="Partie">${['Ma bière', 'Suggestions', 'Comparer'].map((x) => `<button role="radio" aria-checked="${x === 'Suggestions'}">${x}</button>`).join('')}</div>
  </div>
  <div class="outils">
    <div class="seg lentille" role="radiogroup" aria-label="Lecture des familles"><button role="radio" data-e="style" aria-checked="true">Au style</button><button role="radio" data-e="absolu" aria-checked="false">Absolu</button></div>
    <div class="seg" role="radiogroup" aria-label="Vue"><button role="radio" aria-checked="true">${ic('barres', 14)}Barres</button><button role="radio" aria-checked="false">${ic('radar', 14)}Radar</button></div>
  </div>`;
function cible(frac, visee, f) {
  const w = 76, x = Math.round(visee * w), b = Math.round(Math.min(1, frac) * w);
  return `<svg class="cible" width="${w}" height="22" viewBox="0 0 ${w} 22" aria-hidden="true" data-famille="${f}"><rect class="tr" x="0" y="8" width="${w}" height="6" rx="3"/><rect class="pl" x="0" y="8" width="${b}" height="6" rx="3"/><line class="vi" x1="${x}" y1="1" x2="${x}" y2="21" stroke-width="2" stroke-dasharray="3 2.5"/></svg>`;
}
const enseigne = (f, inner, cls = '') => `<section class="ens ${f}${cls}" data-role="objectif" data-famille="${f}" aria-label="${repLabel[f]}"><button class="ens-b" aria-pressed="false" data-allume="${f}" aria-label="Allumer ${NOM[f].toLowerCase()} dans la liste"></button>${inner}</section>`;
const reponses = () => `
  <div class="reps">
    ${enseigne('resin', `<span class="nom"><span class="pa">${picto('resin', 18)}<i class="alerte"></i></span>Moins résineux</span>
      <div class="rep v-${REP.resin.verdict}" data-role="reponse" data-famille="resin" data-verdict="${REP.resin.verdict}">${REP.MOT[REP.resin.verdict]}<small>voie houblon</small></div>
      <button class="hh-b" onclick="${HH_JS}">Hors houblon${ic('chev-r', 12)}</button>`, REP.resin.verdict === 'aucune' ? ' eteinte' : '')}
    ${enseigne('floral', `<span class="nom">${picto('floral', 18)}Plus floral</span>
      <div class="rep v-${REP.floral.verdict}" data-role="reponse" data-famille="floral" data-verdict="${REP.floral.verdict}">${REP.MOT[REP.floral.verdict]}</div>
      ${cible(REP.floral.frac / 1.15, 1 / 1.15, 'floral')}`)}
    ${enseigne('citrus', `<span class="nom">${picto('citrus', 18)}Plus agrumes</span>
      <div class="rep v-${REP.citrus.verdict}" data-role="reponse" data-famille="citrus" data-verdict="${REP.citrus.verdict}">${REP.MOT[REP.citrus.verdict]}</div>
      ${cible(REP.citrus.frac / 1.7, 1 / 1.7, 'citrus')}`)}
  </div>`;
const tetes = () => `
    <div class="tetes" aria-hidden="true">
      <div class="m re"><i class="axe g-ax"></i><span class="puce gauche-v">${ic('chev-l', 12)}visée</span></div>
      <div class="g"></div>
      <div class="m fl"><i class="axe d-ax"></i><span class="puce v" style="--s:${p(viseeS('floral'))};--a:${p(viseeA('floral'))}">visée</span></div>
    </div>`;
const ligne = (X, slots, cls = '') => {
  const { q } = nomVoie(X.v), hop = !X.v.levureVers;
  const dose = X.v.type === 'assemblage' ? '<span class="q">5+5 g ≈</span>' : q ? `<span class="q">${q}</span>` : '';
  return `<div class="vr${cls}" data-voie="${X.n}"${hop ? ' data-role="ligne-houblon"' : ''}>
        <div class="l1">${nomEl(X)}${usages(X.v, 14)}<span class="gr">${dose}${stockMarque(X.v, 14)}</span>${bioPill(X)}${ajc(X)}</div>
        ${casesVoie(X, slots)}
      </div>`;
};
const blocMeme = (g) => `
    <div class="groupe"><span class="t">${ic('egal', 14)}${g.gi ? 'même effet' : 'même effet sur tes objectifs'}</span><span class="dose">${g.dose}</span>${pill(g.moment)}</div>
    <div class="rangee">${couloirs(g.voies[0], true)}</div>
    <div class="tab">${g.voies.map((X, i) => ligne(X, slotsDe(g.voies), g.coupe(i) ? ' coupe-l' : '')).join('')}</div>`;
const blocGeste = (g) => `
    <div class="groupe"><span class="t">${g.ic ? ic(g.ic, 14) : ''}${g.t}</span>${pill(g.mo)}${g.est ? '<span class="est">estimé</span>' : ''}</div>
    ${g.voies.map((X) => `<div class="tab seul">${ligne(X, slotsDe(g.voies))}<div class="rangee in">${couloirs(X, false)}</div></div>`).join('')}`;
const corps = `${tete()}${reponses()}
  <div class="graph">${fonds()}${tetes()}
    ${MEMES.map(blocMeme).join('')}
    ${GESTES.map(blocGeste).join('')}
  </div>
  ${details()}
  <a class="cmp" data-role="comparer" href="../../fils15-s5-complexe/q2b/comparer.html">Comparer <b class="nb">(${AJOUTEES.length})</b></a>`;
const ALLUMER = `
document.querySelectorAll('.ens-b').forEach((b) => b.addEventListener('click', () => {
  const on = b.getAttribute('aria-pressed') !== 'true';
  document.querySelectorAll('.ens-b').forEach((x) => x.setAttribute('aria-pressed', String(on && x === b)));
  document.querySelectorAll('.ens').forEach((x) => x.setAttribute('aria-pressed', String(on && x.contains(b))));
  if (on) document.body.dataset.allume = b.dataset.allume; else delete document.body.dataset.allume;
}));`;
const SYMB = symboles({ trait: 1.5, ton: (f) => NEON[f] });
ecrire(ICI + '/etat-b.html', page({
  titre: 'Néon · Suggestions', css: CSS, symb: SYMB, corps, js: runtime({ extra: ALLUMER }),
  commentaire: 'Lot 18 · l7 · Néon, sur q2b (c1). Même contenu que q2b : réponses, demi-pistes, groupes au même effet, gestes seuls, replis. En plus : l\'enseigne touchée allume sa famille dans la liste ; l\'appui long (500 ms) ou le survol (750 ms) sur un houblon, ou sur toute sa ligne, ouvre sa fiche g1. Les pictos et les halos prennent un ton néon recalculé (teinte de la famille, luminosité 0,64 au moins) ; le texte d\'une famille garde le ton fond des jetons.',
}));
// ---------- la planche : l'écran en mini et l'abécédaire du néon ----------
const X1 = V[0];
const fig = (contenu, mot) => `<figure><div class="ech">${contenu}</div><figcaption>${mot}</figcaption></figure>`;
const ABC = [
  fig('<span class="sw" style="background:var(--nuit)"></span><span class="sw" style="background:#101017"></span><span class="sw tube"></span>', 'nuit'),
  fig('<span class="aa">Aa</span><span class="aa b">Aa</span>', 'texte'),
  fig(`<button class="ajc" aria-pressed="false" aria-label="Ajouter">${ic('plus', 16, 'ic i-plus')}${ic('check', 16, 'ic i-check')}</button><button class="ajc" aria-pressed="true" aria-label="Ajouté">${ic('plus', 16, 'ic i-plus')}${ic('check', 16, 'ic i-check')}</button>`, 'ajouter'),
  fig(`<span class="cf o mq" data-famille="floral">${picto('floral', 16)}<span class="jg"><i></i><i></i></span></span><span class="cf ci" data-famille="tropical">${picto('tropical', 16)}<span class="jg"><i></i></span></span><span class="cf hors" data-famille="citrus">${picto('citrus', 16)}<span class="jg xs"><i></i><i></i><i></i></span></span>`, 'familles'),
  fig(`<div class="mbar">${couloirs(X1, false)}</div>`, 'piste'),
  fig(`<span class="mini-cmp">Comparer</span>`, 'action'),
  fig(`<span class="ens floral mini-e" data-famille="floral"><span class="rep v-atteint">Atteint</span></span>`, 'allumée'),
  fig(`<span class="ens floral mini-e" data-famille="floral"><span class="rep v-approche">Approche</span></span>`, 'à moitié'),
  fig(`<span class="ens resin mini-e eteinte" data-famille="resin"><span class="rep v-aucune">Aucune</span></span>`, 'éteinte'),
].join('');
const CSS_PL = CSS + `
  body { background: var(--nuit); }
  .mini { box-shadow: 0 0 0 1px var(--trait2), 0 0 16px rgba(160,140,255,.18); border-radius: 8px; }
  .abc figcaption { color: var(--gris); letter-spacing: .04em; }
  .sw { width: 24px; height: 32px; border-radius: 4px; box-shadow: inset 0 0 0 1px var(--trait2); margin: 0 2px; }
  .sw.tube { width: 6px; background: #f6f6fa; box-shadow: 0 0 8px rgba(255,255,255,.8); border-radius: 4px; }
  .aa { font-size: 28px; font-weight: 300; color: #fcf8e3; text-shadow: 0 0 6px #d9b414, 0 0 14px #d9b414; margin: 0 4px; } .aa.b { font-weight: 600; color: var(--tx); text-shadow: none; font-size: 22px; }
  .abc .ajc { margin: 0 4px; }
  .mbar { width: 110px; } .mbar .bars { height: 30px; }
  .mini-cmp { height: 30px; padding: 0 12px; border-radius: 15px; display: inline-flex; align-items: center; color: var(--paille); font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; box-shadow: inset 0 0 0 1.5px var(--paille), 0 0 10px rgba(242,193,78,.5); text-shadow: 0 0 6px rgba(242,193,78,.8); }
  .mini-e { min-height: 40px; width: 100px; padding: 6px 8px; justify-content: center; }
  .mini-e .rep { font-size: 18px; }`;
ecrire(ICI + '/planche.html', planche({ titre: 'Néon · planche', css: CSS_PL, symb: SYMB, abc: ABC }));
for (const [n, F] of Object.entries(FICHES)) { const m = motsFiche(F); if (m > 95) console.log('  fiche ' + n + ' : ' + m + ' mots estimés'); }
