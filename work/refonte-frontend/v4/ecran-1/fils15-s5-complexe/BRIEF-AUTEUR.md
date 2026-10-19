# Lot 15 · Suggestions : s5 à l'épreuve, et ce que chaque voie ajoute d'autre (#138)

Maquettes statiques, 20 min par variante, puis tu livres ce que tu as. Écris en français.
Répertoire : C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie (chemins absolus).
Texte avec barres obliques inverses ou accents graves : outil Write, jamais Bash. Pas de git.
N'écris que dans `work/refonte-frontend/v4/ecran-1/fils15-s5-complexe/<ta variante>/` et dans
`fils15-s5-complexe/captures/`.

## Ce que le brasseur a dit du lot 14 (19.10, soir)

1. « s4-s5 semble pas mal, s5 semble vraiment le mieux dans ce cas, mais proablement très compliqué si
   plusieurs voies, et pour les cas complexe, pas sûr que ça aille »
2. « l'autre limitation, c'est que on voit pas quels sont les autre ajouts, alors oui par nelson sauving
   agumente un peu le floral mais on voit pas ce qu'il ajoute en plus... c'est pas vraiment non plus
   idéal »
3. « le seul procédé qui permet de fixer ça. Tu en as peut être un autre, ça serait le top, mais ça
   serait d'amener à ensuite l'onglet comparaison. on selectionne plusieurs houbon et ensuite on peut
   comparer »

**s5** : ses barres divergentes partent de ma bière, au centre ; ce qui baisse va à gauche, ce qui
monte à droite. **s4** : une cascade vers la visée.

Fichiers : `ecran-1/fils14-suggestions-barres/s5/etat-b.html` et `s4/etat-b.html`. Relis leur
`NOTE.md`.

Deux défauts à corriger :
- les cas complexes ;
- ce que chaque voie ajoute en dehors des objectifs.

## Les données (calculées par le moteur ; n'invente aucun chiffre)

Fichiers : `ecran-1/fils15-s5-complexe/donnees/c1.json`, `c2.json` et `c3.json`. Ils sont produits
par `prototypes/houblons-v4/scripts/cas-suggestions.ts`.

Pour chaque voie :
- `effet` : l'effet sur chaque objectif ;
- `tout` : toutes les familles que la voie fait bouger, visées ou non, avec ma bière `avant` et
  `apres` et la bande du style ;
- `fiches` : pour chaque houblon ajouté, les familles que ses fiches citent :
  - `marqué` : deux fiches au moins, ou famille nommée en premier ;
  - `cité` : une seule fiche ;
  - avec `n` et `sur`.

**À savoir** : le modèle donne la même amplitude à toutes les familles qu'une fiche cite. Par exemple,
Nelson Sauvin 10 g à 10′ donne agrumes +15,7 et épicé +15,9. Le modèle sait **ce que** le houblon
ajoute, pas **combien de chaque**. Seules les fiches disent « surtout » (marqué) ou « un peu » (cité).
Ne dessine pas de différence d'intensité que les données n'ont pas.

Les cas :
- **c1 · Stout 16D, trois objectifs** : plus floral (6,5 → 24,8), moins résineux (visée 30, d'après la
  dégustation), plus agrumes (7,4 → 17,4).
  - Les voies 1 à 7 ont **exactement le même effet** sur les objectifs : floral +15,9, agrumes +15,7.
    Seuls leurs ajouts en dehors des objectifs les distinguent :
    - Motueka : + tropical ;
    - Aurum, East Kent Goldings, Columbus : + herbacé, épicé, terreux ;
    - Celeia : la même chose, plus végétal ;
    - Citra cryo : + tropical, noyau, melon.
  - Nelson Sauvin (voie 9) : agrumes et épicé seulement, chacun cité par une fiche sur deux.
  - Les remplacements à 60′ : résineux −2,6.
  - Trois voies levure.
- **c2 · Stout 16D, deux objectifs dans le même sens** : plus floral, plus tropical.
  - Des assemblages : Motueka + Target, Citra cryo + Target.
  - Des voies qui n'aident qu'un objectif.
- **c3 · Lager tchèque 3B (Saaz CZ 40 g à 60′, Citra cryo 10 g à 10′)** : moins agrumes, moins
  tropical, plus floral.
  - La levure LalBrew Diamond n'a pas de profil dans le modèle (`levure.status: inconnue`). Ma bière
    n'est donc située sur aucune famille (`situee: false`) : les visées sont inconnues.
  - Les **variations** des voies restent connues, par exemple « retirer Citra cryo : agrumes, tropical,
    noyau, melon et floral −9,5 ». On peut donc dessiner des variations à partir d'un centre « ma
    bière, non située ». Jamais un zéro.
  - IBU 26, sous la bande du style (30–45).

Les couleurs des familles : `ecran-1/base/generateur/fiche.css` (variables `--c` de `.f-*`). Elles
servent aussi à la bande de 12 cases de la fiche (g1, la fiche actuelle) :
`ecran-1/base/consolide/fiche.html`.

La page Comparer actuelle : `ecran-1/base/consolide/comparer.html`. Pars de ce qui existe.

## Série p · s5 et s4 à l'épreuve (chacune montre aussi les ajouts en dehors des objectifs)

- **p1 · s5 sur c1** (trois objectifs).
- **p2 · s5 sur c2** (même sens).
- **p3 · s5 sur c3** (lager non située).
- **p4 · s5 généralisé** : une ligne divergente par objectif, empilées, sur c1, avec les 17 voies (les
  3 premières visibles, le reste à un toucher).
- **p5 · s4 sur c1** (cascade à trois objectifs).

## Série q · ce que chaque voie ajoute d'autre (sur c1)

- **q1 · le procédé du brasseur** : on coche plusieurs voies, puis « Comparer (n) » mène à l'onglet
  Comparer. Les houblons choisis y sont côte à côte, au style, avec tout ce que chacun ajoute. Deux
  pages : `etat-b.html` et `comparer.html`.
- **q2 · regrouper les voies au même effet** : « même effet sur tes objectifs ». Ce qui les distingue,
  c'est l'extra ; choisir une voie revient à choisir son extra.
- **q3 · la bande de 12 cases de la fiche sous chaque voie** :
  - les objectifs sont marqués ;
  - les autres familles touchées sont en couleur, pleines si `marqué`, pâles si `cité` ;
  - ce qui sort du style est en orangé.
- **q4 · toucher une voie la projette sur toute ma bière** : les barres divergentes de s5 pour
  **toutes** les familles qui bougent, les objectifs en tête, les autres dessous.

## Ajout (19.10, 13 h 31) : bannir, plusieurs voies, levure, dry hop, biotransformation

Le brasseur, sur s5 :

> « j'aime beaucoup s4 et s5, mais là ça fonctionne bien car c'est un cas facile. si je veux banir, ou
> ouvrir vers plusieurs voie ça semble un peu limité ? D'ailleur ça prends pas encore en compte bio
> transfo, levure. et dry hopping »

Et, sur la planche : « j'aime bien les petit logo sapin fleur ». Les pictos des 12 familles sont dans
`fils15-s5-complexe/pictos-familles.html` (aperçu : `captures/pictos-familles.png`). Utilise-les pour
les extras et pour les objectifs.

Les nouvelles données (les JSON sont regénérés ; l'ordre des voies n'a pas changé) :
- **Bannir · `c1b.json`** : c1, avec l'épicé et Citra bannis (`bannis`).
  - Citra et Citra cryo disparaissent du domaine de recherche.
  - Les voies qui citent l'épicé restent listées, en conflit (`conflits` : « épicé cité dans une
    fiche, exclu par tes goûts »). On les voit barrées ou écartées, jamais cachées sans le dire.
- **Plusieurs voies · `ensemble`** (c1 : [1, 12], [1, 15], [7, 12] ; c2 : [3, 12])
  - Ce sont des voies posées ensemble ; `tout` donne toutes les familles qui bougent, et `ibu` l'IBU de
    la recette.
  - Le calcul suit la convention du moteur : on additionne les apports des ajouts changés, et ce n'est
    valable que si les voies touchent des moments différents (`memeMoment: false` partout ici).
  - Exemple : ajouter Motueka à 10′ et remplacer le Nugget par Motueka à 60′ donne agrumes 23,6,
    floral 22,9, résineux 3,9 et IBU 62,8.
- **Moments et levure** : chaque action a son `momentId` (`b60`, `b10`, `wp`, `dryActive`, `dryPost`)
  ; une voie levure a `levureVers`. Le moment de chaque voie se voit : 60′, 10′, whirlpool, dry hop en
  fermentation active, dry hop après fermentation, levure.
- **Biotransformation · `bio`** : pour chaque dry hop, les signaux cités par le moteur.
  - Les signaux : géraniol → citronellol (le floral peut glisser vers les agrumes), thiols, hop creep.
  - Chacun est « possible » ou « non évaluable », jamais chiffré.
  - Exemple, c1, voie 15 (Motueka 20 g en fermentation active) : deux signaux « possibles ».
  - Montre-les comme une tendance hachurée ou un picto, **sans chiffre inventé**.

Qui fait quoi :
- **Série p** : p6 · **s5 avec des bannis** (c1b). p5 (s4) empile les voies cochées à partir
  d'`ensemble` ; p4 groupe ou repère les voies par moment.
- **Série q** :
  - q1 compare les voies choisies et montre aussi « ensemble » (les voies posées ensemble), dans
    Comparer ;
  - q2 à q4 montrent le moment de chaque voie et la biotransformation de la voie 15.

## Règles (celles du lot 14, toujours valables)

- La réponse d'abord, par objectif.
- 70 mots au plus au premier écran : les extras se disent en couleur et en forme, pas en phrases.
- Au style par défaut, l'absolu à un toucher (D75).
- La couleur et la forme sont libres. L'orangé ne sert qu'à « hors du style ».
- Une valeur inconnue n'est jamais un zéro.

## Livrable et contrôles

Dans `fils15-s5-complexe/<numéro>/` : `etat-b.html` (et `comparer.html` pour q1), plus `NOTE.md`, en
3 lignes : ce qui tient, ce qui casse, l'adaptation.

Conventions :
- `<html data-cas="c1">` (ou `c2`, `c3`) ;
- `data-role="objectif"` et `reponse`, avec `data-verdict`. Pour c3, `data-verdict="inconnu"`, avec
  « inconnu » ou « non situé » écrit ;
- `data-role="piste"` et `effet` ;
- `data-voie="<n>"`, où n est la place de la voie dans `voies` du cas (1 pour la première) ;
- **chaque famille ajoutée en dehors des objectifs** : `data-role="extra" data-famille="<id>"`, visible,
  dans l'élément `data-voie` ;
- q1 : `data-role="choisir"` sur chaque voie et `data-role="comparer"` sur le passage à Comparer ;
- `data-e="style"` et `absolu`, `data-role="zone"`.

1. Capture :
   `node work/refonte-frontend/v4/tournoi/outils/capture-page.mjs work/refonte-frontend/v4/ecran-1/fils15-s5-complexe/<num>/etat-b.html work/refonte-frontend/v4/ecran-1/fils15-s5-complexe/captures/<num>-b-390.png 1688`

   Pour q1, capture aussi `comparer.html`. **Regarde chaque capture.**
2. `node work/refonte-frontend/v4/tournoi/outils/controle-fil6.mjs work/refonte-frontend/v4/ecran-1/fils15-s5-complexe <num> --objet=suggestions --pages=etat-b.html` : `FIL6 OK`.
3. `node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs work/refonte-frontend/v4/ecran-1/fils15-s5-complexe <num> --max=70 --page=etat-b.html` : `MOTS OK`.
4. `node work/refonte-frontend/v4/tournoi/outils/controle-couleurs.mjs work/refonte-frontend/v4/ecran-1/fils15-s5-complexe <num>` : `COULEURS OK`.
5. `node work/refonte-frontend/v4/tournoi/outils/controle-au-style.mjs work/refonte-frontend/v4/ecran-1/fils15-s5-complexe <num> --pages=etat-b.html` (q1 : `--pages=etat-b.html,comparer.html`) : `AU-STYLE OK`.
6. D76 : `node work/refonte-frontend/v4/tournoi/outils/controle-autres-ajouts.mjs work/refonte-frontend/v4/ecran-1/fils15-s5-complexe <num>` (q1 : ajoute `--via-comparer`) : `AUTRES OK`.
   Les 9 maquettes du lot 14 y échouent : aucune ne montre les extras.

Réponse finale : une ligne par variante (ce qui tient, ce qui casse, les contrôles).
