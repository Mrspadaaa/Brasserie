# r4 — Ce qui me manque : la file à la taille de mes heures (chaude)

- **Chaleur** : chaude (forme libre), dans la langue de l'app (violet de l'Agenda, pastilles, feuille du bas, barre du bas).
- **Axes** : place = un écran à lui, ouvert depuis le Bord ; forme = file ordonnée (poignée ⋮⋮ et flèche ↑) ; mot = « Ce qui me
  manque » (ses mots) ; temps = une fin estimée seulement si heures et rythme sont connus ; argent = le reste à payer seul ;
  étapes = « Noter l'achat » seul.
- **L'idée** : chaque manque est un bloc dont la hauteur suit ses heures restantes (une ligne fine par heure) ; une règle à gauche
  cumule les heures ; la file se termine par un drapeau « Fin » qui ne donne une date que si tout se calcule.
- **Une question** (L10) : seul facteur libre, l'ordre ; heures et argent dans le récap et sur les blocs.

## Honnêteté
- Jour 1 : cinq blocs hachurés (heures inconnues), « ? » sur la règle, « Fin : heures à estimer ». Aucun chiffre.
- La règle s'arrête de compter au premier bloc inconnu (« ? » ensuite, trait pointillé) : jamais de cumul faux.
- « Fin : rythme à régler » tant que le rythme (heures par semaine, hypothèse 4, hors du premier plan : au bout de la file)
  n'est pas saisi. État `caisse` (axe argent = reste seul, donc joué sur le temps) : armoire estimée 4 h, rythme 6 h → semaines
  s1 à s4 sur la règle, « Fin estimée · 5 semaines à 6 h ≈ 06.12 » (01.11 + 5 semaines), et le récap « Reste à payer » pressé
  pose le reste sur chaque bloc.
- Dépassé : « dépassé +152,40 » sur le bloc ; le reste à payer passe à 1 640,00.
- Fait hors de l'app : barré, « hors de l'app », sans montant.

## Ce qui vient de la base
En-tête, barre du bas et +, teinte de l'Agenda (violet `area-agenda`) pour le temps, rayons 10/16/24, feuille du bas,
« Noter l'achat ». Plancher enrichi : le récap en deux tuiles touchables (goût sourcé « un récap en haut… avec la possibilité de
clicker et avoir des renvois »), le pas d'heure − / +, les causes de blocage en puces (hypothèse 3), l'ajout « à la suite » au
bout de la file.

## Boosters UX (boosters-ux)
- `file-heures` — lire ; blocs à la hauteur des heures, règle cumulée (r4-encours-390).
- `ordre` — choisir ; flèche ↑ (équivalent du glisser, B9) ; la règle se recalcule (r4-geste-site-plus-tot).
- `recap-heures`, `recap-payer` — suivre ; tuiles touchables ; le reste par bloc s'affiche (r4-geste-recap-payer).
- `fin` — suivre ; drapeau ; « rythme à régler » ouvre le réglage (r4-geste-rythme-a-regler).
- `heures`, `cause`, `noter-achat` — dans la feuille (état `ouvert`, site vitrine) ; `noter`, `nature` — état `ajout`.
- B1 OK (9 marqués, 3 gestes) ; B2 OK (la file) ; B6 12 / 14 / 16 ; mono pour heures et montants seulement.
- Écart voulu : les blocs sont en partie blancs (leur hauteur est la donnée), ce qui pèse sur le remplissage du PANEL.

## Contrôles
Voir `../r-RESULTAT.md`.
