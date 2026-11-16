OK — tri : m2, m1, m8, m7, m5

# Critique c2 : Mesurer au curseur (page-v2, 10.11)

Juge : Opus (Fable interdit). Mode : passe 2 de l'entonnoir, sans rejet. Le brasseur voit les dix.
Contre : ses mots du 10.11 (« Ça invite pas au mesures… pas de renvoi », « utilise des slider plutot que de chiffre des input de chiffre sur téléphone », « utilise les ux, ui booster »), VB-1, z1 (règle n° 1 : réf. z1 mesure) et les manques communs de SYNTHESE.md.
Captures ouvertes en plein format : les 54 des variantes (4 états × 10 ; cave et 1280 de m2, m8 et m1 ; m2 densité ; m2 geste) et la réf. z1 mesure. Non rouvertes : ref-capture.jpg et ref-z1-ebullition.png (vues en c1).

## La passe a-t-elle progressé ?
Oui, sur ce qu'il a demandé. Les dix feuilles sont désormais au curseur, sur l'échelle de z1 : rail, bande verte, valeur en 28 px, pas de 0,1 °C, 0,01 pH ou 0,001 SG, écart chiffré et coloré. Les écarts affichés sont justes : 65,2 donne −0,8, 64,3 donne −1,7, 1,058 donne −0,004. La raison est à un toucher sur les dix, et son texte est juste en brasseur. La densité n'a qu'un repère, sans tolérance inventée.

Elle n'est pas encore satisfaisante. Deux défauts bloquants touchent les dix variantes, et un de plus touche m8. Les retouches de c1 propres à chaque variante n'ont pas été faites, puisque la VOIE disait « rien d'autre ».

Phrase prédite du brasseur : « Le curseur, oui : je glisse et je vois tout de suite si je suis dans la cible. Mais si j'ai 67 pile, je touche et rien ne se passe ? Et mon relevé, il est passé où dans Relevés du jour ? »

## Défauts communs aux 10 (la feuille est la même partout)

### Bloquants

**B1 : un toucher sans effet, et une valeur suggérée au départ.**
- Ce qu'on voit : le pouce part en pointillé au centre de la cible (67 °C, 5,35 pH). C'est un `<input type=range>` dont la valeur est réglée sur ce départ (etat.html:339).
- Toucher le pouce sans le bouger n'émet aucun `input`. Une maische à 67,0 pile, le cas le plus courant, ne s'enregistre donc pas d'un toucher. Il faut un détour : glisser puis revenir, faire −0,1 puis +0,1, ou passer par le crayon.
- L'inconnu est dessiné dans la cible, ce qui se lit « 67, bon ». C'est le défaut n° 1 de m5 en c1, étendu aux dix.
- Correction : rail et bande seuls, sans pouce, jusqu'au premier toucher, avec « ? » et Enregistrer grisé. Le premier toucher, sur le rail ou sur un pas, pose la valeur.
- À confirmer au banc (voir « DEMANDE EXECUTANT » plus bas).

**B2 : un élément de sa maquette manque (règle n° 1, L03).**
- Ce qu'on voit : après le relevé, la ligne « maische 66,4 °C · il y a … » disparaît de Relevés du jour. Dans m2, la valeur y est remplacée par « ✓ dans la cible ». Dans les neuf autres, la carte est absente.
- Dans z1, la valeur est à deux places : « relevé 66,4 » dans l'horloge et sa ligne dans Relevés du jour.
- Mon c1 demandait « pas trois fois » (une fois au premier plan, une fois au plus dans Relevés du jour), pas « une seule fois ». La VOIE l'a lu trop strictement.
- Correction : rendre la ligne de z1 (valeur, unité, « à l'instant »), la coche s'ajoutant à la valeur sans la remplacer. Deux places, celles de z1 ; jamais trois.

### Non bloquants

3. **Panneau à 1280.** Le panneau Mesurer flotte par-dessus la colonne de gauche et coupe Grains (« 6,6 k », coches masquées). Sa largeur passe d'environ 450 px (état curseur) à environ 520 px (hors cible, raison ouverte), ce qui fait sauter la mise en page. Vu sur m2, m8 et m1. Correction : l'ancrer dans la colonne de droite, à largeur fixe.
4. **Boutons de pas.** Les boutons −0,1 et +0,1 font 32 px de haut, c'est petit pour des mains mouillées un jour de brassage. Viser 44 px, comme la zone du pouce.
5. **Renvoi absent.** Seule m7 renvoie à la mesure suivante (« Ensuite : pH d'empâtage · dès 13 h 15 »). Les neuf autres disent « Aucun relevé ce palier », alors que sa plainte disait « pas de renvoi ».
6. **Reflet bleu.** Toucher « Pourquoi maintenant » laisse le reflet bleu natif du navigateur (capture m2-geste) : l'habillage n'est pas net.
7. **Cible pH.** La cible pH reste à 5,2–5,5 dans la carte et la feuille, contre 5,2–5,4 dans z1 ; elle n'est pas alignée (c1, n° 4).

## Défauts propres (combien et lesquels)
- **m2** : 2 bloquants communs et 3 défauts.
  1. La cible a deux formes : « cible 67 °C » dans la carte, « 66–68 °C » dans la feuille.
  2. La carte est remontée au-dessus de Grains : c'est un écart à z1, à montrer comme un choix.
  3. En cave, la case « ? pH » en pointillé se voit à peine.
- **m1** : 2 bloquants communs et 3 défauts.
  1. Le bouton « pH ? » porte un thermomètre.
  2. Le bouton « ? » de l'horloge ne fait qu'environ 28 px de haut.
  3. La ligne pH fait grossir l'horloge, un léger écart à z1.
- **m8** : 3 bloquants et 1 défaut.
  1. Bloquant (sens métier) : « montée 0,1 min », soit 6 s, reste en tête de carte. Il était déjà signalé en c1.
  2. Le suivi thermique est ouvert au-dessus de Grains, alors que z1 le replie.
- **m7** : 2 bloquants communs et 3 défauts.
  1. Après le relevé, le pied pousse « pH · dès 13 h 15 », une mesure qui n'est pas encore due.
  2. « Fin du palier » quitte le pied pour l'horloge, un écart à z1.
  3. « Relever la maische · 67 °C » se lit comme une valeur déjà relevée ; écrire « cible 67 ».
- **m5** : 2 bloquants communs et 3 défauts.
  1. Le « ? » est dessiné au milieu de la bande de l'horloge.
  2. La mini-échelle change d'étendue entre le repos et l'après : la bande passe de 266–431 px à 308–531 px.
  3. L'horloge double de hauteur avec ses deux jauges : on tire vers le cockpit.
- **m10** : 2 bloquants communs et 3 défauts.
  1. La tuile « consigne 67 °C » répète « maintien 67 °C ».
  2. « ✓ cible » est en mono, alors que ce n'est pas une mesure.
  3. Les trois tuiles font un tableau de bord.
- **m6** : 2 bloquants communs et 3 défauts.
  1. La piste, sans libellé, ne se comprend pas en 3 s.
  2. La ligne pH porte un thermomètre.
  3. Une carte « Mesures » neuve s'ajoute au-dessus de Grains, un écart à z1.
- **m4** : 2 bloquants communs et 4 défauts.
  1. Une mesure due « maintenant » est rangée dans « À anticiper ».
  2. Le compteur 0/4 mélange les relevés et les préparatifs.
  3. La ligne pH porte un thermomètre.
  4. « Relever la maische · 67 °C » est ambigu.
- **m3** : 2 bloquants communs et 2 défauts. Léger mieux : « relevé à faire » dans l'horloge, et « 2 attendus » avec des points sur les onglets dans la feuille.
  1. Le badge « 2 » de Mesurer reste petit et tout en bas.
  2. Le rond vide sur l'onglet pH n'est pas expliqué.
- **m9** : 2 bloquants communs et 3 défauts.
  1. Le soulignement doré invite trop faiblement.
  2. « relevé à relever » est une tautologie.
  3. Le lien « pourquoi » au bout de la ligne pH est ambigu, et il double le « Pourquoi maintenant » de la feuille.

Bloquants : 21 au total, soit B1 et B2 sur les dix variantes (20) et « montée 0,1 min » dans m8 (1).

## Classement
1. **m2** : les mesures attendues sont nommées, avec leur cible et leur heure. C'est la seule où Relevés du jour reste en place après le relevé, mais il faut y rendre la valeur (B2).
2. **m1** : c'est l'écart le plus petit à z1. L'invitation est là où il regardait, et l'après est propre.
3. **m8** : « ? °C → 67 » se lit d'un coup d'œil, mais l'absurdité de la montée y reste.
4. **m7** : c'est l'invitation la plus forte, et la seule à renvoyer à la mesure suivante. Mais son pied pousse ensuite une mesure qui n'est pas due.
5. **m5** : la bande de l'horloge reprend la grammaire du curseur. Mais l'inconnu est dans la cible, et l'horloge grossit.
6. **m10** : les tuiles sont nettes, mais elles répètent l'horloge et tirent vers le tableau de bord.
7. **m6** : la grammaire de la piste est reprise, mais la piste est muette et les pictos sont faux.
8. **m4** : le contresens de « À anticiper » reste.
9. **m3** : elle gagne « relevé à faire » et « 2 attendus », mais l'invitation reste au pied.
10. **m9** : l'invitation est faible, et son idée propre, la raison, est maintenant commune aux dix.

## Candidates (5)
- **m2** (carte) :
  1. Corriger B1 et B2, en rendant « maische 66,4 °C · à l'instant ✓ » dans la ligne de la maische.
  2. Une seule forme de cible, « 66–68 °C », dans la carte et dans la feuille.
  3. Une jumelle avec la carte à sa place de z1 (après Grains), pour qu'il choisisse la position.
- **m1** (horloge) :
  1. Corriger B1 et B2.
  2. Le bouton « ? » à 44 px, avec un picto pH propre.
  3. Greffer le pied « Ensuite : … » de m7.
- **m8** (suivi réduit) :
  1. Retirer « montée 0,1 min » ou écrire « — ».
  2. Corriger B1 et B2.
  3. Suivi replié ou placé sous l'horloge, comme dans z1.
- **m7** (pied) :
  1. Corriger B1 et B2.
  2. Après le relevé, le pied revient à « Fin du palier » jusqu'à 13 h 15.
  3. Écrire « Relever la maische · cible 67 ».
- **m5** (bande) :
  1. Corriger B1, et sortir le « ? » de la bande de l'horloge.
  2. Garder la même échelle au repos et après le relevé.
  3. Une seule jauge, celle de la mesure due, pour que l'horloge reste basse.

## Greffes
| Idée | Origine | Reçue par |
|---|---|---|
| Pied de feuille « Ensuite : pH d'empâtage · dès 13 h 15 » (le renvoi) | m7 | m2, m1, m8, m5 |
| « 2 attendus » et points sur les onglets de la feuille | m3 | m2, m1, m8 |
| Flèche « ? °C → 67 » (de la valeur vers la cible, sans phrase) | m8 | m2 (ligne de la maische) |
| Trait vert dans une mini-bande, à côté de la valeur, dans Relevés du jour | m5 (après) | m2 |
| Densité : repère seul et écart en ambre, sans bande inventée | v2 commun | à garder au port |

## DEMANDE EXECUTANT (confirmer B1)
1. Ouvrir `voies/v2/etat.html?v=m2&moment=sacc&etat=curseur` dans Chrome, en tactile, à 390 px.
2. Toucher le pouce sans le déplacer.
3. Relever le texte de la valeur et l'état d'Enregistrer, puis capturer `os.tmpdir()/b1-tap-pouce.png`.

Attendu si B1 est confirmé : la valeur reste « ? » et Enregistrer reste grisé.

LEÇON PROPOSÉE : un critère tiré d'une synthèse du critique (ici « valeur une fois ») se confronte à la maquette choisie avant d'entrer dans une VOIE. Ici, il a fait retirer une ligne de z1 sur les dix variantes.
