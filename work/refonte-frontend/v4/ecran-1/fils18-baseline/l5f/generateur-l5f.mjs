// Lot 18 · l5f · l5e avec les trois retouches de la critique (fils21-choisir/critique/l5e.md) : mots rendus
// (Barres et Radar écrits, « Comparer (3) », « +1 cran »), la tuile double en pleine largeur à la fin de son
// groupe, le trait noir de ma bière sur les trois pistes ; la fiche allégée. Ce qui suit est l'en-tête de l5e :
// Lot 18 · l5e · l5b TEL QUEL (« Il est très très bien celui-ci aussi ») avec tous les retours de l5d.
// La grille de l5b est gardée : objectifs en bandes et leurs pistes, un widget « même effet » par groupe et
// ses voies en petites tuiles deux par rangée, les gestes en tuiles larges. Le socle est celui de l5d
// (pictos au trait, légende derrière « ? », fiche au langage de la page, pas de bande d'axe) ; pour tenir
// en deux colonnes : l'α du lot seul sur la tuile (la plage sans lot), l'usage en pastille courte.
// Usage : node generateur-l5f.mjs  →  l5f/etat-b.html, planche.html, vue-legende.html, vue-fiche.html
import * as T from './tuiles-l5f.mjs';
const { K } = T;
const OUT = K.E1 + '/fils18-baseline/l5f';
const { ico, MOMENT, V } = K;

for (const X of V) {
  if (X.v.levureVers) continue;
  const a = X.v.actions.map((x) => x.houblon).join('|'), f = (X.v.fiches || []).map((x) => x.houblon).join('|');
  if (a !== f) throw new Error('voie ' + X.n + ' : actions ' + a + ' ≠ fiches ' + f);
}

const petit = (X, cls = '') => `<article class="tl${cls}" data-voie="${X.n}"${T.ligneHoublon(X)} aria-label="${K.esc(X.v.libelle)}">
      ${cls ? T.teteParHoublon(X) : T.tete(X)}
      ${T.intensite(X, { objectifs: 'traces' })}
    </article>`;
const moyen = (X) => `<article class="tl tl-l" data-voie="${X.n}"${T.ligneHoublon(X)} aria-label="${K.esc(X.v.libelle)}">
      ${T.tete(X)}
      <div class="tl-c">${T.couloirs(X, { crans: true })}${T.intensite(X, { objectifs: 'aucun' })}</div>
    </article>`;

function corps() {
  const { memes, gestes } = K.groupes();
  // Comme l5d : « sur tes objectifs » retiré après « même effet ».
  // Coupe 1 (décision du pilote) : un widget ne répète pas la dose et le moment du groupe au-dessus.
  const meme = (g, i) => { const rep = i > 0 && memes[i - 1].dose === g.dose && memes[i - 1].moment === g.moment; return `
  <section class="gw" aria-label="Même effet sur tes objectifs, ${g.dose}, ${MOMENT[g.moment].lg}">
    <div class="t-h">${ico('i-equal', 14)}<span>même effet</span>${rep ? '' : `<span class="q">${g.dose}</span>${T.chip(g.moment)}`}</div>
    ${T.couloirs(g.voies[0], { lab: i === 0 ? 'unite' : true })}
  </section>
  <div class="grille">${g.voies.filter((X) => (X.v.fiches || []).length < 2).map((X) => petit(X)).join('')}${g.voies.filter((X) => (X.v.fiches || []).length >= 2).map((X) => petit(X, ' tl-x')).join('')}</div>`; };
  // l5f : les tuiles à un houblon d'abord, deux par rangée ; la tuile double (ajout cumulé) en pleine largeur, à la fin.
  // Comme l5d : le titre du geste en mots, sans la goutte ni le souffle.
  const geste = (g) => `
  <h3 class="t-h st"><span>${g.t}</span>${T.chip(g.mo)}${g.est ? '<span class="est">estimé</span>' : ''}</h3>
  ${g.voies.map(moyen).join('')}`;
  return `${T.teteEcran}${T.objectifs()}${memes.map(meme).join('')}${gestes.map(geste).join('')}${T.plis()}${T.dock()}${T.LEGENDE}`;
}

const CSS = `
  .tl-c { display: flex; align-items: flex-end; gap: 10px; }
  .tl-c .cx { flex: 1; margin-bottom: 4px; }
  .tl-x { grid-column: 1 / -1; }`;
K.ecrire(OUT + '/etat-b.html', T.page('Tuiles fines, retouchées · Suggestions', 'Lot 18 · l5f : l5e avec les retouches de la critique : mots rendus (Barres, Radar, Comparer (3), +1 cran), tuile double en pleine largeur, trait noir de ma bière sur les trois pistes, fiche allégée. Générée par generateur-l5f.mjs (tuiles-l5f.mjs, ../l5/donnees-l5-l6.mjs).', CSS, corps()));
K.ecrire(OUT + '/planche.html', T.planche('l5f · Tuiles fines, retouchées', CSS, T.abecedaire()));
K.ecrire(OUT + '/vue-legende.html', T.vue('l5f · la légende ouverte par le « ? »', 'etat-b.html?legende'));
K.ecrire(OUT + '/vue-fiche.html', T.vue('l5f · la fiche de Motueka', 'etat-b.html?fiche=Motueka'));
