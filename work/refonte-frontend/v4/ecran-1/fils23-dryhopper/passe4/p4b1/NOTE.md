# p4b1 — « Gardé · emporté » (passe 4 sur a1, voie dh4b, 24.10 ; retouches du conseil dh4)

**Chaleur : chaude.** Forme libre sur a1 : la figure d'a1 (barres l5b, amertume, « Face à ta stout », mesuré, pont
Levure, dock avec pastilles, jours, rail et loupe) reste, mais chaque barre dit deux choses : ce que le moment **garde**
(plein, couleur de la famille) et ce que la **chaleur** (flamme, hachure orangée) ou le **CO₂ de fermentation** (bulles,
pointillé bleu-gris) **emporte**, jusqu'à ce qu'aurait donné le dry hop après fermentation de même durée. Régénérer :
`node generer.mjs` ; captures : `node ../p4b-commun/capturer.mjs p4b1` ; loupe / figure : `node ../p4b-commun/mesurer-loupe.mjs p4b1`.

## Retouches du conseil (`conseil-dh4/verdict.md`), avec leur mesure
- **Noyau et Baies** : l'avant de la stout est inconnu (non décrits dans les fiches de Nugget), le gain d'Idaho 7 est connu :
  la valeur s'écrit « ? → ~+21 » (à 20′ : « ? → ≈+11 », puis « ≈−12 » emporté), le rond « avant » est remplacé par un stub
  hachuré au pied de la barre ; aucun « 0 » sur la page (`valeursZero: 0`, DOM).
- **Loupe hors figure** : la bande des 24 moments passe sous le rail (les barres pendent du rail) ; la loupe (74 px) ne
  couvre que les pastilles et les jours. Intersection loupe / figure (barres `#p4b1-fig` et bande `.p4b1-strip`) mesurée
  au DOM : **0 px²** à 20′, au whirlpool et à après · 7 j (`p4b-commun/loupe-figure.json`).
- **Le gain devant dans la loupe** : chaque voisin lit « 20′ · ≈+11 » en couleur, puis « ≈−12 » emporté dessous (plus
  jamais « −12 » seul : loupe à 20′ = 30′ ≈+9 ≈−14 · 25′ ≈+10 ≈−13 · 20′ ≈+11 ≈−12 · 15′ ≈+12 ≈−11 · 10′ ~+13 ~−9).

## Améliorations du brief prises
- **2, le contour chaleur / CO₂** : il devient la figure. À actif · 2 j, le CO₂ emporte ~−1 floral et ~−6 résineux (la chaîne
  de d1) ; à 20′, la chaleur emporte ≈−12 floral, ≈−13 résineux. La pastille de réponse nomme la cause par son signe
  (flamme ou bulles), et les quatre étapes du dock disent leur perte de floral : 60′–0′ −21…−9, WP −9, actif −1, après ★ 0.
- **4, l'inconnu n'est jamais zéro** : Pépins et Melon visibles, hachurés « ? » ; Noyau et Baies « ? → gain ».
- **6, la lecture sans légende** : une seule rangée par ligne ; la queue hachurée se reconnaît sans mot ; la bande sous
  le rail répète, sur les 24 moments, le floral gardé (plein) et l'emporté (queue).

## Greffes
Queue hachurée de d2 ; « le CO₂ emporte ~−6 résineux » de d1 ; parts emportées de f6 ; loupe ×5,6, sauts et jours d'a1.

## Ce qui tient
- À 60′, les barres sont presque toutes hachurées (« tout part à la chaleur ») ; à actif, les queues sont courtes ; après, « tout reste ».
- Premier écran plein (1,0 écran) ; loupe à 66 px par cran contre 11,8 sur le rail (×5,6) ; 33 mots hors données.

## Ce qui casse
- Résineux est déjà hors du style (83 pour 30) : sa barre est pleine et la queue ~−6 du CO₂ ne se voit que dans le chiffre.
- Dans l'ébullition, les 11 crans interpolés sont dits « ≈ » et pâlis, mais la cause reste « chaleur » pour tous.
- La loupe à deux chiffres par cran est plus haute (74 px) : elle couvre les pastilles pendant le geste.

## Contrôles (rejoués après les retouches)
| critère | sortie |
|---|---|
| G2 `controle-commun --sans=mots` | **COMMUN OK** |
| G3 `controle-une-question` | **UNE-QUESTION OK (1 groupe libre : moment)** |
| G4 `mots-premier-ecran --max=80 --sans-donnees` | **MOTS OK**, 33 mots |

Geste (`geste.json`) : d'actif · 2 j (~+22, 60+?, « ~−1 · ~−6 » CO₂) à 20′ (≈+11, ≈119, « ≈−12 · ≈−13 » chaleur). Captures
ouvertes : `captures/p4b1-premier-ecran.png`, `p4b1-pendant.png`, `p4b1-apres.png`.
