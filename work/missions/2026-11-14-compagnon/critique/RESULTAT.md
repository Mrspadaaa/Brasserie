OK — tri : s3b, s2a, s2d

Synthèse : `work/missions/2026-11-14-compagnon/critique/SYNTHESE.md` (classement 1 à 12, 3 candidates avec 3 retouches chacune, 19 greffes, défauts numérotés par variante, défauts communs de la passe 2).

## Verdict par variante (tri : aucun REJET, le brasseur voit tout)
- **s3b** (les représentations) — ACCEPTÉ : « Là ça se lit direct, les barres et le feu. Mais pourquoi encore du vide en bas ? » 1re ; candidate.
- **s2a** (la base, l'attente en frise d'étapes) — ACCEPTÉ : « Propre, et enfin je sais où il en est. Mais le Rapide/Auto/Approfondi, toujours là ??? » 2e ; candidate.
- **s2d** (la frise du brassin) — ACCEPTÉ : « Ça c'est vraiment mon brassin, vachement bien. Mais le 2 j de marge sur la barre, à corriger. » 3e ; candidate.
- **s2b** (gestes datés à cocher) — ACCEPTÉ : « Très bien les gestes avec la date ; l'attente c'est vide. » 4e ; greffes : gestes datés, rappel daté, Citra décoché.
- **s2c** (l'attente occupée) — ACCEPTÉ : « La barre avant/après est top, mais je veux pas qu'on me demande combien de temps j'ai. » 5e ; greffe : la pile.
- **s1b** (carte verdict) — ACCEPTÉ : « Le 43 → 21 en gros, bien. » 6e.
- **s1a** (base en une rangée) — ACCEPTÉ : « C'est l'actuel en propre. » 7e.
- **s3c** (conversations d'abord) — ACCEPTÉ : « Mes conversations enfin claires, mais la réponse c'est un tableau. » 8e ; greffe : la liste à statuts.
- **s3a** (base, panneau à 1280) — ACCEPTÉ : « Les icônes en haut, je sais pas ce que c'est. » 9e ; greffe : le panneau à 1280.
- **s1c** (Fais · Pourquoi · Ensuite) — ACCEPTÉ : « Agir, mesurer, attendre, bonne idée ; le reste fait formulaire. » 10e.
- **s1d** (la phrase qui agit) — ACCEPTÉ : « Trop de texte. » 11e.
- **s3d** (la cuve parle) — ACCEPTÉ : « L'idée de toucher la cuve est marrante, mais les icônes en bas, c'est quoi ??? » 12e.

## Signal au pilote, avant la passe 2 (sens métier, données du dossier)
1. La question porte sur la pression ; les 12 répondent « Dry hop chargé ». Le verdict doit d'abord parler de la pression.
2. « 9,0 g/L, au-dessus de 6 à 8 g/L » est douteux pour une NEIPA : en pratique, souvent 8 à 16 g/L (estimé, non vérifié). À vérifier dans le moteur et `docs/` avant de garder le niveau « Attention ».
3. Citra J+2 est déjà ajouté à J+4. Six variantes et la frise de s2d l'appliquent encore au brassin en cours ; le modèle à suivre est s2b.

## Images ouvertes (plein format)
- `analyse/cap/planche-390-clair.png`
- `voies/s1/s1a/s1a-clair.png`, `voies/s1/s1b/s1b-clair.png`, `voies/s1/s1c/s1c-clair.png`, `voies/s1/s1d/s1d-clair.png`
- `voies/s2/s2a/s2a-clair.png`, `voies/s2/s2b/s2b-clair.png`, `voies/s2/s2c/s2c-clair.png`, `voies/s2/s2d/s2d-clair.png`
- `voies/s3/s3a/s3a-clair.png`, `voies/s3/s3b/s3b-clair.png`, `voies/s3/s3c/s3c-clair.png`, `voies/s3/s3d/s3d-clair.png`
- Cave des 3 candidates : `voies/s3/s3b/s3b-cave.png`, `voies/s2/s2a/s2a-cave.png`, `voies/s2/s2d/s2d-cave.png`
- Non ouvertes : les 9 autres captures cave. Les captures de s2 et de s3 ont été rouvertes ici après les retouches que leurs auteurs n'avaient pas revues.

## Critères
- G1 : `node work/missions/2026-11-14-compagnon/outils/controle-synthese.mjs` → voir `critique/tests.txt`.
- Tests : `node work/missions/2026-11-14-compagnon/outils/controle-synthese.mjs > work/missions/2026-11-14-compagnon/critique/tests.txt` (aucun Vitest).

LEÇON PROPOSÉE : le dossier d'un panel doit vérifier que la réponse type répond à la question type. Ici, une question sur la pression reçoit une réponse sur le dry hop, et les 12 variantes l'ont reprise sans la voir (L14 : « est-ce que ça existe en vrai ? » vaut aussi pour le couple question/réponse du dossier).
