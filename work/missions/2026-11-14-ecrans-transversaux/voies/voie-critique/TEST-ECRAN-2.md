OK — 7 problèmes, 0 bloquant

Version : 9c18e534 (deploy/transversaux, copie Temp/deploy-transversaux, ?dev-local, base « 11 enregistrements » : ni stock ni brassin). 116 captures `deploiement/test-ecran-2/`. Ouvertes : les 29 vues 390 clair, puis 390 cave (Plus, + Brassins, Réglages) et 1280 (Plus, + Finances, recherche cave). Comparé à m3, d3p2, b1s-b2 et r3p2.

| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| 02-plus, 03a/03b période | clair, cave | 390, 1280 | repos, feuille, Oct. | 1, 2, 7 | 0 |
| 07-conversations | clair | 390, 1280 | toucher | 3 | 0 (sous réserve) |
| 05-*-plus (5 écrans) | clair, cave | 390, 1280 | pile ouverte | 4, 5, 6 | 0 |
| 01, 04a-c, 05-repos, 06 ×4, 07 ×3, 08 | clair, cave | 390, 1280 | repos, gestes | 0 | 0 |

## Combien et quels problèmes ?
1. Plus : à 390, Thème passe avant Période, alors que m3 met Période juste sous « Je saisis ». À 1280, la page tient sur 2 colonnes, avec les tuiles Assistant et Atelier sous Thème. m3 en a 3, avec les tuiles en haut à droite. C'est un écart à sa maquette (`390-clair-02-plus`, `1280-clair-02-plus`).
2. Plus › Thème : la carte choisie porte ☼ au lieu du ✓ de m3. Seul le cadre dit lequel est pris.
3. Plus › Mes conversations : le toucher n'ouvre rien, aux deux largeurs. La capture reste sur Plus, et le texte relevé est identique. C'est la version du tag (fx2c gardée par décision) en mode local. Non bloquant ici, mais à toucher en ligne dès le déploiement : si rien ne s'ouvre en ligne, c'est un geste sans effet, donc bloquant.
4. Le + sur Brassins › Atelier › Matériel (« Mes achats ») : la pile dit « Sur Atelier R&D » et « Nouvelle idée », alors que l'onglet allumé est Brassins et que le geste crée un besoin d'achat. Il n'est pas à sa place : « une idée ? je suis dans mes achats ».
5. Le + sur Brassins et sur Stocks : « Courses » seul, sans verbe. On ne sait pas s'il ouvre la liste ou s'il ajoute. b1s-b2 dit « Ajouter aux courses · froment » (la précision n'apparaît que s'il y a quelque chose à commander, `plusEcran.ts` l. 110).
6. Le + : un même geste porte plusieurs noms. À 390 : « Recette », « Brassin ». À 1280 : « Créer une recette », « Lancer un brassin ». Sur Atelier : « Lancer un brassin ». Sur Brassins : « Nouveau brassin ».
7. Période (Plus et feuille de l'en-tête) : la ligne « Du … au [jj.mm] → [jj.mm] » place « au » avant le premier champ, ce qui se lit mal.

Corrigé depuis TEST-ECRAN 1 : la lettre G de l'avatar en clair, l'état de Connexions (« Drive à connecter ») et de Réglages (« 2 erreurs »), le focus de la recherche à 390, le doublon du + (Finances : Recette, Brassin, Compagnon seulement), « à saisir » centré, le voile gris sous la recherche, le titre « Période » et le mois en gras. Ce qui tient : la période « Oct. » se lit partout (en-tête, Finances, Bord, toast « toute l'app ») ; le + flotte seul sur les 6 écrans, avec l'écran en tête et « Partout » toujours là ; le cas vide de la recherche (« Rien pour « cit » », 2 gestes) ; les 4 onglets de Réglages, Journal, Connexions, Saisir au nom (d3p2) ; la caisse v3a. Côté métier, l'impôt bière se vérifie : 16,88 / 25,32 / 33,76 CHF/hl et 0,084 CHF pour 33 cl. La TVA 92,51 / 7,49 aussi.

## Doutes (non comptés)
- « Compagnon hors connexion · mode local » flotte sur la liste de Plus à 390 et cache « Connexions cloud et IA ». C'est propre au mode local.
- Un point noir (jaune en cave) sur l'avatar, absent de m3 et sans explication.
- Le logo 🍺 (Header.tsx, antérieur) au lieu de l'icône de m3 et de b1s-b2.
- Le vocabulaire de la période diffère : Plus dit « Ce mois · Mois dernier · Exercice 2026 · Tout » avec une glissière, Finances dit « sept. oct. nov. tout … ».
- Atelier : les deux boutons « + mois » restent à l'écran (des reports, pas des créations).

## DEMANDE EXECUTANT (captures manquantes, en ligne sur des données « ZZ TEST », après le déploiement)
1. Recherche « cit » avec un houblon ZZ TEST en stock, puis le geste « Corriger » : `04c` est une copie de `04b2` (la note du banc vaut `geste: null`).
2. Le + sur Brassins avec un brassin ZZ TEST en fermentation : il faut « Saisir une densité · <lot> · J+n » (code présent, `plusEcran.ts` l. 120, jamais vu à l'écran).
3. Plus › Mes conversations, toucher en ligne : la boîte doit s'ouvrir (problème 3).

## Verdict
LIVRABLE : aucun bloquant. À corriger ensuite, dans l'ordre 4, 5, 6, puis 1. Le problème 3 et les captures 1 à 3 se jouent en ligne juste après le déploiement.
