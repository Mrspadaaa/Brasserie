# Gates: voie o1-outils — quatre corrections d'outils avec témoins

OWNS: work/missions/2026-10-31-ecran-identite/voies/o1-outils/

Scope: écrit par le pilote le 31.10, après coup : la voie a été rendue sans GATES. Les critères rejouent ce qui doit tenir encore.

- [x] G1: les témoins des contrôles échouent toujours sur leurs pages
  CHECK: node scripts/agents/systeme.mjs temoins
  EXPECT: TEMOINS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=1eb6e5d347a145baa08fdc3f609ab02c9fc05a91fd07b0a610b551cac1c25510; exit=0; EXPECT=matched; output-sha256=b74f9f9ac6d0ce083a94e8d5168507e7eed366deb8148dc2e7edcea9d9c8818a; output-bytes=5726; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: le résultat dit les quatre corrections et leurs témoins
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-31-ecran-identite/voies/o1-outils/RESULTAT.md --contient "quatre corrections d'outils,témoins rouges puis verts"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=a07cef462e58080e38fa88837d69380d85c4d93023e83f2b83acad03fde28eec; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
