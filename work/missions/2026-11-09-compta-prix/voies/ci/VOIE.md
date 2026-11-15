# Voie ci — Clôture, étape 3 (inventaires) comme sa maquette g6, avec renvois (CP-10)

Agent : auteur (Sonnet), plafond 70. Worktree `C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/jolly-mahavira-cc0cc2`.

## Ses mots (10.11, capture en ligne d'Annuel › Clôture 2026, 3/9)
« Renvoi, meilleure info, meilleure présentation »
Sa capture : sous « Malt », la liste entière du stock en texte (« Flocons d'Avoine 3 kg aujourd'hui, Malt Chocolat 0 kg aujourd'hui, Malt
Maris Otter 6,5 kg aujourd'hui, … » sur 14 lignes, articles à 0 kg compris) qui étire la case ; aucune icône ; huit cases « ? » qui ne
s'ouvrent pas ; une phrase « La bière en cave se saisit dans la feuille : « Ajouter une ligne », nature « Bière en cours » ou « conditionnée » ».

## Maquette choisie (règle n° 1, reprise telle quelle)
g6, étape 3 : `work/missions/2026-11-09-compta-prix/p3/g6/g6-3-inventaires.png` et `etat.html` (ouvre-les). Chaque ligne : icône de la
nature, nom, UNE petite ligne (« Pilsner 3 kg aujourd'hui », « bouteilles, capsules », « Pale Ale, 27 L nets ») ; cases de même hauteur,
« ? » hachuré ou « ≈ 22,42 » estimé en vert ; « ≈ 22,42 : 3 kg au prix de la dernière facture, estimé » en une ligne.

## À faire (code : `src/ui/finance/annuel/Etapes.tsx`, `Etape3`, l.~80-110)
1. Présentation comme g6 : icônes de nature ; la petite ligne tient sur une ligne : articles à 0 exclus, les deux plus gros puis « +N »
   (ex. « Pilsner Malz 10 kg, Weizenmalz 8,5 kg +6 »), « aujourd'hui » une seule fois ; cases de hauteur égale.
2. Renvoi : chaque case « ? » (et « ≈ ») est un bouton qui ouvre la feuille d'inventaire (`c.act.onInventories`, suis-le jusqu'à la feuille
   par grep) du bon côté (1er janv. = ouverture, 31 déc. = clôture) avec la nature visée prête (Bière en cave : nature « bière conditionnée »
   déjà choisie ; Malt/Houblons : la proposition depuis le stock de cette nature). Si la feuille ne sait pas recevoir la nature, ajoute ce
   champ optionnel à ses options (sans changer le reste). Nom accessible : « Noter Malt au 31 déc. ».
3. Meilleure info : l'estimé « ≈ » aussi pour les houblons et les emballages quand le stock et une facture le permettent (même règle que le
   malt, `valeurEstimee`) ; la ligne d'estimé dit en une ligne « ≈ X : N articles au prix de leur dernière facture, estimé ». Inconnu reste
   « ? » hachuré, jamais 0.
4. La phrase « La bière en cave se saisit dans la feuille… » disparaît : le renvoi la remplace.
5. Tests rouges d'abord (`tests/integration/clotureInventaires.test.tsx`, neuf) : petite ligne bornée avec 11 malts dont des 0 kg ; case
   « ? » Malt 31 déc. ouvre la feuille côté clôture, nature malt ; Bière en cave ouvre avec la nature bière ; plus de phrase. Rouge sur HEAD.
6. `npx vitest run <fichiers> --reporter=dot > voies/ci/tests.txt 2>&1` (neuf + tests de la clôture : grep `Etape3`, `ann-inv`,
   `onInventories`). `npx tsc --noEmit` hors firebase-admin, firebase-functions, cheerio, @noble/hashes, react-zoom-pan-pinch ;
   `npx vite build --outDir "$TEMP/ci-build"`.
7. Captures 390 tactile et 1280, clair et cave, `?dev-local&finance-demo=reel` (ajoute en mémoire de capture un stock de 11 malts dont
   des 0 kg), étape 3 au repos et feuille ouverte depuis une case ; côte à côte avec g6-3 ; ouvertes (L12). Serveur `npx vite --port 3005
   --strictPort` en arrière-plan, arrêté à la fin.

## Possède
`src/ui/finance/annuel/Etapes.tsx` (Etape3 seule), le CSS de l'Annuel (`ann-`), la feuille d'inventaire de clôture (grep, ajout d'option
seulement), `tests/integration/clotureInventaires.test.tsx`, tests existants de la clôture (grep), `work/missions/2026-11-09-compta-prix/voies/ci/**`.
Ne touche pas : `src/components/tabs/FinancesTab.tsx`, `src/ui/finance/FinanceForms.tsx`, `src/domain/finance/ledger.ts`,
`src/ui/finance/previsions/**`, `src/ui/finance/synthese/**` (voie sd), `src/domain/finance/periodeSynthese.ts`, `src/ui/finance/FinanceOverview.tsx`
(voie sp), `src/ui/finance/TransactionJournal.tsx`, `src/ui/finance/operations/**` (voie vo), `src/ui/prix/**` (voie pc). Un besoin là : RESULTAT.md.

RESULTAT.md au fil dans `voies/ci/RESULTAT.md`. Aucun commit, pas de `git stash`, Gemini jamais appelé, aucune donnée réelle. Rends une ligne.
