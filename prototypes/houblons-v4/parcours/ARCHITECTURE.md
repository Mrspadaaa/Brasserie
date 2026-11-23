# Maquette du parcours houblons : architecture et passage dans l'app

Mission `work/missions/2026-10-23-maquette-parcours/` (voie p0-socle, puis p8-portabilite, 23.10). Une app React/TS
jouable qui importe composants, jetons et moteur de l'app sans les modifier. Construire :
`node prototypes/houblons-v4/parcours/outils/construire.mjs` ; jouer :
`node prototypes/houblons-v4/parcours/outils/jouer-parcours.mjs --ponts` (depuis la racine du dépôt).

Depuis la voie p8, la maquette se déplace dans l'app sans réécriture : le moteur n'a plus d'alias ni de
`process.env`, aucune donnée ne vient de `work/`, les données du brasseur s'injectent, la recette de l'app se
convertit (et revient par un patch), la navigation est une pile sur l'API de `useFullScreenRoute`, et le crochet de
test tient dans un module. Contrôle : `outils/portabilite.mjs --process|--alias|--work`.

## Fichiers et leur place dans l'app

Dossiers vérifiés contre l'app le 23.10 (`ls src/ui/hopIndex src/domain/hopIndex src/pages`). Les outils houblons
de l'app vivent déjà dans `src/ui/hopIndex/` (27 fichiers, dont `HopRecipePanel.tsx`, rendu par `RecipePage.tsx`, et
`hopSolver.worker.ts`) et `src/domain/hopIndex/` (`engine.ts`, `recipeBindings.ts`, `solver.ts`…). La maquette y
entre, sans dossier neuf, sauf le moteur v4 (`src/domain/hopIndex/v4/`, un dossier neuf : 22 fichiers qui ne se
mêlent pas au moteur V5.5 qu'ils importent).

| Fichier (sous `parcours/`) | Place dans l'app | Vérifié | Note |
|---|---|---|---|
| `src/main.tsx`, `index.html`, `vite.config.ts`, `coquille/pages.ts` | aucune | oui | propres à la maquette (pages par route, file://) |
| `src/coquille/useFullScreenRoute.ts` | remplace `src/pages/useFullScreenRoute.ts` | oui | même API (`route`, `open`, `close`) + `pile`, `closeTo`, `replaceTop` ; voir « ## Navigation » |
| `src/coquille/navigation.tsx`, `routes.ts` | aucune (le hash reste dans la maquette) ; `routes.ts` → les variantes du type `Route` de l'app | oui | |
| `src/coquille/Coquille.tsx` | le `switch` des vues dans `src/App.tsx` (où `route.view === 'recipe'` est rendu) | non (App.tsx lu par recherche) | une vue par outil |
| `src/coquille/ouvrir.tsx` | `useOuvrir` → `src/ui/hopIndex/useHopTool.ts` ; thème et Recommencer : rien | oui | |
| `src/etat/types.ts`, `quand.ts`, `operations.ts`, `reducteur.ts` | `src/domain/hopIndex/recipeHops.ts` (à côté de `recipeBindings.ts`) | oui | opérations pures sur la recette du moteur |
| `src/etat/EtatParcours.tsx` | `src/ui/hopIndex/useHopDraft.ts` | oui | brouillon d'outil en mémoire ; la recette vient de `StorageService` |
| `src/etat/etapes.ts` | aucune, sauf `brouillonPour` et `ajoutPlace` (dans `useHopDraft`) | oui | états de départ des pages de la maquette |
| `src/moteur/index.ts`, `mesure.ts`, `donnees.ts`, `prechauffage.ts` | `src/domain/hopIndex/v4/adapter.ts` (+ `src/ui/hopIndex/hopTools.worker.ts`) | oui | l'adaptateur et ses données injectées |
| ~~`prototypes/houblons-v4/src/engine/`, `src/style/`~~ **fait (T4, #163, 25.10)** : `src/domain/hopIndex/v4/` (22 fichiers du moteur) et `src/domain/hopIndex/v4/style/` (`scale.ts`, `verdict.ts`), déplacés par `git mv` | oui | imports relatifs (`../../../../src/…` est devenu `../…` et `../../../…`) ; une seule copie ; `src/pack/buildPack.ts` reste au prototype (il bâtit le pack des mini-prototypes et les cas S1/S2 de la maquette) |
| `src/integration/conversion.ts` | `src/domain/hopIndex/v4/recipeConversion.ts` | oui | voir « ## Conversion de recette » |
| `src/integration/crochetTest.ts` | `src/ui/hopIndex/devHook.ts`, derrière `import.meta.env.DEV` | oui | voir « ## Crochet de test » |
| `src/donnees/cas.ts` | aucune | oui | la recette, la dégustation et le stock viennent de l'app ; `CONDITIONS`, `VISEE`, `LEVURES` restent comme règles |
| `src/commun/Cadres.tsx` | rien : `PageShell` et `Sheet` de l'app, employés tels quels | oui | |
| ~~`src/commun/*` (BarreStyle, JetonHoublon, Pictos, familles, Marques, LigneContexte, Legende, Pont, gestes, nombres)~~ **fait (T11, #168, 25.10)** : `src/ui/hopIndex/` (`familles.ts` → `familyTokens.ts`), déplacés par `git mv` | oui | une seule copie ; `commun/index.ts` de la maquette les réexporte depuis `@app/ui/hopIndex/…`. `BarreStyle` et `JetonHoublon` lisent `FamilleAffichee` et `HoublonAffiche` (`lecturesAffichees.ts`, champs affichés seulement : `FamilleLue` et `HoublonLu` y entrent par typage structurel) ; `.pq-hachure` vit dans `communs.css`. **Restent dans la maquette** (ils importent `coquille/` ou `etat/`) : `Onglets.tsx` (`useNavigation`, `useComparaison`), `PiedAnnuler.tsx` (`useNavigation`, `useGestes`), `Cadres.tsx`, et `retour.css`, `feuille.css`, `pied-annuler.css`. Test : `tests/unit/hopIndexV4/communsHopIndex.test.tsx`. |
| ~~`prototypes/houblons-v4/data/`~~ **fait (T4, #163)** : `src/data/hopV4/` (`proto-data`, `composes-houblon`, `style-bands`, `correspondance-familles`, `faits-cites` : moteur ; `jetons-familles`, `pictos-familles.svg`, `comparatifs-dryhop` : écrans) | oui | copies de `work/` par `src/data/hopV4/copies-de-work.mjs`, avec leur source ; `pack-fiches.json` et `pack-mini-protos.json` restent au prototype (sorties générées, lues par les contrôles de `work/`) |
| `src/ecrans/<écran>/index.tsx` | `src/ui/hopIndex/<Écran>.tsx` | oui | un écran = un outil |
| `src/ecrans/<écran>/jeu.mjs`, `NOTE.md`, `outils/*.mjs` | `scripts/` (contrôles de parcours, mode `--url`) | non | |

## Types

- La recette des outils : `Recipe` du moteur v4, étendue par `RecetteParcours` et `AjoutParcours` (`minutes`
  d'ébullition par 5′ ou de whirlpool, `jours` de contact, `day` = jour de début, `alphaLot` = α du lot de la
  recette, `tempC` de whirlpool, `momentInconnu`) ; `ibuInconnu` au niveau de la recette (DI inconnue). Elle se
  fabrique depuis le `Recipe` de l'app par `toHopRecipe` et y retourne par un patch (« ## Conversion de recette »).
- `Quand` (premier moût, ébullition en minutes, whirlpool, dry hop actif ou après en jours) : à créer dans l'app.
- `Brouillon`, `EtatParcours`, `Action` : à créer (`useHopDraft`).
- Rendus du moteur : `BiereLue`, `FamilleLue`, `HoublonLu`, `AjoutLu`, `Candidat`, `Colonne`, `EffetLevure`,
  `Remplacant` (`src/moteur/index.ts`). L'inconnu est `null` avec sa raison, jamais 0.

## Navigation

L'app : `useFullScreenRoute` (`src/pages/useFullScreenRoute.ts`) pousse une entrée par ouverture, mais tout
`popstate` repose `tabs` (lignes 63-70). Un outil à quatre niveaux y fermerait la recette au premier retour (B1).

La maquette emploie `src/coquille/useFullScreenRoute.ts` : **la même API, une pile au lieu de `tabs`**.
- `open(route)` pousse une entrée `{ laffinee-page, affinee-parcours: profondeur, laffinee-route: route }` ;
- `close()` (« ‹ ») : `history.back()` si l'entrée a été poussée, sinon la route parente (page ouverte directement) ;
- `popstate` dépile **un** niveau : la pile garde les étages jusqu'à la profondeur de l'entrée retrouvée ; une entrée
  sans route (la fiche posée sur Dryhopper) garde la pile ; une route inconnue de la pile (avance) s'y pose ;
- `closeTo(est, repli)` revient à la plus haute route qui répond à `est` (« Ajouter à ma bière », « Remplacer » →
  Ma bière ; dans l'app → `view === 'recipe'`) en un `history.go(-n)` ;
- `replaceTop(route)` change l'écran du sommet sans toucher à l'historique.

Au portage, ce fichier remplace celui de l'app, avec `depart: { view: 'tabs' }` et le type `Route` de l'app étendu
(le retour `hopV55` devient un cas de la pile). Les écrans ne changent pas : ils emploient `useNavigation()`
(`aller` = `open`, `retour` = `close`, `revenirMaBiere` = `closeTo`). Le hash (`#/comparer?h=…`) reste **à part**, dans
`navigation.tsx` (option `adresse` et écouteur `hashchange`), pour les pages construites et les contrôles.

| Hash de la maquette | Route de l'app (à ajouter à `Route`) |
|---|---|
| `#/ma-biere` | `{ view: 'recipe', recipeId }` (existe) |
| `#/biere` | `{ view: 'hopBeer', recipeId }` |
| `#/fiche/<houblon>` | aucune route : `Sheet` posée sur la page ouverte (une entrée d'historique) |
| `#/suggerer` | `{ view: 'hopSuggest', recipeId }` |
| `#/comparer?h=a,b,c&pin=x` | `{ view: 'hopCompare', recipeId, hops: string[], pinned?: string }` |
| `#/dryhopper/<ajout>` | `{ view: 'hopTiming', recipeId, additionId }` |
| `#/levure/<ajout>` | `{ view: 'hopTiming', recipeId, additionId, step: 'yeast' }` |
| `#/substituer/<houblon>` | `{ view: 'hopSubstitute', recipeId, hopKey }` |

Sous un outil plein écran, Ma bière n'est pas montée (`Coquille.tsx`). Dans l'app, `RecipePage` reste montée sous
la route, cachée par `inert` et `aria-hidden` (à rejouer contre les contrôles : B10).

## Moteur en direct

Une fonction par besoin d'écran (`src/moteur/index.ts`), mémoïsée et chronométrée (`mesure.ts`) :
`lireBiere`, `houblon`, `proposer`, `suggerer`, `comparer`, `simulerAjout` et `simulerMoment`, `cransFrise`,
`effetLevure`, `remplacants`, `doseRemplacement`, `ibuAjout`. Unités dans `UNITES`.

- Ma bière part de la bière dégustée (la dégustation prime), décalée par l'effet simulé des ajouts nouveaux. Sans
  dégustation injectée, tout le profil est simulé (« ~ ») sur une base sans houblon.
- IBU : `BrewingMath.hopIbu` de l'app, à la minute près ; α du lot de la recette (`alphaLot`), sinon du stock, sinon
  la plage variétale ; whirlpool à la durée et la température de la recette (sinon 20 min, 80 °C) ; à froid : `null`.
- Arôme : le simulateur ne connaît que 60′, 10′, le whirlpool et le dry hop (en jours). Ailleurs, l'écart est
  inconnu (« ? ») et l'ajout est listé dans `nonSimules` ; de même un houblon absent des fiches du moteur.

## Données injectées

L'adaptateur lit `donnees()` (`src/moteur/donnees.ts`) ; `configurerDonnees({...})` les remplace et vide ses caches.
Par défaut : les fixtures actuelles (la maquette calcule les mêmes nombres).

| Donnée | Défaut (maquette) | Dans l'app |
|---|---|---|
| `catalogue` | `CATALOGUE` du moteur : 318 variétés Beer Maverick | le catalogue de production (#120) : filtre de Suggérer et de Substituer |
| `stock` | `STOCK` du moteur (fixture houblons-2026-10-17) | `StockItem` « Houblon » reliés à une variété (variété, grammes libres, α du lot, cryo) |
| `degustation` | S1 du 18.10 et la recette dégustée | la dégustation du brasseur sur le brassin de la recette ; `null` sans dégustation |
| `alphaDuLot(ajout)` | `ajout.alphaLot` | idem : `HopIngredient.alpha` posé par `toHopRecipe` |

**Reste en singleton dans le moteur v4** (`src/domain/hopIndex/v4/data.ts`) : `CATALOGUE`, `STOCK`, `ENGINE_DATA`, `hopRef` et
les caches qui en dérivent (`profil-simule.ts` `cacheBase`, `substitution.ts` `featureCache` et `roleCache`,
`voies.ts` `apportCache`, `hops.ts` cache d'extrapolation, `recipe.ts` `predictTriplet`). Ils portent la connaissance
des variétés (fiches, huiles, descripteurs) et le stock que `substitutes` et `proposeVoies` classent « en stock
d'abord ». Chemin pour l'enlever : (1) un type `DonneesMoteur { catalogue, stock, connaissance }` et une fabrique
`creerMoteur(donnees)` qui construit `ENGINE_DATA`, les index et les caches dans une fermeture ; (2) les ~90 sites
d'appel lisent le contexte au lieu des constantes (data.ts 7, voies.ts 41, cases.ts 21, six autres fichiers 7 à 8) ;
(3) l'adaptateur garde une instance par jeu de données ; (4) les tests du moteur tournent sur la fixture ET sur une
forme injectée. Tant que ce n'est pas fait, la maquette et l'app n'emploient qu'un jeu de données à la fois.

## Conversion de recette

`src/integration/conversion.ts`, écrit contre le `Recipe` de `src/types/index.ts` (import de type seulement) ; tests
sur des recettes de fixture de l'app : `prototypes/houblons-v4/tests/conversion-recette.test.ts` (13 tests).

- `toHopRecipe(recette, { boilOg })` → `{ recette, origine, ajouts, suppositions }`.
  - id stable : `a1`, `a2`… = position dans `recipe.hops` (l'app n'a pas d'id ; la maquette appelle Nugget `a1`) ;
  - houblon : `hopVarietyId` s'il est connu du moteur, sinon le nom ou un alias exact (plié), jamais un nom
    partiel ; sinon `inconnu:<nom>` (arôme non simulé, IBU calculé par l'α du lot) ;
  - moment : `firstWort` → `fwh` ; `boil` + `timeMin` → `minutes` (exactes, pas arrondies) ; `whirlpool` → `wp` +
    `minutes`, `tempC` ; `dryHop` + `aromaTiming` (`fermentation` → actif, `postFermentation` → après) +
    `aromaContactHours / 24` → `jours`, `dayOffset` → `day` ;
  - α du lot : `HopIngredient.alpha` dans ]0 ; 100], sinon `null` (inconnu, jamais 0) ;
  - comme `hotBitterness` : durée d'ébullition ou de whirlpool, température de whirlpool absentes →
    `momentInconnu` (IBU inconnu) ; DI d'ébullition inconnue → `ibuInconnu` ;
  - `boilOg` : la DI d'ébullition de la page recette (`yeastRecipeBoilOg`, la DI moins les apports en fermentation) ;
    absente → `ogTarget`, avec une supposition écrite s'il y a des apports tardifs ;
  - style : `styleRef.styleId`, sinon le nom exact d'un style BJCP du moteur, sinon aucun (échelle absolue, dit) ;
    levure : `yeast.hopIndexId`, sinon US-05 supposée pour l'arôme (dit).
- `versPatch(conversion, recette du moteur)` → `{ patch: { hops, yeast? }, notes }`. Jamais le `Recipe` du moteur :
  un ajout inchangé revient tel quel (même objet) ; une dose changée ne touche que `weightG` ; un moment changé
  réécrit `stage`, `timeMin`, `tempC`, `aromaTiming`, `aromaContactHours`, `dayOffset` (les champs de l'ancien stade
  sont retirés) ; un houblon remplacé perd `stockItemRef`, `hopLotId` et l'α de l'ancien lot (α du nouveau lot au
  stock, sinon 0 = convention « inconnu » de l'app, écrit dans `notes`) ; une levure changée donne
  `{ name, hopIndexId }`. Dans l'app : `saveRecipeConfirmed({ ...recette, ...patch })` (précédent :
  `patchIndexedHop` de `recipeBindings.ts`).
- IBU : avec la même DI d'ébullition, le moteur rend l'IBU de `hotBitterness` à 1e-9 près, ajout par ajout, sur les
  quatre recettes de fixture. Sans elle, une session NEIPA avec 1,5 kg de mangue en fermentation : 15,86 (DI 1,034)
  contre 16,59 (DI d'ébullition 1,029), −0,73 IBU : la DI plus haute isomérise moins (Tinseth).

## Crochet de test

`window.__parcours` est posé par un seul module, `src/integration/crochetTest.ts` (`useCrochetTest(etat, dispatch)`,
appelé par `EtatParcoursProvider`). Dans la maquette il est toujours posé (constante `MAQUETTE`) ; dans l'app il ne
l'est que derrière `import.meta.env.DEV` (serveur Vite, `?dev-local`) : la construction de production le retire.

Forme (`VueParcours`) :
- `etat` : l'état entier (recette, brouillon, visée, comparaison, `gestes`) ;
- `route` : la route lue dans l'adresse (maquette : le hash) ;
- `biere()`, `brouillonLu()` : Ma bière et le brouillon lus par le moteur ;
- `mesures()`, `medianeRecalcul(nom?)`, `viderMesures()` : journal des appels au moteur (`cache` : servi ou non ;
  le préchauffage est noté `prechauffage:<nom>`) ;
- `envoyer(action)` : les actions de l'état, pour poser un état sans passer par un autre écran ;
- `moteur` : l'adaptateur entier ; `regles` : `cransOf`, `getStyleScale`, `hopRole`, `hopAlpha` (D80, D90, D87).

Lu par `outils/jouer-parcours.mjs`, `outils/parcours-complet.mjs`, les `jeu.mjs` (`verifier(p)`, `mesurer(p)`) et
`ecrans/suggerer/outils/instantane.mjs`. Les marqueurs `data-*` des écrans restent (`data-ecran`, `data-role` des
ponts, `data-houblon`, `data-element`, `data-acquis`…) : les contrôles du brasseur (`controle-choix`, `controle-rail`,
`controle-usage-intensite`, les `jeu.mjs`) vérifient ses choix dans l'app aussi (règle n° 1). La supervision en fera
un mode `--url` des contrôles (une adresse du serveur Vite par état de départ, au lieu de `<route>/etat.html`).

## Performance

Mesuré par `work/refonte-frontend/v4/tournoi/outils/mesure-performance.mjs … ma-biere --cpu=4` (×4, PC rapide) :
- **avant p8** : toucher froid Ma bière → Suggérer 798 ms (moteur 497), → Substituer 728 ms (moteur 546) ;
- **après p8** : → Suggérer 288 ms (moteur 0), → Substituer 184 ms (moteur 13). Les touchers chauds (93 à 118 ms)
  sont le rendu de l'écran, hors moteur.

Fait : (1) préchauffage au repos (`src/moteur/prechauffage.ts`, appelé par `Coquille.tsx` sur Ma bière) : les voies
de Suggérer et les remplaçants de chaque ajout, une tâche par `requestIdleCallback`, mêmes appels que les écrans ;
(2) formateurs de nombres mis en cache (`Intl.NumberFormat`, même texte) dans `src/domain/hopIndex/v4/pouvoir.ts` et
`nombres.ts` (aujourd'hui `src/ui/hopIndex/nombres.ts`, T11). Pas fait ici (fichiers d'écran ou configuration hors de la voie) : les formateurs de
`dryhopper/mesures.ts` et `comparer/valeurs.ts`, le rendu des écrans d'arrivée, le découpage du paquet.

**Ce qui part en worker dans l'app** (précédent : `src/ui/hopIndex/hopSolver.worker.ts`, `hopSolverMessages.ts`,
`hopSolverTransport.ts`) : `proposer` et `suggerer` (Suggérer ; sur le catalogue entier, ≈ 2,5 s à ×4 extrapolés par
t2), `remplacants` (Substituer), le premier calcul des descripteurs par variété, et le chargement des JSON du moteur
(`proto-data` 434 Ko, `style-bands` 71 Ko, `composes-houblon` 80 Ko) en import dynamique. La file de
`prechauffage.ts` devient des messages au worker. Reste sur le fil principal : un geste = un `lireBiere` (1 à 8 ms
à ×4) et la frise de Dryhopper (t2 : son coût est le rendu, pas le calcul).

## Ordre d'intégration

Chaque chantier se finit branché, typé, testé, joué dans Chrome, avant le suivant.
1. **Décisions au brasseur** (avant le code) : le thème (B7 : le clair des maquettes pour toute l'app, #144, ou la
   cave) ; l'atelier V5.5 (`src/ui/hopV55/`, route `hopV55`) et le panneau « Potentiel aromatique » **remplacés** ou
   **gardés** à côté des outils (B6) ; Dryhopper (a1, b4, d8, e5, g1), Substituer (porte ou outil u4) et Levure
   (étape ou outil a2b) sont encore ouverts : un écran choisi plus tard remplace le sien, le socle ne bouge pas.
2. **Moteur** (FAIT par T4, #163, le 25.10 : `src/domain/hopIndex/v4/`, `src/data/hopV4/`, une seule copie ; les tests restent dans `prototypes/houblons-v4/tests`, déjà dans le Vitest de la racine) : `src/engine` et `src/style` → `src/domain/hopIndex/v4/` (imports relatifs déjà faits, `temoin.ts`
   compris) ; les tests du prototype dans `tests/unit/hopIndexV4/` (le Vitest de la racine n'inclut que `tests/unit`,
   `tests/integration`, `tests/fuzz`) ; `data/*.json` → `src/data/`.
3. **Conversion** : `recipeConversion.ts` et ses tests ; une lecture `useHopRecipe(recipeId)` (StorageService →
   `toHopRecipe`, DI d'ébullition de RecipePage) ; l'écriture par `saveRecipeConfirmed` avec un état « en attente » et
   l'erreur d'écriture à l'écran.
4. **Navigation** : `useFullScreenRoute.ts` remplacé par la pile ; rejouer les retours existants (recette, brassage,
   assistant, `hopV55`) avant toute route d'outil.
5. **Données** : `configurerDonnees` au démarrage des outils (stock réel, catalogue #120, dégustation) ; puis le
   moteur sans singleton (« ## Données injectées »).
6. **Écrans** un par un derrière un drapeau : Ma bière (remplace la section Houblons de `RecipePage.tsx`), fiche,
   Suggérer, Comparer, puis Dryhopper, Levure et Substituer selon ses choix ; worker et chargement paresseux avec
   Suggérer ; le crochet de test derrière `import.meta.env.DEV` et les contrôles en `--url`.

## Ce qui manque

- Persistance : la maquette garde l'état en mémoire (« Recommencer »). Dans l'app, la recette s'écrit dans Dexie
  puis Firestore par `saveRecipeConfirmed` ; le brouillon reste en mémoire (perdu au rechargement : à dire).
- Données réelles : aucune n'est lue par la maquette ; elles entrent par `configurerDonnees` et `toHopRecipe`.
- Jetons de couleur des familles : contrastes calculés pour le thème clair seulement (#142).

## Contrat d'un écran

Une voie d'écran possède `src/ecrans/<écran>/**` et rien d'autre.

- **Elle reçoit :**
  - les crochets de `src/etat/EtatParcours.tsx` : `useRecette`, `useBrouillon`, `useRecetteDeTravail`,
    `useBiere`, `useGestes` (`ajouter`, `moment`, `dose`, `retirer`, `remplacer`, `levure`, `inscrire`,
    `abandonner`) ;
  - `useNavigation` (`aller`, `retour`, `revenirMaBiere`) et `useOuvrir` (ouvrir une route avec son brouillon) ;
  - l'adaptateur `src/moteur` ;
  - les composants de `src/commun` (index), dont `SegmentedControl` et `RecipeDisclosure` de l'app.
- **Racine :** `data-ecran="<écran>"`. Ponts : `data-role="pont-<nom>"`, à garder pour `--ponts` :
  `pont-floral`, `pont-comparer`, `pont-placer`, `pont-levure`, `pont-ajouter`, `pont-substituer` (avec
  `data-houblon`), `pont-remplacer`. Aussi : `ouvrir-fiche` (`data-houblon`), `frise` (glisser horizontal),
  `levures` (choix au rôle `radio`, ou `[data-levure]`), `ibu` (`data-valeur`) dans Ma bière.
- **Bases :** Ma bière : l8 et l5b, étape Houblons et onglet de la base v4.10 (D105) ; Fiche : g1 ; Suggérer : q2b ;
  Comparer : r6a ; Dryhopper : a1 ; Levure : l'étape de Dryhopper ; Substituer : la porte.
- **`jeu.mjs` :** `export default { page: 'etat.html', gestes: [...] }`. Un geste prend `nom` ; `faire` (`toucher`,
  `appui-long`, `glisser`, `maintenir`, `retour`, `fermer`, `attendre`) ; `cible` (sélecteur CSS ; le dernier élément
  visible hors `[inert]`) ; `de` et `a` (fractions de la largeur) ; `pas` ; `attendre` (sélecteur) ; `verifier(p)` et
  `mesurer(p)`, joués dans la page avec `p = window.__parcours` (« ## Crochet de test »), sans variable du module.
- **Doigt maintenu (`maintenir`) :** le doigt se pose, se déplace en `pas` étapes, puis `mesurer` lit les positions
  rendues (loupe : écart sous le doigt contre écart au loin, ≥ ×3, L12), puis le doigt se relâche.
- **Construire et jouer sans écraser les autres voies :** `construire.mjs --sortie=prototypes/houblons-v4/maquettes/parcours-<écran>`
  (seule la sortie par défaut est vidée) ; `jouer-parcours.mjs --dossier=… --etape=<écran>` (répétable) ; la sortie
  garde `<dossier>/<route>/etat.html` ; `src/ecrans/<route>/NOTE.md` est copiée vers `<dossier>/<route>/NOTE.md`.
- **Elle ne touche pas :** `src/commun`, `src/etat`, `src/moteur`, `src/coquille`, `src/integration` et `outils/`
  (une demande passe par le pilote) ; le moteur et l'app (`app-intacte.mjs`) ; les noms des ponts.
- **Règles :** pas de `type="number"` ; classes préfixées (`pq-<écran>-…`, L26) ; aucun `String.replace` avec `$` ;
  le simulé se marque par `Simule` (« ~ »), l'inconnu par `Inconnu` ou une piste hachurée ; aucune donnée lue dans
  `work/` (`portabilite.mjs --work`).

## Vérifié contre l'app (relecture p7, puis voie p8, 23.10)

Relecture p7 : **prêt avec réserves** (`work/missions/2026-10-23-maquette-parcours/voies/p7-implementation/RESULTAT.md`).
La voie p8 a levé dans la maquette B1 (pile), B2 (à l'entrée de l'adaptateur), B3, B4, B5 et B8 ; restent B6 et B7
(décisions), B9 (paquet, en partie : préchauffage), B10 (`inert` dans l'app), B11 (choix ouverts) et le moteur sans
singleton. Détail : `work/missions/2026-10-23-maquette-parcours/voies/p8-portabilite/RESULTAT.md`.
