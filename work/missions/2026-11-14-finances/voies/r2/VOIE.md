# Voie r2 — intégration du port du 15.11 (Payer, Apport, Fiche, Modifier)

- Mission : 2026-11-14-finances
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 100 tours ; 3 essais par critère
- Dépend de : q1, q2, q3, q4 (non commités, dans l'arbre)
- Décideur en cas de doute : pilote

## Objectif
Brancher ce qui manque entre les quatre ports, réaligner les tests qui décrivent un comportement remplacé par ses choix, et prouver que la suite complète n'a aucun rouge neuf et que le build passe.

## Entrées
- `work/missions/2026-11-14-finances/voies/q1/RESULTAT.md` … `q4/RESULTAT.md` (sections « restes », « hors Possède », tests voisins).
- Maquettes : `work/missions/2026-11-14-finances/voies/m5/m5pa-d`, `m5ap-a`, `m5fo-a`, `m5mo-c` (etat.html, png).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `src/ui/finance/TransactionDetails.tsx`, `src/ui/finance/fiche`, `src/ui/finance/DocumentProofLink.tsx`
- `tests/integration/financeWorkspace.test.tsx`, `tests/integration/depenseMedicament.test.tsx`, et tout autre test rouge à cause de ces quatre ports (le nommer dans RESULTAT.md)
- `work/missions/2026-11-14-finances/voies/r2`

## Consignes
1. **Justificatif d'un paiement** (q1 l'écrit sur `FinancialPayment.proofDocumentId`) : la fiche (m5fo-a) le montre sur la ligne du paiement concerné, par `DocumentProofLink` ; un test.
2. **Tests voisins** : `financeWorkspace.test.tsx` (« Date réelle du paiement », « Enregistrer ce mouvement ») et `depenseMedicament.test.tsx` (« Apport ou prélèvement privé » comme titre) décrivent les feuilles remplacées par ses choix (m5pa-d, m5ap-a) : les réécrire pour le comportement voulu sans baisser ce qu'ils gardaient d'autre. Un test qui révèle un manque se corrige dans le code (dans le Possède, sinon le dire).
3. **Suite complète** : `npx vitest run --reporter=dot --no-color > work/missions/2026-11-14-finances/voies/r2/tests-complet.txt` ; chaque fichier rouge ou non chargé comparé à la base `en-ligne/2026-11-14-finances` (même méthode que `work/missions/2026-11-14-finances/voies/f2/ROUGES.md`, qui liste déjà les rouges d'environnement) ; écrire `work/missions/2026-11-14-finances/voies/r2/ROUGES.md` (fichier, base rouge oui/non, cause). Tout rouge neuf venu des ports se corrige.
5. Captures 390 et 1280, clair et cave, de la fiche avec le justificatif d'un paiement, dans `work/missions/2026-11-14-finances/voies/r2/cap/`, ouvertes.
4. `npx vite build > work/missions/2026-11-14-finances/voies/r2/build.txt` puis `node scripts/check-no-dev-auth.mjs`.

## Exigences transversales et acquis (recopiés, L05, L06)
- Règle n° 1 : m5pa-d, m5ap-a, m5fo-a, m5mo-c telles quelles ; v6a derrière inchangée (`node work/missions/2026-11-14-finances/voies/o1/controle-v6a.mjs 3000` reste V6A OK ; `node work/missions/2026-11-14-finances/voies/f1/controle-frise.mjs 3000` reste FRISE OK).
- Un test se change seulement s'il décrit un comportement que le brasseur a remplacé. Aucune donnée réelle ; banc `http://localhost:3000/?dev-local&finance-demo` (ne pas relancer). Règles Firestore en lecture seule. Pas de Fable, aucun sous-agent. Rien hors de « Possède » ; `git status --short` à la fin. Ne commite pas.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil.
- La ligne « Tests » : `npx vitest run tests/integration/financeWorkspace.test.tsx tests/integration/depenseMedicament.test.tsx tests/integration/ficheBarre.test.tsx --reporter=dot --no-color > work/missions/2026-11-14-finances/voies/r2/tests.txt`, plus la suite complète du point 3.
Réponse finale au pilote : une ligne.
