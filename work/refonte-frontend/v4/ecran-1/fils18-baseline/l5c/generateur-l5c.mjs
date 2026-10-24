// Lot 18 · l5c · Tuiles par groupe : les tuiles compactes de l5b, rangées autrement. Une tuile par
// groupe : un groupe au même effet est une seule tuile, sa barre s5 en tête, puis ses voies en lignes
// (et non en sous-tuiles) ; chaque geste (assembler, remplacer Nugget, dry hop, levure) est aussi une
// tuile, ses voies en lignes à deux étages (la ligne, puis sa barre s5 et ses extras). L'intensité tient
// dans la ligne : le picto, sa barre à côté. Typographie de DESIGN.md, sans grands titres.
// Briques : ../l5b/tuiles-compactes.mjs. Usage : node generateur-l5c.mjs
import * as T from '../l5b/tuiles-compactes.mjs';
const { K } = T;
const OUT = K.E1 + '/fils18-baseline/l5c';
const { ico, MOMENT } = K;
const O = { pic: 'cote', HC: 16 };

const tete = (X) => `${(X.v.fiches || []).map(T.usage).join('')}<div class="nmw"><b class="nm">${T.pastilleSel(X)}${T.nomHtml(X)}</b> <span class="tl-m">${T.dose(X)}${T.stockMarque(X.v)}${T.bioPill(X)}</span></div>`;
// Une voie d'un groupe : la ligne (usage, nom, stock, « + »), puis ses familles, le picto et sa barre
// côte à côte ; les objectifs n'y sont qu'une trace fine, la barre s5 du groupe les montre en tête.
const ligne = (X) => `<article class="rw" data-voie="${X.n}"${T.ligneHoublon(X)} aria-label="${K.esc(X.v.libelle)}"><div class="rw-h">${tete(X)}${T.plus(X)}</div>${T.intensite(X, { ...O, objectifs: 'traces' })}</article>`;
const ligne2 = (X) => `<article class="rw rw2" data-voie="${X.n}"${T.ligneHoublon(X)} aria-label="${K.esc(X.v.libelle)}">
        <div class="rw-h">${tete(X)}${T.plus(X)}</div>
        <div class="rw-c">${T.couloirs(X, { crans: true })}${T.intensite(X, { ...O, objectifs: 'aucun' })}</div>
      </article>`;

function corps() {
  const { memes, gestes } = K.groupes();
  const USI = { arome: ico('j-arome', 14), amer: ico('j-goutte', 14), '': '' };
  const meme = (g, gi) => `
  <section class="gt" aria-label="${gi ? 'Même effet' : 'Même effet sur tes objectifs'}, ${g.dose}, ${MOMENT[g.moment].lg}">
    <div class="t-h">${ico('i-equal', 14)}<span>${gi ? 'même effet' : 'même effet sur tes objectifs'}</span><span class="q">${g.dose}</span>${T.chip(g.moment)}</div>
    ${T.couloirs(g.voies[0], { lab: true })}
    <div class="rws">${g.voies.map(ligne).join('')}</div>
  </section>`;
  const geste = (g) => `
  <section class="gt" aria-label="${g.t}">
    <div class="t-h">${USI[g.usage]}<span>${g.t}</span>${T.chip(g.mo)}${g.est ? '<span class="est">estimé</span>' : ''}</div>
    <div class="rws">${g.voies.map(ligne2).join('')}</div>
  </section>`;
  return `${T.tete}${T.objectifs()}${memes.map(meme).join('')}${gestes.map(geste).join('')}${T.plis()}${T.dock()}`;
}

const CSS = `
  .gt { background: #fff; border-radius: 8px; box-shadow: var(--ombre); padding: 4px 10px 1px; display: flex; flex-direction: column; }
  .gt > .cx { margin: 3px 0 6px; }
  .gt .est { background: #f1f2f6; }
  .rws { display: flex; flex-direction: column; }
  .rw { display: flex; flex-direction: column; align-items: stretch; gap: 1px; padding: 3px 0 4px; border-top: 1px solid var(--trait); transition: background .15s; }
  .rw > .mbs { padding-left: 1px; }
  .rw.appui { background: #f1f2f6; }
  .rw.f-source { background: #eceef4; box-shadow: -10px 0 0 #eceef4, 10px 0 0 #eceef4; }
  .rw .nmw { flex: 1; min-width: 0; line-height: 1.2; }
  .nmw .tl-m { display: inline-flex; align-items: center; gap: 4px; vertical-align: -3px; margin-left: 2px; color: var(--gris); }
  .rw .mbs { flex: none; }
  .rw2 { flex-direction: column; align-items: stretch; gap: 2px; }
  .rw-h { display: flex; align-items: center; gap: 5px; min-height: 26px; }
  .rw-c { display: flex; align-items: flex-end; gap: 10px; padding-bottom: 2px; }
  .rw-c .cx { flex: 1; margin-bottom: 2px; }
`;
K.ecrire(OUT + '/etat-b.html', T.page('Tuiles par groupe · Suggestions', 'Lot 18 · l5c · Tuiles par groupe : une tuile par groupe, ses voies en lignes. Générée par generateur-l5c.mjs (../l5b/tuiles-compactes.mjs).', CSS, corps()));
K.ecrire(OUT + '/planche.html', T.planche('l5c · Tuiles par groupe', CSS, T.abecedaire()));
