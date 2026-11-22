# LO-3 — doc12 : « 1 seule ligne, TVA — » (rejeu en ligne du 08.11)

## Le défaut
Commande 647304 de Brau- und Rauchshop, 3 captures, 25 lignes, TVA imprimée « Tax 2,6 % 1,00 » + « 8,1 % 11,25 », total 203,95. En ligne : date, total, référence lus ; une ligne (fournisseur, 203,95, quantité ?) ; TVA « — » ; aucune alerte.

## Diagnostic (hors ligne, aucun appel Gemini)
Les trois lectures réelles de doc12 du banc payant k7 (`banc-k7-prod/raw/doc12-t1-Csv81..83.json`) ont été rejouées de bout en bout.

| étape | résultat |
|---|---|
| banc k7 (Gemini réel) | Csv81 et Csv82 : 23 lignes, bloc TVA 2 taux, TVA 12,25 ; Csv83 : 24 lignes ; 11/12 champs, 23/23 lignes (le seul champ faux : `documentType`) |
| serveur (`lireCsv8`, le code de production) sur ces trois lectures | provisoire 23 lignes, final 24 lignes, `vat` = 1,00 + 11,25, `tvaAmount` 12,25, total 203,95 |
| écran (`normalizeResult` → `brouillonDeLecture` → `appliquerFinale`) sur ce final | 24 lignes, TVA 12,25 ; fusion provisoire/final : 24 lignes, 0 perdue |

Donc le banc lisait bien les lignes et la TVA, et ni l'assemblage serveur, ni la fusion, ni l'écran (`ExpenseSheet`, `purchasePrefill`, `finale.ts`) ne les perdent. Découpe (`decoupe.ts`) : hors de cause, le chemin « plusieurs pages » (`scanPages`) ne découpe pas ; « lecture rapide » : le terme n'existe pas dans le code ; fusion de morceaux (`invoiceAssemblage`) : ne sert qu'à une pièce découpée.

Ce que l'app a reçu n'avait donc ni lignes ni TVA, mais l'en-tête : fournisseur, date, n° de commande, total. Or c'est exactement ce que porte la PREMIÈRE capture seule (« ORDER #647304 », date, « Order Total CHF 203.95 », logo du fournisseur ; le tableau des articles commence en bas de la capture 1, coupé, et les 25 lignes et le bloc « Tax 2.6 % / Tax 8.1 % » sont sur les captures 2 et 3). Le chemin « Un document » prend UN fichier (`<input>` sans `multiple`, `files[0]`) ; « Plusieurs » demande de rajouter chaque page, puis « Lire N pages » (`lirePages` : une page seule retombe sur `attach`). Une lecture de la seule capture 1 explique tout : mêmes champs, mêmes absences, ~25 s en ligne (durée du banc de doc12 : 26,8 s ; un document à une image dure 6 à 10 s au banc mais 27 à 40 s en ligne, la durée ne tranche pas).

Limite : qu'une seule capture soit partie, je ne peux pas le prouver sans lecture réelle ni sans la trace du geste du rejeu (le rapport dit « 3 écrans », sans dire comment elles ont été jointes). Une rangée « Plusieurs » qui perdrait les pages 2 et 3 aurait dû être vue dans les tests de `tests/unit/depense/pages/` (10 fichiers, verts), et je n'en ai pas trouvé la trace dans le code.

## Le vrai défaut du produit, indépendant du geste
Une lecture d'en-tête seul (total imprimé, zéro ligne, zéro TVA) sortait du serveur « checked », sans point ni phrase : `sumCheck` rend « non vérifiable » quand il n'y a aucune ligne, et rien d'autre ne parle. Un total sans aucune ligne se présentait comme une lecture complète (rejoué : status `checked`, 0 point, 0 phrase, pour `printedLineCount` null comme 0). Le brasseur ne pouvait pas savoir qu'il manquait 25 lignes et la TVA.

## Décision
Un point typé `lignes-absentes` (`gravite` inverifiable, `enjeu` argent, pèse, ne bloque pas) quand : aucune ligne lue, aucune ligne annoncée (sinon `lignes-perdues` parle déjà, pas de doublon), total TTC positif imprimé. Message : « Aucune ligne lue : seul l'en-tête du document l'est, le détail des lignes manque. Une page ou une partie manque peut-être : à vérifier sur le document. » La lecture passe « à confirmer » (`disputed`), l'indice s'affiche sous les lignes (`invoiceFieldHints` → `items`), la puce « Lignes » vise la liste (`ExpenseSheet`, `confiance.ts`, `etat.ts`). Rien n'est inventé : la ligne unique de repli (fournisseur + total) existait déjà et reste.

Écarté : refaire la lecture ou toucher `decoupe.ts` (non touché) ; supposer une cause serveur (le rejeu l'exclut).

## Preuves
- `tests/unit/depense/h13-0811/lecture-sans-lignes.test.ts` (fixture anonymisée `doc12.json` : vraie sortie k7, fournisseur et n° remplacés) : 3 des 7 tests échouent sur HEAD (point absent, statut `checked`, aucun indice), les 7 passent après.
- Banc hors ligne des 17 pièces, avant/après (`--hors-ligne --reprendre banc-k7-prod --variantes Csv8 --normaliser`) : 17 pièces, mêmes statuts, mêmes lignes, aucun point nouveau, aucun faux vert de plus (chaque pièce a au moins une ligne ; doc3 en a 2, doc4 3).
- Trois tests anciens dont la fixture avait un total sans ligne : `somme.test` (« ni point ni phrase » → le seul point est `lignes-absentes`, la somme reste non vérifiable et muette), `tva.test` et `invoiceVisionReview.test` (une ligne ajoutée à la fixture : leur sujet est la TVA et la tolérance au centime).
