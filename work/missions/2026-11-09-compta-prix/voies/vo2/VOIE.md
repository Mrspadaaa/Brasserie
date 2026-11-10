# Voie vo2 — Opérations : toujours la vue v6b, et un filtre du … au … (CP-12)

Agent : auteur (Sonnet), plafond 90. Worktree `C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/jolly-mahavira-cc0cc2`.

## Ses mots (10.11, en ligne sur 754f4894, relayés par la pilote)
« Toujours pas la bonne vue et je peux pas fitré pour une intervalles de temps précis »
Sa capture : `C:/Users/mrspa/Documents/Brasserie/work-partage/operations-1820.jpg` (ouvre-la). Pastille « ‹ Toutes les dates › »,
« Archives comprises », lignes groupées PAR JOUR (« 10 nov. », « 2 nov. », « 30 août »…), AUCUN graphe, annulées mêlées au fil,
« Annuler » / « À confirmer » qui coupent les noms. Avant lui (même jour) : « Lignes serrées / v6a … Ça ressemble pas tellement à la mini maquettes ??? ».

## Cause (lue par le pilote, `src/ui/finance/TransactionJournal.tsx`)
`modeMois` est faux dès que `allDates` (bouton « Par date », l.~344) ou `year` est posé : la bande et son graphe (`piles`, l.~236) disparaissent
et la liste passe en groupes par jour (l.~249). « Par date » confond deux choses : l'ordre de la liste et la période. Aucune plage libre.

## Ce qu'il faut (sa maquette v6b, règle n° 1, telle quelle : `work/missions/2026-11-09-compta-prix/p4/v6b/`, et `p4/v6a/`)
1. **Une seule vue, v6b, pour toute période** : en-tête bande + graphe des piles + groupes par catégorie + groupe « Annulées » en fin
   (déjà fait par vo pour le mois) — pour un mois, une plage du/au, tout l'historique, archives comprises ou non.
2. **La période** : la pastille « ‹ mois › » garde ses flèches ; on ajoute à sa droite « … » qui ouvre, juste dessous, la même rangée
   « du [mois] au [mois] » que la Synthèse (voie sp : `src/ui/finance/synthese/Scene.tsx` l.~50 ; extrais un petit composant commun
   `src/ui/finance/PlageMois.tsx` et fais-le servir aux deux, sans changer le rendu de la Synthèse). Libellé : « juin – nov. 2026 ».
   Les piles d'une plage : `periodeSynthese({ mois: du, jusqua: au, … })` (champ `jusqua` ajouté par sp). « Tout » = `mois: null`.
3. **« Par date »** (puce du bas de v6b) ne change plus la période : il range les lignes de la période par jour au lieu de par catégorie,
   bande et graphe gardés en haut. « Archives » inclut les années archivées, sans changer de vue.
4. **Lignes comme v6b** : « Annuler » n'apparaît que juste après le geste « ✓ Payé » de cette session (état « Après » de v6b) ; sinon une
   ligne sans pièce montre « + pièce », une ligne à payer « ✓ Payé », une ligne à confirmer garde son bouton. Le nom ne doit plus être
   coupé par un bouton qui n'est pas dans la maquette.
5. Les lignes-tâches acquises (« Confirmer les paiements (n) › », « Vérifier les pièces sans date › ») et leurs journaux filtrés restent.

## Tests et preuves
- Rouges d'abord (sur HEAD 6449c986), `tests/integration/operationsPeriode.test.tsx` : (a) « Par date » : graphe et bande rendus, lignes par
  jour ; (b) « Tout » / archives : groupes par catégorie et graphe ; (c) « … » → du juin au sept. : seules les pièces de juin à sept., titre
  « juin – sept. 2026 », piles de la plage ; (d) une ligne payée aujourd'hui sans geste : « + pièce », pas « Annuler ».
- `npx vitest run <fichiers> --reporter=dot > voies/vo2/tests.txt 2>&1` : neufs + tout test qui lit TransactionJournal, operations/,
  Bande, TransactionRow, synthese/Scene, periodeSynthese (grep). `npx tsc --noEmit` hors firebase-admin, firebase-functions, cheerio,
  @noble/hashes, react-zoom-pan-pinch ; `npx vite build --outDir "$TEMP/vo2-build"`.
- Captures 390 tactile (et 1280), clair et cave, côte à côte avec v6b, sur un jeu qui imite SA capture (`?dev-local&finance-demo=reel` +
  pièces de 2025 et de mai à nov. 2026, annulées, une vente encaissée aujourd'hui) : état « Tout + Archives », « Par date », plage du/au.
  Ouvre chaque capture (L12) ; « combien et quels problèmes ? » numéroté dans RESULTAT.md. Serveur `npx vite --port 3006 --strictPort`
  en arrière-plan, arrêté à la fin.

## Possède
`src/ui/finance/TransactionJournal.tsx`, `src/ui/finance/operations/**`, `src/ui/finance/TransactionRow.tsx`, `src/ui/finance/operations.css`,
`src/ui/finance/PlageMois.tsx` (neuf), `src/ui/finance/synthese/Scene.tsx` (seulement pour employer PlageMois, rendu inchangé),
`tests/integration/operationsPeriode.test.tsx` (neuf), tests existants qui lisent ces fichiers, `work/missions/2026-11-09-compta-prix/voies/vo2/**`.
Lis `voies/vo/RESULTAT.md` (ce que vo a déjà fait) et `voies/AUDIT-RESTES.md` § Opérations.

RESULTAT.md au fil dans `voies/vo2/RESULTAT.md`. Aucun commit, pas de `git stash`, Gemini jamais appelé, aucune donnée réelle. Rends une ligne.
