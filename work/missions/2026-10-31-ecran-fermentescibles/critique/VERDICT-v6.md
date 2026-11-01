OK — verdicts v7 : s1 PRÊTE À MONTRER, s2 PRÊTE À MONTRER, s3 À CORRIGER

Critique neuf (D207), passe 7 de Malts/sucres. Base : son choix p6-b2 (D220, « Oui ça c'est bien, et maintenant la recherche,
comment elle s'affiche ? Dans la liste ? »), puis D221 (« Concentre toi sur la recherche et l'ouverture de la recherche avec les
stocks. Celles de la vrai app était pas trop mal »). Lu : PORTRAIT.md, VOIE.md, RESULTAT.md, les trois NOTE.md. Ouvertes en image
(L12) : les 9 captures demandées par variante (27), plus `v6/p6-b2/p6-b2-barre-pendant.png`, `p6-b2-couleur-apres.png`,
`choix-v6/img/recherche-mu.png`, `v7/s2/p7-s2-pils-pendant.png`. Les contrôles verts ne sont pas rejoués.

## Règle n° 1 : p6-b2 survit dans les trois
Au repos (`p7-s{1,2,3}-repos.png` contre `p6-b2-barre-pendant.png`) : en-tête, fil, bandeau, les trois lignes avec leur barre qui
porte la masse, « empâtage ⇄ » sans pilule, « 63 % du grain », champ « Grain ⇄ | Nom (et kg), Entrée », trois sacs, Rendement,
plateau Pilsner, Retour / Suivant, + flottant : identiques. Deux écarts, qu'il reconnaîtra : les sacs sont teintés (jaune, orange)
au lieu du trait gris, dit dans NOTE.md (la fixture donne l'EBC) ; s3 ajoute un chevron « ⌄ » à droite du champ (l'« Ouvrir la
liste » de l'app). Après l'ajout (`-munchner-apres`), la ligne Münchner prend le fond de sa teinte : c'est la règle de la base
(`.r4b-li[aria-selected] {background: var(--fond)}`), pas un ajout. Pas de D105.

Un défaut d'honnêteté commun aux trois, hérité de la fixture : le menu dit « Pilsner Malz · 3,5 EBC » et « Weizenmalz hell · 4
EBC », mais les lignes de la recette gardent « ? » et le plateau « 3 couleurs à renseigner ». Il le verra en s3 (les deux sont sur
la même capture) : « le stock connaît la couleur et la ligne non ??? ». À régler à la passe suivante : une ligne dont le stock
connaît l'EBC le prend (comme Münchner à l'ajout). Pas un rejet : la base le fait déjà, c'est la fixture qui le rend visible.

## s1 — sous le champ (tuiles) — PRÊTE À MONTRER
- Trois secondes : oui. Le champ touché, cinq tuiles sur deux colonnes : nom, pastille EBC colorée (6,5 / 15 / 4 / 25 / 120),
  « 12,5 kg en stock » ou « stock épuisé » en or. L'étoile sur Pale Ale. Le stock et l'épuisé se voient d'un coup d'œil.
- Deux malts proches : la pastille sépare Carapils 4 (paille), Carahell 25 (ambre), Caramünch II 120 (brun) mieux que le texte.
  C'est la meilleure idée de la passe pour « lequel ? ».
- « mu » → Münchner Malz puis Caramünch II, lettres surlignées, ↵ dessiné sur la première, aperçu « Münchner ↵ » dans le champ.
  « Munich » → Münchner seul (D220 tenu). « pils » → Pilsner en pleine largeur « déjà 5,0 kg · 18 kg en stock », puis Carapils.
  « Abbey Malt » → « Créer « Abbey Malt » (stock à zéro) », sous-ligne « grain : à l'empâtage ».
- Clavier : champ à y ≈ 643, tuiles jusqu'à y ≈ 990, clavier à 1085 : tout se voit. Le ticket n'est jamais masqué. À 1280,
  deux tuiles sous le champ, propre.
- Défauts signalés (pas de règle enfreinte) :
  1. le fournisseur manque (D221 le cite ; l'app le montre). Faute de place sur une tuile : au moins sur la tuile pleine largeur
     (« déjà ») et dans « Créer », ou en troisième ligne quand une seule colonne ;
  2. `p7-s1-mu-zoom.png` : le ↵ dessiné touche la pastille « 15 » (coin bas droit de la tuile) : le descendre de 4 px ou mettre
     la pastille à gauche du ↵ ;
  3. à l'ouverture, Pilsner, Weizen et Haferflocken (déjà là) n'apparaissent pas : cohérent, mais s'il cherche « ce que j'ai en
     stock » il ne voit pas ses 18 kg de Pilsner tant qu'il ne tape pas « pils ».
- Phrase prédite : « Pas mal, compact, les couleurs des cara c'est bien. Mais manque le fournisseur. »

## s2 — « Dans la liste » (lignes fantômes) — PRÊTE À MONTRER
- Trois secondes : oui. Le champ touché, trois fantômes tiretés sous Haferflocken, là où la ligne viendra : sac teinté, nom, puis
  « 12,5 kg en stock · 6,5 EBC · Weyermann » ; « + » à droite ; « + 2 au stock · tape pour affiner ». C'est la réponse littérale
  à « Dans la liste ? », et la plus informative des trois (stock, EBC, fournisseur sur chaque rangée, PORTRAIT § 1.2).
- Déjà dans la recette : « pils » éclaire la ligne Pilsner (fond crème, trait d'or, « déjà 5,0 kg ↵ » à la place de « 63 % du
  grain ») et ne propose qu'un fantôme Carapils. C'est le seul des trois où « déjà » renvoie physiquement à la ligne. Entrée y
  mène. Bien.
- « mu », « Munich », « Abbey » : comme s1, en fantômes ; ↵ dessiné sur le premier. À 1280, propre.
- Clavier : le champ descend de y ≈ 643 à y ≈ 958 à l'ouverture (315 px), et reste au-dessus du clavier (1085) avec trois lignes
  dans la recette. Avec 8 grains (`p7-s2-huit-repos.png` non demandée ici), le champ est bien plus bas : le capturer défile
  sûrement, mais la capture ne le montre pas, je ne devine pas (PORTRAIT § 3.5).
- Défauts signalés :
  1. le champ saute de 315 px quand on le touche : l'œil le perd une demi-seconde. Le concepteur a essayé de compenser et
     renoncé (Pilsner sous l'en-tête collant). Piste : n'ouvrir que deux fantômes (les épinglés) tant que rien n'est tapé, ou
     défiler pour garder le champ fixe seulement quand la première ligne reste visible ;
  2. « + 2 au stock · tape pour affiner » est une phrase d'aide. Elle n'est pas au repos (rien d'enfreint), mais « tape pour
     affiner » est le genre de mot qu'il appelle « information pour rien » : garder « + 2 au stock » seul ;
  3. pendant « pils », « 63 % du grain » disparaît derrière « déjà 5,0 kg ↵ » : transitoire, acceptable.
- Phrase prédite : « Ça c'est bien, je vois direct ce que j'ai et où ça arrive dans la liste. Le champ qui descend quand j'ouvre,
  moyen. »

## s3 — menu ancré (la liste de l'app, enrichie) — À CORRIGER
- Trois secondes : oui pour le menu lui-même : rangées de l'app, étoile, sac teinté, « stock épuisé » en or, « déjà 5,0 kg » en
  pilule. « mu », « Munich », « pils », « Abbey » : propres, la rangée active en gris avec ↵, lettres en gras, aperçu dans le champ.
  C'est « celle de la vrai app », et mieux. À 1280, menu sous le champ, propre.
- Correction 1 (`p7-s3-ouverture-zoom.png`, rangées Pilsner et Weizenmalz ; `p7-s3-pils-zoom.png`, rangée Pilsner) : textes
  tronqués « 3,5 EBC · Wey… », « 4 EBC · Weyer… », « 3,5 EBC … ». La pilule « déjà 5,0 kg » mange la ligne de détail. Règle :
  D151 (une liste coupée par « +n » / « … » ; « il doit tout y avoir ») et la question posée à cette voie (« Wey… »). Correction :
  sur une rangée « déjà », la pilule remplace le texte de stock (« déjà 5,0 kg · 18 kg en stock · 3,5 EBC · Weyermann » sur la
  ligne de détail, pilule supprimée), ou la pilule passe sous le nom, à droite, sur une troisième ligne de 12 px ; rien ne
  s'ellipse.
- Correction 2 (`p7-s3-ouverture-pendant.png`) : à l'ouverture, le menu s'ouvre au-dessus et couvre tout le ticket (les trois
  lignes et la moitié du bandeau « Grain 8,0 kg »). Il voit son stock mais ne voit plus sa recette, alors que 405 px sont libres
  sous le champ avant le clavier (643 → 1085). Règle : D212 (le plateau clair toujours visible, acquis de p6-b2) étendu au
  ticket, et « La recherche masque-t-elle le ticket ? » de cette voie. Correction : ouvrir dessous quand l'espace sous le champ
  suffit à 4 rangées au moins (≈ 260 px), plafonner la hauteur du menu à cet espace et défiler dedans ; au-dessus seulement
  quand il ne reste rien dessous.
- Défaut signalé : le pavé gris de ≈ 100 px sous le champ ouvert (la place des sacs laissée vide, « rien ne bouge dessous »).
  C'est un vide ; replier la zone ou y poser les sacs grisés.
- Phrase prédite : « Comme l'app, pas trop mal, mais ça me cache toute ma liste quand j'ouvre et le Wey… coupé ??? »

## En brasseur
Classement : **s2**, puis **s3**, puis **s1**.
- s2 d'abord : il a posé « Dans la liste ? » ; s2 y répond au mot, montre le plus (stock, EBC, fournisseur) et renvoie « déjà »
  à la vraie ligne. Son défaut (le saut du champ) est d'usage, pas d'idée : un cran au plus (PORTRAIT § 1.1).
- s3 ensuite : c'est son plancher « pas trop mal », enrichi ; mais le menu qui couvre le ticket et le « Wey… » sont deux choses
  qu'il nomme. Corrigée, elle remonte au niveau de s2.
- s1 : la plus nette et la plus compacte, et la pastille EBC colorée est la meilleure idée pour séparer deux cara ; mais elle en
  dit moins (pas de fournisseur) et il prend le dense utile.
Il verra les trois (L27, M13). Je prédis qu'il mélange : « s2, avec les couleurs de s1 ».

Greffes pour la passe suivante :
- la pastille EBC colorée de s1 → sur les rangées de s2 et s3, à la place de « 6,5 EBC » en texte ;
- « déjà » qui éclaire la ligne existante (s2) → s3 : Entrée sur une rangée « déjà » fait défiler jusqu'à la ligne et l'éclaire ;
- l'étoile en tête (s3, app) → déjà dans s1 et s2, garder ;
- la teinte du stock portée à la ligne de recette (les « ? » de Pilsner et Weizen) → les trois.

Phrase du brasseur, prédite, sur la passe : « s2 c'est bien, on voit le stock dans la liste. s3 comme l'app mais ça cache tout.
Garde les pastilles de couleur de s1. »

LEÇON PROPOSÉE : quand une passe enrichit la fixture (ici le stock reçoit l'EBC et le fournisseur), rejouer la donnée sur la base
avant de capturer : une valeur connue du menu et « ? » sur la ligne d'à côté est une contradiction qu'il voit sur la même capture.
