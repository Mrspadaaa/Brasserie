# z1 — la carte compactée (série z, froid)

**Chaleur : froide.** La carte « Levure » de la baseline, sans « Brouillon », sans Paliers en tête, sans offres ni prix, ramenée à une carte.
**L'idée en une phrase :** la dose se voit en sachets dessinés (deux pleins, un en pointillé pour la plage) avant tout le reste, à droite du nom.
**Axes :** A1 carte compactée · A2 sachets dessinés + plage en g · A3 champ toujours prêt et puces (s1) · A4 « Donne FG … · … % vol » en une ligne.

## Ce qu'on voit au repos (390 px)
Nom, fabricant, forme, stock en icône (caisse verte, 0 mot) ; dose « 2–3 sachets · 15–24 g » en gros ; trois repères en cases (atténuation 78–82 %,
fermente à 18–26 °C, floculation « à renseigner » en pointillé) ; « Donne FG 1,012–1,015 · 6,8–7,1 % vol » ; le champ « Changer : … » et ses
puces (stock d'abord : Verdant IPA, Nottingham ; puis New England, W-68 ; « Catalogue › » pour les 1 734 références et la saisie libre) ;
la conduite résumée « 18–20 °C · 2 paliers · fin J15 › Paliers » ; les acquis à un toucher : Fiche (corrigeable), Comparer, Sachet exact.

## Honnêteté (J7, hypothèse 2)
Dose : 50–80 g/hL × 30 L = 15–24 g, sachet 11,5 g → 2–3 sachets (arrondi au sachet supérieur à chaque bout, sans OG). FG et alcool en plage
depuis l'atténuation 78–82 % et l'OG 1,066. Floculation « à renseigner ». Aucun mot anglais. Le bandeau reprend 8,0 kg de son écran Malts
(fixture), OG 1,066, IBU 60, EBC « — ».

## États (annexe, par #)
`#vide` (obligatoire : le cadre reste, « Pas de levure », repères « — », champ et puces prêts) · `#sachet` (produit exact non choisi : « choisis le
sachet pour la dose », aucun chiffre) · repos.

## Boosters UX (boosters-ux)
- Boosters : `puces-levure` — choisir ; puce ; nom + icône stock ; la carte change au toucher (une levure du stock montre la caisse). `champ-pret` —
  choisir ; champ dashed toujours prêt (s1). `effet-en-plage` — lire ; ligne « Donne FG · % vol ». `conduite-resumee` — suivre ; ligne vers Paliers.
  `dose-par-sachet` (état #sachet) — déclencher.
- B1 OK — 5 boosters marqués, la puce change la carte (capture repos vs toucher Verdant IPA : nom, dose 2–3 sachets · 15–30 g, caisse).
- B2 OK — une dominante : la dose « 2–3 » (24 px) ; un seul `primary` (Suivant).
- B3 OK — MOTS 68 (`mots-premier-ecran --profil=sans-houblons`), 7 blocs ; détail (fiche, comparer, sachet exact) à un toucher.
- B4 OK — carte / changement / conduite / liens, séparés par 8 px ; pas de carte dans une carte (les cases de repères sont des cellules blanches).
- B5 OK — 4–6 px dans les groupes, 8 px entre.
- B6 ECART — 4 tailles au premier écran (12, 14, 16 et la dose 24) : la dose est le cœur (J4), DESIGN.md `display` 28 pour une mesure prioritaire.
- B7 OK — CONTRASTE OK (sans-houblons) ; COULEURS OK (violet levure, vert stock, bleu conduite, or moût).
- B8 OK — #vide et #sachet dessinés ; inconnu « à renseigner » ou « — », jamais zéro ; BRUTES OK.
- B9 à mesurer — `:active` scale sur les puces ; `prefers-reduced-motion` respecté.
- B10 OK — un seul champ texte, pas de `type="number"`.
- B11 OK — la capture dit : « US-05, 2–3 sachets, 78–82 %, 18–26 °C, change-la ici ».
- B12 OK — chrome de s1 repris tel quel (en-tête, fil, bandeau, pied, +) ; rayons 10/16, bordure 1 px.
- B13 OK — cibles ≥ 24 px (cases 40 px, puces 32, liens 24).
- Écarts voulus : B6 (dose en 24 px).

## Ce qui tient, ce qui casse
Tient : lisible en trois secondes, la langue de s1, les acquis gardés. Casse : la moitié basse de l'écran est vide au repos (froid assumé : une
étape, pas un tableau de bord) ; les sachets dessinés sont petits (20 px) ; le relais de deux levures n'est pas dessiné.

## Contrôles
COMMUN OK (mots, couleurs, survol, blocs, contraste, standard, parlant, brutes ; au-style, fiche, trait, legende sautés par le profil). PAGE OK.
MOTS 68. Captures ouvertes : `z1-repos-390.png`, `z1-vide-390.png`, `z1-sachet-390.png`, `z1-repos-1280.png`, `z1-haut.png`, `z1-page.png`.
