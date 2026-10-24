# Consignes remplacées

Quand une leçon ou une décision change une règle, l'ancienne formulation est inscrite ici. Un motif par
ligne (expression régulière, sans tenir compte de la casse). `node scripts/agents/systeme.mjs remplaces`
échoue si l'un de ces motifs survit quelque part :
- dans CLAUDE.md ou le cerveau ;
- dans les agents, les skills `voies` et `conseil`, les règles ou `docs/agents/` ;
- dans la mémoire locale de la machine.

Une ligne qui cite l'ancienne consigne comme une erreur (« - Erreur : », « remplacé ») n'est pas une consigne.
Corriger chaque copie, ne pas la contourner.

| Motif | Remplacée par | Depuis |
|---|---|---|
| `Obligatoire pour toute voie d'interface` | une interface est jugée par le critique ; le relecteur juge hors interface (L25) | 2026-10-22 |
| `passe par un relecteur` | le critique pour une interface (L25) | 2026-10-22 |
| `arbitre Opus/Fable\|session arbitre` | le skill `conseil` pour une décision lourde | 2026-10-22 |
| `Dans le doute, rejette` | un REJET cite sa règle ; un goût se signale (L27) | 2026-10-22 |
| `pas 40 \(L18\)` | L18 plafonne les agents et les tours, pas les variantes (M13) | 2026-10-22 |
| `ni REJET ni étoile\|ne classes? pas` | au tri, le critique classe tout le panel ; c'est une proposition, tout est montré (« vaste panel et ensuite ranking ») | 2026-10-22 |
| `Indicatif[^\n]*la baseline\|seuls trois points sont obligatoires\|Seuls l'honnêteté, le doigt` | la baseline est obligatoire même en v0 (« toujours suivre la Baseline ») | 2026-10-22 |
| `30 variantes au moins\|au moins 30 variantes\|3 à 8 variantes` | 48 concepts minimalistes au moins, en 6 séries de 4 à 12 (M13) | 2026-10-22 |
| `réduit à l'essentiel : la représentation qui répond\|environ 5 tours par concept` | un concept minimaliste = une idée sur un écran plein, environ 10 tours (M14) | 2026-10-23 |
| `publier à la même adresse\|à jour à la même adresse\|artefact privé, à jour seulement\|Source de la page :` | une version = un nouvel artefact daté, inscrit dans « ## Pages » de MISSION.md (« chaque version devrait en créé des nouveaux ») | 2026-10-23 |
| `nom de l'étape et sa position .* manquent dans l'en-tête` | le fil d'étapes seul dans l'en-tête de l'étape ; « Text header inutile » (D58, sur « Houblons 3/7 ») | 2026-10-24 |
