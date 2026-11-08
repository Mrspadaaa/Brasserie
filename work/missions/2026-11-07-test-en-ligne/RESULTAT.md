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
