**Ce que je comprends.** Une maquette d'outil houblons (moteur de calcul + 8 écrans) doit remplacer l'ancien atelier V5.5 dans l'étape 3 d'un assistant de brassage. Le point dur est la lourdeur : 918 ko au démarrage contre 350 prévus, et un toucher qui met 782 ms contre 100 permis. Le brasseur exige que ce soit fluide avec « beaucoup de données ».

**Ce qui me perd.**
- « Beaucoup de données » désigne-t-il le catalogue (×10) ou les recettes et le stock de l'utilisateur ? Le texte dit lui-même qu'« un geste sur une recette ne dépend pas de la taille du catalogue ». Or la production ne compte que 12 variétés. Le ×10 est donc peut-être un problème imaginaire, alors que le poids et les 27 écoutes Firestore sont réels et mesurés.
- Le chiffre 782 ms n'est pas décomposé : calcul, chargement du code ou rendu ?
- Les options de la décision 1 se recoupent. (c) ressemble à un état déjà présent, puisque le brouillon est déjà écrit en local.

**Mots que je ne connais pas.** « Rail », « cran de dose », « léger/complet », « fiche », « Dryhopper », « hopV55… », « porte B », « le recouvrement stock × catalogue ».

**Ce que je ferais en premier.**
1. Mesurer d'abord où partent les 782 ms et les 918 ko. Je ne choisirais aucune architecture avant. Je soupçonne le chargement du code (772 ko) et les 27 écoutes plus que le moteur.
2. Poser un contrôle bloquant de poids et de latence sur l'app réelle (R8). Ce contrôle manque aujourd'hui, c'est le vrai premier geste.
3. Corriger R1 (le plantage sur un houblon inconnu) et R2 (tests hors de `npm test`). Ces deux points sont peu coûteux.
4. Découper le code par chargement à la demande, et ouvrir les écoutes par écran. Ce sont les gains les plus sûrs.
5. Choisir ensuite : moteur en worker seulement pour `substitutes` et `suggerer`, la 2(b). Garder un catalogue unique découpé, la 3(a). Mettre un drapeau V5.5, la 4(a), parce qu'il est réversible. Le portage ne supprime rien sans accord.

Le choix de variante reste au brasseur, et la suppression de V5.5 aussi.

Position : autre voie : mesurer et poser un contrôle de poids et de latence sur l'app d'abord, puis 1(a), 2(b), 3(a) et 4(a)
