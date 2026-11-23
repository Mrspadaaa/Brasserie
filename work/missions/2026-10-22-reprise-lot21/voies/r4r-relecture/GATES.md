# Gates: voie r4r-relecture — relecture indépendante de la planche « épicé »

OWNS: work/missions/2026-10-22-reprise-lot21/voies/r4r-relecture/RESULTAT.md

Scope: un verdict prouvé sur la planche de r4, captures ouvertes, cinq questions fermées.

- [x] G1: le verdict est rendu au format du relecteur (accepté ou rejeté)
  CHECK: node -e "const l=require('fs').readFileSync('work/missions/2026-10-22-reprise-lot21/voies/r4r-relecture/RESULTAT.md','utf8').split(/\r?\n/)[0]; if (!/^(OK \u2014 accept\u00e9|ECHEC \u2014 rejet\u00e9)/.test(l)) { console.log('ligne 1 : ' + l); process.exit(1); } console.log('VERDICT RENDU')"
  EXPECT: VERDICT RENDU
  EVIDENCE: automatic-evidence=v1; definition-sha256=544ba14558f341fa24eb5515d99ce6728337ccdddfac0b613f4e4be58d1eda48; exit=0; EXPECT=matched; output-sha256=39b5bd3efa43ed61a51edda64aefebc7de4ea1eaff5af9cd195be07bb3a34e00; output-bytes=14; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: le relecteur cite les captures qu'il a ouvertes et traite les leçons
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-reprise-lot21/voies/r4r-relecture/RESULTAT.md --contient "planche-390.png,contexte-390.png,LEÇON PROPOSÉE"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=d044dc269798dece681d0d856caeb8718bd078eb3dd96a23a3ee0c5835d3d0f2; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
