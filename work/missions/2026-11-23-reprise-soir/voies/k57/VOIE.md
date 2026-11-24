# Voie k57 — fenêtre de l'en-tête plafonnée au bord, poignée qui ne saute pas (K57-1, K57-2)

- Agent : auteur ; Modèle : sonnet ; Niveau : jugement ; Plafond : 80 tours. Copie : C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie.
- Lis ../../COMMUN.md puis DOSSIER.md À LA PLACE des sources brutes.

## Économie
- Mécanique : aucune.
- Gestes : grep ciblé ; un script par lot ; tests dans un fichier.

## À faire
1. Plan court en tête de RESULTAT.md (cause, fichier:ligne, correctif), par RÈGLE et tous les endroits semblables (grep).
2. Tests AVANT le correctif, lancés rouges (tests-rouge.log), depuis les règles du DOSSIER ; puis correctif, vert.
3. Registre : K57-1, K57-2 → « corrigé en local <hash> » ; node scripts/agents/controle-bugs.mjs → BUGS OK.

## Critères
- tsc : aucune erreur neuve (2 connues) ; tests touchés et tests calendrier verts ; npx vitest run tests/unit/proprietes vert ; BUGS OK ; commit par chemins ; fin « PRÊT À METTRE EN LIGNE <hash> ».

OWNS : src/ui/calendrier/entete/** ; src/ui/calendrier/frise/** ; tests/unit/ que tu crées ; lignes K57 de BUGS.md ; ton dossier de voie. Ne touche pas src/ui/geste (partagé), src/ui/carnets (voie c56-fix), src/domain/stock, src/ui/stock.

## Tenue
- RESULTAT.md tenu au fil (une limite de tours ne doit rien perdre).
- Tests : npx vitest run <fichiers> --reporter=dot > voies/k57/tests.log 2>&1; tail -5 voies/k57/tests.log
- Pas de captures locales : preuve en ligne par le pilote et le critique.
