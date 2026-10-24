// Lot 18 · la disposition de l8 (« la manière dont sont disposés les choses j'aime beaucoup !! »), commune à
// l8b, l8c et l8d, qui n'en changent que l'habillage. Les verdicts en tête ; le moment de chaque groupe en
// grand titre ; les voies en matrice, une colonne par famille, la jauge debout au ton de la famille ; le picto
// une fois, en tête de colonne fixe ; toucher une tête de colonne trie les voies par cette famille.
// Corrigé depuis l8 : le nom de la voie a sa ligne, sur toute la largeur (deux houblons ne passent plus sur
// deux lignes) ; colonnes de 21 px, traits de jauge de 15 × 6 px (12 × 4 dans l8) ; « Approche » a son signe
// (une flèche qui va vers la ligne), comme « Atteint » (cercle coché) et « Aucune » (cercle barré).
import {
  V, OBJ, ORDRE, NOM, REP, repLabel, HH_JS, MEMES, GESTES, AJOUTEES, CSS_FAMILLES, CSS_FICHE,
  ic, picto, MOMENT, usages, nomEl, stockMarque, ajc, bioPill, caseFam, couloirs, fonds, details,
  viseeS, viseeA, p, nomVoie, runtime, page, planche, ecrire,
} from './noyau.mjs';

export const EXTRAS = ORDRE.filter((f) => !OBJ.includes(f) && V.some((X) => X.extras.some((t) => t.famille === f)));

/* La structure : grilles, pistes, barres, jauges. Les couleurs et les surfaces viennent de l'habillage, par
   ces variables : --page, --encre, --gris, --trait, --trait2, --rail, --vise, --tab, --ligne, --tete,
   --seg, --seg-on, --seg-tx, --acc, --rad (rayon des cartes), --sans, --titre, --chiffre. */
export const CSS_STRUCTURE = `
  ${CSS_FAMILLES}
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background-color: var(--page); color: var(--encre); }
  body { font: 400 14px/1.2 var(--sans); -webkit-tap-highlight-color: transparent; font-variant-numeric: tabular-nums; }
  button, a { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; text-decoration: none; }
  svg { display: block; flex: none; }
  .ecran { max-width: 390px; margin: 0 auto; padding: 6px 12px 84px; display: flex; flex-direction: column; gap: 8px; overflow-x: hidden; --col: 21px; }
  .barre { display: flex; align-items: center; gap: 6px; height: 34px; }
  .retour { width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; flex: none; }
  .seg { display: flex; }
  .barre .seg { flex: 1; } .barre .seg button { flex: 1; }
  .seg button { height: 28px; padding: 0 10px; font-size: 12px; white-space: nowrap; display: inline-flex; align-items: center; justify-content: center; gap: 4px; }
  .outils { display: flex; justify-content: space-between; gap: 8px; }

  /* Les verdicts en tête : une ligne par objectif. */
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

  /* Le titre d'un groupe : son moment en grand. */
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

  /* La matrice : la tête de colonnes, puis une voie sur deux lignes : son nom en entier, puis ses cases. */
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
  .vr .l1 { grid-column: 1 / -2; grid-row: 1; display: flex; align-items: center; gap: 6px; min-width: 0; min-height: 22px; }
  .vr .id { grid-column: 1; grid-row: 2; display: flex; align-items: center; gap: 4px; min-width: 0; align-self: center; }
  .vr > .cf, .vr > .sep { grid-row: 2; }
  .vr > .ajc { grid-column: -2; grid-row: 1 / span 2; align-self: center; }
  .nm { font-size: 14px; font-weight: 600; line-height: 1.2; white-space: nowrap; }
  .hn { -webkit-touch-callout: none; -webkit-user-select: none; user-select: none; }
  .q { font: 500 12px var(--mono); color: var(--gris); white-space: nowrap; }
  .stk { display: inline-flex; color: var(--gris); }
  .us { display: inline-flex; align-items: center; height: 20px; padding: 0 4px; }
  .us.deduit { padding: 0 1px; }
  .us .inc { font-size: 12px; }
  .ajc { width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; }
  .ajc .i-check { display: none; }
  .ajc[aria-pressed="true"] .i-check { display: block; } .ajc[aria-pressed="true"] .i-plus { display: none; }
  /* Une case : la jauge debout, un trait par cran du style, de 15 × 6 px. */
  .cf { width: var(--col); min-height: 14px; display: inline-flex; flex-direction: column; align-items: center; justify-content: flex-end; position: relative; }
  .jg { display: flex; flex-direction: column-reverse; gap: 2px; align-items: center; }
  .jg i { width: 15px; height: 6px; border-radius: 2px; background: var(--b); }
  .jg i.pt { width: 6px; height: 6px; border-radius: 50%; }
  .jg.ne i { width: 15px; height: 14px; border-radius: 2px; }
  .cf.vide::after { content: ''; width: 3px; height: 3px; border-radius: 50%; background: var(--trait2); margin-bottom: 2px; }
  .cf.moins::before { content: ''; position: absolute; bottom: 9px; left: 3px; width: 15px; height: 2px; border-radius: 2px; background: var(--encre); }
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
  ${CSS_FICHE}
  .f-fiche { font-family: var(--sans); }
  .f-nom { font-size: 16px; font-weight: 700; } .f-aa { font: 600 16px var(--mono); } .f-grec { font-size: 14px; } .f-lot, .f-cpt, .f-lab-mots, .f-lab-sans, .f-lab-nd, .f-seule, .f-dem, .f-repli, .f-sec, .f-tag { font-size: 12px; }
  .f-lot, .f-cpt, .f-rg-v { font-family: var(--mono); } .f-role { font-size: 12px; } .f-act { font-size: 14px; } .r-lab { font-size: 12px; font-family: var(--sans); }
`;

// ---------- le balisage ----------
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
  const w = 112, x = Math.round(visee * w), b = Math.round(Math.min(1, frac) * w);
  return `<svg class="cible" width="${w}" height="22" viewBox="0 0 ${w} 22" aria-hidden="true" data-famille="${f}"><rect class="tr" x="1" y="7" width="${w - 2}" height="8" rx="4"/><rect class="pl" x="1" y="7" width="${b}" height="8" rx="4"/><line class="vi" x1="${x}" y1="0" x2="${x}" y2="22" stroke-width="2.5" stroke-dasharray="4 2.5"/></svg>`;
}
const SIGNE = { atteint: 'atteint', approche: 'approche', aucune: 'aucune' };
const ligneOb = (f, sens, label, droite, extra = '') => `
    <section class="ob" data-role="objectif" data-famille="${f}" aria-label="${repLabel[f]}">
      <span class="nom"><span class="sens">${ic(sens > 0 ? 'haut' : 'bas', 14)}</span><span class="pa">${picto(f, 16)}${extra}</span>${label}</span>
      <div class="rep v-${REP[f].verdict}" data-role="reponse" data-famille="${f}" data-verdict="${REP[f].verdict}"><span class="signe">${ic(SIGNE[REP[f].verdict], 20)}</span>${REP.MOT[REP[f].verdict]}${f === 'resin' ? '<small>voie houblon</small>' : ''}</div>
      ${droite}
    </section>`;
export const reponses = () => `
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
const th = (f, o) => `<button class="th${o ? ' o' : ''}" data-tri="${f}" data-famille="${f}" aria-pressed="false" aria-label="Trier par ${NOM[f].toLowerCase()}">${picto(f, 18)}</button>`;
const teteMatrice = () => `
    <div class="grille tete-m" role="group" aria-label="Trier les voies par famille">
      <span></span>${OBJ.map((f) => th(f, true)).join('')}<i class="sep"></i>${EXTRAS.map((f) => th(f, false)).join('')}<span></span>
    </div>`;
const ligne = (X, cls = '', i = 0) => {
  const { q } = nomVoie(X.v), hop = !X.v.levureVers;
  const dose = X.v.type === 'assemblage' ? '<span class="q">5+5 g ≈</span>' : q ? `<span class="q">${q}</span>` : '';
  const o = { sansPicto: true };
  return `<div class="vr grille${cls}" data-voie="${X.n}" data-ordre="${i}"${hop ? ' data-role="ligne-houblon"' : ''}>
        <div class="l1">${nomEl(X)}${usages(X.v, 14)}${bioPill(X, 13)}</div>
        <div class="id">${dose}${stockMarque(X.v, 14)}</div>
        ${OBJ.map((f) => caseFam(X, f, true, o)).join('')}<i class="sep"></i>${EXTRAS.map((f) => caseFam(X, f, false, o)).join('')}
        ${ajc(X)}
      </div>`;
};
const moTitre = (id) => { const [t, k, lg] = MOMENT[id]; const mot = !/′$/.test(t); return `<span class="mo${mot ? ' mot' : ''}" data-role="moment" data-moment="${id}" aria-label="Moment : ${lg}">${mot ? ic(k, 16) : ''}${t}</span>`; };
const blocMeme = (g) => `
    <div class="groupe">${moTitre(g.moment)}<span class="gt"><span class="t">${ic('egal', 14)}${g.gi ? 'même effet' : 'même effet sur tes objectifs'}</span><span class="dose">${g.dose}</span></span></div>
    <div class="rangee">${couloirs(g.voies[0], true)}</div>
    <div class="tab meme">${g.voies.map((X, i) => ligne(X, g.coupe(i) ? ' coupe-l' : '', i)).join('')}</div>`;
const blocGeste = (g) => `
    <div class="groupe">${moTitre(g.mo)}<span class="gt"><span class="t">${g.ic ? ic(g.ic, 14) : ''}${g.t}</span>${g.est ? '<span class="est">estimé</span>' : ''}</span></div>
    ${g.voies.map((X) => `<div class="tab seul">${ligne(X)}<div class="rangee in">${couloirs(X, false)}</div></div>`).join('')}`;
export const CORPS = `${tete()}${reponses()}
  <div class="graph">${fonds()}${tetes()}${teteMatrice()}
    ${MEMES.map(blocMeme).join('')}
    ${GESTES.map(blocGeste).join('')}
  </div>
  ${details()}
  <a class="cmp" data-role="comparer" href="../../fils15-s5-complexe/q2b/comparer.html">Comparer <b class="nb">(${AJOUTEES.length})</b></a>`;
// Trier : la colonne touchée range les voies de chaque groupe, de la plus forte à la plus faible ; retoucher rend l'ordre de q2b.
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
  if (on) document.querySelectorAll('.cf[data-famille="' + f + '"][data-crans]').forEach((c) => c.classList.add('tri'));
}));`;

// L'abécédaire : les mêmes pièces, chacune dans l'habillage de la variante.
export const abc = (mots) => {
  const X1 = V[0], fig = (c, m) => `<figure><div class="ech">${c}</div><figcaption>${m}</figcaption></figure>`;
  return [
    fig('<span class="sw s1"></span><span class="sw s2"></span><span class="sw s3"></span>', mots[0]),
    fig('<span class="aa">Aa</span><span class="aa n">Aa</span>', 'texte'),
    fig(`<button class="ajc" aria-pressed="false" aria-label="Ajouter">${ic('plus', 16, 'ic i-plus')}${ic('check', 16, 'ic i-check')}</button><button class="ajc" aria-pressed="true" aria-label="Ajouté">${ic('plus', 16, 'ic i-plus')}${ic('check', 16, 'ic i-check')}</button>`, 'ajouter'),
    fig(`${th('floral', true)}${caseFam(X1, 'citrus', true, { sansPicto: true })}${caseFam(X1, 'tropical', false, { sansPicto: true })}${caseFam(V[14], 'citrus', true, { sansPicto: true })}`, 'colonne'),
    fig(`<div class="mbar">${couloirs(X1, false)}</div>`, 'piste'),
    fig('<span class="mini-cmp">Comparer</span>', 'action'),
    fig(`<span class="rep v-atteint"><span class="signe">${ic('atteint', 20)}</span></span><span class="rep v-approche"><span class="signe">${ic('approche', 20)}</span></span><span class="rep v-aucune"><span class="signe">${ic('aucune', 20)}</span></span>`, 'verdict'),
    fig('<span class="mo">10′</span>', 'moment'),
    fig('<span class="rep mini-r">Approche</span>', 'réponse'),
  ].join('');
};
export const CSS_PLANCHE = `
  .abc figcaption { font-size: 12px; font-weight: 600; color: var(--gris); }
  .sw { width: 26px; height: 34px; margin: 0 2px; }
  .aa { font: 700 16px/1 var(--sans); margin: 0 4px; } .aa.n { font: 600 16px/1 var(--mono); }
  .abc .ajc, .abc .rep { margin: 0 3px; } .abc .cf, .abc .th { margin: 0 3px; }
  .mbar { width: 110px; }
  .mini-cmp { height: 32px; padding: 0 14px; display: inline-flex; align-items: center; font-weight: 700; font-size: 14px; }`;

export const POLICES = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600&family=Source+Sans+3:wght@400;600;700&display=swap">';
export function construire({ ICI, nom, css, symb, commentaire, cssPlanche, mots }) {
  ecrire(ICI + '/etat-b.html', page({ titre: nom + ' · Suggestions', css: CSS_STRUCTURE + css, symb, corps: CORPS, js: runtime({ extra: TRI }), commentaire, entete: POLICES }));
  ecrire(ICI + '/planche.html', planche({ titre: nom + ' · planche', css: CSS_STRUCTURE + css + CSS_PLANCHE + cssPlanche, symb, abc: abc(mots), entete: POLICES }));
}
