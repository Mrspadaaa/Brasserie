OK — voie b : 57 lignes traitées, 7 commits de code, tests verts ; 11 lignes restent (autres voies, rendu Chrome)

# b — Brassins : bilan (08.11)

Branche `worktree-agent-ac1788c42a177ce37`, départ 48a3fee3. Commits : 5195a6b2, d3c7fb73, cc57c1b0, 26e97f47, bac64fca, f15d3b34, 50d5015c, 6171bb9c (+ bilans 7e86b457 et celui-ci).
Format : `id | statut (preuve ou commit)`.
Tests : `npx vitest run --config work/missions/2026-10-31-ecran-depense/banc-b2/vitest.depense.config.mjs --maxWorkers=2 --testTimeout=60000 <fichiers>`.
Rejoués avant le dernier commit : `tests/integration/batch`, `tests/unit/batch`, `tests/integration/brew`, `tests/unit/brew`, ferment, production, gravity, catalog, boutonConduite, alarme : tout vert, sauf des suites qui ne se chargent pas dans cette copie (`cheerio` et `firebase-functions` absents de `functions/node_modules` : brewAlarmServer, brewSessionServer, fermentationCompanion, fermentationImport, fermentationResearchAccess, brewer*) et `hopAdviceTransportV1.browser` (bundle des fonctions). Aucune ne touche mes fichiers ; `functions/src/brewSessionCore.ts` est exercé par les suites chargées (batchSchedule, brewAssist, yeastPitchSession).
Limite : aucun rendu Chrome (pas de serveur de dev par Bash) ; les défauts visuels sont corrigés à leur cause dans le CSS ou les classes, et gardés par des tests de source (`tests/unit/brewDayCssB.test.ts`). Une capture reste à prendre : 390 et 1280, deux thèmes.

## Par identifiant

TE-42 | corrigé (5195a6b2) : « Étape n » à la station, « x/N étapes faites » en haut ; test `brewDayDefautsB`
TE-17 | reste (écran Fermentescibles, autre voie)
AM-5 | reste (écran Fermentescibles, autre voie ; le « AM 5 » de `batchAm4Am5` est un autre défaut, déjà corrigé en 7632c3a7)
AM-40 | corrigé (d3c7fb73) : densité 0,990–1,200 (`gravityBounds`), température −5 à 45 °C ; test `batchFollowUp`
AM-41 | corrigé (5195a6b2) : pH 3–9, température −5–105 °C, volume ≤ 2 000 L, densité = `gravityBounds` ; test `brewDayBornes`
AM-42 | corrigé (5195a6b2) : alerte volume > cuve ou fermenteur de l'installation ; test `brewDayBornes`
AM-43 | corrigé (5195a6b2, 26e97f47) : alerte > 30 °C à l'ensemencement, borne 105 °C, champ « Moût à l'ajout de levure » borné à 45 °C
AM-46 | corrigé (bac64fca) : alerte « Fermenteur occupé » (non bloquante : un second fermenteur est possible, l'app n'en modélise qu'un) ; test `batchDefautsB`
AM-44 | déjà corrigé : la confirmation dit « OG inconnue · volume en fermenteur inconnu » et rien n'est écrit à 0 ; preuve `brewDayWorkflow.test.tsx:292`
TE-40 | corrigé (cc57c1b0) : note neutre quand une date réelle est connue ; test `batchDefautsB`
TE-43 | déjà corrigé (a0e4f4f3, RJ-1) ; preuve `tests/unit/boutonConduiteClair.test.ts`
TE-44 | corrigé en partie (f15d3b34) : l'aide du volume vient de la cible de l'étape, plus de « 25 » ; la tuile « pH 7 » non reproduite (le code n'affiche qu'un relevé enregistré)
TE-35 | reste (écran Finances, `UpgradeSheet`, autre voie)
TE-36 | reste (écran Finances, `UpgradeWorkspace`, autre voie)
PD-2 | reste (écran Fermentescibles, autre voie)
PD-3 | corrigé (d3c7fb73) : brassin planifié sans date visible sous toute période ; test `productionCatalog`
PD-6 | déjà corrigé (7632c3a7, `densityAxisDomain`) ; preuve `batchAbvOgConfirmee.test.tsx`
PD-7 | corrigé (d3c7fb73), même cause que PD-3
PD-11 | corrigé (6171bb9c) : « actuellement « Planifié » » avec espaces insécables
PD-12 | corrigé (6171bb9c) : `ConfirmSheet` borné à 36 rem et centré au bureau ; à vérifier par capture 1280
RJ-13 | corrigé (6171bb9c), même cause que PD-12
BR-29 | corrigé (f15d3b34) : densités écrites 1,069 (fonction `sg`) au jour de brassage, au journal, au résumé
BR-49 | corrigé (5195a6b2) : « Terminer et continuer » idempotent ; test rouge sur l'ancienne logique puis vert (`brewDayDefautsB`)
BR-50 | corrigé (cc57c1b0) : bornes `brewQuantityBounds` (5 × prévu, plancher par unité) avec message
BR-52 | corrigé (cc57c1b0) : plus de liste vide, une phrase à la place (à confirmer par le brasseur)
BR-53 | corrigé (cc57c1b0) : « -1 » refusé avec message ; test `brewDayQuantitesB`
BR-54 | corrigé (cc57c1b0) : quantités à la résolution de la balance (`functions/src/brewAmount.ts`)
BR-55 | corrigé (cc57c1b0) : alarme « 123 g Lactose » ; test `brewDayQuantitesB`
BR-56 | corrigé (26e97f47) : virgule dans l'en-tête, les consignes, les paliers ; test `brewDayDefautsB`
BR-57 | corrigé (50d5015c) : étiquette neutre en texte courant au clair (≥ 9:1) ; les autres tons gardent leurs jetons `-texte`
BR-58 | corrigé (50d5015c) : onglet de mesure choisi : bordure pleine, gras, souligné, sans dépendre de la teinte
BR-59 | corrigé (50d5015c) : liens du jour de brassage à 24 px de haut au moins
BR-61 | corrigé (6171bb9c) : liseré de la couleur du fond sur l'étiquette de consigne ; à vérifier par capture
BR-112 | reste (champ de volume du brassin : `BrewWizard`, fichier d'une autre voie)
BR-118 | déjà corrigé (7632c3a7) : « -1 » refusé avec message ; preuve `batchAm4Am5` RJ-2
BR-119 | corrigé (6171bb9c) : rangée des filtres sur plusieurs lignes dès 1024 px ; cause exacte du « Te » coupé non vue sans rendu
BR-120 | corrigé en partie (50d5015c) : pastille « Terminé » (#666/#ddd) ; le 4,14–4,32:1 du thème cave (bleu eau, cuivre, alerte sur teinte) reste, jetons de couleur d'une autre voie
BR-121 | corrigé (d3c7fb73) : dates ISO écrites jj.mm.aaaa dans la courbe et la carte ; test `fermentationReadings`
BR-122 | corrigé (cc57c1b0) : jour brassé futur refusé avec message ; test `batchDefautsB` (à confirmer par le brasseur)
BE-30 | corrigé (5195a6b2), voir BR-49
BE-31 | corrigé (cc57c1b0), voir BR-50
BE-33 | corrigé (cc57c1b0), voir BR-52
BE-34 | corrigé (cc57c1b0), voir BR-53
BE-35 | corrigé (cc57c1b0), voir BR-54
BE-36 | corrigé (cc57c1b0), voir BR-55
BE-38 | corrigé (50d5015c), voir BR-57 (le texte du bouton doré 4,27:1 au 1280 n'est pas traité)
BE-39 | corrigé (50d5015c), voir BR-58
BE-40 | corrigé (50d5015c), voir BR-59
BE-44 | déjà corrigé, voir BR-118
BE-45 | corrigé (6171bb9c), voir BR-119
BE-46 | corrigé en partie (50d5015c), voir BR-120
BE-47 | corrigé (d3c7fb73), voir BR-121
BE-48 | corrigé (cc57c1b0), voir BR-122
BE-76 | reste (fût : `KegSheet`, fichier hors voie)
BE-82 | reste (écran Impôt, hors voie)
BE-83 | reste (écran Matériel, hors voie)
GE-NOTE-3 | reste (preuve Chrome d'un brassin planifié ou en fermentation : pas de serveur de dev par Bash)

## Décomptes
déjà corrigés : 6 (TE-43, PD-6, BR-118, BE-44, AM-44 et la moitié de TE-44 compte en « corrigé »)
goût : 0 (BR-52 et BR-122 portent « à confirmer » du registre, corrigés dans le sens prudent)
restent : TE-17, AM-5, PD-2, TE-35, TE-36, BR-112, BE-76, BE-82, BE-83, GE-NOTE-3, et la part cave de BR-120/BE-46

## Doutes
- Bornes de saisie (pH 3–9, température −5 à 105 °C, volume 2 000 L, quantité ≤ 5 × prévu avec plancher) : estimées, pas tirées d'une source ; chacune dit son raisonnement dans son commentaire. Le brasseur peut les resserrer.
- AM-46 : alerte seulement, pas de refus : l'app ne connaît qu'un fermenteur par installation.
- CONNAISSANCE : un composant partagé (`Sheet`, `ConfirmSheet`) fixé en bas et sans largeur max s'étale à 1280 : borner chaque feuille au bureau se règle dans le composant, pas dans chaque écran.
- LEÇON PROPOSÉE : un double toucher se teste en un seul `act()` avec deux clics sur le même nœud (même fermeture) ; deux `fireEvent.click` successifs re-rendent entre les deux et ne reproduisent pas le défaut.
