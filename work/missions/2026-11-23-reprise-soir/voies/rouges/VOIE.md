# Voie rouges — tests unitaires rouges hors voies, virgule-transversale, K51-1, PC-117

- Agent : auteur ; Modèle : sonnet ; Niveau : jugement ; Plafond : 100 tours. Copie : C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie.
- Lis ../../COMMUN.md puis DOSSIER.md À LA PLACE des sources brutes.

## Économie
- Mécanique : rejouer chaque test rouge sur HEAD et sur 6d7102c32 (copie temporaire : git worktree dans os.tmpdir(), node_modules de la copie principale par jonction, retirée à la fin).
- Gestes : un script par lot ; sorties dans des fichiers.

## À faire
1. Pour chaque test rouge du DOSSIER : rouge aussi sur 6d7102c32 ? Cause écrite en tête de RESULTAT.md (fichier:ligne). Rouge depuis nos voies du 24.11 : corriger la cause (code ou attente devenue fausse par une décision citée) ; déjà rouge avant : corriger si la cause est claire et dans OWNS, sinon la noter.
2. virgule-transversale : retirer les 4 violations neuves de frise-centimes (francsExacts … CHF), puis les anciennes dans OWNS.
3. K51-1 et PC-117 (lignes de BUGS.md) : test rouge lancé, correction, vert.
4. Registre : K51-1, PC-117 → « corrigé en local <hash> » ; node scripts/agents/controle-bugs.mjs → BUGS OK.

## Critères
- La suite tests/unit entière : plus aucun rouge sauf ceux notés « hors OWNS » avec cause ; tsc : aucune erreur neuve (2 connues) ; npx vitest run tests/unit/proprietes vert ; BUGS OK ; commit par chemins ; fin « PRÊT À METTRE EN LIGNE <hash> ».

OWNS : tests/unit/ (hors c48Regles, c50Regles, stock/**) ; src/ui/calendrier/entete/** ; src/ui/finance/** ; src/domain/finance/** ; functions/src/models.ts, geminiCosts.ts et leurs tests ; src/styles ou tokens visés par designTokens ; src/ui/hop* visé par hopReclasserIA ; lignes K51-1, PC-117 de BUGS.md ; ton dossier de voie. Ne touche pas src/ui/carnets, src/domain/carnets, functions/src/lien* (voie c50-fix), ni src/domain/stock, src/ui/stock (autre session : stock/murDonnees seulement noté). Aucun appel Gemini réel ; ne déploie rien.

## Tenue
- RESULTAT.md tenu au fil (une limite de tours ne doit rien perdre).
- Tests : npx vitest run <fichiers> --reporter=dot > voies/rouges/tests.log 2>&1; tail -5 voies/rouges/tests.log
- Pas de captures locales : preuve en ligne par le pilote et le critique.
