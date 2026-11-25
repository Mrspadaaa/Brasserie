/* passe 4 : ce que l'app a lu sur les pages de ses liens (tests/fixtures/c75/houblons-citra.json, articles[].valeurs, prixCentimes, dispo), tel quel.
   Le prix Brau lu (0,10 CHF, prixDes) est incohérent : dit « à relire », jamais pris pour un prix. */
EXEMPLES.forEach(function (x) {
  if (x.src === 'c75/houblons-citra.json') x.pages = [
    { ligne: 1, domaine: 'motlerhops.fr', vendeur: 'MotlerHops', lu: { 'Prix': '3,72 €', 'Dispo': 'en stock', 'Poids': '50 g, 250 g et 500 g', 'Taux d’acides alpha': '10 % - 15 %', 'Origine': 'États-Unis' } },
    { ligne: 2, domaine: 'brauundrauchshop.ch', vendeur: 'Brau- und Rauchshop', lu: { 'Prix': '0,10 CHF, incohérent : à relire', 'Citra': '13,6 %', 'Origine': 'USA', 'Arômes': 'citron vert, mangue, fruits tropicaux', 'Particulièrement adapté pour': 'amerikanische Ales und IPA’s' } }
  ];
});
/* les 5 cas fictifs du pilote (work/missions/2026-11-25-carnet-document/visuel/cas-fictifs.json), lignes telles quelles */
[['Chaudière en panne jour de brassage', ['Chaudière s\'arrête toute seule, voyant rouge', 'Brassage IPA prévu demain 7h', 'Reset marche 10 min puis recoupe', 'Technicien ? numéro sur l\'autocollant', 'Plan B : décaler au jeudi ?']],
 ['Idée bière au sureau', ['Sureau en fleur fin mai, cueillir au bord de la forêt', 'Base blonde légère 4.5%', 'Infuser les fleurs en fin d\'ébullition ou à froid ?', 'Goûter celle de la brasserie voisine']],
 ['600 bouteilles 33 cl', ['Verallia : 0.42/bt, palette de 1200 min', 'Fournisseur B : 0.55/bt par 600, livraison 80 CHF', 'Occasion sur annonce : 0.20/bt, à laver, 400 seulement', 'Besoin avant le 15 du mois']],
 ['Bar du Centre veut nos bières', ['Rencontré le gérant samedi, veut 2 fûts par mois', 'Il demande un prix pro', 'Rappeler lundi', 'Vérifier si on a assez de fûts 20 L']],
 ['Levure récoltée à tester', ['Levure récoltée du fermenteur 2 (US-05), 3e génération', 'Gardée au frigo depuis 12 jours', 'Faire un starter avant d\'ensemencer', 'Odeur ok, pas de mousse bizarre']]
].forEach(function (f, i) {
  EXEMPLES.push({ src: 'fictif/' + (i + 1), titre: 'ZZ TEST — ' + f[0], lignes: f[1], cree: '2026-11-25T18:30:00.000Z', maj: '2026-11-25T18:3' + i + ':00.000Z', etat: 'note', etatPar: null, genre: null });
});
function pagesDe(c) {
  return (c && c.pages || []).map(function (p) {
    return 'Ligne ' + p.ligne + ' · ' + p.domaine + ' (' + p.vendeur + ') : ' + Object.keys(p.lu).map(function (k) { return k + ' = ' + p.lu[k]; }).join(' ; ');
  });
}
