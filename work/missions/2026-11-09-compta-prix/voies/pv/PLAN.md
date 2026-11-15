# Plan pv — port de p5b, les Prévisions (les étiquettes accrochées)

Étape 1 (09.11). Aucun code écrit. Sources lues : `p4/p5b/etat.html` (CSS et SVG), `NOTE.md`, `p5b-page.png`, `p5b-1280.png` (ouvertes), `p3/p4a/p4a-page.png`
(la liste « inchangée » de l'annexe), `FinancesTab.tsx`, `FinanceForecastSummary.tsx`, `FinanceComparisonChart.tsx`, `UpgradeWorkspace.tsx`, `UpgradeSheet.tsx`,
`brewForecast.ts`, `materielFutur.ts`, `forecast.ts`, `voies/{d2,d3,uc}/RESULTAT.md`, `COMMUN.md`, `ETAPE2.md`.

**Portée (L01)** : l'onglet Finances › Prévisions seulement, plus le geste « Prévoir » de c3a. Synthèse, Opérations, Annuel, App.tsx, `brewBudget.ts`, `forecast.ts`,
`brewForecast.ts` ne sont pas touchés. Ses mots : « Les étiquettes accrochées / p5b / Là je vois tout sur le graphe. » Règle n° 1 : p5b est l'écran, pas une carte à côté.

## 0. Blocage avant le code : l'état de l'art manque (L29)

`MISSION.md` n'a pas de section « ## État de l'art » (elle est « à recopier » depuis `PLAN-METIER.md` § 4), et aucune de ses lignes ne couvre le
**graphique en escalier avec étiquettes** : ni le placement des étiquettes, ni les graduations de l'axe. Je n'écris donc aucun algorithme avant que le pilote
recopie les deux lignes ci-dessous dans MISSION.md (ou les corrige). Ce que je propose, à confirmer :

| Problème type | Examiné | Décision proposée |
|---|---|---|
| Placement automatique d'étiquettes (« automatic label placement », Imhof 1975 ; NP-difficile en général) | Méthode d'école : positions candidates par étiquette, collision rectangle contre rectangle, glouton par priorité (Christensen, Marks, Shieber 1995, recuit simulé en option). Bibliothèques connues : `d3-labeler` (recuit, ancienne, non maintenue), `labella.js` (frises de dates), `@visx/annotation` (ancre + fil, mais sans anti-collision), Recharts (aucune anti-collision). **À vérifier par le pilote : aucun accès réseau ici, rien n'a été confirmé sur la maintenance actuelle.** | Pas de dépendance neuve. Une fonction pure `placerEtiquettes` : au plus ~12 étiquettes, 3 à 5 positions candidates (droite de la marche, dessous, gauche), glouton par priorité (projet testé, brassin, plus gros montant, puis date), collision par rectangles, jamais de recouvrement ; ce qui ne trouve pas de place passe dans une pastille « + N » qui ouvre la liste. Testée sur la fixture de la maquette et sur 25 sorties. À la deuxième rustine sur ce module : arrêt, on rouvre cette ligne (L29). |
| Graduations « jolies » d'un axe (Heckbert 1990, nombres 1-2-5 × 10^k) | `d3-scale` (`scaleLinear().nice().ticks()`) est installé mais seulement en dépendance transitive de `recharts` (`victory-vendor`) : l'importer en direct sans le déclarer au `package.json` est fragile. | Recommandé : déclarer `d3-scale` au `package.json` (décision du pilote : fichier hors de ma voie). Repli sans dépendance : Heckbert en 15 lignes, testé sur les bornes de la fixture (−892,66 à 4 181,60 → pas de 1 000). |

Tant que ces deux lignes ne sont pas dans MISSION.md, l'étape 2 ne commence pas par `escalier`/`placement`.

## 1. Défauts visés (diagnostic `INVENTAIRE-CODE.md`, problèmes de la NOTE de p5b : 15, 16, 24, 86-métier)

- **15 / 24** : l'écran Prévisions actuel est un résumé à cinq totaux, deux boutons et une liste ; le brasseur ne voit pas « où je passe sous zéro ni pourquoi ». → p5b : escalier et étiquettes.
- **16** : le brassin planifié n'apparaît pas seul. Cause : `FinancesTab` n'appelle pas `buildForecast` avec `batches` (d2 l'a laissé non branché, `d2/RESULTAT.md` « Non branché (L11) »). → branché ici, avec `stockItems`, `assets` (`data.assets`) et `brewTaxReduction`.
- **86-métier** : un projet de matériel (frigo) ne dit pas ce qu'il coûte au litre ni ce qu'il faut vendre pour le payer. → fiche de l'étiquette (usure, litre 7,51 → 8,01, plus bas, « pour rester à zéro »), calculs de `mesurerAchat` (d3).
- **Sa remarque du 09.11** (« Là je vois tout sur le graphe ») : l'information est sur le graphe, la liste est repliée.
- **« Prévoir » de c3a** (`BrewBudgetDialog.tsx:45`, `onOpenForecast`) : écrit `finances_workspace = forecast` mais n'amène nulle part. → branché sur l'étiquette du brassin.
- Réserve du critique sur p4a (marches 1, 4, 6, 7 sans pastille) : chaque marche a son étiquette ou une pastille « + N ».

## 2. Inventaire de p5b : chaque élément et chaque état, et où il va dans le code

Source CSS : `etat.html` (préfixe `p5b-`) ; chaque classe est reprise avec le préfixe `prv-` dans `src/ui/finance/previsions.css` (L26 : classes préfixées, un nom par rôle).
Les couleurs de la maquette (`--fin #1F64A3`, `--frigo #176878`, `--brassin #9A4F1E`, `--alerte #C8382F`…) passent par les jetons de DESIGN.md quand ils existent ;
sinon variables locales de `previsions.css`, thème clair ET cave (la maquette n'existe qu'en clair : la cave est à dessiner, voir § 8).

### Écran 1 (premier plan)

| # | Élément p5b | Donnée source | Fichier / fonction (nouveau) |
|---|---|---|---|
| E1 | En-tête de l'app, rail « Synthèse · Opérations · Prévisions · Annuel », barre du bas, FAB | existants | App, `FinancesTab` (`finance-nav` déjà là) : inchangés |
| E2 | Titre « Fin janvier » (h1 18 px) = mois du dernier jour de l'horizon | `forecastHorizonEnd(asOf, horizon)` − 1 jour | `previsions/Previsions.tsx`, `titreHorizon()` (année ajoutée pour 12 mois seulement) |
| E3 | Segment « 30j · 90j · 12 mois » (28 px, un seul actif) | état `horizon` existant (`FinancesTab.tsx:67`) | `Previsions.tsx`, `role="group" aria-label="Horizon de prévision"` (le nom actuel est conservé) |
| E4 | Bascule « Avec frigo / Sans frigo » (barre 44 px, deux boutons `aria-pressed`) : à gauche le chiffre en fin d'horizon avec le projet et « sous zéro 25.01 » ; à droite sans le projet, « CHF, estimé » | deux `buildForecast` : avec et `includeEquipmentProjects:false` (ou `ignoreUpgradePlanId` pour un seul projet), cumul quotidien | `escalier.ts` : `soldeFin`, `premierJourSousZero` |
| E5 | Escalier (500 px, fond panneau arrondi 16) : grille, zéro en gras, graduations à gauche, séparateurs de mois pointillés + noms (nov. déc. janv.), ligne « aujourd'hui 4 181,60 », aire sous la courbe, **aire rouge sous zéro**, pointillé bleu « sans frigo », points rouges aux marches sous zéro, solde de fin en gros (« − 892,66 ») | solde de départ `ledger.cashCents` + `ForecastItem[]` datés (< fin de l'horizon) | `escalier.ts` (pur : marches, échelles, aires) ; `Escalier.tsx` (SVG, `preserveAspectRatio="none"` comme la maquette, texte en `<text>` non déformé : voir risque R7) |
| E6 | Étiquettes : pastille blanche à bord coloré tenue par un fil à sa marche : nom, montant, date ; le projet testé en grand (2 lignes, bord 2 px, « usure 600, litre 8,01 ») ; le brassin en brun avec sa source (« recette, stock, facture ») ; les prévus en pointillé bleu ; le **solde après** posé sur les marches assez longues (664,18 · 257,34) | `ForecastItem` (`source`, `label`, `date`, `amountCents`, `lines`, `partial`) ; solde après = cumul | `placement.ts` (pur) ; `Etiquette` dans `Escalier.tsx` ; style choisi par `styleEtiquette(item, projetTeste)` |
| E7 | Légende « À payer 460,00 · Prévu ~ 1 550,00 » (pastille rouge pleine, pastille bleue cerclée) | À payer = sorties `source:'invoice'` ; Prévu = sorties `plan`, `recurring`, `trend`, `equipment` hors projet testé (le brassin et le projet testé portent leur couleur sur l'étiquette) | `escalier.ts` : `notions()` ; `Previsions.tsx` |
| E8 | Pied : pli « Entrées : aucune › » (14 px de chevron), pli « N sorties › » (annexe), primaire rouge « + Vente » | entrées de la prévision ; nombre d'items sous l'horizon | `Previsions.tsx` ; « Vente » : voir § 7, décision D1 |
| E9 | Zone vide entre la légende et le pied (la maquette laisse environ 60 px) | — | CSS : le pied est collé en bas du conteneur (`margin-top:auto`), comme la maquette |

### Écran annexe (étiquette du projet touchée : « sa fiche monte du bas »)

| # | Élément | Donnée source | Fichier |
|---|---|---|---|
| F1 | Voile 28 % + fiche blanche 16 px de rayon, 10 px des bords, escalier visible derrière ; titre « Frigo, 3 000,00 CHF », à droite « estimé · 15.11 » | plan `equipment` (`title`, `amountCents`, `date`) ; « exemple » devient « estimé » ou « devis » selon `upgrade.estimateSource` (décision n° 5 de uc : jamais « exemple » sur une donnée réelle) | `previsions/FicheEtiquette.tsx` sur `Sheet` (`src/ui/Sheet.tsx`, déjà là : vaul, focus, Échap) |
| F2 | « Usure sur [3 ans · **5 ans** · 8 ans] » : **un facteur libre** | `upgrade.usefulLifeYears` ; enregistrée par `FinanceService.saveUpgrade` (validation 1–50, par demi-année : `upgrades.ts:48`) | idem ; segment `aria-pressed` |
| F3 | Quatre tuiles : « Usure par an 600,00 », « Mon litre 7,51 → 8,01 », « Fin février − 892,66 » (mois de fin dérivé de l’horizon), « Plus bas − 892,66 le 30.01 » | usure : `mesurerAchat().usureParAnCents` ; litre : `BrassinPrevu.coutLitre.complet` (calculé avec `ignorerPlanId`) puis `mesurerAchat().coutLitreAvecCents` ; fin et plus bas : escalier quotidien (pas les soldes de fin de mois de `mesurerAchat`) | `previsions/mesureProjet.ts` (pur, assemble `mesurerAchat` + `escalier`) |
| F4 | Tuile large « Pour rester à zéro : 179 bouteilles 33 cl à 5,00 · exemple » | `mesurerAchat().ventes` : **aucune source de format dans le code** (`PricingItem` n'a ni volume ni prix de format ; `FormatVente` de `chaineLitre.ts` est donné par l'appelant) | voir décision D2 ; sans format : « ? bouteilles, donne le prix d'une bouteille » (jamais 0) |
| F5 | Actions « Retirer · Déplacer · Ouvrir le projet » | Retirer : `saveUpgrade({...plan, status:'draft'})` (le projet reste dans ses idées, comme le décoche actuel `changeInclusion`) ; Déplacer : mois de paiement (`date: AAAA-MM-01`, `datePrecision:'month'`, comme `UpgradeSheet.setMonth`) ; Ouvrir : `UpgradeSheet` existant | `FicheEtiquette.tsx` |

### États de p5b et cas neufs (rangés dans un état de sa maquette, pas un composant neuf)

| État | Traitement |
|---|---|
| Fiche d'une étiquette du **brassin** (n'existe pas dans p5b, qui montre seulement celle du frigo) | Même fiche, mêmes tuiles : « Achats 22,42 · Énergie et nettoyage 11,00 · Emballage 24,00 · Impôt 6,84 » (= 64,26, testé), une ligne par `ForecastItem.lines` (« dernier prix de facture », « densité cible de la recette (estimé) »), « se met à jour seul » ; actions « Ouvrir le budget » (`BrewBudgetDialog`) à la place d'Ouvrir le projet ; pas de segment d'usure. C'est le but du geste « Prévoir ». |
| Étiquette d'une facture ou d'un plan | Touchée : l'action existante de `forecastRow` (ouvre la pièce `setSelected(invoice)` ou la feuille du plan `openPlan`). Pas de fiche. |
| Tendance (`source:'trend'`) | Touchée : le même avis que `forecastRow` aujourd'hui (« Tendance calculée sur… »), dit dans la fiche en une ligne. |
| Aucun projet de matériel actif | La bascule disparaît ; une seule carte « Fin février » avec le solde. |
| Plusieurs projets | Le **projet testé** est celui que la bascule nomme : par défaut le plus gros budget actif dans l'horizon ; toucher l'étiquette d'un autre le remet testé. Les autres sont des étiquettes pointillées bleues « prévu ». Voir D3. |
| Solde de départ inconnu (`ledger.cashComplete` faux) | Le chiffre de tête dit « À compléter », jamais 0. L'escalier part de « aujourd'hui = 0 » avec l'axe nommé « écart depuis aujourd'hui » et sans aire rouge ; un bouton « Renseigner le solde de départ » (ProfileSheet) est dans les limites. L'inconnu n'est pas dessiné comme un solde. Voir D4. |
| Sous zéro | Aire et ligne rouges, point rouge à la première marche négative, « sous zéro 25.01 » dans la bascule, solde final en rouge (`--alertet`). |
| Aucune sortie sur l'horizon | Un escalier plat, un texte « Aucune sortie prévue sur 30 jours » dans la zone du graphe (vide dit, pas masqué). |
| Trop de sorties (« plus de 10 sorties sur 90 jours et les étiquettes manquent de place », NOTE « Casse ») | `placerEtiquettes` regroupe : ce qui n'a pas de place devient « + N » (pastille tenue au pas des marches) ; la liste de l'annexe porte tout. Test sur 25 sorties. |
| Brassin avec montant partiel (`partial`) | Étiquette : « −22,42, ? » et sous-ligne « partiel : emballage ». Jamais un montant complet affiché pour un partiel. |
| Hors ligne | Rien de réseau dans l'écran ; Dexie/Firestore via `useStorageValue` comme avant. |

### Annexe « N sorties » : la liste de p4a (« inchangée »)

Ouverte depuis le pli « N sorties » du pied, dans une `Sheet`. Contenu repris de p4a : lignes numérotées, pastille de source, nom, date, montant, « → solde après »
(la liste de `p3/p4a/p4a-page.png`). **Cela remplace** `forecastRow`, « Échéances et estimations à venir » et son « Voir les N suivantes ». Y vivent aussi, au second plan et dans la langue de la maquette
(ligne d'actions en tête de la feuille) : « Ajouter une prévision » (`PlanSheet`), « Budget d'un brassin » (`budgetPicker`), « Mes projets de matériel »
(feuille qui contient `UpgradeWorkspace`, § 3), « Toutes mes prévisions (N) » (plans non-projets), « Entrées » (liste des entrées prévues), « Échéance à préciser : N pièces » (`forecast.undated`),
« Limites de cette prévision (N) » (`forecast.warnings`).

## 3. Ce que l'ancien écran perd ou garde (« Remplacer, jamais fusionner »)

| Ancien (Prévisions de HEAD) | Sort |
|---|---|
| Sous-onglets « Échéances / Projets de matériel » (`forecastPart`) | **Disparaissent.** `forecastPart==='projects'` (venu de `finances_workspace='projects'`, `App.tsx:1015`, et de `showProjects`) ouvre la feuille « Mes projets de matériel » à l'arrivée. |
| Ligne `finance-bar` « Prévisions » + icône réglages | La barre est remplacée par la tête de p5b (E2, E3). L'icône « Solde et paramètres » (`ProfileSheet`) n'est pas dans p5b : elle passe au second plan, dans « Limites » (quand le solde manque) et en bouton discret de la tête. **Compromis listé (D5).** |
| `FinanceForecastSummary` : cinq totaux (Factures à régler, Budgets et estimations, Sorties prévues, Entrées prévues, Solde estimé) | **Remplacé** par la bascule (solde), la légende (à payer / prévu) et le pli Entrées. Le composant garde, **réécrit**, le seul rôle de dire ce qui manque (avertissement « Prévision incomplète », « Confirmer les paiements », « Renseigner le solde de départ », ligne « Échéance à préciser », liste des limites) : il devient le contenu du pli « Limites » du pied, présent seulement si la prévision est incomplète. Plus de props `invoiceOut`, `estimatedOut`, `incoming`, `projectedCash`, `horizonLabel` utilisées. |
| Case « Inclure mes projets de matériel · 3 000 » | Remplacée par la bascule Avec/Sans (même état `includeEquipmentProjects` quand il n'y a qu'un projet ; pour plusieurs, `ignoreUpgradePlanId`). La phrase « Les factures restent incluses » devient la sous-ligne « CHF, estimé ». |
| Boutons « Ajouter une prévision », « Budget d'un brassin » | Second plan : en tête de l'annexe « N sorties ». |
| « Comparer les mois » : courbe Recharts, tableau mensuel, filtre de période, opérations du mois | **Remplacé par l'escalier.** `FinanceComparisonChart.tsx` n'est plus importé par `FinancesTab`. **Je ne supprime pas le fichier** (règle : rien supprimé sans accord) : liste pour le pilote (D6). `scripts/agents/inventaire-ecrans.mjs:126` le cite encore comme fichier de la Synthèse. |
| « Échéances et estimations à venir » + « Voir les N suivantes » | Remplacés par la liste de l'annexe. |
| « Toutes mes prévisions (N) » (plans) | Dans l'annexe. |
| `UpgradeWorkspace` (liste À venir / Réalisés / Archives, « Inclure dans mes prévisions », « Noter l'achat ») | **Reste tel quel** : il sert encore `CreativeLabTab.tsx:214` (Production › équipement). Dans Prévisions il n'est plus un onglet : il est dans la feuille « Mes projets de matériel » de l'annexe. `UpgradeAnalytics` (Synthèse › Coûts) garde `onBrowse={showProjects}` : ce geste ouvre cette feuille. |
| `UpgradeSheet` | Gagne « Usure et mise en service » (catégorie d'usure `DEPRECIATION_CATEGORIES`, durée libre 1–50, mois de mise en service), point (4) de `d3/RESULTAT.md`. Le reste est inchangé. C'est « Ouvrir le projet ». |
| Assistant (`financeAssistant`) | Reste en bas de l'écran ; vue `forecast` ou `projects` comme avant (`FinanceAssistant.tsx:6`). À juger au rendu : p5b n'a pas de bloc assistant ; s'il fait défiler l'écran, il passe derrière le pli « sorties ». Voir D5. |

## 4. Changements, par fichier et fonction

**`src/components/tabs/FinancesTab.tsx`** (Prévisions + branchement Prévoir seulement)
- `buildForecast` (l. 92-93) : passe `batches`, `stockItems`, `assets: data.assets`, `brewTaxReduction`, et calcule toujours les deux scénarios (avec projets, sans) : 2 × ~12 ms mesurés par d2 (54 ms au pire). Mémoïsation par `useMemo` sur `[transactions, data, batches, stockItems]`.
- Supprime : états `forecastPart` (sauf l'ouverture de la feuille projets), `upcomingLimit`, `chartOpen`, `selectedForecastMonth`, refs de période, `forecastChart`, `projectedCash`, `invoiceOut`, `estimatedOut`, `forecastRow` (déplacé dans l'annexe), blocs JSX des l. 184-226.
- Ajoute `<Previsions …/>` (props : `forecastAvec`, `forecastSans`, `ledger`, `plans`, `batches`, `assets`, `profile`, `transactions`, `horizon`, `onHorizon`, et les callbacks existants `openPlan`, `setSelected`, `setPlan`, `setBudgetPicker`, `setUpgrade`, `setProfileOpen`, `openJournal`).
- `BrewBudgetDialog` (l. 246) reçoit `onOpenForecast={({planId,batchId})=>{selectView('forecast');setBudget(null);setCible({planId,batchId});}}` ; `Previsions` ouvre la fiche de l'étiquette du brassin `batchId` quand `cible` est posée (et la fait défiler dans l'escalier).
- Les trois autres onglets, les feuilles (`PlanSheet`, `UpgradeSheet`, `PaymentSheet`…) restent.

**`src/ui/finance/previsions/`** (neuf)
- `escalier.ts` : `construireEscalier({ departCents|null, items, debut, fin })` → `{ marches[{date,soldeApresCents,items}], soldeFinCents, premierJourSousZero, pointBas{date,soldeCents}, min, max }` ; `notions(items, projetId, brassinIds)` → `{ aPayer, prevu, brassin, projet, sorties, entrees }` (somme = total des sorties, au centime) ; `titreHorizon` ; `echelle` (graduations, selon § 0).
- `placement.ts` : `placerEtiquettes(marches, cadre, mesureTexte)` (selon § 0).
- `mesureProjet.ts` : `mesureDuProjet({ plan, plans, assets, transactions, forecast, batches, stockItems, profile, asOf, format? })` → usure par an, litre avant/après, fin, plus bas, bouteilles ou `null`, avertissements.
- `Previsions.tsx`, `Escalier.tsx`, `FicheEtiquette.tsx`, `ListeSorties.tsx`, `ProjetsMateriel.tsx` (feuille qui contient `UpgradeWorkspace`).
- `src/ui/finance/previsions.css` (neuf), classes `prv-…`.

**`FinanceForecastSummary.tsx`** : réécrit en « limites » (§ 3). **`FinanceComparisonChart.tsx`** : non importé ; fichier gardé (D6). **`UpgradeWorkspace.tsx`** : inchangé, sauf si `onOpenProject` doit rester branché par la feuille (il l'est déjà). **`UpgradeSheet.tsx`** : champs d'usure.

Aucune écriture hors `saveUpgrade` (durée, mois, statut) et les feuilles existantes. Aucune migration : `usefulLifeYears`, `depreciationCategory`, `inServiceMonth` sont des champs facultatifs de d3.

## 5. Tests qui échouent d'abord (Vitest, fixtures, Gemini jamais appelé)

Nouveaux fichiers dans `tests/integration/previsions*.test.tsx` (le « Possède » ne cite pas `tests/unit/` ; même les fonctions pures sont donc testées là, extension `.tsx`).
**CORRIGÉ (revues A-B1, B-1 ; règle du pilote : le domaine est la vérité, la maquette donne la forme).** Fixture commune : `tests/integration/previsionsFixture.ts`, `asOf = 2026-11-09`,
solde de départ 4 181,60 : facture d'atelier −60 en retard (ramenée à aujourd'hui), frigo −3 000 (15.11, plan équipement, usure 5 ans, estimé), brassin Pale Ale planifié le 20.11 (celui de d2),
loyer −400 (facture 25.11 ; 25.12 et 25.01 récurrents), fermenteur −750 (devis, 28.01). **Les nombres attendus sortent d'une sonde sur le vrai `buildForecast`** (`previsionsSonde.test.tsx`, jetable) :
`09.11 atelier −60,00 → 4 121,60 · 13.11 achats −22,42 → 4 099,18 · 15.11 frigo −3 000,00 → 1 099,18 · 20.11 énergie et nettoyage −11,00 → 1 088,18 · 25.11 loyer −400,00 → 688,18 ·
04.12 emballage −24,00 (date estimée) → 664,18 · 25.12 loyer −400,00 → 264,18 · 25.01 loyer −400,00 → −135,82 · 28.01 fermenteur −750,00 → −885,82 · 30.01 impôt −6,84 (date estimée) → −892,66`.
**Dix sorties** (pas huit). Premier jour sous zéro : 25.01. **Plus bas : −892,66 le 30.01** (pas le 28.01). Fin d'horizon (90 j, dernier jour inclus 06.02) : −892,66 ; sans le frigo : 2 107,34 (le fermenteur reste).
Brassin : 22,42 + 11,00 + 24,00 + 6,84 = 64,26 (= `cashRequiredTTC`). À payer 460,00 ; prévu 1 550,00. Écarts avec la maquette (dates et nombres du domaine), listés au critique : les quatre sorties du
brassin à leurs quatre dates (la maquette en dessine deux), 264,18 et non 257,34, plus bas le 30.01, titre « Fin février », axe jusqu'au 06.02.

| Test (fichier `previsionsEscalier.test.tsx`) | Attendu | Rouge parce que |
|---|---|---|
| marches et soldes après | liste ci-dessus, au centime | `escalier.ts` n'existe pas |
| fin, sous zéro, plus bas | −89 266 ; premier jour sous zéro 2027-01-25 ; plus bas −89 266 le 2027-01-30 ; dix sorties | idem |
| sans solde de départ | `soldeFinCents === null`, jamais 0 ; marches en écart | idem |
| notions | à payer 46 000, prévu 155 000, brassin 6 426, projet 300 000 ; leur somme = total des sorties | idem |
| coupure d'horizon | une sortie à `fin` + 1 jour est exclue ; 30 j / 90 j / 12 mois (reprend `forecastHorizon.test.ts`) | idem |
| graduations | pas de 1 000 sur [−892,66 ; 4 181,60], zéro toujours présent | idem |
| `previsionsPlacement.test.tsx` | huit étiquettes de la fixture : aucune paire de rectangles ne se recouvre, toutes dans le cadre 370×500 ; 25 sorties : jamais de recouvrement, le reste dans « + N » (N = 25 − placées) ; ordre stable (même entrée, même sortie) | `placement.ts` n'existe pas |
| `previsionsMesureProjet.test.tsx` | frigo 3 000 sur 5 ans = 600,00/an ; 1 200 L → 0,50 → litre 7,51 → 8,01 ; durée 3 ans = 1 000,00/an, 8 ans = 375,00/an ; projet sans durée ni catégorie : usure `null` (« à renseigner »), litre « — », jamais 0 ; assujetti à la TVA sans prix HT : avertissement de `mesurerAchat` repris, pas de ventes ; sans format : bouteilles `null` | `mesureProjet.ts` n'existe pas |
| `previsionsEcran.test.tsx` (FinancesTab, `?dev-local`, Dexie de test) — l'onglet EST p5b | titre « Fin février » ; groupe « Horizon de prévision » (30j/90j/12 mois) ; bascule `aria-pressed` avec « Avec frigo » / « Sans frigo » et les deux chiffres ; étiquettes comme boutons nommés (« frigo −3 000 … ») ; légende « À payer » / « Prévu » ; pli « 8 sorties » ouvre la liste ; **absents** : « Comparer les mois », « Échéances et estimations à venir », « Factures à régler » en carte, sous-onglets « Échéances » et « Projets de matériel », case « Inclure mes projets de matériel » | l'ancien écran est encore là |
| idem, brassin | un lot `planifie` avec recette apparaît seul (« Pale Ale », achats puis impôt), sans plan « Prévoir » ; lot `termine` ou `conditionne` : plus de sortie ; le même 64,26 que la feuille c3a | `buildForecast` n'a pas `batches` |
| idem, fiche et gestes | toucher « frigo » → fiche (usure 600,00, litre 7,51 → 8,01, plus bas) ; « 8 ans » → `FinanceService.getPlans()[…].upgrade.usefulLifeYears === 8` et « 375,00 » ; « Retirer » → `status:'draft'`, l'étiquette disparaît, le plan reste ; « Déplacer » → mois changé, `datePrecision:'month'` ; « Ouvrir le projet » → `UpgradeSheet` ; ouvrir deux fois : un seul enregistrement (double clic) | n'existe pas |
| idem, Prévoir | depuis l'annexe « Budget d'un brassin » → feuille c3a → « Prévoir » → Prévisions, fiche du brassin ouverte, `finances_workspace='forecast'` | `BrewBudgetDialog` rendu sans `onOpenForecast` |
| idem, honnêteté | solde de départ absent : « À compléter », aucun « 0,00 » en tête, bouton « Renseigner le solde de départ » dans les limites ; brassin partiel : « partiel » nommé sur l'étiquette ; aucune étiquette ne porte le mot « exemple » | idem |
| idem, ouverture `projects` | `finances_workspace='projects'` : la feuille « Mes projets de matériel » s'ouvre sur Prévisions | `forecastPart` n'ouvre plus de sous-onglet |

**Réécrits parce qu'ils décrivent l'ancien écran** (listés pour le pilote, pas supprimés) : `financeWorkspace.test.tsx` (6 tests : annonce des limites, graphique à l'ouverture, « Comparer les mois », case projets, séparation factures/budgets avec « Voir les 3 échéances suivantes », 30 jours / 12 mois glissants) ;
`equipmentProjects.test.tsx` (3 : case « Inclure mes projets de matériel », échéances après achat, retrait du projet ; les tests d'`UpgradeWorkspace` seul ne changent pas) ; `mobileDailyViews.test.tsx` (1 : titre « Échéances et estimations à venir », boutons d'ajout) ;
`tests/ux-mobile/financePeriodDrilldown.test.tsx` (tout le fichier : il perce un mois du tableau « Comparer les mois » ; ses règles de calcul passent aux tests de l'escalier, les gestes disparaissent avec le tableau) ;
`tests/ux-mobile/finance.browser.mjs` et `scripts/check-ux-mobile-poc.mjs` (clic sur « Comparer les mois » : scripts Chrome, jamais lancés ici, mis à jour pour ne plus le cliquer) ;
`tests/unit/depense/ecran/libelles.test.tsx` (2 lignes : retrait des props de totaux dans `base`). Chaque règle de calcul qu'ils vérifiaient (limites annoncées, 30 j exact, 12 mois glissants, factures sans échéance) est reprise par un test du nouvel écran avant de retirer l'ancien.

## 6. Appelants hors « Possède » (grep `src/ tests/ scripts/` entiers), rejoués sur HEAD

Symboles changés : `FinanceForecastSummary`, `FinanceComparisonChart`, `UpgradeWorkspace`, `UpgradeSheet`, `UpgradeAnalytics`, `upgradeDateLabel`, `onOpenForecast`, le texte des onglets Prévisions.

| Appelant | Lien | Sort |
|---|---|---|
| `src/components/CreativeLabTab.tsx:27,214` | `UpgradeWorkspace` (Production › équipement) | **inchangé** : composant gardé tel quel ; test existant d'`equipmentProjects.test.tsx` le couvre |
| `src/App.tsx:1015` | écrit `finances_workspace='projects'` | inchangé ; `initialView` le lit déjà (`FinancesTab.tsx:51`) et la feuille projets s'ouvre |
| `src/App.tsx:964` | passe `batches`, `stockItems` à `FinancesTab` | **déjà là** : rien à ajouter. `onOpenQuickAction` n'est pas une prop de `FinancesTab` (les tests la passent à vide) : le bouton « Vente » demande une prop et un câblage de `App.tsx` (D1). |
| `src/domain/finance/assistantContext.ts:95` | appelle `buildForecast` **sans** `batches` | hors voie : l'assistant ne voit pas le brassin dérivé que l'écran montre (écart signalé par d2). À faire par le pilote. |
| `src/ui/finance/FinanceAssistant.tsx:6,25` | vue `'forecast'` / `'projects'` | inchangé |
| `src/ui/finance/BrewBudgetDialog.tsx:15,45` | `onOpenForecast` optionnel | inchangé (voie uc) ; `FinancesTab` le renseigne. Les trois autres usages (`BrewBudgetButton` : BrewWizard, RecipePage, BatchDetailSheet) n'ont pas d'écran Prévisions sous la main : le lien n'y est pas affiché (comportement d'uc, voulu) |
| `scripts/agents/inventaire-ecrans.mjs:126,130,261` | cite `FinanceForecastSummary`, `UpgradeWorkspace`, `UpgradeSheet`, `upgrades.css` et la zone `{view==='forecast'&&forecastPart==='timeline'…` | **à rejouer** : `inventaire-ecrans.mjs` repère la zone par une chaîne de `FinancesTab.tsx` ; ma réécriture la change. Je lance le script avant et après et je rends la ligne à corriger (fichier hors de ma voie). |
| `tests/…` (liste § 5) | textes de l'ancien écran | réécrits, listés |
| `tests/integration/upgradeSheetTe35.test.tsx` | `UpgradeSheet` seule | rejoué : les champs ajoutés ne touchent ni « Inclure dans mes prévisions » ni le message d'erreur |
| `tests/unit/brewForecast.test.ts`, `materielFutur.test.ts`, `forecastHorizon.test.ts`, `financeForecast.test.ts`, `ta3…ta6`, `finance.test.ts` | domaine seul | **inchangés** : je n'écris pas dans `forecast.ts`, `brewForecast.ts`, `materielFutur.ts` ; rejoués au vert pour le prouver |

**Rejoué sur HEAD** (`voies/pv/tests-head.txt`, 09.11, avant tout code) : 10 fichiers listés (financeWorkspace, mobileDailyViews, equipmentProjects, upgradeSheetTe35, brewBudgetDialog, financePeriodDrilldown, libelles, ta3-a-payer, financeAnnuelSaisie, financeArchives) :
`Test Files 9 passed (9)` · `Tests 92 passed (92)`. Le dixième, `tests/ux-mobile/financePeriodDrilldown.test.tsx`, **n'est pas chargé** : `vitest.config.ts:61-67` n'inclut que `tests/unit`, `tests/integration`, `tests/fuzz` et `prototypes/houblons-v4` (L11 : un test non chargé n'est jamais un vert). Il ne tourne donc pas dans `npm test` ; au rejeu de l'étape 2 je le lance avec une configuration qui le charge, ou je le range dans `tests/integration/` (réécrit) : décision à confirmer par la revue.
Non rejoué : `financeAssistantContext.test.ts` (`firebase-admin` absent du poste, déjà rouge sur HEAD, déjà signalé par d1, d2, d3).

## 7. Risques

| # | Risque | Parade |
|---|---|---|
| R1 | **Données existantes** : projets sans durée ni catégorie d'usure (tous ceux d'avant d3) ; plans « Prévoir » déjà enregistrés pour un brassin | Usure inconnue = « à renseigner », jamais 0, jamais 100 ÷ taux d'une catégorie absente. Les plans « Prévoir » restent lisibles dans la liste « Toutes mes prévisions » ; `buildForecast` les remplace déjà par les sorties dérivées (d2 : `remplaces`). Aucune migration, aucune écriture au chargement. |
| R2 | **Double compte** : brassin dérivé + plan « Prévoir » ; usure du projet + actif au registre | Délégué à d2 (`remplaces`) et d3 (`usureAnnuelleLitre`, un matériel une fois) ; un test d'écran vérifie que le total des sorties ne double pas (brassin planifié + son plan `brewEstimate` : 64,26 une fois). |
| R3 | **Arrondis** : tout en centimes entiers jusqu'à l'affichage ; litre = coût exact, arrondi à l'affichage seulement (`mesurerAchat.partParLitreCents` exact) ; la somme des quatre notions égale le total des sorties au centime | test des notions ; `formatCHF`, `nombreFr` existants, virgule décimale (`controle-virgule.mjs` rejoué). |
| R4 | **Hors ligne** | aucune requête réseau nouvelle ; tout vient de `useStorageValue` (Dexie / Firestore en cache). |
| R5 | **Double clic** sur Retirer, Déplacer, un des 3/5/8 ans | `saveUpgrade` asynchrone : bouton désactivé pendant l'enregistrement + verrou de ref (même motif que `UpgradeSheet.locked`) ; test d'un double clic = un seul enregistrement. |
| R6 | **Performance** : deux `buildForecast` avec brassins (d2 : 11,6 ms réaliste, 54 ms au pire, chacun) ; placement des étiquettes à chaque rendu | `useMemo` ; placement mesuré à froid sur 25 sorties (cible : moins de 5 ms) ; chronométré dans un test avec garde large (L20). |
| R7 | **SVG étiré** : p5b utilise `viewBox="0 0 370 500"` en `preserveAspectRatio="none"` : le texte se déforme dès que la largeur n'est pas 370 (1280, et tout téléphone différent de 390) | Le SVG garde la hauteur de 500 px et la largeur de son conteneur ; je dessine à la largeur mesurée (ResizeObserver, `useLayoutEffect`) sans étirer le texte : la maquette donne l'aspect à 390, pas la déformation. À 1280 la colonne reste centrée à 390–560 px (comme c3a l'a fait). |
| R8 | **Cible tactile** : étiquettes de 18 px (maquette B13 : 18 à 42) | Zone de toucher invisible d'au moins 32 px de haut par étiquette quand le placement le permet ; sinon la ligne de la liste (44 px) fait foi. Non mesuré au doigt avant le rendu (L12 : « sous le doigt / au loin » ×3 à la capture). |
| R9 | **Thème cave** : p5b n'existe qu'en clair | Les jetons du projet portent déjà les deux ; vérifier à la capture que le brun du brassin (`#9A4F1E`) tient 4,5:1 sur fond sombre (la maquette l'a mesuré sur blanc seulement). |
| R10 | **Démo** : `?dev-local&finance-demo` (`src/dev/financeDemo.ts`, hors de ma voie) n'a ni brassin planifié (`batches` vide) ni frigo : la capture « côte à côte avec p5b » est impossible sans les ajouter | D7. En attendant, un script de capture dans `voies/pv/` pose la fixture de la maquette dans Dexie après chargement. |
| R11 | `forecast.ts` accepte `ignoreUpgradePlanId` mais `buildForecast` ne l'applique qu'aux **brassins** (`ignorerPlanId` pour l'usure du litre), pas aux items du projet | La bascule « sans le projet » retire les items du projet testé après le calcul (filtre sur `planId`) ; je n'ouvre pas `forecast.ts` (voie d2). Test : sans = avec + 3 000 sur la fixture. |

## 8. Hors périmètre

Synthèse, Opérations, Annuel ; `App.tsx` ; `forecast.ts`, `brewForecast.ts`, `materielFutur.ts`, `brewBudget.ts` ; `assistantContext.ts` ; `financeDemo.ts` ; suppression de `FinanceComparisonChart.tsx` ;
la dérivation de l'impôt des brassins conditionnés (d2 : avertissement seulement) ; la création d'un format de vente (prix et volume) : s'il n'existe pas, la tuile « Pour rester à zéro » le dit ; le dessin du thème cave de p5b (maquette en clair seulement, adaptation par les jetons, jugement au rendu) ;
Gemini (jamais appelé) ; aucun commit, aucun `git stash`, aucune donnée réelle.

## 9. Décisions et compromis à faire valider (rien n'est tranché pour le brasseur)

| # | Question | Ma recommandation |
|---|---|---|
| D1 | Le bouton primaire « Vente » de p5b : `FinancesTab` n'a pas de prop pour ouvrir l'action rapide (`App.tsx`, `runFabAction`). | Le pilote ajoute `onOpenSale` à `App.tsx` ; je branche le bouton, caché tant que la prop est absente. Le FAB « + » existe déjà. |
| D2 | « Pour rester à zéro : 179 bouteilles à 5,00 » : aucune source du prix ni du volume d'un format. | Champ « Prix d'une bouteille 33 cl » dans la fiche (clé d'état d'interface, pas une donnée métier), coût du format par `coutFormat` (d1) si le litre est complet, sinon repli de `mesurerAchat` (coût moyen du litre × volume) avec son avertissement. Sans prix saisi : « à renseigner ». |
| D3 | Plusieurs projets de matériel : lequel porte la bascule ? | Le plus gros budget actif dans l'horizon ; toucher un autre l'y met. À montrer au brasseur en mini maquettes si le cas devient courant (un seul projet aujourd'hui). |
| D4 | Solde de départ inconnu : p5b ne le dessine pas. | « À compléter » en tête, escalier en écart depuis aujourd'hui, nommé comme tel, sans aire rouge. |
| D5 | L'icône réglages, l'assistant et l'ordre des feuilles de second plan, absents de p5b. | Icône discrète dans la tête, assistant sous le pied ; jugés au rendu ; sinon listés pour le pilote dans RESULTAT.md. |
| D6 | `FinanceComparisonChart.tsx` devient mort. | Accord du pilote pour le retirer en fin de port, avec la ligne de `inventaire-ecrans.mjs:126`. |
| D7 | Ajouter à `src/dev/financeDemo.ts` un brassin planifié et un frigo 3 000 CHF (chiffres de la maquette), pour la capture. | Oui, hors de ma voie : un mot au pilote. |
| D8 | Loyers 25.12 et 25.01 : la maquette les dessine en pastille neutre mais les compte dans « Prévu » (1 550,00 = 400 + 400 + 750). | Style par source : facture, plan et récurrent en pastille neutre pleine, estimé et projet non testé en pointillé bleu ; « Prévu » additionne les deux, comme ses nombres. À valider par le critique contre la capture. |

## 10. Ordre de l'étape 2 (après revue du plan)

1. § 0 réglé (MISSION.md). 2. Tests rouges (`escalier`, `placement`, `mesureProjet`, `ecran`) et `tests-rouge.txt`. 3. `escalier.ts`, `mesureProjet.ts`, `placement.ts`. 4. `Previsions` et ses feuilles, `FinancesTab`, `UpgradeSheet`, CSS. 5. Anciens tests réécrits.
6. `npx vitest run … --reporter=dot > voies/pv/tests.txt`, `npx tsc --noEmit` hors `firebase-admin`, `npx vite build`, `controle-virgule.mjs`, `inventaire-ecrans.mjs`. 7. Captures 390 tactile et 1280, clair et cave, côte à côte avec p5b : **série mécanique, donc `DEMANDE EXECUTANT`** (sauf un premier essai), captures ouvertes une à une.


## 11. Sort de chaque constat des revues (REVUE-A.md, REVUE-B.md) et des décisions (DECISIONS.md) — 09.11

Règle du pilote : **le domaine (d2, d3) est la vérité ; l'écran montre ses sorties ; la maquette donne la forme.** « Retenu » = le plan est corrigé (ci-dessus ou ci-dessous) ; « écarté » dit sa raison.

| Constat | Sort | Ce qui change |
|---|---|---|
| A-B1, B-1 fixture fausse | **Retenu** | Fixture dans `tests/integration/previsionsFixture.ts`, attendu sorti de la sonde sur `buildForecast` (§ 5 corrigé) : 10 sorties, plus bas le 30.01, 264,18, titre « Fin février ». |
| A-B2 une étiquette ou quatre | **Retenu** (recommandation de la revue) | Une marche et une étiquette par `ForecastItem` du brassin (« Pale Ale · achats −22,42, 13.11 » …), brun, toutes ouvrent la même fiche du brassin. Écart avec la maquette (deux étiquettes) : compromis « 99 % » listé. `placerEtiquettes` regroupe dans « + N » ce qui ne tient pas : la fixture elle-même le déclenche. |
| A-B3 fiche du brassin : 99,26 | **Retenu** | « Achats 22,42 · Énergie et nettoyage 11,00 · Emballage 24,00 · Impôt 6,84 » ; test : somme des sorties du brassin = 6 426 = `cashRequiredTTC`. |
| A-B4 « pour rester à zéro » | **Retenu** | « Pour rester à zéro » = `ceil(−plus bas ÷ prix de la bouteille)`, en trésorerie, avec « avant coût de production » dit (fixture : 89 266 ÷ 500 → 179). Nom distinct « Pour payer le matériel » = `mesurerAchat().ventes` (marge après coût complet), seulement si le prix de la bouteille est saisi. Prix absent : « à compléter », jamais 0 ni 179. Plus bas ≥ 0 : « Tu restes au-dessus de zéro ». |
| A-G1 D8 contredit DECISIONS | **Retenu** | Style par source : seule la **facture** est pastille neutre pleine ; plan, récurrent, tendance, projet non testé = pointillé bleu (« Prévu ») ; brassin brun ; projet testé bleu-vert. La maquette dessine 25.12 neutre : compromis listé. |
| A-G2 titre « Fin janvier » | **Retenu** | Titre = mois du dernier jour inclus de l'horizon (90 j depuis le 09.11 : 06.02 → « Fin février ») ; axe jusqu'à ce jour (nov. déc. janv. févr.) ; tuile de la fiche idem. Écart de capture avec p5b listé d'avance. |
| A-G3, B-13 entrées | **Retenu** | Entrée : marche montante, pastille verte « + », comptée dans le solde de fin ; pli « Entrées : 500,00 › » (« aucune » sinon) ; test avec une entrée de 500 au 25.11. |
| A-G4 pièces sans échéance | **Retenu** | Marque courte au premier plan sous la légende : « + 2 pièces sans date, 340,00 hors graphe › », elle ouvre « Limites » ; test avec une facture sans échéance. |
| A-G5, B-3 horloge, jsdom | **Retenu** | `asOf` est une prop de `Previsions` (`FinancesTab` passe `todayISO()`) ; tests d'écran : `vi.useFakeTimers({ toFake: ['Date'] })` + `setSystemTime`. Largeur mesurée 0 ou absente : repli 370. `mesureTexte` injectée, une seule implémentation par largeur de caractère (corps × 0,56 en sans, × 0,6 en mono), la même en test et dans l'app (pas de canvas : déterministe). Chaque test rouge dit pourquoi il est rouge sur HEAD. |
| A-G6, B-7 « Prévoir » | **Retenu** | `cible = { planId, batchId? }`. Recette seule : fiche de l'item du plan `planId`. Hors horizon : l'horizon passe au plus petit qui contient la ligne, sinon message nommé. Lot sans sortie : « Ce brassin n'a plus de sortie prévue. » Item pas encore relu : ouverture au premier rendu qui le contient, une fois. Un test par cas. |
| A-G7, B-11 « Vente » | **Retenu** | Une seule porte : celle d'uv. Prop `onOpenSale?: () => void` de `FinancesTab` ; bouton caché sans elle ; câblage `App.tsx` demandé au pilote après le retour d'uv (je ne touche pas `App.tsx`). Libellé « Vente » ou « Vendre » : au pilote. Test : appelle la prop une fois. |
| A-D1 usure absente | **Retenu** | Sous-ligne « usure ? » (jamais 0 ni 600), test. |
| A-D2 source du litre | **Retenu** | Brassin planifié le plus proche ; aucun ou production annuelle absente : « — » ; un test par cas. |
| A-D3 icône réglages, assistant | **Retenu** | Icône « Solde et paramètres » retirée de la tête, vit dans « Limites » et l'en-tête de l'annexe ; l'assistant passe sous le pli ; listé au critique. (D5 de § 9 réécrit ainsi.) |
| A-D4 tendance et retards | **Retenu** | Tendance : libellé par `CATEGORY_LABELS`, une étiquette « dépenses courantes » par mois (regroupement dans `escalier.ts`). Test avec 3 mois de tendance. |
| B-2 hors ligne | **Retenu** | « Rien de réseau » était faux pour les gestes d'écriture : `saveUpgrade` écrit en local puis attend le serveur (15 s). Verrou de ref avant le premier `await` ; `DocumentWriteError` `pending` dit « Enregistré sur cet appareil, en attente de synchro » (pas une erreur) ; l'escalier change tout de suite (lecture locale). Tests : double clic = un seul `saveUpgrade` ; rejet `pending` = message honnête. |
| B-4 fiche sur `Sheet` | **Retenu, choix (a)** | La fiche est un composant propre à `previsions/` : voile 28 %, 10 px des bords, 16 px de rayon, escalier visible derrière, `role="dialog"`, focus à l'ouverture, Échap, retour de focus. Aucune écriture dans `Sheet.tsx`. |
| B-5 performance | **Retenu** | Calcul seulement quand `view === 'forecast'` ; clé stable des brassins et du stock (empreinte `ref:quantité`) au lieu du tableau neuf de `App` ; dépendances sur `data.plans/payments/profile/assets`. Chronométrage à froid. Le test qui compte les appels de `buildForecast` : non écrit si le module ne s'espionne pas sans toucher `forecast.ts` (limite dite dans RESULTAT). |
| B-6 litre « avant » | **Retenu** | `avec = buildForecast(tout)` ; `sans = buildForecast({ ignoreUpgradePlanId: testé })` puis filtre des items `planId === testé` : le fermenteur reste dans « sans frigo » (2 107,34). Litre « avant » : `estimerBrassinsPlanifies({ …, ignorerPlanId })` appelé une fois à l'ouverture de la fiche (`buildForecast` ne rend pas les `brassins`). |
| B-8 placement tautologique | **Retenu** | `placerEtiquettes(marches, cadre, mesure, obstacles[])` ; obstacles = graduations, noms de mois, « aujourd'hui », solde final, ligne de zéro ; tests : deux mesures, trois largeurs (320, 370, 560), 25 sorties et un « 12 mois réaliste », jamais de recouvrement ni d'étiquette hors cadre ou sur obstacle ; déterministe ; chronométrage large. |
| B-9 assistant | **Retenu** | `FinanceAssistant` reçoit `includeEquipmentProjects` = bascule sur « Avec » ; avec plusieurs projets il dit « tous les projets » alors que la bascule n'en retire qu'un : limite listée ; l'écart `assistantContext.ts:95` (sans `batches`) apparaît sur le même écran : listé. |
| B-10 anciens tests | **Retenu** | Table ci-dessous ; `tests/ux-mobile/finance.fixture.tsx` ajouté ; les scripts Chrome sont mis à jour mais **non rejoués** (dit). |
| B-12 graduations | **Retenu** | Heckbert, cible 5 graduations ; cas : plage positive, négative, nulle (escalier plat), très petite plage, [−892,66 ; 4 181,60] → pas de 1 000. |
| B-14 piles de feuilles | **Retenu** | L'annexe se ferme avant d'ouvrir une feuille (détail, plan, projet) ; le focus revient sur l'écran. Test Échap + retour de focus. |
| B-15 `libelles.test.tsx`, `inventaire-ecrans.mjs` | **Retenu** | Le test teste `FinanceForecastSummary` (« Prévision incomplète ») : le composant garde ces messages, le test perd ses props de totaux. `inventaire-ecrans.mjs` lancé avant et après ; sa zone `forecastPart==='timeline'` disparaît : ligne à corriger notée pour le pilote. |
| Possède non nommé | **Retenu** | Touchés hors liste stricte, nommés dans RESULTAT : `tests/integration/{financeWorkspace,equipmentProjects,mobileDailyViews}.test.tsx`, `tests/unit/depense/ecran/libelles.test.tsx`, `tests/ux-mobile/*`, `scripts/check-ux-mobile-poc.mjs`, `tests/integration/previsionsFixture.ts`. |
| DECISIONS : état de l'art, D1–D8 | Appliquées | Lignes du § 0 validées ; `d3-scale` non déclaré : graduations écrites et testées. D2 : prix de la bouteille tiré du tarif quand c7c le portera ; en attendant champ dans la fiche, vide = « à compléter ». D8 : voir A-G1. |

### Anciens tests → nouveaux (jumeau écrit avant de retirer l'ancien)

| Ancien | Nouveau (`previsionsEcran.test.tsx` sauf mention) |
|---|---|
| `financeWorkspace` « annonce les limites de la prévision… » | « Limites » : `Prévision incomplète`, « Confirmer les paiements » ouvre Opérations |
| « ne charge le graphique qu'à l'ouverture… » | sans objet (plus de Recharts) ; remplacé par « l'escalier se rend en jsdom avec la largeur de repli » |
| « fait varier les sorties et les soldes… projet exclu » | bascule Avec/Sans : sans = avec + 3 000 ; le fermenteur reste |
| « ne redemande pas le solde déjà confirmé… » | « Limites » : pas de « Renseigner le solde de départ » quand il est confirmé |
| « sépare les factures des budgets… Voir les 3 échéances suivantes » | annexe « 10 sorties » : toutes les lignes ; légende À payer / Prévu |
| « 30 jours et douze mois glissants » | `previsionsEscalier` : coupure d'horizon |
| `equipmentProjects` « Inclure mes projets de matériel » ×3 | bascule, Retirer (`draft`), feuille « Mes projets de matériel » |
| `mobileDailyViews` « Échéances et estimations à venir », boutons d'ajout | annexe : « Ajouter une prévision », « Budget d'un brassin » |
| `financePeriodDrilldown` (non chargé) | règles de calcul reprises par `previsionsEscalier` ; fichier réécrit sous `tests/integration/` |
