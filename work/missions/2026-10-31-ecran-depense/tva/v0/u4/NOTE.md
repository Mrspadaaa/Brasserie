# u4 — Le ticket de l'année (chaude)

- **Chaleur** : chaude. Forme libre : la TVA de l'année imprimée comme un ticket de caisse, avec les codes de taux A / B des
  tickets suisses, un tampon « Non récupérable » et un coupon à détacher.
- **Idée en une phrase** : dans Opérations, « Journal · Ticket TVA » ; un ticket déchiré posé sur le comptoir, une ligne par
  fournisseur avec ses points de conduite, le total en bande noire, et « Me la faire rembourser ? » en coupon : détaché, il
  devient un décompte TVA fictif aux chiffres du formulaire AFC (200 ventes, 303 TVA due, 400 impôt préalable).
- **Axes** : place (Opérations, là où vivent les pièces) ; unité (fournisseur, pas poste ni mois) ; langage (celui des
  tickets et du décompte AFC, que le brasseur connaît) ; remboursement en décompte rempli plutôt qu'en phrase.
- **Repris de la base** : en-tête, onglets, titre « Mes opérations » et son bouton de filtres, bascule ajoutée à droite comme
  dans Synthèse, rangée Compagnon brasseur, barre du bas et +. Mono pour les montants seulement (les mots du ticket restent
  en Source Sans : un mot en mono est une faute, DESIGN.md).
- **Données (fixtures)** : mêmes que u1 ; Matériel 442,69 = Inox-Pro 286,23 + divers 156,46 (dont import 47,20). Taux A
  2,6 % 124,48, B 8,1 % 745,41. Décompte : 31 240,00 ; 2 340,83 ; −869,89 ; à verser 1 470,94 ; gagnant sous 11 609 CHF.
- **États** : `annee` ; `inconnues` (code « ? » en pointillé, « 11,99 + ? », « au plus 52,45 / 40,46 », total « 776,98 + ? ») ;
  `douteuse` (ligne Vetropack surlignée au marqueur, « 197,82 ? », choix sur place, total « 869,89 ou 901,98 ») ;
  `etrangere` (ticket allemand agrafé de travers : MwSt 38,00 EUR, pas sur le ticket ; import suisse noté sous Matériel) ;
  `vide` (ticket blanc, total « — ») ; `si` (décompte au-dessus du ticket) ; `horsligne` (bandeau, « imprimé sur ce
  téléphone », 2 photos « ? », total « 869,89 + ? »). À 1280 : ticket à gauche, décompte toujours visible à droite.
- **Boosters** : [x] codes de taux A / B en pastilles [x] points de conduite (lecture ligne à ligne) [x] barres de taux
  [x] total en bande [x] tampon d'état [x] coupon détachable (geste = question) [x] décompte AFC [x] surligneur pour le doute
  [x] ticket agrafé pour l'étranger.
- **Écart à la baseline** : le comptoir gris (`#D4D4D4`) et le ticket à bords déchirés sont des ajouts de forme ; la raison :
  le ticket ne se lit comme un ticket que posé sur une surface. Contraste du texte sur le comptoir vérifié (5,03:1).
