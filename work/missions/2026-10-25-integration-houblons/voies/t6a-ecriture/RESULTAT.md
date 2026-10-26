OK — conversion déménagée dans src, applyHopV4Change par writeRecipeDraft, historique V5.5 gardé, 160 tests verts

## Fichiers écrits
- `src/domain/hopIndex/v4/recipeConversion.ts` : `git mv` de `prototypes/houblons-v4/parcours/src/integration/conversion.ts` (plus de copie au prototype). Importe seulement `src/` : plus d'import vers `moteur/donnees`, `etat/quand`, `etat/types`.
  - nouveau : `appliquerPatchHoublons(recette, patch)` (remplace `appliquerPatch`), `preparerEcritureHoublons({draftReadOnly, ownerKey, draftRecipeId, current, change})`, `ChangementHoublonsV4`, option `alphaDuStock` ;
  - notes du patch : un houblon remplacé ou retiré dit ce qu'il perd (stockItemRef, hopLotId, α) et, s'il y a des `hopV55Applications`, qu'elles sont gardées comme historique de l'ancienne ligne.
- `src/pages/BrewWizard.tsx` : `applyHopV4Change` seulement (+ un import). Rien de visible : aucun écran ne l'appelle encore.
- `prototypes/houblons-v4/tests/conversion-recette.test.ts`, `houblon-inconnu.test.ts` : chemin d'import.
- `tests/unit/hopIndexV4/recipeConversion.test.ts` (10 tests), `ecritureBrouillon.test.ts` (12 tests).

## Témoin (tests rouges sur HEAD 81ded807, avant tout code)
```
FAIL tests/unit/hopIndexV4/recipeConversion.test.ts   Cannot find module '../../../src/domain/hopIndex/v4/recipeConversion'
FAIL tests/unit/hopIndexV4/ecritureBrouillon.test.ts  Cannot find module '../../../src/domain/hopIndex/v4/recipeConversion'
FAIL prototypes/houblons-v4/tests/conversion-recette.test.ts  (idem, chemin d'import déplacé)
FAIL prototypes/houblons-v4/tests/houblon-inconnu.test.ts     (idem)
Test Files  4 failed (4)
```
Limite du témoin : le rouge vient du module absent, pas d'un comportement faux (le module n'existait pas). Les cas de comportement (notes d'un houblon remplacé, liens lâchés, refus) n'ont donc pas été vus rouges séparément ; ils ont été écrits avant le code.

## Critères
- G1 : `node …/verifier.mjs` → `tests : 160/160 verts` puis `ECRITURE OK` (1er essai après code).
- G2 : `npm run build` → `✓ built in 18.18s`, code de sortie 0. Démarrage inchangé : 919 ko gzip (`check-hop-budget`, même chiffre qu'avant ; B1/B2 restent DÉPASSÉS comme avant, sans progrès ni recul : 772 ko étape Houblons).
- En plus : `tsc --noEmit` sans sortie ; `brewWizardHopV55`, `brewWizardDraftFreshness`, `brewWizardHopV55FutureDraft` : 37/37 verts.
Essais : 1 par critère.

## Réponses demandées
- **Un `hopV55Applications` survit-il au remplacement de sa ligne ? Oui, intact** (même tableau, même objet) : v4 ne touche que `hops`. Mais la trace décrit une ligne qui n'existe plus : sa référence ne correspond plus aux houblons du brouillon (test : `hopDecisionReference` change). La garde `assertHopV55RecipeDraftApplicationTarget` ne concerne que l'application en cours : une nouvelle application V5.5 refait son aperçu, et s'ajoute à la suite (alternance v4 / V5.5 / v4 testée : `['v55-a','v55-b']`). Le patch le dit dans ses notes.
- **Ce que perd un houblon remplacé** : stockItemRef, hopLotId, α du lot (R7). Dit dans les notes. Un houblon retiré : idem (nouveau, il disparaissait sans mot). L'α d'un houblon remplacé est celui du stock si connu, sinon 0 écrit (convention de l'app : α ≤ 0 = inconnu), avec une note.

## Fait de plus que le contrat (à relire)
1. `preparerEcritureHoublons` (pure) porte les refus du wizard : `applyHopV4Change` ne contient que l'appel, la sérialisation, `writeRecipeDraft` et l'écran. Raison : le wizard ne se monte pas sans consommateur, donc la règle est testable sans lui. La fonction du wizard elle-même n'est testée que par lecture de source (ordre refus → commit → écran) ; pas jouée dans un wizard monté.
2. Elle lâche `hopPredictionIds` et `hopTrialId` quand des houblons changent (comme l'adaptateur J4 de V5.5 et `selectYeast`), et `yeastGuide`, `yeastDesign`, `hopMatrixId` quand la levure change. Le contrat dit « le patch ne touche que hops/yeast » : le patch, oui ; ces liens deviennent faux. À défaire d'un mot si le pilote veut les garder.

## Doutes et limites
- Le patch de levure est un `YeastSpec` minimal (`name`, `hopIndexId`) ; `applyHopV4Change` l'écrit par `setYeast` sans passer par `tryAdoptYeastDocumentary` ni les fiches candidates (comme le fait `selectYeast`). À traiter avec l'outil Levure (T12/T13).
- Pour `RecipePage` : `appliquerPatchHoublons(recette, patch)` rend la recette à passer à `saveRecipeConfirmed` ; rien n'est branché.
- Le démarrage ne grossit pas, mais `BrewWizard` importe maintenant `recipeConversion` (donc l'index v4) en statique ; il vit dans le chunk `BrewWizardEntry` (941 ko, 206 ko gzip, chargé à la demande). Non comparé octet à octet avec HEAD.
- Les données restent des fixtures ; aucune écriture de données réelles ; Gemini non utilisé ; `functions/` intact.

## Hors de ma propriété (à faire par qui les possède)
- Aucun écran n'importe la conversion (vérifié : seuls les deux tests l'importaient). `crochetTest.ts` non plus.
- `prototypes/houblons-v4/parcours/src/etat/types.ts` définit toujours `AjoutParcours` et `RecetteParcours` (copie structurelle de celles de `recipeConversion.ts`, identiques) ; `etat/quand.ts` a sa propre `classeEbullition`. Souhaitable : les réexporter depuis `recipeConversion.ts` (une copie). `tsc` passe tel quel.
- `prototypes/houblons-v4/parcours/ARCHITECTURE.md` § Conversion de recette cite encore l'ancien chemin et `appliquerPatch`.
- Fichiers de la voie t6b-async visibles dans `git status` (`moteur/`, `ecrans/`, `client.ts`) : pas à moi.

DÉCISION À PRENDRE : garder le lâcher des liens de prévision/essai (point 2) ? Options : (a) oui, comme V5.5 ; (b) non, les garder malgré des houblons changés. Recommandation : (a), un lien vers une prévision d'une autre recette est faux.
CONNAISSANCE : une application V5.5 est un enregistrement scellé (référence des houblons au moment de l'application) ; il survit à un changement v4 mais ne décrit plus le brouillon. Les liens de prévision (`hopPredictionIds`, `hopTrialId`) sont dans la recette ET dans `details`.
LEÇON PROPOSÉE : aucune
