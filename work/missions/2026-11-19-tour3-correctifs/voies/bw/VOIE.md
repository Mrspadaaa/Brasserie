# Voie bw — Éditeur de recette : Abandonner, nom de l'étape Eau, OG visée

- Mission : 2026-11-19-tour3-correctifs
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 100 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : pilote

## Objectif
Trois défauts du registre (lire leurs lignes dans `work/missions/BUGS.md` du dépôt Brasserie avant le code), tous dans
`src/pages/BrewWizard.tsx` (port-carnet) :
1. **B1-NOTE-3** (l. ~2258) : « Abandonner » n'apparaît qu'avec `draftNotice || draftError` → l'afficher dès que le brouillon a changé.
2. **BR-91 / BE-15** (STEPS) : label « Eau et sels » ≠ shortLabel « Eau » → un seul nom, « Eau », partout (rail, titre, renvois).
3. **TE-13** (l. ~1016 et `p[data-role=ecart-og]` ~2569) : « OG retenue » → « OG visée 1,066 · calculée 1,068 avec tes malts »
   (valeurs réelles de la recette), plus un `title` explicatif ; la ligne ne disparaît pas sans raison (voir la ligne TE-13).
Un test rouge avant par défaut, dans `tests/unit/wizardTour3Bw.test.tsx`. Tests existants qui attendent « Eau et sels » ou
« OG retenue » : les mettre à la règle nouvelle et les nommer dans RESULTAT.md. INTERDIT : `src/ui/etapeLevure/`.

## Entrées
- `work/missions/BUGS.md` (dépôt Brasserie) — lignes B1-NOTE-3, BR-91, BE-15, TE-13

## Possède (seuls chemins où écrire, avec RESULTAT.md et tests.txt de ce dossier)
- `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet/src/pages/BrewWizard.tsx`
- `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet/tests/unit/wizardTour3Bw.test.tsx`
- les tests existants qui encodent l'ancien libellé (nommés dans RESULTAT.md)

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
