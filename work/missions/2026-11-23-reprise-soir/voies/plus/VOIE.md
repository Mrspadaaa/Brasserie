# Voie plus — le menu + s'affiche de nouveau normalement (régression)

- Agent : auteur ; Modèle : sonnet ; Niveau : jugement ; Plafond : 60 tours. Copie : C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie.
- Lis ../../COMMUN.md puis DOSSIER.md À LA PLACE des sources brutes.

## Économie
- Mécanique : aucune — la preuve se fait en ligne par le pilote (« les seul vrai tests sont ceux sur la vrai app »).
- Gestes : grep et git diff ciblés, un script par lot.

## À faire
1. Trouver le commit fautif (git diff entre les tags en-ligne/2026-11-23-tour31..tour35 sur les CSS et composants concernés) et la règle qui casse le panneau.
2. Corriger à la source (portée CSS, pas de rustine) ; test si une règle de calcul existe, sinon preuve en ligne.

## Critères
- tsc : aucune erreur neuve (2 connues) ; commit par chemins ; fin « PRÊT À METTRE EN LIGNE <hash> ».

OWNS : src/components/navigation/** ; le seul fichier CSS fautif (le nommer dans RESULTAT.md) ; ton dossier de voie.

## Tenue
- RESULTAT.md tenu au fil (une limite de tours ne doit rien perdre).
- Tests : `npx vitest run <fichiers> --reporter=dot > voies/plus/tests.log 2>&1; tail -5 voies/plus/tests.log`.
- Pas de captures locales : preuve en ligne par le pilote.
