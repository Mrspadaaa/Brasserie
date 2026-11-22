# Jeu en ligne — transversaux-2 (16.11)

Limite : la fenêtre Chrome n'a pas pu passer à 390 ni 1280 (resize_window « réussi », mais innerWidth reste 2560). Tout est joué en 2560 ; 390 tactile NON vérifié. Tag/version non lu dans la page (aucun marqueur trouvé) : à confirmer par `firebase hosting`.

## 32 — texte de recherche sur Brassins : NON reproduit
- V1 : loupe sur Bord, « cit », Échap, Brassins > Brassins (16) : champ « Nom, lot, houblon, malt… » vide.
- V2 : loupe ouverte depuis Brassins, « cit », Entrée (résultat « Houblon Cryo Hops Citra 24,8 % » → ouvre Stocks, fiche), retour sur Brassins : champ vide.
- Stockage vérifié : localStorage `laffinee_ui_state` → `catalog-batches-filters.search = ""`.
- Cause (lecture du code, copie deploy-transversaux, non rejouée en ligne) : le texte de la palette est un état local, jamais partagé : `src/ui/CommandPalette.tsx:153` (useState query), remis à '' à la fermeture `:162-165`. Pas de sessionStorage ni query global. Le texte vu sur Brassins était le filtre propre de la liste : `src/ui/production/ProductionCatalog.tsx:57` (useState filters, init par `restoreCatalogFilters(kind, StorageService.getUiState('catalog-batches-filters'))`), réécrit à chaque changement par `ProductionCatalog.tsx:118` (`StorageService.setUiState`, localStorage via `src/services/storage.ts:498`), donc rouvert à la prochaine visite.
- Correctif 43f0ce40 : couvre ce chemin (`src/domain/catalogPreferences.ts:44-45`, `result.search = ''` pour `batches` à la restauration). Il ne vide pas à l'écriture (le texte reste stocké jusqu'à la lecture), sans effet visible. Non couvert : autres écrans à filtre persisté (Recettes, Clients `clients_*`, Finances `finances_search` : même mécanisme, non testé).

## 34 — « Partout » identique : OUI (2560, Bord, Finances, Brassins, Atelier, Stocks)
Partout sur les 5 : Nouvelle écriture E, Entrer une facture F, Encaisser une vente V, Créer une recette R, Lancer un brassin B, Compagnon C, Mes conversations · 3. Même ordre partout.
Bloc « Sur <écran> » en tête :
- Bord : Nouvelle écriture ↑ (aussi Courses, L) ; Partout marque E ↑ ... Finances : Nouvelle écriture, Estimer un brassin S, Entrer une facture, Encaisser une vente (↑ en Partout sur E, F, V).
- Brassins : Nouveau brassin (sera LOT-020) N, Créer une recette R ; Partout : R ↑, B ↑.
- Atelier : Nouveau brassin N, Créer une recette ; Partout : R ↑, B ↑.
- Stocks : Articles (Courses…), pas de ↑ en Partout.
Écran en tête : oui, « Sur Bord / Finances / Brassins / Stocks » (capture Brassins regardée : « Sur Brassins » sous Partout, bouton primaire Nouveau brassin).

## Autres
- Console : aucune erreur.
- Bord : le bloc « Sur » ne montre que Nouvelle écriture (+ Courses, 24 à commander) : à confirmer à l'œil.
- Le + (« Actions rapides ») n'a pas réagi au clic JS sur Brassins ; au vrai clic, il s'ouvre : OK.
- Aucune donnée créée ni modifiée.
