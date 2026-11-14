# s1a — la feuille « du … au » s'ouvre depuis le nom du mois
- **Idée** : toucher « novembre » (petit calendrier bleu à côté) ouvre une feuille : deux dates natives, l'effet lu avant de valider. **Chaleur** : froide.
- **Geste au doigt** : 1 toucher sur le nom du mois → feuille ; « du » et « au » à 44 px ouvrent le sélecteur du téléphone (input type=date sous une étiquette « dim. 15 nov. 2026 ») ; « Voir du 1 au 15 nov. » (44 px) valide ; « Tout novembre » ou × reviennent au mois.
- **Après** : la pilule teintée dit « 1 → 15 nov. » + × ; ‹ › s'effacent le temps de la plage (le mois reste à un toucher, ×).
- **Données** : du 1er au 15 nov., le loyer du 25 nov. sort : Fixes 68,00, payé 325,40 · à payer 0,00 · dépensé 296,80 (68 + 186,80 + 42 ; matériel à part, comme v6a). Retard 2025 gardé ; une pastille hachurée dit ce qui sort (« hors plage : loyer · 25 nov. · 400,00 ») ; IA : « Pourquoi le brassage pèse autant ? ».
- **Boosters** : feuille-plage (déclencher), apercu-effet (lire l'effet avant de valider : 15 jours · 5 opérations, à payer, dépensé, ce qui sort), pastille hachurée « hors plage » ; v6a : piles-basses, paye-sur-ligne, pastille-retard.
- **B3** repos = v6a + une icône de 14 px ; **B10** 0 type=number, dates natives ; **B13** cibles ≥ 24 px (mesuré : 0 sous 24), geste principal 44 px dans la feuille.
- **Base v6a** : rangées, piles, mots, « ✓ Payé » 24 px inchangés ; annexe « Après ✓ Payé » de v6a non reprise (état d'un autre geste). Barre du bas absolue dans le cadre au lieu de fixe (capture).
- **Ce qui casse** : un écran de plus (la feuille) ; la flèche ‹ › n'agit pas en plage, il faut × puis ‹ ›.
- **Captures** : s1a-repos.png, s1a-geste.png (feuille ouverte, cadre 844), s1a-apres.png — ouvertes.
