OK — la lecture contrôle quantité × prix, somme, TVA par taux et unités ; points typés, 372765 signalée à sa place

Voie l1-lecture, mission 2026-10-31-ecran-depense. Gemini jamais appelé (lectures simulées en JSON). Rien n'est commité.

## Fichiers écrits
- `functions/src/invoiceScanCore.ts` : contrôles `lineMathCheck`, `sumCheck`, `vatBlockCheck`, `countPdfPages`, `toCents`, contrat exporté (`ScanPoint`, `ScanControls`, `SCAN_POINT_CODES`…), `INVOICE_SCAN_VERSION = 'invoice-v5'`.
- `functions/src/prompts.ts` : seul le bloc `scanInvoice` (prompt et schéma) ; `git diff --stat` : 17 ajouts, 4 retraits, aucun autre prompt touché.
- `tests/unit/invoiceVisionReview.test.ts` : la fixture de la ligne 180 seulement (`item({ quantity: 2 })`, REVUE-PLAN Prêt n° 1).
- `tests/unit/depense/lecture/` : `aide.ts`, `lignes`, `somme`, `tva`, `document`, `pdf`, `taille`, `unites`, `facture-372765` (`.test.ts`) et `fixtures/` (lecture simulée de 372765, vérité sans nom ni adresse).
- Dans la voie : `PLAN.md` (§ 0 = corrections de revue), `generer-fixture.mjs`, `temoin-avant.txt`, ce fichier.
- Non touchés : `ai.ts` (le plafond de sortie n'a pas été relevé, voir DÉCISION), `tests/unit/invoiceScanCore.test.ts` (ses cas restent verts ; les cas nouveaux sont dans `depense/lecture/`).

## TEMOIN AVANT
Les huit fichiers de test ont été écrits et lancés sur le code d'aujourd'hui, avant toute correction (sortie complète : `temoin-avant.txt`) :
`Test Files 7 failed (7) — Tests 60 failed | 7 passed (67)`. Raison des échecs : l'absence du champ (`Cannot read properties of undefined (reading 'filter')` sur `r.points` : 19 fois ; `expected undefined to be …` pour `controls`, `proForma`, `documentTypeRetenu`, `alphaPct`, `linesLost` ; PDF : `expected [Function] to throw error matching /compter/ but got 'Ce PDF ne permet pas de vérifier la l…'`, idem `/chiffré/`). Aucune erreur d'import : chaque test échoue pour le défaut visé.
Les 7 verts d'avant sont des gardes voulus : C4 (HT jamais calculé), « ObjStm sans flux refusé », « `/Pages /Count 5` refusé », « aucune page refusée », et le test d'idempotence à vide.
Cas D213 (ajoutés après, `unites.test.ts`) : rejoués sur le code de HEAD (copie dans le dossier temporaire, esbuild) : `points: undefined`, `controls: undefined`, l'unité absente ne donne qu'une phrase (`Malt : quantité ou unité manquante…`), 250 × 8,00 = 20,00 ne donne **aucune** phrase ; l'unité « Kg » sort déjà `"Kg"` (garde, vert avant et après).

## Défauts : ce qui est fait et son test
- **C1** quantité × prix : `lineMathCheck`, point `ligne-montant` (centimes, ligne, cellules), demi-centime accepté des deux côtés, remise en valeur absolue, ligne sans prix/quantité/montant comptée `skipped` sans point, fraction de centime = non vérifiée. `lignes.test.ts` (8 cas, dont 6 × 2,30 → 60 Kg lus : écart −124,20 CHF).
- **C2** somme : égalité au centime, plus de tolérance de 5 centimes ; ligne sans montant = `somme-incomplete` (cas b) ; lignes en HT reconnues (`base: 'HT'`) ; aucune ligne = non vérifiable, sans point. Un écart de 1 à 5 centimes ajoute l'indice « Rundung ». `somme.test.ts`.
- **C3 et A10** TVA par taux : le schéma lit `vat[]` (code, taux, base, montant) et `vatCode` par ligne ; quatre relations (TVA du taux avec tolérance d'arrondi ⌈n/2⌉+1, somme des TVA, somme des bases, bases contre lignes par code) ; base TTC ou HT choisie une fois pour le bloc ; **un seul** point `tva-incoherente` avec ses `details`. `tva.test.ts` (bloc cohérent TTC, HT, arrondi par ligne, code « N 8.1% »).
- **C4** : rien de changé au comportement (2 centimes de tolérance, même phrase) ; point typé `ht-tva-ttc` en plus ; un HT n'est jamais calculé (test).
- **A6** pro-forma : `proForma`, `documentTypeRetenu` ; **`documentType` n'est jamais écrasé** ; points `type-deduit`, `pro-forma-non-payee`, `devis`. `document.test.ts`.
- **A9** α : `alphaPct` et `alphaPctLu` par ligne ; recoupé avec le **nom seul** ; plage ]0, 30] (hors plage : `null`, valeur lue gardée, rejet tracé). 7 houblons de 372765 testés.
- **P1** PDF : `countPdfPages` décompresse les `/ObjStm` Flate (4 Mo par flux, 16 Mo et 200 flux au plus), compte les `/Type /Page`, lit le `/Count` dans le dictionnaire de l'arbre de pages seulement ; refus : chiffré, flux illisible, > 4 pages. `pdf.test.ts` (1 et 4 pages acceptées, 5 refusées, LZW, flux corrompu, bombe de 10 Mo, signets `/Count 12` acceptés).
- **P2** lignes perdues : `linesLost` (certain : au-delà de 35, ou repris), `printedLineCount` (annoncé) ; point `lignes-perdues`, `sum` jamais `ok` ; l'annonce seule, avec une somme exacte, ne donne qu'un point `lignes-annoncees`. « Plus de 35 lignes » une seule fois après rapprochement.
- **A3** prompt : plus de « certitude de 100 % » ; les trois doutes réels sont nommés ; absences par nature écartées ; **aucune suppression d'avertissement dans le code**. L'effet réel sur le bruit ne se mesure pas sans appel réel (banc D210).
- **D213** (« oui attention au unités ») : l'unité imprimée est gardée (seuls les espaces de bord sont retirés) ; prix par 100 g / par kg : point `ligne-prix-par-lot` inverifiable, jamais un écart (g/ml : rapport 1/100 ou 1/1000 ; kg/l : rapport 10 ; 60 Kg lus pour 6 reste un écart) ; ligne de stock ou d'emballage sans unité : point `unite-absente`, l'unité reste vide. `unites.test.ts` (10 cas). Le prompt dit de recopier l'unité et le prix tels qu'imprimés.

## Le contrat du point typé
Écrit dans `PLAN.md` § 0 (et § 2.1 pour le fond) et **exporté en types** dans `invoiceScanCore.ts`. En bref : `points: ScanPoint[]` = `{code, gravite ('ecart'|'inverifiable'), origine, enjeu, bloque, champ, champs, ligne, lignes?, cle, regle, lu, calcule, ecart = lu − calcule, unite, luTexte?, message, details?}` ; `controls = {lines, sum:{statut,base}, vat:{statut,base}, totals:{statut}}` ; plus `proForma`, `vat[]`, `linesLost`, `printedLineCount`, `documentTypeLu/Retenu`, `rejets[]`, et par ligne `vatCode`, `alphaPct`, `alphaPctLu`. Tout est **ajouté** ; `issues` reste rempli (chaque point y pousse sa phrase, ≤ 250 caractères, routée par `invoiceFieldHints` sans changement). `points` est un instantané (recalcul client : l2). Aucune clé `undefined` (test JSON, `toStrictEqual`).
Version : `INVOICE_SCAN_VERSION` passe à `invoice-v5` ; `invoiceScanId` hache la version, donc une lecture `invoice-v4` en cache n'est plus servie au nouveau format.

## La facture 372765, champ par champ
`facture-372765.test.ts` (lecture simulée complétée, comparée à `verite-372765.json`) : 23 lignes, pour chacune référence, libellé, quantité, unité (Kg, g, Stk tels qu'imprimés), prix, montant, code de TVA (N pour les lignes 11 et 12, R ailleurs) et α ; en-tête (n° 372765, commande, 27.04.2026, CHF, TTC 86,50, HT vide, TVA 2,80, pro-forma, payée). Contrôles : 23 lignes vérifiées, 0 écart, somme 86,50 = 86,50 (`ok`, TTC), HT non vérifiable. **Un seul point** : `tva-incoherente`, base TTC, avec les relations en défaut : somme des bases 110,40 ≠ 86,50 ; somme des TVA 4,15 ≠ 2,80 ; base N 26,20 ≠ 11,20 ; base R 84,20 ≠ 75,30 (les TVA par taux, à 1 et 7 centimes de l'attendu, restent sous la tolérance d'arrondi). Rien n'est corrigé : TVA 2,80, TTC 86,50, HT vide, bloc inchangé. Limite : la lecture simulée vient de la vérité transcrite à la main ; ce test prouve la chaîne de contrôle, pas la précision de Gemini sur cette image.

## Critères (essai 1 sur 3 pour chacun)
- G1 : `FONCTIONS TYPEES OK`
- G2 : 13 fichiers, 184 tests verts (`invoiceScanCore`, `depense/lecture`, `invoiceVisionReview`, `purchasePrefill`, `invoiceReview`, `invoiceScanTransport`), puis `16 schémas IA vérifiés` et `TESTS LECTURE OK`. Rejoués verts en plus : `purchaseEntry`, `geminiScanner`, `financeInvoice`, `invoiceScanBudget`, `expenseSheet`, `d100AiTaskOutput` (5 fichiers, 79 tests).
- G3 : `REVUE OK (bloquant 1, majeur 21, détail 13)` (fait par le pilote).
- G4 : `NOTE OK`.

## Rien ne se perd
- Les tests existants restent verts (voir G2 et le rejeu élargi) ; une seule fixture modifiée, celle que le pilote a désignée.
- Aucun champ retiré ni renommé dans le résultat : tout est ajouté, facultatif à la lecture (une réponse ancienne sans les nouveaux champs prend des valeurs par défaut, test). `issues`, `fieldWarnings`, `review` gardent leur forme.
- Aucune écriture Firestore dans cette voie ; un document déjà enregistré n'est pas touché. Seules les lectures `invoice-v4` en cache cessent d'être servies (nouvelle lecture payée une fois par document déjà lu ; le cache n'est ni modifié ni supprimé).
- Une valeur lue n'est jamais corrigée : le type de document, le bloc TVA, le HT, l'α et l'unité sortent comme lus ; un rejet de forme est tracé dans `rejets` et en point.
- Aucun appel réel, aucun Drive, aucune donnée du brasseur ; `brasseur/` et `functions/.env` non lus.

## Limites et doutes
- **Plafond de sortie non relevé.** Estimé à 3,2 caractères par jeton : une facture de 35 lignes comme la sienne = 3 199 jetons (marge 29 % sur 4 500). Pire cas du schéma (35 lignes, tous les champs remplis, 6 rangées de TVA) = 4 050 jetons, marge 10 % ; avant cette voie : 3 594. La règle du pilote (au-delà de 3 800, relever) s'applique donc au pire cas, mais relever `SCAN_MAX_OUTPUT` casserait `tests/integration/invoiceReview.test.ts:61` et `tests/unit/invoiceScanTransport.test.ts:29` (qui exigent 4 500, hors de mon Possède, dans G2) et change la réservation de budget (`invoiceScanBudget.ts:49-51`). Je n'y ai pas touché. Réflexion comprise, non mesurée sans appel réel.
- Le prompt (A3, D213, arrondi négatif en `discount`) est testé en texte et en schéma, jamais en comportement du modèle. Le test « arrondi −0,02 puis `validatePurchase` » du plan n'est pas écrit ; seul le texte du prompt le garantit.
- `ligne-prix-par-lot` ne reconnaît que les rapports 1/100, 1/1000 (g, ml, cl) et 10 (kg, l). Un autre prix par lot reste un écart.
- `unite-absente` ne concerne que les lignes de stock et d'emballage (un port ou une pièce de matériel sans unité est normal).
- Un écart de somme dès 1 centime déclenche la troisième lecture existante (regex « somme des lignes » de `invoiceVisionReview.ts:151`) : plus de lectures payantes possibles, bornées par `SCAN_MAX_CALLS = 3` et le budget. Les points `ligne-montant`, `tva-incoherente`, `lignes-perdues` ne la déclenchent pas.
- PDF : un fichier avec mises à jour incrémentales peut être sur-compté (refus prudent), jamais sous-compté. Les PDF à prédicteur (`/DecodeParms`) dans un `/ObjStm` sont refusés.

## Hors périmètre (relais obligatoires vers l2)
1. `geminiScanner.ts` et `ScannedInvoiceResult` : passer `points`, `controls`, `vat`, `proForma`, `documentTypeRetenu`, `linesLost`, `rejets`, `vatCode`, `alphaPct` (le client les jette aujourd'hui) ; l'unité reste « telle qu'imprimée » jusqu'à la liaison au stock.
2. `invoiceVisionReview.ts` : voter ces champs ; prendre `vat` et `linesLost` de la lecture dont les lignes sont retenues (ils viennent aujourd'hui de la lecture 1) ; lire `points` pour la troisième lecture (`ecart` sur `ligne-montant`/`somme-ecart` hors multiple de 5 centimes, jamais `tva-incoherente` ni `lignes-perdues`).
3. `purchasePrefill.scannedPayment` : lire `documentTypeRetenu` (la pro-forma payée lue « quote » donne encore « À payer » par ce chemin).
4. Recalcul côté client des points de ligne et de somme quand le brasseur corrige une valeur.
5. Le pilote, dans le même commit : `purchaseEntry.ts:237`, son test `:16` et `scripts/eval-expense-vision.mjs:142` à `invoice-v5` ; `docs/expense-prefill-v4.md:22`, `docs/gemini-budget.md:37`.

DÉCISION À PRENDRE : le plafond de sortie (`SCAN_MAX_OUTPUT`, 4 500). Options : (A) le garder, risque de « Lecture incomplète » (message existant, pas de perte silencieuse) sur une facture de 35 lignes très denses ; (B) le passer à 5 100 (pire cas 4 050 = 80 %), ce qui impose de mettre à jour `invoiceReview.test.ts:61`, `invoiceScanTransport.test.ts:29` et la réservation de budget, puis de remplacer les deux `4500` de `ai.ts:100-101` par la constante. Recommandation : (B) à l'intégration, par le pilote, avec ces deux tests ; ma voie ne peut pas le faire sans sortir de son Possède.

CONNAISSANCE : un prix de facture se lit pour son unité : 250 g × 8,00 = 20,00 est un prix par 100 g, pas une erreur ; un rapport de 1/10 sur des kg (60 lus pour 6) est une vraie erreur de chiffre. Le code ne confond les deux que par l'unité et le rapport exact (1/100, 1/1000 en g/ml ; 10 en kg/l).
LEÇON PROPOSÉE : un seuil tiré d'une règle chiffrée du brief (« au-delà de 3 800 jetons, relever le plafond ») doit être vérifié contre les tests qui figent la valeur actuelle avant d'être écrit dans la consigne ; ici deux tests de G2 exigent 4 500.

## Corrections de la relecture (voie l1b, 31.10)
`OK — 4 majeurs corrigés, tests rouges puis verts.` Un seul fichier de test neuf : `tests/unit/depense/lecture/corrections.test.ts` (20 tests). Code : `functions/src/invoiceScanCore.ts` seulement (`prompts.ts` non touché). Gemini jamais appelé, aucune donnée réelle, aucun commit.

### TEMOIN AVANT (les 20 tests lancés sur le code de la relecture, avant toute correction : 9 échecs, 11 verts = les gardes et témoins)
```
× n° 1 — 280 Ko de « stream\n » …           4010 ms   → expected 4002.5463 to be less than 1000
× n° 1 — 1 Mo de « /Type /Pages » …        37704 ms   → expected 37702.0906 to be less than 1000
× n° 2 — déclencheur réel (reconcileInvoiceVision, 2 lectures)   → expected true to be false   (needsCorrection)
× n° 2 — la phrase ne contient aucun mot du déclencheur          → expected 'Le modèle annonce 2 lignes imprimées,…' not to match /totaux HT \+ TVA|somme des lignes|Tau…/
× n° 3 — sonde H (Port sans code 10,00 dans la base R 110,00)    → expected [ { code: 'tva-incoherente', …(15) } ] to deeply equal []
× n° 3 — sonde I (Remise sans code −10,00, base R 90,00)         → expected [ { code: 'tva-incoherente', …(15) } ] to deeply equal []
× n° 4 — sonde C (Rundung −0,02, base 100,02)                    → expected [ { code: 'tva-incoherente', …(15) } ] to deeply equal []
× n° 4 — l’autre sens (base 100,00 après arrondi)                → idem
× n° 4 — « Arrondi » positif (+0,02, base 99,98)                 → idem
```
Tests verts avant et après, voulus : 1 Mo de `/Type /ObjStm` sans flux, 1 Mo de `<<` sans `>>`, PDF ordinaire à 2 pages ; vrai écart de somme qui déclenche toujours la 3ᵉ lecture ; annonce + somme fausse = `lignes-perdues` sans 3ᵉ lecture ; trois témoins de la TVA (TVA du taux fausse, somme des TVA fausse, base fausse sans ligne sans code) ; deux témoins de l'arrondi (base 100,50 pour 100,00 ; « Rundung » de 0,50, au-delà de 5 centimes).

### Ce qui est fait
1. **PDF linéaire.** `countPdfPages` ne parcourt plus chaque `stream\n` : il part des annonces `/Type /ObjStm` (plus de 200 : refusé d'emblée, comme avant), lit une fenêtre fixe de 4 000 caractères vers l'avant (le `stream` qui suit, sans `endobj` entre les deux) et vers l'arrière (le dictionnaire), mémorise le `endstream` trouvé (une recherche par tronçon). Pour les arbres de pages : fenêtre fixe de 4 000 caractères pour `<<` et `>>`, et au plus 200 `/Type /Pages` examinés ; au-delà, refus « structure trop répétitive » (contient « compter »). Sonde 280 Ko : 4 010 ms → quelques ms ; sonde 1 Mo : 37 704 ms → quelques ms (le fichier entier de 20 tests passe en 18 ms). Les 11 cas de `pdf.test.ts` restent verts (bombe Flate, LZW, flux corrompu, signets `/Count 12`).
   Limite : un `/Count` placé à plus de 4 000 caractères du `/Type /Pages` (arbre de plusieurs centaines de pages) n'est pas lu ; un tel PDF a de toute façon plus de 4 `/Type /Page` et est refusé.
2. **`lignes-annoncees` ne déclenche plus la 3ᵉ lecture.** Message : « …les montants des lignes concordent pourtant avec le document : à contrôler sur le document. » (ni « somme des lignes », ni « total » : le routage de l'écran, `purchasePrefill.ts:71`, l'aurait sinon rangé sous le total TTC ; il se range maintenant sous « lignes »). Test dans le déclencheur réel : `functions/src/invoiceVisionReview.ts:151` (le fichier est dans `functions/src/`, pas dans `src/services/` comme dans la consigne) via `reconcileInvoiceVision([a, a])` : `needsCorrection === false`. Le test échouait avant (`true`).
   Constat honnête : le déclencheur lit encore le texte des phrases. Celles qui le déclenchent aujourd'hui sont `somme-ecart` (« somme des lignes »), `ht-tva-ttc` (« totaux HT + TVA ») et le taux TVA hors plage. `ligne-montant` ne le déclenche pas encore (sa phrase ne contient aucun de ces mots) : lui donner ce rôle est le relais l2 (« lire `points`, pas les phrases », déjà inscrit plus haut). Je n'ai pas touché `ht-tva-ttc` : un test existant de `invoiceVisionReview.test.ts` fige ce déclenchement.
3. **Ligne sans code de TVA.** Dans `base-par-code`, toute ligne sans code (port, remise, arrondi, autre) compte désormais comme « peut expliquer l'écart » : si une telle ligne existe et que la relation ne tombe pas juste sur les seules lignes codées, la relation est omise (non vérifiable, aucun point). Elle reste calculée, et gardée si elle tombe juste. Les trois autres relations (TVA du taux, somme des TVA, somme des bases) tournent toujours : les témoins `tva-du-taux` fausse et `somme-tva` fausse restent des écarts avec le même port sans code. Sondes H et I : plus de point.
   Limite à connaître : avec une ligne sans code, une base d'un code qui ne recoupe pas ses lignes n'est plus signalée par cette relation seule (les trois autres l'attrapent le plus souvent, pas toujours). C'est le prix de « jamais un faux écart sur une facture exacte » ; `controls.vat.statut` dit `ok` quand les relations restantes tiennent, sans dire que `base-par-code` n'a pas pu tourner.
4. **Rundung : tolérance, pas non-vérifiable.** `somme-bases` accepte un écart d'au plus le montant absolu des lignes d'arrondi (nom `rund|arrondi|rounding|rappen`, nature `discount` ou `other`, sans code de TVA, 5 centimes au plus chacune), dans les deux sens (base avant l'arrondi imprimé, ou après). Pourquoi la tolérance plutôt que « non vérifiable » : l'hypothèse (base imprimée avant arrondi) n'est pas confirmée sur un vrai document, et les deux sens sont donc acceptés ; mais « non vérifiable » aurait aussi caché un vrai écart de 10 CHF sur toute facture qui porte un arrondi, alors que la tolérance borne ce qu'on laisse passer au montant même de la ligne d'arrondi, au plus 5 centimes par ligne. Un écart plus grand reste un écart (témoins : 100,50 pour 100,00 ; « Rundung » de 0,50, qui n'est pas un arrondi). Un test par sens : base 100,02 (avant) et base 100,00 (après), plus un « Arrondi » positif. Si un vrai document montre une autre règle, elle se règle dans `roundingCents`.

### Critères rejoués (essai 1 sur 3 pour chacun)
- G1 : `FONCTIONS TYPEES OK`
- G2 : 14 fichiers, 204 tests verts, `16 schémas IA vérifiés`, `TESTS LECTURE OK`
- G3 : `REVUE OK (bloquant 1, majeur 21, détail 13)`
- G4 : `NOTE OK`

### Fichiers écrits
`functions/src/invoiceScanCore.ts` (`countPdfPages`, `vatRelations`, nouvelle `roundingCents`, message de `lignes-annoncees`), `tests/unit/depense/lecture/corrections.test.ts` (neuf), ce fichier.

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : une facture suisse peut imprimer sa base de TVA avant ou après la ligne d'arrondi (Rundung, 5 centimes) ; non confirmé sur un vrai document, donc le code tolère les deux sens.
LEÇON PROPOSÉE : un texte de phrase qui sert de déclencheur (regex sur `issues`) fait dépendre le coût d'un appel payant du libellé d'un message ; tout message nouveau doit passer par le déclencheur réel dans un test, pas seulement par un test de son contenu.
