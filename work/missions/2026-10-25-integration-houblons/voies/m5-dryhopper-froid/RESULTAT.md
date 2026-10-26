OK — page de choix : A, cinq variantes et la greffe D + F dans son vrai Dryhopper

## Fichiers écrits (tous dans la voie)
- `capturer.mjs` : ouvre son écran dans l'app et ajoute les variantes dans la page rendue (`?dev-local&etape=houblons`, `VITE_HOP_V4=on`, recette de a2 : Nugget 20 g à 60′, Cascade 80 g/20 L = 4 g/L, dry hop après, 3 j, 21C). Classes et nœuds préfixés `m5d-`, retirés après chaque capture ; écrit `fidelite.json`.
- `faire-page.mjs`, puis `page.html` : style et visionneuse de m1, repris par m3 et m4.
- `fidelite.json` : l'écran mesuré avant et après chaque ajout, avec les valeurs utilisées.
- `img/` : 11 captures de 390 × 844 (×2).
- Fichiers de travail (sonde, recadrages de la zone) : dans `%TEMP%/m5`.

## L'écran
`Quand ajouter Cascade ?`, avec le contexte « Cascade α 6,8 % 4,5–9 aromatique · 4 g/L · US-05 · Bière 21C ». Le bandeau affiche `IBU 28+?`, sur l'étape « après » et « 3 j ». A est identique à `a2-demande-reelle/img/sans-visee-dryhopper.png`.

La zone qu'il a barrée mesure 183 × 38 px. Elle va de x 19 à 202, de la bande IBU (bas à 411) jusqu'au rail (haut à 452). À droite, les légendes « levure active / possible, non chiffrée » commencent à x 204, et rien ne les recouvre.

Chaque variante gagne de 10 à 18 px sous la zone : le rail descend de 452 à 462-470 au plus. Les barres finissent à 761 au plus, au-dessus du pied (767) : les 12 familles restent visibles sans défiler.

## Passe après la critique (`critique.md` : D > B > F > E > C)
1. **C (bloquant)** :
   - « amer ±? » devient « amer 22–34 » ;
   - les pictos gardent leur couleur de famille. « hors » est porté par le fond #fff4ee et une bordure orange pleine, « près » par une bordure en pointillés.
2. **D** :
   - les étiquettes « amer ? / creep / limite » passent à 13 px, au gris lu dans le dessin (`.pq-dry-lb`). Ce gris rendu est rgb(102, 102, 102), le même que `--cave-400` : seule la taille a changé ;
   - « moyen » et la jauge du creep passent au noir. Je l'ai fait aussi en B, en E et dans la feuille Hop creep : l'orange reste à ce qui dépasse ;
   - la feuille « Amertume » porte les nombres sur la plage légendée (22,3 · 26,3 · 27,9 · 34,0). La phrase qui la répétait est retirée ; il reste « Signe non établi : Cascade seul −5,6 à −1,6 ; avec Centennial jusqu'à +6,1 ». Elle fait environ 37 mots.
3. **E** : « amer à froid » remplace « à froid ».
4. **Greffe D + F** (`df-greffe.png`, et `df-ouvert-creep.png` au toucher) :
   - les mini graphes « amer » (en plus large) et « limite » de D ;
   - le creep sort de la zone : c'est une bande sur le seul segment « après », juste au-dessus du rail, hachurée en bleu comme la bosse de levure, sans bordure et sans orange. L'étiquette « creep moyen » est sur un fond blanc.
5. En plus, d'après les greffes du critique : en B et en F, « amer ±6 » devient « amer 22–34 ». En B, la jauge est retirée de la puce creep : sinon, les puces tombaient sur trois rangs et recouvraient le début du rail.
6. F est laissée telle que le critique l'a jugée (bande orange). D + F en est la correction.

## Les variantes (valeurs de x1, telles quelles ; état avant la critique, corrigé ci-dessus)
- **A · l'actuel** : la capture sans ajout.
- **B · trois puces** (son exemple).
  - Puces : « amer ±6 », « creep moyen ▮▮▯ », puis les pictos végétal et herbacé avec « hors », les pictos résineux et floral avec « près ».
  - Chaque puce s'ouvre au toucher.
- **C · pastilles d'alerte**, la gravité par la couleur et les chiffres à un toucher :
  - pastille pleine (orange d'alerte) : végétal et herbacé « hors » ;
  - pointillés : résineux et floral « près » ;
  - teinte légère : « creep moyen » ;
  - gris en pointillés : « amer ±? ».
- **D · trois mini graphes** :
  - **amer ?** : la plage d'amertume autour de l'IBU à chaud. Le trait noir est à 28 ; en plein, les essais Cascade (22 à 26) ; en hachuré, l'enveloppe avec Centennial (22 à 34).
  - **creep** : une jauge de 3 crans, 2 allumés, et « moyen ».
  - **limite** : quatre colonnes rapportées à leur borne, sous une même ligne de limite en pointillés. Végétal et herbacé la dépassent (en orange, avec une flèche) ; résineux et floral restent juste dessous. Leurs pictos sont dessous, à 12 px.
- **E · en légende du dessin** : trois lignes au ton des légendes grises du graphe (« à froid » avec la plage et 22–34, « creep moyen », « limite » avec ses pictos). Un seul déclencheur.
- **F · le creep sur la frise** : la puce « amer ±6 » et la puce des limites dans la zone. Le hop creep est une bande orange hachurée posée sur le seul segment « après », juste au-dessus du rail : c'est là qu'il se produit, et le seul moment calculé par x1.
- **D · ouvert au toucher** (3 captures, un vrai clic sur la cellule) : la feuille s'ouvre sous la zone et repousse le rail.
  - **Amertume** :
    - la plage en grand, légendée « essais Cascade » et « avec Centennial » ;
    - « 27,9 à chaud → Cascade 22,3 à 26,3 (−5,6 à −1,6) ; avec Centennial 22,3 à 34,0 (jusqu'à +6,1) : **signe non établi** » ;
    - « équivalent d'amertume, pas un IBU mesuré » ;
    - la source : Maye, Smith et Leker 2016, 16 °C, 1 à 5 j.
  - **Hop creep** :
    - pourquoi : après fermentation, et Cascade cité par H68 ;
    - effets : atténuation, CO₂, diacétyle possible ;
    - publié : +0,6 à +1,3 % vol. à 10 g/L, et « ce brassin : ? » ;
    - inconnus : la température et la levure viable.
  - **Limites** : 4 barres avec leur borne (20,6 / 5, 13,5 / 5, 27,5 / 30, 24,4 / 30), la mention « indésirables 0–5 » et « plages larges, incertain ».

Honnêteté :
- Le signe de l'amertume n'est jamais rendu par un seul chiffre : « ±6 », « ±? » ou une plage à cheval sur le 28.
- L'ampleur du hop creep pour ce brassin s'écrit « ? ».
- L'IBU à chaud de la plage n'est pas en orange d'alerte : l'orange reste réservé à ce qui dépasse.

## Critères (rejoués après la passe)
- `node work/refonte-frontend/v4/tournoi/outils/controle-capture-fidele.mjs .../m5-dryhopper-froid/capturer.mjs` → `FIDELE OK (capturer.mjs : rien de caché, mesure gardée)`.
  - Sur les 11 mesures : 348 → 348 nœuds visibles de l'app, aucun bloc perdu.
- `node scripts/agents/verifier-page.mjs .../m5-dryhopper-froid/page.html --page-lot --captures %TEMP%/m5/page` → `PAGE OK (8 images chargées, lisible à 390 et 1280 px, sans erreur)`.
- La capture n'a produit aucune erreur de page.

## Captures ouvertes
- Les 11 de `img/`, ouvertes une à une : `a-actuel`, `b-trois-puces`, `c-pastilles`, `d-mini-graphes`, `e-ligne-a-froid`, `f-creep-frise`, `df-greffe`, `df-ouvert-creep`, `d-ouvert-amer`, `d-ouvert-creep`, `d-ouvert-limite`. Après la passe, j'ai rouvert les recadrages de B, C, D, E et D + F, ainsi que les feuilles « amer » de D et « creep » de D + F.
- La zone, recadrée pour chacune : `%TEMP%/m5/zoom-*.png`.
- La page : `%TEMP%/m5/page-haut.png` et `page-ordinateur.png`.
- Défauts corrigés en route :
  - en B, les puces tombaient sur trois rangs et recouvraient le début du rail ;
  - en E, la puce « limite » recouvrait « possible » ;
  - en F, la bande débordait de l'écran ;
  - en D, les pictos sortaient de la cellule ouverte et la légende chevauchait « 22 ».

## Ma préférence, en brasseur : D + F (la greffe), puis D
- Ses trois questions (« Amertume, hop creep ? Résineux ? ») y ont chacune leur réponse dessinée, dans l'ordre où il les a écrites.
- Elles se lisent sans mot :
  - la plage d'amertume chevauche le 28, ce qui dit « on ne sait pas si ça monte ou descend, Cascade seul fait baisser » ;
  - la jauge du creep est aux deux tiers ;
  - les quatre colonnes de limite montrent qui passe la ligne.
- C'est l'information la plus dense de la série sans texte ajouté (portrait : « Les bar de ce type sont plus informative »).
- D + F garde ces graphes et pose le creep là où il se produit, sur « après », dans le langage de la bosse de levure. La zone laisse alors plus de place à la plage d'amertume.

Prédiction : « D+F vachement bien, la plage autour du 28 c'est parlant et le creep sur après c'est logique, mais les pictos sous les colonnes sont petits. »

## À savoir
- Pendant la voie, une autre voie a modifié `src/ui/hopIndex/dryhopper/index.tsx` (★ dessinée après le trait du doigt, a3-etoile, 12:11). Les 11 captures finales sont toutes prises après ce changement : A et les variantes sont cohérentes entre elles. Je n'ai rien écrit dans `src/`.
- Les niveaux du hop creep (faible, moyen, fort) sont une convention de x1, pas une valeur publiée. La jauge à 3 crans en hérite.

DÉCISION À PRENDRE : aucune pour la voie. Le choix de la variante revient au brasseur (page.html). La question du facteur « variété » du hop creep, ouverte par x1, reste ouverte : la feuille ouverte l'affiche avec sa source (H68).

CONNAISSANCE : dans Dryhopper, à 390 px, l'espace sous la bande IBU côté ébullition mesure 183 × 38 px (x 19–202, y 412–450). L'écran garde 24 px de marge avant le pied : 18 px de plus y tiennent sans faire défiler les 12 barres.

LEÇON PROPOSÉE : aucune
