# Voie e47 — lecture des liens et Comparer (E47-1..5), centimes dans À venir et la frise (C46-5)

- Agent : auteur ; Modèle : sonnet ; Niveau : jugement ; Plafond : 120 tours. Copie : C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie.
- Lis ../../COMMUN.md puis DOSSIER.md À LA PLACE des sources brutes ; ouvre les captures citées dans BUGS.md.

## Économie
- Mécanique : le banc des liens est une commande (sans IA : gratuit).
- Gestes : grep ciblé, un script par lot ; tests et banc dans des fichiers.

## À faire
1. Plan court en tête de RESULTAT.md (cause, fichier:ligne, correctif).
2. E47-1, E47-2 (m) d'abord, puis E47-3..5, C46-5 : test rouge LANCÉ sur le code d'avant, correction, vert ; banc des liens sans IA avant/après (npx tsx scripts/banc-liens.ts --etiquette e47) : aucun champ en recul, 0 invention.
3. Registre : E47-1..5, C46-5 → « corrigé en local <hash> » ; node scripts/agents/controle-bugs.mjs → BUGS OK.

## Critères
- tsc (racine et functions/) : aucune erreur neuve (2 connues) ; tests touchés verts ; npx vitest run tests/unit/proprietes vert ; banc sans recul ; BUGS OK ; commit par chemins ; fin « PRÊT À METTRE EN LIGNE <hash> » (aiTask à déployer par le pilote si functions/ change).

OWNS : functions/src/lienIA.ts, lireLien.ts et modules de lecture des liens ; scripts/banc-liens.ts ; src/ui/carnets/** ; src/domain/carnets/** ; src/ui/finance/UpgradeWorkspace.tsx ; src/ui/calendrier/entete/Courbe.tsx (affichage des montants seulement) ; lignes E47 et C46-5 de BUGS.md ; tests/unit/ que tu crées ; ton dossier de voie. Ne touche pas src/domain/stock, src/ui/stock, src/ui/calendrier/cadre. Aucun appel Gemini réel ; ne déploie rien.

## Tenue
- RESULTAT.md tenu au fil (une limite de tours ne doit rien perdre).
- Tests : npx vitest run <fichiers> --reporter=dot > voies/e47/tests.log 2>&1; tail -5 voies/e47/tests.log
- Pas de captures locales : preuve en ligne par le pilote et le critique.
