# LR3-NOTE-1 — le geste à faire en ligne (donnée réelle : rien n'est écrit par la voie)

La vente « 10 × Bière 75 cl — Restaurant du Lac » à 5 695,00 CHF (10.11) est une donnée réelle : la voie ne la lit ni ne la corrige.
Le code ne produit plus ce prix : la tuile 75 cl refuse un tarif hors plage (T3B-13) et la caisse alerte au-delà de 10 fois le tarif (cette voie).

Pour le brasseur, après le prochain déploiement, en lecture d'abord :
1. Finances › Opérations › Ventes : repérer la ligne du 10.11. Ouvrir la pièce : la ligne dit-elle « 10 × » à 569,50 ou « 1 × » à 5 695 ?
2. Si c'était un test d'un autre : rien à faire (la ligne reste, elle est connue).
3. Si c'est une saisie fausse : l'annuler par la contre-écriture de l'écran (avoir ou annulation, jamais une suppression), puis ressaisir
   la vente avec le bon prix (la tuile « 75 cl » est « à corriger » tant que le tarif Pale Ale 75 cl reste à 569,50 : le corriger dans Clients › Tarifs).
4. Le tarif 75 cl à 569,50 CHF (759 CHF le litre) est lui aussi à corriger dans Clients › Tarifs : c'est lui qui fabriquait la tuile fausse.

Aucun script n'écrit : la correction passe par les écrans de l'app, sous la main du brasseur.
