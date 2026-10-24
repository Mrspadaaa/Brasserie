# Gates: système d'agents L'Affinée (cerveau, leçons, conseil, voies)

OWNS: cerveau/**, .claude/agents/executant.md, .claude/agents/auteur.md, .claude/agents/relecteur.md, .claude/agents/conseiller.md, .claude/skills/conseil/**, .claude/skills/voies/**, .claude/hooks/cerveau.mjs, .claude/settings.json, scripts/agents/**, docs/agents/**, work/missions/**, CLAUDE.md, .gitignore

Scope: un système d'agents adapté à L'Affinée, utilisable tout de suite. Il comprend un second cerveau versionné, les leçons des agents chargées à chaque session, un conseil pour les décisions lourdes, et des voies (Opus planifie, Haiku et Sonnet exécutent et se contrôlent, retour en une ligne). Il est essayé sur de vraies tâches de la reprise du lot 21. Lancer : `node .claude/skills/unlazy/scripts/gate-check.mjs --cwd . work/missions/2026-10-22-systeme-agents/GATES.md`.

Demandes de l'utilisateur (22.10), dans l'ordre : système d'agents autour des prochaines tâches (maquettes, artefacts) ; « déjà » un fichier de leçons type AGENT_LEARNINGS.md ; « ensuite » un conseil de LLM adapté (tenfoldmarc/llm-council-skill) ; « ensuite » une séparation des tâches avec système de décision et boucle de rétroaction pour la correction (planificateur, essaim, une ligne par agent, plafond de dépense, auto-contrôle, relance dans sa voie) ; « toujours adapté à notre usage » ; « enfin » un second cerveau.

- [x] G1: le second cerveau est valide. INDEX court, notes avec en-tête, liens résolus, au moins 15 notes. Les leçons sont au format, 12 au moins, 30 actives au plus.
  CHECK: node scripts/agents/systeme.mjs cerveau
  EXPECT: CERVEAU OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=c7b8748f96bca66904be174b2e7afa219cb21d3126d891b8222c50d22107bf6c; exit=0; EXPECT=matched; output-sha256=1112ef12d1af23fdc6610bab9d717a713d249e70aeb86a666bcfa141bad8052d; output-bytes=34; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: chaque contrôle du système échoue sur son témoin négatif et passe sur le témoin positif : note sans en-tête, lien cassé, leçon sans cause, agent sans plafond, conseil incomplet, voie qui se dit OK mais dont le critère échoue.
  CHECK: node scripts/agents/systeme.mjs temoins
  EXPECT: TEMOINS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=1eb6e5d347a145baa08fdc3f609ab02c9fc05a91fd07b0a610b551cac1c25510; exit=0; EXPECT=matched; output-sha256=cb01775713073e1b480f4377607a112f62c59fbedd44a3a7156e55fb91c67c37; output-bytes=714; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: les hooks sont branchés et réagissent. Une correction du brasseur injecte le rappel des leçons, une phrase neutre n'injecte rien, une écriture qui casse le cerveau est renvoyée.
  CHECK: node scripts/agents/systeme.mjs hooks
  EXPECT: HOOKS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=f2634ae29ad7913d526b4fe5507ebb1b3ae6f327eda163d4e999fb39b6eccd49; exit=0; EXPECT=matched; output-sha256=48317845e8218ececff7da0e7c7455e18b2b6a45247b77b039b3fe02f93332c1; output-bytes=9; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: CLAUDE.md importe INDEX et LECONS, les skills conseil et voies et la doc système existent, et git suit les textes des missions.
  CHECK: node scripts/agents/systeme.mjs cablage
  EXPECT: CABLAGE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=5713fcbe8de744cefb76370244175b1a2dda328c030386acddcf0e090d0c4911; exit=0; EXPECT=matched; output-sha256=5ec18eb46548cd9619d98ce192a9c22635986ec66e4b705f9f65c00c6d173416; output-bytes=11; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: les agents des voies et du conseil sont définis avec un modèle, des outils, un plafond de tours, le contrat de retour en une ligne et la leçon proposée.
  CHECK: node scripts/agents/systeme.mjs agents
  EXPECT: AGENTS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=0a179615dbd91dcb2ebbef03192cc68eb3595cb22cefa375a287847372b283a7; exit=0; EXPECT=matched; output-sha256=11c46f2efa393706185b1cfc4605b8343a29fad4b133058d4168ee9d27ed26cb; output-bytes=10; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: un vrai conseil a tourné sur une vraie décision de la reprise. La transcription contient la question cadrée, le type de décision, 6 regards, au moins 3 revues anonymes avec leur correspondance, et le verdict en 5 parties.
  CHECK: node scripts/agents/systeme.mjs conseil --dernier
  EXPECT: CONSEIL OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=39b2b5c23f905f52e7f550d14cac3a60ce18ade656cd21b3e7dbc2b858d8c26f; exit=0; EXPECT=matched; output-sha256=243dcdd082d343050a1135a2e95a81f6142b2f57610d29b75552397842d20159; output-bytes=67; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G7: une vraie mission en voies parallèles a tourné : au moins une voie Haiku et une voie Sonnet. Chaque voie a rendu une ligne, et ses critères sont rejoués par le pilote sans se fier à son propre rapport.
  CHECK: node scripts/agents/systeme.mjs voies work/missions/2026-10-22-essai-voies --modeles haiku,sonnet
  EXPECT: VOIES OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=8b3bca72d91ca2dea192e3db7ee8fd08522b44603acc6ea08dadaa85f869ee02; exit=0; EXPECT=matched; output-sha256=eb06bac9ab66ab3acd9faf00f33c4d4cbb7b4331ec151257c5afd865765adfce; output-bytes=218; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G8: le plan de reprise du lot 21 est écrit en voies. Les six actions ont chacune une voie (niveau, modèle, plafond, décideur, contrôles), une décision routée et la boucle de retour prévue.
  CHECK: node scripts/agents/systeme.mjs mission work/missions/2026-10-22-reprise-lot21/MISSION.md --min-voies 6
  EXPECT: MISSION OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=2b52dbff1df28f1848ceff4104e7e510f7ffcb7ad48922566c03e17750afd66b; exit=0; EXPECT=matched; output-sha256=c6887ca6a4e6ad824cfccc3a905bf7ba937c5a50b88f6aaf2bf6ffcd797fa271; output-bytes=11; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G9: les imports de CLAUDE.md atteignent une session neuve et un sous-agent. Une session `claude -p` et un sous-agent Haiku citent une leçon sans ouvrir de fichier. Une session `claude -p` reçoit le rappel après une phrase de correction.
  EVIDENCE: 22.10, Claude Code 2.1.302, modèle claude-haiku-5-5, sans outil. (1) `claude -p` a recopié « ### L09 — Vérifier chaque chemin cité dans un brief » et « ### L14 — Confronter les données au savoir du brasseur sur les houblons phares », chargés par CLAUDE.md. (2) Le sous-agent lancé par une session `claude -p` a répondu « SOUS-AGENT : ### L17 — Une voie n'écrit que dans ce qu'elle possède ». (3) Après « Non, c'est toujours pas ce que j'ai demandé », `claude -p` a reçu « Rappel du système (hook cerveau) : ce message ressemble à une… ». Limite : un sous-agent de la session de montage, ouverte avant les imports, répond « ABSENT » (copie de CLAUDE.md prise au démarrage ; écrit dans la doc, Limites connues).

- [x] G10: la doc système (docs/agents/systeme.md) est relue par le pilote. Elle explique les rôles et modèles, la grille de décision, les trois boucles de retour, les plafonds, et ce qui reste au brasseur ou à l'utilisateur, dans le vocabulaire du projet.
  EVIDENCE: 22.10, relue par le pilote après les essais. Sections Pourquoi, Vue d'ensemble, Rôles et modèles, Second cerveau, Leçons, Décider (grille en 5 types, du brasseur à l'utilisateur), Voies (7 étapes, plafonds maxTurns), Corriger (trois boucles), Commandes, Limites connues. Les limites ont été mises à jour avec ce que les essais ont montré : repli general-purpose, copie de CLAUDE.md prise au démarrage, erreurs transitoires du hook, alertes de fidelite à juger.

- [x] G11: commit local sur la branche, sans push ni PR, avec le reste des fichiers hors commit laissé intact.
  EVIDENCE: commit local « Système d'agents : second cerveau, leçons, conseil et voies », sur claude/refonte-houblons-v4, sans push. Laissés hors commit, comme avant : .codex/hooks.json, source4-portable-bundle-manifest-01.json, pistes-l5f.png.
