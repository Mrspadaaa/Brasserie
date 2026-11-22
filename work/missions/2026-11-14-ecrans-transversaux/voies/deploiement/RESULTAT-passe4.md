OK — passe 4 : 22 rouges, 16 antérieurs au tag, 2 de charge (verts seuls), 4 nouveaux corrigés ; 116 captures, non jugées, non déployé

(Copie : C:/Users/mrspa/AppData/Local/Temp/deploy-transversaux, branche deploy/transversaux. Non déployé, non tagué. Passe 1 : RESULTAT-passe1.md.)

## Fait
1. Cherry-pick : seul fe6f39a0 (b1s-b2) était absent -> b781fc0b, sans conflit.
2. Merge `en-ligne/2026-11-16-finances` (seul tag plus récent, contient tous les autres) -> 00d30520, 4 conflits :
   - FinancesTab : notre période commune (`changerPeriode`, `depuisPlageFinances`) + `FinancialPayment` et `setRemplace(null)` du tag.
   - TransactionJournal : notre `donneesFriseDe` (même calcul que l'inline du tag) + la ligne `jours` du tag.
   - UpgradeWorkspace : version du tag (kh1r) ; le + mobile interne reste masqué quand `createRequest` existe.
   - BrewerActivity : première résolution = feuille d3p2 + gestes (4e91a1b6). Décision du pilote : fx2c intacte. Fait au commit cb9f2b05 : `BrewerActivity.tsx` = version du tag 16 ; `ConversationsBoite.tsx`, `companionFx2c.test.tsx`, `brewerNavigation.test.tsx` remis à l'état d'avant l'adaptation, et le test « dev-local » remis comme au tag (pastille « Compagnon hors connexion · mode local »). La feuille d3p2 reste dans le code (non branchée depuis BrewerActivity).
3. Décision du pilote : un seul + à Finances et à l'Atelier (cb9f2b05) :
   - Finances : les deux « + » ronds de la ligne « Estimer un brassin » / « Coût d'un autre brassin » (`synthese/Lignes.tsx`) sont retirés. Nouvelle action `estimer` (« Estimer un brassin · coût du litre ») : table `plusEcran.ts` (FICHE, LETTRES, MENUS.finances.autres en tête), `PlusSheet.tsx` (icône Calculator), `recherche/modele.ts` (VERBE), `App.tsx` (événement `finances-estimer`), `FinancesTab.tsx` (l'écouteur ouvre le choix du brassin).
   - Atelier : le bouton « + Besoin » (UpgradeWorkspace) ne s'affiche plus quand `createRequest` existe ; « Nouvelle idée » du + flottant ouvre déjà la création d'un besoin.
   - À ÉTENDRE si le pilote le veut : Contacts « Noter » et Événements « Poser » de l'Atelier (kckd) gardent leurs boutons.
4. Bug `/^d{4}$/` de TransactionJournal versé à `work/missions/BUGS.md` (dépôt principal), non corrigé.
5. `.env`, `seedData.ts` copiés ; dépendances inchangées. tsc : 0 erreur (après cb9f2b05). Build `VITE_HOP_V4=on` : vert (build-3.txt) ; `check-no-dev-auth` : propre ; `check-build-flags` : DRAPEAUX OK ; `check-firebase-config` : CONFIG FIREBASE OK ; `dev-local` dans dist : 0. (sorties : *-3.txt)
6. Tests unitaires (passe 2, avant les décisions) : 3 rouges / 11 616 ; `designTokens` et TE-23 = rouges du tag (rejoués dessus, mêmes lignes) ; `rechargementAssistant` = délai sous charge, vert seul. À rejouer après cb9f2b05 : `npx vitest run tests/unit --reporter=dot > voies/deploiement/tests-3.txt` (des tests de Plus, de la recherche et de la synthèse Finances peuvent compter « + » / lister les gestes : un rouge nouveau bloque).

## Passe 4 : tests complets et banc (copie HEAD 9c18e534, non déployée, non taguée)
- Unitaires (tests-3.txt, avant correction) : 4 rouges / 11 625. designTokens et TE-23 : mêmes lignes qu au tag (rejoués sur une copie du tag hors dépôt ; seul le numéro de ligne TransactionJournal bouge, 411 contre 419) = antérieurs. brewForecast « sous 20 ms » : délai sous charge, vert seul (44/44). plus-ecran « rien de perdu » : NOUVEAU, le + de Finances commence par estimer (décision cb9f2b05) ; test corrigé (commit 9c18e534), vert.
- Intégration (tests-integration-2.txt) : 18 rouges / 3 782 dans 9 fichiers. Les 9 fichiers rejoués sur le tag (tests-integration-tag.txt) : 14 rouges identiques (expenseSheet, fuzzSaisie, recipeAiWorkflow x2, recipeEditing x6, yeastCandidateWizardPersistence x2, yeastPitchingExecution x2) = antérieurs. 4 absents du tag : hopV55RecipeCopyPanel = délai sous charge, vert seul (8/8, 57 s) ; bDiversEntete (b1r) = nouveau : le test du port exigeait l absence de la pastille alors que BrewerActivity est celle du tag (décision fx2c) -> test remis comme au tag ; synthese T15 x2 = nouveaux : le « + » rond de la ligne litre est retiré (décision cb9f2b05) -> tests suivent le geste (3cd6819f). Les 3 fichiers rejoués : verts.
- Code inchangé depuis le build-3 (seuls des fichiers de test ont bougé) : build et 3 contrôles non refaits (sorties *-3.txt valables). Pas de nouveau tsc (tests seuls ; vitest a compilé les trois fichiers).
- Banc2 (banc2-run-3.log) : « erreurs : 8 » = 403 externes seulement (une paire par thème/largeur). Captures : 116 fichiers dans test-ecran-2/ (29 vues x 390/1280 x clair/cave), tous réécrits de 02:15 à 02:22. NON jugées (un critique le fera).
- Serveur de dev du port 3044 (vite, lancé par la voie) : arrêté. La copie du tag (tag16-copie, jonction node_modules retirée avant le worktree) : supprimée.
- Bilan : 22 rouges au total (4 unitaires + 18 intégration) : 16 antérieurs (2 + 14), 2 de charge verts seuls (brewForecast, hopV55), 4 nouveaux tous corrigés (plus-ecran, bDiversEntete, synthese x2) et verts.

CONNAISSANCE : un `\d` perdu dans une regex déployée (`/^d{4}$/`) ne casse rien et ne se voit pas ; relire à la regex un tag déployé. LEÇON PROPOSÉE : aucune.
