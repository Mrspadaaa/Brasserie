# Dossier du jury : l'étape « Malts/sucres 2/7 » (Fermentescibles), 31.10

Niveau **rapide** : Brasseur (Fable) et Contradicteur (Opus). D204 demande l'économie (« c'est trop demandant en quotas »), et les
réponses communes à toutes les étapes sont déjà tranchées par le jury d'Identité (`work/missions/2026-10-31-ecran-identite/cadrage-jury.md` :
scène, en-tête, fil, pied, saisie sans `type="number"`). On monte d'un niveau si J2 n'est pas tranché.

## Hypothèse (confiance 70 %)
Au premier coup d'œil, l'étape 2 montre ce que la recette contient : chaque malt ou sucre, sa part du grain, sa masse et sa couleur. On
ajoute en un toucher, qu'on ait du stock ou non. La forme parle la langue de r4-a et de l'étape Houblons : chaque nombre est un curseur
et se tape, avec des pastilles. Le détail (la fiche du malt, la couleur, le rendement, les avertissements de densité) vient à un toucher.
Pourquoi 70 % seulement : on ne sait pas si « ajouter en un click » doit passer outre le stock, et il n'existe pas aujourd'hui de
« panel de comparatif » des malts.

## Extraits (mot pour mot)
1. **Ses mots sur l'étape** (`work/refonte-frontend/v4/SPEC-BRASSEUR.md` l. 76, 18.10, capture de l'étape Malts à l'appui) : « Comme pour les
   Malts j'ai besoin d'avoir des le premier coup d'œil, quel matière première j'ai, et et je peux ajouter en un click ultra facilement.
   Ensuite seulement je peux ouvrir mon panel de comparatif ect .. ». Ce mot a servi de modèle pour l'étape Houblons (D13,
   `controle-recette.mjs` : bloc de la recette dans la moitié haute, au moins une ligne, un ajout rapide visible, un toucher ajoute une ligne,
   le panneau d'analyse vient après). **L'étape Malts d'aujourd'hui est donc sa référence positive** : un plancher à enrichir.
2. **Le principe de l'app** (SPEC l. 71-74, C062, 29.09) : « je veux que dans le 80% des cas où c'est, je sais déjà ce que je veux […] ça soit
   très pratique, pas surchargé, hyper lisible. Mais que son je veux aller dans le dur, comprendre vraiment, confronté mes idées, choisir mais
   aussi avoir le choix et que on me propose les choix, soit possible. »
3. **Son choix pour l'étape 1** (31.10, sur r4) : « Est le meilleur, mais limite peut être un peu trop, au je veux plus d'ébullition, SI je
   change de fermenteur... Quelques adaptations mais si non c'est bien ! » ; « il faut que […] soit accessible en mode ordinateur, donc pouvoir
   modifier aussi les chiffre directement » ; sur r4-a : « ça semble vraiment bien ». La page de r4-a :
   `work/missions/2026-10-31-ecran-identite/v1/page.html` (captures dans `v1/r4-a/`).
4. **PRODUCT.md** l. 125-127 : « Distinguer la contribution des ajouts à la densité, leur fermentescibilité documentée et le milieu approprié
   au starter, notamment extrait de malt versus maltodextrine. Le parcours doit rester lisible sans déplier tout le calcul. » ; l. 163-165 :
   « Le rendement exige un couple volume/densité du même moût, sa référence de température et les ajouts réels. Les sucres et extraits ne
   calibrent pas le rendement des grains. »
5. **L'écran d'aujourd'hui** : `inventaire/inventaire-fermentescibles.md` (voie i1, code lu ligne à ligne). Les faits saillants :
   - les blocs, de haut en bas :
     - en-tête et fil ;
     - bandeau Grain · OG · IBU · EBC ;
     - la carte « Fermentescibles » avec sa phrase « Le lactose ne fermente pas ; le sucre fermente à 100 % » ;
     - « Ajouter » avec une pastille de famille qui se tourne : Grain, Sucre, Lactose, Fruit, Extrait ;
     - le choix « Ajouter — grain… », pris **dans le stock** ;
     - une ligne par ingrédient : nom, moment, « NN % du grain », masse en kg (pas à pas), corbeille ;
     - le jour d'ajout si le moment est la fermentation ;
     - l'avertissement du lactose ;
     - la fiche du malt (`MaltDetails`) ;
     - l'avertissement de densité ;
     - le pied « Retour · Suivant — Houblons ».
   - **Aucun panneau de comparaison des malts n'existe** (la couche « Comparer » ne vaut que pour les houblons).
   - Le stock vide donne « Aucune option » : rien ne s'ajoute (capture `inventaire/captures/fermentescibles-ajout-390.png`).
     L'inventaire dit que l'`IngredientPicker` sait créer à la volée, mais ce n'est pas vérifié.
   - Le rendement : `details.efficiencyPct ?? brewhouse.efficiencyPct ?? 75`.
6. **L'app en ligne** (31.10, lu dans la page, recette « NEIPA Test multi-houblons », 1280 px) : Pilsner Malz (Weyermann), Empâtage, 63 % du
   grain ; Weizenmalz hell (Weyermann), Empâtage, 19 % ; Haferflocken (flocons d'avoine), Empâtage, 19 %. Chacun porte « Couleur à renseigner
   · modifier ». Le bandeau donne Grain 8 kg, OG —, EBC — : la couleur inconnue rend l'EBC inconnu.

## Captures (4)
- `inventaire/captures/fermentescibles-vide-390.png` : recette vide, « Ajouter — grain… », « Rien encore. ».
- `inventaire/captures/fermentescibles-ajout-390.png` : le geste « ajouter », stock vide, « Aucune option ».
- `jury-fermentescibles/production-identite-1280.jpg` : l'app en ligne, étape 1. Elle montre l'en-tête, le fil et le bandeau tels qu'ils
  sont en production.
- `work/missions/2026-10-31-ecran-identite/v1/r4-a/r4-et-r4a-repos.png` : r4-a, son choix pour l'étape 1, la langue de référence.

## Les questions, avec la réponse que le pilote recommande
Questions retirées, car déjà tranchées par la fiche d'Identité pour toutes les étapes : J1 (la scène : téléphone, une main, attention
hachée) et J12 (hors périmètre : les autres étapes, le moteur, le schéma de données, les éléments communs). Confirmez-les seulement si
l'étape 2 change quelque chose.

**Tour 1, le but**
- J2. Le geste : voir ce que la recette contient et ajouter en un toucher. Régler la masse de chaque ligne (curseur et saisie, comme r4-a).
  La comparaison vient après.
- J3. Pourquoi maintenant : l'écran est bon dans son principe (sa référence positive), mais textuel. Il y a trois phrases d'aide au repos,
  la couleur manque (« Couleur à renseigner »), l'ajout est bloqué par un stock vide, et la masse se règle seulement pas à pas.
- J4. La réussite, mesurable, à 390 px clavier fermé :
  - chaque ingrédient lisible au premier écran : nom, part, masse, couleur ;
  - un toucher ajoute une ligne, même sans stock (D13) ;
  - 80 mots au plus et aucune phrase explicative au repos ;
  - chaque chiffre écrit une fois.

**Tour 2, ce qui tient**
- J5. Les acquis :
  - les éléments communs d'Identité r4-a (en-tête, fil, bandeau, pied, + flottant) ;
  - la ligne par ingrédient (nom, moment, part, masse) ;
  - les 5 familles ;
  - l'ajout depuis le stock ;
  - le jour d'ajout en fermentation ;
  - l'avertissement du lactose et celui de la densité.
- J6. Déjà refusé :
  - le cockpit ;
  - le texte et la légende au premier plan ;
  - l'en-tête qui change (D119) ;
  - le bouton imposant ;
  - la superposition (D164) ;
  - un chiffre inventé.
- J7. Contrainte : ne rien inventer. Une couleur inconnue reste inconnue, avec un geste pour la renseigner ; un EBC sans couleur reste
  « — ». En cas de conflit, la lisibilité gagne sur la densité.
- J8. Les mots : « Fermentescibles » (titre) et « Malts/sucres » (fil) désignent la même chose : lequel garder ? « Empâtage » est son mot
  pour le moment. « % du grain » et « % ferm. » sont deux unités voisines, ce qui peut troubler.
- J9. Le code contre ses mots :
  - « ajouter en un click » est bloqué par un stock vide ;
  - il attend un « panel de comparatif » qui n'existe pas pour les malts ;
  - les couleurs manquent sur les malts Weyermann courants. Les données du catalogue ont-elles ces couleurs ? (`MESURE`)

**Tour 3, la forme**
- J10. Le premier plan :
  - les lignes d'ingrédients, chacune avec sa masse en curseur tapable et sa part en barre ;
  - l'ajout en un toucher ;
  - l'avertissement de densité, s'il est actif.
  Replié : la fiche du malt, la couleur à renseigner (une pastille « à renseigner »), le rendement et le détail des familles.
- J11. Les cas limites :
  - recette vide ;
  - recette collée (malts inconnus du stock et du catalogue) ;
  - stock vide ;
  - couleur inconnue ;
  - un sucre en fermentation (jour d'ajout) ;
  - le lactose ;
  - NOLO (le bilan des sucres) ;
  - 8 grains ou plus ;
  - hors ligne.
- J13. Les approches réalistes :
  - (a) la liste actuelle compactée ;
  - (b) une barre de composition du grain (les parts empilées, la couleur de chaque malt), avec une ligne par malt dessous ;
  - (c) une carte par ingrédient, comme la carte houblon.
  Le choix entre elles est un goût, donc un axe.
- J14. Les suppositions :
  1. l'ajout propose le stock, puis le catalogue, puis la création libre ;
  2. la masse se règle par 0,1 kg pour les grains et par 10 g pour les sucres ;
  3. la part du grain se calcule, elle ne se saisit pas ;
  4. la couleur d'un malt vient du catalogue ou de sa fiche, jamais d'une estimation sans le dire.
- J15. Le vouloir réel : sans rien à justifier, il voudrait voir sa recette de grains comme une composition (la base, le blé, l'avoine), et
  pas comme une liste de formulaire. À confirmer.

**Tour 4, la clôture**
- J16. Irréversible : rien, tant que ni les données ni le moteur ne changent. Ajouter des couleurs au catalogue serait une donnée : `ACCORD`
  ou voie à part. Le déploiement et ses recettes en ligne relèvent de son accord du 31.10 (« Tu peux modifier les données de recette […]
  ne génère pas des quantités de données inutile »).
- J17. Le contrôle du bâtisseur : où une voie devrait-elle deviner ?
- J18. Autre chose.

## Consignes aux regards
Répondez à chaque question en 40 mots au plus, avec une classe : `SOURCE` (chemin et mots exacts), `PILOTE`, `GOÛT` (nommer les options,
qui deviennent un axe), `ACCORD`, `MESURE` ou `CONSEIL`. « Hors de mon regard » est permis. Ouvrez une source seulement pour vérifier
un point. Terminez par `LEÇON PROPOSÉE : …` (ou « aucune »).
