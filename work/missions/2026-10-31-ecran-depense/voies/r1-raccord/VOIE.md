# Voie r1-raccord — ce que s1 et s2 ont réparé arrive jusqu'à l'écran, et la ligne reliée s'enregistre

- Mission : 2026-10-31-ecran-depense
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement (écriture d'une dépense et du stock : argent, quantités, Drive)
- Plafond : 110 tours (dont 40 pour le plan) ; 3 essais par critère
- Dépend de : s1 (+ s1b, s1c) et s2 (+ s2b), commités (a3cdf0df, 2c54ac66)
- Décideur en cas de doute : pilote ; l'option prudente et réversible

## Objectif
Aujourd'hui, les corrections de s1 et s2 vivent dans les services mais l'écran ne les appelle pas, et une ligne bien reliée par s1 peut
encore bloquer « Confirmer ». Après r1 : le prix unitaire lu est gardé, une description ou une date de paiement tapée n'est jamais
écrasée par un scan, le reçu Drive (dossier, nom, empreinte vérifiée, lien) revient à l'écran, un envoi long se dit « en cours » et non
en erreur ; et une ligne que s1 relie à son article s'enregistre sans que le brasseur retape l'unité, quantité juste, jamais convertie
en silence ni devinée.

## Exigences communes
Lire et suivre `work/missions/2026-10-31-ecran-depense/voies/COMMUN.md` (deux temps : PLAN.md puis arrêt, `PLAN PRÊT — <n> défauts` ; le
pilote fait relire le plan par deux regards neufs, te renvoie la revue triée, puis tu codes). Le business est juste à 100 % : une
proposition perdue est permise, une fausse écriture ne l'est pas ; dans le doute, rien.

## Défauts visés
- **R1 — A11 à l'écran** : `ExpenseSheet.tsx:150` ne passe pas le prix unitaire lu : `unitPrice` de chaque ligne scannée va sur la ligne
  (champ déjà au type, gardé par `savePurchase`) ; rien d'inventé pour une ligne sans prix lu.
- **R2 — A12 à l'écran** : `ExpenseSheet.tsx:147` et `:160` posent `description` directement : passer par `applyScannedDescription(draft,
  result)` (`purchasePrefill.ts:46`) ; une saisie dans « Pour quoi ? » marque la source `typed` ; un second scan ne l'écrase jamais.
- **R3 — A7 à l'écran** : `:160` étale `scannedPayment(result, today)` : passer par `applyScannedPayment(previous, result, today)`
  (`purchasePrefill.ts:130`) ; une date de paiement tapée n'est jamais écrasée ; une saisie de la date marque sa base `typed`.
- **R4 — DR1 et DR4 à l'écran** : `:171` appelle `savePurchaseWithProof` : passer par `savePurchaseWithProofReceipt` (`purchaseEntry.ts:246`)
  et garder le reçu dans l'état de l'écran ; la ligne « Justificatif … » qui existe déjà (`:215`) dit le dossier et le nom rendus par
  Drive et « empreinte vérifiée » quand c'est vrai, avec le lien `webViewLink` ; rien n'est dit qui ne vient pas du reçu (s2b : Drive
  muet → pas de nom). Le message `drive/in-progress` (> 15 s) s'affiche comme un état (« Envoi du justificatif en cours… »), pas comme
  une erreur, et un second clic ne relance pas l'envoi confirmé.
- **R5 — Stk ↔ sachet à l'enregistrement** : `validatePurchase` (`purchaseEntry.ts:209`) refuse « Stk ne se convertit pas en sachet »
  alors que s1 propose cette ligne (Windsor, BE-256, US-05, Verdant de la facture 372765). Accepter l'équivalence décidée
  (`pieceUnitsEquivalent`, `ingredientIdentity.ts:345`) : quantité 1 pour 1, jamais convertie en grammes ; le mouvement de stock s'écrit
  dans l'unité de l'article (« sachet ») ; l'unité imprimée « Stk » reste celle de la ligne de la dépense (D213 : jamais réécrite en
  silence). Au-delà de `SACHET_MAX_G` (une levure en vrac au poids), rien ne change : refus comme aujourd'hui.
- **R6 — « Kilo », « Kilogramm », « Liter », « litre(s) », « Kg. » à l'enregistrement** : reliés par s1 (`linkUnit`,
  `stockLineMatching.ts:67`) mais refusés par `Units.areCompatible` ; `validatePurchase` et l'écriture du mouvement (`purchaseEntry.ts`,
  `:350`, `Units.convert(…)!`) lisent la même table que l'appariement, sans élargir `Units` global (recommandation de s1) : exporter
  `linkUnit` (ou une table commune) est permis, ne rien changer d'autre dans `stockLineMatching.ts`. Une unité lisible d'une autre famille
  (Stk face à g, litre face à g, kg face à sachet) reste refusée ; kg et g se convertissent, la quantité convertie se voit (D213, « 25 kg → 25 000 g ») ; la quantité convertie est exacte (6 Kilo → 6 000 g si l'article est en g).
- **R7 — la garde D214** : une ligne reliée dont l'unité est illisible ou vide n'entre jamais en stock : `validatePurchase` refuse avec le
  mot « unité à préciser » (et le nom de la ligne) ; le test le prouve sur une ligne proposée par `matchStockLine` avec unité `''`, `-`, `n/a`.

## Décisions du pilote sur le plan (31.10, nuit)
- Le reçu à la fermeture de la feuille : rien de neuf ici (voie écran) ; reçu gardé en état, dit dans les deux phrases existantes, passé à `onSaved`.
- R6 : « incompatible » veut dire « d'une autre famille » ; la contradiction venait de la consigne, corrigée ci-dessus.
- La garde « unité à préciser » couvre aussi un nouvel article ; le prix unitaire lu est retiré quand l'unité de la ligne est retapée : retenus (prudents).

## Hors périmètre
Le dessin de la mouture et son geste (S5 : `proposeMillingSurcharges` / `confirmMillingSurcharge` existent ; leur bouton se conçoit dans
la voie écran), le signal S8 (`purchaseSimilarOrders`) et l'affichage de la base de la date (A7) : tout nouvel élément que le brasseur
verrait va à la voie écran (L25). Ici, seuls changent des textes déjà présents (la ligne « Justificatif … », le message d'envoi).
L'appariement lui-même (s1), la fiche d'un produit (S6), la lecture (l2), Gemini réel, tout Drive réel, `functions/`.

## Entrées (lire seulement ça)
- `work/missions/2026-10-31-ecran-depense/voies/s2-enregistrement/RESULTAT.md` (§ « Hors périmètre et raccordements », s2b) ;
  `work/missions/2026-10-31-ecran-depense/voies/s1-stock/RESULTAT.md` (les lignes « DÉCISION À PRENDRE (voie r1) » et Stk ↔ sachet).
- `src/ui/finance/ExpenseSheet.tsx`, `src/services/purchaseEntry.ts`, `src/services/purchasePrefill.ts`,
  `src/services/stockLineMatching.ts:60-130`, `src/services/ingredientIdentity.ts:330-360`, leurs tests.

## Possède (seuls chemins où écrire, un par ligne)
- `src/ui/finance/ExpenseSheet.tsx`
- `src/services/purchaseEntry.ts`
- `src/services/stockLineMatching.ts` (l'`export` de `linkUnit` ou d'une table d'unités, et de `SACHET_MAX_G`, seulement)
- `tests/unit/purchaseEntry.test.ts`
- `tests/integration/expenseSheet.test.tsx`
- `tests/unit/depense/raccord/`
- `work/missions/2026-10-31-ecran-depense/voies/r1-raccord/`

## Méthode
Tests d'abord, rouges sur le code d'aujourd'hui (sortie complète dans `voies/r1-raccord/r1-rouge.txt`, ligne « TEMOIN AVANT » dans
RESULTAT.md avec ses `Test Files … failed`), puis le code. Gemini toujours simulé, Drive factice. Le parcours dans Chrome : si `?dev-local`
permet d'ouvrir « Nouvelle dépense » et d'y joindre une facture simulée, un script `puppeteer-core` dans ta voie, captures ouvertes ; sinon
dis pourquoi (la fixture n'a pas de stock) : le pilote le jouera sur l'app en ligne après le déploiement (D210).

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` : ligne 1 `OK — R1 à R7` ou `ECHEC — …` ; TEMOIN AVANT ; par défaut, le test et sa ligne ; la facture 372765 (« Stk »,
« Kilo ») avant et après ; `webViewLink` ; « Rien ne se perd » (ce qui reste vrai d'avant : description tapée, date tapée, unité imprimée) ;
`LEÇON PROPOSÉE : …` ou `aucune`. Une ligne au pilote.
