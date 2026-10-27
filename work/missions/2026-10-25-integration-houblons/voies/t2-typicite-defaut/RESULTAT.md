ECHEC — non-régression « Citra cryo premier » : 2 listes sur 16 contre 1 avant (21C floral 10′) ; tout le reste tenu, défaut posé et câblé

La typicité du style seule est le défaut de `proposeVoies` (`TYPICITE_DEFAUT = true`), sa table est chargée au montage de l'étape (page et worker), les états sont à 138/138. Un seul critère n'est pas tenu : la mesure complète (16 listes) montre Citra cryo premier dans 2 listes au lieu d'1. Voir « DÉCISION À PRENDRE ».

## Fichiers écrits
Dans « Possède » :
- `src/domain/hopIndex/v4/voies.ts` : `TYPICITE_DEFAUT = true` ; `INTENSITE_DEFAUT` reste `false` (A3 option éteinte).
- `src/domain/hopIndex/v4/typicite-acces.ts` : le registre porte `table()` ; `tableTypicitePosee()`.
- `src/domain/hopIndex/v4/typicite.ts` : plus d'effet à l'évaluation du module ; le registre est posé par `poserTypicite`. Le worker importe `poserTypicite`, la page n'embarque pas le module (il reste un chunk à part).
- `src/ui/hopIndex/parcours/donneesWorker.ts` : `preparerEnvoi` joint la table au message `donnees` UNE fois (renvoyée seulement si l'objet change) ; `recevoirDonnees` la pose AVANT la configuration, qui vide les caches du worker.
- `src/ui/hopIndex/parcours/clientWorker.ts` : `activerWorker()` lance `lancerTypicite()` (montage de l'étape, avec la préchauffe), worker ou fil principal.
- Tests : `tests/unit/hopIndexV4/t2Typicite.test.ts` (nouveau, 4) ; adaptés `f9Typicite`, `f8Intensite`, `palierDryhop`, `clientWorker` ; `prototypes/houblons-v4/tests/{engine,donnees,client-async,worker-calculs}.test.ts` + `typicite-posee.ts` (nouveau).
- États : `work/refonte-frontend/v4/choix/etats/suggerer.json` (gr5-cran), `acquis.json` (q2b-suite-s5).
- Outils de la voie : `sans-table.ts`, `avec-table.ts`, `capture-suggerer.mjs`, `fumee-typicite-worker.mjs`, `suggerer-defaut.png`, sorties `f9-nonreg.txt`, `perf.txt`, `f2/`, `f2-phares-*.txt`, `f5-phares-*.txt`, `phares-t2-*.json` (ceux-ci : f5), `f2-borne-*.txt`.

HORS « Possède » (deux écarts, à valider ; le reste de l'arbre est celui de c8, non touché) :
- `src/ui/hopIndex/parcours/donnees.ts` : `lancerTypicite()` (chargement unique ; à l'arrivée, configuration rejouée, caches vidés, `siDonneesChangent` renourrit le worker : modèle `siCataloguePleinArrive`). Le rejeu y vit forcément (il lit `dernierPartiel`). Jamais configurée (la maquette) : seuls les caches sont vidés ; rejouer `{}` faisait adopter le catalogue plein et cassait `etat-fiche-substituts` (constaté).
- `prototypes/houblons-v4/parcours/src/main.tsx` : une ligne, `void lancerTypicite()`. La maquette n'a pas `EtapeHoublons` (donc pas `activerWorker`) : sans elle picto-épice ne repasse pas.

## Critères
- États : `ETATS OK (138/138)` sans et avec `--choisie`. Maquette reconstruite (`CONSTRUIT OK (9 pages)`).
  - `etat-acquis-picto-epice` repasse tel quel (East Kent Goldings présent).
  - `etat-sugg-gr5-cran` ne repasse PAS tel quel, contrairement à la consigne : sa bulle dit « avec <houblon de la 1re ligne à agrumes> », et c'est maintenant East Kent Goldings (1re ligne), pas Motueka (3e). `verif.attendu` prend « avec East Kent Goldings » ; `verif.choisie` garde « avec Motueka » ; note D120. Dessin identique (valeur +1,6 cran identique).
  - `etat-acquis-q2b-suite-s5` : « Hallertau Tradition » et « Huell Melon » (ordre alphabétique de l'ancien départage) sortent ; « First Gold » (2e) et « Pekko » (4e) entrent ; « East Kent Goldings » reste. Note D120, capture `suggerer-defaut.png` (ouverte : EKG, First Gold, Motueka du stock, Pekko, Pacifica ; même liste, mêmes colonnes).
- `npx vitest run tests/unit/hopIndexV4 prototypes/houblons-v4/tests --maxWorkers=2` : 107 fichiers, 1003 tests verts. Une « Unhandled Error » vitest (timeout RPC `onTaskUpdate`, machine chargée, comme à f9) sans test rouge.
- `npx tsc --noEmit` : aucune sortie. `VITE_HOP_V4=on npm run build` : vert (21 s).
- Budget : `check-hop-budget --chunk-outils profil-simule` sur `dist` : **B5 147,3 ko**, tenu (c8 inclus ; mon ajout : 0, la table et le code de typicité sont des chunks à part, `typicite-*.js` et `typicite-styles-*.js`, hors de la fermeture statique). B1 et B2 ne bougent pas (921 ko et 773 ko, identiques à la mesure de départ de cette copie).
- `fumee-worker-prod.mjs --dist=<dist-t2>` : `WORKER PROD OK`. Et `fumee-typicite-worker.mjs` : `TYPICITE WORKER OK` (le vrai worker de production, dans Chrome : sans table, premiers achats du stout S1 Loral, Pekko, Barbe Rouge, Pacifica ; avec la table envoyée dans `donnees` : East Kent Goldings, First Gold, Pekko, Barbe Rouge).
- `npm run check:hop-perf` : `PERF-OUTILS ECHEC (6)`, les 6 mêmes dépassements que la référence (Dryhopper frise, Comparer 12 houblons, feuille 7 jours, Suggérer par adresse, tranche de préchauffage, premier écran), rien de nouveau. Limite : le banc crée un moteur sans table ; le coût de la typicité (lecture d'une table par voie) n'y est pas mesuré.
- Hors ligne : il n'y a pas de précache PWA dans l'app (le seul service worker, `public/brew-alerts-sw.js`, ne sert que les notifications push ; `vite.config.ts` n'a ni PWA ni workbox). La table est servie comme `catalogue-ajouts` : un chunk hashé, lu par import dynamique, donc dans le cache HTTP du navigateur après un premier passage en ligne. Hors ligne sans le morceau : échec silencieux (test), typicité inconnue, rang de k3k1 ; l'ouverture suivante réessaie. Limite écrite d'avant (un premier lancement hors ligne n'est pas couvert) inchangée.

## Non-régressions, avant / après
« avant » = `typicite: false` (= l'ordre d'avant, vérifié par test : sans table, même ordre que `typicite: false`) ; « après » = le défaut, table posée.
- `f9-nonreg.ts` complet (`f9-nonreg.txt`) :
  | | avant | après |
  |---|---|---|
  | Citra cryo premier (16 listes) | 1 | **2** |
  | Citra simple premier | 1 | 1 |
  | stout S1, 4 achats à 10′ | Loral, Pekko, Barbe Rouge, Pacifica | East Kent Goldings, First Gold, Pekko, Barbe Rouge |
  | 22A agrumes 10′, Nelson Sauvin / Mosaic | 38 / 54 | 20 / 47 |
  | 22A agrumes dry hop actif, Nelson / Mosaic | 72 / 23 | 33 / 11 |
  | 22A tropicaux 10′, Idaho 7 | 53 | 52 |
  | 22A tropicaux dry hop actif, Mosaic | 20 | 9 |
  | 21C floral 10′ : premier | x13459 | **Citra cryo** |
  La ligne « liste complète actuel = liste sans options : DIFFÉRENTE » est voulue (le défaut a changé).
- D106 : palier 60′ identique, voie par voie, 13 voies, « même ordre : oui » (`f9-nonreg.txt` §4) ; `coutD106.test.ts` vert.
- `f2-phares.ts` (`f2/phares-avant.json` contre `phares-apres.json`, 59 valeurs changent) : 21C dry hop actif, Citra cryo 2e → 1er, Citra 3e → 2e, Nelson Sauvin (classement entier) 99 → 18, Mosaic 41 → 12, Galaxy 14 → 8, Cascade 21 → 9, Simcoe hors liste → 5e ; la tête passe de Tango, Citra cryo, Citra, NZH-107, Centennial à Citra cryo, Citra, Centennial, Amarillo, Simcoe. Stout 16D : la tête passe de X13459, Southern Aroma, Tardif de Bourgogne, Loral, Target à Target, Willamette, Nugget, East Kent Goldings, Columbus ; Motueka (classement entier) 101 → 8 ; Citra et Mosaic reculent (81 → 109, 64 → 98), ce qui est attendu pour une stout.
- `f5-phares.ts` : identique avant et après (18/31 styles avec un phare dans les 10, 12/31 dans les 5, médiane des médianes 37,5 ; Mosaic 4e achat en 21A).
- `f2-borne.ts` : identique (phares manquants : aucun, aucun, « mosaic, cascade » ; la borne ne dépend pas du rang) ; chaud 143 ms et 122 ms.

## Essais utilisés
Tests : 2 passes de réglage (1re : 11 rouges, causes lues, tout corrigé). États : 3 passes (1re : picto-épice absent faute de chargement dans la maquette ; 2e : `etat-fiche-substituts` cassé par le rejeu de `{}` ; 3e : gr5-cran et q2b à actualiser). Une erreur de lanceur (`avec-table.ts`, argv sous vite-node) et une collision de nom de sortie (f2 et f5 écrivent le même `phares-<nom>.json`), corrigées.

## Doutes et limites
- Les empreintes `proposer` des bancs sont posées AVEC la table (3a04edf5a1af, au lieu de 3c7fcd571305) ; sans la table elles valent 1bf1a22469f1 (chaque voie porte `typicite` : inconnue, dite).
- Un rare cas de course : si Suggérer s'ouvre avant l'arrivée de la table (réseau très lent), la liste est calculée sans elle, puis recalculée à l'arrivée (caches vidés) ; le chargement part au montage, avant la préchauffe au repos, donc ce cas demande une ouverture plus rapide que le chargement d'un chunk de 10 ko.
- La maquette servie avec un Worker (HTTP, pas file://) ne reçoit pas la table dans son worker : son propre `alimenter` (`parcours/src/moteur/calcul.worker.ts`) n'est pas câblé. Les contrôles d'états tournent en file://, sur le fil principal. `BESOIN C8 : aucun` ; précharge au repos (`precharge.ts`, fichier de c8) : on pourrait y ajouter `chargerTypicite()` pour réchauffer le cache HTTP sans ouvrir l'étape ; non fait, non nécessaire.

DÉCISION À PRENDRE : (1) Citra cryo premier : 2 listes sur 16 au lieu d'1. Le 2e cas est 21C « plus floral » à 10′ (Citra y est « typé » : 21C est un style où il est très courant) ; au dry hop 21C, Citra cryo passe aussi de la 2e à la 1re place. D174 craint justement ce glissement. Options : (a) garder le défaut et le dire au brasseur (la planche de mini maquettes lui montre les quatre combinaisons, c'est lui qui choisit) ; (b) borner l'effet : ne compter la typicité que lorsque l'écart de départage porte sur des houblons que le brasseur n'a pas déjà en stock (Citra cryo est dans le stock des fixtures) ; (c) retirer la typicité du défaut hors stouts. Recommandation : (a), puisque le gain vient de la même cause (Nelson Sauvin 99 → 18, Mosaic 41 → 12, East Kent Goldings premier du stout) et que le brasseur a décidé de voir les quatre combinaisons. (2) Valider les deux écarts hors « Possède » (`donnees.ts`, `main.tsx`).

CONNAISSANCE : la table de typicité n'a de sens que posée sur chaque fil qui classe : page et worker ne partagent pas leurs modules. Le worker la reçoit dans le message `donnees` (ordre des messages garanti) plutôt que de la charger lui-même, sinon une réponse calculée sans elle reviendrait à la page. Le défaut `typicité` ne change pas la liste du banc sans table : sans elle, l'ordre est celui de k3k1. Sur la fixture de la maquette (stout S1), la typicité replace East Kent Goldings, First Gold, Pekko, Barbe Rouge ; Hallertau Tradition et Huell Melon ne venaient que de l'ordre alphabétique.

LEÇON PROPOSÉE : une consigne qui prédit qu'un état « repasse tel quel » se teste avant la voie : gr5-cran lit un NOM de houblon (donnée), donc il changeait forcément avec l'ordre ; la même consigne ignorait aussi que la maquette n'a pas l'étape qui lance le chargement. Pour un changement de défaut qui dépend d'un chargement, nommer le point d'entrée de chaque hôte (app, maquette, worker) dans la VOIE.md.
