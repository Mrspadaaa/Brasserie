# Voie ecr2 — écritures : Autres entrées à part, Modifier = la saisie, corrections justes (E38-2..8, E35-4, E35-13)

- Agent : auteur ; Modèle : sonnet ; Niveau : jugement ; Plafond : 120 tours. Copie : C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie.
- Lis ../../COMMUN.md puis DOSSIER.md À LA PLACE des sources brutes.

## Économie
- Mécanique : aucune — la preuve se fait en ligne par le pilote.
- Gestes : grep ciblé, un script par lot ; tests dans un fichier.

## À faire
1. Plan court en tête de RESULTAT.md (cause, fichier:ligne, correctif) pour chaque constat.
2. Par gravité : test rouge sur le code actuel, correction, vert. E38-3 et E38-2 d'abord (données).
3. Aucune donnée réelle touchée ; aucune migration sans le dire.

## Critères
- tsc : aucune erreur neuve (2 connues) ; tests touchés verts ; npx vitest run tests/unit/proprietes vert ; commit par chemins ; fin « PRÊT À METTRE EN LIGNE <hash> ».

OWNS : src/ui/saisie/** ; src/components/EditTransactionModal.tsx ; le domaine des écritures (src/domain/finance/** et services concernés) ; les groupes des Opérations, de la Synthèse et des piles (src/ui/finance/**) ; tests/unit/ que tu crées ; ton dossier de voie. PAS src/ui/calendrier ni src/domain/calendrier (voie fix38c).

## Tenue
- RESULTAT.md tenu au fil (une limite de tours ne doit rien perdre).
- Tests : npx vitest run <fichiers> --reporter=dot > voies/ecr2/tests.log 2>&1; tail -5 voies/ecr2/tests.log
- Pas de captures locales : preuve en ligne par le pilote.
