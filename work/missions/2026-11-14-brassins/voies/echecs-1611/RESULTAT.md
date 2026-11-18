OK — 14 échecs neufs expliqués : 1 poste (jonction), 1 délai du fuzz relevé, 12 charge ; plein vitest : 0 neuf chez nous.

Base : `vt-tagfm.json` (tag `en-ligne/2026-11-16-finances-mineurs`, worktree tag-fm) : 1430 fichiers, 20 tests en échec, 67 fichiers en échec.
Chez nous, rejeu final `vt-fix.json` (HEAD + fix) : 1432 fichiers (les deux tests neufs de 0fac8a20 et 348ec30b), 16 tests en échec, 62 fichiers en échec, **0 fichier en échec chez nous sans l'être au tag** (`cmp2.cjs`). 5 fichiers échouent au tag seul (backupPanel, brewEquipment, settingsIban, factureQr, enrichir/learn : charge, passent chez nous).
`npx tsc --noEmit` : 0 erreur. `npm run build` : vert (✓ built in 33 s, DRAPEAUX OK).

Le diff tag → HEAD est petit : types du serveur sortis dans `brewerCatalogueTypes.ts` / `brewerScenarioTypes.ts` (0fac8a20), titres de mois et « 1 jour » de `FeuilleBrasser.tsx` (348ec30b), deux tests. Aucun de ces fichiers n'est lu par les 14 tests en échec : la cause n'était pas dans le code.

Les 14 fichiers, joués seuls des deux côtés (`vt-us14.json`, `vt-tag14.json`) :
- tests/unit/depense/loupe.test.tsx — cause : poste. `node_modules/react-zoom-pan-pinch` de notre worktree était une jonction (10.11) vers le `node_modules` du worktree jolly-mahavira-cc0cc2 : le paquet y charge sa propre copie de React → « Cannot read properties of null (reading 'useRef') ». Rouge chez nous seul (2 tests), vert au tag. Correction : jonction renommée en `node_modules/_junction-zoom-1611` (rien supprimé, dossier ignoré par Git) ; le paquet se résout désormais dans `Brasserie/node_modules`. Vert seul et dans le plein.
- tests/integration/fuzzSaisie.test.tsx — cause : délai. Le test « aucune étape ne fait apparaître NaN… » dure 28 s au repos (tag : 27,5 à 30,5 s) pour un délai de 30 s ; échoué à 31 s sous charge, vert seul deux fois chez nous. Correction : délai relevé à 120 000 ms (le fuzz des champs, ligne 129, a déjà 120 000). Intention gardée : aucune assertion changée.
- tests/integration/fix114.test.tsx — cause : ordre/état, des deux côtés. Rouge seul au tag comme chez nous (« Facture : une seule fois dans le menu », 2 au lieu de 1) ; vert dans le plein vitest au tag comme chez nous. Non lié à nos ports. Non corrigé (hors périmètre, identique des deux côtés) ; à verser aux bugs si le brasseur veut le rejouer seul.
- Charge seule (verts seuls des deux côtés, même durée) : hopV55PagePropertyAdvice, V3, V4, hopV55PageQualifiedAdviceFullCatalogue (162 à 173 s), hopV55RecipeColdContactWorkbench, hopV55RecipeCopyPanel, monkey, noloWizardApply, ouvertureArchiveVolume, yeastCandidateWizardPersistence, YeastRecipeWorkbench, brewForecast. Le plein `vt-am.json` avait été joué avec d'autres sessions actives ; rien à corriger.

Fichier écrit : `tests/integration/fuzzSaisie.test.tsx` (une ligne). Hors dépôt : la jonction renommée.
Essais : 1 par critère. Worktree tag-fm supprimé en fin de voie.

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : une jonction de `node_modules` vers un autre worktree double React et fait échouer les tests d'un paquet à hooks ; `node -e "console.log(require.resolve('<paquet>'))"` la révèle.
LEÇON PROPOSÉE : aucune.
