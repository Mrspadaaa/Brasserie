# Voie cal — Calendrier : barre minuscule, paysage, « déc. » coupé

- Mission : 2026-11-19-tour3-correctifs
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 120 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : pilote

## Objectif

1. **T2-2** (Calendrier 390) : toucher la barre minuscule du brassin réel « Ttt » n'ouvre aucune fiche (vignette et nom touchés).
   Trouver la cause (barre trop courte pour une cible ? brassin d'un état non câblé, sans date de fin, passé ? nom posé à côté
   sans geste ?). Correction : TOUT brassin de la frise ouvre sa fiche au toucher, barre, vignette ou nom, avec une zone de
   toucher d'au moins 44 px de large et 24 px de haut même pour une barre de 3 px (zone élargie invisible, sans changer le dessin).
2. **T2-5** (Calendrier 844×340, au repos) : 1re barre de la frise à ≈ 39-45 % de la hauteur ; la règle CAL-PAYS
   (`work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md` du dépôt Brasserie, grep CAL-PAYS et CAL-GRAPH-PETIT) vise ≤ 25 %.
   Le plein écran atteint déjà 26,8 %. Relire `work/missions/2026-11-18-choix-calendrier/tour2/cal/RESULTAT.md` (déjà fait :
   en-tête d'une ligne, courbe 60 px). Trouver ce qui reste au-dessus de la frise en paysage et le réduire (ex. barre d'outils
   et courbe côte à côte, marges, en-tête de l'app qui part au défilement) SANS retirer une pièce de la maquette choisie.
   Mesurer : top de la 1re barre / 340. Si ≤ 25 % est impossible sans retirer une pièce, aller au plus bas et écrire
   « DÉCISION À PRENDRE » avec la mesure.
3. **T2B-2** (Calendrier 390) : un libellé « déc. » coupé reste en haut de la frise, au-dessus des semaines (S47…). Un
   libellé de mois qui ne tient pas entier au bord ne s'affiche pas (ni coupé, ni orphelin). NE PAS trancher T2-1 (rangées
   d'axe : choix du brasseur, ouvert) : ne pas déplacer ni retirer la rangée des mois elle-même.
Fixture : `?preview=calendrier&jeu=brasseur` et le jeu complet (voir tour2/cal/RESULTAT.md) ; ajouter au test un brassin
à barre très courte (1 jour) et un brassin passé.

## Entrées
- `work/missions/BUGS.md` (dépôt Brasserie) — lignes des défauts
- `work/missions/2026-11-18-choix-calendrier/tour2/` (dépôt Brasserie) — rapports du tour 2

## Possède (seuls chemins où écrire, avec RESULTAT.md et tests.txt de ce dossier)
- `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet/src/ui/calendrier/`
- `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet/src/components/tabs/CalendrierTab.tsx`
- `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet/src/components/Header.tsx`
- `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet/tests/integration/calendrierTour3.test.tsx`

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

## Reprise (agent neuf, 19.11 après-midi) — [CONTRAT RÉÉCRIT]
T2-1, T2-2, T2B-2 sont faits (voir RESULTAT.md, 10/10). Il reste, sans refaire le reste :
1. **T2-5, option a tranchée par le pilote** : garder le repos paysage tel quel (≈ 38,8 %) ; en plein écran 844×340, viser
   ≤ 25 % (1re barre ≤ 85 px) en serrant la bande des semaines (24 → 22 px) et les écarts, sans retirer de pièce. Test rouge avant.
2. Tests voisins : `npx vitest run tests/integration/calendrier* tests/unit/calendrier* --reporter=dot > voies/cal/tests.txt` ;
   les cas qui exigent des mois dans la courbe ALIGNÉE suivent la règle nouvelle (T2-1) : mise à jour, pas contournement.
3. Banc : `node banc.mjs captures` dans ce dossier (chdir déjà corrigé ; adresse `?preview=calendrier`), puis ouvrir (Read)
   `p390-clair-aligne.png`, `p390-cave-aligne.png`, `l844-clair-repos.png`, `l844-cave-plein.png`, `p390-clair-fiche.png`, `d1280-clair-repos.png`.
Mettre RESULTAT.md à jour (première ligne OK/ECHEC). Header.tsx : une autre session y écrit aussi ; relire juste avant toute écriture.
