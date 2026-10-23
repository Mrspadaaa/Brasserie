# Maquette du parcours houblons : architecture et passage dans l'app

Mission `work/missions/2026-10-23-maquette-parcours/` (voie p0-socle, 23.10). Une app React/TS jouable qui
importe composants, jetons et moteur de l'app sans les modifier (`@app/…`, `@functions/…`, `../../src/engine`).
Construire : `node prototypes/houblons-v4/parcours/outils/construire.mjs` ; jouer :
`node prototypes/houblons-v4/parcours/outils/jouer-parcours.mjs --ponts` (depuis la racine du dépôt).

## Fichiers et leur place dans l'app

Les dossiers cibles ci-dessous sont des **propositions** : `src/domain/hops/`, `src/domain/hopTools/`, `src/ui/hops/`,
`src/pages/HopToolsRoute.tsx` et `src/pages/useRecipeDraft.ts` n'existent pas encore. L'app a déjà `src/ui/hopIndex/`
(dont `HopRecipePanel`), `src/ui/hopV55/`, `src/domain/hopIndex/`, `src/domain/hopDecision/` et la route `hopV55`.
Décider d'abord si les outils remplacent l'atelier V5.5 ou s'y ajoutent (relecture p7, B6).

| Fichier (sous `parcours/`) | Place future dans `src/` (proposée) | Note |
|---|---|---|
| `src/main.tsx`, `index.html`, `vite.config.ts` | aucune | propres à la maquette (pages par route, file://) |
| `src/coquille/Coquille.tsx` | `src/pages/HopToolsRoute.tsx` | rendu de la route d'outil au-dessus de `RecipePage` |
| `src/coquille/navigation.tsx`, `routes.ts`, `pages.ts` | `src/pages/useFullScreenRoute.ts` (nouvelles variantes de `Route`) | le hash disparaît |
| `src/coquille/ouvrir.tsx` | `src/pages/RecipePage.tsx` (ouvrir un outil) ; thème et Recommencer : rien | |
| `src/etat/types.ts`, `quand.ts`, `operations.ts`, `reducteur.ts` | `src/domain/hops/recipeHops.ts` | opérations pures sur la recette |
| `src/etat/EtatParcours.tsx` | `src/pages/useRecipeDraft.ts` | brouillon d'outil ; la recette vient du stockage |
| `src/etat/etapes.ts` | aucune | états de départ des pages de la maquette |
| `src/moteur/index.ts`, `mesure.ts` | `src/domain/hopTools/engine.ts` (+ worker, voir plus bas) | le moteur v4 entre dans `src/` |
| `src/donnees/cas.ts` | aucune | la recette, la dégustation et le stock viennent de Dexie |
| `src/commun/Cadres.tsx` | rien : `PageShell` et `Sheet` de l'app, employés tels quels | |
| `src/commun/BarreStyle.tsx`, `JetonHoublon.tsx`, `Pictos.tsx`, `familles.ts`, `Marques.tsx`, `LigneContexte.tsx`, `Legende.tsx`, `Pont.tsx`, `gestes.ts`, `nombres.ts` | `src/ui/hops/` | `familles.ts` : la table #142 entre dans `src/ui/hops/familyTokens.ts` |
| `src/ecrans/<écran>/index.tsx` | `src/ui/hops/<Écran>.tsx` | un écran = un outil |
| `src/ecrans/<écran>/jeu.mjs`, `NOTE.md`, `outils/*.mjs` | `scripts/` (contrôles de parcours) | |

## Types

- La recette : `Recipe` du moteur v4 (`src/engine/recipe.ts`), étendue par `RecetteParcours` et `AjoutParcours`
  (`minutes` d'ébullition par 5′, `jours` de contact ; `day` = jour de début). Dans l'app, il faudra relier ce
  type au type `Recipe` de `src/types/` (houblons, levure, OG, ébullition) : un adaptateur `toHopRecipe(recipe)`
  à créer, avec son inverse. Correction (p7) : l'app a déjà `HopIngredient.timeMin` (minutes libres),
  `aromaTiming` (fermentation ou post-fermentation), `aromaContactHours` (contact) et `dayOffset` (jour de début) ;
  il manque un `id` stable par ajout. L'écriture passe par un patch de `hops` et `yeast` seulement
  (`saveRecipeConfirmed`), jamais par le `Recipe` du moteur. L'α vient de `HopIngredient.alpha` du lot, sinon Ma
  bière et la page recette donneraient deux IBU (B5).
- `Quand` (premier moût, ébullition en minutes, whirlpool, dry hop actif ou après en jours) : à créer dans l'app.
- `Brouillon`, `EtatParcours`, `Action` : à créer (`useRecipeDraft`).
- Rendus du moteur : `BiereLue`, `FamilleLue`, `HoublonLu`, `AjoutLu`, `Candidat`, `Colonne`, `EffetLevure`,
  `Remplacant` (`src/moteur/index.ts`). L'inconnu est `null` avec sa raison, jamais 0.

## Routes

| Hash de la maquette | `useFullScreenRoute` (à ajouter à `Route`) |
|---|---|
| `#/ma-biere` | `{ view: 'recipe', recipeId }` (existe) |
| `#/fiche/<houblon>` | aucune route : `Sheet` posée sur la page ouverte |
| `#/suggerer` | `{ view: 'hopSuggest', recipeId }` |
| `#/comparer?h=a,b,c&pin=x` | `{ view: 'hopCompare', recipeId, hops: string[], pinned?: string }` (`pin` : le houblon de Substituer, en colonne 1) |
| `#/dryhopper/<ajout>` | `{ view: 'hopTiming', recipeId, additionId }` |
| `#/levure/<ajout>` | `{ view: 'hopTiming', recipeId, additionId, step: 'yeast' }` |
| `#/substituer/<houblon>` | `{ view: 'hopSubstitute', recipeId, hopKey }` |

La maquette tient sa propre pile d'historique (`navigation.tsx`) : une entrée par ouverture, le retour du téléphone
et « ‹ » reviennent à l'écran d'avant. **`useFullScreenRoute` de l'app ne le sait pas encore** : tout `popstate` y
repose `tabs` (`useFullScreenRoute.ts:63-70`). Porter les outils demande une pile de routes dans ce crochet (B1).
Page ouverte directement sur une route : « ‹ » va à l'écran parent (`routes.ts`, `parent`).
Sous un outil plein écran, Ma bière n'est pas montée (`Coquille.tsx`) : ses titres, ses mots et ses houblons ne
se lisent pas avec l'outil (contrôles du dépôt, lecteurs d'écran). Elle se remonte au retour, recalculée ; son état
local (lentille) repart du défaut. Dans l'app, `RecipePage` reste montée sous la route, cachée par `inert` et
`aria-hidden` (à vérifier contre les contrôles).

## Moteur en direct

Une fonction par besoin d'écran (`src/moteur/index.ts`), mémoïsée et chronométrée (`mesure.ts`) :
`lireBiere`, `houblon`, `suggerer`, `comparer`, `simulerAjout` et `simulerMoment`, `cransFrise`, `effetLevure`,
`remplacants`, `doseRemplacement`, `ibuAjout`. Unités dans `UNITES`.

- Ma bière part de la bière dégustée le 18.10 (la dégustation prime), décalée par l'effet simulé des ajouts
  nouveaux (`simulerCas`). Un ajout dégusté retiré ou changé retranche sa part simulée, calculée sans dégustation.
- IBU : `BrewingMath.hopIbu` à la minute près (`ibuPerGramAt`) ; à froid : non modélisé (`null`).
- Arôme : le simulateur ne connaît que 60′, 10′, le whirlpool et le dry hop (en jours). Ailleurs, l'écart est
  inconnu (« ? »), et Ma bière liste l'ajout dans `nonSimules`. Un ajout dosé qui ne bouge aucune famille
  (Citra cryo : huiles du cryo non relevées) rend aussi un écart inconnu, raison « aucune donnée d'huile ».
- Temps mesurés dans Chrome (23.10, `jouer-parcours.mjs --ponts`, 19 gestes) : un recalcul de Ma bière
  (`lireBiere`, cache manqué) prend 1,1 ms en médiane (48 recalculs). Un geste qui recalcule prend 3,7 ms en
  médiane et 24 ms au plus (Suggérer : 9 candidats simulés d'un coup). Concorde avec [[cout-calcul-moteur]].
- Hors du fil principal, plus tard : `suggerer` sur le catalogue entier (318 variétés : 0,4 s estimées, soit 318 × 1,2 ms, non mesurées) et la frise
  complète de Dryhopper précalculée (28 crans). Les deux iront dans un Web Worker. Le reste tient sur le fil principal.

## Ce qui manque

- Persistance : la maquette garde l'état en mémoire (« Recommencer » le remet à zéro). Dans l'app, la recette
  s'écrit dans Dexie, comme les recettes actuelles, puis se synchronise vers Firestore. Le brouillon reste en
  mémoire ; « Ajouter à ma bière » et « Remplacer » écrivent.
- Catalogue de production : la maquette emploie `STOCK` et `CATALOGUE` du moteur v4 (`data/proto-data.json`,
  fixture). Le catalogue de production à 12 variétés (#120) et le vrai stock (Dexie) restent à brancher.
- Données réelles : dégustation, α des lots et stock libre sont ceux de la fixture. Aucune donnée réelle n'est lue.
- Jetons de couleur des familles : la table vit encore dans `work/` (`jetons-familles.json`, #142), avec des
  contrastes calculés pour le thème clair seulement.

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
- **Bases :**
  - Ma bière : l8 et l5b ;
  - Fiche : g1 ;
  - Suggérer : q2b (base v4.10) ;
  - Comparer : r6a ;
  - Dryhopper : a1 ;
  - Levure : l'étape de Dryhopper ;
  - Substituer : la porte.
- **`jeu.mjs` :** `export default { page: 'etat.html', gestes: [...] }`. Un geste prend ces champs :
  - `nom` ;
  - `faire` : `toucher`, `appui-long`, `glisser`, `maintenir`, `retour` (retour du téléphone), `fermer` (« ‹ ») ou
    `attendre` ;
  - `cible` : un sélecteur CSS ; le dernier élément visible hors `[inert]` est pris ;
  - `de` et `a` : des fractions de la largeur de la cible ;
  - `pas` ;
  - `attendre` : un sélecteur qui doit apparaître ;
  - `verifier(p)`, et `mesurer(p)` pour `maintenir`. Ces deux fonctions se jouent dans la page, avec
    `p = window.__parcours`, et rendent `true` ou un message. Elles sont sérialisées : aucune variable du module.
- **Doigt maintenu (`maintenir`) :** le doigt se pose, se déplace en `pas` étapes, puis `mesurer` lit les positions
  rendues (loupe : écart sous le doigt contre écart au loin, ≥ ×3, L12), puis le doigt se relâche.
- **`window.__parcours` :**
  - `etat`, `route`, `biere()`, `brouillonLu()` ;
  - `moteur` : l'adaptateur entier, pour comparer `data-crans` au moteur à 0,6 cran près (D80) ;
  - `regles` : `cransOf`, `getStyleScale`, `hopRole` (pour `data-usage`, D90), `hopAlpha` ;
  - `mesures`, `medianeRecalcul`.
- **Construire et jouer sans écraser les autres voies :**
  - `construire.mjs --sortie=prototypes/houblons-v4/maquettes/parcours-<écran>` ; seule la sortie par défaut est
    vidée ;
  - `jouer-parcours.mjs --dossier=… --etape=<écran>`. L'option se répète (`--etape=a --etape=b`) et affiche
    `ETAPE OK (<dernière>)` ;
  - la sortie garde `<dossier>/<route>/etat.html` : les contrôles du dépôt s'appellent
    `<dossier> <id> --page=etat.html` ;
  - `src/ecrans/<route>/NOTE.md` est copiée vers `<dossier>/<route>/NOTE.md` (lue par `controle-reprise`, par
    exemple) ; la tenir à jour, avec sa section `## Base`.
- **Ajouts du 23.10 au soir (D105) :** route `biere` (l'onglet Ma bière de la base v4.10), composant `Onglets`
  (« Ma bière · Suggestions · Comparer »), liste de comparaison (`useComparaison`, `basculerComparaison`,
  `fixerComparaison`), fonction `proposer(recette, direction)` de l'adaptateur (voies du moteur, pour Suggérer).
- **Elle ne touche pas :**
  - `src/commun`, `src/etat`, `src/moteur`, `src/coquille` et `outils/` (une demande passe par le pilote) ;
  - le moteur et l'app (`app-intacte.mjs`) ;
  - les noms des ponts.
- **Règles :**
  - pas de `type="number"` ;
  - préfixer ses classes propres (`pq-<écran>-…`, L26) ;
  - aucun `String.replace` avec `$` ;
  - le simulé se marque par `Simule` (« ~ »), l'inconnu par `Inconnu` ou une piste hachurée.

## Vérifié contre l'app (relecture p7, 23.10)

Verdict : **prêt avec réserves**. Détail, fichiers et lignes : `work/missions/2026-10-23-maquette-parcours/voies/p7-implementation/RESULTAT.md`.
- **Se porte bien** : l'état et ses opérations pures, les communs, les écrans (classes préfixées), l'adaptateur.
- **Quatre chantiers transversaux**, avant les écrans :
  1. **Décisions** (B6, B7) : les outils remplacent-ils l'atelier V5.5 ? Le thème clair entre-t-il dans l'app ?
  2. **Moteur portable** :
     - `process.env.V4_TEMOIN_NEGATIF` à retirer (B3) ;
     - alias `@app` et `@functions`, ou imports relatifs (B4) ;
     - JSON chargés en paresseux (B9) ;
     - `work/…` copié sous `src/` avec sa source (B8).
  3. **Conversion de recette** `toHopRecipe` et son inverse, en tests Vitest (B5).
  4. **Navigation en pile** dans `useFullScreenRoute` (B1).
  Puis : moteur nourri par les données réelles (catalogue, stock, dégustation), aujourd'hui en singletons de fixture
  (B2). Enfin les écrans, un par un, derrière un drapeau.
- **Maquette seulement** : à ne pas porter, ou à isoler derrière `import.meta.env.DEV` :
  - `window.__parcours` ;
  - les marqueurs `data-*` des contrôles ;
  - les ponts provisoires de la fiche ;
  - la coquille de démonstration (thème, Recommencer, pages par route).
- **Performance** : un geste, de 1 à 6 ms, reste sur le fil principal. Passent dans un worker : Suggérer
  (`proposer` : 128 ms à froid sur PC), la frise de Dryhopper et le chargement des JSON. Précédent :
  `src/ui/hopIndex/hopSolver.worker.ts`.
