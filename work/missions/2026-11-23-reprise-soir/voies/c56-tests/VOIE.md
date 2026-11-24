# Voie c56-tests — écrire, AVANT tout correctif, les tests rouges des règles R27..R30 (celui qui corrige n'écrit pas le test)

- Agent : auteur ; Modèle : sonnet ; Niveau : jugement ; Plafond : 80 tours. Copie : C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie.
- Lis ../../COMMUN.md puis DOSSIER.md À LA PLACE des sources brutes ; ouvre les captures citées dans BUGS.md (lignes C56-, C50-5).

## Économie
- Mécanique : aucune.
- Gestes : grep des composants et fonctions concernés, un bloc describe par règle (« R27 »… « R30 ») ; sorties dans des fichiers.

## À faire
1. Pour chaque règle : chercher TOUS les endroits du code où elle s'applique (grep des équivalents) ; les lister en tête de RESULTAT.md. R27 : dire pourquoi la mesure de C52-3 a menti.
2. Écrire tests/unit/c56Regles.test.tsx : au moins un test par endroit, depuis la règle ; fixtures (tests/fixtures/c56/ si besoin), sans données personnelles. Normalise l'attendu comme le texte ; vérifie qu'un attendu désigne bien ce que dit son message. R30 : le test précédent qui gardait la phrase de la maquette g01-8 avec critère (c48Regles R4, cas avec critère) devient caduc par sa réponse : marque-le .skip avec la raison citée.
3. Lancer : ROUGES sur le code actuel (sauf endroit déjà juste, justifié) ; sortie dans tests-rouge.log.

## Critères
- tests-rouge.log : chaque règle a au moins un test rouge ; aucun fichier src/ ni functions/ modifié ; commit par chemins ; fin « TESTS ROUGES <n rouges / n total> <hash> ».

OWNS : tests/unit/c56Regles.test.tsx, tests/fixtures/c56/, le seul .skip du cas R4 avec critère dans tests/unit/c48Regles.test.tsx ; ton dossier de voie. Ne modifie AUCUN fichier de src/ ni functions/.

## Tenue
- RESULTAT.md tenu au fil (une limite de tours ne doit rien perdre).
- Tests : npx vitest run tests/unit/c56Regles* --reporter=dot > voies/c56-tests/tests-rouge.log 2>&1; tail -5 voies/c56-tests/tests-rouge.log
