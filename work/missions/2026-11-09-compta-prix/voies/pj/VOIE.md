# Voie pj — Projets de matériel ↔ Prévisions : dire d'où vient la prévision, et renvoyer (CP-13)

Agent : auteur (Sonnet), plafond 70. Worktree `C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/jolly-mahavira-cc0cc2`.

## Ses mots (10.11, capture de Brassins › Atelier › Matériel › À venir en ligne)
« Les prévisions viennent d'ici ??? Avec des revois !!! »
Sa capture : B100 aio brewtool 3 200,00 CHF (« Date à choisir · Prêt à acheter »), Chambre chaude régulée 350,00 (« Date à choisir · Idée »),
Système d'embouteillage 4 becs inox 1 200,00 (idem) ; chacun « Budget ou date à compléter › » et « Noter l'achat → ». Et dans Finances ›
Prévisions il voit une courbe plate, « Prévu ~ 0,00 » : ces projets n'y sont pas, rien ne le dit.

## Cause (lue par le pilote)
`src/domain/finance/forecast.ts` l.~105 : un projet (`isUpgradePlan`) à compléter (`upgradeReadiness(plan).length`) est écarté de la
prévision avec un simple avertissement « Projet à compléter » (dans « Limites »). La feuille « Mes projets de matériel » existe dans
Prévisions (`src/ui/finance/previsions/Previsions.tsx` l.~178, `UpgradeWorkspace`), mais ne s'ouvre que depuis l'annexe (l.~174, `onProjets`).

## Ce qu'il faut (lecture étroite ; la forme est celle de sa maquette p5b, bandeau en pointillé déjà employé par CP-4/CP-7)
1. **Prévisions** : quand des projets ne sont pas comptés, une ligne de la même forme que « Rien de prévu › » (sous lui, ou à sa place
   si elle le rend inutile) : « 3 achats de matériel pas comptés › » et la petite ligne « date ou budget à compléter : B100 aio brewtool
   3 200,00, Chambre chaude 350,00 +1 » ; le toucher ouvre la feuille « Mes projets de matériel » existante. Un projet daté et budgété est
   déjà une marche de l'escalier (p5b, « le frigo ») : ne change rien à ce calcul.
2. **Atelier › Matériel › À venir** (`src/ui/finance/UpgradeWorkspace.tsx`) : sous chaque projet, son état vis-à-vis des prévisions, dans
   la petite ligne existante : « pas dans les prévisions » (à compléter) ou « dans les prévisions · nov. 2026 » ; et en tête de liste UNE
   ligne-renvoi « Datés et budgétés, ils entrent dans Finances › Prévisions › » qui ouvre Finances › Prévisions. Dans la feuille ouverte
   depuis Prévisions, ce renvoi ferme simplement la feuille (prop).
3. Aller de Brassins à Finances › Prévisions : un événement `affinee:ouvrir-finances` (`detail: { onglet: 'previsions' }`) sur le modèle
   de `affinee:ouvrir-reglages` (`src/App.tsx` l.~287) ; `FinancesTab.tsx` choisit le sous-onglet reçu. Sans écouteur, la ligne dit où aller.
4. Les acquis restent (lignes-tâches, bandeaux CP-4/CP-7 de la voie sd : lis `voies/sd/RESULTAT.md`).

## Tests et preuves
- Rouges d'abord (HEAD 6449c986), `tests/integration/projetsPrevisions.test.tsx` : (a) Prévisions avec 3 projets non datés : la ligne
  « 3 achats de matériel pas comptés » nomme le premier et ouvre la feuille ; (b) projet daté et budgété : pas de ligne, marche présente ;
  (c) Atelier : « pas dans les prévisions » / « dans les prévisions · <mois> » ; la ligne-renvoi émet `affinee:ouvrir-finances` ; (d) App/
  FinancesTab : l'événement ouvre Finances › Prévisions.
- `npx vitest run <fichiers> --reporter=dot > voies/pj/tests.txt 2>&1` (neufs + tests de Previsions, UpgradeWorkspace, FinancesTab, App
  qui les lisent : grep). `npx tsc --noEmit` hors firebase-admin, firebase-functions, cheerio, @noble/hashes, react-zoom-pan-pinch ;
  `npx vite build --outDir "$TEMP/pj-build"`.
- Captures 390 tactile, clair et cave (1280 clair), `?dev-local&finance-demo=reel` + ses trois projets en mémoire de capture : Prévisions,
  la feuille ouverte, Atelier › Matériel › À venir ; ouvertes (L12) ; « combien et quels problèmes ? » numéroté dans RESULTAT.md.
  Serveur `npx vite --port 3007 --strictPort` en arrière-plan, arrêté à la fin.

## Possède
`src/ui/finance/previsions/Previsions.tsx` (+ son CSS), `src/ui/finance/UpgradeWorkspace.tsx`, `src/App.tsx` (l'écouteur seul),
`src/components/tabs/FinancesTab.tsx` (le sous-onglet reçu seul), `tests/integration/projetsPrevisions.test.tsx` (neuf), tests existants
qui lisent ces fichiers, `work/missions/2026-11-09-compta-prix/voies/pj/**`.
Ne touche pas : `src/ui/finance/TransactionJournal.tsx`, `src/ui/finance/operations/**`, `src/ui/finance/TransactionRow.tsx`,
`src/ui/finance/synthese/Scene.tsx`, `src/ui/finance/PlageMois.tsx` (voie vo2), `src/domain/finance/forecast.ts` (calcul inchangé).

RESULTAT.md au fil dans `voies/pj/RESULTAT.md`. Aucun commit, pas de `git stash`, Gemini jamais appelé, aucune donnée réelle. Rends une ligne.
