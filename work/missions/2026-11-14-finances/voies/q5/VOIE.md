# Voie q5 — corrections de la relecture des paiements (Modifier, Payer)

- Mission : 2026-11-14-finances
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 100 tours ; 3 essais par critère
- Dépend de : q1, q4 (non commités, dans l'arbre)
- Décideur en cas de doute : pilote

## Objectif
Corriger le bloquant B1 et les mineurs M1 à M5 de `work/missions/2026-11-14-finances/voies/r2/RELECTURE.md`, et prouver à l'émulateur Firestore que chaque plan de correction et le virement passent les règles.

## Entrées
- `work/missions/2026-11-14-finances/voies/r2/RELECTURE.md` (lire B1, M1 à M5, « q1 vérifié », « q4 vérifié »).
- `work/missions/2026-11-14-finances/voies/q4/RESULTAT.md`, `work/missions/2026-11-14-finances/voies/q1/RESULTAT.md` ; règles : `C:/Users/mrspa/Documents/Brasserie/firestore.rules` (lecture seule, ne jamais modifier) ; modèle d'émulateur : `scripts/check-invoice-journey-emulator.mjs`.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `src/ui/finance/modifier`, `src/components/EditTransactionModal.tsx`, `src/domain/finance/correctionMontant.ts`, `tests/unit/correctionMontant.test.ts`, `tests/integration/modifierMontant.test.tsx`
- `src/ui/finance/payer`
- `work/missions/2026-11-14-finances/voies/q5`

## Consignes (décisions du pilote)
- **B1** : un lot Firestore par étape du plan. `executerPlan` devient asynchrone et laisse partir le lot entre deux étapes (exposer au besoin un `flushNow()` dans le dépôt seulement si `firestoreRepo.ts` n'en a pas ; sinon `await` la microtâche), sans attendre le serveur (le hors ligne doit rester : les lots se rejouent dans l'ordre). La feuille n'annonce « Opération mise à jour » qu'après la mise en file de toutes les étapes ; un refus ultérieur reste visible par le bandeau existant. `src/services/firestoreRepo.ts` hors Possède : si un changement y est indispensable, s'arrêter et l'écrire dans RESULTAT.md (DEMANDE PILOTE) avec le diff exact.
- **Preuve émulateur** : un script `work/missions/2026-11-14-finances/voies/q5/emulateur.mjs` (émulateur Firestore, règles du dépôt principal, Java 21 présent) qui joue : hausse + « paiement suit », hausse + « reste à payer », baisse sous le payé + « paiement suit », baisse avec deux paiements, et un virement sur deux pièces d'un même fournisseur ; il imprime EMULATEUR OK ou EMULATEUR ECHEC et le refus. Témoin : l'ancien regroupement en un lot doit échouer (le dire dans RESULTAT.md).
- **M1** : plan impossible et montant changé : afficher l'erreur, ne rien écrire.
- **M2** : une baisse « paiement suit » date le paiement de remplacement à la date du dernier paiement inversé (c'est une correction, pas un virement) ; une hausse « suit » le date d'aujourd'hui.
- **M3** : verrou évalué sur l'année d'origine et sur l'année de la nouvelle date.
- **M4** : « année close » = une clôture confirmée (pas un brouillon : lire `ClosingSheet` et le type de clôture pour le bon champ) ; un test.
- **M5** : hors ligne avec un justificatif, le message propose « Retirer le justificatif pour payer maintenant ».
- Captures 390 et 1280, clair et cave, de Modifier après une baisse sous le payé, dans `work/missions/2026-11-14-finances/voies/q5/cap/`, ouvertes.

## Exigences transversales et acquis (recopiés, L05, L06)
- Règle n° 1 : m5mo-c et m5pa-d telles quelles (`work/missions/2026-11-14-finances/voies/m5/`). Écritures et paiements : risque élevé ; aucune donnée réelle ; banc `http://localhost:3000/?dev-local&finance-demo` (ne pas relancer). Règles Firestore en lecture seule. Pas de Fable, aucun sous-agent. Rien hors de « Possède » ; `git status --short` à la fin. Ne commite pas. Une autre voie (r2) écrit en même temps dans TransactionDetails et des tests d'intégration : ne pas y toucher.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil.
- `node $d/emulateur.mjs > $d/emulateur.txt` après les tests.
- La ligne « Tests » : `npx vitest run tests/unit/correctionMontant.test.ts tests/integration/modifierMontant.test.tsx tests/unit/repartitionVirement.test.ts tests/integration/payerVirement.test.tsx --reporter=dot --no-color > work/missions/2026-11-14-finances/voies/q5/tests.txt`.
Réponse finale au pilote : une ligne.
