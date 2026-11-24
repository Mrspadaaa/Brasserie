OK — Q-1 A, Q-1b B, Q-2 C, Q-5 A, Q-6 A et puces de domaines D437 portés ; commit 4aaacbd6a

## Plan (variante retenue, page, fichiers)
- Q-1 A, le choix fait le prix (questions/page.html, q1-a.png). `choisir` pose `estimatedCost` = prix en CHF de l'article choisi. `planSuitChoix` remplace le montant d'achat du plan, l'estimé d'avant compris : À venir, Calendrier et carnet disent un seul chiffre. En autre devise, rien ne change. Fichier : src/domain/carnets/operations.ts.
- Q-1b B (q1b-b.png). Sous « Prix estimé ? », une pastille de plus en tête : « 400 CHF · budget », tirée du critère Budget, ou le prix lu d'un lien (« · lu », un article lu en CHF, le plus bas). Les cinq ordres de grandeur restent. Fichiers : src/domain/carnets/prixPropose.ts, RubriqueQuand.tsx, ecransCarnet.tsx, carnetOuvertTypes.ts.
- Q-2 C (q2-c-evier.png, q2-c-froide.png). La recherche fouille les titres, les Faits (groupe « Faits » à part), le nom des articles et le texte des notes. La ligne trouvée est citée sous le titre (« article : Chambre **froide** 1500 x 1200 mm »). Accents et majuscules sont ignorés. Fichiers : src/domain/carnets/recherche.ts, ListeCarnets.tsx.
- Q-5 A (q5-a.png). Au repos, Quand tient sur une ligne : « Quand · cette semaine · prix ? › », ou « · 500 CHF estimé ». Un toucher rouvre les puces, la frise, les pastilles et Au calendrier ; un toucher sur « Quand » replie. Fichiers : RubriqueQuand.tsx, carnets.css (`.cnq-*`).
- Q-6 A : Placer suffit, donc aucun code.
- D437 A (filtres-domaine/page.html, a-puces.png, carnet-domaine.png).
  - La rangée : loupe (un toucher ouvre le champ « Chercher un carnet »), « Tous 20 », puis les domaines avec picto coloré et nombre (Local, Brasserie, Meuble, Papiers ; Outils dès son premier carnet).
  - Les puces d'état sont retirées ; l'état reste l'ordre des sections. Le domaine filtré est gardé le temps de la session.
  - Dans le carnet ouvert, une pastille « Brasserie ▾ » au bout de la ligne d'état ouvre les cinq domaines, coche sur le sien. Le choix s'écrit `carnet.domaine = { valeur, origine: 'vous' }`, avec Annuler.
  - Ordre de priorité du domaine : posé par lui, puis par l'IA, puis la catégorie du Planning (table de la page, rangements surlignés gardés tels quels), puis les mots du titre (comme la vignette).
  - Un carnet sans domaine n'est caché par aucun filtre.
  - Fichiers : src/domain/carnets/domaines.ts, src/ui/carnets/domaineMots.ts, Domaines.tsx, domaines.css, ListeCarnets.tsx, CarnetOuvert.tsx, ecransCarnet.tsx, modele.ts (champ lu), operations.ts (`poserDomaine` ; `ranger` pose le domaine de l'IA sur le carnet neuf ou sur celui de l'annonce), ia.ts (domaine validé), rangementCarnets.ts (le domaine suit la destination), functions/src/carnetIA.ts (schéma, consigne, garde serveur ; NON déployé).
  - Plus dense que la maquette (D448) : puces de 32 px en 14 px.

## Fichiers écrits (commit 4aaacbd6a, plus le commit de clôture)
src/domain/carnets/{domaines,recherche,prixPropose}.ts (neufs), modele.ts, ia.ts, operations.ts ; src/ui/carnets/{Domaines.tsx,domaineMots.ts,domaines.css} (neufs), ListeCarnets.tsx, CarnetOuvert.tsx, RubriqueQuand.tsx, carnetOuvertTypes.ts, ecransCarnet.tsx, rangementCarnets.ts, carnets.css ; functions/src/carnetIA.ts ; tests/unit/carnetsQ.test.ts (neuf) ; tests/unit/carnetsLot2.test.ts (une assertion, voir plus bas) ; work/missions/BUGS.md (5 lignes).

## Critères
- tsc app : 2 erreurs, les 2 connues (seedData GanttTask, virtual:pwa-register). tsc functions : 0.
- Tests (tests.log) : `npx vitest run tests/unit/carnet tests/unit/proprietes --reporter=dot` donne 50 fichiers, 712 tests verts. carnetsQ.test.ts compte 35 tests : la table des 20 carnets → domaine, les puces 20/10/4/4/2, priorité vous > IA, sans domaine visible partout, lecture du champ, `poserDomaine` et Annuler, IA (domaine gardé, hors liste retiré, posé au rangement), recherche (titre, article cité, note avec accents, rognage), Q-1 (4 900 remplace 500, euro inchangé, plan à 500 → 4 900), Q-1b (budget, lu devant budget, euro jamais proposé).
- Rouge puis vert : carnetsQ.test.ts a été écrit avant domaines.ts, recherche.ts, prixPropose.ts, `poserDomaine` et Q-1 (imports absents, donc rouge par construction). Je ne l'ai pas lancé en rouge.
- carnetsLot2.test.ts : l'assertion « plan déjà chiffré 500 : le montant reste (Q-1) » encodait l'attente d'avant Q-1. Elle dit maintenant 249 560, le prix choisi (Q-1 A).
- Deux échecs rencontrés puis corrigés :
  - B6 (carnetsIA) : aucun gabarit d'objet dans src/domain/carnets. La table de mots est passée dans src/ui/carnets/domaineMots.ts, comme les pictos, et l'IA simulée ne pose pas de domaine.
  - critique 8 n° 3 : la consigne ne nomme aucun objet. « hotte » est retiré de la consigne.
- Registre : `controle-bugs.mjs` donne BUGS OK (2200 bugs). CA12-M4-14, CA12-M4-16, CA12-M1-3, CA12-M2-2 et PNC-14 passent à « en cours — corrigé en local, à prouver en ligne ».
- Build : impossible dans cette copie, `vite-plugin-pwa` absent de node_modules (même cause que l'erreur tsc connue). Je n'ai pas écrit dans dist/ ; le build revient au pilote (COMMUN).
- Captures : aucune en local, comme le demande VOIE.md. Le rendu n'a donc pas été regardé : preuve en ligne par le pilote et le critique.

## À rejouer en ligne (390), par le pilote et le critique
1. Liste : loupe, « Tous 20 », Local 10, Brasserie 4, Meuble 4, Papiers 2 ; un toucher sur Local donne ses carnets, Faits compris.
2. Recherche « froide » : Prix en euros cité « article : Chambre froide… ». Recherche « évier » : les 2 Faits dans « Faits ».
3. Carnet ouvert : la pastille Brasserie ▾, puis le menu et le changement, puis retour à la liste et le compte qui suit.
4. Quand replié au repos ; ouvert, « 400 CHF · budget » en tête sur Frigo + congel.
5. Choisir un article chiffré sur un carnet estimé : À venir, Calendrier et carnet disent le prix choisi.

## Contrôles e2e à réaligner (hors de mon Possède)
- e2e/carnet/lot-5.spec.ts : `[data-filtre=…]` (puces d'état retirées par D437) et `getByRole('searchbox')`, qui demande maintenant un toucher sur la loupe (« Chercher un carnet »).
- e2e/carnet/feuilles.spec.ts:103 : `[data-quand-frise]` demande d'ouvrir Quand d'abord (`[data-quand-replie]`).

Prédiction : « Ah, enfin des filtres qui parlent de mon local », puis un reproche probable sur la couleur ou le picto Brasserie, à juger sur capture.

DÉCISION À PRENDRE : déployer functions (consigne et schéma du domaine). Sans ce déploiement, l'IA en ligne ne pose aucun domaine, et les carnets neufs prennent celui de leurs mots. Geste externe, accord groupé.

CONNAISSANCE : la catégorie d'un carnet du Planning ne vit que dans le texte de sa note de dates (« (Planning, Équipements) », « Jalon du Planning ») ; `categoriePlanning` la lit là (src/domain/carnets/domaines.ts).
LEÇON PROPOSÉE : aucune
