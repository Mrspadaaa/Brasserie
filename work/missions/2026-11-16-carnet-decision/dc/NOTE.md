# dc : le carnet en journal de décision (axe C, ADR), passe de correction du 16.11

**Idée.** Un carnet est le journal de ses choix. En tête, la décision en cours : quoi, chez qui, *pourquoi* en une ligne,
« 3 écartés › » sur une seule ligne de noms courts, puis « à revoir si ». Dessous, « ce qui tranche » (le critère), puis une
frise datée, du plus récent au plus ancien : décisions, critère posé, notes, lectures de l'IA, alertes de veille.
Une décision remplacée reste dans la frise sous forme d'une ligne barrée : « ~~Frigo vitrine pro~~ · moins cher · remplacée le
10 oct. par la n° 2 ». Les articles et la comparaison sont les preuves, à un toucher (onglets *Articles* et *Comparer*, et la
puce « Oxygène capté 40 ppb · 1er sur 6 › »). Geste roi : **Pourquoi ?** sur le choix, sur « N écartés › » ou sur un article,
qu'il soit choisi ou écarté.

- Chaleur : tiède (la forme de l'axe C).
- Coque : Atelier › Matériel › À venir (onglet Brassins actif).
- La ligne « Caisse fin de mois › » ouvre maintenant la feuille de caisse kyh1, marquée exemple. Le carnet ne montre jamais la caisse ; un choix y part par « Planifier l'achat » (kh1r).
- Le « + » est volant : « + Idée » sur la liste, « + Noter » dans un carnet.

Fichiers :
- `proto.html` est autonome et s'ouvre tel quel. `node dc/build.mjs` le produit depuis `proto.src.html` et `../fixture.json`.
- Paramètres : `?etat=<état>` ouvre un état pour les captures, `&theme=cave` passe au thème sombre.

## Corrections de la critique (12 demandées)

| # | Problème | Correction | Preuve (parcours) |
| --- | --- | --- | --- |
| 1 | Évier « Comparer 0 » | Les caractéristiques proposées comptent : « Comparer 5 » | `OK 1 Comparer 5` |
| 2 | Ventilation 4 contre 5 articles | « 4 articles + 1 lien à ranger » dans la liste, « Articles 4 + 1 lien » sur l'onglet | `OK 2 liste…`, `OK 2 onglet…` |
| 3 | Fûts du frigo faux (fixture) | 30 et 40 fûts ; volume utile de 1 600 et 2 000 L (vitrines : 560 et 480 L, 8 et 6 fûts) ; pourquoi « assez pour 6 fûts, stable à 2 °C en été… » | `OK 3 frigo…`, `OK 3 fûts 30 et 40` |
| 4 | Gaine sans mm, « — » | L'unité s'affiche aussi pour les « à lire » chiffrés (« 250 mm ») ; « — » se lit « sans gaine » (champ générique `vide`) | `OK 4 gaine…` |
| 5 | Évier : « — — », critère recopié, mauvais en-tête | Le pourquoi n'est plus pré-rempli par le critère. Une raison vide s'affiche « sans raison · l'écrire » et ouvre une feuille d'une ligne. En-tête : « Façon retenue : évier sur mesure · reste à trouver l'article [Coller un lien] ». Le dernier mot exclut l'idée, les façons et le critère | `OK 5` ×4 |
| 6 | Retour 32 px | 44 × 44, à la même place partout ; × des feuilles à 44 | `cibles >= 40` |
| 7 | Cibles 26 à 30 px | Boutons, puces, segments et × des tableaux à 40 px ; onglets à 44 ; case à cocher à 40 de cible ; bascule à 44 | `OK 6-7 / 7 cibles` (min 40) |
| 8 | Alerte jamais lue | Ouvrir le carnet la marque lue. Dans la liste, la ligne ambre disparaît et l'œil garde « 2 · −600 CHF » | `OK 8` ×2 |
| 9 | Trop de texte dans le Journal | Une ligne « 3 écartés › Isobarique 2 becs de table · Monobloc 6 becs · même article (DE) » qui ouvre « Pourquoi ? ». Une décision remplacée tient en deux lignes | captures journal, frigo |
| 10 | Caisse sans effet | Ouvre la feuille de caisse kyh1 (graphe et 3 achats, exemple) | `OK 10 caisse ouverte` |
| 11 | Critère du frigo non classable | Le froid propose « Température ambiante max » (plus = mieux, aide « classe climatique ») : 43, 38 et 30 °C, occasion « ? ». Le critère y est relié, avec un rang et une barre | `OK 11…` |
| 12 | « La tienne » incohérente | L'unité est masquée en oui / non. Le doublon est signalé (« Déjà là : Passe une porte de 80 cm »), et le bouton devient « Ajouter quand même » | `OK 12…` |

En plus (critique n° 14) : la décision en cours a son jalon compact dans la frise (« Produit et fournisseur · n° 2 · … · en
haut ↑ »). Une façon sans article ne montre plus « 0 article de cette façon ».

## Gestes par besoin

| Besoin | Geste dans le prototype |
| --- | --- |
| B1 idée en une ligne | « + Idée » → un champ → « Créer le carnet ». Rien d'autre n'est demandé. |
| B2 noter au fil de l'eau | Dans un carnet, « + Noter » : un mot, une phrase, un lien ou une photo. « Noter » la pose, datée, dans la frise. |
| B3 plusieurs façons | Une note peut se ranger « façon de faire » (facultatif). Les façons ouvertes forment la carte « En suspens », chacune avec « Je retiens ». La façon retenue devient une décision, les autres sont écartées. Ensuite, l'en-tête dit « Façon retenue : … · reste à trouver l'article ». |
| B4 critère qui oriente | Bande « Ce qui tranche », reliée à une caractéristique classable (★ en tête de Comparer) et posée en jalon « Critère » dans la frise. |
| B5 5 ou 6 produits, plusieurs lieux | Onglet *Articles* : cartes d'aperçu groupées par façon (photo, nom, fournisseur, pays, dispo, prix). Le compte est le même partout. |
| B6 comparer les caractéristiques | Onglet *Comparer* : un tableau par caractéristique, articles classés, le meilleur en vert, le choix pointé, « ? non trouvé » en bas. Marque de Pareto : « moins bien partout que …, sauf le prix ». |
| B7 dynamiques et génériques | Propositions de l'IA par catégorie (froid : volume, fûts, ambiante max, plage, conso, bruit, prix ; ventilation, évier, étiquetage, embouteillage ; un jeu par défaut sinon). × retire, ↺ remet, « + caractéristique », « La tienne » avec contrôle du doublon. Le rendu n'a aucun gabarit par besoin : unité, « vide » et aide sont des champs de la caractéristique. |
| B8 garder le pourquoi | « Je prends » ou « Je retiens » ouvre une feuille courte : pourquoi en une ligne, écartés avec leur raison, « à revoir si ». L'ancienne décision reste en ligne barrée. Une raison vide se complète plus tard (« l'écrire »). « Pourquoi ? » mène à « Demander au carnet », qui répond depuis le journal, avec les dates. |
| B9 vue sans détails d'abord | La liste donne, pour chaque carnet, le titre, le statut, « → choix · pays », « parce que … » ou « ? hotte ou extracteur » avec son dernier mot, les vignettes et l'œil de veille. Dans le carnet, la décision tient sur une carte, et les écartés sur une ligne. |
| B10 l'IA au besoin | Boutons pointillés bleus ✦, jamais obligatoires : « Dispo ? », « Relire avec l'IA », caractéristiques proposées, « Demander au carnet ». Toutes les réponses sont simulées et marquées « exemple ». |
| B11 un lien montre l'objet | Coller une URL dans « + Noter » affiche l'aperçu (image, nom, fournisseur, pays, dispo, prix, caractéristiques lues), puis « Ajouter aux articles ». Sans métadonnée, il reste une carte « Lien seul ». |
| B12 la veille | Une bascule « Surveiller » sur chaque article et dès l'aperçu, puis une ligne « tous les 3 j : stock ici et ailleurs, baisse de prix · prochain … ». L'alerte non lue apparaît en ligne ambre dans la liste et en point sur l'œil. Une fois lue, il ne reste que « −600 CHF » sur l'œil, la ligne sur l'article et le jalon de veille dans la frise. |
| B13 générique | Embouteillage (choisi), frigo (choisi, une décision remplacée), ventilation (en suspens, un lien seul, la consommation retirée), évier (idée, puis façon retenue) passent par les mêmes écrans. Le parcours crée en plus un « frigo de service ». |

## Contrôles (sorties recopiées)

- `node dc/parcours.mjs` joue chaque geste au doigt, à 390 px en mode tactile, puis les 12 corrections sur une page neuve :

  ```
  OK B7 propositions froid · OK B1 carnet créé au statut idée · OK B2 note au journal · OK B11 aperçu du lien
  OK B12 article surveillé · OK B10 dispo IA exemple · OK B8 pourquoi écarté · OK B8 ancienne décision barrée et lisible
  OK B7 caractéristique retirée · OK B7 remise · OK B4 critère en tête · OK B3 façon retenue, l autre écartée
  OK 5 en-tête façon retenue · OK 5 pas de critère recopié ni « — — » · OK 5 écartée sans raison · l écrire · OK 5 raison écrite gardée
  OK 8 alerte non lue visible · OK 6-7 cibles journal >= 40 · OK 7 cibles articles >= 40 · OK 7 cibles comparer >= 40
  OK 8 alerte lue : ligne retirée, −600 CHF sur l œil · OK 2 liste : 4 articles + 1 lien à ranger · OK 2 onglet : Articles 4 + 1 lien
  OK 4 gaine en mm et sans gaine · OK 1 Comparer 5 · OK 10 caisse ouverte · OK 3 frigo : assez pour 6 fûts
  OK 11 critère sur ambiante max, classé · OK 3 fûts 30 et 40 · OK 12 oui/non sans unité, doublon signalé · OK aucun type=number
  PARCOURS OK
  ```

- `node dc/capt.mjs <24 états>` : 48 images, `CAPTURES OK`, aucune erreur de page.
- Aucun appel réseau : la fixture est injectée, et les images sont dessinées en SVG.

## Captures (`dc/captures/`, clair et cave)

- États : repos, alerte, nouveau, journal, frise, noter, facon, lien, articles, dispo, comparer, carac, ventil, ventil-art, ventil-cmp, pourquoi, decider, decider-art, frigo, **frigo-cmp**, evier, **evier-suite**, **evier-pq**, **caisse**.
- Fins de parcours : `dc-parcours-nouveau`, `-remplacee` et `-evier`.
- Planches de contrôle : `_p1` à `_p6.png`.

## Limites

- **Fixture commune.** La correction n° 3 et le critère du frigo (n° 11) modifient `../fixture.json`, que lisent aussi da et db. Les valeurs y sont plus justes, mais la caractéristique `ambiante` est nouvelle. Le champ `vide` (« sans gaine ») est ajouté.
- **Photos (critique n° 13, hors des 12).** Les aperçus montrent encore un picto dessiné, pas une vraie og:image.
- **Lecture de lien et veille simulées.** En vrai, il faudra :
  - Open Graph et schema.org lus côté serveur ;
  - une fonction planifiée toutes les 72 h ;
  - une recherche en ligne payante.

  Ces trois points demandent son accord.
- **Questions ouvertes, non tranchées.** Où vit le carnet (ici sous À venir) et la forme de l'alerte.
