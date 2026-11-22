OK — 16 problèmes, 0 bloquant

Version : proto.html sha256 b8390c8a4d01 (final2, 16.11)

Joué : 390 × 844 tactile et 844 × 390 tactile, cave et clair, vide (`?vide=1`, aucun carnet) puis rempli (fixture,
carnet Embouteillage : liste, journal haut et bas, Articles, Comparer, ligne ouverte, fiche). Captures du scénario de zéro
(87 images, planches 01 à 16 : embouteillage, frigo, ventilation, évier) et de l'audit paysage (A2, A3d, A6, A6b, E23,
E26), toutes ouvertes. Captures du critique : `scratchpad/crit/` (32 images, 8 grilles). Console sans erreur. Mesure à
390 : corps minimal de 15 px partout, 3 tailles (15, 18, 26), aucun texte hors bord.
Le carnet n'a pas d'entrée dans `choix/ecrans.json` : la base est p5f (« Okay adapté p5 fini alors »). Il n'y a donc pas
de comparaison côte à côte avec une maquette du registre.

| Écran | Thème | Largeur | État | Problèmes | Bloquants |
|---|---|---|---|---|---|
| Liste vide | cave, clair | 390, 844 | repos | 1 | 0 |
| Liste remplie | cave, clair | 390, 844 | repos | 1, 15 | 0 |
| Journal (recherche) | cave | 390 | E1 à E12, E19 à E21 | 1, 2, 3, 9 | 0 |
| Journal (choisi) | cave, clair | 390, 844 | fixture, E16 | 1, 4 | 0 |
| Comparer | cave, clair | 390 | E14, E19, E20, E21, fixture | 5, 6, 7 | 0 |
| Matrice | cave | 844 | E23, fixture | 12 | 0 |
| Articles | cave, clair | 390, 844 | fixture | 12, 15 | 0 |
| Fiche | cave, clair | 390, 844 | E19, E27, fixture, E26 | 8, 10, 13 | 0 |
| Choisir, pourquoi | cave | 390, 844 | E16, E19 à E21, A6 | 7, 9 | 0 |
| Compléter à la main | cave | 844 + clavier | A3d | 11 | 0 |

## Problèmes, du plus grave au moins grave

1. **Encore trop de mots au premier écran, partout** (lisibilité, sa plainte de dc et da : « difficile à lire »). Au repos
   à 390, on compte 110 mots sur la liste vide, 152 sur la liste remplie, 131 sur le journal et 110 sur Comparer. La cible
   de `f9/LISIBILITE.md` est de 40. Chaque article du journal tient sur 4 à 5 lignes, avec nom, fournisseur, pays, prix,
   puis « ✦ lu sur enotecnica-sud.it : 4 valeurs, 1 « ? » · façon Isobarique » et une pastille « exemple ». La liste
   vide est un mode d'emploi en quatre étapes. Corriger : une ligne par article au journal (picto, nom, prix) et la
   provenance dans la fiche ; une étape d'aide à la fois sur la liste vide.
2. **Le bloc « Catégorie … touchez pour garder ou retirer » reste planté au milieu du journal pendant toute la
   recherche.** Il est là de E1 à E12, et encore au statut *compare* dans le frigo (E19). Il repousse la ligne du temps sous
   six à huit puces. Corriger : le replier en une ligne (« 7 caractéristiques proposées › ») dès la première note.
3. **« Tout garder » porte une coche ✓ alors que rien n'est encore gardé.** Les autres puces montrent « + », si bien
   qu'on ne sait pas si Cadence ou Becs comptent (E1 à E12). La coche se lit comme un état, pas comme un geste. Corriger :
   « + Tout garder » sans coche, et la coche seulement sur ce qui est gardé.
4. **La ligne du journal « Produit et fournisseur choisis » fait 7 lignes grises.** On y lit le pourquoi en entier, puis
   « écartés : Manuelle 1 bec, Table 2 becs, … » (E16, fixture). La carte « Décision du … » juste au-dessus dit déjà
   l'essentiel. Corriger : « Choisi : Pré-évacuation 4 becs (AT) », et le reste à un toucher.
5. **Comparer, quand moins est mieux : le premier du classement a la barre la plus courte.** Sur l'oxygène, 40 ppb donne
   une petite barre verte et 220 ppb une longue barre grise (E14, fixture). À l'œil, le gagnant paraît le plus faible.
   Corriger : une barre de mérite (pleine = meilleur), ou la valeur seule.
6. **La valeur et son unité sont coupées sur deux lignes, avec le ✦ entre les deux** (« 40 ✦ » au-dessus de « ppb »,
   « 43 ✦ » au-dessus de « °C »), sur chaque ligne du classement. Corriger : « 40 ppb » sur une ligne, le ✦ à part ou
   dans la fiche.
7. **Libellés de valeur mal formés.** On lit « fûts de 20 l 30, le plus haut » et « fûts de 20 l 4 contre 30 »
   (choix du frigo) : le nombre vient après une unité et ne se lit pas. On lit aussi « co₂ par bouteille 4 g » en
   minuscule (E16), et « Fûts de 20 L » sur la puce contre « 20 l » dans le texte. Corriger : « 30 fûts de 20 L, le plus »,
   « 4 fûts contre 30 », « CO₂ ».
8. **Un article collé peut atterrir d'emblée dans « Écartés », sans geste du brasseur.** L'annonce ricardo.ch « Frigo
   d'occasion 4 fûts » est rangée par l'IA dans la façon « Frigo vitrine pro », déjà écartée. Elle arrive donc hors jeu,
   sans rang (E19 : tableau et fiche). En plus, un frigo à fûts d'occasion n'est pas une vitrine pro. Corriger : un
   article neuf entre dans une façon en lice, ou la fiche demande « Ranger où ? ».
9. **Les messages crème du bas reviennent à presque chaque geste**, et c'est l'élément le plus clair de l'écran en cave.
   On les voit couvrir la fin du contenu : « Disponibilité vérifiée » sur « Écartés » (E19, E20, E21), « Pourquoi gardé »
   sur « Veille des écartés » (E19 choisi), « Carnet créé », « Façon ajoutée », « Critère : … » d'affilée. Corriger :
   garder le message pour ce qui s'annule (critère, façon écartée), et laisser l'écran montrer seul le reste.
10. **La veille proposée sur une annonce d'occasion n'a pas de sens.** Sur Ricardo (une pièce unique, chez un
    particulier), « Surveiller tous les 3 jours : prix et stock, ici et chez d'autres fournisseurs » est affiché (E19,
    E27). Corriger : sur une annonce d'occasion, la veille dit « Annonce encore en ligne ? », ou ne s'affiche pas.
11. **Compléter à la main, en paysage avec le clavier (A3d) : le champ du haut n'a plus de libellé visible.** Le mot
    « Luftshop » dépasse derrière le bouton « Garder », et la colonne de gauche est coupée (« collé le 5 nov. · rangé
    dans… »). À noter : il a dit « Pas besoin pour le carnet » du paysage, donc ce problème est secondaire.
12. **Paysage, Articles : l'en-tête « CHF » est à 745 px, loin des prix (environ 600 px), et le tiers droit reste vide.**
    La barre d'onglets de l'app disparaît aussi en paysage, alors qu'elle est là en portrait. Même réserve qu'au point 11.
13. **Dans la fiche, les prix des autres fournisseurs n'ont pas d'unité** (« Abfülltechnik West 11'200 › »,
    « Ricardo 650 › »), alors que le prix principal dit « 11'700 CHF ».
14. **Unités incohérentes entre articles d'un même carnet** : « Chambre froide 2 m² » face à « Chambre kit 1,5 m³ ».
    On compare une surface au sol à un volume.
15. **En clair, les pictos d'articles sont gris pâle sur une tuile presque blanche.** Ils se distinguent mal (Articles,
    carte de la liste). Sur la carte Embouteillage, les cinq machines ont le même dessin et ne départagent rien.
16. **Typographie** : des apostrophes droites dans la fixture (« pour l'un », « minimiser l'oxygène » au journal en
    paysage) à côté d'apostrophes typographiques ailleurs.

## Doutes (non comptés)

- La pastille « exemple » revient des dizaines de fois par écran. Le cadre l'exige pour toute réponse simulée, et elle
  partira dans l'app, mais elle ajoute au bruit du point 1 quand il regardera la maquette.
- Pendant la saisie (E2 à E4), le titre du carnet et ses onglets sortent par le haut. On voit la dernière entrée, mais plus
  dans quel carnet on écrit.
- « Becs : plus = mieux » : le nombre de becs est un choix de taille, pas un mérite. Le classer peut tromper.

## Sens métier

Rien d'absurde. Oxygène capté de 40 à 220 ppb, cadences de 60 à 900 bt/h, CO₂ de 4 à 7 g par bouteille, débit de hotte de
1 800 m³/h, ambiante max de 43 °C, bac de 60 cm : tout est plausible et marqué « exemple ». Seuls les points 8, 10 et 14
touchent au métier.

## Phrase prédite du brasseur

« Là ça fait enfin ce que je veux, je pars de zéro et je retrouve pourquoi j'ai pris ce fournisseur. Mais c'est encore
beaucoup de texte partout, faut lire pour comprendre, et les petites barres je capte pas qui est le meilleur. 7/10. »
(Règle du § 7 de PORTRAIT : le besoin est tenu, à 8,5 environ, mais la lisibilité, à 7, plafonne la note.)
