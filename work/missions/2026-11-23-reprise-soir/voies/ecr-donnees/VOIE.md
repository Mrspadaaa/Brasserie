# Voie ecr-donnees — les écritures justes partout (retrait, genres, montants, Calendrier)

- Agent : auteur ; Modèle : sonnet ; Niveau : jugement ; Plafond : 100 tours. Copie : C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie.
- Lis ../../COMMUN.md puis DOSSIER.md À LA PLACE des sources brutes.

## Économie
- Mécanique : aucune — la preuve se fait en ligne par le pilote (« les seul vrai tests sont ceux sur la vrai app »).
- Gestes : grep ciblé, un script par lot ; tests dans un fichier.

## À faire
1. Avant le code : plan court en tête de RESULTAT.md (cause de chaque constat, fichier:ligne, correctif).
2. Chaque constat, par gravité : test rouge sur le code actuel (règle de calcul ou d'état), correction, vert.
3. Aucune donnée réelle touchée ; aucune migration sans le dire.

## Critères
- tsc : aucune erreur neuve (2 connues) ; tests touchés verts ; npx vitest run tests/unit/proprietes vert ; commit par chemins ; fin « PRÊT À METTRE EN LIGNE <hash> ».

OWNS : le domaine des écritures et prévisions (src/domain/finance/** et services concernés, à nommer) ; le classement des écritures dans les rangées du Calendrier (src/domain/calendrier* ou src/ui/calendrier/rangees, à nommer) — PAS la feuille de saisie (voie ecr-saisie), PAS src/ui/calendrier/cadre ni entete (voie modele) ; tests/unit/ que tu crées ; ton dossier de voie.

## Tenue
- RESULTAT.md tenu au fil (une limite de tours ne doit rien perdre).
- Tests : npx vitest run <fichiers> --reporter=dot > voies/ecr-donnees/tests.log 2>&1; tail -5 voies/ecr-donnees/tests.log
- Pas de captures locales : preuve en ligne par le pilote.
