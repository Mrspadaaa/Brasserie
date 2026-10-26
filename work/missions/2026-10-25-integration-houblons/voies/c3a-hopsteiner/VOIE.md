# Voie c3a-hopsteiner — collecter toutes les fiches Hopsteiner (#180)

Agent : auteur (Sonnet). **Lis d'abord `voies/c3-COMMUN.md`** : les règles de collecte, de sortie et les critères communs. Ce fichier
n'ajoute que ce qui est propre à ta source.

## Ta source
- Hopsteiner, en Allemagne et aux États-Unis. Le catalogue relie déjà des fiches par `hopsteinerId` et `hs.reference`, par
  exemple `https://www.hopsteiner.de/en/products/all-hop-varieties/detail/nsn` (Nelson Sauvin). Le linalol du catalogue
  (`hsLinalool`, 64 variétés) vient de là.
- Pars de la liste complète des variétés, `https://www.hopsteiner.de/en/products/all-hop-varieties` et ses pages, puis lis chaque
  fiche de détail. Cherche aussi des fiches techniques en PDF ou un guide publics, liés depuis ces pages.
- Le 19.10, `hopsteiner.com/variety-data-sheets/…` rendait 404 : ne devine pas d'URL, suis les liens.
- Attendu : α, β, cohumulone, huile totale, et la composition de l'huile (linalol, géraniol, farnésène, myrcène, β-pinène…).
  Prends aussi la classe « Thiol impact », les arômes déclarés, les substituts et tout autre champ.

`<source>` = `hopsteiner` : `scripts/collecte-hop/hopsteiner.mjs`, `src/data/hopSources/hopsteiner.json`,
`tests/unit/hopIndexV4/collecteHopsteiner.test.ts`.

Écris RESULTAT.md tôt et complète-le. Si tu approches ta limite de tours, garde ce qui est collecté et écris ce qui reste.
