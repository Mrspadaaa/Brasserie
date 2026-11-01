# COMPRIS — voie s6-fiche (l'article d'un produit déjà connu : « bis » ou son origine, ses vraies valeurs, sa fiche)

## Objectif
Quand une ligne de facture est d'un produit que le stock connaît déjà mais qu'une donnée lue des deux côtés diffère (α, origine, récolte, EBC, poids de pièce), l'écran
« Nouvelle dépense » propose un article neuf, jamais une fusion : « Target bis » ou « Cascade CH » (« bis 2 » au second écart), écrit avec ses vraies valeurs lues sur la
facture, lié à la fiche la plus proche des catalogues du dépôt (marque « approchée » quand ce n'est pas exactement la bonne). L'article existant n'est jamais modifié, une valeur
tapée jamais écrasée, Gemini jamais appelé. Dans ce premier temps, j'écris seulement ce document, lance G1 et écris `PLAN.md` ; aucun code avant la revue triée du pilote.

## Écrit dans
- `work/missions/2026-10-31-ecran-depense/voies/s6-fiche/COMPRIS.md`
- `work/missions/2026-10-31-ecran-depense/voies/s6-fiche/PLAN.md`
- `work/missions/2026-10-31-ecran-depense/voies/s6-fiche/RESULTAT.md`
- `work/missions/2026-10-31-ecran-depense/voies/s6-fiche/capturer-s6.mjs`
- `src/services/stockLineMatching.ts`
- `src/services/purchaseEntry.ts`
- `src/types/index.ts`
- `src/domain/stock/`
- `src/ui/finance/ExpenseSheet.tsx`
- `tests/unit/depense/fiche/`
- `tests/unit/purchaseEntry.test.ts`
- Aussi dans mon Possède, que le contrôle G1 ne lit pas parce que VOIE.md les range en deuxième sur leur ligne : le dossier src/ui/depense/ (après le commit d'e-port) et
  le fichier tests/unit/stockLineMatching.test.ts (ajouts seulement).

## Fini quand
- G1 : ce COMPRIS passe le contrôle de compréhension.
- G2 : le plan est relu par deux regards neufs, sans bloquant laissé (le pilote le fait).
- G3 : `npm run build` écrit « built in ».
- G4 : `tsc --noEmit` passe (TYPES OK).
- G5 : les tests de la dépense, du stock, de l'enregistrement et de la fiche passent (TESTS S6 OK), ceux hors de mon « Possède » sans être modifiés.
- G6 : l'audit des champs passe : tout champ via le composant protégé `Input`.
- G7 : mon script `capturer-s6.mjs` joue sur l'app servie les lignes Target, Cascade CH et un produit inconnu, à 390 et 1280 ; il imprime `S6 OK` si les noms proposés sont ceux
  de la table, si l'article écrit au banc porte son nom, son α et sa fiche, si l'article existant est inchangé, sans erreur de console ni requête hors localhost ; j'ouvre les captures.
- G8 : RESULTAT.md dit le témoin avant, « Rien ne se perd », les règles de nom (bis, origine), la fiche, « jamais écrasée » et les captures.

## Ne fait pas
- Aucun code avant la revue triée du pilote ; pas de commit, de `git stash`, d'installation, de code écrit par heredoc ou `node -e`.
- Ne modifie jamais un article existant, ne fusionne rien, ne crée jamais une fiche en double : le « bis » est un article de stock.
- Ne touche pas à `functions/`, `invoicePoints.ts`, `firestore.rules.template`, `BrewWizard.tsx`, `src/ui/fermentescibles/`, `src/ui/identite/`, ni aux tests hors Possède.
- N'écris pas dans `ExpenseSheet.tsx` ni `src/ui/depense/` avant le commit d'e-port (je les lis seulement).
- N'appelle jamais Gemini (pas de recherche de fiche en ligne) ; aucun nom ni adresse du brasseur ; rien dans `brasseur/` ni `functions/.env`.
- Ne modifie pas `ingredientIdentity.ts`, `donneesApp.ts` ni les catalogues (hors Possède) : si le lien l'exige, le plan le dit et le pilote tranche.
- N'invente aucune valeur : l'inconnu n'est jamais 0, une donnée non connue des deux côtés n'est pas comparée.

## Doutes
- `readProductLabel` ne lit pas l'EBC ni la forme (sèche/liquide) ; l'origine n'y est lue qu'après un α ou une récolte (« 9.5% CH »), pas dans « Cascade CH ». Je lirai l'EBC
  et l'origine en queue dans mon propre module (`src/domain/stock/`), sans toucher `ingredientIdentity.ts`.
- Le catalogue des houblons (celui de l'index) donne une origine en français (« États-Unis ») et une seule fiche par variété ; « fiche dédiée Cascade CH » n'existe donc pas :
  « approchée » sera la règle pour Cascade CH. Les levures n'ont que des catalogues de 1,4 à 8,5 Mo : je propose de couper leur lien de fiche.
- `relierStock` (index des houblons, `donneesApp.ts`) ne reconnaît pas « Target bis » : l'article sortirait du stock du moteur. Corriger ce lecteur sort de mon « Possède » :
  le plan pose la question au pilote.
- Le nom de l'article neuf devient le nom propre (sans α, origine, conditionnement) pour houblons et malts seulement : lecture étroite de ma part, à confirmer.
- Un test hors Possède (`tests/unit/depense/ecran/tri.test.tsx:68`) attend « Créer « Target 11.3% » » : il changera ; le pilote tranche avant le code.
