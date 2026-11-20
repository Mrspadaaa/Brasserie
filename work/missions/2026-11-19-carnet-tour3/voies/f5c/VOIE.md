# Voie f5c — correction chirurgicale après la critique v4 (suite de f5), mission 2026-11-19-carnet-tour3
Lire `../../COMMUN-CODE.md`, `../f5/VOIE.md` (contexte, n° 1 et 2 déjà faits en 1f243127a) et `../v4/RESULTAT.md` § Problèmes
(ouvrir chaque capture citée, `../v4/captures/`, `../f2/captures/`). Liste figée, chaque n° prouvé seul ; rien d'autre.
Redites et densité : sa maquette retenue décide (`work/missions/2026-11-17-port-carnet/MISSION.md`) ; retirer une redite, jamais une information (L27).
Une autre voie (f5b/f5c) corrige en même temps : respecter « Possède » ; un fichier de l'autre → « DEMANDE » dans RESULTAT.md.
Ta liste : n° 4 (champ G8 au focus à 390 : titre sous la barre, carte mangée par la bulle), n° 5 (titre + « votre phrase en titre » + « Façons · 1 façon » : redites),
n° 6 (« proposé par l'IA » deux fois dans « Ce qui compte », puis redit), n° 7 (Comparer 390 : « sous votre minimum » minuscule sur 3 lignes, 4e colonne coupée),
n° 8 (Choisir : « Critère : tient 80 °C » oublie « puis le débit »), n° 9 (Réalisés : « 11 700 CHF » trois fois ; noms coupés par « … »).
Possède : src/ui/carnets/* SAUF CarnetsVue.tsx, CadreArrivee.tsx, EtatIA.tsx, ListeCarnets.tsx, ChampCarnet.tsx ; src/ui/finance/UpgradeWorkspace.tsx ; CSS des carnets ; leurs tests.

## Preuves (obligatoires)
- RESULTAT.md tenu au fil : `n° | verdict (corrige/ecarte + référence) | commit | test | rouge→vert | état à capturer`.
- Tests : `npx vitest run <fichiers> --reporter=dot > voies/f5c/tests-rouge.txt` puis `> voies/f5c/tests-vert.txt` ; à la fin
  `npx vitest run tests/unit/carnets* tests/integration/carnets* --reporter=dot > voies/f5c/tests-final.txt` (un échec dans un fichier de l'autre voie : le dire) ; tsc.
- Captures 390 et 1280 : prises et ouvertes par la voie de vision suivante (v5) ; écrire pour chaque n° l'état exact à capturer.
- Commit par chemins à chaque n° vert (fichiers de test non suivis compris : `git status --short tests`), `git show --stat HEAD` vérifié.
- Plafond : à 150 k, commit de ce qui est vert puis `REPRISE : <fichier>`.
