# z3 — le fermenteur (série z, chaud)

**Chaleur : chaude.** Forme libre : l'écran est la cuve. La baseline reste (chrome, champ de s1, conduite, acquis à un toucher).
**L'idée en une phrase :** les sachets tombent dans le moût (la dose : deux pleins, un en pointillé), l'OG est la surface, la plage de FG une
bande dans le cône, l'alcool sort au robinet, le thermomètre porte la plage du fabricant et la conduite, et le dépôt au fond est hachuré tant
que la floculation n'est pas renseignée.
**Axes :** A1 cuve figurative · A2 sachets qui tombent + « 2–3 · sachets · 15–24 g » · A3 plaque de la cuve → champ (s1) · A4 FG en bande,
alcool au robinet, température sur le thermomètre.

## La cuve
Cylindro-conique, dessinée au trait de 1,75 px, moût en dégradé paille → ambre. Surface = OG 1,066. Plaque blanche : nom, fabricant, forme,
caisse verte si en stock ; un toucher dessus pose le doigt dans le champ « Changer ». Atténuation 78–82 % écrite dans le moût. Bande de FG
1,012–1,015 (bleu translucide) à la hauteur des densités, repère à droite. Dépôt hachuré « floculation à renseigner » ; plein violet quand elle
est connue. Robinet : « alcool 6,8–7,1 % vol ». Thermomètre 10–40 °C : bande 18–26 (fabricant), marque pleine 18–20 (conduite).

## Honnêteté
Mêmes calculs que z1. Le niveau de la bande de FG est à l'échelle des densités (OG en surface, 1,000 au bas du cône). Rien d'inventé : la
hauteur du dépôt est un dessin, pas une mesure (hachuré = inconnu).

## États (annexe)
`#vide` (obligatoire : le moût est là, aucun sachet, plaque « Pas de levure · touche ici pour choisir », pas de bande de FG, dépôt « — ») ·
`#sachet` (« choisis le sachet pour la dose », les sachets s'effacent) · repos.

## Boosters UX (boosters-ux)
- Boosters : `plaque-vers-champ` — déclencher ; la plaque est un bouton qui met le focus dans le champ. `puces-levure` — choisir ; la cuve se
  redessine (bande de FG qui monte avec Windsor, dépôt plein avec Nottingham). `champ-pret`, `conduite-resumee`, `dose-par-sachet` (#sachet).
- B1 OK — 5 boosters ; la puce change la cuve.
- B2 OK — la cuve domine ; la dose « 2–3 » (24 px) en tête ; un `primary`.
- B3 OK — MOTS 72, 5 blocs.
- B4 OK — cuve / changement / conduite / liens.
- B5 OK — 8 px entre groupes.
- B6 ECART — 4 tailles (12, 14, 16, 24 pour la dose), même raison que z1.
- B7 OK — CONTRASTE OK (le mot « atténuation » sur le moût est passé en #111 après un premier échec à 3,06:1) ; COULEURS OK.
- B8 OK — #vide, #sachet ; hachures pour la floculation inconnue.
- B9 à mesurer.
- B10 OK.
- B11 OK — « US-05 dans la cuve, 2–3 sachets, finit à 1,012–1,015, 6,8–7,1 %, fermente 18–26 °C ».
- B12 OK — chrome de s1 ; le thermomètre est la pilule de DESIGN.md.
- B13 OK — plaque 36 % × 13 % de la cuve (≈ 130 × 52 px), puces 32 px.
- Écarts voulus : B6.

## Ce qui tient, ce qui casse
Tient : on comprend la fermentation en une image, la plage et l'inconnu sans légende, le toucher sur la plaque. Casse : 400 px de SVG pour une
étape ; le thermomètre et la ligne de conduite disent deux fois 18–20 °C ; à 1280 px la cuve est aussi large qu'au téléphone (560 px max).

## Contrôles
COMMUN OK. PAGE OK. MOTS 72. Captures ouvertes : `z3-repos-390.png`, `z3-vide-390.png`, `z3-sachet-390.png`, `z3-repos-1280.png`,
`z3-haut.png`, `z3-page.png`. Corrigé après ouverture : virgule d'« alcool » rognée par le bord du SVG, « dépôt » → « floculation », « 10 °C »
collé à « FG ».
