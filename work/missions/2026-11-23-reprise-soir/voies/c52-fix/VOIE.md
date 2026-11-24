# Voie c52-fix — rendre verts les tests C52 écrits par une autre voie (R12..R15)

- Agent : auteur ; Modèle : sonnet ; Niveau : jugement ; Plafond : 120 tours. Copie : C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie.
- Lis ../../COMMUN.md puis DOSSIER.md À LA PLACE des sources brutes ; ouvre les captures citées dans BUGS.md (lignes C52-, C50-4).

## Économie
- Mécanique : aucune.
- Gestes : grep des équivalents par règle, un script par lot ; tests et banc dans des fichiers.

## À faire
1. Plan court en tête de RESULTAT.md : par règle, chaque endroit (liste de voies/c52-tests/RESULTAT.md) et son correctif.
2. Corriger le CODE jusqu'à tests/unit/c52Regles.test.tsx vert ; c48Regles et c50Regles restent verts. Tu ne modifies pas ces tests ; un test qui te paraît faux : cite-le dans RESULTAT.md avec la raison.
3. Banc des liens sans IA (npx tsx scripts/banc-liens.ts --etiquette c52) : aucun champ en recul, 0 invention.
4. Registre : C50-4, C52-1..3 → « corrigé en local <hash> » ; node scripts/agents/controle-bugs.mjs → BUGS OK.

## Critères
- tsc (racine et functions/) : aucune erreur neuve (2 connues) ; c48, c50, c52Regles verts ; tests/unit/carnets* verts ; npx vitest run tests/unit/proprietes vert ; banc sans recul ; BUGS OK ; commit par chemins ; fin « PRÊT À METTRE EN LIGNE <hash> ».

OWNS : src/ui/carnets/** ; src/domain/carnets/** ; functions/src/lienIA.ts, lireLien.ts, lienLibelles.ts et modules de lecture des liens ; lignes C50-4, C52 de BUGS.md ; ton dossier de voie. Ne touche pas src/domain/stock, src/ui/stock, src/ui/finance, src/ui/calendrier. Aucun appel Gemini réel ; ne déploie rien.

## Tenue
- RESULTAT.md tenu au fil (une limite de tours ne doit rien perdre).
- Tests : npx vitest run <fichiers> --reporter=dot > voies/c52-fix/tests.log 2>&1; tail -5 voies/c52-fix/tests.log
- Pas de captures locales : preuve en ligne par le pilote et le critique.
