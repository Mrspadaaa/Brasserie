# C — Workflow de conception frontend avec des agents IA

Recherche du 18.10.2026 pour la v4 houblons (#119). Demande du brasseur : un workflow
qui applique les bonnes pratiques frontend actuelles, pour sortir des écrans « de
central nucléaire ou cockpit d'avion ». Précision du 18.10 : « dense sur téléphone […]
mais ça doit pas être surchargé, et surtout on doit voir que en premier plan les
informations réellement utilise. Ensuite on peut trouver plus d'infos avec des
raccords, renvoie, replis ou autre. »

**Niveaux de preuve**, utilisés dans tout le document :

- **[P] preuve** : étude mesurée (expérience, banc d'essai, réplication) ;
- **[G] guide** : pratique reconnue d'une institution ou d'un éditeur (NN/g, GOV.UK,
  Anthropic, Figma, Vercel), sans mesure contrôlée publiée ;
- **[O] opinion** : avis d'un auteur, ou recommandation de ce rapport.

Les études sur les juges IA portent sur des modèles de 2024-2025 (GPT-4o, Claude 3.5
Sonnet). Aucune mesure publique trouvée pour les modèles actuels : ils font peut-être mieux.

## 0. Ce que montre la planche M1

Planche `tournoi/M1/_lots-1-2/captures/planche-390.png`, regardée. Les 10 maquettes
montrent les 12 familles d'arôme en rangées de même hauteur, au mieux groupées en
« attendues » et « neutres ». 9 rangées sur 12 disent « incertain » ou « inconnu ». La
plupart ajoutent une règle de calcul en phrase, une légende et une hypothèse (« hypothèse
BJCP, à valider »). L'information utile, « 3 au style · 9 incertaines » (p09), existe mais
reste noyée. Trois causes probables [O] :

1. **Aucune étape ne décide du premier plan.** Le brief demande tout et la grille
   récompense la densité, donc chaque auteur montre tout.
2. **La forme imposée remplace le choix de structure.** Avec la créativité notée à 30 %,
   les auteurs vont vers la jauge, le terrain ou la console, c'est-à-dire le gadget.
3. **Le HTML est écrit de zéro**, sans composants ni références réelles, et l'IA
   retombe dans son registre moyen (section 2).

Le cadrage pèse aussi lourd : environ 24 700 mots (`wc -w`, 18.10.2026), dont le brief
v4 (2 331), les exigences retrouvées (5 615), DESIGN.md (4 365), ui-compacte (4 452) et
REGLES (1 335). Voir la section 5.

## 1. Processus reconnus, et ce qui convient à un utilisateur unique

| Méthode | Étape concrète | Pour nous | Niveau |
|---|---|---|---|
| Double Diamond ([Design Council, 2004](https://www.designcouncil.org.uk/our-resources/framework-for-innovation/)) | Découvrir et Définir (le problème), puis Développer et Livrer (la solution), en divergeant puis convergeant à chaque fois | Notre tournoi diverge sur la solution sans avoir convergé sur ce qui compte : le premier losange est sauté | [G] |
| Job stories, issues de JTBD ([Cohn, d'après Klement et Intercom](https://www.mountaingoatsoftware.com/blog/job-stories-offer-a-viable-alternative-to-user-stories)) | « Quand [situation], je veux [motivation], pour [résultat] » | 3 à 5 histoires, une citation du brasseur chacune ; déjà prévu à l'étape E0 | [G] |
| **Guide de priorité** ([van Nues et Overkamp, A List Apart, 03.05.2018](https://alistapart.com/article/priority-guides-a-content-first-alternative-to-wireframes/) ; [Gray, Sparkbox, 2013](https://sparkbox.com/foundry/content_priority_guide)) | Contenu de l'écran classé du plus au moins important, en texte, au format téléphone, avec du vrai contenu et sans mise en page, avant tout fil de fer. Selon les auteurs, le fil de fer donne « l'illusion d'un design fini » | **L'étape qui nous manque** (section 6, étape 2) | [G] |
| Divulgation progressive ([Nielsen, NN/g, 03.12.2006](https://www.nngroup.com/articles/progressive-disclosure/)) | Le premier niveau montre peu de choses, dont tout ce qui sert souvent ; le reste passe au second. Au-delà de deux niveaux, l'utilisabilité chute. Le déclencheur annonce ce qu'il ouvre | Fonde les trois plans : le 1 visible, le 2 à un geste, le 3 à deux gestes au plus | [G], tiré des tests NN/g |
| Mantra de Shneiderman ([1996](https://webspace.science.uu.nl/~telea001/uploads/VACourse/Shneiderman96.pdf)) | Vue d'ensemble, puis zoom et filtre, puis détails à la demande | Même logique pour une feuille de données | [G] |
| Breadboard et croquis au gros feutre ([Shape Up, ch. 4](https://basecamp.com/shapeup/1.3-chapter-04)) | Lieux, affordances et liaisons ; croquis trop grossiers pour être pris pour une consigne | Fils de fer en boîtes grises avant la couleur | [O] Basecamp |
| Évaluation heuristique ([Moran et Gordon, NN/g, 25.06.2023](https://www.nngroup.com/articles/how-to-conduct-a-heuristic-evaluation/)) | 3 à 5 évaluateurs indépendants. D'après les études de Nielsen (années 1990), un évaluateur trouve environ 35 % des problèmes et cinq en trouvent environ 75 %, chiffres repris par les supports de cours ([Cornell](https://kharms.infosci.cornell.edu/downloads/cse-556a/10-heuristic-evaluation.pdf)) | Plusieurs juges indépendants plutôt qu'un seul | [G] ; chiffres [P], de seconde main |
| Tester avec 5 utilisateurs ([Nielsen, 2000](https://www.nngroup.com/articles/how-many-test-users/)) | Tests qualitatifs à 5 participants | Ne s'applique pas : il n'y a qu'un utilisateur | [P], modèle |
| RITE (Medlock et al., Microsoft, 2002 ; [résumé MeasuringU](https://measuringu.com/rite-method/)) | Dès qu'un participant bute sur un défaut à corriger, on corrige avant le suivant | Convient à un utilisateur unique : chaque remarque du brasseur corrige la version suivante | [P], étude de cas |
| Test des 5 secondes ([Lyssna, 28.08.2023](https://www.lyssna.com/guides/five-second-testing-guide/)) | Montrer l'écran, le cacher, puis demander « qu'avez-vous vu ? » | Un coup d'œil du brasseur sur les versions | [G] |
| Test du premier clic (Bailey et Wolfson ; [réplication MeasuringU](https://measuringu.com/do-click-tests-predict-live-site-clicks/)) | 87 % de réussite après un bon premier clic, contre 46 % après un mauvais ; la réplication sur 750 participants trouve 78 % contre 70 % | « Où touches-tu pour… ? » sur les versions finales | [P], effet réel mais plus faible qu'annoncé |
| Prototypes parallèles ([Dow et al., TOCHI 2010](https://cs303.stanford.edu/papers/ParallelPrototyping2010-final.pdf) ; [Tohidi et al., CHI 2006](https://www.microsoft.com/en-us/research/?p=151922)) | Plusieurs variantes avant le retour donnent de meilleurs résultats et plus de diversité. Face à 3 variantes, les participants critiquent plus franchement que face à une seule ; ils trouvent les problèmes, pas les solutions | Justifie 3 versions finales et quelques variantes, pas 23 | [P] |

**En 2024-2026** [G/O] : NN/g et GOV.UK gardent la même suite : besoin, contenu, basse
fidélité, test court, puis haute fidélité dans un système de composants. Les outils IA
raccourcissent la haute fidélité ; ils ne prennent pas les décisions de contenu.

## 2. Concevoir avec l'IA générative

**Pourquoi l'IA tend vers le tableau de bord générique.**

- **Anthropic** ([blog, 12.11.2025](https://claude.com/blog/improving-frontend-design-through-skills) ;
  [cookbook](https://platform.claude.com/cookbook/coding-prompting-for-frontend-aesthetics)) [G, éditeur]
  - Cause : la « convergence distributionnelle ». Sans consigne, le modèle prend le
    centre probable de ses données : police Inter, dégradé violet, mise en page prévisible.
  - Remède : des consignes de typographie, de couleur, de mouvement et de fond, et le
    système de conception de l'équipe écrit dans un skill.
- **NN/g** ([Wang et Brown, 24.10.2025](https://www.nngroup.com/articles/ai-prototyping/)), qui a essayé
  des outils de prototypage IA sur un vrai projet [G, évaluation qualitative]
  - Les outils suivent l'objectif mais ne pèsent pas les arbitrages.
  - Leurs écrans sont plats et interchangeables, proches de shadcn et Tailwind par défaut.
  - Ils se trompent de motif (un « profil » lu comme un profil social) et produisent une
    hiérarchie faible, de mauvais regroupements et des couleurs en excès.
  - Joindre un croquis ou un cadre Figma rend le résultat bien plus fidèle, mais le
    concepteur a alors déjà fait l'essentiel. Conclusion de NN/g : traiter l'outil comme
    un stagiaire.
- **Notre lecture** [O] : l'effet « cockpit » cumule trois choses : pas de priorisation
  (tout au premier plan), un monde sombre, monospace et à petites tailles qui évoque
  l'instrument, et une grille qui récompense densité et rupture. Le monde visuel seul
  n'explique pas l'effet, puisque la carte Territoire, aimée, est dans le même monde.

**Ce que recommandent les éditeurs** [G, non mesuré par des tiers] :

- **Partir d'un système de composants existant.**
  - v0 utilise shadcn/ui par défaut et lit la configuration Tailwind et les variables
    CSS par un « registry ». Il prévient pourtant qu'il « may struggle with any
    customizations » ([doc v0](https://v0.app/docs/design-systems)).
  - Sans bibliothèque attachée, Figma Make « defaults to generic styles and layouts ».
    Figma recommande des règles courtes et fermes dans `Guidelines.md`
    ([Figma](https://developers.figma.com/docs/code/write-design-system-guidelines/)).
  - Google Stitch (18.03.2026) propose plusieurs directions et exporte un `DESIGN.md`
    ([compte rendu](https://www.abduzeedo.com/vibe-design-google-stitch)).
  - Claude Design (Anthropic Labs, 17.04.2026, préversion) lit le code et le système de
    conception de l'équipe ([TechCrunch](https://techcrunch.com/2026/04/17/anthropic-launches-claude-design-a-new-product-for-creating-quick-visuals/)).
- **Donner des références réelles.** Mobbin et Refero ouvrent leurs captures d'apps
  publiées aux agents, par MCP. Refero annonce plus de 125 000 écrans et 8 000 parcours
  (offre Pro) ; Mobbin, environ 620 000 écrans (offres payantes, bêta). Ce sont les
  chiffres des éditeurs ([doc Refero MCP](https://doc.refero.design/mcp/getting-started),
  [guide Mobbin MCP](https://developertoolkit.ai/en/ecosystem/mcp/mobbin-mcp/)).
- **Boucler sur la capture.** Donner une cible visuelle, capturer le résultat, lister
  les écarts et corriger, puis faire relire par un agent en contexte neuf
  ([Claude Code, bonnes pratiques](https://code.claude.com/docs/en/best-practices)).

**Pour nous** [O] : l'auteur reçoit quatre entrées.

1. Le guide de priorité.
2. Les composants réels de l'app (`Sheet`, `RecipeDisclosure`, `SegmentedControl`,
   `HopRangePlot`, `LevelGauge`).
3. 2 ou 3 captures d'apps réelles par motif.
4. Les jetons de DESIGN.md.

Une métaphore imposée ne sert plus que pour une ou deux variantes « chaudes ».

## 3. L'IA comme juge d'interface

**Ce qu'on sait** [P] :

- **Juges de texte.** Biais de position, de verbosité et d'auto-préférence ([Zheng et
  al., NeurIPS 2023](https://arxiv.org/abs/2306.05685)).
- **Juges multimodaux.** La comparaison par paires suit mieux l'humain que la note
  absolue. On y retrouve des biais de longueur, égocentrique et de position, et des
  notes tassées vers le haut ([Chen et al., ICML 2024](https://proceedings.mlr.press/v235/chen24h.html)).
- **Interfaces notées** ([Luera et al., 09.10.2025](https://arxiv.org/abs/2510.08783) :
  30 interfaces, environ 9 300 réponses humaines)
  - Note exacte : 35 à 38 % ; à ±1 point : 72 à 77 %.
  - Choix entre deux écrans : environ 60 %. Proche du hasard quand les humains voient
    une petite différence, environ 90 % quand elle est grande.
  - Les modèles surestiment la facilité d'usage, sous-estiment l'attrait et l'intérêt,
    et tassent leurs notes.
- **Gagnants de tests A/B** ([Jeon et al., WiserUI-Bench, 2025](https://arxiv.org/abs/2505.05026) :
  300 paires réelles)
  - Choix du gagnant : 56 à 60 % (hasard : 50 %).
  - Biais de position massif : Claude 3.5 Sonnet trouve 26 % des gagnants placés en
    premier et 87 % de ceux placés en second.
  - Expliquer un gagnant connu est bien plus facile que le choisir : une justification
    fluide ne prouve pas le jugement.
- **Modèles spécialisés.** Sur des paires notées par des designers, les grands modèles
  sont proches du hasard (GPT-4V 52,9 %, Claude 3 Opus 60,3 %), contre 75 % pour un
  modèle spécialisé ([UIClip, UIST 2024](https://arxiv.org/abs/2404.12500)). Des
  critiques de designers données en exemples améliorent de 55 % la critique générée
  ([UICrit, UIST 2024](https://arxiv.org/abs/2407.08850)).
- **Premier coup d'œil.** Une impression stable se forme en 50 ms ([Lindgaard et al.,
  2006](https://www.tandfonline.com/doi/abs/10.1080/01449290500330448)). La complexité
  visuelle et la quantité de couleurs expliquent environ la moitié de l'attrait jugé en
  500 ms ([Reinecke et al., CHI 2013](https://kgajos.seas.harvard.edu/papers/reinecke13aesthetics.pdf)).

**Ce qu'on en tire** [O] :

- **Préférence pour le texte.** Aucune étude trouvée ne mesure directement une
  préférence des juges IA pour le texte lisible sur une capture. Elle reste plausible
  par extension du biais de longueur. Notre grille l'aggravait : « densité » et
  « clarté » se vérifient plus facilement dans un texte que dans un graphique.
- **Rôle du jury.** Il devient un filtre sur des critères observables, pas un juge de
  goût. Ses questions sont binaires :
  - « Le premier écran montre-t-il tout le plan 1 ? »
  - « Un élément du plan 3 y est-il visible ? »
- **Paires dans les deux ordres.** On ne garde que les verdicts constants ; les autres
  comptent comme égalité.
- **Coup d'œil sur image réduite.** On montre le premier écran réduit (par exemple à
  50 %) et on demande « que dit cet écran en premier ? ». La réponse est comparée au
  plan 1. Un modèle ne se chronomètre pas : l'image réduite sert de substitut.
- **Mesures automatiques, avant le jury.**
  - Mots visibles au premier écran, paragraphes de plus de 2 lignes, nombre d'éléments
    distincts.
  - Contraste et cibles avec [axe-core](https://github.com/dequelabs/axe-core) : règle
    [target-size](https://dequeuniversity.com/rules/axe/4.10/target-size), 24 px CSS
    selon WCAG 2.5.8. Les 44 pt Apple et 48 dp Material sont des consignes natives, pas
    des minima web (règle du projet).
  - Seuils calibrés sur les captures aimées (Territoire), pas inventés.
- **Calibration.** On la garde (REGLES.md), mais en paires, avec de vraies critiques du
  brasseur en exemples, comme le montre l'effet UICrit.
- **Place de l'humain.** Le brasseur reste la seule vérité terrain : les juges éliminent,
  ils ne choisissent pas.

## 4. Dense sans surcharge : règles et outils

**Règles de représentation** :

- **Densité de valeur, pas d'encre** ([Ström, 20.05.2024](https://mattstromawn.com/writing/ui-density)) [O]
  - Mesurer la valeur rendue par unité de temps et d'espace, pas le remplissage.
  - Grouper par proximité ; même rôle, même style.
  - Retirer tout ornement qui ne porte pas d'information.
- **Feuilles du bas** ([Laubheimer, NN/g, 11.06.2023](https://www.nngroup.com/articles/bottom-sheet/)) [G]
  - Bonnes pour un détail contextuel, quand le fond reste utile à voir.
  - À éviter pour une information toujours nécessaire.
  - Jamais empilées ; bouton Fermer visible ; le geste Retour ferme la feuille.
- **Les trois plans pour nous** [O, d'après Nielsen 2006 et van Nues 2018]
  - Plan 1 : la réponse à la question principale, en marques graphiques plutôt qu'en
    phrases, avec une ligne de synthèse (« 3 au style · 9 incertaines »).
  - Plan 2, sur place : rangée dépliée, groupe replié sous sa synthèse, feuille non modale.
  - Plan 3 : feuille de détail, règle de calcul, sources.
  - Deux niveaux au plus ; chaque déclencheur porte le nom de ce qu'il ouvre.

**Outils** (React 19, Tailwind 3.4) :

| Besoin | Outil | Statut | Avis |
|---|---|---|---|
| Feuille, repli, segments, plages | **Composants de l'app** : `src/ui/Sheet.tsx`, `RecipeDisclosure`, `SegmentedControl`, `HopRangePlot`, `LevelGauge` (docs/ui-compacte.md) | déjà dans le monde DESIGN.md | premier choix [O] |
| Feuille glissante | Vaul | README : « This repo is unmaintained » ([GitHub](https://github.com/emilkowalski/vaul)) ; refusé par PRODUCT.md | ne pas ajouter |
| Feuille glissante, référence | [Base UI Drawer](https://base-ui.com/react/components/drawer) v1.9 : points d'arrêt, glisser pour fermer, imbrication ; shadcn est passé de Vaul à Base UI pour son Drawer ([shadcn](https://ui.shadcn.com/docs/components/drawer)) | sans style, compatible Tailwind 3.4 | seulement si `Sheet.tsx` manque d'un point d'arrêt [O] |
| Primitives (popover, onglets, repli) | [shadcn/ui](https://ui.shadcn.com/) sur Radix, Base UI ou React Aria | Tailwind v4 pour les nouveaux projets, v3 toujours servi ([note](https://ui.shadcn.com/docs/tailwind-v4)) | du code à copier et restyler : son allure par défaut est celle que NN/g juge interchangeable [O] |
| Valeur face à une cible et des plages | Bullet graph de Stephen Few : libellé, échelle linéaire, mesure, repère, 2 à 5 plages ; conçu pour remplacer les jauges ([spécification](https://www.perceptualedge.com/articles/misc/Bullet_Graph_Design_Spec.pdf), lue par des sources secondaires) | SVG à la main, ou [@nivo/bullet](https://nivo.rocks/bullet/) | SVG d'abord [O] |
| Barres de plage | [Recharts 3](https://recharts.github.io/en-US/api/Bar/), déjà présent (exemples « Ranged Bar Chart ») | compatible React 19 | pour la production |
| Petits multiples en maquette | [Observable Plot](https://observablehq.com/plot/features/facets) : facettes `fx`/`fy`, `barX` (`x1`/`x2`), `tickX`, `ruleX` ; une balise `<script type="module">` depuis jsDelivr suffit | pas un composant React (le monter dans un `useEffect`) | meilleur rapport vitesse/qualité en maquette [O] |
| Marques sur mesure | [visx](https://airbnb.io/visx/) : échelles et formes de bas niveau | React | si Recharts gêne |
| Mini-graphiques | [Tremor](https://tremor.so/) : Tracker, Bar Lists, Data Bars, Spark Charts, sur Recharts et Radix ; racheté par Vercel (01.2025), sous licence MIT ([Vercel](https://vercel.com/blog/vercel-acquires-tremor)) | à copier-coller | source d'idées ; allure SaaS à restyler |
| Références d'écrans | Mobbin, Refero (MCP payants) ; captures des apps aimées | — | 2 ou 3 par motif |
| Maquette cliquable | (a) HTML autonome avec le [Tailwind Play CDN](https://v3.tailwindcss.com/docs/installation/play-cdn), réservé au développement ; (b) **entrée Vite dans `prototypes/`** qui importe `src/ui` et la configuration Tailwind de l'app | (b) sans toucher `package.json` | (a) pour les fils de fer, (b) dès la tranche verticale [O] |
| Mesures | puppeteer-core (présent), axe-core, [Lighthouse](https://developer.chrome.com/docs/lighthouse/overview) (accessibilité) | — | des scripts, ni Storybook ni Playwright |

Konsta UI et Ionic ne sont pas retenus : ils imitent iOS et Material natifs, à l'opposé
de DESIGN.md. Ils n'ont pas été évalués en détail [O].

## 5. Éviter l'enlisement

1. **Tranche verticale.** Le *walking skeleton* (Cockburn, *Crystal Clear*, 2004 ;
   [résumé](https://www.henricodolfing.com/2018/04/start-your-project-with-walking-skeleton.html))
   est une petite fonction qui marche de bout en bout et relie toutes les parties, puis
   on élargit. Pour nous : un écran, la feuille au style, fini dans la pile réelle avant
   M2 à M4. [G]
2. **Boîte de temps et coupe-circuit.** Dans Shape Up, l'« appétit » fixe le temps et le
   périmètre varie ([ch. 3](https://basecamp.com/shapeup/1.2-chapter-03)). Un projet non
   fini à la fin du cycle n'est pas prolongé par défaut : on revient au cadrage
   ([ch. 8](https://basecamp.com/shapeup/2.2-chapter-08)). [G, pratique de Basecamp]
3. **Retour tôt et bon marché.** Trois appuis :
   - RITE et Tohidi (section 1) ;
   - NN/g 2025 : ne pas présenter un prototype IA poli comme presque final, sinon on
     débat des couleurs avant la hiérarchie ;
   - en pratique, 30 secondes du brasseur sur 3 fils de fer gris valent mieux qu'un
     verdict après des heures de finition. [P/G]
4. **Pas de « big bang ».** Une refonte radicale ne se justifie que si les petites
   corrections plafonnent ou si la structure est cassée ([Loranger, NN/g, 08.02.2015](https://www.nngroup.com/articles/radical-incremental-redesign/)).
   L'article conclut : « Never make radical changes when minimal adjustments will
   suffice ». On intègre donc écran par écran. [G]
5. **Dette de cadrage.**
   - Les livrables qui n'entrent pas dans le produit sont du gaspillage ([Gothelf,
     Smashing, 03.2011](https://www.smashingmagazine.com/2011/03/lean-ux-getting-out-of-the-deliverables-business/)).
   - Un fichier d'instructions trop long fait ignorer ses règles ([Anthropic](https://code.claude.com/docs/en/best-practices)).
   - Figma demande des règles courtes et fermes.
   - Shape Up : trop de détail devient une consigne.
   - Chez nous, environ 24 700 mots de cadrage. Remède : un brief auteur d'une page, le
     reste confié aux contrôles automatiques. [G/O]
6. **De la maquette au code.**
   - GOV.UK : les prototypes en code, faits avec les composants du système de conception,
     sont les plus réalistes pour tester. Leur code ne part pas tel quel en production
     ([Making prototypes](https://www.gov.uk/service-manual/design/making-prototypes)). [G]
   - Hot Potato : le prototype partagé devient la spécification vivante
     ([Mall](https://danmall.com/posts/hot-potato-process/)). [O]
   - Cela heurte le principe 4 de `methode-conception-frontend.md` (la pile de l'app
     n'arrive qu'à l'intégration). Proposition, réversible : les maquettes haute fidélité
     vivent dans une entrée Vite de `prototypes/` qui importe `src/ui`, les jetons et le
     moteur, sans changer `package.json`. La version choisie est alors déplacée, pas
     réécrite. Le pilote tranche et journalise. [O]

## 6. Workflow recommandé

Le brasseur intervient à deux endroits : un coup d'œil facultatif de 30 secondes
(étape 4) et le choix entre 3 versions (étape 7). Ailleurs, rien ne l'attend.

| # | Étape | Livrable | Outil | Contrôle | Qui |
|---|---|---|---|---|---|
| 1 | **Cadrer** (temps fixé d'avance) | Une page : 3 à 5 job stories avec citation, la question principale de l'écran, l'appétit, le coupe-circuit | impeccable `shape` | 1 page au plus ; citations vérifiées par `check-citations.mjs` | pilote |
| 2 | **Prioriser le contenu, avant tout dessin** | Guide de priorité au format téléphone, en texte, sur données réelles (détail sous le tableau) | Markdown ; méthode van Nues et Overkamp, et Nielsen | voir sous le tableau | pilote, puis un juge Opus neuf |
| 3 | Références | Planche de 2 ou 3 écrans réels par motif (liste dense et détail, plage, comparaison), plus la carte Territoire ; une ligne « on prend… » par écran | Mobbin ou Refero par MCP s'il y a un abonnement, sinon des captures | chaque référence sert un élément des plans 1 ou 2 | Haiku collecte, pilote choisit |
| 4 | Fils de fer gris | 6 variantes : 3 partis de structure × 2 (liste dense et feuille ; carte et liste ; tableau et détail en ligne…), en boîtes grises, avec les vrais libellés et chiffres, à 390 px. Aucune métaphore imposée | HTML et Play CDN | mesures automatiques et jury en paires (détail sous le tableau) ; 3 retenues | auteurs Opus et Sonnet ; Haiku mesure ; jury Opus neuf |
| 5 | **Tranche verticale** | Le meilleur fil de fer devient un écran complet dans l'entrée Vite `prototypes/`, avec les composants de l'app, les jetons, le moteur et les états (vide, inconnu, chargement) | Vite, `src/ui`, puppeteer-core | build vert ; axe-core sans violation sérieuse ; coup d'œil sur image réduite ; parcours joué dans Chrome | pilote |
| 6 | Trois versions | 3 partis distincts, d'abord sur la tranche puis sur l'écran complet (390, 412 et 1280 px) ; un joker « chaud » pour une idée à greffer | entrée Vite, composants réels | mesures de l'étape 4 ; `impeccable critique` ; jury en paires dans les deux ordres, avec de vraies critiques du brasseur en exemples ; chaque défaut éliminatoire corrigé avant la suite (boucle RITE interne) | 3 auteurs ; pilote intègre |
| 7 | **Le brasseur juge** (porte B) | Lien privé et 3 questions : « que vois-tu en premier ? » (5 s), « où touches-tu pour… ? » (premier clic, 2 tâches), « laquelle, et que changer ? » | Artifact privé | ses mots consignés tels quels | brasseur |
| 8 | Intégration, puis rétro | Écran par écran dans l'app, sans big bang ; puis le jury est comparé au choix du brasseur, et la grille corrigée | Vitest, `check-hop-*`, a11y-audit | build et parcours verts ; `retro.md` | pilote |

**Détail de l'étape 2.** Chaque élément de l'écran reçoit un plan :

- **plan 1** : visible sans geste ;
- **plan 2** : à un geste, sur place (déplier, repli, feuille non modale) ;
- **plan 3** : à deux gestes au plus (feuille de détail, renvoi).

Pour chaque élément, le guide note la question servie, la fréquence d'usage et le nom
du déclencheur. Contrôles de l'étape :

- plan 1 de 5 éléments au plus, seuil de départ à calibrer [O] ;
- deux niveaux de divulgation au plus ;
- chaque élément du plan 1 répond à une job story ;
- un « inconnu » n'entre au plan 1 que s'il change la décision ;
- un juge neuf répond à « Avec le seul plan 1, la question principale a-t-elle sa
  réponse ? ».

**Détail de l'étape 4.**

- Mesures automatiques :
  - tout le plan 1 visible dans le premier écran (390 × 844) ;
  - aucun élément du plan 3 visible ;
  - mots au premier écran sous le seuil calibré sur Territoire ;
  - aucun paragraphe de plus de 2 lignes.
- Le jury compare les variantes par paires, dans les deux ordres, sur 3 questions binaires.
- Le brasseur peut donner un coup d'œil facultatif de 30 secondes : « que vois-tu en
  premier ? lequel garder ? ». Sans réponse sous 24 h, on continue.

**Coupe-circuit** [O] : si une étape dépasse son appétit, ou si aucune variante ne passe
les contrôles du plan 1 après une relance, on réduit le périmètre. On n'ajoute ni règle
ni document.

**Nombre de variantes** [O] : 6 fils de fer, puis 3 versions. Le travail en parallèle
gagne sur le travail en série (Dow), 3 variantes suscitent une critique franche
(Tohidi), et plusieurs juges indépendants trouvent plus de défauts (Nielsen). Au-delà,
10 à 23 mini-maquettes diluent le jugement et le quota sans preuve de gain.

**Créativité sans gadget** [O] : la diversité vient des partis de structure et des
références réelles, pas d'une métaphore imposée. Un seul joker « chaud » par lot. Ce
qu'on récompense : un plan 1 rendu en marques graphiques lisibles d'un coup d'œil.
