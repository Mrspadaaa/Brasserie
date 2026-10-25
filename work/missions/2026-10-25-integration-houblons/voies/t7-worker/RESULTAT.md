ECHEC — G1 : toucher Suggérer ×4 447 ms > 100 ; c'est le rendu, le moteur y pèse 0 ms

Le worker persistant est fait, branché dans la maquette servie par HTTP et testé. Les quatre paires de captures
(mode immédiat et mode worker) sont identiques octet pour octet. Le préchauffage sort du fil principal : le temps bloquant
après l'ouverture passe de 3 143 à 1 315 ms (×4).

Le budget du toucher (≤ 100 ms ×4) reste hors de portée de cette voie. Pendant le toucher, le moteur ne calcule rien :
le journal `mesures()` est vide, et l'outil de mesure dit « dont moteur 0 ». Le temps part dans le rendu de Suggérer
(profil ci-dessous), qu'aucun worker ne peut prendre.

## Fichiers écrits

- `src/ui/hopIndex/hopTools.worker.ts` (neuf) : la boucle du worker, `ecouter(portée, table, { alimenter, prechauffage })`.
  - Elle reçoit `{ type: 'donnees' }`, puis les requêtes du contrat, et rend la réponse au même identifiant.
  - Si l'alimentation échoue, elle émet `{ type: 'panne' }`.
  - Elle ne connaît pas la table : le domaine ne dépend d'aucun écran (voir les doutes).
- `src/ui/hopIndex/hopToolsTransport.ts` (neuf) : `servirParWorker({ creer, repli, donnees, surRepli })`, un `ServeurCalculs`.
  - Un seul worker, alimenté une fois, puis à chaque changement de données (`alimenter`).
  - `servirSurPlace` sert une réponse absente sur le fil principal (option b).
  - Repli définitif sur le fil principal dans quatre cas : création impossible, `onerror`, `onmessageerror` ou panne. Les
    requêtes en vol y sont servies une seule fois. Des données non clonables (null) donnent aussi le repli.
- `src/domain/hopIndex/v4/client.ts` : quatre ajouts.
  - `servirSurPlace?` dans `ServeurCalculs`.
  - `lire` : réponse gardée, sinon repli synchrone. `lireGarde` : réponse gardée seulement.
  - Un préchauffage en vol est réutilisé par une demande de même clé (le toucher pendant le préchauffage n'en relance pas).
  - `vider()` incrémente une génération : une réponse partie avant n'est plus gardée.
  - Comportement inchangé pour le fil principal immédiat et pour le mode différé (11/11 dans `client-async.test.ts`).
- `prototypes/houblons-v4/parcours/src/moteur/` : six fichiers.
  - `calculs.ts` (neuf) : la table, sortie de `client.ts` pour que le worker l'importe sans créer de client.
  - `calcul.worker.ts` (neuf) : le point d'entrée du worker.
  - `client.ts` : le choix du serveur.
    - Par défaut : le worker si la page est servie en `http(s)` et que le navigateur a `Worker` ; le fil principal sous
      `file://`.
    - Paramètres : `?calcul=immediat|differe|worker` et `?recalcul=worker`.
    - `serveurCalcul()` dit qui sert.
  - `useCalcul.ts` : garde le dernier résultat montré (`dernier`), même venu « direct ».
  - `donnees.ts` : `donneesClonables()` (seulement ce qui diffère des fixtures ; null si l'α du lot vient d'une fonction
    propre) et `configurerDonneesClonables()`.
  - `v4.ts` : `familyWords` gardé par moteur (voir Mesures).
- `prototypes/houblons-v4/parcours/src/coquille/Coquille.tsx` (préchauffage seulement).
  - Mode immédiat : comme avant, plus deux choses : `substitutes` en ordre de catalogue de chaque ajout (option a, #171),
    et les mots hors familles des voies (`horsDesFamilles`).
  - Mode worker : les requêtes partent d'une seule petite tâche. Les voies reçues, une tâche au repos compose la liste et
    lit leurs mots.
- `tests/unit/hopIndexV4/hopToolsTransport.test.ts` (neuf, 12 tests) : un faux worker, messages clonés.
- `prototypes/houblons-v4/tests/worker-calculs.test.ts` (neuf, 5 tests).
  - La vraie table, à travers des messages clonés, rend les empreintes du banc ×1.
  - Chaque résultat se clone sans perte (`toStrictEqual`).
  - Les données k2 passent au worker ; un α par fonction donne null.
- `prototypes/houblons-v4/maquettes/parcours/` reconstruite. Elle contient en plus `assets/calcul.worker-<hash>.js`
  (1,1 Mo, script classique, chargé seulement en http).
- `git status` : rien hors de ma zone (`pistes-l5f.png` y était déjà). Scripts et journaux dans
  `%TEMP%/t7/` : copie de `mesure-performance.mjs` qui ouvre par HTTP, `sonde.mjs`, `cap.mjs`.

## Mesures avant

Outil : `mesure-performance.mjs`, copié dans `%TEMP%/t7/mesure-http.mjs`. Trois changements dans la copie :
- la page est ouverte par `http://127.0.0.1:8717/` (`servir.mjs`) et non par `file://` ;
- `http://*` n'est plus bloqué ;
- `depot` vient de l'environnement.

Le reste est identique. Mesure du 25.10 sur HEAD 2e0cb8f6, page `ma-biere/etat.html`, `--cpu=4`, i5-14600KF.

```
ma-biere · chargement 582 ms · toucher 542 ms · glisser p50 2,5 / p95 6,6 ms · script 224 ms · longues tâches au chargement 3,0 en moyenne (bloquant 369 ms)
  longues tâches (> 50 ms) après l'ouverture, tous gestes des 5 passages : 21, bloquant 3143 ms au total
  toucher pont-substituer → substituer : froid 363 ms (dont moteur 21) ; chaud 113 ms (dont moteur 0) / 82,9 ms (dont moteur 0)
  toucher pont-floral → suggerer : froid 542 ms (dont moteur 0) ; chaud 259 ms (dont moteur 0) / 192 ms (dont moteur 0)
PERF ECHEC (1 dépassement, ×4)
```

Sonde maison (`sonde.mjs`) : toucher après 8 s de repos, puis profil CPU.
- Suggérer : 399 à 450 ms ×4 et 173 ms ×1. Le journal du moteur ne note rien pendant le toucher.
- Profil ×4 :
  - « (program) » 166 ms ;
  - `focus` 97 ms (style et mise en page forcés à l'ouverture de la couche) ;
  - le gestionnaire `resize`/`scroll` de `useViewport` 38 ms (mise en page forcée) ;
  - `removeChild` 28 ms (Ma bière démontée) ;
  - environ 70 ms de `familyWords`, relu près de 400 fois par `horsDesFamilles` (D130, paire par paire).
- Longue tâche du préchauffage sur le fil principal : 382 à 404 ms ×4.

## Mesures après

Mêmes commandes, maquette reconstruite. La ligne qui juge, au pire cas mesuré (mode worker, toucher froid) :

suggerer ×4 : 447 ms

Mode worker (défaut en http) :
```
ma-biere · chargement 639 ms · toucher 447 ms · glisser p50 3,1 / p95 13,5 ms · script 265 ms · longues tâches au chargement 3,0 en moyenne (bloquant 417 ms)
  longues tâches (> 50 ms) après l'ouverture, tous gestes des 5 passages : 16, bloquant 1315 ms au total
  toucher pont-substituer → substituer : froid 404 ms (dont moteur 15) ; chaud 163 ms (dont moteur 0) / 157 ms (dont moteur 0)
  toucher pont-floral → suggerer : froid 447 ms (dont moteur 0) ; chaud 165 ms (dont moteur 0) / 259 ms (dont moteur 0)
  glisser à froid : 100 images, p50 3,1 / p95 13,5 ms ; 0 image ratée (> 25 ms)
PERF ECHEC (1 dépassement, ×4)
```
Mode immédiat (`?calcul=immediat`, le même code sans worker) :
```
ma-biere · chargement 591 ms · toucher 415 ms · glisser p50 2,5 / p95 8,0 ms · script 228 ms · bloquant au chargement 384 ms
  longues tâches (> 50 ms) après l'ouverture, tous gestes des 5 passages : 18, bloquant 2770 ms au total
  toucher pont-substituer → substituer : froid 356 ms (dont moteur 10) ; chaud 125 ms / 96,1 ms
  toucher pont-floral → suggerer : froid 415 ms (dont moteur 0) ; chaud 163 ms / 112 ms
PERF ECHEC (1 dépassement, ×4)
```
Sonde maison, après 8 s de repos, ×4 :
- Suggérer : 350 à 364 ms en worker, 364 à 436 ms en immédiat (bruit de quelques dizaines de ms d'un passage à l'autre).
- Substituer : 218 à 227 ms dans les deux modes.

Ce que le worker a changé :
- La longue tâche du préchauffage (382 à 404 ms ×4) n'existe plus sur le fil principal : le journal n'y a plus
  `prechauffage:proposer`.
- Après l'ouverture, le temps bloquant passe de 3 143 ms (avant) à 1 315 ms (worker) ; le mode immédiat est à 2 770 ms.
- Aucune image ratée pendant le glisser (critère 4 : aucune tâche > 50 ms pendant un glisser). Le p95 du glisser en
  worker est de 13,5 ms (8,0 en immédiat), sous le budget de 16 ms.

Mon gain hors worker :
- Le cache de `familyWords` et la lecture au repos des mots des voies retirent environ 70 ms ×4 du toucher (profil :
  plus aucune fonction de descripteurs).
- Il reste du DOM, que cette voie ne possède pas :
  - « (program) » 150 à 220 ms ;
  - `focus` 97 ms ;
  - `useViewport` 41 à 45 ms ;
  - `removeChild` 29 ms.

Le froid de l'outil (447 contre 415) tombe dans le bruit observé : le toucher froid arrive peu après le chargement,
pendant que le worker démarre et qu'un `substitutes` non encore reçu est servi sur place (« dont moteur 15 »).

## Captures

Chaque écran a été joué dans Chrome en mode immédiat (`?calcul=immediat`) et en mode worker. Captures prises après
le toucher, à 390 × 844, échelle 2, puis ouvertes en image.

**Paires identiques à l'octet :**

| Écran | Immédiat | Worker | Empreinte sha1 |
|---|---|---|---|
| Ma bière → Suggérer (toucher `pont-floral`, préchauffé) | `work/missions/2026-10-25-integration-houblons/voies/t7-worker/captures/suggerer-toucher-immediat.png` | `work/missions/2026-10-25-integration-houblons/voies/t7-worker/captures/suggerer-toucher-worker.png` | `5c1ea9b9…` |
| Ma bière → Substituer (toucher `pont-substituer`) | `work/missions/2026-10-25-integration-houblons/voies/t7-worker/captures/substituer-toucher-immediat.png` | `work/missions/2026-10-25-integration-houblons/voies/t7-worker/captures/substituer-toucher-worker.png` | `b6f85a41…` |
| Suggérer par son adresse, sans préchauffage (repli synchrone) | `work/missions/2026-10-25-integration-houblons/voies/t7-worker/captures/suggerer-adresse-immediat.png` | `work/missions/2026-10-25-integration-houblons/voies/t7-worker/captures/suggerer-adresse-worker.png` | `5c1ea9b9…` |
| Substituer, puis le moment « whirlpool » (recalcul) | `work/missions/2026-10-25-integration-houblons/voies/t7-worker/captures/substituer-whirlpool-immediat.png` | `work/missions/2026-10-25-integration-houblons/voies/t7-worker/captures/substituer-whirlpool-worker.png` | `dec5cb08…` |

Dans les deux modes, le texte de l'écran garde la même longueur à chaque image après le toucher (4 814 caractères pour
Substituer au whirlpool) : jamais vide, ni roue ni « chargement ».

**Le piège connu, mesuré :**
`work/missions/2026-10-25-integration-houblons/voies/t7-worker/captures/substituer-whirlpool-worker-recalculs-async.png`
- C'est le recalcul confié au worker (`?recalcul=worker`) ; `?calcul=differe` donne la même image.
- Substituer y perd son choix : plus de Citra cryo ni de Target en surbrillance, « Remplacer » gris, et le texte passe de
  4 814 à 3 776 caractères.
- Cause : `ecrans/substituer/index.tsx`, l. 241. L'effet remet les défauts à chaque changement de moment (`cleLue`) avec
  les remplaçants de l'ancien moment, puis rien ne les remet quand la réponse arrive (`recue` reste vrai).
- C'est pourquoi les recalculs restent sur le fil principal par défaut (`recalculsAsynchrones()` faux). Le worker ne
  prend aujourd'hui que les préchauffages.
- Suggérer par son adresse, en mode différé, garde aussi son écart connu (sans la comparaison de départ, `useEffect([])`) ;
  en mode worker, le repli synchrone l'évite.

## Critères

Lancés depuis la racine, sur le code final et la maquette reconstruite par la batterie :
- G1 `node …/t7-worker/verifier.mjs` : `toucher Ma bière → Suggérer ×4 : 447 ms > 100`, puis `WORKER ECHEC (1)`. Seule
  cette faute est relevée : le worker existe, les deux fichiers de tests passent (17/17), quatre captures au moins sont
  citées et existent, `npm run build` est vert, et `check-hop-budget` donne `B1 démarrage : 919 ko gzip` (≤ 919).
- G2 `node prototypes/houblons-v4/parcours/outils/batterie.mjs` : `BATTERIE OK 46/46`.
- G3 `node work/refonte-frontend/v4/tournoi/outils/controle-etats.mjs prototypes/houblons-v4/maquettes/parcours` :
  `ETATS OK (141/141) ; 13 voulu(s) non rejoué(s)`.
- Tests : `client-async.test.ts` 11/11 (contrat T6b inchangé), `hopToolsTransport.test.ts` 12/12,
  `worker-calculs.test.ts` 5/5.

## Essais

- G1 : 1 essai. L'écart avec le budget est structurel : c'est le rendu.
- Captures : 2 essais. Le premier, avec les recalculs au worker, montrait le défaut de Substituer, d'où le choix
  « recalculs sur le fil principal ».

## Doutes et limites

- **Où vit le point d'entrée du worker.** `hopTools.worker.ts` est la boucle générique. Le point d'entrée de la maquette
  est `parcours/src/moteur/calcul.worker.ts`, car la table vit dans l'adaptateur du prototype. L'app aura son entrée au
  portage des écrans (T12), sur la même boucle et le même transport.
- **Le journal du worker est le sien.**
  - Les contrôles qui lisent `window.__parcours.mesures` ne voient que le fil principal.
  - Sous `file://` (batterie, états, maquette publiée), le worker n'est jamais créé : leurs contrôles jouent le même
    chemin qu'avant.
  - En http, « dont moteur » ne compte pas ce que fait le worker.
- **Poids.** Le worker embarque son propre moteur et ses fixtures (1,1 Mo brut). Ce n'est pas le démarrage de l'app :
  rien de `src/` ne l'importe.
- **Données.** Si `alphaDuLot` n'est pas celui par défaut (une fonction propre de l'app), le worker n'est pas employé.
  Au portage, il faudra passer l'α du lot en données.
- **`familyWords` gardé par moteur** (`moteur/v4.ts`) renvoie le même objet à chaque appel. J'ai relu les appelants
  (Comparer, fiche, Ma bière, Substituer, hors16d) : aucun ne le modifie.

DÉCISION À PRENDRE : le budget « toucher Ma bière → Suggérer ≤ 100 ms ×4 » est hors de portée d'un worker.
- Ce qu'il reste à payer est le rendu : environ 350 à 450 ms ×4, 173 ms ×1 ; le moteur y pèse 0 ms.
- Options :
  - (1) une voie de rendu sur Suggérer et la couche :
    - le `focus` d'ouverture de `PageShell` (97 ms, style forcé) ;
    - le `useViewport` qui force la mise en page au scroll ;
    - le démontage de Ma bière sous l'outil (D-coquille) ;
    - le nombre de nœuds des lignes ;
  - (2) accepter un budget de toucher froid propre aux outils plein écran, par exemple ≤ 200 ms chaud et une mesure
    froide rapportée sans budget ;
  - (3) une transition qui montre l'écran avant son contenu. C'est un état d'attente visible : son choix, pas le nôtre.
- Recommandation : (1) d'abord, mesurée par la même sonde, (2) si (1) plafonne. Jamais (3) sans lui.

Seconde décision, plus petite :
- Allumer les recalculs au worker (`?recalcul=worker` par défaut) après avoir réparé `ecrans/substituer/index.tsx`,
  l. 241. Il faut remettre les défauts quand la lecture du nouveau moment arrive, et non au changement de moment.
- Recommandation : une petite voie sur Substituer, rejouée par `cap.mjs` en mode worker contre le mode immédiat.

CONNAISSANCE : dans la maquette du parcours, ouvrir Suggérer d'un toucher coûte environ 400 ms ×4 de rendu et 0 ms de
moteur une fois le préchauffage fait. Dans ce rendu, `focus` (97 ms) et `useViewport` (40 ms) forcent la mise en page.
Un worker y retire seulement les longues tâches du préchauffage (3 143 → 1 315 ms bloquants).

LEÇON PROPOSÉE : avant de confier un budget de toucher à un worker, profiler le toucher dans Chrome (journal du moteur et
profil CPU). Ici, le budget venait d'un banc Node (« ouvrir Suggérer sans préchauffage ≈ 205 ms »). Dans le navigateur,
le moteur pesait 0 ms et le rendu 400.
