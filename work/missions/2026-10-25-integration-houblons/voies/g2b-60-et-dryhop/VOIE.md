# Voie g2b-60-et-dryhop — le moteur de Suggérer : un vrai palier 60′ et un vrai dry hop

Agent : auteur (Sonnet). Cette voie touche le moteur. Elle s'arrête à quatre preuves (règle des voies, 26.10) :
- le code ;
- les tests ;
- le build ;
- la sortie JSON pour les mini maquettes.

Le reste mécanique (maquette, états, captures) sera fait par une autre voie.

## Ses mots (26.10)
- « la suggestion doit être pour du 60' comme pour du dryhopping »
- Sur la page m6 : « M1 + M2 · avec l'IA semble le mieux mais pallier 60' toujours pas très clair et pas de vrai dry hopping » (D165, D166).
- « Après le g/l semble être un peu aléatoire, non ? » (D161)

## Ce qui existe
- **Diagnostic g1** (`voies/g1-suggerer-moments/rapport.md`).
  - `proposeVoies` (`src/domain/hopIndex/v4/voies.ts`) prend ses moments en dur : 10′, whirlpool, dry hop actif et après. Aucun
    ajout à 60′, et aucune visée d'IBU.
  - La dose est l'un des trois crans du moment (`searchDosesGL`, `src/data/hopSolverBootstrap.json` : 2, 4 et 6 g/L au dry hop),
    ou le reste du stock.
- **Ce que montre m6** (`voies/m6-suggerer-moment/img/m1m2-ia.png`) : au dry hop, un seul groupe, « même effet 40 g · actif »,
  soit 2 g/L sur 20 L, avec 23 ex æquo rangés par ordre alphabétique. Aucun « après ».
- **D88 B, l'ordre à 60′** :
  - d'abord l'usage (amérisant ou double usage avant arôme), puis l'α (moins de grammes) ;
  - cohumulone et β hors du rang ;
  - la bande d'IBU du style devient un drapeau ;
  - le conflit de famille reste une exclusion.
- **D90** (b020da5e) : l'exclusion par le style demande que la moitié des fiches citent la famille.
- **g2a** : l'option `departage` (k1, k2, k3), défaut `'aucun'`. Son choix des listes est à venir.

## À faire (sous options du moteur ; le défaut d'aujourd'hui reste inchangé à l'octet, l'écran ne bouge pas)
1. **Le palier 60′** : une visée d'IBU `{ ibu: +n }` dans la direction, ou une option à part. Avec elle :
   - des ajouts `b60`, chacun à la dose **exacte** pour +n IBU (`gramsForIbu`, arrondie au gramme) ;
   - le rang de D88 B ;
   - l'IBU avant → après ;
   - un drapeau si l'IBU sort de la bande du style.

   « Remplacer à IBU égal » suit la même règle d'usage.
2. **Le vrai dry hop** : un groupe dry hop qui propose **actif et après**, chacun à une dose écrite par règle (D161).
   - Dans l'ordre, la dose est :
     1. la dose exacte qui atteint la visée (recherche continue, pas trois crans), arrondie à 0,5 g/L ;
     2. bornée par l'usage du dry hop pour ce style quand une source du dépôt le donne. Cherche dans `src/data/`, `docs/specs/houblons.md`,
        `hopSolverBootstrap.json` et les données Beer Analytics déjà présentes (`src/data/hopSources/beeranalytics*.json`, collecte en cours).
     3. Sans source pour le style : bornes génériques écrites et nommées comme telles. Dis lesquelles et pourquoi.
   - Le reste du stock n'est plus une dose candidate silencieuse. Il se dit à part : « en stock : 37 g ».
   - Le départage se lit sur l'option `departage` de g2a. Mesure avec k1 et k3, sans choisir le défaut.
3. **Les tests.** Pour chaque option :
   - le défaut est inchangé (les empreintes de `moteurInchange.test.ts` et des tests du prototype ne bougent pas) ;
   - la dose à 60′ rend +n IBU à ± 0,5 ;
   - aucun houblon d'arôme ne passe avant un amérisant à 60′ ;
   - le dry hop propose actif et après ;
   - la dose de dry hop suit la règle ;
   - le stock n'impose aucune dose.
4. **La sortie pour les mini maquettes**, par un script de `scripts/eval-hop/` (nouveau, déterministe), sur la recette 21C de m6
   (Nugget 20 g à 60′, Cascade 80 g en dry hop actif, 20 L), visée « plus d'agrumes », et +10 IBU :
   - le groupe 60′ : les 5 premiers, chacun avec α, usage, g, IBU avant → après et drapeau ;
   - le groupe dry hop actif et le groupe dry hop après : les 5 premiers de chaque, avec la dose en g et en g/L, l'effet, et la
     clé qui les a départagés, sous k1 et sous k3 ;
   - écris le tout dans `voies/g2b-60-et-dryhop/sortie-m7.json`.

## Critères
- `npx vitest run tests/unit/hopIndexV4 prototypes/houblons-v4/tests` : vert, empreintes inchangées.
- `npm run build` : vert.
- Le script rend la même sortie deux fois (même sha256).
- `RESULTAT.md` donne :
  - la règle de dose de dry hop et sa source (ou « générique » et pourquoi) ;
  - les listes, avec un jugement de réputation sur Citra, Nelson Sauvin, Galaxy, Mosaic et Motueka (L14).

## Possède
- `src/domain/hopIndex/v4/voies.ts`, `src/domain/hopIndex/v4/departage.ts`, et un nouveau module voisin si besoin.
- `tests/unit/hopIndexV4/` : nouveaux fichiers seulement.
- `scripts/eval-hop/` : nouveaux fichiers seulement.
- `work/missions/2026-10-25-integration-houblons/voies/g2b-60-et-dryhop/`.

N'écris aucun code par heredoc ni par `node -e`. Pas de `git mv`, pas de `git stash`. Écris RESULTAT.md tôt. Retour en une ligne.
