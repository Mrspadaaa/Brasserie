// Écrit choix-sousfamilles/index.html : cinq options (A = aujourd'hui), quatre mini maquettes chacune, alignées par vue.
// Forme reprise de choix-captures et choix-nom (verdicts e-t8 et e-t10) : en-tête court, balise de deux mots, prix dit, visionneuse.
// Usage : node page.cjs <index.html>   (lit outils/tailles.json, écrit par gen.mjs)
const fs = require('fs'); const path = require('path');
const out = process.argv[2];
const T = JSON.parse(fs.readFileSync(path.join(__dirname, 'tailles.json'), 'utf8'));
const VUES = [
  ['renovation', 'Rénovation (16 lignes)', 'Rénovation, clair'],
  ['renovation-sombre', 'Rénovation, sombre', 'Rénovation, sombre'],
  ['nettoyage', 'Houblons · Nettoyage · Consommables', 'autre facture : Houblons (aucune sous-famille), Nettoyage (3), Consommables (une seule)'],
  ['repos', 'Au repos, 390 × 844', 'la dépense au repos, défilée jusqu’aux bandes'],
];
const px = (a, b) => `+${T[`${a}-renovation`] - T[`a-renovation`] > 0 ? T[`${a}-renovation`] - T['a-renovation'] : 0} px`;
const OPT = [
  { id: 'a', ref: true, badge: '<span class="badge b-ref">aujourd\'hui</span>', balise: 'aucune', phrase: 'Les lignes dans l’ordre du papier ; la sous-famille ne se voit pas.' },
  { id: 'b', badge: '<span class="badge b-reco">proposée</span>', balise: 'sous-titres', phrase: 'Lignes groupées par sous-famille, un sous-titre : nom, nombre, quantité, montant.', cout: `${px('b')} sur Rénovation.` },
  { id: 'c', balise: 'un mot', phrase: 'Ordre du papier gardé ; la sous-famille en pastille sur la rangée.', cout: `Un nom long passe sur 2 lignes : ${px('c')}.` },
  { id: 'd', balise: 'replié', phrase: 'Au repos, une ligne par sous-famille (nombre, quantité, montant) ; un toucher l’ouvre.', cout: 'Une ligne à vérifier l’ouvre d’office ; une ligne seule, sans chevron. Touchée : Peinture et sols.' },
  { id: 'e', badge: '<span class="badge b-ajoutee">ajoutée</span>', balise: 'pastilles', phrase: 'Ordre du papier gardé ; les sous-totaux en pastilles, un toucher garde leurs lignes.', cout: `Pastilles : ${px('e')} sur Rénovation. Touchée, la pastille dit aussi la quantité (Désinfectant).` },
];
const L = (o) => o.id.toUpperCase();
const vue = (o, [v, lab, titre]) => {
  const n = `${o.id}-${v}`;
  return `      <div class="vue" data-vignette><span>${lab}</span><a class="ecran" href="img/${n}.png" data-agrandir data-titre="${L(o)} · ${titre}"><img src="img/${n}.png" width="780" height="${T[n] * 2}" alt="${L(o)}, ${titre}"></a></div>`;
};
const fig = (o) => `    <figure class="option${o.id === 'b' ? ' reco-col' : ''}" ${o.ref ? 'data-reference' : `data-variante="${o.id}"`}>
      <div class="tete"><p class="lettre">${L(o)} ${o.badge ?? ''}</p><p class="balises"><span class="fiches${o.ref ? ' f3' : ''}">${o.balise}</span>${o.ref ? '' : '<span class="aconst">à construire</span>'}</p><p>${o.phrase}</p>${o.cout ? `<p class="cout">${o.cout}</p>` : ''}</div>
${VUES.map((v) => vue(o, v)).join('\n')}
    </figure>`;
const css = fs.readFileSync(path.join(__dirname, 'page.css'), 'utf8');
const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Les sous-familles dans une bande · 02.11</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
${css}</style>
</head>
<body>
<div class="page">
  <header style="display:grid;gap:8px">
    <p class="sur-titre">L'Affinée · Dépense · sous-familles</p>
    <h1>Les sous-familles dans une bande · 02.11</h1>
    <div id="a-choisir">
      <p>Dans une bande de famille (vue Catégorie), comment vois-tu la sous-famille de chaque ligne ?</p>
      <p>Seul ça change. Une seule sous-famille (Consommables : EPI) ou aucune (Houblons) : la bande reste celle d’aujourd’hui.</p>
      <p><span class="reco">Proposée : B</span> — le classement par sous-famille, sous-totaux de quantité et de montant, toutes les lignes visibles. Prix : la bande s’allonge (${px('b')} sur 16 lignes).</p>
    </div>
  </header>

  <section data-choix="sous-familles" aria-label="Cinq options" class="options">
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
