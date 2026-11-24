# Dossier — test en ligne du tour 45 (index-Ba6_cMq7.js), 24.11

## Où
- https://brasserie-l-affinee.web.app dans le Chrome de débug : puppeteer-core connect 127.0.0.1:9222, ton onglet neuf, 390 × 844, deviceScaleFactor 2, toucher. Fin : page.close() de ton onglet, browser.disconnect(). JAMAIS browser.close(). Jamais Claude in Chrome.
- Paquet : vérifie index-Ba6_cMq7.js (curl). Si l'onglet sert un ancien paquet, recharge (avis « Nouvelle version »).
- Avant : « CHF à dépenser », solde de chaque compte, « Mon mois », période du Calendrier ; après suppression des ZZ : EXACTEMENT les mêmes. Ne touche aucune donnée réelle (fêtes, carnets, écritures sans « ZZ TEST »).

## Corrigé à vérifier (voie ecr6, voies/ecr6/RESULTAT.md)
- E44-1 : ZZ TEST — Salaire 5,00 à payer d'ici une date future, Revient Mois ; ZZ TEST — Loyer 4,00, Trim. La carte de fin et l'aperçu annoncent les dates où le Calendrier les montre (échéance, puis +1 mois / +3 mois). Vérifie au Calendrier chaque occurrence annoncée (rangée et courbe, montant). Une écriture payée qui revient : dates de sa pièce.
- E44-2 : ZZ TEST — Achat 2,00 payé, Remboursement 0,50 lié ; Opérations › achat › Corriger une erreur de saisie › Retirer : le texte annonce le remboursement lié ; après confirmation, les deux annulés, soldes justes.
- E44-3 : saisie et Modifier d'un ZZ TEST — Apport (et prélèvement privé, remboursement) : « Référence, facultatif » ; une facture (achat, vente) garde « Référence (n° de facture) ».
- Erreurs serveur : aucun texte anglais visible (si tu peux le provoquer sans toucher aux règles ni aux données réelles, par ex. hors ligne puis retour ; sinon : non couvert, noté).

## Autour (trouver d'AUTRES problèmes est le but)
- Chaque actionneur de la saisie touchée (date, Revient, compte, TVA/Référence, justificatif) ; Calendrier : chaque écriture dans sa rangée et sur la courbe, à la bonne date.

## Verdict
« combien et quels problèmes ? », liste numérotée, gravité B/m/D ; chaque problème à BUGS.md (préfixe E45-), format des lignes E44.
