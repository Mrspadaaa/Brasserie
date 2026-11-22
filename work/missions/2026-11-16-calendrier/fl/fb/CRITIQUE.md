OK — fb passe 2 accepté : tout se fait sans clavier en 1 ou 2 touchers, mais l'effet sur « à te permettre » sort de l'écran pendant le geste

# Critique fb, passe 2 (16.11, Opus, regard neuf)

La critique de la passe 1 est gardée dans `v1/CRITIQUE.md`.

Captures ouvertes en plein format : repos 390 clair et cave, repos 844, t2, t2pose (= mesure-T2), t3, t5, t5j, t7, t8b.
Non ouvertes : t1, t4, t6, t7annuler, plus, les autres en cave ou en paysage. Pour celles-là, l'état vient de mesure.json et de GESTES.md.
J'ai aussi vérifié dans `proto.tpl.html` que seul l'en-tête des semaines (`.fh`) reste collé en haut.

Sens métier : rien d'absurde.
- Un brassin occupe 3 à 4 semaines, cuve comprise, et coûte −148 à −232.
- Le malt mis de côté donne 135 par semaine sur 4 semaines (4 152 → 4 017 → 3 602 → 4 767 → 4 576, cohérent). Retirer le malt de S52 rend 180 en S52, puisqu'il est étalé sur 3 semaines.
- La S53 du 28 déc. est juste : 2026 compte 53 semaines ISO.
- La charge « 4/2 j » en rouge en S50 alerte à bon escient.

## Sa question : « en une action, je peux ajouter, modifier ECT.. ? »
Presque. Modifier se fait en 1 geste (durée, montant, déplacement, retrait, filtre d'un type).
Ajouter se fait en 2 touchers sans clavier (case +, puis puce), et un appui long tire une plage.
Les jours se règlent en 2 touchers (valeur, puis case du jour).
Ce qui manque encore : voir l'effet de ce geste sur ce qu'il peut se permettre.

Phrase prédite du brasseur : « Là ça devient vraiment top, poser d'un toucher sans rien taper et glisser sur le prix c'est génial !! Mais
je pose le malt et je vois même pas que je passe en négatif en juin ??? Et en horizontal je vois qu'une ligne. »
Classe : aime, avec un « mais ».

## Notes /10 (f1 = 8 pour lui)
| brasseur | uxui | parcours | navigation | fluidité |
|---|---|---|---|---|
| 8,5 | 7,5 | 8,5 | 7,5 | 8 |

La passe a progressé : la passe 1 avait 8 / 7 / 8 / 7 / 7,5. Ajouter sans clavier, les jours revenus, le filtre juste et le haut stable en sont la cause.

## Problèmes, du plus grave au moins grave
1. **L'effet principal sort de l'écran pendant le geste.** Dans la frise, seul l'en-tête des semaines reste en haut ; le grand chiffre défile hors de vue.
   Exemple, t2pose et mesure-T2 : après avoir posé le malt, « à te permettre » passe de 259 à −281, donc la caisse devient négative en S24. À l'écran, on voit seulement des « libre en fin » de 4 000 à 5 000 et un bandeau coupé « Malt groupé posé · … ».
   Le brasseur pose un achat qui le met dans le rouge sans le voir : une valeur cachée, alors que l'honnêteté est son critère 4.
   Correction : quand le grand chiffre défile hors de vue, ajouter à gauche de la rangée collée une pastille « à te permettre 259 → −281 · S24 », rouge si négatif.
   Pendant un geste et 4 s après, le bandeau dit « −540 · à te permettre 259 → −281 » avant le nom.
2. **En paysage, la frise disparaît** (repos 844). Le haut prend 490 px sur 780 (63 %) : grand chiffre, graphe, période, filtres et en-tête des semaines.
   On ne voit qu'une rangée, Brassins. C'est pourtant la vue « full screen » qu'il a demandée (15.11).
   Correction : en paysage, coller sur une seule ligne le grand chiffre, la période et les filtres (repliés en pastilles). Replier le graphe en un trait de 40 px qui se déplie d'un toucher. Garder « libre » et « charge » sur une ligne par semaine. Cible : la frise occupe au moins 60 % de la hauteur.
3. **À 390, la frise commence sous la moitié de l'écran.** Au repos, la première chose (Blonde d'automne) est à 995 px sur 1 688 (59 %). En défilant, l'en-tête collé garde 230 px (27 %).
   Correction : dans l'en-tête collé, fusionner la date sous Sxx et le mouvement « ± » sur une ligne (« 4 032 · −148 »), et mettre la charge en pastille à droite. Cible : 150 px au plus.
4. **Une même chose a deux noms.** La puce et la corbeille disent « Malt groupé », la barre déjà prévue dit « Commande groupée de malt ».
   Dans t2pose, les deux se suivent et on croit à deux achats différents du même malt.
   Correction : un seul nom affiché, le nom court, partout (barre, puce, bandeau, corbeille). Le nom long reste dans la fiche.
5. **Le filtre ne se voit pas en entier.** On voit 3 filtres et demi sur 7 (Achats est coupé ; Travaux, Activités et Papiers sont hors écran). En paysage, Papiers est coupé.
   Correction : 7 pastilles carrées de couleur avec leur initiale ou leur picto, sur une ligne de 390 px. Le nom du type s'affiche seulement sur les filtres actifs une fois filtré.
6. **Les rangées de « + » doublent la hauteur de la frise.** Elles ajoutent 7 rangées de 6 « + » (42 signes) au repos, soit environ 350 px. C'est le bruit « énormément d'information pour rien ».
   Correction : supprimer les rangées de pose. Un toucher dans une case vide de la rangée du type pose le fantôme « + poser ici · S49 ». Un seul « + » discret, en bout de rangée vide, reste comme indice.
7. **Le bandeau est coupé là où est l'info.** « Malt groupé posé · … » cache la semaine et le montant (t2pose).
   Correction : écrire « −540 · S48→S51 » en premier et tronquer le nom. Avec le problème 1 : « −540 · 259 → −281 ».
8. **Une barre d'achat a deux tons sans légende.** Sur Malt groupé, une partie claire (S48 à S50) et un bloc foncé (S51) ; on ne sait pas lequel est le paiement.
   Correction : dans la partie foncée, écrire « payé » en petit, ou mettre un picto pièce à la semaine de paiement, comme « en cuve » sur les brassins.
9. **La bulle d'ajout couvre 70 % de l'écran** (t2, t3). Sa rangée de types déborde (le 6e est coupé) et une puce verte (« Laver fûts ») a une couleur hors de son type.
   Correction : la bulle part de la case, avec 4 à 6 puces sur 2 colonnes, et le type déjà choisi par la rangée (sa rangée de types repliée en « changer »). Les puces prennent la couleur de leur type.
10. **Les compteurs de rangée ne suivent pas le geste.** « Fêtes 1 · +1 180 » reste affiché pendant le glisser à 1 400 (t5). « Achats 1 · −540 » reste affiché pendant le retrait (t7).
    Correction : mettre le compteur à jour en direct, comme les « libre en fin ».
11. **Du texte au repos.** On lit « + touche pour poser · appui long et glisse : une plage » dans Travaux, et « Loyer du local (400 par mois) −400 / mois » répète le montant.
    Correction : retirer l'aide écrite (le fantôme au toucher suffit) et écrire « Loyer du local −400 / mois ».
12. **Le glisser sur une valeur ne s'annonce pas.** Le pointillé sous le montant fait penser à un champ à taper. La bulle du glisser « +1 400 » cache aussi Porter d'hiver (t5).
    Correction : afficher un petit chevron « ‹ › » sous le montant de la chose touchée, et placer la bulle du glisser au-dessus du doigt, dans la marge de l'en-tête collé.

## Doutes (non comptés)
- La pastille « ensuite · 4 505 dès S33 · 16 août » touche le bord droit à 390 ; elle est peut-être coupée de quelques px.
- Je n'ai pas vu t4, t6, t7annuler et le menu du + dans cette passe. La passe 1 les avait jugés corrects.
- L'appui long de 380 ms pour une plage entre peut-être en conflit avec le défilement vertical sur un vrai téléphone. Ce n'est pas mesurable en simulé.

LEÇON PROPOSÉE : aucune
