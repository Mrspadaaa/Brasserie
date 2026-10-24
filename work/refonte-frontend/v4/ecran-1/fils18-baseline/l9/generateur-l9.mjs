// Lot 18 · l9 · Atlas : q2b (c1) en carte du goût. La carte croise les deux familles à monter : le floral
// en largeur, les agrumes en hauteur, à l'échelle du style (un trait de graticule par cran) ou en absolu.
// Ma bière est un point ; chaque groupe de voies est une route qui part d'elle et s'arrête où la voie mène ;
// les familles sont des régions (au ton fond, au-delà de la visée) ; le pays du style a sa frontière, et
// au-delà c'est l'orangé « hors du style ». Une voie dont le floral n'est pas établi passe par la bande
// hachurée de gauche (terra incognita). Le résineux, troisième objectif, est un altimètre à droite : ma
// bière est au sommet, aucune route ne descend. Sous la carte, le carnet de route : les mêmes lignes que q2b,
// le long de leur route. En moins : les barres s5 de chaque groupe (la carte les porte) et les jauges
// « cible » des réponses. En plus : toucher une route mène à son groupe.
// Usage : node generateur-l9.mjs  →  l9/etat-b.html, l9/planche.html
import {
  V, OB, OBJ, NOM, JET, REP, repLabel, HH_JS, MEMES, GESTES, AJOUTEES, ACC, CSS_FAMILLES, CSS_FICHE, DEG,
  symboles, ic, picto, pill, usages, nomEl, stockMarque, ajc, bioPill, casesVoie, details, slotsDe,
  nomVoie, runtime, page, planche, ecrire, fr,
} from './noyau.mjs';

const ICI = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/refonte-frontend/v4/ecran-1/fils18-baseline/l9';
const ENC = '#2b2620', ROUTE = '#5b4a36', PAP = '#fbf8f0';

// ---------- les routes : un groupe de q2b = une route ----------
const LETTRES = 'ABCDEF';
const routes = [
  ...MEMES.map((g) => ({ voies: g.voies, moment: g.moment })),
  ...GESTES.map((g) => ({ voies: g.voies, moment: g.mo })),
].map((r, i) => ({ ...r, id: LETTRES[i] }));
const mb = { f: OB.floral.maBiere.central, c: OB.citrus.maBiere.central };
const BF = [0, 55], BC = [0, 30]; // bandes du style (c1 : tout[].bande)
for (const X of V) for (const t of X.v.tout) { if (t.famille === 'floral') BF.splice(0, 2, ...t.bande); if (t.famille === 'citrus') BC.splice(0, 2, ...t.bande); }

// La géométrie : W × H, la bande inconnue à gauche, l'altimètre à droite.
const W = 366, H = 276, X0 = 28, X1 = 328, Y0 = 262, Y1 = 12, AX = 340, AW = 18;
function carte(mode) {
  const XM = 4 * OB.floral.cran, YM = mode === 'abs' ? XM : 4 * OB.citrus.cran;
  const x = (v) => X0 + Math.max(0, Math.min(1, v / XM)) * (X1 - X0), y = (v) => Y0 - Math.max(0, Math.min(1, v / YM)) * (Y0 - Y1);
  const r2 = (v) => Math.round(v * 10) / 10;
  let s = `<g class="${mode}-only">`;
  // Le graticule : un trait par cran du style (en absolu, les mêmes points).
  for (let k = 1; k <= 4; k++) s += `<line class="grat" x1="${r2(x(k * OB.floral.cran))}" y1="${Y1}" x2="${r2(x(k * OB.floral.cran))}" y2="${Y0}"/>`;
  for (let v = OB.citrus.cran; v <= YM + 0.01; v += OB.citrus.cran) s += `<line class="grat" x1="${X0}" y1="${r2(y(v))}" x2="${X1}" y2="${r2(y(v))}"/>`;
  // Les régions : au-delà de la visée, au ton fond de la famille.
  s += `<rect class="reg" data-famille="floral" x="${r2(x(OB.floral.visee))}" y="${Y1}" width="${r2(x(BF[1]) - x(OB.floral.visee))}" height="${Y0 - Y1}"/>`;
  s += `<rect class="reg" data-famille="citrus" x="${X0}" y="${r2(y(BC[1]))}" width="${r2(x(BF[1]) - X0)}" height="${r2(y(OB.citrus.visee) - y(BC[1]))}"/>`;
  // Hors du style : au-delà de la frontière, hachuré orangé.
  s += `<rect class="hors" x="${X0}" y="${Y1}" width="${X1 - X0}" height="${r2(y(BC[1]) - Y1)}"/><rect class="hors" x="${r2(x(BF[1]))}" y="${r2(y(BC[1]))}" width="${r2(X1 - x(BF[1]))}" height="${r2(Y0 - y(BC[1]))}"/>`;
  // Le pays du style : sa frontière.
  s += `<rect class="pays" data-role="zone" x="${X0}" y="${r2(y(BC[1]))}" width="${r2(x(BF[1]) - X0)}" height="${r2(Y0 - y(BC[1]))}"/>`;
  // La visée : le drapeau au coin des deux régions.
  const vx = r2(x(OB.floral.visee)), vy = r2(y(OB.citrus.visee));
  s += `<line class="visee" x1="${vx}" y1="${Y0}" x2="${vx}" y2="${vy}"/><line class="visee" x1="${X0}" y1="${vy}" x2="${vx}" y2="${vy}"/>`;
  s += `<g class="drapeau" transform="translate(${vx - 2},${vy - 19})"><path d="M2 18V1.5c2-1.2 4.5-1.2 7 0s5 1.2 7 0V10c-2 1.2-4.5 1.2-7 0s-5-1.2-7 0"/></g>`;
  // Les routes : de ma bière au bout de chaque voie ; la part hors du style en orangé.
  const px = x(mb.f), py = y(mb.c);
  const voieLane = {}; let lane = 0;
  for (const R of routes) {
    const ends = [];
    const vus = new Set();
    for (const X of R.voies) {
      const e = X.v.effet, k = JSON.stringify(e); if (vus.has(k)) continue; vus.add(k);
      const cE = e.citrus.etabli ? mb.c + e.citrus.central : mb.c, fE = e.floral.etabli ? mb.f + e.floral.central : null;
      ends.push({ X, f: fE, c: cE, hs: X.hs.has('citrus') });
    }
    let d = '', hs = '', fin = [];
    for (const z of ends) {
      if (z.f == null) {
        const lx = 5 + 5 * (voieLane[z.X.n] = lane++);
        d += `M${r2(px)},${r2(py)}H${lx}V${r2(y(z.c))}`;
        if (z.hs) hs += `M${lx},${r2(y(BC[1]))}V${r2(y(z.c))}`;
        fin.push([lx, y(z.c)]);
      } else {
        d += `M${r2(px)},${r2(py)}L${r2(x(z.f))},${r2(y(z.c))}`;
        if (z.hs) { const t = (BC[1] - mb.c) / (z.c - mb.c); hs += `M${r2(px + t * (x(z.f) - px))},${r2(y(BC[1]))}L${r2(x(z.f))},${r2(y(z.c))}`; }
        fin.push([x(z.f), y(z.c)]);
      }
    }
    const haut = fin.reduce((a, b) => (b[1] < a[1] ? b : a));
    const sx = R.id === 'D' ? haut[0] + 10 : haut[0], sy = R.id === 'D' ? haut[1] + 16 : haut[1] - 13;
    s += `<a class="rt" href="#route-${R.id}" data-route="${R.id}" aria-label="Route ${R.id} : ${R.voies.length} voie${R.voies.length > 1 ? 's' : ''}"><path class="rt-c" d="${d}"/><path class="rt-i" d="${d}"/>${hs ? `<path class="rt-h" d="${hs}"/>` : ''}${fin.map(([a, b]) => `<circle class="rt-f" cx="${r2(a)}" cy="${r2(b)}" r="3"/>`).join('')}<g transform="translate(${r2(sx - 8)},${r2(sy - 8)})"><rect class="ec" width="16" height="16" rx="2"/><text x="8" y="12.5" text-anchor="middle">${R.id}</text></g></a>`;
  }
  // Ma bière : le point noir.
  s += `<g class="mb" transform="translate(${r2(px)},${r2(py)})"><circle r="6.5"/><circle class="mb-c" r="2.4"/></g>`;
  return s + '</g>';
}
// L'altimètre du résineux (0 à 100 points) : la bande du style, ma bière dégustée tout en haut, aucune route.
function altimetre() {
  const y = (v) => Y0 - v / 100 * (Y0 - Y1), r2 = (v) => Math.round(v * 10) / 10;
  return `<g class="alt">
    <rect class="alt-p" data-role="piste" data-famille="resin" x="${AX}" y="${Y1}" width="${AW}" height="${Y0 - Y1}"/>
    <rect class="alt-z" data-role="zone" data-famille="resin" x="${AX}" y="${r2(y(OB.resin.bande[1]))}" width="${AW}" height="${r2(Y0 - y(OB.resin.bande[1]))}"/>
    <line class="visee" x1="${AX - 4}" y1="${r2(y(OB.resin.visee))}" x2="${AX + AW + 4}" y2="${r2(y(OB.resin.visee))}"/>
    <rect class="alt-mb" x="${AX + AW / 2 - 3}" y="${r2(y(DEG.max))}" width="6" height="${r2(y(DEG.min) - y(DEG.max))}" rx="3"/>
    <path class="alt-v" d="M${AX + AW / 2},${r2(y(DEG.min) + 6)}V${r2(y(OB.resin.visee) - 8)}"/><path class="alt-vp" d="M${AX + AW / 2 - 4},${r2(y(OB.resin.visee) - 10)}l4,6 4,-6"/>
    <use href="#p-resin" x="${AX + 1}" y="${Y0 - 18}" width="16" height="16" data-famille="resin"/>
  </g>`;
}
const svgCarte = () => `
  <figure class="carte" aria-label="Carte du goût : floral en largeur, agrumes en hauteur, ma bière en noir ; ${routes.length} routes ; résineux en altimètre à droite">
    <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Ma bière (floral ${fr(mb.f)}, agrumes ${fr(mb.c)}) et les routes des voies ; la visée : floral ${fr(OB.floral.visee)}, agrumes ${fr(OB.citrus.visee)}">
      <defs><pattern id="hach-o" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="${ACC}" stroke-width="1.4" stroke-opacity=".45"/></pattern>
        <pattern id="hach-i" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><line x1="0" y1="0" x2="0" y2="5" stroke="#b9ad95" stroke-width="1.2"/></pattern></defs>
      <rect class="inco" x="0" y="${Y1}" width="20" height="${Y0 - Y1}"/>
      ${carte('sty')}${carte('abs')}
      <rect class="axe-p" data-role="piste" data-famille="floral" x="${X0}" y="${Y0 + 3}" width="${X1 - X0}" height="4"/>
      <rect class="axe-p" data-role="piste" data-famille="citrus" x="${X0 - 6}" y="${Y1}" width="4" height="${Y0 - Y1}"/>
      <path class="axe-f" d="M${X1 + 1},${Y0 + 1}l6,4 -6,4Z"/><path class="axe-f" d="M${X0 - 8},${Y1 - 1}l4,-6 4,6Z"/>
      <use href="#p-floral" x="${X1 - 18}" y="${Y0 - 20}" width="16" height="16" data-famille="floral"/>
      <use href="#p-citrus" x="${X0 + 3}" y="${Y1 + 3}" width="16" height="16" data-famille="citrus"/>
      ${altimetre()}
    </svg>
  </figure>`;

const CSS = `
  :root { --encre: ${ENC}; --gris: #675b4b; --trait: #e3d9c4; --papier: ${PAP}; --route: ${ROUTE}; --acc: ${ACC}; --gut: 0px;
    --fi-bg: #fffdf7; --fi-tx: ${ENC}; --fi-tx2: #3d352c; --fi-gris: #675b4b; --fi-trait: #cfc3aa; --fi-voile: rgba(43,38,32,.4); --fi-rad: 8px;
    --r-anneau: #cfc3aa; --r-encre: ${ENC}; --r-plein: rgba(91,74,54,.16); }
  ${CSS_FAMILLES}
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: var(--papier); color: var(--encre); }
  body { font: 400 14px/1.25 "Segoe UI", system-ui, -apple-system, Roboto, sans-serif; -webkit-tap-highlight-color: transparent; }
  button, a { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; text-decoration: none; }
  svg { display: block; flex: none; }
  .ecran { max-width: 390px; margin: 0 auto; padding: 6px 12px 88px; display: flex; flex-direction: column; gap: 10px; overflow-x: hidden; }
  .serif { font-family: Georgia, "Times New Roman", serif; font-style: italic; }

  .barre { display: flex; align-items: center; gap: 6px; height: 36px; }
  .retour { width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; }
  .seg { display: flex; border-radius: 16px; padding: 2px; background: #efe8d8; }
  .barre .seg { flex: 1; } .barre .seg button { flex: 1; }
  .seg button { height: 28px; padding: 0 11px; border-radius: 14px; font-size: 13px; color: var(--gris); white-space: nowrap; display: inline-flex; align-items: center; justify-content: center; gap: 4px; }
  .seg button[aria-checked="true"] { background: #fffdf7; color: var(--encre); font-weight: 650; box-shadow: 0 1px 2px rgba(43,38,32,.18); }
  .lentille button[aria-checked="true"] { background: var(--encre); color: #fff; }
  .outils { display: flex; justify-content: space-between; gap: 8px; }

  /* Le cartouche : les trois réponses, comme la légende d'une carte. */
  .cartouche { display: grid; grid-template-columns: 1.2fr 1fr 1fr; border-radius: 8px; box-shadow: inset 0 0 0 1.5px var(--encre); overflow: hidden; }
  .ob { padding: 6px 8px 7px; display: flex; flex-direction: column; gap: 3px; min-height: 64px; }
  .ob + .ob { box-shadow: inset 1.5px 0 0 var(--encre); }
  .ob .nom { display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 650; color: var(--t); line-height: 1.1; }
  .ob .pa { position: relative; display: inline-flex; }
  .alerte { position: absolute; right: -3px; bottom: -2px; width: 8px; height: 8px; border-radius: 50%; background: var(--acc); box-shadow: 0 0 0 1.5px var(--papier); }
  .rep { font: italic 700 18px/1.05 Georgia, serif; }
  .rep small { font: 400 12px/1.2 "Segoe UI", system-ui, sans-serif; color: var(--gris); display: block; }
  .ob.resin .rep small { display: inline; margin-left: 4px; }
  .par { margin-top: auto; align-self: flex-start; display: inline-flex; align-items: center; gap: 4px; height: 24px; padding: 0 4px 0 6px; border-radius: 12px; box-shadow: inset 0 0 0 1px #8c7f69; color: var(--route); }
  .par .ec-h { width: 18px; height: 18px; }
  .hh-b { margin-top: auto; height: 24px; padding: 0 4px 0 8px; border-radius: 12px; font-size: 12px; font-weight: 650; display: inline-flex; align-items: center; gap: 2px; box-shadow: inset 0 0 0 1px var(--encre); align-self: flex-start; white-space: nowrap; }

  /* La carte. */
  .carte { position: relative; margin: 0 -2px; }
  .carte .inco { fill: url(#hach-i); }
  .grat { stroke: var(--trait); stroke-width: 1; }
  .reg { stroke: none; fill: var(--f); }
  .reg { fill-opacity: .7; } .reg[data-famille="floral"] { fill-opacity: .85; }
  .hors { fill: url(#hach-o); }
  .pays { fill: none; stroke: var(--encre); stroke-width: 1.5; stroke-dasharray: 7 3 1.5 3; }
  .visee { stroke: var(--encre); stroke-width: 1; stroke-dasharray: 3 3; }
  .drapeau path { fill: var(--encre); stroke: var(--encre); stroke-width: 1; stroke-linejoin: round; }
  .rt-c { fill: none; stroke: var(--route); stroke-width: 5.5; stroke-linecap: round; stroke-linejoin: round; }
  .rt-i { fill: none; stroke: #fffaf0; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
  .rt-h { fill: none; stroke: var(--acc); stroke-width: 5.5; stroke-linecap: round; }
  .rt-f { fill: #fffaf0; stroke: var(--route); stroke-width: 2; }
  .rt .ec { fill: var(--route); }
  .rt text { fill: #fff; font: 700 12px "Segoe UI", system-ui, sans-serif; }
  .rt:hover .rt-c, .rt:focus .rt-c, .rt.on .rt-c { stroke: var(--encre); stroke-width: 7; }
  .rt.on .ec { fill: var(--encre); }
  .mb circle { fill: var(--encre); stroke: #fff; stroke-width: 2; } .mb .mb-c { fill: #fff; stroke: none; }
  .axe-p[data-famille] { fill: var(--b); } .axe-f { fill: var(--encre); }
  .alt-p { fill: var(--f); stroke: var(--b); stroke-width: 1; } .alt-z { fill: var(--b); fill-opacity: .28; }
  .alt-mb { fill: var(--acc); } .alt-v, .alt-vp { fill: none; stroke: #9a8c76; stroke-width: 1.5; stroke-dasharray: 3 3; } .alt-vp { stroke-dasharray: none; }
  .abs-only { display: none; } body.abs .abs-only { display: inline; } body.abs .sty-only { display: none; }

  /* Le carnet de route : un groupe = une route ; chaque voie est une étape sur la route. */
  .grp { display: flex; align-items: center; gap: 6px; min-height: 30px; margin-top: 4px; scroll-margin-top: 12px; }
  .ec-h { width: 20px; height: 20px; border-radius: 2px; background: var(--route); color: #fff; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; flex: none; }
  .grp:target .ec-h, .grp.on .ec-h { background: var(--encre); box-shadow: 0 0 0 3px #e7dcc4; }
  .grp .t { font: italic 600 14px/1.1 Georgia, serif; display: inline-flex; align-items: center; gap: 4px; }
  .dose, .est { font-size: 13px; color: var(--gris); }
  .mo { display: inline-flex; align-items: center; gap: 3px; height: 22px; padding: 0 7px 0 5px; border-radius: 11px; box-shadow: inset 0 0 0 1px #8c7f69; font-size: 12px; font-weight: 650; white-space: nowrap; font-variant-numeric: tabular-nums; flex: none; }
  .tab { position: relative; margin-bottom: 4px; }
  .vr { position: relative; padding: 6px 0 6px 26px; }
  .vr::before { content: ''; position: absolute; left: 7px; top: 0; bottom: 0; width: 6px; background: var(--route); }
  .vr::after { content: ''; position: absolute; left: 4px; top: 13px; width: 12px; height: 12px; border-radius: 50%; background: #fffaf0; box-shadow: inset 0 0 0 2.5px var(--route); }
  .vr:last-child::before { bottom: 50%; }
  .vr.hs-v::before { background: linear-gradient(var(--route) 0 40%, var(--acc) 40%); }
  .vr + .vr { box-shadow: inset 0 1px 0 var(--trait); }
  .l1 { display: flex; align-items: center; gap: 6px; min-height: 28px; }
  .nm { font-size: 15px; font-weight: 650; line-height: 1.15; }
  .f-source { background: var(--papier); }
  .hn { -webkit-touch-callout: none; -webkit-user-select: none; user-select: none; }
  .q { font-size: 13px; color: var(--gris); white-space: nowrap; }
  .gr { display: inline-flex; align-items: center; gap: 4px; }
  .stk { display: inline-flex; color: var(--gris); }
  .us { display: inline-flex; align-items: center; color: var(--encre); height: 20px; padding: 0 4px; border-radius: 10px; background: #efe8d8; }
  .us.deduit { background: none; padding: 0 1px; color: var(--gris); }
  .us .inc { font-size: 12px; }
  .ajc { margin-left: auto; width: 30px; height: 30px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; box-shadow: inset 0 0 0 1.5px var(--encre); background: #fffdf7; flex: none; }
  .ajc .i-check { display: none; }
  .ajc[aria-pressed="true"] { background: var(--encre); color: #fff; }
  .ajc[aria-pressed="true"] .i-check { display: block; } .ajc[aria-pressed="true"] .i-plus { display: none; }
  .cases { display: flex; align-items: flex-start; gap: 7px; margin-top: 4px; }
  .objs, .exs { display: inline-flex; gap: 3px; }
  .objs { padding-right: 7px; box-shadow: 1px 0 0 var(--trait); }
  .cf { width: 22px; height: 30px; display: inline-flex; flex-direction: column; align-items: center; gap: 3px; position: relative; }
  .cf .pi { width: 20px; height: 20px; padding: 2px; border-radius: 50%; }
  .cf.mq .pi { background: var(--f); box-shadow: inset 0 0 0 1px var(--b); }
  .cf.ci .pi, .cf.sf .pi { background: none; }
  .cf.sf .pi, .cf.ne .pi { opacity: .45; }
  .cf.o .pi { box-shadow: 0 0 0 1.5px var(--encre); }
  .cf.o.mq .pi { box-shadow: 0 0 0 1.5px var(--encre), inset 0 0 0 1px var(--b); }
  .cf.vide::after { content: ''; width: 3px; height: 3px; border-radius: 50%; background: #c9bea8; margin-top: 9px; }
  .cf.moins::before { content: ''; position: absolute; left: -2px; top: -1px; width: 7px; height: 2px; border-radius: 2px; background: var(--encre); }
  .jg { display: inline-flex; gap: 2px; height: 4px; }
  .jg i { width: 4px; height: 4px; border-radius: 2px; background: var(--route); }
  .jg i.pt { width: 3px; height: 3px; }
  .jg.bas i { background: none; box-shadow: inset 0 0 0 1px var(--route); } .jg.bas i.pt { background: var(--route); }
  .jg.xs i { background: var(--acc); }
  .jg.ne i { width: 14px; border-radius: 2px; background: repeating-linear-gradient(135deg, transparent 0 2px, #9a8c76 2px 3.5px); box-shadow: inset 0 0 0 1px #9a8c76; }

  details.bio { display: inline-block; }
  details.bio summary { list-style: none; display: inline-flex; align-items: center; gap: 3px; height: 24px; padding: 0 5px; border-radius: 12px; background: repeating-linear-gradient(135deg, #fffdf7 0 3px, #e7dcc4 3px 5.5px); box-shadow: inset 0 0 0 1px #9a8c76; cursor: pointer; }
  details.bio summary::-webkit-details-marker { display: none; }
  .bt { display: inline-flex; align-items: center; gap: 1px; background: #fffdf7; border-radius: 8px; padding: 0 3px; height: 18px; }
  .bt .pi { width: 14px; height: 14px; }
  .bt.mot span { font-size: 12px; font-weight: 650; margin-left: 2px; }
  details.bio[open] ul { position: absolute; left: 0; right: 0; z-index: 6; background: #fffdf7; border-radius: 8px; box-shadow: inset 0 0 0 1px var(--encre), 0 8px 20px rgba(43,38,32,.25); padding: 10px 12px 10px 26px; font-size: 13px; display: flex; flex-direction: column; gap: 6px; }
  .src { color: var(--gris); font-size: 12px; }
  details.pli { border-radius: 8px; box-shadow: inset 0 0 0 1px #cfc3aa; padding: 10px 12px; }
  details.pli summary { font: italic 600 14px Georgia, serif; cursor: pointer; }
  details.pli ul { margin: 8px 0 0 16px; display: flex; flex-direction: column; gap: 6px; font-size: 13px; }
  .cmp { position: fixed; z-index: 8; left: 50%; transform: translateX(-50%); bottom: 14px; width: 358px; max-width: calc(100% - 32px); height: 46px; border-radius: 23px; background: var(--encre); color: #fff;
    display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 16px; font-weight: 700; box-shadow: 0 8px 22px rgba(43,38,32,.35); }

  ${CSS_FICHE}
  .f-fiche { box-shadow: 0 -8px 30px rgba(43,38,32,.28), inset 0 2px 0 var(--encre); }
  .f-bulle { box-shadow: inset 0 0 0 1.5px var(--encre), 0 14px 34px rgba(43,38,32,.3); }
  .f-nom { font: italic 700 24px/1.1 Georgia, serif; }
  .f-fermer { border-radius: 50%; box-shadow: inset 0 0 0 1px var(--encre); }
  .f-aa { font-weight: 700; }
  .f-role { border-radius: 12px; background: #efe8d8; }
  .f-role.regle { background: none; box-shadow: inset 0 0 0 1px #8c7f69; border-radius: 12px; }
  .c { border-radius: 2px; background: #f1ebde; }
  .c.m { background: var(--b); }
  .c.ci { background: var(--f); box-shadow: inset 0 0 0 1.5px var(--b); }
  .f-lab-n { color: var(--t); }
  .r-lab { font-family: Georgia, serif; font-style: italic; } .r-lab.dem { font-weight: 700; }
  .f-gout { border-radius: 16px; background: #efe8d8; }
  .f-g { border-radius: 50%; } .f-g[aria-pressed="true"] { background: var(--encre); color: #fff; }
  .f-act { border-radius: 16px; box-shadow: inset 0 0 0 1.5px var(--encre); }
  .f-ajouter { background: var(--encre); color: #fff; }
  .f-repli { border-radius: 14px; box-shadow: inset 0 0 0 1px #cfc3aa; }
  .f-tag { border-radius: 4px; background: #efe8d8; }
  @keyframes appui { from { background-size: 0 100%; } to { background-size: 100% 100%; } }
  .appui .hn { background: linear-gradient(#e7dcc4, #e7dcc4) no-repeat; animation: appui 500ms linear forwards; border-radius: 2px; }
`;

const tete = () => `
  <div class="barre">
    <a class="retour" href="#" aria-label="Retour">${ic('chev-l', 20)}</a>
    <div class="seg" role="radiogroup" aria-label="Partie">${['Ma bière', 'Suggestions', 'Comparer'].map((x) => `<button role="radio" aria-checked="${x === 'Suggestions'}">${x}</button>`).join('')}</div>
  </div>
  <div class="outils">
    <div class="seg lentille" role="radiogroup" aria-label="Lecture des familles"><button role="radio" data-e="style" aria-checked="true">Au style</button><button role="radio" data-e="absolu" aria-checked="false">Absolu</button></div>
    <div class="seg" role="radiogroup" aria-label="Vue"><button role="radio" aria-checked="true">${ic('route', 14)}Carte</button><button role="radio" aria-checked="false">${ic('radar', 14)}Radar</button></div>
  </div>`;
const ob = (f, label, extra = '', apres = '', pa = '') => `
    <section class="ob ${f}" data-role="objectif" data-famille="${f}" aria-label="${repLabel[f]}">
      <span class="nom"><span class="pa">${picto(f, 16)}${pa}</span>${label}</span>
      <div class="rep v-${REP[f].verdict}" data-role="reponse" data-famille="${f}" data-verdict="${REP[f].verdict}">${REP.MOT[REP[f].verdict]}${extra}</div>${apres}
    </section>`;
// La meilleure voie de chaque réponse (celle de q2b) se dit par sa route : un toucher y mène.
const routeDe = (X) => routes.find((R) => R.voies.includes(X));
const parRoute = (f) => { const R = routeDe(REP[f].voie); return `<a class="par" href="#route-${R.id}" data-route="${R.id}" aria-label="La meilleure voie, ${nomVoie(REP[f].voie.v).nom}, est sur la route ${R.id}">${ic('route', 14)}<span class="ec-h">${R.id}</span></a>`; };
const cartouche = () => `
  <div class="cartouche">
    ${ob('resin', 'Moins résineux', '<small>voie houblon</small>', `<button class="hh-b" onclick="${HH_JS}">Hors houblon${ic('chev-r', 12)}</button>`, '<i class="alerte"></i>')}
    ${ob('floral', 'Plus floral', '', parRoute('floral'))}
    ${ob('citrus', 'Plus agrumes', '', parRoute('citrus'))}
  </div>`;
const ligne = (X, slots) => {
  const { q } = nomVoie(X.v), hop = !X.v.levureVers;
  const dose = X.v.type === 'assemblage' ? '<span class="q">5+5 g ≈</span>' : q ? `<span class="q">${q}</span>` : '';
  return `<div class="vr${X.hs.size ? ' hs-v' : ''}" data-voie="${X.n}"${hop ? ' data-role="ligne-houblon"' : ''}>
        <div class="l1">${nomEl(X)}${usages(X.v, 14)}<span class="gr">${dose}${stockMarque(X.v, 14)}</span>${bioPill(X)}${ajc(X)}</div>
        ${casesVoie(X, slots)}
      </div>`;
};
const titreRoute = (R) => {
  const g = MEMES.find((m) => m.voies === R.voies), G = GESTES.find((m) => m.voies === R.voies);
  if (g) return `<span class="t">${ic('egal', 14)}${g.gi ? 'même effet' : 'même effet sur tes objectifs'}</span><span class="dose">${g.dose}</span>`;
  return `<span class="t">${G.ic ? ic(G.ic, 14) : ''}${G.t}</span>${G.est ? '<span class="est">estimé</span>' : ''}`;
};
const blocRoute = (R) => `
    <div class="grp" id="route-${R.id}"><span class="ec-h" aria-hidden="true">${R.id}</span>${pill(R.moment)}${titreRoute(R)}</div>
    <div class="tab" data-route="${R.id}">${R.voies.map((X) => ligne(X, slotsDe(R.voies))).join('')}</div>`;
const corps = `${tete()}${cartouche()}${svgCarte()}
  ${routes.map(blocRoute).join('')}
  ${details()}
  <a class="cmp" data-role="comparer" href="../../fils15-s5-complexe/q2b/comparer.html">Comparer <b class="nb">(${AJOUTEES.length})</b></a>`;
// Toucher une route : son groupe s'allume et vient sous les yeux ; toucher une étape allume sa route.
const ROUTES = `
const allumer = (id) => { document.querySelectorAll('.rt').forEach((r) => r.classList.toggle('on', r.dataset.route === id)); document.querySelectorAll('.grp').forEach((g) => g.classList.toggle('on', g.id === 'route-' + id)); };
document.querySelectorAll('.rt, .par').forEach((a) => a.addEventListener('click', () => allumer(a.dataset.route)));
document.querySelectorAll('.tab[data-route]').forEach((t) => t.addEventListener('click', (e) => { if (!e.target.closest('button, summary')) allumer(t.dataset.route); }));`;
const SYMB = symboles({ trait: 1.5 });
ecrire(ICI + '/etat-b.html', page({
  titre: 'Atlas · Suggestions', css: CSS, symb: SYMB, corps, js: runtime({ extra: ROUTES }),
  commentaire: 'Lot 18 · l9 · Atlas, sur q2b (c1). La carte : floral en largeur, agrumes en hauteur (un trait par cran du style ; en absolu, les mêmes points sur les deux axes) ; ma bière (floral ' + fr(mb.f) + ', agrumes ' + fr(mb.c) + ') en point noir ; chaque groupe de voies de q2b est une route (A à F) ; la part d\'une route au-delà de la frontière du style est orangée ; un floral non établi passe par la bande hachurée de gauche. Le résineux (dégusté ' + DEG.min + '–' + DEG.max + ', style 0–' + OB.resin.bande[1] + ') est l\'altimètre de droite. En moins : les barres s5 et les jauges des réponses ; en plus : la carte, et toucher une route allume son groupe. Appui long (500 ms) ou survol (750 ms) sur un houblon ou sa ligne : la fiche g1.',
}));

// ---------- la planche ----------
const fig = (c, mot) => `<figure><div class="ech">${c}</div><figcaption>${mot}</figcaption></figure>`;
const mini = (inner, w = 64, h = 40) => `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true">${inner}</svg>`;
const ABC = [
  fig('<span class="sw" style="background:#fbf8f0"></span><span class="sw" style="background:#fffdf7"></span><span class="sw" style="background:#efe8d8"></span>', 'papier'),
  fig('<span class="aa">Aa</span><span class="aa s">Aa</span>', 'texte'),
  fig(`<button class="ajc" aria-pressed="false" aria-label="Ajouter">${ic('plus', 16, 'ic i-plus')}${ic('check', 16, 'ic i-check')}</button><button class="ajc" aria-pressed="true" aria-label="Ajouté">${ic('plus', 16, 'ic i-plus')}${ic('check', 16, 'ic i-check')}</button>`, 'ajouter'),
  fig(`${mini(`<rect x="2" y="2" width="60" height="36" class="reg" data-famille="floral"/><use href="#p-floral" x="40" y="18" width="16" height="16" data-famille="floral"/>`)}`, 'région'),
  fig(`${mini(`<path class="rt-c" d="M8,32L54,10"/><path class="rt-i" d="M8,32L54,10"/><g class="mb" transform="translate(8,32)"><circle r="6.5"/><circle class="mb-c" r="2.4"/></g><g transform="translate(46,2)"><rect class="ec" width="16" height="16" rx="2" fill="${ROUTE}"/><text x="8" y="12.5" text-anchor="middle" fill="#fff" font-size="12" font-weight="700">A</text></g>`)}`, 'route'),
  fig(`${mini(`<rect x="2" y="12" width="60" height="26" fill="none" class="pays"/><rect x="2" y="2" width="60" height="10" fill="url(#hach-o2)"/>`)}`, 'frontière'),
  fig(`${mini(`<rect x="24" y="2" width="16" height="36" class="alt-p" data-famille="resin"/><rect x="24" y="26" width="16" height="12" class="alt-z" data-famille="resin"/><rect x="29" y="3" width="6" height="12" rx="3" class="alt-mb"/>`)}`, 'altitude'),
  fig('<span class="mo">' + ic('ebu', 14) + '<span>10′</span></span>', 'moment'),
  fig('<span class="mini-cmp">Comparer</span>', 'action'),
].join('');
const CSS_PL = CSS + `
  .mini { box-shadow: 0 0 0 1px #cfc3aa, 0 6px 16px rgba(43,38,32,.15); border-radius: 8px; }
  .abc figcaption { font: italic 13px Georgia, serif; color: var(--gris); }
  .sw { width: 24px; height: 32px; border-radius: 4px; box-shadow: inset 0 0 0 1px #cfc3aa; margin: 0 2px; }
  .aa { font: 600 26px/1 "Segoe UI", sans-serif; margin: 0 4px; } .aa.s { font: italic 700 26px/1 Georgia, serif; }
  .abc .ajc { margin: 0 4px; }
  .mini-cmp { height: 30px; padding: 0 14px; border-radius: 15px; background: var(--encre); color: #fff; display: inline-flex; align-items: center; font-weight: 700; font-size: 13px; }`;
const SYMB_PL = SYMB.replace('</svg>', `<defs><pattern id="hach-o2" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="${ACC}" stroke-width="1.4" stroke-opacity=".45"/></pattern></defs></svg>`);
ecrire(ICI + '/planche.html', planche({ titre: 'Atlas · planche', css: CSS_PL, symb: SYMB_PL, abc: ABC }));
