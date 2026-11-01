OK — diagnostic de la lecture et du stock (30 défauts classés), vérité de la facture 372765, lecture simulée

## Fichiers écrits (tous sous `work/missions/2026-10-31-ecran-depense/diagnostic/d1/`)
- `DIAGNOSTIC.md` : tableau des défauts (A1-A12 champs, C1-C4 cohérence, S1-S9 stock, P1-P3 fichier, U1-U2 incertitude) puis réponses 1 à 5.
- `verite-facture-372765.json` : 23 lignes, total 86,50, TVA imprimée avec son incohérence, page 2 `null` avec note. Sans nom ni adresse du client.
- `lecture-simulee-372765.json` : sortie brute de l'IA au schéma `prompts.ts:204-244` (23 lignes, 4 avertissements de la lecture A).
- `lecture-simulee-372765.reconciliee.json` : le résultat après trois lectures et vote (`reconcileInvoiceVision`), au format `ScanOutcome.result` : 7 avertissements, statut `disputed`, comme sa capture.
- `mesures.ts` + `mesures-sortie.txt`, `sonde-doublon.ts` + `sonde-doublon-sortie.txt` : les preuves rejouables (`npx vite-node <fichier>`).
- RESULTAT.md (ce fichier). Rien écrit dans `src/` ni `functions/`.

## Critères
- G1 `systeme.mjs note … --contient` : `NOTE OK`
- G2 : `VERITE OK` (23 lignes, 86,50)
- G3 : `SIMULEE OK`
- Essais : 1 par critère. Tests voisins rejoués : 5 fichiers, 154 tests verts (invoiceScanCore, invoiceVisionReview, purchasePrefill, stockLineMatching, financeInvoice).

## Ce que le diagnostic établit (preuve dans DIAGNOSTIC.md)
- Maris Otter reste sans mouvement parce que l'appariement est coupé : `STOCK_LINE_PROPOSALS_ENABLED=false` (décision 117 du 17.10, B-V3-4 et B-V3-5 ouverts). Garde levée, 9 lignes de stock sur 18 s'apparient avec un stock simulé. Les 9 autres échouent pour trois causes prouvées : le « 2 » de « Typ 2 Kg » effacé comme conditionnement (S2), l'α dans le nom (S3), « Stk » ≠ « sachet » et le poids du sachet dans l'identité (S4).
- « Brau- Und » n'est pas une donnée fausse : c'est la classe CSS `capitalize` (`InvoiceScanReview.tsx:39`).
- Sept avertissements = trois lectures aux phrases différentes, jamais dédoublonnées ; un seul avertissement libre suffit à « Lecture à confirmer ». « Total HT » s'affiche sous « Total TTC » par une regex sur le texte.
- Aucun contrôle quantité × prix ; somme des lignes tolérante à 5 centimes côté serveur, exacte côté client, muette si une ligne n'a pas de montant. La TVA par taux n'existe pas dans le modèle de données (ni code N/R par ligne). Le bloc TVA imprimé de sa facture ne se recoupe pas (bases 110,40 ≠ 86,50 ; 1,95 + 2,20 = 4,15 ≠ 2,80) et personne ne le dit.
- Pro-forma lue « devis » + payée → « À payer » (`purchasePrefill.ts:66`). Date de paiement = date de facture, affichée comme lue.
- Mouture (« Zuschlag Schrotung ») non rattachée au malt : coût du malt −4 %. Article créé en catégorie « Divers » et unités brutes (« Kg », « Stk »).
- PDF avec `/ObjStm` refusés même d'une page. Doublon : une facture finale d'un autre numéro, trois jours plus tard, même commande et même total, n'est pas signalée (`sourceOrderNumber` jamais comparé).

## Doutes et limites
- Aucun appel Gemini : la lecture simulée est une reconstruction ; les valeurs `tvaAmount` 2,8 / 4,15 qui motivent la 3e lecture sont une hypothèse. Délai non mesuré (voie d2).
- Stock simulé (noms de `StockPreview.tsx`), pas son vrai stock. Estimation de 1 937 jetons de sortie pour 23 lignes à 3,2 caractères par jeton ; réflexion non comptée ; plafond 4 500 à mesurer pour 35 lignes.
- Page 2 de sa facture inconnue. Que Gemini lise toutes les pages d'un PDF : code lu (fichier entier envoyé), non prouvé.
- Parcours Chrome non joué (voie i1 et suite).

DÉCISION À PRENDRE : (1) PDF compressés (P1) : (a) compter les pages côté client avant l'envoi, (b) accepter tout PDF ≤ 4 Mo et plafonner par le coût ; recommandation : (a) si une bibliothèque de lecture de PDF est acceptable, sinon (b). (2) « Pro-forma » (A6) : type à part ou booléen sur `invoice` ; recommandation : booléen `proForma`, la preuve de paiement lue l'emporte sur le type. (3) Lever `STOCK_LINE_PROPOSALS_ENABLED` : seulement après S2, S3, S4 corrigés et leurs tests ; recommandation : oui dans cet ordre, propositions toujours marquées.

CONNAISSANCE : l'enregistrement d'un achat n'écrit aucun prix d'article ; le prix d'un article vient des lignes de dépense liées à lui (`latestBrewPrices`, `brewBudget.ts:187`), donc une ligne sans lien ne nourrit aucun coût. Les contrôles de cohérence d'une facture (quantité × prix, TVA par taux) n'existent pas côté code aujourd'hui.

LEÇON PROPOSÉE : aucune
