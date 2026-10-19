// Lot 18 · l5b · Tuiles fines : l5 compacté (D84, « Un poil gros et épais, prend trop de place »).
// Même rangement que l5 (objectifs en bandes, un widget large par groupe au même effet, ses voies en
// petits widgets deux par rangée, les gestes seuls en widgets moyens), mais moins de rembourrage, des
// ombres légères, des barres et des jauges fines, et la typographie de DESIGN.md. Les objectifs ne
// sont plus répétés en pictos dans chaque widget : la barre s5 du groupe les montre au-dessus ; il en
// reste une trace fine (leurs crans, I1). Dans un widget seul, la barre s5 porte elle-même leurs crans.
// Usage : node generateur-l5b.mjs
import * as T from './tuiles-compactes.mjs';
const { K } = T;
const OUT = K.E1 + '/fils18-baseline/l5b';
const { ico, MOMENT } = K;

const petit = (X) => `<article class="tl" data-voie="${X.n}"${T.ligneHoublon(X)} aria-label="${K.esc(X.v.libelle)}">
      <div class="tl-h">${(X.v.fiches || []).map(T.usage).join('')}<div class="nmw"><b class="nm">${T.pastilleSel(X)}${T.nomHtml(X)}</b> <span class="tl-m">${T.dose(X)}${T.stockMarque(X.v)}${T.bioPill(X)}</span></div>${T.plus(X)}</div>
      ${T.intensite(X, { objectifs: 'traces' })}
    </article>`;
const moyen = (X) => `<article class="tl tl-l" data-voie="${X.n}"${T.ligneHoublon(X)} aria-label="${K.esc(X.v.libelle)}">
      <div class="tl-h">${(X.v.fiches || []).map(T.usage).join('')}<div class="nmw"><b class="nm">${T.pastilleSel(X)}${T.nomHtml(X)}</b> <span class="tl-m">${T.dose(X)}${T.stockMarque(X.v)}${T.bioPill(X)}</span></div>${T.plus(X)}</div>
      <div class="tl-c">${T.couloirs(X, { crans: true })}${T.intensite(X, { objectifs: 'aucun' })}</div>
    </article>`;

function corps() {
  const { memes, gestes } = K.groupes();
  const USI = { arome: ico('j-arome', 14), amer: ico('j-goutte', 14), '': '' };
  const meme = (g, gi) => `
  <section class="gw" aria-label="${gi ? 'Même effet' : 'Même effet sur tes objectifs'}, ${g.dose}, ${MOMENT[g.moment].lg}">
    <div class="t-h">${ico('i-equal', 14)}<span>${gi ? 'même effet' : 'même effet sur tes objectifs'}</span><span class="q">${g.dose}</span>${T.chip(g.moment)}</div>
    ${T.couloirs(g.voies[0], { lab: true })}
  </section>
  <div class="grille">${g.voies.map(petit).join('')}</div>`;
  const geste = (g) => `
  <h3 class="t-h st">${USI[g.usage]}<span>${g.t}</span>${T.chip(g.mo)}${g.est ? '<span class="est">estimé</span>' : ''}</h3>
  ${g.voies.map(moyen).join('')}`;
  return `${T.tete}${T.objectifs()}${memes.map(meme).join('')}${gestes.map(geste).join('')}${T.plis()}${T.dock()}`;
}

const CSS = `
  .gw { background: #fff; border-radius: 8px; box-shadow: var(--ombre); padding: 4px 10px 7px; display: flex; flex-direction: column; gap: 4px; }
  .st { padding: 3px 2px 0; }
  .grille { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; }
  .tl { background: #fff; border-radius: 8px; box-shadow: var(--ombre); padding: 4px 7px 5px 8px; display: flex; flex-direction: column; gap: 3px; position: relative; min-width: 0; transition: transform .16s cubic-bezier(.2,.8,.2,1); }
  .tl.appui { transform: scale(.97); }
  .tl.f-source { box-shadow: 0 0 0 1.5px var(--encre), var(--ombre); }
  .tl-h { display: flex; align-items: flex-start; gap: 4px; min-height: 24px; }
  .tl-h .us { margin-top: 3px; }
  .nmw { flex: 1; min-width: 0; padding-top: 3px; line-height: 1.2; }
  .nmw .tl-m { display: inline-flex; align-items: center; gap: 4px; vertical-align: -3px; margin-left: 2px; color: var(--gris); }
  .tl-c { display: flex; align-items: flex-end; gap: 10px; }
  .tl-c .cx { flex: 1; margin-bottom: 4px; }
`;
K.ecrire(OUT + '/etat-b.html', T.page('Tuiles fines · Suggestions', 'Lot 18 · l5b · Tuiles fines : l5 compacté (D84). Générée par generateur-l5b.mjs (tuiles-compactes.mjs, ../l5/donnees-l5-l6.mjs).', CSS, corps()));
K.ecrire(OUT + '/planche.html', T.planche('l5b · Tuiles fines', CSS, T.abecedaire()));
