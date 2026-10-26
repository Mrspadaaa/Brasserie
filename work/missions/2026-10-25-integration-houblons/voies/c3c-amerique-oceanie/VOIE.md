# Voie c3c-amerique-oceanie — collecter les fiches des fournisseurs américains et océaniens (#180)

Agent : auteur (Sonnet). **Lis d'abord `voies/c3-COMMUN.md`** : les règles de collecte, de sortie et les critères communs. Ce fichier
n'ajoute que ce qui est propre à tes sources.

## Tes sources, une par fichier de sortie, dans cet ordre
1. **Yakima Chief Hops** : `yakimachief.com`, pages de variétés.
   - Le 19.10, WebFetch y recevait un 403.
   - Essaie une fois, poliment, après le `robots.txt`. Si c'est encore 403, arrête cet hôte et écris-le.
2. **USA Hops / Hop Growers of America** : `usahops.org`, le « Variety Manual » s'il est public (PDF).
3. **Crosby Hops**, **Hops Direct**, **Yakima Valley Hops**, **BSG**, **Indie Hops** : leurs fiches de variétés, quand elles sont
   chiffrées.
4. **NZ Hops** (`nzhops.co.nz`), **Freestyle Hops** (Nouvelle-Zélande) et **Hop Products Australia** (`hops.com.au`) : fiches
   et PDF. Pour Nelson Sauvin, Motueka et Riwaka, la source d'origine compte.

Un site sans fiches chiffrées, ou bloqué : une ligne dans le rapport, et passe au suivant. Pour lire un PDF, cherche d'abord une
bibliothèque déjà dans `node_modules`. N'installe aucun paquet.

`<source>` = `yakimachief`, `usahops`, `crosbyhops`, `nzhops`, `hpa`, … : un script, un JSON et un test par source.

Écris RESULTAT.md tôt et complète-le. Si tu approches ta limite de tours, garde ce qui est collecté et écris ce qui reste.
