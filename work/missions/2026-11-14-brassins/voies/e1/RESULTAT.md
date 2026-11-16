OK — fiche du brassin planifié : 4 mini maquettes (froide, 2 tièdes, chaude), repos et geste

## Fichiers écrits (tous dans voies/e1/)
- `capture.mjs` (gabarit s5 adapté) ; `tests.txt` (sortie des CHECK)
- `e1a/` à `e1d/` : `etat.html`, `NOTE.md`, `<id>-repos-390-clair.png`, `<id>-geste-390-clair.png`
- `e1b/` en plus : `e1b-repos-390-cave.png`, `e1b-repos-1280-clair.png`

## Variantes
- e1a froide, « La fiche actuelle, date en tête » : bloc ocre « 6 jours de retard », segment et jours rapides, starter à cocher, cibles, stock en icône. Geste : curseur de jours → lu 16.11.
- e1b tiède, « Le starter fixe le jour » : « Brasser lundi 16.11 », bande de 7 jours colorée par faisabilité du starter, compte à rebours de z1. Geste : « aujourd'hui » → « Aujourd'hui : sans starter ». Meilleure : cave et 1280.
- e1c tiède, « Glisser le brassin sur F2 » : planning des cuves 08–21.11 (NEIPA, dry hop, repos, garde ; Pils), bloc PA glissé. Geste : PA au lu 16 (+2 j).
- e1d chaude, « Quatre feux, puis glisser » : tuiles Date, Levure, Ingrédients, Cuve ; deux chemins ; piste « Glisser pour brasser ». Geste : 4/4, brassage commencé, z1 ouvert.

## Critères (rejoués depuis la racine)
- G1 : SERIE OK
- G2 : ETATS OK
- G3 : HORS OK
Tests : aucune suite Vitest (rien dans `src/`) ; `tests.txt` porte les trois sorties.

## Captures (toutes ouvertes)
`e1a/e1a-repos-390-clair.png`, `e1a/e1a-geste-390-clair.png`, `e1b/e1b-repos-390-clair.png`, `e1b/e1b-geste-390-clair.png`,
`e1b/e1b-repos-390-cave.png`, `e1b/e1b-repos-1280-clair.png`, `e1c/e1c-repos-390-clair.png`, `e1c/e1c-geste-390-clair.png`,
`e1d/e1d-repos-390-clair.png`, `e1d/e1d-geste-390-clair.png`.

## Limites connues
- e1b à 1280 : moitié basse de la colonne gauche vide (cause c3 n° 7), à remplir en passe 2.
- e1b et e1c à 390 : 100 à 150 px de blanc au-dessus du pied.
- Starter, levure (Wyeast 1056) et fenêtre de 24 h : fictifs, déclarés dans chaque NOTE.md.
- Skills impeccable et ui-design-system non chargés (contexte) ; boosters-ux chargé, mesures B2 à B13 non jouées en v0.

Prédiction : il comprendra e1b en trois secondes (« lundi, starter ce soir ») et trouvera e1d osée mais parlante. e1a risque un « c'est l'ancien écran ».

DÉCISION À PRENDRE : aucune (le brasseur choisit sur la page).
CONNAISSANCE : la vraie décision d'un brassin planifié en retard est « quel jour, vu le starter » ; le code la porte déjà (yeastPreparationState : too-late, fenêtre courte).
LEÇON PROPOSÉE : un masquage d'état par `display:none` cède devant une classe plus spécifique (`.x strong{display:block}`) ; masquer par `[data-etat=…] .x{display:none!important}`, jamais par `display:revert`.
