# Voie c66-tests — écrire, AVANT tout correctif, les tests rouges des règles R51..R55 (celui qui corrige n'écrit pas le test)

- Agent : auteur ; Modèle : sonnet ; Niveau : jugement ; Plafond : 80 tours. Copie : C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie.
- Lis ../../COMMUN.md puis DOSSIER.md À LA PLACE des sources brutes ; ouvre les captures citées dans BUGS.md (lignes C66-, C65-4, C65-5, C65-6).

## Économie
- Mécanique : aucune.
- Gestes : grep des composants et fonctions concernés, un bloc describe par règle (« R51 »… « R55 ») ; sorties dans des fichiers.

## À faire
3. Lancer : ROUGES sur le code actuel (sauf endroit déjà juste, justifié) ; sortie dans tests-rouge.log.

## Critères
- tests-rouge.log : chaque règle a au moins un test rouge ; aucun fichier src/ ni functions/ modifié ; commit par chemins ; fin « TESTS ROUGES <n rouges / n total> <hash> ».

OWNS : tests/unit/c66Regles.test.tsx, tests/fixtures/c66/, le seul .skip du cas R4 avec critère dans tests/unit/c48Regles.test.tsx ; ton dossier de voie. Ne modifie AUCUN fichier de src/ ni functions/.

## Tenue
- RESULTAT.md tenu au fil (une limite de tours ne doit rien perdre).
- Tests : npx vitest run tests/unit/c66Regles* --reporter=dot > voies/c66-tests/tests-rouge.log 2>&1; tail -5 voies/c66-tests/tests-rouge.log
