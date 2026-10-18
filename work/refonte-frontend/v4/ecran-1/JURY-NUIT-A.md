# Jury de nuit A · rail (#134) et substitution (#137)

Juré neuf, **indicatif** : les étoiles aident le brasseur à choisir, elles ne choisissent pas.
Étalon : SPEC-BRASSEUR §6 (clair, dense mais lisible, juste pour un brasseur) et D45, D47, D55,
D61, D61 bis, D63, D64. Le 18.10, nuit.

Preuves : captures `fils8-rail/captures/*-pendant.png` et `fils11-substitution/captures/u*-vue-390.png`
regardées ; geste rejoué par moi dans Chrome headless (390×844, isMobile, hasTouch) sur
`pNN/index.html` et `pNN/cas-k3.html` (pastille de la première ligne tenue, descente par pas de
10 px, positions relevées à chaque pas) ; `controle-rail.mjs` relancé : p01, p02, p03 `RAIL OK`,
p04 `RAIL ECHEC` (D45, 4 à 20 px) ; `controle-fil6` et `mots-premier-ecran` relancés : u1 à u4
`FIL6 OK` et `MOTS OK` (84 à 89 mots). Les pixels cités sont des px CSS.

## Lot A · le rail (#134)

Commun aux quatre, hérité de la base : au toucher, les cartes se replient en lignes et
l'ébullition s'allonge. Motueka (10′) descend alors une fois de 229 à 302 px (p02 : 324). Ce saut
ne départage pas les variantes, mais il reste à faire regarder au brasseur.

| Question fermée | p01 bulle iOS | p02 Dock | p03 règle | p04 verre aimanté |
|---|---|---|---|---|
| À 35′, la hauteur se lit comme 35′ ? | oui : 39 % entre les graduations 60′ et 0′ (42 attendus) ; à l'œil, du rond « Ébullition » au rond 0′, 48 % (index), donc plutôt 31′ ; cas-k3 43 % | à peu près : 46 % entre graduations, 50 % à l'œil (lu 30′) ; c'est la pente de v4.1 en moins fort | oui, comme p01 | oui hors de la lentille ; sous le doigt, graduations irrégulières (D45) |
| Les minutes autour du doigt, sans chercher ? | oui : bulle à droite, ±15′ écrites (13 px), et les houblons de la plage | **non** : traits seuls ; la minute n'est écrite que dans la pastille, sous le pouce | oui : règle de 64 px, ±15′ écrites (12–13 px), sans les noms | **non** : deux chiffres de 9,5 px (< 12) sous le pouce, à moitié cachés par la pastille |
| Un houblon déjà posé bouge ? | non : 0 px pour Motueka, Cascade et Citra pendant tout le geste | oui, verticalement : le début du rail passe de 141 à 111 px ; Cascade et Citra descendent de 12 px | non : 0 px | oui : Motueka bouge de ±20 px quand Nugget passe |
| Deux houblons au même moment ? | oui : « Motueka · Nugget » réunis sur le rail et dans la bulle | oui, une étiquette réunie | oui, une étiquette réunie (la règle ne nomme rien) | lisible, mais le houblon tenu est chassé hors du rail : 71 px de côté à 10′ (x 16 → 87) |
| « À la apple » ? | oui, une loupe de texte iOS, placée à droite plutôt qu'au-dessus | façon Dock de macOS, mais l'échelle se tord sous le doigt | à moitié : une règle, pas une loupe | l'idée oui, la réalisation non |

| Variante | ★ | Pourquoi | Défaut principal |
|---|---|---|---|
| p01 · bulle iOS | ★★★ | Le seul rail qui ne bouge pas, avec une bulle qui écrit les minutes et les houblons, y compris les deux réunis | Bulle de 143×246 px à droite, centrée sur le doigt : elle peut finir sous la paume d'un droitier (à vérifier sur un vrai téléphone) ; sur index, 9 px pour 5′ (un pas de 10 px saute de 50′ à 40′) ; la dernière graduation est coupée au bord |
| p03 · règle à côté | ★★ | Même rail immobile, plus léger (64 px de large), minutes lisibles | La règle ne nomme pas les houblons et fait moins loupe que « règle » ; même finesse de 9 px pour 5′ |
| p02 · Dock sans état | ★ | Le grossissement suit bien le doigt (×2 près du doigt) | Aucune minute écrite hors de la pastille tenue sous le pouce ; l'échelle et les autres houblons bougent (début du rail −30 px) ; à 10′, 160 px de traits vides au-dessus (D55) |
| p04 · verre aimanté | ★ | L'idée d'un verre sur le rail est jolie | Échec D45 ; chiffres de 9,5 px sous le pouce ; le houblon tenu saute de 71 px de côté au contact d'un autre (D64 inversé) |

**Si le brasseur hésite (indicatif) :** p01, avec une bulle placée au-dessus du doigt comme sur
iOS, ou p03 s'il trouve la bulle trop grande.

## Lot B · la substitution (#137)

| Question fermée | u1 depuis la fiche | u2 depuis la recette | u3 en rupture | u4 libre (plages) |
|---|---|---|---|---|
| La réponse en 5 s ? | **non** : « Altus 99 » est lisible, mais c'est à acheter ; la grille de cases et les barres sans valeurs demandent la légende en bas | oui : la barre collée en bas dit « Nelson Sauvin 62 g · 59 IBU · Appliquer » | oui : « Oui, ton stock le remplace. », barre « Nelson Sauvin 62 g », bouton « Remplacer par Nelson Sauvin » | en partie : « Magnat et Yeoman, 99 sans inconnue » dit lequel est le plus proche, pas quoi prendre dans mon stock |
| La dose et l'IBU de la recette ? | dose oui (32–40 g) ; IBU non, seulement « à IBU égal » | oui, à chaque ligne : grammes et IBU sur la bande 16D (50–70) ; plage d'IBU quand l'α du lot est inconnu | dose oui (barres en g, « manque 15 g ») ; IBU dans le titre seulement (59,7 à 60′) | non au premier coup d'œil : doses en bas d'écran (Magnat 37–54 g) et IBU sans chiffre |
| Le stock d'abord ? | **non**, il vient après les cinq « très proche » (et son ordre 86, 85, 93 n'est pas expliqué) | oui | oui, c'est tout l'écran | **non** : icône seulement, rangé par le pire cas |
| Ce que le calcul ignore, dit sans noyer ? | oui : « ? » encadré, « partielle », encart en bas | oui : score souligné en pointillé, plages d'IBU, encart sous le pli | oui : hachuré, « prix inconnu » en une ligne ; la piste pâle (stock libre) n'a sa légende que sous le pli | oui, le plus franc des quatre (Altus 79–99) ; mais cette plage est calculée par la page, pas par le moteur |
| Un brasseur ferait confiance ? | moyennement : quatre ex æquo à 99 sans départage, ni α ni rôle sur les lignes | oui, mais ni α ni rôle ni arôme sur les lignes (ordre brasseur du brief : α, rôle, arômes) ; le score gris n'a pas de titre | oui : α et rôle sur chaque ligne du stock, « garde agrumes, épicé ; perd floral… » en mots | pour aller dans le dur, oui ; mais 3,7 écrans et 652 mots au total |

| Variante | ★ | Pourquoi | Défaut principal |
|---|---|---|---|
| u3 · en rupture | ★★★ | La réponse d'abord, en grammes sur une même échelle, avec α, rôle et ce qu'on garde ou perd : on pense en brasseur | IBU par ligne absent ; légende de la piste pâle et doses des achats hors du premier écran |
| u2 · depuis la recette | ★★ | Le plus juste sur dose et IBU de la recette face au style, avec Appliquer collé en bas | Lignes sans α, rôle ni arôme ; codage point, plage et cercle pointillé à apprendre |
| u4 · libre (plages) | ★★ | Le meilleur traitement de l'inconnu et du face-à-face (α, β, arômes 16D, radar D3) : c'est le « dans le dur » | Pas une réponse de premier plan : stock non prioritaire, doses tardives, écran long ; plage de score hors du moteur |
| u1 · depuis la fiche | ★ | Honnête et complet pour une fiche | Grille de huit cases sous des libellés obliques et trois barres muettes par ligne : à décoder ; stock en second |

**Si le brasseur hésite (indicatif) :** le premier plan de u3 (réponse et barres en grammes avec
α et rôle) dans la feuille de u2 (IBU de la recette sur la bande du style, Appliquer), et u4 à un
toucher pour comparer.

Remarque de juré, sur le moteur et non l'écran : le choix proposé par défaut, Nelson Sauvin 62 g
pour amériser une stout à 60′, peut faire tiquer un brasseur. Galaxy fait le même IBU avec 35 g,
pour un score presque égal (85 contre 86). À vérifier avant de dire « confiance ».
