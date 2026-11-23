# Reprise du lot Calendrier (23.11) — agent arrêté à 400 k

Worktree : `C:/Users/mrspa/.codex/worktrees/openai-clean-start/lot-cal`, branche `claude/lot-cal` (depuis claude/port-carnet-1711).
node_modules en jonction vers port-carnet ; `.env` copié. Non poussé, non déployé.

## Fait
- **Point 1 commité : 59abbc3d1** (« POINT 1 PRÊT » envoyé au pilote).
  - Cause : bord tiré compté à largeurColonne/7 (`largeurJourA` Rangee, `largeurJourDe` usePointeur) : colonne de mois lue comme une semaine ;
    le glisser retranchait aussi un recul en semaines à un pas en mois.
  - Correctif : `alignement.ts` (jourReelDeX, xDeJourReel, joursDuDoigt, pasDuDoigt) ; usePointeur lit le jour sous le doigt (axe de l'appui,
    axe du moment) ; Rangee dessine le bord par xDeDate ; frise `data-colonnes`. Au jour, fenêtre d'1 colonne : bornes ±6/7, doigt borné à R−1.
  - Preuves : `tests/unit/proprietes/lacherOuDessine.test.ts` (rouge sur l'ancienne lecture, vert) ; `e2e/calendrier/lacher-ou-dessine.spec.ts`
    rouge sur HEAD (« 51 sem. bord : annonce 18 avr. ≠ axe 1 sept. »), vert après. Suite e2e/calendrier complète après point 1 : 216 passés,
    2 échecs paysage lot-9 L-58/L-59 **déjà rouges sur HEAD** (vérifié sur le build rouge), 16 sautés.
- **Point 2 codé, NON COMMITÉ** (fichiers modifiés dans lot-cal) :
  - `src/domain/calendrierCaisse.ts` : `creuxEntre` (D433).
  - `src/ui/calendrier/entete/Fenetre.tsx` : `etiquetteDates` (D434, « 26 oct. – 15 nov. ») au repos et au tirage ; `setDrag(null)` toujours au lâcher
    (la bulle du tirage restait : « S49 – S46 2027 » à 3 sem.).
  - `src/ui/calendrier/entete/BandeSemaines.tsx` + `entete.css` : `abscisses`/`dansCadre`, bande sur l'axe de la courbe, `data-hors` gris (D432).
  - `src/ui/calendrier/entete/EnTete.tsx` : creux du cadre, pastille « 0 · dans le cadre » à la butée (mesurée, non rognée), `bandeSurCourbe`
    (portrait, hors alignement), mois (>26 sem.) aussi sur la courbe (initiales), BandeColonnes gardé pour jour/déplié.
  - Tests : `e2e/calendrier/echelle-suit-cadre.spec.ts` (rouge sur HEAD : cadre ≠ graduations, étiquette S, pastille hors cadre ; vert après) ;
    `e2e/outils/calendrier.ts` : `fenetreDe`, `semainesDuLibelle` (espace insécable !), `lireCoherence` ignore `[data-hors]`.
  - Captures regardées : `%TEMP%/lotcal-cap/planche.png` (1 et 3 sem.), `planche2.png` (14 et 51 sem.), avant/après à 390.

## À faire (reprise)
1. **4 rouges e2e/calendrier/frise.spec.ts après le point 2** (390) : CAL-RETOUR-PASSE (l.85), T9-2 frotte (l.238), T9-2 immobile (l.250),
   axe a11y 3 mois (l.264). Probable : étiquette en dates (D434) que ces tests lisent en « S.. » (`lireCoherence`/`ecartsCoherence`, regex
   `^S(\d+)`) ; a11y : contraste des semaines grises (`opacity .45`) ou bouton sans nom. Lire `%TEMP%/lotcal-p2.log`, adapter le test à D434
   (lire les dates) ou corriger le contraste (gris via couleur, pas opacité). Puis commit du point 2 (chemins listés ci-dessus).
2. Point 3 (D436 / CAL-SANS-LECTURE) : retirer lecture et bulle de la courbe (LectureCourbe, usePointeurCourbe, `onLire` du cadre tenu 450 ms) ;
   doigt glissé hors du cadre = défiler la frise. Test rouge d'abord (un e2e pour la ligne).
3. Point 4 lenteur : mesurer INP / longues tâches sur build, 390, CPU ×4 (cadre, durée, glisser), corriger, remesurer.
4. Point 5 bandeau « Enregistrement sur le serveur… » sur le sélecteur de période.
5. Fin : `npx playwright test e2e/calendrier e2e/carnet` une fois ; captures 390 ; planches avant/après (points 1 et 2 : avant = build rouge).

## Outils locaux (non commités)
- `playwright.lotcal.config.ts` : preview du build `%LOCALAPPDATA%/Temp/affinee-e2e/lotcal` port 4391 (LOTCAL_BUILD/LOTCAL_PORT) ; build rouge
  (HEAD + data-colonnes) : `.../affinee-e2e/lotcal-rouge`, port 4392, sources `%LOCALAPPDATA%/Temp/lotcal-rouge-src` (worktree détaché à retirer).
- Rebuild : `node e2e/outils/preparer.mjs "$LOCALAPPDATA/Temp/affinee-e2e/lotcal"` (≈ 45 s). Le build de dev (`vite` serve) échoue : utiliser le build.
- `e2e/calendrier/zz-captures-lotcal.spec.ts` (captures, à ne pas commiter) ; `%TEMP%/lotcal-planche.cjs` (planches) ; `%TEMP%/ed.cjs` (remplacements).
- tsc : erreurs préexistantes seedData absent / atelierModel (hors lot).
