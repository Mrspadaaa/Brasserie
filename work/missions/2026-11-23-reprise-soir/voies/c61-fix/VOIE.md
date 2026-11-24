# Voie c61-fix — rendre verts les tests C56 écrits par une autre voie (R43..R46)

- Agent : auteur ; Modèle : sonnet ; Niveau : jugement ; Plafond : 100 tours. Copie : C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie.
- Lis ../../COMMUN.md puis DOSSIER.md À LA PLACE des sources brutes ; ouvre les captures citées dans BUGS.md.

## Économie
- Mécanique : aucune.
- Gestes : grep des équivalents par règle, un script par lot ; tests dans des fichiers.

## À faire
1. Plan court en tête de RESULTAT.md : par règle, chaque endroit (liste de voies/c61-tests/RESULTAT.md) et son correctif.
2. Corriger le CODE jusqu'à tests/unit/c61Regles.test.tsx vert ; c48..c56Regles restent verts. Tu ne modifies pas ces tests ; un test qui te paraît faux : cite-le dans RESULTAT.md avec la raison.
3. Registre : C61-n, C59-6, C59-8 → « corrigé en local <hash> » ; node scripts/agents/controle-bugs.mjs → BUGS OK.

## Critères
- tsc (racine et functions/) : aucune erreur neuve (2 connues) ; c48..c61Regles verts ; tests/unit/carnets* verts ; npx vitest run tests/unit/proprietes vert ; BUGS OK ; commit par chemins ; fin « PRÊT À METTRE EN LIGNE <hash> ».

OWNS : src/ui/carnets/** ; src/domain/carnets/** ; functions/src/carnetIA.ts ; lignes C61, C59-6, C59-8 de BUGS.md ; ton dossier de voie. Ne touche pas src/domain/stock, src/ui/stock, src/ui/finance, src/ui/calendrier. Aucun appel Gemini réel ; ne déploie rien.

## Tenue
- RESULTAT.md tenu au fil (une limite de tours ne doit rien perdre).
- Tests : npx vitest run <fichiers> --reporter=dot > voies/c61-fix/tests.log 2>&1; tail -5 voies/c61-fix/tests.log
- Pas de captures locales : preuve en ligne par le pilote et le critique.
