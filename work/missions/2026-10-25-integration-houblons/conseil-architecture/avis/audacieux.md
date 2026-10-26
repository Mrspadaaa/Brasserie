Brouillon unique, sous (a) et (c). Toutes les vues sont branchées sur un même brouillon dans Dexie, relu en direct par `liveQuery`. Chaque outil a sa route plein écran au-dessus de ce brouillon. `writeRecipeDraft` y migre au lieu de rester une seconde copie. Cela traite d'un coup D139 (« un choix sur un endroit, semble pas toujours être reporté partout ») et R10 (le brouillon perdu au rechargement). Dexie est déjà en place : quatre bases, dont `src/services/hopDecisionLocalRepository.ts:54`. Rejouer « wizard → outil → retour » dans Chrome ne prouve rien tant que ce brouillon n'est pas unique.

Calcul, (a) poussée plus loin. Un seul worker vit toute la session et garde les données, au lieu d'un worker par recherche comme dans `hopSolver.worker.ts:9`. Son interface asynchrone se fixe avant le premier écran porté. Sinon, les huit écrans appellent le moteur en direct et tout le portage est à refaire (enjeu de `question.md`). `lireBiere` reste en copie sur le fil principal pour le glisser (0,27 ms à chaud). Trois ajouts :
- des index calculés au moment du build et marqués d'une empreinte du moteur et des données : les 8 meilleurs remplaçants de chaque variété, et les fiches de `houblon()` (4,5 s à ×10). Le calcul O(n²) de `substitutes` disparaît ; un index dont l'empreinte ne correspond plus est refusé, pour l'honnêteté des données ;
- le worker calcule d'avance les crans de dose ±2 pendant que le doigt est posé, car un cran de `suggerer` coûte 132 ms à ×10 ;
- des caches bornés, gardés en IndexedDB sous la même empreinte.

Hors ligne, (c) pour le code et (b) pour le catalogue. Seul un service worker ferme R4 ; précharger en espérant que tout soit chargé ne prouve rien hors ligne. Activer ce service worker en production revient à déployer : la décision revient à l'utilisateur. Les écoutes Firestore s'ouvrent écran par écran (T10).

Coexistence, (a) : V5.5 reste derrière un drapeau. Son retrait libère 479 ko gzip du budget de l'étape Houblons, mais il attend l'accord du brasseur et de l'utilisateur.

Ordre :
1. T1.
2. T4 et T5 avec les index précalculés.
3. Le contrat du worker.
4. T17 : le jeu ×10 et son contrôle bloquant.
5. T14 : le mode `--url`.
6. Seulement ensuite, T12.

Le premier geste : R1 corrigé et les tests du moteur dans `npm test`.

Position : autre voie : brouillon Dexie unique branché en direct ; un worker qui garde les données et dont l'interface asynchrone est fixée avant tout écran ; index précalculés et marqués d'une empreinte ; service worker sous accord de l'utilisateur.
