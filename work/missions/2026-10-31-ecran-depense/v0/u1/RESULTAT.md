OK — série u : 4 concepts (feuille, fil, ruban, pont) ; COMMUN OK, PANEL OK

Série u du v0 « Nouvelle dépense » (mission 2026-10-31-ecran-depense), au brief minimal : la question, la baseline,
l'honnêteté. Sa facture 372765 (23 lignes, 86,50 CHF) : six points rangés par risque, simulés là où sa facture ne les porte pas.

## Fichiers écrits (rien hors de `v0/u*/`)
- `v0/u1/etat.html`, `NOTE.md` : froide, « la feuille, chaque doute sur son champ » (compteur « 6 à régler ↓ » qui saute).
- `v0/u2/etat.html`, `NOTE.md` : tiède, « le fil à régler, trié par risque » (une décision ouverte, la suivante s'ouvre).
- `v0/u3/etat.html`, `NOTE.md` : chaude, « le ruban des 86,50 » (lignes à l'échelle dans le cadre du total ; bases TVA qui débordent de 23,90).
- `v0/u4/etat.html`, `NOTE.md` : chaude, « le pont facture ↔ stock » (un câble par ligne : relié, nouveau, bis, unité « ? »).
- `v0/u1/capturer-u.mjs` (captures et gestes, `node …/capturer-u.mjs u1 u2 u3 u4`) ; `v0/u1/sortie-commun.txt`.
- Chaque page : 390 × 844 et 1280 px, classes et globales préfixées (`u1-` … `u4-`), annexe des 9 états, `data-booster`.

## Sorties décisives (rejouées en fin de voie)
- `controle-commun.mjs v0 u1 u2 u3 u4 --page=etat.html --profil=sans-houblons` : mots, couleurs, survol, blocs, contraste,
  standard, parlant, brutes OK → **COMMUN OK**
- `mots-premier-ecran` : u1 95, u2 97, u3 85, u4 98 (seuil du lot 98) → MOTS OK
- `controle-contraste` : CONTRASTE OK (pires 4,65 ; 4,55 ; 4,55 ; 4,94:1)
- `controle-panel.mjs` (captures `-haut.png`) : remplissage médian 0,59, 0 sous 0,50, ressemblance 0,87, 0/6 paire
  presque identique → **PANEL OK**
- `verifier-page` : PAGE OK ×4 · `grep type="number"` : aucun (code 1)

## Captures (ouvertes et regardées)
`v0/u1/` : u1-haut, u1-repos, u1-regle-paye, u1-saut-mouture, u1-mouture-rattachee, u1-preuve, u1-enregistre, u1-1280, u1-page
`v0/u2/` : u2-haut, u2-repos, u2-regle-1, u2-regle-2, u2-reste, u2-enregistre, u2-1280, u2-page
`v0/u3/` : u3-haut, u3-repos, u3-segment-levures, u3-point-tva, u3-tva-reglee, u3-enregistre, u3-1280, u3-page
`v0/u4/` : u4-haut, u4-repos, u4-argent-tva, u4-cable-mouture, u4-mouture-reglee, u4-cable-target, u4-target-regle, u4-enregistre, u4-1280, u4-page

## Limites dites (NOTE de chaque concept)
- « Pour quoi ? » est composé par le code sans marque « proposé » (les 4) ; u4 affiche 0,04 au lieu de l'imprimé 0,040.
- u1 : les doutes suivent l'ordre du formulaire (la TVA, risque d'argent, vient en dernier). u2 : type d'achat et choix
  d'article d'une ligne non dessinés. u3 : une part de 0,10 CHF ne se touche pas seule (passage par la rangée de famille).
  u4 : 98 mots, sans marge ; les câbles se croisent au milieu.
- Simulé et dit : stock d'essai, Target α 11,8 et Hallertauer Blanc DE au stock, unité illisible de Sabro (sa facture : « g »),
  prévision 90,00, doublon 380001.

Prédiction : « Le ruban et le pont, ça je comprends d'un coup ; la feuille c'est la mienne en mieux ; le fil, je ne vois plus
mes lignes. »

DÉCISION À PRENDRE : aucune (le choix entre concepts revient au brasseur, via le tri).

CONNAISSANCE : `controle-panel.mjs` se joue sur les captures 1x (`-haut.png` de `verifier-page`) : en 2x, la médiane
tombait à 0,40 pour les mêmes pages. `mots-premier-ecran` compte « · » comme un mot : les séparateurs passent en
pseudo-élément CSS. `controle-commun` prend ses ids séparés par des espaces : « u1,u2 » donne « sans etat.html » et 7 échecs.

LEÇON PROPOSÉE : aucune.
