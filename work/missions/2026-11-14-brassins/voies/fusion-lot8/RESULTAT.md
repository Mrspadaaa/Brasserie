OK — tag en-ligne/2026-11-15-atelier-lot8 fusionné (commit 87f03403) : tsc, build, 14 714 tests verts, aucun échec neuf.

# Fusion en-ligne/2026-11-15-atelier-lot8

Commit de fusion : `87f03403` (parents `c6cbf480` et `8919bf3f`, le tag). Message terminé par « Co-Authored-By: Claude Opus 5.5 ».

## Décisions du pilote, appliquées

1. Onglet « Argent » : `ChaineArgent` s'ouvre dans une feuille par le bouton Budget (`BudgetLien`) ; les trois rubriques de la maquette e1a restent.
2. V5.5 : on suit leur commit d4523967. Retirés : l'entrée « Outils houblons » du menu e11a (`src/ui/FloatingActions.tsx`, import `Hop` et `OUTILS_HOUBLONS_EVENT` compris), le passage de `onOpenHopV55` dans `src/App.tsx`, la prop et l'écouteur de l'événement dans `ProductionTab`. Les modules et la route `hopV55` restent (`OUTILS_HOUBLONS_EVENT` reste exporté par `fabActions.ts`, sans lecteur).
3. `volumeAuRepos` supprimé : le volume de départ est celui de la recette (`volumeL ?? 30`), pour d1b et l'alerte AM-47. `recetteAdaptee` (calcul) gardé.
4. Tests `liveDataViews` et `dashboardNavigation` : attente de la fiche chargée paresseusement (`findByRole`).

## Corrections faites après la résolution des conflits

- `QuickActionModal.tsx` : un `</div>` en trop dans l'en-tête (le tsc ne passait pas) ; le titre `h2` suit l'icône sans enveloppe hors Brassins (même en-tête que la caisse seule, test `caisseVente` 8) ; « Modifier la recette › » rétabli dans l'avertissement d'adoption (`BrewLaunchAdoption`, événement `affinee:modifier-recette`).
- `ProductionTab.tsx` : import `ViewNavigation` perdu, remis.
- `recettesModel.ts` : `besoinsDe` reçoit un 4e argument optionnel `recipes` (la signature de `compareRecipeWithStock` a changé chez eux).
- Tests adaptés à notre écran : `port-p6-bilan-plus` (menu sans « Outils houblons », « Vendre »), `port-p7-phrase-rebrasser` (fiche paresseuse), `brewLegacyInstallationLaunch` (« Brasser » avant « Modifier la recette »), `contactConversionUnique` (message par `onSuccessMessage`, comme sur HEAD), `impotBiereLien` et `litresFocus` (bouton Budget au lieu de l'onglet Argent ; brassin en garde pour la saisie de densité).

## Preuves

- `git grep -n "^<<<<<<<"` : vide.
- tsc hors `functions/` : aucune erreur.
- Base du tag (worktree `lot8-base`, retiré ensuite) : 14 413 verts, 17 échecs (63 fichiers en échec).
- Ici, vitest complet : 14 714 verts, 17 échecs (62 fichiers) ; comparaison fichier par fichier : 0 échec neuf par rapport à la base du tag et à `fails-head.txt` (un seul fichier hors base, `depense/p2-retirees-serveur`, déjà en échec sur HEAD). Un premier passage avait 7 fichiers neufs en échec, corrigés ci-dessus puis rejoués.
- `npx vite build` : OK.
- `npx vitest run port- --reporter=dot` : 24 fichiers, 265 tests verts.

## Doutes et limites

- `besoinsDe` reçoit `recipes = []` depuis la feuille Brasser, Créer et Recettes : le manque « ailleurs » (R1 : autres recettes et brassins planifiés) n'y est pas compté comme dans Stocks. Pour le brancher, il faut passer la liste des recettes à ces trois appels.
- L'Atelier suit notre e9na : le Carnet ks4 de leur lot (`src/ui/atelier/*`) n'est plus relié à l'écran. Leur Brassage `BrewLaunchPanel` n'est plus affiché sur la feuille de lancement (nos d1b et c2a).
- Aucune capture : la fusion n'a pas été revue en rendu (Chrome) ; à jouer avant tout déploiement.

CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
