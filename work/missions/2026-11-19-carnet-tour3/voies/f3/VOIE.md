# Voie f3 — saisies de l'atelier et des prix (transmis par la session bugs-ecrans), mission 2026-11-19-carnet-tour3
Lire `../../COMMUN-CODE.md` (règles). Constats au registre du dépôt Brasserie `work/missions/BUGS.md` (`grep -n "| TE-35 \|| BE-26 \|| BR-27 "`).
- TE-35 UpgradeSheet : prix −5 devient 0, livraison « abc » devient vide, sans message → bornes et message au champ.
- BE-26 CreativePricing : prix TTC borné 0,05 à 1 000 CHF, au centime, message au champ.
- BR-27 BrewBudgetSheet : coût négatif → message au champ (pas de valeur avalée en silence).
Saisie : jamais type="number" (cerveau/produit/saisie-mobile.md) ; ton des messages comme les champs voisins déjà bornés de l'app (les retrouver par git grep).
Possède : src/ui/finance/UpgradeSheet.tsx, src/ui/finance/CreativePricing.tsx, src/ui/**/BrewBudgetSheet.tsx (chemins exacts par git ls-files), leurs tests. Ne touche pas ExpenseSheet.tsx ni UpgradeWorkspace.tsx (autres voies) ; TE-36, BE-23, BE-27 viendront plus tard par message.

## Preuves (obligatoires)
- RESULTAT.md tenu au fil : une ligne ajoutée dès qu'un id est fini (une limite de tours ne doit rien perdre).
- Tests : `npx vitest run <fichiers> --reporter=dot > voies/f3/tests-rouge.txt` (avant correctif) puis `> voies/f3/tests-vert.txt` (après) ; la ligne « Tests » de RESULTAT.md cite ces fichiers et leurs totaux.
- Captures 390 et 1280 de chaque écran touché (champ en erreur), ouvertes (Read de l'image) avant de conclure : skill `webapp-testing` (dossier Brasserie `.claude/skills/webapp-testing/SKILL.md`), app de port-carnet en `?dev-local` sur le port 5183, 390 tactile et 1280, thème clair et sombre ; captures dans `voies/f3/captures/` ; arrêter le serveur ensuite.
