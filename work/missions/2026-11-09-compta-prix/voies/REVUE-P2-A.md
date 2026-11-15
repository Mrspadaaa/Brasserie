# Revue P2 — regard A : justesse métier et fidélité à la maquette (plans d2, uc, up)

Relecteur sans mémoire, 09.11. Lu : PHASE2.md, DECISIONS-PHASE2.md, PLAN-METIER.md, COMMUN.md, ETAPE2.md, les trois PLAN.md, RESULTAT.md (d2, up), etat.html et captures de c3a (`c3a-page.png`, `c3a-1280.png`) et p2b (`p2b-page.png`), NOTE.md des deux, registre `ecrans-app.json:80-105`, et le code : `brewBudget.ts`, `chaineLitre.ts`, `swissBeerTax.ts`, `materielFutur.ts`, `forecast.ts`, `BrewBudgetDialog.tsx`, `BrewBudgetSheet.tsx:47-50`, `ClientsTab.tsx:279-315`, `BatchDetailSheet.tsx`, `purchaseEntry.ts:722-740`, `SettingsModal.tsx:231`. Aucun code exécuté ; arithmétique des plans recalculée à la main (64,26 ; 33,42 / 30,84 ; 6,74 / 0,08 / 0,19 / 5,06 / 303,84 ; 8,98 / 0,11 / 0,25 / 6,75 / 405,12 ; 5,39 ; bornes de la règle ; dates de trimestre) : tout est juste.
Gravité : **B** bloquant (corriger le plan avant le code), **G** grave (corriger ou trancher avant le code, sinon le défaut sort à l'écran), **D** détail.

| Plan | Verdict |
|---|---|
| d2 | **OK avec réserves** (1 B, 5 G, 3 D) |
| uc | **OK avec réserves** (0 B, 6 G, 3 D) |
| up | **OK avec réserves** (0 B, 3 G, 3 D) |

---

## d2 — prévision dérivée (domaine seul)

Ce qui est juste : découpe en quatre sorties dont la somme est exacte (reste), instantané du brassin et non recette vivante, inconnu jamais 0 (`partial`), pureté, doublon traité, usure comptée une fois via `usureAnnuelleLitre` + `ignorerPlanId`, écart assumé sur les factures `batchId` bien argumenté (`purchaseEntry.ts:732` : la facture met le stock à jour, vérifié).

**D2-1 (B) — le champ `recipeSnapshot.og` n'existe pas, et ni l'alcool ni la réduction ne sont passés : d2 ne retrouvera pas le « même 64,26 » que c3a.**
- Preuve : PLAN d2 § 6 (l. 107) « `og: batch.og` sinon `recipeSnapshot.og` : à confirmer au code ». `RecipeSnapshot` = `Recipe` sans quelques champs (`src/types/index.ts:545`) ; le champ est `ogTarget: number | null` (`:473`). Aucune mention de `abv` ni de `beerTaxReductionPct` dans le plan (grep), alors que `estimateBrewBudget` les attend (`brewBudget.ts:114-118`) et que uc les passe (PLAN uc § 3.2, § 3.3).
- Conséquence : sans OG lue, l'item impôt devient « inconnu » (test 1 de d2 impossible) ; avec réduction confirmée ou bière ≤ 0,5 % vol., Prévisions dit 6,74 là où c3a dit 5,39 ou 0,00. La décision 1 (« un seul 64,26 ») est la raison d'être de la voie.
- Attendu : `og = batch.og ?? recipeSnapshot.ogTarget` (marqué « OG cible » donc estimé), `abv = batch.abv`, `beerTaxReductionPct` selon la même règle que uc (réduction seulement si `beerTaxReductionYear` = année du brassin), passé en entrée (`reductionPct`, `config` hors du domaine). Un test d'égalité d2 = uc sur la même fixture, réduction confirmée et exonéré compris.

**D2-2 (G) — sans instantané enregistré, l'impôt est calculé sur le volume à brasser pris pour un net.**
- Preuve : `brewBudget.ts:401-402` (`netVolumeL = input.netVolumeL ?? recipe.volumeL`) ; d2 § 2.3 ne passe `netVolumeL` que si un instantané existe. Un brassin planifié jamais « Prévu » (le cas courant) donne un impôt sur 30 L (7,59 au lieu de 6,84), chiffre faux et non marqué. uc a décidé le contraire (DECISIONS-PHASE2 n° 4 : « jamais un litre calculé sur le volume à brasser »).
- Attendu : net lu comme chez uc/up (conditionné > enregistré `saisi` > rien) ; sans net, item impôt absent et `partial: ['litres nets']`, ou montant marqué « estimé sur le volume à brasser » ; jamais présenté comme net. Test : planifié sans instantané, 30 L, aucun 7,59.

**D2-3 (G) — registre d'actifs vide : l'usure vaut 0, « complet », donc un litre faussement complet.**
- Preuve : `materielFutur.ts:103` rend `{ totalCents: 0, complet: true }` sans actif ni projet ; l'ancien code (`BrewBudgetDialog.tsx:22-24`) rendait `undefined` (inconnu) quand `rows.length` = 0, donc `complete` faux. d2 décision 11 ne traite que « durée inconnue » (test 13).
- Attendu : `lignes.length === 0` → `annualDepreciationCHF` absent (inconnu, litre `null`) sauf poste d'usure désactivé ; test « aucun actif, aucun projet → litre null, pas 7,51 − usure ». Même point côté uc (UC-3).

**D2-4 (G) — l'impôt d'un brassin conditionné disparaît de la prévision au moment où il devient certain.**
- Preuve : d2 § 2.8 et § 8 (« l'impôt d'un brassin conditionné reste au suivi annuel de Clients, hors périmètre ») ; PLAN-METIER, § « Mise à jour » : « l'impôt reste jusqu'au conditionnement puis devient l'item d'impôt du brassin conditionné, jusqu'à son paiement ». Un brassin passé en `conditionne` en septembre doit son impôt en janvier : Prévisions le montre en `garde`, le perd à `conditionne`, trou de trésorerie silencieux.
- Attendu : soit garder l'item (assiette `volumePackagedL`, date estimée) tant que la période n'est pas échue, soit un avertissement explicite dans `warnings` (« impôt des brassins conditionnés non prévu ») et la décision remontée au pilote. Pas de trou muet.

**D2-5 (G) — deux calculs des postes : d2 refait la formule que uc ajoute à `brewBudget.ts` (`fraisParPoste`).**
- Preuve : d2 § 2.6 (« énergie + nettoyage = operatingCashTTC − emballage − impôt », emballage « pris sur leur réglage ») ; uc § 8 et DECISIONS-PHASE2 n° 1 (champ `fraisParPoste`). Deux voies, deux dérivations du 33,42 / 30,84 : l'écran et la prévision peuvent diverger au premier cas limite (poste « inclus dans le récurrent », TVA).
- Attendu : d2 lit `fraisParPoste` quand il existe (ordre : uc d'abord pour ce champ) ou, à défaut, un test qui impose l'égalité de la découpe d2 et de la découpe uc sur la fixture et sur un cas « inclus dans le récurrent ».

**D2-6 (G) — § 2.9 et test 2 se contredisent sur les plans `brew` des brassins `conditionne` / `termine`.**
- Preuve : § 2.9 ne saute que les plans dont le brassin produit des items dérivés ou est `annule` ; test 2 dit « terminé / conditionné : son plan brew actif n'est plus compté ». Un plan « Prévoir » resté actif sur un brassin conditionné, daté dans le passé, serait ramené à `asOf` et compté chaque jour comme dépense à venir (le défaut c).
- Attendu : trancher et l'écrire. Recommandé : sauter aussi les plans `brew` actifs dont le brassin est `conditionne`/`termine` (la dépense est factures ou stock), plan lisible, jamais compté ; test ajouté.

**D2-7 (D) — hypothèse « toute facture `batchId` met le stock à jour ».**
- Preuve : vrai pour `purchaseEntry.ts:732`. Les autres chemins qui posent `finance.batchId` (`BrewBudgetDialog`/`storage.ts`/dépense manuelle) n'ont pas été lus. Une dépense rattachée sans lignes de stock ne réduirait jamais l'item achats : doublon.
- Attendu : grep des écrivains de `finance.batchId` écrit dans le plan ; si l'un d'eux n'alimente pas le stock, ne pas affirmer « jamais » (Q3).

**D2-8 (D) — dates : champ source et libellé.** (a) § 2.7 « fin du trimestre qui contient C + 30 j » se lit de deux façons ; les tests tranchent (fin du trimestre de C, puis + 30 j, ce que dit aussi `ClientsTab.tsx:~298`) : réécrire la phrase. (b) Pour un brassin commencé, la date de base est `brewDate` (jour réellement brassé), pas `plannedBrewDate` (test 9 le suppose) : à écrire. (c) L'impôt est dû à la sortie de cave (p2b), d2 le date depuis le conditionnement : « date estimée » doit apparaître dans le libellé de l'item, pas seulement dans `warnings`.

**D2-9 (D) — Q1 à Q5 sans réponse** dans DECISIONS-PHASE2.md (qui ne traite que uc). Défauts prudents appliqués ; aucun n'est un goût sauf Q2 (valeur reprise à la place du brasseur : à garder « partiel », comme prévu). Rappel pour le pilote : tant que Q1 n'est pas branché, d2 n'a aucun effet visible (L11).

---

## uc — port de c3a (coût d'un brassin et d'un litre)

Fidélité : l'inventaire de 13 lignes reprend chaque élément de `etat.html` (colonnes, Sankey 390×420, 1,62 px/CHF, minimum 12 px, 8 destinations, hachure « ? », pointillé, bloc noir, barre du litre, Expliquer, Prévoir, état 2 jaune, estompage 12 % / 35 % / 25 %) ; mon pointage sur les deux captures n'y trouve rien d'omis. Bon : B1 (b) appliqué, 33,42 + 30,84 = 64,26, parts 0,83 + 2,38 + 4,30 = 7,51, « Prévoir 64,26 CHF » gardé, mot « estimé » → pointillé (écart annoncé, décision 5).

**UC-1 (G) — un ancien instantané ramène le net faux (30 L) que la voie dit supprimer.**
- Preuve : PLAN uc § 3.2 : `litresNets({ conditionneL, netEnregistreL: savedEstimate?.netVolumeL })`, sans contrôle de source. Or `BrewBudgetSheet.tsx:47` écrivait `useState(savedEstimate?.netVolumeL ?? batch?.volumePackagedL ?? recipe.volumeL)` et `estimateBrewBudget` stocke toujours `netVolumeL` (`brewBudget.ts:455`) : tout instantané existant dont le net était le défaut porte 30 L, sans `netVolumeSource` (champ neuf, d1). Il serait lu « enregistré » : litre 7,21 au lieu de 7,51, justement le défaut 27 du § 1. up, lui, n'accepte que `netVolumeSource === 'saisi'` (PLAN up § 2.1) : c3a et p2b donneraient deux litres pour le même brassin.
- Attendu : `netEnregistreL` seulement si `netVolumeSource === 'saisi'` (même règle que up) ; un ancien instantané sans source : valeur proposée dans la feuille Volumes comme « à confirmer », jamais comptée seule. Test : instantané ancien net 30 → « ? L nets ».

**UC-2 (G) — « Emballage 33 cl » et « 33 cl comprise » : aucune source du format dans le code, et « Emballage calculé » est faux.**
- Preuve : PLAN uc § 1 (« Emballage calculé (d1 : `packagingCost`) ») ; `brewBudget.ts:419-431` : `packagingCost` est le montant saisi (`option.amountTTC`), rien n'est calculé depuis des formats (le plan métier § 3.2 le visait, d1 ne l'a pas fait). § 2 ligne 8 : « 33 cl comprise seulement si l'emballage du brassin est un 33 cl connu » : aucun champ ne le dit, le plan ne nomme pas d'où le tirer. Le libellé affirmerait un format que l'app ignore (L14).
- Attendu : corriger le § 1 ; nommer la source du format (ex. `batch.packaging` si elle porte le format) ou écrire « Emballage » / « emballage compris » tant qu'elle n'existe pas, et le dire au critique comme écart de libellé (maquette : « Emballage 33 cl »).

**UC-3 (G) — registre d'actifs vide : usure 0 « complète » (même défaut que D2-3).**
- Preuve : PLAN uc § 3.3 remplace `budgetDepreciation` par `usureAnnuelleLitre` et ne dit que « `amountCHF` inconnu si `complet` faux ». Sans actif ni projet, `materielFutur.ts:103` rend `complet: true`, total 0 ; l'ancien code rendait `undefined`. Le litre 7,51 s'afficherait sans usure, sans alerte, chez un brasseur qui n'a rien enregistré. Le nœud « Usure matériel » serait à 0,00 plein.
- Attendu : `lignes.length === 0` → `amountCHF` inconnu, nœud « ? » hachuré, litre « — » (ou poste désactivé explicitement) ; test 14 étendu.

**UC-4 (G) — le « ? » de la maquette et « Prévoir grisé » se contredisent ; l'état de repos de la maquette n'est atteignable que par une recette sans houblon ni levure.**
- Preuve : la maquette montre « Houblon, levure ? », 7,51, « estimé » et **Prévoir actif** (`c3a-page.png`). Le plan (§ 2 ligne 6 et « Estimation partielle ») grise Prévoir et passe le litre à « — » dès qu'un prix manque ; `coutLitre` rend `null` si `notions.complet` est faux (`chaineLitre.ts:55-57`, `troisNotions` : `consumedCost === null`). Test 5 recrée la maquette avec une « recette sans houblon ni levure », cas qui n'existe pas dans une brasserie (L14), et aucun test ne couvre le cas réel : houblon présent, prix inconnu.
- Attendu : (a) écrire que l'état de repos de la maquette n'est pas atteignable honnêtement par une vraie recette (un litre sans houblon est faux) ; (b) test « houblon présent sans prix » : nœud « ? », litre « — », mot « partiel » ; (c) décider Prévoir : d2 sait prévoir du partiel et B2 (a) « fige les entrées » n'exige pas un coût complet. Recommandé : Prévoir **actif** en partiel (c'est la maquette), libellé « Prévoir 64,26 CHF » + mention « partiel », Enregistrer reste secondaire ; sinon le dire au pilote comme écart.

**UC-5 (G) — « Prévoir » n'a aucun effet visible tant que ni uc ni d2 ne sont branchés.**
- Preuve : DECISIONS-PHASE2 n° 2 (navigation non branchée, `onOpenForecast` exposé seulement, « pas de lien tant que… ») + d2 sans branchement `FinancesTab` (Q1). Le geste écrit un plan `active` que d2 saute ensuite comme doublon : le brasseur touche le bouton primaire et ne voit rien dans Prévisions. B2 (a) (« ouvre la ligne dans Prévisions ») n'est pas livré.
- Attendu : le plan écrit le retour du geste (ligne `role="status"` « Prévu : 64,26 CHF », feuille qui reste ou se ferme, à dire) ; RESULTAT marque Prévoir « non branché à Prévisions » ; le branchement `App.tsx` / `FinancesTab` est un point daté du plan de phase 3, pas un oubli (L11).

**UC-6 (G) — le nœud « Impôt bière » présente son propre calcul, à côté de la feuille p2b choisie.**
- Preuve : PLAN uc § 2 (« Impôt bière → calcul affiché (« 12,4 °P · 27 L · 25,32 CHF/hl »)… ») ; up livre `ImpotBiereSheet` pour le même brassin. Deux présentations du même impôt, et des chiffres qui peuvent différer : uc pointille l'OG cible de la recette (`ogTarget`), up affiche « 12 °P · exemple » tant que D4 n'est pas accepté (6,84 sur 27 L contre 6,74 sur 26,6 L dans les maquettes).
- Attendu : le nœud affiche la même source (litres, °P, tranche, réduction) et un lien « Voir l'impôt par bière › » vers la feuille de up ; ou D4 de up accepté pour que le départ soit la même OG visée. À coordonner explicitement entre les deux plans.

**UC-7 (D) — « plus grand reste » : le cas d'égalité n'est pas défini.** Test 2 (1,005 / 2,495 / 4,010 → 7,51) tombe sur deux restes égaux à 0,5 centime : donner la règle de départage (ordre fixe payé, à payer, année, ou reste exact avant arrondi) pour que le résultat ne dépende pas de l'ordre d'itération.

**UC-8 (D) — bloc jaune.** (a) « avant le brassage 33,42 » contient énergie et nettoyage datés du jour J, d2 les place à J : cohérent, mais écrire « au brassage » ou « d'ici le brassage » éviterait l'ambiguïté avec les achats à J − 7. (b) Test 3 à ajouter : 33,42 + 30,84 = 64,26 aussi pour un assujetti (poche TTC, source « À payer » en HT).

**UC-9 (D) — thème cave : teintes de catégorie repérées « à l'identique ».** La maquette n'existe qu'en clair ; vérifier à l'étape 2 que bleu (impôt), violet (année) et vert (déjà payé) tiennent 4,5:1 sur fond cave, et ne pas copier l'échelle EBC pour le jaune de Malt (DESIGN.md la réserve au moût).

---

## up — port de p2b (impôt bière, règle des degrés)

Fidélité : inventaire de 21 lignes, chaque élément et les deux figures (12 °P / annexe 15 °P) couverts ; bandes 50 / 20 / 30 %, taux et bornes lus de `BAREME_IMPOT_BIERE` (`swissBeerTax.ts:12-16`) : exactes, `beerTaxBracket` inclusif à 10,0 et 14,0 donc les bornes du test 3 sont justes ; la règle de calcul (6,74 / 8,98 / formats / année) recalculée : juste. Aucune écriture de données, réutilisation de la chaîne `litresNets` avec `netVolumeSource === 'saisi'` : correcte et plus prudente que uc. Sections de code visées : `ClientsTab.tsx:279-315` exact, `BatchDetailSheet.tsx:249` exact, chemin « Réglages › Réserve impôt sur la bière » existe (`SettingsModal.tsx:231`).

**UP-1 (G) — la ligne « Réduction petit brasseur › » de la maquette devient un pli (D3) : écart visible à une maquette « Ça top comme ça ».**
- Preuve : p2b-page.png (chevron › : la ligne mène à Réglages) ; PLAN up § 3 ligne 16 et D3 (« pli, faute de pouvoir ouvrir Réglages sans toucher `App.tsx` »). Un `›` qui ne mène nulle part serait pire, mais le pli est un composant d'une autre nature (⌄, texte long) à la place de la ligne choisie.
- Attendu : annoncer l'écart au critique et au pilote comme tel ; garder la ligne au même gabarit visuel (titre + sous-titre d'état, 2 lignes) ; chevron `⌄` seulement parce qu'elle se déplie ; option à chiffrer : `onOpenSettings` optionnel donné par `ProductionTab`/`App` dans une voie suivante, qui rétablit le `›`.

**UP-2 (G) — D4 (départ du curseur) conditionne la cohérence avec c3a.**
- Preuve : PLAN up D4 (« recommandé oui ; défaut en attente : la maquette 12 °P ») et UC-6 : uc pose l'OG cible de la recette dans l'impôt de c3a. Avec le défaut, un même brassin planifié montre 6,84 (OG cible 12,4 °P) dans c3a et « 6,74 · 12 °P · exemple » dans p2b. Aucune décision du pilote n'existe sur D1 à D5 (DECISIONS-PHASE2 ne traite que uc).
- Attendu : le pilote tranche D4 avant le code. Recommandation de ce regard : D4 oui (donnée sourcée, étiquette « visée recette », hachures conservées) ; l'exemple 12 °P ne reste que sans OG ni OG visée.

**UP-3 (G) — « aucune sortie notée » en rouge sur tout brassin.**
- Preuve : p2b-page.png (carte « Quand », rouge) ; PLAN up § 0.4 (aucune vente rattachée à un brassin avant v3a). L'énoncé est vrai au sens strict mais, sur un brassin vendu entièrement, il alerte à tort (inconnu présenté comme absence, L14) et un brasseur lira « je n'ai rien vendu ».
- Attendu : garder la maquette telle quelle mais, pour un brassin `conditionne`/`termine`, une teinte neutre et le mot exact « aucune sortie rattachée à ce brassin » (ou la maquette inchangée avec ce point listé comme écart à valider). Le texte « à la sortie de cave » reste.

**UP-4 (D) — « Noter la densité » sort de la feuille (D5).** Parcours : fermer l'impôt, saisir sur la fiche, rouvrir. Défendable (garde-fous `saveGravity`, alcool recalculé) mais le primaire de la maquette est dans la feuille : montrer au critique le parcours complet à 390 px, et vérifier que le focus se pose bien sur `batch_sheet_og` (plan : rien rendu dans Chrome à ce stade).

**UP-5 (D) — numéros de ligne à corriger.** PLAN up § 2.3 cite `batch_sheet_og` à `:309` : le champ est à `BatchDetailSheet.tsx:295` (`:310` est son `onBlur`). Sans conséquence si la recherche se fait par nom, à corriger dans le plan.

**UP-6 (D) — « Sur l'année » : litres et °P.** Un seul brassin (11,9 °P) × `annualProductionL` donne « ~ 303,84 · estimé » : acceptable car marqué, mais avec réduction confirmée la ligne de l'année doit porter le même net que le brassin (test 8 le prévoit pour l'année : bien). Ajouter l'année du brassin à côté (maquette : année celle du brassin).

---

## Points transverses

- **T1** DECISIONS-PHASE2.md ne répond qu'à uc. Questions ouvertes : d2 Q1 à Q5, up D1 à D5. Les défauts prudents sont raisonnables ; seules D4 (up) et Q4 (d2, brassins commencés) changent ce que le brasseur voit.
- **T2** Cohérence à contrôler entre les trois plans par un test commun : même brassin, même OG, même réduction → 6,84 (ou 5,47) partout : c3a (nœud impôt), p2b (feuille), Prévisions (item impôt).
- **T3** Pas de défaut hors périmètre constaté : `git status --short` ne montre que `v0/g-outils/` non suivi (hors de ces trois voies). Rien écrit par moi hors de ce fichier.

LEÇON PROPOSÉE : un état de repos de maquette qui contient un « ? » à côté d'un total chiffré (c3a : houblon, levure inconnus, 7,51 affiché) n'est pas atteignable honnêtement par une vraie recette : le plan d'un port doit le dire et tester le cas réel, pas seulement une fixture bâtie pour reproduire l'image (L03 et L14).
