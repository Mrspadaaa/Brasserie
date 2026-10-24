# u4e5 · Substituer · u4 enrichi, une petite variante

- Chaleur : froide (l’idée retenue, affinée : u4 enrichi, un seul point touché).
- **Le point touché** : au dry hop, le tableau « Arômes 16D » à côté des scores.

## Ce qui change
Au dry hop seulement, l’échelle devient le tableau qu’il a coché (« Ça c’est vraiment bien »), couché : une ligne par remplaçant, une colonne par famille (attendues 16D sur fond gris, puis les familles hors style qu’au moins une fiche décrit), 2 crans cité / marqué, pointillé = non décrit, et le score au bout (point, ou plage soulignée de hachures). Dessous : « Pépins, Melon, Végétal : aucune fiche ne les décrit, ce n’est pas zéro. » À 60′ et au whirlpool, u4 enrichi tel quel.

## Ce qui tient
Au dry hop, l’arôme répond au premier écran, famille par famille, pour les huit remplaçants, Nugget en tête pour comparer.

## Ce qui casse
L’échelle 50–100 (partiel, proche, très proche) disparaît au dry hop : le score n’y est plus qu’un nombre. Dix colonnes de 15 px : les crans sont petits ; le tableau du face à face, plus bas, se répète en partie.

## Commun aux cinq
- Base : u4 enrichi (voie r9, D127), lui-même u4 (« Substitution, ça serait plus du u4 », D34). Tout le reste est identique à
  sa capture `prototypes/houblons-v4/maquettes/parcours-substituer/captures-d127/d127-60.png` (et `-dryhop.png`).
- Page figée : le DOM rendu par la maquette jouable (`substituer/etat.html?u4e=<id>`, moteur v4 en direct au rendu), copié avec
  sa `style.css` (classes `pq-substituer-` renommées `u4e-`, ids de React renommés) par `outils/figer.mjs`. Trois états
  joués par la puce : 60′, whirlpool, dry hop. « ? » ouvre la légende ; appui long ou survol : la fiche figée du houblon ;
  « + » (ou la case) fait monter « Comparer (n) ».
- Figé, donc inerte ici : toucher un remplaçant le marque sans changer le face à face ; « Comparer › », « Remplacer »,
  « Annuler », la croix et la lentille Au style · Absolu ne mènent nulle part (ils marchent dans la maquette jouable).
- Baseline : pictos de famille au trait, couleurs des familles, α et rôle en mot, lentille au style, stock en icône, thème
  blanc. Honnêteté : plage hachurée pour une composante inconnue, pointillé = non décrit, « ce n’est pas zéro », « ~ simulé ».
- Captures : `captures/<id>-premier-ecran.png`, `captures/<id>-dryhop.png` (390 × 844, ×2) ; côte à côte avec u4 enrichi :
  `captures/cote-premier-ecran.png`, `captures/cote-dryhop.png`.

## Contrôle (rejoué sur les cinq)
```
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
