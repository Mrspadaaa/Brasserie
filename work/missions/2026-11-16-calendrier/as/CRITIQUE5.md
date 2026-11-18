OK — 11 problèmes, 5 bloquants

# Critique passe 5 (17.11) — calendrier `as` (cal.html, cal-paysage.html)

Version : arbre de travail du 17.11 (non commité), captures `cap/critique5/` du jeu de 10 h 48 à 10 h 57 (390 × 844 tactile et 844 × 390, clair).
Toutes ouvertes : planches `_pl-p-00` à `10`, `_pl-l-00` à `12`, plus `s-blonde-p`, `s-l-achat-chev`, `s-nouv-appui-brassage`.
Contrôles rejoués depuis la racine : `controle-plus-agit cal.html` **PLUS-AGIT OK** (8/8, 0 case « + ») ; `controle-geste-bruit cal.html` **BRUIT OK** (3/3, 1 message, 1 ligne).
Hors périmètre demandé : thème sombre et 1280 non capturés.

Ses deux plaintes sont tenues : un seul message après un geste (2 lignes et 2 boutons, le détail au chevron), fantôme discret, plus de cases « + » ;
le + volant et chaque + de rangée ouvrent une feuille et posent la chose, la caisse suit. Mais l'ajout s'arrête à la pose.

Phrase prédite : « C'est beaucoup plus lisible. Mais ce que j'ajoute, je peux rien en faire, et les totaux bougent pas. »

| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| p-f1a-f2a-f6b, s-blonde-p | clair | 390 | allonger puis décaler la Blonde | 1 | 1 |
| p-fab-touche, s-nouv-tap-* | clair | 390 | toucher une chose ajoutée | 1 | 1 |
| p/l-r-*-calme (brassage, charge, vente) | clair | 390, 844 | après ajout | 1 | 1 |
| l-r-achat-pose, s-l-achat-chev | clair | 844 | ajout Achats en S47 | 1 | 1 |
| p/l-fab-pose, p/l-r-brassage-pose | clair | 390, 844 | brassin ajouté | 2 | 1 |
| p-autre-t-01, p-autre-c-01 | clair | 390 | bandeau après geste | 1 | 0 |
| l-f2a-apres, l-f6b-apres | clair | 844 | après geste sur la Blonde | 1 | 0 |
| l-autre-*, l-*-pose | clair | 844 | bandeau Annuler | 1 | 0 |
| p-r-*-feuille | clair | 390 | feuille d'ajout | 1 | 0 |
| p/l-r-vente-pose | clair | 390, 844 | vente probable posée | 1 | 0 |
| p-repos, l-repos, autres | clair | 390, 844 | repos, f1a, f2a, f6b, appui long | 0 | 0 |

## Problèmes (graves d'abord)

1. **Valeur fausse (bloquant).** La Blonde allongée à 35 j puis décalée garde sur sa barre « J0 / 35 · prête 21 déc. », alors que l'alerte dit « prête le 4 janv. » (brassée dès le 30 nov.). En portrait, le texte est en plus coupé au bord de l'écran (« prête 21 »). p-f1a-f2a-f6b, s-blonde-p ; sonde `blonde-p.apresDecaler`.
2. **Geste sans effet (bloquant).** Toucher une chose posée par le + n'ouvre rien (brassin, vente, achat, papier), alors qu'un toucher sur le Porter ouvre son détail. Seul l'appui long donne le menu. p-fab-touche identique à p-fab-pose ; sonde `nouv-tap-*` vides.
3. **Valeur fausse (bloquant).** La pastille de la rangée ne bouge pas après un ajout : Brassins reste −324 après « Essai brassage −100 », Papiers −806 (−1 986 en paysage) après −100, Ventes +900 après Café du Pont +130 ; pourtant la tête passe de 113 à 13 ou 243. La rangée et la caisse se contredisent. p-r-brassage-calme, p-r-charge-calme, p-r-vente-calme, l-r-charge-calme ; sonde `puce-*` avant = après.
4. **Illisible (bloquant), paysage.** Un achat ajouté en S47 se pose sur l'en-tête de la rangée : « + Achats », l'œil et « Essai achat −100 » se chevauchent. l-r-achat-pose, l-r-achat-calme, s-l-achat-chev.
5. **Valeur fausse, sens métier (bloquant).** Un brassin ajouté est une case d'une semaine, sans recette, sans temps en cuve, sans date « prête », à côté de la Blonde J0 / 28 et du Porter. Un brassin d'une semaine n'existe pas ; il ne peut ni tenir une promesse ni occuper une cuve. p-fab-pose (Saison de printemps −420), p-r-brassage-pose, l-r-brassage-pose.
6. **Illisible.** Les bandeaux sont coupés en portrait : « Ranger la réserve : … » (on perd S48 → S49), « Charge fixe : elle se règle dans Financ… ». p-autre-t-01, p-autre-c-01.
7. **Pas pratique, paysage.** Après un allongement ou un décalage de la Blonde, la vue descend sur l'alerte et la barre bougée sort de l'écran : on ne voit plus ce qu'on vient de faire. l-f2a-apres, l-f6b-apres, l-f1a-puis-f2a.
8. **Pas à sa place, paysage surtout.** Le bandeau Annuler couvre une bande entière de la frise sur 390 px de haut : Travaux et Activités (l-autre-a-04), la barre du loyer (l-autre-t-01), la rangée Ventes (l-fab-pose, l-r-evenement-pose). En portrait, il couvre l'icône −312 des Papiers (p-fab-pose).
9. **Pas pratique.** En portrait, la feuille d'ajout ne propose que S47 à S52 : impossible de poser un brassin ou un achat en janvier sans tourner le téléphone (le paysage offre jusqu'à S6). p-r-*-feuille.
10. **Pas à sa place.** La vente probable posée (Café du Pont, 1 fût) devient une barre d'une semaine, alors que les livraisons ponctuelles de la rangée sont des pastilles (+260, 3 fûts). p-r-vente-pose, l-r-vente-pose.
11. **Pas à sa place.** Le brassin ajouté en S50 colle au chariot du Marché de Noël (rangée Fêtes) : la case touche l'icône, on croit qu'il appartient aux Fêtes. p-fab-pose, l-fab-pose, l-fab-touche.

## Doutes (non comptés)
- Le signe vient du genre : une Fête est toujours +, un Travaux toujours −. Une fête peut coûter (stand, location).
- L'alerte s'insère dans la frise et pousse Achats et la suite de 120 px environ ; la page saute à chaque geste.
- « Caisse : S47 4 032 → 4 180, la suite inchangée » : S48 et S49 changent aussi (+148) jusqu'à la nouvelle date de brassage.
- Après « Livrer le 5 janv. », le repère des 3 fûts part en S53, hors des 6 semaines (noté au journal, non capturé ici).
- Trois points noirs et un point rouge sur la barre de la Blonde allongée : sens non dit au premier regard.

## Note
6/10. La passe a progressé : les deux plaintes du 17.11 sont réglées et les deux contrôles passent. Il reste 5 bloquants, dont 4 tiennent à l'ajout qui ne va pas au bout : la chose posée ne se touche pas, ne compte pas dans sa rangée, se pose sur un en-tête, et un brassin n'a pas de durée. Il en reste un sur le geste : la barre de la Blonde affiche une date fausse.
