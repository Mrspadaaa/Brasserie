# Voie c52-tests — écrire, AVANT tout correctif, les tests rouges des règles R12..R15 (celui qui corrige n'écrit pas le test)

- Agent : auteur ; Modèle : sonnet ; Niveau : jugement ; Plafond : 80 tours. Copie : C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie.
- Lis ../../COMMUN.md puis DOSSIER.md À LA PLACE des sources brutes ; ouvre les captures citées dans BUGS.md (lignes C52-, C50-4).

## Économie
- Mécanique : aucune.
- Gestes : grep des composants et fonctions concernés, un bloc de tests par règle ; sorties dans des fichiers.

## À faire
1. Pour chaque règle : chercher TOUS les endroits du code où elle s'applique (grep des équivalents) ; les lister en tête de RESULTAT.md. R12 : dire pourquoi le correctif de c50-fix n'a pas tenu en ligne (lire voies/c50-fix/RESULTAT.md et le code) et tester le chemin qui a échappé.
2. Écrire tests/unit/c52Regles.test.tsx : au moins un test par endroit, depuis la règle ; fixtures tests/fixtures/c48/, c50/ ou c52/ (sans données personnelles). Attention à la casse : si tu normalises le texte, normalise aussi l'attendu.
3. Lancer : ROUGES sur le code actuel (sauf endroit déjà juste, justifié) ; sortie dans tests-rouge.log.

## Critères
- tests-rouge.log : chaque règle a au moins un test rouge ; aucun fichier src/ ni functions/ modifié ; commit par chemins ; fin « TESTS ROUGES <n rouges / n total> <hash> ».

OWNS : tests/unit/c52Regles.test.tsx et tests/fixtures/c52/ ; ton dossier de voie. Ne modifie AUCUN fichier de src/ ni functions/.

## Tenue
- RESULTAT.md tenu au fil (une limite de tours ne doit rien perdre).
- Tests : npx vitest run tests/unit/c52Regles* --reporter=dot > voies/c52-tests/tests-rouge.log 2>&1; tail -5 voies/c52-tests/tests-rouge.log
