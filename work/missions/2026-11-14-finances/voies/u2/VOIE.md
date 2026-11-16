# Voie u2 — Prévisions et projets : supprimer (21, 27), « Rien de prévu » (22), « de4 » (24), frise des mois (25), étiquettes du projet (26)

- Mission : 2026-11-14-finances
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 120 tours ; 3 essais par critère
- Dépend de : e3815f5d (en ligne : en-ligne/2026-11-16-finances)
- Décideur en cas de doute : pilote

## Objectif
Prévisions et projets : supprimer (21, 27), « Rien de prévu » (22), « de4 » (24), frise des mois (25), étiquettes du projet (26) (constats du jeu en ligne de nuit 16.11).

## Entrées
- Constats : `C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/BUGS.md`, section « Jeu en ligne nuit 16.11 » (lire seulement les numéros cités) ; contrat : section « Contrat réécrit — 16.11, nuit » de `work/missions/2026-11-14-finances/MISSION.md`.
- Règles Firestore (lecture seule) : `C:/Users/mrspa/Documents/Brasserie/firestore.rules` : une pièce (transaction) et un paiement ne se suppriment jamais ; les autres collections métier (prévisions, projets) se suppriment.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `src/ui/finance/prevision`
- `src/ui/finance/projet`
- `src/ui/finance/UpgradeSheet.tsx`
- `src/ui/finance/UpgradeWorkspace.tsx`
- `src/ui/finance/upgrades.css`
- `src/ui/finance/previsions`
- `src/ui/finance/budget`
- `src/ui/finance/profil`
- `src/ui/finance/FinanceForms.tsx`
- `src/ui/finance/BrewBudgetSheet.tsx`
- `src/domain/finance/upgrades.ts`
- `work/missions/2026-11-14-finances/voies/u2`
- `tests` (tests neufs de la voie, et ceux que ces corrections rendent faux)

## Consignes (décisions du pilote)
Pour chaque constat : d'abord un test qui échoue sur HEAD (le dire dans RESULTAT.md), puis la correction, puis le test vert.
- **21** : une prévision se supprime (geste « Supprimer » dans sa feuille, confirmation), en plus de l'état « Annulée ».
- **27** : un projet de matériel se supprime (confirmation) ; « Archiver » demande confirmation et se défait.
- **22** : « Rien de prévu » disparaît dès qu'une prévision est enregistrée.
- **24** : « Prix de 4 ingrédients » (espace, et accord au singulier « de 1 ingrédient »).
- **25** : frise du solde de m4pf-c : chaque mois une seule fois.
- **26** : la bulle et l'étiquette du projet gardent le nom tel quel (pas de minuscules) et ne coupent pas « ZZ » : nom raccourci par la fin avec « … ».
- Captures 390 et 1280, clair et cave, de chaque point, dans `work/missions/2026-11-14-finances/voies/u2/cap/`, ouvertes.

## Exigences transversales et acquis (recopiés, L05, L06)
- Règle n° 1 : les maquettes choisies telles quelles (voies m1, m3, m4, m5) ; v6a et s2ap2 intactes (`node work/missions/2026-11-14-finances/voies/o1/controle-v6a.mjs 3000` V6A OK, `node work/missions/2026-11-14-finances/voies/f1/controle-frise.mjs 3000` FRISE OK).
- Un test se change seulement s'il décrit ce que ses choix remplacent. Écritures : services existants, un lot par étape, règles Firestore en lecture seule. Aucune donnée réelle ; banc `http://localhost:3000/?dev-local&finance-demo` (ne pas relancer). Pas de Fable, aucun sous-agent. `git status --short` à la fin. Ne commite pas.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil.
- `node work/missions/2026-11-14-finances/voies/q5/emulateur.mjs > work/missions/2026-11-14-finances/voies/u2/emulateur.txt`.
- La ligne « Tests » : `npx vitest run <fichiers touchés> --reporter=dot --no-color > work/missions/2026-11-14-finances/voies/u2/tests.txt`.
Réponse finale au pilote : une ligne.
