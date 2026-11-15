# Voie us — port de g3a, la Synthèse (entré contre dépensé, l'à-payer hachuré)

Agent : auteur (Sonnet), plafond 120. Maquette choisie, reprise à 99 % (règle n° 1, L03) : `work/missions/2026-11-09-compta-prix/p2/g3a/`
(etat.html, NOTE.md, captures, ouvertes avant de coder). Décisions : `voies/COMMUN.md` (« Remplacer, jamais fusionner », « 99 % mini maquettes »,
P1–P7), `voies/ETAPE2.md`. Règle pilote : les nombres viennent du domaine, la maquette donne la forme.

Possède : `src/components/tabs/FinancesTab.tsx` (onglet Synthèse : Situation et Coûts), `src/ui/finance/FinanceOverview.tsx`, `src/ui/finance/synthese/**` (neuf), `src/ui/finance/synthese.css` (neuf), tests d'intégration des fichiers possédés et neufs `tests/integration/synthese*.test.tsx`, `work/missions/2026-11-09-compta-prix/voies/us/**`.
Un seul résultat (problème 2 de INVENTAIRE-CODE.md) : ventes − charges de la période, matériel à part ; le Bord (DashboardTab) en lecture seule, hors Possède : lister s'il contredit.

Fini = la maquette remplace l'écran actuel, atteinte depuis le menu, branchée, typée, testée, build vert.

Étape 1 : `voies/us/PLAN.md` seul (gabarit `.claude/skills/voies/references/sans-memoire.md` § 2, inventaire de chaque élément et état de la maquette,
appelants hors Possède par grep sur src/ tests/ scripts/, rejoués sur HEAD), puis arrête-toi et rends une ligne.
Étape 2 (après la revue) : code, tests rouges puis verts, `npx tsc --noEmit` hors firebase-admin, `npx vite build`, captures 390 tactile et 1280,
clair et cave, côte à côte avec la maquette (`?dev-local&finance-demo`), ouvertes.
RESULTAT.md tenu au fil dans `voies/us/RESULTAT.md` (une limite de tours ne doit rien perdre).
Tests : `npx vitest run <fichiers> --reporter=dot > voies/us/tests.txt 2>&1`.
Aucun commit, pas de `git stash`, Gemini jamais appelé. Rends une ligne.
