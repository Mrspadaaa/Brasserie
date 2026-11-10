# z2 — la roue de la levure (série z, tiède)

**Chaleur : tiède.** La forme de la série (créative) dans la structure de la baseline : ligne nom + dose, puis le champ de s1 et la conduite.
**L'idée en une phrase :** les six repères de la levure en roue (le radar qu'il aime, m4 et h4), chaque plage du fabricant en bande,
l'inconnu en secteur hachuré, le contour tireté quand il enjambe un inconnu ; tout en mots français.
**Axes :** A1 roue (ni carte, ni ligne) · A2 dose « 2–3 sachets · 15–24 g » sur la ligne · A3 champ + puces (s1) · A4 « Donne FG · % vol ».

## La roue
Six axes : Atténuation 78–82 % (échelle 60–95, les extrêmes du catalogue), Température 18–26 °C (8–40), Tolérance alcool 9–11 % vol (4–16),
Esters « faibles » (un point, le mot du fabricant), Floculation « à renseigner » (secteur hachuré), Biotransformation « non documentée »
(secteur hachuré). La bande violette va du minimum au maximum de chaque plage ; le trait plein relie des axes voisins connus, tireté quand
il saute par-dessus les deux inconnus (glossaire : « traits tirés là où le contour enjambe un inconnu »). Trois anneaux, sans chiffres
d'échelle : la valeur est écrite sous chaque mot.

## Honnêteté
Mêmes calculs que z1 (dose 2–3 sachets, FG 1,012–1,015, 6,8–7,1 % vol). Les échelles des axes sont les extrêmes du catalogue bootstrap
(atténuation 63–94, température 10–40, tolérance 5–15, arrondis). Les deux inconnus sont hachurés et nommés. BRUTES OK.

## États (annexe)
`#vide` (obligatoire : six secteurs hachurés, « Pas de levure », champ prêt) · `#horscat` (« Levure maison · hors catalogue » : tous les repères
« à renseigner », dose « choisis le sachet pour la dose », « FG et alcool : atténuation à renseigner ») · repos.

## Boosters UX (boosters-ux)
- Boosters : `roue-reperes` — lire/comparer ; roue à bandes et hachures ; change avec la levure. `puces-levure`, `champ-pret`,
  `effet-en-plage`, `conduite-resumee`, `dose-par-sachet` (#horscat) comme z1.
- B1 OK — 6 boosters ; la roue se redessine au toucher d'une puce (Nottingham : floculation « forte » remplit le secteur).
- B2 OK — la roue domine ; un `primary`.
- B3 OK — MOTS 76 (≤ 80 du brief ; > 70, alerte modérée du lot houblons), 6 blocs.
- B4 OK — ligne / roue / effet / changement / conduite / liens.
- B5 OK — 8 px entre groupes.
- B6 OK — 12, 14, 16 au premier écran (trois tailles).
- B7 OK — CONTRASTE OK, COULEURS OK.
- B8 OK — #vide, #horscat ; hachures pour l'inconnu.
- B9 à mesurer.
- B10 OK.
- B11 OK — « US-05, 2–3 sachets ; atténuation, température, tolérance et esters connus ; floculation et biotransformation pas ».
- B12 OK — chrome de s1 ; rayons 10/16/rond.
- B13 OK — puces 32 px, liens 24 px (la roue n'est pas une cible).
- Écarts voulus : aucun.

## Ce qui tient, ce qui casse
Tient : six repères d'un coup d'œil, l'inconnu visible sans texte d'aide, la plage lisible. Casse : la roue prend 260 px pour quatre valeurs
connues ; la moitié gauche hachurée peut se lire « cette levure est mal documentée » (c'est vrai pour l'US-05 du catalogue) ; les esters en un
point ne sont pas une mesure.

## Contrôles
COMMUN OK. PAGE OK. MOTS 76. Captures ouvertes : `z2-repos-390.png`, `z2-vide-390.png`, `z2-horscat-390.png`, `z2-repos-1280.png`,
`z2-haut.png`, `z2-page.png`.
