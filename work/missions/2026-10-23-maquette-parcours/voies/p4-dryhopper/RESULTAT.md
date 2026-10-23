OK — Dryhopper (a1) et l'étape Levure jouables, calculés en direct ; 17 critères verts

## Fichiers écrits (tous dans « Possède »)
- `prototypes/houblons-v4/parcours/src/ecrans/dryhopper/` :
  - `index.tsx` : l'écran ;
  - `frise.ts` : les 28 crans calculés en direct, l'interpolation « ≈ », ★ parmi les crans calculés, la loupe ;
  - `mesures.ts` : la vraie valeur du houblon en brouillon ;
  - `fiche-sur-outil.tsx` : la fiche de p1, posée sur l'outil ;
  - `dryhopper.css` (classes `pq-dry-`), `jeu.mjs`, `NOTE.md`.
- `prototypes/houblons-v4/parcours/src/ecrans/levure/` : `index.tsx`, `levure.css` (classes `pq-lev-`), `jeu.mjs`, `NOTE.md`.
- Sortie : `prototypes/houblons-v4/maquettes/parcours-p4/` (pages et `captures/`).
- Ce fichier. Rien ailleurs : `git status` ne montre de ma part que `src/ecrans/dryhopper/**` et `src/ecrans/levure/**`.

## Critères (rejoués depuis la racine, version finale)
| critère | sortie |
|---|---|
| G1 | CONSTRUIT OK (8 pages) → prototypes/houblons-v4/maquettes/parcours-p4/ |
| G2 | TYPES OK |
| G3 | COMMUN OK (couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, légende, parlant, brutes) |
| G4 | dryhopper 80 mots · MOTS OK |
| G5 | UNE-QUESTION OK (1 groupe libre : moment) |
| G6 | ACQUIS OK (4/4 : geste, frise, valeurs, levure), tous au repos |
| G7 | ALPHA OK |
| G8 | LISIBLE OK (16 pictos, 1 mesurée, 13 simulées) |
| G9 | SIMULATION OK : le rail fait bouger le simulé, une vraie valeur à côté (D95 était rouge sur a1) |
| G10 | UNE-QUESTION OK (1 groupe libre : levure) |
| G11 | CUMUL OK : ajout cumulé Nugget + Idaho 7, 4 levures, biotransformation visible, la levure fait bouger le simulé |
| G12 | COMMUN OK (levure : 69 mots) |
| G13 | ETAPE OK (levure), avec 14 gestes Dryhopper et 5 gestes Levure ; rejoué 4 fois de suite, vert les 4 fois |
| G14 | PONTS OK (19 gestes, recalcul médian 1,0 ms) ; gestes qui recalculent : médiane 5,5 ms, max 21,3 ms |
| G15 | Test Files 1 passed (19 tests) |
| G16 | APP INTACTE OK |
| G17 | NOTE OK |

## Ce que jouent les `jeu.mjs`
- **Dryhopper** :
  - au repos, aucune graduation (D47) ; la vraie valeur affichée est celle d'Idaho 7 (38 µg/L, « Idaho » dans sa source) ;
  - l'appui long sur Idaho 7 ouvre la fiche de p1 sans perdre le brouillon, et le retour du téléphone la referme ;
  - la loupe, doigt maintenu : ×3 au moins ;
  - le doigt levé efface les graduations ;
  - glissé à 60′ : l'IBU affichée égale celle du moteur ; puis glissé au dry hop actif : l'IBU chute (161 → 60) et le
    floral monte (~+2 → ~+22) ;
  - 2 j puis 7 j : toutes les valeurs simulées sont identiques (« au-delà de 2 jours, rien ne bouge ») ;
  - « Puis la levure » garde le moment (actif · 7 j) ;
  - Nelson Sauvin : sa propre mesure (linalol 70 µg/L, Feng 2015), jamais 38 µg/L ;
  - Galaxy : « ? pas de mesure », aucune valeur d'un autre houblon.
- **Levure** :
  - départ US-05, biotransformation et ajout cumulé visibles ;
  - Pomona fait bouger le simulé (la recette reste intacte), conversion ~50 % ;
  - Verdant : « ? » (non documenté, jamais 0) ;
  - « Ajouter à ma bière » inscrit Idaho 7 (80 g, dryActive, 3 j) avec Pomona, ferme le brouillon et revient à `#/ma-biere`.

## Demandes du pilote (23.10)
1. **G13 et la loupe ×2,71** : la cause n'était pas la force de la loupe, mais une transition héritée de l'app sur
   `left`. La mesure lisait des positions en retard : le cran 8 était rendu à 83 px alors que son style le plaçait à
   106 px. Corrigé : aucune transition sur le geste (`.pq-dry-geste *`). La loupe est aussi agrandie : m de 4 à 6.
   Mesuré doigt posé sur cinq positions :

   | doigt sur | ×    |
   |-----------|------|
   | 55′       | 9,8  |
   | 20′       | 24,7 |
   | whirlpool | 41,8 |
   | actif 3 j | 30,8 |
   | après 5 j | 14,1 |

   y1b et a1 étaient à ×5,8. La mesure de `jeu.mjs` n'a pas changé.
2. **La vraie valeur** est toujours celle du houblon en brouillon, au moment qu'elle documente (`mesures.ts`). Elle vient
   des mesures en bière du moteur (`verifications()`), puis des comparatifs E01 à E10, ligne de la variété.

   | houblon | valeur affichée |
   |---|---|
   | Idaho 7, en actif | linalol 38 µg/L (McCabe 2023, E03) |
   | Nelson Sauvin | linalol 70 µg/L (Feng 2015, E06) |
   | Galaxy | « ? pas de mesure pour Galaxy » |
   | tout houblon, à chaud | « jamais mesuré à ce moment » |

   `jeu.mjs` joue les trois houblons.
3. **Ma bière sous l'outil** : aucun contournement de ma part. Le socle corrigé ne la monte plus, et G4, G5, G10 et G12
   sont passés au vert sans changer mes écrans.

## Temps d'un recalcul (Chrome, 390 px)
- Ouverture de Dryhopper : la frise entière (28 crans) se calcule en direct, soit 30 `lireBiere` à froid et 40 ms au
  total.
- Un cran neuf (`simulerMoment`, cache manqué, 84 crans à trois doses) prend 0,9 ms en médiane et 2,1 ms au plus.
- Pendant le geste, une image complète prend 22 ms en médiane et 53 ms au plus. Ce temps couvre le doigt déplacé
  (puppeteer), le rendu et deux images, et compte le temps propre de puppeteer.
- `medianeRecalcul('lireBiere')` vaut 0,9 ms. G14 : recalcul médian 1,0 ms.

## Écarts aux nombres de a1 (aux moments de sa grille), et leur cause
- **Identiques**, même moteur :
  - actif : floral ~+22, résineux ~+14, agrumes ~+13, tropicaux ~+16, herbacé ~+6, terreux ~+8, végétal ~+5 ;
  - pastilles : 60′ ~+2, WP ~+14, actif ~+22, après ~+23 ;
  - aperçu Levure : Pomona ~+13 agrumes.
- **IBU** : 161, 97 et 75 à 60′, 10′ et WP (a1 : 162, 97, 75). À 20′, l'IBU est de 121 contre ≈119 dans a1 : elle est
  maintenant calculée à la minute (`ibuPerGramAt`), alors que a1 l'interpolait sur sa grille.
- **Noyau et Baies** : « ? » hachuré, contre ~+8 et ~+21 dans a1. Ma bière avant n'est pas décrite pour ces deux
  familles, donc l'écart est inconnu ; a1 le prenait pour 0. La barre montre le niveau après l'ajout.
- **L'arôme de 55′ à 15′, à 5′ et à 0′** reste « ≈ », interpolé entre deux crans calculés : le moteur ne le simule pas
  à ces moments. Depuis cette passe, ★ ne retient qu'un cran calculé : ★ actif · 2 j pour Idaho 7.

## Captures ouvertes et regardées (`prototypes/houblons-v4/maquettes/parcours-p4/captures/`)
- **Dryhopper** :
  - `dryhopper-390.png` (au repos, actif 3 j) ;
  - `dryhopper-loupe-390.png` et `dryhopper-loupe-actif-390.png` : le geste en cours, doigt posé, avec la loupe, les
    crans écartés et le floral des voisins ;
  - `dryhopper-60-390.png` (161 IBU, trop amer, « contre ★ ») ;
  - `dryhopper-1280.png` ;
  - `dryhopper-fiche-390.png` (fiche de p1 sur l'outil) ;
  - `dryhopper-nelson-390.png` (linalol 70 µg/L, Feng 2015) ;
  - `dryhopper-galaxy-390.png` (« ? pas de mesure ») ;
  - `jouer-parcours --captures` : les 14 gestes de Dryhopper, dans le dossier temporaire de la session.
- **Levure** : `levure-390.png` (US-05), `levure-pomona-390.png`, `levure-pomona-1280.png`, et `levure-cave-390.png`
  (thème cave).
- **Comparaison avec a1** : `fils23-dryhopper/serie-a/passe3/captures/a1-390.png` et `a1-toucher-390.png`, posées à
  côté. La disposition est la même, le geste est plus large, les nombres concordent (voir plus haut).

## Prédiction
« Là c'est vivant : je glisse, la loupe s'ouvre et je vois le floral monter en dry hop ; mais Nelson qui ne fait que
~+5, ça reste ordinaire » (le défaut des descripteurs, L14 et D100, est hors de cette voie).

## Besoins dans le socle (demandés au pilote)
- Un crochet commun `useFiche()` : une feuille posée sur la page ouverte, sans route. `fiche-sur-outil.tsx` relit
  aujourd'hui la clé d'historique de `navigation.tsx` (`affinee-parcours`).
- Que l'adaptateur expose la biotransformation par levure (`biotransfoLevure`, lue ici dans le moteur) et les vraies
  valeurs par houblon : aujourd'hui, `mesures.ts` lit `verifications()` et `comparatifs-dryhop.json`.
- PageShell met une bordure de focus jaune autour du `main` à l'ouverture : elle se voit sur toutes les captures
  d'outil. C'est le socle ou l'app, pas mes écrans.

DÉCISION À PRENDRE : aucune dans ce contrat. Le choix du brasseur sur Dryhopper (a1, b4, d8, e5, g1) et sur la forme
de la levure (étape ou outil) reste ouvert, comme l'indique MISSION.md.

CONNAISSANCE : la frise de Dryhopper en direct coûte 40 ms à l'ouverture (30 `lireBiere` à froid) et 0,9 ms par cran
neuf. Pour Idaho 7, Verdant et Diamond ne changent rien : sans taux de géraniol publié et sans précurseurs de thiols, le
centre vaut 0 par convention, donc l'effet est inconnu. Seule Pomona bouge (~+13 agrumes, ~+5 floral, confiance faible).

LEÇON PROPOSÉE : un contrôle qui lit des positions rendues pendant un geste exige qu'aucune transition CSS ne s'y
applique (`transition: none` sur l'élément mesuré). Le 23.10, une transition héritée de l'app a fait mesurer la loupe à
×2,7 au lieu de ×25, de façon intermittente.
