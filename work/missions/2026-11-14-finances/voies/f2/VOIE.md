# Voie f2 — Finitions d'Opérations et suite complète

- Mission : 2026-11-14-finances
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 100 tours ; 3 essais par critère
- Dépend de : f1, r1 (commités : b21de1bc, 647712fe)
- Décideur en cas de doute : pilote

## Objectif
Finir Opérations après le port de s2ap2 et prouver que la suite complète n'a aucun rouge venu de la mission.

## Entrées
- `work/missions/2026-11-14-finances/voies/f1/RESULTAT.md` — état du port, tests d'intégration en échec.
- `work/missions/2026-11-14-finances/voies/r1/RESULTAT.md`, section « POUR f1 » — le correctif exact du lien « Matériel à part ».
- `work/missions/2026-11-14-finances/voies/f1/cap/planche-s2ap2-390-clair.png` — l'état actuel contre la maquette.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `src/ui/finance/operations`, `src/ui/finance/TransactionJournal.tsx`, `src/ui/finance/operations.css`
- `tests/integration/operationsPeriode.test.tsx`, `tests/unit/operationsPlageJours.test.ts`
- `work/missions/2026-11-14-finances/voies/f2`

## Consignes
1. **Matériel à part** : appliquer « POUR f1 » (r1) dans `TransactionJournal.tsx` : le filtre que pose la Synthèse montre tout ce qu'Opérations range sous « Matériel · à part » (matériel et rénovation, ligne equipment non passée en charge) ; jamais « Aucune opération ». Un test.
2. **À cheval** : sur la frise, les repères « 29 oct. » et « 1er nov. » se chevauchent sous la poignée (« 29oct.ov. », planche f1, image « App · à cheval ») ; et « 1er » touche la poignée de gauche. Aucun libellé ne se recouvre, à 390 et 1280.
3. **Tests d'intégration** `tests/integration/operationsPeriode.test.tsx` (c) et (c bis) : ils décrivent « Autre période » et l'ancien ‹, remplacés par s2ap2 (choix du brasseur, 14.11). Les réécrire pour le comportement voulu (frise, ‹ › qui glissent la plage de sa durée, champs à l'ordinateur), sans baisser ce qu'ils gardaient d'autre.
4. **Suite complète** : `npx vitest run --reporter=dot --no-color > work/missions/2026-11-14-finances/voies/f2/tests-complet.txt` (attendre la fin). Pour chaque fichier rouge ou non chargé, dire s'il l'est aussi sur la base `en-ligne/2026-11-14-stock-b` : `git worktree add <os.tmpdir()>/base-f2 en-ligne/2026-11-14-stock-b`, y lancer seulement ces fichiers (node_modules du dépôt principal résolu par le parent ; sinon copie `src/data/seedData.example.ts` et `.env` comme le worktree actuel), puis `git worktree remove`. Écrire `f2/ROUGES.md` : fichier, base rouge oui/non, cause. Tout rouge neuf venu de la mission se corrige (dans le Possède ; sinon dire où).
5. `npx vite build > work/missions/2026-11-14-finances/voies/f2/build.txt` puis `node scripts/check-no-dev-auth.mjs`.
6. Captures 390 et 1280, clair et cave, de l'à cheval et du lien Matériel à part, dans `f2/cap/`, ouvertes.

## Exigences transversales et acquis (recopiés, L05, L06)
- Règle n° 1 : s2ap2 et v6a telles quelles ; rien de plus. Rangées v6a : `node work/missions/2026-11-14-finances/voies/o1/controle-v6a.mjs 3000` reste V6A OK ; frise : `node work/missions/2026-11-14-finances/voies/f1/controle-frise.mjs 3000` reste FRISE OK.
- Un test se change seulement s'il décrit un comportement que le brasseur a remplacé ; un test qui révèle un manque se corrige dans le code.
- Rien hors de « Possède » ; `git status --short` à la fin. Aucune donnée réelle. Pas de Fable, aucun sous-agent. Banc : http://localhost:3000 (ne pas relancer). `npx tsc` : ignorer les 2 erreurs de `functions/`.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil, mis à jour à chaque point.
- La ligne « Tests » : `npx vitest run tests/integration/operationsPeriode.test.tsx tests/unit/operationsPlageJours.test.ts --reporter=dot > work/missions/2026-11-14-finances/voies/f2/tests.txt`, plus la suite complète du point 4.
Ne commite pas. Réponse finale au pilote : une ligne.
