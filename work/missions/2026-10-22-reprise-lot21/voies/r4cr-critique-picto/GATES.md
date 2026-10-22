# Gates: voie r4cr-critique-picto — critique de la planche « épicé » 2

OWNS: work/missions/2026-10-22-reprise-lot21/voies/r4cr-critique-picto/RESULTAT.md

Scope: un verdict prédit du brasseur, prouvé sur les captures ouvertes.

- [x] G1: le verdict est rendu au format du critique (accepté ou rejeté)
  CHECK: node -e "const l=require('fs').readFileSync('work/missions/2026-10-22-reprise-lot21/voies/r4cr-critique-picto/RESULTAT.md','utf8').split(/\r?\n/)[0]; if (!/^(OK|ECHEC) .*(accept|rejet)/.test(l)) { console.log('ligne 1 : ' + l); process.exit(1); } console.log('VERDICT RENDU')"
  EXPECT: VERDICT RENDU
  EVIDENCE: automatic-evidence=v1; definition-sha256=920960de2da3b74f74cd1bc9d27fdbd31b9265e0e582306dc0bebb37b5960283; exit=0; EXPECT=matched; output-sha256=39b5bd3efa43ed61a51edda64aefebc7de4ea1eaff5af9cd195be07bb3a34e00; output-bytes=14; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: le critique cite ce qu'il a jugé et traite les leçons
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-reprise-lot21/voies/r4cr-critique-picto/RESULTAT.md --contient "planche-390.png,contexte-390.png,LEÇON PROPOSÉE"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=b0d4da233c0f664c2e1b3b4b1d82aa6e14af88cbd274f14b0c1259c62a9dcf05; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
