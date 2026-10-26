OK — page de choix refaite sur D90 (d0b2151c) : 6 variantes et l'IA dans Suggérer q2b, 21C (FIDELE OK, PAGE OK)

## Fichiers écrits (tous dans la voie, rien dans `src/`)
- `capturer.mjs` : l'écran Suggérer de l'app, plus les ajouts `m6s-` (clones des nœuds voisins, attributs `data-` retirés), retirés après chaque capture. Il écrit `img/` (10 captures) et `fidelite.json`.
- `faire-page.mjs` → `page.html` : 7 vignettes, A en référence, visionneuse de m1, m3, m4 et m5.
- Fichiers de travail (repérage, recadrages, captures de la page) : `%TEMP%/m6/` seulement. Pas de GATES.md : critères pris dans VOIE.md.

## L'écran (dev-local, VITE_HOP_V4=on)
- Recette 21C « Hazy du jeudi » : Nugget 20 g à 60′, Cascade 80 g en dry hop actif, 20 L, OG 1,058, IBU 27,9.
- Visée : « plus d'agrumes » d'un cran, celle de g1. Je l'ai posée par la porte de l'app (`poserVisee`) : ma bière est à 20,5 pts, le cran à 33,3 pts (lus par bissection).
- Rendu de l'app : une carte (« Plus agrumes · Atteint »), « = même effet 40 g 10′ » (Belma, Galaxy), « = même effet 40 g whirlpool » (Belma, Galaxy), puis « Changer de levure ».
- **Aucun ajout à 60′, et aucun groupe dry hop** : `leviers.dry` est vide avec le stock de la fixture. Cela confirme g1 à l'écran.
- Lu à côté de sa capture q2b-b-390 : mêmes onglets, bandeau, réglages, cadres « = même effet », ♡ et +, et la barre Comparer.
  - La seule différence vient de la visée : une carte au lieu de trois. C'est la règle de l'app (une colonne par objectif).

## Variantes (captures de l'écran entier, à 390 px de large)
- **A · l'actuel** : `img/a-actuel.png`.
- **M1 · 60′ et dry hop en groupes** : `img/m1-groupes-60-dryhop.png`. Deux groupes clonés de « = même effet », avant la levure :
  - « = même effet 40 g · actif » : les 5 premiers de g1 (African Queen, Belma, Galaxy, Herald, Huell Melon, +42 en agrumes, soit +1 cran). En pied : « + 18 autres au même effet, rangés par ordre alphabétique » (l'ex æquo de 23, dit honnêtement).
  - « = Amérisant +10 IBU · 60′ » : la barre d'IBU une fois. Les 5 de E1 : Polaris 4,5 g, HBC 586 4,7 g, Helios 4,9 g, Brooklyn 5 g, Eureka 5 g (α et usage de E1, arômes et stock des fiches de l'app). Les arômes cités par les fiches sont en pictos pâles, sans trait : à 60′, ils ne bougent pas. Le point gris muet a été retiré (D90).
- **M2 · carte « Plus d'amertume »** :
  - au repos, `img/m2-carte-amertume.png` : la carte sous la sienne, en pleine largeur ; aucun verdict (aucune visée d'IBU n'est posée) ; à la place, « +10 IBU », la piste IBU 28 → 38 et « IBU · style 25–60 ».
  - touchée, `img/m2-carte-touchee.png` : la carte cerclée, et le groupe 60′ ouvert en tête de liste.
- **M1 + M2 (ma préférée)** :
  - au repos, `img/m1m2.png` ;
  - état ouvert, `img/m1m2-polaris-touche.png` : un toucher sur Polaris montre cohumulone 25,5 %, β 5,5 %, « 4,5 g à 60′ → IBU 27,9 → 37,9 (style 25–60) », « à acheter · dose g1 (E1, 20 L) ».
- **M3 · puces « Quand ? »** : `img/m3-puces-quand.png`. « 60′ 5 · 10′ et whirlpool 4 · dry hop 23 », les trois posées, rien de filtré ; les groupes de M1 dessous. Le filtre n'est pas montré : il cacherait des nœuds de l'app.
- **F · la frise du brassin (mon idée)** : `img/f-frise-brassin.png`. Une ligne du brassin, de l'ébullition à la fermentation :
  - ses deux ajouts en points noirs (Nugget 20 g, Cascade 80 g) ;
  - au-dessus, une bulle par moment proposé : IBU +10, 10′ 2, wp 2, actif 23.
  - Il voit où tombe chaque proposition par rapport à ce qu'il a déjà mis.
- **IA sur M1 + M2** :
  - `img/m1m2-ia.png` : la puce « ✦ ordre IA prêt » de Substituer (forme de la voie i2 : pointillée, étoile bleue), posée sur le groupe dry hop, là où sont les 23 ex æquo ;
  - `img/m1m2-ia-phrase.png` : un toucher sur Galaxy ouvre la phrase « IA Ses fiches marquent agrumes, tropicaux, noyau et baies ; au dry hop actif, la levure peut en tirer du fruit. »
  - Cette phrase est un **exemple écrit pour la maquette**, construit à partir des familles marquées dans sa fiche. Aucune IA n'a été appelée ; la page le dit.
- Captures ouvertes et relues (recadrages compris) : M1+M2, Polaris touché, M2 touchée, M3, F, IA et sa phrase.
  - Corrigé au premier passage : une bulle de l'app qui restait affichée (`page.click` laissait la souris dessus ; le toucher passe maintenant par `element.click()`), et la dose remontée sur la ligne du nom.
  - Corrigé aussi « +2,4 pt à 1 g/L » (effet à 40 g). Passe 2 : la phrase sur l'arôme à 60′ est retirée du détail, car la dose citée n'était pas celle de la rangée.
- **Passe 2 (critique)** : « Atteint » retiré de la carte amertume (M2, M1+M2, IA) ; phrase de l'arôme retirée ; mes textes de 12 à 13 px passés à 14 px (pieds, détail, phrase IA, puces, frise, carte) ; point gris muet des rangées 60′ retiré.
  - **Refait sur D90**, dans l'arbre de travail, sans copie, à d0b2151c (D90 commité en b020da5e ; seul `src/ui/hopIndex/dryhopper/` n'était pas commité, hors Suggérer). La copie de HEAD d3412dde de la passe 2 n'existe plus.
- **Ce que D90 change dans les listes** (21C, plus d'agrumes d'un cran) :
  - l'écran de l'app (A) ne change pas : mêmes groupes « = même effet 40 g » à 10′ et au whirlpool (Belma, Galaxy), même levure, 402 nœuds ;
  - dry hop actif, relu dans le moteur de l'app (appel de g1, partie A, pool de 318 sans stock) : **152 ajouts au lieu de 93, 18 rangs distincts au lieu de 4**. Le premier groupe d'ex æquo compte toujours 23 houblons, et les 5 premiers sont les mêmes (African Queen, Belma, Galaxy, Herald, Huell Melon, 40 g, +42 en agrumes) : le pied « + 18 autres au même effet, rangés par ordre alphabétique » reste vrai ;
  - 60′ : E1 ne dépend que de l'α (318 variétés calculables, sans exclusion), D90 n'y touche pas. Polaris 20,5 % 4,5 g, HBC 586 20 % 4,7 g, Helios 18,9 % 4,9 g, Brooklyn 18,5 % 5 g, Eureka 18,5 % 5 g ;
  - doses et α relus sur les captures : 60′ comme E1 ; au dry hop, α des fiches de l'app (African Queen 13,5 %, Belma 10,3 %, Galaxy 13,5 %, Herald 11 %, Huell Melon 7,5 %), 40 g partout.
- `capturer.mjs` lit maintenant le dry hop dans le moteur du commit courant (et garde les valeurs de g1 à côté, dans `fidelite.json`). Il clone le premier groupe de l'app, que celui-ci soit un cadre « = même effet » ou une liste « Ajouter », avec une barre et une dose par rangée.

## Critères (sortie décisive)
- `controle-capture-fidele.mjs …/m6-suggerer-moment/capturer.mjs` → `FIDELE OK (capturer.mjs : rien de caché, mesure gardée)`. Les 10 captures gardent 402 nœuds de l'app, avant comme après l'ajout, et tous les blocs de A.
- `verifier-page.mjs …/page.html --page-lot --captures <tmp>/m6` → `PAGE OK (7 images chargées, lisible à 390 et 1280 px, sans erreur)`.
- « aucune erreur de page » à la capture.
- Hors contrat, pour information : `controle-page-choix.mjs` → `PAGE-CHOIX ECHEC — C3 6 variante(s) (11 au moins)`. VOIE en demande au moins 6 ; m5 en avait aussi 6.
- `controle-choix.mjs` ne s'applique pas ici : il juge un dossier construit (etat.html par route). Rien de l'écran n'est remplacé.

## Ma préférence : M1 + M2
- Le 60′ devient un geste comme le dry hop, dans la grammaire de q2b : un cadre « = même effet », la barre une fois, le détail au toucher. Il n'y a rien à apprendre.
- La carte donne la visée (« Plus d'amertume · +10 IBU · 28 → 38 »). Sans elle, le groupe 60′ arrive sans qu'on ait rien demandé.
- M3 ajoute un réglage de plus au premier plan (cockpit). F raconte bien le brassin, mais c'est une deuxième lecture de la liste.
- Prédiction : « Oui, là je vois le 60′ et le dry hop ; mais 23 ex æquo par ordre alphabétique, ça ne va pas ». La liste du dry hop reste à départager : c'est a1, puis l'IA.

DÉCISION À PRENDRE : le brasseur choisit la variante. La puce IA sur Suggérer reste un nouvel usage facturé à confirmer (g1, D80). L'ordre réel du dry hop dépend de a1 (moteur). Ce que D90 change : rien à l'écran A ; au dry hop, 152 ajouts sur 18 rangs, mais toujours 23 ex æquo en tête.

CONNAISSANCE : sur la 21C du test a2 avec « plus d'agrumes » d'un cran, Suggérer de l'app (fixture dev-local) ne rend que 10′ et whirlpool (Belma, Galaxy à 40 g) et aucun groupe dry hop : `leviers.dry` est vide avec ce stock, alors que g1 (stock des fixtures du moteur) trouvait Galaxy 40 g.

LEÇON PROPOSÉE : dans un script de mini maquette, toucher un ajout par `element.click()` et non par `page.click()`. La souris restée à l'écran déclenche une bulle de l'app, qui survit à la variante suivante et fausse la mesure de fidélité (405 → 402 nœuds) (rôles : concepteur).
