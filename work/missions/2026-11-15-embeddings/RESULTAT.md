OK — banc d'embeddings Gemini mesuré (0,41 CHF) : Flash-Lite classe le mieux, embeddings-2 coûte presque zéro

Fichiers : `work/missions/2026-11-15-embeddings/` : `MISSION.md` (État de l'art, vérités), `corpus.ts` (corpus et vérités à la main), `banc.ts` (banc payant et simulé), `modeles.mjs` (liste des modèles, sans coût), `resultats.json` (chiffres, détail par requête). Journal : section « 15.11 » de `work/missions/2026-11-08-enrichissement/journal-gemini.md`. Rien dans `src/` ni `functions/`.

## Modèle d'embedding actuel (vérifié par l'API le 15.11)
`models.list` rend `gemini-embedding-2` (stable, 8 192 jetons d'entrée, multimodal, 0,20 $ le million de jetons de texte, payant) et `gemini-embedding-001` (2 048 jetons, 0,15 $). Les deux sont mesurés, à 768 dimensions. Le 2 demande des préfixes de tâche dans le texte (`task: search result | query: …`) ; le 001 prend `taskType`.

## Résultats (relire `resultats.json` ; n petit : des indices, pas des preuves)
Coût par pièce = coût de la requête au moment de l'usage (l'indexation des entrées est un coût unique : 0,0002 à 0,003 CHF par corpus et par modèle). Latence : requête seule, mesurée sur l'appel réel.

| Tâche (n) | Méthode | Rappel@1 | Rappel@3 | Latence p50 / p95 | Coût par pièce (CHF) |
|---|---|---|---|---|---|
| T1 ligne → besoin (27 avec besoin, 17 sans) | Fuse seul | 11/27 | 11/27 | 0 / 1 ms | 0 |
| | Embeddings 2 | 26/27 | 27/27 | 317 / 384 ms | 0,000004 |
| | Embeddings 001 | 22/27 | 25/27 | 239 / 274 ms | 0,0000025 |
| | Hybride RRF | 26/27 | 27/27 | 317 / 384 ms | 0,000004 |
| | Flash-Lite classeur | **27/27** | 27/27 | 599 / 691 ms | 0,00038 |
| | Hybride + Flash-Lite | 26/27 | 27/27 | 912 / 998 ms | 0,00021 |
| T2 note → rubrique (40) | Fuse seul | 1/40 | 1/40 | 1 / 1 ms | 0 |
| | Embeddings 2 | 32/40 | 39/40 | 293 / 351 ms | 0,000007 |
| | Embeddings 001 | 35/40 | 40/40 | 234 / 263 ms | 0,000008 |
| | Hybride RRF | 32/40 | 39/40 | 294 / 352 ms | 0,000007 |
| | Flash-Lite classeur | **39/40** | 39/40 | 558 / 685 ms | 0,00023 |
| T3a houblon proche de X (30) | Fuse seul | 3/30 | 6/30 | 27 / 32 ms | 0 |
| | Embeddings 2 | 6/30 | 6/30 | 303 / 345 ms | 0,000017 |
| | Embeddings 001 | 7/30 | 7/30 | 231 / 262 ms | 0,000017 |
| | Hybride RRF | 3/30 | 5/30 | 331 / 373 ms | 0,000017 |
| | Flash-Lite classeur | 3/30 | 7/30 | 702 / 909 ms | 0,0048 |
| | Hybride + Flash-Lite | 4/30 | 7/30 | 944 / 1072 ms | 0,00043 |
| T3b houblon en mots libres (13) | Fuse seul | 0/13 | 0/13 | 11 / 16 ms | 0 |
| | Embeddings 2 | 8/13 | 8/13 | 300 / 370 ms | 0,0000056 |
| | Embeddings 001 | 3/13 | 7/13 | 264 / 359 ms | 0,000006 |
| | Hybride RRF | 8/13 | 8/13 | 311 / 386 ms | 0,0000056 |
| | Flash-Lite classeur | **10/13** | 12/13 | 696 / 770 ms | 0,0048 |
| | Hybride + Flash-Lite | 8/13 | 10/13 | 899 / 1320 ms | 0,0004 |

T1, abstention (le circuit « scan relié, besoin sorti de la liste » ne doit pas lier une ligne de malt) : seuil réglé sur les lignes de rang pair, jugé sur les 22 de rang impair (10 sans besoin, 12 avec). Flash-Lite classeur : 9/10 sans-besoin rejetés, 12/12 liens justes, 1 faux lien. Embeddings 2 : 9/10 rejetés, 11/12 liens justes, 1 faux lien. Hybride : 10/10 rejetés mais 6/12 liens justes. Fuse : 0/10 rejetés (il lie tout).

Première passe de T3a, sur tous les houblons : 2 à 4 sur 30 au rang 1 pour chaque méthode. Cause : les substituts d'un houblon d'amérisation se choisissent sur l'alpha, absent des fiches du corpus. Passe retenue : houblons aromatiques et à double usage seulement. Même alors, aucune méthode ne dépasse 23 % (rang 3) : la source range ses substituts par filiation et usage, pas par arômes notés de 0 à 5.

## Lecture d'expert
- Embeddings battent Fuse partout où la requête est une phrase ou une langue autre que celle des entrées (« Gärtank 30 Liter » trouve « Fermenteur inox 30 L »). Fuse tel qu'installé (seuil 0,4, requêtes longues) ne trouve presque rien en T2 et T3 : il sert à saisir un nom, pas à comprendre une phrase.
- Hybride : ne bat jamais le meilleur de ses deux membres ici ; il rend le même rang 1 que les embeddings en T1, T2, T3b. Fuse est trop faible pour l'aider. Pas de gain, donc pas de raison de l'ajouter.
- Réordonnancement (hybride + Flash-Lite) : moins bon et plus lent que le classeur sur la liste entière, tant que la liste tient en quelques milliers de jetons.
- `gemini-embedding-2` bat le 001 en T1 et T3b ; le 001 le bat en T2 (35 contre 32 sur 40, écart de 3 pièces). Pas de raison d'utiliser le 001.
- T3a : aucune méthode ne retrouve les « substituts ». La proximité de houblons reste au moteur de substitution déterministe (score selon le moment et le rôle), pas aux embeddings.

## Recommandation
1. **T1 (lier une ligne à un besoin)** : Flash-Lite classeur, la liste des besoins « À venir » dans le prompt (24 besoins tiennent dans 1 000 jetons), réponse « aucun » permise. Proposition au brasseur, jamais un lien posé seul. Si la liste dépasse environ 150 besoins : présélection par embeddings-2 (rappel@3 100 %), puis classeur.
2. **T2 (ranger une note)** : Flash-Lite classeur, les 5 rubriques et leurs exemples dans le prompt (39/40). Les embeddings-2 seuls (32/40, 80 %) suffisent pour une suggestion à la frappe, à 300 ms.
3. **T3b (houblon décrit en mots)** : Flash-Lite classeur (10/13, rang 3 : 12/13) ; embeddings-2 si le coût compte (8/13). Fuse seul : à écarter.
4. **T3a (« proche de X »)** : ne pas utiliser d'embeddings ; garder le moteur de substitution.
5. Pas d'index vectoriel : 181 entrées, cosinus exact en moins d'une milliseconde.

Coût mensuel estimé, hypothèses du pilote à corriger : 120 lignes de devis, 60 notes, 30 recherches de houblon par mois, tarif provisionné (1,25 CHF/USD) :
- recommandation (classeur sur T1, T2, T3b) : 120 × 0,00038 + 60 × 0,00023 + 30 × 0,0048 ≈ **0,20 CHF par mois** ; même avec dix fois ces volumes : 2 CHF ;
- embeddings-2 seuls pour les trois : ≈ 0,002 CHF par mois (rang 1 : 96 %, 80 %, 62 %) ;
- indexation unique : 0,003 CHF.
Dépense du banc : 0,41 CHF au tarif provisionné, sur 5 CHF accordés et 4,50 de plafond dur (compteur du banc ; ce n'est pas une facture Google).

## Cache de contexte du compagnon (sans appel)
Le cache explicite n'est pas actif. Aucun fichier de `functions/` n'appelle `createCachedContent` ni `cachedContents`. Le seul `cachedContent` de `functions/src` est une garde : `geminiCosts.ts` ligne 92 refuse toute requête qui en porte un (« Cette option Gemini n'a pas de budget vérifiable »), et la ligne 165 compte l'entrée en cache au plein tarif. Le « cache » d'`ai.ts` est celui des résultats (empreinte du document dans le registre), pas celui de Gemini. Le cache implicite de Google, automatique, ne se voit pas dans le code ; le budget ne compte aucun rabais. L'API liste pourtant `createCachedContent` pour `gemini-3.5-flash-lite`.

## Doutes et limites
- n petit (13 à 44) : des indices ; un écart d'une pièce n'est pas un résultat (T1 : 26 ou 27 sur 27).
- Les notes de T2 et les besoins de T1 sont inventés par Claude, comme le classeur : ils sont probablement plus lisibles que les vraies notes du brasseur, ce qui flatte tous les modèles. À rejouer sur de vraies notes, anonymisées par lui, avant de brancher quoi que ce soit.
- T1 : les lignes viennent de fixtures (fournisseurs fictifs) ; les lignes ambiguës (joint torique, tuyau PVC, vanne) sont écartées, pas jugées. Le vrai catalogue de pièces est plus bruité.
- Pas de tâche « recette proche » : aucun corpus de recettes public et anonymisé dans le dépôt.
- Lexical : Fuse tel qu'installé ; BM25 (référence du domaine) non mesuré faute de bibliothèque dans le paquet. Un lexical correct ferait mieux que 1/40 en T2, probablement pas autant que les embeddings en T1 allemand.
- T3b : vérité écrite par Claude (savoir du brasseur à confirmer par lui, L14), 13 requêtes seulement.
- Latences mesurées depuis ce poste, sans charge ; embeddings via une requête par texte (pas de lot).
- Essais : 1 essai de fumée (2 lignes), 2 passes complètes (la 2e après correction du filtre de T3a, la 1re gardée ci-dessus), banc simulé vert avant.

DÉCISION À PRENDRE : brancher une suggestion de lien devis ↔ besoin (T1) dans l'écran Dépense, avec Flash-Lite en classeur ? Options : (a) oui pour T1 seul, proposition confirmée par le brasseur ; (b) T1 et T2 ; (c) rien, rejouer d'abord sur de vraies notes et de vraies lignes anonymisées. Recommandation : (a), puis rejouer T2 sur de vraies notes avant (b). Un service Flash-Lite dans `functions/` et un écran à dessiner (choix du brasseur, mini maquettes) dépassent ce banc.

CONNAISSANCE : gemini-embedding-2 (15.11) est le modèle d'embedding actuel : 0,20 $ le million de jetons de texte, préfixes de tâche dans le texte, `outputDimensionality` accepté (768 mesuré) ; une requête coûte environ 0,000004 CHF et dure 300 ms. Sur 24 à 181 entrées, un classeur Flash-Lite lisant la liste entière bat les embeddings au rang 1 pour 0,0002 à 0,005 CHF la pièce. Le cache de contexte explicite du compagnon est absent (garde `geminiCosts.ts:92`).

LEÇON PROPOSÉE : aucune
