# Voie levure — Ma levure : retour lent sur l'onglet

- Mission : 2026-11-19-tour3-correctifs
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 80 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : pilote

## Objectif

**T2B-3** (Recette › Levure) : le retour sur l'onglet « Ma levure » prend ≈ 1,2 s (Chercher et Comparer : 15 à 55 ms), mesuré en
ligne dans une iframe sur PC. INTERDIT : modifier `src/ui/etapeLevure/` (refonte en maquettes dans une autre session).
1. Mesurer (React Profiler dans un test jsdom, ou `performance.now()` autour du rendu) : qu'est-ce qui coûte au retour ?
   Remontage complet de l'étape (clé, rendu conditionnel dans BrewWizard), calcul lourd du domaine `src/domain/levure/`
   relancé, chargement paresseux (`lazy`) d'un morceau ?
2. Si la cause est dans le montage (BrewWizard, seulement le passage qui monte l'étape) : garder l'onglet monté (masqué) ou
   mémoriser ses entrées, sans changer le rendu. Test : l'onglet ne se remonte pas au retour (compteur de montage), rouge avant.
3. Si la cause est DANS `src/ui/etapeLevure/` ou `src/domain/levure/` : ne rien changer, écrire la mesure, la fonction
   fautive et la correction proposée sous « DÉCISION À PRENDRE » (le pilote la transmet à la session de la refonte).

## Entrées
- `work/missions/BUGS.md` (dépôt Brasserie) — lignes des défauts
- `work/missions/2026-11-18-choix-calendrier/tour2/` (dépôt Brasserie) — rapports du tour 2

## Possède (seuls chemins où écrire, avec RESULTAT.md et tests.txt de ce dossier)
- `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet/src/pages/BrewWizard.tsx`
- `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet/tests/unit/levureMontage.test.tsx`

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
