# Inventaire code — modules et liens (16.11, lecture seule, chemins sous src/)

Navigation : 5 onglets `TabType` (ui/BottomNav : dashboard, finances, production, stocks, clients ; components/BottomNav.tsx:4).
Sous-vues : Production = batches|recipes|lab|scaler (tabs/ProductionTab.tsx:34) ; Stocks = stock|courses|futs|materiel|hops (tabs/StocksTab.tsx:61) ;
Finances = overview|journal|forecast(timeline|projects)|annual (tabs/FinancesTab.tsx:47,65). Pas de page « Calendrier » ni « Carnet » à part.
Collections Firestore : transactions, stockItems, equipment, kegs, movements, batches, finishedGoods, reservations, recipes, clients, planning, budgetLines,
tarifs, creativeItems, expenseTemplates, auditLogs, config, hop*, yeastProducts, financial{Plans,Assets,Closings,Payments,Profiles,Archives} (functions/src/dataSchema.ts:2).

## Entités (types/index.ts sauf mention)
- Transaction (l.13) : date DD.MM.YYYY, amountHT/TTC, tva, category, proofUrl, stockImpact[] ; `finance` (domain/finance/types.ts) : cents, lines[] (stockItemRef, equipmentRef, assetId),
  vendor, invoiceNumber, dueDate, paymentStatus, planId, occurrenceId, batchId, refundOfId, proofDocumentId. Créée par : ui/finance/ExpenseSheet.tsx, InvoiceSheet, QuickActionModal (vente/dépense/scan), receiptService (vente).
- FinancialPlan (finance/types.ts) : date, amountCents, direction, category, source manual|recurring|brew|equipment|tax, recurrence, vendor, batchId, brewEstimate, upgrade (EquipmentUpgrade : stage idée→devis→prêt, devis, sourceCreativeItemId).
  Prévisions = domain/finance/forecast.ts ; projets matériel = ui/finance/UpgradeWorkspace.tsx.
- FinancialPayment (date, direction, method, transactionId), FinancialAsset (equipmentRef, transactionId, lineId, amortissement), Closing, Archive, Profile.
- StockItem (l.43) : currentStock, minStock, reorder, supplier (texte libre), pricePerUnit, alphaPct, fiche catalogue, nomsFacture, yeastLot. Créé : ui/StockDetailSheet, domain/stock/articleNeuf.ts, depuis une facture (services/purchaseEntry.ts:401).
- EquipmentItem (l.112) : state, purchaseDate, purchasePrice, maintenance (texte), notes. UI : ui/EquipmentSheet.tsx, EquipmentList.tsx. Pas de date d'entretien structurée ni de rappel.
- KegItem (l.126) : state lavage|propre|plein|livre, batchRef, fillDate, clientName (texte). UI : ui/KegBoard.tsx, KegSheet.tsx ; règle domain/stock/futs.ts:59.
- Recipe (l.458) / RecipeSnapshot : ingrédients avec stockItemRef, eau, levure. UI : pages/BrewWizard.tsx, RecipePage.tsx, ProductionTab.
- Batch (l.646) : plannedBrewDate, brewDate, bottlingDate, status planifie|fermentation|garde|conditionne|termine|annule, recipeRef, recipeSnapshot, packaging.kegIds,
  stockConsumption, gravityLog, notesCreation/BrewDay/Tasting, brewDay. Créé : QuickActionModal 'brew-batch', BrewWizard. Détail : ui/BatchDetailSheet.tsx.
- Client (l.721) : contact, phone, email, notes ; stats CALCULÉES (services/clientStats.ts). Pas de vente liée par id.
- CreativeItem (l.897) = « Labo créatif » : type equipment|recipe-idea|event|pricing-test|prospect, status idea→done, estimatedCost, targetPrice, date, contactName/Phone. UI : components/CreativeLabTab.tsx, ui/CreativeItemSheet.tsx.
- GanttTask (l.745) / `planning` : cost, startDate, endDate, isMilestone, completed ; lu par storage.getPlanning ; seulement transmis au Dashboard (props `planning`), pas d'écran d'édition trouvé.
- BudgetLine (l.767, 12 mois), PricingItem/tarifs (ui/TarifSheet.tsx), ExpenseTemplate (fournisseur type), AuditLog, finishedGoods/reservations (collections ; peu d'usage UI).
- Fournisseur : AUCUNE entité ; chaîne libre `supplier` (stock) / `vendor` (finance). Suggestions dérivées : services/suggestions.ts (VendorSuggestion depuis transactions).
- Notes : champs texte sur Batch (3 notes), Client.notes, Equipment.notes, Keg.notes, CreativeItem.notes, proofNotes. Pas de module « notes » ni « carnet » dédié ;
  « carnet » = liste des brassins (ui/BrewJournal.tsx, Batch.archivedAt).

## Liens DÉJÀ codés
1. Facture -> Stock : lignes avec stockItemRef, stockImpact, mouvements `receipt` (services/storage.ts:576-594, purchaseEntry.ts) ; annulation = receipt-reversal ; création d'article depuis la ligne.
2. Facture -> Matériel/amortissement : ligne equipmentRef + FinancialAsset (ExpenseSheet.tsx:777, 999 ; financeService.saveAsset).
3. Brassin -> Stock : consommation à la mise en route (domain/finance/brewStockConsumption.ts, Batch.stockConsumption) ; réservations en attente (domain/stockLevel.ts:335 pendingStockSummary).
4. Recette/Brassin -> Compta : estimation de coût + achats nécessaires (domain/finance/brewBudget.ts, ui/finance/BrewBudgetSheet.tsx, FinancialPlan.brewEstimate/batchId) ; coût des brassins dans FinancesTab:178 ; prix pondérés depuis les factures.
5. Stock -> Courses : articlesACommander(items, batches) groupé par supplier (StocksTab.tsx:257) + copie texte ; pas de lien vers dépense/plan ni fournisseur-entité.
6. Matériel/Labo -> Prévisions : CreativeItem equipment -> FinancialPlan.upgrade via mergeUpgradePlans (domain/finance/upgrades.ts:25, sourceCreativeItemId) ; « Projets matériel » dans Finances ; Stocks>matériel ouvre ces projets (App.tsx:1015).
7. Labo -> Recettes : onDraftRecipe(idée -> assistant de recette) (CreativeLabTab.tsx:165) ; idée -> client (prospect, nextClientId, CreativeLabTab:176-192).
8. FAB / palette : « Nouvelle idée » (App.tsx:549) ouvre Production>lab + createRequest ; « Nouveau brassin », « Nouvelle recette », « Nouvel article », dépense/vente rapide.
9. Tableau de bord -> brassin, stock, finances, labo (onOpenBatch, onNavigateTab, onNavigateToCreativeLab ; DashboardTab.tsx:149 : « événements » = CreativeItem type event, compteur pendingTodosCount App.tsx:441).
10. Finances -> Stock/Recette : onOpenStockItem, onOpenRecipe (App.tsx:975, ~980) ; ProofUploadNotice -> Finances (App.tsx:921) ; QuickAction onOpenExpense (App.tsx:1081).
11. Brassin -> Fût : packaging.kegIds, Keg.batchRef/beerName ; fermenterConflict (domain/batchFermenter.ts:20) = deux brassins dans la même cuve ; dates : domain/batchSchedule.ts.
12. Client <-> Ventes : rattachement par NOM dans proofNotes/description des recettes (clientStats.ts:21), fût livré par clientName texte ; vente comptoir (receiptService.ts:199).
13. Tout -> Journal d'audit (AuditLog par catégorie) ; exports/Drive (financeExport, driveService, taxArchive).

## Absences / liens manquants (constats, pas des décisions)
- Pas d'onglet calendrier : les dates vivent dans 6 endroits sans vue commune (Batch.plannedBrewDate/bottlingDate, dueDate facture, FinancialPlan.date, CreativeItem.date, GanttTask, upgrade date).
  domain/fermentationPlanning.ts et domain/finance/forecast.ts font de la projection locale. `planning`/GanttTask : sans écran propre.
- Pas de « + » contextuel qui crée une idée/tâche depuis une autre section (seul le FAB « Nouvelle idée » y arrive, sans préremplir le contexte).
- Fournisseur non relié : supplier/vendor en texte ; Courses ne crée ni commande ni plan de dépense.
- Entretien matériel : texte libre `maintenance`, aucune échéance ni lien au calendrier ou à une dépense.
- Fût/Client/Vente : liens par nom, pas par id ; pas de commande client ni de livraison planifiée.
- Facture à échéance (finance.dueDate) : pas affichée comme tâche ; Brassin planifié -> pas de plan de trésorerie auto sauf estimation enregistrée.
- Notes de brassin non reliées à la fermentation (gravityLog) ni au journal de dégustation.
