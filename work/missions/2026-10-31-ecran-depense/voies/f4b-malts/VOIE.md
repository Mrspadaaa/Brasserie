# Voie f4b-malts — le vrai modèle remplit la plage et l'extrait d'un malt (D303, journal-gemini 02.11)

Agent : `auteur` (Sonnet), neuf. Plafond : 60 tours. Ligne `f4b-malts` de MISSION.md. Aucun commit, aucun déploiement, aucun appel
réel : Gemini toujours simulé (le pilote fait la sonde réelle après déploiement). Tests dans la copie isolée :
`node work/missions/2026-10-31-ecran-depense/voies/p3c-port/copie.mjs "<commande>"` (une commande simple par appel).
Lis d'abord `../f4-malts/RESULTAT.md` (ce qui est fait) et la section « 02.11 — mêmes 5 appels après le déploiement de f4-malts » de
`../../journal-gemini.md`.

## Le fait (5 vrais appels, 02.11, aiTask 4725e187)
Malts et sucre trouvés ; le modèle obéit à « aucun nombre dans usage », mais ne remplit **ni `colorEbcMin`, ni `colorEbcMax`, ni
`extractPct`**. Pour BEST Red X il rend `tempMinC` −5 et `tempMaxC` 60, exactement les bornes du schéma (champs de levure dans un malt).
Cause probable : `maltLookupDefinition` garde tout le schéma de base (houblon, levure, fermentation) et ajoute les trois champs en fin,
facultatifs. Les réponses brutes de D302 (`tests/unit/depense/enrichir/reponses-reelles-d302.json`) montrent que le modèle trouve bien
les plages et l'extrait : il ne sait pas où les mettre.

## À faire (lecture étroite et réversible)
1. `functions/src/prompts.ts`, seulement `maltLookupDefinition` : pour `kind: 'malt'`, un schéma **restreint aux champs d'un malt ou d'un
   sucre**, comme `ingredientLookupDefinition('levure')` restreint le sien : `found`, `name`, `source`, `sourceUrl`, `retrievedAt`, `note`,
   `colorEbc`, `colorEbcMin`, `colorEbcMax`, `extractPct`, `potentialPpg`, `grainType`, `diastaticPower`, `usage`, `substitutes` (lis le
   client, `sanitizeFacts` et `valeursDeReponse`, pour ne retirer aucun champ qu'un malt utilise). Plus aucun champ de levure ni de houblon.
2. Les cinq nombres `colorEbc`, `colorEbcMin`, `colorEbcMax`, `extractPct`, `potentialPpg` sont **exigés et `nullable: true`**, chacun avec une
   `description` courte (« plage publiée, borne basse, en EBC », « extrait fine grind dry basis publié, en % », etc.), placés juste après
   `sourceUrl` (`propertyOrdering`). Un champ non publié vaut `null`, jamais une moyenne ni une valeur inventée. La consigne SORTIE MALT ET
   SUCRE le dit en une phrase.
3. Le client accepte `null` partout où il lit ces champs (`sanitizeFacts`, `deduireValeursMalt`, `valeursDeReponse`) : `null` = absent.
4. Le banc (`scripts/check-invoice-journey-emulator.mjs`, seulement `enrichirAnswer`) : la réponse de l'ambre prend la forme du nouveau
   schéma (les cinq nombres présents, `colorEbc` et `potentialPpg` à `null`). Rien d'autre dans ce fichier.

Interdits : la consigne et le schéma des levures et des houblons (empreinte testée par f4, elle doit rester égale), `TASKS.lookupIngredient`
de base, `ai.ts`, tout autre fichier.

## Possède
`functions/src/prompts.ts` (`maltLookupDefinition`, `MALT_SORTIE`), `src/domain/ingredientFacts.ts`, `src/services/enrichissementCatalogues.ts`,
`tests/unit/depense/enrichir/**`, `tests/unit/ingredientFacts*.test.ts`, `scripts/check-invoice-journey-emulator.mjs` (`enrichirAnswer`),
`work/missions/2026-10-31-ecran-depense/voies/f4b-malts/**`.

## Critères (le pilote les rejoue)
1. Témoins rouges sur l'arbre d'avant (mutation de la correction dans la copie, comme n2-reprise), verts après : schéma malt sans aucun
   champ de levure ni de houblon ; cinq nombres exigés et nullables, dans l'ordre ; réponse `null` lue comme absente ; empreinte des
   levures égale.
2. `npx vitest run tests/unit/depense tests/unit/yeastLookupPipeline.test.ts tests/unit/yeastLookupResult.test.ts tests/unit/aiClientYeastGuard.test.ts --maxWorkers=2`
   (copie isolée) : tout vert ; et les tests de schéma Gemini (`tests/unit/geminiRequestSchema*`) : le schéma malt passe l'encodeur.
3. `npx tsc --noEmit -p tsconfig.json`, `npx tsc --noEmit -p functions/tsconfig.json`, `npm run build` : 0 erreur.
4. `node --check scripts/check-invoice-journey-emulator.mjs` : 0 erreur. Pas de banc Chrome (le pilote le joue).

## Rendre
`RESULTAT.md` : fichiers, témoins, sorties, le schéma malt final (clés et `required`), doutes ; `LEÇON PROPOSÉE : …`, `CONNAISSANCE : …`.
Une ligne : `F4B-MALTS OK — …` ou `F4B-MALTS ECHEC — …`.
