OK — composes-houblon.json en morceau à part : B5 164,9 → 147,3 ko ; Chrome et temps d'ouverture à rejouer (DEMANDE EXECUTANT)

## Ce qui est fait

Point de départ rejoué : B5 = 165,1 ko (profil-simule 809 ko bruts, 150,4 ko gzip). Le fichier lui-même fait 80 ko bruts, 19 ko gzip : les « 811 ko » du brief sont le chunk entier.

Principe :
- `src/domain/hopIndex/v4/composes.ts` (neuf, sans import statique de données) tient `DONNEES_COMPOSES` (un objet d'identité stable, vide avant l'arrivée, rempli ensuite) et le chargeur : `chargerComposes(importer)` (un seul chargement, un échec n'est pas mémorisé), `siComposesArrivent(f)` (même modèle que `siCataloguePleinArrive`), `installerComposes`, `composesCharges`, `ComposesAbsents`, `oublierComposes` (tests).
- `pouvoir.ts` lit cet objet à la place de l'import JSON ; `DONNEES_POUVOIR` garde son identité. `source()` lève `ComposesAbsents` avant l'arrivée : jamais une valeur par défaut, jamais 0.
- `profil-simule.ts` : `SEUIL_CITRONELLOL` était calculé à l'import (la fumée du worker l'a révélé : `reading 'citronellol'`) ; il est lu au premier besoin.
- Ouverture d'un outil : `chargerOutils()` demande le chunk des outils ET le morceau des composés ensemble (parallèle), et ne rend les outils qu'une fois les composés posés. Aucun écran ne les voit absents (modèle : l'état « outils pas encore là » déjà géré). Le préchargement au repos de `precharge.ts` passe par `chargerOutils()` : il amène donc aussi les composés, bien avant l'ouverture. `precharge.ts` n'a pas eu besoin de changer.
- `comparer/valeurs.ts` : `SOURCES` et `VARIETES` (figés à l'import) deviennent `sourcesComposes()` et `varietesComposes()`, lus à l'appel ; absents, ils rendent « aucune fiche » (valeurs du catalogue seules, jamais 0). `substituer/donnees.ts` : une ligne, `?.[cle]`. `dryhopper/mesures.ts` ne lit pas le JSON (commentaire seul) : inchangé. `froid.ts` : inchangé (commentaire seul).
- Worker de l'app (`parcours/calcul.worker.ts`) : import statique du JSON et `installerComposes(...)` dans son propre bundle (1 268 259 octets, contre 1 265 385).
- Contextes synchrones (Vitest, vite-node, builds des maquettes, serveur de dev) : `import.meta.glob` eager gardé par `VITE_COMPOSES_A_PART`. Le build de l'application le pose à `on` (`vite.config.ts`, `command === 'build'`) : Rollup retire la branche et le JSON sort du chunk (vérifié : `composes-houblon-*.js` 69 ko / 19,3 ko gzip, à part). Pour essayer l'asynchrone en dev : `--env VITE_COMPOSES_A_PART=on`.

## Écarts au « Possède » (à signaler au pilote)
- `src/ui/hopIndex/chargement.ts` : le défaut de `chargerOutils` (sinon rien n'attend les composés). Seule la fonction `importerOutilsEtComposes` est ajoutée, les tests existants du chargeur passent un importeur et ne changent pas.
- `vite.config.ts` : un `define` limité à `build`, nécessaire pour que le JSON sorte du chunk sans casser les maquettes, les scripts et Vitest, qui le lisent en synchrone. Ce n'est pas la configuration PWA.
- PWA : il n'y a pas de précache à compléter. Ni `vite-plugin-pwa` ni workbox dans le dépôt (seul `public/brew-alerts-sw.js` existe, pour les alarmes). `precharge.ts` l'écrit déjà : un tout premier lancement hors ligne n'est pas couvert (décision de l'utilisateur). Le morceau est chargé par la préchauffe, donc en cache du navigateur avec le reste des outils. Vérifié sur `dist` : `assets/composes-houblon-DKfIDd1-.js` est émis.
- Rien de t2 touché (`BESOIN T2 : aucun`). Les fichiers de t2 bougent (`voies.ts`, `typicite*.ts`, `clientWorker.ts`, `donnees.ts`, `donneesWorker.ts`) : au premier rejeu de vitest, 11 tests de leurs zones étaient rouges (f9Typicite « à l'octet près », clientWorker, f8Intensite, palierDryhop, client-async, worker-calculs), verts au rejeu suivant après la correction de `SEUIL_CITRONELLOL` ; je ne sais pas si la cause était mon import différé ou un état intermédiaire de t2. Dernier rejeu : tout vert.

## Critères
- `VITE_HOP_V4=on npm run build` (tsc + vite + contrôle privé) : EXIT 0, puis `node scripts/check-hop-budget.mjs --dist dist --chunk-outils profil-simule` :
  `B5 ouverture d’un outil v4 : 147.3 ko gzip ajoutés (profil-simule-BXUg2Hko.js, hopExtrapolationBootstrap-DwwEfl2H.js, styleSelection-D1QY3TKp.js, composes-DoS5e3XG.js) (budget 164 ko) tenu` : 147,3 ≤ 160, soit −17,6 ko. B5 : cible tenue.
  B1 921 ko et B2 773 ko : identiques au ko près à la référence (le script les marque DÉPASSÉ avec ses arguments par défaut, comme avant). Au détail : mon ajout tient dans `chargement` (0,43 → 0,54 ko gzip), hors fermeture du démarrage (B1 inchangé de mon fait) ; B2 gagne au plus 0,1 ko de mon fait (`EtapeHoublons` +0,10 ko aussi, sans rapport avec mes fichiers : `parcours/donnees.ts` de t2). Aucun plafond ni script touché.
- `npx tsc --noEmit` : sans sortie.
- `npx vitest run tests/unit/hopIndexV4 prototypes/houblons-v4/tests --maxWorkers=2` : 107 fichiers, 1003 tests verts. Test neuf : `tests/unit/hopIndexV4/composesAPart.test.ts` (7 tests) : avant l'arrivée (tables absentes, `source()` lève, Comparer et Substituer ne parlent que du catalogue, jamais de composés ni de 0), pendant (un seul chargement, l'ouverture n'est pas rendue avant les composés, en parallèle), après (identité stable, abonnés appelés une fois, déjà là : tout de suite), échec réseau non mémorisé.
- `fumee-worker-prod.mjs` : `WORKER PROD OK` (sur `dist` et sur le build à part ; `leviers` 84 ms, `proposerRapide` 234 ms, 14 voies).
- `npm run check:hop-perf` : les 6 mêmes dépassements que la référence (Dryhopper frise 41,30 ms p95 ; Comparer 29,05 ; feuille « jour après jour » 149,11 ; Suggérer sans préchauffage 311,44 ; tranche de préchauffage 758,80 ; le tout 864,03), aucun nouveau. Ces mesures sont côté Node (composés synchrones) : elles ne disent rien de l'asynchrone ; elles confirment seulement qu'il n'y a pas de régression du moteur. Référence du 27.10 : 32,52 / 25,14 / 130,54 / 296,44 / 701,54 / 799,96 ; le poste est chargé (t2 tourne en même temps), le bruit est de l'ordre de 15 %.
- `npx vite-node scripts/eval-hop/f2-perf.ts` (ms) : `suggerer-defaut-froid 532 ; suggerer-defaut-chaud 127,2 ; suggerer-defaut-16D-floral-chaud 165,9 ; suggerer-g2b-chaud 717,2 ; substituer-60-chaud 22 ; houblons 317`. Pas de référence chiffrée dans le dossier du rejeu, à comparer par l'exécutant si besoin.
- Un essai de `mesurer-ouverture.mjs` (N=1, composés à part, dev) : toucher → Dryhopper rendu, à froid 849,3 ms (4 longues tâches, la pire 164 ms), à chaud 471,4 ms (5, la pire 116 ms). Un seul passage : ce n'est pas encore une mesure.

## Doutes et limites
- Le « avant / après » de l'ouverture (L20) est à faire en série : voir la demande ci-dessous. En dev, le serveur ne regroupe rien : le résultat montre le coût du portillon (attente des composés), pas celui d'un build de production. Sur `dist`, la page de production ne sert pas `?dev-local` : une mesure prod demanderait un autre contrôle (je ne l'ai pas écrit).
- Les quatre contrôles Chrome ne sont pas rejoués par moi (série mécanique).
- Une capture ne figure pas ici : aucun rendu n'a changé (le portillon ne dessine rien).

## DEMANDE EXECUTANT :
Depuis la racine, un port libre par commande, dans cet ordre. Ne rien modifier dans le dépôt. Attendre « Arrêt de 1 serveur » à chaque fin.

1. Avant (composés en synchrone, comme avant c8) puis après (composés à part, comme le build) ; N = 5 par scénario :
   - `OUVERTURE_N=5 node scripts/with_server.mjs --server "npm run dev -- --port 5481 --strictPort" --port 5481 --env VITE_HOP_V4=on -- node work/missions/2026-10-25-integration-houblons/voies/c8-composes-hors-chunk/mesurer-ouverture.mjs avant`
   - `OUVERTURE_N=5 node scripts/with_server.mjs --server "npm run dev -- --port 5482 --strictPort" --port 5482 --env VITE_HOP_V4=on --env VITE_COMPOSES_A_PART=on -- node work/missions/2026-10-25-integration-houblons/voies/c8-composes-hors-chunk/mesurer-ouverture.mjs apres`
   Sorties attendues : `OUVERTURE avant OK` et `OUVERTURE apres OK`, avec les lignes JSON `froid` et `chaud` (médiane, max, longues tâches, pire longue tâche). Recopier le tableau (4 lignes) dans un fichier `MESURES.md` du dossier de la voie. Seuil à signaler : à chaud, médiane après > médiane avant + 50 ms, ou une longue tâche > 200 ms qui n'existe pas avant.
2. Les quatre contrôles, avec le serveur en asynchrone (c'est le cas à vérifier), puis les mêmes avec le serveur sans la variable si l'un échoue :
   - `node scripts/with_server.mjs --server "npm run dev -- --port 5483 --strictPort" --port 5483 --env VITE_HOP_V4=on --env VITE_COMPOSES_A_PART=on -- node tests/integration/controle-ma-biere-app.mjs`
   - idem port 5484, `tests/integration/comparerValeurs.chrome.mjs`
   - idem port 5485, `tests/integration/controle-froid-dryhopper.mjs`
   - idem port 5486, `tests/integration/controle-radar-echelles.mjs`
   Sorties attendues : le jeton « OK » de chacun (comme dans `C:/Users/mrspa/AppData/Local/Temp/rejeu-5330/08-1-…`, `08-3-…`, `08-6-…`, `08-11-…`). `comparerValeurs.chrome.mjs` lit `composes-houblon.json` sur le disque : il ne dépend pas du chargement.
   Captures à ouvrir (L12) : celles que chaque contrôle écrit dans `%TEMP%` ; au moins une de Comparer (huiles et composés remplis, aucune cellule à « 0 ») et une de Dryhopper (mini graphes du froid dessinés).
3. Rendre à l'auteur : les sorties, les médianes et le contenu de `MESURES.md`.

CONNAISSANCE : composes-houblon.json pèse 80 ko bruts, 19 ko gzip ; le chunk `profil-simule` pèse 809 ko, dont proto-data.json (556 ko bruts, 74,5 ko gzip) : c'est le prochain gros morceau si B5 remonte. Pas de service worker de précache dans le dépôt.
LEÇON PROPOSÉE : un module qui lit une donnée à l'import (`const X = (() => DONNEES.y.z)()`) casse en silence quand la donnée devient asynchrone : les tests Vitest le cachent (données en synchrone) et seule la fumée du build de production l'a vu. Lire `grep` des lectures de niveau module avant de déplacer une donnée.
