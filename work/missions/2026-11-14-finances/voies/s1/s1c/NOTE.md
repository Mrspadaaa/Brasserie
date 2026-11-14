# s1c — une rangée fine « du … au » repliée sous la pilule, dépliée par un chevron
- **Idée** : un chevron ⌄ à côté du mois déplie une rangée de deux dates dans la carte du graphe ; une fois posées, elles restent visibles. **Chaleur** : tiède.
- **Geste au doigt** : toucher ⌄ → rangée « du [dim. 1 nov.] au [lun. 30 nov.] » (champs 32 px, sélecteur natif) ; toucher « au » → 15 ; × dans la rangée revient au mois et la replie.
- **Après** : rangée teintée bleu, la date changée cerclée ; la pilule « novembre » passe en gris (le mois n'est plus entier) ; ‹ › mènent au mois voisin entier (lecture prudente).
- **Données** : 1-15 nov. : Fixes 68,00, payé 325,40 · à payer 0,00 · dépensé 296,80 ; loyer « hors plage » en pastille ; retard 2025 gardé.
- **Boosters** : rangee-plage (chevron, signifiant ⌄ de l'app, B12), edition-sur-place (les deux dates restent éditables sur place) ; v6a : piles-basses, paye-sur-ligne, pastille-retard.
- **B3** repos = v6a + un chevron de 28 px ; après : +40 px de hauteur dans la carte. **B13** champs 32 px (DESIGN.md), × 28 px. **B10** 0 type=number.
- **Ce qui casse** : la carte grandit de 40 px tant que la plage est posée ; deux chevrons proches au repos (⌄ de la rangée, ‹ › du mois).
- **Captures** : s1c-repos.png, s1c-geste.png (rangée dépliée, mois entier), s1c-apres.png — ouvertes.
