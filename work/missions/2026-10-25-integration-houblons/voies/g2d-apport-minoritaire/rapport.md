# g2d : un apport minoritaire ne doit pas peser comme un apport établi

Mesure de trois options de `proposeVoies` (option `apportMinoritaire`, défaut `'aucun'`, **inchangé à l'octet**). Aucune n'est activée.
Données : `mesure.json` (sha256 `abe63fc87e0b29fe66557fa4e86d133ec688c7d1e5d99ea142b7cfa0e0dc82fe`, deux lancements identiques), `couts-*.json`.
Lancement : `npx vite-node scripts/eval-hop/apport-minoritaire.ts -- --sortie=<dossier>` (2 min). Catalogue complet (318 variétés, sans stock), listes complètes
(limites 2 000), un seul moment par liste, rang partagé parmi les ajouts.

## Les trois options

| Option | Ce qu'elle fait | Ce qui change à l'écran |
|---|---|---|
| **c** rang seul | `overflowRang` = débordement de style des seules familles **marquées** (moitié des fiches au moins, D90) chez un houblon changé ; `compareRankKeys` lit `overflowRang`. La dose gardée par houblon ne le lit pas (sinon les barres bougeraient). | L'ordre des voies seulement. Effets, débordements affichés, doses : identiques. |
| **m** effet si marquée | une famille citée par moins de la moitié des fiches n'apporte aucun effet établi (`established: false`, `FamilyEffect.minoritaire: true` : reste visible comme citée). Le pool « à acheter » et le groupe dry hop ne gardent que les houblons dont la famille visée est marquée. | Barres, rangs, doses, composition des listes. |
| **w** effet pondéré | effet d'une famille × (fiches qui la citent / fiches lues). | Barres, rangs, doses, composition des listes. |

Le fait de départ : Nelson Sauvin cite « végétal vert » dans 1 fiche sur 9 (0,11), « épicé » 1/9 ; Citra cite résine 1/7, floral 2/7 ; Mosaic cite végétal vert 1/7, herbacé 0/7 (`mesure.json`, partie E).
Une famille marquée = `marquee` de `hops.ts` (D90), pas le niveau « marqué » de `describeFamilies` (deux fiches, ou premier descripteur).

Correction en cours de route : ma première version de **c** laissait le débordement choisir la dose de chaque houblon ; à 10′ sur la 21C, 65 houblons sur 152 changeaient de dose,
donc de barres, contre la consigne « les barres ne changent pas ». La dose suit maintenant la clé d'avant ; `dosesQuiChangent.c` vaut 0 dans les 24 cas.

## Table 1 : Suggérer, rang des houblons phares (rang partagé ; « absent » = pas dans la liste)

Départage k3 (g2a), recette 21C, « plus d'agrumes », dry hop actif (152 ajouts ; **m** : 139 ; la référence de g2b).

| Houblon | aucun | c | m | w | Crédible par réputation (L14), de moi, à confirmer par le contrôle du pilote |
|---|---|---|---|---|---|
| Citra | 54 | **2** | **1** | 22 | aucun : non ; c, m : oui ; w : à peine |
| Nelson Sauvin | 107 | 31 | 24 | 13 | aucun : non ; c : acceptable (6 fiches sur 9 citent agrumes) ; m, w : oui |
| Motueka | 99 | 56 | 45 | 32 | aucune option ne le remonte assez : floral marqué (4/7) au-dessus de la bande (débordement de rang 0,95 cran) |
| Mosaic | 134 | **20** | **9** | 53 | c, m : oui ; w : non |
| Galaxy | 2 | **3** | **absent** | 52 | c : oui ; m : non (agrumes citée par 2 fiches sur 5, pas marquée : plus d'effet, plus de voie) ; w : non |
| Hallertau Blanc | 138 | 26 | 18 | 83 | c, m : oui ; w : non |
| Cascade | 146 | 68 | 45 | 78 | déjà 80 g dans la recette : sans enjeu |
| Idaho 7 | absent | absent | absent | absent | **pas ces options** : pool exclu par D90 (herbacé marqué 3/6, indésirable en 21C) |
| Strata | absent | absent | absent | absent | idem (herbacé marqué 3/4) |
| Simcoe | 108 | 112 | 102 | 89 | oui : résine marquée (6/6), indésirable en Hazy |

Sans départage, même cas : Citra 54 → c 30 / m 1 / w 41 ; Nelson Sauvin 106 → 35 / 1 / 14 ; Mosaic 134 → 43 / 1 / 53 ; Galaxy 1 → 1 / absent / 52 ; Hallertau Blanc 136 → 40 / 1 / 83 ; Motueka 97 → 78 / 39 / 46.
Premier groupe d'ex æquo : 23 (aucun, c), **38 (m)**, 1 (w). Sous k3 : 1, 1, 2, 1.

Autres visées (k3, dry hop actif, 21C) : tropical : Citra 38 → c 9 / m 5 / w 16 ; Nelson Sauvin 62 → 22 / 18 / 5 ; Mosaic 77 → 19 / 10 / 22 ; Galaxy 6 → 10 / 10 / 19 ; Hallertau Blanc 82 → 25 / 21 / 62.
Floral : Citra 23 → 5 / **absent** / 3 ; Mosaic 73 → 3 / **absent** / 5 ; Hallertau Blanc 80 → 9 / **absent** / 37 ; Motueka 53 → 33 / 20 / 16 ; Cascade 83 → 24 / 9 / 32 (m retire Citra, Mosaic et Hallertau Blanc de « plus de floral » : floral n'est marquée chez aucun).

À 10′ (21C, agrumes, k3) : **c ne change presque rien** (le débordement est nul à 10 g : Citra 25 → 25, Nelson Sauvin 130 → 148, Mosaic 113 → 117) ; m : Citra 2, Nelson Sauvin 24, Mosaic 14, Hallertau Blanc 18, Galaxy absent ; w : Citra 2, Motueka 15, Nelson Sauvin 91, Galaxy 124.
Stout 16D, agrumes, dry hop actif, k3 : Citra 215 → c 53 / m 32 / w 145 ; Cascade 232 → 22 / 2 / 82 ; Nelson Sauvin 200 → 97 / 75 / 32 ; Motueka 18 → **58** / 38 / 77 ; Galaxy 149 → 49 / absent / 138.
Le tableau complet (10 houblons × 2 recettes × 3 visées × 2 moments × 2 départages × 4 options) est dans `mesure.json`, partie A.

## Table 2 : les barres de q2b (ce que le brasseur voit changer)

Une barre = une famille d'une voie des listes de l'app (`proposer` : 6 à 8 voies ; leviers : dry hop actif et levure). État affiché : « non établi », « ≈ » ou un entier de crans (comme `afterCrans`).
« Barres changées » : sur les voies communes aux deux listes, les barres dont l'état affiché change ; « écart » : somme des |Δ crans| ; « voies remplacées » : voies de la liste d'avant absentes de la liste d'après.

| Cas | Option | Voies remplacées | Barres changées (voies communes) | Écart en crans (max) | Barres avec valeur, liste entière |
|---|---|---|---|---|---|
| q2b : stout 16D, demande des trois cartes (6 voies) | c | 0 | 0 | 0 | 44 → 44 |
| | m | 4 sur 6 | 3 (Celeia : épicé, pomme-poire, terreux : 1,59 / 0,87 → non établi) | 4,05 (1,59) | 44 → **15** |
| | w | 2 sur 6 | 6 (Celeia : épicé 1,59 → 0,4 ; végétal vert 0,92 → 0,46 …) | 5,04 (1,19) | 44 → 44 |
| m6 : 21C, « plus d'agrumes » (4 voies) | c | 0 | 0 | 0 | 18 → 18 |
| | m | 3 sur 4 (Galaxy 10′ sort) | 1 (Belma : fruits à noyau 1,05 → non établi) | 1,05 | 18 → 11 |
| | w | 4 sur 4 | (aucune voie commune) | — | 18 → 23 |
| m6 : 21C, demande de q2b (8 voies) | c | 0 | 0 | 0 | 60 → 60 |
| | m | 6 sur 8 | 0 (2 voies communes) | 0 | 60 → **13** |
| | w | 5 sur 8 | **14** (Retirer Cascade dry hop : végétal vert −7,9 → −0,88 ; herbacé −7,98 → −2,66 …) | **34,5 (7,0)** | 60 → 64 |

Les listes « leviers » (8 et 10 voies) donnent les mêmes ordres de grandeur (`mesure.json`, partie B). Lecture : **c ne change aucune barre ni aucune voie** sur ces écrans (listes de 10′ à 10 g ou 20 g :
le débordement y est nul ou presque) ; m vide la moitié des barres (celles que seule une fiche sur plusieurs porte) et remplace 3 à 6 voies ; w garde presque toutes les barres mais les rétrécit
(jusqu'à 7 crans sur « Retirer Cascade ») et remplace 2 à 5 voies.

## Table 3 : Substituer v2 et Ma bière

| Écran | Lit-il `cites` ou l'effet établi ? | Impact |
|---|---|---|
| **Substituer v2** (`substitution.ts`) | **Non.** Il lit `describeFamilies` et `marquee` (D90) ; ni `cites`, ni `additionEffect`, ni `proposeVoies` (test : `apportMinoritaire.test.ts`, dernier bloc). | **Nul** sous c, m, w. Remplaçants de Galaxy (dry hop actif, 21C) : Harlequin, Citra, Mosaic, Nectaron, Rakau, Zamba Blend ; de Nelson Sauvin : Hallertau Blanc, Cashmere, Sládek, Styrian Dragon, Mandarina Bavaria, Solero. Inchangés. |
| **Ma bière** (`Carte.tsx` effetTag, `legende-bande.tsx` effetSiAjoute) | **Oui**, par `additionEffect` (même `effectOf`). Son profil (recipeProfile, bande) ne lit pas `cites`. | Étiquette « famille +n crans » d'un ajout, 318 variétés : 21C à 10′, 10 g : **m 78**, **w 162** changent ; 21C dry hop 40 g : m 31, w 35 ; 16D à 10′ : m 66, w 126 ; 16D dry hop : m 66, w 133. c : aucune. |

Exemples (21C, 10′, 10 g) : Citra « floral +2 » → « ≈ inchangé » (m, w) ; Nelson Sauvin « végétal vert +2 » → « ≈ inchangé » ; Mosaic « végétal vert +2 » → « ≈ inchangé » ; Motueka « herbacé aromatique +2 » → « floral +2 » (m), « floral +1 » (w).
Stout 16D, dry hop 40 g : Citra « floral +2 » → « agrumes +4 » (m) ; Galaxy « agrumes +4 » → « fruits tropicaux +4 » (m), « agrumes +2 » (w).
L'étiquette d'aujourd'hui dit déjà « floral +2 » pour Citra et « végétal vert +2 » pour Nelson Sauvin : c'est le défaut le plus visible de Ma bière, et seules m et w le corrigent.

**Rien n'est branché** : `Carte.tsx`, `legende-bande.tsx`, `suggerer/voies.ts` (effetsAuMoment), `cases.ts`, l'adaptateur et le worker appellent `additionEffect` / `proposeVoies` sans l'option. Ces fichiers sont modifiés par d'autres voies en ce moment : je n'y touche pas.

## Coût (ms par appel ; un processus par option, premier appel à froid, médiane de 7 puis 3 appels à chaud)

| Option | Liste de l'app (21C, agrumes, limites 10 et 4) froid / chaud | Liste complète (152 houblons, dry hop actif) froid / chaud | `additionEffect` × 318 variétés |
|---|---|---|---|
| aucun | 110 / 29 | 1 274 / 963 | 98 ms |
| c | 111 / 29 | 1 205 / 1 082 | 99 ms |
| m | 112 / 27 | 1 269 / 946 | 96 ms |
| w | 109 / 27 | 1 372 / 1 072 | 97 ms |

Écarts dans le bruit de mesure (±10 %) : aucune option n'a de coût. La part des fiches passe par `describeFamilies`, déjà en cache par variété.

## Recommandation et limites

- **c pour le dry hop**, par `apportMinoritaire: 'c'` avec le vrai dry hop de g2b : sur la référence (21C, agrumes, k3) il remonte Citra 54 → 2, Mosaic 134 → 20, Hallertau Blanc 138 → 26, Nelson Sauvin 107 → 31, garde Galaxy à 3, ne change aucune barre ni aucune dose, et ne coûte rien. Il ne corrige ni Motueka (56), ni Ma bière, ni les listes à 10′.
- **Ne pas activer m ni w** en l'état. m corrige Ma bière et les listes à 10′ mais **retire Galaxy de « plus d'agrumes »** (agrumes dans 2 fiches sur 5) et Citra, Mosaic, Hallertau Blanc de « plus de floral » ; il vide 29 des 44 barres de la liste q2b. w rétrécit les barres (jusqu'à −7 crans) et range Galaxy 52e et Mosaic 53e.
- Mesure suivante, qui n'est **pas faite** : m avec le seuil du niveau « marqué » de `describeFamilies` (D25 : deux fiches ou premier descripteur) au lieu de la moitié. Galaxy (agrumes 2/5), Motueka (floral 4/7) y resteraient, Nelson Sauvin (végétal vert 1/9) et Citra (résine 1/7) en sortiraient. C'est la seule option qui corrigerait les étiquettes de Ma bière sans perdre Galaxy.
- **Idaho 7 et Strata** sont absents des listes 21C quelle que soit l'option : D90 les écarte du pool (herbacé marqué 3/6 et 3/4, indésirable en Hazy). Ce n'est pas dans ma voie, mais ce sont deux houblons de Hazy courants : à confronter au brasseur (L14).
- Mes jugements de crédibilité sont les miens ; le brasseur n'a rien vu. Les rangs sont ceux du catalogue complet, sans stock ; avec le stock réel, `stock` (clé de rang) reclasse les ex æquo.
- Les barres de q2b sont mesurées sur le moteur (effets en crans) avec les listes de l'app, pas sur un rendu de page : la voie ne touche aucune interface.
