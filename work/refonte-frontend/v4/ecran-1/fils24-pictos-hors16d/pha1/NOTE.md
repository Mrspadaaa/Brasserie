# pha1 — Une silhouette

- **Chaleur** : froide (série pha : au trait de la baseline, du plus sobre au plus dessiné).
- **Idée du jeu** : un objet par mot, son contour et un seul repère, au plus près de la géométrie des 12. « En plus » garde le ◇ que l’app met déjà aux mots hors des 12 familles : rien de neuf à apprendre.
- **Grammaire** : viewBox 24, trait 2.571, bouts ronds, à l’encre du texte (`currentColor` : noir sur la carte, blanc dans la ligne noire) ; ni halo, ni disque, ni hachure ; 32, 16 et 12 px sur la planche. Aucun symbole pris par une famille (la grappe est à l’encre et à six grains ; les Baies sont violettes, à trois).
- **Les mots** : les 15 objets du relevé (`donnees/mots-hors16d.json`) ; sauvignon blanc partage le verre, dank partage le cannabis. Fruité, doux, noble, net, délicat, neutre restent des mots, en clair. « Tabacco » (Target, Hopsteiner) prend « en plus », son mot au toucher.
- **Le mot précis** : dans la ligne noire « lui seul » : le picto de sa famille, en couleur, devant le mot (Citra : agrumes · pamplemousse ; Target : floral · sureau, herbacé · sauge, épicé · poivre). Tiré de `aromes[].mots` et du calcul « ses mots » de la maquette ; un mot qui redit sa famille (agrumes, floral, grass, earthy) n’en est pas un. Nelson Sauvin n’en a aucun (ses fiches disent « Agrumes » et « Épicé ») : sa carte n’en montre pas. Saaz en a un : citron (Hopsteiner, « lemon ») ; montré, car il est dans ses fiches.
- **La légende** : au toucher de la clé « lui seul » (soulignée en pointillé, comme les noms), dans la colonne Ta stout ; dans la fiche, derrière le « ? » de la grille, qui existait déjà. Ailleurs dans l’app : la fiche (bandeau « Lui seul »), Substituer (matrices hors 16D), Suggérer (cartes), et une fois dans Ma bière, au toucher de la première ligne noire.

## Où c’est posé
Dans les vraies cartes de la maquette (`prototypes/houblons-v4/maquettes/parcours`), figées après y avoir posé les pictos : Comparer (r6a) Nelson Sauvin, Citra, Target en version courte, puis textuelle avec la légende ouverte ; Comparer Galaxy face à Saaz (CZ) ; la fiche de Nelson Sauvin (flb5b) en version courte, puis textuelle avec la légende ouverte. La page joue la légende (toucher, Échap) et le nom d’un picto au toucher (bulle). La planche montre aussi huit houblons « en court », d’après toutes leurs fiches.

## Ce que la carte gagne, ce qu’elle perd en place
Côte à côte avec la maquette telle quelle : `captures/pha1-cote-carte.png`, `pha1-cote-galaxy-saaz.png`, `pha1-cote-fiche.png`.
- Tient : vin blanc, raisin (grappe à six grains, à l’encre, jamais au violet des Baies), cannabis, café (grain), miel (abeille), mojito (verre et paille), marmelade (pot), oignon, ◇. Les têtes de colonne gardent leur hauteur ; dans la fiche, la version courte tient le bandeau sur une ligne au lieu de deux.
- Casse : à 16 px, je nomme mal citronnelle (une tige, lue « poireau » ou « Y »), gingembre (deux gélules), crème (un pichet : « lait »), nectar (une goutte suspendue), curry (un mortier). En 3 colonnes, le mot précis se coupe (« pamp… ») : le reste passe à « +n », au toucher.

## Contrôles (sorties)
- TRAIT (G2) : `TRAIT OK` (pha1 à pha4, 0 faute ; les pictos du lot portent `data-famille="hors-16d"` pour que D88 les juge aussi).
- PANEL, sur les quatre planches : `4 captures · remplissage médian 0,61, 0 sous 0,50 · ressemblance moyenne 0,83 · paires presque identiques 0/6 (0 %)` → `PANEL OK`. Sur les captures de carte, il échoue (21 % de paires presque identiques) : c’est la même vraie carte, par contrat du brief.
- controle-commun --sans=mots :
```
mots       sauté (--sans)
couleurs   ECHEC
au-style   OK
survol     OK
blocs      OK
contraste  OK
fiche      ECHEC
standard   ECHEC
trait      OK
legende    OK
parlant    OK
brutes     OK
COMMUN ECHEC 3 contrôle(s)
```
  Écarts, avec leur raison : COULEURS (« trop retenu ») mesure la planche, à l’encre par la règle du brief (« les couleurs restent aux 12 familles ») ; FICHE (D25) demande un appui long qui ouvre la vraie fiche : les cartes sont figées, sans le code de l’app ; STANDARD S1 relève les couleurs de colonne de la maquette elle-même (#3d3d47 pour Saaz ici, pour Target ailleurs), pas un ajout du jeu.

## Passe 2 (24.10, soir, retour du critique)
- **Accepté par le critique** (en tête) : l’intégration ne bouge pas ; la greffe de la barre d’huile rend l’écart Galaxy/Saaz plus franc (barre longue contre barre courte, sous les lignes noires).
- **Honnêteté du compte (commun)** : un picto ne passe jamais dans « +n », qui ne compte que les mots sans picto. Nelson Sauvin a ses trois pictos : le verre (vin blanc, et sauvignon blanc sous le même verre), la grappe et la groseille. Face à Citra et Target, la groseille est aussi dite par Citra : elle reste là, en clair (atténuée), et n’est pas « lui seul ». En version textuelle et en 3 colonnes, les mots des pictos cèdent la place avant les pictos.
- **« herbe » retiré** : chez Saaz, « grass » redit Végétal, ce n’est pas un mot précis. Un mot qui redit sa famille n’apparaît plus du tout dans la ligne noire.
- **Jamais de pastille vide** : un houblon sans mot propre n’a plus de ligne noire « — ».
- **La barre d’huile (greffe de phz)** dans la carte Galaxy face à Saaz : « huile 1,8–5 » contre « huile 0,3–1 » mL/100 g (pack-fiches : Beer Maverick ; Saaz : Beer Maverick 0,4–1 et Hopsteiner 0,3–0,7), sur le modèle de la barre « autres ». Elle ajoute une ligne de 16 px à ces deux têtes. Absente de la carte Nelson Sauvin, Citra, Target : la Citra de la maquette n’a pas d’huile dans le pack.
- **Pictos repris** (liste « Par mot » du critique) : curry en marmite à deux anses (le plat, lisible) ; crème en brique à toit ; nectar en pichet de jus ; citronnelle en tige coupée en biseau, sa coupe ovale ; gingembre en rhizome de trois nœuds. À 16 px, la marmite, la brique et le pichet se nomment ; le biseau se lit « tige » ou « crayon », et le rhizome se lit encore « chaîne » : ces deux restent à revoir, ou passent au mot.
- **La v0 reste** : `v0-etat.html`, `v0-NOTE.md`, `captures/<jeu>-v0-*.png`.

Sorties rejouées après la passe : `jeux.mjs pha1 pha2 pha3 pha4` → `JEUX-BIEN-4` ; `controle-pictos-trait.mjs` → `TRAIT OK` ; PANEL des planches → `PANEL OK` ; controle-commun : les mêmes trois écarts (couleurs, fiche, standard S1), le reste OK.
- **Retouche avant de lui montrer (24.10, nuit)** : Citra porte un seul compte, « +4 », en courte comme en textuelle (ses cinq mots : pamplemousse, citron vert, passion, litchi, pêche ; « +n » = ses mots sans picto qu'on ne lit pas en entier) ; citronnelle et gingembre s'écrivent en mot seul, partout (cartes, fiche, planche), tant qu'aucun dessin ne se lit. Rejoué : JEUX-BIEN-4, TRAIT OK.
