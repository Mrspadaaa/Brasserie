# Voie b-dep — bugs ouverts, zone « Dépense, factures, lecture » (mission 2026-11-09-levure-port)
- Agent : auteur · Modèle : sonnet · Plafond : 120 tours · Décideur : pilote
- Liste : `b-dep/BUGS-b-dep.md` (39 bugs). Règles : `../REGLES-BUGS.md` (à lire en premier, à suivre telles quelles).
- Possède : src/ui/finance/**, src/ui/depense/**, src/services/purchase*.ts, src/services/invoice*.ts, src/domain/finance/** ; les tests de ces fichiers ; `work/missions/2026-11-09-levure-port/voies/b-dep/**`.
- Port du serveur de développement : 5651.
- En plus : les 12 tests rouges sur 48d16402 dans tests/integration/expenseSheet.test.tsx (8), expenseSheetMouture.test.tsx (2), jus0Journey.test.tsx (2) : test périmé (l'écran a changé, D-n à l'appui) ou vrai défaut ; chacun dans RESULTAT.md. Gemini toujours simulé.
