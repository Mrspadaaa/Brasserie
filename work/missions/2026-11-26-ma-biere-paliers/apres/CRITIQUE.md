OK — 7 problèmes, 1 bloquant

Version : 136946d5b + modifications non commitées (worktree ma-levure-1911-5589ea, 26.11)
Juge : Opus, à la place de Fable (interdit). Mode test d'écran : « combien et quels problèmes ? »
Base comparée : maquette r2 du 14.11 (courbe à poignées ↕ ↔, « + » aux frontières, bandeau à gros chiffres, mash-out à interrupteur). Ces éléments sont tous présents sur les captures. Aucun écart à sa maquette.

Toutes les captures sont en thème clair, à 390 px. Pas de sombre ni de 1280 : la consigne du 22.11 dit « téléphone surtout ».

| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| 04-palier-touche (après) | clair | 390 | palier touché | 0 | 0 |
| 07-ajout-fin (après) | clair | 390 | « + » de fin | 3 (n° 1, 4, 5) | 1 |
| 08-ajout-frontiere + banc.log p6 | clair | 390 | « + » entre 72 et 75 | 1 (n° 1) | 1 (le même) |
| 10-temp-tapee (après) | clair | 390 | 64 tapé après 72 | 2 (n° 2, 6) | 0 |
| 14-mashout-touche | clair | 390 | mash-out touché | 1 (n° 2) | 0 |
| c06-puce-malt | clair | 390 | puce de malt touchée | 1 (n° 7) | 0 |
| c13-sels-repos | clair | 390 | Eau › Sels, « + » au pied | 0 | 0 |
| c05-sur-mesure-rendu | clair | 390 | « Sur mesure » rendu | 0 | 0 |
| c03-ajout-tete | clair | 390 | « + » de tête | 2 (n° 2, 3) | 0 |
| 06-duree-glisse | clair | 390 | durée glissée | 1 (n° 3) | 0 |

## Problèmes

1. **Bloquant (sens métier, valeur fausse) : vignettes 07 après et 08.** Un palier ajouté là où aucun repos type n'existe reçoit une température absurde. Le « + » de fin pose un « Palier chaud » à 75 °C pendant 15 min juste avant le mash-out à 76 °C. Le « + » de la frontière 72 | 75 pose un deuxième « Palier chaud » à 74 °C (banc.log p6). On obtient 72, 74, 75, 76 : quatre paliers sur 4 °C. Ce qu'il dirait : « 75 puis 76 ? 74 puis 75 ? Ça existe pas, ce palier sert à rien. »
2. **Mineur : vignettes 10 après, 14, c03.** Dans une colonne étroite (15′ ou 10′), la poignée ↔ est posée à 15 à 25 px du « + » de la frontière suivante. Sous le pouce, les deux cibles se touchent. Ce qu'il dirait : « Je veux allonger, il m'ajoute un palier. »
3. **Mineur : vignettes c03 et 06.** Les noms ne suivent plus la température. Le palier glissé à 72 °C s'appelle toujours « Saccharification », et le « + » de tête crée une autre « Saccharification » à 67 °C : deux paliers portent le même nom. Pourtant, une température tapée renomme le palier (64 °C devient « β-amylase », vignette 10). Ce qu'il dirait : « Deux saccharifications ? »
4. **Mineur, lisibilité : vignette 07 après.** La ligne pointillée de repère du palier touché (75 °C) passe juste au-dessus de l'étiquette « 72 °C » du palier voisin. On lit 72 sur la ligne de 75. Ce qu'il dirait : « C'est 72 ou 75, là ? »
5. **Mineur : vignette 07 après.** Une fois touché, le « + » de fin garde un cadre carré noir, alors que les autres « + » sont ronds. Ce qu'il dirait : « C'est quoi ce carré ? »
6. **Mineur : vignette 10 après.** L'alerte d'ordre écrit « 64,0 °C après 72,0 °C », avec des décimales, alors que la courbe et le bandeau disent 64 et 72. Ce qu'il dirait : « 64,0 ? »
7. **Mineur : vignette c06 (hors paliers, mais sur la version).** Après la puce de malt (ZZ TEST — Caramünch, 0,40 kg, « 1 couleur à renseigner »), OG, IBU et EBC passent tous à « – ». Une seule couleur manquante efface aussi l'OG et l'IBU. Ce qu'il dirait : « J'ajoute 400 g de cara et je n'ai plus d'OG ? » Le malt de test n'a peut-être pas de potentiel ; c'est à vérifier sur un malt réel de son stock.

## Doutes (non comptés)

- Puce de malt sans clavier : en Chrome de bureau, seul le focus le prouve (BUTTON « Malts/sucres », banc.log). Il faut le confirmer au téléphone, sur l'app déployée (ZZ TEST).
- Renommage automatique : quand il tape une température, un nom qu'il a écrit lui-même est-il écrasé ? Seul un nom posé par l'app est visible sur les captures.
- L'alerte d'ordre (vignette 10) tombe sous Rinçage, loin de la courbe et du bandeau. Elle reste visible à 390 sans défiler sur cette capture, mais peut-être pas avec plus de paliers.
- Le test de recouvrement du « + » flottant liste, sous lui, Stocks, Clients et Bilan, c'est-à-dire des pages cachées dans le DOM. Rien de visible sur les captures.

## Ce qui est réglé (constaté)

- La poignée ↕ suit le doigt (05 : 72 °C) ; ↔ est dans la courbe au bord droit (04, 06 : 70 min).
- « + » de tête présent (c03).
- Total « ≥ » quand une montée est inconnue (10, c05).
- « Sur mesure » rend ses paliers (c05).
- Sur Eau › Sels, le « + » est au pied et ne touche plus « 2. Sels », « Doser » ni « Repartir… » (c13).
- Les noms de repos remplacent « Palier 2 / Palier 3 » (07, 10).
