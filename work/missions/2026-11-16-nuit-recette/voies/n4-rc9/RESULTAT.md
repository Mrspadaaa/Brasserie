OK — RC-9 option B appliquée : 21A 5,9 → 2,2 mL, minimum démo 45 → 40 %, 8 tests de choix mis à jour

## Fait
1. `tests/unit/waterProposition21A.test.ts` remis (3 tests). Rouge sur HEAD : `expected -124.1 to be >= -62` et `mash 5.9 vs 2.2` (`n1-moteur/rc9-rouge.txt`). Écart à l'attente préparée : « AR dans la bande » est impossible à 50 % d'osmosée (HCO3 <= 60 → AR -60,7, 9 sous la bande -52) ; l'assertion est `raAfter >= band.min - 10`, HCO3 total <= 60, et la baisse de pH suit l'AR perdue (à 0,05 près). Le test « constat » fige 2,2 + 2,5 mL.
2. `rc9-candidat.patch` appliqué à `src/domain/water/treatment.ts` (l. 119-136). Test vert 3/3 (`rc9-vert.txt`).
3. 8 tests mis à jour, chacun avec « RC-9 (16.11) : ancienne valeur X », aucune assertion retirée :
   - `minimumOsmosee` : pct 45 → 40 (titre « démo (40 %) »).
   - `eauPrechargement` (2 tests, 3 attentes) : « 45 % » → « 40 % ».
   - `eauW1b` RC-1 (3 tests, 5 attentes) : « 45 % » → « 40 % ». Les attentes « 45 % » du test à moteur simulé (`juste`, l. 24, 89, 111) restent : valeur d'un mock, pas du moteur.
   - `waterReactivity` RL-5 (01A) : 3,3 → 1,6 mL. La phrase « acide dosé pour le profil » reste.
   - `stoutWaterProfile` « adopts the profile… » : après « Revenir aux doses calculées » 7,5 → 0 ; après Doser 6 → 0,9 mL ; radar 121,1 → 188,2 ppm (plage 120 à 250 tenue) ; plan enregistré mash 6 → 0,9 ; 6/6 ions toujours dans les plages (assertions gardées).
4. Natures vérifiées : toutes viennent de la seule correction. Stout (mesuré, 20C) : bande « bière noire » 84 à 126 ; ancien 7,5 mL → AR 9,8 (très sous la bande), nouveau 0,9 mL → AR 84 (bas de la bande), HCO3 188 (dans 120–250), pH 5,72 ; la même sur-acidification que 21A, un autre profil. RL-5 : AR après acide -26 sous le repère -17 à 35, à cause de la borne dure HCO3 du profil (comme 21A), et non du souhait de pH.
5. Rien d'écrit en dur dans `src/` : `grep` « 5,9 mL » / « 45 % » : aucune occurrence liée à l'eau (seuls des largeurs CSS, des fiches houblons, un commentaire de `brewingMath.ts` sur la levure).
6. Contrôles : 44 fichiers de l'eau (unitaires `water*`, `minimumOsmosee`, `stout*`, `waterProposition21A`, intégration `water*`, `eauW1b`, `eauPrechargement`, `stoutSmoke`, `stoutWaterProfile`, `brewerWaterProposal`) : 44 verts, 1304 tests (`eau2.txt`) ; avant mes mises à jour : 8 échecs exactement (`eau.txt`). `npx tsc --noEmit -p .` : 0 erreur (`tsc.txt` vide). `npm run build` : OK (`build.txt`).

## Avant → après (démo 21A : Villars, 50 % osmosée, 8 kg Pilsner)
- Acide : 5,9 + 2,5 mL → 2,2 + 2,5 mL.
- AR d'empâtage : -23 → -124,1 devient -23 → -60,7 (bande -52 à 7 ; 9 sous la bande, borne dure HCO3 <= 60).
- HCO3 total : 6,4 → 58,6 mg/L. pH estimé : 5,55 → 5,65 (cohérent avec l'AR : baisse de pH = ΔAR × 3,59 / 2250 à 0,05 près, testé).
- Minimum d'osmosée de la démo : 45 → 40 %.
- RL-5 (01A) : 3,3 → 1,6 mL. Stout 20C (Doser) : 6 → 0,9 mL.

## Limites
- Option B seule ; l'option C (message « profil HCO3 <= 60 ne tient avec l'AR de la bande qu'à ≈ 70 % d'osmosée ») n'est pas faite : touche l'UI.
- Suite complète `tests/unit` + `tests/integration` (`tout.txt`, lancée avant les mises à jour des 8 tests) : 39 échecs. `waterReactivity` (1) est corrigé depuis. `assistantPiedPlus` (22) : travail en cours d'une autre voie (FloatingActions, hors Possède). `hopV55PagePropertyAdviceV3` : passe au rejeu (instable sous charge). Les autres (`expenseSheet`, `recipeAiWorkflow` 2-3, `recipeEditing` 6, `yeastPitchingExecution` 2, `brewerHopAdviceTransportV1.browser` 2, `designTokens`, `virgule-transversale`) échouent aussi avec `treatment.ts` remis à HEAD (`autres-head.txt`) : antérieurs à RC-9, non touchés. `treatment.ts` rétabli ensuite (copie `treatment.rc9.ts.bak`, diff : 12 ajouts, 3 retraits).
- RL-5 est une phrase du brasseur : le montant change (3,3 → 1,6 mL), à lui de le voir. Changement de comportement visible : le Doser d'un stout dosait jusqu'au plancher HCO3 du profil ; il s'arrête maintenant au bas de la bande.
- `tests/unit/zzRc9Diag.test.ts` (diagnostic temporaire) créé puis supprimé.

## Fichiers touchés
`src/domain/water/treatment.ts` ; `tests/unit/waterProposition21A.test.ts` (nouveau) ; `tests/unit/minimumOsmosee.test.ts` ; `tests/integration/{eauPrechargement,eauW1b,stoutWaterProfile,waterReactivity}.test.tsx` ; ce dossier (`rc9-vert.txt`, `eau.txt`, `eau2.txt`, `tsc.txt`, `build.txt`, `tout.txt`).

CONNAISSANCE : en 21A, 50 % d'osmosée, le profil HCO3 <= 60 oblige l'AR à ≈ -61, 9 sous la bande ; le Doser s'arrête désormais au bas de la bande de couleur (stout : AR 84, bande 84–126), sauf borne dure du profil.
LEÇON PROPOSÉE : aucune
