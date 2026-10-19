// Lot 18 · l5d · Tuiles fines, avec tous les retours de ce soir sur la baseline (D87 à D93).
// l5b (objectifs en bandes et leurs pistes, un widget « même effet » par groupe, les gestes, les barres de
// l5b), avec : les pictos d'arôme au trait de l2 Carnet (D88) ; l'α du lot puis la plage des fiches sur
// chaque houblon (D87) ; l'usage en mot (D90) ; la légende derrière un « ? » (D89) ; pas de bande d'axe,
// la visée sur la piste (D91, D92) ; la fiche dans le langage de la page (D93).
// En plus : chaque voie est une tuile large (le « moyen » de l5b) : nom, usage et α tiennent sur une ligne.
// En deux colonnes, une tuile de 167 px passait sur trois à cinq lignes, et le premier écran montrait les
// sept voies du premier groupe et l'en-tête du second : 79 mots au moins, pour 70 permis.
// Usage : node generateur-l5d.mjs  →  l5d/etat-b.html, l5d/planche.html, l5d/vue-legende.html, l5d/vue-fiche.html
import * as T from './tuiles-l5d.mjs';
const { K } = T;
const OUT = K.E1 + '/fils18-baseline/l5d';
const { ico, MOMENT, V } = K;

// Les houblons d'une voie (c1 : fiches, avec α et rôle) sont ceux de ses actions, dans le même ordre.
for (const X of V) {
  if (X.v.levureVers) continue;
  const a = X.v.actions.map((x) => x.houblon).join('|'), f = (X.v.fiches || []).map((x) => x.houblon).join('|');
  if (a !== f) throw new Error('voie ' + X.n + ' : actions ' + a + ' ≠ fiches ' + f);
}

const tuile = (X) => `<article class="tl" data-voie="${X.n}"${T.ligneHoublon(X)} aria-label="${K.esc(X.v.libelle)}">
      ${T.tete(X)}
      ${T.intensite(X, { objectifs: 'traces' })}
    </article>`;
const tuileGeste = (X) => `<article class="tl" data-voie="${X.n}"${T.ligneHoublon(X)} aria-label="${K.esc(X.v.libelle)}">
      ${T.tete(X)}
      <div class="tl-c">${T.couloirs(X, { crans: true })}${T.intensite(X, { objectifs: 'aucun' })}</div>
    </article>`;

function corps() {
  const { memes, gestes } = K.groupes();
  // En moins, pour tenir 70 mots : « sur tes objectifs » après « même effet » (la barre s5 du widget montre
  // les objectifs ; le second groupe disait déjà « même effet » seul dans l5b).
  const meme = (g) => `
  <section class="gw" aria-label="Même effet sur tes objectifs, ${g.dose}, ${MOMENT[g.moment].lg}">
    <div class="t-h">${ico('i-equal', 14)}<span>même effet</span><span class="q">${g.dose}</span>${T.chip(g.moment)}</div>
    ${T.couloirs(g.voies[0], { lab: true })}
  </section>
  <div class="liste">${g.voies.map(tuile).join('')}</div>`;
  // Les gestes : le titre dit le geste en mots ; la goutte et le souffle (« pas parlant ») n'y sont plus.
  const geste = (g) => `
  <h3 class="t-h st"><span>${g.t}</span>${T.chip(g.mo)}${g.est ? '<span class="est">estimé</span>' : ''}</h3>
  <div class="liste">${g.voies.map(tuileGeste).join('')}</div>`;
  return `${T.teteEcran}${T.objectifs()}${memes.map(meme).join('')}${gestes.map(geste).join('')}${T.plis()}${T.dock()}${T.LEGENDE}`;
}

const CSS = '';
K.ecrire(OUT + '/etat-b.html', T.page('Tuiles fines, retours du soir · Suggestions', 'Lot 18 · l5d : l5b avec les retours D87 à D93 (pictos au trait, α du lot et des fiches, usage en mot, légende derrière « ? », fiche au langage de la page). Générée par generateur-l5d.mjs (tuiles-l5d.mjs, ../l5/donnees-l5-l6.mjs).', CSS, corps()));
K.ecrire(OUT + '/planche.html', T.planche('l5d · Tuiles fines, retours du soir', CSS, T.abecedaire()));
K.ecrire(OUT + '/vue-legende.html', T.vue('l5d · la légende ouverte par le « ? »', 'etat-b.html?legende'));
K.ecrire(OUT + '/vue-fiche.html', T.vue('l5d · la fiche de Motueka', 'etat-b.html?fiche=Motueka'));
const tons = K.ORDRE.map((f) => f + ' ' + T.cr(K.J[f].texte, '#ffffff').toFixed(2)).join(', ');
console.log('trait au ton texte, sur blanc : ' + tons);
