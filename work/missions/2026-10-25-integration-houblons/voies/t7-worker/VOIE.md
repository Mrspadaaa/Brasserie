# Voie t7-worker — Un worker persistant sert les calculs lourds, sans état d'attente visible (#171)

- Mission : 2026-10-25-integration-houblons
- Agent : auteur
- Modèle : opus (fixe comment l'app calcule hors du fil principal)
- Niveau : conception d'architecture
- Plafond : 80 tours ; 3 essais par critère
- Dépend de : t6b-async, t17-banc, t5b-voies, t11-communs
- Décideur en cas de doute : pilote

## Objectif
Le banc bloquant (#166, après T5b) mesure encore, sur ce PC : ouvrir Suggérer sans préchauffage ≈ 205 ms (budget 25), tranche de
préchauffage des voies ≈ 345 ms (budget 50 par tranche) : ce sont des appels synchrones uniques, que seul un worker sort du fil principal.
Un **worker persistant** (`src/ui/hopIndex/hopTools.worker.ts`, un seul pour la session, alimenté une fois par les données du moteur)
sert le contrat de messages de `src/domain/hopIndex/v4/client.ts` (T6b) ; les écrans ne changent pas. `lireBiere` reste synchrone.

## Entrées
- `src/domain/hopIndex/v4/client.ts` (contrat), `src/domain/hopIndex/v4/moteur.ts` (fabrique, empreinte de T8), `src/ui/hopIndex/` (`outils.ts`,
  `precharge.ts`, `useHopData.ts`), `prototypes/houblons-v4/parcours/src/moteur/` (adaptateur, préchauffage).
- Le précédent de l'app : `src/ui/hopIndex/hopSolver.worker.ts`, `hopSolverMessages.ts`, `hopSolverTransport.ts`.
- **Les contraintes écrites dans #171** (`gh issue view 171 --repo Mrspadaaa/Brasserie --comments`) : aucun état d'attente visible sans son
  choix ; préchauffer par le client ce qu'un toucher ouvre (option a), et en repli servir ces premières ouvertures sur le fil principal (b) ;
  chaque écran joué en mode différé et en mode immédiat, captures comparées (`?calcul=differe`).
- `work/refonte-frontend/v4/tournoi/outils/mesure-performance.mjs` (navigateur, ×4) ; `work/refonte-frontend/v4/tournoi/outils/servir.mjs` (T14).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `src/ui/hopIndex/hopTools.worker.ts` (neuf), `src/ui/hopIndex/hopToolsTransport.ts` (neuf), `src/domain/hopIndex/v4/client.ts`
- `prototypes/houblons-v4/parcours/src/moteur/` (le branchement du client et le préchauffage), `prototypes/houblons-v4/parcours/src/coquille/` (le préchauffage seulement)
- `prototypes/houblons-v4/tests/`, `tests/unit/hopIndexV4/` (tests neufs du transport)
- `prototypes/houblons-v4/maquettes/parcours/` (construction)
- `work/missions/2026-10-25-integration-houblons/voies/t7-worker/`

## Consignes
1. Mesure d'abord dans Chrome, sur la maquette **servie par HTTP** (`servir.mjs` ; un worker de module ne démarre pas depuis `file://`) :
   `mesure-performance.mjs … --cpu=4` sur Ma bière → Suggérer et Ma bière → Substituer ; note-les (`## Mesures avant`).
2. Si le worker ne peut pas démarrer (page `file://`, navigateur sans worker de module), le client sert le fil principal comme
   aujourd'hui (repli b) : la maquette construite pour `file://` et ses contrôles restent verts.
3. Rien de visible ne change : ni roue, ni « chargement », ni écran vide ; une réponse périmée est ignorée. Joue chaque écran en mode
   immédiat et en mode worker, captures côte à côte ouvertes (L12) ; un écran qui fixe son état initial depuis un calcul (`useState(defauts)`)
   est le piège connu.
4. Mesure après, mêmes commandes (`## Mesures après`) : toucher Ma bière → Suggérer ≤ 100 ms ×4 ; aucune tâche > 50 ms pendant un glisser.
5. Rejoue la batterie (46/46) et les états (141/141), puis `npm run build` (démarrage ≤ 919 ko). Gemini jamais ; `functions/` intact.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Règle n° 1 : aucun état d'attente ajouté sans son choix ; ses écrans rendus à l'identique.
- Réactivité (D134, D138) ; mesurer avant d'affirmer (L20).

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` au format de l'agent, avec `## Mesures avant`, `## Mesures après` (lignes de `mesure-performance.mjs`) et `## Captures`
(chemins entre accents graves). Écris-le tôt ; garde 15 tours pour les critères. Réponse finale au pilote : une ligne.
