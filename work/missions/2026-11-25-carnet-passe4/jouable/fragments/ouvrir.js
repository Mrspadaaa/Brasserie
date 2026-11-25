function reRendre() { if (courant() && vue === 'org') rendreOrg(); rendreListe(); }
/* Noter depuis la liste : un nouveau carnet avec sa ligne, rangé par l'IA ; vide : un carnet neuf, ouvert sur Mes notes */
$('nouveau').addEventListener('click', function () {
  var t = $('noter').value.trim();
  if (!t) { var c = nouveauCarnet('', [''], null); etat.carnets.push(c); sauver(); geste('nouveau carnet', c.id); ouvrir(c.id); return; }
  var c2 = nouveauCarnet('', [t], null); etat.carnets.push(c2); $('noter').value = ''; sauver(); geste('noter depuis la liste', t); enFile(c2); rendreListe();
  toast('Noté · l’IA le range', 'Ouvrir', function () { ouvrir(c2.id); });
});
$('noter').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); $('nouveau').click(); } });
$('tab-carnets').addEventListener('click', function () { tuerToast(); etat.vueListe = 'arbre'; sauver(); rendreListe(); });
$('tab-afaire').addEventListener('click', function () { tuerToast(); etat.vueListe = 'afaire'; sauver(); geste('À faire', ''); rendreListe(); });

/* ====================================================================== ouvrir un carnet */
var vue = 'notes';
function ouvrir(cid) {
  tuerToast();
  fermerFeuille();
  etat.courant = cid; sauver();
  var c = courant();
  $('v-liste').classList.remove('on'); $('v-carnet').classList.add('on');
  $('titre').textContent = c.titre || '';
  $('doc').innerHTML = c.html || '<div><br></div>';
  nettoyerDoc(); normaliser();
  c.miens = c.miens || [];
  pour = null; pourEl.hidden = true; champ.value = ''; majAjout();
  /* sa vue de base : Organisé (25.11 soir) ; neuf ou jamais rangé : Mes notes, curseur à la fin */
  if (c.org || c.orgErreur || c.attente) basculer('org');
  else { basculer('notes', true); placerFin(); }
}
function fermer() {
  tuerToast();
  $('doc').blur(); $('titre').blur(); fermerFlottants(); fermerFeuille();
  var c = courant(); if (c && c.aide && !c.aide.enCours) c.aide = null;
  if (vue === 'notes') { garderTexte(); autoRanger(c); }
  etat.courant = null; sauver();
  $('v-carnet').classList.remove('on'); $('v-liste').classList.add('on'); $('app').style.setProperty('--tb', '120px');
  if (window.CSS && CSS.highlights) CSS.highlights.delete('lu');
  rendreListe();
}
$('b-retour').addEventListener('click', fermer);
$('k-menu').addEventListener('click', menuCarnet);
$('t-notes').addEventListener('click', function () { basculer('notes'); });
$('t-org').addEventListener('click', function () { if (vue === 'notes') { garderTexte(); autoRanger(courant()); } basculer('org'); });
var defilOrg = 0;
function basculer(v, sansFocus) {
  if (v !== vue) tuerToast();
  var c = courant(); fermerFlottants();
  if (vue === 'org') defilOrg = $('defil').scrollTop;
  vue = v;
  $('v-carnet').setAttribute('data-vue', v);
  $('t-notes').classList.toggle('on', v === 'notes'); $('t-org').classList.toggle('on', v === 'org');
  $('t-notes').setAttribute('aria-selected', String(v === 'notes')); $('t-org').setAttribute('aria-selected', String(v === 'org'));
  $('p-notes').hidden = v !== 'notes'; $('p-org').hidden = v !== 'org';
  $('outils').hidden = v !== 'notes'; $('pied-org').hidden = v !== 'org';
  $('tete-titre').textContent = titreCourt(c);
  if (v === 'org') {
    $('doc').blur(); $('titre').blur();
    if (c.orgNeuf) { c.orgNeuf = false; sauver(); }
    rendreOrg(); rendreIcs(); $('defil').scrollTop = 0;
  } else { $('action').hidden = true; rendreMeta(); calcLectures(); $('defil').scrollTop = 0; }
  $('app').style.setProperty('--tb', v === 'org' ? '186px' : '124px'); $('app').style.setProperty('--rb', v === 'org' ? '176px' : '118px');
  rendrePoint(); rendreOutils();
}
function rendrePoint() {
  var c = courant(); var p = $('point-org'); if (!c) return;
  var lit = estEnLecture(c);
  p.hidden = !(c.orgNeuf || c.attente || lit); p.className = c.attente ? 'att' : '';
  $('n-file').hidden = !c.attente;
}
function rendreMeta() {
  var c = courant(); var m = $('meta'); m.textContent = '';
  m.appendChild(h('span', null, dateLongue(c.maj)));
  m.appendChild(h('span', { class: 'sep' })); m.appendChild(h('span', null, NOM_ETAT[c.etat] || 'Noté'));
  m.appendChild(h('span', { class: 'sep' }));
  if (!navigator.onLine) m.appendChild(h('span', { class: 'att' }, 'hors ligne, gardé ici'));
  else if (c.org) m.appendChild(h('span', { class: 'ia' }, 'lu par l’IA ' + aLHeure(c.org.quand)));
  else m.appendChild(h('span', null, 'gardé ici'));
}
/* ⋯ : Ranger dans…, Changé par l'IA, Relire, Poser une question */
function menuCarnet() {
  var c = courant(); if (!c) return;
  var k = catDe(c), ligneM = function (e, titre, sous, f) {
    return h('button', { type: 'button', class: 'm4b-mi', onclick: function () { fermerFeuille(); f(); } }, h('span', { class: 'p4-mi-e' }, e), h('span', null, h('b', null, titre), sous ? h('small', null, sous) : null));
  };
  ouvrirFeuille([h('h2', null, emojiDe(c) + ' ' + titreCourt(c)),
    ligneM('🗂️', 'Ranger dans…', (k.nom === SANS ? 'pas encore rangé' : k.nom + (k.sous ? ' › ' + k.sous : '')), function () { feuilleRanger(c); }),
    c.org ? ligneM('✦', 'Changé par l’IA', 'une case par changement', feuilleChangements) : null,
    ligneM('↻', 'Relire avec l’IA', 'lit ta note, ne la change pas · ✦ 1 appel', function () { ranger(); if (vue === 'org') rendreOrg(); }),
    ligneM('💬', 'Poser une question', 'sur ce carnet · ✦ 1 appel', feuilleDemander)]);
}
