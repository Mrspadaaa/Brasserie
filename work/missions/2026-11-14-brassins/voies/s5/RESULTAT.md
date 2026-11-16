OK — 3 mini maquettes G2 (froide s5a, tiède s5b, chaude s5c), repos et geste

## Variantes
- s5a — froide : « Dry hop demain » en titre, trois tuiles empilées pleines (densité noire avec jauge à axe brisé et « stable ? = ? », °C cuve bleue avec consigne 19 → 21 → 2, demain encadrée : Citra et Mosaic avec α, rôle, pastilles). Geste : densité 1,016 au curseur m2 sur place. Cave et 1280 (poste de cave : trois colonnes, relevés, barres °C par jour, autres cuves).
- s5b — tiède : deux cadrans carrés (densité en crans de 0,001 jusqu'à la bande ; °C cuve en barres par jour face à la consigne), le grand cadran vert EST la réponse « Dry hop demain » avec une case z1 par houblon. Geste : Citra coché, « ajouté 14.11 · stock −100 g », « J+5, un jour tôt », Annuler. Lien « Quand ajouter ? » (greffe G4).
- s5c — chaude (G2 × G1) : rail de cuverie, « À 0,004 de la bande », anneau de densité cadré 1,040–1,006, anneau °C cuve, compte à rebours « 1 j » du dry hop, frise de jours J0 à J+11 en phases pleines. Geste : feuille m2 °C de cuve 19,2 (consigne marquée, écart +0,2). Liste : la cuverie en tuiles pleines (NEIPA, Pale Ale en retard, Pils stable, Stout, Saison close).

## Fichiers
- `work/missions/2026-11-14-brassins/voies/s5/capture.mjs`, `tests.txt`
- `s5a/`, `s5b/`, `s5c/` : `etat.html`, `NOTE.md`, PNG

## Critères (tests.txt)
- G1 : SERIE OK
- G2 : ETATS OK
- G3 : HORS OK

## Captures (toutes ouvertes)
- `s5/s5a/s5a-repos-390-clair.png`, `s5a-geste-390-clair.png`, `s5a-repos-390-cave.png`, `s5a-repos-1280-clair.png`
- `s5/s5b/s5b-repos-390-clair.png`, `s5b-geste-390-clair.png` (geste vu avant la dernière retouche de titre, repos vu après)
- `s5/s5c/s5c-repos-390-clair.png` (vu avant retouche des cases de jours), `s5c-geste-390-clair.png`, `s5c-liste-390-clair.png`

## Défauts restants vus
- s5c liste : milieu des tuiles Pale Ale et Pils peu rempli. s5c repos : cases de jours agrandies après la vue (à regarder).
- s5a geste : ~50 px vides en bas. Contrôles panel/commun/choix non joués (v0 ; ecrans.json n'a pas d'entrée brassins).
- Skills impeccable et ui-design-system non chargés (contexte) ; boosters-ux chargé.

Prédiction : « La noire avec 1,018 et Dry hop demain, je comprends tout de suite ; les ronds, c'est joli mais c'est un tableau de bord. »

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : α et familles de Citra et Mosaic disponibles dans `src/data/hopDatabaseBootstrap.json` (kasperg3/HopDatabase : α 10–16 et 10–15, descripteurs citrus, tropical, stone fruit, berry).
LEÇON PROPOSÉE : aucune.
