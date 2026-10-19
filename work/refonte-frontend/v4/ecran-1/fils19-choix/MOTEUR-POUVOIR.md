# Moteur « pouvoir aromatique » : spécification (19.10, soir)

## Ce que le brasseur a dit

- « Comment choisir deux houblons ? La chose a été sur simplifier ».
- « citra aura un effet extrêmement differents en dry hopping que cascade alors que pourtant d'après Nos outils ils sont assez similaire ».
- « peut être aussi simuler un moteur à ce niveau en prenons en compte ces facteurs avec des intervalles de confiance. Ça avait déjà été proposée. Mais peut être simplifier pour avoir une estimation de pouvoir d'arome sur les 16d ».
- « voir ce que ça change si je fais du dryhop de citra, Galaxy, idao7. Et combinaison de 3j dryhopping Citra, 7j dry hopping Galaxy ; 3j citra - 5j idao7 […] C'est extrêmement complexe à voir ce qui est vraiment faisable ».
- « Aussi ils nous faut un outil de dry hopping, bio Transfo, levure ».

## Sources de cette spécification

- `work/refonte-frontend/v4/recherche/H-choisir-deux-houblons.md` : état de l'art du 19.10, sections 1, 7 et 8, 93 sources.
- `docs/research/INDEX-houblon-levure.md` : index de la recherche passée.
- `fils19-choix/DIAGNOSTIC.md` et `INVENTAIRE.md`.

## Ce que le moteur dit, et ce qu'il ne dit jamais

L'index relève une contradiction entre deux documents :
- E (rec. 2) propose une charge en µL/L, « jamais comme intensité » ;
- `index-houblon-recherche` (§3) interdit « huile × poids » présenté comme une mesure sensorielle.

**Décision : le moteur calcule des charges et des rapports au seuil, toujours en plage, avec leur base et leur niveau de preuve. Il n'en tire jamais une intensité 0–100.** Le « pouvoir aromatique » est une lecture ordinale de ces rapports : sous le seuil, autour du seuil, au-dessus d'un facteur N. Il porte la mention : « rapport au seuil, pas une intensité perçue ».

## Entrées

- **Par ajout** :
  - la variété, ou le lot s'il a un certificat ;
  - la dose (g/L) ;
  - le moment : 60′, 10′, whirlpool, dry hop en fermentation active, dry hop après fermentation ;
  - le jour de début et la durée de contact (jours) ;
  - la température ;
  - la forme : T90, cryo, inconnue.
- **Pour la bière** :
  - le style (16D d'abord) ;
  - le degré d'alcool : 16D = 6,3–8 % vol. ;
  - la levure.
- **Par variété** (nouveau fichier `prototypes/houblons-v4/data/composes-houblon.json`) :
  - huile totale (mL/100 g) ;
  - myrcène, linalol, géraniol, humulène, caryophyllène, farnésène (% de l'huile) ;
  - 4MMP, 3MH, 3M4MP libres (µg/kg) ;
  - précurseurs quand ils sont connus.

  Chaque valeur porte sa plage, sa source, son année et son niveau ([P] publié, [F] fabricant, [S] secondaire). On ne relève que des faits cités ; les fiches propriétaires ne sont pas importées en masse (D25). Variétés de départ :
  - Citra, Cascade, Galaxy, Idaho 7 (ses cas) ;
  - Motueka, Nelson Sauvin, Nugget, Citra cryo (le stock de S1) ;
  - avec ce que H et le dépôt documentent, et « inconnu » ailleurs.

## Calculs (H §8, tables reprises telles quelles)

1. **Charge introduite**, par composé et par ajout : dose × huile × densité de l'huile × fraction, en µg/L ; pour les thiols libres, dose × teneur, en ng/L. Plage complète, de la plus petite à la plus grande valeur des sources. La densité de l'huile est une plage sourcée.
2. **Part retrouvée en bière**, selon le moment, la dose et la base (H §8.2) :
   - Linalol :
     - ajout tardif 60–63 % ;
     - dry hop selon la base : ≈ 23 % à 2 g/L et ≈ 7 % à 16 g/L (huile hydrodistillée), ou 44–82 %.
   - Géraniol : −90 % du moût à la bière à chaud ; 22–120 % en dry hop.
   - Myrcène : < 1 % à chaud ; 0,6–3,4 % en dry hop.
   - 4MMP : −91 % après 60′ à 100 °C, −23 % à 90 °C ; ≈ 70 % en dry hop.
   - 3MH : 70 % supposé en dry hop (Hopsteiner).

   Chaque taux porte sa base. La part extraite baisse quand la dose monte (Lafontaine 2018) : c'est le mécanisme de la saturation.
3. **Durée de contact** : l'essentiel est extrait en 24 h. Au-delà de 3 jours, aucun arôme mesuré en plus, et un drapeau « végétal et hop creep ». Pas de courbe inventée.
4. **Concentration en bière** = charge × part retrouvée, en plage.
5. **Rapport au seuil** = concentration / seuil, en plage (H §8.1).
   - L'alcool relève les seuils : linalol ×2,5 et géraniol ×2,2 de 5 à 10 % vol.
   - Pour une 16D : « seuil en bière noire non mesuré ; perception non documentée ; pars de ta dégustation ».
6. **Lecture par famille**, en sens seulement :
   - linalol → floral, agrumes ;
   - géraniol → floral ; vers les agrumes par citronellol avec certaines levures ;
   - 4MMP → cassis, tropical ;
   - 3MH → pamplemousse, fruit de la passion ;
   - myrcène → vert, résineux.
7. **Pouvoir aromatique de l'ajout et de la recette**, en ordinal : pour chaque composé, sous, autour ou au-dessus du seuil (×N, en plage), plus le composé qui domine. **Face à la 16D** : le style attend un arôme de houblon faible et facultatif (BJCP 2021). Au-dessus du seuil d'un facteur élevé, le drapeau dit « hors du style ».
8. **Saturation** : une dose totale à cru dans la zone 4–8 g/L déclenche le drapeau « les agrumes plafonnent, l'herbacé monte ». La preuve vient de Cascade seulement, et le drapeau le dit.
9. **Ajouts successifs ou combinés** : les charges et les concentrations s'additionnent composé par composé. **L'ordre des ajouts, la synergie et le masquage sont « inconnus »**, toujours affichés comme tels, jamais déduits.
10. **Levure et biotransformation**, en drapeaux sourcés :
    - Pomona : géraniol → citronellol « medium » ;
    - libération de thiols à partir des précurseurs : 0,01–0,35 %, sur précurseur synthétique seulement ;
    - Verdant : qualitatif ;
    - Diamond : plus de thiols mesurés (Samia), pas le plus de fruité perçu ;
    - US-05 : non publié ;
    - hop creep : risque si dry hop avec levure vivante, ampleur non chiffrée.
11. **Vieillissement**, par famille, en plage :
    - monoterpènes stables à 0–4 °C, environ −25 % à 20 °C ;
    - thiols ≥ −50 % à 6 mois à 5 °C.

    Le HSI donne une classe de fraîcheur et la perte d'α.

## Ce qui doit en sortir (contrôles du moteur, avec témoin)

- **Citra ≠ Cascade** à 4 g/L en dry hop après fermentation : les plages de rapport au seuil du 4MMP ne se recouvrent pas, Citra au-dessus. Le linalol de Citra est au-dessus de celui de Cascade en central. **Témoin** : V5.5 donne les mêmes agrumes (39, 54, 55, 78).
- **Galaxy et Idaho 7** : huile et linalol chiffrés quand les sources existent ; thiols en classe ou « inconnu », jamais 0.
- **Citra 3 j puis Galaxy 7 j** : charges cumulées chiffrées ; la durée de 7 j déclenche le drapeau « au-delà de 3 j : pas d'arôme mesuré en plus ; végétal et hop creep » ; ordre et synergie « inconnus ».
- **Citra 3 j puis Idaho 7 5 j** : même lecture, plus le drapeau géraniol → citronellol si la levure le documente.
- **Une 16D** : le pouvoir aromatique est lu face au style (« faible et facultatif »), avec la mention « perception en bière noire non documentée ».
- **Aucune valeur inconnue n'est 0** ; chaque chiffre porte sa base, sa source et son niveau.

## Où le code va

- Prototype seulement : `prototypes/houblons-v4/src/engine/pouvoir.ts`, ses tests vitest, et le fichier de données. Aucun code de l'app avant la porte B.
- **Après**, et sur décision du brasseur : brancher le résultat sur ce qui existe déjà dans l'app (`src/domain/hopDecision/biotransformation.ts` et son `biologicalContext`, la saisie du dry hop, la courbe de dose), au lieu d'une couche parallèle (`INVENTAIRE.md`).
- **Ensuite**, les mini maquettes de l'outil de dry hop dans la baseline choisie. On y pose ses ajouts sur une frise de jours, puis on lit, par composé, la charge et le rapport au seuil, avec les drapeaux.
