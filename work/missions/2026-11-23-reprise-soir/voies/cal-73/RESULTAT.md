OK — 5 problèmes, 0 bloquants

RESULTAT cal-73 : 5 problèmes (B 0, m 5, D 0) — corrigés rejoués 6/6 — carnet identique oui — BUGS OK

Version : index-L94x-z-O.js (curl ?nocache ; mon onglet servait E9xIEuvt, `maj.mjs` l'a amené sur L94x-z-O). La VOIE cite SSQ_J86L ; le DOSSIER, qui prime, et le serveur disent L94x-z-O.
Tests : sans objet (test d'écran). Registre : `bugs.log` (BUGS OK : 2389 bugs, 566 ouverts, 202 sources).
Couvert : 390 × 844, deviceScaleFactor 2, au toucher (CDP), clair ; 2 captures à 1280 (G-1280, G-1280-fiche) ; 2 en sombre (G-sombre, G-sombre-fiche), thème posé par l'attribut dans mon onglet seulement, sans localStorage. Chrome de débug 9222, mon onglet seulement, jamais browser.close(). Aucun appel IA.

## Ses données : avant = après (`avant.json`, `apres.json` : 14 champs sur 14 identiques)
- À dépenser −463 (S53). En caisse 1 145,00 (libre 1 145,00). Synthèse 0,00 / 265,40. Opérations 265,40 / 0,00 / 265,40. Solde de départ 1 145,00.
- Période : 6 sem., du 23 nov. 2026 au 3 janv. 2027 ; le localStorage est identique (remis après chaque geste de vue).
- Ses 16 choses de la frise : aria identiques une par une. Matériel › À venir identique (11). Aucune ZZ restante (Calendrier et Opérations).

## Tableau
| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| avant-S3-calendrier, A-ouvert | clair | 390 | ouvert, 6 sem. | 0 | 0 |
| D-pendant, D-3sem | clair | 390 | poignée de fin tirée, 3 sem. | 1 (n° 3) | 0 |
| S1-semaine53 | clair | 390 | 1 sem. sur S53 | 1 (n° 4) | 0 |
| E-4ans | clair | 390 | 4 ans | 1 (n° 1) | 0 |
| F-stocks, F-materiel | clair | 390 | Stocks, Matériel | 1 (n° 2) | 0 |
| Z3, Z4-*, Z5-*, Z6-*, Z7, Z8 | clair | 390 | ZZ créée, déplacée, allongée, au bord, vente, fiche | 1 (n° 5) | 0 |
| E-vi-fiche, B-fiche-* | clair | 390 | cartes | 0 | 0 |
| G-1280, G-1280-fiche | clair | 1280 | ouvert, carte | 0 | 0 |
| G-sombre, G-sombre-fiche | sombre | 390 | ouvert, carte | 0 | 0 |

## Combien et quels problèmes : 5
1. **CALP-6 toujours présent** (m). À 4 ans, la rangée Brassins montre deux lignes identiques « Jhhh · coût à venir » (5 et 7 sept.). « neipa v3 · coût à venir » et « Ttt −3,52 + à venir » sont aussi en double. À 15 sem., « neipa v3 · lotus, flocons d'avoine, pilsner malz » apparaît deux fois (cap/E-4ans.png, Z5-allonger8-apres.png). Il ne sait pas laquelle est laquelle. La ligne est hors de mon OWNS. Texte proposé au pilote : « ouvert — présent (tour 73, 25.11, en ligne index-L94x-z-O.js : homonymes Jhhh, neipa v3, Ttt ; voies/cal-73/cap/E-4ans.png) ».
2. **CALP-13 toujours présent** (m). Stocks s'ouvre sur Matériel › Carnets, et ni l'un ni l'autre n'a de lien vers le calendrier de section (cap/F-stocks.png, F-materiel.png). Au code du tag, LienSection n'est posé que dans FinancesTab et ProductionTab. Hors de mon OWNS. Texte proposé : « ouvert — présent (tour 73, 25.11, en ligne index-L94x-z-O.js) ».
3. **K73-1 Le bouton de durée est en retard** (m). Pendant qu'on tire la poignée de fin, la bulle dit « 23 nov. – 27 déc. », mais le bouton reste à « 6 sem. ». Il ne change qu'au relâcher (cap/D-pendant.png). Il dirait : « Il me dit 6 semaines alors que j'en tire 5. »
4. **K73-2 « S53 2026 »** (m). Une fenêtre d'une semaine sur S53 affiche « S53 2026 » dans le cadre (cap/S1-semaine53.png). Le 24.11, à la question « S53 2026 ? », il a répondu « Non ».
5. **K73-3 Lenteur mesurée** (m). Chaque ouverture du Calendrier contient une tâche longue de 358 à 577 ms, à froid comme à chaud. Avec le processeur ralenti ×4, l'ouverture prend 0,96 à 1,5 s. Relâcher une barre gèle l'image 255 à 339 ms. Une barre tenue au bord fait des images de 216 à 274 ms. Le détail est ci-dessous.

Doutes (non comptés) :
- D1. J'ai mené un doigt hors de l'écran (x = 447) en allongeant : une tâche longue de 2 364 ms, la fin poussée au 9 avr. et la fenêtre passée à 15 sem. Un vrai doigt ne sort pas de l'écran. À 4 px du bord, pas de gel au-delà de 279 ms.
- D2. La fiche d'une vente propose la puce « +1 200 », le montant de l'apport « De ma poche », comme montant de vente (cap/Z8-vente-fiche.png).
- D3. La rangée Brassins ne se range pas toujours pareil. Fruty était seule sur sa ligne au relevé avant, puis à côté de NEIPA Test après rechargement, avec les mêmes données (avant-S3-calendrier contre E-vi-fiche).
- D4. À 15 sem., l'étiquette à gauche de Fruty est coupée (« −2,40 + à venir F… »).
- D5. Le curseur Fin de la feuille d'ajout annonce « 1 semaine, jusqu'à S48 » à l'accessibilité, alors que l'écran dit « Durée 1 j ».
- D6. Un brassin ZZ ne peut pas se planifier : la feuille Brassins ne prend qu'une de ses recettes, et le brassin porte le nom de la recette. Le passage libre a donc été joué sur une fête ZZ (barre de 4 sem.), un travail ZZ et une vente ZZ.

## Lenteur mesurée (performance.now et PerformanceObserver longtask, 390, au toucher)
- Ouvrir le Calendrier depuis Bord :
  - à froid (page rechargée) : 487, 550 et 446 ms, tâches longues de 169 à 501 ms ;
  - à chaud : 473, 595 et 396 ms, tâches longues de 455, 577 et 358 ms ;
  - processeur ×4 : 1 134, 956 et 1 505 ms, tâches longues jusqu'à 1 385 ms.
- Ouvrir une chose de la frise (carte) : Milk Stout 19, 7 et 7 ms ; De ma poche 11, 7 et 5 ms ; vente ZZ 10, 5 et 7 ms. Ouvrir la fiche d'une vente (Modifier) : 131 ms.
- Glisser une barre ZZ (relâcher, puis mise à jour) : 262, 272 et 278 ms (travail), puis 264, 276 et 256 ms (fête) ; image la plus longue 255 à 339 ms. Allonger : image la plus longue 259 ms.
- Défiler de 3 semaines (corps du cadre glissé) : 6, 8 et 17 ms, image la plus longue 40 à 55 ms.
- Barre tenue au bord pendant 2 s :
  - à 30 px : de S1 à S13, environ 6 col./s ;
  - à 4 px : environ 8 à 9 col./s ;
  - tâches longues de 223 à 279 ms dans les deux cas.

## Corrigés rejoués : 6 sur 6 tenus
- **BD-1, le bandeau « Enregistrement… »** : vérifié en ligne sur index-L94x-z-O.js. Il paraît à chaque vraie écriture (597 ms, puis 334 ms) en y = 777, au-dessus de la barre du bas, puis disparaît. Il n'est jamais resté et ne s'est jamais posé sur les onglets du haut.
- **« −1 663 » sous ±** : vérifié. −463, −458, −383 et −3 363 se tiennent à gauche de ± sans chevauchement, à 390 comme à 1280 (avant-S3, Z7, D-3sem, E-4ans, G-1280).
- **Q4-1, la vitesse au bord** : tenue sur index-L94x-z-O.js (environ 6 col./s à 30 px, 8 à 9 à 4 px). Il reste le gel du n° 5.
- **Jour exact à 3 semaines** : vérifié. L'axe est en jours (21, 23, 25…). Hefe (21 nov.) commence à 28 px pour 27 attendus, Ttt (22 nov.) à 41 pour 40,6, et le 23 nov. à 55 pour 54 (cap/D-3sem.png).
- **Ventes** : vérifié. La vente ZZ de +5 donne « +5 prévu S48–S53 » et l'à dépenser passe de −463 à −458. L'apport « De ma poche » n'est plus compté dans les Ventes (cap/Z7-vente-carte.png).
- **Vente → fiche** : vérifié. La carte (Facturer, Modifier, Lier, …) s'ouvre en 10 ms ou moins, puis Modifier ouvre la fiche avec le nom et le montant (cap/Z8-vente-fiche.png).
- 1280 et sombre : aucun problème vu.
- POI-1 : pas rejoué au bord de l'écran. La poignée de fin d'une barre longue, prise à 6 px dans la barre, allonge sans déplacer (cap/Z5-allonger-6-apres.png).

## Passage libre comme le brasseur (ZZ seulement)
- Travail ZZ créé, puis déplacé trois fois (25 nov. → 9 déc. → 2 déc. → 9 déc.) : à chaque fois la bulle dit « S50 · 9 déc. · lâcher ici » et l'avis propose « … · Annuler ». Retiré par Plus d'actions › Supprimer.
- Fête ZZ de 4 sem. créée (23 nov. → 20 déc.), allongée par sa poignée de fin jusqu'au 4 janv., tenue au bord puis Annuler (remise à 23 nov.), et retirée.
- Vente ZZ de +5 créée, ouverte trois fois, fiche ouverte, puis retirée.
- Les cibles ont été vérifiées avant chaque relâcher (elementFromPoint, « ZZ TEST — k73 »). Aucun geste fini sur ses choses.

## Incident de ma part, réparé
- `ex1.mjs` : la page était défilée et mon toucher sur « Ajouter dans Brassins » est tombé sous l'en-tête collant, sur la semaine S47. Le cadre a été posé sur S47 (1 sem.). C'est un état de vue, aucune donnée touchée. Remis par `remettre.mjs` (localStorage identique, vérifié au relevé après).

LEÇON PROPOSÉE : avant chaque toucher calculé après un scrollIntoView, vérifier par elementFromPoint que le point ne tombe pas sous un en-tête collant. Le 25.11, un toucher prévu sur « + » a posé le cadre du Calendrier sur une autre semaine.
