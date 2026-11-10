# z4 — la même bière, sept levures (série z, chaud)

**Chaleur : chaude.** Forme libre : changer de levure, c'est choisir un effet sur ce moût, pas un nom dans une liste.
**L'idée en une phrase :** une carte où chaque levure est posée par ce qu'elle ferait de CE moût (sa plage de FG, depuis l'atténuation du
fabricant et l'OG 1,066) et par sa température ; la levure de la recette est en relief ; toucher une autre la met dans la recette.
**Axes :** A1 carte des effets · A2 dose sur la ligne · A3 duel/choix à un toucher sur la carte, champ de s1 pour le reste · A4 l'effet EST la
carte (FG), plus « Donne FG · % vol · floculation ».

## La carte
X : FG pour ce moût, de 1,002 à 1,026 (« sèche » ← → « ronde »). Y : température, 8 à 42 °C (« froide » / « chaude »). Chaque levure est
un segment horizontal de FG min à FG max, posé à sa température médiane : US-05 (violet, relief), Verdant IPA et Nottingham (caisse verte :
en stock), Belle Saison (la plus sèche), Voss (la plus chaude), Windsor et WLP002 (les plus rondes). Toucher un segment (cible invisible de
26 px) le met dans la recette : la ligne du haut, la dose et « Donne … » changent ; le champ reste pour le catalogue.

## Honnêteté
FG = 1 + 0,066 × (1 − atténuation), aux deux bornes du fabricant ; alcool = (OG − FG) × 131,25 ; dose en plage de sachets (Lallemand
11 g : 15–30 g → 2–3 sachets ; New England 100–200 g/hL → 3–6). WLP002 liquide : pas de sachet, « choisis le paquet pour la dose ».
Les sept levures viennent du catalogue bootstrap ; aucune position inventée.

## États (annexe)
`#vide` (obligatoire : carte sans relief, « touche une levure sur la carte ») · `#liquide` (WLP002 : « choisis le paquet pour la dose »,
FG 1,020–1,024, floculation très forte) · repos.

## Boosters UX (boosters-ux)
- Boosters : `carte-des-effets` — comparer/choisir ; segments de FG × température ; le toucher change la recette (captures repos et
  #liquide). `champ-pret`, `conduite-resumee`, `dose-par-sachet` (#liquide).
- B1 OK — la carte change la ligne, la dose et l'effet au toucher.
- B2 OK — la carte domine ; un `primary`.
- B3 ECART — MOTS 80 après retrait de « kveik » (81 avant) : sept noms et deux axes au premier écran ; au plafond du brief.
- B4 OK — ligne / carte / effet / changement / conduite / liens.
- B5 OK.
- B6 OK — 12, 14, 16 (trois tailles).
- B7 OK — CONTRASTE OK, COULEURS OK.
- B8 OK — #vide, #liquide ; floculation « à renseigner » pour US-05.
- B9 à mesurer.
- B10 OK.
- B11 OK — « US-05 finit à 1,012–1,015 vers 22 °C ; Belle Saison plus sèche, Windsor et WLP002 plus rondes, Voss plus chaude ».
- B12 OK — chrome de s1.
- B13 OK — cibles de 26 px sur chaque segment, sans chevauchement sauf US-05/Verdant IPA (3,5 px d'écart : Verdant se touche à droite de
  1,015).
- Écarts voulus : B3 (au plafond).

## Ce qui tient, ce qui casse
Tient : « ce que la levure change » est le choix lui-même ; sept levures comparées sans tableau. Casse : les sept segments ne couvrent pas les
1 734 références (le champ sert au reste) ; US-05 et Verdant IPA se chevauchent presque ; une température médiane écrase la plage (Nottingham
10–25 est posée à 17,5) ; 80 mots.

## Contrôles
COMMUN OK. PAGE OK. MOTS 80. Captures ouvertes : `z4-repos-390.png`, `z4-vide-390.png`, `z4-liquide-390.png`, `z4-repos-1280.png`,
`z4-haut.png`, `z4-page.png`. Corrigé après ouverture : bulle de dose qui chevauchait Belle Saison (retirée, la dose est sur la ligne),
connecteur à 8 px, « Windsor » coupé à droite, ligne d'effet empilée, mots de l'axe rognés par le SVG.
