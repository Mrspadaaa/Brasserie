# s3d — la règle du mois
**Idée** : sous les piles, le mois devient une règle de 30 jours où l'on voit quand l'argent bouge (le 9 : encaissé et payé ; le 25 : loyer à payer, hachuré) ; deux poignées la pincent du jour au jour.
**Chaleur** : chaude (libre). Base v6a telle quelle ; la règle (60 px) s'ajoute au bas de la bande, discrète au repos (gris, poignées aux bouts).
**Geste au doigt** : glisser la poignée de droite jusqu'au 15 : bulle « 1er → 15 nov. », jours 16–30 hachurés, le loyer s'efface, piles et lignes suivent en direct (calcul local). Toucher un jour pose la poignée la plus proche (équivalent sans glisser). « ↺ tout le mois » revient.
**À cheval** : pousser la poignée de gauche contre le bord fait défiler la règle en octobre (pas de données d'octobre ici : inconnu, pas 0).
**Après** : Fixes 68,00 ; payé 325,40 · à payer 0,00 · dépensé 296,80 ; pilule grisée.
**Boosters** : `regle-du-mois` (curseur de plage à deux poignées, frise de flux, bulle de lecture).
**Cibles** : poignées 24 px (zone 48 px par ::after) ; « ✓ Payé » 24 px inchangé.
**Ce qui casse** : +60 px de bande au repos ; deux poignées à 12 px l'une de l'autre se gênent sur une plage d'un jour (prévoir la poignée la plus proche du doigt) ; marques de flux à l'échelle : un seul jour chargé écrase les autres.
