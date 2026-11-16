OK — Créer un brassin : 4 mini maquettes (froide, 2 tièdes, chaude), repos, geste, vide

Fichiers écrits (tous dans `voies/e5/`) : `capture.mjs`, `planche.mjs` (planche de contrôle), `tests.txt`, et pour chaque variante
`e5a` à `e5d` : `etat.html`, `NOTE.md`, PNG.

Variantes :
- e5a, froide : la feuille remise d'aplomb. Titre-réponse « NEIPA, 24 L », recettes en tuiles, curseur m2, frise de jours. Geste : la liste avec LOT-021 planifié.
- e5b, tiède : le planning des cuves décide. Grille cuve × jour, « F4 vide depuis 8 jours. », recette posée sur un jour libre.
- e5c, tiède (ma meilleure) : rebrasser ce qui manque. Recettes rangées par l'état de leur dernier lot : « La Saison est écoulée. On la rebrasse ? ». La Pale Ale est marquée « déjà planifiée » pour éviter un doublon.
- e5d, chaude : la phrase à trous. Écran-phrase « Je brasse [NEIPA] [24 L] le [jour ?] » sur fond EBC, clavier de choix, tampon « Planifié ».

Critères (sortie dans `tests.txt`) : G1 SERIE OK · G2 ETATS OK · G3 HORS OK.

Captures, toutes ouvertes (directement ou sur planche) :
- `e5a/e5a-{repos,geste,vide}-390-clair.png`
- `e5b/e5b-{repos,geste,vide}-390-clair.png`
- `e5c/e5c-{repos,geste,vide}-390-clair.png`, `e5c/e5c-repos-390-cave.png`, `e5c/e5c-repos-1280-clair.png`
- `e5d/e5d-{repos,geste,vide}-390-clair.png`

Défauts restants, vus :
- e5c à 1280 : le bas de la colonne gauche est vide.
- e5d au repos : l'étiquette « LOT-020 prévu » mord sur « Pale Ale ».
- Les états vides de e5a et e5b gardent du blanc en bas.
- e5a au geste : corrigé après la dernière planche (`.e5a-nt>b`), image recapturée mais pas rouverte.

Prédiction : « Enfin le bouton + a une vraie vue. La Saison écoulée, ça c'est utile. La phrase à trous, osée, mais je veux voir. »

DÉCISION À PRENDRE :
- e5b et e5c ajoutent des fonctions absentes du code : le choix du fermenteur (e5b) et le lien recette / dernier lot (e5c). Les brancher si le brasseur les choisit.
- Les noms F3 et F4 sont fictifs.

CONNAISSANCE : la feuille actuelle ne choisit pas de fermenteur. Le bouton + sous Brassins ouvre `QuickActionModal` `brew-batch`. Son
« Créer une recette » (carnet vide) ouvre l'assistant de recette (`App.tsx:993`). L'avertissement de matériel propose « Adapter à X L » par pas de 0,5 L (`materielActuel.ts`).

LEÇON PROPOSÉE : aucune
