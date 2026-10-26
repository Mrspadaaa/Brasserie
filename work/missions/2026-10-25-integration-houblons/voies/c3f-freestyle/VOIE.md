# Voie c3f-freestyle — collecter les fiches de Freestyle Hops, avec l'autorisation déclarée (#180)

Agent : auteur (Sonnet). **Lis d'abord `voies/c3-COMMUN.md`** : les règles de collecte, de sortie et les critères communs. Ce fichier
n'ajoute que ce qui est propre à cette source.

## L'autorisation (26.10)
- La voie c3c n'a pas lu `freestylehops.com` : son `robots.txt` interdit ClaudeBot, Claude-Web et anthropic-ai, avec `ai-train=no`.
- L'utilisateur, mot pour mot : « Tu peux y aller, j'ai eu leur autorisation explicite. Pour un usage non commerciales, c'est bon,
  tu dois juste pas être trop intrusif ».
- Inscris cette autorisation dans la table des sources de `src/data/hopSources/freestylehops.json` : `diffusion`, `autorisation`
  (citation, date 26.10, « déclarée par l'utilisateur »). Les données ne servent à aucun entraînement d'IA : elles vont seulement
  dans l'app.

## Règles propres à cette source
- **Peu intrusif** :
  - une requête toutes les **2 secondes** au plus, une seule à la fois ;
  - l'agent utilisateur honnête du script existant ;
  - seulement les pages de variétés, et leurs fiches PDF quand elles y sont liées ;
  - aucun autre chemin ; au plus 80 requêtes en tout. Compte-les et rends le compte.
- Le moindre 401, 403, 429, ou une page de défi anti-robot : arrête tout et écris-le. Pas de contournement.
- Les fiches PDF en image se lisent avec l'outil Read, comme dans la voie c3e : lecture visuelle notée, case illisible `null`.

## Sortie
- `scripts/collecte-hop/freestylehops.mjs` (`--offline` depuis le cache) ;
- `src/data/hopSources/freestylehops.json` ;
- `tests/unit/hopIndexV4/collecteFreestylehops.test.ts` ;
- `voies/c3f-freestyle/couverture.md`, avec Nelson Sauvin, Motueka, Riwaka et Nectaron en tête s'ils y sont.

Ne modifie ni `fusion.mjs` ni `complements.json` : le pilote les régénérera. N'écris aucun code par heredoc ni par `node -e`.

Écris RESULTAT.md tôt. Retour en une ligne.
