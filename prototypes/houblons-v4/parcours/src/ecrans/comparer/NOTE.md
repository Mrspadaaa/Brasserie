# Comparer — cmc2k, son choix (« Parfait pour Une bande teintée cmc2k »), dans la maquette jouable

Voie t15a-comparer (mission 2026-10-25-integration-houblons, 25.10) : l'écran passe de cmc2h à **cmc2k**, repris tel quel de
`work/refonte-frontend/v4/ecran-1/fils25-comparer/cmc2k/source/` (`index.tsx`, `Ensemble.tsx`, `Etapes.tsx`, `comparer.css`
copiés ; les autres fichiers étaient identiques). Deux écarts seulement :
- **Radar** : toujours `RadarBase` (commun de l'app, `@app/ui/hopIndex/commun/RadarBase`), par `Radar.tsx` de cmc2h, avec
  le moment passé (`moment={moment}`) ; le `Radar.tsx` propre de cmc2k et `RadarOutils.ts` ne sont pas repris.
- **« Ses mots » (D151)** : « Le +2 de idao7 ça va pas du tout, il doit tout y avoir avec en ordre décroissant du plus fort au
  plus faible. » Tous les mots de chaque houblon, sans « +n », triés par force décroissante. **La force** (parForce), clés dans
  l'ordre : (1) le nombre de ses fiches qui citent le mot ; (2) l'apport de sa famille chez ce houblon selon le moteur, au
  moment comparé (le `dCran` de sa rangée « Par famille », juste au-dessus) ; un mot hors des 12 familles, ou d'une famille
  inconnue, n'a pas de force moteur et vient après ; (3) « lui seul » (gras) d'abord ; puis l'ordre de `sesMots`. Repères :
  `data-n-mots` (la longueur de la liste) sur chaque colonne, `data-fiches` et `data-force` sur chaque mot. Au catalogue
  actuel, chaque mot n'est cité que par une fiche : c'est la force moteur qui ordonne. L'ordre suit donc le moment : à dry hop,
  Idaho 7 commence par cassis (2,27) et résine (1,97), et finit par thé noir (0,41).
- Contrôle : `work/refonte-frontend/v4/tournoi/outils/controle-mots-tous.mjs` (ECHEC sur cmc2k : « +2 », liste inconnue ; OK ici).

## Pour le port dans l'app (phase 2 de t15a, à l'agent Sonnet)

Fait (25.10, vérifié) : **l'écran vit déjà dans l'app, une seule copie** : `src/ui/hopIndex/comparer/` (index.tsx, calcul.ts,
Ensemble, Etapes, Feuilles, Huiles, Radar, icones, valeurs, comparer.css, déplacés d'ici). Ce dossier-ci ne garde que l'hôte
maquette (`index.tsx`), `calcul.ts` (réexport pour Dryhopper : `couleurHoublon`), `jeu.mjs` et cette note. Après le
déménagement : maquette construite, MOTS-TOUS, QUAND, NORMALISE, CENTRE, RADAR-BASE, CHOIX OK, ETATS 139/139 ; `tsc` de l'app vert.
Rien de l'app n'importe encore `comparer/` : démarrage inchangé.

- **Hôte** (`src/ui/hopIndex/comparer/hote.tsx`, même principe que `maBiere/hote.tsx`) : `recette`, `route` (`pin` de
  Substituer), `aller` (la fiche pousse une entrée d'historique), `ouvrir` (dryhopper, levure, suggerer), `Cadre` (en-tête,
  onglets, dock), `Fiche` optionnelle (absente : l'appui long n'ouvre rien). L'écran n'importe plus rien de la maquette.
- **Remplacements faits** : `donnees/cas` → `comparer/cas.ts` (VISEE, H, LEVURES, nomLevure ; CONDITIONS de `parcours/conditions`) ;
  `S1_DIRECTION` (prototype) → `DEMANDE_DEGUSTEE` de `parcours/visee.ts` (même valeur : floral +1, résineux −1) ; moteur →
  `parcours/adaptateur` et `parcours/v4` ; `commun` → `comparer/commun.ts` (communs de l'app, CadreOutil par l'hôte).
- **À faire** : l'hôte de l'app (`EcranApp.tsx`, chargé par `HopToolLayer` pour `hopCompare`, dans le chunk des outils, React.lazy) :
  - recette = brouillon converti (`toHopRecipe`, comme `maBiere/EtapeHoublons.tsx`), données par `useHopData` + `configurerDonnees` ;
  - « Placer <houblon> » : `ajouter(recette, ajoutPlace)` (dose `CONDITIONS.doseGL × volumeL`, dry hop actif 3 j : voir
    `etat/etapes.ts` `ajoutPlace`), puis `versPatch` → `onChange` (applyHopV4Change), puis `ouvrirCouche({ view: 'hopTiming', additionId })` ;
  - Cadre : `PageShell` de l'app ; les onglets de la maquette (`commun/Onglets.tsx`) dépendent de sa coquille : à refaire.
- **Piège 1, la porte** : la couche est AU-DESSUS du wizard ; elle n'a ni le brouillon ni `applyHopV4Change`. Il faut un pont
  (par ex. `comparer/porte.ts` : `poserPorteEtape({ recipe, boilOg, draftId, onChange })`), posé par `maBiere/EtapeHoublons.tsx`
  (voie rb2-ma-biere ; une ligne d'effet). `EtapeHoublons` n'a pas non plus de route « comparer » dans `coucheDe` : l'entrée
  « Comparer (n) » de Ma bière ou Suggérer est à brancher.
- **Piège 2, textes du cas S1** : l'écran dit « … pour ma stout ? », « Ta stout », « dégustation du 18.10 », visée floral. Sur
  une autre recette de l'app, c'est faux : nom de la bière, dégustation (`useHopData().degustation`, null = tout simulé) et
  demande sont à passer par l'hôte avant de le montrer sur une vraie recette.
- **Piège 3, calcul** : `lireColonnes` simule en direct sur le fil principal, une fois au dry hop (`cols`) et une fois par
  moment (`vue`), plus `lireEtapes` (5 moments × houblons). Mesurer ouverture et changement de moment ×4 ; les deux `useMemo`
  ne recalculent que ce qui change. Compromis si trop lent : moments au worker (`domain/hopIndex/v4/client.ts`), ou étapes après.
- **Piège 4, CSS** : `comparer.css` suppose le thème clair de la maquette et ses `pq-outil` (`commun/retour.css`, `feuille.css`) ;
  à comparer en capture à côté de cmc2k.

## Note précédente (cmc2h)

# Comparer — cmc2h, son choix (« C'est quasiment parfait », sur cmc2g), dans la maquette jouable

Voie rb-radar-commun (mission 2026-10-23-maquette-parcours, 25.10) : l'écran est **cmc2h tout entier**, repris tel quel de
`work/refonte-frontend/v4/ecran-1/fils25-comparer/cmc2h/source/` (construit au miroir comme `var/cmc2h`). Un seul
changement : son radar vit dans `src/commun/RadarBase.tsx` (« utiliser ce radar graph comme Baseline et l'utiliser
partout dans les vue où il y en a »). `Radar.tsx` ne fait plus que lui donner les valeurs que cmc2h lisait (dCran au
style, centre / cran en Absolu, ta stout en trait noir en Absolu, la zone de ta 16D au style) ; les classes `cmc-` du
radar sont devenues `rb-` (commun/radar-base.css). `RadarOutils.ts` (passe 3, jamais importé par cmc2h) n'est pas repris.
Le balisage du radar est le même que celui de cmc2h, aux attributs de contrôle près (`data-radar="base"`, `data-mode`,
`data-moment`, `data-centre`, `data-valeurs`, `data-role`, `data-anneau`) et à l'id du motif hachuré (useId).

L'ancienne note de l'écran (r6a, D107 à D141 : ponts, appui long, épingle de Substituer) : `git show 28989963:prototypes/houblons-v4/parcours/src/ecrans/comparer/NOTE.md` ; ses ponts sont gardés par cmc2h. La note de cmc2h suit, telle quelle.

## cmc2h — cmc2g, son choix (« C'est quasiment parfait »), avec quatre retouches

cmc2g à l'identique (radar à une échelle par axe, au style), plus ses mots sur cmc2g : « il y a pas de transition entre les type de données, il y a un ? Qui prend toute la place le + toujours pas centré. Trop de blanc inutil, d'espace pour rien ».

- **Transitions** : un filet et un titre d'une ligne, « Par famille » au-dessus des rangées et « Ses mots » au-dessus des mots. L'huile garde son titre « De Saaz à … » avec son filet.
- **Le « ? » des étapes** : il ne prend plus de ligne. Il est au bout de la ligne de titre « Par famille », juste sous le tableau, et sa feuille explique aussi les rangées (zone 16D, trait noir de ta stout, orangé, écart chiffré).
- **Le + centré** : il est au centre de la colonne « Ta stout » et au milieu de la rangée des têtes (écart 0,0 px et 0,0 px). Contrôle neuf : `work/refonte-frontend/v4/tournoi/outils/controle-centre-plus.mjs`, qui échoue sur cmc2g (−16 px et −22 px) et passe sur cmc2h.
- **Moins de blanc** :
  - « ses mots » perd 62 px de marge morte (marge haute de 34 px et retrait haut de 28 px) ; le titre porte le filet ;
  - la ligne du « ? » (32 px) disparaît ;
  - marges entre blocs resserrées : huile 6 et 4 px, pied 2 px.
  - Rien d'utile n'est retiré.
- Contrôles : QUAND OK, NORMALISE OK, MOTS 100 (OK), CENTRE OK.

Base commune (cmc2d, reprise telle quelle dans cmc2e, cmc2f et cmc2g ; seul le radar diffère) :
- **Radar** : son rdg5 (secteur « sans donnée » en bas). Les points connus de chaque houblon sont reliés en trait plein entre deux axes voisins connus, et en tireté (5 4), de sa couleur et de son épaisseur, là où le segment enjambe un inconnu ou le secteur « sans donnée » (« Il y a pas les traits haché comme demandé »). Le remplissage ne suit que les tronçons pleins, du contour au petit anneau du zéro, jamais sous un tireté ni au centre. L'inconnu d'un seul houblon est une pastille « ? » à sa couleur, au bord, sans point.
- **Huiles** (« Non la première partie doit être en dessous. La seconde dans l'autre vue... ») : l'huile totale « De Saaz à … » est sous le bloc « ses mots », juste avant Biotransformation et Enchaîner. La composition des huiles (Beer Maverick, barres superposées) est dans la feuille « Valeurs », sous la ligne « huile ». Sous les étapes, on passe directement aux rangées des familles. Doublon gardé : la chimie de la feuille a déjà ses lignes myrcène, humulène et caryophyllène. Leurs plages viennent de `composes-houblon.json` (BM, HS…), alors que la composition vient de `oils` du catalogue (BM) : Cascade, myrcène 40–60 contre 45–60.
- **Étapes** (« Ajouter un ? Explicatif pour ces données. Utiliser les pastilles comme c'etait de base ») : le tableau de la base jouable. Le moment choisi est dans une pastille noire ; chaque valeur a sa petite barre, à la couleur de la famille de la pastille, et le trait gris de ton Nugget. Nos cinq moments, les nombres et les ★ sont gardés. Un « ? » rond au bout du tableau ouvre l'explication (le nombre, ★, ton Nugget en gris, « ~ », « ~0 », Au style ou Absolu, dry hop 3 j).
- **Normalisation** (« SI choisi absolu, plus de normalisation… ») :
  - « Au style » : les anneaux suivent le moment. Chaque rangée de famille est mise à l'échelle de son plus fort apport du moment, et son plancher passe de 0,3 à 0,05 cran (D67) : à 60′, la barre de l'épicé tombait à 30 %. Les petites barres des étapes, ligne par ligne ; un apport sous 0,05 cran s'écrit « ~0 ».
  - « Absolu » : le radar est sur une échelle fixe et commune, de 0 à 12,5 crans, à tous les moments. Les barres des rangées et des étapes sont brutes (sur 125, et 0 à 4 crans pour les étapes) ; rien ne se rechiffre.
- **Bouton ⇄** (« un poil plus large ») : 33 px au lieu de 24, sur un fond léger ; le × est tel quel.
- **Texte retiré** (« encore pas mal de légende et texte inutile ») ; son sens est passé dans la feuille « ? » d'en haut, en une ligne chacun :
  - la légende en carrés sous le radar (houblons, 16D) : couleurs des têtes, bascule « Au style » ;
  - « ~ dans la cuve, au moment comparé ; dry hop : 3 j de contact » (aussi dans le « ? » des étapes) ;
  - « Résineux déjà au-delà, ta dégustation : chaque gain s'y ajoute » ;
  - « ~ simulé, 4 g/L chacun ; trait fin : incertitude » ;
  - « inconnus, pas zéro » (garde ses pictos et la case hachurée) ;
  - « ses mots » (les deux étiquettes) ;
  - le « ~ » devant ✓ et ⚠ (le signe et le picto restent) ; « hors » reste à côté du ⚠ (« le fait que les style hors 16d soit bien montré ») ;
  - la ligne « Le radar » de la feuille « ? », réécrite pour ce radar ;
  - les arômes de « Autres » réduits à trois mots : « β-pinène, linalol, géraniol ».
- **Mots au premier écran** : cmc2d passe de 106 à 95.

Données : moteur en direct, dépôt au commit 2f1c0b01ac5941b4e4e9c278527c2ea3d5eb9b92. Huile totale : `huileDe` (enveloppe des sources de `valeurs.ts`, BM et HS, sinon `oil` du catalogue). Composition : `hopRef(cle).catalogue.oils` (Beer Maverick) ; Autres = 100 − la somme des trois.

## Reprise

- r6a-question : repris — le titre en question, « Cascade, Idaho 7 ou Galaxy pour ma stout ? », en tête de l'écran (D119)
- r6a-contexte : repris — la ligne de contexte : 16D, 4 g/L chacun (r6n2), US-05, et le « ? » à sa droite ; le moment en sort, il est dans la bande des étapes (D107, D128)
- r6a-simule : repris — la pastille « ~ simulé » au-dessus du radar
- r6a-lentille : repris — « Au style / Absolu », au style par défaut
- r6a-radar : repris — le radar r2 à 12 axes : zone de ta 16D, un trait par houblon, pictos aux axes, secteurs inconnus hachurés
- r6a-ta-stout : repris — la colonne Ta stout (♣ ↓, ❀ ↑ : les flèches de ses rangées, 80 mots, D128) et son trait noir dans chaque barre
- r6a-tetes : repris — les têtes de colonne : nom, α (lot ou plage, ≠), rôle, familles en pictos, verdict ~✓ ou ~⚠
- r6a-rangees : repris — au premier écran comme r6a (D128, FAMILLES OK) : une rangée par famille, une barre l5b par houblon, au moment choisi dans la bande des étapes
- r6a-ecarts : repris — Floral ↑ et Résineux ↓ : la flèche ; l'écart chiffré de la famille du critère dans la bande des étapes, juste au-dessus, à chaque moment ; sur la rangée Floral quand le critère est une autre famille (80 mots, D128)
- r6a-inconnus : repris — les cases hachurées et la rangée « inconnus »
- r6a-chimie : repris — « Chimie et vraies valeurs » à un toucher sous le tableau
- r6a-osu : repris — « Panel OSU, Cascade » (panel, sur 15, g/L), à un toucher « Panel OSU » sous le tableau (D114)
- y1b-face-a-ta-stout : repris — dans la bande des étapes (D128) : ★ au meilleur de chaque étape par le critère, le nombre de chacun ; la ligne de réponse à part n'est plus au premier écran (80 mots)
- y1b-pastille-critere : repris — « Face à ta stout, par [floral ⌄] » (r6n2) en tête de la bande des étapes : floral, agrumes, tropicaux, moins résineux ; il choisit la famille chiffrée aux étapes, le ★, le mis en avant et le Défi ; « Pourquoi ce classement › » en bas de sa liste (D124, D128)
- y1b-jauge-amertume : repris — dock « Défi », carte « Amertume tenue » : Nugget 60′ 46 g et son IBU calculé, « + ? » à cru hachuré, doses pour 10 IBU à 10′ (r6n2, D124)
- y1b-dock-pouce : en pont — Dryhopper ; « Placer <retenu> › » en bas de l'écran, comme le « Doser … dans Dryhopper » de r6a (D128)
- y1b-plan-d-avant : repris — le trait noir de ta stout dans chaque barre, son polygone au radar, la colonne Ta stout
- y1b-bandes-style : repris — les rangées : zone de ta 16D pâle, orangé au-dessus, inconnu hachuré, trait de l'intervalle
- y1b-ligne-contexte : en contexte — Stout 16D, 4 g/L chacun, US-05
- y1b-defi : repris — dock « Défi 2/4 » (r6n2) : ta dégustation, score par houblon, plus floral, moins résineux, amertume tenue, dans ta 16D (D124)
- y1b-tirage-preuve : repris — dock « Preuve » (r6n2) : le panel OSU, puis 20 bières tirées dans la bande du moteur, famille par famille, « 20 autres » (D124)
- y1b-levure-pastilles : en contexte — la levure est fixée dans la ligne de contexte (US-05) ; elle se règle dans Levure
- y1b-second-houblon-puis : en pont — Dryhopper ; « Placer » ouvre Dryhopper, où se règle la suite des ajouts
- y3-panel-osu : repris — le panel OSU à un toucher sous le tableau (D114), sans molette, « pas de panel publié » pour les autres
- y3-pour-egaler : repris — « Égaler » à un toucher : la dose de chaque autre houblon qui donne le floral du retenu, par le moteur
- v1-vraies-valeurs : repris — « Chimie et vraies valeurs » : α, β, huile dans les colonnes des houblons, sourcés
- v1-en-a-plus : repris — dans les vraies valeurs, la plus haute de chaque rangée prend la couleur de son houblon
- v1-linalol-en-biere : repris — linalol mesuré en bière (H12, E03 à confirmer), « pas comparables entre eux »
- w2-piste-commune : repris — dock « Défi » : une piste par objectif, un rond lettré par houblon sur la même règle, la visée en pointillé (r6n2, D124)
- w2-cartes-verdict : repris — les têtes de colonne : verdict face à la 16D en signe, familles qui sortent
- x3b-cuve-jour-apres-jour : repris — sa manière dans la bande des étapes : ton Nugget en pointillé, la barre qui monte à l'étape de l'ajout ; « dans la cuve » sous le tableau ; les jours de contact à Dryhopper
- a2b-ce-que-la-levure-change : en contexte — la levure est fixée (US-05) dans la ligne de contexte
- d1-tout-ouvert : repris — la chimie rangée par famille, une ligne par composé avec son picto, rien d'ouvert d'office
- l5b-barres-voie : repris — les barres des rangées, face au trait de ta stout
- l5b-pistes-objectif : repris — les rangées Floral ↑ et Résineux ↓ de ta demande, avec l'écart chiffré par houblon
- l8-disposition : repris — tournée : familles communes en rangées, houblons en colonnes, la réponse en tête
- l8b-verdicts-pictos-trait : repris — verdicts en signe dans les têtes, pictos au trait partout
- l8b-legende-cachee : repris — le « ? » à droite du contexte, fermé au repos, à la même place que sur les autres écrans
- l5f-carte-role-alpha : repris — les têtes de colonne : nom, α du lot ou des fiches (≠), rôle en mot, familles, stock en icône
- m4-radar-degustation : repris — la colonne Ta stout : ta dégustation du 18.10 (trop ♣, plus ❀) et son trait noir
- h4-radar-demande : repris — au radar, flèche verte vers l'extérieur sur Floral, flèche orangée au bout du résineux
- p03-plages-sources : repris — vraies valeurs : α et β en enveloppe des sources (BM, HS), le trait de ton lot
- p03-radar-superpose : repris — le radar r2, un polygone par houblon à sa couleur
- p06-grille-familles : repris — les têtes : les familles de ses fiches, marquées grandes, citées petites
- p02-radar-intervalle : repris — l'intervalle du retenu en trait fin sur chaque axe, coupé « // » au bord (D103)
- s5-deux-objectifs : en pont — Suggérer ; dock « Défi » : les deux objectifs (Plus floral, Moins résineux : aucune voie houblon), « Toutes les voies pour tes deux objectifs : Suggérer » (r6n2, D124)
- p4-plus-comparaison : repris — le « + » sous Ta stout : un 4ᵉ houblon de ton stock, simulé en direct
- g1-fiche : en pont — fiche ; appui long sur un nom de houblon, survol long à l'ordinateur
- fiche-citra-cryo : en pont — fiche ; la même fiche courte, à l'appui long sur le nom
- d107-etapes : repris — la bande des étapes sur les rangées (D128) : chaque houblon à 60′, 10′ et dry hop, ensemble, au repos, au premier écran, calculés par le moteur ; chaque ligne est un toucher qui pose ce moment sur les rangées et le radar
- d107-etat-au-moment : repris — toucher 60′, 10′ ou dry hop : le radar, les rangées et les verdicts ~ dans / ~ hors passent à ce moment, le moteur posant chaque houblon là (D128)
- d107-reference : repris — ton Nugget (houblon de base de la recette) aux mêmes étapes, à la même dose, en gris dans la colonne de gauche
- d128-selecteur-etapes : repris — le sélecteur segmenté du moment (60′, 10′, WP, actif, après) sous les têtes : il pose le moment sur le radar, les têtes et les rangées
- d128bis-ses-mots : repris — « Ses mots » sous les rangées : tous les mots de chaque houblon, picto de famille ou losange hors des 12 familles, sans « +n », du plus fort au plus faible
- flb5-lui-seul : repris — dans « Ses mots », en gras ce que ce houblon est seul à dire, en gris ce qu'un autre dit aussi
- x3b-plans : repris — la feuille « Étapes » du dock : les plans des étapes de la comparaison, à un toucher
- x3b-biotransfo : repris — la feuille « Biotransformation » du dock : ce que la levure change au dry hop, à un toucher
