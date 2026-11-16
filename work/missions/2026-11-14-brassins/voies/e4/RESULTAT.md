OK — 4 maquettes des saisies de passage (froide, 2 tièdes, chaude), 14 captures

## Variantes
- e4a (froide) : « Le passage, remis d'aplomb ». Une carte Tirage : rail des 4 étapes, curseur, bascules de fûts, jauge, pastilles FG/OG/alcool. Retour : feuille Garde ← Conditionné.
- e4b (tiède, ma meilleure) : « La cuve se vide dans ses contenants ». Cuve F2 dessinée, fûts et caisse de 33 cl, la lie au geste. Frise Garde → Conditionné → F2 libre, dernier tirage (Stout) en repère.
- e4c (tiède) : « L'échelle des étapes, au pouce ». Un palet descend ou remonte les marches ; le retour se confirme dans la marche, l'abandon est une marche hachurée.
- e4d (chaude) : « Le bon de tirage, à tamponner ». L'écran a la couleur de la bière, un compteur à rouleaux, un bon tamponné CONDITIONNÉ ; le retour devient « Décoller le tampon ? ».

## Fichiers écrits (tous dans voies/e4/)
- `capture.mjs`, `tests.txt`, `RESULTAT.md` ;
- `e4a/` à `e4d/` : `etat.html`, `NOTE.md` et les PNG.

## Critères (sortie dans tests.txt)
- G1 : SERIE OK
- G2 : ETATS OK
- G3 : HORS OK
- `type="number"` : 0 dans les 4 pages.

## Captures (toutes ouvertes, Read)
- `e4a/e4a-repos-390-clair.png`, `e4a-geste-390-clair.png`, `e4a-retour-390-clair.png`
- `e4b/e4b-repos-390-clair.png`, `e4b-geste-390-clair.png`, `e4b-retour-390-clair.png`, `e4b-repos-390-cave.png`, `e4b-repos-1280-clair.png`
- `e4c/e4c-repos-390-clair.png`, `e4c-geste-390-clair.png`, `e4c-retour-390-clair.png`
- `e4d/e4d-repos-390-clair.png`, `e4d-geste-390-clair.png`, `e4d-retour-390-clair.png`

Les deux derniers placements (le point de la Stout dans `e4c-retour`, le bon resserré dans `e4d-repos` et `e4d-geste`) ont été recapturés. Seul `e4d-retour` a été rouvert.

## Données
- Fictives, dites dans chaque NOTE :
  - la Pils est dans F2 (d'où le conflit avec la Pale Ale) ;
  - 26 L en cuve, levurée le 27.10 (déduit de J+18) ;
  - fûts F-02 de 20 L et F-03 de 10 L ;
  - geste : 15 × 33 cl + F-02 = 24,95 L.
- OG de la Pils absente du brief : l'OG et l'alcool restent « — », avec « poser ».

## Prédiction
La cuve qui se vide (e4b) et le tampon (e4d) lui parleront ; e4a lui paraîtra juste mais sage.

## Limites et écarts
- e4b à 1280 : la colonne droite reste courte, à remplir en passe 2.
- e4c et e4d : il reste environ 15 % de vide en bas de certains états.
- Skills : `boosters-ux` chargé ; `impeccable` et `ui-design-system` non chargés, faute de tours (plafond 45).
- Contrôles du lot non joués en v0 : `controle-panel`, `controle-commun`.

DÉCISION À PRENDRE : la Pils est placée dans F2, ce qui est fictif. Si son vrai fermenteur est un autre, le conflit F2 / Pale Ale tombe et cette pastille disparaît.

CONNAISSANCE : un retour arrière ne défait que le statut. Le stock reste retiré, les mesures et les dates sont gardées (`transitionConsequence`, `src/domain/batchTransitions.ts`).

LEÇON PROPOSÉE : dans une maquette pilotée par `[data-etat]`, ne pas cacher les états par `display:revert` ni par un style en ligne. Utiliser `body:not([data-etat=x]) .cls{display:none!important}`. Trois bogues de visibilité sont venus de là ici.
