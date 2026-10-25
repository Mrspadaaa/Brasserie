# Voie t6a-ecriture — Conversion de recette et une seule porte d'écriture (#165, partie a)

- Mission : 2026-10-25-integration-houblons
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 80 tours ; 3 essais par critère
- Dépend de : t3-pile, t4-moteur, t5-causes (faites)
- Décideur en cas de doute : pilote

## Objectif
Verdict D65, § Recommandation 1 : les outils v4 écrivent par **une seule porte**.
1. `prototypes/houblons-v4/parcours/src/integration/conversion.ts` déménage (`git mv`) en `src/domain/hopIndex/v4/recipeConversion.ts` :
   `toHopRecipe(recipe)` et son patch inverse. Une seule copie ; ses deux tests (`conversion-recette`, `houblon-inconnu`) importent de là.
2. `applyHopV4Change` dans `src/pages/BrewWizard.tsx`, calquée sur `applyHopV55Change` (lignes 1410-1437 : contrôles `draftReadOnly`
   et `draftId`, puis `writeRecipeDraft` comme point de validation) ; la même règle, pure et testée, dans
   `src/domain/hopIndex/v4/recipeConversion.ts` (`appliquerPatchHoublons(recipe, patch)`).
3. Le patch ne touche que `hops` (et `yeast` si l'outil Levure le demande) ; il **garde** `hopV55Applications`,
   `hopV55ColdEvidenceAssociations`, `stockItemRef`, `hopLotId` et l'α du lot, et ne perd rien d'un houblon remplacé sans le dire.
4. Pour `RecipePage` (recette enregistrée) : la même fonction pure produit la recette à passer à `saveRecipeConfirmed` ; le
   branchement de l'écran vient avec T12/T13 (rien de visible ici).

## Entrées
- `cerveau/decisions/2026-10-25-integration-architecture.md` § Recommandation 1 et 4 ; `ETAT-DES-LIEUX.md` R6, R7.
- `prototypes/houblons-v4/parcours/src/integration/conversion.ts`, `prototypes/houblons-v4/parcours/ARCHITECTURE.md` § Conversion de recette.
- `src/pages/BrewWizard.tsx` (1410-1437, 2705-2720), `src/services/recipeDraft.ts`, `src/types` (`Recipe`), les recettes de fixture de `tests/fixtures/`.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `src/domain/hopIndex/v4/recipeConversion.ts` (neuf, par déplacement), `prototypes/houblons-v4/parcours/src/integration/conversion.ts` (en sort)
- les deux tests qui l'importent (`prototypes/houblons-v4/tests/conversion-recette.test.ts`, `houblon-inconnu.test.ts`) : chemins d'import
- `src/pages/BrewWizard.tsx` : `applyHopV4Change` seulement, rien de visible
- `tests/unit/hopIndexV4/` (neuf)
- `work/missions/2026-10-25-integration-houblons/voies/t6a-ecriture/`
Une autre voie (t6b-async) modifie en même temps `prototypes/houblons-v4/parcours/src/moteur/`, `…/ecrans/` et `src/domain/hopIndex/v4/client.ts` :
n'y touche pas. Si un écran importe la conversion, dis-le dans RESULTAT.md au lieu de le modifier.

## Consignes
1. Écris d'abord les tests (L13) et montre-les rouges sur HEAD : conversion sur les 4 recettes de fixture ; aller-retour qui garde
   `hopV55Applications` et `hopV55ColdEvidenceAssociations` ; un test qui alterne v4 et V5.5 sur la même recette (un
   `hopV55Applications` survit-il au remplacement de sa ligne ? dis-le) ; `applyHopV4Change` refuse un brouillon en lecture seule.
2. Aucune donnée réelle ; Gemini jamais ; `functions/` intact ; rien de visible dans l'app (drapeau `hopV4` éteint).

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Une seule porte d'écriture (plainte D139 : « un choix sur un endroit, semble pas toujours être reporté partout ») ; hors ligne et données préservés.
- L'inconnu n'est jamais 0 ; rien de supprimé.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` au format de l'agent, avec `## Témoin` (tests rouges sur HEAD). Écris-le tôt ; garde 15 tours pour les critères. Réponse finale : une ligne.
