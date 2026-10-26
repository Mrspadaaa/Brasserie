# Voie t3-pile — Pile de routes dans l'app : l'étape Houblons reste montée sous les outils (#162)

- Mission : 2026-10-25-integration-houblons
- Agent : auteur
- Modèle : opus (la voie fixe la navigation que tous les écrans suivront)
- Niveau : conception d'architecture
- Plafond : 90 tours ; 3 essais par critère
- Dépend de : t1-branche-verte
- Décideur en cas de doute : pilote

## Objectif
Verdict du conseil (D65, `cerveau/decisions/2026-10-25-integration-architecture.md`, § Recommandation 1) : une pile de routes dans
`App`, qui étend le retour `hopV55` (un niveau) à quatre niveaux. Le wizard reste **monté** sous les outils : au retour, même
instance, même étape, brouillon intact, jamais `DraftFreshnessChoice`. `RecipePage` ouvre les outils par la même pile. Aucun
changement visible pour l'utilisateur tant que le drapeau des outils v4 est éteint (défaut).

## Entrées
- `src/pages/useFullScreenRoute.ts` (73 lignes) et ses appels dans `src/App.tsx` (rendu d'une vue à la fois, wizard vers la ligne 971).
- `prototypes/houblons-v4/parcours/src/coquille/useFullScreenRoute.ts` (139 lignes : la pile, `open`, `close`, `closeTo`,
  `replaceTop`, même API) et `prototypes/houblons-v4/parcours/ARCHITECTURE.md` § Navigation (routes `hopBeer`, `hopSuggest`,
  `hopCompare`, `hopTiming`, `hopSubstitute` à ajouter au type `Route`).
- `src/pages/BrewWizard.tsx` (lignes 462-470 `readRecipeDraftState`, `DraftFreshnessChoice` vers 466 ; 1410-1437 `applyHopV55Change`),
  `src/services/recipeDraft.ts`, `src/pages/RecipePage.tsx`.
- `tests/integration/AppQuickActionReturn.behavior.test.tsx`, `tests/integration/fix114.test.tsx` (retours existants).
- `work/missions/2026-10-25-integration-houblons/voies/t1-branche-verte/RESULTAT.md` (parcours joué, reste : `DraftFreshnessChoice`
  sur une recette enregistrée).
- `cerveau/agents/verification-locale.md` (app locale `?dev-local`).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `src/pages/useFullScreenRoute.ts`, `src/App.tsx`
- `src/ui/hopIndex/devHook.ts` (neuf, derrière `import.meta.env.DEV`) et un écran d'outil provisoire `src/ui/hopIndex/HopToolLayer.tsx`
  (neuf, vide de contenu métier, atteint seulement par le crochet de développement tant que le drapeau est éteint)
- `src/ui/hopIndex/flags.ts` (neuf : le drapeau `hopV4`, éteint par défaut ; l'app n'a pas de module de drapeaux)
- `tests/integration/` (tests neufs de la pile) ; `tests/unit/` pour le hook
- `work/missions/2026-10-25-integration-houblons/voies/t3-pile/` (RESULTAT.md, captures)

## Consignes
1. Lis d'abord les tests de retour existants et fais-les tourner avant de toucher au code (L13 : un critère rouge sur HEAD le dit).
2. Porte la pile de la maquette dans `src/pages/useFullScreenRoute.ts`, même API (`route`, `open`, `close`) plus `pile`,
   `closeTo`, `replaceTop`. Le retour `hopV55` devient un cas de la pile. Les retours existants ne changent pas.
3. `App.tsx` rend la vue de base (wizard, recette, onglets) **et** les couches d'outils au-dessus, sans démonter la base (par
   exemple la base cachée sous la couche, `inert`). Une seule source de vérité du brouillon : celle du wizard (`writeRecipeDraft`).
4. Tests : une pile à quatre niveaux, retour niveau par niveau ; le wizard garde son instance et son étape (preuve : un état local
   conservé, pas de nouveau `readRecipeDraftState`) ; `RecipePage` → outil → retour ; et le cas `DraftFreshnessChoice` sur une
   recette enregistrée avec une fixture (il ne doit pas apparaître au retour d'un outil).
5. Parcours Chrome (app locale `?dev-local`) : les retours existants (recette, brassage, atelier V5.5) inchangés ; puis, par le
   crochet de développement, wizard → couche → couche → retour ×2 : même étape, brouillon intact. Captures ouvertes (L12).
6. Gemini jamais ; aucune donnée réelle ; ne touche pas aux écrans de la maquette ni au moteur.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Hors ligne et données préservés ; une seule porte d'écriture (plainte D139 : « un choix sur un endroit, semble pas toujours être reporté partout »).
- Fini veut dire branché, joué dans Chrome, typé, testé, build vert (L11).
- Budget : ouvrir une couche ≤ 100 ms (×4) ; mesure dans RESULTAT.md.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` au format de l'agent, avec `## Parcours Chrome` (captures citées en chemins entre accents graves). Réponse finale au pilote : une ligne.
