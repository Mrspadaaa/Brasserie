# L'Affinée — consignes Claude

Gestion d'une micro-brasserie suisse : React, TypeScript, Vite, Firestore et Dexie.
Répondre en français clair et concis (style Caveman lite), sans diminuer analyse,
preuves ou qualité du code. Conserver incertitudes, négations, nombres et unités.

## Mission et sources

- Partir de la demande et du code actuel. Préserver les changements en cours,
  le hors ligne et les données. Vérifier sur des fixtures ; pas de déploiement
  ni d'écriture sur les données réelles pour tester.
- Lire les parties pertinentes de PRODUCT.md pour le métier. Les mémoires et
  anciens rapports sont des indices datés ; PRODUCT.md, DESIGN.md et les décisions
  récentes de l'utilisateur priment en cas de contradiction.
- Avant une conception, modification ou revue frontend, lire une fois
  `.claude/rules/affinee-frontend.md` et les parties utiles de PRODUCT.md,
  DESIGN.md et docs/ui-compacte.md. Cette règle conserve les exigences UI et
  de vérification visuelle ; elle n'est pas nécessaire pour une tâche sans UI.
- AGENTS.md, .agents/ et .codex/ appartiennent à OpenAI : ne pas les charger comme
  instructions Claude. Les consulter seulement pour travailler explicitement dessus.

## Second cerveau et leçons

Chargés à chaque session et pour chaque sous-agent. Relire les leçons avant de
planifier, briefer ou livrer ; en écrire une après une correction (pilote seul).
Système complet : `docs/agents/systeme.md`.

@cerveau/INDEX.md
@cerveau/LECONS.md

## Skills à la demande

- Sélectionner depuis les descriptions disponibles le skill qui aide réellement
  la tâche ; ne pas inventorier ni lire tous les skills/plugins à chaque mission.
- Invoquer les skills retenus avec Skill avant l'étape concernée. Si un skill local
  existe mais n'est pas reconnu, lire `.claude/skills/<nom>/SKILL.md` une fois,
  résoudre ses références depuis ce dossier et ne pas répéter les appels refusés.
- Annoncer brièvement le premier usage. Lire seulement les références nécessaires
  et ne pas recharger les instructions déjà lues et inchangées. Les demandes
  explicites de l'utilisateur priment ; un skill ne crée pas une nouvelle mission.
- Le style lite ci-dessus suffit par défaut : ne pas charger Caveman à chaque
  session. Garder le skill `caveman` disponible pour une demande de mode explicite.
- Utiliser `code-simplifier` pour une simplification ou une passe ciblée après
  un ensemble cohérent de changements, avec le modèle courant, sans agent
  supplémentaire automatique. Préserver comportement et lisibilité.
- Pour un travail substantiel ou une reprise incomplète, utiliser `unlazy` :
  critères écrits avant réalisation, responsabilités claires, vérifications et
  preuves. Préférer le mode solo quand il convient ; conserver les critères ouverts.

## Contexte, agents et qualité

- Depuis le 2026-10-08, aucun agent OpenAI (Codex, Sol, Astra, Luna, Root) :
  rien ne leur est transmis. Opus pilote, conçoit, intègre et qualifie ; Haiku
  (`claude-haiku-5-5`) exécute lectures, recherches, tests, fixtures et captures ;
  Sonnet tient les voies de jugement (agents `auteur`, `relecteur`). Le travail en
  plusieurs parties passe par le skill `voies` : planifier une fois, une ligne par
  voie, critères rejoués par le pilote. Le pont Claude/Sol (`scripts/claude-expert.mjs`,
  skill `sol-orchestrator`, `.claude/roles/expert.md`, `docs/claude-expert.md`)
  est caduc ; `node scripts/claude-account.mjs team` reste le lanceur Team.
- Le moins d'intervention humaine possible : ne pas bloquer sur des questions
  à l'utilisateur. Trancher selon les documents, le code et ses choix connus
  (option prudente et réversible par défaut), ou soumettre une décision lourde
  au conseil (skill `conseil` ; le brasseur garde les choix de goût), puis journaliser.
  Seuls les gestes irréversibles ou externes attendent son accord, regroupés
  sans bloquer : déploiement, push/PR/merge, données réelles, Gemini facturé
  en production, suppression, comptes et réglages.
- Les tickets sont les issues GitHub de `Mrspadaaa/Brasserie`. Les registres de
  `work/` et les reçus d'anciens agents sont des indices datés : une action en
  attente attribuée à Sol, Astra, Luna ou au contrôleur revient au pilote Opus.

- Préserver le modèle et l'effort choisis par l'utilisateur. L'économie porte
  sur les répétitions, le contexte inutile et les appels sans résultat utile.
- Une mission cohérente par conversation. Pour une suite liée, réutiliser les
  conclusions vérifiées ; lire le diff et les nouvelles preuves. Ne pas recommencer
  un audit complet après chaque correction. Une mission indépendante mérite un
  nouveau contexte, avec seulement son état de reprise et ses fichiers pertinents.
- Pour un travail long, maintenir l'état de reprise dans son registre existant :
  objectif, décisions, fichiers modifiés, preuves, risques ouverts, prochaine action.
  Avant une compaction utile, préserver cet état ; ne pas compacter en boucle ni
  tronquer les faits nécessaires pour afficher artificiellement un petit contexte.
- Déléguer seulement un livrable indépendant utile, avec propriété de fichiers,
  contexte ciblé et résultat attendu. Réutiliser le même agent pour une suite liée.
  Les sous-agents consomment aussi du quota ; ne pas créer une équipe par défaut
  ni refaire leur exploration. Garder une revue indépendante quand le risque le justifie.
- Arrêter la recherche quand les preuves permettent la décision. Grouper les
  lectures indépendantes ; garder les longs journaux en fichiers et remonter
  résultats, erreurs utiles et références. Les tests déjà verts se rejouent pour
  un changement, un échec ou un doute concret, sans sacrifier les contrôles requis.

## Vérifications et sorties

- Fini veut dire utilisable : branché dans l'app, atteint par un vrai parcours,
  typé, testé, build vert. Un reçu, un registre « qualifié », une couche
  V3/V4/V5.5 ou un test vert ne le prouvent pas. Classer l'existant fini /
  inachevé récupérable (manque précis) / inutilisable ; finir ou brancher plutôt
  qu'ajouter une couche parallèle ; ne rien supprimer sans accord.
- Les tests d'intégration et les validations se font sur un vrai rendu de page
  dans Chrome (parcours joué, captures regardées), pas seulement avec
  Vitest/jsdom ou en lisant le code. D'abord en local : fixtures (scripts
  `puppeteer-core`), puis émulateurs Firebase ; l'app en ligne plus tard, en
  lecture seule.
- Gemini jamais dans un test unitaire ni dans `npm test` : toujours simulé.
  Appels réels seulement dans des tests spéciaux dédiés, lancés explicitement,
  très limités et journalisés.
- Utiliser les scripts de package.json selon le risque : `npm test -- <fichier>`,
  `npm run build`, et les contrôles de parcours concernés. Signaler les contrôles
  impossibles et leurs motifs. Une capture non regardée ne valide pas une interface.
- RTK peut résumer Git et les tests : `rtk git status`, `rtk git log -5`,
  `rtk test npm test -- --maxWorkers=2 <fichiers>` (`npm.cmd` sous Windows si besoin).
  Préserver commande, contrôles préalables, arguments et code de sortie. Lire le
  code/diff utile sans compression ; en cas de diagnostic ambigu, lire le journal
  complet ou relancer directement. Un résumé vide ne prouve pas une réussite.
- Si RTK manque au PATH, vérifier puis utiliser
  `C:/Users/mrspa/AppData/Local/Microsoft/WinGet/Packages/rtk-ai.rtk_Microsoft.Winget.Source_8wekyb3d8bbwe/rtk.exe`
  avec `&` sous PowerShell ; ne pas réinstaller ni rechercher en boucle.
