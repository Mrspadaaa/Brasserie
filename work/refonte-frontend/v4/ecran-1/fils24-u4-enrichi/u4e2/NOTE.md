# u4e2 · Substituer · u4 enrichi, une petite variante

- Chaleur : froide (l’idée retenue, affinée : u4 enrichi, un seul point touché).
- **Le point touché** : les arômes à côté du score : pictos cerclés à leur valeur.

## Ce qui change
Sous chaque nom, les familles de sa stout (floral, herbacé, terreux | résineux) en pictos : marqué = picto dans un cercle épais à la couleur de la famille, cité = picto seul, non décrit = cercle pointillé vide. Plus d’en-tête de colonnes : le picto dit la famille.

## Ce qui tient
Se lit sans légende : Nelson Sauvin et Yeoman n’ont que des cercles vides, Idaho 7 a les quatre pictos.

## Ce qui casse
Lignes plus hautes (46 px) : Zenia arrive au ras du pied. Un « non décrit » n’a pas de picto : sa famille se lit par sa place (même ordre sur chaque ligne).

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
