# Gates: phase 2 — ce qui s'est perdu (#116)

OWNS: docs/qualite/ce-qui-s-est-perdu.md, docs/qualite/captures/**, work/refonte-frontend/**

Scope: matrice question × version jouée et regardée, liste de ce qui a disparu avec son fichier d'archive, ce que le backend permet de récupérer, état de la production.

- [x] G0: ce registre de critères énonce des résultats qui peuvent échouer
  CHECK: node .claude/skills/unlazy/scripts/gate-lint.mjs work/refonte-frontend/GATES-phase2.md
  EXPECT: LINT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=227523561ea35132d4d89f7df45217ca70995d132b236215df30ca5c6c85474e; exit=0; EXPECT=matched; output-sha256=325c3f765ba025c207e3853930cf8dd91906591cb538be23381712b15980701b; output-bytes=495; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G1: la matrice couvre Q01 à Q30 sur les 9 colonnes (V1 à V5.5 et App), chaque cellule vaut R, P ou A, et la colonne App concorde avec l'état actuel noté dans la banque
  CHECK: node work/refonte-frontend/checks/check-phase2.mjs matrice
  EXPECT: MATRICE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=0438967b07b940cab91bf6b77cac95105e7d32d12f1ac0be412aa6554c626b41; exit=0; EXPECT=matched; output-sha256=6cfe41b0aedfba680ded08e0bd3564ca5fbb8c5bb82dce470a2dcbd75dd2e499; output-bytes=14; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: le contrôle de la matrice échoue sur un témoin faux (cellule hors code, colonne App contraire à la banque)
  CHECK: node work/refonte-frontend/checks/check-phase2.mjs matrice --control
  EXPECT: CONTROL OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=246cfeb065f1442967863cbc48f10ae3190117cc0ac6167eaa4edcd48ec11c77; exit=0; EXPECT=matched; output-sha256=644ca376b67cf45804b571a68e882cc825bb677774cd133e6346dd75d1cf8bf8; output-bytes=897; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: chaque colonne a une capture existante et une description de ce que la capture montre
  CHECK: node work/refonte-frontend/checks/check-phase2.mjs captures
  EXPECT: CAPTURES OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=0fcafb02840a932213750f7d15d3bcbcd8fd0132a67d0edab91d71038ad9c8d7; exit=0; EXPECT=matched; output-sha256=2e17778f3655940b4e65a43d1123d8eb444bbe415c501d05359a410e82b00f17; output-bytes=15; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: au moins 5 pertes, chacune avec un fichier d'archive qui existe sur disque
  CHECK: node work/refonte-frontend/checks/check-phase2.mjs pertes
  EXPECT: PERTES OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=d34f6011b19d54fb733c3e0a8f9c7ac41edcf6dcc4fc26096dbd6725e446b9b2; exit=0; EXPECT=matched; output-sha256=4a7340aaf530cbd5f0185056517fc5eabda6127692cdcade93f831eb324bcade; output-bytes=12; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: la section backend cite au moins 6 fichiers du dépôt, tous présents
  CHECK: node work/refonte-frontend/checks/check-phase2.mjs backend
  EXPECT: BACKEND OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=a79a8fca980a373400f6e00a23c205759ec3b797447460a586ebb6badcf9f01d; exit=0; EXPECT=matched; output-sha256=97d908802612250e747ed83854f25263f9a24992cd9967b9f47a0c2380cf9f55; output-bytes=14; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: docs/qualite ne contient aucune clé, adresse électronique, IBAN, téléphone ni clé privée
  CHECK: node work/refonte-frontend/checks/check-phase2.mjs secrets
  EXPECT: SECRETS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=1078b7bee18bc0e51d633131176c7d0f9cddad1dfa19ebef26a283b5d40e8d8e; exit=0; EXPECT=matched; output-sha256=1d1eb9fe06f7a7ad470bc20bdd3c156eebca3bca927e809d21da78da71f2e8a5; output-bytes=11; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G7: relecture Opus : chaque capture citée a été regardée ; les cellules R de la matrice pour les questions clés (Q01, Q02, Q03, Q04, Q05) sont vérifiées en rendu ou par le code de la maquette, pas seulement par le rapport de l'agent
  EVIDENCE: Opus 18.10 00:40 — 4 planches de 17 captures 390 regardées (phase2/planches/p1-p4), planche V5.5 stout (explorer, comparaison, Nugget), app 390 et 1280 regardées. Seule cellule R parmi Q01-Q05 : Q05 V5.5, jouée dans le navigateur (gains floral +2,9, épice +2,4, herbe +2,2 ; 41,63 g ; 785 mots). Q24 R de V2-1 jouée (« libre 40 g · besoin de la copie 12 g · couvert »). Q01-Q04 : aucune cellule R. Backend : 4 affirmations de l'agent vérifiées, 1 fausse corrigée (tags Beer Maverick reproductibles : 164 tags, pine 58).
