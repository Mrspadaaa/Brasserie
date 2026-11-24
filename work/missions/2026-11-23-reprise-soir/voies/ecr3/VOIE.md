# Voie ecr3 — écritures : récurrences justes, apport et prélèvement hors des totaux, Modifier = saisie (E40-1..7)

- Agent : auteur ; Modèle : sonnet ; Niveau : jugement ; Plafond : 120 tours. Copie : C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie.
- Lis ../../COMMUN.md puis DOSSIER.md À LA PLACE des sources brutes.

## Économie
- Mécanique : la mise à jour des six lignes du registre (un script).
- Gestes : grep ciblé, un script par lot ; tests dans un fichier.

## À faire
1. Plan court en tête de RESULTAT.md (cause, fichier:ligne, correctif).
2. Par gravité : test rouge, correction, vert. E40-1 et E40-2 d'abord (valeurs fausses).
3. Registre (DOSSIER § Aussi).

## Critères
- tsc : aucune erreur neuve (2 connues) ; tests touchés verts ; npx vitest run tests/unit/proprietes vert ; BUGS OK ; commit par chemins ; fin « PRÊT À METTRE EN LIGNE <hash> ».

OWNS : src/ui/saisie/** ; src/components/EditTransactionModal.tsx ; src/domain/finance/** et services d'écritures ; src/ui/finance/** ; le classement des choses dans les rangées du Calendrier (src/domain/calendrier.ts et fichiers de rangées, à nommer) — PAS src/ui/calendrier/cadre, entete, ni src/domain/calendrier/temps.ts, dates.ts (voie modele2) ; lignes citées de BUGS.md ; tests/unit/ que tu crées ; ton dossier de voie.

## Tenue
- RESULTAT.md tenu au fil (une limite de tours ne doit rien perdre).
- Tests : npx vitest run <fichiers> --reporter=dot > voies/ecr3/tests.log 2>&1; tail -5 voies/ecr3/tests.log
- Pas de captures locales : preuve en ligne par le pilote.
