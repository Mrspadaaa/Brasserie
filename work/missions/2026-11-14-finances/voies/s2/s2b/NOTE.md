# s2b — calendrier du mois en feuille, mode plage (react-day-picker)
**Idée** : un bouton calendrier à côté du mois ouvre une feuille ; toucher le début puis la fin, comme react-day-picker `mode="range"`. **Chaleur** : tiède.
**Geste au doigt** : ▦ → toucher 1, toucher 15 (cases 44 px de haut, 7 colonnes de 53 px) → « Voir ». Trois images : repos, feuille, après.
**Feuille** : lundi d'abord (1er nov. 2026 = dimanche), plage en bande bleue, bouts noirs, aujourd'hui (9) cerclé, jours avec opérations pointés (5 points aux couleurs des catégories le 9, hachure « à payer » le 25), résumé « dim. 1er → dim. 15 nov. · 15 jours · le loyer du 25 reste dehors ».
**Après** : la pilule du mois devient une pilule noire « ▦ 1 → 15 nov. × » (× = retour au mois, flèches rendues) ; Fixes 68,00 ; payé 325,40 · à payer 0,00 · dépensé 296,80 ; loyer en ligne « hors plage ».
**Boosters** : `calendrier-plage` (choisir ; feuille ; dates pointées), `pastille-plage` (suivre ; × revient), plus ceux de v6a.
**Ce qui casse** : repos presque identique à v6a (+1 bouton 32 px) — c'est le but ; pendant la plage les flèches ‹ › disparaissent (× d'abord) ; la feuille masque le graphe pendant le choix.
**Baseline** : v6a telle quelle ; seul ajout : le bouton ▦ et la feuille.
