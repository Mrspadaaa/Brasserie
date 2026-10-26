# Voie t12-ma-biere — L'étape Houblons de l'app devient sa maquette choisie, sous drapeau (#170)

- Mission : 2026-10-25-integration-houblons
- Agent : concepteur
- Modèle : opus
- Niveau : conception (ce que le brasseur verra)
- Plafond : 80 tours ; 3 essais par critère
- Dépend de : t3-pile, t6a, t6b, t8, t9, t11, t14, t7-worker
- Décideur en cas de doute : pilote ; le goût revient au brasseur

## Objectif
Règle n° 1 : « C'est critique que mes choix soient respectés. SI non, rien n'a de valeur. » L'étape 3 « Houblons » du `BrewWizard`, drapeau
`hopV4` allumé, rend **son écran choisi** (`etape-houblons` dans `work/refonte-frontend/v4/choix/ecrans.json` : la base v4.10, son rail tel
quel, ses cartes, la légende v2a avec les barres de v2e (D140), les ajouts proposés) **par le même code que la maquette** : l'écran
`prototypes/houblons-v4/parcours/src/ecrans/ma-biere/` déménage (`git mv`) dans `src/ui/hopIndex/` (une seule copie, comme T4 et T11),
la maquette l'importe de là. Drapeau éteint (défaut) : l'étape reste l'atelier V5.5, rien ne change.

## Entrées
- `work/refonte-frontend/v4/choix/ecrans.json` (`etape-houblons`, ses compléments et contrôles) ; `work/refonte-frontend/v4/SPEC-BRASSEUR.md` (§ 0 et la légende).
- `prototypes/houblons-v4/parcours/ARCHITECTURE.md` (§ Fichiers, § Navigation, § Conversion) ; `prototypes/houblons-v4/parcours/src/ecrans/ma-biere/` et `ecrans/biere/`.
- `src/pages/BrewWizard.tsx` (étape 3, `applyHopV4Change` de T6a, l'atelier V5.5 lignes ~2705-2720), `src/ui/hopIndex/` (`useHopData`, `outils.ts`,
  `precharge.ts`, `HopToolLayer.tsx`, `flags.ts`, `devHook.ts`, les composants de T11), `src/domain/hopIndex/v4/` (`recipeConversion.ts`, `client.ts`).
- Les commentaires de #170 (`gh issue view 170 --repo Mrspadaaa/Brasserie --comments`) : le repli Suspense ne doit pas montrer un état
  d'attente absent de ses maquettes.
- `.claude/rules/affinee-frontend.md`, `DESIGN.md`, `docs/ui-compacte.md` (lecture une fois).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `src/ui/hopIndex/` (l'écran déménagé et son hôte), `src/pages/BrewWizard.tsx` (l'étape 3 derrière le drapeau seulement)
- `prototypes/houblons-v4/parcours/src/ecrans/ma-biere/` et `ecrans/biere/` (en sortent), `prototypes/houblons-v4/parcours/src/**` (chemins d'import)
- `work/refonte-frontend/v4/tournoi/outils/` (les chemins d'import et les repères `data-*` lus par les contrôles de l'étape, si l'app les demande)
- `tests/unit/hopIndexV4/`, `tests/integration/` (tests neufs de l'étape sous drapeau)
- `prototypes/houblons-v4/maquettes/parcours/` (construction)
- `work/missions/2026-10-25-integration-houblons/voies/t12-ma-biere/`

## Consignes
1. Avant de toucher : captures de référence de chaque état de l'étape dans la maquette (`controle-etats.mjs … --ecran=etape` liste les
   états), et de l'étape actuelle de l'app (V5.5) dans Chrome.
2. Le même code pour la maquette et l'app ; dans l'app, les données viennent de `useHopData` (stock, dégustation) et de la recette du
   brouillon (`toHopRecipe`), les écritures passent par `applyHopV4Change`. Les outils (Suggérer, Comparer…) s'ouvrent par la pile ; ils
   tombent sur la couche provisoire tant que T13/T15 ne sont pas faits.
3. Aucun état d'attente visible : si le chunk des outils n'est pas prêt, l'étape garde l'écran précédent ou rend l'étape déjà lue ; pas de
   roue, pas de « chargement ».
4. Joue dans Chrome sur l'app (`?dev-local`, fixture, drapeau allumé) : chaque état de l'étape, côte à côte avec la même capture de la
   maquette ; le glisser du rail (loupe ×3 sous le doigt) ; la sortie du rail. Ouvre chaque capture (L12).
5. Rejoue la maquette (batterie 46/46, états 141/141), `controle-choix.mjs --url=<l'app servie>` sur `etape-houblons` si les repères le
   permettent (sinon dis précisément ce qui manque), `npm run build` (démarrage ≤ 919 ko), `npm test -- tests/integration` ciblé.
6. Gemini jamais ; aucune donnée réelle ; `functions/` intact.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Règle n° 1 ; L03 : sa maquette choisie telle quelle, inventaire et captures côte à côte de chaque état, gestes compris.
- Un composant de l'app réemployé apporte ses boutons (L26) ; préfixe des classes ; aucune régression de ses retours (D134 sortie du rail ≤ 50 ms).
- Peu de texte au premier plan, l'inconnu jamais 0, penser en brasseur (nom, α, rôle, arômes, moment et dose, puis IBU).

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` au format de l'agent, avec `## Côte à côte` (pour chaque état : capture maquette, capture app, entre accents graves) et
`## Écarts` (tout écart visible, même petit). Écris-le tôt ; garde 15 tours pour les critères. Réponse finale au pilote : une ligne.
