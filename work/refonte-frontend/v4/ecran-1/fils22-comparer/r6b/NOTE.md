r6b · Un radar par houblon (« Lequel pour ma stout : Cascade, Idaho 7 ou Galaxy ? »).

## Choix portés
- Radar : r3
- Base : dose égale
- Porte : non
- Descripteurs : B

## L'angle, et ce que j'en ai fait
Point de départ : « le rendu r3 en tête : trois petits radars avec intervalles, deux par rangée, puis la chimie de chacun en lignes rattachées aux familles ».
- **Une quatrième case, la référence** : la grille de 2 × 2 commence par « Ta 16D » (la bière d'aujourd'hui). Le résineux est en orangé : il est « marqué » à la dégustation du 18.10, donc hors du style. La ligne de la carte dit « trop » pour le résineux et « plus » pour le floral, sa demande. Chaque radar de houblon garde ta 16D en trait gris dessous : on voit ce que le houblon déplace, pas seulement sa forme.
- **Chaque radar répond à la question** : le profil est simulé (~) dans ta 16D, à 4 g/L après fermentation, 3 j, US-05. Ce ne sont pas les fiches. La zone du style est un anneau clair, aux deux tiers « au style ». Ce qui en sort se voit en orangé (Galaxy en tropical).
- **L'intervalle, sur l'axe** : la plage possible du moteur (bas → haut) est un trait pâle posé sur chaque axe, à la couleur du houblon. Court, c'est sûr (Galaxy en baies : 13 à 35). Jusqu'au bord, ça peut dépasser. Une bande en polygone aurait couvert tout le disque, car presque tous les « haut » dépassent le domaine.
- **Le verdict sous chaque radar, calculé** : le gain floral en crans du style (cran = bande ÷ 3), « le plus » sur le meilleur, et « hors 16D » quand une famille sort du style alors qu'elle y était avant. Ta 16D porte « ~+2 crans chacun » en résineux : aucun des trois ne baisse le résineux, chacun en ajoute.
- **Penser en brasseur, sur la carte** : nom, α du lot (≠ pour Galaxy, 17,2 % hors de ses fiches 11–16 %), stock en icône, rôle en mot, puis les arômes de ses fiches en couleur. La part « autres » (B) est un segment gris dans cette barre (Galaxy : cannabis, dank, 29 %). L'IBU vient après : « à cru : non modélisé », écrit au pied de la chimie.
- **La chimie du cône** : une ligne par composé, avec le picto de sa famille, et une colonne par houblon. Chaque valeur est une plage avec sa barre, à l'échelle de sa ligne. Les lignes sont rangées par unité : % de l'huile (le floral d'abord, puis le résineux), thiols en µg/kg, huile totale. « inconnu » et « non détecté » sont hachurés, jamais 0. « ≤10 » d'Idaho 7 porte « à confirmer ».
- **À un toucher** : le panel OSU (la courbe de dose de Cascade, sans molette, la zone 4–8 g/L, un trait à ta dose, les notes H21 de chaque houblon ; pour Idaho 7 et Galaxy, « pas de courbe publiée ») et les vraies valeurs en bière (Kishimoto 2008, Lafontaine 2019, McCabe 2023 « à vérifier » ; Galaxy inconnu).
- **Seul facteur libre, la variété** : un × par carte retire un houblon (jamais sous deux) et sa colonne de chimie ; « + Galaxy » le remet. La lentille au style / absolu (`data-lecture`) change l'échelle des radars. Le pont vers Dryhopper vit dans un `nav`.
- **Fiche à l'appui long** : la fiche g1 du socle de v1, fidèle à la base. Sa ligne « sans famille » devient la part « autres » dessinée, avec « à corriger ». Pour Cascade, « fruité : mot générique, écarté ».
- **Descripteurs B** : les réglages sont proposés par le pilote et marqués « à corriger par le brasseur » dans la légende (mots génériques écartés, seuil 25 %, plafond 33 %) et dans la fiche.

## Ce qui casse
- **Les plages sont énormes** : presque tous les « haut » simulés touchent le bord. Les traits pâles disent surtout « on ne sait pas », sauf pour Galaxy. C'est honnête, mais c'est chargé sur le radar d'Idaho 7 (rouge vif).
- **La plage de ta 16D vient surtout des thiols inconnus de Nugget** (`hautPartiel`). Son radar est presque un trait vers le résineux.
- **Les écarts de floral sont petits** : +0,9, +1,3 et +0,9 cran. « le plus » distingue Idaho 7 sur un écart de 0,4 cran, en confiance moyenne. Cascade est en confiance bonne.
- **79 mots au premier écran pour 80** : la marge est faible. Les « ? » écrits dans les radars ont été retirés pour tenir : le secteur hachuré dit seul l'inconnu, et la légende le nomme.
- **Picto « épicé »** : c'est celui du socle (grains), refusé trois fois. Il attend le choix de la planche r4.
- **Dépendance** : le générateur importe `fils21-choisir/v1/socle.mjs` (habillage l8g, pictos, légende, fiche g1). Le socle lit aussi d'anciens fichiers (c1, profils-simules), mais aucun chiffre de la page n'en vient : l'α est vérifié contre comparer-stout.json, et le générateur s'arrête s'il diverge.
- **data-valeurs** des séries du radar : la valeur −1 marque une famille inconnue (listée dans `data-inconnues`). Le polygone saute cet axe, sous un secteur hachuré.

## Contrôles (22.10, sur etat.html)
- COMMUN OK (sans MOTS, joué à part) ; MOTS OK (79) ; UNE-QUESTION OK (1 groupe libre : houblon).
- ACQUIS OK (4/4) : radar r3 et chimie au repos, panel OSU et valeurs à un toucher.
- ALPHA OK ; SANS-FAMILLE OK au seuil 0,25 (Galaxy 29 %).
- Geste joué dans Chrome : retirer Galaxy enlève sa carte et sa colonne ; le retrait est refusé sous deux houblons ; « + Galaxy » le remet.

## Pire contraste
4,75:1, « trop » (orangé #c2410c sur le fond de la carte de ta 16D), sur 77 textes mesurés.

## Fichiers
`generer.mjs` → `etat.html` ; `captures.mjs` → `../captures/r6b-390.png`, `r6b-premier-ecran.png`, `r6b-fiche-390.png` (appui long sur Galaxy), `r6b-toucher-390.png` (panel OSU et « En bière » ouverts), `r6b-absolu-390.png`.
