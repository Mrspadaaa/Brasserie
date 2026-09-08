# Solveur de sels et traitement de l’eau

Mise à jour du 8 septembre 2026. Les concentrations affichées sont celles de
l’eau de traitement combinée, **après les doses d’acide retenues**. Ce ne sont
pas des concentrations prédites dans la bière après extraction et ébullition.

## Cibles et priorités

- **Le profil choisi est le contrat du dosage : Ca, Mg, Na, SO₄, Cl et HCO₃
  doivent tous respecter leurs plages après les deux doses d’acide.** Le bilan
  ne peut afficher « Profil atteint » que si chaque ion demandé est dans sa
  plage. L’AR et le pH estimés restent des diagnostics distincts.
- Les sels compensent le HCO₃ neutralisé par l’acide de rinçage et par une
  éventuelle dose manuelle à l’empâtage. L’acide automatique d’empâtage reste
  dans l’intervalle qui respecte le HCO₃ total du profil. La recommandation
  empirique d’AR peut départager ces doses ; elle ne peut pas annuler le profil.
- Une cible numérique explicite précise les ions souhaités. Pour HCO₃, la
  tolérance est de ±2 ppm. Un résultat inaccessible affiche la valeur réelle
  et l’écart ; aucune plage n’est élargie pour le déclarer atteint.
- Un ion absent d’une cible partielle n’a pas de poids dans l’optimisation.
  Il conserve un plafond minéral, sans devenir une cible implicite à zéro.
  Un HCO₃ non renseigné reste piloté par l’empâtage.
- Les limites minérales ne sont pas relâchées pour améliorer le résultat.
  Un excès déjà présent dans la source ne peut pas disparaître par ajout de sel.
  Le curseur ne peut pas non plus élargir les plages SO₄/Cl. Une consigne de
  ratio incompatible reste visible face au rapport réellement obtenu.
- **Doser conserve les doses manuelles d’acide**, y compris zéro au rinçage.
  Le résultat est recalculé depuis ces quantités. Revenir à l’acide calculé est
  une action explicite. Le malt acidulé appartient au grain, pas au rinçage.
- Les sels alcalins vont uniquement à l’empâtage. Les autres sels suivent
  l’option de répartition. Les doses absentes, nulles ou invalides ne sont pas
  des additions physiques ; les zéros manuels restent dans les métadonnées
  d’override quand il faut conserver cette intention.

## Calcul et unités

Les coefficients des sels sont en **mg/L apportés par g/L de produit**. Pour
une dose `g` dans un volume `L`, l’apport vaut `coefficient × g / L`. Les hydrates
sont ceux du catalogue : CaSO₄·2H₂O, CaCl₂·2H₂O, MgSO₄·7H₂O, MgCl₂·6H₂O.

Le bilan total de chaque ion est `(Cm × Vm + Cs × Vs) / (Vm + Vs)`, avec les
sources diluées, additions et acides propres à chaque eau. L’alcalinité est en
ppm CaCO₃ : `HCO₃ × 50 / 61`. L’approximation de Kolbach appliquée aux ppm d’ions
est `AR = alcalinité − Ca / 1,4 − Mg / 1,7` ; 3,5 et 7 seraient les diviseurs
pour les duretés déjà exprimées en CaCO₃, pas pour les ions bruts.

Le HCO₃ associé à la chaux représente une **équivalence d’alcalinité**, pas du
bicarbonate réellement contenu dans Ca(OH)₂. La craie conserve la convention
existante de 50 % de dissolution ; son effet réel dépend des conditions et
elle reste un recours lorsque la chaux est exclue. Ces conventions sont
visibles avec les contributions et précautions des produits.

Les équations et tables ont été recoupées avec [Bru’n Water, Water Knowledge,
sections 4.2 et 4.3](https://www.brunwater.com/water-knowledge), qui décrit les
hydrates, les apports par gramme, les équivalents de la chaux et les limites de
dissolution de la craie. La distinction entre dureté et alcalinité résiduelle
est également documentée par [MEBAK, Residual Alkalinity in Brewing
Liquor](https://www.mebak.org/en/methode/w-030-01-900/residual-alkalinity-in-brewing-liquor/2988).
Les tests de stœchiométrie reconstruisent séparément les masses molaires.

Les coefficients d’acide et le modèle empirique de grain ne sont pas une
mesure du pH. Le bilan garde séparément l’acidité au-delà du bicarbonate
neutralisé pour l’estimation de maische ; l’affichage HCO₃ ne devient pas
négatif. Le pH mesuré au brassage reste la référence pour la correction fine.

## Optimisation

`lsq.ts` résout des moindres carrés avec doses positives et bornes conjointes.
Une phase de faisabilité fournit un point initial lorsque les minimums
excluent l’origine. Les cas faisable et incompatible sont testés analytiquement.
`saltFit.ts` examine les sous-ensembles disponibles, puis les voisins sur la
grille de pesée de 0,1 g. Le minimum proposé est 0,5 g, sauf 0,1 g pour la chaux.
Le premier passage impose ensemble tous les minimums et maximums. Les voisins
arrondis sont eux aussi contrôlés contre ces bornes. S’il existe une pesée
conforme parmi les candidats, une pesée hors plage ne peut pas la remplacer
pour améliorer une moyenne d’erreurs. En l’absence de candidat conforme, un
second passage cherche un compromis et le bilan expose les ions hors plage.
Pour les cibles chiffrées, à précision comparable (0,75 ppm pondéré), moins de
sels sont privilégiés. Pour un profil de style, on cherche d’abord le meilleur
rapport SO₄/Cl parmi les candidats conformes ; dans une marge maison de 0,05
autour de ce meilleur rapport, on privilégie le moins de produits différents,
puis l’erreur aux concentrations de référence. Cette marge n’est pas un seuil
sensoriel. Le calcium est une contrainte de plage, sans pénalité pour s’écarter
de son minimum : on évite ainsi d’acheter du magnésium ou du potassium pour
remplacer du calcium pourtant autorisé. Mg et Na gardent leurs limites et leur
préférence pour de faibles ajouts lorsque le profil ne demande pas davantage.

L’erreur minimale irréductible de la source est retirée **du seuil de
comparaison**, pas de l’objectif du problème numérique. Sans cela, beaucoup de
HCO₃ déjà présent rendait artificiellement négligeable une perte de précision
sur du sodium pourtant atteignable, et faisait retirer un sel utile.

Les profils de l’application passent par `waterProfileTarget` et ajustent les
six ions ensemble. L’ancien contrat d’AR reste disponible pour les appels
techniques qui le demandent sans profil prioritaire ; il ne gouverne plus
les profils choisis dans l’atelier. Les profils partiels sans HCO₃ conservent
l’ajustement minéral et alcalin itératif. L’exploration locale de la grille
ne constitue pas une preuve d’optimum global sels, acides et dilution.
Le résultat et les diagnostics proviennent toujours du plan final pesable.

Le rapport zéro du curseur est une consigne valide, mais ne permet pas de
descendre sous le minimum SO₄ du profil. Un profil numérique sans chlorure reste inchangé
jusqu’à une modification explicite du ratio ; l’interface indique un rapport
non défini plutôt qu’une division par zéro.

Le curseur distingue le **réglage** (poignée dorée) du rapport **obtenu**
(repère bleu calculé sur SO₄/Cl). Sa piste représente la part de sulfate dans
SO₄ + Cl : `position = 100 × ratio / (1 + ratio)`. Pour la limite 9:1,
la coordonnée de la piste va de 0 à 90 et le repère 1:1 se trouve à 50 ; les
rapports courants disposent ainsi d’une largeur lisible sur mobile. Les gestes
sont convertis depuis cette coordonnée, tandis que le contrôle natif conserve
le ratio et ses bornes 0–9 pour les lecteurs d’écran. Les flèches le règlent par 0,05.
Le repère obtenu garde la précision des concentrations et ne subit pas le pas
de saisie. Le libellé d’orientation est choisi avant tout arrondi ; des teneurs
faibles en sulfate et chlorure ne décrivent pas la minéralité de toute l’eau.

## Séparation des responsabilités

| Module | Responsabilité |
|---|---|
| `domain/water/ions.ts`, `lsq.ts` | Arithmétique ionique et optimisation numérique indépendante |
| `substances.ts` | Composition des produits et contributions par gramme |
| `mashPh.ts`, `acid.ts`, `practice.ts` | Modèles et règles de brassage, doses d’acide retenues |
| `profileTarget.ts` | Construction commune des cibles, ions absents et ratio explicite |
| `profileAssessment.ts` | Respect des six plages, écarts et statut partagé du profil |
| `profileDiagnosis.ts` | Causes vérifiées : source, rinçage, exclusions, apports liés, alternative calculée et ratio incompatible |
| `manualImpact.ts` | Comparaison des traitements avant/après une saisie, y compris les acides automatiques et le pH estimé |
| `saltFit.ts`, `mineralSolver.ts`, `profileSolver.ts` | Ajustement des pesées, profils de style et profils numériques |
| `solver.ts`, `solve.ts`, `solverMessages.ts` | Coordination et diagnostics structurés |
| `plan.ts`, `treatment.ts` | Répartition, bilan de masse et eau réellement traitée |
| `dilution.ts`, `domain/recipeWater.ts` | Proposition de dilution et orchestration de la recette |
| `ui/water/types.ts`, `useWaterWorkshop.ts` | Contrat d’édition et état dérivé de l’atelier |
| `ui/water/WaterWorkbench.tsx` et vues associées | Parcours mobile, doses et détails de composition |
| `ui/water/WaterBicarbonateBalance.tsx` | Lecture des deux eaux et de leur moyenne après acide, sans formule chimique dans la vue |
| `ui/RatioSlider.tsx` | Consigne et ratio réel issus des ions, avec gestion des limites de piste |

`ui/SaltSolver.tsx` compose l’atelier. Le moteur de domaine ne dépend pas de
React. Les vues ne possèdent pas de seconde formule de traitement.

Les conséquences d’un réglage manuel apparaissent à côté du sel ou de l’acide
modifié : deltas en ppm sur l’eau totale, sorties/retours dans le profil,
rapport, pH estimé et acide automatique ajusté. Le point de comparaison est
l’état avant ce geste, jamais une autre recette hypothétique. Il est effacé
après Doser et invalidé si l’analyse, les volumes, les dilutions ou les malts
changent. Ces instantanés d’interface ne sont pas enregistrés dans la recette.
Si le modèle de pH atteint sa limite de variation, cette limite est annoncée :
un affichage plafonné ne prouve pas que le pH réel cesse de baisser avec l’acide.

Les explications de goût restent des orientations, avec les concentrations
absolues visibles : un rapport identique ne rend pas deux eaux équivalentes.
Cette distinction et les effets de Ca, Mg, Na, SO₄ et Cl sont recoupés dans
[Bru’n Water, Water Knowledge, sections 3 et 4.4](https://www.brunwater.com/water-knowledge).
Les critères numériques de classement des pesées restent une politique de
l’application, pas une règle publiée par cette source.

## Vérifications reproductibles

Le bilan affiché distingue le respect des six ions du profil et le pH estimé.
La consigne de pH enregistrée n’est pas un résultat de calcul : une correction
de pH se prépare à partir d’une mesure. `recipeWaterReadings.ts` relit la source figée et les doses
retenues pour la fiche et l’export, sans relancer le solveur.

Cas de régression **Ttt** : 2,2 kg de Pilsner, 3,6 EBC, profil 20C,
10,8 L d’empâtage et 21,5 L de rinçage, dilution à 20 %. Les doses retenues
donnent Ca 103, Mg 11,2, Na 12,5, SO₄ 75,9 et Cl 93,6 ppm, tous dans les
plages 20C. Les 1,2 mL et 6,2 mL de lactique produisent respectivement
133,33 et 26,98 ppm de HCO₃, soit une moyenne pondérée de 62,54 ppm.
Ce résultat **ne respecte pas le profil HCO₃ de 120–250 ppm**. L’AR d’empâtage vaut −20,64 ppm CaCO₃
(plage calculée −43 à 0), tandis que le modèle estime pH 5,70 ±0,15 :
ni l’AR dans sa plage ni les cinq minéraux ne prouvent que la consigne 5,4
est atteinte. Le plan historique reste lisible tel qu’il a été pesé ; « Doser »
propose une nouvelle pesée respectant les six plages. Les diagnostics
pré-acide déjà résolus sont retirés du bilan.

Sur la capture suivante, l’acide d’empâtage est à 0 mL : les valeurs sont alors
200 ppm sur 10,8 L et 26,98 ppm sur 21,5 L, soit **84,83 ppm** au total
(85 sur l’ancien radar, désormais 84,8 comme dans le bilan). Les deux eaux après acide et leur moyenne
restent visibles, même dans la plage du style ou avec une cible personnelle.
Le détail expose le départ après chaque dilution, les sels et les doses retenues.
Ce bilan décrit les eaux traitées séparément avant malts et ébullition ; il ne
simule pas la chimie du moût ni le transfert d’un éventuel excès d’acide entre eaux.

La lacune des anciens tests était fonctionnelle : ils validaient cinq ions
et exigeaient parfois que HCO₃ reste sous le profil pour suivre l’AR du grain.
Les tests d’acceptation vérifient désormais les six bornes **après traitement**,
et pas uniquement la cohérence des formules ou l’absence d’erreur d’exécution.

- `tests/unit/lsq.test.ts` : optima analytiques, contraintes couplées, colonnes
  dépendantes, comparaison à une grille exhaustive indépendante.
- `tests/unit/globalWaterSolver.test.ts` : cible d’Angles et 100 profils
  construits depuis des additions connues.
- `tests/unit/styleWaterContract.test.ts` : chaque profil du catalogue depuis
  l’osmosée, six ions après acide, minimums conjoints et ratio incompatible.
- `tests/integration/waterProfileContract.test.tsx` : le bouton Doser sur le
  cas de la photo, les acides manuels conservés, le récapitulatif, l’export et
  la réouverture avec les six ions toujours dans les plages.
- `tests/unit/numericWaterProfile.test.ts` : HCO₃ explicite, neutralisation du
  rinçage, chaux sans sodium, limites du grain, profils partiels et stœchiométrie.
- `tests/unit/waterBalanceAdvice.test.ts` : balance conforme avec trois sels
  courants, causes chiffrées des écarts et ratio incompatible avec le profil.
- `tests/integration/waterManualImpact.test.tsx` : conséquences des pesées et
  des deux acides, saisie décimale complète, limites du modèle de pH et
  invalidation du bilan lorsque le contexte change.
- `tests/unit/waterSweep.test.ts`, `waterPractice.test.ts`, `stoutAlkalinity.test.ts` :
  balayages d’eaux et styles, continuité, plafonds, doses et dilution.
- Tests du traitement et de l’interface : doses manuelles conservées, bilan
  après acide, sauvegarde, ratio réel et composition de chaque sel.
- `scripts/check-water-ui-review.mjs` : captures et assertions dans Chrome à
  320, 390 et 768 px (champs tactiles, détails et fiche de pesée).
  `WATER_PREVIEW_URL` indique le serveur Vite local, `http://127.0.0.1:3008` par défaut.
- `scripts/check-water-bicarbonate.mjs`, puis `scripts/check-water-consequences.mjs` :
  reproduction de la photo, profil après Doser et conséquences près du champ
  modifié, avec une saisie au clavier réel et les mêmes trois largeurs.

Le banc historique de 1 044 plans est conservé dans
[water-solver-comparison.csv](water-solver-comparison.csv) et
[water-solver-comparison.json](water-solver-comparison.json). Ses mesures
précèdent le pilotage HCO₃ numérique actuel ; elles ne servent pas de preuve
pour les nouveaux comportements. `scripts/compare-solveur.mjs` permet de
refaire cette comparaison avec un commit de référence explicite.
