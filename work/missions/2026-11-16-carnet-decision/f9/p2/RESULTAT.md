OK — carnet p2 : matrice Comparer, provenance ✦, raisons chiffrées, 15 tâches en 2 touchers

## Fichiers (tous dans f9/p2)
- Prototype : `proto.tpl.html` (source), `assemble.mjs` (y joint par split/join les photos, les symboles et le partage de p1), `proto.src.html`, `proto.html` (`node build.mjs`).
- Contrôles : `gestes.mjs`, `mesure.mjs` (lisibilité), `cibles.mjs` (Q4 et débordement).
- Le reste : `GESTES.md`, `capt.mjs` (copie de calendrier/p8), `planche.mjs`, `captures/` (38 états × clair et cave à 390, 7 à 1280).

## Sorties décisives
- `node gestes.mjs` : **GESTES OK**. T1 se fait sans toucher, T8, T9, T11 et T2b en 1, toutes les autres en 2. T5b (Changer de carnet) et T14b (critère proposé par la dictée) sont des gestes en plus. Aucune frappe, volant « Dans … puis Partout », aucun `type="number"`, Source Sans 3 chargée (`fonts.check` = true), console propre.
- `node mesure.mjs` : **MESURE OK**, 40 écrans sur 40, en clair et en cave.
  - Mots au repos : liste 35, carnet 40, articles 35, comparer 40, pourquoi 37, fiche 38, feuille du choix 40, ventilation 33, articles de ventilation 40, frigo 33, évier 31.
  - Tailles 14/16/24 seulement, rien sous 14 px, contraste minimal 6,15:1, aucune troncature « … ».
- `node cibles.mjs` : **CIBLES OK**. Aucune cible sous 44 px dans 14 états ; la zone de l'interrupteur est étendue à 48 px. Aucun débordement horizontal.

## Ce qui répond aux juges
- Comparer (A1, B6) : une matrice remplace la carte unique à ‹ ›. Une ligne par machine, une colonne par caractéristique, le vert marque le meneur partout. On voit qui gagne où en un coup d'œil.
  - La colonne touchée est chiffrée et trie les lignes ; l'inconnu « ? » va en bas, sans barre.
  - La légende dit le sens (« ppb · moins = mieux »). Perdants en gris, meneur seul en vert ; le choisi a sa coche et son nom en gras.
  - « Battu partout par Table 2 becs, sauf le prix » est calculé (Pareto) : la ligne est grisée au repos, la phrase s'affiche une fois dépliée.
  - À 1280, une colonne de carnets à gauche, et dans Comparer tous les tableaux côte à côte.
- Provenance (A2) : ✦ à 14 px sur chaque valeur lue par l'IA ; aucune marque sur le prix (offre) ni sur les mesures du brasseur. Pour la cadence de la semi-auto, j'ai suivi le journal (« non trouvée ») contre la fixture : « ? ».
- Raisons (A3) : toutes sortent des lignes du tableau.
  - Écartés : « −2’180 CHF, débit 1’500 », « −1’150 CHF, débit 1’200 », « −1’910 CHF, débit 1’100 ».
  - Façon : « débit 1’500 contre 1’800 m³/h ».
  - Choix : « débit 1’800 m³/h, le plus haut ».
  - Aucune « plus cher » qui contredirait la donnée.
- Pourquoi (A4, C5) : en titre le produit, puis « fournisseur · pays, date ». « Façon : Isobarique, 22 oct. › » mène à l'autre décision ; les dates muettes ont disparu.
- Choisir (A5, C8) : la ligne touchée se déplie avec Fiche et Choisir. Le choix est gardé d'emblée, sans confirmation, avec Annuler pendant 6 s. Les raisons proposées restent modifiables en direct. Plus d'appui long caché. T12 = 2 touchers, compté honnêtement.
- Changer (A6) : les carnets s'ouvrent en puces, un toucher déplace l'article, avec Annuler.
- Liste (A7, B7) : noms courts K5 (« Ventilation », « Frigo de garde »), sections « En cours » et « Choisis », une seule tuile par carnet, « Données d’exemple » en note grise.
- Critère (A8, C1) : ★ devant le pourquoi de la bannière ; la note « il faut minimiser l'oxygène » est marquée ★ dans le journal. Le critère se pose en un toucher (★ dans Caractéristiques) ou par la voix (« il faut… » → « Critère : … ? Oui »), avec un jalon au journal.
- Chiffres (B1) : plus de mono. Source Sans 3 en chiffres tabulaires, à 600 ; le séparateur ’ est collé.
- Noms (B2, C4) : noms entiers, avec fournisseur et pays en ligne 2. Les deux offres d'une même machine forment une seule ligne « 2 offres » dans Comparer. À égalité, le choisi passe en premier.
- Journal (B3, C6) : chaque jalon dit son objet (« Choisi chez Brassage Romandie », « Romandie : −600 CHF », « Isobarique plutôt que gravité »).
  - L'échéance passe au pied de la bannière ; le fil n'a plus de pointillé.
  - Les notes anciennes se replient en une rangée d'icônes, ouverte d'un toucher. Le plafond de 40 mots l'impose : écart voulu au n° 3 de B (« première ligne »).
- Dates (B4) : « 14 nov. », « 2 déc. » partout.
- Vert (B5) : il ne dit plus que « choisi » ou « meilleur ». La baisse est en encre sur une pastille vert pâle ; l'œil et l'interrupteur actifs sont en encre ; la courbe est en encre.
- Articles (B8) : « CHF » une seule fois en tête ; œil plein en encre si l'article est surveillé, sinon en gris à 3:1 ; écartés repliés.
- Segments (C3) : toujours à la même hauteur, juste sous le titre ; la bannière vit dans le contenu de Journal.
- Façons (C2) : une dictée qui nomme une façon l'ajoute, avec ✓ et ×, puis Annuler.
- Caractéristique libre (C7) : « Autre » (nom, unité, sens en puces).

## Écarts voulus
- Plus d'IBM Plex Mono, contrairement à DESIGN.md : le critique B a mesuré qu'il ne se chargeait pas et que le repli Courier rendait mal.
- Les tailles 14/16/24 suivent LISIBILITE, qui prime ici sur les 12–13 px de DESIGN.md.
- La raison d'un écarté omet la valeur du choisi (« débit 1’500 ») : elle figure juste au-dessus, et il faut tenir sous 40 mots.

## Captures (f9/p2/captures, `p2-<état>-390.png`, `-cave-390`, `-1280`)
- 390, clair et cave : repos, carnet, articles, comparer, comparer-ligne, comparer-cadence, pourquoi, pourquoi-facon, fiche, choisi-feuille, choisi-raisons, choisi-ventilation, carac.
- 390, ventilation : ventilation, ventilation-articles, ventilation-comparer, ventilation-ligne, ventilation-facon.
- 390, frigo et évier : frigo, frigo-comparer, frigo-pourquoi, fiche-frigo, evier, evier-critere.
- 390, liens et saisies : cal, lien, lien-charge, completer, nouveau, dial, dial-liste, partage-feuille, partage-ajoute, raccourci, journal-ouvert, facon, veille-on, dicter.
- 1280 : repos, carnet, articles, comparer, fiche, pourquoi, ventilation-comparer.
- Toutes ouvertes en planches et regardées. Défauts vus puis corrigés : en-têtes qui se chevauchaient (« AmbianteVolume »), « 2 / m³ » coupé, « 1 000 » non formaté, « 3 écartés › » au lieu de ⌄, badge ✓ absent de la feuille du choix.

## Prédiction
« Là je vois direct qui gagne quoi dans Comparer, et je retrouve pourquoi j'ai pris le revendeur suisse. Par contre, les petites icônes repliées du journal, je ne sais pas trop ce qu'il y a derrière. »

DÉCISION À PRENDRE : les choix ouverts restent à montrer en variantes (L24). D'abord la place du carnet (Finances › Matériel ou À venir). Puis le repli des notes anciennes : rangée d'icônes (ici) ou première ligne en gris, ce qui coûte environ 6 mots au repos.
CONNAISSANCE : un plafond de 40 mots au repos, nav comprise (6), laisse environ 24 mots au contenu d'un carnet. Une matrice dont seule la colonne touchée est chiffrée tient la vue d'ensemble de Comparer dans ce budget ; des barres par caractéristique ne le peuvent pas.
LEÇON PROPOSÉE : aucune
