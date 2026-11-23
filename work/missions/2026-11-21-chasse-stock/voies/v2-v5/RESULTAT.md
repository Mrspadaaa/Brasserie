REPRISE : work/missions/2026-11-21-chasse-stock/voies/v2-v5/RESULTAT.md — V5 faite ; V2 faite sauf le test vitest, la capture 390-cave/1280 à ouvrir et la largeur de la zone de toucher (DÉCISION)

## Fait (commit 7f8e894f0 dans port-carnet, par chemins, index temporaire ; contexte 172 k atteint, d'où la reprise)
V5, `src/ui/equipment/ListFil.tsx` : `nomInsecable` (espace insécable entre un nombre et L, ml, kg, g, cm…) sur les trois endroits où le nom s'écrit (ligne du haut, fil, « sans échéance »). `list.css` : inchangé, inutile.
V2, `src/ui/stock/MurStock.tsx` : bulle posée au-dessus du mur (sous le mur sinon), jamais sur une rangée ; libellé « Oslo · Voss (+2) 43 » (espace avant le compte) ; indice `[data-suite]` « › » dans chaque rangée.
`murMiseEnPage.ts` : `marquer()` après les scripts de la maquette : une rangée dont la dernière colonne dépasse la planche reçoit `data-defile` (elle défile) et allume l'indice ; une rangée qui tient ne change pas.
`murAjustements.css` : défilement + indice + bulle `min-height:44px`. `liste.css` : « Lire l'échelle » et « Replier » 44×44 (marges négatives : en-tête toujours 36 px de haut).
Contrôles : `scripts/parcours/stock-etapes/mur.mjs` (STG-1, STG-2, STG-3, STG-6, STG-NOTE-1 part V2), `materiel.mjs` (STC-16). BUGS.md à la main (6 lignes en « en cours — V2/V5 corrigé… »), `controle-bugs.mjs` : « BUGS OK : 1733 bugs, 215 ouverts, 183 sources ».

## Critères
- ROUGE sur tour8 (build `parcours-stock-build-ewrV2U`) : « ROUGE OK (5 contrôles rouges) » STG-1, STG-2, STG-3, STG-6, STG-NOTE-1 ; « ROUGE OK (1) » STC-16 (« 120 L » COUPÉ, cellule 179 px).
- VERT sur l'arbre : mur à 390-clair, 1280-clair, 1280-cave « PARCOURS STOCK OK » ; matériel à 390-clair et 1280-clair « PARCOURS STOCK OK » (STC-16 « 120␣L … sur une ligne »). STG-2 : bulle 254×44, « aucune rangée » recouverte. STG-NOTE-1 : 44×44.
- Captures ouvertes : `stock-v2-rouge/390-clair-mur-repos.png` (tour8 : Autres coupée), `stock-v2-vert/390-clair-mur-bulle.png` (bulle au-dessus du mur, Strata cerclée), `stock-v2-vert4/390-clair-mur-levures.png` (indice « › » à droite des Levures, « Autres » défilable). Non ouvertes : 390-cave, 1280-clair, 1280-cave (passes jouées, captures prises).
- Essais : 2 sur STG-6 (regex `\+\d+\s*\d`, la fixture n'avait qu'une souche par colonne : trois levures ZZ TEST injectées dans l'étape).

## Doutes et limites
- STG-3 : hauteur de zone mesurée 52 à 70 px (déjà ≥ 44 ; rouge sur tour8 par la bulle de 41 px et la marque Levures hors planche). La LARGEUR reste le pas des marques (10 px houblons et malts, 22 px levures) : 24 px par marque est impossible sans changer le dessin. Le contrôle exige donc : zone ≥ 44 de haut, bulle de confirmation ≥ 44.
- STG-1 : la planche des Levures défile (touch-action pan-x) : sur CETTE rangée, le glisser horizontal fait défiler au lieu de balayer les marques (le toucher et le second toucher marchent). Les pastilles « Saison · Sour » recouvrent le titre « Autres » avant défilement (comme avant ; non traité).
- La bulle est loin de la marque touchée pour les Levures (3 rangées plus bas) ; la marque touchée garde son cadre.
- Test vitest `tests/unit/stockMurToucher.test.ts` : NON écrit (la logique est dans le DOM, couverte par le parcours). tsc non relancé après les dernières retouches (murMiseEnPage est `@ts-nocheck`).
- Non fait : étape 390-cave du mur ; 1280-cave de matériel.

## DEMANDE EXECUTANT
1. `cd port-carnet && node scripts/parcours/stock.mjs "$TEMP/stock-v2-4passes" --seulement mur` → `PARCOURS STOCK OK` ; ouvrir `390-cave-mur-levures.png`, `1280-clair-mur-repos.png`, `1280-cave-mur-bulle.png`, `390-clair-mur-entete-liste.png` (en-tête Malts : légende non écrasée par les deux boutons de 44 px).
2. `node scripts/parcours/stock.mjs "$TEMP/stock-v5-4passes" --seulement materiel` → OK (4 passes) ; ouvrir `390-clair-materiel-fermenteur.png`.
3. `npx tsc --noEmit -p . 2>&1 | grep -E "MurStock|ListFil|murMiseEnPage"` → aucune ligne.
4. Rouge : `--build …ewrV2U --seulement mu --rouge STG-1,STG-2,STG-3,STG-6,STG-NOTE-1,STC-16` → `ROUGE OK`.

DÉCISION À PRENDRE : largeur de la zone de toucher des marques (STG-3). Options : (a) garder le pas (10 px) et la visée corrigée par la bulle (44 px) et le balayage ; (b) ajouter ‹ › de 44 px dans la bulle pour passer à la marque voisine (change la maquette sy/fA, à lui). Recommandation : (a).
CONNAISSANCE : aucune
LEÇON PROPOSÉE : un contrôle de libellé teste le texte DOM, où l'espace visuel (marge) disparaît : « +2 » collé au compte se lit « +243 » (regex `\s*`, pas `\s+`).
