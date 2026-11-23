# Audit des invariants du modèle aromatique

8 septembre 2026 — moteur actuel `hop-experimental-v4`, coefficients initiaux `2026-09-08.2`.

## Défauts corrigés

La marge documentaire utilisait auparavant la source la moins favorable : retirer cette source pouvait rétrécir une plage. Elle utilise désormais la meilleure contrainte disponible, sans additionner des citations comme des observations indépendantes. Sans description correspondante, la marge reprend le maximum documentaire prévu.

À dose nulle, la marge d’ignorance du houblon dépendait encore de ses descriptions. La marge spécifique au houblon est maintenant pondérée par son apport maximal possible ; l’incertitude structurelle reste présente sur le résultat total.

Le produit intermédiaire de constantes pouvait tomber à zéro avant une division. Le contre-exemple `k=s=2^-538, d=2^-1074` donne une réponse réelle de 0,8, alors que le produit flottant direct perd l’information. La réponse de dose utilise les logarithmes des facteurs, avec une branche explicite à dose nulle. Ce calcul est une approximation flottante, pas un arrondi extérieur certifié.

Une comparaison utilisant des critères différents selon le type des deux candidats pouvait créer un cycle. L’ordre commun utilise désormais borne basse, largeur, puis identité stable. Les exclusions du solver sont séparées des scores et empêchent l’application d’un conflit établi.

Les descriptions de bière fermentée sont exclues des descripteurs intrinsèques d’une variété. Elles restent des preuves documentaires de leur contexte.

## Proposition vérifiée, portée exacte

Les quatre vérifications adversariales favorables portent sur les hypothèses explicites suivantes. Le modèle, ses courbes, ses coefficients, la levure et le timing restent fixes. On oublie seulement une description variétale, sa date ou une valeur de dose/contact/forme/température. Ce n’est **pas** un théorème sur la suppression de modèles ou de sources de coefficients.

Toute mention survivante sélectionne exactement le même intervalle fixe `P_mentionné`, inclus dans `[0,1]`. Sans mention, l’intervalle est `[0,1]`. Forme et température interviennent uniquement dans les surcharges, pas dans les autres facteurs. La même surcharge s’applique à une température manquante et hors fenêtre.

Avec tous les facteurs non négatifs :

```
H = P × G_dose × Q_contact × expression × gain × matrice
m = meilleure marge documentaire + surcharges forme/température
u = m × (1 − exp(−H_max))
L = clamp(1 − exp(−H_min − Y_min) + R_min − u)
U = clamp(1 − exp(−H_max − Y_max) + R_max + u)
```

`Y` est l’arôme fermentaire, `R` le résidu structurel et `clamp` borne sur 0–1.

Oublier une donnée élargit un facteur, laisse les autres fixes et ne diminue pas `m`. Ainsi `H_min` ne monte pas, `H_max` ne baisse pas, et `u` ne baisse pas. Le clamp est monotone : l’intervalle final contient l’ancien. À dose connue nulle, `H=u=0` ; le fond levure et le résidu restent. Un repère central calculé avec des valeurs dans chaque intervalle, y compris le résidu, est contenu dans cette plage.

Pour la courbe transférée, `G=(1-w)D+wS` conserve **le même poids** dans les deux termes. À poids fixé, les extrema sont aux bornes ordonnées de D et S ; l’expression est ensuite affine en w, donc ses extrema sont à ses deux bornes. La boîte peut surestimer un domaine dépendant plus petit, sans hypothèse d’indépendance statistique. La conservation de toute la réponse D exige que w contienne zéro ; le défaut utilise l’intervalle complet `[0,1]`.

Le classement lexicographique de coordonnées fixes est transitif. Pour un arôme à éviter au-delà de q : `L>q` établit un conflit dans le modèle ; `U<=q` reste sous ce repère ; les autres cas sont inconnus. Cette partition n’est pas une preuve d’absence sensorielle réelle.

## Limites qu’une preuve ne supprime pas

La forme sensorielle exponentielle, les priors de levure et leur échelle sont des choix expérimentaux. Le produit de plusieurs facteurs ne permet pas de les identifier séparément sans observations adaptées. Une formule cohérente peut être mal calibrée.

Les enveloppes ne sont ni des intervalles de confiance statistiques ni des probabilités. Le transfert de la courbe Cascade ne valide pas d’autres variétés, souches, procédés ou mélanges. Les paramètres d’extraction, l’oxydation, la rétention et les interactions restent imparfaitement connus.

Le gain de précision devra être mesuré sur des brassins et lots indépendants avec prédictions figées avant dégustation. Les cas hors domaine, les échecs et les bières commerciales dont le contexte est connu doivent rester dans ce suivi.

## Historique et vérification logicielle

Le moteur v3 est conservé dans `functions/src/hopExtrapolationV3.ts` pour rejouer les anciennes preuves. Les courbes nouvelles ne sont acceptées que dans les instantanés v4. Les tests couvrent les contre-exemples, les domaines des essais, la perte de données, le mélange à poids commun, les exclusions, la conservation de recette et la migration du seul défaut intact. Les tests locaux n’appellent pas Gemini.
