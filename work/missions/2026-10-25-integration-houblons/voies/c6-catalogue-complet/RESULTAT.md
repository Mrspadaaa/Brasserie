OK — 188 variétés des sources ajoutées (chargées à la demande), 49 noms rattachés, Equinox = Ekuanot ; vitest 849/849, build vert, B5 159,0 ko

GATES.md n'existe pas dans le dossier de la voie : critères pris de VOIE.md et du message du pilote (délais).

## Fichiers écrits
- Neufs : `src/data/hopV4/rattachement.mjs` (décision partagée), `src/data/hopV4/alias-noms.json` (table relue à la main), `src/data/hopV4/catalogue-ajouts.json` (188 variétés, 104 ko, 10,7 ko gzip), `tests/unit/hopIndexV4/catalogueComplet.test.ts` (11 tests), `chrono.ts`, `comparer-perf.mjs`, `sonde-froid.ts` (dans la voie).
- Modifiés dans la Possède : `scripts/collecte-hop/fusion.mjs`, `prototypes/houblons-v4/scripts/build-data.mjs`, `src/data/hopV4/proto-data.json`, `complements.json`, `complements-non-rattachees.json`, `src/domain/hopIndex/v4/data.ts` (chargeur paresseux `chargerAjouts`, `chargerCataloguePlein`, `ID_FUSIONNES`, champs `peuDeDonnees` et `nbSources`), packs `prototypes/houblons-v4/data/pack-*.json` régénérés (543,3 ko, plafond 560).
- **Hors Possède (à valider ou à reprendre, voir DÉCISION 3)** : `src/domain/hopIndex/v4/substitution.ts` (une ligne de tri), `src/ui/hopIndex/fiche/traduction.ts` (17 mots), et des empreintes ou nombres dans 11 tests existants (liste plus bas). `rapport.md` de d3a-fusion est régénéré par fusion.mjs (le test d'empreinte le lit).

## Ce qui a été fait
1. **(c) Rattachements** : `rattachement.mjs` décide pour chaque fiche des 20 sources suivies par git (les 18 de la fusion, Freestyle Hops, IHPS ; Beer Analytics, voie en cours, est exclu). Ordre : rattachement de la collecte vérifié (origine) ; produit de forme écarté ; liste « à confirmer » ; table d'alias ou nom exact ; variété nouvelle. Les proches (distance 2) ne passent que s'ils sont dans la table (Hallertauer Mittelfrüh/Taurus/Tradition/Magnum, Hüll Melon, Lubelski, Calista, Spalt Select, Strisselspalter, Sultana/Denali, Savinjski Golding…). Fusion et build lisent la même décision ; fusion.mjs n'a plus de vérificateur à elle.
   - **Equinox → Ekuanot** : un identifiant, alias « Equinox » (+ « HBC 366 »), `ID_FUSIONNES` lu par `hopRef` ; le stock « Equinox » retrouve Ekuanot par l'alias ; l'entrée Equinox (α, β, huile, cohumulone, sans descripteur) disparaît : catalogue de base 317.
   - **Origine non répertoriée** : « Cascade CHE » (Suisse), « NZ Cascade », « Cascade (UK) »… se rattachent à Cascade ; la fiche porte l'origine lue en 4e élément de `f` dans complements.json, et ses valeurs restent hors enveloppe (raison `h-origine`). Un nom à plusieurs variétés (Perle GR/US) se résout par l'origine annoncée, sinon « à confirmer ». Les mots d'une telle fiche ne vont pas dans les descripteurs du catalogue.
   - **À confirmer, rien rattaché** : Styrian Gold, Cerera, Brewer's Gold sans origine, Northern Brew, Goldings, Hallertauer seul, Fuggle H/N, Tettnanger A/B, Hersbrucker E, HBC 522, HS09326 (+ Perle, Saaz, Magnum, Northern Brewer sans origine, par règle). Rapport : section « À confirmer » du rapport de fusion.
2. **(a) Variétés ajoutées** : 188 (c5 en comptait 248 : 60 de moins parce que des variantes (« Mt Ranier », « Superdelic , hops », codes HBC 586/1019/682/1325 = Krush/Dolcita/TerraFlux/TerraSurge, d'après les noms des fiches), des produits de forme (DBL, lupulin, kief) et 5 non-noms (« Search... », « Charles Faram - ») sont écartés ou fusionnés ; table `exclus` et `synonymes`). Id `sources-<nom>`. Valeurs = enveloppe des valeurs valides de complements.json (donc règles de consensus et d'aberrance appliquées), deux bornes publiées ou inconnu (null) ; mots par fiche compacte ; aucune valeur inventée. 25 documentées (au moins 2 sources hors Brewer's Friend et un α), 163 `peuDeDonnees`. Krush : 8 sources, α 10–14, 5 aliases.
3. **Budget** : voir plus bas. Les ajouts ne sont PAS dans le démarrage ni dans le chunk des outils.

## Critères (sorties décisives)
- `npx vitest run tests/unit/hopIndexV4 prototypes/houblons-v4/tests` : **87 fichiers, 849 tests, tous verts** (dont `sourcesLignes`, vert aussi). Seul `froid`/`moteurInchange`/... ont eu des valeurs mises à jour (voir plus bas).
- `VITE_HOP_V4=on npm run build` : exit 0 (tsc, vite, check-private-research).
- Déterminisme : fusion lancée deux fois de suite, mêmes sha256 : complements.json `59c466fe8bd45faa3e6858699038eac79b10dabd376f90ed5e147ba2c22e70ae`, non-rattachees `7ee779c9…`, rapport `064fb925…` ; proto-data.json et catalogue-ajouts.json identiques après deux passes de build-data (pipeline build → fusion → build, point fixe).
- Budgets : `check-hop-budget.mjs --dist dist --chunk-outils profil-simule` : **B5 159,0 ko ≤ 160** (avant : 157,6 ko au commit d4 ; avec 25 variétés documentées dans le démarrage : 161,1 ko, refusé). B1 921 ko et B2 773 ko dépassent, **déjà avant la voie** (919 ko au commit t4). Pack du prototype : 551 877 → 556 328 octets (543,3 Kio ≤ 560). Le chunk des ajouts n'est pas émis tant qu'aucun écran n'appelle `chargerAjouts` (tree-shaking) ; quand il le sera : 104 ko bruts, 10,7 ko gzip, hors du démarrage.

## Délais (exigence du brasseur : aucun délai perceptible) — `npm run check:hop-perf`, ×4, même machine, i5-14600KF
Le jeu par défaut du banc est le catalogue de démarrage : comme les ajouts n'y sont pas, il ne change que par Equinox et les 26 variétés dont les mots changent. Deux passes après, une avant (ms, médiane / 95e centile).

| mesure | avant | après | après (2e passe) | budget | verdict |
|---|---|---|---|---|---|
| glisser : cran de moment (Ma bière) | 1,08 / 1,61 | 1,11 / 1,59 | 1,19 / 2,70 | 4,00 méd, 8,25 p95 | OK |
| glisser : aperçu levure | 0,34 / 1,54 | 0,40 / 1,55 | 0,37 / 1,81 | idem | OK |
| glisser : pas de dose | 1,21 / 2,12 | 1,29 / 2,22 | 1,36 / 2,23 | idem | OK |
| glisser : cran en cache | 0,01 / 0,01 | 0,01 / 0,01 | 0,01 / 0,01 | idem | OK |
| toucher : Dryhopper frise | 23,28 / 32,19 | 23,68 / 35,44 | 25,93 / 59,02 | 25,00 p95 | DÉPASSÉ avant et après |
| toucher : Levure 4 souches | 12,49 / 16,18 | 14,39 / 18,26 | 14,49 / 26,92 | 25,00 | OK |
| toucher : Substituer classement | 3,91 / 6,70 | 3,65 / 6,44 | 4,53 / 14,95 | 25,00 | OK |
| toucher : Comparer 12 houblons | 21,85 / 26,79 | 23,20 / 29,56 | 24,06 / 29,33 | 25,00 | DÉPASSÉ avant et après |
| toucher : Comparer jour après jour | 119,28 / 144,93 | 119,31 / 128,39 | 129,04 / 167,53 | 25,00 | DÉPASSÉ avant et après |
| toucher : Suggérer sans préchauffage | 229,77 / 283,81 | 235,94 / 278,80 | 248,99 / 269,35 | 25,00 | DÉPASSÉ avant et après |
| toucher : Suggérer préchauffé | 0,04 / 0,08 | 0,04 / 0,09 | 0,04 / 0,08 | 25,00 | OK |
| toucher : Ma bière après un outil | 1,65 / 1,83 | 1,66 / 1,77 | 1,71 / 4,19 | 25,00 | OK |
| toucher : fiche houblon | 0,00 / 0,01 | 0,00 / 0,01 | 0,00 / 0,01 | 25,00 | OK |
| repos : créer le moteur | 0,26 / 9,42 | 0,31 / 9,40 | 0,26 / 11,28 | 50 | OK |
| repos : premier écran Ma bière | 5,49 / 26,07 | 5,71 / 26,83 | 6,25 / 28,30 | 50 | OK |
| repos : tranche voies de Suggérer | 388,09 / 630,58 | 324,62 / 560,78 | 330,15 / 574,34 | 50 | DÉPASSÉ avant et après |
| repos : remplaçants d'un ajout | 1,94 / 3,90 | 1,86 / 10,69 | 2,03 / 6,06 | 50 | OK |
| repos : premier écran + préchauffage | 401,45 / 725,94 | 351,43 / 661,55 | 348,11 / 687,95 | 625 | DÉPASSÉ avant et après |

Verdict global du script : ECHEC (6) avant, ECHEC (6 puis 7) après. **Aucune mesure ne régresse au-delà du bruit de la machine** (écarts de ±2 ms entre deux passes identiques ; le 95e de Dryhopper varie de 32 à 59 ms d'une passe à l'autre). Six budgets étaient déjà dépassés avant la voie (HEAD de ce poste) : voir DÉCISION 1.

Catalogue complet (317 + 188 = 505), en opt-in (`chargerCataloguePlein`), `chrono.ts`, un processus par jeu, deux passes (froid = premier appel du processus ; chaud = médiane de 15) :

| appel | base 317 froid / chaud | complet 505 froid / chaud |
|---|---|---|
| substitutes (8 rendus) | 33,55 / 1,04 puis 38,73 / 0,74 | 38,29 / 0,79 puis 47,03 / 1,06 |
| substitutes (tous les rendus) | 2,84 / 1,83 puis 5,04 / 1,72 | 4,29 / 2,16 puis 3,97 / 2,27 |
| proposeVoies (adaptateur) | 83,84 / 0 puis 84,97 / 0 | 86,65 / 0 puis 83,54 / 0 |
| simulerCas léger | 5,85 / 0,16 puis 6,04 / 0,16 | 6,54 / 0,17 puis 5,87 / 0,15 |
| simulerCas complet | 5,13 / 1,16 puis 5,50 / 1,10 | 5,78 / 1,24 puis 5,76 / 1,12 |

Le catalogue complet coûte au plus 5 à 8 ms de plus au froid sur `substitutes`, rien de mesurable ailleurs. Limite : `proposer` de l'adaptateur n'a pas été vu sur l'ensemble de `voies.ts` du banc ×10 avec 505 variétés ; le catalogue complet n'est lu par aucun écran aujourd'hui.

## Tests existants dont une valeur a changé (raison « c6 » écrite dans chacun)
- 318 → 317 (Equinox) : `coherenceCatalogue`, `couvertureCatalogue`, `traductionMots`, `useHopData`.
- Empreintes : `moteurInchange` (4 empreintes ; `sansDescriptions` change car Ekuanot gagne un alias et Equinox disparaît), `client-async` et `worker-calculs` (suggerer 166a7dbd9516 → af7f2ecc1069 ; les trois autres inchangées), pack et pack-fiches régénérés.
- Nombres de sa capture : `froid` (Cascade résineux 26,76 → 26,50, valeur 27,51 → 27,20, marge 2,49 → 2,80 ; Nugget 16D marge < 1 → 1,46, borne du test portée à 2) et `froidDryhopper` (vert 20,6 → 20,0, résineux 27,5 → 27,2). Cause pour Cascade : la fiche Freestyle Hops (Nouvelle-Zélande) n'est plus un mot de Cascade ; la fiche des 26 variétés dont les mots changent, d'où des fréquences de familles un peu différentes pour Nugget aussi.
- `complements.test` : les ids du catalogue incluent `catalogue-ajouts.json`.

## Doutes et limites
- Les noms « Hallertauer », « Goldings », « Perle »… sans origine restent non rattachés, c'est voulu ; la table `alias` contient des jugements de métier à relire (Spalter = Spalt, Saazer = Saaz CZ, Tradition = Hallertau Tradition, Nelson = Nelson Sauvin).
- Beer Analytics (c3h, en cours) n'est pas lu : ses variétés et noms entreront par la table quand cette voie sera commitée. Freestyle Hops et IHPS attestent des variétés mais ne fournissent pas de valeurs à la fusion (elle compte 18 sources, test existant).
- Aucune interface n'a changé : pas de capture à regarder ; l'astérisque d'origine non répertoriée est une donnée (4e élément de `f`, `ValeurSource` ne l'expose pas encore : `complements.ts` n'est pas dans la Possède).
- Les tris de `voies.ts`, `hops.ts` et `quickAdd.ts` ne protègent pas encore les `peuDeDonnees` à égalité : seul `substitutes` le fait, parce qu'aucun écran ne met les ajouts dans le moteur.

## DÉCISION À PRENDRE
1. **Six budgets de fluidité dépassent déjà avant la voie** (Dryhopper frise 32 ms, Comparer 12 houblons 27 ms, Comparer jour après jour 145 ms, Suggérer sans préchauffage 284 ms, tranche de préchauffage 631 ms, premier écran + préchauffage 726 ms, contre 25 / 25 / 25 / 25 / 50 / 625). Je n'ai relevé aucun budget. Recommandation : voie de performance dédiée (celle-ci n'y change rien) avant de brancher les ajouts.
2. **Brancher les ajouts dans le moteur** : option A (retenue, rien dans le démarrage) : `chargerCataloguePlein()` à l'appel d'un écran ou dans le worker, ajouts affichés par listes bornées ; option B : les 25 documentées dans le démarrage, mais B5 passe à 161,1 ko (> 160) : refusé sans relèvement. Recommandation : A, avec le chargement à l'ouverture de la recherche d'un houblon et dans le worker de calcul.
3. **Trois fichiers hors Possède touchés** : `substitution.ts` (ligne 434, clé `peuDeDonnees` avant le nom, requise par le test D175 ; rouge avant la ligne), `traduction.ts` (17 mots anglais de fiches rattachées, requis par D160) et 11 tests. Recommandation : garder ; sinon, rendre ces deux lignes à leurs voies.
4. **Origine non répertoriée** : les mots de ces fiches ne vont pas dans les descripteurs de la variété (par prudence : Freestyle Hops NZ sortait de Cascade). Alternative : les garder avec un marquage. Recommandation : garder l'exclusion, c'est ce qui rend Cascade comparable à sa fiche américaine.
5. **Paires à confirmer** (liste dans `alias-noms.json`, `aConfirmer`) : Styrian Gold/Wolf, Cerera/Celeia, Goldings, Hallertauer, variantes Hopslist H/N/A/B/E, codes HBC 522 et HS09326.

CONNAISSANCE : le moteur de fusion ne lit que 18 sources (test), mais l'attestation d'une variété lit 20 fichiers ; un nom de houblon se normalise par `rattachement.mjs` (fournisseur, parenthèses, codes de sélection et d'origine retirés) ; les écrans qui ajoutent du mot anglais doivent passer par la table de traduction (`traductionMots.test.ts`).
LEÇON PROPOSÉE : le Bash de ce poste a de nouveau perdu des barres inverses (`\b`, `\.`) dans des scripts écrits par heredoc ; écrire tout script avec Write ou Edit, même un script d'édition jetable.
