# Reprise du lot Calendrier (23.11, 5e agent), arrêté vers 355 k

Copie `lot-cal` (claude/lot-cal), origin/main fusionné (f14b7fb64). Contrat : VOIE-LOT-CAL.md (version courte, points 0 à 8).

## Prouvé en ligne
- Tour 21 (index-BQLJeQyT.js) : `e2e/en-ligne/sans-lecture.spec.ts` (neuf) et `plus-qu-un-an.spec.ts` verts ; captures entières regardées
  (`en-ligne/an-plus-passe.png`, `sans-lecture-*.png`). Commit d7a2b40eb.
- Les preuves en ligne partent d'aujourd'hui et y ramènent la vue (`ramenerAujourdhui`, e2e/en-ligne/outil.ts) : un essai raté avait laissé
  sa vue à « nov. 2025 », remise depuis.
- Vu en passant : à 6 ans de fenêtre (déc. 2025 – nov. 2031), colonnes de la frise 1,5 px à côté de la bande vers 2030 (fautesAxe, tolérance
  1,5). Mineur, non traité.

## Fait, commité, PAS encore « PRÊT » (points 0, 1, 2 du contrat)
- **0 CAL-ANNULEES-COMPTEES** : `useDonneesCalendrier.ts`, les ventes encaissées d'une pièce annulée (`isActiveTransaction`) ne sont plus des
  choses ; la caisse garde le paiement et son remboursement (net 0, comme Finances). Test vitest `bugsWorkflowsCalendrier.test.ts` (rouge avant).
  À prouver en ligne : rangée Ventes +5 695 (et non +5 785).
- **1 CAL-JOUR-EXACT** : `alignement.ts` (plancher : `joursDuDoigt`, `joursJusquAuDoigt`, `pasDuDoigt` + `colonneDuJour` en mois de calendrier
  hors de l'axe) ; `usePointeur.ts` option `bout` (le bord va au jour SOUS le doigt) ; `Barre.tsx` passe `bout`, points d'étape au milieu de leur
  jour sur la barre entière bords compris (`--x`, frise.css clamp 2 px), phases sur la même grille (`posPiste`, `phases`). Propriétés exactes
  (`tests/unit/proprietes/lacherOuDessine.test.ts`, 4 propriétés, vertes ; rouges sur l'arrondi). e2e `e2e/calendrier/jour-exact.spec.ts` rouge
  sur le tour 21, vert.
- **2 CAL-SEMAINE-ENTRE-TRAITS** : `BandeSemaines.tsx` : `graduationsBande` rend les LIMITES (lundis ; pas 2/4 : lundis des groupes ; mois :
  1er ; an : 1er janvier), `periodesBande` / `groupesDeSemaines` posent chaque nom au milieu de sa part visible (décalage `left` dans sa cellule).
  Jours inchangés. `e2e/outils/axe.ts` : `fautesTraits` (nouvelle règle, appelée aussi par `fautesAxe`). e2e `semaine-entre-traits.spec.ts`
  rouge sur le tour 21, vert. Captures regardées : 10 sem., 6 mois, An, 3 sem. (bonnes).
- `calendrierCaisse.test.ts` A2 : la longueur attendue suit l'horizon (périmé depuis le tour 20).
- Vitest calendrier + propriétés : 334 verts. tsc : seules erreurs préexistantes (services/migration, storage ; e2e : minimatch, brewCompanion).

## Reste avant « PRÊT À METTRE EN LIGNE »
1. e2e calendrier entier à 390 sur l'arbre : 9 rouges. Sur le build du tour 21 (`E2E_REF=d7a2b40eb`, port 4392, build
   `%LOCALAPPDATA%/Temp/affinee-e2e/tour21`) : barre-bord L-1 (bord gauche, autre cas), feuilles T11-1, lot-9 L-59 rouges AUSSI → préexistants.
   Résultat de plus-qu-un-an sur le tour 21 : voir la sortie de la tâche bfuovgxlw (sinon relancer ce seul test sur les deux builds).
   - À juger : barre-bord « début tiré, x = 4, levée aussitôt » (annoncé 17 oct., posé 9 oct.) et « sortie de l'écran par la gauche » : la
     fenêtre défile sous le doigt au bord gauche ; vérifier que l'annonce et l'écriture lisent le même `bout`/axe (usePointeur `joursDe`, `pasDe`).
   - frise.spec captures de référence (6 sem., 3 mois, 6 mois, An) : changement voulu (noms entre les traits) ; regarder les écarts puis
     `--update-snapshots` sur ces 4 seulement.
2. **3 CAL-VENTE-FICHE** : test écrit (`e2e/calendrier/vente-fiche.spec.ts`, pas encore joué) ; correctif à faire : `CalendrierTab.tsx:635`,
   `chose.source.genre === 'facture'` → la pièce s'ouvre directement ; pour `chose.rangee === 'ventes'`, tomber sur `setSelectionId` (la fiche
   a déjà « Ouvrir la pièce », DetailChose.tsx:55). Puis jouer le test (rouge avant, vert après).
3. Commit, « PRÊT À METTRE EN LIGNE <hash> » au pilote (0 à 3 ensemble), preuve en ligne : Ventes sans les ZZ annulées, jour exact à 3 sem. (un
   ZZ TEST à tirer : il faut une chose ZZ TEST en ligne), traits à 10 sem. et An, vente → fiche.
4. Puis points 4 à 8 du contrat (bandeau « Enregistrement… », sections vides compactes, tirage à 10 sem., « −1 663 », lenteur).

Locaux non commités : `playwright.lotcal.config.ts`, `e2e/calendrier/zz-*.spec.ts`, `e2e/en-ligne/zz-explore.spec.ts` (sondes).
Commandes : build `node e2e/outils/preparer.mjs "%LOCALAPPDATA%/Temp/affinee-e2e/lotcal"` puis
`npx playwright test -c playwright.lotcal.config.ts <spec> --project=android-390` ; captures de débogage : `LOTCAL_DEBUG=<dossier>`.
