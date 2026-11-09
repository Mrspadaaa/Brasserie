OK — 4 maquettes statiques Levure 4/7 (l1 à l4), 5 à 6 cadres chacune

Fichiers : `p2/l1` à `p2/l4` (`etat.html`, `NOTE.md`, `<id>-haut.png`, `<id>-page.png`, `<id>-cadres.png`, `<id>-cN.png`) ;
outils `p2/l-outils/gen.mjs` (construit les quatre pages), `capturer.mjs` (cadres un à un et planche large), `mots.mjs` (diagnostic).

Sorties :
- `verifier-page.mjs … --min-images 0` : PAGE OK ×4.
- `mots-premier-ecran.mjs --max=72` : l1 72, l2 77, l3 72, l4 77 → MOTS ECHEC 2/4. L'excès de l2 et l4 vient des graduations du
  graphe de conduite (acquis, visible en entier au premier écran) ; hors données : 44, 49, 42, 47.
- `controle-panel.mjs` sur les 4 premiers cadres : remplissage médian 0,66, 0 sous 0,50 ; ressemblance 0,93 → PANEL ECHEC
  (en-tête, bandeau, champ s1, station Conduite : imposés à tous par le brief).
- `controle-choix.mjs --ecran=levure` : CHOIX OK (levure ouvert).
- Captures ouvertes : les quatre planches `<id>-cadres.png`, `l1-c1`, `l1-c4`, `l2-c1`, `l2-c5`, `l3-c1`, `l4-c1`, `l4-c5`.

Prédiction : « l1 c'est r3 en propre, la dose se voit enfin ; l4 j'aime voir mes 19 °C dans la bande de la levure. »

DÉCISION À PRENDRE : l2 et l4 dépassent 72 mots du seul fait des graduations du graphe acquis : compter le graphe comme données, ou
replier la station au premier écran ? Dans l4, la bande de la fiche s'arrête à J10 (garde à froid hors plage, sans alerte) : à valider.

CONNAISSANCE : `mots-premier-ecran.mjs` compte les textes d'un cadre voisin rogné par `overflow:hidden` (la boîte du texte ignore le
rognage) : un cadre décalé vers le haut placé juste après le premier ajoute ses mots au premier écran.

LEÇON PROPOSÉE : aucune.

## Retouches (critique p2, 09.11)
OK — l3b et l4b écrits dans `p2/l3b`, `p2/l4b` ; l3 et l4 restent intacts.
- l3b : FG et alcool sur une ligne en 20 px ; bloc de 255 px environ ; sachets séparés de la colonne par un filet ; au premier écran,
  le palier 1 et sa poignée ↕. Écarts : la colonne fait 124 px, et la température et la floculation sont en pleine largeur sous la
  dose (dans la colonne de droite, elles étaient coupées). PAGE OK ; 74 mots.
- l4b : bande en aplat 8 % sans hachures ; étiquettes 19 °C sur fond blanc. PAGE OK ; 77 mots.
- PANEL (l1, l2, l3b, l4b) : remplissage correct, ressemblance 0,93 → PANEL ECHEC (chrome imposé, inchangé).

## Passe 3 (09.11)
OK — l5a et l5b écrits dans `p2/l5a`, `p2/l5b` (l2 et l4b intacts), 7 cadres chacune, PAGE OK.
- l5a : effets en pastilles de famille ; palier fantôme « + » au bout, × sur le palier touché.
- l5b : effets en jauges 3 cases, seulement là où la source donne un ordre ; « + » sur chaque frontière.
- Données : TROUS-COMBLES.md (US-05, Abbaye, Verdant) et fiches du catalogue (températures, atténuation, dose) ; FG et sachets
  calculés pour OG 1,066 et 30 L. Le palier ajouté reste « ? °C · ? j », comme dans l'app.
- Mots : 104 et 98 (70 et 65 hors données), au-dessus de 72 : les effets demandés ajoutent une vingtaine de mots.
- DÉCISION À PRENDRE : couleurs des familles d'effets à aligner sur les familles d'arômes des houblons au port.
