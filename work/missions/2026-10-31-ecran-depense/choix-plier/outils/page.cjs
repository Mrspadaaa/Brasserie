// Écrit choix-plier/index.html : cinq options (A = D tel quel), quatre mini maquettes chacune, alignées par vue.
// Forme reprise de choix-sousfamilles (verdict e-t12) : en-tête court, balise de deux mots, prix dit, visionneuse. Nombres tirés de outils/donnees.json.
// Usage : node page.cjs <index.html>   (lit outils/tailles.json et outils/donnees.json, écrits par gen.mjs)
const fs = require('fs'); const path = require('path');
const out = process.argv[2];
const T = JSON.parse(fs.readFileSync(path.join(__dirname, 'tailles.json'), 'utf8'));
const DN = JSON.parse(fs.readFileSync(path.join(__dirname, 'donnees.json'), 'utf8'));
// Débordement du pied avec un point courant posé (« ① Date ») : la commande la plus à droite, contre 382 px (390 moins la marge de 8).
const deborde = (o) => Math.max(0, T[`mesure-pied-${o}-date:pied`].droite - 382);
const VUES = [
  ['plie', 'Tout plié', 'tout plié, clair'],
  ['plie-sombre', 'Tout plié, sombre', 'tout plié, sombre'],
  ['deplie', 'Tout déplié', 'tout déplié'],
  ['mele', 'Peinture et sols ouvert à la main', 'un groupe ouvert à la main (Peinture et sols)'],
];
const OPT = [
  { id: 'a', ref: true, badge: '<span class="badge b-ref">son choix D</span>', balise: 'un à un', phrase: 'D tel quel : chaque sous-groupe s’ouvre d’un toucher.', cout: `Tout déplier : ${DN.pliables} touchers, tout replier : ${DN.pliables}.` },
  { id: 'b', balise: 'en-tête de bande', phrase: 'Toucher l’en-tête d’une bande plie ou déplie ses sous-groupes ; son double chevron dit l’état.', cout: `Un toucher par bande (${DN.bandesPliables} ici) ; l’en-tête colle en haut quand on défile.` },
  { id: 'c', balise: 'bouton du pied', phrase: '« Tout » à côté de Catégorie | Papier : toute la dépense d’un toucher.', cout: `Avec un point au pied (① Date), Confirmer déborde de ${deborde('c')} px.` },
  { id: 'd', balise: 'Catégorie ×2', phrase: 'Catégorie allumé porte » ; le toucher encore plie ou déplie tout.', cout: 'Aucun bouton de plus ; le second toucher se devine au double chevron.' },
  { id: 'e', badge: '<span class="badge b-reco">proposée</span>', balise: 'Plié | Déplié', phrase: 'Ses deux mots en tête de feuille : l’état se lit, un toucher pour tout.', cout: 'Un groupe ouvert à la main : aucun des deux allumé.' },
];
const L = (o) => o.id.toUpperCase();
const vue = (o, [v, lab, titre]) => {
  const n = `${o.id}-${v}`;
  return `      <div class="vue" data-vignette><span>${lab}</span><a class="ecran" href="img/${n}.png" data-agrandir data-titre="${L(o)} · ${titre}"><img src="img/${n}.png" width="780" height="${T[n] * 2}" alt="${L(o)}, ${titre}"></a></div>`;
};
const fig = (o) => `    <figure class="option${o.id === 'e' ? ' reco-col' : ''}" ${o.ref ? 'data-reference' : `data-variante="${o.id}"`}>
      <div class="tete"><p class="lettre">${L(o)} ${o.badge ?? ''}</p><p class="balises"><span class="fiches${o.ref ? ' f3' : ''}">${o.balise}</span>${o.ref ? '' : '<span class="aconst">à construire</span>'}</p><p>${o.phrase}</p>${o.cout ? `<p class="cout">${o.cout}</p>` : ''}</div>
${VUES.map((v) => vue(o, v)).join('\n')}
    </figure>`;
const css = fs.readFileSync(path.join(__dirname, 'page.css'), 'utf8');
const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Tout plier, déplier sur D · 02.11</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
${css}</style>
</head>
<body>
<div class="page">
  <header style="display:grid;gap:8px">
    <p class="sur-titre">L'Affinée · Dépense · sous-familles repliées (D)</p>
    <h1>Tout plier, déplier sur D · 02.11</h1>
    <div id="a-choisir">
      <p>Sur D, où plies-tu ou déplies-tu tous les sous-groupes d’un coup ?</p>
      <p>Seul ce geste change, cerclé en bleu. Une ligne à vérifier garde son groupe ouvert, même tout plié (Désinfectant).</p>
      <p><span class="reco">Proposée : E</span> — tes mots « plier, déplier », l’état se lit sans icône, le pied reste à Confirmer. Prix : un segment de plus dans l’en-tête, en haut.</p>
    </div>
  </header>

  <section data-choix="plier" aria-label="Cinq options" class="options">
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
