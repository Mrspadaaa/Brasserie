# Voie f4c — fin des carnets (reprise de f4a et f4b), mission 2026-11-19-carnet-tour3
Lire `../../COMMUN-CODE.md`, puis les REPRISE de `../f4a/RESULTAT.md` (travail NON commité dans port-carnet, à reprendre tel quel)
et `../f4b/RESULTAT.md` (commit a44245e81). f4a et f4b sont terminées : tu possèdes tout src/ui/carnets/*, src/domain/carnets/*,
leurs CSS et tests.
Décisions du pilote :
1. v2-neuf 1 = banc local seulement (base en mémoire de `?dev-local` effacée par un rechargement Vite) : ANNULER les changements
   non commités de f4a dans src/services/firestoreRepo.ts et src/services/migration.ts (restaurer depuis `git show HEAD:<f>` vers un
   fichier temporaire, comparer, puis remplacer — jamais `git checkout`), retirer leur test ; verdict `ecarte — banc local, pas la production`.
2. v2-neuf 4 : `ecarte` (R10/R11 : sa phrase en titre) ; retirer son test rouge.
3. v2-neuf 6 : appliquer la règle n° 14 (chaque critère écrit une fois) : si « puis le débit » disparaît parce que le critère rangé
   le remplace sans rien perdre, `ecarte` ; si une information est perdue, corriger.
Reste : PCN-22, v1-neuf 1, v1-neuf 2 (écrits, à commiter après vert), PCN-19, PCN-126 / v2-neuf 3, v1-neuf 4, PCN-37, PCN-20, PCN-61,
PCN-119, PCN-42. Puis toute la suite carnets verte, tsc, commit par chemins.

## Preuves (obligatoires)
- RESULTAT.md tenu au fil (une ligne par id fini).
- Tests : `npx vitest run <fichiers> --reporter=dot > voies/f4c/tests-rouge.txt` puis `> voies/f4c/tests-vert.txt` ; à la fin
  `npx vitest run tests/unit/carnets* tests/integration/carnets* --reporter=dot > voies/f4c/tests-final.txt` vert.
- Captures 390 et 1280 : faites et ouvertes par la voie de vision suivante (v4) ; écrire dans RESULTAT.md, pour chaque id corrigé,
  l'état exact à capturer (adresse du banc ou parcours `?dev-local`).
- Plafond : à 170 k, commit de ce qui est vert puis `REPRISE : <fichier>`.
