# Dossier — test en ligne des écritures (tour 44), 23.11 soir

## Sa demande (mot pour mot)
« Mais revoir la partie écriture sur la vrai app, et voir si tout est bien dynamique et bien voir si tout s'affiche sur le calendrier »
Ses plaintes du soir sur ce sujet (captures dans work/missions/2026-11-23-reprise-soir/plaintes/, ouvre-les) : « la vue apport … s'affiche pas sûr le calendrier... Et elle diffère des autres vue, et il y a pas de coche pour dire que il y a pas de justificatif » (2334, 2335, 2336, 2337) ; « Le slider met pas à jour la date en dynamique » (2339) ; avis « Nouvelle version » posé sur l'en-tête (2339). Une voie les corrige déjà : les retrouver est attendu, en trouver d'AUTRES est le but.

## Consignes du brasseur (SUIVI.md)
1. Tests sur l'app DÉPLOYÉE. 2. Chaque actionneur, sur des données « ZZ TEST — … » que tu crées ; regarder seul = non couvert. 8. « Non c'était des exemples ils doivent TOUT tester... » : capture avant/après, effet sur tout ce qui en dépend (même nombre partout), résultat plausible en vrai.
23.11 : « jamais utiliser le chrome in claude » ; « et jamais fermé le chrome de débug ».

## Où
- https://brasserie-l-affinee.web.app dans le Chrome de débug : puppeteer-core connect 127.0.0.1:9222, ton onglet neuf, 390 × 844, deviceScaleFactor 2, toucher. Fin : page.close() de ton onglet, browser.disconnect(). JAMAIS browser.close().
- Paquet : vérifie (paquet du tour 44, vérifie-le par curl) (curl). Si l'onglet sert un ancien paquet, recharge.
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

## Constats à rejouer (corrigés au tour 44 : ecr5 cd9db1da8)
 E41-1 | Test en ligne, tour 41 (écritures) | Finances › Opérations › ZZ TEST — Achat › Corriger une erreur de saisie › Retirer (390 px, en ligne index-DwEuRObA.js) | Achat 4,50 payé 19.11 avec un Remboursement +1,00 lié → observé : « Confirmer le retrait » to
 E41-2 | Test en ligne, tour 41 (écritures) | Saisir à la main › Remboursement › « De quelle pièce ? » (390 px, en ligne index-DwEuRObA.js) | Chercher « masque », « 23 », « Brau » → observé : « Aucune pièce ne correspond » ; la liste ne montre que les écriture
 E43-1 | Test en ligne, tour 43 (écritures) | Finances › Opérations › ZZ TEST — Achat › Modifier › date (390 px, en ligne index-QdtCMGhp.js) | Achat 4,50 payé le 19.11, curseur glissé au 14.11, montant inchangé, Enregistrer → observé : bandeau « Enregistrement
 E43-2 | Test en ligne, tour 43 (écritures) | Calendrier, rangées et carte d’une chose (390 px, en ligne index-QdtCMGhp.js) | Lire les montants des ZZ → observé : arrondis au franc, carte comprise : Pour moi 2,50 → « −3 », Achat 3,50 → −4 puis 4,50 → −5, Vente
 E43-3 | Test en ligne, tour 43 (écritures) | Saisir à la main, HABITUELS (390 px, en ligne index-QdtCMGhp.js) | Avec ZZ Apport, Salaire et Pour moi récurrents → observé : les trois places vont aux prévisions ZZ, son vrai « De ma poche » disparaît ; sous-ligne
 E43-4 | Test en ligne, tour 43 (écritures) | Saisir à la main, compte de paiement (390 px, en ligne index-QdtCMGhp.js) | Choisir TWINT → observé : « 🏛 TWINT », icône de banque ; attendu : une icône propre à TWINT (et aux espèces) | D 
 E43-5 | Test en ligne, tour 43 (écritures) | Finances › ZZ TEST — Apport › Modifier (390 px, en ligne index-QdtCMGhp.js) | Ouvrir Modifier → observé : étiquette « Privé » (saisie : « Apports privés »), champ « Tiers / Nom » absent de la saisie, pas de « chang

## Points signalés par la voie
- E43-1 : la pièce est relue après ses paiements ; déplacer la date d'un achat payé doit passer sans « Missing or insufficient permissions » et sans état à moitié fait. Lis la console du navigateur à chaque enregistrement.
- E41-1 non reproduit hors ligne : rejoue-le ; en cas d'échec, recopie l'erreur de la console.
- Le bandeau d'erreur du serveur est en anglais (firestoreRepo.ts) : à verser s'il apparaît.
