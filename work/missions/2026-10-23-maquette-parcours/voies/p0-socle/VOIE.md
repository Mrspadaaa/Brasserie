# Voie p0-socle — le socle de la maquette jouable

- Mission : 2026-10-23-maquette-parcours (lire `../../MISSION.md` d'abord : objectif, décisions, parcours)
- Agent : auteur
- Modèle : opus
- Niveau : conception (architecture : les quatre voies d'écran et la vraie implémentation la suivront)
- Plafond : 150 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : pilote (trancher selon les documents, l'option prudente et réversible, et l'écrire
  dans ARCHITECTURE.md ; aucune question bloquante)

## Objectif
Une application React/TypeScript jouable, `prototypes/houblons-v4/parcours/`, qui ressemble à l'app et en
importe composants, jetons et moteur. Elle a sept routes branchées sur un seul état de recette, avec le moteur
calculé en direct. Elle se construit en pages statiques, une par route, et un script joue le parcours de la
carte de bout en bout. Ses écrans sont des ébauches, que les voies p1 à p4 rempliront chacune dans son dossier.

## Entrées
- `work/missions/2026-10-23-maquette-parcours/MISSION.md` : le parcours, les décisions, ce que « fini » veut dire.
- `prototypes/houblons-v4/ecran/` : `vite.config.ts`, `tailwind.config.js`, `src/themes.css`, `src/styles.css`,
  `src/main.tsx`, `src/Ecran.tsx`, `src/donnees.ts`, `THEMES.md`. C'est le modèle à suivre : il importe `@app/…`
  et `@functions/…` sans rien recopier ni modifier, a deux thèmes, et sort un script IIFE ouvrable en file://.
- `prototypes/houblons-v4/ENGINE.md` et `prototypes/houblons-v4/src/engine/index.ts` : l'API du moteur.
  `profil-simule.ts` (`simulerCas`, `CasEntree`), `substitution.ts`, `recipe.ts`, `voies.ts`, `yeast.ts`,
  `fiches.ts`, `roles.ts`, `ibuMoments.ts`.
- `cerveau/metier/cout-calcul-moteur.md` : les temps mesurés ; le calcul en direct est possible.
- `work/refonte-frontend/v4/ecran-1/fils22-carte/` : `NOTE.md` (la carte), `generer.mjs` (d'où viennent les
  données du cas), les huit `*/etat.html` (ponts et contenus attendus de chaque écran).
- `work/refonte-frontend/v4/ecran-1/base/consolide/biere.html` : la recette de la stout (IBU 60, OG 1,066, EBC 70).
- L'app, pour la ressemblance et l'architecture future : `src/pages/RecipePage.tsx`, `src/pages/PageShell.tsx`,
  `src/pages/useFullScreenRoute.ts`, `src/pages/BrewWizard.tsx`, `src/components/Header.tsx`,
  `src/ui/` (les composants à réutiliser), `src/types/` (le type de recette de l'app).
- `DESIGN.md`, `docs/ui-compacte.md`, `PRODUCT.md` (parties utiles), `.claude/rules/affinee-frontend.md`.
- `work/refonte-frontend/v4/ecran-1/fils17-standard/v3/planche.html` : les pictos des familles, dont « épicé »
  (symbole `p-spice` : cannelle et clou croisés, son choix du 23.10).
- `work/refonte-frontend/v4/ecran-1/fils18-baseline/l8g/noyau.mjs` et `pictos-trait.mjs` : la baseline des
  maquettes (couleurs des familles, barres l5b, rendu). La reprendre comme vocabulaire, en composants React.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `prototypes/houblons-v4/parcours/**`. Les ébauches `src/ecrans/<écran>/` sont créées ici, puis elles
  appartiennent aux voies d'écran : n'y revenir qu'avec l'accord du pilote.
- `prototypes/houblons-v4/package.json` (scripts `parcours:dev`, `parcours:build`, et le typecheck du dossier).
- `work/missions/2026-10-23-maquette-parcours/voies/p0-socle/RESULTAT.md`
- Fichiers de travail : dans `parcours/` ou `os.tmpdir()`, jamais à la racine du dépôt (L17).

## Consignes
1. **Construction** (`parcours/vite.config.ts`, sur le modèle de `ecran/`) :
   - mêmes alias `@app` et `@functions`, un seul React (celui de la racine), Tailwind avec les jetons de l'app et les
     deux thèmes de `ecran/` (importer `ecran/tailwind.config.js` et `ecran/src/themes.css`, sans les recopier) ;
   - la sortie va dans `prototypes/houblons-v4/maquettes/parcours/` (déjà ignoré par git) :
     - `index.html`, qui démarre sur Ma bière ;
     - une page `<route>/etat.html` par route : `ma-biere`, `fiche`, `suggerer`, `comparer`, `dryhopper`, `levure`,
       `substituer`. Chaque page démarre sur sa route, dans l'état du parcours à cette étape (par exemple
       `comparer/etat.html` : Cascade, Idaho 7 et Galaxy, au moment de la carte) ;
     - un script classique IIFE et une feuille de style communs, en chemins relatifs. La page doit s'ouvrir en
       file:// et se publier en artefact (page plus deux fichiers) ;
   - `parcours/outils/construire.mjs` lance la construction, vérifie les 8 pages et imprime
     `CONSTRUIT OK (8 pages)`.
2. **Coquille** : le cadre de l'app au téléphone (en-tête de la recette, comme RecipePage et PageShell).
   - Chaque outil s'ouvre en plein écran depuis l'étape Houblons, comme une route plein écran de l'app
     (`useFullScreenRoute`). Il a un en-tête « ‹ » suivi de sa question, et sa ligne de contexte (les facteurs
     fixés).
   - La coquille porte un toucher « thème » (clair par défaut, cave) et « Recommencer ».
   - Aucun texte d'explication sur la maquette elle-même.
3. **Routes** : par le hash (`#/ma-biere`, `#/fiche/<houblon>`, `#/suggerer`, `#/comparer?h=…`,
   `#/dryhopper/<ajout>`, `#/levure/<ajout>`, `#/substituer/<houblon>`). Le retour arrière du téléphone et « ‹ »
   reviennent à l'écran d'avant.
4. **État** (`src/etat/`) : la recette du cas (type `Recipe` du moteur), un réducteur, et un contexte avec ses
   crochets.
   - Actions : ajouter un ajout, changer moment ou dose, retirer, remplacer un houblon (à IBU égal pour un
     amérisant, à masse égale pour un aromatique), choisir la levure, recommencer.
   - Un outil travaille sur un brouillon. « Ajouter à ma bière » ou « Remplacer » l'inscrit ; « ‹ » l'abandonne, et
     la recette reste intacte.
5. **Moteur en direct** (`src/moteur/`) : un adaptateur typé, une fonction par besoin d'écran, mémoïsé.
   - Fonctions : lire la bière (profil au style des 12 familles, IBU total et par ajout, bande d'IBU du style, OG,
     EBC), profil et fiche d'un houblon (α du lot et plage, rôle, familles, part sans famille), suggérer pour une
     visée, comparer N houblons à dose, moment et levure fixés (`simulerCas`), simuler un ajout à chaque moment
     (ébullition par 5′, whirlpool, dry hop actif et après, jours), effet de la levure, remplaçants et dose à IBU
     égal.
   - Chaque fonction dit son unité, et ce qui est simulé (« ~ ») ou inconnu (inconnu ≠ 0).
   - Mesurer le temps d'un geste (`performance.now`) et l'exposer à `jouer-parcours.mjs`.
6. **Données du cas** : la stout export 16D, « trop résineuse, je la veux plus florale », exactement celle de la
   carte (mêmes houblons, doses, moments, levure US-05, dégustation). Ainsi les nombres de la maquette rejoignent
   ceux des captures que le brasseur connaît. Stock et catalogue : ceux du moteur (`STOCK`, `CATALOGUE`).
7. **Composants communs** (`src/commun/`) : pictos des 12 familles (avec f1 pour l'épicé) et leurs couleurs (une
   seule table, #142), barre au style l5b, jeton de houblon (nom, α, rôle), ligne de contexte, en-tête d'outil,
   dock sous le pouce, feuille (fiche), marque du simulé « ~ », inconnu « ? » hachuré, légende « ? » fermée au
   repos. Employer les composants de `src/ui` quand ils conviennent (`SegmentedControl`, `RecipeDisclosure`…).
8. **Ébauches d'écrans** (`src/ecrans/<écran>/index.tsx`, un composant par défaut) :
   - chacune a son titre (sa question), sa ligne de contexte, et ses ponts branchés : « + floral » → Suggérer,
     « Comparer les 3 » → Comparer, « Placer Idaho 7 » → Dryhopper, « Puis la levure » → Levure, « Ajouter à ma
     bière » → Ma bière, Nugget → Substituer, « Remplacer » → Ma bière ;
   - les gestes qui changent la recette marchent déjà, par l'état : le parcours se joue en entier avant que les
     écrans soient beaux ;
   - chaque écran pose `data-ecran="<écran>"` sur sa racine et `data-role` sur ses commandes de pont.
9. **Script de parcours** (`parcours/outils/jouer-parcours.mjs`, puppeteer-core, Chrome comme
   `scripts/agents/verifier-page.mjs`, 390 × 844, échelle 2) :
   - `--routes` : chaque `<route>/etat.html` s'ouvre sans erreur de page ni défilement horizontal, avec son
     `data-ecran`. Sortie : `ROUTES OK (7/7)` ;
   - `--ponts` : depuis `index.html`, suit les ponts du parcours (MISSION, points 1 à 5). Il vérifie l'état de la
     recette après chaque geste : Idaho 7 ajouté au moment choisi avec sa levure, IBU recalculé, Nugget remplacé à
     IBU égal ; puis un « ‹ » qui abandonne un brouillon. Il imprime le temps médian d'un recalcul. Sortie :
     `PONTS OK (n gestes, recalcul médian x ms)` ;
   - `--etape=<écran>` : rejoue les gestes que la voie d'écran déclare dans `src/ecrans/<écran>/jeu.mjs` (un
     tableau de gestes et d'attentes, que tu crées en ébauche). Sortie : `ETAPE OK (<écran>)` ;
   - `--captures <dossier>` : une capture par geste, nommée par étape.
   - Exposer l'état pour les vérifications (`window.__parcours`), seulement dans la maquette.
10. **App intacte** : `parcours/outils/app-intacte.mjs` imprime `APP INTACTE OK` si `git status --porcelain -- src
    functions` est vide.
11. **Types** : `parcours/outils/verifier-types.mjs` lance `tsc --noEmit` sur le dossier (même réglage que
    `ecran/tsconfig.json`) et imprime `TYPES OK`.
12. **ARCHITECTURE.md** (`parcours/ARCHITECTURE.md`) : la carte pour la vraie implémentation, avec ces sections :
    - `## Fichiers et leur place dans l'app` : chaque fichier, sa place future dans `src/` ;
    - `## Types` : le type de l'app employé, ou celui à créer ;
    - `## Routes` : leur correspondance avec `useFullScreenRoute` ;
    - `## Moteur en direct` : les fonctions, les temps mesurés, ce qui reste à faire tourner hors du fil principal ;
    - `## Ce qui manque` : la persistance Dexie et Firestore, le catalogue de production à 12 variétés (#120), les
      données réelles ;
    - `## Contrat d'un écran` : ce qu'une voie d'écran reçoit (crochets, composants communs, `jeu.mjs`) et ce
      qu'elle ne doit pas toucher.
    Court et exact : un lien plutôt qu'une copie.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Au style, l'absolu en option ; inconnu ≠ 0 ; simulé marqué « ~ » ; penser en brasseur (α, rôle, arômes, moment,
  puis l'IBU) ; stock en icône seule ; peu de texte au premier plan (80 mots), légendes derrière « ? ».
- Densité de DESIGN.md (chrome compact, lecture claire) ; pas de `type="number"` ([[saisie-mobile]]).
- Code couleur des arômes ; moment glissé par 5′ ; barres l5b ; disposition l8 ; picto « épicé » f1.
- L26 : préfixer ce qui pourrait entrer en collision ; aucun `String.replace` avec une chaîne qui contient `$`.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` :
- ce qui est fait ;
- les captures `--ponts` ouvertes (nommées) ;
- le temps médian d'un recalcul ;
- les écarts aux consignes, avec leur raison ;
- `LEÇON PROPOSÉE : …` ou `CONNAISSANCE : …` s'il y a lieu.

Réponse finale au pilote : une ligne.
