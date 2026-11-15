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

## Atelier après fusion

**Constat.** `npx vite build` passait, mais `node scripts/check-build-flags.mjs dist` refusait : `VITE_RANGER_NOTE_IA` introuvable. Côté tag (ks4, commit bfce9dcc), `CreativeLabTab.tsx` importait `modeRangerNote` et rendait `<NoteCarnet mode={modeRangerNote()} tarifs bieres …>`. La fusion a gardé notre `CreativeLabTab` (Atelier e9na, `Ecrire` + tiroirs) : plus aucun module du bundle ne lisait le drapeau, et le rangement par l'IA ne se déclenchait plus.

**Ce qui était perdu (tag ↔ HEAD).**
- Le rangement de la note par le modèle (`rangerNote`, niveau Rapide, « + » vers le modèle plus précis, une fois par note) : plus aucun appel ; les fichiers `NoteCarnet.tsx`, `NoteAiguillage.tsx`, `rangerNoteSimule.ts`, `domain/rangerNote.ts`, `config/rangerNoteIA.ts` étaient arrivés, mais rien ne les rendait.
- Les tarifs (prix d'une livraison deviné) et les bières connues passés au rangement.
- L'étiquette « exemple » de la réponse simulée du banc.
- La structure ks4 elle-même (rangée Matériel · Carnet · Tarifs, fil de messages, compositeur) : perdue exprès, remplacée par e9na.

**Règle appliquée.** La structure d'écran choisie la plus récente gagne : e9na (Atelier) et e3gb (Carnet de Brassins), choisies le 15.11 sur « six questions » (SPEC-BRASSEUR.md, ligne 1779 : « Carnet : e3gb · … · Atelier : e9na »). Leur fonction est rebranchée dans cet écran, pas à côté. La fonction est fondée sur le mot du même jour (SPEC, ligne 1704) : « utiliser l'ia pas chère pour remettre en place des note en vrac » ; l'accord « la moins chère, et bouton + » est cité dans `src/config/rangerNoteIA.ts`.

**Ce qui est rebranché.**
- `src/ui/atelier/rangerIA.ts` (neuf) : `demanderRangement` (réponse simulée au banc, `AiClient.run({task:'rangerNote'})` seulement en `production`, garde `lireReponse`), `lignesDePropositions` (cases cochées → lignes de la carte e9na ; prix deviné par `prixDevine` dans Tarifs ; contact connu lié, jamais recréé), `bieresConnues`.
- `src/ui/atelier/Ecrire.tsx` : la carte « Rangement proposé » reste celle de e9na (Corriger, Ranger ainsi). Si l'IA est allumée et le réseau là, l'IA propose (« L'IA range ta note… », puis « exemple » au banc, et « + modèle plus précis » une seule fois). IA éteinte, hors ligne, muette ou en panne : lecture locale d'avant, avec une ligne qui le dit. La note n'est jamais perdue (elle reste dans la carte jusqu'à « Ranger ainsi »).
- `src/components/CreativeLabTab.tsx` : `mode={modeRangerNote()}` et le contexte (contacts, tarifs, bières des recettes et des tarifs). Le drapeau est de nouveau lu dans le paquet.
- Test : `tests/unit/port-q10-ranger-ia.test.tsx` (6 tests, tout simulé : aucun appel réel).

**Preuves.**
- `npx vite build` OK ; `node scripts/check-build-flags.mjs dist` : 3 lignes `DRAPEAUX OK` (Houblons « on », enrichissement « production », Carnet rangée par l'IA « production »). `check-no-dev-auth.mjs` propre.
- TSC OK hors `functions/`.
- `npx vitest run port- tests/unit/atelier tests/integration` : `newfails2.cjs` → `FAILS 7 BASE 64 NEW 0` (aucun échec neuf). Après le dernier déplacement du bouton « + », rejeu de port-q10, port-q7, port-q4-carnet, rangerNote : 48 verts.
- Banc `banc.mjs` (`?dev-local`, 390, fixtures « ZZ », simulé) : `BANC OK 5 captures`, ouvertes : `captures/atelier-repos-390.png` (carnet au repos), `atelier-range-simule-390.png` (« Livrer 2 fûts de 20 L · Le Carnotzet Gourmand », « exemple », « + plus précis »), `atelier-plus-precis-390.png` (après le « + », bouton retiré), `atelier-apres-ranger-390.png` (la tâche dans le carnet, toast Annuler). Le dossier `captures/` est ignoré par Git (`.gitignore:108`).

**Doutes et limites.**
- Pas gardés en e9na : la note brute enregistrée d'abord comme `type:'note'` (ks4 la gardait avant l'appel), la note « rangée au retour du réseau » (hors ligne, e9na range en lecture locale à la place), la case « Convertir en client » (la fiche Contact garde « Convertir »), les indices « Date/Prix/Bière à poser » et la date corrigeable dans la carte (Corriger modifie le texte et le tiroir). À décider par le pilote si l'un d'eux est voulu.
- `src/ui/atelier/NoteCarnet.tsx`, `NoteAiguillage.tsx`, `TarifsFrise.tsx`, `TodoTimeline.tsx`, `ContactsView.tsx` ne sont plus rendus par l'Atelier (non supprimés).
- En `production`, l'appel réel part vers la tâche serveur `rangerNote` : le commentaire d'`aiClient.ts` la dit « écrite, pas déployée ». Si elle ne l'est pas, l'appel échoue et l'écran retombe sur la lecture locale avec « L'IA n'a pas répondu » (testé au banc seulement en simulé).
- Le tag n'a pas de ligne « ks4 » dans SPEC-BRASSEUR.md (grep vide) : la fonction se fonde sur les lignes 1704 et 1779.

CONNAISSANCE : une fusion qui garde notre écran peut perdre la seule lecture d'un drapeau de build ; `check-build-flags.mjs` après `vite build` l'attrape (3 lignes `DRAPEAUX OK`).
LEÇON PROPOSÉE : après une fusion, rejouer `check-build-flags.mjs dist` avec le build, pas seulement `vite build` ; pour tout écran gardé « de notre côté », lister les imports du fichier côté tag et vérifier un à un qu'ils sont encore atteints.
