# flu2b — cartes de famille, passe 2 de flu2

- Chaleur : **froide** (candidate n° 4 du conseil, `conseil-fl/verdict.md`, point 4 et règles communes). Le dossier `flu2/` (v0) est intact.
- Pages : `etat.html` (Nugget, l'état contrôlé par les GATES), `nelson.html` (Nelson Sauvin, même gabarit, même script). Générées avec les données de `prototypes/houblons-v4/data/pack-fiches.json`. Le lot de Nelson vient de `proto-data.json`.
- Captures (390 × 844, DPR 2) :
  - `captures/flu2b-nugget.png` et `captures/flu2b-nelson.png` (premiers écrans) ;
  - `captures/flu2b-page.png` (page entière, Nugget) ;
  - `captures/flu2b-nugget-fiches.png` et `captures/flu2b-nelson-fiches.png` (l'original, un toucher sur « fiches ») ;
  - `captures/flu6-nelson.png` : flu6 v0 telle quelle, rendue sur Nelson Sauvin par le même socle.

## Retouches et leur mesure
1. **Français au repos, l'original à un toucher.** Un sélecteur « français · fiches » (au repos : français) a été ajouté. « fiches » remplace chaque carte par les mots d'origine, avec leur fiche : BM pour Beer Maverick, HS pour Hopsteiner, HS US pour la boutique Hopsteiner US, YCH pour Yakima Chief. Mesure, sur `flu2b-nugget.png` : il ne reste aucun mot anglais au repos. Avant, on lisait « woody ×2, resinous » et « pineapple ». Sur `flu2b-nugget-fiches.png`, on lit « woody, resinous, resiny HS US · woody YCH » et « pineapple HS ».
2. **Table de traduction déclarée comme la nôtre.** La mention « notre traduction » est visible sous le sélecteur. La table complète est dans la légende « ? » : pineapple → ananas, woody → boisé, resinous → résineux, resiny → résineux, white wine → vin blanc, fruity → fruité, grape → raisin, gooseberry → groseille à maquereau. Les mots déjà en français sont seulement mis en minuscules. Un choix de la table est à valider : « resiny » est hors du lexique des familles de pack-fiches.json, et notre table le range dans Résineux. Les comptes n'en changent pas : la boutique US compte déjà dans Résineux, qui reste à 2/4. Nugget n'a donc plus qu'un mot hors des 12, gingembre.
3. **« en tête chez Hopsteiner » retiré (D115), une seule pastille « 1er ».**
   - Nugget : la pastille est sur Épicé, comme dans g1.
   - Nelson Sauvin : la pastille est sur vin blanc. C'est le premier mot des deux listes de descripteurs (Beer Maverick, « vin blanc » ; Hopsteiner, « White wine »).
   - Mesure : une seule pastille « 1er » sur chacune des deux captures.
4. **État Nelson : les mots hors des 12 en cartes pleines, au même rang qu'une famille.** Chaque mot hors des 12 est une carte sombre (#454545), marquée d'un rond pointillé, avec son nombre de fiches. Ces cartes sont rangées avec les familles, du plus dit au moins dit. Une clé « hors des 12 » figure en tête de la grille.
   - Recompte sur `flu2b-nelson.png` : vin blanc 2/2 (1er), fruité 2/2, groseille à maquereau 2/2 et raisin 2/2 viennent en tête, avant Agrumes 1/2 et Épicé 1/2. Suit sauvignon blanc 1/2.
   - Ces nombres sont des fiches, pas des mentions. Fruité est dit deux fois par Hopsteiner (« Fruité » et « fruity ») : il compte pour une fiche.
   - Aucune fiche : 10 familles. Le radar a 2 axes renseignés à 1/2.
5. **Tout tient dans 1,05 écran.** Mesure au rendu, depuis le haut de la page jusqu'au bas du pied (Styles › … Substituts ›) : Nugget 832 px, soit 0,99 écran ; Nelson 826 px, soit 0,98 écran. Pour y arriver :
   - le bloc « 7 familles sur 12… » a été retiré ;
   - le titre est devenu court ;
   - les cartes font 46 px au moins ;
   - les inconnues tiennent sur une ligne de pictos « ? » à la couleur de leur famille.
6. **Un seul α, celui de g1** (Hopsteiner 2025), avec le lot, dans la police du thème :
   - Nugget : « α 11–14 % lot 13 % ». La v0 portait aussi une autre plage, 9,5–16 % (Beer Maverick), dans l'aria-label de la jauge : elle est retirée.
   - Nelson : « α 12–14 % lot 9,6 % ». Le repère du lot est orangé, à gauche de la plage, parce que le lot est sous la plage de ses fiches.
   - La jauge est sur une échelle de 8 à 17 %.
   - La fiche courte reprend le même α.

## Nombres recomptés sur les captures (L14)
- **Nugget :**
  - α 11–14 %, lot 13 %. Demande : + Floral 2/4, − Résineux 2/4.
  - Contexte : 4 fiches, stout 16D.
  - Familles : Tropicaux 2/4 (ananas ×2, litchi, noix de coco : ananas BM et pineapple HS) ; Résineux 2/4 (boisé ×2 : woody HS US et YCH ; résineux : resinous et resiny, HS US) ; Floral 2/4 (géranium, floral) ; Herbacé 2/4 (herbacé ×2) ; Agrumes 1/4 ; Terreux 1/4 ; Épicé 1/4 (1er).
  - Hors des 12 : gingembre 1/4.
  - Aucune fiche : 5 familles. Étiquette « stout » sur Floral, Herbacé et Terreux.
  - Chaque nombre est conforme au pack.
- **Nelson Sauvin :**
  - α 12–14 %, lot 9,6 %. Demande : + Floral ?, − Résineux ? (non décrites, jamais 0).
  - Contexte : 2 fiches.
  - Familles : Agrumes 1/2 et Épicé 1/2 (Hopsteiner).
  - Hors des 12 : 5 mots, ceux du point 4.
  - Aucune fiche : 10 familles.
  - Chaque nombre est conforme au pack.

## Ce qui tient, ce qui casse
- Ce qui tient : sur Nelson, on lit en trois secondes un houblon de vin blanc, de raisin et de groseille, et non plus deux familles maigres. Sur Nugget, la carte de flu2 garde son code couleur, entièrement en français.
- Ce qui casse :
  - les cartes sombres hors des 12 se ressemblent toutes, sans couleur ni picto propre (greffe possible : un picto par mot, M09) ;
  - le radar de Nelson reste presque vide, et c'est la vérité des fiches ;
  - « résineux » rangé par notre table est à valider par lui.

## Contrôles (24.10, sur flu2b seule)
- G2 : `controle-commun.mjs … flu2b --page=etat.html --sans=mots` donne COMMUN OK. Le même contrôle sur `--page=nelson.html` donne aussi COMMUN OK.
- G3 : `controle-une-question.mjs … flu2b --page=etat.html` donne UNE-QUESTION OK.
  - Le seul groupe libre est le sélecteur « français · fiches », c'est-à-dire la façon de dire les arômes, ce qui est le facteur libre du lot.
  - Le contrôle ne connaît pas ce facteur et le lit « inconnu ». Il est balisé `data-libre="inconnu"`.
  - La ligne de contexte porte le houblon et la base (stout 16D).
  - Pour que la question soit le premier titre, le nom du houblon n'est plus un h1. Le rendu est le même.
- G4 : `mots-premier-ecran.mjs … flu2b --max=80 --page=etat.html --sans-donnees` compte 78 mots, d'où MOTS OK. Nelson compte 71 mots.

```
== G2 etat.html (Nugget)
mots       sauté (--sans)
couleurs   OK
au-style   OK
survol     OK
blocs      OK
contraste  OK
fiche      OK
standard   OK
trait      OK
legende    OK
parlant    OK
brutes     OK
COMMUN OK
== G3 etat.html
flu2b · titre « Que sent Nugget ? » · libres : inconnu · 2 contrôle(s) · contexte : houblon, base
UNE-QUESTION OK (1 groupe libre : inconnu)
== G4 etat.html
flu2b 78 mots (hors données)
MOTS OK
== G2 nelson.html
mots       sauté (--sans)
couleurs   OK
au-style   OK
survol     OK
blocs      OK
contraste  OK
fiche      OK
standard   OK
trait      OK
legende    OK
parlant    OK
brutes     OK
COMMUN OK
```
