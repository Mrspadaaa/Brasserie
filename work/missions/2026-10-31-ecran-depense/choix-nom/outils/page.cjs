// Écrit choix-nom/index.html (retouches e-t8) : têtes courtes, balises, vignettes identiques à B grisées avec « = B ».
// Usage : node page.cjs <index.html>. Les vignettes « = B » sont celles dont le PNG est identique à celui de B (md5, 02.11).
const fs = require('fs'); const out = process.argv[2];
const H = { depense: 892, stock: 1040, suivantes: 944 };
const VUES = [['depense', 'Facture 1 · DE', 'Facture 1, en allemand'], ['stock', 'Au stock', 'Au stock'], ['suivantes', 'Factures suivantes', 'Les factures suivantes']];
const EGAL_B = new Set(['c-depense', 'd-depense', 'f-depense', 'e-stock', 'f-stock', 'd-suivantes', 'e-suivantes']);
const OPT = [
  { id: 'a', ref: true, badge: '<span class="badge b-ref">aujourd\'hui</span>', fiches: '3 fiches', phrase: 'Au stock sous le nom imprimé.', mesure: 'aujourd\'hui : DE se relie, EN et FR font 2 fiches de plus — mesuré 02.11' },
  { id: 'b', badge: '<span class="badge b-reco">proposée</span>', fiches: '1 fiche', phrase: 'En français ; l\'imprimé gardé à la fiche.' },
  { id: 'c', fiches: '1 fiche', phrase: 'En français, l\'imprimé dessous dans la liste.' },
  { id: 'd', fiches: '1 fiche', phrase: 'B, et les doublons déjà là à fusionner.' },
  { id: 'e', fiches: '1 fiche', phrase: 'Le nom français en jaune, à garder.' },
  { id: 'f', fiches: '1 fiche', phrase: 'B, mais une autre langue est proposée.' },
];
const L = (o) => o.id.toUpperCase();
const vue = (o, [v, lab, titre]) => {
  const n = `${o.id}-${v}`, eg = EGAL_B.has(n);
  return `      <div class="vue" data-vignette><span>${lab}</span><a class="ecran${eg ? ' egal' : ''}" href="img/${n}.png" data-agrandir data-titre="${L(o)} · ${titre}${eg ? ' (= B)' : ''}"${v === 'depense' ? ' title="cadre bleu : le nom qui entre au stock"' : ''}><img src="img/${n}.png" width="780" height="${H[v]}" alt="${L(o)}, ${titre}">${eg ? '<b class="egal-b">= B</b>' : ''}</a></div>`;
};
const fig = (o) => `    <figure class="option${o.id === 'b' ? ' reco-col' : ''}" ${o.ref ? 'data-reference' : `data-variante="${o.id}"`}>
      <div class="tete"><p class="lettre">${L(o)} ${o.badge ?? ''}</p><p class="balises"><span class="fiches${o.ref ? ' f3' : ''}">${o.fiches}</span>${o.ref ? '' : '<span class="aconst">à construire</span>'}</p><p>${o.phrase}</p>${o.mesure ? `<p class="mesure">${o.mesure}</p>` : ''}</div>
${VUES.map((v) => vue(o, v)).join('\n')}
    </figure>`;
const css = fs.readFileSync(__dirname + '/page.css', 'utf8');
const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Nom d'un nouvel article venu d'une facture étrangère · 02.11</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
${css}</style>
</head>
<body>
<div class="page">
  <header style="display:grid;gap:8px">
    <p class="sur-titre">L'Affinée · Dépense · nom au stock</p>
    <h1>Nom d'un nouvel article venu d'une facture étrangère · 02.11</h1>
    <div id="a-choisir">
      <p>Sous quel nom un article d'une facture allemande entre-t-il au stock, et la facture suivante le retrouve-t-elle ?</p>
      <p><span class="reco">Proposée : B</span>, « traduit en français et fait le bon lien » ; les six restent ouvertes.</p>
    </div>
  </header>

  <section data-choix="nom-article" aria-label="Six options" class="options">
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
