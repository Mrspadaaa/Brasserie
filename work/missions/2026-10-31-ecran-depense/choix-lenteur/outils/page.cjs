// Écrit choix-lenteur/index.html : cinq options (A référence), trois mini maquettes chacune (≈ 6 s, ≈ 15 s, lue).
// Forme reprise de choix-nom et choix-captures (retouches e-t8) : en-tête court, têtes courtes, balises, vignettes identiques
// au pixel grisées « = X » (md5 lu dans img/md5.json, écrit par gen.mjs). Sous chaque vue : le repère de temps et la même
// frise 0 → 40 s pour toutes les options (attente, provisoire, lue).
// Chiffres : voies/m-lenteur/RESULTAT.md, tableau « Les options » (14 pièces, 1 tirage). Usage : node page.cjs <index.html>
const fs = require('fs'); const path = require('path');
const out = process.argv[2];
const md5 = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'img', 'md5.json'), 'utf8'));
const ECHELLE = 40; // s
const VUES = [['06', 'Pendant la lecture', 6], ['15', 'Pendant la lecture', 15], ['lue', 'Lue', null]];
const F = (t) => `<b class="m">${t}</b>`;
// Reprise e-t11, majeur 1 : par tête, une ligne forte du temps (avant l'écran, avant Confirmer, au pire), puis une ligne discrète
// (justes, fausses sans drapeau, coût en centimes à une décimale ; l'exact est dans RESULTAT). Majeur 2 : B = B2, TVA comprise.
const OPT = [
  { id: 'a', ref: true, ecran: 18.5, final: 18.5, badge: '<span class="badge b-ref">aujourd’hui</span>', balise: 'attente', phrase: 'L’écran arrive après la 3.8 (12 pièces sur 14).',
    fort: `${F('18,5 s')} avant l’écran (37,7 au pire)`, discret: '154/165 justes · 10 fausses sans drapeau · 4,5 ct la pièce' },
  { id: 'b', ecran: 11.0, final: 11.0, balise: '3.8 si l’argent diffère', phrase: '8 pièces sur 14 : total, HT, TVA, montant de ligne, ligne sans vis-à-vis.',
    fort: `${F('11,0 s')} avant l’écran (34,3 au pire)`, discret: '156/165 justes · 7 fausses sans drapeau · 3,1 ct la pièce', note: 'à confirmer par 2 tirages de plus' },
  { id: 'c', ecran: 6.3, final: 6.3, balise: 'jamais de 3.8', phrase: 'Les deux lectures rapides seules.',
    fort: `${F('6,3 s')} avant l’écran (9,9 au pire)`, discret: '149/165 justes · <span class="rouge">22 fausses sans drapeau</span> · 2,1 ct la pièce', note: '34 rouges à remplir (10 aujourd’hui)' },
  { id: 'd', reco: true, ecran: 6.3, final: 18.5, badge: '<span class="badge b-reco">mon avis</span>', balise: 'écran tout de suite', phrase: 'La 3.8 vérifie derrière ; Confirmer l’attend.',
    fort: `${F('6,3 s')} avant l’écran (9,9 au pire) · ${F('18,5 s')} avant Confirmer (37,7 au pire)`, discret: '154/165 justes · 10 fausses sans drapeau · 4,5 ct la pièce', note: 'au 1er écran : 22 fausses sans drapeau' },
  { id: 'e', ecran: 6.3, final: 11.0, badge: '<span class="badge b-plus">B + D</span>', balise: 'écran tout de suite', phrase: 'L’écran de D, la 3.8 de B.',
    fort: `${F('6,3 s')} avant l’écran (9,9 au pire) · ${F('11,0 s')} avant Confirmer (34,3 au pire)`, discret: '156/165 justes · 7 fausses sans drapeau · 3,1 ct la pièce', note: 'à confirmer comme B' },
];
const L = (o) => o.id.toUpperCase();
const virg = (n) => String(n).replace('.', ',');
const pc = (s) => `${Math.min(100, (s / ECHELLE) * 100).toFixed(2)}%`;
// Le premier rendu identique, dans l'ordre de la page, est l'original ; les suivants portent « = X ».
const vus = new Map(); const EGAL = {};
for (const o of OPT) for (const [v] of VUES) {
  const n = `${o.id}-${v}`, h = md5[n];
  if (vus.has(h)) {
    const [oo, vv] = vus.get(h);
    const nomV = vv === 'lue' ? 'lue' : `${Number(vv)} s`;
    EGAL[n] = oo === o.id ? `= ${nomV}` : vv === v ? `= ${L({ id: oo })}` : `= ${L({ id: oo })} · ${nomV}`;
  } else vus.set(h, [o.id, v]);
}
const frise = (o, t) => {
  const prov = o.final > o.ecran;
  return `<div class="temps" aria-hidden="true"><span class="seg att" style="width:${pc(o.ecran)}"></span>${prov ? `<span class="seg prov" style="left:${pc(o.ecran)};width:${pc(o.final - o.ecran)}"></span>` : ''}`
    + `<span class="seg lue" style="left:${pc(o.final)};right:0"></span><i class="curseur" style="left:${pc(t)}"></i></div>`;
};
const vue = (o, [v, lab, t]) => {
  // Le nom de la vue suit l’état montré : pendant la lecture, provisoire (D, E : écran à 6,3 s médian, ≈ 6 s), déjà lue.
  const n = `${o.id}-${v}`, eg = EGAL[n], temps = t ?? o.final;
  const rep = t ? `≈ ${t} s` : `lue · ${virg(o.final)} s`;
  const titre = `${L(o)} · ${t ? `à ≈ ${t} s` : o.final > o.ecran ? `lue, à l’arrivée de la 3.8 (${virg(o.final)} s médian)` : `lue (${virg(o.final)} s médian)`}${eg ? ` (${eg})` : ''}`;
  return `      <div class="vue" data-vignette><span>${t === null ? (o.final > o.ecran ? "Lue · à l’arrivée de la 3.8" : lab) : t >= o.final ? "Déjà lue" : o.final > o.ecran && t >= o.ecran - 0.5 ? "Provisoire" : lab}</span><a class="ecran${eg ? ' egal' : ''}" href="img/${n}.png" data-agrandir data-titre="${titre}" title="cadre bleu : ce qui est neuf"><img src="img/${n}.png" width="780" height="1400" alt="${titre}">${eg ? `<b class="egal-b">${eg}</b>` : ''}</a>`
    + `<p class="repere"><b class="m">${rep}</b>${frise(o, temps)}</p></div>`;
};
const chiffres = (o) => `<p class="temps-fort">${o.fort}</p><p class="discret">${o.discret}</p>`;
const fig = (o) => `    <figure class="option${o.reco ? ' reco-col' : ''}" ${o.ref ? 'data-reference' : `data-variante="${o.id}"`}>
      <div class="tete"><p class="lettre">${L(o)} ${o.badge ?? ''}</p><p class="balises"><span class="fiches${o.ref ? ' f3' : ''}">${o.balise}</span>${o.ref ? '' : '<span class="aconst">à construire</span>'}</p><p>${o.phrase}</p>${chiffres(o)}${o.note ? `<p class="mesure">${o.note}</p>` : ''}</div>
${VUES.map((v) => vue(o, v)).join('\n')}
    </figure>`;
const css = fs.readFileSync(path.join(__dirname, 'page.css'), 'utf8');
const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>La lenteur de la lecture · 02.11</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
${css}</style>
</head>
<body>
<div class="page">
  <header style="display:grid;gap:8px">
    <p class="sur-titre">L'Affinée · Dépense · lenteur de la lecture</p>
    <h1>Après « Choisir le document », combien attends-tu ? · 02.11</h1>
    <div id="a-choisir">
      <p>Seul change le moment où la 3e lecture (3.8) compte, et ce que tu vois en l’attendant.</p>
      <p><span class="reco">Mon avis : D</span> — la dépense en 6 s, la justesse d’aujourd’hui ; mais Confirmer attend toujours la 3.8. Si B se confirme : E. Les cinq restent ouvertes.</p>
      <p class="mesure">14 pièces, 1 tirage : un indice. Temps des appels Gemini ; le transfert ajoute ≈ 4 s.</p>
      <p class="mesure">« 2 lents puis 1 lent » : mesuré le 01.11, ni plus juste, plus lent (23,7 s médian contre 17,6), plus cher (7,0 ct contre 4,4).</p>
      <p class="legende" aria-label="Légende de la frise"><span><i class="seg att"></i>attente</span><span><i class="seg prov"></i>provisoire</span><span><i class="seg lue"></i>lue</span><span class="m">0 → 40 s</span><span><i class="cadre"></i>cadre bleu : ce qui est neuf</span></p>
    </div>
  </header>

  <section data-choix="lenteur-lecture" aria-label="Cinq options" class="options">
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
fs.writeFileSync(out, html); console.log('écrit', out, '·', Object.keys(EGAL).length, 'vignettes « = X » :', JSON.stringify(EGAL));
