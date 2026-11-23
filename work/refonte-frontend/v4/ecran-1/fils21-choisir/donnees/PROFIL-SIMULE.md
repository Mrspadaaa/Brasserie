# Profil aromatique simulé (lot 21) : note du moteur

Le brasseur, 19.10 au soir : « On peut aussi simuler un 'faux' profil aromatique […] Quitte à tricher un peu ». Ce profil est une **couche de lecture**, toujours marquée `simulé`. Les vraies valeurs restent à côté, dans `mesures[]`.

- Moteur : `prototypes/houblons-v4/src/engine/profil-simule.ts`.
- Table : `prototypes/houblons-v4/data/correspondance-familles.json`.
- Script : `prototypes/houblons-v4/scripts/profil-simule-cas.ts`, lancé avec vite-node.
- Tests : `prototypes/houblons-v4/tests/profil-simule.test.ts`.
- Sortie : `profils-simules.json` (1,8 Mo) :
  - 41 cas, de K1 à K5 ;
  - une grille de 624 entrées ;
  - 90 paires.

## La formule

1. **Rapport au seuil simulé d'un composé**, en `{ bas, centre, haut }` :

   R = charge × part retrouvée × part extraite ÷ seuil

   - La charge et le seuil viennent du moteur « pouvoir » (`pouvoir.ts`).
   - La part retrouvée dépend du moment (table `partsRetrouvees`, H §8.2).
   - La part extraite dépend des jours : 1 − e^(−t/τ), avec τ = 2–12 h (centre 7 h) et t plafonné à 3 j (H73).
   - Composés retenus : linalol, géraniol, myrcène, humulène, caryophyllène, 4MMP, 3MH et 3M4MP, plus le citronellol produit par la levure.
2. **Activité d'une famille** :

   A = ½ × ΣR × forme + ½ × Σ poids × R

   - La forme vient des fiches : marqué 1, cité 0,5, non décrit 0, normalisée sur les 12 familles.
   - Les poids sont ceux de la table des correspondances.
   - Un houblon sans fiche prend les nuances seules.
   - Un houblon sans composés prend la force de Cascade et la forme seule.
3. **Points sur l'échelle 0–100** (style-bands.json), en dose équivalente Cascade :

   x = 3,86 × A ÷ A_ancre

   points = 26 × [x ÷ (x + K)] ÷ [3,86 ÷ (3,86 + K)]

   - L'ancre : Cascade à 3,86 g/L, 24 h, dans la bière pâle de l'essai à 4,75 % vol., donne 26 points d'agrumes. C'est la ligne agrumes du tableau 3 de Lafontaine 2018 : (5,8 − 1,9) ÷ 15 × 100. La lecture de H et le degré sont vérifiés dans `recherche/K-lafontaine-2018-verif.md`.
   - K = 4,5 pour les agrumes et 5,6 pour l'intensité globale (H §7.4).
   - K = 16 pour l'herbacé et le vert [convention].
   - L'hyperbole porte la saturation.
4. **Plusieurs ajouts** :
   - les activités s'additionnent avant la courbe : la saturation est partagée ;
   - l'ordre, la synergie et le masquage restent inconnus (drapeaux du moteur).
5. **La levure** (dry hop actif seulement) :
   - géraniol → citronellol : Pomona au centre 50 %, haut 87 % (H41) ; les autres levures au centre 0, haut 87 % ;
   - 3MH libéré : précurseurs × dose × rendement. Rendement : Verdant et Diamond au centre 0,1 % (0,01–0,35 %, H42) ; US-05 et Pomona au centre 0.
6. **La dégustation prime** (LEVEL_RULE) :
   - Boisé et résineux « marqué » = 83 [66–100] ;
   - un ajout décale cette valeur de son effet simulé.
7. **Les crans** suivent CRANS_RULE (`levels.ts`, nouvelle fonction `cransOf`) et se lisent sur le centre.
8. **Aucune plage n'est rognée.**
   - Un haut au-delà de 100 reste tel quel : 1 985 familles sur 9 060 dans le fichier.
   - `largeur` = haut ÷ bas, ou `inconnu` quand le bas est nul.
   - `hautPartiel` nomme les composés sans borne haute publiée. Le vrai haut peut être plus haut, et la largeur est alors un minimum.

## La table des correspondances et ses sources

| Composé | Familles (poids) | Source du lien |
|---|---|---|
| Linalol | floral 0,6 · agrumes 0,4 | spec §6, H |
| Géraniol | floral 1 | spec |
| Citronellol (levure) | agrumes 0,6 · floral 0,4 | H93, H41, H §6.5 |
| Myrcène | vert 0,5 · résineux 0,5 | spec |
| Humulène | résineux 0,5 · épicé 0,5 | pilote-19-10 |
| Caryophyllène | épicé 0,5 · résineux 0,5 | pilote-19-10 |
| 4MMP | tropical 0,5 · petits fruits 0,5 | H11, spec |
| 3MH | agrumes 0,5 · tropical 0,5 | spec, H11 |
| 3M4MP | agrumes 1 | H11 |
| Farnésène | non utilisé : aucun seuil (H §8.1) | — |

Les liens (le sens) sont sourcés. **Tous les poids chiffrés sont des [convention]** : H ne donne aucune pondération.

## Conventions à valider par le brasseur

1. L'ancre : 15 points du panel valent 100 points de l'axe. Le degré de la bière (4,75 % vol.) n'est plus une convention : il vient de l'article (K).
2. λ = 0,5 : forme et nuances à parts égales.
3. Le poids des fiches : marqué 1, cité 0,5, non décrit 0.
4. Les poids composé → famille (table ci-dessus).
5. Le centre d'une teneur publiée d'un seul côté :
   - « < X » : X ÷ 2 ;
   - « > X » : X, au moins.
6. À chaud :
   - le centre vaut la moitié de la borne haute à 10′ et au whirlpool, le dixième à 60′ pour les terpènes ;
   - 4MMP à 10′ : borne de 67 %, par une perte d'ordre 1 passant par −91 % en 60′ (H13).
7. Le 3M4MP prend le taux du 4MMP.
8. Fermentation active :
   - hydrocarbures à la moitié de la part d'après fermentation ;
   - géraniol au centre d'après fermentation, avant conversion.
9. K = 16 pour l'herbacé, ajusté par le pilote sur H22.
10. La biotransformation :
    - conversion : 50 % pour Pomona, 0 % pour les autres levures ;
    - rendement des thiols : 0,1 % ;
    - précurseurs : Citra 23,6 mg/kg (H16), Cascade 1,64–8,11–20 (H17, Samia, H18).
11. Un houblon sans composés prend la force de Cascade (« au centre » du panel OSU, H21).
12. Héritée du moteur : le seuil ×10 au-dessus duquel il dit « hors du style ».

## Ce que le profil ne dit pas

- **Ce n'est pas une intensité perçue.** Les rapports au seuil réels sont dans `mesures[]`, avec MENTION_RAPPORT.
- Perception en bière noire : non documentée (H §8.3).
- Ordre des ajouts, synergie et masquage : inconnus. Le moteur additionne.
- Végétal et hop creep au-delà de 3 j : des drapeaux, sans chiffre. Le profil ne baisse ni ne monte après 3 j.
- Le farnésène (fond vert de Cascade) : aucun seuil, donc il ne compte pas. Le vert de Cascade passe par ses fiches.
- Les thiols :
  - Motueka et Nelson Sauvin : non chiffrés ;
  - Idaho 7 : 3MH et 3M4MP connus en somme seulement ;
  - Galaxy : 4MMP sans borne haute.

  Idaho 7 sort donc probablement trop bas : agrumes 15, tropical 18 à 4 g/L. YCH lui donne pourtant le profil le plus fruité des trois (H §7.1). Sa confiance est moyenne.
- Verdant et Diamond donnent le même résultat (même convention). Pour Diamond, Samia mesure plus de thiols mais un fruité perçu plus faible : c'est écrit dans le drapeau, pas simulé.
- Le cryo n'est pas simulé (composés inconnus).

## Trois exemples chiffrés (16D S1, US-05)

### Citra contre Cascade, 4 g/L, après fermentation, 3 j

Valeurs simulées, bande 16D 0–30 pour les familles neutres :

| Famille | Citra | Cascade |
|---|---|---|
| Agrumes | ~36 [13–56+], cran 4 (au-dessus) | ~23 [3,6–56+], cran 2 |
| Tropical | ~39 [17–63+], cran 4 | ~18 [1,8–59+], cran 2 |
| Floral (bande 0–55) | ~34, cran 2 | ~18, cran 1 |

- Drapeau « Sort du style 16D » pour Citra seulement : agrumes, tropical, petits fruits.
- Confiance bonne pour les deux.

Vraies valeurs :

| Mesure | Citra | Cascade |
|---|---|---|
| 4MMP, rapport au seuil (base commune) | ×4–71 | ×0,96–7,1 |
| Linalol, rapport au seuil | ×0,06–2 060 (largeur ×35 000) | ×0,0058–537 |
| Huile (mL/100 g) | 1–3 | 0,5–2,6 |

### Citra 4 g/L à 60′

- Écarts : agrumes +6,4, tropical +5,9, floral +4,6. Toutes les familles restent « ≈ », sous le seuil d'écart du style.
- Bas à 0, largeur inconnue.
- IBU ≈ 100 (80–120), avec le drapeau « Surtout de l'amertume à ce moment ». Confiance faible.
- Pour comparer, le même ajout donne +29 aux agrumes à 10′ et au whirlpool, +35 en dry hop.

### Citra 2 g/L 3 j (J+7), puis Galaxy 2 g/L 7 j (J+10)

- Agrumes ~33 [13–56+], tropical ~39 [20–63+] : cran 4 tous les deux.
- Saturation partagée : l'ensemble vaut 72 % (agrumes) et 69 % (tropical) de la somme des deux ajouts seuls. Seuls, Citra donne +26 / +28 et Galaxy +19 / +28.
- Tropical par jour : 0,5, 28, 28,5, 28,5 (J0 à J3), 39,1 à J4, puis 39,4 dès J6. Plus rien ensuite.
- Drapeaux :
  - au-delà de 3 j (Galaxy) ;
  - ordre, synergie et masquage inconnus ;
  - saturation partagée ;
  - hors du style.
- Confiance moyenne : Galaxy n'a pas de borne haute de 4MMP, et ses 7 j vont au-delà de 3 j.

## Confrontation avec `comparatifs-dryhop.json` (recherche J)

Rien n'a été recalé sur ces mesures. Elles sont ajoutées dans `mesures[]` (`type: "publiee"`), la mesure la plus proche par variété.

1. **E04 (Lafontaine 2018), tableau 3 : tranché par K** (`recherche/K-lafontaine-2018-verif.md`, copie OSU lue en entier).
   - H a raison : les agrumes plafonnent (1,9 à 7,0) et l'herbacé/thé monte (2,5 à 10,4). J avait inversé les deux lignes.
   - L'ancre de 26 points et les courbes tiennent.
   - Seule correction : la bière de l'essai est à 4,75 % vol., pas 5 %. Le moteur écarte alors les seuils mesurés à 9,3 % ; l'activité de l'ancre passe de 2,46 à 2,70, et les points baissent d'environ 4 % partout.
2. **E04 : part de linalol extraite de 23 % à 2 g/L, puis 7 % à 16 g/L.** Ma part retrouvée en dry hop a son centre à 53,5 % (milieu de l'enveloppe 7–100 %), quelle que soit la dose. La saturation passe par la courbe, pas par la part.
3. **E06, dose et durée inconnues.**
   - Citra : linalol 144 µg/L (témoin 46,8), myrcène 131, géraniol 86. Moteur, à 4 g/L : 460, 690 et 219 µg/L au centre, soit ×2–5 au-dessus. Les plages du moteur (12–2 064 ; 59–2 542 ; 2–1 025) encadrent les mesures.
   - Le rapport Citra ÷ Nelson Sauvin, écart au témoin, vaut 4,2 mesuré et 4,0 au moteur.
   - Le centre du linalol de Citra paraît haut : E01 donne 72–178 µg/L sur cinq bières.
4. **E03 : Idaho 7 au pitch** (S-04, 14 j, dose inconnue) : linalol 38 µg/L. Moteur en dry hop actif à 4 g/L : 221 au centre. La dose n'est pas comparable.
5. **E08 : Eureka!, l'essentiel passe en 2 jours** (−1 °C). Le sens est le même : rien après 3 j. Ma courbe est plus rapide, 97 % en 24 h, avec τ pris à 18–20 °C.
6. **E10 : Cascade 1,43 g/L, 1 h contre 96 h**, non distinguables au panel. Ma courbe ne donne que 13 % à 1 h (τ = 7 h). L'extraction perçue serait donc plus rapide que mon centre.
7. **H §7.4 (Kishimoto) : Cascade à 2 g/L, linalol 56,9 µg/L mesuré.** Moteur : 57 au centre.

## Contrôles

- `npm test` du prototype : 8 fichiers, tous verts, dont 16 tests pour `profil-simule`.
- `npm run typecheck` : vert.
- Fichier : 1 800 628 octets, régénéré après la correction du degré (K). Les 9 060 familles ont leurs bornes ordonnées (bas ≤ centre ≤ haut), sans NaN.
