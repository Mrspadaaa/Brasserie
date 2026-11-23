OK — huit concepts Dryhopper « la réponse d'abord » (b1–b8), G1 à G5 verts

## Fichiers écrits (tous dans le périmètre possédé)
- `work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-b/generer.mjs` : le générateur des huit pages. Il lit la grille, les comparatifs, le pack et les pictos de la carte.
- `work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-b/captures.mjs` : les captures et le geste joué au doigt (CDP touch).
- `work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-b/b1/etat.html` à `b8/etat.html`
- `work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-b/NOTE.md`
- `work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-b/captures/` : `b1-390.png` … `b8-390.png`, `b1-10-390.png` … `b8-10-390.png` (après le geste) ; `travail/` (pendant le geste avec la loupe, la fiche, l'absolu, `geste-b.json`, `d99.txt`, `resume.json`)

## Réponse commune, calculée
« Dry hop actif, 2 j : floral ~+22, résineux ~+14 (après : ~+20) ». C'est le meilleur solde floral − résineux, avec l'amertume dans la 16D. Le geste chiffre ensuite la perte, par exemple « à 10′, contre ★ : floral ~−9 · résineux ~−6 · 97 IBU, trop amer ».

## Concepts
| id | chaleur | montre | geste | vraie valeur | levure |
|---|---|---|---|---|---|
| b1 | froide | carte et y1b : barres l5b, trait de la réponse, jauge d'amertume | dock collant, loupe ×5,9 | E08 | étape |
| b2 | froide | x3b réduit : « Ma bière → + Idaho 7 → Levure › », 12 colonnes | frise « levure active / au repos », crochet E08 | E08 | étape |
| b3 | tiède | balance résineux / floral, solde, le reste en pastilles | frise, le fléau bascule | E03 (Idaho-7, à vérifier) | pont |
| b4 | tiède | podium des 5 moments calculés, IBU orangé | frise, ligne cerclée ou ajoutée | E07 | pont |
| b5 | tiède | courbe floral / résineux, pic ★, ≈ interpolé | on gratte la courbe | E08, E10 | étape |
| b6 | tiède | radar 12 axes face à ta stout (m4/h4) | frise | E03 | pont |
| b7 | tiède | plan floral × résineux, chemin des moments, ↖ ta demande, « avec Pomona » | frise, le point suit | E10 | pont |
| b8 | tiède | carte de chaleur 12 familles × 24 moments, colonne ★ cerclée | on gratte la grille | E07 | étape |

## Sorties décisives (rejouées depuis la racine)
- G1 : `COMMUN OK`. Premier passage : TRAIT ECHEC sur b7, corrigé par les pictos dans la phrase.
- G2 : `UNE-QUESTION OK (1 groupe libre : moment)`. Contexte : houblon, dose, levure, base, sur les huit pages.
- G3 : `EXISTENT OK`
- G4 : `NOTE OK`
- G5 : `NOTE OK`
- Joués une fois, sans chercher à les faire passer :
  - MOTS : `--max=80` donne `MOTS ECHEC 6/8` (75 à 92 mots) ; hors données, `MOTS OK` (40 à 57).
  - D99 : `ACQUIS ECHEC 31` (contrôle de Comparer, ne s'applique pas ; le radar de b6 passe).
  - D100 au seuil 0,25 : `SANS-FAMILLE OK` (Idaho 7 : 0 mot hors familles).
- Geste : sur les huit pages, glissé de « actif · 2 j » à « 10′ ». Loupe : 64 px par pas contre 10,8 px sur le rail (×5,9). La fiche s'ouvre à l'appui long. Aucune erreur dans la console.

## Captures ouvertes et regardées
- Premiers écrans, de `b1-390.png` à `b8-390.png`.
- Après le geste : `b1-10-390.png`, `b2-10-390.png`, `b3-10-390.png`, `b5-10-390.png`, `b7-10-390.png`, `b8-10-390.png`.
- Dans `travail/` : `b1-fiche.png`, `b8-pendant.png` (la loupe), `b6-absolu.png`.

Corrigé après lecture des captures :
- la pastille « par floral » cassait la ligne ;
- l'épingle ★ chevauchait les repères ;
- la bande levure et le crochet E08 de b2 étaient mal placés ;
- les zones de b5 se mélangeaient ;
- l'échelle du radar de b6 était mal choisie ;
- des libellés de b7 se chevauchaient, et le point « avec Pomona » était au bleu de Nugget ;
- l'interpolé de b8 était plus pâle, ce qui le faisait lire comme « moins ».

## Prédiction
« Pas mal : la réponse en gros et ce que je perds en glissant, c'est l'idée. La b8 et la b5 me montrent vraiment où est le meilleur moment, mais le radar b6 est écrasé par le résineux. »

DÉCISION À PRENDRE : la convention du solde (Δfloral − Δrésineux − IBU au-dessus de 70) fait la réponse. Elle traduit ta dégustation (« trop résineuse, je la veux plus florale ») ; à valider par le brasseur, ou à montrer comme critère réglable (la pastille « par floral » de y1b), ce qui demandera de vérifier D98.

CONNAISSANCE : pour Idaho 7 à 4 g/L dans la stout (grille du moteur), le dry hop actif atteint son floral dès 2 j (22,14 contre 22,15 à 3 j), avec ~6 points de résineux de moins qu'après fermentation (+13,8 contre +19,7) pour un floral presque égal (+22,1 contre +23,0). Au style, en crans, le résineux paraît plus fort que le floral (+1,4 contre +1,2) ; en points, c'est l'inverse : comparer deux familles demande une échelle commune.

LEÇON PROPOSÉE : avant de dessiner une comparaison entre familles (balance, solde, plan), vérifier que l'unité affichée est commune à ces familles. Les crans au style changent de taille selon la bande de chaque famille, et ont failli inverser le message de b3.
