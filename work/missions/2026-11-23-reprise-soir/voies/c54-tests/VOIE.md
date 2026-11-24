# Voie c54-tests — écrire, AVANT tout correctif, les tests rouges des règles R19..R22 (celui qui corrige n'écrit pas le test)

- Agent : auteur ; Modèle : sonnet ; Niveau : jugement ; Plafond : 80 tours. Copie : C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie.
- Lis ../../COMMUN.md puis DOSSIER.md À LA PLACE des sources brutes ; ouvre les captures citées dans BUGS.md (lignes C54-, C53-4).

## Économie
- Mécanique : aucune.
- Gestes : grep des composants et fonctions concernés, un bloc describe par règle (« R19 »… « R22 ») ; sorties dans des fichiers.

## À faire
1. Pour chaque règle : chercher TOUS les endroits du code où elle s'applique (grep des équivalents) ; les lister en tête de RESULTAT.md.
2. Écrire tests/unit/c54Regles.test.tsx : au moins un test par endroit, depuis la règle ; fixtures (tests/fixtures/c54/ si besoin), sans données personnelles. Normalise l'attendu comme le texte.
3. Lancer : ROUGES sur le code actuel (sauf endroit déjà juste, justifié) ; sortie dans tests-rouge.log.

## Critères
- tests-rouge.log : chaque règle a au moins un test rouge ; aucun fichier src/ ni functions/ modifié ; commit par chemins ; fin « TESTS ROUGES <n rouges / n total> <hash> ».

OWNS : tests/unit/c54Regles.test.tsx et tests/fixtures/c54/ ; ton dossier de voie. Ne modifie AUCUN fichier de src/ ni functions/.

## Tenue
- RESULTAT.md tenu au fil (une limite de tours ne doit rien perdre).
- Tests : npx vitest run tests/unit/c54Regles* --reporter=dot > voies/c54-tests/tests-rouge.log 2>&1; tail -5 voies/c54-tests/tests-rouge.log
