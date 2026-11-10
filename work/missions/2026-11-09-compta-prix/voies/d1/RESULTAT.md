OK — étape 2 : chaîne litre → format, trois notions, impôt calculé, °Plato unique ; 73+ tests verts

## Fichiers écrits (Possède)
`src/domain/finance/chaineLitre.ts` (neuf), `src/domain/finance/brewBudget.ts`, `src/domain/finance/swissBeerTax.ts`, `src/domain/alcohol.ts`,
`tests/unit/chaineLitre.test.ts` (neuf), `tests/unit/brewBudget.test.ts`, `tests/unit/swissBeerTax.test.ts` (blocs ajoutés, aucun test existant modifié),
`voies/d1/` : `PLAN.md` (§ 8 : source du barème et sort de chaque constat des revues), `tests-rouge.txt`, `tests.txt`, `tests-appelants.txt`, `tsc.txt`, `tests-head.txt`.

## Sorties décisives
- Rouge avant le code (`tests-rouge.txt`) : `chaineLitre` introuvable, `swissBeerTax` et `brewBudget` en échec.
- Vert (`tests.txt`, fichiers de la voie + `financeArchiveContinuity`) : `Test Files 4 passed (4)` · `Tests 82 passed (82)`.
- Appelants rejoués (`tests-appelants.txt`, 31 fichiers : les 24 de HEAD + 7 de levure qui lisent `alcoholByVolume`) : `Test Files 1 failed | 30 passed (31)` · `Tests 535 passed (535)`.
  Le seul échec est `financeAssistantContext.test.ts` : `firebase-admin/firestore` introuvable, déjà rouge sur HEAD. **Test non chargé ici, à rejouer sur le poste principal** (une fois, pour d1 et d3).
- `npx tsc --noEmit` : 2 erreurs, toutes deux `firebase-admin/firestore` introuvable (`functions/src/brewerCatalogueStore.ts`, `brewerScenarioStore.ts`) : environnement ; aucune dans le code de la voie.
- `node scripts/agents/controle-virgule.mjs` : `VIRGULE OK`.
- Source du barème LIB : lu dans le PDF OFDF d'avril 2022 (`BEER_TAX_SOURCE`) : 16,88 / 25,32 / 33,76 CHF/hl, bornes 10 et 14,0 °P, réduction jusqu'à 40 %, impôt dû à la sortie de la brasserie. Non vérifiés : le numéro d'article de la LIB et l'OIBi (Fedlex illisible), le seuil 0,5 % vol.

## Ce qui est livré
- `alcohol.ts` : `platoFromSg`, la formule unique (la copie de `swissBeerTax.ts` est supprimée ; celle de `brewingMath.ts` reste, hors Possède, gardée par un test de parité).
- `swissBeerTax.ts` : `BAREME_IMPOT_BIERE`, `TAUX_NORMAL_PAR_HL`, `beerTaxForVolume` (réduction, exonération 0,5 %, fourchette sans °P, montant plein), `beerTaxPerFormat` (0,0836 / 0,1899 / 5,064 exacts), option `litresSortis` ; plus aucun littéral 16,88 / 25,32 / 33,76 hors du barème.
- `brewBudget.ts` : `stockCost` / `purchaseCost` par ligne ; `dejaPaye`, `aPayer`, `annee` (somme exacte au centime), `resteEnStock`, `packagingCost`, `beerTaxCost`, `beerTaxSource`, `beerTaxExonere`, `netVolumeSource` ; entrées `og`, `abv`, `beerTaxReductionPct`. Impôt calculé dès que l'OG est connue (le montant manuel est alors ignoré), le chemin manuel reste sans OG. Tous les champs sont facultatifs : aucun instantané existant n'est touché.
- `chaineLitre.ts` : `litresNets`, `troisNotions`, `coutLitre` (complet 7,51 et liquide exact, affiché arrondi à part), `coutFormat` (2,48 pour un 33 cl), `usureLineaireAnnee` (frigo 3 000 CHF : 450 CHF/an linéaire, pas les 900 du dégressif).
- Fixture de la voie reconstruite à la main, dates fixes : 22,41 + 64,26 + 116,10 = 202,77 ; 7,51 CHF/L ; caisse 64,26.

## Doutes et limites
- Constat A D1-4 retenu autrement : pas d'`issue` pour les litres nets pris sur le volume à brasser, parce que `tests/unit/financeArchiveContinuity.test.ts:154` (hors Possède) attend `complete: true` sans `netVolumeL`. L'instantané porte `netVolumeSource` et `troisNotions` le déclare incomplet (coût du litre null). L'issue complète se fera chez `uc`, avec ce test.
- `brewingMath.ts` non touché (consigne : rester dans le Possède) : la 3e copie du °Plato subsiste.
- L'usure du registre : `BrewBudgetDialog.tsx:21-25` (uc) lit encore l'AFC (`depreciationForYear`, dégressif possible) ; `usureLineaireAnnee` est prête, non branchée.
- Appelants à compléter par d2 et uc : passer `og`, `abv`, `beerTaxReductionPct` à `estimateBrewBudget` (assistant, feuille) ; `financeDemo.ts` reste sur le chemin manuel.
- Rien n'est vu dans Chrome : voie de calcul sans écran.
- `git status` : mes fichiers seulement ; les autres modifications (`types.ts`, `upgrades.ts`, `swissQrBill.ts`, etc.) sont celles de d3 et f1.

DÉCISION À PRENDRE : (1) ajouter `src/services/brewingMath.ts` au Possède de d1 pour retirer la 3e copie du °Plato (une ligne : `sgToPlato` appelle `platoFromSg`) ; recommandé : oui. (2) Pour D1-4, `uc` ajoute l'issue « litres nets estimés » et complète `financeArchiveContinuity.test.ts` (`netVolumeL`) ; recommandé : oui.

CONNAISSANCE : barème de l'impôt sur la bière confirmé par la directive OFDF d'avril 2022 : 16,88 / 25,32 / 33,76 CHF/hl, impôt dû à la sortie de la brasserie ; période : trimestre ou année, déclaration sous 20 jours, paiement sous 30 jours après la fin de la période. `volumePackagedL` est écrit par `BatchPackagingForm.tsx:31` (saisi), pas dérivé.

LEÇON PROPOSÉE : aucune
