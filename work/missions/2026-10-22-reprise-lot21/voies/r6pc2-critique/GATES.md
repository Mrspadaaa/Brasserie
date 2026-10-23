# Gates: voie r6pc2-critique — contre-visite de r6p2

OWNS: work/missions/2026-10-22-reprise-lot21/voies/r6pc2-critique/RESULTAT.md

Scope: un verdict sur r6p2 au format du rejeu, captures de l'état corrigé ouvertes.

- [x] G1: un verdict sur r6p2 au format du rejeu
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-10-22-reprise-lot21/voies/r6pc2-critique/RESULTAT.md','utf8'); const ok=/^- [*][*]r6p2[*][*].*(REJET|ACCEPT)/m.test(t); console.log(ok?'VERDICT OK':'VERDICT ECHEC'); process.exit(ok?0:1)"
  EXPECT: VERDICT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=1ca723dc4762a9b9106d4f467dcbde58ab0b3d8b107a8665bc945f22bec21a4e; exit=0; EXPECT=matched; output-sha256=fdc23e3115b4a4756f2a73adc6e55f1a9da51c1d2b6fd6f22da332877154b3a7; output-bytes=11; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: les captures de l'état corrigé sont citées
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-reprise-lot21/voies/r6pc2-critique/RESULTAT.md --contient "r6p2-resineux-390.png,r6p2-premier-ecran.png,LEÇON PROPOSÉE"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=90e386a987c1e76da22bf305d3574847e9b58fd5636ba6311e8f8f67db9be0cd; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
