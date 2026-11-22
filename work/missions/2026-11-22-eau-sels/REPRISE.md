# REPRISE — EAU-SELS-UN-ECRAN (22.11, arrêt à 200 k)

Code : worktree `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet` (branche claude/port-carnet-1711, partagée :
commit par index temporaire seulement, puis `git add <chemin>` du même fichier sur l'index réel pour qu'il ne paraisse pas
« D » ; jamais add -A ni reset). Consignes du pilote reçues en cours : (a) trois critiques lues (CRITIQUE-brasseur, -ux,
-chimie) : résoudre tous leurs B et m sous sa règle, sort de chacun dans ECART.md ; (b) un seul thème (clair), 390×660 et
390×844 en profondeur, 1280 en simple contrôle.

## Fait
- Étape 0 : `ECART.md` écrit. Son choix RETROUVÉ : mission 2026-11-14-recette (branche `claude/reverent-roentgen-406505`),
  registre `ecrans-app.json` de cette branche, `eau-sels` choisi = « l'onglet 2. Sels d'aujourd'hui, inchangé » (15.11, « le
  candidat 1 est bien mais pas mieux que la version actuelle »), plus ses exigences 14.11 : toile en grand, sels et acides sur
  le même écran. Entrée absente du registre de port-carnet (à inscrire par le pilote : DÉCISION).
- Étape 1 : contrôle `scripts/parcours/eau-sels.mjs` (commit c4440cb7e). Recette neuve + malt « Pilsner » (eau 34 L),
  Eau › 2. Sels au repos. Tag tour9 : PARCOURS EAU-SELS ECHEC (9) ; arbre actuel : idem (dessin 147/374 px = 39 %, cercle 120,
  symbole 6,3 px, sels caco3/chaux/kcl et acides hors fenêtre à 660). Build de l'arbre réutilisable :
  `npx vite build --config scripts/parcours/vite.parcours.config.mjs --outDir <dossier> --emptyOutDir --logLevel error` (≈ 50 s),
  puis `node scripts/parcours/eau-sels.mjs <captures> --build <dossier> --captures --themes clair`.
- Aucune ligne de code de l'app modifiée encore. BUGS.md : ligne pas encore versée.

## Reste à faire (étape 2, plan arrêté, voir ECART.md § 4, P1 à P21)
Budget mesuré à 390×660 : fenêtre utile 119–608 px (489 px) ; largeur utile 374 px.
1. `src/ui/WaterRadar.tsx`, seulement quand `fitToControls` (la toile de pesée ; Récap et autres inchangés) :
   géométrie large : W 360, R 122, CY = R + 10, H = 2R + 24 (≈ 251 px rendus à 337 px de large) ; étiquettes Cl (haut) et
   Mg (bas) À CÔTÉ de la pointe (ancre start, x = CX + 12, symbole + valeur sur une ligne, plage dessous), flancs inchangés ;
   halo (paint-order stroke couleur du fond) ; polices rendues ≥ 11 px (anneaux 12 unités au lieu de 10) ; classe SVG
   `w-full` sans max-h ; échelle bornée sur les plages du style seules (stable pendant la pesée ; départ et obtenu au-delà
   coupés au bord, ▲ déjà géré) ; axe mis en avant sans trait foncé (stroke GRID, P12) ; légende en pictos coin bas gauche
   (tireté = départ, trait = obtenu, secteur = style) ; pastille « K⁺ n ppm » coin bas droit si KCl > 0
   (K = dose g × 524,4 / L d'eau totale, `substances.ts:172` untracked.ppmPerGramPerLitre ; vérifier le calcul existant de
   SaltMineralDetails / WaterAdditivesTable et le réutiliser) ; étiquette « HCO₃ moy. ».
2. `src/ui/water/useWaterControlsLayout.ts` : retirer le calcul de `--water-radar-max-height` (garder la part du « + » docké).
3. `SaltDoseControl.tsx` : cellule 40 px, − [nom / dose + « g »] + ; le nom ouvre la feuille ; l'interrupteur va dans la feuille
   « Minéraux du sel » (WaterWorkbench, Sheet `detailsSalt`) ; cellule exclue grisée, nom barré. Aucun `type="number"`.
4. Acides (`WaterWorkbench` + `AcidDoseControl`) : une rangée ≈ 40 px (Lactique 80 % ⟳ · empâtage − x + mL · rinçage − x + mL)
   + une ligne 11 px : HCO₃ emp./rinç. et « pH ≈ x ± 0,15 · consigne y » (valeurs `phEstimate`, `brew.targetPh` déjà calculées ;
   une seule voix neutre, P6/P7).
5. `RatioSlider` en une ligne de 32 px à 390 (CSS `water-ratio-compact` dans `workshop.css`).
6. Rangée de cible (liste + ◎ + Doser) : 36 px ; « Profil suivi : … » sous « Détails ».
7. `SaltSolver.tsx` / `WaterWorkbench.tsx` : WaterFeedback, WaterSummary, IonComparison, HCO₃ moyen, WaterTargetStatus,
   notes, « Comment les doses… » sous UN `<details>` « Détails » fermé (rien supprimé).
8. P5 : notice du bicarbonate (`src/domain/water/substances.ts:258` « Le plus courant, et le moins cher. » et le texte de
   l'acide lactique collé sous le sel actif dans `WaterFeedback.tsx`) : corriger le texte.
9. Puis : `eau-sels.mjs` vert (390×660 et 390×844, clair) ; captures 390×660, 390×844 ouvertes, 1280 en contrôle ; côte à
   côte avec 01-sels.jpg ; `npx tsc --noEmit -p .` ; vitest du moteur de l'eau avant/après (`npm test -- tests/unit/water`
   ou `rtk test npm test -- --maxWorkers=2 <fichiers eau>`) et `tests/integration/eauSels.test.tsx` ;
   `node scripts/parcours/geste.mjs <dossier> --endroits recette --themes clair` (ratio-eau) en arrière-plan, sortie filtrée.
10. Commit par index temporaire ; ligne EAU-SELS-UN-ECRAN dans Brasserie `work/missions/BUGS.md` puis
    `node scripts/agents/controle-bugs.mjs` ; mettre à jour ECART.md § 4 (sort réel, preuves).

## DÉCISION À PRENDRE
- Inscrire `eau-sels` (choisi 15.11, « aujourd'hui ») au registre `choix/ecrans-app.json` de port-carnet pour que
  `controle-choix.mjs` le garde. Recommandation : oui, avec ses mots du 14.11 et du 22.11.
- Interrupteurs des sels déplacés dans la feuille du sel (P9) : écart à sa grille choisie, imposé par « un seul écran » ;
  réversible. Recommandation : le faire, et le lui dire.
