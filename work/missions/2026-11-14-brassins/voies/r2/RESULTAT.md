OK — quatre Recettes de genres neufs : prête ou il manque, voisines, carnet qui se range, roue des goûts

## Série
- r2a froide : Prête à brasser, ou il manque (genre 6). Problèmes 7, 5, 8, 1.
- r2b tiède : Les recettes voisines (genre 5). Problèmes 9, 4, 3.
- r2c tiède : Le carnet se remplit et se range seul (genre 7). Problèmes 6, 1, 4. IA simulée.
- r2d chaude : Le carnet par le goût, roue des 12 familles d'arômes (combinaison 3 × 6). Problèmes 3, 1, 9.
- Données : 5 recettes réelles (NEIPA, Pale Ale, Pils, Stout, Saison), 30 d'exemple ; le fictif est dit dans chaque NOTE.md.

## Fichiers écrits (OWNS seul)
- `work/missions/2026-11-14-brassins/voies/r2/capture.mjs`, `tests.txt`, `RESULTAT.md`
- `r2a/`, `r2b/`, `r2c/`, `r2d/` : `etat.html`, `NOTE.md`, 5 PNG chacun ; `r2c/r2c-repos-1280-clair.png`

## Critères (sorties dans `tests.txt`)
- G1 : `SERIE OK`
- G2 : `IDENTITE OK 4/4`
- G3 : `NOTE OK 4`

## Captures (toutes ouvertes)
- `work/missions/2026-11-14-brassins/voies/r2/r2{a,b,c,d}/r2?-{repos-390-clair,geste-390-clair,recette-390-clair,vide-390-clair,repos-390-cave}.png`
- 1280 : `work/missions/2026-11-14-brassins/voies/r2/r2c/r2c-repos-1280-clair.png` (r2c retenue comme la meilleure : elle répond à ses mots « recette US … levure de chez nous » et à sa vraie « neipa v3 » V1). Défaut vu : à 1280, la colonne gauche reste vide sous « Verser une recette » ; en passe 2, y porter le journal « Rangé tout seul ».
- Cibles < 44 px : 1 à 390 sur chaque maquette (bouton thème du chrome commun), 6 à 1280 (boutons secondaires à la souris).

## Prédiction
Il s'arrête sur r2c (« ça, ça règle mon problème des recettes US ») et sur r2d pour l'effet de la roue, en demandant si le goût d'une recette est vraiment calculé.

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : les noms français des 12 familles vivent dans `src/domain/hopIndex/v4/levels.ts` l. 190-192 (Agrumes, Tropical, Melon, Noyau, Pomme-poire, Petits fruits, Floral, Herbe, Herbacé, Épicé, Terreux, Résine).
LEÇON PROPOSÉE : aucune.
