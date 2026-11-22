# Voie fin — Finances : compte de la période, fiche d'une opération à payer

- Mission : 2026-11-19-tour3-correctifs
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 120 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : pilote

## Objectif

1. **T2-3** (Finances › Opérations) : en période oct., l'en-tête dit « 31 jours · 0 opération » alors que la liste montre une
   opération « à payer » datée du 19.11. Le compte et la liste doivent dire la même chose. Lire pourquoi la liste garde cette
   opération hors période (épinglage voulu des « à payer » ?). Si l'épinglage est voulu par la maquette choisie, le compte le
   dit (« 0 opération · 1 à payer ») ; sinon la liste suit la période. Garder la frise et le sélecteur de période intacts.
2. **T2-4** (Fiche d'opération `src/ui/finance/TransactionDetails.tsx`) : une opération « à payer » n'offre que « Annuler cette
   écriture » (la pièce reste, annulée, dans Archives) et « Noter un paiement » au lieu de « Confirmer le paiement ».
   Attendu : (a) le bouton principal d'une opération à payer dit « Confirmer le paiement » (même verbe que la liste et la Synthèse,
   `TransactionRow.tsx`) et fait la même chose qu'aujourd'hui ; (b) une écriture à payer saisie par erreur peut être RETIRÉE
   comme une payée (« Retirer cette écriture », même chemin que pour une payée), en gardant « Annuler » si la règle comptable
   de PRODUCT.md (section finances) l'exige pour une pièce liée (facture, stock). Lire PRODUCT.md (finances) AVANT le code et
   citer la règle dans RESULTAT.md. Aucune perte de lien stock/facture : test sur une opération liée et une libre.
Données : finances = argent du brasseur ; la voie ne change aucun calcul de solde, seulement libellés, filtre et accès au retrait
existant. Écrire le PLAN en 5 lignes en tête de RESULTAT.md avant le code.

## Entrées
- `work/missions/BUGS.md` (dépôt Brasserie) — lignes des défauts
- `work/missions/2026-11-18-choix-calendrier/tour2/` (dépôt Brasserie) — rapports du tour 2

## Possède (seuls chemins où écrire, avec RESULTAT.md et tests.txt de ce dossier)
- `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet/src/ui/finance/`
- `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet/src/components/tabs/FinancesTab.tsx`
- `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet/tests/integration/financesTour3.test.tsx`

## Exigences transversales et acquis (L05, L06)
- Code : uniquement dans `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet` (branche claude/port-carnet-1711). Ne pas committer : le pilote commite par chemins.
  Ne jamais toucher : `.codex/hooks.json`, `source4-portable-bundle-manifest-01.json`, `firestore.rules`, `.firebaserc`,
  `firestore.indexes.json`, `functions/.env` (ne pas le lire), `src/ui/etapeLevure/` (refonte en cours ailleurs).
- D'autres voies écrivent en même temps dans ce worktree : n'écrire que dans « Possède » ; `git status --short` à la fin.
- Règle n° 1 : la maquette choisie (`work/refonte-frontend/v4/choix/ecrans.json` du dépôt Brasserie) reste la base ; on
  corrige le défaut, on ne redessine pas l'écran. Peu de texte au premier plan, mots du brasseur (glossaire), au style.
- L13 : écrire d'abord le test qui ÉCHOUE sur le code actuel (noter la sortie rouge « avant » dans RESULTAT.md), puis corriger.
- L29 : méthode standard et bibliothèque déjà installée avant tout code maison.
- Gemini : jamais réel, toujours simulé. Pas de déploiement, pas de données réelles, pas de `npm run dev` lancé par Bash.
- Dire au pilote ce qu'il doit regarder à l'écran : route (`?dev-local`), geste, état attendu, tailles (390 tactile, 844×340, 1280).

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. CHECK lancés depuis la racine du dépôt Brasserie.

## Rendre
- `RESULTAT.md` (même dossier) tenu au fil : n° → fait → preuve (rouge avant, vert après), fichiers écrits, à regarder en vision.
- Tests : `npx vitest run <fichiers touchés et voisins> --reporter=dot > <ce dossier>/tests.txt` (lancé depuis port-carnet).
- Voie d'écran : les captures 390 tactile et 1280 (et 844×340 pour le calendrier), clair et cave, ouvertes (Read) avant de rendre,
  avant et après. Banc puppeteer-core (skill webapp-testing) ; vite démarré DANS le script du banc par `createServer`
  (port propre à la voie : cal 5611, fin 5612, stock 5613, recette 5614, levure 5615 ; HMR coupé : d'autres voies écrivent), `?dev-local`, arrêté à la fin.
  Captures et banc dans ce dossier. Le pilote rejoue ensuite la vision.
- Réponse finale au pilote : une ligne.
