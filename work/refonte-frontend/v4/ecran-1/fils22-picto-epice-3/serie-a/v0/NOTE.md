# Picto « épicé », série A, v0 : l'épice douce vue autrement

Voie r4d-a-douce (mission 2026-10-22-reprise-lot21), concepteur Opus. Huit propositions, quatre genres
(coupe ×2, objet ×4, emblème, usage). Toutes au trait : viewBox 24, trait `#7a4e3a`
de 2,571, bouts ronds, sans remplissage ni halo (D88).

Régénérer : `node generer.mjs` (écrit `etat.html`, non versionnée), puis `node capturer.mjs`
(`captures/planche-390.png`, `tailles-390.png`, `cartes-390.png`, densité 2). Les dessins vivent dans
`dessins.mjs`. Outil de travail : `captures/travail/loupe.mjs` rend chaque dessin en vrais pixels
(densité 1) à 12, 16 et 24 px à côté de la feuille et des brins, agrandi ×4 sans lissage.

## Ce que montre chaque bloc
1. En tête de page, les huit côte à côte à 24 px (a1 à a8), pour comparer d'un regard.
2. Le picto seul à 12, 16 et 24 px ; à droite, l'épreuve : feuille d'Herbacé, brins de Végétal, puis
   l'épicé, à 16 puis 12 px.
3. Trois vraies cartes de houblon, comme les propositions de la base (nom, α, rôle, puis les familles au
   trait à 16 px) : **Saaz** (l'épicé entre la feuille et les brins), **Cascade**, **Hallertau
   Mittelfrüh** (l'épicé en premier). α : Beer Maverick ; rôle de Cascade : Crosby Hops ; Saaz et
   Mittelfrüh : rôle déduit de l'α, marqué « ≈ ». Familles : tags Beer Maverick ; Saaz : profil du
   prototype (épicé « marqué », Hopsteiner).

## Propositions

| Id | Nom | Genre | Ce qu'il dit à un brasseur | Risque de confusion |
| --- | --- | --- | --- | --- |
| a1-cannelle-bout | Cannelle, vue de bout | coupe | Le bâton roulé vu par son bout : la spirale de l'écorce. Se nomme à 12 px | Spirale nue : « escargot » ou « roulé » pour qui ne pense pas épice |
| a2-vanille-fendue | Gousse de vanille fendue | objet | La gousse longue et fine, queue en crochet, pointe ouverte sur une graine | À 12 px, une gousse sans plus : « haricot » possible ; la fente ne se voit qu'à 16 px et plus |
| a3-pain-epices | Bonhomme de pain d'épices | emblème | Cannelle, muscade, gingembre réunis : l'épice douce que tout le monde nomme. Se nomme à 12 px | Dit « Noël, biscuit » ; sans ses boutons, « personne » |
| a4-gingembre | Racine de gingembre | objet | La « main » de gingembre, deux doigts noueux et leurs anneaux | À 12 px, une forme noueuse : « gland », « champignon » |
| a5-girofle | Clou de girofle | objet | Le clou penché : bouton rond, sépales en pointes, tige plus fine que la tête | « épingle » ou « clou » à 12 px ; à 24 px, le bouton frôle les sépales. Dessin neuf, pas celui de r4 |
| a6-sachet | Sachet d'épices pour la cuve | usage | La mousseline nouée qu'on plonge en fin d'ébullition ou au fermenteur : le geste du brasseur | « Sac », « bourse », « oignon » ; l'épice n'y est pas dessinée |
| a7-cardamome-coupe | Cardamome tranchée | coupe | La gousse coupée en travers, trois loges autour du cœur | Signe abstrait : « recyclage » pour qui n'a pas tranché de cardamome |
| a8-cannelle-batons | Bâtons de cannelle | objet | Deux bâtons couchés, la lèvre roulée de l'écorce au bout | À 12 px, deux « allumettes » ; seconde cannelle de la série, voulue (sa piste) |

Lecture à voix haute sur la capture à 12 px : a1 « cannelle » (spirale), a2 « gousse », a3 « pain
d'épices » sans hésiter ; a4, a6, a7 et a8 avec hésitation ; a5 (girofle) se nomme à 16 px, « clou » à 12 px. Les quatre plus
faibles (a4, a6, a7, a8) sont à durcir en passe 2, ou à remplacer.

Après la parole du brasseur (22.10, nuit : « Je veux un forme qui représente vraiment ce que c'est, genre
canellle vanille, ou clou de girofle ») et la levée du refus de l'idée girofle par le pilote, la noix de
muscade (lue « ballon ») a cédé sa place au clou de girofle. Debout, le clou se lisait « bonhomme aux bras
levés » ; vu d'en haut, « baguette magique » ; à tige large, « cornet de glace ». D'où le clou penché à
tige fine. Chaque bloc qui dessine une épice réelle porte `data-epice` (cannelle, vanille, gingembre,
girofle, cardamome).

## Écartés en route (dessinés, regardés, refusés par moi)
Cassia vue de bout à deux volutes (« tomate » à 12 px : les volutes se bouchent), spirale avec queue
(« escargot »), gousse en œil (« œil », « feuille »), gousse en barque (« bouche »), vanille en S
(« ver »), noix de muscade (« ballon »), muscade dans son macis (« arbre »), muscade coupée marbrée (« visage »), muscade et râpe
(« salière », puis « chope de bière » : interdit dans une app de brasserie), cardamome entière et fève
tonka (« grain de café », un autre arôme de bière), cannelle et vanille croisées (« sucette »).

## Refus précédents
- **Lot 15, « plutôt vanille, canelle ? »** : sa propre piste est reprise, mais redessinée. La cannelle
  n'est plus un cylindre en biais (la « gélule » de r4) : elle est vue de bout, en spirale (a1), ou en
  deux bâtons fins à lèvre roulée (a8). La vanille n'est plus un haricot bombé à deux graines : une gousse
  longue, fine, à crochet, fendue à la pointe (a2).
- **Lot 21, les grains de poivre** : aucun dessin fait de cercles seuls ; aucun poivre.
- **22.10, r4, « Aucun me convient... »** (sept épices-objets brunes, toutes du même genre) : deux coupes
  (a1, a7), un emblème (a3), un usage (a6) ; les objets restants cherchent le détail qui nomme (crochet,
  doigts annelés, lèvre roulée) plutôt qu'une silhouette de petit objet rond. Badiane, mortier, coriandre et
  saupoudreur ne reviennent pas ; le girofle revient, redessiné (a5 : penché, tige fine, couronne en
  pointes), après la levée de son refus par le pilote ; la râpe a été écartée parce qu'elle se lisait salière.
- **22.10, r4c, « un piment n'a rien à voir la dedans »** et « quasiment identique » : pas de piment ni
  de brûlure ; huit dessins de silhouettes différentes (contrôle : aucune signature commune, même à
  l'unité). L'épicé du houblon est doux (poivre doux, herbes sèches, bois) : la série reste dans les
  épices douces.
- **Critique Fable du 22.10, « fais voir à côté de la feuille et de l'herbe »** : chaque proposition est
  montrée contre la feuille et les brins, à 16 et à 12 px, et posée entre eux sur la carte de Saaz.
