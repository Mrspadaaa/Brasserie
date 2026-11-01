# z4 — la frise : chaque fermentescible est posé sur le moment où il entre (chaude)

- **Chaleur** : chaude, forme libre.
- **Axes** : A1 la liste rangée par moment (frise verticale : empâtage, ébullition, fermentation) · A2 masse tapable sur place, ↑↓ · A3 champ toujours ouvert, famille qui tourne ; la ligne naît sur le moment de sa famille · A4 pastille de teinte, « ? » tiretée · **et le moment se glisse** : une puce se prend par sa poignée et se lâche sur un autre moment ; lâchée dans la fermentation, la règle des jours (J+0 à 14) donne J+n, qui se tape aussi.
- **Idée** : le rail qu'il aime pour les houblons, appliqué aux malts et sucres : on voit d'un coup d'œil ce qui entre à l'empâtage, à l'ébullition, en fermentation, et la masse de chaque moment.

## Baseline (J12, J5), cochée
- [x] en-tête, fil, bandeau, pied, + flottant, tels quels.
- [x] ligne : nom, moment (la phase), part, masse · [x] 5 familles · [x] famille figée (le moment bouge, pas la famille) · [x] masse à zéro à l'ajout (joué) · [x] jour d'ajout en fermentation : J+n sur la puce et un trait sur la règle (`z4-glisser-apres.png`) · [x] lactose et densité (annexe) · [x] clavier : nom, Entrée, masse (joué).
- Honnêteté : « ? » par grain ; EBC « — » puis « ~7,6 » ; OG « — » ; « 75 % repère » ; stock 0 mot ; les moments vides restent vides (c'est sa recette : tout à l'empâtage).

## Boosters UX (boosters-ux)
- Boosters : `frise-des-moments` — lire et ajuster ; glisser (pointer events) : la puce s'estompe, un fantôme suit le doigt, le moment visé s'éclaire (`z4-glisser-pendant.png`), la masse du moment se met à jour (empâtage 8 → 6,5 kg) · `regle-des-jours` — ajuster ; J+n par la position du lâcher, puis tapable · `champ-toujours-pret` · `famille-qui-tourne` · `couleurs-a-renseigner`.
- B1 OK · B2 OK (la frise domine) · B3 OK (57 mots) · B4 OK (un groupe par moment) · B5 OK · B6 OK (12/14/16) · B7 OK · B8 OK (vide : trois moments, vides ; lactose à l'ébullition, mangue J+5 en annexe) · B9 OK pour le glisser (retour sous le doigt immédiat, `touch-action:none`) · B10 OK · B11 OK (« tout est à l'empâtage ; rien à l'ébullition ni en fermentation ») · B12 OK · B13 OK (poignée 20 × 28, la puce entière est lisible).
- Écarts voulus : aucun.

## Tient / casse
- Tient : PAGE OK ; MOTS OK ; CONTRASTE OK ; STANDARD OK ; COMMUN : tout OK sauf COULEURS (1 teinte, voulu) ; le geste joué (Haferflocken → fermentation, J+3) sans erreur ; 1,0 écran.
- Casse : remplissage 0,33 au premier écran (panel) : deux moments vides sur trois, c'est l'état réel de sa recette ; avec un sucre à l'ébullition (`z4-sucre.png`) la frise se remplit. Le glisser n'a pas encore d'équivalent au clavier (B9 : à ajouter en passe 2, ↑↓ sur la poignée).

## Captures (ouvertes)
`z4-haut.png`, `z4-page.png`, `z4-couleurs.png`, `z4-saisie.png`, `z4-sucre.png` (dextrose à l'ébullition), `z4-glisser-pendant.png`, `z4-glisser-apres.png`, `z4-1280.png`.
