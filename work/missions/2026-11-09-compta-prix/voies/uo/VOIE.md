# Voie uo — port de v6b, les Opérations (lignes serrées : qui, quoi, état, échéance, pièce)

Agent : auteur (Sonnet), plafond 120. Maquette choisie, reprise à 99 % (règle n° 1, L03) : `work/missions/2026-11-09-compta-prix/p4/v6b/`
(etat.html, NOTE.md, captures, ouvertes avant de coder). Décisions : `voies/COMMUN.md` (« Remplacer, jamais fusionner », « 99 % mini maquettes »,
P1–P7), `voies/ETAPE2.md`. Règle pilote : les nombres viennent du domaine, la maquette donne la forme.

Possède : `src/ui/finance/TransactionJournal.tsx`, `src/ui/finance/TransactionRow.tsx`, `src/ui/finance/operations/**` (neuf), `src/ui/finance/operations.css` (neuf), tests d'intégration des fichiers possédés et neufs `tests/integration/operations*.test.tsx`, `work/missions/2026-11-09-compta-prix/voies/uo/**`.
FinancesTab n'est pas à toi (voie us) : garder la même interface de TransactionJournal (props) ; un besoin de FinancesTab se liste dans RESULTAT.md.

Fini = la maquette remplace l'écran actuel, atteinte depuis le menu, branchée, typée, testée, build vert.

Étape 1 : `voies/uo/PLAN.md` seul (gabarit `.claude/skills/voies/references/sans-memoire.md` § 2, inventaire de chaque élément et état de la maquette,
appelants hors Possède par grep sur src/ tests/ scripts/, rejoués sur HEAD), puis arrête-toi et rends une ligne.
Étape 2 (après la revue) : code, tests rouges puis verts, `npx tsc --noEmit` hors firebase-admin, `npx vite build`, captures 390 tactile et 1280,
clair et cave, côte à côte avec la maquette (`?dev-local&finance-demo`), ouvertes.
RESULTAT.md tenu au fil dans `voies/uo/RESULTAT.md` (une limite de tours ne doit rien perdre).
Tests : `npx vitest run <fichiers> --reporter=dot > voies/uo/tests.txt 2>&1`.
Aucun commit, pas de `git stash`, Gemini jamais appelé. Rends une ligne.
