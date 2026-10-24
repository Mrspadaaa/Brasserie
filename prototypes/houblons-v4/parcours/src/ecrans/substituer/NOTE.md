# Substituer = u4, son choix du 19.10 (voie r6-substituer, 24.10)

## Base

- Sa maquette choisie : `work/refonte-frontend/v4/ecran-1/fils11-substitution/u4/vue.html` et sa NOTE ; capture
  `fils11-substitution/captures/u4-vue-390.png`. Ses mots : « Substitution, ça serait plus du u4 » (19.10) ; registre
  « choisi u4 » (D34). La « porte » du conseil du 22.10 (colonnes, Nugget épinglé) est retirée : une carte mise à sa place.
- Ses états, joués : `work/refonte-frontend/v4/choix/etats/substituer.json` (15 états, 14 rejoués, croix voulue D109).

## Repris de u4, tel quel

- Tête : le nom, et à droite « remplaçants / à 60′ » (rendu dans la tête du cadre par un portail, le contenu défilant).
- La réponse : « Magnat et Yeoman, 99 sans inconnue. » ; « Altus, Trident, Zenia vont de 78 à 99. ».
- L'échelle 50–100 à paliers (partiel, proche, très proche), huit remplaçants (cinq du catalogue, trois du stock, le
  premier du stock qui suffit toujours compris) rangés par le pire cas ; point si tout est connu, plage hachurée sinon
  (inconnue ouverte de 0 à 100 aux poids du moteur) ; stock en icône (chariot, boîte pleine, basse, pointillée).
- Face à face, même IBU : bandes (usage, stock, dose ; plage de dose pour un houblon à acheter), α par source (lot,
  article ▽), arômes en barres face au style (attendues en gras, « Hors 16D », « ce n'est pas zéro », fiches lues),
  radar D3 (Nugget en contour), β, huiles, relation au style ; « Ajouter Magnat aux achats » ; « Lire ces scores » ouvert.

## Écarts voulus et retraits

- La croix (D109) ; « Annuler » à côté de « Remplacer › » en pied, avec le résumé « 46 g de Nugget → 62,5 g de Nelson
  Sauvin » (D120) : « Remplacer par Nelson Sauvin » de u4 devient ce pied (le nom passe au résumé, D98).
- L'usage en mot de l'app (« double usage », « amérisant », comme l'étape Houblons ; u4 : « double »), D90.
- La ligne d'annotation « u4 · Chaud : … » de la page de lot : une note d'auteur, pas un élément d'écran.
- La dose au demi-gramme à IBU égal (62,5 g ; u4 et le moteur : 62 g) : jusqu'à 0,65 IBU d'écart au gramme.

## Enrichi (plancher, L07)

- Toucher un remplaçant le met au face à face (à la place de l'autre comparé) et en fait le remplaçant ; toucher une
  bande le choisit ; appui long : sa fiche. u4 : « choix des deux comparés statique ».
- Les arômes cités en pictos dans chaque bande (L04, D74) ; « sans famille » au tableau (L14 : Nelson Sauvin 83 %).
- « À 60′, surtout l'amertume » sous les arômes ; « Ma bière avec chacun », au style ou en absolu (D75).
- « Lire ces scores » dit pourquoi la composante arôme n'est pas montrée seule à 60′ (elle vaut 100 pour un houblon
  qui perd six familles : elle ne mesure que l'arôme étranger, contexte amertume du moteur).

## Pour l'app

- `src/ui/hops/HopSubstitute.tsx`, route `{ view: 'hopSubstitute', recipeId, hopKey }` ; `donnees.ts` (plage, huit
  remplaçants, mesures par source) va à côté de `src/domain/hops/` ; « Ajouter aux achats » attend une liste d'achats.
