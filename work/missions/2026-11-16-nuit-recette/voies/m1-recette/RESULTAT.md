OK — 36 : suppression déjà en ligne (bas de page), ajoutée au menu du « + » (option b) ; « 19 L » : volume réel, grisé

## SUITE 16.11 — option (b) du pilote : « Supprimer la recette » dans le menu du « + » de la page
- Mécanisme lu : `src/ui/plusPage.ts` (`usePlusPage` déclare, `FloatingActions` lit `usePlusPageActions`, `PlusSheet` rend en tête « Sur <page> » contre le +) ; même forme que `ActionDock`.
- Test rouge d'abord : `tests/integration/recetteSupprimerPlus.test.tsx` (2 tests ; le 1er rouge « expected null to be truthy », la ligne absente) : le menu du « + » de la page contient « Supprimer la recette » avant « Partout », il referme le menu, ouvre la même feuille, ne supprime qu'à la confirmation ; le bouton du bas reste ; page retirée, la ligne disparaît. Vert après.
- Code : `RecipePage.tsx` (`usePlusPage({ titre: recipe.name, actions: [supprimer -> setConfirmDelete(true)] })`). Hors « Possède », strictement additif, fichiers de la voie m3 (non commités) : `src/ui/plusPage.ts` (genre `'supprimer'` ajouté au type) et `src/components/navigation/PlusSheet.tsx` (icône `Trash2` pour ce genre). FloatingActions et BrewWizard non touchés.
- Rejoués : recetteSupprimerPlus + recetteR1 + recetteSupprimerApp + assistantPlusActions (m3) : 45 verts ; tsc 0 erreur (tsc2.txt) ; build vert, DRAPEAUX OK (build2.txt).
- Captures ouvertes (captures-menu/) : clair 390 menu ouvert (« Sur American IPA » : « Supprimer la recette · après confirmation », corbeille, contre le +, « Partout » dessus), cave 390 feuille ouverte depuis la ligne ; clair 1280 non ouvert en image. Ligne mesurée 300×48 px à 390.
- Limite : la ligne a la teinte « Brassins » commune aux actions de page (pas de rouge) ; le bord rouge reste au bouton du bas.

---
(rapport de la première partie ci-dessous)

## 36 — suppression d'une recette : ce n'est PAS une régression de code
- Historique : `git log -S "Supprimer cette recette"` : 6c4c409f (origine), e01140e9 (port r1 de la page), HEAD et tag `en-ligne/2026-11-16-atelier-nuit` (RecipePage.tsx, rangée `r1-supprimer` + ConfirmSheet). Au port r1 (e01140e9) le bouton est passé de l'en-tête (ancienne l. 263) au BAS de la page : « Dupliquer » à gauche, « Supprimer la recette » éloigné à droite, bord rouge, comme la maquette r1.
- Câblage : `App.tsx` l. 1053 `onDelete` -> `StorageService.deleteRecipe` + toast + fermeture de la page. Rien à rétablir.
- Test écrit d'abord : `tests/integration/recetteSupprimerApp.test.tsx` (vraie App, vraie page ; magasin simulé en liste) : la feuille « Supprimer cette recette ? » s'ouvre, Annuler ne supprime rien, « Supprimer la recette » appelle `deleteRecipe(id)`, la page se ferme, la recette n'est plus proposée, l'autre reste. VERT sur HEAD, sans correction : il n'y a rien de cassé.
- Pourquoi non trouvée en ligne : le bouton est à ~1 900 px sous le haut de la page à 390 (mesuré, journal.json : y = 1926 en haut de page, 28 px de haut, bord rouge discret), tout en bas après les sections Eau (ouverte, radar), Fermentation, Brassins. Il se voit à 1280 sans scroll long. Le testeur a cherché dans l'en-tête, où il était avant le port r1.
- Rien de changé dans la page pour 36 (règle n° 1 : r1 telle quelle).

## « 19 L »
- Source : `recipe.volumeL` (RecipePage.tsx, `formatLitres(recipe.volumeL)`) ; jamais le défaut du matériel (24 L, `BrewhouseSettings`). Inconnu : « — L », jamais 0. La capture du banc montre 30 L pour la recette de 30 L.
- Le grisé r1 manquait dans la base (il vit dans f726eee3, branche claude/nuit-recette-1611b, pas dans le tag en ligne). Test rouge d'abord : `recetteR1.test.tsx` « matin 16.11 : le volume de l'en-tête est celui de la RECETTE… » : échouait (pas de `<span>` grisé), vert après.
- Code : `PageShell.tsx` : `title: ReactNode` + `titleLabel` (nom du `h1` et du `main`, une chaîne se nomme elle-même) ; `RecipePage.tsx` : `<span class="font-normal text-cave-400">30 L</span>` + `titleLabel`.

## Fichiers écrits
`src/pages/PageShell.tsx` (titre seulement), `src/pages/RecipePage.tsx` (titre seulement), `tests/integration/recetteR1.test.tsx` (un test), `tests/integration/recetteSupprimerApp.test.tsx` (neuf), banc `capturer.mjs`, `captures-avant/`, `captures-apres/`, journaux `*.txt`.

## Critères
- `recetteR1` + `recetteSupprimerApp` : 29 verts (test-r1-apres.txt).
- 24 fichiers qui touchent RecipePage ou PageShell : 146 verts, 2 échecs : `brewLegacyInstallationApp` (« Planifier » introuvable : échoue AUSSI sur HEAD, vérifié en remettant HEAD puis en restaurant mes deux fichiers) et `noloWizardApply` (délai de 15 s sous charge, vert seul : 4/4).
- tsc : 0 erreur. `npm run build` : vert, DRAPEAUX OK (build.txt).
- Captures ouvertes en image (`captures-apres/`) : clair 390 haut (« American IPA 30 L », 30 L grisé), cave 390 feuille de suppression, clair 1280 bas (Dupliquer / Supprimer éloignés) et feuille ouverte ; clair 390 bas et feuille du « avant » aussi. Cave 1280 non capturé.
- Essais : un par critère.

## Doutes et limites
- Le travail parallèle (m2, m3) modifie aussi l'arbre (PlusSheet, FloatingActions, BrewWizard, recettesModel) : non touché. n2 (branche nuit-recette-1611b, f726eee3) a fait le même changement de titre dans PageShell/RecipePage : fusion identique, aucun conflit attendu sur ces lignes.
- La page est très longue à 390 (Eau ouverte par défaut) : choix de la maquette, non changé.

DÉCISION À PRENDRE : rendre « Supprimer la recette » plus facile à trouver ? Options : (a) rien, c'est la maquette r1 ; (b) la montrer aussi dans la feuille des actions du « + » de la page ; (c) replier la section Eau par défaut pour raccourcir la page. Recommandation : (a), puis dire au testeur où elle est (bas de la page).

CONNAISSANCE : en ligne, la suppression d'une recette est au bas de la page r1 (rangée `r1-supprimer`), plus dans l'en-tête depuis le port r1 (e01140e9).
LEÇON PROPOSÉE : aucune
