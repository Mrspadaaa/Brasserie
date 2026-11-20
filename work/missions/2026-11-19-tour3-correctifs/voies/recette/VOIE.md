# Voie recette — Recette : eau ajoutée partout, planifier depuis une recette non figée

- Mission : 2026-11-19-tour3-correctifs
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 120 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : pilote

## Objectif

1. **T2-8** : l'eau ajoutée pendant ou après l'ébullition (`topUpToKettle` / `topUpL`, `installation.kettleTopUp`, voir
   `work/missions/2026-11-18-choix-calendrier/tour2/id/RESULTAT.md`) est ignorée par les appels à `waterVolumes` de
   `brewerRecipeRefresh`, `brewerTools`, `brewSystemInsights` (grep les noms réels ; si un fichier porte un autre nom,
   l'écrire dans RESULTAT.md et l'ajouter à ses écritures). Passer l'option partout où une recette a `kettleTopUp`.
   Test : sur une recette 29 L / 130 min / cuve 35 L avec 3,7 L ajoutés, ces lectures donnent le même plan d'eau
   (empâtage + rinçage) que `BrewWizard`/`brewingMath`. Rouge avant, vert après.
2. **T2B-1** (Brassins › Brasser depuis une recette, `src/ui/production/brasser/FeuilleBrasser.tsx`) : sur une recette dont le
   matériel « n'est pas figé », la feuille affiche un message rouge (renvoi à « Modifier la recette › Adapter à mon matériel
   actuel ») et « Planifier quand même » semble actif mais ne planifie rien, sans retour (clic réel compris). Trouver la cause
   (handler qui sort en silence ? garde sur le matériel ?). Attendu : « Planifier quand même » planifie le brassin avec le
   matériel actuel (comme le dit son libellé) et ferme la feuille ; si c'est impossible pour une raison de données, le bouton
   est désactivé et un bouton direct « Adapter à mon matériel actuel » fait l'adaptation sans quitter la feuille. Choisir la
   plus sûre pour les données, l'écrire dans RESULTAT.md. Test d'intégration du geste : rouge avant, vert après.

## Entrées
- `work/missions/BUGS.md` (dépôt Brasserie) — lignes des défauts
- `work/missions/2026-11-18-choix-calendrier/tour2/` (dépôt Brasserie) — rapports du tour 2

## Possède (seuls chemins où écrire, avec RESULTAT.md et tests.txt de ce dossier)
- `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet/src/domain/brewerRecipeRefresh.ts`
- `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet/src/domain/brewerTools.ts`
- `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet/src/domain/brewSystemInsights.ts`
- `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet/src/ui/production/brasser/`
- `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet/tests/unit/recetteTour3.test.ts`
- `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet/tests/unit/recetteTour3.test.tsx`

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
