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
| r1-raccord | ce que s1 et s2 ont réparé arrive jusqu'à l'écran (A11, A12, A7, DR1, DR4) ; Stk ↔ sachet, « Kilo », « Liter », « Kg. » et la garde D214 à l'enregistrement | jugement | auteur | sonnet | 110 | src/ui/finance/ExpenseSheet.tsx, src/services/purchaseEntry.ts, src/services/stockLineMatching.ts (export seul), tests/unit/purchaseEntry.test.ts, tests/integration/expenseSheet.test.tsx, tests/unit/depense/raccord/**, work/missions/2026-10-31-ecran-depense/voies/r1-raccord/** | s1, s2 | COMPRIS, REVUE, build, types, TESTS RACCORD, NOTE | pilote | code en deux temps |
| r2-details | les détails 3 à 7 de la relecture de r1 : `stockQuantityFor` au poids, texte « en cours » testé, témoins par mutation, rejet confirmé, « Changer » et `pendingId` | jugement | auteur | sonnet | 70 | src/services/purchaseEntry.ts, src/ui/finance/ExpenseSheet.tsx (attach, pendingId), tests/unit/purchaseEntry.test.ts, tests/integration/expenseSheet.test.tsx, tests/unit/depense/raccord/**, work/missions/2026-10-31-ecran-depense/voies/r2-details/** | r1-raccord | COMPRIS, REVUE, build, types, TESTS DETAILS, NOTE | pilote | code en deux temps |
| l2-rapprochement | A1, A2, U1, LE1, LE4 et les relais de l1 : un point par champ, statut des contrôles, valeurs concurrentes gardées, troisième lecture sur une vraie divergence, journal par lecture, points typés jusqu'au client, recalcul client | jugement | auteur | sonnet | 120 | functions/src/invoiceVisionReview.ts, functions/src/ai.ts, functions/src/invoiceScanCore.ts (types, import du module commun), functions/src/invoiceControls.ts, functions/src/invoiceScanBudget.ts, tests/unit/invoiceScanBudget.test.ts, src/services/geminiScanner.ts, src/services/purchasePrefill.ts (scannedPayment), src/services/invoicePoints.ts, src/domain/finance/invoicePoints.ts, tests/unit/invoiceVisionReview.test.ts, tests/unit/invoiceScanCore.test.ts, tests/unit/purchasePrefill.test.ts, tests/unit/geminiScanner.test.ts, tests/unit/depense/rapprochement/**, work/missions/2026-10-31-ecran-depense/voies/l2-rapprochement/** | l1-lecture | COMPRIS, REVUE, build, types app et fonctions, TESTS RAPPROCHEMENT, NOTE | pilote | code en deux temps |
| e-r | écran, série r : sa langue (Malts s1, Identité r4-a) appliquée à la facture, le doute sur la ligne (BRIEF-ECRAN.md) | conception | concepteur | opus | 60 | work/missions/2026-10-31-ecran-depense/v0/r*/** | — | baseline : controle-commun --profil=sans-houblons, mots-premier-ecran, controle-contraste, verifier-page, captures | pilote | v0 ×4 (1 froide, 1 tiède, 2 chaudes) |
| e-z | écran, série z : créative à fond (BRIEF-ECRAN.md) | conception | concepteur | fable | 60 | work/missions/2026-10-31-ecran-depense/v0/z*/** | — | baseline : controle-commun --profil=sans-houblons, mots-premier-ecran, controle-contraste, verifier-page, captures | pilote | v0 ×4 (1 froide, 1 tiède, 2 chaudes) |
| e-u | écran, série u : libre au brief minimal (BRIEF-ECRAN.md) | conception | concepteur | opus | 60 | work/missions/2026-10-31-ecran-depense/v0/u*/** | — | baseline : controle-commun --profil=sans-houblons, mots-premier-ecran, controle-contraste, verifier-page, captures | pilote | v0 ×4 (1 froide, 1 tiède, 2 chaudes) |
| e-t | tri des 12 concepts (classement, 3 candidates, greffes) | jugement | critique | fable | 30 | work/missions/2026-10-31-ecran-depense/critique/** | e-r, e-z, e-u | controle-panel, captures ouvertes | pilote | tri |
| e-p2 | passe 2 des 3 candidates, par leurs auteurs, avec les greffes du critique | conception | concepteur | opus | 60 | work/missions/2026-10-31-ecran-depense/v1/** | e-t | controle-commun --profil=sans-houblons, mots-premier-ecran, controle-contraste, verifier-page, captures | pilote | passe 2 |
| e-t2 | verdicts de la passe 2 (r2b, z2b, u4b) et la candidate à porter, agent neuf (D207) | jugement | critique | fable | 30 | work/missions/2026-10-31-ecran-depense/critique/VERDICTS-v1.md | e-p2 | verdict par variante, captures ouvertes | pilote | — |
| e-port | r2b (le ticket), choisie par le pilote (D223, D227), portée dans l'écran Nouvelle dépense de l'app, geste par geste, avec les corrections et greffes du critique et les relais des voies (mouture, S8, base de la date, reçu, gardes de r2, points de l2) ; plan relu à deux regards | jugement | auteur | sonnet | 150 | src/ui/finance/ExpenseSheet.tsx, src/ui/finance/InvoiceScanReview.tsx, src/ui/depense/**, src/components/QuickActionModal.tsx, src/domain/finance/forecast.ts, src/ui/finance/FinanceForecastSummary.tsx, tests/integration/expenseSheet.test.tsx, tests/unit/depense/ecran/**, work/missions/2026-10-31-ecran-depense/voies/e-port/** | e-t2, l2-rapprochement, r2-details | build, types, tests, audit des champs, DEPENSE OK sur l'app servie, critique | pilote | — |
| s6-fiche | D215 et D216 : l'article d'un produit déjà connu reçoit « bis » ou son origine, ses vraies valeurs (α, EBC…) et le lien vers la fiche la plus proche, marquée approchée ; la règle unique remplace voisinDe (R9) ; catalogues du dépôt seulement ; plan relu à deux regards | jugement | auteur | sonnet | 150 | src/services/stockLineMatching.ts, src/services/purchaseEntry.ts (création de l'article neuf), src/types/index.ts (champs facultatifs de StockItem), src/domain/stock/**, src/ui/finance/ExpenseSheet.tsx, src/ui/depense/**, tests/unit/depense/fiche/**, tests/unit/purchaseEntry.test.ts, tests/unit/stockLineMatching.test.ts, work/missions/2026-10-31-ecran-depense/voies/s6-fiche/** | e-port, s1-stock, l2-rapprochement | build, types, tests, audit des champs, S6 OK sur l'app servie, critique | pilote | — |
| p3a | passe 3 (D235), série froide et tiède : r2b de l'app en plein écran, le maximum de lignes, groupées par catégorie avec sous-totaux, pastilles de r1, récap qui renvoie, Drive invisible et échec en grosse notification | conception | concepteur | opus | 60 | work/missions/2026-10-31-ecran-depense/v3/p3a-*/** | b1-bande | controle-commun --profil=sans-houblons, mots-premier-ecran, controle-contraste, verifier-page, compter-lignes (b ≥ 16), captures | pilote | passe 3 ×3 |
| p3b | passe 3 (D235), série tiède et chaude, même base et mêmes greffes | conception | concepteur | opus | 60 | work/missions/2026-10-31-ecran-depense/v3/p3b-*/** | b1-bande | controle-commun --profil=sans-houblons, mots-premier-ecran, controle-contraste, verifier-page, compter-lignes (b ≥ 16), captures | pilote | passe 3 ×3 |
| e-t3 | verdicts de la passe 3 (6 variantes), agent neuf | jugement | critique | fable | 30 | work/missions/2026-10-31-ecran-depense/critique/VERDICTS-v3.md | p3a, p3b | verdict par variante, captures ouvertes | pilote | — |
| d3-drive-fond | plan : envoi au Drive en arrière-plan après « Confirmer », échec durable et notification qui ramène à la facture | jugement | auteur | sonnet | 50 | work/missions/2026-10-31-ecran-depense/voies/d3-drive-fond/** | s2-enregistrement | PLAN.md | pilote | — |
| d3c-drive-code | le plan d3 relu (CONCEPTION OK, PRET OK) codé : file persistante, notification provisoire, renvoi depuis la fiche, banc Chrome sur émulateurs | jugement | auteur | sonnet | 150 | src/services/proofQueue*.ts, src/services/proofUploadStatus.ts, src/ui/finance/ProofUploadNotice.tsx, TransactionDetails.tsx, TransactionJournal.tsx, ExpenseSheet.tsx (pied), src/services/purchaseEntry.ts, src/domain/finance/types.ts, src/App.tsx (montage), tests/unit/depense/drive-fond/**, tests du § 4.2, scripts/check-invoice-journey-emulator.mjs, work/missions/2026-10-31-ecran-depense/voies/d3c-drive-code/** | d3-drive-fond | TYPES, TESTS DRIVE, audit, build, EMU-INVOICE-JOURNEY-OK (drive-fond, témoin sur HEAD), BANDE OK | pilote | code |

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
| Nouvelle dépense · panel v0 (12 concepts, classés) | 31.10 v1 | https://claude.ai/artifact/PNStV1RNHi7bYSogYMJhXy | `work/missions/2026-10-31-ecran-depense/panel-v0.html` |
| Nouvelle dépense · passe 2 (r2b, z2b, u4b ; r2b choisie par le pilote, D227) | 01.11 v1 | https://claude.ai/artifact/PyodUeikFKc9SwD7M9k4wu | `work/missions/2026-10-31-ecran-depense/choix-v1/index.html` |

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

- 31.10, nuit : **r1-raccord écrite** (VOIE, GATES, LINT OK) et lancée (auteur Sonnet neuf) : COMPRIS puis PLAN.md, arrêt ; ensuite deux
  relecteurs neufs (Conception, Prêt à coder), tri du pilote, code, relecteur neuf. Le dessin de la mouture, S8 et la base de la date vont à la voie écran (L25).

## Signature
- 31.10, nuit : **intégration de l1 par le pilote** : `invoice-v5` partout (`purchaseEntry.ts`, son test, `eval-expense-vision.mjs`, docs), plafond de sortie
  du scan à 5 100 jetons par `SCAN_MAX_OUTPUT` (`ai.ts` le lit, plus de 4500 en dur ; tests de transport, de budget et de relecture à 5100). Fonctions typées,
  34 fichiers de tests verts, build vert, manifeste intact (21dd75b3). **Commit 2c54ac66** : s2+s2b et l1+l1b.
- 31.10, nuit : **D216** (sa réponse « voulez-vous l'origine oui ») : l'article d'origine différente porte son origine dans le nom (« Cascade CH ») ; sans origine
  connue ou pour un autre écart, « bis » reste (lecture étroite). **D217** (« Je l'accord pour les test 10ch de budget ») : 10 CHF au plus en tout pour les appels
  Gemini réels des tests de la mission (recherche de fiche S6, lectures de D210), journalisés dans `journal-gemini.md` ; Gemini en production attend toujours.
- 31.10, nuit : **s1 relu** : 0 bloquant, 2 majeurs (mot du fournisseur retiré même s'il décrit le produit : « Bio Pilsner », « Cascade Cryo » ; Stk ↔ sachet
  bloqué à l'enregistrement, déjà confié à r1), 7 détails → **s1b** (auteur neuf) : S1B OK, 7 corrigés, 79 tests rouges puis verts, une assertion changée
  (« Munich » chez Rauch AG → rien, déclarée). Rejoué par le pilote : 10 fichiers verts. Relecture neuve de s1b en vol. À r1 aussi : « Kilo », « Litres »
  reliés par l'appariement mais refusés par `validatePurchase` (même table d'unités que s1, sans élargir `Units`).
- Il demande : « Il faudra bien testé sur la vrai app! » : les tests D210 sur l'app en ligne restent dans le plan, après r1 et le déploiement.
- 31.10, nuit : **D223** : « Je vais allé me coucher, continue pour la vue des saisie de facture. Tu me feras plusieurs propal, mais tu choisira une pour implémenter dans la vraie app, car le prochain feedback sera dans 9h de ma part. Donc continue là dessus, sans avoir besoin de mon retour ! ». L'écran de saisie passe par l'entonnoir allégé cette nuit ; le pilote choisit seul (délégation, réversible, montré à son retour) et implémente ; les points ouverts (détails 3 à 7 de la relecture r1, l2, S6) sont menés en même temps.
- 31.10, nuit : **l'écran en entonnoir allégé** (D204, D223) : brief commun `BRIEF-ECRAN.md` (sa facture 372765, les points du diagnostic, neuf états) ; séries r, z, u (4 concepts chacune), puis le tri du critique, une passe 2, la page ; le pilote choisit (D223) et le port suit, avec la mouture, S8, la base de la date, le reçu à la fermeture et `pendingId`. Pas de jury sur ce lot : les axes A1 à A5 sont des hypothèses du pilote, réversibles. Le brasseur, au départ de la nuit : « Pas de bloquage sur une attente de mon feedback c'est primordial ».
- 31.10, nuit : voies **r2-details** (les détails 3 à 7 de la relecture r1) et **l2-rapprochement** écrites (LINT OK) et lancées (auteurs Sonnet neufs), en deux temps : PLAN, deux relecteurs neufs, tri, code, relecteur neuf. Leurs tests protègent le comportement pendant le port de l'écran.
