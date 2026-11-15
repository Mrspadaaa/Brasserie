# Voie sp — Synthèse : choisir n'importe quelle période (CP-9)

Agent : auteur (Sonnet), plafond 70. Worktree `C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/jolly-mahavira-cc0cc2`.

## Ses mots (10.11, capture de Finances › Synthèse en ligne, segment « sept. oct. nov. tout »)
« Et pourquoi il ya que les 3 dernier moi, et je peux pas faire par exemple 6 mois ? 4 mois ECT ? »

## Décision du pilote (lecture étroite, réversible ; sa maquette g3a reste la base, règle n° 1)
Le segment de g3a (« sept. oct. nov. tout ») reste tel quel. On ajoute à sa fin un dernier élément « … » (même segment, même taille) :
le toucher montre, juste sous le segment, une rangée compacte « du [mois ▾] au [mois ▾] » (deux champs mois natifs `type="month"`,
bornés au mois courant, `du ≤ au`) ; la période choisie remplace le mois ou « tout ». Le titre dit la plage (« juin – nov. 2026 » ;
sur deux années « déc. 2025 – mars 2026 »). Les trois mois et « tout » restent un toucher direct ; un mois touché referme la rangée.
Aucune carte, aucune feuille. Tout le reste de la Synthèse (scène entré/dépensé, matériel à part, En caisse, lignes-tâches) suit la période
choisie avec les mêmes calculs.

## À faire
1. Domaine : `src/domain/finance/periodeSynthese.ts`, `PeriodeEntree` gagne `jusqua?: string` (`AAAA-MM`) : avec `mois` = début, une pièce
   compte si son mois est dans [mois, jusqua] ; sans `jusqua`, rien ne change (Annuel et Opérations l'appellent : `annuel/calculs.ts`,
   `TransactionJournal.tsx`). Tests unitaires : plage de 4 et 6 mois, à cheval sur deux années, bornes incluses, sans `jusqua` identique.
2. Écran : `src/ui/finance/FinanceOverview.tsx` (l.53 appelle `periodeSynthese`) et `src/ui/finance/synthese/Scene.tsx` (le segment et le
   titre). Si l'état du mois vit dans `src/components/tabs/FinancesTab.tsx` : NE PAS y toucher (voie sd) ; garde la plage en état local de
   FinanceOverview et écris dans RESULTAT.md ce qu'il faudrait y brancher.
3. Test d'intégration neuf `tests/integration/synthesePeriode.test.tsx`, rouge d'abord sur HEAD : « … » ouvre du/au, choisir juin → nov.
   donne le titre et les totaux de la plage.
4. `npx vitest run <fichiers> --reporter=dot > voies/sp/tests.txt 2>&1` (neufs + tests qui lisent periodeSynthese / la Synthèse : grep).
   `npx tsc --noEmit` hors firebase-admin, firebase-functions, cheerio, @noble/hashes, react-zoom-pan-pinch ; `npx vite build --outDir "$TEMP/sp-build"`.
5. Captures 390 tactile et 1280, clair et cave, `?dev-local&finance-demo` : segment au repos, rangée du/au ouverte, plage de 6 mois choisie ;
   côte à côte avec g3a (`work/missions/2026-11-09-compta-prix/p3/` ou `p2/`, cherche g3a), ouvertes (L12). Serveur `npx vite --port 3004
   --strictPort` en arrière-plan (3001 à 3003 sont à d'autres voies), arrêté à la fin.

## Possède
`src/domain/finance/periodeSynthese.ts`, `src/ui/finance/FinanceOverview.tsx`, `src/ui/finance/synthese/Scene.tsx`, le CSS de la Synthèse
(grep `syn-` ; pas Caisse.tsx), tests neufs `tests/unit/periodeSynthesePlage.test.ts` et `tests/integration/synthesePeriode.test.tsx`,
tests existants qui lisent ces fichiers (grep), `work/missions/2026-11-09-compta-prix/voies/sp/**`.
Ne touche pas : `src/components/tabs/FinancesTab.tsx`, `src/ui/finance/synthese/Caisse.tsx`, `src/ui/finance/previsions/**`,
`src/ui/finance/FinanceForms.tsx`, `src/domain/finance/ledger.ts` (voie sd), `src/ui/finance/TransactionJournal.tsx`,
`src/ui/finance/operations/**` (voie vo), `src/ui/prix/**` (voie pc).

RESULTAT.md au fil dans `voies/sp/RESULTAT.md`. Aucun commit, pas de `git stash`, Gemini jamais appelé, aucune donnée réelle. Rends une ligne.
