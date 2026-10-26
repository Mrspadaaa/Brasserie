OK — composition de Comparer : farnésène, linalol, géraniol sur leurs lignes, reste « autres » sans double compte ; contrôle rouge puis vert

## Fichiers écrits
- `src/ui/hopIndex/comparer/Huiles.tsx` : `CompositionVue` (7 groupes), `COMPOSES`, nouvelle `mesureDe()`. `HuilesVue` (autre vue) intacte.
- `src/ui/hopIndex/comparer/valeurs.ts` : `duCatalogue()` lit aussi `oils.farnesene` (BM) ; `compose(cle, 'farnesene')` marche donc comme celles du linalol. Aucun autre appelant ne l'utilise (CHIMIE n'a pas de farnésène).
- `tests/integration/comparerValeurs.chrome.mjs` : nouveau bloc « o1 » et option `--trio saaz` (Saaz CZ, Citra, Hallertau Blanc).
- `comparer.css` : non touché (la grammaire existante suffit ; aucune règle ajoutée).
- `captures/nelson/` (390 et 1280 de Nelson Sauvin, Citra, Mosaic) et `captures/saaz/` (390 et 1280).
- GATES.md n'existe pas dans la voie : critères pris dans VOIE.md.

## Ce que fait la composition
Ordre : myrcène, humulène, caryophyllène, farnésène, linalol, géraniol, autres. Une ligne sans valeur chez aucun houblon comparé n'est pas montrée.
- Myrcène, humulène, caryophyllène : inchangés (`oils` de Beer Maverick).
- Farnésène, linalol, géraniol : `compose()`, la source du tableau de chimie (fiches + catalogue, enveloppe). Inconnu : barre hachurée et « ? ». Plage sous 10 % : une décimale (« 0,4–0,7 % »), comme le tableau.
- Info-bulle (`title`/`aria-label`) : les sources s'y ajoutent (« Citra, linalol : 0,5–2 % (Hopsteiner, Beer Maverick…) »). Rien de visible en plus.
- **Reste « Autres · β-pinène, sélinène… »** (gardé, comme demandé ; il disparaîtra à la seconde étape). Valeur : `oils.others` publiée par Beer Maverick moins les plages du linalol et du géraniol connues, en intervalles : [bas − haut(s), haut − bas(s)], bornés à 0. Repli sans valeur publiée : 100 − myrcène − humulène − caryophyllène − farnésène, même soustraction.
- Pas de double compte, garanti ainsi : (1) `others` ne contient pas le farnésène (vérifié : somme des milieux ≈ 100 sur 216 des 234 houblons du catalogue qui ont tout) ; (2) toute huile qui a une valeur pour ce houblon ET sa propre ligne est retranchée du reste ; (3) une huile sans valeur reste dans le reste publié mais sa ligne est hachurée : elle n'est comptée nulle part ailleurs. Le contrôle borne en plus la somme des milieux à 102 %.
- Le reste n'est montré que si un houblon comparé atteint 1 % en haut de plage.

Valeurs (sources citées) : Nelson Sauvin : linalol 0,4–0,7 (HS), géraniol inconnu, farnésène 0–1 (BM) ; Citra : linalol 0,5–2 (H1, H7c, H8 + BM), géraniol 0,2–0,8 (H1, H8), farnésène 0–1 ; Mosaic : linalol et géraniol inconnus (aucune source), farnésène 0–1 (BM). Reste : NS 5–49, Citra 5–27, Mosaic 20–40 (publié, rien à retrancher). Saaz CZ : reste 1–40.

## Critères
- Contrôle rouge sur 50f00b78 (arbre jetable dans `%TEMP%/o1-vieux`, `git archive` + `.env`, `.env.local`, `seedData.ts`, `prototypes/houblons/data.json`, `node_modules` en jonction, supprimé ensuite) : `ECHEC composition · farnesene / linalol / geraniol : … → ligne propre` ; `ECHEC titre de « autres » (β-pinène, linalol, géraniol) nomme des huiles qui ont leur ligne : linalol, geraniol` ; `COMPARER VALEURS ECHEC (4)`, en 390 et en `--large`.
- Vert après : `COMPARER VALEURS OK` en 390 (76 contrôles) et en `--large`, Nelson Sauvin/Citra/Mosaic ; et `--trio saaz` en 390 et `--large` (74 contrôles). Somme des milieux : 100 % pour les 6 houblons.
- `npx vitest run tests/unit/hopIndexV4 tests/unit/designTokens.test.ts` : 26 fichiers, 245 tests verts (`moteurInchange` compris).
- `npm run build` : `✓ built in 21.33s`.
- `node scripts/audit_inputs.mjs` : `INPUT PROTECTION AUDIT PASSED: 647 protected usages in 335 files`.
- Captures ouvertes : `captures/nelson/composition-entiere-390.png`, `captures/saaz/composition-entiere-390.png`, `captures/nelson/composition-1280.png`, comparées à `c2…/captures/composition-390.png`. Seules les lignes voulues ont changé : trois lignes de plus (farnésène, linalol, géraniol), le titre du reste, sa valeur retranchée. Myrcène, humulène, caryophyllène identiques. Hachures lisibles (Mosaic/linalol, NS et Mosaic/géraniol, Saaz et Hallertau/géraniol). Les barres du farnésène sont des traits fins : c'est l'échelle 0–100 %, 0–1 % de l'huile.

## Essais
Contrôle : 2 (le premier test de titre passait à tort sur 50f00b78 : il ne regardait que les lignes de la composition ; il regarde maintenant aussi les lignes du tableau de chimie, où linalol et géraniol sont déjà séparés). Un 1280 de Nelson a échoué une fois (timeout au chargement, ligne 36) puis est passé au rejeu : flakiness du banc, pas de la voie.

## Doutes et limites
- Mots d'arôme : « frais, vert, floral », « floral, lavande, agrumes », « rose, floral » viennent de la consigne. Aucune donnée du dépôt ne les porte mot pour mot : `composes-houblon.json` range le farnésène « boisé, vert, herbacé » (consigne du 19.10), et `FAMILLE_COMPOSE` classe linalol et géraniol « floral ». « lavande » est dans les tags du catalogue pour d'autres houblons. À valider par le brasseur.
- L'en-tête « mesuré · Beer Maverick » est inchangé, alors que farnésène, linalol et géraniol viennent aussi de fiches (H1, H8…) et d'Hopsteiner. Les sources sont dans l'info-bulle ; texte visible non modifié (« aucun texte en plus »).
- Incohérence qui existait déjà : Citra myrcène 60–70 % dans la composition (Beer Maverick) et 28,6–70 % dans le tableau (enveloppe des fiches). Je n'ai pas changé les trois lignes d'origine.
- Quand le linalol est connu et pas le géraniol (Nelson Sauvin), le reste contient encore le géraniol, inconnu : le titre ne le dit pas.
- Plage « > x » (borne haute ouverte) traitée comme inconnue ; aucun cas dans les données actuelles.
- Dans le catalogue, 18 houblons ont déjà une somme de milieux Beer Maverick au-dessus de 102 % (Amarillo 106,5, etc.) : le contrôle ne les teste pas (trios fixes), mais un trio avec l'un d'eux échouerait par les données, pas par le code.
- À 1280, la capture d'élément de la composition est coupée par le rail (feuille défilante) ; les captures de page sont complètes.

DÉCISION À PRENDRE : en-tête « mesuré · Beer Maverick » — options : (a) laisser, sources dans l'info-bulle ; (b) « mesuré · sources » ; (c) restreindre farnésène, linalol, géraniol à Beer Maverick/Hopsteiner. Recommandation : (b) au moment de la seconde étape, quand les fiches fournisseurs arrivent.
DÉCISION À PRENDRE : myrcène, humulène, caryophyllène via `compose()` (même source que le tableau) — options : garder Beer Maverick seul (actuel) ou l'enveloppe. Recommandation : garder, il l'a choisi ainsi (cmc2k) ; en parler avec la seconde étape.

CONNAISSANCE : `others` de Beer Maverick exclut le farnésène (publié à part) : myrcène + humulène + caryophyllène + farnésène + others ≈ 100 sur la majorité du catalogue.
LEÇON PROPOSÉE : aucune
