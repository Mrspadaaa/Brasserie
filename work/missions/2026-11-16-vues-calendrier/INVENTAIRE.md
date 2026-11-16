# Inventaire des vues et actions de l'app (16.11, lecteur Sonnet)
Sources : `src/App.tsx`, `src/components/BottomNav.tsx` (5 onglets), `src/components/tabs/*Tab.tsx`, `src/domain/fabActions.ts`, `src/pages/useFullScreenRoute.ts`,
`work/refonte-frontend/v4/choix/ecrans.json` (houblons) et `ecrans-app.json` (app), `work/missions/2026-11-16-calendrier/LIENS.md` (L) et `fb9/MANQUES.md` (M).
Demande : le calendrier devient global ; des actions s'y adaptent, des vues peuvent être modifiées ou retirées, Finances en « mode finance ». Aucune décision ici.
Choix : « choisi » = maquette du brasseur (règle n° 1) ; « aucun » = aucune ligne dans les registres : toucher exige de lui montrer des variantes (L24).

## Structure de navigation
- Barre du bas (`BottomNav.tsx` l.32-36) : Bord, Finances, Brassins, Stocks (pastille seuil), Clients. Aucun onglet Calendrier ni Planning.
- En-tête (`Header.tsx`) : retour Bord, période globale (Tout, mois, trimestres, exercice), Recherche ⌘K (`ui/CommandPalette.tsx`), Menu, Réglages (`components/SettingsModal.tsx`).
- + flottant (`fabActions.ts`, `ui/FloatingActions.tsx`) : une intention par onglet ou sous-onglet ; `newPlanning` volontairement absente « tant que l'écran n'existe pas » (L §4).
- Pages plein écran (`Route`, `pages/useFullScreenRoute.ts` l.27-46) : recipe, brewday, wizard, hopV55 et couches hopBeer, Suggest, Compare, Timing, Substitute, Search.
- Saisie rapide (`components/QuickActionModal.tsx`) : menu, lire un justificatif, matching stock, dépense, vente, préparer un brassin.
- Autres : `ui/BrewerChat.tsx`, `BrewerActivity.tsx`, `BrewerNotifications.tsx`, `BrewerBudget.tsx`, `ui/finance/ProofUploadNotice.tsx`, `ui/NouvelleVersion.tsx`, `components/LoginPage.tsx`.

## 1. Finances (onglet `finances`, `components/tabs/FinancesTab.tsx`, `ui/finance/`)
Choix : dépense = `ouvert` (r2b, z2b, u4b ; r2b provisoire, `ecrans-app.json`) ; le reste aucun.
- Synthèse (`overview`, `FinanceOverview.tsx`) : situation, caisse, seuil TVA ; part Coûts (`CostComposition.tsx`, mois par `MonthStepper`). Chiffré, daté par période.
- Opérations (`journal`, `TransactionJournal.tsx`, `TransactionRow.tsx`, `TransactionDetails.tsx`) : journal daté ; actions éditer (`components/EditTransactionModal.tsx`), annuler (contre-écriture), archiver (`ArchiveManagerSheet.tsx`), pièce (`DocumentProofLink.tsx`).
- Prévisions (`forecast`) : frise `FinanceForecastSummary.tsx`, horizon 30 j / 90 j / 12 mois, récurrences (`planOccurrences`) ; part Projets (`UpgradeWorkspace.tsx`, `UpgradeSheet.tsx`) : achats à venir, fenêtre, mise de côté.
- Annuel (`annual`, `TaxWorkspace.tsx`, `TaxClosingSheet.tsx`) : clôture, versions de l'année, immobilisations.
- Saisie : `ExpenseSheet`, `InvoiceSheet`, `InvoiceScanReview`, `MovementSheet`, `FinanceForms`, `BrewBudgetSheet`, `BrewBudgetDialog`, `CreativePricing`, `FinanceAssistant`, solde et caisse d'ouverture (bouton « Solde et paramètres financiers »).
- Écran Dépense et scan (`ui/depense/` : Ticket, Recap, Verdict, RelireFin…) : scanner, relire, valider ; données date, `dueDate`, montants, TVA.
- Lien calendrier : factures (`dueDate`), paiements, prévisions, À venir, immobilisations, échéances fiscales = sources 10 à 16 de L §1. « Mode finance » = filtre argent du calendrier : caisse prévue, à payer, retards.
- Candidat à adapter : Prévisions (frise) et Projets recouvrent le calendrier ; Synthèse, Opérations, Annuel restent des vues de chiffres.

## 2. Brassins, recettes et fermentation (onglet `production`, `tabs/ProductionTab.tsx`)
Sous-onglets : `batches`, `recipes`, `lab`, `scaler`. + : Nouveau brassin, Nouvelle recette, Nouvelle idée, Saisie rapide.
- Brassins (`batches` ; `ui/BatchDetailSheet.tsx`, `BrewSheet.tsx`, `BrewJournal.tsx`) : liste par statut ; dates `plannedBrewDate`, `brewDate`, `bottlingDate`, densités ; actions planifier (`planRecipeBatch`, `saveBatchSchedule`), ouvrir le jour J, changer de statut (`domain/batchTransitions.ts`), conditionner.
- Jour J (route `brewday`, `pages/BrewDayPage.tsx`) : compagnon, minuteurs (`services/brewAlarms.ts`), additions `doneAt`, `pitchedAt`. Choix : aucun.
- Fermentation : `ui/FermentationWorkshop.tsx`, `FermentationTemperatureChart.tsx`, `FermentationScenarioPanel.tsx` ; phases `domain/fermentationTimeline.ts`, `fermentationPlanning.ts`, `fermenterPlanning.ts`, conflit de cuve `batchFermenter.ts`.
- Levure : `ui/etapeLevure/*` (choisi : l5b, s5a, c6b, s7a), panneaux `Yeast*`, starter `yeastPreparation` (`startAt`, `steps[].dueAt`).
- Recettes (`recipes`, route `recipe`, `pages/RecipePage.tsx`) : fiche, dupliquer, supprimer, brasser, export (`RecipeTextExport.tsx`), import (`RecipeImportSheet.tsx`). Chiffré, sans date propre.
- Assistant recette (route `wizard`, `pages/BrewWizard.tsx`) : étapes Houblons (choisi, `ecrans.json` etape-houblons), Fermentescibles (choisi s1), Identité (choisi r4-a), Eau (`WaterRadar.tsx`, `SaltSolver.tsx`), Levure.
- Houblons (couches `hopV55`, `ui/hopV55/`) : Ma bière (choisi), Suggérer (choisi q2b), Comparer (choisi cmc2k), Moment, Remplacer, Chercher ; pas de date.
- Atelier R&D (`lab`, `components/CreativeLabTab.tsx`) : sections Matériel, Bières, Tarifs, Contacts, À faire ; voir §4.
- Adapter les volumes (`scaler`) : calcul pur, sans date. Choix : aucun.
- Lien calendrier : sources 1 à 6 et 8 de L §1 (brassage, phases, dry hop, conditionnement, starter) ; gestes déplacer, allonger (C3), « fait » (M2, C4). Le calendrier ouvre `brewday` ou `BatchDetailSheet`, ne les remplace pas.

## 3. Besoins, achats et fournisseurs (`stocks`, sous-onglet `courses`)
- Courses (`tabs/StocksTab.tsx`, `domain/disponibilite.ts`, `domain/brewingStockAvailability.ts`) : manques dérivés des brassins planifiés ; action « Copier la liste de courses » (`copyShoppingList`). Choix : aucun.
- Données : `minStock`, manque daté par `plannedBrewDate` (L #17, calcul pur) ; fournisseurs et devis dans Finances (`ExpenseSheet`, lien Devis et besoin).
- Prix : veille de prix tous les 3 jours et carnet d'achats (M « Carnet et liens », SPEC 16.11).
- Lien calendrier : alerte au jour du brassin qui ouvre le manque ; achat posé = fenêtre dans À venir (§1) ; M7 : rupture de nettoyage non datable (C7).
- Candidat à adapter : Courses lisibles « par date de besoin » ; achats à venir (Projets) et besoins dans la même frise.

## 4. Atelier, matériel et entretien (`stocks` sous-onglet `materiel`, et `lab` section Matériel)
- Matériel (`ui/EquipmentList.tsx`, `EquipmentSheet.tsx`, `domain/equipment/schedule.ts`) : nouveau matériel, entretien fait (`lastDone`, `history`), panne (`brokenSince`), retirer ; données `rhythm`, `nextDueAfter`, `purchaseDate`.
- Brew system : `BrewSystemSource.tsx`, `BrewSystemCalibration.tsx`, `BrewEquipmentSummary.tsx`, `BrewhouseSettings.tsx`, `BrewThermalControl.tsx` ; `BrewAlarmSettings.tsx` (rappels du jour J).
- Atelier R&D (`CreativeLabTab.tsx`) : Matériel = `UpgradeWorkspace` (même composant que Finances/Projets) ; À faire = frise de tâches (`creativeItems` : `date`, `status`).
- Planning Gantt (collection `planning`, `getPlanning`) : stocké, aucun écran, aucune intention du + (L #21).
- Échéances réglementaires (`tabs/DashboardTab.tsx` l.88-113) : OFDF, TVA trimestrielle, SAAV, METAS, clôture ; texte en dur (L #24, M6).
- Choix : aucun pour ce groupe (hors levure et identité).
- Lien calendrier : sources 19, 20, 21, 24 ; gestes « fait » (recrée `nextDueAfter`), panne = cuve indisponible, glisser une tâche.

## 5. Stock et fûts (`stocks` : `stock`, `futs`, `hops`)
- Articles (`stock` ; `StockRow.tsx`, `SwipeRow.tsx`, `StockDetailSheet.tsx`, `InventoryCorrectionSheet.tsx`, `LevelGauge.tsx`) : niveau, seuil, ajustement (`movements`), lot de levure `expiresOn`. + Nouvel article.
- Houblons (`hops` ; `ui/hopIndex/`, `MaltDetails.tsx`, `ui/fermentescibles/`) : catalogue de variétés ; + Nouvelle variété. Catalogue hors choix.
- Fûts (`futs` ; `KegBoard.tsx`, `KegSheet.tsx`) : plein, livré, retour-vide, lavé ; dates `fillDate`, `deliveryDate`, `historique[]`. + Nouveau fût.
- Lien calendrier : sources 7, 9, 17, 18 ; retour de fût attendu à créer (M4) ; lavage consomme du produit (C7).
- Candidat : état des fûts en filtre « fûts » du calendrier ; la pastille de seuil de l'onglet Stocks reste.

## 6. Ventes et clients (onglet `clients`, `tabs/ClientsTab.tsx`)
Sous-onglets : `crm` (Clients), `ofdf` (Impôt sur la bière), `tarifs` (Prix et marges). + : Nouveau client, Saisie rapide, Nouveau tarif.
- Clients (`components/EditClientModal.tsx`, `ui/clients.css`) : fiche, historique, `lastOrder` calculé ; ventes = `transactions` (`InvoiceSheet`, QuickAction vente). Aucune commande future (M8).
- Impôt sur la bière (`ofdf`) : calcul depuis les brassins ; échéance OFDF en dur (§4).
- Prix et marges (`ui/TarifSheet.tsx`, `ui/finance/CreativePricing.tsx`) : chiffré, sans date.
- Choix : aucun. Lien calendrier : livraison d'un fût (`deliveryDate`), commande à livrer (M8), vente prévue (prévision manuelle), échéance de paiement client.

## 7. Accueil, menu, recherche et réglages
- Bord (`tabs/DashboardTab.tsx`) : tableau de bord, cartes d'échéances (ofdf, tva, saav, metas, fiscale), accès rapides (`onNavigateTab`). + Nouvelle écriture. Choix : aucun.
  Candidat : rangée « Maintenant / aujourd'hui » de fb9 (dû, en retard, 3 au plus) ; sa place est un choix du brasseur (SPEC 16.11).
- Recherche (`ui/CommandPalette.tsx`, `App.tsx` l.700-760) : recettes, brassins, stocks, clients, transactions ; à étendre aux éléments du calendrier (M).
- Période globale (`Header.tsx` l.42-50 ; `hidePeriod` sur Finances et Atelier) : filtre l'app ; à relier à la fenêtre du calendrier.
- Menu et Réglages (`SettingsModal.tsx`, `ui/BackupPanel.tsx`, `DriveStoragePanel.tsx`, `PersistenceStatus.tsx`, `AuditLogModal.tsx`, `CloudConfigModal.tsx`) : sauvegarde, Drive, journal d'audit, entreprise.
- Assistants : `BrewerChat`, `BrewerActivity`, `BrewerNotifications`, `BrewerBudget` ; rappels push (`brewAlarms`).
- Hors ligne (L §3.3) : `saveBatchSchedule` exige le serveur (C5) ; caisse limitée à 30 jours de cache.

## Synthèse pour la conception (non tranchée)
- Déjà datées et chiffrées : Finances (§1), Brassins (§2), Fûts (§5), Matériel (§4). Sources du calendrier : L §1 (25 lignes) ; liens action vers calendrier : L §4 (21).
- Vues qui chevauchent le calendrier : Prévisions et Projets (Finances), À faire et Matériel (Atelier R&D), cartes d'échéances (Bord), Courses par date, liste des brassins planifiés.
- Actions à rediriger : planifier un brassin, glisser une livraison de fût, entretien fait, payer, créer échéance ou tâche ; créer `newPlanning` avec l'onglet (L §4).
- Vues sans calendrier : Recettes, assistant recette et Houblons (choisis, intouchables), Scaler, Clients (CRM), Tarifs, Réglages.
- Manques notés (M) : aujourd'hui, retard, fait, rappels, conflits, récurrence, épingler, trier, rechercher, vue liste, hors ligne.
- Aucun choix du brasseur sur Finances, Atelier, Bord, Stocks, Clients : tout retrait ou refonte passe par des mini maquettes (règle n° 1, L24).
