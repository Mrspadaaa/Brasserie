F4B-MALTS OK — schéma et consigne propres aux malts et sucres : cinq nombres exigés et nullables, plus aucun champ de levure ni de houblon.

(Un seul écart : `tests/unit/d100AiTaskOutput.test.ts`, hors de mon périmètre, devient rouge par construction ; voir « DÉCISION À PRENDRE ».)

## Fichiers écrits
- `functions/src/prompts.ts` : `MALT_SORTIE` (consigne entière du malt), `MALT_SCHEMA_ORDRE`, `MALT_NOMBRES`, `maltLookupDefinition`. `ingredientLookupDefinition` n'est pas touchée (la branche `kind === 'malt'` y existait).
- `src/domain/ingredientFacts.ts` : les cinq champs typés `number | null` (commentaire D303) ; un commentaire dans la boucle des bornes de `sanitizeFacts`. Aucune logique changée : `null` n'est pas un nombre, il tombait déjà dans la boucle et se lit absent.
- `src/services/enrichissementCatalogues.ts` : un commentaire (D303) dans `valeursDeReponse`. Aucune logique : `deduireValeursMalt` lit via `nombreEntre`, donc `null` = absent.
- `scripts/check-invoice-journey-emulator.mjs` : `enrichirAnswer`, la réponse de l'ambre : `colorEbc: null, colorEbcMin: 55, colorEbcMax: 65, extractPct: 80, potentialPpg: null` (+ `usage` sans chiffre). Rien d'autre.
- `tests/unit/depense/enrichir/malts.test.ts` : bloc « la consigne et le schéma » réécrit (5 tests), bloc « D303 : null se lit comme absent » (5 tests), import de l'encodeur Gemini.

## Le schéma malt final
Clés, dans l'ordre (`propertyOrdering` identique) :
`found, name, source, sourceUrl, colorEbc, colorEbcMin, colorEbcMax, extractPct, potentialPpg, retrievedAt, note, grainType, diastaticPower, usage, substitutes`.
`required` : `found, name, source, colorEbc, colorEbcMin, colorEbcMax, extractPct, potentialPpg`.
Les cinq nombres : `NUMBER`, `nullable: true`, bornés (EBC 0–5000, extrait 0–100, PPG 1–50), chacun avec une `description` courte qui dit « null si non publié » (`colorEbc` : point unique ; `potentialPpg` : « ne pas le calculer »). `usage` : description « sans aucun nombre ». Les autres champs (`found`, `name`, `source`, `sourceUrl`, `retrievedAt`, `note`, `grainType`, `diastaticPower`, `substitutes`) sont ceux de la base, repris tels quels.
Retirés pour un malt : `lab, strain, form, attenuationPct, tempMinC, tempMaxC, flocculation, alcoholTolerancePct, technicalFacts, fermentation, alphaPct, betaPct, aroma`.

## La consigne malt (en une phrase pour la règle)
La consigne du malt n'est plus « base + paragraphe » : la base mêlait NOLO, levures et « un champ non trouvé doit rester ABSENT », qui contredisait des champs exigés (et qui a sans doute fait rendre `tempMinC` −5 / `tempMaxC` 60). Elle est : `BRASSERIE` + intro malt/sucre + conversion °L → EBC + SORTIE MALT ET SUCRE (« cinq champs numériques, toujours présents : … Ce que la fiche ne publie pas vaut null, jamais 0, jamais une moyenne, jamais une valeur supposée ») + RÈGLE ABSOLUE (source obligatoire, `found: false` avec cinq `null`, nom générique : demander le fabricant) + « aucun nombre dans usage ni note, rien sur la brasserie, la TVA ni la monnaie ». Levures et houblons : `TASKS.lookupIngredient` et la branche levure intactes (empreinte sha256 de la consigne levure égale, testée et verte).

## Critères
1. **Témoins** (copie isolée, `prompts.ts` remis à HEAD par `git show HEAD:` après synchro) : `malts.test.ts` 27 tests, **5 rouges** : ordre des clés (25 clés au lieu de 15), aucun champ de levure (`lab` présent), cinq nombres exigés (`required` = `found, name, source`), encodeur (même `required`), consigne (« colorEbcMin et colorEbcMax : … » absent, paragraphe CONVERSIONS de la base à la place). Les 22 autres verts, dont l'**empreinte des levures** (égale sur HEAD et après, c'est voulu) et la lecture de `null`.
   Lecture de `null` : verte sur HEAD aussi, car `sanitizeFacts` écartait déjà tout non-nombre ; un témoin rouge a donc été fait par **mutation du client** dans la copie (`if (v === null) continue;` ajouté dans la boucle des bornes) : **2 rouges** (`les cinq nombres à null … aucune clé gardée` ; `valeursDeReponse … n'écrit rien`, qui rendait alors la règle « PPG ≈ rendement × 46 » pour un sucre muet). Copie resynchronisée ensuite (mutation effacée).
   Après correction : 27/27.
2. `npx vitest run tests/unit/depense tests/unit/yeastLookupPipeline.test.ts tests/unit/yeastLookupResult.test.ts tests/unit/aiClientYeastGuard.test.ts --maxWorkers=2` : `Test Files 135 passed (135) · Tests 2070 passed | 3 skipped` (2047 avant : +23, dont les 10 nouveaux de `malts.test.ts` ; les autres sont d'autres voies).
   `tests/unit/geminiRequestSchema.test.ts` : 6 verts. Le schéma malt passe l'encodeur (`encodeGeminiFunctionDeclarationForRest`) : chaque nombre devient `anyOf [number borné, null]`, `required` conservé (test dans `malts.test.ts`). Le schéma est envoyé à Gemini en `responseSchema` (OpenAPI : `nullable`, `propertyOrdering`, `minimum` y sont natifs).
   Voisins : `d100AiTaskOutput`, `geminiModelRouting`, `recipeAutoComplete`, `yeastReviewedFacts` : 63 verts, **1 rouge** (`d100AiTaskOutput`, voir ci-dessous).
3. `tsc -p tsconfig.json` : 0 ; `tsc -p functions/tsconfig.json` : 0 ; `npm run build` : exit 0.
4. `node --check scripts/check-invoice-journey-emulator.mjs` : 0. Pas de banc Chrome (le pilote le joue ; la réponse de l'ambre porte déjà les `null`, et le contrôle de l'ambre, fait par f4-malts, attend toujours 60 EBC et 36,8 PPG).

## DÉCISION À PRENDRE
`tests/unit/d100AiTaskOutput.test.ts` ligne 53 (hors de mon Possède) demande le schéma d'un **malt** (`context: { kind: 'malt', name: 'Pale Ale' }`) et exige que `alphaPct`, `betaPct`, `tempMinC`, `tempMaxC` y soient bornés (garde #100 contre les boucles numériques). Ces champs n'existent plus dans un malt, c'est le but de la voie : rouge par construction.
- Option A (recommandée) : remplacer, ligne 53, `instruction: 'malt : Pale Ale', context: { kind: 'malt', name: 'Pale Ale' }` par `instruction: 'houblon : Citra', context: { kind: 'houblon', name: 'Citra' }` : le test garde son sens (les champs partagés de la base sont bornés), et les bornes du malt sont testées dans `malts.test.ts`. Vérifié dans la copie : `d100AiTaskOutput` 14/14 verts avec ce seul changement.
- Option B : rien changer et accepter un rouge connu : non.
Le pilote (ou une voie qui possède ce fichier) applique A. La ligne 112 (`les autres tâches gardent 4 500 jetons`, malt) reste verte : la plafond de sortie du malt est toujours celui de la base.

## Essais utilisés
Un par critère. Aucun correctif nécessaire après la première écriture.

## Doutes et limites
- **Aucun appel réel** : je ne sais pas si le vrai modèle remplira les cinq champs. Le pilote fait la sonde (un appel avant les cinq). Ce qui a changé de façon vérifiable : le modèle n'a plus de champ de levure à remplir ni de consigne « laisser ABSENT », et chaque nombre est obligatoire (donc un `null` visible plutôt qu'une clé omise).
- Risque que le modèle écrive `0` au lieu de `null` pour un inconnu, malgré les descriptions : le client le garde (`colorEbc: 0` est dans [0, 5000] ; deux bornes à `0` donnent 0 EBC). `extractPct: 0` ne donne rien (PPG < 1). Je n'ai pas bloqué `0`, car un sucre blanc a vraiment 0 à 2 EBC ; si la sonde rend des `0`, c'est une règle à ajouter côté client (un 0 sur les deux bornes sans extrait = absent).
- Les cinq champs font maintenant partie de la sortie même quand `found` est faux (cinq `null`) : un peu plus de jetons de sortie, négligeable (`maxOutputTokens` 4500, inchangé).
- `RecipeAutoComplete` et « Compléter avec l'IA » passent par `sanitizeFacts` : `null` y est lu absent (testé), sans autre changement.
- La description de `colorEbc` dit « point unique » : si un malt publie un point, il va dans `colorEbc` et `deduireValeursMalt` le laisse gagner (testé, f4-malts).
- Le fichier `functions/src/prompts.ts` exporte deux constantes de plus (`MALT_SCHEMA_ORDRE`, `MALT_NOMBRES`), utilisées seulement dans le fichier ; pas de lecteur externe.

LEÇON PROPOSÉE : un schéma partagé entre trois familles (houblon, levure, malt) laisse le modèle remplir les bornes de la famille voisine (tempMinC −5 / tempMaxC 60 dans un malt) et ignorer les champs facultatifs ajoutés en fin : une famille = son schéma et sa consigne entiers, et ce qui doit être rendu est exigé et nullable (un `null` se voit, une clé absente non). Un test qui lit le schéma d'une famille par une autre (ici d100, kind 'malt') casse en silence au prochain découpage.
CONNAISSANCE : Gemini en `responseSchema` accepte `nullable: true` avec `minimum`/`maximum` ; un champ à la fois `required` et nullable force la clé et laisse `null` dire « non publié » ; `propertyOrdering` place les champs voulus juste après `sourceUrl`.
