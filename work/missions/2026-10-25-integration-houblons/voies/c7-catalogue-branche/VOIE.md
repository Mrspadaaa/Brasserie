# Voie c7-catalogue-branche : les 188 variétés ajoutées, visibles et utilisables dans l'app, sans délai

Agent : auteur (Sonnet). Code de l'app. La voie s'arrête au code, aux tests, au build, aux mesures et à deux captures.

## Pourquoi
La voie c6 (`voies/c6-catalogue-complet/RESULTAT.md`, commit 846b76aa) a ajouté 188 variétés dans `src/data/hopV4/catalogue-ajouts.json`
(Krush, Dolcita, Elani, Superdelic…). Elles se chargent à la demande, par `chargerCataloguePlein` dans `src/domain/hopIndex/v4/data.ts`.
Mais **aucun écran ne les charge** (RESULTAT de c6, l. 60 et 72). Elles ne servent donc à rien (L11 : fini veut dire utilisable).

Ses mots :
- « Il doit manquer quelques houblons aussi... » ;
- « Il faut tout mettre ?? Pas exclure certains ?? » ;
- « Attention au délais ajouter, la Responsive, réactivité » ;
- « Il faudrait pas que l'algo trie trop ou exclue trop tôt des potentiels candidats surtout ».

## À faire
1. **Le chargement.** Le catalogue plein se charge après le premier rendu de l'étape Houblons, au repos (comme `src/ui/hopIndex/precharge.ts`)
   ou dans le worker des calculs. Il ne doit jamais retarder le premier écran.
2. **Les lecteurs.**
   - La recherche et l'ajout d'un houblon : `maBiere/Ajouter.tsx` et la fiche.
   - Les candidats de Substituer, de Suggérer (« à acheter ») et de Comparer.
   - La fiche d'une variété ajoutée s'ouvre.
   - Une variété `peuDeDonnees` porte une marque discrète (« peu de données »). À égalité, elle ne passe jamais devant une variété
     documentée (D175). Cette protection existe dans `substitutes` : étends-la à `voies.ts`, `hops.ts` et `quickAdd.ts` (RESULTAT de c6,
     l. 72).
3. **L'origine non répertoriée** : le champ `origineNonRepertoriee` de c6 s'affiche par un astérisque sur la carte et la fiche. Au toucher :
   « fiche de Cascade (US) ; origine CHE non répertoriée » (règle du 26.10, #187).
4. **Le hors ligne** tient : le catalogue plein est mis en cache comme le reste.

## Mesures (critère bloquant)
`npm run check:hop-perf`, avant et après. Six budgets sont déjà dépassés avant ta voie (tableau de c6) : aucun ne doit régresser au-delà du
bruit. Chronomètre aussi le premier écran de l'étape Houblons, à froid, au processeur ×4. Écris un tableau avant/après dans RESULTAT.md.

## Tests et contrôle
- Un test : Krush se trouve à la recherche, s'ajoute, et apparaît parmi les candidats de Substituer pour un houblon voisin.
- Un test : une variété `peuDeDonnees` ne passe jamais devant une variété documentée à égalité, dans Suggérer.
- Un test : l'astérisque de Cascade CHE.
- Lance `npx vitest run tests/unit/hopIndexV4 prototypes/houblons-v4/tests`, puis `npm run build`. Lance aussi
  `node scripts/check-hop-budget.mjs --dist dist --chunk-outils profil-simule`, build fait avec `VITE_HOP_V4=on` (B5 ≤ 160 ko).
- Prends deux captures en 390 × 844 et ouvre-les : la recherche qui trouve Krush, et l'astérisque. Pour la maquette et les états, écris
  une `DEMANDE EXECUTANT :` (voir ta définition d'agent).

## Possède
- `src/domain/hopIndex/v4/data.ts`, `hops.ts`, `quickAdd.ts` et `voies.ts`, seulement pour le tri `peuDeDonnees`.
- `src/ui/hopIndex/precharge.ts` et `src/ui/hopIndex/maBiere/Ajouter.tsx`.
- `src/ui/hopIndex/fiche/` : la marque et l'astérisque.
- `maBiere/Carte.tsx` : l'astérisque.
- Les tests neufs.
- `work/missions/2026-10-25-integration-houblons/voies/c7-catalogue-branche/`.

La voie p6 écrit dans `src/ui/hopIndex/biere/` et `HopToolLayer.tsx` : n'y touche pas. N'écris aucun code par heredoc ni par `node -e`.
Pas de `git stash`. Écris RESULTAT.md tôt. Rends une ligne.
