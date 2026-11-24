# Dossier — test en ligne des écritures (tour 40, index-CRA3EhuZ.js), 23.11 soir

## Sa demande (mot pour mot)
« Mais revoir la partie écriture sur la vrai app, et voir si tout est bien dynamique et bien voir si tout s'affiche sur le calendrier »
Ses plaintes du soir sur ce sujet (captures dans work/missions/2026-11-23-reprise-soir/plaintes/, ouvre-les) : « la vue apport … s'affiche pas sûr le calendrier... Et elle diffère des autres vue, et il y a pas de coche pour dire que il y a pas de justificatif » (2334, 2335, 2336, 2337) ; « Le slider met pas à jour la date en dynamique » (2339) ; avis « Nouvelle version » posé sur l'en-tête (2339). Une voie les corrige déjà : les retrouver est attendu, en trouver d'AUTRES est le but.

## Consignes du brasseur (SUIVI.md)
1. Tests sur l'app DÉPLOYÉE. 2. Chaque actionneur, sur des données « ZZ TEST — … » que tu crées ; regarder seul = non couvert. 8. « Non c'était des exemples ils doivent TOUT tester... » : capture avant/après, effet sur tout ce qui en dépend (même nombre partout), résultat plausible en vrai.
23.11 : « jamais utiliser le chrome in claude » ; « et jamais fermé le chrome de débug ».

## Où
- https://brasserie-l-affinee.web.app dans le Chrome de débug : puppeteer-core connect 127.0.0.1:9222, ton onglet neuf, 390 × 844, deviceScaleFactor 2, toucher. Fin : page.close() de ton onglet, browser.disconnect(). JAMAIS browser.close().
- Paquet : vérifie index-CRA3EhuZ.js (curl). Si l'onglet sert un ancien paquet, recharge.
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

## Constats à rejouer (corrigés au tour 40 : ecr2 9e64b0acf, fix38c dbd454199)
 E35-3 | Test en ligne, tour 35 (écritures) | Saisir à la main › Ça rentre › Autre (pas un prêt) (390 px, en ligne index-r1awkHAF.js) | Enregistrer ZZ TEST — Autre entrée +1,10 → observé : titre par défaut « Recette du 23.11 », étiquette « Ventes » dans la fiche, « Autre entrée ·
 E35-4 | Test en ligne, tour 35 (écritures) | Saisir à la main, curseur de date (Vente, À recevoir) (390 px, en ligne index-r1awkHAF.js) | Glisser lentement le curseur vers le passé → observé : au dernier pas, curseur « 8 oct. » et titre « Vente du 08.10 » ; au lâcher, enregistré
 E35-6 | Test en ligne, tour 35 (écritures) | Finances › Opérations › ZZ TEST — Achat (payé 3,50) › Modifier (390 px, en ligne index-r1awkHAF.js) | Montant 3,50 → 4,50, Enregistrer → observé : « 4,50 · Reste 1,00 CHF à payer · sans échéance » et « Marquer payé » : une correction 
 E35-11 | Test en ligne, tour 35 (écritures) | Finances › Opérations › écriture › Modifier (390 px, en ligne index-r1awkHAF.js) | Ouvrir Modifier sur ZZ TEST — Achat → observé : autre fiche que la saisie (Nom, Catégorie, Précision, Date, Montant « sans TVA », « Fournisseur, n° de
 E35-13 | Test en ligne, tour 35 (écritures) | Saisir à la main › Apport (et Pour moi) (390 px, en ligne index-r1awkHAF.js) | Comparer à Vente / Achat → observé : Apport sans « Revient ? » (les données ont « Versement mensuel Aricia », « Versement mensuel Gaëtan »), carte de fin 
 E35-16 | Test en ligne, tour 35 (écritures) | Saisir à la main › Impôts › Impôt sur la bière (390 px, en ligne index-r1awkHAF.js) | Enregistrer → observé : étiquette « Autres frais » ; attendu : « Impôts » ou « Impôt sur la bière » | D 
 C38-1 | Test en ligne, tour 38 (Calendrier) | Calendrier, bande des années (390 px, en ligne index-DU-8kJuj.js) | Étirer la fenêtre par la poignée de début (An → 14, 16, 19 mois) → observé : à 19 mois (cadre avr. 2026 – nov. 2027), l’axe dit « 2025 M J S N 2027 M M J S N 2028 » 
 C38-2 | Test en ligne, tour 38 (Calendrier) | Calendrier, barre tenue au bord (390 px, en ligne index-DU-8kJuj.js) | Tenir ZZ TEST — barre au bord droit à 6 sem., puis lâcher → observé : l’étiquette dit « S11 · 15 mars · lâcher ici », la barre est posée le 22 mars (S12, message 
 C38-3 | Test en ligne, tour 38 (Calendrier) | Calendrier, rangée Ventes (390 px, en ligne index-DU-8kJuj.js) | Enregistrer ZZ TEST — apport 1 CHF (Saisir à la main › Apport), Calendrier à 6 sem. → observé : la pastille de la rangée dit « +1 201 reçu » (De ma poche 1 200 + ZZ app
 E38-1 | Test en ligne, tour 38 (écritures) | Calendrier, rangée Ventes (390 px, en ligne index-DU-8kJuj.js) | Apport ZZ +5 (21.11) et le vrai « De ma poche +1 200 » → observé : tous deux dessinés dans la rangée Ventes ; sans vente à encaisser, l’en-tête dit « +1 200 reçu S48–S53
 E38-2 | Test en ligne, tour 38 (écritures) | Saisir à la main › Ça rentre › Autre (pas un prêt), puis Finances (390 px, en ligne index-DU-8kJuj.js) | Enregistrer ZZ TEST — Autre entrée +1,10 → observé : étiquette « Ventes » dans la saisie et la carte de fin, Mon mois +1,10, Opér
 E38-3 | Test en ligne, tour 38 (écritures) | Finances › Opérations › ZZ TEST — Achat (payé 18.11, 3,50) › Modifier (390 px, en ligne index-DU-8kJuj.js) | Montant 3,50 → 4,50, choix par défaut « Le paiement suit », Enregistrer → observé : « payé aujourd’hui » au lieu du 18 nov., 
 E38-4 | Test en ligne, tour 38 (écritures) | Finances › Opérations › écriture › Modifier (Achat et Vente) (390 px, en ligne index-DU-8kJuj.js) | Ouvrir Modifier → observé : autre fiche que la saisie : champs en colonnes (Nom, Catégorie, Précision, Date, Montant « sans TVA »), pa
 E38-5 | Test en ligne, tour 38 (écritures) | Saisir à la main, curseur de date (Achat, Vente, Payé / Reçu) (390 px, en ligne index-DU-8kJuj.js) | Glisser le curseur vers le passé → observé : pastille et titre suivent (18.11), mais le bouton reste « Payé aujourd’hui » / « Reçu au
 E38-6 | Test en ligne, tour 38 (écritures) | Calendrier, récurrentes à payer (Salaire mois, Loyer trim.) (390 px, en ligne index-DU-8kJuj.js) | ZZ Salaire et Loyer à payer d’ici le 23.12, Revient → observé : la 1re occurrence est placée à son échéance (23 déc.), les suivantes à 
 E38-7 | Test en ligne, tour 38 (écritures) | Saisir à la main › Impôts › Impôt sur la bière, puis Opérations (390 px, en ligne index-DU-8kJuj.js) | Enregistrer ZZ TEST — Impôts → observé : étiquette « Autres frais » dans la saisie et la carte de fin, ligne rangée sous « Autres f
 E38-8 | Test en ligne, tour 38 (écritures) | Saisir à la main, compte « Banque ⌄ » (390 px, en ligne index-DU-8kJuj.js) | Toucher le compte 4 fois → observé : Banque → Espèces → TWINT → Autre → Banque, sans liste ; le chevron annonce une liste ; attendu : la liste des comptes, o

## Décisions du pilote à vérifier
- « Autres entrées » : groupe à part des Ventes partout (saisie, carte de fin, Opérations, Synthèse, piles).
- Modifier ouvre la MÊME feuille que la saisie (E38-4 corrigé en partie : dire ce qui manque).
- Apport au Calendrier : picto tirelire, hors du « reçu » des Ventes (« hors ventes »).
- Barre tenue au bord : la frise s'agrandit (son choix CAL-BARRE-BORD), mais la barre se pose dans le cadre visible, sur la date annoncée.
- L'axe porte l'année juste à 14, 16, 19, 20 mois et à l'An.

## Pièges connus (tours 38)
- Ne touche jamais « Annuler » d'une carte de fin d'un autre ; ne change pas la période du Calendrier sans la remettre comme au départ (note-la avant).
- L'avis « Nouvelle version » : si l'onglet a été ouvert avant le tour 40, il doit apparaître sans couvrir le contenu.
