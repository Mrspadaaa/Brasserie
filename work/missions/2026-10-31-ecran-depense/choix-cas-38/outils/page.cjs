// Voie l3-cas (02.11, D312) : écrit choix-cas-38/index.html. Deux choix sur la même page, un facteur chacun (L10) :
// 1. le total que la 3e lecture corrige ; 2. la 3e lecture qui n'arrive jamais. Base : ses maquettes d-lue et d-15 (D308).
// Forme de choix-lignes-38 (en-tête court, avis avec raison et limite, vues communes montrées une fois).
// Usage (racine) : node work/missions/2026-10-31-ecran-depense/choix-cas-38/outils/page.cjs <index.html>
const fs = require('fs'); const path = require('path');
const out = process.argv[2];
const md5 = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'img', 'md5.json'), 'utf8'));
// Aucune vignette ne doit en répéter une autre au pixel (sinon elle serait montrée en « = X ») : on le vérifie.
const vus = new Map(); for (const [n, h] of Object.entries(md5)) { if (vus.has(h)) throw new Error(`${n} = ${vus.get(h)} : à montrer en « = X »`); vus.set(h, n); }

const Q1 = {
  cle: 'total-corrige', classe: 'q1', titre: '1. Le total que la 3e lecture corrige',
  sous: 'Les lectures rapides lisent 46,40 ; la 3e lit 48,00 : le Malt de Munich est à 2,20, pas à 1,80. Le total compte une fois dans « ↻ 5 corrigées ». Tapé par toi, il ne change pas.',
  vue: 'À l’arrivée de la 3e lecture',
  suite: [['q1-a-sombre', 'A en sombre']],
  options: [
    { id: 'a', ref: true, reco: true, badge: '<span class="badge b-ref">référence</span><span class="badge b-reco">mon avis</span>', balise: 'fond bleu, l’ancien barré', phrase: 'Comme sur une rangée : 48,00 sur fond bleu, 46,40 barré juste à côté.', img: 'q1-a' },
    { id: 'b', balise: '« ↻ +1,60 »', phrase: 'Le total sans fond ; à côté, en bleu, ce que la 3e lecture a trouvé en plus.', img: 'q1-b' },
    { id: 'c', balise: 'souligné bleu', phrase: 'Le total en bleu, souligné comme un champ du haut à contrôler (en jaune aujourd’hui). Sans l’ancien.', img: 'q1-c' },
    { id: 'd', balise: 'rien sur le total', phrase: 'Le total tel quel. Seule la puce « ↻ 5 corrigées » le compte.', img: 'q1-d' },
  ],
};
const Q2 = {
  cle: 'lecture-jamais', classe: 'q2', titre: '2. La 3e lecture n’arrive jamais',
  sous: 'Aucune réponse 150 s après l’envoi (le temps que l’app attend déjà aujourd’hui), ou la reprise a raté ; une erreur après les lectures rapides, pareil. Les valeurs rapides et tes saisies restent, avec leurs drapeaux. « Confirmer » redevient noir et les enregistre.',
  avant: ['q2-avant', 'Avant, pour les quatre : ta maquette D, la 3e lecture en cours'],
  vue: 'Après : 150 s sans réponse',
  suite: [['q2-d-sombre', 'D en sombre']],
  options: [
    { id: 'a', ref: true, badge: '<span class="badge b-ref">référence</span>', balise: '« 2 lectures », « Lecture coupée »', phrase: 'La forme d’aujourd’hui : « 2 lectures », le point « Lecture coupée » en jaune ; la phrase au toucher du point.', img: 'q2-a' },
    { id: 'b', balise: '●●×', phrase: 'Le fil part ; tes trois points restent, le troisième devient une croix jaune. Aucun mot.', img: 'q2-b' },
    { id: 'c', balise: 'le fil reste, figé', phrase: 'Le fil reste, en jaune : « non vérifiée ». Il part quand tu confirmes.', img: 'q2-c' },
    { id: 'd', reco: true, badge: '<span class="badge b-reco">mon avis</span>', balise: 'puce « non vérifiée »', phrase: 'Le fil part. Rien n’est corrigé : à la place de « ↻ N corrigées », une puce jaune « non vérifiée ». Un toucher dit la phrase.', img: 'q2-d' },
  ],
};
const L = (id) => id.toUpperCase();
const vignette = (q, n, lab, titre) => `      <div class="vue" data-vignette><span>${lab}</span><a class="ecran" href="img/${n}.png" data-agrandir data-titre="${titre}"><img src="img/${n}.png" width="780" height="1400" alt="${titre}"></a></div>`;
function section(q) {
  const fig = (o) => `    <figure class="option${o.reco ? ' reco-col' : ''}" ${o.ref ? 'data-reference' : `data-variante="${o.id}"`}>
      <div class="tete"><p class="lettre">${L(o.id)} ${o.badge ?? ''}</p><p class="balises"><span class="fiches${o.ref ? ' f3' : ''}">${o.balise}</span>${o.ref ? '' : '<span class="aconst">à construire</span>'}</p><p>${o.phrase}</p></div>
${vignette(q, o.img, q.vue, `${q.titre.slice(3)} · ${L(o.id)} · ${q.vue.toLowerCase()}`)}
    </figure>`;
  const avant = q.avant ? `    <div class="options avant">
${vignette(q, q.avant[0], q.avant[1], `${q.titre.slice(3)} · ${q.avant[1]}`)}
    </div>\n` : '';
  return `  <section class="question ${q.classe}" aria-labelledby="t-${q.cle}">
    <header><h2 id="t-${q.cle}">${q.titre}</h2><p class="mesure">${q.sous}</p></header>
${avant}    <div class="options" data-choix="${q.cle}">
${q.options.map(fig).join('\n')}
    </div>
    <div class="options suite">
${q.suite.map(([n, lab]) => vignette(q, n, lab, `${q.titre.slice(3)} · ${lab}`)).join('\n')}
    </div>
  </section>`;
}
const css = fs.readFileSync(path.join(__dirname, 'page.css'), 'utf8');
const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Lecture lente : le total corrigé, la 3e lecture qui n’arrive pas · 02.11</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
${css}</style>
</head>
<body>
<div class="page">
  <header style="display:grid;gap:8px">
    <p class="sur-titre">L'Affinée · Dépense · lenteur D</p>
    <h1>Ta lenteur D : le total que la 3e lecture corrige, et la 3e lecture qui n’arrive pas · 02.11</h1>
    <div id="a-choisir">
      <p>Deux choix : réponds par une lettre pour chacun, par exemple « 1 A, 2 D ». Base : ta maquette D, inchangée.</p>
      <p><span class="reco">Mon avis : 1 A, 2 D.</span> 1 A parle comme tes rangées corrigées. 2 D met le signal à la place de « ↻ corrigées », là où tu regardes à l’arrivée, sans phrase à l’écran.</p>
      <p class="mesure">Limites : en 1 A, le haut porte deux nombres côte à côte (48,00 et 46,40 barré) ; en 2 D, la raison ne se lit qu’au toucher de la puce.</p>
    </div>
  </header>

${section(Q1)}

${section(Q2)}
</div>

<dialog id="grand" aria-label="Capture en grand">
  <div class="haut"><p class="titre" id="grand-titre"></p><button type="button" class="fermer">Fermer</button></div>
  <img id="grand-img" alt="">
</dialog>
<script>
(function () {
  var dlg = document.getElementById('grand'), img = document.getElementById('grand-img'), titre = document.getElementById('grand-titre');
  document.querySelectorAll('[data-agrandir]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (!dlg.showModal) return;
      e.preventDefault();
      img.setAttribute('src', a.getAttribute('href'));
      img.setAttribute('alt', a.getAttribute('data-titre'));
      titre.textContent = a.getAttribute('data-titre');
      dlg.showModal();
    });
  });
  dlg.querySelector('.fermer').addEventListener('click', function () { dlg.close(); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
})();
</script>
</body>
</html>
`;
fs.writeFileSync(out, html); console.log('écrit', out);
