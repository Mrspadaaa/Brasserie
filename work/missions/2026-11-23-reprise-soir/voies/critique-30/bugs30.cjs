// Verse le test en ligne du tour 30 au registre : état des T28 rejoués, lignes T30 neuves. Lancé une fois depuis la racine du dépôt.
const fs = require('fs');
const F = 'work/missions/BUGS.md';
const C = 'work/missions/2026-11-23-reprise-soir/voies/critique-30/cap/';
let L = fs.readFileSync(F, 'utf8').split('\n');
if (L.some((l) => l.startsWith('| T30-1 |'))) { console.log('déjà versé'); process.exit(0); }
const APP = '96f65ee02', SRV = '0a9d31901';
const maj = {
  'T28-1': ['corrigé — en ligne tour 30 (index-KxF0Bcaa.js) : landi rechargé pendant la lecture, rangé dans ZZ (5 articles), Armoire de rangement malte sans article', APP, 'P-L6.png, ' + C + 'Z-armoire.png'],
  'T28-2': ['en cours — en ligne tour 30 : la carte de fin dit « dans « ZZ TEST — tour 30 » » et l’article mène à sa fiche dans ZZ ; reste la carte entière dans un autre carnet au lieu de la barre repliée (T30-1, T30-3)', '', 'P-L6b.png, ' + C + 'P-L4.png'],
  'T28-3': ['en cours — en ligne tour 30 : rien n’est rangé, compte inchangé ; reste « Compléter » sans formulaire (T30-2)', '', 'P-L5c.png'],
  'T28-4': ['corrigé — en ligne tour 30 : « Toujours introuvable », étape « Relu par une IA plus forte : le lien ne mène toujours à rien », bouton retiré', APP, 'P-L5.png'],
  'T28-5': ['corrigé — en ligne tour 30 : « la page n’existe plus (erreur 404) »', SRV, 'P-L5.png'],
  'T28-6': ['ouvert — présent (en ligne tour 30 : Mosaic 7,25 CHF classé 1er devant Citra 72,50 CHF, sans quantité dans la liste ni dans l’offre de Mosaic ; Citra dit « 1 kg · 72,50 CHF/kg »)', '', 'P-L23.png, ' + C + 'P-L23f.png'],
  'T28-7': ['corrigé — en ligne tour 30 : Poids 82 kg, aucune mention « Non publié »', SRV, 'P-L8f.png'],
  'T28-8': ['corrigé — en ligne tour 30 : Hauteur 180 cm, Largeur 160 cm, Profondeur 60 cm, Matériau Acier, MDF', SRV, 'P-L6b.png'],
  'T28-9': ['corrigé — en ligne tour 30 : « prix 913,90 CHF · hors taxe · port gratuit », plus de schema.org ni JSON-LD ; restes T30-9, T30-11, T30-12', SRV, 'P-L8.png, ' + C + 'P-L23.png'],
  'T28-10': ['corrigé — en ligne tour 30 : barre « 5 s » à 5 s, « lu en 7 s » pour 7 s vécues', APP, 'P-L1-fin.png'],
  'T28-11': ['corrigé — en ligne tour 30 : compte inchangé pendant la lecture, lien mort resté à 4', APP, 'P-L5.png'],
  'T28-12': ['en cours — en ligne tour 30 : Mosaic et Brew Monk en français ; reste « Height without extension legs » (T30-13)', '', 'P-L4f.png, ' + C + 'P-L23f.png'],
  'T28-13': ['en cours — en ligne tour 30 : galaxus, Mosaic, gastro-held en français, virgule décimale ; reste « Catégorie : Hopfenpellets Typ 90 » (T30-14)', '', 'P-L23f.png, ' + C + 'P-L8f.png'],
  'T28-14': ['corrigé — en ligne tour 30 : Alpha 11,4 %, Récolte 2025, Huiles totales 0,8 ml/100 g en tête', SRV, 'P-L23f.png'],
  'T28-15': ['corrigé — en ligne tour 30 : sur la liste des Carnets, « Lu · 6 s · dans « ZZ TEST — tour 30 » »', APP, 'P-L8.png'],
  'T28-17': ['corrigé — en ligne tour 30 : « Déjà dans ce carnet : rien de plus rangé » à 0,5 s, sans relecture', APP, 'P-L9.png'],
};
let n = 0;
L = L.map((l) => {
  const m = l.match(/^\| (T28-\d+) \|/);
  if (!m || !maj[m[1]]) return l;
  const c = l.split('|');
  const [etat, commit, cap] = maj[m[1]];
  c[6] = ' ' + etat + ' ';
  c[7] = ' ' + (commit || ' ') + ' ';
  c[8] = c[8].replace(/\s+$/, '') + ' ; tour 30 en ligne 23.11 : capture ' + C + cap + ' ';
  n++;
  return c.join('|');
});
const E = 'Stocks › Matériel › Carnets › carnet « ZZ TEST — tour 30 » ouvert (390 px, en ligne index-KxF0Bcaa.js)';
const O = 'tour 30, test d’écran en ligne 23.11 ; capture ' + C;
const T = [
  ['Liste des Carnets, puis carnet « Chambre froide » (390 px, en ligne index-KxF0Bcaa.js)', 'Coller brouwland (puis gastro-held) dans ZZ, quitter vers Carnets pendant la lecture, ouvrir un autre carnet → observé : aucune barre repliée ; la carte de lecture entière reste en tête de la liste des Carnets puis du carnet ouvert ; attendu : barre repliée de v01-repliee, plus compacte, en bas (son choix D448)', 'B', 'P-L4.png, ' + C + 'P-L8.png'],
  [E, 'Lien mort brewtools, toucher « Compléter » sur la carte d’échec → observé : toast « Article introuvable. », la carte disparaît, aucun formulaire ; attendu : saisie de l’article (nom, prix) comme base-echec', 'B', 'P-L5c.png'],
  ['Carnets « Armoire de rangement malte » et « Chambre froide » (390 px, en ligne index-KxF0Bcaa.js)', 'Lien lu dans ZZ, ouvrir un autre carnet → observé : la carte de fin de ZZ en tête du carnet ouvert, son titre caché, « dans « ZZ TEST… » » tronqué ; attendu : fin en bas, comme v01-fin, nom du carnet lisible', 'm', 'P-L6b.png, ' + C + 'P-L4.png'],
  [E, 'Carnet avec un article en EUR (Brew Monk ≈147 CHF) → observé : le rang suit l’ordre d’ajout (Kibernetik 302 CHF 1er), la colonne change seule (Poids, Hauteur, Largeur) ; sans lui, le rang suit le prix ; attendu : rang au prix en CHF, critère dit', 'm', 'P-L10.png, ' + C + 'P-L7m.png'],
  ['Liste des Carnets, puis carnet ZZ (390 px, en ligne index-KxF0Bcaa.js)', 'Toucher « C’est le bon » sur « Prix · douteux » de la carte de fin (liste des Carnets), puis ouvrir ZZ → observé : la même question « Prix · douteux » revient dans le carnet ; attendu : réponse gardée', 'm', 'L9-retour.png'],
  [E, 'Liste comparée, colonne Hauteur → observé : « 2010 » (mm, sans unité) à côté de « 180 cm » et « 143,5 cm » ; attendu : même unité, unité dite', 'm', 'P-L9.png'],
  ['Stocks › Matériel, en-tête (390 px, en ligne index-KxF0Bcaa.js)', 'Après les lectures (21:00 à 21:10) → observé : toast « Enregistrement sur le serveur… » sur les onglets Articles et Recompter pendant plus de 10 min, encore là après la suppression du carnet ; attendu : toast qui s’efface, ou dire ce qui n’est pas enregistré', 'm', 'P-Z.png'],
  [E, 'Ligne d’article galaxus dans la liste → observé : 8 caractéristiques déroulées sur 8 lignes, puis « lu sur la page : nom, prix, photo, Volume… » qui les répète ; attendu : ligne dense (« pas assez dense »)', 'm', 'P-L1-fin.png'],
  [E, 'Étapes galaxus → observé : « Caractéristiques : 8 mesures : 8 ailleurs dans la page » ; attendu : dit en brasseur (« 8 caractéristiques »)', 'D', 'P-L1-debut.png'],
  [E, 'Étapes galaxus → observé : « Lecture · 6 sur 6 », toutes « trouvé », pendant 5 s avant « Lu » ; attendu : l’étape en cours visible jusqu’au rangement', 'D', 'P-L1-debut.png'],
  [E, 'Étapes sios Citra → observé : « Lecture IA : lite ; rien de plus » ; attendu : sans nom de modèle (« rien de plus à lire »)', 'D', 'P-L23.png'],
  [E, 'Coller sios Citra → observé : toast « 1er sur 2 · prix 72,5 CHF » ; attendu : 72,50 CHF', 'D', 'P-L23.png'],
  [E, 'Fiche brouwland Brew Monk → observé : libellé « Height without extension legs » ; attendu : « Hauteur sans pieds d’extension »', 'D', 'P-L4f.png'],
  [E, 'Fiche sios Citra → observé : « Catégorie : Hopfenpellets Typ 90 » ; attendu : « Pellets type 90 »', 'D', 'P-L23f.png'],
];
const nouvelles = T.map((t, i) => '| T30-' + (i + 1) + ' | Test en ligne, tour 30 | ' + t[0] + ' | ' + t[1] + ' | ' + t[2] + ' | ouvert — présent |   | ' + O + t[3] + ' |');
while (L.length && L[L.length - 1] === '') L.pop();
L.push(...nouvelles, '');
fs.writeFileSync(F, L.join('\n'));
console.log('T28 mis à jour', n, 'T30 ajoutés', nouvelles.length);
