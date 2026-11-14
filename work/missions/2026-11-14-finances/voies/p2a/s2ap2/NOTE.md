# s2ap2 — frise des jours à poignées, passe 2 (tiède)
**Idée** : sous les piles, la frise des jours (hauteur = dépense du jour) ; deux poignées rondes bornent la plage. Quatre images : repos, glisser, après, à cheval.
**Défauts du critique** :
1. +62 px au repos → frise repliée ; repos = v6a + une icône 14 px (frise et poignées) dans la pilule, à côté de « novembre » ; toucher « novembre » la déplie.
2. Poignées ‖ « pause » → ronds de 24 px à bord bleu de 3 px, zone 44 px ; tenue : halo et bulle « 1er → 15 nov. » au-dessus (greffe s3d).
3. Pas d'à cheval → poussée contre le bord, la frise glisse sur le mois voisin : « 15 oct. → 10 nov. », 27 jours, trait pointillé au 1er nov., « du 15 au 31 oct. · aucune opération saisie » (greffe s2c : inconnu ≠ 0, ni point ni barre en octobre).
4. Barres du 9 et du 25 d'apparence égale → elles étaient à l'échelle (28 et 34 px pour 325,40 et 400,00) ; le point vert de la vente, posé sur la barre, la grandissait : il descend sur l'axe.
**Greffes** : ‹ › glissent la plage (pilule teintée « ‹ 1er → 15 nov. › », plus de « novembre » contradictoire) ; repères des lundis (2, 9, 16, 23, 30) ; IA qui suit la plage.
**Montants** : 1er–15 et 15 oct.–10 nov. : Fixes 68,00 ; payé 325,40 · à payer 0,00 · dépensé 296,80 ; loyer 400,00 « hors plage » sous Charges fixes.
**Boosters** : `frise-poignees`, `glisser-plage` ; v6a : piles-basses, lignes-entieres, paye-sur-ligne, pastille-retard. B10 : 0 type=number. B9 : le glisser a son équivalent au toucher (‹ ›, toucher un jour).
**Ce qui casse** : une fois dépliée, la frise ajoute ~70 px au bandeau ; le 9 et le 10 serrés à cheval (11 px par jour).
