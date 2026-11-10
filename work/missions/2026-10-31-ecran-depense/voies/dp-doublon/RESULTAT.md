OK — 5 corrections du critique appliquées ; DOUBLON OK (46 contrôles), « Frais de port » retiré de la fixture

## Reprise après le critique (01.11) : ce qui a changé
1. Titre « Même commande 7001, autre total » (n° avant ; était « Même commande, autre total : 7001 »).
2. Ligne Date de la même commande : `+2 j` en mono, à côté de la date lue, comme `+0,25` à côté du total (signé : ce document moins la dépense
   enregistrée ; `aria-label` « 2 jours d'écart ») ; la cellule « Déjà au registre » ne porte plus que la date. Plus de « 2 j d'é… » coupé à 390.
   Vaut aussi pour le cas « autre numéro » existant (même tableau).
3. Au rang 0 (« Même fichier déjà joint »), après « Lire quand même » : titre et nom de la région « Achat déjà enregistré · même fichier » ;
   les autres rangs gardent « Achat peut-être déjà enregistré » (jus0Journey inchangé).
4. `PieceDejaSaisie` : chaque ligne garde son libellé (`line.description`, comme la fiche : « Citra T90 100 g ») ; le nom de l'article de stock
   reste dans les pastilles « Lié au stock ». À `lg` : grille 440 px + reste ; la carte à gauche, « Ses N lignes » dépliées dans la colonne de
   droite (`aside`), le repli « Ses N lignes » caché. Au téléphone : inchangé (repli dans la carte).
5. Banc : la lecture simulée du même fichier dit 12.10.2026 et « à payer » (`paymentEvidence: 'unpaid'`), comme la fixture.
- En plus, ta consigne « Total seulement » : la fixture du banc n'a plus de ligne « Frais de port » (deux lignes, total 312,40 inchangé).
  Les lectures simulées gardent leur ligne de port (la règle de lecture est à toi) : elle se voit dans le ticket lu à 1280-3 et 1280-4, sous
  « Lignes de la facture », pas dans la carte ni dans la dépense enregistrée.
- Fichiers touchés dans cette reprise : `src/ui/finance/ExpenseSheet.tsx` (sections de doublon), `src/ui/finance/PieceDejaSaisie.tsx`,
  `tests/unit/depense/doublon/feuille.test.tsx`, `capturer-doublon.mjs`. Pas touchés : `purchaseEntry.ts`, `purchasePrefill.ts`,
  `geminiScanner.ts`, `QuickActionModal.tsx`, `App.tsx`. Avant chaque édition, copie dans le dossier temporaire du système ; rien remis à HEAD.

## Banc : contrôles ajoutés
« lignes visibles, libellé de la fiche » (2 lignes, `^Maris Otter 25 kg`, `^Citra T90 100 g`, aucune ligne de port) ; à 1280, « vide à droite de
la carte et des lignes ≤ 300 px » (mesuré : 13 px) ; titre certain au rang 0 ; « Document lu » = 12.10.2026 ; « Même commande 7001, autre total » ;
ligne Date entière (`+2 j`, aucun « … » ni « j d'écart », aucune cellule qui déborde). L'étape 3 bis du pilote (« Ouvrir la dépense ») est jouée.

## Sorties décisives (rejouées après la reprise)
- `npx tsc --noEmit -p . && echo TYPES OK` → **TYPES OK**
- `npx vitest run tests/unit/depense/doublon tests/unit/purchaseEntry.test.ts tests/unit/depense/enregistrement tests/integration/expenseSheet.test.tsx --maxWorkers=2 && echo TESTS DOUBLON OK`
  → 10 fichiers, 134 passed, **TESTS DOUBLON OK**. En plus : `tests/unit/depense` + `tests/integration/jus0Journey.test.tsx` → 66 fichiers, 1103 passed.
- `npm run build` → code 0 ; md5 `source4-portable-bundle-manifest-01.json` 21dd75b385b5684dab6c57b160816447 avant et après.
- Banc Chrome (`node scripts/with_server.mjs --server "npm run dev -- --port 5631 --strictPort" --port 5631 --env VITE_FIREBASE_API_KEY=fake -- node work/missions/2026-10-31-ecran-depense/voies/dp-doublon/capturer-doublon.mjs`)
  → **DOUBLON OK (46 contrôles)**, code 0, 390 tactile et 1280, étape 3 bis comprise ; 0 requête aiTask sur tout le banc (`captures/console.log`).
- Témoin sur HEAD : pas rejoué dans cette reprise (fonctions de doublon inchangées) ; première passe : 15 failed | 3 passed, code 1 (attendu 1).

## Captures rouvertes (L12)
`captures/390-2-detail-ouvert.png` (« Maris Otter 25 kg », « Citra T90 100 g », pas de port), `390-3-lire-quand-meme.png` (« Achat déjà
enregistré · même fichier », Date 12.10.2026 des deux côtés, Règlement « À payer »), `390-4-meme-commande.png` (« Même commande 7001, autre
total », « 14.10.2026 +2 j », « 312,65 CHF +0,25 », rien de coupé), `1280-1-repos.png` et `1280-2-detail-ouvert.png` (carte à gauche, lignes à
droite, pied « Ouvrir la dépense »), `1280-3-lire-quand-meme.png`, `1280-4-meme-commande.png` (grille lecture, aucun vide > 300 px).
Le bandeau « … Réessaie. » (390-3, 390-4) est la connexion Drive du banc (Google bloqué), hors voie.

Prédiction : « Là je vois tout de suite que c'est déjà rentré, et sur quoi : Maris Otter, Citra, à payer ; et la commande 7001, 25 centimes de plus. »

## Première passe (rappel)
`purchaseEntry.ts` : `purchaseSameFile`, `purchaseLinks`, `purchaseSameOrder` (même fournisseur + même n° de commande, 60 jours, totaux
différents admis, page sans n° de facture admise ; rien sans n° de commande). `ExpenseSheet.tsx` : le même fichier est trouvé avant
`scanDocument`, carte certaine sans lecture, « Lire quand même », `LienDepense` dans les deux sections, prop `onOpenExpense` (branchée par le pilote).
Tests neufs : `tests/unit/depense/doublon/regles.test.ts` (11), `feuille.test.tsx` (7). Audit des saisies : PASSED (653 usages).

## Non fait, à savoir
- `controle-choix.mjs` non joué : l'écran « dépense » n'a pas d'entrée dans `ecrans.json`.
- Les tests unitaires `regles.test.ts` gardent une ligne « Frais de port » dans leur dépense fictive (règles de doublon, rien d'affiché).

DÉCISION À PRENDRE : aucune (« Ouvrir la dépense » est branché par le pilote).

CONNAISSANCE : sous `?dev-local`, un banc Chrome pose ses fixtures par `import('/src/services/firestoreRepo.ts')` puis `FirestoreRepo.put`
(cache mémoire seul) et remplace `GeminiScannerService.scanDocument` par `import('/src/services/geminiScanner.ts')` : même instance de module que
l'app. Un filtre réseau sur « aiTask » se limite aux fetch/xhr et aux adresses externes (un module source au nom proche casse sinon le chargement).

LEÇON PROPOSÉE : un script témoin qui remet des fichiers à HEAD vérifie sa copie de sûreté avant de toucher quoi que ce soit, et ne pose son
`trap` qu'après (01.11 : chemin temporaire vide, deux sources remises à HEAD sans retour, travail refait). Corollaire de cette reprise : dans un
heredoc passé à node par l'outil Bash, une barre inverse peut disparaître (`\s` devenu `s`) ; une regex écrite par script se relit avant usage.

## Pilote (01.11, après la reprise)
- Fixture recalée : la dépense enregistrée faisait 60 + 30 pour un total de 312,40 (un « Frais de port » de 222,40 comblait l'écart, absurde). Maintenant 60 + 30 = 90,00 ; la page de commande 90,25 (Citra 30,25), écart +0,25 inchangé. Contrôles du banc mis aux nouveaux montants ; `DOUBLON OK (46 contrôles)` rejoué par le pilote, captures 390-2, 390-3, 1280-4 rouvertes.
- Rejeu du pilote : TYPES OK, TESTS DOUBLON OK (10 fichiers, 134 tests), build code 0, md5 du manifeste 21dd75b3… avant et après.
