# fb, passe 2 : le calendrier en un geste (prototype cliquable, 16.11)

Prototype : `fl/fb/proto.html`, autonome. Source `proto.tpl.html`, bâtie par `node fl/fb/build.mjs`, qui lit le moteur d'argent de p2 et les données de p8/c2h8.
La passe 1 est gardée telle quelle dans `fl/fb/v1/` (proto, GESTES, captures), pour comparer côte à côte.
Rejeu des gestes : `node fl/fb/capt.mjs [etat,…]` (vrais gestes tactiles, puppeteer touchscreen ; `PAYSAGE=1`, `CLAIR=1`). Captures dans `fl/fb/cap/`.

## Ce qui change pour le mesureur (passe 1 → passe 2)
- **Poser** : chaque type a sa **rangée de pose** `[data-voie="<type>"] [data-pose]`, avec un « + » par semaine. Aucune étiquette ne la couvre jamais.
  - Un toucher pose une semaine (4 pour un brassin).
  - Un appui long suivi d'un glisser pose une plage.
  - La bulle s'ouvre **sans clavier**, avec des puces `[data-bulle-puce]` : un toucher sur une puce pose la chose et ferme la bulle.
  - La bulle ne prend plus le focus : taper au clavier juste après le geste n'écrit plus le nom.
- **Montant** : glisser à l'horizontale sur `[data-val="montant"]` le règle par pas, sans clavier. Le pas est lu sur la valeur : `data-pas` (10 CHF, ou 50 au-delà de 3 000), `data-px` (6 px par pas).
  Un toucher simple ouvre toujours le champ (`[data-edit]`).
- **Jours** : glisser sur `[data-val="jours"]` change le nombre de jours, à 24 px par jour. Un toucher ouvre la grille des jours précis `[data-jours-pop]`, dont chaque case `[data-jour="<sem>:<0-6>"]` se coche d'un toucher.
- **Filtre** : quand tout est montré, un toucher sur `[data-filtre="x"]` ne montre **que** x. Les touchers suivants ajoutent ou retirent un type.
  Le bandeau `[data-filtre-bandeau]` (« Montré : Achats + Activités ») remplace la ligne des hypothèses, à la même hauteur. Il porte le bouton `[data-tout]`.
- **Annuler** : `[data-annuler]` est dans une pastille de 40 px à gauche du + (`#toast`), visible 4 s. Si elle couvre la chose touchée, elle monte sous la rangée collée.

## Sélecteurs stables
| Élément | Sélecteur |
|---|---|
| Racine | `[data-cal]` |
| Grand chiffre | `[data-libre-big]`, `data-valeur` (ex. `259`) ; trois lignes fixes, hauteur constante (`#head` 64-65 px dans tous les états) |
| Libre en fin de semaine n | `[data-libre-sem="n"]` (valeur, puis dessous le mouvement de caisse, ou l'ancien libre barré pendant un geste) |
| Charge de la semaine n | `[data-charge-sem="n"]` (`4/2 j`, rouge au-delà de la présence) |
| Colonne de la semaine n | `[data-col="n"]` |
| Rangée de pose | `[data-voie="brassage | evenement | vente | achat | renovation | activite | charge"] [data-pose]` |
| Une chose | `[data-chose="<id>"]`, `data-type` ; `data-fixe` pour le loyer, qui n'est pas déplaçable |
| Ses bords | `[data-chose="<id>"] [data-bord="debut" / "fin"]` (cible 36 × 44) |
| Ses valeurs | `[data-chose="<id>"] [data-val="montant" / "jours"]`, avec `data-pas` et `data-px` |
| Lecture pendant un glisser de valeur | `[data-scrub]` (« +1 400 ← moins · plus → ») |
| Grille des jours | `[data-jours-pop] [data-jour="48:2"]` (semaine ISO, puis jour 0 = lundi) ; `[data-jours-n]` |
| Bulle | `[data-bulle]` ; `[data-bulle-puce="i"][data-nom="…"]` ; `[data-bulle-nom]` ; `[data-bulle-montant]` ; `[data-bulle-jours="1" / "-1"]` ; `[data-poser]` ; `[data-bulle-fermer]` ; `[data-bulle-retirer]` |
| Corbeille | `[data-corbeille]` |
| Annuler | `#toast [data-annuler]` |
| Filtres | `.chips [data-filtre="<voie>"]` (`data-on` 1 ou 0) ; `[data-filtre="tout"]` en tête dès qu'un type est caché ; `[data-filtre-bandeau]` ; `[data-tout]` |
| Période, pinceau | `[data-periode="6 | 13 | 26 | 52"]`, `[data-pinceau="corps | debut | fin"]` |
| + volant | `[data-fab]` ; `[data-dial-action="activite | achat | evenement | brassage | etsi | aujourdhui"]` ; `[data-dial-commun]` |
| Onglet | `.bot [data-onglet="calendrier"]` (3e) |

## Les huit tâches (rejeu du 16.11, `node fl/fb/capt.mjs`)
| Tâche | Geste exact | Gestes | Preuve lue |
|---|---|---|---|
| **T1** Voir ce que je peux me permettre cette semaine | Aucun. Pour une autre semaine : toucher `[data-libre-sem="50"]` | 0 (1) | repos : `259` « à te permettre / cette semaine / au plus serré S24 » ; t1 : « dès S50 · 7 déc. / libre fin S50 : 5 172 » |
| **T2** Achat avec budget sur S48 → S51 | Appui long (≥ 380 ms) dans `[data-voie="achat"] [data-pose]` sur `[data-col="48"]`, glisser jusqu'à `[data-col="51"]`, lâcher. Puis toucher `[data-bulle-puce][data-nom="Commande groupée de malt"]` | **2** | t2pose : 259 → −281, bandeau « Malt groupé posé · S48 → S51 · −540 · Annuler » ; `#head` toujours 65 px |
| **T3** Activité sans budget, avec ses jours | Toucher `[data-voie="activite"] [data-pose]` sur `[data-col="47"]`, puis toucher `[data-bulle-puce][data-nom="Nettoyage en profondeur des cuves"]` (pose avec ses jours de l'historique, 1 j) | **2** | t3pose : « Nettoyer les cuves posé · S47 · 1 j » ; grand chiffre inchangé (259). Autres jours : `[data-bulle-jours="1"]` avant la puce (+1), ou après : toucher sa valeur `j`, puis une case `[data-jour]` (+2) |
| **T4** Changer la durée | Tirer `[data-chose="a-04"] [data-bord="debut"]` de 3 colonnes vers la gauche | 1 | t4 : « Malt groupé : 3 → 6 sem. (S49 → S1) » |
| **T5** Changer le budget (Marché de Noël 1 180 → 1 400) | Glisser de +132 px vers la droite sur `[data-chose="e-01"] [data-val="montant"]` (22 pas de 10) | **1** | t5 : lecture « +1 400 » sous le doigt ; après : 259 → 479, « Marché de Noël : +1 180 → +1 400 » |
| **T5 bis** Changer les jours actifs | Toucher `[data-chose="t-01"] [data-val="jours"]`, puis `[data-jour="48:2"]`. Ou glisser sur la valeur (±1 j / 24 px) | 2 (1) | t5j : grille S48 → S52, « jours actifs · 4 j » ; barre et `4/2 j` redessinées en direct |
| **T6** Déplacer | Glisser `[data-chose="b-01"]` de 2 colonnes à l'horizontale (hors valeur et bords) | 1 | t6 : « Blonde déplacé : S47 → S49 » |
| **T7** Supprimer | Appui long sur `[data-chose="a-04"]`, glisser sur `[data-corbeille]`, lâcher. `#toast [data-annuler]` la remet | 1 (+1) | t7annuler : « Malt groupé retiré · Annuler », 259 → 799 |
| **T8** Filtrer par type | Toucher `[data-filtre="achat"]` : seulement les achats. Ajouter un type : toucher `[data-filtre="activite"]`. Tout : `[data-tout]` | **1** (2 pour deux types) | t8 : `achat:1`, le reste à 0, bandeau « Montré : Achats » ; t8b : « Montré : Achats + Activités » |

Gestes sûrs : le clic synthétique qui suit un geste est avalé, et un `pointercancel` remet la chose en place. Un toucher hors d'une bulle neuve vide (ni nom ni montant) l'annule sans rien poser.

## Contraintes
- + volant de p8/b1s-b : « Partout » (6 actions communes, dont « Encaisser »), « Sur Calendrier », puis « Poser en S47 ». En paysage, sur deux colonnes, tout tient sans défiler.
  Au repos, il se replie en rond et remonte si son emplacement couvre une chose. Il se replie aussi pendant le défilement.
- Onglet Calendrier en 3e. Moteur d'argent de p2 avec `caisse 4 180 · +120 / sem. · présence 2 j` et la pastille `exemple`.
- Aucun `type="number"` (0, mesuré). `controle-panel` sur repos, t2 et t7 : PANEL OK.
