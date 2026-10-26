OK — le trou du 0 (G) et l'écart des points confondus (D186) sur Substituer et Comparer, portés dans RadarBase

## Fichiers écrits
- `src/ui/hopIndex/commun/RadarBase.tsx` : deux options, `trouDuZero` (D114) et `ecarterConfondus` (D186).
- `src/ui/hopIndex/commun/radar-base.css` : `.rb-trou`.
- `src/ui/hopIndex/substituer/Radar.tsx` et `src/ui/hopIndex/comparer/Radar.tsx` : une ligne chacune (les deux options sur la même ligne). Ma bière, la fiche et Suggérer ne les passent pas.
- `tests/unit/hopIndexV4/radarTrouDuZero.test.tsx` (6 tests).
- `tests/integration/controle-trou-du-0.mjs` (« TROU OK »), `tests/integration/controle-points-confondus.mjs` (« CONFONDUS OK »).
- Dans ce dossier : `fidelite.mjs`, `img/cote-a-cote-G-app.png` (G à gauche, l'app à droite), `img/differences-G-app.png`, `img/app-apres-port.png`.

## Ce qui est porté
**G, le trou du 0 (D114)**
- Le disque du petit anneau du zéro est un polygone gris uni `#e6e8eb`, liseré `#9ea3aa` de 1,2, sous la grille et les aires, au-dessus du secteur « sans donnée » (dont il recouvre la pointe, comme dans G). Ni hachures ni mot.
- Un point à 0 devient un rond creux : rayon 4,2, trait de la couleur de la série de 2, sur un fond blanc. Le fond blanc porte aussi le liseré clair de 1,6 de D181 (r2). Le rond lui-même est sans remplissage (`fill="none"`), comme l'anneau de l'original, donc hors de la règle « point plein » de `controle-radar-lisible`.
- L'anneau de l'original (6,2) ne change pas. Légende : celle de G est la légende actuelle, rien n'est ajouté.
- Gardés tels quels : le bloc « sans donnée » (rdg5), les tiretés le long du bord (D180), les points de 9 à 10 px (D181), le contour de l'original au-dessus (D156).

**D186, les points confondus** (arrivé en cours de route)
- Sur un même axe, les points dont les rayons diffèrent de 6 unités au plus (unités du radar, W = 358) se regroupent de proche en proche. Ils s'écartent le long de la tangente de l'axe, de 7,3 unités (8 px à 390) : l'original au centre, puis les séries dans l'ordre des séries (la légende) à −1, +1, −2, +2 crans. Sans original, ils sont répartis de part et d'autre du centre.
- **Choix : les contours passent par le point exact, pas par le point décalé.**
  - Les traits, aires et tiretés restent sur la valeur ; l'écart ne déplace que les marques. Les tiretés de D180 et les aires ne bougent pas, et un point décalé ne change aucune valeur lue.
  - Un point décalé est à 8 px de son sommet, toujours sur l'axe de son anneau. Les couleurs se lisent à côté de l'anneau gris de l'original, qui ancre le sommet.
  - Passer par le point décalé aurait déformé les aires de 8 px et obligé à réécrire les chemins de D180.
- Les cercles décalés portent `data-decale` (l'écart en unités du radar), lu par les contrôles.

## Critères, sorties décisives
- `npx vitest run tests/unit/hopIndexV4` : en deux passes complètes, **85 fichiers, 790 tests verts, sauf un**. `sourcesLignes.test.tsx` (« Citra α : la barre manque », barres de Substituer) échoue depuis que `substituer/donnees.ts` et `substituer/index.tsx` ont été modifiés par une autre voie en cours de ma session (diff : 13 et 10 lignes, pas les miennes ; il était vert à ma première passe). Je n'ai pas touché ces deux fichiers. Une erreur « Timeout calling onTaskUpdate » du worker vitest apparaît sous charge, sans test en échec ; mes 4 fichiers de radar passent (20 tests).
- `npm run build` : sortie 0 (tsc, vite, contrôle privé).
- Par `scripts/with_server.mjs`, `VITE_HOP_V4=on`, 390 × 844 :
  - `controle-radar-lisible.mjs` : `LISIBLE OK`.
  - `controle-contour-original.mjs` : `CONTOUR OK`.
  - `controle-trait-ta-biere.mjs` : `TRAIT OK`.
  - `controle-trou-du-0.mjs` : `TROU OK`. Sur une copie de HEAD (les 4 fichiers de RadarBase remis à HEAD, le reste de l'arbre de travail) : `TROU ECHEC 11` (disque absent en Substituer et Comparer ; 8 points à 0 pleins).
  - `controle-points-confondus.mjs` (390 et 1280 px, Substituer ; Comparer Absolu et Au style en 390) : `CONFONDUS OK`, pire part cachée 29 %. Sur la copie de HEAD : `CONFONDUS ECHEC 9` (Solero caché à 100 % sous Calypso en agrumes, tropical et baies ; Lotus caché à 73 à 95 % en Comparer Absolu), ce qu'il a entouré.
- **Fidélité** : `fidelite.mjs` → `FIDELE OK (disque à 0 px ; 7 ronds creux retrouvés dans G à 4 px au plus ; cachés dans G, écartés dans l'app : berries Solero)`. Le disque est à 0 px de G ; 3885 pixels différents sur 577 456, dus aux points écartés. Planche ouverte (`img/cote-a-cote-G-app.png`) : même disque, mêmes ronds creux. Seule différence : les points confondus écartés (D186). Les captures de contrôle ont aussi été ouvertes : Substituer en 390 et 1280, Comparer Absolu et Au style.
- Essais : un par critère, après les corrections suivantes de ma part : le contrôle trou excluait mal l'anneau de l'original (corrigé) ; l'écart a été porté de 6,8 à 7,3 pour mieux dégager le bleu.

## Demande exécutant (les deux contrôles de la maquette, hors de mon périmètre d'exécution)
DEMANDE EXECUTANT :
- Commandes, à la racine, dans l'ordre :
  1. `node work/refonte-frontend/v4/tournoi/outils/controle-radar-base.mjs prototypes/houblons-v4/maquettes/parcours`
  2. `node work/refonte-frontend/v4/tournoi/outils/controle-etats.mjs prototypes/houblons-v4/maquettes/parcours`
- Fichiers à produire : aucun (sorties seulement). Ne rien écrire dans `work/refonte-frontend/v4/choix/etats/` (la voie e6 y travaille).
- Sorties attendues : une ligne « RADAR BASE OK » ou équivalente (lire la dernière ligne de la sortie) pour 1 ; `ETATS OK` pour 2.
- Captures à ouvrir : celles que ces contrôles écrivent, pour les écrans à radar (Comparer, Substituer).
- Réserve : la maquette construite est un artefact distinct de l'app ; ces deux contrôles ne lisent pas `RadarBase.tsx` de l'app. S'ils échouent, comparer d'abord le résultat avec HEAD avant de me les renvoyer.

## Doutes et limites
- Comparer n'a aucun point à 0 sur les trois houblons des fixtures (Lotus, Solero, Calypso), en Absolu comme au style : le contrôle Chrome y prouve le disque et l'écart, pas les ronds creux. Les ronds creux de Comparer ne sont prouvés que par le test unitaire (l'option est la même). Un 0 y est un vrai 0 (dCran nul ou centre nul), pas un « non décrit » : en Comparer, un point à 0 devient lui aussi un rond creux sur le disque, selon sa demande (« tout les radar de comparaison »).
- Blanc sur blanc : dans la capture G le rond creux de Solero est caché sous celui de Calypso (baies) ; D186 l'écarte (visible dans la planche).
- Le bleu au tropical (agrumes : l'original à « marqué », Solero et Calypso à « cité ») reste en partie sous l'anneau gris de l'original, qui passe au-dessus (D156) : 29 % cachés au pire, sous le seuil de 50 %. L'écart ne dépasse pas 8 px, comme demandé ; un écart plus grand dégagerait mieux, à décider avec lui si besoin.
- Au premier lancement de `controle-points-confondus.mjs` l'arbre tournait sous charge : un échec de lancement isolé (code 1, cause non lue) ; le rejeu est vert (2 fois) et `controle-radar-lisible` a refusé un port occupé par une autre voie (rejoué sur un autre port : vert).
- Les captures sont prises sur l'arbre de travail du jour, qui contient des changements d'autres voies non commités dans `src/` (`calcul.ts`, `EtapeHoublons.tsx`, `substituer/donnees.ts`, `substituer/index.tsx`).
- Une copie de HEAD, hors dépôt, a servi pour l'état avant (dossier du bloc-notes de la session) ; rien n'a été remplacé dans le dépôt.

DÉCISION À PRENDRE : en Comparer, un 0 est une vraie valeur nulle et non un « non décrit ». Option A (livrée) : rond creux sur le disque, comme il l'a demandé pour tous les radars de comparaison. Option B : creux seulement en Substituer, plein en Comparer. Recommandation : A, qui suit ses mots ; à lui montrer à la première occasion si un 0 de Comparer le surprend.

CONNAISSANCE : `elementsFromPoint` sur un SVG rend les cercles `fill="none"` par leur seul trait ; mesurer la part cachée d'un point (plein : son disque ; creux : son anneau) par échantillons donne un contrôle de superposition fiable (`controle-points-confondus.mjs`).
LEÇON PROPOSÉE : aucune
