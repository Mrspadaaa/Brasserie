### Où le conseil s'accorde
- **T1 d'abord** (6 regards sur 6). R1 fait planter Ma bière dès qu'une recette réelle contient un houblon inconnu du moteur. R2 cache cet échec, puisque les tests du moteur sont hors de `npm test`.
- **Pas de second brouillon.** Un brouillon Dexie reproduirait sa plainte D139. Le Brasseur coche « (c) » mais décrit en fait `writeRecipeDraft`, déjà en place (revues 2 et 3).
- **`lireBiere` reste sur le fil principal** (0,27 ms à chaud).
- **Catalogue en JSON chargé à la demande (a)**, pas dans Dexie : son chunk ne pèse que 44,74 ko gzip.
- **V5.5 derrière un drapeau (a).** `hopV55*` doit sortir intact d'un aller-retour testé. Le retrait se fait sur accord.
- **Un contrôle qui lit l'app** (mode `--url`, R8) avant de montrer le premier écran porté.

### Où il se divise
- **Hôte.** Contre des routes (Regard neuf, Audacieux), les couches sur le wizard monté (Bâtisseur, Contradicteur, Premiers principes) gagnent. Ce que j'ai vérifié dans le code :
  - `App.tsx:971` ne rend le wizard que si `view === 'wizard'`.
  - Au remontage, `BrewWizard.tsx:466` peut afficher `DraftFreshnessChoice`.
  - `useFullScreenRoute.ts:66` renvoie à `tabs` à chaque retour, sauf depuis `hopV55`, qui revient à la route mémorisée.

  La revue 2 a donc raison contre le Bâtisseur sur le mot « toujours ». Sur le fond, il a raison : ce mécanisme tient sur un seul niveau, il en faut quatre.
- **Calcul.** L'Audacieux veut le worker tout de suite ; trois regards veulent mesurer d'abord. Le profil t2 place le lag dans `hopDescriptorEvidence` (417 ms sur 880) et dans le rendu. L'Audacieux a pourtant raison sur un point : si les huit écrans appellent le moteur en synchrone, passer au worker plus tard veut dire tout reporter une seconde fois.
- **Échelle.** Le Brasseur et l'Audacieux raisonnent sur le catalogue ×10. Premiers principes, le Regard neuf et ETAT l.124 rappellent que ce ×10 est un « cadre de mesure, pas une prévision ». Ce qui grandit vraiment, ce sont les données Firestore.

### Angles morts
- **`RecipePage`** : aucun avis ne lui donne d'hôte ni de point d'écriture.
- **États d'attente** (chunk qui charge, worker qui calcule) : ses maquettes n'en ont pas. Leur apparence revient au brasseur.
- **Contrôles `--url`** : sur l'app, ils liront le DOM des composants portés (le Sheet apporte ses boutons, L26). Changer le résolveur d'`etat.html` ne suffira pas : il faut des repères `data-*` stables, communs à la maquette et à l'app.
- **Un test existe déjà** : le parcours wizard → `hopV55` → retour, joué sur HEAD, dirait si `DraftFreshnessChoice` surgit. Personne ne l'a joué.
- **Index « au build » de l'Audacieux** : ils ignorent le stock, qui n'existe qu'à l'usage.
- **Budget t2** (« premier retour » ou « écran complet ») : la question est ouverte et revient au brasseur.

### Recommandation
1. **Hôte et persistance.**
   - Une pile de routes dans `App`, qui étend `returnFromHopV55` à quatre niveaux. Le wizard reste monté sous les outils.
   - Une seule porte d'écriture, `applyHopV4Change`, calquée sur `applyHopV55Change`. Elle valide par `writeRecipeDraft`.
   - `RecipePage` : même pile et même porte, avec la recette pour cible. Le patch ne touche que `hops`, par `saveRecipeConfirmed` (cache Firestore hors ligne), et garde `hopV55*`, `stockItemRef` et `hopLotId`. Elle est portée après le wizard.
   - Pas de Dexie pour le brouillon.
2. **Calcul : (b), en deux temps.**
   - D'abord T5 et les deux causes t2 : le cache indexé par le contenu et non par l'identité du tableau, un formateur `Intl` réutilisé.
   - Dès T6, les appels lourds (`proposer`, `suggerer`, `remplacants`, `substitutes`, préchauffage) passent par une interface asynchrone, servie d'abord sur le fil principal.
   - Un worker persistant la remplace si le contrôle ×4 échoue. `lireBiere` reste synchrone.
3. **Données et hors ligne : (a).**
   - Chunks d'outils préchargés au premier lancement en ligne, prouvés réseau coupé dans Chrome.
   - Limite écrite : un premier lancement hors ligne n'est pas couvert sans service worker.
   - Écoutes Firestore par écran (T10) après T8, avec la règle « snapshot inchangé = 0 recalcul ».
4. **V5.5 : (a), drapeau.** Un test alterne v4 et V5.5 sur la même recette, pour voir si un `hopV55Applications` survit au remplacement de sa ligne.
5. **Ordre des tâches.**
   - T1, puis T14 minimal : résolveur commun et `controle-choix.mjs --url`, avec un témoin négatif.
   - T3, avec le remontage joué dans Chrome.
   - T4, T5, T6.
   - T17 avancé : banc Node bloquant après T5, sur un jeu réaliste (318 houblons, stock ×5, recettes et dégustations ×10, snapshots répétés). Le ×10 catalogue reste une mesure non bloquante. Le banc s'étend au navigateur dès T12.
   - T9, T11, T8.
   - T12 sous drapeau, avec captures côte à côte de sa base v4.10.
   - T7 seulement si T17 échoue.
   - T10, T13, T15, T16, T18.

**Revient à l'utilisateur :** retrait de V5.5, toute suppression, fusion des catalogues avec `hopIndex`, service worker en production, correction du catalogue réel de 12 variétés (R9).
**Revient au brasseur :** états d'attente, budget t2, choix encore ouverts (Levure). Le brasseur aussi est concerné par le retrait de V5.5 : « on doit pas non plus perde le modèle de calcul de la 5.5 ».

### Premier geste
1. Écrire un test : un ajout `inconnu:hallertau` passé à `lireBiere`. Le voir rouge sur HEAD (L13).
2. Faire rendre « arôme non simulé » à `houblon()` au lieu d'une exception, dans `prototypes/houblons-v4/parcours/src/moteur/index.ts` (ligne 214).
3. Ajouter `prototypes/houblons-v4/tests` à `vitest.config.ts`.
4. Vérifier :
   - `npx vitest run` dans `prototypes/houblons-v4` : 128 verts (127 + le nouveau) ;
   - `rtk test npm test -- --maxWorkers=2 prototypes/houblons-v4/tests` ;
   - `npm run build`.
5. Dans la foulée, sans rien écrire : jouer wizard → `hopV55` → retour dans Chrome sur fixture, et ouvrir la capture.
