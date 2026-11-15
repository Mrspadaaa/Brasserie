# Voie ug — port de g6, l'Annuel (g4a, colonnes de l'année, puis les 9 écrans de clôture)

Agent : auteur (Sonnet), plafond 120. Maquette choisie, reprise à 99 % (règle n° 1, L03) : `work/missions/2026-11-09-compta-prix/p3/g6/`
(etat.html, NOTE.md, g6-haut/page et les 9 images d'étape g6-1 à g6-9 ; base g4a `p2/g4a/`), ouvertes avant de coder. Décisions : `voies/COMMUN.md`
(« Remplacer, jamais fusionner », « 99 % mini maquettes », P1–P7 ; l'Annuel garde l'AFC). Règle pilote : les nombres viennent du domaine
(`src/domain/finance/annual.ts`, `fribourgTax.ts`, `periodeSynthese.ts` de la voie us), la maquette donne la forme.

Possède : `src/components/tabs/FinancesTab.tsx` (onglet Annuel seulement), `src/ui/finance/TaxWorkspace.tsx`, `src/ui/finance/TaxClosingSheet.tsx`,
`src/ui/finance/FinanceForms.tsx` (ClosingSheet, AssetSheet, ExerciceField), `src/ui/finance/ArchiveManagerSheet.tsx`, `src/ui/finance/annuel/**` (neuf),
`src/ui/finance/annuel.css` (neuf), tests d'intégration des fichiers possédés et neufs `tests/integration/annuel*.test.tsx`,
`work/missions/2026-11-09-compta-prix/voies/ug/**`. Domaine en lecture seule ; un besoin de domaine se liste.

Fini = l'onglet Annuel EST g6 (colonnes de l'année en tête, puis les étapes de clôture), atteint depuis le menu, branché, typé, testé, build vert.

Étape 1 : `voies/ug/PLAN.md` seul (gabarit `.claude/skills/voies/references/sans-memoire.md` § 2, inventaire de chaque élément et état de g6 et des
9 étapes, appelants hors Possède par grep sur src/ tests/ scripts/, rejoués sur HEAD), puis arrête-toi et rends une ligne.
Étape 2 (après la revue) : code, tests rouges puis verts, `npx tsc --noEmit` hors firebase-admin, `npx vite build`, captures 390 tactile et 1280,
clair et cave, côte à côte avec g6 (`?dev-local&finance-demo`), ouvertes.
RESULTAT.md tenu au fil dans `voies/ug/RESULTAT.md` (une limite de tours ne doit rien perdre).
Tests : `npx vitest run <fichiers> --reporter=dot > voies/ug/tests.txt 2>&1`.
Aucun commit, pas de `git stash`, Gemini jamais appelé. Rends une ligne.
