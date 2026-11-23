# Gates: voie r6nc2-critique — défauts restants de r6n1 et r6n2

OWNS: work/missions/2026-10-22-reprise-lot21/voies/r6nc2-critique/RESULTAT.md

Scope: un verdict par maquette au format du rejeu, satisfaisant ou passe 3 ; chaque REJET cite une règle ; sans tri.

- [x] G1: un verdict par maquette, et le verdict d'ensemble
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-10-22-reprise-lot21/voies/r6nc2-critique/RESULTAT.md','utf8'); const m=['r6n1','r6n2'].filter(id=>!new RegExp('^- [*][*]'+id+'[*][*].*(REJET|ACCEPT)','m').test(t)); const ok=!m.length && /verdict : (satisfaisant|passe 3)/.test(t); console.log(ok?'VERDICTS OK':'VERDICTS ECHEC '+m.join(', ')); process.exit(ok?0:1)"
  EXPECT: VERDICTS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=f33d209e260e39dab92a73bcfd5c4146a6de648a2e5328302a17ec5a5edaa451; exit=0; EXPECT=matched; output-sha256=5c24c0d911f0b6a791aaed740e5554035db5bbcbbdc7aa0e01f619f8460b6eb5; output-bytes=12; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: chaque REJET cite une ligne de DEFAUTS (Dnn) ou la SPEC
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-10-22-reprise-lot21/voies/r6nc2-critique/RESULTAT.md','utf8'); const r=t.split('\n').filter(l=>/^- [*][*]r[\w-]+[*][*].*REJET/.test(l)); const sans=r.filter(l=>!/D[0-9]{2,3}|SPEC/.test(l)); console.log(sans.length?'REJETS ECHEC':'REJETS OK ('+r.length+')'); process.exit(sans.length?1:0)"
  EXPECT: REJETS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=8b0d2741cc66ea70404a6c58d46e5e1f6ad97ee5e3560389a32f26712a2c6330; exit=0; EXPECT=matched; output-sha256=3ab567425809ab3f6ec40e478202859b61c1777adc5991a3782fb31d8041deb0; output-bytes=14; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: ni étoile ni classement (L27)
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-10-22-reprise-lot21/voies/r6nc2-critique/RESULTAT.md','utf8'); const ko=/[★☆]|classement|meilleure variante/i.test(t); console.log(ko?'TRI ECHEC':'SANS TRI OK'); process.exit(ko?1:0)"
  EXPECT: SANS TRI OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=b18d95cf17dd8e2cc2086f837eeba0575a2b11a86e04de17fd599349c6c3d839; exit=0; EXPECT=matched; output-sha256=4a78cd70535650055956882b04636e4a0243fd23c193e85b54213f3ce15eecde; output-bytes=12; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: captures citées et phrase prédite
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-reprise-lot21/voies/r6nc2-critique/RESULTAT.md --contient "r6n1-premier-ecran.png,r6n2-premier-ecran.png,Phrase prédite,LEÇON PROPOSÉE"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=32193e385e1b5a2c6a31cb469eb42cf49ea1de739f4d95427e441d0339b3a7bb; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
