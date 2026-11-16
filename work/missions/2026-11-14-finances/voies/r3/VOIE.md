# Voie r3 — intégration du port des 8 vues et des FN

- Mission : 2026-11-14-finances
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 120 tours ; 3 essais par critère
- Dépend de : edd7402c (commité)
- Décideur en cas de doute : pilote

## Objectif
Finir le branchement entre les voies s1b, s2b, s2c, s3b, s3c, s4, réaligner les tests que leurs choix remplacent, et prouver : suite complète sans rouge neuf, build vert.

## Entrées
- `work/missions/2026-11-14-finances/MISSION.md`, section « État de reprise (pilote, 15.11 nuit) » ; `work/missions/2026-11-14-finances/voies/s1b/RESULTAT.md`, `s2b`, `s2c`, `s3b`, `s3c`, `s4` (sections tests hors voie, DÉCISION, DEMANDE EXECUTANT).
- Rouges d'environnement connus : `work/missions/2026-11-14-finances/voies/f2/ROUGES.md`, `work/missions/2026-11-14-finances/voies/r2/ROUGES.md`.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `src/ui/finance`, `src/components/tabs/FinancesTab.tsx`, `src/components/EditTransactionModal.tsx`
- `tests` (seulement les tests rouges à cause de ces ports, nommés dans RESULTAT.md)
- `work/missions/2026-11-14-finances/voies/r3`

## Consignes
1. « Autre montant » (avis après « ✓ Payé ») ouvre Payer m5pa-d sur la bonne pièce et transmet le paiement à remplacer ; l'inversion et le nouveau paiement partent à l'enregistrement de Payer, un lot par étape ; Annuler ne change rien. Un test.
2. s2c : finitions CSS et captures restantes (voir RESULTAT.md et `work/missions/2026-11-14-finances/voies/s2c/cap/`), puis G3 (V6A).
3. Tests hors voies : chaque rouge causé par ces ports est réaligné s'il décrit un comportement remplacé par ses choix ; sinon le code est corrigé.
4. Suite complète : `npx vitest run --reporter=dot --no-color > work/missions/2026-11-14-finances/voies/r3/tests-complet.txt` ; `work/missions/2026-11-14-finances/voies/r3/ROUGES.md` : fichier, base rouge oui/non, cause ; aucun rouge neuf.
5. `npx vite build > work/missions/2026-11-14-finances/voies/r3/build.txt` puis `node scripts/check-no-dev-auth.mjs`.
6. Captures 390 et 1280, clair et cave, de « Autre montant » et des vues de s2c, dans `work/missions/2026-11-14-finances/voies/r3/cap/`, ouvertes.

## Exigences transversales et acquis (recopiés, L05, L06)
- Règle n° 1 : les maquettes choisies telles quelles (voies m1, m3, m4, m5) ; v6a et s2ap2 intactes (`node work/missions/2026-11-14-finances/voies/o1/controle-v6a.mjs 3000` V6A OK, `node work/missions/2026-11-14-finances/voies/f1/controle-frise.mjs 3000` FRISE OK).
- Un test se change seulement s'il décrit ce que ses choix remplacent. Écritures : services existants, un lot par étape, règles Firestore en lecture seule. Aucune donnée réelle ; banc `http://localhost:3000/?dev-local&finance-demo` (ne pas relancer). Pas de Fable, aucun sous-agent. `git status --short` à la fin. Ne commite pas.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil.
- La ligne « Tests » : la suite complète du point 4 (`--reporter=dot --no-color > work/missions/2026-11-14-finances/voies/r3/tests-complet.txt`).
Réponse finale au pilote : une ligne.
