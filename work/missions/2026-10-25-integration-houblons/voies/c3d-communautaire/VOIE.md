# Voie c3d-communautaire — collecter les bases ouvertes et communautaires (#180)

Agent : auteur (Sonnet). **Lis d'abord `voies/c3-COMMUN.md`** : les règles de collecte, de sortie et les critères communs. Ce fichier
n'ajoute que ce qui est propre à tes sources.

## Tes sources, une par fichier de sortie
1. **HopDatabase** (`kasperg3/HopDatabase`, licence MIT) et **hops-json** (`stuartraetaylor/hops-json`).
   - Elles sont déjà en cache, aux révisions fixées dans `scripts/scrape-hop-community.mjs`.
   - L'ancien import n'en lisait que l'α, le β et l'huile totale. Extrais **tous** leurs champs (huiles détaillées, arômes,
     substituts, styles…).
2. **Hopslist** (`hopslist.com`) : une fiche par variété, souvent avec la composition de l'huile, les substituts et les styles.
   « All Rights Reserved » : seulement des valeurs et des listes, aucune prose.
3. **USDA ARS et GRIN** : les fiches de cultivars publiques de l'ARS (Corvallis), et les accessions de houblon de GRIN
   (`npgsweb.ars-grin.gov`), si elles portent des valeurs chimiques ou une lignée.
4. Si le temps le permet : l'index des houblons de Brewer's Friend, et d'autres bases ouvertes que tu trouves en suivant leurs
   liens. Une base sans valeurs : une ligne dans le rapport.

`<source>` = `hopdatabase`, `hopsjson`, `hopslist`, `usda`, … : un script, un JSON et un test par source.

Écris RESULTAT.md tôt et complète-le. Si tu approches ta limite de tours, garde ce qui est collecté et écris ce qui reste.
