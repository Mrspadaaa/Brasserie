# Dossier — test en ligne des écritures (tour 43), 23.11 soir

## Sa demande (mot pour mot)
« Mais revoir la partie écriture sur la vrai app, et voir si tout est bien dynamique et bien voir si tout s'affiche sur le calendrier »
Ses plaintes du soir sur ce sujet (captures dans work/missions/2026-11-23-reprise-soir/plaintes/, ouvre-les) : « la vue apport … s'affiche pas sûr le calendrier... Et elle diffère des autres vue, et il y a pas de coche pour dire que il y a pas de justificatif » (2334, 2335, 2336, 2337) ; « Le slider met pas à jour la date en dynamique » (2339) ; avis « Nouvelle version » posé sur l'en-tête (2339). Une voie les corrige déjà : les retrouver est attendu, en trouver d'AUTRES est le but.

## Consignes du brasseur (SUIVI.md)
1. Tests sur l'app DÉPLOYÉE. 2. Chaque actionneur, sur des données « ZZ TEST — … » que tu crées ; regarder seul = non couvert. 8. « Non c'était des exemples ils doivent TOUT tester... » : capture avant/après, effet sur tout ce qui en dépend (même nombre partout), résultat plausible en vrai.
23.11 : « jamais utiliser le chrome in claude » ; « et jamais fermé le chrome de débug ».

## Où
- https://brasserie-l-affinee.web.app dans le Chrome de débug : puppeteer-core connect 127.0.0.1:9222, ton onglet neuf, 390 × 844, deviceScaleFactor 2, toucher. Fin : page.close() de ton onglet, browser.disconnect(). JAMAIS browser.close().
- Paquet : vérifie (paquet du tour 43, vérifie-le par curl) (curl). Si l'onglet sert un ancien paquet, recharge.
- Avant tout : note « CHF à dépenser », le solde de chaque compte (Banque, Caisse, Autre…) et « Mon mois » ; à la fin, après suppression de tous les ZZ, ils doivent revenir EXACTEMENT aux mêmes valeurs.

## À jouer : chaque sorte d'écriture « à la main » (menu + › Écriture, puis « changer »)
Toutes les sortes de « Ça rentre » (Vente, Apport, Autre, … : liste-les toutes) et de « Ça sort » (toutes), chacune nommée « ZZ TEST — <sorte> », petit montant (≤ 5 CHF) :
- Chaque actionneur : titre (crayon), catégorie, date (pastille, curseur : la date suit-elle en direct ?), montant, Reçu/Payé aujourd'hui, À recevoir/À payer, compte, client/fournisseur, Revient ? (1×, Mois, Trim., Année), TVA et référence, justificatif ou coche « pas de justificatif », note.
- Dynamique : pendant la saisie, ce qui doit bouger bouge (Mon mois, bouton « Reçu +x », compte, date) ; après enregistrement : carte de fin, Annuler, Saisir un autre.
- Calendrier : chaque écriture se voit-elle dans une rangée ET sur la courbe, à la bonne date, avec le bon montant ? Une récurrente : chaque occurrence ? Une « à recevoir/à payer » : marquée prévue ?
- Cohérence entre sortes : même structure quand le sens est le même (la vue Apport diffère des autres : est-ce la seule ?).
- Modifier une écriture ZZ (depuis Finances et depuis le Calendrier), puis la supprimer : tout revient.
- Facture (lecture IA d'une photo) : non couverte ce soir (coût) ; le noter.

## Verdict
« combien et quels problèmes ? », liste numérotée, gravité B/m/D ; matrice sorte × actionneur × joué × vu dans RESULTAT.md ; chaque problème à work/missions/BUGS.md (préfixe E35-), format des lignes T28.

## Constats à rejouer (corrigés au tour 43 : ecr4 b9946ae38)
 E40-4 | Test en ligne, tour 40 (écritures) | Finances › Opérations › écriture › Modifier, et Calendrier › Ouvrir › Modifier (390 px, en ligne index-CRA3EhuZ.js) | Ouvrir Modifier sur ZZ TEST — Achat et ZZ TEST — Vente → observé : Revient, Règlement, Référence
 E41-1 | Test en ligne, tour 41 (écritures) | Finances › Opérations › ZZ TEST — Achat › Corriger une erreur de saisie › Retirer (390 px, en ligne index-DwEuRObA.js) | Achat 4,50 payé 19.11 avec un Remboursement +1,00 lié → observé : « Confirmer le retrait » to
 E41-2 | Test en ligne, tour 41 (écritures) | Saisir à la main › Remboursement › « De quelle pièce ? » (390 px, en ligne index-DwEuRObA.js) | Chercher « masque », « 23 », « Brau » → observé : « Aucune pièce ne correspond » ; la liste ne montre que les écriture
 E41-3 | Test en ligne, tour 41 (écritures) | Calendrier, bande récurrente ZZ TEST — Apport, carte (390 px, en ligne index-DwEuRObA.js) | Toucher la bande « +5 / mois » → observé : la carte propose « › Facturer » (Pour moi et Abonnement : « Ouvrir ») ; on ne s
 E41-4 | Test en ligne, tour 41 (écritures) | Finances › Opérations › écriture › Modifier, et Calendrier › Ouvrir › Modifier (390 px, en ligne index-DwEuRObA.js) | Ouvrir Modifier sur ZZ TEST — Achat et ZZ TEST — Vente → observé : en-tête « Ça sort · Achat » s
 E41-5 | Test en ligne, tour 41 (écritures) | Modifier › date d’un achat payé (390 px, en ligne index-DwEuRObA.js) | ZZ TEST — Achat payé le 19.11, curseur de date glissé au 04.11, Enregistrer → observé : seule la fiche dit « Brassage · 4 nov. 2026 » ; Opérati
 E41-6 | Test en ligne, tour 41 (écritures) | Saisir à la main, curseur de date (toutes les sortes) (390 px, en ligne index-DwEuRObA.js) | Glisser le curseur vers la droite → observé : il bute au 24.11 avec « Pas de date après le 24 nov. » ; toute la partie dr

## Points signalés par la voie
- Modifier et la piste de date vérifiés au DOM seulement : à juger à l'œil à 390.
- E41-5 : le paiement suit la date seulement si le montant ne change pas en même temps.

## Pièges
- Note la période du Calendrier au départ, remets-la. Ne touche jamais Annuler d'une carte de fin qui n'est pas la tienne.
