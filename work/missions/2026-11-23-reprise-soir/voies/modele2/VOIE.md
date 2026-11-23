# Voie modele2 — test par modèle de nouveau vert (contre-exemple « An » ≠ 21,9 sem.)

- Agent : auteur ; Modèle : sonnet ; Niveau : jugement ; Plafond : 100 tours. Code : Brasserie ; Playwright : ../lot-cal (git -C ../lot-cal merge --ff-only claude/refonte-houblons-v4 après chaque commit).
- Lis ../../COMMUN.md puis DOSSIER.md À LA PLACE des sources brutes.

## Économie
- Mécanique : aucune — diagnostic sur un contre-exemple.
- Gestes : rejeu ciblé du contre-exemple (test unitaire sur le réducteur si possible), puis une seule série de 200 ; sorties dans des fichiers.

## À faire
1. Reproduire le contre-exemple au plus petit (test unitaire du réducteur, rouge).
2. Trouver si fix38c l'a introduit ou s'il préexistait ; corriger le cœur.
3. 200 suites graine 4444 et graine 7 vertes.

## Critères
- tsc : aucune erreur neuve ; tests calendrier verts ; deux séries de 200 vertes (logs dans ton dossier) ; commit par chemins ; « PRÊT À METTRE EN LIGNE <hash> ».

OWNS : src/ui/calendrier/cadre/** ; src/ui/calendrier/entete/** ; src/domain/calendrier/** ; tests/unit/calendrier* ; ton dossier de voie. e2e/calendrier/** en lecture seule.

## Tenue
- RESULTAT.md tenu au fil (une limite de tours ne doit rien perdre).
- Tests : npx vitest run <fichiers> --reporter=dot > voies/modele2/tests.log 2>&1; tail -5 voies/modele2/tests.log
- Pas de captures locales.
