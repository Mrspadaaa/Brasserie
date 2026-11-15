# c2a — Prix et marges · froid

**Chaleur** : froide (affine le tableau Clients › Prix et marges).
**Idée** : le tableau est relié au coût : en tête, « Litre de bière 6,37 CHF/L, estimé » (repris du budget du brassin, touchable) ; chaque format est une barre de son prix, gris = coût, vert = ce qui reste ; en dessous, ce que laisse un brassin de 27 L mis tout entier dans chaque format.
**Où** : Clients › sous-onglet « Prix » (rail renommé Carnet · Prix · Impôt bière : l'onglet du bas « Clients » n'est plus répété).

## Chiffres
Litre sans emballage ni impôt : 7,51 − 0,89 − 0,25 = 6,37. Impôt 25,32 CHF/hl (12 °P). Emballage 33 cl : 24,00 ÷ 81 bouteilles = 0,30 (estimé) ; 75 cl et fût : inconnus → « ≥ » et « ≤ », hachures, pastille « emballage ? ».
33 cl 5,00 : coût 2,10 + 0,30 + 0,08 = 2,48, reste 2,52 · 50 % ; 75 cl 10,00 : ≥ 4,97, ≤ 5,03 ; fût 20 L 160,00 : ≥ 132,46, ≤ 27,54 · 17 %. Pro : 4,50 / 9,00 / 140,00. Tous les prix : « prix exemples ».
Brassin de 27 L : 81 × 33 cl → 204,12 ; 36 × 75 cl → ≤ 181,08 ; en fût → ≤ 37,18. Le fût rapporte cinq fois moins.

## Problèmes résolus
3 (un seul coût, repris du brassin), 4 (litre → format avec emballage et impôt), 18 (la marge compte impôt et emballage ; « reste » au lieu de « marge brute »), en partie 19 (le prix se pose ici ; l'essai de tarif peut renvoyer ici) ; métier : prix Pro / Privé, marge par brassin.

## Baseline
Gardés : recherche (icône), filtre (devient Privé / Pro), tableau produit / prix / coût / marge CHF et %, « Comprendre les marges » (« Détail du coût », replié), feuille de tarif au toucher d'une ligne, ajout d'un tarif (« Ajouter un format » et le +). Parti : « Sans marge N » → la pastille rouge le dirait (non dessinée).
État dessiné : cadre 2, vide : aucun prix, le litre est connu, choisir un format donne son coût (2,48), le prix se tape (`inputmode="decimal"`).

## IA
« Proposer un prix » au toucher : depuis le coût, réponse « exemple », source montrée (voir c2c cadre 2 pour le rendu).

## Boosters UX
- `litre-source` — lire/renvoi ; carte bleue vers le budget du brassin.
- `segment-client` — choisir ; Privé / Pro change les prix et les restes.
- `ligne-prix` — lire ; barre coût / reste par format, hachures = inconnu.
- `par-brassin` — comparer ; trois barres vertes, même échelle.
- `premier-format` (vide), `ia-proposer`.
- B1 OK. B2 alerte — trois prix de même poids ; la réponse est la ligne, pas un nombre. B3 alerte — 98 mots (modéré). B4 OK — rangées en panneau, sans carte dans la carte. B5 OK. B6 OK. B7 OK (COMMUN). B8 OK — « ≥ / ≤ », hachures, état vide. B9 s.o. B10 OK. B11 « La 33 cl à 5,00 te laisse 2,52 ; le fût presque rien. » B12 OK. B13 OK sauf l'icône de recherche, décorative ici (à rendre bouton 28 px au port).

## Contrôles
PAGE OK · 1280 débord 0 · COMMUN OK · mots 98 (alerte modérée) · remplissage 0,411 (seul du lot c sous 0,50 : les interlignes des rangées comptent vides ; l'écran est plein à l'œil) · PANEL OK (lot c, 1/6 sous 0,50).
Captures : `c2a-haut.png`, `c2a-page.png`, `c2a-1280.png`.

## Tient / casse
Tient : familier, relié au coût, la comparaison par brassin est neuve. Casse : 98 mots ; le froid reste un tableau.
