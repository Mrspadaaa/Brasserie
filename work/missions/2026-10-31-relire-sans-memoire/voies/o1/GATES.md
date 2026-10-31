# Gates: voie o1 — contrôles comprendre, revue et ecarts

OWNS: scripts/agents/systeme.mjs, work/missions/2026-10-31-relire-sans-memoire/voies/o1/

Scope: les trois sous-commandes de relecture sans mémoire, leurs témoins et un essai réel sur les docs des finances.

- [x] G1: les témoins internes passent, nouveaux cas compris
  CHECK: node scripts/agents/systeme.mjs temoins
  EXPECT: TEMOINS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=1eb6e5d347a145baa08fdc3f609ab02c9fc05a91fd07b0a610b551cac1c25510; exit=0; EXPECT=matched; output-sha256=b74f9f9ac6d0ce083a94e8d5168507e7eed366deb8148dc2e7edcea9d9c8818a; output-bytes=5726; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: comprendre accepte une compréhension complète et dans le périmètre
  CHECK: node scripts/agents/systeme.mjs comprendre work/missions/2026-10-31-relire-sans-memoire/voies/o1/temoins/comprendre-bon
  EXPECT: COMPRIS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=3276f056fcf913c2ff8dd2b2870c502e21d9a72d93f7d1725721078359988f82; exit=0; EXPECT=matched; output-sha256=5c9c088c500bd1120201de82cf64a8d38adbff986d35f86675f46d825b862789; output-bytes=22; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: comprendre refuse un chemin hors du périmètre
  CHECK: node scripts/agents/systeme.mjs echoue "COMPRIS ECHEC" -- node scripts/agents/systeme.mjs comprendre work/missions/2026-10-31-relire-sans-memoire/voies/o1/temoins/comprendre-hors
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=5a1bf6caa4cdd59bcfc49355ef20c042ecaaa1c3a5cb0c233c5c3476ced0ef73; exit=0; EXPECT=matched; output-sha256=cd9897754531dbb95a0ff56217fd0d0af1784917d13317183f591b6e3a643961; output-bytes=34; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: revue accepte une revue complète
  CHECK: node scripts/agents/systeme.mjs revue work/missions/2026-10-31-relire-sans-memoire/voies/o1/temoins/revue-bonne.md
  EXPECT: REVUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=7cc1725a01b769f0c43a934c1d6d55d692a0cf7e22ceab1df8deb53436b69a9a; exit=0; EXPECT=matched; output-sha256=d15288d446803a1c1fbd61eec7520c80a7a3e5a51417d5deb78bd7e128cbedaf; output-bytes=43; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: revue refuse un bloquant accepté
  CHECK: node scripts/agents/systeme.mjs echoue "REVUE ECHEC" -- node scripts/agents/systeme.mjs revue work/missions/2026-10-31-relire-sans-memoire/voies/o1/temoins/revue-bloquant-accepte.md
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=fe632c39f6bef14dadb25b5e45b62fcfc738d03b9bb12a25d4e32a80a27d411e; exit=0; EXPECT=matched; output-sha256=16012606e5831957f6e80bea508cf867a3af4685c494588c591b424018c893c4; output-bytes=32; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: ecarts accepte un document juste
  CHECK: node scripts/agents/systeme.mjs ecarts work/missions/2026-10-31-relire-sans-memoire/voies/o1/temoins/ecarts-bon.md
  EXPECT: ECARTS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=b25e54d649834d4c648c67de27d062b68e182b030c29865c7bca8d4a864bf90d; exit=0; EXPECT=matched; output-sha256=a240155f9e71c8700006a61a568d07c7e549a20df87162d88d832e5fa08d6ad1; output-bytes=171; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G7: ecarts refuse un chemin absent, une ligne au-delà de la fin et un identifiant inconnu
  CHECK: node scripts/agents/systeme.mjs echoue "ECARTS ECHEC" -- node scripts/agents/systeme.mjs ecarts work/missions/2026-10-31-relire-sans-memoire/voies/o1/temoins/ecarts-faux.md
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=22c89f14ae17e593424ac37977b2f16614710a6e2436c00cbefca5eefbd98c6d; exit=0; EXPECT=matched; output-sha256=8e1dc7a4cafe17b4c3cb9f4914fae58fe7405a2aa49fb74a41972f80e67aa64d; output-bytes=33; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G8: le rapport chiffre l'essai réel et ses faux positifs
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-31-relire-sans-memoire/voies/o1/RESULTAT.md --contient "docs/finances.md,docs/gemini-budget.md,faux positif,invoice-v3"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=e9e459dbb4c8709cef69305f6c14eadcc9b7199d6e9cd446f51f1cc506314071; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
