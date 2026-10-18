# Générateur de p08 (lot 3, retenue pour son rail des étapes)

Copie, le 18.10, du générateur de l'auteur de p08 (`scratchpad/fils3-p08p09`), sans ses
correctifs ponctuels (`patch-*.cjs`, déjà appliqués à `p08.html`).

- **Construire** : `node build.mjs` lit le pack (`prototypes/houblons-v4/data/`) et réécrit les
  9 pages de `ecran-1/fils3/p08/`.
- **Gabarit** : `p08.html` (étape avec le rail des moments, tableau au style, parties) ;
  pièces communes dans `commun.js`.
- **Juge** : `work/refonte-frontend/v4/tournoi/outils/controle-lot.mjs`.
