# sbz7c · Gramme pour gramme, passe 3 (après le REJET de sbz7b)

- Chaleur : **chaude** (série z) ; baseline suivie comme sbz7b. Question, contexte et facteur libre inchangés (le remplaçant ; le moment réglable d'un toucher par la puce).

## Corrections du verdict (critique/PASSE2.md)
1. **Rien sous le pied** : la carte du houblon touché s'ouvre en place, juste sous sa ligne (Nelson Sauvin au repos ; `-toucher.png` montre Galaxy ouverte sous Galaxy). Plus de carte derrière le pied fixe.
2. **« nez 100 »** : à 60′ la composante d'arôme du moteur est la part non étrangère (l'arôme d'un ajout à 60′ part à l'ébullition) : elle s'écrit « rien d'étranger 100 », jamais « nez ». Au whirlpool seulement, « nez 65 ».
3. Pictos de famille sur une troisième ligne du nom, jamais coupés ni pâlis (plus d'opacité au style : D90).
4. Le trait de Nugget commence sous la ligne des chiffres : « ~51–64 », « ~8–10 » ne sont plus barrés.
5. Retouche commune : Nelson Sauvin au whirlpool en plage **29–89 (arôme ?)** avec sa raison dans la carte (« 83 % de ses mots sans famille, le moteur lit le nez 25 ») ; score en plage hachurée dans la ligne.
6. Moins de mots : la phrase de tête tient en une ligne, plus de clé au repos (la légende derrière « ? »).

## Greffes reçues
- « Ma stout après » (sbc1b) : non prise, pas d'après-profil par remplaçant à 60′ dans les données de cette page ; la fiche au long appui garde le radar et les arômes cités (retouche commune).

## Ce qui tient / ce qui casse
- Tient : le piège « 46 g du suivant » et la dose juste sur la même ligne, la carte à portée du doigt, le whirlpool d'un toucher, chaque nombre du moteur.
- Casse : au whirlpool la bande 16D disparaît (sans sens pour 9 IBU, dit dans la légende) ; le classement au whirlpool est celui du moteur, Nelson Sauvin en dernier avec sa plage.

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
