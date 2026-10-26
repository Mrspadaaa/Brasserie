# Voie c3h-beer-analytics — l'usage des houblons dans les recettes, par Beer Analytics (#180)

Agent : auteur (Sonnet). **Lis d'abord `voies/c3-COMMUN.md`** : les règles de collecte, de sortie et les critères communs. Ce fichier
n'ajoute que ce qui est propre à cette source.

## Ses mots (26.10)
Après les pages Galaxy de Yakima Valley Hops, de HPA et de BarthHaas, il envoie : https://www.beer-analytics.com/hops/dual-purpose/galaxy/

## Ce qu'est cette source
Beer Analytics publie des **statistiques de recettes**, pas de la chimie : pour chaque houblon, sa part dans les recettes, les
styles où on l'emploie, les quantités, les moments d'ajout (ébullition, whirlpool, dry hop) et les houblons qui l'accompagnent.
C'est l'usage réel du houblon. Il servira à Suggérer, à Dryhopper et aux accords, pas aux familles d'arôme.

## À faire
1. Lis le `robots.txt` de `www.beer-analytics.com` et ses conditions, s'il y en a. Respecte-les. Au plus 1 requête toutes les
   **2 secondes**, une seule à la fois, et compte les requêtes.
2. Trouve la liste des houblons du site (par catégorie : aroma, bittering, dual-purpose…), puis lis chaque page de houblon.
   - S'il y en a plus de 400, fais d'abord les houblons du catalogue (`proto-data.json`), puis les autres.
   - Si les chiffres sont chargés par un module (graphique), trouve leur source dans la page en cache. Une adresse publique,
     permise par le `robots.txt` : lis-la ; sinon, arrête et écris-le.
3. Garde tout ce qui est publié, tel quel, avec l'URL et la date :
   - le nombre de recettes ;
   - la part par style (code du style et pourcentage) ;
   - les quantités (moyenne, médiane, plage), dans l'unité publiée ;
   - la répartition par moment d'ajout, et le temps typique ;
   - les houblons associés et leur fréquence ;
   - toute autre statistique.
4. Sortie : `scripts/collecte-hop/beeranalytics.mjs` (`--offline` depuis le cache), `src/data/hopSources/beeranalytics.json`, et
   un test du lecteur sur un HTML synthétique.
5. Rapport `voies/c3h-beer-analytics/couverture.md` : les houblons trouvés, rattachés au catalogue ou nouveaux, et pour Galaxy,
   Citra, Nelson Sauvin et Motueka, ce qui a été lu.

Ne modifie ni `fusion.mjs` ni `complements.json`. D'autres voies sont en vol : c3g corrige les lecteurs de `scripts/collecte-hop/`,
ne touche pas aux siens. N'écris aucun code par heredoc ni par `node -e`.

Écris RESULTAT.md tôt. Retour en une ligne.
