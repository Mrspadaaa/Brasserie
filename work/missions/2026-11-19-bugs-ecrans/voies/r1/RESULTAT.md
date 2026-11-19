# Voie r1
- TE-11 | écarté | — | « … » de la carte : le carnet Recettes est le port de r2a (2da7f77c6), sans menu « … » ni « Ranger » ; CatalogItemMenu ne sert plus que les brassins
- TE-12 | corrigé | 4ce60ea72 | fiche : FG et ABV écrivent la plage sourcée de la levure (« 1,010–1,012 », « 5,6–5,9 % », « plage ») au lieu de « — » renvoyé à la Levure
- TE-32 | écarté | — | le tri « Date ↓ » n'existe plus : le carnet r2a (choix du brasseur) groupe par état du stock, puis dernière brassée
- TE-33 | corrigé | 4ac17a3d1 | fiche : plus de « IBU 0 » sans ajout à chaud dosé (annoncé ou « — », comme la liste, be70fa7c3) ; déjà corrigés : « N phase(s) » récap et fiche (a44617b1f), « 17,2 % α » à la virgule
- PD-8 | corrigé | 4ce60ea72 | même correctif que TE-12 (US-05 : plage FG et ABV écrite) ; « Alcool cible » de la carte du brassin : voie Brassins
- PD-9 | corrigé | be70fa7c3 | déjà corrigé : « Couleur attendue : Ambrée — 19,2 EBC », plus de SRM ni de point décimal (sonde sur la fiche)
- BR-4 | corrigé | 19a0d538e | déjà corrigé : la liste et la fiche prennent le même IBU (ibuListe) ; test recetteMemeChiffre vert
- BR-27 | ouvert | — | hors voie : src/ui/finance/BrewBudgetSheet.tsx (zone Finances) ; champs bornés min=0 mais ramenés à 0 sans message (pas d'onRefus)
- BR-96 | écarté | — | la feuille « Préparer un brassin » à volume libre n'existe plus : FeuilleBrasser (port d1b) ; le volume vient de la recette ou du bouton « Adapter »
- BR-98 | ouvert | — | hors voie : src/ui/hopIndex/HopRecipeWorkbench.tsx l.136-137 (detail = source · forme, sans α ni arômes ; pickerOptions.ts le fait déjà)
- BR-99 | corrigé | cd7de6533 | déjà corrigé : segment choisi, aplat et texte posés ensemble (VI-11) ; contraste de la fiche mesuré, voir RESULTAT final
- BR-100 | ouvert | — | hors voie : src/ui/FermentationWorkshop.tsx l.157-158 (zone Levure et Conduite) : le bouton choisi n'a que border-cave-400 bg-cave-800, presque invisible
- BR-104 | écarté | — | le volet « Budget du prochain brassin » (« Comprendre ces montants ») n'existe plus : remplacé par BrewBudgetSheet (port Finances) ; défilement éventuel : voie Finances
- BE-49 | écarté | — | doublon de BR-96 : feuille remplacée par FeuilleBrasser
- BE-52 | corrigé | cd7de6533 | doublon de BR-99
- BE-53 | ouvert | — | hors voie : src/ui/FermentationWorkshop.tsx (doublon de BR-100)
- BE-57 | écarté | — | doublon de BR-104 : volet remplacé par BrewBudgetSheet

Tests : npx vitest run bugs-r1-TE-12, bugs-r1-TE-33, recetteMemeChiffre, recetteR1, recetteRL, noloRecipeSolver → 61 passés, 0 échoué (tests.txt). Les deux tests r1 échouaient avant correction (L13). tsc --noEmit propre. Hors voie : tests/integration/fix114.test.tsx (Finances, « Nouvelle écriture ») échoue, non touché.
Captures (voies/r1/captures/, banc voies/r1/banc, données « ZZ TEST » simulées, toutes ouvertes) : apres-390-clair-fiche-us05, apres-390-cave-fiche-hefe, apres-1280-clair-fiche-us05, apres-1280-cave-fiche-hefe (+ les quatre autres combinaisons clair/cave). On y voit : FG « 1,010–1,012 plage » et ABV « 5,6–5,9 % plage » à la virgule, IBU « — » avec la raison « ajouts de houblon à vérifier » pour la Hefe sans dose, EBC, plus de SRM. Mesure de contraste sur tout le texte de la fiche (390 et 1280, clair et cave) : 0 texte sous 4,5:1, pastilles et onglets de la fiche compris (journal.txt). Le carnet Recettes n'a pas pu être capturé sur le banc (page vide) : TE-11 et TE-32 reposent sur la lecture du code.
Limites : la case de dose du tableau Houblons écrit « 0 » pour un ajout dosé à 0 g (visible sur la capture Hefe) : donnée saisie, non traitée. BR-99 : la pastille « Whirlpool » du Potentiel aromatique (volet fermé sur ces captures) n'a pas été mesurée.
CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
