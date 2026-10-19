// Les peaux des deux baselines du lot 18. Rayons permis : 2, 4, 8 px, pilule ou rond (D83, S3).

// l3 · Étiquette : papier crème, encre, aplats de famille francs, titres condensés en capitales,
// badges ronds, ombres d'impression décalées ; la paille pour la seule action principale.
export const CSS_L3 = `
  :root { --encre: #1a1714; --papier: #fbf6ea; --gris: #5c554a; --trait: #ddd3bf; --acc: #c2410c; --paille: #f2c14e; --gut: 22px;
    --cond: "Bahnschrift", "DIN Alternate", "Arial Narrow", sans-serif; }
  html, body { background: var(--papier); color: var(--encre); }
  body { font: 400 14px/1.25 "Bahnschrift", "Segoe UI", system-ui, sans-serif; -webkit-tap-highlight-color: transparent; }
  .cd { font-family: var(--cond); font-stretch: 75%; text-transform: uppercase; }
  .ecran { gap: 10px; }
  .haut { display: flex; flex-direction: column; gap: 8px; }
  .barre { height: 36px; }
  .seg.nav { background: var(--encre); border-radius: 18px; padding: 3px; height: 36px; }
  .seg.nav button { height: 30px; border-radius: 15px; font: 700 14px/1 var(--cond); font-stretch: 75%; text-transform: uppercase; letter-spacing: .05em; color: #ece4d2; }
  .seg.nav button[aria-checked="true"] { background: var(--papier); color: var(--encre); }
  .cartouche { display: flex; align-items: center; gap: 8px; border-top: 3px solid var(--encre); border-bottom: 3px solid var(--encre); padding: 5px 2px 4px; }
  .ct-nom { font: 800 23px/1 var(--cond); font-stretch: 75%; text-transform: uppercase; letter-spacing: .01em; }
  .ct-style { font: 700 13px/1 var(--cond); font-stretch: 75%; padding: 3px 6px 2px; border: 2px solid var(--encre); border-radius: 2px; }
  .ct-ibu { margin-left: auto; display: inline-flex; align-items: center; gap: 4px; }
  .ct-ibu b { font: 800 23px/1 var(--cond); font-stretch: 75%; font-variant-numeric: tabular-nums; }
  .ct-ibu small { font: 700 13px/1 var(--cond); font-stretch: 75%; margin-right: 2px; }
  .outils { margin-top: 0; }
  .outils .seg { border: 2px solid var(--encre); border-radius: 4px; overflow: hidden; background: #fff; }
  .outils .seg button { height: 28px; padding: 0 10px; font: 700 13px/1 var(--cond); font-stretch: 75%; text-transform: uppercase; letter-spacing: .06em; color: var(--encre); }
  .outils .seg button[aria-checked="true"] { background: var(--encre); color: var(--papier); }

  .reps { gap: 6px; }
  .tuile { background: var(--c); color: var(--sur); border-radius: 8px; padding: 8px 8px 9px; gap: 4px; min-height: 132px; box-shadow: 3px 3px 0 var(--encre); }
  .sceau { width: 30px; height: 30px; border-radius: 50%; background: var(--sc); align-items: center; justify-content: center; }
  .sceau .pi { width: 18px; height: 18px; }
  .sceau .alerte { right: -2px; bottom: -1px; box-shadow: 0 0 0 2px var(--c); }
  .tuile .nom { font: 700 14px/1.02 var(--cond); font-stretch: 75%; text-transform: uppercase; letter-spacing: .03em; }
  .rep { font: 800 24px/.95 var(--cond); font-stretch: 75%; text-transform: uppercase; margin-top: auto; }
  .rep small { font: 700 13px/1.1 var(--cond); font-stretch: 75%; letter-spacing: .04em; margin-top: 3px; }
  .hh-b { margin-top: 6px; height: 26px; padding: 0 5px 0 9px; border-radius: 13px; background: #fff; color: var(--encre); font: 700 13px/1 var(--cond); font-stretch: 75%; text-transform: uppercase; letter-spacing: .03em; }
  .cible { margin-top: 6px; display: block; }

  .gut::before { content: ''; position: absolute; top: 0; bottom: 0; left: 9px; width: 4px; border-radius: 2px; background: var(--encre); }
  .vl { border-left: 2px dashed var(--encre); }
  .flou { background: linear-gradient(270deg, rgba(47,107,95,.30), rgba(47,107,95,.04)); }
  .axe { height: 3px; background: var(--encre); }
  .g-ax::before { top: -4px; left: -6px; border-width: 5.5px 8px 5.5px 0; border-color: transparent var(--encre) transparent transparent; border-style: solid; }
  .d-ax::after { top: -4px; right: -6px; border-width: 5.5px 0 5.5px 8px; border-color: transparent transparent transparent var(--encre); border-style: solid; }
  .puce { top: 12px; font: 700 13px/1 var(--cond); font-stretch: 75%; text-transform: uppercase; letter-spacing: .05em; padding: 3px 6px; border-radius: 2px; background: var(--encre); color: var(--papier); }
  .fl .puce.pv { padding: 2px 4px; background: #fff; box-shadow: inset 0 0 0 2px var(--encre); }

  .groupe { gap: 5px; font: 700 13px/1 var(--cond); font-stretch: 75%; text-transform: uppercase; letter-spacing: .04em; }
  .groupe > span.t { background: var(--encre); color: var(--papier); padding: 5px 8px 4px; border-radius: 2px; }
  .dose { background: var(--papier); border: 2px solid var(--encre); padding: 3px 6px 2px; border-radius: 2px; font-variant-numeric: tabular-nums; }
  .est { background: var(--papier); border: 2px dashed var(--gris); color: var(--gris); padding: 3px 6px 2px; border-radius: 2px; }
  .mo { height: 24px; padding: 0 7px; border-radius: 2px; border: 2px solid var(--encre); background: var(--papier); font: 700 13px/1 var(--cond); font-stretch: 75%; }
  .bars { height: 36px; }
  .ln { height: 12px; } .ln.a { top: 0; } .ln.b { top: 19px; }
  .zt { bottom: -5px; height: 3px; background: var(--c); }
  .zt::after { top: -4px; width: 3px; height: 11px; background: var(--encre); }
  .bar { height: 12px; background: var(--c); }
  .re .bar { border-radius: 2px 0 0 2px; }
  .bar.ci { background: var(--f); box-shadow: inset 0 0 0 2px var(--c); }
  .bar.sf { background: #fff; box-shadow: inset 0 0 0 2px var(--c); }
  .bar.inconnu { width: 26px; background: repeating-linear-gradient(135deg, #fff 0 3px, #8a8378 3px 5px); box-shadow: inset 0 0 0 1.5px var(--encre); }
  .hs { height: 12px; }
  .re .hs { border-radius: 2px 0 0 2px; }
  .lab-i { top: -3px; font: 800 13px/18px var(--cond); font-stretch: 75%; text-transform: uppercase; padding: 0 5px; background: var(--encre); color: var(--papier); border-radius: 2px; letter-spacing: .03em; }

  .tab { margin: 2px 0 14px; background: #fff; border: 2px solid var(--encre); border-radius: 8px; padding: 0 8px; box-shadow: 4px 4px 0 var(--encre); }
  .vr { padding: 6px 0 7px; }
  .vr + .vr { border-top: 1.5px solid var(--trait); }
  .vr.coupe-l { border-top: 2px solid var(--encre); }
  .l1 { gap: 5px; }
  .nm { font: 700 18px/1.05 var(--cond); font-stretch: 75%; text-transform: uppercase; letter-spacing: .01em; }
  .et { padding: 0 3px; }
  .q { font: 700 14px/1 var(--cond); font-stretch: 75%; color: var(--gris); white-space: nowrap; }
  .stk { color: var(--gris); }
  .us { color: var(--encre); gap: 0; }
  .us:not(.deduit) { background: var(--encre); color: var(--papier); border-radius: 10px; height: 20px; padding: 0 5px; }
  .us.deduit::after { content: 'α'; font: 700 13px/1 var(--cond); margin-left: 1px; }
  .us .inc { font-size: 13px; }
  .ajc { width: 32px; height: 32px; border-radius: 50%; background: #fff; color: var(--encre); box-shadow: inset 0 0 0 2.5px var(--encre); }
  .ajc[aria-pressed="true"] { background: var(--encre); color: #fff; }
  .cases { gap: 7px; margin-top: 5px; }
  .objs { padding-right: 7px; border-right: 2px solid var(--encre); }
  .objs, .exs { gap: 3px; }
  .cf { width: 24px; gap: 3px; }
  .cf .pi { width: 22px; height: 22px; padding: 4px; border-radius: 50%; }
  .cf.mq .pi { background: var(--c); }
  .cf.ci .pi { background: #fff; box-shadow: inset 0 0 0 2px var(--c); }
  .cf.sf .pi { background: #fff; border: 1.5px dashed var(--c); padding: 3px; }
  .cf.o .pi { outline: 2px solid var(--encre); outline-offset: 1px; }
  .cf.ne .pi { background: #fff; box-shadow: inset 0 0 0 1.5px #b5ad9c; opacity: .45; }
  .cf.vide::after { content: ''; width: 5px; height: 5px; border-radius: 50%; background: #cfc6b3; margin-top: 9px; }
  .cf.moins::before { content: ''; position: absolute; left: -3px; top: -3px; width: 9px; height: 3px; background: var(--encre); box-shadow: 0 0 0 1.5px #fff; z-index: 1; }
  .jg { gap: 2px; height: 7px; }
  .jg i { width: 5px; height: 7px; background: var(--encre); }
  .jg i.pt { width: 4px; height: 4px; border-radius: 50%; }
  .jg.bas i { background: #fff; box-shadow: inset 0 0 0 1.5px var(--encre); }
  .jg.bas i.pt { background: var(--encre); }
  .jg.xs i { background: var(--acc); }
  .jg.ne i { width: 16px; height: 6px; background: repeating-linear-gradient(135deg, #fff 0 2px, #8a8378 2px 3.5px); box-shadow: inset 0 0 0 1px #8a8378; }

  details.bio summary { height: 26px; padding: 0 6px; border-radius: 13px; background: repeating-linear-gradient(135deg, #fff 0 3px, #d8cfbd 3px 5.5px); box-shadow: inset 0 0 0 2px var(--encre); }
  .bt { background: #fff; border-radius: 9px; padding: 0 4px; height: 18px; color: var(--encre); }
  .bt.mot span { font: 700 13px/1 var(--cond); font-stretch: 75%; text-transform: uppercase; }
  details.bio[open] ul { background: #fff; border: 2px solid var(--encre); border-radius: 8px; box-shadow: 4px 4px 0 var(--encre); font-size: 13px; }
  .src { color: var(--gris); font-size: 12px; }
  details.pli { background: #fff; border: 2px solid var(--encre); border-radius: 8px; padding: 10px 12px; }
  details.pli summary { font: 700 15px/1.15 var(--cond); font-stretch: 75%; text-transform: uppercase; letter-spacing: .03em; }
  details.pli ul { font-size: 13px; }
  .tab.seul { background: none; border: 0; box-shadow: none; padding: 0; margin: 0 0 4px; border-top: 2px solid var(--encre); border-radius: 0; z-index: auto; }
  .tab.seul .vr { padding: 6px 4px 2px; }
  .tab.seul .nm, .tab.seul .gr, .tab.seul .us.deduit { background: var(--papier); padding: 1px 3px; }
  .tab.seul .cases { background: var(--papier); padding: 2px 4px 0; width: max-content; position: relative; z-index: 2; }
  .tab.seul .ajc { z-index: 2; }
  .tab.seul .rangee.in { padding: 4px 0 10px; }
  .cmp { height: 52px; border-radius: 26px; background: var(--paille); color: var(--encre); border: 2.5px solid var(--encre); box-shadow: 4px 4px 0 var(--encre); font: 800 19px/1 var(--cond); font-stretch: 75%; text-transform: uppercase; letter-spacing: .06em; }
  .cmp .nb { background: var(--encre); color: var(--paille); border-radius: 13px; padding: 4px 9px 3px; font-variant-numeric: tabular-nums; }

  /* Un nom de houblon porte sa fiche : souligné ; pendant l'appui, il se remplit de paille. */
  .hn[data-houblon] { text-decoration: underline dotted 2px; text-underline-offset: 3px; background: linear-gradient(var(--paille), var(--paille)) no-repeat 0 0 / 0% 100%; }
  [data-houblon].appui { background-size: 100% 100%; transition: background-size .5s linear; }
  .vr.f-source { outline: 3px solid var(--paille); outline-offset: 1px; }

  /* La fiche : une étiquette. Bandeau d'encre, gros α, carrés de famille francs. */
  .f-fiche { background: var(--papier); color: var(--encre); border: 3px solid var(--encre); }
  .f-feuille { border-radius: 8px 8px 0 0; border-bottom: 0; }
  .f-bulle { border-radius: 8px; box-shadow: 6px 6px 0 var(--encre); }
  .f-poignee { background: var(--encre); border-radius: 2px; }
  .f-tete { margin: 0 -16px; padding: 7px 12px 7px 16px; background: var(--encre); color: var(--papier); }
  .f-bulle .f-tete { margin-top: -12px; }
  .f-nom { font: 800 27px/1 var(--cond); font-stretch: 75%; text-transform: uppercase; letter-spacing: .02em; }
  .f-tete .stk { color: var(--papier); }
  .f-fermer { border-radius: 50%; background: var(--papier); color: var(--encre); }
  .f-grec { font: 700 20px/1 var(--cond); }
  .f-aa { font: 800 32px/1 var(--cond); font-stretch: 75%; font-variant-numeric: tabular-nums; }
  .f-lot { font: 700 14px/1 var(--cond); font-stretch: 75%; color: var(--gris); text-transform: uppercase; }
  .f-role { margin-left: auto; border: 2px solid var(--encre); border-radius: 13px; padding: 3px 9px 2px; font: 700 14px/1 var(--cond); font-stretch: 75%; text-transform: uppercase; letter-spacing: .03em; }
  .f-role.regle { border-style: dashed; }
  .f-note { font-size: 13px; color: var(--gris); }
  .f-bande-c .c { width: 22px; height: 16px; background: #e6dfcf; }
  .f-seule { font-size: 13px; color: var(--gris); }
  .c.m { background: var(--c); }
  .c.ci { background: var(--f); box-shadow: inset 0 0 0 2px var(--c); }
  .f-lab { font-size: 13px; }
  .f-lab .c { width: 16px; height: 12px; }
  .f-lab-n { font: 700 15px/1.1 var(--cond); font-stretch: 75%; text-transform: uppercase; color: var(--t); }
  .f-cpt { font: 800 14px/1 var(--cond); font-stretch: 75%; font-variant-numeric: tabular-nums; }
  .f-lab-mots { color: var(--gris); }
  .f-lab-sans, .f-lab-nd { font-size: 13px; color: var(--gris); }
  .f-roue .lb { font: 700 13px var(--cond); font-stretch: 75%; text-transform: uppercase; fill: var(--encre); }
  .f-roue .lb.nd { fill: #6b6355; font-weight: 400; }
  .f-roue .nm { font-weight: 800; }
  .f-dem { font-size: 13px; }
  .f-dem b { font: 800 14px/1 var(--cond); font-stretch: 75%; text-transform: uppercase; }
  .f-g { border-radius: 50%; background: #fff; box-shadow: inset 0 0 0 2px var(--encre); color: var(--encre); }
  .f-g[aria-pressed="true"] { background: var(--encre); color: #fff; }
  .f-act { border-radius: 16px; border: 2px solid var(--encre); background: #fff; font: 700 15px/1 var(--cond); font-stretch: 75%; text-transform: uppercase; letter-spacing: .04em; }
  .f-ajouter { background: var(--paille); box-shadow: 3px 3px 0 var(--encre); }
  .f-ajouter[aria-pressed="true"] { background: var(--encre); color: var(--paille); }
  .f-repli { border-radius: 2px; border: 2px solid var(--encre); background: #fff; font: 700 13px/1 var(--cond); font-stretch: 75%; text-transform: uppercase; letter-spacing: .04em; }
  .f-repli[aria-expanded="true"] { background: var(--encre); color: var(--papier); }
  .f-sec { font-size: 13px; }
  .f-rg { border-bottom: 1px dashed var(--trait); padding: 2px 0; }
  .f-rg-n { color: var(--gris); }
  .f-txt { color: var(--encre); }
  .tag-f { border: 1.5px solid var(--encre); border-radius: 2px; background: #fff; }
`;

// l4 · Instrument : une face d'appareil gris clair, filets fins, chiffres tabulaires en mono,
// cadrans et graduations. L'encre pour la structure ; la couleur seulement pour les données.
export const CSS_L4 = `
  :root { --encre: #141416; --face: #f1f1ee; --blanc: #ffffff; --gris: #55555b; --filet: #c4c4be; --grad: #8b8b90; --acc: #c2410c; --gut: 22px;
    --mono: "IBM Plex Mono", Consolas, "Cascadia Mono", ui-monospace, monospace; }
  html, body { background: var(--face); color: var(--encre); }
  body { font: 400 13px/1.3 "Segoe UI", system-ui, -apple-system, sans-serif; -webkit-tap-highlight-color: transparent; }
  .ecran { gap: 10px; }
  .barre { height: 34px; }
  .seg { background: var(--blanc); border: 1px solid var(--filet); border-radius: 2px; }
  .seg button { height: 30px; color: var(--gris); font: 400 13px/1 "Segoe UI", system-ui, sans-serif; }
  .seg button + button { border-left: 1px solid var(--filet); }
  .seg button[aria-checked="true"] { color: var(--encre); font-weight: 650; box-shadow: inset 0 -2px 0 var(--encre); }
  .outils { margin-top: 6px; }
  .outils .seg button { height: 26px; padding: 0 10px; font-size: 12px; text-transform: uppercase; letter-spacing: .06em; }

  .reps { gap: 6px; }
  .tuile { background: var(--blanc); border: 1px solid var(--filet); border-radius: 2px; padding: 6px 6px 7px; gap: 3px; align-items: stretch; }
  .tuile .nom { font: 600 12px/1.1 "Segoe UI", system-ui, sans-serif; text-transform: uppercase; letter-spacing: .04em; color: var(--encre); gap: 3px; align-items: flex-start; min-height: 27px; }
  .tuile .nom .pi { width: 15px; height: 15px; }
  .alerte { width: 8px; height: 8px; right: -2px; bottom: -1px; box-shadow: 0 0 0 1.5px #fff; }
  .cadran { display: block; margin: 2px auto 0; }
  .cad { position: relative; }
  .lec { position: absolute; right: 0; bottom: -1px; font: 600 12px/1 var(--mono); font-variant-numeric: tabular-nums; color: var(--encre); }
  .rep { font: 700 14px/1.05 "Segoe UI", system-ui, sans-serif; text-transform: uppercase; letter-spacing: .04em; text-align: center; }
  .rep small { font: 400 12px/1.2 "Segoe UI", system-ui, sans-serif; text-transform: none; letter-spacing: 0; color: var(--gris); margin-top: 1px; }
  .hh-b { align-self: center; margin-top: 3px; height: 24px; padding: 0 3px 0 7px; border: 1px solid var(--encre); border-radius: 2px; background: var(--blanc); font: 600 12px/1 "Segoe UI", system-ui, sans-serif; }

  .gut::before { content: ''; position: absolute; top: 0; bottom: 0; left: 10px; width: 2px; background: var(--encre); }
  .vl { border-left: 1px dashed var(--encre); }
  .grad { border-left: 1px dotted #a9a9a3; }
  .flou { background: linear-gradient(270deg, rgba(47,107,95,.22), rgba(47,107,95,.03)); }
  .axe { height: 1px; background: var(--encre); }
  .g-ax::before { top: -3.5px; left: -5px; border-width: 4px 6px 4px 0; border-color: transparent var(--encre) transparent transparent; border-style: solid; }
  .d-ax::after { top: -3.5px; right: -5px; border-width: 4px 0 4px 6px; border-color: transparent transparent transparent var(--encre); border-style: solid; }
  .tetes .m::before { content: ''; position: absolute; top: 0; height: 8px; }
  .tetes .m.fl::before { left: 0; right: 2px; background: repeating-linear-gradient(90deg, var(--grad) 0 1px, transparent 1px calc(100% / 3)); }
  .tetes .m.re::before { right: 0; left: 2px; background: linear-gradient(90deg, var(--grad) 0 1px, transparent 1px); }
  body.abs .tetes .m.fl::before { background: repeating-linear-gradient(90deg, var(--grad) 0 1px, transparent 1px 20%); }
  body.abs .tetes .m.re::before { background: repeating-linear-gradient(270deg, var(--grad) 0 1px, transparent 1px 60%); }
  .puce { top: 12px; font: 600 12px/1 "Segoe UI", system-ui, sans-serif; text-transform: uppercase; letter-spacing: .05em; padding: 2px 5px; border-radius: 2px; background: var(--encre); color: #fff; }
  .fl .puce.pv { padding: 1px 3px; background: var(--blanc); box-shadow: inset 0 0 0 1px var(--encre); }

  .groupe { gap: 6px; font: 600 12px/1.2 "Segoe UI", system-ui, sans-serif; text-transform: uppercase; letter-spacing: .05em; color: var(--encre); }
  .groupe > span.t { background: var(--face); padding: 2px 6px 2px 2px; }
  .dose { font: 600 12.5px/1 var(--mono); border: 1px solid var(--filet); background: var(--blanc); padding: 3px 5px; border-radius: 2px; text-transform: none; letter-spacing: 0; }
  .est { border: 1px dashed var(--grad); color: var(--gris); background: var(--face); padding: 2px 5px; border-radius: 2px; text-transform: none; letter-spacing: 0; font-weight: 400; }
  .mo { height: 22px; padding: 0 6px; border: 1px solid var(--encre); border-radius: 2px; background: var(--blanc); font: 600 12px/1 var(--mono); text-transform: none; letter-spacing: 0; }
  .bars { height: 28px; }
  .ln { height: 8px; } .ln.a { top: 0; } .ln.b { top: 15px; }
  .zt { bottom: -4px; height: 1px; background: var(--c); }
  .zt::after { top: -3px; width: 1px; height: 7px; background: var(--encre); }
  .bar { height: 8px; background: var(--c); }
  .bar.ci { background: var(--f); box-shadow: inset 0 0 0 1px var(--c); }
  .bar.sf { background: var(--blanc); box-shadow: inset 0 0 0 1px var(--c); }
  .bar.inconnu { width: 22px; background: repeating-linear-gradient(135deg, #fff 0 2.5px, #a3a3a8 2.5px 4px); box-shadow: inset 0 0 0 1px var(--grad); }
  .hs { height: 8px; }
  .lab-i { top: -4px; font: 600 12px/16px var(--mono); padding: 0 3px; background: var(--face); color: var(--encre); }

  .tab { margin: 2px 0 12px; background: var(--blanc); border: 1px solid var(--filet); border-left: 3px solid var(--encre); border-radius: 2px; padding: 0 8px; }
  .vr { padding: 5px 0 6px; }
  .vr + .vr { border-top: 1px solid #e4e4e0; }
  .vr.coupe-l { border-top: 1px solid var(--grad); }
  .nm { font: 650 14px/1.15 "Segoe UI", system-ui, sans-serif; }
  .et { color: var(--gris); padding: 0 3px; font-weight: 400; }
  .q { font: 500 12.5px/1 var(--mono); color: var(--gris); white-space: nowrap; }
  .stk { color: var(--gris); }
  .us { color: var(--encre); gap: 0; }
  .us:not(.deduit) { background: #e6e6e2; border-radius: 10px; height: 20px; padding: 0 4px; }
  .us.deduit { color: var(--gris); }
  .us.deduit::after { content: 'α'; font: 600 12px/1 var(--mono); margin-left: 1px; }
  .us .inc { font-size: 12px; }
  .ajc { width: 30px; height: 30px; border-radius: 2px; background: var(--blanc); color: var(--encre); box-shadow: inset 0 0 0 1px var(--encre); }
  .ajc[aria-pressed="true"] { background: var(--encre); color: #fff; }
  .cases { gap: 7px; margin-top: 3px; }
  .objs { padding-right: 7px; border-right: 1px solid var(--filet); }
  .cf { width: 22px; gap: 3px; }
  .cf .pi { width: 20px; height: 20px; padding: 3px; border-radius: 2px; }
  .cf.mq .pi, .cf.sf .pi { background: var(--f); }
  .cf.o .pi { box-shadow: 0 0 0 1px var(--encre); }
  .cf.ne .pi { opacity: .35; }
  .cf.vide::after { content: ''; width: 3px; height: 3px; border-radius: 50%; background: #b5b5af; margin-top: 8px; }
  .cf.moins::before { content: ''; position: absolute; left: -2px; top: -2px; width: 7px; height: 2px; background: var(--encre); box-shadow: 0 0 0 1px #fff; z-index: 1; }
  .jg { gap: 1px; height: 6px; }
  .jg i { width: 4px; height: 6px; box-shadow: inset 0 0 0 1px #cdcdc8; }
  .jg i.on { background: var(--c); box-shadow: none; }
  .jg.bas i.on { background: var(--blanc); box-shadow: inset 0 0 0 1.5px var(--t); }
  .jg.xs i.on { background: var(--acc); }
  .jg.ne i { width: 19px; background: repeating-linear-gradient(135deg, #fff 0 2px, #a3a3a8 2px 3.5px); box-shadow: inset 0 0 0 1px var(--grad); }

  details.bio summary { height: 24px; padding: 0 4px; border-radius: 2px; background: repeating-linear-gradient(135deg, #fff 0 3px, #e1e1dc 3px 5px); box-shadow: inset 0 0 0 1px var(--grad); }
  .bt { background: var(--blanc); border-radius: 2px; padding: 0 3px; height: 18px; }
  .bt.mot span { font: 500 12px/1 var(--mono); }
  details.bio[open] ul { background: var(--blanc); border: 1px solid var(--filet); border-radius: 2px; box-shadow: 0 6px 18px rgba(0,0,0,.14); font-size: 13px; }
  .src { color: var(--gris); font-size: 12px; }
  details.pli { background: var(--blanc); border: 1px solid var(--filet); border-radius: 2px; padding: 9px 12px; }
  details.pli summary { font: 600 13px/1.25 "Segoe UI", system-ui, sans-serif; }
  details.pli ul { font-size: 13px; }
  .tab.seul { background: none; border: 0; padding: 0; margin: 0 0 4px; border-top: 1px solid var(--filet); border-radius: 0; z-index: auto; }
  .tab.seul .vr { padding: 5px 4px 2px; }
  .tab.seul .nm, .tab.seul .gr, .tab.seul .us.deduit { background: var(--face); padding: 1px 3px; }
  .tab.seul .cases { background: var(--face); padding: 2px 4px 0; width: max-content; position: relative; z-index: 2; }
  .tab.seul .ajc { z-index: 2; }
  .tab.seul .rangee.in { padding: 4px 0 8px; }
  .cmp { height: 46px; border-radius: 2px; background: var(--encre); color: #fff; font: 600 15px/1 "Segoe UI", system-ui, sans-serif; text-transform: uppercase; letter-spacing: .08em; gap: 6px; }
  .cmp .nb { font: 600 15px/1 var(--mono); letter-spacing: 0; }

  .hn[data-houblon] { text-decoration: underline dotted 1px; text-underline-offset: 3px; background: linear-gradient(#dcdcd6, #dcdcd6) no-repeat 0 0 / 0% 100%; }
  [data-houblon].appui { background-size: 100% 100%; transition: background-size .5s linear; }
  .vr.f-source { outline: 2px solid var(--encre); outline-offset: 1px; }

  /* La fiche : une fiche technique, réglette d'α graduée, roue à anneaux fins. */
  .f-fiche { background: var(--blanc); color: var(--encre); border: 1px solid var(--grad); }
  .f-feuille { border-radius: 8px 8px 0 0; border-bottom: 0; box-shadow: 0 -8px 24px rgba(0,0,0,.18); }
  .f-bulle { border-radius: 2px; box-shadow: 0 10px 30px rgba(0,0,0,.18); }
  .f-poignee { background: var(--filet); border-radius: 2px; }
  .f-tete { border-bottom: 1px solid var(--filet); padding-bottom: 6px; }
  .f-nom { font: 650 20px/1.1 "Segoe UI", system-ui, sans-serif; }
  .f-tete .stk { color: var(--gris); }
  .f-fermer { border: 1px solid var(--filet); border-radius: 2px; }
  .f-grec { font: 400 16px/1 var(--mono); color: var(--gris); }
  .f-aa { font: 600 22px/1 var(--mono); font-variant-numeric: tabular-nums; }
  .f-lot { font: 500 12.5px/1 var(--mono); color: var(--gris); }
  .f-role { margin-left: auto; border: 1px solid var(--encre); border-radius: 2px; padding: 3px 6px; font-size: 12.5px; }
  .f-role.regle { border-style: dashed; }
  .f-note { font-size: 12.5px; color: var(--gris); }
  .f-bande-c { gap: 1px; padding: 1px; box-shadow: inset 0 0 0 1px var(--filet); }
  .f-bande-c .c { width: 20px; height: 12px; background: #ededea; }
  .f-seule { font-size: 12.5px; color: var(--gris); }
  .c.m { background: var(--c); }
  .c.ci { background: var(--f); box-shadow: inset 0 0 0 1px var(--c); }
  .f-lab { font-size: 12.5px; }
  .f-lab .c { width: 14px; height: 10px; }
  .f-lab-n { font-weight: 650; }
  .f-cpt { font: 600 12.5px/1 var(--mono); }
  .f-lab-mots { color: var(--gris); }
  .f-lab-sans, .f-lab-nd { font-size: 12.5px; color: var(--gris); }
  .f-roue .lb { font: 400 12px "Segoe UI", system-ui, sans-serif; fill: var(--encre); }
  .f-roue .lb.nd { fill: #6c6c72; }
  .f-roue .nm { font-family: var(--mono); font-weight: 600; }
  .f-dem { font-size: 12.5px; }
  .f-dem b { font-weight: 650; }
  .f-g { border-radius: 2px; box-shadow: inset 0 0 0 1px var(--filet); color: var(--encre); }
  .f-g[aria-pressed="true"] { background: var(--encre); color: #fff; }
  .f-act { border-radius: 2px; border: 1px solid var(--encre); background: var(--blanc); font: 600 13px/1 "Segoe UI", system-ui, sans-serif; }
  .f-ajouter { background: var(--encre); color: #fff; }
  .f-ajouter[aria-pressed="true"] { background: var(--blanc); color: var(--encre); }
  .f-repli { border-radius: 2px; border: 1px solid var(--filet); background: var(--blanc); font: 600 12px/1 "Segoe UI", system-ui, sans-serif; text-transform: uppercase; letter-spacing: .05em; color: var(--encre); }
  .f-repli[aria-expanded="true"] { box-shadow: inset 0 -2px 0 var(--encre); }
  .f-sec { font-size: 12.5px; }
  .f-rg { border-bottom: 1px solid #ececea; padding: 2px 0; }
  .f-rg-n { color: var(--gris); }
  .f-rg-v { font-family: var(--mono); }
  .tag-f { border: 1px solid var(--filet); border-radius: 2px; }
`;
