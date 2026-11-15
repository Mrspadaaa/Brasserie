OK — e2a Rebrasser câblé, e7a alcool tiré de OG et FG, e11a phrase vérifiée ; e4c attend l'accord (date d'entrée en garde)

## Défauts [B] de kp2

- [x] e2a n° 1 : « Rebrasser cette Saison » en pied du Terminé ouvre le brassin de la recette d'origine (`ProductionTab` trouve la recette par `recipeRef`, à défaut par le nom figé du brassin ; sans recette trouvée le pied reste « Fermer », jamais une autre recette). La fiche se ferme, `App.tsx` pose `setBrewRecipeId` + `setQuickAction('brew-batch')` (le passage de prop `onRebrewRecipe` seulement). Capture `e2a-rebrasser` : « Préparer un brassin · ZZ Saison close ».
- [x] e4c n° 1 : ATTEND L'ACCORD. Le modèle n'a aucune trace datée d'un changement d'étape (`grep` sur `src/types/index.ts` et `src/domain/batch*.ts` : seuls `brewDate`, `plannedBrewDate`, `bottlingDate`, `gravityLog`, `archivedAt`). Aucun champ Firestore neuf. L'app montre les seules dates connues (« dès 28.10 » à la Fermentation, « 14.11 » au Conditionné). Absents et dits : « 27.10 → 03.11 », « 11 j · depuis le 03.11 ». « Garde 2 °C » : aucune température de garde dans le modèle (jamais inventée).
- [x] e7a n° 1 : l'alcool d'un brassin sorti de la fermentation et sans alcool saisi est tiré de l'OG et de la FG mesurée (à défaut, le dernier relevé de la garde, comme la FG du même bilan) par `abvFromGravities` ; jamais pendant la fermentation, jamais sans mesure. La Pils (OG 1,046, relevé 1,010) compte : « Alcool 2/3 », « à confirmer » (garde). Fichier : `src/ui/production/bilan/bilanModel.ts`.
- [x] e11a n° 1 : la phrase-réponse s'affiche sur la liste (« ZZ Pils à confirmer, ZZ NEIPA dry hop demain », 390 clair, cave, 1280), masquée dans le Bilan seulement, et revient après « ‹ Le bilan ». Constat : ce n'est pas une régression du masquage de p6. La phrase vient de données vraies, et le banc de p6 n'en fondait aucune (Pils : deux relevés 1,020 puis 1,010, pas stable ; NEIPA : dry hop à J+4 déjà passé à J+5). Je n'ai pas changé le code ; le banc `banc-listes.mjs` pose une fixture qui s'y prête (dry hop à J+6, deux relevés 1,010) et un test (`port-p7-phrase-rebrasser`) joue la liste, le Bilan et le retour.

## Fichiers écrits
`src/ui/production/bilan/bilanModel.ts`, `src/components/tabs/ProductionTab.tsx` (prop `onRebrewRecipe`, recette retrouvée), `src/App.tsx` (passage de `onRebrewRecipe`), `tests/unit/port-p7-alcool.test.tsx`, `tests/unit/port-p7-phrase-rebrasser.test.tsx`, `voies/p7/` : `banc.mjs` (fiche : e2a Terminé et Rebrasser, e4c), `banc-listes.mjs` (e7a, e11a), `fixtures.json`, `tests.txt`, `captures/` (28 PNG + 10), RESULTAT.md.

## Critères
- G1 : `COCHE OK 4/4` (e4c coché « attend l'accord »).
- G2 : `TSC OK`.
- G3 : `npx vitest run port- --reporter=dot` : 11 fichiers, 102 tests verts (`tests.txt`) ; intégration rejouée sur productionCatalog, compactProduction, batchFollowUp, dashboardNavigation, liveDataViews : 53 verts.
- Test e7a échouait avant la correction (Pils absente de « abv », compte 1 au lieu de 2) ; test e2a n'avait pas de câblage avant.

## Captures (port 3107, ouvertes : 390 clair et cave, 1280 clair)
Ouvertes : `e2a-termine-bas` 390 clair + cave, `e2a-rebrasser` 390 clair, `e4c-garde-fg` et `e4c-repos` 390 clair, `e7a-repos` 390 clair et 1280 clair, `e11a-repos` 390 clair, côte à côte avec les PNG de la maquette quand elles existent. Banc : `BANC OK 10 captures` (listes), `BANC OK 28 captures` (fiche), commande `node scripts/with_server.mjs --server "npm run dev -- --port 3107 --strictPort" --port 3107 -- node work/missions/2026-11-14-brassins/voies/p7/banc.mjs` (idem `banc-listes.mjs`).

« Combien et quels problèmes ? » : 4 écarts restants, tous hors ce qui était demandé ou fondés sur une donnée absente.
1. e4c : « 2 °C », « 11 j · depuis le 03.11 » et « 27.10 → 03.11 » absents (DÉCISION ci-dessous).
2. e7a : l'onglet « Alcool 2/3 » est bleu-gris (direction « sous », cible 5,2 contre 4,7 calculé) là où la maquette est ocre : la teinte suit l'écart de la fixture, pas jugée sur les chiffres de la maquette.
3. e11a : la liste garde ses cartes et sa barre « 5 brassins » (maquette : puces Tous / en cuve / en retard, cartes F1/F2) : choix en attente (kp2 : 1, 2, 5 non comptés).
4. e2a Rebrasser : la fiche affiche « Le fermentateur (30 L) est plein avant 45 L » parce que la recette de la fixture fait 45 L ; fixture, pas le port.

Non bloquants simples de kp2 : non repris (le défaut e11a n° 6 et 7 se rejuge avec la phrase, ci-dessus).

DÉCISION À PRENDRE : ACCORD : date d'entrée en garde. Options : (a) champ neuf `stageDates` (ou `gardeSince`) écrit au passage d'étape, rétro-rempli d'aucune valeur ; (b) ne rien ajouter et laisser « dès 28.10 » (seules les dates connues). Recommandation : (a), un champ optionnel qui ne change aucune donnée existante ; il affiche alors « 11 j · depuis le 03.11 » et « 27.10 → 03.11 ». « 2 °C » demande en plus une température de garde dans la recette (autre champ, autre décision).

CONNAISSANCE : une phrase-réponse vide peut venir d'une fixture qui ne fonde aucun fragment (retard, FG stable, dry hop dans 0 à 1 jour), pas d'un défaut d'affichage ; à vérifier sur les données avant de chercher dans le code.
LEÇON PROPOSÉE : aucune
