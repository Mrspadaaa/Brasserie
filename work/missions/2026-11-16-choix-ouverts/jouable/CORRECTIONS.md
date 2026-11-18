# Jouable du 16.11 : corrections après la critique (9 problèmes, 3 bloquants)

Toutes les corrections passent par `outils/build.mjs`, qui reconstruit les 5 écrans depuis les protos choisis par `split/join` (L26). Chaque remplacement doit trouver son texte, sinon le build échoue. Les protos d'origine ne sont pas touchés.

## Problèmes comptés

1. **BLOQUANT. Suppression, le message passait sous « + Brassin » / « + Fût ».** Le + est une pilule. Le message se pose donc **au-dessus** du +, sur toute la largeur (bottom 138 px, à 12 px au-dessus du +). Le message `jxDit` des onglets y est aussi. Contrôle `MSG_HORS_FAB` : écart ≥ 8 px après Archiver, Supprimer et une ligne touchée. On lit bien « + Brassin » et « + Fût » (`elementFromPoint`).
2. **BLOQUANT. La pastille de Stocks affichait 24.** Elle affiche maintenant **5** (horizon S49, choix C), dans le style de C. C'est la même pastille sur les barres d'Onglet, de Fournisseur, de Suppression et de Lot. Pastille garde son `#pas` vivant.
3. **BLOQUANT. Bord disait « Blonde d'automne en cuve ».** Ce qui est en cuve cette semaine est maintenant **B-031 IPA Nelson** : la barre du Calendrier, « Cette semaine au calendrier » et la section « En cuve » disent la même chose.
4. **Lot, la liste Brassins n'avait pas « exemple ».** La pilule « exemple » est ajoutée dans l'en-tête de la liste.
5. **Lot, le chevron pointait vers le haut.** Il est remplacé par « › », sans s'étirer : le sous-titre tient sur une ligne.
6. **Un message restait à l'écran suivant.** `jxEfface()` le retire à chaque changement : onglet, `data-go` et sections d'Onglet ; retour et ouverture d'une fiche dans Fournisseur ; liste, lot ouvert et onglets dans Lot ; horizon dans Pastille.
7. **Pastille, la liste n'était pas dans l'ordre des semaines.** Elle est triée par semaine : S48 (Soude), puis les 4 de S49.
8. **Fournisseur, l'icône de « Pourquoi lui » était presque invisible.** Le disque prend la couleur `--onact` et l'icône la couleur `--act`. Le contraste est franc dans les deux thèmes.
9. **Pastille, la barre du bas n'était pas celle d'Onglet v1.** C'est maintenant la même : 6 onglets dont Calendrier, icônes de couleur, onglet actif sur fond `--botOn` avec un trait de 3 px, hauteur 60 px. Le + et sa bande descendent de 18 px avec elle.

## Doutes, traités aussi

- **Bande sous le +.** Le fondu passe de 12 à 28 px : une ligne qui passe dessous s'efface au lieu d'être coupée net.
- **Données d'un écran à l'autre.**
  - Lot : la Blonde est le lot 28, conditionné le 2 nov. Le 2e lot est l'IPA Nelson, lot 31, brassée le 12 nov. et en cuve ; ce n'est plus le Porter, qui se brasse en S50.
  - Les fûts de Lot deviennent F-22 à F-27 : ils ne reprennent plus les numéros de Suppression (F-03 à F-21).
  - Le client du Pont s'appelle Café du Pont partout.
  - Le Stocks d'Onglet liste les 5 articles de la pastille, et la tâche dit « Commander pour le Porter, 5 articles avant S49 ».
  - Brassins (Onglet) contient B-028 Blonde d'automne, conditionnée.
- **Citra dans un Porter** : remplacé par Fuggle.
- **Finances.** Sous 259 CHF : « S49 : 3 872 en caisse, moins 3 613 déjà promis (loyer, TVA, impôt bière) ».
- **Touchers sans effet.**
  - Les lignes « En cuve » de Bord ouvrent Brassins.
  - Une ligne de Suppression ouvre « fiche … (exemple) ».
  - « Encore en cave » montre « Livrer › » et ouvre « Livrer F-27 ».
  - Le marché sans nom explique qu'il n'a pas de client.
- **Lot, « Qui a reçu ce lot » dans le +** : retiré, puisque l'écran le montre déjà.
- **Pastille, menu du +.** Toucher à côté d'un bouton du menu le fermait mal : la colonne du menu laisse maintenant passer le toucher (`pointer-events`). Tout le voile ferme le menu.
- **Banc.** Le pas « Cave » du jeu attendait Cave sur une page déjà en cave. Il vérifie maintenant que le thème et le libellé du bouton concordent.
- **Porte.** La tuile Lot dit « Blonde lot 28 ».

## Preuves (390 × 844 tactile, émulation `touchscreen.tap`)

- `node outils/verif-corrections.mjs` → **CORRECTIONS OK 76/76**. Il rejoue chaque geste corrigé, en clair puis en cave, et vérifie : le message hors du +, le message effacé, la pastille à 5, l'ordre des semaines, la barre, aucun texte sous 14 px.
- `node outils/jouer.mjs` → **150 pas ok, 0 échec**. Ce sont tous les gestes de la page de choix, en clair et en cave. Pour chaque pas, le contrôle vérifie : aucun texte sous 14 px, aucun texte coupé, aucun débord, rien sous le + au repos ni en fin de liste. Les 5 portes ouvrent leur écran et le retour ramène à la porte. Aucune ressource externe (`EXTERNES []`). Journal : `outils/dernier-jeu.txt`.
- Captures ouvertes : les planches `captures/corr/planche-{a,b,c}.png` et `planche-cave-{a,b,c}.png`. Les captures une à une sont dans `captures/corr/`.

## Reste

- La largeur 1280 n'est pas jouée (elle n'était pas demandée).
- Les noms de lot diffèrent selon les écrans : B-0xx dans Onglet, L-0xx dans Suppression, « lot 28 » dans Lot. Ils viennent des protos choisis et ne se contredisent pas sur les faits. Les unifier toucherait le texte de trois choix.
