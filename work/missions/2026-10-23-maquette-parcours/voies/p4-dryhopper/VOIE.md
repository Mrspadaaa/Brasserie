# Voie p4-dryhopper — Dryhopper (a1) et l'étape Levure, jouables

- Mission : 2026-10-23-maquette-parcours (lire `../../MISSION.md` d'abord)
- Agent : concepteur
- Modèle : opus
- Niveau : conception
- Plafond : 120 tours ; 3 essais par critère
- Dépend de : p0-socle (le socle, son `ARCHITECTURE.md` et son « ## Contrat d'un écran »)
- Décideur en cas de doute : brasseur, par ses mots et ses choix connus ; aucune question bloquante (option
  prudente, écrite dans la NOTE)

## Objectif
Deux écrans de la maquette jouable, en React dans le socle, calculés en direct à chaque geste :
- **Dryhopper**, « Quand ajouter Idaho 7 ? », repris de a1 (y1b affiné : « y1b est de mon point de vue semble
  meilleur ») ;
- **l'étape Levure**, « Et avec quelle levure ? », dont « Ajouter à ma bière » inscrit l'ajout (houblon, dose,
  moment, levure) dans la recette et revient à Ma bière.

## Entrées
- `prototypes/houblons-v4/parcours/ARCHITECTURE.md` : le contrat d'un écran, les crochets, l'adaptateur du moteur
  (« simuler un ajout à chaque moment », « effet de la levure »), les composants communs.
- `work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-a/passe3/a1/etat.html` (la page à porter),
  `…/serie-a/passe3/NOTE.md`, `…/serie-a/passe3/captures/` (à ouvrir d'abord), et `…/serie-a/NOTE.md` (ce qu'a1
  reprend de y1b).
- `work/refonte-frontend/v4/ecran-1/fils23-dryhopper/BRIEF-SERIES.md` : la question, le seul facteur libre, la
  baseline (y1b, x3b et a2b), les données.
- `work/refonte-frontend/v4/ecran-1/fils22-carte/dryhopper/etat.html` et `…/fils22-carte/levure-etape/etat.html` :
  la carte (contexte, ponts, éléments admis ; « après fermentation, rien ne change »).
- `cerveau/metier/dryhop-moment.md` et `cerveau/metier/cout-calcul-moteur.md`.
- `cerveau/produit/acquis-valides.md` ; `DESIGN.md`, `docs/ui-compacte.md`, `.claude/rules/affinee-frontend.md`.
- Les en-têtes des contrôles de tes GATES (`work/refonte-frontend/v4/tournoi/outils/<contrôle>.mjs`).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `prototypes/houblons-v4/parcours/src/ecrans/dryhopper/**`
- `prototypes/houblons-v4/parcours/src/ecrans/levure/**`
- sortie de construction : `prototypes/houblons-v4/maquettes/parcours-p4/` (ignorée par git)
- `work/missions/2026-10-23-maquette-parcours/voies/p4-dryhopper/RESULTAT.md`
- Un besoin dans le socle se demande au pilote dans RESULTAT.md. Ne pas écrire dans `src/commun/`, `src/etat/` ni
  `src/moteur/`.

## Consignes
1. **Dryhopper** : un seul facteur libre, le moment.
   - Le rail sous le pouce : l'ébullition glissée par 5′, puis le whirlpool, le dry hop actif et le dry hop après
     fermentation, en jours.
   - Le geste de y1b : loupe sous le doigt, sauts. Aucune graduation au repos (D47).
   - Houblon, dose et levure sont fixés sur la ligne de contexte.
   - Le premier écran de a1 (passe 3) : relief du floral au-dessus du rail, l'amertume en figure, la frise
     jusqu'aux jours de contact, une vraie valeur sourcée.
2. **Calcul en direct** : à chaque cran, l'adaptateur recalcule l'IBU et les familles au style (`simulerCas`).
   - Entre deux moments, plus de « ? » de grille : la maquette calcule.
   - Ce que le moteur ne modélise pas (l'IBU à cru, par exemple) reste dit « ? » : inconnu ≠ 0.
   - Les nombres doivent rejoindre ceux de a1 aux moments de sa grille ; les écarts et leur cause vont dans la NOTE.
3. **Défaut connu de a1, à corriger** : D95 (`controle-simulation`, S2), rouge sur a1 le 23.10. Le rail lui-même
   est le réglage (`data-role="reglage"`) qui fait bouger le simulé ; une vraie valeur (`data-nature="mesure"`) se
   tient à côté.
4. **« Puis la levure »** ouvre l'étape Levure, avec le moment retenu en brouillon.
   - On y choisit la levure (US-05, Pomona…).
   - On y voit ce qui bouge : les familles, la biotransformation (`data-role="biotransformation"`) et la confiance.
   - « Ajouter à ma bière » inscrit l'ajout dans la recette ; « ‹ » abandonne le brouillon.
   - D96 (le cumul et la levure) est hors Dryhopper par décision du 23.10, mais il se vérifie sur l'étape Levure.
5. L'appui long sur le nom du houblon ouvre la fiche (composant de la voie p1, importé de `src/ecrans/fiche/`). S'il
   n'est pas encore là, le signaler dans RESULTAT.md.
6. `jeu.mjs` (un par écran) :
   - glisser le moment de 60′ au dry hop actif fait chuter l'IBU et monter le floral ;
   - au-delà de 2 jours, rien ne bouge (le savoir de la carte) ;
   - « Puis la levure », changer de levure fait bouger une valeur simulée ;
   - « Ajouter à ma bière » met Idaho 7 dans la recette, au bon moment, avec la bonne levure.
   - la loupe (L12, D47) : doigt posé sur le rail, l'écart entre deux crans voisins sous le doigt vaut au moins trois
     fois l'écart au loin (mesuré sur les positions rendues, doigt maintenu) ; au repos, aucune graduation.
7. NOTE.md de chaque écran : `## Base`, `## Idées reprises`, `## Écarts`, `## Pour l'app`, et les contrôles écartés
   avec leur raison.
8. Te juger sur tes captures à 390 puis à 1280 px, ouvertes en image (L12), à côté de celles de a1. Capturer aussi
   le geste en cours (loupe).

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Au style, l'absolu en option ; inconnu ≠ 0 ; simulé marqué « ~ » ; 80 mots au plus au premier écran ; légendes
  derrière « ? » ; stock en icône seule.
- Glisser le moment comme un curseur, par 5′ ; ébullition jusqu'à 120′ ([[rien-de-fige]]) ; y1b, le brassin au
  doigt ; code couleur des arômes (la table commune) ; picto « épicé » f1.
- L26 : préfixer les classes propres à l'écran ; aucun `String.replace` avec une chaîne qui contient `$`.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` : ce qui est fait, les captures ouvertes (nommées), le temps d'un recalcul pendant le geste, les écarts
aux nombres de a1 et leur cause, les besoins dans le socle, `LEÇON PROPOSÉE : …` s'il y a lieu. Réponse finale au
pilote : une ligne.
