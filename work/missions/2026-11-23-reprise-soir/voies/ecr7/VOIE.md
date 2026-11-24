# Voie ecr7 — fin juste d'une récurrente « à payer d'ici », Habituels = Calendrier, Référence d'un salaire (E45-1..3)

- Agent : auteur ; Modèle : sonnet ; Niveau : jugement ; Plafond : 100 tours. Copie : C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie.
- Lis ../../COMMUN.md puis DOSSIER.md À LA PLACE des sources brutes.

## Économie
- Mécanique : aucune.
- Gestes : grep ciblé, un script par lot ; tests dans un fichier.

## À faire
1. Plan court en tête de RESULTAT.md (cause, fichier:ligne, correctif).
2. E45-1, E45-2, E45-3 : test rouge LANCÉ sur le code d'avant (sortie dans le fichier), correction, vert.
3. Registre : E45-1..3 → « corrigé en local <hash> » ; node scripts/agents/controle-bugs.mjs → BUGS OK.

## Critères
- tsc : aucune erreur neuve (2 connues) ; tests touchés verts ; npx vitest run tests/unit/proprietes vert ; BUGS OK ; commit par chemins ; fin « PRÊT À METTRE EN LIGNE <hash> ».

OWNS : src/ui/saisie/** ; src/components/EditTransactionModal.tsx ; src/domain/finance/** ; src/ui/finance/** ; lignes E45 de BUGS.md ; tests/unit/ que tu crées ; ton dossier de voie. Ne touche pas src/ui/carnets, src/domain/carnets, src/ui/calendrier/cadre, src/domain/stock, src/ui/stock.

## Tenue
- RESULTAT.md tenu au fil (une limite de tours ne doit rien perdre).
- Tests : npx vitest run <fichiers> --reporter=dot > voies/ecr7/tests.log 2>&1; tail -5 voies/ecr7/tests.log
- Pas de captures locales : preuve en ligne par le pilote.
