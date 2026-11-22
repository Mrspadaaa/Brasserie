# Voie f5d — fin de la correction chirurgicale (reprise de f5c), mission 2026-11-19-carnet-tour3
Lire `../../COMMUN-CODE.md`, `../f5c/VOIE.md`, puis la REPRISE de `../f5c/RESULTAT.md` (n° 5 à 9 écrits NON commités dans port-carnet :
les garder) et `../f5b/RESULTAT.md` (7160b51e8). f5b et f5c sont finies : tu possèdes src/ui/carnets/*, src/domain/carnets/*,
src/ui/finance/UpgradeWorkspace.tsx, CSS et tests des carnets.
À faire, dans l'ordre :
1. Anciens tests qui encodaient l'ancien texte (n° 5 à 9) : les mettre à jour en le disant ; carnetsTour3F4b « PCN-103 » rouge : trouver qui l'a
   cassé (diff de ChampCarnet.tsx par 7160b51e8 contre les changements f5c) et corriger le code, pas le test.
2. Commit par chemins des n° 5 à 9.
3. n° 4 (DEMANDE de f5c : ChampCarnet.tsx), n° 10 (DEMANDE 1 de f5b : repli `moinsBienQueDe` de Comparer.tsx, VALEUR FAUSSE, priorité),
   n° 11 (DEMANDE 2 de f5b : LigneRangee.tsx / CarnetOuvert.tsx). Test rouge puis vert, commit.

## Preuves (obligatoires)
- RESULTAT.md tenu au fil : `n° | verdict | commit | test | rouge→vert | état à capturer`.
- Tests : `npx vitest run <fichiers> --reporter=dot > voies/f5d/tests-rouge.txt` puis `> voies/f5d/tests-vert.txt` ; à la fin
  `npx vitest run tests/unit/carnets* tests/integration/carnets* --reporter=dot > voies/f5d/tests-final.txt` VERT en entier ; tsc.
- Captures 390 et 1280 : prises et ouvertes par la voie de vision suivante (v5) ; écrire l'état exact à capturer par n°.
- Commit par chemins (tests non suivis compris : `git status --short tests`), `git show --stat HEAD` vérifié.
- Plafond : à 150 k, commit de ce qui est vert puis `REPRISE : <fichier>`.
