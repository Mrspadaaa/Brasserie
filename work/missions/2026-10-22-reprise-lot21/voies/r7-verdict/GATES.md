# Gates: voie r7-verdict — verdict sur les cinq candidates de Dryhopper améliorées

OWNS: work/missions/2026-10-22-reprise-lot21/voies/r7-verdict/RESULTAT.md

Scope: une ligne par candidate au format du rejeu, un verdict d'ensemble (satisfaisant ou passe 3), reclassement et greffes ; chaque REJET cite une règle.

- [x] G1: une ligne par candidate et le verdict d'ensemble
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-10-22-reprise-lot21/voies/r7-verdict/RESULTAT.md','utf8'); const m=['a1','b4','d8','e5','g1'].filter(id=>!new RegExp('^- [*][*]'+id+'[*][*].*(REJET|ACCEPT)','m').test(t)); const ok=!m.length && /verdict : (satisfaisant|passe 3)/.test(t); console.log(ok?'VERDICTS OK':'VERDICTS ECHEC '+m.join(', ')); process.exit(ok?0:1)"
  EXPECT: VERDICTS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=e3a8a694e5dfa9813f1a14b9e5e644de724545acdee3b5a934eaa857e1823ba6; exit=0; EXPECT=matched; output-sha256=5c24c0d911f0b6a791aaed740e5554035db5bbcbbdc7aa0e01f619f8460b6eb5; output-bytes=12; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: chaque REJET cite une ligne de DEFAUTS (Dnn) ou la SPEC
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-10-22-reprise-lot21/voies/r7-verdict/RESULTAT.md','utf8'); const r=t.split('\n').filter(l=>/^- [*][*][a-g][0-9][*][*].*REJET/.test(l)); const sans=r.filter(l=>!/D[0-9]{2,3}|SPEC/.test(l)); console.log(sans.length?'REJETS ECHEC':'REJETS OK ('+r.length+')'); process.exit(sans.length?1:0)"
  EXPECT: REJETS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=8b73374c9490a96002cd6b61af7773a0ae8980cf2b62b339a6b885819b3c819c; exit=0; EXPECT=matched; output-sha256=3ab567425809ab3f6ec40e478202859b61c1777adc5991a3782fb31d8041deb0; output-bytes=14; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: reclassement, greffes, phrase prédite et captures
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-reprise-lot21/voies/r7-verdict/RESULTAT.md --contient "## Classement,## Greffes,Phrase prédite,a1-premier-ecran.png,b4-premier-ecran.png,d8-premier-ecran.png,e5-premier-ecran.png,g1-premier-ecran.png,LEÇON PROPOSÉE"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=c974b72546b7f7b825e411d4f884b844fcc13150306496de71e4be5a49408a42; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
