# REPRISE-2 — EAU-SELS-UN-ECRAN (22.11, arrêt à 160 k, voie 2)

Lire d'abord REPRISE.md (contexte, consignes git) et ECART.md § 4 (P1 à P21). Code : worktree `port-carnet`. RIEN N'EST COMMITÉ
de cette voie : commit par index temporaire (GIT_INDEX_FILE, read-tree HEAD, `git add` des seuls fichiers ci-dessous), puis
`git add` des mêmes chemins sur l'index réel. Ces fichiers n'étaient touchés par personne d'autre au départ (`git status` vide).

## Fait (non rendu, non commité ; `tsc --noEmit` : aucune erreur dans src/ui/Water*, Salt*, water/)
- Base vitest AVANT (12 fichiers : water, globalWaterSolver, waterBicarbonateBalance, waterPractice, waterSweep,
  brewWaterPlanning, waterAnalysisComputer, waterBalanceAdvice, eauSels, eauW1b, waterRefusNegatif,
  waterAnalysisDoubleToucher) : **12 fichiers, 744 tests verts**.
- `src/ui/WaterRadar.tsx` réécrit : prop `boite {w,h}` (px) et `potassium` ; avec boîte (pesée < 640 px) : viewBox = pixels,
  R = min((h−10)/2, w/2−6), CX/CY au centre, h ramené à 2R+10 ; Cl et Mg à côté de la pointe (x = CX+10), SO₄/Ca coin droit
  (ancre end), HCO₃/Na coin gauche, symbole+valeur sur une ligne, plage dessous ; « HCO₃⁻ moy. » ; polices 12/16/11 px ; halo
  (paint-order, stroke cave-900) ; échelle sur les plages du style SEULES ; chevron bleu `data-depart-au-dela` si départ > échelle ;
  axe mis en avant sans trait foncé ; légende SVG au flanc gauche si CX−R ≥ 64 (sinon ligne HTML 18 px `LEGENDE_H` sous la
  toile, classe `water-radar-legend-pesee`) ; pastille « K⁺ n ppm » flanc droit. Sans boîte : géométrie d'origine, légende et
  légende/caption d'origine (Récap inchangé).
- `src/ui/water/useWaterControlsLayout.ts` : renvoie la boîte (state) ; w = largeur intérieure de `.water-radar-panel` ;
  h = max(180, bas fenêtre − haut du bloc (défilement 0) − (hauteur du bloc − hauteur de `.water-radar`) − 6) ; ≥ 640 → null.
  Plus de `--water-radar-max-height` (classe max-h retirée du SVG).
- `src/ui/water/WaterWorkbench.tsx` : boîte et potassium passés au radar ; « Profil suivi » déplacé dans Détails ; rangée
  d'acide `grid-cols-[auto_1fr_1fr]`, CycleTag « Lactique 80 % » (`acidLabel`, regex `/^Acide (\S)/` À TESTER) ; ligne
  `data-water-ph` (AR = `treatment.mashPhRa` · pH ≈ x ± u · consigne · « se vérifie au brassage ») ; un seul
  `<details data-water-details>` « Détails » (+ « n alerte(s) » ambre si caution franchie ou rien à proposer) contenant profil,
  IonComparison, HCO₃ moyen, WaterTargetStatus, note Mg, rapport, « Comment les doses… » et `children` ; « Doses manuelles
  conservées / Recalculer l'acide » et « Produit changé » restent VISIBLES sous les acides ; interrupteur du sel déplacé dans
  la feuille « Minéraux du sel » (même aria-label `<nom> — autorisé|écarté`). Props ajoutées : cautions, rienAProposer, children.
- `src/ui/SaltSolver.tsx` : WaterFeedback et WaterSummary passés en enfants du Workbench (donc dans Détails).
- `src/ui/SaltMineralDetails.tsx` : `apportNonSuivi(saltId, g, L)` exporté et réutilisé.
- `src/ui/water/AcidDoseControl.tsx` : prop `court?` DÉCLARÉE seulement.

## Reste (dans l'ordre)
1. `AcidDoseControl.tsx` : destructurer `court` ; rangée h-8 : [libellé court sur deux lignes 11 px « emp. » / unité] [− w-7]
   [champ h-8] [+ w-7] ; HCO₃ dessous 11 px en gardant `aria-label="HCO₃ après acide — <label>"` et le texte « HCO₃ x ppm »
   (tests waterAcidBalance, recipeEditing, waterEdgeCases… l'exigent).
2. `SaltDoseControl.tsx` : cellule 40 px : − [nom 11 px (bouton « Détail des minéraux de … ») / champ h-6 + « g »] + ; retirer
   l'interrupteur et ⓘ ; écartée = grisée, nom `line-through`. `onToggle` reste dans les props (inutilisé) ou retiré du Workbench.
3. `workshop.css` (mobile) : retirer les règles `.water-salt-switch`, `.water-salt-dose > button {width:24px}` et la hauteur 40 px
   forcée sur `.water-salt-dose` (bloc max-height 790) ; rapport en une ligne 32 px : grid `auto 1fr auto` (titre | piste | les
   deux dd empilés), dt et `.ratio-help` masqués visuellement (clip) ; `.water-radar .water-radar-legend.water-radar-legend-pesee
   {display:flex}` (la règle mobile cache `.water-radar-legend`) ; `.water-acid-product` sans marge, `.water-acid-row` : grid
   (la règle actuelle le force en flex-wrap).
4. P5 : `WaterFeedback.tsx` l. 192 : préfixer la notice par le nom de l'acide (`ACIDS[state.acidId].name` + « : ») ;
   `substances.ts` taste.text → « Son goût … empâtage et rinçage cumulés. » (grep des tests « CUMULÉS » : aucun).
5. P7 : `src/domain/water/readiness.ts` l. 9 : remplacer « Consigne hors de la plage estimée. Mesurer puis titrer la maische
   avant de corriger. » par une phrase cohérente avec l'acide calculé, p. ex. « Consigne hors de la plage estimée : l'acide
   neutralise l'alcalinité ; le pH se corrige au brassage, sur la mesure. » (aucun test ne cite l'ancienne).
6. Tests à adapter : `tests/integration/stoutSmoke.test.tsx:53` clique l'interrupteur « Bicarbonate de soude — écarté » →
   ouvrir d'abord la feuille (bouton « Détail des minéraux de Bicarbonate de soude »). Rejouer les 12 fichiers + waterAcidBalance,
   waterEdgeCases, waterManualSparge, recipeEditing, waterWorkshop, waterReactivity, stoutSmoke, fuzzSaisie.
7. Build + `node scripts/parcours/eau-sels.mjs <captures> --build <dossier> --captures --themes clair` ; ouvrir 390x660,
   390x844 (et 1280 en contrôle) ; régler un sel (+) et un acide (+) au doigt, capturer, ouvrir ; côte à côte avec 01-sels.jpg.
   Points à vérifier au rendu : budget 489 px à 660 (si les acides sortent, rogner la rangée de cible à 36 px ou le plancher
   TOILE_MIN 180), étiquettes de coin contre le disque, « + » docké (P16), S3 ≥ 75 %.
8. geste.mjs (recette, clair) en arrière-plan ; BUGS.md (ligne EAU-SELS-UN-ECRAN) ; controle-bugs ; ECART.md § 4 (sort réel) ;
   commit.

## DÉCISION À PRENDRE (inchangées, voir REPRISE.md) + une neuve
- Taille de la toile à 390×844 : la boîte laisse le disque monter jusqu'à w/2 − 6 (≈ 350 px de diamètre) quand la hauteur le
  permet ; la légende passe alors sous la toile. Recommandation : garder (sa règle : maximiser).
