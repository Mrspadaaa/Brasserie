---
name: rien-de-fige
description: 18.10 — rien de figé sur un exemple : ébullition, dose, whirlpool, jour de dry hop se règlent ; minutes par pas de 5′.
type: brasseur
maj: 2026-10-22
sources: mémoire locale affinee-variables-dynamiques.md
---

Le brasseur : « toujours garder des variables dynamique car cela peut changer... Je peux me dire tiens 200' c'est mieux ou 45' ça le fait aussi ». Avant : « pas de timing imposé » et « c'est des tranche de 5' » (37′ ou 22′ étaient absurdes).

**Pourquoi** : il expérimente ; une valeur prise comme exemple (60′, 120′, 80 °C, J+3) devient vite une contrainte cachée dans l'interface ou les données.

**Comment l'appliquer** : tout paramètre de procédé se règle là où il sert (durée d'ébullition, moment par pas de 5′, dose, température et durée du whirlpool, jour du dry hop) ; les tables du moteur couvrent la plage réaliste (0 à 240′), pas seulement l'exemple ; un test à 60′ ou 120′ est un cas, jamais une borne. Voir [[penser-brasseur]] et (leçon L13).
