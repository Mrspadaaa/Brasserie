FN-MONTANT-SEUL OK — `montantDeLigne` dans `normalizeInvoiceScan` : price seul (quantité vide ou 1) devient amountTTC ; banc : 8 lignes touchées, 8 justes, aucune pièce ne perd

Rien déployé, aucun commit, aucun `git stash`, aucun appel Gemini (fetch simulé ; rejeu du banc hors ligne).

## 1. Où vit la règle (et pourquoi un seul endroit suffit)
- `normalizeInvoiceScan` (`functions/src/invoiceScanCore.ts`) est appelé sur CHAQUE lecture avant le vote : `ai.ts` ligne 144 (`normalizeInvoiceScan(parse(response))`) pour les deux Flash-Lite et pour la 3.8. `finalOfStarVote` et `finirUneLecture` (`invoiceVisionReview.ts`) ne normalisent pas : ils reçoivent des lectures déjà normalisées, donc la valeur de la 3.8 qui tranche porte déjà `amountTTC = price`. **Aucune règle n'est ajoutée dans `invoiceVisionReview.ts`** (un seul endroit, toutes les lectures).
- La seconde normalisation de `reconcileInvoiceVision` (sur la fusion des votes) rejoue la même règle : idempotente, et elle ne peut rien remplir que les lectures n'aient déjà rempli.
- Le banc IMPORTE `normalizeInvoiceScan` de `functions/src/invoiceScanCore` (ligne 64, `readingFromResponse`) : pas de copie, la parité est automatique. `scripts/banc-lecture-facture.ts` n'est pas modifié.

## 2. Fichiers changés
- `functions/src/invoiceScanCore.ts` : fonction exportée `montantDeLigne(amountTTC, price, quantity)` ; `normalizeInvoiceScan` lit `quantity` et `price` une fois et appelle `montantDeLigne(number(item?.amountTTC), price, quantity)`. Règle : `amountTTC` vide + `price` fini + (quantité vide ou = 1) → `amountTTC = price`, sinon inchangé. `quantity` et `price` ne bougent pas.
- `tests/unit/invoiceScanMontantSeul.test.ts` (nouveau, 15 tests).
- Trois tests existants adaptés (ils fabriquaient une « ligne sans montant » avec quantité 1 et `price` présent, exactement le cas que la règle remplit désormais ; ils décrivent maintenant une ligne sans AUCUN montant, `price: null` aussi) :
  - `tests/unit/depense/lecture/somme.test.ts` (« une ligne sans montant (cas b) ») ;
  - `tests/unit/depense/rapprochement/statut.test.ts` (entrée `somme-incomplete`) ;
  - `tests/integration/invoiceReview.test.ts` (« ne valide pas une valeur manquante », cas `amountTTC` : `{ amountTTC: undefined, price: null }`).
  Intention conservée : un montant absent n'est pas validé par une seule lecture ; la somme reste « incomplet » ; seul le cas « price seul » a changé de sens, et il est couvert par le nouveau fichier.
- `work/missions/2026-11-01-bascule-lecture/voies/fn-montant-seul/comparer.ts` : script de comparaison du banc (comptes et noms de champs seulement, aucune valeur).

## 3. Tests
- Nouveau fichier écrit AVANT le code : sur le code d'aujourd'hui **11 échecs, 4 verts** (les 4 verts sont les garde-fous : quantité 3 inchangée, quantité 0,5 ou 2 inchangée, `amountTTC` déjà lu intact, sans `price` fini rien d'inventé). Après la règle : **15 / 15 verts**.
- Contenu : (unitaires) sept lignes `price` seul → `amountTTC` = `price`, quantité vide, `price` gardé, `controls.sum = { ok, TTC }` à 110,40, sans point de somme ; quantité 1 → idem, `lines.checked = 1` ; quantité 3, 0,5, 2 sans montant → inchangées, somme « incomplet » ; `amountTTC` déjà lu (quantité vide, 1 ou 3) intact même s'il diffère de `price` ; `price` null, absent, texte, NaN, infini → rien d'inventé ; remise négative garde son signe ; une ligne touchée ne change que `amountTTC` (le reste est égal à la même ligne lue avec son montant) ; montants qui ne totalisent pas le total imprimé → `somme-ecart` comme aujourd'hui ; lignes mélangées → « incomplet ». (chemin complet `scanInvoiceSafely`, C★v8, fetch simulé aiguillé par consigne) deux Flash-Lite lisent `amountTTC` et divergent sur une unité, la 3.8 lit `price` seul → 3 appels, sept `amountTTC` finals, quantités vides, `controls.sum = { ok, TTC }` ; Flash-Lite aussi en `price` seul → idem ; trois `price` seul d'accord → la 3.8 n'est plus appelée ; une Flash-Lite en `amountTTC` et l'autre en `price` seul s'accordent désormais (2 appels) ; quantité 3 de bout en bout → « incomplet ».
- Tests de la lecture : `npx vitest run <33 fichiers de grep -rln "scanInvoiceSafely\|normalizeInvoiceScan\|invoiceScanVote\|reconcileInvoiceVision\|runBudgetedInvoiceScan\|invoiceScanCore" tests, grep -rl scanInvoice tests, banc-lecture*.test.ts, invoiceVisionReview.test.ts>` → **31 fichiers, 681 tests verts** (dont `invoiceScanVote.test.ts`, parité 55, et `invoiceScanCsv8.test.ts`).
- `npx vitest run tests/unit/depense` : 59 fichiers verts ; 12 fichiers ne se chargent pas (`Failed to resolve import "zxing-wasm/reader"`, voie qr-app, déjà signalés par fn-csv8) : aucun lien avec cette voie.
- `npm --prefix functions run build` : vert (`tsc` sans erreur) ; `npx tsc -p functions --noEmit` : sortie 0. Le build réécrit `source4-portable-bundle-manifest-01.json` (déjà modifié avant la voie) : fichier généré, hors Possède, à ne pas valider avec cette voie.

## 4. Rejeu du banc (hors ligne, C★v8, `Csv8` et `Csv8+N`, aucun appel)
Commandes (sortie dans le dossier temporaire de la session, jamais dans Git ; les réponses brutes portent des données personnelles) :
- avant (code d'avant la règle) puis après : `npx vite-node --config vitest.config.ts scripts/banc-lecture-facture.ts -- --hors-ligne --reprendre <banc-k5-C,banc-k5-A,banc-k5-B2,banc-k5-B1,banc-k4-20261101-092559,banc-k4-20261101-093815,banc-k4-20261101-092352,banc-k4-20261101-092139,banc-k1-20261101-081144 sous H13-reels> --variantes Csv8 --normaliser --repeat 2 --out <dossier>` → « Recalcul hors ligne terminé : 26 parcours » (13 pièces × 2 tirages ; `--repeat 3` échoue, le tirage 3 n'existe pas) ; jugement : `npx vite-node --config vitest.config.ts scripts/banc-lecture-facture-juger.ts -- <dossier>` ; comparaison : `comparer.ts` (ci-dessus).
- **Production = C★v8 + N** (la ligne `+N` du banc). Avant → après :
  - champs 275 / 306 → 275 / 306 ; lignes **399 / 422 → 402 / 422** ; faux verts 0 → 0 ; échecs 0 → 0 ; durée médiane 14,2 s → 14,2 s ; coût total 1,1539 → **1,1452 CHF** (un appel 3.8 en moins).
  - alertes justes 17 → 16 ; alertes inutiles 5 → 6 : c'est le seul parcours qui bouge (doc4, tirage 1) : ses 3 lignes passent de fausses à justes, la 3.8 n'est plus appelée (appels 3 → 2), le statut reste « disputed » (bordereau de livraison sans total : `total-absent` et `document-livraison`, qui pèsent avant comme après). Le juge le compte « alerte inutile » parce qu'il ne reste plus rien de faux : c'est un gain, pas une perte.
  - Variante `Csv8` seule (sans N) : strictement identique avant / après.
- **Aucune pièce ne perd un point** : sur 26 parcours × 2 variantes, 0 parcours où un champ ou une ligne se perd ; 1 parcours gagne ; 0 statut change.
- Lignes touchées par la règle dans les lectures enregistrées : 376 lectures distinctes lisibles (toutes les sorties prêtées) ; la règle se déclenche dans **2 lectures, sur 8 lignes** (doc4 : 3 lignes ; doc6 : 5 lignes). Vérité du banc (alignement par rang de ligne, comme le juge) : **8 montants justes, 0 faux, 0 non jugé**. Aucune ligne ne donne un montant faux contre la vérité.
- Lignes FINALES dont le montant passe de vide à plein : aucune (dans les sorties enregistrées la 3.8 rendait déjà `amountTTC` ; la règle ne joue que sur des lectures intermédiaires). Le banc ne contient donc pas la pièce fictive du 01.11 (7 lignes, `price` seul) : elle est couverte par les tests, pas par le banc.

## 5. À surveiller
- Une ligne à `price` seul dont le `price` est un prix UNITAIRE (quantité non imprimée, montant de ligne imprimé ailleurs) recevrait un `amountTTC` faux. Rien de tel sur les 8 lignes du banc ; si cela arrive, la somme des lignes contre le total imprimé le dit (`somme-ecart`), comme aujourd'hui. À relire dans les journaux : lignes marquées « TTC » égales au `price` avec écart de somme.
- Les lectures Flash-Lite qui rangeaient le montant en `price` et la 3.8 qui le range en `amountTTC` (ou l'inverse) s'accordent désormais : moins de 3.8 appelée sur ces pièces (économie, doc4 : 3 → 2 appels). Le vote ne signale plus ce désaccord de rangement.
- `price` négatif (remise) : le montant garde son signe ; `price` 0 donne `amountTTC` 0 (lu, pas inconnu).
- Pas de déploiement ici : `aiTask` en production n'a pas la règle avant redéploiement (accord du brasseur, D254).

CONNAISSANCE : en production, le défaut du 01.11 vient du rangement du montant seul par la 3.8 (`price`, `quantity` et `amountTTC` vides) ; `normalizeInvoiceScan` est le point unique par lequel passent les trois lectures avant le vote, donc le bon endroit pour toute règle de rangement de champ d'une ligne.
LEÇON PROPOSÉE : aucune
