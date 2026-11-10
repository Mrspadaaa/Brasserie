# Audit des limites qui coupent ou jettent des données (lecture seule, 03.11.2026)

Périmètre : `src/` et `functions/src/`, hors tests, work, node_modules. Les cinq limites 35 déjà connues ne sont pas listées,
sauf leurs conséquences (n° 3, 4, 8). Chaque trouvaille a été vérifiée en lisant le code appelant, sauf mention « non vérifié ».

Résultat : 13 trouvailles, 3 graves.

## GRAVES

### 1. Tarifs : deux produits au même identifiant, le premier disparaît sans un mot
- `src/services/storage.ts:1190` (`saveTarifs` → `syncCollection('tarifs', tarifs, t => slugify(t.product) || TARIF-i)`), `slugify` ligne 1390 (coupe à 80 caractères, retire accents et ponctuation) ; même clé dans `src/services/migration.ts:152,192`.
- Ce qui est coupé : l'identifiant du document Firestore est le nom du produit « aplati ». « Blonde – 33 cl » et « Blonde 33cl » donnent tous deux `blonde-33-cl`/`blonde-33cl` selon la saisie ; « Bière blonde 33cl » et « Biere blonde 33cl » donnent le même. `syncCollection` (storage.ts:285-307) fait `put` pour chaque élément : le second écrase le premier, puis supprime tout ce qui n'est plus dans la liste. Deux noms qui commencent par les mêmes 80 caractères collisionnent aussi. Un nom sans lettre latine devient `TARIF-<rang>` : l'identifiant change quand on réordonne, donc réécriture et suppression d'anciens documents.
- Quand : une grille de tarifs de 20 à 60 lignes avec des formats (« 33 cl », « 33cl », « fût 20 L ») ; une seule collision suffit. Aucun message : la ligne manque au rechargement.
- Prévenu ? Non. C'est une perte de prix de vente, donc d'argent.
- Correction la plus simple : identifiant stable `crypto.randomUUID()` posé à la création (ou slug + suffixe si l'id existe déjà dans la liste), et refuser un doublon visible dans l'éditeur. Garder l'ancien id pour les documents existants.

### 2. « Budgets retenus » additionne les budgets inconnus comme des 0 CHF
- `src/domain/finance/upgrades.ts:31-35` : `amountCents: known ? Math.round(estimatedCost*100) : 0` ; `src/ui/finance/UpgradeWorkspace.tsx:80,87` : `retained = selected.reduce((sum,p) => sum + p.amountCents, 0)` affiché tel quel, « Budgets retenus · tous horizons ».
- Ce qui est jeté : un projet retenu sans budget estimé compte 0. La ligne du projet dit bien « Budget à estimer » (ligne 89), mais le total en tête ne dit pas qu'il est partiel.
- Quand : tout projet « actif » dont le coût n'est pas encore saisi (cas normal d'une idée retenue avant devis). Le total paraît bas et exact.
- Correction : compter les projets sans budget (`budgetKnown === false`) et écrire « 12 400 CHF + 2 sans budget » ; ne jamais laisser 0 représenter l'inconnu. Vérifier aussi si `amountCents: 0` entre dans les prévisions (`forecast.ts`) : non vérifié.

### 3. Conséquence de 35 → 80 : les constats de contrôle sont coupés à 35, 50, 40 et 20
- `functions/src/invoiceScanCore.ts:479` (`compareInvoiceReview` → `findings.slice(0, 35)`), `functions/src/invoiceVisionReview.ts:424` (`uniqueFindings.slice(0, 50)`), `:185` (remarques `slice(0, 40)`), `:196` et `invoiceScanCore.ts:328` (`fieldWarnings slice(0, 20)`), `functions/src/invoiceScanVote.ts:83` (`slice(0, 50)`), côté client `src/services/geminiScanner.ts:82-89` (`MAX_POINTS = 60`, avec garde `lostHeavy`).
- Ce qui est coupé : la liste des raisons pour lesquelles la lecture est « contestée ». Le statut reste `disputed` (la coupe vient après le calcul du statut), donc la facture n'est jamais déclarée « vérifiée » à tort. Mais le brasseur ne voit plus que les 35 premières raisons.
- Quand : facture de 80 lignes avec deux lectures divergentes, 2 constats par ligne douteuse (divergence + « incertain ») : jusqu'à 160 constats, 35 montrés. Les lignes 20 à 80 deviennent muettes alors qu'elles sont douteuses. Seul `MAX_POINTS` (client) a un garde-fou ; les coupes serveur n'ont aucune trace (pas de « +N autres »).
- Correction : ne pas couper les constats (ils sont courts, 250 caractères), ou ajouter un constat final « N autres constats non listés : relis les lignes marquées ». Aligner les plafonds sur `SCAN_MAX_ITEMS`.

## MOYENNES

### 4. Conséquence de 35 → 80 : la saisie atomique est plafonnée à 450 écritures, avec un message absurde
- `src/services/firestoreRepo.ts:109` : `if (operations.length > 450) throw 'Plus de 450 modifications simultanées. Utilise la restauration serveur. Aucune de ces modifications n’a été enregistrée.'`
- Chaque ligne qui crée un article (`purchaseEntry.ts:709-716`) écrit : l'article (`addStockItem`, storage.ts:713), son journal d'audit (`logAction`, +1), un mouvement `receipt-…` (+1), et éventuellement `nomsFacture` (+1). Soit 3 à 4 écritures par ligne neuve, plus la dépense, son audit, le mouvement d'opération et le paiement.
- Quand : 80 lignes toutes neuves = 240 à 320 + env. 8 : sous 450, mais la marge est mince. Une saisie de 120 lignes ou une réouverture qui réécrit tout dépasse. Je n'ai pas joué un test à 80 lignes neuves : non vérifié que toutes les écritures partent dans le même lot.
- Prévenu ? Oui, l'écriture échoue en bloc (rien d'enregistré), mais le texte renvoie à « la restauration serveur », sans rapport avec un achat.
- Correction : test à 80 lignes neuves avant de livrer le passage à 80 ; message « Cette saisie est trop grosse pour être enregistrée d'un coup (N écritures) : enregistre-la en deux dépenses » ; garder LIGNES_MAX sous la capacité réelle.

### 5. Assistant finances : il ne lit que 1 500 dépenses, 3 000 règlements, 500 articles, 100 recettes, 250 lots
- `functions/src/brewerFinanceContext.ts:5-15` (`limit + 1`, `complete: snapshot.size <= limit`), triées par identifiant de document, pas par date.
- Ce qui est coupé : au-delà de la limite, le résultat de l'exercice devient `null` (`functions/src`/`src/domain/finance/assistantContext.ts:128` : `resultCents: frozen || financialComplete ? … : null`). La coupe est annoncée au modèle (`coverage`) ; je n'ai pas vérifié que le brasseur la lit à l'écran.
- Quand : 2 000 dépenses (la taille donnée) dépassent 1 500 : l'assistant ne pourra plus donner de résultat chiffré, et les 500 dernières par identifiant manquent aux totaux. Recettes à 100 : une brasserie qui archive peu en a plus.
- Correction : lire par date (`orderBy('date','desc')`) ou par exercice demandé, relever la limite des dépenses à 5 000 (champs `select` déjà réduits), et dire à l'écran « lecture partielle : N sur au moins M ».

### 6. Assistant : stock lu à 500 articles et matériel à 200, sans aucun drapeau
- `functions/src/brewerStockContext.ts:9` (`limit(500)` sans `+1`), `functions/src/brewerChat.ts:66` (`equipment limit(200)`), `:128` (`inventory: stock.docs.map…`).
- Seul le jeu des lots a un drapeau (`complete: reservations.docs.length < 501`). Au 501e article, le modèle croit avoir tout le stock et peut conclure « tu n'as pas de X ».
- Quand : stock de 300 articles aujourd'hui : pas touché. Devient réel à 500 (levures et houblons par lot comptent vite).
- Correction : `limit(501)` + `complete` comme pour les lots, et l'ajouter à `provenance`.

### 7. Traduction des noms : seuls 35 noms distincts par pièce sont traduits (jumeau du 35 connu)
- `src/domain/nomsBase.ts:20` (`NOMS_MAX_ENTREES = 35`), `src/services/nomsFr.ts:159` (`restantes.slice(0, NOMS_MAX_ENTREES)`), plafond de sortie `functions/src/prompts.ts:1014` (`600 + 36 * 35`).
- Ce qui est coupé : du 36e nom distinct, la ligne garde le nom imprimé (allemand, anglais) sans le dire (l'appel est unique et sans nouvel essai, les erreurs sont avalées, lignes 130 et 173).
- Quand : facture de 40 à 80 lignes sans article connu : jusqu'à 45 lignes restent en langue d'origine. Il faut relever en même temps la constante et le plafond de sortie (sinon le JSON est coupé et rien n'est traduit : erreur avalée).
- Correction : paginer par paquets de 35 (plusieurs appels, ou un seul avec plafond `600 + 36*N`), ou signaler « 12 noms non traduits ».

### 8. Noms imprimés retenus par article : 8 au plus, le 9e n'est pas appris
- `src/services/purchaseEntry.ts:406,421` (`NOMS_FACTURE_MAX = 8`, `continue`).
- Ce qui est jeté : à la 9e orthographe imprimée pour un article (ex. un malt facturé sous 9 libellés par deux fournisseurs), plus aucun lien automatique pour la suivante ; pas d'alerte.
- Quand : un article très acheté chez plusieurs fournisseurs sur plusieurs années. Gêne (le brasseur relie à la main), mais silencieux.
- Correction : relever à 20, ou retirer le plus ancien (FIFO) au lieu de ne rien écrire.

### 9. Montant inconnu des anciennes écritures = 0 CHF
- `src/domain/finance/ledger.ts:4` (`toCents` : non fini → 0) et `:24-27` (`transactionAmount` : sans bloc `finance`, `toCents(tx.amountTTC ?? tx.amountHT)`).
- Ce qui est jeté : une écriture ancienne sans `amountTTC` ni `amountHT` compte 0 dans totaux, journal, archive. Aucune marque « montant inconnu ».
- Quand : données d'avant la migration finance v1 ; je n'ai pas compté combien de documents réels sont concernés (non vérifié).
- Correction : `transactionAmount` renvoie `null` pour l'inconnu et le journal l'affiche « ? » et l'exclut des totaux avec un compteur.

### 10. Pages d'une facture : 4 pages, 4 Mo par page, 12 Mo en tout
- `src/services/pagesJustificatif.ts:5-10,34-37`, `functions/src/ai.ts:106-116`, `functions/src/invoiceScanCore.ts:17` (`SCAN_MAX_BYTES = 4 Mo`).
- Refus explicite avec le motif (« 4 pages au plus », poids). Pas de perte silencieuse, mais une commande de 80 lignes sur 5 pages est impossible à lire en un seul justificatif, alors que 80 lignes devient admis par ailleurs. Une photo trop lourde est réduite (`allegerPhoto`), le PDF assemblé est réencodé jusqu'à 1 280 px / qualité 0,68 pour tenir sous 3,9 Mo : la PREUVE gardée au Drive peut être dégradée sans que le brasseur le sache (le résultat porte `reduite: true`, non vérifié qu'il est affiché).
- Correction : afficher « justificatif réduit » quand `reduite`, et accepter 6 pages si le total reste sous 12 Mo.

## FAIBLES (gêne)

### 11. Textes de la lecture coupés côté serveur : désignation 180, fournisseur 180, description 300, référence 70, variante 80
- `functions/src/invoiceScanCore.ts:163,300-303,329-334`. Le client coupe à 250 (`src/services/geminiScanner.ts:53,151`), donc 180 est la vraie limite. Code TVA coupé à 10 caractères et 6 rangées de TVA au plus sont, eux, tracés (`reject`, lignes 297, 311) : bien.
- Rare (désignation > 180 caractères), mais la coupe de la désignation n'est pas tracée. Correction : appeler `reject('name', …)` comme pour `vatCode` quand `name.length > 180`.

### 12. Dossier comptable PDF : désignations coupées à 100 caractères, nom d'entreprise à 65
- `src/services/financeExport.ts:92,124,128`. Les lignes ne sont jamais jetées (tables paginées, lignes 75-89). Seul le nom d'un immobilisé ou d'un article de l'inventaire est abrégé sans « … ». Le fichier Excel n'a pas été lu : non vérifié.

### 13. Aperçu de l'assistant sur les écrans de l'app : 80 lignes par collection
- `functions/src/brewerAppContext.ts:38-40` ; l'écran envoie un avertissement au modèle (`brewerChat.ts:115`) mais le brasseur n'en est pas informé dans l'interface (non vérifié). Clients, tarifs, recettes, lots : 80 suffit pour une micro-brasserie.

## Ce qui est correct (pas de correction à faire)
- Sortie Gemini coupée (`MAX_TOKENS`) : erreur nette, jamais un JSON tronqué accepté (`functions/src/geminiResponse.ts:52`).
- Valeurs rejetées à la mise en forme : tracées en `rejets` (`invoiceScanCore.ts:421-427`).
- Journal d'audit : lu par pages avec « charger plus » (`firestoreRepo.ts:162,241-268`).
- Restauration et clôture : échecs bruyants (`backupTransfer.ts:252-259`, `financeService.ts:19`, `fribourgTax.ts:32`).
- Requêtes Firestore de l'app : aucune `limit()` sur les données du brasseur hors `auditLogs`.
- Ligne de dépense d'une facture : montants en centimes entiers (`Math.round((n+EPSILON)*100)`), sans perte ; `unitPriceCents` n'est conservé que s'il est exact (jamais lu ailleurs, donc sans effet).
- Impôt sur la bière : plateau arrondi à 0,1 °P avant le palier (`swissBeerTax.ts:28`) ; écart seulement à ±0,05 °P d'un seuil, négligeable.
- Hors sujet : `src/services/imageCompression.ts` (700 Ko, 1 600 px) est du code mort (aucun appelant).

## Fichiers à jumeler quand le pilote règle le 35
`functions/src/invoiceScanCore.ts` (SCAN_MAX_ITEMS, findings), `src/services/geminiScanner.ts:151`, `src/services/purchaseEntry.ts` (LIGNES_MAX), `src/domain/nomsBase.ts:20`, `functions/src/prompts.ts:1014`, `src/ui/finance/ExpenseSheet.tsx`, `src/services/firestoreRepo.ts:109`.

LEÇON PROPOSÉE : un plafond de taille ne se corrige jamais seul. Avant de changer la constante, chercher ses jumeaux (même nombre, même objet : ici 35 dans le serveur, le scanner client, la saisie, la traduction des noms, les constats, le plafond de jetons, et le lot Firestore de 450) et jouer un test à N+1 éléments qui exige une alerte visible. Toute coupe (`slice`, `limit`, `MAX_`) garde le total et le dit : « N de M », jamais un silence.
