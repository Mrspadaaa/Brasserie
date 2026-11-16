# Voie p4 — Tests anciens cassés par le port (p1, p2, p3)

- Mission : 2026-11-14-brassins · Agent : auteur · Modèle : sonnet · Niveau : code · Plafond : 60 tours · Dépend de : p1, p2, p3 · Décideur : pilote

## Objectif
Le port 1:1 de ses choix (« e1a », « e2a », « e4c », « e7a », « e11a — e10c », 15.11) a changé la fiche, le bilan, la coque et Volumes.
Les 13 fichiers de `work/missions/2026-11-14-brassins/voies/p4/echecs.txt` passent sur HEAD et échouent maintenant (les autres échecs de la suite existent déjà sur HEAD,
hors voie). Pour chacun : soit le test vérifie une interface que sa maquette a retirée ou renommée (règle n° 1 : la maquette gagne) → réécrire
l'attente sur la nouvelle interface en gardant l'intention métier (même règle vérifiée) ; soit c'est une vraie régression (donnée perdue,
geste perdu, calcul faux, hors ligne) → corriger le code du port. Jamais supprimer un test ni affaiblir une règle métier.

## État de l'art
Aucun algorithme : adaptation de tests (Testing Library : rôles et libellés) et correctifs ponctuels.

## Entrées
- Liste : `work/missions/2026-11-14-brassins/voies/p4/echecs.txt`. Ce que chaque port a changé : `work/missions/2026-11-14-brassins/voies/p1/RESULTAT.md`, `p2/RESULTAT.md`, `p3/RESULTAT.md` et leurs `INVENTAIRE.md`.
- `git diff HEAD -- src` par fichier utile (sorties filtrées).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- Les 13 fichiers de `echecs.txt` ; les fichiers `src/` déjà modifiés par p1, p2, p3 (`git status --short src`) ; `work/missions/2026-11-14-brassins/voies/p4/`.
- Jamais : `firestore.rules`, `firebase.json`, `firestore.indexes.json`, `.firebaserc`, `functions/.env`, `.codex/hooks.json`. Ni commit, ni stash, ni déploiement.

## Consignes
- `RESULTAT.md` : une ligne par fichier : « test adapté (ce que la maquette a changé) » ou « régression corrigée (quoi) ».
- `tests/unit/depense/loupe.test.tsx` est hors du port : le rejouer seul ; s'il passe seul, l'écrire « instable sous charge », sans y toucher.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Gemini jamais réel dans un test ; hors ligne préservé ; saisie au curseur, jamais `type="number"`.

## Critères
`work/missions/2026-11-14-brassins/voies/p4/GATES.md`, depuis la racine du dépôt. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil.
- La ligne « Tests » écrite dans un fichier : `npx vitest run tests/integration/bStockVolumesNoms.test.tsx tests/integration/batchAm4Am5.test.tsx tests/integration/batchFollowUp.test.tsx tests/integration/batchPackagingVolume.test.tsx tests/integration/batchStockFollowUp.test.tsx tests/integration/brewCreationBudgetContinuity.test.tsx tests/integration/compactProduction.test.tsx tests/integration/dashboardNavigation.test.tsx tests/integration/liveDataViews.test.tsx tests/integration/productionCatalog.test.tsx tests/integration/productionVolumeBornes.test.tsx tests/integration/yeastPitchingExecution.test.tsx tests/unit/depense/loupe.test.tsx  tests/unit/port- --reporter=dot > work/missions/2026-11-14-brassins/voies/p4/tests.txt`.
Réponse finale au pilote : une ligne.
