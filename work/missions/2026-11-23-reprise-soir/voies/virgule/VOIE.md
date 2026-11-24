# Voie virgule — contrôle virgule-transversale sans faux positif (7 restants)

- Agent : auteur ; Modèle : sonnet ; Niveau : jugement ; Plafond : 50 tours. Copie : C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie.
- Lis DOSSIER.md À LA PLACE des sources brutes.

## Économie
- Mécanique : aucune.
- Gestes : lire le contrôle une fois, un script de témoins ; sorties dans des fichiers.

## À faire
1. Corriger scripts/agents/controle-virgule.mjs pour les 3 formes de faux positifs du DOSSIER, sans affaiblir la règle (un nombre affiché au point décimal reste une violation).
2. Témoins : un fichier de témoins négatifs (vraie violation : toujours signalée) et positifs (les 3 formes : plus signalées), dans ton dossier ; sortie témoins.log.
3. tests/unit/virgule-transversale vert.

## Critères
- Témoins : vraies violations signalées, 3 formes acceptées ; npx vitest run tests/unit/virgule* vert ; aucun fichier de src/ modifié ; commit par chemins ; fin « PRÊT <hash> ».

OWNS : scripts/agents/controle-virgule.mjs ; ton dossier de voie. Ne modifie aucun fichier de src/ ni tests/ (hors ton dossier).

## Tenue
- RESULTAT.md tenu au fil (une limite de tours ne doit rien perdre).
- Tests : npx vitest run tests/unit/virgule* --reporter=dot > voies/virgule/tests.log 2>&1; tail -5 voies/virgule/tests.log
