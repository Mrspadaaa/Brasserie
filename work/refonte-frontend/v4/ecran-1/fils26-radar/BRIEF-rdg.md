# Série rdg — rdf1 pour base, les données manquantes en valeur (25.10)

## Sa demande, mot pour mot
Sur la page « Radar Beer Maverick » (rdf1 à rdf5) : « C'est beaucoup mieux mais ça met pas assez en valeur les données
manquantes. Reprend ça comme base et regarde toutes mes critiques sur ce radargraph et fait des versions pour résoudre ça ».

La base est **rdf1**, son radar de Beer Maverick tel quel. On garde sa grammaire :
- anneaux chiffrés ;
- zéro sur un petit anneau ;
- segments droits et points ;
- remplissage translucide ;
- houblons superposés ;
- légende en carrés.

Plancher à enrichir : chaque version garde tout cela et résout ses critiques.

## Toutes ses critiques sur le radar (`SPEC-BRASSEUR.md`), à résoudre
1. **L'inconnu**, sa demande d'aujourd'hui :
   - « attention au piège, souvent les spidergraph ne montre pas que certaines données sont inconnus et du coup ont les traitements comme connue mais valeur à 0 » (D65) ;
   - « Parcontre ça manque pas que certaines données sont manquantes.. » ;
   - « ça met pas assez en valeur les données manquantes ».

   Dans rdf1, l'inconnu ne se voit pas : pomme, melon et vert sont retirés du radar, et l'inconnu d'un houblon est un petit point creux sur l'anneau 0, qui se lit comme un zéro.
2. **Les 12 axes** : « Il y a pas 12 radar ? ». Retirer un axe cache une donnée manquante.
3. **Les couleurs** :
   - « très compliqué à voir les différence avec les cileur sur le spider graph » (« surtout genant » dans Comparer) ;
   - « "normaliser" l'affichage, les forme. couleur aromonisé ça coorectement ».
4. **Le moment** : « Le radargraph doit être normalisé aussi sur le 60' 10' ect en mode style. Car 2 houblons différents à 60' doivent être bien maqué sur les différences, pas que pour le dryhopping ». rdf3 rechiffre l'échelle au moment.
5. **La place** :
   - « Mettre plus le radargraph en avant » ;
   - « Spidergraph, radar graph bonne taille mais à revoir » ;
   - « Pas centré » ;
   - « radar beaucoup plus grand ».
6. **La lisibilité** : « Spider graph radar graph toujours assez peu lisible ».
7. **Les pics** : « le spidergraph doit être en pic pas juste des traits » (des formes pleines) ; « l'affichage des pic du radar sont toujours pas bon ».
8. **Le texte** : « attention à pas surchargé en texte ni en légende ».
9. **Les intervalles** : « Comparé : radar p2 mais avec ajoute d'intervalle de confiance ».

## Les versions
Ce sont rdg1 à rdg8, sur les mêmes données et dans les mêmes trois états que rdf. Chacune donne une réponse franche et
différente à la question 1, en gardant les 12 axes (2), des couleurs bien distinctes (3), l'échelle du moment écrite (4,
comme rdf3), un radar grand et centré (5) et peu de texte (8). Pistes, à toi de les dépasser :
- le secteur d'un axe inconnu pour tous, grisé ou hachuré sur toute sa profondeur, son nom suivi de « ? » ;
- l'inconnu d'un houblon : son contour s'interrompt (pointillé) au lieu de toucher l'anneau 0, avec une marque « ? » à sa couleur sur l'axe ;
- un anneau de couverture : sur le bord, pour chaque axe, une coche pleine par houblon décrit, creuse sinon ;
- un compteur discret : « 3 familles sans donnée » ;
- l'intervalle d'un houblon (bas, haut) en bande pâle autour de son contour, quand la donnée existe ; rien quand elle manque.

Règle : un inconnu n'est jamais dessiné comme une valeur. On ne voit ni point, ni remplissage, ni trait plein qui
l'atteint.
