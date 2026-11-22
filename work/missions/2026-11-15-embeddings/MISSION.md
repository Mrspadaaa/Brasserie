# Banc d'embeddings Gemini : lier, ranger, trouver (15.11)

## Objectif
Ses mots : « 5chf Max de budget et oui ». Accord : un banc d'embeddings Gemini, 5 CHF au plus ; le pilote fixe l'arrêt dur à 4,50 CHF.
Question : pour relier une ligne de devis à un besoin « À venir », ranger une note de l'Atelier, trouver un houblon proche, les embeddings
valent-ils mieux que Fuse, et que Flash-Lite en classeur ? Mesures : rappel@1 et @3, latence, coût par pièce.
Hors portée : tout code de production (`src/`, `functions/`), tout déploiement, toute donnée réelle. Le banc ne branche rien.

## Possède
`work/missions/2026-11-15-embeddings/` (MISSION.md, RESULTAT.md, `banc.ts`, `corpus.ts`, `modeles.mjs`, `resultats.json`, `resultats-simule.json`) et la
section « 15.11 » de `work/missions/2026-11-08-enrichissement/journal-gemini.md`.

## Tâches et vérités (écrites à la main, rien de personnel)
| Tâche | Entrées | Requêtes | Vérité |
|---|---|---|---|
| T1 ligne de devis -> besoin « À venir » | 24 besoins inventés (titre + à quoi ça sert, forme d'un `FinancialPlan` d'équipement) | 44 lignes de fixtures déjà dans Git (cases.json, vision, vision-2, h13-0811) : 27 ont un besoin, 17 n'en ont aucun (malt, houblon, livraison, remise) | un besoin par ligne, ou aucun ; une ligne ambiguë est laissée de côté |
| T2 note en vrac -> rubrique de l'Atelier | 5 rubriques (`CreativeItem['type']`) + 3 exemples chacune | 40 notes inventées, au ton d'un brasseur pressé | une rubrique (deux admises pour N31 et N39) |
| T3a houblon proche de X | 181 fiches publiques (`hopBeerMaverickFiches.json`, arômes 0 à 5, styles) | 30 houblons aromatiques ou à double usage, tirés un sur trois | substituts publiés par la source, présents dans le corpus |
| T3b houblon décrit en mots libres | les mêmes 181 fiches | 13 demandes écrites à la main | listes admises écrites à la main (savoir du brasseur), noms vérifiés contre le corpus |

Pas de tâche « recette proche » : aucun corpus de recettes anonymisé et public dans le dépôt (les recettes du brasseur sont des données personnelles). Dit au rendu.

## État de l'art (L29)
- Problème type : liaison d'entités (entity linking : relier une mention, ici une ligne de facture, à une entrée d'un référentiel, ici les
  besoins) et recherche sémantique (retrouver les entrées proches d'une requête) ; la tâche T2 est une classification de textes courts avec
  quelques exemples par classe.
- Examiné :
  1. lexicale : Fuse.js (déjà dans `src/services/search.ts`, accents normalisés, seuil 0,4) ; la référence du domaine est BM25, non installée (aucune
     bibliothèque lexicale de plus dans le paquet : `minisearch` ou `flexsearch` seraient à ajouter) ;
  2. embeddings et cosinus (kNN) : `gemini-embedding-2` (modèle actuel, listé par l'API le 15.11, 8 192 jetons d'entrée, texte payant 0,20 $ le
     million) et `gemini-embedding-001` (précédent, 0,15 $) ; préfixes de tâche recommandés par la documentation pour le 2 (`task: search result | query:`
     et `title: … | text: …`), `taskType` pour le 001 ; 768 dimensions (réduction par Matryoshka, même prix) ;
  3. hybride : fusion de rangs RRF (Cormack et al., 2009, k = 60), la méthode standard sans réglage de poids ;
  4. réordonnancement par un LLM : Flash-Lite (`gemini-3.5-flash-lite`) lit la présélection de l'hybride (10 entrées) et rend un classement ;
  5. classeur : le même Flash-Lite lit la liste entière (24 besoins, 5 rubriques, 181 houblons) et rend trois identifiants au plus, ou rien.
  Écartés sans mesure : base vectorielle ou index approché (HNSW) : le corpus compte 24 à 181 entrées, un cosinus exact prend moins d'une
  milliseconde ; réentraînement ou réglage fin : pas de volume.
- Décision : mesurer les cinq méthodes sur les mêmes requêtes, à vérité écrite avant les appels ; aucune méthode maison (pas de bricolage lexical
  sur Fuse : il est mesuré tel qu'installé). Le seuil d'abstention de T1 se règle sur les lignes de rang pair et se juge sur celles de rang impair
  (L20). Sous 40 pièces, un indice, pas une preuve (skill banc-lecture) : chaque chiffre porte son n. Aucune bascule, aucun code de production.

## Règles du banc
Appels réels dans `banc.ts` seul (`--payant --confirm-paid-ai`), lancé à la main, jamais dans `npm test`. Clé lue par `readLocalKey`, jamais affichée.
Coût réservé avant chaque appel (Flash-Lite : `quoteGeminiCost` ; embeddings : jetons × tarif), arrêt dur à 4,50 CHF, un appel payé n'est pas repayé (cache
hors dépôt). Journal : une ligne par appel de classeur et par lot d'embeddings, section 15.11 de `work/missions/2026-11-08-enrichissement/journal-gemini.md`.
Commande : `npx vite-node --config vitest.config.ts work/missions/2026-11-15-embeddings/banc.ts -- --payant --budget-chf 4.5 --confirm-paid-ai`.
Simulation sans réseau : même commande avec `--simuler` (`BANC SIMULE OK`).

## Décisions
| Décision | Options | Décideur | État |
|---|---|---|---|
| Budget | 5 CHF au plus ; arrêt dur à 4,50 CHF | brasseur | tranchée : « 5chf Max de budget et oui » |
| Modèle d'embedding | gemini-embedding-2 (actuel) ; gemini-embedding-001 (témoin) | pilote | tranchée : les deux mesurés, le 2 retenu comme principal |
| Bascule en production | recommandation du RESULTAT.md | pilote | ouverte : rien ne change dans src/ ni functions/ avant son accord |

## Voies
| Voie | Objectif | Niveau | Agent | Modèle | Plafond | Possède | Dépend de | Contrôles | Décideur | Étape |
|---|---|---|---|---|---|---|---|---|---|---|
| embeddings | banc T1, T2, T3 et recommandation chiffrée | jugement | auteur | sonnet | 60 | work/missions/2026-11-15-embeddings/** | — | BANC SIMULE OK ; BANC PAYANT FINI ; dépense ≤ 4,50 CHF | pilote | — |

## Boucle de retour
Échec de voie : relance par le pilote (2 au plus), puis contrat réécrit. Un chiffre du RESULTAT se relit dans `resultats.json`, jamais ailleurs.

## Sources
- `src/services/search.ts` (Fuse), `functions/src/geminiCosts.ts`, `functions/src/models.ts`, `scripts/gemini-usage-bench-guard.mjs`
- https://ai.google.dev/gemini-api/docs/embeddings et /pricing (lus le 15.11)
- `cerveau/agents/gemini-tests-reels.md`, `.claude/skills/banc-lecture/SKILL.md`