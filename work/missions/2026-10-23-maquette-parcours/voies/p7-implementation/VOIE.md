# Voie p7-implementation — la maquette est-elle prête à porter dans l'app ?

- Mission : 2026-10-23-maquette-parcours (lire `../../MISSION.md` d'abord : l'objectif et ce que « préparer la vraie
  implémentation » veut dire)
- Agent : relecteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 60 tours
- Dépend de : p1-ma-biere, p2-suggerer, p3-comparer, p4-dryhopper
- Décideur en cas de doute : pilote

## Objectif
Une relecture indépendante, en lecture seule. La question vient de l'utilisateur : « que c'est facile après pour
l'implémentation ». Il s'agit de dire, preuves à l'appui (fichier et ligne), ce qu'il faudra faire pour porter
`prototypes/houblons-v4/parcours/` dans l'app (`src/`). Ne pas croire `ARCHITECTURE.md` sur parole : le
confronter au code de la maquette et au code de l'app.

## Entrées
- `prototypes/houblons-v4/parcours/ARCHITECTURE.md` : ce que le socle affirme.
- Le code de la maquette : `prototypes/houblons-v4/parcours/src/` (`etat/`, `moteur/`, `coquille/`, `commun/`,
  `donnees/`, `ecrans/*/`), `vite.config.ts`, `outils/`.
- Le moteur v4 : `prototypes/houblons-v4/src/engine/` et `prototypes/houblons-v4/ENGINE.md` (il importe le moteur
  V5.5 de l'app).
- L'app :
  - pages : `src/pages/RecipePage.tsx`, `src/pages/useFullScreenRoute.ts`, `src/pages/PageShell.tsx` ;
  - type de recette : `src/types/index.ts` (interface `Recipe`) ;
  - domaine : `src/domain/hopIndex/` ;
  - persistance : `src/services/` (Dexie, Firestore, `hopDecisionLocalRepository.ts`) ;
  - composants : `src/ui/`.
- `CLAUDE.md` (sections Vérifications et sorties), `DESIGN.md`, `.claude/rules/affinee-frontend.md`.

## Possède (seuls chemins où écrire)
- `work/missions/2026-10-23-maquette-parcours/voies/p7-implementation/RESULTAT.md`

## Consignes
1. Pour chaque zone, donner un verdict : **prêt à déplacer**, **à adapter** (dire quoi) ou **à refaire** (dire
   pourquoi). Les zones :
   - état et réducteur ;
   - adaptateur du moteur ;
   - moteur v4 (sa place, ses imports de l'app) ;
   - routes et coquille ;
   - composants communs ;
   - chacun des sept écrans ;
   - données du cas ;
   - styles et thèmes ;
   - outils de test.
2. Le **type de recette** : le `Recipe` du moteur contre le `Recipe` de l'app. Combien de champs se correspondent,
   lesquels manquent, et qui convertit ?
3. Ce qui n'est que de la maquette et ne doit pas entrer dans l'app :
   - `window.__parcours` ;
   - les marqueurs `data-*` des contrôles ;
   - les ponts provisoires ;
   - les contournements de `Sheet` et de `PageShell` ;
   - les instantanés figés (`cas-direct.json`).
   Les compter et dire comment les isoler.
4. **Persistance et données réelles** : ce qui manque pour que la recette vienne de Dexie et de Firestore, avec le
   stock réel et le catalogue de production (12 variétés, #120).
5. **Performance au téléphone** : les temps mesurés (RESULTAT de p0 à p4). Dire ce qui devrait quitter le fil
   principal.
6. **Tests** : ce qui se porte en Vitest, et ce qui reste un parcours dans Chrome (`jouer-parcours.mjs`,
   `parcours-complet.mjs`).
7. Les **bloquants**, classés par gravité, et une estimation d'effort par zone : petite, moyenne ou grande, avec
   la raison.
8. Rien n'est modifié. Un défaut est rapporté avec son fichier et sa ligne.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier.

## Rendre
`RESULTAT.md` :
- première ligne : verdict global (« PRÊT », « PRÊT AVEC RÉSERVES » ou « PAS PRÊT ») et la raison principale ;
- puis les sections `## Zones`, `## Recette : types`, `## Maquette seulement`, `## Persistance`, `## Performance`,
  `## Tests`, `## Bloquants` et `## Effort`.

Réponse finale au pilote : une ligne.
