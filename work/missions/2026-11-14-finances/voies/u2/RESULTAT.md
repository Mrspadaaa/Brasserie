OK — code et tests des 6 constats (21, 22, 24, 25, 26, 27) tenus ; captures 390/1280 clair et cave à rejouer (DEMANDE EXECUTANT)

## Fichiers écrits
- `src/ui/finance/prevision/supprimerPlan.ts` (neuf) : supprime un plan (`FirestoreRepo.remove('financialPlans')`) ; refuse net si une pièce active y est liée (`finance.planId`) ; une idée de matériel héritée (« UPGRADE-… » sans document) se supprime à sa source. `financeService.ts` n'est pas dans « Possède » : le geste vit ici, il passe par les services existants, règles Firestore lues seulement (financialPlans supprimable, transactions non).
- `src/ui/finance/prevision/base.tsx` : brique `Confirmation` (question, détail, « Garder » / « Oui, … », refus affiché) ; `FormSheet` accepte `suppression` (bouton « Supprimer » du pied, discret, contour d'alerte). `prevision.css` : `.fin-conf`, `.fin-suppr`.
- `src/ui/finance/prevision/PlanSheetC.tsx` (21) : « Supprimer cette prévision » dans « Modifier la prévision » (absent pour une nouvelle), confirmation ; l'état « Annulée » reste.
- `src/ui/finance/UpgradeSheet.tsx` (27) : « Archiver » demande confirmation (reprise = « Reprendre ce projet », déjà là) ; « Supprimer ce projet » avec confirmation, refus visible si achats liés.
- `src/ui/finance/UpgradeWorkspace.tsx` (27) : même confirmation d'Archiver dans la fiche du projet, « Supprimer », et un bandeau « « X » est archivé. Annuler » après archivage (défait d'un geste).
- `src/ui/finance/previsions/Previsions.tsx` (22) : « Rien de prévu » seulement si aucune prévision (plan, récurrence, brassin, projet) n'est dans l'horizon ; les factures et la tendance du jour n'en sont pas. (26) cartes « Avec / Sans » : nom du projet tel quel.
- `src/ui/finance/previsions/escalier.ts`, `EscalierSvg.tsx` (26) : `nomProjet` (nom tel quel, raccourci par la fin avec « … ») et `motEtiquette` pour l'étiquette et le lot d'un projet ; les autres sorties gardent leur mot-clé en minuscules (p5b).
- `src/ui/finance/budget/libelles.ts` (neuf) + `BrewBudgetSheet.tsx` (24) : « Prix de 4 ingrédients », « Prix de 1 ingrédient ».
- `src/ui/finance/profil/ProfilEffets.tsx`, `profil.css` (25) : `etiquettesAxe`, une étiquette par mois posée à sa date, jamais deux fois le même mois, au plus six.
- Tests neufs : `tests/integration/u2Pures.test.ts`, `u2FeuillePrevision.test.tsx`, `u2FeuilleProjet.test.tsx`.
- Tests changés parce qu'ils décrivaient ce que ces choix remplacent : `soldeDepartCause` (« marche aujourd'hui : Rien de prévu reste » devient « disparaît » ; un cas « annulée : reste » ajouté), `projetPiste` et `equipmentProjects` (Archiver passe par « Oui, archiver »), `previsionsCorrectifs`, `previsionsEcran`, `projetsPrevisions`, `equipmentProjects` (« Avec Frigo », « Sans Hotte de brassage », « Frigo −3 000, 15.11 » : la casse du nom n'est plus changée).

## Rouge avant correction (HEAD)
`voies/u2/rouge/avant.txt` : 10 tests en échec + `u2Pures` incapable de se charger (modules absents) : suppression prévision (4), suppression et archivage projet (5), « Rien de prévu » (1) ; 24, 25, 26 dans `u2Pures`. Vert après : `rouge/apres1.txt` (un écart de comptage de mon test sur `nomProjet`, corrigé : 13 signes + « … »).

## Critères
- G1 `vitest-lu.mjs voies/u2/tests.txt` : VITEST OK (15 fichiers, 201 tests).
- G2 `lire.mjs build.txt "built in" BUILD` : BUILD OK avec `npx vite build --outDir <tmp>`. `npm run build` entier échoue au `tsc` sur `functions/src/*.ts` : « Cannot find module 'firebase-admin/firestore' » (dépendances de `functions/` absentes de ce worktree), sans lien avec la voie.
- G3 `outils/tsc.mjs` : TSC OK.
- G4 `controle-v6a.mjs 3000` : V6A OK.
- G5 `emulateur.txt` : EMULATEUR OK (12 contrôles). Ils ne couvrent pas la suppression d'un plan : `q5/emulateur.mjs` n'est pas à moi (modifié par une autre voie).
- Essais : 1 par critère sauf les tests (4 passes : casse des anciens tests, accolade manquante, comptage du test).

## DEMANDE EXECUTANT (captures, 24 = 6 points x 390/1280 x clair/cave)
Banc : `http://localhost:3000/?dev-local&finance-demo` (ne pas relancer). Vérifier d'abord qu'il sert ce code : ouvrir Prévisions > une prévision > « Modifier la prévision » doit montrer « Supprimer » au pied ; sinon rendre `BANC ANCIEN`.
Dossier : `work/missions/2026-11-14-finances/voies/u2/cap/` ; nommer `<point>-<390|1280>-<clair|cave>.png`, ouvrir chaque image.
1. `21` : Prévisions > ouvrir une prévision > pied avec « Supprimer » ; puis la confirmation (« Garder » / « Oui, supprimer »).
2. `27a` : Mes projets de matériel > ouvrir un projet > pied (Archiver, Supprimer, Enregistrer) ; puis la confirmation d'Archiver ; puis la confirmation de Supprimer. 390 : vérifier que les trois boutons du pied tiennent sans se chevaucher.
3. `27b` : dans la fiche du projet de l'Atelier (feuille « Mes projets »), Archiver > confirmation > bandeau « est archivé. Annuler ».
4. `22` : Prévoir une dépense (7,00, date du jour, Enregistrer) puis Prévisions : plus de « Rien de prévu ».
5. `24` : Budget d'un brassin avec prix manquants : « Prix de 4 ingrédients : … ».
6. `25` : Solde et paramètres : solde de départ 100,00 au 1 août 2026 : frise, mois uniques (août, sept., oct., nov.).
7. `26` : projet « ZZ TEST - Projet materiel » inclus dans les prévisions : bulle « ZZ TEST - Pro… −110, 01.12 » et cartes « Avec ZZ TEST - Projet… », casse conservée.
Ensuite rejouer : `node work/missions/2026-11-14-finances/voies/o1/controle-v6a.mjs 3000` (V6A OK) et `node work/missions/2026-11-14-finances/voies/f1/controle-frise.mjs 3000` (FRISE OK). Rendre la liste des images ouvertes et ce qui déborde ou se chevauche ; je juge ensuite.

## Doutes et limites
- Captures non faites par moi (série mécanique) : validation visuelle non effectuée à ce stade. Points à regarder : 390, trois boutons du pied du projet ; étiquettes de mois à 390 (bord droit « nov. ») ; bulle du projet plus longue qu'avant (nom entier, 14 signes).
- Suppression d'une prévision récurrente : toute la série disparaît (le dit la confirmation). Une prévision ou un projet avec une pièce liée ne se supprime pas (message ; Annulée ou Archiver).
- « Rien de prévu » : une prévision datée d'avant aujourd'hui ou annulée ne compte pas (le domaine ne la met pas dans l'horizon).
- Trois fichiers de test (`f2ReelPrevisions`, `previsionsCorrectifs`, `previsionsEcran`) ont échoué un temps à cause de `ExpenseSheet.tsx` en cours d'édition par u1 (JSX non fermé) ; verts au rejeu.
- `git status` : en plus de mes fichiers, modifiés par d'autres voies : `ExpenseSheet.tsx`, `TransactionDetails.tsx`, `correctionMontant.ts`, `q5/emulateur.mjs`, `modifier/retirerEcriture.ts` et leurs tests ; non touchés.

DÉCISION À PRENDRE : faut-il aussi un contrôle d'émulateur « un plan se supprime, une pièce ou un paiement non » dans `q5/emulateur.mjs` ? Recommandation : oui, une voie qui possède ce fichier ; les règles disent `financialPlans` supprimable, mais rien ne le joue.

CONNAISSANCE : `FirestoreRepo.remove` retire un document `financialPlans` ; un projet venu d'une idée R&D (« UPGRADE-<id> ») n'a pas de document et se supprime à l'idée source (`deleteCreativeItem`).
LEÇON PROPOSÉE : aucune
