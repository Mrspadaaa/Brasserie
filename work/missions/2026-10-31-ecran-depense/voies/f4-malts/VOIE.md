# Voie f4-malts — l'IA des fiches trouve les malts, mais n'en rend ni l'EBC ni le PPG (D302)

Agent : `auteur` (Sonnet). Plafond : 80 tours. Relis `../COMMUN.md`. Aucun commit, aucun déploiement, aucun appel réseau hors
localhost, Gemini toujours simulé (jamais dans un test). Tests, tsc, build : copie isolée
`node work/missions/2026-10-31-ecran-depense/voies/p3c-port/copie.mjs "<commande simple>"`. Le bout en bout se joue depuis le dépôt.
**Ne commence à écrire dans `src/`, `functions/` ou `scripts/` qu'une fois le banc de n2 fini** : le pilote te le dit dans le message
de lancement (un fichier écrit pendant un banc le recharge, L17).

## Le constat (pilote, 02.11, 5 vrais appels en ligne)
Réponses brutes, mot pour mot : `tests/unit/depense/enrichir/reponses-reelles-d302.json` (requête de `requeteDe`).
- 3 malts et 1 sucre : `found: true`, source et URL justes, mais **ni `colorEbc` ni `potentialPpg`**. Les chiffres sont dans `usage`
  (champ réservé aux houblons), en texte :
  - BEST Red X : « Plage de couleur de moût publiée : 28 à 32 EBC », « Extract dry basis min. 79.0 % », « environ 36.3 PPG » ;
  - Chevallier : « 5.0 à 10.0 EBC… Aucun point unique publié par Crisp Malt, les champs scalaires restent absents conformément à la
    règle d'extraction ».
  Cause probable : la règle levure de la consigne (« Les champs scalaires ne contiennent que des valeurs ponctuelles publiées »,
  `functions/src/prompts.ts`, `lookupIngredient`) est appliquée aux malts ; un malteur publie une plage. Résultat :
  `valeursDeReponse` rend `undefined`, et la fiche d'un malt n'est jamais remplie en vrai. Le banc passait (ENRICHIR 8/8) parce que
  sa réponse rejouée était inventée (`enrichirAnswer` : `colorEbc: 60, potentialPpg: 33` en champs), contre L28.
- Le sucre Candi D-180 : la consigne déborde (TVA suisse, CHF, « brasserie L'Affinée » recopiés dans `usage`).
- La levure B4 : laboratoire, forme, températures 16–21 remplis ; atténuation publiée « 65-70% » gardée en plage dans
  `technicalFacts`, `attenuationPct` absent. C'est conforme à la règle « aucune moyenne inventée » : ne touche pas aux levures.

## Ce que tu fais
1. Diagnostiquer d'abord sur le code (consigne, schéma, `sanitizeFacts` dans `src/domain/ingredientFacts.ts`,
   `valeursDeReponse` dans `src/services/enrichissementCatalogues.ts`, `AiAssist.tsx`), sans appel réel.
2. Le schéma de `lookupIngredient` reçoit ce qu'un malteur publie : une plage de couleur (`colorEbcMin`, `colorEbcMax`, en EBC ;
   °L × 1,97) et un extrait (`extractPct`, fine grind dry basis). La consigne dit, pour les malts et les sucres : un point publié va
   dans `colorEbc` ou `potentialPpg` ; une plage va dans min et max, jamais une moyenne dans `colorEbc` ; un extrait va dans
   `extractPct` ; la règle « valeurs ponctuelles » est celle des levures ; aucun nombre de malt dans `usage` ; rien sur la brasserie,
   la TVA ni la monnaie. La consigne des levures reste mot pour mot.
3. Le client déduit, dans une fonction pure, testée et partagée par la procédure et par « Compléter avec l'IA » : `colorEbc` = milieu de
   la plage publiée (1 décimale), `potentialPpg` = extrait × 0,46 (1 décimale, borné 1 à 50), seulement quand le point publié manque.
   Chaque valeur déduite le dit là où elle est posée ou montrée (`deduit` de la procédure, `technicalSource` ou note), avec la plage
   ou l'extrait d'origine. Un point publié gagne toujours ; une plage incohérente (min > max, hors bornes) ne donne rien.
4. Le banc : `enrichirAnswer` rend pour l'ambre une réponse de la forme réelle (plage et extrait, pas de `colorEbc` ni de `potentialPpg`
   en champs, un `usage` en texte). Les contrôles du cas `enrichir` attendent les valeurs déduites. Jamais un contrôle relâché.

## Possède
`functions/src/prompts.ts` (seulement `lookupIngredient` et `ingredientLookupDefinition`), `src/domain/ingredientFacts.ts`,
`src/services/enrichissementCatalogues.ts`, `src/ui/AiAssist.tsx` (seulement si l'affichage d'une valeur déduite l'exige),
`tests/unit/depense/enrichir/**`, `tests/unit/ingredientFacts*.test.ts` (nouveau si besoin), dans
`scripts/check-invoice-journey-emulator.mjs` seulement `enrichirAnswer` et les contrôles du cas `enrichir` ;
`work/missions/2026-10-31-ecran-depense/voies/f4-malts/**`. Ne touche pas aux fichiers de n2 (`functions/src/ai.ts`, `aiClient.ts`,
`geminiScanner.ts`, `pagesJustificatif.ts`, `src/ui/depense/**`, `ExpenseSheet.tsx`, cas `pages` du banc).

## Critères (le pilote les rejoue)
1. TEMOIN AVANT : un test qui donne à la procédure la forme réelle (plage, extrait) et attend EBC 30 et PPG 36,3 pour BEST Red X
   (28 à 32 EBC, 79 %) est rouge sur HEAD, vert après. Un test vérifie la consigne et le schéma (champs, phrase des plages).
2. `npx vitest run tests/unit/depense tests/unit/yeastLookupPipeline.test.ts tests/unit/yeastLookupResult.test.ts tests/unit/aiClientYeastGuard.test.ts --maxWorkers=2` : vert.
3. `npx tsc --noEmit -p tsconfig.json`, `npx tsc --noEmit -p functions/tsconfig.json`, `npm run build` : 0 erreur.
4. Bout en bout : `bash work/missions/2026-10-31-ecran-depense/voies/e-bout/lancer.sh work/missions/2026-10-31-ecran-depense/voies/f4-malts/bout enrichir,doc14 390,1280 work/finalisation-tickets-2026-10-08/H13-reels/jus0/rejeu-d272b.json work/finalisation-tickets-2026-10-08/H13-reels/banc-f5c-prod-paires/results.json`
   → `ENRICHIR OK 390 · 8/8`, `ENRICHIR OK 1280 · 8/8`, 0 KO, 0 « hmr update » ni « page reload ».

## Rendre
`RESULTAT.md` (format de `../COMMUN.md` § « Rendre ») avec le diff des consignes, puis une ligne `F4-MALTS OK — …` ou `F4-MALTS ECHEC — …`.
