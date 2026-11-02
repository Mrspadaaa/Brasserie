# PLAN — voie port-total (D249 : le port est « Total seulement », partout)

Réécrit en entier le 01.11 (nuit) après la revue de deux regards neufs, triée par le pilote (`REVUE-PLAN.md`, `REVUE-conception.md`, `REVUE-pret.md`) et
les décisions de `VOIE.md` § « Décisions du pilote sur le plan » (D258). Rien n'est codé.

Ses mots (01.11 soir) : « Non non aussi quand imprimé article » (D249). Portée écrite (L01) : toute facture lue, en captures ou en PDF, dont une ligne
`kind === 'shipping'` est le port. Le port compte dans le total et dans le contrôle « somme des lignes = imprimé », il se dit à part (l'écran, voie p3c-port),
il n'est ni un article de stock ni un mouvement.

## La forme unique (D258)
Le port est une ligne `kind === 'shipping'` de `draft.lines`, de la lecture à l'enregistrement. **Cette voie ne modifie aucun fichier de `src/` ni de `functions/`** :
ni `src/services/purchaseEntry.ts`, ni `tests/unit/purchaseEntry.test.ts`, ni `functions/src/invoiceScanCore.ts`. Elle épingle par des tests ce que le code fait déjà, et elle
corrige le banc de lecture (juge, vérités, rejeu). Le critère « cette ligne est du port » pour l'écran est écrit et testé chez p3c-port ; l'affichage d'une dépense déjà
enregistrée ira à la voie p3c-finances.

## Ce que j'ai lu pour planifier (preuves, citations vérifiées sur HEAD)
- **Le contrôle de somme compte déjà le port.** `functions/src/invoiceControls.ts:157-185` (`sumCheck`) additionne tous les `items[].amountTTC`, port compris ;
  `src/ui/depense/etat.ts:53-60` (`recalculerLecture`) passe `draft.lines` entières. `tests/unit/invoiceScanMontantSeul.test.ts:29-34` : un document à la seule
  ligne « Port » rend `controls.sum = ok`. Rien à changer.
- **L'enregistrement refuse déjà ce qu'il faut refuser.** `src/services/purchaseEntry.ts` : `validatePurchase` (:341) refuse un montant absent ou à plus de deux décimales (:349),
  un montant négatif hors remise (:350), une somme des lignes différente du total (:351), 1 à 35 lignes (:347), une action de stock sur une nature hors
  ingrédient, nettoyage, emballage (:360 « cette nature ne peut pas entrer en stock »), une action de matériel hors équipement ou entretien (:379).
  `validatePurchaseCommit` (:397) l'appelle avant toute écriture ; `savePurchase` (:537) n'écrit `stockItemRef` / `equipmentRef` que si l'action n'est pas `none`
  (:572) et ne pose un reçu et un mouvement que pour une action `new` ou `existing` (:589-591). Donc une ligne `shipping` ne peut ni entrer en stock ni produire un mouvement.
  `tests/unit/purchaseEntry.test.ts:40-42` exige déjà le refus pour une ligne livraison ; il reste inchangé.
- **La comptabilité garde le port dans `finance.lines`.** `src/domain/finance/ledger.ts:170` lève « Le total des lignes ne correspond pas au montant de la pièce » si Σ `finance.lines`
  ≠ `finance.amountCents`. Cet invariant est imposé à la modification (`storage.ts:536`, `updateTransaction`) et au paiement (`financeService.ts:30`,
  `stageNewTransactionPayment`), pas à l'ajout d'une dépense impayée (`storage.ts:522`, `addTransaction`) : une dépense sans entrée de port serait refusée à sa première
  modification. D'où : le port reste une entrée `shipping` de `finance.lines`, comme pour les dépenses déjà enregistrées. `ledger.ts:43` l'exclut déjà de l'affectation par nature.
  Rien n'est réécrit, rien n'est migré.
- **Le banc.** `scripts/banc-lecture-facture-juger.ts:62-108` (`judgeResult`) compte le port comme une ligne : `items.count` (:91), alignement des lignes par indice (:92-106).
  Les vérités hors Git (`REELS_DIR` = `work/finalisation-tickets-2026-10-08/H13-reels`, ignoré par `.gitignore:56`) portent une ligne `kind: ['shipping']`, la dernière de
  sa pièce, sur trois pièces : doc5 (`cas-2.json`), doc8 et doc9 (`cas-4.json`) ; doc5 et doc9 sont la même facture (686863). Les appelants de `judgeResult` : le banc
  (`judgeBench`), `scripts/banc-lecture-qr.ts:20,103-104`, `tests/unit/banc-lecture-facture.test.ts` (indirect, vérité fabriquée : `truth` :43, `truthOf` :46) et
  `tests/unit/banc-lecture-k5.test.ts:10,91,112,230,352` (vérité fabriquée : `truthCase()`). Aucun de ces deux tests ne porte d'attente sur le port (`grep shipping` : aucun résultat).
- **Base HEAD (avant tout)** : `npx vitest run` sur 49 fichiers (brouillon, lecture, banc, Drive, raccord) → 42 fichiers, 726 tests verts ; 7 fichiers d'écran ne se chargent pas
  (`zxing-wasm/reader` absent du worktree, aucune installation permise ; déjà en échec sur HEAD, hors G3). `banc-lecture-facture.test.ts` + `banc-lecture-k5.test.ts` : 2 fichiers,
  148 tests verts. G5 sur HEAD : seules les deux erreurs de `qrLecture.ts` (`zxing-wasm/reader`, `pdfjs-dist`), que GATES.md exclut.

## Les points du plan (9)

| n | Point | Fichier |
|---|---|---|
| P1 | Épingler l'enregistrement d'une ligne `shipping` | `tests/unit/depense/port/port-enregistrement.test.ts` |
| P2 | Épingler le contrôle de somme avec port | `tests/unit/depense/port/port-controle-somme.test.ts` |
| P3 | Le juge écarte le port des deux côtés | `scripts/banc-lecture-facture-juger.ts`, `port-banc-juge.test.ts` |
| P4 | `comparerJugements`, avec sa définition de la perte | idem |
| P5 | Compter les ports lus sous un autre genre, avant d'éditer les vérités | script sous `os.tmpdir()` |
| P6 | Corriger les vérités de doc5, doc8, doc9 | `cas-2.json`, `cas-4.json` (hors Git) |
| P7 | Rejeu hors ligne avant/après, cellules attendues, cellule de contrôle | sorties sous `REELS_DIR` |
| P8 | Les appelants du juge hors de G3 : `banc-lecture-qr.ts`, `banc-lecture-k5.test.ts` | rejeu de k5 avant/après |
| P9 | Les deux lignes du port de GESTES.md remplacées | `work/missions/2026-11-01-banc-lecture/GESTES.md` |

Ordre d'exécution (deuxième temps) : copies `.avant-port` des vérités (P6, copie seule) → rejeu « avant » sur HEAD (P7) → comptage des ports d'autre genre (P5) → tests, lancés sur HEAD
(TEMOIN AVANT) → juge et `comparerJugements` (P3, P4) → vérités (P6) → rejeu « après » et cellule de contrôle (P7) → k5 (P8) → GESTES (P9) → critères G1 à G6.

## P1 — tests qui épinglent l'enregistrement (`port-enregistrement.test.ts`)
Harnais : les mocks de `tests/unit/purchaseEntry.test.ts:2-9` recopiés (`vi.hoisted` + `vi.mock` de `storage`, `firestoreRepo`, `financeService`, `financeDocuments`), variante de
`tests/unit/depense/enregistrement/paiement-prix.test.ts`. Observation : `state.writes` reçoit `['increment', ...]` pour `adjustNumber`, `['put', ...]` pour chaque `FirestoreRepo.put`
(le reçu est `put('movements', 'receipt-<saisie>-<ligne>', …)`) et `['transaction', tx]` pour l'écriture de la dépense ; `state.transactions` garde la dépense. Données fictives, Gemini
jamais appelé. Brouillon de base : une ligne malt (ingrédient, 100,00, 500 g, article existant `MP-001`) et une ligne port (`kind: 'shipping'`, 10,00, `stockAction: 'none'`), total 110,00.

| # | Donnée | Attendu | Aujourd'hui |
|---|---|---|---|
| 1 | brouillon de base, `savePurchase` | `finance.amountCents` = 11000 ; Σ `finance.lines.amountCents` = 11000 ; une entrée `kind: 'shipping'`, `amountCents` 1000, `stockItemRef` et `equipmentRef` absents ; aucun `['increment', …]` ni `put` de reçu pour la ligne du port ; un seul `put` de reçu (le malt) | passe déjà : épingle |
| 2 | port + `stockAction: 'new'`, puis `'existing'` | `validatePurchase` contient « ne peut pas entrer en stock » ; `savePurchase` lève ; `state.writes` vide | passe déjà : épingle |
| 3 | port + `equipmentAction: 'new'`, puis `'existing'` | `validatePurchase` contient « sélectionne matériel ou entretien » ; `savePurchase` lève ; `state.writes` vide | passe déjà : épingle |
| 4 | port sans montant ; port à −10,00 | refus (« Chaque ligne doit avoir un libellé et un montant » ; « Une remise est négative ») : c'est pourquoi le critère de l'écran exige un montant valide ≥ 0 | passe déjà : épingle |
| 5 | `sourceVatAmount` 8,10, `sourceVatRate` 0,081, assujetti (`state.registered = true`) ; le même brouillon avec le port en `kind: 'service'` | `amountTTC`, `tvaAmount`, `amountHT` identiques : aucune TVA ne dépend du port | passe déjà : épingle |
| 6 | document réduit à son port (une ligne `shipping` 12,50, total 12,50) | `validatePurchase` rend `[]` ; une entrée `shipping` écrite | passe déjà : épingle |
| 7 | 35 lignes dont le port ; puis 36 | 35 : `[]` ; 36 : « Prévois entre 1 et 35 lignes » : le port compte au plafond (comme `SCAN_MAX_ITEMS = 35`, `invoiceScanCore.ts:25`) | passe déjà : épingle |
| 8 | centimes : une ligne 0,10 et un port 0,05, total 0,15 | `validatePurchase` rend `[]` ; `amountCents` 15 ; Σ lignes 15 | passe déjà : épingle |
| 9 | `savePurchase` deux fois avec la même `submissionId` (double clic) | une seule dépense, un seul jeu de `put` | passe déjà : épingle |
| 10 | forme de l'entrée écrite pour le port | `toMatchObject` sur `{ id, description, kind: 'shipping', amountCents }` et `unitPriceCents`, `surchargeOfLineId` absents : témoin de non-régression de `finance.lines` | passe déjà : épingle |

## P2 — tests qui épinglent le contrôle de somme (`port-controle-somme.test.ts`)
Données : `entete` et `ligne` de `tests/unit/depense/lecture/aide.ts` (importés, non modifiés), deux lignes de stock (10,00 et 20,00) et un port 5,00, total 35,00.

| # | Donnée | Attendu | Aujourd'hui |
|---|---|---|---|
| 1 | `normalizeInvoiceScan` : deux lignes de stock + port, total 35,00 | `controls.sum` = `{ statut: 'ok', base: 'TTC' }` ; ni `somme-ecart` ni `somme-incomplete` | passe déjà : épingle (la lecture compte le port) |
| 2 | même facture sans la ligne du port | `controls.sum.statut` = `ecart`, point `somme-ecart` avec `lu` 3500 et `calcule` 3000 : c'est pourquoi le port reste dans les lignes | passe déjà : épingle |
| 3 | `recomputeInvoicePoints` (`src/domain/finance/invoicePoints.ts`) sur les mêmes trois lignes | `controls.sum` ok, aucun point de somme | passe déjà : épingle (le client compte le port) |
| 4 | port sans montant lu (`amountTTC: null`) | point `somme-incomplete` (l'inconnu n'est jamais 0) | passe déjà : épingle |

## P3 — le juge écarte le port des deux côtés (`scripts/banc-lecture-facture-juger.ts`, règle du port seulement)
Règle, même règle que l'écran (p3c-port décision 7), sauf les centimes entiers, sans objet pour les vérités du banc : une ligne est « du port » si `kind === 'shipping'` (côté lecture) ou si son `kind` attendu est la liste `['shipping']` seule
(côté vérité), si son `amountTTC` est un nombre fini ≥ 0, et si toutes les lignes de ce côté ne sont pas du port. Sinon la ligne reste une ligne ordinaire, jugée comme avant.
- `judgeResult` filtre `result.items` et `expected.items` avant `flagged`, `expectedItems`, `hidden`, `items.count` et l'alignement par indice. `lineJudged` et `lineRight` ne comptent plus le port.
  Le total `amountTTC` reste jugé tel quel (il comprend le port).
- Exports : `lignesSansPort(items)` (pur, testé) ; `judgeResult(result, expected, options?)` et `judgeBench(records, cases, options?)` reçoivent `options = { portEnLigne?: boolean }`.
  `portEnLigne: true` rend exactement le jugement de HEAD ; il ne sert qu'au rejeu « avant » et à prouver, par un test, que le nouveau juge ne change rien hors du port (n° 9 et n° 11 ci-dessous).
  Par défaut (appelants existants, dont `banc-lecture-qr.ts`) : le nouveau jugement.
- `scripts/banc-lecture-facture.ts` : aucun changement prévu (aucune règle du port n'y vit : `grep` sans résultat). Si le rejeu dit le contraire, je le dis.

Tests (`port-banc-juge.test.ts`), vérités et lectures fabriquées (malt, houblon, port), sans donnée réelle :

| # | Donnée | Attendu | Aujourd'hui |
|---|---|---|---|
| 1 | vérité malt + port, lecture malt + port | `wrong` = `[]`, `lineJudged` = 1, `lineRight` = 1 | échoue : `lineJudged` vaut 2 |
| 2 | vérité malt + port, lecture malt seul (consigne qui ne lit plus le port) | `wrong` = `[]` | échoue : `items.count` et `items.1` fautifs |
| 3 | vérité malt seul, lecture malt + port | `wrong` = `[]` | échoue : `items.count` fautif |
| 4 | vérité malt + houblon + port, lecture malt + port (houblon oublié) | `wrong` contient `items.count` et `items.1` : le filtre ne masque pas une vraie omission | passe déjà : épingle |
| 5 | port lu en `service`, en dernier ; vérité sans port | `wrong` = `['items.count']`, la ligne malt reste juste | passe déjà : épingle |
| 6 | port lu en `service`, au milieu (malt, port, houblon) ; vérité malt, houblon | `items.count` fautif **et** les champs de la ligne décalée (`items.1.name`…) ; la valeur exacte est relevée au code | passe déjà : épingle (effet connu : la faute `kind` d'une ligne devient un décalage) |
| 7 | document réduit à son port (vérité et lecture une ligne `shipping`) | `wrong` = `[]`, `lineJudged` = 1 | passe déjà : épingle |
| 8 | lecture `shipping` sans montant, puis à −2,00 | non écartée : jugée comme une ligne ordinaire | passe déjà : épingle |
| 9 | cas n° 1, 2 et 3 avec `{ portEnLigne: true }` | le jugement de HEAD (n° 1 : `lineJudged` = 2 ; n° 2 : `items.count` fautif) | passe déjà (l'option est ignorée aujourd'hui) puis épingle |
| 10 | `lignesSansPort` : tout-port inchangé, port à montant absent conservé, ordre gardé | égalité structurelle | échoue : fonction absente |
| 11 | au moins 5 couples vérité/lecture **sans** `shipping` : juste, fautif (champ faux), ligne manquante, ligne `invisible: true`, `lignesInvisibles: 1` | `judgeResult(r, e)` égale `judgeResult(r, e, { portEnLigne: true })` (verdict entier) : le juge ne change rien hors du port | passe déjà (l'option est ignorée aujourd'hui) puis épingle |

## P4 — `comparerJugements` (juge, testé dans `port-banc-juge.test.ts`)
`comparerJugements(avant: DrawVerdict[], apres: DrawVerdict[], autreGenre: ReadonlySet<string> = new Set())` rend, par cellule `doc/variante` (tous les tirages d'une cellule sont groupés) :
`{ cellule, tirages, avant: {judged, right, lineJudged, lineRight}, apres: {…}, ajoutes: string[], retires: string[], signales: string[], perte: boolean }`.
- **Perte** (définition) : sur une cellule, `judged − right` augmente, ou `lineJudged − lineRight` augmente, ou un chemin fautif est **ajouté** (un chemin présent après et absent avant, par tirage).
- Un chemin ajouté sur une cellule de `autreGenre` (la lecture y lit le port sous un autre genre, voir P5) est **signalé à part** (`signales`), pas compté comme perte du juge : c'est l'effet connu du test P3 n° 5 et 6.
- Chiffres seulement dans les rapports ; aucune valeur des pièces.
Tests : deux listes de `DrawVerdict` fabriquées → une cellule sans changement, une cellule qui perd un point (`perte: true`), une cellule dont un chemin disparaît (`retires`), une cellule en `autreGenre` (`signales`). Échouent aujourd'hui : fonction absente.

## P5 — compter les ports lus sous un autre genre (avant d'éditer les vérités)
- **Source** : toutes les lectures des sorties prêtées (`banc-k1-20261101-081144`, `banc-k4-20261101-092139`, `-092559`, `-093815`, `banc-k5-A`, `-B1`, `-B2`, `-C`, fichiers `results.json`) contre les vérités d'**avant** (copies `.avant-port`).
- **Critère** : (a) une ligne de la lecture alignée (par indice, comme le juge) sur la ligne `shipping` de la vérité, dont le `kind` n'est pas `shipping` ; (b) une ligne non `shipping` d'une lecture dont le libellé replié (casse, accents, espaces) est
  exactement l'un de : port · frais de port · livraison · versand · fracht · porto · frais d'envoi. Rien d'autre (« Transport » est la mouture, `tests/unit/depense/enregistrement/mouture-prix.test.ts:35`).
- **Lieu** : un script fichier sous `os.tmpdir()/port-total/` écrit avec Write (jamais un heredoc ni `node -e`), lancé par `vite-node` (qui le compile : une erreur de syntaxe se voit au premier lancement) et exercé par un témoin
  fabriqué (une lecture avec un port en `service`) avant d'être lancé sur les vraies sorties.
- **Sortie** : nombres seulement : lectures examinées (couverture), lignes (a), lignes (b), cellules `doc/variante` concernées (c'est l'ensemble `autreGenre` de P4). **0 est une réponse valide** et s'écrit « 0 sur N lectures examinées ».
  Le sondage du relecteur laisse attendre 0. Si le compte n'est pas 0, c'est l'entrée d'un geste de consigne plus tard, mesuré au banc : aucun code de reconnaissance dans cette voie (lecture étroite : seul `kind === 'shipping'` compte).

## P6 — les vérités de doc5, doc8, doc9 (hors Git)
- Copies d'abord : `cas-2.json` → `cas-2.avant-port.json` et `cas-4.json` → `cas-4.avant-port.json`, dans `REELS_DIR`, vérifiées (`cmp` et taille) avant toute édition. Hors Git ; rien n'y est copié ailleurs.
- Édition (outil Edit, une suppression d'objet par pièce, rien d'autre) : retrait de l'entrée `shipping` de doc5 (`cas-2.json`), doc8 et doc9 (`cas-4.json`). `amountTTC` du document inchangé : il comprend le port.
  Le juge reste correct avec ou sans ces entrées (P3) ; le retrait met la vérité d'accord avec D249. `cas-4-a.json` et `cas-4-b.json` (moitiés de travail que le banc ne lit pas) : laissées.
- Aucune valeur des pièces dans un rapport ni dans Git ; les comptes seulement.

## P7 — rejeu hors ligne avant/après (aucun appel Gemini, aucune clé)
Sorties sous `REELS_DIR` (`banc-port-avant`, `banc-port-apres`, hors Git, données personnelles).
- **Origine des lectures** (corrigée) : `banc-k4-20261101-092559` (A, C, Csv, Av… sur doc1 à doc7), `banc-k4-20261101-093815` (A, Csv, Av sur doc8 à doc12), `banc-k4-20261101-092139`, `banc-k1-20261101-081144`, `banc-k5-A` (C, Csv, Csv8, Pv, Bv),
  `banc-k5-B1` (C, Csv, Avl), `banc-k5-B2` (C, Csv, Zv), `banc-k5-C` (C, Csv, Csv8). L'ancienne origine (`banc-k5-horsligne-20261101`) ne contient ni doc8 ni doc9 : écartée.
- **Commande « avant »**, sur HEAD, avant toute édition :
  `npx vite-node --config vitest.config.ts scripts/banc-lecture-facture.ts -- --hors-ligne --reprendre banc-k4-20261101-092559,banc-k4-20261101-093815,banc-k4-20261101-092139,banc-k1-20261101-081144,banc-k5-A,banc-k5-B1,banc-k5-B2,banc-k5-C --docs doc5,doc8,doc9 --variantes A,C,Csv,Csv8,Av,Avl,Zv --out <REELS_DIR>/banc-port-avant`
  Une lecture absente est une erreur, jamais un appel : si le banc la signale, je lance les variantes par groupes (A, Av ; C, Csv, Csv8 ; Avl, Zv), trois essais au plus, et je note les cellules réellement obtenues.
- **Précondition** : la sortie « avant » doit montrer des lignes (`lineJudged > 0`) pour doc5, doc8 et doc9. Sinon : `--docs` et variantes ajustés, ou le rejeu s'arrête et je le dis.
- **Commande « après »** : la même, `--out <REELS_DIR>/banc-port-apres`, après P3, P4 et P6.
- **Comparaison** (script sous `os.tmpdir()/port-total/`, écrit avec Write, comptes seulement) : relit les `results.json`, recalcule les verdicts par `judgeBench` et applique `comparerJugements` pour trois jugements :
  1. ancien juge × anciennes vérités (`portEnLigne: true`, copies `.avant-port`) = « avant » ; il doit **reproduire exactement** le `RESULTAT-BANC.md` de la sortie « avant » du banc (preuve que l'option rend HEAD) ;
  2. nouveau juge × nouvelles vérités = « après » ;
  3. **cellule de contrôle** : nouveau juge × **anciennes** vérités : mêmes `judged`, `right`, `wrong`, `lineJudged`, `lineRight` que le n° 2, cellule par cellule (le retrait des vérités est redondant avec le juge et ne change aucun verdict ; les deux changements sont ainsi isolés).
- **Cellules attendues** (à valider par la sortie « avant », la précondition fait foi) : doc5 : toutes les variantes lues (A, C, Csv, Csv8, Av, Avl, Zv) ; doc8 : A seulement (ses autres cellules sont en panne ou sans ligne dans les sorties prêtées) ; doc9 : A, Csv, Av, plus les cellules de k5 que
  la sortie « avant » montre avec des lignes. Dans chacune : `lineJudged` −1 par tirage ; `lineJudged − lineRight`, `judged − right` et `failures` n'augmentent pas ; `ajoutes` vide (hors `autreGenre`). Hors de ces trois pièces : **aucune** cellule ne change (les autres pièces ne sont pas rejouées,
  les preuves que le juge ne change rien ailleurs que sur le port viennent de quatre endroits : P3 n° 9 (les trois cas du port rejoués avec l'option), P3 n° 11 (au moins cinq couples sans `shipping` : le juge par défaut égale `portEnLigne: true`),
  la comparaison 1 de ce rejeu (l'option reproduit le `RESULTAT-BANC.md` de HEAD sur doc5, doc8, doc9) et les 148 tests existants du banc, qui exercent le juge par défaut sans port).
- **Perdre un point** = la définition de P4. Sans perte sur toutes les cellules attendues, le critère « aucune pièce ne perd un point » est tenu ; sinon, ECHEC écrit avec la cellule.
- Série mécanique (rejeu à deux passes, trois jugements) : au premier essai près, je rédige une `DEMANDE EXECUTANT` dans RESULTAT.md (commandes exactes, fichiers produits, sorties attendues) pour un exécutant Haiku ; je juge le résultat.

## P8 — les appelants du juge hors de G3
- `scripts/banc-lecture-qr.ts:103-104` appelle `judgeResult` avant et après la garde QR. Il n'est pas dans mon « Possède » et n'est pas modifié ; son verdict ne change que si une pièce porte un port : le changement est voulu (D249), je le dis dans RESULTAT.md. Pas de test propre au script.
- `tests/unit/banc-lecture-k5.test.ts` et `tests/unit/banc-lecture-facture.test.ts` : vérités fabriquées sans port ; ils restent verts **sans modification** (base HEAD : 148 tests verts). Rejoués avant (déjà fait) et après mes changements, `--maxWorkers=2`.
  Si l'un casse, je le dis et je m'arrête : le Possède ne leur permet qu'une attente liée au port, et il n'y en a pas.

## P9 — `work/missions/2026-11-01-banc-lecture/GESTES.md`
Deux lignes du tableau (lignes 36 et 37 sur HEAD) :
- « Port imprimé comme un article (sa facture de 3 pages, son PDF 686863) » : le texte d'état et de suite est **remplacé** (non complété) par : règle D249 (le port est Total seulement partout, y compris imprimé en article) ; juge et vérités de doc5, doc8, doc9 corrigés ; rejeu hors ligne avant/après, chiffres de P7 ; ports lus sous un autre genre : le compte de P5.
  Le texte d'aujourd'hui (« la vérité le garde en ligne… le retirer partout casserait ces 2 pièces ») est inversé par D249.
- « Plusieurs captures d'une même facture en une lecture » : seules les phrases sur le port sont remplacées (« la vérité a raison, les trois lectures ajoutent une ligne… » et « la règle du port entre dans la consigne ou le code des captures ») par la règle D249 et le renvoi à la ligne précédente. Les mesures de la ligne (78/78, aucune en double) ne bougent pas.
Les autres cellules ne bougent pas.

## Rendre : gabarit de RESULTAT.md (G6)
Titres, avec les termes exacts attendus par le contrôle `note` : `## TEMOIN AVANT` (les tests de P3 n° 1, 2, 3, 10 et ceux de P4 qui échouent avant, avec leur sortie ; les autres, dits « passent déjà, épingles »), `## Rien ne se perd`, `## Rejeu du banc avant/après` (le mot « banc »),
et le mot `shipping` dans le corps (règle du port, entrée `shipping` de `finance.lines`). Puis les fichiers écrits, le comptage de P5, `LEÇON PROPOSÉE`, `CONNAISSANCE`, et les doutes.

## Risques
- **Argent / données existantes** : aucun fichier de `src/` ni de `functions/` n'est modifié ; une dépense déjà enregistrée n'est pas réécrite ; `finance.lines` reste telle qu'elle s'écrit aujourd'hui (test P1 n° 10).
- **Hors ligne, double clic, arrondis** : inchangés (le code ne bouge pas) et épinglés (P1 n° 8, n° 9).
- **Juge** : le filtre peut masquer une vraie omission → P3 n° 4 ; un port lu sous un autre genre décale l'alignement → P3 n° 5 et 6, `autreGenre` de P4, compte de P5 ; le total jugé comprend le port → inchangé.
- **Vérités** : suppression d'objet JSON à la main → copie `.avant-port` vérifiée, JSON relu après édition (chargement par `loadCases` dans le script de comparaison), compte des pièces et des lignes avant/après.
- **Données personnelles** : les sorties du banc et les vérités restent sous `REELS_DIR` (hors Git) ; rien n'est recopié, aucune valeur dans RESULTAT.md ni GESTES.md.
- **`banc-lecture-qr.ts`** : son verdict peut bouger sur une pièce à port (voulu, dit).
- **Écran** : les 7 fichiers d'écran ne se chargent pas dans ce poste ; cette voie ne les touche pas.

## Hors périmètre
`src/ui/**` (dont `ExpenseSheet.tsx`, `etat.ts`, `TransactionDetails.tsx`, `PieceDejaSaisie.tsx`) ; `src/services/purchaseEntry.ts` et `functions/src/invoiceScanCore.ts` (non modifiés) ; `invoicePoints.ts`, `invoiceControls.ts`, `ledger.ts`, `types.ts`, `storage.ts` ;
la consigne de lecture (`invoiceScanPrompts.ts`, `prompts.ts`) ; la TVA de la ligne de port (la TVA du document reste celle du document, épinglée par P1 n° 5) ; le critère « du port » de l'écran et le geste pour reclasser une ligne (p3c-port) ; l'affichage d'une dépense enregistrée (p3c-finances) ;
le déploiement ; tout appel Gemini.
