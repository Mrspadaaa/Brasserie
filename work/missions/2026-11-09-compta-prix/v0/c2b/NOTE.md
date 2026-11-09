# c2b — Prix et marges · tiède

**Chaleur** : tiède (la forme de l'approche : une cascade).
**Idée** : pour un format choisi en tuile, la cascade part du litre (0,33 L × 6,37 = 2,10), ajoute la bouteille (0,30) et l'impôt (0,08), s'arrête au coût (2,48) ; un curseur pose le prix et le vert est ce qui reste, en grand en haut : « Il te reste 2,52 CHF sur la bouteille · 50 % ». En dessous, le brassin vendu : 405,00 CHF, coût 200,88, reste 204,12.
**Où** : Clients › Prix ; une tuile par format remplace le tableau.

## Chiffres
Comme c2a (litre 6,37, impôt 25,32 CHF/hl, emballage 33 cl 0,30 estimé, 75 cl et fût inconnus). Prix « exemple ». Non assujetti : prix = TTC (pastille ; assujetti : HT et TTC).
Cadre 2 : 2,20 CHF → « Tu perds 0,28 CHF · −13 % », brassin −22,68, bouton « Enregistrer 2,20 CHF à perte ». Cadre 3 : fût 20 L, emballage hachuré, « Il te reste au plus 27,54 · ≤ 17 % ».

## Problèmes résolus
4 (la chaîne litre → format, pas à pas), 18 (impôt et emballage dans le coût, « reste » nommé), 3 (le litre vient du brassin), métier : le prix d'un brassin entier.

## Baseline
Gardés : produit et conditionnement (tuiles), prix (curseur, valeur dans le bouton), coût de revient, marge CHF et %, prix TTC (pastille TVA), alerte « ne couvre pas le coût » (réponse rouge), Enregistrer. Partis : saisie libre « ingrédients / charges fixes » (le coût est repris, non saisi) ; Supprimer → menu du tarif (non dessiné) ; recherche → tuiles (3 formats ici ; au-delà de 4, liste).

## IA
« Proposer » au toucher (à côté d'Enregistrer) : un prix depuis le coût, « exemple », source montrée.

## Boosters UX
- `curseur-prix` — ajuster ; curseur 0–7 CHF ; réponse, cascade, brassin suivent (cadres 1 et 2).
- `cascade` — lire ; barres décalées sur une échelle commune.
- `reste-vivant` — lire ; vert / rouge.
- `consequence-brassin`, `brassin-barre` — lire ; bouteilles du brassin, prix au litre, barre coût / reste du brassin vendu.
- `ia-proposer`.
- B1 OK. B2 OK — « Il te reste 2,52 » domine, un primaire. B3 alerte — 94 mots (modéré). B4 OK. B5 OK. B6 OK. B7 OK (COMMUN, rouge texte #A8291F). B8 OK — perte en rouge avec son mot, inconnu hachuré. B9 s.o. B10 OK — curseur. B11 « À 5,00, la 33 cl te laisse 2,52, soit 204,12 par brassin. » B12 OK. B13 OK.

## Contrôles
PAGE OK · 1280 débord 0 · COMMUN OK · mots 94 (alerte modérée) · remplissage 0,515 · PANEL OK (lot c). Captures : `c2b-haut.png`, `c2b-page.png` (3 cadres), `c2b-1280.png`.

## Tient / casse
Tient : le « pourquoi » du coût se lit sans un mot d'aide ; le rouge à perte. Casse : un seul format à la fois ; l'axe change d'échelle d'un format à l'autre.
