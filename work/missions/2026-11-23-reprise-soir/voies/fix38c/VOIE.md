# Voie fix38c — année de l'axe, barre tenue au bord, apport hors des ventes (C38-1, C38-2, C38-3, T29-6)

- Agent : auteur ; Modèle : sonnet ; Niveau : jugement ; Plafond : 100 tours. Copie : C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie (Playwright : ../lot-cal, avance-la d'abord par merge --ff-only).
- Lis ../../COMMUN.md puis DOSSIER.md À LA PLACE des sources brutes.

## Économie
- Mécanique : aucune — la preuve se fait en ligne par le pilote.
- Gestes : grep ciblé, un script par lot ; tests et modèle dans des fichiers.

## À faire
1. C38-1 (B) : l'axe porte l'année juste à toute durée (14, 16, 19 mois…) : chaque année du cadre au moins une fois, jamais une année fausse. Ajoute l'invariant au test par modèle.
2. T29-6 et C38-2 : barre tenue au bord → la frise défile, l'échelle ne change pas ; date posée = date annoncée par l'étiquette.
3. C38-3 : apport avec son picto, hors du total des Ventes.
Chaque défaut : test rouge puis vert ; modèle 200 suites × 1 graine vert à la fin.

## Critères
- tsc : aucune erreur neuve (2 connues) ; tests calendrier verts ; modèle vert ; commit par chemins ; fin « PRÊT À METTRE EN LIGNE <hash> ».

OWNS : src/ui/calendrier/** ; src/domain/calendrier/** et src/domain/calendrier.ts ; e2e/calendrier/** ; tests/unit/calendrier* ; ton dossier de voie.

## Tenue
- RESULTAT.md tenu au fil (une limite de tours ne doit rien perdre).
- Tests : npx vitest run <fichiers> --reporter=dot > voies/fix38c/tests.log 2>&1; tail -5 voies/fix38c/tests.log
- Pas de captures locales : preuve en ligne par le pilote.
