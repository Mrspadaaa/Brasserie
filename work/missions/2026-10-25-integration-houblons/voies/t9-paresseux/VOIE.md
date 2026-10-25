# Voie t9-paresseux — Les outils v4 dans un chunk à la demande, préchargé, sans rien ajouter au démarrage (#167)

- Mission : 2026-10-25-integration-houblons
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 80 tours ; 3 essais par critère
- Dépend de : t3-pile, t4-moteur, t6b-async (faites)
- Décideur en cas de doute : pilote

## Objectif
Verdict D65, § Recommandation 3 : le moteur v4, ses données (`src/data/hopV4/`) et le client asynchrone forment un **chunk chargé à la
demande**, ouvert par la couche d'outil (aujourd'hui `src/ui/hopIndex/HopToolLayer.tsx`, provisoire, atteinte par le crochet de dev ;
demain les écrans portés, T12). Le chunk est **préchargé au repos après le premier écran, en ligne**, pour qu'un outil s'ouvre ensuite
hors ligne. Rien n'est ajouté au démarrage. La limite est écrite : un tout premier lancement hors ligne n'est pas couvert sans service
worker (décision de l'utilisateur).

## Entrées
- `cerveau/decisions/2026-10-25-integration-architecture.md` § Recommandation 3 ; `ETAT-DES-LIEUX.md` R4 (hors ligne des chunks), B9 (poids).
- `src/App.tsx`, `src/ui/hopIndex/HopToolLayer.tsx`, `src/ui/hopIndex/devHook.ts`, `src/ui/hopIndex/flags.ts` (T3) ;
  `src/domain/hopIndex/v4/` (moteur, `client.ts`) ; `src/data/hopV4/`.
- `vite.config.ts` (découpage actuel, sans changer ses alias), `scripts/check-hop-budget.mjs`.
- `cerveau/agents/verification-locale.md` (app locale `?dev-local`).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `src/ui/hopIndex/` (le point d'entrée paresseux, `HopToolLayer.tsx`, le préchargement), `src/App.tsx` (le déclenchement du préchargement seulement)
- `vite.config.ts` (le découpage du chunk des outils seulement), `scripts/check-hop-budget.mjs` (une option `--chunk-outils` si utile)
- `tests/unit/hopIndexV4/` (tests neufs du chargement)
- `work/missions/2026-10-25-integration-houblons/voies/t9-paresseux/`
Une autre voie (t17-banc) écrit en même temps `scripts/check-hop-tools-perf.mjs`, `scripts/bench-hop-v4.ts` et `package.json` : n'y touche pas.

## Consignes
1. Mesure d'abord (build de production) : démarrage B1 (919 ko gzip aujourd'hui) et ce que coûte l'ouverture d'une couche ; écris-les.
2. Le chunk des outils : son poids gzip mesuré ; budget ≤ 150 ko gzip ajoutés à l'ouverture d'un outil. S'il dépasse, dis ce qui pèse
   (le JSON, le moteur, V5.5 tiré par un import) au lieu de tordre le budget.
3. Préchargement : au repos (`requestIdleCallback` ou équivalent), une fois le premier écran peint, en ligne seulement ; jamais sur le
   chemin du démarrage. Drapeau `hopV4` éteint : rien n'est préchargé (aucun changement pour l'utilisateur).
4. Joue dans Chrome sur le **build de production** servi en local (pas le serveur de dev) : drapeau allumé par le crochet de dev,
   premier lancement en ligne → réseau coupé (DevTools hors ligne) → ouvrir une couche d'outil : elle s'ouvre. Captures ouvertes (L12).
   Mesure aussi l'ouverture d'une couche à ×4 (le budget de 100 ms de #162 était mesuré à ~400 ms sur le serveur de dev).
5. Gemini jamais ; aucune donnée réelle ; `functions/` intact.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Hors ligne et données préservés ; rien de visible ne change tant que le drapeau est éteint.
- Mesurer avant d'affirmer (L20) ; fini veut dire branché, joué dans Chrome, typé, testé, build vert (L11).

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` au format de l'agent, avec `## Mesures` (démarrage avant/après, chunk des outils, ouverture ×4) et `## Hors ligne` (captures
citées en chemins entre accents graves). Écris-le tôt ; garde 15 tours pour les critères. Réponse finale au pilote : une ligne.
