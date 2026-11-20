# Voie f4b — carnets, constats de la vision locale (mission 2026-11-19-carnet-tour3)
Lire `../../COMMUN-CODE.md` (règles), puis `../f4/CONSTATS.md` et, pour chaque id de ta liste, sa ligne complète et ses captures
dans `../v1/RESULTAT.md` ou `../v2/RESULTAT.md` (ouvrir la capture citée avant de corriger). Corriger chaque constat ; un constat
qui demande un choix de goût du brasseur (PCN-27) ou qui contredit sa maquette retenue → `ouvert`/`ecarte` avec la référence.
Banc de captures prêt : `../f2/captures.mjs` (banc `?preview=carnets`) ; parcours réel en `?dev-local`.
Liste : PCN-20, PCN-42, PCN-54 (390), PCN-58, PCN-61, PCN-62, PCN-63, PCN-74, PCN-102, PCN-103, PCN-108, PCN-113, PCN-119,
PCN-132, v1-neuf 3 = v2-neuf 5 (puce collée à « 2 articles à comparer », 390), v1-neuf 5 (deux couleurs pour « À comparer »),
v1-neuf 6 (« votre phrase en titre » seul, à confirmer sur capture). Thème sombre aussi pour PCN-71 et PCN-116 (non joués par v2 :
les capturer en sombre et classer).
Possède : src/ui/carnets/* SAUF CarnetsVue.tsx, EtatIA.tsx, CadreArrivee.tsx (voie f4a) ; src/ui/finance/UpgradeWorkspace.tsx ; CSS des carnets ; leurs tests.
Un fichier de f4a est nécessaire → section « DEMANDE f4a » dans RESULTAT.md, sans l'écrire.

## Preuves (obligatoires)
- RESULTAT.md tenu au fil : une ligne ajoutée dès qu'un id est fini (une limite de tours ne doit rien perdre).
- Tests : `npx vitest run <fichiers> --reporter=dot > voies/f4b/tests-rouge.txt` (avant correctif) puis `> voies/f4b/tests-vert.txt` (après) ; à la fin `npx vitest run tests/unit/carnets* tests/integration/carnets* --reporter=dot > voies/f4b/tests-final.txt` vert.
- Captures 390 et 1280 de chaque écran touché, ouvertes (Read de l'image) avant de conclure : skill `webapp-testing`, port-carnet, port 5185, 390 tactile et 1280, clair et sombre ; captures dans `voies/f4b/captures/` ; serveur arrêté ensuite (vérifier le port libre).
- Plafond : à 170 k de contexte, commit de ce qui est vert puis `REPRISE : <fichier>`.
