# p4b1 — « Gardé · emporté » (passe 4 sur a1, voie dh4b, 24.10)

**Chaleur : chaude.** Forme libre sur a1 : la figure d'a1 (barres l5b, amertume, « Face à ta stout », mesuré, pont
Levure, dock avec pastilles, jours, rail et loupe) reste, mais chaque barre dit deux choses : ce que le moment **garde**
(plein, couleur de la famille) et ce que la **chaleur** (flamme, hachure orangée) ou le **CO₂ de fermentation** (bulles,
pointillé bleu-gris) **emporte**, jusqu'à ce qu'aurait donné le dry hop après fermentation de même durée. Régénérer :
`node generer.mjs` ; captures : `node ../p4b-commun/capturer.mjs p4b1`.

## Améliorations du brief prises
- **2, le contour chaleur / CO₂** : il devient la figure. À actif · 2 j, le CO₂ emporte ~−1 floral et ~−6 résineux (la chaîne
  de d1) ; à 20′, la chaleur emporte ≈−12 floral, ≈−13 résineux. La pastille de réponse nomme la cause par son signe
  (flamme ou bulles), et les quatre étapes du dock disent leur perte de floral : 60′–0′ −21…−9, WP −9, actif −1, après ★ 0
  (greffe « la vapeur emporte… » de f6, en chiffres de points).
- **4, l'inconnu n'est jamais zéro** : Pépins et Melon sont visibles, hachurés « ? », plus repliés comme dans a1.
- **6, la lecture sans légende** : une seule rangée par ligne ; la queue hachurée se reconnaît sans mot ; la bande au-dessus
  du rail répète, sur les 24 moments, le floral gardé (plein) et l'emporté (queue).

## Greffes
Queue hachurée de d2 ; « le CO₂ emporte ~−6 résineux » de d1 ; parts emportées de f6 ; loupe ×5,6, sauts et jours d'a1.

## Ce qui tient
- Lecture en trois secondes : à 60′, les barres sont presque toutes hachurées (« tout part à la chaleur ») ; à actif, les
  queues sont courtes ; après, « tout reste ».
- Premier écran plein (1,0 écran), rien sous le pli ; le geste : loupe à 66 px par cran contre 11,8 sur le rail (×5,6).
- 29 mots hors données.

## Ce qui casse
- Résineux est déjà hors du style (83 pour 30) : sa barre est pleine et la queue ~−6 du CO₂ ne se voit que dans le chiffre.
- Dans l'ébullition, les 11 crans interpolés sont dits « ≈ » et pâlis, mais la cause reste « chaleur » pour tous : le
  partage entre vapeur et isomérisation n'est pas modélisé.
- La pastille de réponse mêle deux pertes (floral, résineux) : à relire sur un vrai téléphone.

## Contrôles
| critère | sortie |
|---|---|
| G2 `controle-commun --sans=mots` | **COMMUN OK** (après correction : le picto floral de la pastille héritait du bleu du CO₂, S2 ; icônes flamme et bulles passées à 14 px et 2,57 de trait, S4) |
| G3 `controle-une-question` | **UNE-QUESTION OK (1 groupe libre : moment)** — 9 contrôles, contexte houblon, dose, levure, base |
| G4 `mots-premier-ecran --max=80 --sans-donnees` | **MOTS OK**, 29 mots |
| `controle-panel` (hors critères, cinq premiers écrans) | PANEL ECHEC : remplissage 0,49, ressemblance 0,92 (les cinq gardent l'en-tête d'a1) |

Geste (`geste.json`) : d'actif · 2 j (~+22, 60+?, « ~−1 · ~−6 » CO₂, Pomona ~+13 agrumes, mesuré 38 µg/L) à 20′
(≈+11, ≈119, « ≈−12 · ≈−13 » chaleur, rien ne change ici, jamais mesuré). Captures ouvertes : `captures/p4b1-premier-ecran.png`,
`p4b1-pendant.png`, `p4b1-apres.png`, à côté de `serie-a/passe3/captures/a1-premier-ecran.png` et `a1-toucher-390.png`.
