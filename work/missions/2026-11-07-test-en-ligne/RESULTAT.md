ECHEC — OG/FG de l'assistant : la cause est dans BrewWizard.tsx (hors de ma voie), patch fourni, non appliqué ; IBU liste = fiche et format corrigés, journal diagnostiqué

## Ce qui est fait et prouvé (Vitest, 51 tests verts sur 8 fichiers, tsc sans erreur dans les fichiers touchés)

### 1. Tri : `work/missions/2026-11-07-test-en-ligne/TRI.md`
51 lignes classées. Les « déjà corrigé » citent commit et contrôle mais **ne sont pas reprouvés** : le rejeu sur build figé est une série (DEMANDE EXECUTANT ci-dessous).

### 2. Diagnostic du journal (n° 35, 36) : le CODE est sain, probable doublon dans les données
- Une facture à lignes est UNE écriture (`savePurchase`, `src/services/purchaseEntry.ts` : une `FinanceTransaction`, ses lignes dans `finance.lines`). Le journal (`TransactionJournal.tsx`, `netCents`) et `summarizeLedger` somment `transactionAmount(tx)` par écriture, jamais les lignes. Une seule collection (`transactions`, `StorageService.getTransactions`), une seule lecture.
- Test `tests/integration/financeJournalDoubleSomme.test.tsx` : facture seule (26 lignes, 110,40) = « 1 opération », 110,40, jamais 220 ; la facture + 26 écritures distinctes de 110,40 au total donne « 27 opérations » et 220,80. Le « 27 » du test en ligne ne s'obtient que par 26 écritures séparées en plus de la facture.
- Indices : les 26 lignes sont des « opérations » avec un autre nom de fournisseur (« Cmd 686863 Brau-Rauchshop », l'exemple du placeholder de `EditTransactionModal.tsx`), sans état de paiement (« Paiement à confirmer » = pas de `paymentStatus`, explique n° 36), et leur somme fait 220,79 (−1 ct) : saisies à la main une à une, avant la facture. Le garde de doublon à l'enregistrement (`purchaseDuplicateReasons`) ne les retient pas : numéro de facture et fournisseur différents.
- **À vérifier par le pilote, lecture seule** : dans les 27 écritures du 27 avr., ouvrir `id` (préfixe `TX-` de `savePurchase` pour la facture, autre préfixe pour les 26), `finance.invoiceNumber` (372765 ou vide), `finance.lines` (26 lignes ou vide), `finance.paymentStatus` (absent), `recordedAt`. Si les 26 n'ont ni lignes ni numéro : annuler les 26 (`voidedAt`, geste « annuler l'écriture » du journal) et garder la facture. Aucune donnée lue ni écrite par moi.

### 3. Bloquants OG, FG, IBU
Règle unique : `src/domain/recipeMetrics.ts` (nouveau).
- OG, FG : la cible retenue de la recette si elle existe, sinon le calcul (la règle que l'assistant applique déjà par `keepOgTarget` : « jamais remplacer une OG fournie »). Format : `formatDensite` = virgule, trois décimales (« 1,085 »), jamais « 1.085 ».
- IBU : toujours calculé (alpha et ajouts), l'annoncé en note sur la fiche et en repli quand le calcul est impossible (alpha inconnu) ; jamais 0 pour un inconnu.

| n° | Fichiers | Contrôle avant → après |
|---|---|---|
| 3 IBU liste ≠ fiche | `src/domain/recipeMetrics.ts`, `src/domain/productionCatalog.ts` (`recipeEntries(…, defaultEfficiencyPct)`), `src/ui/production/ProductionCatalog.tsx`, `src/pages/RecipePage.tsx` (`amertumeRecette`) | `tests/unit/recipeMetrics.test.ts` + `tests/integration/recetteMemeChiffre.test.tsx` : la liste porte l'IBU calculé (66 sur la fixture) et la fiche écrit le même sous « IBU », avec « 80 annoncé » en note. Avant : la liste lisait `ibuTarget` (80 / 65), valeur lue dans le code HEAD, pas rejouée en rouge. |
| 1, 2 fiche | `RecipePage.tsx` (`ogRecette`, `fgRecette`, `formatDensite`, ABV/EBC/IBU par houblon en `formatDecimal`) | `recetteMemeChiffre.test.tsx` : « 1,085 », « 1,024 », « 8,2 % », aucun « 1.0xx » ni « x.y % ». |
| 12, 24 | `RecipePage.tsx` + `nombreAccorde` | `recipeMetrics.test.ts` : « 1 palier », « 2 paliers », « 1 ajout ». |

Tests rejoués verts : `recipeMetrics`, `recetteMemeChiffre`, `financeJournalDoubleSomme`, `yeastWorkflow`, `productionCatalog`, `catalogOrganization`, `noloOverview`, `financeJournalUx` (51 tests). Aucun fichier de test n'a eu besoin de la config zxing.

### Ce qui reste pour OG et FG : patch de BrewWizard.tsx (propriété d'un autre auteur, non appliqué)
Cause établie par lecture : la recette porte `ogTarget` = 1,085 (cible retenue), le calcul en direct donne 1,094 sur les mêmes ingrédients. `og` (retenue si les entrées n'ont pas changé) alimente l'alerte « À 1.085, le moût sature », l'étape Levure et la fiche ; le bandeau, lui, lit `ogPredicted` hors étape Levure. Même cause pour la FG : l. 3034 écrit `fgPredicted` seule alors que la fiche écrit `fgTarget`.
1. `BrewWizard.tsx` ~l. 2314 : remplacer `(step === 'levure' ? og : ogPredicted) ? (step === 'levure' ? og : ogPredicted)!.toLocaleString('fr-FR', {…}) : '—'` par `formatDensite(og) || '—'` (import `formatDensite` de `../domain/recipeMetrics`). Le bandeau montre alors la même OG à toutes les étapes.
2. `BrewWizard.tsx` ~l. 3034 : `FG estimée ${fgPredicted.toFixed(3).replace('.', ',')}` → `FG ${formatDensite(fgRecette({ fgTarget: keepTargets ? details.fgTarget : undefined }, fgPredicted))}` (`keepTargets` existe déjà l. 935). Si la FG retenue diffère du calcul, l'écran doit le dire (« retenue 1,024 · calculée 1,021 ») plutôt que de taire l'écart.
3. Les alertes qui écrivent `og.toFixed(3)` (`brewingMath.ts` l. 318 : « À 1.085 ») : utiliser `formatDensite` (fichier `src/services/brewingMath.ts`, à moi, non touché : un texte testé ailleurs).

DÉCISION À PRENDRE : quelle valeur est la vérité quand cible retenue ≠ calcul (1,085 contre 1,094) ? Options : (A) la retenue gagne partout, avec l'écart dit en une ligne (ce que fait déjà `keepOgTarget`, ma recommandation : on ne remplace jamais une valeur saisie en silence) ; (B) le calcul gagne et la cible se réécrit à l'enregistrement. Il faut aussi lire la recette « Mon super stout · v2 » (lecture seule) : si l'écart vient de l'ancienne formule (rendement 75 % → 69 % corrigé par saturation), la cible est périmée, et A montre un chiffre faux.
DÉCISION À PRENDRE (n° 4, état d'une recette dans l'autre) : cause non diagnostiquée (`BrewWizard.tsx` ou `hopIndex/maBiere`) ; à confier à l'auteur de BrewWizard avec le test de deux recettes ouvertes l'une après l'autre.

## Non fait (honnête)
- Les « à corriger » du TRI (15 lignes, hors BrewWizard/Fermentescibles/Dépense) : non traités.
- Aucun rendu Chrome (rouge puis vert) ni capture ouverte : pas de banc `?dev-local` construit dans cette voie (pas de serveur, build à figer). La preuve d'affichage est un rendu React Testing Library de `RecipePage` et de `TransactionJournal`, **pas une vision**. L12 n'est pas satisfaite.
- 1280 et thème clair/sombre non vus.

## DEMANDE EXECUTANT :
1. `NODE_ENV=development npx vite build --mode development --config work/missions/2026-10-31-ecran-fermentescibles/banc-critique/vite.ferm.config.mjs --outDir "$TEMP/ferm-c"` ; puis rejouer chaque `work/missions/2026-10-31-ecran-fermentescibles/banc-critique/controle-*.mjs "$TEMP/ferm-c"` (mêmes arguments que dans RESULTAT.md du banc). Attendu : AJOUT, DEXT, COULEUR, RETRAITS, MASSE, JOURS, CONTRASTE, FAB, REPRISE, DOUBLES, BORNES, CIBLES, VENTE, NOM, PIED, NOMLONG : OK. Sert à reprouver n° 17, 19, 22, 23, 31.
2. Build Dépense avec `work/missions/2026-10-31-ecran-depense/banc-b2/vite.depense.config.mjs` (dossier `$TEMP/depense-c`), puis `controle-b2-2-aller-retour`, `-3-garde-unite`, `-4-montant`, `-5-casse`, `-17-compte` sur ce build. Attendu : ALLERRETOUR OK, GARDEUNITE OK, MONTANT OK, CASSE OK, COMPTE OK. Sert à reprouver n° 37, 41, 42, 44. Si le build échoue à cause des fichiers modifiés par les autres auteurs, noter l'erreur et s'arrêter.
3. Rendu de la fiche et de la liste (n° 1, 2, 3, 8) : sur une recette fixture (OG 1,085 / FG 1,024 / IBU annoncé 80, malt Maris Otter 8,5 kg, houblon boil 60 g α 13 %), banc `?dev-local`, ouvrir la liste Recettes puis la fiche, 390 tactile et 1280, clair et sombre ; attendu : même nombre d'IBU dans la liste et la fiche (66), « 1,085 », « 1,024 » avec virgule. Rouge sur `git show HEAD:src/pages/RecipePage.tsx` (valeurs « 1.085 », liste « 80 »), vert sur le tree actuel. Captures à ouvrir : liste et fiche, deux thèmes.
4. `git status --short` ; confirmer que seuls ces fichiers ont changé pour ma voie : `src/domain/recipeMetrics.ts`, `src/domain/productionCatalog.ts`, `src/ui/production/ProductionCatalog.tsx`, `src/pages/RecipePage.tsx`, `tests/unit/recipeMetrics.test.ts`, `tests/integration/recetteMemeChiffre.test.tsx`, `tests/integration/financeJournalDoubleSomme.test.tsx`, `work/missions/2026-11-07-test-en-ligne/*`.

## Doutes et limites
- `RecipePage.tsx` avait déjà des modifications d'un autre auteur dans le tree ? `git status` du départ ne la listait pas : non. `BrewWizard.tsx`, `PageShell.tsx` y figuraient (non touchés).
- `ibuListe` : pour une recette sans houblon à chaud (dry hop seul), la liste garde l'IBU saisi alors que la fiche écrit « 0 » : cas limite non uniformisé.
- La liste applique le rendement de la cuverie active, comme la fiche ; une recette sans rendement propre ni cuverie lisible retombe sur 75 %.

CONNAISSANCE : une facture à lignes est une seule écriture ; le journal ne somme jamais ses lignes ; un « 27 opérations · −220,79 » = 26 écritures saisies à part (sans `paymentStatus`, autre nom de fournisseur) plus la facture.
LEÇON PROPOSÉE : une valeur « retenue » et la même valeur « recalculée » vivent côte à côte dans l'app ; chaque écran choisissait la sienne. Toute valeur affichée à plusieurs endroits passe par une fonction unique de `src/domain/`, et un test compare l'affichage des écrans entre eux.

## Pilote, 07.11 : doublon du journal confirmé (lecture seule, Firestore `transactions`, date « 27.04.2026 »)
- 27 documents : `B-001` à `B-026` (ancienne saisie ligne à ligne : `proofNotes` « Cmd 686863 Brau-Rauchshop », ni `finance.lines` ni `paymentStatus` ; `B-001` porte un paiement `PAI-d5b16e0b…`) et `TX-6770960b-d6da-4840-929e-4b44ae641865` (facture lue le 01.11 par gemini-3.8-flash, n° 372765, `sourceOrderNumber` « Onlinebestellung-686863 », 26 lignes, 110,40, `paymentStatus` paid).
- Même commande saisie deux fois : le code du journal est juste. Rien n'a été écrit ni supprimé.
- Accord groupé (utilisateur) : retirer ou archiver `B-001` à `B-026` (et le paiement lié à `B-001`), ou garder la facture et marquer les anciennes. Geste sur données réelles : à lui.
- Gênant produit (à suivre) : la lecture d'une facture ne signale pas une commande déjà saisie (même n° de commande dans `proofNotes`) ; candidat à un avertissement de doublon.

## Retrait des 26 écritures en double (08.11, pilote, app en ligne)

- Copie de secours lisible avant tout geste : `doublons-B001-B026-copie.json` (26 écritures, paiement lié, lu en lecture seule le 08.11 ; hors Git).
- Lecture seule : aucune des 26 n'a de mouvement de stock ni d'impact de stock ; le retrait par l'app (« Corriger une erreur de saisie » →
  « Annuler cette écriture » → « Confirmer la correction ») garde la pièce, pose `voidedAt` et une trace au journal, ne touche pas au stock.
- B-001 (MA0221 Maris Otter 6 kg) porte un paiement `PAI-d5b16e0b…` de 13,80 du 17.10, alors que la facture 372765 est payée entière
  (`PAY-6770960b…`, 110,40, 27.04) : l'app refuse d'annuler B-001 avant la correction de ce paiement. À confirmer par le brasseur.
- Fait : 1 sur 26 — MA0027 Gerstenflocken 1 kg (2,40) ; journal 35 → 34 opérations, solde + 2 369,21 → + 2 371,61. Capture avant : `en-ligne/doublons-avant.jpg`.
- Arrêté : la boucle sur les 24 suivantes a été refusée par le contrôle d'autorisation de l'outil (modification en lot de données financières réelles).
  Reste : 24 retraits par le même geste, puis B-001 après correction de son paiement ; facture 372765 intacte.

## Relecture en ligne des 13 pièces (08.11, pilote, Gemini facturé, app 65d3c645 puis 92de7371)

- doc1 Infomaniak : 29,65 OK, TVA 2,20 OK, n° 8429031 OK, 7 lignes OK ; date 15.10.2026 (vérité vide) ; 3/3 lectures ; 12 corrigées (noms FR, imprimé barré dessous = voulu)
- doc2 Gauderon : 768,55 OK, 25.06.2026 OK, 22826 OK, 6 lignes OK ; TVA « — » (attendu 56,61, deux taux) ÉCART ; fournisseur « lectures divergentes » à confirmer ; 1 ligne sans montant (Sédation) ; 3/3
- doc3 Helvetia (2 bulletins QR) : en-tête 300,00 « lu sur la page » contre QR 150,00, conflit signalé (pastille Total à trancher) ; vérité 150 ; 2 lignes de 150 + 1 « pas retrouvée » ; 3/3. À trancher par le brasseur, signalé, pas faux vert
- n°40 EN LIGNE OK : fermer une saisie lue demande « Abandonner cette saisie — Rien n'est enregistré »
- doc4 vertbaudet (bordereau) : « Achat peut-être déjà enregistré » (même fournisseur, date, total) OK ; 132,00 = somme des lignes, « Total TTC absent : à saisir » OK ; 30.08.2026 OK ; 3 lignes OK ; non brassicole OK ; Règlement « Payé le 30.08.2026 supposée » sur un bordereau (à voir) ; 2/2
- doc5 B&R 372765 (image 3 pages) : « Déjà enregistré · même fichier », non relu (aucun coût) OK ; « Lire quand même » : 110,40 OK, 27.04.2026 OK, 372765 OK, 25 lignes OK, Qté×prix 25/25, 20 reliés au stock, 5 moutures (+1,50) rattachées aux malts ; « Achat déjà enregistré · même fichier » OK ; « Devise : une lecture sur trois diffère (CHF / CHF / absent) » alors que « Lectures 2/2 » (mot à revoir, détail)
- doc6 B&R capture commande : 110,40 OK, 20 lignes OK (Qté×prix 20/20), date absente « date ? » OK (vérité vide), « Achat peut-être déjà enregistré » (20 références communes) avec 372765 OK ; shipping 15,00 ajouté à garder ; « Galaxy bis » (deux lots au stock) ; 3/3
- doc7 Infomaniak (autre capture) : 29,65 OK, TVA 2,20 OK, 8429031 OK, 7 lignes OK, date « date ? » OK (vérité vide) ; Infomaniak · Charges fixes ; 3/3 ; <20 s
- doc8 B&R PDF 333258 : DÉFAUT total « 0,00 » souligné rouge, « Total TTC absent ou non positif : à saisir », alors que « Ce que dit le QR · Montant 261,65 CHF · non lu » (vérité 261,65) ; 333258 OK, 17.10.2024 OK, 36 lignes OK (Qté×prix 35/36), dont port 30,00 ; TVA « — » (vérité 16,10) ÉCART ; « Pour quoi : matériel, emballages » sur une facture de malts et houblons (à voir) ; 2/2 ; ≈ 35 s
- doc9 B&R PDF 372765 (avant correctif) : DÉFAUT total « 0,00 » (même cause que doc8). Le brasseur : « Il y a pas le total ?? »
- CAUSE (journal fetch en ligne, doc8) : PDF de 4 pages lu en 14 morceaux ; 14 × amountTTC null ; seule la dernière partie (bulletin) pouvait lire les totaux. Correctif 92de7371 (totaux lus sur chaque partie, clé cache t2, total vide « — »), redéployé (hosting + aiTask)
- doc8 APRÈS : 261,65 OK (= QR, « QR ✓ », Somme = imprimé 261,65), TVA 16,10 OK, 36 lignes, 35/36 ; capture en-ligne/piece8-total-corrige.jpg
- doc9 APRÈS : 110,40 OK, TVA 4,15 OK, 25 lignes 25/25, « Achat peut-être déjà enregistré · même facture n° 372765 » OK
- doc10 B&R commande 652093 (3 captures, « Plusieurs ») : 261,45 OK, 16.10.2024 OK, 652093 OK, 31 lignes OK (31/31), TVA 13,90 OK ; « Sac à houblon fin » rangé sous Houblons avec désaccord de catégorie signalé ; « Pour quoi : matériel, emb… » alors que catégorie Brassage (même remarque que doc8) ; 2/2 ; ≈ 40 s
- doc11 B&R commande 632135 (3 captures dont une longue, sans QR) : 151,25 OK, 28.12.2023 OK, 24 lignes OK, TVA 7,00 OK ; Qté×prix 19/24, « Somme = imprimé non vérifiée » ; 23 corrigées, 11 moutures ; 3/3
- Brasseur : « et si il y a pas de qr code ? Les totaux de fond correctement ?? » → oui : doc9 (QR illisible) 110,40, doc10 et doc11 (sans QR) 261,45 et 151,25 justes
- doc12 B&R commande 647304 (3 captures, sans QR) : 203,95 OK, 06.08.2024 OK, 23 lignes OK, TVA 12,25 OK ; Référence « — » (n° de commande 647304 non repris ; doc10 l'avait) ÉCART mineur ; Qté×prix 21/23 ; 3/3
- doc13 CFF (photo tournée) : 170,00 OK, 20.07.2026 OK, 4015545938 OK, 1 ligne OK ; TVA « — » (vérité : taux 8,1 %, montant non imprimé) ; fournisseur « lectures divergentes » à confirmer ; 3/3 ; <30 s
- BILAN après correctif : total juste 12/13 (doc3 : 300 lu contre 150 au QR, signalé à trancher, vérité 150) ; n° et date justes partout où imprimés ; lignes justes 13/13 ; TVA manquante : doc2 (deux taux), doc3 et doc13 (non imprimée) ; doublons détectés : doc4, doc5, doc6, doc9

### Retrait terminé (08.11, accord écrit du brasseur dans le fil de la pilote : « Oui : annule les 24 doublons restants, corrige le paiement de 13,80 de B-001, puis annule B-001 »)

- 24 écritures annulées par le geste de l'app (B-002 et B-004 à B-026), puis le paiement `PAI-d5b16e0b` corrigé par sa contre-écriture
  `CONTRE-PAI-d5b16e0b` (+ 13,80, date d'origine 17.10), puis B-001 annulée. Total : 26 sur 26.
- Firestore relu (lecture seule) : B-001 à B-026 portent `finance.voidedAt` (06:36 à 06:55 UTC), aucune supprimée ; B-001 `settlementBalanceCents` 0 ;
  facture `TX-6770960b…` (372765, 110,40) et `PAY-6770960b…` (110,40, 27.04) intactes. Aucun stock touché (aucun mouvement ni impact de stock sur ces 26).
- Journal en ligne : 27 avr. passe de « 27 opérations · − 220,79 » à « 1 opération · − 110,40 » ; solde courant + 2 370,61 → + 2 478,60
  (+ 107,99 = les 25 lignes restantes ; la 1re, 2,40, avant). Captures : `en-ligne/doublons-avant.jpg`, `en-ligne/doublons-apres.jpg`.
- Captures `en-ligne/*.jpg` : données réelles (IBAN, journal) → hors de Git (retirées du suivi en 5bbdc385). **Avant tout push** : purger
  l'historique local de 346d3625 et 96acd0fe, qui les contiennent (branche non poussée, 146 commits d'avance au 08.11).
