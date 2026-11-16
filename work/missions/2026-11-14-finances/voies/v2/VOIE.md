# Voie v2 — problèmes 1 à 3 du test d'écran 8b9e1732

- Mission : 2026-11-14-finances
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 120 tours ; 3 essais par critère
- Dépend de : 8b9e1732 (commité)
- Décideur en cas de doute : pilote

## Objectif
Corriger les problèmes 1 (bloquant), 2 et 3 de `work/missions/2026-10-31-ecran-depense/avant-deploiement/8b9e1732/VERDICT.md` (captures dans ce dossier) ; les autres restent au registre.

## Entrées
- Constats : `C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/BUGS.md` (lignes 20, 21, 33 de « Jeu en ligne nuit 16.11 », et leur « REJEU »).
- Corrections précédentes : `work/missions/2026-11-14-finances/voies/u1/RESULTAT.md` (20), `work/missions/2026-11-14-finances/voies/u2/RESULTAT.md` (21).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `src/ui/finance`, `src/components/tabs/FinancesTab.tsx`, `src/domain/finance`
- `src/components/Header.tsx` et le module qui tient la période (seulement pour le n° 33, à nommer dans RESULTAT.md)
- `tests` (tests neufs, et ceux que ces corrections rendent faux)
- `work/missions/2026-11-14-finances/voies/v2`

## Consignes
Pour chaque point : d'abord un test qui échoue sur HEAD, puis la correction.
- **1** : en « Tout l'historique », la frise de la Période couvre tout l'historique (de la première à la dernière opération), plus un seul mois.
- **2** : à 1280, la pastille de période « 18 oct. → 16 nov. » entière, jamais rognée contre la flèche.
- **3** : l'avis « Mouvement enregistré » ne reste pas après une annulation (il dit ce qui vient d'être fait, ou disparaît).
- Captures 390 et 1280, clair et cave, de chaque point, dans `work/missions/2026-11-14-finances/voies/v2/cap/` (script `work/missions/2026-11-14-finances/voies/v1/capturer.mjs`, point 33 et 20), ouvertes.

## Exigences transversales et acquis (recopiés, L05, L06)
- Règle n° 1 : les maquettes choisies telles quelles (voies m1, m3, m4, m5) ; v6a et s2ap2 intactes (`node work/missions/2026-11-14-finances/voies/o1/controle-v6a.mjs 3000` V6A OK, `node work/missions/2026-11-14-finances/voies/f1/controle-frise.mjs 3000` FRISE OK).
- Un test se change seulement s'il décrit ce que ses choix remplacent. Écritures : services existants, un lot par étape, règles Firestore en lecture seule. Aucune donnée réelle ; banc `http://localhost:3000/?dev-local&finance-demo` (ne pas relancer). Pas de Fable, aucun sous-agent. `git status --short` à la fin. Ne commite pas.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil.
- `node work/missions/2026-11-14-finances/voies/q5/emulateur.mjs > work/missions/2026-11-14-finances/voies/v2/emulateur.txt`.
- La ligne « Tests » : `npx vitest run <fichiers touchés> --reporter=dot --no-color > work/missions/2026-11-14-finances/voies/v2/tests.txt`.
Réponse finale au pilote : une ligne.
