# s2d — « brush » : l'histogramme des jours sert de sélecteur, les piles suivent
**Idée** : au-dessus des piles, l'histogramme quotidien du mois ; on y glisse le doigt pour tracer une fenêtre, qu'on déplace d'un bloc ou qu'on étire par ses bords ; les piles montrent la fenêtre, le mois en pointillé. **Chaleur** : tiède.
**Geste au doigt** : glisser du 9 au 15 sur l'histogramme (surface 354 × 46 px) ; la fenêtre se déplace d'un bloc (semaine suivante) ; × dans l'étiquette revient au mois. Le mois ‹ › reste intact.
**Après (lun. 9 → dim. 15 nov.)** : jours hors fenêtre estompés ; pile Fixes pleine 68,00 dans un contour pointillé de 468,00 (le mois) ; payé 325,40 · à payer 0,00 · dépensé 296,80 ; loyer « hors plage ».
**Boosters** : `brush-jours` (ajuster ; fenêtre glissée sur l'histogramme), piles fantômes (comparer plage/mois), plus v6a.
**Différence avec s2a** : pas de poignées au repos ; une fenêtre qui se promène (semaine par semaine) ; repères des lundis ; le graphe garde le mois en fantôme.
**Ce qui casse** : +62 px au repos ; « glisser sur les jours » est la seule invite (3 mots) ; l'étiquette de fenêtre passe au-dessus de l'histogramme et peut toucher la pilule si la fenêtre est très à gauche.
**Baseline** : v6a telle quelle ; seul ajout : l'histogramme et le contour fantôme après.
