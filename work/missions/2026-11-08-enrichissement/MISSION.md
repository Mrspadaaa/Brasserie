# Mission 2026-11-08 — Le banc de l'enrichissement des fiches (VITE_ENRICHISSEMENT_IA)

Le brasseur (08.11) : « VITE_ENRICHISSEMENT_IA. Bien tester ça budget 10chf ».

L'enrichissement est éteint en production (`src/services/enrichissementReglages.ts`). Allumé (`VITE_ENRICHISSEMENT_IA=production`), l'app complète la fiche
d'un malt, d'un sucre ou d'une levure du stock après « Confirmer » une dépense, par la tâche serveur `lookupIngredient`
(`enrichissement.ts` → `AiClient.run`, `tier: 'fast'` → `aiTask` → `functions/src/prompts.ts`, recherche Google ancrée). Le plan d'origine est la voie
f4-enrichir (`work/missions/2026-10-31-ecran-depense/voies/f4-enrichir/PLAN.md`, § 3.5, commits c032e1a2 et 95b91193). Ce qu'il promet, et ce que le banc vérifie :

| promesse du plan | où le banc la vérifie |
|---|---|
| `source` obligatoire ; sans `found` et sans source, rien n'est écrit | le juge : une valeur sans source citée est **inventée** ; `valeursDeReponse` n'écrit rien |
| « un champ non trouvé reste absent », jamais 0, jamais une moyenne | le juge : un point au milieu d'une plage publiée (levure) est **inventé** ; un champ que la fiche ne publie pas, rendu, aussi |
| un nom générique ne désigne pas un produit (« flocons d'avoine » sans malteur) | pièges `ambigu` : un chiffre rendu est « attribué à tort » |
| houblon : aucune recherche en ligne, jamais d'α du lot (M2) | le banc appelle le houblon par le chemin « assistant » pour mesurer, et vérifie que `valeursDeReponse` n'écrit rien (`violeM2`) |
| recherche seulement pour un produit identifiable ; levure du catalogue servie par le catalogue | `gardeDe` note la décision de f4 pour chaque produit (le banc l'applique avec `--selon-garde`) |
| plafonds D300 : 200 recherches arrivées et 200 tentatives par jour et par appareil, 30 min entre deux essais, trois jours d'échec, 30 jours avant de re-chercher un « introuvable » | tests Vitest simulés : `file.test.ts` (déjà), `interrupteur.test.ts` (déjà), `tentatives.test.ts` (nouveau : `PLAFOND_TENTATIVES`) |
| coût par article : ESTIMATION non mesurée (0,05 à 0,12 CHF probable, 0,40 réservé, 0,80 au pire) | le banc la mesure (`coût CHF` par appel, journal à part) |

## Voies

| voie | niveau | modele | plafond | decideur | controles | possede | depend de |
|---|---|---|---|---|---|---|---|
| EI | jugement | sonnet | 80 | pilote | `npx vitest run --config work/missions/2026-10-31-ecran-depense/banc-b2/vitest.depense.config.mjs --maxWorkers=2 --testTimeout=60000 tests/unit/banc-enrichissement.test.ts tests/unit/depense/enrichir/tentatives.test.ts` ; `npx vite-node --config vitest.config.ts scripts/banc-enrichissement.ts -- --simuler` ; `... -- --estimer` | scripts/banc-enrichissement.ts, scripts/banc-enrichissement-juger.ts, functions/src/geminiBody.ts, src/services/enrichissementRequete.ts, tests/unit/banc-enrichissement.test.ts, tests/unit/depense/enrichir/tentatives.test.ts, work/missions/2026-11-08-enrichissement/ | — |

## État de l'art

- Problème type : extraction de fiches techniques par un LLM avec recherche web (« slot filling » ancré sur des sources), et mesure de ses hallucinations : faut-il rendre une valeur quand la source n'en publie pas, une moyenne là où elle publie une plage, une fiche pour un produit qui n'existe pas ? Un problème de factualité ancrée (grounded generation) et d'abstention, pas de classification.
- Examiné : (1) les protocoles de factualité qui séparent la valeur, sa source et l'abstention : FActScore (Min et al., 2023 : précision des affirmations atomiques contre une source de référence), SimpleQA (OpenAI, 2024 : « correct / incorrect / non tenté » comme trois cases distinctes, l'incorrect pesant plus que le non tenté), FACTS Grounding (Google DeepMind, 2024 : réponse fidèle au document fourni) ; (2) les harnais d'évaluation maintenus (promptfoo, OpenAI Evals, lm-evaluation-harness) : utiles pour comparer des modèles sur un même jeu, mais ils recopieraient la consigne, le schéma et la normalisation de l'app, donc ne mesureraient plus la production, et ajouteraient une dépendance (licence, poids) pour un jeu de 38 produits ; (3) le banc maison `scripts/banc-lecture-facture.ts` (garde de budget, journal, modes `--simuler` / `--estimer` / `--payant`, `paid-ai-test-guard`), déjà éprouvé en passes payantes ; (4) la vérité par fiche officielle de producteur plutôt que par un LLM juge (un LLM juge reproduit l'hallucination qu'on mesure).
- Décision : reprendre le **protocole** de SimpleQA et de FActScore (trois cases par champ : correct, incorrect, non tenté ; l'invention est l'incorrect rendu sans source ou là où la vérité est une abstention) et le **harnais** du banc de lecture (garde de budget, journal à part, trois modes) ; ne pas ajouter de bibliothèque d'évaluation. La vérité est écrite à la main, produit par produit, depuis la fiche du producteur (adresse et statut `lu-sur-la-fiche` / `a-reverifier` dans `verite.json`) ; le juge est un programme déterministe (`banc-enrichissement-juger.ts`), pas un modèle. Le banc envoie EXACTEMENT ce que la production envoie : la consigne et le schéma de `ingredientLookupDefinition`, le texte et le corps de `functions/src/geminiBody.ts` (extraits de `ai.ts`, qui les appelle maintenant), la route de `geminiAttempts`, le chiffrage de `geminiCosts.ts`, l'adaptation client `valeursDeReponse` / `sanitizeFacts`. La seule différence : l'appel part de l'API Gemini avec la clé locale, sans `aiTask` (connexion Firebase) ni budget mensuel serveur.

## La vérité (`verite.json`)

38 produits publics (27 avec fiche de producteur, 11 sans : 10 pièges et « Pilsner Malz ») : 10 phares (Pilsner Weyermann, Maris Otter, Caramünch Typ 1, Citra, Nelson Sauvin, Idaho 7, Magnum, SafAle US-05, Nottingham, WLP001), 18 noms tels qu'il les tape ou qu'une facture les imprime
(« Idaho7 », « Cryo Hops Citra 25g », « Caramünch Typ 2 », « Pilsner Malz », « Safale S-04 11,5 g »…), 10 pièges (4 noms inventés, 3 génériques, 3 hors périmètre : sucre, dextrose, levure de boulanger).
Chaque produit porte l'adresse de sa fiche de producteur et les valeurs attendues (plages publiées, pas des moyennes). Aucun stock, aucun prix, aucun fournisseur du brasseur.

**Statut des valeurs.** 18 produits sont `lu-sur-la-fiche` : lues le 08.11.2026 sur la page citée (Fermentis, Lallemand, Weyermann, New Zealand Hops). 9 sont `a-reverifier` (Maris Otter, Citra, Idaho 7 ×2, Magnum, WLP001, Cryo Citra, Mosaic, Saaz) : la page du producteur répond 429 (Yakima Chief, contrôle anti-robot), se charge par script (White Labs, Crisp) ou n'a pas d'adresse stable ; la valeur vient de la mémoire du rédacteur, avec une plage large. **À relire par le pilote avant la passe payante** ; le juge marque ces produits d'une `*` et les compte à part.

## Le chemin de production, et ce que le banc en note

`gardeDe` rejoue la décision de f4 avant tout appel (`traiterTravail`, étapes 1 et 2) : sur les 38 produits, 14 partent en ligne (malts identifiables, levures hors catalogue), 6 sont servis par le catalogue des levures, 1 est ambigu (Voss), 6 malts sont non identifiables (« Pilsner Malz », les noms inventés, le sucre…), 11 houblons n'ont jamais de recherche. Par défaut le banc appelle les 38 (il mesure le MODÈLE, pas la garde) ; `--selon-garde` n'appelle que les 14 que f4 enverrait.

## Commandes exactes (depuis la racine du dépôt)

```
# Simulé : aucun réseau, aucune clé ; 38 produits, fautes fabriquées pour éprouver le juge ; écrit dans %TEMP% (ou --out)
npx vite-node --config vitest.config.ts scripts/banc-enrichissement.ts -- --simuler
npx vite-node --config vitest.config.ts scripts/banc-enrichissement.ts -- --simuler --sans-fautes

# Estimation de la passe (aucun réseau, aucune clé)
npx vite-node --config vitest.config.ts scripts/banc-enrichissement.ts -- --estimer
npx vite-node --config vitest.config.ts scripts/banc-enrichissement.ts -- --estimer --selon-garde

# Tests (tous simulés)
npx vitest run --config work/missions/2026-10-31-ecran-depense/banc-b2/vitest.depense.config.mjs --maxWorkers=2 --testTimeout=60000 tests/unit/banc-enrichissement.test.ts tests/unit/depense/enrichir/tentatives.test.ts

# PASSE PAYANTE (au pilote) — la passe complète, 38 appels
npx vite-node --config vitest.config.ts scripts/banc-enrichissement.ts -- --payant --budget-chf 10 --plafond-passe 5 --confirm-paid-ai

# Rejuger une passe déjà faite, sans appel
npx vite-node --config vitest.config.ts scripts/banc-enrichissement-juger.ts -- --sortie work/missions/2026-11-08-enrichissement/passes/<horodatage>
```

Options : `--cas p01,f03` (produits), `--groupe phare,piege`, `--famille malt,houblon,levure`, `--selon-garde`, `--out <dossier>`, `--reprendre <dossier d'une passe>` (rejoue les réponses déjà payées, sans appel ni journal), `--verite <fichier>`.

**Passes par étapes (recommandé : le coût réel n'est pas mesuré).**
1. Mesure du coût (3 appels) : `-- --payant --budget-chf 10 --plafond-passe 1.5 --cas p01,p08,x01 --confirm-paid-ai` (estimé 0,15 à 0,36 CHF, réserve max 1,23). Lire `JUGEMENT.md` et le coût réel par appel.
2. Ce que f4 enverrait vraiment (14 appels) : `-- --payant --budget-chf 10 --plafond-passe 3 --selon-garde --confirm-paid-ai`.
3. Le reste (24 appels : houblons par l'assistant, pièges, levures du catalogue) : `-- --payant --budget-chf 10 --plafond-passe 5 --cas p04,p05,p06,p07,p08,p09,p10,f01,f02,f04,f12,f13,f14,f15,f16,f17,f18,x01,x02,x05,x06,x07,x08,x10 --confirm-paid-ai`.

## Le budget : 10 CHF au total

- Journal à part de celui de la lecture des factures : `work/missions/2026-11-08-enrichissement/journal-gemini.md` (une ligne par tentative, juste après elle, cumul propre). Plafond total 10 CHF, toutes passes comprises : `--budget-chf` ne dépasse jamais 10 et la garde compte le déjà journalisé.
- Réserve AVANT chaque appel, au pire (`quoteGeminiCost` : 20 requêtes de recherche réservées, sortie au plafond de 4 500 jetons) : **0,4125 CHF par appel**. Arrêt net si le déjà dépensé, le réservé et cette réserve dépassent le budget, ou la dépense de la passe `--plafond-passe`. Réglage après l'appel au coût relu (jetons lus, requêtes de recherche lues dans la réponse ; jetons de l'outil de recherche comptés en entrée, par prudence). Réponse sans coût lisible : la réserve entière est comptée, jamais zéro. Refus HTTP du fournisseur : rien n'est facturé. Trois produits en échec d'affilée : arrêt net.
- Tentatives comme `aiTask` : 3.8 `low`, puis une seule nouvelle tentative si le service flanche ; une réponse coupée ou bouclée (`unusableGeminiOutput`) et un délai ne sont pas redemandés.

## Estimation de la passe complète (`--estimer`, sortie du 08.11)

```
Passe : 38 produits choisis, 38 appel(s) ; par famille malt 17, houblon 11, levure 10.
Reserve par appel : 0.4125 CHF ; reserve maximale cumulee 15.6743 CHF si CHAQUE appel consommait toute sa reserve.
Probable (ESTIMATION non mesuree, 0.05 a 0.12 CHF par appel) : 1.90 a 4.56 CHF.
Haut realiste (ESTIMATION : 0.2 CHF par appel = 25 000 jetons d'entree, 6 000 de sortie, 5 requetes de recherche) : 7.60 CHF.
Le haut realiste (7.60 CHF) TIENT sous les 10 CHF.
BANC ESTIME probable 1.90-4.56 CHF, haut 7.60 CHF, reserve max 15.6743 CHF, 38 appels
```

**La passe complète tient sous 10 CHF : probable 1,90 à 4,56 CHF, haut réaliste 7,60 CHF.** Ces deux chiffres sont des ESTIMATIONS non mesurées (ceux de `enrichissementReglages.ts` et un haut raisonné) ; la première étape (3 appels) donne le vrai coût. La réserve maximale cumulée (15,67 CHF) ne se réaliserait que si chaque appel consommait ses 20 requêtes de recherche réservées ; la garde s'arrête net avant 10 CHF dans ce cas, et la dépense réelle d'un appel (3 à 5 requêtes) est de l'ordre de 0,05 à 0,20 CHF. Avec `--selon-garde` : 14 appels, probable 0,70 à 1,68 CHF, haut 2,80 CHF.

Dans la simulation, le coût par appel (0,088 CHF) est une valeur fabriquée (jetons et requêtes inventés) : il ne prouve rien du coût réel.

## Ce que le juge dit

Par produit : `ok`, `a-corriger` (un champ faux), `avec-invention`, `introuvable-a-tort`, `introuvable-a-raison`, `fiche-inventee` (un produit qui n'existe pas reçoit une fiche), `attribue-a-tort` (un chiffre pour un nom générique), `echec-technique`, `non-appele`.
Par champ : `juste`, `dans-la-plage`, `faux`, `invente`, `absent-a-raison`, `absent-a-tort`, `non-verifie`. Par source : `producteur`, `racine-producteur`, `blog-ou-revendeur`, `autre`, `sans-url`, `sans-source`. Coût et durée par appel (moyenne, médiane, max, p95).
La règle qui compte : **zéro valeur inventée** (`synthese.inventes`, attendu 0) et **zéro violation de M2** (`violationsM2`). Tolérance d'un nombre : le plus grand de 0,5 et de 1 % de la valeur.
La simulation fabrique 8 fautes (`FAUTES`) : le juge en voit 5 inventions, 1 « introuvable à tort », 1 faux, 1 source de blog ; le test le verrouille.

## Limites

- Les valeurs `a-reverifier` (9 produits) sont de mémoire : à relire avant la passe.
- Le banc ne passe pas par `aiTask` : il ne prouve ni l'authentification, ni le budget mensuel du serveur, ni le flux Firebase. Il prouve ce que le modèle rend pour la consigne et le schéma de production.
- Le juge ne lit que ce que la vérité contient ; un champ rendu hors vérité est `non-verifie`, jamais « juste ».
- Un seul tirage par produit (température 0) : la variance d'un appel à l'autre n'est pas mesurée.
- `npm --prefix functions run build` échoue dans ce worktree (le script `build-brewerHopAdviceSemanticSource4Portable.mjs` refuse le `node_modules` du dépôt parent) ; `tsc -p functions/tsconfig.json --noEmit` est vert.

## Objectif

Un banc prêt à une passe payante que le pilote lance lui-même : mesurer, sur 38 produits publics, ce que `lookupIngredient` rend pour compléter une fiche (juste, dans la plage, faux, inventé, source, introuvable à raison ou à tort, coût et durée par appel), dans les 10 CHF accordés le 08.11. Aucun appel Gemini réel dans cette voie.

## Décisions

- Le banc envoie le corps de production : `ai.ts` appelle maintenant `functions/src/geminiBody.ts` (texte de l'utilisateur et corps de la requête, mêmes octets qu'avant) ; la requête de la file et la porte « identifiable » sont dans `src/services/enrichissementRequete.ts` (réexportées par `enrichissementTravail.ts`). Aucun comportement de l'app ne change.
- Par défaut le banc appelle les 38 produits, la garde de f4 est notée ; `--selon-garde` applique la garde.
- Les valeurs `a-reverifier` restent dans la vérité, marquées, plutôt que d'être écartées : le pilote les relit avant la passe.

## Boucle de retour

La passe écrit `appels.json`, `jugement.json`, `JUGEMENT.md` et `raw/` dans `work/missions/2026-11-08-enrichissement/passes/<horodatage>/` (produits publics, rien du brasseur) et une ligne par tentative dans `journal-gemini.md`. Le pilote lit `JUGEMENT.md` : `inventes` doit valoir 0 ; chaque `introuvable-a-tort`, `a-corriger` ou source `blog-ou-revendeur` est un constat à verser aux bugs ; le coût réel par appel remplace les ESTIMATIONS de `enrichissementReglages.ts`.

## Sources

- Fiches lues le 08.11.2026 : fermentis.com (US-05, S-04, W-34/70), lallemandbrewing.com (Nottingham, Verdant IPA, Voss), weyermann.de (dix malts), nzhops.co.nz (Nelson Sauvin, Motueka).
- Plan d'origine : `work/missions/2026-10-31-ecran-depense/voies/f4-enrichir/PLAN.md` § 3.5 (commits c032e1a2, 95b91193).
- Banc modèle : `scripts/banc-lecture-facture.ts` ; garde : `scripts/paid-ai-test-guard.mjs`, `scripts/gemini-usage-bench-guard.mjs`.

## Passes payantes (08.11, pilote, accord « Bien tester ça budget 10chf »)

Trois passes, 27 appels, **9,33 CHF** (journal à part). Dossiers : `passes/20261108161023`, `…161056`, `…161257`.
- **0 valeur inventée, 0 α écrit sur un houblon (M2)** ; les 9 pièges rendent « introuvable » à raison (Zorbax, XQ-99, Levure Maison 42,
  levure de boulanger, Citra Zeta, « Malt Munich » et « Pilsner Malz » trop vagues, sucre cristal, « houblon amer 12 % »).
- Malts : EBC juste 10/12, 1 dans la plage (Maris Otter ★), Carafa Special II rendu en plage 1050–1250 (weyermann.de) contre 1100–1200 attendu : plage large, pas inventée.
- Levures : atténuation, température, tolérance, laboratoire, forme justes 4/4. La floculation est jugée « faux » 3/4 par le juge, à tort : la réponse est
  en français (« moyenne », « haute ») et la vérité en anglais ; une fois « Very High » (Nottingham, « High » chez Lallemand). À normaliser.
- Échecs : Nelson Sauvin, réponse tronquée (42 s, 0,39 CHF), pas de nouvel essai ; Idaho7 (chemin assistant houblon, vérité ★) « introuvable » à tort.
- **Coût réel 0,35 CHF par appel** (×5 l'estimation : la recherche web), 5 à 20 s. Avec le plafond actuel `PLAFOND_JOUR = 200`, le pire est ≈ 70 CHF par jour.

Verdict du pilote : fiable sur ce banc (rien d'inventé, pièges tenus). À faire avant d'allumer en production : plafond journalier bas, un nouvel essai
sur réponse tronquée, floculation normalisée. L'allumage (`VITE_ENRICHISSEMENT_IA=production`) est un geste facturé : il attend l'accord du brasseur.
