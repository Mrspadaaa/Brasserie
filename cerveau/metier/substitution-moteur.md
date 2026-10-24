---
name: substitution-moteur
description: Ce que mesure le score de substitutes() selon le moment (60′, 10′, whirlpool), et pourquoi Substituer ne répond pas à « moins résineuse » sur la stout.
type: metier
maj: 2026-10-24
sources: RESULTAT.md des voies p1-ma-biere, sb-a, sb-b, sb-c, sb-d, sb-u, sb-z, r6-substituer de work/missions/2026-10-23-maquette-parcours/voies/ ; work/refonte-frontend/v4/ecran-1/fils24-substituer/
---

Relevé par le lot Substituer (D125, 24.10 ; u4 choisi, D34).

- **Le score à 60′** (poids amertume 0,6, arôme 0,2, huiles 0,2) : l'« arôme » de `substitutes()` mesure l'absence
  d'arôme étranger, pas la ressemblance. Nelson Sauvin vaut 100 en perdant six familles, Magnat 99 avec une autre
  silhouette. Ne jamais l'afficher seul comme une ressemblance (honnêteté, « arôme 100 »).
- **Stout 16D, Nugget** : aucun remplaçant en stock ne baisse le résineux de plus de ~1 point (il reste hors style, 82 à
  85). Substituer y répond sur l'amertume, la matière et le stock, pas sur « moins résineuse ».
- **Le moment change tout** : au 60′, 137 remplaçants très proches ; dès 10′ (arôme 0,6), 8, et Nelson Sauvin passe de
  86 à 42. Au whirlpool l'ordre s'inverse : Target 86, Idaho 7 82, Magnat 77, Nelson Sauvin 42 ; sur 318, Nelson passe de
  la 73e à la 236e place ; Target (94, 213e) et Citra cryo (88, 215e) sont « chers pour amériser ».
- **Outil** : `vite-node --root C:/Users/mrspa <script.ts>` fait tourner `substitutes()` hors du projet (le root large
  lève la garde `server.fs`).
