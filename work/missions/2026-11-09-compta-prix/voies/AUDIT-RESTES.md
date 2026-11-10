# Restes pour l'audit 1:1 (pilote, 10.11)

## Opérations (vo, cote-390.png)
- Annuler : v6b ne le montre qu'après le geste « ✓ Payé » (état « Après ») ; l'app le met sur toute ligne payée aujourd'hui, à la place de « + pièce », et coupe nom et pastille (« Restaur… »). Faire comme v6b : « + pièce » pour une ligne sans pièce ; Annuler seulement juste après le geste.
- Palette : piles et liserés en jetons du thème, plus foncés que v6b (Ventes vert vif, Fixes violet, Brassage or, Nettoyage cyan, Matériel bleu) ; cercles d'en-tête pleins dans v6b.
- Puce IA : v6b pose une question calculée (« ✦ Pourquoi les charges fixes pèsent autant ? ») ; l'app dit « Vérifier mes opérations » (FinanceAssistant.tsx).
- En-têtes collants de v6b non repris (à juger).

## Synthèse (sp)
- La plage du/au vit dans FinanceOverview : perdue en quittant l'onglet ; à remonter dans FinancesTab.tsx après la voie sd (sp/RESULTAT.md § « À brancher »).

## Prix (pc)
- Volume annuel : la feuille du solde doit s'ouvrir avec « Paramètres des prévisions et des brassins » déplié quand on vient de ce renvoi (FinanceForms.tsx, après sd).
- Litres d'un brassin conditionné : pas de focus direct sur « Saisir le volume conditionné » (BatchDetailSheet n'a pas de prop).

## Clôture étape 3 (ci)
- Brancher `nature={closingOpts.nature}` dans FinancesTab.tsx l.~120 (après sd), puis captures de la feuille ouverte (ci/RESULTAT.md, DEMANDE EXECUTANT).
- 390 : « Pilsner Mal… +6 » coupé.
- Cases « ? » sans hachures visibles (g6 : hachures jaunes nettes) ; Emballages sans petite ligne (g6 : « bouteilles, capsules ») ; petite ligne « Pilsner M… +6 aujourd'hui » : viser « Pilsner 10 kg +6 », « aujourd'hui » à retirer si ça coupe.

## Prévisions (pj)
- À 390 sans solde, quatre bandeaux pointillés s'empilent (solde, tendance, rien de prévu, projets) : chacun juste, mais lourd ; à regrouper en une ligne-tâche dépliable si le brasseur le trouve trop chargé.
