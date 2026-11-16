# r2 · ra — da retouché : le champ en bas, au-dessus du clavier

Base : `da/proto.html`, reprise telle quelle (règle n° 1). Les retouches sont dans un bloc CSS « r2 · ra » ajouté en fin de
feuille, et dans des fonctions marquées `r2 · ra`. Rien de da n'est retiré, sauf ce que ses mots ou une donnée fausse
imposent (liste plus bas). Chaleur : froide (retouche d'une candidate qu'il préfère).

Ses mots : « da · un seul champ ; l'IA propose le critère le meilleur […] le champs text en bas ? SI non sur mobile le
clavier cache tout » ; « écartés visibles » ; « difficile à lire » (dc, da, 7,5) ; sur p5 : « ✓ choix » et « ↓ 600 CHF pas
fan », « Ca semble pas fini ».

## Fichiers (tous dans r2/ra)
- `proto.src.html` → `proto.html` par `node build.mjs` (fixture commune `../../fixture.json`, non modifiée).
- `capt.mjs` (copie de `calendrier/p8/capt.mjs`, via da ; `PAYSAGE=1` pour 844 × 390, noms nettoyés de `&` et `=`).
- `mesure.mjs` (CARNET-CLAV, CARNET-LIS, CARNET-MAIGRE, avec témoin da), `mesure.log`.
- `gestes.mjs` (copie de `da/gestes.mjs` : le toucher centre la cible avant de toucher, car le champ est fixe en bas), `gestes.log`.
- `planche.mjs` → `captures/planche-1…5.png` : da et ra côte à côte.

## Ce qui a changé, ligne par ligne
1. **Le champ, en bas.** Le champ unique de da (« Écrire, ou coller un lien… », 📷, 🎙, ↑) quitte le milieu du carnet et se
   fixe en bas, au-dessus de la barre. Le même champ sert partout où l'on écrit : la liste (« Une idée, un besoin… »),
   le carnet, « Pourquoi ? » (« Demander : pourquoi j'ai pris ce fournisseur ? ») et Comparer › Ajouter (une caractéristique).
2. **Au-dessus du clavier.** Le champ suit `visualViewport` : clavier ouvert, il monte juste au-dessus. Au-dessus du champ,
   un écho montre la dernière note et ce que l'IA en tire : « il faut minimiser l'oxygène · rangé : peut trancher entre
   Gravité et Isobarique », puis « En faire le critère qui oriente ? [Oui, critère] [Juste une note] ». La proposition du
   critère arrive donc sous ses yeux, pas sous le clavier. Toucher un bouton de l'écho ne ferme pas le clavier. Après
   l'envoi, le champ se vide et garde le clavier. `?clavier=300` simule un clavier de 300 px par le même code.
3. **Le + volant (b1r)** reste rond, noir, en bas à droite. Il se range au bout de la rangée du champ (52 px) : il ne
   couvre plus le fil ni les cartes. Il s'efface clavier ouvert. Dans Comparer, il s'efface en descendant et revient en
   remontant ; en paysage, il monte dans l'en-tête.
4. **Envoyer ↑** apparaît dès qu'il y a du texte, à la place de 📷 et 🎙 (champ vide : photo et voix). C'est le geste de
   la messagerie ; le champ garde ainsi la place de son texte.
5. **Comparer, écartés visibles en gris.** Un article cité comme écarté dans une décision, ou d'une façon écartée, garde sa
   ligne à son rang, en gris, avec « ✕ écarté » ; sa barre est grise. L'en-tête dit « 6 articles, 3 écartés en gris ».
6. **Noms entiers.** Plus de « Iso 4 pré-év. DE » : chaque tableau, la dominance, Choisir, « Pourquoi ? » et la veille
   donnent le nom lu (« Isobarique 4 becs pré-évacuation »), et le pays seulement pour départager deux mêmes machines.
   Dans les tableaux, le nom a sa ligne, la valeur est à droite, la barre (8 px) prend toute la largeur dessous.
7. **Paysage 844 × 390 : Comparer en matrice.** Les articles côte à côte (5 visibles, le 6ᵉ au glissé), vignette et nom
   entier en tête de colonne ; la colonne des caractéristiques reste fixe, critère en tête, liseré cuivre. Valeur en chiffres
   alignés, mini-barre, meilleur en vert ; choisi ✓ et liseré vert ; écartés en gris, à droite.
8. **Lisibilité par la typo, l'espace et le contraste.** Polices chargées (Source Sans 3 ; IBM Plex Mono en chiffres
   tabulaires pour prix et valeurs). Rien sous 14 px (da : 10,5). Les petites capitales espacées (« CHOISI · 14 NOV. »,
   « FAÇONS », « ÉCARTÉS ») passent en casse normale, 14 à 15 px gras. Corps 16 à 16,5 px, interlignage 1,4. Plus d'air :
   cartes, tuiles, fil (14 px entre entrées, 24 px entre jours). Vert et gris foncés (`--ok` #26695a, `--mut` #575757) ;
   en cave, pistes des barres plus claires.
9. **Dates lisibles.** Dans la marge du fil : le jour en gros (22 px), le mois dessous, à l'encre ; « auj. » en gros.
10. **Honnêteté du choix** (critique da, n° 1, bloquant). Plus de « moins adapté » écrit d'office. Chaque écarté reçoit une
    raison lue dans les tableaux (« débit 1 200 contre 1 800 m³/h »), marquée « exemple », gardée seulement si on la
    touche ; sinon « sans raison notée ».
11. **Pourquoi en propositions** (critique da, n° 9). Le pourquoi tiré du critère, vrai d'après les tableaux (« débit le
    plus haut »), est pré-rempli et sa pastille allumée. « SAV en Suisse », la baisse de la veille et « le moins cher »
    sont des pastilles à toucher : l'IA ne fait plus dire « SAV » à sa place. Pas de toucher de plus.
12. **Démo.** La rangée « à jouer » est précédée de « Démo », pour qu'elle ne passe pas pour des boutons de l'app (da, n° 3).

## Ce qui est resté (da tel quel)
Coque Finances › Matériel (À venir · Carnets · Réalisés) ; liste en cartes (titre entier, statut en 4 points, choix et
pourquoi ou « Ensuite : », vignettes, compte, point « −600 CHF », œil) ; en-tête du carnet (bandeau du choix et son
pourquoi, critère qui oriente) ; les 4 tuiles Façons, Articles, Comparer, Décisions ; le fil daté et rangé par l'IA ;
cartes d'article avec bascule Surveiller ; fiche article, courbe de veille, « Aussi chez… », « Vérifier la disponibilité » ;
feuille Façons ; Comparer en un tableau par caractéristique, critère encadré, barre longue = meilleur, dominance, « ? »,
puces × / + / Ajouter / Proposer / « à vous » ; « Pourquoi ? » en frise, remplacée barrée, questions à l'IA ; le + et son
menu. Le « −600 CHF » de da est gardé tel quel : rien n'a été pris de p5 (ni « ✓ choix », ni « ↓ 600 CHF », ni « En cours /
Choisis »). De p5 ne viennent que les corrections ponctuelles demandées : police chargée, noms entiers, dates lisibles.

## Retraits, avec leur raison (inventaire MAIGRE)
- « iso », « évac » : abréviations remplacées par le nom entier.
- Choisir : « à corriger librement » et « (toucher pour retirer) » : le pourquoi pré-rempli devient des pastilles ; le ×
  de chaque écarté se nomme « ne pas l'écarter ».
- Placeholder de la liste : « (ex. étiqueteuse) » passe dans la phrase d'aide au-dessus, faute de place à côté du +.

## Sorties décisives
- `node mesure.mjs` → **CLAV OK (ra passe, le témoin da échoue)**. À 390 × 844, clavier de 300 px (visible jusqu'à 544) :
  liste, carnet, note, lien, Pourquoi, Choisir et Ajouter ont le champ entre 489 et 529 px (Choisir : 212 à 257) et la
  dernière note juste au-dessus, sans défilement ni recouvrement. Le témoin da échoue : carnet, champ à 477-515, dernière
  note à 589-687, sous le clavier.
- **MAIGRE OK** sur 16 états : aucun mot ni geste de da absent de ra, hors les retraits justifiés plus haut.
- **CARNET-LIS (rapport)**, premier écran au repos, barre de l'app exclue : texte min 14 px partout (da : 10,5 à 12,5) ;
  contraste min 4,64:1 (« choisi », couleur de statut de da) à 5,98:1 (da : 4,23:1) ; mots 84 à 160 (da : 99 à 164).
  Plafond de 40 mots non tenu : la consigne interdit de retirer du contenu pour le tenir (CARNET-MAIGRE prime).
  Tailles : 5 à 9 par écran (da : 6 à 12).
- `node gestes.mjs` → **GESTES OK**, 21 vérifications (les mêmes que da), aucune erreur de page.
- `capt.mjs` → **CAPTURES OK**, sans requête en échec (polices chargées).

## Captures (r2/ra/captures, clair)
- 390 : `ra-repos-390`, `ra-carnet-390`, `ra-note-clavier-300-390`, `ra-lien-390`, `ra-comparer-390`, `ra-decisions-390`
  (Pourquoi) ; plus `ra-repos-clavier-300`, `ra-carnet-clavier-300`, `ra-decisions-clavier-300`, `ra-choisir`,
  `ra-choisir-clavier-300`, `ra-ajout-clavier-300`, `ra-frigo`, `ra-rate`, `ra-plus` (`-390.png`).
- 844 × 390 : `ra-comparer-844`, `ra-carac-844` (ventilation, 5 articles), `ra-frigo-844`.
- Côte à côte avec da : `planche-1` (liste, carnet), `planche-2` (Comparer, Pourquoi), `planche-3` (note, lien),
  `planche-4` (les quatre champs, clavier ouvert), `planche-5` (Choisir, Ajouter, frigo). Toutes ouvertes.

## Reste ouvert
- Paysage : l'en-tête de Comparer (légende sur 2 lignes) et la barre de l'app laissent 2 lignes de matrice au premier écran ;
  le reste au défilé.
- La légende écrite de Comparer et la dominance en prose du frigo (critique da, n° 4 et n° 5) sont gardées (CARNET-MAIGRE).
  Non traités, hors consigne : frise du frigo sans décision de façon (n° 2), tuiles en comptes (n° 6), tuile Comparer de
  l'évier (n° 7), appui long (n° 10), 1280 (n° 12). Captures cave non refaites (consigne : clair).
- Placeholder « Demander : pourquoi j'ai pris ce fournisseur ? » coupé au repos (texte de da gardé).

## Prédiction
« Là oui : j'écris en bas, je vois ce que l'IA en fait juste au-dessus du clavier, et ça se lit. »

DÉCISION À PRENDRE : aucune (l'emplacement du carnet et la forme de l'alerte restent ceux de da, choix ouverts du cadre).
CONNAISSANCE : un champ fixe en bas, suivi par `visualViewport`, avec un écho de la dernière note au-dessus, tient CARNET-CLAV
sur tous les écrans d'écriture sans toucher à la mise en page au-dessus.
LEÇON PROPOSÉE : aucune
