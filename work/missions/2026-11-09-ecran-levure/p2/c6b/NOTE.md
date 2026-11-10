# c6b — c5a + les 18 filtres : une ligne de résumé, des puces qui défilent, une feuille à index (passe 4, 09.11)

Base : c5a telle quelle (carte de la 1056, pont, écarts, ordre c4). Classes `c6b-`. Chaleur : tiède. Mêmes données et mêmes trois filtres que c6a (seul facteur libre : la façon de tenir 18 filtres sur 390 px).
Idée : sous le champ, une seule ligne dit ce qui joue (« bière · repères 19 °C · 7 % · proche de 1056 · 1 339 »), puis une rangée de puces qui défile (fondu à droite). La ligne touchée ouvre une feuille : index des 18 filtres à gauche (point noir = posé, rond rouge = repère, les peu documentés en gris), le filtre touché à droite, « Trier » et « Voir » au pied. Filtres posés : la ligne devient une phrase noire « 120 ale · 18–20 °C · sans STA1 », chaque mot retirable.

## Cadres
1. « 1056 » tapé : ligne de résumé, puces (Famille, Style, Effets, Tolérance, Sans STA1, °C…) ; carte 1056 ; US-05 en tête de « Vendue CH · FR · DE », trait rouge 19 °C sur les pistes.
2. Feuille ouverte sur « Tolérance à l'alcool » : histogramme en colonnes (4 · 57 · 263 · 346), repère rouge « ≈ 7 % · ta bière », « ⌕ non documentée 669 · chercher », bascule « ne garder que ≥ 7 % » éteinte (repère, pas filtre), les 5 vendues ici sur l'échelle (US-05 9–11, Pomona 10, Verdant 12, 1084 12, NovaLager 13).
3. Phrase des filtres posés : 120 ; barre et légende vendue ici 0 · Europe 1 · rare 119 ; bande « STA1 non documentée 143 · dont 5 vendues ici » ; US-05 et Verdant pâles « STA1 ? », BRY-97, WLP001, A-56 Chico « STA1 − · fiche ».

## Comptes
Ceux de c6a, même script (`../c6a/comptes-p4.mjs`, sortie `../c6a/comptes-p4.txt`). Tolérances des vendues ici : fiches du catalogue (Pomona « > 10 % ABV », NovaLager 13 %, Verdant 12 %, 1084 12 %, US-05 9–11 %). A-56 Chico (BSI) : 60–72 °F, 73–77 %, STA1 négative, fiche.

## Honnêteté
Comme c6a : repères jamais imposés, STA1 non documentée jamais comptée comme négative, « estimé » pour Boisson et Famille (dans la feuille, au port : champ normalisé).

## Boosters (data-booster)
resume-une-ligne, puces-defilantes, feuille-index (index + panneau), tolerance-histogramme, vendues-sur-echelle (les vendues ici sur la même échelle que le repère), chercher-ia, trier, phrase-filtres (filtres posés en phrase), compte-rayons, effets-us, pont.

## Contrôles
- verifier-page : PAGE OK ; débordement : seulement la rangée de puces qui défile (voulu).
- `p2/s7a/controle-p4.mjs` : c6b OK, premier rang 11/11, second 7/7 (index de la feuille), US-05 en tête, Trier présent.
- Mots au premier écran : 103 bruts, 79 sans chiffres (> 72 ; c5a : 92 / 75).
- controle-panel : voir c6a (PANEL ECHEC voulu, même base). controle-commun : sans objet.

## Retouches de la passe 4 (critique, SYNTHESE-P4 « Verdicts »)
1. Légende en tête de feuille : « ● posé · ○ repère · ⌕ non documentées ».
2. Index à 30 px par ligne (feuille remontée à 120 px, index 168 px) ; au bout de chaque ligne, en gris, la loupe et le nombre de fiches bière non documentées (Style 1 106, °C 620, Atténuation 449, Tolérance 669, Floculation 443, Forme 1 157, Sans STA1 787, Vitesse 1 185, Rondeur 1 335, Soufre et Nutriments 1 337) ou « estimé » (Famille, Effets, Sans alcool).
3. Cadre 3 : les cinq vendues ici (US-05, Verdant, Pomona, 1084, 1007 épuisée) chacune sa ligne pâle « ⌕ STA1 ? ».
4. Famille « ale » → « ale US » dans la phrase des filtres posés.
Contrôles rejoués : PAGE OK (seules les puces qui défilent dépassent, voulu) ; `../s7a/controle-p4.mjs` c6b OK ; mots 103 bruts, 79 sans chiffres.
