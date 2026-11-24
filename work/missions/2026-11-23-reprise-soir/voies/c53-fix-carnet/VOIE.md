# Voie c53-fix-carnet — ordre des caractéristiques par groupes, carte = tête de fiche, prix unitaire insécable (R16, R17)

- Agent : auteur ; Modèle : sonnet ; Niveau : jugement ; Plafond : 100 tours. Copie : C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie.
- Lis ../../COMMUN.md puis DOSSIER.md À LA PLACE des sources brutes ; ouvre les captures citées dans BUGS.md.

## Économie
- Mécanique : aucune.
- Gestes : grep des équivalents par règle, un script par lot ; tests dans des fichiers.

## À faire
1. Plan court en tête de RESULTAT.md : par règle (R16 et R17), chaque endroit (liste de voies/c53-tests/RESULTAT.md) et son correctif.
2. Corriger le CODE jusqu'aux tests de R16 et R17 de tests/unit/c53Regles.test.tsx verts ; c48, c50, c52Regles restent verts. Tu ne modifies pas ces tests ; un test qui te paraît faux : cite-le dans RESULTAT.md avec la raison.
3. Registre : lignes de tes règles → « corrigé en local <hash> » ; node scripts/agents/controle-bugs.mjs → BUGS OK.

## Critères
- tsc : aucune erreur neuve (2 connues) ; tests de tes règles verts ; c48, c50, c52Regles verts ; npx vitest run tests/unit/proprietes vert ; BUGS OK ; commit par chemins ; fin « PRÊT À METTRE EN LIGNE <hash> ».

OWNS : src/ui/carnets/** ; src/domain/carnets/** ; functions/src/lienIA.ts, lireLien.ts, lienLibelles.ts et modules de lecture des liens ; lignes C53-1 à C53-4 ; tes lignes de BUGS.md ; ton dossier de voie. Ne touche pas src/ui/finance ni src/ui/calendrier (voie c53-fix-courbe). Ne touche pas src/domain/stock, src/ui/stock. Aucun appel Gemini réel ; ne déploie rien.

## Tenue
- RESULTAT.md tenu au fil (une limite de tours ne doit rien perdre).
- Tests : npx vitest run <fichiers> --reporter=dot > voies/c53-fix-carnet/tests.log 2>&1; tail -5 voies/c53-fix-carnet/tests.log
- Pas de captures locales : preuve en ligne par le pilote et le critique.
