OK — huit frises Dryhopper (e1 à e8), moment seul libre, COMMUN OK et D98 OK

## Fichiers écrits
- `work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-e/` : `socle.mjs`, `generer.mjs`, `captures.mjs`, `NOTE.md`,
  `e1/etat.html` à `e8/etat.html`, `captures/` (captures et `geste-eN.json`), `captures/travail/` (sorties brutes des contrôles).

## Concepts (détail dans NOTE.md, § Concepts)
- e1 · froide · y1b + carte : 12 barres l5b, jauge d'amertume, dock dont chaque case porte son floral · pouce dans le dock, loupe · Schmidt 2019 (2 j) · levure en dernière étape.
- e2 · froide · x3b réduit : la cuve jour après jour, jours sans gain hachurés, « Ma bière → + Idaho 7 » · glisser le bloc, étirer les jours · Titus 2021 (1 h ou 96 h) · pont.
- e3 · tiède · quatre cases qui s'ouvrent, six barres et IBU dans chacune · cases puis sous-rail minute/jour · McCabe 2023 (Idaho 7, linalol 38 ± 13 µg/L, à vérifier) · dernière case « 2 Levure › ».
- e4 · tiède · frise debout : 24 moments × 7 familles en barres l5b + IBU · doigt de haut en bas · Wolfe 2012 (43 % en 6 h) · pont.
- e5 · tiède · gagner/payer : floral au-dessus de l'axe, amertume ou résineux et végétal dessous · glisser sur 24 colonnes · Lafontaine 2018 (8,1 sur 15 contre 3) · dernière étape.
- e6 · tiède · frise de radars : grand radar m4/h4 et cinq mini radars · curseur à 24 crans · Kankolongo Cibaka 2017 (linalol 72–178 µg/L) · pont.
- e7 · chaude · cadran du brassin : rayons floraux, anneau d'amertume, la levure ferme le cercle · tourner le doigt · Sharp 2014 (cuit, herbacé à l'ébullition) · dernière case.
- e8 · chaude · isotype : le goût compté en pictos, 6 familles × 4 étapes · colonne puis sous-rail · Titus 2021 · pont.

## Sorties décisives
- G1 : `COMMUN OK` (couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, légende, parlant, brutes).
- G2 : `UNE-QUESTION OK (1 groupe libre : moment)`.
- G3, G4, G5 : joués après écriture (EXISTENT OK, NOTE OK, NOTE OK).
- Indicatifs v0 : MOTS ECHEC 5/8 (e1 93, e2 103, e3 81, e4 108, e6 82) ; D99 ACQUIS ECHEC 0/4 sur les huit (acquis d'un écran Comparer, non applicable).
- Geste joué au doigt (`captures/geste-eN.json`) : sur les huit, la pose et le glissé changent le moment et la réponse (par exemple e1 : actif · 3 j → 15′, « floral ≈+12 · trop amer ») ; 0 erreur console.

## Captures ouvertes
`captures/e1-390.png`, `e1-pendant-390.png` (loupe), `e1-fiche-390.png`, `e2-390.png`, `e2-10-390.png`, `e3-390.png`,
`e3-10-390.png`, `e4-390.png`, `e4-10-390.png`, `e5-390.png`, `e6-390.png`, `e7-390.png`, `e7-10-390.png`, `e8-390.png`
(captures au premier écran, à 390 px, de e1-390.png à e8-390.png).

## Prédiction
« Le e5 je comprends tout de suite : à l'ébullition je paie l'amertume, en actif je gagne du floral, pas mal ; le e8 en
pictos c'est une sacrée idée mais le e4 c'est trop de lignes. »

DÉCISION À PRENDRE : D99 (radar, chimie, OSU, vraies valeurs) s'applique-t-il à Dryhopper ? Il échoue sur les huit
concepts, car ses acquis sont ceux de Comparer.

CONNAISSANCE : Idaho 7 à 4 g/L dans la stout S1 (US-05) : le dry hop actif donne ~+22 de floral, amertume tenue, et
résineux ~+14. L'après donne ~+23, mais résineux ~+20 et végétal ~+10. L'ébullition coûte 161 IBU à 60′, 97 à 10′ et 75 au
whirlpool. Le simulé sature dès 2 j de contact. Pomona ne change que l'actif (agrumes 13,9 → 26,9).

LEÇON PROPOSÉE : D98 compte zéro option quand `data-libre` et `role="slider"` sont sur le même élément (il cherche le
curseur dans les descendants). Poser `data-libre` sur un conteneur du curseur, ou corriger le contrôle pour accepter
l'élément lui-même.
