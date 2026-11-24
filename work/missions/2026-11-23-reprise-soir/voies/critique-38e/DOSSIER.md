# Dossier — test en ligne des écritures (tour 38, index-DU-8kJuj.js), 23.11 soir

## Sa demande (mot pour mot)
« Mais revoir la partie écriture sur la vrai app, et voir si tout est bien dynamique et bien voir si tout s'affiche sur le calendrier »
Ses plaintes du soir sur ce sujet (captures dans work/missions/2026-11-23-reprise-soir/plaintes/, ouvre-les) : « la vue apport … s'affiche pas sûr le calendrier... Et elle diffère des autres vue, et il y a pas de coche pour dire que il y a pas de justificatif » (2334, 2335, 2336, 2337) ; « Le slider met pas à jour la date en dynamique » (2339) ; avis « Nouvelle version » posé sur l'en-tête (2339). Une voie les corrige déjà : les retrouver est attendu, en trouver d'AUTRES est le but.

## Consignes du brasseur (SUIVI.md)
1. Tests sur l'app DÉPLOYÉE. 2. Chaque actionneur, sur des données « ZZ TEST — … » que tu crées ; regarder seul = non couvert. 8. « Non c'était des exemples ils doivent TOUT tester... » : capture avant/après, effet sur tout ce qui en dépend (même nombre partout), résultat plausible en vrai.
23.11 : « jamais utiliser le chrome in claude » ; « et jamais fermé le chrome de débug ».

## Où
- https://brasserie-l-affinee.web.app dans le Chrome de débug : puppeteer-core connect 127.0.0.1:9222, ton onglet neuf, 390 × 844, deviceScaleFactor 2, toucher. Fin : page.close() de ton onglet, browser.disconnect(). JAMAIS browser.close().
- Paquet : vérifie index-DU-8kJuj.js (curl). Si l'onglet sert un ancien paquet, recharge.
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

## Constats E35 à rejouer (corrigés au tour 38 : ecr-donnees 1761845a5, ecr-saisie 8eb141472)
 E35-1 | Test en ligne, tour 35 (écritures) | Finances › Opérations, « Retirer cette écriture » d’une écriture récurrente, puis Calendrier (390 px, en ligne index-r1awkHAF.js) | Retirer ZZ TEST — Salaire (mois), Abonnement (mois, 6 fois), Loyer (trim., 2 fois) → observé : les écritures sortent des O
 E35-2 | Test en ligne, tour 35 (écritures) | Calendrier, rangée Ventes (390 px, en ligne index-r1awkHAF.js) | Après saisie de ZZ Apport (+5, reçu 21.11) → observé : « Ventes +1 205 à encaisser S48–S53 » compte « De ma poche +1 200 » (apport déjà encaissé le 23.11) ; un apport n’est ni une vente ni 
 E35-3 | Test en ligne, tour 35 (écritures) | Saisir à la main › Ça rentre › Autre (pas un prêt) (390 px, en ligne index-r1awkHAF.js) | Enregistrer ZZ TEST — Autre entrée +1,10 → observé : titre par défaut « Recette du 23.11 », étiquette « Ventes » dans la fiche, « Autre entrée · Ventes » aux Opérat
 E35-4 | Test en ligne, tour 35 (écritures) | Saisir à la main, curseur de date (Vente, À recevoir) (390 px, en ligne index-r1awkHAF.js) | Glisser lentement le curseur vers le passé → observé : au dernier pas, curseur « 8 oct. » et titre « Vente du 08.10 » ; au lâcher, enregistré 06.10 (sur index-CG
 E35-5 | Test en ligne, tour 35 (écritures) | Saisir à la main › Vente « Client + autre », Achat « Chez + autre », Loyer « Bailleur », Abonnement « Service » (390 px, en ligne index-r1awkHAF.js) | Toucher « + autre » puis taper « ZZ » → observé : rien ne s’ouvre, le curseur va dans le titre et « ZZ 
 E35-6 | Test en ligne, tour 35 (écritures) | Finances › Opérations › ZZ TEST — Achat (payé 3,50) › Modifier (390 px, en ligne index-r1awkHAF.js) | Montant 3,50 → 4,50, Enregistrer → observé : « 4,50 · Reste 1,00 CHF à payer · sans échéance » et « Marquer payé » : une correction de frappe crée une d
 E35-7 | Test en ligne, tour 35 (écritures) | Saisir à la main, Vente « À recevoir » (390 px, en ligne index-r1awkHAF.js) | Toucher « À recevoir » → observé : bouton d’enregistrement « À payer +4,80 » (la carte de fin dit bien « à recevoir ») ; attendu : « À recevoir +4,80 » | m 
 E35-8 | Test en ligne, tour 35 (écritures) | Saisir à la main, curseur de date vers l’avant (Payé/Reçu et À payer/À recevoir) (390 px, en ligne index-r1awkHAF.js) | Glisser le curseur à droite → observé : pendant le glisser la pastille et le titre suivent (30.11, « Vente du 08.12 ») ; au lâcher tou
 E35-9 | Test en ligne, tour 35 (écritures) | Calendrier, rangées et vue Liste (390 px, en ligne index-r1awkHAF.js) | ZZ Loyer, Impôts, Salaire (1re), Vente, à payer / à recevoir le 23.12 → observé : « ZZ TEST — Loyer, 23 déc., −4 », « Impôts −1 », « Vente +5 » sans « à payer / à recevoir », pastill
 E35-10 | Test en ligne, tour 35 (écritures) | Calendrier, sorties payées passées (390 px, en ligne index-r1awkHAF.js) | ZZ Achat (18.11), Pour moi (21.11), Autre sortie (19.11), payés → observé : absents des rangées et de la Liste, alors que ZZ Apport (21.11) et Autre entrée (22.11) sont dessinés e
 E35-11 | Test en ligne, tour 35 (écritures) | Finances › Opérations › écriture › Modifier (390 px, en ligne index-r1awkHAF.js) | Ouvrir Modifier sur ZZ TEST — Achat → observé : autre fiche que la saisie (Nom, Catégorie, Précision, Date, Montant « sans TVA », « Fournisseur, n° de pièce ») ; ni compt
 E35-12 | Test en ligne, tour 35 (écritures) | Calendrier › chose › Ouvrir, puis Finances › Opérations (390 px, en ligne index-r1awkHAF.js) | Ouvrir ZZ TEST — Vente depuis le Calendrier → observé : la recherche des Opérations porte « MAIN-545e015f-abfd-… » (identifiant technique) et reste posée en r
 E35-13 | Test en ligne, tour 35 (écritures) | Saisir à la main › Apport (et Pour moi) (390 px, en ligne index-r1awkHAF.js) | Comparer à Vente / Achat → observé : Apport sans « Revient ? » (les données ont « Versement mensuel Aricia », « Versement mensuel Gaëtan »), carte de fin avec une ligne « Esp
 E35-14 | Test en ligne, tour 35 (écritures) | Saisir à la main, curseur de date (390 px, en ligne index-r1awkHAF.js) | Toucher la piste à droite du curseur → observé : rien ne bouge ; attendu : la date va où l’on touche | D 
 E35-15 | Test en ligne, tour 35 (écritures) | Finances › Opérations, ZZ TEST — Pour moi (390 px, en ligne index-r1awkHAF.js) | Pour moi (retrait 2,50) → observé : ligne « Pour moi · Apports privés » ; attendu : « Prélèvement privé » | D 
 E35-16 | Test en ligne, tour 35 (écritures) | Saisir à la main › Impôts › Impôt sur la bière (390 px, en ligne index-r1awkHAF.js) | Enregistrer → observé : étiquette « Autres frais » ; attendu : « Impôts » ou « Impôt sur la bière » | D 

## Points signalés par les voies
- E35-3 en partie : l'en-tête de groupe des Opérations dit encore « Ventes » pour une Autre entrée.
- E35-4 non reproduit par la voie : rejoue-le lentement.
- Le passé du Calendrier montre désormais tous les paiements réels des 52 dernières semaines : est-ce lisible à 390 (surcharge) ?
- Les prévisions d'une écriture qui revient doivent partir avec elle (E35-1) : soldes identiques après retrait SANS retouche manuelle.
