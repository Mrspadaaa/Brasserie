# Méthodes d'agents : 11 dépôts, 8 alternatives, et le chantier « tous les écrans »

Date : 2026-10-31. Lecture seule. Rien cloné, installé, téléchargé ni exécuté.

## 0. Comment lire ce rapport

- Étoiles, licence et date viennent de l'API GitHub (`pushed_at` = dernier push, pas forcément le dernier commit de la branche par défaut).
- Les README et SKILL.md ont été lus par WebFetch, qui renvoie un résumé produit par un petit modèle. Une affirmation citée vient de ce résumé, pas d'une lecture intégrale. Les contradictions vues sont signalées.
- Ce que je n'ai pas pu lire est listé au § 8.
- Notre système : lu dans `docs/agents/systeme.md`, `CLAUDE.md`, les skills `voies`, `conseil`, `unlazy`, `cerveau/`, `DESIGN.md` (en-tête), `ecrans.json`.

## 1. Tableau récapitulatif

| Dépôt | Étoiles / push | Licence | Recouvrement avec nous | Verdict |
|---|---|---|---|---|
| obra/superpowers | 309,7 k / 29.10 | MIT | fort (voies, unlazy) | ADAPTER 3 idées |
| mattpocock/skills | 307,8 k / 30.10 | MIT | moyen (cerveau, décisions) | ADAPTER glossaire + filtre ADR |
| multica-ai/andrej-karpathy-skills | 227,2 k / 20.04 | null (README : MIT) | fort (déjà couvert) | LAISSER |
| anthropics/skills | 185,7 k / 28.10 | mixte | fort (webapp-testing déjà adapté) | ADAPTER skill-creator |
| DietrichGebert/ponytail | 181,2 k / 29.10 | MIT | moyen (unlazy, opposé d'esprit) | LAISSER |
| nextlevelbuilder/ui-ux-pro-max-skill | 143,2 k / 30.10 | MIT | fort (impeccable, DESIGN.md) | LAISSER |
| Graphify-Labs/graphify | 139,7 k / 30.10 | Apache-2.0 + MIT | faible (pas de graphe de code chez nous) | ESSAI BORNÉ |
| JuliusBrussee/caveman | 116,4 k / 31.10 | Apache-2.0 + MIT | total (déjà vendoré) | LAISSER |
| addyosmani/agent-skills | 112,1 k / 31.10 | MIT | fort | ADAPTER 2 idées |
| Leonxlnx/taste-skill | 106,6 k / 31.10 | MIT | moyen (impeccable, entonnoir) | LAISSER le skill, ADAPTER ses mesures |
| google-research/harness2 | 21,6 k / 14.10 | Apache-2.0 | conceptuel | LAISSER |
| github/spec-kit | 144,2 k / 30.10 | MIT | moyen | LAISSER |
| Fission-AI/OpenSpec | 73,5 k / 30.10 | MIT | moyen | ADAPTER la structure |
| bmad-code-org/BMAD-METHOD | 54,8 k / 30.10 | MIT + marque | fort, concurrent | LAISSER |
| thedotmack/claude-mem | 107,0 k / 31.10 | Apache-2.0 | fort, concurrent du cerveau | LAISSER |
| google-labs-code/design.md | 28,7 k / 16.10 | Apache-2.0 | déjà au format | **ADOPTER** (lint) |
| microsoft/playwright-mcp + argos-ci/argos | 38,9 k ; 0,65 k | Apache-2.0 ; MIT | moyen (tests visuels) | ADAPTER la baseline |
| oraios/serena | 30,9 k / 28.10 | MIT + GPL-3.0+ | faible | LAISSER |
| anthropics/claude-plugins-official | 45,5 k / 31.10 | Apache-2.0 | moyen | À LIRE avant |

## 2. Les 11 dépôts demandés

### 2.1 obra/superpowers
- **C'est** un cadre de skills et de méthode pour agents de code (Claude Code, Codex, Cursor…). Créé le 2025-10-09. Sources : https://github.com/obra/superpowers, https://api.github.com/repos/obra/superpowers
- **Idées fortes.** (a) `subagent-driven-development` : un implémenteur neuf par tâche, puis un relecteur qui rend deux verdicts (conformité à la spec, qualité). Codes de retour `DONE`, `DONE_WITH_CONCERNS`, `NEEDS_CONTEXT`, `BLOCKED`. Boucle de correction plafonnée. Modèle toujours explicite. Fichiers plutôt que transcriptions. Le résumé retient des décisions consignées avec leur coût si faux, au lieu d'arrêts. https://raw.githubusercontent.com/obra/superpowers/main/skills/subagent-driven-development/SKILL.md (b) `verification-before-completion` : pas d'affirmation sans commande rejouée ; le rapport d'un agent se vérifie par le diff. https://raw.githubusercontent.com/obra/superpowers/main/skills/verification-before-completion/SKILL.md (c) `writing-skills` : « TDD pour la documentation » : scénario sous pression sans le skill, puis skill minimal, puis rejeu. La description dit seulement quand l'utiliser, jamais le déroulé. https://raw.githubusercontent.com/obra/superpowers/main/skills/writing-skills/SKILL.md
- **Recouvrement.** Nous avons (b) et l'essentiel de (a) ; (c) n'a pas d'équivalent.
- **Conflits.** `brainstorming` : porte dure, rien ne se construit avant l'approbation humaine du document ; chaque message finit par une question ; seul moyen d'y échapper, l'utilisateur renonce aux questions et le skill s'arrête. https://raw.githubusercontent.com/obra/superpowers/main/skills/brainstorming/SKILL.md `using-superpowers` : « même 1 % de chance » d'applicabilité impose d'invoquer le skill ; il dit toutefois que CLAUDE.md prime. https://raw.githubusercontent.com/obra/superpowers/main/skills/using-superpowers/SKILL.md Le TDD « supprime le code écrit avant les tests » (README).
- **Verdict : ADAPTER.** Reprendre : codes de retour des voies (`DONE_WITH_CONCERNS`, `NEEDS_CONTEXT` dans la ligne 1 de RESULTAT.md), « décision consignée + coût si faux » pour le pilote, et l'épreuve baseline/avec-skill pour nos propres skills (voir top 5, n° 5). Ne pas installer le plugin.
- Maturité : 686 commits, 195 issues ouvertes. Dossier `hooks/` non lu.

### 2.2 mattpocock/skills
- **C'est** 27 skills « d'ingénieur » (grill, spec, tickets, TDD, revue, handoff). Créé le 2026-02-03. Sources : https://github.com/mattpocock/skills, https://api.github.com/repos/mattpocock/skills
- **Idées fortes.** (a) Glossaire unique `GLOSSARY.md`, mis à jour au fil de l'eau, sans détail d'implémentation ; ADR proposé seulement si la décision est dure à inverser, surprenante sans contexte et issue d'un vrai arbitrage. https://raw.githubusercontent.com/mattpocock/skills/main/skills/engineering/domain-modeling/SKILL.md (b) `wayfinder` : le grand chantier devient une carte de tickets de décision, avec types (recherche, prototype, entretien, tâche) ; les tickets « sans humain » partent en arrière-plan. https://raw.githubusercontent.com/mattpocock/skills/main/skills/engineering/wayfinder/SKILL.md (c) `retro` : une règle mécanique mérite un contrôle déterministe, pas de la prose. https://raw.githubusercontent.com/mattpocock/skills/main/skills/engineering/retro/SKILL.md (d) `writing-for-agents` : élaguer d'abord ce qui est toujours chargé, chaque étape finit par une condition vérifiable, un sens par endroit. https://raw.githubusercontent.com/mattpocock/skills/main/skills/productivity/writing-for-agents/SKILL.md
- **Recouvrement.** (b), (c), (d) : grille Décider, L13, plafonds du cerveau ; nous sommes en avance. (a) : pas de glossaire chez nous ; `decisions.md` fait 486 lignes sans filtre d'entrée.
- **Conflits.** `grilling` : tour de questions numérotées avec réponse recommandée, aucune action avant confirmation, pas de sortie prévue. https://raw.githubusercontent.com/mattpocock/skills/main/skills/productivity/grilling/SKILL.md Le README se contredit sur `to-spec` (« quiz » contre « pas d'interview »).
- **Verdict : ADAPTER** (a) : glossaire des mots du brasseur et filtre ADR à trois critères. LAISSER le reste.

### 2.3 multica-ai/andrej-karpathy-skills
- **C'est** un seul `CLAUDE.md` de quatre principes (réfléchir avant de coder, simplicité, changements chirurgicaux, exécution guidée par des critères). 28 commits. Sources : https://github.com/multica-ai/andrej-karpathy-skills, https://raw.githubusercontent.com/multica-ai/andrej-karpathy-skills/main/CLAUDE.md
- **Maturité.** Dernier push le 2026-04-20 : figé. API : licence `null` alors que le README dit MIT ; les commandes d'installation visent `forrestchang/...`, dont l'API renvoie ce même dépôt. https://api.github.com/repos/multica-ai/andrej-karpathy-skills, https://api.github.com/repos/forrestchang/andrej-karpathy-skills
- **Recouvrement.** Total. « Chirurgical » = nos OWNS, L17 et « préserver les changements en cours ». « Critères vérifiables » = unlazy.
- **Conflit.** « Arrête-toi et demande si tu es perdu » contre notre « pas de question bloquante » (L01 : lecture étroite et réversible).
- **Verdict : LAISSER.** Une phrase à emprunter pour le relecteur : « chaque ligne changée se rattache à la demande ».

### 2.4 anthropics/skills
- **C'est** le dépôt officiel de skills : 19 dossiers (`frontend-design`, `webapp-testing`, `skill-creator`, `doc-coauthoring`, `web-artifacts-builder`, `theme-factory`, `canvas-design`, `mcp-builder`, `claude-api`, `discernment-nudge`, 4 skills de documents…). https://api.github.com/repos/anthropics/skills/contents/skills, https://github.com/anthropics/skills
- **Licence.** API : `null` pour le dépôt. Le README dit Apache-2.0 pour beaucoup de skills ; `docx`, `pdf`, `pptx`, `xlsx` sont « source-available ». La licence de `skill-creator` n'apparaît pas dans ce que j'ai lu.
- **Déjà chez nous.** `webapp-testing` adapté le 25.10 avec LICENSE et SOURCE.md (`.claude/skills/webapp-testing/SOURCE.md`).
- **Idées.** `skill-creator` : tests avec/sans skill lancés dans le même tour, sous-agent noteur, comparateur à l'aveugle, optimisation de la description sur environ 20 requêtes séparées 60/40 entre entraînement et test. https://raw.githubusercontent.com/anthropics/skills/main/skills/skill-creator/SKILL.md `doc-coauthoring` : lecteur neuf qui teste le document (notre Regard neuf). `frontend-design` : liste d'anti-motifs ; la marque ou le brief prime. https://raw.githubusercontent.com/anthropics/skills/main/skills/frontend-design/SKILL.md `discernment-nudge` : 2 à 3 questions de suivi après une réponse substantielle. https://raw.githubusercontent.com/anthropics/skills/main/skills/discernment-nudge/SKILL.md
- **Verdict : ADAPTER** `skill-creator` pour mesurer le déclenchement de nos skills (CLAUDE.md contient déjà une rustine pour « skill local non reconnu »). LAISSER `frontend-design` (impeccable couvre) et `discernment-nudge` (ajoute des questions).

### 2.5 DietrichGebert/ponytail
- **C'est** un mode « dev senior paresseux » : échelle de sept barreaux (faut-il l'écrire ? existe-t-il déjà ? bibliothèque standard ?…), un test pour la logique à branches, fin de chaque réponse sur ce qui a été sauté, marqueurs `shortcut:` collectés par `/ponytail-debt`. Créé le 2026-06-12. Sources : https://github.com/DietrichGebert/ponytail, https://raw.githubusercontent.com/DietrichGebert/ponytail/main/skills/ponytail/SKILL.md, https://api.github.com/repos/DietrichGebert/ponytail
- Chiffres (-53 % de code, -26 % de coût) : mesures de l'auteur.
- **Recouvrement.** « Finir ou brancher plutôt qu'ajouter une couche » (CLAUDE.md) et « signaler les contrôles impossibles » couvrent l'esprit. Le skill ne mentionne aucune vérification visuelle ; un test n'est exigé que pour la logique non triviale, loin de nos exigences d'interface.
- **Verdict : LAISSER.** Idée jetable : marquer les raccourcis par `shortcut:` pour alimenter « inachevé récupérable » (L11).

### 2.6 nextlevelbuilder/ui-ux-pro-max-skill
- **C'est** une base de données de design (styles, palettes, couples de polices, règles par secteur ; chiffres annoncés par le README : 79 styles, 192 palettes, 74 couples, non vérifiés) et un script Python `search.py --design-system` qui compose un système de design. Sources : https://github.com/nextlevelbuilder/ui-ux-pro-max-skill, https://raw.githubusercontent.com/nextlevelbuilder/ui-ux-pro-max-skill/main/.claude/skills/ui-ux-pro-max/SKILL.md
- **Recouvrement.** `impeccable`, `ui-design-system`, `DESIGN.md`.
- **Conflits.** Priorités génériques « accessibilité » puis « toucher et interaction » (critiques) contre notre règle de densité, qui prévoit que les prescriptions génériques cèdent (`.claude/rules/affinee-frontend.md`). Choisir le style à la place du brasseur viole la règle n° 1.
- **Sécurité.** Exécute Python ; README : bibliothèque standard seule, aucun réseau (non vérifié).
- **Verdict : LAISSER.**

### 2.7 Graphify-Labs/graphify (aussi écrit safishamsi/graphify)
- **C'est** un graphe de connaissance d'une base de code : code analysé par tree-sitter sans LLM, docs et PDF par une passe sémantique via votre modèle, arêtes marquées `EXTRACTED` ou `INFERRED`, communautés Leiden, sorties `graph.json`, `GRAPH_REPORT.md`, `graph.html`. Créé le 2026-04-03, branche `v8`, 2 675 commits. Sources : https://github.com/Graphify-Labs/graphify, https://api.github.com/repos/Graphify-Labs/graphify
- **Adresse `safishamsi/graphify`.** L'API renvoie le même dépôt sous `Graphify-Labs` : renommage ou transfert, déduit. https://api.github.com/repos/safishamsi/graphify
- **À savoir.** Sous Claude Code, un hook se déclenche avant les recherches et avant Read/Glob pour orienter vers le graphe. Journal local des requêtes `~/.cache/graphify-queries.log`. Les « 80 % de jetons en moins » concernent l'offre payante Cloud ; le tableau de benchmarks du README mesure la précision de rappel. README muet sur JS/TS/React/Firestore. 726 issues et 928 PR ouvertes. https://raw.githubusercontent.com/Graphify-Labs/graphify/v8/README.md
- **Recouvrement.** Faible : `systeme.mjs chercher` indexe des notes, pas du code.
- **Verdict : ESSAI BORNÉ.** Dans un worktree jetable, `--code-only`, sans hooks, juger `GRAPH_REPORT.md` pour l'inventaire écrans-composants. Si un script d'imports maison suffit, abandonner.

### 2.8 JuliusBrussee/caveman
- **C'est** le mode de réponse compressé que nous avons déjà. La v4 ajoute un proxy, `Auto` (choix du modèle), `Read less`, `Blocks`, `Browse`, un CLI. Sources : https://github.com/JuliusBrussee/caveman, https://raw.githubusercontent.com/JuliusBrussee/caveman/main/README.md, https://raw.githubusercontent.com/JuliusBrussee/caveman/main/skills/caveman/SKILL.md
- **Comparaison.** Chez nous : `.claude/skills/caveman`, SKILL.md et README upstream non modifiés au commit `15581d14…`, aucun hook ni proxy ; `lite` choisi dans CLAUDE.md (`SOURCE`/`INSTALLATION.md` locaux). Le HEAD actuel sépare `ultracave` et `megacave` et liste des exceptions de clarté plus larges (tout ce qui est écrit hors chat, questions et options adressées à l'utilisateur). Notre copie a la section Auto-Clarity et Boundaries.
- **Gain réel.** Le README mesure `/caveman` à 4 119 jetons de sortie contre 4 334 pour « Réponds en bref » : environ 3 % de mieux au médian (règles 3.1.0). Notre `lite` suffit.
- **Sécurité.** `Auto` envoie à Caveman Cloud votre demande et les fichiers joints (dont CLAUDE.md) ; le plan gratuit peut les conserver. Télémétrie du CLI par défaut (commandes, jetons, ID, OS, IP) ; `curl | bash` sans somme de contrôle ; `Blocks` en pré-version, sans bac à sable. `/caveman-compress` réécrit CLAUDE.md et l'envoie au fournisseur de modèle.
- **Verdict : LAISSER.** Garder l'épinglage actuel.

### 2.9 addyosmani/agent-skills
- **C'est** 25 skills de cycle de vie (définir, planifier, construire, vérifier, relire, livrer), 9 commandes, 4 personas. Créé le 2026-02-15. Sources : https://github.com/addyosmani/agent-skills, https://api.github.com/repos/addyosmani/agent-skills
- **Idées fortes.** (a) `constraint-driven-development` : `CONSTRAINTS.md` avec un plancher, des chiffres appliqués par une commande réelle, un cliquet, des exceptions datées (90 jours). Un contrôle ne compte que s'il échoue sur une violation connue, passe sur un témoin propre, et échoue sur une erreur d'outil. Une revue surveille le diff : resserrer est discret, desserrer est bruyant. https://raw.githubusercontent.com/addyosmani/agent-skills/main/skills/constraint-driven-development/SKILL.md (b) `doubt-driven-development` : un relecteur neuf ne reçoit que l'artefact et son contrat, pas le raisonnement ; arrêt à trois cycles puis escalade. https://raw.githubusercontent.com/addyosmani/agent-skills/main/skills/doubt-driven-development/SKILL.md (c) tables « excuse → réponse » dans chaque skill (README).
- **Recouvrement.** (a) : nos témoins négatifs (L13, `systeme.mjs temoins`) sont équivalents ; il manque la détection de desserrage des critères. (b) : notre relecteur et le Regard neuf.
- **Conflit.** `interview-me` : question par question jusqu'à 95 % de confiance ; non contournable, en mode autonome il signale un blocage. https://raw.githubusercontent.com/addyosmani/agent-skills/main/skills/interview-me/SKILL.md `frontend-ui-engineering` : points de rupture génériques 320/768/1024/1440, WCAG 2.1 AA. https://raw.githubusercontent.com/addyosmani/agent-skills/main/skills/frontend-ui-engineering/SKILL.md
- **Verdict : ADAPTER** (a), la détection de desserrage, et (c), des tables tirées de LECONS. Les installer en bloc n'apporterait pas plus que superpowers.

### 2.10 Leonxlnx/taste-skill
- **C'est** un skill (`design-taste-frontend`, v2) : un script distribue trois directions artistiques parmi 20, l'agent en choisit une, construit avec de vraies photos libres, puis mesure dans un vrai navigateur à 1440, 768 et 390 px (`inspect.mjs`, `--app` pour les applications), puis critique ses captures, trois tours au plus. Créé le 2026-02-19. Sources : https://github.com/Leonxlnx/taste-skill, https://raw.githubusercontent.com/Leonxlnx/taste-skill/main/skills/taste-skill/SKILL.md, https://api.github.com/repos/Leonxlnx/taste-skill
- **Idée utile.** Mesures du mode application : marges égales, pas de vide aléatoire, débordements, contraste. Notre plainte du 25.10 sur les blancs (L12) en relève.
- **Conflits.** L'agent choisit la direction : règle n° 1. Liste d'interdits dont « texte monospace hors code » : `DESIGN.md` a `reading` en IBM Plex Mono. `assets.mjs` télécharge images et vidéos de collections libres. Une construction coûte « quelques centaines de milliers de jetons ».
- **Lien.** Notre skill `unlazy` vient de `Leonxlnx/unlazy` (`.claude/skills/unlazy/README.md`), même auteur.
- **Verdict : LAISSER** le skill ; **ADAPTER** ses mesures de cadre après lecture de `inspect.mjs` (non lu).

### 2.11 google-research/harness2
- **C'est** de la recherche : améliorer le harnais autour d'un modèle fixe (prompt, garde-fous, mémoire, outils, sous-agents, skills, scripts) par Propose–Probe–Compose, avec un « harnais d'amélioration » persistant qui garde les harnais adoptés et les leçons appuyées par des preuves. Papier arXiv 2610.14224. Créé le 2026-10-06, 3 commits visibles, « pas un produit Google officiel ». Sources : https://github.com/google-research/harness2, https://raw.githubusercontent.com/google-research/harness2/main/README.md, https://api.github.com/repos/google-research/harness2
- **Recouvrement.** Nos LECONS, conseil et contrôles forment déjà cette boucle, avec le brasseur comme juge.
- **Sécurité.** Il faut Linux, Python 3.12, Vertex AI et Google Cloud CLI ; réseau de l'exécuteur non restreint, bac à sable de Codex désactivé (README).
- **Verdict : LAISSER.** Seule confirmation : exiger une preuve dans chaque leçon, ce que nous faisons.

## 3. Huit alternatives récentes

1. **GitHub Spec Kit** : 144,2 k, MIT, créé 2025-08-21, push 30.10. Constitution, spécification, plan, tâches, implémentation ; `uv tool install specify-cli`, Python 3.11+. Les extensions communautaires sont à relire avant installation (README). Notre MISSION/VOIE/GATES va plus loin (rejeu, critique). **LAISSER.** https://github.com/github/spec-kit, https://api.github.com/repos/github/spec-kit
2. **OpenSpec** : 73,5 k, MIT, créé 2025-08-05, push 30.10. `openspec/specs/` (vérité courante) et `openspec/changes/<id>` (proposition, deltas, design, tâches) ; à l'archivage les deltas sont fusionnés dans les specs. Conçu aussi pour l'existant. Télémétrie anonyme (noms de commandes, version), désactivable par `OPENSPEC_TELEMETRY=0` ou `DO_NOT_TRACK=1`. **ADAPTER la structure** (§ 5). https://github.com/Fission-AI/OpenSpec, https://api.github.com/repos/Fission-AI/OpenSpec
3. **BMAD-METHOD** : 54,8 k, créé 2025-04-13. Rôles analyste, PM, architecte, développeur, UX. Licence MIT plus clause de marques « BMad » (API : `NOASSERTION`). La v6.12 stable demande Node 20.12+, Python 3.10+ et uv ; la v7 en alpha, avec ruptures annoncées, visait le 2026-10-16 (état inconnu). Concurrent direct de nos voies. **LAISSER.** https://github.com/bmad-code-org/BMAD-METHOD, https://raw.githubusercontent.com/bmad-code-org/BMAD-METHOD/main/LICENSE
4. **claude-mem** : 107,0 k, Apache-2.0, créé 2025-08-31, push 31.10. Six hooks de cycle de vie, SQLite plus Chroma, compression par appels de modèle (coût sur le forfait), synchronisation cloud optionnelle vers cmem.ai, balises `<private>`. Il capture tout et réinjecte : l'inverse de « une maison par fait » (le 22.10, une copie de règle périmée a survécu). **LAISSER.** https://github.com/thedotmack/claude-mem, https://api.github.com/repos/thedotmack/claude-mem
5. **google-labs-code/design.md** : 28,7 k, Apache-2.0, créé 2026-04-10, push 16.10, format « alpha ». Jetons en en-tête YAML (couleurs, typographie, arrondis, espacements, composants) et prose ; CLI `lint` (références non résolues = erreur ; contraste sous 4,5:1, sections hors ordre = avertissements), `diff` (code 1 si régression), `export` (Tailwind, DTCG). **Notre `DESIGN.md` a déjà cet en-tête** (`colors`, `typography`, `rounded`) ; aucun appel du CLI dans le dépôt (recherche faite). **ADOPTER.** https://github.com/google-labs-code/design.md, https://api.github.com/repos/google-labs-code/design.md
6. **Playwright MCP et Argos** : Playwright MCP (38,9 k, Apache-2.0) pilote le navigateur surtout par l'arbre d'accessibilité (https://testingbot.com/resources/articles/playwright-mcp, résultat de recherche) ; Argos écrit qu'il n'a ni baseline ni diff (https://argos-ci.com/blog/playwright-mcp-visual-testing, vu seulement dans les résultats de recherche : 404 à la lecture directe). Argos (MIT, créé 2016, 653 étoiles) se décrit comme plateforme open source « pour équipes et agents IA » (https://api.github.com/repos/argos-ci/argos) ;  **ADAPTER** l'idée de baseline, en local. https://api.github.com/repos/microsoft/playwright-mcp
7. **Serena** : 30,9 k, créé 2025-03-23, push 28.10. Outils de symboles par serveur de langage (renommage, références) ; licence par composant : SolidLSP MIT, le reste GPL-3.0 ou plus. TypeScript oui ; React/TSX non nommés. Installation par `uv tool install`, le README déconseille de passer par MCP ou place de marché. **LAISSER.** https://github.com/oraios/serena
8. **claude-plugins-official** : 45,5 k, Apache-2.0, push 31.10. Parmi les plugins listés : `code-review`, `code-simplifier`, `feature-dev`, `frontend-design`, `hookify`, `skill-creator`, `claude-md-management`, `session-report`, `playground`, `project-artifact`. Seuls les noms ont été lus. **À LIRE** : `claude-md-management` et `session-report` avant toute décision. https://api.github.com/repos/anthropics/claude-plugins-official, https://api.github.com/repos/anthropics/claude-plugins-official/contents/plugins

Écartés : **Kiro** (IDE AWS : requirements, design, tâches, avec « Quick Spec » sans portes ; ouverture du code non indiquée, nous utilisons Claude Code) https://kiro.dev/docs/specs/ ; **SuperClaude** (23,9 k, MIT, push 27.09, 30 commandes ; le README reconnaît que d'anciennes docs décrivent un système de plugins pas encore livré et que ses gains de 2 à 3× sont sans données) https://github.com/SuperClaude-Org/SuperClaude_Framework ; **Agent OS** (5,6 k, MIT ; découvrir et injecter des normes de code) https://github.com/buildermethods/agent-os.

## 4. Le programme « refaire tous les écrans comme houblons »

État mesuré chez nous :
- `work/refonte-frontend/v4/choix/ecrans.json` : 8 écrans, tous du périmètre houblons ; 7 « choisi », 1 « ouvert » (levure).
- `src/App.tsx` : cinq onglets (`dashboard`, `finances`, `production`, `stocks`, `clients`) et des vues (`recipe`, `brewday`, `wizard`, `costs`, `balance`, `list`, plus les vues houblons). Aucun registre n'énumère ces écrans ni leurs états (vide, chargé, erreur, hors ligne).
- `DESIGN.md` : 658 lignes ; `docs/ui-compacte.md` : 397 ; `src/ui/` : 145 fichiers.

Ce qui aiderait le plus, par ordre :

1. **Tests visuels : figer ce que le brasseur a validé.** Le risque du programme est la régression d'un écran déjà choisi (le rail a perdu des fonctions, D124 ; L16). Une baseline par écran et par état, diff local, complète les `controle-*.mjs` sans remplacer le regard (L12).
2. **Design system outillé.** Un lint de `DESIGN.md` (§ 3, n° 5) et, plus tard, un script qui repère dans `src/**/*.css` les tailles hors échelle (les règles disent que le code ancien est « un état à migrer »).
3. **Inventaire des écrans.** À énumérer par script depuis les routes, avec états et gestes, dans le registre existant. Graphify peut aider ; un script d'imports suffit peut-être.
4. **Mémoire des choix.** `ecrans.json` est la bonne maison. Y ajouter par écran les refus (variantes écartées avec ses mots) pour ne pas les remontrer. Le filtre ADR de mattpocock et la discipline « delta puis archive » d'OpenSpec y suffisent ; pas de mémoire automatique.
5. **Maquettes et choix.** Aucun dépôt lu ne fait mieux que l'entonnoir ni que « le brasseur choisit ». Le vrai risque est le coût multiplié par le nombre d'écrans (48 v0 en 6 séries au moins par écran, M13) : c'est une décision de dosage pour le pilote et le conseil, pas un outil externe.

## 5. Top 5 de ce qu'il faut faire

1. **Adopter le lint de `DESIGN.md` (`@google/design.md`).**
   - Enrichit `controle-teinte.mjs` (D106) et `DESIGN.md` : références cassées, contraste, ordre des sections, `diff` à chaque changement.
   - Coût : une demi-journée (version épinglée en devDependency, premier lancement, trier les avertissements ; la prose française hors ordre standard fera du bruit).
   - Risque : format alpha qui bouge ; `npx` sans version fige une chaîne d'approvisionnement flottante. Non exécuté par moi.
2. **Baseline visuelle par écran et état validés.**
   - Enrichit `controle-choix.mjs` et `controle-etats.mjs` ; ne remplace ni L12 ni la comparaison côte à côte avec la maquette choisie.
   - Coût : moyen (script puppeteer-core déjà en usage, diff de pixels, masques pour les données mouvantes). Commencer par les 7 écrans houblons.
   - Risque : faux positifs (polices, animations), baselines à tenir ; un vert pixel ne dit pas que c'est bien.
3. **Inventaire automatique des écrans dans `ecrans.json`, avec une discipline « spec vivante, delta, archive » (OpenSpec).**
   - Enrichit le registre : de 8 à toute l'app, avec les états par écran.
   - Coût : une voie `executant` pour énumérer, une voie `auteur` pour la forme.
   - Risque : bâtir une couche parallèle (L11). Rester dans `ecrans.json` ; ne pas installer OpenSpec.
4. **Glossaire du brasseur et filtre ADR à trois critères.**
   - Enrichit `cerveau/` et `decisions.md` (486 lignes) : mots d'interface (« épicé », « tiretés ») avec renvoi à SPEC ; ADR seulement si dur à inverser, surprenant, vrai arbitrage.
   - Coût : faible (une note, trois lignes de règle, plafond de 50 lignes).
   - Risque : recopier SPEC ; le glossaire n'est qu'un index (une maison par fait).
5. **Tester nos skills et agents comme `skill-creator` et `writing-skills`, et muscler les prompts d'agents.**
   - Enrichit L13 et `systeme.mjs temoins` : scénario sans/avec skill, 20 requêtes de déclenchement séparées 60/40, codes `DONE_WITH_CONCERNS`/`NEEDS_CONTEXT`, tables « excuse → réponse » tirées de LECONS, détection de critère desserré dans un diff.
   - Coût : moyen ; chaque essai consomme du quota (économie de CLAUDE.md) ; à plafonner.
   - Risque : sur-ajustement des descriptions ; la licence de `skill-creator` n'est pas établie dans ma lecture.

À surveiller sans décision : l'essai borné Graphify (§ 2.7) ; la lecture de `inspect.mjs` de taste-skill pour les mesures de cadre ; `claude-md-management`.

## 6. Points de vigilance

**Licences.**
- Karpathy : API `null`, README MIT, installation pointant vers un autre nom (même dépôt).
- anthropics/skills : pas de licence au niveau dépôt dans l'API ; documents « source-available ».
- BMAD : MIT plus marques déposées.
- Serena : GPL-3.0 ou plus pour l'application, MIT pour SolidLSP ; la GPL joue si l'on redistribue.
- Graphify et caveman : fichiers Apache-2.0 et MIT ; notre copie de caveman est sous MIT (LICENSE local).
- Toute reprise de texte : conserver LICENSE et SOURCE.md, comme pour `webapp-testing`.

**Prompts contraires à nos règles** (autonomie, « pas de question bloquante », règle n° 1, densité).
- superpowers `brainstorming` (porte dure, une question par message) et sa règle des 1 % ;
- mattpocock `grilling` (tour de questions, pas de sortie) ;
- addyosmani `interview-me` (non contournable) ;
- Karpathy « arrête-toi et demande » ;
- ui-ux-pro-max (priorité au toucher, style choisi par l'outil) ;
- taste-skill (choix de la direction par l'agent, interdit du monospace) ;
- superpowers TDD qui supprime le code écrit avant les tests.
Aucun ne s'applique à nos voies sans réécriture. Seul superpowers dit que CLAUDE.md prime.

**Sécurité des scripts.**
- caveman : `curl | bash` sans somme de contrôle, télémétrie par défaut, fichiers (CLAUDE.md compris) envoyés par `Auto` et `compress`.
- Graphify : hooks avant Read/Glob et recherches, journal de requêtes, documents envoyés au modèle, 928 PR ouvertes.
- claude-mem : six hooks qui capturent chaque usage d'outil ; synchronisation cloud et ouverture de compte à désactiver.
- taste-skill : serveur local, navigateur piloté, téléchargements d'images.
- OpenSpec : télémétrie anonyme par défaut.
- harness2 : bac à sable désactivé.
- Tout `npx ...@latest` flotte. Épingler une version ou un commit.
- Forks et miroirs nombreux (claude-mem, OpenSpec) : n'installer que depuis l'organisation officielle.

## 7. Conclusion en une phrase

Sur le pilotage, la preuve et le choix du brasseur, aucun dépôt ne dépasse notre système. Les gains sont ailleurs : lint du design system, baselines visuelles, inventaire d'écrans, glossaire, mesure de nos skills.

## 8. Ce que je n'ai pas pu lire

- Aucun dépôt cloné : pas lu le code des scripts de Graphify, taste-skill (`inspect.mjs`, `draw.mjs`, `assets.mjs`), ui-ux-pro-max (`search.py`), ni les dossiers `hooks/` de superpowers, ponytail, caveman, claude-mem.
- Pas lu : LICENSE (sauf BMAD), SECURITY.md, BENCHMARKS.md de Graphify, le papier arXiv 2610.14224.
- anthropics/skills : seuls `frontend-design`, `webapp-testing`, `skill-creator`, `doc-coauthoring`, `discernment-nudge` lus ; `web-artifacts-builder`, `theme-factory`, `canvas-design`, `mcp-builder` listés seulement.
- claude-plugins-official : noms seulement.
- Billet Argos sur Playwright MCP : 404 ; l'affirmation vient du résultat de recherche et de la description API.
- Kiro : licence et tarif non vus. Spec Kit : commande `clarify` non vue (la page lue ne la liste pas).
- Authenticité des étoiles non vérifiée.
- Aucun outil n'a été exécuté : le lint de `design.md`, le comportement de Graphify sur notre base, et les coûts en jetons restent à mesurer.
