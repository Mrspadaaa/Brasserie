OK — d1d : 3 bloquants corrigés ; 15 non bloquants de d1a à d1d ; 21 images refaites et ouvertes

## Bloquants (d1d, idée gardée : l'agenda de la cave, la Blonde posée sur un jour)
- [x] d1d n° 1 : pied « Semaine du 23 : F3, la Blonde fermente », barre ambre de la Blonde prolongée dans le pli (repos, geste, cave, 1280) ; au conflit (Blonde sur le 15, F3 vert ensuite), le pli reste « rien de prévu, F3 libre », comme ses lignes.
- [x] d1d n° 2 : ligne repliée « ✓ Tout est en stock · malts, Saaz, Hallertau, US-05 ⌄ » sous l'en-tête (bouton de 44 px, reprise de d1b) ; sous-titre « 24 L · en F3 · le stock se réserve à la planification » ; NOTE « Ce qui change » le dit.
- [x] d1d n° 3 : loin, pli « NEIPA à conditionner : date à fixer », sans mois.

## Non bloquants faits
- d1d n° 4 : « + ici » sur toute ligne où F3 est libre (jeu. 19 compris).
- d1d n° 5 et d1b n° 2 : dry hop en cône de houblon (icône Hop de lucide, celle de l'app, « Outils houblons »), case, ligne et légende.
- d1d n° 6, d1a n° 2, d1c n° 5 : « Pils en bouteille le 15 » en vrai bouton secondaire ≥ 44 px.
- d1d n° 7, d1a n° 1, d1b n° 1, d1c n° 6 : au conflit, pied « Planifier quand même » en gris (secondaire), plus le bouton noir.
- d1d n° 8 : colonne Jour dans la police du texte, chiffres tabulaires (plus de zéro barré à 1280).
- d1a n° 3 : « dim. », « mer. », « sam. » en tête des cases.
- d1a n° 4 : graduations du curseur, noms de jour dans la police du texte, chiffres seuls en mono.
- d1b n° 3 : NOTE dit le stock replié en une ligne.
- d1b n° 4 : chiffres des cases dans la police du texte, tabulaires.
- d1c n° 1 : raccourcis datés « mer. 25 », « mer. 2.12 » ; NOTE corrigée (geste « mer. 2.12 »).
- d1c n° 4 : NOTE dit la perte du disponible de r2a dans les pastilles.

## Non faits
- d1c n° 2 (point F3 sous chaque voisin) et n° 3 (picto de cuve) : pas une ligne ; l'app n'a pas de picto de cuve dans la trousse (lucide n'en a pas de juste).
- d1b : « 1er » sous le 18 reste en mono (hors verdict).

## Fichiers
- Écrits : `voies/d1/d1{a,b,c,d}/etat.html`, `NOTE.md`, leurs 21 PNG (`node capture.mjs d1d d1a d1b d1c`, `LARGE=d1d`) ; `voies/gd1/RESULTAT.md`, `tests.txt`.
- capture.mjs : aucune alerte (ni débord, ni cible < 44 px, ni erreur).

## Critères
- G1 : `COCHE OK 3` ; G2 : `IMAGES OK` ; IDENTITE : `IDENTITE OK 4/4` (sorties dans `tests.txt`).
- G3 : `HORS KO  M tests/integration/productionCatalog.test.tsx |  M tests/integration/recipeList.test.tsx` : ces deux fichiers sont
  ceux de la voie Recettes en cours (déjà modifiés au départ de gd1) ; gd1 n'a rien écrit hors de la mission. Le filtre du critère
  attend « ProductionCatalog » (majuscule) et ignore `tests/integration`.

DÉCISION À PRENDRE : élargir le filtre de G3 aux tests de la voie Recettes, ou le rejouer une fois celle-ci rendue.

## Captures (toutes ouvertes)
`work/missions/2026-11-14-brassins/voies/d1/d1d/d1d-{repos-390-clair,geste-390-clair,loin-390-clair,conflit-390-clair,repos-390-cave,repos-1280-clair}.png` ; d1a, d1b, d1c : `{repos,geste,loin,conflit}-390-clair`, `repos-390-cave`.

Prédiction : « Là oui, la Blonde reste dans F3 et j'ai mon stock à un toucher ; je choisis d1d. »

CONNAISSANCE : l'app marque le houblon avec l'icône `Hop` de lucide-react (`src/ui/FloatingActions.tsx`) ; la trousse d'identité ne l'a pas encore.
LEÇON PROPOSÉE : aucune
