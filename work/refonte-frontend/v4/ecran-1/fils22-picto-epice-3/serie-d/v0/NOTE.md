# Picto « épicé », troisième tour, série D : des épices réelles, cadrées autrement

Quatre refus (lot 15, lot 21, planche r4, planche r4c), puis la parole du brasseur (22.10, nuit) : « Je veux un
forme qui représente vraiment ce que c'est, genre canellle vanille, ou clou de girofle ect... Ce que ça
représente vraiment épicier sur un houblon... ». La série D a donc quitté ses métaphores (fût, tajine, vin
chaud, fleur de lys, théière, gland, sachet : première passe, écartée) pour huit épices réelles, chacune
déclarée par `data-epice`, dessinées autrement qu'en r4 : entière, en coupe, en mélange, en gourmandise.
Toujours refusés : piment, poivre, mortier et pilon, saupoudreur ; aucun ustensile.

Régénérer : `node generer.mjs` (page `etat.html`), puis `node capturer.mjs` (`captures/planche-390.png`,
`tailles-390.png`, `cartes-390.png`, et `captures/travail/loupe.png` : vrais pixels à densité 1, ×4).

## Ce que montre chaque bloc
1. Le picto à 12, 16 et 24 px, puis à côté de la feuille (Herbacé), des brins (Végétal) et du sapin
   (Résineux), à 16 et à 12 px.
2. Trois vraies cartes de la base v4.9 (ligne Suggestions : usage, nom, α, stock, goût, ajouter ;
   objectifs cerclés, extras avec jauge) : **Saaz** (α 2–5 %, épicé « marqué » chez Hopsteiner, usage
   déduit de l'α), **Hallertau Mittelfrüh** (α 3–5,5 % : épicé, floral, agrumes, herbe coupée) et
   **Cascade** (α 4,5–9 % : pamplemousse, floral, épicé, agrumes, pin ; l'épicé y est seulement cité,
   donc atténué comme dans la base). α : Beer Maverick.

## Propositions

| Id | Nom | Épice (data-epice) | Genre | Ce qu'il dit à un brasseur | Risque de confusion |
| --- | --- | --- | --- | --- | --- |
| d1-cannelle | Cannelle, le rouleau | cannelle | entier | L'écorce roulée vue de côté, sa spire au bout : la douceur boisée des nobles | « pilule, interrupteur » à 12 px ; la spire ne se lit qu'à 24 px |
| d2-girofle | Clou de girofle | clou de girofle | entier | Le clou debout, bouton et calice : la note la plus « épicée » des nobles ; « clou » se nomme à 12 px | « épingle, punaise » |
| d3-badiane | Badiane | badiane | entier | L'anis étoilé à huit lobes arrondis (pas le polygone de r4) : anis et réglisse de Saaz ; se nomme à 16 px | « astérisque, éclat » à 12 px ; voisin lointain de la fleur (Floral) |
| d4-vanille | Gousse de vanille | vanille | entier | La gousse fendue, ses graines, sa pointe recourbée | « haricot, virgule » : sans sa fleur ni sa couleur, la vanille est une courbe |
| d5-muscade | Muscade coupée | muscade | coupe | La noix ouverte en deux, ses veines marbrées : chaleur douce, sans piquant | « ballon de basket, orange » à 12 px ; se lit à 24 px pour qui a coupé une muscade |
| d6-reglisse | Roue de réglisse | réglisse | gourmandise | La réglisse en roue, son brin qui dépasse : l'anis-réglisse des nobles | « escargot, spirale » ; la réglisse en bonbon plutôt qu'en racine |
| d7-melange | Épices de Noël | mélange | composé | Cannelle, badiane et clou ensemble : le mélange qu'on sent dans une bière d'hiver | Trois petits objets : mush à 12 px, lisible à 16 et 24 |
| d8-pain-epices | Pain d'épices | mélange | gourmandise | Le bonhomme pétri de cannelle, de clou et d'anis : le mot « épices » est dans l'objet ; « bonhomme » se nomme à 12 px | « personne, utilisateur » ; représente les épices par leur produit, pas par l'épice |

Quatre genres : entier (d1 à d4), coupe (d5), gourmandise (d6, d8), composé (d7). Huit `data-epice`,
sept épices différentes. Aucune signature commune ni refusée (D101 ter), aucun ustensile.

## Refus précédents, et ce que chacun m'a fait éviter
- Lot 15, « pico épice très étrange, plutôt vanille, canelle ? » : chaque dessin est nommé à voix haute sur
  la loupe avant d'entrer ; ce qui ne se nomme pas sort (voir « Essais écartés »).
- Lot 21, « épicé l'icone est toujours pas bon.. » (grains de poivre) : aucun poivre, aucun semis de cercles.
- Planche r4, « Aucun me convient... » (sept épices-objets brunes, toutes du même cadrage) : les épices
  reviennent parce qu'il les a redemandées, mais sous d'autres cadrages (rouleau de côté, clou debout,
  lobes arrondis, noix coupée, roue, mélange, gourmandise) ; pas d'ustensile (mortier, saupoudreur).
- Planche r4c, « que 3 variante […] quasiment identique » et « un piment n'a rien à voir la dedans » : huit
  objets différents, aucune brûlure ; l'épicé visé est le sien : clou, cannelle, anis, bois, douceur.
- Parole du 22.10 nuit : la première passe de cette série (métaphores : fût, tajine, vin chaud, lys, théière,
  gland, sachet) a été écartée entière ; seules des épices réelles restent, plus le pain d'épices qui en est fait.

## Essais écartés après la loupe (captures/travail/essais.png, essais2.png, essais3.png)
Cannelle en bâton diagonal avec sa spire (« trombone »), deux bâtons croisés (« X »), coupe en double spire
(« bretzel »), fagot de trois bâtons (« grille ») ; gingembre en rhizome (« nuage, patate ») ; cardamome et
anis vert (« grain de café ») ; coriandre à tige (« sucette ») ; muscade et râpe (« téléphone ») ; vanille en
gousse courte (« banane ») ; badiane à six lobes (moins vraie). Première passe : bouquet d'herbes pendu
(« pinceau, sapin »), fagot (« hachures »), brindille (« fourche »), nouet rond (« oignon »), pincée (illisible).

## Lecture (captures ouvertes)
Dans la ligne Saaz à 16 px, entre la feuille et les brins : le clou, la badiane et le bonhomme se nomment
d'un coup ; la roue et le mélange au second regard ; le rouleau de cannelle, la gousse et la muscade demandent
24 px. Pour la passe 2 : grossir la spire de la cannelle (la rendre lisible à 16 px), donner à la gousse de
vanille un cadrage qui la distingue d'un haricot (deux gousses liées, ou la gousse et sa fleur si Floral le
permet), et simplifier le mélange à deux éléments.
