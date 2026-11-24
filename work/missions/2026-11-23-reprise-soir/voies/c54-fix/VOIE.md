# Voie c54-fix — rendre verts les tests C54 écrits par une autre voie (R19..R22)

- Agent : auteur ; Modèle : sonnet ; Niveau : jugement ; Plafond : 100 tours. Copie : C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie.
- Lis ../../COMMUN.md puis DOSSIER.md À LA PLACE des sources brutes ; ouvre les captures citées dans BUGS.md.

## Économie
- Mécanique : aucune.
- Gestes : grep des équivalents par règle, un script par lot ; tests et banc dans des fichiers.

## À faire
1. Plan court en tête de RESULTAT.md : par règle, chaque endroit (liste de voies/c54-tests/RESULTAT.md) et son correctif.
2. Corriger le CODE jusqu'à tests/unit/c54Regles.test.tsx vert ; c48, c50, c52, c53Regles restent verts. Tu ne modifies pas ces tests ; un test qui te paraît faux : cite-le dans RESULTAT.md avec la raison.
3. Banc des liens sans IA (npx tsx scripts/banc-liens.ts --etiquette c54) si functions/ change : aucun champ en recul, 0 invention.
4. Registre : C53-4, C54-1..3 → « corrigé en local <hash> » ; node scripts/agents/controle-bugs.mjs → BUGS OK.

## Critères
- tsc (racine et functions/) : aucune erreur neuve (2 connues) ; c48..c54Regles verts ; tests/unit/carnets* verts ; npx vitest run tests/unit/proprietes vert ; BUGS OK ; commit par chemins ; fin « PRÊT À METTRE EN LIGNE <hash> ».

OWNS : src/ui/carnets/** ; src/domain/carnets/** ; functions/src/lien* ; src/ui/calendrier/entete/** ; src/ui/finance/** (fonction de nom de marche seulement) ; lignes C53-4, C54 de BUGS.md ; ton dossier de voie. Ne touche pas src/domain/stock, src/ui/stock, src/ui/calendrier/cadre. Aucun appel Gemini réel ; ne déploie rien.

## Tenue
- RESULTAT.md tenu au fil (une limite de tours ne doit rien perdre).
- Tests : npx vitest run <fichiers> --reporter=dot > voies/c54-fix/tests.log 2>&1; tail -5 voies/c54-fix/tests.log
- Pas de captures locales : preuve en ligne par le pilote et le critique.
