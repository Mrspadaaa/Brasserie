# s3a — préréglages qui dessinent leur durée
**Idée** : sous la pilule, cinq puces « 7 j · 30 j · ce mois · trimestre · du … au » ; chacune porte un trait à la longueur de sa durée ; « du … au » ouvre deux dates.
**Chaleur** : chaude (forme libre de l'axe s3a). Base v6a telle quelle ; seule la rangée de puces (36 px) s'ajoute.
**Geste au doigt** : toucher « du … au » → deux champs « du 1er nov. » / « au 15 nov. » (sélecteur natif `input type=date`, jamais number) ; la pilule devient « ‹ 1er – 15 nov. › » et ‹ › avancent de 15 j (la période glisse, sa durée reste). « ce mois » ramène à novembre.
**Après (1er → 15 nov.)** : loyer (25 nov.) sorti ; Fixes 68,00 ; payé 325,40 · à payer 0,00 · dépensé 296,80 ; retard 2025 gardé à part, comme v6a.
**Boosters** : `prereglages` (puces, trait de durée), `deux-dates` (champs natifs), pilule qui pas à pas suit la plage.
**Cibles** : puces 36 px de haut (zone de toucher 44 px par ::after), champs 36 px ; « ✓ Payé » 24 px inchangé.
**Ce qui casse** : +36 px au repos dans la bande (la règle « léger au repos » est tendue) ; 7 j / 30 j relatifs à aujourd'hui (9 nov.) débordent sur octobre, où cette maquette n'a pas de données (afficher « inconnu », jamais 0).
