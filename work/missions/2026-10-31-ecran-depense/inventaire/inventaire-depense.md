# Inventaire i1 — « Nouvelle dépense » et onglets des finances (état actuel, fixtures)

Source : captures `captures/*.png` (lues une à une), `src/ui/finance/ExpenseSheet.tsx`, `InvoiceScanReview.tsx`,
`src/components/tabs/FinancesTab.tsx`, `src/ui/finance/TransactionJournal.tsx`, `FinanceOverview.tsx`, `FinanceForecastSummary.tsx`.
Fixture : `fixtures/lecture-simulee.json` (2 articles, « disputed », total TTC 108,1 à confirmer, date de livraison absente).
Captures : 390 × 844 et 1280 × 800, serveur 5621, `?dev-local`, aiTask simulée, hors localhost coupé.

## Note sur les onglets demandés

Le brief parle d'onglets « Entrées », « Prévision », « Tout ». Dans le code et les captures, ces libellés n'existent pas comme onglets :
- Onglets de la page Finances : **Synthèse**, **Opérations**, **Prévisions**, **Annuel** (`FinancesTab.tsx:46`, titre `:156`).
- « Tout » est un filtre de portée dans Opérations : **Courantes / Archives / Tout** (`TransactionJournal.tsx:278`).
- « Entrées » n'apparaît que comme ligne de prévision « Entrées prévues » (`FinanceForecastSummary.tsx:29`) et comme série de graphique (`FinanceComparisonChart.tsx:42`). Aucun onglet « Entrées ».
- Ce qui a été capturé : Synthèse, Opérations (filtre Tout), Prévisions. Annuel : non capturé, non atteint.

## Éléments visibles — page Finances (390 et 1280)

| Élément (libellé visible) | Composant | fichier:ligne | Capture |
|---|---|---|---|
| Onglets Synthèse / Opérations / Prévisions / Annuel | FinancesTab | FinancesTab.tsx:46 | fin-*-390, fin-*-1280 |
| Titre de vue « Situation financière » / « Mes opérations » / « Anticiper les dépenses » | FinancesTab | FinancesTab.tsx:156 | fin-synthese, fin-operations-tout, fin-previsions |
| Trésorerie « Solde de départ à renseigner » / « À compléter » | FinanceOverview | FinanceOverview.tsx:32 | fin-synthese-390/1280 |
| « Vérifier le solde de départ » | FinanceOverview | FinanceOverview.tsx:32 (bloc « Pour une situation fiable ») | fin-synthese |
| « Règlements à suivre » · « Tout voir » · « Aucune facture suivie ne reste à régler » | FinanceOverview | FinanceOverview.tsx:55 | fin-synthese |
| « Origine et limites des montants » (replié) | FinanceOverview | non relu (nom seul) | fin-synthese |
| « Comprendre mes dépenses · Compagnon brasseur » | non relu | non localisé | fin-synthese |
| Filtres Courantes / Archives / Tout | TransactionJournal | TransactionJournal.tsx:278 | fin-operations-tout |
| Chips Toutes 0 / À payer 0 / À encaisser 0 / À compléter 0 (à 1280 ; à 390 « À e… » coupé) | TransactionJournal | TransactionJournal.tsx (chips de statut, lignes proches de :278) | fin-operations-tout |
| Recherche « Libellé, tiers, montant… » | TransactionJournal | TransactionJournal.tsx:269 | fin-operations-tout |
| Sélecteur « Toutes catégories » | TransactionJournal | non relu | fin-operations-tout |
| Sélecteur de mois « octobre 2026 » et « Toutes les dates » | non relu | non localisé | fin-operations-tout |
| « Autres filtres » (replié) | TransactionJournal | TransactionJournal.tsx:299 | fin-operations-tout |
| « Aucune opération enregistrée » + « Enregistre un achat ou une vente… » | TransactionJournal | TransactionJournal.tsx:322 | fin-operations-tout |
| « Apport ou prélèvement privé » (lien) | TransactionJournal | TransactionJournal.tsx:329 | fin-operations-tout |
| « Vérifier mes opérations · Compagnon brasseur » | non relu | non localisé | fin-operations-tout |
| Sous-onglets Échéances / Projets de matériel | non relu | non localisé | fin-previsions |
| Fenêtre 30 jours / 90 jours / 12 mois | non relu | non localisé | fin-previsions |
| « Prévision incomplète » + lignes montants (Factures à régler, Budgets et estimations, Sorties renseignées, Entrées prévues, Solde estimé « À compléter ») | FinanceForecastSummary | FinanceForecastSummary.tsx:29 (« Entrées prévues ») | fin-previsions |
| « Renseigner le solde de départ » · « Voir les limites de cette prévision (2) » · « Ajouter une prévision » · « Budget d’un brassin » · « Comparer les mois » | non relu | non localisé | fin-previsions |
| « Toutes mes prévisions (0) » · « Prévoir mes prochains paiements » | non relu | non localisé | fin-previsions |
| Barre de navigation basse Bord / Finances / Brassins / Stocks / Clients, bouton + | App shell | non relu | toutes |

## Éléments visibles — « Nouvelle dépense » (ExpenseSheet.tsx)

Fiche : `ModalShell` (`ExpenseSheet.tsx:200`), en-tête, corps défilant, pied fixe. À 390 : feuille en bas d'écran ; à 1280 : modale centrée.

| Élément | Composant / ligne | Capture / état |
|---|---|---|
| Titre « Nouvelle dépense » (ou « Acheter du matériel » si intent équipement) | ExpenseSheet.tsx:202 | vide, lu, erreur |
| Bouton × « Fermer » | ExpenseSheet.tsx:203 | toutes |
| Bandeau d'erreur (« Service IA momentanément indisponible. ») | ExpenseSheet.tsx:207 (`error`) | depense-erreur-390 |
| Zone Drive « Autorise une fois le Drive… » + « Connecter Drive » + « La connexion Google ne peut pas être préparée. Réessaie. » | DriveConnection.tsx (non relu) ; appelé ExpenseSheet.tsx:209 | lu, erreur (émulateur driveAuthorization absent : ERR_CONNECTION_REFUSED) |
| Bouton « Joindre un justificatif » (état vide) | ExpenseSheet.tsx:213 | depense-vide |
| Zone de dépôt « Choisir le document » / « Photographier le ticket » (tactile seulement) / « PDF ou image, ou dépose le fichier ici » / « Saisir sans justificatif » | ExpenseSheet.tsx:215-223 | non capturé (état affiché seulement si showForm faux à l'ouverture avec startWithScan) |
| Champ caché « Importer un justificatif » (sélecteur de fichier) | ExpenseSheet.tsx:211 | utilisé par la capture (uploadFile) |
| Bloc « Justificatif prêt · V5-C2-390.png » + « Changer » | ExpenseSheet.tsx:224-227 | depense-erreur-390 |
| Bloc « Lecture et vérification… » (busy) | ExpenseSheet.tsx:226 | non capturé (trop bref) |
| Carte de lecture « Facture · 2 articles · Fournisseur Fixture SA · Lecture à confirmer » (replié) | InvoiceScanReview.tsx:35-39 (compact) appelé ExpenseSheet.tsx:230 | depense-lu-390, depense-lu-1280 |
| Titres de statut : Lecture vérifiée / Corrections proposées / Lecture à confirmer / Vérification incomplète | InvoiceScanReview.tsx:4-9 | « Lecture à confirmer » capturé ; les trois autres non capturés (une seule fixture) |
| Section « Achat peut-être déjà enregistré » (tableau Document lu / Déjà enregistré, choix Même achat / Autre achat) | ExpenseSheet.tsx:231-244 | NON ATTEINT : la fixture ne déclenche aucun doublon |
| « Voir le justificatif » (aperçu image) + « Changer » | ExpenseSheet.tsx:245 | depense-lu-390 (replié) |
| Total TTC en CHF (champ) + « À confirmer · Total TTC à vérifier sur l’original » | ExpenseSheet.tsx:246 (ScanHint :246 et ScanHint du composant) | depense-vide : 0,00 ; lu : 108,1 à confirmer |
| Pour quoi ? (champ) | ExpenseSheet.tsx:248 | vide : placeholder « Malt pour la Pale Ale… » ; lu : « Achat fixture (lecture simulée) » |
| « Achat du 31.10.2026 » (déplié) + « Date de l’achat » + flèches mois + Hier / Aujourd’hui / Demain | ExpenseSheet.tsx:249 (DateField) | depense-lu-1280 (dépliée car indice date) |
| Règlement « Déjà payé » / « À payer » | ExpenseSheet.tsx:250 | toutes |
| « Payé le 31.10.2026 » (replié) ; « Date du paiement » et « Moyen de paiement » quand payé ; « Échéance (facultative) » quand à payer | ExpenseSheet.tsx:252 | non ouvert ; « À payer » non cliqué |
| « Fournisseur et catégorie · Fournisseur facultatif · Brassage » (replié ; champs Catégorie, Fournisseur) | ExpenseSheet.tsx:254-257 | toutes |
| « Lier à une dépense prévue (facultatif) » | ExpenseSheet.tsx:258 (visible si des prévisions actives existent) | depense-vide, lu : présent ; contenu non ouvert |
| « Articles, stock et matériel · N » + badge « À vérifier » + type d'achat + « N entrée(s) en stock » | ExpenseSheet.tsx:259 | toutes |
| Texte « Types d’achat et articles du stock sont proposés… » | ExpenseSheet.tsx:260 (si scan ok) | depense-articles-vide : absent ; lu-articles : présent |
| Titre « Ce que tu achètes » + « Regrouper en une dépense » (si ≥ 2 lignes) | ExpenseSheet.tsx:259 | lu-articles (lignes 2) : présent ; vide : absent |
| Ligne simple (sans scan) : Type d’achat + Réception en stock (ou Matériel) | ExpenseSheet.tsx:264-267 (simplePurchase, :85) | depense-articles-vide-390, depense-vide : « Ingrédients » ; « Aucun mouvement de stock » |
| Ligne détaillée : n°, libellé, total CHF, type, chevron (repliable) | ExpenseSheet.tsx:271-273 | depense-lu-articles-390 et -1280 : ligne 1 « Malt pils » ouverte ; ligne 2 « Houblon Citra » non capturée ouverte |
| Champ « Libellé ligne 1 » (TextInput) | ExpenseSheet.tsx:263 | lu-articles : « Malt pils » |
| « Type d’achat » (select 9 valeurs) + « TTC (CHF) » | ExpenseSheet.tsx:264 | lu-articles : Ingrédients, 60 |
| « Voir l’extrait du document » (evidence) | ExpenseSheet.tsx:265 | lu-articles : présent, replié |
| « Réception en stock » (select none / existing / new) + Combobox « Article » + « Quantité reçue » + « Unité » | ExpenseSheet.tsx:266 | lu-articles : « Aucun mouvement de stock » ; autres options non atteintes |
| « Fiche matériel » / « Matériel entretenu » (select) | ExpenseSheet.tsx:267 | NON ATTEINT (aucune ligne equipment/maintenance) |
| Bouton « Retirer la ligne n » (corbeille) | ExpenseSheet.tsx:263 (si ≥ 2 lignes) | NON ATTEINT |
| « Ajouter une ligne » (pointillé, max 35) | ExpenseSheet.tsx:275 | depense-lu-articles : présent |
| « Détail : X / Y » (si ≥ 2 lignes, en attention si écart) | ExpenseSheet.tsx:276 | NON ATTEINT (une seule ligne simple en vide, deux lignes en lu sans total détail visible) |
| « Référence et TVA du document » (replié) : N° de commande, N° de facture, TVA source (CHF), taux source (%) | ExpenseSheet.tsx:278 | toutes, replié |
| Pied « Enregistrer la dépense » (vide, sans scan) | ExpenseSheet.tsx:283 | depense-vide, depense-erreur |
| Pied « Confirmer et enregistrer » (scan ok) | ExpenseSheet.tsx:283 | depense-lu-390/1280 |
| Pied « Rattacher le justificatif » / « Fermer sans rien enregistrer » (doublon « Même achat ») | ExpenseSheet.tsx:283 | NON ATTEINT |
| Pied « Vérifier la synchronisation » / « Enregistrement… » | ExpenseSheet.tsx:283 | NON ATTEINT |

## États

- **Vide** (depense-vide-390/1280, depense-articles-vide-390) : atteint.
- **Lu, à confirmer** (depense-lu-390/1280, depense-lu-articles-390/1280) : atteint avec la fixture « disputed » (carte « Lecture à confirmer », 2 points à confirmer, champs à confirmer).
- **Erreur de lecture** (depense-erreur-390) : atteint, aiTask renvoie HTTP 500 ; affiché : « Service IA momentanément indisponible. » + « Justificatif prêt » (le fichier est gardé).
- **Lecture vérifiée / corrections proposées / vérification incomplète** : NON atteints (une seule fixture ; il faudrait `review.status` = checked, corrected, unavailable).
- **Hors ligne** : NON atteint (aucun banc hors ligne dans capture.mjs ; pas de capture).
- **Doublon « Achat peut-être déjà enregistré »** : NON atteint (il faut une dépense existante de même total et date).
- **Avoir** (documentType credit_note) : NON atteint (message ExpenseSheet.tsx:163).
- **Matériel (intent équipement, « Acheter du matériel »)** : NON atteint.
- **Erreur d'enregistrement** (ExpenseSheet.tsx:171) : NON atteint (pas de clic sur Enregistrer).

## Gestes

Atteints : ouvrir Nouvelle dépense (menu Actions rapides), joindre un fichier (uploadFile), ouvrir la section Articles, ouvrir une ligne (summary), ouvrir/refermer Finances → onglets Synthèse/Opérations/Prévisions, filtre Tout.

Non joués : Changer le justificatif ; Voir le justificatif (ouverture) ; Déjà payé ↔ À payer ; ouvrir « Payé le » ; ouvrir Fournisseur et catégorie ; Lier à une dépense prévue ; choisir une catégorie ; Regrouper en une dépense ; Ajouter une ligne ; Retirer une ligne ; changer Réception en stock et Combobox ; Référence et TVA ; Enregistrer ; × Fermer ; drag & drop du fichier ; camera (tactile).

## Ce qui n'a pas été atteint, et pourquoi

- Onglets « Entrées » et « Annuel » : « Entrées » n'existe pas dans le code (voir note) ; « Annuel » non capturé (hors brief).
- Les états listés ci-dessus non atteints : une seule fixture (`lecture-simulee.json`) ; pas de fixture doublon, avoir, matériel, hors ligne.
- 1280 « lu » : ajouté par `capture-1280-lu.mjs` (sans réécrire `capture.mjs`), car `capture.mjs` ne fait que `depense-vide-1280` à 1280.
- Ligne 2 « Houblon Citra » ouverte : non capturée (une ligne ouverte à 390 suffit au brief).
- Captures hors serveur : à l'ouverture, Drive reste en erreur (driveAuthorization émulateur absent, ERR_CONNECTION_REFUSED) : l'état « La connexion Google ne peut pas être préparée » est donc un artefact du banc, à garder en tête.

## Observations de capture (sans jugement de conception)

- depense-lu-articles-1280 : la section Articles dépasse la hauteur du panneau ; la fin de la ligne 1 demande un défilement (visible, non mesuré).
- depense-erreur-390 : deux bandeaux (« Service IA momentanément indisponible » et la zone Drive en jaune) apparaissent ensemble ; à noter pour la revue, non évalué.
