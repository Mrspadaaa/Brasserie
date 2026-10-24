# Gates: voie r6r-critique-lot22 — critique du lot 22 (Comparer, 12 variantes)

OWNS: work/missions/2026-10-22-reprise-lot21/voies/r6r-critique-lot22/RESULTAT.md

Scope: un verdict prédit du brasseur, prouvé sur les captures ouvertes.

- [x] G1: le verdict est rendu au format du critique (accepté ou rejeté)
  CHECK: node -e "const l=require('fs').readFileSync('work/missions/2026-10-22-reprise-lot21/voies/r6r-critique-lot22/RESULTAT.md','utf8').split(/\r?\n/)[0]; if (!/^(OK|ECHEC) .*(accept|rejet)/.test(l)) { console.log('ligne 1 : ' + l); process.exit(1); } console.log('VERDICT RENDU')"
  EXPECT: VERDICT RENDU
  EVIDENCE: automatic-evidence=v1; definition-sha256=6f9358c2c4bf9bfb1715dabd50e8fcbbb2274abbcee444b3bc423eca91f0d9e9; exit=0; EXPECT=matched; output-sha256=39b5bd3efa43ed61a51edda64aefebc7de4ea1eaff5af9cd195be07bb3a34e00; output-bytes=14; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: le critique cite ce qu'il a jugé et traite les leçons
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-reprise-lot21/voies/r6r-critique-lot22/RESULTAT.md --contient "r6a,r6b,r6c,r6d,r6f,r6g,r6h,r6i,r6j,r6k,r6l,r6m,★,LEÇON PROPOSÉE"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=16807f727fb4285e31f90d9bad20e8c864c85cb9afd8ab001c316de98102d024; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
