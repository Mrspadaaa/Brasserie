# Dossier — test en ligne des écritures (tour 41, index-DwEuRObA.js), 23.11 soir

## Sa demande (mot pour mot)
« Mais revoir la partie écriture sur la vrai app, et voir si tout est bien dynamique et bien voir si tout s'affiche sur le calendrier »
Ses plaintes du soir sur ce sujet (captures dans work/missions/2026-11-23-reprise-soir/plaintes/, ouvre-les) : « la vue apport … s'affiche pas sûr le calendrier... Et elle diffère des autres vue, et il y a pas de coche pour dire que il y a pas de justificatif » (2334, 2335, 2336, 2337) ; « Le slider met pas à jour la date en dynamique » (2339) ; avis « Nouvelle version » posé sur l'en-tête (2339). Une voie les corrige déjà : les retrouver est attendu, en trouver d'AUTRES est le but.

## Consignes du brasseur (SUIVI.md)
1. Tests sur l'app DÉPLOYÉE. 2. Chaque actionneur, sur des données « ZZ TEST — … » que tu crées ; regarder seul = non couvert. 8. « Non c'était des exemples ils doivent TOUT tester... » : capture avant/après, effet sur tout ce qui en dépend (même nombre partout), résultat plausible en vrai.
23.11 : « jamais utiliser le chrome in claude » ; « et jamais fermé le chrome de débug ».

## Où
- https://brasserie-l-affinee.web.app dans le Chrome de débug : puppeteer-core connect 127.0.0.1:9222, ton onglet neuf, 390 × 844, deviceScaleFactor 2, toucher. Fin : page.close() de ton onglet, browser.disconnect(). JAMAIS browser.close().
- Paquet : vérifie index-DwEuRObA.js (curl). Si l'onglet sert un ancien paquet, recharge.
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

## Constats à rejouer (corrigés au tour 41 : ecr3 6d3412bed)
 E35-3 | Test en ligne, tour 35 (écritures) | Saisir à la main › Ça rentre › Autre (pas un prêt) (390 px, en ligne index-r1awkHAF.js) | Enregistrer ZZ TEST — Autre entrée +1,10 → observé : titre par défaut « Recette du 23.11 », étiquette « Ventes » dans la fic
 E35-4 | Test en ligne, tour 35 (écritures) | Saisir à la main, curseur de date (Vente, À recevoir) (390 px, en ligne index-r1awkHAF.js) | Glisser lentement le curseur vers le passé → observé : au dernier pas, curseur « 8 oct. » et titre « Vente du 08.10 » ; a
 E35-11 | Test en ligne, tour 35 (écritures) | Finances › Opérations › écriture › Modifier (390 px, en ligne index-r1awkHAF.js) | Ouvrir Modifier sur ZZ TEST — Achat → observé : autre fiche que la saisie (Nom, Catégorie, Précision, Date, Montant « sans TVA », 
 E35-16 | Test en ligne, tour 35 (écritures) | Saisir à la main › Impôts › Impôt sur la bière (390 px, en ligne index-r1awkHAF.js) | Enregistrer → observé : étiquette « Autres frais » ; attendu : « Impôts » ou « Impôt sur la bière » | D 
 E38-4 | Test en ligne, tour 38 (écritures) | Finances › Opérations › écriture › Modifier (Achat et Vente) (390 px, en ligne index-DU-8kJuj.js) | Ouvrir Modifier → observé : autre fiche que la saisie : champs en colonnes (Nom, Catégorie, Précision, Date, Monta
 E38-6 | Test en ligne, tour 38 (écritures) | Calendrier, récurrentes à payer (Salaire mois, Loyer trim.) (390 px, en ligne index-DU-8kJuj.js) | ZZ Salaire et Loyer à payer d’ici le 23.12, Revient → observé : la 1re occurrence est placée à son échéance (23 déc
 E40-1 | Test en ligne, tour 40 (écritures) | Saisir à la main › Apport et Pour moi, Revient Mois 6 mois, puis Calendrier et Finances › Prévisions (390 px, en ligne index-CRA3EhuZ.js) | Enregistrer ZZ TEST — Apport +5 et ZZ TEST — Pour moi −2,50, reçus/payés l
 E40-2 | Test en ligne, tour 40 (écritures) | Calendrier, rangée Ventes (390 px, en ligne index-CRA3EhuZ.js) | ZZ Vente +4,80 à recevoir 23.12, ZZ Apport +5 par mois, ZZ Autre entrée +1,10 → observé : Apport (tirelire), Autre entrée et le vrai « De ma poche +1
 E40-3 | Test en ligne, tour 40 (écritures) | Calendrier, rangée Papiers (390 px, en ligne index-CRA3EhuZ.js) | ZZ Pour moi −2,50 par mois (privé) → observé : rangé dans Papiers, compté dans la pastille « −617 prévu S48–S53 » (600 + 5 + 1,20 + 4 + 2 + 2,50 + 2
 E40-4 | Test en ligne, tour 40 (écritures) | Finances › Opérations › écriture › Modifier, et Calendrier › Ouvrir › Modifier (390 px, en ligne index-CRA3EhuZ.js) | Ouvrir Modifier sur ZZ TEST — Achat et ZZ TEST — Vente → observé : Revient, Règlement, Référence
 E40-5 | Test en ligne, tour 40 (écritures) | Calendrier, bande récurrente ZZ TEST — Apport (390 px, en ligne index-CRA3EhuZ.js) | Toucher la bande « +5 / mois » → observé : l’app passe à Finances, au bloc En caisse ; ni l’écriture ni sa prévision ne s’ouvrent
 E40-6 | Test en ligne, tour 40 (écritures) | Saisir à la main › Remboursement › « De quelle pièce ? » (390 px, en ligne index-CRA3EhuZ.js) | Ouvrir la liste → observé : elle propose ZZ Salaire, Loyer et Impôts encore à payer (rien de payé à rembourser) ; atte
 E40-7 | Test en ligne, tour 40 (écritures) | Saisir à la main › Remboursement › « De quelle pièce ? » (390 px, en ligne index-CRA3EhuZ.js) | Lire la liste → observé : Loyer, Salaire, Impôts, Abonnement, Autre sortie portent tous le chariot d’Achat, Autre entr

## Points signalés par la voie
- Modifier a le nouveau dessin (vérifié au DOM seulement) ; « changer » de la bande n'est pas câblé dans Modifier.
- Apport : visible dans la rangée Ventes avec sa tirelire, hors du total.
- E38-6 (occurrences suivantes de Salaire et Loyer) : avance la période du Calendrier (‹ › ou poignées) puis remets-la.

## Pièges
- Note la période du Calendrier au départ, remets-la à la fin. Ne touche jamais Annuler d'une carte de fin qui n'est pas la tienne.
