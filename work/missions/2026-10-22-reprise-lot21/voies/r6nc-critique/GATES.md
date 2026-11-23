# Gates: voie r6nc-critique — défauts vérifiables de r6n1 et r6n2

OWNS: work/missions/2026-10-22-reprise-lot21/voies/r6nc-critique/RESULTAT.md

Scope: un verdict par maquette de reprise (r6n1, r6n2), au format lu par le rejeu ; aucun tri ni étoile ; chaque REJET cite une ligne de DEFAUTS ou la SPEC.

- [x] G1: un verdict par maquette, au format du rejeu
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-10-22-reprise-lot21/voies/r6nc-critique/RESULTAT.md','utf8'); const m=['r6n1','r6n2'].filter(id=>!new RegExp('^- [*][*]'+id+'[*][*].*(REJET|ACCEPT)','m').test(t)); console.log(m.length?'VERDICTS ECHEC '+m.join(', '):'VERDICTS OK'); process.exit(m.length?1:0)"
  EXPECT: VERDICTS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=791f36c34dbb0d5ceb32ceb48a1660faeb78d9fe99176c47e66ed14dbd1d95d7; exit=0; EXPECT=matched; output-sha256=5c24c0d911f0b6a791aaed740e5554035db5bbcbbdc7aa0e01f619f8460b6eb5; output-bytes=12; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: chaque REJET cite une ligne de DEFAUTS (Dnn) ou la SPEC
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-10-22-reprise-lot21/voies/r6nc-critique/RESULTAT.md','utf8'); const r=t.split('\n').filter(l=>/^- [*][*]r[\w-]+[*][*].*REJET/.test(l)); const sans=r.filter(l=>!/D[0-9]{2,3}|SPEC/.test(l)); console.log(sans.length?'REJETS ECHEC '+sans.length+' sans règle citée':'REJETS OK ('+r.length+')'); process.exit(sans.length?1:0)"
  EXPECT: REJETS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=836b93879b90a9967a8efbb7853d5ceea2f062eacbd244a954ea809ef7aee7ab; exit=0; EXPECT=matched; output-sha256=3ab567425809ab3f6ec40e478202859b61c1777adc5991a3782fb31d8041deb0; output-bytes=14; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: ni étoile ni classement (L27)
  CHECK: node -e "const t=require('fs').readFileSync('work/missions/2026-10-22-reprise-lot21/voies/r6nc-critique/RESULTAT.md','utf8'); const ko=/[★☆]|classement|meilleure variante/i.test(t); console.log(ko?'TRI ECHEC':'SANS TRI OK'); process.exit(ko?1:0)"
  EXPECT: SANS TRI OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=f5cfe0b7eecf7a265155f14980a6728ce96faa91b6944d939d3f7d7aed97c295; exit=0; EXPECT=matched; output-sha256=4a78cd70535650055956882b04636e4a0243fd23c193e85b54213f3ce15eecde; output-bytes=12; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: les captures sont ouvertes et citées
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-reprise-lot21/voies/r6nc-critique/RESULTAT.md --contient "r6n1-premier-ecran.png,r6n2-premier-ecran.png,r6a-premier-ecran.png,r6n1-toucher-390.png,r6n2-toucher-390.png,LEÇON PROPOSÉE"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=2c08cd5a8fbf8075b15d08597530550f766746a1d837d57c9eb8ad7c5927c843; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
