# Dossier ecr4

## Sa demande (23.11, mot pour mot)
« Mais revoir la partie écriture sur la vrai app, et voir si tout est bien dynamique et bien voir si tout s'affiche sur le calendrier »

## Constats du test en ligne du tour 41 (BUGS.md, mot pour mot)
 E40-4 | Test en ligne, tour 40 (écritures) | Finances › Opérations › écriture › Modifier, et Calendrier › Ouvrir › Modifier (390 px, en ligne index-CRA3EhuZ.js) | Ouvrir Modifier sur ZZ TEST — Achat et ZZ TEST — Vente → observé : Revient, Règlement, Référence, Note et coche y sont, mais la fiche reste autre que la saisie : Nom et « catégorie, précision » en champs, « Montant sans TVA », date en champ sans pastille ni curseur, pas d’en-tête « Ça sort / Ça rentre · sorte · changer », pas de grand montant (suite de E38-4) ; attendu : la même feuille que la saisie | m | en cours — en ligne index-DwEuRObA.js (tour 41), 24.11 : en-tête sens · sorte, carte, pastille et curseur de date présents ; r
 E41-1 | Test en ligne, tour 41 (écritures) | Finances › Opérations › ZZ TEST — Achat › Corriger une erreur de saisie › Retirer (390 px, en ligne index-DwEuRObA.js) | Achat 4,50 payé 19.11 avec un Remboursement +1,00 lié → observé : « Confirmer le retrait » touché 15 fois, l’achat reste dans Opérations, sans message (journal voies/critique-41/supp.log) ; une fois le remboursement retiré, l’achat part au premier essai ; attendu : le retrait se fait (et dit ce que devient l’avoir) ou l’app dit pourquoi elle refuse | B | ouvert — présent (en ligne index-DwEuRObA.js, 24.11) 
 E41-2 | Test en ligne, tour 41 (écritures) | Saisir à la main › Remboursement › « De quelle pièce ? » (390 px, en ligne index-DwEuRObA.js) | Chercher « masque », « 23 », « Brau » → observé : « Aucune pièce ne correspond » ; la liste ne montre que les écritures ZZ saisies à la main, alors que « consomable ( masque gant) 23,00 payé 19 nov. » et « Brau- und Rauchshop 110,40 payé 27 avr. » existent ; attendu : toutes ses pièces payées ou encaissées, trouvables par nom et montant | B | ouvert — présent (en ligne index-DwEuRObA.js, 24.11) 
 E41-3 | Test en ligne, tour 41 (écritures) | Calendrier, bande récurrente ZZ TEST — Apport, carte (390 px, en ligne index-DwEuRObA.js) | Toucher la bande « +5 / mois » → observé : la carte propose « › Facturer » (Pour moi et Abonnement : « Ouvrir ») ; on ne se facture pas un apport privé ; attendu : « Ouvrir » (ou rien qui parle de facture) | m | ouvert — présent (en ligne index-DwEuRObA.js, 24.11) 
 E41-4 | Test en ligne, tour 41 (écritures) | Finances › Opérations › écriture › Modifier, et Calendrier › Ouvrir › Modifier (390 px, en ligne index-DwEuRObA.js) | Ouvrir Modifier sur ZZ TEST — Achat et ZZ TEST — Vente → observé : en-tête « Ça sort · Achat » sans « changer », montant en petit (−3,50 sur une ligne), Payé/À payer et compte sortis de la carte dans « Règlement », bloc « Pas encore de pièce » en tête ; attendu : la même feuille que la saisie (suite de E40-4) | m | ouvert — présent (en ligne index-DwEuRObA.js, 24.11) 
 E41-5 | Test en ligne, tour 41 (écritures) | Modifier › date d’un achat payé (390 px, en ligne index-DwEuRObA.js) | ZZ TEST — Achat payé le 19.11, curseur de date glissé au 04.11, Enregistrer → observé : seule la fiche dit « Brassage · 4 nov. 2026 » ; Opérations « payé 19 nov. », Calendrier « 19 nov. », paiements « 19 nov. » ; en saisie la date choisie est celle du paiement ; attendu : la date bouge partout (ou la feuille dit que seul le paiement compte) | m | ouvert — présent (en ligne index-DwEuRObA.js, 24.11) 
 E41-6 | Test en ligne, tour 41 (écritures) | Saisir à la main, curseur de date (toutes les sortes) (390 px, en ligne index-DwEuRObA.js) | Glisser le curseur vers la droite → observé : il bute au 24.11 avec « Pas de date après le 24 nov. » ; toute la partie droite (après aujourd’hui, repère « déc. ») ne sert à rien, et le seul mois écrit est « déc. » alors que la date est en novembre ; attendu : un curseur qui finit à aujourd’hui et nomme le mois où l’on est | m | ouvert — présent (en ligne index-DwEuRObA.js, 24.11) 

## Rapports
voies/critique-41/RESULTAT.md et cap/ ; voies ecr2, ecr3 (RESULTAT.md : où vit chaque règle ; Modifier, « changer » non câblé).

## Règles
- Retirer une écriture liée (remboursement) : soit on retire les deux après un mot clair, soit un message dit pourquoi ; jamais un bouton muet.
- « De quelle pièce ? » : les pièces payées réelles, cherchables.
- Apport : pas de « Facturer ».
- Modifier = la feuille de saisie, « changer » câblé ; changer la date d'un achat payé se voit partout (Opérations, Calendrier).
- Curseur de date : toute la piste vivante (avenir compris, ou butée visible) ; le mois écrit est celui de la date.

## Registre
Passer E38-6 à « vérifié — en ligne index-DwEuRObA.js (tour 41), 24.11 » (preuve voies/critique-41/RESULTAT.md).
