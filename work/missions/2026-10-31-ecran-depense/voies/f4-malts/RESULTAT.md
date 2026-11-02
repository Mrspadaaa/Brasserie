OK — L'IA des fiches rend la plage et l'extrait d'un malt ; le client en déduit EBC et PPG, marqués « déduit ».

F4-MALTS OK — BEST Red X : 28 à 32 EBC et 79 % donnent 30 EBC et 36,3 PPG, chacun avec sa règle ; banc ENRICHIR 8/8 aux deux largeurs.

## Cause (diagnostic sur le code, sans appel réel)
`lookupIngredient` partageait une seule consigne : sa règle « Les champs scalaires ne contiennent que des valeurs ponctuelles publiées » est écrite pour
les levures (paragraphe LEVURE) mais le modèle l'appliquait aux malts. Un malteur publie une plage et un extrait ; le schéma n'avait aucun champ pour eux,
le modèle rangeait les chiffres dans `usage` (champ des houblons) et `valeursDeReponse` rendait `undefined`. Le banc passait parce que sa réponse rejouée
portait `colorEbc: 60, potentialPpg: 33` en champs, ce que le vrai modèle n'a jamais rendu (L28).

## TEMOIN AVANT
`tests/unit/depense/enrichir/malts.test.ts`, lancé sur les trois fichiers source remis à HEAD (`git show HEAD:` dans la copie isolée) :
`BEST Red X : EBC 30 et PPG 36,3 …` → `AssertionError: expected undefined to be 30` ; `Chevallier 5 à 10 EBC` → `expected undefined to be 7.5` ;
11 tests rouges sur 18 (fonction pure absente, `sanitizeFacts` ne déduit pas, schéma sans `colorEbcMin`). Les 7 verts sont ceux qui doivent l'être sur HEAD :
un point publié gagne, la forme d'avant (chiffres dans `usage`) ne donne rien, sucre sans chiffre, houblon, empreinte de la consigne des levures, base inchangée.
Après la correction : 18/18 verts.

## Ce qui est fait
1. **Consigne et schéma** (`functions/src/prompts.ts`, seulement `ingredientLookupDefinition` + une fonction `maltLookupDefinition` et la constante `MALT_SORTIE`) :
   pour `kind: 'malt'` (malts et sucres : `requeteDe` envoie `kind: 'malt'`, `type: 'sucre'`), la consigne reçoit un paragraphe SORTIE MALT ET SUCRE, le schéma trois champs
   `colorEbcMin`, `colorEbcMax` (0 à 5000), `extractPct` (0 à 100). `TASKS.lookupIngredient`, la consigne des houblons et celle des levures ne changent pas
   (empreinte sha256 de la consigne levure égale avant et après, testée ; schéma levure : mêmes 16 clés).
2. **Fonction pure** `deduireValeursMalt` (`src/domain/ingredientFacts.ts`) : `colorEbc` = milieu de la plage (1 décimale), `potentialPpg` = extrait × 0,46 (1 décimale, 1 à 50),
   seulement quand le point publié manque ; plage incohérente (min > max, hors 0–5000), un seul bord, extrait hors 0–100 ou potentiel hors 1–50 : rien. Elle rend la règle avec la plage ou l'extrait d'origine.
3. **Partage** : `sanitizeFacts` l'appelle (donc « Compléter avec l'IA » et tout appelant de `sanitizeFacts`, `RecipeAutoComplete` compris) et ajoute la règle à `note` ;
   `valeursDeReponse` l'appelle sur la réponse brute pour poser `deduit` par champ (`« EBC déduit : milieu de la plage publiée 28 à 32 EBC »`, `« PPG déduit : extrait publié 79 % × 0,46 »`).
   Un point publié garde l'ancien `deduit` (`DEDUIT_EBC`, `DEDUIT_PPG`), `procedure.test.ts` inchangé et vert.
4. **Affichage** : `AiAssist.tsx` n'a pas eu besoin d'être modifié : il montre déjà `facts.note`, qui porte la règle. Test rendu dans le vrai composant : `malts-completer.test.tsx`
   (30 EBC, 36.3 PPG, la phrase des règles, « Reprendre ces valeurs » applique 30 et 36,3 ; plage incohérente sans point : « Aucune caractéristique exploitable »).
5. **Banc** (`scripts/check-invoice-journey-emulator.mjs`, seulement `enrichirAnswer` et le contrôle de l'ambre) : la réponse de l'ambre a la forme réelle (`colorEbcMin 55`, `colorEbcMax 65`,
   `extractPct 80`, `usage` en texte sans chiffre, aucun `colorEbc` ni `potentialPpg`). Le contrôle exige maintenant EBC 60 ET PPG 36,8, `niveau: repris`, et les deux règles citées
   (plage 55 à 65, extrait 80 % × 0,46) : plus strict qu'avant (il ne vérifiait que le PPG et un `deduit` quelconque).

## Diff de la consigne (malt et sucre seulement, ajouté après la consigne de base)
```
+SORTIE MALT ET SUCRE. Un malteur publie une plage de couleur et un extrait, pas
+un point. Ce qui est publié va dans son champ :
+- un point unique de couleur (une seule valeur publiée) va dans colorEbc, en
+  EBC (°L × 1.97) ; un potentiel publié en PPG va dans potentialPpg ;
+- une plage de couleur va dans colorEbcMin et colorEbcMax, en EBC (°L × 1.97),
+  jamais une moyenne dans colorEbc ;
+- l'extrait (fine grind, dry basis, en %) va dans extractPct, tel que publié ;
+  ne le convertis pas et n'écris pas potentialPpg à partir de lui : le client
+  calcule le milieu de la plage et le potentiel.
+La règle « valeurs ponctuelles » plus haut est celle des levures : elle ne
+s'applique ni aux malts ni aux sucres, dont la plage et l'extrait se remplissent.
+N'écris aucun nombre de malt ou de sucre dans usage, aroma ni note (usage est
+un champ de houblon), et rien sur la brasserie, la TVA ni la monnaie : seulement
+la fiche du produit.
```
Schéma malt : base + `colorEbcMin`, `colorEbcMax` (NUMBER 0–5000), `extractPct` (NUMBER 0–100). `required` inchangé : `found`, `name`, `source`.

## Fichiers écrits
`functions/src/prompts.ts`, `src/domain/ingredientFacts.ts`, `src/services/enrichissementCatalogues.ts`, `scripts/check-invoice-journey-emulator.mjs` (deux hunks),
`tests/unit/depense/enrichir/malts.test.ts`, `tests/unit/depense/enrichir/malts-completer.test.tsx`, ce RESULTAT.md, et les sorties du banc
(`bout/` : premier essai du critère tel qu'écrit, arrêté ; `bout-enrichir/`, `bout-doc14/`).

## Critères
1. TEMOIN AVANT : ci-dessus (rouge sur HEAD, vert après).
2. `npx vitest run tests/unit/depense tests/unit/yeastLookupPipeline.test.ts tests/unit/yeastLookupResult.test.ts tests/unit/aiClientYeastGuard.test.ts --maxWorkers=2`
   (copie isolée) : `Test Files 135 passed (135) · Tests 2047 passed | 3 skipped`. En plus, 9 fichiers voisins (d100AiTaskOutput, geminiModelRouting, geminiRequestSchema,
   yeastReviewedFacts, yeastEnrichment, yeastDbCorrections, recipeAutoComplete, d100AiErrorsVisible, ingredientPickerRefs) : 148 verts.
3. `tsc -p tsconfig.json` : 0 erreur ; `tsc -p functions/tsconfig.json` : 0 erreur ; `npm run build` : exit 0.
4. Bout en bout : voir « Écart au critère 4 » ci-dessous.
   - `enrichir` seul, 390 et 1280 : `ENRICHIR OK 390 · 8/8 · appels 2` et `ENRICHIR OK 1280 · 8/8 · appels 2`, 18 OK, 0 KO, 0 ARRÊT.
   - `doc14` seul : 56 OK, 0 KO, 0 ARRÊT.
   - 0 « hmr update » ni « page reload » dans les deux consoles.

## Écart au critère 4
La commande telle qu'écrite (`enrichir,doc14`) s'arrête par construction : le cas `enrichir` lève « Le cas enrichir se lance seul (--cases enrichir) » (ligne présente
dans HEAD, pas un changement de n2). Premier essai : 56 OK, 0 KO, 2 ARRÊT (un par largeur) ; je l'ai gardé dans `bout/`. J'ai donc rejoué les deux cas séparément, ce qui
tient l'attente (`ENRICHIR OK … 8/8`, 0 KO). Le pilote voudra corriger la commande de ses GATES.

## Essais utilisés
Un par critère, sauf une correction pendant l'écriture : `ingredientLookupDefinition` rendait la base pour tout `kind` autre que `levure` avant d'atteindre la branche malt
(vu par le test de schéma, corrigé au 1er essai suivant). Build : le premier appel avec `tail` dans la commande a été mal passé par `shell: true`, rejoué sans.

## Doutes et limites
- **Aucun appel réel** : je ne peux pas dire si le vrai modèle obéira à la nouvelle consigne (plage dans min et max, extrait dans `extractPct`, rien dans `usage`). C'est le point à
  vérifier par un appel réel unique sur BEST Red X et Chevallier, que le pilote décidera de lancer (budget D302). Si le modèle continue de mettre les chiffres dans `usage`, le client ne les lit pas
  (testé : aucun chiffre n'est extrait d'un texte).
- Château Cara Ruby (réponse réelle sans aucun chiffre) : rien n'est écrit, et c'est juste tant que la fiche ne publie rien ; la consigne corrigée la fait peut-être mieux chercher.
- Sucre Candi D-180 : la consigne interdit maintenant TVA, monnaie et « brasserie L'Affinée » dans `usage`, mais seul un appel réel dira si le sucre cesse de déborder. Le client n'a aucun filtre
  sur `usage` d'un malt (il n'est pas lu).
- `sanitizeFacts` déduit pour tout appelant : `RecipeAutoComplete.tsx` (hors de ma voie) reçoit donc colorEbc et potentialPpg déduits ; la règle voyage dans `note`, que cet écran ne montre peut-être pas.
  Je ne l'ai pas modifié. Si cet écran doit afficher « déduit », c'est une voie à lui.
- Un `extractPct` du modèle exprimé en fraction (0,79 au lieu de 79) donnerait 0,4 PPG, hors 1–50 : rien n'est écrit. Le schéma dit « en % » et la consigne « tel que publié ».
- Le facteur 0,46 est celui de la consigne d'origine (« PPG ≈ rendement × 46 ») ; 79 % donne 36,3, qui est le PPG que le modèle avait lui-même calculé pour BEST Red X.
- Levures non touchées : l'atténuation « 65-70 % » reste en plage dans `technicalFacts`, conforme à la règle (aucune moyenne inventée).
- Le champ `colorEbcMin/Max/extractPct` n'est pas stocké sur l'article (seules les valeurs déduites le sont) ; la fiche garde la règle dans `deduit` avec la plage ou l'extrait d'origine.

## Rien ne se perd
Aucun champ retiré ; trois champs facultatifs ajoutés à `IngredientFacts` ; un point publié (`colorEbc`, `potentialPpg`) gagne toujours ; les réponses déjà gardées (`reponses.get`) sans plage ni extrait se lisent comme avant.
Les fiches de levure et de houblon sont intactes.

## Hors périmètre
`functions/src/ai.ts`, `aiClient.ts`, `geminiScanner.ts`, `src/ui/depense/**`, cas `pages` du banc, `RecipeAutoComplete.tsx`, `AiAssist.tsx`. Aucun commit, aucun déploiement, aucun appel Gemini.

LEÇON PROPOSÉE : un banc dont la réponse rejouée est écrite d'après le schéma du code, et non copiée d'une vraie réponse, valide le schéma et pas la consigne (L28 revient) : rejouer en fixture une vraie réponse brute par genre, avec ses défauts.
CONNAISSANCE : un malteur publie une plage de couleur (EBC) et un extrait (fine grind, dry basis), presque jamais un point ; le potentiel PPG se déduit de l'extrait × 0,46 (BEST Red X : 79 % → 36,3), l'EBC du milieu de la plage ; les deux se marquent « déduit ».
