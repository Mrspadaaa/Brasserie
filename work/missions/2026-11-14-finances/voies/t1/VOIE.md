# Voie t1 — les 9 problèmes du test d'écran 28e87fb1

- Mission : 2026-11-14-finances
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 120 tours ; 3 essais par critère
- Dépend de : 28e87fb1 (commité)
- Décideur en cas de doute : pilote

## Objectif
Corriger les problèmes 1 à 9 de `work/missions/2026-10-31-ecran-depense/avant-deploiement/28e87fb1/VERDICT.md` (captures dans ce dossier), sans rien changer d'autre.

## Entrées
- `work/missions/2026-10-31-ecran-depense/avant-deploiement/28e87fb1/VERDICT.md` et ses captures (ouvrir celles citées) ; maquettes choisies : work/missions/2026-11-14-finances/voies/<m1|m3|m4>/<id>/.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `src/ui/finance`, `src/components/tabs/FinancesTab.tsx`, `src/components/EditTransactionModal.tsx`
- `tests` (seulement les tests rouges à cause de ces ports, nommés dans RESULTAT.md)
- `work/missions/2026-11-14-finances/voies/t1`

## Consignes
1. Les 3 bloquants d'abord (budget lisible à 1280, « Enregistrer » de m4bb-a présent et branché, profil qui ne dit pas « aucun brassin planifié » quand il y en a), puis les 6 autres problèmes.
2. Un test par bloquant ; les tests touchés et `npx vite build > work/missions/2026-11-14-finances/voies/t1/build.txt`.
3. Captures 390 et 1280, clair et cave, de chaque point corrigé, dans `work/missions/2026-11-14-finances/voies/t1/cap/`, ouvertes.

## Exigences transversales et acquis (recopiés, L05, L06)
- Règle n° 1 : les maquettes choisies telles quelles (voies m1, m3, m4, m5) ; v6a et s2ap2 intactes (`node work/missions/2026-11-14-finances/voies/o1/controle-v6a.mjs 3000` V6A OK, `node work/missions/2026-11-14-finances/voies/f1/controle-frise.mjs 3000` FRISE OK).
- Un test se change seulement s'il décrit ce que ses choix remplacent. Écritures : services existants, un lot par étape, règles Firestore en lecture seule. Aucune donnée réelle ; banc `http://localhost:3000/?dev-local&finance-demo` (ne pas relancer). Pas de Fable, aucun sous-agent. `git status --short` à la fin. Ne commite pas.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil.
- La ligne « Tests » : `npx vitest run <fichiers touchés> --reporter=dot --no-color > work/missions/2026-11-14-finances/voies/t1/tests.txt`.
Réponse finale au pilote : une ligne.
