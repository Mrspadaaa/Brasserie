# Audit en lecture seule de la production (01.11.2026, nuit)

Projet Firebase `brasserie-l-affinee` (vérifié par `firebase_get_environment` avant toute lecture). Aucune écriture, aucun Drive, aucun Auth.
Ce rapport ne contient ni montant, ni nom d'article, de fournisseur, de personne ou de fichier : seulement des identifiants de documents, des dates, des comptes et oui/non.

## 1. Méthode

Outils utilisés (lecture seule du plugin Firebase) : `firebase_get_environment`, `firestore_list_collections`, `firestore_list_documents` (avec masque de champs), `firestore_query_collection`, `firestore_get_document`.
Collections lues : `transactions` (36 documents, toutes), `movements` (55, toutes), `stockItems` (toutes), `financialPayments` (5, toutes), `financeDocuments` (3, toutes), `auditLogs` (filtré sur les identifiants des 3 dépenses), `dataHistory` (journal serveur, filtré sur `currentStock`), `financialSync/state`, `invoiceScans` (métadonnées et comptes seulement). `creativeItems`, `functions/.env` et `functions/.secret.local` : non lus. Drive : non lu (voir limites).

Modèle déduit du code, ce que « tout suit » veut dire :
- Une dépense est `transactions/TX-<saisie>` avec `finance.lines[]` ; chaque ligne liée au stock porte `stockItemRef` (`src/services/purchaseEntry.ts:549-573`).
- Chaque ligne liée écrit `movements/receipt-<saisie>-<ligne>` (type `receipt`, quantité convertie dans l'unité de l'article) et incrémente `stockItems/<ref>.currentStock` par `adjustNumber` (`purchaseEntry.ts:589-592`). Un article neuf `MP-<saisie>-<index>` est créé avec la quantité de la ligne (`purchaseEntry.ts:310-313`, `551-558`).
- Un marqueur `movements/purchase-<empreinte ou saisie>` (type `purchase-confirmation`) verrouille le doublon entre appareils (`purchaseEntry.ts:585`).
- Payée : `financialPayments/PAY-<saisie>` + `settlementBalanceCents` et `lastPaymentId` sur la dépense (`purchaseEntry.ts:393-395`, `src/services/financeService.ts:29-43`, règles `firestore.rules.template:214-225`).
- Justificatif : `finance.proofDocumentId` = `financeDocuments/proof-<saisie>` (référence Drive : `provider`, `driveFileId`, `sha256`, `bytes`), ou `finance.proofUpload` si la file d'arrière-plan l'envoie plus tard (`purchaseEntry.ts:441-445`, `src/services/financeDocuments.ts:118-135`).
- Contre-vérité indépendante du client : la fonction serveur `recordDataChange` écrit, pour chaque changement de `stockItems.currentStock`, un `movements/<hash>` avec `beforeQty`, `afterQty`, `delta` (`functions/src/dataHistory.ts:55-64`) et un `dataHistory/<hash>` avec les instantanés. C'est elle qui sert à vérifier l'article.
- Une correction manuelle d'inventaire ne crée aucun mouvement client (`src/services/storage.ts:801-826`) ; elle ne se voit que dans `auditLogs` et `dataHistory`.

Périmètre de la demande (« ~15 dernières dépenses ») : la production ne contient que 3 dépenses au format actuel (`TX-…`, avec `finance`). Les 33 autres documents de `transactions` sont d'avant la refonte (sans `finance`, sans lignes) : 3 apports (`A-001` à `A-003`, hors dépenses) et 30 dépenses historiques. Les 3 dépenses `TX-…` et les 30 historiques sont toutes listées ci-dessous.

## 2. Dépenses au format actuel

| Document | Date du document | Saisie (UTC) | Lignes | Lignes stock | Mouvements trouvés | Article cohérent | Justificatif | Registre | Écart précis |
|---|---|---|---|---|---|---|---|---|---|
| `TX-6770960b-d6da-4840-929e-4b44ae641865` | 27.04.2026 | 01.11.2026 07:23:48 | 26 | 20 (19 articles existants, 1 article neuf `MP-6770960b-d6da-4840-929e-4b44ae641865-24`) | 20 `receipt` sur 20 attendus, 1 `purchase-confirmation`, 20 `stock-document` serveur (un par article) | oui, 20 sur 20 : `beforeQty + quantité reçue = afterQty = currentStock`, unité de l'article respectée (Kg vers kg, Stk vers sachet, g vers g, Pck vers Pck) | oui : `proof-6770960b-d6da-4840-929e-4b44ae641865`, Drive référencé, `sha256` identique à `finance.sourceDocumentHash` | oui : `PAY-6770960b-d6da-4840-929e-4b44ae641865` (sens sortie, solde réglé, `lastPaymentId` correct), 2 entrées `auditLogs`, `financialSync/state` révision 11 à 07:23:52 | Chaîne technique complète. Ruptures de cohérence avec l'existant : R1, R2, R3 (§4) |
| `TX-7a88ea3e-52f8-42a2-850d-fc521396273f` | 30.08.2026 | 10.09.2026 04:03:37 | 3 | 0 | 1 `purchase-confirmation` (aucun `receipt` attendu) | sans objet (aucune ligne stock) | oui : `proof-7a88ea3e-52f8-42a2-850d-fc521396273f`, `sha256` identique | oui : `PAY-7a88ea3e-52f8-42a2-850d-fc521396273f`, solde réglé | Aucun écart technique. Catégorie « divers », libellé hors brassage : le brasseur doit confirmer qu'elle reste dans les comptes de la brasserie (R6) |
| `TX-bacc749a-99a9-4e73-9747-29ceac7aed92` | 01.11.2026 | 01.11.2026 06:00:08 | 1 | 0 | 1 `purchase-confirmation`, 1 `VOID-TX-…` | sans objet | oui : `proof-bacc749a-99a9-4e73-9747-29ceac7aed92`, `sha256` identique (conservé après annulation) | oui : `PAY-bacc749a-…` puis `CONTRE-PAY-bacc749a-…` (sens inverse, même montant), solde 0, `voidedAt` posé, `auditLogs` création et annulation | Dépense de test du pilote sur la production (fournisseur fictif), annulée correctement. Aucun stock à rendre. Voir R5 |

## 3. Dépenses historiques (sans objet `finance`)

Ces documents n'ont ni `finance.lines`, ni justificatif, ni `stockImpact` : aucun mouvement n'est attendu et aucun n'existe (55 mouvements au total, aucun ne vise un document historique).

| Document | Date | Lignes | Lignes stock | Mouvements | Article cohérent | Justificatif | Registre (paiement) | Écart |
|---|---|---|---|---|---|---|---|---|
| `B-001` | 27.04.2026 | sans objet | 0 | 0 | sans objet | non | oui : `PAI-d5b16e0b-22be-45c3-b54c-bfc53b3abcc8`, daté 17.10.2026 | Ligne de la commande du 27.04 : voir R1 |
| `B-002` à `B-026` (25 documents) | 27.04.2026 | sans objet | 0 | 0 | sans objet | non | non (aucun paiement) | Lignes de la même commande : voir R1 |
| `L-001`, `L-002` | 05.01.2026, 08.01.2026 | sans objet | 0 | 0 | sans objet | non | non | Aucun |
| `M-001` | 02,05,2026 (date au séparateur virgule, format non standard) | sans objet | 0 | 0 | sans objet | non | non | `isoDate` rend `null` pour ce format (`src/domain/finance/ledger.ts:8-17`) : l'écriture n'a pas de date valide pour le registre, donc probablement hors des périodes et des totaux |
| `NT-001` | 01.01.2026 | sans objet | 0 | 0 | sans objet | non | non | Aucun |

## 4. Ruptures et écarts, avec leur cause dans le code

**R1 — La commande du 27.04.2026 est comptée deux fois dans le registre (majeure).**
`TX-6770960b-…` (26 lignes, enregistrée le 01.11) reprend un à un `B-001` à `B-026` (26 documents du 27.04.2026, même catégorie) : les 20 références d'articles des `B-…` se retrouvent toutes dans les lignes de la `TX`, et la somme des 26 `B-…` égale le total de la `TX` à l'arrondi près. Conséquences : dépenses de brassage doublées pour cette commande, et la première ligne a deux paiements (`PAI-d5b16e0b-…` du 17.10.2026 sur `B-001`, puis `PAY-6770960b-…` daté 27.04.2026 sur la `TX` qui l'inclut).
Cause : `duplicateMatch` ne compare qu'à `tx.finance` (fournisseur, n° de facture, empreinte de fichier, lignes). Les documents historiques n'ont aucun de ces champs, donc aucun rapprochement ne tient (`src/services/purchaseEntry.ts:82-98`, garde `tx.finance?.kind!=='expense'` à la ligne 92 ; liste parcourue à `purchaseEntry.ts:104-108`). Les libellés `B-…` commencent pourtant par la référence d'article, que `lineReferences` (`purchaseEntry.ts:72`) sait comparer. Le brasseur doit trancher quel jeu garder ; le code interdit de supprimer une transaction (`firestore.rules.template`, `allow delete` hors `transactions`), seule l'annulation tracée existe (`src/services/storage.ts:549-583`) et elle est bloquée par un paiement (`B-001`).

**R2 — Le stock des 19 articles existants est très probablement doublé (majeure).**
Le journal serveur montre que les 20 articles n'avaient aucune variation de stock depuis le début de l'historique serveur (début septembre) jusqu'au 01.11 07:23:49. Pour 10 articles, `beforeQty` égale exactement la quantité de la commande (`MP-009`, `MP-014`, `MP-017`, `MP-018`, `MP-019`, `MP-020`, `MP-021`, `MP-022`, `MP-026`, `MP-027`) : leur stock vaut maintenant deux fois la commande. Pour 7 autres, `beforeQty` est inférieur à la quantité commandée (`MP-008`, `MP-011`, `MP-012`, `MP-013`, `MP-015`, `MP-016`, `MP-024`), ce qui cadre avec un stock d'ouverture égal à la commande moins les brassages ; `MP-010` et `MP-025` sont au-dessus de la quantité commandée. Présomption forte, non prouvée : le stock d'ouverture (création au 03.09.2026) incluait déjà cette commande ; la saisie du 01.11 l'a ajoutée une seconde fois.
Cause : l'enregistrement ajoute toujours la quantité au stock courant, sans rapprocher la date du document (27.04) de la date d'ouverture du stock (`purchaseEntry.ts:559-565` et `589-592`). Aucune alerte « document antérieur au stock » n'existe. Le stock d'ouverture lui-même n'a aucun mouvement client (ni reçu, ni inventaire tracé : `storage.ts:801-826`), donc rien dans `movements` ne permet de prouver l'origine du stock avant le 01.11.

**R3 — Article neuf probablement doublon d'un article existant (mineure).**
La ligne 25 (houblon cryo, 1 pièce « Pck ») a créé `MP-6770960b-…-24` (unité `Pck`, stock 1) alors que `MP-023` (même produit, en grammes, stock inchangé depuis le 03.09) existe. C'est le seul des 21 articles à ne pas avoir été rapproché.
Cause : `stockQuantityFor` refuse la conversion `Pck` vers `g` (aucune lecture du poids dans le libellé pour un houblon, `purchaseEntry.ts:265-298`, refus ligne 297), donc la ligne n'est pas liée et `stockAction: 'new'` crée l'article (`purchaseEntry.ts:310-313`, `369-377`).

**R4 — Un second scan du fournisseur demandé, le 01.11 à 17:48 UTC (18:48 locale), n'est pas enregistré (information).** Voir §5.

**R5 — Restes de tests sur la production (information).** `TX-bacc749a-…` (annulée, justificatif conservé, comptes à zéro) ; 3 scans `invoiceScans` du 01.11 (14:31, 14:33, 15:34 UTC) d'un fournisseur fictif, jamais enregistrés. Pas d'effet sur les comptes ni sur le stock.

**R6 — Pièce classée « facture » alors que la lecture la dit pro-forma (information).** Le scan de la commande du 01.11 07:21 UTC porte `proForma: true` et `paymentEvidence: paid` ; la dépense a `sourceDocumentType: invoice` (champ copié du brouillon, `purchaseEntry.ts:579`). Sans effet sur les écritures ; à confirmer par le brasseur avec la pièce.

**Divers vérifié sans écart :** aucun mouvement orphelin (les 20 `receipt`, les 3 marqueurs et le `VOID` visent des dépenses existantes ; les 11 mouvements `FICHE-…` à variation nulle sont des créations de fiches, sans achat) ; aucune dépense `TX-…` orpheline ; aucun doublon de `receipt` ni de marqueur ; aucune ligne stock sans mouvement ; aucune dépense avec `proofUpload` en attente (les 3 ont `proofDocumentId`) ; chaque `financeDocuments` porte `provider: google-drive`, un `driveFileId`, un `sha256` égal à l'empreinte de la dépense ; `settlementBalanceCents` et `lastPaymentId` conformes aux règles `matchingPaymentGuard` (`firestore.rules.template:76-85`).

## 5. Achat du fournisseur demandé, enregistré le 01.11.2026

- Il existe : `TX-6770960b-d6da-4840-929e-4b44ae641865`, saisie le 01.11.2026 à 07:23:48 UTC (08:23 locale), pièce datée du 27.04.2026, issue du scan du 01.11 à 07:21:29 UTC.
- Cohérent en soi : oui, de bout en bout (26 lignes, 20 lignes stock, 20 reçus, 20 variations de stock côté serveur, 1 article neuf, paiement, justificatif Drive, journal d'audit, révision de synchronisation financière).
- Incohérent avec l'existant : oui, voir R1, R2, R3.
- Un second scan du même fournisseur existe le 01.11 à 17:48 UTC (statut « complété », 17 articles, lecture « contestée » avec 13 remarques, date et n° de facture absents, aucune référence d'article commune avec la première commande). Il n'a produit ni dépense, ni mouvement, ni article : dernière écriture sur `transactions`, `movements` et `stockItems` à 07:23:50 UTC, avant ce scan. Un autre scan, d'un autre fournisseur, à 07:24 UTC, n'est pas non plus enregistré. Un scan du 31.10 à 16:23 UTC du même fournisseur (même n° de commande, 23 articles, total différent) précède la saisie et n'a donné aucune dépense.

## 6. Verdict

**Chaîne d'écriture d'une dépense : « tout suit ».** Pour les 3 dépenses au format actuel, chaque ligne liée au stock a son mouvement (20/20), chaque article reflète son mouvement (20/20, contrôlé contre le journal serveur indépendant), les 3 justificatifs sont rattachés (3/3) et les paiements, l'annulation et l'audit sont cohérents. Le code fait ce qu'il doit.

**Cohérence avec les données historiques : « tout ne suit pas ».** Ruptures à traiter par le brasseur :
1. R1 — commande du 27.04 comptée deux fois (`B-001` à `B-026` et `TX-6770960b-…`) : `src/services/purchaseEntry.ts:82-98` (rapprochement aveugle aux documents sans `finance`).
2. R2 — stock des articles de cette commande très probablement doublé : `src/services/purchaseEntry.ts:559-565`, `589-592` (ajout sans garde sur la date d'ouverture du stock).
3. R3 — article neuf probablement doublon de `MP-023` : `src/services/purchaseEntry.ts:265-298`, `310-313`.
4. Un second scan du fournisseur du 01.11 (17:48 UTC) n'est pas enregistré.
5. `M-001` a une date illisible pour le registre (`02,05,2026`, `src/domain/finance/ledger.ts:8-17`) : écriture probablement hors des totaux de période.

Aucune de ces ruptures n'a été corrigée ni testée en écriture : décision du brasseur (garder les `B-…` ou la `TX`, rectifier le stock par un inventaire compté, relier ou fusionner l'article neuf).

## 7. Limites

- Drive non lu : la présence du fichier dans Drive n'est pas vérifiée, seulement sa référence (`driveFileId`, `sha256`, `bytes`) et la correspondance de l'empreinte avec la dépense.
- Le journal serveur couvre les changements de stock depuis le début de septembre : ce qui s'est passé avant (création du stock le 03.09, brassages éventuels) n'est pas observable. R2 reste une présomption forte, à confirmer par un comptage physique.
- Les lignes de `financialSync*` (événements, versions) n'ont pas été inspectées, seule la révision de `financialSync/state` l'a été.
- Les contenus des scans (`invoiceScans`) ont été lus pour leurs métadonnées et leurs comptes ; aucun de leurs champs n'est recopié ici.
