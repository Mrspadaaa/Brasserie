OK — rejoué par le pilote le 24.10, 20/20 : Comparer aux étapes à la manière de x3b, Nugget en référence (D107), panel OSU replié (D114) ; G14 et G19 verts depuis l'alignement des scripts du parcours sur la croix (D118).

(Avant le rejeu du 24.10 : ECHEC — G14, G19 : la croix D118 (p2) ramène à Ma bière ; Comparer D107 vert (18/20))

## Ce qui est fait

Comparer de r6a, en React dans le socle, calculé en direct (`comparer` de l'adaptateur à chaque changement de
houblons ou de recette, aucune grille figée). Son premier écran reste celui de r6a : contexte, radar r2 avec la
lentille au style ou absolu, la colonne « Ta stout » et ses rangées l5b, l'α et le rôle en tête de colonne, les
écarts sur Floral ↑ et Résineux ↓. Un seul facteur libre : le houblon. On retient une colonne d'un toucher, le
« + » en ajoute une 4ᵉ de ton stock, × la retire. « Placer <retenu> › » ouvre Dryhopper avec ce houblon en
brouillon. L'appui long (ou le survol long à l'ordinateur) ouvre la fiche de p1 par-dessus Comparer, et le retour
du téléphone la ferme. `#/comparer?…&pin=<houblon>` épingle le houblon de Substituer en colonne 1.

Fichiers écrits, tous dans `prototypes/houblons-v4/parcours/src/ecrans/comparer/` :
- `index.tsx`, `calcul.ts`, `Radar.tsx`, `valeurs.ts`, `comparer.css` ;
- `jeu.mjs` (7 gestes) et `NOTE.md` (sections Base, Idées reprises, Écarts, Pour l'app, Reprise).

Construction dans `prototypes/houblons-v4/maquettes/parcours-p3/` (ignoré par git), avec :
- `captures/` ;
- `comparer-seul/etat.html`, une copie de diagnostic : la page construite, Ma bière masquée par un style injecté.

## Sorties décisives (rejouées le 23.10, depuis la racine)

- G1 : CONSTRUIT OK (8 pages).
- G2 : TYPES OK. Des erreurs passagères venaient des voies voisines en cours d'écriture ; vert au dernier passage.
- G3 : COMMUN OK. Contraste, standard, légende et fiche ont été corrigés en route.
- G4 : rouge, **MOTS ECHEC (87 mots)**. Sur la copie sans Ma bière dessous, **MOTS OK (79)**. Les 8 mots en trop
  sont ceux de Ma bière, montée sous l'outil et comptée par le contrôle, qui ne connaît pas `inert`.
- G5 : rouge, **UNE-QUESTION ECHEC** : « le titre « Stout export » ne pose pas une question ». Le contrôle lit le h1
  de Ma bière, monté dessous. Sur la copie sans Ma bière : **UNE-QUESTION OK (1 groupe libre : houblon)**.
- G6 : ACQUIS OK (4/4 : radar, chimie, osu, valeurs).
- G7 : ALPHA OK.
- G8 : RADAR-SERIES OK. Le radar est balisé `data-objet="houblons"` pour être vraiment contrôlé :
  Cascade #781838 et Galaxy #681878 tracés à 2,5 px, Idaho 7 #e80030 à 3 px, une seule surface pleine.
- G9 : LISIBLE OK (41 pictos, 3 mesurées, 11 simulées).
- G10 : **SIMULATION OK**, « le simulé bouge ». D95 est corrigé : retenir une colonne réécrit la réponse avec
  l'écart du moteur, la ligne « contre ★ » de r6p2. L'α est la vraie valeur, mesurée, à côté.
- G11 : rouge, **AUTRES ECHEC : aucune voie visible ([data-voie])**. Le contrôle compare les `data-voie` aux voies
  du cas S1 (pack-mini-protos) ou du lot 15. Aucune colonne de Comparer en direct (Cascade, Idaho 7 et Galaxy à
  4 g/L, après 3 j) n'est l'une de ces voies, et les baliser ainsi serait faux. Le fond de D76 tient : chaque
  famille que chaque houblon fait bouger est sur sa rangée.
- G12 : SANS-FAMILLE OK. Ajouté par le « + », Nelson Sauvin montre sa part « autres » ; `jeu.mjs` le vérifie.
- G13 : REPRISE OK (23 repris, 3 en contexte, 5 en pont, 6 écartés).
- G14 : ETAPE OK (comparer). Le jeu vérifie dans la page :
  - la fiche de Galaxy à l'appui long, puis le retour ;
  - « Retenir Cascade » : l'écart affiché est celui du moteur ;
  - Égaler ;
  - le « + » de Nelson Sauvin : 4 colonnes, 4 séries au radar, le floral égal au moteur ;
  - « Placer Nelson Sauvin » : le brouillon Dryhopper porte `beermaverick-nelson-sauvin`.
- G15 : PONTS OK (19 gestes, recalcul médian 1,0 ms).
- G16 : APP INTACTE OK.

## Captures ouvertes (regardées en image)

Toutes dans `prototypes/houblons-v4/maquettes/parcours-p3/captures/`, comparées à `fils22-comparer/captures/r6a-premier-ecran.png`
et `r6a-390.png` :
- `p3-390.png` et `p3-390-plein.png` (390 px, premier écran puis page entière) : le brasseur retrouve r6a. Il y
  gagne la ligne « ★ Idaho 7 devant Cascade ~+0,4 cran », un radar sans étoile pâle et la flèche orangée au bout
  du résineux ;
- `p3-1280.png` et `p3-1280-plein.png` (1280 px) : le cadre de l'app (768 px), radar de 420 px, barres larges ;
- `p3-cascade-egaler-390-plein.png` : Cascade retenue (« ~−0,4 cran contre ★ Idaho 7 »), et Égaler : Idaho 7
  ~2,5 g/L, Galaxy ~4,5 g/L ;
- `p3-quatre-390.png` et `p3-quatre-vraies-390-plein.png` : la 4ᵉ colonne (Nelson Sauvin), en picto seul, et la
  chimie à quatre ;
- `p3-absolu-390.png`, `p3-menu-390.png` (le « + »), `p3-legende-390.png` ;
- `fiche.png`, puis `01-…` à `07-…` : les gestes de `jeu.mjs`.

## Améliorations prises et laissées (détail dans NOTE.md)

Prises :
- **de r6n2** : la ligne de réponse « Idaho 7 devant Cascade ~0,4 cran » ; le verdict des têtes en signe ; le « + »
  (p4) pour une 4ᵉ colonne, avec le passage au picto seul à quatre colonnes (correction du critique) ; le dock
  réduit au seul pont ; la flèche de ta demande au radar (h4) ;
- **de r6p2** : « contre ★ » chiffré au toucher d'une colonne ;
- **de r6n1 et r6n2 (D103)** : le radar qui ne sature plus (flèche orangée au bout de l'axe, moustache coupée
  « // ») ; Égaler (y3), à un toucher ;
- **de r6p1** : la moustache adoucie ;
- **de r6p3** : les « ? » écrits du radar retirés.

Laissées : la pastille de critère (r6n2, r6p2), le dock à six feuilles (r6n2, r6p1), les pistes du défi au premier
écran (r6p3), « on gagne / on paie » (r6p4), la teneur du lot dans la fiche (r6p1 : c'est la fiche de p1), le titre
« Lequel pour ma stout ? » (r6p2, r6p4).

## Écarts aux nombres de r6a

Aucun, aux arrondis près. Moteur du 23.10 contre la grille du 22.10 :
- floral : ~+0,9, ~+1,3 et ~+0,9 ; résineux : ~+1,9, ~+2 et ~+2 ;
- tropicaux de Galaxy hors de la 16D ; mêmes inconnus.

Un écart de dessin : là où ta stout est inconnue (baies, noyau), son trait noir n'est plus posé à 0 (inconnu ≠ 0).

## Besoins dans le socle et chez les voisins

1. **Socle, Coquille** : ne pas monter `<MaBiere />` sous un outil plein écran, par exemple
   `{!estOutil(route) && <MaBiere />}` dans `src/coquille/Coquille.tsx`. Ses h1, mots, `data-voie` et
   `data-houblon` sont lus par les contrôles du dépôt, qui ignorent `inert`. C'est la seule cause de G4 et G5, et
   p2 et p4 l'ont aussi.
2. **Socle, routes** : ajouter `pin?: string` à `Route` (`#/comparer?h=…&pin=`). Comparer le lit pour l'instant
   dans l'adresse.
3. **p1, fiche** : `FicheHoublon` pose `data-role="fiche"` sur la feuille à son montage. Hors de sa route, la
   feuille (un portail) n'existe pas encore à ce moment. Comparer pose la marque si elle manque : pont provisoire,
   à retirer quand p1 la pose après l'ouverture. Au doigt, le « click » qui suit l'appui long tombe sur le voile et
   referme la feuille : Comparer avale ce seul click. `useFiche` (p1) a le même défaut.
4. **p4, Dryhopper** (vu sur `07-comparer-placer-nelson-sauvin.png`) : « mesuré linalol 38 µg/L (McCabe 2023) »
   s'affiche pour Nelson Sauvin. C'est la valeur d'Idaho 7 dans E03 (L14).
5. **Socle, cadre** : un liseré paille encadre le contenu de l'outil sur les captures : le focus-visible du `main`
   de PageShell.

## Après le socle corrigé

Le pilote a corrigé le socle (Ma bière n'est plus montée sous un outil ; `pin?: string` dans la route comparer ; plus d'anneau de focus) et retiré le contrôle des extras de Comparer (raison dans MISSION ; GATES renumérotés, 16 critères). Comparer lit maintenant `route.pin` (`useNavigation()`) au lieu de l'adresse ; ouvrir la fiche repousse la même route, pin compris. Les ponts provisoires de la fiche restent tant que p1 ne les a pas corrigés.

Sorties rejouées le 23.10, sur `prototypes/houblons-v4/maquettes/parcours-p3` reconstruite :
- G1 : CONSTRUIT OK (8 pages) ; G2 : TYPES OK ;
- G3 : COMMUN OK ; G4 : MOTS OK (79 mots) ; G5 : UNE-QUESTION OK (1 groupe libre : houblon) ;
- G12 : REPRISE OK (23 repris, 3 en contexte, 5 en pont, 6 écartés) ;
- G13 : ETAPE OK (comparer) ; G14 : PONTS OK (19 gestes, recalcul médian 1,0 ms).
- Épinglé : `#/comparer?h=cascade,idaho-7,galaxy&pin=nugget` met Nugget en colonne 1, marqué ⌖ ; appui long sur Cascade puis retour : la fiche se ferme, la route garde `pin=nugget`. Capture ouverte : `captures/p3-pin-390.png` (sans liseré de focus).
- Les sections plus haut (G4, G5, G11 rouges) datent d'avant la correction du socle.
- Correction de la supervision (contrôle D80 adapté au parcours) : le nom en tête de colonne porte désormais
  `data-houblon` = clé du moteur (`beermaverick-…`), comme Ma bière et Suggérer. Le nom reste le texte affiché.
  Deux exceptions, chacune pour un contrôle :
  - `data-houblon-compare="<nom>"`, sinon STANDARD S1 confondrait la clé de la tête et le nom de la série du
    radar ;
  - la barre « autres » garde `data-houblon="<nom>"`, la convention de D100.

  `jeu.mjs` vise Galaxy par sa clé. Sorties rejouées : G1 CONSTRUIT OK (9 pages), G2 TYPES OK, G3 COMMUN OK
  (fiche OK, standard OK), G4 MOTS OK, G5 UNE-QUESTION OK, G7 ALPHA OK, G12 REPRISE OK, G13 ETAPE OK (comparer),
  G14 PONTS OK (19 gestes, recalcul médian 1,0 ms).

## Règle n° 1

Les 12 éléments de r6a (inventaire-comparer.json) portent leur data-element, posé sur ce qui était déjà à l'écran. Le dessin ne change pas : le titre du cadre est marqué par un effet de l'écran, sur son propre h1. Leurs 12 lignes « repris — où » sont dans « ## Reprise » de la NOTE. Sorties, après reconstruction dans la sortie : G1 CONSTRUIT OK (9 pages) ; G2 TYPES OK ; G3 COMMUN OK ; G4 MOTS OK ; G12 REPRISE OK (35 repris, 3 en contexte, 5 en pont, 6 écartés) avec --inventaire=inventaire-comparer.json ; G13 ETAPE OK (comparer) ; G14 PONTS OK (19 gestes, recalcul médian 1,0 ms) ; G17 CHOIX OK (1 écran(s) conforme(s) à son choix ; 0 ouvert(s)).

## Prédiction

« C'est bien r6a, en vrai » : il reconnaîtra son écran, lira la ligne du haut sans la chercher, et ajoutera
Nelson Sauvin pour voir.

DÉCISION À PRENDRE : aucune (G11 tranchée par le pilote : contrôle écarté pour Comparer). Pour mémoire : `controle-autres-ajouts` ne s'applique pas à un Comparer en direct. Il faut l'adapter
(un cas vivant par `--donnees`) ou le déclarer « sans » pour p3, avec cette raison, comme `controle-moments` et
`controle-usage-intensite` pour p1 et p2.

CONNAISSANCE : Galaxy, baies : le moteur simule 18,9 sur 100, alors qu'aucune de ses fiches ne cite les baies ;
ta stout y est inconnue. La règle d'inconnu de r6a (« rien de simulé, ou non décrit et immobile ») doit mesurer
l'écart depuis 0 quand la bière est inconnue, sinon la cellule passe à tort en hachuré.

LEÇON PROPOSÉE : un contrôle de page lit tout le DOM : une coquille qui garde l'écran du dessous monté (inerte)
fausse les mots, le titre et les marqueurs de l'écran du dessus. Le socle ne monte qu'un écran par route, ou les
contrôles ignorent `[inert]` ; à vérifier sur la première page d'outil construite, avant de lancer les voies.

## Reprise D107

Comparer aux étapes, à la manière de x3b, avec une référence (23.10, nuit). La forme reste r6a (règle n° 1). Cette
section prime sur les consignes d'avant là où elles diffèrent : le moment fixé « après, 3 j » sort de la ligne de
contexte.

### Ce qui est fait
- **Aux étapes** (`src/ecrans/comparer/Etapes.tsx` ; `lireEtapes` et `houblonDeBase` dans `calcul.ts`). Sous les têtes de
  r6a, dans les mêmes colonnes, une rangée par étape : **60′, 10′, dry hop** (après 3 j, le moment du radar et des
  rangées). Chaque case montre :
  - le floral gagné en crans (« ~0,7 » ; le plus floral de l'étape en gras) ;
  - sa bande violette, qui part du **pointillé noir de ta stout** (la bière de base de x3b) et monte à l'étape de
    l'ajout ;
  - le **trait pointillé gris de ton Nugget** au même moment ;
  - la bande orangée du résineux gagné.
  Les étapes se lisent au repos, ensemble, sans curseur ni sélecteur. Le houblon reste le seul facteur libre
  (UNE-QUESTION OK, 1 groupe libre : houblon).
- **Référence : ton Nugget**, le houblon de base de la recette (son premier ajout à chaud). Il est pris aux mêmes étapes
  et à la même dose (4 g/L), en gris dans la colonne de gauche, avec son α (13 %, L04). Marqueur :
  `data-reference="houblon"`. Si Nugget est lui-même comparé (Substituer l'épingle), la référence devient la bière de
  base (`data-reference="biere"`).
- **Calcul en direct** : `comparer(recette, cles, { quand })` à 60′, 10′ et au dry hop, à chaque changement de houblons ou
  de recette (3 × 4 simulations, ~17 ms). Dans `jeu.mjs`, le geste « Etapes = moteur » vérifie les 12 cases contre le
  moteur.
- **IBU de chaque étape** : calculé par BrewingMath, l'outil de l'app. Il est dans l'aria-label de chaque case et dans
  « Chimie et vraies valeurs » : rangée IBU, avec 60′, 10′ et « dry hop à froid : ? » (jamais 0). Il n'est pas au
  premier écran, faute de place sous les 80 mots.
- **Ligne de contexte** : Stout 16D · « = 4 g/L » (le « = » de r6a, sans mot) · US-05. Le moment n'y est plus.
  Au-dessus des rangées : « Toutes les familles au dry hop, après 3 j, comme le radar ».
- **Marqueurs** (contrat D107, inchangé) :
  - `[data-houblon-compare]` porte maintenant la **clé** du moteur (avant : le nom) ;
  - `[data-etape][data-houblon]` est posé sur chaque nombre ;
  - `data-couleur` est retiré du nom de colonne (S1 de controle-standard). La couleur reste sur la série du radar,
    nommée ;
  - le jeu de Comparer vise la fiche par `[data-houblon-compare="beermaverick-galaxy"]`, car le `[data-houblon]` de
    Galaxy est aussi sur ses cases d'étape.
  **parcours-complet.mjs n'est pas modifié** : ses étapes de Comparer lisent `[role="radio"][data-col]`,
  `svg[data-radar] [data-serie]` et les ponts, qui n'ont pas changé.
- **Inventaire** (NOTE.md, `## Reprise`) :
  - `d107-etapes`, `d107-etat-au-moment` et `d107-reference` sont **repris** ;
  - `x3b-cuve-jour-apres-jour` passe d'« en pont » à **repris** : sa manière est dans « aux étapes », et ses jours de
    contact restent à Dryhopper.
  REPRISE OK (39 repris, 3 en contexte, 4 en pont, 6 écartés).
- **Place** :
  - la ligne « ~ simulé / Au style · Absolu » est posée sur les coins vides du radar ; la lentille, plus étroite, ne
    couvre plus le picto herbacé ;
  - le radar fait 300 px de large à l'ordinateur ;
  - à 390 px, les trois étapes tiennent au-dessus du dock (valeurs de 600 à 770 px) ; à 1280 px aussi.
- **D114** (« Beaucoup trop mis en avant ») : le panel OSU n'est plus au premier écran ni ouvert au repos.
  - Il s'ouvre d'**un toucher, « Panel OSU »** : troisième bouton sous le tableau, au rang de « Chimie et vraies
    valeurs » et d'« Égaler ».
  - Son titre intérieur passe de 14 px gras à 12 px demi-gras.
  - **Position du panel** : sous le tableau, après les rangées (vers 1 300 px du haut à 390), fermé.
  - Contrôles : ACQUIS OK (osu à un toucher) ; controle-comparer-etapes : « panel OSU : derrière un déclencheur, un
    toucher ».
- **D119** : je n'ai touché ni `Cadres.tsx` ni `Onglets.tsx`. Le CadreOutil de p2 pose déjà la question en h1, en tête
  du contenu, sous les onglets. Comparer ne la répète pas ; il pose la marque `r6a-question` sur le h1 dont le texte est
  la question. Le premier écran a perdu environ 40 px : les étapes restent visibles ensemble (ci-dessous).

### Sorties décisives (rejouées depuis la racine, 23.10, nuit)
- G1 CONSTRUIT OK (9 pages) · G2 TYPES OK · G3 COMMUN OK · G4 comparer 80 mots, MOTS OK
- G5 UNE-QUESTION OK (1 groupe libre : houblon) · G6 ACQUIS OK (4/4 : radar au repos ; chimie, osu, valeurs à un toucher)
- G7 ALPHA OK (4 voies, 4 avec leur α) · G8 RADAR-SERIES OK · G9 LISIBLE OK (17 simulées, 0 faute) · G10 SIMULATION OK
- G11 SANS-FAMILLE OK · G12 REPRISE OK (39 repris, 3 en contexte, 4 en pont, 6 écartés) · G13 ETAPE OK (comparer)
- G15 APP INTACTE OK · G17 CHOIX OK (1 écran conforme)
- **G18 COMPARER-ETAPES OK (3 houblons + référence beermaverick-nugget, étapes b10 b60 dryPost)**.
  - 390 × 844 : 12 valeurs visibles ensemble, écart vertical 163 / 844 px.
  - 1280 × 800 : 12 valeurs, 163 / 800 px.
- **G14 et G19 échouent**, pour une cause hors de Comparer :
  - G14 : « PONTS ECHEC : cible introuvable : [data-ecran="comparer"] » ;
  - G19 : « PARCOURS ECHEC (2) : geste 28 « abandon-fermer » : cible introuvable : [data-ecran="comparer"] (route
    #/ma-biere) ».
  - Cause : D118 (voie p2, `src/commun/Cadres.tsx`, en cours). La croix d'un outil ramène désormais à Ma bière, alors
    que `jouer-parcours.mjs --ponts` (« abandon-retour » : Dryhopper → croix → attend Comparer) et
    `parcours-complet.mjs` (geste 28) attendent encore le retour d'un écran.
  - Tous les gestes de Comparer passent avant (parcours-complet jusqu'au geste 27).
  - Ces deux scripts sont au socle (p0, p5) : à aligner sur D118 par leur voie, pas par moi.

### Captures ouvertes (regardées en image), côte à côte avec r6a et x3b
- `prototypes/houblons-v4/maquettes/parcours-p3/captures-d107/comparer-d107-390.png` (390 × 844, au repos).
  - À côté de `fils22-comparer/captures/r6a-premier-ecran.png`, on retrouve r6a : question, contexte, réponse ★,
    radar r2, têtes, Ta stout, « + », colonne retenue cerclée.
  - À côté de `fils21-choisir/captures/x3b-390.png` et `x3b-plans-390.png`, on retrouve le pointillé de la bière de
    base et la bande qui monte à l'étape. L'axe est tourné d'un quart (il va de 60′ au dry hop), sans les jours, le
    curseur ni la levure (« dur à lire »).
- `…/captures-d107/comparer-d107-1280.png` (1280 × 800) : les trois étapes entières au-dessus du dock.
- `…/captures-d107/comparer-d107-vraies-ibu.png` : « Chimie et vraies valeurs » ouvert, rangée IBU aux étapes.
- `…/captures-d107/comparer-d107-osu.png` : « Panel OSU » ouvert d'un toucher (D114).
- `…/captures-d107/comparer-d107-quatre.png` : 4 colonnes (Nelson Sauvin ajouté par « + »), étapes recalculées
  (~0 / ~0,3 / ~0,3).

### Nombres aux étapes
Moteur en direct ; 4 g/L, US-05 ; floral en crans gagnés sur ta stout ; IBU calculé.

| | floral 60′ | floral 10′ | floral dry hop | IBU 60′ | IBU 10′ | IBU dry hop |
|---|---|---|---|---|---|---|
| Idaho 7 | ~0,11 | ~0,73 | ~1,25 | ~102 (α plage 9,5–14,9) | ~37 | non modélisé (« ? ») |
| Cascade | ~0,07 | ~0,51 | ~0,89 | ~52 (α lot 6,5) | ~19 | non modélisé |
| Galaxy | ~0,13 | ~0,94 | ~0,85 | ~137 | ~50 | non modélisé |
| ton Nugget (réf.) | ~0,14 | ~0,96 | ~1,02 | ~104 | ~38 | non modélisé |

- Résineux gagné : de ~1,9 à ~2,2 au dry hop, contre ~0,6 à ~1,0 à 10′.
- Les valeurs au dry hop reprennent les nombres de r6a.
- Lecture : Galaxy est le plus floral à 10′, Idaho 7 au dry hop.
- Ton Nugget, à 4 g/L, ferait autant de floral que les autres à 10′. C'est le calcul du moteur, d'après le géraniol et
  le linalol de ses fiches ; à confronter à ce que le brasseur sait du Nugget (L14).

### Ce qui reste au brasseur
- Les étapes montrées sont 60′, 10′ et dry hop après 3 j. Le whirlpool et le dry hop actif sont simulés mais pas
  montrés, faute de place sous les 80 mots ; ici, whirlpool ≈ 10′ et actif ≈ après (écart < 0,05 cran). À lui de dire
  s'il les veut au premier écran, au prix d'une rangée.
- La référence est son Nugget (houblon de base) ; la bière de base est le pointillé. S'il préfère la bière de base en
  rangée, il suffit d'échanger la référence.

### Besoins hors de ma voie
- G14, G19 : `jouer-parcours.mjs --ponts` et `parcours-complet.mjs` sont à aligner sur D118 (croix → Ma bière).
- S4 de controle-standard (épaisseur de trait d'icône) : la croix de p2 (`pq-croix-icone`, 22 px) est la seule icône
  dont le trait diffère des autres. controle-commun reste OK sur Comparer ; à surveiller sur l'ensemble.
- Le contrat D107 refuse « ~+0,7 » (regex `^(~\s*)?-?\d`). Les cases d'étape disent donc « ~0,7 », sans « + », alors
  que les rangées disent « ~+0,9 ». La légende précise « crans gagnés ». Si le pilote veut le signe, il faut élargir la
  regex.

### Prédiction
« Là je vois 60′, 10′ et le dry hop d'un coup, avec mon Nugget à côté : c'est ce que je voulais. »

DÉCISION À PRENDRE : montrer le whirlpool et le dry hop actif au premier écran (une rangée de plus, au-delà de
80 mots) ou derrière un toucher. À poser au brasseur en variantes.
CONNAISSANCE : au moteur, pour la stout 16D à 4 g/L, le floral gagné est le même à 10′ et au whirlpool (écart
< 0,05 cran) ; seul l'IBU les sépare (~37 contre ~15 pour Idaho 7). Galaxy est plus floral à 10′ (~0,94) qu'au dry hop
(~0,85).
LEÇON PROPOSÉE : le dossier temporaire de session est partagé entre agents. Un script de capture au nom commun
(`cap.mjs`) y a été réécrit par un autre agent, puis a écrasé le `etat.html` d'une sortie de voie avec une capture PNG.
Chaque agent range ses fichiers temporaires dans un sous-dossier au nom de sa voie.
