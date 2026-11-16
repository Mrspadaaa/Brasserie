# Voie u1 — Écritures : apport annulable (19), retirer une écriture payée (20), Nouvelle dépense à 1280 (18)

- Mission : 2026-11-14-finances
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 120 tours ; 3 essais par critère
- Dépend de : e3815f5d (en ligne : en-ligne/2026-11-16-finances)
- Décideur en cas de doute : pilote

## Objectif
Écritures : apport annulable (19), retirer une écriture payée (20), Nouvelle dépense à 1280 (18) (constats du jeu en ligne de nuit 16.11).

## Entrées
- Constats : `C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/BUGS.md`, section « Jeu en ligne nuit 16.11 » (lire seulement les numéros cités) ; contrat : section « Contrat réécrit — 16.11, nuit » de `work/missions/2026-11-14-finances/MISSION.md`.
- Règles Firestore (lecture seule) : `C:/Users/mrspa/Documents/Brasserie/firestore.rules` : une pièce (transaction) et un paiement ne se suppriment jamais ; les autres collections métier (prévisions, projets) se suppriment.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `src/ui/finance/fiche`
- `src/ui/finance/TransactionDetails.tsx`
- `src/ui/finance/mouvement`
- `src/ui/finance/MovementSheet.tsx`
- `src/ui/finance/ExpenseSheet.tsx`
- `src/ui/finance/modifier`
- `src/components/EditTransactionModal.tsx`
- `src/domain/finance/correctionMontant.ts`
- `work/missions/2026-11-14-finances/voies/q5/emulateur.mjs`
- `work/missions/2026-11-14-finances/voies/u1`
- `tests` (tests neufs de la voie, et ceux que ces corrections rendent faux)

## Consignes (décisions du pilote)
Pour chaque constat : d'abord un test qui échoue sur HEAD (le dire dans RESULTAT.md), puis la correction, puis le test vert.
- **19 (grave)** : un apport (ou prélèvement) se retire : sa ligne de paiement offre « Corriger ce paiement » comme une dépense.
- **20** : « Retirer cette écriture » en un geste sur une pièce payée (dépense ou apport) : contre-paiement puis annulation, un lot par étape (comme `executerCorrection.ts`), confirmation avant ; une écriture annulée sort de la liste par défaut (visible par « Écritures annulées uniquement ») ; les règles interdisent la suppression : le dire en une ligne à la confirmation. Rejouer `work/missions/2026-11-14-finances/voies/q5/emulateur.mjs` avec ce cas (EMULATEUR OK, émulateur.txt dans la voie).
- **18** : Nouvelle dépense à 1280 en colonne centrée comme les autres feuilles ; « Total TTC » détaché de l'en-tête.
- **17** : non reproduit, écarté (ne rien faire).
- Captures 390 et 1280, clair et cave, de chaque point, dans `work/missions/2026-11-14-finances/voies/u1/cap/`, ouvertes.

## Exigences transversales et acquis (recopiés, L05, L06)
- Règle n° 1 : les maquettes choisies telles quelles (voies m1, m3, m4, m5) ; v6a et s2ap2 intactes (`node work/missions/2026-11-14-finances/voies/o1/controle-v6a.mjs 3000` V6A OK, `node work/missions/2026-11-14-finances/voies/f1/controle-frise.mjs 3000` FRISE OK).
- Un test se change seulement s'il décrit ce que ses choix remplacent. Écritures : services existants, un lot par étape, règles Firestore en lecture seule. Aucune donnée réelle ; banc `http://localhost:3000/?dev-local&finance-demo` (ne pas relancer). Pas de Fable, aucun sous-agent. `git status --short` à la fin. Ne commite pas.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil.
- `node work/missions/2026-11-14-finances/voies/q5/emulateur.mjs > work/missions/2026-11-14-finances/voies/u1/emulateur.txt`.
- La ligne « Tests » : `npx vitest run <fichiers touchés> --reporter=dot --no-color > work/missions/2026-11-14-finances/voies/u1/tests.txt`.
Réponse finale au pilote : une ligne.
