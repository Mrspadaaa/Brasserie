# sbz7b · Gramme pour gramme, l'α fait l'amertume et la dose (passe 2 de sbz7, absorbe sbc3)

- Chaleur : **chaude** (série z) ; baseline suivie (pictos au trait, familles en couleur, α du lot puis des fiches, usage en mot, au style par défaut et zone 16D, stock en petit badge, thème blanc, croix, Annuler à côté de Remplacer, légende derrière « ? », fiche au long appui, « ~ » et hachures).
- Question : « Lequel à la place de Nugget ? » ; contexte : Nugget 46 g, moment (à 60′, réglable d'un toucher vers le whirlpool), IBU égal, stout 16D ; facteur libre : le remplaçant.

## Idée
Une seule règle, deux lectures : l'α en haut, l'IBU que font 46 g du remplaçant en bas (gramme pour gramme). Chaque ligne porte un trait par fiche (Beer Maverick, Hopsteiner), l'anneau du lot (orangé quand 46 g sortent de la 16D, 50–70 IBU), ou une pilule hachurée quand il n'y a pas de lot ; le trait noir est Nugget. À droite, la dose qui ramène à l'IBU de Nugget (~, plage sans lot), le score du moteur (~, ou plage hachurée quand les huiles sont inconnues), le stock et le manque. Touche « à 60′ » : la feuille propose le whirlpool ; 46 g n'y font que ~9 IBU, l'ordre se refait sur le nez.

## Retouches du verdict
- Ligne 78 corrigée : l'IBU à 46 g part de l'α du lot (`ibu46.json`, calculé par `ibuPerGram`), la plage variétale seulement sans lot ; 12 lignes cohérentes (G5).
- sbc3 absorbé : la bande d'α avec un trait par fiche et le lot en anneau, la colonne de Nugget, la carte du bas « Nelson Sauvin mixte α 9,6 % → ~62 g · sous ses fiches · 10–13 BM 2023 ; 12–14 HS 2025 · β 5–8 ».
- u4 : score en plage hachurée (Trident, Altus 79–99 à 60′ ; 35–65, 38–68 au whirlpool) ; « ~ » sur le score et la dose.
- Nelson Sauvin : part « autres 83 % » dessinée dans sa ligne et sa carte, avec ses mots (vin blanc, groseille à maquereau, raisin, sauvignon blanc).
- « Si tu achètes : Magnat ~37–54 g, ~99 · Yeoman … » sous la carte, recalculée au whirlpool (Falconer's Flight, Pacific Sunrise, Vic Secret).
- Aucun « ×0,6 » à l'écran : les poids sont dans la légende.

## Ce qui tient / ce qui casse
- Tient : le piège « gramme pour gramme » et sa correction sur la même ligne ; le moment change la réponse sans sélecteur libre ; tout nombre vient du moteur.
- Casse : l'arôme n'est que deux pictos par ligne (la carte en dit plus) ; la fiche long appui ouvre aussi depuis la colonne de droite (elle porte `data-houblon` pour les marqueurs de G5) ; au whirlpool la bande 16D n'a plus de sens et disparaît (dit dans la légende).

## Nombres recomptés sur le moteur (`substitutes`, `ibuPerGram`, recette S1, 24.10)
- Référence : Nugget 46 g, α 13 % (lot) ; à 60′ 1,2985 IBU/g → 59,73 IBU ; au whirlpool 0,1966 IBU/g → 9,04 IBU. L'IBU « à 46 g » d'un remplaçant = 46 × ibuPerGram(α du lot, moment) ; sans lot, la plage variétale Beer Maverick donne une plage.
- À 60′, 46 g font : Nelson Sauvin ~44 (α 9,6) · Galaxy ~79 (17,2) · Sabro ~62 (13,4) · Idaho 7 ~58 (12,7) · Citra cryo ~114 (24,8) · Target ~52 (11,3) · Cascade ~30 (6,5) · Magnat ~51–74 (11–16) · Yeoman ~55–74 (12–16) · Trident ~51–64 (11–14) · Altus ~69–85 (15–18,5) · Helios ~77–97 (16,8–21). Doses pour 60 IBU (moteur, « même IBU ») : 62,3 · 34,8 · 44,6 · 47,1 · 24,1 · 52,9 · 92 · 44,3 (37,4–54,4) · 42,7 (37,4–49,8) · 47,8 (42,7–54,4) · 35,7 (32,3–39,9) · 31,6 (28,5–35,6) g.
- Au whirlpool, 46 g font : Nelson ~7 · Galaxy ~12 · Sabro ~9 · Idaho 7 ~9 · Citra cryo ~17 · Target ~8 · Cascade ~5 · Magnat ~8–11 · Yeoman ~8–11 · Trident ~8–10 · Altus ~10–13 · Helios ~12–15 ; la dose pour 9 IBU est la même qu'à 60′ (l'IBU est linéaire en α et en masse).
- Scores (poids 60′ : amertume 0,6, huiles 0,2, arôme 0,2 ; whirlpool : 0,1 / 0,3 / 0,6) et rangs sur 318 : Magnat 99 (1er) → 76 (14e) ; Yeoman 99 (1er) → 45 (227e) ; Trident 99 (1er, huiles inconnues : 79–99) → 50 (185e, 35–65) ; Altus 99 (1er, 79–99) → 54 (157e, 38–68) ; Helios 97 (6e) → 74 (19e) ; Sabro 93 (27e) → 73 (24e) ; Idaho 7 92 (34e) → 79 (4e) ; Target 94 (213e, « houblon aromatique, cher pour amériser ») → 84 (2e) ; Citra cryo 88 (215e, cryo) → 61 (102e) ; Nelson Sauvin 86 (73e) → 44 (236e) ; Galaxy 85 (80e) → 59 (117e) ; Cascade 74 (222e) → 62 (95e). En tête au whirlpool, à acheter : Falconer's Flight 85 (dose 55,6 g, 49,8–62,9), Pacific Sunrise 81 (44,3 g), Vic Secret 79.
- Plage d'un score à composante inconnue : poids connus × composantes, l'inconnue ouverte de 0 à 100 (u4) : Altus à 60′ 0,2×100 + 0,6×99 = 79 → 99.
- Stock et manque : Sabro 30 g (−15), Idaho 7 20 g (−27), Target 5 g (−48), Cascade 60 g (−32) ; Nelson Sauvin 100 g, Galaxy 60 g, Citra cryo 65 g suffisent.

## Sorties des contrôles (24.10, rejoués sur sbz7b et sbz6b ensemble)
- G2 `controle-commun --page=etat.html --sans=mots` : COMMUN OK (couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, legende, parlant, brutes).
- G3 `controle-une-question --edition` : UNE-QUESTION OK (1 groupe libre : houblon) ; la puce du moment est un `button[data-edite="moment"]` dans `[data-contexte="moment"]`, `aria-controls` vers une feuille fermée au repos (deux réglages : à 60′, au whirlpool).
- G4 `mots-premier-ecran --max=80 --sans-donnees` : MOTS OK (sbz7b 80, sbz6b 75).
- G5 `controle-coherence-ibu` : COHERENCE-IBU OK (25 lignes : 12 lignes de sbz7b avec `data-ibu46`, `data-dose`, `data-alpha` sur la colonne de droite, et la carte de sbz6b).
- `controle-sans-famille` : SANS-FAMILLE OK (Nelson Sauvin 83 %, part « autres » dessinée, `data-role="autres"` `data-part="0,83"`).
- Captures ouvertes : `captures/<id>-60.png`, `-whirlpool.png`, `-page.png`, `-puce.png` (feuille du moment ouverte), `-toucher.png` (une ligne touchée), `-whirlpool-page.png`.
