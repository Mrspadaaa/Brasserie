OK — TA2, TA3, TA4, TA6 corrigés dans le calcul : tests d'abord rouges puis verts (163), build vert

Voie t1-onglets, mission 2026-10-31-ecran-depense. Plan : `PLAN.md` (§ 6 bis = corrections après `REVUE-PLAN.md`, REVUE OK).

## TEMOIN AVANT :
Les 4 fichiers de `tests/unit/depense/onglets/` lancés avant toute ligne de code (sortie filtrée complète : `temoin-avant.txt`) :
`Test Files 4 failed (4) · Tests 25 failed | 10 passed (35)`. Les échecs sont ceux des sondes du diagnostic :
- TA3, sonde A : `AssertionError: expected +0 to be 5000` (Synthèse 0 contre Prévisions 5 000) ; vente future `+0 to be 30000` ; partielle `+0 to be 25000` ; avoir `+0 to be 2000`.
- TA4, sondes B et E : `expected [ { id: 'invoice:E-vente', …} ] to deeply equal []` (la vente sans échéance est placée dans `items`) ; `fc.undated` absent (`undefined`).
- TA6, sonde F : `expected [ {…}, {…}, {…}, …(9) ] to deeply equal []` (les trois achats de brassage donnent 12 lignes de tendance) ; `expected [ 'brassage', 'chargesFixes' ] to deeply equal [ 'chargesFixes' ]`.
- TA2 : `Toutes les dates3 opérationsArchives …` ne correspond pas à `/2 opérations \+ 1 annulée/` (le compteur dit 3).
Les 10 qui passaient avant sont les non-régressions (calcul d'avant conservé sans l'option, trésorerie, bilan annuel, cas vide, charges fixes, plan de brassin, compteur sans annulée).
Base des tests existants avant correction : 14 fichiers, 128 tests verts (31.10, 19:06).

## Par défaut : ce qui est fait et son test
- **TA2** (`TransactionJournal.tsx`, la chaîne du compteur seulement) : `2 opérations + 1 annulée` ; `1 annulée` seul si aucune active (filtre « annulées ») ; texte d'avant sans annulée ; périmètre « courantes » inchangé (l'annulée n'y est pas listée). Les annulées restent listées. Test : `ta2-compteur.test.tsx` (6).
- **TA3** (`ledger.ts`) : `summarizeLedger(…, asOf, { includeScheduled })`, faux par défaut. Avec l'option, le reste à payer/encaisser d'une pièce active, datée après `asOf`, `unpaid` ou `partial`, entre dans `payablesCents`, `receivablesCents` et `outstanding`, après les contrôles de montant et d'avoir (avertissement, rien d'ajouté). Trésorerie, totaux de période, `cashComplete`, `unknownPaymentCount` et avertissements de trésorerie ne bougent pas. Test : `ta3-a-payer.test.ts` (10), dont l'identité `Synthèse = Σ factures de la prévision + pièces sans échéance`, et le bilan annuel inchangé.
- **TA4** (`forecast.ts`, ligne « échéance à préciser », comptée à part) : une pièce à payer ou à encaisser sans échéance valide (absente ou invalide) quitte `items` et les mois ; elle va dans `FinanceForecast.undated` (`id`, `label`, `amountCents` = reste, `direction`, `category`, `pieceDate`, `planId`, `unconfirmed`) avec `undatedInCents` et `undatedOutCents`. Aucune date inventée. Échéance passée : toujours due aujourd'hui. Une pièce sans échéance liée à un plan ne remplace plus l'occurrence du plan (le plan reste dans le mois, avertissement). L'avertissement donne le montant. Écran : une ligne visible dans `FinanceForecastSummary.tsx`, « Échéance à préciser : N pièces · X CHF à payer · Y CHF à encaisser » (0 pièce : pas de ligne). Test : `ta4-sans-echeance.test.ts` (12).
- **TA6** (`forecast.ts`) : `TREND_CATEGORIES = ['chargesFixes']` ; la tendance ne projette que ces catégories ; une ligne d'avertissement « Achats de brassage non projetés (irréguliers). » dit ce qui est écarté. Test : `ta6-tendance.test.ts` (7).

## Les appelants (grep) et ce que chacun affiche après
| Fonction | Appelant | Après |
|---|---|---|
| `summarizeLedger` + option | `FinancesTab.tsx:76` (seul à passer `{ includeScheduled: true }`) | Synthèse : « à payer / à encaisser » et « Règlements à suivre » comptent aussi les pièces datées plus tard ; trésorerie inchangée |
| | `DashboardTab.tsx:155,157`, `annual.ts:141` (puis `fribourgTax.ts`, `financeExport.ts`), `assistantContext.ts:60,173`, `forecast.ts:54` | inchangés (défaut `false`) ; une dette datée après la clôture reste hors du bilan |
| `buildForecast` (`undated`, tendance filtrée) | `FinancesTab.tsx:89,90,183` | « Factures à régler » et « Entrées prévues » sans les pièces sans échéance ; ligne « Échéance à préciser » ; tendance seulement pour les charges fixes ; solde estimé du premier mois plus haut des sorties sans échéance |
| | `assistantContext.ts:95` | échéances à 30/90 jours sans ces pièces ; ses avertissements « Échéance à préciser » restent ; `undated` n'est pas transmis à l'assistant (fichier hors Possède) |
| compteur du journal | `FinancesTab` (onglet Opérations) | `2 opérations + 1 annulée` |
Écart nommé de l'identité Synthèse/Prévisions : une pièce à échéance hors de l'horizon de 12 mois compte dans la Synthèse et pas dans les mois ; une pièce à date invalide est hors Synthèse (`ledger.ts:109`) mais dans la prévision.

## Fichiers écrits
`src/domain/finance/ledger.ts`, `src/domain/finance/forecast.ts`, `src/ui/finance/TransactionJournal.tsx`, `src/ui/finance/FinanceForecastSummary.tsx`, `src/components/tabs/FinancesTab.tsx` (ligne 76 : l'option ; ligne 183 : trois props pour la ligne « Échéance à préciser », seul conduit possible), `tests/unit/finance.test.ts` (3 achats en `chargesFixes`), `tests/integration/financeWorkspace.test.tsx` (`dueDate` dans `tx()`), `tests/integration/equipmentProjects.test.tsx` (`dueDate` de la facture BILL ; cas « unpaid » saisi par formulaire : attendu déplacé vers la prévision entière du plan et la ligne « Échéance à préciser »), `tests/ux-mobile/financePeriodDrilldown.test.tsx` (`dueDate: today`), `tests/unit/depense/onglets/{fixtures.ts,ta2-compteur.test.tsx,ta3-a-payer.test.ts,ta4-sans-echeance.test.ts,ta6-tendance.test.ts}`, dans la voie : `PLAN.md`, `temoin-avant.txt`, `vitest.drill.config.ts`, `tsconfig.mes-fichiers.json`, `RESULTAT.md`. Autres fichiers du Possède lus, non modifiés : `financeForecast.test.ts`, `forecastHorizon.test.ts`, `dashboardNavigation`, `financeArchives`, `fix114`, `mobileDailyViews` (verts sans changement).

## Critères
- G1 `npm run build` : `✓ built in 27.54s`.
- G2 : `TESTS ONGLETS OK` (18 fichiers, 163 tests). Rejeu supplémentaire sans changement : `financeAssistantContext`, `financePaymentSync`, `equipmentUpgrades`, `financeQuickActions` (4 fichiers, 44 tests verts).
- G3 : `REVUE OK (bloquant 2, majeur 7, détail 9)` (les 18 constats triés « corrigée » par le pilote ; PLAN § 6 bis).
- G4 : voir la ligne du pilote ; les quatre mots sont dans ce fichier.
Essais : un seul tour de correction par critère (2 tests d'intégration à ajuster, 2 regex du compteur à restreindre à l'en-tête). Un arrêt d'une minute du build venait d'une autre voie (`financeDocuments.ts` en cours d'écriture) ; rejoué dès qu'il a compilé.

## Rien ne se perd :
Aucun champ Firestore ajouté, lu autrement ou retiré (`dueDate`, `paymentStatus`, `planId` gardent leur sens ; `undated`, `undatedInCents`, `undatedOutCents` n'existent que dans le résultat du calcul, jamais écrits). Le défaut de `summarizeLedger` est celui d'avant : bilan annuel, clôture fiscale, tableau de bord, assistant inchangés (tests `fribourgTax`, `financeArchiveContinuity`, `financeRefunds`, `ta3` verts). Une dépense enregistrée avant la correction reste lisible et juste : une ancienne pièce sans `finance` n'entre ni dans les mois ni dans `undated` (testé) ; une pièce sans échéance reste visible, à part, avec son montant, au lieu de disparaître. Centimes entiers (sommes d'entiers). Hors ligne : calculs purs en mémoire. Pas de Gemini, pas de donnée réelle, pas de commit.

## Doutes et limites (à lire)
1. **Solde estimé plus optimiste** (TA4) : une dette sans échéance quitte les mois, donc le solde du premier mois monte de son montant (visible dans `equipmentProjects` : 3 200 devient 4 000 après exclusion du projet). La ligne « Échéance à préciser » dit le montant ; `undatedOutCents` permet à l'écran futur d'écrire « solde moins X à préciser ». Règle du pilote, réversible.
2. **Bandeau « Prévision incomplète »** : l'avertissement TA6 (« Achats de … non projetés ») s'ajoute à `warnings` ; l'écran affiche donc « Prévision incomplète » / « Sorties renseignées » (`FinanceForecastSummary.tsx:20`) dès que du brassage est écarté. À trancher dans les variantes.
3. **Pastille « Toutes »** du journal : son compte lu par lecteur d'écran (`3 opérations` pour 2 actives + 1 annulée) garde la liste affichée (annulées comprises) ; seul le compteur d'en-tête est corrigé.
4. **Pièce `unknown` liée à un plan** : placée par la prévision (montant réservé, `unconfirmed`), absente de la Synthèse, qui ne connaît pas les plans. Écart voulu, nommé.
5. **`tests/ux-mobile/financePeriodDrilldown.test.tsx` n'est pas dans l'`include` de `vitest.config.ts`** : G2 ne le lance jamais. Rejoué à part (`vitest.drill.config.ts`) : 2 tests sur 3 verts ; le premier échoue avec ou sans la `dueDate` ajoutée (`259,25` reçu contre `216,75` attendu) parce que ses dates sont relatives à aujourd'hui (31.10 : le « plan de septembre » à J+2 tombe dans le mois de la facture à J+18). Attribué au calendrier et non à mon changement ; non prouvé sur HEAD (aucun stash, aucun commit permis).
6. **Assistant financier** : `trackedPayablesCents` reste « à la date du jour » et ne reçoit pas `undated` (`assistantContext.ts` hors Possède).
7. **Catégorie lue par ligne contre `tx.category`** (`forecast.ts:100-102` contre `FinancesTab.tsx:84`) : signalé, non corrigé.
8. **Aucune capture** : la ligne « Échéance à préciser » (une `<p class="finance-notice">`, classe existante `finance.css`) est testée par le DOM (texte et montants), pas regardée sur un rendu. À voir par le pilote avant de la montrer.

DÉCISION À PRENDRE : la ligne « Échéance à préciser » en `finance-notice` suffit-elle jusqu'aux variantes ? Options : la garder telle quelle (recommandée, minimale) ou la rendre cliquable vers le filtre « Sans échéance » du journal (n'existe pas : interface, hors voie).

CONNAISSANCE : `summarizeLedger` dit « à une date » (bilan, clôture) ; l'avenir ne s'y ajoute que par l'option `includeScheduled`, posée par l'écran Finances seul. Les pièces sans échéance se lisent dans `buildForecast().undated`, jamais dans les mois. `tests/ux-mobile/` n'est pas dans l'`include` de vitest.

LEÇON PROPOSÉE : un test hors `include` de `vitest.config.ts` passe sans bruit quand on le nomme dans un CHECK (« No test files » est ignoré avec d'autres fichiers) : vérifier qu'un test cité par un critère est réellement collecté.
