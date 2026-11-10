K4 OK — banc sur 13 pièces (PDF, multi-captures), gestes Hv Sv Uv Av Tv, 3.8 partagée, --estimer, juge étendu ; aucun appel payé.

(Une seule réserve : `npx tsc --noEmit -p .` n'est pas vert, pour des erreurs hors de ma voie, voir « Critères ».)

## Fichiers écrits
- `scripts/banc-lecture-facture.ts` : `BenchCase.files?`, `buildReadBody(files…)` (une part `inlineData` par fichier, dans l'ordre ; la phrase du banc `multiCaptureNote` seulement à partir de 2 fichiers ; un PDF part en `application/pdf`) ; `CAS_FILES` + `cas-4.json` si `existsSync` ; réserve de budget par taille réelle (`inputReserveTokens` : base 2 000 + par image 2 × 1 120 (ULTRA_HIGH : 2 × 2 240) + par page de PDF 2 × 1 120 comptée dans les octets par `countPdfPages`, jamais sous les 6 000 de k1) ; Lm, Lh, Lp ramenées sur C★v ; Hv, Sv, Uv, Av, Tv ; une seule 3.8 par (document, tirage) avec garde dans le banc (une seconde 3.8 partagée lève une erreur, jamais une dépense) et `thirdCallDuplicates` ; `--estimer`, `--cas`, `--av-sans-schema` ; tuileur Chrome (`chromeTiler`, puppeteer-core, cache dans `<sortie>/tuiles/`) ; `observedAverages`.
- `scripts/banc-lecture-schema.ts` (neuf) : schéma de Sv/Uv (42 champs contre 38 en production, limite 46), `propertyOrdering`, convertisseur `svToProduction`, `productionToSv` (simulation), `schemaProblems` (validation pour `--av-sans-schema`), plafond de lignes 80.
- `scripts/banc-lecture-facture-juger.ts` : (a) listes de valeurs justes pour tout scalaire d'en-tête, `null` ou `''` dans la liste = absent admis ; (b) `unit` de ligne en liste (`''` = aucune unité admise) ; (c) tolérance du prix unitaire `max(0,00005 ; min(0,005 ; 0,5 % de l'attendu))`, montants de ligne et totaux à 0,005 ; `lignesInvisibles` (et `invisible: true` sur une ligne attendue) ; jugement par genre de pièce (`renderPerGenre`, dans `RESULTAT-BANC.md` et le hors-ligne) ; ligne « lignes perdues au plafond de 35 (parcours touchés) » par variante ; `checkSimulation` ne compte plus comme faute du jugement les lignes ≥ 35 déclarées perdues (`linesLost`).
- `scripts/banc-lecture-consignes-lite.ts` : inchangé (Lp).
- `tests/unit/banc-lecture-facture.test.ts` : 63 tests de k1/k2 intacts + 38 nouveaux = 101.
- `voies/k4-harness/HORS-LIGNE-JUGE-NEUF.md` ; sortie locale `H13-reels/banc-k4-horsligne-20261101/` (hors Git).
- Rien dans `functions/` ni `src/` ; pas de `cas-4*.json` touché ; clé, `.env`, `.secret.local` jamais lus.

## Critères (sorties)
- `npx tsc --noEmit -p .` : **52 erreurs, toutes dans `src/` (proofQueue, proofUploadStatus, ProofUploadNotice, finance/types : `ProofUpload`, `ProofJob.state`…), des fichiers que je n'ai pas touchés (`src/domain/finance/types.ts`, `purchaseEntry.ts` sont modifiés depuis avant ma voie dans `git status`).** Aucune erreur dans `scripts/` ni `tests/`, que `tsc -p .` ne couvre pas : un `tsc --strict` séparé sur les 3 scripts et le test est propre. Je n'ai pas écrit TYPES OK.
- `npx vitest run tests/unit/banc-lecture-facture.test.ts tests/unit/invoiceScanTransport.test.ts tests/unit/invoiceVisionReview.test.ts --maxWorkers=2` : 3 fichiers, 157 tests verts (le `&& echo TESTS BANC OK` suit).
- Simulation de toutes les variantes (13 documents dont les 6 de `cas-4.json`, ×3 tirages, +N) :
  `npx vite-node --config vitest.config.ts scripts/banc-lecture-facture.ts -- --simuler --variantes A,B,C,Cp,Cs,Csv,Csp,Lm,Lh,Lp,Hv,Sv,Uv,Av,Tv --normaliser --out C:/Users/mrspa/AppData/Local/Temp/k4-sim`
  `npx vite-node --config vitest.config.ts scripts/banc-lecture-facture-juger.ts -- C:/Users/mrspa/AppData/Local/Temp/k4-sim`
  → `BANC SIMULE OK — 2414/2414 fausses réponses fabriquées retrouvées, 26 faux verts comptés, 840 parcours propres sans champ faux, aucun réseau.`
- `--estimer` sur la commande payante proposée (ci-dessous) → `BANC ESTIME 5.1907 CHF 137 appels neufs`.
- `git diff --stat -- functions src` : rien dans `functions/` ; `src/` montre les fichiers déjà modifiés avant ma voie, aucun par moi.

## Essais utilisés
Un par critère, sauf : un test (corps de A comparé sans `candidateCount`, que le garde-fou de coût ajoute), la simulation (premier essai en ECHEC : `cas-4.json` porte des listes que `truthToRaw` ne lisait pas, et 37 lignes dépassent le plafond de 35 de la production → corrigé : première valeur non nulle d'une liste ; lignes ≥ 35 déclarées perdues non comptées comme faute du jugement), deux erreurs de Bash (barres inverses perdues dans une regex, backticks) corrigées à l'Edit.

## La commande payante proposée (le pilote la lance)
```
npx vite-node --config vitest.config.ts scripts/banc-lecture-facture.ts -- --payant --budget-chf 4.0 --reprendre work/finalisation-tickets-2026-10-08/H13-reels/banc-k1-20261101-081144 --variantes A,C,Csv,Hv,Sv,Uv,Av,Tv --normaliser --repeat 1 --confirm-paid-ai
npx vite-node --config vitest.config.ts scripts/banc-lecture-facture-juger.ts -- work/finalisation-tickets-2026-10-08/H13-reels/banc-k4-<horodatage affiché>
```
`--estimer` (ajouté à la même commande, sans clé ni réseau) : **137 appels neufs au pire, réserve maximale 5,19 CHF, dépense probable ≈ 1,70 CHF** (appels neufs × coût moyen observé par modèle dans k1, Av ×3 ; sans le surcoût des images supplémentaires de Sv/Uv/Tv ni des PDF, donc un peu bas). Budget cumulatif : 1,3932 CHF déjà journalisés ; avec `--budget-chf 4.0`, l'arrêt net tombe avant 4,0. Par variante (1 tirage, 13 documents ; « prêté » = lu dans k1, ni payé ni journalisé) :

| variante | modèle | appels neufs | prêtés | note |
|---|---|---|---|---|
| A | 3.8 | 12 (docs 8 à 13) | 14 | les 7 documents de k1 sont prêtés |
| C (Csv, +N en dérivent) | Flash-Lite | 12 | 14 | idem |
| Hv | Flash-Lite | 26 | 0 | consigne après les images, sans `temperature` |
| Sv | Flash-Lite | 26 | 0 | schéma du banc, plafond de sortie 8 192 |
| Uv | Flash-Lite | 26 | 0 | Sv + ULTRA_HIGH par image (PDF inchangé) |
| Tv | Flash-Lite | 16 | 0 | tuiles : les 8 images seules (ni PDF ni multi-captures) |
| 3.8 partagée | 3.8 | ≤ 6 | 7 (k1 les a) | une par (document, tirage), toutes variantes confondues |
| Av : 3.8 propre | 3.8 + exécution de code | ≤ 13 | 0 | seulement là où les deux Flash-Lite de C divergent ; réserve ×3 sur l'entrée |

Totaux (les appels sont comptés avec C et la 3.8 partagée au pire) : Flash-Lite ≈ 106 appels neufs, 3.8 ≈ 31. Les tableaux : `RESULTAT-BANC.md` de la sortie, avec « Par document » et « Par genre de pièce ».

## Hors ligne : le juge neuf contre l'ancien (k1 + k2, 21 parcours, aucun appel)
`--hors-ligne --reprendre banc-k1-20261101-081144 --cas cas.json,cas-2.json,cas-3.json` puis le juge neuf. Avant = `HORS-LIGNE.md` de k2 ; après = ce rejeu (`HORS-LIGNE-JUGE-NEUF.md`). **Aucun verdict ne change** : la tolérance du prix unitaire n'a déplacé aucune ligne sur les 7 anciens documents.

| | champs avant → après | lignes avant → après | faux verts | alertes justes / inutiles |
|---|---|---|---|---|
| A | 214 → 214 / 243 | 182 → 182 / 207 | 0 → 0 | 14 / 6 → 14 / 6 |
| C | 219 → 219 | 166 → 166 | 0 → 0 | 17 / 3 → 17 / 3 |
| C★v | 217 → 217 | 181 → 181 | 0 → 0 | 15 / 5 → 15 / 5 |
| C★v + N | 217 → 217 | 187 → 187 | 0 → 0 | 13 / 7 → 13 / 7 |

(C + N 222 / 172, comme avant.)

## Décisions de lecture et écarts (à connaître)
- **Lm, Lh, Lp = C★v exact** : la 3.8 ne s'appelle plus quand seule l'arithmétique échoue (c'était la garde de C★′). Libellés et tests mis à jour.
- **Réserve** : j'ai doublé le coût nominal par image (1 120 en HAUTE, 2 240 en ULTRA_HIGH, donc 4 480 réservés par image Uv, ≥ les 2 240 demandés). Av : entrée ×3 (l'outil relit l'image).
- **Plafond de sortie de Sv et Uv à 8 192 (pas 5 100)** : `printed` double le texte par ligne et le schéma admet 80 lignes ; à 5 100, doc8 (37 lignes) risquait la coupure. Écart de contrat, assumé et testé ; Hv garde 5 100.
- **Av** : ses deux Flash-Lite sont celles de C (partagées, prêtées par k1 quand elles y sont) ; seule sa 3ᵉ lecture lui est propre. `quoteGeminiCost` (production) refuse l'outil `codeExecution` : le banc chiffre le corps sans l'outil et le remet à l'envoi ; le coût réel ajoute `toolUsePromptTokenCount` (`withToolTokens`). Sans cet ajout le coût serait sous-estimé.
- **Tv** : pas de parcours sur un PDF ni sur un cas à plusieurs fichiers (la variante est absente de ces lignes, pas égale à Hv) ; la 3.8 partagée lit toujours les fichiers du cas, jamais les tuiles. Le tuileur Chrome n'est éprouvé qu'en injection (simulation) : **je n'ai pas lancé Chrome** (aucune image réelle ouverte).
- **Plafond de 35 lignes** : le schéma de Sv dit 80 (`maxItems`, consigne système avec « Maximum 80 lignes »), mais `normalizeInvoiceScan` (production, intouchée) coupe à 35. Le banc compte à part, par variante, les lignes que la lecture écrit au-delà de 35 (`overCap`, ligne « Lignes perdues au plafond de 35 » du tableau) ; le résultat de Sv sur doc8 reste donc à 35 lignes, et le vrai gain d'un plafond relevé n'existe qu'après une bascule en production (hors contrat).
- **`lignesInvisibles`** : sans indication de position, les n lignes attendues absentes du résultat sont pardonnées (en queue) ; si les lignes cachées sont au milieu d'un document, l'alignement par index se trompe. Une ligne attendue marquée `invisible: true` est écartée avant l'alignement : à écrire dans `cas-4.json` si besoin.
- **Genre photo / capture** : déduit du nom de fichier (« ecran », « screen », « capture » = capture), ou d'un champ `genre` du cas s'il existe.
- `maxItems` est envoyé en chaîne (`"80"`, codage int64 de l'API REST) : jamais vu en réponse réelle ; un HTTP 400 coûte 0 et le banc s'arrête au troisième échec d'affilée. Idem pour la forme `mediaResolution: { level }` par part et `tools: [{ codeExecution: {} }]`.

## Point 12 — exemples montrés à Gemini (few-shot) : non
Raison (L20) : un exemple de facture ne peut venir que de l'une de nos pièces. Le banc se mesure sur ces mêmes pièces : montrer un exemple taillé sur elles gonfle le score de la variante sans prouver qu'elle lise une autre facture (« overfit » du 27.10). Un exemple inventé de toutes pièces ne mesure que notre imagination du fournisseur. Et la consigne Lp (règles génériques, sans valeur) offre déjà la voie propre de ce geste. À rouvrir seulement avec des pièces de réserve jamais jugées.

## Doutes et limites
- Rien de payant n'a tourné : le format exact des réponses de Gemini 3.5 Flash-Lite avec `propertyOrdering`, des parts `executableCode` / `codeExecutionResult` et de `mediaResolution` par part est celui de la documentation, jamais vu. Les tests couvrent la lecture d'une réponse fabriquée à trois parts.
- 13 documents × 1 tirage : peu pour départager deux taux proches ; le tableau par genre (PDF 2 documents, plusieurs captures 3) est un indice.
- `--av-sans-schema` valide le JSON texte par le schéma de production ; non essayé en réel.

DÉCISION À PRENDRE : lancer la commande payante telle quelle (~1,7 CHF probable, 4,0 de plafond cumulatif) ou la scinder en deux passes (Hv, Sv, Uv, Tv d'abord, Av ensuite, car Av est la plus chère par appel). Recommandation : une seule passe à 1 tirage, puis un 2ᵉ tirage seulement des deux ou trois gestes qui gagnent.

CONNAISSANCE : `quoteGeminiCost` refuse l'outil `codeExecution` et ne compte pas `toolUsePromptTokenCount` : tout banc d'« Agentic Vision » doit chiffrer lui-même ; la production ne peut pas l'adopter sans étendre son garde-fou de coût.

LEÇON PROPOSÉE : un format de vérité qui gagne des listes et des champs optionnels (`cas-4.json`) doit faire échouer une simulation sur le jeu complet avant tout lancement ; le banc n'a pas pu croire que `expected.x` était un scalaire. La simulation par défaut lit maintenant tous les cas existants.
