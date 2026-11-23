---
name: 2026-10-25-integration-architecture
description: Conseil complet du 24.10 nuit sur l'architecture d'intégration de l'outil houblons dans l'app — pile de routes dans App (wizard monté), une porte d'écriture sur writeRecipeDraft, calcul (b) en deux temps derrière une interface asynchrone, catalogue JSON à la demande, V5.5 sous drapeau ; T1 puis T14 d'abord
type: decisions
maj: 2026-10-25
sources: work/missions/2026-10-25-integration-houblons/conseil-architecture/question.md ; work/missions/2026-10-25-integration-houblons/ETAT-DES-LIEUX.md ; work/missions/2026-10-23-theme-performance/voies/t2-performance/RESULTAT.md ; prototypes/houblons-v4/parcours/ARCHITECTURE.md
---
## Question cadrée

Dossier entier : `work/missions/2026-10-25-integration-houblons/conseil-architecture/question.md` ; état des lieux mesuré et relu : `work/missions/2026-10-25-integration-houblons/ETAT-DES-LIEUX.md`.
Le brasseur ouvre l'intégration (24.10, nuit) : « La fluidité, l'optimisation de code est très importante vu qu'il y aura beaucoup de données !! ».
Cinq décisions : (1) hôte et persistance (routes, couches sur le wizard monté, brouillon Dexie ; et RecipePage) ; (2) calcul
(tout en worker, lourds en worker, fil principal découpé) ; (3) données et hors ligne (JSON à la demande, Dexie, service
worker ; écoutes Firestore par écran) ; (4) coexistence V5.5 (drapeau, bouton, remplacement) ; (5) ordre de T1 à T18 et premier geste.

## Type de décision

Déléguée au pilote pour l'architecture technique (réversible). Reviennent à l'utilisateur : retrait de V5.5 et toute
suppression, service worker en production, fusion des catalogues, catalogue réel (R9). Reviennent au brasseur : les états
d'attente absents de ses maquettes, le budget t2 (« premier retour » ou « écran complet »), ses choix encore ouverts.

## Regards

### Brasseur

**Regard Brasseur** — téléphone en main, étape « Houblons 3/7 » du wizard, Hallertau déjà dans la recette.

1. **Hôte.** Il brasse dans le wizard, pas dans `RecipePage` (sa capture 01, ETAT-DES-LIEUX R6). Sa plainte D139, « un choix sur un endroit, semble pas toujours être reporté partout », c'est un état non partagé. Donc (c) : un seul brouillon écrit à chaque geste, comme `writeRecipeDraft` fait déjà, lu par tous les outils ; (a) seul retombe dans R10 (rechargement = perte). Perte de brouillon = « rien n'a de valeur ».

2. **Calcul.** « Le slider est clancky pas fluide du tout… lié au recalcule de l'ibu pas forcément utile à la volée » (D46) ; « un peu de délai pour "sortir" du mode rail » (D134, 98 à 143 ms). Option (b) : le doigt reste sur le fil principal (`lireBiere` 0,27 ms chaud), `suggerer` par cran (530 ms à ×10 sous ×4) et `substitutes` (1,5 s froid ×10) partent en worker. Tout en worker (a) ajoute un aller-retour sous le doigt : non. `substitutes` sur 8 rendus : il ne lit que 8 lignes de toute façon.

3. **Données.** « Beaucoup d'info sont chargés pour rien » (#121). Mais R9 : 12 variétés en production, Nelson Sauvin « non proposable » devant lui = « ??? ». Et la cave n'a pas de réseau : un chunk jamais chargé, c'est un écran vide le jour du brassage (R4, non testé). (a) avec préchargement, prouvé réseau coupé, avant tout écran.

4. **V5.5.** « on doit pas non plus perde le modèle de calcul de la 5.5 » (18.10). (a) drapeau ; le retrait lui revient. (b) deux outils côte à côte : « Déjà dit mais attention au piège !! ».

5. **Ordre.** T1 d'abord (R1 : sa vraie recette plante Ma bière). Puis hôte, Ma bière seule, contrôles `--url` (T14) **avant** le premier écran montré : « commen ça a pu être oublié ? » (L05). Jeu ×10 bloquant avant de lui montrer : il a déjà dit « ça lag » sur la maquette ; un refus qui revient est un rejet (PORTRAIT § 2).

Phrase prédite devant l'app intégrée sans cela : « C'est la même chose que la maquette mais ça lag encore, et mon houblon ajouté dans Suggérer a disparu ??? »

Position : pour — 1(c), 2(b), 3(a) prouvé hors ligne, 4(a) retrait sur son accord, 5 : T1 → T2/T3 → T14 → T12 montré avec jeu ×10 vert.

### Contradicteur

**1. Hôte.** Contre (c). Le brouillon vit déjà dans `localStorage` (`src/services/recipeDraft.ts:547`). Un second brouillon dans Dexie ferait deux sources de vérité, ce qui reproduit sa plainte D139 : « un choix sur un endroit, semble pas toujours être reporté partout ». Il faut (b), des couches au-dessus du wizard monté, et une seule porte d'écriture qui reprend la discipline de `applyHopV55Change` (`BrewWizard.tsx:1410-1436`) : contrôles `draftReadOnly` et `draftId`, puis « Storage is the commit point ». Avec (a), `App.tsx` démonte le wizard (R6) et la clé de brouillon devient un pari.

**2. Calcul.** C'est la donnée qui trompe. Le décalage qu'il ressent se mesure à ×1, et il ne vient pas d'un calcul trop gros (t2, `RESULTAT.md`) :
- `hopDescriptorEvidence` pèse 417 ms sur 880, avec un cache indexé par l'identité du tableau ;
- `toLocaleString` représente 21 % d'un glisser ;
- le p95 de 121 ms de Dryhopper vient « du rendu, pas du moteur ».

Un worker n'y change rien. De plus, l'écart de ×9 avec `cout-calcul-moteur.md` reste inexpliqué. Il faut donc d'abord T5 et ces caches, puis remesurer, et seulement ensuite (b).

**3. Données.** Le hors ligne des chunks n'existe déjà pas pour l'app : aucun service worker de code, et `BrewWizardEntry` est déjà chargé à la demande. Promettre (a) « hors ligne » est faux sans preuve réseau coupé. Les « écoutes par écran » (T10) relanceraient `configurerDonnees` à chaque ouverture, donc des calculs à froid de 90 à 380 ms (R5d). T8 doit passer avant T10. Fusionner les catalogues touche à `hopIndex`, qui est fini et branché : c'est une suppression, donc une décision de l'utilisateur. R9 (12 variétés) aussi.

**4. V5.5.** (a), mais avec un trou : deux éditeurs qui écrivent les mêmes `hops`. Si v4 remplace un houblon, les `hopV55Applications` pointent vers une ligne disparue. Il faut un test d'aller-retour qui alterne v4 et V5.5. Le retrait final revient à l'utilisateur.

**5. Ordre.** Faire T1, puis T14 avant tout portage (R8, règle n° 1), avec un témoin négatif. T17 en 17e position contredit L13 : on n'écrit pas le contrôle de fluidité après les écrans.

Position : autre voie : (b) pour l'hôte, avec une seule porte d'écriture ; T1 puis T14 et T5 avec ses caches avant tout worker ; T8 avant T10.

### Audacieux

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

### Premiers principes

**Vous posez en partie la mauvaise question.** Le lag ne vient pas de la taille des données. Il vient de travail inutile sur le fil principal.

1. **Hôte : (b), des couches par-dessus le wizard resté monté.** Il faut une seule source de vérité : le brouillon existant (`writeRecipeDraft`). Chaque niveau d'outil ajoute une entrée d'historique, pour que le bouton retour marche. Une copie Dexie (c) créerait le défaut D139 : « un choix sur un endroit, semble pas toujours être reporté partout ». Des routes (a) démontent le wizard, parce que `App.tsx` rend une seule vue à la fois (R6), et touchent aux retours existants (R3). `RecipePage` reçoit le même hôte de couches, alimenté par la recette.

2. **Calcul : une autre voie.** Il faut d'abord retirer le coût mesuré, avant tout worker.
   - `hopDescriptorEvidence` pèse 417 ms sur 880 au toucher, car son cache est indexé par l'identité du tableau et non par son contenu (t2 `RESULTAT.md`, point 2).
   - `toLocaleString` pèse 21 % du glisser.
   - Le glisser rate son budget (p95 121 ms) à cause du rendu : le précalcul des crans a été « écarté par la mesure ».

   Un worker ne corrige rien de cela. Il ne sert qu'aux balayages du catalogue (478 à 1 188 ms) et au préchauffage. La fabrique sans singleton, les caches bornés et `substitutes` limité aux 8 rendus restent à faire.

3. **Données : ce qui croît, ce sont les recettes, les brassins et les dégustations, donc Firestore.** Le catalogue ne croît pas : 318 variétés, et le ×10 est un « cadre de mesure, pas une prévision » (ETAT, ligne 124). Le chunk Beer Maverick pèse 44,74 ko gzip, donc Dexie (b) n'apporte rien. Je retiens (a), avec préchargement pendant les temps morts. Le vrai levier, ce sont les écoutes par écran, plus la règle « un snapshot inchangé ne relance aucun calcul » (R5d). Le service worker (c) touche au déploiement : c'est à l'utilisateur de décider.

4. **Coexistence : (a), un drapeau.** Retirer V5.5 est une suppression : cela attend l'accord de l'utilisateur. `hopV55Applications` et `hopV55ColdEvidenceAssociations` doivent traverser la conversion sans être modifiés, avec un test aller-retour.

5. **Ordre et premier geste : T1, puis un contrôle bloquant dans l'app, à ×4.**
   - Le contrôle mesure le toucher Ma bière → Suggérer et le glisser.
   - Il tourne sur un jeu réaliste : catalogue de 318, stock ×5, recettes et dégustations ×10, snapshots répétés.
   - Pour T14, on change le résolveur commun d'`etat.html` plutôt que les 71 scripts, en commençant par `controle-choix.mjs`.
   - La question ouverte de t2 (budget « premier retour » ou « écran complet ») modifie ses maquettes : elle revient au brasseur.

Position : autre voie. Hôte en couches sur le brouillon unique ; supprimer le travail inutile avant le worker ; écoutes Firestore par écran ; mesurer d'abord dans l'app.

### Bâtisseur

**1. Hôte : (b), mais posé par la pile de l'app.** Avec (a), le wizard est démonté. `App.tsx:971` ne rend `BrewWizard` que si `view === 'wizard'`. Au remontage d'une recette déjà enregistrée, `BrewWizard.tsx:466` peut afficher `DraftFreshnessChoice`, qui demande au brasseur de choisir entre « Reprendre le brouillon » et la version enregistrée. Ce serait une rupture à chaque outil fermé. (b) seul ne marche pas non plus : `useFullScreenRoute.ts:64-66` renvoie à `tabs` à chaque `popstate`, donc une couche qui pousse l'historique fermerait le wizard. Il faut une pile de routes dans `App`, où le wizard reste monté sous les outils. L'outil écrit par un `applyHopV4Change` calqué sur `applyHopV55Change` (l. 1410-1437), qui fait de `writeRecipeDraft` son point de validation. (c) est écarté : un second brouillon Dexie ferait deux sources de vérité, ce dont il se plaint déjà (« un choix sur un endroit, semble pas toujours être reporté partout »).

**2. Calcul : T5 d'abord, le worker ensuite si la mesure l'exige.** Le précédent `hopSolver.worker.ts:9` crée un worker par recherche et ne convient pas tel quel : chaque recherche relirait 406 ko de `proto-data`. Il faudra un worker persistant, alimenté une fois, ce qui suppose la fabrique sans singleton (B2). Sans cette fabrique, pas de worker. Je n'écarte pas le worker (L20) : il se décide sur `suggerer` à ×10 ×4 rejoué après T5.

**3. Données : (a).** Le catalogue fait 45 ko gzip (ETAT-DES-LIEUX), donc Dexie n'apporte rien et ne met pas les chunks de code hors ligne. Un service worker (c) toucherait le déploiement et cohabiterait avec `brew-alerts-sw.js` : c'est à l'utilisateur de décider. Les écoutes par écran (T10) viennent en dernier, le hors ligne en dépend.

**4. Coexistence : (a), un drapeau.** Les 178 à 192 tests qui citent `hopV55` restent verts. Le retrait se fera sur son accord.

**5. Ordre.** T1, puis T4+T5 avec le banc ×10 versé dans `scripts/`, bloquant en Node. Ensuite la pile (T3), T6, un `--url` minimal pour `controle-choix.mjs` avant T12, T12, puis T7 si la mesure l'exige. **Premier geste lundi** : `houblon()` doit rendre « arôme non simulé » pour un houblon `inconnu:<nom>` au lieu de lever une exception (`moteur/index.ts:214`), et `prototypes/houblons-v4/tests` doit entrer dans `vitest.config.ts`.

Position : autre voie : hôte (b) porté par une pile de routes dans `App` où le wizard reste monté ; calcul : T5 d'abord, worker persistant décidé sur mesure ; données (a) ; drapeau (a).

### Regard neuf

**Ce que je comprends.** Une maquette d'outil houblons (moteur de calcul + 8 écrans) doit remplacer l'ancien atelier V5.5 dans l'étape 3 d'un assistant de brassage. Le point dur est la lourdeur : 918 ko au démarrage contre 350 prévus, et un toucher qui met 782 ms contre 100 permis. Le brasseur exige que ce soit fluide avec « beaucoup de données ».

**Ce qui me perd.**
- « Beaucoup de données » désigne-t-il le catalogue (×10) ou les recettes et le stock de l'utilisateur ? Le texte dit lui-même qu'« un geste sur une recette ne dépend pas de la taille du catalogue ». Or la production ne compte que 12 variétés. Le ×10 est donc peut-être un problème imaginaire, alors que le poids et les 27 écoutes Firestore sont réels et mesurés.
- Le chiffre 782 ms n'est pas décomposé : calcul, chargement du code ou rendu ?
- Les options de la décision 1 se recoupent. (c) ressemble à un état déjà présent, puisque le brouillon est déjà écrit en local.

**Mots que je ne connais pas.** « Rail », « cran de dose », « léger/complet », « fiche », « Dryhopper », « hopV55… », « porte B », « le recouvrement stock × catalogue ».

**Ce que je ferais en premier.**
1. Mesurer d'abord où partent les 782 ms et les 918 ko. Je ne choisirais aucune architecture avant. Je soupçonne le chargement du code (772 ko) et les 27 écoutes plus que le moteur.
2. Poser un contrôle bloquant de poids et de latence sur l'app réelle (R8). Ce contrôle manque aujourd'hui, c'est le vrai premier geste.
3. Corriger R1 (le plantage sur un houblon inconnu) et R2 (tests hors de `npm test`). Ces deux points sont peu coûteux.
4. Découper le code par chargement à la demande, et ouvrir les écoutes par écran. Ce sont les gains les plus sûrs.
5. Choisir ensuite : moteur en worker seulement pour `substitutes` et `suggerer`, la 2(b). Garder un catalogue unique découpé, la 3(a). Mettre un drapeau V5.5, la 4(a), parce qu'il est réversible. Le portage ne supprime rien sans accord.

Le choix de variante reste au brasseur, et la suppression de V5.5 aussi.

Position : autre voie : mesurer et poser un contrôle de poids et de latence sur l'app d'abord, puis 1(a), 2(b), 3(a) et 4(a)

## Revues

### Revue 1

**1. La plus solide : A.** C'est la seule qui a vérifié dans le code les deux pièges de l'hôte.
- Avec (a) ou (c) et des routes, le wizard est démonté. Au remontage d'une recette enregistrée, il affiche `DraftFreshnessChoice` (`BrewWizard.tsx:467`). Je l'ai vérifié dans le code.
- Avec (b) qui pousse l'historique, `onPop` renvoie toujours à `tabs` (`useFullScreenRoute.ts:64-66`, R3).

A en tire la seule solution qui tient : une pile de routes où le wizard reste monté, et une seule porte d'écriture. A fait aussi dépendre le worker d'une fabrique persistante.

**2. Le plus gros angle mort : D, et E en partie.** D veut un brouillon Dexie lu en direct par `liveQuery`, avec une route par outil. Le wizard se démonte quand même, et le choix entre brouillon et version enregistrée revient à chaque outil fermé. Pendant la migration, il y aurait aussi deux sources de vérité, donc encore D139. E choisit (c) avec le même trou. F, et C en partie, ajoutent une entrée d'historique par niveau sans voir R3 : le retour fermerait le wizard.

**3. Ce que toutes ont manqué : `RecipePage`, pourtant cité dans la question.** Sans wizard, il n'y a pas de brouillon. Personne ne dit où un outil écrit, ni si c'est hors ligne, ni comment sans écraser `hopV55*` (R7 : `stockItemRef` et `hopLotId` perdus). F dit seulement « alimenté par la recette ». Autre oubli : les états d'attente qu'ajoutent le worker et les chunks n'existent pas dans ses maquettes. Leur apparence est une décision du brasseur (règle n° 1).

### Revue 2

**1. La plus solide : F**, suivie de près par A. F ancre le lag sur les mesures t2 (`toLocaleString` 21 % d'un glisser, cache par identité de tableau), sépare ce qui croît (Firestore : recettes, brassins, dégustations) du catalogue, cite `ETAT-DES-LIEUX.md:124` (« cadre de mesure, pas une prévision »), et propose de changer le résolveur commun d'`etat.html` plutôt que 71 scripts. A apporte la pièce mécanique que F suppose : `useFullScreenRoute.ts:64-66` renvoie à `tabs` à chaque `popstate` (vérifié), donc « une entrée d'historique par niveau » (F) ferme le wizard sans pile de routes dans `App`. F + pile de A = la voie.

**2. Plus gros angle mort : D.** Ses « 8 meilleurs remplaçants précalculés au build » oublient que `substitutes` croise le stock de l'utilisateur (O(n²) stock × catalogue, `question.md`) : le stock n'existe pas au build. Et migrer `writeRecipeDraft` vers Dexie touche des brouillons réels persistés : décision utilisateur, non signalée. E nomme (c) mais décrit en fait `writeRecipeDraft` existant.

**3. Toutes ont manqué :** `RecipePage` (recette enregistrée, sans brouillon) n'a d'hôte ni de porte d'écriture chez personne ; et le mode `--url` lira un DOM porté avec les composants de l'app (L26 : le Sheet apporte ses boutons), donc les 71 scripts échoueront même avec un résolveur changé. Enfin, aucune ne fixe le premier écran montré au brasseur (L11).

### Revue 3

**1. La plus solide : A.** A est la seule à lire le code qui décide de l'hôte (`App.tsx:971`, `useFullScreenRoute.ts:64-66`, `DraftFreshnessChoice`). Elle tire de cette lecture un mécanisme précis : une pile de routes dans `App`, avec le wizard resté monté, et un point d'écriture unique calqué sur `applyHopV55Change`. Elle écarte (c) parce que deux sources de vérité reproduiraient D139. Sa conditionnelle sur le worker est aussi la plus juste : un worker persistant suppose d'abord la fabrique sans singleton (B2).

**2. Plus gros angle mort : D.** D propose de migrer le brouillon vers Dexie avec `liveQuery`. Pourtant `writeRecipeDraft` fait déjà persister le brouillon (`recipeDraft.ts`, localStorage), et la question dit qu'il est relu à l'ouverture. Le brouillon serait donc doublé ou déplacé sans cause démontrée, alors que D139 vient d'un état non partagé. E fait une confusion voisine : elle choisit « (c) » en décrivant `writeRecipeDraft`, donc l'option (b) ou (a). D met aussi en tête un worker et des index précalculés au build avant toute mesure. C et F montrent que le coût mesuré est ailleurs : `hopDescriptorEvidence` pèse 417 ms sur 880, et le p95 de 121 ms de Dryhopper vient du rendu. D ajoute un déploiement de service worker, ce qui revient à l'utilisateur.

**3. Manqué par toutes.** Le précédent `hopV55` existe déjà dans `useFullScreenRoute.ts` : `returnFromHopV55` et `onPop` ramènent à la route d'origine, pas à `tabs`. Le mécanisme est limité à un niveau, donc il faut une pile à quatre niveaux, mais A a tort de dire que `popstate` renvoie toujours à `tabs`. Aucune ne dit non plus que 5 sur 6 réponses dérivent vers (a) ou (b) sans avoir testé « wizard → outil → retour » dans Chrome (R6).

## Correspondance

- Réponse A = Bâtisseur
- Réponse B = Regard neuf
- Réponse C = Contradicteur
- Réponse D = Audacieux
- Réponse E = Brasseur
- Réponse F = Premiers principes

## Verdict

### Où le conseil s'accorde
- **T1 d'abord** (6 regards sur 6). R1 fait planter Ma bière dès qu'une recette réelle contient un houblon inconnu du moteur. R2 cache cet échec, puisque les tests du moteur sont hors de `npm test`.
- **Pas de second brouillon.** Un brouillon Dexie reproduirait sa plainte D139. Le Brasseur coche « (c) » mais décrit en fait `writeRecipeDraft`, déjà en place (revues 2 et 3).
- **`lireBiere` reste sur le fil principal** (0,27 ms à chaud).
- **Catalogue en JSON chargé à la demande (a)**, pas dans Dexie : son chunk ne pèse que 44,74 ko gzip.
- **V5.5 derrière un drapeau (a).** `hopV55*` doit sortir intact d'un aller-retour testé. Le retrait se fait sur accord.
- **Un contrôle qui lit l'app** (mode `--url`, R8) avant de montrer le premier écran porté.

### Où il se divise
- **Hôte.** Contre des routes (Regard neuf, Audacieux), les couches sur le wizard monté (Bâtisseur, Contradicteur, Premiers principes) gagnent. Ce que j'ai vérifié dans le code :
  - `App.tsx:971` ne rend le wizard que si `view === 'wizard'`.
  - Au remontage, `BrewWizard.tsx:466` peut afficher `DraftFreshnessChoice`.
  - `useFullScreenRoute.ts:66` renvoie à `tabs` à chaque retour, sauf depuis `hopV55`, qui revient à la route mémorisée.

  La revue 2 a donc raison contre le Bâtisseur sur le mot « toujours ». Sur le fond, il a raison : ce mécanisme tient sur un seul niveau, il en faut quatre.
- **Calcul.** L'Audacieux veut le worker tout de suite ; trois regards veulent mesurer d'abord. Le profil t2 place le lag dans `hopDescriptorEvidence` (417 ms sur 880) et dans le rendu. L'Audacieux a pourtant raison sur un point : si les huit écrans appellent le moteur en synchrone, passer au worker plus tard veut dire tout reporter une seconde fois.
- **Échelle.** Le Brasseur et l'Audacieux raisonnent sur le catalogue ×10. Premiers principes, le Regard neuf et ETAT l.124 rappellent que ce ×10 est un « cadre de mesure, pas une prévision ». Ce qui grandit vraiment, ce sont les données Firestore.

### Angles morts
- **`RecipePage`** : aucun avis ne lui donne d'hôte ni de point d'écriture.
- **États d'attente** (chunk qui charge, worker qui calcule) : ses maquettes n'en ont pas. Leur apparence revient au brasseur.
- **Contrôles `--url`** : sur l'app, ils liront le DOM des composants portés (le Sheet apporte ses boutons, L26). Changer le résolveur d'`etat.html` ne suffira pas : il faut des repères `data-*` stables, communs à la maquette et à l'app.
- **Un test existe déjà** : le parcours wizard → `hopV55` → retour, joué sur HEAD, dirait si `DraftFreshnessChoice` surgit. Personne ne l'a joué.
- **Index « au build » de l'Audacieux** : ils ignorent le stock, qui n'existe qu'à l'usage.
- **Budget t2** (« premier retour » ou « écran complet ») : la question est ouverte et revient au brasseur.

### Recommandation
1. **Hôte et persistance.**
   - Une pile de routes dans `App`, qui étend `returnFromHopV55` à quatre niveaux. Le wizard reste monté sous les outils.
   - Une seule porte d'écriture, `applyHopV4Change`, calquée sur `applyHopV55Change`. Elle valide par `writeRecipeDraft`.
   - `RecipePage` : même pile et même porte, avec la recette pour cible. Le patch ne touche que `hops`, par `saveRecipeConfirmed` (cache Firestore hors ligne), et garde `hopV55*`, `stockItemRef` et `hopLotId`. Elle est portée après le wizard.
   - Pas de Dexie pour le brouillon.
2. **Calcul : (b), en deux temps.**
   - D'abord T5 et les deux causes t2 : le cache indexé par le contenu et non par l'identité du tableau, un formateur `Intl` réutilisé.
   - Dès T6, les appels lourds (`proposer`, `suggerer`, `remplacants`, `substitutes`, préchauffage) passent par une interface asynchrone, servie d'abord sur le fil principal.
   - Un worker persistant la remplace si le contrôle ×4 échoue. `lireBiere` reste synchrone.
3. **Données et hors ligne : (a).**
   - Chunks d'outils préchargés au premier lancement en ligne, prouvés réseau coupé dans Chrome.
   - Limite écrite : un premier lancement hors ligne n'est pas couvert sans service worker.
   - Écoutes Firestore par écran (T10) après T8, avec la règle « snapshot inchangé = 0 recalcul ».
4. **V5.5 : (a), drapeau.** Un test alterne v4 et V5.5 sur la même recette, pour voir si un `hopV55Applications` survit au remplacement de sa ligne.
5. **Ordre des tâches.**
   - T1, puis T14 minimal : résolveur commun et `controle-choix.mjs --url`, avec un témoin négatif.
   - T3, avec le remontage joué dans Chrome.
   - T4, T5, T6.
   - T17 avancé : banc Node bloquant après T5, sur un jeu réaliste (318 houblons, stock ×5, recettes et dégustations ×10, snapshots répétés). Le ×10 catalogue reste une mesure non bloquante. Le banc s'étend au navigateur dès T12.
   - T9, T11, T8.
   - T12 sous drapeau, avec captures côte à côte de sa base v4.10.
   - T7 seulement si T17 échoue.
   - T10, T13, T15, T16, T18.

**Revient à l'utilisateur :** retrait de V5.5, toute suppression, fusion des catalogues avec `hopIndex`, service worker en production, correction du catalogue réel de 12 variétés (R9).
**Revient au brasseur :** états d'attente, budget t2, choix encore ouverts (Levure). Le brasseur aussi est concerné par le retrait de V5.5 : « on doit pas non plus perde le modèle de calcul de la 5.5 ».

### Premier geste
1. Écrire un test : un ajout `inconnu:hallertau` passé à `lireBiere`. Le voir rouge sur HEAD (L13).
2. Faire rendre « arôme non simulé » à `houblon()` au lieu d'une exception, dans `prototypes/houblons-v4/parcours/src/moteur/index.ts` (ligne 214).
3. Ajouter `prototypes/houblons-v4/tests` à `vitest.config.ts`.
4. Vérifier :
   - `npx vitest run` dans `prototypes/houblons-v4` : 128 verts (127 + le nouveau) ;
   - `rtk test npm test -- --maxWorkers=2 prototypes/houblons-v4/tests` ;
   - `npm run build`.
5. Dans la foulée, sans rien écrire : jouer wizard → `hopV55` → retour dans Chrome sur fixture, et ouvrir la capture.

## Suite

Appliqué par le pilote (D65, `work/refonte-frontend/decisions.md`) : l'ordre des tâches devient celui de l'épopée #159, une
issue par tâche ; le premier geste (T1) part en voie. Président : opus (décision technique). Revues : opus, fable, sonnet.
Usage : 5 h à 7 % avant l'état des lieux ; relevé après dans MISSION.md (Budget).
