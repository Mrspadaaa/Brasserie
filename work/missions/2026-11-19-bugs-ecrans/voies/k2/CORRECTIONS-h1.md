# Corrections h1, tour 2 (critique k2, 20.11)

Liste figée (L18) : chaque point est corrigé et prouvé seul (test si c’est une règle ; capture 390 et 1280, clair et cave, ouverte), ou écarté avec raison. Un point « hors voie » de la critique se corrige s’il est dans ton « Possède » (voies/h1/VOIE.md) ; sinon « ouvert — hors voie : fichier ». Même contrat que voies/h1/VOIE.md : COMMUN.md, test rouge d’abord, commit par chemins « Bugs T3B (h1) k2 : … » terminé par « Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> », jamais de déploiement ni de données réelles, jamais stash/reset/checkout.

## Problèmes (RAPPORT.md, même dossier)
1. h1 / T3B-5 / h1-apres-{m390,d1280}-{clair,cave}-fiche-nelson : « Mots de la fiche : White wine, fruity, grape, gooseberry » reste en anglais au premier plan. Le brasseur lit la fiche du fournisseur, pas ses mots / gênant
2. h1 / T3B-5 / idem : « Thiols : forte » : l'accord est faux (thiols est au pluriel). Écrire « Teneur en thiols : forte » / détail
3. h1 / T3B-5 / idem : « Valeurs de la variété » apparaît deux fois (sélecteur, puis la ligne juste dessous), et « Hopsteiner, 2025 — houblon brut » est répété sous chaque ligne / détail
4. h1 / T3B-5 / h1-apres-d1280-{clair,cave}-fiche-nelson : à 1280, la fiche s'étale sur toute la largeur. Le texte fait 12 à 13 px, les barres α, β et huiles s'étirent sur 1 240 px et « Modifier la variété » est rejeté à l'autre bout de l'écran. Ce n'est pas à sa place à 1280 / gênant
5. h1 / T3B-4 / h1-apres-d1280-{clair,cave}-sources-{repos,ouvert} : à 1280, la phrase d'intro, les 4 boutons « Ajouter… » et « Attributions et licences des référentiels GitHub » restent à plat, alors qu'au 390 ils passent sous « Gérer ». TE-52 avait été vu à 1280 : il n'y est pas réglé / gênant
6. h1 / T3B-4 / h1-apres-m390-{clair,cave}-sources-repos : « Gérer les sources et les modèles » n'a pas l'habillage des trois autres replis (fond gris, police plus petite ; en cave, titre blanc au lieu de jaune) / détail
7. h1 / T3B-4 / *-sources-ouvert (390 et 1280) : du jargon reste visible : « référentiels GitHub », « Les axes pèsent autant les uns que les autres », « Autres référentiels · comparer les sources » / détail
8. h1 / hors voie / *-sources-tout-deplie : le catalogue des levures affiche « Forme non documentée · 2 caractéristique(s) » et « 1733 référence(s) trouvée(s) ». C'est le même genre de texte que le « Forme non précisée » retiré par TE-49 / détail
9. h1 / T3B-4 / h1-apres-d1280-cave-sources-* : « Les repères de base : … » est écrit en gris foncé sur noir, contraste faible en cave / détail

## Doutes à trancher
- h1 : « Arômes : Fruité, Agrumes, Épicé » pour Nelson Sauvin. « Épicé » ne colle pas à sa réputation (vin blanc, groseille) ; lien avec L14.
- Doute L14 : « Arômes : Fruité, Agrumes, Épicé » pour Nelson Sauvin : vérifier d’où vient « Épicé » (données de la fiche) ; si la source le dit, garder ; sinon corriger la lecture.

## Preuves demandées (à produire toi-même)
4. h1, T3B-4 (nouveaux libellés) : ouvrir « Ajouter des références, des études et des modèles », puis chacun de ses sous-replis. Capturer `h1-apres-m390-{clair,cave}-ajouts-ouverts.png` (défilement compris), pour voir « Ajouter la base communautaire », « Ajouter la liste de variétés libre », etc.

## Rendre
En bas de ce fichier, « ## Fait » : une ligne par point « n° | corrigé <sha> / écarté <raison> / ouvert <raison> | capture ». Mettre à jour voies/h1/RESULTAT.md si un verdict change, puis tests.txt ; `node work/missions/2026-11-19-bugs-ecrans/verdicts.mjs h1` et `--tests` OK. Réponse : une ligne.

## Fait
1 | corrigé 4ca399e31 | h1-apres-d1280-cave-fiche-nelson (« Mots de la fiche : vin blanc, fruité, raisin, groseille à maquereau »)
2 | corrigé 4ca399e31 | idem (« Teneur en thiols : forte »)
3 | corrigé 4ca399e31 | idem (« Sans lot » au sélecteur ; la source dite une fois)
4 | corrigé 4ca399e31 | h1-apres-d1280-cave-fiche-nelson (colonne de 672 px, mesurée par la sonde)
5 | corrigé 4ca399e31 | h1-apres-d1280-clair-sources-repos, h1-apres-d1280-cave-sources-ouvert (« Gérer » replié, puis ouvert avec ses 4 gestes)
6 | corrigé 4ca399e31 | h1-apres-m390-cave-sources-repos (quatre replis, même habillage, titres jaunes)
7 | corrigé 4ca399e31 | h1-apres-m390-{clair,cave}-ajouts-ouverts-1 (« Autres bases · comparer les sources » ; « Sources et licences des bases de données »)
8 | ouvert hors voie : src/ui/YeastCataloguePanel.tsx l. 86 et 88 (changement exact dans RESULTAT.md) | —
9 | corrigé 4ca399e31 | h1-apres-d1280-cave-sources-ouvert (cave-200 ; contraste mesuré : aucun texte sous 4,5)
Doute « Épicé » | écarté : la source le dit (Hopsteiner, étiquettes Fruity/Citrusy/Spicy, spicy 3/5) | —
Preuve 4 | h1-apres-m390-{clair,cave}-ajouts-ouverts.png et -1 à -7 (ouverts : l'original et -1)
