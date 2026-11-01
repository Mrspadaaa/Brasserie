OK — 34 écarts sur 5 documents

Livrable : `work/missions/2026-10-31-ecran-depense/ecarts/2026-10-31-finances.md`.

Compte par classe : autre architecture 10 ; non documenté 16 ; figé 4 ; absent 2 ; incomplet 2.
Par document : finances.md 19 ; gemini-budget.md 8 ; finance-verification.md 4 ; financial-sync.md 2 ; expense-vision-evaluation.md 1.

Critères rejoués : G1 `NOTE OK` ; G2 `FORMAT OK 34`.

Écart majeur pour l'écran « Nouvelle dépense » : `docs/finances.md` décrit le justificatif en blocs Firestore, alors que le code l'envoie sur le Drive du brasseur (`L’Affinée/Justificatifs/<année>`) avant l'achat, et refuse l'achat avec justificatif hors ligne. `docs/gemini-budget.md:41` dit déjà Drive : les deux docs se contredisent.

Limites : vérification par lecture seule ; les chiffres datés de `finance-verification.md` (nombre de tests, essais réels) ne sont pas rejouables. Écart noté hors rapport, car aucun fichier de code `src|functions|scripts|tests` ne le porte pour le format de G2 : `docs/finance-verification.md:113` « quatre exemptions d'index » alors que `firestore.indexes.json:146-167` en liste cinq (ajout de `brewerContexts.context`).

LEÇON PROPOSÉE : aucune
