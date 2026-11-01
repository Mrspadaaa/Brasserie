# Journal Gemini — tests Dépense en ligne (D210, D217)

Bornes : 10 CHF en tout (D217), 40 lectures au plus, une seule dépense « TEST pilote » à la fois, supprimée avec son fichier Drive
dans la même séance, rien en stock. Cumul relu avant chaque appel. Jamais dans `npm test`.

Tarif lu dans `functions/src/geminiCosts.ts` : la lecture (`SCAN_MODEL`, gemini-3.8-flash) coûte 1,5 CHF par million de jetons
en entrée et 7,5 CHF en sortie ; 3 appels de 5 100 jetons de sortie au plus, donc environ 0,13 CHF au pire par lecture.

| n° | Date | Objet | Fichier | Coût | Cumul |
|---|---|---|---|---|---|
| — | — | (aucun appel avant le 01.11) | — | 0 | 0 CHF |
| 1 | 01.11.2026 06:57 (UTC+1) | lecture d'une facture fictive, version 5f224fc3 en ligne ; « Lectures d'accord 2/2 » | `ticket-test-pilote.png` (fictif, une ligne de service, 35 CHF) | 0,0155 CHF | 0,0155 CHF |

Coût lu dans Firestore, en lecture seule : `brewerAiCosts/2026-11`, `usedMicroChf` = 15 509, `reservedMicroChf` = 0. Le document du mois
a été créé par cet appel (05:57:29 UTC) : tout son montant vient de ce test.

Résultat : fournisseur, date, total 35,00, TVA 2,62 à 8,1 %, une ligne « Service », « 1 sans stock », « Lecture vérifiée ». Dépense
« TEST pilote » enregistrée, justificatif « 2026-11-01 Atelier Mesure Fictif Sàrl 7.png » rangé dans le Drive (23 999 octets, empreinte
vérifiée). Suppression : voir plus bas.

## Suppression de la dépense de test (même séance, 01.11 vers 07 h 10)
- Dans l'app, une dépense payée ne s'efface pas : elle se corrige en gardant son historique (`StorageService.revertTransaction`).
  Ordre imposé par l'app : d'abord « Corriger ce paiement erroné » (contre-écriture + 35,00, même date), puis « Annuler cette écriture ».
  Message de l'app : « Écriture annulée. Justificatif et historique conservés. » ; Finances › Opérations › Courantes : 0 opération.
  Reste dans le journal comptable : l'écriture annulée et ses deux paiements, qui s'annulent (net 0). Un effacement définitif du document
  Firestore serait une suppression de données réelles : il n'a pas été fait et reste au choix du brasseur.
- Drive : fichier `2026-11-01 Atelier Mesure Fictif Sàrl 7.png` mis à la corbeille ; vérifié sur la page Corbeille de Drive (présent) et
  dans le dossier « L'Affinée / Justificatifs / 2026 » (absent). Corbeille non vidée.
- Rien en stock : la ligne était « Service », « 1 sans stock » ; aucun article créé, aucun mouvement.
