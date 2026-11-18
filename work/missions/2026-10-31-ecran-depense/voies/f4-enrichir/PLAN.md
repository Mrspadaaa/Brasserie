# PLAN corrigé — voie f4-enrichir (D276) : après « Confirmer », la fiche de chaque nouvel article se remplit en arrière-plan, une seule fiche par produit

Temps 1, auteur Opus, 01.11. **Version corrigée** après `REVUE-PLAN.md` (2 bloquants, 19 majeurs, 9 détails) et les décisions du pilote P1 à
P6, qui priment. Aucune ligne de code écrite. Sondes (dans `sondes/`, sans réseau ni Gemini) : `sonde-levures.ts`, `sonde-levures-noms.ts`,
`base-tests.log`, `savepurchase.txt`. La table « où chaque correction se trouve » est au § 11.

**Portée (L01)** : les articles de stock **créés par une dépense confirmée** (`stockAction === 'new'`, ref `MP-<saisie>-<ligne>`), après
l'enregistrement, feuille fermée. Rien d'autre : ni article existant, ni dépense, ni écran. « Enrichir » veut dire lier l'article à sa fiche
et combler ses trous, sans jamais réécrire une valeur. Une valeur trouvée en ligne n'est **jamais** une donnée lue (P1).

Ses mots tenus : « à la fin quand on valide la facture, en arrière plan » ; « Attention au mapping, on veut pas de retrouver avec plein de
fiche du même produit » ; « vue fermé et tout, ça créé une procédure » ; D277 (sûr : rien ; repris : jaune ; inconnu : rouge) ; « L'EBC d'un
malt ne changera jamais » ; on ne comble que les trous (`src/App.tsx:570-581`, `src/services/storage.ts:724-764`).

## 1. Défauts visés (6)

| id | défaut | preuve |
|---|---|---|
| E1 | Aucune procédure après « Confirmer » : un article neuf garde ses trous (malt sans EBC ni potentiel, levure sans laboratoire, forme ni températures). D215 règle (4) non faite (D276). | `src/services/purchaseEntry.ts:502-530` (`savePurchaseWithProofReceipt`) : rien après `savePurchase` ; `lookupIngredient` n'est appelé que sur un geste (`src/ui/AiAssist.tsx:110`, `src/ui/RecipeAutoComplete.tsx:323`, `:782`). |
| E2 | Les levures ne sont jamais rapprochées du catalogue du dépôt (s6 T11), et le rapprochement exact des recettes ne reconnaît pas un libellé de facture : **1 levure sur 4** de la facture 372765, alors que les 4 sont au catalogue. | `sondes/sonde-levures.ts` (`resolveFermentationYeast`, `findRecipeYeastMatches`, 1 734 références) : seul « Safale US-05 11,5g » → `fermentis-us05` ; Windsor, BE-256 (Abbaye), Verdant IPA : 0 candidat. `sonde-levures-noms.ts` : `lalbrew-windsor`, `yeast-fermentis-safale-be-e2-80-91256` (`productCode` `BE-256`), `lalbrew-verdant-ipa` (`productCode` nul), `wyeast-3711`. `src/domain/stock/fiche.ts:61` : `if (contexte === 'Levure') return undefined`. |
| E3 | Un houblon neuf enregistré sans le catalogue plein reste sans fiche, à jamais. | `src/services/purchaseEntry.ts:377-381` (`cataloguesPour` : `catch { return undefined }`), `src/domain/stock/articleNeuf.ts:47-53`. |
| E4 | Rien n'empêche deux fiches du même produit. Aucune clé de produit. `learnIngredient` cherche l'article par **nom exact** et, s'il ne le trouve pas, crée un article `FICHE-<catégorie:nom>` à 0 : un article f4 « Weyermann Carahell » plus une recette qui retient « Carahell » font deux fiches. Deux recherches du même produit, deux appels payés. | `src/services/storage.ts:725-735` (nom exact), `:756-763` (`FICHE-…`) ; `ingredientKey` (`src/domain/ingredientFacts.ts:163`). |
| E5 | Un champ comblé n'a ni niveau (D277) ni source par champ. `technicalSource` est une seule chaîne pour tout l'article : une valeur trouvée ne se distingue ni d'une valeur lue ni d'une valeur tapée, ni pour lui, ni pour le rapprochement des lignes, ni pour les recettes (`factsFromStock` range tout sous `origin: 'personal'`). | `src/types/index.ts:81` ; `src/domain/ingredientFacts.ts:607-632`, `:634-640`. |
| E6 | Aucun interrupteur ni plafond pour une recherche **automatique** (aujourd'hui seulement sur geste, coût vu par lui). | `src/services/aiClient.ts:98-130` ; budget mensuel du serveur seulement (`functions/src/geminiCosts.ts`, `monthlyLimit`). |

Gardes (verts aujourd'hui, doivent le rester) : G1 un article existant n'est jamais lu pour écrire ni modifié (s6 R16) ; G2 une valeur lue ou
tapée n'est jamais écrasée ; G3 aucun appel Gemini dans `npm test` ; G4 une dépense déjà enregistrée reste intacte ; G5 **le rapprochement
des lignes rend le même verdict sur un article enrichi que sur le même article avant f4** (P1).

## 2. Une valeur trouvée n'est jamais une donnée lue (P1, P2) : les lecteurs

### 2.1 La règle
- Toute valeur qu'f4 écrit est inscrite dans `fiche.remplis[champ]` avec **la valeur écrite** (`valeur`). Tant que `item[champ] === remplis[champ].valeur`,
  la valeur est « remplie par f4 » ; s'il la change (fiche du stock, `src/ui/StockDetailSheet.tsx:144-148`), elle redevient **la sienne**
  (lue / tapée), sans qu'f4 ait à le savoir.
- Fonctions pures (f4, `src/domain/stock/ficheValeurs.ts`) :
  - `valeurLueDe(item, champ)` : `item[champ]`, sauf si `remplis[champ]` existe et que `item[champ] === remplis[champ].valeur` → `undefined`.
  - `ficheDeS6(item)` : `item.fiche !== undefined && item.fiche.par === undefined` (le lien posé par s6 à la création n'a pas de `par` ; tout
    lien posé par f4 en a un).
  - `porteDonneeLue(item)` : `valeurLueDe(item,'alphaPct') !== undefined || item.origin !== undefined || valeurLueDe(item,'colorEbc') !== undefined || ficheDeS6(item)`.

### 2.2 Chaque lecteur des champs que f4 écrit (`grep` de `colorEbc`, `potentialPpg`, `yeast*`, `technicalSource`, `fiche` dans `src/`)
| lecteur | ce qu'il lit | ce qu'il fait d'une valeur remplie par f4 | qui change |
|---|---|---|---|
| `src/services/stockLineMatching.ts:399` `donneesDArticle` | `alphaPct`, `origin`, `colorEbc` → `ecartsEntre`, `connuesUnSeulCote` (`src/domain/stock/donnees.ts:101-120`), donc `regleProduit` (`:461-472`) | **ignorée** : `alpha: positif(valeurLueDe(item,'alphaPct'))`, `ebc: positif(valeurLueDe(item,'colorEbc'))` | pilote (P1, P5 : ligne exacte § 6) |
| `src/services/stockLineMatching.ts:180` `porteDonneeS6` | `alphaPct`, `origin`, `colorEbc`, `fiche` | **ignorée**, et un lien posé par f4 (levure comprise) ne le rend pas vrai : `porteDonneeS6 = porteDonneeLue` | pilote (P1) |
| `src/domain/stock/donnees.ts:101-120` | reçoit les données déjà filtrées | rien à changer | — |
| `src/domain/ingredientFacts.ts:634` `factsFromStock` (et `factsForRecipeStockItem`, `:659`, qui l'appelle) | tous les champs, `origin: 'personal'` | **sert dans la recette**, mais sous `origin: 'ai'` si un champ rendu est rempli en ligne ou retenu et pas vu (`remplis[champ].le > vu` ou pas de `vu`) ; `'manufacturer'` s'il ne reste que des champs du catalogue ; `'personal'` sinon (lui, ou vu) | f4 (P2 : cette fonction seule, un test) |
| `src/ui/BrewIngredients.tsx:355-362` | `colorEbc`, `potentialPpg` d'un malt du stock de même nom | sert (comble le trou de la recette), sans marque | aucun ; marque : voie d'interface |
| `src/ui/fermentescibles/EtapeFermentescibles.tsx:174-175`, `src/ui/fermentescibles/Ajout.tsx:236` | `colorEbc`, `potentialPpg` de l'article choisi | sert, sans marque | aucun ; voie d'interface |
| `src/pages/BrewWizard.tsx:1588-1594` | levure du stock : `yeastLab`, `yeastStrain`, `yeastForm`, `yeastAttenuationPct` (avec `attenuationBasis: 'declared'`), températures, `yeastTechnicalFacts`, `technicalSource` | sert. `declared` reste juste : f4 n'écrit `yeastAttenuationPct` que pour **un point publié** par le fabricant (catalogue ou fiche trouvée), jamais une moyenne | aucun ; signalé au pilote (§ 10, n° 6) |
| `src/services/storage.ts:736-751` `learnIngredient` | « manquant » champ par champ | une valeur f4 compte comme présente : il ne la remplace pas (trous seulement, voulu) | pilote branche `ficheRetenueDe` (§ 4.4) |
| `src/ui/finance/ExpenseSheet.tsx:89-91` `phraseFiche(item.fiche)` | `nomDeFiche(id)` | id `levure:<id>` : `nomDeFiche` le nomme si on lui passe les levures (`Catalogues.levures`), sinon « fiche liée » ; id `cle:<clé>` : « fiche liée » (jusqu'à la voie d'interface) | f4 (`fiche.ts`) |
| `src/ui/finance/ExpenseSheet.tsx:590-591` | `neuf.fiche` dérivé par s6 (`articleNeufDe`) | non concerné (pas l'article du stock) | — |
| `src/ui/StockDetailSheet.tsx:135-148` | affiche et édite `colorEbc`, `potentialPpg` ; enregistre l'article entier (`updateStockItem`) | affichée sans niveau ; s'il la retouche, elle devient la sienne (§ 2.1) ; `fiche` voyage dans l'article entier, rien n'est perdu | aucun ; niveau : voie d'interface |
| moteur, `beerColor`, `yeastProjection`, `brewCompanion`… | les champs de la **recette** (`Fermentable`, `YeastSpec`), pas l'article | la valeur n'y arrive que par les lecteurs ci-dessus | — |

Un houblon : f4 n'écrit **jamais** `alphaPct` ; `valeurLueDe(item,'alphaPct')` = `item.alphaPct` toujours.

## 3. Ce que le plan tranche

### 3.1 Quand
- **Planifié** juste après un `savePurchase` réussi (les deux branches de `savePurchaseWithProofReceipt`), dans une file locale durable
  (IndexedDB, modèle `src/services/proofQueue.ts`). `planifierEnrichissement(draft): void` **ne lève jamais** (tout dans un `try/catch`
  interne, écriture IndexedDB non attendue) : un lancer dans le `try` de `purchaseEntry.ts:510` effacerait la preuve en file.
- **Traité** seulement si toutes ces portes sont ouvertes :
  1. aucune feuille Dépense montée (`tenirEnrichissement()`, posé dans `ExpenseSheet`, donc aux trois endroits où elle est montée :
     `src/components/QuickActionModal.tsx:620`, `src/components/tabs/StocksTab.tsx:532`, `src/ui/finance/UpgradeWorkspace.tsx:73`) ;
  2. `StorageService.isReady()` et un utilisateur (`uid` du travail) ;
  3. la dépense `TX-<saisie>` : jugée comme `judgeExpense` (`src/services/proofQueue.ts:198-212`) : rejetée → `abandonne` ; absente → attend ;
  4. l'article `MP-…` : son écriture **lue du serveur**. Si `documentWriteState('stockItems', ref).status !== 'confirmed'` (dont `unknown`,
     qui est l'état après un rechargement, `src/services/firestoreRepo.ts:92`, `:271`), on attend `FirestoreRepo.waitForDocument('stockItems', ref, 15000)` ;
     échec par rejet → `abandonne` ; délai ou hors ligne → le travail reste `attend`, rien n'est compté. **`unknown` n'est jamais « prêt ».**
- Hors ligne, rechargement hors ligne compris : la porte 4 attend ; aucune écriture, aucune recherche ; repris au réveil `online`.
- Réveils (aucune minuterie, comme `startProofQueue`, `src/services/proofQueue.ts:368-385`) : démarrage, cache prêt, `online`, `focus`,
  `visibilitychange`, `pageshow`, et la libération de la feuille. Un seul travailleur (`navigator.locks` `laffinee-file-fiches`, sinon drapeau).
- **Rejeu** : une saisie refusée puis rejouée (`replayable`, `src/services/purchaseEntry.ts:505`) rappelle `planifier` ; un travail
  `abandonne` pour rejet de la même `ref` repasse `attend` (réarmé). Tout autre état existant est gardé tel quel (idempotent).

### 3.2 Pour qui, et ce que le travail capture
- Chaque article **créé par la dépense** : houblon, malt, sucre et flocons (fermentescibles), levure. **Autres** (sels, acides,
  clarifiants, emballage, entretien, matériel) : rien, **choix prudent et réversible** (aucun champ de `StockItem` ne les porte ; une voie
  suivante s'il le demande, § 10 n° 7). Sans fiche ou avec fiche s6, approchée ou non.
- **Article existant : jamais touché**, trous compris. Dépense d'avant f4 : aucun travail.
- Le travail **capture la ligne** à `planifier`, et tout le rapprochement se fait sur ces champs, jamais sur l'article relu (il peut l'avoir
  renommé) : `description`, `nomPropre` (`nomPropre(description, contexte, {unit, quantity})`, `src/domain/stock/donnees.ts:96`), `famille`
  (de `contexteDe(ligneDeBrouillon(line, draft.vendor))`, `src/services/stockLineMatching.ts:355`), `reference` (code article imprimé),
  `fournisseur` (`draft.vendor`), `unit`, `quantity`, `kind`, `stockCategory`, données lues `{ alpha, origine, ebc }`
  (`donneesDeLigne(...).donnees`), et le verdict s6 de la ligne (`articleNeufDe(...).regle` : `cas`, `voisin.ref`, `motif` « bis » ou
  « origine »). L'article relu ne sert qu'à savoir **quels champs sont vides** au moment d'écrire.

### 3.3 La clé de fiche, et la comparaison de deux produits (P3)
- `cle = famille|fabricant|mots` (pure, `src/domain/stock/ficheCle.ts`). **Ni EBC, ni α, ni origine** : ce sont des données de l'article
  (D215 les garde, elles font le « bis »), pas de la fiche. Un « bis » partage la fiche de son produit (COMMUN.md : « lié à la fiche du
  produit […] Une seule fiche par produit ») : aucune seconde recherche.
  - `famille` : `houblon`, `malt` (grains, sucres, flocons), `levure`.
  - `fabricant` : seulement un fabricant **écrit** dans le libellé (table `FABRICANTS` : Weyermann, Castle, Château, Bestmalz, Best, Simpsons,
    Crisp, Muntons, Dingemans, Swaen, Viking, Ireks, Candico ; levures : Lallemand, LalBrew, Fermentis, Safale, Saflager, Safbrew, Wyeast,
    White Labs, WLP, Omega, OYL, Imperial, Mangrove Jack's), ramené à un nom (« Safale » → `fermentis`, « LalBrew » → `lallemand`). Vide sinon.
  - `marque` (hors clé) : une marque déposée d'un seul fabricant (Weyermann : Carahell, Carapils, Caramünch, Carafa, Carared, Caraaroma,
    Sinamar ; Dingemans : Special B ; Castle : Château…), table `MARQUES`. Elle ne fait pas la clé ; elle dit qu'un nom **n'est pas générique**.
  - `mots` : `nomPropre` plié (NFKD, sans diacritiques, minuscules, ™ ® © retirés, tirets Unicode U+2010 à U+2015 et U+2212 → `-`), sans
    les mots du fabricant, jetons triés et uniques.
  - `generique` : aucun fabricant écrit **et** aucune marque, et le nom est un nom de la table des fermentescibles (`NOMS`, `src/domain/fermentables/noms.ts`)
    (« Pilsner Malz », « Münchner Malz », « Maris Otter »).
- `memeProduitDeFiche(a, b)` → `'meme' | 'proche' | 'autre'`, composante par composante :
  - `mots` différents (ni même ensemble, ni même nom collé : « Cara Munich » = « Caramunich ») → `autre` ;
  - fabricants connus des deux côtés et différents → `autre` ;
  - fabricants connus des deux côtés et égaux, ou inconnus des deux côtés → `meme` ;
  - inconnu d'un seul côté → `proche` (jaune, `aControler`).
- **Ce qui passe d'un article à l'autre** (fiches retenues, § 3.4 étape 2) :
  - `meme` et non générique → le lien et les **valeurs remplies** de la source (jamais ses valeurs lues) ;
  - `meme` et générique → le lien seulement ; des valeurs seulement si l'article est le « bis » ou la variante d'origine **de cette source**
    (verdict s6 capturé : `voisin.ref === source.ref`) ;
  - `proche` et non générique → le lien, `aControler: true`, valeurs en `repris` ;
  - `proche` et générique → le lien, `aControler: true`, **aucune valeur** ;
  - `autre` → rien.
- Tests de la clé (P3) : « Cascade US » puis « Cascade CH » → une fiche de variété, 0 appel ; « Münchner Malz » 20 EBC puis son « bis »
  15 EBC → une fiche, au plus un appel, l'EBC lu de chacun gardé, le potentiel du bis en `repris` ; « Carahell » contre « Weyermann Carahell »
  → `proche`, jaune, valeurs en `repris` ; « Pilsner Malz » contre « Pilsner Malz Castle » → `proche`, aucune valeur recopiée ; « Fermentis
  Windsor » contre `lalbrew-windsor` → `autre`.

### 3.4 Le rapprochement d'abord (« Attention au mapping »)
Ordre fixe ; l'IA n'est appelée que si les étapes 1 et 2 n'ont rien.

1. **Catalogue du dépôt** (gratuit, importé paresseusement, § 7) :
   - **Houblon** : la variété de l'index (`ficheLaPlusProche`, `chargerCataloguePlein`) si l'article n'a pas de fiche (E3). Rien n'est
     recopié (α, β, huiles, arômes, origine se lisent par l'`id`). L'α du lot ne vient jamais d'une fiche. Aucune recherche en ligne (§ 3.5).
   - **Levure** (E2) : `ficheLevureDe(libelle, references)` (§ 3.4 bis). `sur` → lien `levure:<id>`, valeurs du catalogue :
     `localYeastFacts({ name: ref.name, hopIndexId: ref.id } as YeastSpec, [])` (`src/domain/localIngredientFacts.ts:13` ; avec `hopIndexId`,
     `resolveFermentationYeast` trouve la référence par son id, `src/domain/fermentationScenario.ts:14` ; aucun `localDocumentary`, donc pas de
     refus `:16-17`), puis `factsForStock('levure', facts)` (`src/domain/ingredientFacts.ts:607`), trous seulement, `par: 'catalogue'`,
     niveau `sur`. Jamais `yeastLot`, jamais `yeastNotes`. `aControler` → même lien et mêmes valeurs, `aControler: true`, niveau `repris`.
     `ambigu` → aucun lien, aucun appel, ≤ 3 candidats gardés dans le travail, `aControler` (motif `ambigu`). `aucun` → étape 2.
   - **Malt, sucre** : la fiche de type (slug, `ficheLaPlusProche`) si l'article n'en a pas. Le dépôt n'a ni EBC ni potentiel par produit
     (`src/data/fermentables/fermentescibles.json` : nom, catégorie, type) → étape 2.
   - **Une fiche s6 déjà posée, approchée ou non** : `fiche.id` et `fiche.approchee` ne sont **jamais réécrits**. Si f4 trouve une fiche
     meilleure (une variété dédiée maintenant que le catalogue est chargé), il la met dans `fiche.propose` et pose `aControler: true` ; il ne
     l'applique jamais seul. `approchee` (s6 : le lien n'est pas exactement ce produit) et `aControler` (f4 : pas sûr) peuvent être vrais
     ensemble ; l'écran montre les deux.
2. **Fiches retenues** (hors IA) : par la clé, dans (a) les articles du stock dont `fiche.cle` est la même (ou `proche`, § 3.3), (b) le
   cache local `reponses` (par clé, § 5). Règles de passage : § 3.3. Aucun appel.
3. **Recherche en ligne** (§ 3.5), si permise.
4. **Le nom publié rendu par l'IA** (`facts.name`) repasse par 1 et 2 : s'il désigne une fiche du catalogue ou une fiche retenue `meme`,
   l'article y est lié (pas de nouvelle clé) ; les valeurs du catalogue priment, celles de l'IA ne comblent que ce qui reste.

### 3.4 bis Le rapprochement d'un libellé de levure (prêt n° 6)
- **Normalisation, la même des deux côtés** (`jetonsLevure(texte)`) : NFKD, sans diacritiques, minuscules ; ™ ® © et « · » → espace ;
  tirets U+2010 à U+2015 et U+2212 → `-` ; parenthèses retirées (le contenu reste un jeton : « (Abbaye) » → `abbaye`) ; poids d'emballage
  retirés (`\d+([.,]\d+)?\s*(g|gr|kg|ml|l)` en mot entier : « 11g », « 11,5g », « 11.5 g », « 500g ») ; jetons séparés sur les espaces ; un
  code à tiret garde son tiret (`us-05`, `s-04`, `be-256`). Mots retirés : ceux de `FABRICANTS` (côté libellé, ils donnent le fabricant),
  `brewing`, `yeast`, `levure`, `hefe`, `trockenhefe`, `sachet`, `style`. Côté catalogue, un alias de référence commerciale (« LAL-WINDSOR-500 » :
  majuscules, tirets, nombre final) est écarté.
- **Désignation** = l'ensemble des jetons restants. **Code** = un jeton à chiffres comparé, tirets retirés, au `catalogue.productCode`
  (« BE-256 » = « be256 »).
- **Règle** : candidats = références dont un nom ou alias normalisé a exactement la même désignation, ou dont le `productCode` égale un
  code du libellé ; fabricant du libellé connu et incompatible avec `catalogue.manufacturer` → candidat retiré. 1 candidat et fabricant lu
  compatible (ou code égal au `productCode`) → `sur` ; 1 candidat sans fabricant lu → `aControler` ; ≥ 2 → `ambigu` ; 0 → `aucun`.
- **Table de 11 cas** (références réelles du dépôt, plus un jeu construit pour l'ambigu) :

| libellé | attendu |
|---|---|
| LALLEMAND Windsor 11g | `sur`, `lalbrew-windsor` |
| Safale BE-256 (Abbaye) 11.5 g | `sur`, `yeast-fermentis-safale-be-e2-80-91256` (code) |
| Safale US-05 11,5g | `sur`, `fermentis-us05` |
| LALLEMAND Verdant IPA 11g | `sur`, `lalbrew-verdant-ipa` |
| Wyeast 3711 French Saison | `sur`, `wyeast-3711` (code) |
| Windsor | `aControler`, `lalbrew-windsor` |
| Nottingham | `aControler`, `lalbrew-nottingham` |
| S-04 (le catalogue écrit « S‑04 », U+2011) | `aControler`, `yeast-fermentis-safale-s-e2-80-9104` |
| Fermentis Windsor | `aucun` (fabricant incompatible) |
| Levure Maison 42 | `aucun` |
| House Ale (deux références construites qui portent cet alias) | `ambigu`, 2 candidats |

- `ficheLevureDe` reçoit les références **en argument**, avec un type structurel local (`{ id, name, aliases?, catalogue?: { manufacturer?, productCode?, aliases? } }`) :
  aucun import de `functions/` dans `src/domain/stock/` (§ 7).

### 3.5 La recherche
- **Tâche existante `lookupIngredient`** (`functions/src/prompts.ts:894`, ancrée, `source` obligatoire, « un champ non trouvé reste ABSENT »,
  `found: false` sinon) pour malt, sucre et levure ; aucune tâche ni consigne neuve. Levure : le schéma `ingredientLookupDefinition('levure')`
  (`functions/src/prompts.ts:1002`) et la même adaptation que `lookupYeastSheet` (`src/ui/RecipeAutoComplete.tsx:323`) :
  `adaptYeastLookupResult` (`src/domain/ingredientFacts.ts:116`), `sanitizeFacts` (`:240`), identité jamais prise au modèle
  (`delete facts.hopIndexId`). Appelées par f4, pas par le module d'écran.
- **Houblon : aucune recherche en ligne** (une valeur typique n'est pas l'α du lot ; `factsForStock('houblon')` écrirait `alphaPct`).
  Rouge codé `horsCatalogue` (§ 3.7). `lookupHopVariety` → `hopVarieties` : § 10 n° 5.
- **Produit identifiable**, sinon aucun appel et rouge codé `aSaisir` : levure `aucun` au catalogue ; malt ou sucre avec un fabricant écrit
  ou une marque, **ou** avec fournisseur **et** code article imprimé (la page du produit chez le fournisseur nomme souvent la malterie).
- **Requête** (`RechercheFiche`, § 4.2) : `famille → kind` : malt et sucre → `'malt'` (le seul `IngredientKind` qui porte EBC et potentiel,
  `src/domain/ingredientFacts.ts:9`), avec `type: 'sucre' | 'grain'` dans le contexte ; levure → `'levure'`. `manquant` = **les libellés
  existants** d'`ingredientGaps` (`src/domain/ingredientFacts.ts:711`, `:724-729`) : malt `couleur EBC`, `potentiel PPG` ; levure
  `atténuation`, `température minimale`, `température maximale`, `laboratoire`. Consigne `"<kind> : <nomPropre>"`. Contexte
  `{ kind, type?, name, manquant, supplier, reference, known: { origin?, colorEbc? } }` ; jamais son nom, son adresse ni un montant.
- **Ce qu'elle remplit, trous seulement** : malt, sucre : `colorEbc`, `potentialPpg` ; levure : `yeastLab`, `yeastStrain`, `yeastForm`,
  `yeastAttenuationPct` (point publié seulement), `yeastTempMinC`, `yeastTempMaxC`, `yeastFlocculation`, `yeastAlcoholTolerancePct`,
  `yeastTechnicalFacts`, `yeastFermentationFacts` ; `technicalSource` seulement s'il est vide. Chaque champ → `remplis[champ]` (`par:
  'en-ligne'`, `source`, `url`, `le`, `valeur`, niveau `repris`).
- **Valeur déduite** (conception n° 5) : la consigne demande « PPG ≈ rendement × 46 » et « EBC ≈ °L × 1,97 » (`functions/src/prompts.ts:908-910`)
  et la réponse ne dit pas quel champ est converti. Donc **tout `potentialPpg` trouvé** porte `deduit: 'PPG ≈ rendement × 46 si la fiche publie
  un rendement (consigne de la tâche)'`, **tout `colorEbc` trouvé** porte `deduit: 'EBC ≈ °L × 1,97 si la fiche publie des °L'` ; ils restent
  `repris` jusqu'à « Vu », et l'écran dit « peut être calculé ». Une marque exacte par champ demanderait un champ neuf dans la réponse de la
  tâche (serveur) : § 10 n° 8.
- Une valeur rendue qui contredit une valeur lue ou tapée n'est pas écrite ; l'écart va au journal d'actions, jamais sur l'article.
- **Coût par article : ESTIMATION, non mesurée, jamais montrée comme un coût** avant la mesure du pilote (§ 10 n° 3). Tarifs de
  `functions/src/geminiCosts.ts` (3.8 Flash 1,5 / 7,5 CHF par M jetons ; recherche 0,0175 CHF la requête, 20 réservées) : probable 0,05 à
  0,12 CHF ; réservé ≈ 0,40 CHF par appel ; au pire deux essais (`GEMINI_ATTEMPTS = 2`) ≈ 0,80 CHF. Constantes nommées `ESTIMATION_*`.
- **Plafond** (conception n° 7) : seuls les appels **arrivés au serveur** comptent (`recherches`, classes `ok`, `quota`, `delai`, `sansDetail`,
  `autre` ci-dessous) ; `PLAFOND_JOUR = 5` par jour de Zurich et par appareil ; au-delà → `plafond`, repris le lendemain. Garde-fou de coût
  en plus : `PLAFOND_TENTATIVES = 10` tentatives parties par jour, quelle que soit l'issue. Le compteur vit dans IndexedDB : un effacement du
  site le remet à zéro (limite dite ; le budget mensuel du serveur reste). Un produit n'est cherché qu'**une fois** par clé (`reponses`) ;
  un `found: false` se re-cherche au plus tôt 30 jours après.
- **Échecs** (conception n° 6), classés sur les textes fixes de `AiClient.humanize` (`src/services/aiClient.ts:136-163`), **verrouillés par
  un test** qui appelle `AiClient.humanize` avec chaque code Firebase et vérifie la classe (pas de code d'erreur neuf côté serveur dans f4) :

| code Firebase | texte (`aiClient.ts`) | classe | compte au plafond | compte un jour d'échec | suite |
|---|---|---|---|---|---|
| `unauthenticated` | « Session expirée… » | `session` | non | non | `attend` |
| `permission-denied` | « Ce compte n'est pas autorisé… » | `refus` | non | non | `echec` (durable) |
| `failed-precondition` | message du serveur ou « L'IA n'est pas configurée… » | `config` | non | non | `iaEteinte` |
| `resource-exhausted` | « Quota IA atteint… » | `quota` | oui | non | `plafond` jusqu'au lendemain |
| `deadline-exceeded` | « …n'a pas répondu à temps… » | `delai` | oui | oui | `attend` |
| `unavailable`, `internal` | « Service IA momentanément indisponible. » | `reseau` | non | non | `attend` |
| autre code nu | « …sans détail exploitable… » | `sansDetail` | oui | oui | `attend` |
| — (`navigator.onLine === false`) | aucun appel | — | non | non | `attend` |

  Trois jours distincts d'échec compté → `echec` (« recherche impossible », relançable). 30 min au moins entre deux essais d'un même travail
  dans une même vie de page. `found: false` ou pas de `source` → `introuvable`.
- **Interrupteur (P4)** : `iaPermise()` lue **à l'appel** (jamais au chargement) : `VITE_ENRICHISSEMENT_IA === 'emulateur'` **et**
  `VITE_USE_FIREBASE_EMULATORS === 'true'`, ou `VITE_ENRICHISSEMENT_IA === 'production'` (valeur distincte, son accord). Toute autre valeur ou
  absente → `iaEteinte`. Injection `setEnrichissementIA('emulateur' | 'production' | 'eteinte' | null)` pour les tests. L'exécutant réel
  (`AiClient.run`, import paresseux) n'est construit que si `iaPermise()` ; **en test (`import.meta.env.MODE === 'test'`) sans exécutant injecté
  par `setRechercheFiche`, il lève** « exécutant réel interdit en test » : le test échoue, aucun appel ne part.

### 3.6 Où c'est gardé
- **Sur l'article seulement** : les champs existants (§ 3.5) et `StockItem.fiche`, **élargi de clés facultatives** (accord de schéma,
  § 10 n° 1) :
  ```ts
  type ParFiche = 'catalogue' | 'retenue' | 'en-ligne';
  type ChampFiche = 'colorEbc' | 'potentialPpg' | 'yeastLab' | 'yeastStrain' | 'yeastForm' | 'yeastAttenuationPct' | 'yeastTempMinC'
    | 'yeastTempMaxC' | 'yeastFlocculation' | 'yeastAlcoholTolerancePct' | 'yeastTechnicalFacts' | 'yeastFermentationFacts' | 'technicalSource';
  fiche?: {
    id: string; approchee: boolean;          // s6 ; jamais réécrits par f4
    cle?: string;                            // clé de fiche famille|fabricant|mots (§ 3.3)
    par?: ParFiche;                          // provenance du LIEN quand f4 l'a posé ; absent = lien de s6
    aControler?: boolean;                    // booléen : `false` le retire (fusion Firestore)
    propose?: string | null;                 // fiche meilleure trouvée par f4 pour un lien s6 ; `null` la retire
    remplis?: Partial<Record<ChampFiche, { par: ParFiche; source: string; url?: string; le: string; niveau: 'sur' | 'repris';
                                           valeur: unknown; deduit?: string }>>;
    vu?: string;                             // ISO : il a vu la fiche ; seuls les `remplis` dont `le <= vu` deviennent sûrs
  }
  ```
  Espaces d'identifiants : variété de l'index (s6, `beermaverick-…`), slug Beer Analytics (s6), `levure:<id du catalogue>` (f4), `cle:<clé>`
  (fiche trouvée en ligne, f4). Aucune règle Firestore à changer (`firestore.rules.template:178,182` ne contrôlent que `currentStock`) ; la
  sauvegarde n'a pas de liste blanche (`functions/src/backupCore.ts:102`). `src/types/index.ts` : le pilote l'écrit ou me l'accorde.
- **Fusion Firestore** (conception n° 4) : `FirestoreRepo.put(..., { merge: true })` fusionne les cartes et ne transforme en `deleteField()`
  que les clés de premier niveau `undefined` (`src/services/firestoreRepo.ts:598-600`) ; un `undefined` imbriqué est retiré
  (`stripUndefined`, `:219-227`). Donc f4 n'efface jamais une clé imbriquée par `undefined` : `aControler: false`, `propose: null`.
- **Sans l'accord de schéma** (P5) : le code et ses tests se font, mais le branchement attend ; aucune clé neuve n'est écrite sur ses données.
- **Aucune collection neuve.** `fichesProduits/{cle}` : § 10 n° 9.
- **Local** (IndexedDB, base neuve `laffinee-fiches`, pas Firestore) : `travaux`, `reponses`, `compteur` (§ 4.1).
- **Écriture** (conception n° 13) : l'article est relu dans `StorageService.getStocks()` et le `put` part **dans la même tâche synchrone**
  (aucun `await` entre la lecture et `FirestoreRepo.put`, qui est synchrone). Article absent à cet instant → `abandonne`, aucun `put`. Le
  patch ne porte que les champs vides de la liste blanche et `fiche` ; jamais `currentStock`, `name`, `unit`, `category`, `alphaPct`,
  `yeastLot`, `supplier`, `origin`. Une suppression par un autre appareil après le `put` : le `merge` sans `currentStock` est refusé par la
  règle de création (`firestore.rules.template:178`), le cache revient. Journal : `StorageService.logAction('Modification','Stocks',ref,…)`.

### 3.7 Ce qu'il voit (besoin décrit ; la voie d'interface viendra, L25)
- Un retour discret quand un réveil a fini (modèle `src/ui/finance/ProofUploadNotice.tsx`) : « 3 fiches remplies · 1 à contrôler », et selon
  le cas « 1 introuvable », « 2 en attente du réseau », « plafond du jour atteint, reprend demain », « recherche en ligne éteinte ».
- Le contrôle se fait **dans le stock, sur la fiche de l'article** : niveau par champ ; « Vu » (pose `fiche.vu`) ; pour `aControler` :
  garder, choisir un candidat, prendre `propose`, ou délier ; pour `echec` : relancer.
- Données pour l'écran, pures : `niveauxDeFiche(item, famille, catalogues?)` → par champ utile `{ niveau: 'sur' | 'repris' | 'inconnu',
  motif, source?, url?, deduit? }`, motif **codé** (conception n° 15) : `lu`, `catalogue`, `retenue`, `enLigne`, `deduit`, `aControler`,
  `approchee`, `ambigu`, `horsCatalogue`, `alphaAbsent`, `aSaisir`. Règles : présent et pas rempli par f4 (§ 2.1) → `sur` `lu` ; rempli
  `catalogue` niveau `sur` sans `aControler` → `sur` ; rempli (`le > vu` ou pas de `vu`) → `repris` ; vide → `inconnu`. Champs utiles :
  malt et sucre : EBC, potentiel ; houblon : α (`alphaAbsent`), fiche (`horsCatalogue` quand le catalogue est passé et ne la connaît pas) ;
  levure : laboratoire, forme, températures (ou observations). L'écran choisit les articles à marquer (ceux de f4 : `fiche.cle` posée ou
  travail connu) ; un ancien article n'est pas marqué.
- `resumeEnrichissement()` → `{ remplies, aControler, introuvables, enAttente, plafond, iaEteinte }`, compté sur les travaux finis non
  encore annoncés (`annonce: false`) ; `marquerResumeVu()` les passe `annonce: true`. `subscribeEnrichissement(cb)`.

### 3.8 Risques
| risque | tenue | test |
|---|---|---|
| double clic sur « Confirmer » | `savePurchaseWithProofReceipt` rend tôt (`purchaseEntry.ts:504`) ; clé du travail = `ref` ; `planifier` idempotent | R1 |
| rejeu après rejet | travail `abandonne` (rejet) réarmé | R13 |
| deux dépenses du même produit | d'ordinaire la 2ᵉ ligne est **reliée** à l'article (aucun travail) ; le vrai second travail vient d'un « bis » (D215) ou d'un libellé non reconnu ; même clé → même fiche, aucun second appel (cache et fiches retenues relus avant tout appel) | T3, T3b |
| hors ligne, rechargement hors ligne | porte 4 (`waitForDocument`), `unknown` jamais prêt ; aucune recherche hors ligne ; échec réseau non compté | R2, R2b |
| échec de la tâche | table § 3.5 ; jamais de valeur sans `found` et `source` | R5, R6, R14 |
| catalogue pas chargé | import attendu ; échec d'import → `attend`, jamais `introuvable` | R7 |
| article supprimé, dépense rejetée | `abandonne`, aucun `put` (relecture et `put` dans la même tâche) | R3, R4 |
| il retouche une valeur | elle redevient la sienne (§ 2.1) ; f4 ne la touche plus | T4 |
| feuille ouverte | `tenirEnrichissement` | R8 |
| rapprochement changé par f4 | P1, G5 | P1-a, P1-b, P1-c |
| poids du paquet | § 7 | build |
| tests existants | sans IndexedDB, tout est sans effet | R12, § 8 |
| arrondis, centimes, unités | non touchés : f4 n'écrit ni montant, ni quantité, ni unité | — |

## 4. Formes de données (prêt n° 7)

### 4.1 La file locale
```ts
type Famille = 'houblon' | 'malt' | 'levure';
type EtatTravail = 'attend' | 'fait' | 'aControler' | 'introuvable' | 'aSaisir' | 'iaEteinte' | 'plafond' | 'echec' | 'abandonne';
type Raison = 'rejet' | 'supprime' | 'ambigu' | 'proche' | 'propose' | 'horsCatalogue' | 'nonIdentifiable' | 'refus' | 'troisJours';
interface TravailFiche {
  ref: string; submissionId: string; transactionId: string; uid: string; famille: Famille;
  ligne: { description: string; nomPropre: string; reference?: string; fournisseur?: string; unit: string; quantity?: number;
           kind?: string; stockCategory?: string; lu: { alpha?: number; origine?: string; ebc?: number } };
  s6: { cas: 'neuf' | 'incertain' | 'inconnu' | 'ambigu'; voisinRef?: string; motif?: 'bis' | 'origine' };
  cle: string; etat: EtatTravail; raison?: Raison; candidats?: string[];
  essais: { joursEchec: string[]; dernier?: number; vie?: string };
  remplis?: ChampFiche[]; creeLe: string; finiLe?: string; annonce: boolean;
}
interface ReponseFiche { cle: string; trouvee: boolean; facts?: IngredientFacts; le: string }   // facts déjà adaptés et nettoyés
interface CompteurJour { jour: string; recherches: number; tentatives: number }                // jour de Zurich, AAAA-MM-JJ
interface MagasinFiches {
  travaux: { put(t: TravailFiche): Promise<void>; get(ref: string): Promise<TravailFiche | undefined>; all(): Promise<TravailFiche[]>; delete(ref: string): Promise<void> };
  reponses: { put(r: ReponseFiche): Promise<void>; get(cle: string): Promise<ReponseFiche | undefined> };
  compteur: { get(jour: string): Promise<CompteurJour | undefined>; put(c: CompteurJour): Promise<void> };
}
```
Dexie `laffinee-fiches` version 1 (`travaux: 'ref, etat, uid'`, `reponses: 'cle'`, `compteur: 'jour'`), même garde de version que
`src/services/proofQueueStore.ts:47-77` ; magasin mémoire pour les tests ; `null` sans IndexedDB.

### 4.2 L'exécutant de recherche
```ts
interface RequeteFiche { kind: 'malt' | 'levure'; name: string; instruction: string; context: Record<string, unknown> }
type RechercheFiche = (req: RequeteFiche) => Promise<AiResponse<IngredientFacts>>;   // la forme brute d'AiClient.run
```
L'adaptation (`adaptYeastLookupResult` pour la levure, `sanitizeFacts`, `found`, `source`) est faite par f4, et testée, sur cette réponse
brute. Réel : `(req) => AiClient.run({ task: 'lookupIngredient', tier: 'fast', ...req })`, importé paresseusement, seulement si `iaPermise()`.

### 4.3 L'automate
```
planifier ─► attend ─┬─ portes fermées ──────────────────────────────► attend (réveil suivant)
                     ├─ dépense ou article rejeté / article absent ───► abandonne ──(rejeu réussi)──► attend
                     ├─ catalogue/retenue `meme` suffisant ou rien à chercher ─► fait
                     ├─ `proche`, `ambigu`, `propose` ────────────────► aControler
                     ├─ houblon sans variété ─────────────────────────► aSaisir (horsCatalogue)
                     ├─ IA nécessaire, non identifiable ──────────────► aSaisir (nonIdentifiable)
                     ├─ IA nécessaire, non permise ───────────────────► iaEteinte ──(permise au réveil)──► attend
                     ├─ plafond ou quota ─────────────────────────────► plafond ──(jour suivant)──► attend
                     └─ appel ─┬─ trouvé ─► fait (ou aControler si l'étape 4 donne `proche`)
                               ├─ found:false ─► introuvable ──(30 j)──► attend
                               ├─ réseau, session, délai ─► attend
                               └─ refus, ou 3 jours d'échec ─► echec ──(relancerFiche)──► attend
```
États finaux : `fait`, `aControler`, `introuvable`, `aSaisir`, `echec`, `abandonne` ; `annonce` passe `false` à chaque entrée dans l'un d'eux.

### 4.4 `ficheRetenueDe`, pour `learnIngredient` (conception n° 2)
`ficheRetenueDe(nom, categorie, stock): { cas: 'meme', article: StockItem } | { cas: 'proche' } | undefined` (pure, `ficheCle.ts`) : la clé du
nom contre `fiche.cle` des articles du stock de même famille. Le pilote la branche dans `learnIngredient` (`src/services/storage.ts:735`,
§ 6) : `meme` → l'article f4 reçoit les valeurs (trous seulement, comme aujourd'hui) au lieu d'un `FICHE-…` ; `proche` → rien n'est écrit,
aucun `FICHE-…` (la recette garde ses valeurs) ; `undefined` → comportement d'aujourd'hui. Le cache `reponses` reste local à f4 : « Compléter
avec l'IA » ne le lit pas (limite dite) ; il lit l'article, que f4 a déjà rempli.

## 5. Changements (temps 2), fichier et fonction
Fichiers neufs ou à f4 (« Possède » du temps 2 : celui du plan, plus `src/domain/ingredientFacts.ts` `factsFromStock` seul, `src/domain/stock/fiche.ts`,
les ajouts du cas `enrichir` de `scripts/check-invoice-journey-emulator.mjs`) :
- `src/domain/stock/ficheCle.ts` (pur) : `FABRICANTS`, `MARQUES`, `fabricantDe`, `motsDeFiche`, `generique`, `cleFiche`, `memeProduitDeFiche`, `ficheRetenueDe`.
- `src/domain/stock/ficheLevure.ts` (pur) : `jetonsLevure`, `ficheLevureDe(libelle, references)` (type structurel local).
- `src/domain/stock/ficheValeurs.ts` (pur) : `valeurLueDe`, `ficheDeS6`, `porteDonneeLue`, `CHAMPS_UTILES`, `CHAMPS_ECRIVABLES`, `trousDe`,
  `patchDeTrous(item, valeurs, provenance, maintenant)` (règle « manquant » de `src/services/storage.ts:743-744`), `niveauxDeFiche`.
- `src/domain/stock/fiche.ts` : `nomDeFiche` apprend `levure:<id>` (`Catalogues.levures?: readonly { id: string; name: string }[]`) ; `cle:` → `undefined`.
- `src/domain/ingredientFacts.ts` : `factsFromStock` seul (P2, § 2.2).
- `src/services/enrichissementStore.ts` : Dexie et mémoire (§ 4.1).
- `src/services/enrichissementReglages.ts` : `iaPermise`, `setEnrichissementIA`, `PLAFOND_JOUR`, `PLAFOND_TENTATIVES`, `ECART_ESSAIS_MS`,
  `JOURS_ECHEC`, `REESSAI_INTROUVABLE_MS`, `ESTIMATION_*`, `classerEchec(texte)`.
- `src/services/enrichissementCatalogues.ts` (importé **seulement** par `import()`) : `referencesLevures()` (`yeastReferences`), `valeursDeCatalogueLevure(ref)`
  (`localYeastFacts` + `factsForStock`), `cataloguePleinHoublons()`, `valeursDeReponse(famille, facts)` (sans `alphaPct`, sans `yeastNotes`, `deduit` posé).
- `src/services/enrichissement.ts` : `travauxDeLaSaisie(draft)` (pur), `planifierEnrichissement`, `tenirEnrichissement`, `startEnrichissement`,
  `runEnrichissement`, `traiterTravail`, `resumeEnrichissement`, `marquerResumeVu`, `subscribeEnrichissement`, `relancerFiche`, `marquerFicheVue`,
  injections `setEnrichissementStore`, `setRechercheFiche`, `setCataloguesFiche`, `setHorlogeFiche`.

## 6. Branchements du pilote (P5), ligne exacte et code
| fichier : ligne | code |
|---|---|
| `src/services/purchaseEntry.ts:511`, après `void runProofQueue('save');` (dans le `try`) | `planifierEnrichissement(draft);` |
| `src/services/purchaseEntry.ts:530`, scindée | `const transactionId=savePurchase(draft,{catalogues}); planifierEnrichissement(draft); return {transactionId,proof:proofReceipts.get(draft.submissionId)};` |
| `src/ui/finance/ExpenseSheet.tsx:175`, après le `useEffect` de `mounted` (`:174`) | `useEffect(()=>tenirEnrichissement(),[]);` (import depuis `../../services/enrichissement`, pas par `purchaseEntry` : les 12 tests qui simulent `purchaseEntry` en entier n'en dépendent pas) |
| `src/App.tsx:309` | `const stopFiches = startEnrichissement();` |
| `src/App.tsx:328`, à côté de `stopProofQueue();` | `stopFiches();` |
| `src/services/stockLineMatching.ts:180` | `const porteDonneeS6 = porteDonneeLue;` |
| `src/services/stockLineMatching.ts:399` | `{ alpha: positif(valeurLueDe(item,'alphaPct')), origine: item.origin, ebc: positif(valeurLueDe(item,'colorEbc')) }` |
| `src/services/storage.ts:735` | `const retenue = !matches.length && !facts.ref ? ficheRetenueDe(name, facts.category, stock) : undefined; if (retenue?.cas === 'proche') return; const item = matches[0] ?? retenue?.article;` |
| `src/types/index.ts:67` | l'élargissement de `fiche` (§ 3.6), sur accord |
Le branchement de `stockLineMatching.ts` vient **avant** toute clé `remplis` écrite sur ses données (sinon P1 n'est pas tenu).

## 7. Contraintes de code
- **Garde R15 de s6** (`tests/unit/depense/fiche/fiche.test.ts:81-85`) : chaque fichier de `src/domain/stock/` ne contient ni `functions/`,
  ni `firebase`, ni `fetch(`, ni `XMLHttpRequest`, ni `geminiScanner` (commentaires compris). `ficheCle.ts`, `ficheLevure.ts`,
  `ficheValeurs.ts`, `fiche.ts` la respectent (type structurel pour les références de levure, aucun import de `functions/`) ; ce qui touche
  `functions/` (types de `localYeastFacts`, `factsForStock`) vit dans `src/services/enrichissementCatalogues.ts`. Le test reste vert sans être modifié.
- **Poids du paquet** (prêt n° 4) : importés **statiquement** par `enrichissement.ts` : `enrichissementStore` (Dexie, déjà dans le paquet par
  `proofQueueStore`), `enrichissementReglages`, `ficheCle`, `ficheValeurs` (légers ; `noms.ts` et `ingredientIdentity` y sont déjà). Importés
  **par `import()`** dans le travail seulement : `enrichissementCatalogues` (donc `yeastReferences`, `yeastCatalogueLibrary.json` 1,4 Mo, les
  10 autres JSON de `src/domain/yeastReferences.ts:6-17`, `localIngredientFacts`), `src/domain/hopIndex/v4/data` (catalogue plein),
  `aiClient`, `firebaseAuth`. RESULTAT donne la taille du morceau `App` avant (s6 : 2 876 796 o) et après ; seuil : + 10 Ko.

## 8. Tests
Fixtures synthétiques (libellés de 372765 déjà dans les tests de s6 ; aucun nom ni adresse du brasseur), Gemini toujours simulé
(`setRechercheFiche`, et un espion vérifie qu'`AiClient.run` n'est jamais appelé), magasins mémoire, horloge injectée.

### 8.1 Témoins rouges, sur le code d'aujourd'hui (`tests/unit/depense/enrichir/temoin.test.ts`, n'importe **aucun** module neuf)
- T1 (E2) : les 4 levures de 372765 par `resolveFermentationYeast` → 1 trouvée (rouge contre l'attente « 4 »). Le même attendu est rejoué
  vert sur `ficheLevureDe` dans `levure.test.ts`.
- T2 (E1, E3) : `savePurchase` d'une saisie (Windsor neuf, « Malterie du Banc Ambre 60 » neuf, Target neuf, catalogue non chargé) : aucune
  fiche de levure, Target sans fiche, l'ambre sans EBC ni potentiel (constat, vert) ; l'attente « après la procédure » est dans
  `procedure.test.ts`.
- P1-a, P1-b, P1-c (bloquant) : un article portant une valeur remplie (clé `fiche.remplis` posée à la main, ignorée par le code
  d'aujourd'hui) contre le même article sans elle : `regleProduit` doit rendre **le même verdict**. Mesuré sur l'arbre d'aujourd'hui
  (`sondes/sonde-p1.ts`, `vite-node`) :
  - (a) malt « Münchner Malz » (fiche `munich-malt`), ligne « Münchner Malz 25 EBC » : sans EBC → `incertain` (`seul: ['ebc']`, voisin
    l'article) ; avec un EBC trouvé 24 → **`neuf`, « Münchner Malz bis », `ecarts: ['ebc']`** : le « bis » forcé. **Rouge.** Attendu : `incertain`.
  - (b) ligne « Münchner Malz » sans EBC : `meme` dans les deux cas (la règle de s1 relie d'abord). **Garde, vert** aujourd'hui (la crainte
    d'un « incertain » neuf ne se vérifie pas sur ce cas) ; il doit le rester.
  - (c) ligne « LALLEMAND Windsor 11g » contre l'article de même nom, avec ou sans lien f4 : `meme` dans les deux cas (garde, vert).
    (c2) ligne « Windsor » contre « Windsor » et « Windsor bis » (créé à la main) : sans fiche → `meme` (`Windsor`) ; quand f4 pose un lien
    sur « Windsor bis » → **`ambigu`, « Windsor bis 2 »** (`porteDonneeS6` devient vrai et retire « bis »). **Rouge.** Attendu : `meme`.
  Verts **après le branchement du pilote** (§ 6) : le pilote les rejoue ; RESULTAT les dit « rouges jusqu'au branchement ».
- E4 : `learnIngredient('Weyermann Carahell', { category: 'Malt', colorEbc: 20 })` avec un article f4 « Weyermann Carahell » de nom
  différent (« Carahell Weyermann 1 kg ») : aujourd'hui un `FICHE-…` est écrit (rouge) ; attendu : aucun. Vert après le branchement de
  `storage.ts:735` ; `ficheRetenueDe` est testée seule, verte, dans `cle.test.ts`.

### 8.2 Les tests de f4 (`tests/unit/depense/enrichir/`), rouges d'abord (module absent), puis verts
- `cle.test.ts` : `cleFiche`, `memeProduitDeFiche`, `generique`, les 5 couples de § 3.3, `ficheRetenueDe` (`meme`, `proche`, rien).
- `levure.test.ts` : la table des 11 cas (§ 3.4 bis) ; `valeursDeCatalogueLevure` sur les 4 levures de 372765 (laboratoire, forme,
  températures, source citée ; aucun `yeastLot`, aucun `yeastNotes`).
- `valeurs.test.ts` : `valeurLueDe` (rempli → `undefined` ; retouché par lui → sa valeur), `porteDonneeLue`, `patchDeTrous` (0 compte
  vide pour potentiel, α, atténuation ; liste blanche), `niveauxDeFiche` (T4 : lu `sur` ; catalogue `sur` ; en ligne `repris` ; `vu` après →
  `sur` ; valeur remplie **après** `vu` → `repris` ; `deduit` → `repris` ; vide → `inconnu` avec motif ; `alphaAbsent`, `horsCatalogue`).
- `faits.test.ts` (P2) : `factsFromStock` → `origin: 'ai'` pour un EBC rempli en ligne non vu, `'manufacturer'` pour une levure du catalogue,
  `'personal'` après « Vu » ou pour une valeur tapée.
- `procedure.test.ts` : T2 après `run` (Windsor `levure:lalbrew-windsor` `par: 'catalogue'` ; Target lié à sa variété ; l'ambre rempli,
  `par: 'en-ligne'`, `repris`, `deduit`, source et URL) ; T3 (deux saisies, `stockAction: 'new'` forcé, même produit absent des catalogues :
  **un** appel, même `fiche.cle`, le second `par: 'retenue'`) ; T3b (cas D215 réel : « Münchner Malz » 20 EBC puis la ligne « Münchner
  Malz 15 EBC », qui donne « Münchner Malz bis » par `regleProduit` : une fiche, un appel au plus, chacun son EBC lu) ; « Cascade US » puis
  « Cascade CH » : 0 appel ; fiche s6 approchée gardée, `propose` posé, `aControler` ; « article renommé après la confirmation → même fiche ».
- `file.test.ts` : R1 double `planifier` → un travail ; R2 écriture `pending` → rien, puis `online` → fait ; R2b redémarrage hors ligne
  (`unknown`, `waitForDocument` en délai) → `attend`, rien compté ; R3 article supprimé (entre la lecture de l'état et le travail, et à
  l'instant de l'écriture) → `abandonne`, aucun `put` ; R4 rejet → `abandonne` ; R5 `found: false` → `introuvable`, pas de second appel
  avant 30 jours ; R6 trois jours d'échec `delai` → `echec`, mais six échecs `reseau` → toujours `attend` et 0 au plafond ; R7 import du
  catalogue en échec → `attend`, puis fait ; R8 feuille tenue → rien, libérée → fait ; R9 un houblon : jamais d'appel, jamais `alphaPct`
  écrit ; R10 nom publié d'une levure du catalogue → lien au catalogue ; R11 levure ambiguë → aucun lien, aucun appel, candidats ;
  R12 sans IndexedDB → `planifier` et `tenir` sans effet ni erreur ; R13 rejet puis rejeu réussi → réarmé ; R14 `quota` → `plafond`, repris
  le lendemain ; plafond : la 6ᵉ recherche du jour attend ; aucune écriture ne porte `currentStock`, `name`, `unit`, `category`, `yeastLot`.
- `interrupteur.test.ts` (P4) : éteint → `iaEteinte`, catalogue fait quand même, aucun appel ; `emulateur` sans `VITE_USE_FIREBASE_EMULATORS`
  → éteint ; `production` → permis ; allumé sans exécutant injecté en test → lève, aucun appel ; `classerEchec` sur chaque texte de
  `AiClient.humanize` (table § 3.5, verrouille les textes).
- `feuille.test.tsx` (prêt n° 11) : la feuille montée avec `purchaseEntry` simulé en entier (comme `tests/unit/depense/drive-fond/fiche.test.tsx:17`) :
  `tenirEnrichissement` sans erreur ; démontée : la tenue est rendue.

### 8.3 Tests et scripts hors « Possède » qui touchent ce qui change
- `grep -l savePurchase` sur `tests/` et `scripts/` (`sondes/savepurchase.txt`) : **27 fichiers** : 23 sous `tests/unit/depense/`,
  `tests/unit/purchaseEntry.test.ts`, `tests/integration/expenseSheet.test.tsx`, `tests/integration/expenseSheetMouture.test.tsx`,
  `tests/integration/jus0Journey.test.tsx`. **12** simulent `purchaseEntry` en entier (`tests/unit/depense/drive-fond/{feuille,fiche,notification}.test.tsx`,
  `tests/unit/depense/ecran/{ecran,finitions,p3c,tri}.test.tsx`, `tests/unit/depense/fiche/ecran.test.tsx`, `tests/unit/depense/qr/ecran-qr.test.tsx`,
  `tests/unit/depense/raccord/{changer-fichier,ecran-lecture,ecran-recu}.test.tsx`) plus les 2 d'intégration : l'import de la feuille passe
  par `services/enrichissement`, pas par eux. Les tests de `regleProduit` (`tests/unit/depense/fiche/regle.test.ts`, `chasse-*`) : leurs
  fixtures n'ont aucune clé `remplis`, donc `valeurLueDe` = la valeur d'aujourd'hui ; verdict inchangé, rejoués après le branchement.
  `tests/unit/depense/fiche/fiche.test.ts` (R15) : § 7. Les tests de `factsFromStock` : `grep` au temps 2, rejoués.
- **Base, rejouée sur l'arbre d'aujourd'hui** (`sondes/base-tests.log` : `tests/unit/depense`, `tests/unit/purchaseEntry.test.ts`,
  `tests/integration/expenseSheet*.test.tsx`, `AppQuickActionReturn.behavior.test.tsx`, `fix114.test.tsx`) : `Test Files 17 failed | 82 passed (99)`.
  Les 16 qui ne chargent pas (`Failed to resolve import "zxing-wasm/reader"`, connu, ne rien installer) : `tests/integration/expenseSheet.test.tsx`,
  `tests/integration/expenseSheetMouture.test.tsx`, `tests/unit/depense/doublon/feuille.test.tsx`, `tests/unit/depense/drive-fond/feuille.test.tsx`,
  `tests/unit/depense/ecran/{bande,ecran,finitions,p3c,tri}.test.tsx`, `tests/unit/depense/fiche/ecran.test.tsx`, `tests/unit/depense/qr/lecture.test.ts`,
  `tests/unit/depense/raccord/{changer-fichier,ecran-lecture,ecran-recu}.test.tsx`, `tests/unit/depense/stock/{ecran,unites}.test.ts`.
  Le 17ᵉ, un test rouge : `tests/unit/depense/confiance/unites.test.ts` (« …, Kg » ; voie f2 en cours). Critère du temps 2 : ces 17, aucun de plus.
  `feuille.test.tsx` de f4 (§ 8.2) ne monte pas `zxing` (il simule `qrLecture`), sinon il rejoint la liste et RESULTAT le dit.

## 9. Le parcours émulateurs (P6)
Ajouts **seulement** à `scripts/check-invoice-journey-emulator.mjs`, un cas neuf `enrichir` :
- `callableAnswer` (`:303-310`) : si `c.case === 'enrichir'` et `data.task === 'lookupIngredient'`, réponse fixée par `kind` et `name` (un
  malt absent des catalogues : « Malterie du Banc Ambre 60 » ; une levure absente : « Levure du Banc 7 ») au format brut d'`aiTask`
  (`{ ok: true, data: IngredientFacts, model: 'rejeu-f4' }`), chaque appel compté (`c.calls.ai`) ; tout autre nom → `found: false`. Hors du
  cas `enrichir`, la ligne existante (« seule la lecture de justificatif est rejouée ») est inchangée.
- `viteEnv` (`:1806-1812`) : `VITE_ENRICHISSEMENT_IA: 'emulateur'` **seulement si les cas demandés sont exactement `enrichir`** ; le cas
  refuse d'être lancé avec d'autres. Les autres cas tournent sans la variable : leur comportement ne change pas d'un octet.
- Un `aiTask` non intercepté ne peut partir : le banc ne laisse sortir de Chrome que `127.0.0.1`/`localhost` et ne résout aucun autre nom
  (`:14-15`, `:264`) ; le cas exige 0 requête bloquée.
- Scénario : dépense confirmée (Maris Otter, LALLEMAND Windsor 11g, Target 11.3%, l'ambre, la levure du Banc), feuille fermée ; attendre la
  fin des travaux ; lire `stockItems` dans l'émulateur : Windsor `levure:lalbrew-windsor`, Target sa variété, l'ambre et la levure du Banc
  `par: 'en-ligne'` ; **2 appels** `lookupIngredient` exactement (Maris Otter générique sans code : aucun ; la fixture n'a pas de code
  article sur cette ligne). Seconde dépense de la même ambre en « bis » (`15 EBC` imprimé) : **0 appel de plus**, même `fiche.cle`, chacun son
  EBC lu. Rechargement hors ligne au milieu (`__jus0Offline`) : rien d'écrit, repris au retour. Captures à 390 et 1280 du stock après.
- Sortie : `ENRICHIR OK` seulement si appels = 2 puis 2, fiches par clé = 1, 0 requête bloquée, 0 erreur de console. Le pilote rejoue les
  cas existants. Série mécanique : `DEMANDE EXECUTANT` au temps 2.

## 10. Hors périmètre, et décisions à router
Hors périmètre : l'écran (retour discret, fiche dans le stock : voie d'interface, Opus) ; les articles et dépenses d'avant f4 ; la lecture de
`fiche` par les recettes, Comparer et le moteur ; le cumul de coût côté serveur (budget mensuel) ; les articles `FICHE-…` existants.
1. **Accord de schéma** : élargir `StockItem.fiche` (§ 3.6). Recommandé : oui.
2. **Interrupteur** : `emulateur` pour le parcours ; `production` = son accord, après la mesure.
3. **Mesure du coût** : 3 appels réels journalisés (`journal-gemini.md`, budget D217), par le pilote, hors voie.
4. **Plafond** : 5 recherches par jour et 10 tentatives (recommandé).
5. **Houblon hors catalogue** : `lookupHopVariety` → `hopVarieties` dans une voie suivante, sur geste d'abord.
6. **`BrewWizard.tsx:1590`** : `attenuationBasis: 'declared'` pour une atténuation trouvée en ligne non vue ; f4 tient qu'elle est un point
   publié ; la marque « non vue » relève de la voie d'interface ou d'une voie recettes.
7. **Autres** (sels, acides, clarifiants) : hors f4, choix prudent ; une voie suivante s'il le demande (conception n° 14, accepté).
8. **Valeur déduite exacte** : un champ `derivedFields` dans la réponse de `lookupIngredient` (serveur, déploiement) ; recommandé plus tard.
9. **Collection `fichesProduits`** : non pour f4 ; à rouvrir si deux appareils créent des doublons.

## 11. Où chaque correction de la revue se trouve
| revue | n | où |
|---|---|---|
| décisions | P1 | § 2.1, § 2.2 (lignes `stockLineMatching`), § 6 (lignes `:180`, `:399`), § 8.1 P1-a à P1-c, G5 |
| décisions | P2 | § 2.2 (`factsFromStock`), § 5, § 8.2 `faits.test.ts` |
| décisions | P3 | § 3.3 (clé sans EBC ni origine, comparaison, passage des valeurs, 5 couples), § 8.2 `cle.test.ts`, T3b |
| décisions | P4 | § 3.5 « Interrupteur », § 8.2 `interrupteur.test.ts` |
| décisions | P5 | § 6 (lignes et code), § 3.1 (`planifier` ne lève jamais), § 3.6 (attente de l'accord) |
| décisions | P6 | § 9 |
| conception | 1 | § 2 (règle et table des lecteurs), § 8.1 P1, § 8.3 (« aucune règle ne change » retiré) |
| conception | 2 | E4 (§ 1), § 4.4 `ficheRetenueDe`, § 6 (`storage.ts:735`), § 8.1 test E4 |
| conception | 3 | § 3.3 (composante par composante, générique sans recopie), § 8.2 `cle.test.ts` |
| conception | 4 | § 3.4 étape 1 (fiche s6 jamais réécrite, `propose`), § 3.6 (espaces d'identifiants, préfixe `levure:`, `aControler` booléen, `propose: null`, fusion), § 5 (`nomDeFiche`) |
| conception | 5 | § 3.5 « Valeur déduite », § 3.6 (`deduit`), § 3.7 (motif `deduit`), § 10 n° 8 |
| conception | 6 | § 3.1 porte 4 (`waitForDocument`, `unknown` jamais prêt), § 3.5 table des échecs (réseau non compté, texte verrouillé par test) |
| conception | 7 | § 3.5 « Plafond » (seuls les appels arrivés comptent, `ESTIMATION_*`, jamais montré), § 3.7 (`plafond` au résumé) |
| conception | 8 | § 3.5 « Interrupteur » (cible émulateur ou production), § 9 (aucun `aiTask` non intercepté) |
| conception | 9 | § 3.2 (champs capturés, rapprochement sur eux), § 4.1 `TravailFiche.ligne`, § 8.2 « article renommé » |
| conception | 10 | § 3.3 (un « bis » partage la fiche), § 3.8, § 8.2 T3b et « Cascade US puis CH » |
| conception | 11 | § 3.1 « Rejeu », § 4.3, § 8.2 R13 |
| conception | 12 | § 3.6 (`vu` contre `le`), § 3.7, § 8.2 `valeurs.test.ts` |
| conception | 13 | § 3.6 « Écriture » (même tâche synchrone), § 8.2 R3 |
| conception | 14 | § 3.2 (choix prudent), § 10 n° 7 — acceptée |
| conception | 15 | § 3.7 (motifs codés `horsCatalogue`, `alphaAbsent`…) |
| prêt | 1 | comme conception 1 : § 2, § 6, § 8.1 |
| prêt | 2 | § 9 |
| prêt | 3 | § 7 « Garde R15 », § 3.4 bis (type structurel), § 5 (`enrichissementCatalogues.ts`) |
| prêt | 4 | § 7 « Poids du paquet » (imports nommés, taille avant et après) |
| prêt | 5 | § 3.4 étape 1 (appel exact de `localYeastFacts`), § 8.2 `levure.test.ts` |
| prêt | 6 | § 3.4 bis (normalisation, mots retirés, jetons entiers, table de 11 cas) |
| prêt | 7 | § 4 (interfaces, magasin, `RechercheFiche`, automate), § 3.5 (`kind` du sucre, `manquant` en libellés existants), § 3.7 (résumé) |
| prêt | 8 | § 3.5 « Interrupteur » (lu à l'appel, `setEnrichissementIA`) |
| prêt | 9 | § 6 (lignes exactes, `:530` scindée, `ExpenseSheet.tsx:175`, trois montages, `App.tsx:309` et `:328`), § 3.1 |
| prêt | 10 | § 3.4 étape 1 (fiche approchée gardée, `approchee` et `aControler` ensemble), § 5 (`nomDeFiche`, id de levure) |
| prêt | 11 | § 8.3 (27 fichiers nommés, 12 simulations de `purchaseEntry`, liste des 17 rouges), § 8.2 `feuille.test.tsx` |
| prêt | 12 | § 8.1 (`temoin.test.ts` sans module neuf ; T2 « avant » sur `savePurchase` seul) |
| prêt | 13 | § 3.1 porte 4, § 8.2 R2b |
| prêt | 14 | § 8.2 T3 (`stockAction: 'new'` forcé) et T3b (cas D215 réel) |
| prêt | 15 | chemins complets partout ; `src/domain/stock/fiche.ts:61` ; `adaptYeastLookupResult` à `src/domain/ingredientFacts.ts:116` ; `lookupYeastSheet` à `src/ui/RecipeAutoComplete.tsx:323` |

## 12. Après la relecture du bloquant (`REVUE-bloquant.md`, PRÊT ; 5 majeurs, 4 détails, tous « corrigée »)
Ces lignes priment sur le reste du plan là où elles le précisent.
1. **Égalité profonde** : `valeurLueDe`, `niveauxDeFiche` et `factsFromStock` comparent `item[champ]` à `remplis[champ].valeur` par une
   égalité profonde stable (`memeValeur` : JSON aux clés triées), pas par `===` : `yeastTechnicalFacts` et `yeastFermentationFacts` sont des
   objets relus en copie. Test : objet relu après `structuredClone`.
2. **(b) discriminant** : un cas où la règle de s1 ne relie pas et où la famille a un seul membre sans écart ; le verdict **entier**
   (`connuUnSeulCote` compris) de l'article enrichi est comparé à celui de l'article d'avant f4. Rouge attendu aujourd'hui : `['ebc']` contre `[]`.
   Le cas est cherché par sonde au temps 2 ; s'il n'existe pas, RESULTAT le dit.
3. **Lecteurs ajoutés à § 2.2** : `src/ui/depense/etat.ts:188` (`donneesDArticle(voisin).donnees`, texte de l'écart : filtré par P1, affiche) ;
   `src/services/stockLineMatching.ts:250` (`item.alphaPct`, inoffensif : f4 n'écrit jamais `alphaPct`) ; `src/domain/ingredientFacts.ts:671`
   (`rows[0].technicalSource?.trim()` ouvre le repli par nom de `factsForRecipeStockItem` : un `technicalSource` écrit par f4 **fait servir**
   la valeur d'un malt dans une recette, sous `origin: 'ai'` par P2 ; voulu), donc `src/domain/localStockFacts.ts:16` et
   `src/domain/localIngredientFacts.ts:49,56` (sert) ; `src/ui/RecipeAutoComplete.tsx:602,708,758`, `src/ui/IngredientPicker.tsx:65`,
   `src/ui/YeastIngredientPicker.tsx:15-25,52` (laboratoire et souche dans l'index de recherche : affiche, sert à trouver),
   `src/ui/YeastPitchingPanel.tsx:678`, `src/services/hopV55/futureRecipeDraft.ts:327` (sert, sans marque).
4. **Branchements ancrés par leur texte** : les numéros du § 6 sont ceux de HEAD ; l'arbre courant les a décalés (f3 écrit `purchaseEntry.ts`
   et `ExpenseSheet.tsx`). RESULTAT donne chaque branchement par son **texte d'ancre**, à relire au moment de brancher.
5. **Types** : `valeurLueDe(item: StockItem, champ: keyof StockItem)` ; `ficheRetenueDe(nom: string, categorie: string | undefined, stock: readonly StockItem[])`,
   `undefined` hors Malt, Houblon, Levure ; le code donné au pilote porte ses `import`.
6. **Cas (d)** : « Target bis » nu, avec et sans `fiche { id, approchee: false, par: 'catalogue', cle }` : même verdict (`ficheDeS6` faux).
7. **`ambigu` reste dans le travail** (aucun `fiche` sur l'article). Tout patch `fiche` d'f4 porte `par`, ou n'ajoute que des clés (`cle`,
   `remplis`, `aControler`, `propose`) à un `fiche` s6 existant, sans toucher `id` ni `approchee` ; un test de patch le verrouille.
8. **RESULTAT** : (a) et (c2) rouges avant le branchement, verts après ; (b) et (c) verts avant et après.
9. **À dire à f3** (§ 6) : ne jamais lire `item.colorEbc` (ni `potentialPpg`, `alphaPct`) en direct dans l'écran de la Dépense ; passer par
   `donneesDArticle` ou `valeurLueDe`.
