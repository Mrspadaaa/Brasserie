# Gates: voie r5-critique-carte — critique de la carte des outils

OWNS: work/missions/2026-10-22-reprise-lot21/voies/r5-critique-carte/RESULTAT.md

Scope: un verdict prédit du brasseur, prouvé sur les captures ouvertes.

- [x] G1: le verdict est rendu au format du critique (accepté ou rejeté)
  CHECK: node -e "const l=require('fs').readFileSync('work/missions/2026-10-22-reprise-lot21/voies/r5-critique-carte/RESULTAT.md','utf8').split(/\r?\n/)[0]; if (!/^(OK|ECHEC) .*(accept|rejet)/.test(l)) { console.log('ligne 1 : ' + l); process.exit(1); } console.log('VERDICT RENDU')"
  EXPECT: VERDICT RENDU
  EVIDENCE: automatic-evidence=v1; definition-sha256=35c504e7fb2f915095a6368ba94368563461826767f345d6963a7347c8b29002; exit=0; EXPECT=matched; output-sha256=39b5bd3efa43ed61a51edda64aefebc7de4ea1eaff5af9cd195be07bb3a34e00; output-bytes=14; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: le critique cite ce qu'il a jugé et traite les leçons
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-reprise-lot21/voies/r5-critique-carte/RESULTAT.md --contient "carte-390.png,comparer-390.png,dryhopper-390.png,LEÇON PROPOSÉE"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=589b1abc5d62c8d89399ff48b08de9524408d3e48dacd90d7b79b007c791dfe9; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
