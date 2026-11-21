# Chasse Stock : regard critique (STC, 21.11)

Version jugée : tag `en-ligne/2026-11-21-tour8` (5fb61c580), copie `git worktree add --detach` dans os.tmpdir(), build de test (`scripts/parcours/vite.parcours.config.mjs`), `?dev-local&finance-demo=parcours-chaines`.
Fixture : `fixtureChaines(aujourd'hui, { rayons, manques, garde, cuve })` complétée dans le banc par neuf articles « ZZ TEST » : son cas réel « Cryo Hops Citra 25g » (1 Pck, α 24,8 %, nom de facture), Nelson Sauvin à 0, blé, Chocolat, S-04 à 0, soude, acide peracétique, gants, étiquettes. Ni seedData, ni données réelles, ni Gemini.
Joué : 390×844 tactile (CDP touch) et 1280×800 souris, thèmes clair et cave. Onglets Articles (Étagère, Recompter, Ingrédients, Autres stocks), Courses, Fûts, Matériel et Houblons. Fiche d'un article : lecture, Corriger (−1), Seuil, « … », Modifier la fiche, « changer », Commander puis « Tout voir », Enregistrer, puis fiche rouverte. Une fiche d'Autres stocks (Bouteille 33 cl).
Captures ouvertes et regardées : `C:/Users/mrspa/AppData/Local/Temp/stc-out/` (tour 1), `…/stc-out/r2/`, `…/r3/` et `…/r4/` (tours 2 à 4). Je cite aussi ses deux captures de ce dossier (01, 02) : elles montrent la version en ligne avec ses vraies données.
Défauts connus, non recopiés : STOCK-ESPACE (onglet Houblons, bascule Étagère/Recompter, fiche longue, cartes vides), STOCK-ETAGERE-AUTRES, WX2-2 et WX2-12, WFX-3/4/5/8, WFA-1 à 4, CT4C-1, TL-42 (unités « Pck » et « Stk » à l'achat).
Boucle : quatre tours. Les tours 2, 3 et 4 ont chacun apporté des défauts neufs. Je me suis arrêté sur le budget, pas faute de défauts : la boucle n'est **pas sèche**.

## Combien et quels problèmes ?

**21 problèmes : 2 bloquants, 13 gênants, 6 mineurs.** Sept doutes à part, non comptés.

1. **STC-1, bloquant : « Commander » ne commande rien.**
   - Geste : fiche de Cryo Hops Citra, « Commander », à 390 et à 1280.
   - Attendu : l'article entre dans Courses, ou une quantité est demandée.
   - Constaté : la fiche se ferme et Courses s'ouvre, mais l'article n'y figure pas, ni au repos ni après « Tout voir ». Courses montre « 4 manquent » : Caramünch, Citra, US-05 et l'acide.
   - Mesure : le texte de Courses ne contient pas « Cryo » (`r2/log2`).
   - Captures : `r2/390-clair-28-commander.png`, `r2/390-clair-29-courses-tout.png`, `r2/1280-clair-29-courses-tout.png`.
2. **STC-2, bloquant : un houblon compté en paquets est « inconnu » partout, sauf dans sa fiche.**
   - Constaté : la fiche dit « 1 Pck en stock ». La ligne de l'étagère affiche « ? », plus « à compter » écrit deux fois. Recompter dit « quantité inconnue » et montre un champ « ? Pck ». La pastille « à compter 1 » le compte.
   - Sa capture 01 montre la même chose : la dernière ligne indique « α 24,8 % … à compter ».
   - Attendu : 1 Pck, soit 25 g, à sa place sur l'étagère.
   - Captures : `390-clair-09b-recherche.png`, `r2/390-clair-22-compter.png`, `390-clair-10-fiche-p0.png`.
3. **STC-3, gênant : il y a deux vues de modification pour la même fiche** (son « l'autre vue de modification »).
   - Le bloc « Fiche » contient Fournisseur · changer, Dernier prix et Entrée. La carte « Seuil » est à part. « Modifier la fiche » reprend Nom, Catégorie, Unité, Fournisseur et Caractéristiques techniques.
   - « changer » ne change rien sur place : il saute à « Modifier la fiche ». « … › Modifier la fiche » fait de même.
   - Un seul « Enregistrer » sert pour la correction, le seuil et la fiche.
   - Captures : `r3/1280-cave-35-changer.png`, `r2/390-clair-27-autre-modif.png`.
4. **STC-4, gênant : la même donnée est écrite plusieurs fois dans la fiche.**
   - Sur sa capture 02, « Brau- und Rauchshop GmbH » apparaît 6 fois : sous-titre, deux achats, Fiche › Fournisseur, Entrée, Modifier › Fournisseur.
   - L'α apparaît 3 fois : pastille, « Caractéristiques techniques · α 24,8 % », champ « Acide alpha ».
   - Le nom apparaît 3 fois : titre, champ Nom, « Sur la facture : … ».
5. **STC-5, gênant : le menu Fournisseur est coupé dans « Modifier la fiche ».**
   - Le menu fait la moitié de la largeur et la flèche couvre le texte : « Brau- und Rauchsho⌄p G » sur sa capture 02, « ZZ TEST Brau-Shop⌄ » à 1280 en cave. La moitié droite reste vide.
   - « Caractéristiques techniques » est un volet replié dans un volet. Le champ « Acide alpha » occupe toute la largeur pour 4 caractères.
6. **STC-6, gênant : la courbe « Ce qui a bougé » est confuse** (sa capture 02, et la nôtre après une correction).
   - L'axe porte « 27.04 · 27.04 · 14.11 » : une date répétée, et des marches sans échelle de temps.
   - Les mots « aucun besoin » et « seuil à fixer » sont écrits sur le graphe.
   - « Tout voir · 3 mouvements depuis avril » s'affiche alors que les 3 sont déjà listés. Chez nous : « Tout voir · 1 mouvement ».
   - Capture : `r4/390-clair-37-fiche-apres.png`.
7. **STC-7, gênant : la barre de stock n'a pas d'échelle.**
   - Pour 1 Pck, sans seuil ni besoin, une barre grise est remplie à environ 87 % : sur sa capture et sur la nôtre.
   - Juste dessous, « sans seuil » est écrit, puis répété dans la carte Seuil (« sans seuil : aucune alerte inventée »).
8. **STC-8, gênant : Autres stocks répète des onglets.** Les tuiles « Fûts 8 › » et « Matériel 1 › » doublent les onglets Fûts et Matériel du haut : c'est le même doublon que l'onglet Houblons qu'il a barré. « rien à signaler » est écrit 3 fois. Capture : `390-clair-04-autres.png`.
9. **STC-9, gênant : des sucres sont rangés dans les malts** (sens métier).
   - Dextrose et Sucre de resucrage sont dans le rayon Malts : sur l'étagère (« Spéciaux 5 kg »), dans la liste (« Malts 7 ») et dans Recompter (« Malts 7 »).
   - Chacun porte « EBC non connu ».
   - Captures : `390-clair-01-articles.png`, `390-clair-02-recompter.png`.
10. **STC-10, gênant : Courses à 390 laisse un tiers de la largeur vide.**
    - Le contenu tient dans 290 px sur 390, soit 90 px vides à droite.
    - Chaque article porte trois lignes de texte : « ZZ TEST IPA prévu le 01.12.2026 · ZZ TEST Saison prévu le 21.11.2026 · … ». Les dates sont en entier et la même liste est répétée à chaque article.
    - Capture : `390-clair-06-courses.png`.
11. **STC-11, gênant : à 1280, l'étagère occupe la moitié gauche.**
    - Malts : de Base à Fumé, x 187 à 780 sur 1 140 px. Houblons : la colonne « Pale » va de 187 à 260, puis rien jusqu'à la légende, à 770.
    - Les pots font 15 à 25 px de haut. Les valeurs sont en 12 px.
    - Capture : `1280-clair-01-articles.png`.
12. **STC-12, gênant : la vue saute quand on filtre ou qu'on épingle.**
    - « manque » insère « Filtre manque : 4 articles · Tout voir » : la bascule Ingrédients descend de 34 px (y 252 → 286), à 390 comme à 1280.
    - Épingler ajoute une deuxième rangée de pastilles (« ★ épinglés 1 ») et décale l'écran.
    - Même famille que WX2-2, mais pour des gestes qu'elle ne cite pas.
    - Captures : `r3/390-clair-31-manque.png`, `390-clair-10-fiche.png` (tour 1).
13. **STC-13, gênant : une icône muette dans Recompter.**
    - Trois barres ▂▄▆ sont dessinées sous chaque quantité, sans légende.
    - « ○ EBC non connu » est écrit en toutes lettres sur chaque malt (7 fois).
    - Capture : `1280-clair-02-recompter.png`.
14. **STC-14, gênant : Échap à 1280 jette une saisie sans prévenir.** Après « −1 » et un seuil de 2 tapés, Échap ferme la fiche. Rouverte, elle affiche « sans changement » et « sans seuil ». Journal : `r3/log3`.
15. **STC-15, gênant : Matériel empile trois rangées de commandes pour un seul appareil** : Parc / À venir / Carnets / Réalisés, Tout / À traiter, et une frise « aujourd'hui 21.11 » vide. Capture : `390-clair-08-materiel.png`.
16. **STC-16, mineur : dans une ligne de la liste, « Fermenteur 120 / L » est coupé** entre le nombre et l'unité, dans une cellule de 180 px à 390 comme à 1280. Capture : `390-clair-08-materiel.png`.
17. **STC-17, mineur : « à compter » est écrit deux fois dans la même ligne** : sous le nom, et à droite après l'α. Capture : `390-clair-09b-recherche.png`.
18. **STC-18, mineur : en thème cave, un pavé gris clair apparaît derrière la valeur** des champs Corriger et Seuil (« 1 ▬ Pck », « aucun ▬ Pck »). Capture : `390-cave-10-fiche-p0.png`.
19. **STC-19, mineur : le pluriel manque dans la fiche** : « 200 pièce en stock », « seuil 100 pièce », « avant 200 pièce ». La liste écrit bien « 200 pièces ». Capture : `r2/390-clair-23-fiche-bouteille.png`.
20. **STC-20, mineur : à 1280, la fiche est déséquilibrée.**
    - La colonne de gauche (Besoin, Ce qui a bougé) finit à y 420, celle de droite descend jusqu'au pied : environ 320 px vides.
    - La liste derrière se comprime à 400 px et l'onglet devient « Houblo… ».
    - Capture : `r2/1280-clair-24-fiche.png`.
21. **STC-21, mineur : à 1280, les tableaux ont des colonnes vides.** « Dernier mouvement » ne contient que des « — », et le fournisseur est le même partout. Dans les tableaux d'Autres stocks, 300 px vides séparent « En stock » de « Dernier mouvement ». Capture : `1280-clair-04-autres.png`.

### Précisions sur un défaut déjà connu (STOCK-ESPACE, non comptées)
- « Corriger le stock » fermé garde une bande vide sous son titre : 16 px sur 66 dans la fixture, et environ la moitié de la carte sur sa capture 02.
- « Besoin · aucun » prend une carte entière, environ 70 px, pour dire « Aucun brassin planifié ni recette écrite n'en demande ».
- « Ce qui a bougé » vide fait de même avec une phrase de 20 mots.
- La rangée « Comparer une recette · Besoin prévu face au stock » occupe une ligne au premier écran pour un geste rare.
- Le rond qu'il a dessiné à droite des pastilles marque une place libre : environ 40 px à 390, après « DDM 0 ». Elle peut recevoir Recompter en icône une fois la bascule rayée retirée.

### Doutes (non comptés)
- Sur l'étagère, Citra, Mosaic, Saaz, Nelson et Cryo sont tous dans la colonne « Pale ». « Lager » est vide alors que du Saaz est en stock. La cause est peut-être une fixture sans fiche liée. Chez lui, Citra est bien rangé en Hazy.
- Bouteille 33 cl indique « Besoin · aucun » alors que 3 brassins de 100 L sont planifiés. Le conditionnement n'est peut-être pas prévu.
- Fûts est une liste de cartes texte : il voudra peut-être aussi une vue d'ensemble, comme l'étagère.
- « Enregistrer » ferme la fiche. Il voudra peut-être voir le mouvement qu'il vient d'écrire.
- « 136 références aucun lot » (Houblons) se lit mal. L'onglet est barré : à revoir seulement s'il est déplacé.
- L'α 24,8 % du Cryo Citra est plausible : la fourchette du Cryo est d'environ 20 à 25 %. Aucune absurdité de brassage n'a été relevée ailleurs.
- La fixture n'a pas d'EBC sur ses malts : « EBC non connu » partout peut venir de là.

## Phrase prédite du brasseur, écran par écran
- **Articles › Étagère (390)** : « L'étagère c'est vraiment top, mais pourquoi mon Cryo il me dit à compter alors que j'en ai un paquet ? Et le dextrose c'est pas un malt. »
- **Articles › Étagère (1280)** : « Sur l'ordi l'étagère est toute petite à gauche et le reste est vide, il faut qu'elle prenne toute la place. »
- **Recompter** : « C'est pratique pour compter, mais c'est quoi ces petites barres ? Et “EBC non connu” partout, ça sert à rien. »
- **Autres stocks** : « Là j'ai que des cases avec du texte, je veux la même étagère. Et Fûts et Matériel, ils sont déjà en haut. »
- **Courses** : « La moitié de l'écran est vide, et trois lignes de texte pour me dire quel brassin. »
- **Fûts** : « Ça va, c'est lisible, mais c'est juste une liste. »
- **Matériel** : « Trois rangées de boutons pour un seul fermenteur ? »
- **Houblons** : « Je l'ai déjà barré, ça a rien à faire là. »
- **Fiche d'un article** : « Le fournisseur je le vois partout, l'alpha trois fois, deux endroits pour modifier, et Commander fait rien du tout. »
- **Modifier la fiche** : « Le fournisseur est coupé, et pourquoi un menu dans un menu pour l'alpha ? C'est pas compact. »

## Ce qui doit survivre (acquis qu'il aime)
- **L'étagère des ingrédients** : rayons Malts, Houblons et Levures, colonnes par style, pots à l'échelle, légende à un toucher. Il la trouve « incroyable ».
- **Recompter** : le compte par rayon, « il en reste » et la coche.
- **La courbe « Ce qui a bougé »**, avec ses avant → après : c'est l'idée juste, il ne faut en corriger que l'axe et les mots.
- **Les pas « −1 / +1 » adaptés à l'unité.**
