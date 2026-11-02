# r1 — Rénovation, une carte du Bord (froide)

- **Chaleur** : froide. Les formes de l'app telles quelles (cartes teintées du Bord, lignes, chevrons, feuille du bas), une carte de plus.
- **Axes** : place = le Bord, une ligne « Ensuite » et la liste à un toucher ; forme = liste par état avec pastilles ; mot =
  « Rénovation » ; argent = rien tant qu'aucun prix, puis le reste à payer seul ; temps = aucun ; étapes = « Noter l'achat » seul.
- **L'idée** : la rénovation devient une cinquième carte du Bord, en tête : « Ensuite » en gras, les autres numérotés avec une flèche
  « faire ensuite », et un champ « Noter un manque » au pied de la carte.
- **Une question** (L10) : « Qu'est-ce qui me manque, et qu'est-ce que je fais ensuite ? » ; seul facteur libre : la place d'un
  manque dans la suite (flèche ↑ = le passer en « Ensuite »).

## Ce qui vient de la base
En-tête de l'app, barre du bas et +, cartes teintées du Bord (Brassins, Stocks, Finances, Agenda, Échéances et démarches) avec
leur en-tête teinté, leur action « Tous / Voir / Gérer › », leurs rayons de 16 px ; feuille du bas de l'app (rayon 24) ;
« Noter l'achat » et achat + livraison + installation de `UpgradeWorkspace` / `upgrades.ts`. Plancher enrichi : une teinte de
domaine en plus (ardoise-bleu `#2C6670`, « Rénovation »), le champ d'ajout dans la carte, la nature devinée et corrigible d'un
toucher (hypothèse 2), les pastilles d'état (goût sourcé « les pastilles sur les items », SPEC l. 897).

## Honnêteté
- Jour 1 : ses cinq titres, aucune pastille, aucun chiffre, aucune ligne d'argent.
- La ligne « Reste à payer » n'apparaît qu'avec un prix connu, et dit « +1 à estimer » à côté du total (armoire) ; le site
  « sans achat » n'y entre pas. Jamais 0 pour un inconnu.
- Dépassé : « +152,40 au-delà » en rouge, barre pleine rouge, « 1 012,40 / 860,00 CHF » dans la feuille.
- Fait hors de l'app : barré, pastille « hors de l'app », sans montant.
- Aucune date, aucune fin, aucune caisse : l'axe argent de r1 est le reste seul (état `caisse` = le détail du reste à payer, ses
  renvois vers chaque manque).

## Boosters UX (boosters-ux)
- `ensuite` — suivre ; rangée en tête, pastille pleine « Ensuite » ; ouvre le manque.
- `monter` — choisir (la place) ; flèche ↑ par rangée ; le manque passe en « Ensuite » (r1-geste-monter-armoire).
- `pastille-etat` — lire ; pastille forme + mot (devis cerclé, payé plein, en cours demi, attend en pointillé ocre, dépassé rouge).
- `reste` — suivre ; ligne de contexte touchable ; ouvre le reste par manque, chaque ligne renvoie au manque (r1-geste-reste-ouvert).
- `noter` — déclencher ; champ d'un titre dans la carte ; `nature` — corriger ; trois puces, la devinée pressée (r1-geste-nature-achat).
- `noter-achat`, `cause` — déclencher ; dans la feuille du manque.
- B1 OK (8 boosters marqués, 3 gestes capturés) ; B2 OK (la rangée « Ensuite » en 16 px gras domine ; une seule action noire,
  dans la feuille) ; B3 voir MOTS ; B6 OK (12 / 14 / 16, mono pour les montants) ; B7 voir CONTRASTE ; B13 flèches 32 × 32.
- Écart voulu : B10 « noter d'une main » — le champ est dans la carte, en haut de l'écran (forme froide : la carte telle qu'une
  carte du Bord) ; le pouce l'atteint mal sur un grand téléphone. r2, r3 et r4 le posent en bas.

## Contrôles
Voir `../r-RESULTAT.md` (sorties recopiées).
