# sbz6c · La file des 318, passe 3 (après le REJET de sbz6b)

- Chaleur : **chaude** (série z) ; baseline suivie comme sbz6b. Question, contexte et facteur libre inchangés.

## Corrections du verdict (critique/PASSE2.md)
1. **Le vide du premier écran** : sous la carte, une table serrée remplit l'écran jusqu'au pied : « achat » (les cinq premiers à acheter : rang, α, dose ~, score) et « stock » (les six du stock : rang, α, dose ~, score, grammes et manque). Le contenu va au-delà du premier écran (page 906 px).
2. **Target 94 / 213e** : le drapeau dit la raison du rang, « 213e · cher pour amériser » (Target, Citra cryo « 215e · cher pour amériser ») ; un seul rang et un seul score par moment, ceux du moteur : à 60′ Target score 94 rang 213 (houblon aromatique relégué), Citra cryo 88 / 215 (cryo) ; au whirlpool Target 84 / 2, Citra cryo 61 / 102 (voir « Nombres »).
3. Les mots de l'échelle (partiel · proche · très proche) sous l'axe, plus barrés par les mâts ; « ≤ 40 » devient « 40 ».
4. D98 : plus de jauge dans la puce de contexte « 46 g → ~60 IBU égal » ; la bande 16D (zone du style) est dans la carte, sous « 46 g = ~62 IBU », en trait, pas en bouton.
5. Greffes : « 46 g = ~62 IBU → ~45 g pour 60 · reste 38 g » sur la carte (sbb7b, sbb5b) ; Nelson Sauvin au whirlpool en plage 29–89 avec sa raison (sbc1b) ; « cher pour amériser » comme raison du rang (NOTE → drapeau).
6. Moins de mots : 74 (phrase de tête courte, « Si tu achètes » remplacé par la table « achat », ranks en nombres).

## Ce qui tient / ce qui casse
- Tient : où tombe ton stock dans toute la file, la raison d'un rang qui contredit le score, le renversement d'un toucher, l'écran plein.
- Casse : six drapeaux seulement (Cascade, Hallertau Blanc, Motueka restent des traits) ; la table répète des nombres déjà sur les drapeaux (rang) pour gagner la lecture α · dose · score.

## Nombres recomptés sur le moteur (`substitutes`, `ibuPerGram`, recette S1, 24.10)
- Référence : Nugget 46 g, α 13 % (lot) ; à 60′ 1,2985 IBU/g → 59,73 IBU ; au whirlpool 0,1966 IBU/g → 9,04 IBU. L'IBU « à 46 g » d'un remplaçant = 46 × ibuPerGram(α du lot, moment) ; sans lot, la plage variétale Beer Maverick donne une plage.
- À 60′, 46 g font : Nelson Sauvin ~44 (α 9,6) · Galaxy ~79 (17,2) · Sabro ~62 (13,4) · Idaho 7 ~58 (12,7) · Citra cryo ~114 (24,8) · Target ~52 (11,3) · Cascade ~30 (6,5) · Magnat ~51–74 (11–16) · Yeoman ~55–74 (12–16) · Trident ~51–64 (11–14) · Altus ~69–85 (15–18,5) · Helios ~77–97 (16,8–21). Doses pour 60 IBU (moteur, « même IBU ») : 62,3 · 34,8 · 44,6 · 47,1 · 24,1 · 52,9 · 92 · 44,3 (37,4–54,4) · 42,7 (37,4–49,8) · 47,8 (42,7–54,4) · 35,7 (32,3–39,9) · 31,6 (28,5–35,6) g.
- Au whirlpool, 46 g font : Nelson ~7 · Galaxy ~12 · Sabro ~9 · Idaho 7 ~9 · Citra cryo ~17 · Target ~8 · Cascade ~5 · Magnat ~8–11 · Yeoman ~8–11 · Trident ~8–10 · Altus ~10–13 · Helios ~12–15 ; la dose pour 9 IBU est la même qu'à 60′ (l'IBU est linéaire en α et en masse).
- Scores (poids 60′ : amertume 0,6, huiles 0,2, arôme 0,2 ; whirlpool : 0,1 / 0,3 / 0,6) et rangs sur 318 : Magnat 99 (1er) → 76 (14e) ; Yeoman 99 (1er) → 45 (227e) ; Trident 99 (1er, huiles inconnues : 79–99) → 50 (185e, 35–65) ; Altus 99 (1er, 79–99) → 54 (157e, 38–68) ; Helios 97 (6e) → 74 (19e) ; Sabro 93 (27e) → 73 (24e) ; Idaho 7 92 (34e) → 79 (4e) ; Target 94 (213e, « houblon aromatique, cher pour amériser ») → 84 (2e) ; Citra cryo 88 (215e, cryo) → 61 (102e) ; Nelson Sauvin 86 (73e) → 44 (236e) ; Galaxy 85 (80e) → 59 (117e) ; Cascade 74 (222e) → 62 (95e). En tête au whirlpool, à acheter : Falconer's Flight 85 (dose 55,6 g, 49,8–62,9), Pacific Sunrise 81 (44,3 g), Vic Secret 79.
- Plage d'un score à composante inconnue : poids connus × composantes, l'inconnue ouverte de 0 à 100 (u4) : Altus à 60′ 0,2×100 + 0,6×99 = 79 → 99.
- Stock et manque : Sabro 30 g (−15), Idaho 7 20 g (−27), Target 5 g (−48), Cascade 60 g (−32) ; Nelson Sauvin 100 g, Galaxy 60 g, Citra cryo 65 g suffisent.


## Sorties des contrôles (24.10, rejoués sur sbz7c et sbz6c ensemble)
- `controle-commun --page=etat.html --sans=mots` : COMMUN OK.
- `controle-une-question --edition` : UNE-QUESTION OK (1 groupe libre : houblon) ; puce du moment = `button[data-edite="moment"]`, feuille fermée au repos.
- `mots-premier-ecran --max=80 --sans-donnees` : MOTS OK (sbz7c 74, sbz6c 74).
- `controle-coherence-ibu` : COHERENCE-IBU OK (25 lignes).
- `controle-sans-famille` : SANS-FAMILLE OK (Nelson Sauvin 83 %, part « autres » dessinée dans les deux états).
- Captures ouvertes : `captures/<id>-60.png`, `-whirlpool.png`, `-page.png`, `-puce.png`, `-toucher.png` (différente de `-60` : la deuxième ligne touchée), `-whirlpool-page.png`.
