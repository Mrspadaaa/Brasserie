OK — D60 : à 60′ Suggérer n'ajoute jamais rien ; Substituer tête de liste faite d'inconnus d'amertume ; causes prouvées

## D60 RAPPORT

Mesuré au commit de production `ae7c7a8d`, dans la copie propre (`C:/Users/mrspa/AppData/Local/Temp/deploy-63130965`), catalogue plein (505 variétés), typicité chargée comme l'app. Le moteur est celui de l'app ; les filtres de l'écran (`suggerer/voies.ts` `voiesDe` : types gardés, `exclue`, `enleveBannie`, groupe Dry hop des leviers ; `substituer/donnees.ts` `composer`) sont refaits à l'identique dans `d60-mesure.ts` et `d60-substituer.ts`. Quatre recettes de fixture, deux états de stock (« sans stock » = ce que montrent les captures ; « stock fixture » = 9 houblons en stock du prototype). Le stock réel du brasseur n'est pas connu.

### Verdict en trois lignes
1. **Suggérer, « les propositions à 60′ »** : aucun ajout à 60′ n'est jamais proposé (0 sur 56 cas) : le moteur reçoit en dur `moments = b10, wp, dryActive, dryPost` et l'option `palier60` (g2b) n'est appelée nulle part dans `src/ui`. Un « Remplacer X · 60′ » n'apparaît que dans 6 cas sur 56, tous des demandes « sans / moins de », jamais pour une demande d'arôme. « Plus d'amertume » est inexprimable (direction vide : 0 voie).
2. **Substituer à 60′** : la liste n'est jamais vide, mais sa tête est faite de houblons dont l'amertume est inconnue (« Bru 100 », « Kohia Nelson 100 »…), et l'écran dit « Aucun remplaçant sans inconnue ». Nugget à 60′ : 5 inconnus sur 5 montrés, dans 31 styles sur 31. C'est, pour moi, la lecture la plus probable de « pas de proposition du tout à 60′ ».
3. **Le bannissement D194 n'est qu'une cause mineure** : il retire 5 à 26 % des candidats, jamais tous ; en bannissant, un remplacement à 60′ est montré dans 31 styles sur 31. Il coupe pourtant APRÈS la coupe d'affichage du moteur, sans rendre la place : dans 1 cas sur 12, il retire la seule rangée à 60′ (21C bannir résineux sans stock, `sorties/d60-ban.json`).

### Tableau de fréquence, Suggérer (56 cas : 4 recettes × 7 demandes × 2 stocks ; `sorties/tableau.md`)
Colonnes : voies montrées à l'écran (dont « Remplacer … à 60′ »). Ajouts à 60′ montrés : **0 dans les 56 cas**.

| recette (amérisant) | + agrumes | + tropicaux | + floral | + résineux | amertume | bannir résineux | + tropicaux, bannir résineux |
|---|---|---|---|---|---|---|---|
| neipa v3 22A (Lotus 84 g, 40′ → b30) | 14 (0) / 4 (0) | 14 (0) / 4 (0) | 14 (0) / 4 (0) | 14 (0) / 4 (0) | 0 / 0 | **0 / 0** | 14 (0) / 4 (0) |
| stout S1 16D (Nugget 46 g, 60′) | 14 (0) / 4 (0) | 14 (0) / 4 (0) | 14 (0) / 4 (0) | 14 (1) / 4 (0) | 0 / 0 | 8 (8) / 4 (4) | 14 (5) / 4 (1) |
| 21C hazy (Nugget 20 g 60′, Cascade dry) | 14 (0) / 4 (0) | 14 (0) / 4 (0) | 12 (0) / 2 (0) | 12 (0) / 2 (0) | 0 / 0 | 11 (4) / 3 (0) | 14 (0) / 4 (0) |
| pale ale 18B (Magnum 14 g 60′), fixture d60 | 14 (0) / 4 (0) | 14 (0) / 4 (0) | 14 (0) / 4 (0) | 14 (0) / 4 (0) | 0 / 0 | 12 (0) / 4 (0) | 14 (0) / 4 (0) |

Chaque cellule : « stock fixture / sans stock ». Lecture :
- **Sans stock, l'écran montre 4 voies au plus, toutes demandes confondues** : c'est `buyLimit = 4`, une coupe globale. Avec le stock fixture : 14 (10 + 4).
- « Amertume » : 0 voie partout (`Direction` ne porte que des familles). Lotus, neipa v3 : bannir le résineux = 0 voie, l'écran le dit (« Aucune voie houblon · Hors houblon › », capture `captures/neipa-bannir.png`) : c'est honnête, Lotus ne cite pas le résineux.
- Seul « Remplacer … 60′ » apparaît quand la demande est de retirer (stout et 21C bannir, stout + résineux avec stock).

### Généralisation sur 31 styles (`a4-general.ts` lancé tel quel, puis `d60-mesure.ts --styles` ; recette a4 : Nugget 20 g à 60′, `sorties/d60-styles.json`)
- `a4-general.ts` (dry hop actif et 10′, 62 listes) : 4 des 62 listes n'ont **qu'un houblon**, aux deux moments, 0 phare (23A et 23G × « plus d'agrumes », « plus floral ») ; contradiction carte / liste : 10 sur 62 (4 si le neutre est exclu). Rien à 60′ dans ce banc : il ne mesure pas 60′.
- À 60′, sur les mêmes 31 styles × 4 demandes (agrumes, floral, résineux, bannir résineux) : **ajouts à 60′ : 0 sur 124** ; « Remplacer … 60′ » montré : agrumes 4 styles sur 31 (1A, 4A, 10A, 24A, des lagers où presque aucun ajout ne progresse), floral 4, résineux 4, bannir résineux **31 sur 31**. Voies montrées : 4 partout (sans stock), 2 pour 23A et 23G.
- Substituer, Nugget à 60′, 31 styles : 5 inconnus d'amertume sur 5 montrés dans **31 styles sur 31** (`sorties/d60-substituer.json`, `syntheseStyles`).

### Tableau de fréquence, Substituer (remplaçants montrés à l'écran, dont amertume inconnue)
| houblon de la recette | moment | montrés | amertume inconnue |
|---|---|---|---|
| Lotus (neipa v3) | 30′ (b30) | 5 sans stock, 7 avec | 4 |
| Nugget (stout S1) | 60′ | 5 sans stock, 6 avec | **5** |
| Nugget (21C) | 60′ | 5 / 6 | **5** |
| Magnum US (pale ale) | 60′ | 5 / 5 | 0 |
| Cascade (21C dry hop actif ; pale ale 10′ et dry) | arôme | 5 / 5 | 0 |

20 houblons courants posés à 60′ : au moins 1 inconnu parmi les 5 montrés pour **17 sur 20**, au moins 3 pour 13, 5 sur 5 pour 5 (Nugget, Centennial, Citra, Mosaic, Hallertau Blanc) ; **à 10′ : 0 sur 20**. Les trois qui s'en sortent (Magnum, Perle, East Kent Goldings) sont les mieux documentés en amertume.

## Les causes, prouvées

### C1 (Suggérer) — l'écran ne demande jamais 60′ : aucun ajout à 60′ par construction
- `voies.ts` `proposeVoies` : `moments = ['b10','wp','dryActive','dryPost']` par défaut ; l'adaptateur (`voiesProposees`) ne le surcharge pas ; `palier60` et `dryHop` (g2b, dans le moteur depuis le 26.10) ne sont appelés par aucun fichier de `src/ui` (grep sur la copie : vide).
- Preuve : ajouts à 60′ montrés = 0 sur les 56 cas, puis 0 sur les 124 cas de styles. Le groupe « Amérisant · 60′ » (M1) et la carte « Plus d'amertume » (M2), que le brasseur a retenus (D94, registre `choix/ecrans.json`), ne sont pas dans la production.
- Cette absence est **juste pour une demande d'arôme** (g1 : à 60′ « +1,6 pt à 1 g/L » contre +34,5 à 10′ et +55,6 au dry hop, soit 0,02 cran) mais l'écran ne le dit nulle part (capture `captures/stout-agrumes.png` : « Plus agrumes · Atteint », groupe 10′, rien sur 60′, aucun mot).

### C2 (Suggérer) — « Remplacer X · 60′ » existe mais arrive après des centaines d'ajouts, puis la coupe globale l'enlève
Entonnoir, stout S1, « plus d'agrumes », sans stock (`sorties/d60-mesure.json`, `entonnoirRemplacerAmertume`) :
| étape | nombre |
|---|---|
| candidats « remplacer Nugget » examinés (pool entier) | 375 |
| après « apporte un mouvement établi vers la cible » (`progress`) | 182 |
| dont conflit de famille | 0 |
| après `exclue` (rien de banni) | 182 |
| rang du premier dans la liste complète triée | **273 : 272 ajouts à 10′, wp et dry hop passent devant** |
| montrés (`limit` 10 stock, `buyLimit` 4 à acheter) | **0** |
- Cause : la clé « distance à la cible » classe un remplacement à 60′ (effet d'arôme ≈ 0) derrière tout ajout à 10′ ; la coupe d'affichage est **globale** (4 à acheter, 10 du stock pour tous les types et tous les moments), donc rien ne reste pour le 60′.
- Mêmes rangs sur toutes les recettes : neipa 445 à 1093, 21C 55 à 609, pale ale 441 à 829 devant le premier remplacement.
- Quand la demande est « sans / moins de », les ajouts ne progressent pas (ils ajouteraient la famille) : le premier remplacement est au rang 1 à 2 et s'affiche. Cas à part, 21C bannir résineux sans stock : le moteur garde 1 seule rangée à 60′ (rang 2) à côté de 3 remplacements du dry hop (Cascade) dans les 4 places à acheter (`buyLimit` partagé entre ajouts) ; `exclue` (D194) retire la rangée à 60′ et la place n'est pas rendue : 0 « Remplacer Nugget », 3 « Remplacer Cascade · dry hop » (`sorties/d60-ban.json`).

### C3 (Suggérer) — quand un remplacement à 60′ s'affiche, il ne lit pas l'usage
- g2b a écrit la règle (D88 B : amérisant ou double usage avant arôme) sous l'option `palier60`, jamais appelée. Dans la liste de remplacement du stout (bannir résineux, 297 candidats après `progress`) : 31 amérisants, 76 doubles usages, **88 d'usage « arôme »**, 102 inconnus (`sorties/d60-pool.json`). La capture `captures/stout-bannir.png` montre « Cashmere α 8,4 % · 70 g » (arôme) et « Nelson Sauvin 51 g » en tête pour remplacer 46 g de Nugget à 60′.

### C4 (Substituer) — un score bâti sur une seule variable, de poids 0,1, passe en tête à 60′
Preuve (`sorties/bru.txt`, Nugget 46 g à 60′, stout S1, 504 candidats) :
- rang 1 ex æquo, score 100, palier « très proche » : Bru, Cluster fugget, Extra styrian dana, Kohia Nelson, Limequat, machops, Mapuche, Mega Motueka (12 au total), tous avec `composantes = { arome: 100, huiles: null, amertume: null }`, couverture d'amertume vide, couverture d'huiles 0.
- Mécanique : à un moment d'amertume, les poids de groupe sont amertume 0,7 · huile 0,2 · arôme 0,1 ; « un inconnu sort du calcul » ; il ne reste que la variable « part de familles étrangères » du candidat (`ressemblances`, branche `amertume`), qui vaut 1 quand le candidat ne cite que des familles que Nugget cite aussi ; le score = 1 × poids / poids = 100. Le classement ne les met pas derrière : `fiabilite = 'faible'` exige familles ET mots inconnus ; ici les familles sont connues.
- Les substituts que le brasseur attend de Nugget (CTZ) : Warrior rang 22 (score 95), Chinook 32 (93), Columbus 48 (91), Magnum US 48 (91), Zeus 61 (90) ; tous avec α, β, cohumulone, rôle connus.
- 76 candidats sur 504 ont une amertume inconnue ; les 8 premiers le sont tous, 12 des 30 premiers.
- À l'écran : « Aucun remplaçant sans inconnue. Bru, Cluster fugget, Extra styrian dana, Kohia Nelson, Limequat vont de 10 à 100 » (`captures/stout-substituer.png`, ouverte).
- Si l'on mettait les amertumes connues d'abord (simulation par filtre, rien d'appliqué) : tête de Nugget = Styrian Eureka 99, Trident 99, Yeoman 99, Helios 97, Centennial 96.

### Pistes de VOIE.md : verdict
| piste | verdict | preuve |
|---|---|---|
| bannissement D194 | **cause mineure, ponctuelle** : élague, ne vide presque jamais | candidats : stout 297 → 283 (−14), 308 → 283 ; 21C 242 → 219 ; pale ale + tropicaux 104 → 77 (−26 %) ; jamais 0 ; 31 styles : remplacement à 60′ montré en bannissant 31/31. Mais `exclue` (un houblon qui cite la famille dans UNE fiche) s'applique à l'écran après la coupe du moteur (`buyLimit`), alors que le moteur n'exclut que les houblons où la famille est MARQUÉE (D90) : 12 cas « bannir » mesurés, `exclue` retire 0 à 2 voies déjà gardées, sans rendre la place ; 21C sans stock : la seule rangée « Remplacer Nugget · 60′ » gardée est retirée, restent 3 remplacements au dry hop |
| règles D106 (Substituer) | **sans effet sur la tête** | `amertumeDeconseillee` (usage arôme) est bien calculé, mais les inconnus passent avant : 0 reculé parmi les montrés |
| g2b usage arôme à 60′ et `palier.ts` | **non branchés** (C1, C3) | aucun appel de `palier60` dans `src/ui` |
| présélection a4 par la typicité | écartée | `typicite` n'entre que dans la clé de départage des voies d'arôme ; les voies à 60′ ont une clé inconnue (voies.ts, `aAmertume`) |
| borne du pool (80) | écartée à 60′ | 182 candidats → 51 dans le pool de 80, mais la répartition d'usage reste la même (amérisant 6 % → 10 %, double 37 %, arôme 57 % → 53 %) et rien ne s'affiche de toute façon |
| « aucun effet d'arôme à 60′ » | **vrai, mais non dit** | g1 : 0,02 cran à 60′ ; l'écran ne l'écrit nulle part (C1) |
| typicité | écartée | voir ligne a4 |
| `buyLimit` | **cause secondaire confirmée** | 4 voies au total sans stock ; 2 voies en 21C floral ; absorbe les « Remplacer … 60′ » (C2) |

## Ce qu'un brasseur attend à 60′ (PRODUCT.md ne dit rien de 60′ ; sources : SPEC-BRASSEUR, m6, D88 B, g1)
- **Demande d'arôme (agrumes, tropicaux, floral, résineux), cas vide à 60′** : ne rien proposer à 60′ est correct, mais l'écran dit « rien d'aromatique à 60′ : l'arôme n'y survit pas (0,02 cran) ; le moment utile est 10′, whirlpool ou dry hop » et le montre déjà (les groupes 10′ et whirlpool sont là). Aujourd'hui : silence.
- **« Plus d'amertume » / un amérisant** (sa phrase du 31.10, sa carte M2 retenue le 26.10) : des amérisants pour +n IBU, rangés usage puis α, avec la dose exacte (g2b : 21C +10 IBU → Moutere, Vic Secret, Apollo, Eclipse, Ahhhroma). Aujourd'hui : 0 voie.
- **Bannir un résineux alors qu'un amérisant à 60′ le porte** (stout, 21C) : un « Remplacer Nugget · 60′ » par des amérisants ou doubles usages (Warrior, Columbus, Magnum, Chinook), pas Cashmere ni Nelson Sauvin (arôme, 70 g pour 55 IBU).
- **Bannir quand rien ne le porte** (neipa v3 : Lotus) : « Aucune voie houblon » + hors houblon : déjà bon, à garder.
- **Substituer à 60′** (u4, D127 : « substitution en fonction de l'étape ») : des houblons amérisants comparables sur α, β, cohumulone, rôle ; un houblon dont on ne sait rien de l'amertume ne doit pas être le premier et ne doit jamais être « très proche ».

## Corrections proposées (rien appliqué ; une règle de principe chacune)
| # | règle de principe | fichier | effet attendu | qui décide |
|---|---|---|---|---|
| K1 | **Un inconnu passe après le connu** (inconnu ≠ 0, L14) : à un moment d'amertume, un candidat sans aucune variable d'amertume connue (α, β, cohumulone, usage) passe derrière tout candidat qui en a ; son score, fondé sur 10 % du poids, ne s'étiquette pas « très proche ». Même esprit que la clé `fiabilite` | `src/domain/hopIndex/v4/substitution.ts` (clé c1 du classement, ~l. 426) | Nugget à 60′ : inconnus montrés 5/5 → 0/5 ; tête = amérisants connus ; 17/20 houblons à 60′ touchés → 0/20. À rejouer sur `scripts/eval-hop/f1-*.ts` et le banc e1 avant (L20 : un réglage se juge sur l'autre moitié) | pilote (convention de classement) ; aucun écran change |
| K2 | **À 60′ on propose de l'amertume, jamais de l'arôme** (D88 B) : appeler `palier60: { ibu }` et afficher le groupe « Amérisant · 60′ » et la carte « Plus d'amertume +n IBU » | `src/ui/hopIndex/parcours/adaptateur.ts` (`voiesProposees`), `src/ui/hopIndex/suggerer/voies.ts` et `index.tsx` | ajouts à 60′ : 0 → 5 montrés (113 à 205 candidats) ; « amertume » ne rend plus 0 voie | **le brasseur** (M1 + M2 choisis avec la réserve D165 « palier 60′ pas très clair » : le lot m7 ; règle n° 1, écran choisi) |
| K3 | **Une absence qui a une raison se dit** : sur une demande d'arôme, une ligne « À 60′ l'arôme ne survit pas ; moment utile : 10′, whirlpool, dry hop », chiffrée par la source g1 | `suggerer/index.tsx` | le silence de `stout-agrumes.png` devient une réponse | le brasseur (texte et place : mini maquettes, jamais en mots) |
| K4 | **Chaque ajout de la recette garde sa place dans la liste, et un filtre rend la place qu'il prend** : `limit` / `buyLimit` ne s'appliquent plus à toute la liste mais par ajout remplacé (au moins 2 rangées par « Remplacer X »), et l'exclusion D194 (`exclue`) passe AVANT la coupe, pas après (le moteur reçoit les familles bannies comme exclusions, ou la coupe se refait après le filtre) | `voies.ts`, boucle `kept` (~l. 535) ; `suggerer/voies.ts` `voiesDe` | 21C bannir résineux sans stock : une rangée « Remplacer Nugget · 60′ » (non exclue) apparaît ; aujourd'hui 0 montré. Les mots du brasseur D194 (« aucune suggestion sur ce chemin ») restent tenus | pilote (moteur) ; l'écran existe déjà (un groupe par houblon remplacé, D194) |
| K5 | **Un brasseur n'amérise pas avec un houblon d'arôme** : appliquer la règle d'usage de g2b à « remplacer à IBU égal » sans attendre K2 (option dédiée, p. ex. `usage60`) | `voies.ts` (`options.palier60 && bitter`, ~l. 502) | stout bannir résineux : 88 candidats d'arôme sur 297 passent derrière les amérisants et doubles usages ; Cashmere n'est plus en tête | pilote (règle déjà décidée en D88 B et D102) |
| — | bannissement D194 : **ne pas toucher** (ses mots : « aucune suggestion sur ce chemin ») | — | — | — |

Ordre recommandé : K1 (le plus fort, sans écran), K5, K4, puis K2 + K3 avec le lot m7.

## Preuves : fichiers écrits (tous dans la voie)
- Scripts : `d60-mesure.ts` (Suggérer, entonnoirs, `--styles`), `d60-substituer.ts`, `d60-bru.ts`, `d60-pool.ts`, `d60-ban.ts`, `d60-tableau.mjs`, `d60-capture.mjs` (Chrome).
- Sorties : `sorties/d60-mesure.json`, `d60-styles.json`, `d60-substituer.json`, `d60-pool.json`, `d60-ban.json`, `a4-general.json`, `bru.txt`, `tableau.md`, journaux.
- Captures, toutes ouvertes en image (L12) : `captures/stout-agrumes.png` (cas vide : rien à 60′, aucun mot), `stout-bannir.png` (Remplacer Nugget 60′, Cashmere et Nelson Sauvin en tête), `stout-substituer.png` (« Aucun remplaçant sans inconnue », 10 à 100), `hazy-agrumes.png` (« Approche », groupe whirlpool, rien à 60′), `neipa-bannir.png` (« Aucune voie houblon », dit).
- Commandes (depuis la copie propre, scripts copiés dans `dist/d60/`, dossier ignoré par git, retiré à la fin ; vite-node ne charge pas hors de la racine) :
  - `node_modules/.bin/vite-node dist/d60/d60-mesure.ts -- --sortie=<voie>/sorties` (172 s) ; avec `--styles` (535 s) ;
  - `node_modules/.bin/vite-node dist/d60/d60-substituer.ts -- --sortie=…` (6 s) ; `d60-bru.ts` ; `d60-pool.ts -- --sortie=…` ;
  - `node scripts/with_server.mjs --server "npm run dev -- --port 5189 --strictPort" --port 5189 --env VITE_HOP_V4=on -- node <voie>/d60-capture.mjs <cas> <voie>/captures` (cas : stout-agrumes, stout-bannir, hazy-agrumes, stout-substituer, neipa-bannir).

## Critères
- `D60 RAPPORT` : en tête (ci-dessus) avec tableaux, causes et preuves.
- Capture d'un cas vide, ouverte : `captures/stout-agrumes.png` et `captures/neipa-bannir.png`.
- `git status` de la copie propre : `git status --short` renvoie 0 ligne, HEAD `ae7c7a8d`. Rien écrit dans `src/` : les `M` de l'arbre principal (`palier.ts`, `voies.ts`…) sont ceux de s3, déjà là au départ ; aucun serveur lancé dans l'arbre principal.
- Essais : 2 (premier lancement : vite-node refuse un script hors de la racine → copié dans `dist/d60/` ; id `beermaverick-saaz` inexistant → `saaz-cz`). Pas de commit, de stash, de suppression hors mon propre dossier `dist/d60/` de la copie, d'appel Gemini.

## Doutes et limites
- **Stock réel inconnu.** Les captures de dev-local sont sans stock (4 rangées à acheter) ; avec un vrai stock, l'écran montre jusqu'à 10 + 4 voies et le moment (10′, whirlpool, dry) peut changer. Le 60′ reste vide de la même façon : C1 et C2 ne dépendent pas du stock.
- **Mon mime de l'écran n'est pas l'écran.** Même total (4 sans stock) mais pour le 21C la capture montre le groupe whirlpool là où le mime classe 10′ (α du lot 12 % de la recette de capture contre la plage variétale du moteur). Les comptes par moment sont à ± 1 groupe ; aucune conclusion de la voie n'en dépend.
- Le pale ale 18B (Magnum 14 g) est ma fixture, marquée simulée ; neipa v3 : Lotus à 40′ est lu à 30′ (le moteur n'a pas 40′).
- Non mesuré : le calcul en worker (premier affichage `proposerRapide` sans remplacements ; remplacements au repos, 1,4 à 8 s à froid en Node) ; le décalage « ‹ 10′ › » du mode Radar vers 60′ ; Gemini et le tri IA.
- « Amertume inconnue » = `composantes.amertume === null` (aucune des variables α, β, cohumulone, usage connue des deux). Les estimations « si connue d'abord » filtrent l'ordre actuel : ce n'est pas un nouveau classement validé.
- Le juge de ce qui est « bon » à 60′ (Warrior, Columbus, Chinook, Magnum pour Nugget) vient de la réputation CTZ et des scores du moteur, pas d'une source citée dans le dépôt : au brasseur de confirmer.

## DÉCISION À PRENDRE
1. **K1 sans écran** : ranger les inconnus d'amertume derrière les connus dans Substituer à 60′. Options : (a) clé de classement (recommandé, même principe que `fiabilite`) ; (b) exiger un minimum de poids connu pour afficher un score ; (c) ne rien changer. Recommandation : (a), puis rejouer e1 et f1 sur la moitié de jugement. Décideur : pilote.
2. **K2 + K3 touchent l'écran choisi** (Suggérer, M1 + M2) : à lui montrer en mini maquettes sur sa capture q2b (jamais en mots) : où dire « arôme négligeable à 60′ », et si « Remplacer Nugget · 60′ » doit se montrer aussi pour une demande d'arôme (recommandation : non, seulement pour « sans / moins de »). Décideur : le brasseur.

CONNAISSANCE : à 60′, Suggérer ne propose aucun ajout (moments en dur, `palier60` non branché) et Substituer renormalise sur les variables connues : 12 houblons sans amertume connue scorent 100 sur le seul arôme (poids 0,1) et passent en tête de Nugget (rang 1) devant Warrior (22), Chinook (32), Columbus (48). Sources : `sorties/bru.txt`, `sorties/d60-mesure.json`. Note à créer par le pilote dans cerveau/metier.

LEÇON PROPOSÉE : un score renormalisé sur les variables connues doit exiger un minimum de poids connu (ici 10 %) ; sinon un inconnu presque total est le « meilleur » (rôles : auteur, relecteur). Contrôle possible : pour chaque houblon d'une liste de phares, aucun montré sans variable du groupe qui pèse le plus.
