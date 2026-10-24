# u4e3 · Substituer · u4 enrichi, une petite variante

- Chaleur : froide (l’idée retenue, affinée : u4 enrichi, un seul point touché).
- **Le point touché** : l’IBU encore moins présent : l’arôme en titre (passe 2 : une seule réponse).

## Ce qui change
La réponse nomme la tête de l’échelle, au moment choisi, par l’arôme d’abord : à 60′ « Magnat garde floral et résineux de ta stout ; Yeoman, aucune. », puis, en gris, « Magnat et Yeoman, 99 sans inconnue. Altus, Trident, Zenia vont de 78 à 99. » ; au dry hop « Target garde floral, herbacé et résineux de ta stout, perd terreux. », puis « Target, 86 sans inconnue. ». Au face à face, la dose et l’IBU passent dans une ligne discrète (« 46 g · 59,7 IBU ») et la droite de chaque bande prend les crans de sa stout ; le titre devient « Face à face · doses à IBU égal ».

Passe 2 (rejet du critique : D98, D94, deux réponses à « lequel me remplace ? ») : la v0 titrait « Idaho 7 garde le plus de ta 16D » quand l’échelle mettait Magnat 99 en tête (Idaho 7 troisième, 93). Le titre lit maintenant les premiers rangs de l’échelle (les meilleurs sans inconnue, sinon le premier, rangés par le pire cas) : titre et échelle disent le même gagnant, à chaque moment.

## Ce qui tient
Le premier mot lu reste l’arôme du gagnant, plus un nombre d’IBU, et c’est le gagnant de l’échelle. La dose reste exacte, et entière dans le pied (« 46 g de Nugget → 62,5 g de Nelson Sauvin »).

## Ce qui casse
À 60′ le gagnant est choisi par un score où l’amertume pèse 0,6 : le titre dit honnêtement que Yeoman ne garde aucune famille de sa stout, mais il ne propose pas celui qui en garde le plus (Idaho 7) ; pour classer sur l’arôme, il faudrait changer le classement (une autre question).

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
