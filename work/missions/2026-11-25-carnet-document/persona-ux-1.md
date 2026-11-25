# Persona ux, itération 1 (25.11)

Regard : concepteur d'interfaces mobiles compactes, pas le brasseur. Grille : boosters-ux (B1 à B13) et impeccable (mode Operate),
soumis à DESIGN.md et à ses plaintes (DEFAUTS-RECURRENTS : CARNET-COHERENT, CHAMP-CARNET-REPLIE, CARNET-REPOND-AU-BESOIN,
CARNET-LISTE-COMPACTE). Les 12 captures de `cap/` ont été ouvertes ; les mesures viennent du CSS des maquettes. Pixels en
CSS, soit la moitié de la capture de 780 px.

Légende : **B** = bloquant (geste impossible ou caché, valeur fausse ou invérifiable, élément demandé absent, texte
illisible) ; **m** = mineur ; **D** = doute, non compté.

Un problème vaut pour les quatre maquettes ; il est compté une fois dans chacune :
- **B, parcours** : un seul état est dessiné, « Je cherche » sur l'écoulement. Il manque les options, le geste de décider,
  le carnet résolu et un carnet qui n'est pas un problème (mémo, achat, idée). C'est sa plainte : « Beaucoup ne répond que
  à un problèmematique ou pas du tout » (CLASSEMENT-3).
- **m, micro absent** : aucune maquette n'a de micro, alors que CHAMP-CARNET-REPLIE demande « les 2 actionnable tout le temps
  actifs » (photo et micro). Pour une mini note prise mains mouillées, c'est le geste le moins cher.

---

## M1 · Le carnet se range : 10 problèmes, 3 bloquants

1. **B** Les changements de l'IA sont invisibles. Le bandeau dit « 5 changements », mais seul le devis barré se voit. Ses
   phrases sont réécrites sans trace : « Pistes : joint du siphon trouvé usé » devient « Joint du siphon usé ». Il ne peut
   pas vérifier ce que l'IA a touché (`m1-apres`). Correction : souligner chaque passage réécrit en violet ; un toucher
   montre le texte d'origine (mode « suggérer » de Notion).
2. **B** L'annulation est tout ou rien. Il est impossible de refuser une seule correction (`m1-apres`, `m1-annuler`).
   Correction : greffer la feuille de M2 (cases à décocher, « Garder 2 sur 3 »).
3. **B** Parcours partiel (problème commun ci-dessus).
4. **m** Le bandeau « Rangé » remplace l'en-tête : plus de retour ni de ••• tant qu'il est affiché. « Annuler » est en haut à
   droite, le point le plus loin du pouce (`m1-apres`). Correction : le mettre en barre basse, au-dessus du champ, comme le
   bandeau de `m1-annuler`.
5. **m** Avant l'envoi, la zone de saisie fait environ 137 px : bandeau « Lien copié » plus champ de deux lignes à 46 px
   de haut. Deux boutons pleins s'y disputent l'action principale, « Coller » en bleu et « Ranger » en violet (B2), et le
   champ dépasse la limite de 44 px de CHAMP-CARNET-REPLIE (`m1-avant`). Correction : réduire « Coller » à une pastille
   contour à gauche du champ, sur une seule ligne.
6. **m** Une note ne s'ajoute que par « Ranger ». Chaque mini note relance donc un rangement qui déplace toute la page :
   le coût est élevé et le résultat surprend (`m1-avant`). Correction : Entrée ajoute la note brute, « Ranger » reste un
   geste séparé, avec une pastille « 1 note pas rangée ».
7. **m** La tâche porte deux commandes sans libellé qui les distingue : une case à cocher (faite) et la pilule « → À venir »
   (planifier) (`m1-apres`). Correction : une seule commande par rangée, la date dans un second toucher.
8. **m** « 150 CHF » est en chasse fixe espacée, ce qui rejoue CARNET-COHERENT (« aucun chiffre en chasse fixe espacée dans
   le Carnet ») (`m1-apres`).
9. **m** L'ornement est répété : cinq ✦, cinq filets violets, cinq titres en capitales espacées. Le CSS déclare quatre
   tailles de texte (14, 15, 16 et 26 px, B6), et le violet de l'IA finit par ne plus rien signaler (`m1-apres`).
   Correction : un seul ✦ dans le bandeau, puis des titres de section neutres.
10. **m** Micro absent (problème commun ci-dessus).
- **D** Après l'annulation, la note neuve « Estimation 150 CHF » reste sur un fond gris, sans dire pourquoi : en attente ?
  (`m1-annuler`).
- **D** Une demi-page reste vide avant l'envoi, parce que le cas est court (`m1-avant`).

Parcours : noter vite ✓ (mais toujours par l'IA) · trouvé / pas trouvé ✓ · devis ✓ · coût ✓ · options ✗ · décider ✗ ·
tâche ✓ · résoudre ✗ · relire pourquoi ✗ (texte réécrit, sources perdues) · carnet hors problème ✗.
**Note : 5,5/10.** Le modèle est le plus simple, mais l'IA y efface ses mots, la crainte même qu'il a du chat.

## M2 · La fiche au-dessus : 11 problèmes, 3 bloquants

1. **B** Il ne sait pas ce qui est fait et ce qui est proposé. La tuile « Devis » affiche déjà « attendu », mais la ligne
   pointillée juste dessous propose encore « à acheter → attente » avec un bouton « Non » (`m2-apres`). Correction : un seul
   régime, soit tout appliqué et annulable, soit tout proposé et à accepter.
2. **B** L'annulation est cachée : la feuille s'ouvre en touchant l'heure « 🕓 21:26 », que rien ne présente comme une
   annulation (B3 : chaque déclencheur nomme ce qu'il ouvre ; `m2-apres`). Correction : écrire « 3 changements · revoir »
   comme bouton.
3. **B** Parcours partiel (problème commun ci-dessus).
4. **m** Après le rangement, la fiche occupe environ 440 px sur 844, soit 52 % de l'écran. Ses notes 1 à 4 passent sous un
   « ▲ 1 à 4 plus haut » qui se lit mal (`m2-apres`). Correction : replier la fiche en une rangée de jetons (trouvé,
   pas trouvé, coût, devis) dépliable.
5. **m** La note 1 répète le titre « Écoulement qui fuit » (CARNET-COHERENT : « le titre n'est jamais redit en bulle » ;
   `m2-avant`).
6. **m** Les notes sont six cartes numérotées. Cela se relit comme des bulles, alors qu'il veut « pas de chat […] un champs
   text » (`m2-avant`). Correction : un seul bloc de texte, numéro en marge.
7. **m** La saisie tient sur deux rangées, environ 108 px : Photo et Coller au-dessus, le champ dessous
   (CARNET-COHERENT : « le champ et le + sur UNE ligne » ; `m2-avant`).
8. **m** Le bouton rond ✦ n'a pas de libellé. Rien ne dit s'il ajoute la note ou range le carnet (`m2-avant`).
9. **m** Les pastilles 3, 4, 6 et 7 dans les tuiles ne disent pas si ce sont des numéros de note ou des compteurs (B11 ;
   `m2-avant`). Correction : écrire « n° 3 », ou un petit ↗3.
10. **m** La même nouveauté porte quatre marques : trois « nouveau », « 3 changements » et des bordures violettes
    (`m2-apres`). « 150 CHF » est en chasse fixe espacée (CARNET-COHERENT).
11. **m** Micro absent (problème commun ci-dessus).
- **D** La feuille d'annulation est la meilleure des quatre (cases, sources « note 7 », « Fiche de 21:18 ») : c'est la greffe
  à faire dans M1, M3 et M4.

Parcours : noter vite ✓ · trouvé / pas trouvé ✓ · devis ✓ · coût ✓ (« inconnu » honnête) · options ✗ · décider ✗ · tâche ✓ ·
résoudre ✗ · relire pourquoi ✓ (chaque tuile renvoie à sa note) · carnet hors problème ✗.
**Note : 6,5/10.** C'est la plus solide sur la confiance et l'annulation, mais la plus lourde à 390 px.

## M3 · Dans la marge : 11 problèmes, 3 bloquants

1. **B** Les croix de la gomme mesurent 20 × 20 px (`.m3-croix`), sous les 24 px de B13. Elles sont collées au texte et
   empilées à 8 px l'une de l'autre (`m3-annuler`). Correction : 24 px au moins, une rangée de marge entière touchable.
2. **B** « à acheter » rétabli s'affiche en gris pâle sur le fond crème. Le contraste, estimé à l'œil à moins de 3:1, rend
   ce texte illisible ; c'est pourtant la valeur en vigueur (`m3-annuler`).
3. **B** Parcours partiel (problème commun ci-dessus).
4. **m** La marge fait 138 px de large : les annotations se coupent sur deux lignes et restent télégraphiques (« si ça
   refuit », « 150 CHF estimé · devis ? », « coût estimé, pas le devis »). En trois secondes, on ne sait pas ce que dit
   l'IA (B11 ; `m3-apres`).
5. **m** Le mode gomme remplace l'en-tête par une barre noire : plus de retour. « Tout 21:26 » est obscur, et les commandes
   sont en haut, hors de portée du pouce (`m3-annuler`).
6. **m** Entrer en mode gomme décale le texte d'environ 16 px : « fuite sous la dalle » passe de la ligne 280 à 296 et la
   page saute (B9 : sans décaler ; `m3-apres` comparée à `m3-annuler`).
7. **m** La saisie tient sur deux rangées, environ 122 px : champ souligné, puis quatre boutons (`m3-avant`).
8. **m** « Coller le lien » ne dit pas quel lien sera collé. Après l'envoi, il ne reste qu'une icône, alors que M1, M2 et M4
   montrent « entreprise-x.ch » (`m3-avant`, `m3-apres`).
9. **m** « Je cherche », en bleu en haut à droite, se lit comme un lien, pas comme un état (`m3-avant`).
10. **m** La pilule noire « À venir ven. » ressemble à une chose décidée, alors que « ven. » est une proposition de l'IA.
    Le Conseil traverse la marge et sort des lignes du papier (`m3-apres`).
11. **m** Micro absent (problème commun ci-dessus).
- **D** Environ 45 % de l'écran est fait de lignes vides (`m3-avant`) : c'est la métaphore du papier, mais elle coûte de la
  place.

Parcours : noter vite ✓ · trouvé / pas trouvé ✓ · devis ✓ · coût ✓ · options ✗ (« cause probable » et « si ça refuit »
l'amorcent) · décider ✗ · tâche ✓ · résoudre ✗ · relire pourquoi ✓ (la marge reste en face de la note, la meilleure lecture
après coup) · carnet hors problème ✗.
**Note : 5,5/10.** L'idée est juste (ses mots intacts, l'IA à côté), mais elle est trop serrée à 390 px.

## M4 · Deux vues : 12 problèmes, 3 bloquants

1. **B** « Mes notes », la vue promise « jamais réécrite », est réécrite. Les deux notes du fil, « Pistes : joint du siphon
   trouvé usé » et « fuite sous la dalle, pas trouvée. », y sont fusionnées par un « ; » (`m4-avant` ; fixture c79,
   notes 3 et 4). Correction : une ligne par note, telle quelle.
2. **B** La vue « Organisé » n'a pas de champ : ni barre de saisie, ni photo, ni lien. Pour noter, il faut repasser à
   « Mes notes » (`m4-apres`). Cela contredit CHAMP-CARNET-REPLIE (« le champ reste visible »). Correction : la même barre
   basse dans les deux vues ; une note tapée dans Organisé s'ajoute au bout de Mes notes.
3. **B** Parcours partiel (problème commun ci-dessus). La frise Noté → Résolu l'amorce, sans en donner le geste.
4. **m** Il n'existe pas d'annulation globale, seulement « Remettre » bloc par bloc dans le menu. Défaire une organisation
   entière coûte N gestes (`m4-annuler`). Correction : greffer la feuille de M2 (« Organisé de 21:18 »).
5. **m** La barre noire « Estimé » occupe toute la largeur sans échelle : pour une seule valeur, elle ne dit rien (B8). Elle
   dispute la dominante à la carte noire de la tâche (B2 ; `m4-apres`). Correction : une jauge estimé contre devis
   seulement quand les deux sont connus ; sinon une ligne « 150 CHF estimé · devis attendu ».
6. **m** La tuile « Sous la dalle » est hachurée et porte un « ? », motif déjà refusé (CARNET-COHERENT : « case hachurée
   « ? » »). « ? » dit « inconnu », alors que la fuite a été cherchée et non trouvée : M1 et M2 mettent ✕ (`m4-apres`).
7. **m** La chasse fixe sert à des mots : horodatages « 24 nov. 21:18 » et « ta note 5 · 21:26 » (B6 : aucun mot en mono qui
   n'est pas une mesure). « 150 CHF » est espacé (CARNET-COHERENT ; `m4-avant`, `m4-annuler`).
8. **m** Les pastilles « 3 » sur les deux tuiles ne disent pas si ce sont des renvois ou des compteurs (`m4-apres`).
9. **m** « Retirer de la vue » s'affiche en rouge avec une corbeille, signe destructif pour un geste réversible
   (`m4-annuler`).
10. **m** « Mes notes » ne montre ni ce que l'IA a lu, ni qu'Organisé est périmé après une note neuve. Correction : un point
    sur l'onglet Organisé et un trait discret en marge des notes déjà utilisées (`m4-avant`).
11. **m** La première note répète le titre, et le CSS déclare cinq tailles de texte (14, 15, 17, 19 et 20 px), au-delà des
    trois de B6 (`m4-avant`).
12. **m** Micro absent (problème commun ci-dessus).
- **D** Après « Organiser », rien ne dit si la vue bascule seule. Si elle ne bascule pas, voir le résultat coûte un geste
  de plus.
- **D** Le bas d'« Organisé » reste vide sur environ 270 px (`m4-apres`) : le cas est court.

Parcours : noter vite ✓ (dans Mes notes seulement) · trouvé / pas trouvé ✓ · devis ✓ · coût ✓ · options ✗ · décider ~
(frise) · tâche ✓ · résoudre ~ (frise) · relire pourquoi ✓ (« Voir dans Mes notes », note 5) · carnet hors problème ✗.
**Note : 7/10.** C'est la plus riche en boosters (frise d'état, tuiles, jauge, renvoi à la note) et la plus juste sur le
modèle (Granola), à condition de garder la barre de saisie partout et de ne jamais toucher « Mes notes ».

---

## Greffes proposées au concepteur
- La feuille d'annulation de M2 (cases, sources, version d'avant) va dans M1, M3 et M4.
- La marge de M3 entre dans « Mes notes » de M4, comme un trait et un mot court en face des notes utilisées.
- La frise d'état de M4 va dans M1 et M2 : elle seule amorce décider et résoudre.
- Barre basse commune aux quatre : une ligne de 44 px au plus avec photo, micro, champ, pastille du lien quand le
  presse-papiers en contient un, et ✦ libellé.
- Ajouter un second état par maquette : options et décision (deux devis, réparer soi-même ou appeler le sanitaire), et un
  carnet mémo ou achat, pour montrer comment la structure s'adapte.
