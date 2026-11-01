# Revue du plan l1-lecture, triée par le pilote (31.10)

Deux relecteurs neufs : `REVUE-conception.md` et `REVUE-pret.md` (preuves et détail y restent). « corrigée » : l'auteur corrige PLAN.md
selon la colonne « Correction attendue », précisée par la Raison quand le pilote tranche, avant toute ligne de code. « l2 » : la voie qui
suivra (rapprochement des lectures, client `geminiScanner.ts`, statut) ; ce qui lui revient va au § 6 du plan comme passage de relais
obligatoire, et dans RESULTAT.md comme limite.

## Conception

| n | Gravité | Constat (preuve) | Correction attendue | Sort | Raison |
|---|---|---|---|---|---|
| 1 | majeur | le rapprochement (`invoiceVisionReview.ts:72,137`) perd `type-deduit` et `alpha-libelle` à la seconde passe ; `vat`, `proForma`, `printedLineCount`, `linesLost` viennent de la seule lecture 1 ; le test à trois copies identiques ne le voit pas | garder dans le résultat ce qui ne se recalcule pas (`documentTypeLu`, `alphaPctLu`, repris par la seconde passe comme `linesLost`) ; relais l2 : voter ces champs et prendre `vat`/`linesLost` de la lecture des lignes retenues ; tests sur des lectures différentes | corrigée | `invoiceVisionReview.ts` reste hors de l1 ; les tests de l1 l'appellent en lecture seule |
| 2 | majeur | `lu` et `attendu` changent de sens selon le point : une somme calculée peut s'afficher « lu » | champs à sens fixe : `lu` (toujours imprimé), `calcule` (toujours le code), `ecart = lu − calcule`, `luTexte` pour une valeur texte ; rien d'utile dans `message` seul | corrigée | COMMUN.md : jamais un calcul présenté comme lu |
| 3 | majeur | le contrat ne suffit pas à l'écran : pas d'enjeu, de cellule, de clé, d'origine ; liste de codes fermée | ajouter, facultatifs : `origine`, `enjeu` (`argent`/`stock`/`info`), `bloque`, `champs`, `cle`, `candidats` ; codes en type exporté extensible ; `fieldWarnings` restent leur canal jusqu'à l2 | corrigée | — |
| 4 | majeur | un point devient périmé quand le brasseur corrige une valeur ; rien ne le recalcule (le client ne peut pas importer `functions/src`) | décision écrite au § 6 | corrigée | décision du pilote : (B) `points` est un instantané de la lecture. `cle` et `champs` permettent à l'écran de marquer « revu » un point dont une cellule a changé ; le recalcul côté client (ligne et somme) revient à l2 |
| 5 | majeur | faux positif C1 sur un prix par 100 g ou par 1 000 | rapport montant / (q × p) égal à une puissance de 10 : point `inverifiable` « prix probablement par 100 g », jamais `ecart` ; test 250 g × 8,00 = 20,00 | corrigée | — |
| 6 | majeur | la somme n'accepte que le TTC ; une facture en lignes HT lève `somme-ecart` à tort | `amountHT` lu et Σ lignes = HT au centime : `sum: 'ok'`, `controls.sum.base = 'HT'` ; test 100,00 + 8,10 = 108,10 | corrigée | — |
| 7 | majeur | TVA exigée au centime alors que les factures arrondissent par ligne ou par taux | tolérance de R1 = ⌈n/2⌉ + 1 centimes pour n lignes du code, testée sur une facture cohérente arrondie par ligne ; `details` par écart décroissant ; `arrondi-possible` sous la tolérance ; sur 372765, tester R2, R3, R4 | corrigée | — |
| 8 | majeur | base TTC/HT « qui échoue le moins » indéfinie ; jonction par code fragile (« N 8.1% ») ; R4 exige un code sur toutes les lignes | base choisie une fois par document : moins de relations en échec, puis plus petite somme d'écarts, puis TTC ; code normalisé (premier mot, majuscule, sans le taux) et dit au prompt ; R4 sort `shipping`/`discount` sans code du calcul, avec mention ; fixture `vat[].code = "N 8.1%"` | corrigée | même règle que Prêt n° 7 |
| 9 | majeur | deux suppressions d'avertissement « prouvées par le code » effacent un doute réel | ne rien supprimer dans le code | corrigée | décision du pilote : le prompt seul réduit le bruit (A3) ; sa preuve viendra du banc réel de D210, pas d'un filtre |
| 10 | majeur | pro-forma payée « devis » ramenée à `invoice` : valeur lue écrasée, perdue au rapprochement ; « Devis : vérifier » supprimé | garder `documentType` tel que lu ; ajouter `documentTypeRetenu` avec son point `type-deduit` ; garder « Devis : vérifier » en `inverifiable` quand `proForma` est faux | corrigée | relais l2 : `geminiScanner.ts` passe `documentTypeRetenu`, et `scannedPayment` le lit (`purchasePrefill.ts`, après s2) |
| 11 | majeur | un arrondi négatif en `kind: other` est refusé par `purchaseEntry.ts:101` | négatif ⇒ `discount`, positif ⇒ `other` ; le prompt le dit ; test `normalizeInvoiceScan` puis `validatePurchase` sur un arrondi −0,02 | corrigée | — |
| 12 | majeur | `printedLineCount`, compté par le modèle, peut annuler une somme exacte | sous 35 lignes, si Σ lignes = TTC, un compte supérieur n'est qu'un point `inverifiable` ; il ne bloque `sum: 'ok'` que si la somme ne tombe pas juste ; au prompt, « lignes d'articles seulement » ; tests des deux cas | corrigée | même correction que Prêt n° 11 |
| 13 | majeur | plafond de 4 500 jetons de sortie : une grande facture peut être rejetée en bloc (`ai.ts:112`) | test de taille : une lecture de 35 lignes aux champs maximaux, en jetons estimés à 3,2 caractères par jeton, avec marge ; retirer `vatRate` du schéma | corrigée | décision du pilote : si l'estimation dépasse 3 800, l'auteur relève `SCAN_MAX_OUTPUT` (`functions/src/ai.ts`, cette constante seulement, ajoutée au Possède) à la plus petite valeur qui laisse 20 % de marge, 8 000 au plus, et l'écrit dans RESULTAT.md |
| 14 | détail | `toCents` n'existe pas ; un montant 1,345 serait arrondi sans trace | définir `toCents` : entier exact, sinon `null` et ligne « non vérifiée » ; test 1,345 | corrigée | — |
| 15 | détail | facture sans lignes : Σ = 0 ≠ TTC donnerait `somme-ecart` | `items.length === 0` ⇒ `sum: 'non-verifiable'`, sans point ; test | corrigée | même correction que Prêt n° 2 |
| 16 | détail | valeurs lues rejetées sans trace (taux 8.1, `vat` coupé à 6, `vatCode` à 10, compte négatif) | un point `inverifiable` par rejet de forme ; `vatTronque` au-delà de 6 rangées | corrigée | — |
| 17 | détail | A9 lit le nom ou l'`evidence` (qui peut citer « 8.1% ») ; plage ]0, 100] trop large | comparer à tous les pourcentages du nom seul ; plage plausible ]0, 30], hors plage = `inverifiable` | corrigée | même correction que Prêt n° 8 |
| 18 | détail | `invoice-v5` posé avant que `purchaseEntry.ts:237` ne le porte : provenance fausse ; cache invalidé | ordre imposé | corrigée | décision du pilote : à l'intégration, le pilote passe `purchaseEntry.ts:237`, son test (`:16`) et `eval-expense-vision.mjs:142` à `invoice-v5`, dans le même commit que l1. Rien n'est déployé avant ; le cache invalidé ne coûte qu'aux lectures du banc D210 |
| 19 | détail | un écart de 1 à 5 centimes déclenche encore une troisième lecture payante | écrire au § 4 la fréquence attendue du cas | corrigée | relais l2 : relecture seulement si l'écart n'est pas un multiple de 5 centimes |

## Prêt à coder

| n | Gravité | Constat (preuve) | Correction attendue | Sort | Raison |
|---|---|---|---|---|---|
| 1 | bloquant | `tests/unit/invoiceVisionReview.test.ts:179-182` (G2) casse : sa fixture `item({ quantity: 5 })` vaut 25 pour un montant de 10, et la phrase C1 rend le statut `disputed` | le pilote tranche : phrase C1 hors de `issues`, ou fixture corrigée | corrigée | décision du pilote : (b) la fixture est corrigée (`item({ quantity: 2 })`, 2 × 5 = 10, somme 20 = TTC), car son incohérence est accidentelle (le test porte sur deux transcriptions identiques) ; la phrase C1 entre dans `issues`, pour que le client la voie avant l2. Le fichier entre au Possède, pour cette fixture seulement |
| 2 | majeur | « aucune ligne » non défini pour C2 ; `invoiceVisionReview.test.ts:199-201,221-225` et `invoiceScanCore.test.ts:12` lisent des tickets sans ligne | `items.length === 0` ⇒ `sum: 'non-verifiable'`, sans point ni issue ; au témoin : `items: []`, TTC 0,3 ⇒ `points = []` | corrigée | — |
| 3 | majeur | une clé à `undefined` fait échouer `ref.update` (`invoiceScanBudget.ts:109`) après une lecture déjà payée | aucune clé `undefined` (absente ou `null`) ; test : le résultat de chaque fixture survit à `JSON.parse(JSON.stringify(x))` à l'identique | corrigée | — |
| 4 | majeur | idempotence fausse pour `type-deduit` et `alpha-libelle` | garder la valeur lue (`documentTypeLu`, `alphaPctLu`) ; tests `reconcileInvoiceVision` sur trois lectures `quote` + `proForma` + `paid`, et α 250 | corrigée | même correction que Conception n° 1 |
| 5 | majeur | lecteurs de `issues` oubliés : regex de `purchasePrefill.ts:16-17,27-33`, puces d'`InvoiceScanReview.tsx:28-32`, coupe à 250 caractères (`geminiScanner.ts:22,25,52`) | les citer ; gabarits de phrases ≤ 250 caractères avec le champ visé ; test : les regex de `purchasePrefill.ts` appliquées aux phrases produites ; « 35 lignes » dans la phrase des lignes perdues | corrigée | — |
| 6 | majeur | la règle P1 ne refuse pas `invoiceScanCore.test.ts:31` (`/ObjStm` sans flux) ; comptage des pages ambigu (`:29`) | toute occurrence de `/ObjStm` non appariée à un flux décodé ⇒ refus ; `pages` = nombre d'occurrences de `/Type /Page` (hors `/Pages`), même règle au clair et dans les flux décodés | corrigée | compter les occurrences : un surcompte refuse, ce qui va dans le sens prudent |
| 7 | majeur | critère de la base TTC/HT non écrit ; sur 372765, seul le départage décide | base choisie une fois pour le bloc : moins de relations en échec, puis plus petite somme d'écarts, puis TTC ; un cas où le critère change le résultat | corrigée | même règle que Conception n° 8 |
| 8 | majeur | faux `alpha-libelle` quand l'extrait cite le taux de TVA ; « premier % » non dit | recouper avec le nom seul ; test : extrait « 8.1% », α 11,3 ⇒ 0 point | corrigée | même correction que Conception n° 17 |
| 9 | majeur | `vatCode`, `vatRate`, `alphaPct`, `vat`, `proForma`, `printedLineCount` non votés au rapprochement | relais au § 6 ; limite dans RESULTAT.md | corrigée | relais l2 (Conception n° 1) |
| 10 | détail | « Plus de 35 lignes » deux fois dans `result.issues` | le dire au § 2.5 ; test du nombre d'occurrences | corrigée | — |
| 11 | détail | `printedLineCount` non vérifié peut forcer `incomplet` | risque au § 4 ; consigne « lignes d'articles seulement » | corrigée | même correction que Conception n° 12 |
| 12 | détail | `ScanPointCode` non défini ; littéraux de `controls` élargis en `string` | `export type ScanPointCode = typeof SCAN_POINT_CODES[number]` ; interface exportée pour `controls` | corrigée | à rendre extensible pour l2 (Conception n° 3) |
| 13 | détail | assertions trop précises (`somme.test.ts`, `controls` sans `skippedIds`) ; lecture simulée tirée de la vérité | `arrayContaining` pour les cas à plusieurs points ; `controls` complet ; la limite dite dans RESULTAT.md | corrigée | — |
| 14 | détail | `scripts/check-prompts.mjs` (schéma Gemini hors ligne) non rejoué | l'ajouter à l'étape 3 du § 7 | corrigée | le pilote l'ajoute au CHECK de G2 |
| 15 | détail | références à corriger (`geminiScanner.ts:62` est `:51`) ; deux docs citent encore une version | corriger ; lister `docs/expense-prefill-v4.md:22` et `docs/gemini-budget.md:37` au § 6 | corrigée | les deux docs : au pilote, avec Conception n° 18 |
| 16 | détail | messages de refus PDF incohérents | un texte par cas (pages > 4, `/Count` > 4, indécodable, chiffré), écrit au plan | corrigée | — |

## Décisions du plan (§ 6)
1. Le client perd les nouveaux champs (`geminiScanner.ts:42-60`) : option A, la voie l2 possédera `geminiScanner.ts` et
   `ScannedInvoiceResult`.
2. `invoice-v4` hors voie : option A, avec l'ordre de Conception n° 18 (le pilote, même commit).
3. Pro-forma payée : la valeur lue reste, `documentTypeRetenu` s'y ajoute (Conception n° 10) ; la lecture par `scannedPayment` revient à l2.
4. Troisième lecture : relais l2, sur `points` (`ecart` sur `ligne-montant` et `somme-ecart`, jamais `tva-incoherente` ni
   `lignes-perdues`), et pas sur un écart multiple de 5 centimes (Conception n° 19).
5. Avertissement typé : écarté ici, acceptée.
