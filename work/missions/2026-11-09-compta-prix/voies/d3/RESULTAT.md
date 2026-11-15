OK — étape 2 : `mesurerAchat`, usure du litre comptée une fois, trois champs optionnels ; 62 tests verts, tsc sans erreur de la voie.

Fichiers écrits : `src/domain/finance/materielFutur.ts` (neuf), `src/domain/finance/upgrades.ts` (validation des trois champs), `src/domain/finance/types.ts` (`EquipmentUpgrade` : `depreciationCategory`, `usefulLifeYears`, `inServiceMonth` ; `FinancialAsset.usefulLifeYears`),
`tests/unit/materielFutur.test.ts` (neuf), `tests/unit/equipmentUpgrades.test.ts` (+ bloc), `voies/d3/*` (PLAN.md § 9 : une ligne par constat des deux revues). `investmentScenario.ts` non modifié.

Preuves : rouge `voies/d3/tests-rouge.txt` (2 fichiers en échec, 7 tests) ; vert `voies/d3/tests.txt` : `Test Files 2 passed (2) | Tests 62 passed (62)`.
Appelants rejoués (`tests-appelants.txt`) : `Test Files 12 passed (12) | Tests 160 passed (160)` (les 11 de la base HEAD + `materielFutur`). `npx tsc --noEmit` : 2 erreurs, toutes `firebase-admin/firestore` introuvable (poste sans `functions/node_modules`, antérieures, hors voie) ; aucune dans les fichiers de d3.
`node scripts/agents/controle-virgule.mjs` : `VIRGULE OK`.
Non rejoué ici : `tests/integration/financeAssistantContext.test.ts` (même cause) : à rejouer sur le poste principal, une fois pour d1 et d3 ; `simulateBreweryInvestment` n'a pas bougé.

Décision pilote appliquée : usure linéaire seule pour le litre ; `usureAnnuelleLitre` compte un matériel une fois (actif lié par `transactionId` remplace le projet ; facture sans actif : projet gardé + « Actif à créer ») ; test projet seul / facture seule / facture + actif.

À écrire dans d2 / uc (hors Possède) : (1) le litre appelle `usureAnnuelleLitre` (remplace `depreciationForYear` de `BrewBudgetDialog.tsx:21-25`) ; (2) l'écran de mesure passe `coutLitreCents` calculé avec `ignorerPlanId` ; (3) rejeu obligatoire de `tests/unit/materielFutur.test.ts` quand `forecast.ts` change (test sur le vrai `buildForecast`) ; (4) saisie durée / catégorie / mise en service dans `UpgradeSheet` ; (5) pour un assujetti, passer le prix HT (`baseUsureCents`) et le prix du format HT.
Limites : soldes de fin de mois ; usure du projet estimée sur le budget TTC ; TVA préalable non modélisée dans la trésorerie (avertie) ; prévision sans ventes attendues (B4) : `encaissementsPrevusCents` = 0 avertit.

CONNAISSANCE : aucune
LEÇON PROPOSÉE : un test de seuil se vérifie à la main sur sa fixture avant d'être écrit (D3-1, déjà proposée par la revue A).
