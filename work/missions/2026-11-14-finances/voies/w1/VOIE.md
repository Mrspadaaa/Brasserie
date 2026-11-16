# Voie w1 — Mineurs FN-22 à FN-26, constats 22, 24, 25, 26 du jeu de nuit, échec coutBrassinRenvois

- Mission : 2026-11-14-finances
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 120 tours ; 3 essais par critère
- Dépend de : b37600f5 (en ligne)
- Décideur en cas de doute : pilote

## Objectif
Mineurs FN-22 à FN-26, constats 22, 24, 25, 26 du jeu de nuit, échec coutBrassinRenvois.

## Entrées
- Registre de la mission : `work/missions/BUGS.md` (lignes FN-22 à FN-26) ; constats du jeu de nuit : `C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/BUGS.md` (lignes 22, 24, 25, 26 et leur REJEU) ; corrections déjà faites : `work/missions/2026-11-14-finances/voies/u2/RESULTAT.md`.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `src/ui/finance`
- `src/components/tabs/FinancesTab.tsx`
- `tests`
- `work/missions/2026-11-14-finances/voies/w1`

## Consignes
Pour chaque point : d'abord un test qui échoue sur HEAD (le dire dans RESULTAT.md), puis la correction, puis le test vert. Jouer d'abord le chemin du testeur au banc.
- **Constats 22, 24, 25, 26** (« Rien de prévu » après l'enregistrement d'une prévision, « de4 », mois répétés de la frise m4pf-c, nom du projet) : u2 les dit corrigés ; le rejeu en ligne les voit encore : rejouer le chemin du testeur jusqu'à trouver l'endroit encore faux (autre feuille, autre entrée), test rouge, corriger.
- **FN-22 à FN-26** : trois mots presque pareils dans Filtres (garder « Courantes / Tout » et « toutes les dates », renommer pour qu'ils se distinguent) ; légende du graphique de la prévision avec le nom tel quel ; nom du projet sans coupure ou coupé par la fin avec le nom entier au toucher ; « Limites » de la fiche du projet cohérent avec ses chiffres ; « 750,00 CHF » sans « CHF » seul à la ligne à 1280.
- **coutBrassinRenvois** : `tests/integration/coutBrassinRenvois.test.tsx` « ingrédient sans prix : le renvoi ouvre ses lignes, filtrées sur « À compléter » » échoue : décider si le test décrit un comportement remplacé par un choix du brasseur (m4bb-a, c3a) ou si c'est un manque ; corriger le code dans le second cas.
- Captures 390 et 1280, clair et cave, de chaque point visible, dans `work/missions/2026-11-14-finances/voies/w1/cap/`, ouvertes.

## Exigences transversales et acquis (recopiés, L05, L06)
- Règle n° 1 : les maquettes choisies telles quelles (voies m1, m3, m4, m5) ; v6a et s2ap2 intactes (`node work/missions/2026-11-14-finances/voies/o1/controle-v6a.mjs 3000` V6A OK, `node work/missions/2026-11-14-finances/voies/f1/controle-frise.mjs 3000` FRISE OK).
- Un test se change seulement s'il décrit ce que ses choix remplacent. Écritures : services existants, un lot par étape, règles Firestore en lecture seule. Aucune donnée réelle ; banc `http://localhost:3000/?dev-local&finance-demo` (ne pas relancer). Pas de Fable, aucun sous-agent. `git status --short` à la fin. Ne commite pas.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil.
- `node work/missions/2026-11-14-finances/voies/q5/emulateur.mjs > work/missions/2026-11-14-finances/voies/w1/emulateur.txt`.
- La ligne « Tests » : `npx vitest run tests/integration/coutBrassinRenvois.test.tsx tests/integration/financeWorkspace.test.tsx tests/integration/previsionAjout.test.tsx tests/integration/projetPiste.test.tsx tests/integration/profilEffets.test.tsx tests/integration/budgetPiles.test.tsx --reporter=dot --no-color > work/missions/2026-11-14-finances/voies/w1/tests.txt`.
Réponse finale au pilote : une ligne.
