# Voie f2 — Carnets (idées d'achat, Comparer, rangement), mission 2026-11-19-carnet-tour3
Lire `../../COMMUN-CODE.md` (règles) puis corriger chaque ligne de `LIGNES.md` (17 PCN).
Possède : src/ui/carnets/*, src/domain/carnets/*, src/ui/finance/UpgradeWorkspace.tsx, leurs CSS et tests.
Sa maquette retenue (port du carnet, g05/g5, R-numéros de MISSION.md du 2026-11-17-port-carnet) prime sur le tri.
PCN-167 (messages qui survivent au carnet supprimé) : la suppression d'un carnet par le brasseur emporte ses messages par le même
mécanisme que le carnet (s'il y a annulation ou corbeille, ils la suivent) ; aucune donnée existante n'est touchée par la voie.
PCN-115 et PCN-111/124 : trancher par sa maquette ; si elle ne montre rien, `ouvert` + référence.
Texte à l'écran : ses mots (`work/refonte-frontend/v4/SPEC-BRASSEUR.md`), pas de phrase longue ; aucun plafond de mots
tenu en retirant du contenu (L27).

## Preuves (obligatoires)
- RESULTAT.md tenu au fil : une ligne ajoutée dès qu'un id est fini (une limite de tours ne doit rien perdre).
- Tests : `npx vitest run <fichiers> --reporter=dot > voies/<voie>/tests-rouge.txt` (avant correctif) puis `> voies/<voie>/tests-vert.txt` (après) ; la ligne « Tests » de RESULTAT.md cite ces fichiers et leurs totaux.
- Captures 390 et 1280 de chaque écran touché, ouvertes (Read de l'image) avant de conclure : skill `webapp-testing` (dossier Brasserie `.claude/skills/webapp-testing/SKILL.md`), app de port-carnet en `?dev-local`, 390 tactile et 1280, thème clair et sombre ; captures dans `voies/<voie>/captures/` ; arrêter le serveur ensuite.
