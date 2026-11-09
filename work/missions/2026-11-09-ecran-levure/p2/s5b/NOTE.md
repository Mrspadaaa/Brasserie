# s5b — Comparer (colonnes cmc2k) : trois levures et la colonne « ta recette » (passe 3, 09.11)

Base : s1b. Classes `s5b-`. Trois cadres. Grille 46 + 66 + 3 colonnes à largeur contrainte (`minmax(0,1fr)`), valeurs 12 px mono.

Idée : la levure de la recette est une colonne grise étroite, étiquetée « recette », toujours à gauche ; trois candidates (vendues ici d'abord, puis Europe) se lisent contre elle : la référence apparaît en contour tireté sur leurs bandes d'atténuation, l'écart d'arômes s'écrit « + fruité » ou « = recette ». ⇄ noir sous chaque candidate = la prendre.

## Cadres
1. Repos : recette US-05 · Verdant (CH) · Nottingham (Europe) · NovaLager (CH). 2. Toucher ⇄ sous Verdant : elle devient la recette, US-05 passe à droite, une puce « ↶ US-05 » annule. 3. Cas limite : la recette n'a pas de levure : colonne grise tiretée, « 19 °C conduite » seule donnée, FG « choisis une levure », tirets ailleurs ; les candidates se comparent déjà.

## Valeurs (TROUS-COMBLES.md, catalogue)
Nottingham : 78–83, 10–25, haute, esters discrets (TDS), thiols forts (Samia 2026), POF − ; NovaLager : 78–84, 10–20, floculation moyenne à haute (deux sources), esters légers, biotransformation non documentée ; Verdant : 75–82, 18–25, moyenne, abricot · tropical, β-lyase déclarée ; US-05 : 78–82, 18–26, floculation absente, esters faibles, 11 g/L ; sucres restants non documentés pour les trois Lallemand. FG et alcool calculés (OG 1,066) ; dose 2–3 sachets pour les quatre.

## Boosters (data-booster)
colonne-recette (comparer : la référence fixe et grise, contour tireté sur chaque bande), ⇄ noir (déclencher), état vide dessiné (B8). B11 : « Verdant plus fruitée et documentée pour le houblon ; Nottingham la plus froide et la plus floculante ; NovaLager ne tient 19 °C qu'au bord ».

## Contrôles
PAGE OK · remplissage 0,75 (après teinte #D9D9D9 : la teinte plus claire ne comptait pas, seuil 60 de `controle-panel`) · MOTS 78 hors données · aucune valeur brute anglaise.
