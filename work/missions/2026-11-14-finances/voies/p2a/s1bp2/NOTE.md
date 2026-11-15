# s1bp2 — la pilule s'étire en deux bornes, passe 2 (froide)
**Idée** : toucher « novembre » étire la pilule en « ‹ 1er — 30 nov. › » ; chaque borne ouvre le sélecteur natif ; ‹ › font glisser la plage entière. Quatre images : repos, geste, après, appui.
**Défauts du critique** :
1. « 1 — 15 nov. » → « 1er — 15 nov. ».
2. Bornes de 26 px → 32 px dans une pilule de 36 px, zone de toucher 44 px (::after) ; ‹ › aussi à 44 px de zone.
3. Pastille « hors plage » en bas de liste → ligne « hors plage » grise sous Charges fixes, 400,00 non mis à 0 (greffe s2a) ; la pastille du bas est retirée.
4. Signe |↔| muet → gardé, et au premier toucher une bulle « du … au : touche une date » sous les bornes.
5. Rangée du haut pleine → en plage, la ligne 2 porte la durée « 15 j · 5 opérations » (greffe s1d) et la pastille « en retard » ; « 15 oct. — 10 nov. » tient donc en ligne 1.
**Greffe aperçu** : la ligne permanente des flèches est retirée ; à l'appui sur ‹, une bulle « lâcher : ‹ 17 → 31 oct. » (image appui).
**Montants** : plage 1er–15 : Fixes 68,00 ; payé 325,40 · à payer 0,00 · dépensé 296,80 ; mois entier (geste) : 30 j · 6 opérations, à payer 400,00 · dépensé 696,80.
**Boosters** : `pilule-etiree`, `glisser-plage`, `duree-plage` ; v6a : piles-basses, paye-sur-ligne, pastille-retard. B10 : dates natives, 0 type=number.
**Écart voulu** : en plage seulement, la pastille « en retard » descend d'une ligne (+34 px) ; au repos, v6a telle quelle.
