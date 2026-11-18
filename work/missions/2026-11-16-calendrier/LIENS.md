# Calendrier global : sources, architecture et liens (16.11)

Demande : « Peut être une session qui lié toutes les autres actions à ce calendrier global ? » (16.11). Conception seule, rien codé.
Base lue : tag `en-ligne/2026-11-16-finances` (b8b3b678), par `git show` et `git grep`. Inventaire antérieur repris et corrigé :
`…/infallible-grothendieck-129ed4/work/missions/2026-11-15-besoins/inventaire/INVENTAIRE.md` (fûts et matériel ont gagné des dates depuis).
Stockage : les collections métier vivent dans Firestore avec cache IndexedDB persistant (`firestoreRepo.ts` l.40 : « remplace Dexie »).
Dexie ne garde que des tables annexes (houblons, scénarios, enrichissement, file des justificatifs) : aucune date du calendrier.

## 1. Inventaire : ce qui porte une date ou une durée

Formats mêlés : `JJ.MM.AAAA` (S), ISO `AAAA-MM-JJ` (I), mois `AAAA-MM` (M), millisecondes (ms), texte libre (T). `''` ou absent = inconnu.

| # | Élément | Collection | Champs de date ou de durée | Écrit par |
|---|---|---|---|---|
| 1 | Brassin prévu | `batches` | `plannedBrewDate` (S ; `''` = à définir) ; `status` = `planifie` | `planRecipeBatch`, `saveBatchSchedule` (transaction) |
| 2 | Brassin brassé (jour J) | `batches` | `brewDate` (S), `brewDay.startedAt`, `finishedAt`, `pitchedAt`, `boilStartedAt` (ms) | compagnon du jour J → `updateBatch` |
| 3 | Phases : primaire, repos, garde, refermentation | `batches.recipeSnapshot` | `fermentation[].days`, `kind` ; aucune date de fin stockée ; `status` sans date de passage | recette figée au lancement ; `statusOptions` |
| 4 | Dry hop, ajouts en cuve | `batches` | phase `ajout` (`note`), houblon `dryHop`, `brewDay.additions[].doneAt` (ms) | recette ; compagnon |
| 5 | Conditionnement | `batches` | `bottlingDate` (T, souvent vide) ; `status` = `conditionne` | fiche du brassin |
| 6 | Starter de levure | `batches.yeastPreparation` | `startAt`, `targetPitchAt`, `steps[].dueAt` (I) ; `status` planned/cancelled | préparation de levure |
| 7 | Lot de levure | `stockItems` (lot biologique) | `expiresOn`, `manufacturedOn` (I) | fiche levure |
| 8 | Densités | `batches.gravityLog` | `date` (S) : journal passé | fiche du brassin |
| 9 | Fûts | `kegs` | `fillDate`, `deliveryDate` (S) ; `historique[]` {`date`, `quoi` : lave, rempli, livre, retour-vide, retour-plein} | `updateKeg` |
| 10 | Factures, dépenses, ventes | `transactions` | `date` (S), `finance.dueDate`, `recordedAt`, `voidedAt` | `addTransaction`, `updateTransaction`, scan |
| 11 | Paiements | `financialPayments` (immuable) | `date`, `recordedAt` ; contre-écriture `reversalOfId` | synchro financière (`financialLedgerSync`) |
| 12 | Prévisions Finances | `financialPlans` | `date` (I), `recurrence` {monthly, quarterly, yearly ; `endDate`}, `status`, `source` (manual, recurring, brew, equipment, tax) | `financeService` |
| 13 | À venir (achats, matériel) | `financialPlans.upgrade` | `timing` soon/next/later, `datePrecision` month/day, `inServiceMonth` (M), `stage` | `upgradeRing`, `upgradeForecast` |
| 14 | Immobilisations | `financialAssets` | `acquisitionDate`, `inServiceDate`, `disposedDate` | Finances |
| 15 | Caisse d'ouverture, clôtures | `financialProfiles`, `financialClosings` | `openingCash.date`, `createdAt` | Finances |
| 16 | Budget de l'Excel | `budgetLines` | `months[12]` | import |
| 17 | Besoin et manque de stock | `stockItems` + `batches` | `minStock` ; `disponibilite.ts` : le manque vient d'un brassin planifié (date = sa `plannedBrewDate`) | calcul pur, aucun stockage |
| 18 | Mouvements de stock | `movements` (immuable) | `timestamp`, `createdAt` | `adjustInventory`, déstockage du brassin, factures |
| 19 | Entretien du matériel | `equipment` | `lastDone` (I), `rhythm` {every ; jour, semaine, mois, brassin}, `brokenSince`, `history[].date`, `retired.date`, `purchaseDate` ; `nextDueAfter` | `updateEquipment` |
| 20 | Tâches et notes de l'Atelier | `creativeItems` | `date` (S ou `''` = poche sans date), `status` todo/done, `type` (event, equipment…) | `TodoTimeline.onCreate`, Atelier |
| 21 | Planning Gantt | `planning` | `startDate`, `endDate`, `isMilestone`, `completed` | `getPlanning` : aucun écran, aucune intention du + |
| 22 | Clients, livraisons | `clients` (sans date) ; ventes dans `transactions` | `ClientStats.lastOrder` calculé ; livraison d'un fût = `kegs.deliveryDate` | calcul ; fût |
| 23 | Rappels du compagnon | aucun stockage | `brewAlarms` : minuteurs du jour J, notification push (`services/brewAlarms.ts`) | compagnon |
| 24 | Échéances fiscales | aucune donnée | texte en dur dans `DashboardTab.tsx` l.95-116 (« 31 mars », « Contrôle bisannuel ») | code |
| 25 | `reservations`, `finishedGoods` | déclarées dans `BUSINESS_COLLECTIONS` | aucun lecteur daté trouvé par `git grep` : à vérifier | ? |
| — | Journal d'audit, recettes (`archivedAt`) | `auditLogs`, `recipes` | horodatage de journal | hors calendrier |

### Ce qui manque et devrait être daté
- **M1 Fenêtre, jours actifs, mise de côté** (f1, f1r) : un achat, une rénovation, une activité sans budget ont un jour ou un mois, jamais
  « semaines 20 à 40, 5 jours actifs, 600 CHF ». Champs optionnels sur `financialPlans` (argent) et `creativeItems` (activité).
- **M2 Dates réelles des étapes du brassin** : passer en garde ou conditionner n'écrit aucune date. Sans elles, la fin de garde se
  calcule depuis la recette et dérive du vrai. Proposé : `etapes: {statut, date}[]` sur `Batch`, écrit par la transition.
- **M3 Allonger une phase** : la recette est figée dans le brassin (`recipeSnapshot`). Allonger la garde ne doit pas la réécrire.
  Proposé : `ajustementsPhases: {kind, jours}[]` sur `Batch`.
- **M4 Retour de fût attendu** : `deliveryDate` existe, pas le retour. Règle : délai habituel par client, appris des `historique`, sinon inconnu.
- **M5 `bottlingDate` en texte libre** : la normaliser en `S` à la lecture ; la projection marque « date illisible », jamais un jour deviné.
- **M6 Échéances fiscales en données** : `source: 'tax'` existe dans le type et n'est jamais produit. TVA, clôture, METAS (ce dernier par `equipment.rhythm`).
- **M7 Rupture datée du nettoyage** : le manque d'un ingrédient se date par le brassin qui le crée ; Star San et soude n'ont pas de
  consommation par geste, donc aucune date de rupture. Dépend de la mission Simplicité (C7).
- **M8 Commande client à livrer** : aucune vente future n'existe hors des prévisions manuelles.

## 2. État de l'art (L29)

| Problème type | Méthodes examinées | Décision |
|---|---|---|
| Agréger des événements de plusieurs sources dans une vue (projection en lecture, CQRS « read model ») | (a) collection matérialisée `calendarEvents`, écrite par chaque écrivain ou par trigger Cloud Functions ; (b) fonction pure calculée sur le cache local, mémoïsée par collection ; (c) index incrémental | **(b)**. Mesure ci-dessous : 3 à 10 ms. (a) duplique la vérité, dérive, et un trigger ne tourne pas hors ligne. (c) seulement si la mesure sur téléphone dépasse le budget |
| Récurrence RFC 5545 (RRULE, EXDATE, UNTIL, COUNT) | Existant : `planOccurrences` (`forecast.ts` l.66 : mois, trimestre, an, `endDate`, fin de mois ancrée). npm, lu le 16.11 : `rrule` 2.8.1 (dernière publication 11.2023, objets `Date`) ; `rrule-temporal` 2.2.9 (publiée le 13.11.2026, Temporal, 474 kB non compressé) ; `ical.js` 2.2.1 (08.2025, parseur iCalendar complet, 1,2 Mo) | Pas de bibliothèque aujourd'hui : `planOccurrences` couvre toutes les règles existantes, et la caisse en dépend (une seule maison des occurrences). Une règle neuve s'écrit en chaîne RRULE (sous-ensemble FREQ, INTERVAL, UNTIL). Le premier besoin hors de ce sous-ensemble (EXDATE « sauté ce mois », BYDAY, export `.ics`) fait adopter `rrule-temporal`, derrière `planOccurrences`, avec un test différentiel. **C6** |
| Récurrence relative au dernier geste (« tous les 3 mois depuis le dernier détartrage », « tous les 10 brassins ») | Hors RFC 5545 : c'est la récurrence « à partir de l'achèvement » des gestionnaires de tâches | Garder `nextDueAfter` (`equipment/schedule.ts`). L'unité « brassin » se projette en date par la cadence de brassage prévue, marquée « estimé » |
| Fenêtre contre instant (intervalle ou point) | Algèbre d'intervalles d'Allen ; intervalles semi-ouverts `[début, fin)` ; dates civiles (`PlainDate`) contre instants (ms) ; arbre d'intervalles | Chaque élément porte `debut`, `fin` (égale à `debut` pour un instant) et une `precision` (jour, semaine, mois, inconnue). Toutes les dates sont civiles en Europe/Zurich, par `breweryDay` (`functions/src/batchSchedule`). La requête de vue est un chevauchement `debut <= finVue && fin >= debutVue` sur une liste triée. Un arbre d'intervalles est inutile sous 10⁵ éléments (mesure) |
| Semaine ISO 8601 (lundi ; la semaine 1 contient le 4 janvier) | À la main (piège des 52 ou 53 semaines) ; `date-fns` 4.4.0 (publiée 05.2026, importable fonction par fonction) ; Temporal (`temporal-polyfill` 1.0.8) | `date-fns` : `getISOWeek`, `startOfISOWeek`, `addWeeks`. Absent de `package.json` aujourd'hui : ajout à valider au build (poids du paquet) |
| Dates inconnues ou approchées | — | Jamais 0 ni jour deviné : une `precision` « mois » s'étale sur le mois ; un élément sans date va dans la poche « sans date » (déjà dans `TodoTimeline`) |

## 3. Architecture proposée

**3.1 Projection en lecture.** Un module pur `src/domain/calendrier/` qui n'écrit rien et ne stocke rien.
- Un lecteur par source (`lireBrassins`, `lireFuts`, `lireFactures`, `lirePrevisions`, `lireMateriel`, `lireTaches`, `lireStock`), chacun testé
  sur fixture. Chacun rend des `ElementCalendrier` : `cle` (`collection/id#partie`), `genre`, `debut`, `fin`, `precision`,
  `etat` (prévu, en cours, fait, en retard, annulé), `montantCents` (null si inconnu), `origine` {collection, id, champ}, `gestes` permis,
  `calcule` (vrai pour une fin de phase, une échéance d'entretien, une rupture : on ne déplace pas un calcul, on déplace sa cause).
- Les lecteurs réutilisent les calculs existants, sans les refaire : `plannedBrewDate` et `breweryDay`, `planOccurrences`, `buildForecast`
  (la caisse), `nextDueAfter`, `disponibilite.ts` (le manque), `fermenterConflict` (cuve occupée), `upgradeForecast`.
- Assemblage : `projeter(sources, fenetre, maintenant)`, puis tri et seaux par semaine ISO. La mémoïsation se fait par identité du
  tableau de chaque collection (`StorageService.subscribe`) : seul le lecteur de la collection changée se relance.
- Les filtres (brassage, événement, achat, activité, fût, argent…) se déduisent du `genre`. Rien de neuf n'est stocké.

**3.2 Ce qui s'écrit depuis le calendrier.** Jamais dans la projection. Chaque geste passe par la porte du propriétaire de la donnée (table du §4).
- Un port `gestesCalendrier.ts` aiguille `deplacer`, `allonger`, `clore` et `creer` vers la porte existante. Il refuse ce qui est interdit :
  brassin commencé, paiement immuable, élément calculé.
- Avant d'écrire : la projection est rejouée sur les sources modifiées en mémoire, et l'aperçu montre les conséquences (§3.4).
  Après : « Annuler », par le patch inverse, et une ligne `logAction`.
- État d'écriture : `documentWriteState` (en file, en attente, refusé) s'affiche sur l'élément, sans réécriture automatique.

**3.3 Hors ligne.**
- Les lectures viennent du cache IndexedDB de Firestore. La projection, pure, marche sans réseau ; les écritures simples partent en file du SDK.
- Exception : `saveBatchSchedule` passe par `runTransaction`, qui exige le serveur. Hors ligne, déplacer un brassin échoue aujourd'hui (**C5**).
- Argent : `transactions` et `financialPayments` passent par la synchro financière, dont le cache a un âge maximal de 30 jours
  (`FINANCIAL_CACHE_MAX_AGE`). Au-delà, la couche caisse affiche « à rafraîchir », jamais 0.

**3.4 Effets en cascade (axe Simplicité, SPEC 15.11 : « ça a des conséquences sur tout… être générique »).**
- Règle générale : une action du domaine déclare ses effets (`effets(action) → Effet[]` : mouvement de stock, état de fût, compteur
  d'usage du matériel, sortie de caisse, date d'échéance).
- Le calendrier n'écrit aucun effet. Il les montre en aperçu, par une projection rejouée : « déplacer L-014 au 12.03 → manque de Citra
  daté du 12.03, cuve en conflit avec L-012, 180 CHF passent en mars ».
- Les effets réels (le lavage d'un fût consomme du produit de nettoyage) appartiennent à la mission Simplicité. Leur maison doit être
  une table de règles « geste → article, quantité » (**C7**). Le calendrier les lit dans `movements`.

**3.5 Coût, mesuré.** Banc jetable (scratchpad `bench-projection.mjs`, Node 24, PC du poste) : assemblage, déroulé des récurrences, tri et
seaux par semaine, sur des données simulées.

| Volume | Événements | À froid | Vue d'un an, médiane / p95 | Vue de cinq ans, médiane |
|---|---|---|---|---|
| ×1 (5 ans d'une micro-brasserie) | 5 590 | 3,3 ms | 0,9 / 1,3 ms | 2,0 ms |
| ×4 | 22 302 | 10,2 ms | 3,2 / 4,9 ms | 8,6 ms |

Sur téléphone, compter trois à cinq fois plus (estimé, non mesuré). Le calcul tient sur le fil principal, sans worker ni serveur.
C'est le rendu qui coûte : ne monter que les semaines visibles. `buildForecast` reste à chronométrer sur les vraies données avant de l'appeler à chaque geste (L20).

## 4. Liens : action → calendrier

| Action (où elle naît aujourd'hui) | Effet sur le calendrier | Geste dans le calendrier | Porte d'écriture |
|---|---|---|---|
| Planifier un brassin (Recettes, + `newBatch`) | crée un brassage, ses phases calculées, le manque daté, la cuve occupée | glisser le jour | `saveBatchSchedule` |
| Démarrer le jour J (compagnon) | brassage « en cours » ; minuteurs du jour seulement | ouvrir le compagnon | `updateBatch` (brewDay) |
| Ajouter la levure (`pitchedAt`) | clôt le jour J ; ouvre la primaire, datée du vrai | — | compagnon |
| Passer en garde ou conditionner | clôt une phase, ouvre la suivante (M2) | toucher « fait » sur la phase | transition de statut + `etapes` (C4) |
| Allonger la garde, décaler le dry hop | déplace la fin calculée et les phases suivantes | étirer la phase | `ajustementsPhases` (C3) |
| Préparer un starter | crée ses étapes (`dueAt`) avant l'ensemencement | glisser l'ensemencement visé | `yeastPreparation` (Batch) |
| Remplir un fût | crée « plein depuis » | — | `updateKeg` |
| Livrer un fût | crée la livraison et le retour attendu (M4) | glisser la livraison | `updateKeg` |
| Retour, lavage d'un fût | clôt le retour ; lavage fait (+ produit consommé, C7) | toucher « lavé » | `updateKeg` (historique) |
| Saisir ou scanner une facture | crée la dépense ; l'échéance si `dueDate` | glisser l'échéance | `updateTransaction` (`dueDate` seul) |
| Payer | clôt l'échéance, met à jour la caisse | toucher « payé » → feuille paiement | `financialPayments` (immuable ; annuler = contre-écriture) |
| Prévision récurrente (loyer) | crée les occurrences | glisser la série ; « sauter ce mois » attend EXDATE (C6) | `financeService` |
| Projet d'achat (À venir) | crée la fenêtre, la mise de côté, l'effet sur la caisse | étirer la fenêtre, déplacer le paiement | `financeService` (+ M1) |
| Facture reliée au projet | clôt le projet ; le prévu devient réel | — | lien existant (Devis ↔ besoin) |
| Activité sans budget (sol, prospection) | crée une fenêtre et ses jours actifs | + flottant « activité » ; étirer | `creativeItems` (+ M1) |
| Tâche de l'Atelier | crée la perle datée ou la poche « sans date » | glisser ; toucher « fait » | `creativeItems` (`date`, `status`) |
| Entretien fait (Matériel) | clôt l'échéance, crée la suivante (`nextDueAfter`) | toucher « fait » | `updateEquipment` (`lastDone`, `history`) |
| Panne signalée | crée « en panne depuis » ; la cuve est indisponible pour les brassins | — | `updateEquipment` (`brokenSince`) |
| Stock sous le seuil ou manque | crée l'alerte au jour du brassin qui l'ouvre | toucher → À commander | aucune (calcul) |
| Lot de levure qui expire | crée l'échéance `expiresOn` | — | fiche levure |
| Clôture, TVA | crée l'échéance fiscale (M6) | toucher → Finances | `financialPlans` `tax` |

Le + flottant du calendrier : brassin, activité, achat, tâche, livraison. `fabActions.ts` n'a pas d'intention `newPlanning` « tant que
l'écran n'existe pas » : la créer avec l'onglet.

## 5. Décisions lourdes pour le conseil
- **C1** Projection calculée (recommandée) ou collection `calendarEvents`. Réversible.
- **C2** Maison des activités sans budget : champs optionnels sur `creativeItems` (recommandé : c'est déjà la frise des tâches), ou
  `planning` (GanttTask, sans écran). Garder `planning` tel quel : le retirer demande son accord.
- **C3** Allonger une phase sans toucher la recette figée : `ajustementsPhases` sur `Batch`. Touche le modèle de brassage ([[modele-brassage]]).
- **C4** Dater les transitions de statut (`etapes`) : migration douce, les anciens brassins restent « date inconnue ».
- **C5** Déplacer un brassin hors ligne : écriture simple avec contrôle au retour du réseau, ou refus affiché. Recommandé : refus
  affiché en premier ; la cave n'a pas de réseau.
- **C6** Format RRULE pour toute récurrence neuve ; `rrule-temporal` au premier besoin hors sous-ensemble.
- **C7** Table générique « geste → consommation » (Simplicité) : décide si le calendrier peut dater une rupture de nettoyage.
- **C8** Échéances fiscales en données : chaque date légale demande une source citée (AFC, canton de Fribourg).
- Au brasseur, en mini maquettes : la place de l'onglet, déjà notée dans SPEC le 16.11. Rien ici ne la tranche.
