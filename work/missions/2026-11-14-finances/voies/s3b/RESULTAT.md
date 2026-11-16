OK — Budget d'un brassin m4bb-a porté et branché ; G1 G2 G3 verts ; 39 vieux tests à adapter (non possédés), captures à comparer.

## Fait
- `budget/BudgetBande.tsx` : bande « Quand tu paies » (3 piles = `dejaPaye` / `aPayer` / `annee` du snapshot, `=`, boîte du litre « Détail du litre »).
- `budget/BudgetRangees.tsx` : groupes Malt, Houblon levure, Autres, Frais, Part de l'année ; rangée = liseré (plein, hachuré = à payer, mi-mi = stock + achat, pointillé = inconnu), nom · quantité, pastille, montant (« ≈ » si estimé, « ? » si inconnu, jamais 0). Toucher = `ouvrir(noeud)` : les vues Ingrédients / Frais / Annuel existantes portent le détail.
- `budget/ChoixBrassin.tsx` + `FinancesTab.tsx` (seul le choix du brassin) : « Prévus » puis « Recettes », rangées 44 px ; une recette déjà prévue en brassin n'est listée qu'une fois (passe 2) ; message « Crée d'abord une recette… » gardé.
- `BrewBudgetSheet.tsx` : vue `flux` = m4bb-a ; nouvelle vue `litre` = `CoutBrassinFlux` inchangé (boîte du litre), « Retour au budget » ; un nœud ouvert depuis c3a revient à c3a (« Retour au détail du litre »). Gardés : volumes `Volumes : 27 L nets`, tâches `manques` (ligne pointillée, « Prix d'1 ingrédient : … »), réconciliation de plan, « déjà produit », erreur, BrewerChat d'Expliquer, pied Expliquer / Enregistrer / Prévoir.
- `budget/budget.css` (classes `bbx-`), `capturer.mjs`, `cap/` (20 captures + 4 pleine page).
- `CoutBrassinFlux.tsx` et `brewBudget.ts` : non touchés.

## Critères
- Tests : `npx vitest run tests/integration/budgetPiles.test.tsx --reporter=dot --no-color > work/missions/2026-11-14-finances/voies/s3b/tests.txt` -> G1 `VITEST OK` (9 tests : piles = snapshot au centime, litre 7,51, rangées, Détail du litre -> c3a et retour, rangée -> détail, choix).
- G2 `TSC OK`. G3 `V6A OK`. FRISE non rejoué (aucun écran de frise touché).
- Essais : 1 par critère (2 corrections de code dans les tests écrits par moi).

## Captures (ouvertes : budget-repos 390 clair et cave, choix 390 clair)
`cap/<état>-<390|1280>-<clair|cave>.png` : choix, budget-repos, budget-complet (pleine page), litre-c3a, rangee-detail. Vues à 390 clair et cave comparées à `voies/m4/m4bb-a/m4bb-a.png` : bande, piles, groupes, pastilles, ton, ordre conformes. Le démo n'a pas de brassin « planifié » : la section « Prévus » est prouvée en test, non en capture. Pas ouvertes par moi : litre-c3a, rangee-detail, tous les 1280 (le contexte de la voie est plein).

## Écarts à la maquette (déclarés)
1. Pastille volumes en tête du corps (Sheet n'accepte qu'une chaîne en `subtitle`) ; sous-titre « Coût du brassin · brassage 20 nov. » comme la maquette.
2. « ton litre › » : le « › » ajouté, la boîte est le seul toucher vers c3a. Boîte : « estimé » en haut quand le litre est complet, « au moins » sinon, « litres nets ? » sans litres.
3. Rangées 35 px (maquette) : sous les 44 px de la règle générale ; la maquette gagne. Boutons du pied et pastille volumes à 44 px.
4. « Emballage · 81 × 33 cl » : le nombre de bouteilles n'est pas dans le snapshot, rien n'est affiché. « Impôt bière · à payer ~18 déc. » : la date n'existe dans aucune donnée, « à payer » seul.
5. Ligne mixte (même ingrédient en stock et à acheter) : « stock + achat », liseré mi-plein mi-hachuré (pas dans la maquette). « hors recette » pour houblon/levure absents. « compris » pour un coût dans une facture récurrente.
6. Les piles inconnues n'ont pas de hauteur, bord pointillé ; pile positive mais incomplète : montant nu (comme la maquette), nom accessible « au moins ».
7. Pied : « Prévoir 64,26 » sans CHF (maquette) ; la confirmation « Ajouté aux prévisions · … CHF » reste.

## DEMANDE EXECUTANT
1. `node work/missions/2026-11-14-finances/voies/s3b/capturer.mjs 3000` (reprend les captures après le retrait de « CHF » du pied).
2. Ouvrir en image : `cap/litre-c3a-390-clair.png`, `cap/rangee-detail-390-cave.png`, `cap/budget-repos-1280-clair.png`, `cap/budget-repos-1280-cave.png`, `cap/choix-1280-clair.png`, `cap/budget-complet-390-clair.png`.
3. Sorties attendues : 20 lignes de captures, « erreurs » vides, `ouverture … true` x4.
4. Rejouer : `node work/missions/2026-11-14-finances/voies/o1/controle-v6a.mjs 3000` (V6A OK) et `node work/missions/2026-11-14-finances/voies/f1/controle-frise.mjs 3000` (FRISE OK).

## DÉCISION À PRENDRE
**Tests existants rouges : 39 sur 87** (brewBudgetSheet 27, coutBrassinCorrections 9, coutBrassinRenvois 3 ; f2ReelCout, f3ReelCoutImpotClient, prixACompleter : verts à l'essai de ces six fichiers, non rejoués hors de ces six). Cause : ils lisent le flux c3a à l'ouverture (`^Malt :`, `.cbf-src`, `Retour au flux`, `Prévoir … CHF`, « Prix de 1 ingrédient : malt », sous-titre exact « Coût du brassin »). Aucun n'est dans « Possède ». Option recommandée : une voie d'adaptation des tests (toucher d'abord « Détail du litre », nouveaux libellés « Retour au budget », « Prévoir 64,26 », « Prix d'1 ingrédient : acide lactique ») avant toute mise en ligne. Une alternative : rendre l'en-tête de groupe touchable avec le nom `Malt : 44,83 CHF`, ce qui rétablirait une partie des tests mais ajoute un geste non dessiné (35 px) ; non fait.

## Doutes
- `Units.format` des quantités et la date du sous-titre (`brewBudgetDateKey`) vus seulement sur la démo.
- « Une recette déjà prévue n'est listée qu'une fois » retire la possibilité d'estimer cette recette seule à un autre volume : le volume se règle dans la feuille.
- `git status` : mes fichiers = `src/ui/finance/BrewBudgetSheet.tsx`, `src/ui/finance/budget/`, `src/components/tabs/FinancesTab.tsx`, `tests/integration/budgetPiles.test.tsx`, ce dossier. Les autres lignes modifiées viennent des autres voies. `tsc` : les erreurs de `FinanceAssistant.tsx` et `ProjetPiste.tsx` (autres voies) sont apparues en cours de route, non les miennes ; G2 est `TSC OK` en fin.

CONNAISSANCE : aucune
LEÇON PROPOSÉE : un port qui change l'écran d'ouverture doit lister d'avance les fichiers de test qui le lisent et en confier l'adaptation à une voie.
