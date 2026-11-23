OK — Ma bière rend ses 15 états de la base v4.10 : radar m4, grille, puces, absolu

## Fichiers écrits (Possède seulement)
- `prototypes/houblons-v4/parcours/src/ecrans/ma-biere/RadarBiere.tsx` : réécrit, le radar de sa base (radar.js, `RADAR.biere`).
- `prototypes/houblons-v4/parcours/src/ecrans/biere/index.tsx` : l'onglet, avec tous ses états et leurs `data-etat`.
- `prototypes/houblons-v4/parcours/src/ecrans/biere/Degustation.tsx` (nouveau) : la grille m4 « pas senti · faible · moyen · marqué ».
- `prototypes/houblons-v4/parcours/src/ecrans/biere/biere.css` (nouveau) : classes `pq-biere-` (L26), mesures de sa base.
- `prototypes/houblons-v4/parcours/src/ecrans/biere/jeu.mjs` : 4 gestes du radar ajoutés ; le pont-floral est maintenant la ligne des voies.
- `prototypes/houblons-v4/parcours/src/ecrans/biere/NOTE.md` : section « Reprise D124 ».
- Construction et captures : `prototypes/houblons-v4/maquettes/parcours-biere/` (captures dans `captures-r2/`).
- Aucun fichier hors Possède. `git status` : mes 6 fichiers ; les autres modifications de `parcours/src/` viennent des autres voies.

## Critères (rejoués depuis la racine, construction finale)
- G1 : `CONSTRUIT OK (9 pages) → prototypes/houblons-v4/maquettes/parcours-biere/`
- G2 : `ETATS OK (15/15) ; 2 voulu(s) non rejoué(s)` (au départ : `ETATS ECHEC (9/15)` avec --repli, 15/15 sans data-etat)
- G3 : `CHOIX OK (1 écran(s) conforme(s) à son choix ; 0 ouvert(s))` (REPRISE 11 repris + 1 en pont ; controle-visee VISEE OK 6/6)
- G4 : `COMMUN OK` (couleurs, au-style, survol, blocs, contraste, standard, trait, legende, parlant, brutes ; mots et fiche sautés par le CHECK)
- G5 : `TEINTE OK 6/6`
- G6 : `TYPES OK`
- G7 : ce fichier (NOTE OK attendu).
- En plus : `jouer-parcours.mjs --etape=biere` → `ETAPE OK (biere)`.

## États rendus (data-etat, capture « après » à côté de la capture choisie, ouvertes en images)
Captures « après » : `prototypes/houblons-v4/maquettes/parcours-biere/captures-r2/<id>-r2.png`. Captures choisie et 5345f6ad :
`work/refonte-frontend/v4/choix/etats/captures/<id>-choisie.png` et `<id>-5345f6ad.png`.
- etat-biere-radar — rendu (était different) : grand radar 358 px de sa base, ma dégustation pleine en bleu, sommet orangé de Résineux, pas goûté « ? » et hachuré, attendues en gras ; dessous la grille m4 ; décompte, légende, échelle et levure repliés comme la base. data-etat sur « Radar ». Capture `etat-biere-radar-r2.png`, grille entière `etat-biere-radar-grille-r2.png`.
- etat-biere-radar-absolu — rendu (était different) : même radar et grille après « Absolu » (la base ne change pas le radar). data-etat sur « Radar » quand l'absolu est pris. `etat-biere-radar-absolu-r2.png`.
- etat-biere-radar-sommet — rendu (était absent) : bulle « **Résineux** : marqué, au-dessus du style » au toucher du sommet (cible de 22 px, comme radar.js) ; une famille pas goûtée dit « pas goûté, inconnu (ce n'est pas zéro), posé au centre ». `etat-biere-radar-sommet-r2.png` ; par l'alerte : `etat-biere-radar-sommet-par-alerte-r2.png`.
- etat-biere-absolu — rendu (était different) : en-tête « faible · moyen · marqué » à la place de « zone du style · au-dessus », au milieu de chaque classe sur la piste. data-etat sur « Absolu ». `etat-biere-absolu-r2.png`.
- etat-biere-objectif-floral — rendu (était different) : « + floral » reste sur Ma bière, pose la visée (losange relié au point, faible), la puce devient noire, et « Plus floral : 7 voies, 2 faibles › » s'écrit dessous (le › ouvre Suggérer). data-etat sur la puce. `etat-biere-objectif-floral-r2.png`.
- etat-biere-objectif-autre — rendu (était different) : « + … » (aria-label « Autres directions : glisser la visée sur une famille ») ouvre la ligne de la famille suivante à viser, sans quitter l'onglet. `etat-biere-objectif-autre-r2.png`.
- etat-biere-repos — gardé (different par les seuls écarts voulus et le décompte, voir DÉCISION) : data-etat sur la liste des familles. `etat-biere-repos-r2.png`.
- etat-biere-famille-ouverte, -visee-plus, -visee-moins, -visee-retirer, -bannir, -visee-refermee — présents, sans régression (data-etat sur les commandes de Tropicaux ; la ligne de la famille porte -famille-ouverte, puis -visee-refermee quand elle est ouverte avec une visée). Captures `etat-biere-<id>-r2.png`.
- etat-biere-retour — présent (croix D109), data-etat posé après le rendu sur la croix visible. `etat-biere-retour-r2.png`.
- etat-biere-pied — présent : « Prévu avec SafAle US-05, caractérisée ». `etat-biere-pied-r2.png`.
- Voulus non rejoués : etat-biere-onglet-suggestions (q2b), etat-biere-onglet-comparer (D107).

## Décisions
- DÉCISION : Végétal. Le moteur le calcule : green 0,37 point (bas 0, haut 64,7), simulé par un composé relié chiffré, alors que les fiches de Nugget ne le décrivent pas (« non décrit », 0 sur 4). Selon le VOIE (« Si le moteur calcule Végétal, garde le moteur et écris-le »), j'ai gardé le moteur : « 7 au style · 4 non situées » contre « 6 · 5 » dans sa base. REPRISE § 8 dit l'inverse (« une famille n'est placée que si une source du houblon la décrit ») ; voir DÉCISION À PRENDRE.
- DÉCISION : le radar trace ma DÉGUSTATION (notes de la grille), pas le profil simulé, comme sa base (`RADAR.biere` sur `ETAT.notes`) : au départ seul Résineux est noté (marqué, 18.10), les 11 autres sont pas goûtés. Les notes vivent dans l'onglet (useState, à partir de `donnees().degustation`), car l'état commun n'en a pas ; elles ne changent ni les barres ni le moteur, comme dans la base.
- DÉCISION : « + … » ne faisait rien dans sa base (aucun onclick ; capture inchangée). Le relevé dit « ouvre la ligne de la famille suivante à viser » : je l'ai rendu ainsi, et un second toucher passe à la suivante (dans l'ordre du style, une famille située, sans visée, hors des puces : Herbacé, puis Terreux…). Une aide d'une ligne (« Autres directions : touche une famille, puis − ou + ») s'affiche tant qu'aucune visée n'est posée.
- DÉCISION : le relevé de etat-biere-radar-sommet se joue au repos (sans `avant`). Pour qu'il ait un déclencheur au repos, l'alerte « Résineux trop marqué » ouvre le radar avec la bulle de Résineux ; au radar, c'est le sommet qui porte l'état. C'est un ajout (D121 : « l'alerte […] ne font rien »), sans rien retirer de sa base.
- DÉCISION : une puce dont la visée est posée la retire au toucher, comme `chipsDirection` de sa base. Suggérer s'ouvre par la ligne « Plus floral : n voies, k faibles › » (calculée par `voiesSummary` sur la même direction que Suggérer, `objectifsDe`). C'est elle qui porte `data-role="pont-floral"` ; les puces gardent `data-outil="Suggérer"` (contrôle de reprise : « en pont »).
- DÉCISION : les pastilles de la grille ont 32 px de haut et 58 px de large (26 px dans la base), pour l'usage au doigt ; la puce « + … » et les objectifs restent sous le pli en radar, comme dans la base.
- Retraits D35 : aucun. DEFAUTS-COURT n'a aucun défaut postérieur au choix qui vise le radar m4, la grille, les puces ou l'en-tête absolu.
- Pictos D74 : gardés devant les noms de la grille ; pas sur les libellés du radar (sa capture n'en a pas, et ils réduiraient le rayon).

## BESOIN (hors de mon Possède)
- BESOIN pilote (outils) : le chemin « Suggérer ouvert depuis l'onglet » de `controle-retour.mjs` (hors de mes GATES) échoue maintenant : `RETOUR ECHEC (12/12 conformes, 1 manques)`. Il touche pont-floral, pont-objectif-autre ou pont-objectif-resin au repos et attend Suggérer. Comme dans sa base, il faut d'abord toucher la puce « + floral » (`[data-role="pont-objectif-floral"]`), puis la ligne `[data-role="pont-floral"]`. Même adaptation pour `parcours-complet.mjs` (l. 284 : `pontFloral` lit « + floral » sur pont-floral, à lire sur pont-objectif-floral) et `jouer-parcours.mjs` (l. 156, 213 : depuis l'étape, à vérifier selon r1).
- BESOIN pilote (relevé) : `etat-acquis-radars-m4-h4` (acquis.json) se joue au repos sur `biere/etat.html` et demande « Ma dégustation · pas senti · faible · moyen · marqué ». La grille est là, mais à un toucher de « Radar », comme dans sa base. Le relevé devrait passer en `geste: toucher` sur « Radar », ou prendre `avant: etat-biere-radar`. Aujourd'hui : `ETATS ECHEC (1/1)`, déclencheur non posé. Je n'ai rien affiché au repos, pour ne pas trahir sa base. Même remarque, moins forte, pour etat-biere-radar-sommet (un `avant: etat-biere-radar` le jouerait sur le sommet).
- BESOIN r1 : aucun. Observation pour r1 et le pilote : sa base place Agrumes, Tropicaux et Épicé vers 20 % de la zone (0,19 à 0,22 sur 0–3, soit 6 à 7 points), alors que le moteur actuel donne 0,4 à 1,6 point (points au bord gauche). C'est un écart de données du moteur, pas de l'onglet.
- Dépendance : j'importe `objectifsDe` de `ecrans/suggerer/voies.ts`, en lecture seulement, pour que la ligne des voies suive la direction de Suggérer.

## Prédiction
« Là je retrouve ma vue radar et la grille m4, et les puces font enfin quelque chose sur les barres » ; il discutera peut-être le « 7 · 4 » (Végétal) face à son « 6 · 5 ».

DÉCISION À PRENDRE : Végétal, placé par le moteur (0,37 point simulé) ou « non situé » comme sa base et REPRISE § 8 (les fiches de Nugget ne le décrivent pas) ? Le VOIE et REPRISE se contredisent ; j'ai suivi le VOIE. Rendre « non situé » demande une règle dans le moteur ou l'adaptateur (`moteur/index.ts`, `lu()`), qui n'est pas à moi.

CONNAISSANCE : le radar Ma bière de la base v4.10 (choix m4) ne trace pas le profil simulé mais la dégustation notée dans la grille (échelle −1 → 3, pas senti sur l'anneau du zéro, pas goûté au centre) ; `voiesSummary(proposer(...))` donne en direct « Plus floral : 7 voies, 2 faibles » (8 dans la base figée).
LEÇON PROPOSÉE : un état relevé « au repos » sur une page de sa maquette ouverte dans un autre état (biere-radar.html) doit porter son `avant` : sinon la construite ne peut le jouer qu'en inventant un déclencheur au repos (etat-acquis-radars-m4-h4, etat-biere-radar-sommet).
