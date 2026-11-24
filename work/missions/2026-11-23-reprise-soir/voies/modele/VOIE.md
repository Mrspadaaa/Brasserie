# Voie modele — test par modèle vert (200 suites) et constats ouverts du cœur de la frise

- Agent : auteur ; Modèle : sonnet ; Niveau : jugement ; Plafond : 100 tours. Code : Brasserie ; Playwright : lot-cal.
- Lis ../../COMMUN.md puis DOSSIER.md À LA PLACE des sources brutes.

## Économie
- Mécanique : aucune — le test par modèle est une commande ; le reste est du diagnostic.
- Gestes : un script par lot ; sorties dans des fichiers.

## À faire
1. Rejouer la graine -2119159308 (rouge), corriger la cause dans le cœur, rejouer : 200 suites vertes avec 3 graines.
2. T32-1, T29-6, reste de T29-2, T29-8 : chacun avec une commande du modèle ou un test unitaire rouge puis vert.

## Critères
- tsc : aucune erreur neuve ; tests calendrier verts ; etat-coherent 200 suites × 3 graines vert (log dans ton dossier) ; commit par chemins ; « PRÊT À METTRE EN LIGNE <hash> ».

OWNS : src/ui/calendrier/cadre/** ; src/ui/calendrier/entete/** ; src/domain/calendrier/temps.ts, dates.ts ; e2e/calendrier/** ; tests/unit/calendrier* ; ton dossier de voie. Ne touche pas aux CSS de la frise ni aux rangées (voie saisie).

## Tenue
- RESULTAT.md tenu au fil (une limite de tours ne doit rien perdre).
- Tests : `npx vitest run <fichiers> --reporter=dot > voies/modele/tests.log 2>&1; tail -5 voies/modele/tests.log`.
- Pas de captures locales : preuve en ligne par le pilote.
