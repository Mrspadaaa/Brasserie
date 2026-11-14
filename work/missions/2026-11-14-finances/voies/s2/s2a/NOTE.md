# s2a — frise des jours sous le graphe, deux poignées
**Idée** : sous les piles de v6a, les 30 jours de novembre en traits (hauteur = dépense du jour, couleurs des catégories) ; deux poignées bornent la plage. **Chaleur** : tiède.
**Geste au doigt** : glisser la poignée de droite du 30 au 15 (cible 44 px de large, poignée visible 22 × 26) ; « × mois entier » revient au mois. Le mois ‹ › reste le geste premier, inchangé.
**Après (1er → 15 nov.)** : jours 16–30 estompés, loyer du 25 dehors ; Fixes 68,00 ; payé 325,40 · à payer 0,00 · dépensé 296,80 ; ligne « hors plage » pour le loyer (400,00 en gris, pas à 0).
**Boosters** : `frise-poignees` (ajuster ; frise + 2 poignées ; piles, clé et liste suivent), `piles-basses`, `lignes-entieres`, `paye-sur-ligne`, `pastille-retard` (v6a).
**Honnêteté** : jour sans dépense = point (zéro connu), jamais une barre inventée ; la vente du 9 = pastille verte.
**Ce qui casse** : +62 px au repos dans le bandeau (la frise est toujours là) ; novembre a 30 jours (pas 31) ; à cheval sur deux mois, la frise d'un seul mois ne suffit pas (s2c).
**Baseline** : v6a telle quelle (rangées, ✓ Payé 24 px, + pièce, mois ‹ ›, piles) ; seul ajout : la frise. Le retard 2025 reste affiché (dette, hors période).
