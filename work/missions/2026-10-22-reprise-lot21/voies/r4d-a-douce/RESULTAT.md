OK — 8 pictos « épicé » doux, 4 genres, sur cartes Saaz, Cascade, Mittelfrüh

## Fichiers écrits (tous dans Possède)
- `work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-a/v0/dessins.mjs` (les huit dessins)
- `…/serie-a/v0/generer.mjs` → `etat.html` (non versionnée) ; `…/serie-a/v0/capturer.mjs`
- `…/serie-a/v0/NOTE.md`
- `…/serie-a/v0/captures/planche-390.png`, `tailles-390.png`, `cartes-390.png`
- travail : `…/serie-a/v0/captures/travail/` (loupe.mjs, essais.mjs, haut.mjs, loupe.png, haut.png)
- ce `RESULTAT.md`

## Propositions

| Id | Nom | Genre | Ce qu'il dit à un brasseur | Risque de confusion |
| --- | --- | --- | --- | --- |
| a1-cannelle-bout | Cannelle, vue de bout | coupe | La spirale de l'écorce roulée ; se nomme à 12 px | « escargot », « roulé » |
| a2-vanille-fendue | Gousse de vanille fendue | objet | Gousse fine, queue en crochet, pointe ouverte sur une graine | « haricot » à 12 px ; la fente ne se voit qu'à 16 px et plus |
| a3-pain-epices | Bonhomme de pain d'épices | emblème | Cannelle, muscade, gingembre réunis ; se nomme à 12 px | « Noël, biscuit » ; « personne » |
| a4-gingembre | Racine de gingembre | objet | La « main », deux doigts noueux annelés | « gland », « champignon » à 12 px |
| a5-girofle | Clou de girofle | objet | Le clou penché : bouton rond, sépales en pointes, tige fine | « épingle », « clou » à 12 px ; dessin neuf, pas celui de r4 |
| a6-sachet | Sachet d'épices pour la cuve | usage | La mousseline nouée qu'on plonge en cuve | « sac », « bourse » |
| a7-cardamome-coupe | Cardamome tranchée | coupe | Trois loges autour du cœur | « recyclage » ; signe abstrait |
| a8-cannelle-batons | Bâtons de cannelle | objet | Deux bâtons fins, lèvre roulée au bout | « allumettes » à 12 px ; seconde cannelle (sa piste) |

Nommés à voix haute sur la capture à 12 px : a1, a2, a3 sans hésiter ; a5 « clou » (girofle net à 16 px) ;
a4, a6, a7, a8 avec hésitation. Sur demande du pilote (parole du brasseur, 22.10 nuit), la noix de muscade,
lue « ballon », a cédé sa place au clou de girofle. `data-epice` est posé sur les six blocs qui dessinent une
épice réelle (a3 bonhomme et a6 sachet n'en ont pas). Une vingtaine d'autres dessins ont été essayés puis écartés pour leur mauvaise lecture
(liste dans NOTE.md) : chope de bière, grain de café, sucette, œil, tomate, visage.

## Sorties décisives (lancées depuis la racine)
- G1 : `a8-cannelle-batons · 12/16/24 px · 0 cercle(s), 4 autre(s) forme(s) · 14 voisins` … `PLANCHE OK (8 variantes)`
- G2 : `v0 · 184 pictos de famille · 0 faute(s)` / `TRAIT OK`
- G3 : `PAGE OK (0 images chargées, 390 px, sans erreur)`
- G4 : `EXISTENT OK` (voir plus bas)
- G5 : `NOTE OK`
- G6 : `NOTE OK`
- G7 : `PISTE OK`

## Captures ouvertes et regardées
- `work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-a/v0/captures/planche-390.png` : sommaire des
  huit, puis chaque bloc ; rien sous 12 px, pas de défilement horizontal.
- `…/captures/tailles-390.png` : chaque proposition à 12, 16, 24 px, et contre la feuille et les brins.
  a1, a2, a3 restent distincts de la feuille à 12 px ; a2 est le plus mince.
- `…/captures/cartes-390.png` : les trois cartes par proposition. Sur Saaz, l'épicé posé entre la feuille
  et les brins ; la spirale (a1) et le bonhomme (a3) s'y distinguent le mieux.
- travail : `…/captures/travail/loupe.png` (vrais pixels ×4) et `haut.png` (haut de page, taille réelle).

## Prédiction du brasseur
« La cannelle en spirale, le clou de girofle et le bonhomme, là oui ; la vanille c'est mieux. Le reste, je
vois pas ce que c'est. »

DÉCISION À PRENDRE : aucune dans mon contrat. Note pour la passe 2 : je propose de garder a1, a2, a3 et a5,
puis de durcir ou remplacer a4, a6, a7 et a8. Deux cannelles (a1 et a8) font un choix voulu : c'est sa piste, et
leurs silhouettes ne se ressemblent pas. Si le pilote veut une seule épice par proposition, a8 sort le
premier.

CONNAISSANCE : à 12 px et avec un trait de 2,571, un contour ne garde un blanc visible que si ses deux
bords sont à 4,6 unités ou plus de distance (environ 1 px de blanc). Une gousse, un bâton ou une spirale
se dessinent donc à ce pas au moins, et une graine (un point) ne tient pas dans une fente plus étroite.
Les épices sans silhouette d'archétype (muscade, cardamome, tonka) retombent sur « grain de café »,
« ballon » ou « visage » ; seuls l'archétype (spirale, bonhomme) et la gousse longue à crochet se nomment.

LEÇON PROPOSÉE : rendre un picto en vrais pixels (densité 1, agrandi sans lissage) à côté de ses voisins
avant de le poser dans une planche. Sur les quelque 25 dessins de cette voie, les deux tiers se lisaient
juste à 96 px et faux à 12 px (chope, café, sucette ; pour le girofle : bonhomme aux bras levés, baguette magique, cornet de glace) ; seule la loupe en vrais pixels l'a montré.
