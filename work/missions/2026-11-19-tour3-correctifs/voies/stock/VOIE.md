# Voie stock — Stocks : Courses une fois, totaux alignés, défilement par la fenêtre

- Mission : 2026-11-19-tour3-correctifs
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 120 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : pilote

## Objectif

Lire `work/missions/2026-11-18-choix-calendrier/tour2/stock/RESULTAT.md` (état du tour 2).
1. **T2-6a** (Stocks › Courses, déplié) : « Rien à commander » est dit trois fois (la ligne, « 0 rien à commander », l'encadré).
   Le dire une seule fois, déplié comme replié.
2. **T2-6b** : Courses dit « 24 en tout » quand Étagère dit « manque 22 » (2 articles pile au seuil). Décision du pilote :
   Courses dit « 22 manquent · 2 au seuil » (mêmes mots et même compte qu'Étagère) ; quand aucun n'est au seuil, seulement
   « 22 manquent ». Test : la pastille « manque N » d'Étagère et le compte de Courses sont égaux sur un jeu avec 2 articles au seuil.
3. **T2-7** : remplacer le relais `src/ui/stock/defileFenetre.ts` par une option de `src/ui/EntityList.tsx`
   (`defileFenetre?: boolean` → `useWindowScroll` de react-virtuoso), utilisée par Étagère ; supprimer le relais et ses appels.
   Les autres écrans qui utilisent EntityList ne changent pas (option à faux par défaut). Garder les tests de
   `tests/integration/stocksVision1911.test.tsx` verts (en-tête qui part, aucun conteneur interne qui défile, Recompter collé).

## Entrées
- `work/missions/BUGS.md` (dépôt Brasserie) — lignes des défauts
- `work/missions/2026-11-18-choix-calendrier/tour2/` (dépôt Brasserie) — rapports du tour 2

## Possède (seuls chemins où écrire, avec RESULTAT.md et tests.txt de ce dossier)
- `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet/src/components/tabs/StocksTab.tsx`
- `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet/src/ui/stock/`
- `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet/src/ui/EntityList.tsx`
- `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet/tests/integration/stocksTour3.test.tsx`
- `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet/tests/integration/stocksVision1911.test.tsx`

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
