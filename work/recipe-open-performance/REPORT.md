# Consultation des recettes — correctif isolé et preuves

**Publication autorisée puis effectuée le27 septembre2026 à21:28:57UTC** : PoC + correctif performance, sans refonte Levure non commise. Source9aa5132 (application inchangée depuis95fb74c, correction de test seulement). Firebase release1790544537116000/version6e99e40977bf97a7, [site publié](https://brasserie-l-affinee.web.app). Batterie complète4806/4806,320fichiers ;33Functions et Hosting publiés via npm run deploy,16assets publics vérifiés identiques au build. [Preuve de publication](deploy-2026-09-27/release-result.json). Les sections ci-dessous conservent les preuves d'avant publication ; le gain Android après cette release reste à mesurer.

**Contrôle authentifié PC après publication réussi**, effectué par le fil pilote à21:53:32UTC : modules index-B2Sz5FzH.js/App-0kP1eOlI.js confirmés après reload, fiche complète et premier rapport aromatique, retour/réouverture, éditeur/focusNom sans saisie, restitution du focus. Aucun warning/error retourné dans la lecture finale. Aucun geste de sauvegarde/IA/stock/brassage. Rapport et captures en Downloads, hors Git ; preuve attribuée au pilote, non répétée par ce fil. Elle confirme le parcours fonctionnel sur la bonne version, sans chronométrage CUA ni preuve Android après correction.

Le correctif rend la consultation locale nettement plus rapide, y compris le premier accès direct depuis une liste déjà utilisable. Il conserve les informations et les capacités de la fiche, les calculs, la modification, le hors ligne et les recettes figées des brassins. Le délai initial sur Xiaomi est confirmé ; le gain du correctif sur ce téléphone reste à vérifier après intégration/publication autorisée séparément.

Branche `codex/recipe-open-performance`, worktree `C:/Users/mrspa/.codex/worktrees/recipe-open-performance/Brasserie`. Correctif et tests : `e04b856e24ff2b41489c92c374cacdd9c4c2fa27`, puis complément documentaire/recherche `c2891156bcf946e0457fbe68f38bd8eadfb5aff1`, sur base `5a49cc51ba4d37ef4300e6404c0c989d22d10425`. Le checkout Levure `C:/Users/mrspa/Documents/Brasserie` n'a reçu aucune édition, modification d'index ou de branche de cette mission.

## Comparaison finale

Les séries de 20 ci-dessous portent sur **e04b856**, avant le complément documentaire. Leur entrée QA prépare des références lors de l'installation des fixtures ; elles ne démontrent pas une bibliothèque absolument froide. Les deux versions ont exactement ce même contexte. Le dernier contrôle ciblé évite cette préparation et porte sur **c289115**.

**Dernier contrôle de première construction**, 3 essais avant/après à 390 px CPU6× : aucune connaissance personnelle, aucun guidePredictionKnowledge ni table préinstallée, recettes injectées directement dans le repo sans enrichissement de sauvegarde. Première fiche médiane **1262→280 ms**, après min279/max296 ; réouverture613→190 ; arôme45→136 et analyses58→201 (max après137/206) ; édition887→798 et356→271. Cette sonde mesure **l'ensemble du correctif contre la base, pas le gain isolé du WeakSet**. Elle reste locale et distincte, sans p95 ni extrapolation Android, et vérifie le hotspot supplémentaire sans campagne générale. Sources : `evidence/documentary-cold-{before,verified}` et `final-comparison.json`.

Mobile émulé :20essais par version.

| Parcours | Médiane avant → après (ms) | p95 avant → après (ms) | Max avant → après (ms) |
|---|---:|---:|---:|
| Liste → fiche, premier accès direct | 1796 → 321 | 2082 → 376 | 2800 → 407 |
| Liste → fiche, réouverture | 1174 → 195 | 1508 → 228 | 1748 → 260 |
| Fiche → éditeur, premier accès | 1101 → 876 | 1340 → 953 | 1389 → 1016 |
| Fiche → éditeur, réouverture | 562 → 297 | 672 → 342 | 1612 → 395 |
| Premier détail Grain | 40 → 41 | 49 → 47 | 52 → 47 |
| Premier potentiel aromatique | 39 → 145 | 50 → 159 | 60 → 165 |
| Premières analyses avancées | 47 → 223 | 64 → 242 | 65 → 261 |
| Première saisie (input → deux images) | 55 → 53 | 80 → 65 | 81 → 71 |

Contrôle desktop :3essais par version ; aucun p95.

| Parcours | Médiane avant → après (ms) | p95 avant → après (ms) | Max avant → après (ms) |
|---|---:|---:|---:|
| Liste → fiche, premier accès direct | 438 → 48 | — | 439 → 48 |
| Liste → fiche, réouverture | 150 → 34 | — | 152 → 34 |
| Fiche → éditeur, premier accès | 389 → 382 | — | 392 → 386 |
| Fiche → éditeur, réouverture | 82 → 55 | — | 83 → 55 |
| Premier détail Grain | 14 → 13 | — | 15 → 13 |
| Premier potentiel aromatique | 13 → 27 | — | 13 → 27 |
| Premières analyses avancées | 13 → 34 | — | 13 → 34 |
| Première saisie (input → deux images) | 9 → 9 | — | 10 → 10 |

Chrome153.0.8010.53 Windows headless, vrais composants minifiés en build QA, adaptateurs Firestore/Functions locaux et réseau externe bloqué. Mobile390×844, CPU6× ; desktop1280×900, CPU1×. Aucun réseau ralenti artificiellement.22recettes synthétiques, principale24L/5grains/12ajouts/3phases/20lignes de consignes,89documents de connaissance sauvegardés et références documentaires complètes. Aucun comportement par nom ou style n'a été ajouté.

Contexte navigateur neuf à chaque itération. La liste et ses données sont prêtes ; clic **direct**, sans passer par Détails et actions, sans capture ni attente de préchauffage ajoutée. Départ au `pointerdown` natif trusted (repli click indiqué dans les données), arrivée avec contenu et commandes attendus puis deux images. Ensuite premiers détails, édition, première saisie trusted vérifiée, retour et réouverture dans la même session. Ce protocole exclut démarrage, OAuth et synchronisation initiale. Il conserve la préparation normale depuis la liste comme partie de l'implémentation.

Médiane : moyenne des deux valeurs centrales pour n pair. p95 au rang proche, indicatif à n=20. Tous les extrêmes restent dans les échantillons ; aucun tri d'essais « trop lents ». Le PC est partagé et le CPU ralenti artificiellement : aucune garantie de délai maximal ni extrapolation physique. La mesure de première saisie part de l'événement `input`, pas du tap de focus complet ; le parcours fonctionnel joue aussi ce focus réellement.

L'avant charge en mémoire les12modules applicatifs exacts de5a49cc5 ; même entrée QA, fixtures et adaptateurs que l'après. `FirestoreRepo.all()` QA partage désormais les lignes d'une collection inchangée, conformément au dépôt réel. Ni fichiers source ni index n'ont été restaurés pour fabriquer l'avant. Les anciens résultats de départclick et les tranches v1/v2 sont des archives, pas la comparaison finale.

## Causes et changements

Le profil CPU initial du parcours attribuait environ721ms propres au scan de visibilité PageShell,1,18s inclusifs à yeastReferences et428ms propres à la normalisation des noms. Ces temps concernent une trace complète et ne s'additionnent pas comme des durées d'ouverture. Les lectures du dépôt restaient généralement<1ms : leur résultat déclenchait les recalculs.

`getHopKnowledge/Varieties/Lots` partagent maintenant un snapshot jusqu'au remplacement/ajout/suppression d'une ligne ou à l'effacement de session. Les écritures locales qui remplacent une ligne dans le même tableau invalident aussi. Noms/aliases normalisés sont partagés par item, mais revérifiés même après mutation en place ; ambiguïtés, archives, priorités des références personnelles et références invalides sont préservées. Les bundles de variétés sont validés une fois, chargement partagé, erreur suivie d'une nouvelle tentative possible.

La trace Android a confirmé le poids des validations documentaires. Le décodeur de la bibliothèque valide et fige profondément les 1 733 références, qui étaient ensuite revalidées dans yeastReferences pour chaque nouvel assemblage. Un WeakSet reconnaît maintenant **ces seuls objets exacts**, déjà validés et immuables. Les données personnelles, copies enrichies ou modifiées restent intégralement validées ; aucune validation de schema n'a été retirée, aucun fichier Functions modifié. Les tests de bibliothèque exacte, corruption et immuabilité passent, et le nouveau contrôle refuse la revalidation initiale.

PageShell partage les styles **pendant une seule passe**, exclut les descendants de détails fermés avant lecture des styles, et omet les annonces internes déjà autorisées par la page de la collecte des portails externes. Une touche ordinaire ne rescane plus les dialogues. Aucun cache de visibilité persistant ni filtre supplémentaire de mutations. Les portails, alertes avec action et inert préexistant gardent leur comportement.

Un profil React diagnostique a montré une simulation aromatique avancée montée dans deux détails fermés : environ100ms propres au premier montage, sur363ms de rendu racine. Ces durées de build profiling ne sont pas comparables statistiquement aux séries normales. Les rapports complexes se montent désormais au premier dépliage et restent montés ensuite pour conserver leurs états ; les sections éditables/validées gardent leur comportement eager par défaut. Les mesures des premiers détails ci-dessus rendent ce déplacement visible et permettent de le refuser s'il redevient bloquant.

La route de lecture et les références documentaires sont préparées depuis la liste, sans montage du wizard, calcul de simulation, écriture ni appel IA. App utilise directement la surface prête et conserve son identité durant une notification. L'en-tête de levure pur est extrait, avec réexport depuis Workbench. Les rapports et leurs capacités de simulation partagent encore du code avec les ateliers ; ils restent disponibles hors ligne une fois la route prête. Aucun atelier destiné exclusivement au wizard n'est ouvert pour consulter.

La préparation des noms cède selon un budget6ms et le temps idle disponible, et s'annule lorsque la liste passe derrière une page plein écran. **La construction initiale des références de levures reste synchrone et non préemptible** ; le découpage concerne l'indexation des noms. Cette limite est conservée, sans prétendre que toute préparation est bornée à6ms.

Deux défauts de focus ont été corrigés : une vraie page remplaçant le fallback capturait un opener détaché ; PageShell suit maintenant sa source jusqu'au bouton connecté. Sur desktop, un `dialog open role=presentation` du panneau de notes BrewDay était traité comme dialogue modal et neutralisait Tab/Échap ; les conteneurs de présentation en ligne sont désormais distingués des vrais dialogues.

La revue finale a ajouté le changement direct via Ctrl+K : la clé d'identité réinitialise la fiche d'une autre recette, et les sources d'overlays restituent le focus après disparition de la recherche et de la première page. Le parcours A→Ctrl+K→B est maintenant joué sans fermeture préalable de A, à 390/1280 ; notifications du même ID conservent son état, B retrouve ses détails fermés, puis Échap rend le bouton du catalogue de A.

Les coûts visés préexistent à la refonte : PageShell a le même blob `bb1771bcbf30b85abe1c6aec524f9c3fde8288c8` sur main87b076a et base5a49cc5. yeastReferences/recipeGuide et le getter recréant ses tableaux sont aussi communs. Ceci compare les causes, pas une série de performance complète de main.

## Contrats vérifiés

- **88 tests ciblés passent**, 13 fichiers. Caches/invalidation/aliases/ambiguïtés, erreur/retry catalogue, race rendu→effet, attente des références hors ligne, coût des styles, dialogues/portails, focus et transition Suspense/recherche, bibliothèque exacte et corruptions, maintien des disclosures, stockage import/export, diagnostic et confidentialité.
- **Sept contrôles refusent la base** :600 lectures de styles au lieu du budget, nouvelle identité du snapshot, normalisation répétée, perte de focus après fallback, clavier bloqué par le dialogue de présentation, focus perdu après recherche et bibliothèque immuable revalidée. `tests-verified-baseline-negative.log` contient les échecs attendus, sans erreur de collecte.
- **Parcours navigateur final390/1280** :23/22contrôles passent. Lecture complexe/simple/incomplète, grain exact, saisie nom/volume, édition par deux entrées et import sans écriture adapter/Functions, sauvegarde refusée puis reprise, nom/36L conservés, IBU96→69 après rechargement, snapshot24L/6kg du brassin inchangé, lancement QA, scroll réel, Tab/ShiftTab/Échap/retour navigateur et restitution au bouton.
- **Hors ligne sans catalogue QA préinstallé** : coupure après fiche prête et avant premiers rapports. Arôme/analyses avancées/conduite et NOLO restent utilisables à390/1280, données primaires visibles, sans erreur ni requête externe. Le test avait échoué avant la préparation des bundles dans le loader ; cet échec est conservé. État du rapport conservé après fermeture et notification ; recette modifiée détectée ; une autre recette retrouve son propre état initial.
- **Build production passe** et contrôle d'exclusion des données privées passe. Le fichier privé ignoré seedData.ts étant absent du worktree, seule une copie locale ignorée de seedData.example.ts publique sert au contrôle TypeScript. Aucune donnée privée copiée, aucune dépendance ajoutée. Avertissements de gros chunks et dépréciation Vitest conservés dans les logs.

Luna a fourni les parcours v1 et le mobile v2 indépendants, et identifié la perte de focus réelle. Après interruption, Sol a récupéré ses artefacts sans recréer l'agent, reproduit le défaut desktop, corrigé, puis rejoué les parcours sur le résultat final. **Cette dernière exécution est celle de Sol, pas une nouvelle preuve indépendante de Luna.**

Astra, même consultation `01a0e3f0-eab5-7550-bef9-d661201c43ed`, a vérifié les preuves et corrections intégrées. Avis final `astra-verified.md` : aucun P1/P2 matériel restant sur les éléments examinés ; identité/focus par recherche corrigés, cache réservé aux objets validés/immuables jugé sûr, comparaison froide concordante. Retenu et vérifié : NOLO, hors ligne, race, invalidation, états/focus et validation documentaire. Réserves conservées : construction initiale synchrone, adaptation de l'en-tête à Levure, vérification après report et après publication sur Android. Revue en lecture seule, sans nouvelle exécution ou extraction de trace.

## Terrain et diagnostic volontaire

| Niveau | Preuve actuelle | Réserve |
|---|---|---|
| Local reproductible | Séries finales ci-dessus, vrais composants et fixtures, captures390/1280, réseau externe absent | Émulation de CPU/viewport sur PC, pas Android physique ; bootstrap et authentification exclus. |
| Site déployé | Empreintes publiques conservées ; boucle PageShell d'origine repérée. Chrome PC browser2/tab1005985658 finalement confirmé par utilisateur, liste authentifiée observée par pilote | getTab refusé dans ce fil car l'onglet appartient encore au pilote : aucun nouveau parcours exécuté ici, aucun contournement. Anciennes observations PC gardent leur réserve de cible. Latence fixe de l'outil DOM non utilisée comme temps app. Commit b09af85 indiqué dans le mandat, aucun marqueur servi ne le prouve. |
| Xiaomi13T Pro, Chrome Android | Trace utilisateur qualifiée : première capture complète de fiche2018 ms, édition consécutive680 ms ; consultation RunTask1928 ms, max772. Profil estime assertHopKnowledge1188 ms dont assertYeastCatalogue919 ms imbriqués | Un seul relevé sur l'avant déployé, cache non contrôlé ; capture complète ne prouve pas tous les contrôles input-ready. Profil échantillonné avec deltas négatifs corrigés pour estimations. **Aucun après physique du correctif non publié**. |

L'outil navigateur refuse les pages internes chrome:// ; aucun contournement shell/ADB/CDP n'est utilisé sur le Chrome utilisateur/téléphone. OAuth, Firebase/règles/Functions restent inchangés. Aucun test n'a écrit en production ou appelé Gemini.

Trace `C:/Users/mrspa/Downloads/Trace-20260927T221810.json.gz`, SHA256 `f35200bfbdf9735043d3f0318812a886d7cd3e7d2476ce29e10ff4a6f6a8da27`. Qualification par le pilote dans `C:/Users/mrspa/Downloads/Trace-20260927T221810-analysis/README.md`, lue sans dupliquer l'extraction. Raw/screenshots/bundle/analysis contenant les données réelles restent **hors Git** dans Downloads. EventTiming180 ms décrit la réaction/loader, pas les2018 ms avant la fiche. Ce relevé confirme le besoin et le hotspot ; il ne constitue ni série Android ni validation après correction.

Les parcours QA n'introduisent ni sauvegarde de recette ni appel IA au geste de lecture/entrée d'édition. Le polling compagnon `getBrewerActivity` existe indépendamment du parcours et reste mocké localement ; en production il peut marquer des jobs expirés. Le contrôle ne prétend pas démontrer l'absence universelle de housekeeping serveur dans la session réelle.

[Le capteur volontaire](../../scripts/recipe-open-diagnostic.js) fonctionne dans la Console du navigateur normalement authentifié, sans publication. Il exporte localement types d'action, timings, longues tâches, viewport/version/état réseau et empreintes des modules publics. Aucun contenu/nom/valeur/ID métier, cookie/token/lecture de stockage, URL backend/query ni transmission automatique. [Le protocole](ANDROID-DIAGNOSTIC.md) conserve cache déclaré, premier passage/réouverture, repère humain, focus/retour sans modification et Screencast désactivé selon la [documentation Chrome](https://developer.chrome.com/docs/devtools/remote-debugging/). Retour natif mesuré depuis popstate ; fermeture par bouton depuis le geste. Ce capteur n'est pas une mesure INP standard.

## Artefacts et report vers Levure

Comparaison qualifiée : `final-comparison.json`, séries e04 et sonde documentaire c289 distinctes. Logs courants : `tests-verified.log`, `tests-verified-baseline-negative.log`, `build-verified.log`, `functional-verified.log`, `reading-final-verified.log`. Contrats : `sol-functional-verified/luna-functional-results.json` et `evidence/reading-final-verified/results.json`. Séries/PNG e04 : `evidence/delivery-*`. Profils, logs et toutes les tranches/échecs antérieurs restent conservés localement ; `comparison.json`, `outliers.json` et l'ancien avis astra-final.md concernent v1.

Les deux commits applicatifs sont à examiner/reporter dans la branche Levure ; **ne pas remplacer ses fichiers entiers**. Conflits probables : RecipePage, Workbench de levure (extraction/réexport de15 lignes), yeastReferences, App et ProductionTab. Astra a constaté que main committé dd798d8 utilise yeastRecipeDesignChanged plutôt que classifyYeastRecipeDesignChange : adapter l'en-tête à l'API réellement intégrée et préserver les différences métier de RecipePage. PageShell/CommandPalette, stockage, index et loader gardent leur cohérence. Aucun BrewWizard/BrewDay ni schema Functions édité. Les outils QA/diagnostic et la documentation forment un commit séparé ; les tests diagnostic voyagent avec le script. Rejouer les contrôles sur la cible. Aucune fusion ni publication implicite ; worktree conservé pour les traces terrain et l'intégration.
