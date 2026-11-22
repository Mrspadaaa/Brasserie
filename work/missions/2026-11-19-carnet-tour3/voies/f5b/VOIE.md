# Voie f5b — correction chirurgicale après la critique v4 (suite de f5), mission 2026-11-19-carnet-tour3
Lire `../../COMMUN-CODE.md`, `../f5/VOIE.md` (contexte, n° 1 et 2 déjà faits en 1f243127a) et `../v4/RESULTAT.md` § Problèmes
(ouvrir chaque capture citée, `../v4/captures/`, `../f2/captures/`). Liste figée, chaque n° prouvé seul ; rien d'autre.
Redites et densité : sa maquette retenue décide (`work/missions/2026-11-17-port-carnet/MISSION.md`) ; retirer une redite, jamais une information (L27).
Une autre voie (f5b/f5c) corrige en même temps : respecter « Possède » ; un fichier de l'autre → « DEMANDE » dans RESULTAT.md.
Ta liste : n° 3 (« Y ajouter en façon » proposé pour le titre d'un carnet existant : attendu « Ouvrir ce carnet »), n° 10 (VALEUR FAUSSE :
« moins bien que la 1re sur tout » alors que la 2e a le meilleur débit — priorité 1), n° 11 (lien collé appelé « votre phrase »),
n° 12 (lien de hotte collé depuis la liste : carnet titré « exemple.invalid » et « Y ajouter en façon »), n° 13 (puce « Coller : exemple.in » coupée net à 390).
Possède : src/domain/carnets/*, src/ui/carnets/CarnetsVue.tsx, CadreArrivee.tsx, EtatIA.tsx, ListeCarnets.tsx, ChampCarnet.tsx, leurs tests.

## Preuves (obligatoires)
- RESULTAT.md tenu au fil : `n° | verdict (corrige/ecarte + référence) | commit | test | rouge→vert | état à capturer`.
- Tests : `npx vitest run <fichiers> --reporter=dot > voies/f5b/tests-rouge.txt` puis `> voies/f5b/tests-vert.txt` ; à la fin
  `npx vitest run tests/unit/carnets* tests/integration/carnets* --reporter=dot > voies/f5b/tests-final.txt` (un échec dans un fichier de l'autre voie : le dire) ; tsc.
- Captures 390 et 1280 : prises et ouvertes par la voie de vision suivante (v5) ; écrire pour chaque n° l'état exact à capturer.
- Commit par chemins à chaque n° vert (fichiers de test non suivis compris : `git status --short tests`), `git show --stat HEAD` vérifié.
- Plafond : à 150 k, commit de ce qui est vert puis `REPRISE : <fichier>`.
