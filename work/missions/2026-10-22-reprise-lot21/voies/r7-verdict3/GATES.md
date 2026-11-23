# Gates: voie r7-verdict3 — verdict après la passe 3 de Dryhopper

OWNS: work/missions/2026-10-22-reprise-lot21/voies/r7-verdict3/RESULTAT.md

Scope: une ligne par candidate au format du rejeu et un verdict d'ensemble ; chaque REJET cite une règle.

- [x] G1: une ligne par candidate et le verdict d'ensemble
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-10-22-reprise-lot21/voies/r7-verdict3/RESULTAT.md','utf8'); const m=['a1','b4','d8','e5'].filter(id=>!new RegExp('^- [*][*]'+id+'[*][*].*(REJET|ACCEPT)','m').test(t)); const ok=!m.length && /verdict : (satisfaisant|passe 4)/.test(t); console.log(ok?'VERDICTS OK':'VERDICTS ECHEC '+m.join(', ')); process.exit(ok?0:1)"
  EXPECT: VERDICTS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=ec4c2182b76e7b439230e9f85f76bd18d6ee52d20ee03ab5e6bd0ecaa1d97e32; exit=0; EXPECT=matched; output-sha256=5c24c0d911f0b6a791aaed740e5554035db5bbcbbdc7aa0e01f619f8460b6eb5; output-bytes=12; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: chaque REJET cite une ligne de DEFAUTS (Dnn) ou la SPEC
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-10-22-reprise-lot21/voies/r7-verdict3/RESULTAT.md','utf8'); const r=t.split('\n').filter(l=>/^- [*][*][a-g][0-9][*][*].*REJET/.test(l)); const sans=r.filter(l=>!/D[0-9]{2,3}|SPEC/.test(l)); console.log(sans.length?'REJETS ECHEC':'REJETS OK ('+r.length+')'); process.exit(sans.length?1:0)"
  EXPECT: REJETS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=024585b5a75490b2c1009d9ecd59a851df38908310fed5c0364021398e1771da; exit=0; EXPECT=matched; output-sha256=3ab567425809ab3f6ec40e478202859b61c1777adc5991a3782fb31d8041deb0; output-bytes=14; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: captures et phrase prédite
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-reprise-lot21/voies/r7-verdict3/RESULTAT.md --contient "a1-premier-ecran.png,b4-premier-ecran.png,d8-premier-ecran.png,e5-premier-ecran.png,Phrase prédite,LEÇON PROPOSÉE"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=9adb0be99b2728794690fc0ec15f8347979028349b2a9de3fe210498c61fd8bd; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
