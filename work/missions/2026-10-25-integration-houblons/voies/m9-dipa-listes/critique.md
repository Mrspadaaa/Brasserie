# Critique m9 — « Quelle liste pour ta Double IPA ? » (27.10, critique calibré, portrait v2)

Regardé : les 8 vignettes `img/*.png` en plein format (780 px), trois recadrages ×2 (ligne « même effet » d'agrumes-c,
rangée Idaho 7 de tropicaux-c, bloc « Ajouter » d'agrumes-b), la page à 390 px (`%TEMP%/m9-haut.png`) et à 1280 px
(`%TEMP%/m9-ordinateur.png`), ses deux captures (`brasseur-suggerer-dipa.jpg`, `brasseur-ref-bm-idaho7.jpg`).

## Ce qui tient (ne pas toucher)
- Trois secondes : « Quelle liste pour ta Double IPA ? », deux questions, A cerclée d'ambre puis B, C, D. Il comprend.
- Son écran : les vignettes sont le Suggérer de l'app (onglets, bandeau IBU, Au style / Barres, carte d'objectif, liste
  cadrée, ♡ et +, pictos cerclés) : même structure que sa capture du téléphone. Règle n° 1 tenue.
- « Tes six » est la bonne idée : six cases toujours à la même place, rang et écart à A en vert / rouge, Idaho 7 en orange
  quand il entre dans l'écran. C'est ce qui rend la différence entre listes lisible, parce que les 4 rangées, elles, ne la
  montrent presque pas. Un chiffre qui répond à « lequel monte » : ça lui parle (portrait § 1.3).
- Pas de cockpit : un encart d'une phrase, une ligne par vignette, une ligne de pied. Aucun texte sous 12 px (le
  sous-titre « rang, et l'écart à l'actuel » fait 13 px CSS).
- La page est honnête sur le fond : elle montre qu'aucune liste ne donne « El Dorado, Mosaic, Mandarina, Calypso, Pacific
  Jade, Idaho 7 » en tête, et l'encart dit pourquoi pour trois d'entre eux.

## Défauts, un par ligne (endroit → à faire)
1. **B et D, agrumes (Citra) et tropicaux D (Strata) : le n° 1 du moteur est affiché 4e, sous « Ajouter », avec sa propre
   barre plus longue.** Défaut de l'app (groupement avant rang), rendu fidèlement. Il gêne le choix : il lira « B fait
   reculer Citra » et choisira ou écartera B et D sur un artefact, alors que Citra reste 1er dans `listes.json`. Et
   « Ajouter » avec son 48 g sort de nulle part face à « même effet » (DEFAUTS : « On a un 10' qui sort de null part »).
   → Sans toucher l'app : une ligne sous les légendes de B et D (« Citra reste 1er pour le moteur ; l'app le range sous
   “Ajouter” parce que son effet est plus fort, défaut d'affichage à corriger »). L'app, à part : garder le rang du moteur
   quand le n° 1 sort de son groupe (DÉCISION du RESULTAT, défaut 3).
2. **Mandarina recule de 5e à 18e dans C (agrumes), en rouge, et rien ne le dit.** C'est la seule régression visible de ses
   six, sur la liste proposée en défaut, et l'encart parle de Calypso, Pacific Jade et El Dorado. Il demandera « pourquoi
   Mandarina recule ??? ». Honnêteté (SPEC § 0 : vraies valeurs, rien qui sort de nulle part).
   → Dans l'encart, remplacer El Dorado (74e dans tous les cas : sa phrase n'éclaire aucun écart) par « Mandarina est hors
   des 16 premiers houblons de Double IPA chez Beer Analytics (< 1,7 %) : la typicité le descend ».
3. **Ligne « même effet sur tes objectifs », 8 vignettes sur 8 : « 48 g » coupé en « 48 / g », et la pastille « dry hop en
   fermentation active » déborde (« active » posé sur le trait tireté du bas), le trait vertical tireté de l'objectif
   traverse « dry ».** Défaut de l'app à 390 px, pas de la page ; sa propre capture montre déjà « 144 / g », le libellé plus
   long aggrave la pastille. Ne biaise pas le choix (identique partout), mais il le verra huit fois : « UI pas au point ».
   → À consigner dans DEFAUTS-RECURRENTS (pastille du moment : une ligne, ellipse ou libellé court « dry hop actif » ;
   colonne de la dose : `white-space: nowrap`). Pas sur la page.
4. **Quatre rangées seulement (`buyLimit = 4`)** : ses six sont presque tous sous l'écran ; en agrumes les quatre listes
   montrent trois fois les mêmes noms (Citra, Centennial, Amarillo). Ne biaise pas le choix, « Tes six » compense, mais
   il risque « ça change rien ??? » sur la rangée agrumes, et « pourquoi que 4 ? ». Sa capture du téléphone en montre
   davantage (paires comprises).
   → Rien sur la page. Question d'app à lui poser à part (DÉCISION du RESULTAT, défaut 2).
5. **« Tes six » n'est pas dans l'app, et la page ne le dit pas.** Il pourrait croire que ce bloc arrive dans Suggérer
   (règle n° 1 : rien ne s'ajoute à son écran sans qu'il le choisisse).
   → Ligne de pied : « Tes six est un repère de cette page, pas un élément de l'app ».
6. **Calypso « — hors des 80 »** : il ne sait pas que le pool fait 80. → « — pas proposé ». **Pacific Jade « — ne cite pas »**
   → « — pas tropical ». (Goût que je lui prête, sans citation : signalé, ne bloque pas.)
7. Page à 390 px : les vignettes B et D (1916 px) sont plus hautes que A et C (1792 px), la grille est inégale ; le texte des
   vignettes est illisible en miniature, mais c'est la disposition qu'il a acceptée le 24.10 (clic → en grand à côté de A).
   Ne bloque pas.

## Sa phrase, prédite
« C c'est mieux pour les tropicaux, Idaho 7 est là. Mais en agrumes c'est toujours Citra Centennial Amarillo, ça change
rien ??? Et Mandarina qui recule, pourquoi ? Pourquoi Citra est en bas dans B ? »

## Verdict : CORRIGER D'ABORD (deux lignes de texte, rien dans l'app), puis MONTRER
- Obligatoire avant de montrer : défaut 1 (ligne sous B et D) et défaut 2 (Mandarina dans l'encart). Sans eux, il choisit
  entre quatre listes sur une image fausse de B et D, et sur une régression inexpliquée de C.
- Souhaitable, même passe : défauts 5 et 6.
- Hors page, à consigner : défauts 3 et 4 (app), à lui poser comme questions d'app, pas sur cette page.
- Préférence du concepteur (C) : je la partage, avec sa réserve sur les agrumes ; il tranchera probablement C pour les
  tropicaux et dira que les agrumes ne vont encore pas, ce que la page montre honnêtement.
