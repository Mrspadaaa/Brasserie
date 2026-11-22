OK — 22 problèmes, 5 bloquants

# Eau › 2. Sels, recette en ligne : critique sous le regard du brasseur (22.11)

Version : en ligne, tour 9, captures prises au téléphone par le brasseur (sha non fourni).
Persona : le brasseur au téléphone, en pleine conception de recette. Grille : PORTRAIT v2. Sa règle du jour :
« La seule règle: maximiser la grandeur du spidergraph (radargraph) et avoir sur un seul écran, sel, radargraph et acides ».

Mesures : capture 1280 × 2772, soit environ 3,28 px par px CSS. Écran utile entre la barre d'onglets et la barre
Retour/Suivant : environ 583 px CSS.

| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| 01-sels.jpg | clair | 390 | repos, Gypse 1,1 g et KCl 2,4 g, premier écran | 16 | 4 |
| 02-bas.jpg | clair | 390 | défilé, notice du bicarbonate ouverte | 7 | 1 |
| 03-table.jpg | clair | 390 | défilé jusqu'au bas, Gypse 1,40 g et KCl 1,80 g | 3 | 0 |

(Un problème peut toucher plusieurs captures : la liste ci-dessous en compte 22 en tout.)

Sa phrase prédite : « Le radar est minuscule au milieu d'un grand cadre vide, les sels prennent tout l'écran, et
l'acide est coupé en bas. C'est exactement ce que j'ai dit de ne pas faire. »

## Problèmes (B = bloquant, m = moyen, d = détail)

1. **B. Le radar est minuscule.** (01, cadre du haut.) Le disque mesure environ 120 px CSS sur 390, soit 31 % de la
   largeur. Il est posé dans un cadre de 369 × 160 px dont les deux tiers restent vides, parce que les étiquettes
   d'ions sont rejetées loin du disque. Sa seule règle n'est pas tenue (SPEC 22.11 ; D4, « pas assez dense » ; D55,
   espace vide). Remède : un disque pleine largeur, de 300 px environ, avec les étiquettes (ion, valeur, plage) sur
   le bord intérieur ou dans les coins du carré, et un cadre sans marge. Les budgets de 2 à 5 ci-dessous libèrent la
   place.
2. **B. L'échelle écrase le polygone.** (01, radar.) Les anneaux montent à 50, 100 et 150, alors que toutes les valeurs
   obtenues restent sous 49 ppm et toutes les plages du style sous 80. Le polygone et les secteurs verts tiennent dans
   le tiers central, environ 40 px. C'est le départ (HCO₃ de l'eau source, le tireté bleu qui file au bord) qui tire
   la borne vers le haut. Même agrandi, le radar resterait vide à 70 %. Remède : garder l'échelle racine et le
   multiple de 50 qu'il a acceptés (05.09), mais les calculer sur l'obtenu et les plages seulement (ici 100). Le départ
   qui dépasse se marque au bord par une flèche et sa valeur (« HCO₃ départ 120 → »).
3. **B. La grille des sels mange l'écran.** (01.) Il y a 9 cartes de 73 px de haut, chacune avec un interrupteur, un
   ⓘ, un −, une valeur et un +. L'ensemble fait 216 px, plus d'un tiers de l'écran, alors que 7 sels sur 9 sont
   à 0. Sa référence acceptée (cerveau/sources/moneaudebrassage, 05.09) est une grille 3 × 3 à 32 px de cible, avec des
   étiquettes à 11 px, et ses mots : « si tout est plus petit c'est beaucoup mieux ». Remède : des cellules de 36 px,
   nom et grammes. Le − et le + vont aux bords de la cellule ; l'appui long ouvre la saisie, la notice et
   l'exclusion. Gain : environ 100 px pour le radar.
4. **B. Les acides sont rognés, sans leur résultat.** (01, bas.) Le bloc Lactique (empâtage 2,5 mL, rinçage 5 mL) passe
   sous la barre Retour/Suivant : son bord inférieur est coupé et « HCO₃ 17,9 ppm » colle à la barre. Ce que l'acide
   produit n'est pas à côté : le pH estimé de 5,68 ± 0,15 pour une consigne de 5,4 est deux écrans plus bas, dans une
   phrase. Remède : une rangée de 44 px, « Lactique 80 % · empâtage 2,5 mL · rinçage 5 mL · pH ≈ 5,68 (visé 5,4) ·
   0,24 g/L », entièrement au-dessus de la barre.
5. **B. La notice du bicarbonate est fausse.** (02.) On lit : « Bicarbonate de soude — Remonte l'alcalinité… Le plus
   courant, et le moins cher. son goût commence à se percevoir vers 0,3 g par litre de bière — empâtage et rinçage
   CUMULÉS. » La deuxième partie est la notice de l'acide lactique (le seuil de 0,3 g/L cumulé, cerveau/metier/chimie-eau),
   collée sous un sel. On voit aussi une minuscule après le point et un mot en capitales. Remède : une notice propre au
   bicarbonate (il apporte du sodium, il se réserve aux bières foncées), puis une vérification des 9 notices de sels
   et des 3 notices d'acides.
6. **m. Le curseur SO₄ ⇄ Cl prend trop de place pour ce qu'il dit.** (01.) Il occupe 67 px pour un seul réglage. Les
   trois graduations n'ont pas de repère : on ne sait pas où est 1:1, ni ce que vaut le trait à droite du bouton.
   « Réglage 0,75 » et « Obtenu 0,74 » répètent presque le même chiffre. Remède : une ligne de 32 px, « SO₄:Cl 0,75 »,
   avec un curseur fin et le 1:1 marqué. L'obtenu ne s'affiche que s'il s'écarte de plus de 0,05.
7. **m. Une même couleur a deux sens.** (01.) Le bleu est le départ (tireté) sur le radar, et l'obtenu (point) sur le
   curseur. Il y a aussi deux verts, foncé sur HCO₃ et Na, pâle sur Cl, SO₄ et Ca, sans clé. La légende est sous le
   premier écran, en trois lignes de texte (haut de 02). Remède : une couleur par sens, et une clé d'une ligne en
   pictos dans le cadre du radar (trait plein : obtenu ; tireté : départ ; secteur : style).
8. **m. Des traits noirs sortent du polygone.** (01.) Ils partent vers les étiquettes HCO₃ et Na et se lisent comme des
   valeurs qui débordent : HCO₃ 12,5 semble toucher le bord. Remède : retirer ces traits de renvoi et poser l'étiquette
   au bout de son axe.
9. **m. Les petits chiffres sont illisibles.** (01.) Les anneaux « 50 · 100 · 150 » et les plages « 30–70 », « 0–60 »
   sont à environ 8 à 10 px, en gris pâle sur fond gris. Remède : 11 px au moins (son exception acceptée) et un
   contraste suffisant.
10. **m. Le potassium est invisible.** (01, 03.) Le KCl (2,4 g, puis 1,8 g) apporte du K : +23,6 ppm à 1,8 g, d'après le
    tableau. Ce K n'apparaît ni sur le radar ni sur la grille ; seul le tableau du bas le dit. Remède : une pastille
    « K 31 » sur le bord du radar dès qu'un sel apporte un ion hors des six axes.
11. **m. Le sens métier est à vérifier : du chlorure par KCl.** (01, 03.) Le KCl porte tout le chlorure alors que CaCl₂,
    MgCl₂ et NaCl sont à 0, et que le Ca (49) peut encore monter jusqu'à 80. Un brasseur prend du CaCl₂. La règle du
    solveur met le KCl en dernier (chimie-eau, « KCl en DERNIER »). Si la dose vient du solveur, c'est faux ; si le
    brasseur l'a tapée, il n'y a rien à dire.
12. **m. Neuf interrupteurs sans libellé.** (01.) On ne sait pas ce qu'ils coupent : le sel, ou le solveur ? Tous sont
    allumés, y compris la chaux, la craie et le bicarbonate sur une bière pâle. Neuf interrupteurs et neuf ⓘ, c'est le
    « cockpit » (D2). Remède : les sortir de la cellule (appui long : « ne pas proposer ») et griser la cellule exclue.
13. **m. Le ⓘ agit hors de la vue.** (01 vers 02.) Toucher Bicarb. (carte grisée) remplit « Comment les doses sont
    choisies » deux écrans plus bas, sans rien montrer sur place : un geste sans effet visible. Remède : une bulle
    d'une ligne, sur la cellule.
14. **m. Le « + » flottant mord le radar.** (01, 03.) Le gros rond noir chevauche le coin haut droit du cadre du radar
    et le coupe. Sur cette étape, il n'a pas d'usage évident. Remède : le retirer de l'étape Sels, ou le loger dans la
    barre du bas.
15. **m. Un mur de texte sous le premier écran.** (02.) On y trouve, dans l'ordre : la légende, « HCO₃ · moyenne du
    graphique », un titre seul (« Ions · plages atteintes »), le pH estimé, le rinçage, trois dépliants de trois
    styles différents (lien bleu, lien souligné, gris), la notice, l'interrupteur, le tableau et un paragraphe (D1, D3 :
    « trop de text ouvert de base »). Remède : ramener en chiffres sur le premier écran ce qui sert (pH, g/L d'acide),
    et replier le reste dans un seul « Détails ».
16. **m. « Tous les sels à l'empâtage · Recommandé » est enfoui.** (02.) Ce choix décide où vont les sels, mais il est
    en bas, après les explications, avec deux lignes de texte. Remède : une puce près de la grille, « tout à
    l'empâtage ⇄ réparti ».
17. **m. Le tableau « Total des additifs nécessaires » répète la grille et les acides.** (03.) La colonne Rinçage
    affiche « 0,00 g » partout quand tout va à l'empâtage. Les formats diffèrent : « 1,40 g » ici, « 1,1 » dans la
    grille. Remède : sortir le tableau de Sels ; il appartient au Récap. 7/7 et à la fiche de brassage.
18. **m. « HCO₃ · moyenne du graphique : 12,5 ppm » n'est pas une grandeur de brasseur.** (02.) C'est la moyenne d'une
    eau d'empâtage acidifiée (0) et d'une eau de rinçage (17,9). Le point HCO₃ du radar ne montre donc ni l'une ni
    l'autre. Remède : un HCO₃ d'empâtage sur le radar, puisque c'est lui qui fait le pH ; le rinçage se lit dans la
    rangée de l'acide.
19. **m. Quatre sorties de navigation.** (03.) On compte « Revoir l'eau et les volumes », « Retour à la fiche de
    brassage », « Retour » et « Suivant — Récapitulatif ». Le lien « fiche de brassage » est hors contexte : on crée
    une recette, pas un brassin. Remède : la barre du bas seule.
20. **m. Le style cible est absent de l'écran où l'on pèse.** (01.) Les plages sont là, mais ni le nom du style ni le
    moyen de le changer. Sa règle acceptée (05.09) dit : « Le style cible se règle là où l'on pèse ». Remède : le nom
    du style en titre du cadre radar, touchable.
21. **m. Les unités manquent.** (01.) Les cellules de sels affichent « 1,1 » et « 2,4 » sans « g ». La rangée d'acide dit
    « Lactique » sans « 80 % », que seul le tableau donne. Remède : « 1,1 g » dans la cellule, « Lactique 80 % » dans la
    rangée.
22. **d. Des états et des couleurs incohérents.** (01, 02.) Les valeurs d'acide sont en bleu, celles des sels en noir,
    pour la même chose : une saisie. « Comment les doses sont choisies » garde un chevron fermé alors que son contenu
    est ouvert dessous.

### Budget proposé pour 583 px CSS (sa règle, sans défiler)

| Élément | Hauteur |
|---|---|
| Segments Eau / Sels | 38 px |
| Radar, avec style, clé et pastille K, disque d'environ 300 px | 340 px |
| SO₄:Cl | 32 px |
| Sels 3 × 3 à 36 px | 116 px |
| Acides avec pH et g/L | 44 px |
| Marges | 13 px |

Le diamètre du disque passe d'environ 120 à 300 px, soit 2,5 fois plus grand, et sa surface 6 fois plus grande. Tout
le reste se replie dans « Détails ».

## Doutes (non comptés)

- Plusieurs états manquent : thème sombre, largeur 1280, geste sur une cellule de sel, curseur tiré, appui sur ⓘ,
  étape en paysage (844 × 340). Captures à faire avant le port : `DEMANDE EXECUTANT` au pilote.
- 01 (10:21) et 02-03 (10:20) ne montrent pas le même état : 3,5 g contre 3,2 g, Gypse 1,1 contre 1,40. Il a sans
  doute touché les sels entre les captures. L'origine du KCl (le solveur ou lui) reste à établir (point 11).
- Le sens des deux verts du radar (point 7) est peut-être « dans la plage » contre « hors plage » : rien à l'écran ne
  permet de le dire.
- Seuil du potassium : je n'ai pas de règle écrite chez lui ; le point 10 reste un défaut de visibilité, pas de dose.

## Écarts à sa maquette choisie

**Aucune maquette Sels choisie n'a été trouvée.**

- Aucune entrée Eau ni Sels dans `choix/ecrans.json`, `choix/ecrans-app.json` ou `choix/maquettes.json`.
- Le 19.11 (SPEC § « 19.11 — Recette, Eau et sels ») n'a pas apporté de mini maquette, seulement des correctifs :
  EAU-1 à EAU-3 (be201f85d) et EAU-6 à EAU-8 (e86249a9c). Aucune page de choix n'en est sortie.
- Les seules mini maquettes d'eau demandées sont celles de la vue de brassin (10.11), pas de la recette.

Ses mots « il y a eu plein de mini maquettes » ne trouvent donc pas d'appui dans le dépôt. Au pilote : chercher un
artefact claude.ai hors dépôt. À défaut, c'est le cas L24 : des mini maquettes Sels sous sa règle, pour qu'il choisisse.

À défaut de choix, voici les écarts à ce qu'il a validé pour cet écran :

- **Référence moneaudebrassage, deux feuilles, la toile au-dessus des sels.** C'est tenu.
- **« Tout est dérivé en direct ».** Non vérifiable sur des captures fixes.
- **La grille 3 × 3 à 32 px et 11 px, « si tout est plus petit c'est beaucoup mieux ».** Non tenue : les cellules
  font environ 73 px (point 3).
- **Le style se règle là où l'on pèse.** Absent (point 20).
- **L'échelle du radar en multiple de 50 sans sortie du disque.** Tenue, mais elle est gonflée par le départ, ce qui
  vide le disque (point 2).
- **« radar beaucoup plus grand »** (lot 6, Suggestions) **et sa règle du 22.11.** Non tenues (point 1).

LEÇON PROPOSÉE : une plainte « il y a eu plein de mini maquettes » sur un écran sans entrée au registre des choix
déclenche d'abord la recherche de la page de choix (artefacts compris), et son inscription dans ecrans-app.json avant
tout port. Un écran porté sans choix inscrit ne peut pas être comparé (règle n° 1, D105).
