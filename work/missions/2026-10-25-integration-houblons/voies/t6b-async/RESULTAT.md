OK — client asynchrone des calculs lourds ; écrans par l'adaptateur ; rendu inchangé (46/46, 141/141)

## Fichiers écrits

- `src/domain/hopIndex/v4/client.ts` (neuf) ; `src/domain/hopIndex/v4/index.ts` (son export).
- `prototypes/houblons-v4/parcours/src/moteur/` : `client.ts`, `useCalcul.ts`, `v4.ts` (neufs) ; `index.ts` (`leviersLevure`, sorti de
  `suggerer/voies.ts`) ; `prechauffage.ts` (commentaire).
- `prototypes/houblons-v4/parcours/src/ecrans/` : 21 fichiers, uniquement leurs appels au moteur et leurs imports. Suggérer (`index.tsx`,
  `voies.ts`), Bière, Substituer (`donnees.ts`, `index.tsx`) et `fiche/Replis.tsx` passent par le client. Les 16 autres changent
  leurs imports pour `moteur/v4`.
- `prototypes/houblons-v4/tests/client-async.test.ts` (neuf, 11 tests). `maquettes/parcours/` reconstruite par G2.
- `functions/`, `conversion.ts` et `BrewWizard.tsx` n'ont pas été touchés. `git status` : rien hors de ma zone (`pistes-l5f.png` y était déjà).

## Ce qui a été fait

1. **Le contrat** (`client.ts` du domaine), calqué sur `hopSolverMessages.ts`.
   - Requête : `{ id, type: 'calcul' | 'prechauffer', nom, args }`.
   - Réponse, au même id : `{ id, type: 'resultat', nom, valeur }` ou `{ id, type: 'erreur', nom, message }`.
   - Un serveur n'a besoin que de `envoyer(requete) → Promise<reponse>`. Un worker persistant (T7) le tiendra par `postMessage`.
   - `servirSurFilPrincipal(table)` sert aujourd'hui ; avec l'option `differer`, chaque réponse arrive dans une tâche suivante, comme d'un worker.
   - Le client offre :
     - `calculs.proposer(…)` → Promise, pour toute la table ;
     - `demander`, `prechauffer`, `vider` ;
     - `lire` : le résultat tout de suite si le serveur le peut, ou si la réponse est déjà reçue ou préchauffée ;
     - `canal(nom)` : seule la requête la plus récente reçoit sa réponse ; périmée ou canal fermé → `undefined`.
   - `CALCULS_LOURDS` = proposer, suggerer, remplacants, substitutes ; `verifierCalculs` dit ce qui manque à une table.
2. **La table de la maquette** (`moteur/client.ts`).
   - Calculs : `proposer`, `suggerer`, `remplacants`, `substitutes` (sur le moteur des données injectées, mémoïsé) et `leviers` (proposeVoies « leviers levure »).
   - Mode différé : `?calcul=differe` dans l'adresse.
3. **Le crochet** `useCalcul(nom, args)` rend `{ valeur, args }`.
   - Sur le fil principal, le résultat vient au rendu même : premier rendu identique à avant.
   - Sans réponse immédiate, l'écran garde son dernier résultat ; une réponse périmée est ignorée.
   - Ni roue ni « chargement ».
4. **Le préchauffage** de la Coquille passe par `voiesDe` sans calculs. Le client lit alors la réponse (`lire`), sinon il la préchauffe.
5. **Plus aucun écran sur le moteur par défaut.**
   - `moteur/v4.ts` relie chaque fonction au moteur des données injectées (`moteur()`, relu à chaque appel).
   - `CATALOGUE` et `STOCK` deviennent `donnees().catalogue` / `donnees().stock` dans Comparer, et `fiches()` dans la matrice de la fiche, dont les caches suivent les fiches.

## Critères (depuis la racine)

- G1 `node …/t6b-async/verifier.mjs` → `tests du prototype : 149/149 verts`, **ASYNC OK**. 2 passes, la 2e après la dernière modification.
- G2 `node prototypes/houblons-v4/parcours/outils/batterie.mjs` → **BATTERIE OK 46/46**. 2 passes, la 2e après la correction de Substituer.
  - Sortie du rail : 7 ms (essais 7, 7, 7).
  - PONTS OK (18 gestes, recalcul médian 0,3 ms).
  - PARCOURS OK (29 gestes à 390, 29 à 1280).
- G3 `controle-etats.mjs prototypes/houblons-v4/maquettes/parcours` → **ETATS OK (141/141)**, 13 voulus non rejoués comme avant. 2 passes.
- G4 `npm run build` → code 0, **built in 18.14s**. 1 passe.
- Test du client : sur le fil principal comme en différé, mêmes empreintes que le banc ×1 de t5 :
  - proposer `b42c299e6ebf`, suggerer `85aab6303283`, remplacants `81efdc544613`, substitutes `9ef77aa53ecc` ;
  - une réponse rendue périmée par une plus récente est ignorée, dans l'ordre comme dans le désordre ;
  - un canal fermé ne reçoit plus rien, une erreur est rendue en message ;
  - requêtes et réponses survivent à `structuredClone`, comme par `postMessage`.
- Aucun caractère de contrôle dans les fichiers écrits (M10).

## Épreuve dans Chrome du mode différé (réponses en retard, comme d'un worker)

Script dans le dossier temporaire ; captures prises et ouvertes.
- Ma bière (4 s au repos), puis Suggérer : 17 voies dès la première image, comme en immédiat ; le préchauffage a servi.
- Substituer : la 1re épreuve a trouvé un défaut. Le face à face ne prenait pas ses deux choix par défaut, Magnat et Nelson Sauvin : ils étaient calculés sur une liste encore vide. Corrigé dans `substituer/index.tsx` : les défauts se reposent quand la lecture arrive. Après correction, le rendu est identique à l'immédiat (4 916 caractères, même capture).
- Suggérer ouvert à froid par son adresse, sans passer par Ma bière : 0 voie à la première image, 17 après la réponse. En mode immédiat (aujourd'hui) : 17 dès la première image.

## Doutes et limites

- Sur le fil principal (aujourd'hui), le calcul se fait toujours au rendu, comme avant. Le gain de fluidité viendra seulement avec un worker (T7) ; le contrat est prêt et testé pour lui.
- La Coquille (hors de ma zone) préchauffe encore `remplacants(recette, id, 6)` en appel direct de l'adaptateur. Aucun écran ne lit ce calcul : Substituer et la fiche lisent `substitutes`, en ordre de catalogue, sans limite. Le préchauffage des remplaçants ne sert donc pas l'écran.
- Les jeu.mjs gardent `window.__parcours.moteur`, synchrone (l'adaptateur est le côté serveur). C'est voulu.
- En mode différé, Suggérer montre 4 caractères de moins pendant une image, puis le même texte. Cause non cherchée : un des deux calculs est préchauffé sous une autre clé.

DÉCISION À PRENDRE : sous un worker (T7), un écran ouvert sans préchauffage n'a pas de résultat précédent à garder. Exemples : Suggérer par son adresse, Substituer d'un ajout non préchauffé. Sa première image serait alors vide, ce qui est un état d'attente absent de ses maquettes.
- Options :
  - (a) préchauffer par le client tout ce qu'un toucher ouvre, dont le `substitutes` en ordre de catalogue de chaque ajout. Une ligne dans la Coquille ;
  - (b) servir ces premières ouvertures sur le fil principal (`lire` synchrone), le worker ne prenant que les recalculs ;
  - (c) demander au brasseur l'apparence d'un état d'attente.
- Recommandation : (a) avec (b) en repli, sans état d'attente visible. (c) seulement si le banc ×4 montre une ouverture qu'on ne peut pas préchauffer. Ne compte que si T7 a lieu.

CONNAISSANCE : `moteur/v4.ts` relie toutes les fonctions du moteur au moteur injecté. Un écran n'importe plus du moteur que des types (G1 le vérifie). Le mode `?calcul=differe` éprouve un écran comme s'il était servi par un worker, sans en écrire un.

LEÇON PROPOSÉE : un écran qui fixe un état initial depuis un résultat de calcul (`useState(defauts)`) casse en silence quand ce calcul devient asynchrone. Rien ne change sur le fil principal, et la batterie reste verte. Éprouver tout passage en asynchrone avec des réponses en retard (mode différé) dans Chrome, et comparer les captures avec le mode immédiat.
