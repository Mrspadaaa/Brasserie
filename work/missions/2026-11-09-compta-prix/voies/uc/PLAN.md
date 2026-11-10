# Voie uc — plan du port de c3a (coût d'un brassin et d'un litre)

Étape 1 : plan seul, aucun code. Sources lues : `VOIE.md`, `../PHASE2.md`, `../COMMUN.md`, `../ETAPE2.md`, `PLAN-METIER.md` § 1, 3.1, 3.2, 3.5 à 3.7,
RESULTAT de d1 et d3, `p2/c3a/NOTE.md` + `etat.html` + `c3a-page.png` + `c3a-1280.png` (ouvertes), `v0/c1a/NOTE.md` + `c1a-page.png` (ouverte, c'est la
« feuille c1a » que la baseline de c3a nomme), le code de `BrewBudgetSheet.tsx` (197 l.), `BrewBudgetDialog.tsx` (49 l.), `brewBudget.ts`, `chaineLitre.ts`,
`materielFutur.ts` (`usureAnnuelleLitre`), `FinancesTab.tsx` (l. 123, 178, 246), `FinanceAssistant.tsx`, `BrewerChat`.
Décisions du pilote reprises : B1 (b) bloc « À payer » en deux temps ; B2 (a) « Prévoir 64,26 CHF » fige et ouvre la ligne dans Prévisions ; P2 usure linéaire, comptée une fois.

## 1. Défauts visés (numéros de PLAN-METIER § 3.2)
- **3** : le litre n'a qu'une source ; `ingredientsCost` mêlait stock et achat → l'écran lit `dejaPaye / aPayer / annee` de d1 (`troisNotions`), pas de recalcul.
- **12** : impôt calculé (`beerTaxForVolume` via `estimateBrewBudget` quand l'OG est connue), plus de montant manuel quand la densité existe (`BrewBudgetSheet.tsx:175`).
- **27** : deux volumes saisis à la main, dont le « net » pris sur le volume à brasser (30 L au lieu de 27 : 7,21 au lieu de 7,51). Un seul volume net, venu de `litresNets`.
- **28** : clé de répartition unique (`annualVolumeL`), gardée ; la production annuelle reste dans la feuille « Charges fixes ».
- **Usure comptée une fois** (ETAPE2) : `BrewBudgetDialog.tsx:21-25` lit encore `depreciationForYear` (AFC dégressif) → `usureAnnuelleLitre` (d3).
- **Argent ≠ coût** : le bloc jaune montre la poche (`cashRequiredTTC`, sacs entiers), la barre du litre le coût ; « dont X restent en stock » si l'écart existe.
- **D1-4 laissé par d1** : l'écran ne peut plus prendre le volume à brasser pour un net sans le dire (voir § 3, point 4).
- **Emballage** calculé (d1 : `packagingCost`), « Houblon, levure » en « ? » hachuré, jamais 0 (B8 de la maquette).

## 2. Règle n° 1 : inventaire de la maquette c3a (L03), puis ce que le port en fait
La maquette est un écran-page (app chrome + fil d'Ariane + barre du bas). Le port est le **contenu de la feuille** `BrewBudgetSheet` (PLAN-METIER § 3.2 : même ouverture depuis
`BatchDetailSheet`, `RecipePage`, `BrewWizard`, Finances › Coûts). Ce qui est du chrome de l'app reste celui de l'app.

| # | Élément (c3a) | Port |
|---|---|---|
| 1 | En-tête app (logo, L'Affinée, loupe, ⋮) et barre du bas Bord/Finances/Brassins/Stocks/Clients + bouton + | **chrome de l'app** : non porté (la feuille le recouvre comme aujourd'hui) |
| 2 | Fil « Brassins › Pale Ale de septembre » + pastille mono « 27 L nets » (fond panneau, rayon 10) | titre de feuille = nom de la recette ; sous-titre « Budget du prochain brassin » / « Pour reproduire ce brassin » (textes d'aujourd'hui) ; la pastille « 27 L nets » est reprise, **devient un bouton** (ouvre la feuille Volumes, baseline c1a) |
| 3 | Titres de colonnes « QUAND TU PAIES » / « POUR QUOI » (12 px, majuscules, interlettre .06) | repris |
| 4 | Flux Sankey : 3 sources (Déjà payé vert, À payer noir, Coût de l'année violet) en boutons, point de couleur + nom 13 px 600 + montant mono 17 px ; barres 10 px ; ruban teinté 30 % ; 1,62 px/CHF, minimum 12 px (nœuds minces touchables) | repris : SVG `viewBox 390×420`, `preserveAspectRatio="none"`, mêmes constantes ; montants = `dejaPaye`, `aPayer`, `annee` |
| 5 | 8 destinations : Malt, Énergie, Nettoyage, Emballage 33 cl, Impôt bière, « Houblon, levure », Usure matériel, Charges fixes ; couleur par catégorie, montant mono à droite | repris. Cas neuf rangé dans le même nœud : « Autres ingrédients » (eau, sels, adjuvants) **seulement s'il existe** ; jamais un composant neuf |
| 6 | Nœud « Houblon, levure » hachuré, « ? » ambre, lien pointillé depuis À payer | repris : « ? » quand houblon ou levure sont absents de la recette ou sans prix ; sinon le nœud porte son montant, plein |
| 7 | Pointillé souligné = « exemple » (Énergie, Nettoyage, Emballage, Impôt, Usure) + légende « 0,00 pointillé : exemple » | **le style est repris**, le mot change : « exemple » désignait un chiffre de maquette. Dans l'app, pointillé = **estimé** (montant saisi à la main, sans facture ni calcul) ; l'impôt calculé d'une OG mesurée est plein ; l'impôt d'une OG cible est pointillé. Légende « pointillé : estimé » |
| 8 | Bloc noir « 202,77 ÷ 27 L = 7,51 CHF/L · 33 cl comprise · estimé » (32 px) | repris. 7,51 = `coutLitre(...).affiche.complet`, 202,77 = `totalCost`. « 33 cl comprise » seulement si l'emballage du brassin est un 33 cl connu (sinon « emballage compris ») ; « estimé » si complet, « partiel » sinon |
| 9 | « Ton litre, quand tu le paies » : barre 22 px à 3 segments (payé / à payer / année) proportionnels, légende mono « payé 0,83 · à payer 2,38 · année 4,30 » | repris. Les 3 parts sont arrondies au centime par plus grand reste pour sommer au 7,51 affiché |
| 10 | Bouton « Expliquer » (bleu clair, étincelle) | repris ; ouvre `BrewerChat` avec une question **préparée, non envoyée** (comme `FinanceAssistant.tsx:21`) ; Gemini jamais appelé |
| 11 | Bouton primaire « Prévoir 64,26 CHF » (noir, calendrier, mono) | repris (B2 a) ; l'ancien « Prévoir cette dépense » disparaît |
| 12 | **État 2 : « À payer » touché** : flux autres sources à 12 %, libellés à 35 %, bloc jaune `#F2C14E` « À payer avant le brassage = 64,26 CHF TTC », barre du litre estompée à 25 % | repris. B1 (b) : le bloc garde « À payer … 64,26 CHF TTC » et dessous deux lignes, **« avant le brassage 33,42 »** (malt à acheter, énergie, nettoyage) et **« plus tard 30,84 »** (emballage 24,00, impôt 6,84 après le conditionnement) ; « dont X restent en stock » si `resteEnStock > 0` |
| 13 | Toucher « Déjà payé » ou « Coût de l'année » | le même estompage (la maquette ne dessine que À payer ; le code de la maquette le fait pour les trois) ; le bloc jaune n'existe que pour À payer, le bloc noir reste sinon |

**Baseline de c3a à garder, au toucher d'un nœud** (« feuille c1a ») : chaque nœud destination ouvre sa feuille, qui reprend sans le perdre le contenu actuel de `BrewBudgetSheet` :
- pastille « 27 L nets » → **Volumes** : volume à brasser, volume net (− 27 L +, c1a), date du scénario (`DateField` et ses 3 raccourcis, `brewBudgetDateKey`) ; avertissements de volume ; reprise des 30 L de la recette ;
- **Malt**, **Houblon, levure**, **Autres** → lignes d'ingrédients (`<details>` actuels : article de stock, déjà compris dans une facture récurrente, prix, quantité, unité, lot minimum, TVA et origine) ; filtres « Tous / À acheter / À compléter » gardés ;
- **Énergie, Nettoyage, Emballage** → le poste (case, montant, « déjà prévu dans les charges récurrentes », TVA si assujetti) ; **Impôt bière** → calcul affiché (« 12,4 °P · 27 L · 25,32 CHF/hl »), réduction « à confirmer », champ manuel **seulement sans OG** ; **Charges fixes** et **Usure matériel** → production annuelle, montants, `settingsWarnings`, avertissements d'`usureAnnuelleLitre` ;
- pied de la feuille de nœud : « Retour » et **Enregistrer** (instantané « brouillon », comme aujourd'hui ; c3a n'a plus ce bouton en vue principale, la baseline c1a le garde).
La feuille de nœud est **une vue de la même Sheet** (retour au flux), pas une seconde Sheet vaul (focus, clavier mobile, un seul pied). Classes préfixées `cbf-`, CSS dans `cout-brassin.css`. `brew-budget.css` (hors Possède) reste lu, non modifié : la feuille de nœud réemploie ses classes `brew-budget-*`.

**Cas neufs rangés dans un état de la maquette** (la maquette ne les dessine pas) :
- *Estimation partielle* (prix manquant) : nœud « ? » hachuré sur la ligne concernée, litre « — » (jamais 0), `Prévoir` grisé, une ligne `role="status"` « Il manque le prix du malt » ; **Enregistrer** passe en bouton secondaire à côté de Prévoir (le test existant exige de pouvoir enregistrer une estimation incomplète).
- *Reproduction d'un brassin déjà produit* : pas de Prévoir ; l'action primaire devient Enregistrer ; une ligne de 13 px reprend l'avertissement d'aujourd'hui (« stock et prix actuels, coût historique inchangé »).
- *Budget déjà existant pour la recette* : la section `renderPlanReconciliation` s'affiche entre la barre du litre et les actions (liste « Budget à rattacher »), Prévoir grisé tant qu'il n'est pas choisi.
- *Estimation enregistrée* : une ligne « Enregistrée 64,26 CHF · écart +0,00 » (c1a) sous la barre du litre, si une estimation existe.
- *Litres nets inconnus* : pastille « ? L nets » hachurée, litre « — », « Litres nets à confirmer » en ambre.
- *Assujetti à la TVA* : « HT » à côté du libellé À payer (le coût est HT, la poche TTC).

**Hors maquette, retiré du premier plan** (le port ne retire que ce qu'elle n'a pas) : les 12 phrases d'aide, « Comprendre ces montants » (remplacé par Expliquer, IA au toucher), les deux grands champs de volume, la liste d'ingrédients et le bloc « Le coût de revient » (devenus feuilles de nœud). Rien n'est supprimé du code métier.

Mots au premier écran : la maquette en compte 84 (≈ 52 hors chiffres, alerte B3). Le port n'en ajoute que dans les états neufs ci-dessus ; mesure au contrôle (`mots-premier-ecran`) à l'étape 2.

## 3. Changements, fichier par fichier
1. **`src/ui/finance/CoutBrassinFlux.tsx` (neuf)** : composant de présentation + fonctions pures exportées :
   - `fluxDuBrassin(snapshot, groupes)` → `{ sources, destinations, flux }` : ingrédients répartis par `stockCost` (déjà payé) et `purchaseCost` (à payer) de d1 ; frais → À payer ; `fixedAllocation` et `depreciationAllocation` → année ; somme = `totalCost`, testée.
   - `groupeIngredient(ligne, recette)` : Malt (fermentescibles), Houblon, Levure, Autres (adjuvants, eau, sels), par nom de la recette (la ligne n'a pas de genre).
   - `litreTroisTemps(notions, litres)` : parts du litre au plus grand reste (somme = litre affiché).
   - `QuandPaye(snapshot)` : `avantBrassage` = achats d'ingrédients + énergie + nettoyage ; `plusTard` = emballage + impôt (dates d2 : emballage au conditionnement − 7 j, impôt après).
   - Props : `snapshot`, `notions`, `litre`, `sourceLitres`, `selection`, `onSelect`, `onNoeud(id)`, `onVolumes`, `assujetti`, `partiel`.
2. **`src/ui/finance/BrewBudgetSheet.tsx`** : garde tout l'état et le calcul du brouillon (volume, prix, liaisons, frais, `save`, `canPlan`, garde de double envoi) ; la section rendue devient `<CoutBrassinFlux>` + vues de nœud (§ 2). Changements de calcul :
   - volume net : `litresNets({ conditionneL: batch?.volumePackagedL, netEnregistreL: savedEstimate?.netVolumeL, netAttenduL: null })` ; aucun défaut sur `recipe.volumeL`. Sans source : champ vide, `netVolumeL` non passé à `estimateBrewBudget` (source `volume-a-brasser`, d1 : coût du litre refusé) ; le recalcul proportionnel du net quand on change le volume à brasser est gardé seulement quand le net est saisi ;
   - passe `og` (`batch.og` mesurée, sinon `recipe.ogTarget`, marquée « OG cible » donc pointillée), `abv`, `beerTaxReductionPct` à `estimateBrewBudget` (props neuves, facultatives) ;
   - `troisNotions(estimate)` + `coutLitre(...)` alimentent le flux ; `costPerL` n'est plus lu pour l'affichage ;
   - titre = recette, sous-titre = les deux textes d'aujourd'hui ; pas de nouveaux `type="number"` (`NumberInput`/`Input` existants, `inputmode` décimal) ;
   - bouton primaire `Prévoir {chf(cashRequiredTTC)} CHF` appelle `save(true)` (la garde `saving` empêche le double clic) ; `onSave(snapshot, true)` inchangé.
3. **`src/ui/finance/BrewBudgetDialog.tsx`** : remplace `budgetDepreciation` (AFC) par `usureAnnuelleLitre({ plans, assets, transactions, moisReference })` (`amountCHF` inconnu si `complet` faux ; avertissements affichés dans la feuille Usure) ; passe `og`, `abv`, `beerTaxReductionPct` (même règle que `estimateSwissBeerTax` : réduction seulement si `beerTaxReductionYear` = année du brassin, sinon taux plein) ; après `Prévoir`, `StorageService.setUiState('finances_workspace','forecast')` et appel d'une prop **facultative** `onOpenForecast?(planId)`. Sans prop, aucun lien affiché (voir DÉCISION 2).
4. **`src/ui/finance/cout-brassin.css` (neuf)** : tout le style c3a sous `.cbf-` (couleurs de catégorie en variables `--cbf-malt`… reprises des hex de la maquette ; en thème cave, mêmes teintes de catégorie, fond/texte/bords par les jetons de l'app ; mono = IBM Plex Mono de DESIGN.md § 406). Cibles : nœuds ≥ 12 px de haut mais bouton de 44 px (comme la maquette : `min-height:44px`).
5. **Tests** : voir § 4.

## 4. Tests qui échouent d'abord (fixtures, Gemini simulé, aucun appel réel)
Fixture commune : `snapshot` de `tests/unit/chaineLitre.test.ts` (27 L nets, OG 1,048, 22,41 + 64,26 + 116,10 = 202,77 ; litre 7,51). Rouges sur HEAD : l'écran actuel ne rend rien de tout cela.
`tests/integration/brewBudgetSheet.test.tsx` (blocs ajoutés ; **les tests existants qui cliquent « Prévoir cette dépense » ou lisent « Prix de Pils » sont adaptés** : nouveau nom du bouton, un clic sur le nœud d'abord, aucune règle de calcul changée) :
1. Repos : trois sources 22,41 / 64,26 / 116,10, destinations (Malt 44,83 … Charges fixes 108,00), bloc « 202,77 ÷ 27 L = 7,51 CHF/L », barre 0,83 · 2,38 · 4,30, boutons « Expliquer » et « Prévoir 64,26 CHF ».
2. Somme des flux = `totalCost` ; somme des 3 parts affichées = litre affiché (cas à ±0,01 : parts 1,005 / 2,495 / 4,010).
3. « À payer » touché (`aria-pressed`) : bloc « avant le brassage 33,42 », « plus tard 30,84 », total 64,26 ; les autres sources et nœuds portent `data-pale`.
4. Prix du malt absent : « ? » à la place du montant, litre « — », jamais « 0,00 » ; Prévoir désactivé, Enregistrer actif (`save(false)`).
5. Recette sans houblon ni levure : nœud « ? » hachuré, le litre 7,51 reste, mention « sans houblon ni levure » ; ce n'est pas un prix manquant.
6. Net : sans conditionné ni enregistré → « ? L nets », litre « — » (jamais le volume à brasser) ; `volumePackagedL` 26,6 gagne sur l'enregistré 27 ; pastille → feuille Volumes, 27 → 24 recalcule charges fixes (4,00/L) et litre.
7. Impôt : OG connue → ligne calculée, champ manuel absent ; sans OG → champ manuel et « Densité à noter » ; OG cible → nœud pointillé.
8. Nœud Malt → feuille d'ingrédient : prix « 2,50 » (virgule) → `cashRequiredTTC` 7,5, `onSave` avec `true` (test existant, adapté).
9. Double clic sur Prévoir : `onSave` appelé une fois. Erreur d'enregistrement : brouillon gardé, `role="alert"` (test existant).
10. Reproduction (stock déjà consommé) : pas de bouton Prévoir, Enregistrer primaire.
11. Estimation enregistrée : « 9,00 CHF » et écart (test existant gardé).
12. Aucun `input[type=number]` dans la feuille, flux et feuilles de nœud ouverts.
13. Expliquer : `BrewerChat` (mocké) reçoit `initialQuestion` ; aucun envoi.
`tests/integration/brewBudgetDialog.test.tsx` :
14. Usure : actif « Cuve » 1 000 CHF catégorie `tanks` (linéaire 10 %) → 100 CHF/an (et non 200 puis 160 puis 128 du dégressif) ; « reprendre le registre » rendu à 100 ; test « jamais 0 pour un actif non classé » : avertissement d'`usureAnnuelleLitre` (« Usure à renseigner … ») à la place de « valeur de reprise et méthode à confirmer » (le texte vient de l'AFC, plus lu ici).
15. Un matériel facturé **et** au registre : usure comptée une fois (réemploi de la fixture de `materielFutur.test.ts`).
16. Réduction petit brasseur : appliquée seulement si `beerTaxReductionYear` = année du brassin ; sinon taux plein.
17. Prévoir : `savePlan` actif, `finances_workspace` = `forecast`, `onOpenForecast` appelée une fois avec l'id du plan.
18. Rattachement : les deux tests existants rejoués avec le nouveau nom du bouton.
Rouge d'abord : `npx vitest run <ces 2 fichiers> --reporter=dot > voies/uc/tests-rouge.txt`.

## 5. Appelants hors Possède (grep sur `src/`, `tests/`, `scripts/`, rejoués sur HEAD)
- `BrewBudgetSheet` : importé par `BrewBudgetDialog.tsx` seulement (+ son test). Pas de changement de props pour les appelants (nouvelles props facultatives).
- `BrewBudgetDialog` : `FinancesTab.tsx:18,246` (`setBudget({batch,recipe})`), `BrewBudgetButton` : `BatchDetailSheet.tsx:22,249`, `RecipePage.tsx:72,363`, `BrewWizard.tsx:7,3512`. Props `{recipe,batch,onClose}` inchangées.
- Tests qui moquent le bouton (`vi.mock('…/BrewBudgetDialog')`) : `batchAbvOgConfirmee`, `batchAm4Am5`, `batchDefautsB`, `batchNombresFr`, `batchPackagingVolume`, `batchStockFollowUp` (texte « Estimer le budget de ce brassin », gardé). Textes de `FinancesTab` (« Budget d'un brassin » `mobileDailyViews.test.tsx:120`, « Coût des brassins ») : l'écran Finances n'est pas touché.
- `scripts/agents/inventaire-ecrans.mjs:267-268` : liste `BrewBudgetSheet.tsx` et `brew-budget.css` dans `fichiers` ; devrait ajouter `CoutBrassinFlux.tsx` et `cout-brassin.css` (script hors Possède, **inventaire seulement**, pas un contrôle).
- Pas d'autre lecteur de `brew-budget` ni du texte « Prévoir cette dépense » dans `src/`, `scripts/`, `tests/` (grep). `docs/research/yeast-recipe-evidence/information-browser-checks.json` cite « Estimer le budget » : document daté, non touché.
- **Rejeu sur HEAD** (`voies/uc/tests-head.txt`) : 17 fichiers (les 2 de la voie, 6 `batch*`, `mobileDailyViews`, `financeWorkspace`, `financeArchives`, `equipmentProjects`, `financeAnnuelSaisie`, `dashboardNavigation`, `fix114`, `tests/unit/financeArchiveContinuity.test.ts`, `tests/ux-mobile/financePeriodDrilldown.test.tsx`) : **`Test Files 16 passed (16) | Tests 158 passed (158)`** (le 17e fichier n'est pas collecté par la config vitest). À rejouer après le code : seuls les tests 1 à 18 de la voie doivent changer.
- Domaine : `estimateBrewBudget`, `troisNotions`, `coutLitre`, `usureAnnuelleLitre`, `beerTaxForVolume` sont appelés, jamais modifiés. Non rejoué ici, déjà noté par d1 et d3 : `financeAssistantContext.test.ts` (firebase-admin absent du poste).

## 6. Risques
- **Données existantes** : les instantanés enregistrés n'ont ni `dejaPaye` ni `netVolumeSource` (d1 : champs facultatifs). `troisNotions` rend alors `null` pour ces anciens instantanés. L'écran n'en lit jamais un : la feuille est toujours un brouillon recalculé depuis la recette, le stock, les prix et les entrées enregistrées (`savedEstimate.prices`, `bindings`, `settings`), donc les trois notions existent toujours à l'écran, et un ancien instantané n'est réécrit que par « Enregistrer » ou « Prévoir ». La liste Finances › Coûts relit `costPerL` des anciens instantanés : inchangé.
- **Hors ligne** : aucun appel réseau nouveau ; « Expliquer » prépare la question et n'envoie rien ; les données viennent de `useStorageValue`.
- **Double clic** : garde `saving` conservée ; test 9.
- **Arrondis** : tout se somme en centimes (d1) ; `litreTroisTemps` au plus grand reste ; jamais de re-division d'un litre arrondi (`coutFormat` prend le liquide exact).
- **Prix du litre dans le temps** : le net « conditionné » de d1 n'existe que pour un brassin fini ; pour un planifié, le net vient de l'estimation enregistrée ou de la saisie. Pas de net « attendu » dans le code (le `deadSpaceL` de la cuverie n'est pas une perte de brassage) : je n'en invente pas.
- **Fiabilité de « avant le brassage / plus tard »** : le découpage suit `PLAN-METIER § 1` (emballage au conditionnement, impôt après), plus fin que la lettre de B1 (« impôt après le conditionnement ») ; voir DÉCISION 3.
- **Assujetti** : `aPayer` est HT, la poche TTC ; le bloc jaune montre la poche, la source À payer le coût (« HT » ajouté). Cas du prix HT à passer à `mesurerAchat` (d3) : hors de cet écran.
- **Mobile** : 12 px de nœud, libellés de destination alignés à 19 px d'écart (algorithme de la maquette) ; à vérifier sur capture si un frais manque (poste désactivé : nœud absent, pas à 0).
- **Thème cave** : la maquette n'existe qu'en clair. Teintes de catégorie reprises à l'identique, fond et texte par les jetons ; contraste mesuré sur capture (`controle-teinte.mjs`).
- Hors ligne / `?dev-local&finance-demo` : le brassin de démo a une OG cible de 1,050 (12,4 °P, tranche 25,32) → 6,84 CHF pour 27 L, identique au montant manuel de la maquette : 64,26 reste.

## 7. Hors périmètre
`FinancesTab.tsx` (liste Coûts, section Prévisions, `onOpenForecast` à brancher), `App.tsx` (navigation), `forecast.ts` et `brewForecast.ts` (d2), l'écran Prévisions (choix ouvert), `brewBudget.ts` / `chaineLitre.ts` / `swissBeerTax.ts` (d1), `materielFutur.ts` (d3), `brew-budget.css`, `inventaire-ecrans.mjs`, `financeDemo.ts`, la caisse (v3a), l'impôt p2b (voie up), le coût d'un format et le prix (c3d, c4 : choix ouverts, rien n'en vient ici), la 3e copie du °Plato.

## 8. Décisions à prendre avant le code
1. **Per-poste dans le domaine** : le snapshot n'expose que `packagingCost` et `beerTaxCost` ; énergie et nettoyage ne sont lisibles qu'en refaisant la formule HT/TTC de `brewBudget.ts:410-435`. « Avant le brassage 33,42 » exige aussi la poche par poste. Recommandé : **ajouter à `brewBudget.ts` un champ facultatif `fraisParPoste: Partial<Record<BrewCostKey, { cout: number | null; cash: number }>>`** (additif, aucun instantané touché) et son test dans `tests/unit/brewBudget.test.ts` — ces deux fichiers n'étant pas dans le Possède de uc, **les y ajouter**. Sinon, repli : refaire la formule dans le composant (3 lignes dupliquées, test d'égalité avec `operatingCost`), non recommandé.
2. **Navigation « ouvre la ligne dans Prévisions »** (B2 a) : `FinancesTab.tsx` et `App.tsx` sont hors Possède ; le port écrit `finances_workspace='forecast'` et expose `onOpenForecast`. Recommandé : l'étape de branchement (une ligne dans `App.tsx` + `FinancesTab`) revient au pilote ou à d2 ; d'ici là, pas de lien « Voir dans Prévisions » (aucun bouton qui ne fait rien).
3. **Découpage du bloc jaune** : « avant le brassage » (ingrédients à acheter, énergie, nettoyage = 33,42) et « plus tard » (emballage 24,00 + impôt 6,84 = 30,84) selon PLAN-METIER § 1 et les dates de d2 ; B1 ne nomme que l'impôt comme « plus tard ». Recommandé : le découpage à 33,42 / 30,84, parce que l'emballage se paie au conditionnement. Si B1 doit s'entendre à la lettre : 57,42 / 6,84.
4. **Net inconnu** : un brassin planifié sans net enregistré affiche « — » au lieu d'un faux 7,21. Si le brasseur préfère un net par défaut, il faut une source (perte de la cuverie, pertes mesurées) : à décider, pas à inventer ici. d1 suggérait de poser l'issue « litres nets estimés » côté domaine et d'éditer `financeArchiveContinuity.test.ts` ; non retenu : l'écran lit `netVolumeSource` directement, aucun changement de `complete`.
5. **Mot « exemple » → « estimé »** pour les pointillés (§ 2, ligne 7) : écart voulu avec la maquette, qui parle de chiffres d'exemple ; je préviens le critique.
6. **Page ou feuille** : la maquette est un écran-page (fil d'Ariane, barre du bas). Le port reste une feuille (PLAN-METIER § 3.2, 4 ouvertures). Si le brasseur veut la page `Brassins › …` de c1c, c'est un autre chantier (route neuve).
7. **Possède** : ajouter `tests/unit/coutBrassinFlux.test.ts` (neuf) pour les fonctions pures du § 3.1 (somme des flux, plus grand reste, groupes d'ingrédients) ; sinon elles seront testées dans `brewBudgetSheet.test.tsx` seul.
   Réponses du pilote (`DECISIONS-PHASE2.md`) : 1 à 7 acceptées telles que recommandées.

## 9. Constats des revues P2 (étape 2) : retenu ou écarté
| Constat | Sort | Raison / ce qui est fait |
|---|---|---|
| REVUE-B UC-1 (bloquant), REVUE-A UC-1 : le net 30 L revient à la réouverture | **retenu, corrigé** | `netVolumeSaisi(snapshot)` dans `brewBudget.ts` : le net n'est lu que si `netVolumeSource === 'saisi'` ; un instantané ancien ou sans net saisi rouvre à « ? L nets » / « — ». Helper unique, exporté pour p2b et la prévision. Tests : `brewBudget.test.ts` (helper), `brewBudgetSheet.test.tsx` (« rouvre à — », « enregistrer sans net, rouvrir », instantané d'avant d1) |
| REVUE-B UC-2 : état des boutons quand le net est inconnu | **retenu** | net vide = inconnu : Enregistrer permis (instantané `volume-a-brasser`, jamais relu comme net), Prévoir grisé ; net ≤ 0 saisi : les deux grisés. Tests dédiés |
| REVUE-B UC-3 : impôt sur 30 L sans net | **retenu** | sans net saisi, `og` n'est pas passé : l'impôt est « ? », jamais calculé sur le volume à brasser. Test « sans net, l'impôt n'est pas calculé » |
| REVUE-B UC-4 : importateurs à rejouer | **retenu** | 23 fichiers rejoués : les 17 de HEAD + `chaineLitre`, `brewStockConsumption`, `contreCalculUnites`, `materielFutur`, `swissBeerTax`, `brewBudget`, `coutBrassinFlux` : `Test Files 23 passed (23)`, `Tests 354 passed (354)` |
| REVUE-B UC-5 : `fraisParPoste` dans les instantanés | **retenu** | valeurs `null` (jamais `undefined`) ; aucun `toEqual` d'instantané existant cassé (les 23 fichiers verts) ; champ additif facultatif |
| REVUE-B UC-6 / D2-8 / D2-9 : id donné à `onOpenForecast`, date du brassage | **retenu en partie** | `onOpenForecast({ planId, batchId })` : `batchId` fait foi pour la ligne dérivée de d2 ; le plan écrit garde l'id `BUDGET-…`. La date du scénario reste celle de la feuille (modifiable, visible dans Volumes) ; la règle « la date du brassin fait foi » est à écrire côté d2 au branchement |
| REVUE-B UC-7 / REVUE-A : règle de la réduction copiée trois fois | **retenu** | `reductionImpotPourAnnee(fiscal, date)` dans `brewBudget.ts` (0 à 40 %, année du brassin, date suisse ou ISO) + test de parité avec `estimateSwissBeerTax`. À reprendre par up et d2 |
| REVUE-B UC-8 : signature de la prop d'usure | **retenu** | `depreciationForBudgetYear(année)` devient `usureForBudgetDate(AAAA-MM-JJ)` (mois de référence de `usureAnnuelleLitre`) |
| REVUE-B UC-9 | **vérifié** | liste des tests à adapter complète ; adaptés |
| REVUE-A UC-2 : « 33 cl » sans source | **retenu** | aucun champ du format ; le nœud s'appelle « Emballage », le bloc dit « emballage compris · estimé » (jamais « 33 cl »). Écart avec la maquette, à valider par le critique |
| REVUE-A UC-3 : registre vide = usure 0 « complète » | **retenu** | sans actif ni projet : usure inconnue (« ? »), avertissement « Aucun matériel au registre : usure à renseigner. », Prévoir grisé. Test |
| REVUE-A UC-4 : « ? » et Prévoir grisé | **retenu** | deux cas : houblon et levure absents de la recette → « ? » hors recette, litre 7,51, Prévoir actif (la maquette) ; houblon présent sans prix → « ? » à compléter, litre « — », Prévoir grisé. Tests des deux |
| REVUE-A UC-5 : Prévoir sans effet visible | **accepté** | décision n° 2 du pilote : état de navigation écrit, `onOpenForecast` exposé, branchement avec l'écran Prévisions |
| REVUE-A UC-6 : nœud Impôt face à la feuille de up | **accepté, à coordonner** | le nœud montre le calcul et dit « OG visée (estimé) » ; le lien vers `ImpotBiereSheet` viendra quand up est branché ; les deux lisent le même `beerTaxForVolume` et le même net |
| REVUE-A UC-7 : égalité du plus grand reste | **retenu** | départage par l'ordre payé, à payer, année ; test 1,005 / 2,495 / 4,010 et son miroir |
| REVUE-A UC-8 : « avant le brassage » et assujetti | **retenu en partie** | libellé gardé (décision n° 3) ; test assujetti : 2 temps = `cashRequiredTTC` (`brewBudget.test.ts`) ; le nœud À payer dit « (HT) » |
| REVUE-A UC-9 : contraste cave | **vérifié sur capture** | teintes éclaircies en cave (impôt, année, stock, usure) ; Malt garde la teinte de la maquette, pas l'échelle EBC |
