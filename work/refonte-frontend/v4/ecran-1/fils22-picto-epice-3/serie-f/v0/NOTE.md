# Épicé, série F (v0) : l'épice réelle, cadrée librement

Voie r4d-f-greffe, mission 2026-10-22-reprise-lot21. Chaleur : **chaude** pour les huit (forme libre). La chaleur
porte sur le cadrage : croisé, en sautoir, en poignée, en situation, en gros plan, en silhouette, ouverte, côte à côte.
La baseline est suivie sans écart : au trait, viewBox 24, trait 2,571, bouts ronds, ton `#7a4e3a`, sans halo ni
disque (D88), aucune mise à l'échelle (une seule épaisseur de trait).

Page : `etat.html` (`node generer.mjs`), dessins dans `dessins.mjs`, captures avec `node capturer.mjs`. Outils de
travail dans `captures/travail/` : `loupe.mjs` (vrais pixels ×4 et densité 3), `zoom.mjs` (une carte par
proposition en densité 3) et `essais.mjs` (les quelque quarante dessins essayés).

## Propositions

Chaque épice est déclarée par `data-epice`. Dans le tableau, « se nomme à » donne la plus petite taille où je nomme
l'épice à voix haute sans hésiter, sur la loupe et sur la carte en densité 3.

| id | épice | genre | ce qu'elle dit | se nomme à | risque |
|---|---|---|---|---|---|
| f1-croises | mélange (cannelle et girofle) | croisé | les deux épices nommées, croisées en bouquet | 24 px | à 12 et 16 px, croix chargée |
| f2-clous-croises | girofle | emblème | deux clous en sautoir, croisés bas, boutons en haut | 16 px | « outils croisés » ; même croix que f1, n'en garder qu'une |
| f3-poignee | girofle | tas | trois clous en éventail, la poignée pour la cuve | 24 px | à 16 px, « fleur de lys » ou « coquille » |
| f4-cuve | girofle | en situation | un clou tombe sur la surface du moût | 12 px | la vague double la hauteur ; « eau » seule possible |
| f5-bout-roule | cannelle | gros plan | le bout roulé en spirale vient vers soi, le tube sort du cadre | 16 px | « rouleau », « épingle » à 12 px |
| f6-crosse | vanille | silhouette | la gousse entière d'un coin à l'autre, sa crosse | 24 px | « plume », « haricot » : sans le noir, seule la longueur la dit |
| f7-ouverte | vanille | gousse ouverte | la gousse fendue, la pâte de graines au milieu | 24 px | « feuille » ou « graine » : nervure proche de la feuille d'Herbacé |
| f8-cote-a-cote | mélange (vanille et girofle) | paire | la gousse et le clou côte à côte, une nature morte | 16 px | à 12 px, la gousse devient un trait |

Trouvaille réutilisable : **le bouton du clou presque plein** (cercle de rayon 1,7 sous un trait de 2,571). Avec un
bouton en anneau (r4, série A), le clou se lit « clé » ou « épingle ». Plein, le bouton sur sa couronne et sa tige
effilée se lit clou de girofle dès 16 px (f4, f8). Les croisements passent par un masque posé hors du symbole :
l'objet de derrière s'interrompt sous celui de devant.

Lecture à 12 px, honnête : seuls f4 (et f8, à demi) se nomment. f2 et f5 se nomment à 16 px ; f1, f3, f6 et f7 à
24 px seulement. Pour la passe 2, il faudra d'abord simplifier les compositions à deux ou trois objets.

## Refus précédents

- **Poivre et piment** (lots 15 et 21, r4c) : aucun grain rond, aucun piment. Le seul dessin qui contient trois
  cercles (f3) a aussi six autres formes.
- **r4, sept épices-objets brunes, « Aucun me convient... »** : leur cannelle (un tube et une ellipse) et leur
  girofle (un bouton en anneau, des sépales en bras levés) étaient mal dessinés. Ici la cannelle est roulée en
  spirale, sans ellipse, et le girofle a un bouton plein et une couronne serrée. Aucune signature ne reprend r4,
  r4c ou la planche du poivre (D101 ter, contrôle vert).
- **Série A** (cannelle vue de bout, vanille fendue à la pointe, girofle debout) : même épice, autre cadrage.
  Jamais un objet seul tel quel ; toujours un cadrage (croisé, poignée, situation, gros plan cadré au ras, paire).
- **« Je veux une forme qui représente vraiment ce que c'est »** (D101 quater) : rien d'abstrait, ni signe, ni
  sensation, ni métaphore. Quatre épices réelles en tout : girofle, cannelle, vanille, et deux mélanges des trois
  qu'il a nommées.
- Essayés puis écartés, parce que je n'arrivais pas à les nommer sur la loupe : le clou vu de dessus (« étoile »,
  « shuriken »), la muscade coupée (« pizza », « bol »), la baie de genièvre (« ♀ »), le carvi en tas (« vers »,
  « montagne »), le fagot de cannelle noué (« grille », « barrière »), le trio clou, cannelle et vanille en éventail
  (il se confond avec les brins de Végétal), la rosace de clous (« trèfle »), le clou en gros plan de face
  (« bonhomme », « cornet de glace »). Tous sont dans `captures/travail/essais.mjs`.
