# Solveur de sels — vérification du plan et résultat

Suite de cet audit : [profils, sources et interface du 6 septembre](water-style-audit.md).
Les mesures comparatives ci-dessous décrivent la passe initiale. Le solveur donne
désormais davantage de priorité aux planchers explicites Mg/Na ; NaCl porte une
borne de dose dérivée du sodium demandé. Les plages de HCO₃ par style ne sont
plus présentées comme une cible de pH sur le radar.

Le solveur minéral résout maintenant les sels simultanément. Le cas de référence
d’Angles, sur **30 L traités**, donne **CaCl₂ 5,6 g, Epsom 7,2 g, NaCl 1 g**.

| Ion | Cible (ppm) | Résultat (ppm) |
|---|---:|---:|
| Calcium | 100 | 99,9 |
| Magnésium | 25 | 24,8 |
| Sodium | 15 | 15,0 |
| Sulfate | 100 | 100,6 |
| Chlorure | 111 | 111,5 |

L’[URL fournie](https://www.moneaudebrassage.fr/?departement=04&commune=ANGLES&quartier=VILLAGE&beerstyle=01D%20-%20American%20Wheat%20Beer&NaCl=94.8200465034199&CaSO4=166.50834334056245&disabledAdditives=%5B%22KCl%22%5D)
encode un autre dosage : gypse et sel de table, ratio voisin de 1,7. Ce cas manuel
et la cible chiffrée à trois sels ont chacun leur test. La page consultée expose
des corrections manuelles ; nous ne prétendons pas reproduire son autosolveur.

## Corrections apportées au plan

- **Contraintes conjointes** : rejeter les moindres carrés non contraints ignore
  les optima sur un plafond. Le calcul traite explicitement `Cx ≤ plafond` et
  les doses positives, par ensemble actif.
- **Précision avant nombre de sels** : l’ordre inverse retiendrait une mauvaise
  recette à un seul sel. Les supports sont tous examinés ; parmi ceux à moins
  de 0,75 ppm pondéré du meilleur dosage pesable, le plus court est retenu.
- **Six colonnes, pas cinq** : le cas complet est un système sous-déterminé.
  Une régularisation numérique de 1e-9 stabilise les dépendances. Six sels ne
  garantissent pas qu’une cible arbitraire soit physiquement atteignable.
- **Aucun relâchement des plafonds** : si la source dépasse déjà une limite,
  son excès est annoncé et aucun ajout ne l’aggrave. Le KCl conserve son plafond
  d’apport de potassium de 50 ppm, règle existante, pas nouvelle valeur scientifique.
- **Pesée vérifiée** : choix entre les voisins au dixième de gramme, vérification
  des plafonds après arrondi, minimum 0,5 g (chaux : 0,1 g). Les chiffres rendus
  sont reconstruits depuis les doses réellement retenues, y compris au rinçage.
- **Alcalinité** : deux allers-retours ne garantissent pas la convergence. La boucle
  est bornée à douze, distingue stabilité, arrondi et compromis non stabilisé.
  Les compromis restants sont signalés, sans présenter une cible comme atteinte.
- **Cibles personnalisées** : leurs cinq valeurs sont réellement visées. Leur
  milieu de fourchette graphique ne remplace plus la valeur saisie, notamment zéro.

## Séparation des responsabilités

`water.ts` devient `water/index.ts`, qui conserve les imports publics.

| Modules | Responsabilité |
|---|---|
| `ions.ts`, `lsq.ts` | Arithmétique ionique et optimisation numérique indépendante |
| `substances.ts` | Composition des produits, pureté et contributions par gramme |
| `mashPh.ts`, `acid.ts`, `practice.ts` | Modèles et règles de brassage |
| `mineralSolver.ts`, `solver.ts` | Combinaisons minérales et coordination avec l’alcalinité |
| `plan.ts` | Répartition et recalcul des eaux depuis une pesée ; aucune dépendance au solveur |
| `solve.ts`, `solverMessages.ts` | Façade compatible et mise en texte des diagnostics structurés |
| `dilution.ts` | Recherche de dilution ; une résolution réutilisée par pourcentage |
| `labels.ts`, `parse.ts` | Libellés et lecture des cibles textuelles |

`hopBalanceHint` est dans `domain/hopBalance.ts`. Un seul type `IonBand` reste dans
`types`. Le moteur ne dépend pas de React. La répartition est une primitive
partagée avec le moteur, évitant une deuxième formule. L’extraction de toute la
logique d’écran et la révision scientifique des règles de pH restent hors périmètre.

## Comparaison reproductible

Exécuter `node scripts/compare-solveur.mjs` ; ancienne version fixée au commit
`6c4c409` (`--baseline=<commit>` permet de la choisir explicitement).

**12 eaux × 29 styles × 3 variantes = 1 044 plans.** Les profils historiques
proviennent des anciennes fixtures : ils ne sont pas les analyses actuelles de
ces villes. Deux eaux synthétiques couvrent les excès de dureté et de sodium.

| Variante | Objectif Mg / Na | Nombre moyen de sels |
|---|---|---:|
| A, conservée par défaut pour les styles | Minimum de la fourchette | 2,07 |
| B, cible numérique | Point cible | 2,14 |
| C, modérée | Mg ≤ 10, Na ≤ 20, minimum du style prioritaire | 2,18 |

La cible Mg/Na est une politique explicite, distincte des maths. Même en A, un
sel de magnésium ou de sodium peut transporter le sulfate ou le chlorure quand
cela améliore le profil sans franchir les plafonds. Une cible personnalisée utilise
B. Aucun basculement général vers B ou C n’est imposé par cette modification.

Sur ce banc : **aucun dépassement ajouté**, **1 044/1 044 plans à moins de 3 ppm
pondérés de la borne minérale continue**, les alcalins du plan étant fixés. Cette
borne n’est **pas** un optimum global prouvé pour sels + alcalinité + acides.
La recherche de dilution de la Pils sur Fribourg prend environ **12 ms**, p95
environ **13 ms** sur cette machine ; les performances mobiles peuvent différer.

La promesse « jamais pire que l’ancien » doit être qualifiée : en A, 17/348 plans
s’écartent davantage des cinq cibles de goût de plus de 0,1 ppm pondéré. Trois
écarts dépassent 1 ppm, tous sur Vienne, où le nouveau calcul corrige davantage
l’alcalinité au prix du sodium. Exemple NA-STOUT : AR -2,5 → 86,9 pour une cible
103 ; l’erreur minérale augmente de 9,9 ppm. Le sodium reste sous plafond.
Cinq cas sur les trois variantes gardent un compromis non stabilisé et un message
explicite. Aucun résultat n’est certifié exact pour masquer ces limites.

Le [CSV complet](water-solver-comparison.csv) donne les 1 044 mesures et dosages.
Le [résumé JSON](water-solver-comparison.json) conserve les écarts notables.

## Vérifications

Tests analytiques indépendants de l’optimiseur (plafond conjoint, colonnes
dépendantes, bornes nulles, comparaison à une grille exhaustive sur 40 problèmes),
100 cibles construites depuis des doses connues, balayages existants et tests
d’interface. Les anciennes assertions « jamais Epsom/NaCl/KCl » deviennent des
vérifications sur les concentrations, avec leur justification dans les tests.
La suite complète compte **1 154 tests réussis** (1 141 avant cette passe).

Contrôle réel du navigateur à 390 × 844 : Doser, ajout manuel de gypse et d’acide,
retour au calcul. Le ratio suit les sels, le graphe suit aussi l’acide ; graphe,
curseur et deux groupes de doses restent visibles ensemble. Aucun message d’erreur
JavaScript durant ce parcours. Un test couvre aussi Doser avec uniquement un acide
manuel à recalculer et aucune proposition de sels.

Les coefficients d’acidification et le modèle de grain ne sont pas modifiés. L’EBC
reste un indicateur de l’alcalinité selon les règles existantes ; il n’entre pas
dans l’objectif minéral du profil de goût. La mesure du pH au brassage reste
nécessaire pour la correction fine.
