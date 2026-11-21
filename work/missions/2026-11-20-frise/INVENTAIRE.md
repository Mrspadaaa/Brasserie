# Inventaire des frises et curseurs (port du comportement de la frise B, 21.11.2026)

Source du comportement : dépôt Brasserie, `work/missions/2026-11-20-frise/frise-interactive.html` (R1 à R14) et `ETAT-DE-L-ART.md`.
Module unique : `src/ui/geste/` (`moteur.ts` calcul pur, `useGlisse.ts` geste Pointer Events, `curseurNatif.ts` adaptateur des
`<input type="range">`), testé par `tests/unit/geste/geste.test.ts` (11 tests). Le dessin de chaque écran ne change pas.
Hors périmètre (autre session) : `src/ui/carnets/**`, `CreativeLabTab*`, `StocksTab.tsx`.

Réglages : **temps** = deux bords, les deux bouts visibles, l'échelle s'ajuste (R4, R5, R7, R14) ; **quantité** = un bord ancré à 0,
l'échelle ne s'étend que vers le haut (R6, R7, R10).

## Portés (commit par endroit)

| Endroit | Fichier:ligne | Réglage | Règles portées | Reste |
|---|---|---|---|---|
| Curseur de malt (ligne du ticket) | `src/ui/fermentescibles/Ligne.tsx:164` | quantité | R1 6 px, R2 relatif, R7 échelle vers le haut, R8, R10 Échap/cancel | R10 recalage du palier après lâcher (l'échelle se recale à la sélection, comme avant) |
| SO₄/Cl, eau | `src/ui/RatioSlider.tsx:104` | valeur bornée | R1, R2, R10 | — (borné 0…limite, pas d'extension) |
| Dose d'un effet (levure, sels…) | `src/ui/BandeauEffets.tsx:196` | quantité | R1, R2, R8, R10 (adaptateur natif) | R7 : le max natif est fixé par l'écran |
| Mesure du jour de brassage | `src/ui/BrewDayMeasurements.tsx:372` | valeur | R1 (21.11 : un toucher ne pose plus rien ; glisser ou Entrée ; clic de lecteur d'écran, detail 0), R2, R10 | — |
| Appel de mesure (Conduite) | `src/ui/brassage/AppelMesure.tsx:66` | valeur | R1 (21.11, comme la mesure), R2, R10 | — |
| Volume du brassin (lancement) | `src/ui/BrewLaunchPanel.tsx:124` | quantité | R1, R2, R10 | R7 |
| Budget | `src/ui/BrewerBudget.tsx:609` | quantité | R1, R2, R10 | R7 |
| NoLo : OG et dilution | `src/ui/NoloBrewTools.tsx:40`, `:124` | valeur | R1, R2, R10 | — |
| NoLo : simulateur | `src/ui/NoloRecipeSimulator.tsx:45` | valeur | R1, R2, R10 | — |
| Champ curseur générique (dilution) | `src/ui/SliderField.tsx:114` | quantité | R1, R2, R10 | R7 |
| Levure : cibles de bière | `src/ui/YeastBeerTargetPanel.tsx:196` | valeur | R1, R2, R10 | — |
| Levure : température | `src/ui/YeastRecipeWorkbench.tsx:208` | valeur | R1, R2, R10 | — |
| Prix (atelier) | `src/ui/atelier/CurseurPrix.tsx:31` | quantité | R1 (21.11 : toucher sur prix vide ne pose plus), R2, R10 | — |
| Jours d'ajout (plateau malt) | `src/ui/fermentescibles/Plateau.tsx:115` | valeur | R1, R2, R10 | — |
| Part privée (annuel) | `src/ui/finance/annuel/Etapes2.tsx:32` | % borné | R1, R2, R10 | — |
| Part pro d'un bien | `src/ui/finance/bien/BienCuve.tsx:99` | % borné | R1, R2, R10 | — |
| Production annuelle | `src/ui/finance/profil/ProfilEffets.tsx:163` | quantité | R1, R2, R10 | R7 |
| Ébullition (identité) | `src/ui/identite/CarteEbullition.tsx:68` | valeur | R1, R2, R10 | — |
| Volume (identité) | `src/ui/identite/CarteVolume.tsx:139` | quantité | R1, R2, R10 | R7 |
| Impôt bière (Plato) | `src/ui/production/ImpotBiereSheet.tsx:210` | valeur | R1, R2, R10 | — |
| Curseur de la fiche de production | `src/ui/production/fiche/ui.tsx:87` | valeur | R1, R2, R10 | — |
| Filtre alcool (min, max) | `src/ui/production/liste/FeuilleFiltres.tsx:337`, `:338` | plage | R1, R2, R10 | plage à deux bords en un seul geste (R3, R5) |
| Volume cible (adapter) | `src/ui/production/volumes/AdapterVolumes.tsx:199` | quantité | R1, R2, R10 | R7 |
| Dose de levure (récap) | `src/ui/recap/EtapeRecap.tsx:437` | quantité | R1, R2, R10 | R7 |
| Eau : curseurs gradués (dilution, volumes) | `src/ui/water/GradueSlider.tsx:98` | quantité | R1, R2, R10 | R7 |
| Période de Finances (opérations) | `src/ui/finance/operations/Frise.tsx` | temps | R1, R2, R3, R4 (deux bouts à 56 px au repos), R5, R7, R10 Échap, R12 (l'échelle suit), R13 | R14 deux doigts ; recalage instantané (pas d'animation 200 ms) ; durée minimale 1 jour (et non 1 semaine : la frise est au jour) |
| Cadre de période du Calendrier | `src/ui/calendrier/entete/Fenetre.tsx` | temps | R1 (6 px), R2 (déjà relatif), R10 Échap | R4/R7 (échelle de 52 semaines fixe), R3 corps, R14 |

## Non portés (reste)

| Endroit | Fichier:ligne | Réglage | Écart à la frise B | Pourquoi pas encore |
|---|---|---|---|---|
| Période du Calendrier (échelle) | `src/ui/calendrier/entete/Fenetre.tsx`, `src/ui/calendrier/usePointeurCourbe.ts` (lecture de la courbe, pas un réglage) | temps | échelle fixe de 52 semaines, pas de R4/R7 ; « lâchée au-delà de 80 % = l'année » | R4 change l'échelle de la courbe : à refaire avec `cadrerDeuxBouts`, avec CAL-ENTETE (même écran) |
| Barres glissées du Calendrier | `src/ui/calendrier/frise/usePointeur.ts:182`, `usePincement.ts:14` | temps | appui long, pince propre | à brancher sur `attacherGlisse` (seuil, Échap, bord) |
| Frise des archives (Finances) | `src/ui/finance/operations/FriseArchives.tsx:61` | temps | capture seule | idem |
| Plateau du malt (piste) | `src/ui/fermentescibles/Plateau.tsx:91` | quantité | position absolue, toucher pose | même port que `Ligne.tsx` |
| Houblon : rail Ma bière | `src/ui/hopIndex/maBiere/rail.ts:233` | quantité | à vérifier (poignée propre) | à brancher |
| Houblon : frise Ma bière | `src/ui/hopIndex/maBiere/Frise.tsx:163` | temps (minutes) | à vérifier | à brancher |
| Dryhopper (dose) | `src/ui/hopIndex/dryhopper/index.tsx:403` | quantité | position absolue au toucher | à brancher |
| Paliers d'empâtage (Conduite) | `src/ui/paliers/CourbeEmpatage.tsx:113`, `src/ui/production/fiche/StageLadder.tsx:59` | temps/temp. | à vérifier | à brancher |
| Courbe de fermentation | `src/ui/FermentationTemperatureChart.tsx:262` | valeur | à vérifier | à brancher |
| Sels (dose) | `src/ui/water/SaltDoseControl.tsx:57` | quantité | stepper | à vérifier si curseur |
| Chiffre à commander | `src/ui/stock/ChiffreACommander.tsx:152` | quantité | à vérifier | à brancher |
| Pas à pas, glisser sur un nombre | `src/ui/QuantityStepper.tsx:176`, `src/ui/numericInput.ts:309` | quantité | glisser-pour-régler | à vérifier si concerné |
| Fil des tâches | `src/ui/atelier/TodoTimeline.tsx:122` | temps | à vérifier | à brancher |
| Mur de stock | `src/ui/stock/MurStock.tsx:222` | lecture | pas une valeur réglée | probablement hors sujet |
| Comparer, Substituer, Suggérer (houblons) | `src/ui/hopIndex/comparer/index.tsx:537`, `substituer/index.tsx:596`, `suggerer/index.tsx:387` | à vérifier | appui long ou glisser | à vérifier |
| Fiche fermentation (curseur) | `src/ui/production/fermentation/FicheFermentation.tsx:289` | valeur | lit l'input natif du curseur | couvert si l'input est un des natifs portés : à vérifier |

R12 (clavier) : les curseurs natifs gardent le clavier natif ; les curseurs dessinés gardent leur `onKeyDown`. R14 (deux doigts) : seulement
pour les frises du temps, non portées.
