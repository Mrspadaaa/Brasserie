# Plan de la voie ue — port de c7c (Prix) et de e3a (Argent du brassin) ; Clients › Impôt bière

Étape 1 : ce plan seul, aucun code. Sources lues : `VOIE.md`, `voies/COMMUN.md`, `p4/c7c/{etat.html,NOTE.md,c7c-page.png}` (ouverte), `p3/c5b/NOTE.md`, `p4/e3a/{etat.html,NOTE.md,e3a-page.png}` (ouverte),
`p2/e1b/NOTE.md`, `voies/d1/RESULTAT.md`, `voies/uc/RESULTAT.md`, `voies/up/RESULTAT.md`, `voies/uv/{RESULTAT,DECISIONS}.md`, `voies/pv/DECISIONS.md`, `INVENTAIRE-CODE.md` (problèmes 3, 4, 18, 19, 28 ; § 6),
`MISSION.md` (« État de l'art »), le code des fichiers possédés et de leurs voisins (`chaineLitre.ts`, `ImpotBiereSheet.tsx`, `formatsVente.ts`, `brassinsVendables.ts`, `brewForecast.ts`, `escalier.ts` de pv).
Les captures de e3a et c7c sont ouvertes une fois ici pour l'inventaire ; elles se rouvrent côte à côte avec l'app à l'étape 2.

## 0. Ce que je porte, et ce qui contredit la consigne

- **c7c** = l'écran Prix : bière + format en tête, « Il te reste 2,52 CHF par bouteille » avec l'autre lecture (« 9 162,72 par an ⇄ ») dessous, **un seul graphe** (colonnes pâles à perte / mince / il te reste, pente verte, aiguille noire au prix, deux échelles /an et /bouteille côte à côte à gauche), règle à bandes, coût 2,48 · 7,51 CHF/L ›, ligne brassin (27 L nets · 41 paient · 40 pour toi), deux tuiles 75 cl et fût, « Proposer » et « Changer le prix ».
- **e3a** = l'entrée depuis la fiche du brassin : un onglet **Argent**, six marches numérotées, chacune avec l'image de l'écran choisi (① c3a, ② p2b, ③ bouteille en tranches, ④ règle du prix, ⑤ reste avec bascule, ⑥ brassin en 81 bouteilles) ; toucher une marche ouvre son écran entier. État 2 : brassin planifié, mêmes marches avec « ? », « ≥ » et « ≤ ».
- **Contradiction relevée (D1)** : e1b/e3a disent « Clients ne garde que ses clients » (le Prix et l'Impôt vivent dans le brassin), alors que la maquette c7c est dessinée *dans* Clients (rail « Carnet · Prix · Impôt bière », Clients allumé) et que `VOIE.md` demande « c7c remplace Clients › Prix et marges » et « Clients › Impôt bière refait ». Je planifie **deux portes, un seul composant** : `PrixEcran` s'ouvre dans Clients › Prix (la liste de toutes les bières, que e1b dit perdre) et depuis les marches ④⑤⑥ d'Argent. Rien n'est retiré de Clients (réversible). Le pilote tranche.
- **Pas de maquette** pour l'écran Clients › Impôt bière de l'année (p2b est une feuille par brassin ; sa NOTE dit « l'impôt vit dans le brassin, pas dans Clients »). Règle n° 1 et L24 : je ne dessine rien. Plan minimal sans invention (D2) : l'année = total des brassins + liste, chaque ligne ouvrant la feuille p2b, dans les classes `ibr-`.

## 1. Inventaire de c7c, élément par élément, et son port

Légende : **S1** = repos, lu « par bouteille » ; **S2** = « par an » touché.

| # | Élément de la maquette | S1 / S2 | Port (fichier) | Donnée et source |
|---|---|---|---|---|
| 1 | Sélecteur de bière « Pale Ale ⌄ » | idem | `PrixEcran.tsx` : menu des bières ayant au moins un brassin ou une recette | noms de `batches` (plus récent d'abord) ; une seule bière : pas de chevron |
| 2 | Segment format 33 cl · 75 cl · Fût 20 L, actif noir | idem | `PrixEcran.tsx`, ids `33cl/75cl/fut` de `FORMATS_VENTE` (`vente/formatsVente.ts`) ; fût = capacité réelle des fûts du brassin (`formatsDuBrassin`), sinon « à vérifier » | formats uv, lus pas copiés |
| 3 | « Il te reste **2,52** CHF par bouteille » (42 px, vert) | S2 : « Il te resterait **9 162,72** CHF par an » (34 px) | `PrixEcran.tsx` + `calculPrix.ts` | reste = prix HT − coût du format ; par an = reste affiché × unités/an |
| 4 | Pastille bascule « 9 162,72 par an ⇄ » sous le chiffre (S2 : « 2,52 par bouteille ⇄ ») | idem | `<button>` ≥ 34 px ; `aria-pressed` ; pas de deuxième bascule ailleurs | — |
| 5 | « 50 % du prix » (S1) / « si 1 200 L en 33 cl · estimé » (S2) | idem | texte ; l'hypothèse est écrite chaque fois que l'annuel est lu | `profile.annualProductionL` ; absent → pas de lecture annuelle (pas de pastille), jamais 0 |
| 6 | Graphe SVG unique : 3 colonnes pâles, pente rouge puis verte, point d'équilibre blanc/rouge à 2,48 | idem | `GraphePrix.tsx` (SVG pur, `viewBox` 390 × 318 puis 700 × 571 à 1280) | coût du format = point d'équilibre ; zéro tracé |
| 7 | Deux échelles côte à côte à gauche : « /an » dehors, « /bouteille » contre l'axe, échelle lue en gras, crans verts 0·5 k·10 k·15 k | S2 : /an en gras, axe vert | `GraphePrix.tsx` ; graduations 1-2-5 (Heckbert) par `graduations` de pv (voir § 11) ; cran /an = cran /bouteille × unités/an | — |
| 8 | Aiguille noire franche de la règle au point, ligne pointillée jusqu'à l'axe, étiquette noire « 2,52 » (S2 « 9 162,72 ») | idem | `GraphePrix.tsx` | prix du tarif ; **sans tarif : pas d'aiguille** (cas neuf, § 1 bis) |
| 9 | Deux points voisins étiquetés (2,02 · 3,52 ; S2 7 344,72 · 12 798,72) aux crans 4,50 et 6,00 | idem | `GraphePrix.tsx`, `placerEtiquettes` de pv si disponible (sinon étiquettes à gauche du point comme la maquette) | **non sourcés** dans la maquette (« exemple ») : D6 |
| 10 | Bulle « +0,10 → +363,60 /an » dans le coin vide | S2 idem | `GraphePrix.tsx` | 0,10 × unités/an (3 636) ; absente si l'annuel est inconnu |
| 11 | Règle à bandes sous le graphe : à perte (sous le coût) · mince (« ⅓ ex. ») · il te reste ; graduations 0·1·2·3·7 ; pastille noire « 5,00 ex. » | idem | `GraphePrix.tsx` | seuils : coût ; coût ÷ (1 − ⅓) = 3,72 (« mince » = moins d'un tiers du prix reste) ; **⅓ = constante de la maquette, dite « ex. »** (D7) |
| 12 | « coût 2,48 » + lien « 7,51 CHF/L › » | idem | `PrixEcran.tsx` : le lien ouvre c3a (`BrewBudgetDialog`) | coût du format = `coutFormat` (d1) ; 7,51 = `coutLitre.affiche.complet` |
| 13 | Ligne brassin : « 27 L nets » + barre 81 cases noir / vert + « 41 paient le brassin · 40 pour toi » | idem | `PrixEcran.tsx` + `calculPrix.ts` | n = ⌊litres nets ÷ volume⌋ (ou le conditionné réel si le brassin est tout dans ce format) ; paient = ⌈coût du brassin ÷ prix⌉ en centimes ; « estimé » si n est déduit |
| 14 | Tuiles 75 cl (10,00 ex. · ≤ 5,03) et fût (160,00 ex. · ≤ 27,54) ; par an : ≤ 8 048,00 · ≤ 1 652,40 | S2 : chiffres annuels | `PrixEcran.tsx` | prix du tarif de ce format, sinon « prix ? » ; « ≤ » tant que l'emballage de l'unité est inconnu (reste ≤ prix − (litre liquide × volume + impôt)) |
| 15 | « Proposer » (bleu, étincelle) | idem | ouvre `BrewerChat` (scope `app`, `clients-tarifs`) avec la question prête, **non envoyée** (même geste que « Expliquer » de uc) ; Gemini simulé en test | — |
| 16 | « Changer le prix » (primaire noire, seule) | idem | ouvre `TarifSheet` refait (§ 5) | — |
| 17 | Cadre de l'app : en-tête, rail « Carnet · Prix · Impôt bière », barre du bas, FAB | idem | non porté (cadre de l'app, déjà là) ; **rail** : libellés « Prix et marges » → « Prix », « Impôt sur la bière » → « Impôt bière » (shortLabel déjà présent) ; « Clients » reste (la maquette dit « Carnet » : écart listé) | — |
| 18 | 1280 dessiné : graphe 700 px à gauche, tête et reste à droite | — | `prix.css` (grille ≥ 1000 px) | — |

### 1 bis. Cas neufs, rangés dans un état de c7c (pas de composant neuf)

| Cas | Rangé dans | Rendu |
|---|---|---|
| Aucun tarif pour (bière, format) | S1 | pas d'aiguille ni de reste ; la tête dit « Pas encore de prix » à la place de 2,52 ; « Changer le prix » devient « Fixer le prix » ; la règle et le coût restent |
| Coût inconnu (aucun brassin chiffré, impôt sans densité, litres nets inconnus, prix d'un stock manquant) | S1 | coût « ? » hachuré comme p2b/c4a, aucune colonne « à perte / mince », « il te reste ≤ … » seulement si un majorant existe ; jamais 0 |
| Emballage de l'unité inconnu | S1/S2 | « ≤ » devant le reste (comme les tuiles de la maquette) |
| Annuel inconnu (`annualProductionL` absent) | S1 | pas de pastille « par an », pas d'échelle /an, pas de bulle +0,10 ; une ligne « volume annuel à renseigner » |
| Format absent du brassin (0 bouteille de 75 cl) | S1 | tuile atténuée (comme `formatsDuBrassin.present`) |
| Assujetti à la TVA | S1 | libellés « HT » ; coût et prix en HT ; TTC en lecture dans la feuille du prix |
| Reste négatif | S1 | la tête passe au rouge de la colonne « à perte », « Il te manque 0,30 » (mot du métier) ; l'aiguille tombe dans la colonne rouge |
| Plusieurs tarifs candidats (doublon) | S1 | `tarifDuFormat` rend `null` : « plusieurs prix pour ce format » + « Changer le prix » ouvre la liste (feuille) |

## 2. Inventaire de e3a (onglet Argent), élément par élément

| # | Élément | S1 (conditionné) / S2 (planifié) | Port |
|---|---|---|---|
| 1 | Rubrique « Argent » dans le rail de la fiche | — | `BatchDetailSheet.tsx` : 4e rubrique (`grid-cols-4`), union locale `BatchDetailSection \| 'argent'` ; `productionInsights.ts` (hors Possède) intact |
| 2 | Fil « ‹ Pale Ale de septembre » + puce « planifié » | S2 | déjà dans l'en-tête de la fiche ; la puce est l'état du brassin existant |
| 3 | Encart « Dans Prévisions : 57,42 avant le 20 nov. · 6,84 en déc. » | S2 seulement | `ChaineArgent.tsx` ; **lit `estimerBrassinsPlanifies` (d2)**, pas les chiffres de la figure : la maquette corrige elle-même 64,26 → 57,42, et c3a (uc) dit « 64,26 = 33,42 avant le brassage + 30,84 plus tard ». Je prends ce que Prévisions affichera (D3) |
| 4 | ① Litre 7,51 CHF/L + barre payé 0,83 · à payer 2,38 · année 4,30 (S2 « ≥ 7,51 », hachures « houblon, levure ? ») | idem | `ChaineArgent.tsx` ; `troisNotions` + `coutLitre` de d1 ; toucher = `BrewBudgetDialog` (c3a) |
| 5 | ② Impôt, 12 °P ex. : 0,08 / 33 cl, règle 16,88 · 25,32 · 33,76, curseur, « le brassin 6,84 » (S2 « · sortie de cave ») | idem | `baseImpot` + `beerTaxPerFormat` + `classesBareme` (up, d1) ; toucher = `ImpotBiereSheet` |
| 6 | ③ Segment 33 cl · 75 cl · fût, « coûte 2,48 », barre bière 2,10 · verre 0,30 · impôt 0,08 | S2 « ≥ 2,48 » | `coutFormat` ; « verre 0,30 » = emballage de l'unité (D4) ; la bière = litre liquide × volume |
| 7 | ④ « Vendue, exemple 5,00 », règle à perte · mince · il te reste, curseur | idem | prix du tarif ; **« exemple » n'est écrit que si le prix n'est pas celui d'un tarif** ; sans tarif : « prix ? » ; toucher = `PrixEcran` |
| 8 | ⑤ « Il te reste 2,52 / 33 cl », bascule « bouteille · an · 9 162,72 », « 50 % » (carte verte) | S2 « ≤ » | même `calculPrix.ts` que c7c ; la bascule est la même et mémorise la lecture dans `ui_state` (`prix_lecture`) |
| 9 | ⑥ « Brassin, 27 L » : 202,23 CHF, 81 cases, « 41 paient 202,77 · vendu 405,00 » (S2 « 27 L prévus », « ≤ 202,23 ») | idem | idem |
| 10 | « Proposer » (primaire noire flottante) | idem | même geste que c7c 15 (une seule primaire de l'onglet) |
| 11 | 1280 : la chaîne en deux colonnes | — | `prix.css` |
| 12 | Cadre : en-tête, barre du bas, FAB | — | déjà l'app |

Écart de structure à lister (D1 bis) : la maquette montre « Recette · Déroulé · Argent » ; la fiche réelle a « Mesures · Carnet · Dossier ». J'**ajoute** Argent et je **retire du Dossier** les deux entrées qu'il remplace (`BrewBudgetButton`, `ImpotBiereLien`, l.263-265), puisque ① et ② les portent (Remplacer, jamais fusionner). `BrewBudgetButton` reste pour la recette (`BrewWizard.tsx:3512`, `RecipePage.tsx:363`).

## 3. Inventaire de l'existant, et le sort de chacun (aucune fonction perdue en silence)

**Clients › Prix et marges** (`ClientsTab.tsx:334-373`) :

| Fonction actuelle | Sort |
|---|---|
| Recherche « Rechercher un produit… » + compteur | disparaît : le sélecteur de bière et le segment de format la remplacent (un tarif = bière × format). Listé pour le pilote |
| Segments « Tous N / Sans marge N » | second plan : une ligne sous les tuiles « N formats sans marge » **seulement s'il y en a**, qui renvoie à la liste (D5). Sinon listé |
| Tableau « Produit · Prix HT · Coût · Marge » | remplacé par le graphe et les tuiles. La **liste de tous les tarifs** survit dans la feuille « Changer le prix » (menu « Autres prix de cette bière » + suppression) |
| « Comprendre les marges » (pli) | pli sous la bande des tuiles, texte réécrit (coût = litre liquide × volume + emballage + impôt ; marge = prix HT − coût ; le temps du brasseur est exclu) |
| Clic sur un produit → feuille | « Changer le prix » |
| Bouton FAB « Nouveau tarif » (`fabActions.ts:91`, `createRequest` `newTarif`) | garde son sens : ouvre la feuille « Fixer le prix » pour la bière et le format affichés (`fabActions.ts` hors Possède, inchangé) |
| Renommage d'un tarif (le nom est la clé de stockage) | gardé tel quel (test `tarifsRenommage`, `compactClients`) ; le nom se compose « Bière + format » et reste modifiable |
| Doublon refusé (« a déjà un tarif ») | gardé |
| Bornes 0–10 000 CHF (BE-98), refus de saisie, message de plafond | gardées sur le champ prix |

**TarifSheet** (`ui/TarifSheet.tsx`) → « Changer le prix » : garde Produit, Prix HT, Prix TTC (assujetti), alerte « Ce prix ne couvre pas le coût », Supprimer + `ConfirmSheet`, Enregistrer/Annuler, `useSyncedDraft`. **Perd** « Ingrédients » et « Charges fixes » (problèmes 3, 4, 18 : trois coûts jamais reliés) ; gagne le segment de format et l'aperçu « il te reste » tiré du même `calculPrix.ts`.

**Atelier › Essais de tarifs** (`CreativeLabTab.tsx:209-211,275`, `CreativePricing.tsx`) : le calculateur sort du parcours (problème 19, un seul endroit pour fixer un prix). La liste des « idées de tarif » déjà gardées (`creativeItems` type `pricing-test`, `CreativeItemSheet.tsx:26`) **reste** (données de l'utilisateur) ; l'entrée « Tarifs » devient « Idées de tarif », avec une ligne qui renvoie vers Prix (D8). `CreativePricing.tsx` n'est plus importé ; **non supprimé** (listé : à supprimer sur ton accord, comme `InvoiceSheet.tsx` chez uv). Son test BE-26 (`creativePricingBornes`) reste vert tant que le fichier existe ; les bornes vivent aussi sur le champ prix de la feuille.

**Clients › Impôt sur la bière** (`ClientsTab.tsx:279-331`, déjà : total, liste des brassins de l'année avec `ImpotBiereLien`, plis, Copier, Taxas, Directives) : voir D2.

## 4. Défauts visés (ids d'`INVENTAIRE-CODE.md`)

- **3** trois coûts du litre jamais reliés (budget, tarif saisi, essai) → un seul : `coutFormat`.
- **4** aucun passage du coût du litre au coût d'un format → `coutFormat` + impôt de l'unité (`beerTaxPerFormat`).
- **18** marge = prix − (ingrédients + charges fixes), sans impôt, emballage, TVA → coût complet de d1, HT pour un assujetti.
- **19** trois endroits pour fixer un prix → Prix (c7c) seul ; Facturer ne fixe plus de prix (la caisse lit le tarif, uv) ; l'essai sort.
- **28** (en partie) un 3e volume annuel dans les tarifs → plus de charges fixes saisies ; `profile.annualProductionL` seul.
- Format du tarif (consigne : « le tarif porte désormais son format ») : le nom « Pale Ale 33 cl » n'est plus la seule source (`formatDepuisTarif`, regex sur le libellé) → champ explicite.
- Entrée e3a : le Prix et l'Impôt n'ont aucune porte depuis le brassin → Argent.

## 5. Changements, fichier par fichier

1. `src/types/index.ts` (l.762) : `PricingItem` gagne `format?: { id: '33cl' | '75cl' | 'fut'; volumeL: number }` et `emballageUnite?: number` (CHF, base HT si assujetti, donné par le brasseur : D4). `costIngredients`, `costFixed`, `costTotal`, `costLabor`, `marginCHF`, `marginPercent` passent **optionnels** (hérités : plus écrits par le nouveau formulaire, jamais effacés d'une ligne existante). Lecteurs vérifiés par grep : `storage.ts:1205` (`nombreFr(tarif.marginPercent)` : renvoie `''` sur undefined → le journal dirait « marge  % » ; **hors Possède, à corriger par le pilote** : D9), `functions/src/brewerAppContext.ts:13` (liste de champs : un champ absent est simplement omis), `financeDemo.ts:16` (écrit des 0 : reste valide ; ces 0 sont des « coûts saisis » faux pour la démo, voir D9), `excelService.ts:98` (dump brut).
2. `src/ui/prix/calculPrix.ts` (neuf, pur, centimes entiers, aucun React) : `formatDuTarif(t)` (le champ, sinon `formatDepuisTarif` de uv), `lirePrix({ litreLiquide, format, prixHT, emballageUnite, impotUnite })` → `{ cout: { liquide, emballage|null, impot, total|null, majorant }, reste|null, partPrix|null, zone: 'perte'|'mince'|'ok'|'inconnu' }`, `seuilsRegle(coutTotal, partMince)`, `unitesParAn(litresAn, volumeL)` (⌊⌋), `resteAnnuel(resteAffiche, unites)`, `brassinEnUnites({ coutBrassin, prix, litresNets, volumeL, conditionne? })` → `{ n, paient, pourToi, estime }`, `zoneDe(prix, seuils)`. Les coûts viennent de `chaineLitre.ts` (d1) ; rien n'y est recalculé.
3. `src/ui/prix/donneesPrix.ts` (neuf) : `useDonneesPrix(biere, formatId)` → lit `StorageService.getTarifs()`, `FinanceService.snapshot()` (plans, profil), `batches`, ; dernier instantané du brassin (même sélection que `netEnregistre` d'up), `troisNotions`, `coutLitre`, `baseImpot` (up), `tarifDuFormat` (uv) ; rend un objet prêt pour l'écran ; aucune règle.
4. `src/ui/prix/GraphePrix.tsx` (neuf) : le SVG de c7c (échelles, colonnes, pente, aiguille, étiquettes, règle). Pures fonctions de géométrie dans `src/ui/prix/geometrie.ts` (x/y, rectangles, étiquettes) testées sans DOM.
5. `src/ui/prix/PrixEcran.tsx` (neuf) : le contenu c7c (éléments 1 à 16) ; export `PrixEcran` (contenu, pour Clients) et `PrixFeuille` (dans une `Sheet`, pour les marches d'Argent).
6. `src/ui/prix/ChaineArgent.tsx` (neuf) : les six marches + encart « Dans Prévisions ». Chaque marche est un `<button>` ≥ 44 px (cibles tactiles : B4 de c5b avait 22 px).
7. `src/ui/prix/prix.css` (neuf) : classes `prx-` (L26), jetons de l'app (clair et cave suivent le thème ; **cave dessinée par les jetons**, la maquette n'existe qu'en clair).
8. `src/ui/TarifSheet.tsx` : refait en « Changer le prix » (§ 3) ; garde `productKey`, `PRIX_UNITAIRE_MAX`, `NumberInput` (jamais `type=number`, `saisie-mobile`), bornes BE-98.
9. `src/components/tabs/ClientsTab.tsx` : section `tarifs` remplacée par `<PrixEcran>` ; `displayedTarifs`, `visibleTarifs`, `tarifQuery`, `tarifFilter`, `blankTarif` (NaN) réécrits ; libellés du rail ; section `ofdf` selon D2. Rien d'autre (la caisse d'uv, `Caisse`, `Facturer` et le carnet ne bougent pas).
10. `src/ui/BatchDetailSheet.tsx` : rubrique Argent (§ 2) uniquement.
11. `src/components/CreativeLabTab.tsx` : l'entrée « Tarifs » (l.209-211, 275) selon D8 ; `import CreativePricing` retiré.
12. Tests : § 6.

Persistance : `StorageService.updateTarif` (inchangé). Nouveau tarif : `product = "<Bière> <format.label>"`, `format` renseigné, `priceHT`, et **aucun** champ de coût écrit. Une ligne existante modifiée garde ses anciens champs de coût intacts, mais l'écran ne les lit plus (option laissée au pilote : les lire en dernier recours, étiquetés « coût saisi », quand aucun brassin n'est chiffré ; recommandé : non, ils sont à 0 sur la démo, voir D9).

## 6. Tests qui échouent d'abord (Vitest, fixtures, Gemini simulé)

Fixture `tests/integration/prixFixture.ts` (neuve) : les entrées de d1 (`tests/unit/chaineLitre.test.ts`) rejouées par `estimateBrewBudget` : 202,77 = 22,41 + 64,26 + 116,10 ; 27 L ; emballage 24,00 ; impôt 6,84 à 12 °P ; 1 200 L/an ; tarifs « Pale Ale 33 cl » 5,00, « 75 cl » 10,00, « Fût 20 L » 160,00.

`tests/unit/prixCalcul.test.ts` (rouge : module absent), chaque valeur calculée à la main, pas au code :
- coût 33 cl = 6,3678 × 0,33 + 24 ÷ 81 + 0,0836 = **2,48** ; reste à 5,00 = **2,52** ; part = **50 %** ; zone « ok » ; à 3,00 « mince » ; à 2,30 « à perte » ; seuils 2,48 et 3,72.
- annuel : unités = ⌊1 200 ÷ 0,33⌋ = **3 636** ; **9 162,72** = 2,52 × 3 636 ; bulle **+363,60** = 0,10 × 3 636 ; absent si `annualProductionL` inconnu (null, jamais 0).
- brassin : 81 unités, **41** paient (⌈202,77 ÷ 5,00⌉), **40** pour toi ; prix 0 ou inconnu → null ; coût brassin > recette → « pas couvert ».
- tuiles ≤ : 75 cl ≤ 5,03 (10,00 − (6,3678 × 0,75 + 0,1899)), fût ≤ 27,54 ; avec `emballageUnite` donné : valeur exacte sans « ≤ ».
- inconnus : coût du litre null → total null, reste null, zone « inconnu » ; impôt sans densité → majorant absent.
- assujetti : prix HT et coût HT ; non assujetti identique.
- `formatDuTarif` : le champ l'emporte sur le libellé ; libellé « Pale Ale 33 cl » sans champ → 33cl ; « Bouteille consignée » → null.
`tests/unit/prixGeometrie.test.ts` : x/y monotones, l'aiguille dans le graphe, aucun chevauchement de deux étiquettes (fixture à 3 points), graduations 0·5 k·10 k·15 k pour 0 à 15 000.
`tests/integration/prixEcran.test.tsx` : S1 (2,52 ; « 9 162,72 par an » ; 41 / 40 ; tuiles ≤) ; bascule → S2, **le chiffre de tête change, rien d'autre** ; format 75 cl ; chaque cas neuf de § 1 bis (sans tarif ; coût inconnu : texte « ? » et aucun « 0,00 » ; annuel inconnu ; assujetti) ; « Proposer » ouvre `BrewerChat` simulé sans envoyer ; « Changer le prix » enregistre et la tête suit ; un seul bouton primaire ; 0 `type="number"`.
`tests/integration/prixTarifSheet.test.tsx` : prix 99 999 refusé avec le message de plafond (reprend BE-98/BE-26), vide ≠ 0, doublon refusé, renommage garde les voisins, suppression annulable, `format` écrit.
`tests/integration/prixArgent.test.tsx` : l'onglet Argent existe, six marches dans l'ordre, chacune ouvre son écran (c3a, p2b, Prix), état planifié (« ≥ », « ≤ », « ? », encart Prévisions tiré de `estimerBrassinsPlanifies`), `BrewBudgetButton` et `ImpotBiereLien` absents du Dossier.
`tests/integration/prixClients.test.tsx` : Clients › Prix monte `PrixEcran` ; plus de tableau ; impôt selon D2.
Rouge enregistré avant le code : `voies/ue/tests-rouge.txt`. Écrits avant les modules, cette fois : le rouge est réel.

Anciens tests qui **changent** (ils décrivent l'ancien écran) : `compactClients` (tableau, recherche, segments, feuille à trois champs, rail « Prix et marges »), `bDiversClients`, `rejeu-649b`, `rejeu-73db`, `rejeu-ff0f` (feuille sans champs de coût : leur objet — vide ≠ 0, plafond — passe au champ prix), `tarifsRenommage`, `impotBiereLien` (le bouton passe sous Argent), `batchStockFollowUp` (l.54 : « Estimer le budget » sous Argent), `liveDataViews`/`dashboardNavigation`/`contactConversionUnique`/`equipmentProjects` (entrée « Tarifs » de l'Atelier : D8), `bDiversContraste` (lit la source de `CreativeLabTab`). Aucun test n'est supprimé sans remplaçant ; `creativePricingBornes` reste tel quel (fichier orphelin conservé).

## 7. Appelants hors Possède (`grep` sur `src/`, `tests/`, `scripts/` entiers), rejoués sur HEAD

**Rejeu sur HEAD** (`git worktree add --detach` dans `%TEMP%`, jonction `node_modules`, jonction retirée avant `worktree remove`) : 46 fichiers qui importent ou montent `ClientsTab`, `BatchDetailSheet`, `ProductionTab`, `CreativeLabTab`, `CreativePricing`, `TarifSheet`, `tarifs`, `Prix et marges`, `Impôt bière` : **`Test Files 46 passed (46)` · `Tests 465 passed (465)`** (`voies/ue/tests-head.txt`). Liste dans `%TEMP%/ue-files.txt`. Non chargés : `tests/ux-mobile/**` (hors `include` de `vitest.config.ts`, L11), `tests/qa/**` (pages de banc).

Appelants, et ce qui change pour eux :
- `src/App.tsx:304,354,399,1028` : passe `tarifs` à `ClientsTab` ; **inchangé** (la prop reste).
- `src/domain/fabActions.ts:48,91` : `newTarif` ; inchangé.
- `src/components/tabs/ProductionTab.tsx:8,20,252,316` : monte `CreativeLabTab` et `BatchDetailSheet` ; inchangé (la rubrique Argent est locale à la fiche).
- `src/ui/vente/formatsVente.ts` (uv) : `tarifDuFormat` / `formatDepuisTarif` par le libellé ; **ne lit pas encore `format`** (uv le lira, `uv/RESULTAT.md` D3 ; `pv/DECISIONS.md` D2 pour Prévisions). Je ne touche pas ces fichiers ; mon champ est optionnel, donc aucun lecteur ne casse.
- `src/ui/finance/InvoiceSheet.tsx` : orphelin chez uv.
- `src/services/storage.ts:1205`, `functions/src/brewerAppContext.ts:13`, `firestore.rules.template:138` (collection générique, pas de `hasOnly` sur `tarifs` : un champ neuf passe), `functions/src/backupCore.ts:57` (clé par libellé) : voir § 5-1.
- `scripts/agents/inventaire-ecrans.mjs:140,162,165,251` : décrit les écrans « Essais de tarifs », « Prix et marges », « feuille-tarif » par marqueurs de texte ; **`--verifier` devra être rejoué** (déjà en échec sur HEAD pour `BrewWizard.tsx`, dit par uv) ; ligne à adapter par le pilote.
- `scripts/test_deep_interactive_buttons.mjs:627` (`txt.includes('Tarifs') || 'Marges'`), `scripts/fixtures/brewerSheetProbe.tsx` (monte la fiche), `scripts/check-live-data-mobile.mjs`, `scripts/check-production-catalog.mjs`, `scripts/build-recipe-open-qa.mjs` : lisent ou montent la fiche ; **je les rejoue après le code, je ne les modifie pas** (hors Possède) ; ce qui casse est listé dans RESULTAT.
- Données existantes : `tests/integration/storage.test.ts:173` (bloc « Tarifs ») : le stockage ne change pas.

## 8. Risques

- **Données existantes** : une ligne de tarif ancienne n'a ni `format` ni `emballageUnite` : le format vient du libellé (comportement d'aujourd'hui) ; si le libellé n'en dit rien, l'écran la range sous « Autre » et ne l'invente pas dans un format. Aucune migration ; aucun champ ancien effacé à l'enregistrement (la copie `{ ...draft }` les garde). Le tarif renommé change de clé de stockage (comportement actuel, test `tarifsRenommage`).
- **Deux sources du prix par an** : une seule, `annualProductionL` ; l'« hypothèse 1 200 L en 33 cl » est écrite à chaque lecture annuelle (honnêteté de la maquette).
- **Arrondis** : tout en centimes entiers ; l'annuel est le reste **affiché** × unités (la maquette fait 2,52 × 3 636 = 9 162,72, D10) ; le coût 2,48 = arrondi unique de 2,4812 ; l'impôt jamais resommé (règle d1). Un test fixe chaque chiffre de la figure.
- **Hors ligne** : lecture seule locale ; aucun appel réseau sauf « Proposer » (question non envoyée tant qu'on ne touche pas Envoyer ; chunk `BrewerChat` paresseux).
- **Double clic** : « Changer le prix » enregistre une fois (garde de ré-entrée comme `Caisse`) ; la bascule est un état local pur.
- **Performance** : `lirePrix` est O(1) ; la fiche d'un brassin appelle `useDonneesPrix` une fois par rendu de la rubrique Argent (jamais en arrière-plan). Les étiquettes du graphe : ≤ 5.
- **Dépendance à pv** : `graduations` et `placerEtiquettes` vivent dans `src/ui/finance/previsions/` (non commités, en cours). Si leur signature bouge, ma voie casse : D11.
- **Cave et 1280** : la maquette n'a que clair et 390 + un 1280 dessiné ; la cave est dessinée par les jetons et jugée au rendu (captures de l'étape 2).
- **Étiquettes du graphe en cave** : texte blanc sur pastille verte, contraste à mesurer (`controle-teinte.mjs`).
- **Ce que je n'ai pas pu vérifier ici** : rien n'est lu en marche ; le plan repose sur le code et sur les captures ouvertes de c7c et e3a.

## 9. Hors périmètre

`formatsVente.ts`, `Caisse`, `Facturer` (uv) ; Prévisions (pv) ; c3a et p2b eux-mêmes (uc, up : ouverts, non modifiés) ; `chaineLitre.ts`, `swissBeerTax.ts`, `brewBudget.ts` (d1) ; `productionInsights.ts` ; `storage.ts` ; `fabActions.ts` ; Réglages (volume annuel) ; le « Carnet » (rename du rail) ; la suppression de fichiers orphelins ; la migration des anciens coûts saisis ; remises et prix par client ; la liste « tous les prix d'un coup » que e1b renonce à fournir (Clients › Prix la garde, D1).

## 10. Décisions à prendre (recommandation de l'auteur ; le pilote tranche)

| # | Question | Options | Recommandation |
|---|---|---|---|
| D1 | e3a range Prix et Impôt dans le brassin ; c7c est dessinée dans Clients ; VOIE demande les deux | (a) deux portes, un composant ; (b) retirer Prix et Impôt de Clients | (a), réversible ; (b) seulement après le oui du brasseur à « pas de vue de tous les prix d'un coup » |
| D1 bis | Argent s'ajoute aux trois rubriques réelles (Mesures · Carnet · Dossier) ; la maquette en montre trois autres | ajouter la 4e / remplacer le rail | ajouter ; retirer du Dossier les deux entrées dupliquées |
| D2 | Clients › Impôt bière de l'année : aucune maquette | (a) total exact de l'année + liste de brassins → feuille p2b, plis gardés ; (b) retirer l'onglet (e3a) ; (c) mini maquette à demander | (a) maintenant ; (c) en parallèle (L24) si le brasseur veut mieux |
| D3 | « Dans Prévisions : 57,42 avant le 20 nov. » de la figure ≠ uc (33,42 + 30,84) | lire `estimerBrassinsPlanifies` / reprendre les chiffres de la figure | lire le code : un chiffre de maquette n'est pas une source |
| D4 | « verre 0,30 » : aucune source de l'emballage d'une unité dans le code (uc le dit ; pv D2 idem) | (a) champ `emballageUnite` du tarif, vide = « ≤ » ; (b) coût d'emballage du brassin ÷ unités si un seul format | (a) + (b) quand le brassin est tout en bouteilles de 33 cl ; sinon « ≤ » |
| D5 | Rail « Prix et marges » → « Prix », « Impôt sur la bière » → « Impôt bière » ; « Sans marge N » | renommer / garder | renommer (la maquette) ; les tests suivent ; « sans marge » = une ligne conditionnelle |
| D6 | Crans 4,50 et 6,00 et leurs points : exemples non sourcés | prix de vente réels récents du format (lignes `vente:`) / absents / constantes | prix réels récents (≤ 2, distincts) ; sinon aucun cran ; **jamais** 4,50 et 6,00 en dur |
| D7 | « Mince = moins d'un tiers du prix » est un exemple de la maquette (« ⅓ ex. ») | constante nommée marquée « ex. » / réglage | constante marquée « ex. » ; réglage plus tard (goût du brasseur) |
| D8 | Atelier › Tarifs : le calculateur sort ; les idées de tarif déjà gardées | (a) garder la liste, retirer le calculateur, renvoi par une phrase ; (b) tout retirer | (a) : aucune donnée de l'utilisateur ne devient invisible |
| D9 | `storage.ts:1205` (journal « marge … % ») et `financeDemo.ts:16` (coûts 0 faux) hors Possède | corriger / laisser | corriger par le pilote ou une voie qui possède `storage.ts` : un journal « marge  % » est vide ; la démo doit porter `format`, sans 0 de coût |
| D10 | Annuel : reste affiché × unités (maquette : 9 162,72) ou reste exact × unités (≈ 9 158,4) | maquette / exact | maquette : le brasseur retrouve le chiffre en multipliant ce qu'il lit (règle n° 1) ; le chiffre est « estimé » |
| D11 | `graduations` et `placerEtiquettes` sont à pv, non commités | les importer / les copier / les déplacer dans `src/domain/` | les importer ; un déplacement commun par le pilote quand pv a fini ; pas de copie (L29) |

## 11. État de l'art (à recopier dans `MISSION.md` § « État de l'art » : je ne l'écris pas, hors Possède)

| Problème type | Examiné | Décision |
|---|---|---|
| Graduations de deux échelles liées d'un même axe (°C/°F, /bouteille et /an) | Heckbert 1990 (nombres 1-2-5 × 10^k) : déjà décidé et écrit pour pv (`graduations`, `escalier.ts:100`) ; `d3-scale` n'est que transitif | réutiliser `graduations` de pv pour **chaque** échelle ; le cran /an est le cran /bouteille × unités/an, pas un second tracé ; aucune dépendance neuve |
| Étiquettes sans chevauchement sur la courbe | placement glouton par rectangles, déjà décidé pour pv (`placement.ts`) ; ≤ 5 étiquettes ici | réutiliser `placerEtiquettes` ; à défaut, les 3 positions candidates de la maquette (gauche du point) et un test de non-recouvrement |
| Coût complet d'un format (litre → unité) | méthode des coûts complets : déjà écrite dans `chaineLitre.ts` (d1) | rien de nouveau ; `calculPrix.ts` ne recalcule jamais le coût |
| Géométrie du graphe | échelles linéaires, aucun algorithme non trivial | fonctions pures testées ; pas de bibliothèque de graphes (la maquette est un SVG dessiné) |

Une seule rustine par module avant arrêt (L29) : si `GraphePrix` demande une deuxième rustine de placement, je m'arrête et je rends `ECHEC — état de l'art à faire : placement d'étiquettes`.

## 12. Sort de chaque constat des revues (09.11, après DECISIONS.md) — fait foi sur le § 1 à 11 en cas de contradiction

Règle du pilote : les nombres viennent du domaine (`chaineLitre`, `brewBudget`), la maquette donne la forme ; l'emballage de l'unité se saisit dans la fiche du tarif (vide = « à compléter », jamais 0) ; un tarif existant sans format reste lisible et invite à le compléter. Décisions : D1 deux maquettes telles que dessinées (rail Carnet · Prix · Impôt bière) ; D2 plan minimal ; D1 bis, D3 à D10 retenues ; D11 pv commité, `graduations` et `placerEtiquettes` importés.

### Revue A
| n | Sort | Raison / changement |
|---|---|---|
| A-B1 « 202,23 » | retenu | `brassinEnUnites` rend aussi `vendu = n × prix` et `resteBrassin = vendu − coût du brassin` (centimes) ; « ≤ » si le coût est incomplet ; test 405,00 − 202,77 = 202,23 |
| A-B2 fût ≤ 27,58 | retenu | le domaine fait foi : 160 − 132,42 = **27,58**, × 60 = **1 654,80** ; 75 cl ≤ 5,03 et 8 048,00 ; l'écart à la maquette (27,54) est listé dans RESULTAT ; le litre n'est jamais arrondi avant de multiplier |
| A-B3 échelles /an | retenu | deux jeux de crans indépendants (`graduations`) sur un axe commun : on fixe le maximum en CHF/bouteille, le maximum /an = ce maximum × unités/an, on gradue chacun dans sa plage (crans > plage écartés) ; test : le cran 5 000 est à `y(5000 ÷ 3636)` ; la phrase « cran /an = cran × unités » du § 11 est **annulée** |
| A-B4 emballage | retenu | champ « Emballage de l'unité » dans la feuille « Changer le prix », optionnel, vide = « à compléter » (≤) ; le repli « poste du brassin ÷ unités » du plan est **écarté** (règle du pilote : saisi dans le tarif) ; test : emballage saisi → coût exact (2,48), vide → « ≤ » |
| A-G1 brassin d'où l'on vient | retenu | `PrixEcran` prend `batchId?` ; Clients choisit le brassin chiffré le plus récent de la bière ; test : deux brassins de coûts différents |
| A-G2 rail | retenu | libellés et ordre de la maquette : Carnet · Prix · Impôt bière (valeurs `crm`/`tarifs`/`ofdf` inchangées, mémorisation `clients_subtab` intacte) ; tests renommés |
| A-G3 ajouts | retenu | « N formats sans marge » **supprimée** (fonction listée) ; « Comprendre » replié sous les tuiles ; les textes d'inconnu sont les « ? » de la maquette ; l'ajout « tarifs à compléter » (B-B2) et le menu de bière sont listés pour le pilote ; mots du repos comptés (≤ 60 hors chiffres) |
| A-G4 deux totaux d'impôt | retenu | Clients › Impôt bière : `taxReport` retiré de l'affichage ; total de l'année = somme des montants de p2b (`baseImpot`), « ≥ » et « densité à noter pour N brassin(s) » quand un °P manque, jamais 0 ; réduction confirmée de l'année (`baseImpot`) ou « taux plein, réduction à confirmer » ; « Copier » reprend ce total |
| A-G5 taux | retenu | `beerTaxPerFormat` reçoit la réduction confirmée de l'année du brassin (comme p2b) ; ligne « taux plein, réduction à confirmer » quand elle manque ; tests à 0 % et à 20 % |
| A-G6 statuts | retenu | table statut → (litres, ≥/≤, encart) testée par ligne : conditionné/terminé (litres conditionnés, exact), brassage→garde (net enregistré sinon « ? »), planifié (« ≥ / ≤ », encart) ; jamais « conditionné » supposé |
| A-G7 arrondi du reste | retenu | reste = prix − coût **affiché** (centimes) ; part sur le reste affiché ; test aux demi-centimes (coût exact 2,4850 → 2,49 → reste 2,51) |
| A-D1 hypothèse annuelle | retenu | « si <volume> L en <format> » écrit depuis `annualProductionL` et le format choisi |
| A-D2 tuile sans tarif | retenu | tuile atténuée « prix ? » seule |
| A-D3 crans de la démo | retenu | crans = prix de vente réels (≤ 2) ; sans vente : aucun ; **écart listé** (la démo n'a pas de vente de 33 cl à deux prix) |
| A-D4 test Prévisions | retenu | valeur calculée à la main sur la fixture |
| A-D5 « Il te manque » | retenu | écart mineur de texte listé |

### Revue B
| n | Sort | Raison / changement |
|---|---|---|
| B-B1 identité de la bière | retenu | la bière = **nom de la recette** (`recipeSnapshot.name`, sinon `style`), pas le nom du lot ; le nom du tarif = « <recette> <format> » ; le brassin du coût = le plus récent **chiffré** de cette bière, sinon « ? » ; test : deux lots de même recette + un non chiffré ; `tarifDuFormat` de la caisse retrouve « Pale Ale 33 cl » pour « Pale Ale d'octobre » |
| B-B2 tarif non rattaché | retenu | une ligne sous les tuiles « Tarifs à compléter : Bouteille 33 cl · 5,00 › » qui ouvre la feuille (format à choisir) ; liste de **tous** les tarifs dans la feuille ; test « Bouteille 33 cl » sans bière |
| B-G1 deux sources du format | retenu | le nom d'un tarif **porté** se recompose de (bière, format) et n'est plus libre ; un tarif ancien garde son nom libre jusqu'à ce qu'il soit complété ; changement de 3 lignes de `formatDepuisTarif` à faire par le pilote (hors Possède) listé ; test croisé Prix → `tarifDuFormat` |
| B-G2 aucun/plusieurs/0 | retenu | fonction neuve `tarifsDuFormat` dans `src/ui/prix/` (kind `aucun` / `plusieurs` / `un` / `sans-prix`) |
| B-G3 journal immuable | retenu autrement | `storage.ts` est hors Possède : mes enregistrements n'appellent plus `updateTarif` ; ils passent par `saveTarifs` + `logAction` avec mon propre texte sans « marge » (le chemin de renommage le fait déjà) ; test : le journal d'un tarif neuf ne contient pas « marge  % » ; la correction de `storage.ts:1205` reste à faire par le pilote |
| B-G4 « Proposer » aveugle | retenu | `initialQuestion` écrit coût, prix, format, reste ; test sur le texte ; `brewerAppContext.ts` (déployable) listé pour le pilote |
| B-G5 liste de tests | retenu | refaite par grep (`rxPrixInconnu`, `bDiversImpot`, `impotBiereClients` ajoutés ; `liveDataViews`/`dashboardNavigation`/`contactConversionUnique`/`equipmentProjects` **retirés** : aucun ne nomme les Tarifs de l'Atelier) ; BE-98 déplacé sur le champ prix sans l'affaiblir, dit dans RESULTAT |
| B-D1 échelles | retenu | = A-B3 |
| B-D2 `netEnregistre` privé | retenu | `baseImpot(batch, …).litres` |
| B-D3 encart Prévisions | retenu en partie | assemblage `estimerBrassinsPlanifies` dans `src/ui/prix/previsionsBrassin.ts`, chargé paresseusement ; si le calcul manque : encart absent, jamais un chiffre de la figure ; la demande d'un utilitaire commun à pv est listée |
| B-D4 arbre partagé, clients.css | retenu | erreurs `tsc`/build hors de mes fichiers consignées ; classes de la feuille dans `prix.css` (`prx-`), `clients.css` intact |
| B-D5 rouge réel | retenu | modules créés d'abord avec exports qui rendent `null`, rouge sur les valeurs dans `tests-rouge.txt` ; anciens tests réécrits rejoués rouges avant |
