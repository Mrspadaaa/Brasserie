OK — pack Beer Maverick installable (fiches à part, octets d'avant d2) ; 5 tests proto verts, 1 attend la régénération de pack-fiches.json

## Fichiers écrits
- `src/data/hopBeerMaverickBootstrap.json` : sans `hopBeerMaverickFiches`. Comparé à `git show 79ca35f5^:…` avec `cmp` : identique octet pour octet.
- `src/data/hopBeerMaverickFiches.json` (neuf) : tableau des 318 dossiers, contenu de l'ancienne clé.
- `scripts/scrape-hop-community.mjs` : `save()` n'écrit plus que le pack ; les dossiers vont dans `hopBeerMaverickFiches.json` (échantillon `--limit` : dossier temporaire, comme avant).
- `prototypes/houblons-v4/scripts/build-data.mjs` : lit les fiches dans le nouveau fichier.
- `tests/unit/hopIndexV4/coherenceCatalogue.test.ts` : idem (seul autre lecteur ; `grep` sur tout le dépôt hors `work/refonte-frontend`, aucun autre).
- `tests/unit/hopIndexV4/packInstallable.test.ts` (neuf) : le pack passe `parseBackup` (même chemin qu'`installPack`), n'a que les cinq clés d'un pack, et les fiches sont un fichier à part, 318, même ordre.
- `prototypes/houblons-v4/tests/` : `client-async`, `worker-calculs` (empreinte `remplacants`), `donnees` (farnésène de Nugget).
- `work/missions/…/r180-pack/installer-maverick.mjs` et `installation-maverick.png` (rendu).

## Critères
1. Test d'abord. Sur HEAD (fiches dans un fichier mais la clé encore dans le pack) : 2 rouges sur 3, `Error: Collection invalide : hopBeerMaverickFiches.`. Après : 3/3 verts.
2. Pack identique à avant d2 (cmp). `proto-data.json` régénéré par `build-data.mjs` : `cmp` avec la version de HEAD, identique. Producteur : `HOP_SOURCE_CACHE=<dépôt principal>/.codex-remote-attachments/hop-index/public-sources node scripts/scrape-hop-community.mjs --only beer --offline` réécrit pack et fiches, tous deux identiques octet pour octet (318 extraites, 0 erreur). Le cache n'existe pas dans ce worktree : variable obligatoire.
3. Les 6 tests du prototype. Worktree jetable (supprimé) au parent de d2 (`4943c8b6`) : déjà 4 rouges sur 6, donc pas d2.
   - **Empreinte `remplacants` (client-async ×3, worker-calculs ×1)** : `81efdc544613` → `d646d7130b2f`. Bissecté : verte à `883e1c9b^`, rouge à `883e1c9b` (« autres n % », mots sans famille distincts après traduction), pas à d2. Diff du résultat de `remplacants` avant/après ce commit : uniquement `partSansFamille` (0,83→0,71 ; 0,33→0,2) et `motsSansFamille` (doublons de traduction retirés) de 2 houblons ; scores, rangs, paliers, doses, stock identiques. Le résultat à `4943c8b6` (avant d2) et celui d'aujourd'hui sont identiques (`diff` vide) : d2 ne change rien. Empreinte mise à jour avec ce commentaire ; `substitutes`, `suggerer`, `proposer` inchangées et vertes.
   - **donnees.test (Nugget)** : l'assertion « farnésène null, non importé » disait un manque que d2 a comblé (page : « 0-1% »). Remplacée par la valeur `{min 0, max 1}` ; le cas « null avec raison, jamais 0 » est gardé sur Akoya (page sans farnésène ; 69 houblons sur 318).
   - **pack.test** : `data/pack-fiches.json` (hors Possède, non écrit) est périmé. Régénéré dans un tampon : `pack-mini-protos.json` identique octet pour octet ; dans les 32 fiches, seuls changent `huiles.composants.farnesene` (28 valeurs ajoutées, était null) et `farneseneRaison` (28 retirées, 4 reformulées). Exactement l'apport de d2. Avec ce fichier posé (puis remis) : 15 fichiers, 157/157 verts. Sans : 156/157.
   - `moteurInchange.test.ts` : vert (données moteur, 318 profils, substituts de 12 houblons) ; l'empreinte `remplacants` n'y figure pas mais la comparaison directe avant/après d2 ci-dessus la couvre.
4. Rejeux : `hopStudy.test.ts` 9/9 ; `tests/unit/hopIndexV4` 48 fichiers, avec hopStudy 49 fichiers / 395 tests verts ; `fusion.mjs --sans-ecriture` : sha256 `complements.json` d6d95a96…5ce5ec2 et `complements-non-rattachees.json` 69a3c2e8…23a6ad92b55 inchangés, `git status` propre sur `src/data/hopV4` ; `npm run build` vert ; `npx tsc --noEmit` sans sortie.
5. Vrai rendu : Chrome, `?dev-local`, serveur Vite local (arrêté), requêtes hors 127.0.0.1 bloquées (0 tentative), base locale du navigateur : « Autres référentiels » → « Ajouter Beer Maverick » → « 318 fiche(s) ajoutée(s). Les fiches existantes sont conservées. », 318 variétés en base, 0 erreur de page. Capture `installation-maverick.png` ouverte et lue. Pas de capture « avant » (la clé en faute est retirée) : le rouge est celui du test 1.

## Essais
Un seul par critère, sauf le rendu (3 : attente de chargement, puis du résumé).

## DÉCISION À PRENDRE
Régénérer `prototypes/houblons-v4/data/pack-fiches.json` (hors Possède). Commande : `cd prototypes/houblons-v4 && npx vite-node scripts/build-pack.ts` (écrit aussi `pack-mini-protos.json`, qui ne change pas). Options : le pilote la lance et commite, ou m'étend le Possède. Recommandation : la lancer ; la preuve ci-dessus montre que seul le farnésène change.

## Doutes et limites
- `src/domain/hopIndex/v4/fiches.ts:59` (hors Possède) écrit toujours « Aucune donnée de substitution dans le dépôt (… non importés) » alors que d2 a importé les substituts de Beer Maverick (`bm.substituts`) : texte devenu faux, à voir avec la voie d3b ou le pilote. `donnees.test` l'attend encore (`substituts` null).
- La chaîne `sources.varieties` de `proto-data.json` ne cite que le pack, pas le fichier des fiches : gardée telle quelle pour l'identité octet pour octet.
- La production a le bouton cassé depuis D76 : le correctif ne part qu'avec un déploiement (accord du brasseur).
- Doc : `docs/qualite/*` et README de prototypes anciens citent le pack sans les fiches : rien à changer.

CONNAISSANCE : un pack de `src/data/*Bootstrap.json` est une unité d'installation : `installPack` envoie chaque clé à `parseBackup`, qui refuse toute collection hors `BUSINESS_COLLECTIONS`. Une donnée annexe vit dans son fichier.
LEÇON PROPOSÉE : un format de fichier partagé (ici un pack installé) a des lecteurs hors de la voie : avant d'y ajouter une clé, chercher qui l'installe (`grep` du nom du fichier dans `src/ui`) ; un test « le pack passe la validation d'installation » aurait attrapé d2. Et une suite verte « à la voie » (r177 : 197/197) ne dit rien d'une autre suite (prototype) : 883e1c9b avait cassé 4 empreintes sans que personne les rejoue.
