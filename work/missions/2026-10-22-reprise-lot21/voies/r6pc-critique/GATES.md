# Gates: voie r6pc-critique — défauts vérifiables des variantes de r6n2

OWNS: work/missions/2026-10-22-reprise-lot21/voies/r6pc-critique/RESULTAT.md

Scope: une ligne par variante au format du rejeu ; chaque REJET cite une règle ; sans tri ni étoile.

- [x] G1: une ligne par variante
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-10-22-reprise-lot21/voies/r6pc-critique/RESULTAT.md','utf8'); const m=['r6p1','r6p2','r6p3','r6p4'].filter(id=>!new RegExp('^- [*][*]'+id+'[*][*].*(REJET|ACCEPT)','m').test(t)); console.log(m.length?'VERDICTS ECHEC '+m.join(', '):'VERDICTS OK'); process.exit(m.length?1:0)"
  EXPECT: VERDICTS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=f3ab2cf2062dceb1613406e737750cc3ad3105ac0eeede9e515a281b37ee3090; exit=0; EXPECT=matched; output-sha256=5c24c0d911f0b6a791aaed740e5554035db5bbcbbdc7aa0e01f619f8460b6eb5; output-bytes=12; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: chaque REJET cite une ligne de DEFAUTS (Dnn) ou la SPEC
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-10-22-reprise-lot21/voies/r6pc-critique/RESULTAT.md','utf8'); const r=t.split('\n').filter(l=>/^- [*][*]r[\w-]+[*][*].*REJET/.test(l)); const sans=r.filter(l=>!/D[0-9]{2,3}|SPEC/.test(l)); console.log(sans.length?'REJETS ECHEC':'REJETS OK ('+r.length+')'); process.exit(sans.length?1:0)"
  EXPECT: REJETS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=63ea744ef922e8d48030f8645c9647d7a0093e98bac00a00a1d10b5e794c62a0; exit=0; EXPECT=matched; output-sha256=1b24fa524641dd4c1931c74592f4a927b4d48a3effe87dbc036b2d539395f749; output-bytes=14; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: ni étoile ni classement (L27)
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-10-22-reprise-lot21/voies/r6pc-critique/RESULTAT.md','utf8'); const ko=/[★☆]|classement|meilleure variante/i.test(t); console.log(ko?'TRI ECHEC':'SANS TRI OK'); process.exit(ko?1:0)"
  EXPECT: SANS TRI OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=99c0499fc4847986278bf1c100de05faa390f571da0375ddba20c7487288fdab; exit=0; EXPECT=matched; output-sha256=4a78cd70535650055956882b04636e4a0243fd23c193e85b54213f3ce15eecde; output-bytes=12; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: captures citées et phrases prédites
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-reprise-lot21/voies/r6pc-critique/RESULTAT.md --contient "r6p1-premier-ecran.png,r6p2-premier-ecran.png,r6p3-premier-ecran.png,r6p4-premier-ecran.png,Phrase prédite,LEÇON PROPOSÉE"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=358b9403b5f5d372eefa6dff6a8cb5554d6138d178bb6e01cdafa5e67b4e8121; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
