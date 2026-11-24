# Voie c48-tests — écrire, AVANT tout correctif, les tests rouges des règles C48 (méthode 24.11 : celui qui corrige n'écrit pas le test)

- Agent : auteur ; Modèle : sonnet ; Niveau : jugement ; Plafond : 80 tours. Copie : C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie.
- Lis ../../COMMUN.md puis DOSSIER.md À LA PLACE des sources brutes ; ouvre les captures citées dans BUGS.md (lignes C48-).

## Économie
- Mécanique : aucune.
- Gestes : grep des composants et fonctions concernés, un fichier de test par règle ; sorties dans des fichiers.

## À faire
1. Pour chaque règle R1..R5 du DOSSIER : chercher TOUS les endroits du code où elle s'applique (grep des équivalents : chaque tableau, chaque libellé, chaque liste de caractéristiques) et les lister en tête de RESULTAT.md.
2. Écrire tests/unit/c48Regles.test.ts(x) : au moins un test par endroit listé, depuis la règle (pas depuis le code actuel) ; données de fixture inspirées des vraies pages (chambres froides : prix hors TVA 2 763,65 et 2 495,60 CHF, 0 à 8 °C, volume), sans données personnelles.
3. Lancer : les tests doivent être ROUGES sur le code actuel (sauf un endroit déjà juste, à justifier) ; sortie dans tests-rouge.log.

## Critères
- tests-rouge.log : chaque règle a au moins un test rouge ; aucun fichier src/ ni functions/ modifié ; commit par chemins ; fin « TESTS ROUGES <n rouges / n total> <hash> ».

OWNS : tests/unit/c48Regles.test.ts(x) et fixtures sous tests/fixtures/c48/ ; ton dossier de voie. Ne modifie AUCUN fichier de src/ ni functions/.

## Tenue
- RESULTAT.md tenu au fil (une limite de tours ne doit rien perdre).
- Tests : npx vitest run tests/unit/c48Regles* --reporter=dot > voies/c48-tests/tests-rouge.log 2>&1; tail -5 voies/c48-tests/tests-rouge.log
