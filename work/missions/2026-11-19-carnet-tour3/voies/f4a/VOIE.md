# Voie f4a — carnets, constats de la vision locale (mission 2026-11-19-carnet-tour3)
Lire `../../COMMUN-CODE.md` (règles), puis `../f4/CONSTATS.md` et, pour chaque id de ta liste, sa ligne complète et ses captures
dans `../v1/RESULTAT.md` ou `../v2/RESULTAT.md` (ouvrir la capture citée avant de corriger). Corriger chaque constat ; un constat
qui demande un choix de goût du brasseur (PCN-27) ou qui contredit sa maquette retenue → `ouvert`/`ecarte` avec la référence.
Banc de captures prêt : `../f2/captures.mjs` (banc `?preview=carnets`) ; parcours réel en `?dev-local`.
Liste : v2-neuf 1 (carnet et 1er lien perdus après « Base initialisée avec 11 enregistrements » en ?dev-local : PRIORITÉ 1 ;
dire si cela peut arriver en production — Dexie/Firestore — ou seulement au banc local, et corriger dans les deux cas),
PCN-19, PCN-22, PCN-126, PCN-37, v1-neuf 1 (« 2 cylindres » perdu du critère), v1-neuf 2 = v2-neuf 2 (verbe de la puce recopié
dans le critère), v2-neuf 3 (cadre « va dans Nouveau carnet » contredit par l'après), v2-neuf 4 (titres de carnet incohérents),
v2-neuf 6 (critère « puis le débit » perdu après dépôt), v1-neuf 4 (carnet refermé ~5 s après création, 1 sur 9).
Possède : src/domain/carnets/*, src/ui/carnets/CarnetsVue.tsx, src/ui/carnets/EtatIA.tsx, src/ui/carnets/CadreArrivee.tsx, src/db/** (si v2-neuf 1 l'exige), leurs tests.
Un fichier d'une autre voie est nécessaire → section « DEMANDE f4b » dans RESULTAT.md, sans l'écrire.

## Preuves (obligatoires)
- RESULTAT.md tenu au fil : une ligne ajoutée dès qu'un id est fini (une limite de tours ne doit rien perdre).
- Tests : `npx vitest run <fichiers> --reporter=dot > voies/f4a/tests-rouge.txt` (avant correctif) puis `> voies/f4a/tests-vert.txt` (après) ; à la fin `npx vitest run tests/unit/carnets* tests/integration/carnets* --reporter=dot > voies/f4a/tests-final.txt` vert.
- Captures 390 et 1280 de chaque écran touché, ouvertes (Read de l'image) avant de conclure : skill `webapp-testing`, port-carnet, port 5184, 390 tactile et 1280, clair et sombre ; captures dans `voies/f4a/captures/` ; serveur arrêté ensuite (vérifier le port libre).
- Plafond : à 170 k de contexte, commit de ce qui est vert puis `REPRISE : <fichier>`.
