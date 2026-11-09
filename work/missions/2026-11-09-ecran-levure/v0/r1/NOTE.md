# r1 — la ligne p6-b2, la dose en sachets, trois repères en piste

Chaleur : **froide** (affine la baseline dans la langue de p6-b2 : ligne choisie, champ toujours prêt, panneau Rendement/Couleur, carte d'édition).
Axes : A1 une ligne (p6-b2) · A2 sachets entiers + règle en grammes · A3 champ toujours prêt avec puces · A4 FG et alcool en plage sous l'atténuation.
Idée : la levure est une ligne de p6-b2 avec sa dose « 2–3 sachets » à droite, comme les kg d'un malt.

## Ce qui est montré
- Ligne : picto levure, « SafAle US-05 », « sèche », **2–3 sachets**, Fermentis, 15–24 g et mini-jauge de la plage.
- Changer : « Catalogue ⇄ » (bascule vers hors catalogue) + champ ; puces : Nottingham (icône stock) puis S-04 (habituelle).
- Repères : atténuation 78–82 % (piste), FG 1,012–1,015 et alcool 6,8–7,1 % en plage ; température 18–26 °C sur dégradé froid-chaud, conduite 18–20 marquée ; floculation « à renseigner ».
- Carte Dose : − 2–3 + sachets (se tape), « sachet 11,5 g ⌄ » (produit exact), Comparer ; règle 0–40 g, plage du fabricant hachurée, sachets cumulés.
- Conduite en une ligne › Paliers ; plis Fiche (tolérance 9–11 %, esters faibles, biotransformation non documentée, corriger) et Achat.
- Annexe : pas de levure ; produit exact non choisi (« choisis le sachet pour la dose ») ; levure liquide (dose en milliards de cellules, « choisis le paquet »).

## Acquis J5 (à un toucher au plus)
Catalogue (champ) · hors catalogue (bascule) · fiche corrigeable (pli Fiche) · Comparer (carte Dose) · produit exact (puce sachet 11,5 g).

## Contrôles
- `controle-commun --profil=sans-houblons` (r1 r2 r3 r4) : **COMMUN OK** (mots, couleurs, survol, blocs, contraste, standard, parlant, brutes OK).
- `mots-premier-ecran --max=80` : **75 mots**.
- `verifier-page` : PAGE OK. Captures : `r1-haut.png`, `r1-page.png`, `r1-1280.png`, `r1-geste-avant.png`, `r1-geste-apres.png`.

## Boosters UX (boosters-ux)
- ligne-levure — lire ; ligne p6-b2 ; dose en sachets + mini-jauge g ; avant 2–3 / après « 2 sachets, 23 g ».
- saisie-sachets — ajuster ; − + et champ `inputmode=numeric` ; « 23 g · 77 g/hL dans la plage » (captures geste).
- regle-grammes — lire ; règle 0–40 g, plage fabricant hachurée, sachets cumulés.
- piste-attenuation, piste-temperature — lire ; pistes ; changent avec la levure (puce Nottingham → 78–83 %, 10–25 °C, floculation haute).
- puces-levure, catalogue-hors — choisir ; puce / bascule ; la ligne et les repères changent.
- produit-exact, comparer — déclencher ; puce et bouton.
- B1 OK (geste joué, captures diffèrent) · B2 OK (la ligne domine) · B3 ~ (7 blocs, 75 mots) · B4 OK · B5 non mesuré · B6 OK (3 tailles visées, mono pour les mesures) · B7 OK (CONTRASTE OK, COULEURS OK) · B8 OK (3 états en annexe) · B9 non mesuré · B10 OK (aucun type="number") · B11 OK (« US-05, 2–3 sachets ») · B12 OK (baseline) · B13 ~ (puces 32 px, × 24 px).

## Tient / casse
- Tient : se lit comme Malts/sucres ; la dose est là où il lit les kg.
- Casse : la carte Dose répète la dose de la ligne (deux endroits) ; la règle en grammes est peu parlante tant qu'aucun nombre n'est choisi.
