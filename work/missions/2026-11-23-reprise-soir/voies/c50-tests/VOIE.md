# Voie c50-tests — écrire, AVANT tout correctif, les tests rouges des règles C50 (celui qui corrige n'écrit pas le test)

- Agent : auteur ; Modèle : sonnet ; Niveau : jugement ; Plafond : 80 tours. Copie : C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie.
- Lis ../../COMMUN.md puis DOSSIER.md À LA PLACE des sources brutes ; ouvre les captures citées dans BUGS.md (lignes C50-).

## Économie
- Mécanique : aucune.
- Gestes : grep des composants et fonctions concernés, un bloc de tests par règle ; sorties dans des fichiers.

## À faire
1. Pour chaque règle R6..R11 : chercher TOUS les endroits du code où elle s'applique (grep des équivalents) et les lister en tête de RESULTAT.md.
2. Écrire tests/unit/c50Regles.test.tsx : au moins un test par endroit, depuis la règle (pas depuis le code actuel) ; fixtures inspirées des vraies pages (tests/fixtures/c48/ existe ; ajoute tests/fixtures/c50/ si besoin), sans données personnelles. R11 : jsdom ne mesure pas ; teste la structure (classes, retour à la ligne permis, contrôle hors du libellé) et note ce qui reste à voir en ligne.
3. Lancer : ROUGES sur le code actuel (sauf endroit déjà juste, justifié) ; sortie dans tests-rouge.log.

## Critères
- tests-rouge.log : chaque règle a au moins un test rouge ; aucun fichier src/ ni functions/ modifié ; commit par chemins ; fin « TESTS ROUGES <n rouges / n total> <hash> ».

OWNS : tests/unit/c50Regles.test.tsx et tests/fixtures/c50/ ; ton dossier de voie. Ne modifie AUCUN fichier de src/ ni functions/.

## Tenue
- RESULTAT.md tenu au fil (une limite de tours ne doit rien perdre).
- Tests : npx vitest run tests/unit/c50Regles* --reporter=dot > voies/c50-tests/tests-rouge.log 2>&1; tail -5 voies/c50-tests/tests-rouge.log
