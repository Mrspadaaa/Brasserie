OK — Comparer r6a en direct, petites améliorations, D95 corrigé, Placer vers Dryhopper

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
