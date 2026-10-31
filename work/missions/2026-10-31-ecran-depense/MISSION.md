# Mission 2026-10-31-ecran-depense — refaire l'écran « Nouvelle dépense » et fiabiliser la facturation

## Objectif
L'écran suivant du programme « refaire tous les écrans un à un ». Ses mots (SPEC-BRASSEUR, 31.10, mot pour mot) : « déjà la partie
business est pas 100% correcte. Les liens avec le stock et tout de font pas correctement, certain champs sont mal remplis. Pas sûr que ça
upload vraiment le document sur mon drive... Et avec la facture d'envoyer ça a pris vraiment longtemps 10s 20s sur téléphone. » ;
« Aussi sur les entrée, prévision et Tout c'est pas top. » ; « Surtout montrer les points où l'ia n'es pas sûr » ; « comme c'est de la
facturation, c'est super important, ça doit être très fiable ! » ; « À tester aussi en long en large sur la vrai app ».
Sa facture et ses trois captures : `brasseur/` (hors Git : nom et adresse).

Fini veut dire :
- sa facture 372765 lue juste, champ par champ, ligne par ligne, et le stock relié juste, prouvés par un test sur la vérité de sa facture
  (Gemini simulé) ;
- le justificatif réellement dans son Drive, et prouvé ;
- un temps de lecture mesuré et réduit ;
- les points incertains montrés à leur place ;
- l'écran refait en entonnoir allégé (D204), choisi par lui, porté ;
- un produit nouveau (malt, houblon, levure ou autre sans fiche) : sa fiche remplie par une recherche en arrière-plan après la validation, sans jamais créer un doublon d'un produit déjà connu (ses mots du 31.10 : « Attention au mapping, on veut pas de retrouver avec plein de fiche du même produit ») ;
- le tout joué sur l'app en ligne, dans les accords qu'il donne.

## Décisions
| Décision | Options | Décideur | État |
|---|---|---|---|
| Ordre : fiabilité d'abord (lecture, stock, Drive, lenteur), interface ensuite | — | pilote | tranchée : c'est de la facturation (« ça doit être très fiable ») |
| Les contrôles de cohérence (somme des lignes, TVA par taux, total) | par l'IA ; par le code | pilote | tranchée : par le code, déterministes ; l'IA lit, le code vérifie |
| Tests sur l'app en ligne : lectures Gemini facturées, dépense de test écrite puis supprimée, fichier de test dans son Drive | A, B, rien | utilisateur | **accordée, A et B** (31.10 : « A : des lectures Gemini réelles, facturées » ; « Et b »). Bornes D210 : 40 lectures et 2 CHF au plus, journal `journal-gemini.md` ; une dépense « TEST pilote » à la fois, fichier Drive compris, supprimés dans la séance ; aucun article ni mouvement de stock réel ; sur le code corrigé et déployé |
| Fiche d'un produit nouveau : le rapprochement d'abord (alias, α et récolte hors du nom, S3), puis une recherche en arrière-plan qui ne comble que les trous ([[export-et-ia]]) ; jamais d'écrasement d'une valeur saisie | où vit la fiche (article de stock, catalogue partagé) ; par qui (Gemini, panel croisé des sources) | pilote | ouverte : voie du plan, revue à deux regards (données, schéma) ; Gemini en production : coût par produit montré avant activation (accord de l'utilisateur) |
| Le choix de la variante d'écran | — | brasseur | ouverte |
| Découpe des corrections (31.10, nuit) : quatre voies de code à périmètres disjoints, chacune en deux temps (PLAN relu par deux relecteurs neufs, puis code) ; ensuite l2 (rapprochement des lectures, statut, journaux : A1, A2, LE1, LE4, U1, sur le contrat du point typé de l1), la fiche d'un produit nouveau (sur l'identité de s1), puis l'écran en entonnoir | — | pilote | tranchée ; exigences communes dans `voies/COMMUN.md` |
| Propositions d'article (décision 117 du 17.10 : coupées, 18 fausses sur 27) : rallumées seulement à 0 fausse proposition sur la chasse rejouée ; une manquée est permise, une fausse non | — | pilote | tranchée (prudente : sans preuve, la garde reste) |
| Règles des vues (TA3 : une pièce future compte dans « à payer » à son échéance, dans les deux vues ; TA4 : sans échéance, ligne « échéance à préciser », aucune date inventée ; TA6 : tendance sur les charges récurrentes seulement) | — | pilote | tranchée, réversible ; TA1 et TA5 en variantes |
| Lectures en parallèle dès le départ (LE2, +50 % de jetons par facture) | — | utilisateur | non proposée : coût Gemini en production ; C1 (troisième lecture sur une vraie divergence) d'abord |

## Voies
| Voie | Objectif | Niveau | Agent | Modèle | Plafond | Possède | Dépend de | Contrôles | Décideur | Étape |
|---|---|---|---|---|---|---|---|---|---|---|
| d1 | diagnostic : lecture de la facture, champs, lignes, liens au stock, incertitude ; vérité de sa facture en fixture | jugement | auteur | sonnet | 100 | work/missions/2026-10-31-ecran-depense/diagnostic/d1/** | — | DIAGNOSTIC.md, fixture, tests rejoués | pilote | — |
| d2 | diagnostic : Drive, lenteur, onglets Entrées, Prévision et Tout | jugement | auteur | sonnet | 100 | work/missions/2026-10-31-ecran-depense/diagnostic/d2/** | — | DIAGNOSTIC.md, mesures | pilote | — |
| i1 | inventaire et captures de l'écran actuel (fixtures) | mécanique | executant | haiku | 60 | work/missions/2026-10-31-ecran-depense/inventaire/** | — | inventaire-depense.md, captures ouvertes | pilote | — |
| l1-lecture | la lecture contrôlée par le code (C1 à C3, A10, A6, A9, P1, P2, A3), un point typé par contrôle | jugement | auteur | sonnet | 110 | functions/src/invoiceScanCore.ts, functions/src/prompts.ts, functions/src/ai.ts (SCAN_MAX_OUTPUT), tests/unit/invoiceScanCore.test.ts, tests/unit/invoiceVisionReview.test.ts (fixture l. 179-182), tests/unit/depense/lecture/**, voies/l1-lecture/** | d1 | GATES.md, PLAN relu | pilote | — |
| s1-stock | chaque ligne reliée au bon article ou à aucun (S1 à S4, A8, A9, B-V3-5), chasse du 17.10 à 0 fausse | jugement | auteur | sonnet | 110 | src/services/stockLineMatching.ts, src/services/ingredientIdentity.ts, src/ui/finance/ExpenseSheet.tsx (l. 12, 148-155, lineStatus), tests/unit/stockLineMatching.test.ts, tests/integration/jus0Journey.test.tsx, tests/unit/depense/stock/**, voies/s1-stock/** | d1 | GATES.md, PLAN relu | pilote | — |
| s2-enregistrement | la dépense écrite juste et sa preuve Drive (A7, A11, A12, S5, S7, S8, DR1, DR4, DR5) | jugement | auteur | sonnet | 110 | src/services/purchaseEntry.ts, purchasePrefill.ts, financeDocuments.ts, driveFileStore.ts, src/domain/finance/brewBudget.ts, src/domain/finance/types.ts (3 champs), leurs tests, tests/integration/financeDocumentPersistence.test.ts, tests/unit/depense/enregistrement/**, voies/s2-enregistrement/** | d1, d2 | GATES.md, PLAN relu | pilote | — |
| t1-onglets | les nombres des vues Finances cohérents (TA2, TA3, TA4, TA6) | jugement | auteur | sonnet | 90 | src/domain/finance/ledger.ts, forecast.ts, src/ui/finance/TransactionJournal.tsx (compteur), src/components/tabs/FinancesTab.tsx (l. 76), src/ui/finance/FinanceForecastSummary.tsx (une ligne), leurs tests, les 7 tests qui rendent FinancesTab, tests/unit/depense/onglets/**, voies/t1-onglets/** | d2 | GATES.md, PLAN relu | pilote | — |

## Boucle de retour
Ses mots vont mot pour mot dans SPEC-BRASSEUR.md. Chaque défaut du diagnostic devient un test qui échoue sur le code d'aujourd'hui avant sa
correction (L13). Son choix d'écran va dans `choix/ecrans-app.json` (D206).

## Budget
Avant : semaine, tous modèles 12 %, Fable 8 % (31.10, vers 17 h).

## Sources
- `src/ui/finance/ExpenseSheet.tsx`, `src/ui/finance/InvoiceScanReview.tsx`, `src/services/driveFileStore.ts`
- `functions/src/invoiceScanCore.ts`, `functions/src/invoiceVisionReview.ts`, `functions/src/invoiceScanBudget.ts`
- `docs/finances.md`, `docs/finance-verification.md`, `docs/financial-sync.md`, `docs/gemini-budget.md`, `docs/qa/mobile-depenses-drive-2026-09-09.md`

## Pages
| Sujet | Version | Adresse | Source |
|---|---|---|---|

## Reprise
- 31.10, nuit : d1, d2 et i1 rendus. Quatre voies écrites (l1-lecture, s1-stock, s2-enregistrement, t1-onglets ; exigences communes
  `voies/COMMUN.md` ; LINT OK, MISSION OK). Tests de compréhension (Haiku) en vol. Ensuite, par voie : l'auteur écrit PLAN.md et
  s'arrête ; deux relecteurs neufs (Conception, Prêt à coder) écrivent REVUE-PLAN.md ; le pilote trie (`systeme.mjs revue`) ; l'auteur
  code (même agent, `SendMessage`) ; rejeu `systeme.mjs voies … --approuver`. Puis l2 sur le contrat du point typé de l1.
- 31.10, nuit (suite) : COMPRIS OK pour les quatre (8, 5, 8 et 7 doutes) ; objectifs conformes. Les doutes portaient sur ce que le plan
  tranche et sur trois points de méthode (qui lance les relecteurs, dossiers de tests, tests hors « Possède ») : précisés dans
  `COMMUN.md`, sans second test (aucun écart d'objectif). Les quatre auteurs écrivent leur PLAN.md.
- 31.10, nuit (revues) : les huit revues rendues. Aucun plan prêt tel quel : 4 bloquants (tests hors Possède dans les quatre plans ; s1 :
  « Crystal » en kg relié à un houblon en g). Tri du pilote dans chaque `REVUE-PLAN.md` (REVUE OK) ; Possède, OWNS et G2 étendus ; les
  quatre auteurs corrigent leur plan puis codent. Décisions qui touchent la suite : (1) voie **r1** (Sonnet), après s1 et s2, branche
  dans `ExpenseSheet.tsx` `unitPrice`, `applyScannedDescription`, les propositions de mouture et `savePurchaseWithProofReceipt` ;
  (2) voie **l2** reçoit les relais de l1 (vote de `vat`, `proForma`, `printedLineCount`, `alphaPct` ; `linesLost` des lignes retenues ;
  `geminiScanner.ts` et `ScannedInvoiceResult` ; `documentTypeRetenu` lu par `scannedPayment` ; recalcul client ; troisième lecture
  sur `points`, pas sur un écart multiple de 5 centimes) ; (3) à l'intégration, le pilote passe `purchaseEntry.ts:237`, son test et
  `eval-expense-vision.mjs:142` à `invoice-v5` dans le même commit que l1, et met à jour `docs/expense-prefill-v4.md`,
  `docs/gemini-budget.md` ; (4) la mouture n'est que proposée, liée au malt au seul geste du brasseur (voie écran) ; (5) la fiche
  produit (S6) nommera l'article créé par le nom propre de s1 et écrira son α. Leçon des quatre plans versée à `sans-memoire.md` § 2.
  À verser au cerveau à la signature : les variations de chasse d'appariement (nature absente, `kind`, poids, parenthèse après un
  code générique ; LEÇON PROPOSÉE de la revue s1).
- 31.10, nuit (code) : **t1, s2, l1 rendus**, critères rejoués par le pilote : t1 `TESTS ONGLETS OK` (18 fichiers, 163 tests), s2
  `TESTS ENREGISTREMENT OK` (14 fichiers), l1 `FONCTIONS TYPEES OK` et `TESTS LECTURE OK` (13 fichiers), `REVUE OK` et `NOTE OK` pour
  les trois. t1 : diff lu ; `FinancesTab.tsx:183` (trois props pour la ligne « Échéance à préciser ») accepté, seul conduit. L'échec de
  `tests/ux-mobile/financePeriodDrilldown.test.tsx` (259,25 contre 216,75) est **préexistant**, prouvé sur HEAD dans un worktree
  temporaire : dates relatives au jour, test hors `include` de vitest ; à corriger à part. Décisions du pilote : la ligne « Échéance à
  préciser » reste une `finance-notice` jusqu'à la voie écran ; « Prévision incomplète », qui s'affiche dès que du brassage est écarté
  (TA6), et « Achats de divers » (clé brute) vont aux critères de la voie écran ; `SCAN_MAX_OUTPUT` passe à 5 100 à l'intégration de l1
  (option B : pire cas 4 050 jetons), avec `invoiceReview.test.ts:61`, `invoiceScanTransport.test.ts:29` et les deux `4500` de
  `ai.ts:100-101`. Relectures du code de s2 et l1 par deux relecteurs neufs (`RELECTURE.md`), avant leur commit. t1 commité.
- 31.10, nuit : **D214**, le brasseur sur la règle n° 4 de D213 : « Unité illisible : la ligne n'est reliée à aucun article.???? ».
  Règle refusée : elle était du pilote. Lecture étroite : la ligne reste proposée, l'unité vide, « unité à préciser », rien en stock tant
  qu'elle manque (garde : voie r1). s1, encore en vol, a reçu la correction ; COMMUN.md, decisions, SPEC, DEFAUTS, REMPLACES à jour.
  Les jus0Journey rouges (2) attendent s1, qui possède le fichier.
- 31.10, nuit : **s1 rendu**, rejoué (`TESTS STOCK OK`, 12 fichiers ; REVUE OK, NOTE OK ; périmètre tenu) ; D214 appliquée (unité vide, « unité à préciser » ; `purchaseEntry.ts:201` refuse déjà une ligne liée sans unité : le stock ne bouge pas). Décision : les levures en « Stk » proposées mais refusées à l'enregistrement (`purchaseEntry.ts:205`) → la voie r1 accepte l'équivalence Stk ↔ sachet par `pieceUnitsEquivalent` (`ingredientIdentity.ts`), visible sur la ligne. Relecteurs neufs : s2 0 bloquant, 3 majeurs → voie **s2b** (auteur neuf) ; l1 0 bloquant, 4 majeurs (PDF quadratique, 3e lecture payante déclenchée par `lignes-annoncees`, deux faux écarts de TVA) → voie **l1b** ; s1 en relecture.
- 31.10, nuit : **D215**, sa demande : même produit, autres données (α, origine, récolte, EBC…) → un article « bis » lié à la fiche la plus proche, ses valeurs vraies, une fiche dédiée cherchée, sinon la fiche approchée montrée. Va à la voie **S6** (fiche d'un produit), avec un champ facultatif article → fiche (plan relu à deux regards). COMMUN.md, SPEC, decisions, DEFAUTS à jour.

## Signature
