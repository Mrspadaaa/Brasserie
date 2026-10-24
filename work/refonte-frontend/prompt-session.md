# Session « Refonte frontend : vrais besoins, specs et garde-fous » — prompt de lancement

**À remplir par l'humain au lancement :**
- Plafond de quota hebdomadaire pour cette session : ____ % (par défaut 80 %).
- Langue de la doc d'architecture et des specs : anglais ASD-STE100 (par défaut) ou français.

---

## 1. Ton rôle

Tu pilotes, avec Opus, la refonte du frontend de L'Affinée. Commence par la partie houblons.

Ta mission : comprendre les vrais besoins, retrouver ce qui s'est perdu, écrire de vraies specs, puis poser des
garde-fous qui empêchent de recommencer. Ensuite viennent l'architecture et la doc, puis une page HTML qui sert de
prototype pour les houblons.

**Aucun code de l'app avant la porte B (§ 5).** Avant cette porte, tu produis seulement :
- des documents ;
- des tickets ;
- des outils de contrôle ;
- un prototype séparé de l'app.

L'ancienne mission (`work/finalisation-tickets-2026-10-08/`) est **en pause** (`veille/STOP`). Tu peux la lire, mais
tu ne la relances pas et tu ne retires pas `STOP`.

## 2. État vérifié au 17.10.2026, 18:25

**Production** : `main` = `c8f4c3ae`.
- La PR #102 (V5.5) a été fusionnée à 15:58, la PR #117 (#114) à 18:23.
- Hosting : déployé à 18:24.
- Functions : déployées à 16:42 ; il y en a 39, sans les Functions V6 à reprise.
- Règles Firestore : déployées à 16:04.

**Arbre de travail W** : `C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie`.
- Branche `codex/v55-final-fixes-2026-10-04`, à `2c362b6c` ; son arbre est identique à `main`.
- Trois fichiers ne vont **jamais** dans un commit : `.codex/hooks.json` et `source4-portable-bundle-manifest-01.json`
  (modifiés), ainsi que `functions/.env` (ignoré).

**Issues ouvertes utiles** :
- #115 : besoin houblons en mots du brasseur, constats, pistes A/B/C ;
- #116 : ce qui s'est perdu (archives et galerie des versions) ;
- #113 : V4 des justificatifs ;
- #112 et #111 : suites des justificatifs ;
- #107 : atelier houblons à 3,5 Go ;
- #103 : conseil V6 refusé, HTTP 400 ;
- #106 : TRI-2b ;
- épopées #21 à #25. Elles sont rédigées en termes techniques et ne contiennent pas le besoin du brasseur.

**Constats vérifiés dans le code** :
- La base d'usage par style (`src/data/hopStyleUsageBootstrap.json`, 67 variétés) ne couvre que les IPA. Dans
  `src/domain/hopRecipeDesign.ts`, `HOP_STYLE_ROLES['stout-porter'].examples` est vide : **aucun classement n'est
  possible pour une stout**.
- Poids du JavaScript : `App` 2,7 Mo, `Host` (V5.5) 1,8 Mo, données houblons environ 2,3 Mo.
- Q09, calcul du catalogue complet : environ 54 s en test.

**Non vérifié** : quelles données manquent en production, quelles simulations échouent en production, et le
comportement de l'app connectée.

## 3. Règles non négociables

**Les mots de l'humain priment sur tout document d'agent.**

> « Si je fais une stout, je veux voir tous mes houblons qui correspondent du + au − à ma stout et pouvoir en comparer
> 2, 3, 4 facilement avec des infos ou des simulations. C'était ma demande principale. »

> « Sur mobile, en un clic, sans scroll, je veux pouvoir choisir mon houblon et voir ce que j'ai. »

> « L'application doit répondre à plusieurs questions explicitement données. » Ces questions sont dans la banque de
> questions (§ 5, phase 1).

> « Dans 80 % des cas, je sais déjà ce que je veux : ça doit être très pratique, pas surchargé, hyper lisible. Mais si
> je veux aller dans le dur, comprendre, confronter mes idées, choisir, ça doit être possible. »

> « Le houblon, ce n'est pas QUE les IBU : c'est toute une palette de saveurs et de chimie, des profils aromatiques. »

> « Comprendre les vrais besoins avant quoi que ce soit. » « Trop peu de tests ont été effectués sur la vraie app. »

**Règles du projet** : lis une fois `CLAUDE.md`, `PRODUCT.md`, `DESIGN.md`, `docs/ui-compacte.md`,
`.claude/rules/affinee-frontend.md` et les mémoires de
`C:\Users\mrspa\.claude\projects\C--Users-mrspa-Documents-Brasserie\memory\`. Points clés :
- mobile d'abord, tailles compactes ;
- jamais `type="number"` ;
- vrai rendu dans Chrome, captures regardées ;
- Gemini jamais dans `npm test` ;
- aucun agent OpenAI.

**Autonomie** :
- Aucune question bloquante. Tu tranches et tu journalises.
- L'humain intervient seulement aux portes A et B, et pour les gestes irréversibles ou externes : push, PR, fusion,
  déploiement, écriture de données réelles, Gemini facturé, suppression, comptes et réglages.

**Poste** :
- Écris tout fichier qui contient des barres obliques inverses avec Write ou Edit, jamais par un heredoc Bash.
- Si tu tournes dans l'app Desktop, lance les processus longs hors de l'app (mémoire `poste-claude-desktop-msix`).
- Réponds à l'humain en français clair et concis : faits mesurés, et ce que tu n'as pas pu vérifier.

## 4. Sources, dans cet ordre

1. **Les demandes de l'humain**, dans `C:\Users\mrspa\Documents\Brasserie\work\houblons-v5-cadrage-2026-09-29\` :
   - `demandes-utilisateur.md` : ses citations, avec ses exemples concrets ;
   - `recap-avant-opus.md`, `recap-avant-seconde-passe.md`, `clarification-creativite.md`, `ancrages-historiques.md`.

   Les récapitulatifs sont des **interprétations** d'agents : critique-les.
2. **Toutes les conversations** :
   - Codex : `C:\Users\mrspa\.codex\sessions\**\*.jsonl` (239 fichiers) ;
   - Claude : `C:\Users\mrspa\.claude\projects\*\*.jsonl`.

   Extrais **seulement les messages de l'humain**, sans résultats d'outils ni contexte injecté. Garde la date et la
   source. Thèmes : houblons, UX/UI, règles, exemples, frustrations. C'est une lecture seule, à confier à des agents
   Haiku.
3. **GitHub et docs** : #115, #116, les issues houblons fermées, les épopées. Puis `docs/prompts/refonte-levure.md` :
   l'humain avait demandé « la même chose que pour les levures ».
4. **Versions archivées** : `C:\Users\mrspa\Documents\Brasserie\work\houblons-*`.
   - La galerie s'ouvre par `houblons-v5-realisation-2026-09-29\Ouvrir les versions.cmd` (`tester.html`, port 5182).
     Elle contient V1 à V4, les explorations V5 et les états de V5.5.
   - Lis aussi les verdicts UX (`ux-verdict.md`) de la mission et des archives.
5. **Concurrence** : Beer Maverick, cité par l'humain (outil de comparaison, substitutions, houblons similaires). Ajoute
   d'autres références à identifier. Le but est de comprendre et de faire mieux, pas de copier.

L'archive `C:\Users\mrspa\Documents\Brasserie` porte aussi le `.git` commun de tous les worktrees : **lecture seule**.
Jamais de `clean`, de déplacement ni de suppression.

## 5. Phases et livrables, dans l'ordre strict

**Phase 1 — Besoins réels** (aucun code)
- `docs/besoins/corpus-demandes.md` : chaque demande de l'humain, citée mot pour mot, avec date et source. Sépare
  l'explicite de l'interprété, et retire les doublons.
- `docs/besoins/banque-de-questions.md` : chaque question concrète à laquelle l'app doit répondre. Tu y mets au moins
  ces exemples, puis tous ceux du corpus :
  - stout amérisée au Nugget : trop résineuse ou pas assez ?
  - Saaz remplacé par Styrian Golding dans une light lager ;
  - houblon indisponible : avec quoi le remplacer, et qu'est-ce que je gagne ou perds ?
  - forte amertume sans sapin, sans résine et sans tropical ;
  - blanche ultra tropicale qui se marie avec la banane ;
  - lager juicy, très aromatique et non amère ;
  - pastry stout trop sucrée ;
  - bière de Champagne florale, et la biotransformation ;
  - dry hop d'une blanche avec 20 g de moins dans le moût ;
  - quel houblon avec ma levure pour une NEIPA ;
  - cryo et hyperboost.

  Pour chaque question : la forme de réponse attendue, les données et le calcul nécessaires, l'incertitude, le cas
  (simple, 80 %, ou approfondi), et l'état actuel dans l'app.
- `docs/besoins/parcours-cles.md` : les gestes quotidiens. Choisir un houblon en un clic, comparer 2 à 4,
  simuler, remplacer. Contraintes mesurées à 390 × 844.

**Phase 2 — Ce qui s'est perdu (#116)**
- Joue la galerie et l'app actuelle avec la banque de questions et le cas « stout ». L'app actuelle se joue sur
  fixtures, puis en production en lecture seule.
- Livre une matrice « question × version », avec des captures regardées, et la liste de ce qui a disparu, avec le
  fichier d'archive qui le portait.
- Dis ce que le backend permet de récupérer.

**Phase 3 — Causes racines**, dans `docs/qualite/causes-racines.md`
- Pourquoi des règles de l'humain ont-elles été ignorées ? Pourquoi des problèmes majeurs d'UX/UI sont-ils passés à
  travers des dizaines de revues ?
- Preuves attendues : briefs, critères, verdicts, captures. Hypothèses à vérifier, pas à admettre :
  - critères rédigés par des agents en termes techniques ;
  - revues jugées contre le ticket et non contre le besoin ;
  - fixtures plutôt que données réelles ;
  - relecteurs nourris du rapport de l'auteur ;
  - aucun test de tâche chronométré ;
  - aucune comparaison à la concurrence ;
  - presque aucun test sur l'app déployée ;
  - empilement de couches V3, V4, V5.5.

**→ Porte A** : résumé de 10 lignes à l'humain, avec la banque de questions et les causes racines. Intègre ses
corrections avant la phase 4. **C'est le seul point où tu attends**, et tu continues la préparation pendant ce temps.

**Phase 4 — Garde-fous qui imposent**, dans `docs/qualite/garde-fous.md`, avec les outils :
- Chaque ticket d'interface cite au moins une question de la banque et le besoin en mots de l'humain : un gabarit
  d'issue, et un script qui refuse la clôture sans eux.
- Des contrôles automatiques `scripts/check-*` (puppeteer) :
  - « un clic, sans défilement » à 390 × 844 : depuis l'étape Houblons, le classement avec le stock apparaît en un
    clic, et les premiers houblons sont visibles sans défiler ;
  - un budget de performance mesuré : JavaScript initial, délai du premier classement sur processeur bridé, mémoire ;
  - l'interdiction de `type="number"`, les cibles tactiles et le contraste.
- **Protocole de revue UX** :
  - le relecteur reçoit la banque de questions et l'app qui tourne, **pas** le rapport de l'auteur ;
  - il joue des tâches chronométrées et décrit ce qu'il voit sur chaque capture ;
  - il compare à la concurrence ;
  - une question clé sans réponse bloque.
- **Vraie app** :
  - après chaque déploiement, un contrôle de la production en lecture seule (Chrome QA de l'humain, port 9222, ou
    l'humain lui-même) ;
  - des fixtures issues d'un instantané **en lecture seule** du catalogue de production, sans donnée personnelle.
- Les hooks Claude Code et les réglages qui imposent ces contraintes : tu les prépares ; ils s'activent sur accord
  humain.

**Phase 5 — Révision des tickets**
- Classe chaque issue ouverte : garder, réécrire, ou fermer comme caduque avec sa raison et un lien.
- Crée une épopée « Houblons pour le brasseur », avec des tickets dont les critères d'acceptation sont en mots du
  brasseur.
- Backend : liste ce qui se garde (calculs, données, Functions), avec preuve.
- Jamais de suppression d'issue ; chaque écriture GitHub va au journal.

**Phase 6 — Specs, architecture, doc**
- `docs/specs/houblons.md`, puis les autres zones du frontend.
- `docs/architecture/` : l'architecture actuelle (React/Vite, Dexie hors ligne, Firestore, Functions, passerelle
  Gemini et budget), et ce qui reste ou change.
- **ASD-STE100 à environ 80 %** :
  - phrases courtes (20 mots au plus pour une procédure, 25 pour une description) ;
  - un sujet par phrase, voix active ;
  - vocabulaire contrôlé, avec un glossaire FR-EN des termes métier ;
  - assez naturel pour recréer les specs.

  ASD-STE100 est défini pour l'anglais. Si l'humain choisit le français, applique les mêmes règles en français.
- **Diagrammes Mermaid de la logique cœur** :
  - classement des houblons par style ;
  - comparaison et simulation (IBU, arôme, substitution, avec les calculs de `src/services/brewingMath.ts`) ;
  - cycle du brouillon de recette et synchronisation hors ligne ;
  - passerelle IA.

**Phase 7 — Visuels pour la qualité UX/UI**
- Parcours dessinés, wireframes basse fidélité puis haute fidélité, références de la concurrence (usage interne),
  jetons de `DESIGN.md`.
- Skills : `impeccable`, `ui-design-system`, `a11y-audit`, `senior-frontend`, `unlazy` (critères avant réalisation).
- Critique UX indépendante par une session Fable 5.1.

**Phase 8 — Page HTML houblons** (prototype, hors de l'app)
- `prototypes/houblons/index.html`, autonome, mobile d'abord, à 390 et 1280 px.
- Données : les vraies données houblons du dépôt (`src/data/hop*Bootstrap.json`) et un stock d'exemple.
- Fonctions :
  - classement pour n'importe quel style, stout comprise ;
  - comparaison de 2 à 4 houblons ;
  - simulations (IBU, apport aromatique, substitution à IBU égal) ;
  - choix en un clic, sans défilement.
- Chaque question de la banque renvoie à l'endroit qui y répond, ou à « non documenté ».
- Contrôles par les scripts de la phase 4, avec captures regardées et temps mesurés. Publication en Artifact privé,
  pour que l'humain l'essaie sur son téléphone.

**→ Porte B** : l'humain essaie la page. Rien n'est intégré dans l'app avant son accord.

## 6. Critères de réussite pour les houblons (mesurés)

- **Stout** : depuis l'étape Houblons à 390 × 844, **un clic** montre tous mes houblons classés, stock d'abord. Les
  5 premiers sont visibles **sans défilement**, avec la quantité en stock.
- **Comparer** 2 à 4 houblons demande 3 touchers au plus, avec une lecture côte à côte nette à 390.
- **Simulation** : le résultat s'affiche en moins d'une seconde après le choix (calcul local).
- **Banque de questions** : chaque question reçoit une réponse, ou un « non documenté » explicite, avec sa source.
- **Performance et mémoire** : les budgets sont fixés en phase 4 puis mesurés.
- **Production** : le même résultat en production que sur fixtures.

## 7. Méthode

- **Registre** `work/refonte-frontend/registre.md` : objectif, décisions numérotées (`decisions.md`), fichiers,
  preuves, risques, prochaine action.
- **Quota** : `get_usage` au départ et à chaque phase. Au plafond, arrêt propre avec handoff.
- **Agents** :
  - Haiku pour les extractions volumineuses (conversations, archives) ;
  - Opus pour la synthèse ;
  - Fable pour la critique UX ;
  - 3 agents en parallèle au plus ; réutilise le même agent pour une suite.
- **Contexte** : au-delà d'environ 450 k, mets le registre à jour et propose une session neuve.
- **Git** :
  - commits locaux sur une branche neuve `claude/refonte-frontend-specs`, partie de `origin/main` ;
  - push, PR et fusion seulement sur accord humain ;
  - aucun `stash`, `reset` ni `clean`.
- **Fini** = utilisable et prouvé (`CLAUDE.md`). Un reçu ou un test vert ne prouve rien.
