# Ma bière, l'onglet (route biere ; voie p1-ma-biere, reprise D105, 23.10)

## Base

- La base v4.10 qu'il a choisie : `work/refonte-frontend/v4/ecran-1/base/consolide/biere.html`, capture
  `base/captures/consolide-biere-390.png` (« Ça aussi », 23.10) ; radar : `consolide-biere-radar-390.png`.
- Inventaire : `work/refonte-frontend/v4/ecran-1/base/donnees/inventaire-ma-biere.json` (11 éléments).

## Reprise

- biere-onglets : repris — en tête, « ‹ » et « Ma bière · Suggestions · Comparer » (Onglets du socle), Ma bière active
- biere-bandeau : repris — le bandeau IBU (jauge au style), OG, EBC, en pilule
- biere-alerte : repris — « Résineux trop marqué », point rouge, à gauche de « Barres / Radar »
- biere-reglages : repris — « Barres / Radar » et « Au style / Absolu » (SegmentedControl de l'app)
- biere-decompte : repris — « 6 au style · 5 non situées », compté sur le profil du moteur
- biere-legende : repris — les pastilles « dégusté 18.10 · prévu · non situé », puis « zone du style · au-dessus »
- biere-barres : repris — une barre par famille : zone du style, « au-dessus » en pointillé, point plein ou creux, hachuré
- biere-hors-style : repris — la famille hors du style en rouge, son facteur à droite (« ×2,8 », centre ÷ haut de la bande)
- biere-bannir : repris — la famille touchée s'ouvre sous sa barre : « bannir · − · sans visée · + » (résineux ouvert au repos)
- biere-objectifs : en pont — Suggérer : « + floral », « − résineux », « + … » ouvrent Suggestions ; « + floral » est le pont-floral
- biere-levure : repris — « Prévu avec SafAle US-05, caractérisée » au pied de l'écran

## Idées reprises

- Les objectifs suivent les visées posées sous les barres : « bannir floral » remplace « + floral », et l'inverse.
- Le radar m4 à un toucher (« Barres / Radar »), au style ou en absolu.

## Écarts

- Un picto de famille devant chaque nom : le code couleur des arômes est un acquis, et l'écran passe COULEURS (D74).
- La visée n'est pas encore lue par Suggérer (sa route n'a pas de paramètre) : tous les objectifs ouvrent Suggestions.

## Pour l'app

- `src/ui/hops/RecipeProfile.tsx`, route `{ view: 'recipe', tab: 'beer' }` ; les visées (bannir, −, +) entrent dans le
  brouillon de la recette (`useRecipeDraft`) et dans la direction passée à Suggérer (`proposeVoies`).
- La dégustation (18.10) vient de la fixture du moteur : à brancher sur les dégustations de Dexie.
