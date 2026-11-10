// Écrit choix-captures/index.html : six options, trois mini maquettes chacune (entrée, pendant l'ajout, dépense lue).
// Forme reprise de choix-nom (retouches e-t8) : têtes courtes, balises, vignettes identiques au pixel grisées avec « = X » (md5, 02.11).
// Usage : node page.cjs <index.html>
const fs = require('fs'); const out = process.argv[2];
const H = { entree: 600, pendant: 1040, lue: 1400 };
const VUES = [['entree', 'Entrée', 'l’entrée'], ['pendant', 'Pendant l’ajout', 'pendant l’ajout'], ['lue', 'Dépense lue', 'la dépense lue']];
const EGAL = { 'b-entree': 'A', 'e-entree': 'C', 'f-pendant': 'D', 'c-lue': 'B', 'd-lue': 'B', 'e-lue': 'B', 'f-lue': 'B' };
const OPT = [
  { id: 'a', ref: true, badge: '<span class="badge b-ref">aujourd\'hui</span>', balise: '1 fichier', phrase: 'Trois captures : un PDF à faire ailleurs.', mesure: 'PDF de 3 pages : 9/12 en ligne ; 3 images : 11/12 au banc (doc10)' },
  { id: 'b', badge: '<span class="badge b-choisie">choisie</span>', balise: '+ page · Lire', phrase: '« + page » pour la suivante, puis Lire (sans délai : il la cherche encore).' },
  { id: 'c', balise: 'd’un coup', phrase: 'Toutes choisies ensemble, lues tout de suite ; l’ordre se glisse.' },
  { id: 'd', balise: 'papier', phrase: 'Après chaque photo : « + page » ou Terminer. Les captures : comme aujourd’hui.' },
  { id: 'e', badge: '<span class="badge b-plus">B + C</span>', balise: 'd’un coup · Lire', phrase: 'Plusieurs d’un coup, « + page » pour une photo, puis Lire.' },
  { id: 'f', badge: '<span class="badge b-reco">proposée</span>', balise: 'C + D', phrase: 'Captures comme C, papier comme D ; une page reste un geste ; pas de + page après coup.' },
];
const L = (o) => o.id.toUpperCase();
const vue = (o, [v, lab, titre]) => {
  const n = `${o.id}-${v}`, eg = EGAL[n];
  return `      <div class="vue" data-vignette><span>${lab}</span><a class="ecran${eg ? ' egal' : ''}" href="img/${n}.png" data-agrandir data-titre="${L(o)} · ${titre}${eg ? ` (= ${eg})` : ''}" title="cadre bleu : ce qui change"><img src="img/${n}.png" width="780" height="${H[v]}" alt="${L(o)}, ${titre}">${eg ? `<b class="egal-b">= ${eg}</b>` : ''}</a></div>`;
};
const fig = (o) => `    <figure class="option${o.id === 'f' ? ' reco-col' : ''}" ${o.ref ? 'data-reference' : `data-variante="${o.id}"`}>
      <div class="tete"><p class="lettre">${L(o)} ${o.badge ?? ''}</p><p class="balises"><span class="fiches${o.ref ? ' f3' : ''}">${o.balise}</span>${o.ref ? '' : '<span class="aconst">à construire</span>'}</p><p>${o.phrase}</p>${o.mesure ? `<p class="mesure">${o.mesure}</p>` : ''}</div>
${VUES.map((v) => vue(o, v)).join('\n')}
    </figure>`;
const css = fs.readFileSync(__dirname + '/page.css', 'utf8') + '.b-choisie { color: #fff; background: #1c2019; }\n.son-choix { font-weight: 800; font-size: 1.0625rem; color: #fff; background: #1c2019; border-radius: 10px; padding: 6px 12px; }\n.b-plus { color: var(--const); border: 1.5px solid currentColor; }\n';
const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Plusieurs captures pour une seule dépense · 02.11</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
${css}</style>
</head>
<body>
<div class="page">
  <header style="display:grid;gap:8px">
    <p class="sur-titre">L'Affinée · Dépense · plusieurs pages</p>
    <h1>Plusieurs captures pour une seule dépense · 02.11</h1>
    <p class="son-choix">Son choix (02.11) : B, avec le bouton noir coupé en deux</p>
    <div id="a-choisir">
      <p>Une commande en 2 à 4 captures, ou une facture en plusieurs photos : comment donnes-tu ces pages à une seule dépense ?</p>
      <p><span class="reco">Proposée : F</span> — captures plusieurs d’un coup, papier page à page ; une page reste un geste. Mais pas de + page après coup : pour ça, E.</p>
      <p>Les six restent ouvertes. Dans toutes, les pages sont lues en images séparées, et un seul justificatif va au Drive.</p>
    </div>
  </header>

  <section data-choix="plusieurs-captures" aria-label="Six options" class="options">
${OPT.map(fig).join('\n')}
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
fs.writeFileSync(out, html); console.log('écrit', out);
