# Voie r4 — deux constats du jeu en ligne (mission 2026-11-09-levure-retours)

- Agent : auteur · Modèle : sonnet · Plafond : 60 tours · Décideur : pilote
- Lis : `CLAUDE.md`, `cerveau/LECONS.md` (L13, L14), `../../critique/VERDICT-EN-LIGNE.md` (problèmes 1 et 2, captures `../../critique/en-ligne/`).

## Objectif
1. Une tuile du stock (« Levure LALLEMAND Verdant IPA ») donne une carte vide (FG ?, 5 × non documenté) alors que Verdant est au
   catalogue, et deux puces Verdant s'affichent. Un article du stock sans fiche se relie à la fiche du catalogue qui lui correspond
   (nom, fabricant, code, par `catalogueMatches` de `yeastCatalogue.ts`), seulement si la correspondance est unique et sûre. La carte
   montre alors les valeurs de la fiche ; une puce par levure.
2. Le rôle se dit « mixte » dans la recherche avancée et « double » dans l'étape, pour le même houblon. Les deux disent le même mot que
   l'étape (`maBiere/briques.tsx`, fonction du rôle) ; le filtre aussi.
Pour chacun, un test qui échoue avant.

## Contrôles
- `npx tsc --noEmit -p .`
- `npx vitest run tests/integration/etapeLevure tests/unit/levure tests/unit/hopIndexV4/rechercheAvancee* <tes tests> --reporter=dot > work/missions/2026-11-09-levure-retours/voies/r4/tests.txt`
- Captures Chrome au banc (`?dev-local&etape=levure`, `&etape=houblons`), 390 tactile, clair et cave, avant et après, ouvertes.

## Possède
- `src/ui/etapeLevure/**`, `src/domain/levure/**`, `src/ui/hopIndex/rechercheAvancee/**` ; leurs tests ;
- `work/missions/2026-11-09-levure-retours/voies/r4/**`.
Ni commit ni stash.

## Rendre (exigé par `.claude/hooks/garde-jetons.mjs`, L18)
- `RESULTAT.md` tenu au fil, mis à jour à chaque élément : une limite de tours ne perd rien.
- La ligne « Tests » écrite dans un fichier (`--reporter=dot > …/r4/tests.txt`).
- Les captures 390, clair et cave, toutes ouvertes.
Réponse finale au pilote : une ligne.
