# Révision des tickets — houblons

Phase 5 de la mission #119, 18.10.2026. Les 60 issues ouvertes du dépôt ont
été lues (corps, critères, commentaires) et classées. Règle appliquée : décision
D8 (« il va falloir tout reprendre ») : l'atelier houblons V5.5 n'est pas réparé
sur place ; il sera remplacé après l'essai du prototype (porte B). Ce qui se garde
du backend est listé à la fin, avec sa preuve.

Aucune issue n'est supprimée. Une issue caduque est **fermée** avec sa raison et
un lien ; elle se rouvre si l'humain le décide. Chaque écriture GitHub va au
journal du registre de la mission.

## Bilan

| Verdict | Nombre |
|---|---|
| Garder | 18 |
| Réécrire | 1 |
| Fermer comme caduque | 41 |

Classement proposé par un agent Haiku, relu par Opus. Corrections du pilote : #44
gardé (réduit au diagnostic du harnais partagé) au lieu d'« à trancher » ; raison de
#107 précisée (budget mémoire B4).

## Garder

| Issue | Titre | Écran | Raison |
|---|---|---|---|
| #44 | [P1] V55-AI-02 — Recevoir le diagnostic sûr des HTTP 400 et le schéma REST actuel | non | Gardé et réduit au diagnostic du harnais partagé (`functions/src/brewerHarness.ts`) : le refus HTTP 400 vient du finish V6 du conseil houblon, mais le harnais sert aussi l’assistant, les jobs et la fiche levure. Choix prudent et réversible. |
| #91 | [P1] V55-AI-07 — Choisir l'usage de gemini-3.5-flash-lite et gemini-3.8-flash : agents et  | non | Choix du modèle et du niveau de réflexion par usage (tickets, assistant, IA générale) : à garder, en retirant le conseil houblon de la liste des usages ; la règle « 3.8 seul » est levée (correction du 16.10 dans le ticket). |
| #96 | [P2] V55-G38.a — Mineurs de « Gemini 3.8 seul modèle » relevés à la réception de #93 | non | Mineurs P2 de l'IA générale (budget « Dont Pro », erreurs de modèle, tests réels, libellés Rapide et Auto) : hors refonte houblons, à garder ; la règle « 3.8 seul » a été levée le 16.10 (#91), à réexaminer avec le routage par usage (#110). |
| #104 | [P2] V55-AI-07.b — Fiche levure : un fait mal formé fait rejeter toute la fiche, avec un m | oui | Fiche levure : une erreur sur un fait fait rejeter toute la fiche, avec un message faux sur les sources ; levure hors refonte houblons, à garder. |
| #105 | [P1] V55-AI-07.c — Lot JUS : justificatif scanné jusqu'au stock et à la compta (vrai rendu | oui | Lot JUS (justificatif scanné jusqu'au stock et à la compta) : en cours, hors refonte houblons ; il touche le stock que la refonte lit, à garder avec #111, #112 et #113. |
| #106 | [P2] TRI — Inventaire puis retrait, sur accord humain, du legacy, des données et du texte  | non | Inventaire puis retrait sur accord, demandé par l'humain le 16.10 : c'est le cadre pour retirer hopV55 et les dossiers hopDecision après accord ; TRI-2c et TRI-2d ont déjà été faits le 17.10 avec accord, rien d'autre sans accord. |
| #108 | [P2] V55-APP-01.4.a — Mineurs du brouillon d'édition et de la fraîcheur serveur relevés à  | oui | Mineurs du brouillon de recette générique (fraîcheur serveur, garde draftFinished, empreinte serverBase, retour au brouillon) : à garder ; seul le point R-m14 (écritures applyHopV55Change et conserveHopV55ColdEvidence) tombe avec l'atelier V5.5. |
| #109 | [P2] V55-AI-07.a.1 — Mineurs des défauts de production de l'IA relevés à la fermeture de # | oui | Défauts de production de l'IA (import Max hors délai, boucle de la fiche levure, coût nul) : hors refonte houblons, à garder. |
| #110 | [P2] V55-AI-07.d — Mineurs du routage Gemini par usage (IA-B) relevés par la V3 | non | Mineurs du routage Gemini par usage (IA générale, revue favorable, non déployé) : hors refonte houblons, à garder. |
| #111 | [P1] V55-AI-07.e — Lot JUS, suite après la fusion : lecture unique H13 (serveur, client) e | non | Suite du lot JUS : lecture unique H13 (serveur et client) et choix du modèle d'extraction ; hors refonte houblons, à garder. Parent déduit du texte (« suite du lot JUS (#105) »). |
| #112 | [P2] V55-AI-07.c.1 — Proposition automatique d'article de stock pour les lignes d'un justi | oui | Proposition automatique d'article de stock pour les lignes d'un justificatif, désactivée dans la PR #102 : lot JUS, hors refonte, à garder. Parent déduit du texte. |
| #113 | [P1] V55-AI-07.c.2 — V4 (validation UX indépendante) du lot JUS-1, en suivi après la fusio | oui | Validation UX indépendante du lot JUS-1, mise en suivi après la fusion de la PR #102 : hors refonte, à garder. Parent déduit du texte. |
| #115 | [P0] Houblons : classer tous mes houblons pour le style de la recette (stout comprise) et  | oui | Besoin principal du brasseur, en ses mots (tous mes houblons classés pour ma stout, comparer 2 à 4) : critère de la refonte, ticket de la mission à garder. |
| #116 | [P0] Houblons : retrouver ce qui s'est perdu entre les V5 / V5.5 essayées et la version en | non | Phase 2 de la mission : ce qui s'est perdu entre V1 et V5.5 et l'app ; le livrable est déjà publié dans docs/qualite/ce-qui-s-est-perdu.md ; à relire, puis à fermer par l'humain. Parent déduit du texte (piste de #115). |
| #118 | [P1] #114.a — Mineurs du lot #114 (bouton + flottant, levure, + du tableau de bord) relevé | oui | Mineurs non bloquants du lot #114 (bouton +, levure, + du tableau de bord) : à garder ; le premier mineur (en-tête du cadre de l'atelier V5.5 masqué sur téléphone) tombera avec l'atelier. |
| #119 | [P0] Mission refonte frontend houblons : besoins réels, specs, garde-fous, prototype (17.1 | oui | Mission en cours qui porte la refonte (besoins, specs, garde-fous, prototype) : à garder ; suit #115 et #116 (D7). |
| #120 | [P0] Données de production houblons : catalogue à 12 variétés, stock non normalisé, recett | non | Constat de lecture seule de la production : 12 variétés, 3 sans alpha, stock non relié à la variété, alpha 0 dans des recettes ; la refonte doit afficher l'inconnu, jamais 0. Ticket de la mission à garder. |
| #121 | [P1] Optimisation : l'app est devenue très lente, beaucoup de données chargées pour rien ( | oui | Lenteur mesurée le 17.10 (3,4 Mo gzip de JS, atelier Host de 1,89 Mo) : la refonte doit rendre l'écran houblons léger ; ticket de la mission à garder. |

## Réécrire

| Issue | Titre | Écran | Raison |
|---|---|---|---|
| #42 | [P1] V55-BE-04 — Vérifier création et enrichissement des six familles de catalogue | non | Besoin réel, mais écrit en « six familles » et « capacités canoniques » V5.5 ; sa partie houblon rejoint #120, et sa preuve se refait sans #38. |

- #42, nouveau titre : « Catalogue : ajouter ou compléter un houblon (ou une levure, un style) sans doublon, puis le retrouver ». Besoin : Quand une variété me manque, je l'ajoute, je complète son alpha et ses notes, et je la retrouve ensuite sans doublon, sans tout ressaisir.

## Fermer comme caduque

Raison commune : le ticket porte sur l'atelier V5.5 (adoption « canonique », reçus,
CAS, conseil houblon V6, réception de la release V5.5), remplacé par la refonte
(#119, D8). Les besoins réels qu'il portait passent dans l'épopée « Houblons pour le
brasseur ».

| Issue | Titre | Écran | Raison |
|---|---|---|---|
| #21 | [EPIC][P0] V5.5 dans le vrai créateur de recette | oui | Épopée qui fait de V5.5 l'étape Houblons du vrai créateur ; D8 tranche : l'atelier V5.5 n'est pas réparé sur place et sera remplacé après prototype validé (piste B de #115 écartée). |
| #22 | [EPIC][P0] Fiabiliser le backend et les calculs V5.5 | non | Épopée de services V5.5 (adoption, reçus, CAS, fixtures V6, catalogues) ; les calculs gardés (Tinseth, moments, dose de remplacement, comparaison) n'ont pas besoin de ce cadre, et la lenteur relève de #121. |
| #23 | [EPIC][P1] Recevoir le parcours Gemini natif et corrigible | oui | Épopée du parcours Gemini du conseil houblon V5.5 (UI, proposition, application) ; le conseil houblon assisté est inutile pour la refonte, alors que la passerelle Gemini et le budget restent. |
| #25 | [EPIC][P0] Qualifier la release V5.5 et fermer les réserves | non | Épopée de réception de la release V5.5 : sans objet puisque l'atelier V5.5 est remplacé (D8) ; seul le code gardé sera qualifié, dans la refonte. |
| #27 | [P0] V55-BE-06 — Corriger Q09 sur le catalogue complet sous 60 s | non | Chronomètre de la réponse V5.5 à la question Q09 sur le catalogue complet (borne 60 s) : test d'une réponse qui sera refaite ; la lenteur générale de l'app relève de #121. |
| #35 | [P1] V55-APP-05 — Recevoir la fidélité fonctionnelle de V5.5 intégrée | oui | Recette de fidélité de V5.5 intégrée : l'atelier est remplacé ; ses besoins (catalogue, lots et COA, nuances, comparaison, histoire, gestes directs) passent dans la nouvelle spécification (#115, #119). |
| #36 | [P0] V55-BE-01 — Recevoir les propositions corrigibles et leur adoption canonique | non | Propositions V6 et adoption canonique : mécanique propre à l'atelier V5.5 (reçus, confirmations, adoption), absente du besoin du brasseur. |
| #38 | [P0] V55-BE-01.2 — Créer ou enrichir depuis une proposition avec confirmation et reçu atom | non | Création ou enrichissement depuis une proposition avec reçu atomique : mécanique V5.5 de reçus, hors besoin du brasseur. |
| #39 | [P0] V55-BE-01.3 — Raccorder le contexte natif du brouillon aux services assistés | non | Raccord du contexte natif du brouillon aux services d'aide houblon V5.5 : caduc avec le conseil assisté ; le brouillon de recette générique reste à garder, hors de ce ticket. |
| #41 | [P0] V55-BE-03 — Qualifier la fixture native et sa configuration budgétaire | non | Fixture native du pipeline V5 du conseil houblon (Auth, file, worker) : caduque ; la passerelle Gemini et le budget (functions/src/brewerBudget.ts) restent et se testent hors de ce ticket. |
| #43 | [P1] V55-BE-05 — Prouver la parité des résultats métier entre outils et UI | non | Parité entre outils Gemini et UI V5.5 : caduque avec le conseil assisté ; la règle « pas de calcul parallèle à l'écran » est à reprendre dans les garde-fous de la refonte. |
| #45 | [P1] V55-AI-03 — Recevoir la proposition corrigible sans mutation non autorisée | oui | Proposition corrigible du conseil houblon V5.5 (refus de mutation, choix avant application) : caduque avec le conseil assisté. |
| #46 | [P1] V55-AI-01 — Obtenir un parcours Gemini réel complet et traçable | non | Essai Gemini réel du conseil houblon V5.5 : deux tentatives ont échoué en HTTP 400 ; fermer ce ticket n'ouvre aucun nouvel appel réel. |
| #47 | [P1] V55-AI-04 — Éprouver création et enrichissement assistés sur fixtures isolées | non | Création et enrichissement assistés par le conseil houblon V5.5 sur fixtures : caduc ; le besoin de créer une variété est repris par la réécriture de #42. |
| #49 | [P1] V55-AI-06 — Recevoir le chemin UI vers Gemini et retour jusqu’à application | oui | Tranche UI → Gemini → proposition → application du conseil houblon V5.5 : caduque avec l'atelier remplacé. |
| #55 | [P0] REL-01 — Classer et fermer les 27 échecs du gel initial | non | Triage des 27 échecs de la suite gelée V5.5 : ils visent l'atelier remplacé ; les échecs qui resteraient hors atelier relèvent de npm test, pas de ce ticket. |
| #57 | [P0] REL-04 — Qualifier la révision intégrée puis la version réellement déployée | non | Qualification de la révision V5.5 puis de la version déployée (le 17.10 à 16:42) : sans objet après D8 ; le principe « version servie identifiée avant test » se reprend dans les garde-fous de la refonte. |
| #59 | [P1] REL-04.2 — Tester le vrai créateur sur l’application réellement déployée | oui | Essai connecté du créateur V5.5 sur l'app déployée : parcours de l'atelier remplacé ; le volet « scan de justificatif » relève de #105 et doit être gardé. |
| #60 | [P1] REL-05 — Tenir la matrice exigences, implémentation, preuves et réserves | non | Matrice de traçabilité V5.5 : sans objet ; la traçabilité de la refonte est tenue dans work/refonte-frontend (GATES, registre). |
| #61 | [P0] REL-06 — Prononcer la réception V5.5 sur les résultats vérifiés | non | Décision de réception V5.5 : sans objet après D8 ; la mission refonte a sa propre porte de réception. |
| #67 | [P0] V55-BE-01.2.3 — Ajouter le CAS et l’idempotence au workspaceRepository | non | CAS et idempotence du dépôt de recette pour l'adoption V5.5 : mécanique de reçus, hors besoin du brasseur. |
| #68 | [P0] V55-BE-01.2.4 — Prouver confirmation, rejeu après panne et concurrence en parcours na | oui | Scénarios de confirmation, rejeu après panne et concurrence dans le créateur V5.5 : caduc avec l'adoption par reçus. |
| #70 | [P0] V55-BE-03.2 — Qualifier le parcours natif au format V6 sur fixtures isolées | non | Qualification du format V6 du conseil houblon sur fixtures : caduque, sans objet pour le brasseur. |
| #72 | [P0] REL-01.2 — Préserver les routes documentaires V1 vers V2/V3 | non | Routes de lecture V1 vers V2/V3 de l'atelier houblons (codecs, archives) : inutiles pour la refonte. |
| #73 | [P0] REL-01.3 — Classer les 7 échecs de lecture et d’interface | oui | Classement des 7 échecs de lecture et d'interface des pages V5.5 : caduc avec l'atelier remplacé. |
| #78 | [P1] V55-APP-05.3 — Contre-vérifier exploration et comparaison dans V5.5 intégrée | oui | Contre-revue de l'exploration et de la comparaison V5.5 : le besoin (comparer 2 à 4 houblons en 3 touchers au plus, D10) est repris dans #115 et #119. |
| #79 | [P1] V55-APP-05.4 — Contre-vérifier décisions, programme, histoire et usages hors recette | oui | Contre-revue des décisions, du programme et de l'histoire dans l'atelier V5.5 : caduque ; les besoins d'explication des choix et de leurs contreparties sont repris dans #119. |
| #84 | [P0] V55-BE-01.2.4.2 — Prouver le refus d’une confirmation native devenue périmée | non | Refus d'une confirmation devenue périmée dans l'adoption V5.5 : scénario de reçus et de CAS, caduc. |
| #85 | [P0] V55-BE-01.2.4.3 — Retrouver le même reçu après panne et reprise dans le créateur | oui | Même reçu après panne et reprise dans le créateur V5.5 : scénario de reçus, caduc avec l'adoption. |
| #86 | [P0] V55-BE-01.2.4.4 — Garantir une seule adoption pour deux confirmations concurrentes | oui | Une seule adoption pour deux confirmations concurrentes : scénario CAS de l'adoption V5.5, caduc. |
| #87 | [P0] V55-BE-01.3.1 — Porter une identité canonique de brouillon Wizard distincte de Recipe | non | Identité canonique du brouillon Wizard pour l'adoption V5.5 (sources V3 et V6, Source4) : caduque ; le brouillon de recette générique, lui, reste gardé. |
| #88 | [P0] V55-BE-01.3.2 — Raccorder Host, compagnon et Wizard au contrat de source reçu | oui | Raccord des hôtes V5.5 (Host, compagnon, Wizard) au contrat source V6 : caduc avec l'atelier. |
| #90 | [P1] V55-APP-05.5 — Auditer spidergraphs, radars et fidélité des visualisations intégrées | oui | Audit des radars et spidergraphes V5.5 : caduc ; le choix de la visualisation de comparaison se tranche dans le prototype de #119. |
| #92 | [P2] REL-01.4.1.a — Mineurs de lecture et d'affichage relevés à la réception de #82 et #74 | oui | Mineurs de lecture et d'affichage de la page V5.5 (lecture des quantités, correction de lecture) : caducs avec l'atelier remplacé. |
| #94 | [P2] V55-APP-05.1.a — Mineurs de l'essai d'exploration et des boutons de la Page V5.5 (apr | oui | Mineurs de l'essai d'exploration et des boutons de la page V5.5 : caducs avec l'atelier remplacé. |
| #95 | [P2] V55-APP-01.a — Mineurs du lot persistance et de l'application relevés à la réception  | non | Mineurs de persistance et d'application du programme V5.5 au brouillon : caducs avec le créateur V5.5. |
| #98 | [P2] V55-BE-02.a — Mineurs du programme froid relevés à la réception de #40 et #64 | oui | Mineurs des écrans et textes V5.5 du programme froid (page, panneau froid, boutons) : caducs ; le calcul froid gardé se revérifie avec la refonte. |
| #99 | [P2] V55-AI-05.a — Mineurs relevés à la réception de #48 (faits, hypothèses et estimations | non | Mineurs des faits, hypothèses et estimations du conseil houblon V5.5 : caducs avec le conseil assisté. |
| #101 | [P2] V55-APP-04.a — Mineurs du lot ergonomie relevés à la réception de #33, #34, #75, #81 | oui | Mineurs d'ergonomie de l'atelier V5.5 (Explorer, programme, dose affichée) : caducs avec l'atelier remplacé. |
| #103 | [P1] V55-AI-02.a — Conseil houblons V6 refusé par l'API (HTTP 400) : finish V6 trop comple | non | Conseil houblons V6 refusé par l'API à chaque appel (HTTP 400) : V6 du conseil houblon, caduc pour la refonte. |
| #107 | [P1] V55-AI-05.b — Atelier houblons : l'onglet monte à 3,5 Go en comparant ou appliquant u | oui | Mémoire de l’atelier V5.5 (3,3 à 3,6 Go) en comparant : l’atelier est remplacé, pas réparé (D8). Le besoin reste couvert par le budget mémoire B4 (120 Mo, `scripts/check-hop-budget.mjs`) et par #121. |

## Épopée « Houblons pour le brasseur »

Une épopée et 7 tickets, écrits avec les mots du brasseur et le gabarit
`.github/ISSUE_TEMPLATE/interface.yml`. Chaque corps cite au moins une phrase du
corpus et une question de la banque, vérifiées mot pour mot par
`scripts/check-issue-closure.mjs --body-file`.

| Ticket | Questions | Besoin |
|---|---|---|
| Épopée | Q01 à Q30 | Mes houblons classés pour ma bière, comparés, simulés, remplacés ; utilisable avant tout (C001, C002, C165) |
| Choisir | Q01, Q03, Q21, Q24 | Un toucher, sans défiler, mes houblons classés pour le style, avec la quantité (C002, C011) |
| Comparer | Q02, Q16 | 2 à 4 houblons côte à côte, seulement les écarts (C001, C068) |
| Simuler | Q15, Q17, Q20, Q25 | IBU et arôme mis à jour en moins d'une seconde, unités séparées (C006, C015, C049) |
| Remplacer | Q05, Q06, Q18, Q30 | Remplaçants classés, stock d'abord, dose au même IBU, gagné et perdu (C031, C032, C055) |
| Données de style | Q01, Q21, Q22, Q23 | Usages par style sourcés, stout comprise (C011, C013) |
| Questions | Q04, Q07 à Q14, Q19, Q22, Q26 à Q29 | Réponse courte d'abord, ou « non documenté » (C062, C080) |
| Garde-fous | Q01, Q02, Q03 | Contrôles sur mes vraies données, clôture refusée sans preuve (C043, C165) |

Les tickets existants #115 (besoin), #116 (pertes), #120 (données de production) et
#121 (lenteur) sont rattachés à l'épopée.

## Backend : ce qui se garde

Preuve détaillée : [ce-qui-s-est-perdu.md](ce-qui-s-est-perdu.md), section « Ce que
le backend permet de récupérer », et `work/refonte-frontend/phase2/backend-recuperable.md`.

| Élément | Fichier | Verdict | Preuve |
|---|---|---|---|
| IBU à chaud (Tinseth) | `src/services/brewingMath.ts` | garder tel quel | 20 fichiers de test, 315 cas ; formule relue (l. 96-141) |
| Moments d'ajout | `src/domain/hopStage.ts` | garder tel quel | 55 cas ; utilisé par 5 écrans |
| Dose de remplacement | `src/domain/hopDecision/calculations.ts` | garder tel quel | `replacementHopDose` l. 30 ; 55 cas |
| Comparaison de programmes | `src/domain/hopDecision/programAnalysis.ts` | garder tel quel | `compareHopPrograms` l. 53 ; 40 cas |
| Règles des produits | `src/domain/hopDecision/products.ts` | garder tel quel | 6 produits, sources fabricant ; 69 cas |
| Modèle aromatique | `functions/src/hopExtrapolationCore.ts` | garder tel quel | utilisé par 3 écrans |
| Passerelle Gemini et budget | `functions/src/ai.ts`, `functions/src/brewerBudget.ts` | garder tel quel | Gemini jamais dans `npm test` |
| Rôles par style | `src/domain/hopRecipeDesign.ts` | garder après correction | l. 29 : `examples: []` pour la stout |
| Substitution | `src/domain/hopDecision/substitution.ts` | garder après correction | l. 26 : « No aroma score » |
| Couche `src/services/hopV55/` | 67 fichiers, ≈ 42 900 lignes | inutile pour la refonte | archives, codecs V1-V6 ; retrait seulement sur accord (#106) |
| Conseil houblon assisté | fichiers « brewerHopAdvice » de `functions/src/` | inutile pour la refonte | indisponible par défaut dans l'app ; refus HTTP 400 (#103) |
