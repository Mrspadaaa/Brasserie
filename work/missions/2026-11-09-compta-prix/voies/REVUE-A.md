# REVUE A — justesse métier et calcul (plans d1, d3, f1), 09.11

Relu sans mémoire : COMMUN.md, VOIE/PLAN/RESULTAT de chaque voie, PLAN-METIER, INVENTAIRE-CODE (problèmes 3, 4, 9-16, 21, 27, 28), code visé
(`swissBeerTax.ts`, `alcohol.ts`, `brewBudget.ts`, `forecast.ts`, `annual.ts`, `upgrades.ts`, `types.ts`, `swissQrBill.ts`, `ledger.ts`, `BrewBudgetDialog.tsx`,
`seedData.ts`, validateur `swissqrbill` 4.4.1). Calculs rejoués en Node (hors dépôt). Gravité : B bloquant, G grave (à corriger avant le code ou dans le code),
D détail. Les barèmes LIB (16,88 / 25,32 / 33,76, bornes 10,0 / 14,0 °P) et la réduction OIBi ne sont **pas vérifiés** par moi à la source officielle.

| Plan | Verdict |
|---|---|
| d1 | **OK avec réserves** (5 G, 3 D) |
| d3 | **OK avec réserves** (6 G, 4 D) |
| f1 | **OK avec réserves** (2 G, 3 D) |

Décision pilote « l'usure n'est comptée qu'une fois » : voir D3-2 et D3-3 (elle n'est portée par aucun plan telle qu'écrite, et elle ouvre une
contradiction avec P2). Les trois écarts de d3 au PLAN-METIER : **acceptés**, sous les réserves D3-7 et D3-4 (détail en fin de section d3).

---

## d1 — chaîne litre → format, impôt bière

Vérifié juste : 202,77 ÷ 27 = 7,51 ; (202,77 − 24,00 − 6,84) ÷ 27 = 6,3678 ; 6,3678 × 0,33 + 24 ÷ 81,82 + 0,0836 = 2,478 → 2,48 (recoupe 7,51 × 0,33) ;
12 °P : 0,266 × 25,32 = 6,735 → 6,74 et 0,27 × 25,32 = 6,836 → 6,84 ; fourchette 27 L : 4,56 / 9,12 ; 33 cl 0,0836, 75 cl 0,1899, fût 20 L 5,064 ; la correction
« deux litres, complet et liquide » (constat 2 du plan) est exacte et PLAN-METIER § 3.1 doit être corrigé dans ce sens ; ordre des litres « conditionné réel > enregistré > attendu » : bon métier.

**D1-1 (G) — le litre arrondi nourrit le format.** PLAN §2.3 : `coutLitre` rend `round2(…)` (6,37), mais le test « format 33 cl » (§3) part de « liquide 6,3678 ».
Contradiction : si `coutFormat` reçoit le 6,37, un fût de 20 L vaut 127,40 au lieu de 127,36 (+0,044 CHF) et l'« arrondi final unique » (§5) n'est pas tenu.
Attendu : `coutLitre` rend la valeur exacte (et un champ d'affichage arrondi à part) ; `coutFormat` ne reçoit jamais un litre arrondi ; test fût 20 L : 127,356.

**D1-2 (G) — « trois notions = totalCost » n'est pas garanti au centime.** `brewBudget.ts:377` somme `operatingCost` **non arrondi** (`amountTTC / (1 + rate)`, assujetti :
8,00 ÷ 1,081 = 7,4006) ; `totalCost` (`:394`) = `money(ingredientsCost + operatingCost + fixed + dépréciation)` sur ce brut, alors que `operatingCost` exposé est `money(...)`.
`aPayer = Σ purchaseCost + operatingCost` arrondi à part peut donc s'écarter de 0,01 de `totalCost − dejaPaye − annee`. Le test « TVA assujetti » (§3) ne vérifie que « écart expliqué ».
Attendu : définir `aPayer` comme le reste (`totalCost − dejaPaye − annee`, en centimes entiers) ou arrondir chaque poste avant la somme ; test d'égalité exacte sur un cas assujetti à 8,1 % avec énergie, nettoyage, emballage.

**D1-3 (G) — `aPayer` est un coût, l'écran dit « À payer » (de l'argent).** `brewBudget.ts:374` : un frais `included-in-recurring` ne sort pas de caisse mais reste dans `operatingCost`
(donc dans `aPayer`) ; assujetti : `aPayer` en HT, argent en TTC ; sac entier : argent > coût. Le bloc jaune de c3a (« À payer 64,26 ») doit lire `cashRequiredTTC`, pas `aPayer`.
Attendu : renommer (`aPayerCout`, ou doc-commentaire explicite sur le champ) et un test « frais inclus dans le récurrent » : `aPayer` inchangé, `cashRequiredTTC` plus bas.

**D1-4 (G) — le repli « litres nets = volume à brasser » reste silencieux.** `brewBudget.ts:380` `netVolumeL = input.netVolumeL ?? recipe.volumeL` (plan constat 4 : « volume à brasser, pas un net »).
Exemple : 30 L brassés, 27 L nets : 202,77 ÷ 30 = 6,76 au lieu de 7,51 (−10 %), et l'impôt calculé sur 30 L (7,60 au lieu de 6,84). Le plan n'ajoute aucun marquage.
Attendu : `netVolumeSource` dans l'instantané et une `issue` (« litres nets estimés sur le volume à brasser ») ⇒ `complete` faux ; l'écran dit « estimé » (inconnu ≠ valeur flatteuse).

**D1-5 (G) — l'exonération ≤ 0,5 % vol. disparaît sur le chemin du budget.** `beerTaxForVolume({ og?, plato?, litres, reductionPct? })` n'a pas d'entrée `abv` alors qu'il rend `exonere` ;
le test « ≤ 0,5 % » est listé sous `swissBeerTax` sans dire par quelle fonction. Un brassin sans alcool (`Batch.nolo` existe, `types/index.ts`) passant par `estimateBrewBudget` se verrait compter 6,84 CHF d'impôt.
Attendu : paramètre `abv?` (ou `exonere?`) sur `beerTaxForVolume`, passé par `estimateBrewBudget` ; test budget NoLo : impôt 0, `beerTaxSource: 'calcule'`, exonéré (cas connu, pas inconnu).

**D1-6 (D) — « 12 °P » est faux pour l'OG 1,048.** `platoFromSg(1,048)` = 11,912 → 11,9 °P (même palier 25,32, donc les montants tiennent). Les libellés de tests « 12 °P » doivent passer `plato: 12`
ou dire « 11,9 °P » ; la fixture du brief porte la même erreur (p2b affichera 11,9).

**D1-7 (D) — base HT de l'emballage par format.** `coutFormat({ emballageUnite })` : pour un assujetti le coût est HT (`brewBudget.ts:372-377`) ; l'entrée doit dire HT/TTC ou la voie documenter « HT si assujetti ». Sinon marge de format fausse de 8,1 % sur la part emballage.

**D1-8 (D) — arrondi du °P à 0,1 avant le palier** (`swissBeerTax.ts:32`, repris par le plan) : 10,04 °P devient 10,0 et tombe au palier bas 16,88. Conservé tel quel ; à confirmer à la source (borne et pas de mesure) avec le barème. Aussi, `volumePackagedL` n'est pas « dérivé de `packaging` »
en pratique (`BatchPackagingForm.tsx:31` écrit le volume saisi) : le constat 5 du plan est sans conséquence mais inexact.

---

## d3 — `mesurerAchat`

Vérifié juste : tests 1, 4, 5, 6, 7, 8, 9 (arithmétique rejouée : 300 000 ÷ 252 → 1 191, 393,0 L, 600 si tout est marge ; points bas −150 000 / −50 000) ; le décalage constant du cumul est **exact** :
dans `forecast.ts`, l'ajout d'un plan `equipment` ne modifie ni la tendance (`isResidualExpense` exclut `materiel`/`equipment`, `:52-56` ; `coveredByPlans` ne lit que `manual`/`recurring`, `:177`) ni les autres items ;
les soldes sont une somme cumulée (`:196-205`) : rejouer `buildForecast` n'apporterait rien.

**D3-1 (G) — le test 10 est faux.** Fixture : fév 400 000, mar 450 000, achat 300 000. `pointBas(mars) = 450 000 − 300 000 = 150 000`. Avec « seuil 150 000 » et la règle « ≥ seuil » (§3.4.5),
`meilleurMois` = mars, pas `null`. Un code juste échouerait. Attendu : seuil 150 001 (ou 200 000) pour le cas `null`, et un cas limite « = seuil » → mois retenu.

**D3-2 (G) — usure unique : la substitution « actif remplace projet » change de méthode.** `BrewBudgetDialog.tsx:21-25` donne au litre l'amortissement **fiscal** `depreciationForYear` des actifs. Pour le frigo à 3 000 : projet = 600 CHF/an linéaire (0,50 CHF/L) ;
actif « production » AFC 30 % dégressif = 900 CHF la 1re année (0,75 CHF/L), puis décroissant. Le coût du litre saute le jour de l'achat, et P2 (« litre : usure linéaire sur durée ; Annuel garde l'AFC ») est violé.
`FinancialAsset` (`types.ts`, ~l.130-150) n'a pas de durée ; les trois champs de d3 vivent sur `EquipmentUpgrade` seulement ; « reprise de la catégorie à l'achat » est laissée à l'UI (§8).
Attendu : trancher avant d2/uc — soit `FinancialAsset.usefulLifeYears?` (d3 possède `types.ts`) et une fonction pure exportée `usureAnnuelleCents` (actif : `acquisition × usage pro ÷ durée`, projet : base ÷ durée) que d1/d2 appellent pour le litre,
soit on accepte l'AFC pour le litre (P2 réécrit). Aujourd'hui personne ne possède « le projet futur porte une usure estimée dans le litre » : d3 la calcule (`usureParAnCents`) mais ne l'exporte pas pour d1/d2, et d1 n'en parle pas.

**D3-3 (G) — le déclencheur « plus de facture ni d'actif » ≠ la décision du pilote.** PLAN d3 §6 : l'usure du projet ne compte que « tant qu'aucune facture ni actif n'y est lié ». Décision : l'actif la remplace.
Entre la facture et la saisie de l'actif (`AssetSheet`) l'usure disparaîtrait du litre (aucune des deux), puis l'actif saisi tard rétroagirait. Attendu : l'usure du projet s'arrête quand un `FinancialAsset` lié existe
(`asset.transactionId` d'une pièce dont `finance.planId` = le projet, ou `equipmentRef`) ; facture sans actif = l'usure du projet continue et l'écran signale « actif à créer ». Test dédié (projet seul / facture seule / facture + actif : une seule usure à chaque fois).

**D3-4 (G) — TVA : le coût à rattraper est en TTC, le prix du format en HT.** `AchatMateriel.coutInitialCents` TTC ; `ventes` = `⌈coutInitialCents ÷ marge⌉` avec marge = prix HT − coût HT (assujetti). La TVA préalable est récupérée : à rattraper = `baseUsureCents` (HT).
Exemple : 3 000 TTC → 2 775,21 HT ; ÷ 2,52 = 1 102 bouteilles, pas 1 191 (+8,1 %). Par défaut `baseUsureCents = coutInitialCents` fait payer la TVA au brasseur sans le dire.
Attendu : entrée `assujettiTva: boolean` ; si vrai et `baseUsureCents` manquant, usure et ventes = `null` (jamais le TTC par défaut) ; `ventes` utilise `baseUsureCents ?? coutInitialCents` ; test assujetti à 8,1 %.

**D3-5 (G) — la « marge » est après charges fixes et usure déjà réparties.** Le coût du litre 7,51 contient 116,10 CHF d'« année » sur 202,77 (57 %). Marge 33 cl = 5,00 − 2,48 = 2,52 → 1 191 bouteilles ; sur le coût variable seul (6,3678 − 4,30 d'année par litre → 33 cl ≈ 1,06),
la marge serait ≈ 3,94 et ≈ 761 bouteilles. P3 (« sur la marge ») est respecté, mais la lecture « combien de bouteilles pour payer le frigo » est prudente (sur-estimée de 36 % ici) sans que rien ne le dise.
Attendu : nommer le chiffre (« marge après tous les coûts du litre ») dans `MesureAchat`/l'avertissement ; si d1 peut rendre le coût variable d'un format, ajouter `margeVariableCents` en second. Décision à confirmer par le pilote, pas à cacher.

**D3-6 (G) — `ventesPrevuesIncluses` est vrai dès qu'une facture client est à encaisser.** `forecast.ts:78-79` pousse en `direction: 'in'` toute pièce due ; `prevision.items.some(i => i.direction === 'in')` passe à vrai avec une seule facture de 50 CHF, alors que la prévision
n'a aucune vente projetée (B4). L'avertissement « le solde ne peut que baisser » disparaît alors à tort. Attendu : critère = entrées de source `plan`/`recurring` (ou futur champ B4) et, à défaut, avertissement tant que
Σ entrées < Σ sorties ; nommer le champ `encaissementsPrevusCents` plutôt qu'un booléen « ventes ».

**D3-7 (G) — `coutLitreCents` « sans ce matériel » : contrat à écrire.** Avec la décision pilote, les brassins datés après la mise en service portent l'usure du projet (d1/d2) : le `costPerL` que l'écran passe à `mesurerAchat` peut déjà la contenir ⇒ `coutLitreAvecCents` la compte deux fois,
et la marge aussi. Le plan l'écarte pour le coût de format seulement. Attendu : doc-commentaire `coutLitreCents` « hors usure de CE projet », test de l'appelant dans d2, et un paramètre commun `ignorerPlanId` côté d2/d1 pour exclure l'usure du projet évalué.

**D3-8 (D) — `part dans le litre` arrondie au centime.** `Math.round(usure ÷ production)` : 42 857 ÷ 1 200 = 35,7 → 36 c/L, soit +3,6 CHF/an d'erreur (jusqu'à 6 CHF à 1 200 L). Garder le CHF/L exact (ou en millièmes de centime), arrondir à l'affichage seulement.

**D3-9 (D) — validation de durée.** §3.2 dit « entier ou demi-année » (§3.1) mais `validateUpgrade` ne vérifie que [1 ; 50] et fini. Aligner (modulo 0,5) ou retirer la phrase.

**D3-10 (D) — `ignorerPlanId` et factures liées.** Les items `source: 'invoice'` portant `planId` du projet (reste dû d'une facture de matériel déjà reçue) sont aussi retirés par le critère `planId === ignorerPlanId` : voulu, mais non testé. Ajouter le cas « facture frigo due en mars ».

**D3-11 (D) — TVA préalable non modélisée dans la trésorerie.** Pour un assujetti, la TVA du frigo (≈ 225 CHF sur 3 000) revient au décompte suivant : le point bas est trop bas d'autant. À signaler en avertissement (comme les soldes de fin de mois).

Écarts au PLAN-METIER : (1) `upgradeBudget` au lieu de `simulateBreweryInvestment` : accepté (exceptions et note d'hypothèse de la simulation IA, fonction non modifiée, aucun doublon de somme). (2) décalage constant : accepté, exact (voir plus haut). (3) coût du litre sans le matériel : accepté, sous D3-7 et D3-5.

---

## f1 — QR-facture, numéro continu

Vérifié juste : échéances du test 8 (30 j depuis le 25.12.2026 → 24.01.2027 ; 15.02.2028 → 16.03.2028, bissextile) ; 105 × 0,081 = 8,505 → 9 et 210 × 0,081 = 17,01 → 17 (18 contre 17 : « TVA par ligne » assumée) ;
la TVA par ligne `Math.round(netCents × 0,081)` coïncide avec l'arrondi entier demi-supérieur sur 1 à 2 000 000 ct (0 écart) ; A4 : 297 − 105 = 192 mm ; 600 ppp = 4 960 × 2 480 px (12,3 Mpx < 16,7 Mpx iOS) ;
norme 2.3 : adresse structurée seule, NPA/localité/pays/nom obligatoires, rue et n° facultatifs (cité de la source par l'auteur, cohérent avec mes connaissances) ; limites de champs (70/70/16/16/35) ; SCOR ≤ 25 car. (RF + 2 + corps ≤ 21) et QRR 26 + 1 chiffres ; QRR par année + séquence sans collision
(séquence 4 à 6 chiffres, année à 4).

**F1-1 (G) — `toCents` ne tient pas son rôle de demi-centime.** PLAN §2.1.7 corrige « 1 × 1,005 = 101 » par `toCents` de `ledger.ts:5` (`Math.round((v + Number.EPSILON) × 100)`). Rejoué : sur 20 000 valeurs de la forme x,xx5, **1 132 échouent**
(2,135 → 213 au lieu de 214 ; 2,175 → 217 ; 4,015 → 401 ; 4,145 → 414) : `Number.EPSILON` n'agit qu'au voisinage de 1. Un brasseur facture 3 × 0,355 ou 12 × 4,5125 : le net est faux d'un centime sur ~5 % des demi-centimes, hors du seul cas du test.
Attendu : une aide locale décimale-sûre dans `swissQrBill.ts` (`Math.round(Number((quantité × prix × 100).toFixed(6)))` ou entiers) sans toucher `toCents` (hors Possède) ; le test 19 ajoute 2,135 et 4,015 (attendu 214 et 402).

**F1-2 (G) — le gabarit de `seedData` passerait le contrôle d'adresse.** `seedData.ts:37-38,41` : « Rue de l’Exemple 1 », « 1000 Ville », UID « CHE-XXX.XXX.XXX ». Le plan (§5) écrit que la valeur factice est « refusée » parce que `problemesAdresse` rejette la localité *vide* : or « Ville » n'est pas vide
et `adresseDepuisTexte` découpe ce texte en rue « Rue de l’Exemple », n° 1, NPA 1000, localité « Ville ». Une facture réelle porterait un QR au nom d'une adresse bidon, lisible par la banque.
Attendu : `problemesAdresse(…, 'brasserie')` refuse les valeurs du gabarit (localité « Ville », rue contenant « Exemple », NPA 1000 + Ville) ; test : créancier tiré du seed → refus avec le mot « Réglages ». Le pré-remplissage de uv depuis `adresseDepuisTexte` ne doit pas contourner ce refus.

**F1-3 (D) — borne du montant.** Plan : « ≤ 12 chiffres ». Le validateur (`validator.js:115`) exige `amount.toFixed(2).length ≤ 12` : maximum 999 999 999,99, soit 11 chiffres de centimes (99 999 999 999). Aligner le contrôle (sinon un message générique de la bibliothèque) et le tester.

**F1-4 (D) — `adresseDepuisTexte` et « Case postale 123 ».** `^(.*?)[ ,]+(\d+\s?\w?)$` rend rue « Case postale », n° « 123 » : une boîte postale imprimée comme numéro de bâtiment. À écrire en test (attendu : `null` ou rue complète sans numéro) ; NPA à 4 chiffres seulement (CH/LI) : un client à l'étranger rend `null` et le dit en clair, pas une adresse tronquée.

**F1-5 (D) — fond du PNG.** Le SVG de `SwissQRBill` est rasterisé sans fond ; `drawImage` sur canvas transparent puis `addImage` : prévoir un `fillStyle = '#fff'` explicite avant le dessin (certains lecteurs bancaires lisent mal un QR sur fond transparent noirci). Non testable en Vitest : au geste du pilote, avec la lecture téléphone déjà prévue.

Décisions : D2 (rue obligatoire pour la brasserie, plus strict que la norme) : **d'accord**, P7 le demande ; D3 (type local) : d'accord. Numérotation (année du jour d'émission, annulées comptées, doublons signalés, jamais renumérotée) : juste.

---

LEÇON PROPOSÉE : un test de seuil se vérifie à la main sur sa fixture avant d'être écrit (D3-1) ; et un arrondi « au demi-centime » se prouve sur des valeurs en x,xx5 en JS (F1-1), pas sur le seul exemple du brief.
