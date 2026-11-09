# Mission 2026-11-09-levure-retours — ses cinq retours sur la Levure en ligne, et la recherche avancée des houblons

## Objectif
Ses mots du 09.11, avec cinq captures prises en ligne, versés à la fin de `work/refonte-frontend/v4/SPEC-BRASSEUR.md` :
« Pas mal de petit soucis, la recherche de base doit se faire sur le premier écran, comme pour malt et sucre, pas de renvoi, je
choisis la recherche avancée par moi même. La conduite de palier fonctionne infiniment mieux sur celle de base. Il y a des
problèmes d'alignement. dans la recherche clicker sur une levure n'importe où pas que son nom ouvre son sous menu. Faire la même
chose que levure pour la recherche pour les houblons ».

Lecture (étroite et réversible, L01) :
1. « Changer de levure » cherche sur place dans Ma levure, avec ses résultats dessous, comme le champ d'ajout de Malts/sucres
   (`src/ui/fermentescibles/Ajout.tsx`). Il ne renvoie plus vers Chercher. Chercher reste la recherche avancée, ouverte par son
   onglet.
2. La conduite de base revient dans Ma levure, à la place de la nouvelle (`etapeLevure/Conduite.tsx`). La conduite de base est la
   station « Conduite · température × jours » de `YeastRecipePlan` : sa capture de 4:06, paliers, ↕ ↔, éditeur du palier,
   Brouillon/essai, « Jours de bascule et légende ».
3. Corriger les défauts d'alignement relevés sur ses captures.
4. Dans Chercher, toucher n'importe où sur la ligne d'une levure ouvre son détail, pas seulement son nom.
5. L'étape Houblons garde sa recherche de base sur place (« Ajouter — houblon… », déjà là). Elle reçoit la recherche avancée de
   la levure : la même vue (c6b, facettes à comptes, axes, disponibilité), ouverte par son choix.

Fini, c'est :
- branché dans l'assistant de recette et atteint par le vrai parcours ;
- typé, testé, build vert ;
- joué dans Chrome à 390 tactile et 1280, dans les deux thèmes ;
- jugé par le critique ;
- déployé, puis joué en ligne sur une recette « ZZ TEST ».

## État de l'art
- Problème type : recherche à facettes avec comptes disjonctifs, appliquée à un second catalogue. C'est le même problème que la
  levure (mission 2026-11-09-levure-port, § État de l'art), plus une généralisation d'un composant de liste filtrée.
- Examiné :
  - les facettes sur mesure déjà écrites et mesurées pour la levure (`src/domain/levure/filtres.ts`, `recherche.ts`) ;
  - itemsjs (Apache-2.0), déjà écarté : il ne sait ni les plages ni les valeurs « non documentées » ;
  - l'index texte des houblons existant (`src/ui/hopIndex/parcours/adaptateur.ts`, `donnees()`).
- Décision :
  - pas de nouvelle bibliothèque ;
  - le moteur de facettes de la levure est rendu générique : un catalogue fournit ses axes, filtres et valeurs ;
  - la vue Chercher est rendue générique sur ce contrat ;
  - les houblons en sont une seconde instance, avec leurs données existantes ;
  - aucune copie parallèle du code de la levure (L11 : finir, pas une couche de plus).

c6b choisie : « Les deux suggestions sont bien, IMPLÉMENTE toutes ces vues maintenant » (09.11) ; l5b choisie : « Top ! » (09.11).

## Décisions
| Décision | Options | Décideur | État |
|---|---|---|---|
| Où ouvrir la recherche avancée des houblons | bouton près du champ d'ajout, ouvrant une couche de la pile de l'app ; onglet | pilote | tranchée : un bouton « Recherche avancée » près du champ, qui ouvre la vue dans la pile (comme Suggérer et Comparer), sans rien changer au repos de l'étape |
| Garder `etapeLevure/Conduite.tsx` | supprimer ; laisser non monté | pilote | tranchée : non monté, listé (rien supprimé sans accord) |

## Voies
| Voie | Objectif | Niveau | Agent | Modèle | Plafond | Possède | Dépend de | Contrôles | Décideur | Étape |
|---|---|---|---|---|---|---|---|---|---|---|
| r1 | Ma levure : recherche sur place, conduite de base, alignements | jugement | auteur | sonnet | 120 | `src/ui/etapeLevure/MaLevure.tsx`, `EtapeLevure.tsx`, `Conduite.tsx`, `etapeLevure.css`, `tests/integration/etapeLevure/etape*`, `voies/r1/**` | — | tsc, vitest, captures Chrome | pilote | reprise |
| r2 | Chercher : ligne entière, alignements ; recherche avancée générique et houblons | conception | auteur | opus | 120 | `src/ui/etapeLevure/Chercher.tsx`, `vues.css`, `src/domain/levure/**`, `src/domain/rechercheAvancee/**`, `src/ui/rechercheAvancee/**`, `src/ui/hopIndex/maBiere/Ajouter.tsx`, `src/ui/hopIndex/rechercheAvancee/**`, `tests/integration/etapeLevure/vues*`, `tests/unit/levure/**`, `tests/**/rechercheAvancee*`, `voies/r2/**` | — | tsc, vitest, captures Chrome | pilote | reprise |
| critique | les deux voies dans l'app, contre les maquettes et ses captures | jugement | critique | fable | 30 | `critique/**` | r1, r2 | VERDICT | pilote | — |

## Boucle de retour
- Une voie en échec est relancée au plus deux fois, avec toutes ses retouches dans un seul message (garde-jetons). Au-delà, le
  pilote réécrit son contrat.
- Le critique est obligatoire avant le déploiement.
- Une plainte nouvelle du brasseur va mot pour mot dans SPEC, puis devient un contrôle.

## Budget
Usage noté par le pilote avant et après.

## Sources
- `work/refonte-frontend/v4/SPEC-BRASSEUR.md` (09.11, fin)
- ses captures, copiées : `work/missions/2026-11-09-levure-retours/captures-brasseur/`
- `work/missions/2026-11-09-levure-port/MISSION.md`
- `work/missions/2026-11-09-ecran-levure/p2/c6b/` (maquette Chercher choisie)
- `work/missions/2026-11-09-ecran-levure/p2/l5b/` (Ma levure choisie)

## Signature
