OK — quatre mini maquettes r6a++ (rpa1 à rpa4) : étapes, cuve x3b, référence Nugget, carnet de roses

## Fichiers écrits (dans « Possède »)
- `work/refonte-frontend/v4/ecran-1/fils24-r6a-plus/rpa1/` à `rpa4/` : `etat.html`, `NOTE.md` (chaleur, greffes, ce qui
  tient, ce qui casse, sorties des contrôles).
- `work/refonte-frontend/v4/ecran-1/fils24-r6a-plus/captures/` : `rpa1.png` à `rpa4.png` (390 × 844, premier écran) ;
  états : `rpa1-radar-10.png`, `rpa1-fiche.png`, `rpa2-1er-dry-hop.png`, `rpa2-legende.png`, `rpa2-fiche-nugget.png`,
  `rpa3-ta-stout.png`, `rpa4-galaxy-10.png` ; côte à côte avec r6a et la base du soir : `rpa1-a-rpa4-cote-r6a.png`.
- Générateur et données hors dépôt, dans `os.tmpdir()/rpa/` (`kit.mjs`, `rpa1.mjs` à `rpa4.mjs`, et `donnees.json`,
  `cuve.json`, `nugget.json` tirés du moteur de la maquette jouable par vite-node). `git status` : rien d'autre de neuf hors
  de ces dossiers (`pistes-l5f.png` à la racine existait avant).

## Les quatre (une idée chacune ; r6a reste la base : 3 colonnes, 9 rangées, têtes, « lui seul »)
- rpa1, froide, « Les étapes, au propre » : la bande 60′ · 10′ · dry hop refaite en barres sur une échelle commune, ton
  Nugget en pointillé dans chaque barre ; un toucher pose l'étape sur les rangées ; Barres | Radar.
- rpa2, tiède, « Ma stout, dry hop après dry hop » : chaque case est une cuve en marches (ta stout → 1er dry hop → 2e dry
  hop → levure Pomona) ; une rangée « Pomona » ; Galaxy « bio ? ».
- rpa3, tiède, « Face à ton Nugget » : trois traits par case (60′, 10′, dry hop) qui partent de la référence, au choix
  « ton Nugget » ou « ta stout ».
- rpa4, chaude, « Le carnet de roses » : une rose par houblon et par étape (avec la levure), ta stout et ton Nugget
  dedans ; toucher une rose pose l'étape sur les rangées de r6a.

## Critères
- G1 `variantes.mjs rpa1 rpa2 rpa3 rpa4` : `VARIANTES-BIEN-4`.
- G2 `controle-pictos-trait.mjs … --page=etat.html` : `TRAIT OK`.
- Joués une fois en plus :
  - `controle-commun --sans=mots` : `COMMUN OK` ;
  - `controle-panel` : `PANEL OK`, avec un remplissage médian de 0,66 et une ressemblance de 0,83 ;
  - `controle-comparer-etapes` (D107, D114) : `COMPARER-ETAPES OK` pour les quatre, à 390 et à 1280 px. Il est joué sur une
    copie placée dans `comparer/etat.html`, avec 3 houblons et la référence Nugget.
- Mots au premier écran : rpa1 130, rpa2 125, rpa3 128, rpa4 105. À comparer : base du soir 114, r6a 79. MOTS est sauté
  en v0, comme le prévoit l'entonnoir.
- `controle-choix --ecran=comparer` : `CHOIX ECHEC`. Il demande l'inventaire de la maquette construite (53 éléments, 18
  états) ; c'est attendu pour une v0 statique, à porter en passe 2.

## Prédiction
« rpa2 c'est vraiment ça la cuve, rpa4 donne vraiment bien mais le résineux écrase tout, rpa3 intéressant mais on voit
pas assez les différences. »

DÉCISION À PRENDRE : pour la cuve (rpa2), le 2e dry hop est le même houblon (+2 g/L). Un 2e houblon différent ferait
varier deux facteurs : c'est la question de Dryhopper. À montrer en variante s'il le veut.

CONNAISSANCE : face à ton Nugget à 4 g/L au même moment, le moteur ne donne à Cascade, Idaho 7 et Galaxy aucun gain de
floral avant le dry hop (Idaho 7 ~+0,2 au dry hop seulement). Les trois sont ~0,2 à 0,3 cran moins résineux que lui. Le
dry hop pendant la fermentation avec Pomona fait gagner du floral et perdre du résineux : Idaho 7 passe de ~+1,25 à
~+1,5 en floral, et de ~+2 à ~+1,6 en résineux. À confronter à sa connaissance du Nugget (L14).

LEÇON PROPOSÉE : `controle-comparer-etapes` refuse un nombre signé (« ~+0,2 », « ~−0,1 ») : son motif n'admet que
« - » en ASCII. Un Comparer qui montre des écarts doit donc tricher (le signe passe en ::before). Adapter le motif aux
signes typographiques + et −.
