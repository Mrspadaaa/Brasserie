# Tests candidats au retrait (D409) — à valider par le brasseur

Rien n'est supprimé. Mesures : suite entière Vitest en copie propre de port-carnet (HEAD 9c9738515, 21.11, 1 580 s, 1 741 fichiers).
Les durées sont celles du fichier entier, sous charge (workers en parallèle). « Double un parcours au doigt » : non vérifié fichier par fichier, marqué « à confirmer ».

| Fichier | Durée | Ce qu'il vérifie | Double un parcours au doigt ? |
|---|---|---|---|
| tests/integration/hopV55PageAssistedAdvice.test.tsx | 359 s (11 tests) | Page V5.5 : lancement et archive du compagnon assisté | à confirmer (parcours Houblons au doigt probable) |
| tests/integration/hopV55PageQualifiedAdviceFullCatalogue.test.tsx | 178 s (3 tests) | adaptateur mémoire de transaction : journal et isolement, sur tout le catalogue | non : règle de données, pas de geste |
| tests/integration/YeastRecipeChoice.test.tsx | 166 s (58 tests) | résumé documentaire de la levure fidèle aux états, choix de levure d'une recette | à confirmer (parcours Recette, levure) |
| tests/integration/hopV55SemanticCompanion39.test.tsx | 139 s (18 tests) | #39 compagnon Request3/V6 sur l'archive V4 de la vraie Page | à confirmer |
| tests/integration/recipeAiWorkflow.test.tsx | 104 s (34 tests) | IA dans les étapes d'une recette enregistrée (hypothèse d'atténuation, source concordante, levure) ; 3 tests dépassent 15 s sous charge et passent seuls | à confirmer (parcours Recette) |
| tests/unit/hopIndexV4/apportCDefaut.test.ts | 103 s (14 tests) | D167 : option c par défaut sur la 21C, « plus d'… » | non : règle de calcul |
| tests/integration/hopV55PageQualifiedAdviceStudy.test.tsx | 98 s (4 tests) | Page V5.5 : étude qualifiée Q09 avec portées V3 | à confirmer |
| tests/integration/monkey.test.tsx | 91 s (2 tests) | monkey test de l'atelier de l'eau | à confirmer (parcours Eau au doigt probable) |
| tests/unit/rejeu-649b/virgule-transversale.test.ts | 18 s (1 test lent sur 8) | lit les 1 400 fichiers de src/ et refuse tout `{nombre} unité` sans virgule | oui, double `scripts/agents/controle-virgule.mjs` (même contrôle, lancé aussi à la main) ; délai du test porté à 120 s, non retiré |

Les durées de la suite entière viennent de la charge de la machine : trois « Timeout calling onTaskUpdate » (workers) apparaissent à chaque passage complet.
