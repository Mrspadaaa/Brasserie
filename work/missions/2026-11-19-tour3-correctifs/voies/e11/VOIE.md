# Voie e11 — Stocks : un article neuf hérite les mouvements d'un autre (E1-1)

- Mission : 2026-11-19-tour3-correctifs
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 100 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : pilote

## Objectif
**E1-1** (vu en ligne, tag tour 2, 2560 px) : Stocks › Ajouter un article « ZZ TEST — e1 article » (Malt, kg, stock 0) montre dès
sa création « Ce qui a bougé » : « LOT-017 · neipa v3 · mar. 10.11 · 5 → 0 kg −5 », deux « Achat · mar. 10.11 », « 3 mouvements
depuis novembre » : il hérite les mouvements d'un AUTRE article. Piste : identifiant ou référence attribué automatiquement et
réemployé (compteur, nom, catégorie), ou mouvements rattachés par nom / référence au lieu de l'id. Détail :
`work/missions/2026-11-19-carnet-tour3/voies/e1/RESULTAT.md` § « Défaut neuf » (dépôt Brasserie).
1. Trouver la cause (création d'article, génération d'id, lecture des mouvements par article). C'est le stock du brasseur : ne
   jamais réécrire ni migrer des données existantes ; la correction porte sur l'attribution et la lecture.
2. Test rouge avant : un article créé à côté d'un article qui a des mouvements n'en montre aucun, et son id diffère de tout id
   existant (article supprimé compris). Vert après.
3. Si la cause laisse déjà en base des mouvements mal rattachés : rien en base, l'écrire sous « DÉCISION À PRENDRE ».

## Entrées
- `work/missions/BUGS.md` (dépôt Brasserie) — ligne E1-1
- `src/components/tabs/StocksTab.tsx`, `src/domain/stock/`, `src/services/` (port-carnet) — à lire

## Possède (seuls chemins où écrire, avec RESULTAT.md et tests.txt de ce dossier)
- `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet/src/components/tabs/StocksTab.tsx`
- `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet/src/ui/stock/`
- `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet/src/domain/stock/`
- `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet/src/services/` (seulement le fichier fautif, nommé dans RESULTAT.md)
- `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet/tests/unit/stockArticleNeufE11.test.ts`
- Interdit : `src/ui/StockDetailSheet.tsx` (autre session) ; s'il est en cause, l'écrire sous « DÉCISION À PRENDRE ».

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
