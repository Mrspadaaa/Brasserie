# Voie t6b-async — Interface asynchrone des calculs lourds ; les écrans passent par l'adaptateur (#165, partie b)

- Mission : 2026-10-25-integration-houblons
- Agent : auteur
- Modèle : opus (l'interface fixe comment tous les écrans appellent le moteur, et ce qu'un worker remplacera)
- Niveau : conception d'architecture
- Plafond : 80 tours ; 3 essais par critère
- Dépend de : t5-causes (faite)
- Décideur en cas de doute : pilote

## Objectif
Verdict D65, § Recommandation 2, second temps : dès maintenant, les appels lourds (`proposer`, `suggerer`, `remplacants`,
`substitutes`, préchauffage) passent par une **interface asynchrone** `src/domain/hopIndex/v4/client.ts`, servie d'abord sur le fil
principal ; un worker persistant pourra la remplacer sans toucher aux écrans (T7, #171, seulement si le banc échoue). `lireBiere`
reste synchrone. Et (report de T5) : **aucun écran de la maquette n'importe plus le moteur par défaut** ; tous passent par `moteur()`
de l'adaptateur (`prototypes/houblons-v4/parcours/src/moteur/`), pour lire les données injectées et non les fixtures.

## Entrées
- `cerveau/decisions/2026-10-25-integration-architecture.md` § Recommandation 2 et § Angles morts (états d'attente) ;
  `work/missions/2026-10-25-integration-houblons/voies/t5-causes/RESULTAT.md` (fabrique, `api.ts`, `moteur.ts`, doutes).
- `src/domain/hopIndex/v4/` (moteur, fabrique), `prototypes/houblons-v4/parcours/src/moteur/` (adaptateur, mesure, préchauffage),
  `prototypes/houblons-v4/parcours/src/ecrans/**` (une trentaine de fichiers importent le moteur).
- Le précédent de l'app : `src/ui/hopIndex/hopSolver.worker.ts`, `hopSolverMessages.ts`, `hopSolverTransport.ts` (le contrat de messages).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `src/domain/hopIndex/v4/client.ts` (neuf) et `src/domain/hopIndex/v4/index.ts` (son export)
- `prototypes/houblons-v4/parcours/src/moteur/`, `prototypes/houblons-v4/parcours/src/ecrans/**` (appels au moteur seulement)
- `prototypes/houblons-v4/tests/` (tests neufs du client)
- `prototypes/houblons-v4/maquettes/parcours/` (construction)
- `work/missions/2026-10-25-integration-houblons/voies/t6b-async/`
Une autre voie (t6a-ecriture) déplace en même temps `parcours/src/integration/conversion.ts` et modifie `src/pages/BrewWizard.tsx` :
n'y touche pas.

## Consignes
1. **Rien de visible ne change** : ses maquettes n'ont pas d'état d'attente, et leur apparence est **son choix** (D65, angles morts).
   Un écran garde son dernier résultat pendant un calcul et ne montre ni roue, ni « chargement », ni écran vide ; une réponse
   périmée (le doigt a bougé) est ignorée. Si un écran ne peut pas tenir sans état d'attente, arrête-toi et dis-le dans RESULTAT.md.
2. L'interface a la forme d'un contrat de messages (requête typée → réponse typée, un identifiant par requête), comme
   `hopSolverMessages.ts`, pour qu'un worker la serve plus tard sans changer les appelants.
3. Tests : le client rend les mêmes résultats que l'appel direct (empreintes du banc `scripts/bench-hop-v4.ts`) ; une requête rendue
   obsolète par une plus récente est ignorée.
4. Rejoue toute la maquette : `batterie.mjs` (46/46) et `controle-etats.mjs` (141/141), puis `npm run build`.
5. Gemini jamais ; aucune donnée réelle ; `functions/` intact.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Règle n° 1 : la maquette rend exactement la même chose ; aucun état d'attente ajouté sans son choix.
- Réactivité (D138) : aucune tâche longue ajoutée sous le doigt ; la sortie du rail reste ≤ 50 ms (`controle-sortie-rail.mjs`, dans la batterie).

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` au format de l'agent. Écris-le tôt ; garde 15 tours pour les critères (la batterie prend ~25 min : en arrière-plan).
Réponse finale au pilote : une ligne.
