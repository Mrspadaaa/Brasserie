# Gates: voie r7-tri — tri des 56 concepts de Dryhopper

OWNS: work/refonte-frontend/v4/ecran-1/fils23-dryhopper/tri/**, work/missions/2026-10-22-reprise-lot21/voies/r7-tri/RESULTAT.md

Scope: un fichier par série, une SYNTHESE en trois sections (Classement, Candidates, Greffes) ; 5 candidates, une par approche, chacune existante ; aucun REJET.

- [x] G1: la SYNTHESE a ses trois sections
  CHECK: node scripts/agents/systeme.mjs note work/refonte-frontend/v4/ecran-1/fils23-dryhopper/tri/SYNTHESE.md --contient "## Classement,## Candidates,## Greffes"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=29b5300e07cd06f156ef5b3722852867c14a1afd267b7a67fd66e904d9879ef7; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: 5 candidates au format, de 5 séries différentes, chacune existante
  CHECK: node -e "const fs=require('fs'); const t=fs.readFileSync('work/refonte-frontend/v4/ecran-1/fils23-dryhopper/tri/SYNTHESE.md','utf8'); const c=[...t.matchAll(/^- [*][*]([a-g][0-9])[*][*] [(]s.rie ([A-G]),.*CANDIDATE/gim)]; const s=new Set(c.map(m=>m[2].toUpperCase())); const manque=c.map(m=>m[1]).filter(id=>!fs.existsSync('work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-'+id[0]+'/'+id+'/etat.html')); const ok=c.length===5 && s.size===5 && !manque.length; console.log(ok?'SYNTHESE OK (5 candidates, 5 series)':'SYNTHESE ECHEC '+c.length+' candidates, '+s.size+' series, absentes : '+manque.join(' ')); process.exit(ok?0:1)"
  EXPECT: SYNTHESE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=7b9fce384ef04b3be437abcf48e919f22892de8f65a99ebd609cd534974b8528; exit=0; EXPECT=matched; output-sha256=1a80eca250e0c36b002ddec3884bff676c5e61f3827f314616cd7cd1c3e3b797; output-bytes=37; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: aucun REJET, un fichier par série
  CHECK: node -e "const fs=require('fs'); const f=['SYNTHESE','serie-a','serie-b','serie-c','serie-d','serie-e','serie-f','serie-g'].map(n=>'work/refonte-frontend/v4/ecran-1/fils23-dryhopper/tri/'+n+'.md'); const absents=f.filter(x=>!fs.existsSync(x)); const rejet=f.filter(x=>fs.existsSync(x) && /REJET/.test(fs.readFileSync(x,'utf8'))); const ok=!absents.length && !rejet.length; console.log(ok?'TRI OK':'TRI ECHEC absents '+absents.join(' ')+' rejets '+rejet.join(' ')); process.exit(ok?0:1)"
  EXPECT: TRI OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=a9bff0c110cedfed89f6760e4042c55ccd989e6c2aa015649788f10e2e2d1b52; exit=0; EXPECT=matched; output-sha256=dd52eb7a741f578cc81e164c8b960e985c5b008a988a6edb67b6837fdb5de4ec; output-bytes=7; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: le rapport cite les captures ouvertes des sept séries
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-reprise-lot21/voies/r7-tri/RESULTAT.md --contient "a1-390.png,b1-390.png,c1-390.png,d1-390.png,e1-390.png,f1-390.png,g1-390.png,LEÇON PROPOSÉE"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=3a3cdfad44f5e8907ab9c775e1ace5f76178c365d6c4b7ea8c3e43af112e0faf; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries
