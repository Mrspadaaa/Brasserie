# Gates: phase 1 — besoins réels

OWNS: docs/besoins/**, work/refonte-frontend/**

Scope: corpus des demandes cité mot pour mot, banque de questions complète, parcours clés mesurés à 390 × 844, sans secret ni donnée personnelle.

- [x] G0: ce registre de critères énonce des résultats qui peuvent échouer
  CHECK: node .claude/skills/unlazy/scripts/gate-lint.mjs work/refonte-frontend/GATES-phase1.md
  EXPECT: LINT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=10e5f87f21fb178be846f5e9cefdb95f212e88153d3ffef78b7070b481c4ee7d; exit=0; EXPECT=matched; output-sha256=5a8a20c0b5a759aa7e51db039d2d5646ac9a59fa3a62e384eb76d95779da9d15; output-bytes=456; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G1: chaque citation du corpus est la copie exacte de sa source datée (40 entrées au moins, sections explicite, interprétations et doublons présentes)
  CHECK: node work/refonte-frontend/checks/check-phase1.mjs corpus
  EXPECT: CORPUS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=c63dd163ff9c00a0d50e667ca313b8e912c24d21947391e954b9947667a0aa96; exit=0; EXPECT=matched; output-sha256=9837d861c56d4f27fe30bcb2020457dfb0e4c7b84a8f4cf1eb90de4f098cfc80; output-bytes=14; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: la banque contient les 13 questions imposées et chaque question porte forme de réponse (visible par défaut), à la demande, données et calcul, incertitude, cas, état actuel et sources du corpus
  CHECK: node work/refonte-frontend/checks/check-phase1.mjs banque
  EXPECT: BANQUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=8b85fd5f855ebebcc824fcfc9604bc96b2dbce850465a05f6ad9eef5d54e8d06; exit=0; EXPECT=matched; output-sha256=eed700be7a12c60c206f47ecba12614685b457ca92f3f0e6dd058ca3b37bc85e; output-bytes=13; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: les parcours clés posent l’exigence n° 0 (règles U1 à U7) et citent les valeurs mesurées à 390 × 844 et le résultat de chaque entrée jouée, avec une capture existante
  CHECK: node work/refonte-frontend/checks/check-phase1.mjs parcours
  EXPECT: PARCOURS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=6acb830e7f32bc988fced9e7d4ad825b60c0d54a8653a0b4e42874ad57b24ea3; exit=0; EXPECT=matched; output-sha256=e9b0d05c6d81145e29074a71317bb04d48cd5c79639409986e21758d26050906; output-bytes=14; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: docs/besoins ne contient aucune clé, adresse électronique, IBAN, téléphone ni clé privée
  CHECK: node work/refonte-frontend/checks/check-phase1.mjs secrets
  EXPECT: SECRETS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=27788d8b28605f276f622a6ee7f3e09a04a57eefb43427cf4c04b7e2dbaa2b5d; exit=0; EXPECT=matched; output-sha256=1d1eb9fe06f7a7ad470bc20bdd3c156eebca3bca927e809d21da78da71f2e8a5; output-bytes=11; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: le détecteur de secrets échoue sur un témoin positif
  CHECK: node work/refonte-frontend/checks/check-phase1.mjs secrets --control
  EXPECT: CONTROL OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=4235bbac8a41c13067e19f941ea3061ae92b6f8a9a0458f219b3027bca160647; exit=0; EXPECT=matched; output-sha256=2c86666b128effd4ccee8047a4b876df38cea9788d958cb02b8300230f9eae77; output-bytes=162; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: relecture Opus du corpus et de la banque contre les mots de l'humain : aucune demande explicite des sources 1 et 2 du prompt n'est omise, et chaque interprétation d'agent est marquée comme telle
  EVIDENCE: Opus 17.10 23:10 — source 1 relue ligne à ligne (demandes-utilisateur.md, clarification-creativite.md) : 5 phrases manquantes ajoutées (C157-C161) ; restent hors corpus seulement des consignes de processus caduques (maquettes V2/V3, Sol, Astra, « regarde ça avec opus »). Source 2 : 1 015 citations relues par thème ; 3 ajouts (C162-C164) ; eau, finances et jour de brassage exclus sauf règle générale (limite écrite dans le corpus). Interprétations : section A01-A13 du corpus ; questions anticipées d'agents isolées en fin de banque ; critères du brief rédigés par un agent marqués A09-A10 et maintenus (D10).
