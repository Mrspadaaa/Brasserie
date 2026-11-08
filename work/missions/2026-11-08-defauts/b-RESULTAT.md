# b — Brassins : bilan (08.11)

Branche `worktree-agent-ac1788c42a177ce37`, départ 48a3fee3. Format : `id | statut (preuve ou commit)`.
Tests : `npx vitest run --config work/missions/2026-10-31-ecran-depense/banc-b2/vitest.depense.config.mjs --maxWorkers=2 --testTimeout=60000 <fichiers>`.
Limite du poste : `tests/unit/brewAlarmServer.test.ts` ne se charge pas ici (module `firebase-functions` absent), avant comme après mes changements.

TE-42 | corrigé (5195a6b2) : « Étape n » à la station, « x/N étapes faites » en haut ; test `brewDayDefautsB`
TE-17 | reste (écran Fermentescibles, autre voie)
AM-5 | reste (écran Fermentescibles, autre voie ; le « AM 5 » de `batchAm4Am5` est un autre défaut, déjà corrigé en 7632c3a7)
AM-40 | corrigé (d3c7fb73) : densité 0,990–1,200 (`gravityBounds`), température −5 à 45 °C ; test `batchFollowUp`
AM-41 | corrigé (5195a6b2) : pH 3–9, température −5–105 °C, volume ≤ 2 000 L, densité = `gravityBounds` ; test `brewDayBornes`
AM-42 | corrigé (5195a6b2) : alerte volume > cuve ou fermenteur de l'installation ; test `brewDayBornes`
AM-43 | en cours : alerte > 30 °C et borne 105 °C faites (5195a6b2) ; reste le champ « Moût à l'ajout de levure »
AM-46 | non traité
TE-40 | corrigé (cc57c1b0) : note neutre quand une date réelle est connue ; test `batchDefautsB`
TE-43 | déjà corrigé (a0e4f4f3, RJ-1) ; preuve `tests/unit/boutonConduiteClair.test.ts`
PD-2 | reste (écran Fermentescibles, autre voie)
PD-3 | corrigé (d3c7fb73) : brassin planifié sans date visible sous toute période ; test `productionCatalog`
PD-6 | déjà corrigé (7632c3a7, `densityAxisDomain`) ; preuve `batchAbvOgConfirmee.test.tsx`
PD-7 | corrigé (d3c7fb73), même cause que PD-3
BR-49 | corrigé (5195a6b2) : « Terminer et continuer » idempotent ; test rouge puis vert `brewDayDefautsB`
BR-50 | corrigé (cc57c1b0) : bornes `brewQuantityBounds` (5 × prévu, plancher par unité) avec message
BR-52 | corrigé (cc57c1b0) : plus de liste vide, une phrase à la place (à confirmer par le brasseur)
BR-118 | déjà corrigé (7632c3a7) : « -1 » refusé avec message ; preuve `batchAm4Am5` RJ-2 (« -5 », « 0 », « 5 »)
BE-30 | corrigé (5195a6b2), voir BR-49
BE-31 | corrigé (cc57c1b0), voir BR-50
BE-33 | corrigé (cc57c1b0), voir BR-52
BE-44 | déjà corrigé, voir BR-118
BE-76 | reste (fût : `KegSheet`, fichier hors voie)
GE-NOTE-3 | reste (preuve Chrome, brassin planifié ou en fermentation : non faisable sans serveur de dev)
AM-44 | non traité
TE-35 | non traité
TE-36 | non traité
TE-44 | non traité
RJ-13 | non traité
PD-11 | non traité
PD-12 | non traité
BR-29 | non traité
BR-53 | corrigé (cc57c1b0) : « -1 » refusé avec message ; test `brewDayQuantitesB`
BR-54 | corrigé (cc57c1b0) : quantités à la résolution de la balance (`functions/src/brewAmount.ts`)
BR-55 | corrigé (cc57c1b0) : alarme « 123 g Lactose » ; test `brewDayQuantitesB`
BR-56 | non traité
BR-57 | non traité
BR-58 | non traité
BR-59 | non traité
BR-61 | non traité
BR-112 | non traité
BR-119 | non traité
BR-120 | non traité
BR-121 | corrigé (d3c7fb73) : dates ISO écrites jj.mm.aaaa dans la courbe et la carte ; test `fermentationReadings`
BR-122 | corrigé (cc57c1b0) : jour brassé futur refusé avec message ; test `batchDefautsB` (à confirmer)
BE-34 | corrigé (cc57c1b0), voir BR-53
BE-35 | corrigé (cc57c1b0), voir BR-54
BE-36 | corrigé (cc57c1b0), voir BR-55
BE-38 | non traité
BE-39 | non traité
BE-40 | non traité
BE-45 | non traité
BE-46 | non traité
BE-47 | corrigé (d3c7fb73), voir BR-121
BE-48 | corrigé (cc57c1b0), voir BR-122
BE-82 | non traité
BE-83 | non traité
