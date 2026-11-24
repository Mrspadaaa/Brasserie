# Voie carnet-c46 — défauts du test en ligne du Carnet, tour 46 (C46-1..6)

- Agent : auteur ; Modèle : sonnet ; Niveau : jugement ; Plafond : 100 tours. Copie : C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie.
- Lis ../../COMMUN.md puis DOSSIER.md À LA PLACE des sources brutes ; ouvre les captures citées dans BUGS.md.

## Économie
- Mécanique : aucune (un script).
- Gestes : grep ciblé, un script par lot ; tests dans un fichier.

## À faire
1. Plan court en tête de RESULTAT.md (cause, fichier:ligne, correctif).
2. Par gravité : C46-1 (B) d'abord, puis C46-2, C46-3, puis C46-4..6 ; chaque règle (prix choisi partout, extrait de recherche, compte d'étapes) : test rouge LANCÉ sur le code d'avant, correction, vert.
3. Registre : C46-1..6 → « corrigé en local <hash> » ; node scripts/agents/controle-bugs.mjs → BUGS OK.

## Critères
- tsc : aucune erreur neuve (2 connues) ; tests touchés verts ; npx vitest run tests/unit/proprietes vert ; BUGS OK ; commit par chemins ; fin « PRÊT À METTRE EN LIGNE <hash> ».

OWNS : src/ui/carnets/** ; src/domain/carnets/** ; l'avis du Calendrier qui annonce un montant de carnet (fichier à nommer au plan, hors src/ui/calendrier/cadre et entete) ; lignes C46 de BUGS.md ; tests/unit/ que tu crées ; ton dossier de voie. Ne touche pas src/ui/finance, src/ui/saisie, src/domain/finance, functions/, src/domain/stock, src/ui/stock.

## Tenue
- RESULTAT.md tenu au fil (une limite de tours ne doit rien perdre).
- Tests : npx vitest run <fichiers> --reporter=dot > voies/carnet-c46/tests.log 2>&1; tail -5 voies/carnet-c46/tests.log
- Pas de captures locales : preuve en ligne par le pilote et le critique.
