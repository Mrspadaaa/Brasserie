OK — 5 fichiers du lanceur flottant réalignés sur les libellés courts du tag ; 0 échec neuf vs tag, tsc et build verts.

## Cause
Ce n'est pas notre port c2a/e11a. `git diff en-ligne/2026-11-16-finances-graves HEAD` ne touche ni FloatingActions.tsx, ni fabActions.ts, ni App.tsx, ni PlusSheet.tsx, ni les 5 tests (17 fichiers seulement, aucun du lanceur). Le tag `finances-graves` (8e68161d) est un ancêtre de HEAD.
Le tag contient le commit 8d1e3c5e « Le + : un seul libellé par action commune, aux deux largeurs » : les tuiles de « Partout » s'appellent `Écriture`, `Facture`, `Vente`, `Recette`, `Brassin` (aria-label « Facture, photo ou PDF » pour la facture). Ce commit a mis à jour `plus-ecran-pile` et créé `plus-libelle-unique`, mais pas ces 5 tests d'intégration, qui cherchaient encore « Entrer une facture / Encaisser une vente / Créer une recette / Lancer un brassin ».
Le commit 8d1e3c5e n'est pas dans le tag `finances-mineurs`, base de `vt-tagfm.json` : à cette base les 5 fichiers passaient. Au tag `finances-graves` lui-même, ils échouent de la même façon (sources et tests identiques à HEAD) : « passent au tag » ne vaut que pour finances-mineurs.

## Fichiers écrits (tests seuls, aucune source)
- tests/integration/AppQuickActionReturn.behavior.test.tsx (1 ligne)
- tests/integration/brewerNavigation.test.tsx (1 ligne)
- tests/integration/dashboardNavigation.test.tsx (2 lignes : requête + commentaire)
- tests/integration/FloatingActions.behavior.test.tsx (4 lignes)
- tests/integration/floatingActionsShellLayout.test.tsx (4 lignes)
Changement : `/Entrer une facture/` → `/^Facture/`, `/Encaisser une vente/` → `/^Vente/`, `/Créer une recette/` → `/^Recette/`, `/Lancer un brassin/` → `/^Brassin/` (ancrés au début pour ne pas attraper « Nouvelle recette » ou « Nouveau brassin » de l'écran). Aucune assertion autre ne change : chaque geste appelle toujours son callback une fois, le menu se ferme, le clavier ouvert garde le lanceur.

## Conflit avec nos ports
Aucun. Le « + » de Brassins (« Nouveau brassin » → c2a, « + Recette » dans Recettes) vient de fabActions.ts et n'est pas modifié ; le lanceur global suit le tag. Aucun test du tag n'a été adapté contre un de nos ports choisis par le brasseur.

## Preuves
- 5 fichiers : 5 passés, 38 tests verts.
- `npx vitest run port- fix- --reporter=dot` : 33 fichiers, 298 tests verts.
- `npx tsc --noEmit` : aucune sortie, 0 erreur.
- Vitest complet `vt-l.json` : 62 fichiers en échec, 16 tests en échec ; `node vstag.cjs vt-l.json` → `FAILS 62 NEW vs tag 0` (base vt-tagfm.json). Aucun fichier exclu : tous les échecs sont déjà en échec à la base.
- `npm run build` : ✓ built in 31,9 s, DRAPEAUX OK.
Essais : 1.

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : un tag peut contenir un commit de libellés dont les tests d'intégration n'ont pas été réalignés ; comparer à la base du bon tag (mineurs ou graves) avant de chercher dans nos ports.
LEÇON PROPOSÉE : aucune.
