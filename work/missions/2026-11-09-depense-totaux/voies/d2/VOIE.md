# Voie d2 — brancher les contrôles de la pièce à l'écran Dépense (mission 2026-11-09-depense-totaux)

- Agent : auteur · Modèle : sonnet · Plafond : 120 tours · Décideur : pilote
- Lis : `CLAUDE.md`, `cerveau/LECONS.md` (L11, L12, L13, L17), `.claude/rules/affinee-frontend.md`, `DESIGN.md`, la fin de
  `work/refonte-frontend/v4/SPEC-BRASSEUR.md` (09.11), puis `../t1/RESULTAT.md`, `../c1/RESULTAT.md` (API en tête) et `../b1/RESULTAT.md` (P1 à P4).

## Objectif
Finir et brancher ce que t1 et c1 ont laissé ouvert ; c'est fini quand c'est atteint par la vraie lecture :
1. `src/services/geminiScanner.ts` garde à la normalisation les champs neufs de c1 (`amountPaid`, `paymentMethod`, `printedItemCount`,
   `countedAmounts`, EAN comptés, lignes hors articles, zone incomplète…) ; test.
2. Le bloc des contrôles de t1 (`src/ui/finance/controlesCroises*.ts(x)`) affiche les contrôles de `src/domain/finance/controlesPiece.ts`,
   chacun avec ses deux valeurs, son verdict et sa pastille-geste (règle du brasseur : on touche, on arrive au geste). Le vert
   « articles » n'existe que devant un comptage indépendant concordant (P2).
3. P4 : un rabais se rattache à l'article du dessus et s'appelle « Rabais », pas le libellé de taxe (`finale.ts`, `groupes.ts`, `Ligne.tsx`) ;
   il n'est jamais compté comme article.
4. Les 6 tests rouges de l'écran Dépense laissés par c1 et t1 : corrigés, sans affaiblir une assertion (une assertion caduque est
   listée avec sa raison).

## Contrôles
- Tests qui échouent avant (L13) ; `npx tsc --noEmit -p .` ;
  `npx vitest run tests/unit/depense tests/unit/finance tests/integration/depense* tests/integration/finance --reporter=dot > work/missions/2026-11-09-depense-totaux/voies/d2/tests.txt`
  (adapter aux dossiers réels de l'écran Dépense) ; ligne « Tests » dans RESULTAT.md, avec zéro rouge dans la zone.
- Captures Chrome sans écran (skill `webapp-testing`) au banc de lecture, avec des lectures rejouées anonymisées des quatre pièces
  (Sun Store 1 et 2, BAUHAUS taché et copie), à 390 tactile et 1280, clair et cave. Montrer : le bloc au repos, une pastille touchée
  et son geste atteint, la recherche. Captures dans `voies/d2/captures/`, toutes ouvertes.

## Possède
- `src/services/geminiScanner.ts`, `src/ui/finance/**`, `src/domain/finance/**`, `src/ui/fermentescibles/` : non ; les fichiers de
  lignes de la Dépense (`finale.ts`, `groupes.ts`, `Ligne.tsx`, à leurs chemins réels) ;
- `tests/unit/depense/**`, `tests/unit/finance/**`, `tests/integration/depense*`, `tests/integration/finance/**` ;
- `work/missions/2026-11-09-depense-totaux/voies/d2/**`.
Rien dans `functions/` ; ni commit ni stash.

## Exigences transversales et acquis
- La maquette choisie de la Dépense reste la base, dans son langage.
- Inconnu ≠ 0 : une valeur non lue s'affiche « non lu », jamais un chiffre inventé.
- Peu de texte au premier plan.
- Aucune donnée réelle dans Git.

## Rendre (exigé par `.claude/hooks/garde-jetons.mjs`, L18)
- `RESULTAT.md` tenu au fil, mis à jour tous les 5 éléments : une limite de tours ne perd rien.
- La ligne « Tests » écrite dans un fichier (`--reporter=dot > …/d2/tests.txt`).
- Les captures 390 tactile et 1280, clair et cave, toutes ouvertes.
Réponse finale au pilote : une ligne.
