// Voie l2-lignes (02.11, D310) : écrit choix-lignes-38/index.html. Deux choix sur la même page, un facteur chacun (L10) :
// 1. la ligne que la 3e lecture ajoute ; 2. la ligne du provisoire qu'elle ne lit plus. Base : sa maquette d-lue (D308).
// Forme de choix-lenteur (en-tête court, avis avec raison et limite, « = X » grisé d'après img/md5.json écrit par gen.mjs).
// Usage (racine) : node work/missions/2026-10-31-ecran-depense/choix-lignes-38/outils/page.cjs <index.html>
const fs = require('fs'); const path = require('path');
const out = process.argv[2];
const md5 = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'img', 'md5.json'), 'utf8'));

const Q1 = {
  cle: 'ligne-ajoutee', classe: 'q1', titre: '1. Une ligne que la 3e lecture ajoute',
  sous: 'Mosaic manquait aux deux lectures rapides ; la 3e la trouve. Elle compte dans « ↻ 4 corrigées » et dans Houblons ; l’imprimé reste 46,40, la somme des lignes dit l’écart (48,00).',
  vues: [['arrivee', 'À l’arrivée de la 3e lecture']],
  suite: [['q1-b-sombre', 'B en sombre']],
  options: [
    { id: 'a', ref: true, badge: '<span class="badge b-ref">référence</span>', balise: 'sans marque', phrase: 'Une rangée de plus, comme les autres.', img: { arrivee: 'q1-a' } },
    { id: 'b', reco: true, badge: '<span class="badge b-reco">mon avis</span>', balise: 'rangée en bleu', phrase: 'Toute la rangée sur le bleu des corrections, « ↻ » devant le nom, sans ancienne valeur.', geste: 'Proposée par le plan.', img: { arrivee: 'q1-b' } },
    { id: 'c', balise: 'chaque valeur en bleu', phrase: 'Nom, quantité, prix et montant : chacun sur sa pastille bleue, comme une correction.', img: { arrivee: 'q1-c' } },
    { id: 'd', balise: '« ↻ neuve »', phrase: 'La rangée ordinaire ; sous le nom, à la place de l’ancienne valeur, « ↻ neuve ».', img: { arrivee: 'q1-d' } },
  ],
};
const Q2 = {
  cle: 'ligne-non-relue', classe: 'q2', titre: '2. Une ligne que la 3e lecture ne lit plus',
  sous: 'Avoine maltée (1,70) était dans le provisoire ; la 3e lecture ne la trouve pas. L’imprimé vaut 46,40 : gardée, la somme des lignes fait 48,10.',
  vues: [['arrivee', 'À l’arrivée de la 3e lecture']],
  suiteTitre: 'Après son geste, B, C et D donnent la même dépense :',
  suite: [['q2-b-garder', 'Après « Garder » (B, C, D)'], ['q2-b-retirer', 'Après « Retirer » (B, C, D)', '= A'], ['q2-b-arrivee-sombre', 'B à l’arrivée, en sombre']],
  options: [
    { id: 'a', ref: true, badge: '<span class="badge b-non">à ne pas faire</span>', balise: 'retirée sans marque', phrase: 'Elle disparaît en silence : c’est ta maquette telle quelle.', img: { arrivee: 'q2-a' } },
    { id: 'b', reco: true, badge: '<span class="badge b-reco">mon avis</span>', balise: 'barrée sur place', phrase: 'Barrée en attention, hors du total. « Garder » ou « Retirer » sous le nom.', geste: 'Confirmer sans trancher : elle part.', img: { arrivee: 'q2-b-arrivee' } },
    { id: 'c', balise: 'en jaune, comptée', phrase: 'Reprise en jaune, comme une valeur à contrôler ; « Somme ≠ imprimé » le signale. ✓ ou ✕ sous le nom.', geste: 'Confirmer sans trancher : elle reste.', img: { arrivee: 'q2-c-arrivee' } },
    { id: 'd', balise: 'au pouce', phrase: 'Barrée dans la liste ; la question au-dessus de Confirmer tant qu’il n’a pas tranché.', geste: 'Confirmer sans trancher : elle part. Plusieurs : une question à la fois (« 1/2 »).', img: { arrivee: 'q2-d-arrivee' } },
  ],
};
const NOMS_VUE = { arrivee: 'arrivée', garder: 'garder', retirer: 'retirer', sombre: 'sombre' };
const L = (id) => id.toUpperCase();

function egaux(q) {
  const vus = new Map(); const EG = {};
  for (const o of q.options) for (const [v] of q.vues) {
    const n = o.img[v]; if (!n) continue;
    const h = md5[n];
    if (vus.has(h)) { const [oo, vv] = vus.get(h); EG[n] = vv === 'arrivee' ? `= ${L(oo)}` : `= ${L(oo)} · ${NOMS_VUE[vv]}`; }
    else vus.set(h, [o.id, v]);
  }
  return EG;
}
function section(q) {
  const EG = egaux(q);
  const vue = (o, [v, lab]) => {
    const n = o.img[v];
    if (!n) return `      <div class="vue">${o.vide?.[v] ? `<span>${lab}</span><p class="vide">${o.vide[v]}</p>` : ''}</div>`;
    const eg = EG[n]; const titre = `${q.titre.slice(3)} · ${L(o.id)} · ${lab.toLowerCase()}${eg ? ` (${eg})` : ''}`;
    return `      <div class="vue" data-vignette><span>${lab}</span><a class="ecran${eg ? ' egal' : ''}" href="img/${n}.png" data-agrandir data-titre="${titre}"><img src="img/${n}.png" width="780" height="1560" alt="${titre}">${eg ? `<b class="egal-b">${eg}</b>` : ''}</a></div>`;
  };
  const fig = (o) => `    <figure class="option${o.reco ? ' reco-col' : ''}" ${o.ref ? 'data-reference' : `data-variante="${o.id}"`}>
      <div class="tete"><p class="lettre">${L(o.id)} ${o.badge ?? ''}</p><p class="balises"><span class="fiches${o.ref ? ' f3' : ''}">${o.balise}</span>${o.ref ? '' : '<span class="aconst">à construire</span>'}</p><p>${o.phrase}</p>${o.geste ? `<p class="geste">${o.geste}</p>` : ''}</div>
${q.vues.map((v) => vue(o, v)).join('\n')}
    </figure>`;
  return `  <section class="question ${q.classe}" aria-labelledby="t-${q.cle}">
    <header><h2 id="t-${q.cle}">${q.titre}</h2><p class="mesure">${q.sous}</p></header>
    <div class="options" data-choix="${q.cle}">
${q.options.map(fig).join('\n')}
    </div>
${suite(q)}
  </section>`;
}

// La suite : les vues communes (après le geste, le sombre), une fois chacune ; « = A » quand l'image est celle de A au pixel (md5).
function suite(q) {
  const t = (n, lab, eg) => { const titre = `${q.titre.slice(3)} · ${lab}${eg ? ` (${eg})` : ''}`;
    return `      <div class="vue" data-vignette><span>${lab}</span><a class="ecran${eg ? ' egal' : ''}" href="img/${n}.png" data-agrandir data-titre="${titre}"><img src="img/${n}.png" width="780" height="1560" alt="${titre}">${eg ? `<b class="egal-b">${eg}</b>` : ''}</a></div>`; };
  for (const [n, , eg] of q.suite) if (eg && md5[n] !== md5[q.options[0].img.arrivee]) throw new Error(n + ' devait être = A');
  return `    ${q.suiteTitre ? `<p class="suite-t">${q.suiteTitre}</p>` : ''}<div class="options suite">
${q.suite.map(([n, lab, eg]) => t(n, lab, eg)).join('\n')}
    </div>`;
}
const css = fs.readFileSync(path.join(__dirname, 'page.css'), 'utf8');
const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Lecture lente : les lignes ajoutées et perdues · 02.11</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
${css}</style>
</head>
<body>
<div class="page">
  <header style="display:grid;gap:8px">
    <p class="sur-titre">L'Affinée · Dépense · lenteur D</p>
    <h1>Ta lenteur D : la ligne que la 3e lecture ajoute, et celle qu’elle ne lit plus · 02.11</h1>
    <div id="a-choisir">
      <p>Deux choix, une lettre chacun. Base : ta maquette D à l’arrivée de la 3e lecture, inchangée.</p>
      <p><span class="reco">Mon avis : 1 B, 2 B.</span> Le bleu dit déjà « la 3e lecture a changé ça » ; barrée et hors du total, l’imprimé reste juste tant que tu ne la gardes pas.</p>
      <p class="mesure">Limite : en 2 B, la rangée prend deux hauteurs tant que tu n’as pas tranché.</p>
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
fs.writeFileSync(out, html); console.log('écrit', out, '· « = X » :', JSON.stringify({ ...egaux(Q1), ...egaux(Q2) }));
