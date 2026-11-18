# Voie r3 — les 8 constats du critique (mission 2026-11-09-levure-retours)

- Agent : auteur · Modèle : sonnet · Plafond : 120 tours · Décideur : pilote
- Lis : `CLAUDE.md`, `cerveau/LECONS.md` (L03, L12, L13, L17), `.claude/rules/affinee-frontend.md`, `DESIGN.md`, `../../MISSION.md`,
  `../../ETAT.md`, et surtout `../../critique/VERDICT.md` (8 problèmes, captures dans `../../critique/captures/` et `planches/`, à ouvrir).

## Objectif
Corriger les 8 problèmes de `critique/VERDICT.md`, bloquants d'abord (1 saisie libre sans effet visible : le repli s'ouvre, défile
jusqu'à lui et met le focus dans le champ pré-rempli ; 2 poignées ↕ ↔ du graphe au-dessus du pied fixe « Retour · Suivant » : elles
passent dessous, comme le reste du contenu ; 3 filtre Arômes = Tropicaux : un houblon n'est retenu que si la famille filtrée est la
sienne au sens du dessin de l'app, et la pastille de la famille filtrée est visible sur sa ligne, D167), puis 4 à 8 tels que le
critique les corrige. Chaque correction : un test qui échoue avant (L13) quand c'est testable en jsdom ; sinon une mesure Chrome.

## Contrôles
- `npx tsc --noEmit -p .`
- `npx vitest run tests/integration/etapeLevure tests/unit/levure tests/unit/hopIndexV4/rechercheAvancee-houblons.test.tsx tests/integration/YeastRecipeChoice.test.tsx <tes tests> --reporter=dot > work/missions/2026-11-09-levure-retours/voies/r3/tests.txt`, ligne « Tests » recopiée dans RESULTAT.md.
- Captures Chrome sans écran (skill `webapp-testing` ; `voies/r1/capturer.mjs`, `voies/r2/capturer.mjs` réutilisables), bancs
  `?dev-local&etape=levure` et `&etape=houblons`, 390 tactile et 1280, clair et cave, de chaque état corrigé, côte à côte avec la capture
  du critique, toutes ouvertes. Dans `voies/r3/captures/`.

## Possède
- `src/ui/etapeLevure/**`, `src/ui/rechercheAvancee/**`, `src/domain/rechercheAvancee/**`, `src/domain/levure/**`,
  `src/ui/hopIndex/rechercheAvancee/**`, `src/ui/hopIndex/maBiere/Ajouter.tsx`, `src/ui/YeastIngredientPicker.tsx`,
  `src/ui/FermentationTemperatureChart.tsx` et son CSS si la poignée y vit ;
- `tests/integration/etapeLevure/**`, `tests/unit/levure/**`, `tests/unit/hopIndexV4/rechercheAvancee*` ;
- `work/missions/2026-11-09-levure-retours/voies/r3/**`.
Ni commit ni stash.

## Exigences transversales et acquis
Ses maquettes l5b et c6b restent la base (règle n° 1) ; au style de l'app, deux thèmes ; peu de texte ; inconnu ≠ 0 ; jamais `type="number"`.

## Rendre (exigé par `.claude/hooks/garde-jetons.mjs`, L18)
- `RESULTAT.md` tenu au fil, mis à jour tous les 5 éléments : une limite de tours ne perd rien.
- La ligne « Tests » écrite dans un fichier (`--reporter=dot > …/r3/tests.txt`).
- Les captures 390 tactile et 1280, clair et cave, côte à côte avec celles du critique, toutes ouvertes.
Réponse finale au pilote : une ligne.
