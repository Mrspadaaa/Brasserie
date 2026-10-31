# Revue du plan l2-rapprochement, triée par le pilote (31.10, nuit)

Deux relecteurs neufs : `REVUE-conception.md` et `REVUE-pret.md` (les preuves et le détail y restent). « corrigée » : l'auteur corrige PLAN.md
selon la colonne « Correction attendue », précisée par la Raison et par les décisions ci-dessous, avant toute ligne de code. Quatre
bloquants : le plan corrigé repasse chez **un** relecteur neuf, sur les bloquants seulement, avant le code.

## Ce que le pilote tranche

- **P1, ce qui pèse** (Conception 1, 14 ; Prêt 5, 7). Un tableau dans le plan, une ligne par code (les 14 de l1 et les nouveaux) : `gravite`,
  `origine`, `enjeu`, `bloque`, `pese`, `lu`/`calcule`/`ecart` (`null` pour un texte), `unite`, gabarit du `message`. Principe : **pas de
  régression** ; tout ce qui rendait la lecture `disputed` avant l2 continue de peser (date, total ou montants absents, devise étrangère,
  taux hors plage, avoir, bordereau, forme rejetée, lignes annoncées, unité absente, devis, pro-forma non payée), **sauf** ce qu'A2 vise :
  la remarque libre du modèle et l'absent par nature (HT non imprimé, taux unique sur une facture à deux taux). `type-deduit` (pro-forma payée
  lue « devis », type retenu facture) ne pèse pas, mais reste un point visible, valeur marquée « déduite » avec sa règle. `pese` est posé sur
  chaque point, côté serveur et par le recalcul client (Conception 11) ; le statut est `points.some(p => p.pese)` plus les règles de lecture
  (une seule lecture, coupée).
- **P2, les remarques du modèle** (Conception 2, 3 ; Prêt 1, 6). Elles ne sont jamais jetées. Elles vont dans une liste typée à part,
  `remarques: [{champ, ligne?, lectures: number[], message}]`, hors de `points`, et ne pèsent jamais. Une remarque d'une seule lecture y reste,
  avec `lectures: [n]` ; l'écran choisit ce qu'il montre (règle n° 1 : la couche de données ne tranche pas l'affichage). La règle (i)
  « valeur présente » est retirée. `fieldWarnings` garde son sens actuel (les remarques du modèle), dédoublonnées à une par champ (A1) :
  `invoiceVisionReview.test.ts:16-23` et `facture-372765.test.ts:56` restent verts sans changement.
- **P3, l'ambiguïté d'une ligne** (Prêt 2 ; Conception 3). Une ligne déclarée illisible par une seule lecture est un vrai doute d'argent ou de
  stock : elle déclenche la troisième lecture et pèse, comme aujourd'hui (`invoiceReview.test.ts:150-158` reste vert).
- **P4, le rapprochement des lignes** (Prêt 3 ; Conception 15). Jamais par la seule position : « à égalité, la première » ne vaut que pour des
  candidates identiques sur les cinq champs (les cinq « Zuschlag Schrotung ») ; sinon la ligne n'est pas rapprochée et la phrase
  « rapprochées » reste. Rapprochement partiel : on vote les lignes jointes ; le point `lignes-non-rapprochees` nomme chaque ligne sans
  vis-à-vis (numéro, nom, quantité, montant, valeurs par lecture).
- **P5, la troisième lecture** (Conception 4, 5, 7, 16 ; Prêt 10, 12). D1 est remplacée. La troisième lecture part sur :
  (a) un désaccord entre lectures sur un champ qui compte (nom : seulement s'il s'agit d'un autre mot, pas d'une coquille de distance 1 ou des
  mêmes mots normalisés ; quantité, unité, montant, nature, référence ; montants d'en-tête, date, devise) ;
  (b) un écart `ligne-montant` ou `somme-ecart` quand les lectures divergent sur une des valeurs en cause ;
  (c) une ambiguïté de ligne (P3).
  Elle ne part pas sur un écart où toutes les lectures lisent les mêmes valeurs : le même modèle sur la même image relirait la même chose. Le
  point pèse, et l'écran montre le calcul. Elle ne part pas non plus sur `tvaAmount`, `tvaRate` (`vat[]` porte au moins deux taux), `vat[]`,
  `price` seul, `variant`, `stockCategory`. La règle du « multiple de 5 centimes » et le plafond de 50 centimes disparaissent. La mesure se
  rejoue **avant et après sur le même jeu** (les 14 paires et les nouveaux cas : 16 au moins) ; la phrase sur la somme est corrigée (elle
  partait déjà).
- **P6, la valeur retenue** (Conception 5, 6). Quand deux lectures divergent sur une cellule et qu'une seule tient `quantité × prix = montant`,
  on retient celle-là, motif « recoupée » dans `valeurs`. Une majorité 2 contre 1 sur un champ d'argent ou de stock (montants, quantité, unité,
  date, devise) laisse un point `lectures-divergentes`, `pese: false`, avec les trois valeurs. Les points `name`, `unit`, `variant` et
  `stockCategory` en désaccord portent `enjeu: 'stock'` et `bloque` la liaison automatique au stock.
- **P7, une seule source de règles** (Conception 10 ; Prêt 11). Extension du Possède : un module pur neuf, `functions/src/invoiceControls.ts`
  (sans import `node:`), où l'auteur **déplace** sans les changer `toCents`, `withinRounding`, `lineMathCheck`, `sumCheck` et leurs constantes ;
  `invoiceScanCore.ts` les importe ; le recalcul client les importe aussi (le client importe déjà `functions/src`, `App.tsx:6`). Pas de second
  exemplaire, pas de test de parité ; un test prouve que client et serveur rendent les mêmes points sur les cas de l1. `npm run build` et
  `tsc -p functions` le confirment.
- **P8, le cache d'une lecture coupée** (Conception 9). Extension du Possède à `functions/src/invoiceScanBudget.ts` : un résultat
  `unavailable` dont la cause est une coupe (limite de sortie ou délai) n'est pas servi comme `completed` ; il est marqué dégradé, et le même
  justificatif peut être relu une fois. Le coût d'un essai de plus n'arrive que sur une lecture coupée. Test avec un fournisseur factice.
- **P9, l'inconnu** (Conception 13, 17). `points === undefined` ou `controls === undefined` veut dire « non contrôlé », jamais « aucun point » ;
  le recalcul client les produit pour un ancien résultat ; tant qu'il n'a pas tourné, le statut n'est jamais « vérifié ». `''` devient `null`
  dans `valeurs` ; un `documentTypeRetenu` inconnu retombe sur `documentType` ; le texte d'une valeur est borné côté serveur.

## Conception

| n | Gravité | Constat (preuve) | Correction attendue | Sort | Raison |
|---|---|---|---|---|---|
| 1 | bloquant | Les points « code absent » n'ont pas de gravité : une facture sans date, sans total, en EUR ou un avoir sortirait `checked` ; trois tests exigent `disputed` | tableau code → gravité → pèse ; un test par code ; les trois tests passent sans changement | corrigée | P1 |
| 2 | majeur | La règle (i) écarte une remarque sur un champ vide, que rien ne couvre ; contredit `invoiceVisionReview.test.ts:17-20` | retirer (i) ; dire quelle phrase reste dans `fieldWarnings` | corrigée | P2 |
| 3 | majeur | D2 jette le doute d'une seule lecture, ce qu'il demande de voir | garder la remarque d'une seule lecture, qui ne pèse pas, avec `lectures:[n]` | corrigée | P2 : une liste `remarques` à part, l'écran choisit |
| 4 | majeur | D1 mal fondé (l'arrondi suisse ne fait pas des multiples de 5), plafond de 50 centimes non mesuré | reformuler ; exception seulement sans désaccord de cellule, jamais sans `ecart` ; mesurer | corrigée | P5 : D1 remplacée par la règle « les lectures divergent sur une valeur en cause » |
| 5 | majeur | D6 : la lecture 1 reste retenue même quand la lecture 2 tient le produit ; `variant`, `stockCategory` sans contrôle | retenir la lecture qui tient le contrôle ; `enjeu:'stock'` et blocage de la liaison automatique | corrigée | P6 |
| 6 | majeur | Majorité 2 contre 1 : la valeur minoritaire disparaît | point `lectures-divergentes`, `pese:false`, les trois valeurs, pour les champs d'argent | corrigée | P6 |
| 7 | majeur | Le nom ne déclenche plus la troisième lecture, sans décision écrite | coquille → point ; autre mot → troisième lecture ; deux tests | corrigée | P5 (a) |
| 8 | majeur | Une lecture coupée par le délai n'est pas dite coupée ; troisième lecture sautée sans phrase | `lecture-coupee`, cause `delai` ; phrase et point quand la troisième lecture est sautée ; tests `AbortError` | corrigée | — |
| 9 | majeur | Un résultat `unavailable` coupé est mis en cache comme `completed`, figé | ne pas le servir comme complet, ou le dire au pilote | corrigée | P8 : Possède étendu à `invoiceScanBudget.ts` |
| 10 | majeur | D3 crée un second exemplaire des règles d'argent | module pur commun, ou parité sur cas générés | corrigée | P7 : module pur commun, Possède étendu |
| 11 | majeur | Le statut ne se recalcule pas côté client | `pese` sur le point, posé par le serveur et par le recalcul | corrigée | P1 |
| 12 | majeur | « revu » survit à un autre écart sur la même ligne (`cle` sans valeur) | `signature` des valeurs ; « revu » ne vaut que pour la même signature ; test | corrigée | — |
| 13 | majeur | `undefined` lu comme `[]` : un résultat ancien passerait pour sans doute | contrat « non contrôlé » ; recalcul ; jamais « vérifié » avant | corrigée | P9 |
| 14 | majeur | Les champs obligatoires des nouveaux points ne sont pas donnés | tableau par code : `enjeu`, `bloque`, `lu`/`calcule`/`ecart`, `unite` | corrigée | P1 |
| 15 | majeur | Alignement tout ou rien : une ligne manquante fait perdre les 22 autres | rapprochement partiel ; lignes orphelines nommées ; test 23 contre 22 | corrigée | P4 |
| 16 | détail | D5 incohérente : `tvaAmount` et `tvaRate` déclenchent encore | dire pourquoi ou retirer ; `tvaRate` ne déclenche pas avec deux taux | corrigée | P5 : retirés |
| 17 | détail | `''` contre `null` ; `documentTypeRetenu` inconnu ; texte non borné | test `''` → `null` ; repli ; longueur maximale | corrigée | P9 |
| 18 | détail | Le chemin à une seule lecture garde toutes ses remarques, sans tri | même tri par champ, ou dire l'exception ; test | corrigée | même tri (P2) |
| 19 | détail | Le garde-fou « troisième lecture qui échoue » est inatteignable | le tester par le chemin réel (sautée ou coupée), ou le retirer | corrigée | — |

## Prêt à coder

| n | Gravité | Constat (preuve) | Correction attendue | Sort | Raison |
|---|---|---|---|---|---|
| 1 | bloquant | `facture-372765.test.ts:56` rougirait : la remarque `invoiceNumber` des trois lectures deviendrait un point | règle compatible, ou changement annoncé | corrigée | P2 : les remarques vont dans `remarques`, pas dans `points` ; le test reste vert ; le cas entre dans `points-uniques` |
| 2 | bloquant | `invoiceReview.test.ts:150-158` : l'ambiguïté d'une seule lecture doit déclencher la troisième lecture et peser | aligner le plan sur le test | corrigée | P3 |
| 3 | bloquant | `invoiceReview.test.ts:179-188` : deux « Fermenteur » aux quantités échangées seraient alignés par égalité | pas de rapprochement à égalité sauf candidates identiques ; test | corrigée | P4 |
| 4 | majeur | Le gabarit du message d'un désaccord perd « lectures divergentes » et « Montant TTC » | gabarit exact qui contient `${libellé} : lectures divergentes` et le nom de la ligne ; deux tests ajoutés à la liste à garder | corrigée | — |
| 5 | majeur | Gravité des neuf codes non donnée ; cinq tests exigent `disputed` ; `type-deduit` à trancher | tableau ; `type-deduit` tranché | corrigée | P1 : `type-deduit` ne pèse pas, reste visible |
| 6 | majeur | `invoiceVisionReview.test.ts:16-23` changerait | liste des assertions modifiées, ou garder la remarque | corrigée | P2 : `fieldWarnings` garde les remarques, le test reste vert |
| 7 | majeur | Fabrication des nouveaux points non spécifiée (`makePoint` non exportée, `origine` sans valeur pour un désaccord, `champ` d'une ligne) | tableau par code, lieu du constructeur, `orderNumber` et `proForma` dans `fieldWarnings` | corrigée | P1 ; l'auteur exporte `makePoint` (extension des types permise) et ajoute l'origine `'lecture'` |
| 8 | majeur | Le recalcul client ne sait pas retrouver le rang après suppression ou réordonnancement | rang par `id` ; point retiré si sa ligne a disparu ; gabarit du message ; test « ligne supprimée » | corrigée | — |
| 9 | détail | Bench, `jus0Journey` et `inventaire-ecrans` non nommés ; mocks mal décrits | compléter la liste ; signature de `reconcileInvoiceVision` inchangée | corrigée | — |
| 10 | détail | La somme partait déjà ; avant et après sur deux jeux différents | même jeu (16 paires) ; phrase corrigée | corrigée | P5 |
| 11 | détail | La table de cas de parité n'existe pas ; mock d'`aiClient` | table écrite ; mock noté | corrigée | P7 : sans parité ; le mock d'`aiClient` reste à noter |
| 12 | détail | Seuils non finis (`ht-tva-ttc`, ordre de `vat[]`, pro-forma lue « invoice ») | trois points complétés | corrigée | P5 pour (a) ; `vat[]` comparé trié par taux ; entrées du test R3 fixées |
| 13 | détail | Les nouvelles phrases passent par `invoiceFieldHints`, rangées par regex | assertion : chaque phrase sous le bon champ | corrigée | — |
| 14 | détail | Référence fausse pour `invoice-v5` | corriger la référence (`purchaseEntry.ts:428`) | corrigée | — |
