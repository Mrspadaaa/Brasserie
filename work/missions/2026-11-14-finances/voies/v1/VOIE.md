# Voie v1 — rejeu de nuit : écriture annulée listée (20), prévision non supprimable (21), Période incohérente (33)

- Mission : 2026-11-14-finances
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 120 tours ; 3 essais par critère
- Dépend de : en-ligne/2026-11-16-atelier-nuit (4067e777, en ligne, contient 2746109c)
- Décideur en cas de doute : pilote

## Objectif
Les trois constats que le rejeu en ligne de nuit trouve encore (BUGS.md du dépôt principal, section « Jeu en ligne nuit 16.11 », lignes 20, 21, 33 avec leur « REJEU »).

## Entrées
- Constats : `C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/BUGS.md` (lignes 20, 21, 33 de « Jeu en ligne nuit 16.11 », et leur « REJEU »).
- Corrections précédentes : `work/missions/2026-11-14-finances/voies/u1/RESULTAT.md` (20), `work/missions/2026-11-14-finances/voies/u2/RESULTAT.md` (21).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `src/ui/finance`, `src/components/tabs/FinancesTab.tsx`, `src/domain/finance`
- `src/components/Header.tsx` et le module qui tient la période (seulement pour le n° 33, à nommer dans RESULTAT.md)
- `tests` (tests neufs, et ceux que ces corrections rendent faux)
- `work/missions/2026-11-14-finances/voies/v1`

## Consignes (décisions du pilote)
Pour chaque constat : d'abord un test qui échoue sur HEAD (le dire dans RESULTAT.md), puis la correction, puis le test vert. Jouer d'abord le parcours du testeur au banc pour trouver le vrai chemin.
- **20** : une écriture annulée n'apparaît plus nulle part par défaut : ni dans la liste, ni dans la recherche d'Opérations, ni dans les totaux ; seulement avec « Écritures annulées uniquement ». Le chemin du testeur (Corriger ce paiement, puis Annuler cette écriture) mène au même résultat que « Retirer cette écriture ». La suppression reste interdite par les règles Firestore : rien à faire là.
- **21** : une prévision se supprime depuis le chemin du testeur (Prévisions › hub « Sorties prévues » › ligne › feuille de la prévision) : geste « Supprimer » avec confirmation, dans chaque feuille qui ouvre une prévision.
- **33** : la Période (avatar › Plus › Période) et la plage affichée disent la même chose : « Tout l'historique » ⇒ pas de « 30 jours » ni de « Du … au » vide ; une plage de 30 jours ⇒ la Période le dit. Une seule source pour les deux.
- Captures 390 et 1280, clair et cave, de chaque point, dans `work/missions/2026-11-14-finances/voies/v1/cap/`, ouvertes.

## Exigences transversales et acquis (recopiés, L05, L06)
- Règle n° 1 : les maquettes choisies telles quelles (voies m1, m3, m4, m5) ; v6a et s2ap2 intactes (`node work/missions/2026-11-14-finances/voies/o1/controle-v6a.mjs 3000` V6A OK, `node work/missions/2026-11-14-finances/voies/f1/controle-frise.mjs 3000` FRISE OK).
- Un test se change seulement s'il décrit ce que ses choix remplacent. Écritures : services existants, un lot par étape, règles Firestore en lecture seule. Aucune donnée réelle ; banc `http://localhost:3000/?dev-local&finance-demo` (ne pas relancer). Pas de Fable, aucun sous-agent. `git status --short` à la fin. Ne commite pas.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil.
- `node work/missions/2026-11-14-finances/voies/q5/emulateur.mjs > work/missions/2026-11-14-finances/voies/v1/emulateur.txt`.
- La ligne « Tests » : `npx vitest run <fichiers touchés> --reporter=dot --no-color > work/missions/2026-11-14-finances/voies/v1/tests.txt`.
Réponse finale au pilote : une ligne.
