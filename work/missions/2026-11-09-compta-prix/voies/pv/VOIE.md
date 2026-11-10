# Voie pv — port de p5b, les Prévisions (les étiquettes accrochées)

Agent : auteur (Sonnet), plafond 120. Maquette choisie, reprise telle quelle (règle n° 1, L03) : `work/missions/2026-11-09-compta-prix/p4/p5b/`
(etat.html, NOTE.md, captures, ouvertes avant de coder). Ses mots : « Les étiquettes accrochées / p5b / Là je vois tout sur le graphe. »
Domaine prêt : `src/domain/finance/brewForecast.ts` (brassin futur, voies/d2/RESULTAT.md), `src/domain/finance/materielFutur.ts` (achat de
matériel, voies/d3/RESULTAT.md), `src/domain/finance/forecast.ts`. Décisions : `voies/COMMUN.md` (dont « Remplacer, jamais fusionner »,
« 99 % mini maquettes »), `voies/ETAPE2.md` (usure comptée une fois). Branche aussi le geste « Prévoir » de c3a (`onOpenForecast`,
voies/uc/RESULTAT.md) vers la ligne du brassin dans Prévisions.

Possède : `src/components/tabs/FinancesTab.tsx` (onglet Prévisions et le branchement « Prévoir » seulement), `src/ui/finance/FinanceForecastSummary.tsx`,
`src/ui/finance/FinanceComparisonChart.tsx`, `src/ui/finance/UpgradeWorkspace.tsx`, `src/ui/finance/UpgradeSheet.tsx`, `src/ui/finance/previsions/**`
(neuf), `src/ui/finance/previsions.css` (neuf), tests d'intégration `tests/integration/previsions*.test.tsx` (neufs) et ceux de l'onglet Prévisions
existants, `work/missions/2026-11-09-compta-prix/voies/pv/**`.

Fini = l'onglet Finances › Prévisions EST p5b (l'ancien résumé à cinq totaux, « Comparer les mois », les sous-onglets disparaissent ou passent au
second plan dans la langue de p5b), le brassin planifié et un projet de matériel (frigo) apparaissent seuls sur l'escalier, branché, typé, testé,
build vert.

Étape 1 : `voies/pv/PLAN.md` seul (gabarit `.claude/skills/voies/references/sans-memoire.md` § 2, inventaire de chaque élément et état de p5b,
appelants hors Possède par grep sur src/ tests/ scripts/, rejoués sur HEAD), puis arrête-toi et rends une ligne.
Étape 2 (après la revue) : code, tests rouges puis verts, `npx tsc --noEmit` hors firebase-admin, `npx vite build`, captures 390 tactile et 1280,
clair et cave, côte à côte avec p5b (`?dev-local&finance-demo`), ouvertes.
RESULTAT.md tenu au fil dans `voies/pv/RESULTAT.md` (une limite de tours ne doit rien perdre).
Tests : `npx vitest run <fichiers> --reporter=dot > voies/pv/tests.txt 2>&1`.
Aucun commit, pas de `git stash`, Gemini jamais appelé. Rends une ligne.
