// Voie l2b-valider (02.11, D313) : écrit choix-valider/index.html. Un choix, un facteur (L10) : avec deux lignes pas retrouvées, où est
// « Tout valider » et comment se tranche chaque ligne une à une. Base : son choix 2 D (choix-lignes-38/maquettes/q2-d-arrivee.html).
// Forme de choix-lignes-38 (reprise 1, e-t13). Usage (racine) : node work/missions/2026-10-31-ecran-depense/choix-valider/outils/page.cjs <index.html>
const fs = require('fs'); const path = require('path');
const out = process.argv[2];
const md5 = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'img', 'md5.json'), 'utf8'));

const Q = {
  cle: 'tout-valider', classe: 'q1', titre: 'Deux lignes pas retrouvées : « Tout valider », et une à une',
  sous: 'Avoine maltée (1,70) et Amarillo (2,20) étaient dans le provisoire ; la 3e lecture ne les trouve pas. « Tout valider » suit la 3e lecture : elles partent toutes les deux.',
  vues: [['arrivee', 'À l’arrivée de la 3e lecture'], ['garder', 'Après « Garder » sur Avoine maltée']],
  suiteTitre: 'Après « Tout valider », B, C et D donnent la même dépense :',
  suite: [['tout', 'Après « Tout valider » (B, C, D)'], ['b-arrivee-sombre', 'B à l’arrivée, en sombre']],
  options: [
    { id: 'a', ref: true, badge: '<span class="badge b-ref">ton 2 D</span>', balise: 'une à la fois', phrase: 'Ton bandeau tel quel, « 1/2 » puis « 2/2 ». Pas de « Tout valider ».', img: { arrivee: 'a-arrivee', garder: 'a-garder' } },
    { id: 'b', reco: true, badge: '<span class="badge b-reco">mon avis</span>', balise: '« Tout valider » dans le bandeau', phrase: 'Ton bandeau, une ligne à la fois (« 1/2 »), et « Tout valider » en haut à droite.', geste: 'Il défile : Garder ou Retirer passe à la suivante.', img: { arrivee: 'b-arrivee', garder: 'b-garder' } },
    { id: 'c', balise: 'bandeau en liste', phrase: 'Le bandeau s’ouvre en liste courte : « Tout valider » en tête, chaque ligne avec Garder et Retirer.', geste: 'Au-delà de trois lignes : les trois premières, puis « + N ».', img: { arrivee: 'c-arrivee', garder: 'c-garder' } },
    { id: 'd', balise: 'la question sur la rangée', phrase: 'Garder et Retirer sur chaque rangée barrée ; le bandeau ne porte que « Tout valider ».', geste: 'Ta 2 D avec la rangée de 2 B.', img: { arrivee: 'd-arrivee', garder: 'd-garder' } },
  ],
};
const L = (id) => id.toUpperCase();
const vignette = (n, lab, eg, titre) => `<div class="vue" data-vignette><span>${lab}</span><a class="ecran${eg ? ' egal' : ''}" href="img/${n}.png" data-agrandir data-titre="${titre}"><img src="img/${n}.png" width="780" height="1720" alt="${titre}">${eg ? `<b class="egal-b">${eg}</b>` : ''}</a></div>`;
// Une vue identique au pixel à une précédente (md5) porte « = X » ; aucune ici, mais le contrôle reste.
const vus = new Map(); const EG = {};
for (const o of Q.options) for (const [v] of Q.vues) { const n = o.img[v], h = md5[n]; if (vus.has(h)) EG[n] = `= ${vus.get(h)}`; else vus.set(h, L(o.id)); }
const fig = (o) => `    <figure class="option${o.reco ? ' reco-col' : ''}" ${o.ref ? 'data-reference' : `data-variante="${o.id}"`}>
      <div class="tete"><p class="lettre">${L(o.id)} ${o.badge ?? ''}</p><p class="balises"><span class="fiches${o.ref ? ' f3' : ''}">${o.balise}</span>${o.ref ? '' : '<span class="aconst">à construire</span>'}</p><p>${o.phrase}</p>${o.geste ? `<p class="geste">${o.geste}</p>` : ''}</div>
${Q.vues.map(([v, lab]) => '      ' + vignette(o.img[v], lab, EG[o.img[v]], `${L(o.id)} · ${lab.toLowerCase()}`)).join('\n')}
    </figure>`;
const css = fs.readFileSync(path.join(__dirname, 'page.css'), 'utf8');
const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Lecture lente : « Tout valider » les lignes pas retrouvées · 02.11</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
${css}
</style>
</head>
<body>
<div class="page">
  <header style="display:grid;gap:8px">
    <p class="sur-titre">L'Affinée · Dépense · lenteur D · ton choix 2 D</p>
    <h1>« Tout valider », et une à une : les lignes que la 3e lecture ne retrouve pas · 02.11</h1>
    <div id="a-choisir">
      <p>Une lettre : où mettre « Tout valider », et comment trancher chaque ligne.</p>
      <p><span class="reco">Mon avis : B.</span> C’est ton bandeau, avec un bouton de plus ; la liste reste celle de ta maquette. Limite : une seule ligne à la fois sous le pouce.</p>    </div>
  </header>

  <section class="question q1" aria-labelledby="t-${Q.cle}">
    <header><h2 id="t-${Q.cle}">${Q.titre}</h2><p class="mesure">${Q.sous}</p></header>
    <div class="options" data-choix="${Q.cle}">
${Q.options.map(fig).join('\n')}
    </div>
    <p class="suite-t">${Q.suiteTitre}</p><div class="options suite">
${Q.suite.map(([n, lab]) => '      ' + vignette(n, lab, n === 'tout' ? '= ta maquette lue' : '', lab)).join('\n')}
    </div>
  </section>
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
fs.writeFileSync(out, html); console.log('écrit', out, '· « = X » :', JSON.stringify(EG));
