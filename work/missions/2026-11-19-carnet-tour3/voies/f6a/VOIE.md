# Voie f6a — Dépense, constats de la vision locale v3, mission 2026-11-19-carnet-tour3
Lire `../../COMMUN-CODE.md`, `../f1/RESULTAT.md` (ce qui a déjà été fait : eccd75e42, 7b199eb85, d1848500b) et `../v3/RESULTAT.md`
(verdicts, « Défauts neufs » numérotés v3-1 à v3-10 ; captures dans `../v3/captures/` : ouvrir chaque capture citée avant de corriger).
Banc prêt : `../v3/outil.mjs`, `../v3/vite.v3.config.mjs`, `../v3/finals.ts` (réponses Gemini enregistrées, jamais d'appel réel).
Liste figée, chaque constat prouvé seul. Montants et TVA : aucun arrondi changé sans test.
Une autre voie (f6a/f6b) corrige en même temps : respecter « Possède » ; un fichier de l'autre → « DEMANDE » dans RESULTAT.md.
Ta liste (lecture et rapprochement) : LR1-5 (barré qui ne diffère que par la casse ou pas du tout : « BRAU- UND RAUCHSHOP » / « Brau- und Rauchshop »,
« 30 g » barré sous « 30 g » : jamais barré), v3-3 (fournisseur barré qui est contenu dans le nom retenu : variante, pas correction),
v3-4 (Règlement : lecture provisoire « Payé » montrée barrée comme une correction), LR3-3 (ancien montant de la voisine porté par une
autre ligne : appariement des lignes entre lectures ; « 1 ? × 4,95 » barré sous « ? × — » : prix perdu au final), LR2-3 (« 7 désaccords »
pour 35 points : le compte affiché doit dire ce qu'il compte, en mots du brasseur).
Possède : src/ui/depense/finale.ts, src/ui/depense/etat.ts, src/ui/finance/controlesCroises.ts, src/ui/depense/familles.ts, tout fichier
d'appariement des lectures sous src/ui/depense/ ou src/services/ (hors functions/), leurs tests.

## Preuves (obligatoires)
- RESULTAT.md tenu au fil : `id | verdict | commit | test | rouge→vert | état à capturer`.
- Tests : `npx vitest run <fichiers> --reporter=dot > voies/f6a/tests-rouge.txt` puis `> voies/f6a/tests-vert.txt` ; à la fin
  `npx vitest run tests/unit/depense tests/integration/expense* --reporter=dot > voies/f6a/tests-final.txt` (échec d'un fichier de l'autre voie : le dire) ; tsc.
- Captures 390 et 1280 : prises et ouvertes par la voie de vision suivante (v5) ; écrire pour chaque id l'état exact à capturer sur le banc v3.
- Commit par chemins à chaque id vert (tests non suivis compris : `git status --short tests`), `git show --stat HEAD` vérifié.
- Plafond : à 150 k, commit de ce qui est vert puis `REPRISE : <fichier>`.
