OK — da : fil de notes qui se range seul, 12 corrections faites, GESTES OK (21), PANEL OK

# Série A · da — Fil de notes qui se range seul

Chaleur : tiède. L'approche A vient du cadre ; la forme est la mienne.

## L'idée

Un carnet fonctionne comme un **cahier de labo**. On y dépose tout au fil de l'eau, sans structure : une phrase, un lien, une photo ou la voix. Le fil est daté dans la marge. Au-dessus du fil, l'IA range en quatre pastilles : **Façons**, **Articles**, **Comparer** et **Décisions**. Sous chaque note, elle écrit ce qu'elle en a tiré, par exemple « rangé : façon Gravité ».

En tête du carnet, toujours visible, le bandeau donne **le choix et son pourquoi**. Sans choix, il donne la prochaine étape. Dessous, une ligne rappelle le critère qui oriente.

Comparer et Décisions sont des vues **dérivées**, à un toucher. Il n'y a ni formulaire, ni étape, ni champ obligatoire. Le statut (idée, recherche, compare, choisi) est déduit, jamais saisi.

## Fichiers

- Prototype autonome, fixture incluse : `da/proto.html`. Il se rebâtit par `node da/build.mjs`, à partir de `da/proto.src.html` et de `../fixture.json`.
- Gestes au doigt, 390 tactile : `node da/gestes.mjs` → **GESTES OK**, 21 vérifications, aucune erreur de page, rejoué 3 fois.
- Captures : `node da/capt.mjs <états>` (copie adaptée de `calendrier/p8/capt.mjs`), 16 états en clair et en cave, soit 32 images → **CAPTURES OK**.
- Panel : `controle-panel.mjs da/captures/da-*-390.png` → 32 captures, remplissage médian 0,56, 6 sous 0,50 (des états cave assombris par le voile), ressemblance moyenne 0,54, 0 paire presque identique sur 496 → **PANEL OK**.

## Passe 2 : les 12 corrections de la critique

La fixture commune n'est pas modifiée. Pour ce qui lui manque, le prototype corrige sa propre copie, dans la fonction `corriger()`.

1. **Dominance honnête.** « Partout » ne s'écrit que si toutes les caractéristiques actives sont connues et départagent. Sinon, la phrase nomme les caractéristiques où l'article perd, celle où il gagne, les égalités, les inconnues (avec leur nombre et leur nom) et les caractéristiques « à lire ». L'encombrement passe en **surface au sol, en m², moins = mieux**. Résultat :
   - Embouteillage : plus aucune dominance affichée. Iso 2 becs gagne sur la surface et le prix, et son CO₂ est égal.
   - Frigo : « Vitrine occasion : moins bien que Chambre 2 m³ CH sur volume utile, fûts, porte de 80 cm ; mieux seulement sur prix. 3 inconnues (…). À lire : plage de température. »
   - Contrôle P2-1 dans les gestes.
2. **Frigo, critère classable.** La fixture a été mise à jour pendant la passe : elle porte « Température ambiante max (°C), plus = mieux » comme critère. Je la suis. Le tableau du critère vient en tête, avec le meilleur en vert (P2-2).
3. **Barre d'atout.** Une barre longue veut dire meilleur. En « moins = mieux », la largeur vaut meilleur ÷ valeur : 40 ppb donne une barre pleine, 220 ppb une barre de 18 %. La valeur brute reste à droite, et l'en-tête de Comparer le rappelle.
4. **Baisse visible.** Une pastille « −600 CHF depuis le 10 nov. » est posée près du prix, dans la fiche. La carte d'article du fil porte « −600 ». La fiche montre aussi une mini-courbe du prix suivi, à axe resserré sur l'écart réel, avec les valeurs et les dates de chaque passage. Une veille neuve dit « Premier passage aujourd'hui ».
5. **Fûts plausibles.** La fixture donne maintenant 30 et 40 fûts pour les chambres, et 8 et 6 pour les vitrines. Le prototype la suit, sans surcharge.
6. **Titre de la liste.** Il tient sur 2 lignes, et le statut passe dessous : « Ventilation de la salle de brassage » se lit en entier.
7. **« À revoir si… » générique.** L'exemple propre à l'embouteillage disparaît. L'exemple affiché est « le critère n'est plus tenu », ou « un prix baisse ailleurs » quand le carnet n'a pas de critère. Le pourquoi pré-rempli suit le critère de la catégorie, par exemple « débit le plus haut ; SAV en Suisse ».
8. **Premier plan sans jargon.** Le bandeau, la liste, les décisions du fil et la feuille Choisir donnent le nom lisible : « Isobarique 4 becs pré-évacuation · Revendeur Brassage Romandie (CH) ». Les noms courts restent dans les tableaux.
9. **Lien sans aperçu gardé.** Il apparaît en fin de chaque tableau, avec « ? » et un bouton Compléter. L'en-tête annonce « 5 articles (dont 1 sans aperçu) » (contrôle P2-9).
10. **Marque « à vous ».** Une caractéristique ajoutée par le brasseur porte un crayon et « à vous », dans la couleur production.
11. **Critère ventilation.** Il devient « zéro condensation au plafond ».
12. **Choisir depuis Comparer.** Chaque ligne de tableau se touche (34 px de haut) et ouvre la fiche de l'article, avec « Choisir celui-ci » (contrôle P2-12).

## Coque

L'écran vit dans Finances › Matériel, avec trois onglets : **À venir · Carnets · Réalisés**. Dans le code, À venir vit dans Finances (`UpgradeWorkspace`). Le cadre dit « Atelier › Matériel », mais la barre de l'app n'a pas d'onglet Atelier, d'où l'écart, signalé plus bas.

La barre du bas comprend Calendrier, et le + volant de b1r :
- dans la liste, il propose « Nouvelle idée » ;
- dans un carnet, il propose « Coller un lien », « Photo », « Note vocale », « Comparer » et « Écrire une note » ;
- partout, il propose les actions communes.

Depuis le calendrier, le prototype n'a qu'un toast.

## Gestes par besoin (état de capture entre crochets)

1. **B1 Partir d'une idée.** Dans la liste, on écrit « étiqueteuse » puis on touche ↑. Le carnet est créé au statut *idée*, et l'IA propose des caractéristiques, marquées « exemple » [repos, evier].
2. **B2 Noter au fil de l'eau.** Un champ « Écrire, ou coller un lien… », avec 📷 et 🎙 : un seul geste [note].
3. **B3 Plusieurs façons de faire.** Une phrase qui nomme une façon la range en pastille. « Chercher » demande à l'IA les façons courantes. La feuille Façons permet de retenir ou d'écarter, et garde le pourquoi [note, critere].
4. **B4 Critère qui oriente.** Écrire « il faut minimiser l'oxygène » fait apparaître « En faire le critère qui oriente ? », puis « Gravité semble moins adapté : l'écarter, en gardant pourquoi ? » [note, critere, lien].
5. **B5 Plusieurs produits et fournisseurs.** Chaque lien devient une carte d'article : fournisseur, pays, façon. La pastille Articles en donne le nombre et les vignettes [carnet].
6. **B6 Comparer les caractéristiques.** Un tableau par caractéristique, critère en tête, meilleur en vert, barre d'atout, « ? » en fin de liste. Toucher une ligne mène à la fiche, puis à « Choisir » [comparer, frigo, carac].
7. **B7 Caractéristiques dynamiques.** Puces × pour retirer, + pour remettre, Ajouter pour écrire la sienne, Proposer pour demander à l'IA. Le modèle n'a aucun gabarit par catégorie, et un repli générique couvre toute catégorie neuve [carac, frigo].
8. **B8 Garder le pourquoi.** Le bandeau du choix reste en tête. La feuille Choisir réunit le pourquoi en une ligne, les écartés et « à revoir si ». La vue « Pourquoi ? » est une frise : un choix remplacé y reste barré. Elle répond aussi à « Pourquoi ce fournisseur ? » [choisir, decisions, remplacee].
9. **B9 Vue sans détails.** Chaque carte de la liste donne le titre en entier, le statut en 4 points, puis le choix et son pourquoi, ou « Ensuite : … » [repos].
10. **B10 L'IA au besoin.** Boutons « Vérifier la disponibilité maintenant », « Chercher les « ? » », « Proposer » et « Redonner à l'IA ». Les réponses sont simulées et marquées « exemple » ; aucun appel réel [dispo].
11. **B11 Lien → objet.** Un lien collé montre un chargement, puis la carte : photo, nom, prix, fournisseur, pays, dispo. Un lien illisible devient « Lien sans aperçu », avec Compléter [lien, rate].
12. **B12 Veille.** Une bascule 👁 sur chaque carte et dans la fiche, passage tous les 3 jours. La fiche montre la pastille de baisse, la courbe et « Aussi chez … ». L'alerte reste discrète : un point vert « −600 CHF » sur la ligne du carnet, et une entrée Veille dans le fil [repos, article].
13. **B13 Générique.** Quatre carnets sont joués : embouteillage, frigo (avec une décision remplacée), ventilation et évier, plus une catégorie neuve, « étiqueteuse ». Aucune règle n'est propre à une catégorie : la dominance, la barre, « à revoir si » et le pourquoi pré-rempli viennent du critère et du sens de chaque caractéristique.

## Captures

Dans `da/captures/`, chaque état existe en clair (`da-<état>-390.png`) et en cave (`-cave-390.png`) : repos, carnet, note, critere, lien, rate, comparer, carac, frigo, article, dispo, choisir, decisions, remplacee, evier, plus. J'ai ouvert repos, frigo (clair et cave), article, carac, comparer en cave, et choisir.

## Prédiction

« Là je comprends : j'écris, je colle, ça se range ; le pourquoi est en haut, et je vois la baisse de prix. » Risque : il trouvera le fil long sur un carnet chargé.

DÉCISION À PRENDRE : où vit le carnet. Ici, c'est un onglet Carnets sous Finances › Matériel ; le cadre dit Atelier › Matériel, qui n'existe pas dans la barre. Les autres possibilités sont un onglet propre ou le +. Reste aussi à choisir la forme de l'alerte de veille. Ces deux points sont à montrer en variantes.
CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
